// Lean portfolio: value streams with a budget per increment, epics ranked by WSJF and
// funded from those budgets, guardrails on how the money is spent, and OKRs whose key
// results are either typed in by hand or read from a metric. Pure functions over the
// Portfolio data kept on the workspace.

import type { Increment, WorkItem } from "./model.js";

export type EpicState = "funnel" | "reviewing" | "analyzing" | "backlog" | "implementing" | "done";
export const EPIC_STATES: EpicState[] = ["funnel", "reviewing", "analyzing", "backlog", "implementing", "done"];

export interface Wsjf {
  /** Relative sizes, 1–20. Fibonacci-like values are usual but not required. */
  userBusinessValue: number;
  timeCriticality: number;
  riskReductionOpportunity: number;
  jobSize: number;
}

export interface EpicSpend {
  incrementId: string;
  planned: number;
  actual?: number;
}

export interface PortfolioEpic {
  id: string;
  /** Work item at the epic level this funds, when it exists. */
  itemId?: string;
  title: string;
  valueStreamId: string;
  state: EpicState;
  ownerId?: string;
  hypothesis?: string;
  /** Business epic or enabler epic; absent means business. */
  kind?: "business" | "enabler";
  /** The future-state portfolio canvas this epic was identified from. */
  sourceCanvasId?: string;
  wsjf: Wsjf;
  /** Features and enablers fall out of the linked work item; this is the money side. */
  spend: EpicSpend[];
}

export interface Guardrails {
  /** Share of a value stream's finished work that must be enablers (capacity allocation). */
  minEnablerPercent?: number;
  /** No single epic may take more than this share of an increment's budget. */
  maxEpicBudgetPercent?: number;
  /** Epics above this planned cost need a Lean business case before "backlog". */
  businessCaseAbove?: number;
}

export interface ValueStream {
  id: string;
  name: string;
  portfolioId: string;
  /** Budget per increment id, in the portfolio currency. */
  budgets: Record<string, number>;
  guardrails: Guardrails;
  /** Trains that deliver for this value stream. */
  groupIds: string[];
}

export interface KeyResult {
  id: string;
  title: string;
  baseline: number;
  target: number;
  current?: number;
  /** When set, current is read from this metric instead of typed in. */
  metric?: { key: string; filters?: Record<string, unknown> };
}

export interface Okr {
  id: string;
  title: string;
  level: "portfolio" | "group" | "team";
  /** Group or team id this OKR belongs to; omitted at portfolio level. */
  ownerGroupId?: string;
  ownerId?: string;
  incrementId?: string;
  keyResults: KeyResult[];
}

export interface Portfolio {
  currency: string;
  valueStreams: ValueStream[];
  epics: PortfolioEpic[];
  okrs: Okr[];
}

export function emptyPortfolio(currency = "USD"): Portfolio {
  return { currency, valueStreams: [], epics: [], okrs: [] };
}

/** Weighted shortest job first: cost of delay over job size. */
export function wsjf(w: Wsjf): number {
  if (w.jobSize <= 0) return 0;
  return Math.round(((w.userBusinessValue + w.timeCriticality + w.riskReductionOpportunity) / w.jobSize) * 100) / 100;
}

/** Epics that are still candidates, highest WSJF first. Ties keep the smaller job first. */
export function rankEpics(epics: readonly PortfolioEpic[]): PortfolioEpic[] {
  return epics
    .filter((e) => e.state !== "done")
    .map((e) => ({ e, score: wsjf(e.wsjf) }))
    .sort((a, b) => b.score - a.score || a.e.wsjf.jobSize - b.e.wsjf.jobSize)
    .map((x) => x.e);
}

export interface BudgetLine {
  valueStreamId: string;
  incrementId: string;
  budget: number;
  planned: number;
  actual: number;
  /** planned / budget as a percentage; null when no budget is set. */
  plannedPercent: number | null;
  state: "ok" | "near" | "over" | "unfunded";
}

export function budgetLines(portfolio: Portfolio, increments: readonly Increment[]): BudgetLine[] {
  const lines: BudgetLine[] = [];
  for (const vs of portfolio.valueStreams) {
    for (const inc of increments) {
      const epics = portfolio.epics.filter((e) => e.valueStreamId === vs.id);
      const spend = epics.flatMap((e) => e.spend.filter((s) => s.incrementId === inc.id));
      const planned = spend.reduce((s, x) => s + x.planned, 0);
      const actual = spend.reduce((s, x) => s + (x.actual ?? 0), 0);
      const budget = vs.budgets[inc.id] ?? 0;
      const pct = budget > 0 ? Math.round((planned / budget) * 1000) / 10 : null;
      const state: BudgetLine["state"] = budget <= 0 ? (planned > 0 ? "unfunded" : "ok") : planned > budget ? "over" : planned >= budget * 0.9 ? "near" : "ok";
      lines.push({ valueStreamId: vs.id, incrementId: inc.id, budget, planned, actual, plannedPercent: pct, state });
    }
  }
  return lines;
}

