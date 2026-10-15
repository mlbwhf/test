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

export type PartyKind = "venue" | "vendor" | "promoter" | "tax_reserve";
export interface Party {
  id: string;
  organizationId: string;
  name: string;
  kind: PartyKind;
  paymentsAccountRef?: string;
  createdAt: Date;
}

export type EventStatus = "draft" | "live" | "ended";
export interface Event {
  id: string;
  organizationId: string;
  name: string;
  startsAt: Date;
  currency: Currency;
  status: EventStatus;
  splitRules?: SplitRule[];
  createdAt: Date;
}

export interface TicketType {
  id: string;
  eventId: string;
  organizationId: string;
  name: string;
  priceMinor: MinorUnits;
  quantity: number;
  sold: number;
}

export type OrderStatus = "pending" | "paid" | "refunded" | "partially_refunded" | "failed";
export interface Order {
  id: string;
  organizationId: string;
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  buyerEmail: string;
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
