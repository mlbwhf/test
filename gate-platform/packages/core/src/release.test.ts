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
const atRisk: string[] = [];
const cancelled: string[] = [];

beforeEach(() => {
  now = new Date("2026-10-15T12:00:00Z");
  payments = new FakePaymentsAdapter();
  ledger = new Ledger({ store: new InMemoryLedgerStore() });
  atRisk.length = 0; cancelled.length = 0;
  core = new Core({ repos: createInMemoryRepos(), ledger, payments, clock: { now: () => now }, hooks: [{ cohortAtRisk: async (c) => { atRisk.push(c.event.id); }, cohortCancelled: async (c) => { cancelled.push(c.event.id); } }] });
});

async function setup() {
  const { organization: org } = await core.createOrganization({ name: "Agile Agilist", country: "CA", currency: "CAD" }); // on_delivery by default
  await core.connectPayments(org.id);
  const instructor = await core.createParty(org.id, { name: "Jane Trainer", kind: "instructor", paymentsAccountRef: "acct_jane" });
  const venue = await core.createParty(org.id, { name: "Hall", kind: "venue", paymentsAccountRef: "acct_hall" });
  const course = await core.createCourse(org.id, { slug: "leading-safe", name: "Leading SAFe" });
  const nov = await core.createEvent(org.id, { courseId: course.id, name: "Nov", sessions: [{ startsAt: new Date("2026-11-20T14:00:00Z"), endsAt: new Date("2026-11-21T22:00:00Z") }], minEnrollment: 4, splitRules: [{ partyId: venue.id, kind: "percent", bps: 1_000 }] });
  await core.setInstructorFees(org.id, nov.id, [{ partyId: instructor.id, amountMinor: 150_000 }]);
  const tt = await core.createTicketType(org.id, nov.id, { name: "Std", priceMinor: 100_000, quantity: 10 });
  return { org, instructor, venue, course, nov, tt };
}

async function sell(orgId: string, ttId: string, qty: number, email: string) {
  const { order } = await core.createOrder(orgId, { ticketTypeId: ttId, quantity: qty, buyerEmail: email });
  await core.handlePaymentEvent(payments.succeed(order.paymentRef!, order.pricing.totalMinor, order.currency));
  return core.getOrder(orgId, order.id);
}

describe("delivery-linked release", () => {
  it("holds organizer-side funds until the cohort ends plus grace, then releases pro rata, pays instructor fees and transfers", async () => {
    const { org, nov, tt, venue, instructor } = await setup();
    const a = await sell(org.id, tt.id, 2, "a@co.com");
    const b = await sell(org.id, tt.id, 3, "b@co.com");
    expect(a.fundsStatus).toBe("held");
    expect(a.heldMinor).toBe(200_000 - 9_980); // organizer + venue share, net of platform fee
    expect(a.transferRefs).toEqual({}); // nothing moved to Stripe yet
    let bal = await core.balancesFor(org.id);
    expect(bal.find((x) => x.code === codes.orgHeld(org.id, "CAD"))?.balanceMinor).toBe(a.heldMinor + b.heldMinor);
    expect(bal.find((x) => x.code === codes.orgPayable(org.id, "CAD"))?.balanceMinor ?? 0).toBe(0);
    expect(await core.payables(org.id)).toEqual([expect.objectContaining({ partyId: null, name: "Agile Agilist", currency: "CAD", payableMinor: 0, heldMinor: a.heldMinor + b.heldMinor })]);
    await expect(core.recordPayout(org.id, { currency: "CAD", amountMinor: 1, method: "wire" })).rejects.toMatchObject({ code: "VALIDATION" });

    // A refund before release comes out of the held funds.
    await core.refundOrder(org.id, { orderId: b.id, amountMinor: 100_000, reason: "one dropped" });
    const bAfter = await core.getOrder(org.id, b.id);
    expect(bAfter.heldMinor).toBeLessThan(b.heldMinor);
    await ledger.assertBalanced();

    // Before the grace period nothing releases.
    now = new Date("2026-11-22T00:00:00Z");
    expect((await core.releaseDelivered()).orders).toBe(0);
    now = new Date("2026-11-23T00:00:00Z"); // end + 24h grace passed
    const r = await core.releaseDelivered();
    expect(r.orders).toBe(2);
    expect(r.amountMinor).toBe(a.heldMinor + bAfter.heldMinor);
    const aDone = await core.getOrder(org.id, a.id);
    expect(aDone.fundsStatus).toBe("released");
    expect(Object.keys(aDone.transferRefs).sort()).toEqual([org.id, venue.id].sort());
    bal = await core.balancesFor(org.id);
    expect(bal.find((x) => x.code === codes.orgHeld(org.id, "CAD"))?.balanceMinor).toBe(0);
    const payable = await core.payables(org.id);
    const orgRow = payable.find((p) => p.partyId === null)!;
    const janeRow = payable.find((p) => p.partyId === instructor.id)!;
    const hallRow = payable.find((p) => p.partyId === venue.id)!;
    expect(janeRow.payableMinor).toBe(150_000);
    expect(hallRow.payableMinor).toBeGreaterThan(0);
    expect(orgRow.payableMinor + janeRow.payableMinor + hallRow.payableMinor).toBe(r.amountMinor);
    expect(payments.calls.filter((c) => c.method === "createTransfer").map((c) => (c.input as { idempotencyKey: string }).idempotencyKey)).toContain(`transfer:cohort:${nov.id}:${instructor.id}`);
    expect((await core.getEvent(org.id, nov.id)).status).toBe("ended");
    await ledger.assertBalanced();
    expect((await core.releaseDelivered()).orders).toBe(0); // idempotent

    const payout = await core.recordPayout(org.id, { partyId: instructor.id, currency: "CAD", amountMinor: 150_000, method: "bank_transfer", reference: "E-TRANSFER-1" });
    expect(payout.amountMinor).toBe(150_000);
    expect((await core.payables(org.id)).find((p) => p.partyId === instructor.id)?.payableMinor).toBe(0);
    expect(await core.listPayouts(org.id)).toHaveLength(1);
    await ledger.assertBalanced();
  });

  it("immediate policy pays out at payment time as before", async () => {
    const { organization: org } = await core.createOrganization({ releasePolicy: "immediate", name: "Quick", country: "US", currency: "USD" });
    const ev = await core.createEvent(org.id, { name: "x", startsAt: new Date("2027-01-01T00:00:00Z") });
    const tt = await core.createTicketType(org.id, ev.id, { name: "s", priceMinor: 10_000, quantity: 5 });
    const o = await sell(org.id, tt.id, 1, "q@q.co");
    expect(o.fundsStatus).toBe("released");
    expect((await core.payables(org.id))[0]).toMatchObject({ payableMinor: 10_000 - 570, heldMinor: 0 });
    const updated = await core.updateOrganization(org.id, { releasePolicy: "on_delivery", releaseGraceHours: 48 });
    expect(updated).toMatchObject({ releasePolicy: "on_delivery", releaseGraceHours: 48 });
  });
});

