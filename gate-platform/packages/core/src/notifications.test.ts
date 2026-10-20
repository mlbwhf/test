import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";
import { buildIcs, buildInvite, dailySeries } from "./ics.js";
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
    expect(ics).toContain("SUMMARY:Leading SAFe\\; day one\\, two — Day 1");
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

describe("calendar invitations", () => {
  const day = (d: number, h1 = 14, h2 = 22) => ({ startsAt: new Date(Date.UTC(2026, 10, d, h1)), endsAt: new Date(Date.UTC(2026, 10, d, h2)) });
  const base = { uid: "seat-1", summary: "RTE; Release Train", organizer: { name: "AA", email: "t@aa.com" }, attendeeEmail: "a@b.co" };
  it("sends a single block or a daily series as an invitation", () => {
    const one = buildInvite({ ...base, sessions: [day(20)] });
    expect(one.method).toBe("REQUEST");
    expect(one.ics).not.toContain("RRULE");
    expect(one.ics).toContain("SUMMARY:RTE\\; Release Train");
    const three = buildInvite({ ...base, sessions: [day(22), day(20), day(21)] });
    expect(three.ics).toContain("RRULE:FREQ=DAILY;COUNT=3");
    expect(three.ics).toContain("DTSTART:20261120T140000Z");
    expect(dailySeries([day(20), day(22)])).toBeUndefined();
    expect(dailySeries([day(20), day(21, 14, 20)])).toBeUndefined();
  });
  it("falls back to an importable file for irregular schedules or without an organizer", () => {
    const irregular = buildInvite({ ...base, sessions: [day(20), day(27)] });
    expect(irregular.method).toBe("PUBLISH");
    expect(irregular.ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(buildInvite({ ...base, organizer: undefined, sessions: [day(20)] }).method).toBe("PUBLISH");
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
        confirmationHook(notifier, {
          fromName: "Agile Agilist", calendarUrl: (id) => `https://api.test/public/v1/seats/${id}/calendar.ics`, pageUrl: (ctx) => (ctx.course ? `https://agile-agilist.com/training/${ctx.course.slug}/` : undefined),
          ticket: (id) => ({ url: `https://app.test/my/ticket/${id}.sig`, qrUrl: `https://api.test/public/v1/tickets/${id}.sig/qr.png`, code: "EC-7K2M-94QX" }),
          manageUrl: (id, email) => `https://app.test/my/seat/${id}?email=${encodeURIComponent(email)}`,
          organizer: () => ({ name: "Agile Agilist", email: "training@agile-agilist.com" }),
        }),
        { orderPaid: async (ctx) => { paidCtx.push(ctx); }, orderRefunded: async (ctx) => { refundCtx.push(ctx); } },
        { orderPaid: async () => { throw new Error("crm down"); } },
      ],
    });
  });

  async function paidOrder() {
    const { organization: org } = await core.createOrganization({ releasePolicy: "immediate", name: "Agile Agilist", country: "CA", currency: "CAD" });
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
    // Two consecutive 9-5 days: one invitation with a daily rule, from the organizer.
    expect(ada.attachments?.[0]?.filename).toBe("invite.ics");
    expect(ada.attachments?.[0]?.contentType).toContain("method=REQUEST");
    const ics = ada.attachments![0]!.content.replace(/\r\n /g, "");
    expect(ics).toContain("METHOD:REQUEST");
    expect(ics).toContain("RRULE:FREQ=DAILY;COUNT=2");
    expect(ics).toContain("ORGANIZER;CN=\"Agile Agilist\":mailto:training@agile-agilist.com");
    expect(ics).toContain("ATTENDEE;CN=\"Ada Lovelace\";CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=FALSE:mailto:ada@corp.com");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ada.html).toContain("Add to calendar");
    expect(ada.html).toContain("Open ticket");
    expect(ada.html).toContain("EC-7K2M-94QX");
    expect(ada.html).toContain('src="https://api.test/public/v1/tickets/');
    expect(ada.text).toContain("Check-in code: EC-7K2M-94QX");
    expect(ada.text).toContain("Change or cancel: https://app.test/my/seat/");
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
