import type { Currency, MinorUnits } from "@gate/ledger";

/** Where the organizer's money lands. Fees drop when it stays on-platform. */
export type PayoutDestination = "gate_account" | "external_bank";
export type Channel = "online" | "pos";
/**
 * Who takes the card payment. Protected: EnrollClass charges the learner, pays the card
 * processor and holds the money until delivery. Direct: the organizer's own Stripe account
 * charges the learner and pays the processor; EnrollClass takes an application fee.
 */
export type PaymentMode = "protected" | "direct";

export interface FeeComponent {
  /** Percentage in basis points (250 = 2.50%). */
  bps: number;
  /** Fixed amount in minor units per ticket. */
  fixedMinor: MinorUnits;
  /** Optional per-ticket cap in minor units. */
  capMinor?: MinorUnits;
}

export interface FeeSchedule {
  currency: Currency;
  online: Record<PayoutDestination, FeeComponent>;
  /** Application fee in Direct mode; the organizer pays the card processor on top. */
  direct: FeeComponent;
  /** Added per paid seat when the course issues an EnrollClass verified badge (Open Badges 3.0). */
  verifiedBadgeMinor: MinorUnits;
  /** Paid by the learner when the price is converted into their currency (not a listed price). */
  fxMarginBps: number;
  /** Referral fee on bookings that came through EnrollClass's class finder; the organizer pays it. */
  marketplaceBps: number;
  /** Releasing held Protected funds before the class is delivered. */
  earlyRelease: { bps: number; minMinor: MinorUnits };
  /** Flexible ticket: learner add-on (bps of the ticket price) and EnrollClass's share of it (bps of the add-on). */
  flexible: { bps: number; platformShareBps: number };
  pos: FeeComponent;
  instantPayout: { bps: number; minMinor: MinorUnits };
  /** Tickets priced at or below this are free of platform fees. */
  freeTicketThresholdMinor: MinorUnits;
}

/**
 * Protected (gate_account) is all-in: EnrollClass pays the card processor out of it, so it
 * must stay above processing cost (about 2.9% + 30c on US cards) with room for disputes.
 * Direct is EnrollClass's share only; the organizer's Stripe account pays processing.
 * Launch schedule from the blueprint (section 1). Stored per currency so
 * EU/UAE schedules can differ. Minor units: USD cents, EUR cents, AED fils.
 */
