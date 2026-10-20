"use server";

import { revalidatePath } from "next/cache";
import {
  api,
  BADGE_PLATFORMS,
  type CourseBadge,
  ATTENDANCE_STATUSES,
  describeFailure,
  EVENT_FORMATS,
  MEETING_PROVIDER_LABELS,
  MEETING_PROVIDERS,
  PARTY_KINDS,
  PAYOUT_METHOD_LABELS,
  PAYOUT_METHODS,
  RELEASE_POLICIES,
  type Attendee,
  type AttendanceStatus,
  type CancelEventInput,
  type CreateMeetingInput,
  type CreatePayoutInput,
  type EventFormat,
  type FxRounding,
  FX_ROUNDINGS,
  type InstructorFee,
  type MeetingProvider,
  type PartyKind,
  type PayoutMethod,
  type RegionalPrices,
  type ReleasePolicy,
  type Session,
} from "@/lib/api";
import { formatDateTime, formatDateTimeInZone, formatMoney, humanize, isValidTimeZone, parseMajorToMinor, truncate, zonedTimeToIso } from "@/lib/format";
import { DEFAULT_TIMEZONE, MAX_ATTENDEES, MAX_INSTRUCTOR_FEES, MAX_SESSIONS, REGIONAL_PRICE_ROWS } from "@/lib/forms";
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

function nonNegativeInt(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : null;
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

// ---------------------------------------------------------------------------
// Money: release policy, instructor fees, cancellation, payouts.

export async function updateOrganizationSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const releasePolicyRaw = field(formData, "releasePolicy");
  const graceHoursRaw = field(formData, "releaseGraceHours");
  const decisionDaysRaw = field(formData, "minEnrollmentDecisionDays");

  if (!RELEASE_POLICIES.includes(releasePolicyRaw as ReleasePolicy)) return fail("Pick a release policy.");
  const releasePolicy = releasePolicyRaw as ReleasePolicy;
  const releaseGraceHours = nonNegativeInt(graceHoursRaw);
  if (releaseGraceHours === null) return fail("Grace hours must be a whole number of hours (0 or more).");
  const minEnrollmentDecisionDays = nonNegativeInt(decisionDaysRaw);
  if (minEnrollmentDecisionDays === null) return fail("Decision days must be a whole number of days (0 or more).");

  const result = await api.updateOrganization({ releasePolicy, releaseGraceHours, minEnrollmentDecisionDays });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath("/money");
  revalidatePath("/dashboard");
  return {
    status: "ok",
    message: `Saved money settings for "${result.data.name}".`,
    details: [
      { label: "Release policy", value: humanize(result.data.releasePolicy) },
      { label: "Grace hours", value: String(result.data.releaseGraceHours) },
      { label: "Decision days", value: String(result.data.minEnrollmentDecisionDays) },
    ],
  };
}

export async function releaseFundsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = field(formData, "eventId");
  const currency = field(formData, "currency").toUpperCase();
  if (!eventId) return fail("Missing event id.");

  const result = await api.releaseFunds(eventId);
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath("/money");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
  const { released, amountMinor } = result.data;
  return {
    status: "ok",
    message: released === 0 ? "Nothing to release: no held funds for this cohort." : `Released ${released} held order${released === 1 ? "" : "s"}.`,
    details: [
      {
        label: "Amount",
        value: CURRENCY_RE.test(currency) ? formatMoney(amountMinor, currency) : String(amountMinor),
      },
    ],
  };
}

