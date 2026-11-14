// Find a class: courses grouped by the certification they lead to, with every upcoming class
// (date, place, language, seats). Pure functions, shared by the finder and the compare page.

import type { CatalogDate, CatalogItem } from "@/lib/catalog-types";

export type Cohort = {
  key: string;
  courseSlug: string;
  dateSlug: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  format: string;
  /** "EN", "FR"… or "" when the course has no language set. */
  lang: string;
  capacity: number;
  seatsLeft: number;
  priceMinor: number | null;
  dayStartsAt: string;
  dayEndsAt: string;
  days: number;
};

export type Cert = {
  /** Stable id: `${organizationId}~${course slug}` of the group's first course (also the compare id). */
  id: string;
  orgId: string;
  orgName: string;
  logoUrl: string | null;
  code: string;
  title: string;
  category: string;
  badgeName: string | null;
  badgeImage: string | null;
  blurb: string | null;
  tagline: string | null;
  included: string[];
  certificationBody: string | null;
  hours: number | null;
  currency: string;
  heldUntilDelivery: boolean;
  promoted: "top" | "category" | null;
  courses: CatalogItem[];
  cohorts: Cohort[];
};

const LANG_NAMES: Record<string, string> = { EN: "English", FR: "Français", ES: "Español", DE: "Deutsch", PT: "Português", IT: "Italiano", NL: "Nederlands", AR: "العربية" };

export function langName(code: string): string {
  if (LANG_NAMES[code]) return LANG_NAMES[code]!;
  try {
    return new Intl.DisplayNames([code.toLowerCase()], { type: "language" }).of(code.toLowerCase()) ?? code;
  } catch {
    return code;
  }
}

const STOP = new Set(["certified", "certification", "certificate", "course", "training", "program", "programme", "the", "of", "and", "for", "a", "an", "in", "to", "with", "on", "safe", "exam", "prep", "bootcamp", "workshop"]);

/** Short code for the badge ring: a parenthesised acronym when the name has one ("… (SPC)"), else initials ("Release Train Engineer" → "RTE"). */
export function badgeCode(name: string): string {
  const paren = name.match(/\(([A-Z][A-Z0-9-]{1,5})\)/);
  if (paren) return paren[1]!;
  const words = name.replace(/[®™©]/g, "").split(/[\s/]+/).filter(Boolean);
  let out = "";
  for (const w of words) {
    const clean = w.replace(/[^\p{L}\p{N}-]/gu, "");
    if (!clean || /^\d+(\.\d+)?$/.test(clean) || STOP.has(clean.toLowerCase())) continue;
    if (/-empowered$/i.test(clean)) continue;
    const acro = clean.match(/^([A-Z]{2,4})(?:-|$)/);
    out += acro ? acro[1] : clean[0]!.toUpperCase();
    if (out.length >= 4) break;
  }
  return out.slice(0, 4) || name.slice(0, 3).toUpperCase();
}

/** "America/Toronto" → "Toronto". */
export const cityOf = (tz: string) => (tz.includes("/") ? (tz.split("/").pop() ?? "").replace(/_/g, " ") : "");

export const isOnline = (c: Cohort) => c.format !== "in_person";
export const isInPerson = (c: Cohort) => c.format === "in_person" || c.format === "hybrid";

/** Where the class happens, short: "Online", "Toronto", "Toronto + online", "On demand". */
export function whereOf(c: Cohort): string {
  const city = cityOf(c.timezone);
  if (c.format === "self_paced") return "On demand";
  if (c.format === "in_person") return city || "In person";
  if (c.format === "hybrid") return city ? `${city} + online` : "Hybrid";
  return "Online";
}

function fmt(iso: string, tz: string, o: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, ...o }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...o }).format(new Date(iso));
  }
}

