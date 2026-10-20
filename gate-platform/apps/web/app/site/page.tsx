import Link from "next/link";
import { ALL_FAQ } from "@/lib/faq";
import { publicApi } from "@/lib/public-api";
import { FALLBACK_USD_FEES, feeLabel, feeOn } from "@/lib/fees";
import { formatMoney } from "@/lib/format";
import { CHECKED_ON, COMPETITORS, EXAMPLE_SEAT_MINOR, STRIPE_US } from "@/lib/competitors";
import { ORGANIZATION_LD, apiUrl, appUrl, jsonLd, siteUrl } from "@/lib/seo";

const APP = `https://app.${process.env.GATE_DOMAIN ?? "enrollclass.com"}`;

// 20 seats: 14 filled (paper squares), 1 being filled (green circle), 5 empty.
const SEATS = [...Array<"filled">(14).fill("filled"), "next" as const, ...Array<"empty">(5).fill("empty")];

const COHORTS = [
  { name: "Project Management Certification", dates: "12 Nov – 14 Dec", filled: 14, cap: 20, held: "$12,600", status: "Enrolling", tone: "green" },
  { name: "Scrum Master Intensive", dates: "3 – 5 Dec", filled: 18, cap: 20, held: "$9,900", status: "Almost full", tone: "green" },
  { name: "Agile Leadership Workshop", dates: "20 – 21 Oct", filled: 20, cap: 20, held: "$8,450", status: "Released", tone: "ink" },
  { name: "Product Owner Foundations", dates: "8 – 9 Jan", filled: 10, cap: 20, held: "$5,200", status: "Enrolling", tone: "green" },
];

// Questions shown on the home page; the full list is on /faq.
const HOME_FAQ = ["What is EnrollClass?", "When do I get paid?", "How much does it cost?", "Do you charge anything for free classes?", "Can learners register from my own website?", "Can I use EnrollClass from Claude or another AI assistant?"];

const money = (minor: number) => formatMoney(minor, "USD").replace(/\.00$/, "");
const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;

