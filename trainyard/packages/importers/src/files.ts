// File imports for everything without a connector: CSV (any export from Excel, Sheets,
// Airtable, Notion, Smartsheet, Jira...) and Trainyard's own JSON board format, which is
// the documented way to bring a board from any other application.

import { emptyBoard, type Board, type BoardEdge, type BoardNode, type Column, type Frame, type Row, type RowGroup } from "@trainyard/core";

/** RFC 4180-ish CSV parser: quotes, escaped quotes, CRLF, and a header row. */
export function parseCsv(text: string, delimiter?: string): { headers: string[]; rows: string[][] } {
  const src = text.replace(/^﻿/, "");
  const d = delimiter ?? detectDelimiter(src);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === d) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ""));
  const headers = (nonEmpty.shift() ?? []).map((h, n) => h.trim() || `Column ${n + 1}`);
  return { headers, rows: nonEmpty };
}

function detectDelimiter(src: string): string {
  const first = src.split(/\r?\n/, 1)[0] ?? "";
  const counts: [string, number][] = [",", ";", "\t", "|"].map((d) => [d, first.split(d).length - 1]);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0]![1] > 0 ? counts[0]![0] : ",";
}

export interface CsvOptions {
  name: string;
  /** Header whose values split rows into groups (e.g. "Team", "Sprint", "List"). */
  groupBy?: string;
  delimiter?: string;
  now?: string;
}

export function boardFromCsv(text: string, opts: CsvOptions): Board {
  const { headers, rows } = parseCsv(text, opts.delimiter);
  const now = opts.now ?? new Date().toISOString();
  const board = emptyBoard(`csv-${slug(opts.name)}-${now.slice(0, 10)}`, opts.name, { system: "csv", externalId: opts.name, importedAt: now });
  const colId = (h: string, n: number) => `c${n + 1}-${slug(h)}`;
  board.columns = headers.map((h, n) => ({ id: colId(h, n), title: h }));
  const groupIdx = opts.groupBy ? headers.findIndex((h) => h.trim().toLowerCase() === opts.groupBy!.trim().toLowerCase()) : -1;
  const groups = new Map<string, RowGroup>();
  board.rows = rows.map((r, i) => {
    const cells: Record<string, unknown> = {};
    headers.forEach((h, n) => (cells[colId(h, n)] = (r[n] ?? "").trim()));
    let groupId: string | undefined;
    if (groupIdx >= 0) {
      const label = (r[groupIdx] ?? "").trim() || "(blank)";
      const id = `g-${slug(label)}`;
      if (!groups.has(id)) groups.set(id, { id, title: label });
      groupId = id;
    }
    return { id: `r${i + 1}`, ...(groupId ? { groupId } : {}), cells };
  });
  board.groups = [...groups.values()];
  return board;
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";
}

/**
 * Trainyard board JSON: the Board shape with everything optional except name. Any tool,
 * script or export that can write this file can bring a board in. Ids are generated when
 * missing; unknown keys on nodes and rows are kept.
 */
export interface BoardJson {
  name: string;
  url?: string;
  source?: string;
  frames?: Partial<Frame>[];
  nodes?: (Partial<BoardNode> & Record<string, unknown>)[];
  edges?: Partial<BoardEdge>[];
  columns?: (Partial<Column> | string)[];
  groups?: Partial<RowGroup>[];
  rows?: (Partial<Row> | Record<string, unknown>)[];
}

export function boardFromJson(input: unknown, now = new Date().toISOString()): Board {
  if (!input || typeof input !== "object") throw new Error("Board JSON must be an object with at least a name.");
  const j = input as BoardJson;
  if (!j.name || typeof j.name !== "string") throw new Error('Board JSON needs a "name".');
  const board = emptyBoard(`json-${slug(j.name)}-${now.slice(0, 10)}`, j.name, { system: "json", externalId: j.source ?? j.name, importedAt: now, ...(typeof j.url === "string" && /^https?:\/\//i.test(j.url) ? { url: j.url } : {}) });
  const num = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);
  board.frames = (j.frames ?? []).map((f, n) => ({ id: String(f.id ?? `f${n + 1}`), title: String(f.title ?? `Frame ${n + 1}`), x: num(f.x), y: num(f.y), width: num(f.width), height: num(f.height), ...(f.parentId ? { parentId: String(f.parentId) } : {}) }));
  board.nodes = (j.nodes ?? []).map((n, i) => {
    const { id, kind, text, x, y, width, height, color, frameId, tags, fields, ...rest } = n;
    return {
      id: String(id ?? `n${i + 1}`),
      kind: (["sticky", "card", "text", "shape", "image", "other"] as const).includes(kind as never) ? (kind as BoardNode["kind"]) : "sticky",
      text: String(text ?? ""),
      x: num(x),
      y: num(y),
      ...(width !== undefined ? { width: num(width) } : {}),
      ...(height !== undefined ? { height: num(height) } : {}),
      ...(color ? { color: String(color) } : {}),
      ...(frameId ? { frameId: String(frameId) } : {}),
      tags: Array.isArray(tags) ? tags.map(String) : [],
      fields: { ...(fields && typeof fields === "object" ? fields : {}), ...rest },
    };
  });
  board.edges = (j.edges ?? []).flatMap((e, n) => (e.fromId && e.toId ? [{ id: String(e.id ?? `e${n + 1}`), fromId: String(e.fromId), toId: String(e.toId), ...(e.label ? { label: String(e.label) } : {}) }] : []));
  const columns: Column[] = (j.columns ?? []).map((c, n) => (typeof c === "string" ? { id: `c${n + 1}-${slug(c)}`, title: c } : { id: String(c.id ?? `c${n + 1}`), title: String(c.title ?? c.id ?? `Column ${n + 1}`), ...(c.type ? { type: String(c.type) } : {}) }));
  board.groups = (j.groups ?? []).map((g, n) => ({ id: String(g.id ?? `g${n + 1}`), title: String(g.title ?? `Group ${n + 1}`), ...(g.color ? { color: String(g.color) } : {}) }));
  const colByTitle = new Map(columns.map((c) => [c.title.toLowerCase(), c.id]));
  board.rows = (j.rows ?? []).map((r, n) => {
    const rec = r as Record<string, unknown>;
    // Either { id, groupId, cells } or a flat object keyed by column title.
    if (rec.cells && typeof rec.cells === "object") return { id: String(rec.id ?? `r${n + 1}`), ...(rec.groupId ? { groupId: String(rec.groupId) } : {}), cells: rec.cells as Record<string, unknown> };
    const cells: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rec)) {
      if (k === "id" || k === "groupId") continue;
      let id = colByTitle.get(k.toLowerCase());
      if (!id) {
        id = `c${columns.length + 1}-${slug(k)}`;
        columns.push({ id, title: k });
        colByTitle.set(k.toLowerCase(), id);
      }
      cells[id] = v;
    }
    return { id: String(rec.id ?? `r${n + 1}`), ...(rec.groupId ? { groupId: String(rec.groupId) } : {}), cells };
  });
  board.columns = columns;
  return board;
}
