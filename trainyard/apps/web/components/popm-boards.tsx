"use client";

// The exercise boards of the AI-Empowered SAFe POPM class (lesson 1): who is in the group and what
// they want to learn, the Lean-Agile mindset scenario, AI's disruption of product work, and the
// prompt builder for the SAFe message. Each keeps what people add in the frame's state.

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { LabChallenge } from "@trainyard/core";
import type { BoardProps } from "@/components/exercise-boards";

type St = Record<string, unknown>;
type Row = Record<string, unknown> & { id: string };
const list = (st: St, k: string) => (Array.isArray(st[k]) ? (st[k] as Row[]) : []);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const num = (v: unknown) => (typeof v === "number" ? v : 0);

/** A text field saved when it is left. */
function Field({ k, st, op, readOnly, placeholder, rows = 3, label }: Pick<BoardProps, "st" | "op" | "readOnly"> & { k: string; placeholder?: string; rows?: number; label: string }) {
  const saved = str(st[k]);
  const [v, setV] = useState(saved);
  useEffect(() => setV(saved), [saved]);
  return <textarea className="po-text" aria-label={label} rows={rows} value={v} placeholder={placeholder} disabled={readOnly} onChange={(e) => setV(e.target.value)} onBlur={() => v !== saved && op({ key: k, op: "set", value: v.trim() || null })} />;
}

/** One line to add a note, Enter to keep it. */
function AddLine({ placeholder, onAdd, label }: { placeholder: string; onAdd: (text: string) => void; label: string }) {
  const [v, setV] = useState("");
  const add = () => v.trim() && (onAdd(v.trim()), setV(""));
  return <input className="ex-add" value={v} aria-label={label} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} onBlur={add} />;
}

// ---- 1. Product role experience ----------------------------------------------------------------
// Each person shapes a "kite" on four axes of experience; the group's kites overlap into one
// picture of who is in the room, and what each came to learn hangs on the wall below.

const EXPERIENCE = [["agile", "Working in an Agile environment", "Agile"], ["po", "Product Owner role", "PO"], ["other", "Working outside of an Agile environment", "Non-Agile"], ["pm", "Product Manager role", "PM"]] as const;
const LEVELS = ["None", "A little", "Some", "A lot"];
const HUES = ["#2f6fbd", "#c2412d", "#2e8b57", "#8c6bc8", "#d98a1c", "#1f8a9e", "#b0457a", "#5a6b2f"];
/** A playful name for the shape of someone's experience. */
function shapeName(lv: Record<string, number>): string {
  const v = EXPERIENCE.map(([k]) => lv[k] ?? 0), max = Math.max(...v), min = Math.min(...v);
  if (max === 0) return "Fresh eyes";
  if (min >= 2) return "All-rounder";
  const top = EXPERIENCE[v.indexOf(max)]![0];
  if (v.filter((x) => x === max).length > 1 && max - min <= 1) return "Bridge builder";
  return { agile: "Agile native", po: "Backlog owner", other: "Seasoned traveller", pm: "Market mind" }[top];
}
const R = 96, CX = 130, CY = 130;
const point = (axis: number, level: number) => {
  const a = -Math.PI / 2 + (axis * Math.PI) / 2, r = 14 + (level / 3) * (R - 14);
  return [CX + Math.cos(a) * r, CY + Math.sin(a) * r] as const;
};
const kite = (lv: Record<string, unknown>) => EXPERIENCE.map(([k], i) => point(i, num(lv[k])).map((n) => n.toFixed(1)).join(",")).join(" ");

