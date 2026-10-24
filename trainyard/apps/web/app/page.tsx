import type { Metadata } from "next";
import { Landing } from "@/components/landing";
import { FAQ, PLANS } from "@/lib/pricing";
import { inlineJson, siteUrl } from "@/lib/site";
import "./site.css";

export const metadata: Metadata = {
  title: "Trainyard: the classroom for anyone who trains. PI planning, SAFe canvases and value streams, open source",
  description:
    "Open-source planning rooms for coaches, trainers and Agile Release Trains: PI planning board with milestones and dependency strings, ROAM, SAFe canvases and value stream maps measured from Jira or Azure DevOps. Self-host it free, or pay per trainer or per train, never per person in the room.",
  alternates: { canonical: "/" },
};

export default function Home() {
  const base = siteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Trainyard",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: base,
      description: "Open-source planning rooms for scaled agile: PI planning boards, SAFe canvases, value stream mapping, two-way Jira and Azure DevOps sync, an AI-native portfolio module, and import of boards from Miro, Lucid, Mural, Trello, monday.com and iObeya.",
      offers: PLANS.map((p) => ({
        "@type": "Offer",
        name: `${p.name} plan`,
        price: p.yearly ?? 0,
        priceCurrency: "USD",
        ...(p.yearly ? { priceSpecification: { "@type": "UnitPriceSpecification", price: p.yearly, priceCurrency: "USD", unitText: p.id === "academy" ? "per train per month, billed yearly" : "per trainer per month, billed yearly" } } : {}),
      })),
      license: "https://www.apache.org/licenses/LICENSE-2.0",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: inlineJson(jsonLd) }} />
      <Landing />
    </>
  );
}
