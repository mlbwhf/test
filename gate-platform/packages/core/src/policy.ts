import { bps, type MinorUnits } from "@gate/ledger";

/**
 * Change policy for seats: what a learner may do and what it costs, as a
 * function of days before the cohort starts. Organizers set one per
 * organization and may override it per course.
 */
export interface ChangePolicy {
  /** Transfers to another cohort are free until this many days before start. */
  transferFreeUntilDays: number;
  /** Fee after the free window, in basis points of the seat's unit price. */
  transferFeeBps: number;
  /** Transfers are not allowed within this many days of start (0 = allowed up to start). */
  transferCutoffDays: number;
  /** Full refund until this many days before start. */
  cancelFullRefundUntilDays: number;
  /** Partial refund share (bps) between the full-refund window and the cutoff. */
  cancelPartialRefundBps: number;
  /** No refund within this many days of start. Cancellation still allowed (releases the seat). */
  cancelNoRefundWithinDays: number;
  substituteAllowed: boolean;
  /** Substitutes allowed until this many hours before start. */
  substituteCutoffHours: number;
  /** Hours a waitlist offer stays open. */
  waitlistOfferHours: number;
}

export const DEFAULT_CHANGE_POLICY: ChangePolicy = {
  transferFreeUntilDays: 7,
  transferFeeBps: 1_500,
  transferCutoffDays: 0,
  cancelFullRefundUntilDays: 14,
  cancelPartialRefundBps: 5_000,
  cancelNoRefundWithinDays: 7,
  substituteAllowed: true,
  substituteCutoffHours: 24,
  waitlistOfferHours: 24,
};

const DAY = 86_400_000;

export function daysBefore(startsAt: Date, now: Date): number {
  return (startsAt.getTime() - now.getTime()) / DAY;
}

export interface TransferTerms { allowed: boolean; feeMinor: MinorUnits; freeUntil: Date; reason?: string }
export interface CancelTerms { allowed: boolean; refundBps: number; refundMinor: MinorUnits; fullRefundUntil: Date; reason?: string }
export interface SubstituteTerms { allowed: boolean; until: Date; reason?: string }

export function transferTerms(policy: ChangePolicy, startsAt: Date, now: Date, unitPriceMinor: MinorUnits, cohortEnded: boolean): TransferTerms {
  const freeUntil = new Date(startsAt.getTime() - policy.transferFreeUntilDays * DAY);
  const days = daysBefore(startsAt, now);
  if (cohortEnded || days < 0) return { allowed: false, feeMinor: 0, freeUntil, reason: "the cohort has already started" };
  if (days < policy.transferCutoffDays) return { allowed: false, feeMinor: 0, freeUntil, reason: `transfers close ${policy.transferCutoffDays} days before the cohort` };
  const feeMinor = days >= policy.transferFreeUntilDays ? 0 : bps(unitPriceMinor, policy.transferFeeBps);
  return { allowed: true, feeMinor, freeUntil };
}

export function cancelTerms(policy: ChangePolicy, startsAt: Date, now: Date, seatValueMinor: MinorUnits, cohortEnded: boolean): CancelTerms {
  const fullRefundUntil = new Date(startsAt.getTime() - policy.cancelFullRefundUntilDays * DAY);
  const days = daysBefore(startsAt, now);
  if (cohortEnded || days < 0) return { allowed: false, refundBps: 0, refundMinor: 0, fullRefundUntil, reason: "the cohort has already started" };
  const refundBps = days >= policy.cancelFullRefundUntilDays ? 10_000 : days >= policy.cancelNoRefundWithinDays ? policy.cancelPartialRefundBps : 0;
  return { allowed: true, refundBps, refundMinor: bps(seatValueMinor, refundBps), fullRefundUntil };
}

export function substituteTerms(policy: ChangePolicy, startsAt: Date, now: Date, cohortEnded: boolean): SubstituteTerms {
  const until = new Date(startsAt.getTime() - policy.substituteCutoffHours * 3_600_000);
  if (!policy.substituteAllowed) return { allowed: false, until, reason: "this organizer does not allow substitutions" };
  if (cohortEnded || now >= until) return { allowed: false, until, reason: `substitutions close ${policy.substituteCutoffHours} hours before the cohort` };
  return { allowed: true, until };
}
