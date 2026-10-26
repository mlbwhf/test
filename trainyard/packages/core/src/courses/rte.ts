// Release Train Engineer (RTE) class, chapter by chapter: each exercise with its timing, steps,
// the material shown beside it and the board learners work on.
//
// © Scaled Agile, Inc. Used under the Scaled Agile partner agreement; not covered by this
// repository's Apache License 2.0. See NOTICE.md in this folder.

import type { ActivityItem, ActivitySpec } from "../activities.js";
import { PI_PLANNING_READINESS } from "../canvases.js";

const PIC = "/courses/rte";
const RTE_ROLE = { title: "The RTE role", image: `${PIC}/rte-role.webp` };

/** Headed columns of blank stickies for groups to fill. */
function columns(labels: string[], blanks = 3, w = 440): ActivityItem[] {
  return labels.flatMap((label, i) => {
    const x = 30 + i * (w + 40);
    return [{ kind: "text" as const, text: label, x, y: 20, width: w, height: 70, fontSize: 30, locked: true }, ...Array.from({ length: blanks }, (_, r) => ({ kind: "card" as const, text: "", x: x + (r % 2) * 220, y: 110 + Math.floor(r / 2) * 150, width: 200, height: 130 }))];
  });
}
const widthFor = (n: number) => 30 + n * 480 + 20;

// The Big Picture is 1368 × 850; on the board it is 1400 wide.
const BP_W = 1400;
const BP_H = Math.round((BP_W * 850) / 1368);
const onBp = (x: number, y: number) => ({ x: 30 + Math.round((x * BP_W) / 1368), y: 60 + Math.round((y * BP_W) / 1368) });

const lesson1: ActivitySpec[] = [
  {
    title: "Identify RTE connections",
    kind: "Activity",
    prepare: 7,
    share: 3,
    width: 1460,
    height: BP_H + 120,
    steps: "Step 1: Working in your groups, use the Big Picture to identify connections between the RTE and other Framework elements across communication, collaboration, problem-solving, and inputs/outputs. Identify at least one connection for each type.\nStep 2: Be ready to present and discuss the connections you identify.",
    connectionTypes: [
      { id: "communicates", label: "Communication", color: "#c2412d" },
      { id: "collaborates", label: "Collaboration", color: "#2f6fbd" },
      { id: "facilitates", label: "Facilitate", color: "#2e8b57" },
      { id: "gathers", label: "Input/Output", color: "#d98a1c" },
    ],
    side: [{ title: "Example connections", image: `${PIC}/rte-connections-example.png`, instructorOnly: true }],
    items: [
      { kind: "image", src: `${PIC}/big-picture.png`, x: 30, y: 60, width: BP_W, height: BP_H },
      { kind: "dot", text: "RTE", ...((p) => ({ x: p.x - 18, y: p.y - 18 }))(onBp(668, 300)), color: "#7b3f8c" },
    ],
  },
  {
    title: "Exploring RTE responsibilities",
    kind: "Discussion",
    prepare: 15,
    width: widthFor(3),
    height: 600,
    steps: "Step 1: With your group, choose one key responsibility of the RTE.\nStep 2: Brainstorm concrete activities and behaviors a skilled RTE would use to fulfill that responsibility. Think about day-to-day actions, facilitation techniques, and coaching approaches.\nStep 3: Create a concise and engaging two-minute overview. Highlight how these behaviors contribute to the team, the ART, and the organization achieving better outcomes.\nStep 4: Be prepared to share with the class.",
    side: [{ title: "Release Train Engineer article", url: "https://framework.scaledagile.com/release-train-engineer/" }, RTE_ROLE],
    items: columns(["Responsibility we chose", "Activities and behaviors", "Our two-minute overview"]),
  },
  {
    title: "SAFe foundations filter",
    kind: "Discussion",
    prepare: 5,
    share: 3,
    width: widthFor(4),
    height: 600,
    steps: "Step 1: Individually, recall a recent tough situation or decision you experienced as an RTE\nStep 2: Consider which SAFe foundational concept (Lean-Agile mindset, Core Values, or SAFe Principles) guided that decision\nStep 3: Discuss with your group:\n- How did that foundation shape the outcome?\n- What might have happened if it had been ignored or misunderstood?\nStep 4: Be prepared to share one takeaway with the class",
    items: columns(["The situation", "Foundation that guided it", "How it shaped the outcome", "Our takeaway"]),
  },
  {
    title: "AI disruption and the RTE role",
    kind: "Discussion",
    prepare: 15,
    share: 5,
    width: widthFor(3),
    height: 600,
    steps: "Step 1: In your group, explore how the widespread adoption of AI could augment Release Train Engineers’ responsibilities and support teams in delivering value. For example, consider:\n- PI Planning facilitation: How might AI-assisted planning tools and dependency mapping change how you prepare for and facilitate PI Planning events, and how you budget your time?\n- Impediment identification: How might AI analyzing team metrics, flow data, and retrospective feedback change how you identify and remove impediments across the ART?\n- Coach and servant leader priorities: How might AI handling coordination and reporting tasks change how you support team-level and ART-level continuous improvement?\nStep 2: Be prepared to share with the class.",
    side: [RTE_ROLE],
    items: columns(["PI Planning facilitation", "Impediment identification", "Coach and servant leader priorities"]),
  },
  {
    title: "Prepare for a conversation",
    kind: "Activity",
    prepare: 10,
    width: widthFor(4),
    height: 600,
    steps: "Step 1: In your group, consider the following scenario:\nYou are an RTE and have just been told by your Lean-Agile Center of Excellence that PI Planning is going to be virtual this quarter due to budget cuts. The VP of Engineering is not happy about this decision, as they are a strong supporter of in-person PI Planning. You plan to have a conversation with her to address her concerns and keep her engaged and committed to the event.\nStep 2: Use an LLM of your choice (ChatGPT, Claude, SAFe CoPilot, etc.) and ask it to help you prepare for a conversation with the VP of Engineering. Be sure to include the five key elements in your prompt.\nStep 3: With your group, evaluate the response and identify the following, with explanations for each:\n- One line you'd keep.\n- One line you'd change.\n- One line you would not say.\nStep 4: Be prepared to share with the class.",
    side: [{ title: "A good prompt: five elements", image: `${PIC}/prompt-elements.webp` }],
    items: columns(["Our prompt", "One line we'd keep", "One line we'd change", "One line we would not say"]),
  },
];

