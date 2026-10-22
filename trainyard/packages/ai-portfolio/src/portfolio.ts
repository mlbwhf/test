// AI portfolio: AI initiatives move through a lifecycle with evidence-based stage gates
// that tighten with risk tier, AI agents are registered with a named accountable human
// and a bounded autonomy level, and spend and value are tracked against budget and KPIs.
//
// Risk tiers follow the EU AI Act's four categories. The gate policy is a starting point
// for a governance board to edit, not legal advice.

import type { AutonomyLevel, OperatingModel } from "@trainyard/core";

export const STAGES = ["idea", "data", "experiment", "evaluate", "pilot", "production", "monitor", "retired"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  idea: "Idea",
  data: "Data readiness",
  experiment: "Experiment",
  evaluate: "Evaluate",
  pilot: "Pilot",
  production: "Production",
  monitor: "Monitor",
  retired: "Retired",
};

export type RiskTier = "prohibited" | "high" | "limited" | "minimal";
export type UseCase = "assistant" | "agent" | "predictive" | "classification" | "generation" | "other";
export type Oversight = "in-the-loop" | "on-the-loop" | "out-of-loop";

export const EVIDENCE_KINDS = [
  "value-hypothesis",
  "data-provenance",
  "privacy-assessment",
  "model-card",
  "eval-report",
  "red-team",
  "human-oversight-plan",
  "conformity-assessment",
  "monitoring-plan",
  "rollback-plan",
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_LABELS: Record<EvidenceKind, string> = {
  "value-hypothesis": "Value hypothesis",
  "data-provenance": "Data provenance record",
  "privacy-assessment": "Privacy impact assessment",
  "model-card": "Model card",
  "eval-report": "Evaluation report",
  "red-team": "Red-team report",
  "human-oversight-plan": "Human oversight plan",
  "conformity-assessment": "Conformity assessment",
  "monitoring-plan": "Monitoring plan",
  "rollback-plan": "Rollback plan",
};

export interface Evidence {
  kind: EvidenceKind;
  url: string;
  addedBy: string;
  addedAt: string;
}

export interface DataSource {
  name: string;
  provenance: "internal" | "licensed" | "public" | "synthetic";
  personalData: boolean;
  /** Reviewed and approved by a data steward. */
  curated: boolean;
}

export interface EvalMetric {
  name: string;
  /** "min" means the score must be at least the threshold; "max" means at most. */
  direction: "min" | "max";
  threshold: number;
  latest?: number;
  measuredAt?: string;
}

export interface CostEntry {
  /** YYYY-MM */
  month: string;
  category: "inference" | "training" | "data" | "people" | "other";
  amount: number;
}

export interface Kpi {
  name: string;
  baseline: number;
  target: number;
  current?: number;
}

export interface SignOff {
  stage: Stage;
  by: string;
  role: string;
  at: string;
}

export interface Initiative {
  id: string;
  name: string;
  problem: string;
  useCase: UseCase;
  stage: Stage;
  riskTier: RiskTier;
  /** Human accountable for outcomes. Always a person, never an agent. */
  ownerId: string;
  oversight: Oversight;
  models: string[];
  dataSources: DataSource[];
  evidence: Evidence[];
  evals: EvalMetric[];
  costs: CostEntry[];
  monthlyBudget: number;
  currency: string;
  kpis: Kpi[];
  agentIds: string[];
  signOffs: SignOff[];
  stageHistory: { stage: Stage; at: string }[];
}

export interface Agent {
  id: string;
  name: string;
  purpose: string;
  teamId?: string;
  initiativeId?: string;
  /** Human accountable for what the agent does. */
  accountableId?: string;
  autonomy: AutonomyLevel;
  tools: string[];
  status: "active" | "paused" | "retired";
}

export const AUTONOMY_LABELS: Record<AutonomyLevel, string> = {
  0: "Suggests only",
  1: "Drafts for approval",
  2: "Acts after approval",
  3: "Acts, then reports",
  4: "Fully autonomous",
};

// ---- gate policy -----------------------------------------------------------------------

export interface GatePolicy {
  /** Evidence needed to enter each stage, for every tier. */
  base: Partial<Record<Stage, EvidenceKind[]>>;
  /** Extra evidence for high-risk initiatives. */
  high: Partial<Record<Stage, EvidenceKind[]>>;
  /** Stage from which every eval threshold must pass. */
  evalsFrom: Stage;
  /** Stages the AI value architect must sign off (when the model asks for it). */
  signOffStages: Stage[];
  /** Highest autonomy an agent may have on a high-risk initiative. */
  highRiskMaxAutonomy: AutonomyLevel;
}

export const DEFAULT_POLICY: GatePolicy = {
  base: {
    data: ["value-hypothesis"],
    experiment: ["data-provenance"],
    evaluate: ["model-card"],
    pilot: ["eval-report", "human-oversight-plan"],
    production: ["monitoring-plan", "rollback-plan"],
  },
  high: {
    pilot: ["red-team"],
    production: ["conformity-assessment"],
  },
  evalsFrom: "pilot",
  signOffStages: ["pilot", "production"],
  highRiskMaxAutonomy: 2,
};

export interface Blocker {
  code: "prohibited" | "skip" | "evidence" | "privacy" | "data-curation" | "eval" | "oversight" | "sign-off" | "agent" | "retired";
  message: string;
}

export interface GateResult {
  from: Stage;
  to: Stage;
  allowed: boolean;
  blockers: Blocker[];
  /** Evidence required for this move, with whether it is on file. */
  evidence: { kind: EvidenceKind; label: string; present: boolean }[];
}

const idx = (s: Stage) => STAGES.indexOf(s);

/** Evidence required to enter `to`, accumulated over every stage up to it. */
export function requiredEvidence(initiative: Pick<Initiative, "riskTier" | "dataSources">, to: Stage, policy: GatePolicy = DEFAULT_POLICY): EvidenceKind[] {
  const need = new Set<EvidenceKind>();
  for (const s of STAGES.slice(0, idx(to) + 1)) {
    for (const k of policy.base[s] ?? []) need.add(k);
    if (initiative.riskTier === "high") for (const k of policy.high[s] ?? []) need.add(k);
  }
  if (idx(to) >= idx("experiment") && initiative.dataSources.some((d) => d.personalData)) need.add("privacy-assessment");
  return EVIDENCE_KINDS.filter((k) => need.has(k));
}

export function evalPasses(m: EvalMetric): boolean {
  if (m.latest === undefined) return false;
  return m.direction === "min" ? m.latest >= m.threshold : m.latest <= m.threshold;
}

export interface GateContext {
  model: OperatingModel;
  agents: readonly Agent[];
  policy?: GatePolicy;
}

/**
 * Check whether an initiative may move to `to`. Moving backwards (or to retired) is always
 * allowed: stopping or reworking AI should never be blocked. Moving forwards may advance one
 * stage at a time and must satisfy the policy for the target stage.
 */
export function evaluateGate(initiative: Initiative, to: Stage, ctx: GateContext): GateResult {
  const policy = ctx.policy ?? DEFAULT_POLICY;
  const from = initiative.stage;
  const blockers: Blocker[] = [];
  const backwards = to === "retired" || idx(to) <= idx(from);
  const required = backwards ? [] : requiredEvidence(initiative, to, policy);
  const have = new Set(initiative.evidence.map((e) => e.kind));
  const evidence = required.map((kind) => ({ kind, label: EVIDENCE_LABELS[kind], present: have.has(kind) }));

  if (!backwards) {
    if (from === "retired") blockers.push({ code: "retired", message: "Retired initiatives cannot move forward. Start a new initiative instead." });
    if (initiative.riskTier === "prohibited") blockers.push({ code: "prohibited", message: "Prohibited-risk uses cannot progress." });
    if (idx(to) - idx(from) > 1) blockers.push({ code: "skip", message: `Move one stage at a time: next is ${STAGE_LABELS[STAGES[idx(from) + 1]!]}.` });
    for (const e of evidence) if (!e.present) blockers.push({ code: "evidence", message: `Add the ${e.label.toLowerCase()}.` });

    if (idx(to) >= idx("experiment")) {
      const uncurated = initiative.dataSources.filter((d) => !d.curated);
      if (uncurated.length) blockers.push({ code: "data-curation", message: `A data steward must curate: ${uncurated.map((d) => d.name).join(", ")}.` });
    }
    if (idx(to) >= idx(policy.evalsFrom)) {
      if (initiative.evals.length === 0) blockers.push({ code: "eval", message: "Define at least one evaluation metric with a threshold." });
      for (const m of initiative.evals.filter((m) => !evalPasses(m))) {
        const cmp = m.direction === "min" ? "at least" : "at most";
        blockers.push({ code: "eval", message: `${m.name} is ${m.latest ?? "not measured"}; it must be ${cmp} ${m.threshold}.` });
      }
    }
    if (initiative.riskTier === "high" && idx(to) >= idx("pilot") && initiative.oversight === "out-of-loop") {
      blockers.push({ code: "oversight", message: "High-risk AI needs a human in or on the loop." });
    }
    const ai = ctx.model.aiNative;
    if (ai.enabled && ai.valueArchitectSignOff && policy.signOffStages.includes(to)) {
      const signed = initiative.signOffs.some((s) => s.stage === to && s.role === "ai-value-architect");
      if (!signed) blockers.push({ code: "sign-off", message: `The AI value architect must sign off the move to ${STAGE_LABELS[to]}.` });
    }
    if (idx(to) >= idx("pilot")) {
      for (const a of ctx.agents.filter((a) => initiative.agentIds.includes(a.id) && a.status === "active")) {
        for (const issue of checkAgent(a, ctx.model, initiative, policy)) blockers.push({ code: "agent", message: `${a.name}: ${issue}` });
      }
    }
  }
  return { from, to, allowed: blockers.length === 0, blockers, evidence };
}

export function advance(initiative: Initiative, to: Stage, ctx: GateContext, at: string): Initiative {
  const gate = evaluateGate(initiative, to, ctx);
  if (!gate.allowed) throw new GateBlockedError(gate);
  return { ...initiative, stage: to, stageHistory: [...initiative.stageHistory, { stage: to, at }] };
}

export class GateBlockedError extends Error {
  constructor(readonly gate: GateResult) {
    super(`gate to ${gate.to} blocked: ${gate.blockers.map((b) => b.message).join(" ")}`);
    this.name = "GateBlockedError";
  }
}

/** Problems with an agent under the operating model's AI-native settings. */
export function checkAgent(agent: Agent, model: OperatingModel, initiative?: Initiative, policy: GatePolicy = DEFAULT_POLICY): string[] {
  const issues: string[] = [];
  const ai = model.aiNative;
  if (ai.requireAccountableHuman && !agent.accountableId) issues.push("name the human accountable for this agent.");
  if (agent.autonomy > ai.maxAgentAutonomy) issues.push(`autonomy ${agent.autonomy} is above this model's limit of ${ai.maxAgentAutonomy}.`);
  if (initiative?.riskTier === "high" && agent.autonomy > policy.highRiskMaxAutonomy) {
    issues.push(`high-risk work allows autonomy up to ${policy.highRiskMaxAutonomy} (${AUTONOMY_LABELS[policy.highRiskMaxAutonomy].toLowerCase()}).`);
  }
  if (agent.teamId && !ai.agentsAsTeamMembers) issues.push("this operating model does not allow agents as team members.");
  return issues;
}

// ---- spend and value ---------------------------------------------------------------------

export interface SpendSummary {
  month: string;
  spent: number;
  budget: number;
  /** Straight-line projection to month end from spend so far. */
  forecast: number;
  state: "ok" | "watch" | "over";
}

export function spendSummary(initiative: Initiative, now: Date): SpendSummary {
  const month = now.toISOString().slice(0, 7);
  const spent = initiative.costs.filter((c) => c.month === month).reduce((s, c) => s + c.amount, 0);
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const elapsed = now.getUTCDate() - 1 + now.getUTCHours() / 24;
  const forecast = elapsed > 0 ? Math.round((spent / elapsed) * daysInMonth) : spent;
  const budget = initiative.monthlyBudget;
  const state = spent > budget ? "over" : forecast > budget ? "watch" : "ok";
  return { month, spent, budget, forecast, state };
}

/** Progress from baseline to target, 0–100, averaged over KPIs that have a current value. */
export function valueRealised(initiative: Initiative): number | null {
  const scored = initiative.kpis.filter((k) => k.current !== undefined && k.target !== k.baseline);
  if (scored.length === 0) return null;
  const pct = scored.map((k) => Math.max(0, Math.min(1, (k.current! - k.baseline) / (k.target - k.baseline))));
  return Math.round((pct.reduce((a, b) => a + b, 0) / pct.length) * 100);
}
