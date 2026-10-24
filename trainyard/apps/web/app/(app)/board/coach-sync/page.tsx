"use client";

// Coach Sync radiator: the RTE's checkpoints through the PI planning breakouts. Questions
// down the side, teams across the top; click a cell to cycle its answer. Day 1 at 1:00,
// 2:00, 3:00 and 3:45; day 2 at 10:30 and 11:30.

import Link from "next/link";
import { useEffect, useState } from "react";
import { COACH_SYNC_ANSWERS, type CoachSyncAnswer, type CoachSyncCheckpoint, type CoachSyncState } from "@trainyard/core";
import { Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

interface View {
  increment: { id: string; name: string };
  increments: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  checkpoints: CoachSyncCheckpoint[];
  state: CoachSyncState;
  summary: { checkpointId: string; answered: number; total: number; help: string[]; done: boolean }[];
}

const ORDER: (CoachSyncAnswer | null)[] = [null, "yes", "partly", "no", "help"];

export default function CoachSyncPage() {
  const [incrementId, setIncrementId] = useState<string | null>(null);
  const res = useApi<View>(`/v1/coach-sync${incrementId ? `?incrementId=${encodeURIComponent(incrementId)}` : ""}`);
  const [state, setState] = useState<CoachSyncState | null>(null);
  const [summary, setSummary] = useState<View["summary"]>([]);
  const [cp, setCp] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (res.data) {
      setState(res.data.state);
      setSummary(res.data.summary);
      if (!cp) setCp(res.data.checkpoints.find((c) => !res.data!.summary.find((s) => s.checkpointId === c.id)?.done)?.id ?? res.data.checkpoints[0]!.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res.data]);
  if (!res.data || !state) return <Loading error={res.error} />;
  const v = res.data;
  const checkpoint = v.checkpoints.find((c) => c.id === cp) ?? v.checkpoints[0]!;
  const key = (q: string, t: string) => `${checkpoint.id}|${q}|${t}`;
  const cycle = async (questionId: string, teamId: string) => {
    const cur = state.answers[key(questionId, teamId)] ?? null;
    const next = ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length]!;
    const optimistic = { ...state, answers: { ...state.answers } };
    if (next === null) delete optimistic.answers[key(questionId, teamId)];
    else optimistic.answers[key(questionId, teamId)] = next;
    setState(optimistic);
    try {
      const r = await api<{ state: CoachSyncState; summary: View["summary"] }>("PUT", "/v1/coach-sync/answer", { incrementId: v.increment.id, checkpointId: checkpoint.id, questionId, teamId, answer: next });
      setState(r.state);
      setSummary(r.summary);
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  const note = async (teamId: string, text: string) => {
    try {
      const r = await api<{ state: CoachSyncState }>("PUT", "/v1/coach-sync/note", { incrementId: v.increment.id, checkpointId: checkpoint.id, teamId, note: text });
      setState(r.state);
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  const colour = (a: CoachSyncAnswer | undefined) => COACH_SYNC_ANSWERS.find((x) => x.id === a)?.color;
  const teamHelp = (t: string) => checkpoint.questions.some((q) => state.answers[key(q.id, t)] === "help");
  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <Link href="/board" className="faint" style={{ fontSize: "0.85rem" }}>
          ← PI planning board
        </Link>
      </div>
      <PageHead
        title="Coach Sync"
        sub="The Scrum of Scrums during PI planning: at each checkpoint the RTE walks the teams through the same few questions. Click a cell to answer for a team; red means a team needs help before the next review."
        actions={
          <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            PI
            <select className="select" value={v.increment.id} onChange={(e) => setIncrementId(e.target.value)}>
              {v.increments.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
        }
      />
      {err ? <p className="notice crit">{err}</p> : null}

      <div className="cs-agenda">
        {[1, 2].map((day) => (
          <div key={day} className="cs-day">
            <span className="eyebrow">Day {day}</span>
            {v.checkpoints
              .filter((c) => c.day === day)
              .map((c) => {
                const s = summary.find((x) => x.checkpointId === c.id);
                return (
                  <button key={c.id} className={`cs-stop${c.id === checkpoint.id ? " on" : ""}${s?.done ? " done" : ""}${s?.help.length ? " help" : ""}`} onClick={() => setCp(c.id)} aria-pressed={c.id === checkpoint.id}>
                    <span className="mono">{c.time}</span>
                    <b>{c.title}</b>
                    <span className="faint">
                      {s?.answered ?? 0}/{s?.total ?? 0}
                      {s?.help.length ? ` · ${s.help.length} need help` : ""}
                    </span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>

      <div className="panel scroll-x" tabIndex={0}>
        <table className="cs-grid">
          <thead>
            <tr>
              <th style={{ minWidth: 320 }}>
                <span className="mono faint">{checkpoint.time}</span> {checkpoint.title}
              </th>
              {v.teams.map((t) => (
                <th key={t.id} className={teamHelp(t.id) ? "help" : undefined}>
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {checkpoint.questions.map((q, i) => (
              <tr key={q.id}>
                <td>
                  <span className="mono faint" style={{ marginRight: 6 }}>
                    {i + 1}
                  </span>
                  {q.text}
                </td>
                {v.teams.map((t) => {
                  const a = state.answers[key(q.id, t.id)];
                  return (
                    <td key={t.id}>
                      <button className="cs-cell" style={{ background: colour(a) ?? "transparent", color: a ? "#fff" : "var(--ink-3)", borderColor: colour(a) ?? "var(--line)" }} onClick={() => void cycle(q.id, t.id)} title={`${t.name}: ${COACH_SYNC_ANSWERS.find((x) => x.id === a)?.label ?? "not answered"} · click to change`} aria-label={`${t.name}, ${q.text}: ${a ?? "not answered"}`}>
                        {a ? COACH_SYNC_ANSWERS.find((x) => x.id === a)?.label : "·"}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="faint">Notes for this checkpoint</td>
              {v.teams.map((t) => (
                <td key={t.id}>
                  <textarea className="input cs-note" defaultValue={state.notes[`${checkpoint.id}|${t.id}`] ?? ""} placeholder="…" aria-label={`${t.name} note`} onBlur={(e) => void note(t.id, e.target.value)} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="row" style={{ gap: 14, fontSize: "0.8rem" }}>
        {COACH_SYNC_ANSWERS.map((a) => (
          <span key={a.id} className="row" style={{ gap: 6 }}>
            <span style={{ width: 12, height: 12, background: a.color, borderRadius: 2 }} /> {a.label}
          </span>
        ))}
        <span className="faint">Click a cell to cycle: blank → yes → partly → not yet → needs help.</span>
      </div>
    </>
  );
}
