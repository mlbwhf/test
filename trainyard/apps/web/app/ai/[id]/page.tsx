"use client";

import Link from "next/link";
import { use, useState } from "react";
import { EVIDENCE_KINDS, EVIDENCE_LABELS, STAGES, STAGE_LABELS, type Agent, type EvalMetric, type EvidenceKind, type Stage } from "@trainyard/ai-portfolio";
import type { Person, WorkItem } from "@trainyard/core";
import { formatValue } from "@/components/charts";
import { ErrorList, Loading, PageHead, SourceChip } from "@/components/ui";
import { TIER_CHIP, type InitiativeView } from "@/lib/ai";
import { api, useApi, type ApiFailure } from "@/lib/api";

type AgentView = Agent & { autonomyLabel: string; issues: string[] };
interface Detail {
  initiative: InitiativeView;
  items: WorkItem[];
  agents: AgentView[];
}

const OVERSIGHT: Record<string, string> = { "in-the-loop": "Human in the loop", "on-the-loop": "Human on the loop", "out-of-loop": "No human review" };

export default function InitiativePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const detail = useApi<Detail>(`/v1/ai/initiatives/${id}`);
  const ws = useApi<{ workspace: { people: Person[] }; model: { aiNative: { valueArchitectSignOff: boolean } } }>("/v1/workspace");
  const [failure, setFailure] = useState<{ title: string; items: { message: string }[] } | null>(null);
  const [done, setDone] = useState<string | null>(null);

  if (!detail.data || !ws.data) return <Loading error={detail.error ?? ws.error} />;
  const { initiative: i, items, agents } = detail.data;
  const people = ws.data.workspace.people;
  const name = (pid: string) => people.find((p) => p.id === pid)?.name ?? pid;
  const architects = people.filter((p) => p.roles.includes("ai-value-architect"));
  const gate = i.nextGate;

  const run = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      setFailure(null);
      setDone(label);
      await detail.reload();
    } catch (e) {
      const err = e as ApiFailure;
      const details = err.details as { blockers?: { message: string }[] } | string[] | undefined;
      const items = Array.isArray(details) ? details.map((m) => ({ message: m })) : details?.blockers ?? [{ message: err.message }];
      setFailure({ title: err.message, items });
      setDone(null);
    }
  };
  const moveTo = (to: Stage) => run(`Moved to ${STAGE_LABELS[to]}.`, () => api("POST", `/v1/ai/initiatives/${i.id}/advance`, { to }));

  return (
    <>
      <div>
        <Link href="/ai" className="faint" style={{ fontSize: "0.85rem" }}>
          ← AI portfolio
        </Link>
      </div>
      <PageHead
        title={i.name}
        sub={i.problem}
        actions={
          <>
            <span className={`chip ${TIER_CHIP[i.riskTier]}`}>{i.riskTier} risk</span>
            <span className="chip">{OVERSIGHT[i.oversight]}</span>
            <span className="chip">Owner: {name(i.ownerId)}</span>
          </>
        }
      />

      <ol aria-label="Lifecycle" style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: `repeat(${STAGES.length}, minmax(0, 1fr))`, gap: 4 }}>
        {STAGES.map((s, n) => {
          const here = s === i.stage;
          const past = n < STAGES.indexOf(i.stage);
          return (
            <li key={s} aria-current={here ? "step" : undefined} style={{ fontSize: "0.75rem", textAlign: "center" }}>
              <div style={{ height: 6, borderRadius: 3, background: here ? "var(--signal)" : past ? "var(--chart)" : "var(--sunken)" }} />
              <div style={{ marginTop: 4, fontWeight: here ? 700 : 400, color: here ? "var(--ink)" : "var(--ink-3)" }}>{STAGE_LABELS[s]}</div>
            </li>
          );
        })}
      </ol>

      {failure ? <ErrorList title={failure.title} items={failure.items} /> : null}
      {done ? <div className="notice" role="status">{done}</div> : null}

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>{gate ? `Gate to ${STAGE_LABELS[gate.to]}` : "No further gate"}</h2>
            {gate ? <span className={`chip ${gate.allowed ? "ok" : "warn"}`}>{gate.allowed ? "Clear" : `${gate.blockers.length} open`}</span> : null}
          </div>
          <div className="panel-body stack">
            {gate ? (
              <>
                {gate.evidence.length ? (
                  <div className="stack" style={{ gap: 4 }}>
                    <span className="eyebrow">Evidence needed</span>
                    {gate.evidence.map((e) => (
                      <span key={e.kind} className="row" style={{ flexWrap: "nowrap" }}>
                        <span className="dot" style={{ background: e.present ? "var(--ok)" : "var(--crit)" }} />
                        {e.label}
                        <span className="faint">{e.present ? "on file" : "missing"}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
                {gate.blockers.filter((b) => b.code !== "evidence").length ? (
                  <div className="stack" style={{ gap: 4 }}>
                    <span className="eyebrow">Other blockers</span>
                    {gate.blockers
                      .filter((b) => b.code !== "evidence")
                      .map((b, n) => (
                        <span key={n} className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                          <span className="dot" style={{ background: "var(--warn)", marginTop: 6 }} />
                          {b.message}
                        </span>
                      ))}
                  </div>
                ) : null}
                <div className="row">
                  {ws.data.model.aiNative.valueArchitectSignOff && architects.length && !i.signOffs.some((s) => s.stage === gate.to) ? (
                    <button className="btn" onClick={() => run(`${architects[0]!.name} signed off ${STAGE_LABELS[gate.to]}.`, () => api("POST", `/v1/ai/initiatives/${i.id}/sign-off`, { stage: gate.to, personId: architects[0]!.id }))}>
                      Sign off as {architects[0]!.name} (AI value architect)
                    </button>
                  ) : null}
                  <button className="btn primary" disabled={!gate.allowed} onClick={() => moveTo(gate.to)}>
                    Move to {STAGE_LABELS[gate.to]}
                  </button>
                </div>
              </>
            ) : (
              <p className="muted">This initiative is in {i.stageLabel.toLowerCase()}.</p>
            )}
            <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              {STAGES.indexOf(i.stage) > 0 && i.stage !== "retired" ? (
                <button className="btn small" onClick={() => moveTo(STAGES[STAGES.indexOf(i.stage) - 1]!)}>
                  Send back to {STAGE_LABELS[STAGES[STAGES.indexOf(i.stage) - 1]!]}
                </button>
              ) : null}
              {i.stage !== "retired" ? (
                <button className="btn small" onClick={() => moveTo("retired")}>
                  Retire
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <EvidencePanel initiative={i} people={people} onSaved={run} />
        <EvalsPanel initiative={i} onSaved={run} />

        <section className="panel">
          <div className="panel-head">
            <h2>Spend and value</h2>
            <span className={`chip ${i.spend.state === "over" ? "crit" : i.spend.state === "watch" ? "warn" : "ok"}`}>{i.spend.state === "over" ? "Over budget" : i.spend.state === "watch" ? "Will pass budget" : "Within budget"}</span>
          </div>
          <div className="panel-body stack">
            <div className="row mono" style={{ gap: 18 }}>
              <span>
                <span className="eyebrow">Spent {i.spend.month}</span>
                <br />
                {formatValue(i.spend.spent, "currency")}
              </span>
              <span>
                <span className="eyebrow">Forecast</span>
                <br />
                {formatValue(i.spend.forecast, "currency")}
              </span>
              <span>
                <span className="eyebrow">Budget</span>
                <br />
                {formatValue(i.spend.budget, "currency")}
              </span>
            </div>
            {i.kpis.length ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>KPI</th>
                    <th style={{ textAlign: "right" }}>Baseline</th>
                    <th style={{ textAlign: "right" }}>Now</th>
                    <th style={{ textAlign: "right" }}>Target</th>
                  </tr>
                </thead>
                <tbody>
                  {i.kpis.map((k) => (
                    <tr key={k.name}>
                      <td>{k.name}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{k.baseline}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{k.current ?? "–"}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{k.target}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="faint">No KPIs defined yet.</p>
            )}
            {i.valueRealised !== null ? <p className="muted">{i.valueRealised}% of the way from baseline to target.</p> : null}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Agents</h2>
            <Link href="/agents" className="btn small">
              Manage agents
            </Link>
          </div>
          <div className="panel-body stack">
            {agents.length === 0 ? <p className="faint">No agents work on this initiative.</p> : null}
            {agents.map((a) => (
              <div key={a.id} className="stack" style={{ gap: 2 }}>
                <span className="row">
                  <strong>{a.name}</strong>
                  <span className="chip ai">L{a.autonomy} · {a.autonomyLabel}</span>
                </span>
                <span className="faint" style={{ fontSize: "0.8rem" }}>
                  Accountable: {a.accountableId ? name(a.accountableId) : "nobody"}
                </span>
                {a.issues.map((m) => (
                  <span key={m} style={{ color: "var(--crit)", fontSize: "0.8rem" }}>
                    {m}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Delivery work</h2>
            <span className="faint">{items.length}</span>
          </div>
          <table className="table">
            <tbody>
              {items.map((w) => (
                <tr key={w.id}>
                  <td>{w.title}</td>
                  <td style={{ width: 120 }}>
                    <SourceChip system={w.source.system} id={w.source.externalId} />
                  </td>
                  <td style={{ width: 90 }} className="muted">
                    {{ todo: "To do", in_progress: "In progress", done: "Done" }[w.status]}
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td className="faint">No Jira or Azure DevOps items are linked yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}

type Run = (label: string, fn: () => Promise<unknown>) => Promise<void>;

function EvidencePanel({ initiative: i, people, onSaved }: { initiative: InitiativeView; people: Person[]; onSaved: Run }) {
  const [kind, setKind] = useState<EvidenceKind>(EVIDENCE_KINDS.find((k) => !i.evidence.some((e) => e.kind === k)) ?? "eval-report");
  const [url, setUrl] = useState("");
  return (
    <section className="panel">
      <div className="panel-head">
        <h2>Evidence</h2>
        <span className="faint">{i.evidence.length} on file</span>
      </div>
      <div className="panel-body stack">
        {i.evidence.map((e) => (
          <div key={e.kind} className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
            <a href={e.url} target="_blank" rel="noreferrer">
              {EVIDENCE_LABELS[e.kind]}
            </a>
            <span className="faint" style={{ fontSize: "0.78rem" }}>
              {people.find((p) => p.id === e.addedBy)?.name ?? e.addedBy} · {e.addedAt.slice(0, 10)}
            </span>
          </div>
        ))}
        <form
          className="row"
          style={{ alignItems: "flex-end", borderTop: "1px solid var(--line)", paddingTop: 10 }}
          onSubmit={(ev) => {
            ev.preventDefault();
            void onSaved(`${EVIDENCE_LABELS[kind]} added.`, () => api("POST", `/v1/ai/initiatives/${i.id}/evidence`, { kind, url, addedBy: i.ownerId })).then(() => setUrl(""));
          }}
        >
          <label className="field">
            Document
            <select id="ev-kind" className="select" value={kind} onChange={(e) => setKind(e.target.value as EvidenceKind)}>
              {EVIDENCE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {EVIDENCE_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="field" style={{ flex: "1 1 180px" }}>
            Link
            <input id="ev-url" className="input" type="url" required placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
          </label>
          <button className="btn" type="submit">
            Add
          </button>
        </form>
      </div>
    </section>
  );
}

function EvalsPanel({ initiative: i, onSaved }: { initiative: InitiativeView; onSaved: Run }) {
  const [rows, setRows] = useState<EvalMetric[]>(i.evals);
  const passes = (m: EvalMetric) => m.latest !== undefined && (m.direction === "min" ? m.latest >= m.threshold : m.latest <= m.threshold);
  const update = (n: number, patch: Partial<EvalMetric>) => setRows(rows.map((r, k) => (k === n ? { ...r, ...patch } : r)));
  return (
    <section className="panel" style={{ gridColumn: "1 / -1" }}>
      <div className="panel-head">
        <h2>Evaluations</h2>
        <button className="btn small" onClick={() => setRows([...rows, { name: "New metric", direction: "min", threshold: 0 }])}>
          Add metric
        </button>
      </div>
      <div className="panel-body stack">
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Rule</th>
                <th>Threshold</th>
                <th>Latest</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((m, n) => (
                <tr key={n}>
                  <td>
                    <input id={`ev-name-${n}`} aria-label="Metric name" className="input" value={m.name} onChange={(e) => update(n, { name: e.target.value })} />
                  </td>
                  <td>
                    <select id={`ev-dir-${n}`} aria-label="Rule" className="select" value={m.direction} onChange={(e) => update(n, { direction: e.target.value as "min" | "max" })}>
                      <option value="min">at least</option>
                      <option value="max">at most</option>
                    </select>
                  </td>
                  <td>
                    <input id={`ev-th-${n}`} aria-label="Threshold" className="input" type="number" step="any" value={m.threshold} onChange={(e) => update(n, { threshold: Number(e.target.value) })} style={{ width: 80 }} />
                  </td>
                  <td>
                    <input
                      id={`ev-latest-${n}`}
                      aria-label="Latest score"
                      className="input"
                      type="number"
                      step="any"
                      value={m.latest ?? ""}
                      onChange={(e) => {
                        const { latest: _old, ...rest } = m;
                        setRows(rows.map((r, k) => (k === n ? (e.target.value === "" ? rest : { ...rest, latest: Number(e.target.value) }) : r)));
                      }}
                      style={{ width: 80 }}
                    />
                  </td>
                  <td>
                    <span className={`chip ${passes(m) ? "ok" : "crit"}`}>{passes(m) ? "Pass" : "Fail"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? <p className="faint">Define the metrics that must pass before a pilot.</p> : null}
        <div>
          <button className="btn primary" onClick={() => onSaved("Evaluations saved.", () => api("PUT", `/v1/ai/initiatives/${i.id}/evals`, { evals: rows.map(({ measuredAt: _m, ...r }) => r) }))}>
            Save evaluations
          </button>
        </div>
      </div>
    </section>
  );
}
