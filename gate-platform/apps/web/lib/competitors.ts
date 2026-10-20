// Published US pricing of other registration platforms, for the comparison on the pricing
// section. Checked 2026-10-20 on each provider's own pricing and help pages (linked). Prices
// change: re-check before relying on them, and update CHECKED_ON when you do.

export const CHECKED_ON = "October 20, 2026";
/** The seat price the comparison uses: a typical certification class. */
export const EXAMPLE_SEAT_MINOR = 129_500;
/** US card processing on the organizer's own Stripe account. */
export const STRIPE_US = { bps: 290, fixedMinor: 30 };

export type Competitor = {
  name: string;
  /** Platform fee per paid seat, as published. */
  fee: string;
  /** Card processing: included, or who charges it. */
  processing: string;
  /** Total fees on one $1,295 seat, organizer absorbs (platform + processing), as display text. */
  total: string;
  monthly: string;
  /** Who takes the learner's money, and when the organizer gets it. */
  money: string;
  source: string;
};

export const COMPETITORS: Competitor[] = [
  {
    name: "Eventbrite",
    fee: "3.7% + $1.79",
    processing: "2.9% of the order",
    total: "$87.26",
    monthly: "Optional paid plans",
    money: "Eventbrite collects; paid out after the event",
    source: "https://www.eventbrite.com/organizer/pricing/",
  },
  {
    name: "Humanitix",
    fee: "5% + $1.29",
    processing: "Included",
    total: "$66.04",
    monthly: "None",
    money: "Humanitix collects; paid out after the event",
    source: "https://help.humanitix.com/en/articles/12292391-what-are-the-humanitix-booking-fees",
  },
  {
    name: "Luma (free plan)",
    fee: "5%",
    processing: "Your Stripe: 2.9% + $0.30",
    total: "$102.61",
    monthly: "None (Plus: $59/mo for 0%)",
    money: "Your Stripe account",
    source: "https://help.luma.com/p/luma-plus",
  },
  {
    name: "Corsizio",
    fee: "$1 + $0.15 per registration",
    processing: "Your Stripe: 2.9% + $0.30",
    total: "$39.01",
    monthly: "None",
    money: "Your Stripe account",
    source: "https://www.corsizio.com/pricing",
  },
  {
    name: "Ticket Tailor",
    fee: "About $0.85",
    processing: "Your Stripe: 2.9% + $0.30",
    total: "About $38.71",
    monthly: "None",
    money: "Your Stripe, PayPal or Square",
    source: "https://www.tickettailor.com/en-us/pricing",
  },
  {
    name: "Arlo",
    fee: "$1.80 to $2.15 per registration",
    processing: "Your payment gateway",
    total: "About $40 + licence",
    monthly: "From about $118/mo per admin",
    money: "Your payment gateway",
    source: "https://www.arlo.co/pricing",
  },
];
