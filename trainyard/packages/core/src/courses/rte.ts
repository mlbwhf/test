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
    title: "Conflicting views of value",
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

// ---- lesson 3 continued: risks, confidence vote, AI in PI Planning ---------------------------

/** A purpose-built board: the exercise's frame only needs to be big enough to hold it on the canvas. */
const BOARD = { width: 1200, height: 600 };

const ART_PI_RISKS = [
  "Team member X is a bottleneck. They are the only one who can handle critical parts of the implementation for an important Feature that is scheduled for delivery in the Iteration.",
  "No system team is available yet. The integration infrastructure is in poor condition and could put the integration and/or the System Demo at risk.",
  "Two teams have a shared Product Owner. This might have a negative impact on the team’s Iteration Planning and demos.",
  "The QA team is pointing out that application performance might be at risk during Iteration 3, as there will be an influx of new users. They are unsure how this might impact the ART.",
  "In Iteration 3, an important supplier might be delayed with their crucial delivery. They have been late before, and this time it might impact several teams.",
  "There is a holiday mid-PI, and many people will be on vacation.",
];

const ROAM = [
  ["R", "Resolved", "Addressed; the risk is no longer a concern"],
  ["O", "Owned", "Someone has taken responsibility"],
  ["A", "Accepted", "Nothing more can be done, and if the risk occurs, the release may be compromised"],
  ["M", "Mitigated", "The team has a plan to adjust as necessary"],
];

/** A discussion's questions, each with its own lane of notes. */
const lanes = (titles: string[], more: Record<string, unknown> = {}) => ({ board: "lanes", config: { lanes: titles.map((title) => ({ title })), ...more }, ...BOARD });

lesson3.push(
  {
    title: "ROAM ART PI risks",
    kind: "Activity",
    prepare: 10,
    steps: "Step 1: As a class, read through the six risks on the next slide.\nStep 2: Develop a clear plan for how you, the RTE, would facilitate ROAMing the risks.\nStep 3: Document the approach for each risk. Indicate what ROAM you would suggest and why. Focus on how you would facilitate finding the solution during PI Planning, not what the solution would be",
    side: [{ title: "Addressing ART PI risks", text: `After all plans have been presented, the remaining ART PI risks and impediments are discussed and categorized.\n\nROAM stands for:\n${ROAM.map(([, n, d]) => `- ${n} - ${d}`).join("\n")}` }],
    board: "roam",
    config: { risks: ART_PI_RISKS, roam: ROAM },
    ...BOARD,
  },
  {
    title: "Confidence not high? Plan rework.",
    kind: "Discussion",
    prepare: 7,
    steps: "As a class, discuss the role of the RTE in facilitating the confidence vote. Consider the following:\n- How can the RTE ensure that attendees feel safe to voice their concerns?\n- How would you facilitate reworking the plan if there is little to no confidence (teams vote a 1 or 2)?\n- What agreements would you put in place to rework the plan?",
    ...lanes(["How can the RTE ensure that attendees feel safe to voice their concerns?", "How would you facilitate reworking the plan if there is little to no confidence (teams vote a 1 or 2)?", "What agreements would you put in place to rework the plan?"], { intro: "As a class, discuss the role of the RTE in facilitating the confidence vote.", layout: "grid", cols: 3 }),
  },
  {
    title: "AI-empowered PI Planning",
    kind: "Discussion",
    prepare: 5,
    steps: "As a class, brainstorm ways AI can reduce overhead or friction in PI Planning. Consider:\n- Where does planning feel the hardest or most time-consuming?\n- How could AI reduce effort, improve clarity, or surface risks earlier?\n- What should always remain a human responsibility?\n- What’s one AI-enabled improvement you’d consider trying next PI?\nExamples:\n- Summarizing planning inputs and outputs\n- Surfacing risks, dependencies, and timing conflicts\n- Capturing decisions and action items in real time",
    ...lanes(["Where does planning feel the hardest or most time-consuming?", "How could AI reduce effort, improve clarity, or surface risks earlier?", "What should always remain a human responsibility?", "What’s one AI-enabled improvement you’d consider trying next PI?"], { intro: "As a class, brainstorm ways AI can reduce overhead or friction in PI Planning.", examples: ["Summarizing planning inputs and outputs", "Surfacing risks, dependencies, and timing conflicts", "Capturing decisions and action items in real time"], layout: "grid" }),
  },
);

