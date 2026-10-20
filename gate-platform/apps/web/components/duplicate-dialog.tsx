"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { duplicateEventAction } from "@/app/duplicate-action";

type Repeat = "once" | "week" | "2weeks" | "month";

function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function addMonths(date: string, n: number): string {
  const [y, m, day] = date.split("-").map(Number) as [number, number, number];
  const last = new Date(Date.UTC(y, m - 1 + n + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + n, Math.min(day, last), 12)).toISOString().slice(0, 10);
}
const pretty = (d: string) => new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${d}T12:00:00Z`));

/** Duplicate a cohort: same dates, a new first day, or a repeating series. */
export function DuplicateDialog({ eventId, firstDay }: { eventId: string; firstDay: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState(firstDay);
  const [repeat, setRepeat] = useState<Repeat>("once");
  const [count, setCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [pending, run] = useTransition();

  const dates = useMemo(() => {
    const n = repeat === "once" ? 1 : Math.max(1, Math.min(12, count));
    return Array.from({ length: n }, (_, i) => (repeat === "week" ? addDays(start, 7 * i) : repeat === "2weeks" ? addDays(start, 14 * i) : repeat === "month" ? addMonths(start, i) : start));
  }, [start, repeat, count]);

  function submit() {
    setError(null);
    run(async () => {
      const r = await duplicateEventAction(eventId, dates.map((d) => (d === firstDay ? null : d)));
      if (!r.ok) {
        setError(r.error);
        if (r.ids.length) router.refresh();
        return;
      }
      setOpen(false);
      router.push(`/events?sel=${encodeURIComponent(r.ids[0]!)}`);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button type="button" className="pill-btn" onClick={() => setOpen(true)}>
        Duplicate
      </button>
    );
  }
  return (
    <div className="dup-overlay" role="dialog" aria-modal="true" aria-labelledby="dup-title">
      <div className="dup-box">
        <h3 id="dup-title">Duplicate event</h3>
        <p className="muted">Same course, format, tickets, prices, minimum and instructors. Nothing sold is copied.</p>
        <div className="wiz-fields">
          <div className="wiz-row">
            <label>
              First day
              <input type="date" value={start} onChange={(e) => e.target.value && setStart(e.target.value)} />
            </label>
            <label>
              Repeat
              <select value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat)}>
                <option value="once">Just once</option>
                <option value="week">Every week</option>
                <option value="2weeks">Every 2 weeks</option>
                <option value="month">Every month</option>
              </select>
            </label>
            {repeat !== "once" && (
              <label>
                Copies
                <input type="number" min={1} max={12} value={count} onChange={(e) => setCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))} />
              </label>
            )}
          </div>
          <p className="wiz-dates mono">
            {dates.map((d) => (d === firstDay ? `${pretty(d)} (same dates)` : pretty(d))).join(" · ")}
          </p>
          <p className="hint">Sessions keep their local start and end times; multi-day cohorts keep their pattern.</p>
        </div>
        {error && (
          <p className="result result-error" role="alert">
            {error}
          </p>
        )}
        <div className="dup-actions">
          <button type="button" className="pill-btn" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </button>
          <button type="button" className="wiz-next" onClick={submit} disabled={pending} aria-busy={pending}>
            {pending ? "Creating…" : dates.length > 1 ? `Create ${dates.length} events` : "Create copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
