"use client";

// The OKR space: one set of objectives and key results (the outcome dashboard's objectives,
// outcomes and KPIs), shown three ways. Dashboard is read-only and derived; Alignment groups key
// results by objective and Check-in by status, and dragging on either changes the data, so every
// number on the Dashboard follows.

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Entity, OkrKeyResult, OkrStatus, OkrView } from "@trainyard/core";
import { LaneBoard, StatChip, useLaneState, type Lane } from "@/components/lane-board";
import { Loading, PageHead } from "@/components/ui";
import { api, useApi } from "@/lib/api";

type Data = { okrs: OkrView; entities: Entity[] };

const STATUS: Record<OkrStatus, { label: string; sub: string; color: string; tone: number }> = {
  on: { label: "On track", sub: "Confident", color: "#2f8f5b", tone: 3 },
  risk: { label: "At risk", sub: "Needs attention", color: "#b87a00", tone: 1 },
  off: { label: "Off track", sub: "Needs a decision", color: "#b42318", tone: 4 },
};
const health = (pct: number) => (pct >= 90 ? STATUS.on.color : pct >= 70 ? STATUS.risk.color : STATUS.off.color);

function useOkrs() {
  const [entityId, setEntityId] = useState<string>("");
  const q = useApi<Data>(`/v1/okrs${entityId ? `?entityId=${encodeURIComponent(entityId)}` : ""}`);
  const picker = q.data ? (
    <label className="row" style={{ gap: 6 }}>
      <span className="eyebrow">Entity</span>
      <select className="select" value={entityId} onChange={(e) => setEntityId(e.target.value)}>
        <option value="">Everything</option>
        {q.data.entities.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
    </label>
  ) : null;
  return { ...q, entityId, picker };
}

function Ring({ pct }: { pct: number }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="okr-ring">
      <span>{pct}%</span>
      <svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label={`Overall progress ${pct}%`}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeOpacity=".1" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--th-bar)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} transform="rotate(-90 60 60)" style={{ transition: "stroke-dasharray .5s" }} />
      </svg>
    </div>
  );
}

