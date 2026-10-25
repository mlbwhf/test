"use client";

import { useState } from "react";
import type { BudgetLine, EpicWsjf, EpicState, GuardrailBreach, OkrProgress, Portfolio, PortfolioEpic } from "@trainyard/core";
import { formatValue } from "@/components/charts";
import Link from "next/link";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

interface View {
  portfolio: Portfolio | null;
  increment?: { id: string; name: string };
  epics?: (Omit<PortfolioEpic, "cost"> & EpicWsjf & { cost: number | null })[];
  /** Cost-of-delay columns with no epic at 1. */
  wsjfGaps?: string[];
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

  const patchEpic = async (epic: { id: string }, body: Record<string, unknown>) => {
    try {
      await api("PATCH", `/v1/portfolio/epics/${epic.id}`, body);
      setErr(null);
      await view.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  const setState = (epic: { id: string }, state: EpicState) => patchEpic(epic, { state });
  // A typed cost is the Lean business case figure; empty goes back to the planned spend.
  const setCost = (epic: { id: string; cost: number | null }, raw: string) => {
    const cost = raw.trim() === "" ? null : Number(raw.replace(/[^0-9.]/g, ""));
    if (cost !== null && (!Number.isFinite(cost) || cost <= 0)) return;
    return patchEpic(epic, { cost });
  };
  const PART_LABEL: Record<string, string> = { userBusinessValue: "user-business value", timeCriticality: "time criticality", riskReductionOpportunity: "risk reduction / opportunity enablement" };

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
        <div className="scroll-x" tabIndex={0}>
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
        <p className="faint" style={{ margin: "0 16px 8px" }}>
          WSJF = cost of delay ÷ duration. For epics, duration is the epic&apos;s cost normalised to the cheapest one: the lowest-cost epic is 1.0 and each other is its cost ÷ that cost. Estimate the cost-of-delay parts one column at a time, the smallest epic at 1. Epics with no cost yet use relative job size until the Lean business case has one. For big commitments, the Lean business case decides alongside WSJF.
        </p>
        {v.wsjfGaps?.length ? (
          <div className="notice warn" style={{ margin: "0 16px 8px" }}>
            No epic has a 1 for {v.wsjfGaps.map((k) => PART_LABEL[k] ?? k).join(", ")}: give the smallest one a 1 and size the rest against it, or that part outweighs the others.
          </div>
        ) : null}
        <div className="scroll-x" tabIndex={0}>
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Epic</th>
                <th>Value stream</th>
                <th title="User-business value + time criticality + risk reduction / opportunity enablement">Cost of delay</th>
                <th title="The epic's forecast cost from its Lean business case">Cost</th>
                <th title="Cost ÷ the cheapest epic's cost: the cheapest is 1.0. Stands in for duration">Normalised cost</th>
                <th title="Cost of delay ÷ normalised cost">WSJF</th>
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
                    <td className="mono">
                      <strong>{e.costOfDelay}</strong>
                      <div className="faint" style={{ fontSize: "0.75rem" }}>
                        {e.wsjf.userBusinessValue} + {e.wsjf.timeCriticality} + {e.wsjf.riskReductionOpportunity}
                      </div>
                    </td>
                    <td>
                      <input className="input mono" style={{ width: 110 }} aria-label={`Cost of ${e.title}`} defaultValue={e.cost ?? ""} key={`${e.id}-${e.cost ?? ""}`} placeholder="Lean business case" onBlur={(ev) => ev.target.value !== String(e.cost ?? "") && void setCost(e, ev.target.value)} />
                    </td>
                    <td className="mono">{e.denominator.kind === "cost" ? e.denominator.normalized.toFixed(1) : <span className="faint" title="No cost yet: relative job size stands in until the Lean business case has one">size {e.denominator.size}</span>}</td>
                    <td>
                      <span className="mono" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.1rem" }}>{e.score}</span>
                      {e.state === "analyzing" || e.state === "backlog" ? (
                        <div className="faint" style={{ fontSize: "0.72rem", maxWidth: "18ch" }}>
                          Weigh with the Lean business case, not WSJF alone
                        </div>
                      ) : null}
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
