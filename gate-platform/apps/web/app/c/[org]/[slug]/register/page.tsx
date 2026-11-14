import type { Metadata } from "next";
import { loadCourse, seats } from "../view";
import { publicApiUrl } from "@/lib/urls";
import { dateRange, timeRange, zoneAbbr } from "@/lib/class-time";
import { RxFonts } from "@/components/class-page/shared";
import { Checkout } from "@/components/class-page/checkout";
import "../../../registration.css";

export const dynamic = "force-dynamic";

type Params = Promise<{ org: string; slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { data } = await loadCourse(params);
  return { title: `Register · ${data.course.name}`, robots: { index: false, follow: false } };
}

/** Checkout for one date: attendees, a ready check, then card or invoice. */
export default async function RegisterPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { org, slug, data } = await loadCourse(params);
  const sp = await searchParams;
  const want = one(sp.date);
  const cohorts = [...data.cohorts].sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt));
  const sel = cohorts.find((c) => c.dateSlug === want || c.event.id === want) ?? cohorts.find((c) => seats(c).left > 0) ?? cohorts[0];
  const classHref = `/c/${encodeURIComponent(org)}/${encodeURIComponent(slug)}${sel ? `/${sel.dateSlug}` : ""}`;
  const accent = data.organization.accentColor ? ({ "--rx-accent": data.organization.accentColor } as React.CSSProperties) : undefined;

  if (!sel || seats(sel).left === 0) {
    return (
      <div className="rx" style={accent}>
        <RxFonts />
        <main className="rx-wrap rx-done">
          <section className="rx-card rx-panel">
            <h1>{sel ? "This date is full" : "No dates open"}</h1>
            <p className="rx-muted" style={{ margin: 0 }}>{sel ? "Join the waitlist on the class page and you'll be offered a seat if one opens." : "There are no upcoming dates for this class right now."}</p>
            <a className="rx-btn" href={classHref} style={{ alignSelf: "flex-start" }}>
              Back to the class
            </a>
          </section>
        </main>
      </div>
    );
  }

  const ev = sel.event;
  const sessions = ev.sessions.length ? ev.sessions : [{ startsAt: ev.startsAt, endsAt: ev.endsAt ?? ev.startsAt }];
  const first = sessions[0]!;
  const sameTimes = sessions.every((s) => timeRange(s.startsAt, s.endsAt, ev.timezone) === timeRange(first.startsAt, first.endsAt, ev.timezone));
  const tiers = sel.ticketTypes.filter((t) => t.remaining > 0 && t.prices[ev.currency] !== undefined).sort((a, b) => a.prices[ev.currency]! - b.prices[ev.currency]!);
  const tierParam = one(sp.tier);
  const tier = tierParam === "team" || tierParam === "invoice" ? tierParam : "me";
  const qty = Math.max(1, Math.min(Number(one(sp.qty)) || 1, seats(sel).left, tier === "invoice" ? 20 : 10));

  return (
    <div className="rx" style={accent}>
      <RxFonts />
      <Checkout
        api={publicApiUrl()}
        orgId={org}
        classHref={classHref}
        registeredBase={`/c/${encodeURIComponent(org)}/${encodeURIComponent(slug)}/registered`}
        course={{ name: data.course.name, durationDays: data.course.durationDays }}
        orgName={data.organization.name}
        orgCountry={data.organization.country}
        dates={dateRange(ev.startsAt, ev.endsAt ?? ev.startsAt, ev.timezone)}
        times={`${timeRange(first.startsAt, first.endsAt, ev.timezone)} ${zoneAbbr(first.startsAt, ev.timezone)}${sessions.length > 1 ? (sameTimes ? ", daily" : " on day 1") : ""}`}
        where={ev.format === "in_person" ? "In person" : ev.format === "hybrid" ? "Hybrid" : "Live online"}
        instructors={sel.instructors.map((i) => i.name)}
        sessionCount={sessions.length}
        classZone={ev.timezone}
        currency={ev.currency}
        ticketTypes={tiers.map((t) => ({ id: t.id, name: t.name, priceMinor: t.prices[ev.currency]!, remaining: t.remaining }))}
        invoiceAvailable={sel.invoiceAvailable}
        flexibleOffered={data.organization.flexibleTickets === true}
        paymentMode={data.organization.paymentMode === "direct" ? "direct" : "protected"}
        stripePk={process.env.STRIPE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null}
        turnstileSiteKey={process.env.TURNSTILE_SITE_KEY ?? null}
        initialTier={tier}
        initialQty={tier === "me" ? 1 : qty}
        seatsLeft={seats(sel).left}
      />
    </div>
  );
}
