import { assertCurrency, assertMinorUnits, bps, type Currency, type MinorUnits } from "@gate/ledger";
import { scheduleFor, type Channel, type FeeComponent, type FeeSchedule, type PaymentMode, type PayoutDestination } from "./schedule.js";

export interface PricingInput {
  currency: Currency;
  unitPriceMinor: MinorUnits;
  quantity: number;
  destination: PayoutDestination;
  channel?: Channel;
  /** Direct: the organizer's own Stripe takes the payment and EnrollClass takes the direct fee. */
  mode?: PaymentMode;
  /** When true the fee is added on top and paid by the attendee. */
  passFeeToAttendee?: boolean;
  /** Tax already calculated by a tax engine, in minor units. Wins over taxRateBps. */
  taxMinor?: MinorUnits | undefined;
  /** Flat tax rate to apply to subtotal + attendee fee (e.g. 1300 for 13% HST). */
  taxRateBps?: number | undefined;
  schedules?: Partial<Record<string, FeeSchedule>>;
}

export interface Pricing {
  currency: Currency;
  quantity: number;
  unitPriceMinor: MinorUnits;
  /** Ticket face value x quantity. */
  subtotalMinor: MinorUnits;
  /** Platform fee for the whole order. */
  platformFeeMinor: MinorUnits;
  /** Portion of the platform fee charged to the attendee (0 or == platformFeeMinor). */
  attendeeFeeMinor: MinorUnits;
  /** Sales tax / VAT / GST collected on behalf of the organizer (0 when not calculated). */
  taxMinor: MinorUnits;
  /** What the buyer pays: subtotal + attendee fee + tax. */
  totalMinor: MinorUnits;
  /** What the organizer side (organizer + venue + vendors) receives before splits. */
  organizerNetMinor: MinorUnits;
  perTicketFeeMinor: MinorUnits;
}

export function feePerTicket(unitPriceMinor: MinorUnits, component: FeeComponent): MinorUnits {
  if (unitPriceMinor <= 0) return 0;
  let fee = bps(unitPriceMinor, component.bps) + component.fixedMinor;
  if (component.capMinor !== undefined) fee = Math.min(fee, component.capMinor);
  return fee;
}

export function priceOrder(input: PricingInput): Pricing {
  assertCurrency(input.currency);
  assertMinorUnits(input.unitPriceMinor, "unitPriceMinor");
  if (input.unitPriceMinor < 0) throw new Error("unitPriceMinor must be >= 0");
  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) throw new Error("quantity must be a positive integer");

  const schedule = scheduleFor(input.currency, input.schedules);
  const channel = input.channel ?? "online";
  const component = channel === "pos" ? schedule.pos : input.mode === "direct" ? schedule.direct : schedule.online[input.destination];
  const free = input.unitPriceMinor <= schedule.freeTicketThresholdMinor;
  let perTicketFee = free ? 0 : feePerTicket(input.unitPriceMinor, component);
  // An absorbed fee can never exceed the ticket itself; the organizer net is floored at zero.
  if (!input.passFeeToAttendee) perTicketFee = Math.min(perTicketFee, input.unitPriceMinor);

  const subtotal = input.unitPriceMinor * input.quantity;
  const platformFee = perTicketFee * input.quantity;
  const attendeeFee = input.passFeeToAttendee ? platformFee : 0;
  const taxable = subtotal + attendeeFee;
  const tax = input.taxMinor ?? (input.taxRateBps !== undefined ? bps(taxable, input.taxRateBps) : 0);
  assertMinorUnits(tax, "taxMinor");
  if (tax < 0) throw new Error("taxMinor must be >= 0");
  const total = taxable + tax;
  const organizerNet = taxable - platformFee;

  return {
    currency: input.currency,
    quantity: input.quantity,
    unitPriceMinor: input.unitPriceMinor,
    subtotalMinor: subtotal,
    platformFeeMinor: platformFee,
    attendeeFeeMinor: attendeeFee,
    taxMinor: tax,
    totalMinor: total,
    organizerNetMinor: organizerNet,
    perTicketFeeMinor: perTicketFee,
  };
}

export function instantPayoutFee(amountMinor: MinorUnits, currency: Currency, schedules?: Partial<Record<string, FeeSchedule>>): MinorUnits {
  assertMinorUnits(amountMinor);
  const s = scheduleFor(currency, schedules).instantPayout;
  return Math.max(bps(amountMinor, s.bps), s.minMinor);
}
