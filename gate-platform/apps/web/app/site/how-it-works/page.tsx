import type { Metadata } from "next";
import { APP, DashboardSection, HowSection } from "../sections";

export const metadata: Metadata = {
  title: "How it works",
  description: "Publish a class, take card or invoice payments, and get paid after delivery. Course pages, a page for every date, waitlists, check-in, certificates and badges in one place.",
  alternates: { canonical: "/how-it-works" },
};

const FLOW = [
  ["Create the course once", "Description, cover image, badge, policies and default price. Every date inherits them."],
  ["Schedule the dates", "Add one date, then repeat it monthly, weekly or on dates you pick with the schedule builder. Each date gets its own page."],
  ["Share or embed", "Send the course page, a date page, or put the schedule widget on your own website. Learners need no account."],
  ["Take payment", "Card (with early-bird, group and regional prices), corporate invoices with a pay link, or free registration."],
  ["Run the day", "QR tickets, check-in from your phone, attendance, then certificates and verified badges."],
  ["Get paid", "Protected payments are released after delivery; Direct payments land in your Stripe right away."],
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <header className="page-head">
        <p className="eyebrow">How it works</p>
        <h1>From first date to payout, in one place.</h1>
        <p>EnrollClass handles registration, payment and delivery for training businesses, so you can teach.</p>
      </header>
      <HowSection />
      <section className="site-section" aria-labelledby="flow-title">
        <h2 className="site-h2" id="flow-title">A course, step by step</h2>
        <div className="feature-grid">
          {FLOW.map(([title, text], i) => (
            <article key={title} className="feature">
              <p className="mono green">{String(i + 1).padStart(2, "0")}</p>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <DashboardSection />
      <section className="site-section sand cta-band">
        <h2 className="site-h2">Publish your first class today</h2>
        <div className="site-cta">
          <a href={`${APP}/login?mode=signup`} className="pill pill-green">
            Sign up free
          </a>
          <a href="/pricing" className="pill pill-outline">
            See pricing
          </a>
        </div>
      </section>
    </>
  );
}
