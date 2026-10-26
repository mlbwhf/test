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
import { BadgeRing, ClassIcon, classShort } from "@/components/class-icon";
import type { RefSummary } from "@/components/link-picker";
import { api, type ApiFailure } from "@/lib/api";
import { ExerciseBoard, useFrameState } from "@/components/exercise-boards";

const TINTS = ["#ffd37a", "#cde0f2", "#cfe8d4", "#f6b9ae", "#d9cdf0", "#f0d9a8", "#d6e6c3", "#e6d3f0"];
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

  const [stepsOn, setStepsOn] = useState(false);
  const [focusOn, setFocusOn] = useState(false);
  const [palOpen, setPalOpen] = useState(false);
  const [palQ, setPalQ] = useState("");
  const [stepI, setStepI] = useState(0);
  const pillsRef = useRef<HTMLDivElement>(null);
  const exId = view.at === "exercise" ? view.id : null;
  // A new exercise starts at its first step, with the steps panel closed and its tab in view.
  useEffect(() => {
    setStepI(0);
    setStepsOn(false);
    pillsRef.current?.querySelector('[data-on="1"]')?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [exId]);
  useEffect(() => {
    if (view.at === "overview") return;
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") return e.preventDefault(), setPalOpen(true), setPalQ("");
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") return palOpen ? setPalOpen(false) : stepsOn ? setStepsOn(false) : focusOn ? setFocusOn(false) : undefined;
      if (e.key === "f" || e.key === "F") return setFocusOn((v) => !v);
      if (e.key === "s" || e.key === "S") return setStepsOn((v) => !v);
      if (e.key === "ArrowRight" && idx >= 0 && idx < flat.length - 1) go({ at: "exercise", id: flat[idx + 1]!.ex.id });
      if (e.key === "ArrowLeft" && idx > 0) go({ at: "exercise", id: flat[idx - 1]!.ex.id });
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const pressing = { onPointerDownCapture: () => (busy.current = true), onPointerUpCapture: () => (busy.current = false), onPointerCancelCapture: () => (busy.current = false) };

  // ---- overview ---------------------------------------------------------------------------
  if (view.at === "overview")
    return (
      <div ref={wrap} className={`train${full ? " full" : ""}`} {...pressing}>
        {crumbs}
        <section className="train-hero">
          <div className="train-hero-top">
            <BadgeRing classId={classId} name={board.name} done={done} total={flat.length} size={150} />
            <div style={{ flex: 1 }}>
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

  // ---- the exercise studio: chapter tabs, exercise tabs, toolbar, step strip, board, footer --------
  const focusFrame = here?.ex ?? lessonHere ?? null;
  const act = here?.ex.activity;
  const lesson = lessonHere ?? lessons[0];
  const tint = TINTS[Math.max(0, lessons.findIndex((l) => l.id === lesson?.id)) % TINTS.length]!;
  const lessonEx = lesson ? (exercisesOf.get(lesson.id) ?? []) : [];
  const steps = act ? stepsOf(act.steps) : [];
  const stepAt = Math.min(stepI, Math.max(0, steps.length - 1));
  const firstOpen = (l: Frame) => {
    const ex = exercisesOf.get(l.id) ?? [];
    return ex.find((e) => !e.done) ?? ex[0];
  };
  const next1 = idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : undefined;
  const prev1 = idx > 0 ? flat[idx - 1] : undefined;
  const matches = flat.filter((x) => !palQ.trim() || `${titleOf(x.ex)} ${x.lesson.title} ${x.ex.activity?.kind ?? ""}`.toLowerCase().includes(palQ.trim().toLowerCase()));
  const boardFor = () => {
    if (!focusFrame) return null;
    if (here && act?.board) return <ExerciseHost board={board} frame={here.ex} kind={act.board} readOnly={readOnly} trainer={trainer} onChanged={onChanged} onError={onError} />;
    if (here && kindOf(here.ex) === "CHECK") return <Checklist board={board} frame={here.ex} readOnly={readOnly} onChanged={onChanged} onError={onError} />;
    return <CanvasEditor board={board} refs={refs} cardTypes={cardTypes} readOnly={readOnly} onChanged={onChanged} onError={onError} focus={focusFrame.id} fill trainer={trainer} />;
  };
  return (
    <div ref={wrap} className={`studio${focusOn ? " focus" : ""}`} {...pressing} style={{ ["--tint" as string]: tint }}>
      {!focusOn ? (
        <nav className="studio-chapters" aria-label="Chapters">
          <Link className="studio-logo" href="/classroom" aria-label="Classes">
            <ClassIcon classId={classId} name={board.name} size={30} />
          </Link>
          <button className="studio-class" onClick={() => go({ at: "overview" })}>
            ‹ CLASS {short}
          </button>
          <div className="studio-tabs" role="tablist">
            {lessons.map((l, li) => {
              const ex = exercisesOf.get(l.id) ?? [];
              const d = ex.filter((e) => e.done).length;
              const ln = lessonName(l);
              const on = l.id === lesson?.id;
              return (
                <button key={l.id} role="tab" aria-selected={on} className="studio-chapter" style={{ ["--c" as string]: TINTS[li % TINTS.length] }} onClick={() => (firstOpen(l) ? go({ at: "exercise", id: firstOpen(l)!.id }) : go({ at: "lesson", id: l.id }))} title={l.title}>
                  <b>{ln.n || "·"}</b>
                  <span className="studio-chapter-name">{ln.title}</span>
                  <small>
                    {d}/{ex.length}
                  </small>
                  <i style={{ width: `${ex.length ? (100 * d) / ex.length : 0}%` }} />
                </button>
              );
            })}
          </div>
          {timerChip}
        </nav>
      ) : null}
      {!focusOn ? (
        <div className="studio-exercises">
          <div className="studio-pills" role="tablist" aria-label="Exercises in this chapter" ref={pillsRef}>
            {lessonEx.map((e, k) => (
              <button key={e.id} role="tab" aria-selected={here?.ex.id === e.id} className="studio-pill" data-on={here?.ex.id === e.id ? "1" : undefined} onClick={() => go({ at: "exercise", id: e.id })} title={titleOf(e)}>
                <span className={`studio-num${e.done ? " done" : ""}`}>{e.done ? "✓" : k + 1}</span>
                <span className="studio-pill-title">{titleOf(e)}</span>
              </button>
            ))}
            {lesson && isLesson(lesson) ? (
              <button role="tab" aria-selected={view.at === "lesson"} className="studio-pill" data-on={view.at === "lesson" ? "1" : undefined} onClick={() => go({ at: "lesson", id: lesson.id })}>
                <span className="studio-num">≡</span>
                <span className="studio-pill-title">Whole lesson</span>
              </button>
            ) : null}
          </div>
          <span className="ex-mono">{here ? `${lessonEx.findIndex((e) => e.id === here.ex.id) + 1} / ${lessonEx.length}` : `${lessonEx.length} exercises`}</span>
        </div>
      ) : null}
      <div className="studio-toolbar">
        <div className="studio-title">
          <h2>{here ? titleOf(here.ex) : lesson ? lessonName(lesson).title : ""}</h2>
          <span className="ex-mono">{here ? `${act?.kind ?? (isLesson(here.lesson) ? "Exercise" : "Welcome")}${act && activityTiming(act) ? ` · ${activityTiming(act)}` : ""}` : "Whole lesson"}</span>
        </div>
        <span className="grow" />
        {focusOn && timerChip}
        {trainer && here && act?.prepare ? (
          <button className="studio-btn" onClick={() => start(here.ex, act.share ? "Prepare" : act.kind, act.prepare!)}>
            ▶ {act.share ? "Prepare" : "Start"} {act.prepare} min
          </button>
        ) : null}
        {trainer && here && act?.share ? (
          <button className="studio-btn" onClick={() => start(here.ex, act.shareLabel ?? "Share", act.share!)}>
            ▶ {act.shareLabel ?? "Share"} {act.share} min
          </button>
        ) : null}
        <button className="studio-btn" onClick={() => (setPalOpen(true), setPalQ(""))} title="Jump to an exercise (/ or Ctrl+K)">
          Jump
        </button>
        <button className="studio-btn" aria-pressed={stepsOn} onClick={() => setStepsOn((v) => !v)} title="Steps and references (S)">
          Steps
        </button>
        <button className="studio-btn" aria-pressed={focusOn} onClick={() => setFocusOn((v) => !v)} title="Focus: hide the tabs (F)">
          Focus
        </button>
        {here ? (
          trainer ? (
            <button className={`studio-btn${here.ex.done ? " done" : ""}`} onClick={() => void markDone(here.ex)} aria-pressed={!!here.ex.done}>
              {here.ex.done ? "✓ Completed" : "Mark complete"}
            </button>
          ) : here.ex.done ? (
            <span className="studio-btn done">✓ Completed</span>
          ) : null
        ) : null}
      </div>
      {steps.length ? (
        <div className="studio-step">
          <button aria-label="Previous step" disabled={stepAt === 0} onClick={() => setStepI(stepAt - 1)}>
            ‹
          </button>
          <button className="studio-step-text" onClick={() => setStepsOn(true)}>
            <span className="ex-mono">
              STEP {stepAt + 1}/{steps.length}
            </span>{" "}
            {steps[stepAt]!.replace(/^Step\s*\d+\s*[:.]\s*/i, "").split("\n")[0]}
          </button>
          <button aria-label="Next step" disabled={stepAt >= steps.length - 1} onClick={() => setStepI(stepAt + 1)}>
            ›
          </button>
        </div>
      ) : null}
      <div className="studio-canvas">{boardFor()}</div>
      <footer className="studio-foot">
        <button className="studio-foot-nav" disabled={!prev1} onClick={() => prev1 && go({ at: "exercise", id: prev1.ex.id })}>
          ‹ {prev1 ? titleOf(prev1.ex) : ""}
        </button>
        <div className="studio-segs" aria-label={`Exercise ${idx + 1} of ${flat.length}`}>
          {flat.map((x) => (
            <button key={x.ex.id} className={`studio-seg${x.ex.id === here?.ex.id ? " on" : x.ex.done ? " done" : ""}`} title={titleOf(x.ex)} onClick={() => go({ at: "exercise", id: x.ex.id })} />
          ))}
        </div>
        <button
          className="studio-foot-nav next"
          onClick={async () => {
            if (here && trainer && !here.ex.done) await markDone(here.ex, true);
            if (next1) go({ at: "exercise", id: next1.ex.id });
            else if (!here && lessonEx[0]) go({ at: "exercise", id: lessonEx[0].id });
            else go({ at: "overview" });
          }}
        >
          {here ? (next1 ? `${trainer ? "Complete · " : ""}${titleOf(next1.ex)} ›` : "Finish class ▸") : "Start the first exercise ›"}
        </button>
      </footer>
      {stepsOn ? (
        <aside className="studio-steps" aria-label="Steps and references">
          <header>
            <span className="ex-mono">{here ? "Steps" : "Questions in this lesson"}</span>
            <button onClick={() => setStepsOn(false)} aria-label="Close">
              ×
            </button>
          </header>
          {here && act ? <ActivitySide steps={act.steps} side={act.side ?? []} /> : null}
          {!here
            ? lessonEx.map((e) => (
                <div key={e.id} className="train-whole-q">
                  <button onClick={() => go({ at: "exercise", id: e.id })}>
                    {e.done ? "✓ " : ""}
                    {e.title}
                  </button>
                  {e.activity && activityTiming(e.activity) ? <span className="ex-mono">{activityTiming(e.activity)}</span> : null}
                  {e.activity?.steps.trim() ? <Steps text={e.activity.steps} /> : null}
                </div>
              ))
            : null}
        </aside>
      ) : null}
      {palOpen ? (
        <div className="lp-backdrop" style={{ zIndex: 120 }} onClick={() => setPalOpen(false)} role="presentation">
          <div className="studio-palette" role="dialog" aria-label="Jump to an exercise" onClick={(e) => e.stopPropagation()}>
            <input autoFocus placeholder="Jump to an exercise, lesson or type…" value={palQ} onChange={(e) => setPalQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && matches[0] && (go({ at: "exercise", id: matches[0].ex.id }), setPalOpen(false))} />
            <div className="studio-palette-list">
              {matches.map((x) => (
                <button key={x.ex.id} onClick={() => (go({ at: "exercise", id: x.ex.id }), setPalOpen(false))}>
                  <span className={`studio-num${x.ex.done ? " done" : ""}`}>{x.ex.done ? "✓" : lessonName(x.lesson).n || "·"}</span>
                  <b>{titleOf(x.ex)}</b>
                  <span className="ex-mono">{x.ex.activity?.kind ?? ""}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** The steps of an activity: each "Step n" with the lines under it. */
function stepsOf(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split("\n").map((l) => l.trim()).filter(Boolean)) {
    if (/^Step\s*\d+/i.test(line) || !out.length) out.push(line);
    else out[out.length - 1] += `\n${line}`;
  }
  return out;
}

/** A purpose-built exercise board with its shared state. */
function ExerciseHost({ board, frame, kind, readOnly, trainer, onChanged, onError }: { board: Board; frame: Frame; kind: string; readOnly: boolean; trainer: boolean; onChanged: () => void; onError: (m: string) => void }) {
  // Steps of one workshop (config.shared) keep their work on the first step's frame.
  const shared = frame.activity?.config?.shared;
  const home = (shared ? board.frames.find((f) => f.activity?.config?.shared === shared) : undefined) ?? frame;
  return <ExerciseState key={home.id} board={board} home={home} frame={frame} kind={kind} readOnly={readOnly} trainer={trainer} onChanged={onChanged} onError={onError} />;
}

function ExerciseState({ board, home, frame, kind, readOnly, trainer, onChanged, onError }: { board: Board; home: Frame; frame: Frame; kind: string; readOnly: boolean; trainer: boolean; onChanged: () => void; onError: (m: string) => void }) {
  const [st, op] = useFrameState(board, home, onChanged, onError);
  return <ExerciseBoard kind={kind} board={board} frame={frame} config={frame.activity?.config ?? {}} st={st} op={op} readOnly={readOnly} trainer={trainer} />;
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

const ANSWERS: Record<string, { label: string; tint: string; ink: string }> = {
  Y: { label: "Yes, must be in place", tint: "#d9efe1", ink: "#2f8f5b" },
  N: { label: "No, not needed", tint: "#f9d9d4", ink: "#d93a2b" },
  D: { label: "Depends on context", tint: "#fbe7c0", ink: "#b27400" },
};

/**
 * A checklist exercise as one table: every question visible with its answer to pick, rows tinted
 * by the answer, a car per question on a rail above, and the tally. Answers are the cards' choices.
 */
function Checklist({ board, frame, readOnly, onChanged, onError }: { board: Board; frame: Frame; readOnly: boolean; onChanged: () => void; onError: (m: string) => void }) {
  const inside = board.nodes.filter((n) => n.frameId === frame.id);
  const items = inside.filter((n) => cardChoices(n).length).sort((a, b) => a.y - b.y || a.x - b.x);
  const legend = inside.find((n) => n.kind === "text" && n.fields.locked)?.text;
  const [answers, setAnswers] = useState<Record<string, string>>({});
  useEffect(() => setAnswers({}), [board]);
  const answerOf = (id: string, fallback: unknown) => answers[id] ?? (typeof fallback === "string" ? fallback : "");
  const tally = (c: string) => items.filter((n) => answerOf(n.id, n.fields.choice) === c).length;
  const open = items.filter((n) => !answerOf(n.id, n.fields.choice)).length;
  const pick = async (id: string, choice: string) => {
    setAnswers((a) => ({ ...a, [id]: choice }));
    try {
      await api("PATCH", `/v1/boards/${encodeURIComponent(board.id)}/nodes/${encodeURIComponent(id)}`, { fields: { choice: choice || null } });
      onChanged();
    } catch (e) {
      onError((e as ApiFailure).message);
    }
  };
  return (
    <div className="check">
      <div className="check-rail" aria-hidden>
        {items.map((n) => {
          const a = ANSWERS[answerOf(n.id, n.fields.choice)];
          return <i key={n.id} style={a ? { background: a.ink } : undefined} />;
        })}
      </div>
      <div className="row" style={{ gap: 8 }}>
        {(["Y", "N", "D"] as const).map((c) => (
          <span key={c} className="check-tally" style={{ background: ANSWERS[c]!.tint }}>
            {c === "Y" ? "Yes" : c === "N" ? "No" : "Depends"} {tally(c)}
          </span>
        ))}
        <span className="check-tally">Open {open}</span>
      </div>
      {legend ? <p className="check-legend">{legend}</p> : null}
      <table className="check-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Question</th>
            <th>Must be in place?</th>
          </tr>
        </thead>
        <tbody>
          {items.map((n, i) => {
            const [title, ...rest] = n.text.split("\n");
            const a = answerOf(n.id, n.fields.choice);
            return (
              <tr key={n.id} style={ANSWERS[a] ? { background: ANSWERS[a]!.tint } : undefined}>
                <td className="check-n">{i + 1}</td>
                <td>
                  <b>{title}</b>
                  {rest.length ? <p>{rest.join(" ")}</p> : null}
                </td>
                <td>
                  <select className="check-select" value={a} disabled={readOnly} onChange={(e) => void pick(n.id, e.target.value)} aria-label={`Answer for ${title}`}>
                    <option value="">Choose…</option>
                    {cardChoices(n).map((c) => (
                      <option key={c} value={c}>
                        {ANSWERS[c]?.label ?? c}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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

