import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";

export const metadata: Metadata = { title: "Your bookings", robots: { index: false } };

/** Learners have no account: each booking is opened from the private link in its confirmation email. */
export default function MyBookings() {
  return (
    <section className="card" style={{ maxWidth: 640 }}>
      <h1>Your bookings</h1>
      <p>
        There&apos;s no account to sign in to. Each booking has its own private page: open the <strong>Manage my booking</strong> or <strong>Open ticket</strong> link in
        your confirmation email to see your ticket, add it to your calendar, change dates or cancel.
      </p>
      <p>
        Can&apos;t find the email? Search your inbox for &ldquo;EnrollClass&rdquo;, or see <a href="/help/tickets">tickets and calendar invitations</a>.
      </p>
      <p>
        <a href={`${siteUrl()}/classes`}>Find another class</a>
      </p>
    </section>
  );
}