function Radar({ shapes, focus, size = 260 }: { shapes: { id: string; color: string; lv: Record<string, unknown>; name: string }[]; focus?: string | null; size?: number }) {
  return (
    <svg className="po-radar" width={size} height={size} viewBox="0 0 260 260" role="img" aria-label={shapes.length ? `Experience of ${shapes.map((s) => s.name).join(", ")}` : "Experience chart"}>
      {[3, 2, 1].map((l) => (<polygon key={l} points={[0, 1, 2, 3].map((i) => point(i, l).join(",")).join(" ")} fill={l === 3 ? "#fff" : "none"} stroke="#0d181833" strokeWidth="1.5" strokeDasharray={l === 3 ? undefined : "3 4"} />))}
      {[0, 1, 2, 3].map((i) => { const [x, y] = point(i, 3); return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#0d181833" strokeWidth="1.5" />; })}
      {shapes.map((s) => (
        <polygon key={s.id} className="po-kite" points={kite(s.lv)} fill={s.color} fillOpacity={focus ? (focus === s.id ? 0.5 : 0.06) : 0.22} stroke={s.color} strokeOpacity={focus && focus !== s.id ? 0.25 : 1} strokeWidth="3" strokeLinejoin="round" />
      ))}
      {EXPERIENCE.map(([k, , short], i) => { const [x, y] = point(i, 3); return <text key={k} x={x + (i === 1 ? 8 : i === 3 ? -8 : 0)} y={y + (i === 0 ? -9 : i === 2 ? 18 : 4)} textAnchor={i === 1 ? "start" : i === 3 ? "end" : "middle"} className="po-axis">{short}</text>; })}
    </svg>
  );
}

export function PoIntroBoard({ st, op, readOnly }: BoardProps) {
  const people = list(st, "people");
  const [draft, setDraft] = useState<{ name: string; learn: string; lv: Record<string, number> }>({ name: "", learn: "", lv: {} });
  const [focus, setFocus] = useState<string | null>(null);
  const color = (i: number) => HUES[i % HUES.length]!;
  const add = () => {
    if (!draft.name.trim()) return;
    op({ key: "people", op: "push", value: { name: draft.name.trim(), learn: draft.learn.trim(), ...Object.fromEntries(EXPERIENCE.map(([k]) => [k, draft.lv[k] ?? 0])) } });
    setDraft({ name: "", learn: "", lv: {} });
  };
  const mine = color(people.length);
  return (
    <div className="ex-board po">
      <div className="po-two">
        {!readOnly ? (
          <section className="po-panel">
            <span className="ex-mono">Step 1 · Shape your experience</span>
            <div className="po-make">
              <div className="po-mykite">
                <Radar size={190} shapes={[{ id: "me", color: mine, lv: draft.lv, name: draft.name || "you" }]} />
                <b style={{ color: mine }}>{shapeName(draft.lv)}</b>
              </div>
              <div className="po-sliders">
                <input className="po-input" value={draft.name} placeholder="Your name" aria-label="Your name" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                {EXPERIENCE.map(([k, label]) => (
                  <label key={k} className="po-slide">
                    <span>{label}<em>{LEVELS[draft.lv[k] ?? 0]}</em></span>
                    <input type="range" min={0} max={3} step={1} value={draft.lv[k] ?? 0} style={{ accentColor: mine }} onChange={(e) => setDraft({ ...draft, lv: { ...draft.lv, [k]: Number(e.target.value) } })} />
                  </label>
                ))}
              </div>
            </div>
            <span className="ex-mono">Step 2 · The most important thing I want to learn</span>
            <textarea className="po-text" rows={2} value={draft.learn} placeholder="From this course, I most want to learn…" aria-label="The most important thing I want to learn" onChange={(e) => setDraft({ ...draft, learn: e.target.value })} />
            <button className="po-btn" disabled={!draft.name.trim()} onClick={add}>Fly my kite with the group</button>
          </section>
        ) : null}
        <section className="po-panel po-sky">
          <span className="ex-mono">Our group · {people.length} {people.length === 1 ? "kite" : "kites"} in the sky</span>
          <Radar size={330} focus={focus} shapes={people.map((p, i) => ({ id: p.id, color: color(i), lv: p, name: str(p.name) }))} />
          <div className="po-legend">
            {people.map((p, i) => (
              <button key={p.id} aria-pressed={focus === p.id} style={{ ["--c" as string]: color(i) }} onMouseEnter={() => setFocus(p.id)} onMouseLeave={() => setFocus(null)} onFocus={() => setFocus(p.id)} onBlur={() => setFocus(null)} onClick={() => setFocus(focus === p.id ? null : p.id)}>
                <i />{str(p.name)}
              </button>
            ))}
          </div>
          <p className="po-note">{people.length ? "Point at a name to see that person's shape. Where the kites overlap is what the group shares; where one sticks out is what that person brings." : "Nobody yet. Shape your experience and fly your kite."}</p>
        </section>
      </div>
      {people.length ? <span className="ex-mono">What we came to learn</span> : null}
      <div className="po-people">
        {people.map((p, i) => (
          <article key={p.id} className={`po-person${focus === p.id ? " on" : ""}`} style={{ animationDelay: `${Math.min(i, 8) * 70}ms`, ["--c" as string]: color(i), ["--tilt" as string]: `${((i * 37) % 5) - 2}deg` }} onMouseEnter={() => setFocus(p.id)} onMouseLeave={() => setFocus(null)}>
            <header>
              <span className="po-avatar" aria-hidden style={{ background: color(i), color: "#fff" }}>{str(p.name).slice(0, 1).toUpperCase()}</span>
              <div>
                <b>{str(p.name)}</b>
                <small>{shapeName(Object.fromEntries(EXPERIENCE.map(([k]) => [k, num(p[k])])))}</small>
              </div>
              {!readOnly ? <button className="ex-x" aria-label={`Remove ${str(p.name)}`} onClick={() => op({ key: "people", op: "remove", id: p.id })}>×</button> : null}
            </header>
            <p>{str(p.learn) ? `“${str(p.learn)}”` : "Still thinking about what to learn."}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

// ---- 2. Applying a Lean-Agile mindset ----------------------------------------------------------

const MIND_TAGS = ["Lean thinking", "Agile values"];

export function PoMindsetBoard({ config, st, op, readOnly }: BoardProps) {
  const actions = (config.actions as string[] | undefined) ?? [];
  const notes = list(st, "notes");
  const [tag, setTag] = useState<Record<number, number>>({});
  return (
    <div className="ex-board po">
      <div className="po-scenario">
        <span className="ex-mono">Scenario</span>
        <p>{str(config.scenario)}</p>
      </div>
      <span className="ex-mono">How does each proposed action by the Product Owner align with the Lean-Agile mindset?</span>
      <div className="po-cols" style={{ ["--n" as string]: actions.length }}>
        {actions.map((a, ai) => {
          const mine = notes.filter((n) => num(n.action) === ai);
          const lean = mine.filter((n) => num(n.tag) === 0).length;
          return (
            <section key={a} className="po-col" style={{ animationDelay: `${ai * 110}ms` }}>
              <header>
                <span className="po-n">{ai + 1}</span>
                <b>{a}</b>
              </header>
              {mine.length ? (
                <div className="po-split" role="img" aria-label={`${lean} on Lean thinking, ${mine.length - lean} on Agile values`}>
                  <i style={{ width: `${(lean / mine.length) * 100}%` }} />
                </div>
              ) : null}
              {mine.map((n) => (
                <div key={n.id} className={`po-sticky t${num(n.tag)}`}>
                  <small>{MIND_TAGS[num(n.tag)]}</small>
                  <span>{str(n.text)}</span>
                  {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: "notes", op: "remove", id: n.id })}>×</button> : null}
                </div>
              ))}
              {!readOnly ? (
                <>
                  <div className="po-seg small" role="group" aria-label="This note is about">
                    {MIND_TAGS.map((t, ti) => (<button key={t} aria-pressed={(tag[ai] ?? 0) === ti} onClick={() => setTag({ ...tag, [ai]: ti })}>{t}</button>))}
                  </div>
                  <AddLine label={`How "${a}" aligns`} placeholder="+ how it aligns, Enter" onAdd={(text) => op({ key: "notes", op: "push", value: { action: ai, tag: tag[ai] ?? 0, text } })} />
                </>
              ) : null}
            </section>
          );
        })}
      </div>
      <p className="po-note"><i className="po-dot t0" /> Lean thinking <i className="po-dot t1" /> Agile values. The bar on each action shows the split of the class&apos;s notes.</p>
    </div>
  );
}

// ---- 3. AI disruption in Product Management ----------------------------------------------------

const AI_KINDS = ["Opportunity", "Risk"];

const WHEEL = ["#2f6fbd", "#2e8b57", "#d98a1c", "#8c6bc8", "#c2412d", "#1f8a9e"];

/** The picture above a set of question columns: each `look` draws the discussion's own shape from what people add. */
function LensVisual({ look, lenses, kinds, notes, config, st, op, readOnly }: { look: string; lenses: [string, string][]; kinds: string[]; notes: Row[]; config: Record<string, unknown>; st: St; op: BoardProps["op"]; readOnly: boolean }) {
  const count = (li: number) => notes.filter((n) => num(n.lens) === li).length;
  if (look === "pipeline") {
    const W = 880, step = W / lenses.length;
    return (
      <div className="po-vis">
        <svg viewBox={`0 0 ${W} 120`} className="po-pipe" role="img" aria-label={lenses.map(([n], i) => `${n}: ${count(i)} notes`).join(", ")}>
          <line x1={step / 2} y1="52" x2={W - step / 2} y2="52" stroke="#0d1815" strokeWidth="16" strokeLinecap="round" />
          <line className="po-flow" x1={step / 2} y1="52" x2={W - step / 2} y2="52" stroke="#ffd37a" strokeWidth="6" strokeLinecap="round" strokeDasharray="14 22" />
          {lenses.map(([n], i) => (
            <g key={n}>
              <circle cx={step / 2 + i * step} cy="52" r={26 + Math.min(count(i), 6) * 2} fill={count(i) ? "#2e8b57" : "#fff"} stroke="#0d1815" strokeWidth="3" className="po-node" />
              <text x={step / 2 + i * step} y="58" textAnchor="middle" className="po-node-n" fill={count(i) ? "#fff" : "#0d1815"}>{count(i)}</text>
              <text x={step / 2 + i * step} y="112" textAnchor="middle" className="po-deps-h">{n}</text>
            </g>
          ))}
        </svg>
        <p className="po-note">{str(config.pipeNote) || "Value flows left to right. A stage turns green and grows as the class adds how product roles support it; an empty stage is where the pipeline has no product voice yet."}</p>
      </div>
    );
  }
  if (look === "venn") {
    const verdicts = (config.verdicts as string[] | undefined) ?? [], v = typeof st.verdict === "number" ? st.verdict : -1;
    const pos = [[150, 92], [250, 92], [200, 168]], col = ["#2f6fbd", "#2e8b57", "#d98a1c"];
    return (
      <div className="po-vis two">
        <svg viewBox="0 0 400 270" className="po-venn" role="img" aria-label={lenses.map(([n], i) => `${n}: ${count(i)} notes`).join(", ")}>
          {lenses.slice(0, 3).map(([n], i) => (
            <g key={n}>
              <circle cx={pos[i]![0]} cy={pos[i]![1]} r="84" fill={col[i]} fillOpacity={0.12 + Math.min(count(i), 5) * 0.09} stroke={col[i]} strokeWidth="3" className="po-node" />
              <text x={pos[i]![0]! + (i === 0 ? -42 : i === 1 ? 42 : 0)} y={pos[i]![1]! + (i === 2 ? 44 : -30)} textAnchor="middle" className="po-deps-h">{n}</text>
              <text x={pos[i]![0]! + (i === 0 ? -42 : i === 1 ? 42 : 0)} y={pos[i]![1]! + (i === 2 ? 66 : -8)} textAnchor="middle" className="po-node-n">{count(i)}</text>
            </g>
          ))}
          <text x="200" y="122" textAnchor="middle" className="po-deps-h">{lenses.slice(0, 3).every((_, i) => count(i)) ? "Responsible" : "?"}</text>
        </svg>
        <div className="po-verdict">
          <span className="ex-mono">{str(config.verdictLabel)}</span>
          <div className="po-seg" role="group" aria-label={str(config.verdictLabel)}>
            {verdicts.map((x, i) => (<button key={x} disabled={readOnly} aria-pressed={v === i} onClick={() => op({ key: "verdict", op: "set", value: v === i ? null : i })}>{x}</button>))}
          </div>
          <p className="po-note">{lenses.slice(0, 3).every((_, i) => count(i)) ? "All three aspects have been looked at." : `Not looked at yet: ${lenses.slice(0, 3).filter((_, i) => !count(i)).map(([n]) => n).join(", ")}. The middle fills in when all three have.`}</p>
        </div>
      </div>
    );
  }
  if (look === "wheel") {
    const R = 70, C = 2 * Math.PI * R, per = kinds.map((_, k) => notes.filter((n) => num(n.kind) === k).length), total = per.reduce((a, b) => a + b, 0);
    let at = 0;
    return (
      <div className="po-vis two">
        <svg viewBox="0 0 200 200" className="po-wheel" role="img" aria-label={kinds.map((k, i) => `${k}: ${per[i]}`).join(", ")}>
          <circle cx="100" cy="100" r={R} fill="none" stroke="#0d181818" strokeWidth="30" />
          {kinds.map((k, i) => { const len = total ? (per[i]! / total) * C : 0, off = -at; at += len; return <circle key={k} className="po-slice" cx="100" cy="100" r={R} fill="none" stroke={WHEEL[i % WHEEL.length]} strokeWidth="30" strokeDasharray={`${Math.max(0, len - 2)} ${C}`} strokeDashoffset={off} transform="rotate(-90 100 100)" />; })}
          <text x="100" y="98" textAnchor="middle" className="po-pie-n">{total}</text>
          <text x="100" y="116" textAnchor="middle" className="po-axis">notes</text>
        </svg>
        <div className="po-verdict">
          <span className="ex-mono">{str(config.wheelLabel) || "Which sync events the class is leaning on"}</span>
          {kinds.map((k, i) => (
            <div key={k} className="po-bar-row" style={{ gridTemplateColumns: "110px minmax(0, 1fr) 28px" }}>
              <b style={{ fontSize: 13.5, gridColumn: "auto" }}>{k}</b>
              <div className="po-bar"><i style={{ width: `${total ? (per[i]! / Math.max(...per, 1)) * 100 : 0}%`, background: WHEEL[i % WHEEL.length] }} /></div>
              <small>{per[i]}</small>
            </div>
          ))}
          <p className="po-note">{total && per.some((x) => !x) ? `Not used yet: ${kinds.filter((_, i) => !per[i]).join(", ")}.` : str(config.wheelNote) || "Tag each note as you add it, and the wheel shows the split."}</p>
        </div>
      </div>
    );
  }
  if (look === "spectrum" || look === "scale") {
    const a = count(look === "scale" ? 0 : 1), b = count(look === "scale" ? 1 : 2);
    if (look === "scale") {
      const tilt = Math.max(-10, Math.min(14, (a ? 8 + a * 2 : 0) - b * 5));
      return (
        <div className="po-vis">
          <svg viewBox="0 0 520 190" className="po-seesaw" role="img" aria-label={`${a} on the issue, ${b} solutions`}>
            <polygon points="260,170 236,120 284,120" fill="#0d1815" />
            <g className="po-beam" style={{ transform: `rotate(${tilt}deg)` }}>
              <rect x="60" y="108" width="400" height="12" rx="6" fill="#0d1815" />
              <rect x="70" y="52" width="130" height="56" rx="8" fill="#f9d9d2" stroke="#0d1815" strokeWidth="2.5" />
              <text x="135" y="76" textAnchor="middle" className="po-deps-h">Two features</text>
              <text x="135" y="96" textAnchor="middle" className="po-deps-h">wanted · {a}</text>
              <rect x="320" y="52" width="130" height="56" rx="8" fill="#cfe8d4" stroke="#0d1815" strokeWidth="2.5" />
              <text x="385" y="76" textAnchor="middle" className="po-deps-h">Ways to make</text>
              <text x="385" y="96" textAnchor="middle" className="po-deps-h">it fit · {b}</text>
            </g>
            <text x="260" y="186" textAnchor="middle" className="po-axis">One team&apos;s capacity</text>
          </svg>
          <p className="po-note">{!a && !b ? "Name the core issue and the beam tips; each solution Product Management can present brings it back to level." : tilt > 2 ? "The demand still outweighs the capacity: what else could Product Management offer?" : "Balanced: the solutions answer the issue."}</p>
        </div>
      );
    }
    const t = a + b, share = t ? (a / t) * 100 : 50;
    return (
      <div className="po-vis">
        <div className="po-spectrum" role="img" aria-label={`${a} ideas for AI, ${b} things that stay human`}>
          <b>AI takes the load · {a}</b>
          <div><i style={{ width: `${share}%` }} /><span style={{ left: `${share}%` }} /></div>
          <b>Stays human · {b}</b>
        </div>
        <p className="po-note">The marker moves with the class&apos;s notes: what AI could take on against what should always remain a human responsibility.</p>
      </div>
    );
  }
  if (look === "diamond") {
    // Four corners of a diamond, one per column; a corner fills as the group adds to it.
    const pts = [[150, 26], [274, 150], [150, 274], [26, 150]], word = lenses.map(([n]) => n[0]).join("");
    return (
      <div className="po-vis two">
        <svg viewBox="0 0 300 300" className="po-venn" role="img" aria-label={lenses.map(([n], i) => `${n}: ${count(i)} notes`).join(", ")}>
          {pts.map((p, i) => { const q = pts[(i + 1) % 4]!; return <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={WHEEL[i % WHEEL.length]} strokeWidth="7" strokeLinecap="round" opacity={count(i) && count((i + 1) % 4) ? 1 : 0.25} className="po-node" />; })}
          {lenses.slice(0, 4).map(([n], i) => (
            <g key={n}>
              <circle className="po-node" cx={pts[i]![0]} cy={pts[i]![1]} r={20 + Math.min(count(i), 5) * 2} fill={count(i) ? WHEEL[i % WHEEL.length] : "#fff"} stroke={WHEEL[i % WHEEL.length]} strokeWidth="4" />
              <text x={pts[i]![0]} y={pts[i]![1]! + 7} textAnchor="middle" className="po-node-n" style={{ fill: count(i) ? "#fff" : "#0d1815" }}>{n[0]}</text>
            </g>
          ))}
          <text x="150" y="162" textAnchor="middle" className="po-pie-n">{word}</text>
        </svg>
        <div className="po-verdict">
          <span className="ex-mono">{str(config.visLabel)}</span>
          <p className="po-note">{lenses.filter((_, i) => !count(i)).length ? `Not covered yet: ${lenses.filter((_, i) => !count(i)).map(([n]) => n).join(", ")}. A side of the diamond lights up when both of its corners have an idea.` : "All four corners have an idea: the diamond is complete."}</p>
        </div>
      </div>
    );
  }
  if (look === "pair") {
    // Two columns weighed against each other, e.g. what we do today against what we are missing.
    const a = count(0), b = count(1), t = a + b, share = t ? (a / t) * 100 : 50;
    return (
      <div className="po-vis">
        <div className="po-spectrum" role="img" aria-label={`${lenses[0]?.[0]}: ${a}, ${lenses[1]?.[0]}: ${b}`}>
          <b>{lenses[0]?.[0]} · {a}</b>
          <div style={{ background: "#ffe9b8" }}><i style={{ width: `${share}%`, background: "#cfe8d4" }} /><span style={{ left: `${share}%` }} /></div>
          <b>{lenses[1]?.[0]} · {b}</b>
        </div>
        <p className="po-note">{str(config.visLabel)}</p>
      </div>
    );
  }
  if (look === "days") {
    // Thirty days ahead; each commitment in the first column lights the next few days.
    const n = Math.min(30, count(0) * 5);
    return (
      <div className="po-vis">
        <div className="po-days" role="img" aria-label={`${count(0)} practices to start in the next 30 days`}>{Array.from({ length: 30 }, (_, i) => (<i key={i} className={i < n ? "on" : ""} style={{ transitionDelay: `${i * 18}ms` }} />))}</div>
        <p className="po-note"><b>{count(0)}</b> {count(0) === 1 ? "practice" : "practices"} to start in the next 30 days. {str(config.visLabel)}</p>
      </div>
    );
  }
  if (look === "pivot") {
    // Four pivots as arrows fanning out from the customer; pick the one that would help.
    const pivots = (config.pivots as string[] | undefined) ?? [], sel = typeof st.pivot === "number" ? st.pivot : -1, ang = [-168, -116, -64, -12];
    const pick = (i: number) => !readOnly && op({ key: "pivot", op: "set", value: sel === i ? null : i });
    return (
      <div className="po-vis two" style={{ gridTemplateColumns: "minmax(260px, 420px) minmax(0, 1fr)" }}>
        <svg viewBox="0 0 420 250" className="po-pivot" role="group" aria-label="Pivots">
          {pivots.slice(0, 4).map((n, i) => {
            const on = sel === i, tone = on ? "#d98a1c" : i === 1 || i === 2 ? "#a9c43c" : "#3f7c80", words = n.split(" ");
            const r = (ang[i]! * Math.PI) / 180, lx = 210 + Math.cos(r) * 165, ly = 196 + Math.sin(r) * 150;
            return (
              <g key={n} className={`po-arrow-g${on ? " on" : ""}`} role="button" tabIndex={readOnly ? -1 : 0} aria-pressed={on} aria-label={n} onClick={() => pick(i)} onKeyDown={(e) => e.key === "Enter" && pick(i)}>
                <g transform={`translate(210 196) rotate(${ang[i]})`}><path d="M 46 -11 L 96 -11 L 96 -24 L 128 0 L 96 24 L 96 11 L 46 11 Z" fill={tone} stroke="#0d1815" strokeWidth={on ? 2.5 : 0} /></g>
                {words.map((w, wi) => (<text key={w} x={lx} y={ly + wi * 15 - (words.length - 1) * 7} textAnchor="middle" className="po-deps-h" style={{ fontSize: 13, fontWeight: on ? 900 : 700 }}>{w}</text>))}
              </g>
            );
          })}
          <circle cx="210" cy="196" r="42" fill="#fff" stroke="#a9c43c" strokeWidth="6" />
          <circle cx="210" cy="184" r="12" fill="#777" /><path d="M186 222 q24 -34 48 0 z" fill="#06384a" />
        </svg>
        <div className="po-verdict">
          <span className="ex-mono">The pivot that could improve this MVP</span>
          <b className="as-verdict">{sel >= 0 ? pivots[sel] : "Pick an arrow"}</b>
          <p className="po-note">Click an arrow to choose the pivot, then describe the scenario and the next experiment below.</p>
        </div>
      </div>
    );
  }
  if (look === "palette") {
    // The palette of Big Picture additions: three aspects, each with its kinds; a kind lights up when a note is tagged with it.
    const groups = (config.palette as [string, string[]][] | undefined) ?? [];
    return (
      <div className="po-vis">
        <div className="bp-palette">
          {groups.map(([g, items]) => (
            <div key={g} className="bp-pal-row">
              <b>{g}</b>
              {items.map((it) => { const n = notes.filter((x) => kinds[num(x.kind)] === it).length; return <span key={it} className={n ? "on" : ""}>{it}{n ? <i>{n}</i> : null}</span>; })}
            </div>
          ))}
        </div>
        <p className="po-note">Additions to the Big Picture can be made with this palette. Tag a note with the kind of addition it would be, and that tile lights up.</p>
      </div>
    );
  }
  if (look === "triangle") {
    // Three measurement domains as a triangle; each corner grows with the notes tagged to it, split into used well and used poorly.
    const pts = [[150, 34], [44, 206], [256, 206]];
    return (
      <div className="po-vis two">
        <svg viewBox="0 0 300 250" className="po-venn" role="img" aria-label={kinds.map((k, i) => `${k}: ${notes.filter((n) => num(n.kind) === i).length} notes`).join(", ")}>
          <polygon points={pts.map((p) => p.join(",")).join(" ")} fill="#0d181808" stroke="#0d1815" strokeWidth="2.5" strokeLinejoin="round" />
          {kinds.slice(0, 3).map((k, i) => {
            const mine = notes.filter((n) => num(n.kind) === i), good = mine.filter((n) => num(n.lens) === 0).length, r = 22 + Math.min(mine.length, 6) * 3, C = 2 * Math.PI * r;
            return (
              <g key={k}>
                <circle className="po-node" cx={pts[i]![0]} cy={pts[i]![1]} r={r} fill="#fff" stroke="#c2412d" strokeWidth="7" />
                <circle className="po-node" cx={pts[i]![0]} cy={pts[i]![1]} r={r} fill="none" stroke="#2e8b57" strokeWidth="7" strokeDasharray={`${mine.length ? (good / mine.length) * C : C} ${C}`} transform={`rotate(-90 ${pts[i]![0]} ${pts[i]![1]})`} opacity={mine.length ? 1 : 0.15} />
                <text x={pts[i]![0]} y={pts[i]![1]! + 6} textAnchor="middle" className="po-node-n">{mine.length}</text>
                <text x={pts[i]![0]} y={pts[i]![1]! + (i === 0 ? -r - 8 : r + 20)} textAnchor="middle" className="po-deps-h">{k}</text>
              </g>
            );
          })}
        </svg>
        <div className="po-verdict">
          <span className="ex-mono">The three measurement domains</span>
          <p className="po-note">Tag each note with its domain. A corner grows with what the class has seen there; the green part of its ring is where metrics were used well, the red where they were used poorly.</p>
          <p className="po-note">{kinds.slice(0, 3).filter((_, i) => !notes.some((n) => num(n.kind) === i)).length ? `Nothing yet on: ${kinds.slice(0, 3).filter((_, i) => !notes.some((n) => num(n.kind) === i)).join(", ")}.` : "All three domains have stories."}</p>
        </div>
      </div>
    );
  }
  if (look === "loop") {
    // Continuous improvement as a loop of three arcs, one per thing that can change; an arc closes when the group has a tip for it.
    const R = 62, C = 2 * Math.PI * R, arc = C / lenses.length, done = lenses.filter((_, i) => count(i)).length;
    return (
      <div className="po-vis two">
        <svg viewBox="0 0 200 200" className={`po-wheel${done === lenses.length ? " spin" : ""}`} role="img" aria-label={`${done} of ${lenses.length} parts of the loop have a tip`}>
          <circle cx="100" cy="100" r={R} fill="none" stroke="#0d181818" strokeWidth="22" />
          {lenses.map(([n], i) => (<circle key={n} className="po-slice" cx="100" cy="100" r={R} fill="none" stroke={WHEEL[i % WHEEL.length]} strokeWidth="22" strokeLinecap="round" strokeDasharray={`${count(i) ? arc - 16 : 0} ${C}`} strokeDashoffset={-(i * arc) - 8} transform="rotate(-90 100 100)" />))}
          <text x="100" y="98" textAnchor="middle" className="po-pie-n">{done}/{lenses.length}</text>
          <text x="100" y="116" textAnchor="middle" className="po-axis">in the loop</text>
        </svg>
        <div className="po-verdict">
          <span className="ex-mono">{str(config.loopLabel) || "Fuelling continuous improvement"}</span>
          <p className="po-note">{done === lenses.length ? str(config.loopDone) || "The loop is closed: the group has a change to try for each of the three." : `Still open: ${lenses.filter((_, i) => !count(i)).map(([n]) => n.toLowerCase()).join(", ")}. Each arc closes when the group names what it would change there.`}</p>
        </div>
      </div>
    );
  }
  if (look === "dial") {
    const d = config.dial as { label: string; low: string; high: string } | undefined, v = typeof st.dial === "number" ? st.dial : 50, ang = -90 + (v / 100) * 180;
    if (!d) return null;
    return (
      <div className="po-vis two">
        <svg viewBox="0 0 240 150" className="po-dial" role="img" aria-label={`${d.label}: ${v} of 100`}>
          <path d="M 30 130 A 90 90 0 0 1 210 130" fill="none" stroke="#0d181822" strokeWidth="18" strokeLinecap="round" />
          <path d="M 30 130 A 90 90 0 0 1 210 130" fill="none" stroke="#d98a1c" strokeWidth="18" strokeLinecap="round" strokeDasharray={Math.PI * 90} strokeDashoffset={Math.PI * 90 * (1 - v / 100)} className="po-ring-v" />
          <g className="po-needle" style={{ transform: `rotate(${ang}deg)` }}><line x1="120" y1="130" x2="120" y2="56" stroke="#0d1815" strokeWidth="5" strokeLinecap="round" /></g>
          <circle cx="120" cy="130" r="9" fill="#0d1815" />
        </svg>
        <div className="po-verdict">
          <span className="ex-mono">{d.label}</span>
          <input type="range" min={0} max={100} step={5} value={v} disabled={readOnly} aria-label={d.label} style={{ width: "100%", accentColor: "#d98a1c" }} onChange={(e) => op({ key: "dial", op: "set", value: Number(e.target.value) })} />
          <div className="po-dial-ends"><span>{d.low}</span><span>{d.high}</span></div>
        </div>
      </div>
    );
  }
  return null;
}

export function PoAiBoard({ config, st, op, readOnly }: BoardProps) {
  const lenses = (config.lenses as [string, string][] | undefined) ?? [];
  const kinds = (config.kinds as string[] | undefined) ?? AI_KINDS;
  const notes = list(st, "notes");
  const [kind, setKind] = useState<Record<number, number>>({});
  const starred = notes.filter((n) => n.star === true);
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
      {config.heading ? (
        <label className="po-heading">
          <span className="ex-mono">{(config.heading as { label: string }).label}</span>
          <Field k="heading" st={st} op={op} readOnly={readOnly} rows={1} placeholder={(config.heading as { placeholder?: string }).placeholder ?? ""} label={(config.heading as { label: string }).label} />
        </label>
      ) : null}
      {Array.isArray(config.examples) ? (
        <div className="ex-examples">
          <span className="ex-mono">Examples</span>
          {(config.examples as string[]).map((e) => (<span key={e} className="ex-chip">{e}</span>))}
        </div>
      ) : null}
      <LensVisual look={str(config.look)} lenses={lenses} kinds={kinds} notes={notes} config={config} st={st} op={op} readOnly={readOnly} />
      <div className="po-cols" style={{ ["--n" as string]: lenses.length }}>
        {lenses.map(([name, question], li) => {
          const mine = notes.filter((n) => num(n.lens) === li);
          return (
            <section key={name} className="po-col" style={{ animationDelay: `${li * 110}ms` }}>
              <header>
                <span className="po-n">{kinds.length ? "✦" : li + 1}</span>
                <b>{name}</b>
              </header>
              <p className="po-q">{question}</p>
              {mine.map((n) => (
                <div key={n.id} className={`po-sticky k${Array.isArray(config.tones) ? 0 : num(n.kind)}${n.star ? " star" : ""}`} style={Array.isArray(config.tones) ? { background: (config.tones as string[])[li], borderLeftColor: li ? "#c2412d" : "#2e8b57" } : undefined}>
                  {kinds.length ? <small>{kinds[num(n.kind)]}</small> : null}
                  <span>{str(n.text)}</span>
                  {!readOnly ? (
                    <span className="po-acts">
                      <button aria-pressed={n.star === true} aria-label={n.star ? "Do not share this one" : "Share this one with the class"} title="Share with the class" onClick={() => op({ key: "notes", op: "update", id: n.id, value: { star: !n.star } })}>★</button>
                      <button className="ex-x" aria-label="Remove" onClick={() => op({ key: "notes", op: "remove", id: n.id })}>×</button>
                    </span>
                  ) : null}
                </div>
              ))}
              {!readOnly ? (
                <>
                  {kinds.length ? (
                    <div className={kinds.length > 3 || lenses.length > 4 ? "po-tags" : "po-seg small"} role="group" aria-label="This is">
                      {kinds.map((t, ti) => (<button key={t} aria-pressed={(kind[li] ?? 0) === ti} onClick={() => setKind({ ...kind, [li]: ti })}>{t}</button>))}
                    </div>
                  ) : null}
                  <AddLine label={name} placeholder={str(config.add) || "+ what changes, Enter"} onAdd={(text) => op({ key: "notes", op: "push", value: { lens: li, kind: kind[li] ?? 0, text } })} />
                </>
              ) : null}
            </section>
          );
        })}
      </div>
      <section className="po-share">
        <span className="ex-mono">{str(config.shareLabel) || "Step 2 · What we share with the class"}</span>
        {starred.length ? (
          <ol>
            {starred.map((n) => (<li key={n.id}><b>{lenses[num(n.lens)]?.[0]}:</b> {str(n.text)}</li>))}
          </ol>
        ) : (
          <p className="po-note">Mark a note with ★ and it lines up here for the share-out.</p>
        )}
      </section>
    </div>
  );
}

// ---- 4. Develop your SAFe message --------------------------------------------------------------

const PARTS = [
  ["goal", "Goal", "What are you trying to accomplish?"],
  ["role", "Role", "What persona or area of expertise should the AI assume in formulating its response?"],
  ["task", "Task", "What exactly do you want the AI to do?"],
  ["context", "Context", "(optional) Is there background info the AI needs?"],
  ["details", "Details", "(optional) Are there any specific requirements?"],
] as const;
const promptOf = (st: St, round: string) => PARTS.map(([k, label]) => (str(st[`${round}:${k}`]) ? `${label}: ${str(st[`${round}:${k}`])}` : "")).filter(Boolean).join("\n\n");

export function PoMessageBoard({ config, st, op, readOnly }: BoardProps) {
  const [round, setRound] = useState<"r1" | "r2">("r1");
  const [copied, setCopied] = useState(false);
  const filled = PARTS.filter(([k]) => str(st[`${round}:${k}`])).length, C = 2 * Math.PI * 34;
  const prompt = promptOf(st, round);
  const copy = () => void navigator.clipboard?.writeText(prompt).then(() => (setCopied(true), window.setTimeout(() => setCopied(false), 1600)));
  const startRefine = () => {
    for (const [k] of PARTS) if (!str(st[`r2:${k}`]) && str(st[`r1:${k}`])) op({ key: `r2:${k}`, op: "set", value: str(st[`r1:${k}`]) });
    setRound("r2");
  };
  return (
    <div className="ex-board po">
      <div className="po-chat">
        <span className="po-avatar" aria-hidden>{str(config.avatar) || "SD"}</span>
        <div>
          <span className="ex-mono">{str(config.from) || "Message from the Senior Developer"}</span>
          <p>{str(config.scenario)}</p>
        </div>
      </div>
      <div className="po-seg" role="tablist" aria-label="Round">
        <button role="tab" aria-selected={round === "r1"} aria-pressed={round === "r1"} onClick={() => setRound("r1")}>{(config.tabs as string[] | undefined)?.[0] ?? "Step 2 · First prompt"}</button>
        <button role="tab" aria-selected={round === "r2"} aria-pressed={round === "r2"} onClick={() => (round === "r2" || readOnly ? setRound("r2") : startRefine())}>{(config.tabs as string[] | undefined)?.[1] ?? "Step 3 · Refine and compare"}</button>
      </div>
      <div className="po-two wide" key={round}>
        <section className="po-panel">
          <header className="po-build">
            <span className="po-ring">
              <svg width="80" height="80" viewBox="0 0 80 80" role="img" aria-label={`${filled} of 5 elements in the prompt`}>
                <circle cx="40" cy="40" r="34" fill="none" stroke="#0d181822" strokeWidth="8" />
                <circle className="po-ring-v" cx="40" cy="40" r="34" fill="none" stroke={filled === 5 ? "#2e8b57" : "#d98a1c"} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - filled / 5)} transform="rotate(-90 40 40)" />
              </svg>
              <b>{filled}/5</b>
            </span>
            <div>
              <b>Include in every prompt</b>
              <p className="po-note">{filled === 5 ? "All five elements are in." : `Still missing: ${PARTS.filter(([k]) => !str(st[`${round}:${k}`])).map(([, l]) => l).join(", ")}.`}</p>
            </div>
          </header>
          {PARTS.map(([k, label, hint]) => (
            <label key={k} className={`po-part${str(st[`${round}:${k}`]) ? " on" : ""}`}>
              <span>{label}</span>
              <Field k={`${round}:${k}`} st={st} op={op} readOnly={readOnly} rows={2} placeholder={hint} label={label} />
            </label>
          ))}
        </section>
        <section className="po-panel">
          <span className="ex-mono">The prompt to paste into your LLM</span>
          <pre className="po-prompt">{prompt || "Fill in the five elements and the prompt is assembled here."}</pre>
          <button className="po-btn" disabled={!prompt} onClick={copy}>{copied ? "Copied" : "Copy the prompt"}</button>
          <span className="ex-mono" style={{ marginTop: 8 }}>The response it gave</span>
          <Field k={`${round}:resp`} st={st} op={op} readOnly={readOnly} rows={6} placeholder="Paste the response here, so the group can evaluate it." label="The response" />
          {round === "r1" ? (
            <>
              <span className="ex-mono">What is missing from it?</span>
              <Field k="missing" st={st} op={op} readOnly={readOnly} rows={3} placeholder="Too long, wrong tone, does not answer the worry about meetings…" label="What is missing" />
            </>
          ) : null}
        </section>
      </div>
      {round === "r2" ? (
        <section className="po-compare">
          <span className="ex-mono">Compare the results</span>
          <div className="po-two wide">
            {(["r1", "r2"] as const).map((r, i) => (
              <div key={r} className="po-panel">
                <b>{i ? "After refining" : "First prompt"}</b>
                <p className="po-resp">{str(st[`${r}:resp`]) || "No response pasted yet."}</p>
              </div>
            ))}
          </div>
          {str(st.missing) ? <p className="po-note"><b>What was missing:</b> {str(st.missing)}</p> : null}
        </section>
      ) : null}
    </div>
  );
}

// ---- Lesson 2 · market rhythms and release timing ----------------------------------------------
// Like the LPM market rhythms board: a demand curve per market that the class shapes month by
// month, market events as diamonds, and the months marked as release windows. The quietest months
// across the markets are pointed out, since the release takes vans out of service.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MX = (i: number) => 60 + i * 56 + 28, MY = (v: number) => 250 - v * 20;
function curve(v: number[]) {
  const p = v.map((y, i) => [MX(i), MY(y)] as const);
  let d = `M ${p[0]![0]} ${p[0]![1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i]!, p1 = p[i]!, p2 = p[i + 1]!, p3 = p[i + 2] ?? p2;
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function PoRhythmBoard({ config, st, op, readOnly }: BoardProps) {
  // Each market: its name, colour, the slide's baseline curve, and whether the line is dashed.
  const markets = (config.markets as [string, string, number[]?, boolean?][] | undefined) ?? [];
  const base = (mi: number): number[] => (markets[mi]?.[2]?.length === 12 ? markets[mi]![2]! : Array(12).fill(5));
  const saved = (mi: number): number[] => (Array.isArray(st[`d:${mi}`]) && (st[`d:${mi}`] as unknown[]).length === 12 ? (st[`d:${mi}`] as number[]) : base(mi));
  // While a point is dragged the curve follows the pointer; the value is saved when it is let go.
  const [drag, setDrag] = useState<{ mi: number; i: number; v: number } | null>(null);
  const demand = (mi: number) => (drag && drag.mi === mi ? saved(mi).map((v, j) => (j === drag.i ? drag.v : v)) : saved(mi));
  const svg = useRef<SVGSVGElement>(null);
  const valueAt = (clientY: number) => {
    const r = svg.current!.getBoundingClientRect(), y = ((clientY - r.top) / r.height) * 300;
    return Math.max(0, Math.min(10, Math.round(((250 - y) / 20) * 2) / 2));
  };
  const setPoint = (mi: number, i: number, v: number) => op({ key: `d:${mi}`, op: "set", value: saved(mi).map((x, j) => (j === i ? Math.max(0, Math.min(10, v)) : x)) });
  const events = list(st, "events"), win = (st.win && typeof st.win === "object" ? st.win : {}) as Record<string, boolean>;
  const [ev, setEv] = useState({ name: "", market: 0, month: 0 });
  const total = MONTHS.map((_, i) => markets.reduce((n, _m, mi) => n + demand(mi)[i]!, 0));
  const low = Math.min(...total), quiet = MONTHS.filter((_, i) => total[i]! <= low + 0.5);
  const chosen = MONTHS.filter((_, i) => win[i]);
  const changed = markets.some((_, mi) => Array.isArray(st[`d:${mi}`]));
  const flat = typeof config.reference === "number" ? config.reference : null;
  return (
    <div className="ex-board po">
      <div className="po-scenario">
        <span className="ex-mono">Scenario</span>
        <p>{str(config.scenario)}</p>
      </div>
      <section className="po-panel">
        <div className="po-legend left">
          {markets.map(([name, color, , dashed]) => (<span key={name}><i style={{ background: dashed ? `repeating-linear-gradient(90deg, ${color} 0 7px, transparent 7px 11px)` : color }} />{name}</span>))}
          {flat !== null ? <span><i style={{ background: "#a9c43c" }} />Steady value, for comparison</span> : null}
          <span><i className="sq" style={{ background: "#2e8b57" }} />Release window</span>
          {!readOnly && changed ? <button className="po-reset" onClick={() => markets.forEach((_, mi) => op({ key: `d:${mi}`, op: "set", value: null }))}>Back to the slide&apos;s curves</button> : null}
        </div>
        <div className="po-chartwrap">
          <svg ref={svg} className={`po-chart${drag ? " dragging" : ""}`} viewBox="0 0 760 300" role="img" aria-label={`Value through the year for ${markets.map((m) => m[0]).join(" and ")}`}
            onPointerMove={(e) => drag && setDrag({ ...drag, v: valueAt(e.clientY) })}
            onPointerUp={() => drag && (setPoint(drag.mi, drag.i, drag.v), setDrag(null))}
            onPointerLeave={() => drag && (setPoint(drag.mi, drag.i, drag.v), setDrag(null))}>
            {MONTHS.map((m, i) => (
              <g key={m}>
                <rect className="po-win" x={MX(i) - 28} y={30} width={56} height={228} fill="#2e8b57" opacity={win[i] ? 0.18 : 0} />
                {total[i]! <= low + 0.5 ? <rect x={MX(i) - 28} y={254} width={56} height={5} fill="#d98a1c" /> : null}
                <text x={MX(i)} y={276} textAnchor="middle" className="po-axis mo">{m}</text>
                {i % 3 === 0 ? <line x1={MX(i) - 28} y1={30} x2={MX(i) - 28} y2={258} stroke="#0d181826" strokeDasharray="3 5" /> : null}
                {i % 3 === 1 ? <text x={MX(i)} y={294} textAnchor="middle" className="po-axis q">Q{Math.floor(i / 3) + 1}</text> : null}
              </g>
            ))}
            <line x1="56" y1="26" x2="56" y2="258" stroke="#0d1815" strokeWidth="2" />
            <line x1="56" y1="258" x2="736" y2="258" stroke="#0d1815" strokeWidth="2" />
            <text x="14" y="52" className="po-axis" transform="rotate(-90 14 52)" textAnchor="end">High value</text>
            <text x="14" y="252" className="po-axis" transform="rotate(-90 14 252)">Low value</text>
            {flat !== null ? <line x1={MX(0)} y1={MY(flat)} x2={MX(11)} y2={MY(flat)} stroke="#a9c43c" strokeWidth="4" /> : null}
            {markets.map(([name, color, , dashed], mi) => (<path key={name} className={dashed ? "po-curve dashed" : "po-curve"} d={curve(demand(mi))} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />))}
            {events.map((e, j) => {
              const x = MX(num(e.month)), y = 44 + (j % 3) * 22, c = markets[num(e.market)]?.[1] ?? "#0d1815";
              return (
                <g key={e.id} className="po-evt">
                  <polygon points={`${x},${y - 9} ${x + 9},${y} ${x},${y + 9} ${x - 9},${y}`} fill={c} stroke="#0d1815" strokeWidth="1.5" />
                  <text x={x + 13} y={y + 4} className="po-evt-t">{str(e.name)}</text>
                </g>
              );
            })}
            {!readOnly ? markets.map(([name, color], mi) => demand(mi).map((v, i) => (
              <g key={`${mi}-${i}`} className={`po-handle${drag && drag.mi === mi && drag.i === i ? " on" : ""}`} tabIndex={0} role="slider" aria-label={`${name}, ${MONTHS[i]}`} aria-valuemin={0} aria-valuemax={10} aria-valuenow={v}
                onPointerDown={(e) => ((e.target as Element).setPointerCapture?.(e.pointerId), setDrag({ mi, i, v }))}
                onKeyDown={(e) => (e.key === "ArrowUp" || e.key === "ArrowDown") && (e.preventDefault(), setPoint(mi, i, v + (e.key === "ArrowUp" ? 0.5 : -0.5)))}>
                <circle cx={MX(i)} cy={MY(v)} r="16" fill="transparent" />
                <circle cx={MX(i)} cy={MY(v)} r="7" fill="#fff" stroke={color} strokeWidth="3.5" />
                {drag && drag.mi === mi && drag.i === i ? <text x={MX(i)} y={MY(v) - 16} textAnchor="middle" className="po-evt-t">{v >= 7.5 ? "High" : v >= 4 ? "Medium" : "Low"}</text> : null}
              </g>
            ))) : null}
          </svg>
        </div>
        <div className="po-bars" role="group" aria-label="Release windows">
          <b style={{ color: "#2e8b57" }}>Release window</b>
          {MONTHS.map((m, i) => (
            <button key={m} className="po-pick" disabled={readOnly} aria-pressed={!!win[i]} onClick={() => op({ key: "win", op: "set", value: { ...win, [i]: !win[i] } })}>{m}</button>
          ))}
        </div>
        <p className="po-note">The curves start as on the slide. Drag any point up or down to reshape a market&apos;s rhythm (or focus a point and use the arrow keys). Click a month in the row below the chart to mark a release window.</p>
      </section>
      <div className="po-two">
        <section className="po-panel">
          <span className="ex-mono">Market rhythms and events</span>
          {events.map((e) => (
            <div key={e.id} className="po-sticky" style={{ background: "#fff", borderLeftColor: markets[num(e.market)]?.[1] }}>
              <small>{markets[num(e.market)]?.[0]} · {MONTHS[num(e.month)]}</small>
              <span>{str(e.name)}</span>
              {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: "events", op: "remove", id: e.id })}>×</button> : null}
            </div>
          ))}
          {!readOnly ? (
            <div className="po-evform">
              <input className="po-input" value={ev.name} placeholder="Event, e.g. holiday shopping peak" aria-label="Event" onChange={(e) => setEv({ ...ev, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && ev.name.trim() && (op({ key: "events", op: "push", value: { name: ev.name.trim(), market: ev.market, month: ev.month } }), setEv({ ...ev, name: "" }))} />
              <select className="po-input" value={ev.market} aria-label="Market" onChange={(e) => setEv({ ...ev, market: Number(e.target.value) })}>{markets.map(([n], i) => (<option key={n} value={i}>{n}</option>))}</select>
              <select className="po-input" value={ev.month} aria-label="Month" onChange={(e) => setEv({ ...ev, month: Number(e.target.value) })}>{MONTHS.map((m, i) => (<option key={m} value={i}>{m}</option>))}</select>
              <button className="po-btn" disabled={!ev.name.trim()} onClick={() => (op({ key: "events", op: "push", value: { name: ev.name.trim(), market: ev.market, month: ev.month } }), setEv({ ...ev, name: "" }))}>Add</button>
            </div>
          ) : null}
        </section>
        <section className="po-panel">
          <span className="ex-mono">Key times to release the new hardware</span>
          <p className="po-big">{chosen.length ? chosen.join(", ") : "No release window marked yet."}</p>
          <p className="po-note">Lowest value at stake for both markets together: <b>{quiet.join(", ")}</b> (the orange marks under the chart).{chosen.length && !chosen.some((m) => quiet.includes(m)) ? " None of your windows is in one of those months; is there a reason?" : ""}</p>
          <Field k="why" st={st} op={op} readOnly={readOnly} rows={3} placeholder="Why these times minimize disruption to customers…" label="Why these times" />
        </section>
      </div>
    </div>
  );
}

// ---- Lesson 2 · writing features ---------------------------------------------------------------

const FEATURE_PARTS = [["desc", "Description", "What the feature does"], ["hyp", "Benefit hypothesis", "Name the primary customer and the benefit"], ["intent", "Intent", "What it is meant to achieve"], ["ac", "Acceptance criteria", "One per line"]] as const;
const featureDone = (f: Row) => FEATURE_PARTS.every(([k]) => str(f[k]));

function FeatureText({ f, k, label, hint, op, readOnly, listKey = "feats" }: { f: Row; k: string; label: string; hint: string; op: BoardProps["op"]; readOnly: boolean; listKey?: string }) {
  const saved = str(f[k]);
  const [v, setV] = useState(saved);
  useEffect(() => setV(saved), [saved]);
  return (
    <label className="po-flabel">
      <span>{label}</span>
      <textarea className="po-text" rows={k === "ac" ? 3 : 2} value={v} placeholder={hint} disabled={readOnly} onChange={(e) => setV(e.target.value)} onBlur={() => v !== saved && op({ key: listKey, op: "update", id: f.id, value: { [k]: v.trim() } })} />
    </label>
  );
}

export function PoFeatureBoard({ config, st, op, readOnly }: BoardProps) {
  const feats = list(st, "feats"), example = config.example as Record<string, string> | undefined;
  const done = feats.filter(featureDone).length;
  const [name, setName] = useState("");
  const add = () => name.trim() && (op({ key: "feats", op: "push", value: { name: name.trim() } }), setName(""));
  // The WSJF exercise (the Leading SAFe board) names its rows from `feat`; keep it in step.
  const names = feats.map((f) => str(f.name)).join("\n"), mirrored = (Array.isArray(st.feat) ? (st.feat as { t?: string }[]) : []).map((f) => f.t ?? "").join("\n");
  useEffect(() => {
    if (!readOnly && feats.length && names !== mirrored && !feats.some((f) => f.id.startsWith("tmp"))) op({ key: "feat", op: "set", value: feats.map((f) => ({ t: str(f.name), h: str(f.hyp), a: str(f.ac) })) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names, mirrored, readOnly]);
  return (
    <div className="ex-board po">
      <div className="po-epicrow">
        <div className="po-epic">
          <span className="ex-mono">Epic</span>
          <p>{str(config.epic)}</p>
          <span className="po-epicarrow" aria-hidden>↓ decompose into features</span>
        </div>
        {example ? (
          <div className="po-feat example">
            <span className="ex-mono">Feature · example</span>
            {FEATURE_PARTS.map(([k, label]) => (k === "ac" ? (
              <div key={k}><span className="lab">{label}:</span><ul>{example[k]!.split(/(?<=\.)\s+|\n/).filter(Boolean).map((x) => (<li key={x}>{x.replace(/\.$/, "")}</li>))}</ul></div>
            ) : (
              <p key={k}><span className="lab">{label}:</span> {example[k]}</p>
            )))}
          </div>
        ) : null}
      </div>
      <div className="po-build">
        <span className="po-count" data-ok={feats.length >= 3 && done === feats.length}>{done}/{Math.max(3, feats.length)}</span>
        <p className="po-note">Step 1: at least three potential features for an MVP. Step 2: give each a description, its intent, a benefit hypothesis that names the primary customer, and acceptance criteria.</p>
      </div>
      <div className="po-feats">
        {feats.map((f, i) => (
          <article key={f.id} className={`po-feat${featureDone(f) ? " done" : ""}`} style={{ animationDelay: `${Math.min(i, 6) * 80}ms` }}>
            <header>
              <span className="po-n">{i + 1}</span>
              <b>{str(f.name)}</b>
              <span className="po-fdots" aria-label={`${FEATURE_PARTS.filter(([k]) => str(f[k])).length} of 4 parts written`}>{FEATURE_PARTS.map(([k]) => (<i key={k} className={str(f[k]) ? "on" : ""} />))}</span>
              {!readOnly ? <button className="ex-x" aria-label={`Remove ${str(f.name)}`} onClick={() => op({ key: "feats", op: "remove", id: f.id })}>×</button> : null}
            </header>
            {FEATURE_PARTS.map(([k, label, hint]) => (<FeatureText key={k} f={f} k={k} label={label} hint={hint} op={op} readOnly={readOnly} />))}
          </article>
        ))}
        {!readOnly ? (
          <div className="po-feat new">
            <span className="ex-mono">{feats.length < 3 ? `Feature ${feats.length + 1} of at least three` : "Another feature"}</span>
            <input className="po-input" value={name} placeholder="Name the feature" aria-label="Feature name" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            <button className="po-btn" disabled={!name.trim()} onClick={add}>Add the feature</button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---- Lesson 2 · prompt, refine and edit --------------------------------------------------------

const DECIDE = [["keep", "What to keep", "#cfe8d4", "#2e8b57"], ["change", "What to change", "#ffe9b8", "#d98a1c"], ["remove", "What to remove", "#f9d9d2", "#c2412d"]] as const;

export function PoRefineBoard({ st, op, readOnly }: BoardProps) {
  const feats = list(st, "feats"), picked = feats.find((f) => f.id === st["rf:pick"]);
  const [copied, setCopied] = useState(false);
  const filled = PARTS.filter(([k]) => str(st[`rf:${k}`])).length, C = 2 * Math.PI * 34;
  const featureText = picked ? [`Feature: ${str(picked.name)}`, ...FEATURE_PARTS.map(([k, label]) => (str(picked[k]) ? `${label}: ${str(picked[k])}` : ""))].filter(Boolean).join("\n") : "";
  const prompt = [promptOf(st, "rf"), featureText ? `The feature as written:\n${featureText}` : ""].filter(Boolean).join("\n\n");
  const copy = () => void navigator.clipboard?.writeText(prompt).then(() => (setCopied(true), window.setTimeout(() => setCopied(false), 1600)));
  // A feature named here joins the group's features and becomes the one being refined once it is saved.
  const [newName, setNewName] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const addFeature = () => newName.trim() && (op({ key: "feats", op: "push", value: { name: newName.trim() } }), setPending(newName.trim()), setNewName(""));
  useEffect(() => {
    const made = pending ? feats.find((f) => str(f.name) === pending && !f.id.startsWith("tmp")) : undefined;
    if (made) (op({ key: "rf:pick", op: "set", value: made.id }), setPending(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, feats]);
  return (
    <div className="ex-board po">
      <section className="po-panel">
        <span className="ex-mono">Step 1 · Select one of the features from the previous activity</span>
        {feats.length ? (
          <div className="po-chips">
            {feats.map((f) => (<button key={f.id} disabled={readOnly} aria-pressed={picked?.id === f.id} onClick={() => op({ key: "rf:pick", op: "set", value: f.id })}>{str(f.name)}</button>))}
          </div>
        ) : null}
        {!readOnly ? (
          <div className="po-evform two" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
            <input className="po-input" value={newName} placeholder={feats.length ? "Or name another feature to work on" : "Name the feature you will work on"} aria-label="Feature name" onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFeature()} />
            <button className="po-btn" disabled={!newName.trim()} onClick={addFeature}>Use this feature</button>
          </div>
        ) : null}
        {!picked && feats.length ? <p className="po-note">Choose the feature you will refine. Steps 2 to 4 below are ready when you are.</p> : null}
      </section>
      {(
        <>
          <div className="po-two wide">
            <section className="po-panel">
              <header className="po-build">
                <span className="po-ring">
                  <svg width="80" height="80" viewBox="0 0 80 80" role="img" aria-label={`${filled} of 5 elements in the prompt`}>
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#0d181822" strokeWidth="8" />
                    <circle className="po-ring-v" cx="40" cy="40" r="34" fill="none" stroke={filled === 5 ? "#2e8b57" : "#d98a1c"} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - filled / 5)} transform="rotate(-90 40 40)" />
                  </svg>
                  <b>{filled}/5</b>
                </span>
                <div>
                  <b>Step 2 · Write the prompt</b>
                  <p className="po-note">Ask the GenAI tool to clarify the feature intent, strengthen the benefit hypothesis and improve the acceptance criteria. The feature is added to the prompt for you.</p>
                </div>
              </header>
              {PARTS.map(([k, label, hint]) => (
                <label key={k} className={`po-part${str(st[`rf:${k}`]) ? " on" : ""}`}>
                  <span>{label}</span>
                  <Field k={`rf:${k}`} st={st} op={op} readOnly={readOnly} rows={2} placeholder={hint} label={label} />
                </label>
              ))}
            </section>
            <section className="po-panel">
              <span className="ex-mono">The prompt to paste into your GenAI tool</span>
              <pre className="po-prompt">{prompt || "Fill in the elements and the prompt is assembled here."}</pre>
              <button className="po-btn" disabled={!filled} onClick={copy}>{copied ? "Copied" : "Copy the prompt"}</button>
              <span className="ex-mono" style={{ marginTop: 8 }}>The AI-generated output</span>
              <Field k="rf:out" st={st} op={op} readOnly={readOnly} rows={7} placeholder="Paste the output here to review it." label="The AI-generated output" />
            </section>
          </div>
          <span className="ex-mono">Step 3 · Review the output and decide</span>
          <div className="po-cols" style={{ ["--n" as string]: 3 }}>
            {DECIDE.map(([k, label, bg, edge]) => (
              <section key={k} className="po-col">
                <header><span className="po-n" style={{ background: edge }}>{k === "keep" ? "✓" : k === "change" ? "~" : "×"}</span><b>{label}</b></header>
                {list(st, `rf:${k}`).map((n) => (
                  <div key={n.id} className="po-sticky" style={{ background: bg, borderLeftColor: edge }}>
                    <span>{str(n.text)}</span>
                    {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: `rf:${k}`, op: "remove", id: n.id })}>×</button> : null}
                  </div>
                ))}
                {!readOnly ? <AddLine label={label} placeholder="+ add, Enter" onAdd={(text) => op({ key: `rf:${k}`, op: "push", value: { text } })} /> : null}
              </section>
            ))}
          </div>
          <span className="ex-mono">Step 4 · Refine, and be prepared to share with the class</span>
          {picked ? (
            <article className={`po-feat wide${featureDone(picked) ? " done" : ""}`}>
              <header><span className="po-n">✎</span><b>{str(picked.name)}</b></header>
              <div className="po-two wide">
                {FEATURE_PARTS.map(([k, label, hint]) => (<FeatureText key={`${picked.id}:${k}`} f={picked} k={k} label={label} hint={hint} op={op} readOnly={readOnly} />))}
              </div>
              <p className="po-note">Editing here changes the feature on the Writing features board too.</p>
            </article>
          ) : (
            <p className="po-empty">Select a feature in Step 1 and it opens here to refine.</p>
          )}
        </>
      )}
    </div>
  );
}

// ---- Lesson 2 · capacity allocation ------------------------------------------------------------

const CAP_COLORS = ["#3f6f8f", "#d4a94a", "#b0524f", "#2e8b57", "#8c6bc8", "#1f8a9e"];
type Cap = { id: string; name: string; pct: number };
const CAP_DEFAULT: Cap[] = [{ id: "features", name: "Features", pct: 70 }, { id: "enablers", name: "Enablers", pct: 10 }, { id: "maintenance", name: "Maintenance", pct: 20 }];
/** Sets one category's share and spreads the difference over the others, in proportion, so the total stays 100. */
export function rebalance(cats: Cap[], id: string, pct: number): Cap[] {
  const target = Math.max(0, Math.min(100, Math.round(pct))), others = cats.filter((c) => c.id !== id), left = 100 - target;
  const sum = others.reduce((n, c) => n + c.pct, 0);
  let given = 0;
  const next = others.map((c, i) => {
    const p = i === others.length - 1 ? left - given : Math.round(sum ? (c.pct / sum) * left : left / others.length);
    given += p;
    return { ...c, pct: Math.max(0, p) };
  });
  return cats.map((c) => (c.id === id ? { ...c, pct: others.length ? target : 100 } : next.find((x) => x.id === c.id)!));
}

export function PoCapacityBoard({ st, op, readOnly }: BoardProps) {
  const cats: Cap[] = Array.isArray(st.cats) && (st.cats as Cap[]).length ? (st.cats as Cap[]) : CAP_DEFAULT;
  const [sel, setSel] = useState(cats[0]!.id);
  const [name, setName] = useState("");
  const save = (next: Cap[]) => op({ key: "cats", op: "set", value: next });
  const CR = 100, CC = 2 * Math.PI * CR;
  let at = 0;
  const cur = cats.find((c) => c.id === sel) ?? cats[0]!;
  return (
    <div className="ex-board po">
      <div className="po-two wide">
        <section className="po-panel po-piebox">
          <span className="ex-mono">Our capacity allocation</span>
          <svg className="po-pie" viewBox="0 0 260 260" role="img" aria-label={cats.map((c) => `${c.name} ${c.pct}%`).join(", ")}>
            {cats.map((c, i) => {
              const len = (c.pct / 100) * CC, off = -at;
              at += len;
              return <circle key={c.id} className={`po-slice${c.id === cur.id ? " on" : ""}`} cx="130" cy="130" r={CR} fill="none" stroke={CAP_COLORS[i % CAP_COLORS.length]} strokeWidth={c.id === cur.id ? 50 : 40} strokeDasharray={`${Math.max(0, len - 2)} ${CC}`} strokeDashoffset={off} transform="rotate(-90 130 130)" onClick={() => setSel(c.id)} />;
            })}
            <text x="130" y="124" textAnchor="middle" className="po-pie-n">{cur.pct}%</text>
            <text x="130" y="146" textAnchor="middle" className="po-axis">{cur.name}</text>
          </svg>
          <p className="po-note">Choose a slice, or a row on the right, and move its share. The others adjust so the total stays 100%.</p>
        </section>
        <section className="po-panel">
          <span className="ex-mono">Step 2 · Draft the policy for your ART</span>
          {cats.map((c, i) => (
            <div key={c.id} className={`po-caprow${c.id === cur.id ? " on" : ""}`} style={{ ["--c" as string]: CAP_COLORS[i % CAP_COLORS.length] }} onClick={() => setSel(c.id)}>
              <i />
              <b>{c.name}</b>
              <input type="range" min={0} max={100} step={5} value={c.pct} disabled={readOnly} aria-label={`${c.name} share`} onFocus={() => setSel(c.id)} onChange={(e) => save(rebalance(cats, c.id, Number(e.target.value)))} />
              <span className="po-cappct">{c.pct}%</span>
              {!readOnly && cats.length > 2 ? <button className="ex-x" aria-label={`Remove ${c.name}`} onClick={(e) => (e.stopPropagation(), save(rebalance(cats.filter((x) => x.id !== c.id), cats.find((x) => x.id !== c.id)!.id, cats.find((x) => x.id !== c.id)!.pct + c.pct)))}>×</button> : null}
            </div>
          ))}
          {!readOnly ? (
            <div className="po-evform two">
              <input className="po-input" value={name} placeholder="Another category, e.g. Tech debt" aria-label="Another category" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && cats.length < 6 && (save(rebalance([...cats, { id: `c${Date.now().toString(36)}`, name: name.trim(), pct: 0 }], cats[0]!.id, cats[0]!.pct)), setName(""))} />
              <button className="po-btn" disabled={!name.trim() || cats.length >= 6} onClick={() => (save(rebalance([...cats, { id: `c${Date.now().toString(36)}`, name: name.trim(), pct: 0 }], cats[0]!.id, cats[0]!.pct)), setName(""))}>Add</button>
              <button className="po-btn plain" onClick={() => save(CAP_DEFAULT)}>Back to 70 / 10 / 20</button>
            </div>
          ) : null}
          <p className="po-policy">Our ART gives {cats.map((c, i) => `${i && i === cats.length - 1 ? "and " : ""}${c.pct}% of its capacity to ${c.name.toLowerCase()}`).join(", ")} each PI.</p>
        </section>
      </div>
      <div className="po-two wide">
        <section className="po-panel">
          <span className="ex-mono">Step 1 · How we would use capacity allocation in our organization</span>
          <Field k="use" st={st} op={op} readOnly={readOnly} rows={4} placeholder="Where it would help, who decides the split, how often we revisit it…" label="How we would use capacity allocation" />
        </section>
        <section className="po-panel">
          <span className="ex-mono">Key stakeholders to discuss it with</span>
          <Field k="who" st={st} op={op} readOnly={readOnly} rows={4} placeholder="Business Owners, System Architect, RTE…" label="Key stakeholders" />
        </section>
      </div>
    </div>
  );
}

// ---- Lesson 3 · communicate the vision ---------------------------------------------------------

const WPM = 130;
const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export function PoVisionBoard({ config, st, op, readOnly }: BoardProps) {
  const qs = (config.questions as string[] | undefined) ?? [];
  const [tab, setTab] = useState<"msg" | "llm">("msg");
  const [copied, setCopied] = useState(false);
  const answers = qs.map((_, i) => str(st[`q:${i}`]));
  const message = str(st.message) || answers.filter(Boolean).join("\n\n");
  const n = words(message), minutes = n / WPM, pct = Math.min(100, (minutes / 4) * 100);
  const verdict = !n ? "Nothing to say yet" : minutes < 2 ? "Shorter than two minutes" : minutes <= 3 ? "Right in the 2 to 3 minute window" : "Longer than three minutes";
  const prompt = [promptOf(st, "v"), answers.some(Boolean) ? `Our notes so far:\n${qs.map((q, i) => (answers[i] ? `${q}\n${answers[i]}` : "")).filter(Boolean).join("\n\n")}` : ""].filter(Boolean).join("\n\n");
  const filled = PARTS.filter(([k]) => str(st[`v:${k}`])).length;
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
      <div className="po-seg" role="tablist" aria-label="View">
        <button role="tab" aria-selected={tab === "msg"} aria-pressed={tab === "msg"} onClick={() => setTab("msg")}>Our vision message</button>
        <button role="tab" aria-selected={tab === "llm"} aria-pressed={tab === "llm"} onClick={() => setTab("llm")}>Tip · draft it with an LLM ({filled}/5)</button>
      </div>
      {tab === "msg" ? (
        <div className="po-two wide" key="msg">
          <section className="po-panel">
            <span className="ex-mono">The three questions your ART needs answered</span>
            {qs.map((q, i) => (
              <label key={q} className="po-flabel">
                <span className={answers[i] ? "ok" : ""}>{i + 1}. {q}</span>
                <Field k={`q:${i}`} st={st} op={op} readOnly={readOnly} rows={3} placeholder="Our answer…" label={q} />
              </label>
            ))}
          </section>
          <section className="po-panel">
            <span className="ex-mono">The message, as you would say it (2 to 3 minutes)</span>
            <Field k="message" st={st} op={op} readOnly={readOnly} rows={11} placeholder={answers.some(Boolean) ? "Leave this empty to speak from your three answers, or write the message out here." : "Answer the three questions, or write the message out here."} label="The vision message" />
            <div className="po-timer" role="img" aria-label={`${n} words, about ${minutes.toFixed(1)} minutes spoken`}>
              <i className="zone" />
              <i className="fill" style={{ width: `${pct}%`, background: !n ? "transparent" : minutes >= 2 && minutes <= 3 ? "#2e8b57" : "#d98a1c" }} />
            </div>
            <p className="po-note"><b>{n} words · about {minutes.toFixed(1)} min spoken.</b> {verdict}. The green band is 2 to 3 minutes at {WPM} words a minute.</p>
          </section>
        </div>
      ) : (
        <div className="po-two wide" key="llm">
          <section className="po-panel">
            <span className="ex-mono">Include the five prompting elements</span>
            {PARTS.map(([k, label, hint]) => (
              <label key={k} className={`po-part${str(st[`v:${k}`]) ? " on" : ""}`}>
                <span>{label}</span>
                <Field k={`v:${k}`} st={st} op={op} readOnly={readOnly} rows={2} placeholder={hint} label={label} />
              </label>
            ))}
          </section>
          <section className="po-panel">
            <span className="ex-mono">The prompt to paste into your LLM</span>
            <pre className="po-prompt">{prompt || "Fill in the elements and the prompt is assembled here, with your answers to the three questions added."}</pre>
            <button className="po-btn" disabled={!prompt} onClick={() => void navigator.clipboard?.writeText(prompt).then(() => (setCopied(true), window.setTimeout(() => setCopied(false), 1600)))}>{copied ? "Copied" : "Copy the prompt"}</button>
            <p className="po-note">Paste what it gives you into the message on the first tab, then make it yours.</p>
          </section>
        </div>
      )}
    </div>
  );
}

// ---- Lesson 3 · identify dependency issues -----------------------------------------------------
// The ART planning board of the slide: features (blue), significant dependencies (red), a
// milestone (orange) and the red strings between them. Click a card to flag it as an issue.

const DEP_ROWS = ["Milestones and events", "Unicorns", "Lions", "Bears", "Eagles", "Tigers", "Antelopes", "Bulls", "UX Help", "System Architect Help"];
const DEP_COLS = ["Iteration 1.1", "Iteration 1.2", "Iteration 1.3", "Iteration 1.4", "Iteration 1.5 (IP)", "PI 2 >>>"];
// [row, position in iterations from the left, kind]: f feature, d dependency, m milestone.
const DEP_CARDS: [number, number, "f" | "d" | "m"][] = [
  [0, 2.75, "m"],
  [1, 2.25, "f"], [1, 3.15, "f"], [1, 3.6, "f"],
  [2, 1.25, "d"], [2, 1.62, "f"], [2, 2.3, "d"], [2, 3.37, "d"], [2, 3.8, "f"],
  [3, 0.55, "d"], [3, 1.8, "f"], [3, 2.38, "d"], [3, 3.8, "f"],
  [4, 3.5, "f"], [4, 3.82, "f"],
  [5, 0.2, "d"], [5, 1.48, "d"], [5, 2.82, "f"], [5, 3.52, "d"],
  [6, 1.8, "f"], [6, 3.82, "f"],
  [7, 0.72, "f"], [7, 3.55, "f"], [7, 3.82, "f"],
  [8, 0.3, "d"], [8, 1.48, "d"], [8, 2.52, "d"],
  [9, 0.82, "d"], [9, 1.5, "d"], [9, 2.52, "d"],
];
// Strings between cards, by index in DEP_CARDS.
const DEP_LINKS: [number, number][] = [[0, 1], [1, 4], [4, 9], [4, 15], [4, 24], [5, 6], [6, 25], [6, 17], [11, 28], [11, 2], [16, 21], [16, 27], [7, 26], [7, 3], [18, 29], [18, 13], [13, 3]];
const DW = 150, DH = 44, DL = 190, DT = 34;
const depXY = (i: number) => { const [r, x] = DEP_CARDS[i]!; return [DL + x * DW + 14, DT + r * DH + DH / 2] as const; };
const DEP_FILL = { f: "#a8d4f5", d: "#f2a0c0", m: "#f5a85a" };
const DEP_WORD = { f: "Feature", d: "Significant dependency", m: "Milestone or event" };

export function PoDepsBoard({ config, st, op, readOnly }: BoardProps) {
  const flags = (st.flags && typeof st.flags === "object" ? st.flags : {}) as Record<string, boolean>;
  const [hover, setHover] = useState<number | null>(null);
  const qs = (config.questions as string[] | undefined) ?? [];
  const lit = hover === null ? null : new Set(DEP_LINKS.filter(([a, b]) => a === hover || b === hover).flat());
  const load = DEP_ROWS.map((_, r) => DEP_LINKS.filter(([a, b]) => DEP_CARDS[a]![0] === r || DEP_CARDS[b]![0] === r).length);
  const max = Math.max(...load);
  const W = DL + DEP_COLS.length * DW, H = DT + DEP_ROWS.length * DH;
  return (
    <div className="ex-board po">
      <section className="po-panel">
        <div>
          <span className="ex-mono">ART planning board</span>
          <h3 className="po-h3">Feature delivery, dependencies and milestones</h3>
        </div>
        <div className="po-legend left">
          {(["f", "d", "m"] as const).map((k) => (<span key={k}><i className="card" style={{ background: DEP_FILL[k] }} />{DEP_WORD[k]}</span>))}
          <span><i style={{ background: "#d81b60" }} />String: must land before the feature completes</span>
          <span style={{ ["--c" as string]: "#d98a1c" }}><i className="ring" />Flagged as an issue</span>
        </div>
        <div className="po-chartwrap">
          <svg className="po-deps" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 860 }} role="img" aria-label="ART planning board with features, significant dependencies, a milestone and the strings between them">
            <rect x="0" y="0" width={W} height={H} fill="#fff" />
            {DEP_COLS.map((c, i) => (
              <g key={c}>
                {i >= 4 ? <rect x={DL + i * DW} y={DT} width={DW} height={H - DT} fill={i === 4 ? "#fff8d6" : "#efece6"} /> : null}
                <rect x={DL + i * DW} y="0" width={DW} height={DT} fill={i === 4 ? "#ffe04a" : i === 5 ? "#ddd6c8" : "#eef0f6"} stroke="#14123a" />
                <text x={DL + i * DW + DW / 2} y="22" textAnchor="middle" className="po-deps-h">{c}</text>
                <line x1={DL + i * DW} y1={DT} x2={DL + i * DW} y2={H} stroke="#14123a" strokeWidth="1.2" />
              </g>
            ))}
            <rect x="0" y="0" width={DL} height={DT} fill="#14123a" />
            <text x={DL / 2} y="22" textAnchor="middle" className="po-deps-h" fill="#fff" style={{ fill: "#fff" }}>Team · Iteration →</text>
            <rect x="0" y="0" width={W} height={H} fill="none" stroke="#14123a" strokeWidth="2.5" rx="4" />
            {DEP_ROWS.map((r, i) => (
              <g key={r}>
                <rect x="0" y={DT + i * DH} width={DL} height={DH} fill="#fff" stroke="#14123a" strokeWidth="0.8" />
                <circle cx="14" cy={DT + i * DH + DH / 2} r="4.5" fill={i === 0 ? "#f5a85a" : i >= 8 ? "#9aa0ad" : WHEEL[(i - 1) % WHEEL.length]} stroke="#14123a" />
                <rect x="0" y={DT + i * DH + DH - 5} width={(load[i]! / max) * DL} height="5" fill="#d81b60" opacity={0.25 + (load[i]! / max) * 0.6} />
                <text x="26" y={DT + i * DH + DH / 2 + 4} className="po-deps-h">{r}</text>
                <line x1="0" y1={DT + i * DH} x2={W} y2={DT + i * DH} stroke={i === 8 ? "#0d1815" : "#0d181833"} strokeWidth={i === 8 ? 2 : 1} />
              </g>
            ))}
            {DEP_LINKS.map(([a, b], i) => {
              const [x1, y1] = depXY(a), [x2, y2] = depXY(b), on = lit ? lit.has(a) && lit.has(b) && (a === hover || b === hover) : true;
              return <path key={i} className="po-string" d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2 + 26}, ${x2} ${(y1 + y2) / 2 - 26}, ${x2} ${y2}`} fill="none" stroke="#d81b60" strokeWidth={lit && on ? 3.5 : 1.8} opacity={on ? 0.9 : 0.12} style={{ animationDelay: `${i * 50}ms` }} />;
            })}
            {DEP_CARDS.map(([, , k], i) => {
              const [x, y] = depXY(i), dim = lit ? !lit.has(i) : false;
              return (
                <g key={i} className="po-depcard" opacity={dim ? 0.3 : 1} tabIndex={readOnly ? -1 : 0} role="button" aria-pressed={!!flags[i]} aria-label={`${DEP_WORD[k]}, ${DEP_ROWS[DEP_CARDS[i]![0]]}${flags[i] ? ", flagged" : ""}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} onClick={() => !readOnly && op({ key: "flags", op: "set", value: { ...flags, [i]: !flags[i] } })} onKeyDown={(e) => e.key === "Enter" && !readOnly && op({ key: "flags", op: "set", value: { ...flags, [i]: !flags[i] } })}>
                  {flags[i] ? <circle className="po-flag" cx={x} cy={y} r="22" fill="none" stroke="#d98a1c" strokeWidth="4" /> : null}
                  <rect x={x - 19} y={y - 13} width="38" height="26" rx="3" fill={DEP_FILL[k]} stroke="#14123a" strokeWidth="1.5" />
                  <rect x={x - 15} y={y - 8} width={k === "f" ? 20 : 26} height="3" rx="1.5" fill="#14123a" opacity="0.55" />
                  <rect x={x - 15} y={y - 2} width="12" height="5" rx="2.5" fill="#fff" stroke="#14123a" strokeWidth="0.8" />
                  <rect x={x - 1} y={y - 2} width="12" height="5" rx="2.5" fill="#fff" stroke="#14123a" strokeWidth="0.8" />
                </g>
              );
            })}
          </svg>
        </div>
        <p className="po-note">Point at a card to follow its strings. Click a card to flag it as an issue. The bar under a team&apos;s name grows with the number of strings that touch it: {DEP_ROWS.filter((_, i) => load[i] === max).join(" and ")} carry the most.</p>
      </section>
      <div className="po-cols" style={{ ["--n" as string]: qs.length }}>
        {qs.map((q, qi) => (
          <section key={q} className="po-col">
            <header><span className="po-n">{qi + 1}</span><b>{q}</b></header>
            {list(st, `a:${qi}`).map((n) => (
              <div key={n.id} className="po-sticky" style={{ background: qi ? "#cde0f2" : "#f9d9d2", borderLeftColor: qi ? "#2f6fbd" : "#c2412d" }}>
                <span>{str(n.text)}</span>
                {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: `a:${qi}`, op: "remove", id: n.id })}>×</button> : null}
              </div>
            ))}
            {!readOnly ? <AddLine label={q} placeholder="+ add, Enter" onAdd={(text) => op({ key: `a:${qi}`, op: "push", value: { text } })} /> : null}
          </section>
        ))}
      </div>
    </div>
  );
}

// ---- Lesson 4 · develop a story map ------------------------------------------------------------
// The user's activities across the top; under each, the stories it needs. The dark stories are the
// minimum to complete the feature and flow into the team backlog; the light ones wait.

function MapEdit({ value, onSave, onClose, label }: { value: string; onSave: (v: string) => void; onClose: () => void; label: string }) {
  const [v, setV] = useState(value);
  const done = () => (onClose(), v.trim() && v.trim() !== value ? onSave(v.trim()) : undefined);
  return <textarea className="po-mapedit" autoFocus rows={2} value={v} aria-label={label} onChange={(e) => setV(e.target.value)} onFocus={(e) => e.target.select()} onBlur={done} onKeyDown={(e) => (e.key === "Enter" && !e.shiftKey ? (e.preventDefault(), done()) : e.key === "Escape" ? onClose() : undefined)} />;
}

export function PoStoryMapBoard({ config, st, op: save, readOnly }: BoardProps) {
  const feature = config.feature as Record<string, string> | undefined;
  // The map starts with the slide's own example: its activities, and the stories under the first
  // one. It lives in the board's setup until someone changes the map; then it is saved as theirs.
  const seed = config.seed as { tasks: string[]; must: string[]; later: string[] } | undefined;
  const started = Array.isArray(st.tasks) || Array.isArray(st.stories) || !seed;
  const seedTasks: Row[] = (seed?.tasks ?? []).map((name, i) => ({ id: `seed-t${i}`, name }));
  const seedStories: Row[] = [...(seed?.must ?? []).map((text, i) => ({ id: `seed-m${i}`, task: "seed-t0", text, must: true })), ...(seed?.later ?? []).map((text, i) => ({ id: `seed-l${i}`, task: "seed-t0", text, must: false }))];
  const tasks = started ? list(st, "tasks") : seedTasks, stories = started ? list(st, "stories") : seedStories;
  const op: BoardProps["op"] = (change) => {
    if (started) return save(change);
    // The first change: the example with that change applied is saved whole, so nothing can arrive out of order.
    const next: Record<string, Row[]> = { tasks: seedTasks, stories: seedStories };
    const cur = next[change.key] ?? [];
    if (change.op === "push") next[change.key] = [...cur, { ...change.value, id: `n${Date.now().toString(36)}` }];
    else if (change.op === "update") next[change.key] = cur.map((x) => (x.id === change.id ? { ...x, ...change.value, id: x.id } : x));
    else if (change.op === "remove") next[change.key] = cur.filter((x) => x.id !== change.id);
    save({ key: "tasks", op: "set", value: next.tasks });
    save({ key: "stories", op: "set", value: next.stories });
  };
  const [task, setTask] = useState("");
  const [edit, setEdit] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ kind: "story" | "task"; id: string } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const must = tasks.flatMap((t) => stories.filter((s) => s.task === t.id && s.must === true));
  const addTask = () => task.trim() && tasks.length < 7 && (op({ key: "tasks", op: "push", value: { name: task.trim() } }), setTask(""));
  // A move changes the order of a list, so the lists are saved whole (this also makes the example the team's own).
  const commit = (nextTasks: Row[], nextStories: Row[]) => (save({ key: "tasks", op: "set", value: nextTasks }), save({ key: "stories", op: "set", value: nextStories }));
  const moveStory = (id: string, toTask: string, toMust: boolean, before?: string) => {
    const me = stories.find((x) => x.id === id);
    if (!me || before === id) return;
    const rest = stories.filter((x) => x.id !== id), at = before ? rest.findIndex((x) => x.id === before) : -1, moved = { ...me, task: toTask, must: toMust };
    commit(tasks, at < 0 ? [...rest, moved] : [...rest.slice(0, at), moved, ...rest.slice(at)]);
  };
  const moveTask = (id: string, before: string | null) => {
    const me = tasks.find((x) => x.id === id);
    if (!me || before === id) return;
    // Dropped on an activity further along, it lands after it; dropped on an earlier one, before it.
    const fwd = !!before && tasks.findIndex((x) => x.id === id) < tasks.findIndex((x) => x.id === before);
    const rest = tasks.filter((x) => x.id !== id), at = before ? rest.findIndex((x) => x.id === before) + (fwd ? 1 : 0) : -1;
    commit(at < 0 ? [...rest, me] : [...rest.slice(0, at), me, ...rest.slice(at)], stories);
  };
  const shift = (id: string, by: number) => { const i = tasks.findIndex((x) => x.id === id), j = i + by; if (i < 0 || j < 0 || j >= tasks.length) return; const next = [...tasks]; [next[i], next[j]] = [next[j]!, next[i]!]; commit(next, stories); };
  const end = () => (setDrag(null), setOver(null));
  const dropOn = (key: string, kind: "story" | "task", run: (id: string) => void) => readOnly ? {} : {
    onDragOver: (e: React.DragEvent) => { if (drag?.kind === kind) { e.preventDefault(); e.stopPropagation(); if (over !== key) setOver(key); } },
    onDrop: (e: React.DragEvent) => { if (drag?.kind === kind) { e.preventDefault(); e.stopPropagation(); run(drag.id); end(); } },
  };
  return (
    <div className="ex-board po">
      {feature ? (
        <details className="po-epic" open>
          <summary><span className="ex-mono">Feature</span> <b>{feature.name}</b></summary>
          <p className="small"><b>Benefit hypothesis:</b> {feature.hyp}</p>
          <p className="small"><b>Intent:</b> {feature.intent}</p>
          <p className="small"><b>Acceptance criteria:</b> {feature.ac}</p>
        </details>
      ) : null}
      {seed && !readOnly && started ? <button className="po-reset" style={{ marginLeft: 0, justifySelf: "start" }} onClick={() => window.confirm("Put the slide's example back? This replaces the map as it is now.") && (save({ key: "tasks", op: "set", value: null }), save({ key: "stories", op: "set", value: null }))}>Back to the slide&apos;s example</button> : null}
      <div className="po-map">
        <div className="po-mapmain">
          <div className="po-arrow">These are the activities or tasks the user must perform in order to accomplish their goal.</div>
          {!readOnly ? <p className="po-note" style={{ margin: 0 }}>Drag an activity to reorder the workflow, drag a story to another activity or priority, and click any text to edit it.</p> : null}
          <div className="po-mapscroll">
            <div className="po-mapgrid" style={{ ["--n" as string]: Math.max(1, tasks.length + (readOnly ? 0 : 1)) }}>
              {tasks.map((t, ti) => (
                <div key={t.id} className={`po-task${drag?.id === t.id ? " dragging" : ""}${over === `t:${t.id}` ? " over" : ""}`} draggable={!readOnly && edit !== t.id} onDragStart={(e) => (e.dataTransfer.setData("text/plain", t.id), (e.dataTransfer.effectAllowed = "move"), setDrag({ kind: "task", id: t.id }))} onDragEnd={end} {...dropOn(`t:${t.id}`, "task", (id) => moveTask(id, t.id))}>
                  {edit === t.id ? <MapEdit key={t.id} value={str(t.name)} label="Activity or task" onClose={() => setEdit(null)} onSave={(name) => op({ key: "tasks", op: "update", id: t.id, value: { name } })} /> : readOnly ? <span>{str(t.name)}</span> : <button className="po-maptext" title="Click to edit" onClick={() => setEdit(t.id)}>{str(t.name)}</button>}
                  {!readOnly && edit !== t.id ? (
                    <span className="po-taskacts">
                      <button aria-label={`Move ${str(t.name)} earlier`} disabled={ti === 0} onClick={() => shift(t.id, -1)}>←</button>
                      <button aria-label={`Move ${str(t.name)} later`} disabled={ti === tasks.length - 1} onClick={() => shift(t.id, 1)}>→</button>
                      <button aria-label={`Remove ${str(t.name)}`} onClick={() => op({ key: "tasks", op: "remove", id: t.id })}>×</button>
                    </span>
                  ) : null}
                </div>
              ))}
              {!readOnly && tasks.length < 7 ? (
                <div className={`po-task new${over === "t:end" ? " over" : ""}`} {...dropOn("t:end", "task", (id) => moveTask(id, null))}>
                  <input value={task} placeholder="+ activity or task" aria-label="Activity or task" onChange={(e) => setTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} onBlur={addTask} />
                </div>
              ) : null}
              {(["must", "later"] as const).map((band) => (
                <div key={band} className={`po-band ${band}`} style={{ gridColumn: "1 / -1" }}>
                  <span className="ex-mono">{band === "must" ? "Essential stories for this release · high priority" : "Stories for future releases · low priority"}</span>
                  <div className="po-mapgrid" style={{ ["--n" as string]: Math.max(1, tasks.length + (readOnly ? 0 : 1)) }}>
                    {tasks.map((t) => (
                      <div key={t.id} className={`po-stack${over === `c:${t.id}:${band}` ? " over" : ""}`} {...dropOn(`c:${t.id}:${band}`, "story", (id) => moveStory(id, t.id, band === "must"))}>
                        {stories.filter((s) => s.task === t.id && (s.must === true) === (band === "must")).map((s) => (
                          <div key={s.id} className={`po-story ${band}${drag?.id === s.id ? " dragging" : ""}${over === `s:${s.id}` ? " over" : ""}`} draggable={!readOnly && edit !== s.id} onDragStart={(e) => (e.stopPropagation(), e.dataTransfer.setData("text/plain", s.id), (e.dataTransfer.effectAllowed = "move"), setDrag({ kind: "story", id: s.id }))} onDragEnd={end} {...dropOn(`s:${s.id}`, "story", (id) => moveStory(id, t.id, band === "must", s.id))}>
                            {edit === s.id ? <MapEdit key={s.id} value={str(s.text)} label="Story" onClose={() => setEdit(null)} onSave={(text) => op({ key: "stories", op: "update", id: s.id, value: { text } })} /> : readOnly ? <span>{str(s.text)}</span> : <button className="po-maptext" title="Click to edit" onClick={() => setEdit(s.id)}>{str(s.text)}</button>}
                            {!readOnly && edit !== s.id ? (
                              <span className="po-storyacts">
                                <button aria-label={band === "must" ? "Move to later" : "Needed for the feature"} title={band === "must" ? "Move to later" : "Needed for the feature"} onClick={() => op({ key: "stories", op: "update", id: s.id, value: { must: band !== "must" } })}>{band === "must" ? "↓" : "↑"}</button>
                                <button aria-label="Remove" onClick={() => op({ key: "stories", op: "remove", id: s.id })}>×</button>
                              </span>
                            ) : null}
                          </div>
                        ))}
                        {!readOnly ? <AddLine label={`Story for ${str(t.name)}`} placeholder="+ story" onAdd={(text) => op({ key: "stories", op: "push", value: { task: t.id, text, must: band === "must" } })} /> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <span className="po-mapflow" aria-hidden>⟷</span>
        <aside className="po-backlog">
          <b>Team backlog</b>
          {must.map((s, i) => (<div key={s.id} className="po-story must" style={{ animationDelay: `${i * 60}ms` }}><span>{str(s.text)}</span></div>))}
          {!must.length ? <p className="po-note">The dark stories line up here, activity by activity.</p> : null}
          <p className="po-count2"><b>{must.length}</b> {must.length === 1 ? "story" : "stories"} at the minimum · {stories.length - must.length} later</p>
        </aside>
      </div>
    </div>
  );
}

// ---- Lesson 4 · AI-assisted iteration planning -------------------------------------------------
// The group's own iteration goals beside the AI's draft, what each missed, and the refined goals.

export function PoIterationBoard({ config, st, op, readOnly }: BoardProps) {
  const stories = (config.stories as string[] | undefined) ?? [];
  const [copied, setCopied] = useState(false);
  const prompt = str(config.llmPrompt) + "\n\n" + stories.map((s, i) => `${i + 1}. ${s}`).join("\n");
  const ours = list(st, "ours"), refined = list(st, "refined");
  const stage = !ours.length ? 0 : !str(st.ai) ? 1 : !(str(st.missed) || str(st.added) || str(st.overlooked)) ? 2 : !refined.length ? 3 : 4;
  const Goals = ({ k, label, tone }: { k: string; label: string; tone: string }) => (
    <>
      {list(st, k).map((g, i) => (
        <div key={g.id} className="po-sticky" style={{ background: tone, borderLeftColor: "#0d1815" }}>
          <small>Goal {i + 1}</small>
          <span>{str(g.text)}</span>
          {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: k, op: "remove", id: g.id })}>×</button> : null}
        </div>
      ))}
      {!readOnly && list(st, k).length < 3 ? <AddLine label={label} placeholder="+ an iteration goal, Enter" onAdd={(text) => op({ key: k, op: "push", value: { text } })} /> : null}
    </>
  );
  return (
    <div className="ex-board po">
      <ol className="po-steps" aria-label="Progress">
        {["Our goals", "AI draft", "Compare", "Refine", "Share"].map((s, i) => (<li key={s} className={i < stage ? "done" : i === stage ? "on" : ""}>{s}</li>))}
      </ol>
      <section className="po-panel">
        <span className="ex-mono">Step 1 · The user stories of the upcoming iteration</span>
        <div className="po-cols" style={{ ["--n" as string]: stories.length }}>
          {stories.map((s, i) => (<div key={i} className="po-userstory" style={{ animationDelay: `${i * 90}ms` }}>{s}</div>))}
        </div>
      </section>
      <div className="po-two wide">
        <section className="po-panel">
          <span className="ex-mono">Our iteration goals, written by hand (two to three)</span>
          <Goals k="ours" label="Our iteration goal" tone="#cfe8d4" />
        </section>
        <section className="po-panel">
          <span className="ex-mono">Step 2 · The AI draft</span>
          <details className="po-material">
            <summary>LLM Iteration Goals Prompt</summary>
            <pre className="po-prompt">{prompt}</pre>
          </details>
          <button className="po-btn" onClick={() => void navigator.clipboard?.writeText(prompt).then(() => (setCopied(true), window.setTimeout(() => setCopied(false), 1600)))}>{copied ? "Copied" : "Copy the prompt"}</button>
          <Field k="ai" st={st} op={op} readOnly={readOnly} rows={6} placeholder="Paste the iteration goals the LLM wrote." label="The AI draft" />
        </section>
      </div>
      <span className="ex-mono">Step 3 · Compare side by side</span>
      <div className="po-cols" style={{ ["--n" as string]: 3 }}>
        {([["missed", "What did the AI miss that you included?"], ["added", "What did AI add that you hadn’t considered?"], ["overlooked", "If you’d only looked at the AI draft, what issues would you have overlooked?"]] as const).map(([k, q], i) => (
          <section key={k} className="po-col">
            <header><span className="po-n">{i + 1}</span><b>{q}</b></header>
            <Field k={k} st={st} op={op} readOnly={readOnly} rows={3} label={q} />
          </section>
        ))}
      </div>
      <section className="po-panel">
        <span className="ex-mono">Step 4 · The refined goals: the best of both versions</span>
        <Goals k="refined" label="Refined iteration goal" tone="#ffd37a" />
      </section>
    </div>
  );
}

// ---- Lesson 5 · a list of steps to tick off, with what the group found -------------------------

export function PoChecklistBoard({ config, st, op, readOnly }: BoardProps) {
  const steps = (config.steps as [string, string][] | undefined) ?? [];
  const done = (st.done && typeof st.done === "object" ? st.done : {}) as Record<string, boolean>;
  const n = steps.filter((_, i) => done[i]).length, C = 2 * Math.PI * 34;
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
      <div className="po-two wide">
        <section className="po-panel">
          <header className="po-build">
            <span className="po-ring">
              <svg width="80" height="80" viewBox="0 0 80 80" role="img" aria-label={`${n} of ${steps.length} steps done`}>
                <circle cx="40" cy="40" r="34" fill="none" stroke="#0d181822" strokeWidth="8" />
                <circle className="po-ring-v" cx="40" cy="40" r="34" fill="none" stroke={n === steps.length ? "#2e8b57" : "#d98a1c"} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - n / Math.max(1, steps.length))} transform="rotate(-90 40 40)" />
              </svg>
              <b>{n}/{steps.length}</b>
            </span>
            <div>
              <b>{n === steps.length ? str(config.doneLabel) || "All done. Welcome to the community." : "Tick each step as your group completes it"}</b>
              {str(config.url) ? <p className="po-note"><a href={str(config.url)} target="_blank" rel="noopener noreferrer">{str(config.url)} ↗</a></p> : null}
            </div>
          </header>
          {steps.map(([title, text], i) => (
            <button key={title} className={`po-checkrow${done[i] ? " on" : ""}`} disabled={readOnly} aria-pressed={!!done[i]} onClick={() => op({ key: "done", op: "set", value: { ...done, [i]: !done[i] } })}>
              <i aria-hidden>{done[i] ? "✓" : i + 1}</i>
              <span><b>{title}</b>{text}</span>
            </button>
          ))}
        </section>
        <section className="po-panel">
          <span className="ex-mono">{str(config.notesLabel) || "What we found, to share with the class"}</span>
          {list(st, "notes").map((x) => (
            <div key={x.id} className="po-sticky" style={{ background: "#cde0f2", borderLeftColor: "#2f6fbd" }}>
              <span>{str(x.text)}</span>
              {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: "notes", op: "remove", id: x.id })}>×</button> : null}
            </div>
          ))}
          {!readOnly ? <AddLine label="What we found" placeholder={str(config.add) || "+ a post, event or tool worth sharing, Enter"} onAdd={(text) => op({ key: "notes", op: "push", value: { text } })} /> : null}
        </section>
      </div>
    </div>
  );
}

// ---- Advanced SPC · lesson 1 --------------------------------------------------------------------

// Past, Present, Future: a road with three stops. The class adds what it shares at each stop; the
// traveller moves to the stop in focus and the road behind it fills in.
export function AsTimelineBoard({ config, st, op, readOnly }: BoardProps) {
  const eras = (config.eras as [string, string, string[]][] | undefined) ?? [];
  const [at, setAt] = useState(0);
  const notes = list(st, "notes");
  const count = (e: number) => notes.filter((n) => num(n.era) === e).length;
  const tones = ["#cde0f2", "#ffd37a", "#cfe8d4"], edges = ["#2f6fbd", "#d98a1c", "#2e8b57"];
  const era = eras[at];
  return (
    <div className="ex-board po">
      <div className="as-road" role="tablist" aria-label="Past, present, future" style={{ ["--at" as string]: at, ["--n" as string]: eras.length }}>
        <i className="as-road-line" aria-hidden />
        <i className="as-road-fill" aria-hidden />
        <i className="as-walker" aria-hidden>●</i>
        {eras.map(([name], i) => (
          <button key={name} role="tab" aria-selected={i === at} className={`as-stop${i === at ? " on" : ""}${i < at ? " past" : ""}`} style={{ ["--c" as string]: edges[i % 3] }} onClick={() => setAt(i)}>
            <span className="as-stop-dot">{count(i)}</span>
            <b>{name}</b>
          </button>
        ))}
      </div>
      {era ? (
        <section className="po-panel as-era" key={at} style={{ borderTop: `8px solid ${edges[at % 3]}` }}>
          <p className="as-q">{era[1]}</p>
          <div className="po-cols" style={{ ["--n" as string]: era[2].length }}>
            {era[2].map((lane, li) => (
              <div key={lane} className="po-col" style={{ animationDelay: `${li * 110}ms` }}>
                <header><span className="po-n" style={{ background: edges[at % 3] }}>{li === 0 ? "✦" : "↗"}</span><b>{lane}</b></header>
                {notes.filter((n) => num(n.era) === at && num(n.lane) === li).map((n) => (
                  <div key={n.id} className="po-sticky" style={{ background: tones[at % 3], borderLeftColor: edges[at % 3] }}>
                    {str(n.who) ? <small>{str(n.who)}</small> : null}
                    <span>{str(n.text)}</span>
                    {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: "notes", op: "remove", id: n.id })}>×</button> : null}
                  </div>
                ))}
                {!readOnly ? <AddLine label={lane} placeholder="+ share it, Enter" onAdd={(text) => op({ key: "notes", op: "push", value: { era: at, lane: li, text } })} /> : null}
              </div>
            ))}
          </div>
          <div className="po-acts-row">
            <button className="po-btn plain" disabled={at === 0} onClick={() => setAt(at - 1)}>← {eras[at - 1]?.[0] ?? "Back"}</button>
            <button className="po-btn" disabled={at === eras.length - 1} onClick={() => setAt(at + 1)}>{eras[at + 1]?.[0] ?? "Done"} →</button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

const DOMAIN_TONE: Record<string, string> = { Outcomes: "#2f6fbd", Flow: "#2e8b57", Competency: "#8c6bc8" };

/** Three bars, one per measurement domain, and whether the set leans on one of them. */
function DomainBalance({ domains, picked }: { domains: string[]; picked: string[] }) {
  const per = domains.map((d) => picked.filter((x) => x === d).length), total = per.reduce((a, b) => a + b, 0), max = Math.max(...per, 1);
  const missing = domains.filter((_, i) => !per[i]);
  return (
    <div className="po-vis two as-balance">
      <div className="as-scale" role="img" aria-label={domains.map((d, i) => `${d}: ${per[i]}`).join(", ")}>
        {domains.map((d, i) => (
          <div key={d} className="as-col">
            <b>{per[i]}</b>
            <i style={{ height: `${10 + (per[i]! / max) * 90}%`, background: DOMAIN_TONE[d] ?? "#0d1815", opacity: per[i] ? 1 : 0.25 }} />
            <span>{d}</span>
          </div>
        ))}
      </div>
      <div className="po-verdict">
        <span className="ex-mono">Is the set balanced?</span>
        <b className="as-verdict">{!total ? "Nothing to weigh yet" : missing.length ? `Leaning: no metric for ${missing.join(" or ")}` : Math.max(...per) - Math.min(...per) > 1 ? "All three domains, unevenly" : "Balanced across the three domains"}</b>
        <p className="po-note">A balanced set draws on Outcomes, Flow and Competency, and pairs each metric with a complementary one so that improving the first cannot quietly harm something else.</p>
      </div>
    </div>
  );
}

function CellText({ row, k, hint, op, readOnly, listKey }: { row: Row; k: string; hint: string; op: BoardProps["op"]; readOnly: boolean; listKey: string }) {
  const saved = str(row[k]);
  const [v, setV] = useState(saved);
  useEffect(() => setV(saved), [saved]);
  return <textarea className="po-text as-cell" rows={2} value={v} placeholder={hint} aria-label={hint} disabled={readOnly} onChange={(e) => setV(e.target.value)} onBlur={() => v !== saved && op({ key: listKey, op: "update", id: row.id, value: { [k]: v.trim() } })} />;
}

// Practice identifying a balanced set of metrics. One level at a time: the group picks decisions
// from the reference slides of that level (or types its own), and each pick becomes a card it
// finishes in three moves: the domain, the metric, the complementary metric. The balance across
// the three measurement domains is drawn as the set grows, and the slide's table sums it up.
type MetricRef = [question: string, domain: string, metric: string];
export function AsBalanceBoard({ config, st, op, readOnly }: BoardProps) {
  const domains = (config.domains as string[] | undefined) ?? [], levels = (config.levels as string[] | undefined) ?? [];
  const library = (config.library as Record<string, MetricRef[]> | undefined) ?? {};
  const ex = config.example as Record<string, string> | undefined;
  const rows = list(st, "rows");
  const [level, setLevel] = useState(levels[0] ?? "");
  const [open, setOpen] = useState(true);
  const mine = rows.filter((r) => str(r.level) === level), refs = library[level] ?? [];
  const has = (q: string) => mine.find((r) => str(r.question) === q);
  const done = (r: Row) => [str(r.question), str(r.domain), str(r.metric), str(r.complement)].filter(Boolean).length;
  const set = (r: Row, value: Record<string, unknown>) => op({ key: "rows", op: "update", id: r.id, value });
  // Complementary candidates: the level's other reference metrics first, then the other levels'.
  const candidates = (r: Row) => [...new Set([...refs, ...levels.filter((l) => l !== level).flatMap((l) => library[l] ?? [])].filter((x) => x[2] !== str(r.metric)).sort((x, y) => Number(x[1] === str(r.domain)) - Number(y[1] === str(r.domain))).map((x) => x[2]))].slice(0, 7);
  const domainOf = (metric: string) => Object.values(library).flat().find((x) => x[2] === metric)?.[1] ?? "";
  return (
    <div className="ex-board po">
      <DomainBalance domains={domains} picked={rows.map((r) => str(r.domain)).filter(Boolean)} />
      <div className="mt-levels" role="tablist" aria-label="Level of the framework">
        {levels.map((l) => {
          const n = rows.filter((r) => str(r.level) === l), full = n.filter((r) => done(r) === 4).length;
          return (
            <button key={l} role="tab" aria-selected={l === level} className={`mt-level${n.length && full === n.length ? " done" : ""}`} onClick={() => (setLevel(l), setOpen(true))}>
              <b>{l}</b><small>{n.length ? `${n.length} ${n.length === 1 ? "decision" : "decisions"} · ${full} complete` : "Nothing yet"}</small>
            </button>
          );
        })}
      </div>
      {!readOnly ? (
        <section className="po-panel mt-pick">
          <button className="mt-pickhead" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span><span className="ex-mono">Step 1 · {level}</span><b>Pick the decisions and questions that matter most, or type your own</b></span><i aria-hidden>{open ? "–" : "+"}</i>
          </button>
          {open ? (
            <>
              <div className="mt-refs">
                {refs.map(([q, d, m]) => {
                  const on = has(q);
                  return (
                    <button key={q} className={`mt-ref${on ? " on" : ""}`} aria-pressed={!!on} style={{ ["--c" as string]: DOMAIN_TONE[d] }} onClick={() => (on ? op({ key: "rows", op: "remove", id: on.id }) : op({ key: "rows", op: "push", value: { level, question: q, domain: d, metric: m, ref: true } }))}>
                      <i aria-hidden>{on ? "✓" : "+"}</i>
                      <span><b>{q}</b><small><em>{d}</em>{m}</small></span>
                    </button>
                  );
                })}
              </div>
              <AddLine label={`Your own decision or question at the ${level} level`} placeholder={`+ your own decision or question at the ${level} level, Enter`} onAdd={(question) => op({ key: "rows", op: "push", value: { level, question } })} />
            </>
          ) : null}
        </section>
      ) : null}
      <section className="mt-set">
        <span className="ex-mono">{readOnly ? `${level} · the set` : `Step 2 · ${level} · for each one: the domain, one metric, and its complementary metric`}</span>
        {mine.map((r, ri) => {
          const n = done(r), comp = str(r.complement), cd = domainOf(comp);
          return (
            <article key={r.id} className={`mt-card${n === 4 ? " done" : ""}`} style={{ ["--c" as string]: DOMAIN_TONE[str(r.domain)] ?? "#0d1815", animationDelay: `${ri * 60}ms` }}>
              <header>
                <i className="mt-ring" style={{ ["--p" as string]: n / 4 }} aria-label={`${n} of 4 parts filled`}>{n === 4 ? "✓" : `${n}/4`}</i>
                <CellText row={r} k="question" hint="The decision to be taken, or the question to be answered" op={op} readOnly={readOnly} listKey="rows" />
                {!readOnly ? <button className="ex-x" aria-label="Remove this decision" onClick={() => op({ key: "rows", op: "remove", id: r.id })}>×</button> : null}
              </header>
              <div className="mt-flow">
                <div className="mt-part">
                  <span className="mt-h">Measurement domain</span>
                  <div className="mt-chips" role="group" aria-label="Measurement domain">
                    {domains.map((d) => (<button key={d} disabled={readOnly} aria-pressed={str(r.domain) === d} style={{ ["--c" as string]: DOMAIN_TONE[d] }} onClick={() => set(r, { domain: str(r.domain) === d ? "" : d })}>{d}</button>))}
                  </div>
                </div>
                <b className="mt-arrow" aria-hidden>→</b>
                <div className="mt-part">
                  <span className="mt-h">Metric</span>
                  <CellText row={r} k="metric" hint="One metric that informs it" op={op} readOnly={readOnly} listKey="rows" />
                  {!readOnly && !str(r.metric) ? <div className="mt-chips small">{refs.filter((x) => !str(r.domain) || x[1] === str(r.domain)).slice(0, 5).map((x) => (<button key={x[2]} onClick={() => set(r, { metric: x[2], ...(str(r.domain) ? {} : { domain: x[1] }) })}>{x[2]}</button>))}</div> : null}
                </div>
                <b className="mt-arrow" aria-hidden>⇄</b>
                <div className="mt-part comp">
                  <span className="mt-h">Complementary metric {cd && cd !== str(r.domain) ? <em style={{ color: DOMAIN_TONE[cd] }}>{cd}: a second domain</em> : null}</span>
                  <CellText row={r} k="complement" hint="What keeps this metric honest?" op={op} readOnly={readOnly} listKey="rows" />
                  {!readOnly && !comp ? <div className="mt-chips small">{candidates(r).map((m) => (<button key={m} style={{ ["--c" as string]: DOMAIN_TONE[domainOf(m)] }} onClick={() => set(r, { complement: m })}><i className="po-dot" style={{ background: DOMAIN_TONE[domainOf(m)], margin: "0 5px 0 0" }} />{m}</button>))}</div> : null}
                  {comp ? <CellText row={r} k="why" hint="Why this one?" op={op} readOnly={readOnly} listKey="rows" /> : null}
                </div>
              </div>
            </article>
          );
        })}
        {!mine.length ? <p className="po-empty">{readOnly ? "Nothing at this level yet." : `Nothing at the ${level} level yet: pick a decision above, or type your own.`}</p> : null}
        {!readOnly && levels.indexOf(level) < levels.length - 1 ? <div className="po-acts-row"><span /><button className="po-btn" onClick={() => (setLevel(levels[levels.indexOf(level) + 1]!), setOpen(true))}>Next level: {levels[levels.indexOf(level) + 1]} →</button></div> : null}
      </section>
      <details className="mt-sum" open={readOnly}>
        <summary><span className="ex-mono">Our balanced set · the whole table to share</span><b>{rows.length} {rows.length === 1 ? "row" : "rows"}</b></summary>
        <div className="as-tablewrap">
          <div className="as-table" role="table" aria-label="Balanced set of metrics">
            <div className="as-tr head" role="row">
              {["Level", "Decision / Question", "Measurement domain", "Metric", "Complementary metric"].map((h, i) => (<span key={h} role="columnheader" className={i > 1 ? "teal" : ""}>{h}</span>))}
            </div>
            {ex ? (<div className="as-tr example" role="row"><b>{ex.level}</b><span>{ex.question}</span><span>{ex.domain}</span><span>{ex.metric}</span><span>{ex.complement}</span><em>Example</em></div>) : null}
            {levels.flatMap((l) => rows.filter((r) => str(r.level) === l)).map((r) => (
              <div key={r.id} className="as-tr" role="row">
                <b>{str(r.level)}</b><span>{str(r.question)}</span><span>{str(r.domain) ? <><i className="po-dot" style={{ background: DOMAIN_TONE[str(r.domain)], margin: "0 6px 0 0" }} />{str(r.domain)}</> : "—"}</span><span>{str(r.metric) || "—"}</span><span>{str(r.complement) || "—"}{str(r.why) ? <small style={{ display: "block", opacity: 0.75 }}>{str(r.why)}</small> : null}</span>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}

// Analyze this set of metrics at CARS: the case in four cards, the set of metrics as given, and
// for each metric whether the group keeps or changes it, with the blind spots it notices.
export function AsCarsBoard({ config, st, op, readOnly }: BoardProps) {
  const cards = (config.scenario as [string, string, string[]][] | undefined) ?? [];
  const rows = (config.rows as string[][] | undefined) ?? [], domains = (config.domains as string[] | undefined) ?? [];
  const [card, setCard] = useState(0);
  const verdict = (st.verdict && typeof st.verdict === "object" ? st.verdict : {}) as Record<string, string>;
  const keep = rows.filter((_, i) => verdict[i] === "keep").length, change = rows.filter((_, i) => verdict[i] === "change").length;
  return (
    <div className="ex-board po">
      <section className="po-panel">
        <div className="po-seg" role="tablist" aria-label="CARS scenario">
          {cards.map(([t], i) => (<button key={t} role="tab" aria-selected={i === card} aria-pressed={i === card} onClick={() => setCard(i)}>{t}</button>))}
        </div>
        {cards[card] ? (
          <div className="as-case" key={card}>
            <p>{cards[card][1]}</p>
            <ul>{cards[card][2].map((x) => { const [h, ...rest] = x.split(": "); return rest.length ? <li key={x}><b>{h}:</b> {rest.join(": ")}</li> : <li key={x}>{x}</li>; })}</ul>
          </div>
        ) : null}
      </section>
      <DomainBalance domains={domains} picked={rows.map((r) => r[2]!)} />
      <div className="as-tablewrap">
        <div className="as-table cars" role="table" aria-label="The set of metrics at CARS">
          <div className="as-tr head" role="row">
            {["Level", "Decision / Question", "Measurement domain", "Metric", "Complementary metric", "Our call"].map((h, i) => (<span key={h} role="columnheader" className={i > 1 ? "teal" : ""}>{h}</span>))}
          </div>
          {rows.map((r, i) => (
            <div key={i} className={`as-tr v-${verdict[i] ?? "none"}`} role="row">
              <b>{r[0]}</b><span>{r[1]}</span><span><i className="po-dot" style={{ background: DOMAIN_TONE[r[2]!], margin: "0 6px 0 0" }} />{r[2]}</span><span>{r[3]}</span><span>{r[4]}</span>
              <div className="as-call">
                <div className="po-seg small" role="group" aria-label={`Our call on ${r[3]}`}>
                  {(["keep", "change"] as const).map((v) => (<button key={v} disabled={readOnly} aria-pressed={verdict[i] === v} onClick={() => op({ key: "verdict", op: "set", value: { ...verdict, [i]: verdict[i] === v ? "" : v } })}>{v === "keep" ? "Keep" : "Change"}</button>))}
                </div>
                {verdict[i] === "change" ? <Field k={`to:${i}`} st={st} op={op} readOnly={readOnly} rows={2} placeholder="What we would use instead" label={`Change for ${r[3]}`} /> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="po-two wide">
        <section className="po-panel">
          <span className="ex-mono">Our call so far</span>
          <p className="po-big">{keep} kept · {change} changed · {rows.length - keep - change} to decide</p>
        </section>
        <section className="po-panel">
          <span className="ex-mono">What potential blind spots do you notice?</span>
          {list(st, "blind").map((n) => (
            <div key={n.id} className="po-sticky" style={{ background: "#f9d9d2", borderLeftColor: "#c2412d" }}>
              <span>{str(n.text)}</span>
              {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: "blind", op: "remove", id: n.id })}>×</button> : null}
            </div>
          ))}
          {!readOnly ? <AddLine label="Blind spot" placeholder="+ a blind spot, Enter" onAdd={(text) => op({ key: "blind", op: "push", value: { text } })} /> : null}
        </section>
      </div>
    </div>
  );
}

// Preparing for hard conversations: the case (context, the three leaders, what happened), the two
// questions to prepare, the LLM steps, and the plan the group documents.
export function AsHardBoard({ config, st, op, readOnly }: BoardProps) {
  const cards = (config.scenario as [string, string[]][] | undefined) ?? [], personas = config.personas as { names: string[]; rows: string[][] } | undefined;
  const qs = (config.questions as string[] | undefined) ?? [], steps = (config.steps as string[] | undefined) ?? [];
  const tabs = [cards[0]?.[0], "Leader personas", cards[1]?.[0]].filter(Boolean) as string[];
  const [tab, setTab] = useState(0);
  const [who, setWho] = useState(0);
  const done = (st.done && typeof st.done === "object" ? st.done : {}) as Record<string, boolean>;
  const ready = [qs.every((_, i) => list(st, `q:${i}`).length), steps.every((_, i) => done[i]), !!str(st.plan)];
  return (
    <div className="ex-board po">
      <section className="po-panel">
        <div className="po-seg" role="tablist" aria-label="Hard conversations scenario">
          {tabs.map((t, i) => (<button key={t} role="tab" aria-selected={i === tab} aria-pressed={i === tab} onClick={() => setTab(i)}>{t}</button>))}
        </div>
        {tab === 1 && personas ? (
          <div className="as-personas" key="p">
            <div className="po-chips">{personas.names.map((n, i) => (<button key={n} aria-pressed={who === i} onClick={() => setWho(i)}>{n}</button>))}</div>
            <dl>
              {personas.rows.map((r) => (<div key={r[0]}><dt>{r[0]}</dt><dd>{r[who + 1]}</dd></div>))}
              <div><dt>What info are we missing?</dt><dd><Field k={`missing:${who}`} st={st} op={op} readOnly={readOnly} rows={2} placeholder="Discuss as a team" label={`What we are missing about ${personas.names[who]}`} /></dd></div>
            </dl>
          </div>
        ) : (
          <div className="as-case" key={tab}>{(cards[tab === 0 ? 0 : 1]?.[1] ?? []).map((x) => (<p key={x} style={{ fontWeight: 500 }}>{x}</p>))}</div>
        )}
      </section>
      <ol className="po-steps" aria-label="Progress">{["Consider", "Experiment with an LLM", "Document the plan"].map((x, i) => (<li key={x} className={ready[i] ? "done" : ready.slice(0, i).every(Boolean) ? "on" : ""}>{x}</li>))}</ol>
      <div className="po-cols" style={{ ["--n" as string]: qs.length }}>
        {qs.map((q, qi) => (
          <section key={q} className="po-col">
            <header><span className="po-n">{qi + 1}</span><b>{q}</b></header>
            {list(st, `q:${qi}`).map((n) => (
              <div key={n.id} className="po-sticky" style={{ background: qi ? "#cde0f2" : "#cfe8d4", borderLeftColor: qi ? "#2f6fbd" : "#2e8b57" }}>
                <span>{str(n.text)}</span>
                {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: `q:${qi}`, op: "remove", id: n.id })}>×</button> : null}
              </div>
            ))}
            {!readOnly ? <AddLine label={q} placeholder="+ add, Enter" onAdd={(text) => op({ key: `q:${qi}`, op: "push", value: { text } })} /> : null}
          </section>
        ))}
      </div>
      <div className="po-two wide">
        <section className="po-panel">
          <span className="ex-mono">Experiment with an LLM to help you</span>
          {steps.map((x, i) => (
            <button key={x} className={`po-checkrow${done[i] ? " on" : ""}`} disabled={readOnly} aria-pressed={!!done[i]} onClick={() => op({ key: "done", op: "set", value: { ...done, [i]: !done[i] } })}>
              <i aria-hidden>{done[i] ? "✓" : i + 1}</i><span>{x}</span>
            </button>
          ))}
        </section>
        <section className="po-panel">
          <span className="ex-mono">Our plan for the conversation, to share with the class</span>
          <Field k="plan" st={st} op={op} readOnly={readOnly} rows={9} placeholder="How we open, what we ask, the messages that need careful phrasing, and what we want to leave with." label="Our plan for the conversation" />
        </section>
      </div>
    </div>
  );
}

// Different needs, different starting points: the implementation roadmap as a winding road. Click a
// step to name it a valid starting point; each one chosen gets its pros and cons.
export function AsRoadmapBoard({ config, st, op, readOnly }: BoardProps) {
  const steps = (config.steps as string[] | undefined) ?? [], per = 4;
  const starts = (st.starts && typeof st.starts === "object" ? st.starts : {}) as Record<string, boolean>;
  const chosen = steps.map((_, i) => i).filter((i) => starts[i]);
  const [at, setAt] = useState<number | null>(null);
  const focus = at !== null && starts[at] ? at : (chosen[0] ?? null);
  const rows = Array.from({ length: Math.ceil(steps.length / per) }, (_, r) => steps.map((x, i) => [x, i] as const).slice(r * per, r * per + per));
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
      <section className="po-panel">
        <span className="ex-mono">The implementation roadmap · {chosen.length} starting {chosen.length === 1 ? "point" : "points"} named</span>
        <div className="as-rm">
          {rows.map((row, r) => (
            <div key={r} className={`as-rm-row${r % 2 ? " back" : ""}`}>
              {row.map(([name, i]) => (
                <button key={name} className={`as-rm-step${starts[i] ? " on" : ""}${focus === i ? " focus" : ""}`} disabled={readOnly && !starts[i]} aria-pressed={!!starts[i]} style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => (starts[i] ? setAt(i) : !readOnly && (op({ key: "starts", op: "set", value: { ...starts, [i]: true } }), setAt(i)))}>
                  <i>{starts[i] ? "⚑" : i + 1}</i>
                  <span>{name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
        <p className="po-note">The road runs left to right, turns, and comes back, as on the slide. Click a step to name it a valid starting point; click a named one to work on its pros and cons.</p>
      </section>
      {focus !== null ? (
        <section className="po-panel" key={focus}>
          <div className="rd-advhead" style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <b className="as-verdict">Starting at: {steps[focus]}</b>
            {!readOnly ? <button className="po-btn plain" onClick={() => (op({ key: "starts", op: "set", value: { ...starts, [focus]: false } }), setAt(null))}>Not a starting point after all</button> : null}
          </div>
          <div className="po-cols" style={{ ["--n" as string]: 2 }}>
            {(["pro", "con"] as const).map((k) => (
              <div key={k} className="po-col">
                <header><span className="po-n" style={{ background: k === "pro" ? "#2e8b57" : "#c2412d" }}>{k === "pro" ? "+" : "−"}</span><b>{k === "pro" ? "Pros" : "Cons"}</b></header>
                {list(st, `${k}:${focus}`).map((n) => (
                  <div key={n.id} className="po-sticky" style={{ background: k === "pro" ? "#cfe8d4" : "#f9d9d2", borderLeftColor: k === "pro" ? "#2e8b57" : "#c2412d" }}>
                    <span>{str(n.text)}</span>
                    {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: `${k}:${focus}`, op: "remove", id: n.id })}>×</button> : null}
                  </div>
                ))}
                {!readOnly ? <AddLine label={k === "pro" ? "Pro" : "Con"} placeholder="+ add, Enter" onAdd={(text) => op({ key: `${k}:${focus}`, op: "push", value: { text } })} /> : null}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <p className="po-empty">No starting point named yet. Click a step on the road.</p>
      )}
    </div>
  );
}

// The transformation canvas (Align transformation objectives with business objectives): one canvas
// the group fills part by part over several exercises. Each exercise puts one part in focus; the
// whole canvas is always there. An example can be loaded, and cleared to work on the group's own.
const CV_SIDES = [["bo", "Business Operations"], ["sd", "Solution Delivery"]] as const;

const CV_FOCUS: Record<string, string[]> = { all: ["context", "tobj", "bobj", "ktr", "kbr", "align"], context: ["context"], business: ["bobj", "kbr"], transformation: ["tobj", "ktr"], alignment: ["ktr", "align", "kbr"] };
const linksOf = (r: Row): string[] => (Array.isArray(r.links) ? (r.links as string[]) : []);

type RefTable = { title: string; cols: string[]; rows: string[][] };
/** Reference tables to draw ideas from, one at a time. */
function ReferenceTables({ tables }: { tables: RefTable[] }) {
  const [at, setAt] = useState(0);
  const t = tables[at];
  if (!t) return null;
  return (
    <details className="po-material rf">
      <summary>Ideas for key results: leading and lagging indicators, and example metrics</summary>
      <div className="po-chips" style={{ margin: "10px 0" }}>{tables.map((x, i) => (<button key={x.title} aria-pressed={i === at} onClick={() => setAt(i)}>{x.title.replace(/^(Leading indicators of|Examples of) /, "").replace(/ key results$/, "")}</button>))}</div>
      <b>{t.title}</b>
      <div className="as-tablewrap">
        <table className="rf-table">
          <thead><tr>{t.cols.map((c) => (<th key={c} scope="col">{c}</th>))}</tr></thead>
          <tbody>{t.rows.map((r) => (<tr key={r[0]}>{r.map((c, i) => (i ? <td key={i}>{c}</td> : <th key={i} scope="row">{c}</th>))}</tr>))}</tbody>
        </table>
      </div>
    </details>
  );
}

/** One field of a key result, saved when it is left. */
function RowInput({ row, k, hint, op, readOnly, listKey, className }: { row: Row; k: string; hint: string; op: BoardProps["op"]; readOnly: boolean; listKey: string; className?: string }) {
  const saved = str(row[k]);
  const [v, setV] = useState(saved);
  useEffect(() => setV(saved), [saved]);
  return <input className={className} value={v} placeholder={hint} aria-label={hint} disabled={readOnly} onClick={(e) => e.stopPropagation()} onChange={(e) => setV(e.target.value)} onBlur={() => v !== saved && op({ key: listKey, op: "update", id: row.id, value: { [k]: v.trim() } })} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />;
}

/** The name of one side of the business context: the slide's name to start with, and the group's own once typed. */
function VoiceName({ k, fallback, tone, st, op, readOnly }: Pick<BoardProps, "st" | "op" | "readOnly"> & { k: string; fallback: string; tone: string }) {
  const saved = str(st[k]);
  const [v, setV] = useState(saved || fallback);
  useEffect(() => setV(saved || fallback), [saved, fallback]);
  return <input className={`cv2-voice ${tone}`} value={v} disabled={readOnly} aria-label={`Name of this side (${fallback})`} title="Click to rename" size={Math.max(12, v.length + 1)} onFocus={(e) => e.target.select()} onChange={(e) => setV(e.target.value)} onBlur={() => { const t = v.trim(); if (!t) setV(fallback); if ((t && t !== fallback ? t : "") !== saved) op({ key: k, op: "set", value: t && t !== fallback ? t : null }); }} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />;
}

export function AsCanvasBoard({ config, st, op, readOnly }: BoardProps) {
  const qs = (config.questions as string[] | undefined) ?? [], focus = str(config.focus) || "all", example = config.example as Record<string, unknown> | undefined;
  const on = (p: string) => (CV_FOCUS[focus] ?? CV_FOCUS.all!).includes(p);
  const ktr = list(st, "ktr"), kbr = list(st, "kbr");
  const links = ktr.flatMap((t) => linksOf(t).filter((id) => kbr.some((b) => b.id === id)).map((b) => ({ t: t.id, b })));
  const looseT = ktr.filter((t) => !links.some((l) => l.t === t.id)), looseB = kbr.filter((b) => !links.some((l) => l.b === b.id));
  const ctxFilled = qs.flatMap((_, i) => CV_SIDES.map(([s]) => str(st[`ctx:${i}:${s}`]))).filter(Boolean).length;
  const empty = !ctxFilled && !str(st.tobj) && !str(st.bobj) && !ktr.length && !kbr.length;
  const total = ktr.length + kbr.length, score = total ? Math.round(((total - looseT.length - looseB.length) / total) * 100) : 0;
  // Linking: pick a result on either side, then click results on the other side to connect or disconnect them.
  const [pick, setPick] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const active = pick ?? hover, pickedT = ktr.find((t) => t.id === pick), pickedB = kbr.find((b) => b.id === pick);
  const toggle = (t: Row, bId: string) => op({ key: "ktr", op: "update", id: t.id, value: { links: linksOf(t).includes(bId) ? linksOf(t).filter((x) => x !== bId) : [...linksOf(t), bId] } });
  const click = (side: "t" | "b", r: Row) => {
    if (readOnly) return;
    if (side === "t") return pickedB ? toggle(r, pickedB.id) : setPick(pick === r.id ? null : r.id);
    return pickedT ? toggle(pickedT, r.id) : setPick(pick === r.id ? null : r.id);
  };
  const lit = (id: string) => !active || id === active || links.some((l) => (l.t === active && l.b === id) || (l.b === active && l.t === id));
  // The strings are drawn between the cards where they really are on the page.
  const box = useRef<HTMLDivElement>(null);
  const [geo, setGeo] = useState<{ w: number; h: number; at: Record<string, [number, number]> }>({ w: 0, h: 0, at: {} });
  const sig = `${ktr.map((r) => r.id + str(r.outcome) + str(r.metric)).join("|")}#${kbr.map((r) => r.id + str(r.outcome) + str(r.metric)).join("|")}`;
  useEffect(() => {
    const measure = () => {
      const el = box.current;
      if (!el) return;
      const o = el.getBoundingClientRect(), at: Record<string, [number, number]> = {};
      el.querySelectorAll<HTMLElement>("[data-kr]").forEach((c) => { const r = c.getBoundingClientRect(); at[c.dataset.kr!] = [c.dataset.side === "t" ? r.right - o.left : r.left - o.left, r.top - o.top + r.height / 2]; });
      setGeo({ w: o.width, h: o.height, at });
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro && box.current) ro.observe(box.current);
    window.addEventListener("resize", measure);
    return () => (ro?.disconnect(), window.removeEventListener("resize", measure));
  }, [sig]);
  const load = () => {
    if (!example || (!empty && !window.confirm("Replace what is on the canvas with the example?"))) return;
    for (const [k, v] of Object.entries(example)) op({ key: k, op: "set", value: v });
  };
  const clear = () => {
    if (!window.confirm("Clear the whole canvas to work on your own?")) return;
    for (const k of [...qs.flatMap((_, i) => CV_SIDES.map(([s]) => `ctx:${i}:${s}`)), "who", "voice:sd", "voice:bo", "tobj", "bobj", "ktr", "kbr"]) op({ key: k, op: "set", value: null });
    setPick(null);
  };
  const Results = ({ side }: { side: "t" | "b" }) => {
    const k = side === "t" ? "ktr" : "kbr", rows = side === "t" ? ktr : kbr, loose = side === "t" ? looseT : looseB;
    return (
      <div className={`cv2-side ${side} cv-part${on(k) ? " focus" : ""}`}>
        <div className="cv2-sidehead"><b>{side === "t" ? "Key Transformation Results" : "Key Business Results"}</b><span>{side === "t" ? "leading indicators" : "lagging indicators"}</span></div>
        {rows.map((r, i) => {
          const n = links.filter((l) => (side === "t" ? l.t : l.b) === r.id).length, target = side === "t" ? !!pickedB : !!pickedT;
          const linked = target && (side === "t" ? linksOf(r).includes(pick!) : linksOf(pickedT!).includes(r.id));
          return (
            <div key={r.id} data-kr={r.id} data-side={side} role="button" tabIndex={readOnly ? -1 : 0} aria-pressed={pick === r.id}
              className={`cv2-kr${pick === r.id ? " picked" : ""}${target ? " target" : ""}${linked ? " linked" : ""}${lit(r.id) ? "" : " dim"}${loose.includes(r) ? " loose" : ""}`}
              onClick={() => click(side, r)} onKeyDown={(e) => e.key === "Enter" && e.target === e.currentTarget && click(side, r)} onMouseEnter={() => setHover(r.id)} onMouseLeave={() => setHover(null)}>
              <span className="cv2-tag">{side === "t" ? "T" : "B"}{i + 1}</span>
              <div className="cv2-krbody">
                <RowInput className="cv2-outcome" row={r} k="outcome" hint="Desired outcome" op={op} readOnly={readOnly} listKey={k} />
                <RowInput className="cv2-metric" row={r} k="metric" hint={side === "t" ? "Metric (leading indicator)" : "Metric (lagging indicator)"} op={op} readOnly={readOnly} listKey={k} />
                <div className="cv2-fromto"><RowInput row={r} k="from" hint="From" op={op} readOnly={readOnly} listKey={k} /><i aria-hidden>→</i><RowInput row={r} k="to" hint="To" op={op} readOnly={readOnly} listKey={k} /></div>
              </div>
              <span className="cv2-port" title={n ? `${n} connected` : "Not connected"}>{target ? (linked ? "✓" : "+") : n || "!"}</span>
              {!readOnly ? <button className="ex-x" aria-label="Remove this key result" onClick={(e) => (e.stopPropagation(), op({ key: k, op: "remove", id: r.id }), setPick(null))}>×</button> : null}
            </div>
          );
        })}
        {!readOnly && rows.length < 6 ? <button className="cv2-add" onClick={() => op({ key: k, op: "push", value: {} })}>+ a key result</button> : null}
      </div>
    );
  };
  const C = 2 * Math.PI * 26;
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
      <div className="cv-top">
        <ol className="po-steps" aria-label="Parts of the canvas">
          {([["context", "Business context", ctxFilled === qs.length * 2], ["business", "Business OKR", !!str(st.bobj) && kbr.length > 0], ["transformation", "Transformation OKR", !!str(st.tobj) && ktr.length > 0], ["alignment", "Alignment", total > 0 && score === 100]] as const).map(([p, l, ok]) => (<li key={p} className={ok ? "done" : focus === p ? "on" : ""}>{l}</li>))}
        </ol>
        {!readOnly ? (
          <span style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {example ? <button className="po-reset" style={{ marginLeft: 0 }} onClick={load}>Load the CARS example</button> : null}
            {!empty ? <button className="po-reset" style={{ marginLeft: 0 }} onClick={clear}>Clear for our own</button> : null}
          </span>
        ) : null}
      </div>

      <section className={`cv2-context cv-part${on("context") ? " focus" : ""}`}>
        <header><span className="ex-mono">Business context</span><Field k="who" st={st} op={op} readOnly={readOnly} rows={1} placeholder="Whose canvas is this? Your own organization, or CARS" label="Organization" /></header>
        <div className="cv2-voices">
          <VoiceName k="voice:sd" fallback="Solution Delivery" tone="sd" st={st} op={op} readOnly={readOnly} /><span /><VoiceName k="voice:bo" fallback="Business Operations" tone="bo" st={st} op={op} readOnly={readOnly} />
          {qs.map((q, i) => [
            <label key={`sd${i}`} className="cv2-bubble sd"><Field k={`ctx:${i}:sd`} st={st} op={op} readOnly={readOnly} rows={2} placeholder="…" label={`${q} ${str(st["voice:sd"]) || "Solution Delivery"}`} /></label>,
            <b key={`q${i}`} className="cv2-q">{q}</b>,
            <label key={`bo${i}`} className="cv2-bubble bo"><Field k={`ctx:${i}:bo`} st={st} op={op} readOnly={readOnly} rows={2} placeholder="…" label={`${q} ${str(st["voice:bo"]) || "Business Operations"}`} /></label>,
          ])}
        </div>
      </section>

      <section className="cv2-objs">
        <label className={`cv2-obj t cv-part${on("tobj") ? " focus" : ""}`}><span>Transformation Objective</span><Field k="tobj" st={st} op={op} readOnly={readOnly} rows={2} placeholder="What the transformation sets out to achieve" label="Transformation Objective" /></label>
        <div className={`cv2-score cv-part${on("align") ? " focus" : ""}`} role="img" aria-label={`${score}% of the key results are connected`}>
          <svg width="68" height="68" viewBox="0 0 68 68"><circle cx="34" cy="34" r="26" fill="#fff" stroke="#06384a22" strokeWidth="7" /><circle className="po-ring-v" cx="34" cy="34" r="26" fill="none" stroke={score === 100 ? "#2e8b57" : "#d98a1c"} strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} transform="rotate(-90 34 34)" /></svg>
          <b>{score}%</b><small>aligned</small>
        </div>
        <label className={`cv2-obj b cv-part${on("bobj") ? " focus" : ""}`}><span>Business Objective</span><Field k="bobj" st={st} op={op} readOnly={readOnly} rows={2} placeholder="What the business sets out to achieve" label="Business Objective" /></label>
      </section>

      <section className={`cv2-link${pick ? " linking" : ""}`} ref={box}>
        <svg className={`cv2-strings cv-part${on("align") ? " focus" : ""}`} width={geo.w} height={geo.h} aria-hidden>
          <defs><linearGradient id="cv2-g" x1="0" x2="1"><stop offset="0" stopColor="#3f7c80" /><stop offset="1" stopColor="#5fb3b8" /></linearGradient></defs>
          {links.map((l) => {
            const a = geo.at[l.t], b = geo.at[l.b];
            if (!a || !b) return null;
            const hot = active === l.t || active === l.b, mid = (b[0] - a[0]) / 2;
            return <path key={`${l.t}-${l.b}`} className={`cv2-string${hot ? " hot" : active ? " cold" : ""}`} d={`M ${a[0]} ${a[1]} C ${a[0] + mid} ${a[1]}, ${b[0] - mid} ${b[1]}, ${b[0]} ${b[1]}`} />;
          })}
        </svg>
        <Results side="t" />
        <div className={`cv2-mid cv-part${on("align") ? " focus" : ""}`}>
          <b>Alignment</b>
          <p>{readOnly ? "" : pickedT ? `Click the business results that “${str(pickedT.outcome) || "this result"}” leads to.` : pickedB ? `Click the transformation results that lead to “${str(pickedB.outcome) || "this result"}”.` : total ? "Click a key result, then click the ones on the other side it connects to. Click again to disconnect." : "Add key results on both sides, then connect them."}</p>
          {pick && !readOnly ? <button className="po-btn plain" onClick={() => setPick(null)}>Done</button> : null}
          {!pick && (looseT.length || looseB.length) ? <p className="cv2-warn">{looseT.length ? `${looseT.length} leading ${looseT.length === 1 ? "indicator leads" : "indicators lead"} nowhere. ` : ""}{looseB.length ? `Nothing leads to ${looseB.length} business ${looseB.length === 1 ? "result" : "results"}.` : ""}</p> : null}
        </div>
        <Results side="b" />
      </section>

      {Array.isArray(config.reference) ? <ReferenceTables tables={config.reference as RefTable[]} /> : null}
      {Array.isArray(config.also) ? (
        <div className="po-cols" style={{ ["--n" as string]: (config.also as string[]).length }}>
          {(config.also as string[]).map((q, qi) => (
            <section key={q} className="po-col">
              <header><span className="po-n">{qi + 1}</span><b>{q}</b></header>
              {list(st, `also:${focus}:${qi}`).map((x) => (
                <div key={x.id} className="po-sticky" style={{ background: "#cde0f2", borderLeftColor: "#2f6fbd" }}>
                  <span>{str(x.text)}</span>
                  {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: `also:${focus}:${qi}`, op: "remove", id: x.id })}>×</button> : null}
                </div>
              ))}
              {!readOnly ? <AddLine label={q} placeholder="+ add, Enter" onAdd={(text) => op({ key: `also:${focus}:${qi}`, op: "push", value: { text } })} /> : null}
            </section>
          ))}
        </div>
      ) : null}
      <p className="po-note">The canvas is the same one in every step of this lesson. The part this step is about is in full colour; the rest is still yours to edit.</p>
    </div>
  );
}

