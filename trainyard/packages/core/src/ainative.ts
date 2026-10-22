// AI-Native ART: what changes from classic SAFe, as data and rules. Outcomes are the spine
// (portfolio → ART → PI → team, each an OKR tagged moonshot or roofshot); outputs hang off
// them (experiments and prototypes learn, features and enablers deliver value) and move
// through the AI innovation pipeline (discover → specify → build → validate → release or
// concluded) behind gates; intent, specifications and context are versioned records whose
// changes propagate; curated data is a register with quality scores; Sense and Respond runs
// every iteration on data the tool pulls, and the assessment of the twelve success factors
// becomes a living launch plan. Rules the framework states are enforced here; the rest is
// configurable per ART.
//
// Confirmed items follow the framework article; items marked (unconfirmed) in comments come
// from the masterclass reading and are soft: warnings, defaults, never hard blocks.

import type { OutcomeKeyResult, Outcome, PlanningSession } from "./outcomes.js";

// ---- outcomes: the spine ------------------------------------------------------------------

export type Ambition = "moonshot" | "roofshot";
export type OutcomeStatus = "draft" | "committed" | "active" | "achieved" | "missed" | "retired";

/** Extra fields an AI-Native outcome carries beyond the planning session's Outcome. */
export interface OutcomeExtras {
  ambition?: Ambition;
  status?: OutcomeStatus;
  owner?: string;
  approver?: string;
  horizon?: "year" | "strategic-cycle" | "pi";
}

export type AiOutcome = Outcome & OutcomeExtras;

/** Soft check: an outcome states a result, not a mechanism. (Soft warning with an explainer, never a block.) */
const MECHANISM = /\b(move the|redesign|rebuild|refactor|add a button|button|link higher|migrate to|implement|deploy|install|upgrade to)\b/i;
export function outcomeWording(o: Outcome): string | null {
  if (MECHANISM.test(o.title)) return `"${o.title}" reads like a mechanism. Outcomes state the result; the mechanism belongs on an output item.`;
  return null;
}

/** 2–5 key results, balanced; outside that range is a warning. (Range unconfirmed.) */
export function keyResultCheck(o: Outcome): string | null {
  if (o.keyResults.length === 0) return `"${o.title}" has no key result.`;
  if (o.keyResults.length === 1) return `"${o.title}" has one key result; a balanced set is two to five.`;
  if (o.keyResults.length > 5) return `"${o.title}" has ${o.keyResults.length} key results; more than five dilutes focus.`;
  return null;
}

/** Progress of a key result from baseline to target, 0–1, when the three parse as numbers. */
export function krProgress(kr: OutcomeKeyResult & { baseline?: string }): number | null {
  const n = (x?: string) => (x === undefined ? NaN : parseFloat(x.replace(/[^0-9.-]/g, "")));
  const b = n(kr.baseline);
  const t = n(kr.target);
  const c = n(kr.current);
  if (!Number.isFinite(t) || !Number.isFinite(c)) return null;
  const base = Number.isFinite(b) ? b : 0;
  if (t === base) return c >= t ? 1 : 0;
  return Math.max(0, Math.min(1, (c - base) / (t - base)));
}

// ---- outputs and the pipeline -----------------------------------------------------------

export type OutputType = "experiment" | "prototype" | "feature" | "enabler";
export type ValueCategory = "learning" | "value";
export type Stage = "discover" | "specify" | "build" | "validate" | "release" | "concluded" | "discarded";
export type Disposition = "pending" | "released" | "discarded" | "superseded";

export const VALUE_CATEGORY: Record<OutputType, ValueCategory> = { experiment: "learning", prototype: "learning", feature: "value", enabler: "value" };
export const STAGES: Stage[] = ["discover", "specify", "build", "validate", "release", "concluded", "discarded"];
export const PIPELINE: Stage[] = ["discover", "specify", "build", "validate", "release"];

export interface MetricLink {
  /** A key result id on an outcome, or a free-standing granular metric. */
  keyResultId?: string;
  name?: string;
  /** How this output is expected to move it. */
  expected?: string;
}

export interface Output {
  id: string;
  type: OutputType;
  title: string;
  teamId: string;
  iteration: number;
  /** At least one outcome; the link is what makes prioritisation defensible. */
  outcomeIds: string[];
  /** Required before leaving Specify: no output without a metric. */
  metrics: MetricLink[];
  stage: Stage;
  stageHistory: { stage: Stage; at: string; by?: string }[];
  intentId?: string;
  specId?: string;
  contextId?: string;
  dataAssetIds?: string[];
  /** Required for learning items. */
  hypothesis?: string;
  /** Captured at Validate for learning items. */
  uncertaintyReduced?: string;
  disposition: Disposition;
  discardReason?: string;
  /** A/B tests are the learning items that may release. */
  abTest?: boolean;
  aiCostEstimate?: number;
  aiCostActual?: number;
  /** The workflow the cost is attributed to (so variance has a cause). */
  workflow?: string;
  /** The named approver: review capacity is the ART's real constraint. */
  verificationOwner?: string;
  verificationEvidence?: string;
  /** Review queue timestamps: entered Validate, approved. */
  reviewStartedAt?: string;
  reviewedAt?: string;
  /** Customer-facing AI: disclosure to the customer. */
  disclosure?: string;
}

export interface GateResult {
  ok: boolean;
  /** Why the transition is blocked, in the words of the rule. */
  reasons: string[];
  /** Where it would go. */
  to: Stage;
}

/** The next stage on the pipeline for an output, by its category. */
export function nextStage(o: Output): Stage | null {
  const i = PIPELINE.indexOf(o.stage);
  if (i < 0) return null;
  if (o.stage === "validate") return VALUE_CATEGORY[o.type] === "value" || o.abTest ? "release" : "concluded";
  if (o.stage === "release") return null;
  return PIPELINE[i + 1] ?? null;
}

