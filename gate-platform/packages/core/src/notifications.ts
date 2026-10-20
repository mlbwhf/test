import { buildIcs, buildInvite } from "./ics.js";
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
  /** printBody: development only; bodies carry sign-in links and personal data. */
  constructor(private readonly opts: { printBody?: boolean } = {}) {}
  async send(m: EmailMessage) {
    console.log(`[email] to=${m.to} subject=${JSON.stringify(m.subject)} key=${m.key} attachments=${m.attachments?.map((a) => a.filename).join(",") ?? "-"}`);
    if (this.opts.printBody) console.log(`[email body]\n${m.text}\n[/email body]`);
  }
}

export interface ConfirmationOptions {
  fromName: string;
  replyTo?: string | undefined;
  /** Public URL serving the seat's .ics, so the email can link it as well as attach it. */
  calendarUrl?: ((seatId: string) => string) | undefined;
  /** Course page or joining-instructions URL. */
  pageUrl?: ((ctx: OrderPaidContext) => string | undefined) | undefined;
  /** The attendee's ticket: page link, hosted QR image and door code. */
  ticket?: ((seatId: string) => { url: string; qrUrl: string; code: string }) | undefined;
  /** Seat self-service page (cancel, transfer, substitute). */
  manageUrl?: ((seatId: string, email: string) => string) | undefined;
  /**
   * Who the calendar invitation is from. With an organizer the attachment is a real
   * invitation (mail apps add it to the calendar); without one it is an importable file.
   */
  organizer?: ((ctx: OrderPaidContext) => { name: string; email: string } | undefined) | undefined;
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
        const ticket = opts.ticket?.(seat.id);
        const organizer = opts.organizer?.(ctx);
        const invite = buildInvite({
          uid: `seat-${seat.id}`,
          summary: title,
          description: [event.name, `Organizer: ${organization.name}`, `Order: ${order.id}`, ...(ticket ? [`Ticket: ${ticket.url}`] : [])].join("\n"),
          url: ticket?.url ?? url, location: event.format === "in_person" ? undefined : "Online (joining link to follow)",
          organizer, attendeeEmail: to, attendeeName: seat.attendee.name,
          sessions: event.sessions,
          fallback: { startsAt: event.startsAt, endsAt: event.endsAt ?? event.startsAt },
          now: opts.now?.(),
        });
        const name = seat.attendee.name ? seat.attendee.name.split(" ")[0] : undefined;
        const manage = opts.manageUrl?.(seat.id, seat.attendee.email);
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
          ...(ticket ? [``, `Your ticket: ${ticket.url}`, `Check-in code: ${ticket.code}`] : []),
          ...(opts.calendarUrl ? [``, `Add to calendar: ${opts.calendarUrl(seat.id)}`] : []),
          ...(manage ? [`Change or cancel: ${manage}`] : []),
          ...(url ? [`Course page: ${url}`] : []),
          ``,
          `${invite.method === "REQUEST" ? "The calendar invitation is attached." : "The calendar file is attached."} Joining instructions and pre-work follow closer to the date.`,
          ``,
          `— ${organization.name}`,
        ].join("\n");
        await notifier.send({
          key: `seat:${seat.id}:confirmation`,
          to,
          subject: `You're confirmed — ${title} · ${dates}`,
          text,
          html: ticketHtml({ org: organization.name, fromName: opts.fromName, title, cohort: event.name, name, sessionsText, format: formatLabel(event.format), durationDays: course?.durationDays, orderId: order.id, seats: mine.length, calendarUrl: opts.calendarUrl?.(seat.id), url, timezone: event.timezone, attendee: seat.attendee.name ?? seat.attendee.email, ticket, manage, dates }),
          replyTo: opts.replyTo,
          attachments: [{ filename: invite.method === "REQUEST" ? "invite.ics" : "cohort.ics", contentType: `text/calendar; charset=utf-8; method=${invite.method}`, content: invite.ics, encoding: "utf8" }],
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
// Branded ticket email, after the ticket design: navy header, details, perforation, QR.
// Table layout and inline styles only, since that is what mail clients render.
const INK = "#14213d", PAPER = "#f7f6f2", SAND = "#eeebe2", GREEN = "#3fcb7e", GREEN_TEXT = "#2f7a52", CARD = "#fdfdfb";
const MONO = "'IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace";
const SANS = "'Instrument Sans',Helvetica,Arial,sans-serif";
const DISPLAY = "'Bricolage Grotesque','Instrument Sans',Helvetica,Arial,sans-serif";
function ticketHtml(i: { org: string; fromName: string; title: string; cohort: string; name?: string | undefined; sessionsText: string; format: string; durationDays?: number | undefined; orderId: string; seats: number; calendarUrl?: string | undefined; url?: string | undefined; timezone: string; attendee: string; ticket?: { url: string; qrUrl: string; code: string } | undefined; manage?: string | undefined; dates: string }): string {
  const label = (t: string) => `<div style="font-family:${MONO};font-size:11px;letter-spacing:.06em;color:#6b7280;text-transform:uppercase">${esc(t)}</div>`;
  const cell = (l: string, v: string) => `<td valign="top" width="50%" style="padding:0 8px 16px 0">${label(l)}<div style="font-family:${SANS};font-weight:600;font-size:15px;color:${INK};margin-top:3px">${v}</div></td>`;
  const eyebrow = [i.format.toUpperCase(), i.durationDays ? `${i.durationDays} DAY${i.durationDays === 1 ? "" : "S"}` : ""].filter(Boolean).join(" · ");
  const btn = (href: string, text: string, primary: boolean) => `<a href="${esc(href)}" style="display:inline-block;padding:13px 22px;border-radius:999px;font-family:${SANS};font-weight:600;font-size:15px;text-decoration:none;${primary ? `background:${GREEN};color:${INK}` : `border:1.5px solid ${INK};color:${INK}`}">${esc(text)}</a>`;
  return `<!doctype html><html><body style="margin:0;background:${SAND}">
<div style="display:none;max-height:0;overflow:hidden">You're confirmed for ${esc(i.title)}, ${esc(i.dates)}. Your ticket and calendar invite are inside.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SAND};padding:28px 12px"><tr><td align="center">
<table role="presentation" width="440" cellpadding="0" cellspacing="0" style="max-width:440px;width:100%">
<tr><td style="padding:0 4px 14px;font-family:${SANS};font-size:15px;color:${INK}">Hi${i.name ? ` ${esc(i.name)}` : ""}, you're confirmed. Show this ticket at check-in.</td></tr>
<tr><td style="background:${INK};border-radius:24px 24px 0 0;padding:24px 26px 28px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="font-family:${DISPLAY};font-weight:800;font-size:16px;letter-spacing:-.03em;color:${PAPER}"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${PAPER}"></span><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${PAPER};margin-left:2px"></span><br><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${PAPER}"></span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${GREEN};margin-left:2px"></span> &nbsp;enrollclass</td>
    <td align="right"><span style="font-family:${MONO};font-size:11px;padding:5px 12px;border-radius:999px;background:${GREEN};color:${INK}">VALID</span></td>
  </tr></table>
  <div style="font-family:${MONO};font-size:12px;letter-spacing:.08em;color:#7fdcaa;margin-top:20px">${esc(eyebrow)}</div>
  <div style="font-family:${DISPLAY};font-weight:800;font-size:28px;line-height:1.05;letter-spacing:-.035em;color:${PAPER};margin-top:8px">${esc(i.title)}</div>
</td></tr>
<tr><td style="background:${CARD};padding:22px 26px 6px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>${cell("Attendee", esc(i.attendee))}${cell("Ticket", `${i.seats} seat${i.seats === 1 ? "" : "s"}`)}</tr>
    <tr>${cell("Cohort", esc(i.cohort))}${cell("Order", `<span style="font-family:${MONO};font-size:13px">${esc(i.orderId)}</span>`)}</tr>
    <tr><td colspan="2" style="padding:0 0 16px">${label(`Schedule (${i.timezone})`)}<div style="font-family:${SANS};font-size:14px;color:${INK};margin-top:3px;white-space:pre-line">${esc(i.sessionsText.replace(/^ +/gm, ""))}</div></td></tr>
    <tr><td colspan="2" style="padding:0 0 16px">${label("Hosted by")}<div style="font-family:${SANS};font-weight:600;font-size:15px;color:${INK};margin-top:3px">${esc(i.org)}</div></td></tr>
  </table>
</td></tr>
<tr><td style="background:${CARD};padding:0 22px"><div style="border-top:2px dashed #c9ccd4;height:0;line-height:0;font-size:0">&nbsp;</div></td></tr>
${i.ticket ? `<tr><td align="center" style="background:${CARD};padding:26px 26px 8px">
  <a href="${esc(i.ticket.url)}" style="display:inline-block;padding:12px;border:2px solid ${INK};border-radius:20px;background:#ffffff"><img src="${esc(i.ticket.qrUrl)}" width="200" height="200" alt="Check-in QR code" style="display:block;width:200px;height:200px;border:0"></a>
  <div style="font-family:${MONO};font-size:15px;letter-spacing:.12em;color:${INK};margin-top:14px">${esc(i.ticket.code)}</div>
  <div style="font-family:${SANS};font-size:13px;color:#6b7280;margin-top:4px">Scan at the door, or read out the code.</div>
</td></tr>` : ""}
<tr><td align="center" style="background:${CARD};border-radius:0 0 24px 24px;padding:18px 26px 26px">
  ${i.ticket ? btn(i.ticket.url, "Open ticket", true) : ""}${i.calendarUrl ? ` &nbsp; ${btn(i.calendarUrl, "Add to calendar", !i.ticket)}` : ""}
</td></tr>
<tr><td style="padding:18px 6px 0;font-family:${SANS};font-size:13px;line-height:1.55;color:#4b5563">
  The calendar invitation is attached. Joining instructions and pre-work follow closer to the date.${i.manage ? `<br><a href="${esc(i.manage)}" style="color:${GREEN_TEXT}">Change attendee, move date or cancel</a>` : ""}${i.url ? ` · <a href="${esc(i.url)}" style="color:${GREEN_TEXT}">Course page</a>` : ""}
  <br><br>${esc(i.fromName)}
  <div style="margin-top:18px;font-family:${MONO};font-size:11px;color:#9ca3af">Registration and payment by EnrollClass on behalf of ${esc(i.org)}. Your payment is held until the course is delivered.</div>
</td></tr>
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
        subject: `Your certificate of ${certificate.kind === "attendance" ? "attendance" : "completion"} — ${course?.name ?? certificate.courseName}`,
        text: `Congratulations ${certificate.attendeeName}. Your certificate of ${certificate.kind === "attendance" ? "attendance" : "completion"} for ${certificate.courseName} is ready: ${url}\n\nShare the link or add it to LinkedIn from that page; anyone can verify it.${course?.badge ? `\n\nYou also earn the "${course.badge.name}" digital badge: ${course.badge.url}` : ""}\n\n${sign}`,
        html: `<p>Congratulations ${esc(certificate.attendeeName)}. Your certificate of completion for <strong>${esc(certificate.courseName)}</strong> is ready.</p><p><a href="${esc(url)}" style="display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:12px 22px;border-radius:8px;text-decoration:none">View certificate</a></p><p>Share the link; anyone can verify it.</p><p>${esc(sign)}</p>`,
      });
    },
  };
}

/** Organizer alerts for cohorts below minimum enrolment, and learner notices when a cohort is cancelled. */
export function cohortHooks(notifier: Notifier, opts: { fromName: string; organizerEmail: (organizationId: string) => Promise<string | undefined>; seatUrl?: ((seatId: string, email: string) => string) | undefined; listSeats: (eventId: string) => Promise<Array<{ id: string; attendee: { email: string; name?: string | undefined }; status: string }>> }): CoreHooks {
  return {
    cohortAtRisk: async ({ event, organization, confirmed, minimum }) => {
      const to = await opts.organizerEmail(organization.id);
      if (!to) return;
      const when = formatRange(event.startsAt, event.endsAt ?? event.startsAt, event.timezone);
      await notifier.send({
        key: `cohort:${event.id}:at-risk`, to,
        subject: `Cohort below minimum: ${event.name} (${confirmed}/${minimum})`,
        text: `${event.name} starts ${when} (${event.timezone}) with ${confirmed} of ${minimum} seats confirmed.\n\nDecide now: run it anyway, cancel it (every learner is refunded in full automatically), or move learners to another cohort from the dashboard.\n\n— ${opts.fromName}`,
        html: `<p><strong>${esc(event.name)}</strong> starts ${esc(when)} (${esc(event.timezone)}) with <strong>${confirmed} of ${minimum}</strong> seats confirmed.</p><p>Decide now: run it anyway, cancel it (every learner is refunded in full automatically), or move learners to another cohort from the dashboard.</p><p>— ${esc(opts.fromName)}</p>`,
      });
    },
    cohortCancelled: async ({ event, organization, target }) => {
      // Learners were already refunded or moved by the time this fires; tell each of them.
      const seats = await opts.listSeats(event.id);
      const seen = new Set<string>();
      for (const seat of seats) {
        const to = seat.attendee.email.toLowerCase();
        if (seen.has(to) || (seat.status !== "cancelled" && seat.status !== "transferred")) continue;
        seen.add(to);
        const moved = seat.status === "transferred" && target;
        await notifier.send({
          key: `cohort:${event.id}:cancelled:${seat.id}`, to,
          subject: moved ? `Your cohort moved: now ${target!.name}` : `Cohort cancelled: ${event.name}`,
          text: moved
            ? `${event.name} will not run. Your seat has been moved to ${target!.name} (${formatRange(target!.startsAt, target!.endsAt ?? target!.startsAt, target!.timezone)} ${target!.timezone}). A new calendar invite follows.\n\n— ${organization.name}`
            : `${event.name} will not run (${event.cancelReason ?? "cancelled by the organizer"}). Your payment has been refunded in full to the original payment method.\n\n— ${organization.name}`,
          html: moved
            ? `<p><strong>${esc(event.name)}</strong> will not run. Your seat has been moved to <strong>${esc(target!.name)}</strong> (${esc(formatRange(target!.startsAt, target!.endsAt ?? target!.startsAt, target!.timezone))} ${esc(target!.timezone)}). A new calendar invite follows.</p><p>— ${esc(organization.name)}</p>`
            : `<p><strong>${esc(event.name)}</strong> will not run (${esc(event.cancelReason ?? "cancelled by the organizer")}). Your payment has been refunded in full to the original payment method.</p><p>— ${esc(organization.name)}</p>`,
        });
      }
    },
  };
}
