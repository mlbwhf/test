// Built-in board templates. Each is a Board with isTemplate set, generated from a short
// spec so the layout stays consistent: frames on a grid, placeholder cards where a frame
// would otherwise be empty, columns and groups for table-shaped templates. Users fork
// them; the originals are regenerated on every start and never edited in place.
//
// These are original layouts of well-known agile practices. SAFe® is a registered
// trademark of Scaled Agile, Inc.; the templates summarise common practice, they do not
// copy any vendor's materials.

import { emptyBoard, type Board, type BoardNode, type Frame } from "./boards.js";

export interface TemplateInfo {
  id: string;
  name: string;
  blurb: string;
  /** Ceremony or cadence the board is used in. */
  event: string;
  tags: ("safe" | "team" | "portfolio" | "risk" | "lean" | "flow")[];
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
  { id: "team-breakout", name: "Team breakout", blurb: "Capacity, stories per iteration and draft objectives for one team.", event: "PI Planning", tags: ["safe", "team"], zones: ["Capacity", "Iterations 1–5", "Draft objectives", "Risks & impediments"], cardTypes: ["Story", "Spike", "Objective"], mapsTo: "Items and objectives" },
  { id: "roam", name: "ROAM risk board", blurb: "Resolved, Owned, Accepted, Mitigated.", event: "PI Planning · ART Sync", tags: ["safe", "risk"], zones: ["Inbox", "Resolved", "Owned", "Accepted", "Mitigated"], cardTypes: ["Risk"], mapsTo: "Risks with ROAM state" },
  { id: "program-board", name: "Program board", blurb: "The living version of the PI plan, with dependency strings.", event: "ART Sync", tags: ["safe"], zones: ["Teams × iterations", "Shared services", "Milestones"], cardTypes: ["Feature", "Milestone"], mapsTo: "Items and dependencies" },
  { id: "confidence-vote", name: "Confidence vote", blurb: "Fist of five per team and for the ART.", event: "PI Planning", tags: ["safe", "team"], zones: ["1 · No confidence", "2", "3", "4", "5 · Full confidence"], cardTypes: ["Vote"], mapsTo: "Nothing (record only)" },
  { id: "retrospective", name: "Retrospective", blurb: "Went well, didn't go well, ideas, actions.", event: "Iteration · Inspect & Adapt", tags: ["team"], zones: ["Went well", "Didn't go well", "Ideas", "Actions"], cardTypes: ["Note", "Action"], mapsTo: "Actions as items" },
  { id: "kanban", name: "Team Kanban", blurb: "Columns with WIP limits.", event: "Daily", tags: ["team", "flow"], zones: ["Ready", "In progress", "Review", "Done"], cardTypes: ["Work item"], mapsTo: "Items with status" },
  { id: "inspect-adapt", name: "Inspect & Adapt", blurb: "Problem-solving workshop: fishbone, five whys, improvement backlog.", event: "Inspect & Adapt", tags: ["safe", "team"], zones: ["Problem statement", "Fishbone", "Five whys", "Improvement backlog"], cardTypes: ["Cause", "Improvement"], mapsTo: "Improvement items" },
  { id: "lean-business-case", name: "Epic / Lean business case", blurb: "Hypothesis, MVP, leading indicators, WSJF.", event: "Portfolio Sync", tags: ["portfolio"], zones: ["Hypothesis", "MVP", "Leading indicators", "WSJF"], cardTypes: ["Note"], mapsTo: "Portfolio epic" },
  { id: "okr-tree", name: "OKR tree", blurb: "Objectives with key results and owners.", event: "Quarterly", tags: ["portfolio"], zones: ["Objective", "Key results", "Owner", "Metric link"], cardTypes: ["Row"], mapsTo: "OKRs" },
  { id: "dependency-map", name: "Dependency map", blurb: "Teams as nodes, dependencies as arrows.", event: "ART Sync", tags: ["safe", "risk"], zones: ["Teams", "Arrows", "Legend"], cardTypes: ["Team node"], mapsTo: "Dependencies" },
  { id: "obeya", name: "Obeya wall", blurb: "Strategy, KPIs, projects, problems, actions in one room.", event: "Weekly", tags: ["lean"], zones: ["Strategy", "KPIs", "Projects", "Problems", "Actions", "Calendar"], cardTypes: ["Note", "KPI tile", "Action"], mapsTo: "Actions as items" },
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
      const cap = strip("Capacity per iteration", 0, rowW, 140);
      const iters = grid(iterations, ["Stories"], { y: 180, h: 520 });
      b.frames = [cap, ...iters, strip("Draft PI objectives", 740, Math.floor(rowW / 2) - GAP / 2, 280), strip("Risks and impediments", 740, Math.floor(rowW / 2) - GAP / 2, 280, Math.floor(rowW / 2) + GAP / 2)];
      b.nodes = placeholders(iters);
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
  ];
}
