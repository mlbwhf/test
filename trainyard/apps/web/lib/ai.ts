import type { GateResult, Initiative, SpendSummary } from "@trainyard/ai-portfolio";

export type InitiativeView = Initiative & { stageLabel: string; spend: SpendSummary; valueRealised: number | null; nextGate: GateResult | null };

export const TIER_CHIP: Record<string, string> = { high: "crit", limited: "warn", minimal: "ok", prohibited: "crit" };
