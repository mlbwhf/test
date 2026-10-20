import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { codes } from "./accounts.js";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core, activePayments } from "./services.js";
import { homeSummary } from "./home.js";

let core: Core;
let payments: FakePaymentsAdapter;
let ledger: Ledger;
let now: Date;

beforeEach(() => {
  now = new Date("2026-10-15T12:00:00Z");
  payments = new FakePaymentsAdapter();
  ledger = new Ledger({ store: new InMemoryLedgerStore() });
  core = new Core({ repos: createInMemoryRepos(), ledger, payments, clock: { now: () => now } });
});

async function setup() {
  const { organization: org } = await core.createOrganization({ name: "Agile Agilist", country: "US", currency: "USD" });
  const instructor = await core.createParty(org.id, { name: "Jane Trainer", kind: "instructor", paymentsAccountRef: "acct_jane" });
  const ev = await core.createEvent(org.id, { name: "Leading SAFe Nov", sessions: [{ startsAt: new Date("2026-11-20T14:00:00Z"), endsAt: new Date("2026-11-21T22:00:00Z") }] });
  await core.setInstructorFees(org.id, ev.id, [{ partyId: instructor.id, amountMinor: 50_000 }]);
  const tt = await core.createTicketType(org.id, ev.id, { name: "Std", priceMinor: 129_500, quantity: 20 });
  return { org, ev, tt };
}

const fee = 1_943 + 50; // 1.5% of $1,295 + $0.50

