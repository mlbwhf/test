// Event boards: what a train needs to prepare a PI, run PI planning and close the PI, built from
// the same designed exercise boards the classes use (the RTE and Leading SAFe courses), so a
// package from the template gallery opens in the class design, not on a blank canvas.

import type { ActivitySpec } from "../activities.js";
import type { Board } from "../boards.js";
import { classBoard, type ClassSpec, type Exercise } from "../classes.js";
import { AI_NATIVE_ARTS_COURSE, AI_NATIVE_ASSESS_101112, AI_NATIVE_ASSESS_456, AI_NATIVE_ASSESS_789 } from "./ai-native-arts.js";
import { LEADING_SAFE_COURSE } from "./leading-safe.js";
import { RTE_COURSE } from "./rte.js";

type Course = { title: string; activities: ActivitySpec[] }[];
const pick = (course: Course, titles: string[]): ActivitySpec[] =>
  titles.map((t) => course.flatMap((l) => l.activities).find((a) => a.title === t) ?? (() => { throw new Error(`No activity "${t}"`); })());
const rte = (...titles: string[]) => pick(RTE_COURSE, titles);
const lsa = (...titles: string[]) => pick(LEADING_SAFE_COURSE, titles);
const aart = (...titles: string[]) => pick(AI_NATIVE_ARTS_COURSE, titles);

const SIZE = { width: 1200, height: 600 };

// The AI-Native ART Launch Plan (Launching AI-Native ARTs, slides 1-20 and 6-5): what to do ahead of
// the first PI Outcome Planning, ahead of the first Sense and Respond, and after, per shift, with
// the example plan's own items in each cell until the group writes theirs.
const LAUNCH_PLAN: ActivitySpec = {
  title: "Build the AI-Native ART Launch Plan",
  kind: "Activity",
  prepare: 20,
  share: 10,
  steps:
    "Step 1: Review the gaps from your launch readiness assessment.\nStep 2: For each gap, add an action to the plan: ahead of the first PI Outcome Planning, ahead of the first Sense and Respond, or after.\nStep 3: Be prepared to share your launch plan.",
  board: "matrix",
  config: {
    intro: "Based on gaps, we will build our AI-Native ART Launch Plan.",
    corner: "",
    cols: ["Ahead of First PI Outcome Planning", "Ahead of First Sense and Respond", "After"],
    rows: [{ title: "Foundational Activities" }, { title: "Shift 1: Focus on Outcome-Driven Flow" }, { title: "Shift 2: Cross-Functional, AI-Augmented Teams" }, { title: "Shift 3: Iterative Learning and Rapid Experimentation Cycles" }, { title: "Shift 4: Development and Innovation at Scale" }],
    examples: {
      "0.0": ["Align on ART cadence", "Foundational AI training for teams", "AI-Native SAFe for Teams training", "List approved AI tools"],
      "1.0": ["Define Portfolio and ART OKRs", "Commit to Curated Data strategy"],
      "1.1": ["Automate data collection for Key Results", "Create dashboard for outcome progress"],
      "1.2": ["Begin Curated Data strategy implementation"],
      "2.0": ["Train additional AI Value Architects", "Draft ART level AI Governance and Ethics policies"],
      "2.2": ["Identify missing Team Capabilities post-iteration"],
      "3.0": ["Revitalize Product Vision"],
      "3.1": ["Begin Customer Demos for feedback", "Create Outcome-Driven Roadmap"],
      "4.0": ["Communicate Product Intent and Context", "Set up repository for Intent, Specification and Context", "Invest in AI Innovation Pipeline, workflows, and platforms"],
      "4.1": ["Automate policies in AI Innovation Pipeline"],
      "4.2": ["Address gaps in existing portfolio AI Governance and Ethics framework"],
    },
  },
  ...SIZE,
};

const SHARE_PLAN: ActivitySpec = {
  title: "Share your plan",
  kind: "Discussion",
  prepare: 10,
  steps: "As a class, consider who needs to see this plan and how you will share it with them. The AI-Native Launch Plan is a living document.",
  board: "lanes",
  config: { layout: "grid", cols: 2, lanes: [{ title: "Name the people, the format, and what you need from them when they see it" }, { title: "What is your ongoing plan for communication?" }] },
  ...SIZE,
};

