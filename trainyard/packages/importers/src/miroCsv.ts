// Miro's "export board as CSV": the text of every widget, one per line, in reading order,
// with frames and tables as blocks separated by blank lines and HTML-ish titles (<p>…</p>).
// Positions are not in the file (Miro's .rtb backups hold them, encrypted), so the board is
// rebuilt as a column of frames: one per block, holding the block's lines as stickies, or as a
// grid of cards when the block is a table (several columns per row).

import { emptyBoard, type Board, type BoardNode, type Frame } from "@trainyard/core";
import { parseCsv, slug } from "./files.js";

export interface MiroCsvOptions {
  name: string;
  now?: string;
}

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** True when the text looks like a Miro board export rather than a spreadsheet with a header row. */
export function isMiroCsvExport(text: string): boolean {
  const lines = text.split(/\r?\n/).slice(0, 40);
  const quotedSingles = lines.filter((l) => /^"[^"]*"$/.test(l.trim()) || l.trim() === '""').length;
  const blanks = lines.filter((l) => l.trim() === "").length;
  return quotedSingles >= 5 && (blanks > 0 || /<p>/.test(text));
}

export function boardFromMiroCsv(text: string, opts: MiroCsvOptions): Board {
  const now = opts.now ?? new Date().toISOString();
  const board = emptyBoard(`miro-csv-${slug(opts.name)}-${now.slice(0, 10)}`, opts.name, { system: "miro", externalId: `csv:${opts.name}`, importedAt: now });
  const raw = text.replace(/^﻿/, "").split(/\r?\n/);
  // Blocks: runs of non-blank lines.
  const blocks: string[][] = [];
  let cur: string[] = [];
  for (const line of raw) {
    if (line.trim() === "") {
      if (cur.length) blocks.push(cur);
      cur = [];
    } else cur.push(line);
  }
  if (cur.length) blocks.push(cur);

  const frames: Frame[] = [];
  const nodes: BoardNode[] = [];
  const W = 1400;
  const CARD = 170;
  let y = 0;
  let n = 0;
  blocks.forEach((block, bi) => {
    // Parse each line as a CSV row so quotes and commas inside cells survive.
    const rows = block.map((l) => (l.trim() === '""' ? [""] : (parseCsv(`h\n${l}`).rows[0] ?? [l]))).map((r) => r.map(strip));
    const isTable = rows.length >= 2 && rows.filter((r) => r.length > 1).length >= Math.ceil(rows.length / 2);
    let title = "";
    let body = rows;
    const first = rows[0]!;
    if (first.length === 1 && first[0] && (block[0]!.includes("<p>") || (rows.length > 1 && first[0].length < 60 && !isTable))) {
      title = first[0];
      body = rows.slice(1);
    } else if (first.length === 1 && first[0] === "" && rows[1]?.length === 1) {
      // Miro frames often export as an empty line followed by the frame title.
      title = rows[1]![0] ?? "";
      body = rows.slice(2);
    }
    if (!title) title = `Block ${bi + 1}`;
    const f: Frame = { id: `f-${bi + 1}-${slug(title).slice(0, 30)}`, title, x: 0, y, width: W, height: 0 };
    frames.push(f);
    let cy = y + 50;
    if (isTable) {
      const cols = Math.max(...body.map((r) => r.length), 1);
      const cw = Math.max(120, Math.min(260, Math.floor((W - 40) / cols) - 8));
      body.forEach((r, ri) => {
        for (let ci = 0; ci < cols; ci++) {
          const t = r[ci] ?? "";
          nodes.push({ id: `n-${++n}`, kind: "card", text: t, x: 20 + ci * (cw + 8), y: cy + ri * 78, width: cw, height: 70, color: ri === 0 ? "#0b3d4c" : t ? "#eef0f3" : "#ffffff", frameId: f.id, tags: [], fields: ri === 0 ? { fontColor: "#ffffff", fontSize: 13 } : t ? { fontSize: 12 } : { placeholder: true } });
        }
      });
      cy += body.length * 78;
    } else {
      const cells = body.flat().filter((t) => t !== "");
      const perRow = Math.floor((W - 40) / (CARD + 10));
      cells.forEach((t, i) => {
        const long = t.length > 140;
        nodes.push({ id: `n-${++n}`, kind: long ? "text" : "sticky", text: t, x: 20 + (i % perRow) * (CARD + 10), y: cy + Math.floor(i / perRow) * (CARD + 10), width: long ? CARD * 2 + 10 : CARD, height: CARD, color: long ? "#eef0f3" : "#fff6c2", frameId: f.id, tags: [], fields: {} });
      });
      cy += Math.ceil(cells.length / perRow) * (CARD + 10);
    }
    f.height = Math.max(120, cy - y + 20);
    y += f.height + 40;
  });
  board.frames = frames;
  board.nodes = nodes;
  board.fields = { miroCsv: true, blocks: blocks.length };
  return board;
}
