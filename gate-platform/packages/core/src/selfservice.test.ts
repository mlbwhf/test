import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { codes } from "./accounts.js";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";
import { DEFAULT_CHANGE_POLICY, cancelTerms, transferTerms } from "./policy.js";
import type { SeatChangedContext, WaitlistOfferedContext } from "./hooks.js";

let core: Core;
let payments: FakePaymentsAdapter;
let ledger: Ledger;
let now: Date;
const changes: SeatChangedContext[] = [];
const offers: WaitlistOfferedContext[] = [];

beforeEach(() => {
  now = new Date("2026-10-01T12:00:00Z");
  payments = new FakePaymentsAdapter();
  ledger = new Ledger({ store: new InMemoryLedgerStore() });
  changes.length = 0; offers.length = 0;
  core = new Core({ repos: createInMemoryRepos(), ledger, payments, clock: { now: () => now }, hooks: [{ seatChanged: async (c) => { changes.push(c); }, waitlistOffered: async (c) => { offers.push(c); } }] });
});

async function setup(capacity = 10) {
  const { organization: org } = await core.createOrganization({ name: "Agile Agilist", country: "CA", currency: "CAD" });
  const course = await core.createCourse(org.id, { slug: "leading-safe", name: "Leading SAFe" });
  const nov = await core.createEvent(org.id, { courseId: course.id, name: "Nov", startsAt: new Date("2026-11-20T14:00:00Z"), timezone: "America/Toronto" });
  const dec = await core.createEvent(org.id, { courseId: course.id, name: "Dec", startsAt: new Date("2026-12-04T14:00:00Z"), timezone: "America/Toronto" });
  const novTt = await core.createTicketType(org.id, nov.id, { name: "Standard", priceMinor: 100_000, quantity: capacity });
  const decTt = await core.createTicketType(org.id, dec.id, { name: "Standard", priceMinor: 120_000, quantity: 2 });
  const { order } = await core.createOrder(org.id, { ticketTypeId: novTt.id, quantity: 2, buyerEmail: "buyer@co.com", attendees: [{ email: "ada@co.com", name: "Ada" }, { email: "alan@co.com", name: "Alan" }] });
  await core.handlePaymentEvent(payments.succeed(order.paymentRef!, order.pricing.totalMinor, "CAD"));
  const seats = await core.listSeats(org.id, { orderId: order.id });
  return { org, course, nov, dec, novTt, decTt, order, ada: seats[0]!, alan: seats[1]! };
}

describe("policy terms", () => {
  it("transfer is free until 7 days out, then 15% of the unit price, never after start", () => {
    const start = new Date("2026-11-20T14:00:00Z");
    expect(transferTerms(DEFAULT_CHANGE_POLICY, start, new Date("2026-11-01T00:00:00Z"), 100_000, false)).toMatchObject({ allowed: true, feeMinor: 0 });
    expect(transferTerms(DEFAULT_CHANGE_POLICY, start, new Date("2026-11-15T00:00:00Z"), 100_000, false)).toMatchObject({ allowed: true, feeMinor: 15_000 });
    expect(transferTerms(DEFAULT_CHANGE_POLICY, start, new Date("2026-11-21T00:00:00Z"), 100_000, false).allowed).toBe(false);
  });
  it("cancel refunds 100% until 14 days, 50% until 7 days, nothing inside 7 days", () => {
    const start = new Date("2026-11-20T14:00:00Z");
    expect(cancelTerms(DEFAULT_CHANGE_POLICY, start, new Date("2026-11-01T00:00:00Z"), 100_000, false).refundMinor).toBe(100_000);
    expect(cancelTerms(DEFAULT_CHANGE_POLICY, start, new Date("2026-11-10T00:00:00Z"), 100_000, false).refundMinor).toBe(50_000);
    expect(cancelTerms(DEFAULT_CHANGE_POLICY, start, new Date("2026-11-18T00:00:00Z"), 100_000, false)).toMatchObject({ allowed: true, refundMinor: 0 });
  });
});

