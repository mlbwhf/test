"use client";

// The workspace's lane board (design handoff "Trainyard Workspace"): cards drag between lanes
// with pointer events (mouse, pen, touch), lanes enforce their rules on drop (soft capacity,
// WIP limits, hard seats, the Mutation human gate), and a dock adds sticky notes, ink and
// timeboxes. Board or list view, zoom, smart-board mode for a room screen, and copy-as-text.
// The parent owns the cards and persists moves; notes, timers and ink go through onExtras.

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { checkDrop, laneLoad, laneMarkdown, type LaneCard, type LaneNote, type LaneRule } from "@trainyard/core";
import { THEMES, type ThemeId } from "@/lib/themes";
import { api } from "@/lib/api";

export interface Lane extends LaneRule {
  sub?: string;
  /** Lane width in board pixels (columns layout). */
  w?: number;
}

export interface Extras {
  notes: LaneNote[];
  strokes: string[];
}

interface Props {
  title: string;
  theme: ThemeId;
  lanes: Lane[];
  cards: LaneCard[];
  /** Columns side by side, or rows stacked (OKR alignment). */
  layout?: "cols" | "rows";
  cardHeight?: number;
  /** Persist a move. Rules were already checked; throw to undo it. */
  onMove?: (cardId: string, lane: string, index: number) => void | Promise<void>;
  /** Read-only preview: no drag, no dock. */
  readOnly?: boolean;
  extras?: Extras;
  onExtras?: (x: Extras) => void;
  /** Toast text after a successful move (default: none). */
  movedText?: (card: LaneCard, lane: Lane) => string | null;
  /** Shown above the board, beside the controls (stat chips, the train strip). */
  strip?: ReactNode;
  /** Card actions rendered at the bottom of each card. */
  cardFoot?: (c: LaneCard) => ReactNode;
}

const GAP = 16;
const PAD = 24;
const HEAD_COLS = 92;
const HEAD_ROWS = 84;
const uid = () => Math.random().toString(36).slice(2, 10);

type Geo = { lane: Lane; x: number; y: number; w: number; h: number; hh: number; cols: number; cw: number; ch: number; cards: LaneCard[] };

function geometry(lanes: Lane[], cards: LaneCard[], layout: "cols" | "rows", ch: number, equal: boolean, width: number): Geo[] {
  const out: Geo[] = [];
  let x = PAD;
  let y = PAD;
  for (const lane of lanes) {
    const rows = layout === "rows";
    const w = rows ? Math.max(640, width - PAD * 2) : (lane.w ?? 240);
    const cols = rows ? Math.max(1, Math.floor((w - 24) / 280)) : 1;
    const hh = rows ? HEAD_ROWS : HEAD_COLS;
    const cw = (w - 24 - (cols - 1) * 10) / cols;
    const mine = cards.filter((c) => c.lane === lane.id);
    const h = Math.max(rows ? 150 : 520, hh + Math.ceil(mine.length / cols) * (ch + 10) + 20);
    out.push({ lane, x: rows ? PAD : x, y: rows ? y : PAD, w, h, hh, cols, cw, ch, cards: mine });
    if (rows) y += h + 18;
    else x += w + GAP;
  }
  if (equal && layout === "cols") {
    const m = Math.max(...out.map((g) => g.h));
    for (const g of out) g.h = m;
  }
  return out;
}

function slot(g: Geo, i: number) {
  return { x: g.x + 12 + (i % g.cols) * (g.cw + 10), y: g.y + g.hh + Math.floor(i / g.cols) * (g.ch + 10) };
}