// The transformation backlog: one backlog across three exercises. Storm features or epics, add the
// items that unblock anticipated impediments, score with WSJF, then place them on the PI roadmap.
const BL_FIB = [1, 2, 3, 5, 8, 13, 20];
const BL_SCORES = [["bv", "User-business value"], ["tc", "Time criticality"], ["rr", "Risk reduction · opportunity enablement"], ["size", "Job size"]] as const;
const blWsjf = (x: Row) => (num(x.bv) && num(x.tc) && num(x.rr) && num(x.size) ? Math.round(((num(x.bv) + num(x.tc) + num(x.rr)) / num(x.size)) * 10) / 10 : null);
const blRanked = (items: Row[]) => [...items].sort((a, b) => (blWsjf(b) ?? -1) - (blWsjf(a) ?? -1));
const BL_TONE: Record<string, string> = { Feature: "#a8d4f5", Epic: "#c9b6ec", Unblocker: "#f6c28b" };

export function AsBacklogBoard({ config, st, op, readOnly }: BoardProps) {
  const step = str(config.step) || "storm", items = list(st, "items"), imps = list(st, "imps");
  const [name, setName] = useState("");
  const [type, setType] = useState("Feature");
  const [copied, setCopied] = useState(false);
  const add = (t = type, n = name, from?: string) => n.trim() && (op({ key: "items", op: "push", value: { name: n.trim(), type: t, ...(from ? { from } : {}) } }), setName(""));
  const ranked = blRanked(items), scored = items.filter((x) => blWsjf(x) !== null).length;
  const range = (config.range as [number, number] | undefined) ?? [8, 10];
  const text = ranked.map((x, i) => `${i + 1}. [${str(x.type)}] ${str(x.name)}${blWsjf(x) !== null ? ` (WSJF ${blWsjf(x)})` : ""}`).join("\n");
  const prompt = `${str(config.llm)}\n\n${text}`;
  const pis = ["PI 1", "PI 2", "PI 3"];
  const set = (id: string, value: Record<string, unknown>) => op({ key: "items", op: "update", id, value });
  const Card = ({ x, children }: { x: Row; children?: ReactNode }) => (
    <div className="bl-card" style={{ borderLeftColor: BL_TONE[str(x.type)] ?? "#a8d4f5" }}>
      <small style={{ background: BL_TONE[str(x.type)] }}>{str(x.type)}</small>
      <span>{str(x.name)}</span>
      {blWsjf(x) !== null ? <b title="WSJF">{blWsjf(x)}</b> : null}
      {children}
    </div>
  );
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
      <ol className="po-steps" aria-label="Progress">
        {([["storm", `Brainstorm · ${items.filter((x) => str(x.type) !== "Unblocker").length}`], ["wsjf", `Impediments and WSJF · ${scored}/${items.length}`], ["roadmap", `Roadmap · ${items.filter((x) => typeof x.pi === "number").length} placed`]] as const).map(([k, l]) => (<li key={k} className={k === step ? "on" : ""}>{l}</li>))}
      </ol>

      {step === "storm" ? (
        <section className="po-panel">
          <div className="po-build">
            <span className="po-count" data-ok={items.length >= range[0]}>{items.length}/{range[0]}</span>
            <p className="po-note">Brainstorm {range[0]} to {range[1]} SAFe implementation items that would achieve the desired transformation outcomes. Choose for each whether it is a Feature or an Epic.</p>
          </div>
          {!readOnly ? (
            <div className="po-evform" style={{ gridTemplateColumns: "auto minmax(0, 1fr) auto" }}>
              <div className="po-seg" role="group" aria-label="Kind of item">{["Feature", "Epic"].map((t) => (<button key={t} aria-pressed={type === t} onClick={() => setType(t)}>{t}</button>))}</div>
              <input className="po-input" value={name} placeholder={`Name the ${type.toLowerCase()}, Enter`} aria-label="Item name" onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
              <button className="po-btn" disabled={!name.trim()} onClick={() => add()}>Add</button>
            </div>
          ) : null}
          <div className="bl-wall">
            {items.map((x) => (
              <Card key={x.id} x={x}>
                {!readOnly ? (
                  <span className="bl-acts">
                    {str(x.type) !== "Unblocker" ? <button title="Switch between Feature and Epic" onClick={() => set(x.id, { type: str(x.type) === "Epic" ? "Feature" : "Epic" })}>⇄</button> : null}
                    <button aria-label="Remove" onClick={() => op({ key: "items", op: "remove", id: x.id })}>×</button>
                  </span>
                ) : null}
              </Card>
            ))}
            {!items.length ? <p className="po-empty">Nothing in the backlog yet.</p> : null}
          </div>
        </section>
      ) : null}

      {step === "wsjf" ? (
        <>
          <section className="po-panel">
            <span className="ex-mono">Impediments we might encounter, and the backlog item that unblocks each</span>
            {imps.map((m) => {
              const fix = items.find((x) => x.from === m.id);
              return (
                <div key={m.id} className="bl-imp">
                  <span className="bl-block">⛔ {str(m.text)}</span>
                  <i aria-hidden>→</i>
                  {fix ? <Card x={fix} /> : !readOnly ? <AddLine label={`How to overcome: ${str(m.text)}`} placeholder="+ the item that unblocks it, Enter" onAdd={(t) => add("Unblocker", t, m.id)} /> : <span className="po-note">No item yet</span>}
                  {!readOnly ? <button className="ex-x" aria-label="Remove impediment" onClick={() => op({ key: "imps", op: "remove", id: m.id })}>×</button> : null}
                </div>
              );
            })}
            {!readOnly ? <AddLine label="Impediment" placeholder="+ an impediment to our transformation strategy, Enter" onAdd={(t) => op({ key: "imps", op: "push", value: { text: t } })} /> : null}
          </section>
          <section className="po-panel">
            <div className="rd-advhead" style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span className="ex-mono">WSJF · {items.length} items, aim for {range[0]} to {range[1]}</span>
              <button className="po-btn plain" disabled={!items.length} onClick={() => void navigator.clipboard?.writeText(prompt).then(() => (setCopied(true), window.setTimeout(() => setCopied(false), 1600)))}>{copied ? "Copied" : "Copy the backlog as a prompt for AI"}</button>
            </div>
            <div className="as-tablewrap">
              <div className="bl-table" role="table" aria-label="WSJF">
                <div className="bl-tr head" role="row"><span>#</span><span>Item</span>{BL_SCORES.slice(0, 3).map(([k, l]) => (<span key={k}>{l}</span>))}<span className="calc">= Cost of delay</span><span>÷ Job size</span><span className="calc">= WSJF</span></div>
                {ranked.map((x, i) => (
                  <div key={x.id} className={`bl-tr${blWsjf(x) !== null && i === 0 ? " top" : ""}`} role="row">
                    <b>{blWsjf(x) !== null ? i + 1 : "–"}</b>
                    <span><small style={{ background: BL_TONE[str(x.type)] }}>{str(x.type)}</small> {str(x.name)}</span>
                    {BL_SCORES.map(([k, l], ci) => [
                      ci === 3 ? <b key="cod" className="bl-score calc" aria-label={`Cost of delay of ${str(x.name)}`}>{num(x.bv) && num(x.tc) && num(x.rr) ? num(x.bv) + num(x.tc) + num(x.rr) : "–"}</b> : null,
                      <select key={k} value={num(x[k]) || ""} disabled={readOnly} aria-label={`${l} of ${str(x.name)}`} onChange={(e) => set(x.id, { [k]: Number(e.target.value) || null })}>
                        <option value="">–</option>
                        {BL_FIB.map((f) => (<option key={f} value={f}>{f}</option>))}
                      </select>,
                    ])}
                    <b key={String(blWsjf(x))} className="bl-score calc wsjf" aria-label={`WSJF of ${str(x.name)}`}>{blWsjf(x) ?? "–"}</b>
                  </div>
                ))}
              </div>
            </div>
            <p className="po-note">You only pick the four scores. Cost of delay, WSJF and the rank are calculated for you, and the list re-sorts as you score, highest first.</p>
          </section>
        </>
      ) : null}

      {step === "roadmap" ? (
        <>
          <section className="po-panel">
            <div className="rd-advhead" style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span className="ex-mono">Prioritized backlog · not on the roadmap yet</span>
              <button className="po-btn plain" disabled={!items.length} onClick={() => void navigator.clipboard?.writeText(prompt).then(() => (setCopied(true), window.setTimeout(() => setCopied(false), 1600)))}>{copied ? "Copied" : "Copy for your AI thinking buddy"}</button>
            </div>
            <div className="bl-wall">
              {ranked.filter((x) => typeof x.pi !== "number").map((x) => (
                <Card key={x.id} x={x}>{!readOnly ? <span className="bl-acts">{pis.map((p, i) => (<button key={p} onClick={() => set(x.id, { pi: i })}>{p}</button>))}</span> : null}</Card>
              ))}
              {ranked.every((x) => typeof x.pi === "number") ? <p className="po-note">{items.length ? "Every item is on the roadmap." : "The backlog is empty: brainstorm and prioritize it in the earlier activities."}</p> : null}
            </div>
          </section>
          <div className="bl-arrow" aria-hidden />
          <div className="bl-road">
            {pis.map((p, i) => (
              <section key={p} className="bl-pi">
                <header>{p}</header>
                <div>
                  {ranked.filter((x) => x.pi === i).map((x) => (
                    <Card key={x.id} x={x}>
                      {!readOnly ? (
                        <span className="bl-acts">
                          <button aria-label="Earlier" disabled={i === 0} onClick={() => set(x.id, { pi: i - 1 })}>←</button>
                          <button aria-label="Later" disabled={i === pis.length - 1} onClick={() => set(x.id, { pi: i + 1 })}>→</button>
                          <button aria-label="Back to the backlog" onClick={() => set(x.id, { pi: null })}>×</button>
                        </span>
                      ) : null}
                    </Card>
                  ))}
                </div>
                <footer>{i === 0 ? "Committed" : "Forecast"}</footer>
              </section>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

// Improving strategic themes: the case to read, each theme with its key results and the group's call
// on it (keep, revise, remove), themes to add, and what AI suggested.
const TH_CALLS = [["keep", "Keep", "#cfe8d4"], ["revise", "Revise", "#ffe9b8"], ["remove", "Remove", "#f9d9d2"]] as const;
export function AsThemesBoard({ config, st, op, readOnly }: BoardProps) {
  const cards = (config.scenario as [string, string[]][] | undefined) ?? [], themes = (config.themes as [string, string, string[]][] | undefined) ?? [];
  const [tab, setTab] = useState(0);
  const call = (st.call && typeof st.call === "object" ? st.call : {}) as Record<string, string>, added = list(st, "added");
  const n = (k: string) => themes.filter((_, i) => call[i] === k).length;
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
      <section className="po-panel">
        <div className="po-seg" role="tablist" aria-label="CARS scenario">{cards.map(([t], i) => (<button key={t} role="tab" aria-selected={i === tab} aria-pressed={i === tab} onClick={() => setTab(i)}>{t}</button>))}</div>
        <div className="as-case" key={tab}>{(cards[tab]?.[1] ?? []).map((x) => { const [h, ...rest] = x.split(": "); return rest.length && h!.length < 28 ? <p key={x} style={{ fontWeight: 500 }}><b>{h}:</b> {rest.join(": ")}</p> : <p key={x} style={{ fontWeight: 500 }}>{x}</p>; })}</div>
      </section>
      <div className="th-tally" role="img" aria-label={`${n("keep")} kept, ${n("revise")} revised, ${n("remove")} removed, ${added.length} added`}>
        {TH_CALLS.map(([k, l, c]) => (<span key={k} style={{ background: c, flexGrow: n(k) || 0.4 }}><b>{n(k)}</b> {l.toLowerCase()}</span>))}
        <span style={{ background: "#cde0f2", flexGrow: added.length || 0.4 }}><b>{added.length}</b> added</span>
      </div>
      <div className="th-grid">
        {themes.map(([name, text, krs], i) => (
          <article key={name} className={`th-card ${call[i] ?? ""}`} style={{ animationDelay: `${i * 90}ms` }}>
            <header><span className="po-n">{i + 1}</span><b>{name}</b></header>
            <p>{text}</p>
            <ul>{krs.map((k) => (<li key={k}>{k}</li>))}</ul>
            <div className="po-seg small" role="group" aria-label={`Our call on ${name}`}>
              {TH_CALLS.map(([k, l]) => (<button key={k} disabled={readOnly} aria-pressed={call[i] === k} onClick={() => op({ key: "call", op: "set", value: { ...call, [i]: call[i] === k ? "" : k } })}>{l}</button>))}
            </div>
            {call[i] === "revise" ? <Field k={`rev:${i}`} st={st} op={op} readOnly={readOnly} rows={3} placeholder="The theme as we would revise it" label={`Revision of ${name}`} /> : null}
            {call[i] === "remove" ? <Field k={`why:${i}`} st={st} op={op} readOnly={readOnly} rows={2} placeholder="Why it should go" label={`Why remove ${name}`} /> : null}
          </article>
        ))}
        <article className="th-card new">
          <header><span className="po-n">+</span><b>Should any be added?</b></header>
          {added.map((x) => (
            <div key={x.id} className="po-sticky" style={{ background: "#cde0f2", borderLeftColor: "#2f6fbd" }}>
              <span>{str(x.text)}</span>
              {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: "added", op: "remove", id: x.id })}>×</button> : null}
            </div>
          ))}
          {!readOnly ? <AddLine label="A theme to add" placeholder="+ a strategic theme to add, Enter" onAdd={(text) => op({ key: "added", op: "push", value: { text } })} /> : null}
        </article>
      </div>
      <section className="po-panel">
        <span className="ex-mono">Ask AI to analyze your assessment: its ideas for improvements</span>
        <Field k="ai" st={st} op={op} readOnly={readOnly} rows={4} placeholder="Paste or summarize what the AI suggested, and what you take from it." label="AI ideas for improvements" />
      </section>
    </div>
  );
}

// The Green Compass epic hypothesis statement: the epic as given, and the four parts the class
// brainstorms (business outcomes, leading indicators, MVP features, go / no-go).
export function AsEpicBoard({ config, st, op, readOnly }: BoardProps) {
  const epic = config.epic as { head: [string, string][]; name: string; desc: [string, string][] } | undefined;
  const parts = (config.parts as [string, string, string][] | undefined) ?? [], domains = (config.domains as string[] | undefined) ?? [];
  const ind = list(st, "p:1"), picked = ind.map((x) => str(x.domain)).filter(Boolean);
  return (
    <div className="ex-board po">
      {epic ? (
        <section className="ep-card">
          <div className="ep-head">{epic.head.map(([k, v]) => (<div key={k}><span>{k}</span><b>{v}</b></div>))}</div>
          <div className="ep-body">
            <span className="ep-spine">Epic Hypothesis Statement</span>
            <div>
              <span className="ep-label">Epic Name</span><p className="ep-name">{epic.name}</p>
              <span className="ep-label">Epic Description</span>
              <p className="ep-desc">{epic.desc.map(([k, v]) => (<span key={k}><b>{k}</b> {v} </span>))}</p>
            </div>
          </div>
        </section>
      ) : null}
      <div className="ep-grid">
        {parts.map(([name, hint, tone], pi) => (
          <section key={name} className="po-col" style={{ animationDelay: `${pi * 90}ms` }}>
            <header><span className="po-n" style={{ background: tone }}>{list(st, `p:${pi}`).length}</span><b>{name}</b></header>
            {list(st, `p:${pi}`).map((x) => (
              <div key={x.id} className="po-sticky" style={{ background: "#fff", borderLeftColor: tone, boxShadow: "0 0 0 1.5px #0d181826" }}>
                {pi === 1 && str(x.domain) ? <small style={{ color: DOMAIN_TONE[str(x.domain)] }}>{str(x.domain)}</small> : null}
                <span>{str(x.text)}</span>
                {pi === 1 && !readOnly ? <span className="bl-acts" style={{ marginTop: 4 }}>{domains.map((d) => (<button key={d} aria-pressed={str(x.domain) === d} style={str(x.domain) === d ? { background: DOMAIN_TONE[d], color: "#fff" } : undefined} onClick={() => op({ key: "p:1", op: "update", id: x.id, value: { domain: str(x.domain) === d ? "" : d } })}>{d}</button>))}</span> : null}
                {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: `p:${pi}`, op: "remove", id: x.id })}>×</button> : null}
              </div>
            ))}
            {!readOnly ? <AddLine label={name} placeholder={hint} onAdd={(text) => op({ key: `p:${pi}`, op: "push", value: { text } })} /> : null}
          </section>
        ))}
      </div>
      <DomainBalance domains={domains} picked={picked} />
      <div className="po-two wide">
        <section className="po-panel">
          <span className="ex-mono">Use AI: the experiment to start with to test the MVP</span>
          <Field k="experiment" st={st} op={op} readOnly={readOnly} rows={3} placeholder="The first experiment, and what it would tell us" label="The experiment to start with" />
        </section>
        <section className="po-panel">
          <span className="ex-mono">Is a complementary metric needed?</span>
          <Field k="complement" st={st} op={op} readOnly={readOnly} rows={3} placeholder="Do the leading indicators give a balanced set for the MVP? If not, the metric we would add." label="Complementary metric" />
        </section>
      </div>
    </div>
  );
}

