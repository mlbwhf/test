// In-memory state for one workspace. Persistence (Postgres) slots in behind this class
// later; routes only talk to the store.

import { demoAgents, demoInitiatives, type Agent, type Initiative } from "@trainyard/ai-portfolio";
import type { PendingChange, TrackerConnector } from "@trainyard/connectors";
import { DEMO_NOW, demoWorkspace, getTemplate, type Dashboard, type OperatingModel, type SourceSystem, type Workspace } from "@trainyard/core";

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
}

export class Store {
  state: StoreState;
  readonly connectors = new Map<SourceSystem, TrackerConnector>();

  constructor(
    initial?: Partial<StoreState>,
    /** Injected clock; the demo runs at a fixed date so its numbers stay stable. */
    readonly now: () => Date = () => DEMO_NOW,
  ) {
    const workspace = initial?.workspace ?? demoWorkspace();
    this.state = {
      workspace,
      model: initial?.model ?? getTemplate(workspace.modelId),
      initiatives: initial?.initiatives ?? demoInitiatives(),
      agents: initial?.agents ?? demoAgents(),
      dashboards: initial?.dashboards ?? structuredClone(DEFAULT_DASHBOARDS),
      pending: initial?.pending ?? [],
    };
  }

  plannedLevel(): string {
    return this.state.model.workLevels.find((w) => w.planned)?.key ?? this.state.model.workLevels[0]!.key;
  }

  metricContext() {
    const s = this.state;
    return { workspace: s.workspace, now: this.now(), extensions: { ai: { model: s.model, initiatives: s.initiatives, agents: s.agents } } };
  }
}
