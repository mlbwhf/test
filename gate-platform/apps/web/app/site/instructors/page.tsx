import type { Metadata } from "next";
import { StartSection } from "../sections";

export const metadata: Metadata = {
  title: "For instructors and training companies",
  description: "Everything an instructor or training company needs to fill classes: schedule builder, a page for every date, a schedule widget for your website, corporate invoices, check-in, certificates and verified badges.",
  alternates: { canonical: "/instructors" },
};

const FEATURES = [
  ["Schedule builder", "Repeat a class every month, week or on dates you pick, skip holidays, and publish them all at once."],
  ["A page for every date", "Each date has its own shareable page and Google event listing, plus a course page with every date."],
  ["Schedule widget for your website", "List and calendar views, filters, times in the visitor's time zone, and registration that opens right under the date."],
  ["Corporate invoices", "Invoice a company for a block of seats; they pay by card from a link or by bank transfer, with automatic reminders."],
  ["Check-in and certificates", "QR tickets, check-in from your phone, attendance, certificates and verified digital badges."],
  ["Find a class", "Get listed in EnrollClass's class finder with your logo and badge; promote a course when you need more seats."],
  ["Team roles", "Invite instructors, admins and finance with the access each needs; instructors see their own classes."],
  ["Import and integrate", "Bring your schedule from Eventbrite or a spreadsheet; connect webhooks, Zapier, Make, n8n or an AI assistant."],
] as const;

export default function InstructorsPage() {
  return (
    <>
      <header className="page-head">
        <p className="eyebrow">For instructors</p>
        <h1>Teach. We&apos;ll handle the seats and the money.</h1>
        <p>For independent instructors and training companies running certification courses, workshops and bootcamps.</p>
      </header>
      <section className="site-section" aria-labelledby="features-title">
        <h2 className="site-h2" id="features-title">Built for classes with dates and seats</h2>
        <div className="feature-grid">
          {FEATURES.map(([title, text]) => (
            <article key={title} className="feature">
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <StartSection />
    </>
  );
}
