import type { Metadata } from "next";
import Link from "next/link";
import { DataTable, Prose, PublicPage } from "@/components/public-page";
import { FAQ, PLANS } from "@/lib/pricing";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing: free for small rooms, per trainer or per train, with a free trial and money back",
  description: "Trainyard pricing. Practice is free: self-host with no limits, or one hosted room up to 5 people. Trainer $19 per trainer per month, Academy $249 per train per month, both with a free 30-day trial, month by month, and a money-back guarantee on the first paid month.",
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  const base = siteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Trainyard",
      description: "Open-source planning rooms for scaled agile, hosted or self-hosted.",
      brand: { "@type": "Brand", name: "Trainyard" },
      url: `${base}/pricing`,
      offers: PLANS.map((p) => ({ "@type": "Offer", name: p.name, price: p.monthly ?? 0, priceCurrency: "USD", url: `${base}/pricing`, availability: "https://schema.org/InStock", description: p.blurb })),
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];
  return (
    <PublicPage crumbs={[{ href: "/pricing", label: "Pricing" }]} jsonLd={jsonLd}>
      <h1>Pricing that counts trainers and trains, not the people in the room.</h1>
      <p className="lede">Practice is free. Trainer and Academy start with a free 30-day trial, bill month by month, and carry a money-back guarantee on the first paid month that you claim yourself. Yearly billing, ten months for twelve, is a switch after the first month.</p>
      <div className="ly-cards">
        {PLANS.map((p) => (
          <Link key={p.id} href="/#join" className="ly-card">
            <span className="tag">{p.tag}</span>
            <h3>
              {p.name} · {p.monthly === null ? "$0" : `$${p.monthly}`} {p.unit}
            </h3>
            <p>{p.blurb}</p>
            <ul style={{ paddingLeft: 18, marginTop: 10, fontSize: 15 }}>
              {p.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </Link>
        ))}
      </div>
      <Prose>
        <h2>How the plans count</h2>
        <DataTable
          columns={["", "Practice", "Trainer", "Academy", "Insights"]}
          rows={[
            ["Price", "Free", "$19 per trainer per month ($16 yearly)", "$249 per train per month ($199 yearly)", "$99 per pack of 10 data sources per month ($83 yearly)"],
            ["Who counts", "Up to 5 people in one hosted room", "Trainers and planners; participants are free", "Trains; people are free", "Data sources; viewers are free, up to 5 editors"],
            ["Boards of your own", "1", "Unlimited", "Unlimited", "1"],
            ["Outcome dashboard sources", "2", "3", "Unlimited", "10 per pack"],
            ["Self-hosting", "Unlimited, every feature", "Yes", "Yes, with a support agreement", "Yes"],
            ["Free trial", "n/a", "30 days", "30 days", "30 days"],
            ["Money back", "n/a", "First paid month, within 30 days", "First paid month, within 30 days", "First paid month, within 30 days"],
            ["Jira app and Azure DevOps extension", "Self-hosted only", "Sync", "Included", "Jira as a data source"],
          ]}
        />
        <h2>Questions people ask</h2>
        {FAQ.map((f) => (
          <div key={f.q}>
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
        <Link href="/#join" className="ly-cta">
          Start free →
        </Link>
      </Prose>
    </PublicPage>
  );
}
