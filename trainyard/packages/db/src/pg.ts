// Postgres persistence. One row per workspace in workspace_state; the audit log is an
// append-only table. Migrations run on start and are recorded in schema_migrations.

import pg from "pg";
import { StaleWriteError, type AuditEntry, type Snapshot, type StatePersistence } from "./persistence.js";

const MIGRATIONS: { name: string; sql: string }[] = [
  {
    name: "001_state",
    sql: `
      create table if not exists workspace_state (
        id text primary key,
        version integer not null,
        state jsonb not null,
        updated_at timestamptz not null default now()
      );
      create table if not exists audit_log (
        seq bigserial primary key,
        workspace_id text not null,
        at timestamptz not null,
        actor text not null,
        action text not null,
        detail jsonb
      );
      create index if not exists audit_log_workspace_idx on audit_log (workspace_id, seq desc);
      -- Appends only: the log is evidence, so no path may change or remove a row.
      create or replace function audit_log_readonly() returns trigger language plpgsql as $$
      begin raise exception 'audit_log is append-only'; end $$;
      drop trigger if exists audit_log_no_update on audit_log;
      create trigger audit_log_no_update before update or delete on audit_log
        for each row execute function audit_log_readonly();
    `,
  },
];

export function createPool(connectionString: string): pg.Pool {
  return new pg.Pool({ connectionString, max: 10 });
}

export async function migrate(pool: pg.Pool): Promise<string[]> {
  const client = await pool.connect();
  const applied: string[] = [];
  try {
    await client.query("create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())");
    await client.query("select pg_advisory_lock(7241001)");
    try {
      const done = new Set((await client.query<{ name: string }>("select name from schema_migrations")).rows.map((r) => r.name));
      for (const m of MIGRATIONS) {
        if (done.has(m.name)) continue;
        await client.query("begin");
        try {
          await client.query(m.sql);
          await client.query("insert into schema_migrations (name) values ($1)", [m.name]);
          await client.query("commit");
          applied.push(m.name);
        } catch (e) {
          await client.query("rollback");
          throw e;
        }
      }
    } finally {
      await client.query("select pg_advisory_unlock(7241001)");
    }
  } finally {
    client.release();
  }
  return applied;
}

export class PgPersistence<T = unknown> implements StatePersistence<T> {
  readonly kind = "postgres" as const;

  constructor(private readonly pool: pg.Pool) {}

  async load(id: string): Promise<Snapshot<T> | null> {
    const r = await this.pool.query<{ version: number; state: T; updated_at: Date }>("select version, state, updated_at from workspace_state where id = $1", [id]);
    const row = r.rows[0];
    return row ? { state: row.state, version: row.version, updatedAt: row.updated_at.toISOString() } : null;
  }

  async save(id: string, state: T, expectedVersion: number): Promise<number> {
    const json = JSON.stringify(state);
    if (expectedVersion === 0) {
      const r = await this.pool.query<{ version: number }>(
        "insert into workspace_state (id, version, state) values ($1, 1, $2::jsonb) on conflict (id) do nothing returning version",
        [id, json],
      );
      if (r.rowCount) return 1;
    } else {
      const r = await this.pool.query<{ version: number }>(
        "update workspace_state set version = version + 1, state = $3::jsonb, updated_at = now() where id = $1 and version = $2 returning version",
        [id, expectedVersion, json],
      );
      if (r.rows[0]) return r.rows[0].version;
    }
    const actual = (await this.pool.query<{ version: number }>("select version from workspace_state where id = $1", [id])).rows[0]?.version ?? 0;
    throw new StaleWriteError(expectedVersion, actual);
  }

  async audit(id: string, entry: AuditEntry): Promise<void> {
    await this.pool.query("insert into audit_log (workspace_id, at, actor, action, detail) values ($1, $2, $3, $4, $5::jsonb)", [
      id,
      entry.at,
      entry.actor,
      entry.action,
      entry.detail === undefined ? null : JSON.stringify(entry.detail),
    ]);
  }

  async recentAudit(id: string, limit = 50): Promise<AuditEntry[]> {
    const r = await this.pool.query<{ at: Date; actor: string; action: string; detail: unknown }>(
      "select at, actor, action, detail from audit_log where workspace_id = $1 order by seq desc limit $2",
      [id, limit],
    );
    return r.rows.map((row) => ({ at: row.at.toISOString(), actor: row.actor, action: row.action, ...(row.detail === null ? {} : { detail: row.detail }) }));
  }

  async close() {
    await this.pool.end();
  }
}