// Portfolio role-play practice: two scenarios, each with its three characters. People volunteer for
// a role, the class notes each character's problems, feelings and goals, then gives feedback.
const RP_ASPECTS = ["Problems", "Feelings", "Goals"];
export function AsRoleplayBoard({ config, st, op, readOnly }: BoardProps) {
  const scenarios = (config.scenarios as { title: string; text: string[]; roles: [string, string][] }[] | undefined) ?? [];
  const [si, setSi] = useState(0);
  const [ri, setRi] = useState(0);
  const sc = scenarios[si], role = sc?.roles[ri];
  const [aspect, setAspect] = useState(0);
  const tones = ["#f6c28b", "#c9b6ec", "#8accce"];
  if (!sc || !role) return null;
  const notes = list(st, `n:${si}:${ri}`);
  return (
    <div className="ex-board po">
      <div className="po-seg" role="tablist" aria-label="Scenario">{scenarios.map((x, i) => (<button key={x.title} role="tab" aria-selected={i === si} aria-pressed={i === si} onClick={() => (setSi(i), setRi(0))}>Scenario #{i + 1} · {x.title}</button>))}</div>
      <section className="po-panel as-case" key={si}>{sc.text.map((x) => (<p key={x} style={{ fontWeight: 500 }}>{x}</p>))}</section>
      <div className="rp-cast">
        {sc.roles.map(([name], i) => {
          const who = str(st[`who:${si}:${i}`]);
          return (
            <button key={name} className={`rp-role${i === ri ? " on" : ""}`} style={{ ["--c" as string]: tones[i % 3] }} aria-pressed={i === ri} onClick={() => setRi(i)}>
              <span className="rp-face" aria-hidden>{who ? who.slice(0, 1).toUpperCase() : "?"}</span>
              <b>{name}</b>
              <small>{who ? `Played by ${who}` : "No volunteer yet"} · {list(st, `n:${si}:${i}`).length} notes</small>
            </button>
          );
        })}
      </div>
      <div className="po-two wide" key={`${si}-${ri}`}>
        <section className="po-panel" style={{ borderTop: `8px solid ${tones[ri % 3]}` }}>
          <b className="as-verdict">{role[0]}</b>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.45 }}>{role[1]}</p>
          <label className="po-heading"><span className="ex-mono">Volunteer to take on this role</span><Field k={`who:${si}:${ri}`} st={st} op={op} readOnly={readOnly} rows={1} placeholder="Name of the volunteer" label={`Volunteer for ${role[0]}`} /></label>
        </section>
        <section className="po-panel">
          <span className="ex-mono">This character&apos;s perspective</span>
          {RP_ASPECTS.map((a, ai) => (
            <div key={a} className="rp-aspect">
              <b>{a}</b>
              {notes.filter((n) => num(n.aspect) === ai).map((n) => (
                <div key={n.id} className="po-sticky" style={{ background: "#fff", borderLeftColor: tones[ri % 3], boxShadow: "0 0 0 1.5px #0d181826" }}>
                  <span>{str(n.text)}</span>
                  {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: `n:${si}:${ri}`, op: "remove", id: n.id })}>×</button> : null}
                </div>
              ))}
            </div>
          ))}
          {!readOnly ? (
            <>
              <div className="po-seg small" role="group" aria-label="This note is about their">{RP_ASPECTS.map((a, ai) => (<button key={a} aria-pressed={aspect === ai} onClick={() => setAspect(ai)}>{a}</button>))}</div>
              <AddLine label={`${RP_ASPECTS[aspect]} of ${role[0]}`} placeholder={`+ their ${RP_ASPECTS[aspect]!.toLowerCase()}, Enter`} onAdd={(text) => op({ key: `n:${si}:${ri}`, op: "push", value: { aspect, text } })} />
            </>
          ) : null}
        </section>
      </div>
      <section className="po-panel">
        <span className="ex-mono">Feedback for the debrief of this scenario</span>
        {list(st, `fb:${si}`).map((n) => (
          <div key={n.id} className="po-sticky" style={{ background: "#cde0f2", borderLeftColor: "#2f6fbd" }}>
            <span>{str(n.text)}</span>
            {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: `fb:${si}`, op: "remove", id: n.id })}>×</button> : null}
          </div>
        ))}
        {!readOnly ? <AddLine label="Feedback" placeholder="+ feedback for the players, Enter" onAdd={(text) => op({ key: `fb:${si}`, op: "push", value: { text } })} /> : null}
      </section>
    </div>
  );
}

