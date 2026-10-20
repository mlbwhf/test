import { beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { Core, FakePaymentsAdapter, FlatRateTax, createInMemoryRepos } from "@gate/core";
import { buildApp } from "./app.js";

let app: FastifyInstance;
let apiKey: string;
let orgId: string;
const H = () => ({ "x-api-key": apiKey, "content-type": "application/json" });

beforeEach(async () => {
  const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter(), tax: new FlatRateTax(), clock: { now: () => new Date("2026-10-15T12:00:00Z") } });
  app = await buildApp({ core, adminKey: "admin", env: "test", publicPageUrl: (_o, slug) => `https://agile-agilist.com/training/${slug}/` });
  const res = await app.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "Agile Agilist", country: "CA", currency: "CAD", releasePolicy: "immediate" } });
  apiKey = res.json().apiKey;
  orgId = res.json().organization.id;
});

describe("training API", () => {
  it("course -> cohort with sessions -> regional ticket -> public catalogue -> public checkout -> seats -> JSON-LD", async () => {
    const instructor = (await app.inject({ method: "POST", url: "/v1/parties", headers: H(), payload: { name: "John", kind: "instructor" } })).json();
    const course = await app.inject({ method: "POST", url: "/v1/courses", headers: H(), payload: { slug: "leading-safe", name: "Leading SAFe", certificationBody: "Scaled Agile", durationDays: 2 } });
    expect(course.statusCode).toBe(201);
    const courseId = course.json().id;

    const cohort = await app.inject({
      method: "POST", url: `/v1/courses/${courseId}/cohorts`, headers: H(),
      payload: {
        name: "Leading SAFe Nov", timezone: "America/Toronto", format: "live_virtual", instructorIds: [instructor.id], minEnrollment: 4,
        sessions: [{ startsAt: "2026-11-20T09:00:00-05:00", endsAt: "2026-11-20T17:00:00-05:00", title: "Day 1" }, { startsAt: "2026-11-21T09:00:00-05:00", endsAt: "2026-11-21T17:00:00-05:00" }],
      },
    });
    expect(cohort.statusCode).toBe(201);
    expect(cohort.json()).toMatchObject({ courseId, timezone: "America/Toronto", startsAt: "2026-11-20T14:00:00.000Z", endsAt: "2026-11-21T22:00:00.000Z", instructorIds: [instructor.id] });
    const eventId = cohort.json().id;
    expect((await app.inject({ url: `/v1/courses/${courseId}/cohorts`, headers: H() })).json().items).toHaveLength(1);

    const tt = await app.inject({ method: "POST", url: `/v1/events/${eventId}/ticket-types`, headers: H(), payload: { name: "Standard", priceMinor: 129_900, quantity: 10, prices: { GBP: 79_900, USD: 99_900 }, earlyBird: { until: "2026-11-01T00:00:00Z", priceMinor: 109_900, prices: { GBP: 69_900 } } } });
    expect(tt.statusCode).toBe(201);
    expect(tt.json().earlyBird.prices).toEqual({ GBP: 69_900 });
    const ticketTypeId = tt.json().id;

    const pub = await app.inject(`/public/v1/organizations/${orgId}/courses/leading-safe`);
    expect(pub.statusCode).toBe(200);
    expect(pub.json().cohorts[0].ticketTypes[0].prices).toEqual({ CAD: 109_900, GBP: 69_900, USD: 99_900 });

    const order = await app.inject({ method: "POST", url: `/public/v1/organizations/${orgId}/orders`, headers: { "content-type": "application/json" }, payload: { ticketTypeId, quantity: 2, buyerEmail: "lead@corp.co.uk", currency: "GBP", attendees: [{ email: "a@corp.co.uk", name: "A" }, { email: "b@corp.co.uk", name: "B" }] } });
    expect(order.statusCode).toBe(201);
    expect(order.json().order.currency).toBe("GBP");
    expect(order.json().order.pricing.totalMinor).toBe(139_800);
    expect(order.json().order.splits).toEqual({ organizerMinor: 0, lines: [] }); // internals hidden from buyers
    expect(order.json().clientSecret).toContain("secret");
    const paymentRef = order.json().order.paymentRef;

    expect((await app.inject({ method: "POST", url: `/public/v1/dev/payments/${paymentRef}/succeed` })).json()).toEqual({ handled: true });
    const seats = (await app.inject({ url: `/v1/seats?eventId=${eventId}`, headers: H() })).json().items;
    expect(seats).toHaveLength(2);
    expect(seats.map((s: { attendee: { email: string } }) => s.attendee.email)).toEqual(["a@corp.co.uk", "b@corp.co.uk"]);
    expect(seats[0].status).toBe("confirmed");

    const status = await app.inject(`/public/v1/orders/${order.json().order.id}?buyerEmail=lead@corp.co.uk`);
    expect(status.json().order.status).toBe("paid");
    expect((await app.inject(`/public/v1/orders/${order.json().order.id}?buyerEmail=other@x.co`)).statusCode).toBe(404);
    const ics = await app.inject(`/public/v1/seats/${seats[0].id}/calendar.ics`);
    expect(ics.statusCode).toBe(200);
    expect(ics.headers["content-type"]).toContain("text/calendar");
    expect(ics.body).toContain("BEGIN:VEVENT");
    expect(ics.body).toContain("DTSTART:20261120T140000Z");

    const ld = await app.inject(`/public/v1/organizations/${orgId}/courses/leading-safe/jsonld`);
    expect(ld.statusCode).toBe(200);
    expect(ld.headers["content-type"]).toContain("application/ld+json");
    expect(ld.json()["@type"]).toBe("Course");
    expect(ld.json().url).toBe("https://agile-agilist.com/training/leading-safe/");
    expect(ld.json().hasCourseInstance[0].offers).toMatchObject({ price: "1099.00", priceCurrency: "CAD" });
  });

  it("public routes 404 unknown courses and refuse unlisted currencies", async () => {
    expect((await app.inject(`/public/v1/organizations/${orgId}/courses/nope`)).statusCode).toBe(404);
    const course = (await app.inject({ method: "POST", url: "/v1/courses", headers: H(), payload: { slug: "popm", name: "POPM" } })).json();
    const cohort = (await app.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: H(), payload: { name: "POPM Dec", startsAt: "2026-12-01T09:00:00Z" } })).json();
    const tt = (await app.inject({ method: "POST", url: `/v1/events/${cohort.id}/ticket-types`, headers: H(), payload: { name: "Std", priceMinor: 100_000, quantity: 5 } })).json();
    const bad = await app.inject({ method: "POST", url: `/public/v1/organizations/${orgId}/orders`, headers: { "content-type": "application/json" }, payload: { ticketTypeId: tt.id, quantity: 1, buyerEmail: "x@y.co", currency: "AED" } });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error.hint).toContain("CAD");
  });
});

