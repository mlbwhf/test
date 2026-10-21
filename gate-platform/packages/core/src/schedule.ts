// Schedule builder: start dates for repeating classes. Pure date arithmetic on local
// calendar dates ("YYYY-MM-DD"); times and time zones come from the template class.

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ScheduleRule =
  /** Every N weeks on a weekday (defaults to the template's weekday). */
  | { repeat: "weekly"; everyWeeks: number; weekday?: Weekday | undefined }
  /** The Nth (or last) weekday of every N months, e.g. the first Monday. */
  | { repeat: "monthly"; everyMonths: number; week: 1 | 2 | 3 | 4 | "last"; weekday: Weekday }
  /** Hand-picked dates. */
  | { repeat: "dates"; dates: string[] };

export interface SchedulePlanInput {
  rule: ScheduleRule;
  /** First date the schedule may use (inclusive). */
  from: string;
  /** Stop after this many dates, or at `until` (inclusive), whichever comes first. */
  count?: number | undefined;
  until?: string | undefined;
  /** Holidays and other days to leave out; the schedule carries on past them. */
  skip?: string[] | undefined;
}

export const MAX_SCHEDULE_DATES = 52;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;

const toUtc = (d: string) => Date.parse(`${d}T00:00:00Z`);
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const weekdayOf = (d: string): Weekday => new Date(toUtc(d)).getUTCDay() as Weekday;
export const addDays = (d: string, n: number) => fromUtc(toUtc(d) + n * DAY);

export function isLocalDate(d: unknown): d is string {
  return typeof d === "string" && DATE_RE.test(d) && fromUtc(toUtc(d)) === d;
}

/** The `week`-th (1–4) or last `weekday` of a month. */
function nthWeekday(year: number, month0: number, week: 1 | 2 | 3 | 4 | "last", weekday: Weekday): string {
  if (week === "last") {
    const last = new Date(Date.UTC(year, month0 + 1, 0));
    const back = (last.getUTCDay() - weekday + 7) % 7;
    return fromUtc(last.getTime() - back * DAY);
  }
  const first = new Date(Date.UTC(year, month0, 1));
  const ahead = (weekday - first.getUTCDay() + 7) % 7;
  return fromUtc(first.getTime() + (ahead + (week - 1) * 7) * DAY);
}

/** Start dates for a schedule, in order, at most MAX_SCHEDULE_DATES. Throws on an invalid rule. */
export function planScheduleDates(input: SchedulePlanInput): string[] {
  const { rule, from } = input;
  if (!isLocalDate(from)) throw new Error("from must be a YYYY-MM-DD date");
  if (input.until !== undefined && !isLocalDate(input.until)) throw new Error("until must be a YYYY-MM-DD date");
  const limit = Math.min(input.count ?? MAX_SCHEDULE_DATES, MAX_SCHEDULE_DATES);
  if (!Number.isInteger(limit) || limit < 1) throw new Error("count must be at least 1");
  if (input.count === undefined && input.until === undefined && rule.repeat !== "dates") throw new Error("give a number of dates or an end date");
  const skip = new Set(input.skip ?? []);
  const out: string[] = [];
  const keep = (d: string) => d >= from && (input.until === undefined || d <= input.until) && !skip.has(d) && !out.includes(d);

  if (rule.repeat === "dates") {
    for (const d of [...rule.dates].sort()) {
      if (!isLocalDate(d)) throw new Error(`${d} is not a YYYY-MM-DD date`);
      if (keep(d)) out.push(d);
      if (out.length >= limit) break;
    }
    return out;
  }

  if (rule.repeat === "weekly") {
    if (!Number.isInteger(rule.everyWeeks) || rule.everyWeeks < 1 || rule.everyWeeks > 8) throw new Error("repeat every 1 to 8 weeks");
    const weekday = rule.weekday ?? weekdayOf(from);
    let d = addDays(from, (weekday - weekdayOf(from) + 7) % 7);
    for (let i = 0; i < 1000 && out.length < limit; i++, d = addDays(d, 7 * rule.everyWeeks)) {
      if (input.until !== undefined && d > input.until) break;
      if (keep(d)) out.push(d);
    }
    return out;
  }

  if (!Number.isInteger(rule.everyMonths) || rule.everyMonths < 1 || rule.everyMonths > 12) throw new Error("repeat every 1 to 12 months");
  const start = new Date(toUtc(from));
  for (let i = 0; i < 400 && out.length < limit; i += rule.everyMonths) {
    const d = nthWeekday(start.getUTCFullYear(), start.getUTCMonth() + i, rule.week, rule.weekday);
    if (input.until !== undefined && d > input.until) break;
    if (keep(d)) out.push(d);
  }
  return out;
}

/**
 * URL slug for each upcoming date of a course: its local start date ("2026-11-20"), with
 * "-2", "-3" for a second or third class starting the same day. Order: start time, then id.
 */
export function dateSlugs(events: { id: string; startsAt: Date; timezone: string }[], localDateOf: (d: Date, tz: string) => string): Map<string, string> {
  const out = new Map<string, string>();
  const seen = new Map<string, number>();
  for (const e of [...events].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.id.localeCompare(b.id))) {
    const day = localDateOf(e.startsAt, e.timezone);
    const n = (seen.get(day) ?? 0) + 1;
    seen.set(day, n);
    out.set(e.id, n === 1 ? day : `${day}-${n}`);
  }
  return out;
}
