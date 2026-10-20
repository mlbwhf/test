import { formatMoney } from "@/lib/format";
import type { Fee } from "@/lib/public-api";

/** Fees as published at launch (USD), used when the API can't be reached. Mirrors packages/pricing. */
export const FALLBACK_USD_FEES: { protected: Fee; direct: Fee } = {
  protected: { bps: 490, fixedMinor: 80, capMinor: null },
  direct: { bps: 150, fixedMinor: 50, capMinor: null },
};

/** "4.9% + $0.80" (and "capped at …" when there is a cap). */
export function feeLabel(fee: Fee, currency: string): string {
  const pct = `${(fee.bps / 100).toFixed(fee.bps % 100 === 0 ? 0 : fee.bps % 10 === 0 ? 1 : 2)}%`;
  const fixed = fee.fixedMinor > 0 ? ` + ${formatMoney(fee.fixedMinor, currency)}` : "";
  const cap = fee.capMinor !== null ? `, capped at ${formatMoney(fee.capMinor, currency)}` : "";
  return `${pct}${fixed}${cap}`;
}

/** The fee on one seat at this price, the way packages/pricing computes it. */
export function feeOn(priceMinor: number, fee: Fee): number {
  if (priceMinor <= 0) return 0;
  const f = Math.round((priceMinor * fee.bps) / 10_000) + fee.fixedMinor;
  return fee.capMinor !== null ? Math.min(f, fee.capMinor) : f;
}
