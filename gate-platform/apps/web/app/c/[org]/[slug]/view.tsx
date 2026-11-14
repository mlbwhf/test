import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi, type PublicCoursePage, type PublicTicketType } from "@/lib/public-api";
import { formatMoney } from "@/lib/format";
import { publicApiUrl, siteOrigin } from "@/lib/urls";
import { RegisterSheet } from "@/components/register-sheet";
import { RegisterCard } from "@/components/class-page/register-card";
import { Agenda, YourTime, ZoneProvider } from "@/components/class-page/times";
import { RxFonts, videoEmbed } from "@/components/class-page/shared";
import { dateRange } from "@/lib/class-time";
import "../../registration.css";

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

/** "About this class": the full description, and the badge with how it's issued and a link to it. */
function About({ data, showBadge }: { data: PublicCoursePage; showBadge: boolean }) {
  const desc = data.course.description?.trim() ?? "";
  const lede = data.course.page?.tagline ?? leadOf(desc);
  const body = desc && (desc !== lede || paragraphs(desc).length > 1) ? paragraphs(desc) : [];
  const badge = showBadge ? data.course.badge : null;
  if (!body.length && !badge) return null;
  return (
    <section className={`rx-about${badge && body.length ? "" : " is-single"}`} aria-labelledby="about-title">
      {body.length > 0 && (
        <div className="rx-about-text">
          <h2 id="about-title" className="rx-h2">
            About this class
          </h2>
          {body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {badge && (
        <aside className="rx-about-badge" aria-labelledby={body.length ? undefined : "about-title"}>
          <div className="rx-badge-art" role="img" aria-label={`${badge.name} badge`}>
            {badge.imageUrl ? <img src={badge.imageUrl} alt="" /> : <strong>{badge.name}</strong>}
          </div>
          <div>
            <div className="rx-eyebrow">Digital badge</div>
            <strong id={body.length ? undefined : "about-title"}>{badge.name}</strong>
            <p>
              {badge.platform === "own"
                ? `Earned on completion: a verified digital badge (Open Badges 3.0) issued by ${data.organization.name} with your certificate, ready to share on LinkedIn or keep in any badge wallet.`
                : `Earned on completion, issued through ${BADGE_LABEL[badge.platform] ?? "a badge platform"}. Share it on LinkedIn or add it to your email signature.`}
            </p>
            {badge.url && (
              <a href={badge.url} target="_blank" rel="noreferrer noopener">
                View the badge →
              </a>
            )}
          </div>
        </aside>
      )}
    </section>
  );
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
  const sel = chosen ?? cohorts.find((c) => seats(c).left > 0) ?? cohorts[0];
  const webBase = await siteOrigin();
  const base = `${webBase}/c/${encodeURIComponent(org)}/${encodeURIComponent(slug)}`;
  // A date page describes only its own date; the course page lists every date.
  const jsonLd = (single && sel ? [sel] : cohorts).map((c) => educationEvent(data, c, base));
  const show = data.sections;
  const accent = data.organization.accentColor ?? undefined;
  const style = accent ? ({ "--rx-accent": accent } as React.CSSProperties) : undefined;
  const profileHref = `/o/${encodeURIComponent(data.organization.profileHandle ?? data.organization.id)}`;
  const orgRow = (
    <a className="rx-org" href={profileHref}>
      {show.logo && data.organization.logoUrl && <img className="rx-org-logo" src={data.organization.logoUrl} alt="" />}
      <span>
        <span className="rx-org-name">{data.organization.name}</span>
        {data.course.certificationBody && <span className="rx-org-sub" style={{ display: "block" }}>{data.course.certificationBody} certification</span>}
      </span>
    </a>
  );

  if (!sel) {
    return (
      <div className="rx" style={style}>
        <RxFonts />
        <header className="rx-bar">
          <div className="rx-wrap rx-bar-in">
            <a href="/" className="rx-word">EnrollClass</a>
          </div>
        </header>
        <main className="rx-wrap">
          <section className="rx-hero">
            <div className="rx-card rx-hero-main">
              {orgRow}
              <h1 className="rx-title">{data.course.name}</h1>
              {(data.course.page?.tagline ?? leadOf(data.course.description ?? "")) && <p className="rx-lede">{data.course.page?.tagline ?? leadOf(data.course.description ?? "")}</p>}
              <p className="rx-muted" style={{ margin: 0 }}>No upcoming dates yet. Check back soon.</p>
            </div>
          </section>
          <div className="rx-sections">
            <About data={data} showBadge={show.badge} />
          </div>
        </main>
      </div>
    );
  }

  const { cap, left } = seats(sel);
  const price = cheapest(sel);
  const free = price?.minor === 0;
  const paymentMode = data.organization.paymentMode === "direct" ? "direct" : "protected";
  const ev = sel.event;
  const sessions = ev.sessions.length ? ev.sessions : [{ startsAt: ev.startsAt, endsAt: ev.endsAt ?? ev.startsAt }];
  const dates = dateRange(ev.startsAt, ev.endsAt ?? ev.startsAt, ev.timezone);
  const online = ev.format === "live_virtual" || ev.format === "self_paced";
  const formatLabel = ev.format === "in_person" ? "In person · instructor-led" : ev.format === "hybrid" ? "Hybrid · instructor-led" : ev.format === "self_paced" ? "Self-paced" : "Live online · instructor-led";
  const where = online ? "Online" : cityOf(ev.timezone);
  const instructors = sel.instructors;
  const lede = data.course.page?.tagline ?? leadOf(data.course.description ?? "");
  const checkoutHref = `/c/${encodeURIComponent(org)}/${encodeURIComponent(slug)}/register?date=${encodeURIComponent(sel.dateSlug)}`;
  const priceText = price ? (free ? "Free" : whole(price.minor, price.currency)) : "—";
  const video = show.video && data.course.page?.videoUrl ? videoEmbed(data.course.page.videoUrl) : null;
  const agenda = show.agenda ? (data.course.page?.agenda ?? []) : [];
  const included = show.included ? (data.course.page?.included ?? []) : [];
  const lead = instructors[0];

  return (
    <div className="rx" style={style}>
      <RxFonts />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ZoneProvider classZone={ev.timezone}>
        <header className="rx-bar">
          <div className="rx-wrap rx-bar-in">
            <a href="/" className="rx-word">EnrollClass</a>
            <span className="rx-bar-title">
              {data.course.name} · {dates} · {online ? "Live online" : where}
            </span>
            {left > 0 && show.seats && <span className={`rx-bar-seats${left > 5 ? " is-ok" : ""}`}>{left} {left === 1 ? "seat" : "seats"} left</span>}
            {left > 0 ? (
              <a className="rx-btn rx-btn-sm" href={`${checkoutHref}&tier=me&qty=1`}>
                Register
              </a>
            ) : (
              <button type="button" className="rx-btn rx-btn-sm" data-open-register>
                Join the waitlist
              </button>
            )}
          </div>
        </header>

        {show.banner && data.course.imageUrl && <div className="rx-banner" role="img" aria-label={`${data.course.name} banner`} style={{ backgroundImage: `url(${data.course.imageUrl})` }} />}

        <main className="rx-wrap" data-entity="course" data-course={data.course.slug}>
          <section className={`rx-hero${show.banner && data.course.imageUrl ? " has-banner" : ""}`} data-entity="event" data-event={ev.id}>
            <div className="rx-card rx-hero-main">
              <div className="rx-hero-top">
                {orgRow}
                <span className="rx-live">
                  <i aria-hidden="true" />
                  {formatLabel}
                </span>
              </div>
              <div className="rx-hero-text">
                <div>
                  <h1 className="rx-title">{data.course.name}</h1>
                  {lede && <p className="rx-lede">{lede}</p>}
                </div>
                {show.badge && data.course.badge && (
                  <div className="rx-badge">
                    <div className="rx-badge-art" role="img" aria-label={`${data.course.badge.name} badge`}>
                      {data.course.badge.imageUrl ? <img src={data.course.badge.imageUrl} alt="" /> : <strong>{data.course.badge.name}</strong>}
                    </div>
                    <span>Earn this badge</span>
                  </div>
                )}
              </div>
              <div className="rx-facts">
                <div className="rx-fact">
                  <span>Dates</span>
                  <strong>{dates}</strong>
                </div>
                <div className="rx-fact">
                  <span>Your time</span>
                  <strong>
                    <YourTime session={sessions[0]!} classZone={ev.timezone} />
                  </strong>
                </div>
                <div className="rx-fact">
                  <span>Where</span>
                  <strong>{where}</strong>
                </div>
                <div className="rx-fact">
                  <span>{instructors.length > 1 ? "Instructors" : "Instructor"}</span>
                  <strong>{instructors.length ? instructors.map((i) => i.name).join(", ") : "To be announced"}</strong>
                </div>
              </div>
              <div className="rx-cta-row">
                {left > 0 ? (
                  <a className="rx-btn" href={`${checkoutHref}&tier=me&qty=1`}>
                    {free ? "Register now — free" : `Register now — ${priceText}`}
                  </a>
                ) : (
                  <button type="button" className="rx-btn" data-open-register>
                    Sold out · join the waitlist
                  </button>
                )}
                {video && (
                  <a className="rx-btn-ghost" href="#preview">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Watch preview
                  </a>
                )}
                {(agenda.length > 0 || sessions.length > 1) && (
                  <a className="rx-btn-plain" href="#agenda">
                    See agenda
                  </a>
                )}
              </div>
            </div>
            <aside className="rx-reg" aria-label="Register">
              {price && (
                <RegisterCard
                  checkoutHref={checkoutHref}
                  unitMinor={price.minor}
                  currency={price.currency}
                  capacity={cap}
                  left={left}
                  invoiceAvailable={sel.invoiceAvailable}
                  paymentMode={paymentMode}
                  orgName={data.organization.name}
                  hideSeats={!show.seats}
                />
              )}
              {left === 0 && (
                <p className="rx-muted" style={{ fontSize: 14, margin: "12px 4px 0" }}>
                  This date is full. <button type="button" className="rx-btn-plain" style={{ minHeight: 0, padding: 0, border: 0, background: "none", color: "var(--rx-accent)", cursor: "pointer" }} data-open-register>Join the waitlist</button> and you&apos;ll be offered a seat if one opens.
                </p>
              )}
            </aside>
          </section>

          {cohorts.length > 1 && (
            <nav className="rx-dates" aria-label="Other dates">
              {cohorts.map((c) => (
                <Link key={c.event.id} href={`/c/${encodeURIComponent(org)}/${encodeURIComponent(slug)}/${c.dateSlug}`} scroll={false} aria-current={c.event.id === ev.id ? "true" : undefined} className={seats(c).left === 0 ? "is-full" : ""}>
                  <strong>{dateRange(c.event.startsAt, c.event.endsAt ?? c.event.startsAt, c.event.timezone)}</strong>
                  <small>
                    {c.event.format === "in_person" ? cityOf(c.event.timezone) : "Online"} · {seats(c).left > 0 ? (show.seats ? `${seats(c).left} left` : "Open") : "Full"}
                  </small>
                </Link>
              ))}
            </nav>
          )}

          {data.related && data.related.length > 0 && (
            <section className="rx-related" aria-labelledby="related-title">
              <h2 id="related-title" className="rx-eyebrow">
                Same certification · other dates from {data.organization.name}
              </h2>
              {data.related.map((r) => (
                <div key={r.slug} className="rx-related-row">
                  <a className="rx-related-name" href={`/c/${encodeURIComponent(org)}/${encodeURIComponent(r.slug)}`}>
                    {r.language && <span className="rx-lang">{langLabel(r.language)}</span>}
                    {r.name}
                  </a>
                  <nav className="rx-dates" aria-label={`Dates for ${r.name}`}>
                    {r.dates.map((d) => (
                      <a key={d.dateSlug} href={`/c/${encodeURIComponent(org)}/${encodeURIComponent(r.slug)}/${d.dateSlug}`} className={d.full ? "is-full" : ""}>
                        <strong>{dateRange(d.startsAt, d.endsAt, d.timezone)}</strong>
                        <small>
                          {d.format === "in_person" ? cityOf(d.timezone) : "Online"} · {d.full ? "Full" : d.seatsLeft !== null ? `${d.seatsLeft} left` : "Open"}
                        </small>
                      </a>
                    ))}
                  </nav>
                </div>
              ))}
            </section>
          )}

          <div className="rx-sections">
            {video && (
              <section id="preview" className="rx-video" aria-labelledby="preview-title">
                <div className="rx-video-frame">
                  <iframe src={video} title={`${data.course.name} preview`} loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" />
                </div>
                <div className="rx-video-text">
                  <span className="rx-eyebrow">Course preview</span>
                  <h2 id="preview-title" className="rx-h2">
                    {lead ? `Meet ${lead.name.split(" ")[0]} before you commit` : "See how the class runs"}
                  </h2>
                </div>
              </section>
            )}

            <About data={data} showBadge={show.badge} />

            {(agenda.length > 0 || sessions.length > 1) && <Agenda sessions={sessions} topics={agenda} classZone={ev.timezone} multiDay={sessions.length > 1 || agenda.length > 1} />}

            {included.length > 0 && (
              <section aria-labelledby="included-title" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h2 id="included-title" className="rx-h2">
                  What you leave with
                </h2>
                <div className="rx-included">
                  {included.map((i, n) => (
                    <div key={n}>
                      <strong>{i.title}</strong>
                      {i.note && <span>{i.note}</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {show.instructor && lead && (
              <section className="rx-instructor" aria-labelledby="instructor-title">
                {lead.photoUrl ? <img src={lead.photoUrl} alt="" /> : <span className="ph" aria-hidden="true">{lead.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}</span>}
                <div>
                  <div className="rx-eyebrow">Your instructor</div>
                  <h2 id="instructor-title">{lead.name}</h2>
                  {lead.title && <div className="sub">{lead.title}</div>}
                  {lead.bio && <p>{lead.bio}</p>}
                </div>
                <a href={profileHref} style={{ color: "#fff", fontWeight: 600, border: "1px solid #5a6070", borderRadius: 10, padding: "12px 16px", textDecoration: "none" }}>
                  All classes by {data.organization.name}
                </a>
              </section>
            )}

            <section className="rx-band" aria-label="Register">
              <div>
                <strong>{left > 0 ? (show.seats ? `${left} ${left === 1 ? "seat" : "seats"} left for ${dates}` : `Seats open for ${dates}`) : `${dates} is full`}</strong>
                <span>
                  {free
                    ? "Free to attend · your ticket and calendar invite arrive by email"
                    : paymentMode === "direct"
                      ? `Secure card payment to ${data.organization.name}`
                      : "Payment held until the class runs · cancelled class = full refund"}
                </span>
              </div>
              {left > 0 ? (
                <a className="rx-btn" href={`${checkoutHref}&tier=me&qty=1`}>
                  Register now
                </a>
              ) : (
                <button type="button" className="rx-btn" data-open-register>
                  Join the waitlist
                </button>
              )}
            </section>

            <p className="rx-help">
              Questions about booking, changing dates or refunds? <a href="/help#learners">Learner help</a>
            </p>
          </div>
        </main>

        <div className="rx-mbar">
          <div>
            <strong>{priceText}{price && !free ? ` ${price.currency}` : ""}</strong>
            <span>{left > 0 ? (show.seats ? `${left} of ${cap} seats left` : "Seats available") : "Sold out"}</span>
          </div>
          {left > 0 ? (
            <a className="rx-btn" href={`${checkoutHref}&tier=me&qty=1`}>
              Reserve seat
            </a>
          ) : (
            <button type="button" className="rx-btn" data-open-register>
              Join waitlist
            </button>
          )}
        </div>
      </ZoneProvider>

      <RegisterSheet
        api={publicApiUrl()}
        org={org}
        course={slug}
        event={ev.id}
        currency={ev.currency}
        stripePk={process.env.STRIPE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null}
        turnstileSiteKey={process.env.TURNSTILE_SITE_KEY ?? null}
        priceLabel={priceText}
        dateLabel={range(sel)}
        disabled={left === 0}
        hideBar
      />
    </div>
  );
}
