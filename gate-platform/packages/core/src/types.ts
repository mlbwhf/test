import type { PricingSettings } from "./fx.js";
import type { Currency, MinorUnits } from "@gate/ledger";
import type { PayoutDestination, Pricing, SplitResult, SplitRule } from "@gate/pricing";
import type { ChangePolicy } from "./policy.js";

export interface Organization {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2. Drives entity (US -> Delaware, EU -> Lithuania, AE -> UAE). */
  country: string;
  currency: Currency;
  payoutDestination: PayoutDestination;
  passFeeToAttendee: boolean;
  /** Connected account at the payments provider (e.g. Stripe acct_...). */
  paymentsAccountRef?: string;
  /** Default split rules applied to every event unless the event overrides. */
  splitRules: SplitRule[];
  /** Transfer / cancel / substitute rules; courses may override. */
  changePolicy?: ChangePolicy;
  /** When organizer-side funds become payable: immediately on payment, or after the cohort is delivered. */
  releasePolicy: ReleasePolicy;
  /** Hours after the cohort ends before held funds release. */
  releaseGraceHours: number;
  /** Days before start at which a cohort below its minimum enrolment is flagged at risk. */
  minEnrollmentDecisionDays: number;
  /** Presentment currencies, FX fallback and stored rates; absent = base currency only. */
  pricing?: PricingSettings;
  apiKeyHash: string;
  createdAt: Date;
}

export type ReleasePolicy = "immediate" | "on_delivery";
export type PartyKind = "venue" | "vendor" | "promoter" | "tax_reserve" | "instructor";
export interface Party {
  id: string;
  organizationId: string;
  name: string;
  kind: PartyKind;
  paymentsAccountRef?: string;
  createdAt: Date;
}

/** A course is the evergreen, canonical thing a provider teaches. Cohorts are its dated instances. */
export interface Course {
  id: string;
  organizationId: string;
  /** URL-safe, unique per organization, e.g. "leading-safe". */
  slug: string;
  name: string;
  description?: string;
  /** e.g. "Scaled Agile", "Scrum.org", "PMI". Drives roster export formats later. */
  certificationBody?: string;
  durationDays?: number;
  changePolicy?: ChangePolicy;
  /** Pre-work text sent two weeks before each cohort. */
  prework?: string;
  /** Post-class survey link sent after the cohort ends. */
  surveyUrl?: string;
  /** Cover image (2:1 banner) shown on the public page, widget and JSON-LD. */
  imageUrl?: string;
  createdAt: Date;
}

export interface MeetingInfo {
  provider: "zoom" | "teams" | "manual";
  meetingId: string;
  joinUrl: string;
  hostUrl?: string | undefined;
  passcode?: string | undefined;
}

export type DeliveryFormat = "live_virtual" | "in_person" | "hybrid" | "self_paced";

export interface Session {
  startsAt: Date;
  endsAt: Date;
  title?: string;
}

export type EventStatus = "draft" | "live" | "ended" | "cancelled";
/**
 * An Event is a sellable dated thing. When `courseId` is set it is a cohort
 * of that course (schema.org CourseInstance). Sessions carry the day-by-day
 * schedule in the cohort's time zone.
 */
export interface Event {
  id: string;
  organizationId: string;
  courseId?: string;
  name: string;
  startsAt: Date;
  endsAt?: Date;
  /** IANA time zone, e.g. "America/Toronto". */
  timezone: string;
  format: DeliveryFormat;
  sessions: Session[];
  /** Parties of kind "instructor" teaching this cohort. */
  instructorIds: string[];
  /** Below this, the cohort is at risk of cancellation (sprint 6 uses it). */
  minEnrollment?: number;
  meeting?: MeetingInfo;
  /** Flat fees paid to instructors (or other parties) from the organizer's share when the cohort is delivered. */
  instructorFees?: Array<{ partyId: string; amountMinor: MinorUnits }>;
  atRiskAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  currency: Currency;
  status: EventStatus;
  splitRules?: SplitRule[];
  createdAt: Date;
}

/** Early-bird window: until `until`, the tier price applies. */
export interface PriceTier {
  until: Date;
  priceMinor: MinorUnits;
  /** Regional prices for the tier; falls back to priceMinor in the event currency. */
  prices?: Record<string, MinorUnits>;
}

export interface TicketType {
  id: string;
  eventId: string;
  organizationId: string;
  name: string;
  /** Price in the event's base currency. */
  priceMinor: MinorUnits;
  /** Regional price list: currency -> minor units. Buyers pay in a listed currency or the base currency. */
  prices?: Record<string, MinorUnits>;
  earlyBird?: PriceTier;
  quantity: number;
  sold: number;
}

export interface Attendee {
  email: string;
  name?: string | undefined;
  company?: string | undefined;
}

export type SeatStatus = "reserved" | "confirmed" | "cancelled" | "transferred";
/** One learner in one cohort. The unit that gets rostered, transferred, certified. */
export interface Seat {
  id: string;
  organizationId: string;
  orderId: string;
  eventId: string;
  ticketTypeId: string;
  attendee: Attendee;
  status: SeatStatus;
  createdAt: Date;
  confirmedAt?: Date;
  /** Set when this seat replaced one on another cohort. */
  transferredFromSeatId?: string;
  /** Set on the old seat after a transfer. */
  transferredToSeatId?: string;
  /** Previous attendees, most recent last. */
  substitutions?: Array<{ from: Attendee; at: Date }>;
  cancelledAt?: Date;
  attendance?: Attendance;
}

