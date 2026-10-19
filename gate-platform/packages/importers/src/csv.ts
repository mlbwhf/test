import { buildPlan, courseNameFrom, durationDaysBetween, slugify, type ImportFormat, type ImportItem, type ImportPlan } from "./plan.js";

// CSV import for sources without an API (Corsizio exports, spreadsheets, Eventbrite CSV).
// Headers are matched loosely: "Start Date", "starts_at", "Start" and "Begins" all map to
// the start column. Download the template from the dashboard for the canonical names.

/** RFC 4180 parser: quoted fields, doubled quotes, CRLF, embedded newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === "," || ch === ";" && !src.includes(",")) { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

type Column = "name" | "course" | "startsAt" | "endsAt" | "startTime" | "endTime" | "timezone" | "currency" | "price" | "seats" | "sold" | "format" | "location" | "description" | "ticketName" | "status" | "url";

const ALIASES: Record<Column, string[]> = {
  name: ["name", "event", "event name", "event title", "title", "cohort", "class", "class name", "session name", "course name"],
  course: ["course", "program", "programme", "product", "course title", "parent"],
  startsAt: ["start", "starts", "starts at", "start date", "start date/time", "start datetime", "begins", "date", "event start date", "start_date", "from"],
  endsAt: ["end", "ends", "ends at", "end date", "end date/time", "end datetime", "finishes", "event end date", "end_date", "to", "until"],
  startTime: ["start time", "time", "starts time"],
  endTime: ["end time", "ends time"],
  timezone: ["timezone", "time zone", "tz"],
  currency: ["currency", "currency code"],
  price: ["price", "cost", "fee", "amount", "ticket price", "regular price", "list price", "price per seat"],
  seats: ["seats", "capacity", "quantity", "max attendees", "maximum attendees", "max seats", "spots", "places", "available seats", "total seats", "quantity total"],
  sold: ["sold", "registered", "registrations", "attendees", "enrolled", "quantity sold", "filled"],
  format: ["format", "type", "delivery", "mode", "attendance type"],
  location: ["location", "venue", "address", "city", "place", "where"],
  description: ["description", "summary", "details", "about"],
  ticketName: ["ticket", "ticket name", "ticket type", "ticket class", "ticket class name"],
  status: ["status", "state"],
  url: ["url", "link", "event url", "page"],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").replace(/[^a-z0-9/ ]/g, "");
}

export function detectColumns(headers: string[]): Partial<Record<Column, number>> {
  const out: Partial<Record<Column, number>> = {};
  const norm = headers.map(normalizeHeader);
  for (const [col, aliases] of Object.entries(ALIASES) as Array<[Column, string[]]>) {
    const idx = norm.findIndex((h) => aliases.includes(h));
    if (idx >= 0 && !Object.values(out).includes(idx)) out[col] = idx;
  }
  // "course name" doubles as the event name when there is no better name column.
  if (out.name === undefined && out.course !== undefined) out.name = out.course;
  return out;
}

const MONTH_INDEX: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };

/**
 * Parses "2026-11-12", "2026-11-12 09:00", "11/12/2026 9:00 AM", "Nov 12, 2026 9:00am",
 * "12 Nov 2026" and ISO strings. Returns wall-clock parts; the caller applies the time zone.
 */
export function parseDateParts(raw: string, timeRaw?: string): { y: number; m: number; d: number; hh: number; mm: number; hasTime: boolean; zoned: boolean; iso?: string } | undefined {
  const s = raw.trim();
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return { y: 0, m: 0, d: 0, hh: 0, mm: 0, hasTime: true, zoned: true, iso: d.toISOString() };
  }
  let y: number | undefined, m: number | undefined, d: number | undefined;
  let rest = s;
  let match: RegExpMatchArray | null;
  if ((match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(.*)$/))) { y = +match[1]!; m = +match[2]! - 1; d = +match[3]!; rest = match[4]!; }
  else if ((match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/))) { y = +match[3]!; m = +match[1]! - 1; d = +match[2]!; rest = match[4]!; }
  else if ((match = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(.*)$/))) { y = +match[3]!; m = +match[2]! - 1; d = +match[1]!; rest = match[4]!; }
  else if ((match = s.match(/^(?:[a-z]+,?\s+)?([a-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})(.*)$/i))) { m = MONTH_INDEX[match[1]!.slice(0, 3).toLowerCase()]; d = +match[2]!; y = +match[3]!; rest = match[4]!; }
  else if ((match = s.match(/^(\d{1,2})\s+([a-z]{3,9})\.?,?\s+(\d{4})(.*)$/i))) { d = +match[1]!; m = MONTH_INDEX[match[2]!.slice(0, 3).toLowerCase()]; y = +match[3]!; rest = match[4]!; }
  if (y === undefined || m === undefined || d === undefined || Number.isNaN(m)) return undefined;
  const time = (timeRaw?.trim() || rest).trim().replace(/^[T,@]\s*|^at\s+/i, "");
  const t = time.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/i);
  let hh = 0, mm = 0, hasTime = false;
  if (t && time) {
    hh = +t[1]!; mm = t[2] ? +t[2] : 0; hasTime = true;
    const ap = t[3]?.toLowerCase().replace(/\./g, "");
    if (ap === "pm" && hh < 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;
  }
  return { y, m, d, hh, mm, hasTime, zoned: false };
}