export async function recordPayoutAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const partyId = field(formData, "partyId");
  const currency = field(formData, "currency").toUpperCase();
  const amountRaw = field(formData, "amount");
  const methodRaw = field(formData, "method");
  const reference = field(formData, "reference");

  if (!CURRENCY_RE.test(currency)) return fail("Currency must be a 3-letter ISO code (e.g. EUR).");
  const amountMinor = parseMajorToMinor(amountRaw, currency);
  if (amountMinor === null || amountMinor <= 0) return fail(`Amount must be a positive amount in ${currency} (e.g. 250.00).`);
  if (!PAYOUT_METHODS.includes(methodRaw as PayoutMethod)) return fail("Pick a payout method.");
  const method = methodRaw as PayoutMethod;

  const input: CreatePayoutInput = { currency, amountMinor, method };
  if (partyId) input.partyId = partyId;
  if (reference) input.reference = reference;

  const result = await api.createPayout(input);
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath("/money");
  revalidatePath("/dashboard");
  const { payout } = result.data;
  return {
    status: "ok",
    message: `Recorded payout ${payout.id}.`,
    details: [
      { label: "To", value: payout.partyId ?? "Organizer" },
      { label: "Amount", value: formatMoney(payout.amountMinor, payout.currency) },
      { label: "Method", value: PAYOUT_METHOD_LABELS[payout.method] ?? humanize(payout.method) },
      { label: "Reference", value: payout.reference ?? "—" },
    ],
  };
}

export async function saveInstructorFeesAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = field(formData, "eventId");
  const currency = field(formData, "currency").toUpperCase();

  if (!eventId) return fail("Missing event id.");
  if (!CURRENCY_RE.test(currency)) return fail("Missing cohort currency.");

  // Rows with neither an instructor nor an amount are skipped; a row with one needs both.
  const fees: InstructorFee[] = [];
  for (let i = 0; i < MAX_INSTRUCTOR_FEES; i++) {
    const partyId = field(formData, `fee_${i}_partyId`);
    const amountRaw = field(formData, `fee_${i}_amount`);
    if (!partyId && !amountRaw) continue;
    if (!partyId) return fail(`Fee ${i + 1}: pick an instructor.`);
    if (!amountRaw) return fail(`Fee ${i + 1}: an amount is required.`);
    const amountMinor = parseMajorToMinor(amountRaw, currency);
    if (amountMinor === null) return fail(`Fee ${i + 1}: amount must be a non-negative amount in ${currency} (e.g. 500.00).`);
    if (fees.some((f) => f.partyId === partyId)) return fail(`Fee ${i + 1}: that instructor is listed twice.`);
    fees.push({ partyId, amountMinor });
  }

  const result = await api.setInstructorFees(eventId, { fees });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/money");
  const saved = result.data.instructorFees ?? [];
  const totalMinor = saved.reduce((sum, f) => sum + f.amountMinor, 0);
  return {
    status: "ok",
    message: saved.length === 0 ? "Cleared instructor fees." : `Saved ${saved.length} instructor fee${saved.length === 1 ? "" : "s"}.`,
    details: [{ label: "Total fees", value: formatMoney(totalMinor, result.data.currency || currency) }],
  };
}

export async function cancelCohortAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = field(formData, "eventId");
  const courseId = field(formData, "courseId");
  const reason = field(formData, "reason");
  const transferToEventId = field(formData, "transferToEventId");
  const confirmed = formData.get("confirm") === "on";

  if (!eventId) return fail("Missing event id.");
  if (!reason) return fail("A cancellation reason is required; it is shared with learners.");
  if (transferToEventId === eventId) return fail("Pick a different cohort to transfer learners to.");
  if (!confirmed) return fail("Tick the confirmation box to cancel this cohort.");

  const input: CancelEventInput = { reason };
  if (transferToEventId) input.transferToEventId = transferToEventId;

  const result = await api.cancelEvent(eventId, input);
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
  if (courseId) revalidatePath(`/courses/${courseId}`);
  if (transferToEventId) revalidatePath(`/events/${transferToEventId}`);
  revalidatePath("/orders");
  revalidatePath("/money");
  revalidatePath("/dashboard");

  const { event, refunded, transferred, voided } = result.data;
  return {
    status: "ok",
    message: `Cancelled "${event.name}".`,
    details: [
      { label: "Learners transferred", value: String(transferred) },
      { label: "Orders refunded", value: String(refunded) },
      { label: "Seats voided", value: String(voided) },
      { label: "Cancelled at", value: event.cancelledAt ? formatDateTime(event.cancelledAt) : formatDateTime(new Date().toISOString()) },
    ],
  };
}

