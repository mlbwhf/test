import type { Metadata } from "next";
import Link from "next/link";
import { ALL_FAQ, FAQ_GROUPS } from "@/lib/faq";
import { jsonLd, siteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description: "Answers about publishing classes, payments held until delivery, refunds, instructors, certificates, integrations and AI assistants on EnrollClass.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ALL_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    url: `${siteUrl()}/faq`,
  };
  return (
    <main className="faq">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />
      <header className="faq-head">
        <p className="eyebrow-mono">FAQ</p>
        <h1>Questions, answered</h1>
        <p>
          The short answers. For step-by-step guides, see the <Link href="/help">help center</Link>.
        </p>
      </header>
      {FAQ_GROUPS.map((g) => (
        <section key={g.title} className="faq-group" aria-label={g.title}>
          <h2>{g.title}</h2>
          {g.items.map((f) => (
            <details key={f.q} className="faq-item">
              <summary>{f.q}</summary>
              <p>
                {f.a}
                {f.link && (
                  <>
                    {" "}
                    <Link href={f.link}>Read more →</Link>
                  </>
                )}
              </p>
            </details>
          ))}
        </section>
      ))}
      <p className="faq-more">
        Still have a question? <a href="mailto:support@enrollclass.com">support@enrollclass.com</a>
      </p>
    </main>
  );
}
