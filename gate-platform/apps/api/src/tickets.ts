import { createHmac, timingSafeEqual } from "node:crypto";
import QRCode from "qrcode";
import { z } from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { DomainError, type Core, type Organization, type Seat } from "@gate/core";
import * as S from "./schemas.js";

// Tickets. A ticket is a seat plus an HMAC over its id, so a ticket link or QR cannot be
// forged or guessed from a seat id, and needs no extra storage. The QR encodes the
// organizer's check-in URL: scanning with any phone camera opens the (password-protected)
// dashboard on that attendee. The short code under the QR is for typing at the door.

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export class TicketSigner {
  private readonly key: Buffer;
  constructor(secret: string) {
    if (!secret || secret.length < 16) throw new Error("ticket secret must be at least 16 characters");
    this.key = createHmac("sha256", "enrollclass/tickets/v1").update(secret).digest();
  }
  private mac(purpose: string, seatId: string): Buffer {
    return createHmac("sha256", this.key).update(`${purpose}:${seatId}`).digest();
  }
  /** "<seatId>.<22-char signature>" — the credential in ticket and check-in URLs. */
  token(seatId: string): string {
    return `${seatId}.${this.mac("token", seatId).subarray(0, 16).toString("base64url")}`;
  }
  /** Returns the seat id when the token is authentic, else undefined. */
  verify(token: string): string | undefined {
    const dot = token.lastIndexOf(".");
    if (dot <= 0) return undefined;
    const seatId = token.slice(0, dot);
    const given = Buffer.from(token.slice(dot + 1), "base64url");
    const want = this.mac("token", seatId).subarray(0, 16);
    return given.length === want.length && timingSafeEqual(given, want) ? seatId : undefined;
  }
  /** "<id>.<signature>" for another purpose (e.g. "invoice"): a link only the holder can use. */
  sign(purpose: string, id: string): string {
    return `${id}.${this.mac(purpose, id).subarray(0, 16).toString("base64url")}`;
  }
  /** The id inside a token from sign(purpose, id), or undefined when forged. */
  check(purpose: string, token: string): string | undefined {
    const dot = token.lastIndexOf(".");
    if (dot <= 0) return undefined;
    const id = token.slice(0, dot);
    const given = Buffer.from(token.slice(dot + 1), "base64url");
    const want = this.mac(purpose, id).subarray(0, 16);
    return given.length === want.length && timingSafeEqual(given, want) ? id : undefined;
  }
  /** "EC-7K2M-94QX": 40 bits, Crockford base32 (no I, L, O, U), stable per seat. */
  code(seatId: string): string {
    const b = this.mac("code", seatId);
    let n = 0n;
    for (let i = 0; i < 5; i++) n = (n << 8n) | BigInt(b[i]!);
    let out = "";
    for (let i = 0; i < 8; i++) { out = CROCKFORD[Number(n & 31n)]! + out; n >>= 5n; }
    return `EC-${out.slice(0, 4)}-${out.slice(4)}`;
  }
}

/** Normalise what someone typed at the door: case, spaces, look-alike letters. */
export function normalizeCode(raw: string): string {
  const c = raw.toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1").replace(/^EC/, "");
  return c.length === 8 ? `EC-${c.slice(0, 4)}-${c.slice(4)}` : raw.trim().toUpperCase();
}

export type TicketStatus = "valid" | "checked_in" | "pending" | "cancelled" | "transferred";
export function ticketStatus(seat: Seat): TicketStatus {
  if (seat.status === "confirmed") return seat.checkedInAt ? "checked_in" : "valid";
  if (seat.status === "reserved") return "pending";
  return seat.status;
}

export interface TicketDeps { core: Core; signer: TicketSigner; publicUrl: string; webUrl: string }

export const checkInUrl = (d: Pick<TicketDeps, "webUrl">, token: string) => `${d.webUrl}/checkin/${encodeURIComponent(token)}`;
export const ticketUrl = (d: Pick<TicketDeps, "webUrl">, token: string) => `${d.webUrl}/my/ticket/${encodeURIComponent(token)}`;

const TicketViewSchema = z.object({
  ticket: z.object({ seatId: z.string(), code: z.string(), status: z.enum(["valid", "checked_in", "pending", "cancelled", "transferred"]), checkedInAt: z.string().nullable(), attendee: S.AttendeeSchema, ticketTypeName: z.string(), orderId: z.string() }),
  event: S.EventSchema,
  course: S.CourseSchema.nullable(),
  organization: z.object({ id: z.string(), name: z.string() }),
  links: z.object({ ticket: z.string(), checkIn: z.string(), qrSvg: z.string(), qrPng: z.string(), calendar: z.string() }),
});

