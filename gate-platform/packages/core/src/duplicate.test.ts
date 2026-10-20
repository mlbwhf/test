import { describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";
import { shiftDays } from "./zoned.js";

const at = (iso: string) => new Date(iso);

async function setup() {
  const now = at("2026-10-01T12:00:00Z");
  const payments = new FakePaymentsAdapter();
  const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments, clock: { now: () => now } });
  const { organization: org } = await core.createOrganization({ name: "Agile Agilist", country: "CA", currency: "CAD" });
  await core.connectPayments(org.id);
  const course = await core.createCourse(org.id, { slug: "rte", name: "RTE" });
  const instructor = await core.createParty(org.id, { name: "Pat", kind: "instructor" });
  // Oct 26-27, 2026, 9:00-17:00 Toronto (EDT, UTC-4).
  const src = await core.createEvent(org.id, {
    name: "RTE late October", courseId: course.id, timezone: "America/Toronto", format: "live_virtual", minEnrollment: 6, instructorIds: [instructor.id],
    sessions: [26, 27].map((d) => ({ startsAt: at(`2026-10-${d}T13:00:00Z`), endsAt: at(`2026-10-${d}T21:00:00Z`) })),
  });
  const tt = await core.createTicketType(org.id, src.id, { name: "Standard", priceMinor: 120_000, quantity: 20, prices: { USD: 90_000 }, earlyBird: { until: at("2026-10-10T00:00:00Z"), priceMinor: 100_000 } });
  const { order } = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 2, buyerEmail: "a@x.co" });
  await core.handlePaymentEvent(payments.succeed(order.paymentRef!, order.pricing.totalMinor, "CAD"));
  return { core, org, src, instructor };
}

describe("duplicate event", () => {
  it("copies on the same dates with tickets reset to nothing sold", async () => {
    const { core, org, src, instructor } = await setup();
    const { event, ticketTypes } = await core.duplicateEvent(org.id, src.id);
    expect(event.id).not.toBe(src.id);
    expect(event.sessions.map((s) => s.startsAt.toISOString())).toEqual(src.sessions.map((s) => s.startsAt.toISOString()));
    expect(event).toMatchObject({ name: "RTE late October", courseId: src.courseId, timezone: "America/Toronto", minEnrollment: 6, instructorIds: [instructor.id], status: "live" });
    expect(ticketTypes).toHaveLength(1);
    expect(ticketTypes[0]).toMatchObject({ name: "Standard", priceMinor: 120_000, quantity: 20, sold: 0, prices: { USD: 90_000 } });
    expect(ticketTypes[0]!.earlyBird?.until.toISOString()).toBe("2026-10-10T00:00:00.000Z");
  });

  it("moves to a new first day keeping local times across the DST change, and drops a closed early bird", async () => {
    const { core, org, src } = await setup();
    // Nov 9-10 is after Toronto's switch to EST (UTC-5): 9:00 local is 14:00Z.
    const { event, ticketTypes } = await core.duplicateEvent(org.id, src.id, { startDate: "2026-11-09", name: "RTE November" });
    expect(event.name).toBe("RTE November");
    expect(event.sessions.map((s) => s.startsAt.toISOString())).toEqual(["2026-11-09T14:00:00.000Z", "2026-11-10T14:00:00.000Z"]);
    expect(event.endsAt!.toISOString()).toBe("2026-11-10T22:00:00.000Z");
    expect(ticketTypes[0]!.earlyBird?.until.toISOString()).toBe("2026-10-24T00:00:00.000Z");
    const back = await core.duplicateEvent(org.id, src.id, { startDate: "2026-09-01" });
    expect((await core.listTicketTypes(org.id, back.event.id))[0]!.earlyBird).toBeUndefined();
    await expect(core.duplicateEvent(org.id, src.id, { startDate: "Nov 9" })).rejects.toThrow(/YYYY-MM-DD/);
  });

  it("shifts wall-clock time by calendar days", () => {
    expect(shiftDays(at("2026-03-07T14:00:00Z"), 1, "America/Toronto").toISOString()).toBe("2026-03-08T13:00:00.000Z");
  });
});
