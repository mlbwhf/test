import { describe, expect, it } from "vitest";
import { courseNameFrom, slugify } from "./plan.js";
import { importFromEventbrite, mapEventbriteEvent, planFromEventbrite, type EventbriteEvent } from "./eventbrite.js";
import { CSV_TEMPLATE, parseCsv, parseDateParts, parseMoneyMinor, planFromCsv, zonedToIso } from "./csv.js";

const future = new Date(Date.now() + 30 * 86_400_000);
const iso = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

function ebEvent(over: Partial<EventbriteEvent> = {}): EventbriteEvent {
  return {
    id: "123",
    name: { text: "PMP Bootcamp - Nov 14-16, 2026" },
    summary: "Three days of exam prep.",
    url: "https://www.eventbrite.com/e/123",
    start: { timezone: "America/Toronto", utc: iso(future) },
    end: { timezone: "America/Toronto", utc: iso(new Date(future.getTime() + 2 * 86_400_000 + 8 * 3_600_000)) },
    currency: "USD",
    online_event: true,
    capacity: 25,
    status: "live",
    ticket_classes: [
      { id: "t1", name: "Early bird", cost: { currency: "USD", value: 129500 }, quantity_total: 10, quantity_sold: 10 },
      { id: "t2", name: "Standard", cost: { currency: "USD", value: 149500 }, quantity_total: 15, quantity_sold: 4 },
      { id: "t3", name: "Support us", donation: true },
    ],
    ...over,
  };
}

describe("course names and slugs", () => {
  it("strips dates and cohort labels from event names", () => {
    expect(courseNameFrom("PMP Bootcamp - Nov 14-16, 2026")).toBe("PMP Bootcamp");
    expect(courseNameFrom("Scrum Master Intensive | Cohort 12")).toBe("Scrum Master Intensive");
    expect(courseNameFrom("Agile Leadership (Weekend)")).toBe("Agile Leadership");
    expect(courseNameFrom("Design Thinking: From Idea to Prototype")).toBe("Design Thinking: From Idea to Prototype");
    expect(courseNameFrom("Leading SAFe")).toBe("Leading SAFe");
  });
  it("slugifies", () => {
    expect(slugify("PMP Bootcamp & Exam Prep!")).toBe("pmp-bootcamp-and-exam-prep");
    expect(slugify("Café Été")).toBe("cafe-ete");
  });
});

describe("eventbrite mapping", () => {
  it("maps an event with ticket classes into a plan item", () => {
    const r = mapEventbriteEvent(ebEvent());
    if ("skip" in r) throw new Error(r.skip);
    expect(r.course).toMatchObject({ slug: "pmp-bootcamp", name: "PMP Bootcamp", description: "Three days of exam prep.", durationDays: 3 });
    expect(r.event).toMatchObject({ name: "PMP Bootcamp - Nov 14-16, 2026", timezone: "America/Toronto", currency: "USD", format: "live_virtual" });
    expect(r.ticketTypes).toEqual([
      { name: "Early bird", priceMinor: 129500, quantity: 10, sold: 10 },
      { name: "Standard", priceMinor: 149500, quantity: 15, sold: 4 },
    ]);
    expect(r.warnings).toContain("donation tickets were left out");
    expect(r.sourceUrl).toBe("https://www.eventbrite.com/e/123");
  });
  it("skips cancelled events and series parents, warns on past and missing tickets", () => {
    expect(mapEventbriteEvent(ebEvent({ status: "canceled" }))).toEqual({ skip: "cancelled at Eventbrite" });
    expect("skip" in mapEventbriteEvent(ebEvent({ is_series_parent: true }))).toBe(true);
    const past = mapEventbriteEvent(ebEvent({ start: { timezone: "UTC", utc: "2020-01-01T10:00:00Z" }, end: null, ticket_classes: [] }));
    if ("skip" in past) throw new Error(past.skip);
    expect(past.warnings).toContain("starts in the past");
    expect(past.ticketTypes).toEqual([{ name: "Seat", priceMinor: 0, quantity: 25 }]);
  });
  it("groups cohorts into courses and sorts by start", () => {
    const later = iso(new Date(future.getTime() + 60 * 86_400_000));
    const plan = planFromEventbrite([
      ebEvent({ id: "2", name: { text: "PMP Bootcamp - Jan 2027" }, start: { timezone: "UTC", utc: later } }),
      ebEvent({ id: "1" }),
      ebEvent({ id: "3", name: { text: "Scrum Master - Dec 2026" } }),
      ebEvent({ id: "4", status: "canceled" }),
    ]);
    expect(plan.items.map((i) => i.sourceId)).toEqual(["1", "3", "2"]);
    expect(plan.courses).toEqual([
      { slug: "pmp-bootcamp", name: "PMP Bootcamp", cohorts: 2 },
      { slug: "scrum-master", name: "Scrum Master", cohorts: 1 },
    ]);
    expect(plan.skipped).toHaveLength(1);
  });
  it("fetches organizations and paginated events with the token", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      calls.push(url);
      expect((init?.headers as Record<string, string>).authorization).toBe("Bearer tok_1");
      if (url.endsWith("/users/me/organizations/")) return new Response(JSON.stringify({ organizations: [{ id: "org9", name: "Agile Agilist" }] }));
      if (url.includes("continuation=c2")) return new Response(JSON.stringify({ events: [ebEvent({ id: "b" })], pagination: { has_more_items: false } }));
      return new Response(JSON.stringify({ events: [ebEvent({ id: "a" })], pagination: { has_more_items: true, continuation: "c2" } }));
    }) as unknown as typeof fetch;
    const plan = await importFromEventbrite("tok_1", { fetchImpl });
    expect(plan.organization).toEqual({ id: "org9", name: "Agile Agilist" });
    expect(plan.items.map((i) => i.sourceId).sort()).toEqual(["a", "b"]);
    expect(calls[1]).toContain("/organizations/org9/events/?expand=ticket_classes");
  });
  it("reports a rejected token", async () => {
    const fetchImpl = (async () => new Response("{}", { status: 401 })) as unknown as typeof fetch;
    await expect(importFromEventbrite("bad", { fetchImpl })).rejects.toThrow(/rejected the token/);
  });
});

