import { activePayments, type Core } from "./services.js";
import type { Course, Event, Order, TicketType } from "./types.js";

// The organizer's "Today" screen: what needs doing, what is running, what is next.
// Everything is derived from orders, seats and cohorts at read time; nothing here is
// stored separately, so the numbers can't drift from the ledger.

export type AttentionKind = "approval" | "payments_setup" | "release_ready" | "low_enrolment" | "unpaid_invoices" | "missing_prework" | "no_tickets";

export interface AttentionItem {
  /** Stable per situation, so a dismissal sticks until the situation changes. */
  id: string;
  kind: AttentionKind;
  tone: "green" | "amber" | "red";
  title: string;
  detail: string;
  action: { label: string; kind: "link"; href: string } | { label: string; kind: "release"; eventId: string } | { label: string; kind: "stripe" };
}

export interface CohortLine {
  eventId: string;
  name: string;
  courseName: string | null;
  startsAt: Date;
  endsAt: Date | null;
  timezone: string;
  format: Event["format"];
  sold: number;
  capacity: number;
}

export interface HomeSummary {
  money: null | Array<{ currency: string; grossMinor: number; netMinor: number; feesMinor: number; heldMinor: number; paidOrders: number }>;
  attention: AttentionItem[];
  live: (CohortLine & { day: number; days: number; confirmed: number; checkedIn: number }) | null;
  week: CohortLine[];
  setup: { done: number; total: number; steps: Array<{ key: "account" | "payments" | "course" | "cohort" | "registration"; done: boolean }> };
}

const DAY = 86_400_000;

export interface EventLine extends CohortLine {
  status: Event["status"];
  minEnrollment: number | null;
  /** Every ticket costs nothing: no payment, no fees, no Stripe needed. */
  free: boolean;
}

const isFreeTicket = (t: TicketType) => t.priceMinor === 0 && Object.values(t.prices ?? {}).every((v) => v === 0);

/** One row per cohort with seats sold and capacity, for lists. Pass events/courses when already loaded. */
export async function eventLines(core: Core, organizationId: string, events?: Event[], courses?: Course[]): Promise<EventLine[]> {
  const evs = events ?? (await core.repos.events.listByOrganization(organizationId));
  const cs = courses ?? (await core.repos.courses.listByOrganization(organizationId));
  const courseName = new Map(cs.map((c) => [c.id, c.name]));
  return Promise.all(
    evs.map(async (e) => {
      const tts = await core.repos.ticketTypes.listByEvent(e.id);
      return {
        eventId: e.id, name: e.name, courseName: e.courseId ? courseName.get(e.courseId) ?? null : null, startsAt: e.startsAt, endsAt: e.endsAt ?? null,
        timezone: e.timezone, format: e.format, sold: tts.reduce((a, t) => a + t.sold, 0), capacity: tts.reduce((a, t) => a + t.quantity, 0),
        status: e.status, minEnrollment: e.minEnrollment ?? null, free: tts.length > 0 && tts.every(isFreeTicket),
      };
    }),
  );
}

export interface EventOverview {
  line: EventLine;
  sessions: Array<{ startsAt: Date; endsAt: Date }>;
  /** Confirmed seats. `payment` is null for roles without money access. */
  attendees: Array<{ seatId: string; name: string | null; email: string; checkedIn: boolean; payment: "paid" | "invoice" | "pending" | null; certificate: { code: string; kind: "attendance" | "completion" } | null }>;
  money: { currency: string; grossMinor: number; netMinor: number; heldMinor: number } | null;
  course: { id: string; name: string; slug: string; prework: boolean; survey: boolean } | null;
  instructors: Array<{ id: string; name: string }>;
}

