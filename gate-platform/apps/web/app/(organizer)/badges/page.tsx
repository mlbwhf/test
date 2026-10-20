import Link from "next/link";
import { api, BADGE_PLATFORMS } from "@/lib/api";
import { getMe } from "@/lib/console-data";
import { ActionForm } from "@/components/action-form";
import { ApiNotice } from "@/components/ui";
import { HelpLink } from "@/components/help-link";
import { migrateBadgeAction } from "@/app/actions";

export const dynamic = "force-dynamic";

/** Every course's badge in one place: what's verified by EnrollClass, what still lives elsewhere. */
export default async function BadgesPage() {
  const [res, me] = await Promise.all([api.listBadges(), getMe()]);
  const canMove = me.ok && me.data.permissions.includes("settings");
  const items = res.ok ? res.data.items : [];
  const elsewhere = items.filter((b) => b.course.badge && b.course.badge.platform !== "own");
  const verified = items.filter((b) => b.verified);
  const issued = verified.reduce((a, b) => a + b.issued, 0);
  const awaiting = verified.reduce((a, b) => a + b.awaiting, 0);

  return (
    <div className="badges-page">
      <div className="page-header">
        <h1>
          Badges <HelpLink slug="badges" />
        </h1>
        <span className="today-date">Verified digital badges (Open Badges 3.0), issued with your certificates</span>
      </div>
      {!res.ok && <ApiNotice failure={res.error} />}

      <section className="badges-kpis" aria-label="Badges at a glance">
        <div>
          <strong>{verified.length}</strong>
          <span>courses with a verified badge</span>
        </div>
        <div>
          <strong>{issued}</strong>
          <span>badges issued</span>
        </div>
        <div>
          <strong>{awaiting}</strong>
          <span>past learners who could get one</span>
        </div>
        <div>
          <strong>{elsewhere.length}</strong>
          <span>badges still on other platforms</span>
        </div>
      </section>

      {elsewhere.length > 0 && (
        <section className="card badge-move" aria-labelledby="move-title">
          <div>
            <h2 id="move-title">Move your badges to EnrollClass</h2>
            <p className="hint">
              {elsewhere.length} course{elsewhere.length === 1 ? "" : "s"} still use{elsewhere.length === 1 ? "s" : ""} {[...new Set(elsewhere.map((b) => BADGE_PLATFORMS[b.course.badge!.platform]))].join(", ")}. Moving copies each badge&apos;s name and image; learners then get a signed, verifiable badge with every certificate, and you can stop paying for the other platform. Badges already issued there stay valid there.
            </p>
          </div>
          {canMove && (
            <ActionForm action={migrateBadgeAction} submitLabel={`Move ${elsewhere.length === 1 ? "it" : `all ${elsewhere.length}`}`} pendingLabel="Moving…" inline>
              <span />
            </ActionForm>
          )}
        </section>
      )}

      <section className="card" aria-labelledby="all-title">
        <h2 id="all-title">Courses</h2>
        {items.length === 0 ? (
          <p className="muted">No courses yet.</p>
        ) : (
          <ul className="badge-list">
            {items.map(({ course, verified: v, issued: n, awaiting: w }) => (
              <li key={course.id}>
                {course.badge?.imageUrl ? <img src={course.badge.imageUrl} alt="" width={56} height={56} /> : <span className="badge-ph" aria-hidden="true" />}
                <div>
                  <Link href={`/courses/${encodeURIComponent(course.id)}#badge`}>{course.name}</Link>
                  <span className="muted">
                    {course.badge ? `${course.badge.name} · ${v ? "EnrollClass verified" : BADGE_PLATFORMS[course.badge.platform]}` : "No badge"}
                    {v ? ` · ${n} issued${w ? ` · ${w} past learner${w === 1 ? "" : "s"} without it` : ""}` : ""}
                  </span>
                </div>
                <Link className="pill-btn" href={`/courses/${encodeURIComponent(course.id)}#badge`}>
                  {course.badge ? (v ? (w ? "Award" : "Open") : "Move") : "Design one"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="hint">Verified badges cost $1 per paid seat on courses that issue them, collected with the seat fee. Free classes stay free. Anyone can check a badge at <a href="/verify">/verify</a>.</p>
    </div>
  );
}
