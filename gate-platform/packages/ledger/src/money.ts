/**
 * All amounts in the platform are integer minor units (cents, pence, fils).
 * Floating point never touches money.
 */
export type MinorUnits = number;

export type Currency = string; // ISO 4217 upper-case, e.g. "USD", "EUR", "AED"

export class MoneyError extends Error {
  override readonly name = "MoneyError";
}

export function assertMinorUnits(value: unknown, label = "amount"): asserts value is MinorUnits {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new MoneyError(`${label} must be a safe integer in minor units, got ${String(value)}`);
  }
}

export function assertPositiveMinorUnits(value: unknown, label = "amount"): asserts value is MinorUnits {
  assertMinorUnits(value, label);
  if (value <= 0) throw new MoneyError(`${label} must be > 0, got ${value}`);
}

export function assertCurrency(value: unknown, label = "currency"): asserts value is Currency {
  if (typeof value !== "string" || !/^[A-Z]{3}$/.test(value)) {
    throw new MoneyError(`${label} must be a 3-letter ISO 4217 code, got ${String(value)}`);
  }
}

/** Basis-point percentage of an amount, rounded half-up. 250 bps = 2.50%. */
export function bps(amount: MinorUnits, basisPoints: number): MinorUnits {
  assertMinorUnits(amount);
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0) {
    throw new MoneyError(`basis points must be a non-negative integer, got ${basisPoints}`);
  }
  // Integer math only: floor((a*bps + 5000) / 10000) == round-half-up.
  return Math.floor((amount * basisPoints + 5_000) / 10_000);
}

/**
 * Split `total` across weights using the largest-remainder method so the
 * parts always sum exactly to `total`. Weights are non-negative integers.
 */
export function allocate(total: MinorUnits, weights: readonly number[]): MinorUnits[] {
  assertMinorUnits(total, "total");
  if (weights.length === 0) throw new MoneyError("allocate needs at least one weight");
  for (const w of weights) {
    if (!Number.isSafeInteger(w) || w < 0) throw new MoneyError(`weights must be non-negative integers, got ${w}`);
  }
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) throw new MoneyError("weights must not all be zero");
  const sign = total < 0 ? -1 : 1;
  const abs = Math.abs(total);
  const floors = weights.map((w) => Math.floor((abs * w) / sum));
  let remainder = abs - floors.reduce((a, b) => a + b, 0);
  const order = weights
    .map((w, i) => ({ i, frac: (abs * w) % sum }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (remainder === 0) break;
    floors[i] = (floors[i] ?? 0) + 1;
    remainder -= 1;
  }
  return floors.map((v) => v * sign);
}
