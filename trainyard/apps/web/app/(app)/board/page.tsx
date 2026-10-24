"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Dependency, DependencyCheck, Increment, IncrementMilestone, LoadCell, Objective, ReadinessReport, Risk, Roam, Team, WorkItem } from "@trainyard/core";
import { AssistButton } from "@/components/assist";
import { CapacityPanel } from "@/components/capacity-panel";
import { Loading, PageHead, SourceChip } from "@/components/ui";
import { api, useApi } from "@/lib/api";

interface Board {
  today: string;
  increment: Increment;
  increments: { id: string; name: string }[];
  plannedLevel: string;
  teams: Team[];
  items: WorkItem[];
  load: LoadCell[];
  dependencies: Dependency[];
  dependencyChecks: DependencyCheck[];
  readiness: ReadinessReport;
  objectives: Objective[];
  risks: Risk[];
  milestones: IncrementMilestone[];
}

const ROAM: { key: Roam; label: string }[] = [
  { key: "unroamed", label: "Not ROAMed" },
  { key: "resolved", label: "Resolved" },
  { key: "owned", label: "Owned" },
  { key: "accepted", label: "Accepted" },
  { key: "mitigated", label: "Mitigated" },
];

export default function BoardPage() {
  const [incrementId, setIncrementId] = useState<string | null>(null);
  const [capacityTeam, setCapacityTeam] = useState<string | null>(null);
  const board = useApi<Board>(`/v1/board${incrementId ? `?incrementId=${incrementId}` : ""}`);
  const model = useApi<{ model: { cadence: { iterationLabel: string; incrementLabel: string }; workLevels: { key: string; label: string }[] } }>("/v1/model");
  const [dragging, setDragging] = useState<WorkItem | null>(null);
  const [message, setMessage] = useState<{ kind: "ok" | "crit"; text: string } | null>(null);

  const severityByItem = useMemo(() => {
    const m = new Map<string, "warning" | "critical">();
    if (!board.data) return m;
    for (const c of board.data.dependencyChecks) {
      if (c.severity === "ok") continue;
      const d = board.data.dependencies.find((x) => x.id === c.dependencyId)!;
      for (const id of [d.providerId, d.consumerId]) if (m.get(id) !== "critical") m.set(id, c.severity);
    }
    return m;
  }, [board.data]);

  if (!board.data || !model.data) return <Loading error={board.error ?? model.error} />;
  const b = board.data;
  const labels = model.data.model.cadence;
  const levelLabel = model.data.model.workLevels.find((l) => l.key === b.plannedLevel)?.label ?? "Item";
  const title = (id: string) => b.items.find((i) => i.id === id)?.title ?? id;

  const move = async (item: WorkItem, iterationId: string | null) => {
    if ((item.iterationId ?? null) === iterationId) return;
    try {
      const res = await api<{ pendingSync: string[] }>("PATCH", `/v1/items/${item.id}`, { iterationId });
      const target = iterationId ? b.increment.iterations.find((i) => i.id === iterationId)?.name : "Unplanned";
      setMessage({ kind: "ok", text: `Moved "${item.title}" to ${target}.${res.pendingSync.length ? ` Queued to sync back to ${item.source.system === "jira" ? "Jira" : "Azure DevOps"}.` : ""}` });
      await board.reload();
    } catch (e) {
      setMessage({ kind: "crit", text: (e as Error).message });
    }
  };
  const setRoam = async (risk: Risk, roam: Roam) => {
    await api("PATCH", `/v1/risks/${risk.id}`, { roam });
    await board.reload();
  };

  // A card that other teams wait on is a significant dependency: red, with a string to each consumer.
  const providers = new Set(b.dependencies.map((d) => d.providerId));
  const addMilestone = async (iterationId: string | null) => {
    const label = window.prompt(`Milestone or event${iterationId ? "" : " after the last iteration"}: name it`);
    if (!label?.trim()) return;
    const kind = /release|launch|ship/i.test(label) ? "release" : /show|demo|conference|event|summit|day/i.test(label) ? "event" : "milestone";
    await api("POST", "/v1/milestones", { incrementId: b.increment.id, label: label.trim(), kind, ...(iterationId ? { iterationId } : {}) });
    await board.reload();
  };
  const removeMilestone = async (m: IncrementMilestone) => {
    if (!window.confirm(`Remove "${m.label}"?`)) return;
    await api("DELETE", `/v1/milestones/${m.id}`);
    await board.reload();
  };

  const columns: { id: string | null; name: string; dates?: string; isIP?: boolean; current?: boolean }[] = [
    { id: null, name: "Unplanned" },
    ...b.increment.iterations.map((i) => ({ id: i.id, name: i.name.replace(`${b.increment.name}.`, `${labels.iterationLabel} `), dates: `${i.start.slice(5)} – ${i.end.slice(5)}`, ...(i.isIP ? { isIP: true } : {}), current: i.start <= b.today && b.today <= i.end })),
  ];

  return (
    <>
      <PageHead
        title={`${labels.incrementLabel} planning board`}
        sub={`Milestones and events on top, ${levelLabel.toLowerCase()}s by team and ${labels.iterationLabel.toLowerCase()}, significant dependencies in red with their strings, risks to ROAM below. Drag a card to replan it; changes queue to sync back to Jira or Azure DevOps.`}
        actions={
          <div className="row" style={{ gap: 10, alignItems: "center" }}>
          <Link href="/board/coach-sync" className="btn small" title="The RTE's hourly checkpoints through the team breakouts">
            Coach Sync
          </Link>
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {labels.incrementLabel}
            <select id="board-inc" className="select" value={b.increment.id} onChange={(e) => setIncrementId(e.target.value)}>
              {b.increments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          </div>
        }
      />
      {message ? (
        <div className={`notice ${message.kind === "crit" ? "crit" : ""}`} role="status">
          {message.text}
        </div>
      ) : null}

      <div className="panel scroll-x" tabIndex={0}>
        <BoardGrid dependencies={b.dependencies} itemsKey={`${b.increment.id}:${b.items.map((i) => `${i.id}@${i.iterationId ?? ""}`).join(",")}`}>
          <div style={{ display: "grid", gridTemplateColumns: `170px repeat(${columns.length}, minmax(150px, 1fr)) 120px`, minWidth: 170 + columns.length * 150 + 120 }}>
            <div style={{ padding: 10, borderBottom: "1px solid var(--line)" }} className="eyebrow">
              Team
            </div>
            {columns.map((c) => (
              <div key={c.id ?? "none"} style={{ padding: 10, borderBottom: "1px solid var(--line)", borderLeft: "1px solid var(--line)", background: c.current ? "var(--signal-soft)" : c.isIP ? "var(--sunken)" : undefined }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                  {c.name}
                  {c.current ? <span className="chip" style={{ marginLeft: 6, borderColor: "var(--signal)", color: "var(--ink)" }}>Now</span> : null}
                </div>
                {c.dates ? <div className="mono faint" style={{ fontSize: "0.72rem" }}>{c.dates}</div> : null}
              </div>
            ))}
            <div style={{ padding: 10, borderBottom: "1px solid var(--line)", borderLeft: "1px solid var(--line)", fontWeight: 700, fontSize: "0.85rem" }} className="faint">
              Next {labels.incrementLabel} »
            </div>

            {/* Milestones and events: the top row. */}
            <div style={{ padding: 10, borderBottom: "2px solid var(--line-strong)" }} className="stack">
              <strong>Milestones &amp; events</strong>
              <span className="faint" style={{ fontSize: "0.75rem" }}>releases, trade shows, audits</span>
            </div>
            {[...columns, { id: "__next__" as string | null, name: "next" }].map((c) => {
              const inCell = b.milestones.filter((m) => (c.id === "__next__" ? !m.iterationId : m.iterationId === c.id));
              return (
                <div key={`ms-${c.id ?? "none"}`} style={{ borderLeft: "1px solid var(--line)", borderBottom: "2px solid var(--line-strong)", padding: 8, minHeight: 64, display: "flex", flexDirection: "column", gap: 6, background: c.isIP ? "var(--sunken)" : undefined }}>
                  {inCell.map((m) => (
                    <div key={m.id} className="ms-card" data-milestone-id={m.id} title={m.kind}>
                      <span className="ms-kind">{m.kind}</span>
                      <span>{m.label}</span>
                      {m.date ? <span className="mono faint" style={{ fontSize: "0.7rem" }}>{m.date.slice(5)}</span> : null}
                      <button className="ms-x" aria-label={`Remove ${m.label}`} onClick={() => void removeMilestone(m)}>
                        ×
                      </button>
                    </div>
                  ))}
                  {c.id !== null ? (
                    <button className="ms-add" onClick={() => void addMilestone(c.id === "__next__" ? null : c.id)} title="Add a milestone or event here">
                      +
                    </button>
                  ) : null}
                </div>
              );
            })}

            {b.teams.map((team) => (
              <TeamRow
                key={team.id}
                team={team}
                columns={columns}
                items={b.items.filter((i) => i.teamId === team.id)}
                load={b.load.filter((l) => l.teamId === team.id)}
                severity={severityByItem}
                providers={providers}
                dragging={dragging}
                onDrag={setDragging}
                onDrop={move}
                onCapacity={() => setCapacityTeam(team.id)}
              />
            ))}

            {/* Risks: ROAM them here, in the room. */}
            <div style={{ padding: 10, borderTop: "2px solid var(--line-strong)" }} className="stack">
              <strong>Risks</strong>
              <span className="faint" style={{ fontSize: "0.75rem" }}>{b.risks.filter((r) => r.roam === "unroamed").length} to ROAM</span>
            </div>
            <div style={{ gridColumn: `span ${columns.length + 1}`, borderTop: "2px solid var(--line-strong)", borderLeft: "1px solid var(--line)", padding: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {b.risks.map((r) => (
                <div key={r.id} className={`risk-card roam-${r.roam}`}>
                  <div style={{ fontWeight: 600, fontSize: "0.82rem", lineHeight: 1.3 }}>{r.title}</div>
                  <select aria-label={`ROAM status for ${r.title}`} className="select" style={{ marginTop: 6, fontSize: "0.75rem", padding: "2px 6px" }} value={r.roam} onChange={(e) => setRoam(r, e.target.value as Roam)}>
                    {ROAM.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {b.risks.length === 0 ? <span className="faint">No risks raised yet. Add them below.</span> : null}
            </div>
          </div>
        </BoardGrid>
        <div className="row faint" style={{ gap: 14, padding: "8px 12px", fontSize: "0.78rem" }}>
          <span>
            <i className="lg lg-blue" /> {levelLabel}
          </span>
          <span>
            <i className="lg lg-red" /> Significant dependency (another team waits on it)
          </span>
          <span>
            <i className="lg lg-orange" /> Milestone or event
          </span>
          <span>
            <i className="lg lg-string" /> String from the waiting {levelLabel.toLowerCase()} to what it waits on; dashed when the timing is wrong
          </span>
        </div>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Dependencies</h2>
            <span className="faint">{b.dependencies.length}</span>
          </div>
          <table className="table">
            <tbody>
              {b.dependencyChecks.map((c) => {
                const d = b.dependencies.find((x) => x.id === c.dependencyId)!;
                return (
                  <tr key={c.dependencyId}>
                    <td style={{ width: 90 }}>
                      <span className={`chip ${c.severity === "critical" ? "crit" : c.severity === "warning" ? "warn" : "ok"}`}>{c.severity === "ok" ? "On track" : c.severity}</span>
                    </td>
                    <td>
                      <div>
                        <strong>{title(d.providerId)}</strong> <span className="faint">→</span> {title(d.consumerId)}
                      </div>
                      <div className="faint" style={{ fontSize: "0.8rem" }}>{c.severity === "ok" ? d.note : c.message}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>{labels.incrementLabel} Planning readiness</h2>
            <span className={`chip ${b.readiness.ready ? "ok" : "warn"}`}>{b.readiness.ready ? "Ready" : "Not ready"}</span>
          </div>
          <div className="panel-body stack">
            <span className="muted">
              {b.readiness.checks.filter((c) => c.ok).length} of {b.readiness.checks.length} checks pass. Readiness, the WSJF-ranked backlog, risks and the launch canvases live together before the event.
            </span>
            <Link href="/readiness" className="btn" style={{ alignSelf: "flex-start" }}>
              Open readiness, WSJF and risks →
            </Link>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Risks</h2>
            <span className="faint">{b.risks.filter((r) => r.roam === "unroamed").length} not ROAMed</span>
          </div>
          <div className="panel-body" style={{ paddingBottom: 0 }}>
            <AssistButton<{ summary: string; suggestions: { riskId: string; roam: Roam; reason: string; ownerRole?: string }[]; missingRisks: string[] }>
              label="Suggest ROAM"
              path="/v1/assist/risks"
              small
              render={(d) => (
                <>
                  <p>{d.summary}</p>
                  {d.suggestions.map((sg) => {
                    const risk = b.risks.find((r) => r.id === sg.riskId);
                    if (!risk) return null;
                    return (
                      <div key={sg.riskId} className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "0.85rem" }}>
                          <strong>{risk.title}</strong>: {sg.roam}
                          {sg.ownerRole ? ` (${sg.ownerRole})` : ""}. <span className="faint">{sg.reason}</span>
                        </span>
                        <button className="btn small" disabled={risk.roam === sg.roam} onClick={() => setRoam(risk, sg.roam)}>
                          Apply
                        </button>
                      </div>
                    );
                  })}
                  {d.missingRisks.length ? (
                    <div>
                      <span className="eyebrow">Risks nobody has raised</span>
                      {d.missingRisks.map((m, n) => (
                        <div key={n} className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
                          <span style={{ fontSize: "0.85rem" }}>{m}</span>
                          <button className="btn small" onClick={async () => (await api("POST", "/v1/risks", { title: m, groupId: "art-customer" }), void board.reload())}>
                            Raise
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            />
          </div>
          <table className="table">
            <tbody>
              {b.risks.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td style={{ width: 140 }}>
                    <select id={`roam-${r.id}`} aria-label={`ROAM status for ${r.title}`} className="select" value={r.roam} onChange={(e) => setRoam(r, e.target.value as Roam)}>
                      {ROAM.map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>ART PI objectives</h2>
            <span className="faint">{b.objectives.filter((o) => o.level === "art").length}</span>
          </div>
          <div className="panel-body stack" style={{ paddingBottom: 0 }}>
            <ArtObjectives objectives={b.objectives} teams={b.teams} incrementId={b.increment.id} onSaved={() => void board.reload()} />
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Team objectives</h2>
            <span className="faint">{b.objectives.filter((o) => o.level !== "art").length}</span>
          </div>
          <div className="panel-body stack" style={{ paddingBottom: 0 }}>
            <DraftObjectives teams={b.teams} incrementId={b.increment.id} onSaved={() => void board.reload()} />
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Objective</th>
                <th>Team</th>
                <th style={{ textAlign: "right" }}>Planned BV</th>
                <th style={{ textAlign: "right" }}>Actual</th>
              </tr>
            </thead>
            <tbody>
              {b.objectives.filter((o) => o.level !== "art").map((o) => (
                <tr key={o.id}>
                  <td>
                    {o.title} {o.committed ? null : <span className="chip">Stretch</span>}
                  </td>
                  <td className="muted">{b.teams.find((t) => t.id === o.teamId)?.name}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{o.plannedValue}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{o.actualValue ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      {capacityTeam ? <CapacityPanel teamId={capacityTeam} incrementId={b.increment.id} onClose={() => setCapacityTeam(null)} onSaved={() => void board.reload()} /> : null}
    </>
  );
}

function TeamRow({
  team,
  columns,
  items,
  load,
  severity,
  providers,
  dragging,
  onDrag,
  onDrop,
  onCapacity,
}: {
  team: Team;
  columns: { id: string | null; isIP?: boolean; current?: boolean }[];
  items: WorkItem[];
  load: LoadCell[];
  severity: Map<string, "warning" | "critical">;
  providers: Set<string>;
  dragging: WorkItem | null;
  onDrag: (w: WorkItem | null) => void;
  onDrop: (w: WorkItem, iterationId: string | null) => void;
  onCapacity: () => void;
}) {
  const [over, setOver] = useState<string | null>(null);
  const modeLabel = team.capacityMode === "calculated" ? "capacity from members" : team.capacityMode === "velocity" ? "capacity from velocity" : "capacity typed in";
  return (
    <>
      <div style={{ padding: 10, borderBottom: "1px solid var(--line)" }} className="stack">
        <button className="team-name-btn" onClick={onCapacity} title="Members, allocation and capacity">
          {team.name}
        </button>
        <span className="faint" style={{ fontSize: "0.72rem" }}>
          {team.members?.length ? `${team.members.length} people · ` : ""}
          {modeLabel}
        </span>
        <div className="row" style={{ gap: 4 }}>
          <SourceChip system={team.source} />
          {team.agentIds.length ? <span className="chip ai">{team.agentIds.length} agent{team.agentIds.length > 1 ? "s" : ""}</span> : null}
        </div>
      </div>
      {columns.map((c) => {
        const key = c.id ?? "none";
        const cellItems = items.filter((i) => (i.iterationId ?? null) === c.id);
        const cell = load.find((l) => l.iterationId === c.id);
        const canDrop = dragging?.teamId === team.id;
        return (
          <div
            key={key}
            onDragOver={(e) => {
              if (!canDrop) return;
              e.preventDefault();
              setOver(key);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              if (dragging && canDrop) onDrop(dragging, c.id);
              onDrag(null);
            }}
            style={{
              borderLeft: "1px solid var(--line)",
              borderBottom: "1px solid var(--line)",
              padding: 8,
              minHeight: 96,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              background: over === key ? "var(--signal-soft)" : c.isIP ? "var(--sunken)" : undefined,
            }}
          >
            {cell && cell.capacity + cell.load > 0 ? <LoadMeter cell={cell} /> : null}
            {cellItems.map((it) => (
              <article
                key={it.id}
                className={`card pb-card ${providers.has(it.id) ? "pb-dep" : "pb-feature"}${severity.get(it.id) ? ` pb-${severity.get(it.id)}` : ""}`}
                data-item-id={it.id}
                draggable
                onDragStart={() => onDrag(it)}
                onDragEnd={() => onDrag(null)}
                title={providers.has(it.id) ? "Significant dependency: another team waits on this" : undefined}
                style={{
                  borderLeft: `3px solid ${severity.get(it.id) === "critical" ? "var(--crit)" : severity.get(it.id) === "warning" ? "var(--warn)" : it.flowType === "enabler" ? "var(--ado)" : it.flowType === "defect" ? "var(--crit)" : providers.has(it.id) ? "#c2412d" : "#4a8fe0"}`,
                  borderRadius: 6,
                  padding: "6px 8px",
                  cursor: "grab",
                  fontSize: "0.82rem",
                }}
              >
                <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{it.title}</div>
                <div className="row" style={{ gap: 4, marginTop: 4 }}>
                  {it.source.url ? (
                    <a href={it.source.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                      <SourceChip system={it.source.system} id={it.source.externalId} />
                    </a>
                  ) : (
                    <SourceChip system={it.source.system} />
                  )}
                  {it.aiInitiativeId ? <span className="chip ai">AI</span> : null}
                  <span className="mono faint" style={{ fontSize: "0.72rem", marginLeft: "auto" }} title="Estimate · business value">
                    {it.estimate ?? "?"} pt · BV {it.businessValue ?? "?"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        );
      })}
      <div style={{ borderLeft: "1px solid var(--line)", borderBottom: "1px solid var(--line)", background: "var(--sunken)" }} />
    </>
  );
}

/** Draws the red strings between a waiting card and what it waits on, re-measured when the grid changes. */
function BoardGrid({ dependencies, itemsKey, children }: { dependencies: Dependency[]; itemsKey: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ id: string; d: string; bad: boolean }[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const measure = () => {
    const root = ref.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const at = (id: string) => root.querySelector<HTMLElement>(`[data-item-id="${CSS.escape(id)}"]`)?.getBoundingClientRect();
    const next: { id: string; d: string; bad: boolean }[] = [];
    for (const dep of dependencies) {
      const from = at(dep.consumerId);
      const to = at(dep.providerId);
      if (!from || !to) continue;
      const x1 = from.left - box.left + root.scrollLeft + from.width / 2;
      const y1 = from.top - box.top + root.scrollTop + from.height / 2;
      const x2 = to.left - box.left + root.scrollLeft + to.width / 2;
      const y2 = to.top - box.top + root.scrollTop + to.height / 2;
      const dx = Math.max(40, Math.abs(x2 - x1) / 2);
      next.push({ id: dep.id, d: `M ${x1} ${y1} C ${x1 - dx} ${y1}, ${x2 + dx} ${y2}, ${x2} ${y2}`, bad: dep.status === "open" && x2 > x1 });
    }
    setLines(next);
    setSize({ w: root.scrollWidth, h: root.scrollHeight });
  };
  useLayoutEffect(measure, [dependencies, itemsKey]);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      {children}
      <svg className="pb-strings" width={size.w} height={size.h} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", overflow: "visible" }} aria-hidden="true">
        {lines.map((l) => (
          <g key={l.id}>
            <path d={l.d} fill="none" stroke="#c2412d" strokeWidth={2} strokeDasharray={l.bad ? "6 5" : undefined} opacity={0.85} />
            <circle r={4} fill="#c2412d">
              <animateMotion dur="0.01s" fill="freeze" path={l.d} />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}

function LoadMeter({ cell }: { cell: LoadCell }) {
  const pct = cell.capacity > 0 ? Math.min(100, (cell.load / cell.capacity) * 100) : 100;
  const color = cell.state === "over" ? "var(--crit)" : cell.state === "near" ? "var(--warn)" : "var(--ok)";
  return (
    <div title={`Load ${cell.load} of ${cell.capacity} capacity`}>
      <div className="row mono" style={{ justifyContent: "space-between", fontSize: "0.7rem", color: cell.state === "over" ? "var(--crit)" : "var(--ink-3)" }}>
        <span>Load</span>
        <span>
          {cell.load}/{cell.capacity}
        </span>
      </div>
      <div style={{ height: 4, background: "var(--sunken)", borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

type ArtDraft = { objectives: { title: string; businessValue: number; committed: boolean; sourceObjectiveIds: string[]; rationale: string }[]; gaps: string };

function ArtObjectives({ objectives, teams, incrementId, onSaved }: { objectives: Objective[]; teams: Team[]; incrementId: string; onSaved: () => void }) {
  const art = objectives.filter((o) => o.level === "art");
  const teamObjectives = objectives.filter((o) => o.level !== "art");
  const [draft, setDraft] = useState<ArtDraft | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const teamName = (id: string | undefined) => teams.find((t) => t.id === id)?.name ?? "";
  const sources = (ids: string[] | undefined) => (ids ?? []).map((id) => objectives.find((o) => o.id === id)).filter((o): o is Objective => !!o);
  const accept = async (o: ArtDraft["objectives"][number]) => {
    await api("POST", "/v1/objectives", { incrementId, level: "art", title: o.title, plannedValue: o.businessValue, committed: o.committed, sourceObjectiveIds: o.sourceObjectiveIds });
    setDraft((d) => (d ? { ...d, objectives: d.objectives.filter((x) => x !== o) } : d));
    onSaved();
  };
  return (
    <div className="stack" style={{ gap: 8 }}>
      <p className="faint" style={{ margin: 0, fontSize: "0.84rem" }}>
        The train's summary of what its teams committed to, written from the team objectives below: grouped by outcome, business value carried up, uncommitted when any team objective under it is.
      </p>
      <div className="row" style={{ gap: 8 }}>
        <button
          className="btn small"
          disabled={!teamObjectives.length}
          onClick={async () => {
            setErr(null);
            try {
              const r = await api<{ draft: ArtDraft }>("POST", "/v1/objectives/synthesise", { incrementId });
              setDraft(r.draft);
            } catch (e) {
              setErr((e as Error).message);
            }
          }}
          title="Rule-based: clusters team objectives that share a theme"
        >
          Synthesise from team objectives
        </button>
        <AssistButton<ArtDraft> label="Draft with the assistant" path="/v1/assist/art-objectives" body={{ incrementId }} small render={(d, close) => (
          <>
            {d.objectives.map((o, n) => (
              <div key={n} className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap", alignItems: "flex-start" }}>
                <span style={{ fontSize: "0.85rem" }}>
                  <strong>{o.title}</strong> · BV {o.businessValue} {o.committed ? "" : "· uncommitted"}
                  <div className="faint">{o.rationale}</div>
                  <div className="faint" style={{ fontSize: "0.75rem" }}>From: {sources(o.sourceObjectiveIds).map((s) => `${teamName(s.teamId)}: ${s.title}`).join(" · ")}</div>
                </span>
                <button className="btn small" onClick={async () => (await accept(o), close())}>
                  Add
                </button>
              </div>
            ))}
            {d.gaps ? <p className="faint">{d.gaps}</p> : null}
          </>
        )} />
      </div>
      {err ? <p className="notice crit">{err}</p> : null}
      {draft ? (
        <div className="stack" style={{ gap: 6, padding: 10, border: "1px dashed var(--line-strong)", borderRadius: 8 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <b style={{ fontSize: "0.85rem" }}>Draft ART objectives</b>
            <span className="row" style={{ gap: 6 }}>
              <button
                className="btn small primary"
                onClick={async () => {
                  for (const o of draft.objectives) await api("POST", "/v1/objectives", { incrementId, level: "art", title: o.title, plannedValue: o.businessValue, committed: o.committed, sourceObjectiveIds: o.sourceObjectiveIds });
                  setDraft(null);
                  onSaved();
                }}
              >
                Add all
              </button>
              <button className="btn small ghost" onClick={() => setDraft(null)}>
                Discard
              </button>
            </span>
          </div>
          {draft.objectives.map((o, n) => (
            <div key={n} className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap", alignItems: "flex-start", fontSize: "0.85rem" }}>
              <span>
                <strong>{o.title}</strong> · BV {o.businessValue} {o.committed ? "" : "· uncommitted"}
                <div className="faint">{o.rationale}</div>
                <div className="faint" style={{ fontSize: "0.75rem" }}>From: {sources(o.sourceObjectiveIds).map((s) => `${teamName(s.teamId)}: ${s.title}`).join(" · ")}</div>
              </span>
              <button className="btn small" onClick={() => void accept(o)}>
                Add
              </button>
            </div>
          ))}
          {!draft.objectives.length ? <span className="faint">All added.</span> : null}
        </div>
      ) : null}
      {art.length ? (
        <table className="table">
          <thead>
            <tr>
              <th>ART objective</th>
              <th>From</th>
              <th style={{ textAlign: "right" }}>Planned BV</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {art.map((o) => (
              <tr key={o.id}>
                <td>
                  {o.title} {o.committed ? null : <span className="chip">Uncommitted</span>}
                </td>
                <td className="muted" style={{ fontSize: "0.8rem" }}>
                  {sources(o.sourceObjectiveIds).map((s) => (
                    <div key={s.id}>
                      <b>{teamName(s.teamId)}</b> {s.title}
                    </div>
                  ))}
                </td>
                <td className="mono" style={{ textAlign: "right" }}>{o.plannedValue}</td>
                <td>
                  <button className="btn small ghost" aria-label={`Remove ${o.title}`} onClick={async () => (await api("DELETE", `/v1/objectives/${o.id}`), onSaved())}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <span className="faint" style={{ fontSize: "0.84rem" }}>No ART objectives yet.</span>
      )}
    </div>
  );
}

function DraftObjectives({ teams, incrementId, onSaved }: { teams: Team[]; incrementId: string; onSaved: () => void }) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row">
        <select id="draft-team" aria-label="Team to draft objectives for" className="select" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <AssistButton<{ objectives: { title: string; businessValue: number; committed: boolean; featureIds: string[]; rationale: string }[]; gaps: string }>
          label="Draft objectives from planned features"
          path="/v1/assist/objectives"
          body={{ teamId, incrementId }}
          small
          render={(d) => (
            <>
              {d.objectives.map((o, n) => (
                <div key={n} className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "0.85rem" }}>
                    <strong>{o.title}</strong> · BV {o.businessValue} {o.committed ? "" : "· stretch"}
                    <div className="faint">{o.rationale}</div>
                  </span>
                  <button className="btn small" onClick={async () => (await api("POST", "/v1/objectives", { incrementId, teamId, title: o.title, plannedValue: o.businessValue, committed: o.committed }), onSaved())}>
                    Add
                  </button>
                </div>
              ))}
              {d.gaps ? <p className="faint">{d.gaps}</p> : null}
            </>
          )}
        />
      </div>
    </div>
  );
}
