"use client";

// The AI-Native ART launch readiness tool (core readiness.ts), in the Trainyard Glass design.
// Four views over one set of ratings: Results (the readiness ring, the shifts, the twelve success
// factors and the trainings that close the most gaps), the Readiness map (rate the 48 statements
// and write an action for each gap), the Launch plan (the actions in their three phases) and the
// Report (everything read back, with a CSV). Ratings and actions are single keys in the board's
// frame state, so several people can rate at once.

import { useEffect, useRef, useState } from "react";
import {
  READINESS_FACTORS, READINESS_PHASES, READINESS_RATINGS, READINESS_SHIFTS, READINESS_TRAINING_SITE,
  readinessAction, readinessAdvice, readinessCsv, readinessFactorScore, readinessKey, readinessRating, readinessTally, readinessVerdict,
  type Board, type ReadinessAction, type ReadinessFactor,
} from "@trainyard/core";
import { useFrameState } from "@/components/exercise-boards";

const VIEWS = [["results", "Results"], ["map", "Readiness map"], ["plan", "Launch plan"], ["report", "Report"]] as const;
type View = (typeof VIEWS)[number][0];
const VERDICT = { ready: ["Ready to launch", "rgba(47,158,122,0.22)", "#2f9e7a"], plan: ["Launch with a plan for the gaps", "rgba(217,148,0,0.22)", "#d99400"], "not-yet": ["Not yet: close the critical gaps first", "rgba(194,65,45,0.18)", "#c2412d"] } as const;
const RATING_WORD = { F: "fully in place", P: "partially in place", N: "not in place" } as const;

/** A number that counts up to its value when it changes. */
function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setShown(value);
    const start = from.current, t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(start + (value - start) * e));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => (cancelAnimationFrame(raf), void (from.current = value));
  }, [value]);
  return <>{shown}{suffix}</>;
}

export function ReadinessBoard({ board, readOnly, onChanged, onError }: { board: Board; readOnly: boolean; onChanged: () => void; onError: (m: string) => void }) {
  const [st, op] = useFrameState(board, board.frames[0]!, onChanged, onError);
  const [view, setView] = useState<View>("results");
  const [sel, setSel] = useState("SF1");
  const t = readinessTally(st);
  const set = (key: string, value: unknown) => op({ key, op: "set", value: value ?? null });
  const open = (code: string) => (setSel(code), setView("map"));
  const at = VIEWS.findIndex(([k]) => k === view);

  return (
    <div className="kb rd">
      <header className="kb-glass kb-head">
        <div className="kb-intro" style={{ maxWidth: 560 }}>
          <span className="kb-eyebrow">AI-Native SAFe · Launch readiness</span>
          <h2 className="kb-title">Is this ART ready to launch?</h2>
          <p>Rate the 48 statements, turn every gap into an action, and the launch plan, the results and the report build themselves.</p>
        </div>
        <div className="rd-stats">
          <div className="rd-stat"><b><CountUp value={t.ready} suffix="%" /></b><span>Ready</span></div>
          <div className="rd-stat"><b>{t.rated}/{t.total}</b><span>Statements assessed</span></div>
          <div className="rd-stat"><b>{t.covered}/{t.gaps}</b><span>Gaps with an action</span></div>
        </div>
        <div className="tb-switch rd-switch" role="tablist" aria-label="View" style={{ ["--at" as string]: at, ["--n" as string]: VIEWS.length }}>
          <i aria-hidden className="tb-switch-pill" />
          {VIEWS.map(([k, n]) => (
            <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}>{n}</button>
          ))}
        </div>
      </header>
      <div key={view} className="tb-view">
        {view === "results" ? <Results st={st} open={open} /> : view === "map" ? <ReadinessMap st={st} sel={sel} setSel={setSel} set={set} readOnly={readOnly} /> : view === "plan" ? <Plan st={st} set={set} open={open} readOnly={readOnly} /> : <Report st={st} set={set} readOnly={readOnly} name={board.name} />}
      </div>
    </div>
  );
}

