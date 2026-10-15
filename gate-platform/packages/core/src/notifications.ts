import { buildIcs } from "./ics.js";
import type { CoreHooks, OrderPaidContext } from "./hooks.js";
import { buildIcs as _buildIcsAlias } from "./ics.js";
void _buildIcsAlias;

export interface EmailAttachment {
  filename: string;
  contentType: string;
  /** UTF-8 text or base64; see `encoding`. */
  content: string;
  encoding?: "utf8" | "base64" | undefined;
}
export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string | undefined;
  attachments?: EmailAttachment[] | undefined;
  /** Correlation for audit and dedupe, e.g. `seat:${seatId}:confirmation`. */
  key: string;
}
export interface Notifier {
  readonly provider: string;
  send(message: EmailMessage): Promise<void>;
}

export class InMemoryNotifier implements Notifier {
  readonly provider = "memory";
  readonly sent: EmailMessage[] = [];
  async send(m: EmailMessage) { this.sent.push(m); }
}
export class ConsoleNotifier implements Notifier {
  readonly provider = "console";
  async send(m: EmailMessage) {
    console.log(`[email] to=${m.to} subject=${JSON.stringify(m.subject)} key=${m.key} attachments=${m.attachments?.map((a) => a.filename).join(",") ?? "-"}`);
  }
}

export interface ConfirmationOptions {
  fromName: string;
  replyTo?: string | undefined;
  /** Public URL serving the seat's .ics, so the email can link it as well as attach it. */
  calendarUrl?: ((seatId: string) => string) | undefined;
  /** Course page or joining-instructions URL. */
  pageUrl?: ((ctx: OrderPaidContext) => string | undefined) | undefined;
  now?: (() => Date) | undefined;
}

/**
 * The branded "ticket" email per seat, with the cohort's sessions attached
 * as an .ics. Replaces the hand-built Fluent Forms confirmation.
 */
export function confirmationHook(notifier: Notifier, opts: ConfirmationOptions): CoreHooks {
  return {
    orderPaid: async (ctx) => {
      const { organization, order, event, course, seats } = ctx;
      const dates = formatRange(event.startsAt, event.endsAt ?? event.startsAt, event.timezone);
      const sessionsText = event.sessions.length
        ? event.sessions.map((s, i) => `  ${s.title ?? `Day ${i + 1}`}: ${formatRange(s.startsAt, s.endsAt, event.timezone)}`).join("\n")
        : `  ${dates}`;
      const title = course ? course.name : event.name;
      const url = opts.pageUrl?.(ctx);
      const sentTo = new Set<string>();

      for (const seat of seats) {
        const to = seat.attendee.email.toLowerCase();
        if (sentTo.has(to)) continue;
        sentTo.add(to);
        const mine = seats.filter((s) => s.attendee.email.toLowerCase() === to);
        const ics = buildIcs({
          uid: `seat-${seat.id}`,
          summary: title,
          description: `${event.name}\nOrganizer: ${organization.name}\nOrder: ${order.id}`,
          url, location: event.format === "in_person" ? undefined : "Online (joining link to follow)",
          attendeeEmail: to,
          sessions: event.sessions,
          fallback: { startsAt: event.startsAt, endsAt: event.endsAt ?? event.startsAt },
          now: opts.now?.(),
        });
        const name = seat.attendee.name ? seat.attendee.name.split(" ")[0] : undefined;
        const text = [
          `Hi${name ? ` ${name}` : ""},`,
          ``,
          `You're confirmed for ${title}${course ? ` — ${event.name}` : ""}.`,
          ``,
          `Schedule (${event.timezone}):`,
          sessionsText,
          ``,
          `Format: ${formatLabel(event.format)}`,
          `Seats on this order for you: ${mine.length}`,
          `Order: ${order.id}`,
          ...(opts.calendarUrl ? [``, `Add to calendar: ${opts.calendarUrl(seat.id)}`] : []),
          ...(url ? [`Course page: ${url}`] : []),
          ``,
          `The calendar invite is attached. Joining instructions and pre-work follow closer to the date.`,
          ``,
          `— ${organization.name}`,
        ].join("\n");
        await notifier.send({
          key: `seat:${seat.id}:confirmation`,
          to,
          subject: `You're confirmed — ${title} · ${dates}`,
          text,
          html: ticketHtml({ org: organization.name, fromName: opts.fromName, title, cohort: event.name, name, sessionsText, format: formatLabel(event.format), orderId: order.id, seats: mine.length, calendarUrl: opts.calendarUrl?.(seat.id), url, timezone: event.timezone }),
          replyTo: opts.replyTo,
          attachments: [{ filename: "cohort.ics", contentType: "text/calendar; charset=utf-8; method=PUBLISH", content: ics, encoding: "utf8" }],
        });
      }

      // Buyer who is not attending gets a receipt-style summary.
      const buyer = order.buyerEmail.toLowerCase();
      if (!sentTo.has(buyer)) {
        await notifier.send({
          key: `order:${order.id}:buyer-summary`,
          to: buyer,
          subject: `Registration confirmed — ${title} · ${seats.length} seat${seats.length === 1 ? "" : "s"}`,
          text: [`Thanks for your order ${order.id}.`, ``, `${title} — ${event.name}`, `Schedule (${event.timezone}):`, sessionsText, ``, `Attendees:`, ...seats.map((s) => `  - ${s.attendee.name ? `${s.attendee.name} <${s.attendee.email}>` : s.attendee.email}`), ``, `Total charged: ${money(order.pricing.totalMinor, order.currency)}`, ``, `— ${organization.name}`].join("\n"),
          html: `<p>Thanks for your order <strong>${esc(order.id)}</strong>.</p><p><strong>${esc(title)}</strong> — ${esc(event.name)}</p><pre>${esc(sessionsText)}</pre><p>Attendees:</p><ul>${seats.map((s) => `<li>${esc(s.attendee.name ? `${s.attendee.name} <${s.attendee.email}>` : s.attendee.email)}</li>`).join("")}</ul><p>Total charged: ${money(order.pricing.totalMinor, order.currency)}</p><p>— ${esc(organization.name)}</p>`,
          replyTo: opts.replyTo,
        });
      }
    },
  };
}

