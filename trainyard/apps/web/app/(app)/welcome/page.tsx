"use client";

// Where Stripe sends people after paying. Picks the API key up from the server once (the
// server forgets it after that), shows it with a copy button and signs the browser in.

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CopyKey } from "@/components/copy-key";
import { api, setApiKey, type ApiFailure } from "@/lib/api";

type Claim = { status: "open" | "paid" | "expired"; plan?: string; interval?: string; quantity?: number; name?: string; email?: string; apiKey?: string; claimed?: boolean };

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
  const [claim, setClaim] = useState<Claim | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    api<Claim>("POST", "/v1/billing/claim", { sessionId })
      .then((c) => {
        if (cancelled) return;
        setClaim(c);
        // The webhook can arrive a few seconds after the redirect: ask again while the session is open.
        if (c.status === "open" && tries < 30) setTimeout(() => !cancelled && setTries((t) => t + 1), 2000);
      })
      .catch((x: ApiFailure) => !cancelled && setError(x.message));
    return () => {
      cancelled = true;
    };
  }, [sessionId, tries]);

  if (!sessionId)
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
      {claim?.status === "expired" ? (
        <p>
          That payment session expired before it was paid. <Link href="/#join">Start again</Link>.
        </p>
      ) : null}
      {claim?.status === "paid" && claim.apiKey ? (
        <div className="panel panel-body stack">
          <p>
            Your <strong>{claim.plan}</strong> plan ({claim.interval}
            {claim.quantity && claim.quantity > 1 ? `, ${claim.quantity} seats` : ""}) is active. This is your sign-in key. It is shown once; store it in a password manager.
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
            Lost it later? An admin can issue a new key under Users, or write to us with the email you paid with ({claim.email}).
          </p>
        </div>
      ) : null}
      {claim?.status === "paid" && claim.claimed ? (
        <p>
          The key for this payment was already shown. If it is in this browser, <Link href="/dashboards">continue</Link>; otherwise <Link href="/login">sign in</Link> with it or ask for a new one.
        </p>
      ) : null}
    </div>
  );
}
