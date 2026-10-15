import { z } from "zod";
import type { Course, Event, Order, Organization, Party, Refund, Seat, TicketType } from "@gate/core";

export const ErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), hint: z.string().optional(), requestId: z.string().optional() }),
});

const Currency = z.string().regex(/^[A-Z]{3}$/, "ISO 4217 code");
const Minor = z.number().int().min(0);

export const SplitRuleSchema = z.discriminatedUnion("kind", [
  z.object({ partyId: z.string(), kind: z.literal("percent"), bps: z.number().int().min(0).max(10_000), label: z.string().optional() }),
  z.object({ partyId: z.string(), kind: z.literal("fixed"), amountMinor: Minor, label: z.string().optional() }),
]);

export const OrganizationSchema = z.object({
  id: z.string(), name: z.string(), country: z.string(), currency: Currency,
  payoutDestination: z.enum(["gate_account", "external_bank"]), passFeeToAttendee: z.boolean(),
  paymentsAccountRef: z.string().nullable(), splitRules: z.array(SplitRuleSchema), createdAt: z.string(),
});
export const CreateOrganizationBody = z.object({
  name: z.string().min(1), country: z.string().length(2), currency: Currency,
  payoutDestination: z.enum(["gate_account", "external_bank"]).optional(), passFeeToAttendee: z.boolean().optional(),
});
const PartyKind = z.enum(["venue", "vendor", "promoter", "tax_reserve", "instructor"]);
export const PartySchema = z.object({ id: z.string(), organizationId: z.string(), name: z.string(), kind: PartyKind, paymentsAccountRef: z.string().nullable(), createdAt: z.string() });
export const CreatePartyBody = z.object({ name: z.string().min(1), kind: PartyKind, paymentsAccountRef: z.string().optional() });

export const CourseSchema = z.object({ id: z.string(), organizationId: z.string(), slug: z.string(), name: z.string(), description: z.string().nullable(), certificationBody: z.string().nullable(), durationDays: z.number().int().nullable(), createdAt: z.string() });
export const CreateCourseBody = z.object({ slug: z.string().min(1).max(80), name: z.string().min(1), description: z.string().max(5000).optional(), certificationBody: z.string().max(200).optional(), durationDays: z.number().int().min(1).optional() });

const DeliveryFormat = z.enum(["live_virtual", "in_person", "hybrid", "self_paced"]);
const IsoDate = z.string().datetime({ offset: true });
export const SessionSchema = z.object({ startsAt: z.string(), endsAt: z.string(), title: z.string().optional() });
export const SessionInput = z.object({ startsAt: IsoDate, endsAt: IsoDate, title: z.string().max(200).optional() });
export const EventSchema = z.object({
  id: z.string(), organizationId: z.string(), courseId: z.string().nullable(), name: z.string(), startsAt: z.string(), endsAt: z.string().nullable(),
  timezone: z.string(), format: DeliveryFormat, sessions: z.array(SessionSchema), instructorIds: z.array(z.string()), minEnrollment: z.number().int().nullable(),
  currency: Currency, status: z.enum(["draft", "live", "ended", "cancelled"]), splitRules: z.array(SplitRuleSchema).nullable(), createdAt: z.string(),
});
export const CreateEventBody = z.object({
  name: z.string().min(1), startsAt: IsoDate.optional(), currency: Currency.optional(), splitRules: z.array(SplitRuleSchema).optional(),
  courseId: z.string().optional(), timezone: z.string().optional(), format: DeliveryFormat.optional(), sessions: z.array(SessionInput).max(60).optional(),
  instructorIds: z.array(z.string()).max(20).optional(), minEnrollment: z.number().int().min(0).optional(),
});

const PriceList = z.record(Currency, Minor);
export const PriceTierSchema = z.object({ until: z.string(), priceMinor: Minor, prices: PriceList.nullable() });
export const TicketTypeSchema = z.object({ id: z.string(), eventId: z.string(), organizationId: z.string(), name: z.string(), priceMinor: Minor, prices: PriceList.nullable(), earlyBird: PriceTierSchema.nullable(), quantity: z.number().int(), sold: z.number().int() });
export const CreateTicketTypeBody = z.object({
  name: z.string().min(1), priceMinor: Minor, quantity: z.number().int().min(1), prices: PriceList.optional(),
  earlyBird: z.object({ until: IsoDate, priceMinor: Minor, prices: PriceList.optional() }).optional(),
});

export const AttendeeSchema = z.object({ email: z.string().email(), name: z.string().max(200).optional(), company: z.string().max(200).optional() });
export const SeatSchema = z.object({ id: z.string(), organizationId: z.string(), orderId: z.string(), eventId: z.string(), ticketTypeId: z.string(), attendee: AttendeeSchema, status: z.enum(["reserved", "confirmed", "cancelled", "transferred"]), createdAt: z.string(), confirmedAt: z.string().nullable() });

