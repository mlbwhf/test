// Lean Portfolio Management (LPM) and the Getting Started with LPM workshop, step by step: each
// exercise with its timing, its instructions (the course's wording), its slide and the trainer's
// note, and the Class Studio board it is worked on (the "lpm" board; the step picks the template).
// From the design handoff "Trainyard LPM" (CLASS_DATA / WS_DATA).
//
// © Scaled Agile, Inc. Used under the Scaled Agile partner agreement; not covered by this
// repository's Apache License 2.0. See NOTICE.md in this folder.

import type { ActivitySpec } from "../activities.js";

/** Every exercise is a Class Studio board; its frame only needs room for it on the canvas. */
const BOARD = { width: 1200, height: 700 };

/** One exercise as the design lists it. */
export interface LpmExercise {
  id: string;
  title: string;
  /** The board template: org, flow, theme, pc, swot, fut, mr, epic, lbc, piv, grd, disc, ctx, pb, pkb, wsjf, met, tbl, vid, pitch, scope, emi, chal, nxt. */
  kind: string;
  type: "Activity" | "Discussion" | "Overview";
  /** Prepare and share minutes; `dur` means one duration (p) instead. */
  p: number;
  s: number;
  dur?: boolean;
  page: string;
  steps: string[];
  note: string;
  qs?: string[];
  qc?: string[];
  exs?: string[];
  cols?: number;
  banner?: string;
  tbl?: { cols: string[]; rows: number | string[]; w: string; hints?: Record<string, string[]> };
  url?: string;
}

export interface LpmLesson {
  id: string;
  n: string;
  t: string;
  short: string;
  /** The lesson's colour on the menu and the quick-access sidebar. */
  c: string;
  ex: LpmExercise[];
}

