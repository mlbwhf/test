// Class activities: an exercise frame with its own timing, steps, reference material shown beside
// it (an article, a picture, a table) and, for mapping exercises, typed connections learners draw.
// Course content comes from the built-in classes (courses/) or a trainer's own course file (addActivities).

import type { Board, BoardNode, Frame } from "./boards.js";

export interface ConnectionType {
  id: string;
  label: string;
  /** CSS colour of the connector and its legend chip. */
  color: string;
}

/** Reference material shown beside the activity: a web page, a picture or plain text. */
export interface SideItem {
  title: string;
  url?: string;
  /** A data:image/… URL. */
  image?: string;
  text?: string;
  /** Answer keys and trainer notes: learners on a join link do not see it. */
  instructorOnly?: boolean;
}

export interface Activity {
  /** "Activity", "Discussion", "Exercise"… shown before the title. */
  kind: string;
  /** Minutes to prepare (work in groups) and to share back; either may be absent. */
  prepare?: number;
  share?: number;
  /** What the second part is called when not "Share" (e.g. "Showcase"). */
  shareLabel?: string;
  /** The question, one step per line. */
  steps: string;
  side?: SideItem[];
  connectionTypes?: ConnectionType[];
}

/** One countdown for the whole class, shown to every learner. */
export interface ClassTimer {
  frameId?: string;
  label: string;
  seconds: number;
  /** Running: when it ends. Paused: absent, with `left` seconds remaining. */
  endsAt?: string;
  left?: number;
}

/** Something to place on the activity's canvas, in pixels from its top-left corner. */
export interface ActivityItem {
  /** "shape" is a plain block, e.g. a quadrant of a 2×2 grid. */
  kind: "image" | "pin" | "card" | "text" | "shape";
  text?: string;
  src?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  fontSize?: number;
  /** Stays put: part of the background people work on (pictures always are). */
  locked?: boolean;
  /** One-tap answers shown on the card, e.g. ["Y", "N", "D"]; the pick is kept in the card's `choice` field. */
  choices?: string[];
}

/** The answers a card offers (its `choices` field, "Y|N|D"). */
export function cardChoices(n: BoardNode): string[] {
  return typeof n.fields.choices === "string" && n.fields.choices ? n.fields.choices.split("|") : [];
}

export interface ActivitySpec extends Activity {
  title: string;
  /** Size of the working area; defaults to 1600 × 900. */
  width?: number;
  height?: number;
  items?: ActivityItem[];
}

export const DEFAULT_CONNECTION_COLORS = ["#c2412d", "#2f6fbd", "#2e8b57", "#8c6bc8", "#d98a1c", "#1f8a9e"];

/** "Prepare: 7 min · Share: 3 min" */
export function activityTiming(a: Pick<Activity, "prepare" | "share" | "shareLabel">): string {
  const parts = [a.prepare ? `${a.share ? "Prepare: " : ""}${a.prepare} min` : "", a.share ? `${a.shareLabel ?? "Share"}: ${a.share} min` : ""].filter(Boolean);
  return parts.join(" · ");
}

/** Seconds left on the timer at `now`. */
export function timerLeft(t: ClassTimer, now: Date): number {
  if (!t.endsAt) return Math.max(0, Math.round(t.left ?? t.seconds));
  return Math.max(0, Math.round((Date.parse(t.endsAt) - now.getTime()) / 1000));
}

/** How many connectors of each type the activity holds, and whether every type has one. */
export function connectionTally(board: Board, frameId: string): { counts: Record<string, number>; complete: boolean } {
  const f = board.frames.find((x) => x.id === frameId);
  const types = f?.activity?.connectionTypes ?? [];
  const inside = new Set(board.nodes.filter((n) => n.frameId === frameId).map((n) => n.id));
  const counts = Object.fromEntries(types.map((t) => [t.id, 0])) as Record<string, number>;
  for (const e of board.edges) if (e.type && e.type in counts && (inside.has(e.fromId) || inside.has(e.toId))) counts[e.type]! += 1;
  return { counts, complete: types.length > 0 && types.every((t) => counts[t.id]! > 0) };
}

/** Moves everything below `bottom` down by `dy` and grows the frames that span it. */
function makeRoom(board: Board, frame: Frame, dy: number) {
  const bottom = frame.y + frame.height;
  const below = (y: number) => y >= bottom;
  const spans = (f: Frame) => f.y <= frame.y && f.y + f.height >= bottom;
  for (const f of board.frames) {
    if (f === frame || spans(f)) f.height += dy;
    else if (below(f.y)) f.y += dy;
  }
  for (const n of board.nodes) if (below(n.y)) n.y += dy;
}