// Portfolio mix and match: seven scenarios, seven portfolio types. Pick a type, then click the
// scenarios it fits (or pick on the scenario itself); each match takes a short rationale.
const MX_TONES = ["#2f6fbd", "#2e8b57", "#8c6bc8", "#1f8a9e", "#c2412d", "#d98a1c", "#777"];
export function AsMixBoard({ config, st, op, readOnly }: BoardProps) {
  const types = (config.types as [string, string][] | undefined) ?? [], scenarios = (config.scenarios as string[] | undefined) ?? [];
  const match = (st.match && typeof st.match === "object" ? st.match : {}) as Record<string, number | null>;
  const [brush, setBrush] = useState<number | null>(null);
  const setM = (i: number, t: number | null) => op({ key: "match", op: "set", value: { ...match, [i]: t } });
  const of = (i: number) => (typeof match[i] === "number" ? (match[i] as number) : null);
  const done = scenarios.filter((_, i) => of(i) !== null).length, C = 2 * Math.PI * 26;
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
      <section className="po-panel">
        <div className="mx-top">
          <span className="po-ring" style={{ width: 68, height: 68 }}>
            <svg width="68" height="68" viewBox="0 0 68 68" role="img" aria-label={`${done} of ${scenarios.length} scenarios matched`}><circle cx="34" cy="34" r="26" fill="none" stroke="#0d181822" strokeWidth="7" /><circle className="po-ring-v" cx="34" cy="34" r="26" fill="none" stroke={done === scenarios.length ? "#2e8b57" : "#d98a1c"} strokeWidth="7" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - done / Math.max(1, scenarios.length))} transform="rotate(-90 34 34)" /></svg>
            <b style={{ fontSize: 15 }}>{done}/{scenarios.length}</b>
          </span>
          <div><span className="ex-mono">Portfolio options</span><p className="po-note">{readOnly ? "" : brush === null ? "Pick a portfolio type, then click every scenario it fits. A type can be used more than once." : `Now click the scenarios that fit “${types[brush]![0]}”. Click the type again when you are done.`}</p></div>
        </div>
        <div className="mx-types" role="group" aria-label="Portfolio options">
          {types.map(([name, icon], t) => {
            const n = scenarios.filter((_, i) => of(i) === t).length;
            return (
              <button key={name} className={`mx-type${brush === t ? " on" : ""}`} style={{ ["--c" as string]: MX_TONES[t % MX_TONES.length] }} disabled={readOnly} aria-pressed={brush === t} onClick={() => setBrush(brush === t ? null : t)}>
                <span aria-hidden>{icon}</span><b>{name}</b>{n ? <i>{n}</i> : null}
              </button>
            );
          })}
        </div>
      </section>
      <div className="mx-list">
        {scenarios.map((text, i) => {
          const t = of(i);
          return (
            <article key={i} className={`mx-row${t !== null ? " set" : ""}${brush !== null ? " aim" : ""}`} style={{ ["--c" as string]: t !== null ? MX_TONES[t % MX_TONES.length] : "#0d181855", animationDelay: `${i * 60}ms` }} onClick={() => brush !== null && !readOnly && setM(i, t === brush ? null : brush)}>
              <span className="po-n">{i + 1}</span>
              <p>{text}</p>
              <div className="mx-pick" onClick={(e) => e.stopPropagation()}>
                {t !== null ? <b className="mx-chip">{types[t]![1]} {types[t]![0]}</b> : null}
                <select value={t ?? ""} disabled={readOnly} aria-label={`Portfolio type for scenario ${i + 1}`} onChange={(e) => setM(i, e.target.value === "" ? null : Number(e.target.value))}>
                  <option value="">{t === null ? "Choose the portfolio type…" : "Change…"}</option>
                  {types.map(([n], k) => (<option key={n} value={k}>{n}</option>))}
                </select>
              </div>
              <div className="mx-why" onClick={(e) => e.stopPropagation()}>
                <Field k={`why:${i}`} st={st} op={op} readOnly={readOnly} rows={2} placeholder={t !== null && types[t]![0] === "Other" ? "Which other structure, and why" : "Rationale: why this portfolio type suits this situation"} label={`Rationale for scenario ${i + 1}`} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// Testing with guardrails: a proposal, three use cases, and the four guardrails. For each use case
// the class tests the proposal against each guardrail, votes yes or no, and gives its reasons.
export function AsGuardrailBoard({ config, st, op, readOnly }: BoardProps) {
  const cases = (config.cases as string[] | undefined) ?? [], rails = (config.guardrails as [string, string][] | undefined) ?? [];
  const votes = list(st, "votes"), test = (st.test && typeof st.test === "object" ? st.test : {}) as Record<string, string>;
  return (
    <div className="ex-board po">
      <div className="po-scenario"><span className="ex-mono">Proposal</span><p>{str(config.proposal)}</p></div>
      <section className="po-panel">
        <span className="ex-mono">Customize… the four guardrails</span>
        <div className="gr-rails">
          {rails.map(([yes, no]) => (<div key={yes} className="gr-rail"><b>✓ {yes}</b><i>rather than</i><span>⊘ {no}</span></div>))}
        </div>
      </section>
      <div className="po-cols" style={{ ["--n" as string]: cases.length }}>
        {cases.map((text, ci) => {
          const y = votes.filter((v) => num(v.c) === ci && v.v === "y").length, n = votes.filter((v) => num(v.c) === ci && v.v === "n").length, t = y + n;
          const pass = rails.filter((_, ri) => test[`${ci}:${ri}`] === "y").length, fail = rails.filter((_, ri) => test[`${ci}:${ri}`] === "n").length;
          return (
            <section key={ci} className="po-col gr-case" style={{ animationDelay: `${ci * 110}ms` }}>
              <header><span className="po-n">{ci + 1}</span><b>Use Case #{ci + 1}</b></header>
              <p className="gr-text">{text}</p>
              <span className="ex-mono">Guardrail test · {pass} pass, {fail} fail</span>
              {rails.map(([yes, no], ri) => {
                const v = test[`${ci}:${ri}`];
                return (
                  <div key={yes} className={`gr-test ${v ?? ""}`}>
                    <span>{v === "n" ? no : yes}</span>
                    <span className="bl-acts">
                      {(["y", "n"] as const).map((k) => (<button key={k} disabled={readOnly} aria-pressed={v === k} aria-label={`${yes}: ${k === "y" ? "passes" : "fails"}`} onClick={() => op({ key: "test", op: "set", value: { ...test, [`${ci}:${ri}`]: v === k ? "" : k } })}>{k === "y" ? "✓" : "⊘"}</button>))}
                    </span>
                  </div>
                );
              })}
              <span className="ex-mono">Vote · {t} {t === 1 ? "vote" : "votes"}</span>
              <div className="gr-bar" role="img" aria-label={`${y} yes, ${n} no`}><i style={{ width: `${t ? (y / t) * 100 : 50}%`, opacity: t ? 1 : 0.25 }} /></div>
              {!readOnly ? (
                <div className="gr-vote">
                  <button className="po-btn" style={{ background: "#cfe8d4" }} onClick={() => op({ key: "votes", op: "push", value: { c: ci, v: "y" } })}>Yes · {y}</button>
                  <button className="po-btn" style={{ background: "#f9d9d2" }} onClick={() => op({ key: "votes", op: "push", value: { c: ci, v: "n" } })}>No · {n}</button>
                  {t ? <button className="po-reset" style={{ marginLeft: 0 }} onClick={() => votes.filter((v) => num(v.c) === ci).forEach((v) => op({ key: "votes", op: "remove", id: v.id }))}>Clear</button> : null}
                </div>
              ) : <p className="po-note">{y} yes · {n} no</p>}
              <span className="ex-mono">The reason for our vote</span>
              {list(st, `why:${ci}`).map((x) => (
                <div key={x.id} className="po-sticky" style={{ background: "#fff", borderLeftColor: "#3f7c80", boxShadow: "0 0 0 1.5px #0d181826" }}>
                  <span>{str(x.text)}</span>
                  {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: `why:${ci}`, op: "remove", id: x.id })}>×</button> : null}
                </div>
              ))}
              {!readOnly ? <AddLine label={`Reason for use case ${ci + 1}`} placeholder="+ a reason, Enter" onAdd={(text2) => op({ key: `why:${ci}`, op: "push", value: { text: text2 } })} /> : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// A customization tested guardrail by guardrail: each row carries the guardrail's powerful question,
// what the group adds per column, and (when asked) whether the guardrail is satisfied.
export function AsGuardQuestionsBoard({ config, st, op, readOnly }: BoardProps) {
  const rails = (config.guardrails as [string, string][] | undefined) ?? [], cols = (config.cols as string[] | undefined) ?? [], more = (config.more as string[] | undefined) ?? [];
  const cards = (config.scenario as [string, string[]][] | undefined) ?? [], ok = (st.ok && typeof st.ok === "object" ? st.ok : {}) as Record<string, string>;
  const [tab, setTab] = useState(0);
  const yes = rails.filter((_, i) => ok[i] === "y").length, no = rails.filter((_, i) => ok[i] === "n").length;
  const Notes = ({ k, hint, bg }: { k: string; hint: string; bg: string }) => (
    <>
      {list(st, k).map((x) => (
        <div key={x.id} className="po-sticky" style={{ background: bg, borderLeftColor: "#3f7c80" }}>
          <span>{str(x.text)}</span>
          {!readOnly ? <button className="ex-x" aria-label="Remove" onClick={() => op({ key: k, op: "remove", id: x.id })}>×</button> : null}
        </div>
      ))}
      {!readOnly ? <AddLine label={hint} placeholder={`+ ${hint.toLowerCase()}, Enter`} onAdd={(text) => op({ key: k, op: "push", value: { text } })} /> : null}
    </>
  );
  return (
    <div className="ex-board po">
      {cards.length > 1 ? (
        <section className="po-panel">
          <div className="po-seg" role="tablist" aria-label="Scenario">{cards.map(([t], i) => (<button key={t} role="tab" aria-selected={i === tab} aria-pressed={i === tab} onClick={() => setTab(i)}>{t}</button>))}</div>
          <div className="as-case" key={tab}>{(cards[tab]?.[1] ?? []).map((x) => (<p key={x} style={{ fontWeight: 500 }}>{x}</p>))}</div>
        </section>
      ) : cards[0] ? (
        <div className="po-scenario"><span className="ex-mono">{cards[0][0]}</span>{cards[0][1].map((x) => (<p key={x}>{x}</p>))}</div>
      ) : null}
      {config.verdict ? (
        <div className="th-tally" role="img" aria-label={`${yes} guardrails satisfied, ${no} not, ${rails.length - yes - no} to decide`}>
          <span style={{ background: "#cfe8d4", flexGrow: yes || 0.4 }}><b>{yes}</b> satisfied</span>
          <span style={{ background: "#f9d9d2", flexGrow: no || 0.4 }}><b>{no}</b> not satisfied</span>
          <span style={{ background: "#fff", flexGrow: rails.length - yes - no || 0.4 }}><b>{rails.length - yes - no}</b> to decide</span>
        </div>
      ) : null}
      <div className="gq-rows">
        {rails.map(([name, question], ri) => (
          <section key={name} className={`gq-row ${ok[ri] ?? ""}`} style={{ animationDelay: `${ri * 90}ms` }}>
            <header>
              <b>{name}</b>
              <p>{question}</p>
              {config.verdict ? (
                <div className="po-seg small" role="group" aria-label={`Is “${name}” satisfied?`}>
                  {([["y", "Satisfied"], ["n", "Not satisfied"]] as const).map(([k, l]) => (<button key={k} disabled={readOnly} aria-pressed={ok[ri] === k} onClick={() => op({ key: "ok", op: "set", value: { ...ok, [ri]: ok[ri] === k ? "" : k } })}>{l}</button>))}
                </div>
              ) : null}
            </header>
            {cols.map((c, ci) => (<div key={c} className="gq-cell"><span className="ex-mono">{c}</span><Notes k={`g:${ri}:${ci}`} hint={c} bg={ci ? "#cfe8d4" : "#cde0f2"} /></div>))}
          </section>
        ))}
      </div>
      {more.length ? (
        <div className="po-cols" style={{ ["--n" as string]: more.length }}>
          {more.map((q, qi) => (<section key={q} className="po-col"><header><span className="po-n">{qi + 1}</span><b>{q}</b></header><Notes k={`m:${qi}`} hint="Add" bg="#ffe9b8" /></section>))}
        </div>
      ) : null}
    </div>
  );
}

// The SAFe Customization Blueprint: one blueprint the group fills column by column over several
// steps. A card per customization: the need, the aspect of SAFe, the proposed change, its validation
// against the four guardrails, and the benefit. The step's columns are in full colour.
const BP_ASPECTS = [["People", "#8c6bc8"], ["Work", "#2f6fbd"], ["Activities", "#d98a1c"]] as const;
const BP_STEPS: Record<string, string[]> = { need: ["need", "aspect"], change: ["change"], validate: ["valid"], benefit: ["benefit"], all: ["need", "aspect", "change", "valid", "benefit"] };
export function AsBlueprintBoard({ config, st, op, readOnly }: BoardProps) {
  const rows = list(st, "rows"), step = str(config.step) || "all", on = (c: string) => (BP_STEPS[step] ?? BP_STEPS.all!).includes(c);
  const rails = (config.guardrails as [string, string][] | undefined) ?? [], cards = (config.scenario as string[] | undefined) ?? [], example = config.example as Record<string, unknown>[] | undefined;
  const set = (id: string, value: Record<string, unknown>) => op({ key: "rows", op: "update", id, value });
  const aspects = (config.aspects as Record<string, Record<string, string[]>> | undefined) ?? {};
  const gOf = (r: Row) => (r.g && typeof r.g === "object" ? r.g : {}) as Record<string, string>;
  const passes = (r: Row) => rails.length > 0 && rails.every((_, i) => gOf(r)[i] === "y"), fails = (r: Row) => rails.some((_, i) => gOf(r)[i] === "n");
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
      {cards.length ? (
        <details className="po-material" open={step === "need"}>
          <summary>CARS scenario: Customizing SAFe</summary>
          {cards.map((x) => (<p key={x} style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.45 }}>{x}</p>))}
        </details>
      ) : null}
      <div className="cv-top">
        <ol className="po-steps" aria-label="Columns of the blueprint">
          {([["need", "Need and aspect"], ["change", "Proposed change"], ["validate", "Validation"], ["benefit", "Benefit"]] as const).map(([k, l]) => (<li key={k} className={k === step ? "on" : ""}>{l}</li>))}
        </ol>
        <div className="bp-cover" role="img" aria-label={BP_ASPECTS.map(([n]) => `${n}: ${rows.filter((r) => str(r.aspect) === n).length}`).join(", ")}>
          {BP_ASPECTS.map(([n, c]) => { const k = rows.filter((r) => str(r.aspect) === n).length; return <span key={n} style={{ background: k ? c : "#fff", color: k ? "#fff" : "#0d1815", borderColor: c }}>{n} · {k}</span>; })}
        </div>
        {!readOnly ? (
          <span style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {example && !rows.length ? <button className="po-reset" style={{ marginLeft: 0 }} onClick={() => op({ key: "rows", op: "set", value: example })}>Load the slide&apos;s examples</button> : null}
            {rows.length ? <button className="po-reset" style={{ marginLeft: 0 }} onClick={() => window.confirm("Clear the whole blueprint?") && op({ key: "rows", op: "set", value: null })}>Clear</button> : null}
          </span>
        ) : null}
      </div>
      <div className="bp-list">
        {rows.map((r, i) => {
          const tone = BP_ASPECTS.find(([n]) => n === str(r.aspect))?.[1] ?? "#0d181855", g = gOf(r);
          return (
            <article key={r.id} className={`bp-row${passes(r) ? " pass" : fails(r) ? " fail" : ""}`} style={{ ["--c" as string]: tone, animationDelay: `${Math.min(i, 6) * 70}ms` }}>
              <div className={`bp-cell cv-part${on("need") ? " focus" : ""}`}>
                <span className="bp-h">Need</span>
                <CellText row={r} k="need" hint="What is the problem or opportunity that needs addressing?" op={op} readOnly={readOnly} listKey="rows" />
              </div>
              <div className={`bp-cell cv-part${on("aspect") ? " focus" : ""}`}>
                <span className="bp-h">Customized aspect</span>
                <div className="as-domains" style={{ flexDirection: "row", flexWrap: "wrap" }} role="group" aria-label="Aspect of SAFe">
                  {BP_ASPECTS.map(([n, c]) => (<button key={n} disabled={readOnly} aria-pressed={str(r.aspect) === n} style={{ ["--c" as string]: c }} onClick={() => set(r.id, { aspect: str(r.aspect) === n ? "" : n })}>{n}</button>))}
                </div>
                {aspects[str(r.aspect)] ? (
                  <select className="bp-kind" value={str(r.detail)} disabled={readOnly} aria-label="Which aspect exactly" onChange={(e) => set(r.id, { detail: e.target.value })}>
                    <option value="">Which {str(r.aspect).toLowerCase()} aspect…</option>
                    {str(r.detail) && !Object.entries(aspects[str(r.aspect)]!).some(([k, v]) => k === str(r.detail) || v.some((x) => `${k}: ${x}` === str(r.detail))) ? <option>{str(r.detail)}</option> : null}
                    {Object.entries(aspects[str(r.aspect)]!).map(([kind, items]) => (
                      <optgroup key={kind} label={kind}>
                        <option value={kind}>{kind} (any, or a new one)</option>
                        {items.map((x) => (<option key={x} value={`${kind}: ${x}`}>{x}</option>))}
                      </optgroup>
                    ))}
                  </select>
                ) : (
                  <CellText row={r} k="detail" hint="Which aspect exactly? e.g. Work Artifact" op={op} readOnly={readOnly} listKey="rows" />
                )}
              </div>
              <div className={`bp-cell cv-part${on("change") ? " focus" : ""}`}>
                <span className="bp-h">Proposed change</span>
                <CellText row={r} k="change" hint="What are the details of the change being proposed?" op={op} readOnly={readOnly} listKey="rows" />
              </div>
              <div className={`bp-cell wide cv-part${on("valid") ? " focus" : ""}`}>
                <span className="bp-h">Validation (guardrails) {passes(r) ? <em className="ok">passes all four</em> : fails(r) ? <em className="no">does not pass</em> : null}</span>
                <div className="bp-rails">
                  {rails.map(([yes, no], gi) => (
                    <button key={yes} className={g[gi] ?? ""} disabled={readOnly} title={`${yes}, rather than: ${no}`} aria-label={`${yes}: ${g[gi] === "y" ? "passes" : g[gi] === "n" ? "fails" : "not tested"}. Click to change.`} onClick={() => set(r.id, { g: { ...g, [gi]: g[gi] === "y" ? "n" : g[gi] === "n" ? "" : "y" } })}>
                      <i>{g[gi] === "y" ? "✓" : g[gi] === "n" ? "⊘" : gi + 1}</i>{g[gi] === "n" ? no : yes}
                    </button>
                  ))}
                </div>
                <CellText row={r} k="why" hint="Why, or why not?" op={op} readOnly={readOnly} listKey="rows" />
                {fails(r) ? <CellText row={r} k="adjust" hint="An adjustment to the proposed change that would let it pass" op={op} readOnly={readOnly} listKey="rows" /> : null}
              </div>
              <div className={`bp-cell cv-part${on("benefit") ? " focus" : ""}`}>
                <span className="bp-h">Benefit</span>
                <CellText row={r} k="benefit" hint="What does success look like, and how do we measure it?" op={op} readOnly={readOnly} listKey="rows" />
              </div>
              {!readOnly ? <button className="ex-x" aria-label="Remove this customization" onClick={() => op({ key: "rows", op: "remove", id: r.id })}>×</button> : null}
            </article>
          );
        })}
        {!readOnly ? <button className="cv2-add" onClick={() => op({ key: "rows", op: "push", value: {} })}>+ a need (a row of the blueprint)</button> : null}
        {!rows.length && readOnly ? <p className="po-empty">The blueprint is empty.</p> : null}
      </div>
      {step === "need" && rows.length ? <p className="po-note">{BP_ASPECTS.filter(([n]) => !rows.some((r) => str(r.aspect) === n)).length ? `Be sure to have at least one row each for People, Work, and Activities. Still missing: ${BP_ASPECTS.filter(([n]) => !rows.some((r) => str(r.aspect) === n)).map(([n]) => n).join(", ")}.` : "You have at least one row each for People, Work, and Activities."}</p> : null}
      {step === "validate" ? <p className="po-note">Click a guardrail to mark it as passed (✓), click again for not passed (⊘), a third time to clear. A row passes when all four are ✓.</p> : null}
    </div>
  );
}

// The Learning Lab: four challenges a team solves in the order it chooses. The team sets its order,
// each round names a facilitator, and each challenge has its problem, its input data and its
// question prompts (assess, remedy, solve). The same board serves all four rounds.
const LAB_PHASES = [
  ["Assess the challenge", "#2f6fbd", "Answer the following questions in the space provided."],
  ["Remedy the problem", "#d98a1c", "Write your recommendations in the space provided."],
  ["Solve the challenge", "#2e8b57", "Record your work in the space provided."],
] as const;
export function AsLabBoard({ config, st, op, readOnly }: BoardProps) {
  const labs = (config.challenges as LabChallenge[] | undefined) ?? [], round = typeof config.round === "number" ? config.round : 0;
  const order = (Array.isArray(st.order) ? (st.order as string[]) : []).filter((id) => labs.some((c) => c.id === id));
  const planned = labs.find((c) => c.id === order[round]);
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<"problem" | "data" | 0 | 1 | 2>("problem");
  const cur = labs.find((c) => c.id === open) ?? planned ?? null;
  const answered = (c: LabChallenge) => c.prompts.filter((_, i) => str(st[`a:${c.id}:${i}`])).length;
  const place = (id: string) => op({ key: "order", op: "set", value: order.includes(id) ? order.filter((x) => x !== id) : [...order, id] });
  const example = config.canvas as Record<string, unknown> | undefined;
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
      <section className="po-panel">
        <span className="ex-mono">Your team&apos;s order · click the challenges in the order you will solve them</span>
        <div className="lab-order">
          {labs.map((c) => {
            const at = order.indexOf(c.id), n = answered(c);
            return (
              <div key={c.id} className={`lab-card${at === round ? " now" : ""}${cur?.id === c.id ? " open" : ""}${n === c.prompts.length ? " done" : ""}`}>
                <button className="lab-pos" disabled={readOnly} aria-label={at >= 0 ? `${c.title}: number ${at + 1}. Click to take it out of the order.` : `${c.title}: add to the order`} onClick={() => place(c.id)}>{at >= 0 ? at + 1 : "+"}</button>
                <button className="lab-name" onClick={() => (setOpen(c.id), setTab("problem"))}>
                  <b>{c.title}</b>
                  <small>{at === round ? "This round" : at >= 0 ? `Round ${at + 1}` : "Not placed"} · {n}/{c.prompts.length} prompts answered</small>
                  <i className="lab-bar"><i style={{ width: `${(n / c.prompts.length) * 100}%` }} /></i>
                </button>
              </div>
            );
          })}
        </div>
      </section>
      {cur ? (
        <section className="po-panel" key={cur.id}>
          <div className="rd-advhead" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div><span className="ex-mono">Challenge{order.indexOf(cur.id) >= 0 ? ` · round ${order.indexOf(cur.id) + 1}` : ""}</span><b className="as-verdict" style={{ display: "block" }}>{cur.title}</b></div>
            <label className="po-heading" style={{ minWidth: 220 }}><span className="ex-mono">Team facilitator for this challenge</span><Field k={`fac:${cur.id}`} st={st} op={op} readOnly={readOnly} rows={1} placeholder="Name" label="Team facilitator" /></label>
          </div>
          <div className="lab-tabs" role="tablist" aria-label="Parts of the challenge">
            {([["problem", "The problem"], ["data", "Input data"]] as const).map(([k, l]) => (<button key={k} role="tab" className="lab-tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>))}
            <span className="lab-arrow" aria-hidden>→</span>
            {LAB_PHASES.map(([name, tone], pi) => {
              const mine = cur.prompts.map(([ph], i) => [ph, i] as const).filter(([ph]) => ph === name), n = mine.filter(([, i]) => str(st[`a:${cur.id}:${i}`])).length;
              return (
                <button key={name} role="tab" className={`lab-tab phase${n === mine.length ? " done" : ""}`} style={{ ["--c" as string]: tone }} aria-selected={tab === pi} onClick={() => setTab(pi as 0 | 1 | 2)}>
                  <i>{n === mine.length ? "✓" : pi + 1}</i><span><b>{name}</b><small>{n}/{mine.length} answered</small></span>
                </button>
              );
            })}
          </div>
          {tab === "problem" ? <div className="as-case" key="p">{cur.problem.map((x) => (<p key={x} style={{ fontWeight: 500 }}>{x}</p>))}<p className="lab-task">{cur.task}</p></div> : null}
          {tab === "data" ? (
            <div className="lab-data" key="d">
              {cur.inputs.map((inp, i) => inp.kind === "text" ? <p key={i}>{inp.text}</p> : inp.kind === "list" ? (
                <div key={i}><b>{inp.title}</b><ul>{inp.items.map((x) => (<li key={x}>{x}</li>))}</ul></div>
              ) : inp.kind === "table" ? (
                <div key={i}><b>{inp.title}</b><div className="as-tablewrap"><table className="rf-table"><thead><tr>{inp.cols.map((c) => (<th key={c} scope="col">{c}</th>))}</tr></thead><tbody>{inp.rows.map((r, ri) => (<tr key={ri}>{r.map((c, ci) => (ci ? <td key={ci}>{c}</td> : <th key={ci} scope="row">{c}</th>))}</tr>))}</tbody></table></div></div>
              ) : example ? (
                <div key={i}><b>{inp.title}</b><AsCanvasBoard board={undefined as never} frame={undefined as never} trainer={false} config={{ focus: "all", questions: config.questions, prompt: "The canvas as CARS filled it in." }} st={example} op={() => undefined} readOnly /></div>
              ) : null)}
            </div>
          ) : null}
          {typeof tab === "number" ? (
            <div className="lab-work" key={tab} style={{ ["--c" as string]: LAB_PHASES[tab][1] }}>
              <header className="lab-phasehead"><i>{tab + 1}</i><div><b>{LAB_PHASES[tab][0]}:</b><span>{LAB_PHASES[tab][2]}</span></div></header>
              {cur.prompts.map(([phase, q], i) => phase !== LAB_PHASES[tab][0] ? null : (
                <label key={i} className="lab-prompt">
                  <b>{q}</b>
                  <Field k={`a:${cur.id}:${i}`} st={st} op={op} readOnly={readOnly} rows={6} placeholder="Our answer" label={q} />
                </label>
              ))}
              <div className="po-acts-row">
                <button className="po-btn plain" onClick={() => setTab(tab === 0 ? "data" : ((tab - 1) as 0 | 1))}>← {tab === 0 ? "Input data" : LAB_PHASES[tab - 1]![0]}</button>
                {tab < 2 ? <button className="po-btn" onClick={() => setTab((tab + 1) as 1 | 2)}>{LAB_PHASES[tab + 1]![0]} →</button> : null}
              </div>
              {answered(cur) === cur.prompts.length ? <p className="rd-ok" style={{ margin: 0 }}>Congratulations on completing this challenge!</p> : null}
            </div>
          ) : null}
        </section>
      ) : (
        <p className="po-empty">{order.length ? `Round ${round + 1} has no challenge yet: add one to your order above, or open any challenge by its name.` : "Decide your order first: click + on the challenge you will solve first."}</p>
      )}
    </div>
  );
}

// Hexagon diagram (hexagonal thinking): one idea per hexagon, placed on a honeycomb. Two hexagons
// whose sides touch are connected, and the team writes why for the connections that matter. The
// team arranges and rearranges until the diagram says what it means, then calls it final.
const HX_TONES = ["#06384a", "#0b7f9b", "#8accce", "#f7f1e3", "#f5b84c", "#a52412", "#1b6338"];
const HX_LIGHT = new Set(["#8accce", "#f7f1e3", "#f5b84c"]);
const HX_COLS = 7, HX_ROWS = 5;
const hxAt = (c: number, r: number) => ({ left: `${((c + 0.5 + (r % 2 ? 0.5 : 0)) / (HX_COLS + 0.5)) * 100}%`, top: `${((r * 0.75 + 0.5) / (HX_ROWS * 0.75 + 0.25)) * 100}%` });
const hxNear = (c: number, r: number) => { const o = r % 2 ? 0 : -1; return [[c - 1, r], [c + 1, r], [c + o, r - 1], [c + o + 1, r - 1], [c + o, r + 1], [c + o + 1, r + 1]] as [number, number][]; };
export function AsHexBoard({ config, st, op, readOnly }: BoardProps) {
  const hexes = list(st, "hexes"), final = st.final === true, lock = readOnly || final;
  const placed = hexes.filter((h) => typeof h.c === "number" && typeof h.r === "number"), tray = hexes.filter((h) => !placed.includes(h));
  const at = (c: number, r: number) => placed.find((h) => h.c === c && h.r === r);
  const [sel, setSel] = useState<string | null>(null);
  const [edge, setEdge] = useState<string | null>(null);
  const cur = hexes.find((h) => h.id === sel) ?? null;
  const name = (h: Row) => str(h.text) || "…";
  const tone = (h: Row) => (HX_TONES.includes(str(h.tone)) ? str(h.tone) : HX_TONES[0]!);
  const edges = placed.flatMap((h) => hxNear(num(h.c), num(h.r)).map(([c, r]) => at(c, r)).filter((g): g is Row => !!g && h.id < g.id).map((g) => ({ key: `why:${h.id}|${g.id}`, a: h, b: g })));
  const told = edges.filter((e) => str(st[e.key]));
  const touch = (h: Row) => edges.filter((e) => e.a === h || e.b === h).length;
  const hub = placed.length ? [...placed].sort((x, y) => touch(y) - touch(x))[0]! : null;
  const alone = placed.filter((h) => !touch(h));
  const move = (id: string, c: number, r: number) => {
    const there = at(c, r), me = hexes.find((h) => h.id === id);
    if (!me || lock || there === me) return;
    if (there) op({ key: "hexes", op: "update", id: there.id, value: { c: typeof me.c === "number" ? me.c : null, r: typeof me.r === "number" ? me.r : null } });
    op({ key: "hexes", op: "update", id, value: { c, r } });
  };
  const cell = (c: number, r: number) => (lock ? undefined : sel && cur ? (move(sel, c, r), setSel(null)) : op({ key: "hexes", op: "push", value: { text: "", tone: HX_TONES[hexes.length % HX_TONES.length], c, r } }));
  const example = (config.example as string[] | undefined) ?? [], steps = (config.steps as string[] | undefined) ?? [];
  const stage = final ? 2 : placed.length >= 2 ? 1 : 0;
  const pick = (h: Row) => (setEdge(null), !lock && sel && sel !== h.id && typeof h.c === "number" ? (move(sel, num(h.c), num(h.r)), setSel(null)) : setSel(sel === h.id ? null : h.id));
  const hexStyle = (h: Row) => ({ ["--c" as string]: tone(h), color: HX_LIGHT.has(tone(h)) ? "#0d1815" : "#fff" });
  const open = edges.find((e) => e.key === edge) ?? null;
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
      <ol className="hx-steps" aria-label="Steps">
        {steps.map((s, i) => (<li key={s} className={i === stage ? "on" : i < stage ? "past" : ""}><i>{i < stage ? "✓" : i + 1}</i>{s}</li>))}
      </ol>
      {!lock ? (
        <section className="po-panel hx-tray">
          <span className="ex-mono">Hexagons waiting · {tray.length ? "click one, then click a place on the honeycomb (or drag it there)" : "every hexagon is on the honeycomb"}</span>
          <div className="hx-chips">
            {tray.map((h) => (
              <button key={h.id} className={`hx-chip${sel === h.id ? " sel" : ""}`} style={hexStyle(h)} draggable onDragStart={(e) => (e.dataTransfer.setData("text/plain", h.id), setSel(h.id))} onClick={() => pick(h)}><span>{name(h)}</span></button>
            ))}
            <button className="hx-chip add" onClick={() => op({ key: "hexes", op: "push", value: { text: "", tone: HX_TONES[hexes.length % HX_TONES.length] } })}><span>+ blank</span></button>
          </div>
          {!hexes.length && example.length ? <button className="po-btn plain" onClick={() => example.forEach((text, i) => op({ key: "hexes", op: "push", value: { text, tone: HX_TONES[i % HX_TONES.length] } }))}>{str(config.exampleLabel) || "Load the example"}</button> : null}
        </section>
      ) : null}
      <div className="hx-wrap">
        <div className={`hx-grid${final ? " final" : ""}${sel ? " picking" : ""}`}>
          {!lock ? Array.from({ length: HX_ROWS * HX_COLS }, (_, i) => [i % HX_COLS, Math.floor(i / HX_COLS)] as const).filter(([c, r]) => !at(c, r)).map(([c, r]) => (
            <button key={`${c}:${r}`} className="hx-cell" style={hxAt(c, r)} aria-label={sel ? `Place it in row ${r + 1}, position ${c + 1}` : `New hexagon in row ${r + 1}, position ${c + 1}`} onClick={() => cell(c, r)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => (e.preventDefault(), move(e.dataTransfer.getData("text/plain"), c, r), setSel(null))}><span>+</span></button>
          )) : null}
          {placed.map((h) => (
            <button key={h.id} className={`hx-hex${sel === h.id ? " sel" : ""}${open && (open.a === h || open.b === h) ? " linked" : ""}`} style={{ ...hxAt(num(h.c), num(h.r)), ...hexStyle(h) }} draggable={!lock} onDragStart={(e) => (e.dataTransfer.setData("text/plain", h.id), setSel(h.id), setEdge(null))} onDragOver={(e) => e.preventDefault()} onDrop={(e) => (e.preventDefault(), move(e.dataTransfer.getData("text/plain"), num(h.c), num(h.r)), setSel(null))} onClick={() => pick(h)}><span>{name(h)}</span></button>
          ))}
          {edges.map((e) => {
            const p = hxAt(num(e.a.c), num(e.a.r)), q = hxAt(num(e.b.c), num(e.b.r)), n = told.indexOf(e);
            return <button key={e.key} className={`hx-dot${n >= 0 ? " told" : ""}${edge === e.key ? " on" : ""}`} style={{ left: `${(parseFloat(p.left) + parseFloat(q.left)) / 2}%`, top: `${(parseFloat(p.top) + parseFloat(q.top)) / 2}%` }} aria-label={`Connection between ${name(e.a)} and ${name(e.b)}${n >= 0 ? `: ${str(st[e.key])}` : ": not explained yet"}`} onClick={() => (setSel(null), setEdge(edge === e.key ? null : e.key))}>{n >= 0 ? n + 1 : ""}</button>;
          })}
          {!placed.length ? <p className="hx-hint">{lock ? "No hexagons yet." : "An empty honeycomb. Click any place to start a hexagon there."}</p> : null}
        </div>
      </div>
      {open ? (
        <section className="po-panel hx-edit" key={open.key}>
          <span className="ex-mono">A connection · these two sides touch</span>
          <div className="hx-pair"><b style={hexStyle(open.a)}>{name(open.a)}</b><i aria-hidden>⟷</i><b style={hexStyle(open.b)}>{name(open.b)}</b></div>
          <Field k={open.key} st={st} op={op} readOnly={readOnly} rows={2} placeholder="Why are these two connected? What does one do to the other?" label="Why these two are connected" />
        </section>
      ) : cur && !lock ? (
        <section className="po-panel hx-edit" key={cur.id}>
          <span className="ex-mono">This hexagon{typeof cur.c === "number" ? ` · touches ${touch(cur)} of 6` : " · waiting"}</span>
          <CellText row={cur} k="text" hint="One challenge, idea or fact: a few words" op={op} readOnly={readOnly} listKey="hexes" />
          <div className="hx-tools">
            <div className="hx-tones" role="group" aria-label="Colour">{HX_TONES.map((t) => (<button key={t} style={{ background: t }} aria-label={`Colour ${t}`} aria-pressed={tone(cur) === t} onClick={() => op({ key: "hexes", op: "update", id: cur.id, value: { tone: t } })} />))}</div>
            {typeof cur.c === "number" ? <button className="po-btn plain" onClick={() => (op({ key: "hexes", op: "update", id: cur.id, value: { c: null, r: null } }), setSel(null))}>Take it off the honeycomb</button> : null}
            <button className="po-btn plain" onClick={() => (op({ key: "hexes", op: "remove", id: cur.id }), setSel(null))}>Delete</button>
            <span className="po-note">To move it: click an empty place, or another hexagon to swap.</span>
          </div>
        </section>
      ) : null}
      <div className="po-two wide">
        <section className="po-panel">
          <span className="ex-mono">What the diagram shows</span>
          <p className="po-big">{placed.length} hexagons · {edges.length} connections · {told.length} explained</p>
          {hub && touch(hub) ? <p className="hx-read"><b>Most connected:</b> {name(hub)} (touches {touch(hub)})</p> : null}
          {alone.length && placed.length > 1 ? <p className="hx-read"><b>Standing alone:</b> {alone.map(name).join("; ")}</p> : null}
          <p className="po-note">A hexagon can touch up to six others. The dot on a shared side is the connection: click it and write why.</p>
        </section>
        <section className="po-panel">
          <span className="ex-mono">Our connections, explained</span>
          {told.length ? <ol className="hx-list">{told.map((e) => (<li key={e.key}><button onClick={() => (setSel(null), setEdge(e.key))}><b>{name(e.a)} ⟷ {name(e.b)}</b><span>{str(st[e.key])}</span></button></li>))}</ol> : <p className="po-empty">Click a dot between two hexagons to explain that connection.</p>}
        </section>
      </div>
      {str(config.credit) ? <p className="po-note" style={{ margin: 0 }}>Method: {str(config.credit)}</p> : null}
      {!readOnly ? (
        <div className="po-acts-row">
          <span className="po-note">{final ? "This is the team's final hexagon diagram." : "Arrange and rearrange until the diagram says what you mean."}</span>
          <button className={`po-btn${final ? " plain" : ""}`} disabled={!final && placed.length < 2} onClick={() => (op({ key: "final", op: "set", value: final ? null : true }), setSel(null))}>{final ? "Keep rearranging" : "This is our final hexagon diagram"}</button>
        </div>
      ) : null}
    </div>
  );
}


// Turn your transformation into a story (optional). The group names its audience, picks one of
// the storytelling approaches, fills that approach's parts, and gets a draft to edit. Where the
// transformation canvas is filled in, each part offers a suggestion drawn from it.
type StoryFacts = Record<"org" | "purpose" | "serve" | "succeed" | "bobj" | "tobj" | "kbr" | "ktr" | "aud" | "wiifm", string>;
const low = (t: string) => (t && !/^[A-Z]{2}/.test(t) ? t[0]!.toLowerCase() + t.slice(1) : t).replace(/[.\s]+$/, "");
const say = (...xs: (string | false)[]) => (xs.every(Boolean) ? xs.join("") : "");
const STORY_METHODS: { id: string; name: string; when: string; parts: [label: string, hint: string, draft: (f: StoryFacts) => string][] }[] = [
  { id: "golden", name: "Why, How, What: The Golden Circle", when: "Start from the purpose, then the way, then the result.", parts: [
    ["Why", "The purpose: why this transformation matters", (f) => say("We exist to ", low(f.purpose), f.serve && ` for ${low(f.serve)}`, ". To keep doing that, we need to ", low(f.bobj), ".")],
    ["How", "The way we will get there", (f) => say("We get there by changing how we work: ", low(f.tobj), ".")],
    ["What", "What people will see change", (f) => say("You will see it in ", low(f.ktr), f.kbr && `, and the business will see it in ${low(f.kbr)}`, ".")],
  ] },
  { id: "epl", name: "Ethos, pathos, logos", when: "Earn trust, connect emotionally, then give the evidence.", parts: [
    ["Ethos", "Why this audience should trust us on this", (f) => say("As ", f.org, ", we ", low(f.purpose), " every day, and we have looked hard at what holds us back.")],
    ["Pathos", "What it feels like today, and how it could feel", (f) => say(f.aud, ": ", low(f.wiifm), ".")],
    ["Logos", "The facts and the logic", (f) => say("Our objective is to ", low(f.bobj), ". We will know we are getting there by ", low(f.kbr), ".")],
  ] },
  { id: "success", name: "SUCCESs Model", when: "Make one message stick: simple, unexpected, concrete, credible, emotional, a story.", parts: [
    ["Simple", "The one core message", (f) => say("We are changing how we work so that we can ", low(f.bobj), ".")],
    ["Unexpected", "What will surprise this audience", () => ""],
    ["Concrete", "A picture people can see", (f) => say("In practice: ", low(f.ktr), ".")],
    ["Credible", "Why it can be believed", (f) => say("We will measure it: ", low(f.kbr), ".")],
    ["Emotional", "Why people will care", (f) => say("For ", low(f.aud), ", this means ", low(f.wiifm), ".")],
    ["Stories", "One short story that carries it", () => ""],
  ] },
  { id: "hero", name: "Hero's journey", when: "The audience is the hero: their world, the call, the trials, the change.", parts: [
    ["The world today", "Where the hero is now", (f) => say("Today, ", low(f.aud), " at ", f.org, " work hard to ", low(f.purpose), ".")],
    ["The call to change", "What makes staying put impossible", (f) => say("But to ", low(f.succeed), ", we have to ", low(f.bobj), ".")],
    ["The trials", "What will be hard on the way", () => ""],
    ["The transformation", "What the hero becomes", (f) => say("Together we ", low(f.tobj), ".")],
    ["The return", "What the hero brings back", (f) => say("And what comes of it: ", low(f.wiifm), ".")],
  ] },
  { id: "wsn", name: "What? So what? Now what?", when: "Short and direct: the facts, why they matter, the next step.", parts: [
    ["What?", "What is happening", (f) => say(f.org, " is setting out to ", low(f.tobj), ".")],
    ["So what?", "Why it matters to this audience", (f) => say("It matters because we need to ", low(f.bobj), f.wiifm && `, and for you it means ${low(f.wiifm)}`, ".")],
    ["Now what?", "What we ask people to do next", () => ""],
  ] },
  { id: "pitch", name: "Elevator pitch", when: "Thirty seconds, one breath: who it is for, what it is, why it is different.", parts: [
    ["For … who …", "The audience and their need", (f) => say("For ", low(f.aud), " who want ", low(f.wiifm), ",")],
    ["Our transformation is …", "What it is and what it gives", (f) => say("our transformation is how we will ", low(f.tobj), ", so that we ", low(f.bobj), ".")],
    ["Unlike …", "What makes it different from past change", () => ""],
    ["We will …", "The promise and the ask", (f) => say("We will show progress through ", low(f.ktr), ".")],
  ] },
  { id: "five", name: "5 Ws and an H", when: "Cover everything a first announcement must answer.", parts: [
    ["Who", "Who is involved and affected", (f) => say(f.org, f.serve && `, serving ${low(f.serve)}`, ".")],
    ["What", "What is changing", (f) => say("We will ", low(f.tobj), ".")],
    ["When", "The timing", () => ""],
    ["Where", "Which parts of the organization", () => ""],
    ["Why", "The reason", (f) => say("Because we need to ", low(f.bobj), ".")],
    ["How", "The way it will happen", (f) => say("We will track it by ", low(f.ktr), ".")],
  ] },
];
const STORY_CHECKS = ["Know the audience", "What's in it for me? (WIIFM)", "Use common language", "Be relatable", "Connect emotionally and rationally", "Convey tension and urgency", "Include a call to action", "Less is more"];

export function AsStoryBoard({ config, st, op, readOnly }: BoardProps) {
  const mid = str(st["story:m"]), method = STORY_METHODS.find((m) => m.id === mid) ?? null;
  // A key result of the canvas reads "metric from A to B"; older notes carry plain text.
  const texts = (k: string) => list(st, k).map((r) => str(r.text) || [str(r.metric) || str(r.outcome), str(r.from) && str(r.to) ? `from ${str(r.from)} to ${str(r.to)}` : str(r.to) && `to ${str(r.to)}`].filter(Boolean).join(" ")).filter(Boolean).slice(0, 3).join("; ");
  const facts: StoryFacts = { org: str(st.who), purpose: str(st["ctx:1:bo"]), serve: str(st["ctx:2:bo"]), succeed: str(st["ctx:3:bo"]), bobj: str(st.bobj), tobj: str(st.tobj), kbr: texts("kbr"), ktr: texts("ktr"), aud: str(st["story:aud"]), wiifm: str(st["story:wiifm"]) };
  const canvas = !!(facts.bobj || facts.tobj || facts.purpose);
  const pk = (i: number) => `story:p:${mid}:${i}`;
  const checks = (st["story:check"] && typeof st["story:check"] === "object" ? st["story:check"] : {}) as Record<string, boolean>;
  const story = str(st["story:text"]), words = story.trim() ? story.trim().split(/\s+/).length : 0;
  const filled = method ? method.parts.filter((_, i) => str(st[pk(i)])).length : 0;
  const compose = () => method ? method.parts.map(([, , d], i) => str(st[pk(i)]) || d(facts)).filter(Boolean).join(method.id === "pitch" ? " " : "\n\n") : "";
  const draft = () => { const t = compose(); if (t && (!story || window.confirm("Replace the story below with a new draft?"))) op({ key: "story:text", op: "set", value: t }); };
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
      <section className="po-panel st-step">
        <header><i>1</i><div><b>Know the audience</b><span>Every approach starts here.</span></div></header>
        <div className="po-two wide">
          <label className="st-field"><span className="ex-mono">Who is this story for?</span><Field k="story:aud" st={st} op={op} readOnly={readOnly} rows={2} placeholder="e.g. team members in the first ART" label="Audience" /></label>
          <label className="st-field"><span className="ex-mono">What&apos;s in it for them? (WIIFM)</span><Field k="story:wiifm" st={st} op={op} readOnly={readOnly} rows={2} placeholder="e.g. fewer handoffs and a clear say in the plan" label="What's in it for them" /></label>
        </div>
      </section>
      <section className="po-panel st-step">
        <header><i>2</i><div><b>Pick one approach</b><span>There are many; these are some. The dots are the parts you will fill.</span></div></header>
        <div className="st-methods" role="radiogroup" aria-label="Storytelling approach">
          {STORY_METHODS.map((m, i) => (
            <button key={m.id} role="radio" aria-checked={m.id === mid} disabled={readOnly} className={`st-method${m.id === mid ? " on" : ""}`} style={{ ["--c" as string]: WHEEL[i % WHEEL.length], animationDelay: `${i * 50}ms` }} onClick={() => op({ key: "story:m", op: "set", value: m.id === mid ? null : m.id })}>
              <b>{m.name}</b>
              <small>{m.when}</small>
              <span className="st-dots" aria-hidden>{m.parts.map(([l]) => (<i key={l} title={l} />))}</span>
            </button>
          ))}
        </div>
      </section>
      {method ? (
        <section className="po-panel st-step" key={method.id}>
          <header><i>3</i><div><b>{method.name}</b><span>{filled}/{method.parts.length} parts written{canvas ? " · suggestions come from your transformation canvas" : " · fill in the transformation canvas to get suggestions"}</span></div></header>
          <div className="st-parts">
            {method.parts.map(([label, hint, d], i) => {
              const sug = d(facts), has = str(st[pk(i)]);
              return (
                <div key={label} className={`st-part${has ? " has" : ""}`} style={{ animationDelay: `${i * 70}ms` }}>
                  <span className="st-label"><i>{i + 1}</i>{label}</span>
                  <Field k={pk(i)} st={st} op={op} readOnly={readOnly} rows={3} placeholder={hint} label={label} />
                  {!readOnly && !has && sug ? <button className="st-sug" onClick={() => op({ key: pk(i), op: "set", value: sug })}><em>Suggestion</em>{sug}<u>Use it</u></button> : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
      {method ? (
        <section className="po-panel st-step">
          <header><i>4</i><div><b>Our story</b><span>A draft to start from, yours to rewrite.</span></div>{!readOnly ? <button className="po-btn" disabled={!compose()} onClick={draft}>{story ? "Draft it again" : "Offer a draft"}</button> : null}</header>
          <Field k="story:text" st={st} op={op} readOnly={readOnly} rows={9} placeholder="Write the story here, or let the parts above offer a draft." label="Our story" />
          <div className="st-foot">
            <span className={`st-words${words > 150 ? " long" : ""}`}><b>{words}</b> words{words > 150 ? " · less is more: aim for about a minute, 150 words" : words ? " · about " + Math.max(1, Math.round(words / 2.5)) + " seconds to tell" : ""}</span>
          </div>
          <span className="ex-mono">Common elements · tick what the story does</span>
          <div className="st-checks">
            {STORY_CHECKS.map((c, i) => (<button key={c} disabled={readOnly} aria-pressed={!!checks[i]} onClick={() => op({ key: "story:check", op: "set", value: { ...checks, [i]: !checks[i] } })}><i>{checks[i] ? "✓" : ""}</i>{c}</button>))}
          </div>
        </section>
      ) : <p className="po-empty">Pick an approach to see its parts.</p>}
      <p className="po-note" style={{ margin: 0 }}>References: The Golden Circle, Sinek, “How Great Leaders Inspire Action”. SUCCESs, Heath and Heath, “Made to Stick”.</p>
    </div>
  );
}

export const POPM_KINDS = new Set(["po-intro", "po-mind", "po-ai", "po-msg", "po-rhythm", "po-feat", "po-refine", "po-cap", "po-vision", "po-deps", "po-map", "po-iter", "po-check", "as-ppf", "as-balance", "as-cars", "as-hard", "as-roadmap", "as-canvas", "as-backlog", "as-themes", "as-epic", "as-roleplay", "as-mix", "as-guard", "as-gq", "as-blueprint", "as-lab", "as-hex", "as-story"]);
const BOARDS: Record<string, (p: BoardProps) => ReactNode> = { "po-intro": PoIntroBoard, "po-mind": PoMindsetBoard, "po-ai": PoAiBoard, "po-msg": PoMessageBoard, "po-rhythm": PoRhythmBoard, "po-feat": PoFeatureBoard, "po-refine": PoRefineBoard, "po-cap": PoCapacityBoard, "po-vision": PoVisionBoard, "po-deps": PoDepsBoard, "po-map": PoStoryMapBoard, "po-iter": PoIterationBoard, "po-check": PoChecklistBoard, "as-ppf": AsTimelineBoard, "as-balance": AsBalanceBoard, "as-cars": AsCarsBoard, "as-hard": AsHardBoard, "as-roadmap": AsRoadmapBoard, "as-canvas": AsCanvasBoard, "as-backlog": AsBacklogBoard, "as-themes": AsThemesBoard, "as-epic": AsEpicBoard, "as-roleplay": AsRoleplayBoard, "as-mix": AsMixBoard, "as-guard": AsGuardrailBoard, "as-gq": AsGuardQuestionsBoard, "as-blueprint": AsBlueprintBoard, "as-lab": AsLabBoard, "as-hex": AsHexBoard, "as-story": AsStoryBoard };
export function PopmBoard(props: BoardProps & { kind: string }) {
  const B = BOARDS[props.kind] ?? PoMessageBoard;
  return <B {...props} />;
}