export const LPM_LESSONS: LpmLesson[] = [
  { id: "l1", n: "01", t: "Introducing Lean Portfolio Management", short: "Introducing LPM", c: "#cde0f2", ex: [
    { id: "x1", title: "Discussion: Organizing the portfolio around value", kind: "org", type: "Discussion", p: 5, s: 3, page: "1-34", steps: ["Considering the current state of your portfolio, discuss the two questions.", "Place your portfolio on each scale, then capture what your group said.", "Be prepared to share with the class."], note: "Prepare 5 min, share 3 min. Ask two or three groups where they placed the dot and why.", qs: ["Is your portfolio organized in functional silos, or is it organized around value using cross-functional teams?", "Do you manage work through projects or ARTs, which are empowered for continuous value flow?"] },
    { id: "x2", title: "Activity: Understand your current portfolio process", kind: "flow", type: "Activity", p: 20, s: 10, page: "1-39", steps: ["Capture your current portfolio process: what is the portfolio intake process?", "How is new work approved and introduced to teams?", "What challenges do you have with your current process? For example, are you satisfied with how quickly you make decisions?", "Be prepared to share with the class."], note: "Prepare 20 min, share 10 min. Red flags mark the challenges. Load the example if a group is stuck." },
  ] },
  { id: "l2", n: "02", t: "Establishing Portfolio Strategy and Vision", short: "Strategy & vision", c: "#cfe8d4", ex: [
    { id: "x3", title: "Activity: Establish Strategic Themes", kind: "theme", type: "Activity", p: 10, s: 5, page: "2-12", steps: ["Working in your group, choose at least one Strategic Theme for Terrific Transport Corporation (TTC).", "Identify at least three measurable key results.", "Ensure the key results are value-based, measurable, and gradable.", "Be prepared to share with the class."], note: "Prepare 10 min, share 5 min. The checks are hints; the group decides." },
    { id: "x4", title: "Activity: Understand portfolio canvas structure", kind: "pc", type: "Activity", p: 10, s: 5, page: "2-17", steps: ["Working in your group, explore the structure of TTC’s portfolio by placing each portfolio item in the correct location.", "Item 2 is placed for you as an example.", "Be prepared to share with the class."], note: "Prepare 10 min, share 5 min. The Portfolio Canvas is adapted from the Business Model Canvas by Strategyzer. The answer key is a suggestion; discuss alternatives." },
    { id: "x5", title: "Activity: Identify significant opportunities with SWOT and TOWS", kind: "swot", type: "Activity", p: 10, s: 5, page: "2-21", steps: ["Working in your group, perform a SWOT/TOWS analysis for the TTC portfolio.", "Start by filling in the outer boxes.", "Use the questions to identify strategic options for advancing the portfolio.", "Be prepared to share with the class."], note: "Prepare 10 min, share 5 min. Star the strongest options: they carry into the future state exercise." },
    { id: "x6", title: "Activity: Explore possibilities for future states", kind: "fut", type: "Activity", p: 10, s: 5, page: "2-24", steps: ["Working in your group, develop one potential future state canvas for TTC using the insights from your TOWS analysis.", "Diverge: change the canvas blocks. Converge: name the Epics and Enablers that get you there.", "Be prepared to share with the class."], note: "Prepare 10 min, share 5 min. Current state comes from the canvas exercise." },
    { id: "x7", title: "Activity: Identify market rhythms and Milestones", kind: "mr", type: "Activity", p: 10, s: 5, page: "2-33", steps: ["Working in your group, identify market rhythms and Milestones that TTC may be able to leverage in the autonomous delivery vehicle market.", "Compare industries, draw TTC’s rhythm, add market events and mark the release windows.", "Be prepared to share with the class."], note: "Prepare 10 min, share 5 min. Rhythms repeat every year; events happen once. Industry curves are illustrative." },
  ] },
  { id: "l3", n: "03", t: "Realizing Portfolio Vision through Epics", short: "Epics", c: "#f0d9a8", ex: [
    { id: "x8", title: "Activity: Describe portfolio Epics", kind: "epic", type: "Activity", p: 10, s: 5, page: "3-16", steps: ["Working in your group, use the template to define the following Epic for TTC: expand autonomous delivery into the healthcare market segment.", "Be prepared to share with the class."], note: "Prepare 10 min, share 5 min. Same Epic hypothesis statement as the PI planning board." },
    { id: "x9", title: "Discussion: Adapting the Lean business case template", kind: "lbc", type: "Discussion", p: 10, s: 5, page: "3-17", steps: ["Working in your group, assess the Lean business case template.", "Tag each section: keep, adapt, drop, or unclear.", "Be prepared to share with the class."], note: "Prepare 10 min, share 5 min.", qs: ["What are some of the main attributes of the Lean business case?", "How would you adapt the Lean business case template to better fit your business context?", "Identify anything in the Lean business case that you don’t understand."] },
    { id: "x10", title: "Discussion: Exploring pivots", kind: "piv", type: "Discussion", p: 7, s: 3, page: "3-29", steps: ["Working as a group, use the template to discuss the four pivots described in this lesson.", "Identify a situation in which one of them would have been helpful to make a course correction.", "Be prepared to share with the class."], note: "Prepare 7 min, share 3 min." },
  ] },
  { id: "l4", n: "04", t: "Establishing Investment Funding", short: "Investment funding", c: "#d9cdf0", ex: [
    { id: "x11", title: "Activity: Establish Lean Budget Guardrails", kind: "grd", type: "Activity", p: 10, s: 5, page: "4-12", steps: ["Working in your group, use the template to establish guardrails for the TTC portfolio.", "Work through the four guardrails: horizons, capacity allocation, approving significant initiatives, and Business Owner engagement.", "Be prepared to share with the class."], note: "Prepare 10 min, share 5 min. The threshold test uses the budget items from the Participatory Budgeting handout." },
    { id: "x12", title: "Discussion: Efficient portfolio sync events", kind: "disc", type: "Discussion", p: 7, s: 3, page: "4-20", steps: ["The portfolio sync is intended to be shorter and more focused than the strategic portfolio review. Working in your group, discuss the questions.", "Be prepared to share with the class."], note: "Prepare 7 min, share 3 min.", qs: ["What artifacts are required to ensure an efficient portfolio sync?", "What might determine who should attend a given portfolio sync?"], exs: ["Portfolio Kanban", "Epic burn-up", "Lean budget actuals vs guardrails", "Value stream KPIs", "Dependency & risk log", "Roadmap"] },
    { id: "x13", title: "Discussion: TTC Business Context for Participatory Budgeting", kind: "ctx", type: "Discussion", p: 5, s: 0, dur: true, page: "4-26", steps: ["As a class, review the scenario.", "Discuss which roles or functions within the organization could be assembled for this event.", "How might the different roles approach and participate in the event? What are their priorities and how could they influence budgeting decisions?"], note: "Duration 5 min. Purpose: introduce the TTC business context and start thinking about participants’ motivations before the simulation. Roles to look for: LPM members, Product and Solution Management, Epic Owners, Enterprise and Solution Architects, Business Owners, Sales and Marketing, Finance. Ask: how would Product Management approach this event versus a Business Owner?", qs: ["How might the different roles approach and participate in the event?", "What are their priorities and how could they influence budgeting decisions?"] },
    { id: "x14", title: "Activity: Experience Participatory Budgeting with SAFe CoFund", kind: "pb", type: "Activity", p: 30, s: 10, page: "4-28", steps: ["Follow the link from your trainer to SAFe CoFund and join your group’s table (or use the table below).", "With your group, review the budget items.", "Acting as TTC stakeholders, collaborate on how to allocate the budget. Fund “run-the-business” investments before “grow-the-business” investments. Fund Solutions before Epics.", "Be prepared to share with the class."], note: "Prepare 30 min, share 10 min. SAFe CoFund (cofund.scaledagile.com) is the recommended tool: create a new demo event per class and name the tables after your groups. This in-app table is the spreadsheet alternative from the handout. Debrief: what got funded, what didn’t, what caused debate; balance across value streams; items in competition (build vs buy); other factors not available here (M&A, government spend). PB is an input to the LPM decision, not the decision." },
  ] },
  { id: "l5", n: "05", t: "Managing Portfolio Flow", short: "Portfolio flow", c: "#ffd37a", ex: [
    { id: "x15", title: "Discussion: Assessing Portfolio Kanban design", kind: "pkb", type: "Discussion", p: 10, s: 5, page: "5-21", steps: ["Working in your group, use the template to discuss how you would apply and evolve a Portfolio Kanban.", "Move the TTC Epics through the states, tune WIP limits and policies, and note what you would change.", "Be prepared to share with the class."], note: "Prepare 10 min, share 5 min. Ask which policy each group changed first and why." },
    { id: "x16", title: "Activity: Sequence portfolio Epics", kind: "wsjf", type: "Activity", p: 7, s: 3, page: "5-29", steps: ["Working in your group, use the template to prioritize three TTC Epics.", "Do one column at a time. Start by picking the smallest item in each column and giving it a 1; size the rest relative to it using 1, 2, 3, 5, 8. Each column must contain at least one 1.", "Epic cost is normalized: the lowest-cost Epic is 1.0, the others are divided by it.", "Be prepared to share with the class."], note: "Prepare 7 min, share 3 min. Same WSJF template as Leading SAFe; parameters changed for portfolio Epics. WSJF = CoD ÷ normalized Epic cost; implement the highest first." },
  ] },
  { id: "l6", n: "06", t: "Applying Agile Portfolio Operations", short: "Agile portfolio ops", c: "#b9e3dc", ex: [
    { id: "x17", title: "Discussion: Releasing value across the portfolio", kind: "disc", type: "Discussion", p: 5, s: 5, page: "6-15", steps: ["Discuss as a group using the template.", "Be prepared to share with the class."], note: "Prepare 5 min, share 5 min.", qs: ["What are the portfolio considerations for releasing value?", "Do you need additional roles for coordination?", "What parts of the portfolio would be on the same cadence?", "How do you support independent but aligned releases?"], qc: ["#3d6fb6", "#3e5470", "#ef6a54", "#9bb53a"], cols: 2 },
    { id: "x18", title: "Discussion: The role of the LACE and VMO", kind: "disc", type: "Discussion", p: 5, s: 3, page: "6-21", steps: ["Working in your group, discuss how the LACE and the VMO help your Enterprise achieve its business goals.", "Be prepared to share with the class."], note: "Prepare 5 min, share 3 min.", qs: ["LACE", "VMO"], qc: ["#1f6b3a", "#a84a44"], cols: 2, banner: "How do the LACE and the VMO help your enterprise achieve its business goals?" },
  ] },
  { id: "l7", n: "07", t: "Applying Lean Governance", short: "Lean governance", c: "#f6b9ae", ex: [
    { id: "x19", title: "Discussion: Measuring LPM performance", kind: "met", type: "Discussion", p: 7, s: 3, page: "L7", steps: ["How do you currently assess the progress of your portfolio?", "What is one metric you might remove? How might removing it affect operations?", "What is one metric you could add? How might adding it improve operations?", "Be prepared to share with the class."], note: "Timing not on the template slide: check against the course slide. Tag each measure in the table: keep, remove, add, or not measured today.", qs: ["How do you currently assess the progress of your portfolio?", "What is one Metric you might remove? How might removing it affect operations?", "What is one Metric you could add? How might adding it improve operations?"], qc: ["#2a8fa8", "#c8372d", "#1f6b3a"] },
    { id: "x20", title: "Discussion: Getting ready for the “Getting Started with Lean Portfolio Management” workshop", kind: "tbl", type: "Discussion", p: 5, s: 5, page: "L7", steps: ["As a group, plan the one-day Getting Started with LPM workshop.", "Decide when to conduct it, who should attend, and which research activities come first.", "Be prepared to share with the class."], note: "Timing not on the template slide: check against the course slide.", tbl: {"cols": ["When to conduct?", "Who should attend?", "Research activities"], "rows": 3, "w": "1fr 1.2fr 2fr"} },
  ] },
  { id: "l8", n: "08", t: "Practicing SAFe", short: "Practicing SAFe", c: "#e6d3f0", ex: [
    { id: "x21", title: "Video: Welcome to SAFe Studio", kind: "vid", type: "Overview", p: 5, s: 0, dur: true, page: "8", steps: ["Watch the Welcome to SAFe Studio video together.", "Note where to find the LPM resources, the certification exam and the community.", "Capture questions on the group wall."], note: "Check the video length and update the duration. Learners need SAFe Studio access for the LPM resources and the Getting Started workshop.", url: "https://bit.ly/Video-WelcomeSAFeStudio" },
  ] },
];

