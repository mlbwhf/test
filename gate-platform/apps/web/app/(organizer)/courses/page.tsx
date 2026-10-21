import { api } from "@/lib/api";
import { ApiNotice } from "@/components/ui";
import { CourseList, type CourseRow } from "@/components/course-list";
import { courseLanguage } from "@/lib/course-utils";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const [coursesRes, eventsRes, meRes] = await Promise.all([api.listCourses(), api.listEvents(), api.me()]);
  const now = Date.now();
  const upcoming = new Map<string, number>();
  for (const e of eventsRes.ok ? eventsRes.data.items : []) {
    if (!e.courseId || e.status === "cancelled" || new Date(e.endsAt ?? e.startsAt).getTime() < now) continue;
    upcoming.set(e.courseId, (upcoming.get(e.courseId) ?? 0) + 1);
  }
  const rows: CourseRow[] = coursesRes.ok
    ? coursesRes.data.items
        .map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          certificationBody: c.certificationBody,
          durationDays: c.durationDays,
          language: courseLanguage(c),
          upcoming: upcoming.get(c.id) ?? 0,
          badge: c.badge ? { name: c.badge.name, imageUrl: c.badge.imageUrl ?? null } : null,
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];
  return (
    <div className="admin-page">
      <div className="admin-head">
        <h1>Courses</h1>
        <p>A course is a reusable curriculum; each run of it is a cohort (an event).</p>
      </div>
      {!coursesRes.ok ? <ApiNotice failure={coursesRes.error} /> : <CourseList courses={rows} canWrite={meRes.ok && meRes.data.permissions.includes("classes:write")} />}
    </div>
  );
}
