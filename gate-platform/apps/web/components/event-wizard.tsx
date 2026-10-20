"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Course, EventFormat } from "@/lib/api";
import { formatMoney, parseMajorToMinor } from "@/lib/format";
import { sessionDates } from "@/lib/wizard";
import { createEventFromWizard, type WizardResult } from "@/app/create-event-action";
import { CopyButton } from "@/components/copy-button";

const STEPS = ["Course", "Dates & tickets", "Publish"] as const;
const FORMATS: Array<[EventFormat, string]> = [
  ["live_virtual", "Live virtual"],
  ["in_person", "In person"],
  ["hybrid", "Hybrid"],
];

function dayLabel(n: number) {
  return `${n} DAY${n === 1 ? "" : "S"}`;
}

function rangeLabel(dates: string[]): string {
  if (dates.length === 0) return "DATE TO BE SET";
  const part = (d: string) => {
    const x = new Date(`${d}T12:00:00Z`);
    return { m: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" }).format(x).toUpperCase(), d: x.getUTCDate(), y: x.getUTCFullYear() };
  };
  const a = part(dates[0]!);
  const b = part(dates[dates.length - 1]!);
  if (dates.length === 1) return `${a.m} ${a.d}, ${a.y}`;
  if (a.y !== b.y) return `${a.m} ${a.d}, ${a.y} – ${b.m} ${b.d}, ${b.y}`;
  if (a.m !== b.m) return `${a.m} ${a.d} – ${b.m} ${b.d}, ${b.y}`;
  return `${a.m} ${a.d} – ${b.d}, ${b.y}`;
}

type Viewer = "manager" | "instructor" | "instructor-approval";

export function EventWizard({ courses, currency, instructors = [], viewer = "manager" }: { courses: Course[]; currency: string; instructors?: { id: string; name: string }[]; viewer?: Viewer }) {
  const [step, setStep] = useState(0);
  const [courseId, setCourseId] = useState<string | null>(courses[0]?.id ?? null);
  const [newCourse, setNewCourse] = useState<{ name: string; days: number } | null>(courses.length === 0 ? { name: "", days: 2 } : null);
  const picked = courses.find((c) => c.id === courseId) ?? null;

  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [days, setDays] = useState(picked?.durationDays ?? 2);
  const [weekdaysOnly, setWeekdaysOnly] = useState(true);
  const [timezone, setTimezone] = useState("America/Toronto");
  const [format, setFormat] = useState<EventFormat>("live_virtual");
  const [ticketName, setTicketName] = useState("Standard");
  const [price, setPrice] = useState("");
  const [seats, setSeats] = useState("20");
  const [minEnrollment, setMinEnrollment] = useState("");
  const [cur, setCur] = useState(currency);
  const [teachers, setTeachers] = useState<string[]>(instructors.length === 1 ? [instructors[0]!.id] : []);

  const [result, setResult] = useState<WizardResult | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Toronto");
    } catch {
      // keep the default
    }
  }, []);
  // Course length is the default number of days.
  useEffect(() => {
    if (picked?.durationDays) setDays(picked.durationDays);
    else if (newCourse) setDays(newCourse.days);
  }, [picked?.id, newCourse?.days]); // eslint-disable-line react-hooks/exhaustive-deps

  const title = newCourse ? newCourse.name || "New course" : picked?.name ?? "Pick a course";
  const dates = useMemo(() => sessionDates(startDate, days, weekdaysOnly), [startDate, days, weekdaysOnly]);
  const priceMinor = price ? parseMajorToMinor(price, cur) : null;
  const priceLabel = priceMinor === null ? `${cur} —` : formatMoney(priceMinor, cur);

  const step1ok = Boolean(newCourse ? newCourse.name.trim() : picked);
  const step2ok = Boolean(startDate && startTime && endTime && endTime > startTime && priceMinor !== null && Number(seats) >= 1);
  const canContinue = step === 0 ? step1ok : step === 1 ? step2ok : true;

  function publish() {
    start(async () => {
      setResult(
        await createEventFromWizard({
          course: newCourse ? { name: newCourse.name, days: newCourse.days } : { id: courseId! },
          startDate,
          startTime,
          endTime,
          days,
          weekdaysOnly,
          timezone,
          format,
          ticketName,
          price,
          seats: Number(seats),
          minEnrollment: minEnrollment ? Number(minEnrollment) : null,
          currency: cur,
          instructorIds: teachers,
        }),
      );
    });
  }

  const done = result?.ok ? result : null;

  return (
    <div className="wiz">
      <header className="wiz-top">
        <Link href="/events" className="wiz-cancel">
          × Cancel
        </Link>
        <h1>Create event</h1>
        <ol className="wiz-steps" aria-label="Steps">
          {STEPS.map((label, i) => (
            <li key={label} className={i < step || done ? "is-done" : i === step ? "is-current" : ""} aria-current={i === step ? "step" : undefined}>
              <span>{i < step || done ? "✓" : i + 1}</span>
              {label}
            </li>
          ))}
        </ol>
      </header>

      <div className="wiz-body">
        <div className="wiz-form">
          {step === 0 && (
            <>
              <p className="wiz-lead">Pick the course you&apos;re running. Or start a new one.</p>
              <div className="wiz-courses" role="radiogroup" aria-label="Course">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={!newCourse && courseId === c.id}
                    className="wiz-course"
                    onClick={() => {
                      setNewCourse(null);
                      setCourseId(c.id);
                    }}
                  >
                    <strong>{c.name}</strong>
                    {c.durationDays ? <span>{dayLabel(c.durationDays)}</span> : null}
                  </button>
                ))}
                {newCourse ? (
                  <div className="wiz-course wiz-newcourse" aria-checked="true" role="radio">
                    <label>
                      Course name
                      <input autoFocus value={newCourse.name} onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })} placeholder="e.g. Certified ScrumMaster" maxLength={200} />
                    </label>
                    <label>
                      Days
                      <input type="number" min={1} max={30} value={newCourse.days} onChange={(e) => setNewCourse({ ...newCourse, days: Math.max(1, Math.min(30, Number(e.target.value) || 1)) })} />
                    </label>
                  </div>
                ) : (
                  <button type="button" className="wiz-course wiz-add" onClick={() => setNewCourse({ name: "", days: 2 })}>
                    + New course
                  </button>
                )}
              </div>
            </>
          )}

          {step === 1 && (
            <div className="wiz-fields">
              <fieldset>
                <legend>Format</legend>
                <div className="wiz-chips">
                  {FORMATS.map(([v, label]) => (
                    <button key={v} type="button" aria-pressed={format === v} onClick={() => setFormat(v)}>
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="wiz-row">
                <label>
                  First day
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </label>
                <label>
                  Days
                  <input type="number" min={1} max={30} value={days} onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value) || 1)))} />
                </label>
                <label>
                  Starts
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </label>
                <label>
                  Ends
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </label>
              </div>
              <div className="wiz-row">
                <label className="wiz-wide">
                  Time zone
                  <input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="America/Toronto" />
                </label>
                <label className="wiz-check">
                  <input type="checkbox" checked={weekdaysOnly} onChange={(e) => setWeekdaysOnly(e.target.checked)} /> Skip weekends
                </label>
              </div>
              {dates.length > 0 && (
                <p className="wiz-dates mono">
                  {dates.map((d) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(new Date(`${d}T12:00:00Z`))).join(" · ")}
                </p>
              )}
              <div className="wiz-row">
                <label className="wiz-wide">
                  Ticket
                  <input value={ticketName} onChange={(e) => setTicketName(e.target.value)} maxLength={100} />
                </label>
                <label>
                  Price
                  <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1295" />
                </label>
                <label>
                  Currency
                  <input value={cur} onChange={(e) => setCur(e.target.value.toUpperCase().slice(0, 3))} maxLength={3} />
                </label>
              </div>
              <div className="wiz-row">
                <label>
                  Seats
                  <input type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} />
                </label>
                <label>
                  Minimum to run
                  <input type="number" min={1} value={minEnrollment} onChange={(e) => setMinEnrollment(e.target.value)} placeholder="Optional" />
                </label>
              </div>
              {viewer === "manager" && instructors.length > 0 && (
                <fieldset>
                  <legend>Taught by</legend>
                  <div className="wiz-chips">
                    {instructors.map((i) => (
                      <button key={i.id} type="button" aria-pressed={teachers.includes(i.id)} onClick={() => setTeachers((t) => (t.includes(i.id) ? t.filter((x) => x !== i.id) : [...t, i.id]))}>
                        {i.name}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              {viewer !== "manager" && <p className="hint">You&apos;ll be the instructor for this class.{viewer === "instructor-approval" ? " An owner or admin publishes it before registration opens." : ""}</p>}
              <p className="hint">Pre-work and survey emails, refund rules and payouts come from the course and your settings; you can change them later on the event.</p>
            </div>
          )}

          {step === 2 && !done && (
            <div className="wiz-review">
              <p className="wiz-lead">{viewer === "instructor-approval" ? "Check the details, then send it for approval. Registration opens once an owner or admin publishes it." : "Check the details, then publish. Registration opens right away."}</p>
              <dl>
                <div>
                  <dt>Course</dt>
                  <dd>{title}</dd>
                </div>
                <div>
                  <dt>Dates</dt>
                  <dd>
                    {rangeLabel(dates)} · {startTime}–{endTime} {timezone}
                  </dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{FORMATS.find(([v]) => v === format)?.[1]}</dd>
                </div>
                <div>
                  <dt>Ticket</dt>
                  <dd>
                    {ticketName || "Standard"} · {priceLabel} · {seats} seats{minEnrollment ? ` · runs with ${minEnrollment}+` : ""}
                  </dd>
                </div>
              </dl>
              {result && !result.ok && (
                <p className="result result-error" role="alert">
                  {result.error}
                </p>
              )}
            </div>
          )}

          {done && (
            <div className="wiz-done">
              <p className="eyebrow-mono">{viewer === "instructor-approval" ? "SENT FOR APPROVAL" : "PUBLISHED"}</p>
              <h2>{viewer === "instructor-approval" ? "Saved as a draft. You can share it once it's approved." : "Your event is live. Share it."}</h2>
              {done.publicUrl ? (
                <div className="wiz-share">
                  <code>{done.publicUrl}</code>
                  <CopyButton text={done.publicUrl} />
                </div>
              ) : (
                <p className="muted">Add the registration widget to your course page to take bookings:</p>
              )}
              <label className="wiz-embed">
                Embed on your website
                <textarea readOnly rows={7} value={done.embed} />
              </label>
              <div className="wiz-share">
                <CopyButton text={done.embed} label="Copy embed code" />
                <Link className="pill-btn" href={`/events?sel=${encodeURIComponent(done.eventId)}`}>
                  Open event
                </Link>
                <Link className="pill-btn" href={`/events/${encodeURIComponent(done.eventId)}`}>
                  Edit details
                </Link>
              </div>
            </div>
          )}
        </div>

        <aside className="wiz-preview" aria-label="Live preview">
          <p className="eyebrow-mono">LIVE PREVIEW</p>
          <div className="preview-card">
            <div className="preview-cover" style={picked?.imageUrl && !newCourse ? { backgroundImage: `url(${picked.imageUrl})` } : undefined}>
              {!(picked?.imageUrl && !newCourse) && <span>COURSE COVER</span>}
            </div>
            <div className="preview-body">
              <p className="preview-date">{rangeLabel(dates)}</p>
              <h3>{title}</h3>
              <p className="muted">
                {FORMATS.find(([v]) => v === format)?.[1]} · {days} day{days === 1 ? "" : "s"}
              </p>
              <div className="preview-foot">
                <strong>{priceMinor === null ? "$—" : priceLabel}</strong>
                <span className="preview-register">Register</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {!done && (
        <footer className="wiz-foot">
          <button type="button" className="pill-btn" disabled={step === 0 || pending} onClick={() => setStep(step - 1)}>
            Back
          </button>
          {step < 2 ? (
            <button type="button" className="wiz-next" disabled={!canContinue} onClick={() => setStep(step + 1)}>
              {step === 0 ? "Continue" : "Review & publish"}
            </button>
          ) : (
            <button type="button" className="wiz-next" disabled={pending} aria-busy={pending} onClick={publish}>
              {pending ? "Publishing…" : viewer === "instructor-approval" ? "Send for approval" : "Publish event"}
            </button>
          )}
        </footer>
      )}
    </div>
  );
}
