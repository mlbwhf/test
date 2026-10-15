"use server";

import { revalidatePath } from "next/cache";
import {
  api,
  ATTENDANCE_STATUSES,
  describeFailure,
  EVENT_FORMATS,
  MEETING_PROVIDER_LABELS,
  MEETING_PROVIDERS,
  PARTY_KINDS,
  type Attendee,
  type AttendanceStatus,
  type CreateMeetingInput,
  type EventFormat,
  type MeetingProvider,
  type PartyKind,
  type RegionalPrices,
  type Session,
} from "@/lib/api";
import { formatDateTime, formatMoney, isValidTimeZone, parseMajorToMinor, truncate, zonedTimeToIso } from "@/lib/format";
import { MAX_ATTENDEES, MAX_SESSIONS, REGIONAL_PRICE_ROWS } from "@/lib/forms";
import type { ActionState } from "@/components/action-form";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CURRENCY_RE = /^[A-Z]{3}$/;

/** True for an absolute http(s) URL. */
function isHttpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function fields(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
}

function fail(message: string): ActionState {
  return { status: "error", message };
}

function positiveInt(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n > 0 && Number.isSafeInteger(n) ? n : null;
}

/**
 * Reads up to `rows` optional (currency, price) pairs named `${prefix}_${i}_currency`
 * / `${prefix}_${i}_price`. Returns the parsed map, `undefined` when every row is
 * blank, or an error string.
 */
function regionalPrices(
  formData: FormData,
  prefix: string,
  rows: number,
): { prices?: RegionalPrices; error?: string } {
  const prices: RegionalPrices = {};
  for (let i = 0; i < rows; i++) {
    const currency = field(formData, `${prefix}_${i}_currency`).toUpperCase();
    const priceRaw = field(formData, `${prefix}_${i}_price`);
    if (!currency && !priceRaw) continue;
    if (!CURRENCY_RE.test(currency)) return { error: `Regional price row ${i + 1}: currency must be a 3-letter ISO code.` };
    const minor = parseMajorToMinor(priceRaw, currency);
    if (minor === null) return { error: `Regional price row ${i + 1}: price must be a non-negative amount in ${currency}.` };
    if (currency in prices) return { error: `Regional price row ${i + 1}: ${currency} is listed twice.` };
    prices[currency] = minor;
  }
  return Object.keys(prices).length > 0 ? { prices } : {};
}

export async function createEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = field(formData, "name");
  const startsAtRaw = field(formData, "startsAt");
  const currency = field(formData, "currency").toUpperCase();

  if (!name) return fail("Event name is required.");
  if (!startsAtRaw) return fail("Start date/time is required.");
  if (!CURRENCY_RE.test(currency)) return fail("Currency must be a 3-letter ISO code (e.g. EUR).");

  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) return fail("Start date/time is not a valid date.");

  const result = await api.createEvent({ name, startsAt: startsAt.toISOString(), currency });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath("/events");
  revalidatePath("/dashboard");
  return {
    status: "ok",
    message: `Created event "${result.data.name}".`,
    details: [
      { label: "Event ID", value: result.data.id },
      { label: "Status", value: result.data.status },
    ],
  };
}