/** Everything the Events detail pane shows for one cohort. */
export async function eventOverview(core: Core, organizationId: string, eventId: string, opts: { money: boolean }): Promise<EventOverview> {
  const event = await core.getEvent(organizationId, eventId);
  const course = event.courseId ? await core.repos.courses.get(event.courseId) : undefined;
  const [line] = await eventLines(core, organizationId, [event], course ? [course] : []);
  const seats = (await core.repos.seats.listByEvent(event.id)).filter((s) => s.status === "confirmed");
  const orders = opts.money ? (await core.repos.orders.listByOrganization(organizationId, 100_000)).filter((o) => o.eventId === event.id) : [];
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const paid = orders.filter((o) => PAID.includes(o.status));
  const certBySeat = new Map((await core.repos.certificates.listByEvent(event.id)).filter((c) => !c.revokedAt).map((c) => [c.seatId, c]));
  return {
    line: line!,
    sessions: event.sessions.length ? event.sessions.map((s) => ({ startsAt: s.startsAt, endsAt: s.endsAt })) : [{ startsAt: event.startsAt, endsAt: event.endsAt ?? event.startsAt }],
    attendees: seats
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((s) => {
        const o = orderById.get(s.orderId);
        const payment = !opts.money ? null : o && PAID.includes(o.status) ? "paid" : o?.paymentMethod === "invoice" ? "invoice" : "pending";
        const cert = certBySeat.get(s.id);
        return { seatId: s.id, name: s.attendee.name ?? null, email: s.attendee.email, checkedIn: Boolean(s.checkedInAt), payment, certificate: cert ? { code: cert.verifyCode, kind: cert.kind ?? "completion" } : null };
      }),
    money: opts.money
      ? {
          currency: event.currency,
          grossMinor: paid.reduce((a, o) => a + o.pricing.totalMinor - o.refundedMinor, 0),
          netMinor: paid.reduce((a, o) => a + o.pricing.organizerNetMinor, 0),
          heldMinor: paid.filter((o) => o.fundsStatus === "held").reduce((a, o) => a + o.pricing.organizerNetMinor, 0),
        }
      : null,
    course: course ? { id: course.id, name: course.name, slug: course.slug, prework: Boolean(course.prework), survey: Boolean(course.surveyUrl) } : null,
    instructors: (await Promise.all(event.instructorIds.map((id) => core.repos.parties.get(id)))).filter((p): p is NonNullable<typeof p> => Boolean(p)).map((p) => ({ id: p.id, name: p.name })),
  };
}
const PAID: Order["status"][] = ["paid", "partially_refunded"];

function dayKey(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function money(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: minor % 100 === 0 ? 0 : 2 }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}
function shortDate(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric" }).format(d);
}