export function formatLabel(format: string): string {
  return { live_virtual: "Live virtual", in_person: "In person", hybrid: "Hybrid", self_paced: "Self-paced" }[format] ?? format;
}
export function formatRange(start: Date, end: Date, timeZone: string): string {
  const d = new Intl.DateTimeFormat("en-CA", { timeZone, dateStyle: "medium" });
  const t = new Intl.DateTimeFormat("en-CA", { timeZone, timeStyle: "short" });
  const sameDay = d.format(start) === d.format(end);
  return sameDay ? `${d.format(start)} ${t.format(start)}–${t.format(end)}` : `${d.format(start)} ${t.format(start)} – ${d.format(end)} ${t.format(end)}`;
}
export function money(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency }).format(minor / 100);
}
function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function ticketHtml(i: { org: string; fromName: string; title: string; cohort: string; name?: string | undefined; sessionsText: string; format: string; orderId: string; seats: number; calendarUrl?: string | undefined; url?: string | undefined; timezone: string }): string {
  return `<!doctype html><html><body style="margin:0;background:#eef2f4;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
<tr><td style="background:#053947;padding:26px 30px"><span style="color:#fbbf24;font-size:12px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase">${esc(i.org)}</span><br><span style="color:#fff;font-size:22px;font-weight:bold">Registration confirmed</span></td></tr>
<tr><td style="padding:24px 30px 8px;color:#0f172a;font-size:16px">Hi${i.name ? ` ${esc(i.name)}` : ""},<p style="color:#475569;font-size:14px;line-height:1.6">Your seat for <strong>${esc(i.title)}</strong> is confirmed.</p></td></tr>
<tr><td style="padding:8px 30px"><table role="presentation" width="100%" style="border:2px dashed #0170B9;border-radius:12px"><tr><td style="padding:18px 22px;font-size:14px;color:#0f172a">
<div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Cohort</div><div style="font-weight:bold;margin-bottom:10px">${esc(i.cohort)}</div>
<div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Schedule (${esc(i.timezone)})</div><pre style="margin:0 0 10px;font-family:inherit;white-space:pre-wrap">${esc(i.sessionsText)}</pre>
<div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Format</div><div style="margin-bottom:10px">${esc(i.format)}</div>
<div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">Order</div><div>${esc(i.orderId)} · ${i.seats} seat${i.seats === 1 ? "" : "s"}</div>
</td></tr></table></td></tr>
<tr><td style="padding:16px 30px 28px;font-size:14px;color:#475569;line-height:1.6">${i.calendarUrl ? `<a href="${esc(i.calendarUrl)}" style="display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:12px 22px;border-radius:8px;text-decoration:none">Add to calendar</a><br><br>` : ""}The calendar invite is attached. Joining instructions and pre-work follow closer to the date.${i.url ? `<br><a href="${esc(i.url)}">Course page</a>` : ""}<br><br>— ${esc(i.fromName)}</td></tr>
</table></td></tr></table></body></html>`;
}

