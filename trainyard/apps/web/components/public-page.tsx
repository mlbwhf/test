import Link from "next/link";
import type { ReactNode } from "react";
import { REPO_URL, siteUrl } from "@/lib/site";
import "@/app/site.css";

/** The frame for public, indexable pages: the landing page's look, a reading column, breadcrumbs with schema. */
export function PublicPage({ crumbs, children, jsonLd }: { crumbs: { href: string; label: string }[]; children: ReactNode; jsonLd?: unknown[] }) {
  const base = siteUrl();
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ href: "/", label: "Trainyard" }, ...crumbs].map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: `${base}${c.href}` })),
  };
  return (
    <div className="ly ly-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([breadcrumb, ...(jsonLd ?? [])]) }} />
      <nav className="ly-nav" aria-label="Site">
        <Link href="/" className="brand">
          <span className="word">
            Train<b>yard</b>
          </span>
        </Link>
        <div className="links">
          <Link href="/classes">SAFe classes</Link>
          <Link href="/guides">Guides</Link>
          <Link href="/compare">Tool comparison</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login" style={{ fontWeight: 600 }}>
            Sign in
          </Link>
          <Link href="/#join" className="pill navy">
            Sign up free →
          </Link>
        </div>
      </nav>
      <main className="ly-article">
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
      <footer className="ly-foot" style={{ marginTop: 80 }}>
        <div className="meta">
          <span>Trainyard · open source, Apache-2.0</span>
          <span>
            <Link href="/pricing">Pricing</Link> · <Link href="/classes">Classes</Link> · <Link href="/guides">Guides</Link> · <Link href="/compare">Compare</Link> · <a href="/llms.txt">llms.txt</a> · <a href="/llms-full.txt">llms-full.txt</a> ·{" "}
            <a href={REPO_URL} rel="noopener">
              Source
            </a>
          </span>
        </div>
        <p className="legal">SAFe® and Scaled Agile Framework® are registered trademarks of Scaled Agile, Inc. Jira is a trademark of Atlassian. Azure DevOps is a trademark of Microsoft. Other product names belong to their owners. Trainyard is not affiliated with them.</p>
      </footer>
    </div>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return <article className="ly-prose">{children}</article>;
}

export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="ly-tablewrap">
      <table className="ly-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
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
