"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Board, BoardNode, Frame } from "@trainyard/core";
import { api, type ApiFailure } from "@/lib/api";
import { KIND_LABEL, LinkPicker, type Ref, type RefKind, type RefSummary } from "@/components/link-picker";
import { useDoubleTap, usePanZoom } from "@/lib/touch";
import { cardChoices, type CardType, type ConnectionType } from "@trainyard/core";
import { ActivityEditor } from "@/components/activity-editor";

const refKey = (r: Ref) => `${r.kind}:${r.boardId ? `${r.boardId}/` : ""}${r.id}`;
type Backlink = { boardId: string; boardName: string; nodeId: string; frame?: string; as: "link" | "view" };

const PALETTE: Record<string, string> = {
  light_yellow: "#fff9b1", yellow: "#f5d128", light_green: "#d5f692", green: "#c9df56", dark_green: "#93d275", cyan: "#67c6c0", light_pink: "#ffcee0", pink: "#ea94bb", violet: "#be88c7", red: "#f24726", light_blue: "#a6ccf5", blue: "#6cd8fa", dark_blue: "#9ea9ff", black: "#1a1a1a", gray: "#e6e6e6", orange: "#ff9d48", white: "#ffffff",
};
export const cssColor = (c?: string) => (!c ? "#ffffff" : PALETTE[c] ?? (c.startsWith("#") && c.length === 9 ? c.slice(0, 7) : c));
const SWATCHES = [
  ["#fff6c2", "Feature"],
  ["#dcf3e4", "Enabler"],
  ["#cfe3fb", "AI"],
  ["#fbd9d2", "Risk"],
  ["#ece7fa", "Debt"],
  ["#ffffff", "Note"],
] as const;

type Tool = "select" | "connect";
/** Card fields that are bookkeeping, not something to show. */
const HIDDEN_FIELDS = new Set(["placeholder", "createdBy", "src", "locked", "pin", "studentId", "studentName", "choices"]);
/** Answer buttons on a card: Yes green, No red, Depends amber. */
const CHOICE_COLOR: Record<string, string> = { Y: "#2e8b57", N: "#c2412d", D: "#d98a1c" };
type Rubber = { pointerId: number; from: string; x: number; y: number; moved: boolean; start: { x: number; y: number } };
type Drag = { kind: "node" | "frame"; id: string; dx: number; dy: number; moved: boolean; start: { x: number; y: number }; last: { x: number; y: number } };

/** How long a finger rests on a frame before it picks the frame up instead of panning. */
const LONG_PRESS = 450;

/**
 * Frame titles sit above the frame when there is room (built-in templates leave gaps) and
 * inside its top edge when frames touch (imported program boards tile edge to edge).
 */
function frameTitlePos(f: Frame, all: Frame[]): { x: number; y: number; fontSize: number } {
  const fontSize = Math.max(14, Math.min(96, f.width / 22, f.height / 6, (f.width * 0.95) / Math.max(1, f.title.length * 0.56)));
  const crowded = all.some((o) => o !== f && o.x < f.x + f.width && o.x + o.width > f.x && o.y + o.height <= f.y + 1 && f.y - (o.y + o.height) < fontSize * 1.4);
  return crowded ? { x: f.x + fontSize * 0.5, y: f.y + fontSize * 1.25, fontSize } : { x: f.x + 14, y: f.y - fontSize * 0.45, fontSize };
}

interface ChartData {
  kind: string;
  columns: string[];
  series: { label: string; color?: string; values: (number | null)[] }[];
}

const CHART_COLORS = ["#4f7fc4", "#d4493a", "#e8b931", "#3aa57a", "#8c6bc8", "#e07b39", "#5aa9c9"];

function isDark(color: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return false;
  const v = parseInt(m[1]!, 16);
  const [r, g, b] = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 120;
}

/** Bars, stacked bars or lines from an imported chart's data, drawn inside its card. */
function ChartView({ chart, title, x, y, w, h }: { chart: ChartData; title: string; x: number; y: number; w: number; h: number }) {
  const fs = Math.max(16, Math.min(44, Math.round(w / 40)));
  const pad = { l: fs * 2.6, r: fs * 1, t: fs * 2.4, b: fs * 3.2 };
  const pw = Math.max(10, w - pad.l - pad.r - (chart.series.length > 1 ? w * 0.18 : 0));
  const ph = Math.max(10, h - pad.t - pad.b);
  const stacked = /stack|area/i.test(chart.kind);
  const line = /line/i.test(chart.kind);
  const n = Math.max(1, chart.columns.length);
  const totals = chart.columns.map((_, ci) => chart.series.reduce((s, se) => s + (se.values[ci] ?? 0), 0));
  const max = Math.max(1, ...(stacked ? totals : chart.series.flatMap((se) => se.values.map((v) => v ?? 0))));
  const sx = (ci: number) => x + pad.l + (ci + 0.5) * (pw / n);
  const sy = (v: number) => y + pad.t + ph - (v / max) * ph;
  const bw = (pw / n) * 0.7;
  const color = (si: number) => chart.series[si]?.color ?? CHART_COLORS[si % CHART_COLORS.length]!;
  return (
    <g aria-label={`Chart: ${title}`}>
      <text x={x + w / 2} y={y + fs * 1.4} fontSize={fs} textAnchor="middle" fill="#17212b" fontFamily="var(--font-body)" fontWeight={600}>
        {title}
      </text>
      <line x1={x + pad.l} y1={y + pad.t + ph} x2={x + pad.l + pw} y2={y + pad.t + ph} stroke="#9aa5b1" strokeWidth={2} />
      {[0, 0.5, 1].map((t) => (
        <text key={t} x={x + pad.l - fs * 0.4} y={sy(max * t) + fs * 0.3} fontSize={fs * 0.7} textAnchor="end" fill="#66727f" fontFamily="var(--font-mono)">
          {Math.round(max * t)}
        </text>
      ))}
      {line
        ? chart.series.map((se, si) => (
            <polyline key={si} fill="none" stroke={color(si)} strokeWidth={Math.max(2, fs / 6)} points={se.values.map((v, ci) => (v === null ? "" : `${sx(ci)},${sy(v)}`)).filter(Boolean).join(" ")} />
          ))
        : chart.columns.map((_, ci) => {
            let base = 0;
            return chart.series.map((se, si) => {
              const v = se.values[ci] ?? 0;
              if (stacked) {
                const r = <rect key={`${ci}-${si}`} x={sx(ci) - bw / 2} y={sy(base + v)} width={bw} height={Math.max(0, sy(base) - sy(base + v))} fill={color(si)} />;
                base += v;
                return r;
              }
              const sw = bw / Math.max(1, chart.series.length);
              return <rect key={`${ci}-${si}`} x={sx(ci) - bw / 2 + si * sw} y={sy(v)} width={sw} height={Math.max(0, sy(0) - sy(v))} fill={color(si)} />;
            });
          })}
      {chart.columns.map((c, ci) =>
        n <= 24 || ci % Math.ceil(n / 24) === 0 ? (
          <text key={ci} x={sx(ci)} y={y + pad.t + ph + fs * 1.1} fontSize={fs * 0.62} textAnchor="middle" fill="#4a5663" fontFamily="var(--font-body)">
            {c.length > 10 ? `${c.slice(0, 9)}…` : c}
          </text>
        ) : null,
      )}
      {chart.series.length > 1
        ? chart.series.map((se, si) => (
            <g key={si}>
              <rect x={x + pad.l + pw + fs} y={y + pad.t + si * fs * 1.3} width={fs * 0.8} height={fs * 0.8} fill={color(si)} />
              <text x={x + pad.l + pw + fs * 2.1} y={y + pad.t + si * fs * 1.3 + fs * 0.7} fontSize={fs * 0.7} fill="#4a5663" fontFamily="var(--font-body)">
                {se.label}
              </text>
            </g>
          ))
        : null}
    </g>
  );
}