// The intent document (slides 5-5 and 5-6): the product vision and ART outcomes made specific as
// strategy intent and execution intent, with the specifications and context that trace to it.
const INTENT: ActivitySpec = {
  title: "Intent document",
  kind: "Activity",
  prepare: 30,
  share: 10,
  steps:
    "Product vision and ART outcomes define the ART’s ultimate purpose; intent causes that purpose to become specific.\nStep 1: Write the product vision and the ART outcomes the intent traces back to.\nStep 2: Set the strategy intent: where to play and how to win.\nStep 3: Set the execution intent: what to build and what to learn.\nStep 4: Note the specifications and the context that depend on this intent.",
  board: "lanes",
  config: {
    layout: "rows",
    intro: "Intent provides people with a shared reason behind daily decisions, and provides AI with a stable reference to reason from when priorities compete. Everything traces back up to the vision.",
    lanes: [
      { title: "Product Vision", examples: ["Defend and extend our lead in mid-market work management as AI-Native rivals emerge."] },
      { title: "ART Outcomes", examples: ["Make AI assistance the capability customers choose the platform for."] },
      { title: "Strategy Intent: Where to play", examples: ["Renewal-at-risk customers being courted by AI-Native rivals."] },
      { title: "Strategy Intent: How to win", examples: ["AI assistance as the capability that earns their trust."] },
      { title: "Execution Intent: To build", examples: ["AI Planning Assistant, on the hypothesis that smarter planning drives renewal."] },
      { title: "Execution Intent: To learn", examples: ["An experiment: does AI-driven planning actually lift renewal?"] },
      { title: "Specifications", examples: ["The “what and how,” or detail people and AI agents can build from"] },
      { title: "Context", examples: ["The “where,” or the environment the product must succeed in"] },
    ],
  },
  ...SIZE,
};

