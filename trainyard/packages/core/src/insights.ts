// Outcomes across systems. Delivery data lives in Jira; the evidence that the work changed
// anything lives elsewhere: the CRM, finance, the learning platform, vendors' surveys. This
// module keeps those sources as tables, defines measures over them (one source, or two
// combined, such as spend from finance over completions from the learning platform), groups
// them under each entity's objectives as outcomes (the change sought, mostly outside the
// delivery system) and KPIs (the health signals, often inside it), and rolls the lot up into
// the one-pager an executive or a board reads.

export type SourceKind = "crm" | "finance" | "lms" | "survey" | "vendor" | "jira" | "other";

export const SOURCE_KINDS: Record<SourceKind, { label: string; examples: string }> = {
  crm: { label: "CRM", examples: "Salesforce, HubSpot, Dynamics" },
  finance: { label: "Finance", examples: "ERP, budget and grant ledgers" },
  lms: { label: "Learning platform", examples: "LMS usage, enrolments, assessments" },
  survey: { label: "Survey", examples: "Follow-up and impact surveys" },
  vendor: { label: "Vendor feed", examples: "Partner and vendor reports" },
  jira: { label: "Jira / Azure DevOps", examples: "Delivery: releases, cycle time" },
  other: { label: "Other", examples: "Any table with a period column" },
};

export type Cell = string | number;

export interface DataSource {
  id: string;
  name: string;
  kind: SourceKind;
  /** The system it comes from, as people call it. */
  system: string;
  /** The column holding the period (YYYY-MM or YYYY-MM-DD; days roll up to months). */
  periodField: string;
  fields: string[];
  rows: Record<string, Cell>[];
  loadedAt: string;
  /** Who owns the data and answers for its quality. */
  owner?: string;
}

export interface Entity {
  id: string;
  name: string;
  parentId?: string;
}

export type Aggregate = "sum" | "avg" | "count" | "latest";

export type MeasureFormula =
  | { kind: "field"; sourceId: string; field: string; aggregate: Aggregate; where?: { field: string; in: string[] } }
  /** a ÷ b × scale, or a − b: measures combined across sources, period by period. */
  | { kind: "ratio" | "diff"; a: string; b: string; scale?: number };

export interface Measure {
  id: string;
  name: string;
  /** Outcome: the change sought. KPI: a health signal watched continuously. */
  role: "outcome" | "kpi";
  formula: MeasureFormula;
  unit: string;
  decimals?: number;
  higherIsBetter: boolean;
  target?: number;
  /** Where it should be and by when, in words: "65% by Q4". */
  targetLabel?: string;
  /** Why this is evidence of the outcome; what it does not prove. */
  rationale?: string;
}

export interface InsightObjective {
  id: string;
  entityId: string;
  title: string;
  outcomeIds: string[];
  kpiIds: string[];
}

/**
 * A funded initiative: a grant programme, a product, a campaign. What was committed, where
 * the money came from, what has been spent (typed in, or read from a finance source) and the
 * outcome measures that show what the funding bought.
 */
export interface Initiative {
  id: string;
  entityId: string;
  name: string;
  /** The objective it serves, if any. */
  objectiveId?: string;
  /** Grant, programme, product, campaign… in the organisation's words. */
  kind?: string;
  owner?: string;
  status: "proposed" | "funded" | "active" | "closed";
  /** Total committed, in the entity's currency. */
  committed: number;
  currency: string;
  /** Where the money comes from. */
  funders: { name: string; amount: number }[];
  start?: string;
  end?: string;
  /** Spend to date: a measure (sum of a finance column, cumulative) or a typed figure. */
  spendMeasureId?: string;
  spentManual?: number;
  outcomeIds: string[];
  notes?: string;
}

export interface InsightsState {
  entities: Entity[];
  sources: DataSource[];
  measures: Measure[];
  objectives: InsightObjective[];
  initiatives?: Initiative[];
  updatedAt: string;
}

export interface SeriesPoint {
  period: string;
  value: number;
}

