"use client";

import { useState } from "react";
import type { BudgetLine, EpicState, GuardrailBreach, OkrProgress, Portfolio, PortfolioEpic } from "@trainyard/core";
import { formatValue } from "@/components/charts";
import Link from "next/link";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

interface View {
  portfolio: Portfolio | null;
  increment?: { id: string; name: string };
  epics?: (PortfolioEpic & { score: number })[];
  doneEpics?: PortfolioEpic[];
  budgets?: BudgetLine[];
  breaches?: GuardrailBreach[];
  okrs?: OkrProgress[];
  epicStates?: EpicState[];
}

const STATE_LABEL: Record<EpicState, string> = { funnel: "Funnel", reviewing: "Reviewing", analyzing: "Analyzing", backlog: "Portfolio backlog", implementing: "Implementing", done: "Done" };
const money = (n: number, currency: string) => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

export default function PortfolioPage() {
  const [incrementId, setIncrementId] = useState<string | null>(null);
  const view = useApi<View>(`/v1/portfolio${incrementId ? `?incrementId=${incrementId}` : ""}`);
  const ws = useApi<{ workspace: { increments: { id: string; name: string }[]; people: { id: string; name: string }[] } }>("/v1/workspace");
  const [err, setErr] = useState<string | null>(null);
  if (!view.data || !ws.data) return <Loading error={view.error ?? ws.error} />;
  const v = view.data;
  if (!v.portfolio) {
    return (
      <>
        <PageHead title="Portfolio" sub="Value streams with budgets, epics ranked by WSJF, guardrails and OKRs." />
        <div className="panel panel-body stack">
          <p>This workspace has no portfolio yet.</p>
          <div>
            <button className="btn primary" onClick={async () => (await api("POST", "/v1/portfolio", {}), void view.reload())}>
              Create a portfolio
            </button>
          </div>
        </div>
      </>
    );
  }
  const p = v.portfolio;
  const increments = ws.data.workspace.increments;
  const people = ws.data.workspace.people;
  const vsName = (id: string) => p.valueStreams.find((x) => x.id === id)?.name ?? id;

  const setState = async (epic: PortfolioEpic, state: EpicState) => {
    try {
      await api("PATCH", `/v1/portfolio/epics/${epic.id}`, { state });
      setErr(null);
      await view.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };

  return (
    <>
      <PageHead
        title="Portfolio"
        sub="Lean budgets per value stream, epics ranked by weighted shortest job first, guardrails on spend, and OKRs measured from typed values or live metrics."
        actions={
          <>
            <Link href="/portfolio/vision" className="btn">
              Envision the future state
            </Link>
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            PI
            <select id="pf-inc" className="select" value={v.increment!.id} onChange={(e) => setIncrementId(e.target.value)}>
              {increments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          </>
        }
      />
      {err ? <ErrorList title="Could not save" items={[{ message: err }]} /> : null}
      {v.breaches!.length ? (
        <div className="notice warn">
          <strong>Guardrails</strong>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {v.breaches!.map((b, n) => (
              <li key={n}>
                {vsName(b.valueStreamId)}: {b.message}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="notice">Every guardrail holds for {v.increment!.name}.</div>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>Budgets</h2>
          <span className="faint">{p.currency}</span>
        </div>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Value stream</th>
                <th>PI</th>
                <th style={{ textAlign: "right" }}>Budget</th>
                <th style={{ textAlign: "right" }}>Planned</th>
                <th style={{ textAlign: "right" }}>Actual</th>
                <th style={{ width: 220 }}>Planned vs budget</th>
              </tr>
            </thead>
            <tbody>
              {v.budgets!.map((b) => (
                <tr key={`${b.valueStreamId}-${b.incrementId}`}>
                  <td>{vsName(b.valueStreamId)}</td>
                  <td className="muted">{increments.find((i) => i.id === b.incrementId)?.name}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{money(b.budget, p.currency)}</td>
                  <td className="mono" style={{ textAlign: "right", color: b.state === "over" ? "var(--crit)" : undefined }}>{money(b.planned, p.currency)}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{b.actual ? money(b.actual, p.currency) : "–"}</td>
                  <td>
                    <div className="row" style={{ flexWrap: "nowrap" }}>
                      <span style={{ flex: 1, background: "var(--sunken)", height: 10, borderRadius: 3, overflow: "hidden" }}>
                        <span style={{ display: "block", height: "100%", width: `${Math.min(100, b.plannedPercent ?? 0)}%`, background: b.state === "over" ? "var(--crit)" : b.state === "near" ? "var(--warn)" : "var(--ok)" }} />
                      </span>
                      <span className="mono" style={{ fontSize: "0.78rem", width: 52, textAlign: "right" }}>{b.plannedPercent === null ? "–" : `${b.plannedPercent}%`}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Epics by WSJF</h2>
          <span className="faint">{v.epics!.length} open · {v.doneEpics!.length} done</span>
        </div>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Epic</th>
                <th>Value stream</th>
                <th title="User-business value + time criticality + risk reduction, over job size">WSJF</th>
                <th>Cost of delay parts</th>
                <th style={{ textAlign: "right" }}>Planned {v.increment!.name}</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {v.epics!.map((e, n) => {
                const planned = e.spend.filter((s) => s.incrementId === v.increment!.id).reduce((s, x) => s + x.planned, 0);
                return (
                  <tr key={e.id}>
                    <td className="mono faint">{n + 1}</td>
                    <td>
                      <strong>{e.title}</strong>
                      {e.hypothesis ? <div className="faint" style={{ fontSize: "0.8rem", maxWidth: "40ch" }}>{e.hypothesis}</div> : <div style={{ fontSize: "0.78rem", color: "var(--warn)" }}>No hypothesis yet</div>}
                      {e.ownerId ? <div className="faint" style={{ fontSize: "0.78rem" }}>Owner: {people.find((x) => x.id === e.ownerId)?.name}</div> : null}
                    </td>
                    <td className="muted">{vsName(e.valueStreamId)}</td>
                    <td>
                      <span className="mono" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem" }}>{e.score}</span>
                    </td>
                    <td className="mono faint" style={{ fontSize: "0.78rem" }}>
                      BV {e.wsjf.userBusinessValue} + TC {e.wsjf.timeCriticality} + RR {e.wsjf.riskReductionOpportunity} / size {e.wsjf.jobSize}
                    </td>
                    <td className="mono" style={{ textAlign: "right" }}>{planned ? money(planned, p.currency) : "–"}</td>
                    <td>
                      <select id={`es-${e.id}`} aria-label={`State for ${e.title}`} className="select" value={e.state} onChange={(ev) => setState(e, ev.target.value as EpicState)}>
                        {v.epicStates!.map((s) => (
                          <option key={s} value={s}>
                            {STATE_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Objectives and key results</h2>
          <span className="faint">{v.okrs!.length}</span>
        </div>
        <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {v.okrs!.map(({ okr, keyResults, percent }) => (
            <div key={okr.id} className="stack" style={{ gap: 8 }}>
              <div className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
                <strong>{okr.title}</strong>
                <span className="mono" style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{percent === null ? "–" : `${percent}%`}</span>
              </div>
              <div className="row" style={{ gap: 4 }}>
                <span className="chip">{okr.level}</span>
                {okr.ownerId ? <span className="chip">{people.find((x) => x.id === okr.ownerId)?.name}</span> : null}
              </div>
              {keyResults.map((k) => (
                <div key={k.keyResult.id} className="stack" style={{ gap: 2 }}>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: "0.85rem", flexWrap: "nowrap" }}>
                    <span>
                      {k.keyResult.title} {k.keyResult.metric ? <span className="chip" title={`Read from the ${k.keyResult.metric.key} metric`}>live</span> : null}
                    </span>
                    <span className="mono faint">
                      {k.keyResult.baseline} → {k.current ?? "?"} → {k.keyResult.target}
                    </span>
                  </div>
                  <span style={{ background: "var(--sunken)", height: 6, borderRadius: 3, overflow: "hidden", display: "block" }}>
                    <span style={{ display: "block", height: "100%", width: `${k.percent ?? 0}%`, background: "var(--chart)" }} />
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
      <p className="faint" style={{ fontSize: "0.78rem" }}>Budget headline in money: {formatValue(v.budgets!.filter((b) => b.incrementId === v.increment!.id).reduce((s, b) => s + b.planned, 0), "currency")} planned this PI.</p>
    </>
  );
}
