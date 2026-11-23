"use client";

// The exercise boards of the AI-Empowered SAFe POPM class (lesson 1): who is in the group and what
// they want to learn, the Lean-Agile mindset scenario, AI's disruption of product work, and the
// prompt builder for the SAFe message. Each keeps what people add in the frame's state.

import { useEffect, useState } from "react";
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

const EXPERIENCE = [["agile", "Working in an Agile environment"], ["other", "Working outside of an Agile environment"], ["po", "Product Owner role"], ["pm", "Product Manager role"]] as const;
const LEVELS = ["None", "A little", "Some", "A lot"];

export function PoIntroBoard({ st, op, readOnly }: BoardProps) {
  const people = list(st, "people");
  const [draft, setDraft] = useState<{ name: string; learn: string; lv: Record<string, number> }>({ name: "", learn: "", lv: {} });
  const add = () => {
    if (!draft.name.trim()) return;
    op({ key: "people", op: "push", value: { name: draft.name.trim(), learn: draft.learn.trim(), ...draft.lv } });
    setDraft({ name: "", learn: "", lv: {} });
  };
  return (
    <div className="ex-board po">
      <div className="po-two">
        <section className="po-panel">
          <span className="ex-mono">Step 1 · Introduce yourself</span>
          {!readOnly ? (
            <>
              <input className="po-input" value={draft.name} placeholder="Your name" aria-label="Your name" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              {EXPERIENCE.map(([k, label]) => (
                <div key={k} className="po-meter-row">
                  <span>{label}</span>
                  <div className="po-seg" role="group" aria-label={label}>
                    {LEVELS.map((l, i) => (
                      <button key={l} aria-pressed={(draft.lv[k] ?? -1) === i} onClick={() => setDraft({ ...draft, lv: { ...draft.lv, [k]: i } })}>{l}</button>
                    ))}
                  </div>
                </div>
              ))}
              <span className="ex-mono" style={{ marginTop: 6 }}>Step 2 · The most important thing I want to learn</span>
              <textarea className="po-text" rows={2} value={draft.learn} placeholder="From this course, I most want to learn…" aria-label="The most important thing I want to learn" onChange={(e) => setDraft({ ...draft, learn: e.target.value })} />
              <button className="po-btn" disabled={!draft.name.trim()} onClick={add}>Add me to the group</button>
            </>
          ) : (
            <p className="po-note">Each person adds their name, their experience and what they want to learn.</p>
          )}
        </section>
        <section className="po-panel po-profile">
          <span className="ex-mono">Our group · {people.length} {people.length === 1 ? "person" : "people"}</span>
          {EXPERIENCE.map(([k, label]) => {
            const avg = people.length ? people.reduce((n, p) => n + num(p[k]), 0) / people.length : 0;
            return (
              <div key={k} className="po-bar-row">
                <span>{label}</span>
                <div className="po-bar" role="img" aria-label={`${label}: ${people.length ? LEVELS[Math.round(avg)] : "nobody yet"}`}>
                  <i style={{ width: `${(avg / 3) * 100}%` }} />
                  {people.map((p) => (<b key={p.id} title={`${str(p.name)}: ${LEVELS[num(p[k])]}`} style={{ left: `${(num(p[k]) / 3) * 100}%` }} />))}
                </div>
                <small>{people.length ? LEVELS[Math.round(avg)] : "–"}</small>
              </div>
            );
          })}
          <p className="po-note">The bar is the group&apos;s average; each dot is one person.</p>
        </section>
      </div>
      <div className="po-people">
        {people.map((p, i) => (
          <article key={p.id} className="po-person" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
            <header>
              <span className="po-avatar" aria-hidden>{str(p.name).slice(0, 1).toUpperCase()}</span>
              <b>{str(p.name)}</b>
              {!readOnly ? <button className="ex-x" aria-label={`Remove ${str(p.name)}`} onClick={() => op({ key: "people", op: "remove", id: p.id })}>×</button> : null}
            </header>
            <div className="po-pips">
              {EXPERIENCE.map(([k, label]) => (
                <span key={k} title={`${label}: ${LEVELS[num(p[k])]}`}>
                  <small>{k === "agile" ? "Agile" : k === "other" ? "Non-Agile" : k.toUpperCase()}</small>
                  {[1, 2, 3].map((n) => (<i key={n} className={num(p[k]) >= n ? "on" : ""} />))}
                </span>
              ))}
            </div>
            {str(p.learn) ? <p><span className="ex-mono">Wants to learn</span>{str(p.learn)}</p> : null}
          </article>
        ))}
        {!people.length ? <p className="po-empty">Nobody yet. Add yourself on the left, then introduce yourself to your group.</p> : null}
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
                <span className="po-n">✦</span>
                <b>{name}</b>
              </header>
              <p className="po-q">{question}</p>
              {mine.map((n) => (
                <div key={n.id} className={`po-sticky k${num(n.kind)}${n.star ? " star" : ""}`}>
                  <small>{AI_KINDS[num(n.kind)]}</small>
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
                  <div className="po-seg small" role="group" aria-label="This is">
                    {AI_KINDS.map((t, ti) => (<button key={t} aria-pressed={(kind[li] ?? 0) === ti} onClick={() => setKind({ ...kind, [li]: ti })}>{t}</button>))}
                  </div>
                  <AddLine label={name} placeholder="+ what changes, Enter" onAdd={(text) => op({ key: "notes", op: "push", value: { lens: li, kind: kind[li] ?? 0, text } })} />
                </>
              ) : null}
            </section>
          );
        })}
      </div>
      <section className="po-share">
        <span className="ex-mono">Step 2 · What we share with the class</span>
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

export const POPM_KINDS = new Set(["po-intro", "po-mind", "po-ai", "po-msg"]);
export function PopmBoard(props: BoardProps & { kind: string }) {
  return props.kind === "po-intro" ? <PoIntroBoard {...props} /> : props.kind === "po-mind" ? <PoMindsetBoard {...props} /> : props.kind === "po-ai" ? <PoAiBoard {...props} /> : <PoMessageBoard {...props} />;
}