const lesson2: ActivitySpec[] = [
  {
    title: "Key ART collaborations",
    kind: "Discussion",
    prepare: 8,
    width: widthFor(2),
    height: 600,
    steps: "As a class, discuss how the RTE facilitates connections between the key ART stakeholders (Product Management, System Architect, Business Owner, systems team and Release Train Engineer). Consider the following:\n- What possible anti-patterns can arise in this group?\n- How can an RTE mitigate these anti-patterns?",
    items: columns(["Possible anti-patterns", "How the RTE mitigates them"], 4),
  },
];

/**
 * The 2×2 "how much preparation" grid, read as a rating: where a team posts an item says how
 * positive or negative it is, and how far toward more or less pre-planning; the centre is neutral.
 */
function preparationGrid(): ActivityItem[] {
  const [x0, y0, w, h, gap] = [220, 100, 1080, 760, 12];
  const qw = (w - 3 * gap) / 2;
  const qh = (h - 3 * gap) / 2;
  const quad = (c: number, r: number): ActivityItem => ({ kind: "shape", x: x0 + gap + c * (qw + gap), y: y0 + gap + r * (qh + gap), width: qw, height: qh, color: "#f0f0f0", locked: true });
  const label = (text: string, x: number, y: number, width: number): ActivityItem => ({ kind: "text", text, x, y, width, height: 70, fontSize: 40, locked: true });
  return [
    { kind: "shape", x: x0, y: y0, width: w, height: h, color: "#336b87", locked: true },
    quad(0, 0),
    quad(1, 0),
    quad(0, 1),
    quad(1, 1),
    label("More pre-planning", x0 + w / 2 - 200, y0 - 85, 420),
    label("Less pre-planning", x0 + w / 2 - 200, y0 + h + 15, 420),
    label("Positive", 30, y0 + h / 2 - 35, 180),
    label("Negative", x0 + w + 20, y0 + h / 2 - 35, 200),
    { kind: "shape", text: "Neutral", x: x0 + w / 2 - 66, y: y0 + h / 2 - 28, width: 132, height: 56, color: "#ffffff", fontSize: 26, locked: true },
  ];
}

/** The ART readiness checklist as cards to mark Y, N or D. */
function readinessCards(): ActivityItem[] {
  const [w, h, gap, cols] = [380, 230, 24, 4];
  return [
    { kind: "text", text: "(Y) Yes, must be in place   ·   (N) No, doesn’t need to be in place   ·   (D) Depends on context", x: 30, y: 20, width: cols * (w + gap), height: 60, fontSize: 26, locked: true },
    ...PI_PLANNING_READINESS.map((r, i): ActivityItem => ({ kind: "card", text: `${r.text}\n${r.question}`, x: 30 + (i % cols) * (w + gap), y: 100 + Math.floor(i / cols) * (h + gap), width: w, height: h, color: "#ffffff", fontSize: 17, choices: ["Y", "N", "D"] })),
  ];
}