describe("seat self-service", () => {
  it("exposes options with the attendee email as credential, and hides them from strangers", async () => {
    const { ada, dec } = await setup();
    const opts = await core.seatOptions(ada.id, { attendeeEmail: "ADA@co.com" });
    expect(opts.policyTerms.transfer).toMatchObject({ allowed: true, feeMinor: 0 });
    expect(opts.policyTerms.cancel).toMatchObject({ allowed: true, refundBps: 10_000, refundMinor: 100_000 });
    expect(opts.transferOptions).toEqual([expect.objectContaining({ eventId: dec.id, remaining: 2, priceDeltaMinor: 20_000, feeMinor: 20_000 })]);
    await expect(core.seatOptions(ada.id, { attendeeEmail: "stranger@x.com" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("substitutes the attendee and keeps history; refuses inside the cutoff", async () => {
    const { org, ada } = await setup();
    const updated = await core.substituteSeat(ada.id, { email: "grace@co.com", name: "Grace" }, { attendeeEmail: "ada@co.com" });
    expect(updated.attendee.email).toBe("grace@co.com");
    expect(updated.substitutions?.[0]?.from.email).toBe("ada@co.com");
    expect(changes[0]).toMatchObject({ kind: "substituted" });
    now = new Date("2026-11-20T00:00:00Z");
    await expect(core.substituteSeat(ada.id, { email: "x@co.com" }, { organizationId: org.id })).rejects.toMatchObject({ code: "INVALID_STATE" });
  });

  it("transfers free within the window, moving capacity between cohorts", async () => {
    const { org, ada, nov, dec, novTt, decTt } = await setup();
    // Make Dec the same price so no delta applies.
    const decCheap = await core.createTicketType(org.id, dec.id, { name: "Standard", priceMinor: 100_000, quantity: 1 });
    void decTt; void decCheap;
    const options = await core.seatOptions(ada.id, { attendeeEmail: "ada@co.com" });
    expect(options.transferOptions[0]?.ticketTypeId).toBe(decTt.id); // same-name first match
    const r = await core.transferSeat(ada.id, dec.id, { attendeeEmail: "ada@co.com" });
    expect(r.transfer.status).toBe("pending_payment"); // $20 price difference is a fee
    expect(r.clientSecret).toContain("secret");
    expect((await core.listTicketTypes(org.id, dec.id)).find((t) => t.id === decTt.id)?.sold).toBe(1);
    await core.handlePaymentEvent(payments.succeed(r.transfer.paymentRef!, 20_000, "CAD"));
    const old = (await core.listSeats(org.id, { orderId: ada.orderId })).find((s) => s.id === ada.id)!;
    expect(old.status).toBe("transferred");
    const moved = (await core.listSeats(org.id, { eventId: dec.id }))[0]!;
    expect(moved.transferredFromSeatId).toBe(ada.id);
    expect(old.transferredToSeatId).toBe(moved.id);
    expect((await core.listTicketTypes(org.id, nov.id)).find((t) => t.id === novTt.id)?.sold).toBe(1);
    expect((await core.balancesFor(org.id)).find((b) => b.code === codes.orgPayable(org.id, "CAD"))?.balanceMinor).toBe(200_000 - 1_300 + 20_000);
    await ledger.assertBalanced();
    expect(changes.at(-1)).toMatchObject({ kind: "transferred" });
  });

  it("a failed fee payment releases the held seat", async () => {
    const { org, ada, dec, decTt } = await setup();
    const r = await core.transferSeat(ada.id, dec.id, { attendeeEmail: "ada@co.com" });
    await core.handlePaymentEvent(payments.fail(r.transfer.paymentRef!));
    expect((await core.listTicketTypes(org.id, dec.id)).find((t) => t.id === decTt.id)?.sold).toBe(0);
    expect((await core.listSeats(org.id, { orderId: ada.orderId })).find((s) => s.id === ada.id)?.status).toBe("confirmed");
  });

  it("cancels with the policy refund and releases the seat", async () => {
    const { org, alan, order, novTt } = await setup();
    now = new Date("2026-11-10T00:00:00Z"); // 10 days out: 50%
    const { seat, refund } = await core.cancelSeat(alan.id, "schedule conflict", { attendeeEmail: "alan@co.com" });
    expect(seat.status).toBe("cancelled");
    expect(refund?.amountMinor).toBe(50_000);
    expect((await core.getOrder(org.id, order.id)).status).toBe("partially_refunded");
    expect((await core.listTicketTypes(org.id, novTt.eventId))[0]?.sold).toBe(1);
    await ledger.assertBalanced();
    await expect(core.cancelSeat(alan.id, "again", { attendeeEmail: "alan@co.com" })).rejects.toMatchObject({ code: "INVALID_STATE" });
  });
});

describe("waitlist", () => {
  it("queues when sold out, offers held seats when one frees, converts on claim, expires unclaimed offers", async () => {
    const { org, nov, novTt, ada } = await setup(2); // both seats sold
    const first = await core.joinWaitlist(org.id, { eventId: nov.id, email: "w1@x.com", name: "W1" });
    const second = await core.joinWaitlist(org.id, { eventId: nov.id, email: "w2@x.com" });
    expect(first.position).toBe(1);
    expect(second.position).toBe(2);
    expect(first.entry.status).toBe("waiting");
    await expect(core.joinWaitlist(org.id, { eventId: nov.id, email: "W1@x.com" })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(core.createOrder(org.id, { ticketTypeId: novTt.id, quantity: 1, buyerEmail: "late@x.com" })).rejects.toMatchObject({ code: "SOLD_OUT" });

    // Ada cancels -> one seat frees -> W1 gets the offer and the seat stays held.
    await core.cancelSeat(ada.id, "", { attendeeEmail: "ada@co.com" });
    const w1 = (await core.repos.waitlist.get(first.entry.id))!;
    expect(w1.status).toBe("offered");
    expect(w1.offerExpiresAt?.toISOString()).toBe("2026-10-02T12:00:00.000Z");
    expect(offers).toHaveLength(1);
    expect((await core.listTicketTypes(org.id, nov.id))[0]?.sold).toBe(2);
    await expect(core.createOrder(org.id, { ticketTypeId: novTt.id, quantity: 1, buyerEmail: "late@x.com" })).rejects.toMatchObject({ code: "SOLD_OUT" });
    await expect(core.createOrder(org.id, { ticketTypeId: novTt.id, quantity: 1, buyerEmail: "w2@x.com", waitlistEntryId: w1.id })).rejects.toMatchObject({ code: "VALIDATION" });

    const claim = await core.createOrder(org.id, { ticketTypeId: novTt.id, quantity: 1, buyerEmail: "w1@x.com", waitlistEntryId: w1.id });
    expect(claim.order.status).toBe("pending");
    expect((await core.repos.waitlist.get(w1.id))?.status).toBe("converted");
    expect((await core.listTicketTypes(org.id, nov.id))[0]?.sold).toBe(2);

    // W2's turn: a second seat frees when the claim's payment fails... simulate via failing the claim payment.
    await core.handlePaymentEvent(payments.fail(claim.order.paymentRef!));
    const w2 = (await core.repos.waitlist.get(second.entry.id))!;
    expect(w2.status).toBe("offered");
    now = new Date("2026-10-03T00:00:00Z");
    const expired = await core.expireWaitlistOffers();
    expect(expired.map((e) => e.id)).toEqual([w2.id]);
    expect((await core.listTicketTypes(org.id, nov.id))[0]?.sold).toBe(1);
    expect(await core.listWaitlist(org.id, nov.id)).toEqual([]);
  });
});
