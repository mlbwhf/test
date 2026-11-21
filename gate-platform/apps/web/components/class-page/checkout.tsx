"use client";

import { Logo } from "@/components/brand";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COMMON_ZONES, detectedZone, zoneName } from "@/lib/class-time";
import { loadTurnstile } from "@/components/turnstile-field";
import { rxMoney } from "@/components/class-page/shared";

type TicketOption = { id: string; name: string; priceMinor: number; remaining: number; regularMinor?: number };
type Person = { name: string; email: string; jobTitle: string; timeZone: string };
type Pricing = { subtotalMinor: number; attendeeFeeMinor: number; taxMinor: number; totalMinor: number; flexibleMinor?: number; unitPriceMinor: number; quantity: number };
type ApiError = { message: string; hint?: string };

type Props = {
  api: string;
  orgId: string;
  classHref: string;
  registeredBase: string;
  course: { name: string; durationDays: number | null };
  orgName: string;
  orgCountry: string;
  dates: string;
  times: string;
  where: string;
  instructors: string[];
  sessionCount: number;
  classZone: string;
  currency: string;
  ticketTypes: TicketOption[];
  invoiceAvailable: boolean;
  flexibleOffered: boolean;
  paymentMode: "protected" | "direct";
  stripePk: string | null;
  turnstileSiteKey: string | null;
  initialTier: "me" | "team" | "invoice";
  initialQty: number;
  seatsLeft: number;
  /** sessionStorage key the class page sets when the visitor came from Find a class (?via=enrollclass). */
  viaKey: string;
  /** The marketing homepage (enrollclass.com), where the logo leads. */
  homeUrl: string;
  /** The organizer's sale running now (ticket prices already include it). */
  sale: { label: string; percentOff: number } | null;
  /** Direct payments: the organizer's own Stripe account, where the card form and charge live. */
  stripeAccount: string | null;
};

type StripePaymentElement = { mount(el: HTMLElement): void; unmount(): void; on(event: "ready", cb: () => void): void };
type StripeElements = { create(type: "payment"): StripePaymentElement; submit(): Promise<{ error?: { message?: string } }>; update(o: { amount: number }): void };
type StripeLike = {
  // The card form shows before the order exists (Stripe's deferred-intent flow); the order's PaymentIntent confirms it.
  elements(o: { mode: "payment"; amount: number; currency: string; appearance?: Record<string, unknown> }): StripeElements;
  confirmPayment(o: { elements: StripeElements; clientSecret: string; redirect: "if_required"; confirmParams: { return_url: string } }): Promise<{ error?: { message?: string } }>;
};
type StripeFactory = (pk: string, o?: { stripeAccount?: string }) => StripeLike;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRIES: [string, string][] = [
  ["US", "United States"], ["CA", "Canada"], ["GB", "United Kingdom"], ["IE", "Ireland"], ["AU", "Australia"], ["NZ", "New Zealand"],
  ["DE", "Germany"], ["FR", "France"], ["NL", "Netherlands"], ["BE", "Belgium"], ["ES", "Spain"], ["IT", "Italy"], ["CH", "Switzerland"],
  ["SE", "Sweden"], ["DK", "Denmark"], ["NO", "Norway"], ["FI", "Finland"], ["PL", "Poland"], ["PT", "Portugal"], ["IN", "India"],
  ["SG", "Singapore"], ["AE", "United Arab Emirates"], ["SA", "Saudi Arabia"], ["ZA", "South Africa"], ["BR", "Brazil"], ["MX", "Mexico"],
];

