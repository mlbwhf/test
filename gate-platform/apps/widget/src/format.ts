// Pure helpers: money, dates, labels, currency selection. No DOM access.

const FORMAT_LABELS: Record<string, string> = {
  live_virtual: "Live virtual",
  in_person: "In person",
  hybrid: "Hybrid",
  self_paced: "Self-paced",
};

/** Human label for an event format code (unknown codes get their underscores replaced). */
export function formatLabel(format: string): string {
  return FORMAT_LABELS[format] ?? format.replace(/_/g, " ");
}

/** Integer minor units -> localized currency string. All currencies treated as 2-decimal. */
export function formatMoney(minor: number, currency: string, locale?: string): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

function safeTimeZone(timeZone: string | undefined): string | undefined {
  if (!timeZone) return undefined;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone });
    return timeZone;
  } catch {
    return undefined;
  }
}

/** Date only, e.g. "Nov 1, 2026", in the given zone (falls back to the viewer's zone). */
export function formatDate(iso: string, timeZone?: string, locale?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" };
  const tz = safeTimeZone(timeZone);
  if (tz) opts.timeZone = tz;
  return new Intl.DateTimeFormat(locale, opts).format(d);
}

/**
 * Date/time range in the event's time zone with the zone's short name, e.g.
 * "Nov 20, 2026, 9:00 AM – Nov 21, 2026, 5:00 PM EST" (same-day ranges collapse the second date).
 * An unknown time zone falls back to UTC.
 */
export function formatDateRange(startIso: string, endIso: string, timeZone: string, locale?: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return `${startIso} – ${endIso}`;
  const tz = safeTimeZone(timeZone) ?? "UTC";
  const dayFmt = new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric", timeZone: tz });
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone: tz });
  const zoneName =
    new Intl.DateTimeFormat(locale, { timeZoneName: "short", timeZone: tz })
      .formatToParts(end)
      .find((p) => p.type === "timeZoneName")?.value ?? tz;
  const startDay = dayFmt.format(start);
  const endDay = dayFmt.format(end);
  const left = `${startDay}, ${timeFmt.format(start)}`;
  const right = startDay === endDay ? timeFmt.format(end) : `${endDay}, ${timeFmt.format(end)}`;
  return `${left} – ${right} ${zoneName}`;
}

/** Union of currency codes across all ticket types, in order of first appearance. */
export function currencyUnion(
  cohorts: ReadonlyArray<{ ticketTypes: ReadonlyArray<{ prices: Record<string, number> }> }>,
): string[] {
  const seen = new Set<string>();
  for (const cohort of cohorts) {
    for (const tt of cohort.ticketTypes) {
      for (const code of Object.keys(tt.prices)) seen.add(code);
    }
  }
  return [...seen];
}

/** First preferred currency that is actually available, else the first available one. */
export function pickCurrency(
  available: readonly string[],
  ...preferred: ReadonlyArray<string | null | undefined>
): string | undefined {
  for (const code of preferred) {
    if (code && available.includes(code)) return code;
  }
  return available[0];
}

/** "Sold out" at 0, "N left" when 5 or fewer remain, otherwise null (no badge). */
export function remainingLabel(remaining: number): string | null {
  if (remaining <= 0) return "Sold out";
  if (remaining <= 5) return `${remaining} left`;
  return null;
}

export function sessionsLabel(count: number): string {
  if (count <= 0) return "Schedule to be announced";
  return count === 1 ? "1 session" : `${count} sessions`;
}
