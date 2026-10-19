// Typed HTTP client for the EnrollClass platform's PUBLIC (learner-facing) API.
//
// Separate from lib/api.ts on purpose: this client never sends the organizer
// api key. The seat id plus the attendee's email are the only credential, so
// the pages under /my can be opened straight from a confirmation email.
//
// Server-side only (server components and server actions in app/my), so the
// base URL is resolved at request time and nothing here reaches a browser
// bundle. Only type imports are taken from lib/api.

import {
  apiBaseUrl,
  type ApiErrorInfo,
  type ApiResult,
  type Attendee,
  type EventFormat,
  type EventStatus,
  type SeatStatus,
  type Session,
} from "@/lib/api";

export type PublicSeat = {
  id: string;
  status: SeatStatus;
  attendee: Attendee;
  orderId: string;
  eventId: string;
  /** Present once this seat has been moved to another cohort. */
  transferredToSeatId?: string | null;
};

export type PublicEvent = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  format: EventFormat;
  sessions: Session[];
  currency: string;
  status: EventStatus;
};

export type PublicCourse = { id: string; slug: string; name: string };

export type PublicOrganization = { id: string; name: string };

export type SeatPolicy = {
  transfer: { allowed: boolean; feeMinor: number; freeUntil: string | null };
  cancel: { allowed: boolean; refundBps: number; refundMinor: number; fullRefundUntil: string | null };
  substitute: { allowed: boolean; until: string | null };
};

export type TransferOption = {
  eventId: string;
  name: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  remaining: number;
  priceDeltaMinor: number;
  feeMinor: number;
};

export type SeatView = {
  seat: PublicSeat;
  event: PublicEvent;
  course: PublicCourse | null;
  organization: PublicOrganization;
  policy: SeatPolicy;
  transferOptions: TransferOption[];
  calendarUrl: string;
};

export type SubstituteInput = { email: string; attendee: Attendee };
export type SubstituteResult = { seat: PublicSeat };

export type TransferInput = { email: string; toEventId: string };
export type TransferStatus = "completed" | "pending_payment";
export type TransferResult = {
  seat: PublicSeat | null;
  transfer: { id: string; status: TransferStatus; feeMinor: number; paymentRef?: string | null };
  clientSecret: string | null;
};

export type CancelInput = { email: string; reason?: string };
export type CancelResult = {
  seat: PublicSeat;
  refund: { amountMinor: number; status: string } | null;
};

export type DevPaymentResult = { handled: boolean; reason?: string };

type ErrorEnvelope = { error?: { code?: string; message?: string; hint?: string } };

async function request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (body !== undefined) headers["content-type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    return {
      ok: false,
      error: {
        kind: "unreachable",
        url: apiBaseUrl,
        message: err instanceof Error ? err.message : String(err),
      },
    };
  }

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const envelope = (json ?? {}) as ErrorEnvelope;
    const info: ApiErrorInfo = {
      kind: "api",
      status: res.status,
      code: envelope.error?.code ?? `http_${res.status}`,
      message: envelope.error?.message ?? `${res.status} ${res.statusText || "Request failed"}`,
    };
    if (envelope.error?.hint) info.hint = envelope.error.hint;
    return { ok: false, error: info };
  }

  return { ok: true, data: json as T };
}

const enc = encodeURIComponent;

export const publicApi = {
  /** Seat + cohort + policy bundle; 404 when `email` does not match the seat's attendee. */
  getSeat: (seatId: string, email: string) =>
    request<SeatView>("GET", `/public/v1/seats/${enc(seatId)}?email=${enc(email)}`),

  substitute: (seatId: string, input: SubstituteInput) =>
    request<SubstituteResult>("POST", `/public/v1/seats/${enc(seatId)}/substitute`, input),

  transfer: (seatId: string, input: TransferInput) =>
    request<TransferResult>("POST", `/public/v1/seats/${enc(seatId)}/transfer`, input),

  cancel: (seatId: string, input: CancelInput) =>
    request<CancelResult>("POST", `/public/v1/seats/${enc(seatId)}/cancel`, input),

  /** Non-production only: marks a pending payment as succeeded (no publishable key configured). */
  devSucceedPayment: (paymentRef: string) =>
    request<DevPaymentResult>("POST", `/public/v1/dev/payments/${enc(paymentRef)}/succeed`),
};

/** Path of the learner self-service page for a seat. */
export function seatPagePath(seatId: string, email: string): string {
  return `/my/seat/${enc(seatId)}?email=${enc(email)}`;
}