describe("minimum enrolment and cancellation", () => {
  it("flags a cohort below minimum at the decision point, then cancels it with full refunds", async () => {
    const { org, nov, tt } = await setup();
    const a = await sell(org.id, tt.id, 2, "a@co.com");
    expect(await core.reviewMinEnrollment()).toEqual([]); // Oct 15 is more than 7 days out
    now = new Date("2026-11-14T00:00:00Z");
    const flagged = await core.reviewMinEnrollment();
    expect(flagged.map((e) => e.id)).toEqual([nov.id]);
    expect(atRisk).toEqual([nov.id]);
    expect(await core.reviewMinEnrollment()).toEqual([]); // only once
    const r = await core.cancelCohort(org.id, nov.id, { reason: "below minimum" });
    expect(r).toMatchObject({ refunded: 1, transferred: 0, voided: 0 });
    expect(r.event.status).toBe("cancelled");
    expect((await core.getOrder(org.id, a.id)).status).toBe("refunded");
    expect((await core.listSeats(org.id, { orderId: a.id })).every((s) => s.status === "cancelled")).toBe(true);
    expect((await core.platformBalances()).find((b) => b.code === codes.clearing("CAD"))?.balanceMinor).toBe(0);
    expect(cancelled).toEqual([nov.id]);
    await ledger.assertBalanced();
    await expect(core.releaseEvent(org.id, nov.id)).rejects.toMatchObject({ code: "INVALID_STATE" });
  });

  it("can move learners (and their money) to another cohort instead of refunding", async () => {
    const { org, course, nov, tt } = await setup();
    const dec = await core.createEvent(org.id, { courseId: course.id, name: "Dec", startsAt: new Date("2026-12-10T14:00:00Z") });
    await core.createTicketType(org.id, dec.id, { name: "Std", priceMinor: 100_000, quantity: 10 });
    const a = await sell(org.id, tt.id, 2, "a@co.com");
    const r = await core.cancelCohort(org.id, nov.id, { reason: "merge", transferToEventId: dec.id });
    expect(r).toMatchObject({ refunded: 0, transferred: 2 });
    expect((await core.getOrder(org.id, a.id)).eventId).toBe(dec.id);
    expect((await core.listSeats(org.id, { eventId: dec.id })).map((s) => s.status)).toEqual(["confirmed", "confirmed"]);
    expect((await core.listTicketTypes(org.id, nov.id))[0]?.sold).toBe(2); // source capacity irrelevant once cancelled
    const report = await core.revenueReport(org.id, { from: new Date("2026-12-01T00:00:00Z"), to: new Date("2026-12-31T00:00:00Z") });
    const decRow = report.cohorts.find((c) => c.eventId === dec.id)!;
    expect(decRow.seats).toBe(2);
    expect(decRow.recognized).toBe(true);
  });
});

describe("revenue recognition", () => {
  it("recognises on delivery, defers the rest, and nets instructor fees and refunds", async () => {
    const { org, course, nov, tt } = await setup();
    const jan = await core.createEvent(org.id, { courseId: course.id, name: "Jan", startsAt: new Date("2027-01-15T14:00:00Z") });
    const janTt = await core.createTicketType(org.id, jan.id, { name: "Std", priceMinor: 100_000, quantity: 10 });
    const a = await sell(org.id, tt.id, 3, "a@co.com");
    await sell(org.id, janTt.id, 1, "j@co.com");
    await core.refundOrder(org.id, { orderId: a.id, amountMinor: 100_000, reason: "one dropped" });
    const nowReport = await core.revenueReport(org.id, { from: new Date("2026-11-01T00:00:00Z"), to: new Date("2026-11-30T00:00:00Z") });
    const novRow = nowReport.cohorts.find((c) => c.eventId === nov.id)!;
    expect(novRow).toMatchObject({ recognized: true, seats: 3, grossMinor: 300_000, refundedMinor: 100_000, instructorFeesMinor: 150_000, fundsStatus: "held" });
    expect(novRow.marginMinor).toBe(novRow.organizerNetMinor - Math.round((100_000 * novRow.organizerNetMinor) / 300_000) - 150_000);
    expect(nowReport.byCurrency.CAD).toMatchObject({ recognizedMinor: novRow.marginMinor, deferredMinor: 100_000 - 4_990, refundedMinor: 100_000 });
    const janRow = nowReport.cohorts.find((c) => c.eventId === jan.id)!;
    expect(janRow.recognized).toBe(false);
  });
});
