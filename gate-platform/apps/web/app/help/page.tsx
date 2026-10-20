import Link from "next/link";
import { HELP, HELP_SECTIONS, helpText } from "@/lib/help";
import { HelpSearch } from "@/components/help-search";

export const metadata = { alternates: { canonical: "/help" }, description: "Step-by-step guides for running classes with EnrollClass: setup, registration, check-in, certificates, payments, team roles and integrations." };

export default function HelpHome() {
  const sectionTitle = Object.fromEntries(HELP_SECTIONS.map((s) => [s.key, s.title]));
  const entries = HELP.map((a) => ({ slug: a.slug, title: a.title, summary: a.summary, section: sectionTitle[a.section] ?? "", text: helpText(a) }));
  return (
    <main className="help-main">
      <section className="help-hero">
        <p className="eyebrow-mono">HELP CENTER</p>
        <h1>How can we help?</h1>
        <HelpSearch entries={entries} />
        <p className="help-popular">
          Popular: <Link href="/help/quick-start">Quick start</Link> · <Link href="/help/create-a-class">Create a class</Link> · <Link href="/help/check-in">Check-in</Link> ·{" "}
          <Link href="/help/how-payments-work">How payments work</Link> · <Link href="/help/certificates">Certificates</Link>
        </p>
      </section>

      <div className="help-sections">
        {HELP_SECTIONS.map((s) => (
          <section key={s.key} className="help-section" id={s.key} aria-labelledby={`sec-${s.key}`}>
            <h2 id={`sec-${s.key}`}>{s.title}</h2>
            <p className="muted">{s.blurb}</p>
            <ul>
              {HELP.filter((a) => a.section === s.key).map((a) => (
                <li key={a.slug}>
                  <Link href={`/help/${a.slug}`}>{a.title}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
