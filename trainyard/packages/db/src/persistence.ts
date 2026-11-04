// Persistence port. The workspace state is one JSON document (the core: model, people, work,
// users…) saved with optimistic concurrency: a save names the version it read, and a stale save is
// refused rather than silently overwriting someone else's change. The big, often-written parts
// (every board, every planning document) are shards, each its own row or file, written only when
// they changed: a sticky on a class board costs a write of that board, not of everything.
// Three stores implement it: memory (tests), JSON files (single-box self-hosting) and Postgres.

export interface Snapshot<T> {
  state: T;
  version: number;
  updatedAt: string;
}

export interface AuditEntry {
  at: string;
  actor: string;
  action: string;
  detail?: unknown;
}

export class StaleWriteError extends Error {
  constructor(
    readonly expected: number,
    readonly actual: number,
  ) {
    super(`state changed since it was read (version ${expected}, now ${actual}); reload and retry`);
    this.name = "StaleWriteError";
  }
}

/** A part of the state kept on its own: a board or a planning document. */
export type ShardKind = "board" | "doc";
export interface Shard {
  kind: ShardKind;
  key: string;
  data: unknown;
}
/** A shard to write with a save; `data: null` removes it. */
export interface ShardWrite {
  kind: ShardKind;
  key: string;
  data: unknown | null;
}

export interface StatePersistence<T = unknown> {
  readonly kind: "memory" | "file" | "postgres";
  load(id: string): Promise<Snapshot<T> | null>;
  /**
   * Save the core state and the shards that changed, together, and return the new version.
   * Throws StaleWriteError when expectedVersion is behind.
   */
  save(id: string, state: T, expectedVersion: number, shards?: ShardWrite[]): Promise<number>;
  /** Every shard of a workspace, for open(). */
  loadShards(id: string): Promise<Shard[]>;
  audit(id: string, entry: AuditEntry): Promise<void>;
  recentAudit(id: string, limit?: number): Promise<AuditEntry[]>;
  close(): Promise<void>;
}

export class MemoryPersistence<T = unknown> implements StatePersistence<T> {
  readonly kind = "memory" as const;
  private readonly snapshots = new Map<string, Snapshot<T>>();
  private readonly shards = new Map<string, Map<string, Shard>>();
  private readonly log = new Map<string, AuditEntry[]>();

  async load(id: string) {
    const s = this.snapshots.get(id);
    return s ? structuredClone(s) : null;
  }

  async save(id: string, state: T, expectedVersion: number, shards: ShardWrite[] = []) {
    const current = this.snapshots.get(id)?.version ?? 0;
    if (current !== expectedVersion) throw new StaleWriteError(expectedVersion, current);
    const version = current + 1;
    this.snapshots.set(id, { state: structuredClone(state), version, updatedAt: new Date().toISOString() });
    const mine = this.shards.get(id) ?? new Map<string, Shard>();
    for (const w of shards) {
      if (w.data === null) mine.delete(`${w.kind}/${w.key}`);
      else mine.set(`${w.kind}/${w.key}`, { kind: w.kind, key: w.key, data: structuredClone(w.data) });
    }
    this.shards.set(id, mine);
    return version;
  }

  async loadShards(id: string) {
    return [...(this.shards.get(id)?.values() ?? [])].map((s) => structuredClone(s));
  }

  async audit(id: string, entry: AuditEntry) {
    this.log.set(id, [...(this.log.get(id) ?? []), entry]);
  }

  async recentAudit(id: string, limit = 50) {
    return (this.log.get(id) ?? []).slice(-limit).reverse();
  }

  async close() {}
}
