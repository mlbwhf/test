// An import plan is what the organizer previews before anything is written: one item per
// cohort found at the source, each carrying the course it belongs to and its ticket types.
// Sources (Eventbrite API, CSV exports) map into this shape; the API applies it.

export type ImportSource = "eventbrite" | "csv";
export type ImportFormat = "live_virtual" | "in_person" | "hybrid" | "self_paced";

export interface ImportTicketType {
  name: string;
  priceMinor: number;
  quantity: number;
  /** Seats already sold at the source; shown in the preview, not imported. */
  sold?: number;
}

export interface ImportItem {
  source: ImportSource;
  /** Identifier at the source (Eventbrite event id, CSV row number). */
  sourceId: string;
  sourceUrl?: string;
  course: { slug: string; name: string; description?: string; durationDays?: number; /** Cover image at the source, copied into the media store on apply. */ imageUrl?: string };
  event: { name: string; startsAt: string; endsAt?: string; timezone: string; currency: string; format: ImportFormat };
  ticketTypes: ImportTicketType[];
  /** Status at the source, informational. */
  sourceStatus?: string;
  warnings: string[];
}

export interface ImportPlan {
  source: ImportSource;
  items: ImportItem[];
  /** Distinct courses the items resolve to, in first-seen order. */
  courses: Array<{ slug: string; name: string; cohorts: number }>;
  skipped: Array<{ sourceId: string; name: string; reason: string }>;
}

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "course";
}

const MONTHS = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
const DATEISH = new RegExp(`\\b(${MONTHS})\\b|\\b20\\d\\d\\b|\\b\\d{1,2}[/.-]\\d{1,2}\\b|\\bcohort\\b|\\bbatch\\b|\\bweekend\\b|\\bevening\\b|\\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*day\\b`, "i");

/**
 * Cohort names at ticketing sites usually carry their dates ("PMP Bootcamp - Nov 14-16, 2026").
 * The course is the part before the first separator whose remainder looks like a date or
 * a cohort label; otherwise the whole name.
 */
export function courseNameFrom(eventName: string): string {
  const name = eventName.replace(/\s+/g, " ").trim();
  const parts = name.split(/\s+[-–—|:•]\s+|\s*\(([^)]*)\)\s*/).filter((p): p is string => typeof p === "string" && p.trim().length > 0);
  if (parts.length < 2) return name.replace(/\s*\([^)]*\)\s*$/, "").trim() || name;
  const [head, ...rest] = parts;
  return rest.some((p) => DATEISH.test(p)) ? head!.trim() : name;
}

export function durationDaysBetween(startsAt: string, endsAt?: string): number | undefined {
  if (!endsAt) return undefined;
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return undefined;
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

/** Groups items into courses by slug and sorts cohorts by start date. */
export function buildPlan(source: ImportSource, items: ImportItem[], skipped: ImportPlan["skipped"] = []): ImportPlan {
  const sorted = [...items].sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
  const courses = new Map<string, { slug: string; name: string; cohorts: number }>();
  for (const it of sorted) {
    const c = courses.get(it.course.slug);
    if (c) c.cohorts += 1;
    else courses.set(it.course.slug, { slug: it.course.slug, name: it.course.name, cohorts: 1 });
  }
  return { source, items: sorted, courses: [...courses.values()], skipped };
}
