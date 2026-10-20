import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { codes } from "./accounts.js";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";

let core: Core;
let payments: FakePaymentsAdapter;
let ledger: Ledger;

async function setup(opts: { passFee?: boolean; venueBps?: number } = {}) {
  payments = new FakePaymentsAdapter();
  ledger = new Ledger({ store: new InMemoryLedgerStore() });
  core = new Core({ repos: createInMemoryRepos(), ledger, payments });
  const { organization, apiKey } = await core.createOrganization({ releasePolicy: "immediate",
    name: "Agile Agilist", country: "US", currency: "USD", passFeeToAttendee: opts.passFee ?? false,
  });
  await core.connectPayments(organization.id);
  let venueId: string | undefined;
  if (opts.venueBps) {
    const venue = await core.createParty(organization.id, { name: "Venue", kind: "venue", paymentsAccountRef: "acct_venue" });
    venueId = venue.id;
  }
  const event = await core.createEvent(organization.id, {
    name: "Leading SAFe", startsAt: new Date("2026-11-01T09:00:00Z"),
    ...(venueId ? { splitRules: [{ partyId: venueId, kind: "percent" as const, bps: opts.venueBps! }] } : {}),
  });
  const ticket = await core.createTicketType(organization.id, event.id, { name: "Standard", priceMinor: 100_000, quantity: 10 });
  return { org: organization, apiKey, event, ticket, venueId };
}

beforeEach(async () => { await setup(); });

describe("checkout -> payment -> ledger", () => {
  it("prices, reserves, creates a payment and settles to the ledger on success", async () => {
    const { org, ticket } = await setup();
    const { order, clientSecret, created } = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 2, buyerEmail: "a@b.co" });
    expect(created).toBe(true);
    expect(clientSecret).toMatch(/_secret_/);
    expect(order.status).toBe("pending");
    expect(order.pricing.perTicketFeeMinor).toBe(500); // capped
    expect(order.pricing.totalMinor).toBe(200_000);
    expect(order.pricing.organizerNetMinor).toBe(199_000);
    expect((await core.listTicketTypes(org.id, ticket.eventId))[0]?.sold).toBe(2);

    const result = await core.handlePaymentEvent(payments.succeed(order.paymentRef!, 200_000, "USD"));
    expect(result.handled).toBe(true);

    const paid = await core.getOrder(org.id, order.id);
    expect(paid.status).toBe("paid");
    expect(paid.transferRefs[org.id]).toBe(`tr_fake_transfer:${order.id}:${org.id}`);

    const bal = await core.balancesFor(org.id);
    expect(bal.find((b) => b.code === codes.orgPayable(org.id, "USD"))?.balanceMinor).toBe(199_000);
    const platform = await core.platformBalances();
    expect(platform.find((b) => b.code === codes.feeRevenue("USD"))?.balanceMinor).toBe(1_000);
    expect(platform.find((b) => b.code === codes.clearing("USD"))?.balanceMinor).toBe(200_000);
    await ledger.assertBalanced();
  });

  it("is idempotent on provider event id and rejects amount mismatch", async () => {
    const { org, ticket } = await setup();
    const { order } = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "a@b.co" });
    const evt = payments.succeed(order.paymentRef!, 100_000, "USD");
    expect((await core.handlePaymentEvent(evt)).handled).toBe(true);
    expect((await core.handlePaymentEvent(evt)).reason).toBe("duplicate");
    const { order: o2 } = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "a@b.co" });
    await expect(core.handlePaymentEvent(payments.succeed(o2.paymentRef!, 1, "USD"))).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("releases inventory on failure and enforces sold out", async () => {
    const { org, ticket } = await setup();
    const { order } = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 10, buyerEmail: "a@b.co" });
    await expect(core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "a@b.co" })).rejects.toMatchObject({ code: "SOLD_OUT" });
    await core.handlePaymentEvent(payments.fail(order.paymentRef!));
    expect((await core.getOrder(org.id, order.id)).status).toBe("failed");
    const again = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "a@b.co" });
    expect(again.order.status).toBe("pending");
  });

  it("idempotency key returns the same order; dry run reserves nothing", async () => {
    const { org, ticket } = await setup();
    const a = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "a@b.co", idempotencyKey: "k1" });
    const b = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "a@b.co", idempotencyKey: "k1" });
    expect(b.created).toBe(false);
    expect(b.order.id).toBe(a.order.id);
    const dry = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 3, buyerEmail: "a@b.co", dryRun: true });
    expect(dry.order.pricing.totalMinor).toBe(300_000);
    expect((await core.listTicketTypes(org.id, ticket.eventId))[0]?.sold).toBe(1);
    expect(payments.calls.filter((c) => c.method === "createPayment")).toHaveLength(1);
  });

  it("splits to a venue and transfers to its connected account", async () => {
    const { org, ticket, venueId } = await setup({ venueBps: 2_000 });
    const { order } = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "a@b.co" });
    expect(order.splits.lines).toEqual([{ partyId: venueId, amountMinor: 19_900 }]);
    expect(order.splits.organizerMinor).toBe(79_600);
    await core.handlePaymentEvent(payments.succeed(order.paymentRef!, 100_000, "USD"));
    const paid = await core.getOrder(org.id, order.id);
    expect(Object.keys(paid.transferRefs).sort()).toEqual([org.id, venueId].sort());
    const bal = await core.balancesFor(org.id);
    expect(bal.find((b) => b.code === codes.partyPayable(venueId!, "USD"))?.balanceMinor).toBe(19_900);
    await ledger.assertBalanced();
  });

  it("pass-fee-to-attendee charges the buyer the fee", async () => {
    const { org, ticket } = await setup({ passFee: true });
    const { order } = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "a@b.co" });
    expect(order.pricing.totalMinor).toBe(100_500);
    expect(order.pricing.organizerNetMinor).toBe(100_000);
  });

  it("free orders settle immediately with no payment", async () => {
    const { org, event } = await setup();
    const free = await core.createTicketType(org.id, event.id, { name: "Free", priceMinor: 0, quantity: 5 });
    const { order, clientSecret } = await core.createOrder(org.id, { ticketTypeId: free.id, quantity: 2, buyerEmail: "a@b.co" });
    expect(clientSecret).toBeNull();
    expect(order.status).toBe("paid");
    expect(payments.calls.filter((c) => c.method === "createPayment")).toHaveLength(0);
  });
});

