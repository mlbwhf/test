// The AI-Native ART launch readiness tool: the twelve success factors in their four shifts, the
// three ratings, the launch plan's phases, the scoring, and the trainings that close each gap.
// The statements themselves are the course's (courses/ai-native-arts.ts).

import { AI_NATIVE_SUCCESS_FACTORS } from "./courses/ai-native-arts.js";

export type ReadinessRating = "F" | "P" | "N";
export const READINESS_RATINGS: [ReadinessRating, string][] = [["F", "Fully in place"], ["P", "Partially in place"], ["N", "Not in place"]];
export const READINESS_SHIFTS = ["Optimize for Outcome-Driven Flow", "Cross-Functional, AI-Augmented Teams", "Iterative Learning and Rapid Experimentation Cycles", "Development and Innovation at Scale"];
export const READINESS_PHASES: [string, string][] = [["Ahead of first PI Outcome Planning", "Critical before launch"], ["Ahead of first Sense and Respond", "Important fast-follow work"], ["After / Ongoing", "Can be addressed over time"]];

export interface ReadinessFactor {
  /** "SF1" … "SF12". */
  code: string;
  name: string;
  /** Index into READINESS_SHIFTS. */
  shift: number;
  statements: string[];
}

/** The twelve success factors, three per shift, in order. */
export const READINESS_FACTORS: ReadinessFactor[] = Object.entries(AI_NATIVE_SUCCESS_FACTORS).map(([k, f], i) => ({
  code: k.toUpperCase(),
  name: f.title.replace(/^SF\d+:\s*/, ""),
  shift: Math.floor(i / 3),
  statements: f.statements.map((s) => s[0]),
}));

export interface ReadinessAction {
  text: string;
  /** Index into READINESS_PHASES. */
  phase: number;
  owner?: string;
}

/** A statement's key in the board's state: "SF3:1". */
export const readinessKey = (code: string, i: number) => `${code}:${i}`;
const KEYS = READINESS_FACTORS.flatMap((f) => f.statements.map((_, i) => readinessKey(f.code, i)));
const ratingOf = (state: Record<string, unknown>, key: string): ReadinessRating | null => {
  const v = state[`r:${key}`];
  return v === "F" || v === "P" || v === "N" ? v : null;
};
export const readinessRating = ratingOf;
export const readinessAction = (state: Record<string, unknown>, key: string): ReadinessAction | null => {
  const v = state[`a:${key}`] as ReadinessAction | undefined;
  return v && typeof v === "object" && typeof v.text === "string" && v.text.trim() ? { text: v.text, phase: Math.max(0, Math.min(2, Number(v.phase) || 0)), ...(v.owner ? { owner: String(v.owner) } : {}) } : null;
};

export interface ReadinessTally {
  F: number;
  P: number;
  N: number;
  rated: number;
  total: number;
  /** Statements rated partially or not in place. */
  gaps: number;
  /** Gaps that have an action on the launch plan. */
  covered: number;
  /** Fully counts 1, partially ½, over all the statements; 0–100. */
  ready: number;
}

export function readinessTally(state: Record<string, unknown>, keys: string[] = KEYS): ReadinessTally {
  const n = (c: ReadinessRating) => keys.filter((k) => ratingOf(state, k) === c).length;
  const F = n("F"), P = n("P"), N = n("N"), gapKeys = keys.filter((k) => ["P", "N"].includes(ratingOf(state, k) ?? ""));
  return { F, P, N, rated: F + P + N, total: keys.length, gaps: gapKeys.length, covered: gapKeys.filter((k) => readinessAction(state, k)).length, ready: keys.length ? Math.round(((F + P * 0.5) / keys.length) * 100) : 0 };
}

/** How far a factor is in place (0–100), or null until one of its statements is rated. */
export function readinessFactorScore(state: Record<string, unknown>, f: ReadinessFactor): number | null {
  const keys = f.statements.map((_, i) => readinessKey(f.code, i));
  return keys.some((k) => ratingOf(state, k)) ? readinessTally(state, keys).ready : null;
}

/** The verdict bands: ready from 80%, launch with a plan from 55%. */
export function readinessVerdict(ready: number): "ready" | "plan" | "not-yet" {
  return ready >= 80 ? "ready" : ready >= 55 ? "plan" : "not-yet";
}

export interface ReadinessCourse {
  name: string;
  /** Path on agile-agilist.com. */
  path: string;
  /** The success factors it helps close; the first is its main one. */
  factors: string[];
  why: string;
}

