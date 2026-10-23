import type { Metadata } from "next";
import Link from "next/link";
import { CLASSES } from "@trainyard/core";
import { Prose, PublicPage } from "@/components/public-page";

export const metadata: Metadata = {
  title: "Class boards for SAFe trainers: Leading SAFe, SPC, Advanced SPC, POPM and RTE",
  description: "Ready-to-run class boards for Leading SAFe, SAFe Practice Consultant, Advanced SPC, Product Owner/Product Manager and Release Train Engineer classes: a start-here strip, one frame per lesson with its exercises, a PI planning simulation, and your own Miro class boards imported.",
  alternates: { canonical: "/classes" },
};

export default function ClassesPage() {
  return (
    <PublicPage crumbs={[{ href: "/classes", label: "Classes" }]}>
      <h1>Class boards, built the way trainers run them.</h1>
      <p className="lede">Each class is a board: a start-here strip (intro, quick agenda, working agreements, team and challenge, parking lot, daily structure), then one frame per lesson holding that lesson&apos;s exercises. Open one per cohort, hand out the link, and participants work in the room. Trainer plan; your own Miro class boards import from Miro&apos;s CSV export.</p>
      <Prose>
        <div className="ly-cards">
          {CLASSES.map((c) => (
            <Link key={c.id} href={`/classes/${c.id}`} className="ly-card">
              <span className="tag">
                {c.short} · {c.days} days
              </span>
              <h3>{c.name}</h3>
              <p>{c.blurb}</p>
            </Link>
          ))}
        </div>
        <p className="legal" style={{ fontSize: 14, opacity: 0.7 }}>
          SAFe® and the course names are trademarks of Scaled Agile, Inc.; they identify the class a trainer runs. The exercises and boards are the trainer&apos;s and Trainyard&apos;s, not Scaled Agile courseware.
        </p>
      </Prose>
    </PublicPage>
  );
}
