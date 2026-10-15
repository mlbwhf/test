// Typed HTTP client for the Gate platform API.
//
// Server-side only: import this from server components, route handlers or
// server actions. It is never imported from a "use client" module, so the
// NEXT_PUBLIC_GATE_API_KEY value is read at request time on the server and
// never inlined into a browser bundle.

export type PayoutDestination = "gate_account" | "external_bank";

export type Organization = {
  id: string;
  name: string;
  country: string;
  currency: string;
  payoutDestination: PayoutDestination;
};

export type EventStatus = "draft" | "live" | "ended" | "cancelled";

export type EventFormat = "live_virtual" | "in_person" | "hybrid" | "self_paced";

export const EVENT_FORMATS: EventFormat[] = ["live_virtual", "in_person", "hybrid", "self_paced"];

export type Session = { startsAt: string; endsAt: string; title?: string };

export type Event = {
  id: string;
  organizationId: string;
  courseId: string | null;
  name: string;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  format: EventFormat;
  sessions: Session[];
  instructorIds: string[];
  minEnrollment: number | null;
  currency: string;
  status: EventStatus;
};

export type Course = {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  description: string | null;
  certificationBody: string | null;
  durationDays: number | null;
  createdAt: string;
};

export type PartyKind = "venue" | "vendor" | "promoter" | "tax_reserve" | "instructor";

export const PARTY_KINDS: PartyKind[] = ["instructor", "venue", "vendor", "promoter", "tax_reserve"];

export type Party = {
  id: string;
  name: string;
  kind: PartyKind;
  paymentsAccountRef: string | null;
};

export type Attendee = { email: string; name?: string; company?: string };

export type SeatStatus = "reserved" | "confirmed" | "cancelled" | "transferred";

export type Seat = {
  id: string;
  orderId: string;
  eventId: string;
  ticketTypeId: string;
  attendee: Attendee;
  status: SeatStatus;
  createdAt: string;
  confirmedAt: string | null;
};

export type RegionalPrices = Record<string, number>;

export type EarlyBird = {
  until: string;
  priceMinor: number;
  prices: RegionalPrices | null;
};

export type TicketType = {
  id: string;
  eventId: string;
  name: string;
  priceMinor: number;
  prices: RegionalPrices | null;
  earlyBird: EarlyBird | null;
  quantity: number;
  sold: number;
};

export type OrderStatus = "pending" | "paid" | "refunded" | "failed";

export type OrderPricing = {
  subtotalMinor: number;
  platformFeeMinor: number;
  attendeeFeeMinor: number;
  totalMinor: number;
  organizerNetMinor: number;
};

export type Order = {
  id: string;
  eventId: string;
  status: OrderStatus;
  buyerEmail: string;
  quantity: number;
  currency: string;
  pricing: OrderPricing;
  attendees: Attendee[];
};

export type LedgerAccount = {
  code: string;
  name: string;
  type: string;
  currency: string;
  balanceMinor: number;
};

export type Refund = {
  id: string;
  orderId: string;
  amountMinor: number;
  status: string;
};

export type CreateEventInput = { name: string; startsAt: string; currency: string };
export type CreateTicketTypeInput = {
  name: string;
  priceMinor: number;
  quantity: number;
  prices?: RegionalPrices;
  earlyBird?: { until: string; priceMinor: number; prices?: RegionalPrices };
};
export type CreateOrderInput = {
  ticketTypeId: string;
  quantity: number;
  buyerEmail: string;
  currency?: string;
  attendees?: Attendee[];
};
export type CreateOrderResult = { order: Order; clientSecret: string | null };
export type CreateRefundInput = { orderId: string; amountMinor?: number; reason: string };
export type CreateRefundResult = { refund: Refund };
export type CreateCourseInput = {
  slug: string;
  name: string;
  description?: string;
  certificationBody?: string;
  durationDays?: number;
};
export type CreateCohortInput = {
  name: string;
  timezone: string;
  format: EventFormat;
  sessions: Session[];
  minEnrollment?: number;
  instructorIds?: string[];
  currency?: string;
};
export type CreatePartyInput = { name: string; kind: PartyKind };

/** The API answered with a 4xx/5xx and (usually) an `{ error }` envelope. */
export type ApiErrorInfo = {
  kind: "api";
  status: number;
  code: string;
  message: string;
  hint?: string;
};

/** The API could not be reached at all (connection refused, DNS, timeout...). */
export type UnreachableInfo = {
  kind: "unreachable";
  url: string;
  message: string;
};

export type ApiFailure = ApiErrorInfo | UnreachableInfo;

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiFailure };

export const apiBaseUrl = (process.env.NEXT_PUBLIC_GATE_API_URL ?? "http://localhost:4000").replace(
  /\/+$/,
  "",
);

const apiKey = process.env.NEXT_PUBLIC_GATE_API_KEY ?? "";

type ErrorEnvelope = { error?: { code?: string; message?: string; hint?: string } };

async function request<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;
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

export const api = {
  getOrganization: () => request<Organization>("GET", "/v1/organizations/me"),

  listEvents: () => request<{ items: Event[] }>("GET", "/v1/events"),
  createEvent: (input: CreateEventInput) => request<Event>("POST", "/v1/events", input),
  getEvent: (id: string) => request<Event>("GET", `/v1/events/${enc(id)}`),

  listTicketTypes: (eventId: string) =>
    request<{ items: TicketType[] }>("GET", `/v1/events/${enc(eventId)}/ticket-types`),
  createTicketType: (eventId: string, input: CreateTicketTypeInput) =>
    request<TicketType>("POST", `/v1/events/${enc(eventId)}/ticket-types`, input),

  listCourses: () => request<{ items: Course[] }>("GET", "/v1/courses"),
  createCourse: (input: CreateCourseInput) => request<Course>("POST", "/v1/courses", input),
  getCourse: (id: string) => request<Course>("GET", `/v1/courses/${enc(id)}`),
  listCohorts: (courseId: string) => request<{ items: Event[] }>("GET", `/v1/courses/${enc(courseId)}/cohorts`),
  createCohort: (courseId: string, input: CreateCohortInput) =>
    request<Event>("POST", `/v1/courses/${enc(courseId)}/cohorts`, input),

  listParties: () => request<{ items: Party[] }>("GET", "/v1/parties"),
  createParty: (input: CreatePartyInput) => request<Party>("POST", "/v1/parties", input),

  listSeats: (eventId: string) => request<{ items: Seat[] }>("GET", `/v1/seats?eventId=${enc(eventId)}`),

  listOrders: () => request<{ items: Order[] }>("GET", "/v1/orders"),
  createOrder: (input: CreateOrderInput) => request<CreateOrderResult>("POST", "/v1/orders", input),

  getBalances: () => request<{ accounts: LedgerAccount[] }>("GET", "/v1/ledger/balances"),

  createRefund: (input: CreateRefundInput) => request<CreateRefundResult>("POST", "/v1/refunds", input),
};

/** Human-readable one-liner for any failure, used by inline error panels. */
export function describeFailure(failure: ApiFailure): string {
  if (failure.kind === "unreachable") {
    return `API unreachable at ${failure.url}`;
  }
  return failure.hint ? `${failure.message} (${failure.hint})` : failure.message;
}
