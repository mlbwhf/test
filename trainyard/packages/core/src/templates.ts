// Built-in board templates. Each is a Board with isTemplate set, generated from a short
// spec so the layout stays consistent: frames on a grid, placeholder cards where a frame
// would otherwise be empty, columns and groups for table-shaped templates. Users fork
// them; the originals are regenerated on every start and never edited in place.
//
// These are original layouts of well-known agile practices. SAFe® is a registered
// trademark of Scaled Agile, Inc.; the templates summarise common practice, they do not
// copy any vendor's materials.

import { emptyBoard, type Board, type BoardNode, type Frame } from "./boards.js";
import { classTemplates } from "./classes.js";
import { INSPECT_AND_ADAPT } from "./inspectadapt.js";
import { twoChasmsTemplates } from "./twochasms.js";

export type TemplateMethod = "safe" | "scrum" | "kanban" | "lean" | "six-sigma" | "manufacturing" | "two-chasms" | "general";

export const TEMPLATE_METHODS: { id: TemplateMethod; label: string; blurb: string }[] = [
  { id: "safe", label: "SAFe", blurb: "Scaled Agile Framework events and artifacts, named as SAFe names them." },
  { id: "scrum", label: "Scrum", blurb: "The Scrum Guide's events and artifacts: Product Backlog, Sprint Planning, Sprint Backlog, Daily Scrum, Sprint Review, Sprint Retrospective." },
  { id: "kanban", label: "Kanban", blurb: "The Kanban Method: visualise, limit WIP, manage flow, explicit policies, feedback loops (cadences), improve." },
  { id: "lean", label: "Lean", blurb: "Lean thinking and the Toyota way: A3, PDCA, value stream mapping, kaizen, obeya, hoshin kanri." },
  { id: "six-sigma", label: "Six Sigma", blurb: "DMAIC and its tools: project charter, SIPOC, voice of the customer, fishbone, FMEA, control plan." },
  { id: "manufacturing", label: "Manufacturing", blurb: "Shop-floor management: SQDC tiered boards, andon, OEE, heijunka, 5S, gemba walks." },
  { id: "two-chasms", label: "Two Chasms", blurb: "The Two Chasms Framework from The Innovation Playground and The Mutation Age: five states (Reflex, Playground, Signal Sensing, Immune, Mutation), the readiness check, sixteen workshops and the Foundations class." },
  { id: "general", label: "General", blurb: "Practices every method shares." },
];

export interface TemplateInfo {
  id: string;
  name: string;
  blurb: string;
  /** Ceremony or cadence the board is used in. */
  event: string;
  tags: ("safe" | "team" | "portfolio" | "risk" | "lean" | "flow" | "class")[];
  /**
   * The body of practice the board comes from, in that practice's own words: SAFe boards use
   * SAFe's names exactly (classes depend on it), Scrum boards the Scrum Guide's, Kanban the
   * Kanban Method's, Lean and Six Sigma theirs, manufacturing the shop floor's.
   */
  method: TemplateMethod;
  zones: string[];
  cardTypes: string[];
  mapsTo: string;
}

const W = 420;
const H = 300;
const GAP = 40;

function grid(cols: string[], rows: string[], opts: { x?: number; y?: number; w?: number; h?: number } = {}): Frame[] {
  const w = opts.w ?? W;
  const h = opts.h ?? H;
  const x0 = opts.x ?? 0;
  const y0 = opts.y ?? 0;
  const frames: Frame[] = [];
  rows.forEach((r, ri) =>
    cols.forEach((c, ci) => {
      frames.push({ id: `${slug(r)}--${slug(c)}`, title: rows.length > 1 && cols.length > 1 ? `${r} · ${c}` : rows.length > 1 ? r : c, x: x0 + ci * (w + GAP), y: y0 + ri * (h + GAP), width: w, height: h });
    }),
  );
  return frames;
}

function strip(title: string, y: number, width: number, height = 220, x = 0): Frame {
  return { id: slug(title), title, x, y, width, height };
}

