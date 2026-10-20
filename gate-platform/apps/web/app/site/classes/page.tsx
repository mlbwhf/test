import type { Metadata } from "next";
import Link from "next/link";
import { publicCatalog } from "@/lib/catalog";
import { appUrl, jsonLd, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find a class",
  description: "Upcoming training classes published on EnrollClass: certification courses, workshops and bootcamps. Register on the class page; no account needed.",
  alternates: { canonical: "/classes" },
};

const day = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

/** Learners land here from the home page: every course with upcoming classes, linking to its page. */
export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  // Organizers can opt out of the class finder; bookings that come through it carry a referral fee.
  const all = (await publicCatalog()).filter((c) => c.listed !== false).sort((a, b) => a.nextStartsAt.localeCompare(b.nextStartsAt));
  const needle = q.toLowerCase();
  const items = needle ? all.filter((c) => `${c.name} ${c.organizationName}`.toLowerCase().includes(needle)) : all;
  const page = (c: (typeof all)[number]) => `${appUrl()}/c/${encodeURIComponent(c.organizationId)}/${encodeURIComponent(c.slug)}`;
  const visit = (c: (typeof all)[number]) => `${page(c)}?via=enrollclass`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Upcoming classes on EnrollClass",
    url: `${siteUrl()}/classes`,
    itemListElement: all.slice(0, 200).map((c, i) => ({ "@type": "ListItem", position: i + 1, url: page(c), name: c.name })),
  };
  return (
    <main className="classes">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <header className="faq-head">
        <p className="eyebrow-mono">FIND A CLASS</p>
        <h1>Upcoming classes</h1>
        <p>Pick a course, choose a date and register on its page. No account needed: your ticket, calendar invitation and booking link arrive by email.</p>
      </header>
      <form className="classes-search" role="search" action="/classes">
        <label htmlFor="classes-q" className="sr-only">
          Search classes
        </label>
        <input id="classes-q" name="q" type="search" defaultValue={q} placeholder="Search by course or training provider" />
        <button type="submit" className="pill pill-ink">
          Search
        </button>
      </form>
      {items.length === 0 ? (
        <p className="classes-empty">
          {q ? `No upcoming classes match "${q}".` : "No upcoming classes are listed right now."} Training providers often share their own registration link; check their website or the email they sent you.
        </p>
      ) : (
        <ul className="classes-list">
          {items.map((c) => (
            <li key={`${c.organizationId}/${c.slug}`}>
              <a href={visit(c)}>
                <strong>{c.name}</strong>
                <span>{c.organizationName}</span>
                <span className="mono">
                  Next: {day(c.nextStartsAt)} · {c.classes} date{c.classes === 1 ? "" : "s"}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="classes-foot">
        Already registered? Your confirmation email has your ticket and a link to change or cancel. <Link href="/help/tickets">Learner help</Link>
        <br />
        Run classes yourself? <a href={`${appUrl()}/login?mode=signup`}>Sign up free</a> and publish your first one in minutes.
      </p>
    </main>
  );
}
