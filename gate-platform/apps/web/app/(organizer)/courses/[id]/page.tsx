import Link from "next/link";
import { api, BADGE_PLATFORMS, EVENT_FORMATS, type Party } from "@/lib/api";
import { formatDateTimeInZone, formatTimeInZone, humanize } from "@/lib/format";
import { DEFAULT_TIMEZONE, MAX_SESSIONS } from "@/lib/forms";
import { ActionForm } from "@/components/action-form";
import { ApiNotice, Empty, Section, StatusBadge } from "@/components/ui";
import { awardBadgeAction, createCohortAction, migrateBadgeAction, updateCourseBadgeAction, updateCourseDeliveryAction, updateCourseImageAction } from "@/app/actions";
import { BadgeDesigner } from "@/components/badge-designer";
import { Disclosure } from "@/components/disclosure";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [courseRes, cohortsRes, partiesRes, orgRes] = await Promise.all([
    api.getCourse(id),
    api.listCohorts(id),
    api.listParties(),
    api.getOrganization(),
  ]);

  if (!courseRes.ok) {
    return (
      <>
        <div className="page-header">
          <h1>Course</h1>
          <Link href="/courses">← All courses</Link>
        </div>
        <ApiNotice failure={courseRes.error} />
      </>
    );
  }

  const course = courseRes.data;
  const cohorts = cohortsRes.ok ? cohortsRes.data.items : [];
  const instructors: Party[] = partiesRes.ok ? partiesRes.data.items.filter((p) => p.kind === "instructor") : [];
  const defaultCurrency = orgRes.ok ? orgRes.data.currency : "USD";

  return (
    <>
      <div className="page-header">
        <h1>{course.name}</h1>
        <span className="muted">
          <code>{course.slug}</code>
          {course.certificationBody ? ` · ${course.certificationBody}` : ""}
          {course.durationDays !== null ? ` · ${course.durationDays} day${course.durationDays === 1 ? "" : "s"}` : ""}
          {" · "}
          <code>{course.id}</code>
        </span>
        <Link href="/courses">← All courses</Link>
      </div>
      {course.description && <p className="muted">{course.description}</p>}

      <Section title="Cover image">
        <div className="cover-row">
          {course.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="cover-preview" src={course.imageUrl} alt={`Cover image for ${course.name}`} />
          ) : (
            <div className="cover-preview cover-empty">
              <span>No cover image</span>
              <span className="hint">2:1, e.g. 2160×1080</span>
            </div>
          )}
          <div className="cover-forms">
            <ActionForm action={updateCourseImageAction} submitLabel={course.imageUrl ? "Replace image" : "Save image"} pendingLabel="Uploading…">
              <input type="hidden" name="courseId" value={course.id} />
              <label>
                Upload an image (JPEG, PNG, WebP or GIF, up to 5 MB)
                <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
              </label>
              <label>
                …or copy it from a URL
                <input name="imageUrl" type="url" placeholder="https://…/banner.jpg" />
              </label>
              <p className="hint">Shown at the top of the public course page and the registration widget, and in search results through the course&apos;s structured data. Imports from Eventbrite fill this automatically.</p>
            </ActionForm>
            {course.imageUrl && (
              <ActionForm action={updateCourseImageAction} submitLabel="Remove image" pendingLabel="Removing…" variant="danger" inline>
                <input type="hidden" name="courseId" value={course.id} />
                <input type="hidden" name="mode" value="remove" />
              </ActionForm>
            )}
          </div>
        </div>
      </Section>

      <Section title="Digital badge" id="badge">
        <p className="hint">
          Learners who finish this course earn a badge. With an <strong>EnrollClass verified badge</strong> (Open Badges 3.0) every certificate comes with a signed badge learners can download, share and have verified anywhere, with no Credly or other subscription: $1 per paid seat, free on free classes. You can also link a badge on Credly, Accredible, Badgr or another platform.
        </p>
        {course.badge && (
          <div className="badge-preview">
            {course.badge.imageUrl && <img src={course.badge.imageUrl} alt="" width={72} height={72} />}
            <div>
              <strong>{course.badge.name}</strong>
              <span className="muted">{BADGE_PLATFORMS[course.badge.platform]}</span>
              {course.badge.url ? (
                <a href={course.badge.url} target="_blank" rel="noreferrer noopener">
                  {course.badge.url}
                </a>
              ) : (
                <span className="muted">Issued with EnrollClass certificates</span>
              )}
            </div>
          </div>
        )}
        {course.badge && course.badge.platform !== "own" && (
          <div className="badge-move">
            <p>
              <strong>Move this badge to EnrollClass.</strong> We copy its name and image, so you can stop paying for {BADGE_PLATFORMS[course.badge.platform]}; past certificates can get it too.
            </p>
            <ActionForm action={migrateBadgeAction} submitLabel="Move to EnrollClass" pendingLabel="Moving…" inline>
              <input type="hidden" name="courseId" value={course.id} />
            </ActionForm>
          </div>
        )}
        {course.badge?.platform === "own" && (
          <div className="badge-move">
            <p>
              <strong>Award it to past learners.</strong> Everyone who already has a certificate for this course gets the verified badge.
            </p>
            <ActionForm action={awardBadgeAction} submitLabel="Award badge" pendingLabel="Awarding…" inline>
              <input type="hidden" name="courseId" value={course.id} />
              <label className="label-check">
                <input type="checkbox" name="notify" defaultChecked /> Email them
              </label>
            </ActionForm>
          </div>
        )}
        <Disclosure className="designer-wrap" defaultOpen={!course.badge} summary="Design a badge">
          <BadgeDesigner courseId={course.id} courseName={course.name} action={updateCourseBadgeAction} />
        </Disclosure>
        <Disclosure className="designer-wrap" summary={course.badge ? "Edit the badge by hand" : "Upload a badge or link one from Credly, Accredible…"}>
        <ActionForm action={updateCourseBadgeAction} submitLabel={course.badge ? "Update badge" : "Add badge"} pendingLabel="Saving…" wide>
          <input type="hidden" name="courseId" value={course.id} />
          <div className="fields">
            <label>
              Platform
              <select name="platform" defaultValue={course.badge?.platform ?? "own"}>
                {(Object.keys(BADGE_PLATFORMS) as Array<keyof typeof BADGE_PLATFORMS>).map((p) => (
                  <option key={p} value={p}>
                    {BADGE_PLATFORMS[p]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Badge name
              <input name="name" defaultValue={course.badge?.name ?? ""} placeholder="e.g. Certified SAFe Agilist" required maxLength={200} />
            </label>
            <label>
              Badge page link (not needed for your own badge)
              <input name="url" type="url" defaultValue={course.badge?.url ?? ""} placeholder="https://www.credly.com/org/…/badge/…" />
            </label>
            <label>
              Upload badge image (PNG, JPEG, WebP or GIF, up to 5 MB)
              <input name="badgeImage" type="file" accept="image/png,image/jpeg,image/webp,image/gif" />
            </label>
            <label>
              Or badge image link
              <input name="imageUrl" type="url" defaultValue={course.badge?.imageUrl ?? ""} placeholder="https://images.credly.com/…png" />
            </label>
          </div>
        </ActionForm>
        </Disclosure>
        {course.badge && (
          <ActionForm action={updateCourseBadgeAction} submitLabel="Remove badge" pendingLabel="Removing…" variant="danger" inline>
            <input type="hidden" name="courseId" value={course.id} />
            <input type="hidden" name="remove" value="1" />
          </ActionForm>
        )}
      </Section>

      <Section title="Delivery settings">
        <dl className="kv">
          <dt>Pre-work</dt>
          <dd>
            {course.prework ? (
              <span style={{ whiteSpace: "pre-wrap" }}>{course.prework}</span>
            ) : (
              <span className="muted">Not set — the pre-work email (T-14) goes out without instructions.</span>
            )}
          </dd>
          <dt>Survey URL</dt>
          <dd>
            {course.surveyUrl ? (
              <a href={course.surveyUrl} target="_blank" rel="noreferrer">
                {course.surveyUrl}
              </a>
            ) : (
              <span className="muted">Not set — the post-course survey email is skipped.</span>
            )}
          </dd>
        </dl>
        <ActionForm action={updateCourseDeliveryAction} submitLabel="Save delivery settings" pendingLabel="Saving…" wide>
          <input type="hidden" name="courseId" value={course.id} />
          <label>
            Pre-work (sent to learners 14 days before the first session)
            <textarea
              name="prework"
              rows={5}
              defaultValue={course.prework ?? ""}
              placeholder="Read chapters 1–3 of the handbook and complete the online primer."
            />
          </label>
          <label>
            Survey URL (sent after the last session)
            <input name="surveyUrl" type="url" defaultValue={course.surveyUrl ?? ""} placeholder="https://forms.example.com/feedback" />
          </label>
          <p className="hint">Applies to every cohort of this course. Leave a field blank to clear it.</p>
        </ActionForm>
      </Section>

      <Section title="Cohorts">
        {!cohortsRes.ok ? (
          <ApiNotice failure={cohortsRes.error} />
        ) : cohorts.length === 0 ? (
          <Empty>No cohorts yet. Add one below.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Starts</th>
                  <th>Ends</th>
                  <th>Format</th>
                  <th className="num">Sessions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/events/${encodeURIComponent(c.id)}`}>{c.name}</Link>
                    </td>
                    <td>
                      {formatDateTimeInZone(c.startsAt, c.timezone)}
                      <br />
                      <span className="muted">{c.timezone}</span>
                    </td>
                    <td>{c.endsAt ? formatDateTimeInZone(c.endsAt, c.timezone) : <span className="muted">—</span>}</td>
                    <td>{humanize(c.format)}</td>
                    <td className="num">{c.sessions.length}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Add cohort">
        {!partiesRes.ok && <ApiNotice failure={partiesRes.error} />}
        <ActionForm action={createCohortAction} submitLabel="Add cohort" pendingLabel="Creating…" wide>
          <input type="hidden" name="courseId" value={course.id} />
          <div className="fields">
            <label>
              Name
              <input name="name" required placeholder={`${course.name} — Spring 2027`} />
            </label>
            <label>
              Time zone (IANA)
              <input name="timezone" required defaultValue={DEFAULT_TIMEZONE} placeholder="America/Toronto" />
            </label>
            <label>
              Format
              <select name="format" required defaultValue="live_virtual">
                {EVENT_FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {humanize(f)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Minimum enrollment
              <input name="minEnrollment" type="number" min={1} step={1} placeholder="6" />
            </label>
            <label>
              Currency
              <input
                name="currency"
                required
                maxLength={3}
                minLength={3}
                pattern="[A-Za-z]{3}"
                defaultValue={defaultCurrency}
                style={{ textTransform: "uppercase" }}
              />
            </label>
            <label>
              Instructors
              {instructors.length === 0 ? (
                <span className="hint">
                  No instructors yet. <Link href="/instructors">Add one</Link>.
                </span>
              ) : (
                <select name="instructorIds" multiple size={Math.min(instructors.length, 5)}>
                  {instructors.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </label>
          </div>

          <p className="hint">
            Sessions are entered as local wall-clock times in the cohort&apos;s time zone. Fill in at least the first
            row; leave unused rows blank.
          </p>
          {Array.from({ length: MAX_SESSIONS }, (_, i) => (
            <fieldset key={i}>
              <legend>Session {i + 1}</legend>
              <div className="fields-row">
                <label>
                  Date
                  <input name={`session_${i}_date`} type="date" required={i === 0} />
                </label>
                <label>
                  Start time
                  <input name={`session_${i}_start`} type="time" required={i === 0} defaultValue={i === 0 ? "09:00" : ""} />
                </label>
                <label>
                  End time
                  <input name={`session_${i}_end`} type="time" required={i === 0} defaultValue={i === 0 ? "17:00" : ""} />
                </label>
                <label>
                  Title (optional)
                  <input name={`session_${i}_title`} placeholder={`Day ${i + 1}`} />
                </label>
              </div>
            </fieldset>
          ))}
        </ActionForm>
      </Section>

      {cohorts.length > 0 && (
        <Section title="Session schedule">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cohort</th>
                  <th>Session</th>
                  <th>Starts</th>
                  <th>Ends</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.flatMap((c) =>
                  c.sessions.map((s, i) => (
                    <tr key={`${c.id}-${i}`}>
                      <td>{i === 0 ? <Link href={`/events/${encodeURIComponent(c.id)}`}>{c.name}</Link> : ""}</td>
                      <td>{s.title ?? `Session ${i + 1}`}</td>
                      <td>{formatDateTimeInZone(s.startsAt, c.timezone)}</td>
                      <td>{formatTimeInZone(s.endsAt, c.timezone)}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </>
  );
}
