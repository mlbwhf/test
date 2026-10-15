import type { Currency, MinorUnits } from "@gate/ledger";
import type { PayoutDestination, Pricing, SplitResult, SplitRule } from "@gate/pricing";

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
  apiKeyHash: string;
  createdAt: Date;
}

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
  createdAt: Date;
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
}

export type OrderStatus = "pending" | "paid" | "refunded" | "partially_refunded" | "failed";
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
  pricing: Pricing;
  splits: SplitResult;
  paymentRef?: string;
  transferRefs: Record<string, string>;
  refundedMinor: MinorUnits;
  idempotencyKey?: string;
  createdAt: Date;
  paidAt?: Date;
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
