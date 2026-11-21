import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModulePage } from "@/components/module-page";
import { INTEGRATION_LIST, integration } from "@/lib/integrations";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return INTEGRATION_LIST.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const i = integration((await params).slug);
  if (!i) return {};
  return { title: i.title, description: i.lede, alternates: { canonical: `/integrations/${i.slug}` } };
}

export default async function IntegrationPage({ params }: { params: Promise<{ slug: string }> }) {
  const i = integration((await params).slug);
  if (!i) notFound();
  const others = INTEGRATION_LIST.filter((x) => x.slug !== i.slug);
  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Set up the ${i.name} integration in Trainyard`,
    description: i.lede,
    step: i.steps.map((s, n) => ({ "@type": "HowToStep", position: n + 1, text: s })),
    url: `${siteUrl()}/integrations/${i.slug}`,
  };
  return (
    <ModulePage crumb={{ href: `/integrations/${i.slug}`, label: `${i.name} integration` }} jsonLd={[howTo]}>
      <header className="mp-hero">
        <div className="eyebrow">
          <Link href="/integrations">INTEGRATIONS</Link> · {i.kind.toUpperCase()}
        </div>
        <h1>
          Trainyard and <span className="hl" style={{ background: i.bg }}>{i.name}</span>
        </h1>
        <p className="lede">{i.lede}</p>
        <div className="ctas">
          <Link href="/#join" className="pill navy">
            Start free
          </Link>
          <Link href="/integrations" className="pill">
            All integrations
          </Link>
        </div>
      </header>
      <section style={{ paddingTop: 70 }}>
        <div className="eyebrow">WHAT {i.kind === "Import" ? "COMES OVER" : "STAYS IN STEP"}</div>
        <ul className="ig-list">
          {i.what.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </section>
      <section>
        <div className="eyebrow">HOW TO SET IT UP</div>
        <div className="mp-steps" style={{ marginTop: 20 }}>
          {i.steps.map((s, n) => (
            <div key={s} className="mp-step">
              <div className="n">{n + 1}</div>
              <p>{s}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className="eyebrow">GOOD TO KNOW</div>
        <ul className="ig-list plain">
          {i.limits.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </section>
      <section>
        <div className="eyebrow">OTHER INTEGRATIONS</div>
        <nav className="cv-jump" aria-label="Other integrations" style={{ marginTop: 16 }}>
          {others.map((x) => (
            <Link key={x.slug} href={`/integrations/${x.slug}`}>{x.name}</Link>
          ))}
        </nav>
      </section>
    </ModulePage>
  );
}
