"use client";

// PI Outcome Planning (AI-Native SAFe): the outcome tree as SAFe's flip-chart pads, the PI
// Outcome Planning Board, each team's Outcome Planning Board, the Management Review Board,
// the one-day agenda and the confidence vote. One session per ART and PI; edits are local
// until Save, the way the value stream pages work.

import { useEffect, useMemo, useState } from "react";
import {
  MILESTONE_KINDS,
  REVIEW_KINDS,
  WORK_KINDS,
  confidence,
  krChange,
  outcomeTree,
  planningBoard,
  planningIssues,
  teamBoard,
  type AiNativeArt,
  type Milestone,
  type MilestoneKind,
  type Outcome,
  type OutcomeKeyResult,
  type PlanningSession,
  type ReviewItem,
  type ReviewKind,
  type WorkKind,
  type WorkSticky,
} from "@trainyard/core";
import { ART_TABS, AssessmentView, DataRegister, IntentView, Pipeline, SenseRespond, TeamCoverage, Views, type ArtDerived, type ArtTab } from "@/components/ainative";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, useApi, type ApiFailure } from "@/lib/api";

type Tab = "outcomes" | "board" | "teams" | "review" | "agenda" | ArtTab;
interface Summary {
  id: string;
  artName: string;
  piName: string;
  stage: string;
  teams: number;
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;
const strip = (s: PlanningSession) => {
  const { updatedAt: _u, ...rest } = s;
  return rest;
};

export default function OutcomePlanningPage() {
  const list = useApi<{ sessions: Summary[] }>("/v1/outcome-planning");
  const [id, setId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("outcomes");
  const [s, setS] = useState<PlanningSession | null>(null);
  const [saved, setSaved] = useState<PlanningSession | null>(null);
  const [art, setArt] = useState<{ art: AiNativeArt; derived: ArtDerived } | null>(null);
  const [artSaved, setArtSaved] = useState<AiNativeArt | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (!id && list.data?.sessions[0]) setId(list.data.sessions[0].id);
  }, [list.data, id]);
  useEffect(() => {
    if (!id) return;
    void api<{ session: PlanningSession }>("GET", `/v1/outcome-planning/${encodeURIComponent(id)}`).then((r) => {
      setS(r.session);
      setSaved(r.session);
    });
    void api<{ art: AiNativeArt; derived: ArtDerived }>("GET", `/v1/outcome-planning/${encodeURIComponent(id)}/art`).then((r) => {
      setArt(r);
      setArtSaved(r.art);
    });
  }, [id]);

