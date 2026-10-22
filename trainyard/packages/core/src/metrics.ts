// Metric catalogue and dashboard engine. A metric is a pure function from workspace data
// to a small result (one number, categories or a time series). Dashboards are lists of
// widgets that pick a metric, filters and a chart type, so people build their own reports
// without new code. Other packages add metrics through MetricRegistry.register.

import { checkDependencies } from "./planning.js";
import type { FlowType, Increment, Iteration, Workspace, WorkItem } from "./model.js";

export interface MetricFilters {
  teamIds?: string[];
  /** Restrict to teams under this group (direct members only). */
  groupId?: string;
  incrementId?: string;
  flowTypes?: FlowType[];
  /** Work level key; defaults to every level. */
  level?: string;
}

export type GroupBy = "none" | "team" | "flowType" | "iteration";

export interface MetricContext {
  workspace: Workspace;
  now: Date;
  /** Data owned by other packages, keyed by package, e.g. { ai: AiPortfolio }. */
  extensions: Record<string, unknown>;
}

export interface MetricPoint {
  label: string;
  value: number;
}

export interface MetricResult {
  /** Headline value for KPI tiles. */
  value: number | null;
  unit: "count" | "days" | "percent" | "points" | "currency";
  points: MetricPoint[];
  /** Short plain-language note shown under the chart, e.g. how the value was computed. */
  note?: string;
}

export interface MetricDef {
  key: string;
  label: string;
  description: string;
  category: "flow" | "planning" | "quality" | "ai";
  groupBys: GroupBy[];
  compute(ctx: MetricContext, filters: MetricFilters, groupBy: GroupBy): MetricResult;
}

export type Viz = "kpi" | "bar" | "line" | "donut" | "table";

export interface Widget {
  id: string;
  title: string;
  metric: string;
  viz: Viz;
  groupBy?: GroupBy;
  filters?: MetricFilters;
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: Widget[];
}

export type WidgetOutput = { widget: Widget; result: MetricResult } | { widget: Widget; error: string };

// ---- helpers ---------------------------------------------------------------------------

function selectTeams(ws: Workspace, f: MetricFilters) {
  return ws.teams.filter((t) => (!f.teamIds || f.teamIds.includes(t.id)) && (!f.groupId || t.groupId === f.groupId));
}

export function selectItems(ws: Workspace, f: MetricFilters): WorkItem[] {
  const teamIds = f.teamIds || f.groupId ? new Set(selectTeams(ws, f).map((t) => t.id)) : undefined;
  const inc = f.incrementId ? ws.increments.find((i) => i.id === f.incrementId) : undefined;
  const iterIds = inc ? new Set(inc.iterations.map((i) => i.id)) : undefined;
  return ws.items.filter(
    (it) =>
      (!teamIds || (it.teamId !== undefined && teamIds.has(it.teamId))) &&
      (!iterIds || (it.iterationId !== undefined && iterIds.has(it.iterationId))) &&
      (!f.flowTypes || f.flowTypes.includes(it.flowType)) &&
      (!f.level || it.level === f.level),
  );
}

