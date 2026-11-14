import type { Metadata } from "next";
import Link from "next/link";
import { publicCatalogWithCategories } from "@/lib/catalog";
import { appUrl, jsonLd, siteUrl } from "@/lib/seo";
import { ClassFinder, type FinderState } from "@/components/class-finder";
import { RxFonts } from "@/components/class-page/shared";
import { groupCertifications } from "@/lib/finder";
import "../../c/registration.css";
import "./finder.css";

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
  const certs = groupCertifications(items);
  const ids = new Set(certs.map((c) => c.id));
  // Older links used comma lists and format ids (live_virtual, in_person); keep them working.
  const fmt = many(sp.format);
  const sort = one(sp.sort);
  const sel = one(sp.class);
  const initial: FinderState = {
    q: one(sp.q),
    quick: one(sp.quick),
    cat: many(sp.category)[0] ?? "",
    month: /^\d{4}-\d{2}$/.test(one(sp.month)) ? one(sp.month) : "",
    format: fmt.includes("in_person") ? "in_person" : fmt.some((f) => f === "online" || f === "live_virtual" || f === "hybrid") ? "online" : "any",
    lang: /^[A-Za-z]{2}$/.test(one(sp.lang)) ? one(sp.lang).toUpperCase() : "",
    provs: many(sp.provider),
    sort: sort === "price" || sort === "seats" ? sort : "soonest",
    sel: ids.has(sel) ? sel : null,
    cmp: many(sp.compare).filter((x) => ids.has(x)).slice(0, 3),
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
    <main className="rx cf-page">
      <RxFonts />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <ClassFinder items={items} categories={categories.filter((c) => items.some((i) => i.category === c.id))} initial={initial} appUrl={appUrl()} />
      <p className="cf-foot">
        Already registered? Your confirmation email has your ticket and a link to change or cancel. <Link href="/help/tickets">Learner help</Link>
        <br />
        Run classes yourself? <a href={`${appUrl()}/login?mode=signup`}>Sign up free</a> and publish your first one in minutes. Listings marked Sponsored are paid
        placements; <Link href="/help/promote-a-class">how promotion works</Link>.
      </p>
    </main>
  );
}
