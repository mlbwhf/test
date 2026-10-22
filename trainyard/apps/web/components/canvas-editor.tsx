"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Board, BoardNode, Frame } from "@trainyard/core";
import { api, type ApiFailure } from "@/lib/api";

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
export function CanvasEditor({ board, readOnly, onChanged, onError }: { board: Board; readOnly: boolean; onChanged: () => void; onError: (m: string) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<BoardNode[]>(board.nodes);
  const [frames, setFrames] = useState<Frame[]>(board.frames);
  const [selected, setSelected] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const drag = useRef<{ kind: "node" | "frame"; id: string; dx: number; dy: number; moved: boolean; start: { x: number; y: number } } | null>(null);

  useEffect(() => {
    setNodes(board.nodes);
    setFrames(board.frames);
  }, [board]);

  const box = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const f of frames) xs.push(f.x, f.x + f.width), ys.push(f.y, f.y + f.height);
    for (const n of nodes) xs.push(n.x, n.x + (n.width ?? 180)), ys.push(n.y, n.y + (n.height ?? 120));
    if (!xs.length) return { x: -40, y: -40, w: 1200, h: 700 };
    const pad = 80;
    const x = Math.min(...xs) - pad;
    const y = Math.min(...ys) - pad;
    return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y };
  }, [frames, nodes]);

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

  // ---- pointer handling -------------------------------------------------------------
  const startDrag = (kind: "node" | "frame", id: string, e: React.PointerEvent) => {
    if (readOnly) return;
    e.stopPropagation(); // keep the canvas background from clearing the selection or the connect pick
    if (tool !== "select") return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const p = toBoard(e);
    const item = kind === "node" ? nodes.find((n) => n.id === id)! : frames.find((f) => f.id === id)!;
    drag.current = { kind, id, dx: p.x - item.x, dy: p.y - item.y, moved: false, start: { x: item.x, y: item.y } };
    setSelected(id);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toBoard(e);
    const x = Math.round(p.x - d.dx);
    const y = Math.round(p.y - d.dy);
    if (Math.abs(x - d.start.x) + Math.abs(y - d.start.y) > 2) d.moved = true;
    if (d.kind === "node") setNodes((ns) => ns.map((n) => (n.id === d.id ? { ...n, x, y } : n)));
    else {
      const f = frames.find((x) => x.id === d.id)!;
      const ddx = x - f.x;
      const ddy = y - f.y;
      setFrames((fs) => fs.map((fr) => (fr.id === d.id ? { ...fr, x, y } : fr)));
      setNodes((ns) => ns.map((n) => (n.frameId === d.id ? { ...n, x: n.x + ddx, y: n.y + ddy } : n)));
    }
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    if (d.kind === "node") {
      const n = nodes.find((x) => x.id === d.id)!;
      void save("Move card", () => api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/nodes/${encodeURIComponent(n.id)}`, { x: n.x, y: n.y }));
    } else {
      const f = frames.find((x) => x.id === d.id)!;
      void save("Move frame", () => api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/frames/${encodeURIComponent(f.id)}`, { x: f.x, y: f.y }));
    }
  };
  const clickNode = (id: string) => {
    if (tool !== "connect") return;
    if (!connectFrom) setConnectFrom(id);
    else if (connectFrom !== id) {
      const from = connectFrom;
      setConnectFrom(null);
      void save("Connect", () => api("POST", `/v1/boards/${encodeURIComponent(board.id)}/edges`, { fromId: from, toId: id }));
    }
  };

  // ---- actions ----------------------------------------------------------------------
  const addCard = () => {
    const f = frames.find((x) => x.id === selected) ?? frames.find((x) => nodes.find((n) => n.id === selected)?.frameId === x.id) ?? frames[0];
    const inFrame = f ? nodes.filter((n) => n.frameId === f.id).length : 0;
    const x = f ? f.x + 20 + (inFrame % 2) * 200 : box.x + 120;
    const y = f ? f.y + 20 + Math.floor(inFrame / 2) * 140 : box.y + 120;
    void save("Add card", async () => {
      const r = await api<{ node: BoardNode }>("POST", `/v1/boards/${encodeURIComponent(board.id)}/nodes`, { text: "", x, y, ...(f ? { frameId: f.id } : {}) });
      setSelected(r.node.id);
      setEditing({ id: r.node.id, text: "" });
    });
  };
  const selNode = nodes.find((n) => n.id === selected);
  const selFrame = frames.find((f) => f.id === selected);
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
  const removeEdge = (edgeId: string) => void save("Remove connector", () => api("DELETE", `/v1/boards/${encodeURIComponent(board.id)}/edges/${encodeURIComponent(edgeId)}`));

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
              <button className={`btn small ${tool === "connect" ? "primary" : ""}`} onClick={() => (setTool(tool === "connect" ? "select" : "connect"), setConnectFrom(null))} aria-pressed={tool === "connect"}>
                {tool === "connect" ? (connectFrom ? "Pick the card it feeds" : "Pick the first card") : "Connect"}
              </button>
              <button className="btn small" onClick={removeSelected} disabled={!selNode}>
                Delete card
              </button>
              <span className="faint" style={{ fontSize: "0.78rem" }}>Drag to move · double-click a card to write · Esc deselects</span>
            </>
          )}
        </div>
        <div className="row">
          <button className="btn small ghost" onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))} aria-label="Zoom out">
            −
          </button>
          <span className="mono faint" style={{ fontSize: "0.78rem", width: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
          <button className="btn small ghost" onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))} aria-label="Zoom in">
            +
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selNode || selFrame ? "minmax(0, 1fr) 260px" : "minmax(0, 1fr)", gap: 14, alignItems: "start" }}>
        <section className="panel" style={{ overflow: "auto", maxHeight: "72vh", position: "relative" }} onKeyDown={(e) => e.key === "Escape" && (setSelected(null), setEditing(null), setConnectFrom(null))} tabIndex={-1}>
          <svg
            ref={svgRef}
            viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
            width={Math.max(600, (box.w * zoom) / 2)}
            height={Math.max(300, (box.h * zoom) / 2)}
            style={{ display: "block", userSelect: "none", touchAction: "none" }}
            role="img"
            aria-label={`${board.name}${readOnly ? "" : ", editable"}`}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
            onPointerDown={() => (setSelected(null), setConnectFrom(null))}
          >
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
                <path d="M0 0L10 5L0 10z" fill="var(--ink-3)" />
              </marker>
              <filter id="lift" x="-10%" y="-10%" width="120%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="rgb(23,33,43)" floodOpacity="0.14" />
              </filter>
            </defs>
            {frames.map((f) => (
              <g key={f.id} onPointerDown={(e) => startDrag("frame", f.id, e)} style={{ cursor: readOnly ? "default" : "grab" }}>
                <rect x={f.x} y={f.y} width={f.width} height={f.height} fill="rgba(255,255,255,0.55)" stroke={selected === f.id ? "var(--signal)" : "rgba(255,255,255,0.9)"} strokeWidth={selected === f.id ? 4 : 2} rx={18} />
                <text x={f.x + 14} y={f.y - 12} fontSize={Math.max(18, Math.min(32, f.width / 24))} fontWeight={700} fill="var(--ink)" fontFamily="var(--font-display)">
                  {f.title}
                </text>
              </g>
            ))}
            {board.edges.map((e) => {
              const a = center(e.fromId);
              const b = center(e.toId);
              if (!a || !b) return null;
              return (
                <g key={e.id} onClick={() => !readOnly && removeEdge(e.id)} style={{ cursor: readOnly ? "default" : "pointer" }}>
                  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="transparent" strokeWidth={18} />
                  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="var(--ink-3)" strokeWidth={3} markerEnd="url(#arrow)" />
                  {e.label ? (
                    <text x={(a[0] + b[0]) / 2} y={(a[1] + b[1]) / 2 - 8} fontSize={15} textAnchor="middle" fill="var(--ink-2)">
                      {e.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
            {nodes.map((n) => {
              const w = n.width ?? 180;
              const h = n.height ?? (n.kind === "text" ? 60 : 120);
              const placeholder = !!n.fields.placeholder && !n.text.trim();
              const fill = n.kind === "text" ? "transparent" : cssColor(n.color);
              const dark = /^#?(1|2|3|black)/i.test(n.color ?? "");
              const lines = wrap(n.text || (placeholder ? "Add a card here" : ""), Math.max(8, Math.floor(w / 10)));
              const isSel = selected === n.id;
              const isFrom = connectFrom === n.id;
              return (
                <g
                  key={n.id}
                  data-node-id={n.id}
                  onPointerDown={(e) => startDrag("node", n.id, e)}
                  onClick={(e) => (e.stopPropagation(), clickNode(n.id))}
                  onDoubleClick={() => !readOnly && setEditing({ id: n.id, text: n.text })}
                  style={{ cursor: readOnly ? "default" : tool === "connect" ? "crosshair" : "grab" }}
                  filter={placeholder ? undefined : "url(#lift)"}
                >
                  <rect x={n.x} y={n.y} width={w} height={h} fill={fill} fillOpacity={placeholder ? 0.5 : 1} stroke={isFrom ? "var(--ai)" : isSel ? "var(--signal)" : placeholder ? "var(--line-strong)" : "rgba(255,255,255,0.6)"} strokeWidth={isSel || isFrom ? 4 : 1.5} strokeDasharray={placeholder ? "8 6" : undefined} rx={n.kind === "shape" ? 16 : 12} />
                  {lines.slice(0, Math.max(1, Math.floor(h / 24))).map((line, i) => (
                    <text key={i} x={n.x + 14} y={n.y + 28 + i * 24} fontSize={18} fill={placeholder ? "var(--ink-3)" : dark ? "#fff" : "#17212b"} fontFamily="var(--font-body)" fontWeight={i === 0 ? 600 : 400}>
                      {line}
                    </text>
                  ))}
                </g>
              );
            })}
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

        {selNode ? (
          <aside className="panel panel-body stack" aria-label="Selected card">
            <span className="eyebrow">Card</span>
            <p style={{ fontWeight: 600, lineHeight: 1.3 }}>{selNode.text || <span className="faint">Empty. Double-click to write.</span>}</p>
            {selNode.frameId ? <span className="faint" style={{ fontSize: "0.8rem" }}>In: {frames.find((f) => f.id === selNode.frameId)?.title}</span> : null}
            {!readOnly ? (
              <>
                <span className="eyebrow">Colour</span>
                <div className="row" style={{ gap: 6 }}>
                  {SWATCHES.map(([c, label]) => (
                    <button key={c} className="btn small" title={label} aria-label={`${label} colour`} onClick={() => recolor(c)} style={{ background: c, width: 34, height: 28, padding: 0, borderColor: cssColor(selNode.color) === c ? "var(--signal)" : undefined }} />
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
              </>
            ) : null}
            {Object.keys(selNode.fields).filter((k) => k !== "placeholder" && k !== "createdBy").length ? (
              <>
                <span className="eyebrow">From the source</span>
                <pre className="mono faint" style={{ fontSize: "0.72rem", whiteSpace: "pre-wrap", margin: 0 }}>{JSON.stringify(Object.fromEntries(Object.entries(selNode.fields).filter(([k]) => k !== "placeholder" && k !== "createdBy")), null, 1)}</pre>
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
          </aside>
        ) : null}
      </div>
    </div>
  );
}
