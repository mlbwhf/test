import { bps, type MinorUnits } from "@gate/ledger";
import type { TaxPort } from "./ports.js";

/**
 * Flat-rate tax table for live training. Good enough to launch in the
 * corridors we operate in; a real engine (Stripe Tax, Avalara) replaces it
 * through the same port without touching order code. Rates are in basis
 * points. Place-of-supply rules differ per jurisdiction; this table encodes
 * the common case (tax where the buyer is, B2B reverse charge across
 * borders when the buyer supplies a tax id) and must be reviewed by counsel.
 */
const CA_PROVINCES: Record<string, number> = { ON: 1_300, NB: 1_500, NL: 1_500, NS: 1_500, PE: 1_500, QC: 1_498 /* 14.975% GST+QST, rounded to whole bps */, BC: 1_200, AB: 500, SK: 1_100, MB: 1_200, NT: 500, NU: 500, YT: 500 };
const COUNTRY_RATES: Record<string, number> = { GB: 2_000, AE: 500, SA: 1_500, ZA: 1_500, IN: 1_800, IE: 2_300, DE: 1_900, FR: 2_000, NL: 2_100, LT: 2_100, ES: 2_100, IT: 2_200, BE: 2_100, PL: 2_300, SE: 2_500, DK: 2_500, FI: 2_550, AT: 2_000, PT: 2_300, CZ: 2_100 };
const EU = new Set(["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE"]);

export class FlatRateTax implements TaxPort {
  readonly provider = "flat-rate";
  async calculate(input: Parameters<TaxPort["calculate"]>[0]) {
    const seller = input.sellerCountry.toUpperCase();
    const buyerCountry = input.buyer.country.toUpperCase();
    const crossBorder = seller !== buyerCountry;
    const bothEu = EU.has(seller) && EU.has(buyerCountry);
    // B2B reverse charge: cross-border within the EU, or UK/EU business buyers with a tax id.
    if (crossBorder && input.businessCustomer && input.buyer.taxId && (bothEu || EU.has(buyerCountry) || buyerCountry === "GB")) {
      return { taxMinor: 0, rateBps: 0, jurisdiction: `${buyerCountry} reverse charge`, reverseCharge: true };
    }
    // Canadian sellers charge GST/HST by the buyer's province; foreign buyers of live services: zero-rated.
    if (seller === "CA") {
      if (buyerCountry !== "CA") return { taxMinor: 0, rateBps: 0, jurisdiction: "CA export (zero-rated)", reverseCharge: false };
      const rate = CA_PROVINCES[(input.buyer.region ?? "").toUpperCase()] ?? 500;
      return { taxMinor: bps(input.amountMinor, rate), rateBps: rate, jurisdiction: `CA-${(input.buyer.region ?? "GST").toUpperCase()}`, reverseCharge: false };
    }
    // US: live training is generally not taxable at the federal level; state rules vary. Not calculated here.
    if (seller === "US") return { taxMinor: 0, rateBps: 0, jurisdiction: "US (not calculated)", reverseCharge: false };
    // Everyone else: destination country rate when selling domestically or to consumers in a known jurisdiction.
    const rate = COUNTRY_RATES[crossBorder ? buyerCountry : seller] ?? (crossBorder ? 0 : COUNTRY_RATES[seller] ?? 0);
    return { taxMinor: bps(input.amountMinor, rate), rateBps: rate, jurisdiction: crossBorder ? buyerCountry : seller, reverseCharge: false };
  }
}

export const NO_TAX: TaxPort = { provider: "none", async calculate() { return { taxMinor: 0 as MinorUnits, rateBps: 0, jurisdiction: "none", reverseCharge: false }; } };
