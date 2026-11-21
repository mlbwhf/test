"use client";

// Azure DevOps on a Kanban or team board: a bar that says whether the board's cards are work
// items, links the board to a work item type (with the tracker state each board state writes
// and, for a team, the iterations), refreshes from Azure DevOps and unlinks.

import { useState } from "react";
import { KANBAN_LEVELS, type Board, type KanbanLevel } from "@trainyard/core";
import { api, useApi, type ApiFailure } from "@/lib/api";

interface Link {
  type: string;
  areaPath?: string;
  states: string[];
  iterations?: string[];
  pulledAt?: string;
}
interface Meta {
  types: string[];
  iterations: { path: string; name: string }[];
  states: { name: string; category: string }[];
  suggested: string[];
}
const DEFAULT_TYPE: Record<KanbanLevel, string[]> = { portfolio: ["Epic"], solution: ["Capability", "Feature"], art: ["Feature"], team: ["User Story", "Product Backlog Item", "Requirement"] };
const TEAM_ITERS = ["Iteration 1", "Iteration 2", "Iteration 3", "Iteration 4", "IP iteration"];

export function AdoBar({ board, level, readOnly, onChanged }: { board: Board; level: KanbanLevel; readOnly: boolean; onChanged: () => void }) {
  const spec = KANBAN_LEVELS[level], base = `/v1/boards/${encodeURIComponent(board.id)}/ado`;
  const info = useApi<{ link: Link | null; connection: { organization: string; project: string } | null }>(board.isTemplate ? null : base);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [type, setType] = useState("");
  const [area, setArea] = useState("");
  const [states, setStates] = useState<string[]>([]);
  const [iters, setIters] = useState<string[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  if (board.isTemplate || !info.data) return null;
  const { link, connection } = info.data;

  const run = async (label: string, fn: () => Promise<{ added?: number; updated?: number; removed?: number; total?: number } | void>) => {
    setBusy(true);
    setErr(null);
    try {
      const r = await fn();
      setMsg(r && r.total !== undefined ? `${label}: ${r.total} work items, ${r.added ?? 0} new, ${r.updated ?? 0} changed, ${r.removed ?? 0} gone.` : label);
      void info.reload();
      onChanged();
    } catch (e) {
      setMsg(null);
      setErr((e as ApiFailure).message);
    } finally {
      setBusy(false);
    }
  };
  const loadMeta = async (t?: string) => {
    setErr(null);
    try {
      const m = await api<Meta>("GET", `/v1/ado/meta?level=${level}${t ? `&type=${encodeURIComponent(t)}` : ""}`);
      setMeta(m);
      const pick = t ?? DEFAULT_TYPE[level].find((x) => m.types.includes(x)) ?? "";
      if (!t && pick) return loadMeta(pick);
      setType(pick);
      setStates(m.suggested.length ? m.suggested : spec.states.map(() => m.states[0]?.name ?? ""));
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  const start = () => {
    setOpen(true);
    setMsg(null);
    if (link) {
      setArea(link.areaPath ?? "");
      setIters(link.iterations ?? []);
      void loadMeta(link.type).then(() => setStates(link.states));
    } else void loadMeta();
  };

  return (
    <section className="kb-glass ado-bar" aria-label="Azure DevOps">
      <div className="ado-row">
        <span className="ado-mark" aria-hidden>ADO</span>
        {link ? (
          <span>
            <b>Azure DevOps</b> · cards are <b>{link.type}</b> work items in {connection ? `${connection.organization} / ${connection.project}` : "a project that is no longer connected"}
            {link.pulledAt ? <span className="kb-note" style={{ padding: 0 }}> · refreshed {link.pulledAt.slice(0, 16).replace("T", " ")}</span> : null}
          </span>
        ) : connection ? (
          <span><b>Azure DevOps</b> · connected to {connection.organization} / {connection.project}. This board is not linked yet: its cards live only here.</span>
        ) : (
          <span><b>Azure DevOps</b> · not connected. An admin connects it under <a href="/sync">Setup, Jira &amp; Azure DevOps</a>; then this board&apos;s cards can be work items.</span>
        )}
        {!readOnly && connection ? (
          <span className="kb-actions" style={{ marginLeft: "auto" }}>
            {link ? <button className="kb-btn dark" disabled={busy} onClick={() => void run("Refreshed", () => api("POST", `${base}/pull`, {}))}>{busy ? "Working…" : "Refresh from Azure DevOps"}</button> : null}
            <button className="kb-btn" disabled={busy} aria-expanded={open} onClick={() => (open ? setOpen(false) : start())}>{open ? "Close" : link ? "Change link" : "Link to Azure DevOps"}</button>
            {link ? <button className="kb-btn" disabled={busy} onClick={() => window.confirm("Unlink this board? The cards stay here and stop following Azure DevOps; nothing is deleted there.") && void run("Unlinked. The cards stay here.", () => api("DELETE", base))}>Unlink</button> : null}
          </span>
        ) : null}
      </div>
      {msg ? <div className="kb-note" role="status" style={{ padding: 0 }}>{msg}</div> : null}
      {err ? <div className="kb-notice" role="alert">{err}</div> : null}
      {open && meta ? (
        <form className="ado-form" onSubmit={(e) => (e.preventDefault(), void run("Linked", () => api("PUT", base, { type, states, ...(area.trim() ? { areaPath: area.trim() } : {}), ...(level === "team" && iters.some(Boolean) ? { iterations: TEAM_ITERS.map((_, i) => iters[i] ?? "").filter(Boolean) } : {}) })).then(() => setOpen(false)))}>
          <label className="kb-field">
            <b>Work item type</b>
            <select value={type} onChange={(e) => void loadMeta(e.target.value)} required>
              <option value="">Choose…</option>
              {meta.types.map((t) => (<option key={t}>{t}</option>))}
            </select>
          </label>
          <label className="kb-field">
            <b>Area path (optional)</b>
            <input value={area} onChange={(e) => setArea(e.target.value)} placeholder={`${connection?.project ?? "Project"}\\Team`} maxLength={400} />
          </label>
          {type ? (
            <fieldset className="ado-map">
              <legend>Each board state writes this Azure DevOps state</legend>
              {spec.states.map((s, i) => (
                <label key={s.name}>
                  <span>{s.name}</span>
                  <select value={states[i] ?? ""} onChange={(e) => setStates(spec.states.map((_, j) => (j === i ? e.target.value : (states[j] ?? ""))))} required aria-label={`Azure DevOps state for ${s.name}`}>
                    <option value="">Choose…</option>
                    {meta.states.filter((x) => x.category !== "Removed").map((x) => (<option key={x.name}>{x.name}</option>))}
                  </select>
                </label>
              ))}
            </fieldset>
          ) : null}
          {level === "team" ? (
            <fieldset className="ado-map">
              <legend>The PI&apos;s iterations in Azure DevOps (optional)</legend>
              {TEAM_ITERS.map((n, i) => (
                <label key={n}>
                  <span>{n}</span>
                  <select value={iters[i] ?? ""} onChange={(e) => setIters(TEAM_ITERS.map((_, j) => (j === i ? e.target.value : (iters[j] ?? ""))))} aria-label={`Iteration path for ${n}`}>
                    <option value="">Not set</option>
                    {meta.iterations.map((x) => (<option key={x.path} value={x.path}>{x.path}</option>))}
                  </select>
                </label>
              ))}
            </fieldset>
          ) : null}
          <p className="kb-note" style={{ padding: 0 }}>Linking brings in every {type || "work item"} in scope. After that, adding a card creates a work item, and a card&apos;s title, state, kind, size, business value{level === "team" ? " and iteration" : ""} are written to Azure DevOps. Removing a card here does not delete the work item.</p>
          <div className="kb-actions"><button className="kb-btn dark" type="submit" disabled={busy || !type}>{busy ? "Linking…" : link ? "Save and refresh" : "Link and bring the work items in"}</button></div>
        </form>
      ) : null}
    </section>
  );
}