async function ticketView(d: TicketDeps, token: string) {
  const seatId = d.signer.verify(token);
  const seat = seatId ? await d.core.repos.seats.get(seatId) : undefined;
  if (!seat) throw new DomainError("NOT_FOUND", "ticket not found");
  const [event, ticketType, org] = await Promise.all([d.core.repos.events.get(seat.eventId), d.core.repos.ticketTypes.get(seat.ticketTypeId), d.core.repos.organizations.get(seat.organizationId)]);
  if (!event || !org) throw new DomainError("NOT_FOUND", "ticket not found");
  const course = event.courseId ? await d.core.repos.courses.get(event.courseId) : undefined;
  return {
    ticket: { seatId: seat.id, code: d.signer.code(seat.id), status: ticketStatus(seat), checkedInAt: seat.checkedInAt?.toISOString() ?? null, attendee: seat.attendee, ticketTypeName: ticketType?.name ?? "Seat", orderId: seat.orderId },
    event: S.toEvent(event),
    course: course ? S.toCourse(course) : null,
    organization: { id: org.id, name: org.name },
    links: {
      ticket: ticketUrl(d, token), checkIn: checkInUrl(d, token),
      qrSvg: `${d.publicUrl}/public/v1/tickets/${encodeURIComponent(token)}/qr.svg`, qrPng: `${d.publicUrl}/public/v1/tickets/${encodeURIComponent(token)}/qr.png`,
      calendar: `${d.publicUrl}/public/v1/seats/${seat.id}/calendar.ics`,
    },
  };
}

// High error correction so the logo mark in the middle (≈4% of the area) never breaks a scan.
const QR_OPTS = { errorCorrectionLevel: "H" as const, margin: 0, color: { dark: "#14213dff", light: "#ffffffff" } };

/** Public, rate-limited: anyone holding the ticket link can view it. */
export function registerPublicTickets(pub: FastifyInstance, d: TicketDeps) {
  const typed = pub.withTypeProvider<ZodTypeProvider>();
  typed.get("/public/v1/tickets/:token", { schema: { tags: ["public"], security: [], params: z.object({ token: z.string().max(200) }), response: { 200: TicketViewSchema, 404: S.ErrorSchema } } }, async (req) => ticketView(d, req.params.token));
  const qrTarget = async (token: string) => {
    if (!d.signer.verify(token)) throw new DomainError("NOT_FOUND", "ticket not found");
    return checkInUrl(d, token);
  };
  pub.get<{ Params: { token: string } }>("/public/v1/tickets/:token/qr.svg", { schema: { tags: ["public"], security: [] } }, async (req, reply) => {
    const svg = await QRCode.toString(await qrTarget(req.params.token), { ...QR_OPTS, type: "svg" });
    return reply.header("cache-control", "public, max-age=86400").type("image/svg+xml").send(svg);
  });
  pub.get<{ Params: { token: string } }>("/public/v1/tickets/:token/qr.png", { schema: { tags: ["public"], security: [] } }, async (req, reply) => {
    const png = await QRCode.toBuffer(await qrTarget(req.params.token), { ...QR_OPTS, type: "png", width: 480, margin: 2 });
    return reply.header("cache-control", "public, max-age=86400").type("image/png").send(png);
  });
}

export const CheckInBody = z.object({
  /** From a scanned QR / check-in link. */
  token: z.string().max(200).optional(),
  /** Typed at the door, with the cohort it belongs to. */
  code: z.string().max(20).optional(),
  eventId: z.string().optional(),
  undo: z.boolean().optional(),
}).refine((b) => Boolean(b.token) || Boolean(b.code && b.eventId), { message: "send token, or code with eventId" });

/** Organizer-authenticated check-in. */
export function registerCheckIns(api: FastifyInstance, d: TicketDeps, org: (req: { org?: Organization }) => Organization) {
  const typed = api.withTypeProvider<ZodTypeProvider>();
  typed.post("/v1/checkins", {
    schema: { tags: ["delivery"], body: CheckInBody, response: { 200: z.object({ seat: S.SeatSchema, alreadyCheckedIn: z.boolean(), code: z.string(), event: z.object({ id: z.string(), name: z.string() }) }), 400: S.ErrorSchema, 404: S.ErrorSchema, 409: S.ErrorSchema } },
  }, async (req) => {
    const o = org(req);
    let seatId: string | undefined;
    if (req.body.token) {
      seatId = d.signer.verify(req.body.token);
    } else {
      const event = await d.core.getEvent(o.id, req.body.eventId!);
      const want = normalizeCode(req.body.code!);
      seatId = (await d.core.repos.seats.listByEvent(event.id)).find((s) => d.signer.code(s.id) === want)?.id;
    }
    if (!seatId) throw new DomainError("NOT_FOUND", "no ticket with that code", req.body.token ? "the QR or link is not an EnrollClass ticket" : "check the code and the cohort");
    const r = await d.core.checkIn(o.id, seatId, { undo: req.body.undo });
    const event = await d.core.getEvent(o.id, r.seat.eventId);
    return { seat: withTicket(d, r.seat), alreadyCheckedIn: r.alreadyCheckedIn, code: d.signer.code(seatId), event: { id: event.id, name: event.name } };
  });
}

/** Seat as the organizer sees it: plus its check-in code and ticket link. */
export function withTicket(d: Pick<TicketDeps, "signer" | "webUrl">, seat: Seat) {
  const token = d.signer.token(seat.id);
  return { ...S.toSeat(seat), ticketCode: d.signer.code(seat.id), ticketUrl: ticketUrl(d, token), checkInUrl: checkInUrl(d, token) };
}