// ---------- imports ----------

function summarizeImport(res: import("@/lib/api").ImportResponse): ActionState {
  const { plan, results, dryRun } = res;
  const details: { label: string; value: string }[] = [];
  if (res.eventbriteOrganization) details.push({ label: "Eventbrite organization", value: res.eventbriteOrganization.name });
  for (const item of plan.items) {
    const r = results.find((x) => x.sourceId === item.sourceId);
    const tickets = item.ticketTypes.map((t) => `${t.name} ${t.priceMinor === 0 ? "Free" : formatMoney(t.priceMinor, item.event.currency)} × ${t.quantity}${t.sold !== undefined ? ` (${t.sold} sold)` : ""}`).join(", ");
    const when = `${formatDateTimeInZone(item.event.startsAt, item.event.timezone)}${item.event.endsAt ? ` → ${formatDateTimeInZone(item.event.endsAt, item.event.timezone)}` : ""}`;
    const imageNote = (r?.image === "copied" ? ", image copied" : r?.image === "failed" ? `, image not copied (${r.imageError ?? "download failed"})` : "")
      + (r?.badge === "set" ? ", badge added" : r?.badge === "failed" ? ", badge not added" : "")
      + (r?.instructorsCreated?.length ? `, new instructor${r.instructorsCreated.length === 1 ? "" : "s"}: ${r.instructorsCreated.join(", ")}` : "")
      + (r?.draft ? ", saved as a draft" : "");
    const outcome = r ? (r.status === "created" ? `imported${r.courseCreated ? ", new course" : ""}${imageNote}` : `${r.status}${r.reason ? `: ${r.reason}` : ""}`) : "";
    const badge = item.course.badge;
    const imageHint = !r
      ? [
          item.course.imageUrl ? " · cover image" : "",
          badge ? ` · badge: ${badge.platform === "own" ? "own image" : badge.platform}` : "",
          item.course.certificationBody ? ` · ${item.course.certificationBody}` : "",
          item.event.instructors?.length ? ` · taught by ${item.event.instructors.join(", ")}` : "",
          item.event.minEnrollment ? ` · runs with ${item.event.minEnrollment}+` : "",
          item.event.meetingUrl ? " · joining link" : "",
          item.event.draft ? " · draft" : "",
        ].join("")
      : "";
    const warn = item.warnings.length ? ` ⚠ ${item.warnings.join("; ")}` : "";
    details.push({ label: item.event.name, value: `${when} · ${item.event.timezone} · course "${item.course.name}"${imageHint} · ${tickets}${outcome ? ` · ${outcome}` : ""}${warn}` });
  }
  for (const sk of plan.skipped) details.push({ label: `Skipped: ${sk.name}`, value: sk.reason });
  if (res.unmatchedHeaders?.length) details.push({ label: "Unused columns", value: res.unmatchedHeaders.join(", ") });
  const created = results.filter((r) => r.status === "created").length;
  const message = dryRun
    ? `Preview: ${plan.items.length} cohort${plan.items.length === 1 ? "" : "s"} across ${plan.courses.length} course${plan.courses.length === 1 ? "" : "s"} found, ${plan.skipped.length} skipped. Nothing was written; choose "Import" to create them.`
    : `Imported ${created} cohort${created === 1 ? "" : "s"}; ${results.filter((r) => r.status === "exists").length} already existed, ${results.filter((r) => r.status === "skipped").length} skipped, ${results.filter((r) => r.status === "failed").length} failed.`;
  return { status: "ok", message, details };
}

export async function importEventbriteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = field(formData, "token");
  if (token.length < 10) return fail("Paste your Eventbrite private token (Account settings → Developer links → API keys).");
  const mode = field(formData, "mode");
  const includePast = formData.get("includePast") === "on";
  const eventbriteOrganizationId = field(formData, "eventbriteOrganizationId");
  const result = await api.importEventbrite({ token, dryRun: mode !== "import", includePast, ...(eventbriteOrganizationId ? { eventbriteOrganizationId } : {}) });
  if (!result.ok) return fail(describeFailure(result.error));
  if (!result.data.dryRun) {
    revalidatePath("/events");
    revalidatePath("/courses");
  }
  return summarizeImport(result.data);
}

