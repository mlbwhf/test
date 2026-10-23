import type { Metadata } from "next";
import Link from "next/link";
import { OkrExplorer } from "@/components/okr-explorer";
import { PublicPage } from "@/components/public-page";

export const metadata: Metadata = {
  title: "OKRs and KPIs in SAFe: an interactive example (Northstar Bank)",
  description: "An interactive SAFe example of OKRs and KPIs: one business objective with key results and KPIs, operational and development value streams, alignment from portfolio to ARTs and teams, a key result carried by a KPI, a KPI dashboard and the quarterly review.",
  alternates: { canonical: "/examples/okrs-kpis" },
};

export default function OkrsKpisExample() {
  return (
    <PublicPage crumbs={[{ href: "/examples/okrs-kpis", label: "OKRs and KPIs example" }]}>
      <p className="ex-kicker">Customer example · Northstar Bank · illustrative</p>
      <h1>From strategy to measurable outcomes.</h1>
      <p className="lede">OKRs set the desired change. KPIs monitor ongoing health. Outcomes prove value. Click through how a bank ties one objective to its value streams, trains and teams, and how it knows it worked.</p>
      <OkrExplorer />
      <section className="ex-cta">
        <h2>Run this in your own workspace.</h2>
        <p>Trainyard keeps the OKR tree, the value stream map, the PI objectives and the KPI dashboards in one place, in step with Jira and Azure DevOps.</p>
        <div className="ex-row">
          <Link href="/#join" className="pill hot">
            Sign up free →
          </Link>
          <Link href="/templates" className="pill">
            See the templates
          </Link>
        </div>
        <p className="ex-sub">
          References: framework.scaledagile.com — Value Streams; OKRs; Measure and Grow; Lean Portfolio Management. SAFe® is a registered trademark of Scaled Agile, Inc.
        </p>
      </section>
    </PublicPage>
  );
}
