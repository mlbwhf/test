import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, Prose, PublicPage } from "@/components/public-page";
import { COMPETITORS, WHEN_THEM } from "@/lib/public";
import { COMPARISON } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "PI planning tools compared: iObeya, Easy Agile, Agile Hive, BigPicture, PIPlanning.io, Miro and Trainyard",
  description: "Capability comparison of PI planning tools by hosting, PI planning support, ART and team boards, what sits beyond planning, tracker integration and what the price is counted by. No vendor prices, which change; what each tool does.",
  alternates: { canonical: "/compare" },
};

export default function ComparePage() {
  return (
    <PublicPage crumbs={[{ href: "/compare", label: "Compare" }]}>
      <h1>PI planning tools, side by side.</h1>
      <p className="lede">Capabilities only, from a side-by-side evaluation and the vendors&apos; public pages. Products change; check each vendor. Prices are not listed because most are quotes; what each price is counted by is, because that is what decides the bill.</p>
      <Prose>
        <DataTable columns={["Tool", "Hosting", "PI planning", "ART and team boards", "Beyond planning", "Integration", "Priced by"]} rows={COMPARISON.map((c) => [c.tool, c.hosting, c.pi, c.art, c.beyond, c.integration, c.pricedBy])} />
        <h2>One at a time</h2>
        <div className="ly-cards">
          {COMPETITORS.map((c) => (
            <Link key={c.slug} href={`/compare/${c.slug}`} className="ly-card">
              <h3>Trainyard vs {c.tool}</h3>
              <p>{WHEN_THEM[c.slug]}</p>
            </Link>
          ))}
        </div>
        <p>
          Want the reasoning in one place? Read the guide <Link href="/guides/pi-planning-tools">PI planning tools compared</Link>.
        </p>
      </Prose>
    </PublicPage>
  );
}
