// How to use Trainyard, page by page. One source for the help panel inside the app (the ?
// button shows the entry for the page you are on), the help centre (/help) and the public
// support page, so the explanations stay in one place and change with the product.

export interface HelpTopic {
  /** The route it explains; the most specific match wins (/board/coach-sync over /board). */
  path: string;
  space: "Getting started" | "Rooms" | "OKRs" | "Classes" | "Templates and boards" | "Plan" | "Setup";
  title: string;
  /** What the page is for, in a sentence or two. */
  what: string;
  steps: string[];
  tips?: string[];
}

export const HELP: HelpTopic[] = [
  {
    path: "/welcome",
    space: "Getting started",
    title: "Your first ten minutes",
    what: "Trainyard has four spaces in the top bar: OKRs for outcomes and funding, Classes for teaching, Templates for boards in any method, and Plan for the ART from strategy to PI planning. Setup lives in the account menu.",
    steps: [
      "Sign in with your email and password (or the API key you got at sign-up).",
      "Teaching? Open Classes → Class boards and start a class; hand participants the board link.",
      "Running a train? Open Plan → Readiness, WSJF & risks, then the PI planning board.",
      "Reporting to executives? Open OKRs → Dashboard, then Sources, measures & funding to load your own data.",
      "Connect Jira or Azure DevOps under Setup → Jira & Azure DevOps when you want two-way sync.",
    ],
    tips: ["Press ? on any page to open the help for that page.", "The search box in the top bar finds any ticket, card, canvas or board."],
  },
  {
    path: "/okrs",
    space: "OKRs",
    title: "OKR dashboard",
    what: "The read-only view of every objective and its key results: overall progress, how many are on track, at risk or off track, days left in the quarter, the trend and what needs attention.",
    steps: ["Pick an entity at the top to see only its objectives and everything beneath it.", "Read the ring for overall progress: each key result is measured from its first value (the baseline) to its target.", "Open check-in from Needs attention to say what is true this week."],
    tips: ["Nothing here is typed in: it comes from your measures. Change the data or check in, and these numbers move."],
  },
  {
    path: "/okrs/alignment",
    space: "OKRs",
    title: "Alignment",
    what: "Key results grouped by the objective they prove.",
    steps: ["Drag a key result onto another objective to realign it; it stays an outcome or a KPI.", "Use Note, Pen and Timer in the dock to run an alignment workshop on the same board.", "Switch to List for a printable view, or Copy as text to paste the result anywhere."],
  },
  {
    path: "/okrs/check-in",
    space: "OKRs",
    title: "Weekly check-in",
    what: "The same key results grouped by status. The data proposes a status; your check-in overrides it until the next one.",
    steps: ["Drag a key result to On track, At risk or Off track.", "The card shows who checked in last; the dashboard follows at once."],
    tips: ["A key result marked “from data” has had no check-in yet."],
  },
  {
    path: "/outcomes",
    space: "OKRs",
    title: "Sources, measures and funding",
    what: "Where the evidence comes in: sources (CSV from your CRM, finance, learning platform, surveys, Jira), measures over them, objectives per entity, initiatives with their funding, and the printable one-pager.",
    steps: [
      "Sources: upload a CSV with a period column (a date or month). Each source is a table you can measure.",
      "Measures: pick a column and how to count it per month (sum, average, count, latest), or divide one measure by another.",
      "Objectives: choose which measures are outcomes (the change you want) and which are KPIs (health), with targets.",
      "Initiatives & funding: what was committed, by whom, spend to date, and which outcomes show what it bought.",
      "One-pager: pick an entity and print or save as PDF for the executive team or the board.",
    ],
    tips: ["Start empty clears the example data. Two examples are built in: an education programme and Northstar Bank."],
  },
  {
    path: "/classroom",
    space: "Classes",
    title: "Class boards",
    what: "Leading SAFe, SPC, Advanced SPC, POPM and RTE, each a board with a Start here strip and one frame per lesson.",
    steps: ["Choose Start this class: a board for this cohort is created and opened.", "Share the board link with participants.", "Classes you are running are listed below for next time."],
    tips: ["Chapters that teach a Trainyard tool (PI planning, readiness, value streams, Inspect & Adapt) are built from the tool itself, so they stay current."],
  },
  {
    path: "/classroom/breakouts",
    space: "Classes",
    title: "Breakout groups",
    what: "Tables of four for the class you pick; a full table refuses a fifth person.",
    steps: ["Add participants by name, or keep the sample roster.", "Drag people onto tables, or Seat everyone at random.", "Add or remove tables with + Table and − Table."],
  },
  {
    path: "/classroom/agenda",
    space: "Classes",
    title: "Day plan",
    what: "The class's lessons laid out over its days; each half-day holds 180 minutes.",
    steps: ["Drag lessons between sessions; going over 180 minutes warns you.", "Use −15 and +15 on a lesson to change its length.", "Reset to the class order puts everything back."],
  },
  {
    path: "/rooms",
    space: "Rooms",
    title: "Rooms",
    what: "A room holds the boards and views for one purpose (an ART's planning room, the OKR room, the portfolio room, a class) and decides who may enter. Rooms are optional: boards outside a room are open to the whole workspace.",
    steps: ["Name the room, pick its purpose and who can enter, then Create room.", "Open the room to add boards: new, from a template, or moved in from the workspace.", "Connect it to the rooms it works with, so people move between them in one click."],
    tips: ["Your plan sets how many rooms you have and whether they can be private; the meter at the top shows where you stand.", "A workspace viewer only ever looks, in any room."],
  },
  {
    path: "/rooms/",
    space: "Rooms",
    title: "Inside a room",
    what: "The room's boards, the app views pinned to it, its people and its connected rooms.",
    steps: ["Add board creates a board in this room; Move in brings a board from the whole workspace.", "Managers add people and set each one to Can look, Can edit or Manages.", "Make private keeps the room to its people and the workspace's admins; Open to the workspace lets everyone in at the default access.", "Connect a room links two rooms both ways; Delete room keeps its boards, open to the workspace."],
  },
  {
    path: "/templates",
    space: "Templates and boards",
    title: "Template gallery",
    what: "Ready-made boards in each method's own words: SAFe, Scrum, Kanban, Lean, Six Sigma, manufacturing and general.",
    steps: ["Pick a method: the page takes on that method's look.", "Pick a template on the left and preview it as lanes or as a whiteboard.", "Name it and choose Create board from template."],
    tips: ["Or start blank from Your boards and add any templates to one board."],
  },
  {
    path: "/boards",
    space: "Rooms",
    title: "Your boards",
    what: "Every board in the workspace: from templates, blank whiteboards, classes and imports.",
    steps: ["New blank whiteboard opens an empty board.", "Open any board and use Add a template to place a template beside what is there.", "Filter by Classes, Whiteboards and templates, or Imported."],
  },
  {
    path: "/boards/",
    space: "Templates and boards",
    title: "Working on a board",
    what: "A whiteboard everyone edits: frames, cards, links and connectors.",
    steps: ["+ Card adds a sticky; double-click a card to write; drag to move.", "Connect draws a dependency between two cards.", "+ Link a record turns a card into a live link to a feature, risk, objective or canvas.", "Add a template places another board's frames to the right.", "Save as template keeps the structure for next time; Map onto the plan turns cards into backlog items, risks and dependencies."],
  },
  {
    path: "/imports",
    space: "Templates and boards",
    title: "Bring your own boards",
    what: "Pull a board in from Miro, Lucid (Lucidchart and Lucidspark), Mural, Trello, monday.com, iObeya or a spreadsheet, exactly as it is.",
    steps: ["Pick the tool your board lives in.", "Connect it with an access token (Miro, Lucid, Mural, Trello, monday.com) and choose a board, or upload an export (Miro CSV, Lucid shape data CSV, iObeya export, any CSV).", "Open the imported board, save it as a template or map it onto the plan."],
    tips: ["Tokens are stored encrypted and used only to read your boards."],
  },
  {
    path: "/portfolio",
    space: "Plan",
    title: "Portfolio",
    what: "Value streams with their budgets, epics in the Portfolio Kanban ranked by WSJF, guardrails, and portfolio OKRs.",
    steps: ["Move epics through funnel, reviewing, analyzing, backlog, implementing, done.", "Score WSJF on each epic to rank the backlog.", "Envision the future state from the Canvases page to turn strategy into epics."],
  },
  {
    path: "/value-streams",
    space: "Plan",
    title: "Value streams",
    what: "Identify value streams in five steps, then measure one as a value stream map.",
    steps: [
      "Choose a type (fulfilment, manufacturing, software product, supporting): its example loads as a starting point.",
      "1 · Operational value stream: the steps from trigger to value; click any chevron to rename it.",
      "2 · Solutions: the systems each step runs on. 3 · People: who builds and supports them, where.",
      "4 · Development value streams: group the solutions and people. 5 · ART design: cut trains of 50 to 125.",
      "Full breakdown shows all five levels at once; click a box to trace it. Measure it opens the map.",
    ],
    tips: ["What the facilitator would flag lists the gaps still open."],
  },
  {
    path: "/readiness",
    space: "Plan",
    title: "Readiness, WSJF and risks",
    what: "Everything that has to be true before PI planning: readiness checks, the ART backlog ranked by WSJF, risks with ROAM, and the launch canvases.",
    steps: [
      "Pick the PI at the top.",
      "Score each feature's user/business value, time criticality, risk reduction and job size; WSJF and the rank update as you go.",
      "Raise known risks and give each a ROAM status.",
      "Open the launch canvases: ART launch timeline and readiness checklist, LACE mission, value stream and ART canvases.",
    ],
    tips: ["Score one column at a time across all features, smallest first: relative values beat absolute ones."],
  },
  {
    path: "/canvases",
    space: "Plan",
    title: "Canvases",
    what: "SAFe's working artifacts kept as data, in roadmap order: strategy and epics, launching the train, readying the backlog.",
    steps: ["Choose New on a canvas type, or prefill a development value stream or ART canvas from an identification.", "Click any section to write in it; set the date and current or future state in the header."],
  },
  {
    path: "/board",
    space: "Plan",
    title: "PI planning board",
    what: "Milestones on top, features by team and iteration with dependency strings, and risks to ROAM below; changes sync back to Jira or Azure DevOps.",
    steps: ["Drag a feature to another iteration or team to replan it.", "Click a team's name to set its capacity: typed in, from members, or from velocity.", "Red strings show dependencies; dashed ones arrive too late.", "Add milestones and events with + in the top row."],
    tips: ["Readiness, WSJF and risks live on their own page before the event."],
  },
  {
    path: "/board/coach-sync",
    space: "Plan",
    title: "Coach Sync",
    what: "The Scrum of Scrums during PI planning: six checkpoints over two days, four questions each, answered per team.",
    steps: ["At each checkpoint, mark each team Yes, Partly, Not yet or Needs help.", "Add a note per team; Needs help flags the checkpoint for the RTE."],
  },
  {
    path: "/outcome-planning",
    space: "Plan",
    title: "PI Outcome Planning",
    what: "AI-Native SAFe's one-day planning: the outcome tree, the PI Outcome Planning Board, team boards, the management review and the vote.",
    steps: ["Build the outcome tree from objectives to key results.", "Drag work and milestones on the board; string cards that depend on each other.", "Tick a team's card to show it on the ART board; finish with the confidence vote."],
  },
  {
    path: "/dashboards",
    space: "Plan",
    title: "Delivery dashboards",
    what: "Flow, predictability and planning metrics by team, increment and work level, with a narrative.",
    steps: ["Pick a dashboard and filters; every widget explains how it is calculated.", "Use the assistant to draft the readout (when AI is configured)."],
  },
  {
    path: "/model",
    space: "Setup",
    title: "Operating model",
    what: "The framework your workspace speaks: levels, roles, events, cadence. SAFe, LeSS, Scrum@Scale, Nexus, Flight Levels and more, or your own fork.",
    steps: ["Pick a model, or fork one and rename its levels and events.", "Boards and dashboards follow the model's vocabulary."],
  },
  {
    path: "/sync",
    space: "Setup",
    title: "Jira and Azure DevOps",
    what: "Two-way sync of features, stories, risks and dependencies.",
    steps: ["Add a connection with the site URL and a token.", "Map projects or area paths to teams and choose the work item types.", "Changes made in Trainyard queue for review before they are pushed."],
  },
  { path: "/card-types", space: "Setup", title: "Card types", what: "The card types boards use, with SAFe's colour legend and any types you add.", steps: ["Add a type with its fields and colour.", "Admins can recolour the built-in types."] },
  { path: "/ai", space: "Setup", title: "AI portfolio", what: "AI initiatives through discover, specify, build, validate and release, with spend and value.", steps: ["Add initiatives and move them through the stages.", "Link features to an initiative to see what delivers it."] },
  { path: "/agents", space: "Setup", title: "AI agents", what: "Agents working on your teams, with an accountable human and an autonomy level each.", steps: ["Register an agent, its team and the person accountable for it.", "Set how far it may act without review."] },
  { path: "/users", space: "Setup", title: "Users and passwords", what: "Who can sign in, with which role, and their passwords and API keys.", steps: ["Add a user with a role: admin, planner, architect or viewer.", "Set or reset a password; everyone can change their own.", "Rotate an API key when someone leaves."] },
  { path: "/billing", space: "Setup", title: "Plan and billing", what: "Your plan, seats, trial and invoices.", steps: ["Upgrade or add seats; changes are charged pro rata.", "Switch to yearly after the first paid month.", "Claim the money-back guarantee here within your first paid month."] },
];

/** The help entry for a path: the most specific matching topic. */
export function helpFor(path: string): HelpTopic | undefined {
  let best: HelpTopic | undefined;
  for (const t of HELP) {
    const hit = t.path.endsWith("/") ? path.startsWith(t.path) : path === t.path || path.startsWith(`${t.path}/`);
    if (hit && (!best || t.path.length > best.path.length)) best = t;
  }
  return best;
}

export const HELP_SPACES: HelpTopic["space"][] = ["Getting started", "Rooms", "OKRs", "Classes", "Templates and boards", "Plan", "Setup"];
