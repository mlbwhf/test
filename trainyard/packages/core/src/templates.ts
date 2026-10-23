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

export interface TemplateInfo {
  id: string;
  name: string;
  blurb: string;
  /** Ceremony or cadence the board is used in. */
  event: string;
  tags: ("safe" | "team" | "portfolio" | "risk" | "lean" | "flow" | "class")[];
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
  { id: "pi-planning", name: "PI Planning board", blurb: "Teams × iterations with features, dependencies and capacity.", event: "PI Planning", tags: ["safe"], zones: ["Teams × iterations", "Milestones", "Uncommitted", "Risks (ROAM)"], cardTypes: ["Feature", "Enabler", "Milestone"], mapsTo: "Items and dependencies" },
  { id: "team-breakout", name: "Team breakout", blurb: "Capacity and load per iteration, stories and features, IP iteration, PI objectives, risks, features backlog and planning poker for one team.", event: "PI Planning", tags: ["safe", "team"], zones: ["Capacity · load", "Stories per iteration", "Features per iteration", "IP iteration", "PI objectives (BV · AV)", "Risks", "Features backlog", "Planning poker"], cardTypes: ["Story", "Feature", "Objective", "Risk"], mapsTo: "Items and objectives" },
  { id: "roam", name: "ROAM risk board", blurb: "Resolved, Owned, Accepted, Mitigated.", event: "PI Planning · ART Sync", tags: ["safe", "risk"], zones: ["Inbox", "Resolved", "Owned", "Accepted", "Mitigated"], cardTypes: ["Risk"], mapsTo: "Risks with ROAM state" },
  { id: "program-board", name: "PI planning board", blurb: "The living version of the PI plan (the program board), with dependency strings.", event: "ART Sync", tags: ["safe"], zones: ["Teams × iterations", "Shared services", "Milestones"], cardTypes: ["Feature", "Milestone"], mapsTo: "Items and dependencies" },
  { id: "confidence-vote", name: "Confidence vote", blurb: "Fist of five per team and for the ART.", event: "PI Planning", tags: ["safe", "team"], zones: ["1 · No confidence", "2", "3", "4", "5 · Full confidence"], cardTypes: ["Vote"], mapsTo: "Nothing (record only)" },
  { id: "retrospective", name: "Retrospective", blurb: "Went well, didn't go well, ideas, actions.", event: "Iteration · Inspect & Adapt", tags: ["team"], zones: ["Went well", "Didn't go well", "Ideas", "Actions"], cardTypes: ["Note", "Action"], mapsTo: "Actions as items" },
  { id: "kanban", name: "Team Kanban", blurb: "Columns with WIP limits.", event: "Daily", tags: ["team", "flow"], zones: ["Ready", "In progress", "Review", "Done"], cardTypes: ["Work item"], mapsTo: "Items with status" },
  { id: "inspect-adapt", name: "Inspect & Adapt", blurb: "Problem-solving workshop: fishbone, five whys, improvement backlog.", event: "Inspect & Adapt", tags: ["safe", "team"], zones: ["Problem statement", "Fishbone", "Five whys", "Improvement backlog"], cardTypes: ["Cause", "Improvement"], mapsTo: "Improvement items" },
  { id: "lean-business-case", name: "Epic / Lean business case", blurb: "Hypothesis, MVP, leading indicators, WSJF.", event: "Portfolio Sync", tags: ["portfolio"], zones: ["Hypothesis", "MVP", "Leading indicators", "WSJF"], cardTypes: ["Note"], mapsTo: "Portfolio epic" },
  { id: "okr-tree", name: "OKR tree", blurb: "Objectives with key results and owners.", event: "Quarterly", tags: ["portfolio"], zones: ["Objective", "Key results", "Owner", "Metric link"], cardTypes: ["Row"], mapsTo: "OKRs" },
  { id: "dependency-map", name: "Dependency map", blurb: "Teams as nodes, dependencies as arrows.", event: "ART Sync", tags: ["safe", "risk"], zones: ["Teams", "Arrows", "Legend"], cardTypes: ["Team node"], mapsTo: "Dependencies" },
  { id: "obeya", name: "Obeya wall", blurb: "Strategy, KPIs, projects, problems, actions in one room.", event: "Weekly", tags: ["lean"], zones: ["Strategy", "KPIs", "Projects", "Problems", "Actions", "Calendar"], cardTypes: ["Note", "KPI tile", "Action"], mapsTo: "Actions as items" },
  { id: "story-map", name: "User story map", blurb: "Activities and tasks across the top, stories sliced into releases below.", event: "Backlog refinement · PI Planning prep", tags: ["team"], zones: ["User activities", "User tasks", "Release 1", "Release 2", "Release 3"], cardTypes: ["Activity", "Task", "Story"], mapsTo: "Stories with release as iteration" },
  { id: "value-stream-art", name: "Value stream and ART identification", blurb: "Operational value stream, supporting systems, development value streams with people and locations, and the resulting ART design.", event: "Value Stream Identification workshop", tags: ["safe", "portfolio"], zones: ["Operational value stream", "Supporting systems", "Development value streams", "ART design"], cardTypes: ["Step", "System", "Team (people · location)", "ART"], mapsTo: "Teams and ARTs (structure only)" },
  { id: "portfolio-kanban", name: "Portfolio Kanban", blurb: "Epics from funnel to done, with WIP limits per state and an MVP / persevere split.", event: "Portfolio Sync", tags: ["portfolio", "flow"], zones: ["Funnel", "Reviewing (WIP 4)", "Analyzing (WIP 4)", "Portfolio backlog", "Implementing: MVP (WIP 3)", "Implementing: persevere (WIP 5)", "Done"], cardTypes: ["Epic", "Key result"], mapsTo: "Epics with portfolio state" },
  { id: "art-kanban", name: "ART Kanban", blurb: "Features through the continuous delivery pipeline, with WIP limits.", event: "ART Sync · PO Sync", tags: ["safe", "flow"], zones: ["Funnel", "Analyzing (WIP 2)", "Ready (WIP 6)", "Implementing (WIP 4)", "Validating on staging (WIP 6)", "Deploying to production (WIP 4)", "Releasing (WIP 5)", "Done"], cardTypes: ["Feature", "Enabler"], mapsTo: "Features with state" },
  { id: "portfolio-roadmap", name: "Portfolio roadmap per ART", blurb: "Epics as bars across quarters, one lane per ART, with milestones.", event: "Portfolio Sync · Pre-PI Planning", tags: ["portfolio"], zones: ["Milestones", "ART lanes × quarters"], cardTypes: ["Epic", "Milestone"], mapsTo: "Epics and their target increments" },
  { id: "portfolio-art-board", name: "Portfolio ART planning board", blurb: "Epics and capabilities per ART across iterations, with milestones and cross-ART dependency strings.", event: "Pre-PI Planning · Solution Sync", tags: ["safe", "portfolio"], zones: ["Milestones", "ARTs × iterations"], cardTypes: ["Epic", "Capability", "Milestone"], mapsTo: "Items and dependencies" },
  { id: "solutions-horizon", name: "Solutions by investment horizon", blurb: "Ideas, then horizons 3 to 0: evaluating, emerging, investing, extracting, retiring.", event: "Strategic Portfolio Review", tags: ["portfolio", "lean"], zones: ["Ideas", "Horizon 3 · Evaluating", "Horizon 2 · Emerging", "Horizon 1 · Investing", "Horizon 1 · Extracting", "Horizon 0 · Retiring"], cardTypes: ["Solution", "Idea"], mapsTo: "Epics tagged with a horizon" },
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
      b.frames = [strip("Problem statement", 0, 2 * W + GAP, 160), { id: "fishbone", title: "Root causes (fishbone)", x: 0, y: 200, width: 2 * W + GAP, height: 520 }, { id: "five-whys", title: "Five whys", x: 2 * (W + GAP), y: 0, width: W, height: 720 }, strip("Improvement backlog", 760, 3 * (W + GAP) - GAP, 240)];
      b.nodes = placeholders([b.frames[1]!], "#fbd9d2");
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
    ...classTemplates(NOW),
  ];
}
