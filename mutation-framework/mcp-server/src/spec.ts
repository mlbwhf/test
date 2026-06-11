/**
 * Embedded Mutation Readiness Scorecard specification.
 *
 * Canonical source: ../../assessments/mutation-readiness-scorecard.yaml
 * (v1.0-draft). This module mirrors it so the server has no runtime file
 * or YAML dependency. If the YAML changes, regenerate this file.
 */

export interface Question {
  id: string;
  text: string;
}

export interface Dimension {
  id: string;
  name: string;
  definition: string;
  questions: Question[];
}

export interface Band {
  id: string;
  name: string;
  range: [number, number];
  summary: string;
  thirtyDayActions: string[];
}

export const SCALE = { min: 1, max: 5 } as const;
export const MAX_SCORE = 72;
export const VERSION = "1.0-draft";

export const DIMENSIONS: Dimension[] = [
  {
    id: "signal-detection",
    name: "Signal Detection",
    definition:
      "The ability to notice weak signals of technological, market, and behavioral change early — including from outside the organization's own industry — and route them to people who can act.",
    questions: [
      { id: "SD1", text: "We systematically scan for weak signals of technological and market change, including from outside our own industry." },
      { id: "SD2", text: "Frontline observations about customer or market shifts reach decision-makers within days, not quarters." },
      { id: "SD3", text: "We keep a shared, living log of signals that is reviewed on a regular cadence, not an ad-hoc inbox." },
    ],
  },
  {
    id: "decision-velocity",
    name: "Decision Velocity",
    definition:
      "The speed and decisiveness with which a confirmed signal becomes a resourced response — including the speed of stopping things.",
    questions: [
      { id: "DV1", text: "When a significant signal is confirmed, we can reallocate budget toward a response within one quarter." },
      { id: "DV2", text: "Decision rights for experiments sit with the teams closest to the signal, not with a remote committee." },
      { id: "DV3", text: "We stop underperforming initiatives quickly and without political fallout for the people who ran them." },
    ],
  },
  {
    id: "experimentation-capacity",
    name: "Experimentation Capacity",
    definition:
      "The standing ability to run many small, cheap, fast experiments and harvest learning from all of them, including the failures.",
    questions: [
      { id: "EC1", text: "We run a continuous portfolio of small, cheap experiments rather than a few large bets." },
      { id: "EC2", text: "Failed experiments are documented and mined for learning, not quietly buried." },
      { id: "EC3", text: "Teams have self-service access to the tools, data, and budget they need to test an idea this week, not next quarter." },
    ],
  },
  {
    id: "ai-fluency",
    name: "AI Fluency",
    definition:
      "How deeply practical AI capability is embedded in everyday work across the organization — beyond pilots, labs, and slideware.",
    questions: [
      { id: "AF1", text: "AI tools are embedded in everyday workflows across functions, not confined to a lab or a pilot team." },
      { id: "AF2", text: "Our people have a realistic working understanding of what current AI can and cannot do." },
      { id: "AF3", text: "We have explicit guardrails for AI use (data, quality, ethics) that enable adoption rather than block it." },
    ],
  },
  {
    id: "structural-plasticity",
    name: "Structural Plasticity",
    definition:
      "How quickly the organization can reshape teams, budgets, processes, and tooling around a new opportunity without a reorg trauma.",
    questions: [
      { id: "SP1", text: "We can stand up, resize, or dissolve a team around a new opportunity within weeks." },
      { id: "SP2", text: "Budgets are reviewed and reallocated on a rolling basis rather than locked for the fiscal year." },
      { id: "SP3", text: "Our processes and tooling are modular enough that changing one part does not force changing everything." },
    ],
  },
  {
    id: "leadership-posture",
    name: "Leadership Posture",
    definition:
      "The behavioral substrate: whether leaders model adaptation, whether bad news travels upward fast, and whether incentives reward learning over plan compliance.",
    questions: [
      { id: "LP1", text: "Leaders here publicly change their positions when evidence contradicts them." },
      { id: "LP2", text: "Psychological safety is high enough that bad news travels upward fast and unfiltered." },
      { id: "LP3", text: "Incentives reward adaptation and learning, not only predictability and plan compliance." },
    ],
  },
];

export const BANDS: Band[] = [
  {
    id: "mutation-blind",
    name: "Mutation-Blind",
    range: [0, 30],
    summary:
      "The organization does not yet see the signals of change that matter, or sees them too late to act. Innovation happens by accident, not design.",
    thirtyDayActions: [
      "Stand up a weekly 30-minute signal review with one named owner; log every signal in a shared document.",
      "Run the assessment with your leadership team individually and compare answers — the spread is the diagnosis.",
      "Pick one stalled decision older than 90 days and force it to a yes/no this month; document what blocked it.",
    ],
  },
  {
    id: "mutation-aware",
    name: "Mutation-Aware",
    range: [31, 50],
    summary:
      "The organization sees change coming and talks about it, but its structures, budgets, and incentives still reward the old game. Awareness has not yet become capability.",
    thirtyDayActions: [
      "Give one team a protected experiment budget with pre-agreed kill criteria and a 30-day review date.",
      "Move one recurring decision from a committee to the team closest to the customer; measure cycle time before and after.",
      "Map your current AI usage across functions with the indicator-dashboard template; pick the two biggest gaps.",
    ],
  },
  {
    id: "mutation-ready",
    name: "Mutation-Ready",
    range: [51, 72],
    summary:
      "The organization senses, decides, and reconfigures faster than its market changes. The work now is keeping the edge: cadence, recalibration, and not regressing under pressure.",
    thirtyDayActions: [
      "Schedule the quarterly reassessment now and assign a dimension owner for each of the six dimensions.",
      "Publish one internal case study of a killed experiment and what it taught you; make learning visible.",
      "Stress-test structural plasticity by simulating one team re-formation end-to-end on paper; fix the slowest step.",
    ],
  },
];

export const ALL_QUESTION_IDS: string[] = DIMENSIONS.flatMap((d) =>
  d.questions.map((q) => q.id)
);

export function bandForScore(score: number): Band {
  const band = BANDS.find((b) => score >= b.range[0] && score <= b.range[1]);
  if (!band) throw new Error(`score ${score} outside 0-${MAX_SCORE}`);
  return band;
}
