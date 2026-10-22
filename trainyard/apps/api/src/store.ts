// State for one workspace. Everything lives in memory while the server runs; every
// successful mutation is committed to a StatePersistence (memory, file or Postgres) with
// optimistic versioning and an audit entry. Routes only talk to the store.

import { demoAgents, demoInitiatives, type Agent, type Initiative } from "@trainyard/ai-portfolio";
import type { PendingChange, TrackerConnector } from "@trainyard/connectors";
import { MemoryPersistence, StaleWriteError, type AuditEntry, type StatePersistence } from "@trainyard/db";
import type { Signup } from "./signups.js";
import { DEMO_NOW, demoCanvases, demoIdentification, type Canvas, demoMap, demoWorkspace, getTemplate, type Dashboard, type OperatingModel, type SourceSystem, type ValueStreamIdentification, type ValueStreamMap, type Workspace } from "@trainyard/core";
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
  /** Connections to Miro, Mural, monday.com and Trello, tokens sealed. */
  connections: Connection[];
  /** Value stream identification workshops and value stream maps. */
  valueStreams: { identifications: ValueStreamIdentification[]; maps: ValueStreamMap[] };
  /** SAFe canvases: LACE, portfolio, SWOT/TOWS, vision, DVS, ART, launch, epic, feature, enabler. */
  canvases: Canvas[];
  /** Requests from the public sign-up form, reviewed under Users. */
  signups?: Signup[];
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
    const saved = await this.persistence.load(this.workspaceId);
    if (saved) {
      this.state = { ...demoState(), ...saved.state };
      this.version = saved.version;
      return "loaded";
    }
    this.version = await this.persistence.save(this.workspaceId, this.state, 0);
    return "created";
  }

  /** Save the current state and record who changed what. Call after every successful mutation. */
  async commit(actor: Principal, action: string, detail?: unknown): Promise<void> {
    try {
      this.version = await this.persistence.save(this.workspaceId, this.state, this.version);
    } catch (e) {
      if (e instanceof StaleWriteError) {
        // Another server instance wrote first. Take its state so the next request sees it.
        const saved = await this.persistence.load(this.workspaceId);
        if (saved) {
          this.state = { ...demoState(), ...saved.state };
          this.version = saved.version;
        }
        throw new ApiError(409, "STALE_STATE", "The workspace changed on another server while you were editing. Reload and try again.");
      }
      throw e;
    }
    await this.persistence.audit(this.workspaceId, { at: this.now().toISOString(), actor: actor.anonymous ? "open-mode" : actor.userId, action, ...(detail === undefined ? {} : { detail }) });
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
