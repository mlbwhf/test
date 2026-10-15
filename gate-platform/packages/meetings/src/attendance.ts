import type { ParticipantRecord } from "./types.js";

export type AttendanceStatus = "present" | "partial" | "absent";

export interface AttendanceSummary {
  /** Minutes of overlap between the participant's intervals and the scheduled sessions (rounded). */
  minutes: number;
  /** Sessions where the participant was present for at least half of the session. */
  sessionsAttended: number;
  status: AttendanceStatus;
}

export interface SessionWindow {
  startsAt: Date;
  endsAt: Date;
}

export interface SummarizeAttendanceOptions {
  /** Fraction of total scheduled minutes required for "present". Default 0.75. */
  presentThreshold?: number | undefined;
  /** Fraction of total scheduled minutes required for "partial". Default 0.25. */
  partialThreshold?: number | undefined;
}

export interface AttendanceReport {
  /** Keyed by lower-cased email. */
  byEmail: Map<string, AttendanceSummary>;
  /** Records without an email; they cannot be attributed to a learner. */
  unmatched: ParticipantRecord[];
}

const SESSION_ATTENDED_FRACTION = 0.5;

interface Interval {
  start: number;
  end: number;
}

/**
 * Pure attendance roll-up. Each participant's join/leave intervals are clipped to the session
 * windows and unioned per session (so two devices in the same meeting don't double count).
 */
export function summarizeAttendance(
  records: ParticipantRecord[],
  sessions: SessionWindow[],
  opts: SummarizeAttendanceOptions = {},
): AttendanceReport {
  const presentThreshold = opts.presentThreshold ?? 0.75;
  const partialThreshold = opts.partialThreshold ?? 0.25;
  const windows: Interval[] = sessions.map((s) => ({ start: s.startsAt.getTime(), end: s.endsAt.getTime() }));
  const totalScheduledMs = windows.reduce((sum, w) => sum + Math.max(0, w.end - w.start), 0);

  const unmatched: ParticipantRecord[] = [];
  // email -> per-session clipped intervals
  const perEmail = new Map<string, Interval[][]>();

  for (const r of records) {
    const email = normalizeEmail(r.email);
    if (!email) {
      unmatched.push(r);
      continue;
    }
    let buckets = perEmail.get(email);
    if (!buckets) {
      buckets = windows.map(() => []);
      perEmail.set(email, buckets);
    }
    const start = r.joinedAt.getTime();
    const end = r.leftAt.getTime();
    windows.forEach((w, i) => {
      const s = Math.max(start, w.start);
      const e = Math.min(end, w.end);
      if (e > s) buckets![i]!.push({ start: s, end: e });
    });
  }

  const byEmail = new Map<string, AttendanceSummary>();
  for (const [email, buckets] of perEmail) {
    let totalMs = 0;
    let sessionsAttended = 0;
    buckets.forEach((intervals, i) => {
      const overlap = unionLength(intervals);
      totalMs += overlap;
      const w = windows[i]!;
      const len = Math.max(0, w.end - w.start);
      if (len > 0 && overlap >= len * SESSION_ATTENDED_FRACTION) sessionsAttended++;
    });
    const fraction = totalScheduledMs > 0 ? totalMs / totalScheduledMs : 0;
    const status: AttendanceStatus = fraction >= presentThreshold ? "present" : fraction >= partialThreshold ? "partial" : "absent";
    byEmail.set(email, { minutes: Math.round(totalMs / 60_000), sessionsAttended, status });
  }

  return { byEmail, unmatched };
}

/** Total length of the union of the given intervals. */
function unionLength(intervals: Interval[]): number {
  if (intervals.length === 0) return 0;
  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  let total = 0;
  let cur = { ...sorted[0]! };
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]!;
    if (next.start <= cur.end) {
      cur.end = Math.max(cur.end, next.end);
    } else {
      total += cur.end - cur.start;
      cur = { ...next };
    }
  }
  total += cur.end - cur.start;
  return total;
}

export function normalizeEmail(email?: string | undefined): string | undefined {
  const e = email?.trim().toLowerCase();
  return e ? e : undefined;
}

/**
 * Merges records sharing an email (case-insensitive): minutes are summed, joinedAt is the earliest,
 * leftAt the latest; the first non-empty name wins. Records without email pass through untouched.
 */
export function mergeParticipantsByEmail(records: ParticipantRecord[]): ParticipantRecord[] {
  const out: ParticipantRecord[] = [];
  const byEmail = new Map<string, ParticipantRecord>();
  for (const r of records) {
    const email = normalizeEmail(r.email);
    if (!email) {
      out.push(r);
      continue;
    }
    const existing = byEmail.get(email);
    if (!existing) {
      const copy: ParticipantRecord = { ...r, email };
      byEmail.set(email, copy);
      out.push(copy);
      continue;
    }
    existing.durationMinutes += r.durationMinutes;
    if (r.joinedAt.getTime() < existing.joinedAt.getTime()) existing.joinedAt = r.joinedAt;
    if (r.leftAt.getTime() > existing.leftAt.getTime()) existing.leftAt = r.leftAt;
    if (!existing.name && r.name) existing.name = r.name;
  }
  return out;
}