export const PublicCourseSchema = z.object({
  organization: z.object({ id: z.string(), name: z.string(), country: z.string(), currency: Currency }),
  course: CourseSchema,
  cohorts: z.array(z.object({
    event: EventSchema,
    ticketTypes: z.array(z.object({ id: z.string(), name: z.string(), remaining: z.number().int(), prices: PriceList, earlyBirdUntil: z.string().nullable() })),
  })),
});

export const PricingSchema = z.object({
  currency: Currency, quantity: z.number().int(), unitPriceMinor: Minor, subtotalMinor: Minor, platformFeeMinor: Minor,
  attendeeFeeMinor: Minor, totalMinor: Minor, organizerNetMinor: Minor, perTicketFeeMinor: Minor,
});
export const OrderSchema = z.object({
  id: z.string(), organizationId: z.string(), eventId: z.string(), ticketTypeId: z.string(), quantity: z.number().int(), buyerEmail: z.string(),
  attendees: z.array(AttendeeSchema), currency: Currency, status: z.enum(["pending", "paid", "refunded", "partially_refunded", "failed"]), pricing: PricingSchema,
  splits: z.object({ organizerMinor: Minor, lines: z.array(z.object({ partyId: z.string(), amountMinor: Minor, label: z.string().optional() })) }),
  paymentRef: z.string().nullable(), transferRefs: z.record(z.string(), z.string()), refundedMinor: Minor, createdAt: z.string(), paidAt: z.string().nullable(),
});
export const CreateOrderBody = z.object({ ticketTypeId: z.string(), quantity: z.number().int().min(1).max(100), buyerEmail: z.string().email(), currency: Currency.optional(), attendees: z.array(AttendeeSchema).max(100).optional(), dryRun: z.boolean().optional() });
export const RefundSchema = z.object({ id: z.string(), orderId: z.string(), organizationId: z.string(), amountMinor: Minor, reason: z.string(), status: z.enum(["pending", "succeeded", "failed"]), paymentRefundRef: z.string().nullable(), createdAt: z.string() });
export const CreateRefundBody = z.object({ orderId: z.string(), amountMinor: z.number().int().min(1).optional(), reason: z.string().min(1) });
export const BalanceSchema = z.object({ code: z.string(), name: z.string(), type: z.string(), currency: Currency, balanceMinor: z.number().int() });

export const toOrganization = (o: Organization) => ({ ...o, paymentsAccountRef: o.paymentsAccountRef ?? null, createdAt: o.createdAt.toISOString() });
export const toParty = (p: Party) => ({ ...p, paymentsAccountRef: p.paymentsAccountRef ?? null, createdAt: p.createdAt.toISOString() });
export const toCourse = (c: Course) => ({ ...c, description: c.description ?? null, certificationBody: c.certificationBody ?? null, durationDays: c.durationDays ?? null, createdAt: c.createdAt.toISOString() });
export const toEvent = (e: Event) => ({
  ...e, courseId: e.courseId ?? null, splitRules: e.splitRules ?? null, startsAt: e.startsAt.toISOString(), endsAt: e.endsAt?.toISOString() ?? null,
  minEnrollment: e.minEnrollment ?? null, sessions: e.sessions.map((s) => ({ startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString(), ...(s.title ? { title: s.title } : {}) })), createdAt: e.createdAt.toISOString(),
});
export const toTicketType = (t: TicketType) => ({ ...t, prices: t.prices ?? null, earlyBird: t.earlyBird ? { until: t.earlyBird.until.toISOString(), priceMinor: t.earlyBird.priceMinor, prices: t.earlyBird.prices ?? null } : null });
export const toSeat = (s: Seat) => ({ ...s, createdAt: s.createdAt.toISOString(), confirmedAt: s.confirmedAt?.toISOString() ?? null });
export const parseSessions = (sessions: Array<{ startsAt: string; endsAt: string; title?: string | undefined }> | undefined) =>
  sessions?.map((s) => ({ startsAt: new Date(s.startsAt), endsAt: new Date(s.endsAt), ...(s.title ? { title: s.title } : {}) }));
export const toOrder = (o: Order) => ({ ...o, paymentRef: o.paymentRef ?? null, createdAt: o.createdAt.toISOString(), paidAt: o.paidAt?.toISOString() ?? null });
export const toRefund = (r: Refund) => ({ ...r, paymentRefundRef: r.paymentRefundRef ?? null, createdAt: r.createdAt.toISOString() });
