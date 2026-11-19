"use client";

// One team's PI board in the Trainyard Glass design, with three tabs over the same stories: Team
// planning (stories against each iteration's capacity), Team Kanban (the same stories through the
// team's states) and PI objectives (planned and actual business value, with the achievement the
// predictability measure is built from). The work lives in the board's frame state.

import { useState } from "react";
import { KANBAN_LEVELS, type Board, type KanbanItem } from "@trainyard/core";
import { useFrameState } from "@/components/exercise-boards";
import { KanbanBoard } from "@/components/kanban-board";

type Story = KanbanItem & { iter?: number };
type Objective = { id: string; name: string; plan: number; actual?: number; committed: boolean };
type Note = { id: string; name: string };
const ITERS = ["Iteration 1", "Iteration 2", "Iteration 3", "Iteration 4", "IP iteration"];
const TABS = [["plan", "Team planning"], ["kanban", "Team Kanban"], ["objectives", "PI objectives"]] as const;
const POINTS = [1, 2, 3, 5, 8, 13, 20];

export function TeamBoard(props: { board: Board; readOnly: boolean; onChanged: () => void; onError: (m: string) => void }) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("plan");
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="kb-tabs" role="tablist" aria-label="Team board">
        {TABS.map(([k, n]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {n}
          </button>
        ))}
      </div>
      {tab === "kanban" ? <KanbanBoard {...props} level="team" /> : tab === "plan" ? <Planning {...props} /> : <Objectives {...props} />}
    </div>
  );
}

