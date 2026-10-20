import type { ReactNode } from "react";
import Link from "next/link";
import { publicApi, seatPagePath, type SeatPolicy, type SeatView, type TransferOption } from "@/lib/public-api";
import { formatDateTimeInZone, formatMoney, formatTimeInZone, humanize } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { ApiNotice, Empty, Section, StatusBadge } from "@/components/ui";
import { TransferForm, type TransferChoice } from "@/components/transfer-form";
import { cancelSeatAction, substituteSeatAction } from "@/app/my/actions";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SearchParams = Record<string, string | string[] | undefined>;

function first(params: SearchParams, key: string): string {
  const v = params[key];
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" ? s.trim() : "";
}

/** One-line confirmation shown after a successful action (the actions redirect back here). */
function SuccessNotice({ params, currency }: { params: SearchParams; currency: string }) {
  const notice = first(params, "notice");
  if (!notice) return null;
  let text: string | null = null;
  switch (notice) {
    case "substituted":
      text = "The registration has been moved to the new attendee.";
      break;
    case "transferred":
      text = "Your seat has been moved to the new cohort.";
      break;
    case "paid":
      text = "Payment received. Your transfer is being completed.";
      break;
    case "cancelled": {
      const minor = Number(first(params, "refundMinor"));
      const status = first(params, "refundStatus");
      text =
        Number.isFinite(minor) && minor > 0
          ? `Your registration is cancelled. A refund of ${formatMoney(minor, currency)} is ${status || "on its way"}.`
          : "Your registration is cancelled.";
      break;
    }
    default:
      return null;
  }
  return (
    <div className="notice notice-ok" role="status">
      {text}
    </div>
  );
}

function transferFeeSummary(policy: SeatPolicy["transfer"], currency: string, timezone: string): string {
  if (policy.freeUntil && new Date(policy.freeUntil).getTime() > Date.now()) {
    return `Free until ${formatDateTimeInZone(policy.freeUntil, timezone)}.`;
  }
  if (policy.feeMinor > 0) return `Fee ${formatMoney(policy.feeMinor, currency)} per transfer.`;
  return "No transfer fee.";
}

function transferChoice(option: TransferOption, currency: string): TransferChoice {
  const tz = option.timezone || "UTC";
  const when = option.endsAt
    ? `${formatDateTimeInZone(option.startsAt, tz)} – ${formatDateTimeInZone(option.endsAt, tz)}`
    : formatDateTimeInZone(option.startsAt, tz);
  const parts = [option.name, when, `${option.remaining} seat${option.remaining === 1 ? "" : "s"} left`];
  parts.push(option.feeMinor > 0 ? `fee ${formatMoney(option.feeMinor, currency)}` : "no fee");
  if (option.priceDeltaMinor > 0) parts.push(`+${formatMoney(option.priceDeltaMinor, currency)} price difference`);
  else if (option.priceDeltaMinor < 0) parts.push(`${formatMoney(option.priceDeltaMinor, currency)} price difference`);
  return { eventId: option.eventId, label: parts.join(" · "), disabled: option.remaining <= 0 };
}

function Invalid({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <>
      <div className="page-header">
        <h1>{title}</h1>
      </div>
      {children}
    </>
  );
}

