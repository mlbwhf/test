"use client";

// The outcome-driven roadmap (Leading SAFe 4-10 "An example of an outcome-driven roadmap"):
// ART outcomes in rows, PIs in columns, milestones, releases and outcome checkpoints positioned
// across the PIs. Features do not appear, and that is deliberate. It is another view of the same
// roadmap document the timeline and the PI plan read.

import { Fragment } from "react";

export type OutcomeKind = "moonshot" | "roofshot";
export type Outcome = { id: string; title: string; kind: OutcomeKind; desc: string };
export type MarkKind = "milestone" | "release" | "outcome";
export type Mark = { id: string; title: string; at: number; release: boolean; kind?: MarkKind; out?: string; pos?: number };

export const markKind = (m: Mark): MarkKind => m.kind ?? (m.release ? "release" : "milestone");
export const KIND_LABEL: Record<MarkKind, string> = { milestone: "Milestone", release: "Release", outcome: "Outcome" };
export const OUTCOME_KIND_LABEL: Record<OutcomeKind, string> = { moonshot: "Moonshot", roofshot: "Roofshot" };

export const FACILITATOR = {
  key: "This example shows what an outcome-driven roadmap looks like in practice: outcomes in rows, with milestones and releases positioned across the PIs.",
  guidance: [
    "Describe the structure. Each row is an ART outcome, with an additional row for commitments that do not belong to any outcome.",
    "Point out what is on the roadmap and what is not. Milestones, releases, and outcomes appear. Features do not.",
    "Explain the three elements. Milestones are fixed points that hold even when the surrounding work changes. Releases are where teams coordinate go-to-market activity. Outcomes describe the effect the releases are intended to produce.",
    "Mention that the same underlying data can produce different views. A longer-term roadmap for the portfolio, or a shorter one for a team, is a different view of the same information.",
  ],
  say: [
    "Each row here is an ART outcome. There is also a row for commitments that do not belong to any single outcome, those will exist too.",
    "Notice what is on this roadmap and what is missing. You can see milestones, releases, and outcomes. You cannot see a list of features, and that is deliberate.",
    "Milestones give you fixed points even when the surrounding work is flexible. Releases are where you coordinate go-to-market activity. And the outcomes tell you what those releases are supposed to achieve.",
  ],
  notes: "If the organization manages the data behind its product development well, producing a portfolio view, an ART view, and a team view becomes a matter of presenting the same data differently rather than maintaining three roadmaps.",
};

const INK = "#14123a", GREY = "#8a8a99", TEAL = "#3f8f8a";
const mono = "700 12px ui-monospace,Menlo,monospace";

