// iObeya board exports. iObeya's "export board" produces a zip holding one tab-separated,
// UTF-16 file with a row per entity: the board container (with its layout: program board
// teams and iterations, team board capacity and load, Kanban stages with WIP limits,
// roadmap lanes over dates), placed cards, notes, free text, stickers, charts with their
// data, images and dependency edges, plus the card library, tool sets and assets.
//
// This turns that into a Board kept as close to the original as the model allows: frames
// rebuilt from the container's layout, every placed element at its original position and
// colour, iObeya-specific values (story points, WSJF, iteration, team, stage, dates) kept
// in fields, edges as connectors, board images embedded, chart data kept for drawing, and
// library cards that were never placed parked in their own frame so nothing is lost.
// Unzipping and character decoding happen in the caller; this takes the decoded text.

import { emptyBoard, type Board, type BoardEdge, type BoardNode, type Frame } from "@trainyard/core";
import { parseCsv, slug } from "./files.js";

export interface IobeyaOptions {
  /** File name of the export, used for the board name and id when nothing better is in the data. */
  fileName: string;
  now?: string;
  /** Largest single board image to embed, in bytes of base64; bigger ones become placeholders. */
  maxImageBytes?: number;
  /** Total budget for embedded images. */
  maxTotalImageBytes?: number;
  /**
   * Also bring the card library: cards defined in the room's card sets but never placed on this
   * board. Off by default, because iObeya shares those sets across a room's boards, so they are
   * rarely this board's content. The count is always reported in board.fields.libraryCards.
   */
  includeLibrary?: boolean;
}

type Row = Record<string, string>;

const DEFAULT_CARD = { width: 254, height: 197 };
const LIBRARY_LIMIT = 300;

/** "<com.iobeya.entity.Card;2e67…>" → "2e67…" */
function ref(v: string | undefined): string | undefined {
  const m = /;([^;>]+)>$/.exec(v ?? "");
  return m ? m[1] : undefined;
}

function num(v: string | undefined, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** iObeya stores colours as decimal RGB; -1 means none. */
function color(v: string | undefined): string | undefined {
  const n = Number(v);
  if (!v || !Number.isFinite(n) || n < 0) return undefined;
  return `#${n.toString(16).padStart(6, "0").slice(-6)}`;
}

function json<T>(v: string | undefined): T | undefined {
  if (!v) return undefined;
  try {
    return JSON.parse(v) as T;
  } catch {
    return undefined;
  }
}

function unquote(v: string | undefined): string {
  return (v ?? "").replace(/^"+|"+$/g, "").trim();
}

function dateOf(ms: string | number | undefined): string | undefined {
  const n = Number(ms);
  return Number.isFinite(n) && n > 0 ? new Date(n).toISOString().slice(0, 10) : undefined;
}

function short(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: "UTC" });
}

export function iobeyaBoardName(fileName: string): string {
  const base = fileName.replace(/^.*[\\/]/, "").replace(/\.(zip|csv|tsv|txt)$/i, "");
  return (
    base
      .replace(/-\d+A\d+-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/, "")
      .replace(/_-_/g, " - ")
      .replace(/_/g, " ")
      .trim() || "iObeya board"
  );
}

/** True when the text looks like an iObeya export (tab-separated with iObeya entity classes). */
export function isIobeyaExport(text: string): boolean {
  return /\tclass\t|^class\t|\tclass\r?\n/.test(text.slice(0, 20_000)) && text.includes("com.iobeya.entity.");
}

