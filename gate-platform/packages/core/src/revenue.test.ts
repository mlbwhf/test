import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { codes } from "./accounts.js";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";

let core: Core;
let payments: FakePaymentsAdapter;
let ledger: Ledger;
let now: Date;

beforeEach(() => {
  now = new Date("2026-10-01T12:00:00Z");
  payments = new FakePaymentsAdapter();
  ledger = new Ledger({ store: new InMemoryLedgerStore() });
  core = new Core({ repos: createInMemoryRepos(), ledger, payments, clock: { now: () => now } });
});

async function setup(opts: { currencies?: string[] } = {}) {
  const { organization: org } = await core.createOrganization({ name: "Agile Agilist", country: "US", currency: "USD" });
  await core.connectPayments(org.id);
  if (opts.currencies) await core.updatePricing(org.id, { currencies: opts.currencies, fxFallback: true, rates: { EUR: 0.9 } });
  const course = await core.createCourse(org.id, { slug: "safe", name: "Leading SAFe" });
  const ev = await core.createEvent(org.id, { name: "Nov", courseId: course.id, sessions: [{ startsAt: new Date("2026-11-20T14:00:00Z"), endsAt: new Date("2026-11-20T22:00:00Z") }] });
  const tt = await core.createTicketType(org.id, ev.id, { name: "Seat", priceMinor: 100_000, quantity: 20 });
  return { org, course, ev, tt };
}

async function buy(orgId: string, ticketTypeId: string, extra: Record<string, unknown> = {}) {
  const { order } = await core.createOrder(orgId, { ticketTypeId, quantity: 1, buyerEmail: "a@b.co", ...extra });
  await core.handlePaymentEvent(payments.succeed(order.paymentRef!, order.pricing.totalMinor, order.currency));
  return core.getOrder(orgId, order.id);
}

