import type { Metadata } from "next";
import Link from "next/link";
import { Prose, PublicPage } from "@/components/public-page";
import { GUIDES } from "@/lib/public";

export const metadata: Metadata = {
  title: "Guides: ART readiness checklist, PI Outcome Planning, AI-Native ART, PI planning tools",
  description: "Working guides from inside the product: SAFe's ART readiness checklist with its questions, the one-day PI Outcome Planning agenda and boards, how an AI-Native ART runs its pipeline and gates, and PI planning tools compared.",
  alternates: { canonical: "/guides" },
};

export default function GuidesPage() {
  return (
    <PublicPage crumbs={[{ href: "/guides", label: "Guides" }]}>
      <h1>Guides from inside the product.</h1>
      <p className="lede">Each guide is generated from the same data the rooms run on, so what you read here is what the canvas, board or pipeline does.</p>
      <Prose>
        <div className="ly-cards">
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/guides/${g.slug}`} className="ly-card">
              <h3>{g.title}</h3>
              <p>{g.description}</p>
            </Link>
          ))}
        </div>
      </Prose>
    </PublicPage>
  );
}
