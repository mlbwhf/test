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
  /**
   * PUBLISH (default): a calendar file the reader may import.
   * REQUEST: an invitation; mail apps show it as an event with RSVP and add it to the
   * calendar. Needs an organizer, and the sessions must form one daily series (see
   * dailySeries); buildInvite picks the right one.
   */
  method?: "PUBLISH" | "REQUEST" | undefined;
  attendeeName?: string | undefined;
}

/** Sessions that repeat daily at the same time and length, e.g. a 3-day 9–5 bootcamp. */
export function dailySeries(sessions: readonly Session[]): { startsAt: Date; endsAt: Date; count: number } | undefined {
  if (sessions.length < 2) return undefined;
  const sorted = [...sessions].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const len = sorted[0]!.endsAt.getTime() - sorted[0]!.startsAt.getTime();
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]!.startsAt.getTime() - sorted[i - 1]!.startsAt.getTime() !== 86_400_000) return undefined;
    if (sorted[i]!.endsAt.getTime() - sorted[i]!.startsAt.getTime() !== len) return undefined;
  }
  return { startsAt: sorted[0]!.startsAt, endsAt: sorted[0]!.endsAt, count: sorted.length };
}

/**
 * The calendar part of a confirmation email: an invitation when it can be one (organizer
 * known, single block or a daily series), otherwise a PUBLISH file with every session.
 * iTIP allows one event per invitation, which is why irregular schedules fall back.
 */
export function buildInvite(input: Omit<IcsInput, "method">): { ics: string; method: "PUBLISH" | "REQUEST" } {
  const single = input.sessions.length === 0 ? input.fallback : input.sessions.length === 1 ? input.sessions[0] : undefined;
  const series = dailySeries(input.sessions);
  if (!input.organizer || !input.attendeeEmail || (!single && !series)) return { ics: buildIcs({ ...input, method: "PUBLISH" }), method: "PUBLISH" };
  return { ics: buildIcs({ ...input, method: "REQUEST" }), method: "REQUEST" };
}

export function buildIcs(input: IcsInput): string {
  const now = input.now ?? new Date();
  const blocks = input.sessions.length ? input.sessions : input.fallback ? [{ startsAt: input.fallback.startsAt, endsAt: input.fallback.endsAt }] : [];
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EnrollClass//Training//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${input.method ?? "PUBLISH"}`,
  ];
  if (input.method === "REQUEST") {
    const single = blocks.length === 1 ? blocks[0]! : undefined;
    const series = single ? undefined : dailySeries(input.sessions);
    const first = single ?? series!;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeText(input.uid)}@gate`,
      `DTSTAMP:${toUtc(now)}`,
      `DTSTART:${toUtc(first.startsAt)}`,
      `DTEND:${toUtc(first.endsAt)}`,
      ...(series ? [`RRULE:FREQ=DAILY;COUNT=${series.count}`] : []),
      `SUMMARY:${escapeText(input.summary)}`,
      `SEQUENCE:${input.sequence ?? 0}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
    );
    if (input.description) lines.push(`DESCRIPTION:${escapeText(input.description)}`);
    if (input.url) lines.push(`URL:${input.url}`);
    if (input.location) lines.push(`LOCATION:${escapeText(input.location)}`);
    lines.push(`ORGANIZER;CN=${escapeParam(input.organizer!.name)}:mailto:${input.organizer!.email}`);
    lines.push(`ATTENDEE;${input.attendeeName ? `CN=${escapeParam(input.attendeeName)};` : ""}CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=FALSE:mailto:${input.attendeeEmail}`);
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Starts in 1 hour", "TRIGGER:-PT1H", "END:VALARM", "END:VEVENT", "END:VCALENDAR");
    return lines.map(fold).join("\r\n") + "\r\n";
  }
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
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
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
