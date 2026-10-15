import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Ledger } from "@gate/ledger";
import { Core, FakePaymentsAdapter, FlatRateTax, codes } from "@gate/core";
import { createPool, type Pool } from "./pool.js";
import { migrate } from "./migrate.js";
import { PostgresLedgerStore } from "./pg-ledger-store.js";
import { createPgRepos } from "./pg-repos.js";

const url = process.env.DATABASE_URL;

describe.skipIf(!url)("Postgres integration", () => {
  let pool: Pool;
  beforeAll(async () => {
    pool = createPool(url!);
    await pool.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
    const ran = await migrate(pool);
    expect(ran).toEqual(["0001_init.sql", "0002_training.sql", "0003_corporate.sql", "0004_selfservice.sql", "0005_delivery.sql", "0006_release.sql"]);
    expect(await migrate(pool)).toEqual([]);
  });
  afterAll(async () => { await pool?.end(); });

  it("ledger store: idempotent posts, balances, DB-enforced balance and append-only", async () => {
    const store = new PostgresLedgerStore(pool);
    const ledger = new Ledger({ store });
    const a = await ledger.createAccount({ code: "t:a", name: "A", type: "asset", currency: "USD", tenantId: "t" });
    const b = await ledger.createAccount({ code: "t:b", name: "B", type: "liability", currency: "USD", tenantId: "t" });
    const first = await ledger.post({ idempotencyKey: "k1", currency: "USD", description: "x", postings: [{ accountId: a.id, amount: 1_000 }, { accountId: b.id, amount: -1_000 }] });
    const again = await ledger.post({ idempotencyKey: "k1", currency: "USD", description: "x", postings: [{ accountId: a.id, amount: 1_000 }, { accountId: b.id, amount: -1_000 }] });
    expect(again.created).toBe(false);
    expect(again.entry.id).toBe(first.entry.id);
    expect((await ledger.balance(a.id)).natural).toBe(1_000);
    expect((await ledger.balance(b.id)).natural).toBe(1_000);
    expect((await ledger.listEntries({ accountId: a.id }))[0]?.postings).toHaveLength(2);

    // Bypass the application layer: the database itself refuses an unbalanced entry...
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(`INSERT INTO ledger_entries (id, idempotency_key, currency, description, effective_at) VALUES ('bad','bad','USD','bad',now())`);
      await client.query(`INSERT INTO ledger_postings (entry_id, account_id, amount) VALUES ('bad',$1, 5), ('bad',$2,-4)`, [a.id, b.id]);
      await expect(client.query("COMMIT")).rejects.toThrow(/unbalanced/);
    } finally {
      await client.query("ROLLBACK").catch(() => undefined);
      client.release();
    }
    expect((await pool.query(`SELECT count(*)::int AS n FROM ledger_entries WHERE id = 'bad'`)).rows[0].n).toBe(0);
    // ...and refuses to mutate history.
    await expect(pool.query(`DELETE FROM ledger_postings WHERE entry_id = $1`, [first.entry.id])).rejects.toThrow(/append-only/);
    await expect(pool.query(`UPDATE ledger_entries SET description = 'edited' WHERE id = $1`, [first.entry.id])).rejects.toThrow(/append-only/);
    await ledger.assertBalanced();
  });

  it("core on Postgres: checkout, payment, split, refund", async () => {
    const payments = new FakePaymentsAdapter();
    const ledger = new Ledger({ store: new PostgresLedgerStore(pool) });
    const core = new Core({ repos: createPgRepos(pool), ledger, payments });
    const { organization: org, apiKey } = await core.createOrganization({ releasePolicy: "immediate", name: "PG Org", country: "US", currency: "USD" });
    expect((await core.authenticate(apiKey)).id).toBe(org.id);
    await core.connectPayments(org.id);
    const venue = await core.createParty(org.id, { name: "Hall", kind: "venue", paymentsAccountRef: "acct_hall" });
    const event = await core.createEvent(org.id, { name: "Conf", startsAt: new Date("2026-12-01T10:00:00Z"), splitRules: [{ partyId: venue.id, kind: "percent", bps: 1_000 }] });
    const tt = await core.createTicketType(org.id, event.id, { name: "GA", priceMinor: 5_000, quantity: 3 });

    const { order } = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 2, buyerEmail: "pg@test.io", idempotencyKey: "pg-1" });
    const dup = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 2, buyerEmail: "pg@test.io", idempotencyKey: "pg-1" });
    expect(dup.created).toBe(false);
    await expect(core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 2, buyerEmail: "pg@test.io" })).rejects.toMatchObject({ code: "SOLD_OUT" });

    const evt = payments.succeed(order.paymentRef!, order.pricing.totalMinor, "USD");
    expect((await core.handlePaymentEvent(evt)).handled).toBe(true);
    expect((await core.handlePaymentEvent(evt)).reason).toBe("duplicate");
    const paid = await core.getOrder(org.id, order.id);
    expect(paid.status).toBe("paid");
    expect(Object.keys(paid.transferRefs)).toHaveLength(2);

    const bal = await core.balancesFor(org.id);
    expect(bal.find((b) => b.code === codes.orgPayable(org.id, "USD"))?.balanceMinor).toBe(order.splits.organizerMinor);
    expect(bal.find((b) => b.code === codes.partyPayable(venue.id, "USD"))?.balanceMinor).toBe(order.splits.lines[0]!.amountMinor);

    const refund = await core.refundOrder(org.id, { orderId: order.id, reason: "test" });
    expect(refund.status).toBe("succeeded");
    expect((await core.getOrder(org.id, order.id)).status).toBe("refunded");
    expect((await core.platformBalances()).find((b) => b.code === codes.clearing("USD"))?.balanceMinor).toBe(0);
    await ledger.assertBalanced();
  });

  it("corporate invoice orders on Postgres: numbering, partial payments, settlement", async () => {
    const repos = createPgRepos(pool);
    const ledger = new Ledger({ store: new PostgresLedgerStore(pool) });
    const core = new Core({ repos, ledger, payments: new FakePaymentsAdapter(), tax: new FlatRateTax() });
    const { organization: org } = await core.createOrganization({ releasePolicy: "immediate", name: "Corp Org", country: "CA", currency: "CAD" });
    const course = await core.createCourse(org.id, { slug: "spc", name: "SPC" });
    const cohort = await core.createEvent(org.id, { courseId: course.id, name: "SPC", startsAt: new Date("2027-01-10T14:00:00Z"), timezone: "America/Toronto", sessions: [{ startsAt: new Date("2027-01-10T14:00:00Z"), endsAt: new Date("2027-01-10T22:00:00Z"), title: "Day 1" }] });
    const tt = await core.createTicketType(org.id, cohort.id, { name: "Std", priceMinor: 100_000, quantity: 10, prices: { USD: 80_000 }, earlyBird: { until: new Date("2026-12-01T00:00:00Z"), priceMinor: 90_000 } });
    const acct = await core.createCorporateAccount(org.id, { name: "Big Bank", billingEmail: "ap@bigbank.ca", address: { country: "CA", region: "ON" }, poRequired: true });
    const a = await core.createInvoiceOrder(org.id, { corporateAccountId: acct.id, ticketTypeId: tt.id, quantity: 2, poNumber: "PO-1", idempotencyKey: "pg-inv-1" });
    const b = await core.createInvoiceOrder(org.id, { corporateAccountId: acct.id, ticketTypeId: tt.id, quantity: 1, poNumber: "PO-2" });
    expect([a.invoice.number, b.invoice.number]).toEqual(["INV-2026-0001", "INV-2026-0002"].map((n) => n.replace("2026", String(new Date().getUTCFullYear()))));
    expect((await core.createInvoiceOrder(org.id, { corporateAccountId: acct.id, ticketTypeId: tt.id, quantity: 2, poNumber: "PO-1", idempotencyKey: "pg-inv-1" })).created).toBe(false);
    const reloaded = await core.getEvent(org.id, cohort.id);
    expect(reloaded.sessions[0]?.title).toBe("Day 1");
    expect((await repos.ticketTypes.get(tt.id))?.earlyBird?.priceMinor).toBe(90_000);
    await core.recordInvoicePayment(org.id, { invoiceId: a.invoice.id, amountMinor: 1_000, method: "wire", reference: "W1" });
    const done = await core.recordInvoicePayment(org.id, { invoiceId: a.invoice.id, amountMinor: a.invoice.totalMinor - 1_000, method: "bank_transfer" });
    expect(done.status).toBe("paid");
    expect(done.payments.map((p) => p.reference ?? null)).toEqual(["W1", null]);
    expect((await core.getOrder(org.id, a.order.id)).status).toBe("paid");
    expect((await core.listSeats(org.id, { orderId: a.order.id })).every((s) => s.status === "confirmed")).toBe(true);
    expect((await core.receivablesAgeing(org.id)).items.map((i) => i.invoiceId)).toEqual([b.invoice.id]);
    await ledger.assertBalanced();
  });

  it("seat transfer and waitlist on Postgres", async () => {
    const repos = createPgRepos(pool);
    const payments = new FakePaymentsAdapter();
    const core = new Core({ repos, ledger: new Ledger({ store: new PostgresLedgerStore(pool) }), payments });
    const { organization: org } = await core.createOrganization({ releasePolicy: "immediate", name: "Self Org", country: "CA", currency: "CAD" });
    const course = await core.createCourse(org.id, { slug: "ls", name: "LS" });
    const nov = await core.createEvent(org.id, { courseId: course.id, name: "Nov", startsAt: new Date(Date.now() + 40 * 86_400_000) });
    const dec = await core.createEvent(org.id, { courseId: course.id, name: "Dec", startsAt: new Date(Date.now() + 70 * 86_400_000) });
    const novTt = await core.createTicketType(org.id, nov.id, { name: "Std", priceMinor: 50_000, quantity: 1 });
    await core.createTicketType(org.id, dec.id, { name: "Std", priceMinor: 50_000, quantity: 5 });
    const { order } = await core.createOrder(org.id, { ticketTypeId: novTt.id, quantity: 1, buyerEmail: "a@b.co", attendees: [{ email: "a@b.co", name: "A" }] });
    await core.handlePaymentEvent(payments.succeed(order.paymentRef!, order.pricing.totalMinor, "CAD"));
    const seat = (await core.listSeats(org.id, { orderId: order.id }))[0]!;
    const wl = await core.joinWaitlist(org.id, { eventId: nov.id, email: "w@b.co", quantity: 1 });
    expect(wl.entry.status).toBe("waiting");
    await core.setChangePolicy(org.id, { ...(await core.policyFor(org.id, undefined)), transferFreeUntilDays: 1 });
    const r = await core.transferSeat(seat.id, dec.id, { attendeeEmail: "a@b.co" });
    expect(r.transfer.status).toBe("completed");
    expect(r.seat?.transferredFromSeatId).toBe(seat.id);
    expect((await repos.seats.get(seat.id))?.transferredToSeatId).toBe(r.seat?.id);
    expect((await repos.waitlist.get(wl.entry.id))?.status).toBe("offered");
    expect((await repos.ticketTypes.get(novTt.id))?.sold).toBe(1); // held for the offer
    const sub = await core.substituteSeat(r.seat!.id, { email: "c@b.co", name: "C" }, { organizationId: org.id });
    expect((await repos.seats.get(sub.id))?.substitutions?.[0]?.from.email).toBe("a@b.co");
  });

  it("delivery on Postgres: manual meeting, attendance, certificates, message log", async () => {
    const repos = createPgRepos(pool);
    const payments = new FakePaymentsAdapter();
    const core = new Core({ repos, ledger: new Ledger({ store: new PostgresLedgerStore(pool) }), payments, clock: { now: () => new Date("2026-11-22T12:00:00Z") } });
    const { organization: org } = await core.createOrganization({ releasePolicy: "immediate", name: "Deliver Org", country: "CA", currency: "CAD" });
    const course = await core.createCourse(org.id, { slug: "d", name: "Delivery Course" });
    await core.updateCourse(org.id, course.id, { prework: "Read chapter 1", surveyUrl: "https://forms.example/s" });
    const ev = await core.createEvent(org.id, { courseId: course.id, name: "Nov", sessions: [{ startsAt: new Date("2026-11-20T14:00:00Z"), endsAt: new Date("2026-11-20T22:00:00Z") }] });
    const tt = await core.createTicketType(org.id, ev.id, { name: "Std", priceMinor: 1_000, quantity: 5 });
    const { order } = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "p@q.io", attendees: [{ email: "p@q.io", name: "Pat Quinn" }] });
    await core.handlePaymentEvent(payments.succeed(order.paymentRef!, order.pricing.totalMinor, "CAD"));
    const withMeeting = await core.setMeeting(org.id, ev.id, { provider: "manual", joinUrl: "https://zoom.us/j/1", passcode: "abc" });
    expect((await repos.events.get(ev.id))?.meeting).toEqual(withMeeting.meeting);
    const seat = (await core.listSeats(org.id, { eventId: ev.id }))[0]!;
    await core.setAttendance(org.id, ev.id, { seatId: seat.id, status: "present", minutes: 480 });
    expect((await repos.seats.get(seat.id))?.attendance?.status).toBe("present");
    const issued = await core.issueCertificates(org.id, ev.id, { onlyPresent: true });
    expect(issued).toHaveLength(1);
    expect((await core.verifyCertificate(issued[0]!.verifyCode)).valid).toBe(true);
    expect(await core.issueCertificates(org.id, ev.id)).toEqual([]);
    const run = await core.runSequences(new Date("2026-11-22T12:00:00Z"), org.id);
    expect(run.details.map((d) => d.step).sort()).toEqual(["day_of", "prework_t14", "reminder_t1", "reminder_t7", "survey"]);
    expect((await core.runSequences(new Date("2026-11-22T12:00:00Z"), org.id)).sent).toBe(0);
    expect((await core.roster(org.id, ev.id, "safe_studio")).csv.split("\r\n")[1]).toBe('"Pat","Quinn","p@q.io",""');
  });

  it("release on Postgres: held funds, release after delivery, payouts", async () => {
    const repos = createPgRepos(pool);
    const payments = new FakePaymentsAdapter();
    let now = new Date("2026-10-01T00:00:00Z");
    const ledger = new Ledger({ store: new PostgresLedgerStore(pool) });
    const core = new Core({ repos, ledger, payments, clock: { now: () => now } });
    const { organization: org } = await core.createOrganization({ name: "Hold Org", country: "CA", currency: "CAD" });
    const ev = await core.createEvent(org.id, { name: "Soon", sessions: [{ startsAt: new Date("2026-10-10T14:00:00Z"), endsAt: new Date("2026-10-10T22:00:00Z") }] });
    const tt = await core.createTicketType(org.id, ev.id, { name: "Std", priceMinor: 50_000, quantity: 5 });
    const { order } = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "h@h.io" });
    await core.handlePaymentEvent(payments.succeed(order.paymentRef!, order.pricing.totalMinor, "CAD"));
    expect((await repos.orders.get(order.id))?.fundsStatus).toBe("held");
    expect((await core.payables(org.id))[0]?.heldMinor).toBe(50_000 - 650);
    now = new Date("2026-10-12T00:00:00Z");
    const r = await core.releaseDelivered(now);
    expect(r.orders).toBe(1);
    expect((await repos.orders.get(order.id))?.fundsStatus).toBe("released");
    const payout = await core.recordPayout(org.id, { currency: "CAD", amountMinor: 10_000, method: "wire", reference: "W" });
    expect((await repos.payouts.listByOrganization(org.id))[0]?.id).toBe(payout.id);
    expect((await core.payables(org.id))[0]?.payableMinor).toBe(50_000 - 650 - 10_000);
    await ledger.assertBalanced();
  });

  it("reserve is atomic under concurrency", async () => {
    const repos = createPgRepos(pool);
    const ledger = new Ledger({ store: new PostgresLedgerStore(pool) });
    const core = new Core({ repos, ledger, payments: new FakePaymentsAdapter() });
    const { organization: org } = await core.createOrganization({ releasePolicy: "immediate", name: "Race", country: "US", currency: "USD" });
    const event = await core.createEvent(org.id, { name: "Race", startsAt: new Date() });
    const tt = await core.createTicketType(org.id, event.id, { name: "Only5", priceMinor: 100, quantity: 5 });
    const results = await Promise.allSettled(Array.from({ length: 20 }, () => core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "r@t.io" })));
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const reasons = results.filter((r): r is PromiseRejectedResult => r.status === "rejected").map((r) => `${(r.reason as { code?: string }).code}:${(r.reason as Error).message}`);
    expect(reasons.filter((r) => !r.startsWith("SOLD_OUT")), "unexpected failures").toEqual([]);
    expect(ok).toBe(5);
    expect((await repos.ticketTypes.get(tt.id))?.sold).toBe(5);
  });
});
