// Times for class pages and checkout, shown in the visitor's own zone. Works on the server
// (in the cohort's zone) and in the browser (detected zone plus a few common ones).

export type Zone = { id: string; label: string };

/** Zones offered as one-tap choices; the visitor's detected zone is added in front when it isn't one of them. */
export const COMMON_ZONES: Zone[] = [
  { id: "America/Los_Angeles", label: "Pacific" },
  { id: "America/Denver", label: "Mountain" },
  { id: "America/Chicago", label: "Central" },
  { id: "America/New_York", label: "Eastern" },
  { id: "America/Halifax", label: "Atlantic" },
  { id: "Europe/London", label: "UK" },
  { id: "Europe/Paris", label: "Central Europe" },
];

function fmt(iso: string, tz: string, o: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, ...o }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...o }).format(new Date(iso));
  }
}

/** "EST", "GMT+1"... for the zone at that moment. */
export const zoneAbbr = (iso: string, tz: string) => fmt(iso, tz, { timeZoneName: "short" }).split(" ").pop() ?? tz;
/** "9:00 AM – 5:00 PM" */
export const timeRange = (start: string, end: string, tz: string) => `${fmt(start, tz, { hour: "numeric", minute: "2-digit" })} – ${fmt(end, tz, { hour: "numeric", minute: "2-digit" })}`;
/** "Mon, Nov 16" */
export const dayLabel = (iso: string, tz: string) => fmt(iso, tz, { weekday: "short", month: "short", day: "numeric" });
/** Hour of day (0–23) in the zone, for "runs into your evening" warnings. */
export const hourIn = (iso: string, tz: string) => Number(fmt(iso, tz, { hour: "numeric", hourCycle: "h23" }));

/** "Nov 16–18, 2026" / "Nov 30 – Dec 2, 2026" in the cohort's zone. */
export function dateRange(start: string, end: string, tz: string): string {
  const [m1, d1, y1] = [fmt(start, tz, { month: "short" }), fmt(start, tz, { day: "numeric" }), fmt(start, tz, { year: "numeric" })];
  const [m2, d2, y2] = [fmt(end, tz, { month: "short" }), fmt(end, tz, { day: "numeric" }), fmt(end, tz, { year: "numeric" })];
  if (y1 !== y2) return `${m1} ${d1}, ${y1} – ${m2} ${d2}, ${y2}`;
  if (m1 !== m2) return `${m1} ${d1} – ${m2} ${d2}, ${y2}`;
  if (d1 !== d2) return `${m1} ${d1}–${d2}, ${y2}`;
  return `${m1} ${d1}, ${y1}`;
}

/** The browser's zone, or null on the server or when it can't tell. */
export function detectedZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/** A readable name for any zone: a common one's label, else its city ("Asia/Kolkata" -> "Kolkata"). */
export function zoneName(tz: string): string {
  return COMMON_ZONES.find((z) => z.id === tz)?.label ?? (tz.split("/").pop() ?? tz).replace(/_/g, " ");
}
