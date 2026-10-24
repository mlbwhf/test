"use client";

// Outcome dashboard: the one-pager an executive or board reads, built from many systems. The
// sources (CRM, finance, learning platform, survey vendors, Jira) are tables; measures turn
// them into monthly figures, alone or combined; each entity's objectives say which measures are
// outcomes (the change sought) and which are KPIs (health). Everything here is editable.

import { useMemo, useState } from "react";
import { SOURCE_KINDS, formatMeasure, type Entity, type Initiative, type InitiativeView, type InsightObjective, type Measure, type MeasureView, type OnePager, type SourceKind } from "@trainyard/core";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

interface SourceMeta {
  id: string;
  name: string;
  kind: SourceKind;
  system: string;
  periodField: string;
  fields: string[];
  loadedAt: string;
  owner?: string;
  rowCount: number;
  preview: Record<string, string | number>[];
}
interface View {
  entities: Entity[];
  objectives: InsightObjective[];
  measures: Measure[];
  views: MeasureView[];
  sources: SourceMeta[];
  initiatives: InitiativeView[];
  issues: string[];
  updatedAt: string;
}

type Tab = "one-pager" | "objectives" | "initiatives" | "measures" | "sources";

const money = (n: number, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
/** Outcome figure on an initiative: counts are shown to date (summed), rates as the latest month. */
const initFig = (m: MeasureView) => (m.unit === "" && m.series.length ? `${formatMeasure(m.series.reduce((n, p) => n + p.value, 0), "", m.decimals)} to date` : formatMeasure(m.current, m.unit, m.decimals));
const singular = (name: string) => name.toLowerCase().replace(/s\b/g, "");
const PACE: Record<InitiativeView["pace"], { label: string; cls: string }> = { ahead: { label: "Spending ahead of time", cls: "op-off" }, "on-pace": { label: "On pace", cls: "op-on" }, behind: { label: "Spending behind time", cls: "op-none" }, unknown: { label: "No dates or spend yet", cls: "op-none" } };

export default function OutcomesPage() {
  const data = useApi<View>("/v1/insights");
  const [tab, setTab] = useState<Tab>("one-pager");
  const [err, setErr] = useState<string | null>(null);
  if (!data.data) return <Loading error={data.error} />;
  const v = data.data;
  const run = async (fn: () => Promise<unknown>) => {
    setErr(null);
    try {
      await fn();
      await data.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  return (
    <>
      <PageHead
        title="Outcome dashboard"
        sub="Outcomes and KPIs from every system that holds the evidence: CRM, finance, the learning platform, survey vendors and Jira. Measures combine them; each entity's objectives say which figures are outcomes and which are health KPIs; the one-pager rolls it up for executives and the board."
        actions={
          <div className="tabs" role="tablist" aria-label="Outcome dashboard views">
            {(
              [
                ["one-pager", "One-pager"],
                ["objectives", "Objectives"],
                ["initiatives", "Initiatives & funding"],
                ["measures", "Measures"],
                ["sources", "Sources"],
              ] as [Tab, string][]
            ).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                {l}
              </button>
            ))}
          </div>
        }
      />
      {err ? <ErrorList title="Not saved" items={[{ message: err }]} /> : null}
      {tab === "one-pager" ? <OnePagerView v={v} /> : null}
      {tab === "objectives" ? <ObjectivesView v={v} run={run} /> : null}
      {tab === "initiatives" ? <InitiativesView v={v} run={run} /> : null}
      {tab === "measures" ? <MeasuresView v={v} run={run} /> : null}
      {tab === "sources" ? <SourcesView v={v} run={run} /> : null}
    </>
  );
}

// ---- one-pager -----------------------------------------------------------------------------

function Spark({ m }: { m: MeasureView }) {
  const pts = m.series.slice(-12);
  if (pts.length < 2) return null;
  const vals = pts.map((p) => p.value);
  const lo = Math.min(...vals, m.target ?? Infinity);
  const hi = Math.max(...vals, m.target ?? -Infinity);
  const span = hi - lo || 1;
  const x = (i: number) => (i / (pts.length - 1)) * 160;
  const y = (val: number) => 40 - ((val - lo) / span) * 36 - 2;
  const d = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  return (
    <svg width="160" height="42" viewBox="0 0 160 42" role="img" aria-label={`${m.name}, last ${pts.length} months, from ${formatMeasure(vals[0]!, m.unit, m.decimals)} to ${formatMeasure(vals.at(-1)!, m.unit, m.decimals)}`}>
      {m.target !== undefined ? <line x1="0" x2="160" y1={y(m.target)} y2={y(m.target)} stroke="#d97706" strokeDasharray="4 3" strokeWidth="1.5" /> : null}
      <path d={d} fill="none" stroke="#1F5FAE" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx={x(pts.length - 1)} cy={y(vals.at(-1)!)} r="3.2" fill="#1F5FAE" />
    </svg>
  );
}

const STATUS: Record<MeasureView["status"], { label: string; cls: string }> = {
  "on-target": { label: "On target", cls: "op-on" },
  "off-target": { label: "Off target", cls: "op-off" },
  "no-target": { label: "No target set", cls: "op-none" },
  "no-data": { label: "No data", cls: "op-none" },
};
const TREND: Record<MeasureView["trend"], string> = { better: "▲ improving", worse: "▼ worsening", flat: "■ flat", none: "" };

function MeasureCard({ m }: { m: MeasureView }) {
  return (
    <div className={`op-card ${STATUS[m.status].cls}`}>
      <div className="op-card-head">
        <b>{m.name}</b>
        <span className={`op-chip ${STATUS[m.status].cls}`}>{STATUS[m.status].label}</span>
      </div>
      <div className="op-card-body">
        <div>
          <div className="op-big">{formatMeasure(m.current, m.unit, m.decimals)}</div>
          <div className="op-small">
            {m.targetLabel ? `Target ${m.targetLabel}` : m.target !== undefined ? `Target ${formatMeasure(m.target, m.unit, m.decimals)}` : "No target"}
            {m.trend !== "none" ? <span className={`op-trend ${m.trend}`}> · {TREND[m.trend]}</span> : null}
          </div>
        </div>
        <Spark m={m} />
      </div>
      <div className="op-src">
        {m.sources.map((s) => (
          <span key={s.id} className="op-src-chip" title={s.system}>
            {s.name}
          </span>
        ))}
      </div>
      {m.error ? <div className="op-small" style={{ color: "var(--crit)" }}>{m.error}</div> : null}
    </div>
  );
}

function OnePagerView({ v }: { v: View }) {
  const [entityId, setEntityId] = useState(v.entities.find((e) => !e.parentId)?.id ?? v.entities[0]?.id ?? "");
  const p = useApi<{ onePager: OnePager }>(entityId ? `/v1/insights/one-pager/${encodeURIComponent(entityId)}` : null);
  const op = p.data?.onePager;
  const month = (x: string | null) => (x ? new Date(`${x}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }) : "–");
  return (
    <>
      <div className="row op-noprint" style={{ gap: 10 }}>
        <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          Entity
          <select className="select" value={entityId} onChange={(e) => setEntityId(e.target.value)}>
            {v.entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.parentId ? "— " : ""}
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>
      {!op ? (
        <Loading error={p.error} />
      ) : (
        <article className="op-page">
          <header className="op-head">
            <div>
              <div className="eyebrow">One-pager · {month(op.period)}</div>
              <h2 style={{ margin: "4px 0 0" }}>{op.entity.name}</h2>
              {op.scope.length > 1 ? <div className="op-small">Includes {op.scope.slice(1).map((e) => e.name).join(", ")}</div> : null}
            </div>
            <div className="op-totals">
              <div>
                <b>
                  {op.totals.outcomesOnTarget}/{op.totals.outcomes}
                </b>
                <span>outcomes on target</span>
              </div>
              <div>
                <b>
                  {op.totals.kpisOnTarget}/{op.totals.kpis}
                </b>
                <span>KPIs on target</span>
              </div>
              {op.initiatives.length ? (
                <div>
                  <b>{money(op.funding.spent, op.funding.currency)}</b>
                  <span>spent of {money(op.funding.committed, op.funding.currency)} committed</span>
                </div>
              ) : null}
              <div>
                <b>{op.sources.length}</b>
                <span>systems</span>
              </div>
            </div>
          </header>
          {op.objectives.length === 0 ? <p className="faint">No objectives for this entity yet. Add one under Objectives.</p> : null}
          {op.objectives.map((o) => (
            <section key={o.objective.id} className="op-obj">
              <div className="op-obj-head">
                <span className="op-small">{o.entity.name}</span>
                <h3 style={{ margin: 0 }}>{o.objective.title}</h3>
              </div>
              {o.outcomes.length ? (
                <>
                  <div className="op-label">Outcomes · the change we are driving</div>
                  <div className="op-grid">
                    {o.outcomes.map((m) => (
                      <MeasureCard key={m.id} m={m} />
                    ))}
                  </div>
                </>
              ) : (
                <p className="op-small" style={{ color: "var(--crit)" }}>
                  No outcome measure: activity alone does not show this objective worked.
                </p>
              )}
              {o.kpis.length ? (
                <>
                  <div className="op-label">KPIs · ongoing health</div>
                  <table className="op-kpis">
                    <tbody>
                      {o.kpis.map((m) => (
                        <tr key={m.id}>
                          <td>{m.name}</td>
                          <td className="mono">{formatMeasure(m.current, m.unit, m.decimals)}</td>
                          <td className="op-small">{m.targetLabel ?? (m.target !== undefined ? formatMeasure(m.target, m.unit, m.decimals) : "")}</td>
                          <td>
                            <span className={`op-chip ${STATUS[m.status].cls}`}>{STATUS[m.status].label}</span>
                          </td>
                          <td className={`op-small op-trend ${m.trend}`}>{TREND[m.trend]}</td>
                          <td className="op-small">{m.sources.map((s) => s.name).join(" + ")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : null}
            </section>
          ))}
          {op.initiatives.length ? (
            <section className="op-obj">
              <div className="op-obj-head">
                <span className="op-small">Funding</span>
                <h3 style={{ margin: 0 }}>Initiatives: what was committed, what is spent, what it bought</h3>
              </div>
              <table className="op-kpis">
                <thead>
                  <tr>
                    <th>Initiative</th>
                    <th style={{ textAlign: "right" }}>Committed</th>
                    <th style={{ textAlign: "right" }}>Spent</th>
                    <th>Burn vs time</th>
                    <th>Funders</th>
                    <th>What it bought</th>
                  </tr>
                </thead>
                <tbody>
                  {op.initiatives.map((i) => (
                    <tr key={i.initiative.id}>
                      <td>
                        <b>{i.initiative.name}</b>
                        <div className="op-small">
                          {i.entity.name} · {i.initiative.status}
                          {i.initiative.kind ? ` · ${i.initiative.kind}` : ""}
                        </div>
                      </td>
                      <td className="mono" style={{ textAlign: "right" }}>{money(i.initiative.committed, i.initiative.currency)}</td>
                      <td className="mono" style={{ textAlign: "right" }}>
                        {money(i.spent, i.initiative.currency)}
                        <div className="op-small">{Math.round(i.burn * 100)}%</div>
                      </td>
                      <td>
                        <BurnBar i={i} />
                        <span className={`op-chip ${PACE[i.pace].cls}`}>{PACE[i.pace].label}</span>
                      </td>
                      <td className="op-small">
                        {i.initiative.funders.map((f) => `${f.name} ${money(f.amount, i.initiative.currency)}`).join(" · ") || "No funder yet"}
                        {i.unfunded > 0 ? <div style={{ color: "var(--crit)" }}>{money(i.unfunded, i.initiative.currency)} unfunded</div> : null}
                      </td>
                      <td className="op-small">
                        {i.outcomes.map((m) => (
                          <div key={m.id}>
                            {m.name}: <b>{initFig(m)}</b> {m.status !== "no-target" ? <span className={`op-chip ${STATUS[m.status].cls}`}>{STATUS[m.status].label}</span> : null}
                          </div>
                        ))}
                        {i.costPerOutcome ? <div>{money(i.costPerOutcome.value, i.costPerOutcome.unit)} per {singular(i.costPerOutcome.measure)}</div> : null}
                        {!i.outcomes.length ? <span style={{ color: "var(--crit)" }}>No outcome measure yet</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
          <footer className="op-foot">
            <b>Sources</b>{" "}
            {op.sources.map((s, i) => (
              <span key={s.id}>
                {i ? " · " : ""}
                {s.name} ({s.system}, {s.rows.toLocaleString()} rows, loaded {s.loadedAt.slice(0, 10)})
              </span>
            ))}
          </footer>
        </article>
      )}
    </>
  );
}

function BurnBar({ i }: { i: InitiativeView }) {
  const burn = Math.min(1, i.burn);
  return (
    <div className="op-burn" title={`Spent ${Math.round(i.burn * 100)}% of the commitment${i.elapsed !== null ? `; ${Math.round(i.elapsed * 100)}% of the time has passed` : ""}`}>
      <div className="op-burn-fill" style={{ width: `${burn * 100}%`, background: i.burn > 1 ? "var(--crit)" : "#1F5FAE" }} />
      {i.elapsed !== null ? <div className="op-burn-time" style={{ left: `${i.elapsed * 100}%` }} /> : null}
    </div>
  );
}

// ---- initiatives & funding -------------------------------------------------------------------

type InitDraft = Omit<Initiative, "id"> & { id: string; isNew?: boolean };

function InitiativesView({ v, run }: { v: View; run: (fn: () => Promise<unknown>) => Promise<void> }) {
  const [edit, setEdit] = useState<InitDraft | null>(null);
  const blank = (): InitDraft => ({ id: `init-${Date.now().toString(36)}`, entityId: v.entities[0]?.id ?? "", name: "", status: "proposed", committed: 0, currency: "USD", funders: [], outcomeIds: [], isNew: true });
  const total = v.initiatives.reduce((a, i) => ({ committed: a.committed + i.initiative.committed, spent: a.spent + i.spent, funded: a.funded + i.funded }), { committed: 0, spent: 0, funded: 0 });
  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="faint">
          {v.initiatives.length} initiatives · {money(total.committed)} committed · {money(total.spent)} spent · {money(total.funded)} funded. Click one to change it.
        </span>
        <button className="btn primary" onClick={() => setEdit(blank())}>
          + New initiative
        </button>
      </div>
      {edit ? <InitiativeEditor d={edit} v={v} onCancel={() => setEdit(null)} onSave={(i) => void run(() => api("PUT", `/v1/insights/initiatives/${encodeURIComponent(i.id)}`, (({ id: _i, isNew: _n, ...rest }) => rest)(i))).then(() => setEdit(null))} onDelete={(id) => confirm("Remove this initiative?") && void run(() => api("DELETE", `/v1/insights/initiatives/${encodeURIComponent(id)}`)).then(() => setEdit(null))} /> : null}
      <div className="op-grid">
        {v.initiatives.map((i) => (
          <button key={i.initiative.id} className={`op-card op-click ${PACE[i.pace].cls}`} onClick={() => setEdit({ ...i.initiative })}>
            <div className="op-card-head">
              <b>{i.initiative.name}</b>
              <span className="op-chip op-none">{i.initiative.status}</span>
            </div>
            <div className="op-small">
              {i.entity.name}
              {i.objective ? ` · ${i.objective.title}` : ""}
            </div>
            <div className="op-card-body">
              <div>
                <div className="op-big">{money(i.spent, i.initiative.currency)}</div>
                <div className="op-small">
                  of {money(i.initiative.committed, i.initiative.currency)} committed · {i.spentFrom === "measure" ? "from finance" : i.spentFrom === "manual" ? "typed in" : "no spend yet"}
                </div>
              </div>
            </div>
            <BurnBar i={i} />
            <span className={`op-chip ${PACE[i.pace].cls}`}>{PACE[i.pace].label}</span>
            <div className="op-small">
              {i.initiative.funders.length ? i.initiative.funders.map((f) => `${f.name} ${money(f.amount, i.initiative.currency)}`).join(" · ") : "No funder yet"}
              {i.unfunded > 0 ? <span style={{ color: "var(--crit)" }}> · {money(i.unfunded, i.initiative.currency)} unfunded</span> : null}
            </div>
            <div className="op-small">
              {i.outcomes.length ? i.outcomes.map((m) => `${m.name}: ${initFig(m)}`).join(" · ") : "No outcome measure yet"}
              {i.costPerOutcome ? ` · ${money(i.costPerOutcome.value, i.costPerOutcome.unit)} per ${singular(i.costPerOutcome.measure)}` : ""}
            </div>
          </button>
        ))}
      </div>
      <p className="faint" style={{ fontSize: "0.84rem", margin: 0 }}>
        The bar is spend against the commitment; the tick is how much of the planned time has passed. Spend comes from a finance measure (the sum of a ledger column over the initiative's dates) or is typed in. Outcomes are the measures that show what the money bought.
      </p>
    </div>
  );
}

function InitiativeEditor({ d, v, onCancel, onSave, onDelete }: { d: InitDraft; v: View; onCancel: () => void; onSave: (i: InitDraft) => void; onDelete: (id: string) => void }) {
  const [i, setI] = useState<InitDraft>(d);
  const outcomes = v.measures.filter((m) => m.role === "outcome" || i.outcomeIds.includes(m.id));
  const spendables = v.measures.filter((m) => m.unit === "$" || m.formula.kind === "field");
  const set = (patch: Partial<InitDraft>) => setI({ ...i, ...patch });
  const drop = (key: keyof InitDraft) => setI((({ [key]: _k, ...rest }) => rest as InitDraft)(i));
  return (
    <section className="panel panel-body stack" style={{ gap: 12, borderColor: "var(--signal)" }}>
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <label className="field" style={{ flex: "2 1 300px" }}>
          Initiative
          <input className="input" value={i.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Young Investigator Awards 2026" />
        </label>
        <label className="field">
          Entity
          <select className="select" value={i.entityId} onChange={(e) => set({ entityId: e.target.value })}>
            {v.entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Objective it serves
          <select className="select" value={i.objectiveId ?? ""} onChange={(e) => (e.target.value ? set({ objectiveId: e.target.value }) : drop("objectiveId"))}>
            <option value="">None</option>
            {v.objectives.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Kind
          <input className="input" value={i.kind ?? ""} onChange={(e) => (e.target.value ? set({ kind: e.target.value }) : drop("kind"))} placeholder="Grant, programme, product…" style={{ width: 160 }} />
        </label>
        <label className="field">
          Status
          <select className="select" value={i.status} onChange={(e) => set({ status: e.target.value as Initiative["status"] })}>
            {["proposed", "funded", "active", "closed"].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Owner
          <input className="input" value={i.owner ?? ""} onChange={(e) => (e.target.value ? set({ owner: e.target.value }) : drop("owner"))} />
        </label>
      </div>
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <label className="field">
          Committed
          <input className="input" type="number" min={0} value={i.committed} onChange={(e) => set({ committed: Number(e.target.value) || 0 })} style={{ width: 140 }} />
        </label>
        <label className="field">
          Currency
          <input className="input" value={i.currency} onChange={(e) => set({ currency: e.target.value.toUpperCase() })} style={{ width: 80 }} />
        </label>
        <label className="field">
          Start
          <input className="input" type="date" value={i.start ?? ""} onChange={(e) => (e.target.value ? set({ start: e.target.value }) : drop("start"))} />
        </label>
        <label className="field">
          End
          <input className="input" type="date" value={i.end ?? ""} onChange={(e) => (e.target.value ? set({ end: e.target.value }) : drop("end"))} />
        </label>
        <label className="field">
          Spend from finance
          <select className="select" value={i.spendMeasureId ?? ""} onChange={(e) => (e.target.value ? set({ spendMeasureId: e.target.value }) : drop("spendMeasureId"))}>
            <option value="">Typed in below</option>
            {spendables.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        {!i.spendMeasureId ? (
          <label className="field">
            Spent to date
            <input className="input" type="number" min={0} value={i.spentManual ?? ""} onChange={(e) => (e.target.value === "" ? drop("spentManual") : set({ spentManual: Number(e.target.value) }))} style={{ width: 140 }} />
          </label>
        ) : null}
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">Funders</span>
        {i.funders.map((f, n) => (
          <div key={n} className="row" style={{ gap: 8 }}>
            <input className="input" value={f.name} aria-label="Funder" onChange={(e) => set({ funders: i.funders.map((x, j) => (j === n ? { ...x, name: e.target.value } : x)) })} style={{ flex: 1 }} />
            <input className="input" type="number" min={0} value={f.amount} aria-label="Amount" onChange={(e) => set({ funders: i.funders.map((x, j) => (j === n ? { ...x, amount: Number(e.target.value) || 0 } : x)) })} style={{ width: 140 }} />
            <button className="btn small ghost" onClick={() => set({ funders: i.funders.filter((_, j) => j !== n) })} aria-label="Remove funder">
              ×
            </button>
          </div>
        ))}
        <button className="btn small" style={{ alignSelf: "flex-start" }} onClick={() => set({ funders: [...i.funders, { name: "", amount: 0 }] })}>
          + Funder
        </button>
        <span className="faint" style={{ fontSize: "0.8rem" }}>
          {money(i.funders.reduce((n, f) => n + f.amount, 0), i.currency || "USD")} of {money(i.committed, i.currency || "USD")} covered
        </span>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <span className="eyebrow">What the funding buys · outcome measures</span>
        <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
          {i.outcomeIds.map((id) => (
            <span key={id} className="chip" style={{ textTransform: "none", letterSpacing: 0 }}>
              {v.measures.find((m) => m.id === id)?.name ?? id}
              <button className="btn small ghost" style={{ padding: "0 4px" }} aria-label="Remove" onClick={() => set({ outcomeIds: i.outcomeIds.filter((x) => x !== id) })}>
                ×
              </button>
            </span>
          ))}
          <select className="select" value="" style={{ width: "auto" }} aria-label="Add an outcome measure" onChange={(e) => e.target.value && set({ outcomeIds: [...i.outcomeIds, e.target.value] })}>
            <option value="">+ add a measure</option>
            {v.measures
              .filter((m) => !i.outcomeIds.includes(m.id))
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
          </select>
        </div>
        {outcomes.length === 0 ? <span className="faint">No outcome measures defined yet; add them under Measures.</span> : null}
      </div>
      <label className="field">
        Notes
        <textarea className="input" rows={2} value={i.notes ?? ""} onChange={(e) => (e.target.value ? set({ notes: e.target.value }) : drop("notes"))} />
      </label>
      <div className="row" style={{ justifyContent: "space-between" }}>
        {!d.isNew ? (
          <button className="btn ghost" style={{ color: "var(--crit)" }} onClick={() => onDelete(i.id)}>
            Remove
          </button>
        ) : (
          <span />
        )}
        <div className="row">
          <button className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary" disabled={!i.name.trim()} onClick={() => onSave({ ...i, name: i.name.trim(), funders: i.funders.filter((f) => f.name.trim()) })}>
            Save initiative
          </button>
        </div>
      </div>
    </section>
  );
}

// ---- objectives ----------------------------------------------------------------------------

function ObjectivesView({ v, run }: { v: View; run: (fn: () => Promise<unknown>) => Promise<void> }) {
  const [draft, setDraft] = useState({ entityId: v.entities[0]?.id ?? "", title: "" });
  const [entity, setEntity] = useState({ name: "", parentId: v.entities.find((e) => !e.parentId)?.id ?? "" });
  const name = (id: string) => v.measures.find((m) => m.id === id)?.name ?? id;
  const save = (o: InsightObjective) => run(() => api("PUT", `/v1/insights/objectives/${encodeURIComponent(o.id)}`, { entityId: o.entityId, title: o.title, outcomeIds: o.outcomeIds, kpiIds: o.kpiIds }));
  return (
    <div className="stack">
      {v.objectives.map((o) => (
        <section key={o.id} className="panel panel-body stack" style={{ gap: 10 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="stack" style={{ gap: 2, flex: 1 }}>
              <select className="select" style={{ width: "auto", alignSelf: "flex-start" }} value={o.entityId} onChange={(e) => void save({ ...o, entityId: e.target.value })} aria-label="Entity">
                {v.entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
              <input className="input" style={{ fontWeight: 700, fontSize: "1.1rem" }} defaultValue={o.title} aria-label="Objective" onBlur={(e) => e.target.value.trim() && e.target.value !== o.title && void save({ ...o, title: e.target.value.trim() })} />
            </div>
            <button className="btn small ghost" onClick={() => confirm(`Remove "${o.title}"?`) && void run(() => api("DELETE", `/v1/insights/objectives/${encodeURIComponent(o.id)}`))}>
              Remove
            </button>
          </div>
          {(["outcomeIds", "kpiIds"] as const).map((k) => (
            <div key={k} className="stack" style={{ gap: 6 }}>
              <span className="eyebrow">{k === "outcomeIds" ? "Outcomes · the change sought" : "KPIs · ongoing health"}</span>
              <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                {o[k].map((id) => (
                  <span key={id} className="chip" style={{ textTransform: "none", letterSpacing: 0 }}>
                    {name(id)}
                    <button className="btn small ghost" style={{ padding: "0 4px" }} aria-label={`Remove ${name(id)}`} onClick={() => void save({ ...o, [k]: o[k].filter((x) => x !== id) })}>
                      ×
                    </button>
                  </span>
                ))}
                <select className="select" value="" style={{ width: "auto" }} aria-label={`Add ${k === "outcomeIds" ? "an outcome" : "a KPI"}`} onChange={(e) => e.target.value && void save({ ...o, [k]: [...o[k], e.target.value] })}>
                  <option value="">+ add {k === "outcomeIds" ? "outcome" : "KPI"}</option>
                  {v.measures
                    .filter((m) => !o[k].includes(m.id) && (k === "outcomeIds" ? m.role === "outcome" : m.role === "kpi"))
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ))}
        </section>
      ))}
      <form
        className="panel panel-body row"
        style={{ gap: 8, alignItems: "flex-end" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.title.trim()) return;
          void run(() => api("PUT", `/v1/insights/objectives/obj-${Date.now().toString(36)}`, { entityId: draft.entityId, title: draft.title.trim(), outcomeIds: [], kpiIds: [] })).then(() => setDraft({ ...draft, title: "" }));
        }}
      >
        <label className="field">
          Entity
          <select className="select" value={draft.entityId} onChange={(e) => setDraft({ ...draft, entityId: e.target.value })}>
            {v.entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field" style={{ flex: 1 }}>
          New objective
          <input className="input" placeholder="e.g. Improve cancer care through free learning" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </label>
        <button className="btn primary" type="submit" disabled={!draft.title.trim()}>
          Add objective
        </button>
      </form>
      <form
        className="panel panel-body row"
        style={{ gap: 8, alignItems: "flex-end" }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!entity.name.trim()) return;
          const id = `ent-${entity.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || Date.now().toString(36)}`;
          void run(() => api("PUT", `/v1/insights/entities/${id}`, { name: entity.name.trim(), ...(entity.parentId ? { parentId: entity.parentId } : {}) })).then(() => setEntity({ ...entity, name: "" }));
        }}
      >
        <label className="field" style={{ flex: 1 }}>
          New entity
          <input className="input" placeholder="e.g. Foundation, Publishing, Quality programmes" value={entity.name} onChange={(e) => setEntity({ ...entity, name: e.target.value })} />
        </label>
        <label className="field">
          Under
          <select className="select" value={entity.parentId} onChange={(e) => setEntity({ ...entity, parentId: e.target.value })}>
            <option value="">Nothing (top level)</option>
            {v.entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <button className="btn" type="submit" disabled={!entity.name.trim()}>
          Add entity
        </button>
      </form>
    </div>
  );
}

// ---- measures ------------------------------------------------------------------------------

type Draft = Measure & { isNew?: boolean };

function describe(m: Measure, v: View): string {
  const f = m.formula;
  const nm = (id: string) => v.measures.find((x) => x.id === id)?.name ?? id;
  if (f.kind === "field") {
    const src = v.sources.find((s) => s.id === f.sourceId);
    return `${f.aggregate} of ${f.aggregate === "count" ? "rows" : f.field} in ${src?.name ?? f.sourceId}${f.where ? ` where ${f.where.field} is ${f.where.in.join(" or ")}` : ""}`;
  }
  return f.kind === "ratio" ? `${nm(f.a)} ÷ ${nm(f.b)}${f.scale && f.scale !== 1 ? ` × ${f.scale}` : ""}` : `${nm(f.a)} − ${nm(f.b)}`;
}

function MeasuresView({ v, run }: { v: View; run: (fn: () => Promise<unknown>) => Promise<void> }) {
  const [edit, setEdit] = useState<Draft | null>(null);
  const viewOf = useMemo(() => new Map(v.views.map((x) => [x.id, x])), [v.views]);
  const blank = (): Draft => ({ id: `m-${Date.now().toString(36)}`, name: "", role: "kpi", formula: { kind: "field", sourceId: v.sources[0]?.id ?? "", field: v.sources[0]?.fields.find((f) => f !== v.sources[0]?.periodField) ?? "", aggregate: "sum" }, unit: "", higherIsBetter: true, isNew: true });
  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span className="faint">{v.measures.length} measures. Click one to change it.</span>
        <button className="btn primary" onClick={() => setEdit(blank())} disabled={!v.sources.length}>
          + New measure
        </button>
      </div>
      {edit ? <MeasureEditor d={edit} v={v} onCancel={() => setEdit(null)} onSave={(m) => void run(() => api("PUT", `/v1/insights/measures/${encodeURIComponent(m.id)}`, (({ id: _i, isNew: _n, ...rest }) => rest)(m))).then(() => setEdit(null))} onDelete={(id) => confirm("Remove this measure?") && void run(() => api("DELETE", `/v1/insights/measures/${encodeURIComponent(id)}`)).then(() => setEdit(null))} /> : null}
      <div className="panel scroll-x" tabIndex={0}>
        <table className="table">
          <thead>
            <tr>
              <th>Measure</th>
              <th>Role</th>
              <th>How it is calculated</th>
              <th style={{ textAlign: "right" }}>Latest</th>
              <th>Target</th>
              <th>Systems</th>
            </tr>
          </thead>
          <tbody>
            {v.measures.map((m) => {
              const x = viewOf.get(m.id);
              return (
                <tr key={m.id} onClick={() => setEdit({ ...m })} style={{ cursor: "pointer" }}>
                  <td>
                    <b>{m.name}</b>
                    {m.rationale ? <div className="faint" style={{ fontSize: "0.8rem" }}>{m.rationale}</div> : null}
                  </td>
                  <td>
                    <span className="chip">{m.role === "outcome" ? "Outcome" : "KPI"}</span>
                  </td>
                  <td className="faint" style={{ fontSize: "0.85rem" }}>{describe(m, v)}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{x ? formatMeasure(x.current, m.unit, m.decimals) : "–"}</td>
                  <td className="faint" style={{ fontSize: "0.85rem" }}>{m.targetLabel ?? (m.target !== undefined ? formatMeasure(m.target, m.unit, m.decimals) : "")}</td>
                  <td className="faint" style={{ fontSize: "0.85rem" }}>{x?.sources.map((s) => s.name).join(" + ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MeasureEditor({ d, v, onCancel, onSave, onDelete }: { d: Draft; v: View; onCancel: () => void; onSave: (m: Draft) => void; onDelete: (id: string) => void }) {
  const [m, setM] = useState<Draft>(d);
  const f = m.formula;
  const src = f.kind === "field" ? v.sources.find((s) => s.id === f.sourceId) : undefined;
  const others = v.measures.filter((x) => x.id !== m.id);
  return (
    <section className="panel panel-body stack" style={{ gap: 12, borderColor: "var(--signal)" }}>
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <label className="field" style={{ flex: "2 1 280px" }}>
          Name
          <input className="input" value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} placeholder="e.g. Learners reporting a change in practice" />
        </label>
        <label className="field">
          Role
          <select className="select" value={m.role} onChange={(e) => setM({ ...m, role: e.target.value as Measure["role"] })}>
            <option value="outcome">Outcome: the change sought</option>
            <option value="kpi">KPI: ongoing health</option>
          </select>
        </label>
        <label className="field">
          Built from
          <select
            className="select"
            value={f.kind}
            onChange={(e) =>
              setM({ ...m, formula: e.target.value === "field" ? { kind: "field", sourceId: v.sources[0]?.id ?? "", field: "", aggregate: "sum" } : { kind: e.target.value as "ratio" | "diff", a: others[0]?.id ?? "", b: others[1]?.id ?? others[0]?.id ?? "", ...(e.target.value === "ratio" ? { scale: 100 } : {}) } })
            }
          >
            <option value="field">A column in one source</option>
            <option value="ratio">One measure divided by another</option>
            <option value="diff">One measure minus another</option>
          </select>
        </label>
      </div>
      {f.kind === "field" ? (
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <label className="field">
            Source
            <select className="select" value={f.sourceId} onChange={(e) => setM({ ...m, formula: { ...f, sourceId: e.target.value, field: "" } })}>
              {v.sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({SOURCE_KINDS[s.kind].label})
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Aggregate per month
            <select className="select" value={f.aggregate} onChange={(e) => setM({ ...m, formula: { ...f, aggregate: e.target.value as "sum" } })}>
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="count">Count rows</option>
              <option value="latest">Latest value</option>
            </select>
          </label>
          {f.aggregate !== "count" ? (
            <label className="field">
              Column
              <select className="select" value={f.field} onChange={(e) => setM({ ...m, formula: { ...f, field: e.target.value } })}>
                <option value="">Choose…</option>
                {src?.fields.filter((x) => x !== src.periodField).map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="field">
            Only rows where
            <select className="select" value={f.where?.field ?? ""} onChange={(e) => setM({ ...m, formula: e.target.value ? { ...f, where: { field: e.target.value, in: f.where?.in ?? [] } } : (({ where: _w, ...rest }) => rest)(f) })}>
              <option value="">All rows</option>
              {src?.fields.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </label>
          {f.where ? (
            <label className="field" style={{ flex: 1 }}>
              is one of (comma-separated)
              <input className="input" value={f.where.in.join(", ")} onChange={(e) => setM({ ...m, formula: { ...f, where: { field: f.where!.field, in: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) } } })} />
            </label>
          ) : null}
        </div>
      ) : (
        <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label className="field">
            Measure
            <select className="select" value={f.a} onChange={(e) => setM({ ...m, formula: { ...f, a: e.target.value } })}>
              {others.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          <span style={{ paddingBottom: 8, fontWeight: 700 }}>{f.kind === "ratio" ? "÷" : "−"}</span>
          <label className="field">
            Measure
            <select className="select" value={f.b} onChange={(e) => setM({ ...m, formula: { ...f, b: e.target.value } })}>
              {others.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          {f.kind === "ratio" ? (
            <label className="field">
              × scale
              <input className="input" type="number" value={f.scale ?? 1} onChange={(e) => setM({ ...m, formula: { ...f, scale: Number(e.target.value) || 1 } })} style={{ width: 90 }} />
            </label>
          ) : null}
        </div>
      )}
      <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
        <label className="field">
          Unit
          <input className="input" value={m.unit} onChange={(e) => setM({ ...m, unit: e.target.value })} placeholder="%, $, days, h" style={{ width: 90 }} />
        </label>
        <label className="field">
          Decimals
          <input className="input" type="number" min={0} max={4} value={m.decimals ?? 0} onChange={(e) => setM({ ...m, decimals: Number(e.target.value) })} style={{ width: 80 }} />
        </label>
        <label className="field">
          Better when
          <select className="select" value={m.higherIsBetter ? "up" : "down"} onChange={(e) => setM({ ...m, higherIsBetter: e.target.value === "up" })}>
            <option value="up">Higher</option>
            <option value="down">Lower</option>
          </select>
        </label>
        <label className="field">
          Target
          <input className="input" type="number" value={m.target ?? ""} onChange={(e) => setM(e.target.value === "" ? (({ target: _t, ...rest }) => rest)(m) : { ...m, target: Number(e.target.value) })} style={{ width: 120 }} />
        </label>
        <label className="field" style={{ flex: 1 }}>
          Target in words
          <input className="input" value={m.targetLabel ?? ""} onChange={(e) => setM({ ...m, targetLabel: e.target.value })} placeholder="e.g. 40% at 3-month follow-up" />
        </label>
      </div>
      <label className="field">
        Why this is evidence (and what it does not prove)
        <textarea className="input" rows={2} value={m.rationale ?? ""} onChange={(e) => setM({ ...m, rationale: e.target.value })} />
      </label>
      <div className="row" style={{ justifyContent: "space-between" }}>
        {!d.isNew ? (
          <button className="btn ghost" style={{ color: "var(--crit)" }} onClick={() => onDelete(m.id)}>
            Remove
          </button>
        ) : (
          <span />
        )}
        <div className="row">
          <button className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary" disabled={!m.name.trim()} onClick={() => onSave({ ...m, name: m.name.trim(), ...(m.targetLabel?.trim() ? { targetLabel: m.targetLabel.trim() } : {}), ...(m.rationale?.trim() ? { rationale: m.rationale.trim() } : {}) })}>
            Save measure
          </button>
        </div>
      </div>
    </section>
  );
}

// ---- sources -------------------------------------------------------------------------------

function SourcesView({ v, run }: { v: View; run: (fn: () => Promise<unknown>) => Promise<void> }) {
  const [form, setForm] = useState<{ id?: string; name: string; kind: SourceKind; system: string; periodField: string; owner: string; csv: string; fileName: string }>({ name: "", kind: "crm", system: "", periodField: "month", owner: "", csv: "", fileName: "" });
  const [open, setOpen] = useState<string | null>(null);
  const headers = form.csv ? (form.csv.split(/\r?\n/)[0] ?? "").split(/[,;\t]/).map((h) => h.trim().replace(/^"|"$/g, "")) : [];
  return (
    <div className="stack">
      {v.issues.length ? (
        <div className="notice warn stack" style={{ gap: 4 }}>
          <b>Check these</b>
          {v.issues.map((i) => (
            <span key={i}>{i}</span>
          ))}
        </div>
      ) : null}
      <div className="panel scroll-x" tabIndex={0}>
        <table className="table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Kind</th>
              <th>System</th>
              <th style={{ textAlign: "right" }}>Rows</th>
              <th>Loaded</th>
              <th>Owner</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {v.sources.map((s) => (
              <>
                <tr key={s.id}>
                  <td>
                    <button className="btn small ghost" onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id}>
                      {open === s.id ? "▾" : "▸"} <b>{s.name}</b>
                    </button>
                  </td>
                  <td>
                    <span className="chip">{SOURCE_KINDS[s.kind].label}</span>
                  </td>
                  <td className="faint">{s.system}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{s.rowCount.toLocaleString()}</td>
                  <td className="faint">{s.loadedAt.slice(0, 10)}</td>
                  <td className="faint">{s.owner ?? ""}</td>
                  <td>
                    <div className="row" style={{ gap: 4 }}>
                      <button className="btn small" onClick={() => setForm({ id: s.id, name: s.name, kind: s.kind, system: s.system, periodField: s.periodField, owner: s.owner ?? "", csv: "", fileName: "" })}>
                        Reload
                      </button>
                      <button className="btn small ghost" onClick={() => confirm(`Remove ${s.name}?`) && void run(() => api("DELETE", `/v1/insights/sources/${encodeURIComponent(s.id)}`))}>
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
                {open === s.id ? (
                  <tr key={`${s.id}-p`}>
                    <td colSpan={7}>
                      <div className="scroll-x" tabIndex={0}>
                        <table className="table" style={{ fontSize: "0.8rem" }}>
                          <thead>
                            <tr>
                              {s.fields.map((f) => (
                                <th key={f}>{f === s.periodField ? `${f} (period)` : f}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {s.preview.map((r, i) => (
                              <tr key={i}>
                                {s.fields.map((f) => (
                                  <td key={f}>{String(r[f] ?? "")}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <form
        className="panel panel-body stack"
        style={{ gap: 10 }}
        onSubmit={(e) => {
          e.preventDefault();
          void run(() => api("POST", "/v1/insights/sources", { ...(form.id ? { id: form.id } : {}), name: form.name.trim(), kind: form.kind, system: form.system.trim(), periodField: form.periodField.trim(), ...(form.owner.trim() ? { owner: form.owner.trim() } : {}), csv: form.csv })).then(() => setForm({ name: "", kind: "crm", system: "", periodField: "month", owner: "", csv: "", fileName: "" }));
        }}
      >
        <b>{form.id ? `Reload ${form.name}` : "Add a source"}</b>
        <span className="faint" style={{ fontSize: "0.85rem" }}>
          A CSV export with a header row and a period column (YYYY-MM or a date; days roll up to months). CRM, finance, learning platform, survey vendor, Jira: any system that can export a table. Live connections to Salesforce, HubSpot or a data warehouse can feed the same endpoint.
        </span>
        <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
          <label className="field" style={{ flex: "1 1 220px" }}>
            Name
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Learner profiles" />
          </label>
          <label className="field">
            Kind
            <select className="select" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as SourceKind })}>
              {(Object.keys(SOURCE_KINDS) as SourceKind[]).map((k) => (
                <option key={k} value={k}>
                  {SOURCE_KINDS[k].label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            System
            <input className="input" value={form.system} onChange={(e) => setForm({ ...form, system: e.target.value })} placeholder={SOURCE_KINDS[form.kind].examples} />
          </label>
          <label className="field">
            Owner
            <input className="input" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="Who answers for it" />
          </label>
        </div>
        <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <label className="field">
            CSV file
            <input
              className="input"
              type="file"
              accept=".csv,text/csv,.txt"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                const first = (text.split(/\r?\n/)[0] ?? "").split(/[,;\t]/).map((h) => h.trim().replace(/^"|"$/g, ""));
                const guess = first.find((h) => /month|period|date/i.test(h)) ?? form.periodField;
                setForm({ ...form, csv: text, fileName: file.name, periodField: guess, name: form.name || file.name.replace(/\.[a-z]+$/i, "") });
              }}
            />
          </label>
          <label className="field">
            Period column
            {headers.length ? (
              <select className="select" value={form.periodField} onChange={(e) => setForm({ ...form, periodField: e.target.value })}>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            ) : (
              <input className="input" value={form.periodField} onChange={(e) => setForm({ ...form, periodField: e.target.value })} />
            )}
          </label>
          <button className="btn primary" type="submit" disabled={!form.name.trim() || !form.csv}>
            {form.id ? "Reload source" : "Add source"}
          </button>
          {form.id ? (
            <button className="btn ghost" type="button" onClick={() => setForm({ name: "", kind: "crm", system: "", periodField: "month", owner: "", csv: "", fileName: "" })}>
              Cancel
            </button>
          ) : null}
        </div>
        {headers.length ? <span className="faint" style={{ fontSize: "0.8rem" }}>{form.fileName}: {headers.join(", ")}</span> : null}
      </form>

      <div className="panel panel-body row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <span className="faint" style={{ fontSize: "0.85rem" }}>Example customers to explore, or start empty and load your own extracts. Every figure in the examples is illustrative.</span>
        <div className="row" style={{ flexWrap: "wrap" }}>
          <button className="btn" onClick={() => confirm("Replace everything with the education and grants example?") && void run(() => api("POST", "/v1/insights/reset", { to: "demo" }))} title="Free learning modules for clinicians in low- and middle-income countries, and young-investigator grants">
            Example: Education &amp; grants
          </button>
          <button className="btn" onClick={() => confirm("Replace everything with the Northstar Bank example?") && void run(() => api("POST", "/v1/insights/reset", { to: "northstar" }))} title="The SAFe training example: digital payments traced from the portfolio to two ARTs">
            Example: Northstar Bank
          </button>
          <button className="btn ghost" onClick={() => confirm("Remove every source, measure, objective and initiative?") && void run(() => api("POST", "/v1/insights/reset", { to: "empty" }))}>
            Start empty
          </button>
        </div>
      </div>
    </div>
  );
}
