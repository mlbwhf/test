import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter, SiteNav } from "@/components/site-nav";
import { siteUrl } from "@/lib/site";
import "@/app/site.css";

/** The frame for the module pages (Classes, Templates, OKRs): full-width sections, breadcrumb schema, the site nav and footer. */
export function ModulePage({ crumb, children, jsonLd }: { crumb: { href: string; label: string }; children: ReactNode; jsonLd?: unknown[] }) {
  const base = siteUrl();
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trainyard", item: base },
      { "@type": "ListItem", position: 2, name: crumb.label, item: `${base}${crumb.href}` },
    ],
  };
  return (
    <div className="ly">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, ...(jsonLd ?? [])]) }} />
      <SiteNav />
      <main>{children}</main>
      <div style={{ marginTop: 120 }}>
        <SiteFooter giant={false} />
      </div>
    </div>
  );
}

/** The price strip at the end of a module page. */
export function PriceStrip({ tag, amount, unit, text, bg }: { tag: string; amount: string; unit: string; text: ReactNode; bg: string }) {
  return (
    <section>
      <div className="mp-price" style={{ background: bg }}>
        <div>
          <div className="tag">{tag}</div>
          <div className="big">
            <b>{amount}</b>
            <span>{unit}</span>
          </div>
          <p>{text}</p>
        </div>
        <div className="row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/#join" className="pill navy">
            Start the 30-day trial
          </Link>
          <Link href="/pricing" className="pill">
            Compare all plans
          </Link>
        </div>
      </div>
    </section>
  );
}