export default async function SiteHome() {
  const feesRes = await publicApi.getFees();
  const fees = (feesRes.ok ? feesRes.data.currencies.USD : undefined) ?? FALLBACK_USD_FEES;
  const protectedTotal = feeOn(EXAMPLE_SEAT_MINOR, fees.protected);
  const directTotal = feeOn(EXAMPLE_SEAT_MINOR, fees.direct) + feeOn(EXAMPLE_SEAT_MINOR, { ...STRIPE_US, capMinor: null });
  const faq = HOME_FAQ.map((q) => ALL_FAQ.find((f) => f.q === q)!).filter(Boolean);
  const ld = [
    ORGANIZATION_LD(),
    { "@context": "https://schema.org", "@type": "WebSite", "@id": `${siteUrl()}/#website`, name: "EnrollClass", url: siteUrl(), publisher: { "@id": `${siteUrl()}/#organization` } },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "EnrollClass",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: appUrl(),
      description: "Registration and payments for training providers: publish cohorts, take card or invoice payments held until delivery, check-in with QR tickets, certificates, team roles, webhooks, API and an MCP server for AI assistants.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: `Free to start, and free classes are always free. Paid seats: ${feeLabel(fees.protected, "USD")} all-in (Protected, held until delivery) or ${feeLabel(fees.direct, "USD")} plus card processing (Direct, paid to your Stripe).` },
      publisher: { "@id": `${siteUrl()}/#organization` },
      sameAs: [`${apiUrl()}/docs`],
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <section className="site-hero">
        <div>
          <p className="eyebrow">Cohort registration &amp; payments</p>
          <h1 className="site-h1">Fill every seat. Get paid when you teach.</h1>
          <p className="site-lede">Publish cohorts, take registrations by card or invoice, and receive funds in your Stripe account once the course is delivered.</p>
          <div className="site-cta">
            <a href={`${APP}/login?mode=signup`} className="pill pill-green">
              Sign up free
            </a>
            <Link href="/#pricing" className="pill pill-outline">
              See pricing
            </Link>
          </div>
          <p className="hero-learner">
            Signing up for a class? No account needed: <Link href="/classes">find your class</Link> and register on its page.
          </p>
        </div>
        <div className="cohort-card" aria-label="Example cohort">
          <div>
            <p className="mono dim">COHORT · 12 NOV – 14 DEC</p>
            <p className="cohort-card-title">Project Management Certification</p>
          </div>
          <div className="seat-grid" aria-hidden="true">
            {SEATS.map((s, i) => (
              <span key={i} className={`seat seat-${s}`} />
            ))}
          </div>
          <div className="row">
            <span>14 of 20 seats filled</span>
            <span className="mono green">$12,600 held</span>
          </div>
          <div className="row cohort-card-foot">
            <span>Releases to Stripe after delivery</span>
            <span className="mono">19 Dec</span>
          </div>
        </div>
      </section>

      <section id="how" className="site-section sand">
        <h2 className="site-h2">Registration to payout, in three steps</h2>
        <div className="steps">
          <article className="step">
            <p className="mono green">01</p>
            <h3>Publish a cohort</h3>
            <p>Set dates, seats and prices. Drop the embed on your own site or share the registration link.</p>
          </article>
          <article className="step">
            <p className="mono green">02</p>
            <h3>Learners pay at checkout</h3>
            <p>Card or invoice, with early-bird pricing, group seats and waitlists. Funds are held in the ledger against the cohort.</p>
          </article>
          <article className="step">
            <p className="mono green">03</p>
            <h3>Paid after delivery</h3>
            <p>Once the course is delivered, the balance is released to your connected Stripe account. Refunds and transfers stay self-service for learners.</p>
          </article>
        </div>
      </section>

      <section id="dashboard" className="site-section">
        <h2 className="site-h2">See seats and money in one view</h2>
        <div className="preview">
          <div className="kpis">
            <div>
              <p className="mono dim">HELD IN LEDGER</p>
              <p className="kpi">$31,400</p>
            </div>
            <div>
              <p className="mono dim">RELEASED THIS MONTH</p>
              <p className="kpi green">$18,950</p>
            </div>
            <div>
              <p className="mono dim">SEATS FILLED</p>
              <p className="kpi">
                62 <span className="dim">/ 80</span>
              </p>
            </div>
          </div>
          <div className="preview-table-wrap">
            <div className="preview-table">
              <div className="preview-head mono">
                <span>COHORT</span>
                <span>SEATS</span>
                <span>HELD</span>
                <span>STATUS</span>
              </div>
              {COHORTS.map((c) => (
                <div className="preview-row" key={c.name}>
                  <div>
                    <div className="strong">{c.name}</div>
                    <div className="mono dim small">{c.dates}</div>
                  </div>
                  <div>
                    <div className="bar">
                      <div style={{ width: `${Math.round((c.filled / c.cap) * 100)}%` }} />
                    </div>
                    <div className="mono small">
                      {c.filled} / {c.cap}
                    </div>
                  </div>
                  <div className="mono">{c.held}</div>
                  <div>
                    <span className={`pill-status pill-status-${c.tone}`}>{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="site-section sand" aria-labelledby="pricing-title">
        <h2 className="site-h2" id="pricing-title">One fee per paid seat. Nothing monthly.</h2>
        <p className="pricing-free">
          <strong>Free classes are free.</strong> No fee, no card and no Stripe account needed. For paid classes, choose how the money flows:
        </p>
        <div className="tiers">
          <article className="tier tier-ink">
            <p className="mono">PROTECTED · HELD UNTIL DELIVERY</p>
            <p className="rate">{pct(fees.protected.bps)}</p>
            <p className="rate-sub">+ {money(fees.protected.fixedMinor)} per paid seat, card processing included</p>
            <p>EnrollClass takes the payment, holds it until the class is delivered, then pays you. Learners get a refund guarantee if a class is cancelled, and we handle card fees and disputes.</p>
          </article>
          <article className="tier tier-green">
            <p className="mono">DIRECT · PAID TO YOUR STRIPE</p>
            <p className="rate">{pct(fees.direct.bps)}</p>
            <p className="rate-sub">+ {money(fees.direct.fixedMinor)} per paid seat, plus Stripe&apos;s card fee</p>
            <p>Learners pay your own Stripe account and the money arrives on Stripe&apos;s schedule, before the class. You&apos;re the merchant: Stripe bills its fee to you and you handle refunds and disputes.</p>
          </article>
          <article className="tier tier-paper">
            <p className="mono">INCLUDED IN BOTH</p>
            <p className="rate">$0</p>
            <p className="rate-sub">no setup, no monthly fee</p>
            <p>Course pages and embeddable registration, early-bird and group pricing, waitlists, corporate invoices, QR tickets and check-in, certificates and digital badges, instructor roles, API, webhooks and AI assistants (MCP).</p>
          </article>
        </div>
        <p className="footnote">You can pass the fee on to learners so you keep the full ticket price. Taxes you collect are passed through, never charged a fee. USD rates; other currencies have the same shape.</p>

        <h3 className="compare-title">What a {money(EXAMPLE_SEAT_MINOR)} certification seat costs you</h3>
        <div className="compare-wrap" role="region" aria-labelledby="compare-caption" tabIndex={0}>
          <table className="compare">
            <caption id="compare-caption">Fees on one {money(EXAMPLE_SEAT_MINOR)} seat when you absorb them, US card</caption>
            <thead>
              <tr>
                <th scope="col">Platform</th>
                <th scope="col">Platform fee</th>
                <th scope="col">Card processing</th>
                <th scope="col">Total on {money(EXAMPLE_SEAT_MINOR)}</th>
                <th scope="col">Monthly</th>
                <th scope="col">Who holds the money</th>
              </tr>
            </thead>
            <tbody>
              <tr className="is-us">
                <th scope="row">EnrollClass Protected</th>
                <td>{feeLabel(fees.protected, "USD")}</td>
                <td>Included</td>
                <td>
                  <strong>{money(protectedTotal)}</strong>
                </td>
                <td>None</td>
                <td>Held until the class is delivered, then paid to you</td>
              </tr>
              <tr className="is-us">
                <th scope="row">EnrollClass Direct</th>
                <td>{feeLabel(fees.direct, "USD")}</td>
                <td>Your Stripe: 2.9% + $0.30</td>
                <td>
                  <strong>{money(directTotal)}</strong>
                </td>
                <td>None</td>
                <td>Your Stripe account</td>
              </tr>
              {COMPETITORS.map((c) => (
                <tr key={c.name}>
                  <th scope="row">
                    <a href={c.source} target="_blank" rel="noopener nofollow">
                      {c.name}
                    </a>
                  </th>
                  <td>{c.fee}</td>
                  <td>{c.processing}</td>
                  <td>{c.total}</td>
                  <td>{c.monthly}</td>
                  <td>{c.money}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="footnote">
          Other platforms&apos; prices are from their published US pricing and help pages (linked), checked {CHECKED_ON}; they can change. Totals assume the organizer absorbs the fees and a US card at 2.9% + $0.30. Corsizio&apos;s $0.15 applies once you pass 30 registrations a month; Arlo also needs a monthly licence per administrator.
        </p>
      </section>

      <section id="start" className="site-section ink">
        <h2 className="site-h2">Start with one cohort. Grow into a team.</h2>
        <div className="audience">
          <article className="audience-card">
            <p className="mono green">INDEPENDENT INSTRUCTORS</p>
            <h3>Teach under your own name</h3>
            <ul>
              <li>Sign in with Google, Microsoft or LinkedIn and publish the same day.</li>
              <li>Card or invoice checkout, QR tickets, calendar invites and reminders.</li>
              <li>Payouts to your Stripe account after each course is delivered.</li>
            </ul>
          </article>
          <article className="audience-card">
            <p className="mono green">TRAINING ORGANIZATIONS</p>
            <h3>Run every instructor in one place</h3>
            <ul>
              <li>Invite instructors, admins and finance, each with the access they need.</li>
              <li>Import your schedule from Eventbrite or a spreadsheet.</li>
              <li>Seats, held funds and payouts per cohort, in one ledger.</li>
            </ul>
          </article>
        </div>
        <div className="site-cta">
          <a href={`${APP}/login?mode=signup`} className="pill pill-green">
            Sign up free
          </a>
          <a href={`${APP}/login`} className="pill pill-outline-paper">
            Log in
          </a>
        </div>
        <p className="start-note">Free to start, and free classes are always free. You pay only a per-seat fee on paid registrations.</p>
      </section>

      <section id="faq" className="site-section home-faq" aria-labelledby="home-faq-title">
        <h2 id="home-faq-title">Questions</h2>
        {faq.map((f) => (
          <details key={f.q} className="faq-item">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
        <p className="faq-more">
          <Link href="/faq">All questions</Link> · <Link href="/help">Help center</Link>
        </p>
      </section>
    </>
  );
}