export default async function SeatPage({
  params,
  searchParams,
}: {
  params: Promise<{ seatId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ seatId }, query] = await Promise.all([params, searchParams]);
  const email = first(query, "email");

  if (!EMAIL_RE.test(email)) {
    return (
      <Invalid title="Open the link from your confirmation email">
        <p className="muted">
          This page needs the personal link we sent you when you registered. It includes your email address so we can
          show the right seat.
        </p>
      </Invalid>
    );
  }

  const result = await publicApi.getSeat(seatId, email);
  if (!result.ok) {
    if (result.error.kind === "api" && result.error.status === 404) {
      return (
        <Invalid title="We couldn't find that seat for this email">
          <p className="muted">
            Check that you opened the link from your confirmation email. If the registration was moved to someone else,
            the new attendee received their own link.
          </p>
        </Invalid>
      );
    }
    return (
      <Invalid title="Your registration">
        <ApiNotice failure={result.error} />
      </Invalid>
    );
  }

  const view: SeatView = result.data;
  const { seat, event, course, organization, policy, transferOptions, calendarUrl, ticketUrl } = view;
  const timezone = event.timezone || "UTC";
  const currency = event.currency;
  const active = seat.status === "confirmed" || seat.status === "reserved";
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null;
  const choices = transferOptions.map((o) => transferChoice(o, currency));
  const canTransfer = policy.transfer.allowed && choices.some((c) => !c.disabled);
  const refundPct = (policy.cancel.refundBps / 100).toFixed(policy.cancel.refundBps % 100 === 0 ? 0 : 2);

  return (
    <>
      <div className="page-header">
        <h1>{course ? course.name : event.name}</h1>
        <StatusBadge status={seat.status} />
        <span className="muted">
          {course ? `${event.name} · ` : ""}
          {formatDateTimeInZone(event.startsAt, timezone)}
          {event.endsAt ? ` – ${formatDateTimeInZone(event.endsAt, timezone)}` : ""} · {timezone} ·{" "}
          {humanize(event.format)}
        </span>
        <span className="muted">Registered with {organization.name}</span>
      </div>

      <SuccessNotice params={query} currency={currency} />

      {seat.status === "transferred" && (
        <div className="notice notice-info" role="status">
          <strong>This seat was transferred.</strong>{" "}
          {seat.transferredToSeatId ? (
            <Link href={seatPagePath(seat.transferredToSeatId, seat.attendee.email)}>Open your new seat →</Link>
          ) : (
            <span>Your new seat will appear here once the transfer completes.</span>
          )}
        </div>
      )}
      {seat.status === "cancelled" && (
        <div className="notice notice-warn" role="status">
          <strong>This registration has been cancelled.</strong> Contact {organization.name} if this is unexpected.
        </div>
      )}

      <Section title="Attendee">
        <dl className="kv">
          <dt>Name</dt>
          <dd>{seat.attendee.name ?? <span className="muted">—</span>}</dd>
          <dt>Email</dt>
          <dd>{seat.attendee.email}</dd>
          <dt>Company</dt>
          <dd>{seat.attendee.company ?? <span className="muted">—</span>}</dd>
          <dt>Seat</dt>
          <dd>
            <code>{seat.id}</code>
          </dd>
          <dt>Order</dt>
          <dd>
            <code>{seat.orderId}</code>
          </dd>
        </dl>
        {active && (
          <p className="section-actions" style={{ marginTop: 12, marginBottom: 0 }}>
            {seat.status === "confirmed" && (
              <a href={ticketUrl} className="btn btn-primary">
                Show my ticket
              </a>
            )}
            <a href={calendarUrl}>Add to calendar</a>
            <span className="hint">(.ics file with every session, in {timezone})</span>
          </p>
        )}
      </Section>

      <Section title="Sessions">
        {event.sessions.length === 0 ? (
          <Empty>No sessions scheduled yet. Times will be shown in {timezone}.</Empty>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Starts ({timezone})</th>
                  <th>Ends</th>
                </tr>
              </thead>
              <tbody>
                {event.sessions.map((s, i) => (
                  <tr key={`${s.startsAt}-${i}`}>
                    <td className="num">{i + 1}</td>
                    <td>{s.title ?? <span className="muted">—</span>}</td>
                    <td>{formatDateTimeInZone(s.startsAt, timezone)}</td>
                    <td>{formatTimeInZone(s.endsAt, timezone)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {active && (
        <div className="actions-grid">
          <Section title="Send someone else">
            {policy.substitute.allowed ? (
              <>
                <p className="hint">
                  Transfer this registration to a colleague. They will receive their own confirmation and link
                  {policy.substitute.until
                    ? `; substitutions close ${formatDateTimeInZone(policy.substitute.until, timezone)}`
                    : ""}
                  .
                </p>
                <ActionForm action={substituteSeatAction} submitLabel="Substitute attendee" pendingLabel="Updating…">
                  <input type="hidden" name="seatId" value={seat.id} />
                  <input type="hidden" name="email" value={seat.attendee.email} />
                  <label>
                    New attendee name
                    <input name="newName" required placeholder="Full name" />
                  </label>
                  <label>
                    New attendee email
                    <input name="newEmail" type="email" required placeholder="colleague@example.com" />
                  </label>
                  <label>
                    Company (optional)
                    <input name="newCompany" defaultValue={seat.attendee.company ?? ""} />
                  </label>
                </ActionForm>
              </>
            ) : (
              <Empty>
                Substitutions are no longer available for this cohort
                {policy.substitute.until ? ` (closed ${formatDateTimeInZone(policy.substitute.until, timezone)})` : ""}.
                Contact {organization.name} if you need help.
              </Empty>
            )}
          </Section>

          <Section title="Move to another date">
            {!policy.transfer.allowed ? (
              <Empty>Transfers are not available for this registration. Contact {organization.name} if you need help.</Empty>
            ) : choices.length === 0 ? (
              <Empty>There are no other cohorts of this course open for transfer right now.</Empty>
            ) : !canTransfer ? (
              <Empty>Every other cohort is currently full. Check back later or contact {organization.name}.</Empty>
            ) : (
              <TransferForm
                seatId={seat.id}
                email={seat.attendee.email}
                currency={currency}
                choices={choices}
                feeSummary={transferFeeSummary(policy.transfer, currency, timezone)}
                stripePublishableKey={stripePublishableKey}
              />
            )}
          </Section>

          <Section title="Cancel registration">
            {policy.cancel.allowed ? (
              <>
                <p className="hint">
                  Cancelling now refunds <strong>{formatMoney(policy.cancel.refundMinor, currency)}</strong> ({refundPct}% of
                  what was paid)
                  {policy.cancel.fullRefundUntil && new Date(policy.cancel.fullRefundUntil).getTime() > Date.now()
                    ? `. Full refunds are available until ${formatDateTimeInZone(policy.cancel.fullRefundUntil, timezone)}`
                    : ""}
                  . This cannot be undone.
                </p>
                <ActionForm action={cancelSeatAction} submitLabel="Cancel my registration" pendingLabel="Cancelling…" variant="danger">
                  <input type="hidden" name="seatId" value={seat.id} />
                  <input type="hidden" name="email" value={seat.attendee.email} />
                  <label>
                    Reason (optional)
                    <textarea name="reason" rows={2} placeholder="Let the organizer know why" />
                  </label>
                  <label className="label-check">
                    <input type="checkbox" name="confirm" required />
                    <span>
                      I understand my seat will be released and I will receive{" "}
                      {formatMoney(policy.cancel.refundMinor, currency)} back.
                    </span>
                  </label>
                </ActionForm>
              </>
            ) : (
              <Empty>
                Cancellation is no longer available for this cohort. You can still substitute a colleague or move to
                another date if those options are open.
              </Empty>
            )}
          </Section>
        </div>
      )}
    </>
  );
}
