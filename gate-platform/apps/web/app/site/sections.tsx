import Link from "next/link";
import { ALL_FAQ } from "@/lib/faq";
import { publicApi } from "@/lib/public-api";
import { FALLBACK_USD_FEES, feeLabel, feeOn } from "@/lib/fees";
import { formatMoney } from "@/lib/format";
import { CHECKED_ON, COMPETITORS, EXAMPLE_SEAT_MINOR, STRIPE_US } from "@/lib/competitors";

export const APP = `https://app.${process.env.GATE_DOMAIN ?? "enrollclass.com"}`;

// 20 seats: 14 filled (paper squares), 1 being filled (green circle), 5 empty.
export const SEATS = [...Array<"filled">(14).fill("filled"), "next" as const, ...Array<"empty">(5).fill("empty")];

const COHORTS = [
  { name: "Project Management Certification", dates: "12 Nov – 14 Dec", filled: 14, cap: 20, paid: 12, invoiced: 2, held: "$12,600", status: "Enrolling", tone: "green" },
  { name: "Scrum Master Intensive", dates: "3 – 5 Dec", filled: 18, cap: 20, paid: 17, invoiced: 1, held: "$9,900", status: "Almost full", tone: "green" },
  { name: "Agile Leadership Workshop", dates: "20 – 21 Oct", filled: 20, cap: 20, paid: 20, invoiced: 0, held: "$8,450", status: "Released", tone: "ink" },
  { name: "Product Owner Foundations", dates: "8 – 9 Jan", filled: 10, cap: 20, paid: 7, invoiced: 3, held: "$5,200", status: "Enrolling", tone: "green" },
];

// What the dashboard does, in the words people search for.
const DASHBOARD_POINTS = [
  ["Watch seats fill", "Live seat counts for every date, a waitlist that opens when a class sells out, and the roster as a CSV whenever you need it."],
  ["Track every payment", "See who paid by card, who is on a corporate invoice and what is still due. Refunds and transfers show up on the same line."],
  ["Know when you get paid", "Money held for each class, what has been released and what is on its way to your bank, without a spreadsheet."],
] as const;

// Questions shown on the home page; the full list is on /faq.
export const HOME_FAQ = ["What is EnrollClass?", "When do I get paid?", "How much does it cost?", "Do you charge anything for free classes?", "Can learners register from my own website?", "Can I use EnrollClass from Claude or another AI assistant?"];

