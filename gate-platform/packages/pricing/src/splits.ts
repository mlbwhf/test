import { allocate, assertMinorUnits, type MinorUnits } from "@gate/ledger";

/**
 * A split rule routes part of the organizer-side net to another party
 * (venue, co-promoter, vendor, tax reserve). Percent rules are in basis
 * points of the net; fixed rules are per-order minor units. Fixed rules
 * are taken first; percent rules share what remains; the organizer gets
 * the rest. Negative results are impossible: fixed rules are clipped.
 */
export type SplitRule =
  | { partyId: string; kind: "percent"; bps: number; label?: string | undefined }
  | { partyId: string; kind: "fixed"; amountMinor: MinorUnits; label?: string | undefined };

export interface SplitLine {
  partyId: string;
  amountMinor: MinorUnits;
  label?: string;
}

export interface SplitResult {
  organizerMinor: MinorUnits;
  lines: SplitLine[];
}

export function computeSplits(netMinor: MinorUnits, organizerId: string, rules: readonly SplitRule[]): SplitResult {
  assertMinorUnits(netMinor, "netMinor");
  if (netMinor < 0) throw new Error("netMinor must be >= 0");
  const seen = new Set<string>();
  for (const r of rules) {
    if (r.partyId === organizerId) throw new Error("organizer cannot be a split party");
    if (seen.has(r.partyId)) throw new Error(`duplicate split party ${r.partyId}`);
    seen.add(r.partyId);
    if (r.kind === "percent" && (!Number.isSafeInteger(r.bps) || r.bps < 0 || r.bps > 10_000)) {
      throw new Error(`percent rule bps out of range: ${r.bps}`);
    }
    if (r.kind === "fixed") assertMinorUnits(r.amountMinor, `fixed rule ${r.partyId}`);
  }

  const lines: SplitLine[] = [];
  let remaining = netMinor;

  for (const r of rules) {
    if (r.kind !== "fixed") continue;
    const take = Math.min(Math.max(r.amountMinor, 0), remaining);
    remaining -= take;
    lines.push({ partyId: r.partyId, amountMinor: take, ...(r.label ? { label: r.label } : {}) });
  }

  const percentRules = rules.filter((r): r is Extract<SplitRule, { kind: "percent" }> => r.kind === "percent");
  const totalBps = percentRules.reduce((a, r) => a + r.bps, 0);
  if (totalBps > 10_000) throw new Error(`percent rules exceed 100%: ${totalBps} bps`);
  if (percentRules.length > 0 && remaining > 0) {
    // Allocate [party1, party2, ..., organizer-remainder] by weights so rounding never leaks.
    const weights = [...percentRules.map((r) => r.bps), 10_000 - totalBps];
    const parts = allocate(remaining, weights);
    percentRules.forEach((r, i) => {
      lines.push({ partyId: r.partyId, amountMinor: parts[i] ?? 0, ...(r.label ? { label: r.label } : {}) });
    });
    remaining = parts[parts.length - 1] ?? 0;
  }

  return { organizerMinor: remaining, lines };
}
