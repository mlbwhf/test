"use client";

import { useMemo, useState, useTransition } from "react";
import { scheduleAction } from "@/app/(organizer)/courses/[id]/schedule-actions";
import type { ScheduleInput, ScheduleRule, SchedulePlanRow } from "@/lib/api";

type Template = { id: string; label: string; startDate: string; weekday: number; days: number };
type Repeat = "weekly" | "biweekly" | "monthly" | "dates";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKS: { v: "1" | "2" | "3" | "4" | "last"; l: string }[] = [
  { v: "1", l: "First" },
  { v: "2", l: "Second" },
  { v: "3", l: "Third" },
  { v: "4", l: "Fourth" },
  { v: "last", l: "Last" },
];
const DATE_RE = /\d{4}-\d{2}-\d{2}/g;

const pretty = (d: string) => new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${d}T00:00:00Z`));
const span = (r: SchedulePlanRow) => (r.startDate === r.endDate ? pretty(r.startDate) : `${pretty(r.startDate)} – ${pretty(r.endDate)}`);

/** Copy one class onto repeating dates: preview first, then create (as drafts or published). */
export function ScheduleBuilder({ courseId, templates, today }: { courseId: string; templates: Template[]; today: string }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const template = templates.find((t) => t.id === templateId) ?? templates[0];
  const [repeat, setRepeat] = useState<Repeat>("monthly");
  const [weekday, setWeekday] = useState(template?.weekday ?? 1);
  const [week, setWeek] = useState<"1" | "2" | "3" | "4" | "last">("1");
  const [from, setFrom] = useState(today);
  const [limitBy, setLimitBy] = useState<"count" | "until">("count");
  const [count, setCount] = useState(6);
  const [until, setUntil] = useState("");
  const [skip, setSkip] = useState("");
  const [dates, setDates] = useState("");
  const [publish, setPublish] = useState(true);
  const [plan, setPlan] = useState<SchedulePlanRow[] | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const input = useMemo((): ScheduleInput | string => {
    let rule: ScheduleRule;
    if (repeat === "dates") {
      const list = dates.match(DATE_RE) ?? [];
      if (!list.length) return "Add at least one date (YYYY-MM-DD).";
      rule = { repeat: "dates", dates: list };
    } else if (repeat === "monthly") rule = { repeat: "monthly", everyMonths: 1, week: week === "last" ? "last" : (Number(week) as 1 | 2 | 3 | 4), weekday };
    else rule = { repeat: "weekly", everyWeeks: repeat === "biweekly" ? 2 : 1, weekday };
    const out: ScheduleInput = { rule, from, skip: skip.match(DATE_RE) ?? [], publish };
    if (repeat !== "dates") {
      if (limitBy === "count") out.count = count;
      else if (until) out.until = until;
      else return "Pick an end date.";
    }
    return out;
  }, [repeat, dates, week, weekday, from, skip, publish, limitBy, count, until]);

  const run = (dryRun: boolean) => {
    if (typeof input === "string") return setMessage({ ok: false, text: input });
    setMessage(null);
    start(async () => {
      const r = await scheduleAction(templateId, courseId, { ...input, dryRun });
      if (r.error) return setMessage({ ok: false, text: r.error });
      if (dryRun) setPlan(r.plan ?? []);
      else {
        setPlan(null);
        setMessage({ ok: true, text: r.created ? `Created ${r.created} date${r.created === 1 ? "" : "s"}${publish ? " and put them on sale" : " as drafts"}. Each has its own page.` : "Nothing new to create: every date already has a class." });
      }
    });
  };
  const fresh = plan?.filter((p) => !p.conflict).length ?? 0;
  const reset = () => setPlan(null);

  if (!template) return <p className="muted">Add a first date below; the schedule builder copies it onto repeating dates.</p>;
  return (
    <div className="sched">
      <div className="fields">
        <label>
          Copy this class
          <select value={templateId} onChange={(e) => { setTemplateId(e.target.value); setWeekday(templates.find((t) => t.id === e.target.value)?.weekday ?? 1); reset(); }}>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Repeat
          <select value={repeat} onChange={(e) => { setRepeat(e.target.value as Repeat); reset(); }}>
            <option value="monthly">Monthly, on a set weekday</option>
            <option value="weekly">Every week</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="dates">On dates I pick</option>
          </select>
        </label>
        {repeat === "monthly" && (
          <label>
            Which week
            <select value={week} onChange={(e) => { setWeek(e.target.value as typeof week); reset(); }}>
              {WEEKS.map((w) => (
                <option key={w.v} value={w.v}>
                  {w.l}
                </option>
              ))}
            </select>
          </label>
        )}
        {repeat !== "dates" && (
          <label>
            Starting on
            <select value={weekday} onChange={(e) => { setWeekday(Number(e.target.value)); reset(); }}>
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          From
          <input type="date" value={from} min={today} onChange={(e) => { setFrom(e.target.value); reset(); }} />
        </label>
        {repeat !== "dates" && (
          <label>
            Until
            <span className="sched-limit">
              <select value={limitBy} onChange={(e) => { setLimitBy(e.target.value as "count" | "until"); reset(); }} aria-label="Stop after">
                <option value="count">Number of dates</option>
                <option value="until">End date</option>
              </select>
              {limitBy === "count" ? (
                <input type="number" min={1} max={52} value={count} onChange={(e) => { setCount(Math.max(1, Math.min(52, Number(e.target.value) || 1))); reset(); }} aria-label="Number of dates" />
              ) : (
                <input type="date" value={until} min={from} onChange={(e) => { setUntil(e.target.value); reset(); }} aria-label="End date" />
              )}
            </span>
          </label>
        )}
      </div>
      {repeat === "dates" && (
        <label>
          Dates (one per line or comma-separated, YYYY-MM-DD)
          <textarea rows={3} value={dates} onChange={(e) => { setDates(e.target.value); reset(); }} placeholder="2027-01-11, 2027-02-08" />
        </label>
      )}
      <label>
        Skip these days (holidays), optional
        <input value={skip} onChange={(e) => { setSkip(e.target.value); reset(); }} placeholder="2026-12-28, 2027-01-04" />
      </label>
      <p className="hint">
        Each new date copies the {template.days > 1 ? `${template.days}-day ` : ""}schedule, times, time zone, tickets, prices, instructors and instructor pay of the class you pick. Days that already have
        a class are skipped.
      </p>
      <div className="sched-actions">
        <button type="button" className="btn" onClick={() => run(true)} disabled={pending}>
          {pending && !plan ? "Working…" : "Preview dates"}
        </button>
        <label className="label-check">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Put them on sale right away
        </label>
      </div>
      {message && (
        <p className={message.ok ? "notice notice-info" : "notice notice-error"} role={message.ok ? "status" : "alert"}>
          {message.text}
        </p>
      )}
      {plan && (
        <div className="sched-plan">
          {plan.length === 0 ? (
            <p className="muted">No dates match. Widen the range or change the pattern.</p>
          ) : (
            <ol>
              {plan.map((p) => (
                <li key={p.startDate} className={p.conflict ? "is-taken" : undefined}>
                  <span>{span(p)}</span>
                  {p.conflict && <em>already scheduled</em>}
                </li>
              ))}
            </ol>
          )}
          {fresh > 0 && (
            <button type="button" className="btn btn-primary" onClick={() => run(false)} disabled={pending}>
              {pending ? "Creating…" : `Create ${fresh} date${fresh === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