const money = (minor: number) => formatMoney(minor, "USD").replace(/\.00$/, "");
const pct = (bps: number) => `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;

export type FeeData = Awaited<ReturnType<typeof feeData>>;

/** Live USD fees (falls back to the published defaults when the API is down). */
export async function feeData() {
  const feesRes = await publicApi.getFees();
  const fees = (feesRes.ok ? feesRes.data.currencies.USD : undefined) ?? FALLBACK_USD_FEES;
  const extra = (feesRes.ok ? feesRes.data.currencies.USD : undefined) ?? { verifiedBadgeMinor: 100, fxMarginBps: 150, marketplaceBps: 500, earlyRelease: { bps: 200, minMinor: 50 }, flexible: { bps: 800, platformShareBps: 2_500 }, promotion: { categoryWeekMinor: 2_900, topWeekMinor: 7_900 } };
  const protectedTotal = feeOn(EXAMPLE_SEAT_MINOR, fees.protected);
  const directTotal = feeOn(EXAMPLE_SEAT_MINOR, fees.direct) + feeOn(EXAMPLE_SEAT_MINOR, { ...STRIPE_US, capMinor: null });
  return { fees, extra, protectedTotal, directTotal };
}

export function HowSection() {
  return (
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
  );
}

export function DashboardSection() {
  const filled = COHORTS.reduce((n, c) => n + c.filled, 0);
  const cap = COHORTS.reduce((n, c) => n + c.cap, 0);
  const invoiced = COHORTS.reduce((n, c) => n + c.invoiced, 0);
  return (
    <section id="dashboard" className="site-section" aria-labelledby="dashboard-title">
      <h2 className="site-h2" id="dashboard-title">See seats fill. Track every payment.</h2>
      <p className="section-lede">
        One registration dashboard for all your classes: how many seats are left on each date, who has paid and who is on invoice, and when the money reaches you.
      </p>
      <div className="dash-points">
        {DASHBOARD_POINTS.map(([title, text]) => (
          <article key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
      <figure className="preview" aria-label="Example EnrollClass dashboard with four upcoming classes">
        <div className="kpis">
          <div>
            <p className="mono dim">SEATS FILLED</p>
            <p className="kpi">
              {filled} <span className="dim">/ {cap}</span>
            </p>
          </div>
          <div>
            <p className="mono dim">INVOICES DUE</p>
            <p className="kpi">{invoiced}</p>
          </div>
          <div>
            <p className="mono dim">HELD UNTIL DELIVERY</p>
            <p className="kpi">$27,700</p>
          </div>
          <div>
            <p className="mono dim">RELEASED THIS MONTH</p>
            <p className="kpi green">$8,450</p>
          </div>
        </div>
        <div className="preview-table-wrap">
          <div className="preview-table" role="table" aria-label="Seats and payments by class">
            <div className="preview-head mono" role="row">
              <span role="columnheader">CLASS</span>
              <span role="columnheader">SEATS</span>
              <span role="columnheader">PAYMENTS</span>
              <span role="columnheader">HELD</span>
              <span role="columnheader">STATUS</span>
            </div>
            {COHORTS.map((c) => (
              <div className="preview-row" role="row" key={c.name}>
                <div role="cell">
                  <div className="strong">{c.name}</div>
                  <div className="mono dim small">{c.dates}</div>
                </div>
                <div role="cell">
                  <div className="bar">
                    <div style={{ width: `${Math.round((c.filled / c.cap) * 100)}%` }} />
                  </div>
                  <div className="mono small">
                    {c.filled} / {c.cap}
                  </div>
                </div>
                <div role="cell" className="mono small pay-mix">
                  <span className="pay-paid">{c.paid} paid</span>
                  {c.invoiced > 0 && <span className="pay-due">{c.invoiced} invoiced</span>}
                </div>
                <div role="cell" className="mono">{c.held}</div>
                <div role="cell">
                  <span className={`pill-status pill-status-${c.tone}`}>{c.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <figcaption className="mono dim small">Example data. Your dashboard updates as learners register and pay.</figcaption>
      </figure>
    </section>
  );
}

/** The three ways to pay; `full` adds extras and the competitor comparison (the /pricing page). */
export function PricingSection({ data, full }: { data: FeeData; full?: boolean }) {
  const { fees, extra, protectedTotal, directTotal } = data;
  return (
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
            <p>Course pages and embeddable registration, early-bird and group pricing, waitlists, corporate invoices, QR tickets and check-in, certificates, instructor roles, API, webhooks and AI assistants (MCP). Verified digital badges (Open Badges 3.0) with a badge designer: $1 per paid seat, no badge platform subscription.</p>
          </article>
        </div>
        <p className="footnote">By default learners pay the fee as a booking fee, so you keep the full ticket price; you can absorb it instead. Taxes you collect are passed through, never charged a fee. USD rates; other currencies have the same shape.</p>

        {full ? (
          <>
        <h3 className="compare-title">Optional extras</h3>
        <ul className="extras">
          <li>
            <strong>Get paid now</strong>
            <span>{pct(extra.earlyRelease.bps)} to receive held Protected payments before the class is delivered, once you&apos;ve delivered a first class.</span>
          </li>
          <li>
            <strong>Flexible tickets</strong>
            <span>Learners add {pct(extra.flexible.bps)} for a full refund up to 24 hours before the start. You keep {pct(10_000 - extra.flexible.platformShareBps)} of the upgrade.</span>
          </li>
          <li>
            <strong>Verified digital badges</strong>
            <span>{money(extra.verifiedBadgeMinor)} per paid seat for an Open Badges 3.0 badge with every certificate.</span>
          </li>
          <li>
            <strong>Find a class</strong>
            <span>Listing is free. Bookings that come through enrollclass.com/classes carry a {pct(extra.marketplaceBps)} referral fee; bookings from your own links never do.</span>
          </li>
          <li>
            <strong>Promote a course</strong>
            <span>First in its topic for {money(extra.promotion.categoryWeekMinor)}/week, or a Featured card at the top of Find a class for {money(extra.promotion.topWeekMinor)}/week. Four weeks for the price of three; always labelled Sponsored.</span>
          </li>
          <li>
            <strong>Other currencies</strong>
            <span>Learners paying in a currency you haven&apos;t priced pay {pct(extra.fxMarginBps)} for the conversion.</span>
          </li>
        </ul>

        <h3 className="compare-title">What a {money(EXAMPLE_SEAT_MINOR)} certification seat costs you</h3>
        <p className="compare-lede">
          On an expensive seat, flat-fee tools like Corsizio, Ticket Tailor and Arlo cost less per registration than our percentage. The last column shows the gap in dollars against EnrollClass Direct, and the checklist below shows what it pays for.
        </p>
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
                <th scope="col">Compared with EnrollClass Direct</th>
              </tr>
            </thead>
            <tbody>
              <tr className="is-us">
                <th scope="row">EnrollClass Direct</th>
                <td>{feeLabel(fees.direct, "USD")}</td>
                <td>Your Stripe: 2.9% + $0.30</td>
                <td>
                  <strong>{money(directTotal)}</strong>
                </td>
                <td>None</td>
                <td>Your Stripe account</td>
                <td>
                  <span className="diff diff-base">Baseline · everything in the checklist below</span>
                </td>
              </tr>
              <tr className="is-us">
                <th scope="row">EnrollClass Protected</th>
                <td>{feeLabel(fees.protected, "USD")}</td>
                <td>Included</td>
                <td>
                  <strong>{money(protectedTotal)}</strong>
                </td>
                <td>None</td>
                <td>Held until the class is delivered, then paid to you</td>
                <td>
                  <span className="diff diff-more">{money(protectedTotal - directTotal)} more</span> for card fees, disputes and held funds handled for you
                </td>
              </tr>
              {COMPETITORS.map((c) => {
                const gap = c.totalMinor === null ? null : directTotal - c.totalMinor;
                return (
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
                    <td>
                      {gap === null ? (
                        "Not comparable per seat"
                      ) : gap > 0 ? (
                        <>
                          <span className="diff diff-less">
                            {c.licence ? "About " : ""}
                            {money(gap)} less
                          </span>{" "}
                          per seat ({((gap / EXAMPLE_SEAT_MINOR) * 100).toFixed(1)}% of the price){c.licence ? ", plus its monthly licence" : ""}
                        </>
                      ) : (
                        <span className="diff diff-ours">{money(-gap)} more than Direct</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="compare-note">
          <strong>Most organizers pay none of our fee.</strong> By default learners pay the EnrollClass fee as a booking fee at checkout, so you keep the full {money(EXAMPLE_SEAT_MINOR)}. With Protected that also covers card processing; with Direct you pay only Stripe&apos;s card fee. You can switch to absorbing it per organization.
        </p>

        <div className="included" aria-labelledby="included-title">
          <h3 className="compare-title" id="included-title">
            What the difference pays for
          </h3>
          <div className="included-cols">
            <section>
              <h4>Included in every paid seat</h4>
              <ul className="checklist">
                <li>Course page, plus a page and Google event listing for every date</li>
                <li>Registration widget and a full schedule widget for your own website</li>
                <li>Schedule builder: repeat a class monthly or weekly in one step</li>
                <li>Early-bird, group and regional pricing, and waitlists</li>
                <li>Corporate invoices with a card pay link and automatic reminders</li>
                <li>QR tickets and check-in from your phone</li>
                <li>Attendance from Zoom or Teams, certificates and course emails</li>
                <li>Learners change dates or cancel themselves, within your policy</li>
                <li>Listing in Find a class (a referral fee only on bookings it brings)</li>
                <li>Instructor roles and instructor pay tracking</li>
                <li>Import from Eventbrite or a spreadsheet; API, webhooks, Zapier, Make, n8n and AI assistants</li>
                <li>No setup fee, no monthly plan, nothing on free classes</li>
              </ul>
            </section>
            <section>
              <h4>Protected adds</h4>
              <ul className="checklist">
                <li>Card processing included in the fee</li>
                <li>Money held until the class is delivered, then paid to you</li>
                <li>Learners refunded automatically if a class is cancelled</li>
                <li>Chargebacks and disputes handled by EnrollClass</li>
              </ul>
              <h4>Optional, when you want them</h4>
              <ul className="checklist checklist-plus">
                <li>Verified digital badges: {money(extra.verifiedBadgeMinor)} per paid seat</li>
                <li>Flexible tickets learners buy; you keep {pct(10_000 - extra.flexible.platformShareBps)} of the upgrade</li>
                <li>Get paid early: {pct(extra.earlyRelease.bps)} of the released amount</li>
              </ul>
            </section>
          </div>
        </div>

        <p className="footnote">
          Other platforms&apos; prices are from their published US pricing and help pages (linked), checked {CHECKED_ON}; they can change. Totals assume the organizer absorbs the fees and a US card at 2.9% + $0.30. Corsizio&apos;s $0.15 applies once you pass 30 registrations a month; Arlo also needs a monthly licence per administrator.
        </p>
                </>
        ) : (
          <p className="pricing-more">
            <a href="/pricing" className="pill pill-outline">
              Full pricing, extras and how we compare →
            </a>
          </p>
        )}
      </section>
  );
}

export function StartSection() {
  return (
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
  );
}

export function FaqSection({ questions }: { questions: string[] }) {
  const faq = questions.map((q) => ALL_FAQ.find((f) => f.q === q)!).filter(Boolean);
  return (
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
  );
}