type St = Record<string, unknown>;
const Pip = ({ r }: { r: string | null }) => <span className={`rd-pip ${r ?? ""}`} />;

function Results({ st, open }: { st: St; open: (code: string) => void }) {
  const t = readinessTally(st), v = VERDICT[readinessVerdict(t.ready)], C = 502.7;
  const advice = readinessAdvice(st), top = advice[0]?.weight || 1;
  const weakest = READINESS_FACTORS.map((f) => ({ f, s: readinessFactorScore(st, f) })).filter((x): x is { f: ReadinessFactor; s: number } => x.s !== null).sort((a, b) => a.s - b.s).slice(0, 3);
  const heat = (s: number | null) => (s === null ? ["rgba(23,33,43,0.08)", "#17212b"] : s >= 80 ? ["rgba(47,158,122,0.85)", "#fff"] : s >= 50 ? ["rgba(224,161,0,0.8)", "#2b2000"] : ["rgba(194,65,45,0.85)", "#fff"]);
  return (
    <div className="rd-dash">
      <section className="kb-glass rd-pad rd-c4" style={{ textAlign: "center" }}>
        <span className="kb-eyebrow">Launch readiness</span>
        <div className="tb-ring" style={{ margin: "0 auto" }}>
          <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label={`${t.ready}% ready`}>
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(23,33,43,0.08)" strokeWidth="18" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(47,158,122,0.3)" strokeWidth="18" strokeDasharray={`${C * 0.2} ${C}`} strokeDashoffset={-C * 0.8} transform="rotate(-90 100 100)" />
            <circle className="tb-ring-v" cx="100" cy="100" r="80" fill="none" stroke={t.rated ? v[2] : "transparent"} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - t.ready / 100)} transform="rotate(-90 100 100)" />
          </svg>
          <div>
            <span className="tb-pct"><CountUp value={t.ready} suffix="%" /></span>
            <span className="kb-note" style={{ padding: 0 }}>{t.rated} of {t.total} rated</span>
          </div>
        </div>
        {t.rated ? <span className="tb-verdict" style={{ background: v[1], alignSelf: "center" }}>{v[0]}</span> : <span className="kb-note" style={{ padding: 0 }}>Nothing rated yet. Open the Readiness map to start.</span>}
        <span className="kb-note" style={{ padding: 0 }}>Fully in place counts in full, partially in place counts half. The green arc is the 80 to 100% band.</span>
      </section>
      <section className="kb-glass rd-pad rd-c8">
        <span className="kb-eyebrow">Readiness by shift</span>
        {READINESS_SHIFTS.map((name, si) => {
          const x = readinessTally(st, READINESS_FACTORS.filter((f) => f.shift === si).flatMap((f) => f.statements.map((_, i) => readinessKey(f.code, i))));
          return (
            <div key={name} className="rd-shiftbar">
              <div><b>Shift {si + 1}: {name}</b><span className="kb-note" style={{ padding: 0 }}>{x.F} fully · {x.P} partially · {x.N} not</span></div>
              <div className="rd-sbar">
                <div className="rd-track" role="img" aria-label={`${x.ready}% ready`}>
                  <i style={{ width: `${(x.F / x.total) * 100}%`, background: "#2f9e7a" }} /><i style={{ width: `${(x.P / x.total) * 100}%`, background: "#e0a100" }} /><i style={{ width: `${(x.N / x.total) * 100}%`, background: "#c2412d" }} />
                </div>
                <b>{x.ready}%</b>
              </div>
            </div>
          );
        })}
        <span className="kb-eyebrow" style={{ marginTop: 6 }}>Success factors</span>
        <div className="rd-heat">
          {READINESS_FACTORS.map((f) => {
            const s = readinessFactorScore(st, f), c = heat(s);
            return (
              <button key={f.code} className="rd-cell" style={{ background: c[0], color: c[1] }} aria-label={`${f.code} ${f.name}: ${s === null ? "not rated" : `${s}% in place`}`} onClick={() => open(f.code)}>
                <small>{f.code} · {s === null ? "not rated" : `${s}%`}</small>
                <b>{f.name}</b>
              </button>
            );
          })}
        </div>
      </section>
      <section className="kb-glass rd-pad rd-c12">
        <div className="rd-advhead">
          <div>
            <span className="kb-eyebrow">Advice from your results</span>
            <h3 className="kb-name" style={{ fontSize: 21 }}>Where to start, and the training that closes the most gaps</h3>
          </div>
          <a href={`${READINESS_TRAINING_SITE}/about/contact/`} target="_blank" rel="noopener noreferrer">Talk to an advisor at Agile Agilist ↗</a>
        </div>
        {weakest.length && advice.length ? (
          <p>Your weakest success factors are {weakest.map((x, i) => (<span key={x.f.code}>{i ? (i === weakest.length - 1 ? " and " : ", ") : ""}<b>{x.f.name} ({x.s}%)</b></span>))}. The suggestions below are ranked by how many of your open gaps each one addresses; courses that are launching soon come last.</p>
        ) : (
          <p className="kb-note" style={{ padding: 0 }}>{t.rated ? "No gaps: every rated statement is fully in place." : "Rate some statements and the advice appears here."}</p>
        )}
        {advice.map((c, i) => (
          <div key={c.id} className="rd-rec" style={{ animationDelay: `${i * 90}ms` }}>
            <span className="rd-n">{c.kind === "soon" ? "+" : i + 1}</span>
            <div className="rd-recbody">
              <b>{c.name}{c.kind === "soon" ? <span className="rd-soon">Launching soon</span> : c.kind === "free" ? <span className="rd-soon free">Free</span> : null}</b>
              <span className="kb-note" style={{ padding: 0 }}>{c.why}</span>
              <div className="rd-tags">{c.closes.map((code) => (<span key={code}>{code} · {READINESS_FACTORS.find((f) => f.code === code)!.name}</span>))}</div>
              <div className="rd-impact" role="img" aria-label={`Relative impact ${Math.round((c.weight / top) * 100)}%`}><i style={{ width: `${(c.weight / top) * 100}%` }} /></div>
            </div>
            <a className="rd-go" href={READINESS_TRAINING_SITE + c.path} target="_blank" rel="noopener noreferrer">{c.kind === "free" ? "Take the assessment ↗" : c.kind === "soon" ? "Learn more ↗" : "See the course ↗"}</a>
          </div>
        ))}
        {t.gaps >= 12 ? <p className="kb-note" style={{ padding: 0 }}>With this many gaps across the ART, a private cohort is usually the faster route: <a href={`${READINESS_TRAINING_SITE}/team-training/`} target="_blank" rel="noopener noreferrer">Team &amp; Corporate Training ↗</a></p> : null}
      </section>
    </div>
  );
}

