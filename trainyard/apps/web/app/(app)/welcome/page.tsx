"use client";

// Where Stripe sends people after paying. Picks the API key up from the server once (the
// server forgets it after that), shows it with a copy button and signs the browser in.

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CopyKey } from "@/components/copy-key";
import { api, setApiKey, type ApiFailure } from "@/lib/api";

type Claim = { status: "open" | "paid" | "expired" | "past_due" | "cancelled"; plan?: string; interval?: string; quantity?: number; name?: string; email?: string; apiKey?: string; claimed?: boolean };

export default function WelcomePage() {
  return (
    <Suspense>
      <Welcome />
    </Suspense>
  );
}

function Welcome() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const purchaseId = params.get("purchase_id");
  const handle = purchaseId ? { purchaseId } : sessionId ? { sessionId } : null;
  const [claim, setClaim] = useState<Claim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!handle) return;
    let cancelled = false;
    // The server hands the key over once; keep it for this tab so a repeat request or a refresh still shows it.
    const slot = `trainyard.welcome.${purchaseId ?? sessionId}`;
    api<Claim>("POST", "/v1/billing/claim", handle)
      .then((c) => {
        try {
          if (c.apiKey) sessionStorage.setItem(slot, c.apiKey);
          else if (c.claimed && sessionStorage.getItem(slot)) c = { ...c, apiKey: sessionStorage.getItem(slot)!, claimed: false };
        } catch {
          /* storage blocked: the key shows on this load only */
        }
        if (cancelled) return;
        setClaim(c);
        // The webhook can arrive a few seconds after the redirect: ask again while the session is open.
        if (c.status === "open" && tries < 30) setTimeout(() => !cancelled && setTries((t) => t + 1), 2000);
      })
      .catch((x: ApiFailure) => !cancelled && setError(x.message));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, purchaseId, tries]);

  if (!handle)
    return (
      <div style={{ maxWidth: 520, margin: "60px auto" }} className="stack">
        <h1>Welcome</h1>
        <p className="muted">This page expects to be opened from the payment confirmation. If you already have a key, <Link href="/login">sign in</Link>.</p>
      </div>
    );
  return (
    <div style={{ maxWidth: 520, margin: "60px auto" }} className="stack">
      <h1>{claim?.name ? `Welcome, ${claim.name}.` : "Welcome"}</h1>
      {error ? <p className="error">{error}</p> : null}
      {!claim && !error ? <p className="muted">Checking your payment…</p> : null}
      {claim?.status === "open" ? <p className="muted">Waiting for Stripe to confirm the payment. This usually takes a few seconds.</p> : null}
      {claim?.status === "past_due" || claim?.status === "cancelled" ? <p>This subscription is {claim.status === "past_due" ? "past due" : "cancelled"}. Sign in and open Users → Manage subscription to update the card.</p> : null}
      {claim?.status === "expired" ? (
        <p>
          That payment session expired before it was paid. <Link href="/#join">Start again</Link>.
        </p>
      ) : null}
      {claim?.status === "paid" && claim.apiKey ? (
        <div className="panel panel-body stack">
          <p>
            Your <strong>{claim.plan}</strong> plan ({claim.interval}
            {claim.quantity && claim.quantity > 1 ? `, ${claim.quantity} seats` : ""}) is active. From now on, sign in with your email and the password you chose at sign-up. The key below is for scripts and integrations; it is shown once, so store it in a password manager.
          </p>
          <CopyKey value={claim.apiKey} />
          <button
            className="btn primary"
            onClick={() => {
              setApiKey(claim.apiKey!);
              window.location.assign("/dashboards");
            }}
          >
            Sign in on this browser
          </button>
          <p className="muted">
            Forgot the password later? Use “Forgot your password?” on Sign in. A new key can be issued under Users.
          </p>
        </div>
      ) : null}
      {claim?.status === "paid" && claim.claimed ? (
        <div className="panel panel-body stack">
          <p style={{ margin: 0 }}>Your workspace is ready. Sign in with your email{claim.email ? ` (${claim.email})` : ""} and the password you chose at sign-up.</p>
          <div>
            <Link className="btn primary" href="/login">
              Sign in
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
