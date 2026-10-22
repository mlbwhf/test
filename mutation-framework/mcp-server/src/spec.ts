/**
 * Embedded Mutation Readiness Scorecard specification.
 *
 * Canonical source: ../../assessments/mutation-readiness-scorecard.yaml
 * (v1.0-draft, reconciled with Appendix A of "Mutation Readiness: An
 * Operating Manual for Innovation in the Age of AI"). This module mirrors
 * it so the server has no runtime file or YAML dependency. If the YAML
 * changes, regenerate this file.
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
  reading: string;
  recommendedActions: string[];
  readingList: string[];
}

export const SCALE = { min: 1, max: 5 } as const;
export const DIMENSION_MAX = 12;
export const MAX_SCORE = 72;
export const VERSION = "1.0-draft";

export const DIMENSIONS: Dimension[] = [
  {
    id: "signal-sensitivity",
    name: "Signal Sensitivity",
    definition:
      "The capability to detect, interpret, and act on weak signals before lagging metrics confirm them.",
    questions: [
      { id: "Q1.1", text: "Does your team monitor weak signals from at least three sources outside your own dashboards on a weekly basis? (Examples: customer Discord channels, developer forums, GitHub trends, competitor hiring patterns, regulatory leaks.)" },
      { id: "Q1.2", text: "Can you name a specific behavioural change in your customer base that you noticed in the past 30 days before it appeared in your metrics?" },
      { id: "Q1.3", text: "Do you have a structured cadence — a meeting, a ritual, a tool — for surfacing internal anomalies without political consequence to the person who raised them?" },
    ],
  },
  {
    id: "structural-flexibility",
    name: "Structural Flexibility",
    definition:
      "The organization's ability to reshape itself faster than competitors can retool.",
    questions: [
      { id: "Q2.1", text: "Are your teams aligned to customer outcomes (streams of value) rather than to internal functions (marketing, engineering, sales, etc.)?" },
      { id: "Q2.2", text: "Can a new product idea move from concept to validated learning in your organization in under 90 days?" },
      { id: "Q2.3", text: "When you identified a need to restructure something in the past 12 months, did you act on it within a quarter?" },
    ],
  },
  {
    id: "ai-talent-flywheel",
    name: "AI Talent Flywheel",
    definition:
      "The organization's capability to attract, retain, and integrate AI-literate talent across functions.",
    questions: [
      { id: "Q3.1", text: "Do you have at least one AI-literate person embedded in every major product or business team?" },
      { id: "Q3.2", text: "Is your AI talent distributed across the organization, or isolated in a single AI/ML function?" },
      { id: "Q3.3", text: "Does your AI talent have direct exposure to strategy decisions, not just to implementation work?" },
    ],
  },
  {
    id: "ambidextrous-capital",
    name: "Ambidextrous Capital",
    definition:
      "The discipline of balancing exploit (proven operations) with explore (uncertain bets) in your funding model.",
    questions: [
      { id: "Q4.1", text: "Do you have a protected exploration budget that is separate from your core P&L?" },
      { id: "Q4.2", text: "Are exploration bets evaluated on learning yield, not on traditional ROI?" },
      { id: "Q4.3", text: "Can an experiment with no clear ROI survive its first quarterly business review without being defunded?" },
    ],
  },
  {
    id: "ethical-guardrails",
    name: "Ethical Guardrails",
    definition:
      "Containment-as-velocity: the institutional discipline that lets you ship AI fast without dramatic reputational failure.",
    questions: [
      { id: "Q5.1", text: "Is every AI deployment in your organization governed by explicit operating boundaries and a recalibration cadence?" },
      { id: "Q5.2", text: "Do you have an AI governance function (not just a compliance function) with engineering rather than legal at its centre?" },
      { id: "Q5.3", text: "Can you produce, on request, an audit-quality explanation of any AI-driven decision affecting a customer?" },
    ],
  },
  {
    id: "narrative-coherence",
    name: "Narrative Coherence",
    definition:
      "The shared story that lets the organization act in concert under uncertainty.",
    questions: [
      { id: "Q6.1", text: "Can your employees describe, in their own words, what your organization is for in the current market (not the 2018 market)?" },
      { id: "Q6.2", text: "Has your leadership team updated the strategic narrative — the story you tell about why this company exists and why it wins — in the past 18 months?" },
      { id: "Q6.3", text: "Can new hires articulate your strategic narrative after their first month on the job?" },
    ],
  },
];

export const BANDS: Band[] = [
  {
    id: "mutation-blind",
    name: "Mutation-Blind",
    range: [0, 30],
    reading:
      "Your organization is operating on lagging metrics in an environment that is mutating around it. Disruption is probably already happening, undetected.",
    recommendedActions: [
      "Stand up a SignalNet — a distributed, semi-anonymous logging system for any employee to surface weak signals (template in Mutation Readiness Appendix E).",
      "Run an Assumption Audit on your current strategy (template in Appendix C, or Chapter 4 of the Operating Manual).",
      "Begin a weekly signal review at the leadership team level, 30 minutes, anomaly-focused.",
    ],
    readingList: [
      "Amy Edmondson, Right Kind of Wrong (2023)",
      "Mustafa Suleyman, The Coming Wave (2023)",
    ],
  },
  {
    id: "mutation-aware",
    name: "Mutation-Aware",
    range: [31, 50],
    reading:
      "Your organization can sense change but cannot yet act on it at the right cadence. The sense-to-respond gap is the primary risk.",
    recommendedActions: [
      "Build an experimentation engine using the five components in Chapter 10 of the Operating Manual.",
      "Apply the Five Levers framework deliberately (Chapter 9) — pick the two levers your organization scored lowest on and design specific 90-day moves on each.",
      "Measure mutation latency: time from signal identification to organizational decision. Target < 21 days.",
    ],
    readingList: [
      "Iansiti & Lakhani, Competing in the Age of AI (2020)",
      "Rita McGrath, Seeing Around Corners (2019)",
      "Ethan Mollick, Co-Intelligence (2024)",
    ],
  },
  {
    id: "mutation-ready",
    name: "Mutation-Ready",
    range: [51, 72],
    reading:
      "Your organization is operating in the top decile. The risk now is complacency.",
    recommendedActions: [
      "Institutionalize the practices that got you here. They erode without explicit maintenance.",
      "Begin to mentor adjacent organizations. The best stress-test of whether your practices are real is whether you can teach them.",
      "Consider whether the language of \"mutation readiness\" should be part of how you describe your operating model externally — to investors, to talent, to partners.",
    ],
    readingList: [
      "Amy Edmondson, The Fearless Organization (2018)",
      "Mary Murphy, Cultures of Growth (2024)",
      "Anthropic interpretability research (Mapping the Mind, 2024; On the Biology of a Large Language Model, 2025)",
    ],
  },
];

/** Rapid mode: one question per dimension, the strongest single signal. */
export const RAPID_MODE = {
  questionIds: ["Q1.2", "Q2.2", "Q3.2", "Q4.3", "Q5.3", "Q6.1"],
  totalMax: 30,
  bands: [
    { id: "mutation-blind", range: [0, 12] as [number, number] },
    { id: "mutation-aware", range: [13, 22] as [number, number] },
    { id: "mutation-ready", range: [23, 30] as [number, number] },
  ],
};

export const ALL_QUESTION_IDS: string[] = DIMENSIONS.flatMap((d) =>
  d.questions.map((q) => q.id)
);

export function bandForScore(score: number): Band {
  const band = BANDS.find((b) => score >= b.range[0] && score <= b.range[1]);
  if (!band) throw new Error(`score ${score} outside 0-${MAX_SCORE}`);
  return band;
}