function loadStripe(): Promise<StripeFactory> {
  const w = window as unknown as { Stripe?: StripeFactory };
  if (w.Stripe) return Promise.resolve(w.Stripe);
  return new Promise((resolve, reject) => {
    const src = "https://js.stripe.com/v3/";
    const s = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`) ?? document.createElement("script");
    s.addEventListener("load", () => (w.Stripe ? resolve(w.Stripe) : reject(new Error("Stripe.js did not load"))));
    s.addEventListener("error", () => reject(new Error("Stripe.js did not load")));
    if (!s.src) {
      s.src = src;
      s.async = true;
      document.head.append(s);
    }
  });
}

async function call<T>(url: string, init: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: ApiError }> {
  try {
    const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init.headers ?? {}) } });
    const body = (await res.json().catch(() => null)) as { error?: ApiError } | null;
    if (!res.ok) return { ok: false, error: body?.error ?? { message: `Something went wrong (${res.status}). Please try again.` } };
    return { ok: true, data: body as T };
  } catch {
    return { ok: false, error: { message: "We couldn't reach EnrollClass. Check your connection and try again." } };
  }
}

const blank = (timeZone: string): Person => ({ name: "", email: "", jobTitle: "", timeZone });

/** Idempotency key for one checkout attempt (randomUUID needs HTTPS; fall back to random bytes). */
function attemptId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

export function Checkout(p: Props) {
  // Bookings that start in EnrollClass's class finder carry the marketplace referral.
  const [fromFinder, setFromFinder] = useState(false);
  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("via") === "enrollclass") window.sessionStorage.setItem(p.viaKey, "marketplace");
      setFromFinder(window.sessionStorage.getItem(p.viaKey) === "marketplace");
    } catch {
      setFromFinder(new URLSearchParams(window.location.search).get("via") === "enrollclass");
    }
  }, [p.viaKey]);
  const [zone, setZone] = useState(p.classZone);
  const maxSeats = Math.max(1, Math.min(p.seatsLeft, 20));
  const [people, setPeople] = useState<Person[]>(() => Array.from({ length: p.initialQty }, () => blank(p.classZone)));
  const [touched, setTouched] = useState(false);
  const canInvoice = p.invoiceAvailable && (p.ticketTypes[0]?.priceMinor ?? 0) > 0;
  const [method, setMethod] = useState<"card" | "invoice">(p.initialTier === "invoice" && canInvoice ? "invoice" : "card");
  const [ticketId, setTicketId] = useState(p.ticketTypes[0]?.id ?? "");
  const [flexible, setFlexible] = useState(false);
  const [receipt, setReceipt] = useState("");
  const [inv, setInv] = useState({ company: "", po: "", ap: "", country: p.orgCountry || "US" });
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);
  const [placed, setPlaced] = useState<{ orderId: string; buyerEmail: string; clientSecret: string | null; stripeAccount: string | null; paymentRef: string | null } | null>(null);
  const [payReady, setPayReady] = useState(false);
  const [challenge, setChallenge] = useState("");
  const payBox = useRef<HTMLDivElement>(null);
  const challengeBox = useRef<HTMLDivElement>(null);
  const challengeId = useRef<string | undefined>(undefined);
  const stripeRef = useRef<{ stripe: StripeLike; elements: StripeElements } | null>(null);
  const idem = useRef<string>("");

  const ticket = p.ticketTypes.find((t) => t.id === ticketId) ?? p.ticketTypes[0];
  const unit = ticket?.priceMinor ?? 0;
  const free = unit === 0;
  const n = people.length;

  // The learner's own zone, once the browser can tell us.
  useEffect(() => {
    const d = detectedZone();
    if (!d) return;
    setZone(d);
    setPeople((list) => list.map((x) => (x.timeZone === p.classZone ? { ...x, timeZone: d } : x)));
  }, [p.classZone]);
  const zones = useMemo(() => {
    const list = COMMON_ZONES.map((z) => ({ id: z.id, label: `${z.label} time` }));
    for (const extra of [zone, p.classZone]) if (!list.some((z) => z.id === extra)) list.unshift({ id: extra, label: `${zoneName(extra)} time` });
    return list.map((z) => (z.id === zone ? { ...z, label: `${z.label} (detected)` } : z));
  }, [zone, p.classZone]);

  // Live price (fees and tax included) whenever seats or the flexible ticket change.
  const quote = useCallback(async () => {
    if (!ticket) return;
    const r = await call<{ order: { pricing: Pricing } }>(`${p.api}/public/v1/organizations/${encodeURIComponent(p.orgId)}/orders`, {
      method: "POST",
      body: JSON.stringify({ ticketTypeId: ticket.id, quantity: n, currency: p.currency, buyerEmail: "quote@enrollclass.invalid", dryRun: true, ...(flexible ? { flexible: true } : {}), ...(fromFinder ? { source: "marketplace" } : {}) }),
    });
    if (r.ok) setPricing(r.data.order.pricing);
  }, [p.api, p.orgId, p.currency, ticket, n, flexible, fromFinder]);
  useEffect(() => {
    const t = setTimeout(() => void quote(), 250);
    return () => clearTimeout(t);
  }, [quote]);

  // Turnstile beside the payment details, when the site runs it.
  useEffect(() => {
    if (!p.turnstileSiteKey || !challengeBox.current || challengeId.current) return;
    let gone = false;
    loadTurnstile()
      .then((t) => {
        if (gone || !challengeBox.current) return;
        challengeId.current = t.render(challengeBox.current, { sitekey: p.turnstileSiteKey!, action: "register", theme: "light", callback: (tok) => setChallenge(tok), "expired-callback": () => setChallenge(""), "error-callback": () => setChallenge("") });
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, [p.turnstileSiteKey]);
  const freshChallenge = () => {
    setChallenge("");
    if (challengeId.current) window.turnstile?.reset(challengeId.current);
  };

  const setPerson = (i: number, patch: Partial<Person>) => setPeople((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const peopleOk = people.every((x) => x.name.trim().length >= 2 && EMAIL_RE.test(x.email.trim()));
  const emailsUnique = new Set(people.map((x) => x.email.trim().toLowerCase())).size === people.length;
  const registeredHref = (orderId: string, email: string) => `${p.registeredBase}?order=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`;
  const attendees = () =>
    people.map((x) => ({
      email: x.email.trim(),
      name: x.name.trim(),
      ...(x.jobTitle.trim() ? { jobTitle: x.jobTitle.trim() } : {}),
      ...(x.timeZone ? { timeZone: x.timeZone } : {}),
    }));

  /** Attendee details are filled in on the same page as payment; check them before placing anything. */
  const attendeesOk = () => {
    setTouched(true);
    if (!peopleOk) {
      setError({ message: "Enter a full name and a work email for every attendee." });
      document.getElementById("co-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return false;
    }
    if (!emailsUnique) {
      setError({ message: "Each attendee needs their own email address." });
      return false;
    }
    return true;
  };

  type Placed = { orderId: string; buyerEmail: string; clientSecret: string | null; stripeAccount: string | null; paymentRef: string | null };
  /** Creates the order (once per attempt). Free seats are confirmed straight away and leave the page. */
  const createOrder = async (): Promise<Placed | null> => {
    const buyer = (receipt || people[0]!.email).trim();
    if (!EMAIL_RE.test(buyer)) {
      setError({ message: "Enter the email the receipt goes to." });
      return null;
    }
    if (p.turnstileSiteKey && !challenge) {
      setError({ message: "Please wait for the browser check to finish, then try again." });
      return null;
    }
    idem.current ||= attemptId();
    const r = await call<{ order: { id: string; status: string; paymentRef: string | null }; clientSecret: string | null; stripeAccount: string | null }>(`${p.api}/public/v1/organizations/${encodeURIComponent(p.orgId)}/orders`, {
      method: "POST",
      headers: { "idempotency-key": idem.current },
      body: JSON.stringify({ ticketTypeId: ticket!.id, quantity: n, currency: p.currency, buyerEmail: buyer, attendees: attendees(), ...(flexible ? { flexible: true } : {}), ...(fromFinder ? { source: "marketplace" } : {}), ...(challenge ? { turnstileToken: challenge } : {}) }),
    });
    freshChallenge();
    if (!r.ok) {
      setError(r.error);
      return null;
    }
    const o = r.data;
    if (o.order.status === "paid") {
      window.location.assign(registeredHref(o.order.id, buyer));
      return null;
    }
    const next = { orderId: o.order.id, buyerEmail: buyer, clientSecret: o.clientSecret, stripeAccount: o.stripeAccount, paymentRef: o.order.paymentRef };
    setPlaced(next);
    return next;
  };

  /** One click: check attendees and card, create the order, charge the card (or, in test mode, simulate it). */
  const payNow = async () => {
    setError(null);
    if (!attendeesOk()) return;
    setBusy(true);
    try {
      const sx = stripeRef.current;
      if (p.stripePk && !free) {
        if (!sx) return setError({ message: "The secure card form is still loading. Give it a second and try again." });
        const checked = await sx.elements.submit();
        if (checked.error) return setError({ message: checked.error.message ?? "Check the card details." });
      }
      const o = placed ?? (await createOrder());
      if (!o) return;
      if (free) return;
      if (!p.stripePk) {
        // Development only: no Stripe key, so the API's test endpoint stands in for the card.
        if (!o.paymentRef) return setError({ message: "No payment was created for this order." });
        await call(`${p.api}/public/v1/dev/payments/${encodeURIComponent(o.paymentRef)}/succeed`, { method: "POST", body: "{}" });
        return window.location.assign(registeredHref(o.orderId, o.buyerEmail));
      }
      if (!o.clientSecret) return setError({ message: "The payment couldn't be started. Reload the page and try again." });
      const back = new URL(registeredHref(o.orderId, o.buyerEmail), window.location.href).toString();
      const res = await sx!.stripe.confirmPayment({ elements: sx!.elements, clientSecret: o.clientSecret, redirect: "if_required", confirmParams: { return_url: back } });
      if (res.error) return setError({ message: res.error.message ?? "The payment didn't go through. Check the card details and try again." });
      window.location.assign(back);
    } finally {
      setBusy(false);
    }
  };

  const requestInvoice = async () => {
    setError(null);
    if (!attendeesOk()) return;
    if (inv.company.trim().length < 2) return setError({ message: "Enter the company's legal name." });
    if (!EMAIL_RE.test(inv.ap.trim())) return setError({ message: "Enter the accounts payable email the invoice goes to." });
    if (p.turnstileSiteKey && !challenge) return setError({ message: "Please wait for the browser check to finish, then try again." });
    setBusy(true);
    idem.current ||= attemptId();
    const r = await call<{ orderId: string; buyerEmail: string }>(`${p.api}/public/v1/organizations/${encodeURIComponent(p.orgId)}/invoice-requests`, {
      method: "POST",
      headers: { "idempotency-key": idem.current },
      body: JSON.stringify({ ticketTypeId: ticket!.id, quantity: n, attendees: attendees(), company: inv.company.trim(), billingEmail: inv.ap.trim(), ...(inv.po.trim() ? { poNumber: inv.po.trim() } : {}), country: inv.country, ...(challenge ? { turnstileToken: challenge } : {}) }),
    });
    setBusy(false);
    freshChallenge();
    if (!r.ok) return setError(r.error);
    window.location.assign(registeredHref(r.data.orderId, r.data.buyerEmail));
  };

  const total = pricing && pricing.quantity === n ? pricing.totalMinor : unit * n;
  const totalText = free ? "Free" : `${rxMoney(total, p.currency)} ${p.currency}`;
  const cardOnPage = !free && method === "card" && Boolean(p.stripePk);

  // Stripe's card form shows as soon as the page loads (no order yet); Pay creates the order and confirms it.
  useEffect(() => {
    if (!cardOnPage || !payBox.current || stripeRef.current) return;
    let el: StripePaymentElement | null = null;
    let gone = false;
    loadStripe()
      .then((factory) => {
        if (gone || !payBox.current) return;
        const stripe = p.stripeAccount ? factory(p.stripePk!, { stripeAccount: p.stripeAccount }) : factory(p.stripePk!);
        const elements = stripe.elements({ mode: "payment", amount: Math.max(total, 50), currency: p.currency.toLowerCase(), appearance: { theme: "stripe", variables: { borderRadius: "10px", fontFamily: "Instrument Sans, system-ui, sans-serif", colorPrimary: "#14213d" } } });
        el = elements.create("payment");
        el.on("ready", () => setPayReady(true));
        el.mount(payBox.current);
        stripeRef.current = { stripe, elements };
      })
      .catch(() => setError({ message: "The secure card form didn't load. Reload the page and try again." }));
    return () => {
      gone = true;
      el?.unmount();
      stripeRef.current = null;
      setPayReady(false);
    };
    // The amount follows the total through update() below; re-creating the form would wipe the card details.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardOnPage, p.stripePk, p.stripeAccount, p.currency]);
  useEffect(() => {
    if (stripeRef.current && total > 0) stripeRef.current.elements.update({ amount: total });
  }, [total, payReady]);
  return (
    <>
      <header className="rx-card" style={{ borderRadius: 0, borderWidth: "0 0 1px" }}>
        <div className="rx-wrap rx-co-head-in">
          <a className="rx-back" href={p.classHref}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to class
          </a>
          <Logo href={p.homeUrl} size={11} />
          <span className="rx-secure">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Secure checkout
          </span>
        </div>
      </header>

      <main className="rx-wrap rx-co">
        <div className="rx-co-main">
          <section className="rx-card rx-panel" aria-labelledby="co-title">
              <div>
                <h1 id="co-title">Who&apos;s attending?</h1>
                <p>The name you enter is exactly how it appears on the certificate and badge.</p>
              </div>
              {people.map((x, i) => (
                <fieldset key={i} className="rx-person" disabled={Boolean(placed)}>
                  <legend>{i === 0 ? "You" : `Teammate ${i}`}</legend>
                  <div className="rx-grid2">
                    <label className="rx-field">
                      Full name (for the certificate)
                      <input type="text" autoComplete={i === 0 ? "name" : "off"} placeholder="e.g. Priya Raman" value={x.name} onChange={(e) => setPerson(i, { name: e.target.value })} aria-invalid={touched && x.name.trim().length < 2} required />
                    </label>
                    <label className="rx-field">
                      Work email
                      <input type="email" autoComplete={i === 0 ? "email" : "off"} placeholder="name@company.com" value={x.email} onChange={(e) => setPerson(i, { email: e.target.value })} aria-invalid={touched && !EMAIL_RE.test(x.email.trim())} required />
                    </label>
                    <label className="rx-field">
                      <span>Job title <small>(optional)</small></span>
                      <input type="text" autoComplete={i === 0 ? "organization-title" : "off"} placeholder="e.g. Scrum Master" value={x.jobTitle} onChange={(e) => setPerson(i, { jobTitle: e.target.value })} />
                    </label>
                    <label className="rx-field">
                      Joining from
                      <select value={x.timeZone} onChange={(e) => setPerson(i, { timeZone: e.target.value })}>
                        {zones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </fieldset>
              ))}
              {!placed && (
              <div className="rx-row">
                {n < maxSeats && (
                  <button type="button" className="rx-dashed" onClick={() => setPeople((l) => [...l, blank(zone)])}>
                    + Add a teammate to this class
                  </button>
                )}
                {n > 1 && (
                  <button type="button" className="rx-quiet" onClick={() => setPeople((l) => l.slice(0, -1))}>
                    Remove last teammate
                  </button>
                )}
              </div>
              )}
            </section>

            <section className="rx-card rx-panel" aria-labelledby="pay-title">
              <div>
                <h2 id="pay-title" className="rx-panel-h">{free ? "Confirm your registration" : "Payment"}</h2>
                <p>{free ? "No payment needed. Your ticket and calendar invite arrive by email." : canInvoice ? "Card or invoice: either way, your seat is held the moment you finish." : "Your seat is held the moment you finish."}</p>
              </div>
              {!free && canInvoice && !placed && (
                <div className="rx-tabs" role="tablist" aria-label="Payment method">
                  <button type="button" role="tab" aria-selected={method === "card"} onClick={() => setMethod("card")}>
                    Card
                  </button>
                  <button type="button" role="tab" aria-selected={method === "invoice"} onClick={() => setMethod("invoice")}>
                    Invoice my company
                  </button>
                </div>
              )}
              {p.ticketTypes.length > 1 && !placed && (
                <label className="rx-field">
                  Ticket
                  <select value={ticketId} onChange={(e) => setTicketId(e.target.value)}>
                    {p.ticketTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} · {t.priceMinor === 0 ? "Free" : rxMoney(t.priceMinor, p.currency)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {(method === "card" || free) && (
                <>
                  {!placed && (
                    <div className="rx-grid2">
                      <label className="rx-field span2">
                        {free ? "Confirmation goes to" : "Receipt goes to"}
                        <input type="email" autoComplete="email" placeholder={people[0]!.email.trim() ? `${people[0]!.email.trim()} (your work email)` : "Your work email, unless you enter another"} value={receipt} onChange={(e) => setReceipt(e.target.value)} />
                      </label>
                      {!free && p.flexibleOffered && (
                        <label className="rx-flex-opt span2">
                          <input type="checkbox" checked={flexible} onChange={(e) => setFlexible(e.target.checked)} />
                          <span>
                            <strong>Flexible ticket</strong>
                            {pricing?.flexibleMinor ? ` (+${rxMoney(pricing.flexibleMinor, p.currency)})` : ""} · full refund if you cancel up to 24 hours before the start. The upgrade itself isn&apos;t refunded.
                          </span>
                        </label>
                      )}
                    </div>
                  )}
                  {cardOnPage && <div ref={payBox} className="rx-payel" aria-label="Card details" />}
                  {!free && !p.stripePk && <p className="rx-note">Test mode: no payment key is set up, so no real card is charged.</p>}
                </>
              )}

              {method === "invoice" && !free && (
                <div className="rx-grid2">
                  <label className="rx-field">
                    Company legal name
                    <input type="text" autoComplete="organization" placeholder="Company Inc." value={inv.company} onChange={(e) => setInv({ ...inv, company: e.target.value })} />
                  </label>
                  <label className="rx-field">
                    <span>PO number <small>(optional)</small></span>
                    <input type="text" placeholder="PO-0000" value={inv.po} onChange={(e) => setInv({ ...inv, po: e.target.value })} />
                  </label>
                  <label className="rx-field">
                    Accounts payable email
                    <input type="email" placeholder="ap@company.com" value={inv.ap} onChange={(e) => setInv({ ...inv, ap: e.target.value })} />
                  </label>
                  <label className="rx-field">
                    Company country
                    <select value={inv.country} onChange={(e) => setInv({ ...inv, country: e.target.value })}>
                      {!COUNTRIES.some(([c]) => c === inv.country) && <option value={inv.country}>{inv.country}</option>}
                      {COUNTRIES.map(([c, name]) => (
                        <option key={c} value={c}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="rx-note span2">
                    Your {n === 1 ? "seat is" : `${n} seats are`} held now. The invoice goes to accounts payable with a pay link and is due a few days before the class; unpaid seats go back on sale after that. Tickets are sent when it&apos;s paid.
                  </p>
                </div>
              )}
              {p.turnstileSiteKey && !placed && <div ref={challengeBox} />}
            </section>

          {error && (
            <p className="rx-error" role="alert">
              {error.message}
              {error.hint ? ` ${error.hint.charAt(0).toUpperCase()}${error.hint.slice(1)}.` : ""}
            </p>
          )}

          <div className="rx-actions">
            <span className="grow" />
            {method === "invoice" && !free ? (
              <button type="button" className="rx-btn" onClick={requestInvoice} disabled={busy}>
                {busy ? "Holding your seats…" : `Hold ${n === 1 ? "my seat" : `${n} seats`} and send invoice`}
              </button>
            ) : (
              <button type="button" className="rx-btn" onClick={payNow} disabled={busy || (cardOnPage && !payReady)}>
                {busy ? (free ? "One moment…" : "Paying…") : free ? `Register ${n === 1 ? "" : `${n} seats`}`.trim() : p.stripePk ? `Pay ${totalText} and register` : `Pay ${totalText} (test mode)`}
              </button>
            )}
          </div>
        </div>

        <aside className="rx-summary" aria-label="Order summary">
          <div className="rx-card rx-summary-in">
            <div className="rx-eyebrow">{n === 1 ? "Your seat" : "Your seats"}</div>
            <h2>{p.course.name}</h2>
            <div className="rx-summary-lines">
              <span>{p.dates}</span>
              <span>{p.times}</span>
              <span>
                {p.where}
                {p.instructors.length ? ` with ${p.instructors.join(", ")}` : ""} · {p.orgName}
              </span>
            </div>
            <div className="rx-sum">
              <div>
                <span>
                  {n} {n === 1 ? "seat" : "seats"} × {free ? "Free" : rxMoney(unit, p.currency)}
                  {p.sale && ticket?.regularMinor && !free ? (
                    <small className="rx-sale-line">
                      {p.sale.label}: {p.sale.percentOff}% off <s>{rxMoney(ticket.regularMinor, p.currency)}</s>
                    </small>
                  ) : null}
                </span>
                <span>{free ? "Free" : rxMoney(pricing?.quantity === n ? pricing.subtotalMinor : unit * n, p.currency)}</span>
              </div>
              {pricing && pricing.quantity === n && (pricing.flexibleMinor ?? 0) > 0 && (
                <div>
                  <span>Flexible ticket</span>
                  <span>{rxMoney(pricing.flexibleMinor!, p.currency)}</span>
                </div>
              )}
              {pricing && pricing.quantity === n && pricing.attendeeFeeMinor > 0 && (
                <div className="is-muted">
                  <span>Booking fee</span>
                  <span>{rxMoney(pricing.attendeeFeeMinor, p.currency)}</span>
                </div>
              )}
              {pricing && pricing.quantity === n && pricing.taxMinor > 0 && (
                <div className="is-muted">
                  <span>Tax</span>
                  <span>{rxMoney(pricing.taxMinor, p.currency)}</span>
                </div>
              )}
              <div className="is-total">
                <span>Total</span>
                <span>{totalText}</span>
              </div>
            </div>
            {!free && (
              <div className="rx-protect">
                {p.paymentMode === "direct" ? (
                  <span>
                    <strong>Secure card payment</strong> to {p.orgName} through Stripe. Changes and refunds follow {p.orgName}&apos;s policy, shown in your confirmation email.
                  </span>
                ) : (
                  <span>
                    <strong>Protected by EnrollClass.</strong> Payment held until the class is delivered. If the class is cancelled, you&apos;re refunded in full.
                  </span>
                )}
              </div>
            )}
          </div>
        </aside>
      </main>
    </>
  );
}
