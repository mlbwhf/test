import type { Metadata } from "next";
import { appUrl } from "@/lib/seo";
import { CourseView, loadCourse } from "./view";

export const dynamic = "force-dynamic";

type Params = Promise<{ org: string; slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { data } = await loadCourse(params);
  const description = data.course.description ?? `${data.course.name} with ${data.organization.name}`;
  return {
    title: `${data.course.name} · ${data.organization.name}`,
    description,
    alternates: { canonical: `${appUrl()}/c/${encodeURIComponent(data.organization.id)}/${encodeURIComponent(data.course.slug)}` },
    openGraph: { title: data.course.name, description, ...(data.course.imageUrl ? { images: [data.course.imageUrl] } : {}) },
  };
}

/** Course hub: every upcoming date. `?d=<event id>` (older links) preselects one. */
export default async function CoursePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { org, slug, data } = await loadCourse(params);
  const sp = await searchParams;
  const want = Array.isArray(sp.d) ? sp.d[0] : sp.d;
  return <CourseView org={org} slug={slug} data={data} sel={data.cohorts.find((c) => c.event.id === want)} />;
}
