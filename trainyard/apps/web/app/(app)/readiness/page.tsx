"use client";

// Launch and PI planning readiness: everything that has to be true before the room meets, in
// one place. The readiness checks for the increment, the ART backlog ranked by WSJF (scored
// here, inline), the risks raised so far with their ROAM, and the canvases a launch needs: the
// ART launch timeline and readiness checklist, LACE mission, value stream and ART canvases,
// feature and enabler canvases. The PI planning board links back here instead of carrying it.

import Link from "next/link";
import { useMemo, useState } from "react";
import { WSJF_SCALE, rankByWsjf, wsjfColumnGaps, type CanvasTypeDef, type Increment, type ReadinessReport, type Risk, type Roam, type Team, type WorkItem, type Wsjf } from "@trainyard/core";
import { AssistButton } from "@/components/assist";
import { CanvasCards, type CanvasSummary } from "@/components/canvas-cards";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

interface Board {
  increment: Increment;
  increments: { id: string; name: string }[];
  plannedLevel: string;
  teams: Team[];
  items: WorkItem[];
  readiness: ReadinessReport;
  risks: Risk[];
}

const ROAM: { key: Roam; label: string; hint: string }[] = [
  { key: "unroamed", label: "Not ROAMed", hint: "Raised, not yet discussed" },
  { key: "resolved", label: "Resolved", hint: "No longer a risk" },
  { key: "owned", label: "Owned", hint: "Someone takes it on" },
  { key: "accepted", label: "Accepted", hint: "We live with it" },
  { key: "mitigated", label: "Mitigated", hint: "A plan reduces it" },
];

const LAUNCH_CANVASES = ["art-launch", "lace-mission", "dvs-canvas", "art-canvas", "feature-canvas", "enabler-canvas"];

const PARTS: { key: keyof Wsjf; label: string; short: string }[] = [
  { key: "userBusinessValue", label: "User / business value", short: "UBV" },
  { key: "timeCriticality", label: "Time criticality", short: "TC" },
  { key: "riskReductionOpportunity", label: "Risk reduction / opportunity enablement", short: "RR | OE" },
  { key: "jobSize", label: "Job size (remaining), standing in for duration", short: "Job size" },
];

