import type { Metadata } from "next";
import Link from "next/link";
import { keyOf, publicCatalogWithCategories } from "@/lib/catalog";
import { appUrl, jsonLd, siteUrl } from "@/lib/seo";
import { ClassFinder, type FinderState } from "@/components/class-finder";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Find a class",
  description: "Upcoming training classes published on EnrollClass: certification courses, workshops and bootcamps. Filter by topic, format and price, compare classes, and register on the class page; no account needed.",
  alternates: { canonical: "/classes" },
};

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
const many = (v: string | string[] | undefined) => one(v).split(",").map((x) => x.trim()).filter(Boolean);

/** Learners land here from the home page: every course with upcoming classes, filterable and comparable. */
export default async function ClassesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const { items: catalog, categories } = await publicCatalogWithCategories();
  // Organizers can opt out of the class finder; bookings that come through it carry a referral fee.
  const items = catalog.filter((c) => c.listed !== false);
  const max = Number(one(sp.max));
  const sel = one(sp.class);
  const initial: FinderState = {
    q: one(sp.q),
    view: one(sp.view) === "table" ? "table" : "cards",
    sort: one(sp.sort) === "price" ? "price" : "soonest",
    cats: many(sp.category),
    modes: many(sp.format),
    badges: many(sp.badge),
    provs: many(sp.provider),
    max: one(sp.max) && Number.isFinite(max) && max >= 0 ? max : null,
    sel: items.some((c) => keyOf(c) === sel) ? sel : null,
  };
  const page = (c: (typeof items)[number]) => `${appUrl()}/c/${encodeURIComponent(c.organizationId)}/${encodeURIComponent(c.slug)}`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Upcoming classes on EnrollClass",
    url: `${siteUrl()}/classes`,
    itemListElement: items.slice(0, 200).map((c, i) => ({ "@type": "ListItem", position: i + 1, url: page(c), name: c.name })),
  };
  return (
    <main className="classes-app">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <ClassFinder items={items} categories={categories.filter((c) => items.some((i) => i.category === c.id))} initial={initial} appUrl={appUrl()} />
      <p className="classes-foot">
        Already registered? Your confirmation email has your ticket and a link to change or cancel. <Link href="/help/tickets">Learner help</Link>
        <br />
        Run classes yourself? <a href={`${appUrl()}/login?mode=signup`}>Sign up free</a> and publish your first one in minutes. Listings marked Sponsored are paid
        placements; <Link href="/help/promote-a-class">how promotion works</Link>.
      </p>
    </main>
  );
}
