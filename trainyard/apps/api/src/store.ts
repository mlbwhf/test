// State for one workspace. Everything lives in memory while the server runs; every
// successful mutation is committed to a StatePersistence (memory, file or Postgres) with
// optimistic versioning and an audit entry. Routes only talk to the store.

import { demoAgents, demoInitiatives, type Agent, type Initiative } from "@trainyard/ai-portfolio";
import type { PendingChange, TrackerConnector } from "@trainyard/connectors";
import { MemoryPersistence, StaleWriteError, type AuditEntry, type StatePersistence, type ShardWrite } from "@trainyard/db";
import type { ClassGuest } from "./students.js";
import type { Purchase } from "./billing.js";
import type { WorkspaceRecord } from "./plans.js";
import type { Signup } from "./signups.js";
import { DEMO_NOW, demoArt, type CardType, type CardTypeOverride, demoPlanningSession, type AiNativeArt, type PlanningSession, demoCanvases, demoIdentification, type Canvas, demoMap, demoWorkspace, getTemplate, type Dashboard, type OperatingModel, type SourceSystem, type ValueStreamIdentification, type ValueStreamMap, type Workspace, type Board, type CoachSyncState, type OvsType, type InsightsState, type LaneBoardState, type Room } from "@trainyard/core";
import type { Principal, User } from "./auth.js";
import type { Connection } from "./boards.js";
import { ApiError } from "./errors.js";

export const DEFAULT_DASHBOARDS: Dashboard[] = [
  {
    id: "art-overview",
    name: "ART overview",
    widgets: [
      { id: "w-pred", title: "Predictability, last PI", metric: "predictability", viz: "kpi", filters: { incrementId: "pi-26-3" } },
      { id: "w-flowtime", title: "Flow time", metric: "flow-time", viz: "kpi", filters: { level: "story" } },
      { id: "w-load", title: "Work in progress", metric: "flow-load", viz: "kpi", filters: { level: "story" } },
      { id: "w-deps", title: "Critical dependencies", metric: "dependency-health", viz: "kpi" },
      { id: "w-velocity", title: "Stories finished per iteration", metric: "flow-velocity", viz: "bar", groupBy: "iteration", filters: { level: "story", incrementId: "pi-26-3" } },
      { id: "w-capacity", title: "Capacity used this PI", metric: "capacity-utilisation", viz: "bar", groupBy: "team", filters: { incrementId: "pi-26-4", level: "feature" } },
      { id: "w-pred-team", title: "Predictability by team", metric: "predictability", viz: "bar", groupBy: "team", filters: { incrementId: "pi-26-3" } },
      { id: "w-dist", title: "Flow distribution", metric: "flow-distribution", viz: "donut", filters: { level: "story" } },
      { id: "w-roam", title: "Risks by ROAM", metric: "risk-roam", viz: "bar" },
    ],
  },
  {
    id: "portfolio",
    name: "Portfolio",
    widgets: [
      { id: "p-budget", title: "Budget planned this PI", metric: "budget-used", viz: "kpi", filters: { incrementId: "pi-26-4" } },
      { id: "p-okr", title: "OKR progress", metric: "okr-progress", viz: "kpi" },
      { id: "p-epics", title: "Open epics", metric: "epic-wsjf", viz: "kpi" },
      { id: "p-wsjf", title: "Epics by WSJF", metric: "epic-wsjf", viz: "bar" },
      { id: "p-okrs", title: "Progress by objective", metric: "okr-progress", viz: "bar" },
      { id: "p-budget-vs", title: "Budget planned by value stream", metric: "budget-used", viz: "bar", filters: { incrementId: "pi-26-4" } },
    ],
  },
  {
    id: "ai-portfolio",
    name: "AI portfolio",
    widgets: [
      { id: "a-count", title: "Live AI initiatives", metric: "ai-stage-mix", viz: "kpi" },
      { id: "a-spend", title: "AI spend this month", metric: "ai-spend", viz: "kpi" },
      { id: "a-value", title: "Value realised", metric: "ai-value-realised", viz: "kpi" },
      { id: "a-blocked", title: "Blocked at next gate", metric: "ai-gate-blocked", viz: "kpi" },
      { id: "a-stage", title: "Initiatives by stage", metric: "ai-stage-mix", viz: "bar" },
      { id: "a-risk", title: "By risk tier", metric: "ai-risk-mix", viz: "donut" },
      { id: "a-spend-bar", title: "Spend by initiative", metric: "ai-spend", viz: "bar" },
      { id: "a-agents", title: "Agents on teams", metric: "agents-on-teams", viz: "bar", groupBy: "team" },
    ],
  },
];