/** The line that follows the pointer while a connector is drawn. */
function RubberLine({ from, to, color }: { from: readonly [number, number] | null; to: { x: number; y: number }; color: string }) {
  return from ? <line x1={from[0]} y1={from[1]} x2={to.x} y2={to.y} stroke={color} strokeWidth={5} strokeDasharray="10 8" pointerEvents="none" /> : null;
}

function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/)) {
      if (!word) continue;
      if ((line + " " + word).trim().length > width && line) {
        out.push(line);
        line = word;
      } else line = (line + " " + word).trim();
    }
    out.push(line);
  }
  return out;
}

/**
 * Editable canvas: drag cards and frames, add and delete cards, edit text and colour,
 * draw connectors. Every change goes to the API as it happens; the board prop is the
 * source of truth and is refreshed after each save.
 */
export function CanvasEditor({ board, readOnly, onChanged, onError, refs = {}, cardTypes = [], focus = null, fill = false, trainer = true }: { board: Board; readOnly: boolean; onChanged: () => void; onError: (m: string) => void; refs?: Record<string, RefSummary | null>; cardTypes?: CardType[]; /** A top-level frame to show on its own (a class lesson). */ focus?: string | null; /** Fill the screen (full-screen mode). */ fill?: boolean; /** May add pictures, lock them and set up activities (not a learner on a join link). */ trainer?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const panel = useRef<HTMLElement>(null);
  const [nodes, setNodes] = useState<BoardNode[]>(board.nodes);
  const [frames, setFrames] = useState<Frame[]>(board.frames);
  const [selected, setSelected] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connType, setConnType] = useState<string | null>(null);
  const [rubber, setRubber] = useState<Rubber | null>(null);
  const [selEdge, setSelEdge] = useState<string | null>(null);
  const picture = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [picker, setPicker] = useState<null | { mode: "link" | "view" } | { mode: "field"; key: string }>(null);
  const [links, setLinks] = useState<{ nodeId: string; record: RefSummary | null; backlinks: Backlink[] } | null>(null);
  // One drag per pointer, so several people can move cards on one screen at once.
  const drags = useRef(new Map<number, Drag>());
  const pan = usePanZoom(panel, svgRef, zoom, setZoom, 0.5, 10);
  const doubleTap = useDoubleTap();
  const press = useRef(new Map<number, number>());

  useEffect(() => {
    setNodes(board.nodes);
    setFrames(board.frames);
  }, [board]);

  useEffect(() => {
    if (!selected || !nodes.some((n) => n.id === selected)) {
      setLinks(null);
      return;
    }
    let live = true;
    api<{ record: RefSummary | null; backlinks: Backlink[] }>("GET", `/v1/boards/${encodeURIComponent(board.id)}/nodes/${encodeURIComponent(selected)}/backlinks`)
      .then((r) => live && setLinks({ nodeId: selected, record: r.record, backlinks: r.backlinks }))
      .catch(() => live && setLinks(null));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, board]);

  // With a focus (one lesson of a class board), only that frame, the frames inside it and the
  // cards on them are shown, and the view fits to it.
  const { shownFrames, shownNodes } = useMemo(() => {
    const root = focus ? frames.find((f) => f.id === focus) : undefined;
    if (!root) return { shownFrames: frames, shownNodes: nodes };
    const ids = new Set([root.id]);
    for (let grew = true; grew; ) {
      grew = false;
      for (const f of frames) if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) (ids.add(f.id), (grew = true));
    }
    const inside = (n: BoardNode) => n.x >= root.x && n.y >= root.y && n.x < root.x + root.width && n.y < root.y + root.height;
    return { shownFrames: frames.filter((f) => ids.has(f.id)), shownNodes: nodes.filter((n) => (n.frameId ? ids.has(n.frameId) : inside(n))) };
  }, [focus, frames, nodes]);
  useEffect(() => {
    setZoom(1);
    panel.current?.scrollTo({ left: 0, top: 0 });
    setTool("select");
    setConnectFrom(null);
    setSelected(null);
    setSelEdge(null);
  }, [focus]);
  // In a mapping activity, connectors carry one of its connection types, each in its colour.
  const types: ConnectionType[] = useMemo(() => frames.find((f) => f.id === focus)?.activity?.connectionTypes ?? [], [frames, focus]);
  const typeColor = useMemo(() => {
    const m = new Map<string, string>();
    for (const f of frames) for (const t of f.activity?.connectionTypes ?? []) if (!m.has(t.id)) m.set(t.id, t.color);
    return m;
  }, [frames]);
  const counts = useMemo(() => {
    const inside = new Set(shownNodes.map((n) => n.id));
    const c: Record<string, number> = {};
    for (const e of board.edges) if (e.type && (inside.has(e.fromId) || inside.has(e.toId))) c[e.type] = (c[e.type] ?? 0) + 1;
    return c;
  }, [board.edges, shownNodes]);
  useEffect(() => setConnType((t) => (t && types.some((x) => x.id === t) ? t : null)), [types]);
  // Ctrl or Cmd with the wheel (or a trackpad pinch, which browsers send the same way) zooms.
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => Math.min(10, Math.max(0.5, +(z * (e.deltaY < 0 ? 1.1 : 1 / 1.1)).toFixed(3))));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);

  const box = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const f of shownFrames) xs.push(f.x, f.x + f.width), ys.push(f.y, f.y + f.height);
    for (const n of shownNodes) xs.push(n.x, n.x + (n.width ?? 180)), ys.push(n.y, n.y + (n.height ?? 120));
    if (!xs.length) return { x: -40, y: -40, w: 1200, h: 700 };
    const pad = 80;
    const x = Math.min(...xs) - pad;
    // Frame titles sit above their frames: room for them at the top.
    const y = Math.min(...ys) - pad - 40;
    return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y };
  }, [shownFrames, shownNodes]);

  const toBoard = (e: { clientX: number; clientY: number }) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const p = pt.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };
  const save = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      onChanged();
    } catch (e) {
      onError(`${label}: ${(e as ApiFailure).message}`);
      setNodes(board.nodes);
      setFrames(board.frames);
    }
  };
  const center = (id: string) => {
    const n = nodes.find((x) => x.id === id);
    if (n) return [n.x + (n.width ?? 180) / 2, n.y + (n.height ?? 120) / 2] as const;
    const f = frames.find((x) => x.id === id);
    return f ? ([f.x + f.width / 2, f.y + f.height / 2] as const) : null;
  };
  /** Where the line from a card's centre toward `to` leaves the card. */
  const rim = (id: string, to: readonly [number, number]) => {
    const n = nodes.find((x) => x.id === id);
    if (!n) return null;
    const w = (n.width ?? 180) / 2;
    const h = (n.height ?? 120) / 2;
    const dx = to[0] - (n.x + w);
    const dy = to[1] - (n.y + h);
    if (!dx && !dy) return null;
    const k = Math.min(1, dx ? w / Math.abs(dx) : Infinity, dy ? h / Math.abs(dy) : Infinity);
    return [n.x + w + dx * k, n.y + h + dy * k] as const;
  };

  // ---- pointer handling -------------------------------------------------------------
  const grab = (kind: "node" | "frame", id: string, e: { pointerId: number; clientX: number; clientY: number }) => {
    const p = toBoard(e);
    const item = kind === "node" ? nodes.find((n) => n.id === id)! : frames.find((f) => f.id === id)!;
    drags.current.set(e.pointerId, { kind, id, dx: p.x - item.x, dy: p.y - item.y, moved: false, start: { x: item.x, y: item.y }, last: { x: item.x, y: item.y } });
  };
  const startDrag = (kind: "node" | "frame", id: string, e: React.PointerEvent) => {
    if (readOnly) return;
    e.stopPropagation(); // keep the canvas background from clearing the selection or the connect pick
    if (e.button !== 0) return;
    const locked = kind === "node" && !!nodes.find((n) => n.id === id)?.fields.locked;
    if (tool === "connect") {
      // Press on a card and drag to another card, or to a spot on a picture, to connect them.
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      const p = toBoard(e);
      setRubber({ pointerId: e.pointerId, from: kind === "node" && !locked ? id : "", x: p.x, y: p.y, moved: false, start: p });
      return;
    }
    if (locked) {
      // A locked picture is part of the background: it pans and selects, it does not move.
      if (!pan.down(e)) setSelected(id);
      return;
    }
    if ([...drags.current.values()].some((d) => d.id === id)) return; // someone already has it
    // Capture on the card itself, so its click and double-click still land on it.
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    // Frames fill most big boards, so a finger on one pans; resting it there picks the frame up.
    if (kind === "frame" && e.pointerType === "touch") {
      pan.down(e);
      const at = { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY };
      press.current.set(
        e.pointerId,
        window.setTimeout(() => {
          press.current.delete(at.pointerId);
          if (!pan.still(at.pointerId)) return;
          pan.release(at.pointerId);
          grab("frame", id, at);
          navigator.vibrate?.(10);
        }, LONG_PRESS),
      );
      return;
    }
    grab(kind, id, e);
  };
  const onMove = (e: React.PointerEvent) => {
    if (rubber && rubber.pointerId === e.pointerId) {
      const p = toBoard(e);
      setRubber({ ...rubber, x: p.x, y: p.y, moved: rubber.moved || Math.abs(p.x - rubber.start.x) + Math.abs(p.y - rubber.start.y) > 8 });
      return;
    }
    if (pan.move(e)) return;
    const d = drags.current.get(e.pointerId);
    if (!d) return;
    const p = toBoard(e);
    const x = Math.round(p.x - d.dx);
    const y = Math.round(p.y - d.dy);
    if (Math.abs(x - d.start.x) + Math.abs(y - d.start.y) > 2) d.moved = true;
    if (d.kind === "node") setNodes((ns) => ns.map((n) => (n.id === d.id ? { ...n, x, y } : n)));
    else {
      // Step from the last position, not the last render: moves can outpace renders.
      const ddx = x - d.last.x;
      const ddy = y - d.last.y;
      d.last = { x, y };
      setFrames((fs) => fs.map((fr) => (fr.id === d.id ? { ...fr, x, y } : fr)));
      setNodes((ns) => ns.map((n) => (n.frameId === d.id ? { ...n, x: n.x + ddx, y: n.y + ddy } : n)));
    }
  };
  const endDrag = (e: React.PointerEvent) => {
    window.clearTimeout(press.current.get(e.pointerId));
    press.current.delete(e.pointerId);
    if (rubber && rubber.pointerId === e.pointerId) {
      setRubber(null);
      const p = toBoard(e);
      const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest?.("[data-node-id]")?.getAttribute("data-node-id") ?? null;
      const target = hit && !nodes.find((n) => n.id === hit)?.fields.locked ? hit : null;
      const from = rubber.from || connectFrom;
      if (rubber.moved && rubber.from) {
        if (target && target !== rubber.from) connect(rubber.from, target);
        else if (!target) connectToSpot(rubber.from, p);
        setConnectFrom(null);
      } else if (!rubber.moved && from && from !== rubber.from) {
        // Tap, then tap the other end: a card, or a spot on the picture for a new marker.
        if (rubber.from) connect(from, rubber.from);
        else connectToSpot(from, p);
        setConnectFrom(null);
      } else if (rubber.from) setConnectFrom(rubber.from);
      return;
    }
    const tap = pan.up(e);
    if (tap) {
      // A tap on the background clears the selection, as a mouse press does; on a frame it selects it.
      if (tap === "tap" && tool === "connect" && connectFrom) {
        connectToSpot(connectFrom, toBoard(e));
        setConnectFrom(null);
      } else if (tap === "tap") {
        const frame = (e.target as Element).closest?.("[data-frame-id]")?.getAttribute("data-frame-id");
        setSelected(frame ?? null);
        setConnectFrom(null);
      }
      return;
    }
    const d = drags.current.get(e.pointerId);
    drags.current.delete(e.pointerId);
    if (!d) return;
    // Selecting opens the side panel and narrows the canvas, so it waits for the release:
    // the board must not shift under other hands still on it.
    setSelected(d.id);
    if (!d.moved) {
      // Double-tap a card to write on it, the touch twin of double-click.
      if (d.kind === "node" && e.pointerType !== "mouse" && e.type === "pointerup" && doubleTap(d.id, e.clientX, e.clientY)) setEditing({ id: d.id, text: nodes.find((n) => n.id === d.id)?.text ?? "" });
      return;
    }
    if (d.kind === "node") {
      const n = nodes.find((x) => x.id === d.id)!;
      void save("Move card", () => api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/nodes/${encodeURIComponent(n.id)}`, { x: n.x, y: n.y }));
    } else {
      const f = frames.find((x) => x.id === d.id)!;
      void save("Move frame", () => api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/frames/${encodeURIComponent(f.id)}`, { x: f.x, y: f.y }));
    }
  };
  const connect = (from: string, to: string) => void save("Connect", () => api("POST", `/v1/boards/${encodeURIComponent(board.id)}/edges`, { fromId: from, toId: to, ...(connType ? { type: connType } : {}) }));
  /** A connector to a spot with no card: a small marker goes there first, ready to name. */
  const connectToSpot = (from: string, p: { x: number; y: number }) => {
    const inner = [...shownFrames].reverse().find((f) => p.x >= f.x && p.y >= f.y && p.x <= f.x + f.width && p.y <= f.y + f.height);
    void save("Connect", async () => {
      const r = await api<{ node: BoardNode }>("POST", `/v1/boards/${encodeURIComponent(board.id)}/nodes`, { text: "", kind: "shape", x: Math.round(p.x - 70), y: Math.round(p.y - 24), width: 140, height: 48, color: "#17212b", fields: { pin: true }, ...(inner ? { frameId: inner.id } : {}) });
      await api("POST", `/v1/boards/${encodeURIComponent(board.id)}/edges`, { fromId: from, toId: r.node.id, ...(connType ? { type: connType } : {}) });
      setEditing({ id: r.node.id, text: "" });
    });
  };
  const addPicture = (file: File) => {
    if (file.size > 4 * 1024 * 1024) return onError("Pictures up to 4 MB, please.");
    const read = new FileReader();
    read.onload = () => {
      const src = String(read.result);
      const img = new Image();
      img.onload = () => {
        const { f, x, y } = placeFor();
        const width = Math.min(1400, f ? f.width - 40 : 1400);
        const height = Math.round((width * img.naturalHeight) / Math.max(1, img.naturalWidth));
        void save("Add picture", () => api("POST", `/v1/boards/${encodeURIComponent(board.id)}/nodes`, { kind: "image", text: file.name, x, y, width, height, src, fields: { locked: true }, ...(f ? { frameId: f.id } : {}) }));
      };
      img.src = src;
    };
    read.readAsDataURL(file);
  };

  // ---- actions ----------------------------------------------------------------------
  const addCard = () => {
    const f = frames.find((x) => x.id === selected) ?? frames.find((x) => nodes.find((n) => n.id === selected)?.frameId === x.id) ?? shownFrames[0];
    const inFrame = f ? nodes.filter((n) => n.frameId === f.id).length : 0;
    const x = f ? f.x + 20 + (inFrame % 2) * 200 : box.x + 120;
    const y = f ? f.y + 20 + Math.floor(inFrame / 2) * 140 : box.y + 120;
    void save("Add card", async () => {
      const r = await api<{ node: BoardNode }>("POST", `/v1/boards/${encodeURIComponent(board.id)}/nodes`, { text: "", x, y, ...(f ? { frameId: f.id } : {}) });
      setSelected(r.node.id);
      setEditing({ id: r.node.id, text: "" });
    });
  };
  /** Double-click a spot (the background, or a fixed picture or grid) to put a sticky right there. */
  const addStickyAt = (p: { x: number; y: number }) => {
    const inner = [...shownFrames].reverse().find((f) => p.x >= f.x && p.y >= f.y && p.x <= f.x + f.width && p.y <= f.y + f.height);
    void save("Add card", async () => {
      const r = await api<{ node: BoardNode }>("POST", `/v1/boards/${encodeURIComponent(board.id)}/nodes`, { text: "", x: Math.round(p.x - 90), y: Math.round(p.y - 60), ...(inner ? { frameId: inner.id } : {}) });
      setSelected(r.node.id);
      setEditing({ id: r.node.id, text: "" });
    });
  };
  const choose = (n: BoardNode, c: string) => {
    const choice = n.fields.choice === c ? null : c;
    setNodes((ns) => ns.map((x) => (x.id === n.id ? { ...x, fields: { ...x.fields, choice } } : x)));
    void save("Answer", () => api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/nodes/${encodeURIComponent(n.id)}`, { fields: { choice } }));
  };
  const placeFor = () => {
    const f = frames.find((x) => x.id === selected) ?? frames.find((x) => nodes.find((n) => n.id === selected)?.frameId === x.id) ?? shownFrames[0];
    const inFrame = f ? nodes.filter((n) => n.frameId === f.id).length : 0;
    return { f, x: f ? f.x + 20 + (inFrame % 2) * 200 : box.x + 120, y: f ? f.y + 20 + Math.floor(inFrame / 2) * 140 : box.y + 120 };
  };
  const addLinked = (r: RefSummary, asView: boolean) => {
    const { f, x, y } = placeFor();
    setPicker(null);
    void save(asView ? "Embed view" : "Link record", async () => {
      const res = await api<{ node: BoardNode }>("POST", `/v1/boards/${encodeURIComponent(board.id)}/nodes`, { ref: r.ref, x, y, ...(asView ? { kind: "view" } : {}), ...(f ? { frameId: f.id } : {}) });
      setSelected(res.node.id);
    });
  };
  const selNode = nodes.find((n) => n.id === selected);
  const selFrame = frames.find((f) => f.id === selected);
  const unlink = () => selNode && void save("Unlink", () => api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/nodes/${encodeURIComponent(selNode.id)}`, { ref: null, kind: "card" }));
  const setType = (typeId: string) => selNode && void save("Card type", () => api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/nodes/${encodeURIComponent(selNode.id)}`, { typeId: typeId || null }));
  const setField = (key: string, value: string | number | null) => selNode && void save("Card field", () => api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/nodes/${encodeURIComponent(selNode.id)}`, { fields: { [key]: value } }));
  const selType = cardTypes.find((t) => t.id === selNode?.typeId);
  const selRef = selNode?.ref ? refs[refKey(selNode.ref)] : undefined;
  const removeSelected = () => {
    if (!selNode) return;
    const id = selNode.id;
    setSelected(null);
    void save("Delete card", () => api("DELETE", `/v1/boards/${encodeURIComponent(board.id)}/nodes/${encodeURIComponent(id)}`));
  };
  const recolor = (color: string) => {
    if (!selNode) return;
    void save("Colour", () => api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/nodes/${encodeURIComponent(selNode.id)}`, { color }));
  };
  const commitText = () => {
    if (!editing) return;
    const { id, text } = editing;
    setEditing(null);
    const n = nodes.find((x) => x.id === id);
    if (!n || n.text === text) return;
    void save("Edit text", () => api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/nodes/${encodeURIComponent(id)}`, { text }));
  };
  const renameFrame = (title: string) => {
    if (!selFrame || !title.trim() || title === selFrame.title) return;
    void save("Rename frame", () => api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/frames/${encodeURIComponent(selFrame.id)}`, { title }));
  };
  const removeEdge = (edgeId: string) => (setSelEdge(null), void save("Remove connector", () => api("DELETE", `/v1/boards/${encodeURIComponent(board.id)}/edges/${encodeURIComponent(edgeId)}`)));
  const toggleLock = () => selNode && void save("Lock", () => api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/nodes/${encodeURIComponent(selNode.id)}`, { fields: { locked: selNode.fields.locked ? null : true } }));
  const edgeSel = board.edges.find((x) => x.id === selEdge);

  const editingNode = editing ? nodes.find((n) => n.id === editing.id) : undefined;

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row">
          {readOnly ? (
            <span className="chip">Template · read only</span>
          ) : (
            <>
              <button className="btn small" onClick={addCard}>
                + Card
              </button>
              <button className="btn small" onClick={() => setPicker({ mode: "link" })} title="A card that shows a feature, epic, risk, milestone, outcome or a card from another board, live">
                + Link a record
              </button>
              <button className="btn small" onClick={() => setPicker({ mode: "view" })} title="Bring a whole board or canvas in as a live view">
                + Embed a view
              </button>
              {types.length ? null : (
                <button className={`btn small ${tool === "connect" ? "primary" : ""}`} onClick={() => (setTool(tool === "connect" ? "select" : "connect"), setConnectFrom(null))} aria-pressed={tool === "connect"}>
                  {tool === "connect" ? (connectFrom ? "Drag or tap to the other end" : "Press a card and drag") : "Connect"}
                </button>
              )}
              {trainer ? (
                <>
                  <button className="btn small" onClick={() => picture.current?.click()} title="A picture to work on, such as a framework diagram. It stays put; people connect to spots on it.">
                    + Picture
                  </button>
                  <input ref={picture} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(e) => (e.target.files?.[0] && addPicture(e.target.files[0]), (e.target.value = ""))} />
                </>
              ) : null}
              <button className="btn small" onClick={removeSelected} disabled={!selNode}>
                Delete card
              </button>
              <span className="faint" style={{ fontSize: "0.78rem" }}>Drag to move · double-click or double-tap a card to write · pinch or Ctrl+wheel to zoom · Esc deselects</span>
            </>
          )}
        </div>
        <div className="row">
          <button className="btn small ghost" onClick={() => setZoom((z) => Math.max(0.5, +(z / 1.25).toFixed(3)))} aria-label="Zoom out">
            −
          </button>
          <span className="mono faint" style={{ fontSize: "0.78rem", width: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
          <button className="btn small ghost" onClick={() => setZoom((z) => Math.min(10, +(z * 1.25).toFixed(3)))} aria-label="Zoom in">
            +
          </button>
          <button className="btn small ghost" onClick={() => (setZoom(1), panel.current?.scrollTo({ left: 0, top: 0 }))} title="Fit the whole board or lesson in view">
            Fit
          </button>
        </div>
      </div>

      {types.length ? (
        <div className="conn-types" role="group" aria-label="Connection types">
          <span className="eyebrow">Connect</span>
          {types.map((t) => {
            const on = tool === "connect" && connType === t.id;
            return (
              <button key={t.id} className="conn-type" aria-pressed={on} disabled={readOnly} onClick={() => (on ? (setTool("select"), setConnType(null)) : (setTool("connect"), setConnType(t.id)), setConnectFrom(null))} style={{ ["--c" as string]: t.color }}>
                <span className="conn-dot" aria-hidden />
                <span>{t.label}</span>
                <span className="conn-count" aria-label={`${counts[t.id] ?? 0} drawn`}>
                  {counts[t.id] ? `${counts[t.id]} ✓` : "0"}
                </span>
              </button>
            );
          })}
          <span className="faint" style={{ fontSize: "0.78rem" }}>
            {tool === "connect" ? (connectFrom ? "Now tap the other end, or a spot on the picture" : "Press on a card or marker and drag to what it connects with; drop on the picture to mark a new spot") : "Pick a type, then draw from the card"}
          </span>
        </div>
      ) : null}
      <div style={{ display: "grid", gridTemplateColumns: selNode || selFrame || edgeSel ? "minmax(0, 1fr) 260px" : "minmax(0, 1fr)", gap: 14, alignItems: "start" }}>
        <section ref={panel} className="panel" style={{ overflow: "auto", maxHeight: fill ? "calc(100vh - 150px)" : "72vh", position: "relative" }} onKeyDown={(e) => {
            if (e.key === "Escape") (setSelected(null), setEditing(null), setConnectFrom(null), setSelEdge(null));
            if ((e.key === "Delete" || e.key === "Backspace") && selEdge && !editing && !readOnly) removeEdge(selEdge);
          }} tabIndex={-1}>
          <svg
            ref={svgRef}
            viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
            // 100% fits the board to the panel width, whatever the board's own size (built-in
            // templates are ~2,000 units wide, iObeya boards ~10,000); zoom scales from there.
            className="canvas-surface"
            style={{ display: "block", userSelect: "none", touchAction: "none", width: `${zoom * 100}%`, minWidth: 600, height: "auto" }}
            role="img"
            aria-label={`${board.name}${readOnly ? "" : ", editable"}`}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onDoubleClick={(e) => {
              if (readOnly || tool !== "select") return;
              const hit = (e.target as Element).closest?.("[data-node-id]")?.getAttribute("data-node-id");
              if (hit && !nodes.find((n) => n.id === hit)?.fields.locked) return;
              addStickyAt(toBoard(e));
            }}
            onPointerDown={(e) => {
              // Fingers and pens pan and pinch the background; a tap still clears the selection.
              if (tool === "connect" && connectFrom && e.pointerType === "mouse") {
                connectToSpot(connectFrom, toBoard(e));
                setConnectFrom(null);
                return;
              }
              if (pan.down(e)) return;
              setSelected(null);
              setSelEdge(null);
              setConnectFrom(null);
            }}
          >
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" fill="var(--ink-3)" />
              </marker>
              {[...typeColor.entries()].map(([id, c]) => (
                <marker key={id} id={`arrow-${id}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M0 0L10 5L0 10z" fill={c} />
                </marker>
              ))}
              <filter id="lift" x="-10%" y="-10%" width="120%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgb(23,33,43)" floodOpacity="0.14" />
              </filter>
            </defs>
            {shownFrames.map((f) => (
              <g key={f.id} data-frame-id={f.id} onPointerDown={(e) => startDrag("frame", f.id, e)} style={{ cursor: readOnly ? "default" : "grab" }}>
                <rect x={f.x} y={f.y} width={f.width} height={f.height} fill="rgba(255,255,255,0.55)" stroke={selected === f.id ? "var(--signal)" : "rgba(255,255,255,0.9)"} strokeWidth={selected === f.id ? 4 : 2} rx={18} />
                {/* A focused lesson is named by its tab; its own big title would sit over the frames inside. */}
                {f.id === focus ? null : (
                  <text {...frameTitlePos(f, frames)} fontWeight={700} fill="var(--ink)" fontFamily="var(--font-display)">
                    {f.title}
                  </text>
                )}
              </g>
            ))}
            {shownNodes.map((n) => {
              const w = n.width ?? 180;
              const h = n.height ?? (n.kind === "text" ? 60 : 120);
              const placeholder = !!n.fields.placeholder && !n.text.trim();
              const src = typeof n.fields.src === "string" && (n.fields.src.startsWith("data:image/") || n.fields.src.startsWith("/courses/")) ? n.fields.src : undefined;
              const chart = n.fields.chart as ChartData | undefined;
              const fill = n.kind === "text" ? (n.color ? cssColor(n.color) : "transparent") : src ? "transparent" : chart ? "#ffffff" : cssColor(n.color);
              const dark = n.kind !== "text" && !src && !chart && isDark(cssColor(n.color));
              // Text scales with the card, so big imported boards stay readable when zoomed.
              const fs = typeof n.fields.fontSize === "number" ? n.fields.fontSize : Math.max(16, Math.min(40, Math.round(Math.min(w, h * 1.3) / 9)));
              const lh = Math.round(fs * 1.3);
              const lines = chart || src ? [] : wrap(n.text || (placeholder ? "Add a card here" : ""), Math.max(6, Math.floor(w / (fs * 0.56))));
              const isSel = selected === n.id;
              const isFrom = connectFrom === n.id;
              const sum = n.ref ? refs[refKey(n.ref)] : undefined;
              const missing = !!n.ref && sum === null;
              const type = cardTypes.find((t) => t.id === n.typeId);
              const badge = n.ref ? `${KIND_LABEL[n.ref.kind].toUpperCase()}${sum?.status ? ` · ${sum.status.toUpperCase()}` : ""}` : type?.badge ?? "";
              const shownLines = n.ref && sum && n.kind !== "view" ? wrap(sum.title, Math.max(6, Math.floor(w / (fs * 0.56)))) : lines;
              const facts = sum ? Object.entries(sum.facts).slice(0, 2).map(([k, v]) => `${k} ${v}`).join(" · ") : "";
              return (
                <g
                  key={n.id}
                  data-node-id={n.id}
                  onPointerDown={(e) => startDrag("node", n.id, e)}
                  onClick={(e) => e.stopPropagation()}
                  onDoubleClick={() => !readOnly && !n.fields.locked && setEditing({ id: n.id, text: n.text })}
                  style={{ cursor: readOnly ? "default" : tool === "connect" ? "crosshair" : "grab" }}
                  filter={placeholder ? undefined : "url(#lift)"}
                >
                  <rect x={n.x} y={n.y} width={w} height={h} fill={fill} fillOpacity={placeholder ? 0.5 : 1} stroke={isFrom ? "var(--ai)" : isSel ? "var(--signal)" : missing ? "#c2412d" : placeholder ? "var(--line-strong)" : n.ref || n.kind === "view" ? "rgba(23,33,43,0.35)" : "rgba(255,255,255,0.6)"} strokeWidth={isSel || isFrom ? 4 : n.ref ? 2 : 1.5} strokeDasharray={placeholder || missing ? "8 6" : undefined} rx={n.kind === "shape" ? 16 : 12} />
                  {src ? <image href={src} x={n.x} y={n.y} width={w} height={h} preserveAspectRatio="xMidYMid meet" /> : null}
                  {chart ? <ChartView chart={chart} title={n.text} x={n.x} y={n.y} w={w} h={h} /> : null}
                  {n.kind === "view" ? (
                    <g>
                      <rect x={n.x} y={n.y} width={w} height={34} fill="#17212b" rx={12} />
                      <rect x={n.x} y={n.y + 20} width={w} height={14} fill="#17212b" />
                      <text x={n.x + 12} y={n.y + 23} fontSize={14} fill="#fff" fontFamily="var(--font-body)" fontWeight={700}>
                        {(sum?.title ?? n.text).slice(0, 40)}
                      </text>
                      <text x={n.x + w - 12} y={n.y + 23} fontSize={10} textAnchor="end" fill="#cfd8e3" fontFamily="var(--font-body)" letterSpacing={1}>
                        {missing ? "MISSING" : KIND_LABEL[n.ref!.kind].toUpperCase()}
                      </text>
                      {sum?.subtitle ? (
                        <text x={n.x + 12} y={n.y + 54} fontSize={12} fill="#4b5563" fontFamily="var(--font-body)">
                          {sum.subtitle.slice(0, 60)}
                        </text>
                      ) : null}
                      {(sum?.preview ?? []).slice(0, Math.max(0, Math.floor((h - 100) / 22))).map((pv, i) => {
                        const max = Math.max(1, ...(sum?.preview ?? []).map((x) => x.count));
                        return (
                          <g key={pv.label + i}>
                            <text x={n.x + 12} y={n.y + 76 + i * 22} fontSize={11} fill="#17212b" fontFamily="var(--font-body)">
                              {pv.label.slice(0, 28)}
                            </text>
                            <rect x={n.x + w * 0.55} y={n.y + 67 + i * 22} width={Math.max(2, (w * 0.35 * pv.count) / max)} height={11} rx={3} fill="#4f7fc4" />
                            <text x={n.x + w - 12} y={n.y + 76 + i * 22} fontSize={11} textAnchor="end" fill="#4b5563" fontFamily="var(--font-mono)">
                              {pv.count}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  ) : null}
                  {n.kind !== "view"
                    ? shownLines.slice(0, Math.max(1, Math.floor((h - fs * 0.4 - (badge ? fs * 0.9 : 0) - (facts ? fs * 0.8 : 0) - (cardChoices(n).length ? Math.max(28, fs * 1.4) + fs * 0.6 : 0)) / lh))).map((line, i) => (
                        <text key={i} x={n.x + fs * 0.7} y={n.y + fs * 1.3 + (badge ? fs * 0.9 : 0) + i * lh} fontSize={fs} fill={placeholder ? "var(--ink-3)" : typeof n.fields.fontColor === "string" ? n.fields.fontColor : dark ? "#fff" : "#17212b"} fontFamily="var(--font-body)" fontWeight={i === 0 && n.kind !== "text" ? 600 : 400}>
                          {line}
                        </text>
                      ))
                    : null}
                  {badge && n.kind !== "view" ? (
                    <text x={n.x + fs * 0.7} y={n.y + fs * 0.95} fontSize={fs * 0.55} fill={missing ? "#c2412d" : dark ? "#e5e7eb" : "#4b5563"} fontFamily="var(--font-body)" fontWeight={800} letterSpacing={1.2}>
                      {missing ? "MISSING RECORD" : badge}
                    </text>
                  ) : null}
                  {facts && n.kind !== "view" ? (
                    <text x={n.x + fs * 0.7} y={n.y + h - fs * 0.5} fontSize={fs * 0.6} fill={dark ? "#e5e7eb" : "#4b5563"} fontFamily="var(--font-mono)">
                      {facts.slice(0, Math.floor(w / (fs * 0.36)))}
                    </text>
                  ) : null}
                  {n.ref && sum && (n.kind === "view" || !n.fields.link) ? (
                    <a href={sum.href} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      <rect x={n.x + w - 64} y={n.y + h - 26} width={56} height={20} rx={10} fill={n.kind === "view" ? "#17212b" : "rgba(23,33,43,0.75)"} />
                      <text x={n.x + w - 36} y={n.y + h - 12} fontSize={11} textAnchor="middle" fill="#fff" fontFamily="var(--font-body)" fontWeight={600}>
                        Open ↗
                      </text>
                    </a>
                  ) : null}
                  {typeof n.fields.link === "string" ? (
                    <a href={n.fields.link} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                      <rect x={n.x + w - 92} y={n.y + h - 34} width={82} height={26} rx={13} fill="#17212b" />
                      <text x={n.x + w - 51} y={n.y + h - 16} fontSize={13} textAnchor="middle" fill="#fff" fontFamily="var(--font-body)" fontWeight={600}>
                        Open ↗
                      </text>
                    </a>
                  ) : null}
                  {cardChoices(n).map((c, ci) => {
                    const on = n.fields.choice === c;
                    const pw = Math.max(44, fs * 2.4);
                    const ph = Math.max(28, fs * 1.4);
                    const cx = n.x + fs * 0.7 + ci * (pw + 8);
                    const cy = n.y + h - ph - fs * 0.5;
                    return (
                      <g key={c} role="button" aria-pressed={on} aria-label={`Answer ${c}`} style={{ cursor: readOnly ? "default" : "pointer" }} onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()} onClick={(e) => (e.stopPropagation(), !readOnly && choose(n, c))}>
                        <rect x={cx} y={cy} width={pw} height={ph} rx={ph / 2} fill={on ? CHOICE_COLOR[c] ?? "#2f6fbd" : "#ffffff"} stroke={CHOICE_COLOR[c] ?? "#2f6fbd"} strokeWidth={2} />
                        <text x={cx + pw / 2} y={cy + ph * 0.68} fontSize={ph * 0.55} textAnchor="middle" fill={on ? "#fff" : CHOICE_COLOR[c] ?? "#2f6fbd"} fontFamily="var(--font-body)" fontWeight={800}>
                          {c}
                        </text>
                      </g>
                    );
                  })}
                  {typeof n.fields.storyPoints === "number" && n.fields.storyPoints > 0 && !chart ? (
                    <text x={n.x + w - fs * 0.6} y={n.y + h - fs * 0.5} fontSize={fs * 0.8} textAnchor="end" fill={dark ? "#fff" : "#17212b"} fontFamily="var(--font-mono)" opacity={0.75}>
                      {n.fields.storyPoints} pts
                    </text>
                  ) : null}
                </g>
              );
            })}
            {/* Connectors over the cards and pictures they join, so they stay visible on a picture. */}
            {board.edges.filter((e) => !focus || (shownNodes.some((n) => n.id === e.fromId) && shownNodes.some((n) => n.id === e.toId))).map((e) => {
              const ca = center(e.fromId);
              const cb = center(e.toId);
              if (!ca || !cb) return null;
              // From edge to edge of the two cards, so the arrowhead shows.
              const a = rim(e.fromId, cb) ?? ca;
              const b = rim(e.toId, ca) ?? cb;
              const c = e.type ? typeColor.get(e.type) : undefined;
              return (
                <g key={e.id} onPointerDown={(ev) => ev.stopPropagation()} onClick={(ev) => (ev.stopPropagation(), setSelEdge(e.id), setSelected(null))} style={{ cursor: "pointer" }} aria-label={`Connector${e.type ? `: ${types.find((t) => t.id === e.type)?.label ?? e.type}` : ""}`}>
                  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="transparent" strokeWidth={22} />
                  {selEdge === e.id ? <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="var(--signal)" strokeOpacity={0.35} strokeWidth={14} strokeLinecap="round" /> : null}
                  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c ?? "var(--ink-3)"} strokeWidth={c ? 5 : 3} markerEnd={`url(#${c ? `arrow-${e.type}` : "arrow"})`} />
                  {e.label ? (
                    <text x={(a[0] + b[0]) / 2} y={(a[1] + b[1]) / 2 - 8} fontSize={15} textAnchor="middle" fill="var(--ink-2)">
                      {e.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {rubber && rubber.from && rubber.moved ? <RubberLine from={center(rubber.from)} to={rubber} color={(connType && typeColor.get(connType)) || "var(--ai)"} /> : null}
            {editingNode ? (
              <foreignObject x={editingNode.x} y={editingNode.y} width={editingNode.width ?? 180} height={editingNode.height ?? 120}>
                <textarea
                  id={`edit-${editingNode.id}`}
                  aria-label="Card text"
                  autoFocus
                  value={editing!.text}
                  onChange={(e) => setEditing({ id: editingNode.id, text: e.target.value })}
                  onBlur={commitText}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setEditing(null);
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commitText();
                  }}
                  style={{ width: "100%", height: "100%", resize: "none", border: "3px solid var(--signal)", borderRadius: 12, padding: 10, font: "600 17px var(--font-body)", background: cssColor(editingNode.color), color: "#17212b", boxSizing: "border-box" }}
                />
              </foreignObject>
            ) : null}
          </svg>
        </section>

        {edgeSel && !selNode && !selFrame ? (
          <aside className="panel panel-body stack" aria-label="Selected connector">
            <span className="eyebrow">Connector</span>
            <p style={{ fontWeight: 600, lineHeight: 1.3 }}>
              {nodes.find((n) => n.id === edgeSel.fromId)?.text || frames.find((f) => f.id === edgeSel.fromId)?.title || "…"} → {nodes.find((n) => n.id === edgeSel.toId)?.text || frames.find((f) => f.id === edgeSel.toId)?.title || "a marked spot"}
            </p>
            {edgeSel.type ? (
              <span className="row" style={{ gap: 6, fontSize: "0.82rem" }}>
                <span className="conn-dot" style={{ ["--c" as string]: typeColor.get(edgeSel.type) }} aria-hidden />
                {frames.flatMap((f) => f.activity?.connectionTypes ?? []).find((t) => t.id === edgeSel.type)?.label ?? edgeSel.type}
              </span>
            ) : null}
            {!readOnly ? (
              <button className="btn small" onClick={() => removeEdge(edgeSel.id)}>
                Delete connector
              </button>
            ) : null}
          </aside>
        ) : null}
        {selNode ? (
          <aside className="panel panel-body stack" aria-label="Selected card">
            <span className="eyebrow">{selNode.kind === "view" ? "Embedded view" : selNode.ref ? `Linked ${KIND_LABEL[selNode.ref.kind].toLowerCase()}` : "Card"}</span>
            <p style={{ fontWeight: 600, lineHeight: 1.3 }}>{(selRef?.title ?? selNode.text) || <span className="faint">Empty. Double-click to write.</span>}</p>
            {selNode.frameId ? <span className="faint" style={{ fontSize: "0.8rem" }}>In: {frames.find((f) => f.id === selNode.frameId)?.title}</span> : null}
            {selNode.ref ? (
              selRef ? (
                <div className="stack" style={{ gap: 4 }}>
                  {selRef.subtitle ? <span className="faint" style={{ fontSize: "0.8rem" }}>{selRef.subtitle}</span> : null}
                  <table className="table" style={{ fontSize: "0.78rem" }}>
                    <tbody>
                      {Object.entries(selRef.facts).map(([k, v]) => (
                        <tr key={k}>
                          <td className="faint">{k}</td>
                          <td className="mono">{String(v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="row">
                    <a className="btn small" href={selRef.href}>
                      Open ↗
                    </a>
                    {!readOnly ? (
                      <button className="btn small ghost" onClick={unlink}>
                        Unlink
                      </button>
                    ) : null}
                  </div>
                  <span className="faint" style={{ fontSize: "0.74rem" }}>{selNode.kind === "view" ? "A live view of the record; open it to edit." : "Editing the text here renames the record everywhere."}</span>
                </div>
              ) : (
                <div className="notice crit" style={{ fontSize: "0.8rem" }}>
                  The record this card pointed at no longer exists.{" "}
                  {!readOnly ? (
                    <button className="btn small ghost" onClick={unlink}>
                      Unlink
                    </button>
                  ) : null}
                </div>
              )
            ) : null}
            {links && links.nodeId === selNode.id && links.backlinks.length ? (
              <div className="stack" style={{ gap: 2 }}>
                <span className="eyebrow">Also shown on</span>
                {links.backlinks.map((l) => (
                  <a key={`${l.boardId}-${l.nodeId}`} href={`/boards/${encodeURIComponent(l.boardId)}`} style={{ fontSize: "0.8rem" }}>
                    {l.boardName}
                    {l.frame ? ` · ${l.frame}` : ""} {l.as === "view" ? "(as a view)" : ""}
                  </a>
                ))}
              </div>
            ) : null}
            {!readOnly && selNode.kind !== "view" ? (
              <>
                <label className="field">
                  Card type
                  <select className="select" value={selNode.typeId ?? ""} onChange={(e) => setType(e.target.value)}>
                    <option value="">Plain card</option>
                    {cardTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
                {selType?.fields.map((f) => {
                  const v = selNode.fields[f.key];
                  const str = v === undefined || v === null ? "" : String(v);
                  if (f.type === "select")
                    return (
                      <label key={f.key} className="field">
                        {f.label}
                        <select className="select" value={str} onChange={(e) => setField(f.key, e.target.value || null)}>
                          <option value="">–</option>
                          {(f.options ?? []).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  if (f.type === "ref") {
                    const rv = typeof v === "string" && v.includes(":") ? v : "";
                    const [rk, rid] = rv.split(":");
                    const rsum = rk && rid ? refs[refKey({ kind: rk as RefKind, id: rid })] : undefined;
                    return (
                      <div key={f.key} className="field">
                        {f.label}
                        <div className="row">
                          <span style={{ fontSize: "0.82rem" }}>{rsum?.title ?? (rv ? rv : <i className="faint">none</i>)}</span>
                          <button className="btn small ghost" onClick={() => setPicker({ mode: "field", key: f.key })}>
                            Pick…
                          </button>
                          {rv ? (
                            <button className="btn small ghost" onClick={() => setField(f.key, null)}>
                              ×
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                  const inputType = f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "url" ? "url" : "text";
                  return (
                    <label key={f.key} className="field">
                      {f.label}
                      {f.type === "text" ? (
                        <textarea className="input" rows={2} defaultValue={str} onBlur={(e) => e.target.value !== str && setField(f.key, e.target.value || null)} />
                      ) : (
                        <input className="input" type={inputType} defaultValue={str} onBlur={(e) => e.target.value !== str && setField(f.key, e.target.value === "" ? null : f.type === "number" ? Number(e.target.value) : e.target.value)} />
                      )}
                    </label>
                  );
                })}
              </>
            ) : null}
            {!readOnly ? (
              <>
                <span className="eyebrow">Colour</span>
                <div className="row" style={{ gap: 6 }}>
                  {SWATCHES.map(([c, label]) => (
                    <button key={c} className="btn small ce-swatch" title={label} aria-label={`${label} colour`} onClick={() => recolor(c)} style={{ background: c, borderColor: cssColor(selNode.color) === c ? "var(--signal)" : undefined }} />
                  ))}
                </div>
                <div className="row">
                  <button className="btn small" onClick={() => setEditing({ id: selNode.id, text: selNode.text })}>
                    Edit text
                  </button>
                  <button className="btn small" onClick={removeSelected}>
                    Delete
                  </button>
                </div>
                {trainer && selNode.kind === "image" ? (
                  <label className="row" style={{ gap: 6, fontSize: "0.82rem" }}>
                    <input type="checkbox" checked={!!selNode.fields.locked} onChange={toggleLock} /> Locked in place (people connect to spots on it)
                  </label>
                ) : null}
              </>
            ) : null}
            {Object.keys(selNode.fields).filter((k) => !HIDDEN_FIELDS.has(k) && !selType?.fields.some((f) => f.key === k)).length ? (
              <>
                <span className="eyebrow">From the source</span>
                <pre className="mono faint" style={{ fontSize: "0.72rem", whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(Object.fromEntries(Object.entries(selNode.fields).filter(([k]) => !HIDDEN_FIELDS.has(k) && !selType?.fields.some((f) => f.key === k))), null, 1)}</pre>
              </>
            ) : null}
          </aside>
        ) : selFrame ? (
          <aside className="panel panel-body stack" aria-label="Selected frame">
            <span className="eyebrow">Frame</span>
            {readOnly ? (
              <p style={{ fontWeight: 600 }}>{selFrame.title}</p>
            ) : (
              <label className="field">
                Title
                <input id="frame-title" className="input" defaultValue={selFrame.title} onBlur={(e) => renameFrame(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
              </label>
            )}
            <span className="faint" style={{ fontSize: "0.8rem" }}>
              {nodes.filter((n) => n.frameId === selFrame.id && !n.fields.placeholder).length} cards · {Math.round(selFrame.width)}×{Math.round(selFrame.height)}
            </span>
            {!readOnly ? (
              <button className="btn small" onClick={addCard}>
                + Card in this frame
              </button>
            ) : null}
            {!readOnly && trainer ? <ActivityEditor key={selFrame.id} boardId={board.id} frame={selFrame} onSaved={onChanged} onError={onError} /> : null}
          </aside>
        ) : null}
      </div>
      {picker?.mode === "link" ? <LinkPicker title="Link a record to this board" onPick={(r) => addLinked(r, r.kind === "board" || r.kind === "canvas")} onClose={() => setPicker(null)} /> : null}
      {picker?.mode === "view" ? <LinkPicker title="Embed a board or canvas as a live view" kinds={["board", "canvas"]} onPick={(r) => addLinked(r, true)} onClose={() => setPicker(null)} exclude={{ kind: "board", id: board.id }} /> : null}
      {picker?.mode === "field" ? (
        <LinkPicker
          title="Pick a record"
          kinds={selType?.fields.find((f) => f.key === picker.key)?.refKinds}
          onPick={(r) => {
            setField(picker.key, `${r.ref.kind}:${r.ref.id}`);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </div>
  );
}
