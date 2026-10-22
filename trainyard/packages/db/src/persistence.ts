// Persistence port. The whole workspace state is one JSON document saved with optimistic
// concurrency: a save names the version it read, and a stale save is refused rather than
// silently overwriting someone else's change. Three stores implement it: memory (tests),
// a JSON file (single-box self-hosting) and Postgres (everything else).

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

export interface StatePersistence<T = unknown> {
  readonly kind: "memory" | "file" | "postgres";
  load(id: string): Promise<Snapshot<T> | null>;
  /** Save and return the new version. Throws StaleWriteError when expectedVersion is behind. */
  save(id: string, state: T, expectedVersion: number): Promise<number>;
  audit(id: string, entry: AuditEntry): Promise<void>;
  recentAudit(id: string, limit?: number): Promise<AuditEntry[]>;
  close(): Promise<void>;
}

export class MemoryPersistence<T = unknown> implements StatePersistence<T> {
  readonly kind = "memory" as const;
  private readonly snapshots = new Map<string, Snapshot<T>>();
  private readonly log = new Map<string, AuditEntry[]>();

  async load(id: string) {
    const s = this.snapshots.get(id);
    return s ? structuredClone(s) : null;
  }

  async save(id: string, state: T, expectedVersion: number) {
    const current = this.snapshots.get(id)?.version ?? 0;
    if (current !== expectedVersion) throw new StaleWriteError(expectedVersion, current);
    const version = current + 1;
    this.snapshots.set(id, { state: structuredClone(state), version, updatedAt: new Date().toISOString() });
    return version;
  }

  async audit(id: string, entry: AuditEntry) {
    this.log.set(id, [...(this.log.get(id) ?? []), entry]);
  }

  async recentAudit(id: string, limit = 50) {
    return (this.log.get(id) ?? []).slice(-limit).reverse();
  }

  async close() {}
}