// PI Outcome Planning (lesson 4): the draft PI outcomes, the one-day agenda, the planning board
// with its four kinds of milestone, the management review board and the Sense and Respond event.
const DRAFT_OUTCOMES: ActivitySpec = {
  title: "Draft PI Outcomes",
  kind: "Activity",
  prepare: 30,
  steps:
    "Draft PI Outcomes are drafted by ART Leadership and Business Owners, informed by recent Sense and Respond insights, shared with teams about a week before PI Outcome Planning, and meant to be tested and refined.\nStep 1: Write each objective.\nStep 2: Add its key results as stickies.",
  board: "lanes",
  config: {
    layout: "grid",
    cols: 3,
    heading: { label: "ART", placeholder: "Retail Pharmacy ART" },
    lanes: [
      { title: "Objective 1", examples: ["Scale Specialized Diets", "KR1: Increase quarterly revenue from specialized diet product lines by 12%", "KR2: 40% of diabetic-flagged households complete a guided diet-swap journey"] },
      { title: "Objective 2", examples: ["Optimize Margins", "KR1: Reduce cost-to-serve per basket by 8%", "KR2: Increase blended gross margin on promoted baskets by 5%"] },
      { title: "Objective 3", examples: ["Household Gamification", "KR1: enroll 100,000 multi-user households into shared health challenges", "KR2: 55% of enrolled households complete >= 1 challenge weekly"] },
    ],
  },
  ...SIZE,
};
const AGENDA_DAY: ActivitySpec = {
  title: "One-day PI Outcome Planning agenda",
  kind: "Activity",
  steps: "Morning 3.5 hours: draft the plan. Afternoon 3.5 hours: finalize the plan. Use the notes beside each slot for who presents and what is needed.",
  board: "lanes",
  config: {
    layout: "rows",
    lanes: [
      { title: "30 min · Business Context" },
      { title: "30 min · Outcome Breakout" },
      { title: "1 hour · Team Breakout" },
      { title: "30 min · Outcome Breakout", examples: ["(Draft the PI Outcome Planning Board / Surface Decisions Needed and Risks)"] },
      { title: "1 hour · Draft PI Outcome Planning Board Presentation" },
      { title: "Lunch during Management Review and Problem-Solving" },
      { title: "30 min · Communicate Planning Adjustments" },
      { title: "30 min · Outcome Breakout" },
      { title: "1 hour · Team Breakout" },
      { title: "30 min · Outcome Breakout", examples: ["(Finalize the PI Outcome Planning Board)"] },
      { title: "1 hour · Final Plan Review" },
    ],
  },
  ...SIZE,
};
const MILESTONES: [string, string][] = [["Fixed-Date Milestone", "#3d3d3d"], ["Learning Milestone", "#0a7cc4"], ["Synchronization Milestone", "#e8912d"], ["Release", "#a9c23f"]];
const ITERATIONS = ["Iteration 1", "Iteration 2", "Iteration 3", "Iteration 4", "Iteration 5", "Next PI"];
const OUTCOME_BOARD: ActivitySpec = {
  title: "PI Outcome Planning board",
  kind: "Activity",
  steps:
    "Step 1: Write each PI outcome with its key results in the first column.\nStep 2: In the outcome breakouts, add the team outcomes that contribute to each PI outcome.\nStep 3: Place the ART milestones, then each outcome’s fixed-date milestones, learning milestones, synchronization milestones and releases in the iteration where they land.\nStep 4: In the final plan review, confirm the ART’s commitments.",
  board: "matrix",
  config: {
    corner: "PI Outcomes",
    cols: ["Team Outcomes", ...ITERATIONS],
    types: MILESTONES,
    rows: [
      { title: "ART Milestones", band: true },
      { title: "PI Outcome 1", editable: true, placeholder: "Scale Specialized Diets\n• Increase quarterly revenue from specialized-diet product lines by 12%.\n• 40% of diabetic-flagged households complete a guided diet-swap journey." },
      { title: "PI Outcome 2", editable: true, placeholder: "Optimize Margins\n• Reduce cost-to-serve per basket by 8%\n• Increase blended gross margin on promoted baskets by 5%" },
      { title: "PI Outcome 3", editable: true, placeholder: "Household Gamification\n• Enroll 100,000 multi-user households into shared health challenges\n• 55% of enrolled households complete ≥1 challenge weekly" },
      { title: "Other" },
    ],
  },
  ...SIZE,
};
const TEAM_BOARD: ActivitySpec = {
  title: "Team planning board",
  kind: "Activity",
  prepare: 60,
  steps: "Team breakouts test milestones, balance commitments, and refine outcomes.\nStep 1: Write each team outcome with its key results.\nStep 2: Place the work and the milestones in the iteration where they land.\nStep 3: Look for an iteration that carries too much, and raise decisions needed and risks on the management review board.",
  board: "matrix",
  config: {
    corner: "Team Outcomes",
    cols: ITERATIONS,
    types: MILESTONES,
    rows: [
      { title: "ART Milestones", band: true },
      { title: "Team Outcome 1", editable: true, placeholder: "Raise confidence in specialized diet choices at checkout\n• Raise diet-swap recommendation acceptance from 0% to 10%\n• Raise diabetic-household diet-swap completion from 15% to 30%" },
      { title: "Team Outcome 2", editable: true, placeholder: "Make the family cart a shared habit\n• Grow weekly challenge-linked baskets among enrolled households from 10% to 40%\n• Raise in-cart challenge-progress nudges acted on from 5% to 25%" },
      { title: "Team Outcome 3", editable: true, placeholder: "Make agents dependable co-builders with curated data\n• Raise agent-change first-pass acceptance from 40% to 70%\n• Cut spec-to-validated-change-cycle time from 5 days to 1.5" },
      { title: "Other" },
    ],
  },
  ...SIZE,
};
const MGMT_REVIEW: ActivitySpec = {
  title: "Management review and problem-solving",
  kind: "Activity",
  steps: "Teams add items to the management review board throughout the PI Outcome Planning event.\nStep 1: Add decisions needed and risks as they surface.\nStep 2: During the management review and problem-solving, move each decision to confirmed and capture the actions.",
  board: "lanes",
  config: { layout: "grid", cols: 2, lanes: [{ title: "Decisions Needed" }, { title: "Risks" }, { title: "Decisions Confirmed" }, { title: "Actions" }] },
  ...SIZE,
};
const SENSE_RESPOND: ActivitySpec = {
  title: "Sense and Respond event",
  kind: "Activity",
  prepare: 120,
  steps:
    "Cadence: at least once per iteration, plus immediate events for significant signals. Attendees: RTE (as facilitator), AI-Native Teams, Product Management, System Architects, Business Owners, AI Value Architects.\nHour 1, Sensing: Define a shared understanding of insights, feedback, and data.\nHour 2, Responding: Align on the actions that follow.",
  board: "lanes",
  config: {
    layout: "rows",
    intro: "Example Sense and Respond Event Agenda (2 Hours)",
    lanes: [
      { title: "Sensing · Progress against outcomes", examples: ["10 mins"] },
      { title: "Sensing · Product demos and insights", examples: ["20 mins"] },
      { title: "Sensing · Workflow improvements and challenges", examples: ["15 mins"] },
      { title: "Sensing · Customer feedback and metric review", examples: ["15 mins"] },
      { title: "Responding · Identify response areas", examples: ["10 mins"] },
      { title: "Responding · Explore options", examples: ["30 mins"] },
      { title: "Responding · Agree on decisions and actions", examples: ["20 mins"] },
    ],
  },
  ...SIZE,
};

