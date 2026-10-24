import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter, SiteNav } from "@/components/site-nav";
import { inlineJson, siteUrl } from "@/lib/site";
import "@/app/site.css";

/** The frame for public, indexable pages: the site nav, a reading column, breadcrumbs with schema, the footer. */
export function PublicPage({ crumbs, children, jsonLd }: { crumbs: { href: string; label: string }[]; children: ReactNode; jsonLd?: unknown[] }) {
  const base = siteUrl();
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ href: "/", label: "Trainyard" }, ...crumbs].map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: `${base}${c.href}` })),
  };
  return (
    <div className="ly ly-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: inlineJson([breadcrumb, ...(jsonLd ?? [])]) }} />
      <SiteNav />
      <main id="main" className="ly-article">
        <nav className="ly-crumbs" aria-label="Breadcrumb">
          <Link href="/">Trainyard</Link>
          {crumbs.map((c) => (
            <span key={c.href}>
              {" / "}
              <Link href={c.href}>{c.label}</Link>
            </span>
          ))}
        </nav>
        {children}
      </main>
      <div style={{ marginTop: 80 }}>
        <SiteFooter giant={false} />
      </div>
    </div>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <article className="ly-prose">{children}</article>;
}

export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="ly-tablewrap" tabIndex={0}>
      <table className="ly-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} scope="col">{c || <span className="sr-only">Feature</span>}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