/** Gates between stages. Discard is allowed from anywhere and needs only a reason. */
export function gate(o: Output, ctx: { intents: IntentRecord[]; specs: SpecificationRecord[] }): GateResult {
  const to = nextStage(o);
  if (!to) return { ok: false, reasons: ["Nothing follows this stage."], to: o.stage };
  const reasons: string[] = [];
  if (o.stage === "discover") {
    if (!o.outcomeIds.length) reasons.push("Link at least one outcome: the link is what makes the work defensible.");
    if (VALUE_CATEGORY[o.type] === "learning" && !o.hypothesis?.trim()) reasons.push("A learning item needs a hypothesis.");
  }
  if (o.stage === "specify") {
    if (!o.metrics.length) reasons.push("No output leaves Specify without a metric it should move.");
    if (!o.specId) reasons.push("Point at a specification record.");
    const spec = o.specId ? ctx.specs.find((s) => s.id === o.specId) : undefined;
    if (spec?.reviewRequired) reasons.push("The specification is marked for review after an intent change; clear the review first.");
    const intent = o.intentId ? ctx.intents.find((i) => i.id === o.intentId) : undefined;
    if (!intent) reasons.push("Point at an intent record.");
    else if (intent.propagationStatus === "review-required") reasons.push("The intent record changed; downstream review is pending.");
  }
  if (o.stage === "build" && !o.verificationOwner?.trim()) reasons.push("Name the verification owner before Validate.");
  if (o.stage === "validate") {
    if (to === "release" && !o.verificationEvidence?.trim()) reasons.push("Release needs verification evidence.");
    if (to === "concluded" && !o.uncertaintyReduced?.trim()) reasons.push("Record the uncertainty reduced before concluding a learning item.");
  }
  return { ok: reasons.length === 0, reasons, to };
}

export function advance(o: Output, ctx: { intents: IntentRecord[]; specs: SpecificationRecord[] }, at: string, by?: string): Output {
  const g = gate(o, ctx);
  if (!g.ok) throw new Error(g.reasons.join(" "));
  const next: Output = { ...o, stage: g.to, stageHistory: [...o.stageHistory, { stage: g.to, at, ...(by ? { by } : {}) }] };
  if (g.to === "validate") next.reviewStartedAt = at;
  if (o.stage === "validate") next.reviewedAt = at;
  if (g.to === "release") next.disposition = "released";
  if (g.to === "concluded" && next.disposition === "pending") next.disposition = "superseded";
  return next;
}

/** Stopping is as easy as continuing: one reason, from any stage. */
export function discard(o: Output, reason: string, at: string, by?: string): Output {
  if (!reason.trim()) throw new Error("A discard needs its reason; that is how the learning accumulates.");
  return { ...o, stage: "discarded", disposition: "discarded", discardReason: reason.trim(), stageHistory: [...o.stageHistory, { stage: "discarded", at, ...(by ? { by } : {}) }] };
}

/** Pluggable prioritisation keyed off the value category (learning rule unconfirmed). */
export interface Priority {
  score: number;
  method: "wsjf" | "information-gain";
  note: string;
}
export function prioritise(o: Output, inputs: { businessValue?: number; timeCriticality?: number; riskOpportunity?: number; jobSize?: number; informationGain?: number; costAndTime?: number }): Priority {
  if (VALUE_CATEGORY[o.type] === "value") {
    const cod = (inputs.businessValue ?? 0) + (inputs.timeCriticality ?? 0) + (inputs.riskOpportunity ?? 0);
    const size = inputs.jobSize ?? 0;
    return { score: size > 0 ? Math.round((cod / size) * 100) / 100 : 0, method: "wsjf", note: "Cost of delay ÷ job size." };
  }
  const gain = inputs.informationGain ?? 0;
  const cost = inputs.costAndTime ?? 0;
  return { score: cost > 0 ? Math.round((gain / cost) * 100) / 100 : 0, method: "information-gain", note: "Expected information gain per unit of cost and time (not framework-published)." };
}

// ---- intent, specifications, context ----------------------------------------------------

export interface IntentRecord {
  id: string;
  title: string;
  currentState: string;
  futureState: string;
  strategy: string;
  problems: string[];
  version: number;
  supersededBy?: string;
  propagationStatus: "clean" | "review-required";
  updatedAt: string;
}

export interface SpecificationRecord {
  id: string;
  title: string;
  intentId: string;
  whatItDoes: string;
  boundaries: string[];
  /** The structured payload agents ingest. */
  agentPayload?: Record<string, unknown>;
  contextIds: string[];
  version: number;
  reviewRequired: boolean;
  updatedAt: string;
}

export interface ContextRecord {
  id: string;
  title: string;
  customerProfile: string;
  marketConditions: string;
  operatingEnvironment: string;
  /** What a spec should test for. */
  testImplications: string[];
  version: number;
  reviewRequired: boolean;
  updatedAt: string;
}

export interface EvidenceEntry {
  id: string;
  at: string;
  kind: "intent-change" | "review-cleared" | "discard" | "release" | "concluded" | "sense-respond" | "assessment";
  text: string;
  refs: string[];
}

/**
 * An intent edit: new version, downstream specs and contexts flagged for review, outputs
 * behind them held at Specify by the gate, and the event logged into insights and evidence.
 */
export function editIntent(art: AiNativeArt, intentId: string, patch: Partial<Pick<IntentRecord, "title" | "currentState" | "futureState" | "strategy" | "problems">>, at: string): AiNativeArt {
  const intent = art.intents.find((i) => i.id === intentId);
  if (!intent) throw new Error("No such intent record.");
  const next: IntentRecord = { ...intent, ...patch, version: intent.version + 1, propagationStatus: "review-required", updatedAt: at };
  const specIds = art.specs.filter((s) => s.intentId === intentId).map((s) => s.id);
  const contextIds = new Set(art.specs.filter((s) => s.intentId === intentId).flatMap((s) => s.contextIds));
  const held = art.outputs.filter((o) => o.intentId === intentId && o.stage === "specify").map((o) => o.id);
  return {
    ...art,
    intents: art.intents.map((i) => (i.id === intentId ? next : i)),
    specs: art.specs.map((s) => (specIds.includes(s.id) ? { ...s, reviewRequired: true } : s)),
    contexts: art.contexts.map((c) => (contextIds.has(c.id) ? { ...c, reviewRequired: true } : c)),
    evidence: [...art.evidence, { id: `ev-${art.evidence.length + 1}`, at, kind: "intent-change", text: `Intent "${next.title}" changed to v${next.version}: ${specIds.length} specification(s) and ${contextIds.size} context record(s) need review; ${held.length} output(s) held at Specify.`, refs: [intentId, ...specIds, ...contextIds, ...held] }],
  };
}

