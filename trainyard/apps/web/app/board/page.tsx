"use client";

import { useMemo, useState } from "react";
import type { Dependency, DependencyCheck, Increment, LoadCell, Objective, ReadinessReport, Risk, Roam, Team, WorkItem } from "@trainyard/core";
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

  const columns: { id: string | null; name: string; dates?: string; isIP?: boolean; current?: boolean }[] = [
    { id: null, name: "Unplanned" },
    ...b.increment.iterations.map((i) => ({ id: i.id, name: i.name.replace(`${b.increment.name}.`, `${labels.iterationLabel} `), dates: `${i.start.slice(5)} – ${i.end.slice(5)}`, ...(i.isIP ? { isIP: true } : {}), current: i.start <= b.today && b.today <= i.end })),
  ];

  return (
    <>
      <PageHead
        title="Program board"
        sub={`${levelLabel}s planned by team and ${labels.iterationLabel.toLowerCase()}. Drag a card to replan it; changes queue to sync back to Jira or Azure DevOps.`}
        actions={
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
        }
      />
      {message ? (
        <div className={`notice ${message.kind === "crit" ? "crit" : ""}`} role="status">
          {message.text}
        </div>
      ) : null}

      <div className="panel scroll-x">
        <div style={{ display: "grid", gridTemplateColumns: `170px repeat(${columns.length}, minmax(150px, 1fr))`, minWidth: 170 + columns.length * 150 }}>
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
          {b.teams.map((team) => (
            <TeamRow
              key={team.id}
              team={team}
              columns={columns}
              items={b.items.filter((i) => i.teamId === team.id)}
              load={b.load.filter((l) => l.teamId === team.id)}
              severity={severityByItem}
              dragging={dragging}
              onDrag={setDragging}
              onDrop={move}
            />
          ))}
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
          <ul className="panel-body stack" style={{ listStyle: "none", margin: 0 }}>
            {b.readiness.checks.map((c) => (
              <li key={c.key} className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                <span className="dot" style={{ background: c.ok ? "var(--ok)" : "var(--warn)", marginTop: 6 }} />
                <span>{c.message}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Risks</h2>
            <span className="faint">{b.risks.filter((r) => r.roam === "unroamed").length} not ROAMed</span>
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
            <h2>Team objectives</h2>
            <span className="faint">{b.objectives.length}</span>
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
              {b.objectives.map((o) => (
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
    </>
  );
}

function TeamRow({
  team,
  columns,
  items,
  load,
  severity,
  dragging,
  onDrag,
  onDrop,
}: {
  team: Team;
  columns: { id: string | null; isIP?: boolean; current?: boolean }[];
  items: WorkItem[];
  load: LoadCell[];
  severity: Map<string, "warning" | "critical">;
  dragging: WorkItem | null;
  onDrag: (w: WorkItem | null) => void;
  onDrop: (w: WorkItem, iterationId: string | null) => void;
}) {
  const [over, setOver] = useState<string | null>(null);
  return (
    <>
      <div style={{ padding: 10, borderBottom: "1px solid var(--line)" }} className="stack">
        <strong>{team.name}</strong>
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
                className="card"
                draggable
                onDragStart={() => onDrag(it)}
                onDragEnd={() => onDrag(null)}
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--line-strong)",
                  borderLeft: `3px solid ${severity.get(it.id) === "critical" ? "var(--crit)" : severity.get(it.id) === "warning" ? "var(--warn)" : it.flowType === "enabler" ? "var(--ado)" : it.flowType === "defect" ? "var(--crit)" : "var(--chart)"}`,
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
    </>
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
