"use client";

// The exercise boards of the AI-Empowered SAFe POPM class (lesson 1): who is in the group and what
// they want to learn, the Lean-Agile mindset scenario, AI's disruption of product work, and the
// prompt builder for the SAFe message. Each keeps what people add in the frame's state.

import { useEffect, useState, type ReactNode } from "react";
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
        <p className="po-note">Value flows left to right. A stage turns green and grows as the class adds how product roles support it; an empty stage is where the pipeline has no product voice yet.</p>
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
          <span className="ex-mono">Which sync events the class is leaning on</span>
          {kinds.map((k, i) => (
            <div key={k} className="po-bar-row" style={{ gridTemplateColumns: "110px minmax(0, 1fr) 28px" }}>
              <b style={{ fontSize: 13.5, gridColumn: "auto" }}>{k}</b>
              <div className="po-bar"><i style={{ width: `${total ? (per[i]! / Math.max(...per, 1)) * 100 : 0}%`, background: WHEEL[i % WHEEL.length] }} /></div>
              <small>{per[i]}</small>
            </div>
          ))}
          <p className="po-note">{total && per.some((x) => !x) ? `Not used yet: ${kinds.filter((_, i) => !per[i]).join(", ")}.` : "Tag each note with the sync event it belongs to."}</p>
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
                <div key={n.id} className={`po-sticky k${num(n.kind)}${n.star ? " star" : ""}`}>
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
        <span className="po-avatar" aria-hidden>SD</span>
        <div>
          <span className="ex-mono">Message from the Senior Developer</span>
          <p>{str(config.scenario)}</p>
        </div>
      </div>
      <div className="po-seg" role="tablist" aria-label="Round">
        <button role="tab" aria-selected={round === "r1"} aria-pressed={round === "r1"} onClick={() => setRound("r1")}>Step 2 · First prompt</button>
        <button role="tab" aria-selected={round === "r2"} aria-pressed={round === "r2"} onClick={() => (round === "r2" || readOnly ? setRound("r2") : startRefine())}>Step 3 · Refine and compare</button>
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
  const markets = (config.markets as [string, string][] | undefined) ?? [];
  const demand = (mi: number): number[] => (Array.isArray(st[`d:${mi}`]) && (st[`d:${mi}`] as unknown[]).length === 12 ? (st[`d:${mi}`] as number[]) : Array(12).fill(5));
  const events = list(st, "events"), win = (st.win && typeof st.win === "object" ? st.win : {}) as Record<string, boolean>;
  const [ev, setEv] = useState({ name: "", market: 0, month: 0 });
  const bump = (mi: number, i: number) => op({ key: `d:${mi}`, op: "set", value: demand(mi).map((v, j) => (j === i ? (v >= 10 ? 0 : v + 2.5) : v)) });
  const shaped = markets.some((_, mi) => Array.isArray(st[`d:${mi}`]));
  const total = MONTHS.map((_, i) => markets.reduce((n, _m, mi) => n + demand(mi)[i]!, 0));
  const low = Math.min(...total), quiet = shaped ? MONTHS.filter((_, i) => total[i] === low) : [];
  const chosen = MONTHS.filter((_, i) => win[i]);
  return (
    <div className="ex-board po">
      <div className="po-scenario">
        <span className="ex-mono">Scenario</span>
        <p>{str(config.scenario)}</p>
      </div>
      <section className="po-panel">
        <div className="po-legend left">
          {markets.map(([name, color]) => (<span key={name} style={{ ["--c" as string]: color }}><i />{name}</span>))}
          <span style={{ ["--c" as string]: "#2e8b57" }}><i className="sq" />Release window</span>
        </div>
        <div className="po-chartwrap">
          <svg className="po-chart" viewBox="0 0 760 300" role="img" aria-label={`Demand through the year for ${markets.map((m) => m[0]).join(" and ")}`}>
            {MONTHS.map((m, i) => (
              <g key={m}>
                <rect className="po-win" x={MX(i) - 28} y={30} width={56} height={228} fill="#2e8b57" opacity={win[i] ? 0.18 : 0} />
                {shaped && total[i] === low ? <rect x={MX(i) - 28} y={254} width={56} height={5} fill="#d98a1c" /> : null}
                <text x={MX(i)} y={278} textAnchor="middle" className="po-axis">{m}</text>
                {i % 3 === 0 ? <line x1={MX(i) - 28} y1={30} x2={MX(i) - 28} y2={258} stroke="#0d181826" strokeDasharray="3 5" /> : null}
              </g>
            ))}
            <text x={20} y={56} className="po-axis">High</text>
            <text x={20} y={254} className="po-axis">Low</text>
            {markets.map(([name, color], mi) => (<path key={name} className="po-curve" d={curve(demand(mi))} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />))}
            {events.map((e, j) => {
              const x = MX(num(e.month)), y = 44 + (j % 3) * 22, c = markets[num(e.market)]?.[1] ?? "#0d1815";
              return (
                <g key={e.id} className="po-evt">
                  <line x1={x} y1={y} x2={x} y2={258} stroke={c} strokeDasharray="2 4" />
                  <polygon points={`${x},${y - 9} ${x + 9},${y} ${x},${y + 9} ${x - 9},${y}`} fill={c} stroke="#0d1815" strokeWidth="1.5" />
                  <text x={x + 13} y={y + 4} className="po-evt-t">{str(e.name)}</text>
                </g>
              );
            })}
          </svg>
        </div>
        {markets.map(([name, color], mi) => (
          <div key={name} className="po-bars" role="group" aria-label={`Demand per month, ${name}`}>
            <b style={{ color }}>{name}</b>
            {demand(mi).map((v, i) => (
              <button key={i} disabled={readOnly} aria-label={`${name}, ${MONTHS[i]}: ${v} of 10. Click to raise.`} onClick={() => bump(mi, i)}>
                <i style={{ height: `${v * 10}%`, background: color }} />
              </button>
            ))}
          </div>
        ))}
        <div className="po-bars" role="group" aria-label="Release windows">
          <b style={{ color: "#2e8b57" }}>Release window</b>
          {MONTHS.map((m, i) => (
            <button key={m} className="po-pick" disabled={readOnly} aria-pressed={!!win[i]} onClick={() => op({ key: "win", op: "set", value: { ...win, [i]: !win[i] } })}>{m}</button>
          ))}
        </div>
        <p className="po-note">Click a month&apos;s bar to raise that market&apos;s demand (it starts over after the top). Click a month in the last row to mark it as a release window.</p>
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
          <p className="po-note">{quiet.length ? <>Quietest for both markets together: <b>{quiet.join(", ")}</b> (the orange marks under the chart).{chosen.length && !chosen.some((m) => quiet.includes(m)) ? " None of your windows is in a quietest month; is there a reason?" : ""}</> : "Shape the two demand curves and the quietest months are pointed out here."}</p>
          <Field k="why" st={st} op={op} readOnly={readOnly} rows={3} placeholder="Why these times minimize disruption to customers…" label="Why these times" />
        </section>
      </div>
    </div>
  );
}

