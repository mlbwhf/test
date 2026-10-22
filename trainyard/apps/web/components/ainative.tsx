"use client";

// AI-Native ART views that extend PI Outcome Planning: the pipeline (outputs behind gates,
// discard as easy as advance), intent / specifications / context with propagation, Sense and
// Respond pulled from data, the curated data register, team capability coverage, the
// assessment and launch plan, customer demos, and the cost, verification and funnel views.

import { useEffect, useMemo, useState } from "react";
import {
  CAPABILITIES,
  DATA_QUALITIES,
  DEMO_FORMATS,
  PIPELINE,
  SUCCESS_FACTORS,
  VALUE_CATEGORY,
  type AiNativeArt,
  type Capability,
  type CuratedDataAsset,
  type DataQuality,
  type GateResult,
  type Output,
  type OutputType,
  type PlanningSession,
  type SenseRespondAgenda,
  type Stage,
} from "@trainyard/core";
import { api, type ApiFailure } from "@/lib/api";

export interface ArtDerived {
  gates: Record<string, GateResult>;
  reviewQueue: { id: string; kind: string; title: string; heldOutputs: string[] }[];
  coverage: { teamId: string; size: number; covered: Record<Capability, string[]>; uncovered: Capability[]; warnings: string[] }[];
  funnel: { outcomes: number; learning: { total: number; concluded: number; discarded: number; active: number }; value: { total: number; released: number; discarded: number; active: number }; discardRate: number };
  cost: { fixed: number; variableEstimate: number; variableActual: number; limit?: number; overLimit: boolean; byWorkflow: { workflow: string; estimate: number; actual: number; variance: number }[] };
  verification: { queueDepth: number; waiting: { outputId: string; title: string; owner: string; days: number }[]; approverLoad: { owner: string; waiting: number; done: number }[]; medianReviewDays: number | null };
  assessment: { factor: string; shift: string; ratings: number; mean: number | null; spread: number | null; split: boolean }[];
  issues: string[];
}

export type ArtTab = "pipeline" | "intent" | "sense" | "data" | "capabilities" | "assessment" | "views";
export const ART_TABS: [ArtTab, string][] = [
  ["pipeline", "Pipeline"],
  ["intent", "Intent · specs · context"],
  ["sense", "Sense & Respond"],
  ["data", "Curated data"],
  ["capabilities", "Team capabilities"],
  ["assessment", "Assessment & launch plan"],
  ["views", "Cost · verification · funnel"],
];

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
const TYPE_COLOR: Record<OutputType, string> = { experiment: "#7d6fd6", prototype: "#2ea39a", enabler: "#b94a48", feature: "#2d5d8a" };
const STAGE_LABEL: Record<Stage, string> = { discover: "Discover", specify: "Specify", build: "Build", validate: "Validate", release: "Release", concluded: "Concluded", discarded: "Discarded" };

interface Props {
  session: PlanningSession;
  art: AiNativeArt;
  derived: ArtDerived;
  onChange: (a: AiNativeArt) => void;
  /** After a server-side move (advance, discard, intent edit, review clear). */
  onServer: (a: AiNativeArt, d: ArtDerived) => void;
  onError: (m: string) => void;
}

// ---- pipeline ------------------------------------------------------------------------------

