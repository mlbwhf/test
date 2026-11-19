"use client";

// The Kanban board of every SAFe level (core kanban.ts), in the Trainyard Glass design: states with
// their WIP limits, the level's own kinds of work as cards ordered by WSJF, and the selected card's
// detail beside them. The work lives in the board's frame state, changed one op at a time, so
// several people can work the board at once. A template shows the level's examples, read-only.

import { useMemo, useState } from "react";
import { KANBAN_LEVELS, kanbanNext, kanbanWsjf, type Board, type KanbanItem, type KanbanLevel } from "@trainyard/core";
import { useFrameState } from "@/components/exercise-boards";

const SCALE = [1, 2, 3, 5, 8, 13, 20];

export function KanbanBoard({ board, level, readOnly, onChanged, onError }: { board: Board; level: KanbanLevel; readOnly: boolean; onChanged: () => void; onError: (m: string) => void }) {
  const spec = KANBAN_LEVELS[level];
  const frame = board.frames[0]!;
  const [st, op] = useFrameState(board, frame, onChanged, onError);
  const examples = useMemo<KanbanItem[]>(() => spec.examples.map((e, i) => ({ id: `ex${i}`, name: e[0], type: e[1], state: e[2], bv: e[3], tc: e[4], rr: e[5], size: e[6] })), [spec]);
  const items: KanbanItem[] = board.isTemplate ? examples : Array.isArray(st.items) ? (st.items as KanbanItem[]) : [];
  const limits = (st.wip && typeof st.wip === "object" ? st.wip : {}) as Record<string, number>;
  const wipOf = (i: number) => limits[i] ?? spec.states[i]!.wip;
  const [selId, setSel] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shake, setShake] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [draftType, setDraftType] = useState(Object.keys(spec.types)[0]!);
  const [editWip, setEditWip] = useState(false);
  const cur = items.find((x) => x.id === selId) ?? null;
  const count = (i: number) => items.filter((x) => x.state === i).length;
  const points = spec.sizing === "points";
  const rank = (x: KanbanItem) => (points ? 0 : (kanbanWsjf(x) ?? -1));
  const update = (id: string, value: Record<string, unknown>) => op({ key: "items", op: "update", id, value });

  const move = (x: KanbanItem, to: number) => {
    const lim = wipOf(to);
    if (lim && count(to) >= lim) {
      setShake(to);
      setNotice(`${spec.states[to]!.name} is at its WIP limit of ${lim}. Finish or stop ${spec.unit[0] === "epic" ? "an" : "a"} ${spec.unit[0]} there first.`);
      setTimeout(() => setShake(null), 500);
      return;
    }
    setNotice(null);
    update(x.id, { state: to });
  };
  const add = () => {
    const name = draft.trim();
    if (!name) return;
    op({ key: "items", op: "push", value: { name, type: draftType, state: 0 } });
    setDraft("");
  };
  const next = cur ? kanbanNext(spec, cur.state) : null;
  const num = (v: unknown) => (typeof v === "number" ? v : 0);

  return (
    <div className="kb">
      <header className="kb-glass kb-head">
        <div className="kb-intro">
          <span className="kb-eyebrow">{spec.eyebrow}</span>
          <h2 className="kb-title">{spec.title}</h2>
          <p>{spec.lede}</p>
        </div>
        <div className="kb-legend">
          {Object.values(spec.types).map((t) => (
            <span key={t.name}>
              <i style={{ background: t.bg }} />
              {t.name}
            </span>
          ))}
        </div>
      </header>

      {!readOnly ? (
        <form className="kb-glass kb-add" onSubmit={(e) => (e.preventDefault(), add())}>
          <label className="sr-only" htmlFor="kb-new">New {spec.unit[0]}</label>
          <input id="kb-new" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Add ${spec.unit[0] === "epic" ? "an" : "a"} ${spec.unit[0]} to ${spec.states[0]!.name}`} maxLength={160} />
          <select value={draftType} onChange={(e) => setDraftType(e.target.value)} aria-label="Kind">
            {Object.entries(spec.types).map(([k, t]) => (
              <option key={k} value={k}>{t.name}</option>
            ))}
          </select>
          <button className="kb-btn dark" type="submit" disabled={!draft.trim()}>Add</button>
          <button className="kb-btn" type="button" aria-pressed={editWip} onClick={() => setEditWip((v) => !v)}>{editWip ? "Done with WIP limits" : "Change WIP limits"}</button>
        </form>
      ) : (
        <p className="kb-note">These are examples. Create a board from this template to start with an empty {spec.name}.</p>
      )}

      <div className="kb-row">
        <section className="kb-glass kb-board" aria-label={spec.name}>
          <div className="kb-scroll">
            <div className="kb-cols" style={{ gridTemplateColumns: `repeat(${spec.states.length}, minmax(0, 1fr))`, minWidth: spec.states.length * 140 }}>
              {spec.states.map((s, i) => {
                const n = count(i), lim = wipOf(i);
                return (
                  <div key={s.name} className={`kb-col${s.build ? " build" : ""}${shake === i ? " shake" : ""}`}>
                    <div className="kb-colhead">
                      <b>{s.name}</b>
                      {editWip ? (
                        <input className="kb-wip-in" type="number" min={0} max={99} value={lim} aria-label={`WIP limit of ${s.name}, 0 for none`} onChange={(e) => op({ key: "wip", op: "set", value: { ...limits, [i]: Math.max(0, Math.min(99, Number(e.target.value) || 0)) } })} />
                      ) : (
                        <span className={`kb-wip${lim && n > lim ? " over" : lim && n === lim ? " full" : ""}`} aria-label={lim ? `${n} ${spec.unit[1]}, WIP limit ${lim}` : `${n} ${spec.unit[1]}, no WIP limit`}>
                          {lim ? `${n} / ${lim}` : n}
                        </span>
                      )}
                    </div>
                    <div className="kb-cards">
                      {items.filter((x) => x.state === i).sort((a, b) => rank(b) - rank(a)).map((x) => {
                        const t = spec.types[x.type] ?? Object.values(spec.types)[0]!, w = kanbanWsjf(x);
                        return (
                          <button key={x.id} className="kb-card" style={{ background: t.bg, color: t.fg }} aria-pressed={x.id === cur?.id} onClick={() => (setSel(x.id), setNotice(null))}>
                            <b>{x.name}</b>
                            <span>{points ? (x.size ? `${x.size} pts` : "not sized") : `WSJF ${w ?? "–"}`} · {t.name.replace(/ (epic|capability|feature|story|or expedite)$/i, "")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="kb-glass kb-side" aria-live="polite">
          {cur ? (
            <>
              <span className="kb-eyebrow">{spec.panel} · {spec.states[cur.state]?.name}</span>
              {readOnly ? <h3 className="kb-name">{cur.name}</h3> : <input key={cur.id + cur.name} className="kb-name-in" defaultValue={cur.name} aria-label="Name" maxLength={160} onBlur={(e) => e.target.value.trim() && e.target.value !== cur.name && update(cur.id, { name: e.target.value.trim() })} />}
              {!readOnly ? (
                <select value={cur.type} aria-label="Kind" onChange={(e) => update(cur.id, { type: e.target.value })}>
                  {Object.entries(spec.types).map(([k, t]) => (
                    <option key={k} value={k}>{t.name}</option>
                  ))}
                </select>
              ) : null}
              {spec.fields.map(([k, label, ph]) => (
                <label key={k} className="kb-field">
                  <b>{label}</b>
                  {readOnly ? <span>{ph}</span> : <textarea key={cur.id + k + String(cur[k] ?? "")} rows={2} defaultValue={typeof cur[k] === "string" ? (cur[k] as string) : ""} placeholder={ph} onBlur={(e) => e.target.value !== (cur[k] ?? "") && update(cur.id, { [k]: e.target.value })} />}
                </label>
              ))}
              <div className={`kb-kv${points ? " one" : ""}`} aria-label={points ? "Size" : "Weighted shortest job first"}>
                {(points ? ([["size", "Story points"]] as const) : ([["bv", "Business value"], ["tc", "Time criticality"], ["rr", "Risk reduction"], ["size", "Job size"]] as const)).map(([k, label]) => (
                  <span key={k}>
                    {readOnly ? (
                      <b>{num(cur[k]) || "–"}</b>
                    ) : (
                      <select value={num(cur[k])} aria-label={label} onChange={(e) => update(cur.id, { [k]: Number(e.target.value) })}>
                        <option value={0}>–</option>
                        {SCALE.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    )}
                    {label}
                  </span>
                ))}
                {points ? null : (
                  <span className="wsjf">
                    <b>{kanbanWsjf(cur) ?? "–"}</b>WSJF
                  </span>
                )}
              </div>
              {notice ? <div className="kb-notice" role="status">{notice}</div> : null}
              {!readOnly ? (
                <div className="kb-actions">
                  {level === "portfolio" && cur.state === 4 ? (
                    <>
                      <button className="kb-btn dark" onClick={() => move(cur, 5)}>Persevere</button>
                      <button className="kb-btn" onClick={() => move(cur, 2)}>Pivot back to analysis</button>
                    </>
                  ) : null}
                  {next !== null ? <button className="kb-btn dark" onClick={() => move(cur, next)}>Move to {spec.states[next]!.name}</button> : null}
                  {cur.state > 0 && !(level === "portfolio" && cur.state === 4) ? <button className="kb-btn" onClick={() => move(cur, cur.state - 1)}>Back to {spec.states[cur.state - 1]!.name}</button> : null}
                  <button className="kb-btn" onClick={() => window.confirm(`Remove "${cur.name}"?`) && (op({ key: "items", op: "remove", id: cur.id }), setSel(null))}>Remove</button>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <span className="kb-eyebrow">{spec.panel}</span>
              <p className="kb-note">{items.length ? `Select ${spec.unit[0] === "epic" ? "an" : "a"} ${spec.unit[0]} to read it and move it on.` : `Nothing on the board yet. Add the first ${spec.unit[0]} above; it starts in ${spec.states[0]!.name}.`}</p>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
