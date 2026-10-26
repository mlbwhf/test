// Bring-your-own boards. A Board keeps what a whiteboard or table tool holds, as it is:
// frames, cards with text/colour/position, connectors, and for table tools columns and
// rows. Importers produce Boards; nothing is forced into work items on import. A Board can
// be turned into a template (structure kept, data cleared) and later instantiated, and a
// mapping can promote its cards or rows into planning objects when the user asks.

import type { Dependency, FlowType, Risk, StatusCategory, Team, WorkItem } from "./model.js";
import type { Activity } from "./activities.js";

export type BoardSource = "miro" | "lucid" | "mural" | "monday" | "trello" | "iobeya" | "csv" | "json" | "pptx" | "trainyard";

export interface BoardOrigin {
  system: BoardSource;
  externalId: string;
  url?: string;
  importedAt: string;
  /** Who connected the source, for the audit trail. */
  importedBy?: string;
}

export interface Frame {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId?: string;
  /** A class activity: timing, steps, reference material and connection types (activities.ts). */
  activity?: Activity;
  /** A class exercise the trainer marked complete. */
  done?: boolean;
}

export type NodeKind = "sticky" | "card" | "text" | "shape" | "image" | "view" | "other";

/** Everything in a workspace a card can point at. One record, shown live wherever it is linked. */
export type RefKind = "item" | "epic" | "risk" | "dependency" | "milestone" | "objective" | "outcome" | "output" | "initiative" | "canvas" | "board" | "card" | "team" | "person";

export interface Ref {
  kind: RefKind;
  id: string;
  /** For kind "card": the board the card sits on. */
  boardId?: string;
}

export const refKey = (r: Ref) => `${r.kind}:${r.boardId ? `${r.boardId}/` : ""}${r.id}`;

export interface BoardNode {
  id: string;
  kind: NodeKind;
  /** Plain text; rich text from the source is flattened. */
  text: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  /** CSS colour from the source, e.g. "#fff9b1" or "light_yellow". */
  color?: string;
  frameId?: string;
  tags: string[];
  /** Fields the source had that have no slot here, kept verbatim; typed card fields live here too, by key. */
  fields: Record<string, unknown>;
  /** A linked card: the text and status come from the record it points at, edits go back to it. A "view" node embeds a whole board or canvas. */
  ref?: Ref;
  /** The card type that structures this card's fields (see cards.ts); absent means a plain sticky. */
  typeId?: string;
}

export interface BoardEdge {
  id: string;
  fromId: string;
  toId: string;
  label?: string;
  /** A connection type of the activity it sits in (activities.ts). */
  type?: string;
  /** Drawn as a smooth curve (a planning board's dependency strings) instead of a straight arrow. */
  style?: "curve";
  /** CSS colour of the line. */
  color?: string;
}

export interface Column {
  id: string;
  title: string;
  /** Source type name, e.g. "status", "date", "people", "numbers". */
  type?: string;
}

export interface Row {
  id: string;
  /** Group, list or section the row sits in (Monday group, Trello list). */
  groupId?: string;
  cells: Record<string, unknown>;
}

export interface RowGroup {
  id: string;
  title: string;
  color?: string;
}

export interface Board {
  id: string;
  name: string;
  origin: BoardOrigin;
  isTemplate: boolean;
  /** Set on boards created from a template. */
  templateId?: string;
  frames: Frame[];
  nodes: BoardNode[];
  edges: BoardEdge[];
  columns: Column[];
  groups: RowGroup[];
  rows: Row[];
  /** Board-level facts from the source with no slot here (layout type, teams, stages…), kept verbatim. */
  fields?: Record<string, unknown>;
  /** The room the board lives in (rooms.ts); none means it is open to the whole workspace. */
  roomId?: string;
}

export function emptyBoard(id: string, name: string, origin: BoardOrigin): Board {
  return { id, name, origin, isTemplate: false, frames: [], nodes: [], edges: [], columns: [], groups: [], rows: [] };
}

export function boardShape(b: Board): "canvas" | "table" | "mixed" | "empty" {
  const canvas = b.frames.length + b.nodes.length > 0;
  const table = b.columns.length + b.rows.length > 0;
  return canvas && table ? "mixed" : canvas ? "canvas" : table ? "table" : "empty";
}

/** Board-level facts to carry to a copy; a running class timer stays behind. */
function boardFacts(fields: Record<string, unknown>): Record<string, unknown> {
  const { timer: _timer, ...rest } = structuredClone(fields);
  return rest;
}