export function Pipeline({ session, art, derived, onChange, onServer, onError }: Props) {
  const [discarding, setDiscarding] = useState<{ id: string; reason: string } | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const base = `/v1/outcome-planning/${encodeURIComponent(session.id)}/art`;
  const move = async (o: Output, action: "advance" | "discard", reason?: string) => {
    try {
      const r = await api<{ output: Output; derived: ArtDerived }>("POST", `${base}/outputs/${encodeURIComponent(o.id)}/${action}`, action === "discard" ? { reason } : undefined);
      onServer({ ...art, outputs: art.outputs.map((x) => (x.id === o.id ? r.output : x)) }, r.derived);
      setDiscarding(null);
    } catch (e) {
      onError((e as ApiFailure).message);
    }
  };
  const columns: Stage[] = [...PIPELINE, "concluded", "discarded"];
  const outcomeTitle = (id: string) => session.outcomes.find((o) => o.id === id)?.title ?? id;
  const selected = art.outputs.find((o) => o.id === sel);
  const patch = (id: string, p: Partial<Output>) => onChange({ ...art, outputs: art.outputs.map((o) => (o.id === id ? { ...o, ...p } : o)) });
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <b style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>AI innovation pipeline</b>
        <span className="faint" style={{ fontSize: "0.82rem" }}>Experiments and prototypes learn and conclude at Validate (A/B tests may release); features and enablers deliver value through Release. Stopping is one click and one reason, from anywhere.</span>
      </div>
      <div className="scroll-x">
        <div className="an-board" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(190px, 1fr))` }}>
          {columns.map((st) => (
            <div key={st} className={`an-col${st === "discarded" ? " discarded" : st === "concluded" ? " concluded" : ""}`}>
              <div className="an-col-head">
                {STAGE_LABEL[st]} <span className="chip">{art.outputs.filter((o) => o.stage === st).length}</span>
              </div>
              {art.outputs
                .filter((o) => o.stage === st)
                .map((o) => {
                  const g = derived.gates[o.id];
                  return (
                    <div key={o.id} className={`an-card${sel === o.id ? " sel" : ""}`} style={{ borderLeftColor: TYPE_COLOR[o.type] }} onClick={() => setSel(o.id)}>
                      <div className="row" style={{ justifyContent: "space-between", gap: 6 }}>
                        <span className="chip" style={{ background: TYPE_COLOR[o.type], color: "#fff", borderColor: "transparent" }}>
                          {o.type}
                        </span>
                        <span className="faint" style={{ fontSize: "0.7rem" }}>{session.teams.find((t) => t.id === o.teamId)?.name}</span>
                      </div>
                      <b style={{ fontSize: "0.9rem" }}>{o.title}</b>
                      <div className="faint" style={{ fontSize: "0.74rem" }}>{o.outcomeIds.map(outcomeTitle).join(" · ") || "No outcome linked"}</div>
                      {o.metrics.length ? <div style={{ fontSize: "0.74rem" }}>↗ {o.metrics.map((m) => m.expected ?? m.name ?? m.keyResultId).join("; ")}</div> : <div style={{ fontSize: "0.74rem", color: "var(--signal)" }}>No metric yet</div>}
                      {o.stage === "discarded" ? <div style={{ fontSize: "0.76rem", fontStyle: "italic" }}>{o.discardReason}</div> : null}
                      {o.stage === "concluded" ? <div style={{ fontSize: "0.76rem", fontStyle: "italic" }}>{o.uncertaintyReduced}</div> : null}
                      {st !== "discarded" && st !== "concluded" && st !== "release" ? (
                        <div className="row" style={{ gap: 6, marginTop: 4 }}>
                          <button className="btn small primary" disabled={!g?.ok} title={g?.ok ? `Advance to ${STAGE_LABEL[g.to]}` : g?.reasons.join(" ")} onClick={(e) => (e.stopPropagation(), void move(o, "advance"))}>
                            → {g ? STAGE_LABEL[g.to] : "Next"}
                          </button>
                          <button className="btn small" onClick={(e) => (e.stopPropagation(), setDiscarding({ id: o.id, reason: "" }))}>
                            Discard
                          </button>
                        </div>
                      ) : null}
                      {g && !g.ok && st !== "discarded" && st !== "concluded" && st !== "release" ? (
                        <ul className="an-gate">
                          {g.reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      ) : null}
                      {discarding?.id === o.id ? (
                        <form
                          className="stack"
                          style={{ gap: 4, marginTop: 6 }}
                          onClick={(e) => e.stopPropagation()}
                          onSubmit={(e) => {
                            e.preventDefault();
                            void move(o, "discard", discarding.reason);
                          }}
                        >
                          <input className="input" autoFocus aria-label="Discard reason" placeholder="Why it stops: that is the learning" value={discarding.reason} onChange={(e) => setDiscarding({ id: o.id, reason: e.target.value })} />
                          <div className="row" style={{ gap: 4 }}>
                            <button className="btn small primary" type="submit" disabled={!discarding.reason.trim()}>
                              Discard
                            </button>
                            <button className="btn small ghost" type="button" onClick={() => setDiscarding(null)}>
                              Keep
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
      {selected ? <OutputEditor o={selected} session={session} art={art} onPatch={(p) => patch(selected.id, p)} onClose={() => setSel(null)} /> : null}
      <NewOutput session={session} art={art} onChange={onChange} />
    </div>
  );
}

function OutputEditor({ o, session, art, onPatch, onClose }: { o: Output; session: PlanningSession; art: AiNativeArt; onPatch: (p: Partial<Output>) => void; onClose: () => void }) {
  const krs = session.outcomes.flatMap((x) => x.keyResults.map((k) => ({ id: k.id, label: `${x.title}: ${k.text} ${k.target}` })));
  const learning = VALUE_CATEGORY[o.type] === "learning";
  const field = (label: string, el: React.ReactNode) => (
    <label className="field" style={{ fontSize: "0.82rem" }}>
      {label}
      {el}
    </label>
  );
  return (
    <section className="panel panel-body stack" style={{ gap: 10 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <b>
          {o.title} <span className="chip">{o.type} · {VALUE_CATEGORY[o.type]}</span> <span className="chip">{STAGE_LABEL[o.stage]}</span>
        </b>
        <button className="btn small ghost" onClick={onClose}>
          Close
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
        {field("Title", <input className="input" value={o.title} onChange={(e) => onPatch({ title: e.target.value })} />)}
        {field(
          "Outcomes it advances",
          <select className="select" multiple value={o.outcomeIds} onChange={(e) => onPatch({ outcomeIds: [...e.target.selectedOptions].map((x) => x.value) })} style={{ height: 90 }}>
            {session.outcomes
              .filter((x) => x.level !== "portfolio")
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.level.toUpperCase()} · {x.title}
                </option>
              ))}
          </select>,
        )}
        {field(
          "Metrics it should move (key results)",
          <select className="select" multiple value={o.metrics.map((m) => m.keyResultId ?? "")} onChange={(e) => onPatch({ metrics: [...o.metrics.filter((m) => !m.keyResultId), ...[...e.target.selectedOptions].map((x) => ({ keyResultId: x.value }))] })} style={{ height: 90 }}>
            {krs.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>,
        )}
        {field("Granular metric (free text)", <input className="input" value={o.metrics.find((m) => m.name)?.name ?? ""} placeholder="e.g. p95 latency < 120 ms" onChange={(e) => onPatch({ metrics: [...o.metrics.filter((m) => m.keyResultId), ...(e.target.value.trim() ? [{ name: e.target.value }] : [])] })} />)}
        {field(
          "Intent",
          <select className="select" value={o.intentId ?? ""} onChange={(e) => onPatch(e.target.value ? { intentId: e.target.value } : { intentId: undefined })}>
            <option value="">—</option>
            {art.intents.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title} (v{i.version}{i.propagationStatus === "review-required" ? ", review" : ""})
              </option>
            ))}
          </select>,
        )}
        {field(
          "Specification",
          <select className="select" value={o.specId ?? ""} onChange={(e) => onPatch(e.target.value ? { specId: e.target.value } : { specId: undefined })}>
            <option value="">—</option>
            {art.specs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} (v{s.version}{s.reviewRequired ? ", review" : ""})
              </option>
            ))}
          </select>,
        )}
        {field(
          "Context",
          <select className="select" value={o.contextId ?? ""} onChange={(e) => onPatch(e.target.value ? { contextId: e.target.value } : { contextId: undefined })}>
            <option value="">—</option>
            {art.contexts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>,
        )}
        {field(
          "Curated data it uses",
          <select className="select" multiple value={o.dataAssetIds ?? []} onChange={(e) => onPatch({ dataAssetIds: [...e.target.selectedOptions].map((x) => x.value) })} style={{ height: 70 }}>
            {art.dataAssets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>,
        )}
        {learning ? field("Hypothesis", <textarea className="textarea" value={o.hypothesis ?? ""} onChange={(e) => onPatch({ hypothesis: e.target.value })} />) : null}
        {learning ? field("Uncertainty reduced (at Validate)", <textarea className="textarea" value={o.uncertaintyReduced ?? ""} onChange={(e) => onPatch({ uncertaintyReduced: e.target.value })} />) : null}
        {learning ? field("A/B test (may release)", <input type="checkbox" checked={!!o.abTest} onChange={(e) => onPatch({ abTest: e.target.checked })} />) : null}
        {field("Verification owner (the named approver)", <input className="input" value={o.verificationOwner ?? ""} onChange={(e) => onPatch({ verificationOwner: e.target.value })} />)}
        {field("Verification evidence", <textarea className="textarea" value={o.verificationEvidence ?? ""} onChange={(e) => onPatch({ verificationEvidence: e.target.value })} />)}
        {field("Workflow (for cost attribution)", <input className="input" value={o.workflow ?? ""} onChange={(e) => onPatch({ workflow: e.target.value })} />)}
        {field("AI cost: estimate", <input className="input" type="number" value={o.aiCostEstimate ?? ""} onChange={(e) => onPatch({ aiCostEstimate: e.target.value === "" ? undefined : Number(e.target.value) })} />)}
        {field("AI cost: actual", <input className="input" type="number" value={o.aiCostActual ?? ""} onChange={(e) => onPatch({ aiCostActual: e.target.value === "" ? undefined : Number(e.target.value) })} />)}
        {!learning ? field("Customer disclosure (AI-generated)", <input className="input" value={o.disclosure ?? ""} onChange={(e) => onPatch({ disclosure: e.target.value })} />) : null}
        {field("Iteration", <input className="input" type="number" min={1} max={session.iterations + 1} value={o.iteration} onChange={(e) => onPatch({ iteration: Number(e.target.value) || 1 })} />)}
      </div>
      <div className="faint" style={{ fontSize: "0.76rem" }}>
        History: {o.stageHistory.map((h) => `${STAGE_LABEL[h.stage]} ${h.at.slice(0, 10)}${h.by ? ` (${h.by})` : ""}`).join(" → ")}
      </div>
    </section>
  );
}

function NewOutput({ session, art, onChange }: { session: PlanningSession; art: AiNativeArt; onChange: (a: AiNativeArt) => void }) {
  const [d, setD] = useState<{ type: OutputType; title: string; teamId: string; outcomeId: string }>({ type: "experiment", title: "", teamId: session.teams[0]?.id ?? "", outcomeId: "" });
  return (
    <form
      className="row"
      style={{ gap: 8 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!d.title.trim() || !d.teamId) return;
        const now = new Date().toISOString();
        onChange({ ...art, outputs: [...art.outputs, { id: uid("out"), type: d.type, title: d.title.trim(), teamId: d.teamId, iteration: 1, outcomeIds: d.outcomeId ? [d.outcomeId] : [], metrics: [], stage: "discover", stageHistory: [{ stage: "discover", at: now }], disposition: "pending" }] });
        setD({ ...d, title: "" });
      }}
    >
      <span className="eyebrow">New output</span>
      <select className="select" aria-label="Type" value={d.type} onChange={(e) => setD({ ...d, type: e.target.value as OutputType })}>
        {(Object.keys(VALUE_CATEGORY) as OutputType[]).map((t) => (
          <option key={t} value={t}>
            {t} · {VALUE_CATEGORY[t]}
          </option>
        ))}
      </select>
      <select className="select" aria-label="Team" value={d.teamId} onChange={(e) => setD({ ...d, teamId: e.target.value })}>
        {session.teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <select className="select" aria-label="Outcome" value={d.outcomeId} onChange={(e) => setD({ ...d, outcomeId: e.target.value })}>
        <option value="">Outcome it advances…</option>
        {session.outcomes
          .filter((o) => o.level === "team" || o.level === "pi")
          .map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
      </select>
      <input className="input" aria-label="Title" placeholder="e.g. Swap-acceptance framing A/B test" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} style={{ flex: "1 1 240px" }} />
      <button className="btn small" type="submit" disabled={!d.title.trim()}>
        Add
      </button>
    </form>
  );
}

// ---- intent, specifications, context ----------------------------------------------------

export function IntentView({ session, art, derived, onChange, onServer, onError }: Props) {
  const base = `/v1/outcome-planning/${encodeURIComponent(session.id)}/art`;
  const [editing, setEditing] = useState<{ id: string; futureState: string; strategy: string; currentState: string } | null>(null);
  const edit = async () => {
    if (!editing) return;
    try {
      const r = await api<{ art: AiNativeArt; derived: ArtDerived }>("POST", `${base}/intents/${encodeURIComponent(editing.id)}/edit`, { currentState: editing.currentState, futureState: editing.futureState, strategy: editing.strategy });
      onServer(r.art, r.derived);
      setEditing(null);
    } catch (e) {
      onError((e as ApiFailure).message);
    }
  };
  const clear = async (id: string) => {
    try {
      const r = await api<{ art: AiNativeArt; derived: ArtDerived }>("POST", `${base}/reviews/${encodeURIComponent(id)}/clear`);
      onServer(r.art, r.derived);
    } catch (e) {
      onError((e as ApiFailure).message);
    }
  };
  const now = () => new Date().toISOString();
  return (
    <div className="stack" style={{ gap: 14 }}>
      <p className="faint" style={{ margin: 0, fontSize: "0.86rem" }}>
        Three traceable layers for people and agents. Editing an intent makes a new version, marks every specification and context under it for review, and holds their outputs at Specify until the review is cleared. Each propagation is logged into insights and evidence.
      </p>
      {derived.reviewQueue.length ? (
        <div className="notice warn">
          <strong>Review queue</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {derived.reviewQueue.map((q) => (
              <li key={q.id}>
                {q.kind} “{q.title}” {q.heldOutputs.length ? `· holding ${q.heldOutputs.length} output(s)` : ""}{" "}
                <button className="btn small" onClick={() => void clear(q.id)}>
                  Reviewed, clear
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="an-three">
        <div className="stack">
          <h3 className="an-h">Intent · why</h3>
          {art.intents.map((i) => (
            <div key={i.id} className="card an-rec" style={i.propagationStatus === "review-required" ? { borderColor: "var(--signal)" } : undefined}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <b>{i.title}</b>
                <span className="chip">v{i.version}{i.propagationStatus === "review-required" ? " · propagating" : ""}</span>
              </div>
              <div className="an-kv">
                <span>Current</span>
                <span>{i.currentState}</span>
                <span>Future</span>
                <span>{i.futureState}</span>
                <span>Strategy</span>
                <span>{i.strategy}</span>
                <span>Problems</span>
                <span>{i.problems.join(" · ")}</span>
              </div>
              {editing?.id === i.id ? (
                <div className="stack" style={{ gap: 6 }}>
                  <textarea className="textarea" aria-label="Current state" value={editing.currentState} onChange={(e) => setEditing({ ...editing, currentState: e.target.value })} />
                  <textarea className="textarea" aria-label="Future state" value={editing.futureState} onChange={(e) => setEditing({ ...editing, futureState: e.target.value })} />
                  <textarea className="textarea" aria-label="Strategy" value={editing.strategy} onChange={(e) => setEditing({ ...editing, strategy: e.target.value })} />
                  <div className="row" style={{ gap: 6 }}>
                    <button className="btn small primary" onClick={() => void edit()}>
                      Save as v{i.version + 1} and propagate
                    </button>
                    <button className="btn small ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn small" onClick={() => setEditing({ id: i.id, currentState: i.currentState, futureState: i.futureState, strategy: i.strategy })}>
                  Edit intent
                </button>
              )}
            </div>
          ))}
          <button className="btn small" onClick={() => onChange({ ...art, intents: [...art.intents, { id: uid("int"), title: "New intent", currentState: "", futureState: "", strategy: "", problems: [], version: 1, propagationStatus: "clean", updatedAt: now() }] })}>
            Add an intent
          </button>
        </div>
        <div className="stack">
          <h3 className="an-h">Specifications · what</h3>
          {art.specs.map((s) => (
            <div key={s.id} className="card an-rec" style={s.reviewRequired ? { borderColor: "var(--signal)" } : undefined}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <input className="op-inline" aria-label="Specification title" value={s.title} style={{ fontWeight: 700 }} onChange={(e) => onChange({ ...art, specs: art.specs.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)) })} />
                <span className="chip">v{s.version}{s.reviewRequired ? " · review" : ""}</span>
              </div>
              <div className="faint" style={{ fontSize: "0.76rem" }}>from {art.intents.find((i) => i.id === s.intentId)?.title}</div>
              <textarea className="textarea" aria-label="What it does" value={s.whatItDoes} onChange={(e) => onChange({ ...art, specs: art.specs.map((x) => (x.id === s.id ? { ...x, whatItDoes: e.target.value } : x)) })} />
              <div className="an-kv">
                <span>Boundaries</span>
                <span>{s.boundaries.join(" · ")}</span>
                <span>Contexts</span>
                <span>{s.contextIds.map((c) => art.contexts.find((x) => x.id === c)?.title ?? c).join(", ")}</span>
                {s.agentPayload ? (
                  <>
                    <span>Agent payload</span>
                    <code style={{ fontSize: "0.7rem" }}>{JSON.stringify(s.agentPayload)}</code>
                  </>
                ) : null}
              </div>
              {s.reviewRequired ? (
                <button className="btn small" onClick={() => void clear(s.id)}>
                  Reviewed, clear
                </button>
              ) : null}
            </div>
          ))}
          <button className="btn small" disabled={!art.intents.length} onClick={() => onChange({ ...art, specs: [...art.specs, { id: uid("spec"), title: "New specification", intentId: art.intents[0]!.id, whatItDoes: "", boundaries: [], contextIds: [], version: 1, reviewRequired: false, updatedAt: now() }] })}>
            Add a specification
          </button>
        </div>
        <div className="stack">
          <h3 className="an-h">Context · where</h3>
          {art.contexts.map((c) => (
            <div key={c.id} className="card an-rec" style={c.reviewRequired ? { borderColor: "var(--signal)" } : undefined}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <input className="op-inline" aria-label="Context title" value={c.title} style={{ fontWeight: 700 }} onChange={(e) => onChange({ ...art, contexts: art.contexts.map((x) => (x.id === c.id ? { ...x, title: e.target.value } : x)) })} />
                <span className="chip">v{c.version}{c.reviewRequired ? " · review" : ""}</span>
              </div>
              <div className="an-kv">
                <span>Customer</span>
                <span>{c.customerProfile}</span>
                <span>Market</span>
                <span>{c.marketConditions}</span>
                <span>Operating</span>
                <span>{c.operatingEnvironment}</span>
                <span>Tests for</span>
                <span>{c.testImplications.join(" · ")}</span>
              </div>
              {c.reviewRequired ? (
                <button className="btn small" onClick={() => void clear(c.id)}>
                  Reviewed, clear
                </button>
              ) : null}
            </div>
          ))}
          <button className="btn small" onClick={() => onChange({ ...art, contexts: [...art.contexts, { id: uid("ctx"), title: "New context", customerProfile: "", marketConditions: "", operatingEnvironment: "", testImplications: [], version: 1, reviewRequired: false, updatedAt: now() }] })}>
            Add a context
          </button>
        </div>
      </div>
      <section className="panel panel-body">
        <div className="eyebrow">Insights and evidence</div>
        <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: "0.84rem" }}>
          {[...art.evidence].reverse().map((e) => (
            <li key={e.id}>
              <span className="mono faint">{e.at.slice(0, 10)}</span> <span className="chip">{e.kind}</span> {e.text}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---- Sense and Respond --------------------------------------------------------------------

export function SenseRespond({ session, art, onChange, onError }: Props) {
  const [iteration, setIteration] = useState(Math.min(session.iterations, (art.senseRespond.at(-1)?.iteration ?? 0) + 1));
  const [agenda, setAgenda] = useState<SenseRespondAgenda | null>(null);
  useEffect(() => {
    void api<{ agenda: SenseRespondAgenda }>("GET", `/v1/outcome-planning/${encodeURIComponent(session.id)}/art/sense-respond/${iteration}`)
      .then((r) => setAgenda(r.agenda))
      .catch((e) => onError((e as ApiFailure).message));
  }, [session.id, iteration, art.updatedAt, onError]);
  const ev = art.senseRespond.find((e) => e.iteration === iteration);
  const decide = (d: NonNullable<typeof ev>["decisions"][number]) => {
    const cur = ev ?? { id: uid("sr"), iteration, decisions: [] };
    const next = { ...cur, heldAt: cur.heldAt ?? new Date().toISOString(), decisions: [...cur.decisions.filter((x) => !(x.outputId && x.outputId === d.outputId) && !(x.workflow && x.workflow === d.workflow)), d] };
    onChange({ ...art, senseRespond: [...art.senseRespond.filter((e) => e.iteration !== iteration), next] });
  };
  if (!agenda) return <div className="skeleton">Pulling the agenda…</div>;
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row">
          <b style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>Sense and Respond</b>
          <select className="select" aria-label="Iteration" value={iteration} onChange={(e) => setIteration(Number(e.target.value))}>
            {Array.from({ length: session.iterations }, (_, i) => (
              <option key={i} value={i + 1}>
                Iteration {i + 1}
              </option>
            ))}
          </select>
          <span className="chip">2 hours · replaces Inspect & Adapt and the System Demo</span>
        </div>
        <span className="faint" style={{ fontSize: "0.82rem" }}>{ev?.heldAt ? `Held ${ev.heldAt.slice(0, 10)} · ${ev.decisions.length} decisions` : "Not held yet"}</span>
      </div>
      <div className="an-three">
        <section className="panel panel-body stack" style={{ gap: 6 }}>
          <div className="eyebrow">The RTE's three questions</div>
          {agenda.questions.map((q, i) => (
            <div key={q} style={{ fontSize: "0.9rem" }}>
              <b>{i + 1}.</b> {q}
            </div>
          ))}
          <div className="eyebrow" style={{ marginTop: 8 }}>Purposes</div>
          {agenda.purposes.map((p) => (
            <div key={p} className="faint" style={{ fontSize: "0.82rem" }}>
              {p}
            </div>
          ))}
        </section>
        <section className="panel panel-body stack" style={{ gap: 6 }}>
          <div className="eyebrow">1 · Outcomes with real data</div>
          <table className="table">
            <tbody>
              {agenda.outcomeDeltas.map((d) => (
                <tr key={`${d.outcomeId}-${d.keyResult}`}>
                  <td style={{ fontSize: "0.78rem" }}>
                    <b>{d.outcome}</b>
                    <div className="faint">{d.keyResult}</div>
                  </td>
                  <td className="mono" style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                    {d.previous ?? "–"} → <b>{d.current ?? "–"}</b> / {d.target}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel panel-body stack" style={{ gap: 6 }}>
          <div className="eyebrow">2 · What shipped, and how customers reacted</div>
          {agenda.released.length ? (
            agenda.released.map((o) => (
              <div key={o.id} className="row" style={{ justifyContent: "space-between", fontSize: "0.86rem" }}>
                <span>
                  <b>{o.title}</b> <span className="faint">{o.metrics.map((m) => m.expected ?? m.name).join("; ")}</span>
                </span>
                <span className="row" style={{ gap: 4 }}>
                  <button className={`btn small${ev?.decisions.some((d) => d.outputId === o.id && d.decision === "keep") ? " primary" : ""}`} onClick={() => decide({ outputId: o.id, decision: "keep" })}>
                    Keep
                  </button>
                  <button className={`btn small${ev?.decisions.some((d) => d.outputId === o.id && d.decision === "replan") ? " primary" : ""}`} onClick={() => decide({ outputId: o.id, decision: "replan" })}>
                    Re-plan
                  </button>
                </span>
              </div>
            ))
          ) : (
            <span className="faint">Nothing released yet.</span>
          )}
          <div className="eyebrow" style={{ marginTop: 8 }}>Customer demos this iteration</div>
          {art.demos.filter((d) => d.iteration === iteration).map((d) => (
            <div key={d.id} style={{ fontSize: "0.84rem" }}>
              <b>{d.format}</b> · {d.audience} · {d.what}
            </div>
          ))}
        </section>
      </div>
      <div className="an-three">
        <section className="panel panel-body stack" style={{ gap: 6 }}>
          <div className="eyebrow">Discard candidates · stopping is the point</div>
          {agenda.discardCandidates.length ? (
            agenda.discardCandidates.map(({ output, why }) => {
              const d = ev?.decisions.find((x) => x.outputId === output.id);
              return (
                <div key={output.id} className="card" style={{ padding: 10, display: "grid", gap: 4, fontSize: "0.84rem" }}>
                  <b>
                    {output.title} <span className="chip">{output.type} · {STAGE_LABEL[output.stage]}</span>
                  </b>
                  <span className="faint">{why}</span>
                  <div className="row" style={{ gap: 4 }}>
                    <button className={`btn small${d?.decision === "discard" ? " primary" : ""}`} onClick={() => decide({ outputId: output.id, decision: "discard", note: why })}>
                      Discard
                    </button>
                    <button className={`btn small${d?.decision === "keep" ? " primary" : ""}`} onClick={() => decide({ outputId: output.id, decision: "keep" })}>
                      Keep
                    </button>
                    <button className={`btn small${d?.decision === "replan" ? " primary" : ""}`} onClick={() => decide({ outputId: output.id, decision: "replan" })}>
                      Re-plan
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <span className="faint">Nothing stale.</span>
          )}
          <span className="faint" style={{ fontSize: "0.74rem" }}>A “Discard” decision here is recorded for the event; execute it on the Pipeline, where it takes one reason.</span>
        </section>
        <section className="panel panel-body stack" style={{ gap: 6 }}>
          <div className="eyebrow">3 · Workflows to fix, by impact</div>
          {agenda.workflowFriction.map((w) => {
            const d = ev?.decisions.find((x) => x.workflow === w.workflow && x.decision === "fix-workflow");
            return (
              <div key={w.workflow} className="row" style={{ justifyContent: "space-between", fontSize: "0.84rem" }}>
                <span>
                  <b>{w.workflow}</b> <span className="faint">{w.outputs} outputs · {w.inReview} in review · {w.discarded} discarded</span>
                </span>
                <button className={`btn small${d ? " primary" : ""}`} onClick={() => decide({ workflow: w.workflow, decision: "fix-workflow" })}>
                  Fix
                </button>
              </div>
            );
          })}
          <div className="eyebrow" style={{ marginTop: 8 }}>AI cost variance by workflow</div>
          {agenda.costVariance.map((c) => (
            <div key={c.workflow} className="row" style={{ justifyContent: "space-between", fontSize: "0.84rem" }}>
              <span>{c.workflow}</span>
              <span className="mono" style={{ color: c.variance > 0 ? "#b9342f" : "inherit" }}>
                {c.actual} vs {c.estimate} ({c.variance > 0 ? "+" : ""}
                {c.variance})
              </span>
            </div>
          ))}
        </section>
        <section className="panel panel-body stack" style={{ gap: 6 }}>
          <div className="eyebrow">Review queue after intent changes</div>
          {agenda.reviewQueue.length ? agenda.reviewQueue.map((q) => <div key={q.id} style={{ fontSize: "0.84rem" }}>{q.kind} · {q.title}</div>) : <span className="faint">Clean.</span>}
          <div className="eyebrow" style={{ marginTop: 8 }}>Notes</div>
          <textarea className="textarea" aria-label="Event notes" value={ev?.notes ?? ""} onChange={(e) => onChange({ ...art, senseRespond: [...art.senseRespond.filter((x) => x.iteration !== iteration), { ...(ev ?? { id: uid("sr"), iteration, decisions: [] }), notes: e.target.value }] })} />
        </section>
      </div>
    </div>
  );
}

// ---- curated data ------------------------------------------------------------------------

export function DataRegister({ art, onChange }: Props) {
  const qs = Object.keys(DATA_QUALITIES) as DataQuality[];
  const score = (a: CuratedDataAsset) => Math.round((qs.reduce((n, q) => n + a.quality[q], 0) / (qs.length * 5)) * 100);
  const set = (id: string, p: Partial<CuratedDataAsset>) => onChange({ ...art, dataAssets: art.dataAssets.map((a) => (a.id === id ? { ...a, ...p } : a)) });
  const users = (id: string) => art.outputs.filter((o) => o.dataAssetIds?.includes(id)).map((o) => o.title);
  return (
    <div className="stack" style={{ gap: 12 }}>
      <p className="faint" style={{ margin: 0, fontSize: "0.86rem" }}>
        Two kinds of curated data: what powers product development, and what powers the products. Four qualities, scored 0–5; the score shows wherever an output depends on the asset.
      </p>
      <div className="scroll-x">
        <table className="table" style={{ minWidth: 900 }}>
          <thead>
            <tr>
              <th>Asset</th>
              <th>Category</th>
              {qs.map((q) => (
                <th key={q} title={DATA_QUALITIES[q].definition}>
                  {DATA_QUALITIES[q].label}
                </th>
              ))}
              <th>Score</th>
              <th>Owner · assessed</th>
              <th>Used by</th>
            </tr>
          </thead>
          <tbody>
            {art.dataAssets.map((a) => (
              <tr key={a.id}>
                <td>
                  <input className="op-inline" aria-label="Asset name" value={a.name} style={{ fontWeight: 600 }} onChange={(e) => set(a.id, { name: e.target.value })} />
                  <div className="faint" style={{ fontSize: "0.74rem" }}>
                    {a.latencyClass}
                    {a.confidence ? ` · ${a.confidence}` : ""}
                  </div>
                </td>
                <td>
                  <select className="select" aria-label="Category" value={a.category} onChange={(e) => set(a.id, { category: e.target.value as CuratedDataAsset["category"] })}>
                    <option value="powers-development">Powers development</option>
                    <option value="powers-products">Powers products</option>
                  </select>
                </td>
                {qs.map((q) => (
                  <td key={q}>
                    <input className="input" type="number" min={0} max={5} aria-label={DATA_QUALITIES[q].label} value={a.quality[q]} onChange={(e) => set(a.id, { quality: { ...a.quality, [q]: Math.max(0, Math.min(5, Number(e.target.value) || 0)) } })} style={{ width: 60 }} title={DATA_QUALITIES[q].sub.join(" · ")} />
                  </td>
                ))}
                <td>
                  <span className="chip" style={{ background: score(a) >= 70 ? "var(--ok-soft)" : score(a) >= 50 ? "var(--signal-soft)" : "#fbd9d2" }}>
                    {score(a)}%
                  </span>
                </td>
                <td style={{ fontSize: "0.8rem" }}>
                  {a.owner}
                  <div className="faint">{a.lastAssessed.slice(0, 10)}</div>
                </td>
                <td style={{ fontSize: "0.78rem" }}>{users(a.id).join(", ") || <span className="faint">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="btn small" style={{ alignSelf: "flex-start" }} onClick={() => onChange({ ...art, dataAssets: [...art.dataAssets, { id: uid("data"), name: "New data asset", category: "powers-development", quality: { complete: 0, accurate: 0, securelyAccessed: 0, maintained: 0 }, owner: "", lastAssessed: new Date().toISOString(), latencyClass: "record" }] })}>
        Add an asset
      </button>
      <div className="row" style={{ gap: 10, fontSize: "0.76rem" }}>
        {qs.map((q) => (
          <span key={q} className="faint">
            <b>{DATA_QUALITIES[q].label}:</b> {DATA_QUALITIES[q].sub.join(", ")}
          </span>
        ))}
      </div>
    </div>
  );
}

// ---- team capabilities --------------------------------------------------------------------

export function TeamCoverage({ session, art, derived, onChange }: Props) {
  const caps = Object.keys(CAPABILITIES) as Capability[];
  return (
    <div className="stack" style={{ gap: 12 }}>
      <p className="faint" style={{ margin: 0, fontSize: "0.86rem" }}>
        AI-Native teams organise around four capabilities, not roles: 3–7 people augmented with AI, humans reviewing AI output for quality and bias. The AI Value Architect is a capability assignment, held by one person or several. A team with an uncovered capability is flagged.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
        {session.teams.map((t) => {
          const tc = art.teams.find((x) => x.teamId === t.id) ?? { teamId: t.id, members: [] };
          const cov = derived.coverage.find((c) => c.teamId === t.id);
          const save = (members: typeof tc.members) => onChange({ ...art, teams: [...art.teams.filter((x) => x.teamId !== t.id), { teamId: t.id, members }] });
          return (
            <section key={t.id} className="panel panel-body stack" style={{ gap: 8 }}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <b>{t.name}</b>
                <span className="chip" style={{ background: cov?.uncovered.length || (cov && (cov.size < 3 || cov.size > 7)) ? "var(--signal-soft)" : "var(--ok-soft)" }}>
                  {tc.members.length} people
                </span>
              </div>
              <div className="an-caps">
                {caps.map((c) => (
                  <div key={c} className={`an-cap${cov?.uncovered.includes(c) ? " gap" : ""}`} title={CAPABILITIES[c].blurb}>
                    <b>{CAPABILITIES[c].label}</b>
                    <span>{cov?.covered[c].join(", ") || "nobody"}</span>
                  </div>
                ))}
              </div>
              {tc.members.map((m) => (
                <div key={m.id} className="row" style={{ gap: 6, fontSize: "0.84rem" }}>
                  <input className="op-inline" aria-label="Member" value={m.name} style={{ flex: "0 1 120px" }} onChange={(e) => save(tc.members.map((x) => (x.id === m.id ? { ...x, name: e.target.value } : x)))} />
                  {caps.map((c) => (
                    <label key={c} className="row" style={{ gap: 3 }}>
                      <input type="checkbox" checked={m.capabilities.includes(c)} onChange={(e) => save(tc.members.map((x) => (x.id === m.id ? { ...x, capabilities: e.target.checked ? [...x.capabilities, c] : x.capabilities.filter((y) => y !== c) } : x)))} />
                      {CAPABILITIES[c].label}
                    </label>
                  ))}
                  <label className="row" style={{ gap: 3 }} title="AI Value Architect">
                    <input type="checkbox" checked={!!m.aiValueArchitect} onChange={(e) => save(tc.members.map((x) => (x.id === m.id ? { ...x, aiValueArchitect: e.target.checked } : x)))} />
                    AVA
                  </label>
                  <button className="btn small ghost" aria-label={`Remove ${m.name}`} onClick={() => save(tc.members.filter((x) => x.id !== m.id))}>
                    ×
                  </button>
                </div>
              ))}
              <button className="btn small" style={{ alignSelf: "flex-start" }} onClick={() => save([...tc.members, { id: uid("p"), name: "New member", capabilities: [] }])}>
                Add a member
              </button>
              {cov?.warnings.map((w) => (
                <div key={w} style={{ fontSize: "0.78rem", color: "var(--warn)" }}>
                  {w}
                </div>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ---- assessment and launch plan ------------------------------------------------------------

export function AssessmentView({ art, derived, onChange }: Props) {
  const [person, setPerson] = useState("");
  const a = art.assessment;
  const mine = (factor: string) => a.ratings.find((r) => r.factor === factor && r.person === person);
  const rate = (factor: string, score: 1 | 2 | 3 | 4 | 5) => {
    if (!person.trim()) return;
    onChange({ ...art, assessment: { ...a, ratings: [...a.ratings.filter((r) => !(r.factor === factor && r.person === person)), { factor, person, score }] } });
  };
  const SEQ = { "before-pi-outcome-planning": "Before first PI Outcome Planning", "before-sense-respond": "Before first Sense and Respond", later: "Later" } as const;
  const [gap, setGap] = useState({ factor: SUCCESS_FACTORS[0]!.factors[0]!, text: "", sequence: "before-pi-outcome-planning" as keyof typeof SEQ });
  const bump = (gaps: typeof a.gaps) => onChange({ ...art, assessment: { ...a, gaps, launchPlanVersion: a.launchPlanVersion + 1, launchPlanUpdatedAt: new Date().toISOString() } });
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <b style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>Twelve success factors, four shifts</b>
        <label className="row" style={{ gap: 6, fontSize: "0.84rem" }}>
          Rating as
          <input className="input" placeholder="your name" value={person} onChange={(e) => setPerson(e.target.value)} style={{ width: 140 }} />
        </label>
      </div>
      <p className="faint" style={{ margin: 0, fontSize: "0.84rem" }}>
        Everyone rates in writing before the group talks. A wide spread is a split: check interpretations first, then reasons, and keep both positions if they do not resolve. Gaps become the launch plan, each sequenced before the first PI Outcome Planning, before the first Sense and Respond, or later.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {SUCCESS_FACTORS.map((s) => (
          <section key={s.shift} className="panel panel-body stack" style={{ gap: 8 }}>
            <div className="eyebrow">{s.shift}</div>
            {s.factors.map((f) => {
              const sum = derived.assessment.find((x) => x.factor === f);
              const split = a.splitsKept.find((x) => x.factor === f);
              return (
                <div key={f} className="stack" style={{ gap: 4 }}>
                  <div className="row" style={{ justifyContent: "space-between", fontSize: "0.88rem" }}>
                    <b>{f}</b>
                    <span className="row" style={{ gap: 4 }}>
                      {sum?.mean !== null && sum?.mean !== undefined ? <span className="chip">{sum.mean} · n={sum.ratings}</span> : <span className="chip">unrated</span>}
                      {sum?.split ? <span className="chip" style={{ background: "var(--signal-soft)" }}>split</span> : null}
                    </span>
                  </div>
                  <div className="row" style={{ gap: 3 }}>
                    {([1, 2, 3, 4, 5] as const).map((n) => (
                      <button key={n} className={`op-fist${mine(f)?.score === n ? " on" : ""}`} style={{ width: 28, height: 28, fontSize: "0.8rem" }} disabled={!person.trim()} onClick={() => rate(f, n)} title={person.trim() ? `${person}: ${n}` : "Type your name first"}>
                        {n}
                      </button>
                    ))}
                  </div>
                  {split ? <div className="faint" style={{ fontSize: "0.76rem" }}>Positions kept: {split.positions.join(" / ")}</div> : null}
                </div>
              );
            })}
          </section>
        ))}
      </div>
      <section className="panel panel-body stack" style={{ gap: 8 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <b>Launch plan · v{a.launchPlanVersion}</b>
          <span className="faint" style={{ fontSize: "0.8rem" }}>{a.launchPlanUpdatedAt ? `updated ${a.launchPlanUpdatedAt.slice(0, 10)}` : "a living document, owned by the group"}</span>
        </div>
        {(Object.keys(SEQ) as (keyof typeof SEQ)[]).map((seq) => (
          <div key={seq}>
            <div className="eyebrow">{SEQ[seq]}</div>
            {a.gaps
              .filter((g) => g.sequence === seq)
              .map((g) => (
                <div key={g.id} className="row" style={{ gap: 8, fontSize: "0.86rem", padding: "4px 0" }}>
                  <input type="checkbox" checked={!!g.done} aria-label={g.text} onChange={() => bump(a.gaps.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)))} />
                  <span style={{ flex: 1, textDecoration: g.done ? "line-through" : "none" }}>
                    <span className="chip">{g.factor}</span> {g.text}
                    {g.owner ? <span className="faint"> · {g.owner}</span> : null}
                  </span>
                  <select className="select" aria-label="Sequence" value={g.sequence} onChange={(e) => bump(a.gaps.map((x) => (x.id === g.id ? { ...x, sequence: e.target.value as keyof typeof SEQ } : x)))}>
                    {(Object.keys(SEQ) as (keyof typeof SEQ)[]).map((k) => (
                      <option key={k} value={k}>
                        {SEQ[k]}
                      </option>
                    ))}
                  </select>
                  <button className="btn small ghost" aria-label="Remove gap" onClick={() => bump(a.gaps.filter((x) => x.id !== g.id))}>
                    ×
                  </button>
                </div>
              ))}
          </div>
        ))}
        <form
          className="row"
          style={{ gap: 6 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!gap.text.trim()) return;
            bump([...a.gaps, { id: uid("gap"), factor: gap.factor, text: gap.text.trim(), sequence: gap.sequence }]);
            setGap({ ...gap, text: "" });
          }}
        >
          <select className="select" aria-label="Factor" value={gap.factor} onChange={(e) => setGap({ ...gap, factor: e.target.value })}>
            {SUCCESS_FACTORS.flatMap((s) => s.factors).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <select className="select" aria-label="Sequence" value={gap.sequence} onChange={(e) => setGap({ ...gap, sequence: e.target.value as keyof typeof SEQ })}>
            {(Object.keys(SEQ) as (keyof typeof SEQ)[]).map((k) => (
              <option key={k} value={k}>
                {SEQ[k]}
              </option>
            ))}
          </select>
          <input className="input" aria-label="Gap" placeholder="The gap to close" value={gap.text} onChange={(e) => setGap({ ...gap, text: e.target.value })} style={{ flex: "1 1 240px" }} />
          <button className="btn small" type="submit" disabled={!gap.text.trim()}>
            Add
          </button>
        </form>
      </section>
    </div>
  );
}

// ---- cost, verification, funnel, demos ------------------------------------------------------

export function Views({ session, art, derived, onChange }: Props) {
  const f = derived.funnel;
  const c = derived.cost;
  const v = derived.verification;
  const bar = (n: number, max: number, color: string) => <span style={{ display: "inline-block", height: 10, width: `${max ? Math.round((n / max) * 100) : 0}%`, minWidth: n ? 4 : 0, background: color, borderRadius: 5 }} />;
  const maxW = Math.max(1, ...c.byWorkflow.map((w) => Math.max(w.estimate, w.actual)));
  const [demo, setDemo] = useState({ format: DEMO_FORMATS[0]!.name, iteration: 1, audience: "", what: "" });
  const grid = useMemo(() => ({ learning: { broadcast: DEMO_FORMATS.filter((d) => d.purpose === "learning" && d.reach === "broadcast"), personal: DEMO_FORMATS.filter((d) => d.purpose === "learning" && d.reach === "personal") }, persuading: { broadcast: DEMO_FORMATS.filter((d) => d.purpose === "persuading" && d.reach === "broadcast"), personal: DEMO_FORMATS.filter((d) => d.purpose === "persuading" && d.reach === "personal") } }), []);
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="an-three">
        <section className="panel panel-body stack" style={{ gap: 8 }}>
          <div className="eyebrow">Exploration funnel</div>
          <div className="an-funnel">
            <div style={{ width: "100%" }}>{f.outcomes} PI outcomes</div>
            <div style={{ width: "84%" }}>
              {f.learning.total} learning items · {f.learning.concluded} concluded · {f.learning.discarded} discarded
            </div>
            <div style={{ width: "66%" }}>
              {f.value.total} value items · {f.value.released} released
            </div>
            <div style={{ width: "48%", background: "#a7c23a" }}>{f.value.released} delivered</div>
          </div>
          <div style={{ fontSize: "0.86rem" }}>
            <b>Discard rate {f.discardRate}%</b> <span className="faint">cheap experiments validate more than can be funded; the narrowing is the point.</span>
          </div>
        </section>
        <section className="panel panel-body stack" style={{ gap: 8 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="eyebrow">AI operating cost</div>
            <span className="chip" style={{ background: c.overLimit ? "#fbd9d2" : "var(--ok-soft)" }}>
              {c.fixed + c.variableActual} / {c.limit ?? "no limit"}
            </span>
          </div>
          <div style={{ fontSize: "0.84rem" }}>
            Fixed <b>{c.fixed}</b> · variable actual <b>{c.variableActual}</b> of {c.variableEstimate} planned
          </div>
          <div className="row" style={{ gap: 8, fontSize: "0.8rem" }}>
            <label className="field">
              Fixed
              <input className="input" type="number" value={art.fixedAiCost ?? ""} onChange={(e) => onChange({ ...art, fixedAiCost: e.target.value === "" ? undefined : Number(e.target.value) })} style={{ width: 100 }} />
            </label>
            <label className="field">
              Limit
              <input className="input" type="number" value={art.costLimit ?? ""} onChange={(e) => onChange({ ...art, costLimit: e.target.value === "" ? undefined : Number(e.target.value) })} style={{ width: 100 }} />
            </label>
          </div>
          <div className="eyebrow">Variance by workflow</div>
          {c.byWorkflow.map((w) => (
            <div key={w.workflow} style={{ fontSize: "0.8rem", display: "grid", gridTemplateColumns: "120px 1fr 90px", gap: 6, alignItems: "center" }}>
              <span>{w.workflow}</span>
              <span className="stack" style={{ gap: 2 }}>
                {bar(w.estimate, maxW, "#b9c6ff")}
                {bar(w.actual, maxW, w.variance > 0 ? "#b9342f" : "#3d7a80")}
              </span>
              <span className="mono" style={{ textAlign: "right", color: w.variance > 0 ? "#b9342f" : "inherit" }}>
                {w.variance > 0 ? "+" : ""}
                {w.variance}
              </span>
            </div>
          ))}
        </section>
        <section className="panel panel-body stack" style={{ gap: 8 }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="eyebrow">Verification capacity</div>
            <span className="chip">{v.queueDepth} in review · median {v.medianReviewDays ?? "–"} days</span>
          </div>
          <span className="faint" style={{ fontSize: "0.78rem" }}>Review throughput is the ART's real constraint, not production hours.</span>
          {v.waiting.map((w) => (
            <div key={w.outputId} className="row" style={{ justifyContent: "space-between", fontSize: "0.84rem" }}>
              <span>
                <b>{w.title}</b> <span className="faint">{w.owner}</span>
              </span>
              <span className="mono" style={{ color: w.days > 5 ? "#b9342f" : "inherit" }}>{w.days} d</span>
            </div>
          ))}
          <div className="eyebrow" style={{ marginTop: 6 }}>Approver load</div>
          {v.approverLoad.map((l) => (
            <div key={l.owner} className="row" style={{ justifyContent: "space-between", fontSize: "0.82rem" }}>
              <span>{l.owner}</span>
              <span className="mono">
                {l.waiting} waiting · {l.done} done
              </span>
            </div>
          ))}
        </section>
      </div>
      <section className="panel panel-body stack" style={{ gap: 8 }}>
        <div className="eyebrow">Customer demos · purpose × reach</div>
        <div className="an-demo">
          {(["learning", "persuading"] as const).map((p) =>
            (["broadcast", "personal"] as const).map((r) => (
              <div key={`${p}-${r}`} className="an-demo-cell">
                <b>
                  {p} · {r}
                </b>
                {grid[p][r].map((d) => {
                  const planned = art.demos.filter((x) => x.format === d.name);
                  return (
                    <span key={d.name} className="chip" style={planned.length ? { background: "var(--ok-soft)" } : undefined} title={planned.map((x) => `Iteration ${x.iteration}: ${x.what ?? ""}`).join("\n")}>
                      {d.name}
                      {planned.length ? ` · ${planned.length}` : ""}
                    </span>
                  );
                })}
              </div>
            )),
          )}
        </div>
        <form
          className="row"
          style={{ gap: 6 }}
          onSubmit={(e) => {
            e.preventDefault();
            onChange({ ...art, demos: [...art.demos, { id: uid("demo"), format: demo.format, iteration: demo.iteration, outputIds: [], ...(demo.audience ? { audience: demo.audience } : {}), ...(demo.what ? { what: demo.what } : {}) }] });
            setDemo({ ...demo, audience: "", what: "" });
          }}
        >
          <select className="select" aria-label="Format" value={demo.format} onChange={(e) => setDemo({ ...demo, format: e.target.value })}>
            {DEMO_FORMATS.map((d) => (
              <option key={d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>
          <select className="select" aria-label="Iteration" value={demo.iteration} onChange={(e) => setDemo({ ...demo, iteration: Number(e.target.value) })}>
            {Array.from({ length: session.iterations }, (_, i) => (
              <option key={i} value={i + 1}>
                Iteration {i + 1}
              </option>
            ))}
          </select>
          <input className="input" aria-label="Audience" placeholder="Audience" value={demo.audience} onChange={(e) => setDemo({ ...demo, audience: e.target.value })} />
          <input className="input" aria-label="What" placeholder="What we show" value={demo.what} onChange={(e) => setDemo({ ...demo, what: e.target.value })} style={{ flex: "1 1 200px" }} />
          <button className="btn small" type="submit">
            Plan a demo
          </button>
        </form>
      </section>
    </div>
  );
}