export interface EventSpec {
  /** The package id in the template gallery. */
  id: string;
  name: string;
  short: string;
  blurb: string;
  /** When in the PI the package is used. */
  when: string;
  days: number;
  parts: Course;
}

export const EVENT_BOARDS: EventSpec[] = [
  {
    id: "ai-native-launch-readiness",
    name: "AI-Native ART launch readiness",
    short: "READY",
    blurb: "The AI-Native SAFe Launch Readiness Assessment: calibrate on the scale, evaluate the four statements of each of the twelve success factors as fully, partially or not in place, review the gaps, build the AI-Native ART Launch Plan and write the intent document.",
    when: "Ahead of the first PI Outcome Planning",
    days: 2,
    parts: [
      { title: "Calibrate", activities: aart("Try the assessment scale") },
      { title: "Shift 1: Focus on Outcome-Driven Flow", activities: aart("Outcome-driven product development", "Portfolio and investment strategy", "Curated data") },
      { title: "Shift 2: Cross-Functional, AI-Augmented Teams", activities: AI_NATIVE_ASSESS_456 },
      { title: "Shift 3: Iterative Learning and Rapid Experimentation Cycles", activities: AI_NATIVE_ASSESS_789 },
      { title: "Shift 4: Development and Innovation at Scale", activities: AI_NATIVE_ASSESS_101112 },
      { title: "Gaps, launch plan and intent", activities: [...aart("Gap analysis review"), LAUNCH_PLAN, SHARE_PLAN, INTENT] },
    ],
  },
  {
    id: "pi-outcome-planning",
    name: "PI Outcome Planning",
    short: "PIO",
    blurb: "The one-day PI Outcome Planning event of an AI-Native ART: the draft PI outcomes, the agenda, the PI Outcome Planning board with ART milestones, team outcomes, learning and synchronization milestones and releases, a team planning board, the management review board, and the Sense and Respond event that follows each iteration.",
    when: "PI Outcome Planning, one day, then Sense and Respond each iteration",
    days: 1,
    parts: [
      { title: "Before the event", activities: [DRAFT_OUTCOMES] },
      { title: "PI Outcome Planning", activities: [AGENDA_DAY, OUTCOME_BOARD, TEAM_BOARD, MGMT_REVIEW] },
      { title: "Sense and Respond", activities: [SENSE_RESPOND] },
    ],
  },
  {
    id: "prepare-pi-planning",
    name: "Prepare for PI planning",
    short: "PREP",
    blurb: "Get the content, the teams and the room ready: how much preparation is enough, the ART readiness checklist sorted into must be in place, not needed and depends, and the ART backlog through the Kanban.",
    when: "Through the PI, finishing in the IP iteration",
    days: 1,
    parts: [
      { title: "PI planning readiness", activities: rte("How much preparation is enough?", "PI Planning readiness preparation") },
      { title: "The ART backlog", activities: rte("Build your own ART kanban board") },
    ],
  },
  {
    id: "pi-planning",
    name: "PI planning",
    short: "PI",
    blurb: "The two days in the planning room: capacity, a train per team with its iterations, the ART planning board with dependencies, the Coach Sync, the draft plan review, business value, ART PI risks to ROAM and what to do when confidence is not high.",
    when: "PI planning, days 1 and 2",
    days: 2,
    parts: [
      { title: "Team breakouts", activities: lsa("Calculate your initial capacity", "PI planning board", "Coach Sync") },
      { title: "Plan review and business value", activities: [...lsa("Draft plan review", "Setting business value"), ...rte("Reading the ART planning board in PI Planning")] },
      { title: "Risks and confidence", activities: [...lsa("Manage ART PI risks"), ...rte("ROAM ART PI risks", "Confidence not high? Plan rework.")] },
    ],
  },
  {
    id: "closing-pi",
    name: "Close the PI",
    short: "I&A",
    blurb: "The IP iteration and then Inspect & Adapt: balancing the IP iteration, preparing the PI System Demo, and the problem-solving workshop from the agreed problem through root cause analysis to the improvement backlog.",
    when: "The IP iteration, then Inspect & Adapt",
    days: 1,
    parts: [
      { title: "The IP iteration and the PI System Demo", activities: rte("Balancing the IP iteration", "Preparing for the PI System Demo") },
      { title: "Problem-solving workshop", activities: rte("Problem-solving workshop: full board", "Agree on the problem", "Root cause analysis", "Restate the new problem", "Brainstorm solutions", "Problem-solving workshop readout") },
    ],
  },
];

