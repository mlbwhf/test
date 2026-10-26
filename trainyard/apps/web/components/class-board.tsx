"use client";

// A class board in the Train design: Class → Lessons → Exercises.
// - Overview: the class as a train (a car per lesson, a dot per exercise) and the lessons as
//   sections listing their exercises, with "Continue" to the next unfinished one.
// - Exercise: the lesson tree on the left, the exercise's board in the centre, its steps,
//   references and the class timer on the right, Previous / Complete and next below.
// Lessons are the board's top-level frames; a lesson's exercises are the frames in it. The
// Welcome area is one exercise, shown whole. One timer runs for the whole class, and the board
// refreshes when someone else changes it.

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { activityTiming, cardChoices, type Board, type CardType, type ClassTimer, type Frame, type SideItem } from "@trainyard/core";
import { CanvasEditor } from "@/components/canvas-editor";
import { ActivityEditor } from "@/components/activity-editor";
import { ClassIcon, classShort } from "@/components/class-icon";
import type { RefSummary } from "@/components/link-picker";
import { api, type ApiFailure } from "@/lib/api";

const TINTS = ["#ffd37a", "#cde0f2", "#cfe8d4", "#f6b9ae"];
const clock = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
const isLesson = (f: Frame) => /^Lesson\s+\d+/i.test(f.title);
/** "Lesson 3: Facilitating PI Planning" → { n: "03", title: "Facilitating PI Planning" }. */
const lessonName = (f: Frame) => {
  const m = /^Lesson\s+(\d+)\s*[:·-]?\s*(.*)$/i.exec(f.title);
  return m ? { n: m[1]!.padStart(2, "0"), title: m[2] || f.title } : { n: "", title: f.title };
};
const minutesOf = (f: Frame) => (f.activity?.prepare ?? 0) + (f.activity?.share ?? 0);
const titleOf = (f: Frame) => (f.activity ? f.title.replace(new RegExp(`^${f.activity.kind}:\\s*`), "") : f.title);

type View = { at: "overview" } | { at: "exercise"; id: string } | { at: "lesson"; id: string };
const viewFromHash = (): View => {
  if (typeof window === "undefined") return { at: "overview" };
  const m = /^#(ex|lesson)-(.+)$/.exec(window.location.hash);
  return m ? { at: m[1] === "ex" ? "exercise" : "lesson", id: decodeURIComponent(m[2]!) } : { at: "overview" };
};