export async function createTicketTypeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = field(formData, "eventId");
  const currency = field(formData, "currency").toUpperCase();
  const timezone = field(formData, "timezone") || "UTC";
  const name = field(formData, "name");
  const priceRaw = field(formData, "price");
  const quantityRaw = field(formData, "quantity");

  if (!eventId) return fail("Missing event id.");
  if (!name) return fail("Ticket type name is required.");

  const priceMinor = parseMajorToMinor(priceRaw, currency || "USD");
  if (priceMinor === null) return fail(`Price must be a non-negative amount in ${currency || "the event currency"} (e.g. 12.50).`);

  const quantity = positiveInt(quantityRaw);
  if (quantity === null) return fail("Quantity must be a positive whole number.");

  const regional = regionalPrices(formData, "regional", REGIONAL_PRICE_ROWS);
  if (regional.error) return fail(regional.error);

  // Optional early bird: present when an "until" date or a price was entered.
  const ebUntilRaw = field(formData, "earlyBirdUntil");
  const ebPriceRaw = field(formData, "earlyBirdPrice");
  const ebRegional = regionalPrices(formData, "eb_regional", REGIONAL_PRICE_ROWS);
  if (ebRegional.error) return fail(`Early bird: ${ebRegional.error}`);

  let earlyBird: { until: string; priceMinor: number; prices?: RegionalPrices } | undefined;
  if (ebUntilRaw || ebPriceRaw || ebRegional.prices) {
    if (!ebUntilRaw) return fail("Early bird: an 'until' date is required.");
    if (!ebPriceRaw) return fail("Early bird: a price is required.");
    // The early-bird window closes at the end of that day in the event's time zone.
    const until = zonedTimeToIso(ebUntilRaw, "23:59:59", isValidTimeZone(timezone) ? timezone : "UTC");
    if (!until) return fail("Early bird: 'until' is not a valid date.");
    const ebMinor = parseMajorToMinor(ebPriceRaw, currency || "USD");
    if (ebMinor === null) return fail(`Early bird: price must be a non-negative amount in ${currency || "the event currency"}.`);
    earlyBird = { until, priceMinor: ebMinor };
    if (ebRegional.prices) earlyBird.prices = ebRegional.prices;
  }

  const result = await api.createTicketType(eventId, {
    name,
    priceMinor,
    quantity,
    ...(regional.prices ? { prices: regional.prices } : {}),
    ...(earlyBird ? { earlyBird } : {}),
  });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath(`/events/${eventId}`);
  const details = [
    { label: "Ticket type ID", value: result.data.id },
    { label: "Price", value: formatMoney(result.data.priceMinor, currency || "USD") },
    { label: "Quantity", value: String(result.data.quantity) },
  ];
  for (const [c, minor] of Object.entries(result.data.prices ?? {})) {
    details.push({ label: `Price (${c})`, value: formatMoney(minor, c) });
  }
  if (result.data.earlyBird) {
    details.push({ label: "Early bird", value: formatMoney(result.data.earlyBird.priceMinor, currency || "USD") });
    details.push({ label: "Early bird until", value: result.data.earlyBird.until });
  }
  return { status: "ok", message: `Created ticket type "${result.data.name}".`, details };
}

export async function sellTestTicketAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = field(formData, "eventId");
  const ticketTypeId = field(formData, "ticketTypeId");
  const quantityRaw = field(formData, "quantity");
  const buyerEmail = field(formData, "buyerEmail");
  const currency = field(formData, "currency").toUpperCase();

  if (!ticketTypeId) return fail("Pick a ticket type.");
  const quantity = positiveInt(quantityRaw);
  if (quantity === null) return fail("Quantity must be a positive whole number.");
  if (quantity > MAX_ATTENDEES) return fail(`Quantity must be at most ${MAX_ATTENDEES} for a test order.`);
  if (!EMAIL_RE.test(buyerEmail)) return fail("Buyer email is not a valid email address.");
  if (currency && !CURRENCY_RE.test(currency)) return fail("Currency must be a 3-letter ISO code.");

  // Attendee rows: only the first `quantity` rows that have an email are sent.
  const attendees: Attendee[] = [];
  for (let i = 0; i < MAX_ATTENDEES && attendees.length < quantity; i++) {
    const email = field(formData, `attendee_${i}_email`);
    const name = field(formData, `attendee_${i}_name`);
    if (!email && !name) continue;
    if (!EMAIL_RE.test(email)) return fail(`Attendee ${i + 1}: email is not a valid email address.`);
    const attendee: Attendee = { email };
    if (name) attendee.name = name;
    attendees.push(attendee);
  }

  const result = await api.createOrder({
    ticketTypeId,
    quantity,
    buyerEmail,
    ...(currency ? { currency } : {}),
    ...(attendees.length > 0 ? { attendees } : {}),
  });
  if (!result.ok) return fail(describeFailure(result.error));

  const { order, clientSecret } = result.data;
  const money = (minor: number) => formatMoney(minor, order.currency);

  if (eventId) revalidatePath(`/events/${eventId}`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");

  return {
    status: "ok",
    message: `Order ${order.id} created (${order.status}).`,
    details: [
      { label: "Buyer", value: order.buyerEmail },
      { label: "Quantity", value: String(order.quantity) },
      { label: "Attendees", value: String((order.attendees ?? []).length) },
      { label: "Currency", value: order.currency },
      { label: "Subtotal", value: money(order.pricing.subtotalMinor) },
      { label: "Platform fee", value: money(order.pricing.platformFeeMinor) },
      { label: "Attendee fee", value: money(order.pricing.attendeeFeeMinor) },
      { label: "Total charged", value: money(order.pricing.totalMinor) },
      { label: "Organizer net", value: money(order.pricing.organizerNetMinor) },
      { label: "Client secret", value: clientSecret ? truncate(clientSecret, 16) : "none (no payment required)" },
    ],
  };
}

