import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { appUrl } from "@/lib/seo";
import { CourseView, cityOf, loadCourse, range, type Cohort } from "../view";
import type { PublicCoursePage } from "@/lib/public-api";

export const dynamic = "force-dynamic";

type Params = Promise<{ org: string; slug: string; date: string }>;

/** A date's slug ("2026-11-20", "2026-11-20-2" for a second class that day) or its event id. */
function pick(data: PublicCoursePage, date: string): Cohort | undefined {
  return data.cohorts.find((c) => c.dateSlug === date) ?? data.cohorts.find((c) => c.event.id === date);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { date } = await params;
  const { data } = await loadCourse(params);
  const c = pick(data, date);
  if (!c) return { title: data.course.name };
  const when = range(c).toLowerCase().replace(/\b[a-z]{3}\b/g, (m) => m[0]!.toUpperCase() + m.slice(1));
  const where = c.event.format === "in_person" || c.event.format === "hybrid" ? cityOf(c.event.timezone) : "Live online";
  const title = `${data.course.name} · ${when} · ${where}`;
  const description = `${data.course.name} with ${data.organization.name}, ${when} (${where}). ${data.course.description ?? ""}`.trim();
  return {
    title,
    description,
    alternates: { canonical: `${appUrl()}/c/${encodeURIComponent(data.organization.id)}/${encodeURIComponent(data.course.slug)}/${c.dateSlug}` },
    openGraph: { title, description, ...(data.course.imageUrl ? { images: [data.course.imageUrl] } : {}) },
  };
}

/** One date's own page: shareable, indexed on its own, registration preselected. */
export default async function DatePage({ params }: { params: Params }) {
  const { date } = await params;
  const { org, slug, data } = await loadCourse(params);
  const c = pick(data, date);
  // Past, cancelled or unknown dates fall back to the course's current dates.
  if (!c) redirect(`/c/${encodeURIComponent(org)}/${encodeURIComponent(slug)}`);
  return <CourseView org={org} slug={slug} data={data} sel={c} single />;
}
