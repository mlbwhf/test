import { describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { planScheduleDates } from "./schedule.js";
import { Core } from "./services.js";

describe("planScheduleDates", () => {
  it("weekly and every other week, on the template weekday or a chosen one", () => {
    expect(planScheduleDates({ rule: { repeat: "weekly", everyWeeks: 1 }, from: "2026-11-02", count: 3 })).toEqual(["2026-11-02", "2026-11-09", "2026-11-16"]);
    expect(planScheduleDates({ rule: { repeat: "weekly", everyWeeks: 2, weekday: 6 }, from: "2026-11-02", count: 3 })).toEqual(["2026-11-07", "2026-11-21", "2026-12-05"]);
  });

  it("first Monday and last Friday of the month, across a year end", () => {
    expect(planScheduleDates({ rule: { repeat: "monthly", everyMonths: 1, week: 1, weekday: 1 }, from: "2026-11-03", count: 4 })).toEqual(["2026-12-07", "2027-01-04", "2027-02-01", "2027-03-01"]);
    expect(planScheduleDates({ rule: { repeat: "monthly", everyMonths: 2, week: "last", weekday: 5 }, from: "2026-11-01", until: "2027-04-30" })).toEqual(["2026-11-27", "2027-01-29", "2027-03-26"]);
  });

  it("skips holidays and keeps going; stops at the end date; hand-picked dates are sorted", () => {
    expect(planScheduleDates({ rule: { repeat: "weekly", everyWeeks: 1 }, from: "2026-12-14", count: 3, skip: ["2026-12-21", "2026-12-28"] })).toEqual(["2026-12-14", "2027-01-04", "2027-01-11"]);
    expect(planScheduleDates({ rule: { repeat: "weekly", everyWeeks: 1 }, from: "2026-11-02", until: "2026-11-15" })).toEqual(["2026-11-02", "2026-11-09"]);
    expect(planScheduleDates({ rule: { repeat: "dates", dates: ["2027-02-01", "2026-12-01", "2026-10-01"] }, from: "2026-11-01" })).toEqual(["2026-12-01", "2027-02-01"]);
    expect(() => planScheduleDates({ rule: { repeat: "weekly", everyWeeks: 1 }, from: "2026-11-02" })).toThrow();
    expect(planScheduleDates({ rule: { repeat: "weekly", everyWeeks: 1 }, from: "2026-01-05", count: 500 })).toHaveLength(52);
  });
});

describe("buildSchedule", () => {
  it("copies the template onto each date in its own time zone, skips dates already taken, publishes on request", async () => {
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter(), clock: { now: () => new Date("2026-10-21T12:00:00Z") } });
    const { organization: org } = await core.createOrganization({ name: "AA", country: "CA", currency: "CAD" });
    const course = await core.createCourse(org.id, { slug: "safe", name: "Leading SAFe" });
    // Two days, 9–5 Toronto time, starting Monday Nov 2.
    const template = await core.createEvent(org.id, {
      name: "Nov 2", courseId: course.id, timezone: "America/Toronto",
      sessions: [{ startsAt: new Date("2026-11-02T14:00:00Z"), endsAt: new Date("2026-11-02T22:00:00Z") }, { startsAt: new Date("2026-11-03T14:00:00Z"), endsAt: new Date("2026-11-03T22:00:00Z") }],
    });
    await core.createTicketType(org.id, template.id, { name: "Seat", priceMinor: 99_500, quantity: 20 });
    const rule = { repeat: "monthly" as const, everyMonths: 1, week: 1 as const, weekday: 1 as const };

    const preview = await core.buildSchedule(org.id, { templateEventId: template.id, rule, from: "2026-10-22", count: 3, dryRun: true });
    expect(preview.plan).toEqual([
      { startDate: "2026-11-02", endDate: "2026-11-03", conflict: true },
      { startDate: "2026-12-07", endDate: "2026-12-08", conflict: false },
      { startDate: "2027-01-04", endDate: "2027-01-05", conflict: false },
    ]);
    expect(preview.created).toEqual([]);

    const { created } = await core.buildSchedule(org.id, { templateEventId: template.id, rule, from: "2026-10-22", count: 3, publish: true });
    expect(created).toHaveLength(2);
    // After the DST change Toronto is UTC-5: 9 am local is 14:00Z.
    expect(created[0]).toMatchObject({ name: "Dec 7, 2026", status: "live", timezone: "America/Toronto", courseId: course.id });
    expect(created[0]!.sessions.map((x) => x.startsAt.toISOString())).toEqual(["2026-12-07T14:00:00.000Z", "2026-12-08T14:00:00.000Z"]);
    const tickets = await core.repos.ticketTypes.listByEvent(created[1]!.id);
    expect(tickets).toMatchObject([{ name: "Seat", priceMinor: 99_500, quantity: 20, sold: 0 }]);

    // Running it again creates nothing new.
    expect((await core.buildSchedule(org.id, { templateEventId: template.id, rule, from: "2026-10-22", count: 3 })).created).toHaveLength(0);
    await expect(core.buildSchedule(org.id, { templateEventId: template.id, rule: { repeat: "weekly", everyWeeks: 0 }, count: 2 })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("dateSlugs", () => {
  it("uses the local start date and numbers same-day classes in start order", async () => {
    const { dateSlugs } = await import("./schedule.js");
    const { localDate } = await import("./zoned.js");
    const slugs = dateSlugs([
      { id: "b", startsAt: new Date("2026-11-21T03:00:00Z"), timezone: "America/Los_Angeles" },
      { id: "a", startsAt: new Date("2026-11-20T14:00:00Z"), timezone: "America/Toronto" },
      { id: "c", startsAt: new Date("2026-11-22T14:00:00Z"), timezone: "America/Toronto" },
    ], localDate);
    // 03:00Z on the 21st is still the evening of the 20th in Los Angeles.
    expect(Object.fromEntries(slugs)).toEqual({ a: "2026-11-20", b: "2026-11-20-2", c: "2026-11-22" });
  });
});
