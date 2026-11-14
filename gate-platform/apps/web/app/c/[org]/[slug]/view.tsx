import { Logo } from "@/components/brand";
import { siteUrl } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi, type PublicCoursePage, type PublicTicketType } from "@/lib/public-api";
import { formatMoney } from "@/lib/format";
import { publicApiUrl, siteOrigin } from "@/lib/urls";
import { RegisterSheet } from "@/components/register-sheet";
import { Agenda, ZoneProvider } from "@/components/class-page/times";
import { videoEmbed } from "@/components/class-page/shared";
import { BookingProvider, DatePicker, HeroFacts, MobileBar, RegisterLink, RegisterPanel, SelectedLabel, type ClassDate } from "@/components/class-page/booking";
import { dateRange } from "@/lib/class-time";
import { badgeCode } from "@/lib/finder";
import { COURSE_CATEGORIES } from "@/lib/api";
import "../../registration.css";
import "../../classpage.css";

export type Cohort = PublicCoursePage["cohorts"][number];

const BADGE_LABEL: Record<string, string> = { credly: "Credly", accredible: "Accredible", badgr: "Badgr", certopus: "Certopus" };
const FORMAT: Record<string, string> = { live_virtual: "LIVE VIRTUAL", in_person: "IN PERSON", hybrid: "HYBRID", self_paced: "SELF-PACED" };
const ATTENDANCE: Record<string, string> = {
  live_virtual: "https://schema.org/OnlineEventAttendanceMode",
  self_paced: "https://schema.org/OnlineEventAttendanceMode",
  in_person: "https://schema.org/OfflineEventAttendanceMode",
  hybrid: "https://schema.org/MixedEventAttendanceMode",
};

function fmt(iso: string, tz: string, o: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, ...o }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...o }).format(new Date(iso));
  }
}

/** "OCT 21–23, 2026" / "OCT 30 – NOV 2, 2026" in the cohort's own time zone. */
/** "fr" -> "Français": a language in its own words. */
function langLabel(code: string): string {
  try {
    const n = new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
    return n.charAt(0).toUpperCase() + n.slice(1);
  } catch {
    return code.toUpperCase();
  }
}

/** Paragraphs of a course description (blank-line separated; single line breaks stay inside). */
const paragraphs = (t: string) => t.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);