function Icon({ kind, size = 30 }: { kind: MarkKind; size?: number }) {
  if (kind === "milestone") return <i style={{ width: size * 0.72, height: size * 0.72, background: GREY, border: `2px solid ${INK}`, transform: "rotate(45deg)", display: "block", borderRadius: 3 }} />;
  if (kind === "release")
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <path d="M4 11 16 5l12 6v13l-12 6-12-6z" fill="#e5c06a" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <path d="M4 11l12 6 12-6M16 17v13" fill="none" stroke={INK} strokeWidth="2" />
        <path d="M10 8l12 6v5l-3-1.5v-4.5L8 8.9z" fill="#2f8f7a" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <circle cx="16" cy="16" r="14" fill="#fff" stroke={TEAL} strokeWidth="2.5" />
      <circle cx="16" cy="16" r="9" fill="none" stroke={TEAL} strokeWidth="2.5" />
      <path d="M11.5 16.5l3 3 6-6.5" fill="none" stroke={TEAL} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type OutcomeRoadmapProps = {
  outcomes: Outcome[];
  marks: Mark[];
  from: number;
  count: number;
  max: number;
  sel: { k: "m" | "o"; id: string } | null;
  arm: MarkKind;
  setArm: (k: MarkKind) => void;
  prev: () => void;
  next: () => void;
  pick: (sel: { k: "m" | "o"; id: string } | null) => void;
  addMark: (out: string, at: number, pos: number) => void;
  updMark: (id: string, patch: Partial<Mark>) => void;
  delMark: (id: string) => void;
  addOutcome: () => void;
  updOutcome: (id: string, patch: Partial<Outcome>) => void;
  delOutcome: (id: string) => void;
};

const field = { border: `2px solid ${INK}`, borderRadius: 12, padding: "10px 12px", fontSize: 15, background: "#fff", font: "inherit" } as React.CSSProperties;
const lab = { display: "flex", flexDirection: "column", gap: 6, font: mono, color: "#5b5b6e" } as React.CSSProperties;
const btn = (on: boolean, bg = INK): React.CSSProperties => ({ border: `2px solid ${INK}`, borderRadius: 10, padding: "0 12px", height: 38, fontWeight: 700, cursor: "pointer", background: on ? bg : "#fff", color: on ? "#fff" : INK, font: "inherit", fontSize: 14 });
const round: React.CSSProperties = { width: 38, height: 38, borderRadius: "50%", border: `2px solid ${INK}`, background: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 16 };

export function OutcomeRoadmap(p: OutcomeRoadmapProps) {
  const { from, count: N } = p;
  const pis = Array.from({ length: N }, (_, k) => from + k);
  const rows: { id: string; head: React.ReactNode; line: boolean; bg: string; sel: boolean }[] = [
    ...p.outcomes.map((o) => ({
      id: o.id, line: true, bg: "#fff", sel: p.sel?.k === "o" && p.sel.id === o.id,
      head: (<><b style={{ display: "block", fontSize: 16 }}>{OUTCOME_KIND_LABEL[o.kind]}</b><span style={{ fontSize: 15, lineHeight: 1.35, color: "#2b2a4a" }}>{o.title}</span></>),
    })),
    { id: "", line: false, bg: "#f1f0ee", sel: false, head: <span style={{ fontSize: 16, fontWeight: 600 }}>Additional Commitments</span> },
  ];
  const x = (m: Mark) => ((m.at - from + (m.pos ?? 0.5)) / N) * 100;
  const inWin = (m: Mark) => m.at >= from && m.at < from + N;
  const grid = `repeating-linear-gradient(90deg, transparent 0, transparent calc(${100 / N}% - 1px), #d8d5cc calc(${100 / N}% - 1px), #d8d5cc ${100 / N}%)`;
  const selM = p.sel?.k === "m" ? p.marks.find((m) => m.id === p.sel!.id) : undefined;
  const selO = p.sel?.k === "o" ? p.outcomes.find((o) => o.id === p.sel!.id) : undefined;
  const onTrack = (e: React.MouseEvent<HTMLDivElement>, out: string) => {
    if (e.target !== e.currentTarget) return;
    const r = e.currentTarget.getBoundingClientRect(), f = ((e.clientX - r.left) / r.width) * N;
    const at = Math.floor(f) + from, pos = Math.round((f - Math.floor(f)) * 10) / 10;
    p.addMark(out, Math.max(1, Math.min(p.max, at)), Math.max(0.1, Math.min(0.9, pos)));
  };
  const card: React.CSSProperties = { background: "#fff", border: `2px solid ${INK}`, borderRadius: 24, boxShadow: `8px 8px 0 ${INK}` };
  return (
    <section style={{ margin: "18px 5vw 0", display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", background: "#fff", border: `2px solid ${INK}`, borderRadius: 99, padding: 4 }}>
          <span style={{ font: mono, color: "#5b5b6e", padding: "0 8px 0 12px" }}>CLICK A CELL TO ADD</span>
          {(["milestone", "release", "outcome"] as MarkKind[]).map((k) => (
            <button key={k} onClick={() => p.setArm(k)} style={{ ...btn(p.arm === k), height: 34, border: 0, borderRadius: 99, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "grid", placeItems: "center", width: 22, height: 22 }}><Icon kind={k} size={20} /></span>{KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={p.prev} style={round} aria-label="Earlier PIs">‹</button>
          <span style={{ font: "700 14px ui-monospace,Menlo,monospace" }}>PI {from}–{from + N - 1}</span>
          <button onClick={p.next} style={round} aria-label="Later PIs">›</button>
        </div>
        <button onClick={p.addOutcome} style={{ ...btn(true, "#ffe14d"), color: INK, marginLeft: "auto", borderRadius: 99 }}>+ Add an ART outcome</button>
      </div>

      <div style={{ display: "flex", gap: 22, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 640px", minWidth: 0, display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ ...card, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 300px) 1fr" }}>
              <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: `2px solid ${INK}` }}>
                <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden><circle cx="14" cy="18" r="11" fill="#fff" stroke={TEAL} strokeWidth="2.5" /><circle cx="14" cy="18" r="6" fill="none" stroke={TEAL} strokeWidth="2.5" /><circle cx="14" cy="18" r="1.8" fill={TEAL} /><path d="M14 18L27 5M27 5h-5M27 5v5" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" /></svg>
                <b style={{ fontSize: 17 }}>ART Outcomes</b>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${N}, 1fr)`, borderBottom: `2px solid ${INK}`, background: "#dde8ea" }}>
                {pis.map((n) => <div key={n} style={{ padding: "16px 0", textAlign: "center", fontWeight: 800, fontSize: 16, borderLeft: "1px solid #c9d2d4" }}>PI {n}</div>)}
              </div>
              {rows.map((r) => {
                const ms = p.marks.filter((m) => (m.out ?? "") === r.id && inWin(m)).sort((a, b) => x(a) - x(b));
                const x0 = ms.length ? x(ms[0]!) : 0, x1 = ms.length ? Math.min(100, x(ms[ms.length - 1]!) + 60 / N) : 0;
                return (
                  <Fragment key={r.id || "extra"}>
                    <div onClick={() => (r.id ? p.pick({ k: "o", id: r.id }) : p.pick(null))} style={{ padding: "18px 18px", background: r.bg, borderBottom: "1px solid #d8d5cc", cursor: r.id ? "pointer" : "default", outline: r.sel ? "3px solid #ff3d8f" : "none", outlineOffset: -3, display: "flex", flexDirection: "column", justifyContent: "center", gap: 4 }}>
                      {r.head}
                    </div>
                    <div data-otrack onClick={(e) => onTrack(e, r.id)} title="Click to add here" style={{ position: "relative", minHeight: 120, background: `${grid}, ${r.bg}`, borderBottom: "1px solid #d8d5cc", cursor: "copy" }}>
                      {r.line && ms.length ? (
                        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} preserveAspectRatio="none" viewBox="0 0 100 100">
                          <line x1={x0} y1="50" x2={x1} y2="50" stroke="#aaa9b3" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                        </svg>
                      ) : null}
                      {r.line && ms.length ? <span style={{ position: "absolute", left: `calc(${x1}% - 6px)`, top: "50%", transform: "translateY(-50%)", color: "#aaa9b3", fontSize: 18, pointerEvents: "none" }}>▸</span> : null}
                      {ms.map((m) => {
                        const k = markKind(m), on = selM?.id === m.id;
                        return (
                          <button key={m.id} onClick={(e) => { e.stopPropagation(); p.pick({ k: "m", id: m.id }); }} title={`${KIND_LABEL[k]} · ${m.title}`} style={{ position: "absolute", left: `${x(m)}%`, top: "50%", transform: "translate(-50%,-50%)", width: 44, height: 44, display: "grid", placeItems: "center", border: 0, background: r.bg, borderRadius: "50%", cursor: "pointer", outline: on ? "3px solid #ff3d8f" : "none", padding: 0 }}>
                            <Icon kind={k} size={34} />
                          </button>
                        );
                      })}
                    </div>
                  </Fragment>
                );
              })}
            </div>
            <div style={{ padding: "12px 18px", display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center", font: "600 13px 'Instrument Sans',sans-serif", background: "#fbf9f4" }}>
              <span style={{ font: mono, color: "#5b5b6e" }}>ON THIS ROADMAP</span>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon kind="milestone" size={22} /> Milestone · a fixed point that holds even when the surrounding work changes</span>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon kind="release" size={22} /> Release · where teams coordinate go-to-market activity</span>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}><Icon kind="outcome" size={22} /> Outcome · the effect the releases are intended to produce</span>
              <span style={{ marginLeft: "auto", font: mono, color: "#c8372d" }}>NOT ON IT · FEATURES</span>
            </div>
          </div>

          <div style={{ ...card, padding: "18px 20px", display: "flex", gap: 18, flexWrap: "wrap", alignItems: "flex-end", minHeight: 84 }}>
            {selM ? (
              <>
                <label style={{ ...lab, flex: "2 1 240px" }}>TITLE<input value={selM.title} onChange={(e) => p.updMark(selM.id, { title: e.target.value })} style={field} /></label>
                <div style={lab}>KIND<div style={{ display: "flex", gap: 6 }}>{(["milestone", "release", "outcome"] as MarkKind[]).map((k) => <button key={k} onClick={() => p.updMark(selM.id, { kind: k, release: k === "release" })} style={btn(markKind(selM) === k)}>{KIND_LABEL[k]}</button>)}</div></div>
                <label style={lab}>ROW<select value={selM.out ?? ""} onChange={(e) => p.updMark(selM.id, { out: e.target.value })} style={field}>{p.outcomes.map((o) => <option key={o.id} value={o.id}>{OUTCOME_KIND_LABEL[o.kind]} · {o.title}</option>)}<option value="">Additional Commitments</option></select></label>
                <div style={lab}>PI<div style={{ display: "flex", alignItems: "center", gap: 8 }}><button onClick={() => p.updMark(selM.id, { at: Math.max(1, selM.at - 1) })} style={round}>‹</button><b style={{ fontSize: 18, minWidth: 24, textAlign: "center" }}>{selM.at}</b><button onClick={() => p.updMark(selM.id, { at: Math.min(p.max, selM.at + 1) })} style={round}>›</button></div></div>
                <div style={lab}>WITHIN THE PI<div style={{ display: "flex", alignItems: "center", gap: 8 }}><button onClick={() => p.updMark(selM.id, { pos: Math.max(0.1, Math.round(((selM.pos ?? 0.5) - 0.1) * 10) / 10) })} style={round}>‹</button><b style={{ fontSize: 14, minWidth: 48, textAlign: "center" }}>{Math.round((selM.pos ?? 0.5) * 100)}%</b><button onClick={() => p.updMark(selM.id, { pos: Math.min(0.9, Math.round(((selM.pos ?? 0.5) + 0.1) * 10) / 10) })} style={round}>›</button></div></div>
                <button onClick={() => p.delMark(selM.id)} style={{ ...btn(true, "#ff9fc6"), color: INK }}>Delete</button>
              </>
            ) : selO ? (
              <>
                <label style={{ ...lab, flex: "2 1 260px" }}>ART OUTCOME<input value={selO.title} onChange={(e) => p.updOutcome(selO.id, { title: e.target.value })} style={field} /></label>
                <div style={lab}>AMBITION<div style={{ display: "flex", gap: 6 }}>{(["moonshot", "roofshot"] as OutcomeKind[]).map((k) => <button key={k} onClick={() => p.updOutcome(selO.id, { kind: k })} style={btn(selO.kind === k)}>{OUTCOME_KIND_LABEL[k]}</button>)}</div></div>
                <label style={{ ...lab, flex: "2 1 240px" }}>NOTE<input value={selO.desc} onChange={(e) => p.updOutcome(selO.id, { desc: e.target.value })} placeholder="Why this outcome, for whom" style={field} /></label>
                <button onClick={() => p.delOutcome(selO.id)} style={{ ...btn(true, "#ff9fc6"), color: INK }}>Delete row</button>
              </>
            ) : (
              <div style={{ color: "#5b5b6e", fontSize: 15, lineHeight: 1.5 }}>Pick what to add, then click a cell: a milestone, a release or an outcome checkpoint lands in that row and PI. Click a row header to rename the outcome or change its ambition. Features never appear here, by design.</div>
            )}
          </div>
        </div>

        <aside style={{ ...card, flex: "1 1 300px", maxWidth: 420, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ font: mono, color: "#4a5fe8" }}>EXPLAIN IT · FACILITATOR GUIDANCE</div>
          <div style={{ background: "#fff4c2", border: `2px solid ${INK}`, borderRadius: 14, padding: "12px 14px", fontSize: 15, lineHeight: 1.45 }}><b>Key message.</b> {FACILITATOR.key}</div>
          <div>
            <div style={{ font: mono, color: "#5b5b6e", marginBottom: 6 }}>FACILITATOR GUIDANCE</div>
            <ol style={{ margin: 0, paddingLeft: 20, fontSize: 14.5, lineHeight: 1.45, display: "flex", flexDirection: "column", gap: 6 }}>{FACILITATOR.guidance.map((g, i) => <li key={i}>{g}</li>)}</ol>
          </div>
          <div>
            <div style={{ font: mono, color: "#5b5b6e", marginBottom: 6 }}>TALKING POINTS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{FACILITATOR.say.map((t, i) => <div key={i} style={{ borderLeft: `4px solid ${TEAL}`, padding: "4px 10px", fontSize: 14.5, lineHeight: 1.45, fontStyle: "italic" }}>Say: “{t}”</div>)}</div>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.45, color: "#3a3858", borderTop: "1px solid #d8d5cc", paddingTop: 10 }}><b>Notes.</b> {FACILITATOR.notes}</div>
        </aside>
      </div>
    </section>
  );
}