export default function ReadinessPage() {
  const [incrementId, setIncrementId] = useState<string | null>(null);
  const board = useApi<Board>(`/v1/board${incrementId ? `?incrementId=${incrementId}` : ""}`);
  const canvases = useApi<{ types: CanvasTypeDef[]; canvases: CanvasSummary[] }>("/v1/canvases");
  const [err, setErr] = useState<string | null>(null);
  const [newRisk, setNewRisk] = useState("");
  const b = board.data;
  const backlog = useMemo(() => (b ? rankByWsjf(b.items.filter((i) => i.level === b.plannedLevel && i.status !== "done")) : []), [b]);
  if (!b) return <Loading error={board.error} />;
  const teamName = (id?: string) => b.teams.find((t) => t.id === id)?.name ?? "Unassigned";
  const fail = (e: unknown) => setErr((e as ApiFailure).message);

  const draftOf = (i: WorkItem): Partial<Wsjf> => i.wsjf ?? (i as WorkItem & { draft?: Partial<Wsjf> }).draft ?? {};
  const scoreItem = async (item: WorkItem, key: keyof Wsjf, raw: string) => {
    const value = raw === "" ? null : Number(raw);
    const next: Partial<Wsjf> = { ...draftOf(item) };
    if (value === null || Number.isNaN(value)) delete next[key];
    else next[key] = value;
    // Saved once all four parts are in; clearing a part clears the score.
    const complete = PARTS.every((p) => typeof next[p.key] === "number");
    if (!complete && !item.wsjf) {
      board.setData({ ...b, items: b.items.map((i) => (i.id === item.id ? ({ ...i, draft: next } as WorkItem) : i)) });
      return;
    }
    try {
      await api("PATCH", `/v1/items/${encodeURIComponent(item.id)}`, { wsjf: complete ? next : null });
      await board.reload();
    } catch (e) {
      fail(e);
    }
  };

  const setRoam = async (r: Risk, roam: Roam) => {
    try {
      await api("PATCH", `/v1/risks/${encodeURIComponent(r.id)}`, { roam });
      await board.reload();
    } catch (e) {
      fail(e);
    }
  };
  const addRisk = async () => {
    if (!newRisk.trim()) return;
    try {
      await api("POST", "/v1/risks", { title: newRisk.trim() });
      setNewRisk("");
      await board.reload();
    } catch (e) {
      fail(e);
    }
  };

  const scored = backlog.filter((i) => i.wsjfScore !== null).length;
  // Each column is estimated on its own with the smallest feature at 1; a column without a 1 skews every score.
  const gaps = new Set(wsjfColumnGaps(backlog.filter((i) => i.wsjf).map((i) => i.wsjf!)));
  const roamed = b.risks.filter((r) => r.roam !== "unroamed").length;

  return (
    <>
      <PageHead
        title="Launch and PI planning readiness"
        sub="What has to be true before the room meets: capacity and estimates in, the ART backlog ranked by WSJF, risks raised and ROAMed, and the launch canvases done."
        actions={
          <>
            <select className="select" aria-label="Increment" value={b.increment.id} onChange={(e) => setIncrementId(e.target.value)}>
              {b.increments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
            <Link href="/board" className="btn primary">
              Go to the PI planning board
            </Link>
          </>
        }
      />
      {err ? <ErrorList title="That did not work" items={[{ message: err }]} /> : null}

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>{b.increment.name} readiness</h2>
            <span className={`chip ${b.readiness.ready ? "ok" : "warn"}`}>{b.readiness.ready ? "Ready" : "Not ready"}</span>
          </div>
          <ul className="panel-body stack" style={{ listStyle: "none", margin: 0 }}>
            {b.readiness.checks.map((c) => (
              <li key={c.key} className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                <span className="dot" style={{ background: c.ok ? "var(--ok)" : "var(--warn)", marginTop: 6 }} />
                <span>
                  {c.message}
                  {c.key === "wsjf" && !c.ok ? (
                    <>
                      {" "}
                      <a href="#wsjf">Score them below</a>.
                    </>
                  ) : null}
                </span>
              </li>
            ))}
            <li className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
              <span className="dot" style={{ background: b.risks.length && roamed === b.risks.length ? "var(--ok)" : "var(--warn)", marginTop: 6 }} />
              <span>
                {b.risks.length ? `${roamed} of ${b.risks.length} risk(s) ROAMed.` : "No risks raised yet."} <a href="#risks">Risks</a>
              </span>
            </li>
            <li>
              <AssistButton<{ verdict: string; briefing: string; actions: { action: string; ownerRole: string; before: string }[] }>
                label="Draft the readiness briefing"
                path="/v1/assist/readiness"
                body={{ incrementId: b.increment.id }}
                small
                render={(d) => (
                  <>
                    <span className={`chip ${d.verdict === "go" ? "ok" : d.verdict === "not-ready" ? "crit" : "warn"}`}>{d.verdict}</span>
                    <p>{d.briefing}</p>
                    {d.actions.length ? (
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {d.actions.map((a, n) => (
                          <li key={n}>
                            {a.action} <span className="faint">({a.ownerRole}, before {a.before})</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </>
                )}
              />
            </li>
          </ul>
        </section>

        <section className="panel" id="risks">
          <div className="panel-head">
            <h2>Risks and ROAM</h2>
            <span className="chip">
              {roamed} / {b.risks.length} ROAMed
            </span>
          </div>
          <div className="panel-body stack">
            {b.risks.length ? (
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }} className="stack">
                {b.risks.map((r) => (
                  <li key={r.id} className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap", gap: 10 }}>
                    <span style={{ minWidth: 0 }}>
                      <span className="dot" style={{ background: r.roam === "unroamed" ? "var(--crit)" : "var(--ok)", marginRight: 8 }} />
                      {r.title}
                    </span>
                    <select className="select" aria-label={`ROAM for ${r.title}`} value={r.roam} onChange={(e) => void setRoam(r, e.target.value as Roam)} title={ROAM.find((x) => x.key === r.roam)?.hint}>
                      {ROAM.map((x) => (
                        <option key={x.key} value={x.key}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="faint">No risks yet. Raise the ones you already know before the room meets; the rest come up in the breakouts.</p>
            )}
            <div className="row">
              <input className="input" style={{ flex: "1 1 240px" }} placeholder="Raise a risk" value={newRisk} onChange={(e) => setNewRisk(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void addRisk()} aria-label="New risk" />
              <button className="btn" onClick={() => void addRisk()} disabled={!newRisk.trim()}>
                Raise
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="panel" id="wsjf">
        <div className="panel-head">
          <h2>ART backlog by WSJF</h2>
          <span className="chip">
            {scored} / {backlog.length} scored
          </span>
        </div>
        <div className="panel-body stack">
          <p className="faint" style={{ margin: 0 }}>
            WSJF = cost of delay ÷ duration. Cost of delay is user-business value + time criticality + risk reduction and/or opportunity enablement; for features, job size stands in for duration (only what is left to do: work already done is a sunk cost). Score with Business Owners, Product Management and the affected teams, one column at a time: give the smallest feature a 1, then size the rest against it on 1, 2, 3, 5, 8, 13, 20. Every column needs at least one 1. Saved once all four are in.
          </p>
          <div className="scroll-x" tabIndex={0}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Feature</th>
                  <th>Team</th>
                  {PARTS.map((p) => (
                    <th key={p.key} title={p.label}>
                      {p.short}
                      {gaps.has(p.key) ? (
                        <span className="chip warn" style={{ marginLeft: 6 }} title="No feature has a 1 in this column: give the smallest one a 1 and size the rest against it">
                          no 1
                        </span>
                      ) : null}
                    </th>
                  ))}
                  <th>CoD</th>
                  <th>WSJF</th>
                </tr>
              </thead>
              <tbody>
                {backlog.map((i, n) => {
                  const d = draftOf(i);
                  return (
                    <tr key={i.id}>
                      <td className="mono">{i.wsjfScore !== null ? n + 1 : "–"}</td>
                      <td>{i.title}</td>
                      <td className="faint">{teamName(i.teamId)}</td>
                      {PARTS.map((p) => (
                        <td key={p.key}>
                          <select className="select mono" style={{ width: 72 }} aria-label={`${p.label} for ${i.title}`} value={d[p.key] ?? ""} onChange={(e) => void scoreItem(i, p.key, e.target.value)}>
                            <option value="">–</option>
                            {/* A value saved before the scale was enforced stays visible until it is re-scored. */}
                            {d[p.key] !== undefined && !(WSJF_SCALE as readonly number[]).includes(d[p.key]!) ? <option value={d[p.key]}>{d[p.key]}</option> : null}
                            {WSJF_SCALE.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                          {p.key === "jobSize" && d.jobSize === 20 ? (
                            <div className="faint" style={{ fontSize: "0.72rem" }}>
                              Consider splitting
                            </div>
                          ) : null}
                        </td>
                      ))}
                      <td className="mono">{i.costOfDelay ?? "–"}</td>
                      <td className="mono" style={{ fontWeight: 700 }}>
                        {i.wsjfScore ?? "–"}
                      </td>
                    </tr>
                  );
                })}
                {backlog.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="faint">
                      Nothing left to plan at the {b.plannedLevel} level for {b.increment.name}.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>Launch canvases</h2>
          <Link href="/canvases">Every canvas →</Link>
        </div>
        <p className="faint" style={{ margin: 0 }}>
          The ART launch timeline with the PI planning readiness checklist, the LACE mission, the value stream and ART canvases, and the feature and enabler canvases that ready the content.
        </p>
        {canvases.data ? <CanvasCards ids={LAUNCH_CANVASES} types={canvases.data.types} canvases={canvases.data.canvases} onError={setErr} /> : <Loading error={canvases.error} />}
      </section>
    </>
  );
}