function placeholders(frames: Frame[], color = "#fff6c2"): BoardNode[] {
  return frames.map((f) => ({ id: `${f.id}-slot`, kind: "sticky", text: "", x: f.x + 20, y: f.y + 20, width: 180, height: 120, color, frameId: f.id, tags: [], fields: { placeholder: true } }));
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const NOW = "2026-01-01T00:00:00.000Z";

function template(info: TemplateInfo, build: (b: Board) => void): Board & { info: TemplateInfo } {
  const b = emptyBoard(`tpl-builtin-${info.id}`, info.name, { system: "trainyard", externalId: `builtin:${info.id}`, importedAt: NOW });
  b.isTemplate = true;
  build(b);
  return Object.assign(b, { info });
}

export const TEMPLATE_CATALOG: TemplateInfo[] = [
  { id: "pi-planning", name: "PI Planning board", blurb: "Teams × iterations with features, dependencies and capacity.", event: "PI Planning", method: "safe", tags: ["safe"], zones: ["Teams × iterations", "Milestones", "Uncommitted", "Risks (ROAM)"], cardTypes: ["Feature", "Enabler", "Milestone"], mapsTo: "Items and dependencies" },
  { id: "team-breakout", name: "Team breakout", blurb: "Capacity and load per iteration, stories and features, IP iteration, PI objectives, risks, features backlog and planning poker for one team.", event: "PI Planning", method: "safe", tags: ["safe", "team"], zones: ["Capacity · load", "Stories per iteration", "Features per iteration", "IP iteration", "PI objectives (BV · AV)", "Risks", "Features backlog", "Planning poker"], cardTypes: ["Story", "Feature", "Objective", "Risk"], mapsTo: "Items and objectives" },
  { id: "roam", name: "ROAM risk board", blurb: "Resolved, Owned, Accepted, Mitigated.", event: "PI Planning · ART Sync", method: "safe", tags: ["safe", "risk"], zones: ["Inbox", "Resolved", "Owned", "Accepted", "Mitigated"], cardTypes: ["Risk"], mapsTo: "Risks with ROAM state" },
  { id: "program-board", name: "PI planning board", blurb: "The living version of the PI plan (the program board), with dependency strings.", event: "ART Sync", method: "safe", tags: ["safe"], zones: ["Teams × iterations", "Shared services", "Milestones"], cardTypes: ["Feature", "Milestone"], mapsTo: "Items and dependencies" },
  { id: "confidence-vote", name: "Confidence vote", blurb: "Fist of five per team and for the ART.", event: "PI Planning", method: "safe", tags: ["safe", "team"], zones: ["1 · No confidence", "2", "3", "4", "5 · Full confidence"], cardTypes: ["Vote"], mapsTo: "Nothing (record only)" },
  { id: "retrospective", name: "Retrospective", blurb: "Went well, didn't go well, ideas, actions.", event: "Iteration · Inspect & Adapt", method: "general", tags: ["team"], zones: ["Went well", "Didn't go well", "Ideas", "Actions"], cardTypes: ["Note", "Action"], mapsTo: "Actions as items" },
  { id: "kanban", name: "Team Kanban", blurb: "Columns with WIP limits.", event: "Daily", method: "kanban", tags: ["team", "flow"], zones: ["Ready", "In progress", "Review", "Done"], cardTypes: ["Work item"], mapsTo: "Items with status" },
  { id: "inspect-adapt", name: "Inspect & Adapt", blurb: "PI system demo, quantitative and qualitative measurement, and the problem-solving workshop: fishbone by SAFe's categories, five whys, improvement backlog.", event: "Inspect & Adapt", method: "safe", tags: ["safe", "team"], zones: ["PI system demo", "Measurement", "Problem statement", "Fishbone (people, processes, tools, program, environment)", "Five whys", "Improvement backlog"], cardTypes: ["Cause", "Improvement"], mapsTo: "Improvement items" },
  { id: "lean-business-case", name: "Epic / Lean business case", blurb: "Hypothesis, MVP, leading indicators, WSJF.", event: "Portfolio Sync", method: "safe", tags: ["portfolio"], zones: ["Hypothesis", "MVP", "Leading indicators", "WSJF"], cardTypes: ["Note"], mapsTo: "Portfolio epic" },
  { id: "okr-tree", name: "OKR tree", blurb: "Objectives with key results and owners.", event: "Quarterly", method: "general", tags: ["portfolio"], zones: ["Objective", "Key results", "Owner", "Metric link"], cardTypes: ["Row"], mapsTo: "OKRs" },
  { id: "dependency-map", name: "Dependency map", blurb: "Teams as nodes, dependencies as arrows.", event: "ART Sync", method: "general", tags: ["safe", "risk"], zones: ["Teams", "Arrows", "Legend"], cardTypes: ["Team node"], mapsTo: "Dependencies" },
  { id: "obeya", name: "Obeya wall", blurb: "Strategy, KPIs, projects, problems, actions in one room.", event: "Weekly", method: "lean", tags: ["lean"], zones: ["Strategy", "KPIs", "Projects", "Problems", "Actions", "Calendar"], cardTypes: ["Note", "KPI tile", "Action"], mapsTo: "Actions as items" },
  { id: "story-map", name: "User story map", blurb: "Activities and tasks across the top, stories sliced into releases below.", event: "Backlog refinement · PI Planning prep", method: "general", tags: ["team"], zones: ["User activities", "User tasks", "Release 1", "Release 2", "Release 3"], cardTypes: ["Activity", "Task", "Story"], mapsTo: "Stories with release as iteration" },
  { id: "value-stream-art", name: "Value stream and ART identification", blurb: "Operational value stream, supporting systems, development value streams with people and locations, and the resulting ART design.", event: "Value Stream Identification workshop", method: "safe", tags: ["safe", "portfolio"], zones: ["Operational value stream", "Supporting systems", "Development value streams", "ART design"], cardTypes: ["Step", "System", "Team (people · location)", "ART"], mapsTo: "Teams and ARTs (structure only)" },
  { id: "portfolio-kanban", name: "Portfolio Kanban", blurb: "Epics from funnel to done, with WIP limits per state and an MVP / persevere split.", event: "Portfolio Sync", method: "safe", tags: ["portfolio", "flow"], zones: ["Funnel", "Reviewing (WIP 4)", "Analyzing (WIP 4)", "Portfolio backlog", "Implementing: MVP (WIP 3)", "Implementing: persevere (WIP 5)", "Done"], cardTypes: ["Epic", "Key result"], mapsTo: "Epics with portfolio state" },
  { id: "art-kanban", name: "ART Kanban", blurb: "Features through the continuous delivery pipeline, with WIP limits.", event: "ART Sync · PO Sync", method: "safe", tags: ["safe", "flow"], zones: ["Funnel", "Analyzing (WIP 2)", "Ready (WIP 6)", "Implementing (WIP 4)", "Validating on staging (WIP 6)", "Deploying to production (WIP 4)", "Releasing (WIP 5)", "Done"], cardTypes: ["Feature", "Enabler"], mapsTo: "Features with state" },
  { id: "portfolio-roadmap", name: "Portfolio roadmap per ART", blurb: "Epics as bars across quarters, one lane per ART, with milestones.", event: "Portfolio Sync · Pre-PI Planning", method: "safe", tags: ["portfolio"], zones: ["Milestones", "ART lanes × quarters"], cardTypes: ["Epic", "Milestone"], mapsTo: "Epics and their target increments" },
  { id: "portfolio-art-board", name: "Portfolio ART planning board", blurb: "Epics and capabilities per ART across iterations, with milestones and cross-ART dependency strings.", event: "Pre-PI Planning · Solution Sync", method: "safe", tags: ["safe", "portfolio"], zones: ["Milestones", "ARTs × iterations"], cardTypes: ["Epic", "Capability", "Milestone"], mapsTo: "Items and dependencies" },
  { id: "solutions-horizon", name: "Solutions by investment horizon", blurb: "Ideas, then horizons 3 to 0: evaluating, emerging, investing, extracting, retiring.", event: "Strategic Portfolio Review", method: "safe", tags: ["portfolio", "lean"], zones: ["Ideas", "Horizon 3 · Evaluating", "Horizon 2 · Emerging", "Horizon 1 · Investing", "Horizon 1 · Extracting", "Horizon 0 · Retiring"], cardTypes: ["Solution", "Idea"], mapsTo: "Epics tagged with a horizon" },
  // ---- Scrum (Scrum Guide vocabulary) ----
  { id: "scrum-product-backlog", name: "Product Backlog", blurb: "The ordered list of what is needed to improve the product, with the Product Goal on top and refinement state per item.", event: "Product Backlog refinement", method: "scrum", tags: ["team", "flow"], zones: ["Product Goal", "Ready for Sprint", "Refining", "New ideas"], cardTypes: ["Product Backlog item"], mapsTo: "Items with status" },
  { id: "scrum-sprint-planning", name: "Sprint Planning", blurb: "Why is this Sprint valuable (Sprint Goal), what can be Done (selected Product Backlog items), how will the work get done (the plan).", event: "Sprint Planning", method: "scrum", tags: ["team"], zones: ["Sprint Goal", "Product Backlog (candidates)", "Sprint Backlog (selected)", "The plan for the first days", "Definition of Done", "Capacity"], cardTypes: ["Product Backlog item", "Task"], mapsTo: "Items in the iteration" },
  { id: "scrum-sprint-board", name: "Sprint Backlog board", blurb: "The Sprint Goal, the selected Product Backlog items and the plan, as a task board the Developers own.", event: "Daily Scrum", method: "scrum", tags: ["team", "flow"], zones: ["Sprint Goal", "To do", "In progress", "Done (meets the Definition of Done)", "Impediments"], cardTypes: ["Product Backlog item", "Task", "Impediment"], mapsTo: "Items with status" },
  { id: "scrum-sprint-review", name: "Sprint Review", blurb: "Inspect the Increment with stakeholders, adapt the Product Backlog.", event: "Sprint Review", method: "scrum", tags: ["team"], zones: ["Sprint Goal and outcome", "The Increment (Done items)", "Not Done", "Stakeholder feedback", "Product Backlog changes", "Next steps"], cardTypes: ["Note", "Product Backlog item"], mapsTo: "Items (feedback as new items)" },
  { id: "scrum-sprint-retrospective", name: "Sprint Retrospective", blurb: "Inspect individuals, interactions, processes, tools and the Definition of Done; pick the improvements for the next Sprint.", event: "Sprint Retrospective", method: "scrum", tags: ["team"], zones: ["What went well", "What could improve", "Definition of Done check", "Improvements for the next Sprint"], cardTypes: ["Note", "Improvement"], mapsTo: "Improvement items" },
  // ---- Kanban (Kanban Method vocabulary) ----
  { id: "kanban-system", name: "Kanban system board", blurb: "Commitment point to delivery point, WIP limits per column, explicit policies under each column, classes of service and blockers.", event: "Daily Kanban meeting", method: "kanban", tags: ["team", "flow"], zones: ["Options (upstream)", "Committed (WIP)", "In progress (WIP)", "Verify (WIP)", "Ready to deliver", "Delivered", "Explicit policies"], cardTypes: ["Work item", "Blocker", "Class of service: standard · expedite · fixed date · intangible"], mapsTo: "Items with status" },
  { id: "kanban-statik", name: "STATIK canvas", blurb: "Systems Thinking Approach to Introducing Kanban: the steps to design a kanban system for one service.", event: "Kanban system design workshop", method: "kanban", tags: ["team", "flow"], zones: ["Purpose and fit", "Sources of dissatisfaction (internal · external)", "Demand analysis", "Capability analysis", "Workflow (knowledge discovery)", "Classes of service", "Kanban system design", "Rollout"], cardTypes: ["Note"], mapsTo: "Nothing (design record)" },
  { id: "kanban-service-delivery-review", name: "Service delivery review", blurb: "The Kanban cadence that inspects the service against its fitness criteria: lead time, throughput, flow efficiency, blockers.", event: "Service delivery review (weekly or fortnightly)", method: "kanban", tags: ["team", "flow"], zones: ["Fitness criteria and targets", "Lead time distribution", "Throughput", "Blockers and clustering", "Aging WIP", "Policy changes"], cardTypes: ["Metric", "Blocker", "Policy change"], mapsTo: "Flow metrics" },
  { id: "kanban-flight-levels", name: "Operations review (flight levels)", blurb: "Team, coordination and strategy kanban in one picture: where work waits between levels.", event: "Operations review (monthly)", method: "kanban", tags: ["portfolio", "flow"], zones: ["Strategy kanban", "Coordination kanban", "Team kanbans", "Hand-offs and queues", "Improvement actions"], cardTypes: ["Work item", "Action"], mapsTo: "Items and actions" },
  // ---- Lean ----
  { id: "lean-a3", name: "A3 problem solving", blurb: "One page: background, current condition, target, root cause analysis, countermeasures, plan, follow-up.", event: "A3 coaching", method: "lean", tags: ["lean"], zones: ["Background", "Current condition", "Goal / target condition", "Root cause analysis", "Countermeasures", "Plan (who · what · when)", "Follow-up and confirmation"], cardTypes: ["Note", "Countermeasure", "Action"], mapsTo: "Actions as items" },
  { id: "lean-pdca", name: "PDCA board", blurb: "Plan, Do, Check, Act: experiments as cards moving through the cycle.", event: "Kaizen · weekly", method: "lean", tags: ["lean", "team"], zones: ["Plan (hypothesis · measure)", "Do", "Check (result vs expectation)", "Act (adopt · adapt · abandon)"], cardTypes: ["Experiment"], mapsTo: "Items with status" },
  { id: "lean-vsm", name: "Value stream map (current and future state)", blurb: "Process boxes with cycle time, changeover, uptime; inventory triangles; the timeline ladder of value-added and waiting time; kaizen bursts.", event: "Value stream mapping workshop", method: "lean", tags: ["lean", "portfolio"], zones: ["Customer and demand (takt)", "Current state: process boxes and inventory", "Information flow", "Timeline: lead time vs process time", "Kaizen bursts", "Future state"], cardTypes: ["Process box (C/T · C/O · uptime)", "Inventory", "Kaizen burst"], mapsTo: "Value stream steps" },
  { id: "lean-kaizen", name: "Kaizen newspaper", blurb: "Improvement ideas from the gemba, with owner, due date and status, reviewed daily.", event: "Daily huddle", method: "lean", tags: ["lean", "team"], zones: ["Idea", "Problem it solves", "Owner", "Due", "Status"], cardTypes: ["Row"], mapsTo: "Improvement items" },
  { id: "lean-hoshin", name: "Hoshin kanri X-matrix", blurb: "Breakthrough objectives, annual objectives, improvement priorities and targets, with the correlation corners and owners.", event: "Strategy deployment (annual · catchball)", method: "lean", tags: ["lean", "portfolio"], zones: ["Breakthrough objectives (3–5 years)", "Annual objectives", "Top-level improvement priorities", "Targets to improve", "Resources / owners", "Correlation corners"], cardTypes: ["Objective", "Priority", "Target"], mapsTo: "OKRs" },
  // ---- Six Sigma ----
  { id: "six-sigma-dmaic", name: "DMAIC project board", blurb: "Define, Measure, Analyze, Improve, Control: the deliverables and tollgate questions of each phase.", event: "DMAIC tollgate review", method: "six-sigma", tags: ["lean", "flow"], zones: ["Define: charter · VOC · SIPOC", "Measure: data collection plan · baseline · MSA", "Analyze: root causes · hypothesis tests", "Improve: solutions · pilot · FMEA", "Control: control plan · SPC · hand-over"], cardTypes: ["Deliverable", "Tollgate question"], mapsTo: "Items with status" },
  { id: "six-sigma-charter", name: "Project charter", blurb: "Business case, problem statement, goal statement, scope, team, milestones.", event: "Define phase", method: "six-sigma", tags: ["lean"], zones: ["Business case", "Problem statement", "Goal statement (SMART)", "Scope (in · out)", "Team and roles (Champion · Black Belt · Green Belts)", "Milestones"], cardTypes: ["Note"], mapsTo: "Nothing (charter record)" },
  { id: "six-sigma-sipoc", name: "SIPOC", blurb: "Suppliers, Inputs, Process (5–7 steps), Outputs, Customers: the high-level process picture for the Define phase.", event: "Define phase", method: "six-sigma", tags: ["lean"], zones: ["Suppliers", "Inputs", "Process", "Outputs", "Customers"], cardTypes: ["Note"], mapsTo: "Value stream steps" },
  { id: "six-sigma-voc-ctq", name: "Voice of the customer → CTQ tree", blurb: "Customer statements, drivers, critical-to-quality requirements with measurable specification limits.", event: "Define phase", method: "six-sigma", tags: ["lean"], zones: ["Voice of the customer (verbatims)", "Key drivers", "Critical to quality (CTQ)", "Specification limits (LSL · USL)"], cardTypes: ["Verbatim", "Driver", "CTQ"], mapsTo: "Nothing (requirements record)" },
  { id: "six-sigma-fishbone", name: "Fishbone (Ishikawa, 6M)", blurb: "Effect at the head; causes on the bones: Man, Machine, Method, Material, Measurement, Mother Nature (environment).", event: "Analyze phase", method: "six-sigma", tags: ["lean", "risk"], zones: ["Effect (problem statement)", "Man (people)", "Machine", "Method", "Material", "Measurement", "Mother Nature (environment)", "Five whys on the likely cause"], cardTypes: ["Cause"], mapsTo: "Nothing (analysis record)" },
  { id: "six-sigma-fmea", name: "FMEA", blurb: "Failure Mode and Effects Analysis: process step, failure mode, effect, severity, cause, occurrence, current controls, detection, RPN, recommended action.", event: "Improve phase · design review", method: "six-sigma", tags: ["lean", "risk"], zones: ["Process step", "Failure mode", "Effect", "S · O · D", "RPN", "Recommended action"], cardTypes: ["Row"], mapsTo: "Risks" },
  { id: "six-sigma-control-plan", name: "Control plan", blurb: "What is measured after Improve, how, how often, by whom, the reaction plan when it drifts.", event: "Control phase", method: "six-sigma", tags: ["lean"], zones: ["Process step", "Characteristic (CTQ)", "Specification", "Measurement method", "Sample size · frequency", "Control method (SPC chart)", "Reaction plan", "Owner"], cardTypes: ["Row"], mapsTo: "Nothing (control record)" },
  // ---- Manufacturing ----
  { id: "mfg-sqdc", name: "SQDC tiered board", blurb: "Safety, Quality, Delivery, Cost (and People): daily letters coloured green or red, with the actions behind the reds, for tier 1 to tier 3 meetings.", event: "Tiered daily management (tier 1 · 2 · 3)", method: "manufacturing", tags: ["lean", "team"], zones: ["Safety", "Quality", "Delivery", "Cost", "People", "Actions (owner · due)", "Escalations to the next tier"], cardTypes: ["Daily mark", "Action", "Escalation"], mapsTo: "Actions as items" },
  { id: "mfg-andon", name: "Andon and line status", blurb: "Station by station: running, slow, stopped, help called, with the reason and the response time.", event: "Shift", method: "manufacturing", tags: ["lean", "team"], zones: ["Stations", "Status (green · yellow · red)", "Reason", "Response (who · time)", "Open stops"], cardTypes: ["Station", "Stop"], mapsTo: "Items with status" },
  { id: "mfg-oee", name: "OEE tracker", blurb: "Availability × Performance × Quality per line and shift, with the six big losses behind each.", event: "Shift handover · weekly review", method: "manufacturing", tags: ["lean"], zones: ["Line · shift", "Availability (breakdowns · changeovers)", "Performance (minor stops · reduced speed)", "Quality (defects · startup rejects)", "OEE", "Top losses"], cardTypes: ["Row"], mapsTo: "Flow metrics" },
  { id: "mfg-heijunka", name: "Heijunka box", blurb: "Levelled production schedule: product rows × pitch-interval columns, a kanban in each slot.", event: "Daily scheduling", method: "manufacturing", tags: ["lean", "flow"], zones: ["Products (rows)", "Pitch intervals (columns)", "Kanban slots"], cardTypes: ["Kanban"], mapsTo: "Items in time slots" },
  { id: "mfg-5s", name: "5S audit board", blurb: "Sort, Set in order, Shine, Standardise, Sustain: the area's score per S, photos before and after, actions.", event: "5S audit (weekly)", method: "manufacturing", tags: ["lean", "team"], zones: ["Sort (seiri)", "Set in order (seiton)", "Shine (seiso)", "Standardise (seiketsu)", "Sustain (shitsuke)", "Score trend", "Actions"], cardTypes: ["Finding", "Action"], mapsTo: "Actions as items" },
  { id: "mfg-gemba", name: "Gemba walk", blurb: "Go see, ask why, show respect: the route, what was observed at each stop, the questions asked and the follow-ups.", event: "Gemba walk (daily · weekly)", method: "manufacturing", tags: ["lean"], zones: ["Route and purpose", "Observations", "Questions asked", "Problems surfaced", "Follow-ups (owner · due)"], cardTypes: ["Observation", "Follow-up"], mapsTo: "Actions as items" },
];

const info = (id: string) => TEMPLATE_CATALOG.find((t) => t.id === id)!;

export function builtinTemplates(teamNames: string[] = ["Team 1", "Team 2", "Team 3", "Team 4"], iterationNames: string[] = ["Iteration 1", "Iteration 2", "Iteration 3", "Iteration 4", "Iteration 5"]): (Board & { info: TemplateInfo })[] {
  const teams = teamNames.length ? teamNames : ["Team 1"];
  const iterations = iterationNames.length ? iterationNames : ["Iteration 1"];
  const rowW = iterations.length * (W + GAP) - GAP;

  return [
    template(info("pi-planning"), (b) => {
      const milestones = strip("Milestones and events", 0, rowW, 160);
      const body = grid(iterations, teams, { y: 200 });
      const bottomY = 200 + teams.length * (H + GAP);
      b.frames = [milestones, ...body, strip("Uncommitted objectives and features", bottomY, Math.floor(rowW / 2) - GAP / 2, 260), strip("Program risks (ROAM)", bottomY, Math.floor(rowW / 2) - GAP / 2, 260, Math.floor(rowW / 2) + GAP / 2)];
      b.nodes = placeholders(body);
    }),
    template(info("team-breakout"), (b) => {
      const all = [...iterations, "IP iteration"];
      const fullW = all.length * (W + GAP) - GAP;
      const cap = grid(all, ["Capacity · load"], { h: 120 });
      const stories = grid(iterations, ["User stories"], { y: 160, h: 420 });
      const features = grid(iterations, ["Features"], { y: 620, h: 220 });
      const ip = { id: "ip-iteration", title: "IP iteration: innovation, planning, PI system demo", x: iterations.length * (W + GAP), y: 160, width: W, height: 680 };
      const quarter = Math.floor((fullW - 3 * GAP) / 4);
      const bottom = ["PI objectives: committed · uncommitted (BV · AV)", "Risks", "Features backlog", "Planning poker"].map((t, i) => strip(t, 880, quarter, 340, i * (quarter + GAP)));
      b.frames = [...cap, ...stories, ...features, ip, ...bottom];
      b.nodes = [...placeholders(stories, "#dcf3e4"), ...placeholders(features, "#cfe3fb"), ...placeholders([bottom[1]!], "#fbd9d2")];
    }),
    template(info("roam"), (b) => {
      const cols = grid(["Inbox", "Resolved", "Owned", "Accepted", "Mitigated"], ["Risks"], { h: 700, w: 320 });
      b.frames = cols;
      b.nodes = placeholders(cols.slice(0, 1), "#fbd9d2");
    }),
    template(info("program-board"), (b) => {
      const body = grid(iterations, [...teams, "Shared services"], { y: 200 });
      b.frames = [strip("Milestones and events", 0, rowW, 160), ...body];
      b.nodes = placeholders(body);
    }),
    template(info("confidence-vote"), (b) => {
      b.frames = grid(["1 · No confidence", "2", "3", "4", "5 · Full confidence"], ["Votes"], { h: 500, w: 260 });
    }),
    template(info("retrospective"), (b) => {
      const cols = grid(["Went well", "Didn't go well", "Ideas"], ["Notes"], { h: 600 });
      b.frames = [...cols, strip("Actions (owner · by when)", 640, 3 * (W + GAP) - GAP, 240)];
      b.nodes = [...placeholders(cols.slice(0, 1), "#dcf3e4"), ...placeholders(cols.slice(1, 2), "#fbd9d2"), ...placeholders(cols.slice(2, 3), "#cfe3fb")];
    }),
    template(info("kanban"), (b) => {
      b.columns = [
        { id: "title", title: "Work item", type: "text" },
        { id: "state", title: "State", type: "status" },
        { id: "owner", title: "Owner", type: "people" },
        { id: "age", title: "Age (days)", type: "numbers" },
        { id: "blocked", title: "Blocked", type: "checkbox" },
      ];
      b.groups = [
        { id: "ready", title: "Ready" },
        { id: "doing", title: "In progress (WIP 3)" },
        { id: "review", title: "Review (WIP 2)" },
        { id: "done", title: "Done" },
      ];
    }),
    template(info("inspect-adapt"), (b) => {
      // Built from INSPECT_AND_ADAPT, the same definition the class boards use.
      const fullW = 3 * (W + GAP) - GAP;
      const parts = INSPECT_AND_ADAPT.parts.map((p, i) => ({ id: slug(p.title), title: `${i + 1}. ${p.title}`, x: i * (W + GAP), y: 0, width: W, height: 180 }));
      const problem = strip("Problem statement", 220, 2 * W + GAP, 160);
      const bones = INSPECT_AND_ADAPT.fishbone.map((c, i) => ({ id: `fishbone-${slug(c)}`, title: `Root causes · ${c}`, x: (i % 3) * ((2 * W + GAP) / 3 + 0), y: 420 + Math.floor(i / 3) * 280, width: Math.floor((2 * W + GAP) / 3) - 12, height: 260 }));
      const whys = { id: "five-whys", title: "Five whys", x: 2 * (W + GAP), y: 220, width: W, height: 740 };
      const backlog = { id: "improvement-backlog", title: `Improvement backlog: ${INSPECT_AND_ADAPT.improvementBacklog.join(" · ")}`, x: 0, y: 1000, width: fullW, height: 240 };
      b.frames = [...parts, problem, ...bones, whys, backlog];
      b.nodes = placeholders(bones, "#fbd9d2");
    }),
    template(info("lean-business-case"), (b) => {
      b.frames = [
        { id: "hypothesis", title: "Epic hypothesis statement", x: 0, y: 0, width: 2 * W + GAP, height: 260 },
        { id: "mvp", title: "MVP", x: 0, y: 300, width: W, height: 300 },
        { id: "leading-indicators", title: "Leading indicators", x: W + GAP, y: 300, width: W, height: 300 },
        { id: "wsjf", title: "WSJF: BV · TC · RR/OE · size", x: 2 * (W + GAP), y: 0, width: W, height: 600 },
      ];
      b.nodes = placeholders([b.frames[0]!, b.frames[1]!, b.frames[2]!], "#cfe3fb");
    }),
    template(info("okr-tree"), (b) => {
      b.columns = [
        { id: "title", title: "Key result", type: "text" },
        { id: "baseline", title: "Baseline", type: "numbers" },
        { id: "target", title: "Target", type: "numbers" },
        { id: "current", title: "Current", type: "numbers" },
        { id: "owner", title: "Owner", type: "people" },
        { id: "metric", title: "Metric link", type: "text" },
      ];
      b.groups = [
        { id: "objective-1", title: "Objective 1" },
        { id: "objective-2", title: "Objective 2" },
        { id: "objective-3", title: "Objective 3" },
      ];
    }),
    template(info("dependency-map"), (b) => {
      const n = teams.length;
      const cx = 700;
      const cy = 500;
      const r = 380;
      b.nodes = teams.map((t, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        return { id: `team-${slug(t)}`, kind: "shape", text: t, x: Math.round(cx + r * Math.cos(a) - 90), y: Math.round(cy + r * Math.sin(a) - 50), width: 180, height: 100, color: "#ffffff", tags: [], fields: {} };
      });
      b.frames = [{ id: "legend", title: "Legend: arrow from provider to consumer; red when the provider lands late", x: 0, y: 980, width: 1400, height: 120 }];
    }),
    template(info("obeya"), (b) => {
      b.frames = grid(["Strategy", "KPIs", "Projects"], ["Row"], { h: 420 }).concat(grid(["Problems", "Actions", "Calendar"], ["Row 2"], { y: 460, h: 420 })).map((f) => ({ ...f, title: f.title }));
      b.nodes = placeholders(b.frames);
    }),
    template(info("story-map"), (b) => {
      const steps = ["Activity 1", "Activity 2", "Activity 3", "Activity 4"];
      const activities = grid(steps, ["User activities"], { h: 160, w: 360 });
      const tasks = grid(steps, ["User tasks"], { y: 200, h: 180, w: 360 });
      const releases = grid(steps, ["Release 1", "Release 2", "Release 3"], { y: 420, h: 280, w: 360 });
      b.frames = [...activities, ...tasks, ...releases];
      b.nodes = [...placeholders(activities, "#cfe3fb"), ...placeholders(tasks, "#ffffff"), ...placeholders(releases.filter((f) => f.id.startsWith("release-1")), "#dcf3e4")];
    }),
    template(info("value-stream-art"), (b) => {
      const width = 7 * 220 - 40 + 80;
      b.frames = [
        strip("Operational value stream: trigger → steps → value", 0, width, 300),
        strip("Supporting systems", 340, width, 240),
        strip("Development value streams: teams, people and locations", 620, width, 300),
        strip("ART design: name · size · locations", 960, width, 220),
      ];
      const card = (id: string, text: string, x: number, y: number, color: string, frameId: string, kind: BoardNode["kind"] = "sticky"): BoardNode => ({ id, kind, text, x, y, width: 180, height: 100, color, frameId, tags: [], fields: {} });
      const ops = ["Trigger", "Step 1", "Step 2", "Step 3", "Step 4", "Step 5", "Value"];
      b.nodes = [
        ...ops.map((t, i) => card(`op-${i}`, t, 40 + i * 220, 120, i === 0 || i === ops.length - 1 ? "#ffffff" : "#dcf3e4", b.frames[0]!.id, i === 0 || i === ops.length - 1 ? "text" : "sticky")),
        ...["System A", "System B", "System C"].map((t, i) => card(`sys-${i}`, t, 260 + i * 440, 440, "#fff6c2", b.frames[1]!.id)),
        ...["Team · people · location", "Team · people · location", "Team · people · location"].map((t, i) => card(`dvs-${i}`, t, 260 + i * 440, 740, "#cfe3fb", b.frames[2]!.id)),
        ...["ART 1 · size · locations", "ART 2 · size · locations"].map((t, i) => card(`art-${i}`, t, 260 + i * 660, 1040, "#ffffff", b.frames[3]!.id, "shape")),
      ];
      b.edges = [
        { id: "e-sys-0", fromId: "sys-0", toId: "op-1" },
        { id: "e-sys-1", fromId: "sys-1", toId: "op-3" },
        { id: "e-sys-2", fromId: "sys-2", toId: "op-5" },
        { id: "e-dvs-0", fromId: "dvs-0", toId: "sys-0" },
        { id: "e-dvs-1", fromId: "dvs-1", toId: "sys-1" },
        { id: "e-dvs-2", fromId: "dvs-2", toId: "sys-2" },
      ];
    }),
    template(info("portfolio-kanban"), (b) => {
      const cols = grid(["Funnel", "Reviewing (WIP 4)", "Analyzing (WIP 4)", "Portfolio backlog", "Implementing: MVP (WIP 3)", "Implementing: persevere (WIP 5)", "Done"], ["Epics"], { h: 760, w: 300 });
      b.frames = cols;
      b.nodes = placeholders(cols.slice(0, 1), "#cfe3fb");
    }),
    template(info("art-kanban"), (b) => {
      const cols = grid(["Funnel", "Analyzing (WIP 2)", "Ready (WIP 6)", "Implementing (WIP 4)", "Validating on staging (WIP 6)", "Deploying to production (WIP 4)", "Releasing (WIP 5)", "Done"], ["Features"], { h: 760, w: 280 });
      b.frames = cols;
      b.nodes = placeholders(cols.slice(0, 1), "#cfe3fb");
    }),
    template(info("portfolio-roadmap"), (b) => {
      const quarters = ["Q1", "Q2", "Q3", "Q4"];
      const arts = ["ART 1", "ART 2", "ART 3"];
      const qW = 2 * W + GAP;
      const lanes = grid(quarters, arts, { y: 200, w: qW, h: 240 });
      b.frames = [strip("Milestones and portfolio events", 0, quarters.length * (qW + GAP) - GAP, 160), ...lanes];
      b.nodes = arts.map((a, i) => ({ id: `epic-${i}`, kind: "shape" as const, text: `Epic for ${a}: drag the ends to its target quarters`, x: 20 + i * 260, y: 200 + i * (240 + GAP) + 60, width: qW, height: 120, color: ["#fbd9d2", "#cfe3fb", "#fff6c2"][i]!, frameId: lanes[i * quarters.length]!.id, tags: [], fields: { placeholder: false } }));
    }),
    template(info("portfolio-art-board"), (b) => {
      const arts = ["ART 1", "ART 2", "ART 3"];
      const body = grid(iterations, arts, { y: 200 });
      b.frames = [strip("Milestones and solution events", 0, rowW, 160), ...body];
      b.nodes = placeholders(body, "#cfe3fb");
    }),
    template(info("solutions-horizon"), (b) => {
      const ideas = { id: "ideas", title: "Ideas", x: 0, y: 0, width: 300, height: 760 };
      const horizons = grid(["Horizon 3 · Evaluating", "Horizon 2 · Emerging", "Horizon 1 · Investing", "Horizon 1 · Extracting", "Horizon 0 · Retiring"], ["Solutions"], { x: 340, h: 760, w: 320 });
      b.frames = [ideas, ...horizons];
      b.nodes = placeholders([ideas]);
    }),

    // ---- Scrum ----
    template(info("scrum-product-backlog"), (b) => {
      b.columns = [
        { id: "title", title: "Product Backlog item", type: "text" },
        { id: "order", title: "Order", type: "numbers" },
        { id: "size", title: "Size", type: "numbers" },
        { id: "state", title: "State", type: "status" },
        { id: "owner", title: "Raised by", type: "people" },
      ];
      b.groups = [
        { id: "product-goal", title: "Product Goal" },
        { id: "ready", title: "Ready for Sprint (refined, sized, meets the Definition of Ready)" },
        { id: "refining", title: "Refining" },
        { id: "ideas", title: "New ideas" },
      ];
    }),
    template(info("scrum-sprint-planning"), (b) => {
      const top = strip("Sprint Goal: why is this Sprint valuable?", 0, 3 * (W + GAP) - GAP, 150);
      const cols = grid(["Product Backlog (candidates)", "Sprint Backlog (selected)", "The plan for the first days"], ["Work"], { y: 190, h: 560 });
      const bottom = [strip("Definition of Done", 790, Math.floor((3 * (W + GAP) - GAP) / 2) - GAP / 2, 220), strip("Capacity this Sprint (people · days off · focus)", 790, Math.floor((3 * (W + GAP) - GAP) / 2) - GAP / 2, 220, Math.floor((3 * (W + GAP) - GAP) / 2) + GAP / 2)];
      b.frames = [top, ...cols, ...bottom];
      b.nodes = [...placeholders([cols[0]!], "#cfe3fb"), ...placeholders([cols[2]!], "#fff6c2")];
    }),
    template(info("scrum-sprint-board"), (b) => {
      const goal = strip("Sprint Goal", 0, 4 * (W + GAP) - GAP, 130);
      const cols = grid(["To do", "In progress", "Done (meets the Definition of Done)"], ["Sprint Backlog"], { y: 170, h: 640 });
      const imp = { id: "impediments", title: "Impediments (for the Scrum Master)", x: 3 * (W + GAP), y: 170, width: W, height: 640 };
      b.frames = [goal, ...cols, imp];
      b.nodes = [...placeholders([cols[0]!], "#cfe3fb"), ...placeholders([imp], "#fbd9d2")];
    }),
    template(info("scrum-sprint-review"), (b) => {
      const rows = grid(["Sprint Goal and outcome", "The Increment (Done items)", "Not Done"], ["Inspect"], { h: 420 }).concat(grid(["Stakeholder feedback", "Product Backlog changes", "Next steps (timeline · budget · marketplace)"], ["Adapt"], { y: 460, h: 420 }));
      b.frames = rows;
      b.nodes = [...placeholders([rows[1]!], "#dcf3e4"), ...placeholders([rows[3]!], "#fff6c2")];
    }),
    template(info("scrum-sprint-retrospective"), (b) => {
      const cols = grid(["What went well", "What could improve", "Definition of Done check"], ["Inspect"], { h: 560 });
      b.frames = [...cols, strip("Improvements for the next Sprint (added to the Sprint Backlog)", 600, 3 * (W + GAP) - GAP, 240)];
      b.nodes = [...placeholders(cols.slice(0, 1), "#dcf3e4"), ...placeholders(cols.slice(1, 2), "#fbd9d2"), ...placeholders([b.frames[3]!], "#cfe3fb")];
    }),
    // ---- Kanban ----
    template(info("kanban-system"), (b) => {
      const cols = ["Options (upstream)", "Committed (WIP 4)", "In progress (WIP 3)", "Verify (WIP 2)", "Ready to deliver", "Delivered"];
      const lanes = grid(cols, ["Expedite (WIP 1)", "Fixed date", "Standard", "Intangible"], { w: 300, h: 190 });
      const policies = grid(cols, ["Explicit policies"], { y: 4 * (190 + GAP), w: 300, h: 160 });
      b.frames = [...lanes, ...policies];
      b.nodes = [...placeholders(lanes.filter((f) => f.id.startsWith("standard--")).slice(0, 2), "#fff6c2"), ...policies.map((f) => ({ id: `${f.id}-policy`, kind: "text" as const, text: "Policy: when a card may enter this column", x: f.x + 16, y: f.y + 50, width: 268, height: 80, color: "#ffffff", frameId: f.id, tags: [], fields: {} }))];
    }),
    template(info("kanban-statik"), (b) => {
      const steps = ["Purpose and fit for purpose", "Sources of dissatisfaction (internal · external)", "Demand analysis (work item types · arrival)", "Capability analysis (lead time · throughput)", "Workflow (knowledge discovery steps)", "Classes of service", "Kanban system design (board · WIP · policies · cadences)", "Rollout and socialisation"];
      b.frames = grid(steps.slice(0, 4), ["STATIK"], { h: 380 }).concat(grid(steps.slice(4), ["STATIK 2"], { y: 420, h: 380 }));
      b.nodes = placeholders(b.frames);
    }),
    template(info("kanban-service-delivery-review"), (b) => {
      b.frames = grid(["Fitness criteria and targets", "Lead time distribution (85th percentile)", "Throughput per week"], ["Review"], { h: 400 }).concat(grid(["Blockers and clustering", "Aging WIP", "Policy changes agreed"], ["Review 2"], { y: 440, h: 400 }));
      b.nodes = [...placeholders([b.frames[3]!], "#fbd9d2"), ...placeholders([b.frames[5]!], "#dcf3e4")];
    }),
    template(info("kanban-flight-levels"), (b) => {
      const width = 4 * (W + GAP) - GAP;
      b.frames = [strip("Flight level 3 · Strategy kanban", 0, width, 240), strip("Flight level 2 · Coordination kanban (end-to-end flow across teams)", 280, width, 280), ...grid(teams.slice(0, 4), ["Flight level 1 · Team kanban"], { y: 600, h: 260 }), strip("Hand-offs, queues and improvement actions", 900, width, 200)];
      b.nodes = placeholders(b.frames.slice(0, 2), "#cfe3fb");
    }),
    // ---- Lean ----
    template(info("lean-a3"), (b) => {
      const left = ["Background", "Current condition", "Goal / target condition", "Root cause analysis"];
      const right = ["Countermeasures", "Plan (who · what · when)", "Follow-up and confirmation"];
      b.frames = [...left.map((t, i) => ({ id: slug(t), title: `${i + 1}. ${t}`, x: 0, y: i * 240, width: 560, height: 200 })), ...right.map((t, i) => ({ id: slug(t), title: `${i + 5}. ${t}`, x: 600, y: i * 320, width: 560, height: 280 }))];
      b.nodes = placeholders([b.frames[1]!, b.frames[3]!, b.frames[4]!]);
    }),
    template(info("lean-pdca"), (b) => {
      const cols = grid(["Plan (hypothesis · measure)", "Do", "Check (result vs expectation)", "Act (adopt · adapt · abandon)"], ["Experiments"], { h: 700, w: 320 });
      b.frames = cols;
      b.nodes = placeholders(cols.slice(0, 1), "#dcf3e4");
    }),
    template(info("lean-vsm"), (b) => {
      const width = 6 * 240 + 80;
      b.frames = [
        strip("Customer and demand: takt time = available time ÷ demand", 0, width, 150),
        strip("Information flow: production control, schedules, signals", 190, width, 160),
        strip("Current state: process boxes (C/T · C/O · uptime · operators) and inventory between them", 390, width, 300),
        strip("Timeline: process time below, waiting time above → lead time and value-added ratio", 730, width, 160),
        strip("Kaizen bursts and the future state", 930, width, 300),
      ];
      const box = (i: number, t: string): BoardNode => ({ id: `proc-${i}`, kind: "shape", text: `${t}\nC/T · C/O · uptime`, x: 40 + i * 240, y: 460, width: 180, height: 120, color: "#dcf3e4", frameId: b.frames[2]!.id, tags: [], fields: {} });
      const inv = (i: number): BoardNode => ({ id: `inv-${i}`, kind: "text", text: "▲ inventory · days", x: 225 + i * 240, y: 600, width: 60, height: 40, color: "#ffffff", frameId: b.frames[2]!.id, tags: [], fields: {} });
      b.nodes = [...["Process 1", "Process 2", "Process 3", "Process 4", "Process 5"].map((t, i) => box(i, t)), ...[0, 1, 2, 3].map(inv), ...placeholders([b.frames[4]!], "#fbd9d2")];
    }),
    template(info("lean-kaizen"), (b) => {
      b.columns = [
        { id: "title", title: "Idea", type: "text" },
        { id: "problem", title: "Problem it solves", type: "text" },
        { id: "owner", title: "Owner", type: "people" },
        { id: "due", title: "Due", type: "date" },
        { id: "state", title: "Status", type: "status" },
      ];
      b.groups = [
        { id: "new", title: "New ideas" },
        { id: "doing", title: "Being tried" },
        { id: "standard", title: "Made standard" },
      ];
    }),
    template(info("lean-hoshin"), (b) => {
      const c = 420;
      b.frames = [
        { id: "breakthrough", title: "Breakthrough objectives (3–5 years)", x: 0, y: c, width: c, height: c },
        { id: "annual", title: "Annual objectives", x: c, y: 2 * c, width: c, height: c },
        { id: "priorities", title: "Top-level improvement priorities", x: 2 * c, y: c, width: c, height: c },
        { id: "targets", title: "Targets to improve", x: c, y: 0, width: c, height: c },
        { id: "owners", title: "Resources / owners", x: 3 * c + GAP, y: c, width: 320, height: c },
        { id: "corr-1", title: "Correlation ● strong ○ weak", x: 0, y: 0, width: c, height: c },
        { id: "corr-2", title: "Correlation", x: 2 * c, y: 0, width: c, height: c },
        { id: "corr-3", title: "Correlation", x: 0, y: 2 * c, width: c, height: c },
        { id: "corr-4", title: "Correlation", x: 2 * c, y: 2 * c, width: c, height: c },
        { id: "centre", title: "Hoshin kanri X-matrix", x: c, y: c, width: c, height: c },
      ];
      b.nodes = placeholders(b.frames.slice(0, 4));
    }),
    // ---- Six Sigma ----
    template(info("six-sigma-dmaic"), (b) => {
      const cols = grid(["Define: charter · VOC · SIPOC", "Measure: data collection plan · baseline · MSA", "Analyze: root causes · hypothesis tests", "Improve: solutions · pilot · FMEA", "Control: control plan · SPC · hand-over"], ["Deliverables"], { h: 560, w: 300 });
      const gates = grid(["Tollgate questions", "Tollgate questions", "Tollgate questions", "Tollgate questions", "Tollgate questions"], ["Tollgate"], { y: 600, h: 220, w: 300 });
      b.frames = [...cols, ...gates];
      b.nodes = [...placeholders(cols, "#cfe3fb"), ...gates.map((f, i) => ({ id: `${f.id}-${i}`, kind: "text" as const, text: ["Is the problem worth solving, and is it scoped?", "Is the measurement system trustworthy? What is the baseline?", "Are the vital few causes proven with data?", "Did the pilot move the CTQ? Are risks addressed?", "Will the gain hold after the team leaves?"][i]!, x: f.x + 16, y: f.y + 50, width: 268, height: 120, color: "#ffffff", frameId: f.id, tags: [], fields: {} }))];
    }),
    template(info("six-sigma-charter"), (b) => {
      b.frames = grid(["Business case", "Problem statement", "Goal statement (SMART)"], ["Charter"], { h: 320 }).concat(grid(["Scope (in · out)", "Team and roles (Champion · Black Belt · Green Belts · Process owner)", "Milestones (D · M · A · I · C dates)"], ["Charter 2"], { y: 360, h: 320 }));
      b.nodes = placeholders(b.frames);
    }),
    template(info("six-sigma-sipoc"), (b) => {
      const cols = grid(["Suppliers", "Inputs", "Process (5–7 high-level steps)", "Outputs", "Customers"], ["SIPOC"], { h: 700, w: 300 });
      b.frames = cols;
      b.nodes = ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"].map((t, i) => ({ id: `step-${i}`, kind: "shape" as const, text: t, x: cols[2]!.x + 40, y: 60 + i * 125, width: 220, height: 90, color: "#dcf3e4", frameId: cols[2]!.id, tags: [], fields: {} }));
    }),
    template(info("six-sigma-voc-ctq"), (b) => {
      const cols = grid(["Voice of the customer (verbatims)", "Key drivers", "Critical to quality (CTQ)", "Specification limits (LSL · USL · target)"], ["CTQ tree"], { h: 720, w: 340 });
      b.frames = cols;
      b.nodes = [...placeholders(cols.slice(0, 1), "#fff6c2"), ...placeholders(cols.slice(1, 2), "#cfe3fb"), ...placeholders(cols.slice(2, 3), "#dcf3e4")];
      b.edges = [{ id: "e-voc", fromId: `${cols[0]!.id}-slot`, toId: `${cols[1]!.id}-slot` }, { id: "e-drv", fromId: `${cols[1]!.id}-slot`, toId: `${cols[2]!.id}-slot` }];
    }),
    template(info("six-sigma-fishbone"), (b) => {
      const head = { id: "effect", title: "Effect (problem statement)", x: 1400, y: 330, width: 300, height: 220 };
      const top = grid(["Man (people)", "Machine", "Method"], ["Causes"], { h: 280, w: 420 });
      const bottom = grid(["Material", "Measurement", "Mother Nature (environment)"], ["Causes 2"], { y: 600, h: 280, w: 420 });
      b.frames = [head, ...top, ...bottom, strip("Five whys on the most likely cause", 920, 1700, 200)];
      b.nodes = placeholders([...top, ...bottom], "#fbd9d2");
      b.edges = [...top, ...bottom].map((f, i) => ({ id: `bone-${i}`, fromId: `${f.id}-slot`, toId: "effect-head" }));
      b.nodes.push({ id: "effect-head", kind: "shape", text: "Effect", x: head.x + 40, y: head.y + 60, width: 220, height: 100, color: "#ffffff", frameId: head.id, tags: [], fields: {} });
    }),
    template(info("six-sigma-fmea"), (b) => {
      b.columns = [
        { id: "title", title: "Process step / function", type: "text" },
        { id: "mode", title: "Potential failure mode", type: "text" },
        { id: "effect", title: "Potential effect", type: "text" },
        { id: "sev", title: "Severity (1–10)", type: "numbers" },
        { id: "cause", title: "Potential cause", type: "text" },
        { id: "occ", title: "Occurrence (1–10)", type: "numbers" },
        { id: "controls", title: "Current controls", type: "text" },
        { id: "det", title: "Detection (1–10)", type: "numbers" },
        { id: "rpn", title: "RPN (S × O × D)", type: "numbers" },
        { id: "action", title: "Recommended action", type: "text" },
        { id: "owner", title: "Owner", type: "people" },
      ];
      b.groups = [{ id: "steps", title: "Process steps" }];
    }),
    template(info("six-sigma-control-plan"), (b) => {
      b.columns = [
        { id: "title", title: "Process step", type: "text" },
        { id: "ctq", title: "Characteristic (CTQ)", type: "text" },
        { id: "spec", title: "Specification / tolerance", type: "text" },
        { id: "method", title: "Measurement method", type: "text" },
        { id: "sample", title: "Sample size · frequency", type: "text" },
        { id: "control", title: "Control method (SPC chart)", type: "text" },
        { id: "reaction", title: "Reaction plan", type: "text" },
        { id: "owner", title: "Owner", type: "people" },
      ];
      b.groups = [{ id: "steps", title: "Controlled steps" }];
    }),
    // ---- Manufacturing ----
    template(info("mfg-sqdc"), (b) => {
      const letters = grid(["Safety", "Quality", "Delivery", "Cost", "People"], ["Day 1–31: green or red"], { h: 300, w: 300 });
      b.frames = [...letters, strip("Actions behind the reds (owner · due · status)", 340, 5 * (300 + GAP) - GAP, 260), strip("Escalations to the next tier", 640, 5 * (300 + GAP) - GAP, 180)];
      b.nodes = [...letters.map((f, i) => ({ id: `${f.id}-letter`, kind: "shape" as const, text: ["S", "Q", "D", "C", "P"][i]!, x: f.x + 90, y: f.y + 70, width: 120, height: 120, color: "#dcf3e4", frameId: f.id, tags: [], fields: {} })), ...placeholders([b.frames[5]!], "#fbd9d2")];
    }),
    template(info("mfg-andon"), (b) => {
      const stations = ["Station 1", "Station 2", "Station 3", "Station 4", "Station 5", "Station 6"];
      const cols = grid(stations, ["Status · reason · response"], { h: 260, w: 260 });
      b.frames = [...cols, strip("Open stops (station · start · reason · who responded · cleared at)", 300, 6 * (260 + GAP) - GAP, 300)];
      b.nodes = cols.map((f, i) => ({ id: `st-${i}`, kind: "shape" as const, text: "Running", x: f.x + 30, y: f.y + 60, width: 200, height: 100, color: i === 3 ? "#fbd9d2" : "#dcf3e4", frameId: f.id, tags: [], fields: {} }));
    }),
    template(info("mfg-oee"), (b) => {
      b.columns = [
        { id: "title", title: "Line · shift", type: "text" },
        { id: "planned", title: "Planned time (min)", type: "numbers" },
        { id: "downtime", title: "Downtime (min)", type: "numbers" },
        { id: "availability", title: "Availability %", type: "numbers" },
        { id: "ideal", title: "Ideal cycle time (s)", type: "numbers" },
        { id: "count", title: "Total count", type: "numbers" },
        { id: "performance", title: "Performance %", type: "numbers" },
        { id: "good", title: "Good count", type: "numbers" },
        { id: "quality", title: "Quality %", type: "numbers" },
        { id: "oee", title: "OEE %", type: "numbers" },
        { id: "loss", title: "Top loss (of the six big losses)", type: "text" },
      ];
      b.groups = [
        { id: "shift-1", title: "Shift 1" },
        { id: "shift-2", title: "Shift 2" },
        { id: "shift-3", title: "Shift 3" },
      ];
    }),
    template(info("mfg-heijunka"), (b) => {
      const pitches = ["07:00", "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30"];
      const products = ["Product A", "Product B", "Product C"];
      const slots = grid(pitches, products, { w: 180, h: 150 });
      b.frames = slots;
      b.nodes = slots.filter((_, i) => i % 3 === 0).map((f) => ({ id: `${f.id}-kanban`, kind: "sticky" as const, text: "Kanban", x: f.x + 20, y: f.y + 40, width: 140, height: 80, color: "#fff6c2", frameId: f.id, tags: [], fields: {} }));
    }),
    template(info("mfg-5s"), (b) => {
      const five = grid(["Sort (seiri)", "Set in order (seiton)", "Shine (seiso)", "Standardise (seiketsu)", "Sustain (shitsuke)"], ["Findings · score 1–5 · photo"], { h: 420, w: 300 });
      b.frames = [...five, strip("Score trend by week", 460, 2 * (300 + GAP) - GAP, 240), strip("Actions (owner · due)", 460, 3 * (300 + GAP) - GAP, 240, 2 * (300 + GAP))];
      b.nodes = placeholders(five, "#fff6c2");
    }),
    template(info("mfg-gemba"), (b) => {
      b.frames = [strip("Route and purpose (what we go to see, which question we hold)", 0, 3 * (W + GAP) - GAP, 150), ...grid(["Observations (facts, not opinions)", "Questions asked (why?)", "Problems surfaced"], ["Walk"], { y: 190, h: 480 }), strip("Follow-ups (owner · due) — with respect for the people doing the work", 710, 3 * (W + GAP) - GAP, 220)];
      b.nodes = [...placeholders([b.frames[1]!], "#fff6c2"), ...placeholders([b.frames[3]!], "#fbd9d2")];
    }),
    ...classTemplates(NOW),
    ...twoChasmsTemplates(NOW),
  ];
}