export interface StoreState {
  workspace: Workspace;
  model: OperatingModel;
  initiatives: Initiative[];
  agents: Agent[];
  dashboards: Dashboard[];
  pending: PendingChange[];
  users: User[];
  /** Connections to Miro, Lucid, Mural, monday.com and Trello, tokens sealed. */
  connections: Connection[];
  /** Value stream identification workshops and value stream maps. */
  valueStreams: { identifications: ValueStreamIdentification[]; maps: ValueStreamMap[]; ovsTypes?: OvsType[] };
  /** SAFe canvases: LACE, portfolio, SWOT/TOWS, vision, DVS, ART, launch, epic, feature, enabler. */
  canvases: Canvas[];
  /** Requests from the public sign-up form, reviewed under Users. */
  signups?: Signup[];
  /** Stripe Checkout sessions started from sign-ups, and what they became. */
  purchases?: Purchase[];
  /** Students invited to class boards by link (platform state; students.ts). */
  classGuests?: ClassGuest[];
  /** Rooms that organise boards and who may open them. */
  rooms?: Room[];
  /** Stripe event ids already handled (the last few hundred), so a redelivery does nothing. */
  stripeEvents?: string[];
  /** PI Outcome Planning sessions (AI-Native SAFe), one per ART and PI. */
  outcomePlanning?: PlanningSession[];
  /** AI-Native ART records extending a session: outputs, intent/spec/context, data, assessment. */
  aiNativeArts?: AiNativeArt[];
  /** Platform store only: every customer workspace and its plan. */
  workspaces?: WorkspaceRecord[];
  /** Card types the workspace added beyond the built-in ones. */
  cardTypes?: CardType[];
  /** Outcomes across systems: sources, measures, objectives per entity. Test data until replaced. */
  insights?: InsightsState;
  /** Coach Sync answers during PI planning, per increment id. */
  coachSync?: Record<string, CoachSyncState>;
  /** Lane boards kept per key: class breakouts and agenda, notes, timers and ink. */
  laneBoards?: Record<string, LaneBoardState>;
  /** Admin recolouring of built-in card types. */
  cardTypeOverrides?: CardTypeOverride[];
}

export function demoState(): StoreState {
  const workspace = demoWorkspace();
  return {
    workspace,
    model: getTemplate(workspace.modelId),
    initiatives: demoInitiatives(),
    agents: demoAgents(),
    dashboards: structuredClone(DEFAULT_DASHBOARDS),
    pending: [],
    users: [],
    connections: [],
    valueStreams: { identifications: [demoIdentification()], maps: [demoMap()] },
    canvases: demoCanvases(demoIdentification(), DEMO_NOW.toISOString()),
    outcomePlanning: [demoPlanningSession(DEMO_NOW.toISOString())],
    aiNativeArts: [demoArt(DEMO_NOW.toISOString())],
  };
}

export interface StoreOptions {
  persistence?: StatePersistence<StoreState>;
  /** Injected clock; the demo runs at a fixed date so its numbers stay stable. */
  now?: () => Date;
  initial?: Partial<StoreState>;
}

export class Store {
  state: StoreState;
  version = 0;
  readonly connectors = new Map<SourceSystem, TrackerConnector>();
  readonly persistence: StatePersistence<StoreState>;
  readonly now: () => Date;
  /** Checked before every save: plan limits, frozen workspace. Throwing reloads the saved state. */
  guard?: (action: string) => void;
  /** Called after every saved commit, with what changed: live push (events.ts) listens here. */
  onCommit?: (action: string, detail: unknown, touched: { boards: string[]; docs: string[] }) => void;
  // Each board and planning document is saved on its own (a shard), and only when it changed:
  // the JSON of every shard as last saved, by "board/<id>" or "doc/<key>".
  private readonly shardJson = new Map<string, string>();
  private commits = 0;

  constructor(opts: StoreOptions = {}) {
    this.persistence = opts.persistence ?? new MemoryPersistence<StoreState>();
    this.now = opts.now ?? (() => DEMO_NOW);
    this.state = { ...demoState(), ...opts.initial };
  }

  get workspaceId(): string {
    return this.state.workspace.id;
  }

  /** Load the saved state if there is one; otherwise save the starting state as version 1. */
  async open(): Promise<"loaded" | "created"> {
    if (await this.reload()) return "loaded";
    this.version = await this.persistence.save(this.workspaceId, this.core(), 0, this.shardWrites("open", undefined));
    return "created";
  }

  /** Takes the saved state back: the core, then the boards and documents from their shards. */
  private async reload(): Promise<boolean> {
    const saved = await this.persistence.load(this.workspaceId);
    if (!saved) return false;
    const shards = await this.persistence.loadShards(this.workspaceId);
    this.state = { ...demoState(), ...saved.state };
    this.version = saved.version;
    this.shardJson.clear();
    if (shards.length) {
      // Boards and documents live in their shards; a core from before the split still carries them,
      // and the first commit after the split moves them over.
      const boards = shards.filter((x) => x.kind === "board").map((x) => x.data as Board);
      const docs = Object.fromEntries(shards.filter((x) => x.kind === "doc").map((x) => [x.key, x.data]));
      this.state.workspace.boards = [...(this.state.workspace.boards ?? []).filter((b) => !boards.some((x) => x.id === b.id)), ...boards];
      this.state.workspace.docs = { ...(this.state.workspace.docs ?? {}), ...docs };
      for (const x of shards) this.shardJson.set(`${x.kind}/${x.key}`, JSON.stringify(x.data));
    }
    return true;
  }