// ---- Lesson 2 · writing features ---------------------------------------------------------------

const FEATURE_PARTS = [["desc", "Description", "What the feature does"], ["intent", "Intent", "What it is meant to achieve"], ["hyp", "Benefit hypothesis", "Name the primary customer and the benefit"], ["ac", "Acceptance criteria", "One per line"]] as const;
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
      <div className="po-epic">
        <span className="ex-mono">Epic</span>
        <p>{str(config.epic)}</p>
      </div>
      <div className="po-build">
        <span className="po-count" data-ok={feats.length >= 3 && done === feats.length}>{done}/{Math.max(3, feats.length)}</span>
        <p className="po-note">Step 1: at least three potential features for an MVP. Step 2: give each a description, its intent, a benefit hypothesis that names the primary customer, and acceptance criteria.</p>
      </div>
      <div className="po-feats">
        {example ? (
          <details className="po-feat example">
            <summary><span className="ex-mono">Example feature</span><b>{example.name}</b></summary>
            {FEATURE_PARTS.map(([k, label]) => (<p key={k}><span>{label}</span>{example[k]}</p>))}
          </details>
        ) : null}
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
  return (
    <div className="ex-board po">
      <section className="po-panel">
        <span className="ex-mono">Step 1 · Select one of the features from the previous activity</span>
        {feats.length ? (
          <div className="po-chips">
            {feats.map((f) => (<button key={f.id} disabled={readOnly} aria-pressed={picked?.id === f.id} onClick={() => op({ key: "rf:pick", op: "set", value: f.id })}>{str(f.name)}</button>))}
          </div>
        ) : (
          <p className="po-note">No features yet. Write them in the Writing features activity and they appear here.</p>
        )}
      </section>
      {picked ? (
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
              <pre className="po-prompt">{prompt}</pre>
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
          <article className={`po-feat wide${featureDone(picked) ? " done" : ""}`}>
            <header><span className="po-n">✎</span><b>{str(picked.name)}</b></header>
            <div className="po-two wide">
              {FEATURE_PARTS.map(([k, label, hint]) => (<FeatureText key={`${picked.id}:${k}`} f={picked} k={k} label={label} hint={hint} op={op} readOnly={readOnly} />))}
            </div>
            <p className="po-note">Editing here changes the feature on the Writing features board too.</p>
          </article>
        </>
      ) : null}
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
const DW = 150, DH = 44, DL = 150, DT = 34;
const depXY = (i: number) => { const [r, x] = DEP_CARDS[i]!; return [DL + x * DW + 14, DT + r * DH + DH / 2] as const; };
const DEP_FILL = { f: "#8fc1f0", d: "#e5231b", m: "#f5a85a" };
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
        <div className="po-legend left">
          {(["f", "d", "m"] as const).map((k) => (<span key={k}><i className="card" style={{ background: DEP_FILL[k] }} />{DEP_WORD[k]}</span>))}
          <span><i style={{ background: "#e5231b" }} />String: one waits on the other</span>
          <span style={{ ["--c" as string]: "#d98a1c" }}><i className="ring" />Flagged as an issue</span>
        </div>
        <div className="po-chartwrap">
          <svg className="po-deps" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 860 }} role="img" aria-label="ART planning board with features, significant dependencies, a milestone and the strings between them">
            <rect x="0" y="0" width={W} height={H} fill="#fff" stroke="#0d1815" strokeWidth="2" />
            {DEP_COLS.map((c, i) => (
              <g key={c}>
                <rect x={DL + i * DW} y="0" width={DW} height={DT} fill="#e9ecef" stroke="#0d181855" />
                <text x={DL + i * DW + DW / 2} y="22" textAnchor="middle" className="po-deps-h">{c}</text>
                <line x1={DL + i * DW} y1={DT} x2={DL + i * DW} y2={H} stroke="#0d181833" />
              </g>
            ))}
            {DEP_ROWS.map((r, i) => (
              <g key={r}>
                <rect x="0" y={DT + i * DH} width={DL} height={DH} fill="#e9ecef" stroke="#0d181855" />
                <rect x="0" y={DT + i * DH} width={(load[i]! / max) * DL} height={DH} fill="#e5231b" opacity={0.08 + (load[i]! / max) * 0.22} />
                <text x={DL / 2} y={DT + i * DH + DH / 2 + 4} textAnchor="middle" className="po-deps-h">{r}</text>
                <line x1="0" y1={DT + i * DH} x2={W} y2={DT + i * DH} stroke={i === 8 ? "#0d1815" : "#0d181833"} strokeWidth={i === 8 ? 2 : 1} />
              </g>
            ))}
            {DEP_LINKS.map(([a, b], i) => {
              const [x1, y1] = depXY(a), [x2, y2] = depXY(b), on = lit ? lit.has(a) && lit.has(b) && (a === hover || b === hover) : true;
              return <path key={i} className="po-string" d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2 + 26}, ${x2} ${(y1 + y2) / 2 - 26}, ${x2} ${y2}`} fill="none" stroke="#e5231b" strokeWidth={lit && on ? 3.5 : 2} opacity={on ? 0.9 : 0.12} style={{ animationDelay: `${i * 50}ms` }} />;
            })}
            {DEP_CARDS.map(([, , k], i) => {
              const [x, y] = depXY(i), dim = lit ? !lit.has(i) : false;
              return (
                <g key={i} className="po-depcard" opacity={dim ? 0.3 : 1} tabIndex={readOnly ? -1 : 0} role="button" aria-pressed={!!flags[i]} aria-label={`${DEP_WORD[k]}, ${DEP_ROWS[DEP_CARDS[i]![0]]}${flags[i] ? ", flagged" : ""}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} onClick={() => !readOnly && op({ key: "flags", op: "set", value: { ...flags, [i]: !flags[i] } })} onKeyDown={(e) => e.key === "Enter" && !readOnly && op({ key: "flags", op: "set", value: { ...flags, [i]: !flags[i] } })}>
                  {flags[i] ? <circle className="po-flag" cx={x} cy={y} r="22" fill="none" stroke="#d98a1c" strokeWidth="4" /> : null}
                  <rect x={x - 13} y={y - 13} width="26" height="26" rx="2" fill={DEP_FILL[k]} stroke="#0d1815" strokeWidth="1.5" />
                </g>
              );
            })}
          </svg>
        </div>
        <p className="po-note">Point at a card to follow its strings. Click a card to flag it as an issue. The red tint on a team&apos;s name grows with the number of strings that touch it: {DEP_ROWS.filter((_, i) => load[i] === max).join(" and ")} carry the most.</p>
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

