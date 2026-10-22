// JSON-file persistence for single-box installs: <dir>/<id>.json holds the snapshot and
// <dir>/<id>.audit.jsonl the log. Writes go to a temp file and are renamed into place so a
// crash mid-write never leaves a half-written state file.

import { mkdir, readFile, rename, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { StaleWriteError, type AuditEntry, type Snapshot, type StatePersistence } from "./persistence.js";

export class FilePersistence<T = unknown> implements StatePersistence<T> {
  readonly kind = "file" as const;
  private chain: Promise<unknown> = Promise.resolve();

  constructor(private readonly dir: string) {}

  private file(id: string, ext: string) {
    if (!/^[\w.-]+$/.test(id)) throw new Error(`invalid workspace id: ${id}`);
    return path.join(this.dir, `${id}${ext}`);
  }

  /** Serialise writes per process so two saves cannot interleave on the same file. */
  private serial<R>(fn: () => Promise<R>): Promise<R> {
    const next = this.chain.then(fn, fn);
    this.chain = next.catch(() => undefined);
    return next;
  }

  async load(id: string): Promise<Snapshot<T> | null> {
    try {
      return JSON.parse(await readFile(this.file(id, ".json"), "utf8")) as Snapshot<T>;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }

  save(id: string, state: T, expectedVersion: number): Promise<number> {
    return this.serial(async () => {
      await mkdir(this.dir, { recursive: true });
      const current = (await this.load(id))?.version ?? 0;
      if (current !== expectedVersion) throw new StaleWriteError(expectedVersion, current);
      const snapshot: Snapshot<T> = { state, version: current + 1, updatedAt: new Date().toISOString() };
      const target = this.file(id, ".json");
      const tmp = `${target}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(snapshot));
      await rename(tmp, target);
      return snapshot.version;
    });
  }

  audit(id: string, entry: AuditEntry): Promise<void> {
    return this.serial(async () => {
      await mkdir(this.dir, { recursive: true });
      await appendFile(this.file(id, ".audit.jsonl"), `${JSON.stringify(entry)}\n`);
    });
  }

  async recentAudit(id: string, limit = 50): Promise<AuditEntry[]> {
    try {
      const lines = (await readFile(this.file(id, ".audit.jsonl"), "utf8")).trim().split("\n").filter(Boolean);
      return lines
        .slice(-limit)
        .reverse()
        .map((l) => JSON.parse(l) as AuditEntry);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
  }

  async close() {}
}
