"use client";

import { useState, useTransition } from "react";
import { StripeFeePayment } from "@/components/stripe-fee-payment";
import { startInvoicePaymentAction } from "@/app/pay/actions";

/** "Pay by card" on a corporate invoice: creates the card payment, then shows Stripe's form. */
export function InvoicePay({ token, publishableKey, amountLabel }: { token: string; publishableKey: string; amountLabel: string }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (secret) return <StripeFeePayment publishableKey={publishableKey} clientSecret={secret} feeLabel={amountLabel} returnPath={`/pay/invoice/${encodeURIComponent(token)}`} />;
  return (
    <>
      <button
        type="button"
        className="btn btn-primary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await startInvoicePaymentAction(token);
            if (r.clientSecret) setSecret(r.clientSecret);
            else setError(r.error ?? "Card payment isn't available right now.");
          })
        }
      >
        {pending ? "Preparing…" : "Pay by card"}
      </button>
      {error && <p className="notice notice-error">{error}</p>}
    </>
  );
}
