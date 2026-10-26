// Class boards: one board per training class (Leading SAFe, SPC, Advanced SPC, POPM, RTE),
// laid out the way trainers run them on a whiteboard: a "Welcome" area (board intro, quick
// agenda and logistics, icebreaker, team and challenge, agreements, parking lot), then one
// frame per lesson holding that lesson's exercises. Exercises are described with a small
// vocabulary (slide, stickies, zones, table, canvas, board, link) and rendered into frames
// and cards, so a class is authored in a few lines and edited like any other board.
//
// Content comes from the trainer's own Miro boards (exported as CSV) and from the planning
// artifacts already in Trainyard: the PI planning simulation uses the PI planning board, the
// ART readiness exercise points at the ART launch canvas. SAFe® is a registered trademark of
// Scaled Agile, Inc.; course names identify the class the trainer runs, the exercises are the
// trainer's.

import { emptyBoard, type Board, type BoardNode, type Frame } from "./boards.js";
import { addActivities, type ActivitySpec, type CoursePack } from "./activities.js";
import { RTE_COURSE } from "./courses/rte.js";
import type { TemplateInfo } from "./templates.js";
import { CANVAS_TYPES, PI_PLANNING_READINESS } from "./canvases.js";
import { EPIC_STATES } from "./portfolio.js";
import { SUCCESS_FACTORS } from "./ainative.js";
import { TEMPLATES as OPERATING_MODELS } from "./frameworks.js";
import { COACH_SYNC_CHECKPOINTS } from "./coachsync.js";
import { POINTS_PER_FULL_TIME } from "./capacity.js";
import { ART_TOPOLOGIES, OVS_TEMPLATE_FIELDS, OVS_TYPES, VS_WORKSHOP_STEPS } from "./valuestreams.js";
import { INSPECT_AND_ADAPT } from "./inspectadapt.js";

export type Exercise =
  /** A read-only instruction card: EXERCISE / DIRECTIONS / ACTIVITY, the way the Miro boards did it. */
  | { kind: "slide"; title: string; body: string; steps?: string[]; minutes?: number }
  /** Blank stickies per lane (participants, teams, days). */
  | { kind: "stickies"; title: string; lanes: string[]; hint?: string; color?: string; rows?: number }
  /** Sorting zones, e.g. Not applicable / Work as-is / Requires rethinking. */
  | { kind: "zones"; title: string; zones: string[]; items?: string[]; color?: string }
  /** A grid of cards; the first row is the header. Empty cells become blank cards. */
  | { kind: "table"; title: string; columns: string[]; rows: string[][]; blankRows?: number }
  /** A canvas with named sections (empathy map, feature canvas). */
  | { kind: "canvas"; title: string; sections: string[]; cols?: number; prompts?: Record<string, string> }
  /** A pointer to a live Trainyard artifact. */
  | { kind: "link"; title: string; body: string; href: string }
  /** The PI planning simulation: ART board, team boards, story backlog, ROAM, vote. */
  | { kind: "pi-planning"; title: string; teams: string[]; iterations?: number; backlog?: { feature: string; stories: [string, number | null][] }[] };

export interface Lesson {
  title: string;
  exercises: Exercise[];
}

export interface ClassSpec {
  id: string;
  name: string;
  short: string;
  blurb: string;
  days: number;
  /** Trainer notes shown in the "Welcome" area. */
  challenge?: string;
  lessons: Lesson[];
  /** Only these parts of the Welcome area, by title start (e.g. ["Icebreaker"]); all when absent. */
  welcome?: string[];
  /** Lessons built from activities (timed exercises with steps and references) instead of `lessons`' exercises. */
  course?: { title: string; activities: ActivitySpec[] }[];
}

// ---- layout ------------------------------------------------------------------------------

const GAP = 40;
const PAD = 30;
const STICKY = 160;
const COLORS = { yellow: "#fff6c2", green: "#dcf3e4", blue: "#cfe3fb", pink: "#fbd9d2", purple: "#e6e0ff", grey: "#eef0f3", teal: "#0b3d4c" };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";

class Builder {
  frames: Frame[] = [];
  nodes: BoardNode[] = [];
  private n = 0;
  id(p: string) {
    return `${p}-${++this.n}`;
  }
  frame(title: string, x: number, y: number, width: number, height: number, parentId?: string): Frame {
    const f: Frame = { id: this.id(slug(title).slice(0, 40)), title, x, y, width, height, ...(parentId ? { parentId } : {}) };
    this.frames.push(f);
    return f;
  }
  node(kind: BoardNode["kind"], text: string, x: number, y: number, width: number, height: number, frameId: string, extra: Partial<BoardNode> = {}): BoardNode {
    const node: BoardNode = { id: this.id(kind), kind, text, x, y, width, height, frameId, tags: [], fields: {}, ...extra };
    this.nodes.push(node);
    return node;
  }
}