/** The intro under the title: the first paragraph, cut at a sentence end when it runs long. */
function leadOf(t: string): string {
  const first = paragraphs(t)[0] ?? "";
  if (first.length <= 260) return first;
  const cut = first.slice(0, 260);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > 80 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(" ")).trimEnd()}…`;
}

export function range(c: Cohort): string {
  const e = c.event;
  const end = e.endsAt ?? e.startsAt;
  const [m1, d1, y1] = [fmt(e.startsAt, e.timezone, { month: "short" }), fmt(e.startsAt, e.timezone, { day: "numeric" }), fmt(e.startsAt, e.timezone, { year: "numeric" })];
  const [m2, d2, y2] = [fmt(end, e.timezone, { month: "short" }), fmt(end, e.timezone, { day: "numeric" }), fmt(end, e.timezone, { year: "numeric" })];
  if (y1 !== y2) return `${m1} ${d1}, ${y1} – ${m2} ${d2}, ${y2}`.toUpperCase();
  if (m1 !== m2) return `${m1} ${d1} – ${m2} ${d2}, ${y2}`.toUpperCase();
  if (d1 !== d2) return `${m1} ${d1}–${d2}, ${y2}`.toUpperCase();
  return `${m1} ${d1}, ${y1}`.toUpperCase();
}

export const cityOf = (tz: string) => (tz.split("/").pop() ?? tz).replace(/_/g, " ");
export const seats = (c: Cohort) => ({ cap: c.ticketTypes.reduce((a, t) => a + t.quantity, 0), left: c.ticketTypes.reduce((a, t) => a + Math.max(0, t.remaining), 0) });

function cheapest(c: Cohort): { minor: number; currency: string; tt: PublicTicketType } | null {
  const cur = c.event.currency;
  const options = c.ticketTypes.filter((t) => t.prices[cur] !== undefined && t.remaining > 0);
  const pool = options.length ? options : c.ticketTypes.filter((t) => t.prices[cur] !== undefined);
  const best = pool.sort((a, b) => a.prices[cur]! - b.prices[cur]!)[0];
  return best ? { minor: best.prices[cur]!, currency: cur, tt: best } : null;
}

const whole = (minor: number, currency: string) => (minor === 0 ? "Free" : formatMoney(minor, currency).replace(/[.,]00(?=\D*$)/, ""));

/** schema.org EducationEvent for one date: what search engines and AI agents read. */
export function educationEvent(data: PublicCoursePage, c: Cohort, base: string) {
  const url = `${base}/${c.dateSlug}`;
  const price = cheapest(c);
  const { left } = seats(c);
  return {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    name: data.course.name,
    description: data.course.description ?? undefined,
    startDate: c.event.startsAt,
    endDate: c.event.endsAt ?? c.event.startsAt,
    eventAttendanceMode: ATTENDANCE[c.event.format],
    eventStatus: "https://schema.org/EventScheduled",
    location: c.event.format === "in_person" || c.event.format === "hybrid" ? { "@type": "Place", name: cityOf(c.event.timezone) } : { "@type": "VirtualLocation", url },
    image: data.course.imageUrl ?? undefined,
    organizer: { "@type": "Organization", name: data.organization.name },
    offers: price
      ? { "@type": "Offer", price: (price.minor / 100).toFixed(2), priceCurrency: price.currency, availability: left > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url }
      : undefined,
    url,
  };
}

export async function loadCourse(params: Promise<{ org: string; slug: string }>) {
  const { org, slug } = await params;
  const res = await publicApi.getCourse(org, slug);
  if (!res.ok) {
    if (res.error.kind === "api" && res.error.status === 404) notFound();
    throw new Error("course unavailable");
  }
  return { org, slug, data: res.data };
}

/** The class page body, shared by /c/:org/:course (pick a date) and /c/:org/:course/:date (one date). */
export async function CourseView({ org, slug, data, sel: chosen, single }: { org: string; slug: string; data: PublicCoursePage; sel?: Cohort | undefined; single?: boolean }) {
  const cohorts = [...data.cohorts].sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
  const nowIso = new Date().toISOString();
  // Classes already running are not offered (unless a link points at one).
  const upcoming = cohorts.filter((c) => c.event.startsAt > nowIso || c === chosen);
  const sel = chosen ?? upcoming.find((c) => seats(c).left > 0) ?? upcoming[0] ?? cohorts[0];
  const webBase = await siteOrigin();
  const basePath = `/c/${encodeURIComponent(org)}/${encodeURIComponent(slug)}`;
  const base = `${webBase}${basePath}`;
  // A date page describes only its own date; the course page lists every date.
  const jsonLd = (single && sel ? [sel] : cohorts).map((c) => educationEvent(data, c, base));
  const show = data.sections;
  const accent = data.organization.accentColor ?? undefined;
  const style = accent ? ({ "--cp-cta": accent, "--cp-on-cta": "#fff" } as React.CSSProperties) : undefined;
  const handle = data.organization.profileHandle ?? data.organization.id;
  const profileHref = `/o/${encodeURIComponent(handle)}`;
  const profileRes = await publicApi.getProfile(handle);
  const profile = profileRes.ok ? profileRes.data : null;
  const site = siteUrl();
  const course = data.course;
  const lede = course.page?.tagline ?? leadOf(course.description ?? "");
  const desc = course.description?.trim() ?? "";
  const body = desc && (desc !== lede || paragraphs(desc).length > 1) ? paragraphs(desc) : [];
  const badge = show.badge ? course.badge : null;
  const paymentMode = data.organization.paymentMode === "direct" ? "direct" : "protected";
  const category = COURSE_CATEGORIES.find((c) => c.id === course.category)?.label;
  const language = course.language ? langLabel(course.language) : null;
  const initials = data.organization.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const otherCourses = (() => {
    const m = new Map<string, NonNullable<typeof profile>["classes"]>();
    for (const c of profile?.classes ?? []) if (c.courseSlug !== slug) m.set(c.courseSlug, [...(m.get(c.courseSlug) ?? []), c]);
    return [...m.values()];
  })();
  const courseCount = new Set((profile?.classes ?? []).map((c) => c.courseSlug)).size;

  const dates: ClassDate[] = (sel && !upcoming.includes(sel) ? [sel, ...upcoming] : upcoming).map((c) => {
    const ses = c.event.sessions.length ? [...c.event.sessions].sort((a, b) => a.startsAt.localeCompare(b.startsAt)) : [{ startsAt: c.event.startsAt, endsAt: c.event.endsAt ?? c.event.startsAt }];
    const price = cheapest(c);
    const { cap, left } = seats(c);
    return {
      slug: c.dateSlug, eventId: c.event.id, startsAt: c.event.startsAt, endsAt: c.event.endsAt ?? ses[ses.length - 1]!.endsAt, timezone: c.event.timezone, format: c.event.format,
      days: ses.length, dayStartsAt: ses[0]!.startsAt, dayEndsAt: ses[0]!.endsAt,
      weekend: ses.some((x) => ["Sat", "Sun"].includes(fmt(x.startsAt, c.event.timezone, { weekday: "short" }))),
      cap, left, priceMinor: price?.minor ?? null, currency: price?.currency ?? c.event.currency, invoice: c.invoiceAvailable,
      instructors: c.instructors.map((i) => i.name), where: cityOf(c.event.timezone),
    };
  });

  const header = (
    <header className="cp-head">
      <div className="cp-wrap cp-head-in">
        <Logo href={site} size={11} />
        <nav aria-label="Main" className="cp-nav">
          <a href={`${site}/classes`}>Find a class</a>
          <a href={`${site}/badges`}>Badges</a>
          <a href={`${site}/instructors`}>For instructors</a>
          <a href="/help">Help</a>
        </nav>
        {sel && <SelectedLabel />}
        {sel && <RegisterLink className="cp-btn cp-btn-ink cp-btn-sm">Register</RegisterLink>}
      </div>
    </header>
  );

  const providerRow = (
    <a className="cp-provider" href={profileHref}>
      {show.logo && data.organization.logoUrl ? <img src={data.organization.logoUrl} alt="" /> : <span className="cp-initials" aria-hidden="true">{initials}</span>}
      <span>
        <span className="cp-provider-name">
          <strong>{data.organization.name}</strong>
          {profile?.verified && (
            <span className="cp-verified">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Verified provider
            </span>
          )}
        </span>
        <small>{[profile?.organization.profile.partnerLevel ?? (course.certificationBody ? `${course.certificationBody} certification` : null), courseCount > 1 ? `${courseCount} courses on EnrollClass` : null].filter(Boolean).join(" · ")}</small>
      </span>
    </a>
  );

  const badgeArt = (size: "md" | "lg") =>
    badge ? (
      <div className={`cp-ring cp-ring-${size}`} role="img" aria-label={`${badge.name} badge`}>
        {badge.imageUrl ? <img src={badge.imageUrl} alt="" /> : <strong>{badgeCode(/\([A-Z][A-Z0-9-]{1,5}\)/.test(course.name) ? course.name : badge.name)}</strong>}
      </div>
    ) : null;

  const video = show.video && course.page?.videoUrl ? videoEmbed(course.page.videoUrl) : null;
  const agenda = show.agenda ? (course.page?.agenda ?? []) : [];
  const included = show.included && course.page?.included?.length ? course.page.included : null;
  const selSessions = sel ? (sel.event.sessions.length ? sel.event.sessions : [{ startsAt: sel.event.startsAt, endsAt: sel.event.endsAt ?? sel.event.startsAt }]) : [];
  const lead = sel?.instructors[0];
  const days = dates[0]?.days ?? 1;
  const defaults = [
    sel && sel.event.format !== "self_paced" ? `${days} live instructor-led ${days === 1 ? "day" : "days"}` : null,
    course.badge ? (course.badge.platform === "own" ? "Certificate and verified digital badge" : `Digital badge: ${course.badge.name}`) : "Certificate of completion",
    `Ticket and calendar invites${days > 1 ? ` for all ${days} days` : ""} by email`,
  ].filter((x): x is string => Boolean(x));

  const page = (
    <main className="cp-wrap cp-main" data-entity="course" data-course={course.slug}>
      <section className="cp-hero" data-entity="event" data-event={sel?.event.id}>
        <div className="cp-hero-main">
          <div className="cp-mono cp-crumbs">
            <a href={`${site}/classes`}>FIND A CLASS</a>
            {category && (
              <>
                {" / "}
                <a href={`${site}/classes?category=${encodeURIComponent(course.category ?? "")}`}>{category.toUpperCase()}</a>
              </>
            )}
            {course.certificationBody && <> / {course.certificationBody.toUpperCase()}</>}
          </div>
          {providerRow}
          <div className="cp-title-row">
            <div>
              <h1>{course.name}</h1>
              {lede && <p className="cp-lede">{lede}</p>}
            </div>
            {badge && (
              <figure className="cp-badge-fig">
                {badgeArt("md")}
                <figcaption>You earn this badge</figcaption>
              </figure>
            )}
          </div>
          {sel ? (
            <>
              <HeroFacts language={language} />
              <div className="cp-cta-row">
                <RegisterLink className="cp-btn cp-btn-green cp-btn-lg" />
                {dates.length > 1 && (
                  <a className="cp-btn cp-btn-outline cp-btn-lg" href="#dates">
                    See all {dates.length} dates
                  </a>
                )}
              </div>
            </>
          ) : (
            <p className="cp-muted">No upcoming dates yet. Check back soon, or see the provider&apos;s other classes below.</p>
          )}
        </div>
        {sel && (
          <aside className="cp-hero-card" aria-label="Register">
            <RegisterPanel />
          </aside>
        )}
      </section>

      {sel && <DatePicker heading={dates.length > 3 ? "Pick the week that works" : "Pick your date"} />}

      {data.related && data.related.length > 0 && (
        <section className="cp-related" aria-labelledby="related-title">
          <h2 id="related-title" className="cp-mono cp-eyebrow">
            SAME CERTIFICATION · OTHER VERSIONS FROM {data.organization.name.toUpperCase()}
          </h2>
          {data.related.map((r) => (
            <div key={r.slug} className="cp-related-row">
              <a className="cp-related-name" href={`/c/${encodeURIComponent(org)}/${encodeURIComponent(r.slug)}`}>
                {r.language && <span className="cp-tag cp-tag-soon">{langLabel(r.language)}</span>}
                {r.name}
              </a>
              <div className="cp-related-dates">
                {r.dates.map((d) => (
                  <a key={d.dateSlug} href={`/c/${encodeURIComponent(org)}/${encodeURIComponent(r.slug)}/${d.dateSlug}`} className={d.full ? "is-full" : ""}>
                    <strong>{dateRange(d.startsAt, d.endsAt, d.timezone)}</strong>
                    <small>
                      {d.format === "in_person" ? cityOf(d.timezone) : "Online"} · {d.full ? "Full" : d.seatsLeft !== null ? `${d.seatsLeft} left` : "Open"}
                    </small>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {(body.length > 0 || included || defaults.length > 0) && (
        <section className="cp-about" aria-labelledby="about-title">
          <div className="cp-about-text">
            <span className="cp-mono cp-eyebrow">ABOUT THIS CLASS</span>
            <h2 id="about-title">{course.page?.tagline && course.page.tagline.length < 90 ? course.page.tagline : "What this class covers"}</h2>
            {(body.length ? body : lede ? [lede] : []).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="cp-included">
            <h3>What&apos;s included</h3>
            <ul>
              {(included ? included.map((i) => ({ title: i.title, note: i.note })) : defaults.map((t) => ({ title: t, note: undefined }))).map((i, n) => (
                <li key={n}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span>
                    {i.title}
                    {i.note && <small>{i.note}</small>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {sel && (video || agenda.length > 0 || selSessions.length > 1 || (show.instructor && lead)) && (
        <div className="rx cp-rx">
          <ZoneProvider classZone={sel.event.timezone}>
            <div className="rx-sections">
              {video && (
                <section id="preview" className="rx-video" aria-labelledby="preview-title">
                  <div className="rx-video-frame">
                    <iframe src={video} title={`${course.name} preview`} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" />
                  </div>
                  <div className="rx-video-text">
                    <span className="rx-eyebrow">Course preview</span>
                    <h2 id="preview-title" className="rx-h2">
                      {lead ? `Meet ${lead.name.split(" ")[0]} before you commit` : "See how the class runs"}
                    </h2>
                  </div>
                </section>
              )}
              {(agenda.length > 0 || selSessions.length > 1) && <Agenda sessions={selSessions} topics={agenda} classZone={sel.event.timezone} multiDay={selSessions.length > 1 || agenda.length > 1} />}
              {show.instructor && lead && (
                <section className="rx-instructor" aria-labelledby="instructor-title">
                  {lead.photoUrl ? <img src={lead.photoUrl} alt="" /> : <span className="ph" aria-hidden="true">{lead.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}</span>}
                  <div>
                    <div className="rx-eyebrow">Your instructor</div>
                    <h2 id="instructor-title">{lead.name}</h2>
                    {lead.title && <div className="sub">{lead.title}</div>}
                    {lead.bio && <p>{lead.bio}</p>}
                  </div>
                </section>
              )}
            </div>
          </ZoneProvider>
        </div>
      )}

      {badge && (
        <section className="cp-badge-band" aria-labelledby="badge-title">
          {badgeArt("lg")}
          <div>
            <span className="cp-mono cp-eyebrow cp-green">{badge.platform === "own" ? "EVERY CERTIFICATE COMES WITH A BADGE" : "YOU EARN THIS BADGE"}</span>
            <h2 id="badge-title">{badge.platform === "own" ? "Proof anyone can check" : badge.name}</h2>
            <p>
              {badge.platform === "own"
                ? `Issued by ${data.organization.name} to the name you register with once the class is delivered. One click to add it to LinkedIn; anyone can verify it on enrollclass.com.`
                : `Issued through ${BADGE_LABEL[badge.platform] ?? "a badge platform"} once the class is delivered. Share it on LinkedIn or add it to your email signature.`}
            </p>
            <span className="cp-badge-links">
              {badge.url && (
                <a href={badge.url} target="_blank" rel="noreferrer noopener">
                  View the badge
                </a>
              )}
              <a href={`${site}/badges`}>How badges work</a>
            </span>
          </div>
        </section>
      )}

      <section className="cp-org" aria-label="About the provider">
        <div className="cp-org-card">
          <div className="cp-org-cover" style={profile?.organization.profile.coverUrl ? { backgroundImage: `url(${profile.organization.profile.coverUrl})` } : undefined} role="img" aria-label={`${data.organization.name} cover`} />
          <div className="cp-org-body">
            {data.organization.logoUrl ? <img className="cp-org-logo" src={data.organization.logoUrl} alt="" /> : <span className="cp-org-logo cp-initials" aria-hidden="true">{initials}</span>}
            <div className="cp-org-text">
              <span className="cp-mono cp-eyebrow">YOUR PROVIDER</span>
              <h2>{data.organization.name}</h2>
              <div className="cp-stats">
                {(profile?.stats.learnersTrained ?? 0) > 0 && (
                  <div>
                    <strong>{profile!.stats.learnersTrained.toLocaleString("en-US")}</strong>
                    <small>learners trained on EnrollClass</small>
                  </div>
                )}
                {courseCount > 0 && (
                  <div>
                    <strong>{courseCount}</strong>
                    <small>{courseCount === 1 ? "course" : "courses"} with upcoming dates</small>
                  </div>
                )}
                {(profile?.stats.classesDelivered ?? 0) > 0 && (
                  <div>
                    <strong>{profile!.stats.classesDelivered}</strong>
                    <small>classes delivered</small>
                  </div>
                )}
              </div>
              {profile?.organization.profile.about && <p>{profile.organization.profile.about}</p>}
            </div>
            <div className="cp-org-actions">
              <a className="cp-btn cp-btn-green" href={profileHref}>
                View profile
              </a>
              {profile?.organization.profile.website && (
                <a className="cp-btn cp-btn-outline" href={profile.organization.profile.website} target="_blank" rel="noopener noreferrer">
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
        {otherCourses.length > 0 && (
          <>
            <div className="cp-more-head">
              <h3>More from {data.organization.name}</h3>
              <a href={profileHref}>All {courseCount} courses</a>
            </div>
            <div className="cp-more">
              {otherCourses.slice(0, 4).map((list) => {
                const c = list[0]!;
                const prices = list.map((x) => x.priceMinor).filter((x): x is number => x !== null);
                return (
                  <a key={c.courseSlug} href={`/c/${encodeURIComponent(org)}/${encodeURIComponent(c.courseSlug)}`}>
                    <span className="cp-ring cp-ring-sm" aria-hidden="true">
                      <strong>{badgeCode(c.courseName)}</strong>
                    </span>
                    <strong>{c.courseName}</strong>
                    <span className="cp-mono">
                      {(c.format === "in_person" ? cityOf(c.timezone) : c.format === "self_paced" ? "SELF-PACED" : "LIVE ONLINE").toUpperCase()} · {fmt(c.startsAt, c.timezone, { month: "short", day: "numeric" }).toUpperCase()}
                    </span>
                    <span className="cp-more-price">{prices.length ? `From ${whole(Math.min(...prices), c.currency)}` : ""}</span>
                  </a>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="cp-policies" aria-label="Booking policies">
        <div>
          <span className="cp-mono">01</span>
          <strong>{paymentMode === "protected" ? "Payment held until delivery" : "Secure card payment"}</strong>
          <span>{paymentMode === "protected" ? "Released to the provider only after the class runs. Cancelled class: full refund." : `You pay ${data.organization.name} directly by card; receipts come by email.`}</span>
        </div>
        {dates.some((d) => d.invoice) && (
          <div>
            <span className="cp-mono">02</span>
            <strong>Need an invoice?</strong>
            <span>Choose &ldquo;Invoice my company&rdquo;: your seat is held while your accounts team pays.</span>
          </div>
        )}
        <div>
          <span className="cp-mono">{dates.some((d) => d.invoice) ? "03" : "02"}</span>
          <strong>Change of plans</strong>
          <span>
            Change or cancel from your booking link, within {data.organization.name}&apos;s policy. <a href={`${site}/refunds`}>Refunds and cancellations</a>
          </span>
        </div>
      </section>
    </main>
  );

  return (
    <div className="cp" style={style}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {sel ? (
        <BookingProvider dates={dates} initial={sel.dateSlug} basePath={basePath} nowIso={nowIso} showSeats={show.seats} paymentMode={paymentMode} orgName={data.organization.name}>
          {header}
          {page}
          <MobileBar />
        </BookingProvider>
      ) : (
        <>
          {header}
          {page}
        </>
      )}
      <footer className="cp-foot">
        <div className="cp-wrap cp-foot-in">
          <Logo href={site} size={9} />
          <nav aria-label="Footer">
            <a href={`${site}/classes`}>Find a class</a>
            <a href="/verify">Verify a badge</a>
            <a href={`${site}/refunds`}>Refunds and cancellations</a>
            <a href="/help">Help</a>
          </nav>
        </div>
      </footer>
      {sel && (
        <RegisterSheet
          api={publicApiUrl()}
          org={org}
          course={slug}
          event={sel.event.id}
          currency={sel.event.currency}
          stripePk={process.env.STRIPE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null}
          turnstileSiteKey={process.env.TURNSTILE_SITE_KEY ?? null}
          priceLabel={cheapest(sel) ? whole(cheapest(sel)!.minor, cheapest(sel)!.currency) : "—"}
          dateLabel={range(sel)}
          disabled={seats(sel).left === 0}
          hideBar
        />
      )}
    </div>
  );
}
