"use client";

// The interactive Northstar Bank example: an objective with key results and KPIs, the two
// value streams, the alignment from portfolio to teams, a key result carried by a KPI over
// four quarters, a dashboard whose values you can move, the three measurement lenses and the
// quarterly review. Everything is local state; nothing is saved.

import { useMemo, useState } from "react";
import { NORTHSTAR as N, type Measure } from "@/lib/examples";

const fmt = (m: Measure, v: number) => (m.unit === "$" ? `$${v.toFixed(2)}` : m.unit === "%" ? `${Number.isInteger(v) ? v : v.toFixed(1)}%` : `${Number.isInteger(v) ? v : v.toFixed(1)} ${m.unit}`);

function status(m: Measure, v: number): { on: boolean; text: string } {
  const met = m.higherIsBetter ? v >= m.target : v <= m.target;
  if (met) return { on: true, text: "On target" };
  return { on: false, text: m.higherIsBetter ? `Below target: needs to rise to ${fmt(m, m.target)}` : `Above target: needs to fall to ${fmt(m, m.target)}` };
}

export function OkrExplorer() {
  const [kr, setKr] = useState<string | null>(null);
  const [stream, setStream] = useState<"operational" | "development">("operational");
  const [level, setLevel] = useState("channels");
  const [quarter, setQuarter] = useState(3);
  const [values, setValues] = useState(() => N.dashboard.map((m) => m.current));
  const [scope, setScope] = useState("All");
  const [lens, setLens] = useState("outcomes");
  const [checked, setChecked] = useState<boolean[]>(() => N.review.map(() => false));

  const trace = useMemo(() => {
    const ids = new Set<string>();
    let cur: string | undefined = level;
    while (cur) {
      ids.add(cur);
      cur = N.levels.find((l) => l.id === cur)?.parent;
    }
    return ids;
  }, [level]);
  const sel = N.levels.find((l) => l.id === level)!;
  const ab = N.abandonment;
  const met = ab.values[quarter]! <= ab.target;
  const scopes = ["All", ...new Set(N.dashboard.map((m) => m.scope))];
  const s = N.streams[stream];
  const onTarget = N.dashboard.filter((m, i) => status(m, values[i]!).on).length;

  return (
    <div className="ex">
      {/* 1 · Objective, key results, KPIs */}
      <section className="ex-block">
        <div className="ex-eyebrow">01 · The objective</div>
        <div className="ex-hero">
          <div className="ex-obj">
            <span className="ex-tag">Objective</span>
            <p className="ex-obj-text">{N.objective}</p>
          </div>
          <div className="ex-col">
            <span className="ex-tag">Key results · time-bound change</span>
            {N.krs.map((k) => (
              <button key={k.id} className={`ex-kr${kr === k.id ? " on" : ""}`} onClick={() => setKr(kr === k.id ? null : k.id)} aria-pressed={kr === k.id}>
                <b>{k.label}</b>
                <span>
                  {k.from}
                  {k.unit} → {k.to}
                  {k.unit}
                </span>
              </button>
            ))}
          </div>
          <div className="ex-col">
            <span className="ex-tag">KPIs · ongoing health</span>
            {[...N.kpis, ...N.krs.map((k) => k.kpi).filter((x) => !N.kpis.includes(x))].map((k) => {
              const lit = kr && N.krs.find((x) => x.id === kr)?.kpi === k;
              return (
                <span key={k} className={`ex-kpi${lit ? " lit" : ""}`}>
                  {k}
                  {lit ? " · measures this KR" : ""}
                </span>
              );
            })}
          </div>
        </div>
        <p className="ex-note">
          <b>Click a key result</b> to see the KPI that measures it. The key result ends when it is met; the KPI keeps running. Business outcome: {N.outcome}
        </p>
      </section>

      {/* 2 · Value streams */}
      <section className="ex-block">
        <div className="ex-eyebrow">02 · Where value flows</div>
        <div className="toggle" role="group" aria-label="Value stream">
          <button aria-pressed={stream === "operational"} onClick={() => setStream("operational")}>
            Operational
          </button>
          <button aria-pressed={stream === "development"} onClick={() => setStream("development")}>
            Development
          </button>
        </div>
        <h3 className="ex-h3">{s.title}</h3>
        <p className="ex-sub">{s.blurb}</p>
        <div className={`ex-chevrons ${stream}`}>
          {s.steps.map((st) => (
            <span key={st} className="ex-chev">
              {st}
            </span>
          ))}
        </div>
        <p className="ex-sub">
          <b>KPIs:</b> {s.kpis.join(" · ")}
        </p>
        <p className="ex-note">ARTs deliver solutions within the development value stream; those solutions enable the operational value stream. Measure each with its own KPIs.</p>
      </section>

      {/* 3 · Alignment */}
      <section className="ex-block">
        <div className="ex-eyebrow">03 · One outcome, traced from portfolio to teams</div>
        <div className="ex-align">
          <div className="ex-tree" role="group" aria-label="Levels">
            {N.levels.map((l) => (
              <button key={l.id} aria-pressed={level === l.id} className={`ex-level${trace.has(l.id) ? " trace" : ""}${level === l.id ? " on" : ""}`} onClick={() => setLevel(l.id)} style={{ marginLeft: l.id === "portfolio" ? 0 : l.id === "dvs" ? 24 : l.id === "teams" ? 72 : 48 }}>
                <span className="ex-level-k">{l.level}</span>
                <span>{l.objective}</span>
              </button>
            ))}
          </div>
          <div className="ex-detail" aria-live="polite">
            <span className="ex-tag">{sel.level}</span>
            <h3 className="ex-h3">{sel.objective}</h3>
            <dl>
              <dt>Key result</dt>
              <dd>{sel.kr}</dd>
              <dt>KPIs to watch</dt>
              <dd>{sel.kpis.join(", ")}</dd>
              <dt>Contributes to</dt>
              <dd>{sel.parent ? N.levels.find((l) => l.id === sel.parent)!.objective : "The business objective"}</dd>
            </dl>
            <p className="ex-sub">{sel.note}</p>
          </div>
        </div>
        <p className="ex-note">
          <b>Click a level</b> to trace it up to the portfolio. One outcome-driven example, not a mandatory separate OKR at every level.
        </p>
      </section>

      {/* 4 · KR carried by a KPI */}
      <section className="ex-block">
        <div className="ex-eyebrow">04 · Digital Channels ART · payment abandonment</div>
        <h3 className="ex-h3">One KPI can carry a time-bound key result</h3>
        <div className="ex-chart" role="figure" aria-label={`Abandonment by quarter: ${ab.quarters.map((q, i) => `${q} ${ab.values[i]}%`).join(", ")}; target ${ab.target}%`}>
          <div className="ex-target" style={{ bottom: `${(ab.target / 35) * 100}%` }}>
            <span>Target {ab.target}% by Q4</span>
          </div>
          {ab.values.map((v, i) => (
            <button key={i} className={`ex-bar${i <= quarter ? " shown" : ""}${i === quarter ? " on" : ""}`} onClick={() => setQuarter(i)} aria-label={`${ab.quarters[i]}: ${v}%`}>
              <span className="ex-bar-v">{i <= quarter ? `${v}%` : ""}</span>
              <span className="ex-bar-fill" style={{ height: i <= quarter ? `${(v / 35) * 100}%` : "0%" }} />
              <span className="ex-bar-q">{ab.quarters[i]}</span>
            </button>
          ))}
        </div>
        <input className="ex-range" type="range" min={0} max={3} step={1} value={quarter} onChange={(e) => setQuarter(Number(e.target.value))} aria-label="Quarter" />
        <div className="ex-two">
          <div className={`ex-card ${met ? "good" : ""}`}>
            <b>Key result</b>
            <p>{met ? `Met in ${ab.quarters[quarter]} at ${ab.values[quarter]}%: the key result closes; next quarter sets a new one.` : `${ab.quarters[quarter]}: ${ab.values[quarter]}%, ${ab.values[quarter]! - ab.target} points above the ${ab.target}% target. Still open.`}</p>
          </div>
          <div className="ex-card">
            <b>KPI</b>
            <p>Abandonment stays on the dashboard every quarter, met or not, to catch a slide back.</p>
          </div>
        </div>
        <p className="ex-note">
          <b>Move through the quarters.</b> The key result ends when achieved. The KPI continues to be monitored.
        </p>
      </section>

      {/* 5 · Dashboard */}
      <section className="ex-block">
        <div className="ex-eyebrow">05 · Executive dashboard · KPI health by scope</div>
        <div className="ex-row">
          <div className="toggle ex-scopes" role="group" aria-label="Scope">
            {scopes.map((sc) => (
              <button key={sc} aria-pressed={scope === sc} onClick={() => setScope(sc)}>
                {sc}
              </button>
            ))}
          </div>
          <span className="ex-sub">
            {onTarget} of {N.dashboard.length} on target
          </span>
        </div>
        <div className="ex-dash">
          {N.dashboard.map((m, i) =>
            scope === "All" || scope === m.scope ? (
              <div key={m.measure} className="ex-meter">
                <div className="ex-meter-head">
                  <span className="ex-tag">{m.scope}</span>
                  <b>{m.measure}</b>
                </div>
                <div className="ex-meter-nums">
                  <span>
                    Now <b>{fmt(m, values[i]!)}</b>
                  </span>
                  <span>
                    Target <b>{fmt(m, m.target)}</b>
                  </span>
                </div>
                <input type="range" min={m.min} max={m.max} step={m.step} value={values[i]} onChange={(e) => setValues(values.map((x, j) => (j === i ? Number(e.target.value) : x)))} aria-label={`${m.measure} current value`} />
                <span className={`ex-status ${status(m, values[i]!).on ? "good" : "bad"}`}>{status(m, values[i]!).text}</span>
              </div>
            ) : null,
          )}
        </div>
        <p className="ex-note">
          <b>Drag a value</b> to see the status change. Some measures improve upward (adoption, success rate), others downward (cost, time, abandonment). Hypothetical current values.
        </p>
        <button className="pill" onClick={() => setValues(N.dashboard.map((m) => m.current))}>
          Reset values
        </button>
      </section>

      {/* 6 · Lenses */}
      <section className="ex-block">
        <div className="ex-eyebrow">06 · A balanced measurement system</div>
        <div className="ex-lenses">
          {N.lenses.map((l) => (
            <button key={l.id} className={`ex-lens${lens === l.id ? " on" : ""}`} onClick={() => setLens(l.id)} aria-pressed={lens === l.id}>
              <b>{l.title}</b>
              <span>{l.question}</span>
              {lens === l.id ? <em>{l.measures.join(" · ")}</em> : null}
            </button>
          ))}
        </div>
        <p className="ex-note">Outcomes, flow and competency together keep delivery activity from passing for customer value. Review OKRs and KPIs together, and validate outcomes with real customer evidence.</p>
      </section>

      {/* 7 · Review */}
      <section className="ex-block">
        <div className="ex-eyebrow">07 · The quarterly review</div>
        <h3 className="ex-h3">What should we inspect?</h3>
        <ol className="ex-review">
          {N.review.map((q, i) => (
            <li key={q}>
              <label>
                <input type="checkbox" checked={checked[i]} onChange={() => setChecked(checked.map((c, j) => (j === i ? !c : c)))} />
                <span>{q}</span>
              </label>
            </li>
          ))}
        </ol>
        <p className="ex-sub">
          {checked.filter(Boolean).length} of {N.review.length} discussed
        </p>
      </section>
    </div>
  );
}
