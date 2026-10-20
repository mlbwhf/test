"use server";

import { revalidatePath } from "next/cache";
import { api, describeFailure, EVENT_FORMATS, type EventFormat, type Session } from "@/lib/api";
import { isValidTimeZone, parseMajorToMinor, zonedTimeToIso } from "@/lib/format";
import { publicApiUrl } from "@/lib/urls";
import { sessionDates } from "@/lib/wizard";

export type WizardInput = {
  course: { id: string } | { name: string; days: number };
  startDate: string; // YYYY-MM-DD in `timezone`
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  days: number;
  weekdaysOnly: boolean;
  timezone: string;
  format: EventFormat;
  ticketName: string;
  price: string; // major units, e.g. "1295" or "1295.00"
  seats: number;
  minEnrollment: number | null;
  currency: string;
  /** Owners and admins choose who teaches; for an instructor the API adds them automatically. */
  instructorIds?: string[];
};

export type WizardResult =
  | { ok: true; eventId: string; publicUrl: string | null; embed: string }
  | { ok: false; error: string };

const slugify = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "course";

export async function createEventFromWizard(input: WizardInput): Promise<WizardResult> {
  const fail = (error: string): WizardResult => ({ ok: false, error });
  const currency = input.currency.toUpperCase();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) return fail("Pick a start date.");
  if (!/^\d{2}:\d{2}$/.test(input.startTime) || !/^\d{2}:\d{2}$/.test(input.endTime)) return fail("Pick start and end times.");
  if (input.endTime <= input.startTime) return fail("The daily end time must be after the start time.");
  if (!Number.isInteger(input.days) || input.days < 1 || input.days > 30) return fail("Days must be between 1 and 30.");
  if (!isValidTimeZone(input.timezone)) return fail(`"${input.timezone}" is not a known time zone.`);
  if (!EVENT_FORMATS.includes(input.format)) return fail("Pick a format.");
  if (!/^[A-Z]{3}$/.test(currency)) return fail("Currency must be a 3-letter code.");
  const priceMinor = parseMajorToMinor(input.price || "0", currency);
  if (priceMinor === null) return fail("Price must be a number, e.g. 1295 or 1295.00.");
  if (!Number.isInteger(input.seats) || input.seats < 1 || input.seats > 10_000) return fail("Seats must be a whole number of at least 1.");
  if (input.minEnrollment !== null && (!Number.isInteger(input.minEnrollment) || input.minEnrollment < 1 || input.minEnrollment > input.seats)) return fail("Minimum enrolment must be between 1 and the number of seats.");

  const sessions: Session[] = [];
  for (const date of sessionDates(input.startDate, input.days, input.weekdaysOnly)) {
    const startsAt = zonedTimeToIso(date, input.startTime, input.timezone);
    const endsAt = zonedTimeToIso(date, input.endTime, input.timezone);
    if (!startsAt || !endsAt) return fail(`${date} ${input.startTime} doesn't exist in ${input.timezone} (daylight-saving change); pick another time.`);
    sessions.push({ startsAt, endsAt });
  }
  if (new Date(sessions[0]!.startsAt).getTime() < Date.now() - 86_400_000) return fail("The start date is in the past.");

  // Course: pick an existing one or create it here.
  let course;
  if ("id" in input.course) {
    const r = await api.getCourse(input.course.id);
    if (!r.ok) return fail(describeFailure(r.error));
    course = r.data;
  } else {
    const name = input.course.name.trim();
    if (!name) return fail("Give the new course a name.");
    const base = slugify(name);
    let r = await api.createCourse({ slug: base, name, durationDays: input.course.days });
    if (!r.ok && r.error.kind === "api" && r.error.status === 409) r = await api.createCourse({ slug: `${base}-${Math.random().toString(36).slice(2, 6)}`, name, durationDays: input.course.days });
    if (!r.ok) return fail(describeFailure(r.error));
    course = r.data;
  }

  const ev = await api.createCohort(course.id, {
    name: course.name,
    timezone: input.timezone,
    format: input.format,
    sessions,
    currency,
    ...(input.minEnrollment ? { minEnrollment: input.minEnrollment } : {}),
    ...(input.instructorIds?.length ? { instructorIds: input.instructorIds } : {}),
  });
  if (!ev.ok) return fail(describeFailure(ev.error));
  const tt = await api.createTicketType(ev.data.id, { name: input.ticketName.trim() || "Standard", priceMinor, quantity: input.seats });
  if (!tt.ok) return fail(`The event was created but its ticket wasn't: ${describeFailure(tt.error)}. Add it from the event page.`);

  const [overview, me] = await Promise.all([api.eventOverview(ev.data.id), api.me()]);
  const orgId = me.ok ? me.data.organization?.id ?? "" : "";
  const pk = process.env.STRIPE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const embed = [
    "<div data-gate-widget",
    `     data-gate-api="${publicApiUrl()}"`,
    `     data-gate-org="${orgId}"`,
    `     data-gate-course="${course.slug}"`,
    `     data-gate-currency="${currency}"${pk ? "" : "></div>"}`,
    ...(pk ? [`     data-gate-stripe-pk="${pk}"></div>`] : []),
    `<script src="${publicApiUrl()}/widget/v1/gate-widget.js" async></script>`,
  ].join("\n");

  revalidatePath("/events");
  revalidatePath("/dashboard");
  revalidatePath(`/courses/${course.id}`);
  return { ok: true, eventId: ev.data.id, publicUrl: overview.ok ? overview.data.publicUrl : null, embed };
}
