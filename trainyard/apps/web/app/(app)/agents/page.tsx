"use client";

import { useState } from "react";
import { AUTONOMY_LABELS, type Agent } from "@trainyard/ai-portfolio";
import type { AutonomyLevel, Person, Team } from "@trainyard/core";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

type AgentView = Agent & { autonomyLabel: string; issues: string[] };
interface Ws {
  workspace: { people: Person[]; teams: Team[] };
  model: { name: string; aiNative: { enabled: boolean; maxAgentAutonomy: AutonomyLevel; requireAccountableHuman: boolean; agentsAsTeamMembers: boolean } };
}

const LEVELS = [0, 1, 2, 3, 4] as const;

export default function AgentsPage() {
  const agents = useApi<{ agents: AgentView[] }>("/v1/ai/agents");
  const ws = useApi<Ws>("/v1/workspace");
  const initiatives = useApi<{ initiatives: { id: string; name: string }[] }>("/v1/ai/initiatives");
  const [err, setErr] = useState<{ title: string; items: { message: string }[] } | null>(null);
  if (!agents.data || !ws.data || !initiatives.data) return <Loading error={agents.error ?? ws.error ?? initiatives.error} />;
  const { people, teams } = ws.data.workspace;
  const ai = ws.data.model.aiNative;
  const name = (id?: string) => (id ? people.find((p) => p.id === id)?.name ?? id : undefined);

  const patch = async (a: AgentView, body: object) => {
    try {
      await api("PATCH", `/v1/ai/agents/${a.id}`, body);
      setErr(null);
      await agents.reload();
    } catch (e) {
      const f = e as ApiFailure;
      setErr({ title: f.message, items: Array.isArray(f.details) ? (f.details as string[]).map((m) => ({ message: m })) : [] });
    }
  };

  return (
    <>
      <PageHead
        title="AI agents"
        sub={`Agents work alongside people on teams. ${ws.data.model.name} allows autonomy up to level ${ai.maxAgentAutonomy} (${AUTONOMY_LABELS[ai.maxAgentAutonomy].toLowerCase()})${ai.requireAccountableHuman ? ", and every agent needs a named accountable human" : ""}.`}
      />
      {!ai.enabled ? <div className="notice warn">AI-native settings are off for this operating model. Turn them on under Operating model to put agents on teams.</div> : null}
      {err ? <ErrorList title={err.title} items={err.items} /> : null}

      <section className="panel scroll-x" tabIndex={0}>
        <table className="table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Team</th>
              <th>Accountable human</th>
              <th>Autonomy</th>
              <th>Status</th>
              <th>Checks</th>
            </tr>
          </thead>
          <tbody>
            {agents.data.agents.map((a) => (
              <tr key={a.id}>
                <td>
                  <strong>{a.name}</strong>
                  <div className="faint" style={{ fontSize: "0.8rem" }}>{a.purpose}</div>
                  <div className="row" style={{ gap: 4, marginTop: 4 }}>
                    {a.tools.map((t) => (
                      <span key={t} className="chip">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="muted">{teams.find((t) => t.id === a.teamId)?.name ?? "–"}</td>
                <td>
                  <select id={`acc-${a.id}`} aria-label={`Accountable human for ${a.name}`} className="select" value={a.accountableId ?? ""} onChange={(e) => e.target.value && patch(a, { accountableId: e.target.value })}>
                    <option value="">Nobody</option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select id={`aut-${a.id}`} aria-label={`Autonomy for ${a.name}`} className="select" value={a.autonomy} onChange={(e) => patch(a, { autonomy: Number(e.target.value) })}>
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        L{l} · {AUTONOMY_LABELS[l]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select id={`st-${a.id}`} aria-label={`Status for ${a.name}`} className="select" value={a.status} onChange={(e) => patch(a, { status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="retired">Retired</option>
                  </select>
                </td>
                <td>
                  {a.issues.length === 0 ? (
                    <span className="chip ok">OK</span>
                  ) : (
                    a.issues.map((m) => (
                      <div key={m} style={{ color: "var(--crit)", fontSize: "0.8rem" }}>
                        {m[0]!.toUpperCase() + m.slice(1)}
                      </div>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <AddAgent people={people} teams={teams} initiatives={initiatives.data.initiatives} onAdded={() => void agents.reload()} />
    </>
  );
}

function AddAgent({ people, teams, initiatives, onAdded }: { people: Person[]; teams: Team[]; initiatives: { id: string; name: string }[]; onAdded: () => void }) {
  const [form, setForm] = useState({ name: "", purpose: "", teamId: "", initiativeId: "", accountableId: people[0]?.id ?? "", autonomy: 1, tools: "" });
  const [err, setErr] = useState<{ title: string; items: { message: string }[] } | null>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: k === "autonomy" ? Number(e.target.value) : e.target.value });
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        const body = {
          name: form.name,
          purpose: form.purpose,
          autonomy: form.autonomy,
          tools: form.tools.split(",").map((t) => t.trim()).filter(Boolean),
          ...(form.teamId ? { teamId: form.teamId } : {}),
          ...(form.initiativeId ? { initiativeId: form.initiativeId } : {}),
          ...(form.accountableId ? { accountableId: form.accountableId } : {}),
        };
        try {
          await api("POST", "/v1/ai/agents", body);
          setErr(null);
          setForm({ ...form, name: "", purpose: "", tools: "" });
          onAdded();
        } catch (x) {
          const f = x as ApiFailure;
          setErr({ title: f.message, items: Array.isArray(f.details) ? (f.details as string[]).map((m) => ({ message: m })) : [] });
        }
      }}
    >
      <div className="panel-head">
        <h2>Register an agent</h2>
      </div>
      <div className="panel-body stack">
        {err ? <ErrorList title={err.title} items={err.items} /> : null}
        <div className="row" style={{ alignItems: "flex-end" }}>
          <label className="field">
            Name
            <input id="ag-name" className="input" required value={form.name} onChange={set("name")} />
          </label>
          <label className="field" style={{ flex: "1 1 240px" }}>
            What it does
            <input id="ag-purpose" className="input" required value={form.purpose} onChange={set("purpose")} />
          </label>
          <label className="field">
            Team
            <select id="ag-team" className="select" value={form.teamId} onChange={set("teamId")}>
              <option value="">None</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            AI initiative
            <select id="ag-init" className="select" value={form.initiativeId} onChange={set("initiativeId")}>
              <option value="">None</option>
              {initiatives.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Accountable human
            <select id="ag-acc" className="select" value={form.accountableId} onChange={set("accountableId")}>
              <option value="">Nobody</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Autonomy
            <select id="ag-aut" className="select" value={form.autonomy} onChange={set("autonomy")}>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  L{l} · {AUTONOMY_LABELS[l]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Tools (comma separated)
            <input id="ag-tools" className="input" placeholder="github.read, jira.comment" value={form.tools} onChange={set("tools")} />
          </label>
          <button className="btn primary" type="submit">
            Register
          </button>
        </div>
      </div>
    </form>
  );
}
