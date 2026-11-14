import type { Metadata } from "next";
import { publicApi, type OrderSummary } from "@/lib/public-api";
import { publicApiUrl, siteOrigin } from "@/lib/urls";
import { dateRange, dayLabel, timeRange, zoneAbbr } from "@/lib/class-time";
import { RxFonts, rxMoney } from "@/components/class-page/shared";
import { ConfirmPoller, ReadyList } from "@/components/class-page/confirmation-client";
import { CopyButton } from "@/components/copy-button";
import "../../../registration.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your registration", robots: { index: false, follow: false } };

type Params = Promise<{ org: string; slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

const gcal = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Google Calendar link: one repeating event when the sessions are the same hours on consecutive days. */
function googleLink(s: OrderSummary, title: string, details: string): string {
  const sessions = s.event.sessions.length ? s.event.sessions : [{ startsAt: s.event.startsAt, endsAt: s.event.endsAt ?? s.event.startsAt }];
  const first = sessions[0]!;
  const start = new Date(first.startsAt).getTime();
  const len = new Date(first.endsAt).getTime() - start;
  const daily = sessions.every((x, i) => new Date(x.startsAt).getTime() === start + i * 86_400_000 && new Date(x.endsAt).getTime() - new Date(x.startsAt).getTime() === len);
  const q = new URLSearchParams({ action: "TEMPLATE", text: title, dates: `${gcal(new Date(first.startsAt))}/${gcal(new Date(first.endsAt))}`, details, ctz: s.event.timezone });
  if (daily && sessions.length > 1) q.set("recur", `RRULE:FREQ=DAILY;COUNT=${sessions.length}`);
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export default async function RegisteredPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { org, slug } = await params;
  const sp = await searchParams;
  const orderId = one(sp.order);
  const email = one(sp.email);
  const res = orderId && email ? await publicApi.getOrderSummary(orderId, email) : null;
  const classHref = `/c/${encodeURIComponent(org)}/${encodeURIComponent(slug)}`;

  if (!res?.ok) {
    return (
      <div className="rx">
        <RxFonts />
        <main className="rx-wrap rx-done">
          <section className="rx-card rx-panel">
            <h1>We couldn&apos;t find this booking</h1>
            <p className="rx-muted" style={{ margin: 0 }}>
              Open the link in your confirmation email, or <a href="/help#learners">contact learner help</a>.
            </p>
            <a className="rx-btn" href={classHref} style={{ alignSelf: "flex-start" }}>
              Back to the class
            </a>
          </section>
        </main>
      </div>
    );
  }

  const s = res.data;
  const accent = s.organization.accentColor ? ({ "--rx-accent": s.organization.accentColor } as React.CSSProperties) : undefined;
  const mine = s.seats.find((x) => x.attendee.email.toLowerCase() === s.order.buyerEmail.toLowerCase()) ?? s.seats[0];
  const others = s.seats.filter((x) => x !== mine);
  const zone = mine?.attendee.timeZone ?? s.event.timezone;
  const sessions = s.event.sessions.length ? s.event.sessions : [{ startsAt: s.event.startsAt, endsAt: s.event.endsAt ?? s.event.startsAt }];
  const name = mine?.attendee.name?.split(/\s+/)[0];
  const courseName = s.course?.name ?? s.event.name;
  const invoice = s.order.paymentMethod === "invoice";
  const paid = s.order.status === "paid";
  const confirming = !paid && !invoice && s.order.status === "pending";
  const failed = s.order.status === "failed" || s.order.status === "cancelled";
  const direct = s.order.settlement === "direct";
  const free = s.order.totalMinor === 0;
  const total = `${rxMoney(s.order.totalMinor, s.order.currency)} ${s.order.currency}`;
  const endDate = dayLabel(s.event.endsAt ?? s.event.startsAt, s.event.timezone);
  const classUrl = `${await siteOrigin()}${classHref}`;
  const details = `${courseName} with ${s.organization.name}. Your ticket: ${mine?.ticketUrl ?? ""}`;
  const where = s.event.format === "in_person" ? "In person" : "Live online";

  return (
    <div className="rx" style={accent}>
      <RxFonts />
      <header className="rx-card" style={{ borderRadius: 0, borderWidth: "0 0 1px" }}>
        <div className="rx-wrap rx-co-head-in">
          <span className="rx-word">EnrollClass</span>
          <a href="/my" style={{ fontWeight: 600, fontSize: 15, textDecoration: "none" }}>
            My classes
          </a>
        </div>
      </header>

      <main className="rx-wrap rx-done">
        <section className="rx-ticket" aria-labelledby="done-title">
          <div className="rx-ticket-main">
            {failed ? (
              <span className="rx-ok is-wait">NOT COMPLETED</span>
            ) : confirming ? (
              <span className="rx-ok is-wait">CONFIRMING PAYMENT</span>
            ) : invoice && !paid ? (
              <span className="rx-ok is-wait">{s.order.quantity === 1 ? "SEAT HELD" : `${s.order.quantity} SEATS HELD`}</span>
            ) : (
              <span className="rx-ok">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {s.order.quantity === 1 ? "SEAT CONFIRMED" : `${s.order.quantity} SEATS CONFIRMED`}
              </span>
            )}
            <h1 id="done-title">
              {failed ? "This booking didn't go through" : confirming ? "Almost there…" : invoice && !paid ? "Your seats are held" : name ? `You're in, ${name}.` : "You're in."}
            </h1>
            <p>
              {failed
                ? "No seat was reserved and you haven't been charged. You can try again from the class page."
                : confirming
                  ? "We're confirming your payment with the bank. This page updates on its own; your confirmation email follows."
                  : invoice && !paid && s.invoice
                    ? `Invoice ${s.invoice.number} went to ${s.order.buyerEmail}, due ${dayLabel(s.invoice.dueAt, s.event.timezone)}. Tickets are emailed to each attendee once it's paid.`
                    : `${courseName} · ${where}${s.instructors.length ? ` with ${s.instructors.join(", ")}` : ""}. Your ticket and calendar invite are in your inbox.`}
            </p>
            {confirming && <ConfirmPoller />}
            {!failed && (
              <div className="rx-sess">
                {sessions.map((x, i) => (
                  <div key={i}>
                    <span>{sessions.length > 1 ? `DAY ${i + 1}` : "SESSION"}</span>
                    <strong>{dayLabel(x.startsAt, zone)}</strong>
                    <em>
                      {timeRange(x.startsAt, x.endsAt, zone)} {zoneAbbr(x.startsAt, zone)}
                    </em>
                  </div>
                ))}
              </div>
            )}
            {!failed && mine && (
              <div className="rx-cal">
                <a className="is-main" href={googleLink(s, courseName, details)} target="_blank" rel="noreferrer noopener">
                  {sessions.length > 1 ? `Add all ${sessions.length} to Google Calendar` : "Add to Google Calendar"}
                </a>
                <a href={mine.calendarUrl}>Outlook (.ics)</a>
                <a href={mine.calendarUrl}>Apple (.ics)</a>
              </div>
            )}
            {failed && (
              <div className="rx-cal">
                <a className="is-main" href={classHref}>
                  Back to the class
                </a>
              </div>
            )}
          </div>
          {!failed && mine && (
            <div className="rx-stub">
              {paid ? <img src={mine.qrSvg} alt="Ticket QR code: scan at check-in" width={180} height={180} /> : <div className="ph">Your QR ticket appears here once {invoice ? "the invoice is paid" : "payment is confirmed"}.</div>}
              <div>
                <span>TICKET</span>
                <strong>{mine.code}</strong>
                <small>
                  {mine.attendee.name ?? mine.attendee.email}
                  {s.capacity ? ` · small cohort of ${s.capacity}` : ""}
                </small>
              </div>
              {paid && (
                <a href={mine.ticketUrl} style={{ color: "#fff", fontWeight: 600 }}>
                  Open ticket
                </a>
              )}
            </div>
          )}
        </section>

        {!failed && (
          <div className="rx-done-cols">
            <section className="rx-card rx-done-main" aria-label="Before day 1">
              {mine ? (
                <ReadyList api={publicApiUrl()} seatId={mine.id} email={mine.attendee.email} initial={mine.attendee.readyChecks ?? {}} prework={s.course?.prework ?? null} sessions={sessions.length} />
              ) : null}
              {others.length > 0 && (
                <div className="rx-others">
                  <h3 style={{ fontSize: 18 }}>Your teammates</h3>
                  {others.map((x) => (
                    <span key={x.id}>
                      {x.attendee.name ?? x.attendee.email} · {paid ? <a href={x.ticketUrl}>ticket</a> : "ticket sent when confirmed"}
                    </span>
                  ))}
                  <span className="rx-muted" style={{ fontSize: 14 }}>
                    Each teammate also gets their own email with their ticket and calendar invite.
                  </span>
                </div>
              )}
            </section>

            <div className="rx-done-side">
              <section className="rx-card rx-side" aria-labelledby="pay-title">
                <h2 id="pay-title">Your payment</h2>
                <ol className="rx-tl">
                  {invoice ? (
                    <>
                      <li className="is-done">
                        <span>
                          <b>Invoice {s.invoice?.number} sent</b>
                          <em>To {s.order.buyerEmail}</em>
                        </span>
                      </li>
                      <li className={paid ? "is-done" : "is-now"}>
                        <span>
                          <b>{paid ? `Paid ${total}` : `Due ${s.invoice ? dayLabel(s.invoice.dueAt, s.event.timezone) : ""}`}</b>
                          {!paid && <em>Unpaid seats go back on sale after the due date</em>}
                        </span>
                      </li>
                    </>
                  ) : (
                    <li className={paid ? "is-done" : "is-now"}>
                      <span>
                        <b>{free ? "Free seat" : paid ? `Paid ${total}` : "Confirming payment"}</b>
                        {paid && !free && <em>Receipt sent to {s.order.buyerEmail}</em>}
                      </span>
                    </li>
                  )}
                  {!free && !direct && (
                    <li className={s.order.fundsStatus === "released" ? "is-done" : paid ? "is-now" : undefined}>
                      <span>
                        <b>Held by EnrollClass</b>
                        <em>{s.order.fundsStatus === "released" ? `Released to ${s.organization.name}` : `Not released to ${s.organization.name} until the class runs`}</em>
                      </span>
                    </li>
                  )}
                  {!free && direct && (
                    <li className={paid ? "is-done" : undefined}>
                      <span>
                        <b>Paid to {s.organization.name}</b>
                        <em>Through Stripe</em>
                      </span>
                    </li>
                  )}
                  <li className={s.delivered ? "is-done" : undefined}>
                    <span>
                      <b>Class delivered · {endDate}</b>
                    </span>
                  </li>
                  <li className={s.order.fundsStatus === "released" ? "is-done" : undefined}>
                    <span>
                      <b>{direct || free ? "Certificate and badge issued" : `Badge issued · ${s.organization.name} paid`}</b>
                    </span>
                  </li>
                </ol>
              </section>

              {s.course?.badge && (
                <section className="rx-card rx-side">
                  <div className="rx-mini-badge">
                    <div className="art" role="img" aria-label={`${s.course.badge.name} badge`}>
                      {s.course.badge.imageUrl ? <img src={s.course.badge.imageUrl} alt="" /> : s.course.badge.name}
                    </div>
                    <div>
                      <b style={{ display: "block" }}>Your badge is waiting</b>
                      <span className="rx-muted" style={{ fontSize: 14 }}>
                        {s.course.badge.name}, issued to {mine?.attendee.name ?? "you"} after {endDate}. Anyone can verify it; one click adds it to LinkedIn.
                      </span>
                    </div>
                  </div>
                </section>
              )}

              <section className="rx-invite">
                <b>Bring a colleague</b>
                <span style={{ fontSize: 14, color: "var(--rx-body)" }}>Share the class page; they book their own seat in the same cohort.</span>
                <CopyButton text={classUrl} label="Copy class link" className="rx-btn rx-btn-sm" />
              </section>
            </div>
          </div>
        )}

        <p className="rx-help">
          {dateRange(s.event.startsAt, s.event.endsAt ?? s.event.startsAt, s.event.timezone)} · {s.organization.name} · Need to change your date or send a colleague instead? Use the link in your confirmation email, or <a href="/help#learners">learner help</a>.
        </p>
      </main>
    </div>
  );
}