export const READINESS_TRAINING_SITE = "https://agile-agilist.com";
export const READINESS_COURSES: ReadinessCourse[] = [
  { name: "Launching AI-Native ARTs", path: "/training/ai-native/launching-ai-native-arts/", factors: ["SF4", "SF8"], why: "Launch the ART on outcomes: staffing, leadership alignment and the first PI Outcome Planning." },
  { name: "AI-Native Foundations", path: "/training/ai-native/ai-native-foundations/", factors: ["SF3", "SF5"], why: "AI fluency for everyone on the ART, and why curated data comes first." },
  { name: "AI-Native SAFe Fundamentals", path: "/training/ai-native/ai-native-ready-certification/", factors: ["SF5", "SF11"], why: "The shared language, the operating model and the AI Innovation Pipeline in one day." },
  { name: "AI-Native Value Architect", path: "/training/ai-native/ai-native-change-agent/", factors: ["SF6", "SF10"], why: "The people who bridge business goals and AI workflows, and keep intent, specifications and context connected." },
  { name: "Leading the AI-Native Organization", path: "/training/ai-native/ai-native-ready-certification-2/", factors: ["SF4", "SF12"], why: "For the leaders who set the guardrails and sponsor the launch." },
  { name: "Achieving Responsible AI with SAFe", path: "/training/safe-found/responsible-ai-safe/", factors: ["SF12", "SF3"], why: "Responsible AI practice, ethics and monitoring that everyone on the ART follows." },
  { name: "SAFe Lean Portfolio Management (LPM)", path: "/training/adv-safe/lpm/", factors: ["SF2"], why: "Portfolio outcomes, investment guardrails and funding that reach the ART." },
  { name: "SAFe Product Owner/Product Manager (POPM)", path: "/training/safe/popm/", factors: ["SF1", "SF7"], why: "Outcomes, OKRs and prioritisation for the people who own the backlog." },
  { name: "Agile Product Management (APM)", path: "/training/adv-safe/apm/", factors: ["SF7", "SF1"], why: "Product vision, outcome-driven roadmaps and learning milestones." },
  { name: "SAFe Release Train Engineer (RTE)", path: "/training/adv-safe/rte/", factors: ["SF8", "SF9"], why: "Facilitating planning on cadence, managing risks and running the ART's events." },
  { name: "SAFe DevOps", path: "/training/safe/devops/", factors: ["SF11"], why: "The pipeline, its embedded policies and the evidence it captures." },
  { name: "SAFe for Architects", path: "/training/safe/arch/", factors: ["SF10", "SF11"], why: "Specifications, architecture and the platform teams build from." },
  { name: "Advanced Scrum Master", path: "/training/safe/asm/", factors: ["SF9", "SF5"], why: "Coaching teams through an Align, Sense and Respond cadence." },
];

/**
 * The trainings that close the most open gaps, best first. A statement not in place weighs 2 and
 * one partially in place 1; a course's main factor counts in full and its others at 60%.
 */
export function readinessAdvice(state: Record<string, unknown>, limit = 5): (ReadinessCourse & { weight: number; closes: string[] })[] {
  const w = (code: string) => {
    const f = READINESS_FACTORS.find((x) => x.code === code);
    return f ? f.statements.reduce((n, _, i) => n + ({ N: 2, P: 1, F: 0 }[ratingOf(state, readinessKey(code, i)) ?? "F"] ?? 0), 0) : 0;
  };
  return READINESS_COURSES.map((c) => ({ ...c, closes: c.factors.filter((f) => w(f) > 0), weight: c.factors.reduce((n, f, i) => n + w(f) * (i ? 0.6 : 1), 0) }))
    .filter((c) => c.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

/** The assessment as the CSV of the companion app: a row per statement. */
export function readinessCsv(state: Record<string, unknown>): string {
  const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const rows = [["Lesson", "Success Factor Code", "Success Factor", "Statement", "Rating", "Coverage", "Action", "Roadmap Phase"]];
  for (const f of READINESS_FACTORS) f.statements.forEach((t, i) => {
    const k = readinessKey(f.code, i), r = ratingOf(state, k), a = readinessAction(state, k), gap = r === "P" || r === "N";
    rows.push([`Lesson ${f.shift + 2}: ${READINESS_SHIFTS[f.shift]}`, f.code, f.name, t, r ? READINESS_RATINGS.find((x) => x[0] === r)![1] : "Not rated", !gap ? (r ? "in place" : "open") : a ? "addressed" : "open", gap && a ? a.text : "", gap && a ? READINESS_PHASES[a.phase]![0] : ""]);
  });
  return rows.map((r) => r.map(q).join(",")).join("\n") + "\n";
}
