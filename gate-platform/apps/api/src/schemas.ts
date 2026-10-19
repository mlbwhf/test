import { z } from "zod";
import type { CorporateAccount, Course, Event, Invoice, Order, Organization, Party, Payout, Refund, Seat, SeatTransfer, TicketType, WaitlistEntry } from "@gate/core";

export const ErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), hint: z.string().optional(), requestId: z.string().optional() }),
});

export const Currency = z.string().regex(/^[A-Z]{3}$/, "ISO 4217 code");
const Minor = z.number().int().min(0);

export const SplitRuleSchema = z.discriminatedUnion("kind", [
  z.object({ partyId: z.string(), kind: z.literal("percent"), bps: z.number().int().min(0).max(10_000), label: z.string().optional() }),
  z.object({ partyId: z.string(), kind: z.literal("fixed"), amountMinor: Minor, label: z.string().optional() }),
]);

export const PricingSettingsSchema = z.object({
  currencies: z.array(Currency), fxFallback: z.boolean(), rounding: z.enum(["none", "whole", "nine", "five"]),
  rates: z.record(z.string(), z.number()), ratesUpdatedAt: z.string().nullable(), ratesSource: z.enum(["manual", "ecb"]).nullable(),
});
export const UpdatePricingBody = z.object({
  currencies: z.array(z.string().length(3)).max(12).optional(), fxFallback: z.boolean().optional(), rounding: z.enum(["none", "whole", "nine", "five"]).optional(),
  rates: z.record(z.string(), z.number().positive()).optional(),
});
export const OrganizationSchema = z.object({
  id: z.string(), name: z.string(), country: z.string(), currency: Currency,
  payoutDestination: z.enum(["gate_account", "external_bank"]), passFeeToAttendee: z.boolean(),
  paymentsAccountRef: z.string().nullable(), splitRules: z.array(SplitRuleSchema),
  releasePolicy: z.enum(["immediate", "on_delivery"]), releaseGraceHours: z.number(), minEnrollmentDecisionDays: z.number(),
  pricing: PricingSettingsSchema, createdAt: z.string(),
});
export const UpdateOrganizationBody = z.object({ name: z.string().min(1).optional(), releasePolicy: z.enum(["immediate", "on_delivery"]).optional(), releaseGraceHours: z.number().min(0).max(720).optional(), minEnrollmentDecisionDays: z.number().min(0).max(90).optional(), passFeeToAttendee: z.boolean().optional() });
export const InstructorFeeSchema = z.object({ partyId: z.string(), amountMinor: Minor });
export const PayoutSchema = z.object({ id: z.string(), partyId: z.string().nullable(), currency: Currency, amountMinor: Minor, method: z.enum(["bank_transfer", "wire", "cheque", "other"]), reference: z.string().nullable(), createdAt: z.string() });
export const CreatePayoutBody = z.object({ partyId: z.string().optional(), currency: Currency, amountMinor: z.number().int().min(1), method: z.enum(["bank_transfer", "wire", "cheque", "other"]), reference: z.string().max(120).optional() });
export const PayableSchema = z.object({ partyId: z.string().nullable(), name: z.string(), kind: z.string().nullable(), currency: Currency, payableMinor: z.number().int(), heldMinor: z.number().int() });
export const RevenueCohortSchema = z.object({ eventId: z.string(), name: z.string(), courseName: z.string().nullable(), startsAt: z.string(), endsAt: z.string().nullable(), currency: Currency, status: z.string(), seats: z.number().int(), grossMinor: z.number().int(), platformFeeMinor: z.number().int(), taxMinor: z.number().int(), organizerNetMinor: z.number().int(), refundedMinor: z.number().int(), instructorFeesMinor: z.number().int(), marginMinor: z.number().int(), fundsStatus: z.enum(["held", "released", "mixed", "none"]), recognized: z.boolean() });
export const CreateOrganizationBody = z.object({
  name: z.string().min(1), country: z.string().length(2), currency: Currency,
  payoutDestination: z.enum(["gate_account", "external_bank"]).optional(), passFeeToAttendee: z.boolean().optional(), releasePolicy: z.enum(["immediate", "on_delivery"]).optional(),
});
const PartyKind = z.enum(["venue", "vendor", "promoter", "tax_reserve", "instructor"]);
export const PartySchema = z.object({ id: z.string(), organizationId: z.string(), name: z.string(), kind: PartyKind, paymentsAccountRef: z.string().nullable(), createdAt: z.string() });
export const CreatePartyBody = z.object({ name: z.string().min(1), kind: PartyKind, paymentsAccountRef: z.string().optional() });

