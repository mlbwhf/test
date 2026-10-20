import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HELP, HELP_SECTIONS, helpBySlug } from "@/lib/help";
import { HelpBody } from "@/components/help-render";
import { jsonLd, siteUrl } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return HELP.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const a = helpBySlug((await params).slug);
  return a ? { title: a.title, description: a.summary, alternates: { canonical: `/help/${a.slug}` }, openGraph: { title: a.title, description: a.summary, type: "article" } } : {};
}

export default async function HelpArticlePage({ params }: { params: Params }) {
  const a = helpBySlug((await params).slug);
  if (!a) notFound();
  const section = HELP_SECTIONS.find((s) => s.key === a.section)!;
  const siblings = HELP.filter((x) => x.section === a.section);
  const related = (a.related ?? []).map(helpBySlug).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const i = HELP.indexOf(a);
  const next = HELP[i + 1];

  const url = `${siteUrl()}/help/${a.slug}`;
  const steps = a.body.flatMap((b) => ("steps" in b ? b.steps : []));
  const ld = [
    { "@context": "https://schema.org", "@type": "TechArticle", headline: a.title, description: a.summary, url, inLanguage: "en", audience: a.for.map((f) => ({ "@type": "Audience", audienceType: f })), publisher: { "@type": "Organization", name: "EnrollClass", url: siteUrl() } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Help", item: `${siteUrl()}/help` }, { "@type": "ListItem", position: 2, name: section.title, item: `${siteUrl()}/help#${section.key}` }, { "@type": "ListItem", position: 3, name: a.title, item: url }] },
    ...(steps.length >= 2 ? [{ "@context": "https://schema.org", "@type": "HowTo", name: a.title, description: a.summary, step: steps.map((t, n) => ({ "@type": "HowToStep", position: n + 1, text: t.replace(/\*\*|`|\[([^\]]+)\]\([^)]*\)/g, "$1") })) }] : []),
  ];
  return (
    <main className="help-main help-article-wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ld) }} />
      <aside className="help-side" aria-label={section.title}>
        <Link href="/help" className="help-back">
          ← All help
        </Link>
        <p className="eyebrow-mono">{section.title.toUpperCase()}</p>
        <ul>
          {siblings.map((s) => (
            <li key={s.slug}>
              <Link href={`/help/${s.slug}`} aria-current={s.slug === a.slug ? "page" : undefined}>
                {s.title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <article className="help-article">
        <p className="help-crumbs">
          <Link href="/help">Help</Link> / <Link href={`/help#${section.key}`}>{section.title}</Link>
        </p>
        <h1>{a.title}</h1>
        <p className="help-summary">{a.summary}</p>
        <p className="help-for">
          {a.for.map((f) => (
            <span key={f} className="chip">
              {f}
            </span>
          ))}
        </p>
        <HelpBody blocks={a.body} />
        {related.length > 0 && (
          <section className="help-related" aria-labelledby="rel-title">
            <h2 id="rel-title">Related</h2>
            <ul>
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/help/${r.slug}`}>
                    <strong>{r.title}</strong>
                    <span>{r.summary}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {next && (
          <p className="help-next">
            Next: <Link href={`/help/${next.slug}`}>{next.title} →</Link>
          </p>
        )}
      </article>
    </main>
  );
}
