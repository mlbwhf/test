"use client";

// Envision the future state, the way SAFe runs it: the current portfolio canvas on the left,
// divergent thinking into several candidate future states (from SWOT and TOWS), convergent
// thinking that scores and selects one, then the epics and enablers that get there.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

type Criterion = { key: string; label: string; weight: number; lowerIsBetter?: boolean; prompt: string };
type Option = { id: string; title: string; option: { emphasis: string; quadrants: string[]; scores?: Record<string, number>; rationale?: string; selected?: boolean }; score: number | null; changes: string[]; updatedAt: string };
type Envision = {
  current: { id: string; title: string }[];
  swot: { id: string; title: string }[];
  tows: { id: string; title: string; strategies: number }[];
  options: Option[];
  selected: string | null;
  criteria: Criterion[];
  hasPortfolio: boolean;
  valueStreams: { id: string; name: string }[];
};
type Draft = { title: string; kind: "business" | "enabler"; hypothesis: string; change: string; exists: boolean };

const EMPHASIS_LABEL: Record<string, string> = { offensive: "Offensive", defensive: "Defensive", "fix-first": "Fix first", balanced: "Balanced", custom: "Custom" };

export default function VisionPage() {
  const data = useApi<Envision>("/v1/canvases/envision");
  const [err, setErr] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState("");
  const [towsId, setTowsId] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const d = data.data;
  useEffect(() => {
    if (!d) return;
    if (!currentId && d.current[0]) setCurrentId(d.current[0].id);
    if (!towsId && d.tows[0]) setTowsId(d.tows[0].id);
    if (d.selected) setStep((s) => (s === 1 ? 3 : s));
    else if (d.options.length) setStep((s) => (s === 1 ? 2 : s));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d?.selected, d?.options.length, d?.current.length]);

  const run = async (fn: () => Promise<unknown>) => {
    setErr(null);
    setBusy(true);
    try {
      await fn();
      await data.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    } finally {
      setBusy(false);
    }
  };

  if (!d) return <Loading error={data.error} />;
  const selected = d.options.find((o) => o.id === d.selected) ?? null;
  const ranked = [...d.options].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  return (
    <>
      <PageHead
        title="Envision the future state"
        sub="The portfolio canvas captures the current state. SWOT and TOWS brainstorm potential future states (divergent thinking). Evaluate the options and select one (convergent thinking). Identify the epics and enablers that get you there."
        actions={
          <Link href="/portfolio" className="btn ghost">
            Portfolio Kanban
          </Link>
        }
      />
      {err ? <ErrorList title="That did not work" items={[{ message: err }]} /> : null}

      <div className="row" role="group" aria-label="Steps" style={{ gap: 8 }}>
        {([1, 2, 3] as const).map((n) => (
          <button key={n} className={`btn small ${step === n ? "primary" : ""}`} onClick={() => setStep(n)} aria-pressed={step === n} disabled={n === 2 && !d.options.length ? true : n === 3 && !selected}>
            <span className="ev-num" style={{ background: n === 1 ? "#b43a2e" : n === 2 ? "#1f5f3a" : "#2a6aa8" }}>
              {n}
            </span>{" "}
            {n === 1 ? "Explore possibilities" : n === 2 ? "Make decisions" : "Identify epics"}
          </button>
        ))}
      </div>

      {/* The picture: current canvas → options → chosen future state → epics */}
      <section className="panel panel-body ev-flow" aria-hidden="true">
        <div className="ev-stage">
          <div className="ev-canvas current" />
          <span>Current state portfolio canvas</span>
        </div>
        <div className="ev-arrows red">{d.options.length || 3}</div>
        <div className="ev-stage">
          <div className="ev-stack">
            {(d.options.length ? d.options : [1, 2, 3]).map((o, i) => (
              <div key={typeof o === "number" ? o : o.id} className={`ev-canvas small ${typeof o !== "number" && o.option.selected ? "chosen" : ""}`} style={{ animationDelay: `${i * 90}ms` }} />
            ))}
          </div>
          <span>Divergent thinking</span>
        </div>
        <div className="ev-arrows green">1</div>
        <div className="ev-stage">
          <div className={`ev-canvas ${selected ? "chosen" : "ghost"}`} />
          <span>Future state portfolio canvas</span>
        </div>
        <div className="ev-arrows grey">→</div>
        <div className="ev-stage">
          <div className="ev-epics">
            <i className="e" />
            <i className="n" />
            <i className="e" />
            <i className="e" />
            <i className="n" />
            <i className="e" />
          </div>
          <span>Epics and enablers</span>
        </div>
      </section>

      {step === 1 ? (
        <section className="panel panel-body stack">
          <h2>1 · Explore possibilities</h2>
          <p className="muted" style={{ margin: 0 }}>
            Start from the current-state <Link href="/canvases">portfolio canvas</Link>, a SWOT and a TOWS. Trainyard drafts four candidate future states, each leaning on different TOWS quadrants: offensive (SO + WO), defensive (ST + WT), fix first (WO + WT) and balanced. Edit any of them, or add your own, before deciding.
          </p>
          <div className="row">
            <label className="field" style={{ flex: "1 1 260px" }}>
              Current-state portfolio canvas
              <select className="select" value={currentId} onChange={(e) => setCurrentId(e.target.value)}>
                {d.current.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="field" style={{ flex: "1 1 260px" }}>
              TOWS strategies
              <select className="select" value={towsId} onChange={(e) => setTowsId(e.target.value)}>
                {d.tows.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} · {c.strategies} strategies
                  </option>
                ))}
              </select>
            </label>
            <button className="btn primary" style={{ alignSelf: "flex-end" }} disabled={busy || !currentId || !towsId} onClick={() => void run(() => api("POST", "/v1/canvases/options", { currentId, towsId }).then(() => setStep(2)))}>
              {d.options.length ? "Explore again" : "Explore possibilities"}
            </button>
          </div>
          {!d.tows.length ? (
            <div className="notice warn">
              No TOWS canvas yet. Open the <Link href="/canvases">SWOT</Link>, tick the pairings worth pursuing and add them to a TOWS; then come back.
            </div>
          ) : null}
          {d.options.length ? <p className="faint">{d.options.length} options explored{selected ? `, "${selected.title}" chosen` : ""}. Exploring again replaces the unchosen ones.</p> : null}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="panel panel-body stack">
          <h2>2 · Make decisions</h2>
          <p className="muted" style={{ margin: 0 }}>
            Score every option 1 to 5 on each criterion; cost and risk count the other way round. The weighted score ranks them, the room decides. Selecting an option makes it the future-state portfolio canvas and drafts the portfolio vision from it.
          </p>
          <div className="scroll-x" tabIndex={0}>
            <table className="table ev-matrix">
              <thead>
                <tr>
                  <th>Criterion</th>
                  {d.options.map((o) => (
                    <th key={o.id} className={o.option.selected ? "chosen" : ""}>
                      <Link href={`/canvases/${encodeURIComponent(o.id)}`} title="Open and edit this option">
                        {EMPHASIS_LABEL[o.option.emphasis] ?? o.option.emphasis}
                      </Link>
                      <div className="faint" style={{ fontWeight: 400, fontSize: "0.72rem" }}>{o.changes.length} changes</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.criteria.map((c) => (
                  <tr key={c.key}>
                    <td>
                      <b>{c.label}</b> <span className="faint">{c.weight}%{c.lowerIsBetter ? " · lower is better" : ""}</span>
                      <div className="faint" style={{ fontSize: "0.78rem" }}>{c.prompt}</div>
                    </td>
                    {d.options.map((o) => (
                      <td key={o.id} className={o.option.selected ? "chosen" : ""}>
                        <div className="row" style={{ gap: 2 }} role="radiogroup" aria-label={`${c.label} for ${o.title}`}>
                          {[1, 2, 3, 4, 5].map((v) => (
                            <button key={v} className={`ev-dot ${o.option.scores?.[c.key] === v ? "on" : ""}`} aria-pressed={o.option.scores?.[c.key] === v} disabled={busy} onClick={() => void run(() => api("PATCH", `/v1/canvases/${encodeURIComponent(o.id)}/option`, { scores: { [c.key]: v } }))}>
                              {v}
                            </button>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td>
                    <b>Weighted score</b>
                  </td>
                  {d.options.map((o) => (
                    <td key={o.id} className={o.option.selected ? "chosen" : ""}>
                      <span className="vsm-big" style={{ fontSize: "1.4rem" }}>{o.score ?? "–"}</span>
                      {ranked[0]?.id === o.id && o.score !== null ? <span className="chip ok" style={{ marginLeft: 6 }}>top</span> : null}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <b>Planned changes</b>
                  </td>
                  {d.options.map((o) => (
                    <td key={o.id} className={o.option.selected ? "chosen" : ""} style={{ verticalAlign: "top" }}>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.8rem" }}>
                        {o.changes.map((ch) => (
                          <li key={ch}>{ch}</li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>
                    <b>Decision</b>
                  </td>
                  {d.options.map((o) => (
                    <td key={o.id} className={o.option.selected ? "chosen" : ""}>
                      {o.option.selected ? (
                        <span className="chip ok">chosen future state</span>
                      ) : (
                        <button className="btn small" disabled={busy} onClick={() => void run(() => api("POST", `/v1/canvases/${encodeURIComponent(o.id)}/select`).then(() => setStep(3)))}>
                          Select this one
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {step === 3 && selected ? <IdentifyEpics selected={selected} valueStreams={d.valueStreams} hasPortfolio={d.hasPortfolio} onError={setErr} /> : null}
    </>
  );
}

function IdentifyEpics({ selected, valueStreams, hasPortfolio, onError }: { selected: Option; valueStreams: { id: string; name: string }[]; hasPortfolio: boolean; onError: (m: string) => void }) {
  const drafts = useApi<{ drafts: Draft[] }>(`/v1/canvases/${encodeURIComponent(selected.id)}/epic-drafts`);
  const [rows, setRows] = useState<(Draft & { pick: boolean; valueStreamId: string })[]>([]);
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState<number | null>(null);
  useEffect(() => {
    if (drafts.data) setRows(drafts.data.drafts.map((x) => ({ ...x, pick: !x.exists, valueStreamId: valueStreams[0]?.id ?? "" })));
  }, [drafts.data, valueStreams]);
  const counts = useMemo(() => ({ epics: rows.filter((r) => r.pick && r.kind === "business").length, enablers: rows.filter((r) => r.pick && r.kind === "enabler").length }), [rows]);
  const patch = (i: number, p: Partial<(typeof rows)[number]>) => setRows((rs) => rs.map((r, k) => (k === i ? { ...r, ...p } : r)));
  const create = async () => {
    setBusy(true);
    try {
      const picked = rows.filter((r) => r.pick && r.valueStreamId);
      const r = await api<{ epics: unknown[] }>("POST", `/v1/canvases/${encodeURIComponent(selected.id)}/epics`, { epics: picked.map((x) => ({ title: x.title, kind: x.kind, valueStreamId: x.valueStreamId, hypothesis: x.hypothesis })) });
      setMade(r.epics.length);
      await drafts.reload();
    } catch (e) {
      onError((e as ApiFailure).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel panel-body stack">
      <h2>3 · Identify epics</h2>
      <p className="muted" style={{ margin: 0 }}>
        One epic per planned change on <Link href={`/canvases/${encodeURIComponent(selected.id)}`}>{selected.title}</Link>. Changes that build capability (platforms, data, architecture, compliance) come out as enablers; the rest as business epics. Edit the titles and hypotheses, pick the value stream, and create them in the Portfolio Kanban funnel.
      </p>
      {!hasPortfolio ? (
        <div className="notice warn">
          This workspace has no portfolio yet. <Link href="/portfolio">Set it up</Link> (value streams and budgets), then come back to create the epics.
        </div>
      ) : null}
      {made !== null ? (
        <div className="notice ok">
          {made} created in the funnel. <Link href="/portfolio">Open the Portfolio Kanban</Link> to rank them with WSJF and write the Lean business cases.
        </div>
      ) : null}
      {drafts.data ? (
        <div className="scroll-x" tabIndex={0}>
          <table className="table">
            <thead>
              <tr>
                <th />
                <th>Kind</th>
                <th>Epic</th>
                <th>Hypothesis</th>
                <th>Value stream</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.change} style={r.exists ? { opacity: 0.55 } : undefined}>
                  <td>
                    <input type="checkbox" aria-label={`Create ${r.title}`} checked={r.pick} disabled={r.exists} onChange={(e) => patch(i, { pick: e.target.checked })} />
                  </td>
                  <td>
                    <select className="select" aria-label="Kind" value={r.kind} onChange={(e) => patch(i, { kind: e.target.value as Draft["kind"] })}>
                      <option value="business">Epic</option>
                      <option value="enabler">Enabler</option>
                    </select>
                  </td>
                  <td style={{ minWidth: 240 }}>
                    <input className="input" aria-label="Epic title" value={r.title} onChange={(e) => patch(i, { title: e.target.value })} />
                    <div className="faint" style={{ fontSize: "0.74rem", marginTop: 2 }}>from: {r.change}</div>
                    {r.exists ? <span className="chip">already in the funnel</span> : null}
                  </td>
                  <td style={{ minWidth: 280 }}>
                    <textarea className="input" rows={2} aria-label="Hypothesis" value={r.hypothesis} onChange={(e) => patch(i, { hypothesis: e.target.value })} />
                  </td>
                  <td>
                    <select className="select" aria-label="Value stream" value={r.valueStreamId} onChange={(e) => patch(i, { valueStreamId: e.target.value })}>
                      {valueStreams.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="faint">
                    The chosen future state has no planned changes beyond the current canvas; add some on the canvas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : (
        <Loading error={drafts.error} />
      )}
      <div className="row">
        <button className="btn primary" disabled={busy || !hasPortfolio || !rows.some((r) => r.pick && r.valueStreamId)} onClick={() => void create()}>
          Create {counts.epics} epic{counts.epics === 1 ? "" : "s"} and {counts.enablers} enabler{counts.enablers === 1 ? "" : "s"} in the funnel
        </button>
      </div>
    </section>
  );
}
