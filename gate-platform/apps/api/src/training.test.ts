import { beforeEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { Core, FakePaymentsAdapter, createInMemoryRepos } from "@gate/core";
import { buildApp } from "./app.js";

let app: FastifyInstance;
let apiKey: string;
let orgId: string;
const H = () => ({ "x-api-key": apiKey, "content-type": "application/json" });

beforeEach(async () => {
  const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter(), clock: { now: () => new Date("2026-10-15T12:00:00Z") } });
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