/** Wall-clock parts in an IANA zone to a UTC ISO string (offset found by fixed-point). */
export function zonedToIso(parts: { y: number; m: number; d: number; hh: number; mm: number }, timezone: string): string {
  const asUtc = Date.UTC(parts.y, parts.m, parts.d, parts.hh, parts.mm);
  let guess = asUtc;
  for (let i = 0; i < 3; i++) {
    const offset = offsetMinutes(new Date(guess), timezone);
    const next = asUtc - offset * 60_000;
    if (next === guess) break;
    guess = next;
  }
  return new Date(guess).toISOString();
}

function offsetMinutes(at: Date, timezone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = Object.fromEntries(dtf.formatToParts(at).map((x) => [x.type, x.value]));
  const local = Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour! % 24, +p.minute!, +p.second!);
  return Math.round((local - at.getTime()) / 60_000);
}

export function parseMoneyMinor(raw: string, currency: string): number | undefined {
  const s = raw.trim().toLowerCase();
  if (!s || s === "free" || s === "0" || s === "-") return 0;
  const cleaned = s.replace(/[^\d.,-]/g, "");
  if (!cleaned) return undefined;
  // "1.234,56" vs "1,234.56": the last separator is the decimal one when two kinds appear.
  let normalized = cleaned;
  if (cleaned.includes(",") && cleaned.includes(".")) normalized = cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".") ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned.replace(/,/g, "");
  else if (cleaned.includes(",")) normalized = /,\d{1,2}$/.test(cleaned) ? cleaned.replace(",", ".") : cleaned.replace(/,/g, "");
  const major = Number(normalized);
  if (!Number.isFinite(major) || major < 0) return undefined;
  const zeroDecimal = ["JPY", "KRW", "VND", "CLP", "ISK", "HUF", "UGX", "XOF", "XAF"].includes(currency);
  return Math.round(major * (zeroDecimal ? 1 : 100));
}

function formatFrom(raw: string | undefined, location: string | undefined): ImportFormat {
  const s = `${raw ?? ""} ${location ?? ""}`.toLowerCase();
  if (/self[- ]?paced|on[- ]?demand|recorded/.test(s)) return "self_paced";
  if (/hybrid/.test(s)) return "hybrid";
  if (/online|virtual|zoom|teams|remote|webinar|live online/.test(s)) return "live_virtual";
  if (/in[- ]?person|classroom|on[- ]?site|venue|room|street|st\.|ave|suite|floor/.test(s) || (location && location.trim())) return "in_person";
  return "live_virtual";
}

function isValidZone(tz: string): boolean {
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; }
}

export interface CsvImportOptions {
  /** Used when a row has no time zone column. */
  defaultTimezone?: string;
  /** Used when a row has no currency column. */
  defaultCurrency?: string;
}

