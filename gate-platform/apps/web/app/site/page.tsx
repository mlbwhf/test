import Link from "next/link";
import { SeatMark } from "@/components/brand";

const APP = `https://app.${process.env.GATE_DOMAIN ?? "enrollclass.com"}`;

// 20 seats: 14 filled (paper squares), 1 being filled (green circle), 5 empty.
const SEATS = [...Array<"filled">(14).fill("filled"), "next" as const, ...Array<"empty">(5).fill("empty")];

const COHORTS = [
  { name: "Project Management Certification", dates: "12 Nov – 14 Dec", filled: 14, cap: 20, held: "$12,600", status: "Enrolling", tone: "green" },
  { name: "Scrum Master Intensive", dates: "3 – 5 Dec", filled: 18, cap: 20, held: "$9,900", status: "Almost full", tone: "green" },
  { name: "Agile Leadership Workshop", dates: "20 – 21 Oct", filled: 20, cap: 20, held: "$8,450", status: "Released", tone: "ink" },
  { name: "Product Owner Foundations", dates: "8 – 9 Jan", filled: 10, cap: 20, held: "$5,200", status: "Enrolling", tone: "green" },
];

export default function SiteHome() {
  return (
    <>
      <section className="site-hero">
        <div>
          <p className="eyebrow">Cohort registration &amp; payments</p>
          <h1 className="site-h1">Fill every seat. Get paid when you teach.</h1>
          <p className="site-lede">Publish cohorts, take registrations by card or invoice, and receive funds in your Stripe account once the course is delivered.</p>
          <div className="site-cta">
            <a href="mailto:hello@enrollclass.com?subject=Publish%20my%20first%20cohort" className="pill pill-green">
              Publish your first cohort
            </a>
            <Link href="/#pricing" className="pill pill-outline">
              See pricing
            </Link>
          </div>
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

      <section id="pricing" className="site-section sand">
        <h2 className="site-h2">One fee per seat. Nothing monthly.</h2>
        <div className="tiers">
          <article className="tier tier-paper">
            <p className="mono">PAY AS YOU GO</p>
            <p className="rate">2.5%</p>
            <p className="rate-sub">+ $0.50 per seat, capped at $5.00</p>
            <p>Charged only on paid registrations. Funds release to your Stripe account after delivery. No setup or monthly fee.</p>
          </article>
          <article className="tier tier-ink">
            <p className="mono">INCLUDED</p>
            <p className="rate">$0</p>
            <p className="rate-sub">for the parts that fill seats</p>
            <p>Embeddable registration, early-bird and group pricing, waitlists, invoices for corporate buyers, self-service transfers and cancellations, certificates, calendar invites.</p>
          </article>
          <article className="tier tier-green">
            <p className="mono">YOUR OWN BANK</p>
            <p className="rate">2.9%</p>
            <p className="rate-sub">+ $1.05 per seat, no cap</p>
            <p>If you would rather be paid to a bank account than a Stripe account. Same ledger, same release after delivery.</p>
          </article>
        </div>
        <p className="footnote">USD rates. CAD, EUR and GBP schedules have the same shape with local caps. Taxes you collect are passed through, never charged a fee.</p>
      </section>

      <section id="brand" className="site-section ink">
        <h2 className="site-h2">A seat being filled</h2>
        <div className="brand-grid">
          <div className="brand-card">
            <div className="brand-lockup">
              <SeatMark size={28} ink="var(--paper)" />
              <span className="wordmark wordmark-lg">enrollclass</span>
            </div>
            <p className="mono dim">Three seats taken, one being filled. The whole product in one mark.</p>
          </div>
          <div className="brand-card swatches">
            <div className="swatch" style={{ background: "var(--ink)", color: "var(--paper)", border: "1px solid rgba(247,246,242,.2)" }}>
              Ink
            </div>
            <div className="swatch" style={{ background: "var(--paper)", color: "var(--ink)" }}>
              Paper
            </div>
            <div className="swatch" style={{ background: "var(--green)", color: "var(--ink)" }}>
              Seat green
            </div>
            <div className="swatch" style={{ background: "var(--sand)", color: "var(--ink)" }}>
              Sand
            </div>
          </div>
          <div className="brand-card">
            <p className="type-display">Bricolage Grotesque</p>
            <p className="type-body">Instrument Sans for everything you read.</p>
            <p className="mono">IBM PLEX MONO · $12,600 · 19 DEC</p>
          </div>
        </div>
        <div className="site-cta">
          <a href="mailto:hello@enrollclass.com?subject=Start%20publishing%20on%20EnrollClass" className="pill pill-green">
            Start publishing
          </a>
          <a href={`${APP}/dashboard`} className="pill pill-outline-paper">
            Log in
          </a>
        </div>
      </section>
    </>
  );
}