export interface GuardrailBreach {
  valueStreamId: string;
  rule: keyof Guardrails;
  message: string;
  epicId?: string;
}

/** Check every value stream's guardrails for one increment. */
export function checkGuardrails(portfolio: Portfolio, increment: Increment, items: readonly WorkItem[]): GuardrailBreach[] {
  const out: GuardrailBreach[] = [];
  const iterIds = new Set(increment.iterations.map((i) => i.id));
  for (const vs of portfolio.valueStreams) {
    const epics = portfolio.epics.filter((e) => e.valueStreamId === vs.id);
    const g = vs.guardrails;
    const budget = vs.budgets[increment.id] ?? 0;
    if (g.maxEpicBudgetPercent !== undefined && budget > 0) {
      for (const e of epics) {
        const planned = e.spend.filter((s) => s.incrementId === increment.id).reduce((s, x) => s + x.planned, 0);
        const pct = (planned / budget) * 100;
        if (pct > g.maxEpicBudgetPercent) {
          out.push({ valueStreamId: vs.id, rule: "maxEpicBudgetPercent", epicId: e.id, message: `"${e.title}" takes ${Math.round(pct)}% of the ${increment.name} budget; the limit is ${g.maxEpicBudgetPercent}%.` });
        }
      }
    }
    if (g.businessCaseAbove !== undefined) {
      for (const e of epics) {
        const total = e.spend.reduce((s, x) => s + x.planned, 0);
        const pastReview = ["backlog", "implementing", "done"].includes(e.state);
        if (total > g.businessCaseAbove && pastReview && !e.hypothesis) {
          out.push({ valueStreamId: vs.id, rule: "businessCaseAbove", epicId: e.id, message: `"${e.title}" is planned at ${total} with no Lean business case (hypothesis).` });
        }
      }
    }
    if (g.minEnablerPercent !== undefined) {
      const epicItemIds = new Set(epics.flatMap((e) => (e.itemId ? [e.itemId] : [])));
      // Items whose ancestor at any depth is one of the value stream's epics.
      const byId = new Map(items.map((i) => [i.id, i]));
      const underEpic = (it: WorkItem): boolean => {
        let cur: WorkItem | undefined = it;
        for (let n = 0; cur && n < 10; n++) {
          if (epicItemIds.has(cur.id)) return true;
          cur = cur.parentId ? byId.get(cur.parentId) : undefined;
        }
        return false;
      };
      const done = items.filter((i) => i.status === "done" && i.iterationId && iterIds.has(i.iterationId) && underEpic(i));
      if (done.length >= 5) {
        const enablers = done.filter((i) => i.flowType === "enabler").length;
        const pct = (enablers / done.length) * 100;
        if (pct < g.minEnablerPercent) {
          out.push({ valueStreamId: vs.id, rule: "minEnablerPercent", message: `${Math.round(pct)}% of finished work in ${increment.name} was enablers; the floor is ${g.minEnablerPercent}%.` });
        }
      }
    }
  }
  return out;
}

export interface KeyResultProgress {
  keyResult: KeyResult;
  current: number | null;
  /** 0–100, clamped. Null when nothing has been measured. */
  percent: number | null;
}

export interface OkrProgress {
  okr: Okr;
  keyResults: KeyResultProgress[];
  /** Average over measured key results. */
  percent: number | null;
}

/** Progress for one OKR. `readMetric` resolves metric-linked key results and may return null. */
export function okrProgress(okr: Okr, readMetric: (key: string, filters?: Record<string, unknown>) => number | null): OkrProgress {
  const keyResults = okr.keyResults.map((kr): KeyResultProgress => {
    const current = kr.metric ? readMetric(kr.metric.key, kr.metric.filters) : (kr.current ?? null);
    if (current === null || kr.target === kr.baseline) return { keyResult: kr, current, percent: null };
    const raw = ((current - kr.baseline) / (kr.target - kr.baseline)) * 100;
    return { keyResult: kr, current, percent: Math.round(Math.max(0, Math.min(100, raw))) };
  });
  const measured = keyResults.filter((k) => k.percent !== null);
  return { okr, keyResults, percent: measured.length ? Math.round(measured.reduce((s, k) => s + k.percent!, 0) / measured.length) : null };
}
