import type { Metadata } from "next";
import Link from "next/link";
import { ModulePage, PriceStrip } from "@/components/module-page";
import { PLANS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "OKR and KPI dashboard for executives and boards: outcomes, funding and one-pagers",
  description: "OKRs, KPIs and initiative funding from every system that holds the evidence (CRM, finance, learning platform, surveys, vendors, Jira), with weekly check-ins by drag, alignment, and printable one-pagers per entity for the executive team and the board.",
  alternates: { canonical: "/insights" },
};

const CARDS: [string, string, string, string, string][] = [
  ["alignment", "ALIGNMENT", "Objectives and key results", "Every objective shows its key results with progress from baseline to target. Drag a key result to another objective to realign it.", "#ffe27a"],
  ["checkin", "CHECK-IN", "Weekly status, by drag", "The same key results grouped as on track, at risk or off track. The data proposes; move them to what is true today and the dashboard follows.", "#5ff0e0"],
  ["onepager", "ONE-PAGER", "Ready for the board", "A printable one-pager per entity: outcomes, KPIs, initiatives with funders, spend and what it bought.", "#b9c6ff"],
  ["sources", "SOURCES", "The evidence, in one place", "CRM, finance, learning platform, surveys, vendors and Jira. CSV today; scheduled connectors on request.", "#fff"],
];

export default function InsightsPage() {
  const insights = PLANS.find((p) => p.id === "insights")!;
  return (
    <ModulePage crumb={{ href: "/insights", label: "OKRs" }}>
      <header className="mp-hero">
        <div className="mp-split">
          <div>
            <div className="eyebrow">OKRs · FOR EXECUTIVES AND BOARDS</div>
            <h1>
              Show what the <span className="hl" style={{ background: "#ff9fc6" }}>money</span> bought.
            </h1>
            <p className="lede">OKRs, KPIs and funding from every system that holds the evidence, rolled into one-pagers for executives and the board. No planning rooms needed.</p>
            <div className="ctas">
              <Link href="/#join" className="pill navy">
                Start the 30-day trial
              </Link>
              <Link href="/examples/okrs-kpis" className="pill">
                See a live example
              </Link>
            </div>
          </div>
          <div id="dashboard" className="md-exec" style={{ justifySelf: "center" }} aria-label="OKR dashboard example">
            <div className="hd">
              <b>Q4 dashboard</b>
              <span>38 DAYS LEFT</span>
            </div>
            <div className="top">
              <div className="ring">
                <svg width="98" height="98" viewBox="0 0 120 120" aria-hidden="true">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#0f234222" strokeWidth="11" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#0f2342" strokeWidth="11" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50 * 0.87} ${2 * Math.PI * 50}`} transform="rotate(-90 60 60)" />
                </svg>
                <b>87%</b>
              </div>
              <div className="cnt">
                <div>
                  <b style={{ color: "#2f8f5b" }}>6</b>on track
                </div>
                <div>
                  <b style={{ color: "#b87a00" }}>2</b>at risk
                </div>
                <div>
                  <b style={{ color: "#b42318" }}>1</b>off track
                </div>
              </div>
            </div>
            {(
              [
                ["Grow reach in low-income countries", 87],
                ["Raise learning impact", 100],
                ["Run the programme efficiently", 75],
              ] as const
            ).map(([t, v]) => (
              <div key={t} className="obj">
                <div className="row">
                  <span>{t}</span>
                  <span>{v}%</span>
                </div>
                <div className="bar">
                  <span style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>
      <section style={{ paddingTop: 80 }}>
        <div className="mp-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))" }}>
          {CARDS.map(([id, tag, h, p, bg]) => (
            <article key={id} id={id} className="mp-card" style={{ background: bg }}>
              <div className="top">
                <span>{tag}</span>
              </div>
              <h2>{h}</h2>
              <p>{p}</p>
            </article>
          ))}
        </div>
      </section>
      <PriceStrip tag="INSIGHTS · OKRs" amount={`$${insights.monthly}`} unit="/ 10 sources / month" bg="#ff9fc6" text={<>Ten data sources per pack: CRM, finance, learning platform, surveys, vendors, Jira. Unlimited viewers, up to five editors. 30-day free trial; yearly is ${insights.yearly} a month.</>} />
    </ModulePage>
  );
}
