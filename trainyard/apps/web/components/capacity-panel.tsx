"use client";

// A team's capacity, three ways: typed in, calculated from its members (SAFe's 8 points per
// full-time contributor per iteration, minus days off, Scrum Master and PO excluded), or the
// mean of its last iterations' velocity. Opens from the team's name on the PI planning board.

import { useEffect, useState } from "react";
import type { CapacityMode, IterationCapacity, Person, Team, TeamMembership } from "@trainyard/core";
import { api, type ApiFailure } from "@/lib/api";

interface View {
  team: Team;
  increment: { id: string; name: string };
  people: Person[];
  iterations: IterationCapacity[];
}

const MODES: { id: CapacityMode; label: string; blurb: string }[] = [
  { id: "calculated", label: "Calculated from members", blurb: "Each contributing member: allocation × points per full-timer, minus days off. SM and PO excluded." },
  { id: "velocity", label: "From velocity", blurb: "The mean of the points the team finished in its last three iterations." },
  { id: "manual", label: "Typed in", blurb: "The team enters each iteration's figure itself." },
];

export function CapacityPanel({ teamId, incrementId, onClose, onSaved }: { teamId: string; incrementId: string; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState<View | null>(null);
  const [mode, setMode] = useState<CapacityMode>("manual");
  const [ppft, setPpft] = useState(8);
  const [members, setMembers] = useState<TeamMembership[]>([]);
  const [manual, setManual] = useState<Record<string, number>>({});
  const [newPerson, setNewPerson] = useState({ name: "", role: "developer" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const load = async () => {
    const r = await api<View>("GET", `/v1/teams/${encodeURIComponent(teamId)}/capacity?incrementId=${encodeURIComponent(incrementId)}`);
    setV(r);
    setMode(r.team.capacityMode ?? "manual");
    setPpft(r.team.pointsPerFullTime ?? 8);
    setMembers(r.team.members ?? []);
    setManual(Object.fromEntries(r.iterations.map((i) => [i.iterationId, i.manual])));
  };
  useEffect(() => {
    void load().catch((e) => setErr((e as ApiFailure).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, incrementId]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);

  if (!v) return <aside className="cap-drawer">{err ? <p className="notice crit">{err}</p> : <p className="faint">Loading…</p>}</aside>;
  const its = v.iterations;
  const personName = (id: string) => v.people.find((p) => p.id === id)?.name ?? id;
  const points = (m: TeamMembership, itId: string) => (m.contributes ? Math.max(0, Math.round((m.allocation * ppft - (m.vacationDays?.[itId] ?? 0)) * 10) / 10) : 0);
  const calcTotal = (it: IterationCapacity) => (it.isIP ? 0 : Math.round(members.reduce((a, m) => a + points(m, it.iterationId), 0) * 10) / 10);
  const effective = (it: IterationCapacity) => (mode === "calculated" ? calcTotal(it) : mode === "velocity" ? (it.velocity.mean ?? manual[it.iterationId] ?? 0) : (manual[it.iterationId] ?? 0));
  const setMember = (i: number, patch: Partial<TeamMembership>) => setMembers(members.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const setVacation = (i: number, itId: string, days: number) =>
    setMembers(
      members.map((m, j) => {
        if (j !== i) return m;
        const vacationDays = { ...(m.vacationDays ?? {}) };
        if (days > 0) vacationDays[itId] = days;
        else delete vacationDays[itId];
        return Object.keys(vacationDays).length ? { ...m, vacationDays } : (({ vacationDays: _v, ...rest }) => rest)(m);
      }),
    );
  const unassigned = v.people.filter((p) => !members.some((m) => m.personId === p.id));
  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      let body: Record<string, unknown> = { capacityMode: mode, pointsPerFullTime: ppft, members, capacity: manual };
      if (newPerson.name.trim()) body = { ...body, newPeople: [{ name: newPerson.name.trim(), role: newPerson.role }] };
      const r = await api<View & { created: { id: string; name: string }[] }>("PATCH", `/v1/teams/${encodeURIComponent(teamId)}/capacity?incrementId=${encodeURIComponent(incrementId)}`, body);
      if (r.created.length) {
        // A person added on the fly joins the team full-time; save again to attach them.
        const next = [...members, ...r.created.map((p) => ({ personId: p.id, allocation: 1, contributes: !/scrum|po|product owner|rte/i.test(newPerson.role) }))];
        await api("PATCH", `/v1/teams/${encodeURIComponent(teamId)}/capacity?incrementId=${encodeURIComponent(incrementId)}`, { members: next });
        setNewPerson({ name: "", role: "developer" });
      }
      await load();
      onSaved();
    } catch (e) {
      setErr((e as ApiFailure).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <aside className="cap-drawer" role="dialog" aria-label={`${v.team.name} capacity`}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <span className="eyebrow">Capacity · {v.increment.name}</span>
          <h2 style={{ margin: 0 }}>{v.team.name}</h2>
        </div>
        <button className="btn ghost" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
      {err ? <p className="notice crit">{err}</p> : null}

      <div className="cap-modes" role="radiogroup" aria-label="Capacity mode">
        {MODES.map((m) => (
          <label key={m.id} className={`cap-mode${mode === m.id ? " on" : ""}`}>
            <input type="radio" name="cap-mode" checked={mode === m.id} onChange={() => setMode(m.id)} />
            <b>{m.label}</b>
            <span>{m.blurb}</span>
          </label>
        ))}
      </div>

      <table className="cap-table">
        <thead>
          <tr>
            <th>Iteration</th>
            <th>Calculated</th>
            <th>Velocity</th>
            <th>Typed in</th>
            <th>Used</th>
          </tr>
        </thead>
        <tbody>
          {its.map((it) => (
            <tr key={it.iterationId} className={it.isIP ? "faint" : undefined}>
              <td>
                {it.iterationName}
                {it.isIP ? " · IP" : ""}
              </td>
              <td className="mono">{calcTotal(it)}</td>
              <td className="mono" title={it.velocity.samples.length ? it.velocity.samples.map((s) => `${s.iterationName}: ${s.done}`).join("\n") : "No finished iterations yet"}>
                {it.velocity.mean ?? "–"}
              </td>
              <td>
                <input className="input mono" type="number" min={0} step={1} aria-label={`${it.iterationName} capacity`} value={manual[it.iterationId] ?? 0} onChange={(e) => setManual({ ...manual, [it.iterationId]: Number(e.target.value) })} onFocus={() => mode !== "manual" && setMode("manual")} style={{ width: 70, padding: "2px 6px" }} />
              </td>
              <td className="mono">
                <b>{effective(it)}</b>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <b>Members</b>
        <label className="row" style={{ gap: 6, fontSize: "0.82rem" }}>
          Points per full-timer per iteration
          <input className="input mono" type="number" min={1} max={40} value={ppft} onChange={(e) => setPpft(Number(e.target.value))} style={{ width: 60, padding: "2px 6px" }} />
        </label>
      </div>
      <table className="cap-table">
        <thead>
          <tr>
            <th>Person</th>
            <th>Allocation</th>
            <th title="Delivers estimated work; Scrum Master and Product Owner usually do not">Counts</th>
            {its
              .filter((it) => !it.isIP)
              .map((it) => (
                <th key={it.iterationId} title={`Days off in ${it.iterationName}`}>
                  Off in {it.iterationName.replace(/^.*\./, "")}
                </th>
              ))}
            <th>Points</th>
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => (
            <tr key={m.personId} className={m.contributes ? undefined : "faint"}>
              <td>
                {personName(m.personId)}
                <span className="faint" style={{ fontSize: "0.72rem", marginLeft: 4 }}>{v.people.find((p) => p.id === m.personId)?.roles.join(", ")}</span>
              </td>
              <td>
                <input className="input mono" type="number" min={0} max={100} step={5} aria-label={`${personName(m.personId)} allocation %`} value={Math.round(m.allocation * 100)} onChange={(e) => setMember(i, { allocation: Math.min(1, Math.max(0, Number(e.target.value) / 100)) })} style={{ width: 60, padding: "2px 6px" }} />
                <span className="faint">%</span>
              </td>
              <td>
                <input type="checkbox" checked={m.contributes} aria-label={`${personName(m.personId)} delivers points`} onChange={(e) => setMember(i, { contributes: e.target.checked })} />
              </td>
              {its
                .filter((it) => !it.isIP)
                .map((it) => (
                  <td key={it.iterationId}>
                    <input className="input mono" type="number" min={0} max={15} aria-label={`${personName(m.personId)} days off ${it.iterationName}`} value={m.vacationDays?.[it.iterationId] ?? 0} onChange={(e) => setVacation(i, it.iterationId, Number(e.target.value))} style={{ width: 48, padding: "2px 4px" }} />
                  </td>
                ))}
              <td className="mono" title={its.filter((it) => !it.isIP).map((it) => `${it.iterationName}: ${points(m, it.iterationId)}`).join("\n")}>
                {(() => {
                  const ps = its.filter((it) => !it.isIP).map((it) => points(m, it.iterationId));
                  const lo = Math.min(...ps);
                  const hi = Math.max(...ps);
                  return lo === hi ? `${hi}` : `${lo}–${hi}`;
                })()}
              </td>
              <td>
                <button className="btn small ghost" aria-label={`Remove ${personName(m.personId)}`} onClick={() => setMembers(members.filter((_, j) => j !== i))}>
                  ×
                </button>
              </td>
            </tr>
          ))}
          {!members.length ? (
            <tr>
              <td colSpan={8} className="faint">
                No members yet. Add people below; the calculated mode needs them.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
        {unassigned.length ? (
          <select
            className="select"
            aria-label="Add an existing person"
            value=""
            onChange={(e) => {
              const p = v.people.find((x) => x.id === e.target.value);
              if (p) setMembers([...members, { personId: p.id, allocation: 1, contributes: !p.roles.some((r) => /scrum|^po$|product-owner|rte/i.test(r)) }]);
            }}
          >
            <option value="">Add an existing person…</option>
            {unassigned.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.roles.join(", ")}
              </option>
            ))}
          </select>
        ) : null}
        <input className="input" placeholder="New person's name" aria-label="New person's name" value={newPerson.name} onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })} style={{ width: 180 }} />
        <select className="select" aria-label="New person's role" value={newPerson.role} onChange={(e) => setNewPerson({ ...newPerson, role: e.target.value })}>
          {["developer", "tester", "ux", "architect", "ml-engineer", "scrum-master", "po", "other"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <span className="faint" style={{ fontSize: "0.78rem" }}>A new person joins full-time on save.</span>
      </div>
      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn primary" onClick={() => void save()} disabled={busy}>
          {busy ? "Saving…" : "Save capacity"}
        </button>
      </div>
      <p className="faint" style={{ fontSize: "0.78rem", margin: 0 }}>
        SAFe's quick-start: a full-time contributor delivers about 8 points per two-week iteration (a point is about a day), one point off per day of leave; Scrum Master and Product Owner do not count. Teams with history can use their velocity instead; either figure can be overridden by typing one in.
      </p>
    </aside>
  );
}
