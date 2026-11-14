import Link from "next/link";
import { api, COURSE_CATEGORIES, type Party } from "@/lib/api";
import { ActionForm } from "@/components/action-form";
import { ApiNotice, Empty, Section } from "@/components/ui";
import { CompanyLogoCard } from "@/components/company-logo";
import { saveCoverAction, saveInstructorAction, saveProfileAction } from "./actions";

export const dynamic = "force-dynamic";

const ACCENTS = ["#2F45E8", "#0B7A5C", "#B4233C", "#11141B"];

/** What learners see about the organizer: brand, profile address and details, instructors. */
export default async function ProfileSettingsPage() {
  const [orgRes, partiesRes, coursesRes] = await Promise.all([api.getOrganization(), api.listParties(), api.listCourses()]);
  if (!orgRes.ok) {
    return (
      <>
        <div className="page-header">
          <h1>Organizer profile</h1>
        </div>
        <ApiNotice failure={orgRes.error} />
      </>
    );
  }
  const org = orgRes.data;
  const prof = org.profile ?? {};
  const instructors: Party[] = partiesRes.ok ? partiesRes.data.items.filter((p) => p.kind === "instructor") : [];
  const courses = coursesRes.ok ? coursesRes.data.items : [];
  const topics = COURSE_CATEGORIES.map((c) => ({ ...c, count: courses.filter((x) => x.topic === c.id).length })).filter((c) => c.count > 0);
  const handle = org.slug ?? org.id;
  const publicPath = `/o/${encodeURIComponent(handle)}`;

  return (
    <>
      <div className="page-header">
        <h1>Organizer profile</h1>
        <span className="muted">
          Public at <a href={publicPath} target="_blank" rel="noreferrer">enrollclass.com/o/{handle}</a>
        </span>
        <a className="btn" href={publicPath} target="_blank" rel="noreferrer">
          View public profile ↗
        </a>
      </div>

      <Section title="Brand">
        <div className="profile-brand">
          <CompanyLogoCard org={org} canEdit />
          <section className="card" aria-labelledby="cover-title">
            <h3 id="cover-title" style={{ marginTop: 0 }}>
              Cover image
            </h3>
            {prof.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="profile-cover" src={prof.coverUrl} alt="Profile cover" />
            ) : (
              <div className="profile-cover cover-empty">
                <span>No cover yet</span>
              </div>
            )}
            <p className="hint">1600 × 440 works best. Shown across the top of your profile.</p>
            <ActionForm action={saveCoverAction} submitLabel={prof.coverUrl ? "Replace cover" : "Upload cover"} pendingLabel="Uploading…" inline>
              <input name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-label="Cover image" />
            </ActionForm>
            {prof.coverUrl && (
              <ActionForm action={saveCoverAction} submitLabel="Remove cover" pendingLabel="Removing…" variant="danger" inline>
                <input type="hidden" name="mode" value="remove" />
              </ActionForm>
            )}
          </section>
        </div>
      </Section>

      <Section title="Profile details">
        <ActionForm action={saveProfileAction} submitLabel="Save profile" pendingLabel="Saving…" wide>
          <div className="profile-grid">
            <label>
              Organizer name
              <input name="name" defaultValue={org.name} required maxLength={200} />
            </label>
            <label>
              Profile address
              <span className="input-prefix">
                <span>enrollclass.com/o/</span>
                <input name="slug" defaultValue={org.slug ?? ""} placeholder="agile-agilist" pattern="[a-z0-9][a-z0-9-]{1,38}[a-z0-9]" maxLength={40} />
              </span>
              <span className="hint">3–40 lowercase letters, numbers and dashes.</span>
            </label>
            <label>
              Website
              <input name="website" defaultValue={prof.website ?? ""} placeholder="agile-agilist.com" maxLength={300} />
            </label>
            <label>
              Partner level or credential
              <input name="partnerLevel" defaultValue={prof.partnerLevel ?? ""} placeholder="SAFe® Platinum SPCT Partner" maxLength={120} />
            </label>
            <label className="span2">
              About
              <textarea name="about" rows={3} defaultValue={prof.about ?? ""} maxLength={1200} />
            </label>
            <label>
              Based in
              <input name="basedIn" defaultValue={prof.basedIn ?? ""} placeholder="Toronto, ON" maxLength={120} />
            </label>
            <label>
              Teaches in
              <input name="teachesIn" defaultValue={prof.teachesIn ?? ""} placeholder="Online, Toronto, Montreal" maxLength={300} />
            </label>
            <label>
              Brand colour
              <input type="color" name="accentColor" defaultValue={org.accentColor ?? "#2F45E8"} list="accent-presets" />
              <datalist id="accent-presets">
                {ACCENTS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <span className="hint">Buttons and highlights on your class pages, checkout and profile.</span>
            </label>
            <label className="check-row">
              <input type="checkbox" name="checkoutInvoices" defaultChecked={org.checkoutInvoices !== false} />
              <span>
                Learners can ask for an invoice at checkout
                <span className="hint" style={{ display: "block" }}>
                  Seats are held and the invoice goes to their company; unpaid seats go back on sale when it&apos;s due. Only for classes at least 5 days away.
                </span>
              </span>
            </label>
          </div>
        </ActionForm>
      </Section>

      <Section title="Topics on your profile">
        <p className="hint">Learners filter your classes by these topics. Each course has one; change it on the course page.</p>
        {topics.length === 0 ? (
          <Empty>No courses yet.</Empty>
        ) : (
          <div className="chip-row">
            {topics.map((t) => (
              <span key={t.id} className="chip">
                {t.label} · {t.count} {t.count === 1 ? "course" : "courses"}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title="Instructors">
        <p className="hint">Title, short bio and photo appear on class pages and your profile.</p>
        {instructors.length === 0 ? (
          <Empty>
            No instructors yet. <Link href="/instructors">Add one</Link>.
          </Empty>
        ) : (
          <div className="instructor-cards">
            {instructors.map((p) => (
              <section key={p.id} className="card">
                <div className="instructor-head">
                  {p.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrl} alt="" className="instructor-photo" />
                  ) : (
                    <span className="instructor-photo logo-empty" aria-hidden="true">
                      {p.name
                        .split(/\s+/)
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                  )}
                  <strong>{p.name}</strong>
                </div>
                <ActionForm action={saveInstructorAction} submitLabel="Save" pendingLabel="Saving…">
                  <input type="hidden" name="partyId" value={p.id} />
                  <label>
                    Name
                    <input name="name" defaultValue={p.name} maxLength={200} />
                  </label>
                  <label>
                    Title
                    <input name="title" defaultValue={p.title ?? ""} placeholder="AI-Native SPCT · Founder" maxLength={120} />
                  </label>
                  <label>
                    Short bio
                    <textarea name="bio" rows={3} defaultValue={p.bio ?? ""} maxLength={1200} />
                  </label>
                  <label>
                    Photo
                    <input name="photo" type="file" accept="image/jpeg,image/png,image/webp,image/gif" />
                  </label>
                </ActionForm>
              </section>
            ))}
          </div>
        )}
      </Section>

      <Section title="Team access">
        <p className="hint">
          Owners, admins, finance and instructors are managed on the <Link href="/team">Team</Link> page.
        </p>
      </Section>
    </>
  );
}
