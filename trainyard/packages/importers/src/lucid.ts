// Lucid (Lucidchart and Lucidspark), two ways in.
//
// REST API: api.lucid.co with "Lucid-Api-Version: 1" and a bearer credential, either an OAuth2
// user token with lucidchart.document.content:readonly and lucidspark.document.content:readonly
// (plus user.profile for the account name), or an API key. Documents are listed with
// POST /documents/search, paged through the Link header's rel="next" URI; a board is
// GET /documents/{id}/contents, which returns pages, each with items: shapes (class, text areas,
// custom data), lines (two endpoints, connectedTo a shape id) and groups. The contents resource
// carries no canvas positions, so shapes are laid out in a grid inside one frame per page, with
// containers as frames inside it; a bounding box is used when an item has one.
//
// File: "Export → CSV of Shape Data" from either product. One row per page, shape and line:
// Id, Name, Shape Library, Page ID, Contained By, Group, Line Source, Line Destination, Source
// Arrow, Destination Arrow, Status, Text Area 1..n, plus whatever else the document holds
// (Lucidspark adds votes, tags, reactions and comments). No positions or colours, so the same
// layout applies; every column with no slot in the Board model lands in node.fields.

import { emptyBoard, type Board, type BoardNode, type Frame, type NodeKind } from "@trainyard/core";
import { parseCsv, slug } from "./files.js";
import { requestJson, requestJsonWithHeaders, stripHtml, type FetchLike, type Importer, type RemoteBoard } from "./types.js";

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A Lucid document reduced to what both ways in share. */
export interface LucidDoc {
  pages: { id: string; title: string }[];
  shapes: { id: string; page: string; name: string; text: string; containedBy?: string; group?: string; box?: Box; color?: string; tags?: string[]; fields: Record<string, unknown> }[];
  lines: { id: string; from?: string; to?: string; label?: string }[];
}

type Shape = LucidDoc["shapes"][number];

const CARD = 170;
const GAP = 12;
const PAD = 20;
const HEAD = 50;

function kindOf(name: string): NodeKind | "frame" {
  const n = name.toLowerCase();
  if (n.includes("sticky")) return "sticky";
  if (/frame|container|swim ?lane|pool/.test(n)) return "frame";
  if (/^text|text ?block/.test(n)) return "text";
  if (/image|picture|svg/.test(n)) return "image";
  if (n.includes("card")) return "card";
  return "shape";
}