describe("corporate billing API", () => {
  it("corporate account -> invoice order with PO -> partial and final bank payments -> receivables report", async () => {
    const course = (await app.inject({ method: "POST", url: "/v1/courses", headers: H(), payload: { slug: "spc", name: "SAFe Practice Consultant" } })).json();
    const cohort = (await app.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: H(), payload: { name: "SPC Jan", startsAt: "2027-01-10T09:00:00-05:00", timezone: "America/Toronto" } })).json();
    const tt = (await app.inject({ method: "POST", url: `/v1/events/${cohort.id}/ticket-types`, headers: H(), payload: { name: "Std", priceMinor: 350_000, quantity: 20 } })).json();
    const acct = await app.inject({ method: "POST", url: "/v1/corporate-accounts", headers: H(), payload: { name: "Big Bank", billingEmail: "ap@bigbank.ca", address: { country: "CA", region: "ON", postalCode: "M5H 1A1" }, poRequired: true, netTermsDays: 45 } });
    expect(acct.statusCode).toBe(201);

    const missingPo = await app.inject({ method: "POST", url: "/v1/invoice-orders", headers: H(), payload: { corporateAccountId: acct.json().id, ticketTypeId: tt.id, quantity: 2 } });
    expect(missingPo.statusCode).toBe(400);
    expect(missingPo.json().error.hint).toContain("purchase order");

    const inv = await app.inject({ method: "POST", url: "/v1/invoice-orders", headers: { ...H(), "idempotency-key": "inv-1" }, payload: { corporateAccountId: acct.json().id, ticketTypeId: tt.id, quantity: 2, poNumber: "PO-77", attendees: [{ email: "a@bigbank.ca", name: "A" }, { email: "b@bigbank.ca", name: "B" }] } });
    expect(inv.statusCode).toBe(201);
    const invoice = inv.json().invoice;
    expect(invoice.number).toBe("INV-2026-0001");
    expect(invoice.taxMinor).toBe(91_000);
    expect(invoice.totalMinor).toBe(791_000);
    expect(invoice.dueAt).toBe("2026-11-29T12:00:00.000Z");
    expect(inv.json().order.paymentMethod).toBe("invoice");
    expect((await app.inject({ url: `/v1/seats?eventId=${cohort.id}`, headers: H() })).json().items.map((s: { status: string }) => s.status)).toEqual(["reserved", "reserved"]);

    const partial = await app.inject({ method: "POST", url: `/v1/invoices/${invoice.id}/payments`, headers: H(), payload: { amountMinor: 300_000, method: "wire", reference: "WIRE-1" } });
    expect(partial.json().status).toBe("partially_paid");
    const report = (await app.inject({ url: "/v1/reports/receivables?asOf=2027-01-15T00:00:00Z", headers: H() })).json();
    expect(report.byCurrency.CAD.d31_60).toBe(491_000);
    const final = await app.inject({ method: "POST", url: `/v1/invoices/${invoice.id}/payments`, headers: H(), payload: { amountMinor: 491_000, method: "bank_transfer" } });
    expect(final.json().status).toBe("paid");
    expect(final.json().payments).toHaveLength(2);
    expect((await app.inject({ url: `/v1/orders/${inv.json().order.id}`, headers: H() })).json().status).toBe("paid");
    expect((await app.inject({ url: `/v1/seats?eventId=${cohort.id}`, headers: H() })).json().items.every((s: { status: string }) => s.status === "confirmed")).toBe(true);
    const bal = (await app.inject({ url: "/v1/ledger/balances", headers: H() })).json().accounts;
    expect(bal.find((a: { code: string }) => a.code.includes(":tax_payable:")).balanceMinor).toBe(91_000);
    expect((await app.inject({ url: "/v1/invoices?status=paid", headers: H() })).json().items).toHaveLength(1);
  });

  it("card orders with a billing address are taxed; void works on unpaid invoices", async () => {
    const course = (await app.inject({ method: "POST", url: "/v1/courses", headers: H(), payload: { slug: "rte", name: "RTE" } })).json();
    const cohort = (await app.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: H(), payload: { name: "RTE Feb", startsAt: "2027-02-01T09:00:00-05:00" } })).json();
    const tt = (await app.inject({ method: "POST", url: `/v1/events/${cohort.id}/ticket-types`, headers: H(), payload: { name: "Std", priceMinor: 100_000, quantity: 5 } })).json();
    const taxed = await app.inject({ method: "POST", url: `/public/v1/organizations/${orgId}/orders`, headers: { "content-type": "application/json" }, payload: { ticketTypeId: tt.id, quantity: 1, buyerEmail: "x@y.ca", billingAddress: { country: "CA", region: "BC" } } });
    expect(taxed.json().order.pricing.taxMinor).toBe(12_000);
    const acct = (await app.inject({ method: "POST", url: "/v1/corporate-accounts", headers: H(), payload: { name: "Gov", billingEmail: "ap@gov.ca", address: { country: "CA", region: "ON" } } })).json();
    const inv = (await app.inject({ method: "POST", url: "/v1/invoice-orders", headers: H(), payload: { corporateAccountId: acct.id, ticketTypeId: tt.id, quantity: 4 } })).json();
    const voided = await app.inject({ method: "POST", url: `/v1/invoices/${inv.invoice.id}/void`, headers: H(), payload: { reason: "budget cut" } });
    expect(voided.json().status).toBe("void");
    expect((await app.inject({ url: `/v1/events/${cohort.id}/ticket-types`, headers: H() })).json().items[0].sold).toBe(1);
  });
});

