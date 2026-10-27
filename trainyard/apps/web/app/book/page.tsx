import type { Metadata } from "next";
import { BookSession, type SessionType } from "@/components/book-session";
import { supportEmail } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a session",
  description: "Book a Trainyard product demo, a support session with a Trainyard specialist, or a billing call. Pick a time in your own time zone; the calendar invite and video link arrive by email.",
  alternates: { canonical: "/book" },
};

// The booking links are read when the page is served, so they change on the server without a rebuild.
export const dynamic = "force-dynamic";

/**
 * Each session type books through a Google Calendar appointment schedule: set its booking page
 * link in TRAINYARD_BOOKING_DEMO_URL, TRAINYARD_BOOKING_SUPPORT_URL and TRAINYARD_BOOKING_BILLING_URL
 * (TRAINYARD_BOOKING_URL is used for any type without its own). Google shows the free times,
 * takes the details, creates the event with a Meet link and sends the invite.
 */
const bookingUrl = (key: string): string | null => {
  const raw = (process.env[`TRAINYARD_BOOKING_${key}_URL`] || process.env.TRAINYARD_BOOKING_URL || "").trim();
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && u.hostname === "calendar.google.com" ? u.toString() : null;
  } catch {
    return null;
  }
};

export default async function BookPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const types: SessionType[] = [
    { id: "demo", name: "Product demo", desc: "See boards, ROAM and dashboards live", mins: 30, url: bookingUrl("DEMO") },
    { id: "support", name: "Support session", desc: "Get unstuck with a Trainyard specialist", mins: 20, url: bookingUrl("SUPPORT") },
    { id: "billing", name: "Billing call", desc: "Invoices, seats and plan changes", mins: 15, url: bookingUrl("BILLING") },
  ];
  return <BookSession types={types} initial={types.some((t) => t.id === type) ? type! : "demo"} email={supportEmail()} />;
}
