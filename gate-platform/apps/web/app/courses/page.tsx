import Link from "next/link";
import { api } from "@/lib/api";
import { ActionForm } from "@/components/action-form";
import { ApiNotice, Empty, Section } from "@/components/ui";
import { createCourseAction } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const coursesRes = await api.listCourses();

  return (
    <>
      <div className="page-header">
        <h1>Courses</h1>
        <span className="muted">A course is a reusable curriculum; each run of it is a cohort (an event).</span>
      </div>

      {!coursesRes.ok && <ApiNotice failure={coursesRes.error} />}

      <Section title="All courses">
        {!coursesRes.ok ? (
          <Empty>Courses unavailable.</Empty>
        ) : coursesRes.data.items.length === 0 ? (
          <Empty>No courses yet. Create one below.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Certification body</th>
                  <th className="num">Duration</th>
                </tr>
              </thead>
              <tbody>
                {coursesRes.data.items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/courses/${encodeURIComponent(c.id)}`}>{c.name}</Link>
                    </td>
                    <td className="mono">{c.slug}</td>
                    <td>{c.certificationBody ?? <span className="muted">—</span>}</td>
                    <td className="num">
                      {c.durationDays === null ? (
                        <span className="muted">—</span>
                      ) : (
                        `${c.durationDays} day${c.durationDays === 1 ? "" : "s"}`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Create course">
        <ActionForm action={createCourseAction} submitLabel="Create course" pendingLabel="Creating…">
          <div className="fields">
            <label>
              Slug
              <input name="slug" required pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*" placeholder="safe-for-teams" />
            </label>
            <label>
              Name
              <input name="name" required placeholder="SAFe for Teams" />
            </label>
            <label>
              Certification body
              <input name="certificationBody" placeholder="Scaled Agile, Inc." />
            </label>
            <label>
              Duration (days)
              <input name="durationDays" type="number" min={1} step={1} placeholder="2" />
            </label>
          </div>
        </ActionForm>
      </Section>
    </>
  );
}
