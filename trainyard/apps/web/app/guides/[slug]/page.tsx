import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataTable, Prose, PublicPage } from "@/components/public-page";
import { GUIDES, guide } from "@/lib/public";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = guide((await params).slug);
  if (!g) return {};
  return { title: g.title, description: g.description, alternates: { canonical: `/guides/${g.slug}` }, openGraph: { type: "article", title: g.title, description: g.description, modifiedTime: g.updated } };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = guide((await params).slug);
  if (!g) notFound();
  const base = siteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline: g.title,
      description: g.description,
      dateModified: g.updated,
      author: { "@type": "Organization", name: "Trainyard" },
      publisher: { "@type": "Organization", name: "Trainyard", url: base },
      mainEntityOfPage: `${base}/guides/${g.slug}`,
    },
  ];
  return (
    <PublicPage crumbs={[{ href: "/guides", label: "Guides" }, { href: `/guides/${g.slug}`, label: g.title.split(":")[0]! }]} jsonLd={jsonLd}>
      <h1>{g.title}</h1>
      <p className="lede">{g.description}</p>
      <Prose>
        {g.sections.map((s) => (
          <section key={s.heading}>
            <h2>{s.heading}</h2>
            {s.paragraphs?.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
            {s.bullets ? (
              <ul>
                {s.bullets.map((b) => (
                  <li key={b.slice(0, 40)}>{b}</li>
                ))}
              </ul>
            ) : null}
            {s.table ? <DataTable columns={s.table.columns} rows={s.table.rows} /> : null}
          </section>
        ))}
        <Link href={g.cta.href} className="ly-cta">
          {g.cta.label} →
        </Link>
        <p className="legal" style={{ fontSize: 14, opacity: 0.7 }}>
          Updated {g.updated}. SAFe® is a registered trademark of Scaled Agile, Inc. <Link href="/guides">All guides</Link>.
        </p>
      </Prose>
    </PublicPage>
  );
}
