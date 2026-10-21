import Link from "next/link";
import { api, BADGE_PLATFORMS } from "@/lib/api";
import { getMe } from "@/lib/console-data";
import { ActionForm } from "@/components/action-form";
import { ApiNotice } from "@/components/ui";
import { HelpLink } from "@/components/help-link";
import { BadgeDesigner } from "@/components/badge-designer";
import { awardBadgeAction, migrateBadgeAction, updateCourseBadgeAction } from "@/app/actions";
import { initials } from "@/lib/course-utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ course?: string; missing?: string }>;

/** Every course's badge in one place, with the designer opening inline under the course. */
export default async function BadgesPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const [res, me] = await Promise.all([api.listBadges(), getMe()]);
  const canEdit = me.ok && me.data.permissions.includes("settings");
  const items = res.ok ? [...res.data.items].sort((a, b) => a.course.name.localeCompare(b.course.name)) : [];
  const elsewhere = items.filter((b) => b.course.badge && b.course.badge.platform !== "own");
  const verified = items.filter((b) => b.verified);
  const issued = verified.reduce((a, b) => a + b.issued, 0);
  const awaiting = verified.reduce((a, b) => a + b.awaiting, 0);
  const withBadge = items.filter((b) => b.course.badge).length;
  const missingOnly = sp.missing === "1";
  const shown = missingOnly ? items.filter((b) => !b.course.badge) : items;

  return (
    <div className="admin-page">
      <div className="admin-head">
        <h1>
          Badges <HelpLink slug="badges" />
        </h1>
        <p>Verified digital badges (Open Badges 3.0), issued with your certificates.</p>
      </div>
      {!res.ok && <ApiNotice failure={res.error} />}

      <section className="stat-strip stat-strip-big" aria-label="Badges at a glance">
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
        <section className="admin-callout" aria-labelledby="move-title">
          <div>
            <h2 id="move-title">Move your badges to EnrollClass</h2>
            <p className="hint">
              {elsewhere.length} course{elsewhere.length === 1 ? "" : "s"} still use{elsewhere.length === 1 ? "s" : ""} {[...new Set(elsewhere.map((b) => BADGE_PLATFORMS[b.course.badge!.platform]))].join(", ")}. Moving copies each badge&apos;s name and image; learners then get a signed, verifiable badge with every certificate. Badges already issued there stay valid there.
            </p>
          </div>
          {canEdit && (
            <ActionForm action={migrateBadgeAction} submitLabel={`Move ${elsewhere.length === 1 ? "it" : `all ${elsewhere.length}`}`} pendingLabel="Moving…" inline>
              <span />
            </ActionForm>
          )}
        </section>
      )}

      <div className="setup-row">
        <span>
          COURSES · {withBadge} OF {items.length} HAVE A BADGE
        </span>
        <Link className={`m-btn m-btn-sm${missingOnly ? " m-btn-ink" : ""}`} href={missingOnly ? "/badges" : "/badges?missing=1"} aria-pressed={missingOnly}>
          Missing only
        </Link>
      </div>

      {shown.length === 0 ? (
        <p className="admin-empty">{items.length ? "Every course has a badge." : "No courses yet."}</p>
      ) : (
        shown.map(({ course, verified: v, issued: n, awaiting: w }) => (
          <details key={course.id} className="admin-row badge-row" name="badge-row" open={sp.course === course.id} id={`badge-${course.id}`}>
            <summary>
              <span className={`admin-tile${course.badge?.imageUrl ? " admin-tile-img" : course.badge ? "" : " admin-tile-empty"}`} aria-hidden="true">
                {course.badge?.imageUrl ? <img src={course.badge.imageUrl} alt="" /> : initials(course.name)}
              </span>
              <span className="admin-row-name">
                <strong>{course.name}</strong>
                <span className="badge-status">
                  {course.badge ? `Badge: ${course.badge.name} · ${v ? "EnrollClass verified" : BADGE_PLATFORMS[course.badge.platform]}` : "No badge"}
                  {v ? ` · ${n} issued${w ? ` · ${w} past learner${w === 1 ? "" : "s"} without it` : ""}` : ""}
                </span>
              </span>
              {canEdit && (
                <span className="m-btn badge-toggle">
                  <span className="when-closed">{course.badge ? "Edit" : "Design one"}</span>
                  <span className="when-open">Close</span>
                </span>
              )}
            </summary>
            {canEdit && (
              <div className="admin-row-open">
                <BadgeDesigner courseId={course.id} courseName={course.name} action={updateCourseBadgeAction} />
                <div className="admin-actions">
                  {v && w > 0 && (
                    <ActionForm action={awardBadgeAction} submitLabel={`Award to ${w} past learner${w === 1 ? "" : "s"}`} pendingLabel="Awarding…" inline>
                      <input type="hidden" name="courseId" value={course.id} />
                      <label className="label-check">
                        <input type="checkbox" name="notify" defaultChecked /> Email them
                      </label>
                    </ActionForm>
                  )}
                  {course.badge && !v && (
                    <ActionForm action={migrateBadgeAction} submitLabel="Move to EnrollClass" pendingLabel="Moving…" inline>
                      <input type="hidden" name="courseId" value={course.id} />
                    </ActionForm>
                  )}
                  {course.badge && (
                    <ActionForm action={updateCourseBadgeAction} submitLabel="Remove badge" pendingLabel="Removing…" variant="danger" inline>
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="remove" value="1" />
                    </ActionForm>
                  )}
                  <Link className="m-btn" href={`/courses/${encodeURIComponent(course.id)}#badge`}>
                    Upload or link a badge →
                  </Link>
                </div>
              </div>
            )}
          </details>
        ))
      )}
      <p className="hint">
        Verified badges cost $1 per paid seat on courses that issue them, collected with the seat fee. Free classes stay free. Anyone can check a badge at <a href="/verify">/verify</a>.
      </p>
    </div>
  );
}
