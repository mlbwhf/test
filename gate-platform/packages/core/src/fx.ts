import { DomainError } from "./errors.js";
import type { MinorUnits } from "@gate/ledger";

// Localized pricing. Organizers list explicit prices per currency on each ticket; for
// currencies they enable without an explicit price, the base price is converted with the
// organization's stored rate and rounded to a shelf price. Rates are refreshed on demand
// (ECB reference rates through frankfurter.app) or typed in by hand, and shown with their
// age, so conversions are never silent.

export type FxRounding = "none" | "whole" | "nine" | "five";

export interface PricingSettings {
  /** Presentment currencies offered in addition to the base currency. */
  currencies: string[];
  /** Convert the base price for enabled currencies that have no explicit price. */
  fxFallback: boolean;
  rounding: FxRounding;
  /** Units of quote currency per 1 unit of the base currency. */
  rates: Record<string, number>;
  ratesUpdatedAt?: Date;
  ratesSource?: "manual" | "ecb";
}

export const DEFAULT_PRICING: PricingSettings = { currencies: [], fxFallback: false, rounding: "whole", rates: {} };

const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "CLP", "ISK", "HUF", "UGX", "XOF", "XAF", "PYG", "RWF"]);

export function minorPerMajor(currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase()) ? 1 : 100;
}

/** Shelf-price rounding applied after conversion, in major units of the quote currency. */
export function roundShelf(major: number, rounding: FxRounding): number {
  switch (rounding) {
    case "none": return Math.round(major * 100) / 100;
    case "whole": return Math.round(major);
    case "five": return Math.max(5, Math.round(major / 5) * 5);
    case "nine": {
      // 1495 -> 1499, 87.3 -> 89, 12.2 -> 9 (never 0 for a priced ticket)
      if (major < 10) return Math.max(1, Math.round(major));
      const base = Math.round(major / 10) * 10;
      return base >= 10 ? base - 1 : 9;
    }
  }
}

export function convertMinor(amountMinor: MinorUnits, from: string, to: string, rate: number, rounding: FxRounding): MinorUnits {
  if (!(rate > 0) || !Number.isFinite(rate)) throw new DomainError("VALIDATION", `no usable rate from ${from} to ${to}`);
  if (amountMinor === 0) return 0;
  const major = (amountMinor / minorPerMajor(from)) * rate;
  const rounded = roundShelf(major, rounding);
  return Math.round(rounded * minorPerMajor(to));
}

export function validatePricingSettings(input: Partial<PricingSettings> | undefined, baseCurrency: string): PricingSettings {
  const currencies = [...new Set((input?.currencies ?? []).map((c) => c.toUpperCase()))].filter((c) => c !== baseCurrency);
  for (const c of currencies) if (!/^[A-Z]{3}$/.test(c)) throw new DomainError("VALIDATION", `"${c}" is not an ISO 4217 code`);
  if (currencies.length > 12) throw new DomainError("VALIDATION", "at most 12 presentment currencies");
  const rounding = input?.rounding ?? "whole";
  if (!["none", "whole", "nine", "five"].includes(rounding)) throw new DomainError("VALIDATION", "rounding must be none, whole, nine or five");
  const rates: Record<string, number> = {};
  for (const [c, r] of Object.entries(input?.rates ?? {})) {
    const code = c.toUpperCase();
    if (code === baseCurrency) continue;
    if (!(typeof r === "number" && Number.isFinite(r) && r > 0 && r < 1_000_000)) throw new DomainError("VALIDATION", `rate for ${code} must be a positive number`);
    rates[code] = r;
  }
  return {
    currencies,
    fxFallback: Boolean(input?.fxFallback),
    rounding,
    rates,
    ...(input?.ratesUpdatedAt ? { ratesUpdatedAt: input.ratesUpdatedAt } : {}),
    ...(input?.ratesSource ? { ratesSource: input.ratesSource } : {}),
  };
}

/** Where reference rates come from. */
export interface FxRateSource {
  readonly name: "ecb" | "manual";
  latest(base: string, quotes: string[]): Promise<Record<string, number>>;
}

/** ECB reference rates via frankfurter.app (no key, daily, ~30 currencies). */
export class FrankfurterRates implements FxRateSource {
  readonly name = "ecb" as const;
  constructor(private readonly fetchImpl: typeof fetch = fetch, private readonly baseUrl = "https://api.frankfurter.app") {}
  async latest(base: string, quotes: string[]): Promise<Record<string, number>> {
    if (quotes.length === 0) return {};
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}/latest?from=${encodeURIComponent(base)}&to=${encodeURIComponent(quotes.join(","))}`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
    } catch (err) {
      throw new DomainError("PAYMENTS_UPSTREAM", `rate service unreachable (${err instanceof Error ? err.message : String(err)})`, "try again later or enter rates by hand");
    }
    if (!res.ok) throw new DomainError("PAYMENTS_UPSTREAM", `rate service returned ${res.status}`, "try again later or enter rates by hand");
    const data = (await res.json()) as { rates?: Record<string, number> };
    const out: Record<string, number> = {};
    for (const q of quotes) if (typeof data.rates?.[q] === "number") out[q] = data.rates[q]!;
    return out;
  }
}

/** Currency a visitor most likely pays in, from a BCP 47 locale ("en-CA" -> CAD). */
export function currencyForLocale(locale: string | undefined): string | undefined {
  const region = locale?.split(/[-_]/)[1]?.toUpperCase();
  if (!region || region.length !== 2) return undefined;
  return REGION_CURRENCY[region];
}

const EURO = ["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"];
export const REGION_CURRENCY: Record<string, string> = {
  US: "USD", CA: "CAD", GB: "GBP", AU: "AUD", NZ: "NZD", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", BG: "BGN",
  IN: "INR", SG: "SGD", HK: "HKD", JP: "JPY", KR: "KRW", CN: "CNY", AE: "AED", SA: "SAR", ZA: "ZAR", BR: "BRL", MX: "MXN", IL: "ILS", TR: "TRY", TH: "THB", MY: "MYR", PH: "PHP", ID: "IDR",
  ...Object.fromEntries(EURO.map((r) => [r, "EUR"])),
};