// ---- lesson 4 -------------------------------------------------------------------------------

const lesson4: ActivitySpec[] = [
  {
    title: "The RTE and ART events",
    kind: "Activity",
    prepare: 10,
    share: 12,
    steps: "Step 1: In your group, prepare a three-minute presentation about an ART event facilitated by the RTE. Use the event descriptions as a guide and draw from your own experiences. Be sure to include:\n- A clear statement about the purpose of the event and why it’s important for the RTE role\n- A list of facilitators and attendees, plus a suggested agenda for the event with timing and cadence\n- The key inputs and outputs of the event\n- Possible event anti-patterns, like a discussion of what would happen if this event was canceled\n- Success criteria for the RTE\n- General tips\nStep 2: Be prepared to share with the class.",
    ...lanes(["Purpose", "Attendees and agenda", "Inputs/outputs", "Anti-patterns", "Success criteria", "Tips"], { layout: "rows", heading: { label: "ART Event", placeholder: "[enter here]" } }),
  },
  {
    title: "Build your own ART kanban board",
    kind: "Activity",
    prepare: 15,
    share: 10,
    steps: "Step 1: In your group, select one person’s context.\nStep 2: Together, build an ART kanban board using the tools described in this lesson topic. Be sure the group:\n- Understands the actual workflow of features.\n- Decides how to map it to the board (columns, policies, and so on).\n- Determines initial WIP limits.\nStep 3: Be prepared to share with the class.",
    side: [{ title: "Example ART kanban board", image: `${PIC}/kanban-example.webp` }],
    board: "kanban",
    config: { columns: ["Funnel", "Analyzing", "Ready", "Implementing", "Validating on Staging", "Deployment to Production", "Releasing", "Done"] },
    ...BOARD,
  },
  {
    title: "Accelerating quality",
    kind: "Discussion",
    prepare: 12,
    steps: "AI tools offer powerful ways to accelerate quality workflows, but they introduce new risks to the continuous delivery pipeline.\nAs a class, discuss the following:\n- How can an RTE coach teams to use AI safely to accelerate basic built-in quality practices (e.g., test auto-generation, code reviews)?\n- What risks emerge when teams over-rely on AI, and how do we apply the definition of done as a strict guardrail?\n- Which ART roles and events are most critical for aligning and maintaining these AI quality boundaries?",
    ...lanes(["How can an RTE coach teams to use AI safely to accelerate basic built-in quality practices (e.g., test auto-generation, code reviews)?", "What risks emerge when teams over-rely on AI, and how do we apply the definition of done as a strict guardrail?", "Which ART roles and events are most critical for aligning and maintaining these AI quality boundaries?"], { intro: "AI tools offer powerful ways to accelerate quality workflows, but they introduce new risks to the continuous delivery pipeline.", examples: ["Basic Agile Quality Practices"], layout: "grid", cols: 3 }),
  },
  {
    title: "Create a two-minute pitch",
    kind: "Activity",
    prepare: 10,
    share: 10,
    steps: "Step 1: In your group, create a two-minute pitch to Business Owners and Product Management about the need to build DevOps capabilities. Be sure to include the following:\n- A clear statement about what is likely to happen if the practice is not implemented.\n- A statement about how the RTE can support this practice.\n- Metrics to support your pitch.\nStep 2: Be prepared to share with the class.",
    ...lanes(["What will happen if DevOps capabilities are not built?", "How can the RTE support the building of DevOps capabilities?", "Two-minute pitch outline", "What metrics will you use to support your pitch?", "Additional notes"], { layout: "pitch" }),
  },
];

// ---- lesson 5 -------------------------------------------------------------------------------

const FLOW_METRICS = ["Flow Distribution", "Flow Velocity", "Flow Time", "Flow Load", "Flow Efficiency", "Flow Predictability"];
const FLOW_ACCELERATORS = ["Visualize and limit WIP", "Address bottlenecks", "Minimize handoffs and dependencies", "Get faster feedback", "Work in smaller batches", "Reduce queue lengths", "Optimize time ‘in the zone’", "Remediate legacy policies and practices"];