/**
 * Keep the structure, drop the content. Frames, columns and groups stay; cards become
 * empty slots only when the frame or group would otherwise be empty, so the template
 * still shows where things go. Rows are dropped.
 */
export function templateFrom(board: Board, id: string, name: string, now: string, keepCards = false): Board {
  const keptNodes: BoardNode[] = keepCards ? structuredClone(board.nodes) : [];
  const seenFrames = new Set<string>();
  for (const n of keepCards ? [] : board.nodes) {
    if (!n.frameId || seenFrames.has(n.frameId)) continue;
    seenFrames.add(n.frameId);
    keptNodes.push({ ...n, id: `${n.id}-slot`, text: "", tags: [], fields: { placeholder: true } });
  }
  return {
    id,
    name,
    origin: { system: "trainyard", externalId: board.id, importedAt: now },
    isTemplate: true,
    frames: structuredClone(board.frames),
    nodes: keptNodes,
    edges: keepCards ? structuredClone(board.edges) : [],
    columns: structuredClone(board.columns),
    ...(board.fields ? { fields: boardFacts(board.fields) } : {}),
    groups: structuredClone(board.groups),
    rows: [],
  };
}

/** A fresh board from a template, with new ids so edits never touch the template. */
export function instantiate(template: Board, id: string, name: string, now: string): Board {
  const prefix = `${id}:`;
  return {
    id,
    name,
    origin: { system: "trainyard", externalId: template.id, importedAt: now },
    isTemplate: false,
    templateId: template.id,
    frames: template.frames.map((f) => ({ ...f, id: prefix + f.id, ...(f.parentId ? { parentId: prefix + f.parentId } : {}) })),
    nodes: template.nodes.map((n) => ({ ...n, id: prefix + n.id, ...(n.frameId ? { frameId: prefix + n.frameId } : {}) })),
    // Lines that are part of the template (a planning board's dependencies) come along; learners' lines are not in templates.
    edges: template.edges.map((e) => ({ ...e, id: prefix + e.id, fromId: prefix + e.fromId, toId: prefix + e.toId })),
    columns: template.columns.map((c) => ({ ...c })),
    groups: template.groups.map((g) => ({ ...g })),
    rows: [],
    // Board-level facts travel with it: a class board stays a class board.
    ...(template.fields ? { fields: boardFacts(template.fields) } : {}),
  };
}

/**
 * Add a template to a board that already exists: its frames, cards and table columns land to
 * the right of what is there, with fresh ids, so one whiteboard can hold a PI planning board
 * beside a retrospective beside a fishbone.
 */
export function insertTemplate(board: Board, template: Board, insertId: string): Board {
  const prefix = `${insertId}:`;
  const right = Math.max(0, ...board.frames.map((f) => f.x + f.width), ...board.nodes.map((n) => n.x + (n.width ?? 0)));
  const left = Math.min(...template.frames.map((f) => f.x), ...template.nodes.map((n) => n.x), Infinity);
  const top = Math.min(...template.frames.map((f) => f.y), ...template.nodes.map((n) => n.y), Infinity);
  const dx = (board.frames.length || board.nodes.length ? right + 240 : 0) - (Number.isFinite(left) ? left : 0);
  const dy = -(Number.isFinite(top) ? top : 0);
  return {
    ...board,
    frames: [...board.frames, ...template.frames.map((f) => ({ ...f, id: prefix + f.id, x: f.x + dx, y: f.y + dy, ...(f.parentId ? { parentId: prefix + f.parentId } : {}) }))],
    nodes: [...board.nodes, ...template.nodes.map((n) => ({ ...n, id: prefix + n.id, x: n.x + dx, y: n.y + dy, ...(n.frameId ? { frameId: prefix + n.frameId } : {}) }))],
    columns: [...board.columns, ...template.columns.filter((c) => !board.columns.some((x) => x.id === c.id)).map((c) => ({ ...c }))],
    groups: [...board.groups, ...template.groups.filter((g) => !board.groups.some((x) => x.id === g.id)).map((g) => ({ ...g }))],
  };
}

// ---- mapping imported content onto planning objects ----------------------------------

export interface ColorRule {
  /** Substring match on the node colour, case-insensitive. */
  color: string;
  as: "risk" | FlowType;
}