export type AttendanceStatus = "present" | "partial" | "absent" | "unknown";
export interface Attendance {
  status: AttendanceStatus;
  minutes: number;
  sessionsAttended: number;
  source: "provider" | "manual" | "none";
  updatedAt: Date;
}

export interface Certificate {
  id: string;
  organizationId: string;
  seatId: string;
  eventId: string;
  courseName: string;
  attendeeName: string;
  attendeeEmail: string;
  issuedAt: Date;
  /** Unguessable public verification code. */
  verifyCode: string;
  revokedAt?: Date;
}

export type SequenceStep = "prework_t14" | "reminder_t7" | "reminder_t1" | "day_of" | "survey" | "certificate";
export interface MessageLogEntry {
  key: string;
  step: SequenceStep;
  organizationId: string;
  eventId: string;
  seatId?: string;
  to: string;
  sentAt: Date;
}

export type SeatTransferStatus = "pending_payment" | "completed" | "failed";
export interface SeatTransfer {
  id: string;
  organizationId: string;
  fromSeatId: string;
  toEventId: string;
  toTicketTypeId: string;
  /** Policy fee plus any price difference, in the order's currency. */
  feeMinor: MinorUnits;
  currency: Currency;
  status: SeatTransferStatus;
  paymentRef?: string;
  toSeatId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export type WaitlistStatus = "waiting" | "offered" | "converted" | "expired" | "cancelled";
export interface WaitlistEntry {
  id: string;
  organizationId: string;
  eventId: string;
  ticketTypeId: string;
  email: string;
  name?: string;
  quantity: number;
  status: WaitlistStatus;
  createdAt: Date;
  offeredAt?: Date;
  offerExpiresAt?: Date;
  convertedOrderId?: string;
}

export interface BillingAddress {
  /** ISO 3166-1 alpha-2. */
  country: string;
  /** Province / state code, e.g. "ON", "CA". */
  region?: string | undefined;
  postalCode?: string | undefined;
  city?: string | undefined;
  line1?: string | undefined;
  /** VAT / GST / TRN number; enables B2B reverse charge where applicable. */
  taxId?: string | undefined;
}

export interface CorporateAccount {
  id: string;
  organizationId: string;
  name: string;
  billingEmail: string;
  address: BillingAddress;
  /** Buyers that require a purchase order number on every invoice. */
  poRequired: boolean;
  netTermsDays: number;
  currency: Currency;
  createdAt: Date;
}

export type PaymentMethod = "card" | "invoice";
export type OrderStatus = "pending" | "paid" | "refunded" | "partially_refunded" | "failed" | "cancelled";
export interface Order {
  id: string;
  organizationId: string;
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  buyerEmail: string;
  attendees: Attendee[];
  currency: Currency;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  corporateAccountId?: string;
  billingAddress?: BillingAddress;
  pricing: Pricing;
  splits: SplitResult;
  paymentRef?: string;
  transferRefs: Record<string, string>;
  refundedMinor: MinorUnits;
  /** Organizer-side money (organizer + split parties) still held pending delivery. */
  heldMinor: MinorUnits;
  fundsStatus: "none" | "held" | "released";
  releasedAt?: Date;
  idempotencyKey?: string;
  createdAt: Date;
  paidAt?: Date;
}

export type PayoutMethod = "bank_transfer" | "wire" | "cheque" | "other";
/** Money leaving the platform to the organizer or a party, recorded against their payable. */
export interface Payout {
  id: string;
  organizationId: string;
  /** Absent = the organizer itself. */
  partyId?: string;
  currency: Currency;
  amountMinor: MinorUnits;
  method: PayoutMethod;
  reference?: string;
  createdAt: Date;
}

export type InvoiceStatus = "issued" | "partially_paid" | "paid" | "void";
export type InvoicePaymentMethod = "bank_transfer" | "wire" | "ach" | "card" | "cheque" | "other";
export interface InvoicePayment {
  id: string;
  amountMinor: MinorUnits;
  method: InvoicePaymentMethod;
  reference?: string | undefined;
  receivedAt: Date;
}
/** A B2B invoice for one order. Cash is recognised in the ledger as it arrives. */
export interface Invoice {
  id: string;
  organizationId: string;
  orderId: string;
  corporateAccountId?: string;
  /** Human number, sequential per organization: INV-2026-0001. */
  number: string;
  poNumber?: string;
  currency: Currency;
  subtotalMinor: MinorUnits;
  taxMinor: MinorUnits;
  totalMinor: MinorUnits;
  paidMinor: MinorUnits;
  status: InvoiceStatus;
  issuedAt: Date;
  dueAt: Date;
  payments: InvoicePayment[];
  /** Card payment attempt in flight (provider ref), if any. */
  cardPaymentRef?: string;
  createdAt: Date;
}

export type RefundStatus = "pending" | "succeeded" | "failed";
export interface Refund {
  id: string;
  orderId: string;
  organizationId: string;
  amountMinor: MinorUnits;
  reason: string;
  status: RefundStatus;
  paymentRefundRef?: string;
  createdAt: Date;
}