export interface SelfServiceMailOptions {
  fromName: string;
  replyTo?: string | undefined;
  /** URL where an offered learner can claim the seat, e.g. the course page with ?gate_waitlist=<id>. */
  claimUrl: (ctx: { entryId: string; eventId: string; courseSlug?: string | undefined }) => string;
  /** Learner portal URL for a seat. */
  seatUrl?: ((seatId: string, email: string) => string) | undefined;
  getCourseSlug?: ((eventId: string) => Promise<string | undefined>) | undefined;
}

/** Emails for waitlist offers and seat changes (transfer, substitution, cancellation). */
export function selfServiceHooks(notifier: Notifier, opts: SelfServiceMailOptions): CoreHooks {
  return {
    waitlistOffered: async ({ entry, event }) => {
      const slug = opts.getCourseSlug ? await opts.getCourseSlug(event.id) : undefined;
      const url = opts.claimUrl({ entryId: entry.id, eventId: event.id, courseSlug: slug });
      const until = entry.offerExpiresAt ? formatRange(entry.offerExpiresAt, entry.offerExpiresAt, event.timezone).split(" ").slice(0, 4).join(" ") : "soon";
      await notifier.send({
        key: `waitlist:${entry.id}:offer`,
        to: entry.email,
        subject: `A seat opened up — ${event.name}`,
        text: `Good news${entry.name ? ` ${entry.name.split(" ")[0]}` : ""}: ${entry.quantity > 1 ? `${entry.quantity} seats are` : "a seat is"} now held for you on ${event.name}.\n\nClaim it here before ${until}: ${url}\n\nAfter that the seat goes to the next person on the list.\n\n— ${opts.fromName}`,
        html: `<p>Good news${entry.name ? ` ${esc(entry.name.split(" ")[0] ?? "")}` : ""}: ${entry.quantity > 1 ? `${entry.quantity} seats are` : "a seat is"} now held for you on <strong>${esc(event.name)}</strong>.</p><p><a href="${esc(url)}" style="display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:12px 22px;border-radius:8px;text-decoration:none">Claim your seat</a></p><p>The hold expires ${esc(until)}; after that the seat goes to the next person on the list.</p><p>— ${esc(opts.fromName)}</p>`,
        replyTo: opts.replyTo,
      });
    },
    seatChanged: async (ctx) => {
      if (ctx.kind === "substituted") {
        const link = opts.seatUrl?.(ctx.seat.id, ctx.seat.attendee.email);
        await notifier.send({
          key: `seat:${ctx.seat.id}:substituted:${ctx.seat.substitutions?.length ?? 0}`, to: ctx.seat.attendee.email, replyTo: opts.replyTo,
          subject: `Your seat is confirmed (transferred from ${ctx.previousAttendee.name ?? ctx.previousAttendee.email})`,
          text: `Hi${ctx.seat.attendee.name ? ` ${ctx.seat.attendee.name.split(" ")[0]}` : ""}, ${ctx.previousAttendee.name ?? ctx.previousAttendee.email} has passed their seat to you.${link ? ` Manage it here: ${link}` : ""}\n\n— ${opts.fromName}`,
          html: `<p>Hi${ctx.seat.attendee.name ? ` ${esc(ctx.seat.attendee.name.split(" ")[0] ?? "")}` : ""}, ${esc(ctx.previousAttendee.name ?? ctx.previousAttendee.email)} has passed their seat to you.${link ? ` <a href="${esc(link)}">Manage your registration</a>.` : ""}</p><p>— ${esc(opts.fromName)}</p>`,
        });
      } else if (ctx.kind === "transferred") {
        const link = opts.seatUrl?.(ctx.seat.id, ctx.seat.attendee.email);
        await notifier.send({
          key: `seat:${ctx.seat.id}:transferred`, to: ctx.seat.attendee.email, replyTo: opts.replyTo,
          subject: `Your registration moved to a new cohort`,
          text: `Your seat has been moved to a new cohort. A fresh calendar invite follows.${link ? ` Details: ${link}` : ""}\n\n— ${opts.fromName}`,
          html: `<p>Your seat has been moved to a new cohort. A fresh calendar invite follows.${link ? ` <a href="${esc(link)}">Details</a>.` : ""}</p><p>— ${esc(opts.fromName)}</p>`,
        });
      } else {
        const refund = ctx.refund ? ` A refund of ${money(ctx.refund.amountMinor, "CAD").replace("CA$", "")} (in your order currency) is on its way.` : " Per the cancellation policy no refund applies.";
        await notifier.send({
          key: `seat:${ctx.seat.id}:cancelled`, to: ctx.seat.attendee.email, replyTo: opts.replyTo,
          subject: `Your registration was cancelled`,
          text: `Your seat has been cancelled.${refund}\n\n— ${opts.fromName}`,
          html: `<p>Your seat has been cancelled.${esc(refund)}</p><p>— ${esc(opts.fromName)}</p>`,
        });
      }
    },
  };
}