/** Clearing a review on a spec or context; the intent is clean once nothing downstream waits. */
export function clearReview(art: AiNativeArt, recordId: string, at: string): AiNativeArt {
  const specs = art.specs.map((s) => (s.id === recordId ? { ...s, reviewRequired: false, version: s.version + 1, updatedAt: at } : s));
  const contexts = art.contexts.map((c) => (c.id === recordId ? { ...c, reviewRequired: false, version: c.version + 1, updatedAt: at } : c));
  const intents = art.intents.map((i) => {
    const pending = specs.some((s) => s.intentId === i.id && s.reviewRequired) || contexts.some((c) => c.reviewRequired && specs.some((s) => s.intentId === i.id && s.contextIds.includes(c.id)));
    return i.propagationStatus === "review-required" && !pending ? { ...i, propagationStatus: "clean" as const } : i;
  });
  return { ...art, specs, contexts, intents, evidence: [...art.evidence, { id: `ev-${art.evidence.length + 1}`, at, kind: "review-cleared", text: `Review cleared on ${recordId}.`, refs: [recordId] }] };
}

/** Records waiting for review, for the next Sense and Respond. */
export function reviewQueue(art: AiNativeArt): { id: string; kind: "specification" | "context"; title: string; heldOutputs: string[] }[] {
  const specs = art.specs.filter((s) => s.reviewRequired).map((s) => ({ id: s.id, kind: "specification" as const, title: s.title, heldOutputs: art.outputs.filter((o) => o.specId === s.id && o.stage === "specify").map((o) => o.id) }));
  const contexts = art.contexts.filter((c) => c.reviewRequired).map((c) => ({ id: c.id, kind: "context" as const, title: c.title, heldOutputs: art.outputs.filter((o) => o.contextId === c.id && o.stage === "specify").map((o) => o.id) }));
  return [...specs, ...contexts];
}

// ---- curated data -------------------------------------------------------------------------

export type DataCategory = "powers-development" | "powers-products";
export type DataQuality = "complete" | "accurate" | "securelyAccessed" | "maintained";

export const DATA_QUALITIES: Record<DataQuality, { label: string; definition: string; sub: string[] }> = {
  complete: { label: "Complete", definition: "People and agents can reach all the knowledge a task requires.", sub: ["Completeness", "Consistency", "Understandability"] },
  accurate: { label: "Accurate", definition: "Verified, trustworthy, lineage traceable to source.", sub: ["Accuracy", "Credibility", "Precision", "Traceability"] },
  // The sub-quality lists for these two appear transposed on the course slide; this is the logical reading (unconfirmed).
  securelyAccessed: { label: "Securely accessed", definition: "The right people and agents reach the right data, and no more.", sub: ["Accessibility", "Confidentiality", "Compliance"] },
  maintained: { label: "Maintained", definition: "The data stays current.", sub: ["Currentness", "Recoverability", "Portability"] },
};

export interface CuratedDataAsset {
  id: string;
  name: string;
  category: DataCategory;
  /** 0–5 per quality. */
  quality: Record<DataQuality, number>;
  subQuality?: Record<string, number>;
  owner: string;
  lastAssessed: string;
  latencyClass: "record" | "signal";
  /** Signal-tier assets carry a confidence label. */
  confidence?: string;
}

export function dataQualityScore(a: CuratedDataAsset): number {
  const v = Object.values(a.quality);
  return Math.round((v.reduce((x, y) => x + y, 0) / (v.length * 5)) * 100);
}

// ---- teams: capability coverage ----------------------------------------------------------

export type Capability = "product" | "builder" | "domainExpert" | "ai";
export const CAPABILITIES: Record<Capability, { label: string; blurb: string }> = {
  product: { label: "Product", blurb: "Defines the why, anchors to customer needs, synthesises feedback." },
  builder: { label: "Builder", blurb: "Creates the solution." },
  domainExpert: { label: "Domain expert", blurb: "Deep subject knowledge." },
  ai: { label: "AI", blurb: "Named as a team capability, not a tool; humans review its output for quality and bias." },
};

export interface TeamMember {
  id: string;
  name: string;
  capabilities: Capability[];
  /** The AI Value Architect is a capability assignment, held by one or several people. */
  aiValueArchitect?: boolean;
}

export interface TeamCapabilities {
  teamId: string;
  members: TeamMember[];
}

export interface CoverageReport {
  teamId: string;
  size: number;
  covered: Record<Capability, string[]>;
  uncovered: Capability[];
  warnings: string[];
}

export function coverage(t: TeamCapabilities): CoverageReport {
  const covered: Record<Capability, string[]> = { product: [], builder: [], domainExpert: [], ai: [] };
  for (const m of t.members) for (const c of m.capabilities) covered[c].push(m.name);
  const uncovered = (Object.keys(covered) as Capability[]).filter((c) => covered[c].length === 0);
  const warnings = uncovered.map((c) => `No one carries the ${CAPABILITIES[c].label} capability.`);
  if (t.members.length < 3 || t.members.length > 7) warnings.push(`${t.members.length} members; AI-Native teams are 3–7 people augmented with AI.`);
  return { teamId: t.teamId, size: t.members.length, covered, uncovered, warnings };
}

// ---- Sense and Respond --------------------------------------------------------------------

export interface SenseRespondEvent {
  id: string;
  iteration: number;
  heldAt?: string;
  /** Decisions taken: keep, discard (with reason) or re-plan an output; fix a workflow. */
  decisions: { outputId?: string; workflow?: string; decision: "keep" | "discard" | "replan" | "fix-workflow"; note?: string }[];
  notes?: string;
}