/** "Nov 16–18", "Nov 30 – Dec 2", "Nov 30" in the class's own zone (year added when it isn't this year). */
export function shortRange(c: Cohort, now = new Date()): string {
  const [m1, d1, y1] = [fmt(c.startsAt, c.timezone, { month: "short" }), fmt(c.startsAt, c.timezone, { day: "numeric" }), fmt(c.startsAt, c.timezone, { year: "numeric" })];
  const [m2, d2] = [fmt(c.endsAt, c.timezone, { month: "short" }), fmt(c.endsAt, c.timezone, { day: "numeric" })];
  const yr = y1 !== String(now.getUTCFullYear()) && Number(y1) > now.getUTCFullYear() ? `, ${y1}` : "";
  if (c.format === "self_paced") return "On demand";
  if (m1 !== m2) return `${m1} ${d1} – ${m2} ${d2}${yr}`;
  if (d1 !== d2) return `${m1} ${d1}–${d2}${yr}`;
  return `${m1} ${d1}${yr}`;
}

/** "2026-11": the month a class starts, in its own zone. */
export const monthOf = (c: Cohort) => `${fmt(c.startsAt, c.timezone, { year: "numeric" })}-${fmt(c.startsAt, c.timezone, { month: "2-digit" })}`;
export const monthLabel = (ym: string) => new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(new Date(`${ym}-15T12:00:00Z`));

/** "9:00 AM – 5:00 PM EST" for the first day, in the given zone. */
export function dayTimes(c: Cohort, tz: string): string {
  const zone = fmt(c.dayStartsAt, tz, { timeZoneName: "short" }).split(" ").pop() ?? "";
  return `${fmt(c.dayStartsAt, tz, { hour: "numeric", minute: "2-digit" })} – ${fmt(c.dayEndsAt, tz, { hour: "numeric", minute: "2-digit" })} ${zone}`.trim();
}

