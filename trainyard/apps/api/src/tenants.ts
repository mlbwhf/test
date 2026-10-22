// One Store per workspace, chosen per request. The platform store is the operator's own
// workspace and also holds everything that spans workspaces: users (each tagged with the
// workspace they belong to), sign-ups, purchases and the workspace registry. Tenant stores
// hold a workspace's boards, canvases, model and the rest, and are opened lazily from the
// same persistence. Routes keep talking to a single `store` object: it is a proxy that
// resolves to the request's workspace through AsyncLocalStorage, and to the platform store
// outside a request (scheduled syncs, startup).

import { AsyncLocalStorage } from "node:async_hooks";
import type { StatePersistence } from "@trainyard/db";
import { DEFAULT_DASHBOARDS, demoState, Store, type StoreState } from "./store.js";
import { enforceStateLimits, frozenError, type WorkspaceRecord } from "./plans.js";
import type { Plan } from "./signups.js";
import type { User } from "./auth.js";

export class Tenants {
  readonly platform: Store;
  readonly persistence: StatePersistence<StoreState>;
  readonly now: () => Date;
  private readonly stores = new Map<string, Promise<Store>>();
  private readonly als = new AsyncLocalStorage<Store>();
  /** What routes receive as `store`: the current request's workspace, else the platform. */
  readonly handle: Store;

  constructor(platform: Store) {
    this.platform = platform;
    this.persistence = platform.persistence;
    this.now = platform.now;
    this.stores.set(platform.workspaceId, Promise.resolve(platform));
    const current = () => this.als.getStore() ?? this.platform;
    this.handle = new Proxy(platform, {
      get: (_t, prop) => {
        const cur = current();
        const v = (cur as unknown as Record<PropertyKey, unknown>)[prop];
        return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(cur) : v;
      },
      set: (_t, prop, value) => {
        (current() as unknown as Record<PropertyKey, unknown>)[prop] = value;
        return true;
      },
    }) as Store;
  }

  get platformId(): string {
    return this.platform.workspaceId;
  }
  /** The workspace the current request runs in. */
  get currentId(): string {
    return (this.als.getStore() ?? this.platform).workspaceId;
  }
  run<T>(store: Store, fn: () => T): T {
    return this.als.run(store, fn);
  }

  // ---- registry (platform state) --------------------------------------------------------

  records(): WorkspaceRecord[] {
    return (this.platform.state.workspaces ??= []);
  }
  record(id: string): WorkspaceRecord | undefined {
    return this.records().find((w) => w.id === id);
  }
  users(): User[] {
    return this.platform.state.users;
  }
  /** Members of a workspace: users tagged with it; the platform's own users carry no tag. */
  members(workspaceId: string): User[] {
    return this.users().filter((u) => (u.workspaceId ?? this.platformId) === workspaceId);
  }

  async get(id: string): Promise<Store> {
    let p = this.stores.get(id);
    if (!p) {
      p = this.open(id);
      this.stores.set(id, p);
      p.catch(() => this.stores.delete(id));
    }
    return p;
  }

  private async open(id: string): Promise<Store> {
    const record = this.record(id);
    if (!record) throw new Error(`unknown workspace ${id}`);
    const store = new Store({ persistence: this.persistence, now: this.now, initial: freshState(record) });
    await store.open();
    this.attachGuard(store, record);
    return store;
  }

  /** Plan limits and the frozen state are checked at commit, before anything is saved. */
  private attachGuard(store: Store, record: WorkspaceRecord) {
    store.guard = (action) => {
      const live = this.record(record.id) ?? record;
      if (live.status === "frozen" && !action.startsWith("billing.") && !action.startsWith("workspace.")) throw frozenError(live);
      enforceStateLimits(live, store.state);
    };
  }

  /** Creates the registry entry and the tenant's starting state. */
  async create(input: { name: string; plan: Plan; seats: number; ownerUserId: string; note?: string }, actor: Parameters<Store["commit"]>[0]): Promise<WorkspaceRecord> {
    const id = `ws-${this.now().getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    const record: WorkspaceRecord = { id, name: input.name, plan: input.plan, seats: Math.max(1, input.seats), status: "active", ownerUserId: input.ownerUserId, createdAt: this.now().toISOString(), ...(input.note ? { note: input.note } : {}) };
    this.records().push(record);
    await this.platform.commit(actor, "workspace.create", { workspaceId: id, plan: record.plan, seats: record.seats });
    await this.get(id);
    return record;
  }

  async close() {
    this.stores.clear();
  }
}

/** A new customer workspace: the demo content as a sandbox to learn in, under their own name. */
export function freshState(record: WorkspaceRecord): StoreState {
  const s = demoState();
  s.workspace = { ...s.workspace, id: record.id, name: record.name };
  s.dashboards = structuredClone(DEFAULT_DASHBOARDS);
  s.users = [];
  return s;
}
