import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { instantPayoutFee, priceOrder } from "./pricing.js";
import { computeSplits } from "./splits.js";

describe("priceOrder (USD launch schedule)", () => {
  it("$100 ticket to a gate account: 2.5% + $0.50 = $3.00", () => {
    const p = priceOrder({ currency: "USD", unitPriceMinor: 10_000, quantity: 1, destination: "gate_account" });
    expect(p.platformFeeMinor).toBe(300);
    expect(p.totalMinor).toBe(10_000);
    expect(p.organizerNetMinor).toBe(9_700);
  });
  it("caps at $5 per ticket for expensive courses", () => {
    const p = priceOrder({ currency: "USD", unitPriceMinor: 129_900, quantity: 2, destination: "gate_account" });
    expect(p.perTicketFeeMinor).toBe(500);
    expect(p.platformFeeMinor).toBe(1_000);
  });
  it("external bank payout is 2.9% + $0.30 + $0.75", () => {
    const p = priceOrder({ currency: "USD", unitPriceMinor: 10_000, quantity: 1, destination: "external_bank" });
    expect(p.platformFeeMinor).toBe(290 + 105);
  });
  it("pass-fee-to-attendee charges the buyer and keeps organizer whole", () => {
    const p = priceOrder({ currency: "USD", unitPriceMinor: 5_000, quantity: 3, destination: "gate_account", passFeeToAttendee: true });
    expect(p.perTicketFeeMinor).toBe(125 + 50);
    expect(p.attendeeFeeMinor).toBe(175 * 3);
    expect(p.totalMinor).toBe(15_000 + 525);
    expect(p.organizerNetMinor).toBe(15_000);
  });
  it("free tickets carry no fee", () => {
    const p = priceOrder({ currency: "USD", unitPriceMinor: 0, quantity: 10, destination: "external_bank" });
    expect(p.platformFeeMinor).toBe(0);
    expect(p.totalMinor).toBe(0);
  });
  it("an absorbed fee never exceeds the ticket price", () => {
    const p = priceOrder({ currency: "USD", unitPriceMinor: 25, quantity: 1, destination: "gate_account" });
    expect(p.platformFeeMinor).toBe(25);
    expect(p.organizerNetMinor).toBe(0);
    const passed = priceOrder({ currency: "USD", unitPriceMinor: 25, quantity: 1, destination: "gate_account", passFeeToAttendee: true });
    expect(passed.platformFeeMinor).toBe(51);
    expect(passed.organizerNetMinor).toBe(25);
  });
  it("POS channel is 2.4% + $0.10", () => {
    const p = priceOrder({ currency: "USD", unitPriceMinor: 1_000, quantity: 1, destination: "gate_account", channel: "pos" });
    expect(p.platformFeeMinor).toBe(24 + 10);
  });
  it("instant payout fee is 1% with a $0.50 floor", () => {
    expect(instantPayoutFee(1_000, "USD")).toBe(50);
    expect(instantPayoutFee(100_000, "USD")).toBe(1_000);
  });
  it("invariant: total == organizerNet + platformFee, organizerNet >= subtotal - platformFee", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5_000_000 }),
        fc.integer({ min: 1, max: 50 }),
        fc.constantFrom("gate_account", "external_bank"),
        fc.boolean(),
        fc.constantFrom("USD", "EUR", "AED"),
        (price, qty, dest, pass, ccy) => {
          const p = priceOrder({ currency: ccy, unitPriceMinor: price, quantity: qty, destination: dest, passFeeToAttendee: pass });
          expect(p.totalMinor).toBe(p.organizerNetMinor + p.platformFeeMinor);
          expect(p.platformFeeMinor).toBeGreaterThanOrEqual(0);
          expect(p.organizerNetMinor).toBeGreaterThanOrEqual(0);
          if (pass) expect(p.organizerNetMinor).toBe(p.subtotalMinor);
        },
      ),
    );
  });
});

describe("computeSplits", () => {
  it("fixed first, then percent, organizer gets the rest", () => {
    const r = computeSplits(10_000, "org", [
      { partyId: "tax", kind: "fixed", amountMinor: 1_000 },
      { partyId: "venue", kind: "percent", bps: 2_000 },
    ]);
    expect(r.lines).toEqual([
      { partyId: "tax", amountMinor: 1_000 },
      { partyId: "venue", amountMinor: 1_800 },
    ]);
    expect(r.organizerMinor).toBe(7_200);
  });
  it("clips fixed rules to the available net", () => {
    const r = computeSplits(500, "org", [{ partyId: "tax", kind: "fixed", amountMinor: 1_000 }]);
    expect(r.lines[0]?.amountMinor).toBe(500);
    expect(r.organizerMinor).toBe(0);
  });
  it("rejects >100% and duplicates", () => {
    expect(() => computeSplits(1, "org", [{ partyId: "a", kind: "percent", bps: 6_000 }, { partyId: "b", kind: "percent", bps: 5_000 }])).toThrow();
    expect(() => computeSplits(1, "org", [{ partyId: "a", kind: "percent", bps: 10 }, { partyId: "a", kind: "percent", bps: 10 }])).toThrow();
  });
  it("invariant: lines + organizer == net, nothing negative", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }),
        fc.array(fc.integer({ min: 0, max: 3_000 }), { maxLength: 3 }),
        fc.array(fc.integer({ min: 0, max: 100_000 }), { maxLength: 2 }),
        (net, pct, fixed) => {
          const rules = [
            ...fixed.map((a, i) => ({ partyId: `f${i}`, kind: "fixed" as const, amountMinor: a })),
            ...pct.map((b, i) => ({ partyId: `p${i}`, kind: "percent" as const, bps: b })),
          ];
          const r = computeSplits(net, "org", rules);
          const sum = r.lines.reduce((a, l) => a + l.amountMinor, 0) + r.organizerMinor;
          expect(sum).toBe(net);
          expect(r.organizerMinor).toBeGreaterThanOrEqual(0);
          for (const l of r.lines) expect(l.amountMinor).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });
});
