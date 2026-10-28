"use client";

// Purpose-built exercise boards (an activity's `board`): each keeps what people add in its frame's
// shared state, one change at a time (push, update, remove, set), so a whole class can add at once.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type React from "react";
import { STUDIO_KINDS, studioModel } from "@/components/studio-model";
import * as Views from "@/components/studio-views";
import { applyStateOp, type Board, type Frame, type StateOp } from "@trainyard/core";
import { api, type ApiFailure } from "@/lib/api";

export type Op = (change: StateOp) => void;
export interface BoardProps {
  board: Board;
  frame: Frame;
  config: Record<string, unknown>;
  st: Record<string, unknown>;
  op: Op;
  readOnly: boolean;
  trainer: boolean;
}

/** The frame's state with this person's changes applied at once, saved one by one. */
export function useFrameState(board: Board, frame: Frame, onChanged: () => void, onError: (m: string) => void): [Record<string, unknown>, Op] {
  const [st, setSt] = useState<Record<string, unknown>>(() => structuredClone(frame.state ?? {}));
  const pending = useRef(0);
  useEffect(() => {
    if (!pending.current) setSt(structuredClone(frame.state ?? {}));
  }, [frame.state]);
  const op: Op = (change) => {
    setSt((s) => {
      const next = structuredClone(s);
      applyStateOp(next, change, () => `tmp${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`);
      return next;
    });
    pending.current += 1;
    api("PUT", `/v1/boards/${encodeURIComponent(board.id)}/frames/${encodeURIComponent(frame.id)}/state`, change)
      .catch((e: ApiFailure) => onError(e.message))
      .finally(() => {
        pending.current -= 1;
        if (!pending.current) onChanged();
      });
  };
  return [st, op];
}

export interface Sticky {
  id: string;
  text: string;
  [k: string]: unknown;
}
export const list = <T = Sticky,>(st: Record<string, unknown>, key: string): T[] => (Array.isArray(st[key]) ? (st[key] as T[]) : []);
export const STICKY_COLORS = ["#ffd37a", "#f6b9ae", "#cfe8d4", "#cde0f2"];

/** A lane of stickies: add with Enter, click one to edit it, × removes it. */
export function StickyLane({ st, op, k, readOnly, color, placeholder = "+ sticky, press Enter", compact, votes }: { st: Record<string, unknown>; op: Op; k: string; readOnly: boolean; color?: string; placeholder?: string; compact?: boolean; votes?: boolean }) {
  const items = list(st, k);
  const [over, setOver] = useState(false);
  // A sticky dragged here from another lane moves: it leaves that lane and joins this one.
  const drop = (e: React.DragEvent) => {
    e.preventDefault();
    setOver(false);
    const raw = e.dataTransfer.getData("application/x-trainyard-sticky");
    if (!raw || readOnly) return;
    const from = JSON.parse(raw) as { key: string; item: Sticky };
    if (from.key === k) return;
    const { id, ...rest } = from.item;
    op({ key: from.key, op: "remove", id });
    op({ key: k, op: "push", value: rest });
  };
  const [draft, setDraft] = useState("");
  const [edit, setEdit] = useState<{ id: string; text: string } | null>(null);
  const add = () => {
    const text = draft.trim();
    if (!text) return;
    op({ key: k, op: "push", value: { text } });
    setDraft("");
  };
  return (
    <div className={`ex-lane${compact ? " compact" : ""}${over ? " over" : ""}`} onDragOver={(e) => (readOnly ? null : (e.preventDefault(), setOver(true)))} onDragLeave={() => setOver(false)} onDrop={drop}>
      <div className="ex-stickies">
        {items.map((s, i) =>
          edit?.id === s.id ? (
            <textarea
              key={s.id}
              className="ex-sticky editing"
              autoFocus
              value={edit.text}
              style={{ background: color ?? STICKY_COLORS[i % STICKY_COLORS.length] }}
              onChange={(e) => setEdit({ id: s.id, text: e.target.value })}
              onBlur={() => (edit.text.trim() && edit.text !== s.text ? op({ key: k, op: "update", id: s.id, value: { text: edit.text.trim() } }) : null, setEdit(null))}
              onKeyDown={(e) => (e.key === "Enter" && !e.shiftKey ? (e.preventDefault(), (e.target as HTMLTextAreaElement).blur()) : e.key === "Escape" ? setEdit(null) : null)}
            />
          ) : (
            <div key={s.id} className="ex-sticky" draggable={!readOnly} onDragStart={(e) => e.dataTransfer.setData("application/x-trainyard-sticky", JSON.stringify({ key: k, item: s }))} style={{ background: color ?? STICKY_COLORS[i % STICKY_COLORS.length] }} onClick={() => !readOnly && setEdit({ id: s.id, text: s.text })}>
              {s.text}
              {votes ? (
                <button
                  className="ex-votes"
                  disabled={readOnly}
                  title="Click to add a dot, right-click to take one off"
                  onClick={(e) => (e.stopPropagation(), op({ key: k, op: "update", id: s.id, value: { votes: Number(s.votes ?? 0) + 1 } }))}
                  onContextMenu={(e) => (e.preventDefault(), e.stopPropagation(), Number(s.votes ?? 0) > 0 ? op({ key: k, op: "update", id: s.id, value: { votes: Number(s.votes ?? 0) - 1 } }) : null)}
                >
                  ● {Number(s.votes ?? 0)}
                </button>
              ) : null}
              {!readOnly ? (
                <button className="ex-x" aria-label="Remove" onClick={(e) => (e.stopPropagation(), op({ key: k, op: "remove", id: s.id }))}>
                  ×
                </button>
              ) : null}
            </div>
          ),
        )}
      </div>
      {!readOnly ? <input className="ex-add" value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onBlur={add} onKeyDown={(e) => e.key === "Enter" && add()} aria-label={placeholder} /> : null}
    </div>
  );
}

