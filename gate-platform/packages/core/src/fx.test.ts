import { describe, expect, it } from "vitest";
import { FrankfurterRates, convertMinor, currencyForLocale, roundShelf, validatePricingSettings } from "./fx.js";

describe("fx", () => {
  it("rounds to shelf prices", () => {
    expect(roundShelf(1364.21, "none")).toBe(1364.21);
    expect(roundShelf(1364.21, "whole")).toBe(1364);
    expect(roundShelf(1364.21, "nine")).toBe(1359);
    expect(roundShelf(1366, "nine")).toBe(1369);
    expect(roundShelf(1364.21, "five")).toBe(1365);
    expect(roundShelf(7.2, "nine")).toBe(7);
  });
  it("converts minor units across decimal conventions", () => {
    expect(convertMinor(149500, "USD", "CAD", 1.3642, "whole")).toBe(203900);
    expect(convertMinor(149500, "USD", "CAD", 1.37, "nine")).toBe(204900);
    expect(convertMinor(149500, "USD", "JPY", 151.2, "whole")).toBe(226044);
    expect(convertMinor(0, "USD", "CAD", 1.36, "whole")).toBe(0);
    expect(() => convertMinor(100, "USD", "CAD", 0, "whole")).toThrow(/no usable rate/);
  });
  it("validates settings and drops the base currency", () => {
    const s = validatePricingSettings({ currencies: ["cad", "USD", "eur", "CAD"], fxFallback: true, rounding: "nine", rates: { CAD: 1.36, usd: 1 } }, "USD");
    expect(s).toMatchObject({ currencies: ["CAD", "EUR"], fxFallback: true, rounding: "nine", rates: { CAD: 1.36 } });
    expect(() => validatePricingSettings({ currencies: ["DOLLARS"] }, "USD")).toThrow(/ISO 4217/);
    expect(() => validatePricingSettings({ rates: { CAD: -1 } }, "USD")).toThrow(/positive/);
  });
  it("maps locales to currencies", () => {
    expect(currencyForLocale("en-CA")).toBe("CAD");
    expect(currencyForLocale("fr_FR")).toBe("EUR");
    expect(currencyForLocale("en")).toBeUndefined();
    expect(currencyForLocale(undefined)).toBeUndefined();
  });
  it("reads ECB rates through frankfurter", async () => {
    const fetchImpl = (async (url: string) => {
      expect(url).toBe("https://api.frankfurter.app/latest?from=USD&to=CAD%2CEUR");
      return new Response(JSON.stringify({ base: "USD", rates: { CAD: 1.3642, EUR: 0.92 } }));
    }) as unknown as typeof fetch;
    expect(await new FrankfurterRates(fetchImpl).latest("USD", ["CAD", "EUR"])).toEqual({ CAD: 1.3642, EUR: 0.92 });
    expect(await new FrankfurterRates(fetchImpl).latest("USD", [])).toEqual({});
  });
});

import { Core } from "./services.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";

describe("localized pricing in core", () => {
  async function setup(fx?: import("./fx.js").FxRateSource) {
    const core = new Core({ repos: createInMemoryRepos(), ledger: new Ledger({ store: new InMemoryLedgerStore() }), payments: new FakePaymentsAdapter(), ...(fx ? { fx } : {}) });
    const { organization } = await core.createOrganization({ name: "AA", country: "US", currency: "USD" });
    const course = await core.createCourse(organization.id, { slug: "pmp", name: "PMP" });
    const event = await core.createEvent(organization.id, { name: "PMP Nov", startsAt: new Date(Date.now() + 86_400_000 * 30), courseId: course.id });
    const tt = await core.createTicketType(organization.id, event.id, { name: "Seat", priceMinor: 149500, quantity: 10, prices: { GBP: 119900 } });
    return { core, org: organization, event, tt };
  }
  it("converts enabled currencies from stored rates and marks them as converted", async () => {
    const { core, org, event, tt } = await setup();
    expect(() => core.resolveUnitPrice(tt, event, "CAD")).toThrow(/not sold in CAD/);
    await core.updatePricing(org.id, { currencies: ["CAD", "GBP", "EUR"], fxFallback: true, rounding: "nine", rates: { CAD: 1.3642, EUR: 0.92 } });
    const updated = await core.getOrganization(org.id);
    expect(core.resolveUnitPrice(tt, event, "CAD", new Date(), updated.pricing)).toBe(203900);
    expect(core.resolveUnitPrice(tt, event, "GBP", new Date(), updated.pricing)).toBe(119900);
    expect(core.isConvertedPrice(tt, event, "CAD")).toBe(true);
    expect(core.isConvertedPrice(tt, event, "GBP")).toBe(false);
    const pub = await core.publicCourse(org.id, "pmp");
    expect(pub.organization.currencies).toEqual(["USD", "CAD", "GBP", "EUR"]);
    expect(pub.cohorts[0]!.ticketTypes[0]!.prices).toEqual({ USD: 149500, GBP: 119900, CAD: 203900, EUR: 137900 });
    expect(pub.cohorts[0]!.ticketTypes[0]!.converted).toEqual(["CAD", "EUR"]);
    const res = await core.createOrder(org.id, { eventId: event.id, ticketTypeId: tt.id, quantity: 1, currency: "CAD", buyerEmail: "a@b.co", attendees: [{ email: "a@b.co", name: "A" }] });
    const order = "order" in res ? res.order : res;
    expect(order.currency).toBe("CAD");
    expect(order.pricing.unitPriceMinor).toBe(203900);
  });
  it("fallback off keeps explicit prices only", async () => {
    const { core, org, event, tt } = await setup();
    await core.updatePricing(org.id, { currencies: ["CAD"], fxFallback: false, rates: { CAD: 1.36 } });
    const pub = await core.publicCourse(org.id, "pmp");
    expect(Object.keys(pub.cohorts[0]!.ticketTypes[0]!.prices).sort()).toEqual(["GBP", "USD"]);
    const p = (await core.getOrganization(org.id)).pricing;
    expect(() => core.resolveUnitPrice(tt, event, "CAD", new Date(), p)).toThrow();
  });
  it("refreshes rates from the configured source", async () => {
    const fx = { name: "ecb" as const, latest: async (base: string, quotes: string[]) => { expect(base).toBe("USD"); return Object.fromEntries(quotes.filter((q) => q !== "XXX").map((q) => [q, 2])); } };
    const { core, org } = await setup(fx);
    await expect(core.refreshFxRates(org.id)).rejects.toThrow(/enable at least one/);
    await core.updatePricing(org.id, { currencies: ["CAD", "EUR"], fxFallback: true });
    const o = await core.refreshFxRates(org.id);
    expect(o.pricing).toMatchObject({ rates: { CAD: 2, EUR: 2 }, ratesSource: "ecb" });
    expect(o.pricing!.ratesUpdatedAt).toBeInstanceOf(Date);
    await core.updatePricing(org.id, { currencies: ["CAD", "XXX"] });
    await expect(core.refreshFxRates(org.id)).rejects.toThrow(/no reference rate for XXX/);
    expect((await core.getOrganization(org.id)).pricing!.rates.CAD).toBe(2);
  });
});