export const LPM_WORKSHOP_SECTIONS: LpmLesson[] = [
  { id: "s1", n: "01", t: "Introduction to implementing LPM", short: "Implementing LPM", c: "#cde0f2", ex: [

  ] },
  { id: "s2", n: "02", t: "Prepare for the LPM kickoff event", short: "Kickoff prep", c: "#cfe8d4", ex: [
    { id: "w1", title: "Activity: Advocating the LPM implementation", kind: "pitch", type: "Activity", p: 20, s: 10, page: "21", steps: ["Consider your target audience and an example from your current context that demonstrates the case for change.", "Write a three-minute elevator pitch to gain buy-in for LPM: what are we solving? What will we lose if we don’t proceed? What will we gain if we proceed? What is the call to action?", "Be prepared to share with the class."], note: "Prepare 20 min, share 10 min. Purpose: craft and test a three-minute pitch to gain buy-in for LPM in participants’ own contexts. The meter estimates speaking time at 130 words per minute." },
    { id: "w2", title: "Activity: Define the portfolio scope", kind: "scope", type: "Activity", p: 15, s: 15, page: "24", steps: ["In your group, ideate possible scopes of the portfolio. Evaluate each idea: is it a portfolio, or something narrower (major initiative or Epic, Strategic Theme, one of several Value Streams, or ART)?", "For the selected portfolio scope, discuss: who are the Customers you serve? What Solutions do you provide them?", "Be prepared to share with the class."], note: "Prepare 15 min, share 15 min. The goal is the reasoning and language for the portfolio definition." },
    { id: "w3", title: "Activity: Identify LPM participants", kind: "tbl", type: "Activity", p: 15, s: 0, dur: true, page: "34", steps: ["Use the “Establish the LPM team” template.", "Review each LPM participant and discuss: who should be involved? How would we engage them? What risks do we anticipate and how would we mitigate them?", "Identify potential participants and actions to include in your implementation Roadmap."], note: "Duration 15 min.", tbl: {"cols": ["LPM responsibility", "Participants", "Actions"], "rows": ["Makes investment decisions", "Influences investment decisions", "Facilitates portfolio operations", "Supports portfolio operations", "Implements LPM", "Fosters Epic", "Executes within the value streams", "Key stakeholders"], "w": "1fr 1.2fr 1.4fr"} },
    { id: "w4", title: "Activity: Prepare for empathy interviews", kind: "emi", type: "Activity", p: 10, s: 5, page: "37", steps: ["Identify one to three empathy interviews to conduct: who to interview, the interview questions, and the facilitators (interviewer, note taker, observer).", "Be prepared to share with the class."], note: "Check the prepare/share timing against the slide. Tip: start with the LPM sponsor and ask who else to interview; typically 5 to 20 interviewees.", tbl: {"cols": ["Interview facilitators", "Invitees", "Revisions to interview questions"], "rows": 3, "w": "1fr 1fr 1.3fr"} },
    { id: "w5", title: "Activity: Design LPM events", kind: "tbl", type: "Activity", p: 20, s: 0, dur: true, page: "41", steps: ["In the LPM Events template, design the three LPM events: cadence, participants, duration, key agenda items.", "Determine a realistic target start date for each type of event.", "Decide which current meetings will be replaced or stopped when introducing the new LPM events."], note: "Duration 20 min. Ask what cadence they use today.", tbl: {"cols": ["Event", "Cadence", "Participants", "Duration", "Key agenda items", "Target start date", "Stop or modify"], "rows": ["Strategic Portfolio Review", "Portfolio Sync", "Participatory Budgeting"], "hints": {"Strategic Portfolio Review": ["Quarterly", "Monthly"], "Portfolio Sync": ["Monthly", "Every iteration"], "Participatory Budgeting": ["Twice per year", "Quarterly"]}, "w": "1.1fr 1fr 1fr .8fr 1.4fr .9fr 1.1fr"} },
    { id: "w6", title: "Activity: Sponsoring the LPM CoP", kind: "tbl", type: "Activity", p: 10, s: 0, dur: true, page: "45", steps: ["Determine LPM CoP participation: identify three people to create and nurture the CoP, and how to ensure engagement from each Value Stream.", "Discuss how the LPM CoP will collaborate with the LPM team and with the working group implementing LPM.", "List these notes in your workbook."], note: "Duration 10 min. Someone has to own the CoP: it takes effort and nurturing.", tbl: {"cols": ["CoP organizers", "Fostering engagement", "Collaboration strategy"], "rows": 3, "w": "1fr 1fr 1fr"} },
  ] },
  { id: "s3", n: "03", t: "Next steps", short: "Next steps", c: "#ffd37a", ex: [
    { id: "w7", title: "Activity: Identify strategies to address common challenges", kind: "chal", type: "Activity", p: 15, s: 10, page: "57", steps: ["Break out into groups and select a scenario.", "Read your scenario. Brainstorm three to five strategies to respond to the challenge.", "Be prepared to share with the class. The facilitator debriefs."], note: "Prepare 15 min, share 10 min. Hint: these scenarios require change leadership strategies. Turn on the debrief when groups have shared." },
    { id: "w8", title: "Activity: Create next steps to prepare for LPM kickoff", kind: "nxt", type: "Activity", p: 10, s: 0, dur: true, page: "70", steps: ["How will you prepare leaders and key influencers?", "How will you prepare facilitators, speakers, and participants?", "Whom will you partner with on preparation of inputs for the event? What pre-work is required for participants?", "Move each action into the week you will do it."], note: "Duration 10 min. Last working activity: immediate next steps before the kickoff (two to four weeks after the workshop)." },
  ] },
];


