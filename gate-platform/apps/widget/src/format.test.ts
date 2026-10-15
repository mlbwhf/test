import { describe, expect, it } from "vitest";
import { uuid } from "./api.js";
import {
  currencyUnion, formatDate, formatDateRange, formatLabel, formatMoney, pickCurrency,
  remainingLabel, sessionsLabel,
} from "./format.js";

// Intl may emit narrow no-break spaces before AM/PM; normalise for stable assertions.
const norm = (s: string): string => s.replace(/[   ]/g, " ");

describe("formatMoney", () => {
  it("formats integer minor units as 2-decimal currency", () => {
    expect(norm(formatMoney(109900, "CAD", "en-US"))).toBe("CA$1,099.00");
    expect(norm(formatMoney(84900, "USD", "en-US"))).toBe("$849.00");
    expect(norm(formatMoney(69900, "GBP", "en-US"))).toBe("£699.00");
    expect(norm(formatMoney(0, "USD", "en-US"))).toBe("$0.00");
    expect(norm(formatMoney(5, "USD", "en-US"))).toBe("$0.05");
  });
  it("falls back when the currency code is invalid", () => {
    expect(formatMoney(1000, "XXXX", "en-US")).toBe("10.00 XXXX");
  });
});

describe("formatLabel", () => {
  it("maps known event formats", () => {
    expect(formatLabel("live_virtual")).toBe("Live virtual");
    expect(formatLabel("in_person")).toBe("In person");
    expect(formatLabel("hybrid")).toBe("Hybrid");
    expect(formatLabel("self_paced")).toBe("Self-paced");
  });
  it("humanises unknown formats", () => {
    expect(formatLabel("workshop_day")).toBe("workshop day");
  });
});

describe("dates", () => {
  it("formats a multi-day range in the event time zone with the zone short name", () => {
    const s = formatDateRange("2026-11-20T14:00:00.000Z", "2026-11-21T22:00:00.000Z", "America/Toronto", "en-US");
    expect(norm(s)).toBe("Nov 20, 2026, 9:00 AM – Nov 21, 2026, 5:00 PM EST");
  });
  it("collapses same-day ranges", () => {
    const s = formatDateRange("2026-07-01T13:00:00.000Z", "2026-07-01T21:00:00.000Z", "Europe/London", "en-US");
    expect(norm(s)).toBe("Jul 1, 2026, 2:00 PM – 10:00 PM GMT+1");
  });
  it("falls back to UTC for an unknown time zone and echoes invalid dates", () => {
    expect(formatDateRange("2026-07-01T13:00:00.000Z", "2026-07-01T21:00:00.000Z", "Mars/Olympus", "en-US")).toContain("UTC");
    expect(formatDateRange("nope", "2026-07-01T21:00:00.000Z", "UTC")).toBe("nope – 2026-07-01T21:00:00.000Z");
  });
  it("formats a date only", () => {
    expect(formatDate("2026-11-01T00:00:00.000Z", "UTC", "en-US")).toBe("Nov 1, 2026");
    expect(formatDate("2026-11-01T00:00:00.000Z", "America/Toronto", "en-US")).toBe("Oct 31, 2026");
    expect(formatDate("garbage")).toBe("garbage");
  });
});

describe("currencies", () => {
  const cohorts = [
    { ticketTypes: [{ prices: { CAD: 1, USD: 2 } }, { prices: { CAD: 1, GBP: 3 } }] },
    { ticketTypes: [{ prices: { EUR: 4, USD: 2 } }] },
  ];
  it("unions currency codes in order of first appearance", () => {
    expect(currencyUnion(cohorts)).toEqual(["CAD", "USD", "GBP", "EUR"]);
    expect(currencyUnion([])).toEqual([]);
  });
  it("picks the first preferred currency that is available", () => {
    expect(pickCurrency(["CAD", "USD"], "GBP", "USD")).toBe("USD");
    expect(pickCurrency(["CAD", "USD"], "USD", "CAD")).toBe("USD");
    expect(pickCurrency(["CAD"], undefined, "USD")).toBe("CAD");
    expect(pickCurrency([], "USD")).toBeUndefined();
  });
});

describe("labels", () => {
  it("remainingLabel", () => {
    expect(remainingLabel(0)).toBe("Sold out");
    expect(remainingLabel(1)).toBe("1 left");
    expect(remainingLabel(5)).toBe("5 left");
    expect(remainingLabel(6)).toBeNull();
  });
  it("sessionsLabel", () => {
    expect(sessionsLabel(0)).toBe("Schedule to be announced");
    expect(sessionsLabel(1)).toBe("1 session");
    expect(sessionsLabel(2)).toBe("2 sessions");
  });
});

describe("uuid", () => {
  it("produces unique v4 UUIDs", () => {
    const a = uuid();
    const b = uuid();
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a).not.toBe(b);
  });
});