describe("self-service and waitlist API", () => {
  it("learner substitutes, transfers (with fee payment) and cancels with the attendee email as credential; waitlist offers and claim", async () => {
    const course = (await app.inject({ method: "POST", url: "/v1/courses", headers: H(), payload: { slug: "popm2", name: "POPM" } })).json();
    const nov = (await app.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: H(), payload: { name: "Nov", startsAt: "2026-11-20T14:00:00Z", timezone: "America/Toronto" } })).json();
    const dec = (await app.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: H(), payload: { name: "Dec", startsAt: "2026-12-04T14:00:00Z", timezone: "America/Toronto" } })).json();
    const novTt = (await app.inject({ method: "POST", url: `/v1/events/${nov.id}/ticket-types`, headers: H(), payload: { name: "Standard", priceMinor: 100_000, quantity: 2 } })).json();
    await app.inject({ method: "POST", url: `/v1/events/${dec.id}/ticket-types`, headers: H(), payload: { name: "Standard", priceMinor: 120_000, quantity: 3 } });

    const ord = (await app.inject({ method: "POST", url: `/public/v1/organizations/${orgId}/orders`, headers: { "content-type": "application/json" }, payload: { ticketTypeId: novTt.id, quantity: 2, buyerEmail: "buyer@co.com", attendees: [{ email: "ada@co.com", name: "Ada" }, { email: "alan@co.com", name: "Alan" }] } })).json();
    await app.inject({ method: "POST", url: `/public/v1/dev/payments/${ord.order.paymentRef}/succeed` });
    const seats = (await app.inject({ url: `/v1/seats?eventId=${nov.id}`, headers: H() })).json().items;
    const ada = seats[0].id, alan = seats[1].id;

    // Options require the right email.
    expect((await app.inject(`/public/v1/seats/${ada}?email=someone@else.com`)).statusCode).toBe(404);
    const opts = (await app.inject(`/public/v1/seats/${ada}?email=ada@co.com`)).json();
    expect(opts.policy.transfer).toMatchObject({ allowed: true, feeMinor: 0 });
    expect(opts.policy.cancel).toMatchObject({ allowed: true, refundMinor: 100_000 });
    expect(opts.transferOptions[0]).toMatchObject({ eventId: dec.id, priceDeltaMinor: 20_000, feeMinor: 20_000, remaining: 3 });
    expect(opts.calendarUrl).toContain(`/public/v1/seats/${ada}/calendar.ics`);

    // Waitlist fills while sold out.
    const wl = await app.inject({ method: "POST", url: `/public/v1/organizations/${orgId}/waitlist`, headers: { "content-type": "application/json" }, payload: { eventId: nov.id, email: "w1@x.com", name: "W1" } });
    expect(wl.statusCode).toBe(201);
    expect(wl.json().entry).toMatchObject({ status: "waiting", position: 1 });
    expect((await app.inject({ method: "POST", url: `/public/v1/organizations/${orgId}/waitlist`, headers: { "content-type": "application/json" }, payload: { eventId: nov.id, email: "w1@x.com" } })).statusCode).toBe(409);

    // Substitute Alan -> Grace.
    const sub = await app.inject({ method: "POST", url: `/public/v1/seats/${alan}/substitute`, headers: { "content-type": "application/json" }, payload: { email: "alan@co.com", attendee: { email: "grace@co.com", name: "Grace" } } });
    expect(sub.json().seat.attendee.email).toBe("grace@co.com");
    expect(sub.json().seat.substitutions).toHaveLength(1);

    // Transfer Ada to Dec: $20 difference -> pending payment -> simulate -> moved; W1 gets the freed Nov seat.
    const xfer = await app.inject({ method: "POST", url: `/public/v1/seats/${ada}/transfer`, headers: { "content-type": "application/json" }, payload: { email: "ada@co.com", toEventId: dec.id } });
    expect(xfer.json().transfer).toMatchObject({ status: "pending_payment", feeMinor: 20_000 });
    expect(xfer.json().seat).toBeNull();
    await app.inject({ method: "POST", url: `/public/v1/dev/payments/${xfer.json().transfer.paymentRef}/succeed` });
    const adaAfter = (await app.inject(`/public/v1/seats/${ada}?email=ada@co.com`)).json();
    expect(adaAfter.seat.status).toBe("transferred");
    expect(adaAfter.seat.transferredToSeatId).toBeTruthy();
    const moved = (await app.inject(`/public/v1/seats/${adaAfter.seat.transferredToSeatId}?email=ada@co.com`)).json();
    expect(moved.event.id).toBe(dec.id);
    const waiting = (await app.inject({ url: `/v1/events/${nov.id}/waitlist`, headers: H() })).json().items;
    expect(waiting[0]).toMatchObject({ email: "w1@x.com", status: "offered" });

    // W1 claims the held seat.
    const claim = await app.inject({ method: "POST", url: `/public/v1/organizations/${orgId}/orders`, headers: { "content-type": "application/json" }, payload: { ticketTypeId: novTt.id, quantity: 1, buyerEmail: "w1@x.com", waitlistEntryId: waiting[0].id } });
    expect(claim.statusCode).toBe(201);

    // Grace cancels inside the 50% window.
    const cancel = await app.inject({ method: "POST", url: `/public/v1/seats/${alan}/cancel`, headers: { "content-type": "application/json" }, payload: { email: "grace@co.com", reason: "conflict" } });
    expect(cancel.json().seat.status).toBe("cancelled");
    expect(cancel.json().refund.amountMinor).toBe(100_000);

    // Organizer policy update and expire endpoint.
    const policy = (await app.inject({ url: "/v1/policy", headers: H() })).json();
    expect(policy.transferFreeUntilDays).toBe(7);
    const put = await app.inject({ method: "PUT", url: `/v1/policy?courseId=${course.id}`, headers: H(), payload: { ...policy, transferFeeBps: 2_500 } });
    expect(put.json().transferFeeBps).toBe(2_500);
    expect((await app.inject({ url: `/v1/policy?courseId=${course.id}`, headers: H() })).json().transferFeeBps).toBe(2_500);
    expect((await app.inject({ method: "POST", url: "/v1/waitlist/expire", headers: { "x-api-key": apiKey } })).json()).toEqual({ expired: [] });
  });
});