export interface MeasureView {
  id: string;
  name: string;
  role: Measure["role"];
  unit: string;
  decimals: number;
  higherIsBetter: boolean;
  target?: number;
  targetLabel?: string;
  rationale?: string;
  series: SeriesPoint[];
  current: number | null;
  previous: number | null;
  first: number | null;
  /** current vs target, in the measure's own direction. */
  status: "on-target" | "off-target" | "no-target" | "no-data";
  /** current vs previous, good or bad in the measure's own direction. */
  trend: "better" | "worse" | "flat" | "none";
  /** The systems the figure is built from. */
  sources: { id: string; name: string; kind: SourceKind; system: string }[];
  error?: string;
}

const period = (v: Cell | undefined): string | null => {
  if (v === undefined || v === null) return null;
  const m = /^(\d{4})-(\d{2})/.exec(String(v).trim());
  return m ? `${m[1]}-${m[2]}` : null;
};

const num = (v: Cell | undefined): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v === undefined || v === null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/[$,%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** One measure's monthly series. Formulas may reference other measures (one level of nesting is plenty; cycles are errors). */
export function measureSeries(state: Pick<InsightsState, "sources" | "measures">, measureId: string, seen: Set<string> = new Set()): { series: SeriesPoint[]; sourceIds: string[] } {
  if (seen.has(measureId)) throw new Error(`measure "${measureId}" refers to itself`);
  const m = state.measures.find((x) => x.id === measureId);
  if (!m) throw new Error(`no measure "${measureId}"`);
  const f = m.formula;
  if (f.kind === "field") {
    const src = state.sources.find((s) => s.id === f.sourceId);
    if (!src) throw new Error(`no source "${f.sourceId}"`);
    const groups = new Map<string, number[]>();
    for (const row of src.rows) {
      const p = period(row[src.periodField]);
      if (!p) continue;
      if (f.where && !f.where.in.includes(String(row[f.where.field] ?? ""))) continue;
      const list = groups.get(p) ?? [];
      if (f.aggregate === "count") list.push(1);
      else {
        const v = num(row[f.field]);
        if (v === null) continue;
        list.push(v);
      }
      groups.set(p, list);
    }
    const series = [...groups.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([p, vs]) => ({ period: p, value: f.aggregate === "avg" ? vs.reduce((x, y) => x + y, 0) / vs.length : f.aggregate === "latest" ? vs[vs.length - 1]! : vs.reduce((x, y) => x + y, 0) }));
    return { series, sourceIds: [src.id] };
  }
  const next = new Set(seen).add(measureId);
  const a = measureSeries(state, f.a, next);
  const b = measureSeries(state, f.b, next);
  const bByPeriod = new Map(b.series.map((x) => [x.period, x.value]));
  const series: SeriesPoint[] = [];
  for (const pa of a.series) {
    const vb = bByPeriod.get(pa.period);
    if (vb === undefined) continue;
    if (f.kind === "ratio") {
      if (vb === 0) continue;
      series.push({ period: pa.period, value: (pa.value / vb) * (f.scale ?? 1) });
    } else series.push({ period: pa.period, value: (pa.value - vb) * (f.scale ?? 1) });
  }
  return { series, sourceIds: [...new Set([...a.sourceIds, ...b.sourceIds])] };
}

export function measureView(state: Pick<InsightsState, "sources" | "measures">, measureId: string): MeasureView {
  const m = state.measures.find((x) => x.id === measureId)!;
  const base = { id: m.id, name: m.name, role: m.role, unit: m.unit, decimals: m.decimals ?? 0, higherIsBetter: m.higherIsBetter, ...(m.target !== undefined ? { target: m.target } : {}), ...(m.targetLabel ? { targetLabel: m.targetLabel } : {}), ...(m.rationale ? { rationale: m.rationale } : {}) };
  try {
    const { series, sourceIds } = measureSeries(state, measureId);
    const current = series.at(-1)?.value ?? null;
    const previous = series.at(-2)?.value ?? null;
    const first = series[0]?.value ?? null;
    const good = (x: number, y: number) => (m.higherIsBetter ? x > y : x < y);
    const status: MeasureView["status"] = current === null ? "no-data" : m.target === undefined ? "no-target" : (m.higherIsBetter ? current >= m.target : current <= m.target) ? "on-target" : "off-target";
    const eps = Math.abs(previous ?? 0) * 0.005;
    const trend: MeasureView["trend"] = current === null || previous === null ? "none" : Math.abs(current - previous) <= eps ? "flat" : good(current, previous) ? "better" : "worse";
    const sources = sourceIds.map((id) => state.sources.find((s) => s.id === id)!).map((s) => ({ id: s.id, name: s.name, kind: s.kind, system: s.system }));
    return { ...base, series, current, previous, first, status, trend, sources };
  } catch (e) {
    return { ...base, series: [], current: null, previous: null, first: null, status: "no-data", trend: "none", sources: [], error: (e as Error).message };
  }
}

export function formatMeasure(v: number | null, unit: string, decimals = 0): string {
  if (v === null) return "–";
  const n = v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (unit === "$") return `$${n}`;
  if (unit === "%") return `${n}%`;
  return unit ? `${n} ${unit}` : n;
}

export interface InitiativeView {
  initiative: Initiative;
  entity: Entity;
  objective?: InsightObjective;
  /** Spend to date: the cumulative total of the spend measure, else the typed figure. */
  spent: number;
  spentFrom: "measure" | "manual" | "none";
  remaining: number;
  /** spent ÷ committed, 0–1 (can exceed 1). */
  burn: number;
  /** Months elapsed ÷ months planned, 0–1, when both dates are set. */
  elapsed: number | null;
  /** Burning faster than time passes by more than ten points. */
  pace: "ahead" | "on-pace" | "behind" | "unknown";
  funded: number;
  /** Committed minus what funders cover. */
  unfunded: number;
  outcomes: MeasureView[];
  /** Spend per unit of the first outcome, when both are counts: cost per completion, per investigator… */
  costPerOutcome: { measure: string; value: number; unit: string } | null;
}

export function initiativeView(state: InsightsState, id: string): InitiativeView {
  const initiative = (state.initiatives ?? []).find((i) => i.id === id);
  if (!initiative) throw new Error(`no initiative "${id}"`);
  const entity = state.entities.find((e) => e.id === initiative.entityId) ?? { id: initiative.entityId, name: initiative.entityId };
  const objective = state.objectives.find((o) => o.id === initiative.objectiveId);
  let spent = 0;
  let spentFrom: InitiativeView["spentFrom"] = "none";
  if (initiative.spendMeasureId) {
    const v = measureView(state, initiative.spendMeasureId);
    const from = initiative.start?.slice(0, 7);
    const to = initiative.end?.slice(0, 7);
    spent = v.series.filter((p) => (!from || p.period >= from) && (!to || p.period <= to)).reduce((n, p) => n + p.value, 0);
    spentFrom = v.series.length ? "measure" : "none";
  }
  if (spentFrom === "none" && initiative.spentManual !== undefined) {
    spent = initiative.spentManual;
    spentFrom = "manual";
  }
  const committed = initiative.committed;
  const burn = committed > 0 ? spent / committed : 0;
  let elapsed: number | null = null;
  if (initiative.start && initiative.end) {
    const s0 = Date.parse(initiative.start);
    const e0 = Date.parse(initiative.end);
    const now = Date.parse(state.updatedAt);
    if (e0 > s0) elapsed = Math.max(0, Math.min(1, (now - s0) / (e0 - s0)));
  }
  const pace: InitiativeView["pace"] = elapsed === null || spentFrom === "none" ? "unknown" : burn > elapsed + 0.1 ? "ahead" : burn < elapsed - 0.1 ? "behind" : "on-pace";
  const funded = initiative.funders.reduce((n, f) => n + f.amount, 0);
  const outcomes = initiative.outcomeIds.map((m) => measureView(state, m));
  const first = outcomes.find((o) => o.unit === "" && o.series.some((p) => p.value > 0));
  const total = first ? first.series.reduce((n, p) => n + p.value, 0) : 0;
  const costPerOutcome = first && total > 0 && spent > 0 ? { measure: first.name, value: spent / total, unit: initiative.currency } : null;
  return { initiative, entity, ...(objective ? { objective } : {}), spent, spentFrom, remaining: committed - spent, burn, elapsed, pace, funded, unfunded: Math.max(0, committed - funded), outcomes, costPerOutcome };
}

export interface OnePager {
  entity: Entity;
  /** The entity and everything under it. */
  scope: Entity[];
  period: string | null;
  objectives: { objective: InsightObjective; entity: Entity; outcomes: MeasureView[]; kpis: MeasureView[] }[];
  initiatives: InitiativeView[];
  funding: { committed: number; spent: number; funded: number; currency: string };
  totals: { outcomes: number; outcomesOnTarget: number; kpis: number; kpisOnTarget: number };
  sources: { id: string; name: string; kind: SourceKind; system: string; loadedAt: string; rows: number }[];
}

/** The executive one-pager for an entity: its objectives and those of every entity beneath it. */
export function onePager(state: InsightsState, entityId: string): OnePager {
  const entity = state.entities.find((e) => e.id === entityId);
  if (!entity) throw new Error(`no entity "${entityId}"`);
  const scope: Entity[] = [];
  const walk = (id: string) => {
    const e = state.entities.find((x) => x.id === id);
    if (!e) return;
    scope.push(e);
    for (const c of state.entities.filter((x) => x.parentId === id)) walk(c.id);
  };
  walk(entityId);
  const ids = new Set(scope.map((e) => e.id));
  const objectives = state.objectives
    .filter((o) => ids.has(o.entityId))
    .map((o) => ({ objective: o, entity: state.entities.find((e) => e.id === o.entityId)!, outcomes: o.outcomeIds.map((id) => measureView(state, id)), kpis: o.kpiIds.map((id) => measureView(state, id)) }));
  const initiatives = (state.initiatives ?? []).filter((i) => ids.has(i.entityId)).map((i) => initiativeView(state, i.id));
  const funding = { committed: initiatives.reduce((n, i) => n + i.initiative.committed, 0), spent: initiatives.reduce((n, i) => n + i.spent, 0), funded: initiatives.reduce((n, i) => n + i.funded, 0), currency: initiatives[0]?.initiative.currency ?? "USD" };
  const all = [...objectives.flatMap((o) => [...o.outcomes, ...o.kpis]), ...initiatives.flatMap((i) => i.outcomes)];
  const used = new Set(all.flatMap((m) => m.sources.map((s) => s.id)));
  const periods = all.map((m) => m.series.at(-1)?.period).filter((p): p is string => !!p).sort();
  return {
    entity,
    scope,
    period: periods.at(-1) ?? null,
    objectives,
    initiatives,
    funding,
    totals: {
      outcomes: objectives.reduce((n, o) => n + o.outcomes.length, 0),
      outcomesOnTarget: objectives.reduce((n, o) => n + o.outcomes.filter((m) => m.status === "on-target").length, 0),
      kpis: objectives.reduce((n, o) => n + o.kpis.length, 0),
      kpisOnTarget: objectives.reduce((n, o) => n + o.kpis.filter((m) => m.status === "on-target").length, 0),
    },
    sources: state.sources.filter((s) => used.has(s.id)).map((s) => ({ id: s.id, name: s.name, kind: s.kind, system: s.system, loadedAt: s.loadedAt, rows: s.rows.length })),
  };
}

/** Problems a reviewer would raise: measures that fail, objectives without outcomes, sources nothing uses. */
export function insightIssues(state: InsightsState): string[] {
  const out: string[] = [];
  for (const m of state.measures) {
    const v = measureView(state, m.id);
    if (v.error) out.push(`${m.name}: ${v.error}`);
    else if (!v.series.length) out.push(`${m.name} has no data yet.`);
  }
  for (const o of state.objectives) if (!o.outcomeIds.length) out.push(`"${o.title}" has no outcome measure: activity alone does not show it worked.`);
  const used = new Set(state.measures.flatMap((m) => (m.formula.kind === "field" ? [m.formula.sourceId] : [])));
  for (const s of state.sources) if (!used.has(s.id)) out.push(`${s.name} is loaded but no measure uses it.`);
  for (const i of state.initiatives ?? []) {
    const v = initiativeView(state, i.id);
    if (!i.outcomeIds.length && i.status !== "proposed") out.push(`${i.name}: funding tracked, but no outcome measure says what it bought.`);
    if (v.unfunded > 0) out.push(`${i.name}: ${v.unfunded.toLocaleString()} ${i.currency} of the commitment has no funder yet.`);
    if (v.burn > 1) out.push(`${i.name} has spent more than was committed.`);
  }
  return out;
}

// ---- test data ---------------------------------------------------------------------------

/**
 * Illustrative test data: free online learning modules for clinicians in low- and
 * middle-income countries, and a foundation's young-investigator grants. Every figure is made
 * up to demonstrate the method; replace the sources with real extracts.
 */
export function demoInsights(now = "2026-10-21T12:00:00.000Z"): InsightsState {
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(Date.UTC(2025, 10 + i, 1));
    months.push(d.toISOString().slice(0, 7));
  }
  const groups = [
    { g: "Low income", w: 0.22 },
    { g: "Lower-middle income", w: 0.43 },
    { g: "Upper-middle income", w: 0.35 },
  ];
  const lms: Record<string, Cell>[] = [];
  const crm: Record<string, Cell>[] = [];
  const finance: Record<string, Cell>[] = [];
  const survey: Record<string, Cell>[] = [];
  const jira: Record<string, Cell>[] = [];
  const grants: Record<string, Cell>[] = [];
  months.forEach((month, i) => {
    const growth = 1 + i * 0.055;
    for (const { g, w } of groups) {
      const active = Math.round(4200 * w * growth * (1 + ((i * 7) % 5) * 0.01));
      const enrol = Math.round(active * 0.42);
      const completionRate = 0.38 + i * 0.012 + (g === "Low income" ? -0.04 : 0);
      lms.push({
        month,
        income_group: g,
        active_learners: active,
        learning_hours: Math.round(active * (2.6 + i * 0.05)),
        enrolments: enrol,
        completions: Math.round(enrol * completionRate),
        pre_test_score: +(54 + (g === "Low income" ? -3 : 0) + (i % 3) * 0.4).toFixed(1),
        post_test_score: +(68 + i * 0.55 + (g === "Low income" ? -2 : 0)).toFixed(1),
      });
      crm.push({
        month,
        income_group: g,
        new_registrations: Math.round(active * 0.16),
        clinician_registrations: Math.round(active * 0.16 * (0.61 + i * 0.006)),
        institutions_engaged: Math.round((38 + i * 3.4) * w * 3),
      });
    }
    finance.push({ month, programme_spend: Math.round(118000 + i * 2600 + (i % 4) * 1500), translation_spend: i % 3 === 0 ? 24000 : 6000 });
    const responses = Math.round(310 + i * 22);
    survey.push({ month, vendor: "Impact survey partner", responses, practice_change_reported: Math.round(responses * (0.29 + i * 0.011)), guideline_applied: Math.round(responses * (0.22 + i * 0.009)) });
    jira.push({ month, modules_released: 2 + (i % 3 === 2 ? 2 : 1), translations_released: i % 2 === 0 ? 3 : 1, cycle_time_days: +(19 - i * 0.6 + (i % 2) * 1.2).toFixed(1) });
    grants.push({ month, grants_awarded: i % 6 === 0 ? 14 : 0, grant_dollars: i % 6 === 0 ? 700_000 : 0, investigators_retained: +(82 + i * 0.6).toFixed(1), follow_on_funding: Math.round(2_100_000 + i * 240_000) });
  });
  const src = (id: string, name: string, kind: SourceKind, system: string, rows: Record<string, Cell>[], owner: string): DataSource => ({ id, name, kind, system, periodField: "month", fields: Object.keys(rows[0]!), rows, loadedAt: now, owner });
  const lmic = { field: "income_group", in: ["Low income", "Lower-middle income"] };
  const field = (sourceId: string, f: string, aggregate: Aggregate = "sum", where?: { field: string; in: string[] }): MeasureFormula => ({ kind: "field", sourceId, field: f, aggregate, ...(where ? { where } : {}) });
  return {
    entities: [
      { id: "org", name: "Organisation (all entities)" },
      { id: "education", name: "Global Education", parentId: "org" },
      { id: "foundation", name: "Foundation", parentId: "org" },
    ],
    sources: [
      src("lms", "Learning platform", "lms", "LMS export", lms, "Education technology"),
      src("crm", "Learner profiles", "crm", "CRM", crm, "Membership and CRM"),
      src("finance", "Programme ledger", "finance", "Finance / ERP", finance, "Finance"),
      src("survey", "Follow-up impact survey", "survey", "Survey vendor", survey, "Evaluation partner"),
      src("jira", "Module delivery", "jira", "Jira", jira, "Education ART"),
      src("grants", "Grants ledger", "finance", "Grants system", grants, "Foundation operations"),
    ],
    measures: [
      // building blocks
      { id: "m-active", name: "Active learners", role: "kpi", formula: field("lms", "active_learners"), unit: "", higherIsBetter: true, target: 5500, targetLabel: "5,500 a month by Q4", rationale: "Reach. Says people came, not that they learned." },
      { id: "m-hours", name: "Learning hours", role: "kpi", formula: field("lms", "learning_hours"), unit: "h", higherIsBetter: true, rationale: "Engagement. Time spent is effort, not outcome." },
      { id: "m-enrol", name: "Enrolments", role: "kpi", formula: field("lms", "enrolments"), unit: "", higherIsBetter: true },
      { id: "m-compl", name: "Completions", role: "kpi", formula: field("lms", "completions"), unit: "", higherIsBetter: true },
      { id: "m-completion-rate", name: "Completion rate", role: "kpi", formula: { kind: "ratio", a: "m-compl", b: "m-enrol", scale: 100 }, unit: "%", decimals: 1, higherIsBetter: true, target: 50, targetLabel: "50% by Q4", rationale: "Learners who finish a module, the precondition for any learning effect." },
      { id: "m-pre", name: "Pre-test score", role: "kpi", formula: field("lms", "pre_test_score", "avg"), unit: "pts", decimals: 1, higherIsBetter: true },
      { id: "m-post", name: "Post-test score", role: "kpi", formula: field("lms", "post_test_score", "avg"), unit: "pts", decimals: 1, higherIsBetter: true },
      { id: "m-gain", name: "Knowledge gain (post − pre)", role: "outcome", formula: { kind: "diff", a: "m-post", b: "m-pre" }, unit: "pts", decimals: 1, higherIsBetter: true, target: 18, targetLabel: "+18 points by Q4", rationale: "Learning: what learners know after a module that they did not before." },
      { id: "m-lmic-reach", name: "Clinicians reached in low and lower-middle income countries", role: "outcome", formula: field("crm", "clinician_registrations", "sum", lmic), unit: "", higherIsBetter: true, target: 520, targetLabel: "520 new a month by Q4", rationale: "Equity of reach: the people the free modules exist for." },
      { id: "m-responses", name: "Survey responses", role: "kpi", formula: field("survey", "responses"), unit: "", higherIsBetter: true },
      { id: "m-practice-n", name: "Practice change reported (count)", role: "kpi", formula: field("survey", "practice_change_reported"), unit: "", higherIsBetter: true },
      { id: "m-practice", name: "Learners reporting a change in practice", role: "outcome", formula: { kind: "ratio", a: "m-practice-n", b: "m-responses", scale: 100 }, unit: "%", decimals: 1, higherIsBetter: true, target: 40, targetLabel: "40% at 3-month follow-up", rationale: "Behaviour: the closest evidence to better care. Self-reported; validate with a sample." },
      { id: "m-spend", name: "Programme spend", role: "kpi", formula: field("finance", "programme_spend"), unit: "$", higherIsBetter: false },
      { id: "m-cost-completion", name: "Cost per completion", role: "kpi", formula: { kind: "ratio", a: "m-spend", b: "m-compl" }, unit: "$", decimals: 2, higherIsBetter: false, target: 70, targetLabel: "under $70 by Q4", rationale: "Efficiency across finance and the learning platform." },
      { id: "m-modules", name: "Modules and translations released", role: "kpi", formula: field("jira", "modules_released"), unit: "", higherIsBetter: true, rationale: "Delivery output from Jira: necessary, not sufficient." },
      { id: "m-cycle", name: "Module cycle time", role: "kpi", formula: field("jira", "cycle_time_days", "avg"), unit: "days", decimals: 1, higherIsBetter: false, target: 14, targetLabel: "14 days", rationale: "Flow: how quickly a new module goes from idea to learners." },
      { id: "m-grant-spend", name: "Grant disbursements", role: "kpi", formula: field("grants", "grant_dollars"), unit: "$", higherIsBetter: false, rationale: "Money out of the door to investigators, by month." },
      { id: "m-grants-awarded", name: "Grants awarded", role: "kpi", formula: field("grants", "grants_awarded"), unit: "", higherIsBetter: true },
      { id: "m-retained", name: "Funded investigators still in research", role: "outcome", formula: field("grants", "investigators_retained", "latest"), unit: "%", higherIsBetter: true, target: 90, targetLabel: "90% at five years", rationale: "Career outcome of the young-investigator grants." },
      { id: "m-follow-on", name: "Follow-on funding secured by grantees", role: "outcome", formula: field("grants", "follow_on_funding", "latest"), unit: "$", higherIsBetter: true, target: 4_000_000, targetLabel: "$4M cumulative", rationale: "Leverage: other funders backing the same researchers." },
    ],
    initiatives: [
      {
        id: "init-modules",
        entityId: "education",
        name: "Free learning modules for LMIC clinicians",
        objectiveId: "obj-learn",
        kind: "Programme",
        owner: "Director, Global Education",
        status: "active",
        committed: 1_800_000,
        currency: "USD",
        funders: [
          { name: "Core budget", amount: 1_000_000 },
          { name: "Industry education grant", amount: 500_000 },
          { name: "Foundation partner", amount: 300_000 },
        ],
        start: "2025-11-01",
        end: "2026-10-31",
        spendMeasureId: "m-spend",
        outcomeIds: ["m-compl", "m-practice", "m-lmic-reach"],
        notes: "Translation costs land every third month.",
      },
      {
        id: "init-yia",
        entityId: "foundation",
        name: "Young Investigator Awards 2026",
        objectiveId: "obj-grants",
        kind: "Grant programme",
        owner: "Foundation grants committee",
        status: "funded",
        committed: 2_800_000,
        currency: "USD",
        funders: [
          { name: "Endowment", amount: 1_600_000 },
          { name: "Named donor fund", amount: 900_000 },
        ],
        start: "2025-11-01",
        end: "2027-10-31",
        spendMeasureId: "m-grant-spend",
        outcomeIds: ["m-grants-awarded", "m-retained", "m-follow-on"],
        notes: "Two award rounds a year; 14 investigators each.",
      },
      {
        id: "init-portal",
        entityId: "education",
        name: "Learner portal redesign",
        kind: "Product",
        owner: "Education ART",
        status: "proposed",
        committed: 420_000,
        currency: "USD",
        funders: [],
        start: "2027-01-01",
        end: "2027-06-30",
        outcomeIds: [],
      },
    ],
    objectives: [
      { id: "obj-learn", entityId: "education", title: "Improve cancer care in low- and middle-income countries through free learning", outcomeIds: ["m-gain", "m-practice", "m-lmic-reach"], kpiIds: ["m-active", "m-completion-rate", "m-cost-completion", "m-cycle"] },
      { id: "obj-grants", entityId: "foundation", title: "Grow the next generation of cancer researchers", outcomeIds: ["m-retained", "m-follow-on"], kpiIds: [] },
    ],
    updatedAt: now,
  };
}
