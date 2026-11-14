import { Logo } from "@/components/brand";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { publicApi, type PublicProfile } from "@/lib/public-api";
import { COURSE_CATEGORIES } from "@/lib/api";
import { appUrl, siteUrl } from "@/lib/seo";
import { RxFonts } from "@/components/class-page/shared";
import { ProfileClasses } from "@/components/class-page/profile-classes";
import "../../c/registration.css";

export const dynamic = "force-dynamic";

type Params = Promise<{ handle: string }>;

async function load(params: Params): Promise<PublicProfile> {
  const { handle } = await params;
  const res = await publicApi.getProfile(handle);
  if (!res.ok) {
    if (res.error.kind === "api" && res.error.status === 404) notFound();
    throw new Error("profile unavailable");
  }
  return res.data;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await load(params);
  const o = p.organization;
  const description = o.profile.about ?? `Upcoming classes from ${o.name}${o.profile.partnerLevel ? `, ${o.profile.partnerLevel}` : ""}.`;
  return {
    title: `${o.name} · classes and training`,
    description,
    alternates: { canonical: `${appUrl()}/o/${encodeURIComponent(o.slug ?? o.id)}` },
    openGraph: { title: o.name, description, ...(o.profile.coverUrl ? { images: [o.profile.coverUrl] } : o.logoUrl ? { images: [o.logoUrl] } : {}) },
  };
}

/** An organizer's public profile: who they are, their upcoming classes and instructors. */
export default async function ProfilePage({ params }: { params: Params }) {
  const p = await load(params);
  const o = p.organization;
  const prof = o.profile;
  const style = o.accentColor ? ({ "--rx-accent": o.accentColor, "--rx-on-accent": "#fff" } as React.CSSProperties) : undefined;
  const site = prof.website ? prof.website.replace(/^https?:\/\//, "").replace(/\/$/, "") : null;
  const initials = o.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const classes = p.classes.map((c) => ({ ...c, href: `/c/${encodeURIComponent(o.id)}/${encodeURIComponent(c.courseSlug)}/${c.dateSlug}` }));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: o.name,
    url: `${appUrl()}/o/${encodeURIComponent(o.slug ?? o.id)}`,
    ...(prof.about ? { description: prof.about } : {}),
    ...(o.logoUrl ? { logo: o.logoUrl } : {}),
    ...(prof.website ? { sameAs: [prof.website] } : {}),
  };

  return (
    <div className="rx" style={style}>
      <RxFonts />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="rx-bar">
        <div className="rx-wrap rx-bar-in">
          <Logo href={siteUrl()} size={11} />
          <span style={{ flex: 1 }} />
          <a href="/classes" style={{ fontWeight: 600, fontSize: 15, textDecoration: "none" }}>
            Find a class
          </a>
        </div>
      </header>
      <div className="rx-cover" role="img" aria-label={`${o.name} cover`} style={prof.coverUrl ? { backgroundImage: `url(${prof.coverUrl})` } : undefined} />
      <main className="rx-wrap">
        <section className="rx-card rx-prof-head" aria-labelledby="prof-title">
          {o.logoUrl ? <img className="rx-prof-logo" src={o.logoUrl} alt="" /> : <span className="rx-prof-logo ph" aria-hidden="true">{initials}</span>}
          <div className="rx-prof-id">
            <h1 id="prof-title">
              {o.name}{" "}
              {p.verified && (
                <span className="rx-verified" title="Identity and payouts verified through Stripe">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Verified organizer
                </span>
              )}
            </h1>
            {(prof.partnerLevel || prof.basedIn) && <div className="rx-muted">{[prof.partnerLevel, prof.basedIn].filter(Boolean).join(" · ")}</div>}
            <div className="rx-prof-stats">
              <span>
                <strong>{p.classes.length}</strong> upcoming {p.classes.length === 1 ? "class" : "classes"}
              </span>
              {p.stats.classesDelivered > 0 && (
                <span>
                  <strong>{p.stats.classesDelivered}</strong> delivered on EnrollClass
                </span>
              )}
              {p.stats.learnersTrained > 0 && (
                <span>
                  <strong>{p.stats.learnersTrained.toLocaleString("en-US")}</strong> learners trained
                </span>
              )}
            </div>
          </div>
          {prof.website && (
            <a className="rx-btn rx-btn-sm" href={prof.website} target="_blank" rel="noreferrer noopener">
              Visit website
            </a>
          )}
        </section>

        <div className="rx-prof-cols">
          <div className="rx-prof-main">
            <ProfileClasses classes={classes} topics={COURSE_CATEGORIES} />
          </div>
          <aside className="rx-prof-side">
            {(prof.about || prof.basedIn || prof.teachesIn || prof.partnerLevel || site) && (
              <section className="rx-card rx-side" aria-labelledby="about-title">
                <h2 id="about-title">About</h2>
                {prof.about && <p style={{ margin: 0, color: "var(--rx-body)" }}>{prof.about}</p>}
                <dl className="rx-dl">
                  {prof.basedIn && (
                    <>
                      <dt>Based in</dt>
                      <dd>{prof.basedIn}</dd>
                    </>
                  )}
                  {prof.teachesIn && (
                    <>
                      <dt>Teaches in</dt>
                      <dd>{prof.teachesIn}</dd>
                    </>
                  )}
                  {prof.partnerLevel && (
                    <>
                      <dt>Partner level</dt>
                      <dd>{prof.partnerLevel}</dd>
                    </>
                  )}
                  {site && (
                    <>
                      <dt>Website</dt>
                      <dd>
                        <a href={prof.website} target="_blank" rel="noreferrer noopener">
                          {site}
                        </a>
                      </dd>
                    </>
                  )}
                </dl>
              </section>
            )}
            {p.instructors.length > 0 && (
              <section className="rx-card rx-side" aria-labelledby="team-title">
                <h2 id="team-title">{p.instructors.length === 1 ? "Instructor" : "Instructors"}</h2>
                {p.instructors.map((i) => (
                  <div key={i.id} className="rx-person-row">
                    {i.photoUrl ? <img src={i.photoUrl} alt="" /> : <span className="ph" aria-hidden="true">{i.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}</span>}
                    <span>
                      <strong>{i.name}</strong>
                      {i.title && <span>{i.title}</span>}
                    </span>
                  </div>
                ))}
              </section>
            )}
            <section className="rx-invite">
              <b>Badges issued by {o.name}</b>
              <span style={{ fontSize: 14, color: "var(--rx-body)" }}>Every certificate and badge can be checked by anyone, any time.</span>
              <a className="rx-btn rx-btn-sm" href="/verify" style={{ alignSelf: "flex-start" }}>
                Verify a badge
              </a>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
