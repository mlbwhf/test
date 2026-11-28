"use client";

// Interactive components: the purpose-built boards of the classes (hexagon canvas, story map,
// WSJF backlog, balanced metrics, discussion boards…) as items anyone can add to a board or a
// template of their own, one or several. A component is a frame that carries an activity; a
// connected set is several frames that keep their work in one place (config.shared), so what is
// typed in one step is calculated and shown in the next.

import { useMemo, useState } from "react";
import { ASPC_COURSE, POPM_COURSE, TRANSFORMATION_CANVAS_EXAMPLE, TRANSFORMATION_CANVAS_QUESTIONS, ASPC_INDICATORS, type Activity, type Board, type Frame } from "@trainyard/core";
import { api, type ApiFailure } from "@/lib/api";
import { ExerciseBoard, useFrameState } from "@/components/exercise-boards";

type Part = { title: string; board: string; config: Record<string, unknown> };
export type BoardComponent = { id: string; name: string; blurb: string; group: string; icon: string; logic?: string; parts: Part[] };

const specs = [...ASPC_COURSE, ...POPM_COURSE].flatMap((l) => l.activities);
/** The setup a class exercise uses, taken from the class so the component is the very same board. */
const from = (board: string, pick: (c: Record<string, unknown>) => boolean = () => true) => ({ ...(specs.find((a) => a.board === board && pick(a.config ?? {}))?.config ?? {}) });
const without = (c: Record<string, unknown>, ...keys: string[]) => Object.fromEntries(Object.entries(c).filter(([k]) => !keys.includes(k)));
const DISCUSS = { look: "pipeline", pipeNote: "A stop fills in as the group answers it.", kinds: [], add: "+ add, Enter", shareLabel: "What stands out" };

export const BOARD_COMPONENTS: BoardComponent[] = [
  { id: "discussion", name: "Discussion board", group: "Discuss", icon: "💬", blurb: "Your own questions, each with a lane of notes; a track fills in as the group answers them.", parts: [{ title: "Discussion", board: "po-ai", config: { ...DISCUSS, prompt: "Discuss the following as a group.", lenses: [["Question 1", "What is working well?"], ["Question 2", "What is getting in the way?"], ["Question 3", "What will we try next?"]] } }] },
  { id: "hexagon", name: "Hexagon canvas", group: "Map", icon: "⬡", blurb: "One idea per hexagon on a honeycomb; sides that touch are connections the group explains.", logic: "Counts connections and finds the most connected idea", parts: [{ title: "Hexagon canvas", board: "as-hex", config: { prompt: "One idea, challenge or fact per hexagon. Put the ones that belong together side by side, and write why for the connections that matter.", steps: ["Identify connections", "Arrange and rearrange", "Create your final hexagon diagram"] } }] },
  { id: "story-map", name: "Story map", group: "Map", icon: "🗺", blurb: "The user's activities across the top, the stories under each, in two priority bands.", logic: "The essential stories line up as the team backlog", parts: [{ title: "Story map", board: "po-map", config: {} }] },
  { id: "wsjf", name: "Backlog, WSJF and roadmap", group: "Prioritise", icon: "⚖", blurb: "Three connected boards: brainstorm the backlog, score it, and lay it out over three PIs.", logic: "WSJF is calculated from your scores; the roadmap is ordered by it", parts: [
    { title: "1 · Build the backlog", board: "as-backlog", config: { ...without(from("as-backlog", (c) => c.step === "storm"), "shared"), prompt: "Brainstorm the items of your backlog: features or epics." } },
    { title: "2 · Prioritise with WSJF", board: "as-backlog", config: { ...without(from("as-backlog", (c) => c.step === "wsjf"), "shared"), prompt: "Score each item: the WSJF is calculated for you." } },
    { title: "3 · Draft the roadmap", board: "as-backlog", config: { ...without(from("as-backlog", (c) => c.step === "roadmap"), "shared"), prompt: "Place the prioritised items on the roadmap." } },
  ] },
  { id: "metrics", name: "Balanced set of metrics", group: "Measure", icon: "📊", blurb: "Pick decisions level by level, then give each a domain, a metric and a complementary metric.", logic: "Weighs the set across Outcomes, Flow and Competency", parts: [{ title: "Balanced set of metrics", board: "as-balance", config: from("as-balance") }] },
  { id: "capacity", name: "Capacity allocation", group: "Measure", icon: "◔", blurb: "A pie of where capacity goes; change one share and the others follow.", logic: "Shares always add up to 100%", parts: [{ title: "Capacity allocation", board: "po-cap", config: {} }] },
  { id: "canvas-story", name: "Transformation canvas and story", group: "Strategy", icon: "🧭", blurb: "Two connected boards: align transformation and business objectives, then turn them into a story.", logic: "The story's suggestions and draft are drawn from the canvas", parts: [
    { title: "1 · Transformation canvas", board: "as-canvas", config: { focus: "all", reference: ASPC_INDICATORS, questions: TRANSFORMATION_CANVAS_QUESTIONS, example: TRANSFORMATION_CANVAS_EXAMPLE, prompt: "Align your transformation objective with the business objective it serves." } },
    { title: "2 · Tell the story", board: "as-story", config: { prompt: "Turn your strategy into a story for one audience." } },
  ] },
];

