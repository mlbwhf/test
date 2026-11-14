"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COMMON_ZONES, detectedZone, zoneName } from "@/lib/class-time";
import { loadTurnstile } from "@/components/turnstile-field";
import { rxMoney } from "@/components/class-page/shared";

type TicketOption = { id: string; name: string; priceMinor: number; remaining: number };
type Person = { name: string; email: string; jobTitle: string; timeZone: string };
type Ready = { camera: boolean; connection: boolean; calendar: boolean; prework: boolean };
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
};

type StripePaymentElement = { mount(el: HTMLElement): void; unmount(): void };
type StripeElements = { create(type: "payment"): StripePaymentElement };
type StripeLike = {
  elements(o: { clientSecret: string; appearance?: Record<string, unknown> }): StripeElements;
  confirmPayment(o: { elements: StripeElements; redirect: "if_required"; confirmParams: { return_url: string } }): Promise<{ error?: { message?: string } }>;
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
  const [step, setStep] = useState(1);
  const [zone, setZone] = useState(p.classZone);
  const maxSeats = Math.max(1, Math.min(p.seatsLeft, 20));
  const [people, setPeople] = useState<Person[]>(() => Array.from({ length: p.initialQty }, () => blank(p.classZone)));
  const [touched, setTouched] = useState(false);
  const [ready, setReady] = useState<Ready>({ camera: false, connection: false, calendar: false, prework: false });
  const [device, setDevice] = useState<string | null>(null);
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
      body: JSON.stringify({ ticketTypeId: ticket.id, quantity: n, currency: p.currency, buyerEmail: "quote@enrollclass.invalid", dryRun: true, ...(flexible ? { flexible: true } : {}) }),
    });
    if (r.ok) setPricing(r.data.order.pricing);
  }, [p.api, p.orgId, p.currency, ticket, n, flexible]);
  useEffect(() => {
    const t = setTimeout(() => void quote(), 250);
    return () => clearTimeout(t);
  }, [quote]);

  // Turnstile on the payment step, when the site runs it.
  useEffect(() => {
    if (step !== 3 || !p.turnstileSiteKey || !challengeBox.current || challengeId.current) return;
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
  }, [step, p.turnstileSiteKey]);
  const freshChallenge = () => {
    setChallenge("");
    if (challengeId.current) window.turnstile?.reset(challengeId.current);
  };

  const setPerson = (i: number, patch: Partial<Person>) => setPeople((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const peopleOk = people.every((x) => x.name.trim().length >= 2 && EMAIL_RE.test(x.email.trim()));
  const emailsUnique = new Set(people.map((x) => x.email.trim().toLowerCase())).size === people.length;
  const doneCount = Object.values(ready).filter(Boolean).length;
  const registeredHref = (orderId: string, email: string) => `${p.registeredBase}?order=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`;
  const attendees = () =>
    people.map((x, i) => ({
      email: x.email.trim(),
      name: x.name.trim(),
      ...(x.jobTitle.trim() ? { jobTitle: x.jobTitle.trim() } : {}),
      ...(x.timeZone ? { timeZone: x.timeZone } : {}),
      ...(i === 0 ? { readyChecks: ready } : {}),
    }));

  const next = () => {
    setError(null);
    if (step === 1) {
      setTouched(true);
      if (!peopleOk) return setError({ message: "Enter a full name and a work email for every attendee." });
      if (!emailsUnique) return setError({ message: "Each attendee needs their own email address." });
      if (!receipt) setReceipt(people[0]!.email.trim());
    }
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const runDeviceTest = async () => {
    setDevice("Checking…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((t) => t.stop());
      setReady((r) => ({ ...r, camera: true }));
      setDevice("Camera and microphone work.");
    } catch {
      setDevice("We couldn't use your camera or microphone. Check your browser's permissions, or try another device before class.");
    }
  };

  // Card (or free): create the order, then show Stripe's secure form.
  const placeOrder = async () => {
    setError(null);
    const buyer = (receipt || people[0]!.email).trim();
    if (!EMAIL_RE.test(buyer)) return setError({ message: "Enter the email the receipt goes to." });
    if (p.turnstileSiteKey && !challenge) return setError({ message: "Please wait for the browser check to finish, then try again." });
    setBusy(true);
    idem.current ||= attemptId();
    const r = await call<{ order: { id: string; status: string; paymentRef: string | null }; clientSecret: string | null; stripeAccount: string | null }>(`${p.api}/public/v1/organizations/${encodeURIComponent(p.orgId)}/orders`, {
      method: "POST",
      headers: { "idempotency-key": idem.current },
      body: JSON.stringify({ ticketTypeId: ticket!.id, quantity: n, currency: p.currency, buyerEmail: buyer, attendees: attendees(), ...(flexible ? { flexible: true } : {}), ...(challenge ? { turnstileToken: challenge } : {}) }),
    });
    setBusy(false);
    freshChallenge();
    if (!r.ok) return setError(r.error);
    const o = r.data;
    // Free seats are confirmed straight away.
    if (o.order.status === "paid") return window.location.assign(registeredHref(o.order.id, buyer));
    setPlaced({ orderId: o.order.id, buyerEmail: buyer, clientSecret: o.clientSecret, stripeAccount: o.stripeAccount, paymentRef: o.order.paymentRef });
  };

  // Mount the Payment Element once the order exists.
  useEffect(() => {
    if (!placed?.clientSecret || !p.stripePk || !payBox.current) return;
    let el: StripePaymentElement | null = null;
    loadStripe()
      .then((factory) => {
        const stripe = placed.stripeAccount ? factory(p.stripePk!, { stripeAccount: placed.stripeAccount }) : factory(p.stripePk!);
        const elements = stripe.elements({ clientSecret: placed.clientSecret!, appearance: { theme: "stripe", variables: { borderRadius: "10px", fontFamily: "Inter, system-ui, sans-serif" } } });
        el = elements.create("payment");
        el.mount(payBox.current!);
        stripeRef.current = { stripe, elements };
        setPayReady(true);
      })
      .catch(() => setError({ message: "The secure payment form didn't load. Reload the page and try again." }));
    return () => el?.unmount();
  }, [placed, p.stripePk]);

  const pay = async () => {
    if (!placed || !stripeRef.current) return;
    setError(null);
    setBusy(true);
    const back = new URL(registeredHref(placed.orderId, placed.buyerEmail), window.location.href).toString();
    const res = await stripeRef.current.stripe.confirmPayment({ elements: stripeRef.current.elements, redirect: "if_required", confirmParams: { return_url: back } });
    setBusy(false);
    if (res.error) return setError({ message: res.error.message ?? "The payment didn't go through. Check the card details and try again." });
    window.location.assign(back);
  };

  // Development only: no Stripe key, so the API's test endpoint stands in for the card.
  const simulate = async () => {
    if (!placed?.paymentRef) return;
    setBusy(true);
    await call(`${p.api}/public/v1/dev/payments/${encodeURIComponent(placed.paymentRef)}/succeed`, { method: "POST", body: "{}" });
    window.location.assign(registeredHref(placed.orderId, placed.buyerEmail));
  };

  const requestInvoice = async () => {
    setError(null);
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
  const steps = ["Attendees", "Ready check", free ? "Confirm" : "Payment"];
  const checks: { id: keyof Ready; name: string; note: string }[] = [
    { id: "camera", name: "Camera and microphone work", note: "Classes are interactive, with breakouts" },
    { id: "connection", name: `Stable connection for ${p.sessionCount > 1 ? "full days" : "the whole session"}`, note: "Wired or strong Wi-Fi recommended" },
    { id: "calendar", name: p.sessionCount > 1 ? `All ${p.sessionCount} sessions blocked on my calendar` : "The session is blocked on my calendar", note: "Calendar invites arrive right after you register" },
    { id: "prework", name: "I can do the pre-work", note: "Sent to you before the class starts" },
  ];

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
          <span className="rx-word">EnrollClass</span>
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
          <ol className="rx-steps" aria-label="Steps">
            {steps.map((name, i) => (
              <li key={name} className={i + 1 < step ? "is-done" : i + 1 === step ? "is-on" : undefined} aria-current={i + 1 === step ? "step" : undefined}>
                {i + 1} · {name}
              </li>
            ))}
          </ol>

          {step === 1 && (
            <section className="rx-card rx-panel" aria-labelledby="co-title">
              <div>
                <h1 id="co-title">Who&apos;s attending?</h1>
                <p>The name you enter is exactly how it appears on the certificate and badge.</p>
              </div>
              {people.map((x, i) => (
                <fieldset key={i} className="rx-person">
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
            </section>
          )}

          {step === 2 && (
            <section className="rx-card rx-panel" aria-labelledby="co-title">
              <div>
                <h1 id="co-title">{p.sessionCount > 1 ? `Ready for ${p.sessionCount} live sessions?` : "Ready for class?"}</h1>
                <p>A quick check so day 1 starts on time. Nothing here blocks your booking; we&apos;ll remind you of anything left before class.</p>
              </div>
              <div className="rx-checks">
                {checks.map((c) => (
                  <label key={c.id} className={`rx-checkrow${ready[c.id] ? " is-on" : ""}`}>
                    <input type="checkbox" checked={ready[c.id]} onChange={(e) => setReady((r) => ({ ...r, [c.id]: e.target.checked }))} />
                    <span>
                      <b>{c.name}</b>
                      <em>{c.note}</em>
                    </span>
                  </label>
                ))}
              </div>
              <div className="rx-device">
                <div>
                  <b>Device test</b>
                  <div className="rx-muted" style={{ fontSize: 14 }} aria-live="polite">
                    {device ?? "Checks your camera and microphone in this browser."}
                  </div>
                </div>
                <button type="button" onClick={runDeviceTest}>
                  Run test
                </button>
              </div>
              <div style={{ fontSize: 14 }}>
                {doneCount} of 4 ready{doneCount < 4 ? " — you can finish the rest later." : " — you're all set."}
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="rx-card rx-panel" aria-labelledby="co-title">
              <div>
                <h1 id="co-title">{free ? "Confirm your registration" : "How would you like to pay?"}</h1>
                <p>{free ? "No payment needed. Your ticket and calendar invite arrive by email." : "Either way, your seat is held the moment you finish this step."}</p>
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
                        <input type="email" autoComplete="email" placeholder="name@company.com" value={receipt} onChange={(e) => setReceipt(e.target.value)} />
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
                  {placed && p.stripePk && <div ref={payBox} className="rx-payel" aria-label="Card details" />}
                  {placed && !p.stripePk && placed.clientSecret && <p className="rx-note">Test mode: no payment key is set up, so no real card is charged.</p>}
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
          )}

          {error && (
            <p className="rx-error" role="alert">
              {error.message}
              {error.hint ? ` ${error.hint.charAt(0).toUpperCase()}${error.hint.slice(1)}.` : ""}
            </p>
          )}

          <div className="rx-actions">
            {step > 1 && !placed && (
              <button type="button" className="rx-btn-ghost" onClick={() => setStep((s) => s - 1)}>
                Back
              </button>
            )}
            <span className="grow" />
            {step < 3 && (
              <button type="button" className="rx-btn" onClick={next}>
                {step === 1 ? "Continue to ready check" : free ? "Continue" : "Continue to payment"}
              </button>
            )}
            {step === 3 && (method === "invoice" && !free ? (
              <button type="button" className="rx-btn" onClick={requestInvoice} disabled={busy}>
                {busy ? "Holding your seats…" : `Hold ${n === 1 ? "my seat" : `${n} seats`} and send invoice`}
              </button>
            ) : !placed ? (
              <button type="button" className="rx-btn" onClick={placeOrder} disabled={busy}>
                {busy ? "One moment…" : free ? `Register ${n === 1 ? "" : `${n} seats`}`.trim() : "Continue to secure payment"}
              </button>
            ) : p.stripePk ? (
              <button type="button" className="rx-btn" onClick={pay} disabled={busy || !payReady}>
                {busy ? "Paying…" : `Pay ${totalText} and reserve`}
              </button>
            ) : (
              <button type="button" className="rx-btn" onClick={simulate} disabled={busy}>
                Simulate payment (test mode)
              </button>
            ))}
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
