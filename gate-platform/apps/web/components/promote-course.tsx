"use client";

import { useState, useTransition } from "react";
import { StripeFeePayment } from "@/components/stripe-fee-payment";
import { startPromotionAction } from "@/app/(organizer)/courses/[id]/promote-actions";
import { formatMoney } from "@/lib/format";
import type { PromotionPrices } from "@/lib/api";

type Placement = "category" | "top";

/** Pick a placement and length, then pay by card; the spot goes live when the payment clears. */
export function PromoteCourse({ courseId, prices, publishableKey, topicLabel }: { courseId: string; prices: PromotionPrices; publishableKey: string | null; topicLabel: string }) {
  const [placement, setPlacement] = useState<Placement>("category");
  const [weeks, setWeeks] = useState<1 | 2 | 4>(2);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const price = prices[placement][prices.weeks.indexOf(weeks)] ?? 0;
  const label = formatMoney(price, prices.currency);
  if (secret && publishableKey) return <StripeFeePayment publishableKey={publishableKey} clientSecret={secret} feeLabel={label} returnPath={`/courses/${encodeURIComponent(courseId)}?promoted=1#promote`} />;
  return (
    <div className="promote">
      <fieldset className="promote-options">
        <legend>Where</legend>
        <label className={placement === "category" ? "promote-option is-on" : "promote-option"}>
          <input type="radio" name="placement" checked={placement === "category"} onChange={() => setPlacement("category")} />
          <strong>First in {topicLabel}</strong>
          <span>Top of the list when learners pick this topic. {formatMoney(prices.category[0] ?? 0, prices.currency)}/week.</span>
        </label>
        <label className={placement === "top" ? "promote-option is-on" : "promote-option"}>
          <input type="radio" name="placement" checked={placement === "top"} onChange={() => setPlacement("top")} />
          <strong>Featured</strong>
          <span>A card with your cover image at the top of Find a class, shared with up to 5 others in rotation. {formatMoney(prices.top[0] ?? 0, prices.currency)}/week.</span>
        </label>
      </fieldset>
      <label>
        How long
        <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value) as 1 | 2 | 4)}>
          {prices.weeks.map((w, i) => (
            <option key={w} value={w}>
              {w} week{w === 1 ? "" : "s"} — {formatMoney(prices[placement][i] ?? 0, prices.currency)}
              {w === 4 ? " (4 for the price of 3)" : ""}
            </option>
          ))}
        </select>
      </label>
      <p className="hint">Marked “Sponsored” for learners. Starts the moment the payment clears; bookings from Find a class carry the usual referral fee.</p>
      <button
        type="button"
        className="btn btn-primary"
        disabled={pending || !publishableKey}
        onClick={() =>
          start(async () => {
            setError(null);
            const r = await startPromotionAction({ courseId, placement, weeks });
            if (r.clientSecret) setSecret(r.clientSecret);
            else setError(r.error ?? "Couldn't start the payment.");
          })
        }
      >
        {pending ? "Preparing…" : `Pay ${label} and promote`}
      </button>
      {!publishableKey && <p className="hint">Card payment isn&apos;t configured on this server.</p>}
      {error && <p className="notice notice-error">{error}</p>}
    </div>
  );
}
