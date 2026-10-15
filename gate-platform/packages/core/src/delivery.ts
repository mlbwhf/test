import type { Attendance, Event, Seat, SequenceStep } from "./types.js";

/** Certification-body roster formats. Columns map header -> seat field. */
export type RosterField = "firstName" | "lastName" | "fullName" | "email" | "company" | "status" | "orderId" | "seatId" | "cohort" | "startDate";
export interface RosterFormat { name: string; columns: Array<{ header: string; field: RosterField }> }

export const ROSTER_FORMATS: Record<string, RosterFormat> = {
  default: { name: "Default", columns: [{ header: "name", field: "fullName" }, { header: "email", field: "email" }, { header: "company", field: "company" }, { header: "status", field: "status" }, { header: "orderId", field: "orderId" }] },
  // Column names follow the common partner-portal import template; confirm against the body's current template before each upload.
  safe_studio: { name: "SAFe Studio", columns: [{ header: "First Name", field: "firstName" }, { header: "Last Name", field: "lastName" }, { header: "Email", field: "email" }, { header: "Company", field: "company" }] },
  scrum_org: { name: "Scrum.org", columns: [{ header: "FirstName", field: "firstName" }, { header: "LastName", field: "lastName" }, { header: "Email", field: "email" }] },
};

export function splitName(name: string | undefined): { first: string; last: string } {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0]!, last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1]! };
}

export function rosterCsv(seats: Seat[], event: Event, format: RosterFormat): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = seats.map((s) => {
    const { first, last } = splitName(s.attendee.name);
    const values: Record<RosterField, string> = {
      firstName: first, lastName: last, fullName: s.attendee.name ?? "", email: s.attendee.email, company: s.attendee.company ?? "", status: s.status, orderId: s.orderId, seatId: s.id, cohort: event.name, startDate: event.startsAt.toISOString().slice(0, 10),
    };
    return format.columns.map((c) => esc(values[c.field])).join(",");
  });
  return [format.columns.map((c) => esc(c.header)).join(","), ...rows].join("\r\n") + "\r\n";
}

/** Attendance thresholds as fractions of scheduled minutes. */
export function attendanceFromMinutes(minutes: number, scheduledMinutes: number, sessionsAttended: number, now: Date): Attendance {
  const frac = scheduledMinutes > 0 ? minutes / scheduledMinutes : 0;
  return { status: frac >= 0.75 ? "present" : frac >= 0.25 ? "partial" : "absent", minutes: Math.round(minutes), sessionsAttended, source: "provider", updatedAt: now };
}

/** Overlap of a participant's interval with the cohort's sessions. */
export function overlapMinutes(joinedAt: Date, leftAt: Date, sessions: Array<{ startsAt: Date; endsAt: Date }>): { minutes: number; sessionsTouched: Set<number> } {
  let minutes = 0;
  const touched = new Set<number>();
  sessions.forEach((s, i) => {
    const start = Math.max(joinedAt.getTime(), s.startsAt.getTime());
    const end = Math.min(leftAt.getTime(), s.endsAt.getTime());
    if (end > start) {
      const m = (end - start) / 60_000;
      minutes += m;
      if (m >= ((s.endsAt.getTime() - s.startsAt.getTime()) / 60_000) * 0.5) touched.add(i);
    }
  });
  return { minutes, sessionsTouched: touched };
}

/** When each sequence step becomes due, relative to the cohort. */
export function stepDueAt(step: SequenceStep, event: Event): Date {
  const start = event.startsAt.getTime();
  const end = (event.endsAt ?? event.startsAt).getTime();
  const H = 3_600_000;
  switch (step) {
    case "prework_t14": return new Date(start - 14 * 24 * H);
    case "reminder_t7": return new Date(start - 7 * 24 * H);
    case "reminder_t1": return new Date(start - 24 * H);
    case "day_of": return new Date(start - 2 * H);
    case "survey": return new Date(end + 2 * H);
    case "certificate": return new Date(end + 24 * H);
  }
}

export const SEQUENCE_STEPS: SequenceStep[] = ["prework_t14", "reminder_t7", "reminder_t1", "day_of", "survey", "certificate"];