function Trend({ points }: { points: { period: string; progress: number }[] }) {
  if (points.length < 2) return <p className="faint">The trend appears once the sources hold more than one period.</p>;
  const W = 320;
  const H = 140;
  const x = (i: number) => 24 + (i * (W - 48)) / (points.length - 1);
  const y = (v: number) => H - 24 - (v / 100) * (H - 44);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Overall progress by period: ${points.map((p) => `${p.period} ${p.progress}%`).join(", ")}`}>
      <line x1="24" x2={W - 24} y1={y(100)} y2={y(100)} stroke="currentColor" strokeOpacity=".12" strokeDasharray="4 4" />
      <polyline points={points.map((p, i) => `${x(i)},${y(p.progress)}`).join(" ")} fill="none" stroke="var(--th-bar)" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={p.period}>
          <circle cx={x(i)} cy={y(p.progress)} r={i === points.length - 1 ? 6 : 3.5} fill="var(--th-bar)" />
          <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="currentColor" opacity=".6">
            {i === points.length - 1 ? "Now" : p.period.slice(2)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function OkrDashboard() {
  const q = useOkrs();
  if (!q.data) return <Loading error={q.error} />;
  const v = q.data.okrs;
  return (
    <>
      <PageHead title="OKR dashboard" sub="Live from your objectives and the data behind each key result. Drag key results on Alignment or Check-in and these numbers move." actions={q.picker} />
      <div className="okr-dash">
        <section className="okr-panel okr-overall">
          <Ring pct={v.overall} />
          <div>
            <div className="okr-k">Overall</div>
            <p className="faint">Average progress across all {v.counts.total} key results, each measured from its baseline to its target.</p>
          </div>
        </section>
        <div className="okr-tiles">
          {(["on", "risk", "off"] as OkrStatus[]).map((s) => (
            <section key={s} className="okr-panel okr-tile">
              <div className="okr-k">{STATUS[s].label}</div>
              <div className="okr-big" style={{ color: STATUS[s].color }}>
                {v.counts[s]}
              </div>
              <div className="faint">{s === "on" ? `of ${v.counts.total} key results` : STATUS[s].sub.toLowerCase()}</div>
            </section>
          ))}
          <section className="okr-panel okr-tile">
            <div className="okr-k">Days left</div>
            <div className="okr-big">{v.daysLeft}</div>
            <div className="faint">in this quarter</div>
          </section>
        </div>
        <section className="okr-panel">
          <div className="okr-k" style={{ marginBottom: 12 }}>
            Objectives
          </div>
          <div className="stack" style={{ gap: 18 }}>
            {v.objectives.map((o) => (
              <div key={o.id}>
                <div className="okr-obj-head">
                  <span className="okr-obj-title">{o.title}</span>
                  <b style={{ color: health(o.progress) }}>{o.progress}%</b>
                </div>
                <div className="okr-bar">
                  <span style={{ width: `${o.progress}%`, background: health(o.progress) }} />
                </div>
                <div className="okr-obj-foot">
                  <span>
                    {o.entity} · {o.keyResults.length} key results
                  </span>
                  <span>
                    {o.mix.on} on track · {o.mix.risk} at risk · {o.mix.off} off track
                  </span>
                </div>
              </div>
            ))}
            {v.objectives.length === 0 ? <p className="faint">No objectives yet. Add them under Sources, measures &amp; funding.</p> : null}
          </div>
        </section>
        <div className="okr-two">
          <section className="okr-panel">
            <div className="okr-k" style={{ marginBottom: 8 }}>
              Overall progress by period
            </div>
            <Trend points={v.trend} />
          </section>
          <section className="okr-panel">
            <div className="okr-obj-head" style={{ marginBottom: 8 }}>
              <span className="okr-k">Needs attention</span>
              <Link className="btn small primary" href="/okrs/check-in">
                Open check-in
              </Link>
            </div>
            {v.needsAttention.length ? (
              <ul className="okr-attn">
                {v.needsAttention.slice(0, 6).map((k) => (
                  <li key={k.measureId}>
                    <div>
                      <b>{k.name}</b>
                      <span className="faint">
                        {k.value} · target {k.target}
                        {k.checkIn ? ` · checked in by ${k.checkIn.by}` : ""}
                      </span>
                    </div>
                    <span className="okr-pill" style={{ color: STATUS[k.status].color, borderColor: STATUS[k.status].color }}>
                      {STATUS[k.status].label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="faint">Every key result is on track.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

const krCard = (k: OkrKeyResult, tone: number) => ({ id: k.measureId, lane: null as string | null, title: k.name, sub: `${k.value} · target ${k.target}`, tag: k.role === "outcome" ? "OUTCOME" : "KPI", chip: `${k.progress}%`, tone });

export function OkrAlignment() {
  const q = useOkrs();
  const notes = useLaneState("okr-alignment");
  const lanes: Lane[] = useMemo(() => (q.data?.okrs.objectives ?? []).map((o) => ({ id: o.id, title: o.title, sub: `${o.entity} · ${o.progress}%` })), [q.data]);
  const cards = useMemo(() => (q.data?.okrs.objectives ?? []).flatMap((o) => o.keyResults.map((k) => ({ ...krCard(k, STATUS[k.status].tone), lane: o.id }))), [q.data]);
  if (!q.data) return <Loading error={q.error} />;
  return (
    <>
      <PageHead title="Alignment" sub="Key results grouped by the objective they prove. Drag one to another objective to realign it; it keeps its role as an outcome or a KPI." actions={q.picker} />
      <LaneBoard
        title="OKR alignment"
        theme="okr"
        layout="rows"
        cardHeight={96}
        lanes={lanes}
        cards={cards}
        strip={<StatChip label="Overall" value={`${q.data.okrs.overall}%`} />}
        extras={notes.extras}
        onExtras={notes.setExtras}
        movedText={(c, l) => `Realigned “${c.title}” to ${l.title}`}
        onMove={async (id, lane) => {
          const r = await api<Data>("PUT", "/v1/okrs/align", { measureId: id, objectiveId: lane, ...(q.entityId ? { entityId: q.entityId } : {}) });
          q.setData(r);
        }}
      />
    </>
  );
}

export function OkrCheckIn() {
  const q = useOkrs();
  const notes = useLaneState("okr-check-in");
  const lanes: Lane[] = (["on", "risk", "off"] as OkrStatus[]).map((s) => ({ id: s, title: STATUS[s].label, sub: STATUS[s].sub, w: 360 }));
  const cards = useMemo(() => (q.data?.okrs.objectives ?? []).flatMap((o) => o.keyResults.map((k) => ({ ...krCard(k, STATUS[k.status].tone), lane: k.status as string, sub: `${k.value} · target ${k.target}${k.checkIn ? ` · ${k.checkIn.by}` : k.status !== k.computed ? "" : " · from data"}` }))), [q.data]);
  if (!q.data) return <Loading error={q.error} />;
  return (
    <>
      <PageHead title="Weekly check-in" sub="The same key results, grouped by status. The data proposes a status; drag a key result to say what is true today. Your check-in wins until the next one." actions={q.picker} />
      <LaneBoard
        title="Weekly check-in"
        theme="okr"
        cardHeight={96}
        lanes={lanes}
        cards={cards}
        strip={
          <>
            <StatChip label="On track" value={q.data.okrs.counts.on} />
            <StatChip label="At risk" value={q.data.okrs.counts.risk} />
            <StatChip label="Off track" value={q.data.okrs.counts.off} />
          </>
        }
        extras={notes.extras}
        onExtras={notes.setExtras}
        movedText={(c, l) => `“${c.title}” marked ${l.title.toLowerCase()}`}
        onMove={async (id, lane) => {
          const r = await api<Data>("PUT", "/v1/okrs/check-in", { measureId: id, status: lane, ...(q.entityId ? { entityId: q.entityId } : {}) });
          q.setData(r);
        }}
      />
    </>
  );
}
