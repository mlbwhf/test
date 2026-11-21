import type { Metadata } from "next";
import Link from "next/link";
import { ModulePage } from "@/components/module-page";
import { INTEGRATION_GROUPS, INTEGRATION_LIST } from "@/lib/integrations";

export const metadata: Metadata = {
  title: "Integrations: Jira, Azure DevOps, Miro, Lucid, Mural, Trello, monday.com, iObeya and spreadsheets",
  description: "How Trainyard works with the tools you already use: two-way sync with Jira and Azure DevOps, and imports from Miro, Lucidchart and Lucidspark, Mural, Trello, monday.com, iObeya and any spreadsheet.",
  alternates: { canonical: "/integrations" },
};

export default function IntegrationsPage() {
  return (
    <ModulePage crumb={{ href: "/integrations", label: "Integrations" }}>
      <header className="mp-hero">
        <div className="eyebrow">INTEGRATIONS</div>
        <h1>
          Works with the tools you <span className="hl" style={{ background: "#5ff0e0" }}>already use.</span>
        </h1>
        <p className="lede">Two-way sync with your work tracker, so the plan made in the room lands where the work is done. Imports from your whiteboards, so nothing is redrawn.</p>
        <nav className="cv-jump" aria-label="Platforms">
          {INTEGRATION_LIST.map((i) => (
            <Link key={i.slug} href={`/integrations/${i.slug}`}>{i.name}</Link>
          ))}
        </nav>
      </header>
      {INTEGRATION_GROUPS.map((g, gi) => (
        <section key={g} style={gi ? undefined : { paddingTop: 70 }}>
          <div className="eyebrow">{g.toUpperCase()}</div>
          <div className="mp-grid" style={{ marginTop: 20 }}>
            {INTEGRATION_LIST.filter((i) => i.group === g).map((i) => (
              <Link key={i.slug} href={`/integrations/${i.slug}`} className="mp-card" style={{ background: i.bg, textDecoration: "none" }}>
                <div className="top">
                  <span>{i.kind.toUpperCase()}</span>
                </div>
                <h2>{i.name}</h2>
                <p>{i.line}</p>
                <p style={{ fontSize: 15 }}>{i.what[0]}</p>
                <b>How it works →</b>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </ModulePage>
  );
}
