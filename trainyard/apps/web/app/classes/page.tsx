import type { Metadata } from "next";
import Link from "next/link";
import { CLASSES } from "@trainyard/core";
import { ModulePage, PriceStrip } from "@/components/module-page";
import { PLANS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Class boards for SAFe trainers: Leading SAFe, SPC, Advanced SPC, POPM and RTE",
  description: "Ready-to-run class boards for Leading SAFe, SAFe Practice Consultant, Advanced SPC, Product Owner/Product Manager and Release Train Engineer classes: a start-here strip, one frame per lesson with its exercises, a PI planning simulation, breakout tables, a day plan, and your own Miro class boards imported.",
  alternates: { canonical: "/classes" },
};

const COLORS = ["#ffe27a", "#ff9fc6", "#5ff0e0", "#b9c6ff", "#ffe27a"];

const STEPS: [string, string][] = [
  ["Start here", "A strip with the intro, quick agenda, working agreements, team and challenge, parking lot and daily structure."],
  ["One frame per lesson", "Each lesson holds its exercises. The chapters that teach a Trainyard tool are built from the tool itself, so they change when it does."],
  ["Simulate", "Run the PI planning simulation with breakout tables of four, timeboxes and the confidence vote."],
  ["Bring your own", "Import your Miro class boards from the CSV export, and keep them as templates for the next cohort."],
];

export default function ClassesPage() {
  const trainer = PLANS.find((p) => p.id === "trainer")!;
  return (
    <ModulePage crumb={{ href: "/classes", label: "Classes" }} jsonLd={[{ "@context": "https://schema.org", "@type": "ItemList", name: "Trainyard class boards", itemListElement: CLASSES.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: `/classes/${c.id}` })) }]}>
      <header className="mp-hero">
        <div className="eyebrow">CLASSES · FOR TRAINERS</div>
        <h1>
          Class boards, built the way <span className="hl" style={{ background: "#ffe27a" }}>trainers</span> run them.
        </h1>
        <p className="lede">Each class is a board: a start-here strip, one frame per lesson holding its exercises, and a PI planning simulation. Open one per cohort, hand out the link, and participants work in the room.</p>
        <div className="ctas">
          <Link href="/#join" className="pill navy">
            Start the 30-day trial
          </Link>
          <a href="#classes" className="pill">
            See the five classes
          </a>
        </div>
      </header>
      <section id="classes" style={{ paddingTop: 70 }}>
        <div className="mp-grid">
          {CLASSES.map((c, i) => (
            <Link key={c.id} id={c.id} href={`/classes/${c.id}`} className="mp-card" style={{ background: COLORS[i % COLORS.length] }}>
              <div className="top">
                <span>{c.short}</span>
                <span>
                  {c.days} days · {c.lessons.length} lessons
                </span>
              </div>
              <h2>{c.name}</h2>
              <p>{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <div className="eyebrow">HOW A CLASS BOARD WORKS</div>
        <div className="mp-steps" style={{ marginTop: 20 }}>
          {STEPS.map(([h, p], i) => (
            <div key={h} className="mp-step">
              <div className="n">{i + 1}</div>
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </section>
      <PriceStrip tag="TRAINER · CLASSES" amount={`$${trainer.monthly}`} unit="/ trainer / month" bg="#b9c6ff" text={<>Every class board, unlimited participants in the room, Miro imports, Jira and Azure DevOps sync. 30-day free trial; yearly is ${trainer.yearly} a month.</>} />
      <section style={{ paddingTop: 30 }}>
        <p className="mp-fine">SAFe® and the course names are trademarks of Scaled Agile, Inc.; they identify the class a trainer runs. The exercises and boards are the trainer&apos;s and Trainyard&apos;s, not Scaled Agile courseware.</p>
      </section>
    </ModulePage>
  );
}
