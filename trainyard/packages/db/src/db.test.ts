import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { FilePersistence, MemoryPersistence, PgPersistence, StaleWriteError, createPool, migrate, type StatePersistence } from "./index.js";

interface Doc {
  n: number;
  tags: string[];
}

function contract(name: string, make: () => Promise<{ store: StatePersistence<Doc>; done?: () => Promise<void> }>) {
  describe(name, () => {
    it("round-trips state with versions and refuses stale writes", async () => {
      const { store, done } = await make();
      const id = `ws-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      expect(await store.load(id)).toBeNull();
      expect(await store.save(id, { n: 1, tags: ["a"] }, 0)).toBe(1);
      const loaded = await store.load(id);
      expect(loaded).toMatchObject({ version: 1, state: { n: 1, tags: ["a"] } });
      expect(typeof loaded!.updatedAt).toBe("string");
      expect(await store.save(id, { n: 2, tags: [] }, 1)).toBe(2);
      await expect(store.save(id, { n: 3, tags: [] }, 1)).rejects.toBeInstanceOf(StaleWriteError);
      await expect(store.save(id, { n: 3, tags: [] }, 0)).rejects.toBeInstanceOf(StaleWriteError);
      expect((await store.load(id))!.state.n).toBe(2);
      await done?.();
    });

    it("keeps an audit log, newest first", async () => {
      const { store, done } = await make();
      const id = `ws-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      expect(await store.recentAudit(id)).toEqual([]);
      await store.audit(id, { at: "2026-10-21T10:00:00.000Z", actor: "u1", action: "item.move", detail: { itemId: "f-1" } });
      await store.audit(id, { at: "2026-10-21T10:01:00.000Z", actor: "u2", action: "risk.roam" });
      const log = await store.recentAudit(id, 10);
      expect(log.map((e) => e.action)).toEqual(["risk.roam", "item.move"]);
      expect(log[1]).toEqual({ at: "2026-10-21T10:00:00.000Z", actor: "u1", action: "item.move", detail: { itemId: "f-1" } });
      expect(await store.recentAudit(id, 1)).toHaveLength(1);
      await done?.();
    });
  });
}

contract("MemoryPersistence", async () => ({ store: new MemoryPersistence<Doc>() }));

const dirs: string[] = [];
contract("FilePersistence", async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "trainyard-db-"));
  dirs.push(dir);
  return { store: new FilePersistence<Doc>(dir) };
});
afterAll(async () => {
  for (const d of dirs) await rm(d, { recursive: true, force: true });
});

describe("FilePersistence", () => {
  it("rejects ids that could escape the directory", async () => {
    const store = new FilePersistence<Doc>("/nonexistent");
    await expect(store.load("../etc/passwd")).rejects.toThrow(/invalid workspace id/);
  });

  it("serialises concurrent saves so exactly one wins per version", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "trainyard-db-"));
    dirs.push(dir);
    const store = new FilePersistence<Doc>(dir);
    await store.save("w", { n: 0, tags: [] }, 0);
    const results = await Promise.allSettled([store.save("w", { n: 1, tags: [] }, 1), store.save("w", { n: 2, tags: [] }, 1)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  });
});

const url = process.env.DATABASE_URL;
if (url) {
  const pool = createPool(url);
  contract("PgPersistence", async () => {
    await migrate(pool);
    return { store: new PgPersistence<Doc>(pool) };
  });
  describe("Postgres", () => {
    it("runs migrations once and keeps the audit log append-only", async () => {
      expect(await migrate(pool)).toEqual([]);
      const store = new PgPersistence<Doc>(pool);
      const id = `ws-ro-${Date.now()}`;
      await store.audit(id, { at: new Date().toISOString(), actor: "x", action: "y" });
      await expect(pool.query("delete from audit_log where workspace_id = $1", [id])).rejects.toThrow(/append-only/);
      await expect(pool.query("update audit_log set actor = 'z' where workspace_id = $1", [id])).rejects.toThrow(/append-only/);
    });
  });
  afterAll(() => pool.end());
} else {
  it.skip("PgPersistence (set DATABASE_URL to run)", () => {});
}