export interface SenseRespondAgenda {
  iteration: number;
  questions: string[];
  purposes: string[];
  outcomeDeltas: { outcomeId: string; outcome: string; keyResult: string; previous?: string; current?: string; target: string }[];
  released: Output[];
  /** Outputs with no metric movement after N iterations, or validated with nothing learned. */
  discardCandidates: { output: Output; why: string }[];
  reviewQueue: ReturnType<typeof reviewQueue>;
  costVariance: { workflow: string; estimate: number; actual: number; variance: number }[];
  workflowFriction: { workflow: string; outputs: number; inReview: number; discarded: number }[];
}

/** The agenda the tool pulls so the event is not a status meeting. */
export function senseRespondAgenda(art: AiNativeArt, session: PlanningSession, iteration: number, opts: { staleAfter?: number; krHistory?: Record<string, { iteration: number; value: string }[]> } = {}): SenseRespondAgenda {
  const staleAfter = opts.staleAfter ?? 2;
  const outcomeDeltas: SenseRespondAgenda["outcomeDeltas"] = [];
  for (const o of session.outcomes.filter((x) => x.level === "pi" || x.level === "team")) {
    for (const kr of o.keyResults) {
      const hist = opts.krHistory?.[kr.id] ?? [];
      const prev = hist.filter((h) => h.iteration < iteration).sort((a, b) => b.iteration - a.iteration)[0];
      const latest = hist.filter((h) => h.iteration <= iteration).sort((a, b) => b.iteration - a.iteration)[0];
      const current = latest?.value ?? kr.current;
      outcomeDeltas.push({ outcomeId: o.id, outcome: o.title, keyResult: kr.text, ...(prev ? { previous: prev.value } : {}), ...(current ? { current } : {}), target: kr.target });
    }
  }
  const released = art.outputs.filter((o) => o.stage === "release" && o.stageHistory.some((h) => h.stage === "release"));
  const moved = (o: Output) => o.metrics.some((m) => m.keyResultId && (opts.krHistory?.[m.keyResultId] ?? []).some((h) => h.iteration > o.iteration && h.iteration <= iteration));
  const discardCandidates: SenseRespondAgenda["discardCandidates"] = [];
  for (const o of art.outputs) {
    if (o.stage === "discarded" || o.stage === "concluded") continue;
    if (!o.metrics.length && o.stage !== "discover") discardCandidates.push({ output: o, why: "No metric linked; nothing says what it should move." });
    else if ((o.stage === "release" || o.stage === "validate") && iteration - o.iteration >= staleAfter && !moved(o)) discardCandidates.push({ output: o, why: `No movement on its metrics after ${iteration - o.iteration} iterations.` });
  }
  // Variance compares actuals with the estimates of the same items; work not yet spent on is not under-spend.
  const byWorkflow = new Map<string, { estimate: number; actual: number; outputs: number; inReview: number; discarded: number }>();
  for (const o of art.outputs) {
    const w = o.workflow ?? "(unattributed)";
    const cur = byWorkflow.get(w) ?? { estimate: 0, actual: 0, outputs: 0, inReview: 0, discarded: 0 };
    if (o.aiCostActual !== undefined) {
      cur.estimate += o.aiCostEstimate ?? 0;
      cur.actual += o.aiCostActual;
    }
    cur.outputs++;
    if (o.stage === "validate") cur.inReview++;
    if (o.stage === "discarded") cur.discarded++;
    byWorkflow.set(w, cur);
  }
  const costVariance = [...byWorkflow.entries()].filter(([, v]) => v.estimate || v.actual).map(([workflow, v]) => ({ workflow, estimate: v.estimate, actual: v.actual, variance: v.actual - v.estimate })).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance));
  const workflowFriction = [...byWorkflow.entries()].map(([workflow, v]) => ({ workflow, outputs: v.outputs, inReview: v.inReview, discarded: v.discarded })).sort((a, b) => b.inReview + b.discarded - (a.inReview + a.discarded));
  return {
    iteration,
    // The three RTE questions and the three purposes (two of the purposes unconfirmed).
    questions: ["Are we tracking progress against outcomes with real data?", "How did customers actually react to what shipped?", "Which workflows most need fixing, by impact rather than by volume of complaint?"],
    purposes: ["Intentionally discard work that does not drive outcomes.", "Adapt the plan to what the data says (unconfirmed wording).", "Fix the workflows that slow learning most (unconfirmed wording)."],
    outcomeDeltas,
    released,
    discardCandidates,
    reviewQueue: reviewQueue(art),
    costVariance,
    workflowFriction,
  };
}

// ---- assessment and launch plan ----------------------------------------------------------

export const SUCCESS_FACTORS: { shift: string; factors: string[] }[] = [
  { shift: "Outcome-driven flow", factors: ["Outcome-driven product development", "Portfolio outcomes and investment strategy", "Curated data"] },
  { shift: "Cross-functional, AI-augmented teams", factors: ["AI-Native ARTs", "AI-Native Teams", "AI Value Architect"] },
  { shift: "Iterative learning and rapid experimentation", factors: ["Product vision and roadmap", "PI Outcome Planning", "Sense and Respond"] },
  { shift: "Development and innovation at scale", factors: ["Intent, specifications and context", "AI Innovation Pipeline", "AI governance and ethics"] },
];

export interface Rating {
  factor: string;
  person: string;
  /** 1–5, written before the group talks. */
  score: 1 | 2 | 3 | 4 | 5;
  reason?: string;
}

export interface Gap {
  id: string;
  factor: string;
  text: string;
  /** Where it must land in the launch plan. */
  sequence: "before-pi-outcome-planning" | "before-sense-respond" | "later";
  owner?: string;
  done?: boolean;
}

export interface Assessment {
  ratings: Rating[];
  /** Factors where the group agreed to keep both positions rather than average. */
  splitsKept: { factor: string; positions: string[] }[];
  gaps: Gap[];
  /** The launch plan is a living document: versioned, owned by the group. */
  launchPlanVersion: number;
  launchPlanUpdatedAt?: string;
}

export interface FactorSummary {
  factor: string;
  shift: string;
  ratings: number;
  mean: number | null;
  spread: number | null;
  /** High variance: facilitate, check interpretations before debating reasons. */
  split: boolean;
}

