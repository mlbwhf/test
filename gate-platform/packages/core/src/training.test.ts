import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";
import { courseJsonLd } from "./jsonld.js";

let core: Core;
let payments: FakePaymentsAdapter;
let now = new Date("2026-10-15T12:00:00Z");

beforeEach(() => {
  payments = new FakePaymentsAdapter();
  now = new Date("2026-10-15T12:00:00Z");
  core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments, clock: { now: () => now } });
});

async function leadingSafe() {
  const { organization: org } = await core.createOrganization({ releasePolicy: "immediate", name: "Agile Agilist", country: "CA", currency: "CAD" });
  const instructor = await core.createParty(org.id, { name: "John", kind: "instructor" });
  const course = await core.createCourse(org.id, { slug: "leading-safe", name: "Leading SAFe (SAFe Agilist)", certificationBody: "Scaled Agile", durationDays: 2 });
  const cohort = await core.createEvent(org.id, {
    courseId: course.id, name: "Leading SAFe — Nov 20-21 (ET)", timezone: "America/Toronto", format: "live_virtual", instructorIds: [instructor.id], minEnrollment: 4,
    sessions: [
      { startsAt: new Date("2026-11-20T14:00:00Z"), endsAt: new Date("2026-11-20T22:00:00Z"), title: "Day 1" },
      { startsAt: new Date("2026-11-21T14:00:00Z"), endsAt: new Date("2026-11-21T22:00:00Z"), title: "Day 2" },
    ],
  });
  const ticket = await core.createTicketType(org.id, cohort.id, {
    name: "Standard", priceMinor: 129_900, quantity: 12,
    prices: { USD: 99_900, GBP: 79_900, EUR: 89_900 },
    earlyBird: { until: new Date("2026-11-01T00:00:00Z"), priceMinor: 109_900, prices: { USD: 84_900, GBP: 69_900 } },
  });
  return { org, instructor, course, cohort, ticket };
}