function days(fromIso: string, toIso: string): number {
  return (Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000;
}

export function percentile(values: readonly number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (rank - lo);
}

function round(n: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function groupLabel(ws: Workspace, groupBy: GroupBy, it: WorkItem): string {
  switch (groupBy) {
    case "team":
      return ws.teams.find((t) => t.id === it.teamId)?.name ?? "No team";
    case "flowType":
      return it.flowType;
    case "iteration":
      return allIterations(ws).find((i) => i.id === it.iterationId)?.name ?? "Unplanned";
    default:
      return "All";
  }
}

function allIterations(ws: Workspace): Iteration[] {
  return ws.increments.flatMap((i) => i.iterations);
}

function countBy(items: readonly WorkItem[], key: (it: WorkItem) => string): MetricPoint[] {
  const m = new Map<string, number>();
  for (const it of items) m.set(key(it), (m.get(key(it)) ?? 0) + 1);
  return [...m].map(([label, value]) => ({ label, value }));
}

function windowIterations(ws: Workspace, f: MetricFilters): Iteration[] {
  const inc: Increment | undefined = f.incrementId ? ws.increments.find((i) => i.id === f.incrementId) : undefined;
  return inc ? inc.iterations : allIterations(ws);
}

// ---- built-in metrics ------------------------------------------------------------------

export const FLOW_METRICS: MetricDef[] = [
  {
    key: "flow-velocity",
    label: "Flow velocity",
    description: "Items finished per iteration.",
    category: "flow",
    groupBys: ["iteration", "team", "flowType"],
    compute({ workspace: ws, now }, f, groupBy) {
      const { incrementId: _window, ...rest } = f;
      const done = selectItems(ws, rest).filter((i) => i.status === "done" && i.doneAt);
      const iterations = windowIterations(ws, f);
      const inWindow = (it: WorkItem) => iterations.find((w) => it.doneAt! >= w.start && it.doneAt!.slice(0, 10) <= w.end);
      const finished = done.filter((it) => inWindow(it));
      if (groupBy === "team" || groupBy === "flowType") {
        const points = countBy(finished, (it) => groupLabel(ws, groupBy, it));
        return { value: finished.length, unit: "count", points };
      }
      const points = iterations.map((w) => ({ label: w.name, value: finished.filter((it) => inWindow(it)?.id === w.id).length }));
      const closed = points.filter((p, i) => iterations[i]!.end < now.toISOString().slice(0, 10) || p.value > 0);
      const avg = closed.length ? closed.reduce((s, p) => s + p.value, 0) / closed.length : null;
      return { value: avg === null ? null : round(avg), unit: "count", points, note: "Headline is the average per iteration that has finished work." };
    },
  },
  {
    key: "flow-time",
    label: "Flow time",
    description: "Days from start to done for finished items. Headline is the median; the 85th percentile is in the note.",
    category: "flow",
    groupBys: ["none", "team", "flowType"],
    compute({ workspace: ws }, f, groupBy) {
      const done = selectItems(ws, f).filter((i) => i.status === "done" && i.doneAt);
      const dur = (it: WorkItem) => days(it.startedAt ?? it.createdAt, it.doneAt!);
      const all = done.map(dur);
      const median = percentile(all, 50);
      const p85 = percentile(all, 85);
      const groups = new Map<string, number[]>();
      for (const it of done) {
        const k = groupLabel(ws, groupBy, it);
        groups.set(k, [...(groups.get(k) ?? []), dur(it)]);
      }
      const points = [...groups].map(([label, v]) => ({ label, value: round(percentile(v, 50) ?? 0) }));
      return {
        value: median === null ? null : round(median),
        unit: "days",
        points,
        note: p85 === null ? "No finished items yet." : `85% of items finish within ${round(p85)} days.`,
      };
    },
  },
  {
    key: "flow-load",
    label: "Flow load",
    description: "Items in progress right now.",
    category: "flow",
    groupBys: ["team", "flowType", "none"],
    compute({ workspace: ws }, f, groupBy) {
      const wip = selectItems(ws, f).filter((i) => i.status === "in_progress");
      return { value: wip.length, unit: "count", points: countBy(wip, (it) => groupLabel(ws, groupBy, it)) };
    },
  },
  {
    key: "flow-distribution",
    label: "Flow distribution",
    description: "Share of finished work by type: features, enablers, defects, risks and debt.",
    category: "flow",
    groupBys: ["flowType"],
    compute({ workspace: ws }, f) {
      const done = selectItems(ws, f).filter((i) => i.status === "done");
      const points = countBy(done, (it) => it.flowType).map((p) => ({ label: p.label, value: done.length ? round((p.value / done.length) * 100) : 0 }));
      const feature = points.find((p) => p.label === "feature")?.value ?? 0;
      return { value: done.length ? feature : null, unit: "percent", points, note: "Headline is the share of features." };
    },
  },
  {
    key: "predictability",
    label: "Predictability",
    description: "Actual business value achieved as a share of planned value on committed objectives.",
    category: "planning",
    groupBys: ["team", "none"],
    compute({ workspace: ws }, f, groupBy) {
      const teamIds = new Set(selectTeams(ws, f).map((t) => t.id));
      const objs = ws.objectives.filter((o) => teamIds.has(o.teamId) && (!f.incrementId || o.incrementId === f.incrementId) && o.actualValue !== undefined);
      const score = (list: typeof objs) => {
        const planned = list.filter((o) => o.committed).reduce((s, o) => s + o.plannedValue, 0);
        const actual = list.reduce((s, o) => s + (o.actualValue ?? 0), 0);
        return planned > 0 ? round((actual / planned) * 100) : null;
      };
      const points =
        groupBy === "team"
          ? ws.teams.filter((t) => teamIds.has(t.id)).flatMap((t) => {
              const v = score(objs.filter((o) => o.teamId === t.id));
              return v === null ? [] : [{ label: t.name, value: v }];
            })
          : [];
      return { value: score(objs), unit: "percent", points, note: "Only objectives that have been scored count. 80–100% is the usual target band." };
    },
  },
  {
    key: "objective-achievement",
    label: "Objectives met",
    description: "Share of scored committed objectives whose actual value reached the planned value.",
    category: "planning",
    groupBys: ["none"],
    compute({ workspace: ws }, f) {
      const teamIds = new Set(selectTeams(ws, f).map((t) => t.id));
      const scored = ws.objectives.filter((o) => o.committed && o.actualValue !== undefined && teamIds.has(o.teamId) && (!f.incrementId || o.incrementId === f.incrementId));
      const met = scored.filter((o) => (o.actualValue ?? 0) >= o.plannedValue).length;
      return { value: scored.length ? round((met / scored.length) * 100) : null, unit: "percent", points: [{ label: "Met", value: met }, { label: "Missed", value: scored.length - met }] };
    },
  },
  {
    key: "dependency-health",
    label: "Dependency health",
    description: "Open dependencies by severity: planned in order, same iteration, or at risk.",
    category: "planning",
    groupBys: ["none"],
    compute({ workspace: ws }) {
      const checks = checkDependencies(ws.dependencies, ws.items, ws.increments);
      const by = (s: string) => checks.filter((c) => c.severity === s).length;
      return {
        value: by("critical"),
        unit: "count",
        points: [
          { label: "On track", value: by("ok") },
          { label: "Warning", value: by("warning") },
          { label: "Critical", value: by("critical") },
        ],
        note: "Headline is the number of critical dependencies.",
      };
    },
  },
  {
    key: "risk-roam",
    label: "Risks by ROAM",
    description: "Program risks by Resolved, Owned, Accepted, Mitigated, or not yet ROAMed.",
    category: "planning",
    groupBys: ["none"],
    compute({ workspace: ws }, f) {
      const risks = ws.risks.filter((r) => !f.groupId || r.groupId === f.groupId);
      const order = ["unroamed", "owned", "accepted", "mitigated", "resolved"] as const;
      return {
        value: risks.filter((r) => r.roam === "unroamed").length,
        unit: "count",
        points: order.map((k) => ({ label: k, value: risks.filter((r) => r.roam === k).length })),
        note: "Headline is risks not yet ROAMed.",
      };
    },
  },
  {
    key: "capacity-utilisation",
    label: "Capacity used",
    description: "Planned load as a share of capacity for the selected increment.",
    category: "planning",
    groupBys: ["team", "iteration"],
    compute({ workspace: ws }, f, groupBy) {
      const inc = f.incrementId ? ws.increments.find((i) => i.id === f.incrementId) : ws.increments[0];
      if (!inc) return { value: null, unit: "percent", points: [] };
      const teams = selectTeams(ws, f);
      const items = selectItems(ws, { ...f, incrementId: inc.id });
      const load = (pred: (it: WorkItem) => boolean) => items.filter(pred).reduce((s, it) => s + (it.estimate ?? 0), 0);
      const cap = (iterIds: string[], teamList = teams) => teamList.reduce((s, t) => s + iterIds.reduce((a, id) => a + (t.capacity[id] ?? 0), 0), 0);
      const iterIds = inc.iterations.map((i) => i.id);
      const pct = (l: number, c: number) => (c > 0 ? round((l / c) * 100) : 0);
      const points =
        groupBy === "iteration"
          ? inc.iterations.map((w) => ({ label: w.name, value: pct(load((it) => it.iterationId === w.id), cap([w.id])) }))
          : teams.map((t) => ({ label: t.name, value: pct(load((it) => it.teamId === t.id), cap(iterIds, [t])) }));
      const totalCap = cap(iterIds);
      return { value: totalCap > 0 ? pct(load(() => true), totalCap) : null, unit: "percent", points };
    },
  },
];

export class MetricRegistry {
  private readonly defs = new Map<string, MetricDef>();

  constructor(defs: readonly MetricDef[] = FLOW_METRICS) {
    for (const d of defs) this.register(d);
  }

  register(def: MetricDef): void {
    if (this.defs.has(def.key)) throw new Error(`metric already registered: ${def.key}`);
    this.defs.set(def.key, def);
  }

  get(key: string): MetricDef | undefined {
    return this.defs.get(key);
  }

  list(): MetricDef[] {
    return [...this.defs.values()];
  }

  keys(): Set<string> {
    return new Set(this.defs.keys());
  }

  run(widget: Widget, ctx: MetricContext): WidgetOutput {
    const def = this.defs.get(widget.metric);
    if (!def) return { widget, error: `Unknown metric "${widget.metric}".` };
    const groupBy = widget.groupBy ?? def.groupBys[0] ?? "none";
    if (!def.groupBys.includes(groupBy)) return { widget, error: `${def.label} cannot be grouped by ${groupBy}.` };
    try {
      return { widget, result: def.compute(ctx, widget.filters ?? {}, groupBy) };
    } catch (e) {
      return { widget, error: e instanceof Error ? e.message : String(e) };
    }
  }

  runDashboard(dashboard: Dashboard, ctx: MetricContext): WidgetOutput[] {
    return dashboard.widgets.map((w) => this.run(w, ctx));
  }
}