export function assessmentSummary(a: Assessment, splitThreshold = 1.5): FactorSummary[] {
  return SUCCESS_FACTORS.flatMap((s) =>
    s.factors.map((factor) => {
      const rs = a.ratings.filter((r) => r.factor === factor).map((r) => r.score);
      if (!rs.length) return { factor, shift: s.shift, ratings: 0, mean: null, spread: null, split: false };
      const mean = rs.reduce((x, y) => x + y, 0) / rs.length;
      const spread = Math.max(...rs) - Math.min(...rs);
      return { factor, shift: s.shift, ratings: rs.length, mean: Math.round(mean * 10) / 10, spread, split: spread >= splitThreshold };
    }),
  );
}

/** Gaps that would stop the first PI Outcome Planning event must sequence before it. */
export function launchPlanIssues(a: Assessment): string[] {
  const out: string[] = [];
  for (const g of a.gaps) if (g.factor === "PI Outcome Planning" && g.sequence !== "before-pi-outcome-planning") out.push(`"${g.text}" blocks the first PI Outcome Planning event; sequence it before.`);
  for (const g of a.gaps) if (g.factor === "Sense and Respond" && g.sequence === "later") out.push(`"${g.text}" is needed before the first Sense and Respond.`);
  return out;
}

// ---- views: funnel, cost, verification ----------------------------------------------------

export interface Funnel {
  outcomes: number;
  learning: { total: number; concluded: number; discarded: number; active: number };
  value: { total: number; released: number; discarded: number; active: number };
  /** Discards as a share of everything started: the number that should feel like success. */
  discardRate: number;
}

export function explorationFunnel(art: AiNativeArt, session: PlanningSession): Funnel {
  const learning = art.outputs.filter((o) => VALUE_CATEGORY[o.type] === "learning");
  const value = art.outputs.filter((o) => VALUE_CATEGORY[o.type] === "value");
  const count = (xs: Output[], done: Stage) => ({ total: xs.length, [done === "release" ? "released" : "concluded"]: xs.filter((o) => o.stage === done).length, discarded: xs.filter((o) => o.stage === "discarded").length, active: xs.filter((o) => o.stage !== done && o.stage !== "discarded").length });
  const discarded = art.outputs.filter((o) => o.stage === "discarded").length;
  return {
    outcomes: session.outcomes.filter((o) => o.level === "pi").length,
    learning: count(learning, "concluded") as Funnel["learning"],
    value: count(value, "release") as Funnel["value"],
    discardRate: art.outputs.length ? Math.round((discarded / art.outputs.length) * 100) : 0,
  };
}

export interface CostView {
  fixed: number;
  variableEstimate: number;
  variableActual: number;
  limit?: number;
  overLimit: boolean;
  byWorkflow: { workflow: string; estimate: number; actual: number; variance: number }[];
}

export function aiCostView(art: AiNativeArt): CostView {
  const byWorkflow = new Map<string, { estimate: number; actual: number }>();
  for (const o of art.outputs) {
    if (o.aiCostActual === undefined) continue;
    const w = o.workflow ?? "(unattributed)";
    const cur = byWorkflow.get(w) ?? { estimate: 0, actual: 0 };
    cur.estimate += o.aiCostEstimate ?? 0;
    cur.actual += o.aiCostActual;
    byWorkflow.set(w, cur);
  }
  // The estimate of everything, spent or not, is the plan; actuals are what is spent so far.
  const variableEstimate = art.outputs.reduce((n, o) => n + (o.aiCostEstimate ?? 0), 0);
  const variableActual = [...byWorkflow.values()].reduce((n, v) => n + v.actual, 0);
  const limit = art.costLimit;
  return {
    fixed: art.fixedAiCost ?? 0,
    variableEstimate,
    variableActual,
    ...(limit !== undefined ? { limit } : {}),
    overLimit: limit !== undefined && (art.fixedAiCost ?? 0) + variableActual > limit,
    byWorkflow: [...byWorkflow.entries()].map(([workflow, v]) => ({ workflow, ...v, variance: v.actual - v.estimate })).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)),
  };
}

export interface VerificationView {
  queueDepth: number;
  /** Days in review for items waiting now, by output. */
  waiting: { outputId: string; title: string; owner: string; days: number }[];
  approverLoad: { owner: string; waiting: number; done: number }[];
  /** Median days from entering Validate to approval, for the items that got through. */
  medianReviewDays: number | null;
}

export function verificationView(art: AiNativeArt, today: string): VerificationView {
  const day = (a: string, b: string) => Math.round(((Date.parse(b) - Date.parse(a)) / 86_400_000) * 10) / 10;
  const waiting = art.outputs.filter((o) => o.stage === "validate").map((o) => ({ outputId: o.id, title: o.title, owner: o.verificationOwner ?? "(unassigned)", days: o.reviewStartedAt ? day(o.reviewStartedAt, today) : 0 })).sort((a, b) => b.days - a.days);
  const load = new Map<string, { waiting: number; done: number }>();
  for (const o of art.outputs) {
    const owner = o.verificationOwner ?? "(unassigned)";
    const cur = load.get(owner) ?? { waiting: 0, done: 0 };
    if (o.stage === "validate") cur.waiting++;
    if (o.reviewedAt) cur.done++;
    load.set(owner, cur);
  }
  const durations = art.outputs.filter((o) => o.reviewStartedAt && o.reviewedAt).map((o) => day(o.reviewStartedAt!, o.reviewedAt!)).sort((a, b) => a - b);
  const median = durations.length ? durations[Math.floor(durations.length / 2)]! : null;
  return { queueDepth: waiting.length, waiting, approverLoad: [...load.entries()].map(([owner, v]) => ({ owner, ...v })).sort((a, b) => b.waiting - a.waiting), medianReviewDays: median };
}

// ---- customer demos --------------------------------------------------------------------------

