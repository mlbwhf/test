// Portfolio metrics for the dashboard engine. They read workspace.portfolio and, for
// metric-linked key results, call back into the registry through ctx.extensions.readMetric.

import type { MetricContext, MetricDef } from "./metrics.js";
import { budgetLines, okrProgress, rankEpics, wsjf, type Portfolio } from "./portfolio.js";

export type ReadMetric = (key: string, filters?: Record<string, unknown>) => number | null;

function portfolio(ctx: MetricContext): Portfolio {
  const p = ctx.workspace.portfolio;
  if (!p) throw new Error("This workspace has no portfolio yet.");
  return p;
}

export const PORTFOLIO_METRICS: MetricDef[] = [
  {
    key: "budget-used",
    label: "Budget planned",
    description: "Planned epic spend as a share of each value stream's budget for the selected increment.",
    category: "planning",
    groupBys: ["none"],
    compute(ctx, f) {
      const p = portfolio(ctx);
      const ws = ctx.workspace;
      const inc = f.incrementId ? ws.increments.find((i) => i.id === f.incrementId) : ws.increments[ws.increments.length - 1];
      if (!inc) return { value: null, unit: "percent", points: [] };
      const lines = budgetLines(p, [inc]);
      const budget = lines.reduce((s, l) => s + l.budget, 0);
      const planned = lines.reduce((s, l) => s + l.planned, 0);
      return {
        value: budget > 0 ? Math.round((planned / budget) * 1000) / 10 : null,
        unit: "percent",
        points: lines.map((l) => ({ label: p.valueStreams.find((v) => v.id === l.valueStreamId)?.name ?? l.valueStreamId, value: l.plannedPercent ?? 0 })),
        note: `${inc.name}: ${planned.toLocaleString("en-US")} planned of ${budget.toLocaleString("en-US")} ${p.currency}.`,
      };
    },
  },
  {
    key: "epic-wsjf",
    label: "Epics by WSJF",
    description: "Open epics ranked by weighted shortest job first.",
    category: "planning",
    groupBys: ["none"],
    compute(ctx) {
      const p = portfolio(ctx);
      const ranked = rankEpics(p.epics);
      return { value: ranked.length, unit: "count", points: ranked.slice(0, 10).map((e) => ({ label: e.title, value: wsjf(e.wsjf) })), note: "Headline counts open epics. Points show the WSJF score." };
    },
  },
  {
    key: "okr-progress",
    label: "OKR progress",
    description: "Average key-result progress from baseline to target, per objective.",
    category: "planning",
    groupBys: ["none"],
    compute(ctx, f) {
      const p = portfolio(ctx);
      const read = (ctx.extensions.readMetric as ReadMetric | undefined) ?? (() => null);
      const okrs = p.okrs.filter((o) => !f.incrementId || !o.incrementId || o.incrementId === f.incrementId);
      const points = okrs.flatMap((o) => {
        const pr = okrProgress(o, read);
        return pr.percent === null ? [] : [{ label: o.title, value: pr.percent }];
      });
      const avg = points.length ? Math.round(points.reduce((s, x) => s + x.value, 0) / points.length) : null;
      return { value: avg, unit: "percent", points, note: "Only objectives with a measured key result count." };
    },
  },
];