/**
 * Adds activity frames to a lesson (a top-level frame), one under another below what the
 * lesson already holds, and makes room for them. Returns the new frame ids.
 */
export function addActivities(board: Board, lessonId: string, specs: ActivitySpec[], prefix: string): string[] {
  const lesson = board.frames.find((f) => f.id === lessonId);
  if (!lesson) throw new Error(`No lesson ${lessonId}`);
  const kids = board.frames.filter((f) => f.parentId === lesson.id);
  const inner = board.nodes.filter((n) => n.frameId === lesson.id || kids.some((k) => k.id === n.frameId));
  const content = Math.max(lesson.y + 80, ...kids.map((k) => k.y + k.height), ...inner.map((n) => n.y + (n.height ?? 120)));
  let y = content + 80;
  const ids: string[] = [];
  specs.forEach((spec, i) => {
    const width = spec.width ?? 1600;
    const height = spec.height ?? 900;
    const need = y + height + 40 - (lesson.y + lesson.height);
    if (need > 0) makeRoom(board, lesson, need);
    if (lesson.width < width + 60) lesson.width = width + 60;
    const { title, width: _w, height: _h, items = [], ...activity } = spec;
    const id = `${prefix}-a${i + 1}`;
    board.frames.push({ id, title: `${spec.kind}: ${title}`, x: lesson.x + 30, y, width, height, parentId: lesson.id, activity: { ...activity, ...(activity.connectionTypes ? { connectionTypes: activity.connectionTypes.map((t, ti) => ({ ...t, color: t.color || DEFAULT_CONNECTION_COLORS[ti % DEFAULT_CONNECTION_COLORS.length]! })) } : {}) } });
    items.forEach((it, j) => {
      const node: BoardNode = {
        id: `${id}-i${j + 1}`,
        kind: it.kind === "image" ? "image" : it.kind === "text" ? "text" : it.kind === "pin" || it.kind === "shape" ? "shape" : "sticky",
        text: it.text ?? "",
        x: lesson.x + 30 + it.x,
        y: y + it.y,
        width: it.width ?? (it.kind === "pin" ? 120 : 180),
        height: it.height ?? (it.kind === "pin" ? 44 : 120),
        frameId: id,
        tags: [],
        fields: { ...(it.src ? { src: it.src } : {}), ...(it.kind === "pin" ? { pin: true } : {}), ...(it.kind === "image" || it.locked ? { locked: true } : {}), ...(it.fontSize ? { fontSize: it.fontSize } : {}), ...(it.choices?.length ? { choices: it.choices.join("|") } : {}) },
        ...(it.color ? { color: it.color } : it.kind === "pin" ? { color: "#17212b" } : it.kind === "card" ? { color: "#fff6c2" } : {}),
      };
      board.nodes.push(node);
    });
    ids.push(id);
    y += height + 80;
  });
  return ids;
}

/** A short fingerprint of what people see on a board, so clients refetch only when it changed. */
export function boardRevision(b: Board): string {
  let h = 2166136261;
  const add = (v: string) => {
    for (let i = 0; i < v.length; i++) h = Math.imul(h ^ v.charCodeAt(i), 16777619);
  };
  add(b.name);
  for (const f of b.frames) add(`${f.id}|${f.title}|${f.done ? 1 : 0}|${f.x}|${f.y}|${f.width}|${f.height}|${f.activity ? JSON.stringify({ ...f.activity, side: f.activity.side?.map((x) => [x.title, x.url, x.text, x.image?.length, x.instructorOnly]) }) : ""}`);
  for (const n of b.nodes) add(`${n.id}|${n.x}|${n.y}|${n.width}|${n.height}|${n.text}|${n.color}|${n.frameId}|${n.fields.locked ? 1 : 0}|${typeof n.fields.src === "string" ? n.fields.src.length : 0}`);
  for (const e of b.edges) add(`${e.id}|${e.fromId}|${e.toId}|${e.type ?? ""}|${e.label ?? ""}`);
  return (h >>> 0).toString(36);
}

/** A trainer's own course: lessons in order, each with its exercises. Kept in their workspace only. */
export interface CoursePack {
  name: string;
  lessons: { title: string; activities: ActivitySpec[] }[];
}