export const DEMO_FORMATS: { name: string; purpose: "learning" | "persuading"; reach: "broadcast" | "personal" }[] = [
  { name: "Interactive webinar", purpose: "learning", reach: "broadcast" },
  { name: "Self-serve demo", purpose: "learning", reach: "broadcast" },
  { name: "Beta / early access", purpose: "learning", reach: "broadcast" },
  { name: "Focus group", purpose: "learning", reach: "broadcast" },
  { name: "Customer advisory board", purpose: "learning", reach: "personal" },
  { name: "Usability test", purpose: "learning", reach: "personal" },
  { name: "Validation demo", purpose: "learning", reach: "personal" },
  { name: "Technical deep-dive", purpose: "learning", reach: "personal" },
  { name: "Guided product tour", purpose: "persuading", reach: "broadcast" },
  { name: "Booth demo", purpose: "persuading", reach: "broadcast" },
  { name: "Launch event", purpose: "persuading", reach: "broadcast" },
  { name: "Webinar", purpose: "persuading", reach: "broadcast" },
  { name: "Roadshow", purpose: "persuading", reach: "broadcast" },
  { name: "Vision demo", purpose: "persuading", reach: "personal" },
  { name: "Executive briefing", purpose: "persuading", reach: "personal" },
  { name: "Qualifying demo", purpose: "persuading", reach: "personal" },
];

export interface CustomerDemo {
  id: string;
  format: string;
  iteration: number;
  outputIds: string[];
  audience?: string;
  what?: string;
}

// ---- the ART record ------------------------------------------------------------------------

export interface AiNativeArt {
  /** The planning session (ART and PI) this extends. */
  sessionId: string;
  outputs: Output[];
  intents: IntentRecord[];
  specs: SpecificationRecord[];
  contexts: ContextRecord[];
  dataAssets: CuratedDataAsset[];
  teams: TeamCapabilities[];
  senseRespond: SenseRespondEvent[];
  demos: CustomerDemo[];
  assessment: Assessment;
  evidence: EvidenceEntry[];
  /** Key result readings per iteration, for deltas and stale detection. */
  krHistory: Record<string, { iteration: number; value: string }[]>;
  fixedAiCost?: number;
  costLimit?: number;
  updatedAt: string;
}

export function emptyArt(sessionId: string, now: string): AiNativeArt {
  return { sessionId, outputs: [], intents: [], specs: [], contexts: [], dataAssets: [], teams: [], senseRespond: [], demos: [], assessment: { ratings: [], splitsKept: [], gaps: [], launchPlanVersion: 1 }, evidence: [], krHistory: {}, updatedAt: now };
}

/** Everything the facilitator should know before the next event. */
export function artIssues(art: AiNativeArt, session: PlanningSession): string[] {
  const out: string[] = [];
  for (const o of session.outcomes) {
    const w = outcomeWording(o);
    if (w) out.push(w);
    const k = keyResultCheck(o);
    if (k) out.push(k);
  }
  for (const o of art.outputs) {
    if (o.stage !== "discover" && o.stage !== "discarded" && !o.outcomeIds.length) out.push(`"${o.title}" is linked to no outcome.`);
    if (["build", "validate", "release"].includes(o.stage) && !o.metrics.length) out.push(`"${o.title}" passed Specify without a metric.`);
  }
  for (const t of art.teams) out.push(...coverage(t).warnings.map((w) => `${session.teams.find((x) => x.id === t.teamId)?.name ?? t.teamId}: ${w}`));
  const q = reviewQueue(art);
  if (q.length) out.push(`${q.length} record${q.length === 1 ? "" : "s"} waiting for review after an intent change.`);
  out.push(...launchPlanIssues(art.assessment));
  return out;
}

// ---- worked example ---------------------------------------------------------------------------