  /** The state without its shards: what the workspace row holds. */
  private core(): StoreState {
    const { boards: _b, docs: _d, ...workspace } = this.state.workspace;
    return { ...this.state, workspace: workspace as Workspace };
  }

  /**
   * The shards this commit changed. A commit about one board or document (its id in the action's
   * detail) has that one checked; anything else, and every 25th commit, checks them all, so a
   * change outside the named ones is never lost. A shard is written only when its JSON differs
   * from what was last saved, and removed when its board or document is gone.
   */
  private shardWrites(action: string, detail: unknown): ShardWrite[] {
    const d = (detail && typeof detail === "object" ? detail : {}) as Record<string, unknown>;
    const named = new Set<string>();
    for (const k of ["id", "board", "boardId"]) if (typeof d[k] === "string") named.add(d[k] as string);
    if (Array.isArray(d.boards)) for (const b of d.boards) if (typeof b === "string") named.add(b);
    const docKey = typeof d.key === "string" && action.startsWith("docs.") ? (d.key as string) : null;
    const targeted = (action.startsWith("board.") || action.startsWith("class.") || action.startsWith("docs.")) && (named.size > 0 || docKey !== null) && (this.commits += 1) % 25 !== 0;
    const out: ShardWrite[] = [];
    const boards = this.state.workspace.boards ?? [];
    const docs = this.state.workspace.docs ?? {};
    const check = (kind: "board" | "doc", key: string, data: unknown) => {
      const id = `${kind}/${key}`;
      if (data === undefined) {
        if (this.shardJson.has(id)) {
          this.shardJson.delete(id);
          out.push({ kind, key, data: null });
        }
        return;
      }
      const json = JSON.stringify(data);
      if (this.shardJson.get(id) !== json) {
        this.shardJson.set(id, json);
        out.push({ kind, key, data });
      }
    };
    if (targeted) {
      for (const id of named) check("board", id, boards.find((b) => b.id === id));
      if (docKey !== null) check("doc", docKey, docs[docKey]);
    } else {
      for (const b of boards) check("board", b.id, b);
      for (const [k, v] of Object.entries(docs)) check("doc", k, v);
      for (const id of [...this.shardJson.keys()]) {
        const [kind, ...rest] = id.split("/");
        const key = rest.join("/");
        if (kind === "board" && !boards.some((b) => b.id === key)) check("board", key, undefined);
        if (kind === "doc" && !(key in docs)) check("doc", key, undefined);
      }
    }
    return out;
  }

  /** Save the current state and record who changed what. Call after every successful mutation. */
  async commit(actor: Principal, action: string, detail?: unknown): Promise<void> {
    if (this.guard) {
      try {
        this.guard(action);
      } catch (e) {
        // The mutation already happened in memory: drop it and take the saved state back.
        await this.reload();
        throw e;
      }
    }
    const writes = this.shardWrites(action, detail);
    try {
      this.version = await this.persistence.save(this.workspaceId, this.core(), this.version, writes);
    } catch (e) {
      if (e instanceof StaleWriteError) {
        // Another server instance wrote first. Take its state so the next request sees it.
        await this.reload();
        throw new ApiError(409, "STALE_STATE", "The workspace changed on another server while you were editing. Reload and try again.");
      }
      throw e;
    }
    await this.persistence.audit(this.workspaceId, { at: this.now().toISOString(), actor: actor.anonymous ? "open-mode" : actor.userId, action, ...(detail === undefined ? {} : { detail }) });
    this.onCommit?.(action, detail, { boards: writes.filter((w) => w.kind === "board").map((w) => w.key), docs: writes.filter((w) => w.kind === "doc").map((w) => w.key) });
  }

  recentAudit(limit = 100): Promise<AuditEntry[]> {
    return this.persistence.recentAudit(this.workspaceId, limit);
  }

  plannedLevel(): string {
    return this.state.model.workLevels.find((w) => w.planned)?.key ?? this.state.model.workLevels[0]!.key;
  }

  metricContext(readMetric?: (key: string, filters?: Record<string, unknown>) => number | null) {
    const s = this.state;
    return {
      workspace: s.workspace,
      now: this.now(),
      extensions: { ai: { model: s.model, initiatives: s.initiatives, agents: s.agents }, ...(readMetric ? { readMetric } : {}) },
    };
  }
}