const lesson3: ActivitySpec[] = [
  {
    title: "How much preparation is enough?",
    kind: "Activity",
    prepare: 5,
    share: 5,
    width: 1560,
    height: 1000,
    steps: "How much preparation is enough?",
    items: preparationGrid(),
  },
  {
    title: "PI Planning readiness preparation",
    kind: "Activity",
    prepare: 5,
    share: 5,
    shareLabel: "Showcase",
    width: 4 * 404 + 40,
    height: 100 + Math.ceil(PI_PLANNING_READINESS.length / 4) * 254 + 40,
    steps: "Step 1: Determine which items on the ART readiness checklist must be in place in order to run your next PI Planning event.\nStep 2: In your workbook, mark each item with a Y, N, or D to indicate if it is necessary for running the PI Planning event:\n- (Y) Yes, must be in place\n- (N) No, doesn’t need to be in place\n- (D) Depends on context\nStep 3: Be prepared to share with the class",
    items: readinessCards(),
  },
];

// ---- the example ART planning boards (slides 3-27 to 3-29), rebuilt cell by cell ---------------

type PlanCard = [label: string, x: number, y: number];
/** Grid lines and card centres in the slides' own 1600 × 900 coordinates. */
const PLAN_COLS = [69, 272, 474, 677, 880, 1083, 1285, 1487];
const PLAN_ROWS = [190, 238, 300, 349, 398, 447, 496, 545, 593, 641, 690, 751];
const PLAN_HEAD = ["", "Iteration 1.1", "Iteration 1.2", "Iteration 1.3", "Iteration 1.4", "Iteration 1.5 (IP)", "PI 2 >>>"];
const PLAN_LANES = ["Milestones/ Events", "Unicorns", "Dolphins", "Bears", "Eagles", "Iguanas", "Antelope", "Tarantulas", "Needs UX Help", "Needs Sys Arch Help"];
const PLAN_BOARDS: { cards: PlanCard[]; links: [string, string][] }[] = [
  {
    cards: [["M1", 985, 268], ["F1", 780, 324], ["D1", 379, 373], ["D2", 580, 374], ["F2", 780, 422], ["F6", 985, 471], ["F3", 543, 521], ["F5", 986, 569], ["D3", 379, 614], ["D4", 580, 614], ["F4", 782, 615]],
    links: [["M1", "F1"], ["M1", "F2"], ["D2", "F1"], ["D2", "F2"], ["D2", "F5"], ["D2", "F4"], ["D1", "F3"], ["D3", "F3"], ["D4", "F2"]],
  },
  {
    cards: [["M1", 782, 268], ["F6", 379, 324], ["F1", 580, 324], ["F3", 782, 324], ["F5", 983, 324], ["D2", 638, 422], ["D1", 379, 470], ["F4", 843, 469], ["D7", 983, 470], ["D4", 580, 519], ["F2", 638, 568], ["D6", 983, 568], ["D3", 516, 615], ["D5", 729, 615], ["F7", 983, 615]],
    links: [["M1", "F1"], ["F1", "D1"], ["F1", "D2"], ["F3", "D4"], ["F5", "D7"], ["D7", "D6"], ["F2", "D3"], ["F4", "D5"]],
  },
  {
    cards: [["M1", 782, 268], ["E1", 1183, 268], ["D1", 377, 324], ["F2", 580, 325], ["D5", 580, 374], ["F5", 983, 374], ["F3", 782, 422], ["D3", 377, 471], ["D7", 782, 471], ["F6", 1039, 471], ["F1", 516, 521], ["D6", 580, 568], ["F7", 1039, 567], ["D4", 377, 615], ["D2", 643, 615], ["F4", 778, 615], ["D8", 778, 665], ["D9", 983, 719]],
    links: [["F2", "M1"], ["D1", "D5"], ["D5", "F3"], ["D5", "D3"], ["D5", "D7"], ["D7", "F5"], ["F5", "E1"], ["D7", "F7"], ["D7", "D6"], ["F1", "D4"], ["D4", "D6"], ["D8", "F5"], ["F5", "D9"]],
  },
];
const READING_QUESTIONS = ["What problems do you see?", "How would you, the RTE, act if you could see these on the ART planning board at the end of Day 1 in PI Planning?", "What could be a potential solution for the specific problems?"];

