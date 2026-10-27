"use client";

// Payment inside our own page. Stripe's Payment Element renders the card fields in an iframe
// from js.stripe.com, so card numbers never touch Trainyard; everything around it (summary,
// button, the key afterwards) is ours. The server has already created the subscription; this
// confirms its first invoice (or saves a card when a trial defers the charge), then asks the
// server for the sign-in key.

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Appearance, type Stripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, type ApiFailure } from "@/lib/api";

export type Subscription = { purchaseId: string; subscriptionId: string; clientSecret: string; mode: "payment" | "setup"; amountDue: number; recurringAmount?: number; currency: string; trialDays: number; trialEndsAt?: string; guaranteeDays?: number };
export type Claim = { status: string; plan?: string; interval?: string; quantity?: number; name?: string; email?: string; apiKey?: string; claimed?: boolean; workspace?: { id: string; name: string; plan: string; seats: number } };

const APPEARANCE: Appearance = {
  theme: "stripe",
  variables: { fontFamily: "Figtree, system-ui, sans-serif", colorPrimary: "#1f2a36", colorText: "#1f2a36", colorDanger: "#b4232c", borderRadius: "14px", fontSizeBase: "16px" },
  rules: { ".Input": { border: "2px solid #1f2a36", boxShadow: "none", padding: "13px 16px" }, ".Input:focus": { boxShadow: "0 0 0 3px #cfe3fb" }, ".Label": { fontWeight: "700" } },
};

const stripeCache = new Map<string, Promise<Stripe | null>>();
const getStripe = (key: string) => {
  let p = stripeCache.get(key);
  if (!p) {
    p = loadStripe(key);
    stripeCache.set(key, p);
  }
  return p;
};

export const money = (cents: number, currency: string) => new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase(), maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);

/** Asks the server for the key until the payment is reflected (the webhook or Stripe itself). */
export async function claimKey(handle: { purchaseId: string } | { sessionId: string }, attempts = 20, waitMs = 1500): Promise<Claim> {
  let last: Claim = { status: "open" };
  for (let i = 0; i < attempts; i++) {
    last = await api<Claim>("POST", "/v1/billing/claim", handle);
    if (last.status !== "open") return last;
    await new Promise((r) => setTimeout(r, waitMs));
  }
  return last;
}

export function InlinePayment({ publishableKey, sub, email, summary, onPaid, onBack }: { publishableKey: string; sub: Subscription; email: string; summary: string; onPaid: (c: Claim) => void; onBack?: () => void }) {
  const stripePromise = useMemo(() => getStripe(publishableKey), [publishableKey]);
  return (
    <Elements stripe={stripePromise} options={{ clientSecret: sub.clientSecret, appearance: APPEARANCE, loader: "auto" }}>
      <PayForm sub={sub} email={email} summary={summary} onPaid={onPaid} {...(onBack ? { onBack } : {})} />
    </Elements>
  );
}

function PayForm({ sub, email, summary, onPaid, onBack }: { sub: Subscription; email: string; summary: string; onPaid: (c: Claim) => void; onBack?: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<"" | "paying" | "finishing">("");
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => setErr(null), [sub.clientSecret]);

  const pay = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy("paying");
    setErr(null);
    const returnUrl = `${window.location.origin}/welcome?purchase_id=${encodeURIComponent(sub.purchaseId)}`;
    const result =
      sub.mode === "payment"
        ? await stripe.confirmPayment({ elements, confirmParams: { return_url: returnUrl, receipt_email: email }, redirect: "if_required" })
        : await stripe.confirmSetup({ elements, confirmParams: { return_url: returnUrl }, redirect: "if_required" });
    if (result.error) {
      setErr(result.error.message ?? "The payment did not go through.");
      setBusy("");
      return;
    }
    // Paid (or processing, e.g. a bank debit): the server confirms with Stripe and hands over the key.
    setBusy("finishing");
    try {
      onPaid(await claimKey({ purchaseId: sub.purchaseId }));
    } catch (x) {
      setErr((x as ApiFailure).message);
      setBusy("");
    }
  };

  return (
    <form onSubmit={(e) => void pay(e)} className="ly-pay" aria-busy={busy !== ""}>
      <div className="ly-pay-summary">
        <div>
          <div className="k">Subscription</div>
          <div className="v">{summary}</div>
        </div>
        <div>
          <div className="k">Due today</div>
          <div className="v">{sub.trialDays ? money(0, sub.currency) : money(sub.amountDue, sub.currency)}</div>
        </div>
      </div>
      {sub.trialDays ? (
        <p className="ly-fine" style={{ opacity: 1 }}>
          <b>Free for {sub.trialDays} days.</b> From {sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString(undefined, { day: "numeric", month: "long" }) : "then"} it is {money(sub.recurringAmount ?? sub.amountDue, sub.currency)} a month, cancel any time before. Not satisfied in your first paid month? Claim the money back from Plan &amp; billing, no questions.
        </p>
      ) : null}
      <PaymentElement options={{ layout: "tabs", defaultValues: { billingDetails: { email } } }} onReady={() => setReady(true)} />
      {err ? (
        <p className="ly-error" role="alert">
          {err}
        </p>
      ) : null}
      <button type="submit" disabled={!stripe || !ready || busy !== ""}>
        {busy === "paying" ? "Confirming with your bank…" : busy === "finishing" ? "Creating your workspace…" : sub.trialDays ? `Start free trial · ${money(0, sub.currency)} today` : `Pay ${money(sub.amountDue, sub.currency)} and start`}
      </button>
      <p className="ly-fine">
        Processed by Stripe on this page. Month by month, no yearly commitment to start; switch to yearly later from Plan &amp; billing. Cancel any time there. Card details go to Stripe only. By continuing you agree to the{" "}
        <a href="/terms" target="_blank" rel="noopener">
          terms of service
        </a>{" "}
        and the{" "}
        <a href="/privacy" target="_blank" rel="noopener">
          privacy policy
        </a>
        .
      </p>
      {onBack ? (
        <button type="button" className="ly-link" onClick={onBack}>
          ← Change plan or details
        </button>
      ) : null}
    </form>
  );
}