export const CourseSchema = z.object({ id: z.string(), organizationId: z.string(), slug: z.string(), name: z.string(), description: z.string().nullable(), certificationBody: z.string().nullable(), durationDays: z.number().int().nullable(), prework: z.string().nullable(), surveyUrl: z.string().nullable(), createdAt: z.string() });
export const UpdateCourseBody = z.object({ description: z.string().max(5000).nullable().optional(), prework: z.string().max(20_000).nullable().optional(), surveyUrl: z.string().max(500).nullable().optional(), certificationBody: z.string().max(200).nullable().optional(), durationDays: z.number().int().min(1).nullable().optional() });
export const MeetingSchema = z.object({ provider: z.enum(["zoom", "teams", "manual"]), meetingId: z.string(), joinUrl: z.string(), hostUrl: z.string().nullable(), passcode: z.string().nullable() });
export const AttendanceRowSchema = z.object({ seatId: z.string(), email: z.string(), name: z.string().nullable(), status: z.enum(["present", "partial", "absent", "unknown"]), minutes: z.number(), sessionsAttended: z.number().int(), source: z.enum(["provider", "manual", "none"]), updatedAt: z.string() });
export const CertificateSchema = z.object({ id: z.string(), seatId: z.string(), eventId: z.string(), attendeeName: z.string(), attendeeEmail: z.string(), courseName: z.string(), issuedAt: z.string(), verifyCode: z.string(), verifyUrl: z.string(), viewUrl: z.string() });
export const MessageSchema = z.object({ key: z.string(), step: z.enum(["prework_t14", "reminder_t7", "reminder_t1", "day_of", "survey", "certificate"]), to: z.string(), sentAt: z.string() });
export const CreateCourseBody = z.object({ slug: z.string().min(1).max(80), name: z.string().min(1), description: z.string().max(5000).optional(), certificationBody: z.string().max(200).optional(), durationDays: z.number().int().min(1).optional() });

