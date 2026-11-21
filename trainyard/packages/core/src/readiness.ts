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
  id: string;
  name: string;
  /** Path on agile-agilist.com. */
  path: string;
  /** A course people can register for, one that is launching soon (no date or price yet), or a free assessment. */
  kind: "course" | "soon" | "free";
  why: string;
}

export const READINESS_TRAINING_SITE = "https://agile-agilist.com";
export const READINESS_COURSES: ReadinessCourse[] = [
  { id: "aart", kind: "course", name: "Launching AI-Native ARTs", path: "/training/ai-native/launching-ai-native-arts/", why: "Launch the ART on outcomes: staffing, leadership alignment and the first PI Outcome Planning." },
  { id: "foundations", kind: "course", name: "AI-Native Foundations", path: "/training/ai-native/ai-native-foundations/", why: "AI fluency for everyone on the ART, and why curated data comes first. The prerequisite for AI-Native Value Architect." },
  { id: "fundamentals", kind: "course", name: "AI-Native SAFe Fundamentals", path: "/training/ai-native/ai-native-ready-certification/", why: "The shared language, the operating model and the AI Innovation Pipeline in one day." },
  { id: "aiva", kind: "course", name: "AI-Native Value Architect", path: "/training/ai-native/ai-native-change-agent/", why: "The people who bridge business goals and AI workflows, and keep intent, specifications and context connected." },
  { id: "leading", kind: "course", name: "Leading the AI-Native Organization", path: "/training/ai-native/ai-native-ready-certification-2/", why: "For the leaders who set the guardrails and sponsor the launch." },
  { id: "responsible", kind: "course", name: "Achieving Responsible AI with SAFe", path: "/training/safe-found/responsible-ai-safe/", why: "Responsible AI practice, data stewardship, ethics and monitoring that everyone on the ART follows." },
  { id: "lpm", kind: "course", name: "SAFe Lean Portfolio Management (LPM)", path: "/training/adv-safe/lpm/", why: "Portfolio outcomes, investment guardrails and funding that reach the ART." },
  { id: "bo", kind: "course", name: "SAFe Business Owner", path: "/training/safe/bo/", why: "For the business owners who steer the investment and assign business value in planning." },
  { id: "popm", kind: "course", name: "SAFe Product Owner/Product Manager (POPM)", path: "/training/safe/popm/", why: "Outcomes, OKRs and prioritisation for the people who own the backlog." },
  { id: "apm", kind: "course", name: "Agile Product Management (APM)", path: "/training/adv-safe/apm/", why: "Product vision, outcome-driven roadmaps and learning milestones." },
  { id: "rte", kind: "course", name: "SAFe Release Train Engineer (RTE)", path: "/training/adv-safe/rte/", why: "Facilitating planning on cadence, managing risks and running the ART's events." },
  { id: "devops", kind: "course", name: "SAFe DevOps", path: "/training/safe/devops/", why: "The pipeline, its embedded policies and the evidence it captures." },
  { id: "arch", kind: "course", name: "SAFe for Architects", path: "/training/safe/arch/", why: "Specifications, architecture and the platform teams build from." },
  { id: "asm", kind: "course", name: "Advanced Scrum Master", path: "/training/safe/asm/", why: "Coaching teams through an Align, Sense and Respond cadence." },
  { id: "ai-assessment", kind: "free", name: "AI Maturity & Readiness Assessment, with an advisory call", path: "/assessments/", why: "Free: get your Data Readiness score, then talk it through with an advisor." },
  { id: "mutation", kind: "free", name: "Mutation Readiness assessment", path: "/assessments/mutation-readiness/", why: "Free: 18 questions on how well the organization senses and responds at AI-age speed." },
  { id: "inno-creator", kind: "soon", name: "Innovation Creator", path: "/training/innovation-framework/innovation-creator/", why: "Small experiments with a written hypothesis and a blameless debrief." },
  { id: "inno-leader", kind: "soon", name: "Innovation Leader", path: "/training/innovation-framework/innovation-leader/", why: "Protect the explore budget with governance; choose two of sixteen." },
  { id: "inno-facilitator", kind: "soon", name: "Innovation Facilitator", path: "/training/innovation-framework/innovation-facilitator/", why: "Run the Innovation Matrix to choose which AI ideas get tested." },
];

