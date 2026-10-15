import { z } from "zod";
import type { Event, Order, Organization, Party, Refund, TicketType } from "@gate/core";

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
export const PartySchema = z.object({ id: z.string(), organizationId: z.string(), name: z.string(), kind: z.enum(["venue", "vendor", "promoter", "tax_reserve"]), paymentsAccountRef: z.string().nullable(), createdAt: z.string() });
export const CreatePartyBody = z.object({ name: z.string().min(1), kind: z.enum(["venue", "vendor", "promoter", "tax_reserve"]), paymentsAccountRef: z.string().optional() });

export const EventSchema = z.object({ id: z.string(), organizationId: z.string(), name: z.string(), startsAt: z.string(), currency: Currency, status: z.enum(["draft", "live", "ended"]), splitRules: z.array(SplitRuleSchema).nullable(), createdAt: z.string() });
export const CreateEventBody = z.object({ name: z.string().min(1), startsAt: z.string().datetime({ offset: true }), currency: Currency.optional(), splitRules: z.array(SplitRuleSchema).optional() });

export const TicketTypeSchema = z.object({ id: z.string(), eventId: z.string(), organizationId: z.string(), name: z.string(), priceMinor: Minor, quantity: z.number().int(), sold: z.number().int() });
export const CreateTicketTypeBody = z.object({ name: z.string().min(1), priceMinor: Minor, quantity: z.number().int().min(1) });

export const PricingSchema = z.object({
  currency: Currency, quantity: z.number().int(), unitPriceMinor: Minor, subtotalMinor: Minor, platformFeeMinor: Minor,
  attendeeFeeMinor: Minor, totalMinor: Minor, organizerNetMinor: Minor, perTicketFeeMinor: Minor,
});
export const OrderSchema = z.object({
  id: z.string(), organizationId: z.string(), eventId: z.string(), ticketTypeId: z.string(), quantity: z.number().int(), buyerEmail: z.string(),
  currency: Currency, status: z.enum(["pending", "paid", "refunded", "partially_refunded", "failed"]), pricing: PricingSchema,
  splits: z.object({ organizerMinor: Minor, lines: z.array(z.object({ partyId: z.string(), amountMinor: Minor, label: z.string().optional() })) }),
  paymentRef: z.string().nullable(), transferRefs: z.record(z.string(), z.string()), refundedMinor: Minor, createdAt: z.string(), paidAt: z.string().nullable(),
});
export const CreateOrderBody = z.object({ ticketTypeId: z.string(), quantity: z.number().int().min(1).max(100), buyerEmail: z.string().email(), dryRun: z.boolean().optional() });
export const RefundSchema = z.object({ id: z.string(), orderId: z.string(), organizationId: z.string(), amountMinor: Minor, reason: z.string(), status: z.enum(["pending", "succeeded", "failed"]), paymentRefundRef: z.string().nullable(), createdAt: z.string() });
export const CreateRefundBody = z.object({ orderId: z.string(), amountMinor: z.number().int().min(1).optional(), reason: z.string().min(1) });
export const BalanceSchema = z.object({ code: z.string(), name: z.string(), type: z.string(), currency: Currency, balanceMinor: z.number().int() });

export const toOrganization = (o: Organization) => ({ ...o, paymentsAccountRef: o.paymentsAccountRef ?? null, createdAt: o.createdAt.toISOString() });
export const toParty = (p: Party) => ({ ...p, paymentsAccountRef: p.paymentsAccountRef ?? null, createdAt: p.createdAt.toISOString() });
export const toEvent = (e: Event) => ({ ...e, splitRules: e.splitRules ?? null, startsAt: e.startsAt.toISOString(), createdAt: e.createdAt.toISOString() });
export const toTicketType = (t: TicketType) => t;
export const toOrder = (o: Order) => ({ ...o, paymentRef: o.paymentRef ?? null, createdAt: o.createdAt.toISOString(), paidAt: o.paidAt?.toISOString() ?? null });
export const toRefund = (r: Refund) => ({ ...r, paymentRefundRef: r.paymentRefundRef ?? null, createdAt: r.createdAt.toISOString() });