describe("delivery API", () => {
  it("course delivery settings, manual meeting, attendance, certificates with public verify/view, roster formats, messages, sequences", async () => {
    const course = (await app.inject({ method: "POST", url: "/v1/courses", headers: H(), payload: { slug: "deliver", name: "Delivery 101" } })).json();
    const patched = await app.inject({ method: "PATCH", url: `/v1/courses/${course.id}`, headers: H(), payload: { prework: "Read the guide", surveyUrl: "https://forms.example/x" } });
    expect(patched.json()).toMatchObject({ prework: "Read the guide", surveyUrl: "https://forms.example/x" });
    const cleared = await app.inject({ method: "PATCH", url: `/v1/courses/${course.id}`, headers: H(), payload: { surveyUrl: null } });
    expect(cleared.json().surveyUrl).toBeNull();

    const ev = (await app.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: H(), payload: { name: "Soon", timezone: "America/Toronto", sessions: [{ startsAt: "2026-10-20T13:00:00Z", endsAt: "2026-10-20T21:00:00Z" }] } })).json();
    const tt = (await app.inject({ method: "POST", url: `/v1/events/${ev.id}/ticket-types`, headers: H(), payload: { name: "Std", priceMinor: 10_000, quantity: 5 } })).json();
    const ord = (await app.inject({ method: "POST", url: "/v1/orders", headers: H(), payload: { ticketTypeId: tt.id, quantity: 2, buyerEmail: "b@co.com", attendees: [{ email: "ada@co.com", name: "Ada Lovelace" }, { email: "alan@co.com", name: "Alan Turing" }] } })).json();
    await app.inject({ method: "POST", url: `/v1/dev/payments/${ord.order.paymentRef}/succeed`, headers: { "x-api-key": apiKey } });

    expect((await app.inject({ method: "POST", url: `/v1/events/${ev.id}/meeting`, headers: H(), payload: { provider: "zoom" } })).statusCode).toBe(409);
    const meeting = await app.inject({ method: "POST", url: `/v1/events/${ev.id}/meeting`, headers: H(), payload: { provider: "manual", joinUrl: "https://meet.example/abc", passcode: "123" } });
    expect(meeting.json().meeting).toMatchObject({ provider: "manual", joinUrl: "https://meet.example/abc", passcode: "123", hostUrl: null });
    expect((await app.inject({ method: "POST", url: `/v1/events/${ev.id}/attendance/sync`, headers: { "x-api-key": apiKey } })).statusCode).toBe(409);

    const att = (await app.inject({ url: `/v1/events/${ev.id}/attendance`, headers: H() })).json().items;
    expect(att).toHaveLength(2);
    expect(att[0]).toMatchObject({ status: "unknown", source: "none" });
    const marked = await app.inject({ method: "POST", url: `/v1/events/${ev.id}/attendance`, headers: H(), payload: { seatId: att[0].seatId, status: "present", minutes: 470 } });
    expect(marked.json()).toMatchObject({ status: "present", minutes: 470, source: "manual" });

    const issued = (await app.inject({ method: "POST", url: `/v1/events/${ev.id}/certificates`, headers: H(), payload: { onlyPresent: true } })).json().issued;
    expect(issued).toHaveLength(1);
    expect(issued[0].attendeeName).toBe("Ada Lovelace");
    expect(issued[0].viewUrl).toContain(`/cert/${issued[0].verifyCode}`);
    expect(issued[0]).toMatchObject({ kind: "completion" });
    const verify = await app.inject(`/public/v1/certificates/${issued[0].verifyCode}`);
    expect(verify.json()).toMatchObject({ valid: true, attendeeName: "Ada Lovelace", courseName: "Delivery 101", organization: "Agile Agilist" });
    const view = await app.inject(`/public/v1/certificates/${issued[0].verifyCode}/view`);
    expect(view.statusCode).toBe(200);
    expect(view.body).toContain("Certificate of Completion");
    expect((await app.inject(`/public/v1/certificates/bogus/view`)).statusCode).toBe(404);
    expect((await app.inject({ url: `/v1/events/${ev.id}/certificates`, headers: H() })).json().items).toHaveLength(1);
    // Attendance certificates for everyone else, and a Credly badge shown with them.
    const attCerts = (await app.inject({ method: "POST", url: `/v1/events/${ev.id}/certificates`, headers: H(), payload: { kind: "attendance" } })).json().issued;
    expect(attCerts.every((c: { kind: string }) => c.kind === "attendance")).toBe(true);
    const badge = { platform: "credly", name: "Leading SAFe Agilist", url: "https://www.credly.com/org/scaled-agile/badge/x", imageUrl: "https://images.credly.com/x.png" };
    const bad = await app.inject({ method: "PATCH", url: `/v1/courses/${ev.courseId}`, headers: H(), payload: { badge: { ...badge, url: "http://insecure" } } });
    expect(bad.statusCode).toBe(400);
    expect((await app.inject({ method: "PATCH", url: `/v1/courses/${ev.courseId}`, headers: H(), payload: { badge } })).json().badge).toEqual(badge);
    expect((await app.inject(`/public/v1/certificates/${issued[0].verifyCode}`)).json()).toMatchObject({ valid: true, kind: "completion", badge });
    expect((await app.inject({ method: "PATCH", url: `/v1/courses/${ev.courseId}`, headers: H(), payload: { badge: null } })).json().badge).toBeNull();

    const csv = await app.inject({ url: `/v1/events/${ev.id}/roster.csv?format=safe_studio`, headers: H() });
    expect(csv.headers["content-type"]).toContain("text/csv");
    expect(csv.body.split("\r\n")[0]).toBe('"First Name","Last Name","Email","Company"');
    expect((await app.inject({ url: `/v1/events/${ev.id}/roster.csv?format=nope`, headers: H() })).statusCode).toBe(400);

    // Clock is 2026-10-15 12:00; cohort on Oct 20: prework (T-14) and the T-7 reminder are due, T-1 is not.
    const run = (await app.inject({ method: "POST", url: "/v1/sequences/run", headers: { "x-api-key": apiKey } })).json();
    expect(run.sent).toBe(4);
    const msgs = (await app.inject({ url: `/v1/events/${ev.id}/messages`, headers: H() })).json().items;
    expect(msgs.map((m: { step: string }) => m.step)).toEqual(["prework_t14", "prework_t14", "reminder_t7", "reminder_t7"]);
    expect((await app.inject({ method: "POST", url: "/v1/sequences/run", headers: { "x-api-key": apiKey } })).json().sent).toBe(0);
  });
});

