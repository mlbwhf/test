"use client";

// Purpose-built exercise boards (an activity's `board`): each keeps what people add in its frame's
// shared state, one change at a time (push, update, remove, set), so a whole class can add at once.

import { useEffect, useRef, useState, type ReactNode } from "react";
import type React from "react";
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

/** Picks the board for an activity's `board` kind; kinds without their own board yet use lanes. */
export function ExerciseBoard(props: BoardProps & { kind: string }) {
  const Special = SPECIAL[props.kind];
  return Special ? <Special {...props} /> : <LanesBoard {...props} />;
}

/** Purpose-built boards by kind. */
export const SPECIAL: Record<string, (p: BoardProps) => ReactNode> = { roam: RoamBoard, kanban: KanbanBoard, metrics: MetricsBoard, accel: AccelBoard, rca: WorkshopBoard, radar: RadarBoard, vsm: VsmBoard };

/** Text that saves when you leave it (Enter for one-liners). */
function InlineText({ value, onSave, readOnly, placeholder, multiline, className }: { value: string; onSave: (v: string) => void; readOnly: boolean; placeholder?: string; multiline?: boolean; className?: string }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const save = () => v !== value && onSave(v);
  return multiline ? (
    <textarea className={`ex-inline ${className ?? ""}`} value={v} placeholder={placeholder} disabled={readOnly} rows={2} onChange={(e) => setV(e.target.value)} onBlur={save} />
  ) : (
    <input className={`ex-inline ${className ?? ""}`} value={v} placeholder={placeholder} disabled={readOnly} onChange={(e) => setV(e.target.value)} onBlur={save} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
  );
}

/** Adds one entry to a list from a single line of text. */
function AddLine({ placeholder, onAdd, readOnly }: { placeholder: string; onAdd: (text: string) => void; readOnly: boolean }) {
  const [v, setV] = useState("");
  if (readOnly) return null;
  const add = () => (v.trim() ? (onAdd(v.trim()), setV("")) : null);
  return <input className="ex-add" value={v} placeholder={placeholder} aria-label={placeholder} onChange={(e) => setV(e.target.value)} onBlur={add} onKeyDown={(e) => e.key === "Enter" && add()} />;
}

// ---- ROAM: each risk goes to Resolved, Owned, Accepted or Mitigated, with the group's approach --

function RoamBoard({ config, st, op, readOnly }: BoardProps) {
  const risks = (config.risks as string[] | undefined) ?? [];
  const roam = (config.roam as [string, string, string][] | undefined) ?? [];
  const at = (i: number) => (typeof st[`roam:${i}`] === "string" ? (st[`roam:${i}`] as string) : "");
  const place = (i: number, l: string | null) => op({ key: `roam:${i}`, op: "set", value: l });
  const [over, setOver] = useState<string | null>(null);
  const card = (i: number) => (
    <article key={i} className="ex-risk" draggable={!readOnly} onDragStart={(e) => e.dataTransfer.setData("application/x-trainyard-risk", String(i))}>
      <p>{risks[i]}</p>
      <div className="ex-roam-pick" role="group" aria-label="ROAM">
        {roam.map(([l, name]) => (
          <button key={l} className={at(i) === l ? "on" : ""} disabled={readOnly} title={name} aria-pressed={at(i) === l} onClick={() => place(i, at(i) === l ? null : l)}>
            {l}
          </button>
        ))}
      </div>
      <StickyLane st={st} op={op} k={`note:${i}`} readOnly={readOnly} compact color="#fff" placeholder="+ how we would facilitate it, and why" />
    </article>
  );
  const dropOn = (l: string | null) => ({
    onDragOver: (e: React.DragEvent) => (readOnly ? null : (e.preventDefault(), setOver(l ?? "-"))),
    onDragLeave: () => setOver(null),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setOver(null);
      const i = e.dataTransfer.getData("application/x-trainyard-risk");
      if (i !== "" && !readOnly) place(Number(i), l);
    },
  });
  const open = risks.map((_, i) => i).filter((i) => !at(i));
  return (
    <div className="ex-board ex-roam">
      <section className={`ex-roam-pool${over === "-" ? " over" : ""}`} {...dropOn(null)}>
        <div className="ex-mono">ART PI risks · {open.length} to ROAM</div>
        {open.map(card)}
        {!open.length ? <p className="faint">Every risk has a place. Drag one back here to rethink it.</p> : null}
      </section>
      <section className="ex-roam-grid" aria-label="Risks">
        {roam.map(([l, name, desc]) => (
          <div key={l} className={`ex-roam-q${over === l ? " over" : ""}`} {...dropOn(l)}>
            <header>
              <b className="ex-roam-l">{l}</b>
              <div>
                <strong>{name}</strong>
                <small>{desc}</small>
              </div>
            </header>
            {risks.map((_, i) => i).filter((i) => at(i) === l).map(card)}
          </div>
        ))}
      </section>
    </div>
  );
}