export async function refundOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orderId = field(formData, "orderId");
  const reason = field(formData, "reason") || "requested_by_customer";
  const currency = field(formData, "currency");

  if (!orderId) return fail("Missing order id.");

  const result = await api.createRefund({ orderId, reason });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath("/orders");
  revalidatePath("/dashboard");

  const { refund } = result.data;
  return {
    status: "ok",
    message: `Refund ${refund.id} ${refund.status}.`,
    details: [
      {
        label: "Amount",
        value: currency ? formatMoney(refund.amountMinor, currency) : String(refund.amountMinor),
      },
    ],
  };
}

export async function createCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const slug = field(formData, "slug").toLowerCase();
  const name = field(formData, "name");
  const certificationBody = field(formData, "certificationBody");
  const durationRaw = field(formData, "durationDays");

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return fail("Slug must be lowercase letters, digits and hyphens (e.g. safe-for-teams).");
  if (!name) return fail("Course name is required.");

  let durationDays: number | undefined;
  if (durationRaw) {
    const n = positiveInt(durationRaw);
    if (n === null) return fail("Duration must be a positive whole number of days.");
    durationDays = n;
  }

  const result = await api.createCourse({
    slug,
    name,
    ...(certificationBody ? { certificationBody } : {}),
    ...(durationDays !== undefined ? { durationDays } : {}),
  });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath("/courses");
  return {
    status: "ok",
    message: `Created course "${result.data.name}".`,
    details: [
      { label: "Course ID", value: result.data.id },
      { label: "Slug", value: result.data.slug },
    ],
  };
}