export async function importCsvAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const file = formData.get("file");
  let csv = field(formData, "csv");
  if (file instanceof File && file.size > 0) {
    if (file.size > 2_000_000) return fail("The file is larger than 2 MB.");
    csv = await file.text();
  }
  if (!csv.trim()) return fail("Paste CSV text or choose a file.");
  const mode = field(formData, "mode");
  const includePast = formData.get("includePast") === "on";
  const timezone = field(formData, "timezone") || DEFAULT_TIMEZONE;
  if (!isValidTimeZone(timezone)) return fail(`"${timezone}" is not a valid IANA time zone.`);
  const currency = field(formData, "currency").toUpperCase();
  if (currency && !CURRENCY_RE.test(currency)) return fail("Currency must be a 3-letter code.");
  const result = await api.importCsv({ csv, dryRun: mode !== "import", includePast, timezone, ...(currency ? { currency } : {}) });
  if (!result.ok) return fail(describeFailure(result.error));
  if (!result.data.dryRun) {
    revalidatePath("/events");
    revalidatePath("/courses");
  }
  return summarizeImport(result.data);
}

// ---------- localized pricing ----------

function pricingDetails(o: import("@/lib/api").Organization): { label: string; value: string }[] {
  const p = o.pricing;
  return [
    { label: "Currencies", value: [o.currency, ...p.currencies].join(", ") },
    { label: "Convert missing prices", value: p.fxFallback ? `yes, rounding: ${humanize(p.rounding)}` : "no (explicit prices only)" },
    { label: "Rates", value: Object.keys(p.rates).length ? Object.entries(p.rates).map(([c, r]) => `1 ${o.currency} = ${r} ${c}`).join(" · ") : "none yet" },
    { label: "Rates updated", value: p.ratesUpdatedAt ? `${formatDateTime(p.ratesUpdatedAt)} (${p.ratesSource === "ecb" ? "ECB reference" : "entered by hand"})` : "never" },
  ];
}

export async function updatePricingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const currencies = field(formData, "currencies").toUpperCase().split(/[\s,;]+/).filter(Boolean);
  for (const c of currencies) if (!CURRENCY_RE.test(c)) return fail(`"${c}" is not a 3-letter currency code.`);
  if (currencies.length > 12) return fail("At most 12 extra currencies.");
  const roundingRaw = field(formData, "rounding");
  if (!FX_ROUNDINGS.includes(roundingRaw as FxRounding)) return fail("Pick a rounding rule.");
  const fxFallback = formData.get("fxFallback") === "on";
  const rates: Record<string, number> = {};
  for (const c of currencies) {
    const raw = field(formData, `rate_${c}`);
    if (!raw) continue;
    const n = Number(raw.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return fail(`Rate for ${c} must be a positive number (units of ${c} per 1 unit of your base currency).`);
    rates[c] = n;
  }
  const result = await api.updatePricing({ currencies, fxFallback, rounding: roundingRaw as FxRounding, ...(Object.keys(rates).length ? { rates } : {}) });
  if (!result.ok) return fail(describeFailure(result.error));
  revalidatePath("/money");
  return { status: "ok", message: "Saved pricing settings.", details: pricingDetails(result.data) };
}

export async function refreshFxRatesAction(_prev: ActionState, _formData: FormData): Promise<ActionState> {
  const result = await api.refreshFxRates();
  if (!result.ok) return fail(describeFailure(result.error));
  revalidatePath("/money");
  return { status: "ok", message: "Fetched today's ECB reference rates.", details: pricingDetails(result.data) };
}

