// JSON-file persistence for single-box installs: <dir>/<id>.json holds the core snapshot,
// <dir>/<id>.shards/<kind>.<key>.json each board or document, and <dir>/<id>.audit.jsonl the log. Writes go to a temp file and are renamed into place so a
// crash mid-write never leaves a half-written state file.

import { mkdir, readFile, readdir, rename, rm, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { StaleWriteError, type AuditEntry, type Shard, type ShardKind, type ShardWrite, type Snapshot, type StatePersistence } from "./persistence.js";

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

  private shardDir(id: string) {
    return this.file(id, ".shards");
  }
  private shardFile(id: string, kind: ShardKind, key: string) {
    return path.join(this.shardDir(id), `${kind}.${encodeURIComponent(key)}.json`);
  }

  save(id: string, state: T, expectedVersion: number, shards: ShardWrite[] = []): Promise<number> {
    return this.serial(async () => {
      await mkdir(this.dir, { recursive: true });
      const current = (await this.load(id))?.version ?? 0;
      if (current !== expectedVersion) throw new StaleWriteError(expectedVersion, current);
      const snapshot: Snapshot<T> = { state, version: current + 1, updatedAt: new Date().toISOString() };
      // Shards first, the core last: a crash in between leaves a core that is at most one version behind its shards.
      if (shards.length) await mkdir(this.shardDir(id), { recursive: true });
      for (const w of shards) {
        const f = this.shardFile(id, w.kind, w.key);
        if (w.data === null) await rm(f, { force: true });
        else {
          const tmp = `${f}.${process.pid}.tmp`;
          await writeFile(tmp, JSON.stringify(w.data));
          await rename(tmp, f);
        }
      }
      const target = this.file(id, ".json");
      const tmp = `${target}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(snapshot));
      await rename(tmp, target);
      return snapshot.version;
    });
  }

  async loadShards(id: string): Promise<Shard[]> {
    let names: string[];
    try {
      names = await readdir(this.shardDir(id));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
    const out: Shard[] = [];
    for (const n of names) {
      const m = /^(board|doc)\.(.+)\.json$/.exec(n);
      if (!m) continue;
      out.push({ kind: m[1] as ShardKind, key: decodeURIComponent(m[2]!), data: JSON.parse(await readFile(path.join(this.shardDir(id), n), "utf8")) });
    }
    return out;
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
