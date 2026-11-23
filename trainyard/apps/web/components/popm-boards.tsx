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

export function PoAiBoard({ config, st, op, readOnly }: BoardProps) {
  const lenses = (config.lenses as [string, string][] | undefined) ?? [];
  const kinds = (config.kinds as string[] | undefined) ?? AI_KINDS;
  const notes = list(st, "notes");
  const [kind, setKind] = useState<Record<number, number>>({});
  const starred = notes.filter((n) => n.star === true);
  return (
    <div className="ex-board po">
      <div className="ex-intro">{str(config.prompt)}</div>
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
  ["role", "Role", "What persona or expertise should the AI assume?"],
  ["task", "Task", "What exactly do you want the AI to do?"],
  ["context", "Context", "What background does it need?"],
  ["details", "Details", "Tone, length, format, what to leave out."],
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

export const POPM_KINDS = new Set(["po-intro", "po-mind", "po-ai", "po-msg", "po-rhythm", "po-feat", "po-refine", "po-cap"]);
const BOARDS: Record<string, (p: BoardProps) => ReactNode> = { "po-intro": PoIntroBoard, "po-mind": PoMindsetBoard, "po-ai": PoAiBoard, "po-msg": PoMessageBoard, "po-rhythm": PoRhythmBoard, "po-feat": PoFeatureBoard, "po-refine": PoRefineBoard, "po-cap": PoCapacityBoard };
export function PopmBoard(props: BoardProps & { kind: string }) {
  const B = BOARDS[props.kind] ?? PoMessageBoard;
  return <B {...props} />;
}
