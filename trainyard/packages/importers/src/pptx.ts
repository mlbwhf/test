// PowerPoint course decks (.pptx) as class templates. A trainer uploads the deck they teach
// from and it becomes a class board kept only in their workspace: nothing from a deck is ever
// bundled with Trainyard, because courseware text belongs to whoever licensed it.
//
// A .pptx is a zip of XML parts. Slides are read in presentation order; from each one come
// the title, the text boxes with their position, size and simple fill, and the tables as rows
// of cells. Placeholders that leave their position to the slide layout (most titles do) take
// it from the layout, then the master. Pictures, charts and SmartArt are counted, not drawn.
//
// The board holds one band per lesson, stacked: a top-level frame "Welcome" or "Lesson N"
// with that lesson's slides inside as frames in rows, so the class viewer shows a tab per
// lesson. Lessons come from the slide title ("Lesson 3 Activity: …", "L3: …"); slides with no
// lesson number go to Welcome. Inside a slide, text boxes keep their place and table cells
// become stickies, with empty and "…" cells left as blank placeholders for learners.

import { emptyBoard, type Board, type BoardNode, type Frame } from "@trainyard/core";
import { slug } from "./files.js";
import { ImportError } from "./types.js";
import { isZip, readZip, type ZipEntry } from "./zip.js";

/** EMU per board unit: a 16:9 slide (12 192 000 × 6 858 000 EMU) becomes 1920 × 1080. */
const EMU = 6350;
const DEFAULT_SLIDE = { cx: 12_192_000, cy: 6_858_000 };
const MAX_SLIDES = 200;
const MAX_NODES = 5000;

export interface DeckText {
  text: string;
  /** Board units from the slide's top-left corner. */
  x: number;
  y: number;
  width: number;
  height: number;
  role: "title" | "body" | "box";
  fill?: string;
  fontSize?: number;
  fontColor?: string;
}

export interface DeckCell {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
}

export interface DeckTable {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Rows of cells; merged-away cells are left out, spanning cells are as wide as their span. */
  rows: DeckCell[][];
}

export interface DeckSlide {
  /** 1-based position in the deck as presented (hidden slides are skipped but still counted). */
  number: number;
  title: string;
  lesson?: number;
  texts: DeckText[];
  tables: DeckTable[];
  /** Pictures, charts and diagrams on the slide, which are not brought across. */
  skipped: number;
}

export interface Deck {
  /** Slide size in board units. */
  width: number;
  height: number;
  slides: DeckSlide[];
  hidden: number;
}

export interface PptxOptions {
  /** File name of the upload, for the board name and origin. */
  fileName: string;
  name?: string;
  id?: string;
  now?: string;
  maxSlides?: number;
  maxNodes?: number;
}

// ---- a small XML reader ---------------------------------------------------------------------
// Office XML is regular: elements, attributes and text, no DTDs. This keeps the tree and
// decodes entities; it is not a validating parser.

interface El {
  name: string;
  attrs: Record<string, string>;
  children: El[];
  text: string;
}

const ENTITIES: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => (e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITIES[e] ?? m)));

function parseXml(src: string): El {
  const root: El = { name: "#root", attrs: {}, children: [], text: "" };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[([\s\S]*?)\]\]>|<!DOCTYPE[^>]*>|<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[\w:.-]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  for (let m: RegExpExecArray | null; (m = re.exec(src)); ) {
    const top = stack[stack.length - 1]!;
    if (m[1] !== undefined) top.text += m[1];
    else if (m[6] !== undefined) top.text += decode(m[6]);
    else if (m[3]) {
      if (m[2]) {
        if (stack.length > 1) stack.pop();
        continue;
      }
      const attrs: Record<string, string> = {};
      for (const a of (m[4] ?? "").matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[a[1]!] = decode(a[2] ?? a[3] ?? "");
      const el: El = { name: m[3], attrs, children: [], text: "" };
      top.children.push(el);
      if (!m[5]) stack.push(el);
    }
  }
  return root;
}

