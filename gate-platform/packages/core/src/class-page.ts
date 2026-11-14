// The public class page: optional sections, their content, and the learner details a checkout
// collects. Validation lives here so the API, the importers and the dashboard agree on limits.

import { COURSE_PAGE_MODULES, type Attendee, type Course, type CoursePage, type CoursePageModule, type OrganizationProfile, type ReadyChecks } from "./types.js";
import { DomainError } from "./errors.js";

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** YouTube or Vimeo watch/share link -> the privacy-friendly embed URL, or null when it isn't one. */
export function videoEmbedUrl(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^www\.|^m\./, "");
  const id = (s: string | null | undefined) => (s && /^[A-Za-z0-9_-]{6,20}$/.test(s) ? s : null);
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const v = id(u.searchParams.get("v")) ?? id(u.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/)?.[1]);
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === "youtu.be") {
    const v = id(u.pathname.slice(1).split("/")[0]);
    return v ? `https://www.youtube-nocookie.com/embed/${v}` : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const v = u.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/)?.[1];
    return v ? `https://player.vimeo.com/video/${v}?dnt=1` : null;
  }
  return null;
}

/** Validates and trims a class page patch; throws VALIDATION with a message an organizer can act on. */
export function normalizeCoursePage(input: CoursePage): CoursePage {
  const out: CoursePage = {};
  const tagline = clip(input.tagline, 240);
  if (tagline) out.tagline = tagline;
  if (input.videoUrl?.trim()) {
    if (!videoEmbedUrl(input.videoUrl.trim())) throw new DomainError("VALIDATION", "the preview video must be a YouTube or Vimeo link");
    out.videoUrl = input.videoUrl.trim();
  }
  if (input.agenda) {
    if (!Array.isArray(input.agenda) || input.agenda.length > 14) throw new DomainError("VALIDATION", "the agenda covers at most 14 days");
    const days = input.agenda.map((day) => (Array.isArray(day) ? day.map((t) => clip(t, 200)).filter(Boolean).slice(0, 12) : []));
    while (days.length && days[days.length - 1]!.length === 0) days.pop();
    if (days.length) out.agenda = days;
  }
  if (input.included) {
    if (!Array.isArray(input.included) || input.included.length > 12) throw new DomainError("VALIDATION", "list at most 12 things learners leave with");
    const items = input.included.map((i) => ({ title: clip(i?.title, 80), note: clip(i?.note, 140) })).filter((i) => i.title).map((i) => (i.note ? i : { title: i.title }));
    if (items.length) out.included = items;
  }
  if (input.modules) {
    const modules: Partial<Record<CoursePageModule, boolean>> = {};
    for (const [k, v] of Object.entries(input.modules)) {
      if (!COURSE_PAGE_MODULES.includes(k as CoursePageModule)) throw new DomainError("VALIDATION", `unknown page section ${k}`);
      if (typeof v === "boolean") modules[k as CoursePageModule] = v;
    }
    if (Object.keys(modules).length) out.modules = modules;
  }
  return out;
}

/** Which optional sections the page shows: the organizer's switch, else "on when there's content". */
export function coursePageSections(course: Course, has: { logo: boolean; instructors: boolean }): Record<CoursePageModule, boolean> {
  const m = course.page?.modules ?? {};
  const content: Record<CoursePageModule, boolean> = {
    banner: Boolean(course.imageUrl),
    logo: has.logo,
    badge: Boolean(course.badge),
    video: Boolean(course.page?.videoUrl),
    agenda: Boolean(course.page?.agenda?.length),
    included: Boolean(course.page?.included?.length),
    instructor: has.instructors,
    seats: true,
  };
  const out = {} as Record<CoursePageModule, boolean>;
  for (const k of COURSE_PAGE_MODULES) out[k] = content[k] && m[k] !== false;
  return out;
}

export const isAccentColor = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

/** Checks an IANA zone name the way browsers resolve it. */
export function isTimeZone(tz: string): boolean {
  if (!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+){0,2}$/.test(tz) && tz !== "UTC") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const READY_KEYS: (keyof ReadyChecks)[] = ["camera", "connection", "calendar", "prework"];

export function cleanReadyChecks(v: ReadyChecks | undefined): ReadyChecks | undefined {
  if (!v) return undefined;
  const out: ReadyChecks = {};
  for (const k of READY_KEYS) if (typeof v[k] === "boolean") out[k] = v[k];
  return Object.keys(out).length ? out : undefined;
}

