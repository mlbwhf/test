// Tracker sync: run on request, on a timer, or when a tracker webhook fires. Only one sync
// per tracker runs at a time; a request that arrives during a run is queued once.

import type { SourceSystem } from "@trainyard/core";
import { planSync, type SyncPlan } from "@trainyard/connectors";
import type { Principal } from "./auth.js";
import { ApiError } from "./errors.js";
import type { Store } from "./store.js";

export type TrackerSystem = Extract<SourceSystem, "jira" | "ado">;

export interface SyncReport {
  system: TrackerSystem;
  dryRun: boolean;
  startedAt: string;
  finishedAt: string;
  added: string[];
  updated: string[];
  missing: string[];
  pushed: number;
  conflicts: SyncPlan["conflicts"];
  error?: string;
}

const SYSTEM_LABEL: Record<TrackerSystem, string> = { jira: "Jira", ado: "Azure DevOps" };

export class SyncRunner {
  readonly last = new Map<TrackerSystem, SyncReport>();
  private readonly running = new Map<TrackerSystem, Promise<SyncReport>>();
  private readonly queued = new Set<TrackerSystem>();
  private readonly debounce = new Map<TrackerSystem, NodeJS.Timeout>();
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly store: Store,
    private readonly log: (msg: string) => void = () => {},
  ) {}

  /** Run a sync now; if one is already running, run again once it finishes. */
  run(system: TrackerSystem, actor: Principal, dryRun = false): Promise<SyncReport> {
    const connector = this.store.connectors.get(system);
    if (!connector) throw new ApiError(409, "NOT_CONNECTED", `No ${SYSTEM_LABEL[system]} connection is configured.`);
    const inFlight = this.running.get(system);
    if (inFlight) {
      if (dryRun) return inFlight;
      this.queued.add(system);
      return inFlight.then(() => (this.queued.delete(system) ? this.run(system, actor, false) : inFlight));
    }
    const p = this.execute(system, actor, dryRun).finally(() => this.running.delete(system));
    this.running.set(system, p);
    return p;
  }

  private async execute(system: TrackerSystem, actor: Principal, dryRun: boolean): Promise<SyncReport> {
    const startedAt = this.store.now().toISOString();
    const connector = this.store.connectors.get(system)!;
    const ws = this.store.state.workspace;
    const mine = ws.items.filter((i) => i.source.system === system);
    const pending = this.store.state.pending.filter((p) => mine.some((i) => i.id === p.itemId));
    let report: SyncReport;
    try {
      const plan = planSync(mine, await connector.pull(), pending);
      if (!dryRun) {
        for (const change of plan.push) await connector.push(change);
        const missing = new Set(plan.missing);
        ws.items = [...ws.items.filter((i) => i.source.system !== system), ...plan.items, ...mine.filter((i) => missing.has(i.id))];
        const conflicted = new Set(plan.conflicts.map((c) => `${c.itemId}|${c.field}`));
        this.store.state.pending = this.store.state.pending
          .map((p) => ({ ...p, fields: p.fields.filter((f) => !mine.some((i) => i.id === p.itemId) || conflicted.has(`${p.itemId}|${f}`)) }))
          .filter((p) => p.fields.length);
      }
      report = { system, dryRun, startedAt, finishedAt: this.store.now().toISOString(), added: plan.added, updated: plan.updated, missing: plan.missing, pushed: plan.push.length, conflicts: plan.conflicts };
      if (!dryRun) await this.store.commit(actor, "sync.run", { system, added: plan.added.length, updated: plan.updated.length, pushed: plan.push.length, conflicts: plan.conflicts.length });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      report = { system, dryRun, startedAt, finishedAt: this.store.now().toISOString(), added: [], updated: [], missing: [], pushed: 0, conflicts: [], error: message };
      this.log(`[sync] ${system} failed: ${message}`);
    }
    if (!dryRun) this.last.set(system, report);
    return report;
  }

  /** Webhook-driven: coalesce bursts of events into one sync a few seconds later. */
  trigger(system: TrackerSystem, actor: Principal, delayMs = 5000): void {
    const existing = this.debounce.get(system);
    if (existing) clearTimeout(existing);
    this.debounce.set(
      system,
      setTimeout(() => {
        this.debounce.delete(system);
        if (this.store.connectors.has(system)) void this.run(system, actor).catch(() => undefined);
      }, delayMs),
    );
  }

  startSchedule(minutes: number, actor: Principal): void {
    this.stopSchedule();
    if (minutes <= 0) return;
    this.timer = setInterval(
      () => {
        for (const system of this.store.connectors.keys()) {
          if (system === "jira" || system === "ado") void this.run(system, actor).catch(() => undefined);
        }
      },
      minutes * 60_000,
    );
    this.timer.unref?.();
    this.log(`[sync] every ${minutes} min`);
  }

  stopSchedule(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    for (const t of this.debounce.values()) clearTimeout(t);
    this.debounce.clear();
  }
}
