"use client";

// A class board, lesson by lesson: a tab for the Welcome area and each lesson (the board's
// top-level frames, top to bottom), the lesson alone on the canvas and fitted to it, and a full
// screen mode that leaves only the tabs, the zoom and the board. "Whole board" shows everything.
// A lesson's activities sit in a strip under the tabs; opening one shows its steps and reference
// material beside the canvas. One timer runs for the whole class, and the board refreshes when
// someone else changes it.

import { useEffect, useMemo, useRef, useState } from "react";
import { activityTiming, type Board, type CardType, type ClassTimer, type Frame, type SideItem } from "@trainyard/core";
import { CanvasEditor } from "@/components/canvas-editor";
import type { RefSummary } from "@/components/link-picker";
import { api, type ApiFailure } from "@/lib/api";

/** The "Whole lesson" sub-tab. */
const WHOLE = "__whole__";
const clock = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;

export function ClassBoard({
  board,
  refs,
  cardTypes,
  readOnly,
  onChanged,
  onError,
  trainer = true,
}: {
  board: Board;
  refs: Record<string, RefSummary | null>;
  cardTypes: CardType[];
  readOnly: boolean;
  onChanged: () => void;
  onError: (m: string) => void;
  /** Runs the timer and sets up activities; false for a learner on a join link. */ trainer?: boolean;
}) {
  const tabs = useMemo(() => board.frames.filter((f) => !f.parentId).sort((a, b) => a.y - b.y || a.x - b.x), [board.frames]);
  const [tab, setTab] = useState<string | null>(() => {
    if (typeof window === "undefined") return tabs[0]?.id ?? null;
    const n = /^#lesson-(\d+)/.exec(window.location.hash)?.[1];
    return (n !== undefined ? tabs[Number(n)]?.id : undefined) ?? tabs[0]?.id ?? null;
  });
  const [act, setAct] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === wrap.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  // A lesson's exercises are the frames directly in it, in reading order: a sub-tab each.
  const exercisesOf = (id: string) => board.frames.filter((f) => f.parentId === id).sort((a, b) => a.y - b.y || a.x - b.x);
  const exercises = useMemo(() => (tab ? exercisesOf(tab) : []), [board.frames, tab]); // eslint-disable-line react-hooks/exhaustive-deps
  // A lesson opens on its first exercise; "Whole lesson" shows them all.
  const current = act === WHOLE ? null : (exercises.find((f) => f.id === act) ?? exercises[0] ?? null);
  const markDone = (f: Frame) => api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/frames/${encodeURIComponent(f.id)}`, { done: !f.done }).then(onChanged, (e: ApiFailure) => onError(e.message));

  const pick = (id: string | null, activity: string | null = null) => {
    setTab(id);
    setAct(activity);
    const i = tabs.findIndex((t) => t.id === id);
    history.replaceState(null, "", i >= 0 ? `#lesson-${i}` : " ");
  };
  const toggleFull = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (wrap.current?.requestFullscreen) void wrap.current.requestFullscreen().catch(() => setFull((f) => !f));
    else setFull((f) => !f);
  };

  // ---- the class timer and live refresh ----------------------------------------------------
  const [timer, setTimer] = useState<{ t: ClassTimer; offset: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const rev = useRef<string | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    let live = true;
    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await api<{
          timer: ClassTimer | null;
          now: string;
          rev: string;
        }>("GET", `/v1/boards/${encodeURIComponent(board.id)}/timer`);
        if (!live) return;
        setTimer(r.timer ? { t: r.timer, offset: Date.parse(r.now) - Date.now() } : null);
        // Someone changed the board: fetch it, unless this person is in the middle of something.
        const typing = document.activeElement instanceof HTMLTextAreaElement || document.activeElement instanceof HTMLInputElement;
        if (rev.current && r.rev !== rev.current && !busy.current && !typing) onChanged();
        if (!busy.current && !typing) rev.current = r.rev;
      } catch {
        /* offline for a moment: try again on the next tick */
      }
    };
    void poll();
    const id = window.setInterval(() => void poll(), 3000);
    return () => {
      live = false;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id]);
  // A change made here is already on screen: take the new revision on the next poll without a refetch.
  useEffect(() => {
    rev.current = null;
  }, [board]);
  useEffect(() => {
    if (!timer?.t.endsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [timer]);
  const left = timer ? (timer.t.endsAt ? Math.min(timer.t.seconds, Math.max(0, Math.ceil((Date.parse(timer.t.endsAt) - (now + timer.offset)) / 1000))) : Math.round(timer.t.left ?? timer.t.seconds)) : 0;
  const runTimer = async (body: Record<string, unknown>) => {
    try {
      const r = await api<{ timer: ClassTimer | null; now: string }>("PUT", `/v1/boards/${encodeURIComponent(board.id)}/timer`, body);
      setTimer(r.timer ? { t: r.timer, offset: Date.parse(r.now) - Date.now() } : null);
      setNow(Date.now());
    } catch (e) {
      onError((e as ApiFailure).message);
    }
  };
  const start = (f: Frame, label: string, minutes: number) =>
    void runTimer({
      action: "start",
      label,
      seconds: minutes * 60,
      frameId: f.id,
    });
  const timerFrame = timer?.t.frameId ? board.frames.find((f) => f.id === timer.t.frameId) : undefined;
  const openTimerActivity = () => {
    if (!timerFrame) return;
    let top: Frame | undefined = timerFrame;
    while (top?.parentId) top = board.frames.find((f) => f.id === top!.parentId);
    if (top) pick(top.id, timerFrame.id);
  };

  // "Lesson 3: Facilitating PI Planning" reads "03 Facilitating PI Planning" on its tab.
  const label = (title: string) => title.replace(/^Lesson\s+(\d+)\s*[:·-]?\s*/i, (_, n: string) => `${n.padStart(2, "0")} `);
  const [sideOpen, setSideOpen] = useState(true);
  return (
    <div ref={wrap} className={`class-board${full ? " full" : ""}`} onPointerDownCapture={() => (busy.current = true)} onPointerUpCapture={() => (busy.current = false)} onPointerCancelCapture={() => (busy.current = false)}>
      <div className="class-bar">
        <div className="class-tabs" role="tablist" aria-label="Lessons">
          {tabs.map((t) => {
            const ex = exercisesOf(t.id);
            const done = ex.length > 0 && ex.every((f) => f.done);
            return (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => pick(t.id)} title={t.title}>
                {label(t.title)}
                {done ? <span className="class-done" aria-label="complete"> ✓</span> : null}
              </button>
            );
          })}
          <button role="tab" aria-selected={tab === null} onClick={() => pick(null)}>
            Whole board
          </button>
        </div>
        {timer ? (
          <span className={`class-timer${left === 0 ? " done" : ""}${timer.t.endsAt ? "" : " paused"}`} role="timer" aria-live={left === 0 ? "assertive" : "off"}>
            <button className="class-timer-label" onClick={openTimerActivity} title={timerFrame ? `Open ${timerFrame.title}` : undefined}>
              {left === 0 ? "Time's up" : `${timer.t.label} · ${clock(left)}`}
              {timer.t.endsAt || left === 0 ? "" : " (paused)"}
            </button>
            {trainer ? (
              <>
                {left > 0 ? (
                  <button
                    onClick={() =>
                      void runTimer({
                        action: timer.t.endsAt ? "pause" : "resume",
                      })
                    }
                    aria-label={timer.t.endsAt ? "Pause" : "Resume"}
                  >
                    {timer.t.endsAt ? "❚❚" : "▶"}
                  </button>
                ) : null}
                <button onClick={() => void runTimer({ action: "add", seconds: 60 })} aria-label="One more minute">
                  +1
                </button>
                <button onClick={() => void runTimer({ action: "stop" })} aria-label="Stop the timer">
                  ×
                </button>
              </>
            ) : null}
          </span>
        ) : null}
        <button className="btn small" style={{ whiteSpace: "nowrap", flex: "none" }} onClick={toggleFull} aria-pressed={full}>
          {full ? "Exit full screen" : "Full screen"}
        </button>
      </div>

      {exercises.length ? (
        <div className="class-acts" role="tablist" aria-label="Exercises in this lesson">
          {exercises.map((f) => (
            <button key={f.id} role="tab" aria-selected={current?.id === f.id} onClick={() => setAct(f.id)} className={f.done ? "done" : undefined}>
              <span>
                {f.done ? <span aria-label="complete">✓ </span> : null}
                {f.title}
              </span>
              {f.activity && activityTiming(f.activity) ? <small>{activityTiming(f.activity)}</small> : null}
            </button>
          ))}
          <button role="tab" aria-selected={!current} onClick={() => setAct(WHOLE)}>
            Whole lesson
          </button>
        </div>
      ) : null}

      {current ? (
        <div className="class-act-head">
          <div>
            {current.activity ? <span className="eyebrow">{current.activity.kind}</span> : null}
            <h3>{current.activity ? current.title.replace(new RegExp(`^${current.activity.kind}:\\s*`), "") : current.title}</h3>
          </div>
          {current.activity && activityTiming(current.activity) ? <span className="class-act-time">{activityTiming(current.activity)}</span> : null}
          {trainer ? (
            <button className={`btn small${current.done ? " primary" : ""}`} onClick={() => void markDone(current)} aria-pressed={!!current.done}>
              {current.done ? "✓ Completed" : "Mark complete"}
            </button>
          ) : current.done ? (
            <span className="chip">✓ Completed</span>
          ) : null}
          {trainer && current.activity ? (
            <span className="row" style={{ gap: 6 }}>
              {current.activity.prepare ? (
                <button className="btn small" onClick={() => start(current, current.activity!.share ? "Prepare" : current.activity!.kind, current.activity!.prepare!)}>
                  ▶ {current.activity.share ? "Prepare" : "Start"} {current.activity.prepare} min
                </button>
              ) : null}
              {current.activity.share ? (
                <button className="btn small" onClick={() => start(current, current.activity!.shareLabel ?? "Share", current.activity!.share!)}>
                  ▶ {current.activity.shareLabel ?? "Share"} {current.activity.share} min
                </button>
              ) : null}
            </span>
          ) : null}
          <span className="class-tabs-grow" />
          {current.activity ? (
            <button className="btn small ghost" onClick={() => setSideOpen((v) => !v)} aria-expanded={sideOpen}>
              {sideOpen ? "Hide steps" : "Show steps"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={current?.activity && sideOpen ? "class-act-body" : undefined}>
        <CanvasEditor board={board} refs={refs} cardTypes={cardTypes} readOnly={readOnly} onChanged={onChanged} onError={onError} focus={current?.id ?? tab} fill={full} trainer={trainer} />
        {current?.activity && sideOpen ? <ActivitySide steps={current.activity!.steps} side={current.activity!.side ?? []} /> : null}
      </div>
    </div>
  );
}

/** The steps, then the reference material: one tab per item when there are several. */
function ActivitySide({ steps, side }: { steps: string; side: SideItem[] }) {
  const [i, setI] = useState(0);
  const [zoomed, setZoomed] = useState<string | null>(null);
  const item = side[Math.min(i, side.length - 1)];
  return (
    <aside className="class-act-side panel panel-body stack" aria-label="Steps and reference">
      {steps.trim() ? (
        <ol className="class-steps">
          {steps
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .map((l, k) => {
              const m = /^(Step\s*\d+)\s*[:.]\s*(.*)$/i.exec(l);
              const sub = /^[-•*]\s*/.test(l);
              return (
                <li key={k} className={sub ? "sub" : undefined}>
                  {m ? (
                    <>
                      <b>{m[1]}:</b> {m[2]}
                    </>
                  ) : (
                    l.replace(/^[-•*]\s*/, "")
                  )}
                </li>
              );
            })}
        </ol>
      ) : null}
      {side.length > 1 ? (
        <div className="class-side-tabs" role="tablist">
          {side.map((x, k) => (
            <button key={k} role="tab" aria-selected={k === i} onClick={() => setI(k)}>
              {x.title}
              {x.instructorOnly ? " 🔒" : ""}
            </button>
          ))}
        </div>
      ) : item ? (
        <span className="eyebrow">
          {item.title}
          {item.instructorOnly ? " · trainer only" : ""}
        </span>
      ) : null}
      {item?.url ? (
        <div className="stack" style={{ gap: 6 }}>
          <iframe className="class-side-frame" src={item.url} title={item.title} sandbox="allow-scripts allow-same-origin allow-popups allow-forms" referrerPolicy="no-referrer" loading="lazy" />
          <span className="faint" style={{ fontSize: "0.76rem" }}>
            Blank? Some sites do not allow being shown inside another page.{" "}
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              Open it in a new tab ↗
            </a>
          </span>
        </div>
      ) : null}
      {item?.image ? (
        <button className="class-side-img" onClick={() => setZoomed(item.image!)} aria-label={`Enlarge ${item.title}`}>
          <img src={item.image} alt={item.title} />
        </button>
      ) : null}
      {item?.text ? <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{item.text}</p> : null}
      {zoomed ? (
        <div className="lp-backdrop" style={{ zIndex: 95, alignItems: "center", padding: 16 }} role="dialog" aria-modal="true" aria-label="Picture" onClick={() => setZoomed(null)}>
          <img
            src={zoomed}
            alt=""
            style={{
              maxWidth: "96vw",
              maxHeight: "92vh",
              borderRadius: 10,
              background: "#fff",
            }}
          />
        </div>
      ) : null}
    </aside>
  );
}
