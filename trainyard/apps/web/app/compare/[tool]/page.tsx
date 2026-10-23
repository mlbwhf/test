import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DataTable, Prose, PublicPage } from "@/components/public-page";
import { COMPETITORS, OURS, WHEN_THEM, competitor } from "@/lib/public";

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ tool: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const c = competitor((await params).tool);
  if (!c) return {};
  return {
    title: `Trainyard vs ${c.tool}: PI planning, ART boards, integration and pricing model compared`,
    description: `${c.tool} (${c.hosting.toLowerCase()}, priced by ${c.pricedBy.toLowerCase()}) against Trainyard (open source, self-hosted or hosted, priced per trainer or per train). PI planning, ART and team boards, portfolio, value streams, Jira and Azure DevOps integration.`,
    alternates: { canonical: `/compare/${c.slug}` },
  };
}

export default async function CompareToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const c = competitor((await params).tool);
  if (!c) notFound();
  const rows: [string, string, string][] = [
    ["Hosting", OURS.hosting, c.hosting],
    ["PI planning", OURS.pi, c.pi],
    ["ART and team boards", OURS.art, c.art],
    ["Beyond planning", OURS.beyond, c.beyond],
    ["Integration", OURS.integration, c.integration],
    ["Priced by", OURS.pricedBy, c.pricedBy],
  ];
  return (
    <PublicPage crumbs={[{ href: "/compare", label: "Compare" }, { href: `/compare/${c.slug}`, label: c.tool }]}>
      <h1>Trainyard vs {c.tool}</h1>
      <p className="lede">
        {c.tool}: {c.hosting.toLowerCase()}; priced by {c.pricedBy.toLowerCase()}. Trainyard: open source, self-hosted with no limits or hosted; priced per trainer or per train, with the people in the room free.
      </p>
      <Prose>
        <DataTable columns={["", "Trainyard", c.tool]} rows={rows} />
        <h2>When {c.tool} is the better pick</h2>
        <p>{WHEN_THEM[c.slug]}</p>
        <h2>When Trainyard is</h2>
        <ul>
          <li>The room holds people who are not tracker users: business owners, customers, a class. Trainyard counts trainers or trains, so they cost nothing.</li>
          <li>The plan must flow back to Jira or Azure DevOps and come from it: features, stories, risks and dependencies sync two ways through an inspectable queue.</li>
          <li>You need more than the board: Portfolio Kanban, value stream identification and mapping, SAFe canvases, PI Outcome Planning, an AI-native portfolio, dashboards.</li>
          <li>You host your own tools, or want to be able to: one Docker Compose, Apache-2.0, every feature.</li>
          <li>You train: Leading SAFe, SPC, Advanced SPC, POPM and RTE class boards, and your own Miro class boards imported.</li>
        </ul>
        <h2>Moving boards over</h2>
        <p>
          {c.tool === "iObeya" ? "iObeya board exports (program, team, Kanban, roadmap and free boards, with charts, images and dependencies) import into Trainyard at their positions and colours, become templates, and map onto the plan when you say so." : c.tool === "Miro" ? "Miro boards import through the REST API or Miro's CSV export; class boards keep their frames and lessons." : "Boards from iObeya, Miro, Mural, monday.com, Trello, CSV and JSON import as they are; Jira and Azure DevOps data syncs rather than imports."}
        </p>
        <p>
          <Link href="/#join" className="ly-cta">
            Try Trainyard free →
          </Link>
        </p>
        <p className="legal" style={{ fontSize: 14, opacity: 0.7 }}>
          {c.tool} is a trademark of its owner. Capabilities are from public pages and a side-by-side evaluation; products change, check the vendor. <Link href="/compare">All comparisons</Link>.
        </p>
      </Prose>
    </PublicPage>
  );
}