describe("courses and cohorts", () => {
  it("creates a course and a cohort with sessions, time zone, instructor and derived start/end", async () => {
    const { cohort, course, instructor } = await leadingSafe();
    expect(cohort.courseId).toBe(course.id);
    expect(cohort.startsAt.toISOString()).toBe("2026-11-20T14:00:00.000Z");
    expect(cohort.endsAt?.toISOString()).toBe("2026-11-21T22:00:00.000Z");
    expect(cohort.timezone).toBe("America/Toronto");
    expect(cohort.instructorIds).toEqual([instructor.id]);
    expect(cohort.sessions).toHaveLength(2);
  });
  it("validates slugs, time zones, instructors and sessions", async () => {
    const { org, course } = await leadingSafe();
    await expect(core.createCourse(org.id, { slug: "Leading SAFe", name: "x" })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(core.createCourse(org.id, { slug: "leading-safe", name: "dup" })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(core.createEvent(org.id, { name: "x", startsAt: now, timezone: "Mars/Olympus" })).rejects.toMatchObject({ code: "VALIDATION" });
    const venue = await core.createParty(org.id, { name: "Hall", kind: "venue" });
    await expect(core.createEvent(org.id, { name: "x", startsAt: now, instructorIds: [venue.id] })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(core.createEvent(org.id, { name: "x", courseId: course.id, sessions: [{ startsAt: now, endsAt: now }] })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(core.createEvent(org.id, { name: "x" })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("regional price lists and early bird", () => {
  it("resolves early-bird then list price per currency, and refuses unlisted currencies", async () => {
    const { org, cohort, ticket } = await leadingSafe();
    expect(core.resolveUnitPrice(ticket, cohort, "CAD")).toBe(109_900);
    expect(core.resolveUnitPrice(ticket, cohort, "USD")).toBe(84_900);
    expect(core.resolveUnitPrice(ticket, cohort, "EUR")).toBe(89_900); // no early-bird EUR: falls back to list
    now = new Date("2026-11-02T00:00:00Z");
    expect(core.resolveUnitPrice(ticket, cohort, "CAD")).toBe(129_900);
    expect(core.resolveUnitPrice(ticket, cohort, "GBP")).toBe(79_900);
    expect(() => core.resolveUnitPrice(ticket, cohort, "AED")).toThrow(/not sold in AED/);
    await expect(core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "a@b.co", currency: "AED" })).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("sells the same cohort in CAD and GBP from one record and settles each into its own currency books", async () => {
    const { org, ticket } = await leadingSafe();
    const cad = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "cad@b.co" });
    const gbp = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 2, buyerEmail: "uk@b.co", currency: "GBP", attendees: [{ email: "one@uk.co", name: "One" }, { email: "two@uk.co", name: "Two" }] });
    expect(cad.order.currency).toBe("CAD");
    expect(cad.order.pricing.totalMinor).toBe(109_900);
    expect(gbp.order.currency).toBe("GBP");
    expect(gbp.order.pricing.unitPriceMinor).toBe(69_900);
    expect(gbp.order.pricing.perTicketFeeMinor).toBe(2_726 + 50); // 3.9% + £0.50
    await core.handlePaymentEvent(payments.succeed(cad.order.paymentRef!, cad.order.pricing.totalMinor, "CAD"));
    await core.handlePaymentEvent(payments.succeed(gbp.order.paymentRef!, gbp.order.pricing.totalMinor, "GBP"));
    const bal = await core.balancesFor(org.id);
    expect(bal.find((b) => b.currency === "CAD")?.balanceMinor).toBe(109_900 - 5_475);
    expect(bal.find((b) => b.currency === "GBP")?.balanceMinor).toBe(139_800 - 2 * 2_776);
    await core.ledger.assertBalanced();
    expect((await core.listTicketTypes(org.id, ticket.eventId))[0]?.sold).toBe(3);
  });
});

describe("seats", () => {
  it("creates one confirmed seat per attendee on payment, defaulting to the buyer", async () => {
    const { org, ticket, cohort } = await leadingSafe();
    const { order } = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 3, buyerEmail: "buyer@co.com", attendees: [{ email: "a@co.com", name: "A" }] });
    expect(order.attendees).toEqual([{ email: "a@co.com", name: "A" }, { email: "buyer@co.com" }, { email: "buyer@co.com" }]);
    expect(await core.listSeats(org.id, { orderId: order.id })).toHaveLength(0);
    await core.handlePaymentEvent(payments.succeed(order.paymentRef!, order.pricing.totalMinor, "CAD"));
    const seats = await core.listSeats(org.id, { eventId: cohort.id });
    expect(seats).toHaveLength(3);
    expect(seats.every((s) => s.status === "confirmed")).toBe(true);
    expect(seats[0]?.attendee).toEqual({ email: "a@co.com", name: "A" });
  });
  it("cancels seats and releases inventory on a full refund", async () => {
    const { org, ticket } = await leadingSafe();
    const { order } = await core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 2, buyerEmail: "buyer@co.com" });
    await core.handlePaymentEvent(payments.succeed(order.paymentRef!, order.pricing.totalMinor, "CAD"));
    await core.refundOrder(org.id, { orderId: order.id, reason: "cancelled" });
    const seats = await core.listSeats(org.id, { orderId: order.id });
    expect(seats.map((s) => s.status)).toEqual(["cancelled", "cancelled"]);
    expect((await core.listTicketTypes(org.id, ticket.eventId))[0]?.sold).toBe(0);
  });
  it("rejects more attendees than seats and bad attendee emails", async () => {
    const { org, ticket } = await leadingSafe();
    await expect(core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "b@c.co", attendees: [{ email: "a@c.co" }, { email: "d@c.co" }] })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(core.createOrder(org.id, { ticketTypeId: ticket.id, quantity: 1, buyerEmail: "b@c.co", attendees: [{ email: "nope" }] })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("public catalogue and JSON-LD", () => {
  it("exposes live future cohorts with resolved prices per currency", async () => {
    const { org, course, cohort } = await leadingSafe();
    const past = await core.createEvent(org.id, { courseId: course.id, name: "Past", startsAt: new Date("2026-01-01T00:00:00Z") });
    await core.createTicketType(org.id, past.id, { name: "x", priceMinor: 1, quantity: 1 });
    const pub = await core.publicCourse(org.id, "leading-safe");
    expect(pub.course.slug).toBe("leading-safe");
    expect(pub.cohorts.map((c) => c.event.id)).toEqual([cohort.id]);
    const tt = pub.cohorts[0]!.ticketTypes[0]!;
    expect(tt.prices).toEqual({ CAD: 109_900, USD: 84_900, GBP: 69_900, EUR: 89_900 });
    expect(tt.remaining).toBe(12);
    expect(tt.earlyBirdUntil?.toISOString()).toBe("2026-11-01T00:00:00.000Z");
    await expect(core.publicCourse(org.id, "nope")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("builds schema.org Course + CourseInstance", async () => {
    const { org, course, cohort } = await leadingSafe();
    const doc = courseJsonLd({ organization: org, course, pageUrl: "https://agile-agilist.com/training/safe/sa/", cohorts: [{ event: cohort, priceMinor: 109_900, currency: "CAD", remaining: 12 }] });
    expect(doc["@type"]).toBe("Course");
    const inst = (doc.hasCourseInstance as Array<Record<string, unknown>>)[0]!;
    expect(inst["@type"]).toBe("CourseInstance");
    expect(inst.courseMode).toBe("online");
    expect(inst.startDate).toBe("2026-11-20T14:00:00.000Z");
    expect(inst.offers).toMatchObject({ price: "1099.00", priceCurrency: "CAD", availability: "https://schema.org/InStock" });
    expect((inst.courseSchedule as Record<string, unknown>).scheduleTimezone).toBe("America/Toronto");
  });
});
