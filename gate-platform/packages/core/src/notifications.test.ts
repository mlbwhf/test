import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";
import { buildIcs } from "./ics.js";
import { InMemoryNotifier, confirmationHook, formatRange } from "./notifications.js";
import type { OrderPaidContext, OrderRefundedContext } from "./hooks.js";

describe("buildIcs", () => {
  it("emits one VEVENT per session with UTC stamps, escaping and folding", () => {
    const ics = buildIcs({
      uid: "seat-1", summary: "Leading SAFe; day one, two", attendeeEmail: "a@b.co", now: new Date("2026-10-15T12:00:00Z"),
      description: "x".repeat(120),
      sessions: [
        { startsAt: new Date("2026-11-20T14:00:00Z"), endsAt: new Date("2026-11-20T22:00:00Z"), title: "Day 1" },
        { startsAt: new Date("2026-11-21T14:00:00Z"), endsAt: new Date("2026-11-21T22:00:00Z") },
      ],
    });
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain("DTSTART:20261120T140000Z");
    expect(ics).toContain("UID:seat-1-2@gate");
    expect(ics).toContain("SUMMARY:Leading SAFe\; day one\\, two — Day 1");
    expect(ics).toContain("ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:a@b.co");
    for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    expect(ics).toContain("\r\n x");
  });
  it("falls back to a single event when there are no sessions", () => {
    const ics = buildIcs({ uid: "s", summary: "Course", sessions: [], fallback: { startsAt: new Date("2026-01-01T09:00:00Z"), endsAt: new Date("2026-01-01T17:00:00Z") } });
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });
  it("formats ranges in the cohort time zone", () => {
    expect(formatRange(new Date("2026-11-20T14:00:00Z"), new Date("2026-11-20T22:00:00Z"), "America/Toronto")).toMatch(/Nov\.? 20, 2026 9:00 a\.m\.–5:00 p\.m\./);
  });
});

describe("confirmation hook through Core", () => {
  let core: Core;
  let payments: FakePaymentsAdapter;
  let notifier: InMemoryNotifier;
  const paidCtx: OrderPaidContext[] = [];
  const refundCtx: OrderRefundedContext[] = [];
  beforeEach(() => {
    payments = new FakePaymentsAdapter();
    notifier = new InMemoryNotifier();
    paidCtx.length = 0; refundCtx.length = 0;
    core = new Core({
      repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments,
      clock: { now: () => new Date("2026-10-15T12:00:00Z") },
      hooks: [
        confirmationHook(notifier, { fromName: "Agile Agilist", calendarUrl: (id) => `https://api.test/public/v1/seats/${id}/calendar.ics`, pageUrl: (ctx) => (ctx.course ? `https://agile-agilist.com/training/${ctx.course.slug}/` : undefined) }),
        { orderPaid: async (ctx) => { paidCtx.push(ctx); }, orderRefunded: async (ctx) => { refundCtx.push(ctx); } },
        { orderPaid: async () => { throw new Error("crm down"); } },
      ],
    });
  });

  async function paidOrder() {
    const { organization: org } = await core.createOrganization({ name: "Agile Agilist", country: "CA", currency: "CAD" });
    const course = await core.createCourse(org.id, { slug: "leading-safe", name: "Leading SAFe" });
    const cohort = await core.createEvent(org.id, { courseId: course.id, name: "Nov cohort", timezone: "America/Toronto", sessions: [{ startsAt: new Date("2026-11-20T14:00:00Z"), endsAt: new Date("2026-11-20T22:00:00Z"), title: "Day 1" }, { startsAt: new Date("2026-11-21T14:00:00Z"), endsAt: new Date("2026-11-21T22:00:00Z"), title: "Day 2" }] });
    const tt = await core.createTicketType(org.id, cohort.id, { name: "Std", priceMinor: 100_000, quantity: 10 });
    const { order } = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 2, buyerEmail: "buyer@corp.com", attendees: [{ email: "ada@corp.com", name: "Ada Lovelace" }, { email: "alan@corp.com", name: "Alan Turing" }] });
    await core.handlePaymentEvent(payments.succeed(order.paymentRef!, order.pricing.totalMinor, "CAD"));
    return { org, course, cohort, tt, order };
  }

  it("sends one ticket email per attendee with an .ics attachment, plus a buyer summary", async () => {
    const { order } = await paidOrder();
    expect(notifier.sent.map((m) => m.to).sort()).toEqual(["ada@corp.com", "alan@corp.com", "buyer@corp.com"]);
    const ada = notifier.sent.find((m) => m.to === "ada@corp.com")!;
    expect(ada.subject).toContain("Leading SAFe");
    expect(ada.text).toContain("Hi Ada,");
    expect(ada.text).toContain("Day 1:");
    expect(ada.text).toContain("Course page: https://agile-agilist.com/training/leading-safe/");
    expect(ada.attachments?.[0]?.filename).toBe("cohort.ics");
    expect(ada.attachments?.[0]?.content).toContain("BEGIN:VEVENT");
    expect(ada.html).toContain("Add to calendar");
    const buyer = notifier.sent.find((m) => m.to === "buyer@corp.com")!;
    expect(buyer.key).toBe(`order:${order.id}:buyer-summary`);
    expect(buyer.text).toContain("Ada Lovelace <ada@corp.com>");
    expect(buyer.text).toContain("$2,000.00");
  });

  it("runs every hook, isolates failures, and never blocks settlement", async () => {
    const { org, order, course } = await paidOrder();
    expect((await core.getOrder(org.id, order.id)).status).toBe("paid");
    expect(paidCtx).toHaveLength(1);
    expect(paidCtx[0]!.course?.id).toBe(course.id);
    expect(paidCtx[0]!.seats).toHaveLength(2);
    expect(core.hookFailures).toEqual([expect.objectContaining({ hook: "orderPaid", orderId: order.id, error: "crm down" })]);
  });

  it("fires orderRefunded with the fully flag", async () => {
    const { org, order } = await paidOrder();
    await core.refundOrder(org.id, { orderId: order.id, amountMinor: 50_000, reason: "one dropped" });
    await core.refundOrder(org.id, { orderId: order.id, reason: "both dropped" });
    expect(refundCtx.map((c) => c.fully)).toEqual([false, true]);
    expect(refundCtx[1]!.order.status).toBe("refunded");
  });

  it("public seat and order reads", async () => {
    const { org, order } = await paidOrder();
    const seats = await core.listSeats(org.id, { orderId: order.id });
    const pub = await core.publicSeat(seats[0]!.id);
    expect(pub.course?.slug).toBe("leading-safe");
    expect((await core.publicOrder(order.id, "BUYER@corp.com")).id).toBe(order.id);
    await expect(core.publicOrder(order.id, "someone@else.com")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
