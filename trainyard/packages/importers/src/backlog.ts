// A planning backlog for the planning room: features with their stories and enablers, read from
// the class handouts (one .xlsx per feature: Item Name, Item Description, Item Type, the size and
// the feature in the description), from a general spreadsheet or CSV with a Feature column, or
// from a tracker's work items (Jira, Azure DevOps) grouped by parent.

import { parseCsv } from "./files.js";
import { isZip, readZip } from "./zip.js";

export interface BacklogStory {
  title: string;
  /** Story points from the handout; 0 when left for the class to size. */
  pts: number;
  enabler?: boolean;
  text?: string;
  note?: string;
}
export interface BacklogFeature {
  n: number;
  title: string;
  stories: BacklogStory[];
}

const ENT: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };
const decode = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => (e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENT[e] ?? m)));
const col = (ref: string) => { let n = 0; for (const ch of ref.replace(/\d+$/, "")) n = n * 26 + (ch.charCodeAt(0) - 64); return n - 1; };

/** The cells of the first worksheet of an .xlsx file, as text, row by row. */
export function xlsxRows(bytes: Buffer): string[][] {
  const entries = readZip(bytes);
  const read = (name: string) => entries.find((e) => e.name === name)?.read().toString("utf8") ?? "";
  const shared: string[] = [];
  for (const si of read("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(decode([...si[1]!.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join("")));
  const sheet = read("xl/worksheets/sheet1.xml") || read(entries.find((e) => /^xl\/worksheets\/sheet\d+\.xml$/.test(e.name))?.name ?? "");
  const rows: string[][] = [];
  for (const r of sheet.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const c of r[1]!.matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[2] ?? "", body = c[3] ?? "";
      let v = "";
      if (/t="s"/.test(attrs)) v = shared[Number(/<v>(\d+)<\/v>/.exec(body)?.[1] ?? -1)] ?? "";
      else if (/t="inlineStr"/.test(attrs)) v = decode([...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""));
      else v = decode(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "");
      cells[col(c[1]!)] = v;
    }
    if (cells.some((x) => x && x.trim())) rows.push(Array.from(cells, (x) => x ?? ""));
  }
  return rows;
}

const clean = (s: string) => s.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim();
const sizeOf = (s: string) => { const m = /SIZE:\s*([\d.]+|__)?/i.exec(s); return m && m[1] && m[1] !== "__" ? Math.round(Number(m[1])) : 0; };
const isEnabler = (type: string, text: string) => /enabler/i.test(type) || /^ENABLER/i.test(text.trim());

/**
 * Rows in the handout format (Item Name, Item Description, Item Type; the description ends with
 * "SIZE: n" and "Feature: #N Name") or any sheet with a Feature column (plus Title/Name,
 * Description, Type, Points/Size columns). Rows without a feature go under `fallback`.
 */
export function backlogFromRows(rows: string[][], fallback = "Backlog"): BacklogFeature[] {
  if (!rows.length) return [];
  const head = rows[0]!.map((h) => h.trim().toLowerCase());
  const ix = (...names: string[]) => head.findIndex((h) => names.some((n) => h === n || h.startsWith(n)));
  const iName = Math.max(ix("item name", "title", "name", "summary", "story"), 0), iDesc = ix("item description", "description", "text"), iType = ix("item type", "type", "kind", "issue type"), iFeat = ix("feature", "parent", "epic"), iPts = ix("size", "points", "story points", "estimate");
  const feats = new Map<string, BacklogFeature>();
  let auto = 0;
  const featureOf = (ref: string) => {
    const m = /#?\s*(\d+)\s*[-–:.]?\s*(.*)$/.exec(ref.trim());
    const n = m ? Number(m[1]) : 0, title = clean(m && m[2] ? m[2] : ref) || fallback;
    const key = title.toLowerCase();
    let f = feats.get(key);
    if (!f) feats.set(key, (f = { n: n || ++auto + 1000, title, stories: [] }));
    return f;
  };
  for (const r of rows.slice(1)) {
    const title = clean(r[iName] ?? "");
    if (!title) continue;
    const desc = r[iDesc] ?? "", type = r[iType] ?? "";
    const featRef = /Feature:\s*(.+)$/im.exec(desc)?.[1] ?? (iFeat >= 0 ? r[iFeat] : "") ?? "";
    const f = featureOf(featRef || fallback);
    let text = desc.split(/\n?\s*Feature:/i)[0] ?? "";
    const note = /NOTE:\s*(.+)/i.exec(text)?.[1]?.trim();
    text = clean(text.replace(/\n?\s*NOTE:.*$/is, "").replace(/\n?\s*SIZE:.*$/is, ""));
    const pts = sizeOf(desc) || (iPts >= 0 && r[iPts] && /^\d+(\.\d+)?$/.test(r[iPts]!.trim()) ? Math.round(Number(r[iPts])) : 0);
    f.stories.push({ title, pts, ...(isEnabler(type, text) ? { enabler: true } : {}), ...(text ? { text } : {}), ...(note ? { note } : {}) });
  }
  return mergeBacklogs([[...feats.values()]]);
}

/** Features and stories from one uploaded file: .xlsx, .csv or .tsv. The file name names the feature when the rows do not. */
export function backlogFromFile(fileName: string, bytes: Buffer): BacklogFeature[] {
  const fallback = clean(fileName.replace(/\.[^.]+$/, "").replace(/^Feature[_ ]?\d+[_ ]?/i, "").replace(/[_-]+/g, " ")) || "Backlog";
  if (isZip(bytes)) return backlogFromRows(xlsxRows(bytes), fallback);
  const text = bytes.toString("utf8").replace(/^﻿/, "");
  const csv = parseCsv(text, /\t/.test(text.split("\n")[0] ?? "") ? "\t" : undefined);
  return backlogFromRows([csv.headers, ...csv.rows], fallback);
}

/** Merges several files' features into one backlog: features of the same title join, numbered ones keep their number, the rest are numbered in order around them. */
export function mergeBacklogs(parts: BacklogFeature[][]): BacklogFeature[] {
  const out: BacklogFeature[] = [];
  for (const f of parts.flat()) {
    const same = out.find((x) => x.title.toLowerCase() === f.title.toLowerCase());
    if (same) same.stories.push(...f.stories);
    else out.push({ ...f, stories: [...f.stories] });
  }
  const used = new Set(out.filter((f) => f.n <= 1000).map((f) => f.n));
  let next = 1;
  for (const f of out) if (f.n > 1000) { while (used.has(next)) next++; f.n = next; used.add(next); }
  return out.sort((a, b) => a.n - b.n);
}

/** A tracker's work items (Jira, Azure DevOps) as a backlog: features with the stories under them. */
export function backlogFromWorkItems(items: { id: string; title: string; level: string; parentId?: string; estimate?: number; flowType?: string }[]): BacklogFeature[] {
  const feats = items.filter((i) => /feature/i.test(i.level));
  const byId = new Map(items.map((i) => [i.id, i]));
  const out: BacklogFeature[] = feats.map((f, k) => ({ n: k + 1, title: f.title, stories: [] }));
  const index = new Map(feats.map((f, k) => [f.id, out[k]!]));
  const loose: BacklogStory[] = [];
  for (const i of items) {
    if (/feature|epic|capability/i.test(i.level)) continue;
    const story: BacklogStory = { title: i.title, pts: Math.round(i.estimate ?? 0), ...(/enabler/i.test(i.flowType ?? "") ? { enabler: true } : {}), text: `${i.id} · ${i.level}` };
    let p = i.parentId ? byId.get(i.parentId) : undefined;
    while (p && !index.has(p.id) && p.parentId) p = byId.get(p.parentId);
    (p && index.get(p.id) ? index.get(p.id)!.stories : loose).push(story);
  }
  if (loose.length) out.push({ n: out.length + 1, title: "Not under a feature", stories: loose });
  return out.filter((f) => f.stories.length || feats.length);
}
