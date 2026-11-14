"use client";

import { useState } from "react";

type Tier = "me" | "team" | "invoice";

type Props = {
  /** Checkout link for this date, without tier and quantity. */
  checkoutHref: string;
  unitMinor: number;
  currency: string;
  capacity: number;
  left: number;
  invoiceAvailable: boolean;
  paymentMode: "protected" | "direct";
  orgName: string;
};

const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "narrowSymbol" }).format(minor / 100).replace(/[.,]00(?=\D*$)/, "");

/** The register card beside the hero: who is coming, how many seats, and the total. */
export function RegisterCard(p: Props) {
  const free = p.unitMinor === 0;
  const tiers: { id: Tier; name: string; note: string }[] = [
    { id: "me", name: "Just me", note: free ? "Register in about a minute" : "Pay by card in about 2 minutes" },
    { id: "team", name: "My team", note: "Add teammates, one checkout, one receipt" },
    ...(p.invoiceAvailable && !free ? [{ id: "invoice" as const, name: "Invoice my company", note: "Seat held now, pay by PO or invoice" }] : []),
  ];
  const [tier, setTier] = useState<Tier>("me");
  const maxQty = Math.max(1, Math.min(p.left, tier === "invoice" ? 20 : 10));
  const [teamQty, setTeamQty] = useState(Math.min(3, maxQty));
  const qty = tier === "me" ? 1 : Math.min(Math.max(teamQty, 1), maxQty);
  const soldOut = p.left <= 0;
  const cta = soldOut
    ? "Sold out"
    : tier === "invoice"
      ? `Hold ${qty} ${qty === 1 ? "seat" : "seats"} on invoice`
      : qty === 1
        ? "Register — reserve my seat"
        : `Register ${qty} seats`;
  const cells = Math.min(Math.max(p.capacity, 1), 48);
  const taken = p.capacity > 0 ? Math.round(((p.capacity - p.left) / p.capacity) * cells) : 0;
  const href = `${p.checkoutHref}&tier=${tier}&qty=${qty}`;

  return (
    <div className="rx-card rx-reg-in">
      <div className="rx-price">
        {free ? "Free" : money(p.unitMinor, p.currency)}{" "}
        {!free && <small>{p.currency} / seat</small>}
      </div>
      <div>
        <div className="rx-seats-top">
          <strong>{soldOut ? "Sold out" : `${p.left} of ${p.capacity} seats left`}</strong>
          <span className="rx-muted">{p.capacity <= 30 ? "Small cohort" : ""}</span>
        </div>
        <div className="rx-seatgrid" aria-hidden="true">
          {Array.from({ length: cells }, (_, i) => (
            <i key={i} className={i < taken ? "is-taken" : undefined} />
          ))}
        </div>
      </div>
      <fieldset className="rx-tiers">
        <legend className="rx-eyebrow" style={{ marginBottom: 8 }}>
          Who is attending
        </legend>
        {tiers.map((t) => (
          <label key={t.id} className={`rx-tier${tier === t.id ? " is-on" : ""}`}>
            <input type="radio" name="tier" value={t.id} checked={tier === t.id} onChange={() => setTier(t.id)} />
            <span className="dot" aria-hidden="true" />
            <span>
              <b>{t.name}</b>
              <em>{t.note}</em>
            </span>
          </label>
        ))}
      </fieldset>
      {tier !== "me" && (
        <div className="rx-qty">
          <span id="rx-qty-label">Seats</span>
          <div className="rx-stepper">
            <button type="button" aria-label="Remove a seat" onClick={() => setTeamQty(Math.max(1, qty - 1))} disabled={qty <= 1}>
              −
            </button>
            <output aria-labelledby="rx-qty-label" aria-live="polite">
              {qty}
            </output>
            <button type="button" aria-label="Add a seat" onClick={() => setTeamQty(Math.min(maxQty, qty + 1))} disabled={qty >= maxQty}>
              +
            </button>
          </div>
        </div>
      )}
      <div className="rx-total">
        <span>Total</span>
        <strong>{free ? "Free" : `${money(p.unitMinor * qty, p.currency)} ${p.currency}`}</strong>
      </div>
      {!free && <p className="rx-fine">Taxes and any booking fee are shown before you pay.</p>}
      {soldOut ? (
        <span className="rx-btn rx-btn-block" aria-disabled="true">
          Sold out
        </span>
      ) : (
        <a className="rx-btn rx-btn-block" href={href}>
          {cta}
        </a>
      )}
      {!free && (
        <div className="rx-protect">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: "var(--rx-accent)" }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          {p.paymentMode === "direct" ? (
            <span>
              <strong>Secure card payment.</strong> Paid to {p.orgName} through Stripe.
            </span>
          ) : (
            <span>
              <strong>Protected payment.</strong> Held by EnrollClass until the class runs.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