const lesson5: ActivitySpec[] = [
  {
    title: "Measuring the flow of value",
    kind: "Activity",
    prepare: 5,
    share: 3,
    steps: "Step 1: Individually, select which flow metrics would provide the most value for your ART. For each selected metric, capture:\n- Purpose: What question does this metric help you answer?\n- Data source: Where could you collect this data (for example, from a tool, report, or board)?\n- Action: How would you use the results to improve flow?\nStep 2: Reflect on how your ART kanban supports visualization of these metrics. What adjustments might help you see or track flow more effectively?\nStep 3: Be prepared to share with the class.",
    board: "metrics",
    config: { metrics: FLOW_METRICS, fields: [["Purpose", "What question does this metric help you answer?"], ["Data source", "Where could you collect this data (for example, from a tool, report, or board)?"], ["Action", "How would you use the results to improve flow?"]], reflect: "Reflect on how your ART kanban supports visualization of these metrics. What adjustments might help you see or track flow more effectively?" },
    ...BOARD,
  },
  {
    title: "Data versus context",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps: "Step 1: Consider the following scenario:\n- Your organization's AI widget analyzed your PI 3 flow metric data and generated a summary report and recommended insights. However, the widget is missing a critical piece of operational context: Midway through PI 3, three teams were redirected for two iterations to address an emergency security vulnerability. Planned feature work stopped, and unplanned remediation work took its place. The risk was successfully resolved, but the metrics reflect an ART operating under highly abnormal conditions.\nStep 2: Working in your groups, review the ART flow metrics and AI-generated insights in the activity handout. Select 1–2 of the insights to analyze and decide whether the recommendations are safe to implement directly or address the wrong problem.\nStep 3: Be prepared to share with the class.",
    ...lanes(["Insights we selected", "Safe to implement directly", "Address the wrong problem"], { intro: "Your organization's AI widget analyzed your PI 3 flow metric data and generated a summary report and recommended insights. However, the widget is missing a critical piece of operational context: Midway through PI 3, three teams were redirected for two iterations to address an emergency security vulnerability. Planned feature work stopped, and unplanned remediation work took its place. The risk was successfully resolved, but the metrics reflect an ART operating under highly abnormal conditions.", introStyle: "scenario", layout: "grid", cols: 3 }),
  },
  {
    title: "Which flow accelerators address what kind of problems?",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps: "Step 1: In your group, review the example problems on the next slide. Select the problems that most closely match one you experience in your team or ART.\nStep 2: Select which flow accelerators would help address that problem.\nStep 3: Be prepared to share with the class.",
    board: "accel",
    config: { accelerators: FLOW_ACCELERATORS },
    ...BOARD,
  },
];

// ---- lesson 6 -------------------------------------------------------------------------------

/** The five problem-solving workshop steps share one board, so each step builds on the last. */
const workshop = (step: string) => ({ board: "rca", config: { step, shared: "problem-solving-workshop" }, ...BOARD });

