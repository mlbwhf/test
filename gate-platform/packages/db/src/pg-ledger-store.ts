import type { Account, JournalEntry, LedgerStore, MinorUnits, PostResult } from "@gate/ledger";
import type { Pool } from "./pool.js";

interface AccountRow { id: string; code: string; name: string; type: Account["type"]; currency: string; tenant_id: string; metadata: Record<string, string> | null; created_at: Date }
interface EntryRow { id: string; idempotency_key: string; currency: string; description: string; effective_at: Date; recorded_at: Date; metadata: Record<string, string> | null; postings: Array<{ account_id: string; amount: number }> }

const ENTRY_SELECT = `
  SELECT e.*, COALESCE(json_agg(json_build_object('account_id', p.account_id, 'amount', p.amount) ORDER BY p.id)
         FILTER (WHERE p.id IS NOT NULL), '[]') AS postings
    FROM ledger_entries e LEFT JOIN ledger_postings p ON p.entry_id = e.id`;

function toAccount(r: AccountRow): Account {
  return { id: r.id, code: r.code, name: r.name, type: r.type, currency: r.currency, tenantId: r.tenant_id, createdAt: r.created_at, ...(r.metadata ? { metadata: r.metadata } : {}) };
}
function toEntry(r: EntryRow): JournalEntry {
  return {
    id: r.id, idempotencyKey: r.idempotency_key, currency: r.currency, description: r.description,
    effectiveAt: r.effective_at, recordedAt: r.recorded_at,
    postings: r.postings.map((p) => ({ accountId: p.account_id, amount: Number(p.amount) })),
    ...(r.metadata ? { metadata: r.metadata } : {}),
  };
}

export class PostgresLedgerStore implements LedgerStore {
  constructor(private readonly pool: Pool) {}

  async createAccount(a: Account): Promise<void> {
    await this.pool.query(
      `INSERT INTO ledger_accounts (id, code, name, type, currency, tenant_id, metadata, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [a.id, a.code, a.name, a.type, a.currency, a.tenantId, a.metadata ?? null, a.createdAt],
    );
  }
  async getAccount(id: string): Promise<Account | undefined> {
    const r = await this.pool.query<AccountRow>(`SELECT * FROM ledger_accounts WHERE id = $1`, [id]);
    return r.rows[0] ? toAccount(r.rows[0]) : undefined;
  }
  async getAccountByCode(code: string): Promise<Account | undefined> {
    const r = await this.pool.query<AccountRow>(`SELECT * FROM ledger_accounts WHERE code = $1`, [code]);
    return r.rows[0] ? toAccount(r.rows[0]) : undefined;
  }
  async listAccounts(filter?: { tenantId?: string }): Promise<Account[]> {
    const r = filter?.tenantId
      ? await this.pool.query<AccountRow>(`SELECT * FROM ledger_accounts WHERE tenant_id = $1 ORDER BY code`, [filter.tenantId])
      : await this.pool.query<AccountRow>(`SELECT * FROM ledger_accounts ORDER BY code`);
    return r.rows.map(toAccount);
  }

  async postEntry(entry: JournalEntry): Promise<PostResult> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const ins = await client.query<{ id: string }>(
        `INSERT INTO ledger_entries (id, idempotency_key, currency, description, effective_at, recorded_at, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
        [entry.id, entry.idempotencyKey, entry.currency, entry.description, entry.effectiveAt, entry.recordedAt, entry.metadata ?? null],
      );
      if (ins.rowCount === 0) {
        await client.query("ROLLBACK");
        const existing = await this.getEntryByIdempotencyKey(entry.idempotencyKey);
        if (!existing) throw new Error("idempotency race: entry vanished");
        return { entry: existing, created: false };
      }
      for (const p of entry.postings) {
        await client.query(`INSERT INTO ledger_postings (entry_id, account_id, amount) VALUES ($1,$2,$3)`, [entry.id, p.accountId, p.amount]);
      }
      await client.query("COMMIT"); // deferred trigger enforces balance here
      return { entry, created: true };
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }

  async getEntryByIdempotencyKey(key: string): Promise<JournalEntry | undefined> {
    const r = await this.pool.query<EntryRow>(`${ENTRY_SELECT} WHERE e.idempotency_key = $1 GROUP BY e.id`, [key]);
    return r.rows[0] ? toEntry(r.rows[0]) : undefined;
  }

  async listEntries(filter?: { accountId?: string; limit?: number }): Promise<JournalEntry[]> {
    const limit = filter?.limit ?? 100;
    const r = filter?.accountId
      ? await this.pool.query<EntryRow>(
          `${ENTRY_SELECT} WHERE e.id IN (SELECT entry_id FROM ledger_postings WHERE account_id = $1) GROUP BY e.id ORDER BY e.recorded_at DESC, e.id DESC LIMIT $2`,
          [filter.accountId, limit],
        )
      : await this.pool.query<EntryRow>(`${ENTRY_SELECT} GROUP BY e.id ORDER BY e.recorded_at DESC, e.id DESC LIMIT $1`, [limit]);
    return r.rows.map(toEntry);
  }

  async getBalance(accountId: string): Promise<MinorUnits> {
    const r = await this.pool.query<{ sum: number | null }>(`SELECT SUM(amount)::bigint AS sum FROM ledger_postings WHERE account_id = $1`, [accountId]);
    return Number(r.rows[0]?.sum ?? 0);
  }
}