const asClass = (e: EventSpec, parts: Course): ClassSpec => ({
  id: `event-${e.id}`, name: e.name, short: e.short, blurb: e.blurb, days: e.days, welcome: ["Quick agenda"],
  lessons: parts.map((l) => ({ title: l.title, exercises: l.activities.map((a): Exercise => ({ kind: "slide", title: `${a.kind}: ${a.title}`, body: "", minutes: (a.prepare ?? 0) + (a.share ?? 0) })) })),
  course: parts,
});

/** The event's board: every part with its exercises, or (`part`) one part alone. Opens in the class design; `fields.event` marks it as an event, not a class. */
export function eventBoard(e: EventSpec, part?: number, now?: string): Board {
  const b = classBoard(asClass(e, part === undefined ? e.parts : [e.parts[part]!]), now);
  b.id = `tpl-builtin-event-${e.id}${part === undefined ? "" : `-${part + 1}`}`;
  b.origin = { ...b.origin, externalId: `builtin:event-${e.id}` };
  b.fields = { ...b.fields, event: e.id };
  if (part !== undefined) b.name = `${e.name} · ${e.parts[part]!.title}`;
  // The agenda's tickets read "Part n", as the board does for an event.
  for (const f of b.frames) {
    const items = f.activity?.board === "agenda" ? (f.activity.config?.items as { t: string }[] | undefined) : undefined;
    if (items) for (const it of items) it.t = it.t.replace(/^Lesson (\d+): /, "Part $1: ");
  }
  return b;
}

/** The event template with this id ("tpl-builtin-event-<id>" or "…-<part>"), so boards made from it follow its updates. */
export function eventTemplate(id: string | undefined, now?: string): Board | undefined {
  const m = /^tpl-builtin-event-(.+?)(?:-(\d+))?$/.exec(id ?? "");
  const e = m && EVENT_BOARDS.find((x) => x.id === m[1] || x.id === `${m[1]}-${m[2]}`);
  if (!m || !e) return undefined;
  const part = e.id === m[1] && m[2] ? Number(m[2]) - 1 : undefined;
  return part !== undefined && !e.parts[part] ? undefined : eventBoard(e, part, now);
}