export function boardFromIobeya(text: string, opts: IobeyaOptions): Board {
  const { headers, rows: raw } = parseCsv(text, "\t");
  const rows: Row[] = raw.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
  // "deleted" is "0" on board elements and empty on assets; anything else is a deleted row.
  const live = rows.filter((r) => (r.deleted ?? "") in { "": 1, "0": 1, false: 1 } && r.isArchived !== "true");
  const of = (cls: string) => live.filter((r) => r.class === `class com.iobeya.entity.${cls}`);
  if (!rows.length || !rows.some((r) => (r.class ?? "").includes("com.iobeya.entity."))) {
    throw new Error("This file is not an iObeya board export: no iObeya entities found.");
  }

  const now = opts.now ?? new Date().toISOString();
  const name = iobeyaBoardName(opts.fileName);
  const containerRow = of("ElementContainer")[0];
  const containerId = containerRow?.id ?? slug(name);
  const board = emptyBoard(`iobeya-${containerId}`, name, { system: "iobeya", externalId: containerId, importedAt: now });
  const W = num(containerRow?.width, 7560) || 7560;
  const H = num(containerRow?.height, 3600) || 3600;
  const kind = containerRow?.entityType ?? "BlankBoardElementContainer";
  const props = (k: string) => containerRow?.[`props.${k}`];
  board.fields = { iobeyaBoardType: kind, width: W, height: H };

  // ---- frames from the container's layout -----------------------------------------------
  const frames: Frame[] = [];
  let frameFor: (x: number, y: number) => string | undefined = () => undefined;
  const iterationNames: string[] = [];

  if (kind === "SafeProgramBoardElementContainer") {
    const header = num(props("columnHeaderHeight"), 280);
    const milestone = props("showMilestoneRow") === "false" ? 0 : num(props("milestoneRowHeight"), 320);
    const rowHeader = num(props("rowHeaderWidth"), 600);
    const count = Math.max(1, num(props("iterationCount"), 5));
    const teams = (json<{ label: string; index: number }[]>(props("teamLabels")) ?? []).filter((t) => t.label?.trim()).sort((a, b) => a.index - b.index);
    const weeks = num(props("weekCountByIteration"), 2);
    const start = num(props("startDate"), 0);
    const iterW = (W - rowHeader) / count;
    const rowH = (H - header - milestone) / Math.max(1, teams.length);
    for (let i = 0; i < count; i++) {
      const from = start ? dateOf(start + i * weeks * 7 * 86_400_000) : undefined;
      const to = start ? dateOf(start + ((i + 1) * weeks * 7 - 1) * 86_400_000) : undefined;
      iterationNames.push(`Iteration ${i + 1}${from && to ? ` (${short(from)} – ${short(to)})` : ""}`);
    }
    if (milestone) frames.push({ id: "milestones", title: "Milestones and events", x: rowHeader, y: header, width: W - rowHeader, height: milestone });
    teams.forEach((t, ti) =>
      iterationNames.forEach((it, ii) =>
        frames.push({ id: `${slug(t.label)}--iteration-${ii + 1}`, title: `${t.label} · ${it}`, x: Math.round(rowHeader + ii * iterW), y: Math.round(header + milestone + ti * rowH), width: Math.round(iterW), height: Math.round(rowH) }),
      ),
    );
    board.fields = { ...board.fields, teams: teams.map((t) => t.label), iterations: iterationNames, startDate: dateOf(start), weeksPerIteration: weeks };
  } else if (kind === "SafeTeamBoardElementContainer") {
    const header = num(props("iterationsHeaderHeight"), 400);
    const height = num(props("iterationsHeight"), 2200);
    const its = json<{ x: number; width: number; velocity?: number; load?: number }[]>(props("iterations")) ?? [];
    const weeks = num(props("weekCountByIteration"), 2);
    const start = num(props("startDate"), 0);
    const team = props("teamLabel") ?? name;
    its.forEach((it, i) => {
      const from = start ? dateOf(start + i * weeks * 7 * 86_400_000) : undefined;
      const to = start ? dateOf(start + ((i + 1) * weeks * 7 - 1) * 86_400_000) : undefined;
      const label = `Iteration ${i + 1}${from && to ? ` (${short(from)} – ${short(to)})` : ""}`;
      iterationNames.push(label);
      const cap = it.velocity !== undefined ? ` · capacity ${it.velocity} · load ${it.load ?? 0}` : "";
      frames.push({ id: `iteration-${i + 1}`, title: `${team} · ${label}${cap}`, x: it.x, y: header, width: it.width, height });
    });
    frames.push({ id: "below-iterations", title: "Objectives, risks and backlog", x: 0, y: header + height, width: W, height: Math.max(200, H - header - height) });
    board.fields = { ...board.fields, team, iterations: iterationNames, capacity: its.map((i) => i.velocity ?? null), load: its.map((i) => i.load ?? null), programBoard: props("programBoardLabel") };
  } else if (kind === "KanbanBoardElementContainer") {
    const stages = json<{ label: string; wipLimit?: number }[]>(props("stages")) ?? [];
    const w = W / Math.max(1, stages.length);
    stages.forEach((s, i) => frames.push({ id: `stage-${i + 1}-${slug(s.label)}`, title: s.wipLimit ? `${s.label} (WIP ${s.wipLimit})` : s.label, x: Math.round(i * w), y: 0, width: Math.round(w), height: H }));
    board.fields = { ...board.fields, stages: stages.map((s) => ({ label: s.label, wipLimit: s.wipLimit ?? 0 })) };
  } else if (kind === "PlanningBoardElementContainer") {
    const header = num(props("columnHeaderHeight"), 200);
    const milestone = props("showMilestoneRow") === "true" ? num(props("milestoneRowHeight"), 320) : 0;
    const rowHeader = num(props("rowHeaderWidth"), 420);
    const lanes = (json<{ label: string; index: number }[]>(props("rowLabels")) ?? []).sort((a, b) => a.index - b.index);
    const laneH = (H - header - milestone) / Math.max(1, lanes.length);
    lanes.forEach((l, i) => {
      if (l.label?.trim()) frames.push({ id: `lane-${i + 1}-${slug(l.label)}`, title: l.label, x: rowHeader, y: Math.round(header + milestone + i * laneH), width: W - rowHeader, height: Math.round(laneH) });
    });
    board.fields = { ...board.fields, lanes: lanes.map((l) => l.label).filter(Boolean), startDate: dateOf(props("startDate")), endDate: dateOf(props("endDate")), timeScales: json(props("timeScales")) };
  }
  if (frames.length) {
    frameFor = (x, y) => frames.find((f) => x >= f.x && x < f.x + f.width && y >= f.y && y < f.y + f.height)?.id;
  }

  // ---- placed elements --------------------------------------------------------------------
  const nodes: BoardNode[] = [];
  type NewNode = { kind: BoardNode["kind"]; text: string; color?: string | undefined; width?: number; height?: number; fields: Record<string, unknown>; tags?: string[] };
  const add = (r: Row, n: NewNode) => {
    const x = num(r.x);
    const y = num(r.y);
    const width = n.width || DEFAULT_CARD.width;
    const height = n.height || DEFAULT_CARD.height;
    const frameId = frameFor(x + width / 2, y + Math.min(height / 2, 60));
    const fields = Object.fromEntries(Object.entries(n.fields).filter(([, v]) => v !== undefined && v !== ""));
    nodes.push({ id: r.id!, x, y, width, height, tags: n.tags ?? [], ...(frameId ? { frameId } : {}), kind: n.kind, text: n.text, ...(n.color ? { color: n.color } : {}), fields });
  };

  const placedCards = of("Card").filter((r) => r.master !== "true");
  for (const r of placedCards) {
    const wsjf = json<{ businessValue?: number; timeCriticality?: number; rROE?: number; jobSize?: number; wsjf?: number }>(r["props.wsjfProps"]);
    const text = (r["props.title"] || r.label0 || r.label || r.name || "").trim();
    const startIteration = num(r.startIteration, 0);
    const teams = unquote(r.teams);
    const fields: Record<string, unknown> = { iobeyaType: r.entityType, iobeyaSet: r.setName };
    if (r["props.storyPoints"]) fields.storyPoints = num(r["props.storyPoints"]);
    if (wsjf && (wsjf.businessValue || wsjf.timeCriticality || wsjf.rROE || wsjf.jobSize)) fields.wsjf = wsjf;
    if (startIteration) {
      fields.iterationIndex = startIteration;
      if (iterationNames[startIteration - 1]) fields.iteration = iterationNames[startIteration - 1];
    }
    if (teams) fields.team = teams;
    if (r.onMilestoneRow === "true") fields.milestone = true;
    if (r.startStage) fields.stageIndex = num(r.startStage);
    for (const k of ["startDate", "endDate", "date"] as const) if (dateOf(r[k])) fields[k] = dateOf(r[k]);
    if (r.inIPSprint === "true") fields.ipIteration = true;
    const tags = [r.entityType === "FeatureCard" ? "feature" : r.entityType === "StoryCard" ? "story" : r.onMilestoneRow === "true" ? "milestone" : "card"];
    add(r, { kind: "card", text, color: color(r.color), width: num(r.width), height: num(r.height), fields, tags });
  }
  for (const r of of("Note")) {
    add(r, { kind: "sticky", text: (r.contentLabel || r.label || r["props.title"] || "").trim(), color: color(r.color), width: num(r.width), height: num(r.height), fields: { iobeyaType: r.entityType || "Note", iobeyaSet: r.setName, colourName: r.name } });
  }
  for (const r of of("Freetext")) {
    add(r, { kind: "text", text: (r.contentLabel || r.label || "").trim(), color: color(r.backgroundColor), width: num(r.width), height: num(r.height), fields: { fontSize: num(r.fontSize, 0) || undefined, fontColor: color(r.fontColor) } });
  }
  for (const r of of("Sticker")) {
    add(r, { kind: "shape", text: r.name || "", width: num(r.width, 64) || 64, height: num(r.height, 64) || 64, fields: { iobeyaType: "Sticker", iobeyaSet: r.setName } , tags: ["sticker"] });
  }

  // Charts: keep the series so they can be drawn and read.
  const chartCols = of("ChartDataColumn");
  const chartRows = of("ChartDataRow");
  const chartCells = of("ChartDataCell");
  for (const r of of("Chart")) {
    const cols = chartCols.filter((c) => ref(c.element) === r.id).sort((a, b) => num(a.index) - num(b.index));
    const series = chartRows.filter((c) => ref(c.element) === r.id).sort((a, b) => num(a.index) - num(b.index));
    const cells = chartCells.filter((c) => ref(c.element) === r.id);
    // A cell's x is the series (data row) index and y the column index; seriesInColumns swaps them.
    const swapped = r.seriesInColumns === "true";
    const value = (row: number, col: number) => {
      const c = cells.find((x) => (swapped ? num(x.x) === col && num(x.y) === row : num(x.x) === row && num(x.y) === col));
      return c ? num(c.val) : null;
    };
    const chart = {
      kind: r.kind || "barChart",
      columns: cols.map((c) => c.label),
      series: series.map((s, si) => ({ label: s.label, color: color(s.color), values: cols.map((_, ci) => value(num(s.index, si), num(cols[ci]!.index, ci))) })),
    };
    add(r, { kind: "other", text: r.label || r.name || "Chart", width: num(r.width, 1200), height: num(r.height, 800), fields: { iobeyaType: "Chart", chart }, tags: ["chart"] });
  }

  // Board images: embed within a budget; the rest stay as labelled placeholders.
  const assets = new Map(of("Asset").map((a) => [a.id!, a]));
  const maxOne = opts.maxImageBytes ?? 1_500_000;
  let budget = opts.maxTotalImageBytes ?? 6_000_000;
  for (const r of of("BoardImage")) {
    const asset = assets.get(ref(r.asset) ?? "");
    const data = asset?.data ?? "";
    const fields: Record<string, unknown> = { iobeyaType: "BoardImage" };
    if (data && asset?.mimeType?.startsWith("image/") && data.length <= maxOne && data.length <= budget) {
      fields.src = `data:${asset.mimeType};base64,${data.replace(/-/g, "+").replace(/_/g, "/")}`;
      budget -= data.length;
    } else if (data) fields.omitted = "image too large to embed";
    add(r, { kind: "image", text: asset?.name || r.name || "Image", width: num(r.width, 800), height: num(r.height, 600), fields, tags: ["image"] });
  }

  // ---- connectors -------------------------------------------------------------------------
  const ids = new Set(nodes.map((n) => n.id));
  const edges: BoardEdge[] = [];
  for (const r of of("Edge")) {
    const from = ref(r.source);
    const to = ref(r.target);
    if (from && to && ids.has(from) && ids.has(to)) edges.push({ id: r.id!, fromId: from, toId: to, ...(r.label ? { label: r.label } : {}) });
  }

  // ---- card library: cards defined on the board but never placed --------------------------
  const placedTitles = new Set(nodes.map((n) => n.text.trim()));
  const library = of("Card")
    .filter((r) => r.master === "true")
    .map((r) => ({ r, text: (r["props.title"] || r.label0 || r.label || "").trim() }))
    .filter(({ text }) => text && !placedTitles.has(text))
    .slice(0, LIBRARY_LIMIT);
  if (library.length && opts.includeLibrary) {
    const perRow = Math.max(1, Math.floor(W / 300));
    const top = H + 300;
    const rowsNeeded = Math.ceil(library.length / perRow);
    frames.push({ id: "card-library", title: `Card library: defined on the board, not placed (${library.length})`, x: 0, y: top, width: W, height: rowsNeeded * 240 + 80 });
    library.forEach(({ r, text }, i) => {
      const wsjf = json<Record<string, number>>(r["props.wsjfProps"]);
      nodes.push({
        id: r.id!,
        kind: "card",
        text,
        x: (i % perRow) * 300 + 20,
        y: top + 60 + Math.floor(i / perRow) * 240,
        width: DEFAULT_CARD.width,
        height: DEFAULT_CARD.height,
        ...(color(r.color) ? { color: color(r.color)! } : {}),
        frameId: "card-library",
        tags: [r.entityType === "FeatureCard" ? "feature" : r.entityType === "StoryCard" ? "story" : "card", "library"],
        fields: { iobeyaType: r.entityType, iobeyaSet: r.setName, library: true, ...(r["props.storyPoints"] ? { storyPoints: num(r["props.storyPoints"]) } : {}), ...(wsjf && Object.values(wsjf).some(Boolean) ? { wsjf } : {}) },
      });
    });
  }

  board.frames = frames;
  board.nodes = nodes;
  board.edges = edges;
  board.fields = { ...board.fields, placed: placedCards.length, libraryCards: library.length };
  return board;
}