export interface SequenceMailOptions {
  fromName: string;
  replyTo?: string | undefined;
  seatUrl?: ((seatId: string, email: string) => string) | undefined;
  certificateUrl: (verifyCode: string) => string;
}

/** The pre-class / day-of / survey / certificate emails driven by the sequence scheduler and certificate issuance. */
export function sequenceHooks(notifier: Notifier, opts: SequenceMailOptions): CoreHooks {
  const sign = `— ${opts.fromName}`;
  return {
    sequenceStep: async ({ step, seat, event, course, organization }) => {
      const title = course?.name ?? event.name;
      const first = seat.attendee.name?.split(" ")[0];
      const hi = `Hi${first ? ` ${first}` : ""},`;
      const when = formatRange(event.startsAt, event.endsAt ?? event.startsAt, event.timezone);
      const join = event.meeting ? `Join link: ${event.meeting.joinUrl}${event.meeting.passcode ? ` (passcode ${event.meeting.passcode})` : ""}` : "The joining link will be sent before class.";
      const manage = opts.seatUrl ? `Manage your registration: ${opts.seatUrl(seat.id, seat.attendee.email)}` : "";
      const send = (subject: string, body: string[]) => notifier.send({
        key: `seq:${step}:${seat.id}`, to: seat.attendee.email, replyTo: opts.replyTo, subject,
        text: [hi, "", ...body, "", manage, "", sign].filter((l) => l !== undefined).join("\n"),
        html: `<p>${esc(hi)}</p>${body.map((l) => `<p>${esc(l)}</p>`).join("")}${manage ? `<p>${esc(manage)}</p>` : ""}<p>${esc(sign)}</p>`,
      });
      switch (step) {
        case "prework_t14":
          return send(`Pre-work for ${title} (${when})`, [`Your cohort starts ${when} (${event.timezone}). Here is what to prepare:`, course?.prework ?? ""]);
        case "reminder_t7":
          return send(`One week to go — ${title}`, [`${title} starts ${when} (${event.timezone}).`, join, `Please block the full sessions in your calendar; certification requires attendance.`]);
        case "reminder_t1":
          return send(`Tomorrow: ${title}`, [`${title} starts ${when} (${event.timezone}).`, join, `Test your audio and camera today; have your pre-work handy.`]);
        case "day_of":
          return send(`Today: ${title} — your join link`, [`We start at ${new Intl.DateTimeFormat("en-CA", { timeZone: event.timezone, timeStyle: "short" }).format(event.startsAt)} (${event.timezone}).`, join]);
        case "survey":
          return send(`How was ${title}?`, [`Thank you for attending ${organization.name}'s ${title}. Two minutes of feedback helps the next cohort:`, course?.surveyUrl ?? ""]);
        case "certificate":
          return; // handled by certificateIssued
      }
    },
    certificateIssued: async ({ certificate, seat, course }) => {
      const url = opts.certificateUrl(certificate.verifyCode);
      await notifier.send({
        key: `certificate:${certificate.id}`, to: seat.attendee.email, replyTo: opts.replyTo,
        subject: `Your certificate of completion — ${course?.name ?? certificate.courseName}`,
        text: `Congratulations ${certificate.attendeeName}. Your certificate of completion for ${certificate.courseName} is ready: ${url}\n\nShare the link; anyone can verify it.\n\n${sign}`,
        html: `<p>Congratulations ${esc(certificate.attendeeName)}. Your certificate of completion for <strong>${esc(certificate.courseName)}</strong> is ready.</p><p><a href="${esc(url)}" style="display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:12px 22px;border-radius:8px;text-decoration:none">View certificate</a></p><p>Share the link; anyone can verify it.</p><p>${esc(sign)}</p>`,
      });
    },
  };
}
