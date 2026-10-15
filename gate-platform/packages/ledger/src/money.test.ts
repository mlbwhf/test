import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { allocate, bps, MoneyError } from "./money.js";

describe("bps", () => {
  it("rounds half up", () => {
    expect(bps(10_000, 250)).toBe(250); // 2.5% of $100.00
    expect(bps(1, 5_000)).toBe(1); // 0.5 rounds up to 1
    expect(bps(3, 2_500)).toBe(1); // 0.75 -> 1
    expect(bps(999, 290)).toBe(29); // 28.971 -> 29
  });
  it("rejects non-integer money", () => {
    expect(() => bps(10.5, 100)).toThrow(MoneyError);
  });
});

describe("allocate", () => {
  it("splits exactly with largest remainder", () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocate(10, [7000, 3000])).toEqual([7, 3]);
    expect(allocate(-100, [1, 1, 1])).toEqual([-34, -33, -33]);
  });
  it("always sums to the total", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }),
        fc.array(fc.integer({ min: 0, max: 10_000 }), { minLength: 1, maxLength: 8 }).filter((w) =>
          w.some((x) => x > 0),
        ),
        (total, weights) => {
          const parts = allocate(total, weights);
          expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
          expect(parts.length).toBe(weights.length);
        },
      ),
    );
  });
});
