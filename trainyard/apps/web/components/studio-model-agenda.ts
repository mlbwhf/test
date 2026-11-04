// The agenda board of a class (the "Quick agenda" in the Welcome area): a kanban in the design's
// class mode, cut down to what a class day needs. Three fixed columns (To do, WIP, Done), one
// ticket per lesson, a count on every column and the total; no WIP limits, no policies. A ticket
// moves by drag and drop (or tap, then tap the slot) one column at a time, forward only; the
// trainer may move a ticket anywhere, to undo a slip. Where each ticket is lives in the frame's
// shared state (st:<ticket id> = column index), so tickets stay where they were put for everyone.

import type { StudioCtx } from "./studio-model";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Ticket = { id: string; t: string };
type Drag = React.DragEvent<HTMLElement>;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

/** The columns a ticket in column `i` may move to: the next one, or any other for the trainer. */
export function agendaAllowed(i: number, n: number, trainer: boolean): number[] {
  if (trainer) return Array.from({ length: n }, (_, k) => k).filter((k) => k !== i);
  return i + 1 < n ? [i + 1] : [];
}

export function agendaModel(c: StudioCtx): Record<string, any> {
  const { S, cfg, ui, setUi, trainer } = c;
  const lanes: string[] = Array.isArray(cfg.lanes) && cfg.lanes.length ? (cfg.lanes as string[]) : ["To do", "WIP", "Done"];
  const items: Ticket[] = Array.isArray(cfg.items) ? (cfg.items as Ticket[]) : [];
  const n = lanes.length;
  const last = n - 1;
  const at = (id: string) => {
    const v = Number(S[`st:${id}`] ?? 0);
    return Number.isFinite(v) ? Math.min(last, Math.max(0, Math.floor(v))) : 0;
  };
  const lift = typeof ui.lift === "string" ? (ui.lift as string) : null;
  const lifted = lift ? items.find((t) => t.id === lift) : undefined;
  const from = lifted ? at(lifted.id) : -1;
  const legal = lifted ? agendaAllowed(from, n, trainer) : [];
  const toast = (msg: string) => {
    setUi({ msg, lift: null });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setUi({ msg: null }), 2800);
  };
  const move = (id: string, to: number) => {
    if (c.readOnly) return;
    const i = at(id);
    if (to === i) return setUi({ lift: null });
    const ok = agendaAllowed(i, n, trainer);
    if (!ok.includes(to)) return toast(ok.length ? `Not allowed. From ${lanes[i]}, a ticket can only go to ${ok.map((k) => lanes[k]).join(" or ")}.` : `${lanes[i]} is the end of the line.`);
    c.op({ key: `st:${id}`, op: "set", value: to });
    setUi({ lift: null, msg: null });
  };
  const done = items.filter((t) => at(t.id) === last).length;
  const cols = lanes.map((name, i) => {
    const here = items.filter((t) => at(t.id) === i);
    const isLegal = !!lifted && legal.includes(i);
    const blocked = !!lifted && !isLegal && from !== i;
    return {
      id: `c${i}`, name, count: here.length, final: i === last, isLegal, blocked,
      over: (e: Drag) => {
        if (lifted && isLegal) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        } else e.dataTransfer.dropEffect = "none";
      },
      drop: (e: Drag) => {
        e.preventDefault();
        const id = lift || e.dataTransfer.getData("text/plain");
        if (id) move(id, i);
      },
      // Tap-to-move for touch screens: a lifted ticket lands when its slot is tapped.
      place: () => lift && move(lift, i),
      cards: here.map((t) => {
        const ok = agendaAllowed(i, n, trainer);
        const canMove = !c.readOnly && ok.length > 0;
        return {
          id: t.id, t: t.t, mine: t.id === lift, canMove, done: i === last,
          drag: (e: Drag) => {
            e.dataTransfer.setData("text/plain", t.id);
            e.dataTransfer.effectAllowed = "move";
            setTimeout(() => setUi({ lift: t.id, msg: null }), 0);
          },
          dragEnd: () => setUi({ lift: null }),
          tap: () => canMove && setUi({ lift: t.id === lift ? null : t.id, msg: null }),
        };
      }),
    };
  });
  return {
    title: c.frame.title.replace(/^[^:]+:\s*/, ""),
    modeLabel: trainer ? "KANBAN · ONE STEP AT A TIME (TRAINER: ANY COLUMN)" : "KANBAN · ONE STEP AT A TIME",
    pills: lanes.map((name, i) => ({ name, final: i === last, arrow: i < last })),
    total: items.length, done, left: items.length - done,
    msg: typeof ui.msg === "string" ? (ui.msg as string) : "",
    liftText: lifted ? `Drag “${lifted.t}” to ${legal.length ? legal.map((k) => lanes[k]).join(" or ") : "nowhere, it is finished"}` : "",
    cancel: () => setUi({ lift: null }),
    cols, readOnly: c.readOnly,
  };
}