/** A coloured header strip over a box, as the design's question cards and templates draw them. */
export function BoxHead({ children, tint }: { children: ReactNode; tint?: string }) {
  return (
    <div className="ex-head" style={tint ? { background: tint } : undefined}>
      {children}
    </div>
  );
}

interface LaneSpec {
  title: string;
  examples?: string[];
  hint?: string;
}

/**
 * Questions, each with its own lane of stickies. `layout`: "cards" (default), "grid" (large
 * panels, 2×2 or 3 across), "rows" (a template: the heading on the left, notes on the right).
 * `select` puts a choice at the top (e.g. which ART event) with its own notes per option.
 */
export function LanesBoard({ config, st, op, readOnly }: BoardProps) {
  const lanes = (config.lanes as LaneSpec[] | undefined) ?? [];
  const layout = (config.layout as string | undefined) ?? "cards";
  const select = config.select as { label: string; options: string[] } | undefined;
  const intro = config.intro as string | undefined;
  const heading = config.heading as { label: string; placeholder?: string } | undefined;
  const examples = config.examples as string[] | undefined;
  const chosen = select ? ((st.select as string | undefined) ?? "") : "";
  const prefix = select ? `lane:${chosen}:` : "lane:";
  const cols = (config.cols as number | undefined) ?? (layout === "grid" ? (lanes.length === 3 ? 3 : 2) : undefined);
  return (
    <div className="ex-board">
      {intro ? <div className={`ex-intro${config.introStyle === "scenario" ? " scenario" : ""}`}>{intro}</div> : null}
      {heading ? <HeadingInput label={heading.label} placeholder={heading.placeholder} st={st} op={op} readOnly={readOnly} /> : null}
      {examples?.length ? (
        <div className="ex-examples">
          <span className="ex-mono">Examples</span>
          {examples.map((e) => (
            <span key={e} className="ex-chip">
              {e}
            </span>
          ))}
        </div>
      ) : null}
      {select ? (
        <label className="ex-select">
          <span className="ex-mono">{select.label}</span>
          <select value={chosen} disabled={readOnly} onChange={(e) => op({ key: "select", op: "set", value: e.target.value || null })}>
            <option value="">Choose…</option>
            {select.options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>
      ) : null}
      {select && !chosen ? (
        <p className="faint" style={{ margin: 0 }}>
          Choose one above to start.
        </p>
      ) : layout === "rows" ? (
        <div className="ex-rows">
          {lanes.map((l, i) => (
            <div key={l.title} className="ex-row">
              <div className="ex-row-head">
                {l.title}
                {l.examples?.length ? <div className="ex-row-example">{l.examples.join("\n")}</div> : null}
              </div>
              <StickyLane st={st} op={op} k={`${prefix}${i}`} readOnly={readOnly} placeholder={l.hint ?? "+ note, press Enter"} compact />
            </div>
          ))}
        </div>
      ) : (
        <div className={`ex-cards ${layout}`} style={cols ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` } : undefined}>
          {lanes.map((l, i) => (
            <section key={l.title} className="ex-card">
              <BoxHead tint={STICKY_COLORS[i % STICKY_COLORS.length]}>{l.title}</BoxHead>
              {l.examples?.length ? (
                <div className="ex-card-examples">
                  {l.examples.map((e) => (
                    <span key={e} className="ex-chip">
                      {e}
                    </span>
                  ))}
                </div>
              ) : null}
              <StickyLane st={st} op={op} k={`${prefix}${i}`} readOnly={readOnly} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** One line of text for the whole board, e.g. which ART event a group chose. */
function HeadingInput({ label, placeholder, st, op, readOnly, k = "heading" }: { label: string; placeholder?: string; st: Record<string, unknown>; op: Op; readOnly: boolean; k?: string }) {
  const saved = typeof st[k] === "string" ? (st[k] as string) : "";
  const [v, setV] = useState(saved);
  useEffect(() => setV(saved), [saved]);
  return (
    <label className="ex-heading">
      <span>{label}:</span>
      <input value={v} placeholder={placeholder} disabled={readOnly} onChange={(e) => setV(e.target.value)} onBlur={() => v !== saved && op({ key: k, op: "set", value: v.trim() || null })} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
    </label>
  );
}

/** Picks the board for an activity's `board` kind: the Class Studio boards, or question lanes. */
export function ExerciseBoard(props: BoardProps & { kind: string }) {
  return STUDIO_KINDS.has(props.kind) ? <StudioBoard {...props} /> : <LanesBoard {...props} />;
}

const VIEWS: Record<string, (p: { v: Record<string, unknown> }) => ReactNode> = {
  talk: Views.TalkView, quad: Views.QuadView, check: Views.CheckView, connect: Views.ConnectView, trust: Views.TrustView, bound: Views.BoundView, next: Views.NextView, vsm: Views.VsmView, ba: Views.BaView, rca: Views.RcaView,
  metrics: Views.MetView, ctx: Views.CtxView, accel: Views.AccView, wheel: Views.WheelView, evt: Views.EvtView, kanban: Views.KanView, pitch: Views.PitchView, disc: Views.DiscView, bv: Views.BvView, roam: Views.RoamView, art: Views.ArtView,
};

/** A board from the Class Studio design: its generated layout, driven by the ported logic (studio-model.ts). */
function StudioBoard({ kind, board, frame, config, st, op, readOnly, trainer }: BoardProps & { kind: string }) {
  const [ui, setUiState] = useState<Record<string, unknown>>({});
  const setUi = useCallback((p: Record<string, unknown>) => setUiState((u) => ({ ...u, ...p })), []);
  const ask = useCallback(async (prompt: string) => {
    try {
      return (await api<{ lines: string[] }>("POST", `/v1/boards/${encodeURIComponent(board.id)}/suggest`, { prompt })).lines;
    } catch {
      return [];
    }
  }, [board.id]);
  const v = studioModel({ kind, cfg: config, S: st, op, ui, setUi, trainer, readOnly, board, frame, ask });
  const View = VIEWS[kind]!;
  return (
    <div className="studio-board">
      <View v={v} />
    </div>
  );
}