describe("Direct payment mode", () => {
  it("won't take a card payment until the organizer's own Stripe account can charge", async () => {
    const { org, tt } = await setup();
    await core.setPaymentMode(org.id, "direct");
    await expect(core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "a@b.co" })).rejects.toMatchObject({ code: "INVALID_STATE" });
    // The price preview still works, at the Direct rate.
    const dry = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "a@b.co", dryRun: true });
    expect(dry.order.pricing.platformFeeMinor).toBe(fee);

    payments.requireOnboarding = true;
    const started = await core.connectPayments(org.id);
    expect(started.directAccountRef).toBe(`acct_fake_direct_${org.id}`);
    expect(started.paymentsAccountRef).toBeUndefined();
    expect(started.onboardingUrl).toBeTruthy();
    expect(payments.calls.find((c) => c.method === "createConnectedAccount")!.input).toMatchObject({ mode: "direct" });

    // Stripe's account.updated for the direct account lands on directStatus.
    payments.completeOnboarding(started.directAccountRef!);
    await core.handlePaymentEvent({ type: "account.updated", accountRef: started.directAccountRef!, status: await payments.getAccountStatus(started.directAccountRef!), providerEventId: "evt_1" });
    const ready = await core.getOrganization(org.id);
    expect(activePayments(ready)).toMatchObject({ mode: "direct", accountRef: started.directAccountRef, status: { ready: true } });
    expect((await homeSummary(core, org.id, { money: true, settings: true, now })).attention.some((a) => a.kind === "payments_setup")).toBe(false);
  });

  it("charges on the organizer's account, keeps only the application fee, holds nothing and transfers nothing", async () => {
    const { org, ev, tt } = await setup();
    await core.setPaymentMode(org.id, "direct");
    await core.connectPayments(org.id);

    const { order, clientSecret } = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 2, buyerEmail: "a@b.co" });
    expect(clientSecret).toBeTruthy();
    expect(order).toMatchObject({ settlement: "direct", chargeAccountRef: `acct_fake_direct_${org.id}` });
    expect(order.pricing).toMatchObject({ totalMinor: 259_000, platformFeeMinor: 2 * fee });
    expect(payments.calls.find((c) => c.method === "createPayment")!.input).toMatchObject({ direct: { accountRef: `acct_fake_direct_${org.id}`, applicationFeeMinor: 2 * fee } });

    await core.handlePaymentEvent(payments.succeed(order.paymentRef!, 259_000, "USD"));
    const paid = await core.getOrder(org.id, order.id);
    expect(paid).toMatchObject({ status: "paid", fundsStatus: "released", heldMinor: 0, transferRefs: {} });
    expect((await core.listSeats(org.id, { orderId: order.id })).every((s) => s.status === "confirmed")).toBe(true);

    // Only the fee is on the platform's books; the organizer's money never was.
    const platform = await core.platformBalances();
    expect(platform.find((b) => b.code === codes.feeRevenue("USD"))?.balanceMinor).toBe(2 * fee);
    expect(platform.find((b) => b.code === codes.clearing("USD"))?.balanceMinor).toBe(2 * fee);
    expect((await core.balancesFor(org.id)).every((b) => b.balanceMinor === 0)).toBe(true);
    await ledger.assertBalanced();

    // Delivery: nothing to release, and the platform doesn't pay instructors out of money it never held.
    now = new Date("2026-11-25T00:00:00Z");
    expect(await core.releaseEvent(org.id, ev.id)).toEqual({ released: 0, amountMinor: 0 });
    expect(payments.calls.filter((c) => c.method === "createTransfer")).toHaveLength(0);
    expect((await core.balancesFor(org.id)).every((b) => b.balanceMinor === 0)).toBe(true);
  });

  it("refunds from the organizer's account and returns the fee pro rata", async () => {
    const { org, tt } = await setup();
    await core.setPaymentMode(org.id, "direct");
    await core.connectPayments(org.id);
    const { order } = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 2, buyerEmail: "a@b.co" });
    await core.handlePaymentEvent(payments.succeed(order.paymentRef!, 259_000, "USD"));

    await core.refundOrder(org.id, { orderId: order.id, amountMinor: 129_500, reason: "one dropped" });
    expect(payments.calls.find((c) => c.method === "refund")!.input).toMatchObject({ accountRef: `acct_fake_direct_${org.id}`, amountMinor: 129_500 });
    const fees = (await core.platformBalances()).find((b) => b.code === codes.feeRevenue("USD"))!.balanceMinor;
    expect(fees).toBe(fee);
    await ledger.assertBalanced();

    await core.refundOrder(org.id, { orderId: order.id, reason: "class moved" });
    expect((await core.getOrder(org.id, order.id)).status).toBe("refunded");
    expect((await core.platformBalances()).find((b) => b.code === codes.feeRevenue("USD"))!.balanceMinor).toBe(0);
    await ledger.assertBalanced();
  });

  it("switching modes only changes new payments", async () => {
    const { org, tt } = await setup();
    await core.connectPayments(org.id); // Protected account
    const held = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "p@b.co" });
    await core.handlePaymentEvent(payments.succeed(held.order.paymentRef!, 129_500, "USD"));
    expect((await core.getOrder(org.id, held.order.id)).fundsStatus).toBe("held");

    await core.setPaymentMode(org.id, "direct");
    const switched = await core.getOrganization(org.id);
    expect(activePayments(switched)).toMatchObject({ mode: "direct", accountRef: undefined });
    expect(switched.paymentsAccountRef).toBe(`acct_fake_${org.id}`);
    await core.connectPayments(org.id);
    const direct = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "d@b.co" });
    expect(direct.order.settlement).toBe("direct");

    await core.setPaymentMode(org.id, "protected");
    const back = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "b@b.co" });
    expect(back.order.settlement).toBeUndefined();
    expect(back.order.pricing.platformFeeMinor).toBe(6_346 + 80);
    await expect(core.setPaymentMode(org.id, "elsewhere" as never)).rejects.toMatchObject({ code: "VALIDATION" });

    // The held Protected order still releases to the Protected account.
    await core.setPaymentMode(org.id, "direct");
    now = new Date("2026-11-25T00:00:00Z");
    const r = await core.releaseEvent(org.id, held.order.eventId);
    expect(r.released).toBe(1);
    const transfer = payments.calls.find((c) => c.method === "createTransfer")!.input as { destinationAccountRef: string };
    expect(transfer.destinationAccountRef).toBe(`acct_fake_${org.id}`);
  });

  it("free classes need no Stripe account in Direct mode either", async () => {
    const { org, ev } = await setup();
    await core.setPaymentMode(org.id, "direct");
    const free = await core.createTicketType(org.id, ev.id, { name: "Free", priceMinor: 0, quantity: 5 });
    const { order } = await core.createOrder(org.id, { ticketTypeId: free.id, quantity: 1, buyerEmail: "f@b.co" });
    expect(order.status).toBe("paid");
    expect(order.settlement).toBeUndefined();
  });
});
