"use client";

// The exercise boards of the AI-Empowered SAFe POPM class (lesson 1): who is in the group and what
// they want to learn, the Lean-Agile mindset scenario, AI's disruption of product work, and the
// prompt builder for the SAFe message. Each keeps what people add in the frame's state.

import { useEffect, useRef, useState, type ReactNode } from "react";
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
          <p className="po-note">{total && per.some((x) => !x) ? `Not used yet: ${kinds.filter((_, i) => !per[i]).join(", ")}.` : str(config.wheelNote) || "Tag each note with the sync event it belongs to."}</p>
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
          <span className="ex-mono">Fuelling continuous improvement</span>
          <p className="po-note">{done === lenses.length ? "The loop is closed: the group has a change to try for each of the three." : `Still open: ${lenses.filter((_, i) => !count(i)).map(([n]) => n.toLowerCase()).join(", ")}. Each arc closes when the group names what it would change there.`}</p>
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
                    <div className="po-seg small" role="group" aria-label="This is">
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
  const must = tasks.flatMap((t) => stories.filter((s) => s.task === t.id && s.must === true));
  const addTask = () => task.trim() && tasks.length < 7 && (op({ key: "tasks", op: "push", value: { name: task.trim() } }), setTask(""));
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
          <div className="po-mapscroll">
            <div className="po-mapgrid" style={{ ["--n" as string]: Math.max(1, tasks.length + (readOnly ? 0 : 1)) }}>
              {tasks.map((t) => (
                <div key={t.id} className="po-task">
                  <span>{str(t.name)}</span>
                  {!readOnly ? <button className="ex-x" aria-label={`Remove ${str(t.name)}`} onClick={() => op({ key: "tasks", op: "remove", id: t.id })}>×</button> : null}
                </div>
              ))}
              {!readOnly && tasks.length < 7 ? (
                <div className="po-task new">
                  <input value={task} placeholder="+ activity or task" aria-label="Activity or task" onChange={(e) => setTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} onBlur={addTask} />
                </div>
              ) : null}
              {(["must", "later"] as const).map((band) => (
                <div key={band} className={`po-band ${band}`} style={{ gridColumn: "1 / -1" }}>
                  <span className="ex-mono">{band === "must" ? "Essential stories for this release · high priority" : "Stories for future releases · low priority"}</span>
                  <div className="po-mapgrid" style={{ ["--n" as string]: Math.max(1, tasks.length + (readOnly ? 0 : 1)) }}>
                    {tasks.map((t) => (
                      <div key={t.id} className="po-stack">
                        {stories.filter((s) => s.task === t.id && (s.must === true) === (band === "must")).map((s) => (
                          <div key={s.id} className={`po-story ${band}`}>
                            <span>{str(s.text)}</span>
                            {!readOnly ? (
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

// Practice identifying a balanced set of metrics: the slide's table, a row per decision, with the
// balance across the three measurement domains drawn above it.
export function AsBalanceBoard({ config, st, op, readOnly }: BoardProps) {
  const domains = (config.domains as string[] | undefined) ?? [], levels = (config.levels as string[] | undefined) ?? [];
  const ex = config.example as Record<string, string> | undefined;
  const rows = list(st, "rows");
  const byLevel = (l: string) => rows.filter((r) => str(r.level) === l);
  return (
    <div className="ex-board po">
      <DomainBalance domains={domains} picked={rows.map((r) => str(r.domain)).filter(Boolean)} />
      <div className="as-tablewrap">
        <div className="as-table" role="table" aria-label="Balanced set of metrics">
          <div className="as-tr head" role="row">
            {["Level", "Decision / Question", "Measurement domain", "Metric", "Complementary metric"].map((h, i) => (<span key={h} role="columnheader" className={i > 1 ? "teal" : ""}>{h}</span>))}
          </div>
          {ex ? (
            <div className="as-tr example" role="row">
              <b>{ex.level}</b><span>{ex.question}</span><span>{ex.domain}</span><span>{ex.metric}</span><span>{ex.complement}</span>
              <em>Example</em>
            </div>
          ) : null}
          {levels.map((l) => (
            <div key={l} className="as-level">
              {byLevel(l).map((r) => (
                <div key={r.id} className="as-tr" role="row">
                  <b>{l}</b>
                  <CellText row={r} k="question" hint="The decision or question" op={op} readOnly={readOnly} listKey="rows" />
                  <div className="as-domains" role="group" aria-label="Measurement domain">
                    {domains.map((d) => (<button key={d} disabled={readOnly} aria-pressed={str(r.domain) === d} style={{ ["--c" as string]: DOMAIN_TONE[d] }} onClick={() => op({ key: "rows", op: "update", id: r.id, value: { domain: str(r.domain) === d ? "" : d } })}>{d}</button>))}
                  </div>
                  <CellText row={r} k="metric" hint="One metric that informs it" op={op} readOnly={readOnly} listKey="rows" />
                  <CellText row={r} k="complement" hint="Its complementary metric, and why" op={op} readOnly={readOnly} listKey="rows" />
                  {!readOnly ? <button className="ex-x" aria-label="Remove this row" onClick={() => op({ key: "rows", op: "remove", id: r.id })}>×</button> : null}
                </div>
              ))}
              {!readOnly ? <button className="as-addrow" onClick={() => op({ key: "rows", op: "push", value: { level: l } })}><b>{l}</b>+ a decision or question at this level</button> : byLevel(l).length ? null : <div className="as-tr" role="row"><b>{l}</b><span className="po-note">Nothing yet.</span></div>}
            </div>
          ))}
        </div>
      </div>
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
const CV_COLS = [["outcome", "Desired outcome"], ["metric", "Metric"], ["from", "From"], ["to", "To"]] as const;

const CV_FOCUS: Record<string, string[]> = { all: ["context", "tobj", "bobj", "ktr", "kbr", "align"], context: ["context"], business: ["bobj", "kbr"], transformation: ["tobj", "ktr"], alignment: ["ktr", "align", "kbr"] };
const linksOf = (r: Row): string[] => (Array.isArray(r.links) ? (r.links as string[]) : []);

function CanvasResults({ k, title, indicator, tone, st, op, readOnly, other, on }: { k: "ktr" | "kbr"; title: string; indicator: string; tone: string; st: St; op: BoardProps["op"]; readOnly: boolean; other?: Row[]; on: boolean }) {
  const rows = list(st, k), tag = k === "ktr" ? "T" : "B", ink = k === "ktr" ? "#fff" : "#06384a";
  return (
    <div className={`cv-results cv-part${on ? " focus" : ""}`}>
      <div className="cv-bar" style={{ background: tone, color: ink }}>{title}</div>
      <div className="cv-rhead">{CV_COLS.map(([c, l]) => (<span key={c}>{c === "metric" ? `${l} · ${indicator}` : l}</span>))}</div>
      {rows.map((r, i) => (
        <div key={r.id} className="cv-rrow">
          <b className="cv-tag" style={{ background: tone, color: ink }}>{tag}{i + 1}</b>
          {CV_COLS.map(([c, l]) => (<CellText key={c} row={r} k={c} hint={l} op={op} readOnly={readOnly} listKey={k} />))}
          {other?.length ? (
            <div className="cv-link" role="group" aria-label={`${tag}${i + 1} is a leading indicator of`}>
              <span>leads to</span>
              {other.map((o, j) => { const has = linksOf(r).includes(o.id); return <button key={o.id} disabled={readOnly} aria-pressed={has} title={str(o.outcome)} onClick={() => op({ key: k, op: "update", id: r.id, value: { links: has ? linksOf(r).filter((x) => x !== o.id) : [...linksOf(r), o.id] } })}>B{j + 1}</button>; })}
            </div>
          ) : null}
          {!readOnly ? <button className="ex-x" aria-label="Remove this row" onClick={() => op({ key: k, op: "remove", id: r.id })}>×</button> : null}
        </div>
      ))}
      {!readOnly && rows.length < 6 ? <button className="cv-add" onClick={() => op({ key: k, op: "push", value: {} })}>+ a key result</button> : null}
    </div>
  );
}

export function AsCanvasBoard({ config, st, op, readOnly }: BoardProps) {
  const qs = (config.questions as string[] | undefined) ?? [], focus = str(config.focus) || "all", example = config.example as Record<string, unknown> | undefined;
  const on = (p: string) => (CV_FOCUS[focus] ?? CV_FOCUS.all!).includes(p);
  const ktr = list(st, "ktr"), kbr = list(st, "kbr");
  const links = ktr.flatMap((t, i) => linksOf(t).map((id) => ({ t: i, b: kbr.findIndex((b) => b.id === id) }))).filter((x) => x.b >= 0);
  const looseT = ktr.map((_, i) => i).filter((i) => !links.some((l) => l.t === i)), looseB = kbr.map((_, j) => j).filter((j) => !links.some((l) => l.b === j));
  const ctxFilled = qs.flatMap((_, i) => CV_SIDES.map(([s]) => str(st[`ctx:${i}:${s}`]))).filter(Boolean).length;
  const empty = !ctxFilled && !str(st.tobj) && !str(st.bobj) && !ktr.length && !kbr.length;
  const load = () => {
    if (!example || (!empty && !window.confirm("Replace what is on the canvas with the example?"))) return;
    for (const [k, v] of Object.entries(example)) op({ key: k, op: "set", value: v });
  };
  const clear = () => {
    if (!window.confirm("Clear the whole canvas to work on your own?")) return;
    for (const k of [...qs.flatMap((_, i) => CV_SIDES.map(([s]) => `ctx:${i}:${s}`)), "who", "tobj", "bobj", "ktr", "kbr"]) op({ key: k, op: "set", value: null });
  };
  const n = Math.max(ktr.length, kbr.length, 1), H = n * 46 + 16, y = (i: number, of: number) => 8 + ((i + 0.5) * (H - 16)) / Math.max(of, 1);
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
      <div className="cv-top">
        <ol className="po-steps" aria-label="Parts of the canvas">
          {([["context", "Business context", ctxFilled === qs.length * 2], ["business", "Business OKR", !!str(st.bobj) && kbr.length > 0], ["transformation", "Transformation OKR", !!str(st.tobj) && ktr.length > 0], ["alignment", "Alignment", ktr.length > 0 && !looseT.length && !looseB.length]] as const).map(([p, l, ok]) => (<li key={p} className={ok ? "done" : focus === p ? "on" : ""}>{l}</li>))}
        </ol>
        {!readOnly ? (
          <span style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {example ? <button className="po-reset" style={{ marginLeft: 0 }} onClick={load}>Load the CARS example</button> : null}
            {!empty ? <button className="po-reset" style={{ marginLeft: 0 }} onClick={clear}>Clear for our own</button> : null}
          </span>
        ) : null}
      </div>
      <div className="cv" aria-label="Transformation canvas">
        <section className={`cv-part${on("context") ? " focus" : ""}`}>
          <div className="cv-bar" style={{ background: "#06384a", color: "#fff" }}>Business Context</div>
          <label className="cv-who"><span>Organization</span><Field k="who" st={st} op={op} readOnly={readOnly} rows={1} placeholder="Whose canvas is this? Your own organization, or CARS" label="Organization" /></label>
          <div className="cv-ctx" style={{ ["--n" as string]: qs.length }}>
            {qs.map((q, i) => (
              <div key={q} className="cv-q">
                <b>{q}</b>
                <div className="cv-split">
                  {CV_SIDES.map(([s, label]) => (
                    <label key={s}>
                      <Field k={`ctx:${i}:${s}`} st={st} op={op} readOnly={readOnly} rows={3} placeholder="…" label={`${q} ${label}`} />
                      <em>{label}</em>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <div className="cv-two">
          <label className={`cv-part${on("tobj") ? " focus" : ""}`}><div className="cv-bar" style={{ background: "#3f7c80", color: "#fff" }}>Transformation Objective</div><Field k="tobj" st={st} op={op} readOnly={readOnly} rows={2} placeholder="What the transformation sets out to achieve" label="Transformation Objective" /></label>
          <label className={`cv-part${on("bobj") ? " focus" : ""}`}><div className="cv-bar" style={{ background: "#8accce", color: "#06384a" }}>Business Objective</div><Field k="bobj" st={st} op={op} readOnly={readOnly} rows={2} placeholder="What the business sets out to achieve" label="Business Objective" /></label>
        </div>
        <div className="cv-three">
          <CanvasResults k="ktr" title="Key Transformation Results" indicator="leading indicator" tone="#3f7c80" st={st} op={op} readOnly={readOnly} other={kbr} on={on("ktr")} />
          <div className={`cv-align cv-part${on("align") ? " focus" : ""}`}>
            <div className="cv-bar" style={{ background: "#06384a", color: "#fff" }}>Alignment</div>
            <svg viewBox={`0 0 170 ${H}`} role="img" aria-label={links.length ? links.map((l) => `T${l.t + 1} leads to B${l.b + 1}`).join(", ") : "No links yet"}>
              <defs><marker id="cv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#06384a" /></marker></defs>
              {links.map((l) => (<line key={`${l.t}-${l.b}`} className="cv-line" x1="34" y1={y(l.t, ktr.length)} x2="136" y2={y(l.b, kbr.length)} stroke="#06384a" strokeWidth="1.8" markerEnd="url(#cv-arrow)" />))}
              {ktr.map((t, i) => (<g key={t.id}><circle cx="18" cy={y(i, ktr.length)} r="13" fill={looseT.includes(i) ? "#fff" : "#3f7c80"} stroke="#3f7c80" strokeWidth="2.5" /><text x="18" y={y(i, ktr.length) + 4} textAnchor="middle" className="cv-dot" style={{ fill: looseT.includes(i) ? "#06384a" : "#fff" }}>T{i + 1}</text></g>))}
              {kbr.map((b, j) => (<g key={b.id}><circle cx="152" cy={y(j, kbr.length)} r="13" fill={looseB.includes(j) ? "#fff" : "#8accce"} stroke="#8accce" strokeWidth="2.5" /><text x="152" y={y(j, kbr.length) + 4} textAnchor="middle" className="cv-dot">B{j + 1}</text></g>))}
            </svg>
            <p className="po-note" style={{ padding: "0 8px 8px", fontSize: 12 }}>{!ktr.length || !kbr.length ? "Add key results on both sides, then say which business results each transformation result leads to." : looseT.length || looseB.length ? `Not connected: ${[...looseT.map((i) => `T${i + 1}`), ...looseB.map((j) => `B${j + 1}`)].join(", ")}.` : "Every result is connected."}</p>
          </div>
          <CanvasResults k="kbr" title="Key Business Results" indicator="lagging indicator" tone="#8accce" st={st} op={op} readOnly={readOnly} on={on("kbr")} />
        </div>
      </div>
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
      <p className="po-note">The canvas is the same one in every step of this lesson: what you fill in here is there in the next step. The part this step is about is in full colour.</p>
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

export const POPM_KINDS = new Set(["po-intro", "po-mind", "po-ai", "po-msg", "po-rhythm", "po-feat", "po-refine", "po-cap", "po-vision", "po-deps", "po-map", "po-iter", "po-check", "as-ppf", "as-balance", "as-cars", "as-hard", "as-roadmap", "as-canvas", "as-backlog"]);
const BOARDS: Record<string, (p: BoardProps) => ReactNode> = { "po-intro": PoIntroBoard, "po-mind": PoMindsetBoard, "po-ai": PoAiBoard, "po-msg": PoMessageBoard, "po-rhythm": PoRhythmBoard, "po-feat": PoFeatureBoard, "po-refine": PoRefineBoard, "po-cap": PoCapacityBoard, "po-vision": PoVisionBoard, "po-deps": PoDepsBoard, "po-map": PoStoryMapBoard, "po-iter": PoIterationBoard, "po-check": PoChecklistBoard, "as-ppf": AsTimelineBoard, "as-balance": AsBalanceBoard, "as-cars": AsCarsBoard, "as-hard": AsHardBoard, "as-roadmap": AsRoadmapBoard, "as-canvas": AsCanvasBoard, "as-backlog": AsBacklogBoard };
export function PopmBoard(props: BoardProps & { kind: string }) {
  const B = BOARDS[props.kind] ?? PoMessageBoard;
  return <B {...props} />;
}
