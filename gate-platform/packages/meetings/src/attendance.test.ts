import { describe, expect, it } from "vitest";
import { mergeParticipantsByEmail, summarizeAttendance } from "./attendance.js";
import type { ParticipantRecord } from "./types.js";

const d = (s: string) => new Date(s);
const rec = (email: string | undefined, join: string, leave: string, name?: string): ParticipantRecord => {
  const r: ParticipantRecord = { joinedAt: d(join), leftAt: d(leave), durationMinutes: Math.ceil((d(leave).getTime() - d(join).getTime()) / 60_000) };
  if (email !== undefined) r.email = email;
  if (name !== undefined) r.name = name;
  return r;
};

// Two 4-hour days: 480 scheduled minutes.
const sessions = [
  { startsAt: d("2026-11-20T09:00:00Z"), endsAt: d("2026-11-20T13:00:00Z") },
  { startsAt: d("2026-11-21T09:00:00Z"), endsAt: d("2026-11-21T13:00:00Z") },
];

describe("summarizeAttendance", () => {
  it("classifies a two-session cohort", () => {
    const records = [
      // Full attendee: both days, small gaps.
      rec("Full@Example.com", "2026-11-20T09:01:00Z", "2026-11-20T12:58:00Z"),
      rec("full@example.com", "2026-11-21T09:00:00Z", "2026-11-21T13:00:00Z"),
      // One-day attendee: all of day 1 only.
      rec("oneday@example.com", "2026-11-20T09:00:00Z", "2026-11-20T13:00:00Z"),
      // Drop-in: 5 minutes.
      rec("dropin@example.com", "2026-11-21T10:00:00Z", "2026-11-21T10:05:00Z"),
      // No email: cannot be matched.
      rec(undefined, "2026-11-20T09:00:00Z", "2026-11-20T13:00:00Z", "Dial-in user"),
    ];
    const { byEmail, unmatched } = summarizeAttendance(records, sessions);

    expect(byEmail.get("full@example.com")).toEqual({ minutes: 477, sessionsAttended: 2, status: "present" });
    expect(byEmail.get("oneday@example.com")).toEqual({ minutes: 240, sessionsAttended: 1, status: "partial" });
    expect(byEmail.get("dropin@example.com")).toEqual({ minutes: 5, sessionsAttended: 0, status: "absent" });
    expect(byEmail.size).toBe(3);
    expect(unmatched).toHaveLength(1);
    expect(unmatched[0]!.name).toBe("Dial-in user");
  });

  it("clips overlap to the session window", () => {
    // Joined an hour early, left an hour late on day 1 only: counts as 240, not 360.
    const records = [rec("early@example.com", "2026-11-20T08:00:00Z", "2026-11-20T14:00:00Z")];
    const { byEmail } = summarizeAttendance(records, sessions);
    expect(byEmail.get("early@example.com")).toEqual({ minutes: 240, sessionsAttended: 1, status: "partial" });
    // Entirely outside any session: zero.
    const out = summarizeAttendance([rec("x@example.com", "2026-11-22T09:00:00Z", "2026-11-22T13:00:00Z")], sessions);
    expect(out.byEmail.get("x@example.com")).toEqual({ minutes: 0, sessionsAttended: 0, status: "absent" });
  });

  it("does not double count overlapping intervals from the same person", () => {
    const records = [
      rec("two@example.com", "2026-11-20T09:00:00Z", "2026-11-20T13:00:00Z"),
      rec("two@example.com", "2026-11-20T09:00:00Z", "2026-11-20T13:00:00Z"), // second device
    ];
    const { byEmail } = summarizeAttendance(records, sessions);
    expect(byEmail.get("two@example.com")!.minutes).toBe(240);
  });

  it("honours custom thresholds and the 50% per-session rule", () => {
    const records = [rec("half@example.com", "2026-11-20T09:00:00Z", "2026-11-20T11:00:00Z")]; // 120 of 480 = 25%
    const def = summarizeAttendance(records, sessions);
    expect(def.byEmail.get("half@example.com")).toEqual({ minutes: 120, sessionsAttended: 1, status: "partial" });
    const strict = summarizeAttendance(records, sessions, { partialThreshold: 0.3 });
    expect(strict.byEmail.get("half@example.com")!.status).toBe("absent");
    const lenient = summarizeAttendance(records, sessions, { presentThreshold: 0.25 });
    expect(lenient.byEmail.get("half@example.com")!.status).toBe("present");
    const justUnder = summarizeAttendance([rec("u@example.com", "2026-11-20T09:00:00Z", "2026-11-20T10:59:00Z")], sessions);
    expect(justUnder.byEmail.get("u@example.com")!.sessionsAttended).toBe(0);
  });

  it("handles an empty schedule", () => {
    const { byEmail, unmatched } = summarizeAttendance([rec("a@example.com", "2026-11-20T09:00:00Z", "2026-11-20T10:00:00Z")], []);
    expect(byEmail.get("a@example.com")).toEqual({ minutes: 0, sessionsAttended: 0, status: "absent" });
    expect(unmatched).toEqual([]);
  });
});

describe("mergeParticipantsByEmail", () => {
  it("sums minutes, keeps earliest join and latest leave, and lower-cases email", () => {
    const merged = mergeParticipantsByEmail([
      { email: "A@X.com", name: "A", joinedAt: d("2026-01-01T10:00:00Z"), leftAt: d("2026-01-01T10:30:00Z"), durationMinutes: 30 },
      { email: "a@x.com", joinedAt: d("2026-01-01T09:50:00Z"), leftAt: d("2026-01-01T10:10:00Z"), durationMinutes: 20 },
      { joinedAt: d("2026-01-01T09:00:00Z"), leftAt: d("2026-01-01T09:05:00Z"), durationMinutes: 5 },
    ]);
    expect(merged).toHaveLength(2);
    expect(merged[0]).toEqual({ email: "a@x.com", name: "A", joinedAt: d("2026-01-01T09:50:00Z"), leftAt: d("2026-01-01T10:30:00Z"), durationMinutes: 50 });
    expect(merged[1]!.email).toBeUndefined();
  });
});