/**
 * The results matrix: for each success factor with gaps, the main suggestion(s) and what else
 * helps, in the order shown. Courses that are launching soon come last in their row, so a gap
 * is never answered only by a course nobody can register for yet.
 */
export const READINESS_MATRIX: Record<string, { main: string[]; also: string[] }> = {
  SF1: { main: ["popm"], also: ["apm", "inno-creator"] },
  SF2: { main: ["lpm"], also: ["bo", "leading", "inno-leader"] },
  SF3: { main: ["responsible"], also: ["foundations", "ai-assessment"] },
  SF4: { main: ["aart", "leading"], also: [] },
  SF5: { main: ["fundamentals"], also: ["foundations", "asm"] },
  SF6: { main: ["aiva"], also: ["foundations"] },
  SF7: { main: ["apm"], also: ["popm"] },
  SF8: { main: ["aart"], also: ["rte"] },
  SF9: { main: ["rte"], also: ["asm", "mutation"] },
  SF10: { main: ["arch"], also: ["aiva"] },
  SF11: { main: ["devops"], also: ["fundamentals", "arch", "inno-facilitator"] },
  SF12: { main: ["responsible"], also: ["leading"] },
};

export type ReadinessSuggestion = ReadinessCourse & { weight: number; closes: string[] };

/**
 * What the results suggest, best first. A statement not in place weighs 2 and one partially in
 * place 1; a factor's main suggestion counts its gaps in full and the others at 60%. The five
 * strongest come first, then any course that is launching soon.
 */
export function readinessAdvice(state: Record<string, unknown>, limit = 5): ReadinessSuggestion[] {
  const all = READINESS_COURSES.map((c): ReadinessSuggestion => ({ ...c, weight: 0, closes: [] }));
  for (const f of READINESS_FACTORS) {
    const gap = f.statements.reduce((n, _, i) => n + ({ N: 2, P: 1, F: 0 }[ratingOf(state, readinessKey(f.code, i)) ?? "F"] ?? 0), 0);
    const row = READINESS_MATRIX[f.code];
    if (!gap || !row) continue;
    for (const [ids, share] of [[row.main, 1], [row.also, 0.6]] as const) for (const id of ids) {
      const c = all.find((x) => x.id === id);
      if (c) (c.weight += gap * share), c.closes.push(f.code);
    }
  }
  const ranked = all.filter((c) => c.weight > 0).sort((a, b) => b.weight - a.weight);
  return [...ranked.filter((c) => c.kind !== "soon").slice(0, limit), ...ranked.filter((c) => c.kind === "soon")];
}

/**
 * What one success factor's own ratings call for: nothing while it has no gaps, else its row of
 * the matrix, the main suggestion(s) first and courses that are launching soon last.
 */
export function readinessFactorAdvice(state: Record<string, unknown>, code: string): { gap: number; N: number; P: number; main: ReadinessCourse[]; also: ReadinessCourse[] } {
  const f = READINESS_FACTORS.find((x) => x.code === code), row = READINESS_MATRIX[code];
  const n = (c: ReadinessRating) => (f ? f.statements.filter((_, i) => ratingOf(state, readinessKey(code, i)) === c).length : 0);
  const N = n("N"), P = n("P"), pick = (ids: string[]) => ids.map((id) => READINESS_COURSES.find((c) => c.id === id)).filter((c): c is ReadinessCourse => !!c);
  if (!row || !(N + P)) return { gap: 0, N, P, main: [], also: [] };
  const also = pick(row.also);
  return { gap: N * 2 + P, N, P, main: pick(row.main), also: [...also.filter((c) => c.kind !== "soon"), ...also.filter((c) => c.kind === "soon")] };
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