describe("refunds", () => {
  it("partial refund reverses pro rata and keeps the ledger balanced", async () => {
    const { org, ticket, venueId } = await setup({ venueBps: 2_000 });
    const { order } = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "a@b.co" });
    await core.handlePaymentEvent(payments.succeed(order.paymentRef!, 100_000, "USD"));

    const refund = await core.refundOrder(org.id, { orderId: order.id, amountMinor: 50_000, reason: "customer request" });
    expect(refund.status).toBe("succeeded");
    const after = await core.getOrder(org.id, order.id);
    expect(after.status).toBe("partially_refunded");
    expect(after.refundedMinor).toBe(50_000);

    const bal = await core.balancesFor(org.id);
    const orgBal = bal.find((b) => b.code === codes.orgPayable(org.id, "USD"))!.balanceMinor;
    const venueBal = bal.find((b) => b.code === codes.partyPayable(venueId!, "USD"))!.balanceMinor;
    const fees = (await core.platformBalances()).find((b) => b.code === codes.feeRevenue("USD"))!.balanceMinor;
    expect(orgBal + venueBal + fees).toBe(50_000);
    expect(orgBal).toBe(39_800);
    expect(venueBal).toBe(9_950);
    expect(fees).toBe(250);
    await ledger.assertBalanced();

    const rest = await core.refundOrder(org.id, { orderId: order.id, reason: "cancelled" });
    expect(rest.amountMinor).toBe(50_000);
    expect((await core.getOrder(org.id, order.id)).status).toBe("refunded");
    expect((await core.platformBalances()).find((b) => b.code === codes.clearing("USD"))!.balanceMinor).toBe(0);
    await ledger.assertBalanced();
  });

  it("rejects over-refund and refunds on unpaid orders", async () => {
    const { org, ticket } = await setup();
    const { order } = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "a@b.co" });
    await expect(core.refundOrder(org.id, { orderId: order.id, reason: "x" })).rejects.toMatchObject({ code: "INVALID_STATE" });
    await core.handlePaymentEvent(payments.succeed(order.paymentRef!, 100_000, "USD"));
    await expect(core.refundOrder(org.id, { orderId: order.id, amountMinor: 100_001, reason: "x" })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("auth", () => {
  it("authenticates by api key hash only", async () => {
    const { org, apiKey } = await setup();
    expect((await core.authenticate(apiKey)).id).toBe(org.id);
    await expect(core.authenticate("nope")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(core.authenticate(undefined)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("api key rotation", () => {
  it("invalidates the old key and accepts the new one", async () => {
    const { org, apiKey } = await setup();
    expect((await core.authenticate(apiKey)).id).toBe(org.id);
    const rotated = await core.rotateApiKey(org.id);
    expect(rotated.apiKey).not.toBe(apiKey);
    expect(rotated.apiKey.startsWith("gk_us_")).toBe(true);
    await expect(core.authenticate(apiKey)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect((await core.authenticate(rotated.apiKey)).id).toBe(org.id);
  });
});

describe("door check-in", () => {
  it("checks in confirmed seats once, can undo, and refuses cancelled seats and other organizations", async () => {
    const repos = createInMemoryRepos();
    const core = new Core({ repos, ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter() });
    const { organization } = await core.createOrganization({ name: "AA", country: "US", currency: "USD" });
    await core.connectPayments(organization.id);
    const event = await core.createEvent(organization.id, { name: "RTE", startsAt: new Date(Date.now() + 86_400_000) });
    const tt = await core.createTicketType(organization.id, event.id, { name: "Seat", priceMinor: 10000, quantity: 5 });
    const res = await core.createOrder(organization.id, { eventId: event.id, ticketTypeId: tt.id, quantity: 2, buyerEmail: "a@b.co", attendees: [{ email: "a@b.co", name: "A" }, { email: "c@d.co", name: "C" }] });
    const order = "order" in res ? res.order : res;
    await core.handlePaymentEvent({ type: "payment.succeeded", paymentRef: order.paymentRef!, amountMinor: order.pricing.totalMinor, currency: "USD", providerEventId: "evt_1" });
    const [seat, other] = await core.listSeats(organization.id, { orderId: order.id });
    const first = await core.checkIn(organization.id, seat!.id);
    expect(first.alreadyCheckedIn).toBe(false);
    expect(first.seat.checkedInAt).toBeInstanceOf(Date);
    const again = await core.checkIn(organization.id, seat!.id);
    expect(again.alreadyCheckedIn).toBe(true);
    expect(again.seat.checkedInAt!.getTime()).toBe(first.seat.checkedInAt!.getTime());
    const undone = await core.checkIn(organization.id, seat!.id, { undo: true });
    expect(undone.seat.checkedInAt).toBeUndefined();
    await repos.seats.update({ ...other!, status: "cancelled", cancelledAt: new Date() });
    await expect(core.checkIn(organization.id, other!.id)).rejects.toThrow(/was cancelled/);
    const stranger = await core.createOrganization({ name: "BB", country: "US", currency: "USD" });
    await expect(core.checkIn(stranger.organization.id, seat!.id)).rejects.toThrow(/not found/);
  });
});
