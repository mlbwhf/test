import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publicApi, type PublicCoursePage, type PublicTicketType } from "@/lib/public-api";
import { formatMoney } from "@/lib/format";
import { publicApiUrl, siteOrigin } from "@/lib/urls";
import { appUrl } from "@/lib/seo";
import { Logo } from "@/components/brand";
import { RegisterSheet } from "@/components/register-sheet";

export const dynamic = "force-dynamic";

type Params = Promise<{ org: string; slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Cohort = PublicCoursePage["cohorts"][number];

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
function range(c: Cohort): string {
  const e = c.event;
  const end = e.endsAt ?? e.startsAt;
  const [m1, d1, y1] = [fmt(e.startsAt, e.timezone, { month: "short" }), fmt(e.startsAt, e.timezone, { day: "numeric" }), fmt(e.startsAt, e.timezone, { year: "numeric" })];
  const [m2, d2, y2] = [fmt(end, e.timezone, { month: "short" }), fmt(end, e.timezone, { day: "numeric" }), fmt(end, e.timezone, { year: "numeric" })];
  if (y1 !== y2) return `${m1} ${d1}, ${y1} – ${m2} ${d2}, ${y2}`.toUpperCase();
  if (m1 !== m2) return `${m1} ${d1} – ${m2} ${d2}, ${y2}`.toUpperCase();
  if (d1 !== d2) return `${m1} ${d1}–${d2}, ${y2}`.toUpperCase();
  return `${m1} ${d1}, ${y1}`.toUpperCase();
}

const tzAbbr = (c: Cohort) => fmt(c.event.startsAt, c.event.timezone, { timeZoneName: "short" }).split(" ").pop() ?? c.event.timezone;
const cityOf = (tz: string) => (tz.split("/").pop() ?? tz).replace(/_/g, " ");
const seats = (c: Cohort) => ({ cap: c.ticketTypes.reduce((a, t) => a + t.quantity, 0), left: c.ticketTypes.reduce((a, t) => a + Math.max(0, t.remaining), 0) });
const days = (c: Cohort) => Math.max(1, c.event.sessions.length);

function cheapest(c: Cohort): { minor: number; currency: string; tt: PublicTicketType } | null {
  const cur = c.event.currency;
  const options = c.ticketTypes.filter((t) => t.prices[cur] !== undefined && t.remaining > 0);
  const pool = options.length ? options : c.ticketTypes.filter((t) => t.prices[cur] !== undefined);
  const best = pool.sort((a, b) => a.prices[cur]! - b.prices[cur]!)[0];
  return best ? { minor: best.prices[cur]!, currency: cur, tt: best } : null;
}

const whole = (minor: number, currency: string) => (minor === 0 ? "Free" : formatMoney(minor, currency).replace(/[.,]00(?=\D*$)/, ""));

/** schema.org EducationEvent for one date: what search engines and AI agents read. */
function educationEvent(data: PublicCoursePage, c: Cohort, url: string) {
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
      ? { "@type": "Offer", price: (price.minor / 100).toFixed(2), priceCurrency: price.currency, availability: left > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut", url: `${url}?d=${c.event.id}` }
      : undefined,
    url: `${url}?d=${c.event.id}`,
  };
}

async function load(params: Params) {
  const { org, slug } = await params;
  const res = await publicApi.getCourse(org, slug);
  if (!res.ok) {
    if (res.error.kind === "api" && res.error.status === 404) notFound();
    throw new Error("course unavailable");
  }
  return { org, slug, data: res.data };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { data } = await load(params);
  const description = data.course.description ?? `${data.course.name} with ${data.organization.name}`;
  return {
    title: `${data.course.name} · ${data.organization.name}`,
    description,
    alternates: { canonical: `${appUrl()}/c/${encodeURIComponent(data.organization.id)}/${encodeURIComponent(data.course.slug)}` },
    openGraph: { title: data.course.name, description, ...(data.course.imageUrl ? { images: [data.course.imageUrl] } : {}) },
  };
}

export default async function CoursePage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { org, slug, data } = await load(params);
  const sp = await searchParams;
  const want = Array.isArray(sp.d) ? sp.d[0] : sp.d;
  const cohorts = [...data.cohorts].sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
  const sel = cohorts.find((c) => c.event.id === want) ?? cohorts.find((c) => seats(c).left > 0) ?? cohorts[0];
  const webBase = await siteOrigin();
  const url = `${webBase}/c/${encodeURIComponent(org)}/${encodeURIComponent(slug)}`;
  const jsonLd = cohorts.map((c) => educationEvent(data, c, url));
  const words = data.course.name.split(/\s+/);

  if (!sel) {
    return (
      <div className="ep">
        <header className="ep-top">
          <span className="ep-org">{data.organization.name}</span>
          <Logo href="/" size={9} />
        </header>
        <main className="ep-main">
          <h1 className="ep-title">{data.course.name}</h1>
          {data.course.description && <p className="ep-desc">{data.course.description}</p>}
          <p className="ep-note">No upcoming dates yet. Check back soon.</p>
        </main>
      </div>
    );
  }

  const { cap, left } = seats(sel);
  const sold = Math.max(0, cap - left);
  const cells = Math.min(cap, 40);
  const price = cheapest(sel);
  const free = price?.minor === 0;
  const direct = data.organization.paymentMode === "direct";
  const ticker = cohorts.map((c) => `${range(c)} · ${cityOf(c.event.timezone)} · ${tzAbbr(c)} · ${seats(c).left} SEATS LEFT`).join("  ✦  ");
  const firstSession = sel.event.sessions[0] ?? { startsAt: sel.event.startsAt, endsAt: sel.event.endsAt ?? sel.event.startsAt };
  const hours = `${fmt(firstSession.startsAt, sel.event.timezone, { hour: "numeric", minute: "2-digit" })} – ${fmt(firstSession.endsAt, sel.event.timezone, { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}`;

  return (
    <div className="ep">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="ep-top">
        <span className="ep-org">{data.organization.name}</span>
        <Logo href="/" size={9} />
      </header>
      <div className="ep-ticker" aria-hidden="true">
        <span>
          {ticker}  ✦  {ticker}  ✦
        </span>
      </div>

      <main className="ep-main" data-entity="course" data-course={data.course.slug}>
        <section className="ep-banner" aria-label="Course banner" style={data.course.imageUrl ? { backgroundImage: `url(${data.course.imageUrl})` } : undefined}>
          {!data.course.imageUrl && (
            <span className="ep-shapes" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
          )}
          <span className="ep-datepill">{range(sel)}</span>
        </section>

        <p className="ep-tags">
          <span className="ep-tag ep-tag-live">
            <span className="live-dot" aria-hidden="true" /> {FORMAT[sel.event.format] ?? sel.event.format.toUpperCase()}
          </span>
          <span className="ep-tag">
            {days(sel)} DAY{days(sel) === 1 ? "" : "S"}
          </span>
          {data.course.certificationBody && <span className="ep-tag">{data.course.certificationBody.toUpperCase()}</span>}
        </p>
        <h1 className="ep-title">
          {words.map((w, i) => (
            <span key={i}>
              <span className="ep-word" style={{ animationDelay: `${i * 120}ms` }}>
                {w}
              </span>{" "}
            </span>
          ))}
        </h1>
        {data.course.description && <p className="ep-desc">{data.course.description}</p>}

        <section className="ep-seats" aria-label="Seats" data-entity="event" data-event={sel.event.id}>
          <div className="ep-seats-top">
            <span>{range(sel)}</span>
            <span className={left <= 3 ? "is-low" : ""}>{left > 0 ? `${left} left` : "Sold out"}</span>
          </div>
          {cells > 0 && (
            <div className="ep-grid" role="img" aria-label={`${sold} of ${cap} seats taken`} key={sel.event.id}>
              {Array.from({ length: cells }, (_, i) => (
                <span key={i} className={i < Math.round((sold / cap) * cells) ? "is-taken" : i === Math.round((sold / cap) * cells) ? "is-next" : ""} style={{ animationDelay: `${i * 30}ms` }} />
              ))}
            </div>
          )}
          <p className="ep-count">
            <strong>{sold}</strong> of {cap} seats taken
          </p>
        </section>

        {cohorts.length > 1 && (
          <nav className="ep-dates" aria-label="Choose a date">
            {cohorts.map((c) => {
              const s = fmt(c.event.startsAt, c.event.timezone, { month: "short" }).toUpperCase();
              const r = range(c).replace(/, \d{4}$/, "").replace(/^[A-Z]{3} /, "");
              return (
                <Link key={c.event.id} href={`?d=${c.event.id}`} scroll={false} aria-current={c.event.id === sel.event.id ? "true" : undefined} className={seats(c).left === 0 ? "is-full" : ""}>
                  <span>{s}</span>
                  <strong>{r}</strong>
                  <em>
                    {cityOf(c.event.timezone)} · {tzAbbr(c)}
                  </em>
                </Link>
              );
            })}
          </nav>
        )}

        <section className="ep-how" aria-labelledby="how-title">
          <h2 id="how-title">How it runs</h2>
          <ol>
            <li>
              <span>T-14 DAYS</span>
              <strong>Pre-work email</strong>
              <em>Reading and setup sent to every learner.</em>
            </li>
            <li className="is-square">
              <span>{days(sel) > 1 ? `DAY 1–${days(sel)}` : "DAY 1"}</span>
              <strong>{sel.event.format === "in_person" ? "In-person" : "Live"} session{days(sel) > 1 ? "s" : ""}</strong>
              <em>{hours}, with your instructor.</em>
            </li>
            <li>
              <span>LAST DAY</span>
              <strong>Survey email</strong>
              <em>Feedback form sent after the final session.</em>
            </li>
            {free || direct ? (
              <li className="is-ink">
                <span>AFTER DELIVERY</span>
                <strong>Certificate</strong>
                <em>{data.organization.name} can send you a certificate of attendance.</em>
              </li>
            ) : (
              <li className="is-ink">
                <span>AFTER DELIVERY</span>
                <strong>Funds released</strong>
                <em>Your payment goes to {data.organization.name} once the course is delivered.</em>
              </li>
            )}
          </ol>
        </section>

        {free ? (
          <section className="ep-held">
            <h2>Free to attend</h2>
            <p>No payment and no card needed. Register to save your seat and get your ticket and calendar invitation.</p>
          </section>
        ) : direct ? (
          <section className="ep-held">
            <h2>Secure card payment</h2>
            <p>Pay by card{price ? ` in ${price.currency}` : ""}. Your payment goes to {data.organization.name} through Stripe. Changes and refunds follow {data.organization.name}&apos;s policy, shown in your confirmation email.</p>
          </section>
        ) : (
          <section className="ep-held">
            <h2>Your payment is held until delivery</h2>
            <p>Pay by card{price ? ` in ${price.currency}` : ""}. EnrollClass holds the funds and releases them to {data.organization.name} after the course is delivered.</p>
          </section>
        )}

        {data.course.badge && (
          <section className="ep-badge" aria-label="Digital badge">
            {data.course.badge.imageUrl ? <img src={data.course.badge.imageUrl} alt="" width={84} height={84} /> : <span className="ep-badge-ph" aria-hidden="true" />}
            <div>
              <span>DIGITAL BADGE</span>
              <strong>{data.course.badge.name}</strong>
              <em>
                {data.course.badge.platform === "own"
                  ? `Earned on completion: a verified digital badge (Open Badges 3.0) issued by ${data.organization.name} with your certificate, ready to share on LinkedIn or keep in any badge wallet.`
                  : `Earned on completion, issued through ${BADGE_LABEL[data.course.badge.platform] ?? "a badge platform"}.`}
              </em>
              {data.course.badge.url && (
                <a href={data.course.badge.url} target="_blank" rel="noreferrer noopener">
                  View the badge →
                </a>
              )}
            </div>
          </section>
        )}

        <p className="ep-helpline">
          Questions about booking, changing dates or refunds? <a href="/help#learners">Learner help</a>
        </p>

        <details className="ep-ai">
          <summary>Structured data for AI agents</summary>
          <pre>{JSON.stringify(jsonLd.find((j) => j.url.endsWith(sel.event.id)), null, 2)}</pre>
        </details>
      </main>

      <RegisterSheet
        api={publicApiUrl()}
        org={org}
        course={slug}
        event={sel.event.id}
        currency={sel.event.currency}
        stripePk={process.env.STRIPE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null}
        priceLabel={price ? whole(price.minor, price.currency) : "—"}
        dateLabel={range(sel)}
        disabled={left === 0}
      />
    </div>
  );
}
