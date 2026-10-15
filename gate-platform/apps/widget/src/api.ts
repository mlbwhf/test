// Typed client for the public, unauthenticated registration API.

export interface Organization { id: string; name: string; country: string; currency: string }
export interface Course {
  id: string; slug: string; name: string; description: string | null;
  certificationBody: string | null; durationDays: number | null;
}
export interface Session { startsAt: string; endsAt: string; title?: string | null }
export interface CohortEvent {
  id: string; name: string; startsAt: string; endsAt: string; timezone: string;
  format: string; sessions: Session[]; currency: string; status: string;
}
export interface TicketType {
  id: string; name: string; remaining: number;
  prices: Record<string, number>; earlyBirdUntil: string | null;
}
export interface Cohort { event: CohortEvent; ticketTypes: TicketType[] }
export interface CoursePayload { organization: Organization; course: Course; cohorts: Cohort[] }

export interface Attendee { email: string; name?: string; company?: string }
export interface OrderRequest {
  ticketTypeId: string; quantity: number; buyerEmail: string; currency: string;
  attendees: Attendee[]; dryRun?: boolean;
  /** Set when the buyer is claiming a seat offered from the waitlist. */
  waitlistEntryId?: string;
}
export interface Pricing {
  subtotalMinor: number; platformFeeMinor: number; attendeeFeeMinor: number; totalMinor: number;
  organizerNetMinor: number; perTicketFeeMinor: number; unitPriceMinor: number; quantity: number;
}
export type OrderStatus = "pending" | "paid" | "failed" | (string & {});
export interface Order { id: string; status: OrderStatus; currency: string; paymentRef: string | null; pricing: Pricing }
export interface OrderResponse { order: Order; clientSecret: string | null; dryRun: boolean }

export interface WaitlistRequest { eventId: string; ticketTypeId: string; email: string; name?: string; quantity: number }
export type WaitlistStatus = "waiting" | "offered" | "claimed" | "expired" | (string & {});
export interface WaitlistEntry { id: string; status: WaitlistStatus; position: number }
export interface WaitlistResponse { entry: WaitlistEntry }

export const NETWORK_MESSAGE = "Can't reach the registration service";

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly hint?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ErrorBody { error?: { code?: string; message?: string; hint?: string } }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError("NETWORK_ERROR", NETWORK_MESSAGE);
  }
  if (res.ok) return (await res.json()) as T;
  let body: ErrorBody | null = null;
  try {
    body = (await res.json()) as ErrorBody;
  } catch {
    /* non-JSON error body */
  }
  const e = body?.error;
  throw new ApiError(
    e?.code ?? `HTTP_${res.status}`,
    e?.message ?? `The registration service returned an error (${res.status}).`,
    e?.hint,
    res.status,
  );
}

export interface Api {
  getCourse(slug: string): Promise<CoursePayload>;
  createOrder(body: OrderRequest, idempotencyKey: string): Promise<OrderResponse>;
  getOrder(orderId: string, buyerEmail: string): Promise<{ order: Order }>;
  simulatePayment(paymentRef: string): Promise<{ handled: boolean }>;
  joinWaitlist(body: WaitlistRequest): Promise<WaitlistResponse>;
}

export function createApi(baseUrl: string, org: string): Api {
  const base = baseUrl.replace(/\/+$/, "");
  const orgPath = `${base}/public/v1/organizations/${encodeURIComponent(org)}`;
  return {
    getCourse: (slug) => request(`${orgPath}/courses/${encodeURIComponent(slug)}`),
    createOrder: (body, idempotencyKey) =>
      request(`${orgPath}/orders`, {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": idempotencyKey },
        body: JSON.stringify(body),
      }),
    getOrder: (orderId, buyerEmail) =>
      request(`${base}/public/v1/orders/${encodeURIComponent(orderId)}?buyerEmail=${encodeURIComponent(buyerEmail)}`),
    simulatePayment: (paymentRef) =>
      request(`${base}/public/v1/dev/payments/${encodeURIComponent(paymentRef)}/succeed`, { method: "POST" }),
    joinWaitlist: (body) =>
      request(`${orgPath}/waitlist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
  };
}

/** RFC 4122 v4 UUID; uses crypto.randomUUID when present, else getRandomValues/Math.random. */
export function uuid(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  const bytes = new Uint8Array(16);
  if (c && typeof c.getRandomValues === "function") c.getRandomValues(bytes);
  else for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