const kid = (el: El | undefined, name: string) => el?.children.find((c) => c.name === name);
const kids = (el: El | undefined, name: string) => el?.children.filter((c) => c.name === name) ?? [];
const path = (el: El | undefined, ...names: string[]) => names.reduce<El | undefined>((e, n) => kid(e, n), el);
function* walk(el: El): Generator<El> {
  yield el;
  for (const c of el.children) yield* walk(c);
}
const first = (el: El | undefined, name: string): El | undefined => {
  if (!el) return undefined;
  for (const e of walk(el)) if (e.name === name) return e;
  return undefined;
};
const int = (v: string | undefined, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// ---- package parts ------------------------------------------------------------------------

/** True when the bytes are a zip holding a PowerPoint presentation. */
export function isPptx(bytes: Buffer): boolean {
  if (!isZip(bytes)) return false;
  try {
    return readZip(bytes).some((e) => e.name === "ppt/presentation.xml");
  } catch {
    return false;
  }
}

function resolvePart(from: string, target: string): string {
  if (target.startsWith("/")) return target.slice(1);
  const parts = from.split("/").slice(0, -1);
  for (const seg of target.split("/")) {
    if (seg === "..") parts.pop();
    else if (seg !== ".") parts.push(seg);
  }
  return parts.join("/");
}

class Package {
  private byName: Map<string, ZipEntry>;
  private cache = new Map<string, El | undefined>();
  constructor(entries: ZipEntry[]) {
    this.byName = new Map(entries.map((e) => [e.name, e]));
  }
  xml(name: string): El | undefined {
    if (!this.cache.has(name)) {
      const e = this.byName.get(name);
      this.cache.set(name, e ? parseXml(e.read().toString("utf8")) : undefined);
    }
    return this.cache.get(name);
  }
  has(name: string) {
    return this.byName.has(name);
  }
  names() {
    return [...this.byName.keys()];
  }
  /** Relationship id → part name, for the part's .rels file. */
  rels(part: string): Map<string, { target: string; type: string }> {
    const dir = part.split("/").slice(0, -1).join("/");
    const file = `${dir ? `${dir}/` : ""}_rels/${part.split("/").pop()}.rels`;
    const out = new Map<string, { target: string; type: string }>();
    for (const r of kids(kid(this.xml(file), "Relationships"), "Relationship")) {
      if (r.attrs.TargetMode === "External" || !r.attrs.Id || !r.attrs.Target) continue;
      out.set(r.attrs.Id, { target: resolvePart(part, r.attrs.Target), type: r.attrs.Type ?? "" });
    }
    return out;
  }
}

// ---- geometry -------------------------------------------------------------------------------

/** Maps EMU in a shape's coordinate space onto slide EMU (groups scale and move their children). */
interface Xf {
  ox: number;
  oy: number;
  sx: number;
  sy: number;
}
const IDENTITY: Xf = { ox: 0, oy: 0, sx: 1, sy: 1 };

interface Box {
  x: number;
  y: number;
  cx: number;
  cy: number;
}

function boxOf(xfrm: El | undefined): Box | undefined {
  const off = kid(xfrm, "a:off");
  const ext = kid(xfrm, "a:ext");
  if (!off || !ext) return undefined;
  return { x: int(off.attrs.x), y: int(off.attrs.y), cx: int(ext.attrs.cx), cy: int(ext.attrs.cy) };
}

function toUnits(b: Box, t: Xf) {
  return { x: Math.round((t.ox + b.x * t.sx) / EMU), y: Math.round((t.oy + b.y * t.sy) / EMU), width: Math.max(1, Math.round((b.cx * t.sx) / EMU)), height: Math.max(1, Math.round((b.cy * t.sy) / EMU)) };
}

function groupXf(grpSpPr: El | undefined, t: Xf): Xf {
  const xfrm = kid(grpSpPr, "a:xfrm");
  const b = boxOf(xfrm);
  const chOff = kid(xfrm, "a:chOff");
  const chExt = kid(xfrm, "a:chExt");
  if (!b || !chOff || !chExt) return t;
  const kx = int(chExt.attrs.cx) ? b.cx / int(chExt.attrs.cx) : 1;
  const ky = int(chExt.attrs.cy) ? b.cy / int(chExt.attrs.cy) : 1;
  return { ox: t.ox + t.sx * (b.x - int(chOff.attrs.x) * kx), oy: t.oy + t.sy * (b.y - int(chOff.attrs.y) * ky), sx: t.sx * kx, sy: t.sy * ky };
}

// ---- text -------------------------------------------------------------------------------------

function textOf(txBody: El | undefined, joiner = "\n"): string {
  const paras = kids(txBody, "a:p").map((p) =>
    p.children
      .map((c) => (c.name === "a:r" || c.name === "a:fld" ? (kid(c, "a:t")?.text ?? "") : c.name === "a:br" ? "\n" : ""))
      .join("")
      .replace(/[\t\v ]+/g, " ")
      .trim(),
  );
  return paras
    .join(joiner)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const srgb = (el: El | undefined) => {
  const v = kid(kid(el, "a:solidFill"), "a:srgbClr")?.attrs.val;
  return v && /^[0-9a-f]{6}$/i.test(v) ? `#${v.toLowerCase()}` : undefined;
};

function runStyle(txBody: El | undefined): { fontSize?: number; fontColor?: string } {
  const rPr = first(txBody, "a:rPr");
  const sz = int(rPr?.attrs.sz);
  const color = srgb(rPr);
  // Font size is in hundredths of a point; a point is 12 700 EMU, two board units.
  return { ...(sz ? { fontSize: Math.round((sz / 100) * (12_700 / EMU)) } : {}), ...(color ? { fontColor: color } : {}) };
}

/** "Lesson 3 Activity: …", "Lesson 6 Discussion …", "L3: …", "L4 Discussion" → 3, 6, 3, 4. */
export function lessonOf(title: string): number | undefined {
  const m = /^\s*(?:lesson|l)\s*(\d{1,3})\b/i.exec(title);
  return m ? Number(m[1]) : undefined;
}

// ---- slides -----------------------------------------------------------------------------------

interface Placeholder {
  type: string;
  idx?: string;
  box?: Box;
}

const SKIP_PLACEHOLDERS = new Set(["sldNum", "dt", "ftr", "hdr", "sldImg"]);

function placeholderOf(sp: El): { type: string; idx?: string } | undefined {
  const ph = path(sp, "p:nvSpPr", "p:nvPr", "p:ph");
  if (!ph) return undefined;
  return { type: ph.attrs.type ?? "body", ...(ph.attrs.idx !== undefined ? { idx: ph.attrs.idx } : {}) };
}

function placeholdersIn(root: El | undefined): Placeholder[] {
  const tree = first(root, "p:spTree");
  if (!tree) return [];
  const out: Placeholder[] = [];
  for (const el of walk(tree)) {
    if (el.name !== "p:sp") continue;
    const ph = placeholderOf(el);
    const box = boxOf(path(el, "p:spPr", "a:xfrm"));
    if (ph) out.push({ ...ph, ...(box ? { box } : {}) });
  }
  return out;
}

const masterType = (t: string) => (t === "ctrTitle" ? "title" : t === "subTitle" || t === "obj" ? "body" : t);

export function readPptx(bytes: Buffer, opts: { maxSlides?: number } = {}): Deck {
  if (!isZip(bytes)) throw new ImportError("UNSUPPORTED", "This file is not a PowerPoint deck (.pptx).");
  const pkg = new Package(readZip(bytes));
  const pres = kid(pkg.xml("ppt/presentation.xml"), "p:presentation");
  if (!pres) throw new ImportError("UNSUPPORTED", "This file is not a PowerPoint deck (.pptx): it has no presentation part.");
  const sz = kid(pres, "p:sldSz");
  const slideW = int(sz?.attrs.cx, DEFAULT_SLIDE.cx) || DEFAULT_SLIDE.cx;
  const slideH = int(sz?.attrs.cy, DEFAULT_SLIDE.cy) || DEFAULT_SLIDE.cy;

  // Presentation order from the slide id list; fall back to slide file numbers.
  const presRels = pkg.rels("ppt/presentation.xml");
  let order = kids(kid(pres, "p:sldIdLst"), "p:sldId")
    .map((s) => presRels.get(s.attrs["r:id"] ?? "")?.target)
    .filter((t): t is string => !!t && pkg.has(t));
  if (!order.length) {
    order = pkg
      .names()
      .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
      .sort((a, b) => int(/(\d+)\.xml$/.exec(a)?.[1]) - int(/(\d+)\.xml$/.exec(b)?.[1]));
  }
  const max = opts.maxSlides ?? MAX_SLIDES;
  if (order.length > max) throw new ImportError("UNSUPPORTED", `This deck has ${order.length} slides; up to ${max} can be imported. Split it into smaller decks.`);

  const layoutCache = new Map<string, { layout: Placeholder[]; master: Placeholder[] }>();
  const inherited = (slidePart: string) => {
    const layoutPart = [...pkg.rels(slidePart).values()].find((r) => r.type.endsWith("/slideLayout"))?.target;
    if (!layoutPart) return { layout: [], master: [] };
    let hit = layoutCache.get(layoutPart);
    if (!hit) {
      const masterPart = [...pkg.rels(layoutPart).values()].find((r) => r.type.endsWith("/slideMaster"))?.target;
      hit = { layout: placeholdersIn(pkg.xml(layoutPart)), master: masterPart ? placeholdersIn(pkg.xml(masterPart)) : [] };
      layoutCache.set(layoutPart, hit);
    }
    return hit;
  };
  const placeholderBox = (slidePart: string, ph: { type: string; idx?: string }): Box | undefined => {
    const { layout, master } = inherited(slidePart);
    const onLayout = (ph.idx !== undefined ? layout.find((p) => p.idx === ph.idx) : undefined) ?? layout.find((p) => p.type === ph.type);
    return onLayout?.box ?? master.find((p) => p.type === masterType(onLayout?.type ?? ph.type))?.box;
  };

  const slides: DeckSlide[] = [];
  let hidden = 0;
  order.forEach((part, i) => {
    const sld = kid(pkg.xml(part), "p:sld");
    if (!sld) return;
    if (sld.attrs.show === "0") {
      hidden++;
      return;
    }
    const slide: DeckSlide = { number: i + 1, title: "", texts: [], tables: [], skipped: 0 };
    let titleText = "";
    const visit = (el: El, t: Xf) => {
      for (const c of el.children) {
        if (c.name === "p:grpSp") visit(c, groupXf(kid(c, "p:grpSpPr"), t));
        else if (c.name === "mc:AlternateContent") {
          const alt = kid(c, "mc:Fallback") ?? kid(c, "mc:Choice");
          if (alt) visit(alt, t);
        } else if (c.name === "p:sp") {
          const ph = placeholderOf(c);
          if (ph && SKIP_PLACEHOLDERS.has(ph.type)) continue;
          const txBody = kid(c, "p:txBody");
          const isTitle = ph?.type === "title" || ph?.type === "ctrTitle";
          const text = textOf(txBody, isTitle ? " " : "\n");
          const spPr = kid(c, "p:spPr");
          const fill = srgb(spPr);
          if (!text && !(fill && txBody)) continue;
          const box = boxOf(kid(spPr, "a:xfrm")) ?? (ph ? placeholderBox(part, ph) : undefined) ?? (isTitle ? { x: slideW * 0.05, y: slideH * 0.04, cx: slideW * 0.9, cy: slideH * 0.14 } : { x: slideW * 0.05, y: slideH * 0.22, cx: slideW * 0.9, cy: slideH * 0.7 });
          if (isTitle && text && !titleText) titleText = text;
          slide.texts.push({ text, ...toUnits(box, t), role: isTitle ? "title" : ph ? "body" : "box", ...(fill ? { fill } : {}), ...runStyle(txBody) });
        } else if (c.name === "p:graphicFrame") {
          const tbl = first(c, "a:tbl");
          const box = boxOf(kid(c, "p:xfrm"));
          if (!tbl || !box) {
            slide.skipped++;
            continue;
          }
          slide.tables.push(tableOf(tbl, box, t));
        } else if (c.name === "p:pic" || c.name === "p:contentPart") slide.skipped++;
      }
    };
    visit(first(sld, "p:spTree") ?? sld, IDENTITY);
    slide.title = (titleText || slide.texts.find((x) => x.text)?.text.split("\n")[0] || `Slide ${i + 1}`).replace(/\s+/g, " ").trim().slice(0, 200);
    const lesson = lessonOf(slide.title);
    if (lesson !== undefined) slide.lesson = lesson;
    slides.push(slide);
  });
  return { width: Math.round(slideW / EMU), height: Math.round(slideH / EMU), slides, hidden };
}

function tableOf(tbl: El, box: Box, t: Xf): DeckTable {
  const colW = kids(kid(tbl, "a:tblGrid"), "a:gridCol").map((g) => int(g.attrs.w));
  const trs = kids(tbl, "a:tr");
  const rowH = trs.map((tr) => int(tr.attrs.h));
  const colX = colW.map((_, i) => colW.slice(0, i).reduce((a, b) => a + b, 0));
  const rowY = rowH.map((_, i) => rowH.slice(0, i).reduce((a, b) => a + b, 0));
  const rows = trs.map((tr, ri) => {
    const cells: DeckCell[] = [];
    kids(tr, "a:tc").forEach((tc, ci) => {
      if (tc.attrs.hMerge === "1" || tc.attrs.vMerge === "1") return;
      const span = Math.max(1, int(tc.attrs.gridSpan, 1));
      const rspan = Math.max(1, int(tc.attrs.rowSpan, 1));
      const cx = colW.slice(ci, ci + span).reduce((a, b) => a + b, 0) || colW[ci] || box.cx / Math.max(1, colW.length);
      const cy = rowH.slice(ri, ri + rspan).reduce((a, b) => a + b, 0) || rowH[ri] || box.cy / Math.max(1, trs.length);
      const fill = srgb(kid(tc, "a:tcPr"));
      cells.push({ text: textOf(kid(tc, "a:txBody")), ...toUnits({ x: box.x + (colX[ci] ?? 0), y: box.y + (rowY[ri] ?? 0), cx, cy }, t), ...(fill ? { fill } : {}) });
    });
    return cells;
  });
  return { ...toUnits(box, t), rows };
}

// ---- the board ------------------------------------------------------------------------------

const GAP = 40;
const PAD = 30;
/** Room above a lesson's slides for its title, and above a slide's content for its own. */
const BAND_HEAD = 110;
const SLIDE_HEAD = 50;
const PER_ROW = 3;
const COLORS = { header: "#0b3d4c", prompt: "#eef0f3", blank: "#fff6c2" };

/** Cells a learner is meant to fill: empty, or only dots, an ellipsis, dashes or underscores. */
const isBlank = (s: string) => /^[\s.…_\-–—]*$/.test(s);

function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

export function deckBoardName(fileName: string): string {
  return fileName.replace(/^.*[\\/]/, "").replace(/\.pptx$/i, "").replace(/[_]+/g, " ").replace(/\s+/g, " ").trim() || "Course deck";
}

/** Turn a parsed deck into a class template board: one band per lesson, a frame per slide. */
export function boardFromDeck(deck: Deck, opts: PptxOptions): Board {
  const now = opts.now ?? new Date().toISOString();
  const name = opts.name ?? deckBoardName(opts.fileName);
  const board = emptyBoard(opts.id ?? `tpl-deck-${slug(name)}`, name, { system: "pptx", externalId: opts.fileName, importedAt: now });
  board.isTemplate = true;
  const frames: Frame[] = [];
  const nodes: BoardNode[] = [];
  const maxNodes = opts.maxNodes ?? MAX_NODES;
  const push = (n: Omit<BoardNode, "tags" | "fields"> & { fields?: Record<string, unknown> }) => {
    if (nodes.length >= maxNodes) throw new ImportError("UNSUPPORTED", `This deck makes more than ${maxNodes} cards; split it into smaller decks.`);
    nodes.push({ tags: [], fields: {}, ...n });
  };

  // Welcome first, then lessons by number; slides keep deck order inside their band.
  const bands = new Map<number, DeckSlide[]>();
  for (const s of deck.slides) {
    const key = s.lesson ?? -1;
    bands.set(key, [...(bands.get(key) ?? []), s]);
  }
  const W = deck.width;
  const H = deck.height + SLIDE_HEAD;
  let y = 0;
  for (const key of [...bands.keys()].sort((a, b) => a - b)) {
    const slides = bands.get(key)!;
    const cols = Math.min(PER_ROW, slides.length);
    const rows = Math.ceil(slides.length / PER_ROW);
    const band: Frame = { id: key < 0 ? "welcome" : `lesson-${key}`, title: key < 0 ? "Welcome" : `Lesson ${key}`, x: 0, y, width: 2 * PAD + cols * W + (cols - 1) * GAP, height: BAND_HEAD + rows * H + (rows - 1) * GAP + PAD };
    frames.push(band);
    slides.forEach((s, i) => {
      const fx = PAD + (i % PER_ROW) * (W + GAP);
      const fy = y + BAND_HEAD + Math.floor(i / PER_ROW) * (H + GAP);
      const f: Frame = { id: `slide-${s.number}`, title: `${s.number}. ${s.title}`, x: fx, y: fy, width: W, height: H, parentId: band.id };
      frames.push(f);
      const ox = fx;
      const oy = fy + SLIDE_HEAD;
      s.texts.forEach((t, k) => {
        const base = { id: `s${s.number}-t${k + 1}`, x: ox + t.x, y: oy + t.y, width: t.width, height: t.height, frameId: f.id };
        if (t.fill && t.role !== "title") {
          push({ ...base, kind: "sticky", text: t.text, color: t.fill, fields: { ...(t.text ? {} : { placeholder: true }), ...(t.fontSize ? { fontSize: t.fontSize } : {}), ...(t.fontColor ? { fontColor: t.fontColor } : isDark(t.fill) ? { fontColor: "#ffffff" } : {}) } });
        } else {
          push({ ...base, kind: "text", text: t.text, fields: { ...(t.role === "title" ? { role: "title", bold: true } : {}), fontSize: t.fontSize ?? (t.role === "title" ? 56 : 32), ...(t.fontColor ? { fontColor: t.fontColor } : {}) } });
        }
      });
      s.tables.forEach((tb, ti) =>
        tb.rows.forEach((row, ri) =>
          row.forEach((c, ci) => {
            const base = { id: `s${s.number}-tbl${ti + 1}-r${ri + 1}c${ci + 1}`, x: ox + c.x, y: oy + c.y, width: c.width, height: c.height, frameId: f.id };
            if (ri === 0) {
              const color = c.fill ?? COLORS.header;
              push({ ...base, kind: "card", text: c.text, color, fields: { header: true, bold: true, ...(isDark(color) ? { fontColor: "#ffffff" } : {}) } });
            } else if (isBlank(c.text)) {
              push({ ...base, kind: "sticky", text: "", color: c.fill ?? COLORS.blank, fields: { placeholder: true } });
            } else {
              push({ ...base, kind: "sticky", text: c.text, color: c.fill ?? COLORS.prompt, fields: c.fill && isDark(c.fill) ? { fontColor: "#ffffff" } : {} });
            }
          }),
        ),
      );
    });
    y += band.height + 2 * GAP;
  }
  board.frames = frames;
  board.nodes = nodes;
  const lessons = [...bands.keys()].filter((k) => k >= 0);
  board.fields = { class: "custom", source: "deck", fileName: opts.fileName, slides: deck.slides.length, hiddenSlides: deck.hidden, lessons: lessons.length, bands: frames.filter((f) => !f.parentId).map((f) => f.title), skipped: deck.slides.reduce((n, s) => n + s.skipped, 0) };
  return board;
}

export function boardFromPptx(bytes: Buffer, opts: PptxOptions): Board {
  return boardFromDeck(readPptx(bytes, opts.maxSlides !== undefined ? { maxSlides: opts.maxSlides } : {}), opts);
}
