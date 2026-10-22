"use client";

import { useEffect, useState } from "react";
import { AUTONOMY_LABELS } from "@trainyard/ai-portfolio";
import { orderLevels, type AutonomyLevel, type ModelIssue, type OperatingModel } from "@trainyard/core";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

export default function ModelPage() {
  const current = useApi<{ model: OperatingModel; issues: ModelIssue[] }>("/v1/model");
  const templates = useApi<{ templates: OperatingModel[] }>("/v1/templates");
  const [draft, setDraft] = useState<OperatingModel | null>(null);
  const [issues, setIssues] = useState<ModelIssue[]>([]);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    if (current.data) setDraft(structuredClone(current.data.model));
  }, [current.data]);

  if (!current.data || !templates.data || !draft) return <Loading error={current.error ?? templates.error} />;

  const save = async () => {
    try {
      await api("PUT", "/v1/model", draft);
      setIssues([]);
      setSaved("Operating model saved. The board, reports and AI gates now use it.");
      await current.reload();
    } catch (e) {
      const f = e as ApiFailure;
      setIssues(Array.isArray(f.details) ? (f.details as ModelIssue[]) : [{ path: "", message: f.message }]);
      setSaved(null);
    }
  };
  const startFrom = async (t: OperatingModel) => {
    await api("POST", "/v1/model/fork", { templateId: t.id, name: t.name });
    setSaved(`Switched to a copy of ${t.name}. Edit it below.`);
    await current.reload();
  };
  const cad = draft.cadence;
  const ai = draft.aiNative;
  const setCad = (patch: Partial<typeof cad>) => setDraft({ ...draft, cadence: { ...cad, ...patch } });
  const setAi = (patch: Partial<typeof ai>) => setDraft({ ...draft, aiNative: { ...ai, ...patch } });
  const relabel = (kind: "groupLevels" | "workLevels", key: string, label: string) => setDraft({ ...draft, [kind]: draft[kind].map((l) => (l.key === key ? { ...l, label } : l)) });

  return (
    <>
      <PageHead
        title="Operating model"
        sub="Your scaling framework as configuration: levels, names, cadence, roles, events and AI rules. Start from a template, then change anything."
        actions={
          <button className="btn primary" onClick={save}>
            Save model
          </button>
        }
      />
      <ErrorList title="The model has problems" items={issues} />
      {saved ? <div className="notice" role="status">{saved}</div> : null}

      <section className="panel">
        <div className="panel-head">
          <h2>Templates</h2>
          <span className="faint">Current: {draft.name}{draft.basedOn ? ` (from ${draft.basedOn})` : ""}</span>
        </div>
        <div className="panel-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {templates.data.templates.map((t) => {
            const active = t.id === draft.id || t.id === draft.basedOn;
            return (
              <div key={t.id} className="stack" style={{ gap: 6, padding: 12, border: `1px solid ${active ? "var(--signal)" : "var(--line)"}`, borderRadius: 8, background: active ? "var(--signal-soft)" : undefined }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{t.name}</strong>
                  {t.aiNative.enabled ? <span className="chip ai">AI-native</span> : null}
                </div>
                <span className="faint" style={{ fontSize: "0.8rem", flex: 1 }}>{t.description}</span>
                <span className="mono faint" style={{ fontSize: "0.72rem" }}>
                  {orderLevels(t.groupLevels).map((l) => l.label).join(" › ")}
                </span>
                <button className="btn small" disabled={active} onClick={() => startFrom(t)}>
                  {active ? "In use" : "Use this template"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head">
            <h2>Structure and names</h2>
          </div>
          <div className="panel-body stack">
            <label className="field">
              Model name
              <input id="m-name" className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </label>
            <span className="eyebrow">Groups, top to bottom</span>
            {orderLevels(draft.groupLevels).map((l) => (
              <label key={l.key} className="field" style={{ flexDirection: "row", alignItems: "center" }}>
                <span className="mono faint" style={{ width: 110 }}>{l.key}</span>
                <input id={`g-${l.key}`} className="input" value={l.label} onChange={(e) => relabel("groupLevels", l.key, e.target.value)} style={{ flex: 1 }} />
              </label>
            ))}
            <span className="eyebrow">Work, top to bottom</span>
            {orderLevels(draft.workLevels).map((l) => (
              <label key={l.key} className="field" style={{ flexDirection: "row", alignItems: "center" }}>
                <span className="mono faint" style={{ width: 110 }}>{l.key}</span>
                <input id={`w-${l.key}`} className="input" value={l.label} onChange={(e) => relabel("workLevels", l.key, e.target.value)} style={{ flex: 1 }} />
                <input
                  id={`wp-${l.key}`}
                  type="radio"
                  name="planned"
                  checked={!!l.planned}
                  onChange={() => setDraft({ ...draft, workLevels: draft.workLevels.map((w) => (w.planned || w.key === l.key ? { ...w, planned: w.key === l.key } : w)) })}
                  aria-label={`Plan ${l.label} on the board`}
                />
                <span style={{ fontSize: "0.75rem" }}>on board</span>
              </label>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Cadence</h2>
          </div>
          <div className="panel-body stack">
            <div className="row">
              <label className="field">
                Mode
                <select id="c-mode" className="select" value={cad.mode} onChange={(e) => setCad({ mode: e.target.value as "iterations" | "flow" })}>
                  <option value="iterations">Time-boxed iterations</option>
                  <option value="flow">Flow with replenishment</option>
                </select>
              </label>
              <label className="field">
                Iteration name
                <input id="c-itl" className="input" value={cad.iterationLabel} onChange={(e) => setCad({ iterationLabel: e.target.value })} />
              </label>
              <label className="field">
                Increment name
                <input id="c-inl" className="input" value={cad.incrementLabel} onChange={(e) => setCad({ incrementLabel: e.target.value })} />
              </label>
            </div>
            <div className="row">
              <label className="field">
                Weeks per iteration
                <input id="c-weeks" className="input" type="number" min={1} max={8} value={cad.iterationWeeks} onChange={(e) => setCad({ iterationWeeks: Number(e.target.value) })} style={{ width: 90 }} />
              </label>
              <label className="field">
                Iterations per increment
                <input id="c-per" className="input" type="number" min={1} max={26} value={cad.iterationsPerIncrement} onChange={(e) => setCad({ iterationsPerIncrement: Number(e.target.value) })} style={{ width: 90 }} />
              </label>
              <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 18 }}>
                <input id="c-ip" type="checkbox" checked={cad.ipIteration} onChange={(e) => setCad({ ipIteration: e.target.checked })} />
                Last iteration is for innovation and planning
              </label>
            </div>
            <p className="faint">
              One {cad.incrementLabel} = {cad.iterationsPerIncrement} × {cad.iterationWeeks} weeks = {cad.iterationsPerIncrement * cad.iterationWeeks} weeks.
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>AI-native rules</h2>
            <span className={`chip ${ai.enabled ? "ai" : ""}`}>{ai.enabled ? "On" : "Off"}</span>
          </div>
          <div className="panel-body stack">
            {(
              [
                ["enabled", "Use AI-native settings for this model"],
                ["agentsAsTeamMembers", "AI agents can be members of teams"],
                ["requireAccountableHuman", "Every agent needs a named accountable human"],
                ["valueArchitectSignOff", "AI value architect signs off pilot and production gates"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="row" style={{ flexWrap: "nowrap" }}>
                <input id={`ai-${k}`} type="checkbox" checked={ai[k]} onChange={(e) => setAi({ [k]: e.target.checked })} />
                {label}
              </label>
            ))}
            <label className="field">
              Highest autonomy an agent may have
              <select id="ai-max" className="select" value={ai.maxAgentAutonomy} onChange={(e) => setAi({ maxAgentAutonomy: Number(e.target.value) as AutonomyLevel })}>
                {([0, 1, 2, 3, 4] as const).map((l) => (
                  <option key={l} value={l}>
                    L{l} · {AUTONOMY_LABELS[l]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Roles and events</h2>
          </div>
          <div className="panel-body grid-2" style={{ gap: 12 }}>
            <div className="stack" style={{ gap: 4 }}>
              <span className="eyebrow">Roles</span>
              {draft.roles.map((r) => (
                <span key={r.key} className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
                  {r.label}
                  <span className="chip">{r.scope}</span>
                </span>
              ))}
            </div>
            <div className="stack" style={{ gap: 4 }}>
              <span className="eyebrow">Events</span>
              {draft.events.map((ev) => (
                <span key={ev.key} className="row" style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
                  {ev.label}
                  <span className="chip">{ev.when}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      </div>
      <p className="faint" style={{ fontSize: "0.78rem" }}>
        Framework names are trademarks of their owners. SAFe® and Scaled Agile Framework® are registered trademarks of Scaled Agile, Inc. Templates are summaries for configuration, not copies of framework materials.
      </p>
    </>
  );
}