/** The three boards one under another, each with a column per question to its right. */
function planningBoards(): Pick<ActivitySpec, "items" | "links" | "width" | "height"> {
  const items: ActivityItem[] = [];
  const links: NonNullable<ActivitySpec["links"]> = [];
  const [x0, tableW] = [30, PLAN_COLS.at(-1)! - PLAN_COLS[0]!];
  const tableH = PLAN_ROWS.at(-1)! - PLAN_ROWS[0]!;
  const block = 70 + tableH + 70;
  PLAN_BOARDS.forEach((pb, bi) => {
    const top = 20 + bi * block;
    const y0 = top + 70;
    const at = (x: number, y: number) => ({ x: x0 + x - PLAN_COLS[0]!, y: y0 + y - PLAN_ROWS[0]! });
    items.push({ kind: "text", text: `Example ART planning board #${bi + 1}`, x: x0, y: top, width: 900, height: 60, fontSize: 34, locked: true });
    items.push({ kind: "shape", ...at(PLAN_COLS[0]!, PLAN_ROWS[0]!), width: tableW, height: tableH, color: "#7f7f7f", locked: true });
    for (let r = 0; r < PLAN_ROWS.length - 1; r++)
      for (let c = 0; c < PLAN_COLS.length - 1; c++) {
        const gap = r === 9 ? 5 : 2; // the heavy line above the help rows
        const label = r === 0 ? PLAN_HEAD[c]! : c === 0 ? PLAN_LANES[r - 1]! : "";
        items.push({ kind: "shape", ...at(PLAN_COLS[c]! + 2, PLAN_ROWS[r]! + gap), width: PLAN_COLS[c + 1]! - PLAN_COLS[c]! - 2, height: PLAN_ROWS[r + 1]! - PLAN_ROWS[r]! - gap, color: r === 0 || c === 0 ? "#efefef" : "#ffffff", locked: true, ...(label ? { text: label, fontSize: 19, align: "center" as const } : {}) });
      }
    const index = new Map<string, number>();
    for (const [label, cx, cy] of pb.cards) {
      const kind = label[0];
      index.set(label, items.length);
      items.push({ kind: "card", text: label, ...at(cx - (kind === "F" ? 26 : kind === "D" ? 26 : 42), cy - 20), width: kind === "M" || kind === "E" ? 84 : 52, height: 40, color: kind === "F" ? "#9cc8f5" : kind === "D" ? "#c00000" : "#f99d1c", fontSize: 20, align: "center", locked: true });
    }
    for (const [a, b] of pb.links) links.push({ from: index.get(a)!, to: index.get(b)!, color: "#e60000", curve: true });
    READING_QUESTIONS.forEach((q, qi) => {
      const x = x0 + tableW + 40 + qi * 320;
      items.push({ kind: "text", text: q, x, y: y0, width: 300, height: 110, fontSize: 18, locked: true });
      for (let k = 0; k < 2; k++) items.push({ kind: "card", text: "", x, y: y0 + 130 + k * 140, width: 280, height: 120 });
    });
  });
  return { items, links, width: x0 + tableW + 40 + 3 * 320 + 20, height: 20 + PLAN_BOARDS.length * block };
}

lesson3.push(
  {
    title: "Reading the ART planning board in PI Planning",
    kind: "Activity",
    prepare: 7,
    steps: "Step 1: With your group, look at the three different ART planning board examples\nStep 2: Capture the answers to the following questions for each scenario:\n- What problems do you see?\n- How would you, the RTE, act if you could see these on the ART planning board at the end of Day 1 in PI Planning?\n- What could be a potential solution for the specific problems?\nStep 3: Be prepared to share with the class",
    ...planningBoards(),
  },
  {
    title: "Business value of an architectural objective",
    kind: "Activity",
    prepare: 7,
    share: 3,
    width: 1200,
    height: 520,
    steps: "Step 1: Consider the following scenario:\nBusiness Owners have assigned a value of 2 to the PI Objective “Reduce GPS signal loss by 25%,” and they have requested that the team move the objective to uncommitted. The team believes this function provides a critical architectural enablement for the entire ART. The team is clearly disappointed and concerned that an important technical item is ranked so low. “We just don’t see much business value in it now,” said the Vice President of Product.\nStep 2: Working in your group, discuss what your steps should be for solving this problem\nStep 3: Be prepared to share with the class",
    side: [{ title: "Objectives for PI 1", image: `${PIC}/pi-objectives.png` }],
    items: Array.from({ length: 8 }, (_, k): ActivityItem => ({ kind: "card", text: "", x: 30 + (k % 4) * 290, y: 30 + Math.floor(k / 4) * 240, width: 260, height: 200 })),
  },
);

export const RTE_COURSE: { title: string; activities: ActivitySpec[] }[] = [
  { title: "Exploring the RTE Role and Responsibilities", activities: lesson1 },
  { title: "Organizing the ART", activities: lesson2 },
  { title: "Facilitating PI Planning", activities: lesson3 },
];