const lesson6: ActivitySpec[] = [
  {
    title: "Balancing the IP iteration",
    kind: "Discussion",
    prepare: 7,
    steps: "Step 1: Reflect on how your ART currently uses the IP iteration\nStep 2: Discuss as a class:\n- How do you balance innovation, planning, and readiness activities?\n- What trade-offs or tensions have you experienced?\n- What can the RTE do to protect time for innovation while ensuring readiness for PI Planning?",
    ...lanes(["How do you balance innovation, planning, and readiness activities?", "What trade-offs or tensions have you experienced?", "What can the RTE do to protect time for innovation while ensuring readiness for PI Planning?"], { layout: "grid", cols: 3 }),
  },
  {
    title: "Preparing for the PI System Demo",
    kind: "Discussion",
    prepare: 7,
    steps: "As a class, discuss the following questions:\n- What preparations does the RTE need to do before the I&A for the PI System Demo?\n- What preparations does the RTE need to do before the I&A for the quantitative and qualitative measurements?\n- Who can assist the RTE with these preparations?\n- What can the RTE do to ensure key ART stakeholders attend the I&A?",
    ...lanes(["What preparations does the RTE need to do before the I&A for the PI System Demo?", "What preparations does the RTE need to do before the I&A for the quantitative and qualitative measurements?", "Who can assist the RTE with these preparations?", "What can the RTE do to ensure key ART stakeholders attend the I&A?"], { layout: "grid" }),
  },
  {
    title: "Agree on the problem",
    kind: "Activity",
    prepare: 5,
    steps: "Step 1: Working in your groups, write a problem statement\nStep 2: Capture the statement in the Original problem statement section",
    ...workshop("agree"),
  },
  {
    title: "Root cause analysis",
    kind: "Activity",
    prepare: 25,
    steps: "Step 1: Brainstorm potential causes of the problem and write down the ‘root-cause analysis’ on the template problem-solving board\nStep 2: For each cause identified, use the ‘Five Whys’ technique to get to a potential root cause",
    side: [{ title: "Example", image: `${PIC}/rca-example.webp` }],
    ...workshop("rca"),
  },
  {
    title: "Restate the new problem",
    kind: "Activity",
    prepare: 10,
    steps: "Step 1: Dot vote to identify the biggest root cause on your chart.\nStep 2: Use Pareto analysis to identify the biggest root cause. Write down the ‘biggest root cause’ on the problem-solving board.\nStep 3: Restate the problem to address the identified root cause and the economic impact of the problem under the 'restate problem' heading on the problem-solving board.",
    side: [{ title: "Example", text: "We did not have the ability to measure or test the full electrical load on vehicles in real operating conditions.\n\nImpact:\nWe had to upgrade the deployed power distribution system beyond what was specified. Major cost and schedule overrun." }],
    ...workshop("restate"),
  },
  {
    title: "Brainstorm solutions",
    kind: "Activity",
    prepare: 8,
    steps: "Step 1: Individually brainstorm and write ideas on sticky notes and put them up on the board\nStep 2: After all ideas are captured, discuss them as a team\nStep 3: Organize ideas into affinity groups\nStep 4: Dot vote to reveal the top contenders to add to ‘identify improvement backlog items’ on the problem-solving board",
    ...workshop("brainstorm"),
  },
  {
    title: "Problem-solving workshop readout",
    kind: "Discussion",
    prepare: 10,
    steps: "Step 1: Select a person from your team to do a readout\nStep 2: Start the readout by stating the original problem and conclude with the proposed improvement backlog items",
    ...workshop("readout"),
  },
  {
    title: "Business Agility Self Assessment",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps: "Step 1: Individually, fill in the Business Agility assessment in your workbook\nStep 2: Share some opportunities for the improvement you identified",
    board: "radar",
    config: {
      title: "Business Agility Assessment",
      dims: [
        ["Team and Technical Agility (TTA)", 3.13],
        ["Product Development Flow (PDF)", 2.88],
        ["Large Solution Integration and Development (LSID)", 3.33],
        ["Lean Portfolio Management (LPM)", 3.33],
        ["Leadership and Culture (L&C)", 2.83],
      ],
      max: 5,
      lane: "Opportunities for improvement",
    },
    ...BOARD,
  },
  {
    title: "Development Value Stream Mapping – current state",
    kind: "Activity",
    prepare: 15,
    share: 5,
    steps: "Step 1: Working in your groups, map a current development process from one person’s real context\nStep 2: Identify the delays between the steps\nStep 3: Be prepared to share your results with the class",
    side: [{ title: "Value Stream Mapping: Measure the steps", image: `${PIC}/vsm-measure.webp` }],
    board: "vsm",
    config: {},
    ...BOARD,
  },
  {
    title: "Development Value Stream Mapping – future state",
    kind: "Activity",
    prepare: 15,
    share: 5,
    steps: "Step 1: Working in your groups, use the same work context as in the previous activity.\nStep 2: Map the desired future state of the development process. Use the principles, practices, and tools found in SAFe.\nStep 3: Be prepared to share how you identified bottlenecks and what you would do to remove them with the class.",
    side: [{ title: "Value Stream Mapping: Think about the future state", image: `${PIC}/vsm-future.webp` }],
    board: "vsm",
    config: { groups: ["Exploration", "Integration", "Deployment"] },
    ...BOARD,
  },
  {
    title: "Draft your ART’s AI boundaries",
    kind: "Discussion",
    prepare: 7,
    share: 3,
    steps: "Emerging AI capabilities can augment how ARTs plan, build, test, and learn, but must be managed carefully. ARTs must develop and socialize boundaries for these tools to ensure responsible usage.\nStep 1: In your group, discuss scenarios where AI could be used with human review, and where it should not be used\nStep 2: Be prepared to share with the class",
    board: "lanes",
    config: {
      intro: "Emerging AI capabilities can augment how ARTs plan, build, test, and learn, but must be managed carefully. ARTs must develop and socialize boundaries for these tools to ensure responsible usage.",
      layout: "rows",
      lanes: [
        { title: "AI is helpful here but needs human review", examples: ["Synthesizing team health survey data before I&A"] },
        { title: "AI should not be used here", examples: ["Determining team capacity or deciding who owns a dependency"] },
      ],
    },
    ...BOARD,
  },
  {
    title: "Your next steps",
    kind: "Activity",
    prepare: 10,
    share: 5,
    steps: "Throughout this course, you’ve learned about various ways to integrate AI into your daily work as an RTE. What do you want to implement when you return to your role?\nStep 1: Identify one improvement you want to make in how your ART delivers value\nStep 2: Decide which SAFe value(s), principle(s), or practice(s) will guide your approach\nStep 3: Determine the first step you will take in the next 30 days to start making this improvement\nStep 4: Be prepared to share with the class",
    ...lanes(["Identify one improvement you want to make in how your ART delivers value", "Decide which SAFe value(s), principle(s), or practice(s) will guide your approach", "Determine the first step you will take in the next 30 days to start making this improvement"], { intro: "Throughout this course, you’ve learned about various ways to integrate AI into your daily work as an RTE. What do you want to implement when you return to your role?", layout: "rows" }),
  },
];

