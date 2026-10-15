import type { Account, JournalEntry, LedgerStore, PostResult } from "./types.js";
import type { MinorUnits } from "./money.js";

/** In-memory store for tests and local development. Not for production. */
export class InMemoryLedgerStore implements LedgerStore {
  private readonly accounts = new Map<string, Account>();
  private readonly accountsByCode = new Map<string, Account>();
  private readonly entries: JournalEntry[] = [];
  private readonly entriesByKey = new Map<string, JournalEntry>();
  private readonly balances = new Map<string, MinorUnits>();

  async createAccount(account: Account): Promise<void> {
    if (this.accountsByCode.has(account.code)) throw new Error(`duplicate account code ${account.code}`);
    this.accounts.set(account.id, account);
    this.accountsByCode.set(account.code, account);
    this.balances.set(account.id, 0);
  }
  async getAccount(id: string): Promise<Account | undefined> {
    return this.accounts.get(id);
  }
  async getAccountByCode(code: string): Promise<Account | undefined> {
    return this.accountsByCode.get(code);
  }
  async listAccounts(filter?: { tenantId?: string }): Promise<Account[]> {
    const all = [...this.accounts.values()];
    return filter?.tenantId ? all.filter((a) => a.tenantId === filter.tenantId) : all;
  }
  async postEntry(entry: JournalEntry): Promise<PostResult> {
    const prior = this.entriesByKey.get(entry.idempotencyKey);
    if (prior) return { entry: prior, created: false };
    // All-or-nothing: validate every account exists before mutating.
    for (const p of entry.postings) {
      if (!this.accounts.has(p.accountId)) throw new Error(`unknown account ${p.accountId}`);
    }
    for (const p of entry.postings) {
      this.balances.set(p.accountId, (this.balances.get(p.accountId) ?? 0) + p.amount);
    }
    this.entries.push(entry);
    this.entriesByKey.set(entry.idempotencyKey, entry);
    return { entry, created: true };
  }
  async getEntryByIdempotencyKey(key: string): Promise<JournalEntry | undefined> {
    return this.entriesByKey.get(key);
  }
  async listEntries(filter?: { accountId?: string; limit?: number }): Promise<JournalEntry[]> {
    let out = [...this.entries].reverse();
    if (filter?.accountId) out = out.filter((e) => e.postings.some((p) => p.accountId === filter.accountId));
    if (filter?.limit) out = out.slice(0, filter.limit);
    return out;
  }
  async getBalance(accountId: string): Promise<MinorUnits> {
    return this.balances.get(accountId) ?? 0;
  }
}
