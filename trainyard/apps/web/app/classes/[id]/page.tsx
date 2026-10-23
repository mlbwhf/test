import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prose, PublicPage } from "@/components/public-page";
import { classById, classSlugs, exerciseKindLabel } from "@/lib/public";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
  return classSlugs().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = classById((await params).id);
  if (!c) return {};
  return {
    title: `${c.name} class board: ${c.lessons.length} lessons, ${c.lessons.reduce((n, l) => n + l.exercises.length, 0)} exercises, ${c.days} days`,
    description: c.blurb,
    alternates: { canonical: `/classes/${c.id}` },
  };
}

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const c = classById((await params).id);
  if (!c) notFound();
  const base = siteUrl();
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Course",
      name: `${c.name} class board`,
      description: c.blurb,
      provider: { "@type": "Organization", name: "Trainyard", url: base },
      hasCourseInstance: { "@type": "CourseInstance", courseMode: "blended", courseWorkload: `P${c.days}D` },
      syllabusSections: c.lessons.map((l, i) => ({ "@type": "Syllabus", position: i + 1, name: l.title, description: l.exercises.map((e) => e.title).join("; ") })),
    },
  ];
  return (
    <PublicPage crumbs={[{ href: "/classes", label: "Classes" }, { href: `/classes/${c.id}`, label: c.short }]} jsonLd={jsonLd}>
      <h1>{c.name}: the class board</h1>
      <p className="lede">{c.blurb}</p>
      <Prose>
        <p>
          {c.days} days, {c.lessons.length} lessons, {c.lessons.reduce((n, l) => n + l.exercises.length, 0)} exercises. Every class opens with the start-here strip: Trainyard intro, quick agenda, remote working agreements, team and challenge, parking lot, daily structure.
        </p>
        {c.lessons.map((l, i) => (
          <div key={l.title} className="ly-lesson">
            <h3>
              Lesson {i + 1}: {l.title}
            </h3>
            <ul>
              {l.exercises.map((e) => (
                <li key={e.title}>
                  {e.title}
                  <span className="kind">{exerciseKindLabel[e.kind]}</span>
                  {e.kind === "pi-planning" ? ` · ${e.teams.length} teams` : ""}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <h2>Running it</h2>
        <ul>
          <li>Templates → Classes → {c.name} → create one board per cohort. Participants open the link; no install.</li>
          <li>The PI planning simulation uses the real planning room: ART board, team boards, story backlog with points, ROAM and the confidence vote.</li>
          <li>Readiness checklist, feature canvases and WSJF exercises point at the live canvases, so what the class practises is what a train uses.</li>
          <li>Have your own version in Miro? Export the board as CSV and import it under Bring your own boards; frames become lessons.</li>
        </ul>
        <Link href="/#join" className="ly-cta">
          Start the Trainer trial →
        </Link>
        <p className="legal" style={{ fontSize: 14, opacity: 0.7 }}>
          SAFe® and the course name are trademarks of Scaled Agile, Inc.; the name identifies the class a trainer runs. Exercises are the trainer&apos;s and Trainyard&apos;s. <Link href="/classes">All classes</Link>.
        </p>
      </Prose>
    </PublicPage>
  );
}