describe("revenue features", () => {
  it("referral fee only on bookings from the class finder, and only while the organizer is listed", async () => {
    const { org, tt } = await setup();
    const direct = await buy(org.id, tt.id);
    expect(direct.pricing.referralFeeMinor).toBeUndefined();
    const fromFinder = await buy(org.id, tt.id, { source: "marketplace" });
    expect(fromFinder.pricing.referralFeeMinor).toBe(5_000);
    expect(fromFinder.pricing.totalMinor).toBe(100_000);
    expect((await core.publicCatalog())[0]!.listed).toBe(true);

    await core.updateOrganization(org.id, { marketplaceListing: false });
    expect((await core.publicCatalog())[0]!.listed).toBe(false);
    const after = await buy(org.id, tt.id, { source: "marketplace" });
    expect(after.pricing.referralFeeMinor).toBeUndefined();
    await ledger.assertBalanced();
  });

  it("currency conversion margin when the learner pays in a converted currency, not a listed one", async () => {
    const { org, ev, tt } = await setup({ currencies: ["EUR"] });
    const eur = await buy(org.id, tt.id, { currency: "EUR" });
    expect(eur.currency).toBe("EUR");
    expect(eur.pricing.fxFeeMinor).toBe(Math.round(eur.pricing.subtotalMinor * 0.015));
    expect(eur.pricing.attendeeFeeMinor).toBe(eur.pricing.fxFeeMinor);
    const listed = await core.createTicketType(org.id, ev.id, { name: "Listed", priceMinor: 100_000, prices: { EUR: 92_000 }, quantity: 5 });
    expect((await buy(org.id, listed.id, { currency: "EUR" })).pricing.fxFeeMinor).toBeUndefined();
    expect((await buy(org.id, tt.id)).pricing.fxFeeMinor).toBeUndefined();
  });

  it("flexible tickets: only when offered; full refund of the seat until 24h before, the upgrade itself is kept", async () => {
    const { org, ev, tt } = await setup();
    await expect(core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "a@b.co", flexible: true })).rejects.toMatchObject({ code: "VALIDATION" });
    await core.updateOrganization(org.id, { flexibleTickets: true });
    expect((await core.publicCourse(org.id, "safe")).organization.flexibleTickets).toBe(true);
    const flex = await buy(org.id, tt.id, { flexible: true });
    expect(flex.pricing).toMatchObject({ flexibleMinor: 8_000, flexibleFeeMinor: 2_000, totalMinor: 108_000 });
    const plain = await buy(org.id, tt.id);

    // 5 days before: the default policy refunds 0%, the flexible seat 100% of its price.
    now = new Date("2026-11-15T12:00:00Z");
    const [flexSeat] = await core.listSeats(org.id, { orderId: flex.id });
    const [plainSeat] = await core.listSeats(org.id, { orderId: plain.id });
    const fo = await core.seatOptions(flexSeat!.id, { organizationId: org.id });
    const po = await core.seatOptions(plainSeat!.id, { organizationId: org.id });
    expect(fo.policyTerms.cancel).toMatchObject({ allowed: true, refundBps: 10_000, refundMinor: 100_000 });
    expect(po.policyTerms.cancel.refundMinor).toBe(0);
    const { refund } = await core.cancelSeat(flexSeat!.id, "can't make it", { organizationId: org.id });
    expect(refund!.amountMinor).toBe(100_000);
    // Inside 24 hours the flexible promise ends.
    now = new Date("2026-11-19T20:00:00Z");
    const late = await buy(org.id, tt.id, { flexible: true });
    const [lateSeat] = await core.listSeats(org.id, { orderId: late.id });
    expect((await core.seatOptions(lateSeat!.id, { organizationId: org.id })).policyTerms.cancel.refundMinor).toBe(0);
    await ledger.assertBalanced();
    expect(ev.id).toBeTruthy();
  });

  it("early release: only after a first delivered class, fee comes out of the organizer's share", async () => {
    const { org, ev, tt } = await setup();
    await buy(org.id, tt.id);
    await buy(org.id, tt.id);
    let quote = await core.earlyReleaseQuote(org.id, ev.id);
    expect(quote).toMatchObject({ eligible: false, heldMinor: 2 * (100_000 - 4_980) });
    await expect(core.releaseEventEarly(org.id, ev.id)).rejects.toMatchObject({ code: "INVALID_STATE" });

    // A delivered and released class builds the track record.
    const past = await core.createEvent(org.id, { name: "Sep", sessions: [{ startsAt: new Date("2026-10-02T14:00:00Z"), endsAt: new Date("2026-10-02T22:00:00Z") }] });
    const pastTt = await core.createTicketType(org.id, past.id, { name: "Seat", priceMinor: 50_000, quantity: 5 });
    await buy(org.id, pastTt.id);
    now = new Date("2026-10-05T12:00:00Z");
    await core.releaseDelivered(now);

    quote = await core.earlyReleaseQuote(org.id, ev.id);
    expect(quote).toMatchObject({ eligible: true, heldMinor: 190_040, feeMinor: Math.round(190_040 * 0.02), netMinor: 190_040 - Math.round(190_040 * 0.02) });
    const r = await core.releaseEventEarly(org.id, ev.id);
    expect(r).toEqual({ released: 2, amountMinor: quote.netMinor, feeMinor: quote.feeMinor });
    const transfers = payments.calls.filter((c) => c.method === "createTransfer").map((c) => (c.input as { amountMinor: number }).amountMinor);
    expect(transfers.slice(-2).reduce((a, b) => a + b, 0)).toBe(quote.netMinor);
    const fees = (await core.platformBalances()).find((b) => b.code === codes.feeRevenue("USD"))!.balanceMinor;
    expect(fees).toBe(3 * 0 + 2 * 4_980 + (50_000 * 0.049 + 80) + quote.feeMinor);
    expect((await core.earlyReleaseQuote(org.id, ev.id)).eligible).toBe(false); // nothing left to release
    await ledger.assertBalanced();
  });
});