// ---- lesson 7 -------------------------------------------------------------------------------

const AIA_W = 1100;
const AIA_H = Math.round((AIA_W * 675) / 1078);

const lesson7: ActivitySpec[] = [
  {
    title: "The ART can’t run without trust",
    kind: "Activity",
    prepare: 10,
    share: 5,
    width: AIA_W + 60 + 480,
    height: AIA_H + 120,
    steps: "Step 1: In your group, discuss which SAFe events and activities can help establish trust among the members of the ART and ART stakeholders.\nStep 2: Identify these activities on the Big Picture and note why they would help establish trust.\nStep 3: Choose one of the SAFe activities you identified. Discuss and capture how the RTE can act to further increase the amount of trust built in that activity.\nStep 4: Be prepared to share your ideas with the class.",
    items: [
      { kind: "image", src: `${PIC}/ai-empowered-agility.webp`, x: 30, y: 60, width: AIA_W, height: AIA_H },
      ...Array.from({ length: 6 }, (_, k): ActivityItem => ({ kind: "card", text: "", x: AIA_W + 70 + (k % 2) * 230, y: 60 + Math.floor(k / 2) * 200, width: 210, height: 180, color: "#cfe6e8" })),
    ],
  },
  {
    title: "Sustaining the victory",
    kind: "Discussion",
    steps: "Sustaining the victory",
    ...lanes(["How are you connecting team victories to the vision?", "How are you creating connections between yourself and the teams?", "Discuss an upcoming PI event and how the RTE could sustain the victory."], { layout: "grid", cols: 3 }),
  },
];

// Lessons 4–7 are named after what their exercises cover until the course's own lesson titles are in.
export const RTE_COURSE: { title: string; activities: ActivitySpec[] }[] = [
  { title: "Exploring the RTE Role and Responsibilities", activities: lesson1 },
  { title: "Organizing the ART", activities: lesson2 },
  { title: "Facilitating PI Planning", activities: lesson3 },
  { title: "Facilitating ART Events, Flow and DevOps", activities: lesson4 },
  { title: "Measuring and Improving Flow", activities: lesson5 },
  { title: "Improving the ART", activities: lesson6 },
  { title: "Sustaining the ART", activities: lesson7 },
];
