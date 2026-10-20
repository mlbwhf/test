import { describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";
import { homeSummary } from "./home.js";

const NOW = new Date("2026-10-21T15:00:00Z"); // 11:00 in Toronto
const at = (iso: string) => new Date(iso);

async function scenario() {
  let now = at("2026-10-01T12:00:00Z");
  const payments = new FakePaymentsAdapter();
  const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments, clock: { now: () => now } });
  const { organization: org } = await core.createOrganization({ name: "Agile Agilist", country: "CA", currency: "USD", releasePolicy: "on_delivery" });
  await core.connectPayments(org.id);
  const course = await core.createCourse(org.id, { slug: "rte", name: "RTE" });
  const sell = async (eventId: string, ttId: string, n: number) => {
    for (let i = 0; i < n; i++) {
      const { order } = await core.createOrder(org.id, { ticketTypeId: ttId, quantity: 1, buyerEmail: `b${eventId}${i}@x.co`, attendees: [{ email: `a${eventId}${i}@x.co`, name: `A ${i}` }] });
      await core.handlePaymentEvent(payments.succeed(order.paymentRef!, order.pricing.totalMinor, "USD"));
    }
  };
  // Delivered last week, money still held.
  const past = await core.createEvent(org.id, { name: "Security Awareness", courseId: course.id, timezone: "America/Toronto", sessions: [{ startsAt: at("2026-10-14T13:00:00Z"), endsAt: at("2026-10-14T21:00:00Z") }] });
  const pastTt = await core.createTicketType(org.id, past.id, { name: "Seat", priceMinor: 50_000, quantity: 10 });
  await sell(past.id, pastTt.id, 2);
  // Running today (day 2 of 3), 3 confirmed, 2 checked in.
  const liveEv = await core.createEvent(org.id, { name: "RTE October", courseId: course.id, timezone: "America/Toronto", sessions: [20, 21, 22].map((d) => ({ startsAt: at(`2026-10-${d}T13:00:00Z`), endsAt: at(`2026-10-${d}T21:00:00Z`) })) });
  const liveTt = await core.createTicketType(org.id, liveEv.id, { name: "Seat", priceMinor: 90_000, quantity: 20 });
  await sell(liveEv.id, liveTt.id, 3);
  // Next week, under its minimum.
  const low = await core.createEvent(org.id, { name: "Bootcamp", courseId: course.id, minEnrollment: 8, timezone: "America/Toronto", sessions: [{ startsAt: at("2026-10-26T13:00:00Z"), endsAt: at("2026-10-26T21:00:00Z") }] });
  const lowTt = await core.createTicketType(org.id, low.id, { name: "Seat", priceMinor: 10_000, quantity: 12 });
  await sell(low.id, lowTt.id, 3);
  // In ten days, nothing to buy yet.
  await core.createEvent(org.id, { name: "Empty one", startsAt: at("2026-10-31T13:00:00Z") });
  now = NOW;
  const seats = (await core.listSeats(org.id, { eventId: liveEv.id })).filter((s) => s.status === "confirmed");
  await core.checkIn(org.id, seats[0]!.id);
  await core.checkIn(org.id, seats[1]!.id);
  return { core, org, past, liveEv, low };
}

describe("home summary", () => {
  it("builds Today for a manager: money, attention with actions, live cohort, this week, setup", async () => {
    const { core, org, past, liveEv, low } = await scenario();
    const h = await homeSummary(core, org.id, { money: true, settings: true, now: NOW });
    expect(h.money![0]).toMatchObject({ currency: "USD", paidOrders: 8 });
    expect(h.money![0]!.heldMinor).toBeGreaterThan(0);
    const kinds = h.attention.map((a) => a.kind);
    expect(kinds).toContain("release_ready");
    expect(kinds).toContain("low_enrolment");
    expect(kinds).toContain("missing_prework");
    expect(kinds).toContain("no_tickets");
    expect(kinds).not.toContain("payments_setup");
    expect(h.attention.find((a) => a.kind === "release_ready")!.action).toEqual({ label: "Release", kind: "release", eventId: past.id });
    expect(h.attention.find((a) => a.kind === "low_enrolment")!.detail).toBe("Starts in 5 days · 3 of 8 needed");
    expect(h.attention.find((a) => a.kind === "low_enrolment")!.action).toMatchObject({ kind: "link", href: `/events/${low.id}` });
    expect(h.live).toMatchObject({ eventId: liveEv.id, day: 2, days: 3, confirmed: 3, checkedIn: 2, capacity: 20, sold: 3 });
    expect(h.week.map((w) => w.name)).toEqual(["Bootcamp"]);
    expect(h.setup).toMatchObject({ done: 5, total: 5 });
  });

  it("gives an instructor the classes view without money", async () => {
    const { core, org } = await scenario();
    const h = await homeSummary(core, org.id, { money: false, settings: false, now: NOW });
    expect(h.money).toBeNull();
    expect(h.attention.map((a) => a.kind).sort()).toEqual(["low_enrolment", "missing_prework", "no_tickets"]);
    expect(h.setup.steps.find((s) => s.key === "registration")!.done).toBe(true);
  });
});