export const DEFAULT_SCHEDULES: Record<string, FeeSchedule> = {
  USD: {
    currency: "USD",
    online: {
      gate_account: { bps: 490, fixedMinor: 80 },
      external_bank: { bps: 290, fixedMinor: 30 + 75 },
    },
    direct: { bps: 150, fixedMinor: 50 },
    verifiedBadgeMinor: 100,
    pos: { bps: 240, fixedMinor: 10 },
    instantPayout: { bps: 100, minMinor: 50 },
    fxMarginBps: 150,
    marketplaceBps: 500,
    earlyRelease: { bps: 200, minMinor: 50 },
    flexible: { bps: 800, platformShareBps: 2_500 },
    freeTicketThresholdMinor: 0,
  },
  EUR: {
    currency: "EUR",
    online: {
      gate_account: { bps: 390, fixedMinor: 60 },
      external_bank: { bps: 240, fixedMinor: 25 + 65 },
    },
    direct: { bps: 150, fixedMinor: 40 },
    verifiedBadgeMinor: 100,
    pos: { bps: 190, fixedMinor: 10 },
    instantPayout: { bps: 50, minMinor: 40 },
    fxMarginBps: 150,
    marketplaceBps: 500,
    earlyRelease: { bps: 200, minMinor: 40 },
    flexible: { bps: 800, platformShareBps: 2_500 },
    freeTicketThresholdMinor: 0,
  },
  AED: {
    currency: "AED",
    online: {
      gate_account: { bps: 490, fixedMinor: 250 },
      external_bank: { bps: 290, fixedMinor: 100 + 250 },
    },
    direct: { bps: 150, fixedMinor: 150 },
    verifiedBadgeMinor: 400,
    pos: { bps: 240, fixedMinor: 50 },
    instantPayout: { bps: 100, minMinor: 200 },
    fxMarginBps: 150,
    marketplaceBps: 500,
    earlyRelease: { bps: 200, minMinor: 200 },
    flexible: { bps: 800, platformShareBps: 2_500 },
    freeTicketThresholdMinor: 0,
  },
  CAD: {
    currency: "CAD",
    online: {
      gate_account: { bps: 490, fixedMinor: 90 },
      external_bank: { bps: 290, fixedMinor: 30 + 95 },
    },
    direct: { bps: 150, fixedMinor: 60 },
    verifiedBadgeMinor: 130,
    pos: { bps: 240, fixedMinor: 10 },
    instantPayout: { bps: 100, minMinor: 60 },
    fxMarginBps: 150,
    marketplaceBps: 500,
    earlyRelease: { bps: 200, minMinor: 60 },
    flexible: { bps: 800, platformShareBps: 2_500 },
    freeTicketThresholdMinor: 0,
  },
  GBP: {
    currency: "GBP",
    online: {
      gate_account: { bps: 390, fixedMinor: 50 },
      external_bank: { bps: 240, fixedMinor: 20 + 60 },
    },
    direct: { bps: 150, fixedMinor: 40 },
    verifiedBadgeMinor: 100,
    pos: { bps: 190, fixedMinor: 10 },
    instantPayout: { bps: 100, minMinor: 40 },
    fxMarginBps: 150,
    marketplaceBps: 500,
    earlyRelease: { bps: 200, minMinor: 40 },
    flexible: { bps: 800, platformShareBps: 2_500 },
    freeTicketThresholdMinor: 0,
  },
  ZAR: {
    currency: "ZAR",
    online: {
      gate_account: { bps: 490, fixedMinor: 1_400 },
      external_bank: { bps: 290, fixedMinor: 500 + 1_300 },
    },
    direct: { bps: 150, fixedMinor: 900 },
    verifiedBadgeMinor: 1_800,
    pos: { bps: 240, fixedMinor: 200 },
    instantPayout: { bps: 100, minMinor: 900 },
    fxMarginBps: 150,
    marketplaceBps: 500,
    earlyRelease: { bps: 200, minMinor: 900 },
    flexible: { bps: 800, platformShareBps: 2_500 },
    freeTicketThresholdMinor: 0,
  },
  SAR: {
    currency: "SAR",
    online: {
      gate_account: { bps: 490, fixedMinor: 300 },
      external_bank: { bps: 290, fixedMinor: 100 + 280 },
    },
    direct: { bps: 150, fixedMinor: 200 },
    verifiedBadgeMinor: 400,
    pos: { bps: 240, fixedMinor: 50 },
    instantPayout: { bps: 100, minMinor: 200 },
    fxMarginBps: 150,
    marketplaceBps: 500,
    earlyRelease: { bps: 200, minMinor: 200 },
    flexible: { bps: 800, platformShareBps: 2_500 },
    freeTicketThresholdMinor: 0,
  },
  INR: {
    currency: "INR",
    online: {
      gate_account: { bps: 490, fixedMinor: 6_000 },
      external_bank: { bps: 290, fixedMinor: 2_500 + 6_000 },
    },
    direct: { bps: 150, fixedMinor: 4_000 },
    verifiedBadgeMinor: 8_000,
    pos: { bps: 240, fixedMinor: 1_000 },
    instantPayout: { bps: 100, minMinor: 4_000 },
    fxMarginBps: 150,
    marketplaceBps: 500,
    earlyRelease: { bps: 200, minMinor: 4_000 },
    flexible: { bps: 800, platformShareBps: 2_500 },
    freeTicketThresholdMinor: 0,
  },
};

export const SUPPORTED_CURRENCIES = Object.keys(DEFAULT_SCHEDULES);

export function scheduleFor(currency: Currency, overrides?: Partial<Record<string, FeeSchedule>>): FeeSchedule {
  const s = overrides?.[currency] ?? DEFAULT_SCHEDULES[currency];
  if (!s) throw new Error(`no fee schedule for currency ${currency}`);
  return s;
}
