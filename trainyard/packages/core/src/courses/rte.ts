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
      { id: "communicates", label: "Communicates with Business Owners to understand priorities and long-term vision, and communicates progress toward objectives", color: "#c2412d" },
      { id: "collaborates", label: "Collaborates with the Scrum Masters and/or Team Coaches on the ART to measure progress and help remove impediments", color: "#2f6fbd" },
      { id: "facilitates", label: "Facilitates the Inspect & Adapt (I&A) event to coach the ART to identify and solve problems", color: "#2e8b57" },
      { id: "gathers", label: "Gathers the key outputs of events, like PI objectives from PI Planning", color: "#d98a1c" },
    ],
    side: [{ title: "Example connections", image: `${PIC}/rte-connections-example.png`, instructorOnly: true }],
    items: [
      { kind: "image", src: `${PIC}/big-picture.png`, x: 30, y: 60, width: BP_W, height: BP_H },
      { kind: "pin", text: "RTE", ...((p) => ({ x: p.x - 60, y: p.y - 22 }))(onBp(668, 318)), width: 120, height: 44, color: "#7b3f8c" },
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
    steps: "Step 1: In your group, explore how the widespread adoption of AI could augment Release Train Engineers' responsibilities and support teams in delivering value. For example, consider:\n- PI Planning facilitation: How might AI-assisted planning tools and dependency mapping change how you prepare for and facilitate PI Planning events, and how you budget your time?\n- Impediment identification: How might AI analyzing team metrics, flow data, and retrospective feedback change how you identify and remove impediments across the ART?\n- Coach and servant leader priorities: How might AI handling coordination and reporting tasks change how you support team-level and ART-level continuous improvement?\nStep 2: Be prepared to share with the class.",
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

/** The 2×2 "how much preparation" grid: more or less pre-planning, positive or negative. */
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
  ];
}

/** The ART readiness checklist as cards to mark Y, N or D. */
function readinessCards(): ActivityItem[] {
  const [w, h, gap, cols] = [380, 230, 24, 4];
  return [
    { kind: "text", text: "(Y) Yes, must be in place   ·   (N) No, doesn't need to be in place   ·   (D) Depends on context", x: 30, y: 20, width: cols * (w + gap), height: 60, fontSize: 26, locked: true },
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
    steps: "Step 1: With your group, consider the effects of doing more or less pre-planning before PI Planning.\nStep 2: Place each point in the quadrant where it fits: more or less pre-planning, with a positive or a negative effect. Put a point on a border when it sits between two, and say why.\nStep 3: Be prepared to share with the class.\n- Double-click a spot on the grid to add a sticky there.",
    items: preparationGrid(),
  },
  {
    title: "PI Planning readiness preparation",
    kind: "Activity",
    prepare: 5,
    share: 5,
    width: 4 * 404 + 40,
    height: 100 + Math.ceil(PI_PLANNING_READINESS.length / 4) * 254 + 40,
    steps: "Step 1: Determine which items on the ART readiness checklist must be in place in order to run your next PI Planning event.\nStep 2: In your workbook, mark each item with a Y, N, or D to indicate if it is necessary for running the PI Planning event:\n- (Y) Yes, must be in place\n- (N) No, doesn't need to be in place\n- (D) Depends on context\nStep 3: Be prepared to share with the class",
    items: readinessCards(),
  },
];

export const RTE_COURSE: { title: string; activities: ActivitySpec[] }[] = [
  { title: "Exploring the RTE Role and Responsibilities", activities: lesson1 },
  { title: "Organizing the ART", activities: lesson2 },
  { title: "Facilitating PI Planning", activities: lesson3 },
];
