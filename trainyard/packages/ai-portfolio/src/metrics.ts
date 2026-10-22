// AI metrics for the dashboard engine. They read the AI portfolio from
// ctx.extensions.ai, so the core registry stays unaware of AI.

import type { MetricContext, MetricDef, OperatingModel } from "@trainyard/core";
import { STAGES, STAGE_LABELS, evaluateGate, spendSummary, valueRealised, type Agent, type Initiative } from "./portfolio.js";

export interface AiPortfolio {
  model: OperatingModel;
  initiatives: Initiative[];
  agents: Agent[];
}

function portfolio(ctx: MetricContext): AiPortfolio {
  const ai = ctx.extensions.ai as AiPortfolio | undefined;
  if (!ai) throw new Error("No AI portfolio data in this workspace.");
  return ai;
}

const live = (i: Initiative) => i.stage !== "retired";

export const AI_METRICS: MetricDef[] = [
  {
    key: "ai-stage-mix",
    label: "AI initiatives by stage",
    description: "How many AI initiatives sit in each lifecycle stage.",
    category: "ai",
    groupBys: ["none"],
    compute(ctx) {
      const { initiatives } = portfolio(ctx);
      return {
        value: initiatives.filter(live).length,
        unit: "count",
        points: STAGES.filter((s) => s !== "retired").map((s) => ({ label: STAGE_LABELS[s], value: initiatives.filter((i) => i.stage === s).length })),
        note: "Headline counts initiatives that are not retired.",
      };
    },
  },
  {
    key: "ai-risk-mix",
    label: "AI initiatives by risk tier",
    description: "AI initiatives by EU AI Act risk tier.",
    category: "ai",
    groupBys: ["none"],
    compute(ctx) {
      const { initiatives } = portfolio(ctx);
      const tiers = ["high", "limited", "minimal", "prohibited"] as const;
      const l = initiatives.filter(live);
      return { value: l.filter((i) => i.riskTier === "high").length, unit: "count", points: tiers.map((t) => ({ label: t, value: l.filter((i) => i.riskTier === t).length })), note: "Headline counts high-risk initiatives." };
    },
  },
  {
    key: "ai-spend",
    label: "AI spend this month",
    description: "Spend so far this month per initiative, against its monthly budget.",
    category: "ai",
    groupBys: ["none"],
    compute(ctx) {
      const { initiatives } = portfolio(ctx);
      const rows = initiatives.filter(live).map((i) => ({ i, s: spendSummary(i, ctx.now) }));
      const total = rows.reduce((a, r) => a + r.s.spent, 0);
      const watch = rows.filter((r) => r.s.state !== "ok").map((r) => r.i.name);
      return {
        value: total,
        unit: "currency",
        points: rows.map((r) => ({ label: r.i.name, value: r.s.spent })),
        note: watch.length ? `On track to pass budget: ${watch.join(", ")}.` : "Every initiative is within budget.",
      };
    },
  },
  {
    key: "ai-value-realised",
    label: "AI value realised",
    description: "Progress from KPI baseline to target, per initiative.",
    category: "ai",
    groupBys: ["none"],
    compute(ctx) {
      const { initiatives } = portfolio(ctx);
      const points = initiatives.flatMap((i) => {
        const v = valueRealised(i);
        return v === null ? [] : [{ label: i.name, value: v }];
      });
      const avg = points.length ? Math.round(points.reduce((a, p) => a + p.value, 0) / points.length) : null;
      return { value: avg, unit: "percent", points, note: "Only initiatives with a measured KPI count." };
    },
  },
  {
    key: "ai-gate-blocked",
    label: "Blocked at next gate",
    description: "Initiatives whose next stage gate has open blockers.",
    category: "ai",
    groupBys: ["none"],
    compute(ctx) {
      const { initiatives, agents, model } = portfolio(ctx);
      const points = initiatives
        .filter((i) => live(i) && i.stage !== "monitor")
        .map((i) => {
          const next = STAGES[STAGES.indexOf(i.stage) + 1]!;
          return { label: i.name, value: evaluateGate(i, next, { model, agents }).blockers.length };
        });
      return { value: points.filter((p) => p.value > 0).length, unit: "count", points, note: "Points show the number of open blockers per initiative." };
    },
  },
  {
    key: "agents-on-teams",
    label: "Agents on teams",
    description: "Active AI agents working as part of each team.",
    category: "ai",
    groupBys: ["team"],
    compute(ctx) {
      const { agents } = portfolio(ctx);
      const active = agents.filter((a) => a.status === "active");
      const points = ctx.workspace.teams.map((t) => ({ label: t.name, value: active.filter((a) => a.teamId === t.id).length }));
      return { value: active.length, unit: "count", points };
    },
  },
];