// ---- ART kanban: the group's own columns, WIP limits and policies, with features to move ---------

interface Column {
  id: string;
  title: string;
  wip?: string;
  policy?: string;
}

function KanbanBoard({ config, st, op, readOnly }: BoardProps) {
  const cols = list<Column>(st, "columns");
  const usual = (config.columns as string[] | undefined) ?? [];
  if (!cols.length)
    return (
      <div className="ex-board">
        <div className="ex-intro">Map your ART’s actual workflow of features: columns, policies and initial WIP limits.</div>
        {readOnly ? (
          <p className="faint">The group has not set up its board yet.</p>
        ) : (
          <div className="row" style={{ gap: 10 }}>
            <button className="btn primary" onClick={() => op({ key: "columns", op: "set", value: usual.map((title, i) => ({ id: `c${i}${Date.now().toString(36)}`, title })) })}>
              Start with {usual.slice(0, 3).join(", ")}…
            </button>
            <button className="btn" onClick={() => op({ key: "columns", op: "push", value: { title: "Funnel" } })}>
              Start blank
            </button>
          </div>
        )}
      </div>
    );
  return (
    <div className="ex-board">
      <div className="ex-kanban" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(170px, 1fr))${readOnly ? "" : " 56px"}` }}>
        {cols.map((c) => {
          const n = list(st, `cards:${c.id}`).length;
          const wip = Number(c.wip);
          const overWip = c.wip && wip > 0 && n > wip;
          return (
            <section key={c.id} className={`ex-kcol${overWip ? " over-wip" : ""}`}>
              <header>
                <InlineText value={c.wip ?? ""} placeholder="WIP" readOnly={readOnly} className="ex-wip" onSave={(v) => op({ key: "columns", op: "update", id: c.id, value: { wip: v.replace(/[^0-9/ ]/g, "") } })} />
                <InlineText value={c.title} readOnly={readOnly} className="ex-ktitle" onSave={(v) => v.trim() && op({ key: "columns", op: "update", id: c.id, value: { title: v.trim() } })} />
                {!readOnly ? (
                  <button className="ex-x" aria-label={`Remove ${c.title}`} onClick={() => window.confirm(`Remove the ${c.title} column and its cards?`) && op({ key: "columns", op: "remove", id: c.id })}>
                    ×
                  </button>
                ) : null}
              </header>
              <StickyLane st={st} op={op} k={`cards:${c.id}`} readOnly={readOnly} color="#c9dcf3" placeholder="+ feature" />
              <InlineText value={c.policy ?? ""} placeholder="Policy…" multiline readOnly={readOnly} className="ex-policy" onSave={(v) => op({ key: "columns", op: "update", id: c.id, value: { policy: v } })} />
            </section>
          );
        })}
        {!readOnly ? (
          <button className="ex-addcol" aria-label="Add a column" onClick={() => op({ key: "columns", op: "push", value: { title: "New column" } })}>
            +
          </button>
        ) : null}
      </div>
      <p className="faint" style={{ margin: 0 }}>
        Drag features between columns. A column turns red when it holds more than its WIP limit.
      </p>
    </div>
  );
}

// ---- Flow metrics: pick the ones that matter, then purpose, data source and action for each ------

function MetricsBoard({ config, st, op, readOnly }: BoardProps) {
  const metrics = (config.metrics as string[] | undefined) ?? [];
  const fields = (config.fields as [string, string][] | undefined) ?? [];
  const picked = Array.isArray(st.picked) ? (st.picked as string[]) : [];
  const toggle = (m: string) => op({ key: "picked", op: "set", value: picked.includes(m) ? picked.filter((x) => x !== m) : [...picked, m] });
  return (
    <div className="ex-board">
      <div className="ex-examples" role="group" aria-label="Flow metrics">
        <span className="ex-mono">Flow metrics</span>
        {metrics.map((m) => (
          <button key={m} className={`ex-chip pick${picked.includes(m) ? " on" : ""}`} disabled={readOnly} aria-pressed={picked.includes(m)} onClick={() => toggle(m)}>
            {m}
          </button>
        ))}
      </div>
      {picked.length ? (
        <div className="ex-rows ex-metric-table" style={{ gridTemplateColumns: `200px repeat(${fields.length}, minmax(0, 1fr))` }}>
          <div className="ex-row-head" />
          {fields.map(([f, q]) => (
            <div key={f} className="ex-row-head">
              {f}
              <div className="ex-row-example">{q}</div>
            </div>
          ))}
          {metrics
            .filter((m) => picked.includes(m))
            .map((m) => [
              <div key={m} className="ex-row-head">
                {m}
              </div>,
              ...fields.map(([f]) => <StickyLane key={`${m}:${f}`} st={st} op={op} k={`m:${m}:${f}`} readOnly={readOnly} compact placeholder="+ note" />),
            ])}
        </div>
      ) : (
        <p className="faint" style={{ margin: 0 }}>
          Select the metrics that would provide the most value for your ART.
        </p>
      )}
      {config.reflect ? (
        <section className="ex-card">
          <BoxHead tint="#cfe8d4">{config.reflect as string}</BoxHead>
          <StickyLane st={st} op={op} k="reflect" readOnly={readOnly} />
        </section>
      ) : null}
    </div>
  );
}

// ---- Flow accelerators: the group's problems, each matched with the accelerators that help -----

interface Problem extends Sticky {
  acc?: string[];
}

function AccelBoard({ config, st, op, readOnly }: BoardProps) {
  const accels = (config.accelerators as string[] | undefined) ?? [];
  const problems = list<Problem>(st, "problems");
  const count = (a: string) => problems.filter((p) => p.acc?.includes(a)).length;
  return (
    <div className="ex-board">
      <div className="ex-examples">
        <span className="ex-mono">Flow accelerators</span>
        {accels.map((a, i) => (
          <span key={a} className="ex-chip">
            {i + 1}. {a}
            {count(a) ? <b> · {count(a)}</b> : null}
          </span>
        ))}
      </div>
      <div className="ex-cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
        {problems.map((p, i) => (
          <section key={p.id} className="ex-card">
            <BoxHead tint={STICKY_COLORS[i % STICKY_COLORS.length]}>
              <div className="row" style={{ alignItems: "start", gap: 6 }}>
                <InlineText value={p.text} multiline readOnly={readOnly} onSave={(v) => (v.trim() ? op({ key: "problems", op: "update", id: p.id, value: { text: v.trim() } }) : op({ key: "problems", op: "remove", id: p.id }))} />
                {!readOnly ? (
                  <button className="ex-x" style={{ position: "static" }} aria-label="Remove problem" onClick={() => op({ key: "problems", op: "remove", id: p.id })}>
                    ×
                  </button>
                ) : null}
              </div>
            </BoxHead>
            <div className="ex-accel-pick">
              {accels.map((a) => {
                const on = p.acc?.includes(a) ?? false;
                return (
                  <button key={a} className={`ex-chip pick${on ? " on" : ""}`} disabled={readOnly} aria-pressed={on} onClick={() => op({ key: "problems", op: "update", id: p.id, value: { acc: on ? (p.acc ?? []).filter((x) => x !== a) : [...(p.acc ?? []), a] } })}>
                    {a}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <AddLine placeholder="+ a problem you experience in your team or ART, press Enter" readOnly={readOnly} onAdd={(text) => op({ key: "problems", op: "push", value: { text, acc: [] } })} />
    </div>
  );
}

// ---- Problem-solving workshop: fishbone with five whys and dot votes, Pareto, the six boxes -----

const BONES = ["People", "Process", "Tools", "Work", "Environment"];
const BOXES: [string, string][] = [
  ["box1", "1. Original problem statement"],
  ["fishbone", "2. Root-cause analysis"],
  ["box3", "3. Biggest root cause"],
  ["box4", "4. Restate problem"],
  ["box5", "5. Brainstorm solutions"],
  ["box6", "6. Identify improvement backlog items"],
];
const ACTIVE: Record<string, string[]> = { agree: ["box1"], rca: ["fishbone"], restate: ["box3", "box4"], brainstorm: ["box5", "box6"], readout: BOXES.map(([k]) => k) };

function WorkshopBoard({ config, st, op, readOnly }: BoardProps) {
  const step = (config.step as string | undefined) ?? "readout";
  const active = ACTIVE[step] ?? [];
  const problem = list(st, "box1")[0]?.text;
  const causes = BONES.flatMap((b) => list(st, `bone:${b}`).map((c) => ({ ...c, bone: b, votes: Number(c.votes ?? 0) }))).sort((a, b) => b.votes - a.votes);
  const total = causes.reduce((t, c) => t + c.votes, 0);
  const bone = (b: string) => (
    <section key={b} className="ex-bone">
      <div className="ex-mono">{b}</div>
      <StickyLane st={st} op={op} k={`bone:${b}`} readOnly={readOnly} compact votes={step === "restate" || step === "readout"} color="#fff" placeholder="+ cause, then ask why" />
    </section>
  );
  return (
    <div className="ex-board ex-workshop">
      <div className={`ex-fish${active.includes("fishbone") ? " active" : ""}`}>
        <div className="ex-bones top">{BONES.slice(0, 2).map(bone)}</div>
        <div className="ex-spine">
          <span />
          <b>{problem || "Problem"}</b>
        </div>
        <div className="ex-bones">{BONES.slice(2).map(bone)}</div>
        {step === "rca" ? <p className="faint" style={{ margin: 0 }}>Five Whys: under each cause, add the cause of that cause until you reach a potential root cause.</p> : null}
      </div>
      {step === "restate" || step === "readout" ? (
        <section className="ex-card ex-pareto" aria-label="Pareto">
          <BoxHead tint="#f6b9ae">Pareto · dot votes per cause</BoxHead>
          {causes.filter((c) => c.votes).length ? (
            <ol>
              {causes
                .filter((c) => c.votes)
                .map((c, i, arr) => {
                  const cum = arr.slice(0, i + 1).reduce((t, x) => t + x.votes, 0);
                  return (
                    <li key={c.id}>
                      <span className="ex-pbar" style={{ width: `${(c.votes / causes[0]!.votes) * 100}%` }} />
                      <span>
                        {c.text} <small>({c.bone})</small>
                      </span>
                      <b>
                        {c.votes} · {Math.round((cum / total) * 100)}%
                      </b>
                    </li>
                  );
                })}
            </ol>
          ) : (
            <p className="faint" style={{ padding: "0 12px" }}>
              Add dots to the causes on the fishbone: click a cause’s ● to vote.
            </p>
          )}
        </section>
      ) : null}
      <div className="ex-six">
        {BOXES.map(([k, title]) => (
          <section key={k} className={`ex-box${active.includes(k) ? " active" : ""}`}>
            <div className="ex-box-head">{title}</div>
            {k === "fishbone" ? (
              <p className="faint" style={{ margin: 0, padding: "0 10px 10px" }}>
                {causes.length} {causes.length === 1 ? "cause" : "causes"} on the fishbone
              </p>
            ) : (
              <StickyLane st={st} op={op} k={k} readOnly={readOnly} compact votes={k === "box5"} color="#fff" placeholder="+ note" />
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

/** Splits a label into lines of about `n` characters, at spaces. */
function wrap(text: string, n: number): string[] {
  const lines: string[] = [];
  for (const w of text.split(" ")) {
    const last = lines[lines.length - 1];
    if (last !== undefined && (last + " " + w).length <= n) lines[lines.length - 1] = `${last} ${w}`;
    else lines.push(w);
  }
  return lines;
}

// ---- Business Agility self assessment: each person's scores, the class average on a radar ------

interface Scores extends Sticky {
  values: number[];
}

function RadarBoard({ config, st, op, readOnly }: BoardProps) {
  const dims = (config.dims as [string, number][] | undefined) ?? [];
  const max = (config.max as number | undefined) ?? 5;
  const entries = list<Scores>(st, "scores");
  const [mine, setMine] = useState<number[]>(() => dims.map(() => Math.ceil(max / 2)));
  const [name, setName] = useState("");
  const [example, setExample] = useState(false);
  const avg = dims.map((_, d) => (entries.length ? entries.reduce((t, e) => t + (e.values[d] ?? 0), 0) / entries.length : 0));
  const R = 120;
  const pt = (d: number, v: number) => {
    const a = -Math.PI / 2 + (d * 2 * Math.PI) / dims.length;
    return [Math.cos(a) * (v / max) * R, Math.sin(a) * (v / max) * R] as const;
  };
  const poly = (vals: number[]) => vals.map((v, d) => pt(d, v).join(",")).join(" ");
  return (
    <div className="ex-board ex-radar">
      <section className="ex-card">
        <BoxHead tint="#cde0f2">{(config.title as string | undefined) ?? "Assessment"}</BoxHead>
        <svg viewBox="-310 -200 620 410" role="img" aria-label="Radar of the class's average scores">
          {Array.from({ length: max }, (_, k) => (
            <polygon key={k} points={poly(dims.map(() => k + 1))} fill="none" stroke="#0d181522" />
          ))}
          {dims.map((_, d) => (
            <line key={d} x1={0} y1={0} x2={pt(d, max)[0]} y2={pt(d, max)[1]} stroke="#0d181533" />
          ))}
          {example ? <polygon points={poly(dims.map(([, v]) => v))} fill="none" stroke="#c2412d" strokeDasharray="5 4" strokeWidth={2} /> : null}
          {entries.map((e) => (
            <polygon key={e.id} points={poly(e.values)} fill="none" stroke="#2f6fbd44" />
          ))}
          {entries.length ? <polygon points={poly(avg)} fill="#2f6fbd33" stroke="#2f6fbd" strokeWidth={2.5} /> : null}
          {dims.map(([label], d) => {
            const [x, y] = pt(d, max + 0.55);
            return (
              <text key={label} x={x} y={y} textAnchor={Math.abs(x) < 20 ? "middle" : x > 0 ? "start" : "end"} fontSize={11.5} fontWeight={700} fill="#0d1815">
                {wrap(label, 24).map((line, k) => (
                  <tspan key={k} x={x} dy={k ? 14 : 0}>
                    {line}
                  </tspan>
                ))}
                <tspan x={x} dy={15} fontWeight={400} fill="#2f6fbd">
                  {entries.length ? avg[d]!.toFixed(2) : ""}
                </tspan>
              </text>
            );
          })}
        </svg>
        <label className="faint" style={{ padding: "0 12px 12px", display: "flex", gap: 6 }}>
          <input type="checkbox" checked={example} onChange={(e) => setExample(e.target.checked)} /> Show the example from the slide
        </label>
      </section>
      <div className="stack" style={{ gap: 14 }}>
        {!readOnly ? (
          <section className="ex-card">
            <BoxHead tint="#ffd37a">My scores</BoxHead>
            <div className="ex-sliders">
              {dims.map(([label], d) => (
                <label key={label}>
                  <span>{label}</span>
                  <input type="range" min={1} max={max} step={0.25} value={mine[d]} onChange={(e) => setMine(mine.map((v, k) => (k === d ? Number(e.target.value) : v)))} />
                  <b>{mine[d]!.toFixed(2)}</b>
                </label>
              ))}
              <div className="row" style={{ gap: 8 }}>
                <input className="ex-inline" placeholder="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
                <button className="btn primary" onClick={() => (op({ key: "scores", op: "push", value: { text: name.trim() || "Anonymous", values: mine } }), setName(""))}>
                  Add my scores
                </button>
              </div>
            </div>
          </section>
        ) : null}
        <p className="faint" style={{ margin: 0 }}>
          {entries.length ? `${entries.length} ${entries.length === 1 ? "person has" : "people have"} added scores: ${entries.map((e) => e.text).join(", ")}.` : "No scores yet."}
        </p>
        <section className="ex-card">
          <BoxHead tint="#cfe8d4">{(config.lane as string | undefined) ?? "Notes"}</BoxHead>
          <StickyLane st={st} op={op} k="notes" readOnly={readOnly} />
        </section>
      </div>
    </div>
  );
}

// ---- Value stream map: steps with process time, the delay before each, %C&A; totals ------------

interface VsmStep extends Sticky {
  process?: string;
  delay?: string;
  ca?: string;
  group?: string;
}

const hours = (v: unknown) => {
  const n = parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

function VsmBoard({ config, st, op, readOnly }: BoardProps) {
  const groups = (config.groups as string[] | undefined) ?? [];
  const steps = list<VsmStep>(st, "steps");
  const process = steps.reduce((t, s) => t + hours(s.process), 0);
  const delay = steps.reduce((t, s) => t + hours(s.delay), 0);
  const set = (s: VsmStep, value: Record<string, unknown>) => op({ key: "steps", op: "update", id: s.id, value });
  const box = (s: VsmStep) => (
    <div key={s.id} className="ex-vsm-step">
      <div className="ex-vsm-delay" title="Delay before this step">
        <span aria-hidden>⏱</span>
        <InlineText value={s.delay ?? ""} placeholder="delay" readOnly={readOnly} onSave={(v) => set(s, { delay: v })} />
      </div>
      <div className="ex-vsm-box">
        <InlineText value={s.text} multiline readOnly={readOnly} onSave={(v) => (v.trim() ? set(s, { text: v.trim() }) : op({ key: "steps", op: "remove", id: s.id }))} />
        {!readOnly ? (
          <button className="ex-x" aria-label={`Remove ${s.text}`} onClick={() => op({ key: "steps", op: "remove", id: s.id })}>
            ×
          </button>
        ) : null}
      </div>
      <label>
        <span className="ex-mono">Process</span>
        <InlineText value={s.process ?? ""} placeholder="hrs" readOnly={readOnly} onSave={(v) => set(s, { process: v })} />
      </label>
      <label>
        <span className="ex-mono">%C&A</span>
        <InlineText value={s.ca ?? ""} placeholder="%" readOnly={readOnly} onSave={(v) => set(s, { ca: v })} />
      </label>
      {groups.length ? (
        <select value={s.group ?? ""} disabled={readOnly} onChange={(e) => set(s, { group: e.target.value })} aria-label="Group">
          <option value="">Group…</option>
          {groups.map((g) => (
            <option key={g}>{g}</option>
          ))}
        </select>
      ) : null}
    </div>
  );
  const lanesOf = groups.length ? [...groups.map((g) => [g, steps.filter((s) => s.group === g)] as const), ["Not grouped yet", steps.filter((s) => !s.group || !groups.includes(s.group))] as const].filter(([g, ss]) => ss.length || g !== "Not grouped yet") : [["", steps] as const];
  return (
    <div className="ex-board">
      {lanesOf.map(([g, ss]) => (
        <section key={g} className={g ? "ex-vsm-group" : undefined}>
          {g ? <div className="ex-mono">{g}</div> : null}
          <div className="ex-vsm">{ss.map(box)}</div>
        </section>
      ))}
      <AddLine placeholder="+ add a step (e.g. Feature definition), press Enter" readOnly={readOnly} onAdd={(text) => op({ key: "steps", op: "push", value: { text } })} />
      <div className="ex-vsm-total">
        <span>
          Process time <b>{process} hrs</b>
        </span>
        <span>
          Delay time <b>{delay} hrs</b>
        </span>
        <span>
          Flow efficiency <b>{process + delay ? Math.round((process / (process + delay)) * 100) : 0}%</b>
        </span>
      </div>
      <section className="ex-card">
        <BoxHead tint="#f6b9ae">{groups.length ? "Bottlenecks and what we would do to remove them" : "Delays between the steps"}</BoxHead>
        <StickyLane st={st} op={op} k="notes" readOnly={readOnly} />
      </section>
    </div>
  );
}