function Planning({ board, readOnly, onChanged, onError }: { board: Board; readOnly: boolean; onChanged: () => void; onError: (m: string) => void }) {
  const [st, op] = useFrameState(board, board.frames[0]!, onChanged, onError);
  const types = KANBAN_LEVELS.team.types;
  const stories: Story[] = Array.isArray(st.items) ? (st.items as Story[]) : [];
  const caps = (st.caps && typeof st.caps === "object" ? st.caps : {}) as Record<string, number>;
  const list = (k: string): Note[] => (Array.isArray(st[k]) ? (st[k] as Note[]) : []);
  const [selId, setSel] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [type, setType] = useState("business");
  const cur = stories.find((s) => s.id === selId) ?? null;
  const inIter = (i: number) => stories.filter((s) => (s.iter ?? 0) === i + 1);
  const load = (i: number) => inIter(i).reduce((n, s) => n + (Number(s.size) || 0), 0);
  const cap = (i: number) => Number(caps[i]) || 0;
  const over = ITERS.map((_, i) => cap(i) > 0 && load(i) > cap(i));
  const update = (id: string, value: Record<string, unknown>) => op({ key: "items", op: "update", id, value });
  const add = () => {
    if (!draft.trim()) return;
    op({ key: "items", op: "push", value: { name: draft.trim(), type, state: 0, iter: 0 } });
    setDraft("");
  };
  const total = stories.filter((s) => (s.iter ?? 0) >= 1 && (s.iter ?? 0) <= 4).reduce((n, s) => n + (Number(s.size) || 0), 0), totalCap = [0, 1, 2, 3].reduce((n, i) => n + cap(i), 0);
  const bad = ITERS.filter((_, i) => over[i]);
  const backlog = stories.filter((s) => !(s.iter ?? 0));
  const card = (s: Story) => {
    const t = types[s.type] ?? types.business!;
    return (
      <button key={s.id} className="kb-card story" style={{ background: t.bg, color: t.fg }} aria-pressed={s.id === cur?.id} onClick={() => setSel(s.id)}>
        <b>{s.name}</b>
        <span className="tb-meta">
          <span>{t.name}</span>
          <span>{s.size ? `${s.size} pts` : "not sized"}</span>
        </span>
      </button>
    );
  };
  return (
    <div className="kb">
      <header className="kb-glass kb-head">
        <div className="kb-intro">
          <span className="kb-eyebrow">PI planning · team breakout</span>
          <h2 className="kb-title">{board.name}: stories against capacity</h2>
          <p>{!stories.length ? "Add the team's stories, size them, set each iteration's capacity and place the stories in an iteration." : bad.length ? `${bad.join(" and ")} ${bad.length > 1 ? "are" : "is"} over capacity. Select a story and move it to rebalance: ${total} points planned against ${totalCap} of capacity.` : `${total} points planned against ${totalCap} of capacity${totalCap ? ", every iteration within its limit" : ""}.`}</p>
        </div>
        {cur && !readOnly ? (
          <div className="kb-actions">
            <button className="kb-btn" disabled={(cur.iter ?? 0) <= 0} onClick={() => update(cur.id, { iter: (cur.iter ?? 0) - 1 })}>{(cur.iter ?? 0) === 1 ? "Back to backlog" : "Earlier iteration"}</button>
            <button className="kb-btn dark" disabled={(cur.iter ?? 0) >= 4} onClick={() => update(cur.id, { iter: (cur.iter ?? 0) + 1 })}>{(cur.iter ?? 0) === 0 ? "Plan in Iteration 1" : "Later iteration"}</button>
          </div>
        ) : null}
      </header>

      {!readOnly ? (
        <form className="kb-glass kb-add" onSubmit={(e) => (e.preventDefault(), add())}>
          <label className="sr-only" htmlFor="tb-new">New story</label>
          <input id="tb-new" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a story to the team backlog" maxLength={160} />
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Kind">
            {Object.entries(types).map(([k, t]) => (
              <option key={k} value={k}>{t.name}</option>
            ))}
          </select>
          <button className="kb-btn dark" type="submit" disabled={!draft.trim()}>Add</button>
        </form>
      ) : null}

      <div className="kb-scroll">
        <div className="tb-iters">
          {ITERS.map((name, i) => {
            const l = load(i), c = cap(i), near = !over[i] && c > 0 && l >= c * 0.85;
            return (
              <section key={name} className={`tb-iter${over[i] ? " over" : ""}`} aria-label={name}>
                <b className="tb-iter-name">{name}</b>
                <div className="tb-chips">
                  <label className="tb-chip cap">
                    capacity
                    {readOnly ? ` ${c}` : <input type="number" min={0} max={200} value={c || ""} placeholder="0" aria-label={`Capacity of ${name}`} onChange={(e) => op({ key: "caps", op: "set", value: { ...caps, [i]: Math.max(0, Math.min(200, Number(e.target.value) || 0)) } })} />}
                  </label>
                  {i < 4 ? <span className={`tb-chip${over[i] ? " over" : ""}`}>load {l}</span> : null}
                </div>
                {i < 4 ? (
                  <>
                    <div className="tb-meter" role="img" aria-label={`Load ${l} of capacity ${c}${over[i] ? ", over capacity" : ""}`}>
                      <i style={{ width: `${c ? Math.min(100, (l / c) * 100) : 0}%`, background: over[i] ? "#c2412d" : near ? "#d99400" : "#32b58c" }} />
                    </div>
                    {inIter(i).map(card)}
                  </>
                ) : (
                  <p className="kb-note" style={{ padding: 0 }}>Innovation and planning: no committed stories. Innovation, the PI system demo, Inspect &amp; Adapt and planning for the next PI.</p>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <div className="tb-zones">
        <section className="kb-glass tb-zone">
          <span className="kb-eyebrow">Team backlog · not planned yet</span>
          {backlog.length ? backlog.map(card) : <p className="kb-note" style={{ padding: 0 }}>Every story is in an iteration.</p>}
        </section>
        <NoteZone title="Features" k="features" tint="#a9c4f5" items={list("features")} op={op} readOnly={readOnly} placeholder="Add a feature this team works on" />
        <NoteZone title="Risks to ROAM" k="risks" tint="#fbcfc8" items={list("risks")} op={op} readOnly={readOnly} placeholder="Add a risk or impediment" />
        <section className="kb-glass tb-zone" aria-live="polite">
          <span className="kb-eyebrow">Selected story</span>
          {cur ? (
            <>
              {readOnly ? <b>{cur.name}</b> : <input key={cur.id + cur.name} defaultValue={cur.name} aria-label="Story" maxLength={160} onBlur={(e) => e.target.value.trim() && e.target.value !== cur.name && update(cur.id, { name: e.target.value.trim() })} />}
              {!readOnly ? (
                <div className="kb-actions">
                  <select value={cur.type} aria-label="Kind" onChange={(e) => update(cur.id, { type: e.target.value })}>
                    {Object.entries(types).map(([k, t]) => (
                      <option key={k} value={k}>{t.name}</option>
                    ))}
                  </select>
                  <select value={Number(cur.size) || 0} aria-label="Story points" onChange={(e) => update(cur.id, { size: Number(e.target.value) })}>
                    <option value={0}>not sized</option>
                    {POINTS.map((p) => (
                      <option key={p} value={p}>{p} pts</option>
                    ))}
                  </select>
                  <button className="kb-btn" onClick={() => window.confirm(`Remove "${cur.name}"?`) && (op({ key: "items", op: "remove", id: cur.id }), setSel(null))}>Remove</button>
                </div>
              ) : null}
              <p className="kb-note" style={{ padding: 0 }}>{(cur.iter ?? 0) ? ITERS[(cur.iter ?? 1) - 1] : "Team backlog"} · on the Team Kanban: {KANBAN_LEVELS.team.states[cur.state]?.name}</p>
            </>
          ) : (
            <p className="kb-note" style={{ padding: 0 }}>Select a story to size it and move it between iterations.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function NoteZone({ title, k, tint, items, op, readOnly, placeholder }: { title: string; k: string; tint: string; items: Note[]; op: ReturnType<typeof useFrameState>[1]; readOnly: boolean; placeholder: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (!draft.trim()) return;
    op({ key: k, op: "push", value: { name: draft.trim() } });
    setDraft("");
  };
  return (
    <section className="kb-glass tb-zone">
      <span className="kb-eyebrow">{title}</span>
      {items.map((x) => (
        <div key={x.id} className="tb-note" style={{ background: tint }}>
          <span>{x.name}</span>
          {!readOnly ? <button aria-label={`Remove ${x.name}`} onClick={() => op({ key: k, op: "remove", id: x.id })}>×</button> : null}
        </div>
      ))}
      {!readOnly ? (
        <form onSubmit={(e) => (e.preventDefault(), add())}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} aria-label={placeholder} maxLength={200} style={{ width: "100%" }} />
        </form>
      ) : null}
    </section>
  );
}

function Objectives({ board, readOnly, onChanged, onError }: { board: Board; readOnly: boolean; onChanged: () => void; onError: (m: string) => void }) {
  const [st, op] = useFrameState(board, board.frames[0]!, onChanged, onError);
  const all: Objective[] = Array.isArray(st.objectives) ? (st.objectives as Objective[]) : [];
  const [draft, setDraft] = useState("");
  const [plan, setPlan] = useState(5);
  const [committed, setCommitted] = useState(true);
  const planTotal = all.filter((o) => o.committed).reduce((n, o) => n + (Number(o.plan) || 0), 0);
  const actualTotal = all.reduce((n, o) => n + (Number(o.actual) || 0), 0);
  const scored = all.some((o) => typeof o.actual === "number");
  const pct = planTotal && scored ? Math.round((actualTotal / planTotal) * 100) : 0, ok = pct >= 80 && pct <= 100, C = 502.7;
  const step = (o: Objective, d: number) => op({ key: "objectives", op: "update", id: o.id, value: { actual: Math.max(0, Math.min(10, (Number(o.actual) || 0) + d)) } });
  const add = () => {
    if (!draft.trim()) return;
    op({ key: "objectives", op: "push", value: { name: draft.trim(), plan, committed } });
    setDraft("");
  };
  const row = (o: Objective) => (
    <div key={o.id} className="tb-obj">
      <span>
        {o.name}
        {!readOnly ? <button className="tb-x" aria-label={`Remove ${o.name}`} onClick={() => window.confirm(`Remove "${o.name}"?`) && op({ key: "objectives", op: "remove", id: o.id })}>×</button> : null}
      </span>
      <span className={`tb-plan${o.committed ? "" : " un"}`} aria-label={`Planned value ${o.plan}${o.committed ? "" : ", not counted in the plan total"}`}>{o.plan}</span>
      <span className="tb-act">
        <button className="tb-step" disabled={readOnly} onClick={() => step(o, -1)} aria-label={`Lower actual value of ${o.name}`}>−</button>
        <b aria-live="polite">{typeof o.actual === "number" ? o.actual : "–"}</b>
        <button className="tb-step" disabled={readOnly} onClick={() => step(o, 1)} aria-label={`Raise actual value of ${o.name}`}>+</button>
      </span>
    </div>
  );
  return (
    <div className="kb">
      <header className="kb-glass kb-head">
        <div className="kb-intro">
          <span className="kb-eyebrow">PI objectives · Inspect &amp; Adapt</span>
          <h2 className="kb-title">{board.name}: PI objectives</h2>
          <p>Business Owners set planned value at PI planning and score actual value at the system demo. Achievement is actual over planned: uncommitted objectives add to the actual, never to the plan.</p>
        </div>
      </header>
      {!readOnly ? (
        <form className="kb-glass kb-add" onSubmit={(e) => (e.preventDefault(), add())}>
          <label className="sr-only" htmlFor="tb-obj">New objective</label>
          <input id="tb-obj" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a PI objective" maxLength={200} />
          <select value={plan} onChange={(e) => setPlan(Number(e.target.value))} aria-label="Planned business value, 1 to 10">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
              <option key={v} value={v}>BV {v}</option>
            ))}
          </select>
          <select value={committed ? "c" : "u"} onChange={(e) => setCommitted(e.target.value === "c")} aria-label="Committed or uncommitted">
            <option value="c">Committed</option>
            <option value="u">Uncommitted</option>
          </select>
          <button className="kb-btn dark" type="submit" disabled={!draft.trim()}>Add</button>
        </form>
      ) : null}
      <div className="kb-row">
        <section className="kb-glass tb-sheet">
          <div className="tb-obj head">
            <b>Objectives</b>
            <span className="kb-eyebrow">BV plan</span>
            <span className="kb-eyebrow">BV actual</span>
          </div>
          {all.filter((o) => o.committed).map(row)}
          {!all.some((o) => o.committed) ? <p className="kb-note">No committed objectives yet.</p> : null}
          <b className="tb-split">Uncommitted objectives</b>
          {all.filter((o) => !o.committed).map(row)}
          <div className="tb-obj total">
            <b>Totals</b>
            <b>{planTotal}</b>
            <b>{scored ? actualTotal : "–"}</b>
          </div>
        </section>
        <aside className="kb-glass tb-ringbox">
          <span className="kb-eyebrow">% achievement</span>
          <div className="tb-ring">
            <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label={scored ? `${pct}% achievement: ${actualTotal} actual of ${planTotal} planned business value` : "Not scored yet"}>
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(23,33,43,0.08)" strokeWidth="18" />
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(50,181,140,0.35)" strokeWidth="18" strokeDasharray="100.5 502.7" strokeDashoffset="-402.2" transform="rotate(-90 100 100)" />
              <circle className="tb-ring-v" cx="100" cy="100" r="80" fill="none" stroke={ok ? "#32b58c" : pct > 100 ? "#548bca" : "#d99400"} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(pct, 100) / 100)} transform="rotate(-90 100 100)" />
            </svg>
            <div>
              <span className="tb-pct">{scored ? `${pct}%` : "–"}</span>
              <span className="kb-note" style={{ padding: 0 }}>{scored ? `${actualTotal} of ${planTotal}` : "not scored yet"}</span>
            </div>
          </div>
          {scored ? <span className="tb-verdict" style={{ background: ok ? "rgba(50,181,140,0.22)" : "rgba(217,148,0,0.22)" }}>{ok ? "Predictable: inside 80 to 100%" : pct > 100 ? "Above 100%: was the plan too cautious?" : "Below 80%: look at the commitments"}</span> : null}
          <span className="kb-note" style={{ padding: 0, textAlign: "center" }}>The green arc marks the 80 to 100% band a predictable team or train lands in.</span>
        </aside>
      </div>
    </div>
  );
}
