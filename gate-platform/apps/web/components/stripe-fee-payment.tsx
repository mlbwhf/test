"use client";

// Minimal Stripe Payment Element for the transfer fee. Stripe.js is loaded
// from js.stripe.com at runtime (no npm dependency); only the handful of
// methods used here are typed.

import { useEffect, useRef, useState } from "react";

type PaymentElement = { mount(el: HTMLElement): void; unmount(): void };
type StripeElements = { create(type: "payment"): PaymentElement };
type StripeInstance = {
  elements(options: { clientSecret: string }): StripeElements;
  confirmPayment(options: {
    elements: StripeElements;
    confirmParams: { return_url: string };
  }): Promise<{ error?: { message?: string } }>;
};

declare global {
  interface Window {
    Stripe?: (publishableKey: string) => StripeInstance;
  }
}

const STRIPE_JS = "https://js.stripe.com/v3/";

function loadStripeJs(): Promise<void> {
  if (window.Stripe) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${STRIPE_JS}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Could not load Stripe.js")));
    if (!existing) {
      script.src = STRIPE_JS;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

type Props = {
  publishableKey: string;
  clientSecret: string;
  /** Pre-formatted fee, e.g. "CA$50.00". */
  feeLabel: string;
  /** Path (on this site) Stripe sends the learner back to after payment. */
  returnPath: string;
};

export function StripeFeePayment({ publishableKey, clientSecret, feeLabel, returnPath }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<StripeInstance | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let element: PaymentElement | null = null;
    let cancelled = false;
    loadStripeJs()
      .then(() => {
        if (cancelled || !window.Stripe || !mountRef.current) return;
        const stripe = window.Stripe(publishableKey);
        const elements = stripe.elements({ clientSecret });
        element = elements.create("payment");
        element.mount(mountRef.current);
        stripeRef.current = stripe;
        elementsRef.current = elements;
        setReady(true);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
      element?.unmount();
    };
  }, [publishableKey, clientSecret]);

  async function pay() {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}${returnPath}` },
    });
    // On success Stripe navigates to return_url; we only get here on failure.
    if (confirmError) setError(confirmError.message ?? "Payment failed.");
    setBusy(false);
  }

  return (
    <div className="payment-box">
      <div ref={mountRef} />
      {error && (
        <div className="result result-error" role="alert">
          <p className="result-message">{error}</p>
        </div>
      )}
      <button type="button" className="btn btn-primary" onClick={pay} disabled={!ready || busy} aria-busy={busy}>
        {busy ? "Paying…" : `Pay ${feeLabel}`}
      </button>
    </div>
  );
}