  const artDirty = art && artSaved && JSON.stringify({ ...art.art, updatedAt: "" }) !== JSON.stringify({ ...artSaved, updatedAt: "" });
  const dirty = (s && saved && JSON.stringify(strip(s)) !== JSON.stringify(strip(saved))) || artDirty;
  const save = async () => {
    if (!s) return;
    setErr(null);
    try {
      if (saved && JSON.stringify(strip(s)) !== JSON.stringify(strip(saved))) {
        const r = await api<{ session: PlanningSession }>("PUT", `/v1/outcome-planning/${encodeURIComponent(s.id)}`, strip(s));
        setS(r.session);
        setSaved(r.session);
      }
      if (artDirty && art) {
        const { updatedAt: _u, ...body } = art.art;
        const r = await api<{ art: AiNativeArt; derived: ArtDerived }>("PUT", `/v1/outcome-planning/${encodeURIComponent(s.id)}/art`, body);
        setArt(r);
        setArtSaved(r.art);
      }
      setNote("Saved.");
      setTimeout(() => setNote(null), 2500);
      void list.reload();
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };
  const vote = async (teamId: string, value: 1 | 2 | 3 | 4 | 5, concern?: string) => {
    if (!s) return;
    try {
      const r = await api<{ votes: PlanningSession["votes"] }>("POST", `/v1/outcome-planning/${encodeURIComponent(s.id)}/votes`, { teamId, value, ...(concern ? { concern } : {}) });
      setS({ ...s, votes: r.votes });
      setSaved((p) => (p ? { ...p, votes: r.votes } : p));
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };

  if (!list.data) return <Loading error={list.error} />;
  if (!s) return <Loading error={null} />;

  const TABS: [Tab, string][] = [
    ["outcomes", "Outcomes"],
    ["board", "PI Outcome Planning Board"],
    ["teams", "Team boards"],
    ["review", "Management review"],
    ["agenda", "Agenda & vote"],
    ...ART_TABS,
  ];
  const artProps = art
    ? {
        session: s,
        art: art.art,
        derived: art.derived,
        onChange: (a: AiNativeArt) => setArt({ ...art, art: a }),
        onServer: (a: AiNativeArt, d: ArtDerived) => {
          setArt({ art: a, derived: d });
          setArtSaved(a);
        },
        onError: setErr,
      }
    : null;

  return (
    <>
      <PageHead
        title="PI Outcome Planning"
        sub="The one-day AI-Native SAFe event: align on the PI outcomes that advance the ART outcomes, commit to the team outcomes that achieve them, and agree the milestones that make the plan executable. ART outcomes, PI outcomes and team outcomes form the outcome tree; the boards show how it is realised across the iterations."
        actions={
          <div className="row">
            <select className="select" aria-label="Session" value={s.id} onChange={(e) => setId(e.target.value)}>
              {list.data.sessions.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.artName} · {x.piName}
                </option>
              ))}
            </select>
            <select className="select" aria-label="Plan stage" value={s.stage} onChange={(e) => setS({ ...s, stage: e.target.value as PlanningSession["stage"] })}>
              <option value="draft">Draft plan</option>
              <option value="adjusted">Adjusted after management review</option>
              <option value="final">Final plan</option>
            </select>
            {dirty ? (
              <>
                <button className="btn ghost" onClick={() => (setS(saved), artSaved && art && setArt({ ...art, art: artSaved }))}>
                  Discard
                </button>
                <button className="btn primary" onClick={() => void save()}>
                  Save
                </button>
              </>
            ) : null}
          </div>
        }
      />
      {err ? <ErrorList title="Not saved" items={[{ message: err }]} /> : null}
      {note ? <div className="notice" role="status">{note}</div> : null}
      <div className="tabs" role="tablist" aria-label="Views">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>
      {tab === "outcomes" ? <Outcomes s={s} onChange={setS} /> : null}
      {tab === "board" ? <Board s={s} onChange={setS} /> : null}
      {tab === "teams" ? <Teams s={s} onChange={setS} /> : null}
      {tab === "review" ? <Review s={s} onChange={setS} /> : null}
      {tab === "agenda" ? <Agenda s={s} onChange={setS} onVote={vote} /> : null}
      {artProps && art!.derived.issues.length && ART_TABS.some(([k]) => k === tab) ? (
        <div className="notice warn" style={{ fontSize: "0.84rem" }}>
          <strong>Before the next event</strong>
          <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
            {art!.derived.issues.slice(0, 6).map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {artProps && tab === "pipeline" ? <Pipeline {...artProps} /> : null}
      {artProps && tab === "intent" ? <IntentView {...artProps} /> : null}
      {artProps && tab === "sense" ? <SenseRespond {...artProps} /> : null}
      {artProps && tab === "data" ? <DataRegister {...artProps} /> : null}
      {artProps && tab === "capabilities" ? <TeamCoverage {...artProps} /> : null}
      {artProps && tab === "assessment" ? <AssessmentView {...artProps} /> : null}
      {artProps && tab === "views" ? <Views {...artProps} /> : null}
    </>
  );
}

// ---- outcomes: the tree as flip-chart pads ----------------------------------------------

function Pad({ title, sub, children, stacked }: { title: string; sub: string; children: React.ReactNode; stacked?: boolean }) {
  return (
    <div className={`op-pad${stacked ? " stacked" : ""}`}>
      <div className="op-pad-top">
        <span />
        <span />
        <span />
      </div>
      <div className="op-pad-head">
        <b>{title}</b>
        <span>{sub}</span>
      </div>
      <div className="op-pad-body">{children}</div>
    </div>
  );
}

function KrLine({ kr, i, onChange, onRemove, stage }: { kr: OutcomeKeyResult; i: number; onChange: (k: OutcomeKeyResult) => void; onRemove: () => void; stage: PlanningSession["stage"] }) {
  const change = krChange(kr);
  const color = stage === "draft" ? "inherit" : change === "cut" ? "#b9342f" : change === "raised" ? "#5a9e1c" : "inherit";
  return (
    <div className="op-kr">
      <span className="op-kr-n">KR{i + 1}:</span>
      <textarea className="op-inline op-text" rows={1} aria-label="Key result" value={kr.text} onChange={(e) => onChange({ ...kr, text: e.target.value })} />
      <input className="op-inline op-target" aria-label="Target" value={kr.target} style={{ color, fontWeight: 700 }} title={kr.draftTarget && kr.draftTarget !== kr.target ? `Drafted as ${kr.draftTarget}` : undefined} onChange={(e) => onChange({ ...kr, target: e.target.value, ...(kr.draftTarget ? {} : { draftTarget: kr.target }) })} />
      {kr.current ? <span className="chip" title="Latest measured value">now {kr.current}</span> : null}
      <button className="btn small ghost" aria-label="Remove key result" onClick={onRemove}>
        ×
      </button>
    </div>
  );
}

function OutcomeBlock({ o, i, s, onChange, onRemove }: { o: Outcome; i: number; s: PlanningSession; onChange: (o: Outcome) => void; onRemove: () => void }) {
  return (
    <div className="op-objective">
      <div className="row" style={{ gap: 6 }}>
        <b style={{ whiteSpace: "nowrap" }}>Objective {i + 1}:</b>
        <textarea className="op-inline op-text" rows={1} aria-label="Objective" value={o.title} style={{ fontWeight: 700, flex: 1 }} onChange={(e) => onChange({ ...o, title: e.target.value })} />
        <button className="btn small ghost" aria-label={`Remove ${o.title}`} onClick={onRemove}>
          ×
        </button>
      </div>
      {o.level !== "team" ? (
        <div className="row" style={{ gap: 6, fontSize: "0.76rem", marginLeft: 4 }}>
          <select className="select" aria-label="Ambition" value={o.ambition ?? ""} onChange={(e) => onChange({ ...o, ...(e.target.value ? { ambition: e.target.value as Outcome["ambition"] } : { ambition: undefined }) })}>
            <option value="">ambition…</option>
            <option value="moonshot">Moonshot</option>
            <option value="roofshot">Roofshot</option>
          </select>
          <select className="select" aria-label="Status" value={o.status ?? ""} onChange={(e) => onChange({ ...o, ...(e.target.value ? { status: e.target.value as Outcome["status"] } : { status: undefined }) })}>
            <option value="">status…</option>
            {["draft", "committed", "active", "achieved", "missed", "retired"].map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          {o.owner ? <span className="faint">owner {o.owner}</span> : null}
          {o.approver ? <span className="faint">· approver {o.approver}</span> : null}
        </div>
      ) : null}
      {o.keyResults.map((kr, k) => (
        <KrLine key={kr.id} kr={kr} i={k} stage={s.stage} onChange={(x) => onChange({ ...o, keyResults: o.keyResults.map((y) => (y.id === x.id ? x : y)) })} onRemove={() => onChange({ ...o, keyResults: o.keyResults.filter((y) => y.id !== kr.id) })} />
      ))}
      <button className="btn small ghost" onClick={() => onChange({ ...o, keyResults: [...o.keyResults, { id: uid("kr"), text: "Measure…", target: "" }] })}>
        + key result
      </button>
    </div>
  );
}

function Outcomes({ s, onChange }: { s: PlanningSession; onChange: (s: PlanningSession) => void }) {
  const tree = useMemo(() => outcomeTree(s), [s]);
  const [team, setTeam] = useState(s.teams[0]?.id ?? "");
  const setOutcome = (o: Outcome) => onChange({ ...s, outcomes: s.outcomes.map((x) => (x.id === o.id ? o : x)) });
  const remove = (id: string) => onChange({ ...s, outcomes: s.outcomes.filter((x) => x.id !== id && x.parentId !== id), milestones: s.milestones.map((m) => (m.outcomeId === id ? { ...m, outcomeId: undefined } : m)) });
  const add = (level: Outcome["level"], parentId?: string, teamId?: string) => onChange({ ...s, outcomes: [...s.outcomes, { id: uid(level), level, title: "New outcome", keyResults: [], ...(parentId ? { parentId } : {}), ...(teamId ? { teamId } : {}) }] });
  const stageLabel = s.stage === "draft" ? "Draft" : "Final";
  const pis = s.outcomes.filter((o) => o.level === "pi");
  const teamOutcomes = s.outcomes.filter((o) => o.level === "team" && o.teamId === team);
  const issues = planningIssues(s);
  return (
    <div className="stack" style={{ gap: 16 }}>
      {tree.portfolio.length ? (
        <div className="row" style={{ gap: 8, fontSize: "0.84rem" }}>
          <span className="eyebrow">Portfolio outcomes</span>
          {tree.portfolio.map((p) => (
            <span key={p.id} className="chip" title={p.keyResults.map((k) => `${k.text} ${k.target}${k.current ? ` (now ${k.current})` : ""}`).join("; ")}>
              {p.ambition === "moonshot" ? "🚀 " : ""}
              {p.title}
            </span>
          ))}
        </div>
      ) : null}
      <div className="op-tree">
        <div className="op-tree-col">
          <div className="op-arrow">Communicate purpose ↓</div>
          <Pad title={s.artName} sub="ART outcomes · the year ahead">
            <div className="field" style={{ marginBottom: 8 }}>
              <span className="eyebrow">Vision</span>
              <input className="op-inline" aria-label="Vision" value={s.vision} style={{ fontStyle: "italic" }} onChange={(e) => onChange({ ...s, vision: e.target.value })} />
            </div>
            {tree.art
              .filter((a) => a.outcome.id !== "art-none")
              .map((a, i) => (
                <OutcomeBlock key={a.outcome.id} o={a.outcome} i={i} s={s} onChange={setOutcome} onRemove={() => remove(a.outcome.id)} />
              ))}
            <button className="btn small" onClick={() => add("art")}>
              Add an ART outcome
            </button>
          </Pad>
        </div>
        <div className="op-tree-col">
          <div className="op-arrow">Communicate commitment ↑</div>
          <Pad title={s.artName} sub={`${stageLabel} PI outcomes · ${s.piName}`}>
            {pis.map((p, i) => (
              <div key={p.id}>
                <OutcomeBlock o={p} i={i} s={s} onChange={setOutcome} onRemove={() => remove(p.id)} />
                <label className="row" style={{ gap: 6, fontSize: "0.78rem", margin: "-4px 0 10px 4px" }}>
                  <span className="faint">advances</span>
                  <select className="select" aria-label="ART outcome" value={p.parentId ?? ""} onChange={(e) => setOutcome({ ...p, ...(e.target.value ? { parentId: e.target.value } : { parentId: undefined }) })}>
                    <option value="">(not traced)</option>
                    {s.outcomes
                      .filter((o) => o.level === "art")
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.title}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
            ))}
            <button className="btn small" onClick={() => add("pi", s.outcomes.find((o) => o.level === "art")?.id)}>
              Add a PI outcome
            </button>
          </Pad>
        </div>
        <div className="op-tree-col">
          <div className="op-arrow">Communicate commitment ↑</div>
          <Pad title={s.teams.find((t) => t.id === team)?.name ?? "Team"} sub={`${stageLabel} PI outcomes · team`} stacked>
            <select className="select" aria-label="Team" value={team} onChange={(e) => setTeam(e.target.value)} style={{ marginBottom: 10 }}>
              {s.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {teamOutcomes.map((o, i) => (
              <div key={o.id}>
                <OutcomeBlock o={o} i={i} s={s} onChange={setOutcome} onRemove={() => remove(o.id)} />
                <label className="row" style={{ gap: 6, fontSize: "0.78rem", margin: "-4px 0 10px 4px" }}>
                  <span className="faint">contributes to</span>
                  <select className="select" aria-label="PI outcome" value={o.parentId ?? ""} onChange={(e) => setOutcome({ ...o, ...(e.target.value ? { parentId: e.target.value } : { parentId: undefined }) })}>
                    <option value="">Other (team commitment)</option>
                    {pis.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
            <button className="btn small" onClick={() => add("team", pis[0]?.id, team)} disabled={!team}>
              Add a team outcome
            </button>
          </Pad>
        </div>
      </div>
      <div className="row" style={{ gap: 8 }}>
        <span className="eyebrow">Teams</span>
        {s.teams.map((t) => (
          <span key={t.id} className="chip">
            {t.name} · {s.outcomes.filter((o) => o.level === "team" && o.teamId === t.id).length}
          </span>
        ))}
        <AddTeam s={s} onChange={onChange} />
      </div>
      {issues.length ? (
        <div className="notice warn">
          <strong>Before the final review</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="notice ok">Every PI outcome has contributing team outcomes, every outcome has a measure, every team has voted, and nothing is left unanswered.</div>
      )}
    </div>
  );
}

function AddTeam({ s, onChange }: { s: PlanningSession; onChange: (s: PlanningSession) => void }) {
  const [name, setName] = useState("");
  return (
    <form
      className="row"
      style={{ gap: 6 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onChange({ ...s, teams: [...s.teams, { id: uid("team"), name: name.trim() }] });
        setName("");
      }}
    >
      <input className="input" aria-label="New team" placeholder="Add a team…" value={name} onChange={(e) => setName(e.target.value)} style={{ width: 160 }} />
      <button className="btn small" type="submit" disabled={!name.trim()}>
        Add
      </button>
    </form>
  );
}

// ---- the PI Outcome Planning Board ------------------------------------------------------

function Diamond({ kind, size = 16 }: { kind: MilestoneKind; size?: number }) {
  return <span className="op-diamond" style={{ width: size, height: size, background: MILESTONE_KINDS[kind].color }} aria-hidden="true" />;
}

function MilestoneCard({ m, onRemove }: { m: Milestone; onRemove?: () => void }) {
  return (
    <div className="op-ms" style={{ borderColor: MILESTONE_KINDS[m.kind].color }} title={MILESTONE_KINDS[m.kind].label}>
      <Diamond kind={m.kind} />
      <span>{m.label}</span>
      {onRemove ? (
        <button className="btn small ghost" aria-label={`Remove ${m.label}`} onClick={onRemove}>
          ×
        </button>
      ) : null}
    </div>
  );
}

function Legend() {
  return (
    <div className="row" style={{ gap: 14, fontSize: "0.8rem" }}>
      {(Object.keys(MILESTONE_KINDS) as MilestoneKind[]).map((k) => (
        <span key={k} className="row" style={{ gap: 6 }}>
          <Diamond kind={k} size={12} /> {MILESTONE_KINDS[k].label}
        </span>
      ))}
    </div>
  );
}

function Board({ s, onChange }: { s: PlanningSession; onChange: (s: PlanningSession) => void }) {
  const b = useMemo(() => planningBoard(s), [s]);
  const cols = s.iterations + 1;
  const [draft, setDraft] = useState<{ kind: MilestoneKind; iteration: number; outcomeId: string; label: string; teamIds: string[] }>({ kind: "learning", iteration: 1, outcomeId: "", label: "", teamIds: [] });
  const addMilestone = () => {
    if (!draft.label.trim()) return;
    onChange({ ...s, milestones: [...s.milestones, { id: uid("m"), kind: draft.kind, label: draft.label.trim(), iteration: draft.iteration, ...(draft.outcomeId && draft.kind !== "fixed" ? { outcomeId: draft.outcomeId } : {}), ...(draft.teamIds.length ? { teamIds: draft.teamIds } : {}) }] });
    setDraft({ ...draft, label: "" });
  };
  const removeMs = (id: string) => onChange({ ...s, milestones: s.milestones.filter((m) => m.id !== id) });
  const grid = `minmax(220px, 1.3fr) minmax(200px, 1.2fr) repeat(${cols}, minmax(120px, 1fr))`;
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <b style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>
          {s.artName} · {s.piName} · {s.stage === "draft" ? "Draft" : s.stage === "adjusted" ? "Adjusted" : "Final"} PI Outcome Planning Board
        </b>
        <Legend />
      </div>
      <div className="scroll-x">
        <div className="op-board" style={{ gridTemplateColumns: grid }}>
          <div className="op-h">PI Outcome</div>
          <div className="op-h">Team Outcomes</div>
          {Array.from({ length: cols }, (_, i) => (
            <div key={i} className="op-h center">
              {i < s.iterations ? (
                <>
                  Iteration
                  <br />
                  {i + 1}
                </>
              ) : (
                <>
                  Next
                  <br />
                  PI
                </>
              )}
            </div>
          ))}
          <div className="op-cell op-ms-row" style={{ gridColumn: "1 / span 2" }}>
            <b>ART Milestones</b>
          </div>
          {b.milestonesRow.map((cell, i) => (
            <div key={i} className="op-cell op-ms-row center">
              {cell.map((m) => (
                <MilestoneCard key={m.id} m={m} onRemove={() => removeMs(m.id)} />
              ))}
            </div>
          ))}
          {b.rows.map((r) => (
            <RowCells key={r.outcome?.id ?? "other"} r={r} s={s} onRemove={removeMs} />
          ))}
        </div>
      </div>
      <form
        className="row"
        style={{ gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          addMilestone();
        }}
      >
        <span className="eyebrow">Add a milestone</span>
        <select className="select" aria-label="Milestone kind" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as MilestoneKind })}>
          {(Object.keys(MILESTONE_KINDS) as MilestoneKind[]).map((k) => (
            <option key={k} value={k}>
              {MILESTONE_KINDS[k].label}
            </option>
          ))}
        </select>
        <select className="select" aria-label="Iteration" value={draft.iteration} onChange={(e) => setDraft({ ...draft, iteration: Number(e.target.value) })}>
          {Array.from({ length: cols }, (_, i) => (
            <option key={i} value={i + 1}>
              {i < s.iterations ? `Iteration ${i + 1}` : "Next PI"}
            </option>
          ))}
        </select>
        {draft.kind !== "fixed" ? (
          <select className="select" aria-label="PI outcome row" value={draft.outcomeId} onChange={(e) => setDraft({ ...draft, outcomeId: e.target.value })}>
            <option value="">Other</option>
            {s.outcomes
              .filter((o) => o.level === "pi")
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title}
                </option>
              ))}
          </select>
        ) : null}
        <select className="select" aria-label="Owning teams" multiple value={draft.teamIds} onChange={(e) => setDraft({ ...draft, teamIds: [...e.target.selectedOptions].map((o) => o.value) })} style={{ height: 34, minWidth: 140 }} title="Teams that own it (Ctrl-click for several)">
          {s.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input className="input" aria-label="Milestone" placeholder="e.g. Diet classification model accuracy validated" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} style={{ flex: "1 1 240px" }} />
        <button className="btn small" type="submit" disabled={!draft.label.trim()}>
          Add
        </button>
      </form>
    </div>
  );
}

function RowCells({ r, s, onRemove }: { r: ReturnType<typeof planningBoard>["rows"][number]; s: PlanningSession; onRemove: (id: string) => void }) {
  const o = r.outcome;
  return (
    <>
      <div className="op-cell op-outcome">
        <b style={{ fontSize: "1.05rem" }}>{o?.title ?? "Other"}</b>
        {o ? (
          <ul>
            {o.keyResults.map((kr) => {
              const c = krChange(kr);
              return (
                <li key={kr.id}>
                  {kr.text} <b style={{ color: s.stage !== "draft" && c === "cut" ? "#b9342f" : s.stage !== "draft" && c === "raised" ? "#5a9e1c" : "inherit" }}>{kr.target}</b>
                </li>
              );
            })}
          </ul>
        ) : (
          <span className="faint" style={{ fontSize: "0.8rem" }}>Team commitments not linked to a PI outcome.</span>
        )}
      </div>
      <div className="op-cell">
        {r.teamOutcomes.map((t) => (
          <div key={t.id} style={{ marginBottom: 8, fontSize: "0.86rem" }}>
            <b>{s.teams.find((x) => x.id === t.teamId)?.name ?? "Team"}</b>
            <div>{t.title}</div>
          </div>
        ))}
      </div>
      {r.byIteration.map((cell, i) => (
        <div key={i} className="op-cell center">
          {cell.map((m) => (
            <MilestoneCard key={m.id} m={m} onRemove={() => onRemove(m.id)} />
          ))}
        </div>
      ))}
    </>
  );
}

// ---- team boards ----------------------------------------------------------------------

function Teams({ s, onChange }: { s: PlanningSession; onChange: (s: PlanningSession) => void }) {
  const [team, setTeam] = useState(s.teams[0]?.id ?? "");
  const tb = useMemo(() => (team ? teamBoard(s, team) : null), [s, team]);
  const cols = s.iterations + 1;
  const [draft, setDraft] = useState<{ kind: WorkKind; iteration: number; outcomeId: string; label: string }>({ kind: "feature", iteration: 1, outcomeId: "", label: "" });
  const mine = s.outcomes.filter((o) => o.level === "team" && o.teamId === team);
  const add = () => {
    if (!draft.label.trim() || !team) return;
    const w: WorkSticky = { id: uid("w"), teamId: team, kind: draft.kind, label: draft.label.trim(), iteration: draft.iteration, ...(draft.outcomeId ? { outcomeId: draft.outcomeId } : {}) };
    onChange({ ...s, work: [...s.work, w] });
    setDraft({ ...draft, label: "" });
  };
  const move = (w: WorkSticky, by: number) => onChange({ ...s, work: s.work.map((x) => (x.id === w.id ? { ...x, iteration: Math.min(cols, Math.max(1, x.iteration + by)) } : x)) });
  if (!tb) return <div className="notice">Add a team on the Outcomes view first.</div>;
  const peak = Math.max(...tb.load);
  const grid = `minmax(240px, 1.4fr) repeat(${cols}, minmax(130px, 1fr))`;
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="row">
          <select className="select" aria-label="Team" value={team} onChange={(e) => setTeam(e.target.value)}>
            {s.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <b style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>Outcome Planning Board</b>
        </div>
        <div className="row" style={{ gap: 14, fontSize: "0.8rem" }}>
          {(Object.keys(WORK_KINDS) as WorkKind[]).map((k) => (
            <span key={k} className="row" style={{ gap: 6 }}>
              <span style={{ width: 12, height: 12, background: WORK_KINDS[k].color, borderRadius: 2 }} /> {WORK_KINDS[k].label}
            </span>
          ))}
        </div>
      </div>
      <div className="scroll-x">
        <div className="op-board" style={{ gridTemplateColumns: grid }}>
          <div className="op-h">Team Outcomes</div>
          {Array.from({ length: cols }, (_, i) => (
            <div key={i} className="op-h center" style={peak > 3 && tb.load[i] === peak ? { background: "#b9342f" } : undefined} title={peak > 3 && tb.load[i] === peak ? "Busiest iteration: check capacity" : undefined}>
              {i < s.iterations ? (
                <>
                  Iteration
                  <br />
                  {i + 1}
                </>
              ) : (
                <>
                  Next
                  <br />
                  PI
                </>
              )}
            </div>
          ))}
          <div className="op-cell op-ms-row">
            <b>ART Milestones</b>
          </div>
          {tb.fixed.map((cell, i) => (
            <div key={i} className="op-cell op-ms-row center">
              {cell.map((m) => (
                <MilestoneCard key={m.id} m={m} />
              ))}
            </div>
          ))}
          {tb.rows.map((r) => (
            <div key={r.outcome?.id ?? "other"} style={{ display: "contents" }}>
              <div className="op-cell op-outcome">
                <b>{r.outcome?.title ?? "Other"}</b>
                {r.outcome ? (
                  <ul>
                    {r.outcome.keyResults.map((kr) => (
                      <li key={kr.id}>
                        {kr.text} <b>{kr.target}</b>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {r.byIteration.map((cell, i) => (
                <div key={i} className="op-cell center">
                  {cell.milestones.map((m) => (
                    <MilestoneCard key={m.id} m={m} />
                  ))}
                  {cell.work.map((w) => (
                    <div key={w.id} className="op-sticky" style={{ background: WORK_KINDS[w.kind].color, color: WORK_KINDS[w.kind].ink }} title={WORK_KINDS[w.kind].label}>
                      <span>{w.label}</span>
                      <span className="op-sticky-tools">
                        <button aria-label="Earlier" onClick={() => move(w, -1)}>
                          ‹
                        </button>
                        <button aria-label="Later" onClick={() => move(w, 1)}>
                          ›
                        </button>
                        <button aria-label={`Remove ${w.label}`} onClick={() => onChange({ ...s, work: s.work.filter((x) => x.id !== w.id) })}>
                          ×
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <form
        className="row"
        style={{ gap: 8 }}
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <span className="eyebrow">Add work</span>
        <select className="select" aria-label="Kind" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as WorkKind })}>
          {(Object.keys(WORK_KINDS) as WorkKind[]).map((k) => (
            <option key={k} value={k}>
              {WORK_KINDS[k].label}
            </option>
          ))}
        </select>
        <select className="select" aria-label="Iteration" value={draft.iteration} onChange={(e) => setDraft({ ...draft, iteration: Number(e.target.value) })}>
          {Array.from({ length: cols }, (_, i) => (
            <option key={i} value={i + 1}>
              {i < s.iterations ? `Iteration ${i + 1}` : "Next PI"}
            </option>
          ))}
        </select>
        <select className="select" aria-label="Team outcome" value={draft.outcomeId} onChange={(e) => setDraft({ ...draft, outcomeId: e.target.value })}>
          <option value="">Other</option>
          {mine.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </select>
        <input className="input" aria-label="Work item" placeholder="e.g. Swap-acceptance framing A/B test" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} style={{ flex: "1 1 240px" }} />
        <button className="btn small" type="submit" disabled={!draft.label.trim()}>
          Add
        </button>
      </form>
      <p className="faint" style={{ fontSize: "0.82rem", margin: 0 }}>
        Outcome-driven teams do not plan every output. Put down the critical experiments, prototypes, enablers and features that will advance the outcomes and test the thinking; a red column header is the busiest iteration, where a capacity clash tends to hide.
      </p>
    </div>
  );
}

// ---- management review board ------------------------------------------------------------

function Review({ s, onChange }: { s: PlanningSession; onChange: (s: PlanningSession) => void }) {
  const [draft, setDraft] = useState<{ kind: ReviewKind; text: string; owner: string; teamId: string; answers: string }>({ kind: "decision-needed", text: "", owner: "", teamId: "", answers: "" });
  const open = s.review.filter((r) => (r.kind === "decision-needed" || r.kind === "risk") && !s.review.some((x) => x.answers === r.id));
  const add = () => {
    if (!draft.text.trim()) return;
    const r: ReviewItem = { id: uid("r"), kind: draft.kind, text: draft.text.trim(), ...(draft.owner.trim() ? { owner: draft.owner.trim() } : {}), ...(draft.teamId ? { teamId: draft.teamId } : {}), ...(draft.answers ? { answers: draft.answers } : {}) };
    onChange({ ...s, review: [...s.review, r] });
    setDraft({ ...draft, text: "", answers: "" });
  };
  const quadrant = (kind: ReviewKind) => (
    <div className="op-quadrant">
      <h3>{REVIEW_KINDS[kind].label}</h3>
      <div className="op-stickies">
        {s.review
          .filter((r) => r.kind === kind)
          .map((r) => {
            const answered = (r.kind === "decision-needed" || r.kind === "risk") && s.review.some((x) => x.answers === r.id);
            const answersTo = r.answers ? s.review.find((x) => x.id === r.answers) : undefined;
            return (
              <div key={r.id} className="op-note" style={{ background: REVIEW_KINDS[kind].color, opacity: answered ? 0.55 : 1 }} title={answered ? "Answered by a confirmed decision or action" : undefined}>
                <b>{kind === "decision-needed" ? "Decision Needed" : kind === "risk" ? "Risk" : kind === "decision-confirmed" ? "Decision" : "Action"}</b>
                <textarea className="op-note-text" aria-label={REVIEW_KINDS[kind].label} value={r.text} onChange={(e) => onChange({ ...s, review: s.review.map((x) => (x.id === r.id ? { ...x, text: e.target.value } : x)) })} />
                <div className="op-note-meta">
                  {r.teamId ? <span>{s.teams.find((t) => t.id === r.teamId)?.name}</span> : null}
                  {r.owner ? <span>owner: {r.owner}</span> : null}
                  {answersTo ? <span>answers: {answersTo.text.slice(0, 40)}…</span> : null}
                  {answered ? <span>✓ answered</span> : null}
                </div>
                <div className="row" style={{ gap: 4, marginTop: 4 }}>
                  {kind === "decision-needed" ? (
                    <button className="btn small" onClick={() => setDraft({ kind: "decision-confirmed", text: "", owner: "", teamId: r.teamId ?? "", answers: r.id })}>
                      Decide
                    </button>
                  ) : null}
                  {kind === "risk" ? (
                    <button className="btn small" onClick={() => setDraft({ kind: "action", text: "", owner: "", teamId: r.teamId ?? "", answers: r.id })}>
                      Act on it
                    </button>
                  ) : null}
                  <button className="btn small ghost" aria-label="Remove" onClick={() => onChange({ ...s, review: s.review.filter((x) => x.id !== r.id && x.answers !== r.id) })}>
                    ×
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <b style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>Management Review and Problem-Solving</b>
        <span className="chip" style={open.length ? { background: "var(--signal-soft)" } : { background: "var(--ok-soft)" }}>
          {open.length ? `${open.length} open` : "Everything answered"}
        </span>
      </div>
      <div className="op-pad op-review">
        <div className="op-pad-top">
          <span />
          <span />
          <span />
        </div>
        <div className="op-review-grid">
          {quadrant("decision-needed")}
          {quadrant("risk")}
          {quadrant("decision-confirmed")}
          {quadrant("action")}
        </div>
      </div>
      <form
        className="row"
        style={{ gap: 8, alignItems: "flex-start" }}
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <select className="select" aria-label="Kind" value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as ReviewKind, answers: "" })}>
          {(Object.keys(REVIEW_KINDS) as ReviewKind[]).map((k) => (
            <option key={k} value={k}>
              {k === "decision-needed" ? "Decision needed" : k === "risk" ? "Risk" : k === "decision-confirmed" ? "Decision confirmed" : "Action"}
            </option>
          ))}
        </select>
        {draft.kind === "decision-confirmed" || draft.kind === "action" ? (
          <select className="select" aria-label="Answers" value={draft.answers} onChange={(e) => setDraft({ ...draft, answers: e.target.value })}>
            <option value="">Answers nothing in particular</option>
            {s.review
              .filter((r) => r.kind === "decision-needed" || r.kind === "risk")
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.kind === "risk" ? "Risk: " : "Decision: "}
                  {r.text.slice(0, 60)}
                </option>
              ))}
          </select>
        ) : null}
        <select className="select" aria-label="Team" value={draft.teamId} onChange={(e) => setDraft({ ...draft, teamId: e.target.value })}>
          <option value="">No team</option>
          {s.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <input className="input" aria-label="Owner" placeholder="Owner" value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} style={{ width: 150 }} />
        <textarea className="textarea" aria-label="Text" placeholder={draft.kind === "decision-needed" ? "The Cart Team are proposing deferral of…" : "…"} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} style={{ flex: "1 1 280px", minHeight: 38 }} />
        <button className="btn small" type="submit" disabled={!draft.text.trim()}>
          Add
        </button>
      </form>
    </div>
  );
}

// ---- agenda and confidence vote ----------------------------------------------------------

function Agenda({ s, onChange, onVote }: { s: PlanningSession; onChange: (s: PlanningSession) => void; onVote: (teamId: string, value: 1 | 2 | 3 | 4 | 5, concern?: string) => void }) {
  const c = confidence(s);
  const [concern, setConcern] = useState<Record<string, string>>({});
  const half = (h: "morning" | "afternoon") => {
    const slots = s.agenda.filter((a) => a.half === h);
    // Lunch and the management review sit between the halves, so they do not count toward the 3.5 hours.
    const total = slots.filter((a) => a.kind !== "review").reduce((n, a) => n + a.minutes, 0);
    return (
      <div className="op-half">
        <div className="op-half-title">
          {h === "morning" ? "Morning" : "Afternoon"} · {Math.round((total / 60) * 10) / 10} hours · {h === "morning" ? "Draft the plan" : "Finalize the plan"}
        </div>
        {slots.map((a) => (
          <label key={a.id} className={`op-slot ${a.kind}${a.done ? " done" : ""}`}>
            <input type="checkbox" checked={!!a.done} onChange={() => onChange({ ...s, agenda: s.agenda.map((x) => (x.id === a.id ? { ...x, done: !x.done } : x)) })} aria-label={`${a.title} done`} />
            <span className="op-slot-min">{a.minutes >= 60 ? `${a.minutes / 60} hour${a.minutes > 60 ? "s" : ""}` : `${a.minutes} min`}</span>
            <span>
              <b>{a.title}</b>
              {a.detail ? <div className="faint" style={{ fontSize: "0.8rem" }}>{a.detail}</div> : null}
            </span>
          </label>
        ))}
      </div>
    );
  };
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="op-agenda">
        {half("morning")}
        {half("afternoon")}
      </div>
      <section className="panel panel-body stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <b style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem" }}>Confidence vote · fist of five</b>
          <span className="chip" style={{ background: c.committed ? "var(--ok-soft)" : "var(--signal-soft)" }}>
            {c.committed ? "Committed" : c.votes < c.teams ? `${c.votes} of ${c.teams} teams voted` : `${c.low.length} team${c.low.length === 1 ? "" : "s"} below 3`}
            {c.average !== null ? ` · average ${c.average}` : ""}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {s.teams.map((t) => {
            const v = s.votes.find((x) => x.teamId === t.id);
            return (
              <div key={t.id} className="card" style={{ padding: 12, display: "grid", gap: 8 }}>
                <b>{t.name}</b>
                <div className="row" style={{ gap: 4 }}>
                  {([1, 2, 3, 4, 5] as const).map((n) => (
                    <button key={n} className={`op-fist${v?.value === n ? " on" : ""}`} aria-pressed={v?.value === n} onClick={() => onVote(t.id, n, n <= 2 ? concern[t.id] : undefined)} title={n === 1 ? "No confidence" : n === 5 ? "Full confidence" : `${n}`}>
                      {n}
                    </button>
                  ))}
                </div>
                {(v && v.value <= 2) || (concern[t.id] ?? "") ? (
                  <input className="input" aria-label={`${t.name} concern`} placeholder="What would have to change?" value={concern[t.id] ?? v?.concern ?? ""} onChange={(e) => setConcern({ ...concern, [t.id]: e.target.value })} onBlur={() => v && v.value <= 2 && onVote(t.id, v.value, concern[t.id])} />
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="faint" style={{ fontSize: "0.82rem", margin: 0 }}>
          Those voting 1 or 2 say what concerns them; the room addresses it until everyone can commit. If commitment cannot be reached, the plan changes, not the vote.
        </p>
      </section>
    </div>
  );
}