export function ClassBoard({ board, refs, cardTypes, readOnly, onChanged, onError, trainer = true }: { board: Board; refs: Record<string, RefSummary | null>; cardTypes: CardType[]; readOnly: boolean; onChanged: () => void; onError: (m: string) => void; /** Runs the timer, marks exercises complete and sets them up; false for a learner on a join link. */ trainer?: boolean }) {
  const lessons = useMemo(() => board.frames.filter((f) => !f.parentId).sort((a, b) => a.y - b.y || a.x - b.x), [board.frames]);
  // The Welcome area is a single exercise; a lesson's exercises are the frames directly in it.
  const exercisesOf = useMemo(() => {
    const m = new Map<string, Frame[]>();
    for (const l of lessons) m.set(l.id, isLesson(l) ? board.frames.filter((f) => f.parentId === l.id).sort((a, b) => a.y - b.y || a.x - b.x) : [l]);
    return m;
  }, [board.frames, lessons]);
  const flat = useMemo(() => lessons.flatMap((l) => (exercisesOf.get(l.id) ?? []).map((e) => ({ lesson: l, ex: e }))), [lessons, exercisesOf]);
  const done = flat.filter((x) => x.ex.done).length;
  const kindOf = (f: Frame) => {
    if (!isLesson(f) && !f.parentId) return "WELCOME";
    if (f.activity?.connectionTypes?.length) return "DIAGRAM";
    const inside = board.nodes.filter((n) => n.frameId === f.id);
    if (inside.some((n) => cardChoices(n).length)) return "CHECK";
    if (inside.some((n) => n.fields.locked && n.kind === "shape")) return "QUAD";
    return f.activity?.kind === "Discussion" ? "DISCUSS" : "BOARD";
  };

  const [view, setView] = useState<View>(viewFromHash);
  const go = (v: View) => {
    setView(v);
    history.replaceState(null, "", v.at === "overview" ? " " : `#${v.at === "exercise" ? "ex" : "lesson"}-${encodeURIComponent(v.id)}`);
    window.scrollTo({ top: 0 });
  };
  const idx = view.at === "exercise" ? flat.findIndex((x) => x.ex.id === view.id) : -1;
  const here = idx >= 0 ? flat[idx]! : null;
  const lessonHere = view.at === "lesson" ? lessons.find((l) => l.id === view.id) : here?.lesson;
  const next = flat.find((x) => !x.ex.done) ?? flat[0];

  const markDone = async (f: Frame, value = !f.done) => {
    try {
      await api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/frames/${encodeURIComponent(f.id)}`, { done: value });
      onChanged();
    } catch (e) {
      onError((e as ApiFailure).message);
    }
  };

  // ---- full screen ------------------------------------------------------------------------
  const wrap = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === wrap.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);
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
        const r = await api<{ timer: ClassTimer | null; now: string; rev: string }>("GET", `/v1/boards/${encodeURIComponent(board.id)}/timer`);
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
  const start = (f: Frame, label: string, minutes: number) => void runTimer({ action: "start", label, seconds: minutes * 60, frameId: f.id });

  const classId = board.fields?.class;
  const short = classShort(classId, board.name);
  const timerChip = timer ? (
    <span className={`class-timer${left === 0 ? " done" : ""}${timer.t.endsAt ? "" : " paused"}`} role="timer" aria-live={left === 0 ? "assertive" : "off"}>
      <button className="class-timer-label" onClick={() => timer.t.frameId && flat.some((x) => x.ex.id === timer.t.frameId) && go({ at: "exercise", id: timer.t.frameId })}>
        {left === 0 ? "Time's up" : `${timer.t.label} · ${clock(left)}`}
        {timer.t.endsAt || left === 0 ? "" : " (paused)"}
      </button>
      {trainer ? (
        <>
          {left > 0 ? (
            <button onClick={() => void runTimer({ action: timer.t.endsAt ? "pause" : "resume" })} aria-label={timer.t.endsAt ? "Pause" : "Resume"}>
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
  ) : null;

  const crumbs = (
    <nav className="train-crumbs" aria-label="Breadcrumb">
      <Link href="/classroom">Classes</Link>
      <span aria-hidden>›</span>
      {view.at === "overview" ? (
        <b>{board.name}</b>
      ) : (
        <>
          <button onClick={() => go({ at: "overview" })}>{board.name}</button>
          {lessonHere && isLesson(lessonHere) ? (
            <>
              <span aria-hidden>›</span>
              {view.at === "lesson" ? (
                <b>
                  Lesson {lessonName(lessonHere).n} · {lessonName(lessonHere).title}
                </b>
              ) : (
                <button onClick={() => go({ at: "lesson", id: lessonHere.id })}>
                  Lesson {lessonName(lessonHere).n} · {lessonName(lessonHere).title}
                </button>
              )}
            </>
          ) : null}
          {here ? (
            <>
              <span aria-hidden>›</span>
              <b>{titleOf(here.ex)}</b>
            </>
          ) : null}
        </>
      )}
      <span className="grow" />
      {timerChip}
      <button className="train-btn small" onClick={toggleFull} aria-pressed={full}>
        {full ? "Exit full screen" : "Full screen"}
      </button>
    </nav>
  );

  const pressing = { onPointerDownCapture: () => (busy.current = true), onPointerUpCapture: () => (busy.current = false), onPointerCancelCapture: () => (busy.current = false) };

  // ---- overview ---------------------------------------------------------------------------
  if (view.at === "overview")
    return (
      <div ref={wrap} className={`train${full ? " full" : ""}`} {...pressing}>
        {crumbs}
        <section className="train-hero">
          <div className="train-hero-top">
            <div>
              <span className="train-eyebrow">
                CLASS · {lessons.filter(isLesson).length} LESSONS · {flat.length} EXERCISES
              </span>
              <h2>{board.name}</h2>
              <div className="train-progress">
                <span style={{ width: `${flat.length ? (100 * done) / flat.length : 0}%` }} />
              </div>
              <span className="train-mono">
                {done}/{flat.length} done
              </span>
            </div>
            {next ? (
              <button className="train-btn primary big" onClick={() => go({ at: "exercise", id: next.ex.id })}>
                {done ? `Continue: ${titleOf(next.ex)}` : "Start the class"} ▸
              </button>
            ) : null}
          </div>
          <div className="train-cars" role="list" aria-label="Lessons">
            <div className="train-loco" role="listitem">
              <ClassIcon classId={classId} name={board.name} size={44} />
              <b>{short}</b>
            </div>
            {lessons.map((l, i) => {
              const ex = exercisesOf.get(l.id) ?? [];
              const ln = lessonName(l);
              return (
                <button key={l.id} role="listitem" className="train-car" style={{ ["--tint" as string]: TINTS[i % TINTS.length] }} onClick={() => go(ex[0] ? { at: "exercise", id: ex[0].id } : { at: "lesson", id: l.id })}>
                  <span className="train-car-title">
                    <b>{ln.n || "·"}</b> {ln.title}
                  </span>
                  <span className="train-dots">
                    {ex.map((e) => (
                      <i key={e.id} className={e.done ? "on" : undefined} title={titleOf(e)} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
        <div className="train-sections">
          {lessons.map((l, i) => (
            <LessonSection key={l.id} lesson={l} tint={TINTS[i % TINTS.length]!} exercises={exercisesOf.get(l.id) ?? []} kindOf={kindOf} current={next?.ex.id} onOpen={(id) => go({ at: "exercise", id })} onWhole={() => go({ at: "lesson", id: l.id })} add={trainer && !readOnly && isLesson(l) ? <ActivityEditor boardId={board.id} frame={l} onSaved={onChanged} onError={onError} /> : null} />
          ))}
        </div>
      </div>
    );

  // ---- exercise or whole lesson -------------------------------------------------------------
  const focus = here?.ex ?? lessonHere ?? null;
  const act = here?.ex.activity;
  const wholeExercises = view.at === "lesson" && lessonHere ? (exercisesOf.get(lessonHere.id) ?? []) : [];
  return (
    <div ref={wrap} className={`train${full ? " full" : ""}`} {...pressing}>
      {crumbs}
      <div className="train-work">
        <aside className="train-tree" aria-label="Lessons and exercises">
          <span className="train-mono">
            {done}/{flat.length} DONE
          </span>
          <div className="train-progress small">
            <span style={{ width: `${flat.length ? (100 * done) / flat.length : 0}%` }} />
          </div>
          {lessons.map((l) => {
            const ln = lessonName(l);
            const ex = exercisesOf.get(l.id) ?? [];
            return (
              <div key={l.id} className="train-tree-lesson">
                {isLesson(l) ? (
                  <button className={`train-tree-head${view.at === "lesson" && view.id === l.id ? " on" : ""}`} onClick={() => go({ at: "lesson", id: l.id })}>
                    {ln.n} {ln.title}
                  </button>
                ) : null}
                {ex.map((e) => (
                  <button key={e.id} className={`train-tree-ex${here?.ex.id === e.id ? " on" : ""}`} onClick={() => go({ at: "exercise", id: e.id })} aria-current={here?.ex.id === e.id ? "step" : undefined}>
                    <span className={`train-check${e.done ? " done" : ""}`} aria-label={e.done ? "complete" : "not complete"}>
                      {e.done ? "✓" : ""}
                    </span>
                    {titleOf(e)}
                  </button>
                ))}
              </div>
            );
          })}
        </aside>

        <main className="train-centre">
          <header className="train-ex-head">
            <div>
              <span className="train-mono">{here ? `${act?.kind ?? (isLesson(here.lesson) ? "Exercise" : "Welcome")}${act && activityTiming(act) ? ` · ${activityTiming(act)}` : ""}`.toUpperCase() : `LESSON ${lessonHere ? lessonName(lessonHere).n : ""} · WHOLE LESSON`}</span>
              <h2>{here ? titleOf(here.ex) : lessonHere ? lessonName(lessonHere).title : ""}</h2>
            </div>
            <span className="grow" />
            {trainer && here && act?.prepare ? (
              <button className="train-btn" onClick={() => start(here.ex, act.share ? "Prepare" : act.kind, act.prepare!)}>
                ▶ {act.share ? "Prepare" : "Start"} {act.prepare} min
              </button>
            ) : null}
            {trainer && here && act?.share ? (
              <button className="train-btn" onClick={() => start(here.ex, act.shareLabel ?? "Share", act.share!)}>
                ▶ {act.shareLabel ?? "Share"} {act.share} min
              </button>
            ) : null}
            {here ? (
              trainer ? (
                <button className={`train-btn${here.ex.done ? " done" : ""}`} onClick={() => void markDone(here.ex)} aria-pressed={!!here.ex.done}>
                  {here.ex.done ? "✓ Completed" : "Mark complete"}
                </button>
              ) : here.ex.done ? (
                <span className="train-chip done">✓ Completed</span>
              ) : null
            ) : null}
          </header>
          {focus ? <CanvasEditor board={board} refs={refs} cardTypes={cardTypes} readOnly={readOnly} onChanged={onChanged} onError={onError} focus={focus.id} fill={full} trainer={trainer} /> : null}
        </main>

        <aside className="train-rail" aria-label="Steps and timer">
          {timer ? (
            <div className="train-card train-timer">
              <span className="train-mono">TIMER · {timer.t.label.toUpperCase()}</span>
              <b aria-live="polite">{left === 0 ? "Time's up" : clock(left)}</b>
            </div>
          ) : null}
          {here && act ? <ActivitySide steps={act.steps} side={act.side ?? []} /> : null}
          {wholeExercises.length ? (
            <div className="train-card stack">
              <span className="train-mono">QUESTIONS IN THIS LESSON</span>
              {wholeExercises.map((e) => (
                <div key={e.id} className="train-whole-q">
                  <button onClick={() => go({ at: "exercise", id: e.id })}>
                    {e.done ? "✓ " : ""}
                    {e.title}
                  </button>
                  {e.activity && activityTiming(e.activity) ? <span className="train-mono">{activityTiming(e.activity)}</span> : null}
                  {e.activity?.steps.trim() ? <Steps text={e.activity.steps} /> : null}
                </div>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
      <footer className="train-bar">
        <button className="train-btn ghost" disabled={idx <= 0} onClick={() => idx > 0 && go({ at: "exercise", id: flat[idx - 1]!.ex.id })}>
          ‹ Previous
        </button>
        <span className="train-mono">{here ? `Exercise ${idx + 1} of ${flat.length}` : `${wholeExercises.length} exercises in this lesson`}</span>
        {here ? (
          <button
            className="train-btn primary"
            onClick={async () => {
              if (trainer && !here.ex.done) await markDone(here.ex, true);
              if (idx < flat.length - 1) go({ at: "exercise", id: flat[idx + 1]!.ex.id });
              else go({ at: "overview" });
            }}
          >
            {idx < flat.length - 1 ? (trainer ? "Complete and next ›" : "Next ›") : trainer ? "Finish class ✓" : "Back to the class"}
          </button>
        ) : wholeExercises[0] ? (
          <button className="train-btn primary" onClick={() => go({ at: "exercise", id: wholeExercises[0]!.id })}>
            Start the first exercise ›
          </button>
        ) : (
          <span />
        )}
      </footer>
    </div>
  );
}

function LessonSection({ lesson, tint, exercises, kindOf, current, onOpen, onWhole, add }: { lesson: Frame; tint: string; exercises: Frame[]; kindOf: (f: Frame) => string; current?: string | undefined; onOpen: (id: string) => void; onWhole: () => void; add: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const ln = lessonName(lesson);
  const total = exercises.reduce((n, e) => n + minutesOf(e), 0);
  return (
    <section className="train-lesson" style={{ ["--tint" as string]: tint }}>
      <header>
        <b className="train-lesson-n">{ln.n || "·"}</b>
        <button className="train-lesson-title" onClick={isLesson(lesson) ? onWhole : () => exercises[0] && onOpen(exercises[0].id)}>
          {ln.title}
        </button>
        <span className="train-mono">
          {exercises.filter((e) => e.done).length}/{exercises.length}
          {total ? ` · ${total} min` : ""}
        </span>
        <button className="train-chev" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "Collapse" : "Expand"}>
          {open ? "▾" : "▸"}
        </button>
      </header>
      {open ? (
        <div className="train-rows">
          {exercises.map((e) => (
            <button key={e.id} className={`train-row${current === e.id ? " current" : ""}`} onClick={() => onOpen(e.id)}>
              <span className={`train-check big${e.done ? " done" : ""}`}>{e.done ? "✓" : ""}</span>
              <span className="train-row-text">
                <b>{titleOf(e)}</b>
                <small>{e.activity ? `${e.activity.kind}${activityTiming(e.activity) ? ` · ${activityTiming(e.activity)}` : ""}` : isLesson(lesson) ? "Exercise" : "The whole welcome board"}</small>
              </span>
              <span className="train-kind">{kindOf(e)}</span>
              <span aria-hidden>›</span>
            </button>
          ))}
          {add ? <div className="train-add">{add}</div> : null}
        </div>
      ) : null}
    </section>
  );
}

function Steps({ text }: { text: string }) {
  return (
    <ol className="class-steps">
      {text
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

/** A class board's lessons (Welcome first) with their exercises, as the Classes library shows it. */
export function classOutline(board: Pick<Board, "frames">): { id: string; n: string; title: string; exercises: { id: string; title: string; done: boolean }[] }[] {
  return board.frames
    .filter((f) => !f.parentId)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((l) => ({ id: l.id, ...lessonName(l), exercises: (isLesson(l) ? board.frames.filter((f) => f.parentId === l.id).sort((a, b) => a.y - b.y || a.x - b.x) : [l]).map((e) => ({ id: e.id, title: titleOf(e), done: !!e.done })) }));
}
