import type { Metadata } from "next";
import Link from "next/link";
import { publicCatalogWithCategories, type CatalogItem } from "@/lib/catalog";
import { appUrl, jsonLd, siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find a class",
  description: "Upcoming training classes published on EnrollClass: certification courses, workshops and bootcamps. Register on the class page; no account needed.",
  alternates: { canonical: "/classes" },
};

const day = (iso: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(iso));

/** Shuffled so every paid Featured spot gets its turn at the front. */
function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

/** Learners land here from the home page: every course with upcoming classes, linking to its page. */
export default async function ClassesPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; category?: string | string[] }> }) {
  const sp = await searchParams;
  const q = one(sp.q);
  const { items: catalog, categories } = await publicCatalogWithCategories();
  // Organizers can opt out of the class finder; bookings that come through it carry a referral fee.
  const all = catalog.filter((c) => c.listed !== false).sort((a, b) => a.nextStartsAt.localeCompare(b.nextStartsAt));
  const counts = new Map<string, number>();
  for (const c of all) if (c.category) counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
  const shown = categories.filter((c) => counts.has(c.id));
  const category = shown.some((c) => c.id === one(sp.category)) ? one(sp.category) : "";
  const needle = q.toLowerCase();
  let items = all.filter((c) => (!category || c.category === category) && (!needle || `${c.name} ${c.organizationName}`.toLowerCase().includes(needle)));
  // Paid placements: first in their topic, and the Featured row on the unfiltered page. Always labelled.
  if (category) items = [...shuffle(items.filter((c) => c.promoted)), ...items.filter((c) => !c.promoted)];
  const featured = !category && !q ? shuffle(all.filter((c) => c.promoted === "top")).slice(0, 3) : [];
  const page = (c: CatalogItem) => `${appUrl()}/c/${encodeURIComponent(c.organizationId)}/${encodeURIComponent(c.slug)}`;
  const visit = (c: CatalogItem) => `${page(c)}?via=enrollclass`;
  const chip = (id: string) => {
    const p = new URLSearchParams();
    if (id) p.set("category", id);
    if (q) p.set("q", q);
    const qs = p.toString();
    return `/classes${qs ? `?${qs}` : ""}`;
  };
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
        {category && <input type="hidden" name="category" value={category} />}
        <input id="classes-q" name="q" type="search" defaultValue={q} placeholder="Search by course or training provider" />
        <button type="submit" className="pill pill-ink">
          Search
        </button>
      </form>
      {shown.length > 1 && (
        <nav className="classes-cats" aria-label="Topics">
          <Link href={chip("")} aria-current={category ? undefined : "page"}>
            All
          </Link>
          {shown.map((c) => (
            <Link key={c.id} href={chip(c.id)} aria-current={category === c.id ? "page" : undefined}>
              {c.label} <span>{counts.get(c.id)}</span>
            </Link>
          ))}
        </nav>
      )}
      {featured.length > 0 && (
        <section className="classes-featured" aria-labelledby="featured-title">
          <h2 id="featured-title">Featured</h2>
          <ul>
            {featured.map((c) => (
              <li key={`${c.organizationId}/${c.slug}`}>
                <a href={visit(c)}>
                  {c.imageUrl ? <img src={c.imageUrl} alt="" loading="lazy" /> : <div className="classes-featured-pad" aria-hidden="true" />}
                  <span className="classes-sponsored">Sponsored</span>
                  <strong>{c.name}</strong>
                  <span>{c.organizationName}</span>
                  <span className="mono">Next: {day(c.nextStartsAt)}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {items.length === 0 ? (
        <p className="classes-empty">
          {q ? `No upcoming classes match "${q}".` : "No upcoming classes are listed right now."} Training providers often share their own registration link; check their website or the email they sent you.
        </p>
      ) : (
        <ul className="classes-list">
          {items.map((c) => (
            <li key={`${c.organizationId}/${c.slug}`}>
              <a href={visit(c)}>
                {category && c.promoted && <span className="classes-sponsored">Sponsored</span>}
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
        Run classes yourself? <a href={`${appUrl()}/login?mode=signup`}>Sign up free</a> and publish your first one in minutes. Listings marked
        Sponsored are paid placements; <Link href="/help/promote-a-class">how promotion works</Link>.
      </p>
    </main>
  );
}