export async function homeSummary(core: Core, organizationId: string, opts: { money: boolean; settings: boolean; now?: Date; eventFilter?: (e: Event) => boolean }): Promise<HomeSummary> {
  const now = opts.now ?? new Date();
  const org = await core.getOrganization(organizationId);
  const events = (await core.repos.events.listByOrganization(organizationId)).filter((e) => e.status !== "cancelled" && (!opts.eventFilter || opts.eventFilter(e)));
  const courses = await core.repos.courses.listByOrganization(organizationId);
  const courseById = new Map(courses.map((c) => [c.id, c]));

  const allLines = await eventLines(core, organizationId, events, courses);
  const lines = new Map(allLines.map((l) => [l.eventId, l as CohortLine]));
  // Free classes never touch Stripe, so an organizer who only runs free ones isn't blocked by it.
  // Classes without tickets yet don't count either way.
  const onlyFree = allLines.some((l) => l.free) && allLines.every((l) => l.free || l.capacity === 0);
  const live = events.filter((e) => e.status === "live");
  const attention: AttentionItem[] = [];

  // Payments first: nothing else matters if money can't flow.
  const pay = activePayments(org);
  if (opts.settings && !pay.status?.ready) {
    attention.push({
      id: `payments:${pay.mode}:${pay.accountRef ? "incomplete" : "none"}`, kind: "payments_setup", tone: onlyFree ? "amber" : "red",
      title: pay.accountRef ? "Finish your Stripe setup" : pay.mode === "direct" ? "Connect your Stripe account" : "Connect Stripe to get paid",
      detail: pay.status?.requirementsDue.length
        ? `Stripe still needs ${pay.status.requirementsDue.length} detail${pay.status.requirementsDue.length === 1 ? "" : "s"}`
        : onlyFree ? "Only needed for paid classes. Free classes work without it" : "Learners can't pay until it's connected",
      action: { label: pay.accountRef ? "Continue" : "Connect", kind: "stripe" },
    });
  }

  // Classes instructors created that wait for an owner or admin to publish them.
  if (opts.settings) {
    for (const e of events.filter((x) => x.status === "draft")) {
      attention.push({ id: `approval:${e.id}`, kind: "approval", tone: "amber", title: `Approve · ${e.name}`, detail: `Draft for ${shortDate(e.startsAt, e.timezone)} · not on sale until published`, action: { label: "Review", kind: "link", href: `/events?sel=${encodeURIComponent(e.id)}` } });
    }
  }

  let moneyOut: HomeSummary["money"] = null;
  let anyPaid = false;
  if (opts.money) {
    const orders = await core.repos.orders.listByOrganization(organizationId, 100_000);
    const byCcy = new Map<string, { currency: string; grossMinor: number; netMinor: number; feesMinor: number; heldMinor: number; paidOrders: number }>();
    const heldByEvent = new Map<string, number>();
    for (const o of orders) {
      const t = byCcy.get(o.currency) ?? { currency: o.currency, grossMinor: 0, netMinor: 0, feesMinor: 0, heldMinor: 0, paidOrders: 0 };
      if (PAID.includes(o.status)) {
        anyPaid = true;
        t.grossMinor += o.pricing.totalMinor - o.refundedMinor;
        t.netMinor += o.pricing.organizerNetMinor;
        t.feesMinor += o.pricing.platformFeeMinor + o.pricing.attendeeFeeMinor;
        t.paidOrders += 1;
      }
      if (o.fundsStatus === "held" && PAID.includes(o.status)) {
        t.heldMinor += o.pricing.organizerNetMinor;
        heldByEvent.set(o.eventId, (heldByEvent.get(o.eventId) ?? 0) + o.pricing.organizerNetMinor);
      }
      byCcy.set(o.currency, t);
    }
    moneyOut = [...byCcy.values()].sort((a, b) => (a.currency === org.currency ? -1 : b.currency === org.currency ? 1 : a.currency.localeCompare(b.currency)));
    if (moneyOut.length === 0) moneyOut = [{ currency: org.currency, grossMinor: 0, netMinor: 0, feesMinor: 0, heldMinor: 0, paidOrders: 0 }];

    // Delivered cohorts with money still held can be released now instead of waiting for the grace period.
    for (const e of events) {
      const held = heldByEvent.get(e.id) ?? 0;
      const end = e.endsAt ?? e.startsAt;
      if (held > 0 && end.getTime() <= now.getTime()) {
        attention.push({ id: `release:${e.id}`, kind: "release_ready", tone: "green", title: `Release funds · ${e.name}`, detail: `Delivered ${shortDate(end, e.timezone)} · ${money(held, e.currency)} held`, action: { label: "Release", kind: "release", eventId: e.id } });
      }
    }

    const invoices = await core.listInvoices(organizationId, { status: ["issued", "partially_paid"] });
    const soon = invoices.filter((i) => i.dueAt.getTime() <= now.getTime() + 7 * DAY);
    if (soon.length) {
      const overdue = soon.filter((i) => i.dueAt.getTime() < now.getTime()).length;
      const first = [...soon].sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())[0]!;
      const total = soon.filter((i) => i.currency === first.currency).reduce((a, i) => a + i.totalMinor - (i.payments ?? []).reduce((p, x) => p + x.amountMinor, 0), 0);
      attention.push({
        id: `invoices:${soon.map((i) => i.id).sort().join(",")}`, kind: "unpaid_invoices", tone: overdue ? "red" : "amber",
        title: `${soon.length} unpaid invoice${soon.length === 1 ? "" : "s"}${overdue ? ` · ${overdue} overdue` : ""}`,
        detail: `${overdue ? "Oldest due" : "Next due"} ${shortDate(first.dueAt, "UTC")} · ${money(total, first.currency)}`,
        action: { label: "Open", kind: "link", href: "/money" },
      });
    }
  } else {
    anyPaid = [...lines.values()].some((l) => l.sold > 0);
  }

  for (const e of live) {
    const line = lines.get(e.id)!;
    const daysOut = Math.ceil((e.startsAt.getTime() - now.getTime()) / DAY);
    if (daysOut < 0) continue;
    if (line.capacity === 0 && daysOut <= 60) {
      attention.push({ id: `tickets:${e.id}`, kind: "no_tickets", tone: "amber", title: `${e.name} has no tickets`, detail: `Starts in ${daysOut} day${daysOut === 1 ? "" : "s"} · nobody can register yet`, action: { label: "Add tickets", kind: "link", href: `/events/${encodeURIComponent(e.id)}` } });
      continue;
    }
    if (e.minEnrollment && line.sold < e.minEnrollment && daysOut <= Math.max(21, org.minEnrollmentDecisionDays)) {
      attention.push({ id: `low:${e.id}:${line.sold}`, kind: "low_enrolment", tone: "amber", title: `${e.name} is below minimum enrolment`, detail: `Starts in ${daysOut} day${daysOut === 1 ? "" : "s"} · ${line.sold} of ${e.minEnrollment} needed`, action: { label: "Review", kind: "link", href: `/events/${encodeURIComponent(e.id)}` } });
    }
    const course = e.courseId ? courseById.get(e.courseId) : undefined;
    if (course && !course.prework && daysOut <= 21 && line.sold > 0) {
      attention.push({ id: `prework:${course.id}`, kind: "missing_prework", tone: "amber", title: `Add pre-work for ${course.name}`, detail: daysOut > 14 ? `The pre-work email goes out 14 days before ${shortDate(e.startsAt, e.timezone)}` : `Starts ${shortDate(e.startsAt, e.timezone)} · learners have no pre-work yet`, action: { label: "Add", kind: "link", href: `/courses/${encodeURIComponent(course.id)}` } });
    }
  }
  const dedup = new Map(attention.map((a) => [a.id, a]));

  // Live today: a cohort with a session on today's date in its own time zone.
  let liveOut: HomeSummary["live"] = null;
  for (const e of live) {
    const today = dayKey(now, e.timezone);
    const sessions = e.sessions.length ? e.sessions : [{ startsAt: e.startsAt, endsAt: e.endsAt ?? e.startsAt }];
    const idx = sessions.findIndex((s) => dayKey(s.startsAt, e.timezone) === today);
    if (idx < 0) continue;
    const seats = (await core.repos.seats.listByEvent(e.id)).filter((s) => s.status === "confirmed");
    liveOut = { ...lines.get(e.id)!, day: idx + 1, days: sessions.length, confirmed: seats.length, checkedIn: seats.filter((s) => s.checkedInAt).length };
    break;
  }

  const week = live
    .filter((e) => e.startsAt.getTime() >= now.getTime() - DAY && e.startsAt.getTime() <= now.getTime() + 7 * DAY)
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .map((e) => lines.get(e.id)!);

  const steps: HomeSummary["setup"]["steps"] = [
    { key: "account", done: true },
    { key: "payments", done: Boolean(pay.status?.ready) || onlyFree },
    { key: "course", done: courses.length > 0 },
    { key: "cohort", done: events.length > 0 },
    { key: "registration", done: anyPaid },
  ];
  return { money: moneyOut, attention: [...dedup.values()], live: liveOut, week, setup: { done: steps.filter((s) => s.done).length, total: steps.length, steps } };
}
