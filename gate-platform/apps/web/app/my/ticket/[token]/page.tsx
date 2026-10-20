import type { Metadata } from "next";
import Link from "next/link";
import { publicApi, type TicketStatus, type TicketView } from "@/lib/public-api";
import { ApiNotice } from "@/components/ui";
import { SeatMark } from "@/components/brand";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your ticket", robots: { index: false, follow: false } };

const CHIP: Record<TicketStatus, { label: string; tone: string }> = {
  valid: { label: "VALID", tone: "green" },
  checked_in: { label: "CHECKED IN", tone: "paper" },
  pending: { label: "AWAITING PAYMENT", tone: "amber" },
  cancelled: { label: "CANCELLED", tone: "red" },
  transferred: { label: "MOVED", tone: "amber" },
};

const FORMAT: Record<string, string> = { live_virtual: "Live virtual", in_person: "In person", hybrid: "Hybrid", self_paced: "Self-paced" };

function fmt(iso: string, tz: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, ...opts }).format(new Date(iso));
}

function dateRange(v: TicketView): string {
  const tz = v.event.timezone;
  const start = v.event.sessions[0]?.startsAt ?? v.event.startsAt;
  const end = v.event.sessions.at(-1)?.endsAt ?? v.event.endsAt ?? start;
  const a = fmt(start, tz, { month: "short", day: "numeric" });
  const b = fmt(end, tz, { month: "short", day: "numeric" });
  const y = fmt(end, tz, { year: "numeric" });
  return a === b ? `${a}, ${y}` : `${a} – ${b}, ${y}`;
}

function timeRange(v: TicketView): string {
  const tz = v.event.timezone;
  const first = v.event.sessions[0];
  const start = first?.startsAt ?? v.event.startsAt;
  const end = first?.endsAt ?? v.event.endsAt;
  const t = (iso: string) => fmt(iso, tz, { hour: "numeric", minute: "2-digit" });
  const zone = fmt(start, tz, { timeZoneName: "short" }).split(" ").pop();
  return end ? `${t(start)} – ${t(end)} ${zone}` : `${t(start)} ${zone}`;
}

function days(v: TicketView): number | null {
  if (v.course?.durationDays) return v.course.durationDays;
  return v.event.sessions.length > 1 ? v.event.sessions.length : null;
}

export default async function TicketPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [res, svg] = await Promise.all([publicApi.getTicket(token), publicApi.getTicketQrSvg(token)]);
  if (!res.ok) {
    return (
      <div className="tk-wrap">
        <ApiNotice failure={res.error} />
        <p className="muted">Check that you opened the full link from your confirmation email.</p>
      </div>
    );
  }
  const v = res.data;
  const t = v.ticket;
  const chip = CHIP[t.status];
  const usable = t.status === "valid" || t.status === "checked_in";
  const n = days(v);
  const eyebrow = [FORMAT[v.event.format] ?? v.event.format, n ? `${n} DAY${n === 1 ? "" : "S"}` : null].filter(Boolean).join(" · ").toUpperCase();
  const manage = `/my/seat/${encodeURIComponent(t.seatId)}?email=${encodeURIComponent(t.attendee.email)}`;
  const fields: Array<[string, string]> = [
    ["ATTENDEE", t.attendee.name ?? t.attendee.email],
    ["TICKET", t.ticketTypeName],
    ["DATE", dateRange(v)],
    ["TIME", timeRange(v)],
    ["FORMAT", FORMAT[v.event.format] ?? v.event.format],
    ["ORDER", t.orderId],
  ];

  return (
    <div className="tk-wrap">
      <div className="tk-top">
        <Link href={manage} className="tk-back">
          ← Manage registration
        </Link>
        <span className="mono dim">{v.organization.name}</span>
      </div>

      <article className="tk" aria-label={`Ticket for ${v.course?.name ?? v.event.name}`}>
        <header className="tk-head">
          <div className="tk-blob" aria-hidden="true" />
          <div className="tk-head-row">
            <span className="tk-logo">
              <SeatMark size={8} ink="var(--paper)" />
              <span>enrollclass</span>
            </span>
            <span className={`tk-chip tk-chip-${chip.tone}`}>{chip.label}</span>
          </div>
          <p className="tk-eyebrow">{eyebrow}</p>
          <h1 className="tk-title">{v.course?.name ?? v.event.name}</h1>
          {v.course && v.course.name !== v.event.name && <p className="tk-cohort">{v.event.name}</p>}
        </header>

        <dl className="tk-fields">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={label === "ORDER" ? "mono" : undefined}>{value}</dd>
            </div>
          ))}
        </dl>

        <div className="tk-perf" aria-hidden="true" />

        <section className="tk-qr-block">
          {usable && svg ? (
            <div className={`tk-qr ${t.status === "checked_in" ? "is-done" : ""}`} role="img" aria-label={`Check-in QR code, ${t.code}`}>
              <div className="tk-qr-code" dangerouslySetInnerHTML={{ __html: svg }} />
              <div className="tk-qr-logo" aria-hidden="true">
                <SeatMark size={9} />
              </div>
              {t.status === "valid" && <div className="tk-scan" aria-hidden="true" />}
              {t.status === "checked_in" && (
                <div className="tk-done">
                  <div className="tk-done-mark">✓</div>
                  <div className="tk-done-label">Checked in</div>
                  {t.checkedInAt && <div className="mono">{fmt(t.checkedInAt, v.event.timezone, { hour: "numeric", minute: "2-digit", month: "short", day: "numeric" })}</div>}
                </div>
              )}
            </div>
          ) : (
            <div className="tk-qr tk-qr-void">
              <p>
                {t.status === "pending"
                  ? "Your ticket appears here once payment is confirmed."
                  : t.status === "transferred"
                    ? "This seat moved to another date. Use the link in your newest confirmation email."
                    : t.status === "cancelled"
                      ? "This registration was cancelled."
                      : "The QR code could not be loaded. Show the code below instead."}
              </p>
            </div>
          )}
          <div className="tk-code">{t.code}</div>
          <p className="tk-hint">{usable ? "Show this at the door. Staff scan the code or type the letters above." : " "}</p>
        </section>
      </article>

      <div className="tk-actions">
        <a className="pill pill-ink" href={v.links.calendar}>
          Add to calendar
        </a>
        <PrintButton className="pill pill-outline-ink">Save as PDF</PrintButton>
      </div>
    </div>
  );
}
