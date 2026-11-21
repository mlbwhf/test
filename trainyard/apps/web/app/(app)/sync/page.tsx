"use client";

import { useState } from "react";
import { Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

interface SyncState {
  connectors: string[];
  pending: { itemId: string; fields: string[]; at: string }[];
  last: Record<string, { finishedAt: string; added: string[]; updated: string[]; pushed: number; conflicts: unknown[]; error?: string }>;
  schedule: number;
  webhooks: boolean;
}
interface SyncResult {
  dryRun: boolean;
  added: string[];
  updated: string[];
  missing: string[];
  pushed: number;
  conflicts: { itemId: string; field: string; local: unknown; remote: unknown }[];
}

const TRACKERS = [
  {
    key: "jira",
    name: "Jira Cloud",
    env: ["TRAINYARD_JIRA", "JIRA_API_TOKEN"],
    how: "Pulls issues with a JQL query, maps projects to teams and sprints to iterations, and writes back sprint moves, story points, titles and Blocks links.",
  },
  {
    key: "ado",
    name: "Azure DevOps",
    env: ["TRAINYARD_ADO", "ADO_PAT"],
    how: "Pulls work items with WIQL, maps area paths to teams and iteration paths to iterations, and writes back iteration moves, story points, business value and Successor links.",
  },
] as const;

export default function SyncPage() {
  const state = useApi<SyncState>("/v1/sync");
  const [result, setResult] = useState<Record<string, SyncResult | string>>({});
  if (!state.data) return <Loading error={state.error} />;

  const run = async (system: string, dryRun: boolean) => {
    try {
      const r = await api<SyncResult>("POST", `/v1/sync/${system}${dryRun ? "?dry_run=true" : ""}`);
      setResult({ ...result, [system]: r });
      await state.reload();
    } catch (e) {
      setResult({ ...result, [system]: (e as ApiFailure).message });
    }
  };

  return (
    <>
      <PageHead
        title="Jira & Azure DevOps"
        sub={`Teams keep working in their own tracker. Trainyard reads their work, and plan changes made here are queued and written back on the next sync. ${state.data.schedule ? `Scheduled every ${state.data.schedule} min.` : "No schedule set (TRAINYARD_SYNC_EVERY_MINUTES)."} ${state.data.webhooks ? "Webhooks on." : "Webhooks off (TRAINYARD_WEBHOOK_SECRET)."}`}
      />
      <AdoConnect />
      <div className="grid-2">
        {TRACKERS.map((t) => {
          const connected = state.data!.connectors.includes(t.key);
          const r = result[t.key];
          return (
            <section key={t.key} className="panel">
              <div className="panel-head">
                <h2>{t.name}</h2>
                <span className={`chip ${connected ? "ok" : ""}`}>{connected ? "Connected" : "Not connected"}</span>
              </div>
              <div className="panel-body stack">
                <p className="muted">{t.how}</p>
                {state.data!.last[t.key] ? (
                  <p className="faint" style={{ fontSize: "0.8rem" }}>
                    Last sync {state.data!.last[t.key]!.finishedAt.slice(0, 16).replace("T", " ")}: {state.data!.last[t.key]!.error ? `failed (${state.data!.last[t.key]!.error})` : `${state.data!.last[t.key]!.added.length} new, ${state.data!.last[t.key]!.updated.length} changed, ${state.data!.last[t.key]!.pushed} written back`}
                  </p>
                ) : null}
                {connected ? (
                  <div className="row">
                    <button className="btn" onClick={() => run(t.key, true)}>
                      Preview sync
                    </button>
                    <button className="btn primary" onClick={() => run(t.key, false)}>
                      Sync now
                    </button>
                  </div>
                ) : (
                  <p className="faint" style={{ fontSize: "0.82rem" }}>
                    Set <span className="mono">{t.env[0]}</span> (mapping JSON) and <span className="mono">{t.env[1]}</span> on the API server, then restart it. See the README for the mapping format.
                  </p>
                )}
                {typeof r === "string" ? <div className="notice crit">{r}</div> : null}
                {r && typeof r !== "string" ? (
                  <div className="notice">
                    <strong>{r.dryRun ? "Preview" : "Synced"}</strong>: {r.added.length} new, {r.updated.length} changed in {t.name}, {r.pushed} change{r.pushed === 1 ? "" : "s"} {r.dryRun ? "to write back" : "written back"}, {r.missing.length} no longer found.
                    {r.conflicts.length ? (
                      <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                        {r.conflicts.map((c) => (
                          <li key={`${c.itemId}-${c.field}`}>
                            {c.itemId}: {c.field} changed on both sides (here {String(c.local)}, in {t.name} {String(c.remote)}).
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
      <section className="panel">
        <div className="panel-head">
          <h2>Changes waiting to sync</h2>
          <span className="faint">{state.data.pending.length}</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Fields</th>
              <th>Changed</th>
            </tr>
          </thead>
          <tbody>
            {state.data.pending.map((p, n) => (
              <tr key={n}>
                <td className="mono">{p.itemId}</td>
                <td>{p.fields.join(", ")}</td>
                <td className="mono faint">{p.at.slice(0, 16).replace("T", " ")}</td>
              </tr>
            ))}
            {state.data.pending.length === 0 ? (
              <tr>
                <td colSpan={3} className="faint">
                  Nothing waiting. Move a card on the PI planning board to queue a change.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}

/** The workspace's own Azure DevOps connection, for the Kanban and team boards: cards become work items. */
function AdoConnect() {
  const conn = useApi<{ connection: { organization: string; project: string; account: string; createdAt: string } | null; persistent: boolean }>("/v1/ado");
  const [organization, setOrganization] = useState("");
  const [project, setProject] = useState("");
  const [pat, setPat] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (!conn.data) return null;
  const c = conn.data.connection;
  const connect = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api("PUT", "/v1/ado", { organization: organization.trim(), project: project.trim(), pat: pat.trim() });
      setPat("");
      await conn.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel panel-body stack" style={{ gap: 10 }} aria-labelledby="ado-boards-head">
      <div className="stack" style={{ gap: 2 }}>
        <span className="eyebrow">Kanban and team boards</span>
        <h2 id="ado-boards-head" style={{ fontSize: "1.15rem" }}>Azure DevOps work items as cards</h2>
        <p className="muted" style={{ margin: 0 }}>Connect one Azure DevOps project. Then link a Portfolio, Solution Train, ART or Team Kanban, or a team PI board, to a work item type: its cards are the work items, and changes made on the board are written to Azure DevOps straight away.</p>
      </div>
      {c ? (
        <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <span className="chip">Connected</span>
          <span>
            <b>{c.organization} / {c.project}</b> <span className="faint">since {c.createdAt.slice(0, 10)}</span>
          </span>
          <button className="btn small" style={{ marginLeft: "auto" }} onClick={() => window.confirm("Disconnect Azure DevOps? Linked boards keep their cards but stop following Azure DevOps.") && void api("DELETE", "/v1/ado").then(() => conn.reload())}>Disconnect</button>
        </div>
      ) : (
        <form className="stack" style={{ gap: 10 }} onSubmit={(e) => (e.preventDefault(), void connect())}>
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <label className="field" style={{ flex: "1 1 200px" }}>
              Organization
              <input className="input" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="contoso" required maxLength={64} autoComplete="off" />
            </label>
            <label className="field" style={{ flex: "1 1 200px" }}>
              Project
              <input className="input" value={project} onChange={(e) => setProject(e.target.value)} placeholder="Shop" required maxLength={64} autoComplete="off" />
            </label>
            <label className="field" style={{ flex: "2 1 280px" }}>
              Personal access token
              <input className="input" type="password" value={pat} onChange={(e) => setPat(e.target.value)} required minLength={20} maxLength={4000} autoComplete="off" />
            </label>
          </div>
          <p className="faint" style={{ margin: 0, fontSize: "0.85rem" }}>In Azure DevOps: User settings, Personal access tokens, New token, scope Work Items (Read &amp; write). The token is stored encrypted and never shown again.{conn.data.persistent ? "" : " This server has no TRAINYARD_SECRET set, so the connection will not survive a restart."}</p>
          {err ? <div className="notice crit" role="alert">{err}</div> : null}
          <button className="btn primary" style={{ alignSelf: "flex-start" }} type="submit" disabled={busy}>{busy ? "Checking…" : "Connect Azure DevOps"}</button>
        </form>
      )}
    </section>
  );
}