export const DeliveryFormat = z.enum(["live_virtual", "in_person", "hybrid", "self_paced"]);
const IsoDate = z.string().datetime({ offset: true });
export const SessionSchema = z.object({ startsAt: z.string(), endsAt: z.string(), title: z.string().optional() });
export const SessionInput = z.object({ startsAt: IsoDate, endsAt: IsoDate, title: z.string().max(200).optional() });
export const EventSchema = z.object({
  id: z.string(), organizationId: z.string(), courseId: z.string().nullable(), name: z.string(), startsAt: z.string(), endsAt: z.string().nullable(),
  timezone: z.string(), format: DeliveryFormat, sessions: z.array(SessionSchema), instructorIds: z.array(z.string()), minEnrollment: z.number().int().nullable(), meeting: MeetingSchema.nullable(),
  instructorFees: z.array(InstructorFeeSchema), atRiskAt: z.string().nullable(), cancelledAt: z.string().nullable(), cancelReason: z.string().nullable(),
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
export const SeatSchema = z.object({
  id: z.string(), organizationId: z.string(), orderId: z.string(), eventId: z.string(), ticketTypeId: z.string(), attendee: AttendeeSchema, status: z.enum(["reserved", "confirmed", "cancelled", "transferred"]), createdAt: z.string(), confirmedAt: z.string().nullable(),
  transferredFromSeatId: z.string().nullable(), transferredToSeatId: z.string().nullable(), cancelledAt: z.string().nullable(), substitutions: z.array(z.object({ from: AttendeeSchema, at: z.string() })),
});
export const ChangePolicySchema = z.object({
  transferFreeUntilDays: z.number().min(0), transferFeeBps: z.number().int().min(0).max(10_000), transferCutoffDays: z.number().min(0),
  cancelFullRefundUntilDays: z.number().min(0), cancelPartialRefundBps: z.number().int().min(0).max(10_000), cancelNoRefundWithinDays: z.number().min(0),
  substituteAllowed: z.boolean(), substituteCutoffHours: z.number().min(0), waitlistOfferHours: z.number().min(1).max(168),
});
export const SeatOptionsSchema = z.object({
  seat: SeatSchema, event: z.lazy(() => EventSchema), course: z.lazy(() => CourseSchema).nullable(), organization: z.object({ id: z.string(), name: z.string() }),
  policy: z.object({
    transfer: z.object({ allowed: z.boolean(), feeMinor: Minor, freeUntil: z.string(), reason: z.string().optional() }),
    cancel: z.object({ allowed: z.boolean(), refundBps: z.number().int(), refundMinor: Minor, fullRefundUntil: z.string(), reason: z.string().optional() }),
    substitute: z.object({ allowed: z.boolean(), until: z.string(), reason: z.string().optional() }),
  }),
  transferOptions: z.array(z.object({ eventId: z.string(), ticketTypeId: z.string(), name: z.string(), startsAt: z.string(), endsAt: z.string().nullable(), timezone: z.string(), remaining: z.number().int(), priceDeltaMinor: Minor, feeMinor: Minor })),
  calendarUrl: z.string(),
});
export const SeatTransferSchema = z.object({ id: z.string(), fromSeatId: z.string(), toEventId: z.string(), toTicketTypeId: z.string(), feeMinor: Minor, currency: Currency, status: z.enum(["pending_payment", "completed", "failed"]), paymentRef: z.string().nullable(), toSeatId: z.string().nullable(), createdAt: z.string() });
export const WaitlistEntrySchema = z.object({ id: z.string(), eventId: z.string(), ticketTypeId: z.string(), email: z.string(), name: z.string().nullable(), quantity: z.number().int(), status: z.enum(["waiting", "offered", "converted", "expired", "cancelled"]), createdAt: z.string(), offeredAt: z.string().nullable(), offerExpiresAt: z.string().nullable() });
export const JoinWaitlistBody = z.object({ eventId: z.string(), ticketTypeId: z.string().optional(), email: z.string().email(), name: z.string().max(200).optional(), quantity: z.number().int().min(1).max(10).optional() });

export const PublicCourseSchema = z.object({
  organization: z.object({ id: z.string(), name: z.string(), country: z.string(), currency: Currency, currencies: z.array(Currency), ratesUpdatedAt: z.string().nullable() }),
  course: CourseSchema,
  cohorts: z.array(z.object({
    event: EventSchema,
    ticketTypes: z.array(z.object({ id: z.string(), name: z.string(), remaining: z.number().int(), prices: PriceList, converted: z.array(Currency), earlyBirdUntil: z.string().nullable() })),
  })),
});

export const PricingSchema = z.object({
  currency: Currency, quantity: z.number().int(), unitPriceMinor: Minor, subtotalMinor: Minor, platformFeeMinor: Minor,
  attendeeFeeMinor: Minor, taxMinor: Minor, totalMinor: Minor, organizerNetMinor: Minor, perTicketFeeMinor: Minor,
});
export const BillingAddressSchema = z.object({ country: z.string().length(2), region: z.string().max(10).optional(), postalCode: z.string().max(20).optional(), city: z.string().max(100).optional(), line1: z.string().max(200).optional(), taxId: z.string().max(40).optional() });
export const CorporateAccountSchema = z.object({ id: z.string(), organizationId: z.string(), name: z.string(), billingEmail: z.string(), address: BillingAddressSchema, poRequired: z.boolean(), netTermsDays: z.number().int(), currency: Currency, createdAt: z.string() });
export const CreateCorporateAccountBody = z.object({ name: z.string().min(1), billingEmail: z.string().email(), address: BillingAddressSchema, poRequired: z.boolean().optional(), netTermsDays: z.number().int().min(0).max(180).optional(), currency: Currency.optional() });
export const InvoicePaymentSchema = z.object({ id: z.string(), amountMinor: Minor, method: z.enum(["bank_transfer", "wire", "ach", "card", "cheque", "other"]), reference: z.string().nullable(), receivedAt: z.string() });
export const InvoiceSchema = z.object({
  id: z.string(), organizationId: z.string(), orderId: z.string(), corporateAccountId: z.string().nullable(), number: z.string(), poNumber: z.string().nullable(), currency: Currency,
  subtotalMinor: Minor, taxMinor: Minor, totalMinor: Minor, paidMinor: Minor, status: z.enum(["issued", "partially_paid", "paid", "void"]), issuedAt: z.string(), dueAt: z.string(), payments: z.array(InvoicePaymentSchema), createdAt: z.string(),
});
export const CreateInvoiceOrderBody = z.object({ corporateAccountId: z.string(), ticketTypeId: z.string(), quantity: z.number().int().min(1).max(500), attendees: z.array(z.object({ email: z.string().email(), name: z.string().max(200).optional(), company: z.string().max(200).optional() })).max(500).optional(), poNumber: z.string().max(80).optional(), currency: Currency.optional(), dueDays: z.number().int().min(0).max(180).optional(), dryRun: z.boolean().optional() });
export const RecordInvoicePaymentBody = z.object({ amountMinor: Minor, method: z.enum(["bank_transfer", "wire", "ach", "cheque", "other"]), reference: z.string().max(120).optional(), receivedAt: z.string().datetime({ offset: true }).optional() });
export const OrderSchema = z.object({
  id: z.string(), organizationId: z.string(), eventId: z.string(), ticketTypeId: z.string(), quantity: z.number().int(), buyerEmail: z.string(),
  attendees: z.array(AttendeeSchema), currency: Currency, status: z.enum(["pending", "paid", "refunded", "partially_refunded", "failed", "cancelled"]), paymentMethod: z.enum(["card", "invoice"]), corporateAccountId: z.string().nullable(), billingAddress: BillingAddressSchema.nullable(), pricing: PricingSchema,
  splits: z.object({ organizerMinor: Minor, lines: z.array(z.object({ partyId: z.string(), amountMinor: Minor, label: z.string().optional() })) }),
  paymentRef: z.string().nullable(), transferRefs: z.record(z.string(), z.string()), refundedMinor: Minor, heldMinor: Minor, fundsStatus: z.enum(["none", "held", "released"]), releasedAt: z.string().nullable(), createdAt: z.string(), paidAt: z.string().nullable(),
});
export const CreateOrderBody = z.object({ ticketTypeId: z.string(), quantity: z.number().int().min(1).max(100), buyerEmail: z.string().email(), currency: Currency.optional(), attendees: z.array(AttendeeSchema).max(100).optional(), billingAddress: BillingAddressSchema.optional(), waitlistEntryId: z.string().optional(), dryRun: z.boolean().optional() });
export const RefundSchema = z.object({ id: z.string(), orderId: z.string(), organizationId: z.string(), amountMinor: Minor, reason: z.string(), status: z.enum(["pending", "succeeded", "failed"]), paymentRefundRef: z.string().nullable(), createdAt: z.string() });
export const CreateRefundBody = z.object({ orderId: z.string(), amountMinor: z.number().int().min(1).optional(), reason: z.string().min(1) });
export const BalanceSchema = z.object({ code: z.string(), name: z.string(), type: z.string(), currency: Currency, balanceMinor: z.number().int() });

export const toPricing = (p: Organization["pricing"]) => ({ currencies: p?.currencies ?? [], fxFallback: p?.fxFallback ?? false, rounding: p?.rounding ?? "whole", rates: p?.rates ?? {}, ratesUpdatedAt: p?.ratesUpdatedAt?.toISOString() ?? null, ratesSource: p?.ratesSource ?? null });
export const toOrganization = (o: Organization) => ({ ...o, paymentsAccountRef: o.paymentsAccountRef ?? null, pricing: toPricing(o.pricing), createdAt: o.createdAt.toISOString() });
export const toParty = (p: Party) => ({ ...p, paymentsAccountRef: p.paymentsAccountRef ?? null, createdAt: p.createdAt.toISOString() });
export const toCourse = (c: Course) => ({ ...c, description: c.description ?? null, certificationBody: c.certificationBody ?? null, durationDays: c.durationDays ?? null, prework: c.prework ?? null, surveyUrl: c.surveyUrl ?? null, createdAt: c.createdAt.toISOString() });
export const toEvent = (e: Event) => ({
  ...e, courseId: e.courseId ?? null, splitRules: e.splitRules ?? null, startsAt: e.startsAt.toISOString(), endsAt: e.endsAt?.toISOString() ?? null,
  minEnrollment: e.minEnrollment ?? null, sessions: e.sessions.map((s) => ({ startsAt: s.startsAt.toISOString(), endsAt: s.endsAt.toISOString(), ...(s.title ? { title: s.title } : {}) })), createdAt: e.createdAt.toISOString(),
  meeting: e.meeting ? { ...e.meeting, hostUrl: e.meeting.hostUrl ?? null, passcode: e.meeting.passcode ?? null } : null,
  instructorFees: e.instructorFees ?? [], atRiskAt: e.atRiskAt?.toISOString() ?? null, cancelledAt: e.cancelledAt?.toISOString() ?? null, cancelReason: e.cancelReason ?? null,
});
export const toPayout = (p: Payout) => ({ id: p.id, partyId: p.partyId ?? null, currency: p.currency, amountMinor: p.amountMinor, method: p.method, reference: p.reference ?? null, createdAt: p.createdAt.toISOString() });
export const toTicketType = (t: TicketType) => ({ ...t, prices: t.prices ?? null, earlyBird: t.earlyBird ? { until: t.earlyBird.until.toISOString(), priceMinor: t.earlyBird.priceMinor, prices: t.earlyBird.prices ?? null } : null });
export const toSeat = (s: Seat) => ({
  ...s, createdAt: s.createdAt.toISOString(), confirmedAt: s.confirmedAt?.toISOString() ?? null, cancelledAt: s.cancelledAt?.toISOString() ?? null,
  transferredFromSeatId: s.transferredFromSeatId ?? null, transferredToSeatId: s.transferredToSeatId ?? null, substitutions: (s.substitutions ?? []).map((x) => ({ from: x.from, at: x.at.toISOString() })),
});
export const toTransfer = (t: SeatTransfer) => ({ id: t.id, fromSeatId: t.fromSeatId, toEventId: t.toEventId, toTicketTypeId: t.toTicketTypeId, feeMinor: t.feeMinor, currency: t.currency, status: t.status, paymentRef: t.paymentRef ?? null, toSeatId: t.toSeatId ?? null, createdAt: t.createdAt.toISOString() });
export const toWaitlist = (e: WaitlistEntry) => ({ id: e.id, eventId: e.eventId, ticketTypeId: e.ticketTypeId, email: e.email, name: e.name ?? null, quantity: e.quantity, status: e.status, createdAt: e.createdAt.toISOString(), offeredAt: e.offeredAt?.toISOString() ?? null, offerExpiresAt: e.offerExpiresAt?.toISOString() ?? null });
export const parseSessions = (sessions: Array<{ startsAt: string; endsAt: string; title?: string | undefined }> | undefined) =>
  sessions?.map((s) => ({ startsAt: new Date(s.startsAt), endsAt: new Date(s.endsAt), ...(s.title ? { title: s.title } : {}) }));
export const toOrder = (o: Order) => ({ ...o, paymentRef: o.paymentRef ?? null, corporateAccountId: o.corporateAccountId ?? null, billingAddress: o.billingAddress ?? null, releasedAt: o.releasedAt?.toISOString() ?? null, createdAt: o.createdAt.toISOString(), paidAt: o.paidAt?.toISOString() ?? null });
export const toCorporateAccount = (a: CorporateAccount) => ({ ...a, createdAt: a.createdAt.toISOString() });
export const toInvoice = (i: Invoice) => ({ ...i, corporateAccountId: i.corporateAccountId ?? null, poNumber: i.poNumber ?? null, issuedAt: i.issuedAt.toISOString(), dueAt: i.dueAt.toISOString(), createdAt: i.createdAt.toISOString(), payments: i.payments.map((p) => ({ ...p, reference: p.reference ?? null, receivedAt: p.receivedAt.toISOString() })), cardPaymentRef: undefined });
export const toRefund = (r: Refund) => ({ ...r, paymentRefundRef: r.paymentRefundRef ?? null, createdAt: r.createdAt.toISOString() });
