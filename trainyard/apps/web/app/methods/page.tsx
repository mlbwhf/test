import type { Metadata } from "next";
import Link from "next/link";
import { TEMPLATE_CATALOG, TEMPLATE_METHODS } from "@trainyard/core";
import { ModulePage, PriceStrip } from "@/components/module-page";
import { PLANS } from "@/lib/pricing";
import { THEMES, methodTheme } from "@/lib/themes";

export const metadata: Metadata = {
  title: "Board templates for SAFe, Scrum, Kanban, Lean, Six Sigma and manufacturing",
  description: "Ready-made boards in each method's own words: PI planning and ROAM for SAFe, sprint boards and retrospectives for Scrum, WIP-limited Kanban, A3 and obeya for Lean, DMAIC and fishbone for Six Sigma, SQDC and andon for the shop floor. Pick a method and the board changes shape.",
  alternates: { canonical: "/methods" },
};

/** What the board enforces or shows in each method, in its own terms. */
const RULE: Record<string, string> = {
  safe: "Iteration capacity bars turn pink when a team is overloaded.",
  scrum: "The Sprint Backlog warns when it passes the team's velocity.",
  kanban: "A full column refuses new cards: WIP limits are enforced, not suggested.",
  lean: "Left to right, one problem, one sheet.",
  "six-sigma": "Work moves forward as evidence arrives, phase by phase.",
  manufacturing: "Stations with hard limits; stop the line when quality slips.",
  general: "Plain boards for any team. No jargon required.",
};

export default function MethodsPage() {
  const academy = PLANS.find((p) => p.id === "academy")!;
  const methods = TEMPLATE_METHODS.filter((m) => TEMPLATE_CATALOG.some((t) => t.method === m.id && !t.tags.includes("class" as never)));
  return (
    <ModulePage crumb={{ href: "/methods", label: "Templates" }}>
      <header className="mp-hero">
        <div className="eyebrow">TEMPLATES · ANY METHOD</div>
        <h1>
          Pick the method. The room <span className="hl" style={{ background: "#5ff0e0" }}>changes shape.</span>
        </h1>
        <p className="lede">Start from a template and the whole board speaks that method. SAFe becomes a train, Kanban enforces WIP limits, the shop floor gets its andon. Cards drag between lanes in every one.</p>
        <div className="ctas">
          <Link href="/#join" className="pill navy">
            Start the 30-day trial
          </Link>
        </div>
      </header>
      <section style={{ paddingTop: 70 }}>
        <div className="mp-grid">
          {methods.map((m) => {
            const th = THEMES[methodTheme(m.id)];
            const tpls = TEMPLATE_CATALOG.filter((t) => t.method === m.id && !t.tags.includes("class" as never));
            return (
              <article key={m.id} id={m.id} className="mp-card" style={{ background: "#fff" }}>
                <div className="mp-thumb" style={{ background: th.bg }} aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="ln" style={{ background: th.laneBg, border: th.laneBd, borderRadius: th.laneR }}>
                      {th.tones.slice(1, 4 - i).map((c, j) => (
                        <span key={j} className="cd" style={{ background: c, border: th.cardBd, borderRadius: th.cardR }} />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="top">
                  <span>{th.name.toUpperCase()} THEME</span>
                  <span>
                    {tpls.length} board{tpls.length === 1 ? "" : "s"}
                  </span>
                </div>
                <h2>{m.label}</h2>
                <p>{m.blurb}</p>
                <div className="mp-tpls">
                  {tpls.slice(0, 8).map((t) => (
                    <span key={t.id}>{t.name}</span>
                  ))}
                  {tpls.length > 8 ? <span>+{tpls.length - 8} more</span> : null}
                </div>
                {RULE[m.id] ? (
                  <p style={{ fontSize: 15 }}>
                    <b>On the board:</b> {RULE[m.id]}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
      <section>
        <div className="eyebrow">THREE STEPS</div>
        <div className="mp-steps" style={{ marginTop: 20 }}>
          {(
            [
              ["Pick a method", "The template list, the board's look and its vocabulary follow the method you choose."],
              ["Size it to your teams", "Boards are created with your teams and iterations already in place."],
              ["Or bring your own", "Import from Miro, Lucid, Mural, Trello, monday.com or iObeya, save it as a template, or start a blank whiteboard and add any template to it."],
            ] as const
          ).map(([h, p], i) => (
            <div key={h} className="mp-step">
              <div className="n">{i + 1}</div>
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </section>
      <PriceStrip tag="ACADEMY · TEMPLATES" amount={`$${academy.monthly}`} unit="/ train / month" bg="#ffe27a" text={<>Every method, unlimited people per train, the Jira app and Azure DevOps extension, SSO and an audit trail. 30-day free trial; yearly is ${academy.yearly} a month. Practice includes the templates free for one hosted room.</>} />
    </ModulePage>
  );
}