export function LaneBoard({ title, theme, lanes, cards, layout = "cols", cardHeight = 78, onMove, readOnly, extras, onExtras, movedText, strip, cardFoot }: Props) {
  const th = THEMES[theme];
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  const [view, setView] = useState<"board" | "list">("board");
  const [scale, setScale] = useState(1);
  const [smart, setSmart] = useState(false);
  const [tool, setTool] = useState<"select" | "note" | "pen">("select");
  const [tone, setTone] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number; x: number; y: number; moved: boolean; over: string | null; note?: boolean } | null>(null);
  const [pen, setPen] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [local, setLocal] = useState<LaneCard[]>(cards);
  const notes = extras?.notes ?? [];
  const strokes = extras?.strokes ?? [];
  useEffect(() => setLocal(cards), [cards]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth / scale));
    ro.observe(el);
    return () => ro.disconnect();
  }, [scale]);
  useEffect(() => {
    if (window.innerWidth < 760) setScale(0.62);
  }, []);

  const say = useCallback((t: string) => {
    setToast(t);
    window.setTimeout(() => setToast((x) => (x === t ? null : x)), 3400);
  }, []);

  const geo = useMemo(() => geometry(lanes, local, layout, cardHeight, !!th.equal, width), [lanes, local, layout, cardHeight, th.equal, width]);
  const innerW = Math.max(...geo.map((g) => g.x + g.w), ...notes.map((n) => n.x + 200), 900) + 120;
  const innerH = Math.max(...geo.map((g) => g.y + g.h), ...notes.map((n) => n.y + 140), 560) + 120;
  const sc = smart ? 1.25 : scale;

  const setExtras = (x: Partial<Extras>) => onExtras?.({ notes, strokes, ...x });

  // Timers tick here; they are saved when started, paused or reset, not every second.
  const [, tick] = useState(0);
  const running = notes.some((n) => n.kind === "timer" && n.running);
  const startedAt = useRef<Record<string, { at: number; from: number }>>({});
  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      tick((n) => n + 1);
      for (const n of notes) {
        const s = startedAt.current[n.id];
        if (n.kind === "timer" && n.running && s && s.from - Math.floor((Date.now() - s.at) / 1000) <= 0) {
          delete startedAt.current[n.id];
          setExtras({ notes: notes.map((x) => (x.id === n.id ? { ...x, seconds: 0, running: false } : x)) });
          say("Time's up");
        }
      }
    }, 1000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, notes]);
  const secondsLeft = (n: LaneNote) => {
    const s = startedAt.current[n.id];
    return n.running && s ? Math.max(0, s.from - Math.floor((Date.now() - s.at) / 1000)) : (n.seconds ?? 300);
  };

  const toBoard = (e: { clientX: number; clientY: number }) => {
    const r = wrap.current!.querySelector(".lb-inner")!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / sc, y: (e.clientY - r.top) / sc };
  };
  const laneAt = (p: { x: number; y: number }) => geo.find((g) => p.x >= g.x && p.x <= g.x + g.w && p.y >= g.y && p.y <= g.y + g.h) ?? null;

  const commitMove = async (card: LaneCard, g: Geo, p: { x: number; y: number }) => {
    const row = Math.max(0, Math.floor((p.y - g.y - g.hh) / (g.ch + 10)));
    const col = Math.max(0, Math.min(g.cols - 1, Math.floor((p.x - g.x - 12) / (g.cw + 10))));
    const index = Math.min(row * g.cols + col, g.cards.filter((c) => c.id !== card.id).length);
    const verdict = checkDrop(g.lane, card, local);
    if (!verdict.ok) return say(verdict.reason);
    const before = local;
    const rest = local.filter((c) => c.id !== card.id);
    const inLane = rest.filter((c) => c.lane === g.lane.id);
    const at = index < inLane.length ? rest.indexOf(inLane[index]!) : inLane.length ? rest.indexOf(inLane[inLane.length - 1]!) + 1 : rest.length;
    setLocal([...rest.slice(0, at), { ...card, lane: g.lane.id }, ...rest.slice(at)]);
    if (verdict.warning) say(verdict.warning);
    else if (card.lane !== g.lane.id) {
      const t = movedText?.(card, g.lane);
      if (t) say(t);
    }
    try {
      await onMove?.(card.id, g.lane.id, index);
    } catch (e) {
      setLocal(before);
      say((e as Error).message || "Could not save that move.");
    }
  };

  const down = (e: RPointerEvent, id: string, note = false) => {
    if (readOnly || tool === "pen" || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = toBoard(e);
    const pos = note ? notes.find((n) => n.id === id)! : cardPos(id)!;
    setDrag({ id, dx: p.x - pos.x, dy: p.y - pos.y, x: pos.x, y: pos.y, moved: false, over: null, note });
  };
  const move = (e: RPointerEvent) => {
    if (pen !== null) {
      const p = toBoard(e);
      setPen((d) => `${d} L${Math.round(p.x)} ${Math.round(p.y)}`);
      return;
    }
    if (!drag) return;
    const p = toBoard(e);
    const x = p.x - drag.dx;
    const y = p.y - drag.dy;
    const moved = drag.moved || Math.hypot(x - drag.x, y - drag.y) > 5;
    setDrag({ ...drag, x, y, moved, over: drag.note ? null : (laneAt(p)?.lane.id ?? null) });
  };
  const up = (e: RPointerEvent) => {
    if (pen !== null) {
      if (pen.includes("L")) setExtras({ strokes: [...strokes, pen] });
      setPen(null);
      return;
    }
    if (!drag) return;
    const d = drag;
    setDrag(null);
    if (!d.moved) return;
    if (d.note) return setExtras({ notes: notes.map((n) => (n.id === d.id ? { ...n, x: Math.round(d.x), y: Math.round(d.y) } : n)) });
    const card = local.find((c) => c.id === d.id)!;
    const g = laneAt(toBoard(e));
    if (g) void commitMove(card, g, toBoard(e));
  };

  const cardPos = (id: string) => {
    for (const g of geo) {
      const i = g.cards.findIndex((c) => c.id === id);
      if (i >= 0) return { ...slot(g, i), w: g.cw, h: g.ch, g };
    }
    return null;
  };

  const addNote = (x: number, y: number, kind: "sticky" | "timer" = "sticky") => {
    const n: LaneNote = kind === "timer" ? { id: uid(), kind, text: "Timebox", x, y, tone: 0, seconds: 300, running: false } : { id: uid(), kind, text: "", x, y, tone };
    setExtras({ notes: [...notes, n] });
    if (kind === "sticky") setEditing(n.id);
  };

  const canvasDown = (e: RPointerEvent) => {
    if (readOnly) return;
    const p = toBoard(e);
    if (tool !== "select") e.preventDefault();
    if (tool === "pen") {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setPen(`M${Math.round(p.x)} ${Math.round(p.y)}`);
    } else if (tool === "note") {
      addNote(Math.round(p.x - 90), Math.round(p.y - 60));
      setTool("select");
    }
  };

  useEffect(() => {
    if (readOnly) return;
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "v" || e.key === "V") setTool("select");
      else if (e.key === "n" || e.key === "N") setTool("note");
      else if (e.key === "p" || e.key === "P") setTool("pen");
      else if (e.key === "Escape") (setTool("select"), setEditing(null));
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [readOnly]);

  // Keyboard moves: focus a card, Alt+← / Alt+→ moves it to the neighbouring lane.
  const keyMove = (e: React.KeyboardEvent, c: LaneCard) => {
    if (readOnly || !e.altKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    const i = lanes.findIndex((l) => l.id === c.lane);
    const j = i + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1);
    const g = geo[j];
    if (!g) return;
    void commitMove(c, g, { x: g.x + 12, y: g.y + g.hh + g.cards.length * (g.ch + 10) });
  };

  const copy = async () => {
    const md = laneMarkdown(title, lanes, local);
    try {
      await navigator.clipboard.writeText(md);
      say("Board copied as Markdown");
    } catch {
      say("Copy is blocked in this browser");
    }
  };

  const vars = { "--lb-scale": sc } as CSSProperties;
  const toneBg = (t: number | undefined) => `var(--th-t${Math.max(0, Math.min(4, t ?? 0))})`;

  return (
    <div className={`lb${smart ? " smart" : ""}${th.tape ? " tape" : ""}${th.band ? " band" : ""}`} style={vars}>
      <div className="lb-bar">
        {strip ? <div className="lb-strip">{strip}</div> : <div className="ws-grow" />}
        <div className="lb-controls">
          <div className="lb-seg" role="group" aria-label="View">
            <button aria-pressed={view === "board"} onClick={() => setView("board")}>
              Board
            </button>
            <button aria-pressed={view === "list"} onClick={() => setView("list")}>
              List
            </button>
          </div>
          {view === "board" ? (
            <div className="lb-seg lb-zoom" role="group" aria-label="Zoom">
              <button aria-label="Zoom out" onClick={() => setScale((s) => Math.max(0.5, Math.round((s - 0.1) * 10) / 10))}>
                −
              </button>
              <span className="mono">{Math.round(sc * 100)}%</span>
              <button aria-label="Zoom in" onClick={() => setScale((s) => Math.min(1.6, Math.round((s + 0.1) * 10) / 10))}>
                +
              </button>
            </div>
          ) : null}
          {view === "board" && !readOnly ? (
            <button className="lb-btn" aria-pressed={smart} onClick={() => setSmart(!smart)} title="Bigger cards and buttons for a room screen">
              Smart board
            </button>
          ) : null}
          <button className="lb-btn" onClick={() => void copy()}>
            Copy as text
          </button>
        </div>
      </div>

      {view === "list" ? (
        <div className="lb-list">
          {lanes.map((l) => {
            const mine = local.filter((c) => c.lane === l.id);
            return (
              <section key={l.id} className="lb-list-lane" aria-label={l.title}>
                <h3>
                  {l.title} <span className="mono">{l.wip !== undefined ? `WIP ${mine.length}/${l.wip}` : l.cap !== undefined ? `${laneLoad(l, local)}/${l.cap} ${l.unit ?? ""}` : `${mine.length}`}</span>
                </h3>
                {mine.length ? (
                  <ul>
                    {mine.map((c) => (
                      <li key={c.id}>
                        {c.tag ? <span className="lb-tag">{c.tag}</span> : null}
                        <b>{c.title}</b>
                        {c.sub ? <span className="faint">{c.sub}</span> : null}
                        {c.chip ? <span className="lb-chip">{c.chip}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="faint">Empty</p>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="lb-wrap" ref={wrap}>
          <div className="lb-inner" role="application" aria-label={`${title} board`} style={{ width: innerW, height: innerH, transform: `scale(${sc})`, cursor: tool === "pen" ? "crosshair" : tool === "note" ? "copy" : undefined }} onPointerDown={canvasDown} onPointerMove={move} onPointerUp={up} onDoubleClick={(e) => !readOnly && e.target === e.currentTarget && addNote(Math.round(toBoard(e).x - 90), Math.round(toBoard(e).y - 60))}>
            {th.train && layout === "cols" ? <div className="lb-rail" style={{ top: Math.max(...geo.map((g) => g.y + g.h)) + 14, width: innerW - PAD * 2 }} /> : null}
            {geo.map((g, li) => {
              const load = laneLoad(g.lane, local);
              const limit = g.lane.wip ?? g.lane.cap;
              const used = g.lane.wip !== undefined ? g.cards.length : load;
              const over = limit !== undefined && used > limit;
              const cyc = th.cycle ? toneBg((li % 4) + 1) : undefined;
              return (
                <div key={g.lane.id} className={`lb-lane${drag?.over === g.lane.id ? " hl" : ""}${over ? " over" : ""}`} role="group" aria-label={`${g.lane.title}${limit !== undefined ? `, ${used} of ${limit}` : ""}`} data-lane={g.lane.id} style={{ left: g.x, top: g.y, width: g.w, height: g.h, ...(cyc ? { background: cyc } : {}), ...(th.cycle ? { transform: `rotate(${li % 2 ? 0.6 : -0.5}deg)` } : {}) }}>
                  {th.band ? <div className="lb-band" style={{ background: toneBg((li % 4) + 1) }} /> : null}
                  {th.tape ? <span className="lb-tape" aria-hidden="true" /> : null}
                  <div className="lb-lane-head">
                    <b>{g.lane.title}</b>
                    <div className="lb-lane-meta">
                      <span>{g.lane.sub ?? ""}</span>
                      <span className="mono">{g.lane.wip !== undefined ? `WIP ${g.cards.length} / ${g.lane.wip}` : g.lane.cap !== undefined ? `${load} / ${g.lane.cap} ${g.lane.unit ?? ""}` : `${g.cards.length} card${g.cards.length === 1 ? "" : "s"}`}</span>
                    </div>
                    {limit !== undefined ? (
                      <div className="lb-meter">
                        <span style={{ width: `${Math.min(100, (used / Math.max(1, limit)) * 100)}%` }} />
                      </div>
                    ) : null}
                  </div>
                  {th.train && layout === "cols" ? (
                    <>
                      <span className="lb-wheel" style={{ left: 18 }} />
                      <span className="lb-wheel" style={{ right: 18 }} />
                    </>
                  ) : null}
                </div>
              );
            })}
            <svg className="lb-ink" width={innerW} height={innerH} aria-hidden="true">
              {strokes.map((d, i) => (
                <path key={i} d={d} />
              ))}
              {pen ? <path d={pen} /> : null}
            </svg>
            {local.map((c) => {
              const pos = cardPos(c.id);
              if (!pos) return null;
              const dragging = drag?.id === c.id && !drag.note;
              const x = dragging ? drag.x : pos.x;
              const y = dragging ? drag.y : pos.y;
              return (
                <div key={c.id} className={`lb-card${dragging && drag.moved ? " lift" : ""}`} role="listitem" tabIndex={readOnly ? -1 : 0} aria-label={`${c.title}${c.sub ? `, ${c.sub}` : ""}, in ${lanes.find((l) => l.id === c.lane)?.title ?? "no lane"}${readOnly ? "" : ". Alt and arrow keys move it."}`} data-card={c.id} data-lane={c.lane ?? ""} onPointerDown={(e) => down(e, c.id)} onKeyDown={(e) => keyMove(e, c)} style={{ left: x, top: y, width: pos.w, height: pos.h, background: toneBg(c.tone), cursor: readOnly ? "default" : "grab" }}>
                  {c.tag || c.chip ? (
                    <div className="lb-card-top">
                      <span className="lb-tag">{c.tag}</span>
                      {c.chip ? <span className="lb-chip">{c.chip}</span> : null}
                    </div>
                  ) : null}
                  <div className="lb-card-title">{c.title}</div>
                  {c.sub ? <div className="lb-card-sub">{c.sub}</div> : null}
                  {cardFoot ? <div className="lb-card-foot" onPointerDown={(e) => e.stopPropagation()}>{cardFoot(c)}</div> : null}
                </div>
              );
            })}
            {notes.map((n) => {
              const dragging = drag?.id === n.id && drag.note;
              const x = dragging ? drag.x : n.x;
              const y = dragging ? drag.y : n.y;
              if (n.kind === "timer") {
                const left = secondsLeft(n);
                return (
                  <div key={n.id} className="lb-note timer" style={{ left: x, top: y }} onPointerDown={(e) => down(e, n.id, true)}>
                    <div className="lb-card-top">
                      <span className="lb-tag">TIMEBOX</span>
                      <span className="lb-tag">{n.running ? "RUNNING" : left === 0 ? "DONE" : "PAUSED"}</span>
                    </div>
                    <div className="lb-clock">
                      {String(Math.floor(left / 60)).padStart(1, "0")}:{String(left % 60).padStart(2, "0")}
                    </div>
                    <div className="row" style={{ gap: 6 }} onPointerDown={(e) => e.stopPropagation()}>
                      <button
                        className="lb-mini dark"
                        onClick={() => {
                          if (n.running) {
                            const s = secondsLeft(n);
                            delete startedAt.current[n.id];
                            setExtras({ notes: notes.map((x2) => (x2.id === n.id ? { ...x2, running: false, seconds: s } : x2)) });
                          } else {
                            startedAt.current[n.id] = { at: Date.now(), from: n.seconds || 300 };
                            setExtras({ notes: notes.map((x2) => (x2.id === n.id ? { ...x2, running: true, seconds: n.seconds || 300 } : x2)) });
                          }
                        }}
                      >
                        {n.running ? "Pause" : "Start"}
                      </button>
                      <button className="lb-mini" onClick={() => (delete startedAt.current[n.id], setExtras({ notes: notes.map((x2) => (x2.id === n.id ? { ...x2, running: false, seconds: 300 } : x2)) }))}>
                        Reset
                      </button>
                      <button className="lb-mini" aria-label="Remove timer" onClick={() => setExtras({ notes: notes.filter((x2) => x2.id !== n.id) })}>
                        ×
                      </button>
                    </div>
                  </div>
                );
              }
              return (
                <div key={n.id} className="lb-note" style={{ left: x, top: y, background: toneBg(n.tone) }} onPointerDown={(e) => editing !== n.id && down(e, n.id, true)} onDoubleClick={() => !readOnly && setEditing(n.id)}>
                  {editing === n.id ? (
                    <textarea
                      autoFocus
                      aria-label="Note text"
                      defaultValue={n.text}
                      onBlur={(e) => {
                        setEditing(null);
                        const text = e.target.value.trim();
                        setExtras({ notes: text ? notes.map((x2) => (x2.id === n.id ? { ...x2, text } : x2)) : notes.filter((x2) => x2.id !== n.id) });
                      }}
                      onKeyDown={(e) => e.key === "Escape" && (e.target as HTMLTextAreaElement).blur()}
                    />
                  ) : (
                    <span>{n.text}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "board" && !readOnly ? (
        <div className="lb-dock" role="toolbar" aria-label="Board tools">
          <button aria-pressed={tool === "select"} onClick={() => setTool("select")}>
            Select <kbd>V</kbd>
          </button>
          <button aria-pressed={tool === "note"} onClick={() => setTool("note")}>
            Note <kbd>N</kbd>
          </button>
          <button aria-pressed={tool === "pen"} onClick={() => setTool("pen")}>
            Pen <kbd>P</kbd>
          </button>
          <button onClick={() => addNote(Math.round(((wrap.current?.scrollLeft ?? 0) + 260) / sc), Math.round(((wrap.current?.scrollTop ?? 0) + 120) / sc), "timer")}>Timer</button>
          <button onClick={() => setExtras({ strokes: [] })} disabled={!strokes.length}>
            Clear ink
          </button>
          <span className="lb-dock-sep" />
          {[1, 2, 3, 4].map((t) => (
            <button key={t} className="lb-swatch" aria-label={`Note colour ${t}`} aria-pressed={tone === t} style={{ background: toneBg(t) }} onClick={() => (setTone(t), setTool("note"))} />
          ))}
        </div>
      ) : null}
      {toast ? (
        <div className="lb-toast" role="status">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

/** A stat chip for the strip under a board's header. */
export function StatChip({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="lb-stat">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

/**
 * A lane board kept by the workspace under a key: its cards (when the board owns them, like
 * class breakouts) and its notes, timers and ink. Saves shortly after each change.
 */
export function useLaneState(key: string, seed?: () => LaneCard[]) {
  const [cards, setCardsState] = useState<LaneCard[] | null>(null);
  const [extras, setExtrasState] = useState<Extras>({ notes: [], strokes: [] });
  const [error, setError] = useState<string | null>(null);
  const latest = useRef<{ cards: LaneCard[]; extras: Extras }>({ cards: [], extras: { notes: [], strokes: [] } });
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    let live = true;
    api<{ board: { cards: LaneCard[]; notes: Extras["notes"]; strokes: string[] } | null }>("GET", `/v1/lane-boards/${encodeURIComponent(key)}`)
      .then((r) => {
        if (!live) return;
        const c = r.board?.cards.length ? r.board.cards : (seed?.() ?? []);
        const x = { notes: r.board?.notes ?? [], strokes: r.board?.strokes ?? [] };
        latest.current = { cards: c, extras: x };
        setCardsState(c);
        setExtrasState(x);
      })
      .catch((e: Error) => live && (setError(e.message), setCardsState(seed?.() ?? [])));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const save = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const { cards: c, extras: x } = latest.current;
      api("PUT", `/v1/lane-boards/${encodeURIComponent(key)}`, { cards: c, notes: x.notes, strokes: x.strokes }).catch((e: Error) => setError(e.message));
    }, 500);
  };
  const setExtras = (x: Extras) => {
    latest.current.extras = x;
    setExtrasState(x);
    save();
  };
  const setCards = (c: LaneCard[]) => {
    latest.current.cards = c;
    setCardsState(c);
    save();
  };
  return { cards, setCards, extras, setExtras, error };
}