export async function createCohortAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const courseId = field(formData, "courseId");
  const name = field(formData, "name");
  const timezone = field(formData, "timezone");
  const formatRaw = field(formData, "format");
  const minEnrollmentRaw = field(formData, "minEnrollment");
  const instructorIds = fields(formData, "instructorIds");
  const currency = field(formData, "currency").toUpperCase();

  if (!courseId) return fail("Missing course id.");
  if (!name) return fail("Cohort name is required.");
  if (!timezone) return fail("Time zone is required.");
  if (!isValidTimeZone(timezone)) return fail(`"${timezone}" is not a known IANA time zone (e.g. America/Toronto).`);
  if (!EVENT_FORMATS.includes(formatRaw as EventFormat)) return fail("Pick a cohort format.");
  const format = formatRaw as EventFormat;
  if (currency && !CURRENCY_RE.test(currency)) return fail("Currency must be a 3-letter ISO code (e.g. CAD).");

  let minEnrollment: number | undefined;
  if (minEnrollmentRaw) {
    const n = positiveInt(minEnrollmentRaw);
    if (n === null) return fail("Minimum enrollment must be a positive whole number.");
    minEnrollment = n;
  }

  // Sessions: rows with no date are skipped; a row with a date needs both times.
  const sessions: Session[] = [];
  for (let i = 0; i < MAX_SESSIONS; i++) {
    const date = field(formData, `session_${i}_date`);
    const start = field(formData, `session_${i}_start`);
    const end = field(formData, `session_${i}_end`);
    const title = field(formData, `session_${i}_title`);
    if (!date && !start && !end && !title) continue;
    if (!date) return fail(`Session ${i + 1}: date is required.`);
    if (!start || !end) return fail(`Session ${i + 1}: start and end times are required.`);
    const startsAt = zonedTimeToIso(date, start, timezone);
    const endsAt = zonedTimeToIso(date, end, timezone);
    if (!startsAt) return fail(`Session ${i + 1}: ${date} ${start} does not exist in ${timezone} (check the date and DST).`);
    if (!endsAt) return fail(`Session ${i + 1}: ${date} ${end} does not exist in ${timezone} (check the date and DST).`);
    if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) return fail(`Session ${i + 1}: end time must be after start time.`);
    const session: Session = { startsAt, endsAt };
    if (title) session.title = title;
    sessions.push(session);
  }
  if (sessions.length === 0) return fail("Add at least one session.");
  sessions.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const result = await api.createCohort(courseId, {
    name,
    timezone,
    format,
    sessions,
    ...(minEnrollment !== undefined ? { minEnrollment } : {}),
    ...(instructorIds.length > 0 ? { instructorIds } : {}),
    ...(currency ? { currency } : {}),
  });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/events");
  return {
    status: "ok",
    message: `Created cohort "${result.data.name}".`,
    details: [
      { label: "Event ID", value: result.data.id },
      { label: "Status", value: result.data.status },
      { label: "Sessions", value: String(result.data.sessions.length) },
      { label: "First session", value: sessions[0]?.startsAt ?? "" },
    ],
  };
}

export async function createPartyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = field(formData, "name");
  const kindRaw = field(formData, "kind") || "instructor";

  if (!name) return fail("Name is required.");
  if (!PARTY_KINDS.includes(kindRaw as PartyKind)) return fail("Pick a party kind.");
  const kind = kindRaw as PartyKind;

  const result = await api.createParty({ name, kind });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath("/instructors");
  revalidatePath("/courses");
  return {
    status: "ok",
    message: `Created ${kind.replace("_", " ")} "${result.data.name}".`,
    details: [{ label: "Party ID", value: result.data.id }],
  };
}

// ---------------------------------------------------------------------------
// Delivery: meeting, attendance, certificates, message sequences.

export async function createMeetingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = field(formData, "eventId");
  const providerRaw = field(formData, "provider");
  const joinUrl = field(formData, "joinUrl");
  const hostUrl = field(formData, "hostUrl");
  const passcode = field(formData, "passcode");

  if (!eventId) return fail("Missing event id.");
  if (!MEETING_PROVIDERS.includes(providerRaw as MeetingProvider)) return fail("Pick a meeting provider.");
  const provider = providerRaw as MeetingProvider;

  if (provider === "manual" && !joinUrl) return fail("A join URL is required for a manual meeting link.");
  if (joinUrl && !isHttpUrl(joinUrl)) return fail("Join URL must be an absolute http(s) URL.");
  if (hostUrl && !isHttpUrl(hostUrl)) return fail("Host URL must be an absolute http(s) URL.");

  const input: CreateMeetingInput = { provider };
  if (joinUrl) input.joinUrl = joinUrl;
  if (hostUrl) input.hostUrl = hostUrl;
  if (passcode) input.passcode = passcode;

  const result = await api.createMeeting(eventId, input);
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath(`/events/${eventId}`);
  const meeting = result.data.meeting;
  return {
    status: "ok",
    message: meeting
      ? `${MEETING_PROVIDER_LABELS[meeting.provider]} meeting created.`
      : "Meeting created.",
    details: meeting
      ? [
          { label: "Meeting ID", value: meeting.meetingId },
          { label: "Join URL", value: meeting.joinUrl },
        ]
      : undefined,
  };
}

