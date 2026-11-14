// The public class page: optional sections, their content, and the learner details a checkout
// collects. Validation lives here so the API, the importers and the dashboard agree on limits.

import { COURSE_PAGE_MODULES, type Attendee, type Course, type CoursePage, type CoursePageModule, type ReadyChecks } from "./types.js";
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