function ReadinessMap({ st, sel, setSel, set, readOnly }: { st: St; sel: string; setSel: (c: string) => void; set: (k: string, v: unknown) => void; readOnly: boolean }) {
  const f = READINESS_FACTORS.find((x) => x.code === sel) ?? READINESS_FACTORS[0]!;
  return (
    <div className="kb-row">
      <section className="kb-glass rd-map" aria-label="Readiness map">
        {READINESS_SHIFTS.map((name, si) => {
          const fs = READINESS_FACTORS.filter((x) => x.shift === si), done = fs.flatMap((x) => x.statements.map((_, i) => readinessRating(st, readinessKey(x.code, i)))).filter(Boolean).length;
          return (
            <div key={name} className="rd-shift">
              <header><span className="kb-eyebrow">Shift {si + 1}</span><b>{name}</b><span className="kb-note" style={{ padding: 0 }}>{done}/12 rated</span></header>
              {fs.map((x) => {
                const rs = x.statements.map((_, i) => readinessRating(st, readinessKey(x.code, i)));
                const openGaps = x.statements.filter((_, i) => ["P", "N"].includes(rs[i] ?? "") && !readinessAction(st, readinessKey(x.code, i))).length;
                return (
                  <button key={x.code} className="rd-tile" aria-pressed={sel === x.code} onClick={() => setSel(x.code)}>
                    <small>{x.code}</small>
                    <b>{x.name}</b>
                    <span className="rd-pips" role="img" aria-label={rs.map((r) => (r ? RATING_WORD[r] : "not rated")).join(", ")}>
                      {rs.map((r, i) => (<Pip key={i} r={r} />))}
                      {openGaps ? <span className="rd-need">{openGaps} gap{openGaps > 1 ? "s" : ""} open</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </section>
      <aside className="kb-glass kb-side" style={{ flexBasis: 380 }} aria-live="polite">
        <span className="kb-eyebrow">{f.code} · Shift {f.shift + 1}</span>
        <h3 className="kb-name" style={{ fontSize: 21 }}>{f.name}</h3>
        {f.statements.map((text, i) => {
          const k = readinessKey(f.code, i), r = readinessRating(st, k), a = (st[`a:${k}`] as ReadinessAction | undefined) ?? { text: "", phase: 0 };
          return (
            <div key={k} className="rd-stmt">
              <p>{text}</p>
              <div className="rd-rate" role="group" aria-label="Rating">
                {READINESS_RATINGS.map(([c, n]) => (
                  <button key={c} className={c} aria-pressed={r === c} disabled={readOnly} onClick={() => set(`r:${k}`, r === c ? null : c)}><i />{n}</button>
                ))}
              </div>
              {r === "P" || r === "N" ? (
                <div className="rd-gap">
                  <label className="kb-eyebrow" htmlFor={`rd-a-${k}`}>Action to close this gap</label>
                  <input id={`rd-a-${k}`} key={k + (a.text ?? "")} defaultValue={a.text ?? ""} disabled={readOnly} placeholder="What will we do?" maxLength={300} onBlur={(e) => e.target.value !== (a.text ?? "") && set(`a:${k}`, e.target.value.trim() ? { ...a, text: e.target.value.trim() } : null)} />
                  <input key={k + "o" + (a.owner ?? "")} defaultValue={a.owner ?? ""} disabled={readOnly || !a.text} placeholder="Owner" aria-label="Owner" maxLength={80} onBlur={(e) => a.text && e.target.value !== (a.owner ?? "") && set(`a:${k}`, { ...a, owner: e.target.value.trim() })} />
                  <div className="rd-chips" role="group" aria-label="When">
                    {READINESS_PHASES.map(([p], pi) => (
                      <button key={p} aria-pressed={!!a.text && a.phase === pi} disabled={readOnly || !a.text} onClick={() => set(`a:${k}`, { ...a, phase: pi })}>{p}</button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </aside>
    </div>
  );
}

function Plan({ st, set, open, readOnly }: { st: St; set: (k: string, v: unknown) => void; open: (code: string) => void; readOnly: boolean }) {
  const all = READINESS_FACTORS.flatMap((f) => f.statements.map((text, i) => ({ f, text, k: readinessKey(f.code, i) }))).filter((x) => ["P", "N"].includes(readinessRating(st, x.k) ?? ""));
  const openGaps = all.filter((x) => !readinessAction(st, x.k));
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="kb-scroll">
        <div className="rd-lanes">
          {READINESS_PHASES.map(([p, sub], pi) => {
            const acts = all.map((x) => ({ ...x, a: readinessAction(st, x.k) })).filter((x) => x.a && x.a.phase === pi);
            return (
              <section key={p} className="rd-lane">
                <div><h3 className="kb-name" style={{ fontSize: 20 }}>{p}</h3><span className="kb-note" style={{ padding: 0 }}>{sub}</span></div>
                {acts.length ? acts.map((x) => (
                  <div key={x.k} className="rd-act">
                    <b>{x.a!.text}</b>
                    <small>{x.f.code} · {readinessRating(st, x.k) === "N" ? "Not in place" : "Partially in place"}{x.a!.owner ? ` · ${x.a!.owner}` : ""}</small>
                    <span className="kb-note" style={{ padding: 0 }}>{x.text}</span>
                    {!readOnly ? (
                      <div className="rd-chips">
                        {pi > 0 ? <button onClick={() => set(`a:${x.k}`, { ...x.a, phase: pi - 1 })}>← Sooner</button> : null}
                        {pi < 2 ? <button onClick={() => set(`a:${x.k}`, { ...x.a, phase: pi + 1 })}>Later →</button> : null}
                        <button onClick={() => open(x.f.code)}>Edit</button>
                      </div>
                    ) : null}
                  </div>
                )) : <p className="kb-note" style={{ padding: 0 }}>No actions in this phase.</p>}
              </section>
            );
          })}
        </div>
      </div>
      <section className="kb-glass rd-pad">
        <h3 className="kb-name" style={{ fontSize: 20 }}>{openGaps.length} gap{openGaps.length === 1 ? "" : "s"} with no action yet</h3>
        {openGaps.length ? <p className="kb-note" style={{ padding: 0 }}>Select one to open its success factor and write the action.</p> : null}
        <div className="rd-open">
          {openGaps.map((x) => (<button key={x.k} onClick={() => open(x.f.code)}><b>{x.f.code} · </b>{x.text}</button>))}
        </div>
      </section>
    </div>
  );
}

function Report({ st, set, readOnly, name }: { st: St; set: (k: string, v: unknown) => void; readOnly: boolean; name: string }) {
  const t = readinessTally(st);
  const csv = () => {
    const url = URL.createObjectURL(new Blob([readinessCsv(st)], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${name.replace(/[^\w-]+/g, "-").toLowerCase() || "launch-readiness"}.csv` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const share = (k: string, label: string, hint: string) => (
    <label className="kb-field">
      <b>{label}</b>
      <span className="kb-note" style={{ padding: 0 }}>{hint}</span>
      <textarea key={k + String(st[k] ?? "")} rows={3} defaultValue={typeof st[k] === "string" ? (st[k] as string) : ""} disabled={readOnly} placeholder="Not yet answered." onBlur={(e) => e.target.value !== (st[k] ?? "") && set(k, e.target.value)} />
    </label>
  );
  return (
    <div className="stack" style={{ gap: 16 }}>
      <section className="rd-cover">
        <span className="kb-eyebrow">Launch readiness report</span>
        <h3 className="kb-title" style={{ color: "#fff" }}>AI-Native ART Launch Readiness</h3>
        <div className="rd-stats">
          <div className="rd-stat"><b>{t.ready}%</b><span>Ready</span></div>
          <div className="rd-stat"><b>{t.rated}/{t.total}</b><span>Statements assessed</span></div>
          <div className="rd-stat"><b>{t.covered}/{t.gaps}</b><span>Gaps addressed</span></div>
        </div>
        <div className="kb-actions"><button className="kb-btn" onClick={csv}>Download CSV</button></div>
      </section>
      <div className="rd-rep">
        {READINESS_FACTORS.map((f) => (
          <section key={f.code} className="kb-glass rd-pad">
            <span className="kb-eyebrow">{f.code} · Shift {f.shift + 1}</span>
            <b className="kb-name" style={{ fontSize: 17 }}>{f.name}</b>
            {f.statements.map((s, i) => (<div key={i} className="rd-line"><Pip r={readinessRating(st, readinessKey(f.code, i))} /><span>{s}</span></div>))}
          </section>
        ))}
      </div>
      <section className="kb-glass rd-pad">
        <h3 className="kb-name" style={{ fontSize: 20 }}>Share your plan</h3>
        <p className="kb-note" style={{ padding: 0 }}>Consider who needs to see this plan and how you will share it with them.</p>
        {share("share:who", "Name the people, the format, and what you need from them when they see it", "")}
        {share("share:how", "What is your ongoing plan for communication?", "The AI-Native Launch Plan is a living document.")}
      </section>
    </div>
  );
}