describe("money API", () => {
  it("on-delivery release, instructor fees, payables, payouts, revenue report, min-enrolment review and cancellation", async () => {
    const orgRes = await app.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "Hold Org", country: "CA", currency: "CAD" } });
    const key = orgRes.json().apiKey;
    const HH = { "x-api-key": key, "content-type": "application/json" };
    expect(orgRes.json().organization.releasePolicy).toBe("on_delivery");
    const instructor = (await app.inject({ method: "POST", url: "/v1/parties", headers: HH, payload: { name: "Jane", kind: "instructor" } })).json();
    const course = (await app.inject({ method: "POST", url: "/v1/courses", headers: HH, payload: { slug: "ls", name: "LS" } })).json();
    const ev = (await app.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: HH, payload: { name: "Oct 18", sessions: [{ startsAt: "2026-10-18T13:00:00Z", endsAt: "2026-10-18T21:00:00Z" }], minEnrollment: 5 } })).json();
    const fees = await app.inject({ method: "PUT", url: `/v1/events/${ev.id}/instructor-fees`, headers: HH, payload: { fees: [{ partyId: instructor.id, amountMinor: 40_000 }] } });
    expect(fees.json().instructorFees).toEqual([{ partyId: instructor.id, amountMinor: 40_000 }]);
    const tt = (await app.inject({ method: "POST", url: `/v1/events/${ev.id}/ticket-types`, headers: HH, payload: { name: "Std", priceMinor: 100_000, quantity: 10 } })).json();
    const ord = (await app.inject({ method: "POST", url: "/v1/orders", headers: HH, payload: { ticketTypeId: tt.id, quantity: 2, buyerEmail: "b@co.com" } })).json();
    await app.inject({ method: "POST", url: `/v1/dev/payments/${ord.order.paymentRef}/succeed`, headers: { "x-api-key": key } });
    const paid = (await app.inject({ url: `/v1/orders/${ord.order.id}`, headers: HH })).json();
    expect(paid.fundsStatus).toBe("held");
    expect(paid.heldMinor).toBe(200_000 - 9_980);

    let payables = (await app.inject({ url: "/v1/reports/payables", headers: HH })).json().items;
    expect(payables).toEqual([expect.objectContaining({ partyId: null, name: "Hold Org", payableMinor: 0, heldMinor: 200_000 - 9_980 })]);
    expect((await app.inject({ method: "POST", url: "/v1/payouts", headers: HH, payload: { currency: "CAD", amountMinor: 100, method: "wire" } })).statusCode).toBe(400);

    // Minimum-enrolment review: 2 of 5 seats, cohort in 3 days -> at risk.
    const review = (await app.inject({ method: "POST", url: "/v1/jobs/review-min-enrollment", headers: { "x-api-key": key } })).json();
    expect(review.flagged.map((e: { id: string }) => e.id)).toEqual([ev.id]);
    expect((await app.inject({ url: `/v1/events/${ev.id}`, headers: HH })).json().atRiskAt).toBeTruthy();

    // Organizer decides to run it anyway: release manually after delivery (clock is before the end, so the job releases nothing yet).
    expect((await app.inject({ method: "POST", url: "/v1/jobs/release", headers: { "x-api-key": key } })).json().orders).toBe(0);
    const released = (await app.inject({ method: "POST", url: `/v1/events/${ev.id}/release`, headers: { "x-api-key": key } })).json();
    expect(released).toEqual({ released: 1, amountMinor: 200_000 - 9_980 });
    payables = (await app.inject({ url: "/v1/reports/payables", headers: HH })).json().items;
    expect(payables.find((p: { partyId: string | null }) => p.partyId === instructor.id)).toMatchObject({ name: "Jane", kind: "instructor", payableMinor: 40_000, heldMinor: 0 });
    expect(payables.find((p: { partyId: string | null }) => p.partyId === null)).toMatchObject({ payableMinor: 200_000 - 9_980 - 40_000, heldMinor: 0 });

    const payout = await app.inject({ method: "POST", url: "/v1/payouts", headers: HH, payload: { partyId: instructor.id, currency: "CAD", amountMinor: 40_000, method: "bank_transfer", reference: "ET-1" } });
    expect(payout.statusCode).toBe(201);
    expect((await app.inject({ url: "/v1/payouts", headers: HH })).json().items).toHaveLength(1);

    const report = (await app.inject({ url: "/v1/reports/revenue?from=2026-10-01T00:00:00Z&to=2026-10-31T00:00:00Z", headers: HH })).json();
    expect(report.cohorts[0]).toMatchObject({ eventId: ev.id, seats: 2, grossMinor: 200_000, instructorFeesMinor: 40_000, fundsStatus: "released", recognized: true });
    expect(report.byCurrency.CAD.recognizedMinor).toBe(200_000 - 9_980 - 40_000);

    // Settings and cancellation of a second cohort with refunds.
    const settings = await app.inject({ method: "PATCH", url: "/v1/organizations/me", headers: HH, payload: { releaseGraceHours: 48, minEnrollmentDecisionDays: 10 } });
    expect(settings.json()).toMatchObject({ releaseGraceHours: 48, minEnrollmentDecisionDays: 10 });
    const ev2 = (await app.inject({ method: "POST", url: `/v1/courses/${course.id}/cohorts`, headers: HH, payload: { name: "Nov", startsAt: "2026-11-20T14:00:00Z" } })).json();
    const tt2 = (await app.inject({ method: "POST", url: `/v1/events/${ev2.id}/ticket-types`, headers: HH, payload: { name: "Std", priceMinor: 100_000, quantity: 10 } })).json();
    const ord2 = (await app.inject({ method: "POST", url: "/v1/orders", headers: HH, payload: { ticketTypeId: tt2.id, quantity: 1, buyerEmail: "c@co.com" } })).json();
    await app.inject({ method: "POST", url: `/v1/dev/payments/${ord2.order.paymentRef}/succeed`, headers: { "x-api-key": key } });
    const cancel = await app.inject({ method: "POST", url: `/v1/events/${ev2.id}/cancel`, headers: HH, payload: { reason: "instructor unavailable" } });
    expect(cancel.json()).toMatchObject({ refunded: 1, transferred: 0, voided: 0 });
    expect(cancel.json().event).toMatchObject({ status: "cancelled", cancelReason: "instructor unavailable" });
    expect((await app.inject({ url: `/v1/orders/${ord2.order.id}`, headers: HH })).json().status).toBe("refunded");
  });
});
