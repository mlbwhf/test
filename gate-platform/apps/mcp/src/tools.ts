import { z } from "zod";
import type { GateClient } from "./client.js";

/**
 * Tool definitions shared by the MCP server and its tests. Read tools call
 * the API directly. Anything that moves money returns a `requires_approval`
 * proposal instead of executing: a human approves it in the dashboard or
 * mobile app, which then calls the API with the exact body shown here.
 */
export interface ToolDef<I extends z.ZodRawShape> {
  name: string;
  description: string;
  input: I;
  run: (client: GateClient, args: z.infer<z.ZodObject<I>>) => Promise<unknown>;
}

function def<I extends z.ZodRawShape>(t: ToolDef<I>): ToolDef<I> { return t; }

export const tools = [
  def({
    name: "get_organization",
    description: "The organization this API key belongs to (name, currency, payout destination).",
    input: {},
    run: (c) => c.me(),
  }),
  def({
    name: "today",
    description: "The organizer's Today view: money totals, items that need attention (with suggested actions), the class running today with check-in counts, and classes starting this week.",
    input: {},
    run: (c) => c.request("GET", "/v1/home"),
  }),
  def({
    name: "events_overview",
    description: "Every class with seats sold and capacity, status (draft/live/ended/cancelled), course, dates and time zone. Use this to answer 'how full is…' or 'what's coming up'.",
    input: {},
    run: (c) => c.request("GET", "/v1/events/overview"),
  }),
  def({
    name: "event_detail",
    description: "One class in detail: seats, attendees with payment and check-in status, certificates, instructors, course emails, and the public registration link.",
    input: { eventId: z.string() },
    run: (c, a) => c.request("GET", `/v1/events/${encodeURIComponent(a.eventId)}/overview`),
  }),
  def({
    name: "duplicate_event",
    description: "Copy a class with its course, tickets, prices, minimum and instructors (nothing sold). startDate (YYYY-MM-DD, in the class's time zone) moves it; omit to keep the same dates.",
    input: { eventId: z.string(), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), name: z.string().min(1).optional() },
    run: (c, a) => c.request("POST", `/v1/events/${encodeURIComponent(a.eventId)}/duplicate`, { ...(a.startDate ? { startDate: a.startDate } : {}), ...(a.name ? { name: a.name } : {}) }),
  }),
  def({
    name: "publish_event",
    description: "Publish a draft class (for example one an instructor created that waits for approval) so registration opens.",
    input: { eventId: z.string() },
    run: (c, a) => c.request("POST", `/v1/events/${encodeURIComponent(a.eventId)}/publish`, {}),
  }),
  def({
    name: "check_in",
    description: "Check an attendee in at the door with the code printed under their ticket QR (EC-XXXX-XXXX). undo=true reverses it.",
    input: { eventId: z.string(), code: z.string().min(4), undo: z.boolean().optional() },
    run: (c, a) => c.request("POST", "/v1/checkins", { eventId: a.eventId, code: a.code, ...(a.undo ? { undo: true } : {}) }),
  }),
  def({
    name: "issue_certificates",
    description: "Issue attendance or completion certificates to a class's confirmed attendees (once each) and email them. onlyCheckedIn limits it to people checked in.",
    input: { eventId: z.string(), kind: z.enum(["attendance", "completion"]).optional(), onlyCheckedIn: z.boolean().optional() },
    run: (c, a) => c.request("POST", `/v1/events/${encodeURIComponent(a.eventId)}/certificates`, { ...(a.kind ? { kind: a.kind } : {}), ...(a.onlyCheckedIn ? { onlyCheckedIn: true } : {}) }),
  }),
  def({
    name: "list_events",
    description: "List the organization's events with status and currency.",
    input: {},
    run: (c) => c.listEvents(),
  }),
  def({
    name: "create_event",
    description: "Create a live event. startsAt is ISO 8601 with offset. Currency defaults to the organization's.",
    input: { name: z.string().min(1), startsAt: z.string(), currency: z.string().regex(/^[A-Z]{3}$/).optional() },
    run: (c, a) => c.createEvent(a),
  }),
  def({
    name: "list_courses",
    description: "List the organization's courses (the evergreen things it teaches). Cohorts are dated instances of a course.",
    input: {},
    run: (c) => c.listCourses(),
  }),
  def({
    name: "create_course",
    description: "Create a course. slug is lowercase-with-hyphens and becomes part of the public catalogue URL.",
    input: { slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), name: z.string().min(1), certificationBody: z.string().optional(), durationDays: z.number().int().min(1).optional() },
    run: (c, a) => c.createCourse(a),
  }),
  def({
    name: "list_cohorts",
    description: "Dated cohorts of a course with sessions, time zone, format, instructors and status.",
    input: { courseId: z.string() },
    run: (c, a) => c.listCohorts(a.courseId),
  }),
  def({
    name: "create_cohort",
    description: "Schedule a cohort of a course. Sessions are ISO 8601 with offsets; timezone is an IANA name like America/Toronto. Start and end derive from the sessions.",
    input: {
      courseId: z.string(), name: z.string().min(1), timezone: z.string(), format: z.enum(["live_virtual", "in_person", "hybrid", "self_paced"]).optional(),
      sessions: z.array(z.object({ startsAt: z.string(), endsAt: z.string(), title: z.string().optional() })).min(1).max(60),
      instructorIds: z.array(z.string()).optional(), minEnrollment: z.number().int().min(0).optional(), currency: z.string().regex(/^[A-Z]{3}$/).optional(),
    },
    run: (c, a) => { const { courseId, ...rest } = a; return c.createCohort(courseId, rest); },
  }),
  def({
    name: "get_roster",
    description: "Confirmed learners for a cohort (name, email, company, status, order), i.e. the roster to load into the certification body's system before class.",
    input: { eventId: z.string() },
    run: async (c, a) => {
      const { items } = await c.listSeats(a.eventId);
      const confirmed = items.filter((s) => s.status === "confirmed");
      return { count: confirmed.length, roster: confirmed.map((s) => ({ name: s.attendee.name ?? "", email: s.attendee.email, company: s.attendee.company ?? "", orderId: s.orderId })), csv: ["name,email,company,orderId", ...confirmed.map((s) => [s.attendee.name ?? "", s.attendee.email, s.attendee.company ?? "", s.orderId].map((v) => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n") };
    },
  }),
  def({
    name: "list_ticket_types",
    description: "Ticket types for an event, with price in minor units, capacity and sold count.",
    input: { eventId: z.string() },
    run: (c, a) => c.listTicketTypes(a.eventId),
  }),
  def({
    name: "create_ticket_type",
    description: "Add a ticket type to an event. priceMinor is integer minor units (cents).",
    input: { eventId: z.string(), name: z.string().min(1), priceMinor: z.number().int().min(0), quantity: z.number().int().min(1) },
    run: (c, a) => c.createTicketType(a.eventId, { name: a.name, priceMinor: a.priceMinor, quantity: a.quantity }),
  }),
  def({
    name: "quote_order",
    description: "Price an order without reserving tickets or charging anyone (dry run). Returns the full fee breakdown and split.",
    input: { ticketTypeId: z.string(), quantity: z.number().int().min(1).max(100), buyerEmail: z.string().email() },
    run: (c, a) => c.quoteOrder(a),
  }),
  def({
    name: "list_orders",
    description: "Recent orders with status and pricing.",
    input: { limit: z.number().int().min(1).max(500).optional() },
    run: (c, a) => c.listOrders(a.limit ?? 50),
  }),
  def({
    name: "get_cash_position",
    description: "Ledger balances for the organization: what is payable to the organizer and to each split party, by currency.",
    input: {},
    run: async (c) => {
      const { accounts } = await c.balances();
      const totals: Record<string, number> = {};
      for (const a of accounts) totals[a.currency] = (totals[a.currency] ?? 0) + a.balanceMinor;
      return { accounts, totalPayableByCurrency: totals };
    },
  }),
  def({
    name: "explain_order",
    description: "Ask the organizer copilot to explain where every unit of an order went, using ledger facts. Read-only.",
    input: { orderId: z.string(), question: z.string().max(2000).optional() },
    run: (c, a) => c.explainOrder(a.orderId, a.question),
  }),
  def({
    name: "propose_refund",
    description: "Propose a refund. This never moves money: it validates the order and returns a requires_approval proposal with the exact API call a human must approve.",
    input: { orderId: z.string(), amountMinor: z.number().int().min(1).optional(), reason: z.string().min(1) },
    run: async (c, a) => {
      const order = await c.getOrder(a.orderId);
      const refundable = order.pricing.totalMinor - order.refundedMinor;
      if (order.status !== "paid" && order.status !== "partially_refunded") {
        return { ok: false, reason: `order is ${order.status}; only paid orders can be refunded` };
      }
      const amount = a.amountMinor ?? refundable;
      if (amount > refundable) return { ok: false, reason: `amount ${amount} exceeds refundable ${refundable}` };
      return {
        ok: true,
        requires_approval: true,
        proposal: { action: "refund", orderId: a.orderId, amountMinor: amount, currency: order.currency, reason: a.reason },
        approve_by_calling: { method: "POST", path: "/v1/refunds", body: { orderId: a.orderId, amountMinor: amount, reason: a.reason }, headers: ["Idempotency-Key: <uuid>"] },
        message: "Money movement requires a human approval step. Present the proposal to the organizer; the dashboard or mobile app executes it.",
      };
    },
  }),
];