/** The Retail Pharmacy ART's PI 2, two iterations in. */
export function demoArt(now = "2026-11-05T09:00:00.000Z"): AiNativeArt {
  const at = (d: number) => new Date(Date.parse(now) - d * 86_400_000).toISOString();
  const art = emptyArt("retail-pharmacy-pi2", now);
  art.intents = [
    { id: "int-diets", title: "Specialized diets as the household's trusted guide", currentState: "Diet guidance is generic and ignored at checkout; 15% of diabetic-flagged households complete a swap.", futureState: "Every flagged household gets a trusted, personal diet-swap at the moment of choice; 60% complete it.", strategy: "Earn trust with accurate classification first, then recommend, then scale through the store.", problems: ["Classification is 81% accurate", "Recommendations feel like upsell", "Store and app disagree"], version: 2, propagationStatus: "review-required", updatedAt: at(3) },
    { id: "int-habit", title: "Family health as a shared habit", currentState: "100,000 households enrolled; 55% weekly participation; retention 71%.", futureState: "350,000 households, 60% weekly, 80% retention: the challenge is part of the weekly shop.", strategy: "Make the cart the habit's home: nudges, challenges, family visibility.", problems: ["Nudges are ignored", "Challenges end after week 3"], version: 1, propagationStatus: "clean", updatedAt: at(20) },
  ];
  art.contexts = [
    { id: "ctx-diabetic", title: "Diabetic-flagged households", customerProfile: "Households with at least one member on a diabetes care plan; 40% over 60; low tolerance for jargon.", marketConditions: "National Diabetes awareness month in iteration 4 drives attention and competitor campaigns.", operatingEnvironment: "App at checkout, shelf-edge labels in store, pharmacist consult.", testImplications: ["Reading level ≤ grade 8", "No recommendation without a classification confidence ≥ 0.9", "Works offline at the shelf"], version: 1, reviewRequired: true, updatedAt: at(3) },
    { id: "ctx-family", title: "Multi-user households", customerProfile: "Two or more app users sharing a cart.", marketConditions: "Challenge fatigue after three weeks is common across loyalty apps.", operatingEnvironment: "Cart, push notifications, weekly email.", testImplications: ["Nudge frequency capped at 3 per week", "Progress visible to every member"], version: 1, reviewRequired: false, updatedAt: at(20) },
  ];
  art.specs = [
    { id: "spec-swap", title: "Diet-swap recommendation at checkout", intentId: "int-diets", whatItDoes: "For a flagged household with classification confidence ≥ 0.9, offer one swap per basket with the reason in plain words.", boundaries: ["Never recommend against a care plan", "One swap per basket", "Disclose that the suggestion is AI-generated"], agentPayload: { trigger: "checkout", precondition: "confidence>=0.9", maxPerBasket: 1, disclosure: true }, contextIds: ["ctx-diabetic"], version: 1, reviewRequired: true, updatedAt: at(3) },
    { id: "spec-nudge", title: "In-cart challenge nudge", intentId: "int-habit", whatItDoes: "Show challenge progress in the cart and nudge toward the next qualifying item.", boundaries: ["Max 3 nudges per week", "No nudge for non-qualifying households"], contextIds: ["ctx-family"], version: 2, reviewRequired: false, updatedAt: at(10) },
  ];
  art.dataAssets = [
    { id: "data-labels", name: "Curated diet labels (product catalogue)", category: "powers-products", quality: { complete: 3, accurate: 4, securelyAccessed: 5, maintained: 2 }, owner: "AI Engine Team", lastAssessed: at(7), latencyClass: "record" },
    { id: "data-household", name: "Household health profile", category: "powers-products", quality: { complete: 2, accurate: 3, securelyAccessed: 5, maintained: 3 }, owner: "Cart Team", lastAssessed: at(14), latencyClass: "record" },
    { id: "data-telemetry", name: "Checkout telemetry stream", category: "powers-development", quality: { complete: 4, accurate: 4, securelyAccessed: 4, maintained: 5 }, owner: "Cart Team", lastAssessed: at(2), latencyClass: "signal", confidence: "high (sampled 10%)" },
  ];
  const stage = (s: Stage[], start: number): Output["stageHistory"] => s.map((st, i) => ({ stage: st, at: at(start - i * 4) }));
  art.outputs = [
    { id: "out-1", type: "experiment", title: "Swap-acceptance framing A/B test", teamId: "cart", iteration: 2, outcomeIds: ["t-cart-1"], metrics: [{ keyResultId: "t-cart-1-1", expected: "acceptance from 0% toward 5%" }], stage: "validate", stageHistory: stage(["discover", "specify", "build", "validate"], 16), intentId: "int-diets", specId: "spec-swap", contextId: "ctx-diabetic", dataAssetIds: ["data-telemetry"], hypothesis: "Framing the swap as 'for your plan' rather than 'healthier' doubles acceptance.", disposition: "pending", abTest: true, aiCostEstimate: 400, aiCostActual: 610, workflow: "recommendation", verificationOwner: "Priya (PM)", reviewStartedAt: at(4) },
    { id: "out-2", type: "prototype", title: "Diet-swap at checkout (prototype)", teamId: "cart", iteration: 1, outcomeIds: ["t-cart-1"], metrics: [{ keyResultId: "t-cart-1-2", expected: "completion from 15% toward 22.5%" }], stage: "concluded", stageHistory: stage(["discover", "specify", "build", "validate", "concluded"], 24), intentId: "int-diets", specId: "spec-swap", contextId: "ctx-diabetic", dataAssetIds: ["data-labels", "data-household"], hypothesis: "A one-tap swap is used when the reason is shown.", uncertaintyReduced: "Tap rate 31% with reason shown vs 9% without; reason is required.", disposition: "superseded", aiCostEstimate: 250, aiCostActual: 240, workflow: "recommendation", verificationOwner: "Priya (PM)", reviewStartedAt: at(12), reviewedAt: at(10) },
    { id: "out-3", type: "feature", title: "Diet-swap at checkout", teamId: "cart", iteration: 4, outcomeIds: ["t-cart-1", "pi-diets"], metrics: [{ keyResultId: "pi-diets-2", expected: "35% of flagged households complete a swap" }], stage: "specify", stageHistory: stage(["discover", "specify"], 8), intentId: "int-diets", specId: "spec-swap", contextId: "ctx-diabetic", dataAssetIds: ["data-labels", "data-household"], disposition: "pending", aiCostEstimate: 1800, workflow: "recommendation", disclosure: "Suggested by our diet assistant" },
    { id: "out-4", type: "enabler", title: "Household diet-profile read", teamId: "cart", iteration: 1, outcomeIds: ["t-cart-1"], metrics: [{ name: "Profile read latency p95 < 120 ms" }], stage: "release", stageHistory: stage(["discover", "specify", "build", "validate", "release"], 28), intentId: "int-diets", specId: "spec-swap", dataAssetIds: ["data-household"], disposition: "released", aiCostEstimate: 0, aiCostActual: 0, workflow: "platform", verificationOwner: "Marcus (Architect)", verificationEvidence: "Load test 2026-10-30: p95 96 ms at 3× peak.", reviewStartedAt: at(9), reviewedAt: at(8) },
    { id: "out-5", type: "feature", title: "In-cart nudges", teamId: "cart", iteration: 2, outcomeIds: ["t-cart-2", "pi-game"], metrics: [{ keyResultId: "t-cart-2-2", expected: "nudges acted on from 5% toward 28%" }], stage: "release", stageHistory: stage(["discover", "specify", "build", "validate", "release"], 20), intentId: "int-habit", specId: "spec-nudge", contextId: "ctx-family", disposition: "released", aiCostEstimate: 300, aiCostActual: 290, workflow: "engagement", verificationOwner: "Priya (PM)", verificationEvidence: "Usability test 6/6 understood the nudge; frequency cap verified.", reviewStartedAt: at(7), reviewedAt: at(6) },
    { id: "out-6", type: "experiment", title: "Challenge streak badge", teamId: "cart", iteration: 1, outcomeIds: ["t-cart-2"], metrics: [{ keyResultId: "t-cart-2-1", expected: "weekly challenge-linked baskets" }], stage: "discarded", stageHistory: [...stage(["discover", "specify", "build", "validate"], 26), { stage: "discarded", at: at(11) }], intentId: "int-habit", specId: "spec-nudge", hypothesis: "A visible streak keeps households in the challenge past week 3.", disposition: "discarded", discardReason: "No change in week-4 participation across 2,000 households; the badge is noise.", aiCostEstimate: 150, aiCostActual: 410, workflow: "engagement", verificationOwner: "Priya (PM)", reviewStartedAt: at(13), reviewedAt: at(11) },
    { id: "out-7", type: "experiment", title: "Classifier retrain on curated labels", teamId: "ai-engine", iteration: 1, outcomeIds: ["t-ai-1"], metrics: [{ keyResultId: "t-ai-1-1", expected: "accuracy 81% → 94%" }], stage: "validate", stageHistory: stage(["discover", "specify", "build", "validate"], 18), intentId: "int-diets", specId: "spec-swap", dataAssetIds: ["data-labels"], hypothesis: "Curated labels lift validation accuracy above 90% without new data.", disposition: "pending", aiCostEstimate: 900, aiCostActual: 1450, workflow: "model-training", verificationOwner: "Lena (AI Value Architect)", reviewStartedAt: at(6) },
    { id: "out-8", type: "feature", title: "Diet-profile service v1", teamId: "ai-engine", iteration: 2, outcomeIds: ["t-ai-2"], metrics: [], stage: "build", stageHistory: stage(["discover", "specify", "build"], 12), intentId: "int-diets", specId: "spec-swap", disposition: "pending", aiCostEstimate: 500, aiCostActual: 120, workflow: "platform", verificationOwner: "Marcus (Architect)" },
  ];
  art.teams = [
    { teamId: "cart", members: [{ id: "p1", name: "Priya", capabilities: ["product"] }, { id: "p2", name: "Diego", capabilities: ["builder", "ai"] }, { id: "p3", name: "Aiko", capabilities: ["builder"] }, { id: "p4", name: "Omar", capabilities: ["domainExpert"] }, { id: "p5", name: "Lena", capabilities: ["ai"], aiValueArchitect: true }] },
    { teamId: "ai-engine", members: [{ id: "p6", name: "Marcus", capabilities: ["builder", "ai"] }, { id: "p7", name: "Wei", capabilities: ["builder"] }, { id: "p8", name: "Sara", capabilities: ["product"] }] },
    { teamId: "marketing", members: [{ id: "p9", name: "Jonas", capabilities: ["product", "domainExpert"] }, { id: "p10", name: "Ines", capabilities: ["builder"] }] },
    { teamId: "in-store", members: [{ id: "p11", name: "Tom", capabilities: ["domainExpert"] }, { id: "p12", name: "Grace", capabilities: ["builder"] }, { id: "p13", name: "Ravi", capabilities: ["product"] }, { id: "p14", name: "Mia", capabilities: ["builder"] }] },
  ];
  art.krHistory = {
    "t-cart-1-1": [{ iteration: 1, value: "0%" }, { iteration: 2, value: "1.5%" }],
    "t-cart-2-2": [{ iteration: 1, value: "5%" }, { iteration: 2, value: "11%" }],
    "t-cart-2-1": [{ iteration: 1, value: "10%" }, { iteration: 2, value: "10%" }],
    "t-ai-1-1": [{ iteration: 1, value: "81%" }, { iteration: 2, value: "88%" }],
    "pi-diets-2": [{ iteration: 1, value: "15%" }, { iteration: 2, value: "16%" }],
  };
  art.senseRespond = [{ id: "sr-1", iteration: 1, heldAt: at(14), decisions: [{ outputId: "out-6", decision: "discard", note: "No week-4 movement; stop." }, { workflow: "model-training", decision: "fix-workflow", note: "Training runs retried by hand; automate the retry." }], notes: "First event: the discard felt like a win." }];
  art.demos = [{ id: "demo-1", format: "Usability test", iteration: 2, outputIds: ["out-5"], audience: "6 enrolled households", what: "In-cart nudge comprehension" }, { id: "demo-2", format: "Customer advisory board", iteration: 4, outputIds: ["out-3"], audience: "Diabetes care partners", what: "Diet-swap at checkout before awareness month" }];
  art.assessment = {
    ratings: [
      ...["Priya", "Marcus", "Lena", "Jonas"].flatMap((person, i) => [
        { factor: "Outcome-driven product development", person, score: ([4, 4, 3, 4] as const)[i]! },
        { factor: "Curated data", person, score: ([2, 4, 2, 3] as const)[i]! },
        { factor: "AI Value Architect", person, score: ([3, 3, 4, 2] as const)[i]! },
        { factor: "PI Outcome Planning", person, score: ([4, 3, 4, 4] as const)[i]! },
        { factor: "Sense and Respond", person, score: ([3, 3, 3, 2] as const)[i]! },
        { factor: "Intent, specifications and context", person, score: ([2, 4, 3, 1] as const)[i]! },
      ]),
    ],
    splitsKept: [{ factor: "Curated data", positions: ["Labels are good enough for the pilot (Marcus)", "Household profiles are too incomplete to trust (Priya, Lena)"] }],
    gaps: [
      { id: "gap-1", factor: "Curated data", text: "Household profile completeness below 50%; agree a minimum before recommending.", sequence: "before-sense-respond", owner: "Cart Team" },
      { id: "gap-2", factor: "Intent, specifications and context", text: "Specifications live in three tools; one versioned record per feature.", sequence: "before-pi-outcome-planning", owner: "Lena", done: true },
      { id: "gap-3", factor: "AI Value Architect", text: "Only Lena holds the capability; add one person per team.", sequence: "later", owner: "RTE" },
    ],
    launchPlanVersion: 3,
    launchPlanUpdatedAt: at(5),
  };
  art.evidence = [
    { id: "ev-1", at: at(11), kind: "discard", text: 'Discarded "Challenge streak badge": no change in week-4 participation across 2,000 households.', refs: ["out-6"] },
    { id: "ev-2", at: at(10), kind: "concluded", text: 'Concluded "Diet-swap at checkout (prototype)": tap rate 31% with reason shown vs 9% without.', refs: ["out-2"] },
    { id: "ev-3", at: at(3), kind: "intent-change", text: 'Intent "Specialized diets as the household\'s trusted guide" changed to v2: 1 specification and 1 context record need review; 1 output held at Specify.', refs: ["int-diets", "spec-swap", "ctx-diabetic", "out-3"] },
  ];
  art.fixedAiCost = 2400;
  art.costLimit = 6000;
  return art;
}