export async function syncAttendanceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = field(formData, "eventId");
  if (!eventId) return fail("Missing event id.");

  const result = await api.syncAttendance(eventId);
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath(`/events/${eventId}`);
  const { updated, items } = result.data;
  return {
    status: "ok",
    message: `Synced attendance from the meeting: ${updated} record${updated === 1 ? "" : "s"} updated.`,
    details: [
      { label: "Present", value: String(items.filter((a) => a.status === "present").length) },
      { label: "Partial", value: String(items.filter((a) => a.status === "partial").length) },
      { label: "Absent", value: String(items.filter((a) => a.status === "absent").length) },
    ],
  };
}

export async function recordAttendanceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = field(formData, "eventId");
  const seatId = field(formData, "seatId");
  const statusRaw = field(formData, "status");
  const minutesRaw = field(formData, "minutes");

  if (!eventId) return fail("Missing event id.");
  if (!seatId) return fail("Missing seat id.");
  if (!ATTENDANCE_STATUSES.includes(statusRaw as Exclude<AttendanceStatus, "unknown">)) {
    return fail("Pick an attendance status.");
  }
  const status = statusRaw as Exclude<AttendanceStatus, "unknown">;

  let minutes: number | undefined;
  if (minutesRaw) {
    if (!/^\d+$/.test(minutesRaw)) return fail("Minutes must be a whole number.");
    minutes = Number(minutesRaw);
  }

  const result = await api.recordAttendance(eventId, {
    seatId,
    status,
    ...(minutes !== undefined ? { minutes } : {}),
  });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath(`/events/${eventId}`);
  return { status: "ok", message: `Marked ${result.data.email} as ${result.data.status}.` };
}

export async function issueCertificatesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = field(formData, "eventId");
  const onlyPresent = formData.get("onlyPresent") === "on";

  if (!eventId) return fail("Missing event id.");

  const result = await api.issueCertificates(eventId, { onlyPresent });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath(`/events/${eventId}`);
  const issued = result.data.issued;
  return {
    status: "ok",
    message:
      issued.length === 0
        ? onlyPresent
          ? "No certificates issued: no learners marked present without one."
          : "No certificates issued: every learner already has one."
        : `Issued ${issued.length} certificate${issued.length === 1 ? "" : "s"}.`,
    details: issued.slice(0, 10).map((c) => ({ label: c.attendeeName || c.attendeeEmail, value: c.verifyCode })),
  };
}

export async function runSequencesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = field(formData, "eventId");

  const result = await api.runSequences();
  if (!result.ok) return fail(describeFailure(result.error));

  if (eventId) revalidatePath(`/events/${eventId}`);
  const { sent } = result.data;
  return {
    status: "ok",
    message: sent === 0 ? "No messages were due." : `Sent ${sent} due message${sent === 1 ? "" : "s"}.`,
    details: [{ label: "Run at", value: formatDateTime(new Date().toISOString()) }],
  };
}

export async function updateCourseDeliveryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const courseId = field(formData, "courseId");
  const prework = field(formData, "prework");
  const surveyUrl = field(formData, "surveyUrl");

  if (!courseId) return fail("Missing course id.");
  if (surveyUrl && !isHttpUrl(surveyUrl)) return fail("Survey URL must be an absolute http(s) URL.");

  // Blank fields clear the stored value.
  const result = await api.updateCourse(courseId, {
    prework: prework || null,
    surveyUrl: surveyUrl || null,
  });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath(`/courses/${courseId}`);
  return {
    status: "ok",
    message: `Saved delivery settings for "${result.data.name}".`,
    details: [
      { label: "Pre-work", value: result.data.prework ? `${result.data.prework.length} characters` : "none" },
      { label: "Survey URL", value: result.data.surveyUrl ?? "none" },
    ],
  };
}