/** Renders one exercise at (x, y) inside a lesson frame; returns the size it took. */
function renderExercise(b: Builder, ex: Exercise, x: number, y: number, parentId: string): { w: number; h: number } {
  switch (ex.kind) {
    case "slide": {
      const w = 420;
      const lines = ex.body.length / 48 + (ex.steps?.length ?? 0) * 1.4 + 2;
      const h = Math.max(220, Math.round(lines * 26) + 80);
      const f = b.frame(ex.title + (ex.minutes ? ` · ${ex.minutes} min` : ""), x, y, w, h, parentId);
      b.node("text", ex.body, x + PAD, y + 50, w - 2 * PAD, Math.round(ex.body.length / 48 + 1) * 26 + 20, f.id, { fields: { fontSize: 16 } });
      if (ex.steps?.length) b.node("text", ex.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"), x + PAD, y + 70 + Math.round(ex.body.length / 48 + 1) * 26, w - 2 * PAD, ex.steps.length * 26 + 20, f.id, { fields: { fontSize: 15 } });
      return { w, h };
    }
    case "stickies": {
      const rows = ex.rows ?? 2;
      const laneW = STICKY + 2 * PAD;
      const w = ex.lanes.length * laneW + GAP;
      const h = 70 + rows * (STICKY + 20) + (ex.hint ? 60 : 0) + PAD;
      const f = b.frame(ex.title, x, y, w, h, parentId);
      if (ex.hint) b.node("text", ex.hint, x + PAD, y + 50, w - 2 * PAD, 50, f.id, { fields: { fontSize: 14 } });
      ex.lanes.forEach((lane, i) => {
        const lx = x + GAP / 2 + i * laneW;
        const ly = y + 50 + (ex.hint ? 60 : 0);
        const lf = b.frame(lane, lx, ly, laneW, h - (ly - y) - PAD / 2, f.id);
        for (let r = 0; r < rows; r++) b.node("sticky", "", lx + PAD, ly + 40 + r * (STICKY + 20), STICKY, STICKY, lf.id, { color: ex.color ?? COLORS.yellow, fields: { placeholder: true } });
      });
      return { w, h };
    }
    case "zones": {
      const zoneW = 300;
      const w = ex.zones.length * (zoneW + 20) + 20;
      const h = 420;
      const f = b.frame(ex.title, x, y, w, h, parentId);
      ex.zones.forEach((z, i) => {
        const zf = b.frame(z, x + 20 + i * (zoneW + 20), y + 50, zoneW, h - 70, f.id);
        if (i === 0) (ex.items ?? ["", ""]).forEach((it, k) => b.node("sticky", it, zf.x + 20 + (k % 2) * (STICKY - 20), zf.y + 40 + Math.floor(k / 2) * 120, STICKY - 30, 110, zf.id, { color: ex.color ?? COLORS.yellow, fields: it ? {} : { placeholder: true } }));
      });
      return { w, h };
    }
    case "table": {
      const cellW = ex.columns.length > 4 ? 170 : 230;
      const cellH = 90;
      const rows = [ex.columns, ...ex.rows, ...Array.from({ length: ex.blankRows ?? 0 }, () => ex.columns.map(() => ""))];
      const w = ex.columns.length * (cellW + 8) + 2 * PAD;
      const h = rows.length * (cellH + 8) + 60 + PAD;
      const f = b.frame(ex.title, x, y, w, h, parentId);
      rows.forEach((r, ri) =>
        ex.columns.forEach((_, ci) => {
          const text = r[ci] ?? "";
          b.node("card", text, x + PAD + ci * (cellW + 8), y + 50 + ri * (cellH + 8), cellW, cellH, f.id, { color: ri === 0 ? COLORS.teal : text ? COLORS.grey : "#ffffff", fields: ri === 0 ? { fontColor: "#ffffff", fontSize: 14 } : text ? { fontSize: 13 } : { placeholder: true } });
        }),
      );
      return { w, h };
    }
    case "canvas": {
      const cols = ex.cols ?? 3;
      const secW = 300;
      const secH = 260;
      const rowsN = Math.ceil(ex.sections.length / cols);
      const w = cols * (secW + 16) + 2 * PAD;
      const h = rowsN * (secH + 16) + 60 + PAD;
      const f = b.frame(ex.title, x, y, w, h, parentId);
      ex.sections.forEach((s, i) => {
        const sf = b.frame(s, x + PAD + (i % cols) * (secW + 16), y + 50 + Math.floor(i / cols) * (secH + 16), secW, secH, f.id);
        const prompt = ex.prompts?.[s];
        if (prompt) b.node("text", prompt, sf.x + 12, sf.y + 36, secW - 24, 70, sf.id, { fields: { fontSize: 12 } });
        b.node("sticky", "", sf.x + 20, sf.y + (prompt ? 110 : 44), 130, 110, sf.id, { color: COLORS.yellow, fields: { placeholder: true } });
      });
      return { w, h };
    }
    case "link": {
      const w = 420;
      const h = 200;
      const f = b.frame(ex.title, x, y, w, h, parentId);
      b.node("card", `${ex.body}\n\nOpen ${ex.href} ↗`, x + PAD, y + 50, w - 2 * PAD, h - 50 - PAD, f.id, { color: COLORS.blue, fields: { link: ex.href, fontSize: 15 } });
      return { w, h };
    }
    case "pi-planning": {
      const its = ex.iterations ?? 5;
      const cellW = 220;
      const cellH = 150;
      const colX = (i: number) => x + PAD + 200 + i * (cellW + 10);
      const artH = 60 + (ex.teams.length + 1) * (cellH + 10) + PAD;
      const artW = 200 + (its + 1) * (cellW + 10) + 2 * PAD;
      const f = b.frame(ex.title, x, y, artW + GAP + 1100, 0, parentId);
      // ART / milestone planning board: teams × iterations, milestones on top, "next PI" last.
      const art = b.frame("ART / Milestone planning board", x, y + 50, artW, artH, f.id);
      const cols = [...Array.from({ length: its }, (_, i) => `Iteration ${i + 1}`), "Next PI"];
      cols.forEach((c, i) => b.node("card", c, colX(i), art.y + 40, cellW, 40, art.id, { color: COLORS.teal, fields: { fontColor: "#fff", fontSize: 14 } }));
      ["Milestones & events", ...ex.teams].forEach((row, r) => {
        const ry = art.y + 90 + r * (cellH + 10);
        b.node("card", row, x + PAD, ry, 180, cellH, art.id, { color: r === 0 ? COLORS.purple : COLORS.grey, fields: { fontSize: 14 } });
        cols.forEach((_, i) => b.node("sticky", "", colX(i), ry, cellW, cellH, art.id, { color: r === 0 ? COLORS.purple : "#ffffff", fields: { placeholder: true } }));
      });
      // Team boards side by side under the ART board.
      let ty = art.y + artH + GAP;
      const teamW = Math.min(artW, (its + 1) * (cellW + 10) + 2 * PAD);
      ex.teams.forEach((team) => {
        const tb = b.frame(`${team} board`, x, ty, teamW, 60 + 4 * (cellH + 10) + PAD, f.id);
        cols.forEach((c, i) => b.node("card", i < its ? `${c} · capacity __ · load __` : "Next PI", x + PAD + i * (cellW + 10), tb.y + 40, cellW, 40, tb.id, { color: COLORS.teal, fields: { fontColor: "#fff", fontSize: 12 } }));
        ["Stories", "Features", "Risks · dependencies"].forEach((row, r) => cols.forEach((_, i) => b.node("sticky", r === 0 && i === 0 ? "" : "", x + PAD + i * (cellW + 10), tb.y + 90 + r * (cellH + 10), cellW, cellH, tb.id, { color: r === 0 ? COLORS.yellow : r === 1 ? COLORS.blue : COLORS.pink, fields: { placeholder: true, row } })));
        b.node("card", "PI objectives (BV · AV): committed · uncommitted", x + PAD, tb.y + 90 + 3 * (cellH + 10), teamW - 2 * PAD, cellH, tb.id, { color: COLORS.green, fields: { fontSize: 14 } });
        ty += tb.height + GAP;
      });
      // The backlog of story cards, grouped by feature, to the right.
      const bx = x + artW + GAP;
      let by = y + 50;
      const backlog = ex.backlog ?? [];
      const backlogFrame = b.frame("Story backlog (pull into your team board)", bx, by, 1100, 0, f.id);
      by += 50;
      backlog.forEach((feat) => {
        b.node("card", feat.feature, bx + PAD, by, 1100 - 2 * PAD, 48, backlogFrame.id, { color: COLORS.teal, fields: { fontColor: "#fff", fontSize: 15 } });
        by += 58;
        feat.stories.forEach(([s, pts], i) => {
          const cx = bx + PAD + (i % 5) * 208;
          if (i > 0 && i % 5 === 0) by += 140;
          b.node("card", s, cx, by, 198, 130, backlogFrame.id, { color: COLORS.yellow, fields: { ...(pts ? { storyPoints: pts } : {}), feature: feat.feature, fontSize: 12 } });
        });
        by += 150;
      });
      backlogFrame.height = by - backlogFrame.y + PAD;
      // Coach sync, ROAM and the vote.
      const side = b.frame("Coach sync questions", bx, by + GAP, 520, 320, f.id);
      b.node("text", ["Have you identified the capacity for each iteration of the PI?", "Have you identified most of the stories for the first two iterations and begun estimating?", "Have you begun resolving dependencies with other teams?", "Are you discussing trade-offs and conflicting priorities with your Business Owners?", "Have you identified any ART PI risks?", "Will you be ready to write PI objectives in the next 15 minutes?"].map((q, i) => `${i + 1}. ${q}`).join("\n"), bx + PAD, side.y + 46, 520 - 2 * PAD, 260, side.id, { fields: { fontSize: 13 } });
      const roam = b.frame("Program risks (ROAM)", bx + 560, by + GAP, 540, 320, f.id);
      ["Resolved", "Owned", "Accepted", "Mitigated"].forEach((z, i) => {
        const zf = b.frame(z, roam.x + 15 + i * 128, roam.y + 44, 120, 260, roam.id);
        if (i === 0) b.node("sticky", "", zf.x + 10, zf.y + 36, 100, 100, zf.id, { color: COLORS.pink, fields: { placeholder: true } });
      });
      const voteY = by + GAP + 320 + GAP;
      const vote = b.frame("Confidence vote · fist of five", bx, voteY, 1100, 220, f.id);
      ["1 · No confidence", "2", "3", "4", "5 · Full confidence"].forEach((z, i) => b.frame(z, vote.x + 20 + i * 212, vote.y + 44, 200, 150, vote.id));
      const h = Math.max(ty, voteY + 220) - y + PAD;
      f.height = h;
      return { w: f.width, h };
    }
  }
}

/** The "Welcome" area every class opens with. */
// The welcome area, in the order a class starts: how to work on the board, the agenda and the
// day's logistics, an icebreaker, the team and its challenge, the working agreements and the
// parking lot, then the start.
function startHere(b: Builder, spec: ClassSpec, x: number, y: number): number {
  const strip = b.frame("Welcome", x, y, 2560, 0);
  // Rows about as wide as a lesson, so the welcome area fits a screen when its tab is open.
  const MAX_W = 2000;
  let cx = x + PAD;
  let cy = y + 110;
  let rowH = 0;
  let widest = 0;
  const put = (ex: Exercise) => {
    const size = renderExercise(new Builder(), ex, 0, 0, "p");
    if (cx > x + PAD && cx + size.w > x + MAX_W) {
      cx = x + PAD;
      cy += rowH + GAP;
      rowH = 0;
    }
    const r = renderExercise(b, ex, cx, cy, strip.id);
    cx += r.w + GAP;
    rowH = Math.max(rowH, r.h);
    widest = Math.max(widest, cx - x);
    return r;
  };
  const welcome: Exercise[] = [
    { kind: "slide", title: "Board intro: how to work here", body: "This board is an infinite shared canvas, like a whiteboard: everyone works on it at the same time, and most of the class happens here.", steps: ["Undo: Ctrl+Z (Cmd+Z on a Mac) undoes your most recent edit", "Zoom: the + and − buttons, the mouse wheel with Ctrl, or pinch; Fit shows the whole lesson", "Move: drag the background, or two fingers on a touch screen", "Tools: + Card adds a sticky note; double-click or double-tap a card to write; drag to move it; Connect draws an arrow", "Lessons: each lesson has its own tab at the top; Full screen hides everything else"] },
    { kind: "table", title: "Quick agenda", columns: ["Lesson", "Day", "Status"], rows: spec.lessons.map((l, i) => [`${i + 1}. ${l.title}`, `Day ${Math.min(spec.days, Math.floor((i * spec.days) / spec.lessons.length) + 1)}`, i === 0 ? "Now" : ""]) },
    { kind: "table", title: "Logistics for the day", columns: ["What", "When or where"], rows: [["Start", "9:00"], ["Morning break", "10:30 (15 min)"], ["Lunch", "12:15 (45 min)"], ["Afternoon break", "14:30 (15 min)"], ["Close and feedback", "16:45"], ["Video call link", ""], ["Breakout rooms", "Group A to E: links on this board"], ["Trainer contact", ""]] },
    { kind: "stickies", title: "Icebreaker: introduce yourself", lanes: ["Name and role", "Where I join from", "What I want from this class", "Something people would not guess about me"], hint: "One sticky per column; we read them out in turn.", rows: 4 },
    { kind: "stickies", title: "Presenting our team & challenge", lanes: ["The awesome team", "Our challenge"], hint: spec.challenge ?? "Use this to describe your challenge: what we are solving, and what we want by the end of the class.", rows: 3 },
    { kind: "slide", title: "Remote working agreements", body: "How we work together for the next days.", steps: ["Respect your humanness", "One conversation at a time", "Assume positive intent", "Be present", "Respect the timeboxes", "[Add additional working agreements]"] },
    { kind: "zones", title: "Parking lot", zones: ["Questions", "Closed · answered", "Open space · keep on the radar", "On hold · consider later", "Canceled · do not consider"], color: COLORS.blue },
    { kind: "slide", title: "Let's get started!", body: `${spec.name}: ${spec.lessons.length} lessons over ${spec.days} day${spec.days > 1 ? "s" : ""}. Open the Lesson 1 tab.` },
  ];
  for (const ex of welcome) if (!spec.welcome || spec.welcome.some((w) => ex.title.startsWith(w))) put(ex);
  const h = cy + rowH - y + PAD;
  strip.height = h;
  strip.width = widest;
  return h;
}

/** Builds the class board: start strip, then one frame per lesson with its exercises in rows. */
export function classBoard(spec: ClassSpec, now = "2026-01-01T00:00:00.000Z"): Board {
  const b = new Builder();
  let y = 0;
  y += startHere(b, spec, 0, 0) + GAP * 2;
  const MAX_W = 2600;
  spec.lessons.forEach((lesson, li) => {
    const lf = b.frame(`Lesson ${li + 1}: ${lesson.title}`, 0, y, MAX_W, 0);
    let cx = PAD;
    let cy = y + 110;
    let rowH = 0;
    if (!lesson.exercises.length) {
      const r = renderExercise(b, { kind: "stickies", title: "Notes and questions from this lesson", lanes: ["Insights", "Questions"], rows: 2 }, cx, cy, lf.id);
      rowH = r.h;
      cy += rowH;
    }
    for (const ex of lesson.exercises) {
      // Measure by rendering into a scratch builder first, so wide exercises wrap to a new row.
      const probe = new Builder();
      const size = renderExercise(probe, ex, 0, 0, "p");
      if (cx > PAD && cx + size.w > MAX_W) {
        cx = PAD;
        cy += rowH + GAP;
        rowH = 0;
      }
      const r = renderExercise(b, ex, cx, cy, lf.id);
      cx += r.w + GAP;
      rowH = Math.max(rowH, r.h);
      if (r.w > MAX_W - 2 * PAD) lf.width = Math.max(lf.width, r.w + 2 * PAD);
    }
    lf.height = cy + rowH - y + PAD;
    y += lf.height + GAP * 2;
  });
  const board = emptyBoard(`tpl-builtin-class-${spec.id}`, spec.name, { system: "trainyard", externalId: `builtin:class-${spec.id}`, importedAt: now });
  board.isTemplate = true;
  board.frames = b.frames;
  board.nodes = b.nodes;
  board.fields = { class: spec.id, days: spec.days, lessons: spec.lessons.length };
  if (spec.course) fillCourse(board, spec.course);
  return board;
}

/**
 * Puts a course's activities into its lessons: each lesson holds exactly its exercises (not the
 * notes exercise an empty lesson gets), stacked under the Welcome area and grown to fit.
 */
function fillCourse(b: Board, course: { title: string; activities: ActivitySpec[] }[]) {
  const lessons = b.frames.filter((f) => !f.parentId && /^Lesson\s+\d+/i.test(f.title)).sort((x, y) => x.y - y.y);
  const drop = new Set(b.frames.filter((f) => lessons.some((l) => isInside(b, f, l.id))).map((f) => f.id));
  b.frames = b.frames.filter((f) => !drop.has(f.id));
  b.nodes = b.nodes.filter((n) => !n.frameId || !drop.has(n.frameId));
  const welcome = b.frames.filter((f) => !f.parentId && !lessons.includes(f));
  let y = Math.max(0, ...welcome.map((f) => f.y + f.height)) + 80;
  for (const l of lessons) {
    l.y = y;
    l.height = 160;
    y += l.height + 80;
  }
  lessons.forEach((l, i) => addActivities(b, l.id, course[i]?.activities ?? [], `${l.id}-x`));
}

function isInside(b: Board, f: Frame, ancestor: string): boolean {
  for (let p = f.parentId; p; p = b.frames.find((x) => x.id === p)?.parentId) if (p === ancestor) return true;
  return false;
}

/** A trainer's own course as a class template in their workspace: the full Welcome area, then its lessons. */
export function courseBoard(pack: CoursePack, id: string, now: string): Board {
  const b = classBoard({ id: "course", name: pack.name, short: pack.name, blurb: "", days: 1, lessons: pack.lessons.map((l) => ({ title: l.title, exercises: [] })), course: pack.lessons }, now);
  b.id = id;
  b.origin = { system: "json", externalId: "course-pack", importedAt: now };
  b.fields = { class: "custom", source: "course", lessons: pack.lessons.length };
  return b;
}




export function classInfo(spec: ClassSpec): TemplateInfo {
  return {
    id: `class-${spec.id}`,
    name: spec.name,
    blurb: spec.blurb,
    event: `${spec.days}-day class`,
    method: "safe",
    tags: ["class", "safe"],
    zones: ["Welcome", ...spec.lessons.map((l, i) => `Lesson ${i + 1}: ${l.title}`)],
    cardTypes: ["Sticky", "Slide", "Story", "Vote"],
    mapsTo: "Nothing (a class is run, not synced)",
  };
}

// ---- shared exercises --------------------------------------------------------------------

/** The autonomous-vehicle backlog the PI planning simulation plans against. */
const VEHICLE_BACKLOG: NonNullable<Extract<Exercise, { kind: "pi-planning" }>["backlog"]> = [
  {
    feature: "#1 Follow unmarked, virtual roads",
    stories: [
      ["As vehicle control, I can be encoded with the GPS coordinates for virtual roads at an installation, so that they are included in route planning.", null],
      ["As vehicle control, I can use the virtual roads for route planning, so that I can use them when driving to destinations.", null],
      ["As vehicle control, I can be encoded with the GPS locations where cross traffic is likely, so that the vehicle treats those locations like other intersections.", 3],
      ["As vehicle control, I can be encoded with virtual road locations where a stop is required, so that the vehicle treats them as stop signs.", 3],
      ["As vehicle control, I can be encoded with GPS hard boundaries, so that I never let the vehicle enter those areas.", 3],
      ["As vehicle control, I can include virtual stop signs in route planning, so that I avoid routes with many stops.", 5],
      ["As vehicle control, I can ensure I stop at all virtual stop signs, so that I avoid accidents at those locations.", 5],
      ["As vehicle control, I can use hard boundaries in route planning, so that I avoid large detours.", 5],
      ["As a vehicle control engineer, I can encode virtual data for the test track, so that I can validate the vehicle follows virtual routes.", 3],
    ],
  },
  {
    feature: "#2 Request delivery",
    stories: [
      ["As a mobile app requestor, I can enter the pickup location, so that the vehicle knows where to retrieve the cargo.", null],
      ["As a mobile app supplier, I can be notified of the items in the request, so that I can prepare them before the vehicle arrives.", null],
      ["As a mobile app requestor, I can enter the delivery location as an address, so that the vehicle knows where to deliver.", 1],
      ["As a mobile app requestor, I can enter the items I am requesting, so that the vehicle can notify my supplier.", 2],
      ["As a mobile app requestor, I can enter the delivery location as a GPS coordinate, for locations with no address.", 3],
      ["As a mobile app supplier, I can be notified of the anticipated arrival time, so that I have the cargo ready. (needs GPS expertise)", 3],
      ["As a mobile app requestor, I can be told an approximate travel time, so that I plan my pickup. (needs GPS expertise)", 3],
      ["As a mobile app requestor, I can be notified if a request is canceled, so that I am not waiting for nothing.", 5],
      ["As a mobile app supplier, I can cancel a request if I lack the supplies, so that the vehicle makes no useless trip.", 3],
      ["As a mobile app requestor, I can save entire orders, so that I can order with a single click.", 5],
      ["As a mobile app requestor, I can save my previous delivery locations, so that I do not re-enter them.", 2],
    ],
  },
  {
    feature: "#3 Parallel park",
    stories: [
      ["As sensor management, I can detect parallel parking locations with lines when adjacent spaces are empty, so that I park using lines and a curb.", null],
      ["As vehicle control, I can parallel park using only parking lines and the curb as my guide.", null],
      ["As sensor management, I can detect an appropriate parallel parking location between parked vehicles.", 3],
      ["As vehicle control, I can center the vehicle between the lines of my parking space, so that I do not block neighbours.", 3],
      ["As vehicle control, I can adjust centering if one vehicle parked too close to our shared line.", 2],
      ["As sensor management, I can detect a parking location where lines and other vehicles are involved.", 3],
      ["As vehicle control, I can put the vehicle into park and turn it off after parking, so that the requester retrieves their items.", 3],
      ["As vehicle control, I can detect a red curb, so that I only park in legal locations.", 1],
      ["As sensor management, I can detect when a space would straddle a parking line, so that I exclude it.", 3],
      ["As vehicle control, I can parallel park at a curb with no lines or vehicles.", 2],
      ["As a vehicle test track, I can be configured with lines and mock vehicles, so that we validate parking scenarios.", 2],
    ],
  },
];

const EMPATHY_MAP: Exercise = {
  kind: "canvas",
  title: "Empathy map canvas",
  cols: 4,
  sections: ["1 · Who are we empathizing with?", "2 · What do they need to do?", "3 · What do they see?", "4 · What do they say?", "5 · What do they do?", "6 · What do they hear?", "7 · What do they think and feel? Pains", "7 · What do they think and feel? Gains"],
  prompts: {
    "1 · Who are we empathizing with?": "Who is the person we want to understand? What situation are they in? What is their role?",
    "2 · What do they need to do?": "What jobs do they want done? What decisions must they make? How will we know they succeeded?",
    "3 · What do they see?": "In the marketplace, in their environment, others saying and doing, what they watch and read.",
    "4 · What do they say?": "What have we heard them say? What can we imagine them saying?",
    "5 · What do they do?": "What do they do today? What behaviour have we observed?",
    "6 · What do they hear?": "From friends, colleagues, second-hand.",
    "7 · What do they think and feel? Pains": "Fears, frustrations, anxieties.",
    "7 · What do they think and feel? Gains": "Wants, needs, hopes, dreams.",
  },
};

const FEATURE_CANVAS: Exercise = { kind: "table", title: "Features: benefit hypothesis and acceptance criteria", columns: ["", "Feature 1", "Feature 2", "Feature 3"], rows: [["Title", "", "", ""], ["Benefit hypothesis", "", "", ""], ["Acceptance criteria", "", "", ""]] };

const WSJF_TABLE: Exercise = { kind: "table", title: "WSJF: Cost of Delay ÷ job size", columns: ["Feature", "User-business value", "Time criticality", "RR · OE value", "Cost of delay", "Job size", "WSJF"], rows: [], blankRows: 4 };

const WSJF_EXAMPLE: Exercise = {
  kind: "table",
  title: "WSJF worked example (Fibonacci)",
  columns: ["Item", "User-business value", "Time criticality", "RR · OE", "CoD", "Duration", "WSJF"],
  rows: [
    ["Standard, scalable processes", "1", "1", "5", "7", "8", "0.8"],
    ["Customer satisfaction", "3", "3", "1", "7", "2", "3.5"],
    ["Product / UX design CoE", "5", "2", "2", "9", "1", "9"],
    ["Enterprise agility enablement", "2", "5", "3", "10", "5", "2"],
  ],
};

// Epics: duration is the epic's cost normalised to the cheapest one (cost ÷ lowest cost), so
// WSJF = cost of delay ÷ normalised cost. The same rule ranks epics on the Portfolio page.
const WSJF_EPIC_EXAMPLE: Exercise = {
  kind: "table",
  title: "WSJF for epics: cost of delay ÷ normalised cost",
  columns: ["Epic", "User-business value", "Time criticality", "RR · OE", "CoD", "Cost", "Normalised cost", "WSJF"],
  rows: [
    ["Self-service onboarding", "5", "3", "2", "10", "0.4M", "1.0", "10"],
    ["Partner API", "13", "8", "3", "24", "1.2M", "3.0", "8"],
    ["Fraud scoring", "8", "13", "13", "34", "3.4M", "8.5", "4"],
    ["Data platform", "3", "1", "20", "24", "4.8M", "12.0", "2"],
  ],
};

// Built from PI_PLANNING_READINESS, the same list the ART launch canvas scores.
const READINESS_CHECKLIST: Exercise[] = [
  {
    kind: "table",
    title: "PI planning readiness: must it be in place to launch? Y · N · D(epends)",
    columns: ["Area", "Question", "Needed or desirable", "Y / D / N"],
    rows: PI_PLANNING_READINESS.map((r) => [r.text, r.question, r.tier === "needed" ? "Needed" : "Desirable", ""]),
  },
];

const LEADING_SAFE_LESSONS: Record<2 | 4 | 5, Lesson> = {
  2: {
    title: "Building a Foundation with Mindset, Values, and Principles",
    exercises: [
      { kind: "zones", title: "Agile Manifesto principles in your context", zones: ["Not applicable", "Work as-is", "Requires rethinking"], items: ["1 · Satisfy the customer through early and continuous delivery", "2 · Welcome changing requirements", "3 · Deliver working software frequently", "4 · Business people and developers work together daily", "5 · Build projects around motivated individuals", "6 · Face-to-face conversation", "7 · Working software is the primary measure", "8 · Sustainable pace", "9 · Technical excellence", "10 · Simplicity", "11 · Self-organizing teams", "12 · Reflect and adjust"], color: COLORS.purple },
      { kind: "stickies", title: "Your value stream and its delays", lanes: ["Team A · steps", "Team A · delays", "Team B · steps", "Team B · delays", "Team C · steps", "Team C · delays"], hint: "Write the steps that lead to value for one solution, left to right; under them, where work waits and why. Example: Apply → Gather info → Determine eligibility → Release decision → Process payments; delay: waiting on information from external partners (28 days).", rows: 3, color: COLORS.blue },
      { kind: "table", title: "Centralize or decentralize? Score each decision", columns: ["Decision", "Frequent? Y=2 N=0", "Time-critical? Y=2 N=0", "Economies of scale? Y=0 N=2", "Total (0–2 centralize · 4–6 decentralize)"], rows: [["Define PI dates", "0", "1", "0", "1 · centralize"], ["Team backlog refinement", "2", "2", "2", "6 · decentralize"]], blankRows: 3 },
    ],
  },
  4: {
    title: "Building Solutions with Agile Product Delivery",
    exercises: [
      { kind: "slide", title: "Empathy map", body: "In your group, select a user or customer of a product or service from your context and build an empathy map.", steps: ["Follow the sequence of numbers and fill each section", "One sticky per observation", "Be prepared to share with the class"], minutes: 20 },
      EMPATHY_MAP,
      FEATURE_CANVAS,
      WSJF_TABLE,
      { kind: "slide", title: "PI Planning simulation", body: "Three teams plan one PI for the autonomous delivery vehicle. Teams pull stories for their features into iterations against capacity (e.g. 7 people × 8 days = 56, minus 8 for the IP iteration = 48), find dependencies on other teams, raise risks, and write PI objectives. The ART reviews the consolidated plan and votes.", steps: ["Define the PI scope: priorities, outcomes, owners, estimation approach", "Iteration breakdown per team: stories, capacity, dependencies, risks", "Coach sync at the half: answer the six questions", "ART review: dependencies, ROAM, PI objectives, confidence vote"], minutes: 90 },
      { kind: "pi-planning", title: "PI Planning simulation · autonomous delivery vehicle", teams: ["Team A · Vehicle control", "Team B · Mobile app", "Team C · Sensor management"], backlog: VEHICLE_BACKLOG },
      { kind: "link", title: "Run it on the real board", body: "The same simulation on the live PI planning board: cards move, dependencies draw, the program board fills, and the confidence vote is recorded.", href: "/templates" },
    ],
  },
  5: {
    title: "Exploring Lean Portfolio Management",
    exercises: [
      { kind: "table", title: "Toward Lean Portfolio Management", columns: ["Question", "Answer"], rows: [["Steps to create a portfolio Kanban", ""], ["Impediments to creating one", ""], ["3–5 people to form a guiding coalition", ""]] },
      WSJF_EXAMPLE,
      { kind: "link", title: "Portfolio Kanban and canvases", body: "Portfolio Kanban with WIP limits, the Portfolio canvas, SWOT → TOWS → vision, epic hypothesis and Lean business case are live in Trainyard.", href: "/portfolio" },
    ],
  },
};

const DESIGN_SPRINT: Exercise[] = [
  { kind: "slide", title: "Expert talks & HMWs", body: "Listen as the experts in the room are interviewed. As they talk, write How-Might-We statements, one per sticky. Example: the expert says 'we have a problem with the checkout flow'; you write 'HMW improve our checkout flow?'", steps: ["One HMW per sticky, the more the better", "Place all HMWs on the common board at the end"], minutes: 45 },
  { kind: "stickies", title: "Independent work area · HMWs", lanes: ["Participant 1", "Participant 2", "Participant 3", "Participant 4", "Participant 5", "Participant 6"], rows: 3 },
  { kind: "zones", title: "HMW board: categorise and vote (2 dots each, decider 4)", zones: ["Topic 1", "Topic 2", "Topic 3", "Topic 4"] },
  { kind: "slide", title: "Drawing the map", body: "The map presents a user's flow through the product or service, so the team focuses on one key moment of the journey.", steps: ["Write the actors on the left", "Write the ideal end state on the right", "Fill in the steps between", "Add HMWs to the map and circle the focus area"], minutes: 45 },
  { kind: "table", title: "Map", columns: ["Actors", "Stage 1", "Stage 2", "Stage 3", "End goal"], rows: [["Actor 1", "", "", "", ""], ["Actor 2", "", "", "", ""], ["Actor 3", "", "", "", ""]] },
  { kind: "slide", title: "Long term goal", body: "A very optimistic view of the world where the solution is a complete success. What will the ideal world look like in two years? Start with 'In 2 years time…'. Example: 'In 2 years time, we will be the leading POS solution in Europe.'", steps: ["Write 2–3 versions, one per sticky", "Vote on the most inspiring"], minutes: 10 },
  { kind: "stickies", title: "Long term goals", lanes: ["Participant 1", "Participant 2", "Participant 3", "Decider"], rows: 2, color: COLORS.green },
  { kind: "slide", title: "Sprint questions", body: "Now get pessimistic: what could stop us from reaching the long-term goal? Start with 'Can we…'. Example: 'Can we replace the need for a washing machine at home?'", steps: ["Write 2–3 questions, one per sticky", "Vote on the most relevant"], minutes: 10 },
  { kind: "stickies", title: "Sprint questions", lanes: ["Participant 1", "Participant 2", "Participant 3", "Decider"], rows: 2, color: COLORS.pink },
  { kind: "slide", title: "Lightning demos", body: "Search for relevant examples of how others approached the same issue. Write the big idea, as in: 'Slack · big idea: teach users the interface by chatting with a bot'. Add screenshots.", minutes: 30 },
  { kind: "stickies", title: "Lightning demos", lanes: ["Participant 1", "Participant 2", "Participant 3", "Participant 4"], rows: 2, color: COLORS.blue },
  { kind: "slide", title: "Concept sketching (offline)", body: "Not about pretty things; about ideas. Three exercises, then a final sketch sent to the facilitator.", steps: ["Notes & ideas: copy the goal, the sprint questions, your favourite demos; rough thoughts", "Crazy 8s: fold an A4 into 8; one minute per box", "Concept sketch: self-explanatory, anonymous, ugly is okay, words matter, catchy title"], minutes: 120 },
  { kind: "zones", title: "Sketches · vote with dots, questions on stickies", zones: ["Sketch A", "Sketch B", "Sketch C", "Sketch D"] },
  { kind: "stickies", title: "Favourite concept and reasons", lanes: ["Participant 1", "Participant 2", "Participant 3", "Participant 4"], hint: "Name of concept · reason 1 · reason 2 · reason 3", rows: 1 },
  { kind: "slide", title: "User test flow", body: "Write a simple story in six steps: a realistic entry point ('user finds out about this'), an ideal ending ('user managed to use it successfully'), and the steps between.", minutes: 30 },
  { kind: "table", title: "User test flow matrix", columns: ["", "1", "2", "3", "4", "5", "6"], rows: [["Participant 1", "", "", "", "", "", ""], ["Participant 2", "", "", "", "", "", ""], ["Participant 3", "", "", "", "", "", ""], ["Decider", "", "", "", "", "", ""]] },
  { kind: "slide", title: "Storyboarding", body: "Eight boxes, filled with the screens and elements we already have from the sketches, then the gaps. This is what goes to the prototyping team.", minutes: 60 },
  { kind: "table", title: "Storyboard", columns: ["1", "2", "3", "4"], rows: [["", "", "", ""], ["", "", "", ""]] },
];

const CARS_SCENARIO: Exercise[] = [
  { kind: "slide", title: "CARS scenario: a company on the move", body: "Welcome to CARS, a leader in mobility solutions: classic cars, electric models, scooters and self-driving vehicles. Diverse products from daily commutes to off-road. Global presence. Innovation at the core. Growth through strategic acquisitions. A workforce of 20,000 transforming mobility." },
  { kind: "slide", title: "CARS: SAFe transformation goals", body: "Improve alignment and collaboration across the company with a shared understanding of goals and priorities, breaking down silos. Enhance communication with one cohesive message from leadership. Increase quality and agility in product development: a continuous delivery pipeline and relentless improvement instead of cutting corners." },
  { kind: "slide", title: "CARS: the problems to overcome", body: "Dysfunctional leadership with conflicting priorities and autocratic, risk-averse styles; little psychological safety among executives. A rigid financial structure: portfolio spend committed annually with no flexibility. A portfolio structure that creates silos: each senior vice president owns their own portfolio." },
];

const RAW_CLASSES: ClassSpec[] = [
  {
    id: "leading-safe",
    name: "Leading SAFe",
    short: "LS",
    blurb: "Two days: business agility, the mindset and principles, team and technical agility, Agile Product Delivery with a PI planning simulation, Lean Portfolio Management, leading the change.",
    days: 2,
    challenge: "We're running this class to solve: problem #1, issue #2, concern #3. By the end: outcome #1, outcome #2, outcome #3.",
    lessons: [
      { title: "Thriving in the Digital Age with Business Agility", exercises: [{ kind: "stickies", title: "What brought you here", lanes: ["What I want from the class", "A challenge I bring"], hint: "One sticky each. Examples from past classes: 'How to square line management with multidisciplinary teams', 'Can Agile and fixed-price contracts be friends?', 'How to reduce the overhead of scaled agile'.", rows: 3 }, { kind: "zones", title: "Potential for improvement × ease of implementation", zones: ["High potential · easy", "High potential · difficult", "Low potential · easy", "Low potential · difficult"] }] },
      LEADING_SAFE_LESSONS[2],
      { title: "Establishing Team and Technical Agility", exercises: [{ kind: "stickies", title: "Built-in quality in your teams", lanes: ["Practices we have", "Practices we lack", "First step"], rows: 2, color: COLORS.green }] },
      LEADING_SAFE_LESSONS[4],
      LEADING_SAFE_LESSONS[5],
      { title: "Leading the Change", exercises: [{ kind: "table", title: "The leader's call to action (one page)", columns: ["Part", "Your draft"], rows: [["Organisation leadership: what we need", "Need to improve timeliness of delivery."], ["Business language: the issue", "We are unable to predict what will get done by when; we miss commitments and blow through estimates."], ["Impacts", ""], ["Call to action", "Fully adopt SAFe to shape teams, create accurate estimates and achieve milestones predictably: outcomes understood and measured; backlog mature; teams have the skills; delivery on a measurable cadence."], ["End with an ask", "More time to help leaders learn."]] }, { kind: "stickies", title: "Who do we need? Guiding coalition", lanes: ["Sponsors", "Change agents", "Who might resist"], rows: 2 }] },
    ],
  },
  {
    id: "spc",
    name: "SAFe Practice Consultant (SPC)",
    short: "SPC",
    blurb: "Four days: the Leading SAFe lessons first (business agility, principles, team agility, Agile Product Delivery with the PI planning simulation, LPM), then designing the implementation, launching an ART with the readiness checklist, coaching ART execution, enhancing the portfolio and accelerating business agility.",
    days: 4,
    lessons: [
      { title: "Thriving in the Digital Age with Business Agility", exercises: [{ kind: "stickies", title: "What brought you here", lanes: ["What I want from the class", "A challenge I bring"], rows: 3 }] },
      LEADING_SAFE_LESSONS[2],
      { title: "Establishing Team and Technical Agility", exercises: [{ kind: "stickies", title: "Built-in quality in your teams", lanes: ["Practices we have", "Practices we lack", "First step"], rows: 2, color: COLORS.green }] },
      { ...LEADING_SAFE_LESSONS[4], exercises: LEADING_SAFE_LESSONS[4].exercises.map((e) => (e.kind === "pi-planning" ? { ...e, teams: ["Team A · Vehicle control", "Team B · Mobile app", "Team C · Sensor management", "Team D · Test track"] } : e)) },
      LEADING_SAFE_LESSONS[5],
      { title: "Leading the Change", exercises: [{ kind: "stickies", title: "Who do we need? Guiding coalition", lanes: ["Sponsors", "Change agents", "Who might resist"], rows: 2 }] },
      { title: "Getting Certified and Starting Training (SAFe for Teams)", exercises: [{ kind: "table", title: "Lesson links", columns: ["Lesson", "Resource"], rows: [["2", "Activity: experience a large batch size"], ["2", "Activity: experience a small batch size"], ["4", "Video: calculating WSJF"], ["4", "Video: the power of PI Planning"], ["7", "Video: SAFe certification benefits"], ["8", "Video: the 3-minute pitch"], ["10", "Video: PI Planning with distributed teams"], ["14", "Video: getting started as an SPC"]] }] },
      { title: "Reaching the SAFe Tipping Point", exercises: [{ kind: "table", title: "Toward the tipping point", columns: ["Question", "Answer"], rows: [["Steps to create the burning platform or proactive case", ""], ["Impediments", ""], ["3–5 future SPCs to form a guiding coalition", ""]] }, { kind: "table", title: "The leader's call to action", columns: ["Part", "Your draft"], rows: [["Organisation leadership: what we need", ""], ["Business language: the issue", ""], ["Impacts", ""], ["Call to action", ""], ["End with an ask", ""]] }] },
      { title: "Designing the Implementation", exercises: [{ kind: "slide", title: "Identify the value streams", body: "From an operational value stream (trigger, steps, value) to the systems behind it, the people who build them, the development value streams and the ARTs. Example: Old Age Security, a government benefit service for Canadian seniors, triggered by retirement; steps from 'learn about benefit' to 'terminate benefit'; systems: benefit marketing, application processing, benefit processing." }, { kind: "table", title: "Value stream canvas", columns: ["Field", "Answer"], rows: [["Name", ""], ["Type", ""], ["Description", ""], ["Customer(s)", ""], ["Triggers", ""], ["Value received by the enterprise", ""], ["Value received by the customer", ""]] }, { kind: "stickies", title: "Operational steps → systems → people → ARTs", lanes: ["Steps", "Systems", "People and locations", "Development value streams", "ARTs"], rows: 3, color: COLORS.blue }, { kind: "link", title: "Run it live", body: "The value stream identification workshop in Trainyard draws the chevrons, the systems under them, the people, the development value streams and the trains, and checks each train against 50–125 people.", href: "/value-streams" }] },
      { title: "Launching an Agile Release Train", exercises: READINESS_CHECKLIST },
      { title: "Coaching ART Execution", exercises: [{ kind: "zones", title: "Fishbone: why does the ART miss its PI objectives?", zones: ["People", "Process", "Tools", "Environment", "Measures"], color: COLORS.pink }, { kind: "stickies", title: "Coaching plan for the first PI", lanes: ["Before PI Planning", "During the PI", "At Inspect & Adapt"], rows: 2 }] },
      { title: "Enhancing the Portfolio", exercises: [WSJF_EXAMPLE, WSJF_EPIC_EXAMPLE, { kind: "link", title: "Portfolio Kanban, canvases and guardrails", body: "Portfolio Kanban with WIP limits, the Portfolio canvas, SWOT → TOWS → vision, epic hypothesis, Lean business case and budget guardrails are live in Trainyard.", href: "/portfolio" }] },
      { title: "Accelerating Business Agility", exercises: [{ kind: "stickies", title: "Measure and grow: where are we?", lanes: ["Strengths", "Growth areas", "Next three improvements"], rows: 2, color: COLORS.green }] },
      { title: "Get Certified and Start Training", exercises: [{ kind: "stickies", title: "Your first 90 days as an SPC", lanes: ["Month 1", "Month 2", "Month 3"], rows: 2 }] },
    ],
  },
  {
    id: "aspc",
    name: "Advanced SPC",
    short: "ASPC",
    blurb: "Three days for experienced SPCs: the role, embracing AI, engaging executives, developing a transformation strategy, unlocking portfolio flow, customizing SAFe to your context, with the CARS case studies and a design-sprint learning lab.",
    days: 3,
    lessons: [
      { title: "Introducing the Advanced SPC Role", exercises: [{ kind: "stickies", title: "What brought you here", lanes: ["What I want from the class", "A transformation I lead"], rows: 3 }, ...CARS_SCENARIO] },
      { title: "Embracing AI", exercises: [{ kind: "zones", title: "Where does AI change the work?", zones: ["Exponential", "Generative", "Emergent", "Disruptive"], color: COLORS.purple }, { kind: "stickies", title: "AI in our transformation", lanes: ["Use today", "Try next PI", "Guardrails we need"], rows: 2 }] },
      { title: "Engaging Executives", exercises: [{ kind: "table", title: "Case study 1: charting the road ahead", columns: ["Leader persona", "What they care about", "What they fear", "Our ask"], rows: [], blankRows: 4 }, { kind: "slide", title: "Case study 2: communicating the transformation strategy", body: "Using the CARS scenario: draft the message from leadership to the organisation that resolves conflicting priorities, and decide who delivers it and how often.", minutes: 30 }] },
      { title: "Developing a Transformation Strategy", exercises: [{ kind: "table", title: "Case study 3: do we have the metrics we need?", columns: ["Outcome", "Measure", "Baseline", "Target", "Owner"], rows: [], blankRows: 5 }, { kind: "zones", title: "OKRs for the transformation", zones: ["Objective", "Key results", "Risks"] }] },
      { title: "Unlocking Portfolio Flow", exercises: [{ kind: "slide", title: "Case study 4: using facts as our guide", body: "Prioritise the CARS portfolio backlog with WSJF using Fibonacci values, then challenge each other's numbers: which assumptions drive the order?", minutes: 30 }, WSJF_EXAMPLE, WSJF_EPIC_EXAMPLE, WSJF_TABLE, { kind: "link", title: "Portfolio flow, live", body: "Portfolio Kanban with WIP limits, flow metrics and the value stream maps measured from Jira or Azure DevOps.", href: "/portfolio" }] },
      { title: "Customizing SAFe to Your Context", exercises: [{ kind: "stickies", title: "Keep · adapt · drop", lanes: ["Keep", "Adapt", "Drop", "Add"], rows: 3, color: COLORS.green }, { kind: "link", title: "Operating models as data", body: "Every scaling model in Trainyard is configuration: fork SAFe, rename levels and ceremonies, and the boards follow.", href: "/model" }] },
      { title: "Learning Lab: design sprint", exercises: DESIGN_SPRINT },
      { title: "Get Certified and Start Training", exercises: [{ kind: "stickies", title: "Your next transformation move", lanes: ["This week", "This PI", "This year"], rows: 2 }] },
    ],
  },
  {
    id: "popm",
    name: "Product Owner / Product Manager (POPM)",
    short: "POPM",
    blurb: "Two days for POs and PMs, from the trainer's own POPM board: the roles and AI's disruption of product work, preparing for PI Planning (market rhythms, just-enough pre-planning, AI-supported customer research, writing features), leading PI Planning (dependencies, AI-empowered planning, the vision, the simulation), executing iterations (continuous delivery pipeline, story map, AI-assisted iteration planning) and executing the PI (sync events, responsible AI).",
    days: 2,
    lessons: [
      {
        title: "Becoming a Product Owner / Product Manager",
        exercises: [
          { kind: "table", title: "Lesson 1 activity: product role experience", columns: ["Name", "Experience working in an Agile environment", "Experience working outside of an Agile environment", "Product Owner role experience", "Product Manager role experience", "What I want to learn most in this course"], rows: [], blankRows: 8 },
          { kind: "slide", title: "L1 discussion: AI disruption in Product Management", body: "In your group, explore how the widespread adoption of AI may disrupt how Product Owners and Product Managers operate and deliver value. For example, consider:", steps: ["Story writing: how might AI-assisted story writing and acceptance criteria generation change your daily priorities and how you budget your time?", "Customer insights: how might AI analysing large amounts of customer feedback change how you identify needs and define value?", "Feature writing: how might AI change how you write features and benefit hypotheses?"], minutes: 20 },
          { kind: "stickies", title: "AI disruption: what we think", lanes: ["Story writing", "Customer insights", "Feature writing"], rows: 2, color: COLORS.blue },
          { kind: "zones", title: "AI opportunities: sort them", zones: ["Look for opportunities to use", "Keep on the radar", "Consider later", "Do not consider"], color: COLORS.green },
          { kind: "table", title: "AI prompting template (use in AI activities)", columns: ["Part", "Your response"], rows: [["Goal: what are you trying to accomplish?", ""], ["Role: what persona or expertise should the AI assume?", ""], ["Task: what exactly do you want the AI to do?", ""], ["Context (optional): is there background info the AI needs?", ""], ["Details (optional): are there any specific requirements?", ""], ["Intermediate: examples, data, interaction, steps, reasoning?", ""], ["Advanced: interview, challenge, break down, analysis, chain-of-thought?", ""], ["PROMPT", "Combine responses 1 to 7 into one prompt and paste it into your AI tool"]] },
        ],
      },
      {
        title: "Preparing for PI Planning",
        exercises: [
          { kind: "slide", title: "Lesson 2 activity: consider market rhythms for optimum release timing", body: "Place each release on the grid where demand is highest for its market. Markers: Local retail market (grey), Medical specimen market (teal), Hardware release (red). Then discuss: which rhythms are fixed, which are ours to choose, and what that means for the PI calendar.", minutes: 15 },
          { kind: "table", title: "Market rhythms: demand by quarter", columns: ["Demand", "Q1", "Q2", "Q3", "Q4"], rows: [["High demand", "", "", "", ""], ["Median demand", "", "", "", ""], ["Low demand", "", "", "", ""]] },
          { kind: "zones", title: "Lesson 2 discussion: just enough pre-planning", zones: ["More pre-planning · positive", "More pre-planning · negative", "Less pre-planning · positive", "Less pre-planning · negative"], color: COLORS.pink },
          { kind: "stickies", title: "What is the problem? Who has the problem? Why is it important?", lanes: ["The problem", "Who has it", "Why it matters"], rows: 2, color: COLORS.blue },
          { kind: "table", title: "Lesson 2 discussion: exploring customer needs with AI-supported research", columns: ["What assumptions does this research appear to make?", "What insights would require direct customer validation?", "How could this research inform (but not replace) customer discovery?"], rows: [], blankRows: 3 },
          { kind: "slide", title: "Lesson 2 activity: writing features · example", body: "Description: allow purchase of supplemental insurance via the TTC mobile app. Benefit hypothesis: mobile access to insurance options improves convenience, increasing engagement and revenue. Acceptance criteria: customers can access insurance options through the mobile app's package booking flow; the app supports secure payment for insurance purchases; customers receive a push notification confirming their purchase." },
          { kind: "stickies", title: "Feature storming", lanes: ["Feature 1", "Feature 2", "Feature 3", "Feature 4"], hint: "Epic: develop a solution to allow TTC customers to purchase supplemental insurance for packages. Example feature: mobile app insurance purchase.", rows: 1, color: COLORS.blue },
          { kind: "canvas", title: "Feature refinement", sections: ["Feature description", "Benefit hypothesis", "Acceptance criteria"], cols: 3 },
          FEATURE_CANVAS,
          WSJF_TABLE,
          { kind: "link", title: "Feature and enabler canvases, live", body: "Feature canvas with benefit hypothesis, acceptance criteria and WSJF; enabler canvas with the architectural runway.", href: "/canvases" },
        ],
      },
      {
        title: "Leading PI Planning",
        exercises: [
          { kind: "slide", title: "Lesson 3 activity: identify dependency issues and resolve them", body: "On the ART planning board below, features (blue) are strung to the significant dependencies (red) they wait on; milestones and events are orange. Red strings connect a feature or milestone to one or more dependencies; sometimes a dependency has its own dependencies. Mark each issue with a warning triangle, then resolve it: re-sequence, split, or negotiate.", steps: ["Find dependencies that land after the feature that needs them", "Find chains three deep or longer", "Find anything in the IP iteration", "Propose a resolution per issue"], minutes: 20 },
          { kind: "table", title: "ART planning board", columns: ["Team", "Iteration 1.1", "Iteration 1.2", "Iteration 1.3", "Iteration 1.4", "Iteration 1.5 (IP)", "PI 2 >>>"], rows: [["Milestones and events", "", "", "", "", "", ""], ["Unicorns", "", "", "", "", "", ""], ["Lions", "", "", "", "", "", ""], ["Bears", "", "", "", "", "", ""], ["Eagles", "", "", "", "", "", ""], ["Tigers", "", "", "", "", "", ""], ["Antelopes", "", "", "", "", "", ""], ["Bulls", "", "", "", "", "", ""], ["UX help", "", "", "", "", "", ""], ["System Architect help", "", "", "", "", "", ""]] },
          { kind: "slide", title: "L3 discussion: AI-empowered PI Planning", body: "As a class, brainstorm ways AI can reduce overhead or friction in PI Planning. Consider:", steps: ["Where does planning seem the hardest or most time-consuming?", "How could AI reduce effort, improve clarity, or surface risks earlier?", "What should always remain a human responsibility?", "What's one AI-enabled improvement you'd consider trying next PI?"], minutes: 15 },
          { kind: "stickies", title: "Lesson 3 activity: communicate the vision", lanes: ["Capture your group's vision here"], hint: "One or two stickies: the vision as you would present it in the first hour of PI Planning.", rows: 2, color: COLORS.green },
          { kind: "pi-planning", title: "PI Planning simulation · autonomous delivery vehicle", teams: ["Unicorns · Vehicle control", "Lions · Mobile app", "Bears · Sensor management"], backlog: VEHICLE_BACKLOG },
          { kind: "link", title: "PI Outcome Planning (AI-Native SAFe)", body: "The one-day alternative the class discusses: outcome tree, PI Outcome Planning Board, team boards and the vote.", href: "/outcome-planning" },
        ],
      },
      {
        title: "Executing Iterations",
        exercises: [
          { kind: "table", title: "Lesson 4 discussion: building the Continuous Delivery Pipeline", columns: ["How can product roles support Continuous Exploration?", "How can product roles support Continuous Integration?", "How can product roles support Continuous Deployment?", "How can product roles support Release on Demand?"], rows: [], blankRows: 3 },
          { kind: "slide", title: "Lesson 4 activity: develop a story map · example feature", body: "Delivery order insurance. Benefit hypothesis: allows users to purchase extra insurance for an existing delivery order. Acceptance criteria: access insurance catalog from account profile; display available insurance options; integrate with shopping cart; process payment. Map the activities or tasks across the top, then the stories under each, essential ones for this release above the line, future releases below." },
          { kind: "table", title: "Story map", columns: ["", "Browse catalog", "Go to website", "Select policy", "Purchase"], rows: [["Essential stories for this release", "Login", "View my account", "Access the catalog", ""], ["", "", "", "", ""], ["Stories for future releases", "Accessible from any device", "Chatbot directs user to catalog", "", ""], ["", "", "", "", ""]] },
          { kind: "table", title: "Story writing: INVEST", columns: ["Story", "Independent", "Negotiable", "Valuable", "Estimable", "Small", "Testable"], rows: [], blankRows: 4 },
          { kind: "stickies", title: "Lesson 4 activity: AI-assisted iteration planning", lanes: ["Human-written iteration goals", "AI-generated iteration goals", "Hybrid iteration goals"], hint: "Use the AI prompting template from Lesson 1. Compare: which goals are clearer, which are measurable, which would the team sign up for?", rows: 2 },
        ],
      },
      {
        title: "Executing the PI",
        exercises: [
          { kind: "slide", title: "Lesson 5 discussion: enabling alignment across the ART with sync events", body: "Discuss the following:", steps: ["How can you leverage sync events as a PO or Product Manager to ensure alignment across the ART?", "What issues and opportunities might you bring up?", "What potential solutions might you offer to resolve the issues and follow through with opportunities?"], minutes: 15 },
          { kind: "stickies", title: "Sync events: what I bring", lanes: ["PO sync", "Coach sync", "ART sync"], rows: 2, color: COLORS.green },
          { kind: "slide", title: "Lesson 5 discussion: responsible AI and product decisions", body: "An AI tool analyses onboarding data and finds that many new users abandon the product before completing setup. It recommends simplifying onboarding by removing steps and introducing a guided 'quick start' experience to help users reach value faster." },
          { kind: "table", title: "Responsible AI: trustworthy, explainable, human-centric", columns: ["Trustworthy: does this reflect the full customer experience?", "Explainable: what evidence supports this recommendation?", "Human-centric: what are the risks or unintended impacts for users?"], rows: [], blankRows: 3 },
          { kind: "stickies", title: "Iteration review and system demo", lanes: ["What we showed", "What we heard", "What changes in the backlog"], rows: 2, color: COLORS.green },
        ],
      },
    ],
  },
  {
    id: "rte",
    name: "Release Train Engineer (RTE)",
    short: "RTE",
    blurb: "The RTE class chapter by chapter: each exercise on its own tab with its timing, steps and references, the class timer, and exercises the trainer marks complete.",
    days: 3,
    welcome: ["Icebreaker"],
    lessons: RTE_COURSE.map((l) => ({ title: l.title, exercises: [] })),
    course: RTE_COURSE,
  },
];

export function classTemplates(now?: string): (Board & { info: TemplateInfo })[] {
  return CLASSES.map((spec) => Object.assign(classBoard(spec, now), { info: classInfo(spec) }));
}

// ---- the tools, inside the classes -----------------------------------------------------------
// Chapters that teach something Trainyard runs are built from the same definitions the tools
// use (the readiness checklist, the Coach Sync checkpoints, the capacity rule, the value stream
// workshop and template, the Inspect & Adapt agenda). Class boards are regenerated from them on
// every start, so when a tool's definition changes, the class changes with it.

/** A canvas exercise built from one of the canvases the tool uses: same sections, same prompts. */
function canvasExercise(id: string, cols = 3): Exercise {
  const def = CANVAS_TYPES.find((t) => t.id === id);
  if (!def) throw new Error(`No canvas ${id}`);
  const sections = def.sections.map((s) => s.title);
  const prompts: Record<string, string> = {};
  for (const s of def.sections) {
    const p = s.prompt ?? (s.labels ? s.labels.join(" · ") : undefined);
    if (p) prompts[s.title] = p;
  }
  return { kind: "canvas", title: `${def.name}: ${def.blurb}`, sections, cols, prompts };
}

/** The WSJF table, with the cost-of-delay parts named the way the feature canvas names them. */
function wsjfTable(item: string): Exercise {
  const parts = CANVAS_TYPES.find((t) => t.id === "feature-canvas")!.sections.find((s) => s.kind === "wsjf")!.labels!;
  const [value, time, risk, size] = parts as [string, string, string, string];
  // WSJF divides cost of delay by duration: job size stands in for it on features, the cost
  // normalised to the cheapest epic on epics.
  if (item === "Epic") return { kind: "table", title: `WSJF for epics: cost of delay (${value} + ${time} + ${risk}) ÷ normalised cost`, columns: [item, value, time, risk, "Cost of delay", "Cost", "Normalised cost (÷ lowest)", "WSJF"], rows: [], blankRows: 4 };
  return { kind: "table", title: `WSJF: cost of delay (${value} + ${time} + ${risk}) ÷ ${size}`, columns: [item, value, time, risk, "Cost of delay", size, "WSJF"], rows: [], blankRows: 4 };
}

export const CLASS_TOOLS = {
  piPlanning: (): Exercise[] => [
    {
      kind: "table",
      title: `Team capacity: each contributor gives allocation × ${POINTS_PER_FULL_TIME} points per iteration, minus one point per day off; Scrum Master and Product Owner do not count`,
      columns: ["Team member", "Role", "Allocation %", "Days off", "Points"],
      rows: [["", "Developer", "100", "0", String(POINTS_PER_FULL_TIME)], ["", "Developer", "100", "2", String(POINTS_PER_FULL_TIME - 2)], ["", "Tester", "50", "0", String(POINTS_PER_FULL_TIME / 2)], ["", "Scrum Master", "100", "0", "0"], ["", "Product Owner", "100", "0", "0"]],
      blankRows: 2,
    },
    {
      kind: "table",
      title: "Coach Sync: the RTE's checkpoints through the breakouts (Yes · Partly · Not yet · Needs help)",
      columns: ["Checkpoint", "Question", "Team 1", "Team 2", "Team 3", "Team 4"],
      rows: COACH_SYNC_CHECKPOINTS.flatMap((c) => c.questions.map((q, i) => [i === 0 ? `Day ${c.day} · ${c.time} · ${c.title}` : "", q.text, "", "", "", ""])),
    },
    { kind: "table", title: "PI objectives: team and ART", columns: ["Level", "PI objective", "Committed?", "Planned BV (1–10)", "Source team objectives"], rows: [], blankRows: 6 },
  ],
  valueStreams: (): Exercise[] => [
    { kind: "table", title: `Operational value stream template (types: ${OVS_TYPES.map((t) => t.name).join(", ")}, or your own)`, columns: ["Field", "Your value stream"], rows: OVS_TEMPLATE_FIELDS.map((f) => [f, ""]) },
    { kind: "stickies", title: "Identify the value stream, step by step", lanes: VS_WORKSHOP_STEPS.map(([step]) => step), hint: VS_WORKSHOP_STEPS.map(([step, how]) => `${step}: ${how}`).join(" "), rows: 3 },
    { kind: "zones", title: "Realise ARTs: which topology fits each train?", zones: ART_TOPOLOGIES.map((t) => t.name), items: ART_TOPOLOGIES.map((t) => t.blurb) },
  ],
  readiness: (): Exercise[] => READINESS_CHECKLIST,
  features: (): Exercise[] => [canvasExercise("feature-canvas"), canvasExercise("enabler-canvas"), wsjfTable("Feature")],
  portfolio: (): Exercise[] => [
    { kind: "zones", title: "Portfolio Kanban: move each epic to its state, then set a WIP limit per state", zones: EPIC_STATES.map((st) => st[0]!.toUpperCase() + st.slice(1)), color: COLORS.blue },
    canvasExercise("epic-hypothesis"),
    canvasExercise("lean-business-case"),
    wsjfTable("Epic"),
  ],
  strategy: (): Exercise[] => [canvasExercise("lace-mission"), canvasExercise("swot", 2), canvasExercise("tows", 2), canvasExercise("portfolio-vision")],
  aiNative: (): Exercise[] => [
    {
      kind: "table",
      title: "AI-Native readiness: score each success factor 1–5 on your own, then compare and name the gaps",
      columns: ["Shift", "Success factor", "Person 1", "Person 2", "Person 3", "Person 4", "Gap and next step"],
      rows: SUCCESS_FACTORS.flatMap((g) => g.factors.map((f, i) => [i === 0 ? g.shift : "", f, "", "", "", "", ""])),
    },
  ],
  operatingModels: (): Exercise[] => [
    {
      kind: "table",
      title: "Operating models: start from the closest one, then keep, adapt, drop or add levels, roles and events",
      columns: ["Model", "Group levels", "Work levels", "Cadence", "Keep · adapt · drop"],
      rows: OPERATING_MODELS.map((m) => [m.name, m.groupLevels.map((g) => g.label).join(" › "), m.workLevels.map((w) => w.label).join(" › "), m.cadence.mode === "flow" ? "Flow (replenishment)" : `${m.cadence.iterationsPerIncrement} × ${m.cadence.iterationWeeks}-week ${m.cadence.iterationLabel.toLowerCase()}s per ${m.cadence.incrementLabel}`, ""]),
    },
  ],
  inspectAdapt: (): Exercise[] => [
    { kind: "slide", title: "Inspect & Adapt: the three parts", body: INSPECT_AND_ADAPT.parts.map((p) => `${p.title}: ${p.detail}`).join(" "), steps: [...INSPECT_AND_ADAPT.workshopSteps] },
    { kind: "table", title: `PI objectives: planned and actual business value. ${INSPECT_AND_ADAPT.predictability}`, columns: [...INSPECT_AND_ADAPT.objectives], rows: [], blankRows: 6 },
    { kind: "zones", title: "Problem-solving workshop: fishbone", zones: [...INSPECT_AND_ADAPT.fishbone], color: COLORS.pink },
    { kind: "table", title: "Improvement backlog", columns: [...INSPECT_AND_ADAPT.improvementBacklog], rows: [], blankRows: 4 },
  ],
};

/** Which chapter (1-based lesson number) of which class is built from which tool. */
export const CLASS_TOOL_CHAPTERS: Record<string, Record<number, (keyof typeof CLASS_TOOLS)[]>> = {
  "leading-safe": { 4: ["piPlanning"] },
  spc: { 4: ["piPlanning"], 9: ["valueStreams"], 10: ["readiness"], 11: ["inspectAdapt"] },
  rte: { 3: ["readiness"], 6: ["inspectAdapt"] },
  popm: { 2: ["readiness", "features"], 3: ["piPlanning"], 5: ["inspectAdapt"] },
  aspc: { 2: ["aiNative"], 4: ["strategy"], 5: ["portfolio"], 6: ["operatingModels"] },
};

function withLiveTools(c: ClassSpec): ClassSpec {
  const map = CLASS_TOOL_CHAPTERS[c.id];
  if (!map) return c;
  return {
    ...c,
    lessons: c.lessons.map((l, i) => {
      const tools = map[i + 1];
      if (!tools) return l;
      const generated = tools.flatMap((t) => CLASS_TOOLS[t]());
      const titles = new Set(generated.map((e) => e.title));
      // The tool's own version replaces any hand-written copy of the same exercise.
      // Links to the tool go too: the chapter now holds the tool's own content.
      const superseded = (e: Exercise) => titles.has(e.title) || e.kind === "link" || /^(PI planning readiness|Problem-solving workshop|Fishbone|Improvement backlog|Operational steps|Features: benefit hypothesis|WSJF: Cost of Delay)/.test(e.title);
      const kept = l.exercises.filter((e) => !superseded(e));
      return { ...l, exercises: [...kept, ...generated] };
    }),
  };
}

export const CLASSES: ClassSpec[] = RAW_CLASSES.map(withLiveTools);

// ---- seating students --------------------------------------------------------------------
// When the trainer adds students to a class, each one's name goes into the icebreaker (a row
// of their own, in its first column) and onto "The awesome team". Rows run out: a new row is
// added across the columns and everything below moves down to make room. A removed student's
// name sticky is emptied; what they wrote elsewhere stays.

/** The frames seats are kept in: the icebreaker and the team. */
const SEAT_FRAMES = [/^Icebreaker/i, /^Presenting our team/i];

export function seatStudents(board: Board, students: { id: string; name: string }[]): boolean {
  let changed = false;
  for (const pattern of SEAT_FRAMES) {
    const frame = board.frames.find((f) => pattern.test(f.title));
    if (!frame) continue;
    const lanes = board.frames.filter((f) => f.parentId === frame.id).sort((a, b) => a.x - b.x);
    // The icebreaker seats a student in every column's row; the team frame only in its first column.
    const seatLanes = pattern === SEAT_FRAMES[0] ? lanes : lanes.slice(0, 1);
    const nameLane = lanes[0];
    if (!nameLane) continue;
    const inLane = (lane: Frame) => board.nodes.filter((n) => n.frameId === lane.id && n.kind === "sticky").sort((a, b) => a.y - b.y);
    const first = inLane(nameLane);
    const step = first.length > 1 ? first[1]!.y - first[0]!.y : (first[0]?.height ?? 160) + 20;
    // Students no longer in the class: their name sticky goes back to an empty seat.
    for (const n of first) {
      const sid = n.fields.studentId;
      if (typeof sid === "string" && !students.some((s) => s.id === sid)) {
        n.text = "";
        n.fields = { placeholder: true };
        changed = true;
      }
    }
    for (const s of students) {
      const seated = inLane(nameLane).find((n) => n.fields.studentId === s.id);
      if (seated) {
        // A rename shows, unless someone already wrote over the name.
        if (seated.text === seated.fields.studentName && seated.text !== s.name) (seated.text = s.name), (seated.fields = { ...seated.fields, studentName: s.name }), (changed = true);
        continue;
      }
      let seat = inLane(nameLane).find((n) => !n.text.trim() && !n.fields.studentId);
      if (!seat) {
        // A new row across the seat columns, and room for it below.
        const rows = inLane(nameLane);
        const y = (rows.at(-1)?.y ?? nameLane.y + 40 - step) + step;
        const bottom = frame.y + frame.height;
        for (const f of board.frames) if (f.y >= bottom) f.y += step;
        for (const n of board.nodes) if (n.y >= bottom) n.y += step;
        for (const f of board.frames) if (f.id === frame.id || lanes.includes(f) || (f.x <= frame.x && f.x + f.width >= frame.x + frame.width && f.y <= frame.y && f.y + f.height >= bottom)) f.height += step;
        for (const lane of seatLanes) {
          const proto = inLane(lane)[0];
          board.nodes.push({ id: `seat-${lane.id}-${Math.round(y)}`, kind: "sticky", text: "", x: proto?.x ?? lane.x + 20, y, width: proto?.width ?? 160, height: proto?.height ?? 160, color: proto?.color ?? COLORS.yellow, frameId: lane.id, tags: [], fields: { placeholder: true } });
        }
        seat = inLane(nameLane).find((n) => !n.text.trim() && !n.fields.studentId)!;
      }
      seat.text = s.name;
      seat.fields = { studentId: s.id, studentName: s.name };
      changed = true;
    }
  }
  return changed;
}
