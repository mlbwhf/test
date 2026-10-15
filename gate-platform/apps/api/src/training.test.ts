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
  const res = await app.inject({ method: "POST", url: "/v1/organizations", headers: { "x-admin-key": "admin", "content-type": "application/json" }, payload: { name: "Agile Agilist", country: "CA", currency: "CAD" } });
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