/** Trims the optional learner details; drops an unknown time zone rather than failing the booking. */
export function cleanAttendee(a: Attendee): Attendee {
  const out: Attendee = { email: a.email.trim() };
  const name = clip(a.name, 200), company = clip(a.company, 200), jobTitle = clip(a.jobTitle, 120);
  if (name) out.name = name;
  if (company) out.company = company;
  if (jobTitle) out.jobTitle = jobTitle;
  if (a.timeZone && isTimeZone(a.timeZone)) out.timeZone = a.timeZone;
  const ready = cleanReadyChecks(a.readyChecks);
  if (ready) out.readyChecks = ready;
  return out;
}

/** Profile address: 3–40 lowercase letters, digits and dashes, not starting or ending with a dash. */
export const isProfileSlug = (v: string) => /^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/.test(v) && !v.includes("--");

/** "Agile Agilist Inc." -> "agile-agilist-inc" (a starting point; the organizer can change it). */
export function suggestProfileSlug(name: string): string {
  const s = name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/g, "");
  return s.length >= 3 ? s : `${s || "org"}-training`;
}

/** Trims and checks a profile patch; empty strings clear a field. */
export function normalizeProfile(current: OrganizationProfile | undefined, patch: OrganizationProfile): OrganizationProfile {
  const out: OrganizationProfile = { ...current };
  const text = (k: "about" | "partnerLevel" | "basedIn" | "teachesIn", max: number) => {
    const v = patch[k];
    if (v === undefined) return;
    const t = v.trim().slice(0, max);
    if (t) out[k] = t;
    else delete out[k];
  };
  text("about", 1200);
  text("partnerLevel", 120);
  text("basedIn", 120);
  text("teachesIn", 300);
  if (patch.coverUrl !== undefined) {
    const v = patch.coverUrl.trim();
    if (v && !/^https?:\/\//.test(v)) throw new DomainError("VALIDATION", "the cover image must be an http(s) URL");
    if (v) out.coverUrl = v;
    else delete out.coverUrl;
  }
  if (patch.website !== undefined) {
    let v = patch.website.trim();
    if (v && !/^https?:\/\//i.test(v)) v = `https://${v}`;
    if (v) {
      try {
        const u = new URL(v);
        if (!u.hostname.includes(".")) throw new Error("no dot");
      } catch {
        throw new DomainError("VALIDATION", "the website must be a web address like agile-agilist.com");
      }
      out.website = v.slice(0, 300);
    } else delete out.website;
  }
  return out;
}

const LANGUAGE_WORDS = "english|anglais|french|fran(?:c|ç)ais|en fran(?:c|ç)ais|spanish|espa(?:n|ñ)ol|en espa(?:n|ñ)ol|german|deutsch|auf deutsch|portuguese|portugu(?:e|ê)s|italian|italiano|arabic|en|fr|es|de|pt";

/**
 * A course name without its language marker, for matching the language versions of one
 * certification: "Advanced SAFe® Practice Consultant - En Français" -> "advanced safe practice consultant".
 */
export function certificationBase(name: string): string {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[®™©]/g, "")
    .replace(new RegExp(`\\s*[([](?:${LANGUAGE_WORDS})(?:\\s+version)?[)\\]]`, "gi"), " ")
    .replace(new RegExp(`\\s+[-–—|:·]\\s*(?:${LANGUAGE_WORDS})(?:\\s+version)?\\s*$`, "i"), "")
    .replace(new RegExp(`\\s+(?:en fran(?:c|ç)ais|en espa(?:n|ñ)ol|auf deutsch|in (?:english|french|spanish|german))\\s*$`, "i"), "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    // "Certified" comes and goes between versions of one name.
    .replace(/\b(?:certified|certification|certifi(?:é|e)e?)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Two courses of one organizer lead to the same certification: same badge, or same name apart from the language. */
export function sameCertification(a: Pick<Course, "name" | "badge">, b: Pick<Course, "name" | "badge">): boolean {
  if (a.badge?.name && b.badge?.name && a.badge.name.trim().toLowerCase() === b.badge.name.trim().toLowerCase()) return true;
  const ka = certificationBase(a.name);
  return ka.length > 0 && ka === certificationBase(b.name);
}