/** Lay a Lucid document out as frames and nodes: one frame per page, containers as frames inside it. */
export function boardFromLucidDoc(board: Board, doc: LucidDoc): Board {
  // Pages the shapes point at but the source did not list still get a frame.
  const pages = [...doc.pages];
  for (const s of doc.shapes) if (s.page && !pages.some((p) => p.id === s.page)) pages.push({ id: s.page, title: `Page ${pages.length + 1}` });
  if (!pages.length && doc.shapes.length) pages.push({ id: "1", title: "Page 1" });
  const shapes = doc.shapes.map((s) => (s.page ? s : { ...s, page: pages[0]!.id }));
  const byId = new Map(shapes.map((s) => [s.id, s]));
  const containers = new Set(shapes.filter((s) => kindOf(s.name) === "frame").map((s) => s.id));
  for (const s of shapes) if (s.containedBy && byId.has(s.containedBy)) containers.add(s.containedBy);
  // A shape sits in its container unless the chain loops back to it, which would hide both.
  const loops = (s: Shape) => {
    const seen = new Set([s.id]);
    for (let c = s.containedBy; c && byId.has(c); c = byId.get(c)!.containedBy) {
      if (seen.has(c)) return true;
      seen.add(c);
    }
    return false;
  };
  const parentOf = (s: Shape) => (s.containedBy && containers.has(s.containedBy) && !loops(s) ? s.containedBy : undefined);
  const children = new Map<string, Shape[]>();
  for (const s of shapes) {
    const key = parentOf(s) ?? `page:${s.page}`;
    children.set(key, [...(children.get(key) ?? []), s]);
  }

  const frames: Frame[] = [];
  const nodes: BoardNode[] = [];
  const frameIdOf = (id: string) => `frame-${id}`;
  const node = (s: Shape, x: number, y: number, w: number, h: number, frameId: string): BoardNode => {
    const kind = kindOf(s.name);
    return {
      id: s.id,
      kind: kind === "frame" ? "shape" : kind,
      text: s.text,
      x,
      y,
      width: w,
      height: h,
      ...(s.color ? { color: s.color } : {}),
      frameId,
      tags: s.tags ?? [],
      fields: { lucidShape: s.name, ...(s.group ? { lucidGroup: s.group } : {}), ...s.fields },
    };
  };

  // Grid layout: loose shapes first, then each container as a frame below them, recursively.
  const place = (key: string, frameId: string, x: number, y: number, width: number, seen: Set<string>): number => {
    const items = children.get(key) ?? [];
    const loose = items.filter((s) => !containers.has(s.id));
    const perRow = Math.max(1, Math.floor((width - 2 * PAD + GAP) / (CARD + GAP)));
    loose.forEach((s, i) => nodes.push(node(s, x + PAD + (i % perRow) * (CARD + GAP), y + Math.floor(i / perRow) * (CARD + GAP), CARD, CARD, frameId)));
    let cy = y + Math.ceil(loose.length / perRow) * (CARD + GAP);
    for (const c of items.filter((s) => containers.has(s.id) && !seen.has(s.id))) {
      seen.add(c.id);
      const f: Frame = { id: frameIdOf(c.id), title: c.text.split("\n")[0] || c.name || "Container", x: x + PAD, y: cy, width: width - 2 * PAD, height: 0, parentId: frameId };
      frames.push(f);
      const inner = place(c.id, f.id, f.x, cy + HEAD, f.width, seen);
      f.height = Math.max(120, inner - cy + PAD);
      cy += f.height + GAP;
    }
    return cy;
  };

  const W = 1400;
  let y = 0;
  for (const p of pages) {
    const onPage = shapes.filter((s) => s.page === p.id);
    const f: Frame = { id: `page-${p.id}`, title: p.title || "Page", x: 0, y, width: W, height: 0 };
    frames.push(f);
    if (onPage.length && onPage.every((s) => s.box)) {
      // Every item has a bounding box: keep the drawing, shifted onto this page's frame.
      const minX = Math.min(...onPage.map((s) => s.box!.x));
      const minY = Math.min(...onPage.map((s) => s.box!.y));
      let right = 0;
      let bottom = 0;
      for (const s of onPage) {
        const b = s.box!;
        const x = b.x - minX + PAD;
        const top = y + HEAD + b.y - minY;
        const parent = parentOf(s);
        if (containers.has(s.id)) frames.push({ id: frameIdOf(s.id), title: s.text.split("\n")[0] || s.name || "Container", x, y: top, width: b.w, height: b.h, parentId: parent ? frameIdOf(parent) : f.id });
        else nodes.push(node(s, x, top, b.w, b.h, parent ? frameIdOf(parent) : f.id));
        right = Math.max(right, x + b.w);
        bottom = Math.max(bottom, top + b.h);
      }
      f.width = Math.max(W, right + PAD);
      f.height = Math.max(120, bottom - y + PAD);
    } else {
      f.height = Math.max(120, place(`page:${p.id}`, f.id, 0, y + HEAD, W, new Set()) - y + PAD);
    }
    y += f.height + 40;
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  board.frames = frames;
  board.nodes = nodes;
  board.edges = doc.lines.flatMap((l) => (l.from && l.to && nodeIds.has(l.from) && nodeIds.has(l.to) ? [{ id: l.id, fromId: l.from, toId: l.to, ...(l.label ? { label: l.label } : {}) }] : []));
  return board;
}

// ---- REST API ----------------------------------------------------------------------------

interface TextArea {
  label?: string;
  text?: string;
}
interface DataPair {
  key?: string;
  value?: unknown;
}
interface ContentItem {
  id: string;
  class?: string;
  textAreas?: TextArea[];
  customData?: DataPair[];
  boundingBox?: Box;
}
interface ContentLine {
  id: string;
  endpoint1?: { style?: string; connectedTo?: string | null };
  endpoint2?: { style?: string; connectedTo?: string | null };
  textAreas?: TextArea[];
}
interface Contents {
  id?: string;
  title?: string;
  product?: string;
  pages?: { id: string; title?: string; index?: number; items?: { shapes?: ContentItem[]; lines?: ContentLine[]; groups?: { id: string; members?: string[] }[] } }[];
}
interface LucidDocument {
  documentId: string;
  title?: string;
  editUrl?: string;
  viewUrl?: string;
  lastModified?: string;
  product?: string;
}

const PRODUCT: Record<string, string> = { lucidchart: "Lucidchart", lucidspark: "Lucidspark", lucidscale: "Lucidscale" };
const textOf = (areas: TextArea[] | undefined) =>
  (areas ?? [])
    .map((a) => stripHtml(a.text))
    .filter(Boolean)
    .join("\n");

export class LucidImporter implements Importer {
  readonly system = "lucid" as const;
  private readonly fetchFn: FetchLike;
  private readonly base: string;

  constructor(
    private readonly token: string,
    opts: { fetch?: FetchLike; baseUrl?: string } = {},
  ) {
    this.fetchFn = opts.fetch ?? fetch;
    this.base = (opts.baseUrl ?? "https://api.lucid.co").replace(/\/+$/, "");
  }

  private headers(extra: Record<string, string> = {}) {
    return { Authorization: `Bearer ${this.token}`, "Lucid-Api-Version": "1", Accept: "application/json", ...extra };
  }

  private get<T>(path: string) {
    return requestJson<T>(this.fetchFn, `${this.base}${path}`, { headers: this.headers() }, "Lucid");
  }

  /** POST /documents/search, following Link rel="next" while it stays on the API host. */
  private async search(pageSize: number, maxPages: number): Promise<LucidDocument[]> {
    const out: LucidDocument[] = [];
    let url: string | undefined = `${this.base}/documents/search?pageSize=${pageSize}`;
    for (let n = 0; url && n < maxPages; n++) {
      const res: { body: LucidDocument[]; headers: Headers } = await requestJsonWithHeaders<LucidDocument[]>(this.fetchFn, url, { method: "POST", headers: this.headers({ "Content-Type": "application/json" }), body: JSON.stringify({ product: ["lucidchart", "lucidspark"] }) }, "Lucid");
      out.push(...(Array.isArray(res.body) ? res.body : []));
      url = nextLink(res.headers.get("Link"), this.base);
    }
    return out;
  }

  async whoami() {
    const me = await this.get<{ fullName?: string; email?: string; username?: string }>("/users/me/profile").catch(() => null);
    // API keys and tokens without user.profile cannot read the profile; a search proves the credential.
    if (!me) await this.search(1, 1);
    return { name: me?.fullName || me?.email || me?.username || "Lucid user" };
  }

  async listBoards(): Promise<RemoteBoard[]> {
    const docs = await this.search(200, 25);
    return docs.map((d) => ({
      id: d.documentId,
      name: d.title || "Untitled",
      ...(d.editUrl || d.viewUrl ? { url: (d.editUrl ?? d.viewUrl)! } : {}),
      ...(d.product ? { container: PRODUCT[d.product] ?? d.product } : {}),
      ...(d.lastModified ? { updatedAt: d.lastModified } : {}),
    }));
  }

  async fetchBoard(externalId: string): Promise<Board> {
    const id = encodeURIComponent(externalId);
    const meta = await this.get<Partial<LucidDocument>>(`/documents/${id}`).catch((): Partial<LucidDocument> => ({}));
    const contents = await this.get<Contents>(`/documents/${id}/contents`);
    const url = meta.editUrl ?? meta.viewUrl;
    const board = emptyBoard(`lucid-${externalId}`, contents.title || meta.title || `Lucid ${externalId}`, { system: "lucid", externalId, importedAt: new Date().toISOString(), ...(url ? { url } : {}) });
    const pages = [...(contents.pages ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
    const doc: LucidDoc = { pages: pages.map((p, i) => ({ id: p.id, title: p.title || `Page ${i + 1}` })), shapes: [], lines: [] };
    for (const p of pages) {
      const groupOf = new Map<string, string>();
      for (const g of p.items?.groups ?? []) for (const m of g.members ?? []) groupOf.set(m, g.id);
      for (const s of p.items?.shapes ?? []) {
        const data = Object.fromEntries((s.customData ?? []).filter((d) => d.key).map((d) => [d.key!, d.value]));
        const box = s.boundingBox && [s.boundingBox.x, s.boundingBox.y, s.boundingBox.w, s.boundingBox.h].every(Number.isFinite) ? s.boundingBox : undefined;
        const group = groupOf.get(s.id);
        doc.shapes.push({ id: s.id, page: p.id, name: s.class ?? "Shape", text: textOf(s.textAreas), ...(group ? { group } : {}), ...(box ? { box } : {}), fields: Object.keys(data).length ? { customData: data } : {} });
      }
      for (const l of p.items?.lines ?? []) {
        const label = textOf(l.textAreas);
        doc.lines.push({ id: l.id, ...(l.endpoint1?.connectedTo ? { from: l.endpoint1.connectedTo } : {}), ...(l.endpoint2?.connectedTo ? { to: l.endpoint2.connectedTo } : {}), ...(label ? { label } : {}) });
      }
    }
    boardFromLucidDoc(board, doc);
    board.fields = { ...(contents.product ? { lucidProduct: contents.product } : {}) };
    return board;
  }
}

/** The rel="next" URI from a Link header, only when it points back at the API host. */
function nextLink(link: string | null, base: string): string | undefined {
  const m = /<([^>]+)>\s*;\s*rel="?next"?/i.exec(link ?? "");
  if (!m) return undefined;
  try {
    const next = new URL(m[1]!, base);
    return next.origin === new URL(base).origin ? next.toString() : undefined;
  } catch {
    return undefined;
  }
}

// ---- CSV of Shape Data -------------------------------------------------------------------

export interface LucidCsvOptions {
  name: string;
  now?: string;
}

const KNOWN = new Set(["id", "name", "shape library", "page id", "contained by", "group", "line source", "line destination", "source arrow", "destination arrow"]);

/** True when the header row is Lucid's "CSV of Shape Data". */
export function isLucidCsvExport(text: string): boolean {
  const headers = parseCsv(text.split(/\r?\n/, 1)[0] ?? "").headers.map((h) => h.trim().toLowerCase());
  return ["id", "name", "shape library", "page id"].every((h) => headers.includes(h));
}

export function boardFromLucidCsv(text: string, opts: LucidCsvOptions): Board {
  const now = opts.now ?? new Date().toISOString();
  const { headers, rows } = parseCsv(text);
  const col = (h: string) => headers.findIndex((x) => x.trim().toLowerCase() === h);
  const at = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  const [cId, cName, cLib, cPage, cIn, cGroup, cFrom, cTo] = ["id", "name", "shape library", "page id", "contained by", "group", "line source", "line destination"].map(col) as [number, number, number, number, number, number, number, number];
  const textCols = headers.map((h, i) => [h, i] as const).filter(([h]) => /^text area \d+$/i.test(h.trim()));
  const colorCol = headers.findIndex((h) => /^(fill )?colou?r$/i.test(h.trim()));
  const tagsCol = headers.findIndex((h) => /^tags?$/i.test(h.trim()));
  const extra = headers.map((h, i) => [h.trim(), i] as const).filter(([h, i]) => !KNOWN.has(h.toLowerCase()) && !/^text area \d+$/i.test(h) && i !== colorCol && i !== tagsCol);

  let documentTitle = "";
  const doc: LucidDoc = { pages: [], shapes: [], lines: [] };
  for (const r of rows) {
    const id = at(r, cId);
    const name = at(r, cName);
    const text = textCols
      .map(([, i]) => at(r, i))
      .filter(Boolean)
      .join("\n");
    if (!id) continue;
    if (/^document$/i.test(name)) {
      documentTitle = text.split("\n")[0] ?? "";
      continue;
    }
    if (/^page$/i.test(name)) {
      doc.pages.push({ id, title: text.split("\n")[0] || `Page ${doc.pages.length + 1}` });
      continue;
    }
    if (/^line$/i.test(name) || at(r, cFrom) || at(r, cTo)) {
      doc.lines.push({ id, ...(at(r, cFrom) ? { from: at(r, cFrom) } : {}), ...(at(r, cTo) ? { to: at(r, cTo) } : {}), ...(text ? { label: text } : {}) });
      continue;
    }
    const fields: Record<string, unknown> = {};
    if (at(r, cLib)) fields.shapeLibrary = at(r, cLib);
    for (const [h, i] of extra) if (at(r, i)) fields[h] = at(r, i);
    const color = at(r, colorCol);
    const tags = at(r, tagsCol)
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean);
    doc.shapes.push({
      id,
      page: at(r, cPage),
      name: name || "Shape",
      text,
      ...(at(r, cIn) ? { containedBy: at(r, cIn) } : {}),
      ...(at(r, cGroup) ? { group: at(r, cGroup) } : {}),
      ...(color ? { color } : {}),
      ...(tags.length ? { tags } : {}),
      fields,
    });
  }
  const board = emptyBoard(`lucid-csv-${slug(opts.name)}-${now.slice(0, 10)}`, opts.name, { system: "lucid", externalId: `csv:${opts.name}`, importedAt: now });
  boardFromLucidDoc(board, doc);
  board.fields = { lucidCsv: true, pages: board.frames.filter((f) => !f.parentId).length, ...(documentTitle ? { documentTitle } : {}) };
  return board;
}