// ---------- course cover image ----------

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function updateCourseImageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const courseId = field(formData, "courseId");
  if (!courseId) return fail("Missing course id.");
  const mode = field(formData, "mode");
  const file = formData.get("image");
  const url = field(formData, "imageUrl");

  let result;
  if (mode === "remove") {
    result = await api.removeCourseImage(courseId);
  } else if (file instanceof File && file.size > 0) {
    if (!IMAGE_MIME.has(file.type)) return fail("Use a JPEG, PNG, WebP or GIF image.");
    if (file.size > 5 * 1024 * 1024) return fail("The image is larger than 5 MB. A 2160×1080 JPEG is usually under 500 KB.");
    result = await api.uploadCourseImage(courseId, await file.arrayBuffer(), file.type);
  } else if (url) {
    if (!isHttpUrl(url)) return fail("Image URL must be an absolute http(s) URL.");
    result = await api.importCourseImage(courseId, url);
  } else {
    return fail("Choose an image file or paste an image URL.");
  }
  if (!result.ok) return fail(describeFailure(result.error));
  revalidatePath(`/courses/${courseId}`);
  return { status: "ok", message: result.data.imageUrl ? "Cover image saved." : "Cover image removed." };
}

// ---------- door check-in ----------

export async function checkInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = field(formData, "token");
  const code = field(formData, "code");
  const eventId = field(formData, "eventId");
  const undo = field(formData, "undo") === "1";
  if (!token && !code) return fail("Type the code under the attendee's QR, e.g. EC-7K2M-94QX.");
  if (!token && !eventId) return fail("Pick the cohort first.");
  const result = await api.checkIn(token ? { token, undo } : { code, eventId, undo });
  if (!result.ok) return fail(describeFailure(result.error));
  const r = result.data;
  revalidatePath("/checkin");
  if (token) revalidatePath(`/checkin/${token}`);
  const who = r.seat.attendee.name ?? r.seat.attendee.email;
  const message = undo
    ? `Check-in undone for ${who}.`
    : r.alreadyCheckedIn
      ? `${who} was already checked in at ${new Date(r.seat.checkedInAt!).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`
      : `Checked in: ${who}.`;
  return { status: "ok", message, details: [{ label: "Cohort", value: r.event.name }, { label: "Code", value: r.code }] };
}


export async function updateCourseBadgeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const courseId = field(formData, "courseId");
  if (!courseId) return fail("Missing course id.");
  if (field(formData, "remove") === "1") {
    const r = await api.updateCourse(courseId, { badge: null });
    if (!r.ok) return fail(describeFailure(r.error));
    revalidatePath(`/courses/${courseId}`);
    return { status: "ok", message: "Badge removed." };
  }
  const platform = field(formData, "platform") as CourseBadge["platform"];
  const name = field(formData, "name");
  const url = field(formData, "url");
  let imageUrl = field(formData, "imageUrl");
  const file = formData.get("badgeImage");
  if (!(platform in BADGE_PLATFORMS)) return fail("Pick the badge platform.");
  if (!name) return fail("Give the badge a name.");
  if (platform !== "own" && !/^https:\/\//.test(url)) return fail("The badge link must start with https://");
  if (url && !/^https:\/\//.test(url)) return fail("The badge link must start with https://");
  if (imageUrl && !/^https?:\/\//.test(imageUrl)) return fail("The badge image link must be a web address.");
  // Your own badge (or your own image for a platform badge): store the upload first.
  if (file instanceof File && file.size > 0) {
    if (!IMAGE_MIME.has(file.type)) return fail("Use a JPEG, PNG, WebP or GIF image for the badge.");
    if (file.size > 5 * 1024 * 1024) return fail("The badge image is larger than 5 MB.");
    const up = await api.uploadBadgeImage(courseId, await file.arrayBuffer(), file.type, name);
    if (!up.ok) return fail(describeFailure(up.error));
    imageUrl = up.data.badge?.imageUrl ?? imageUrl;
  }
  if (platform === "own" && !imageUrl) return fail("Upload the badge image (PNG or JPEG, square works best).");
  const r = await api.updateCourse(courseId, { badge: { platform, name, ...(url && platform !== "own" ? { url } : {}), ...(imageUrl ? { imageUrl } : {}) } });
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath(`/courses/${courseId}`);
  return { status: "ok", message: `Badge saved. It shows on the course page, on certificates and in certificate emails.` };
}