const nameOf = (f: Frame) => BOARD_COMPONENTS.find((c) => c.parts.some((p) => p.board === f.activity?.board))?.name ?? "Interactive component";
export const isComponent = (f: Frame) => f.activity?.kind === "Component" && !!f.activity.board;
export const componentLabel = nameOf;
/** The other parts of the connected set a component belongs to. */
export const connectedTo = (board: Board, f: Frame) => { const k = f.activity?.config?.shared; return k ? board.frames.filter((x) => x.id !== f.id && x.activity?.config?.shared === k) : []; };

/** Adds a component (all its parts) to the right of what the board already holds. */
export async function addComponent(board: Board, c: BoardComponent): Promise<void> {
  const right = Math.max(0, ...board.frames.map((f) => f.x + f.width), ...board.nodes.map((n) => n.x + (n.width ?? 180)));
  const top = board.frames.length || board.nodes.length ? Math.min(...board.frames.map((f) => f.y), ...board.nodes.map((n) => n.y)) : 0;
  const shared = c.parts.length > 1 ? `cmp-${Date.now().toString(36)}` : undefined;
  for (const [i, p] of c.parts.entries()) {
    const r = await api<{ frame: Frame }>("POST", `/v1/boards/${encodeURIComponent(board.id)}/frames`, { title: p.title, x: right + (right ? 120 : 0) + i * 600, y: top, width: 540, height: 320 });
    const activity: Activity = { kind: "Component", steps: "", board: p.board, config: { ...p.config, ...(shared ? { shared } : {}) } };
    await api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/frames/${encodeURIComponent(r.frame.id)}`, { activity });
  }
}

export function ComponentPicker({ onPick, onClose, busy }: { onPick: (c: BoardComponent) => void; onClose: () => void; busy: boolean }) {
  const groups = [...new Set(BOARD_COMPONENTS.map((c) => c.group))];
  return (
    <div className="cmp-veil" role="dialog" aria-modal="true" aria-label="Add an interactive component" onClick={onClose}>
      <div className="cmp-dialog" onClick={(e) => e.stopPropagation()}>
        <header><div><span className="ex-mono">Interactive components</span><h2>Add a working board to this board</h2><p>Each one is a live tool, not a picture: add as many as you need, then save the board as a template.</p></div><button className="btn small" onClick={onClose}>Close</button></header>
        {groups.map((g) => (
          <section key={g}>
            <span className="ex-mono">{g}</span>
            <div className="cmp-grid">
              {BOARD_COMPONENTS.filter((c) => c.group === g).map((c) => (
                <button key={c.id} className="cmp-card" disabled={busy} onClick={() => onPick(c)}>
                  <i aria-hidden>{c.icon}</i>
                  <b>{c.name}</b>
                  <span>{c.blurb}</span>
                  {c.parts.length > 1 ? <em>{c.parts.length} connected boards</em> : null}
                  {c.logic ? <small>⚙ {c.logic}</small> : null}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** A component opened to work in: the live board, its settings, and the way to its connected boards. */
export function ComponentOverlay({ board, frame, readOnly, onOpen, onClose, onChanged, onError }: { board: Board; frame: Frame; readOnly: boolean; onOpen: (id: string) => void; onClose: () => void; onChanged: () => void; onError: (m: string) => void }) {
  const [settings, setSettings] = useState(false);
  const shared = frame.activity?.config?.shared;
  const set = useMemo(() => (shared ? board.frames.filter((f) => f.activity?.config?.shared === shared) : [frame]), [board.frames, shared, frame]);
  const home = set[0] ?? frame;
  return (
    <div className="cmp-veil" role="dialog" aria-modal="true" aria-label={frame.title}>
      <div className="cmp-sheet">
        <header className="cmp-bar">
          <div><span className="ex-mono">{nameOf(frame)}{set.length > 1 ? " · connected boards share their work" : ""}</span><h2>{frame.title}</h2></div>
          {set.length > 1 ? <div className="tabs" role="tablist" aria-label="Connected boards">{set.map((f) => (<button key={f.id} role="tab" aria-selected={f.id === frame.id} aria-pressed={f.id === frame.id} onClick={() => onOpen(f.id)}>{f.title}</button>))}</div> : null}
          <span style={{ flex: 1 }} />
          {!readOnly ? <button className="btn small" aria-pressed={settings} onClick={() => setSettings(!settings)}>Settings</button> : null}
          <button className="btn small primary" onClick={onClose}>Back to the board</button>
        </header>
        {settings && !readOnly ? <ComponentSettings key={frame.id} board={board} frame={frame} onChanged={onChanged} onError={onError} onDone={() => setSettings(false)} /> : null}
        <div className="cmp-body classroom"><Live key={`${home.id}:${frame.id}`} board={board} home={home} frame={frame} readOnly={readOnly} onChanged={onChanged} onError={onError} /></div>
      </div>
    </div>
  );
}

function Live({ board, home, frame, readOnly, onChanged, onError }: { board: Board; home: Frame; frame: Frame; readOnly: boolean; onChanged: () => void; onError: (m: string) => void }) {
  const [st, op] = useFrameState(board, home, onChanged, onError);
  return <ExerciseBoard kind={frame.activity!.board!} board={board} frame={frame} config={frame.activity?.config ?? {}} st={st} op={op} readOnly={readOnly} trainer team={null} />;
}

/** What the owner of the board can change about a component without code: its name, its instruction and, for a discussion, its questions. */
function ComponentSettings({ board, frame, onChanged, onError, onDone }: { board: Board; frame: Frame; onChanged: () => void; onError: (m: string) => void; onDone: () => void }) {
  const cfg = frame.activity?.config ?? {};
  const lenses = Array.isArray(cfg.lenses) ? (cfg.lenses as [string, string][]) : null;
  const [title, setTitle] = useState(frame.title), [prompt, setPrompt] = useState(typeof cfg.prompt === "string" ? cfg.prompt : "");
  const [qs, setQs] = useState(lenses ? lenses.map((l) => l[1]).join("\n") : "");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const lines = qs.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 6);
      const config = { ...cfg, ...(prompt.trim() ? { prompt: prompt.trim() } : {}), ...(lenses && lines.length ? { lenses: lines.map((q, i) => [lenses[i]?.[1] === q ? lenses[i]![0] : `Question ${i + 1}`, q]) } : {}) };
      await api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/frames/${encodeURIComponent(frame.id)}`, { title: title.trim() || frame.title, activity: { ...frame.activity, config } });
      onChanged();
      onDone();
    } catch (e) { onError((e as ApiFailure).message); }
    setBusy(false);
  };
  return (
    <section className="cmp-settings">
      <label><span className="ex-mono">Name</span><input className="input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></label>
      <label><span className="ex-mono">Instruction shown at the top</span><textarea className="input" rows={2} value={prompt} onChange={(e) => setPrompt(e.target.value)} /></label>
      {lenses ? <label><span className="ex-mono">Questions · one per line, up to six</span><textarea className="input" rows={5} value={qs} onChange={(e) => setQs(e.target.value)} /></label> : null}
      <div className="row" style={{ gap: 8 }}><button className="btn primary small" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save settings"}</button><button className="btn small" onClick={onDone}>Cancel</button></div>
    </section>
  );
}