export interface BoardMapping {
  /** Which records to read: cards on the canvas, or rows of the table. */
  from: "nodes" | "rows";
  /** Work level key for created items. */
  level: string;
  /** For rows: the column whose cell is the title. For nodes the text is the title. */
  titleColumn?: string;
  /** Where the team comes from: the frame or group the record sits in, or a column. */
  team?: { by: "frame" | "group" } | { by: "column"; column: string };
  /** Where the iteration comes from, matched against iteration names (case-insensitive). */
  iteration?: { by: "frame" | "group" } | { by: "column"; column: string };
  estimateColumn?: string;
  businessValueColumn?: string;
  statusColumn?: string;
  /** Status cell values that mean done / in progress; anything else is to do. */
  statusDone?: string[];
  statusInProgress?: string[];
  /** Node colours that mean risk or a flow type. */
  colorRules?: ColorRule[];
  /** Connectors become dependencies (from = provider, to = consumer). */
  edgesAsDependencies?: boolean;
  /** Create teams for frames/groups/columns that match no existing team. */
  createMissingTeams?: boolean;
}

export interface MappingResult {
  items: WorkItem[];
  risks: Risk[];
  dependencies: Dependency[];
  newTeams: Team[];
  /** Records left out and why. */
  skipped: { id: string; reason: string }[];
  warnings: string[];
}

export interface MappingContext {
  teams: readonly Team[];
  iterations: readonly { id: string; name: string }[];
  /** Group id new teams join. */
  groupId: string;
  now: string;
}

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

