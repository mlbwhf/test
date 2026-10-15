import type { Session } from "./types.js";

/**
 * Minimal, standards-compliant iCalendar builder: one VEVENT per session,
 * UTC timestamps, RFC 5545 escaping and 75-octet line folding. Pure.
 */
export interface IcsInput {
  /** Stable id prefix; each session gets `${uid}-${index}`. */
  uid: string;
  summary: string;
  description?: string | undefined;
  url?: string | undefined;
  location?: string | undefined;
  organizer?: { name: string; email: string } | undefined;
  attendeeEmail?: string | undefined;
  sessions: readonly Session[];
  /** When the cohort has no sessions, a single event from start to end. */
  fallback?: { startsAt: Date; endsAt: Date } | undefined;
  now?: Date | undefined;
  /** Sequence bumps when the schedule changes so calendars update in place. */
  sequence?: number | undefined;
}

export function buildIcs(input: IcsInput): string {
  const now = input.now ?? new Date();
  const blocks = input.sessions.length ? input.sessions : input.fallback ? [{ startsAt: input.fallback.startsAt, endsAt: input.fallback.endsAt }] : [];
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gate Platform//Training//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  blocks.forEach((s, i) => {
    const title = "title" in s && s.title ? `${input.summary} — ${s.title}` : blocks.length > 1 ? `${input.summary} (${i + 1}/${blocks.length})` : input.summary;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeText(input.uid)}-${i + 1}@gate`,
      `DTSTAMP:${toUtc(now)}`,
      `DTSTART:${toUtc(s.startsAt)}`,
      `DTEND:${toUtc(s.endsAt)}`,
      `SUMMARY:${escapeText(title)}`,
      `SEQUENCE:${input.sequence ?? 0}`,
      "STATUS:CONFIRMED",
    );
    if (input.description) lines.push(`DESCRIPTION:${escapeText(input.description)}`);
    if (input.url) lines.push(`URL:${input.url}`);
    if (input.location) lines.push(`LOCATION:${escapeText(input.location)}`);
    if (input.organizer) lines.push(`ORGANIZER;CN=${escapeParam(input.organizer.name)}:mailto:${input.organizer.email}`);
    if (input.attendeeEmail) lines.push(`ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:${input.attendeeEmail}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function toUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeText(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function escapeParam(v: string): string {
  return `"${v.replace(/"/g, "")}"`;
}
/** RFC 5545 §3.1: lines longer than 75 octets are folded with CRLF + single space. */
function fold(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let start = 0;
  let first = true;
  while (start < bytes.length) {
    const limit = first ? 75 : 74;
    let end = Math.min(start + limit, bytes.length);
    // Don't split a multi-byte UTF-8 sequence.
    while (end < bytes.length && (bytes[end]! & 0xc0) === 0x80) end -= 1;
    out.push((first ? "" : " ") + bytes.subarray(start, end).toString("utf8"));
    start = end;
    first = false;
  }
  return out.join("\r\n");
}