export function PoStoryMapBoard({ config, st, op, readOnly }: BoardProps) {
  const feature = config.feature as Record<string, string> | undefined;
  const tasks = list(st, "tasks"), stories = list(st, "stories");
  const [task, setTask] = useState("");
  const must = tasks.flatMap((t) => stories.filter((s) => s.task === t.id && s.must === true));
  const addTask = () => task.trim() && tasks.length < 7 && (op({ key: "tasks", op: "push", value: { name: task.trim() } }), setTask(""));
  // The slide's own example: its activities, and the stories under the first one.
  const seed = config.seed as { tasks: string[]; must: string[]; later: string[] } | undefined;
  const [seeding, setSeeding] = useState(false);
  useEffect(() => {
    // Once the example's activities are saved (they have real ids), hang its stories under the first.
    if (!seeding || !seed || tasks.length < seed.tasks.length || tasks.some((t) => t.id.startsWith("tmp"))) return;
    setSeeding(false);
    for (const text of seed.must) op({ key: "stories", op: "push", value: { task: tasks[0]!.id, text, must: true } });
    for (const text of seed.later) op({ key: "stories", op: "push", value: { task: tasks[0]!.id, text, must: false } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seeding, tasks]);
  const loadExample = () => {
    if (!seed) return;
    for (const name of seed.tasks) op({ key: "tasks", op: "push", value: { name } });
    setSeeding(true);
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
      {seed && !readOnly && !tasks.length ? <button className="po-btn" onClick={loadExample}>Start from the example on the slide</button> : null}
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
              <b>{n === steps.length ? "All done. Welcome to the community." : "Tick each step as your group completes it"}</b>
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
          {!readOnly ? <AddLine label="What we found" placeholder="+ a post, event or tool worth sharing, Enter" onAdd={(text) => op({ key: "notes", op: "push", value: { text } })} /> : null}
        </section>
      </div>
    </div>
  );
}

export const POPM_KINDS = new Set(["po-intro", "po-mind", "po-ai", "po-msg", "po-rhythm", "po-feat", "po-refine", "po-cap", "po-vision", "po-deps", "po-map", "po-iter", "po-check"]);
const BOARDS: Record<string, (p: BoardProps) => ReactNode> = { "po-intro": PoIntroBoard, "po-mind": PoMindsetBoard, "po-ai": PoAiBoard, "po-msg": PoMessageBoard, "po-rhythm": PoRhythmBoard, "po-feat": PoFeatureBoard, "po-refine": PoRefineBoard, "po-cap": PoCapacityBoard, "po-vision": PoVisionBoard, "po-deps": PoDepsBoard, "po-map": PoStoryMapBoard, "po-iter": PoIterationBoard, "po-check": PoChecklistBoard };
export function PopmBoard(props: BoardProps & { kind: string }) {
  const B = BOARDS[props.kind] ?? PoMessageBoard;
  return <B {...props} />;
}