/** Pure: turns a board into planning objects according to the mapping. Nothing is saved. */
export function mapBoard(board: Board, mapping: BoardMapping, ctx: MappingContext): MappingResult {
  const result: MappingResult = { items: [], risks: [], dependencies: [], newTeams: [], skipped: [], warnings: [] };
  const teamsByName = new Map(ctx.teams.map((t) => [norm(t.name), t]));
  const newTeamsByName = new Map<string, Team>();
  const iterByName = new Map(ctx.iterations.map((i) => [norm(i.name), i.id]));
  const frameTitle = (id?: string) => board.frames.find((f) => f.id === id)?.title;
  const groupTitle = (id?: string) => board.groups.find((g) => g.id === id)?.title;
  const colTitleToId = new Map(board.columns.map((c) => [norm(c.title), c.id]));
  const col = (name?: string) => (name ? (board.columns.find((c) => c.id === name)?.id ?? colTitleToId.get(norm(name))) : undefined);

  const resolveTeam = (label: string | undefined, recordId: string): string | undefined => {
    if (!label) return undefined;
    const key = norm(label);
    const existing = teamsByName.get(key) ?? newTeamsByName.get(key);
    if (existing) return existing.id;
    if (!mapping.createMissingTeams) {
      result.warnings.push(`"${label}" matches no team (record ${recordId}); turn on "create missing teams" or rename.`);
      return undefined;
    }
    const team: Team = { id: `t-${key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || newTeamsByName.size + 1}`, name: label.trim(), groupId: ctx.groupId, source: "native", capacity: {}, memberIds: [], agentIds: [] };
    newTeamsByName.set(key, team);
    result.newTeams.push(team);
    return team.id;
  };
  const resolveIteration = (label: string | undefined): string | undefined => {
    if (!label) return undefined;
    const key = norm(label);
    for (const [name, id] of iterByName) if (name === key || key.endsWith(name) || name.endsWith(key)) return id;
    return undefined;
  };
  const statusOf = (v: unknown): StatusCategory => {
    const s = norm(v);
    if ((mapping.statusDone ?? ["done", "complete", "completed", "closed"]).map(norm).includes(s)) return "done";
    if ((mapping.statusInProgress ?? ["in progress", "working on it", "doing", "active"]).map(norm).includes(s)) return "in_progress";
    return "todo";
  };
  const idFor = (src: string) => `${board.id}:${src}`;

  if (mapping.from === "nodes") {
    const nodeTeam = new Map<string, string | undefined>();
    for (const n of board.nodes) {
      if (n.fields.placeholder) continue;
      const text = n.text.trim();
      if (!text) {
        result.skipped.push({ id: n.id, reason: "empty text" });
        continue;
      }
      const rule = mapping.colorRules?.find((r) => n.color && norm(n.color).includes(norm(r.color)));
      if (rule?.as === "risk") {
        // Risks are not owned by a team here, so the frame they sit in is not looked up.
        result.risks.push({ id: idFor(n.id), title: text, roam: "unroamed", itemIds: [], raisedAt: ctx.now });
        continue;
      }
      // A card may carry its own team and iteration (iObeya program boards do); otherwise the
      // frame decides, and a "Team · Iteration" frame title gives the team its first part.
      const ownTeam = typeof n.fields.team === "string" && n.fields.team.trim() ? n.fields.team : undefined;
      const ownIteration = typeof n.fields.iteration === "string" ? n.fields.iteration.replace(/\s*\(.*\)$/, "") : undefined;
      const fTitle = frameTitle(n.frameId);
      const teamLabel = mapping.team?.by === "frame" ? (ownTeam ?? (fTitle && !teamsByName.has(norm(fTitle)) && fTitle.includes(" · ") ? fTitle.split(" · ")[0] : fTitle)) : undefined;
      const teamId = resolveTeam(teamLabel, n.id);
      nodeTeam.set(n.id, teamId);
      const iterationId = mapping.iteration?.by === "frame" ? (resolveIteration(ownIteration) ?? resolveIteration(fTitle?.split(" · ").slice(1).join(" · ").replace(/\s*\(.*$/, "")) ?? resolveIteration(fTitle)) : undefined;
      const estimate = typeof n.fields.storyPoints === "number" && n.fields.storyPoints > 0 ? n.fields.storyPoints : undefined;
      const wsjf = n.fields.wsjf as { businessValue?: number } | undefined;
      result.items.push({
        id: idFor(n.id),
        title: text,
        level: mapping.level,
        ...(teamId ? { teamId } : {}),
        ...(iterationId ? { iterationId } : {}),
        ...(estimate ? { estimate } : {}),
        ...(wsjf?.businessValue ? { businessValue: wsjf.businessValue } : {}),
        status: "todo",
        flowType: rule ? rule.as : "feature",
        createdAt: ctx.now,
        source: { system: "native", externalId: n.id, ...(board.origin.url ? { url: board.origin.url } : {}) },
      });
    }
    if (mapping.edgesAsDependencies) {
      const itemIds = new Set(result.items.map((i) => i.id));
      for (const e of board.edges) {
        const p = idFor(e.fromId);
        const c = idFor(e.toId);
        if (itemIds.has(p) && itemIds.has(c)) result.dependencies.push({ id: idFor(e.id), providerId: p, consumerId: c, status: "open", ...(e.label ? { note: e.label } : {}) });
        else result.skipped.push({ id: e.id, reason: "connector between non-items" });
      }
    }
  } else {
    const titleCol = col(mapping.titleColumn) ?? board.columns[0]?.id;
    if (!titleCol) {
      result.warnings.push("The board has no columns to read a title from.");
      return result;
    }
    const teamCol = mapping.team?.by === "column" ? col(mapping.team.column) : undefined;
    const iterCol = mapping.iteration?.by === "column" ? col(mapping.iteration.column) : undefined;
    const estCol = col(mapping.estimateColumn);
    const bvCol = col(mapping.businessValueColumn);
    const statusCol = col(mapping.statusColumn);
    for (const r of board.rows) {
      const title = String(r.cells[titleCol] ?? "").trim();
      if (!title) {
        result.skipped.push({ id: r.id, reason: "empty title" });
        continue;
      }
      const teamLabel = mapping.team?.by === "group" ? groupTitle(r.groupId) : teamCol ? String(r.cells[teamCol] ?? "") : undefined;
      const teamId = resolveTeam(teamLabel || undefined, r.id);
      const iterLabel = mapping.iteration?.by === "group" ? groupTitle(r.groupId) : iterCol ? String(r.cells[iterCol] ?? "") : undefined;
      const iterationId = resolveIteration(iterLabel || undefined);
      const estimate = estCol ? num(r.cells[estCol]) : undefined;
      const businessValue = bvCol ? num(r.cells[bvCol]) : undefined;
      const status = statusCol ? statusOf(r.cells[statusCol]) : "todo";
      result.items.push({
        id: idFor(r.id),
        title,
        level: mapping.level,
        ...(teamId ? { teamId } : {}),
        ...(iterationId ? { iterationId } : {}),
        status,
        flowType: "feature",
        ...(estimate !== undefined ? { estimate } : {}),
        ...(businessValue !== undefined ? { businessValue } : {}),
        createdAt: ctx.now,
        ...(status === "done" ? { doneAt: ctx.now } : {}),
        source: { system: "native", externalId: r.id, ...(board.origin.url ? { url: board.origin.url } : {}) },
      });
    }
  }
  return result;
}