export function planFromCsv(text: string, opts: CsvImportOptions = {}): ImportPlan & { columns: string[]; unmatchedHeaders: string[] } {
  const rows = parseCsv(text);
  const items: ImportItem[] = [];
  const skipped: ImportPlan["skipped"] = [];
  if (rows.length < 2) return { ...buildPlan("csv", [], [{ sourceId: "0", name: "(file)", reason: rows.length === 0 ? "empty file" : "only a header row" }]), columns: [], unmatchedHeaders: [] };
  const headers = rows[0]!;
  const cols = detectColumns(headers);
  const unmatchedHeaders = headers.filter((_, i) => !Object.values(cols).includes(i));
  if (cols.name === undefined || cols.startsAt === undefined) {
    return { ...buildPlan("csv", [], [{ sourceId: "0", name: "(header)", reason: `need a name column and a start date column; found: ${headers.join(", ")}` }]), columns: Object.keys(cols), unmatchedHeaders };
  }
  const cell = (row: string[], c: Column): string | undefined => (cols[c] === undefined ? undefined : row[cols[c]!]?.trim() || undefined);

  // Rows with the same name and start are the same cohort with several ticket types.
  const byKey = new Map<string, ImportItem>();
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]!;
    const sourceId = String(r + 1);
    const name = cell(row, "name");
    if (!name) { skipped.push({ sourceId, name: "(blank)", reason: "no name" }); continue; }
    const status = cell(row, "status")?.toLowerCase();
    if (status && /cancel|deleted|archived/.test(status)) { skipped.push({ sourceId, name, reason: `status "${status}"` }); continue; }
    const warnings: string[] = [];
    const tzRaw = cell(row, "timezone");
    let timezone = tzRaw && isValidZone(tzRaw) ? tzRaw : opts.defaultTimezone ?? "UTC";
    if (tzRaw && !isValidZone(tzRaw)) warnings.push(`unknown time zone "${tzRaw}", used ${timezone}`);
    const currency = (cell(row, "currency") ?? opts.defaultCurrency ?? "USD").toUpperCase().slice(0, 3);
    const startParts = parseDateParts(cell(row, "startsAt") ?? "", cell(row, "startTime"));
    if (!startParts) { skipped.push({ sourceId, name, reason: `cannot read start date "${cell(row, "startsAt") ?? ""}"` }); continue; }
    if (startParts.zoned && !tzRaw) timezone = opts.defaultTimezone ?? "UTC";
    const startsAt = startParts.iso ?? zonedToIso(startParts.hasTime ? startParts : { ...startParts, hh: 9, mm: 0 }, timezone);
    if (!startParts.hasTime && !startParts.zoned) warnings.push("no start time in the file; set to 09:00");
    let endsAt: string | undefined;
    const endParts = parseDateParts(cell(row, "endsAt") ?? "", cell(row, "endTime"));
    if (endParts) {
      endsAt = endParts.iso ?? zonedToIso(endParts.hasTime ? endParts : { ...endParts, hh: 17, mm: 0 }, timezone);
      if (new Date(endsAt) <= new Date(startsAt)) { warnings.push("end is not after start; end dropped"); endsAt = undefined; }
    }
    const priceRaw = cell(row, "price");
    const priceMinor = priceRaw === undefined ? 0 : parseMoneyMinor(priceRaw, currency);
    if (priceMinor === undefined) warnings.push(`cannot read price "${priceRaw}"; set to 0`);
    if (priceRaw === undefined) warnings.push("no price column; tickets set to 0");
    const seatsRaw = cell(row, "seats");
    const seats = seatsRaw ? Number.parseInt(seatsRaw.replace(/[^\d]/g, ""), 10) : NaN;
    const quantity = Number.isFinite(seats) && seats > 0 ? seats : 20;
    if (!(Number.isFinite(seats) && seats > 0)) warnings.push("no seat capacity in the file; defaulted to 20");
    const soldRaw = cell(row, "sold");
    const sold = soldRaw ? Number.parseInt(soldRaw.replace(/[^\d]/g, ""), 10) : NaN;
    const ticket = { name: cell(row, "ticketName") ?? "Seat", priceMinor: priceMinor ?? 0, quantity, ...(Number.isFinite(sold) ? { sold } : {}) };
    if (new Date(startsAt).getTime() < Date.now()) warnings.push("starts in the past");

    const key = `${name.toLowerCase()}|${startsAt}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.ticketTypes.push(ticket);
      for (const w of warnings) if (!existing.warnings.includes(w)) existing.warnings.push(w);
      continue;
    }
    const courseName = cell(row, "course") ?? courseNameFrom(name);
    const description = cell(row, "description");
    const durationDays = durationDaysBetween(startsAt, endsAt);
    const url = cell(row, "url");
    const item: ImportItem = {
      source: "csv",
      sourceId,
      ...(url ? { sourceUrl: url } : {}),
      course: { slug: slugify(courseName), name: courseName, ...(description ? { description: description.slice(0, 5000) } : {}), ...(durationDays ? { durationDays } : {}) },
      event: { name, startsAt, ...(endsAt ? { endsAt } : {}), timezone, currency, format: formatFrom(cell(row, "format"), cell(row, "location")) },
      ticketTypes: [ticket],
      ...(status ? { sourceStatus: status } : {}),
      warnings,
    };
    byKey.set(key, item);
    items.push(item);
  }
  return { ...buildPlan("csv", items, skipped), columns: Object.keys(cols), unmatchedHeaders };
}

/** Canonical header row plus one example, offered as a download in the dashboard. */
export const CSV_TEMPLATE =
  "name,course,start,end,timezone,currency,price,seats,format,location,description\n" +
  '"PMP Exam Prep - Nov 2026","PMP Exam Prep",2026-11-12 09:00,2026-11-14 17:00,America/Toronto,USD,1495.00,20,live_virtual,,"Three-day live online bootcamp."\n';