export function money(minor: number | null | undefined, currency: string | undefined): string {
  if (minor === null || minor === undefined || !currency) return "Sold out";
  if (minor === 0) return "Free";
  let digits = 2;
  try {
    digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
  const major = minor / 10 ** digits;
  const whole = Number.isInteger(major);
  return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol", maximumFractionDigits: whole ? 0 : digits, minimumFractionDigits: whole ? 0 : digits }).format(major);
}

export function majorUnits(minor: number, currency: string): number {
  try {
    return minor / 10 ** (new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2);
  } catch {
    return minor / 100;
  }
}

/** Cohorts of one course; older API responses only have dates' slug and start, so fill from the course. */
function cohortsOf(c: CatalogItem): Cohort[] {
  const lang = (c.language ?? "").toUpperCase();
  const dates: CatalogDate[] = c.dates?.length ? c.dates : [{ slug: "", startsAt: c.nextStartsAt }];
  return dates.map((d, i) => {
    const endsAt = d.endsAt ?? d.startsAt;
    return {
      key: `${c.organizationId}~${c.slug}~${d.slug || i}`,
      courseSlug: c.slug,
      dateSlug: d.slug,
      startsAt: d.startsAt,
      endsAt,
      timezone: d.timezone ?? "UTC",
      format: d.format ?? c.format ?? "live_virtual",
      lang,
      capacity: d.capacity ?? (i === 0 ? c.capacity ?? 0 : 0),
      seatsLeft: d.seatsLeft ?? (i === 0 ? c.seatsLeft ?? 0 : 0),
      priceMinor: d.priceMinor !== undefined ? d.priceMinor : i === 0 ? c.priceMinor ?? null : null,
      dayStartsAt: d.dayStartsAt ?? d.startsAt,
      dayEndsAt: d.dayEndsAt ?? endsAt,
      days: d.days ?? 1,
    };
  });
}

/**
 * One entry per certification: an organizer's courses that award the same badge (typically one
 * per language) merge into a single card. Courses without a badge stand alone.
 */
export function groupCertifications(items: CatalogItem[]): Cert[] {
  const groups = new Map<string, CatalogItem[]>();
  for (const c of items) {
    const k = c.digitalBadge?.name ? `${c.organizationId}~badge~${c.digitalBadge.name.trim().toLowerCase()}` : `${c.organizationId}~${c.slug}`;
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }
  const out: Cert[] = [];
  for (const courses of groups.values()) {
    // The default-language (or first listed) course names the card.
    const lead = courses.find((c) => !c.language || c.language.toLowerCase() === "en") ?? courses[0]!;
    const cohorts = courses.flatMap(cohortsOf).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    out.push({
      id: `${lead.organizationId}~${lead.slug}`,
      orgId: lead.organizationId,
      orgName: lead.organizationName,
      logoUrl: lead.logoUrl ?? null,
      // "(SPC)" in a course title names the certification best; else the badge, else the title.
      code: lead.name.match(/\(([A-Z][A-Z0-9-]{1,5})\)/)?.[1] ?? badgeCode(lead.digitalBadge?.name ?? lead.name),
      title: lead.name,
      category: lead.category ?? "other",
      badgeName: lead.digitalBadge?.name ?? null,
      badgeImage: lead.digitalBadge?.imageUrl ?? null,
      blurb: lead.description ?? null,
      tagline: lead.tagline ?? null,
      included: lead.included ?? [],
      certificationBody: lead.certificationBody ?? null,
      hours: lead.hours ?? null,
      currency: lead.currency ?? "USD",
      heldUntilDelivery: lead.heldUntilDelivery !== false,
      promoted: courses.find((c) => c.promoted === "top")?.promoted ?? courses.find((c) => c.promoted)?.promoted ?? null,
      courses,
      cohorts,
    });
  }
  return out;
}

/** Cheapest on-sale price among the given classes (same currency as the card). */
export function fromPrice(cohorts: Cohort[]): number | null {
  const p = cohorts.filter((c) => c.priceMinor !== null && (c.capacity === 0 || c.seatsLeft > 0)).map((c) => c.priceMinor!);
  return p.length ? Math.min(...p) : null;
}

/** "3 days", "80 h", "1 day". */
export function lengthOf(cert: Cert): string {
  const days = cert.cohorts[0]?.days ?? 1;
  if (days > 1 && days <= 5) return `${days} days`;
  if (cert.hours) return `${cert.hours} h`;
  return days === 1 ? "1 day" : `${days} sessions`;
}

export function formatLabel(cohorts: Cohort[]): string {
  if (cohorts.every((c) => c.format === "self_paced")) return "Self-paced";
  const online = cohorts.some(isOnline);
  const inPerson = cohorts.some(isInPerson);
  return online && inPerson ? "Online + in person" : inPerson ? "In person" : "Live online";
}

export const languagesOf = (cohorts: Cohort[]) => [...new Set(cohorts.map((c) => c.lang).filter(Boolean))];

/** A class is filling fast when a quarter of its seats or fewer remain (and at most 10). */
export const isLow = (c: Cohort) => c.capacity > 0 && c.seatsLeft > 0 && (c.seatsLeft <= 10 || c.seatsLeft <= c.capacity / 4);

export function seatsShort(c: Cohort): string {
  if (!c.capacity) return "Open";
  if (c.seatsLeft === 0) return "Full";
  return isLow(c) ? `${c.seatsLeft} left` : `${c.seatsLeft} seats`;
}

export function classUrl(appUrl: string, cert: Cert, c: Cohort): string {
  return `${appUrl}/c/${encodeURIComponent(cert.orgId)}/${encodeURIComponent(c.courseSlug)}${c.dateSlug ? `/${encodeURIComponent(c.dateSlug)}` : ""}?via=enrollclass`;
}

export function registerUrl(appUrl: string, cert: Cert, c: Cohort): string {
  return `${appUrl}/c/${encodeURIComponent(cert.orgId)}/${encodeURIComponent(c.courseSlug)}/register?${c.dateSlug ? `date=${encodeURIComponent(c.dateSlug)}&` : ""}via=enrollclass`;
}

/** The class to send "Register" to: the soonest with seats, else the soonest. */
export const nextOpen = (cohorts: Cohort[]) => cohorts.find((c) => c.capacity === 0 || c.seatsLeft > 0) ?? cohorts[0];
