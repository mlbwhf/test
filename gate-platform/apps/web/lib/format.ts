// Formatting helpers. Money is always handled as integer minor units (cents).

const LOCALE = "en-US";

const currencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string): Intl.NumberFormat {
  const key = currency.toUpperCase();
  let fmt = currencyFormatters.get(key);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: key });
    } catch {
      // Unknown ISO code: fall back to a plain decimal with the code appended.
      fmt = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    currencyFormatters.set(key, fmt);
  }
  return fmt;
}

/** Number of minor-unit digits for a currency (2 for EUR/USD, 0 for JPY, 3 for KWD...). */
export function minorUnitDigits(currency: string): number {
  const digits = currencyFormatter(currency).resolvedOptions().maximumFractionDigits;
  return typeof digits === "number" ? digits : 2;
}

/** Format integer minor units as a localized currency string, e.g. 1250 + "EUR" -> "€12.50". */
export function formatMoney(minor: number, currency: string): string {
  const fmt = currencyFormatter(currency);
  const digits = minorUnitDigits(currency);
  const major = minor / 10 ** digits;
  const out = fmt.format(major);
  return fmt.resolvedOptions().style === "currency" ? out : `${out} ${currency.toUpperCase()}`;
}

/** Convert a major-unit decimal string from a form ("12.50") into integer minor units (1250). */
export function parseMajorToMinor(input: string, currency: string): number | null {
  const trimmed = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const digits = minorUnitDigits(currency);
  const [whole = "0", frac = ""] = trimmed.split(".");
  if (frac.length > digits) return null;
  const minor = Number(whole) * 10 ** digits + Number(frac.padEnd(digits, "0") || "0");
  return Number.isSafeInteger(minor) ? minor : null;
}

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/** Format an ISO timestamp as a stable, UTC-based date/time string. */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${dateTimeFormatter.format(d)} UTC`;
}

/** Shorten long opaque identifiers / secrets for display: "pi_3Nabc…_secret_xyz" -> "pi_3Nabc…". */
export function truncate(value: string, keep = 12): string {
  if (value.length <= keep + 1) return value;
  return `${value.slice(0, keep)}…`;
}

// ---------------------------------------------------------------------------
// Time zones. Cohort sessions are entered as wall-clock times in the cohort's
// IANA time zone and stored as ISO strings with an explicit UTC offset.

const zoneFormatters = new Map<string, Intl.DateTimeFormat>();

/** Returns a cached per-zone formatter, or null when the zone is not a valid IANA name. */
function zoneFormatter(timeZone: string): Intl.DateTimeFormat | null {
  let fmt = zoneFormatters.get(timeZone);
  if (fmt) return fmt;
  try {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return null;
  }
  zoneFormatters.set(timeZone, fmt);
  return fmt;
}

/** True when `timeZone` is an IANA zone this runtime knows about. */
export function isValidTimeZone(timeZone: string): boolean {
  return zoneFormatter(timeZone) !== null;
}

type WallClock = { year: number; month: number; day: number; hour: number; minute: number; second: number };

/** Wall-clock components of a UTC instant as seen in `timeZone`. */
function wallClockIn(fmt: Intl.DateTimeFormat, instantMs: number): WallClock {
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, number>> = {};
  for (const p of fmt.formatToParts(new Date(instantMs))) {
    if (p.type !== "literal") parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year ?? 0,
    month: parts.month ?? 0,
    day: parts.day ?? 0,
    hour: (parts.hour ?? 0) % 24, // some engines print "24" for midnight
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  };
}

function wallClockAsUtcMs(w: WallClock): number {
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
}

/** Zone offset (ms east of UTC) in effect at `instantMs`. */
function zoneOffsetMs(fmt: Intl.DateTimeFormat, instantMs: number): number {
  return wallClockAsUtcMs(wallClockIn(fmt, instantMs)) - instantMs;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatOffset(offsetMs: number): string {
  const sign = offsetMs < 0 ? "-" : "+";
  const abs = Math.abs(offsetMs) / 60_000;
  return `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

/**
 * Interpret a form date ("2026-03-08") and time ("09:30") as wall-clock time in
 * `timeZone` and return an ISO-8601 string carrying that zone's offset, e.g.
 * "2026-03-08T09:30:00-05:00". Returns null for malformed input, an unknown
 * zone, or a wall time that does not exist in the zone (a DST "spring forward"
 * gap) — the result is always read back through Intl and must round-trip to
 * exactly the components that were entered.
 */
export function zonedTimeToIso(dateStr: string, timeStr: string, timeZone: string): string | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  const tm = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(timeStr.trim());
  if (!dm || !tm) return null;
  const fmt = zoneFormatter(timeZone);
  if (!fmt) return null;

  const wanted: WallClock = {
    year: Number(dm[1]),
    month: Number(dm[2]),
    day: Number(dm[3]),
    hour: Number(tm[1]),
    minute: Number(tm[2]),
    second: Number(tm[3] ?? "0"),
  };
  if (wanted.month < 1 || wanted.month > 12 || wanted.day < 1 || wanted.day > 31) return null;
  if (wanted.hour > 23 || wanted.minute > 59 || wanted.second > 59) return null;

  // Treat the wall time as if it were UTC, then correct by the zone offset.
  // Two passes handle the case where the first guess straddles a DST change.
  const asUtc = wallClockAsUtcMs(wanted);
  if (Number.isNaN(asUtc)) return null;
  let instant = asUtc - zoneOffsetMs(fmt, asUtc);
  instant = asUtc - zoneOffsetMs(fmt, instant);

  // Sanity check: read it back. If the components differ, the wall time does
  // not exist in this zone (or the date was invalid, e.g. Feb 30).
  const back = wallClockIn(fmt, instant);
  const same =
    back.year === wanted.year &&
    back.month === wanted.month &&
    back.day === wanted.day &&
    back.hour === wanted.hour &&
    back.minute === wanted.minute &&
    back.second === wanted.second;
  if (!same) return null;

  const offset = zoneOffsetMs(fmt, instant);
  return (
    `${wanted.year}-${pad2(wanted.month)}-${pad2(wanted.day)}` +
    `T${pad2(wanted.hour)}:${pad2(wanted.minute)}:${pad2(wanted.second)}${formatOffset(offset)}`
  );
}

const zoneDisplayFormatters = new Map<string, Intl.DateTimeFormat>();

/** Format an ISO timestamp in a given IANA zone, e.g. "Mar 8, 2026, 9:30 AM EST". */
export function formatDateTimeInZone(iso: string, timeZone: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  let fmt = zoneDisplayFormatters.get(timeZone);
  if (!fmt) {
    try {
      fmt = new Intl.DateTimeFormat(LOCALE, {
        timeZone,
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch {
      return formatDateTime(iso);
    }
    zoneDisplayFormatters.set(timeZone, fmt);
  }
  return fmt.format(d);
}

/** Format a time-only string in a zone, e.g. "9:30 AM". */
export function formatTimeInZone(iso: string, timeZone: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(LOCALE, { timeZone, hour: "numeric", minute: "2-digit" }).format(d);
  } catch {
    return formatDateTime(iso);
  }
}

/** "live_virtual" -> "Live virtual", "tax_reserve" -> "Tax reserve". */
export function humanize(value: string): string {
  const s = value.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