describe("csv parsing", () => {
  it("parses quoted fields, embedded commas and newlines", () => {
    expect(parseCsv('a,b\n"x, y","line1\nline2"\n"he said ""hi""",z\r\n')).toEqual([["a", "b"], ["x, y", "line1\nline2"], ['he said "hi"', "z"]]);
  });
  it("reads common date and money formats", () => {
    expect(parseDateParts("2026-11-12 09:00")).toMatchObject({ y: 2026, m: 10, d: 12, hh: 9, mm: 0, hasTime: true });
    expect(parseDateParts("11/12/2026 9:30 AM")).toMatchObject({ y: 2026, m: 10, d: 12, hh: 9, mm: 30 });
    expect(parseDateParts("Nov 12, 2026 1:00pm")).toMatchObject({ y: 2026, m: 10, d: 12, hh: 13 });
    expect(parseDateParts("12 Nov 2026")).toMatchObject({ y: 2026, m: 10, d: 12, hasTime: false });
    expect(parseDateParts("2026-11-12", "14:15")).toMatchObject({ hh: 14, mm: 15, hasTime: true });
    expect(parseDateParts("2026-11-12T14:00:00Z")?.iso).toBe("2026-11-12T14:00:00.000Z");
    expect(zonedToIso({ y: 2026, m: 10, d: 12, hh: 9, mm: 0 }, "America/Toronto")).toBe("2026-11-12T14:00:00.000Z");
    expect(zonedToIso({ y: 2026, m: 6, d: 1, hh: 9, mm: 0 }, "America/Toronto")).toBe("2026-07-01T13:00:00.000Z");
    expect(parseMoneyMinor("$1,495.00", "USD")).toBe(149500);
    expect(parseMoneyMinor("1.495,50 €", "EUR")).toBe(149550);
    expect(parseMoneyMinor("Free", "USD")).toBe(0);
    expect(parseMoneyMinor("¥12000", "JPY")).toBe(12000);
  });
  it("builds a plan from the template and merges ticket rows of one cohort", () => {
    const plan = planFromCsv(CSV_TEMPLATE);
    expect(plan.skipped).toEqual([]);
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0]!.event).toMatchObject({ name: "PMP Exam Prep - Nov 2026", startsAt: "2026-11-12T14:00:00.000Z", endsAt: "2026-11-14T22:00:00.000Z", timezone: "America/Toronto", currency: "USD", format: "live_virtual" });
    expect(plan.items[0]!.course).toMatchObject({ slug: "pmp-exam-prep", name: "PMP Exam Prep", durationDays: 3 });
    expect(plan.items[0]!.ticketTypes).toEqual([{ name: "Seat", priceMinor: 149500, quantity: 20 }]);

    const corsizio = [
      "Title,Start Date,End Date,Time Zone,Price,Currency,Capacity,Registered,Location,Status,Ticket Type",
      '"CSM Workshop","Dec 3, 2026 9:00 AM","Dec 4, 2026 5:00 PM",America/Toronto,"$995.00",CAD,16,9,"Online via Zoom",Published,Standard',
      '"CSM Workshop","Dec 3, 2026 9:00 AM","Dec 4, 2026 5:00 PM",America/Toronto,"$895.00",CAD,16,9,"Online via Zoom",Published,"Early bird"',
      '"Old class","Jan 5, 2024","",America/Toronto,"$100",CAD,10,10,"123 King St, Toronto",Cancelled,',
    ].join("\n");
    const p2 = planFromCsv(corsizio);
    expect(p2.items).toHaveLength(1);
    expect(p2.items[0]!.ticketTypes.map((t) => [t.name, t.priceMinor, t.sold])).toEqual([["Standard", 99500, 9], ["Early bird", 89500, 9]]);
    expect(p2.items[0]!.event.currency).toBe("CAD");
    expect(p2.skipped[0]!.reason).toContain("cancelled");
  });
  it("explains a file it cannot map", () => {
    const p = planFromCsv("foo,bar\n1,2\n");
    expect(p.items).toEqual([]);
    expect(p.skipped[0]!.reason).toContain("need a name column");
  });
});
