// Wall-clock arithmetic in a time zone, for moving a cohort to new dates while keeping
// "9:00 AM Toronto" as 9:00 AM Toronto across daylight-saving changes.

const DAY = 86_400_000;

function parts(d: Date, tz: string): { y: number; m: number; d: number; h: number; mi: number; s: number } {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const get = (t: string) => Number(f.formatToParts(d).find((p) => p.type === t)!.value);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), s: get("second") };
}

/** The instant whose wall clock in `tz` reads the given local date and time. */
export function fromWallClock(y: number, m: number, d: number, h: number, mi: number, s: number, tz: string): Date {
  const guess = Date.UTC(y, m - 1, d, h, mi, s);
  // Two passes settle the zone offset, including at DST boundaries.
  let t = guess;
  for (let i = 0; i < 2; i++) {
    const p = parts(new Date(t), tz);
    const seen = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
    t += guess - seen;
  }
  return new Date(t);
}

/** Local calendar date (YYYY-MM-DD) of an instant in `tz`. */
export function localDate(d: Date, tz: string): string {
  const p = parts(d, tz);
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

/** Whole calendar days from local date `a` to local date `b` (YYYY-MM-DD). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
}

/** Same wall-clock time `days` calendar days later (or earlier) in `tz`. */
export function shiftDays(d: Date, days: number, tz: string): Date {
  const p = parts(d, tz);
  const base = new Date(Date.UTC(p.y, p.m - 1, p.d) + days * DAY);
  return fromWallClock(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(), p.h, p.mi, p.s, tz);
}