/** The exercise as a Class Studio activity: the board's setup carries everything the template reads. */
function activity(e: LpmExercise, shared: string): ActivitySpec {
  const { id, kind, type, p, s, dur, page, steps, note, title, ...rest } = e;
  const side = [{ title: "Slide", text: /^\d/.test(page) && page.includes("-") ? `Slide ${page}` : /^\d+$/.test(page) ? `Page ${page}` : page, instructorOnly: true }];
  if (note) side.push({ title: "Trainer note", text: note, instructorOnly: true });
  return {
    title: title.replace(/^(Discussion|Activity|Video): /, ""),
    kind: type,
    ...(dur ? { prepare: p, shareLabel: "Duration" } : { ...(p ? { prepare: p } : {}), ...(s ? { share: s } : {}) }),
    steps: steps.join("\n"),
    side,
    board: "lpm",
    // Every step of the class works on one shared state per team (the design's per-group store);
    // participatory budgeting is one event for the whole class, each team a table.
    config: { step: kind, id, page, ...(dur ? { dur: true } : {}), ...rest, shared, ...(kind === "pb" ? { classWide: true } : {}) },
    ...BOARD,
  };
}

export const LPM_COURSE: { title: string; activities: ActivitySpec[] }[] = LPM_LESSONS.map((l) => ({ title: l.t, activities: l.ex.map((e) => activity(e, "lpm")) }));
export const LPM_WORKSHOP_COURSE: { title: string; activities: ActivitySpec[] }[] = LPM_WORKSHOP_SECTIONS.map((l) => ({ title: l.t, activities: l.ex.map((e) => activity(e, "lpm-ws")) }));
