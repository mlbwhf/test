// Typed HTTP client for the EnrollClass platform API.
//
// Server-side only: import this from server components, route handlers or server
// actions. Requests carry the signed-in person's session (from an httpOnly cookie), so
// the API applies their organization and role.

import { sessionToken } from "@/lib/session";

export type PayoutDestination = "gate_account" | "external_bank";

/** When held cohort funds become payable: as soon as they are paid, or once the cohort is delivered. */
export type ReleasePolicy = "immediate" | "on_delivery";

export const RELEASE_POLICIES: ReleasePolicy[] = ["immediate", "on_delivery"];

export const RELEASE_POLICY_LABELS: Record<ReleasePolicy, string> = {
  immediate: "Immediate (release when paid)",
  on_delivery: "On delivery (release after the cohort ends)",
};

export type Organization = {
  id: string;
  name: string;
  country: string;
  currency: string;
  payoutDestination: PayoutDestination;
  releasePolicy: ReleasePolicy;
  /** Hours after a cohort ends before held funds are released under "on_delivery". */
  releaseGraceHours: number;
  /** Days before the first session by which a cohort must reach its minimum enrollment. */
  minEnrollmentDecisionDays: number;
  pricing: PricingSettings;
  instructorAccess: InstructorAccess;
  /** protected: EnrollClass collects and holds until delivery; direct: learners pay the organizer's own Stripe. */
  paymentMode: PaymentMode;
  /** The learner pays the EnrollClass fee as a booking fee. */
  passFeeToAttendee: boolean;
  /** Listed in EnrollClass's class finder (bookings from it carry a referral fee). */
  marketplaceListing: boolean;
  /** Learners can buy the flexible-ticket upgrade. */
  flexibleTickets: boolean;
  /** Company logo shown in Find a class, on course pages and in the schedule widget. */
  logoUrl: string | null;
};

export type PaymentMode = "protected" | "direct";
export type PaymentsSetup = "none" | "incomplete" | "ready";
type PaymentsAccountStatus = { ready: boolean; requirementsDue: string[]; disabledReason?: string; checkedAt: string } | null;
/** setup/status describe the active mode's Stripe account; each mode has its own. */
export type PaymentsState = {
  mode: PaymentMode;
  setup: PaymentsSetup;
  status: PaymentsAccountStatus;
  protected: { setup: PaymentsSetup; status: PaymentsAccountStatus };
  direct: { setup: PaymentsSetup; status: PaymentsAccountStatus };
};

/** scope: what instructors see; publish: whether their new classes need an owner or admin to approve. */
export type InstructorAccess = { scope: "own" | "all"; publish: "direct" | "approval" };

export type FxRounding = "none" | "whole" | "nine" | "five";
export const FX_ROUNDINGS: FxRounding[] = ["whole", "nine", "five", "none"];
export const FX_ROUNDING_LABELS: Record<FxRounding, string> = {
  whole: "Whole units (2,039)",
  nine: "Ending in 9 (2,039 → 2,039, 2,046 → 2,049)",
  five: "Multiples of 5 (2,040)",
  none: "Exact to the cent",
};
export type PricingSettings = {
  currencies: string[];
  fxFallback: boolean;
  rounding: FxRounding;
  rates: Record<string, number>;
  ratesUpdatedAt: string | null;
  ratesSource: "manual" | "ecb" | null;
};
export type UpdatePricingInput = Partial<Pick<PricingSettings, "currencies" | "fxFallback" | "rounding" | "rates">>;

export type EventStatus = "draft" | "live" | "ended" | "cancelled";

export type EventFormat = "live_virtual" | "in_person" | "hybrid" | "self_paced";

export const EVENT_FORMATS: EventFormat[] = ["live_virtual", "in_person", "hybrid", "self_paced"];

export type Session = { startsAt: string; endsAt: string; title?: string };

export type MeetingProvider = "zoom" | "teams" | "manual";

export const MEETING_PROVIDERS: MeetingProvider[] = ["zoom", "teams", "manual"];

export const MEETING_PROVIDER_LABELS: Record<MeetingProvider, string> = {
  zoom: "Zoom",
  teams: "Microsoft Teams",
  manual: "Manual link",
};

export type Meeting = {
  provider: MeetingProvider;
  meetingId: string;
  joinUrl: string;
  hostUrl: string | null;
  passcode: string | null;
};

/** A fixed fee owed to an instructor (party) for delivering a cohort, in the cohort's currency. */
export type InstructorFee = { partyId: string; amountMinor: number };

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
  meeting: Meeting | null;
  instructorFees: InstructorFee[];
  /** Set when the cohort is below its minimum enrollment past the decision deadline. */
  atRiskAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
};

export type Course = {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  description: string | null;
  certificationBody: string | null;
  durationDays: number | null;
  prework: string | null;
  surveyUrl: string | null;
  /** Cover image (2:1 banner) for the public page and widget. */
  imageUrl: string | null;
  /** Digital badge on an outside platform (Credly, Accredible…). */
  badge: CourseBadge | null;
  /** Topic in Find a class; null means EnrollClass guesses it from the name. */
  category: string | null;
  /** The topic it is listed under: the organizer's choice or EnrollClass's guess. */
  topic: string;
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
  /** Door check-in time, null until the ticket is scanned or checked in by hand. */
  checkedInAt: string | null;
  ticketCode?: string;
  ticketUrl?: string;
  checkInUrl?: string;
};

export type CheckInResult = { seat: Seat; alreadyCheckedIn: boolean; code: string; event: { id: string; name: string } };

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

export type OrderStatus = "pending" | "paid" | "refunded" | "partially_refunded" | "failed" | "cancelled";

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
  paymentMethod: "card" | "invoice";
  refundedMinor: number;
  heldMinor: number;
  fundsStatus: "none" | "held" | "released";
  releasedAt: string | null;
  createdAt: string;
  paidAt: string | null;
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

export type AttendanceStatus = "present" | "partial" | "absent" | "unknown";

/** Statuses an organizer may set by hand ("unknown" is only ever reported by the API). */
export const ATTENDANCE_STATUSES: Exclude<AttendanceStatus, "unknown">[] = ["present", "partial", "absent"];

export type AttendanceSource = "provider" | "manual" | "none";

export type Attendance = {
  seatId: string;
  email: string;
  name: string | null;
  minutes: number;
  sessionsAttended: number;
  status: AttendanceStatus;
  source: AttendanceSource;
};

export type Certificate = {
  id: string;
  seatId: string;
  attendeeName: string;
  attendeeEmail: string;
  courseName: string;
  issuedAt: string;
  verifyCode: string;
  verifyUrl: string;
  viewUrl: string;
};

export type SequenceStep = "prework_t14" | "reminder_t7" | "reminder_t1" | "day_of" | "survey" | "certificate";

export const SEQUENCE_STEP_LABELS: Record<SequenceStep, string> = {
  prework_t14: "Pre-work (T-14)",
  reminder_t7: "Reminder (T-7)",
  reminder_t1: "Reminder (T-1)",
  day_of: "Day of",
  survey: "Survey",
  certificate: "Certificate",
};

export type SentMessage = { key: string; step: SequenceStep; to: string; sentAt: string };

export type RosterFormat = "default" | "safe_studio" | "scrum_org";

export const ROSTER_FORMATS: RosterFormat[] = ["default", "safe_studio", "scrum_org"];

export const ROSTER_FORMAT_LABELS: Record<RosterFormat, string> = {
  default: "Default",
  safe_studio: "SAFe Studio",
  scrum_org: "Scrum.org",
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
export type CreateMeetingInput = {
  provider: MeetingProvider;
  joinUrl?: string;
  hostUrl?: string;
  passcode?: string;
};
export type RecordAttendanceInput = {
  seatId: string;
  status: Exclude<AttendanceStatus, "unknown">;
  minutes?: number;
};
export type IssueCertificatesInput = { onlyPresent?: boolean; onlyCheckedIn?: boolean; kind?: "attendance" | "completion" };
export type UpdateCourseInput = {
  category?: string | null;
  prework?: string | null;
  surveyUrl?: string | null;
  description?: string | null;
  badge?: CourseBadge | null;
};

export type BadgePlatform = "credly" | "accredible" | "badgr" | "certopus" | "other" | "own";
export const BADGE_PLATFORMS: Record<BadgePlatform, string> = { own: "EnrollClass verified badge (Open Badges 3.0)", credly: "Credly", accredible: "Accredible", badgr: "Badgr / Canvas Credentials", certopus: "Certopus", other: "Other platform" };
export type BadgeMigration = { courseId: string; status: "moved" | "already" | "no_badge" | "no_image" | "failed"; reason?: string };
export type BadgeOverviewItem = { course: Course; verified: boolean; issued: number; awaiting: number };
/** "own" badges have an uploaded image and no outside link. */
export type CourseBadge = { platform: BadgePlatform; name: string; url?: string; imageUrl?: string };
/** A text/csv payload proxied through to the browser by the roster route handler. */
export type CsvDownload = { csv: string; contentType: string };

// ---------------------------------------------------------------------------
// Money: release policy, instructor fees, cancellation, reports and payouts.

export type UpdateOrganizationInput = {
  releasePolicy?: ReleasePolicy;
  releaseGraceHours?: number;
  minEnrollmentDecisionDays?: number;
  passFeeToAttendee?: boolean;
  marketplaceListing?: boolean;
  flexibleTickets?: boolean;
};
export type EarlyReleaseQuote = { eligible: boolean; reason?: string; currency: string; heldMinor: number; feeMinor: number; netMinor: number };
export type SetInstructorFeesInput = { fees: InstructorFee[] };
export type CancelEventInput = { reason: string; transferToEventId?: string };
export type CancelEventResult = { event: Event; refunded: number; transferred: number; voided: number };
export type ReleaseFundsResult = { released: number; amountMinor: number };

/** Whether a cohort's organizer funds are still held, already released, or a mix of both. */
export type FundsStatus = "held" | "released" | "mixed" | "none";

export type RevenueTotals = { recognizedMinor: number; deferredMinor: number; refundedMinor: number };

export type RevenueCohort = {
  eventId: string;
  name: string;
  courseName: string | null;
  startsAt: string;
  endsAt: string | null;
  currency: string;
  status: EventStatus;
  seats: number;
  grossMinor: number;
  platformFeeMinor: number;
  taxMinor: number;
  organizerNetMinor: number;
  refundedMinor: number;
  instructorFeesMinor: number;
  marginMinor: number;
  fundsStatus: FundsStatus;
  /** True when the cohort ended inside the report range (revenue is recognized, not deferred). */
  recognized: boolean;
};

export type RevenueReport = {
  from: string;
  to: string;
  byCurrency: Record<string, RevenueTotals>;
  cohorts: RevenueCohort[];
};

export type PayableItem = {
  /** Null for the organizer itself. */
  partyId: string | null;
  name: string;
  kind: string | null;
  currency: string;
  payableMinor: number;
  heldMinor: number;
};

export type PayoutMethod = "bank_transfer" | "wire" | "cheque" | "other";

export const PAYOUT_METHODS: PayoutMethod[] = ["bank_transfer", "wire", "cheque", "other"];

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  bank_transfer: "Bank transfer",
  wire: "Wire",
  cheque: "Cheque (mailed)",
  other: "Other",
};

export type Payout = {
  id: string;
  /** Null when the payout went to the organizer itself. */
  partyId: string | null;
  currency: string;
  amountMinor: number;
  method: PayoutMethod;
  reference: string | null;
  createdAt: string;
};

export type CreatePayoutInput = {
  partyId?: string;
  currency: string;
  amountMinor: number;
  method: PayoutMethod;
  reference?: string;
};

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

// Server-only names (GATE_API_URL) are read at request time, so one
// container image serves any domain. The NEXT_PUBLIC_ names remain for local dev.
export const apiBaseUrl = (process.env.GATE_API_URL ?? process.env.NEXT_PUBLIC_GATE_API_URL ?? "http://localhost:4000").replace(
  /\/+$/,
  "",
);

// Every dashboard request acts as the signed-in person (their session, their role).
// There is deliberately no fallback to a shared organization key.

type ErrorEnvelope = { error?: { code?: string; message?: string; hint?: string } };

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/** Issues the request and parses an error envelope; returns the raw Response on 2xx. */
/** A binary request body (an uploaded image) sent as-is with its own content type. */
class RawBody {
  constructor(readonly bytes: ArrayBuffer, readonly contentType: string) {}
}

async function send(
  method: Method,
  path: string,
  body: unknown,
  accept: string,
): Promise<{ ok: true; res: Response } | { ok: false; error: ApiFailure }> {
  const headers: Record<string, string> = { accept };
  const token = await sessionToken();
  if (token) headers.authorization = `Bearer ${token}`;
  if (body instanceof RawBody) headers["content-type"] = body.contentType;
  else if (body !== undefined) headers["content-type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${apiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : body instanceof RawBody ? body.bytes : JSON.stringify(body),
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

  if (!res.ok) {
    const text = await res.text();
    let json: unknown = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }
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

  return { ok: true, res };
}

async function request<T>(method: Method, path: string, body?: unknown): Promise<ApiResult<T>> {
  const sent = await send(method, path, body, "application/json");
  if (!sent.ok) return sent;

  const text = await sent.res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  return { ok: true, data: json as T };
}

/** Like `request`, for endpoints that answer with text/csv instead of JSON. */
async function requestCsv(path: string): Promise<ApiResult<CsvDownload>> {
  const sent = await send("GET", path, undefined, "text/csv, text/plain;q=0.9, */*;q=0.1");
  if (!sent.ok) return sent;
  return {
    ok: true,
    data: {
      csv: await sent.res.text(),
      contentType: sent.res.headers.get("content-type") ?? "text/csv; charset=utf-8",
    },
  };
}

const enc = encodeURIComponent;


// ---- imports from other ticketing tools ----
export type ImportSource = "eventbrite" | "csv";
export type ImportItem = {
  source: ImportSource;
  sourceId: string;
  sourceUrl?: string;
  course: { slug: string; name: string; description?: string; durationDays?: number; imageUrl?: string; badge?: CourseBadge; certificationBody?: string };
  event: { name: string; startsAt: string; endsAt?: string; timezone: string; currency: string; format: EventFormat; instructors?: string[]; minEnrollment?: number; meetingUrl?: string; draft?: boolean };
  ticketTypes: { name: string; priceMinor: number; quantity: number; sold?: number }[];
  sourceStatus?: string;
  warnings: string[];
};
export type ImportResult = { sourceId: string; status: "created" | "exists" | "skipped" | "failed"; reason?: string; courseId?: string; courseCreated?: boolean; eventId?: string; ticketTypes?: number; image?: "copied" | "kept" | "failed" | "none"; imageError?: string; badge?: "set" | "kept" | "failed" | "none"; instructors?: number; instructorsCreated?: string[]; draft?: boolean };
export type ImportResponse = {
  plan: { source: ImportSource; items: ImportItem[]; courses: { slug: string; name: string; cohorts: number }[]; skipped: { sourceId: string; name: string; reason: string }[] };
  eventbriteOrganization?: { id: string; name: string } | null;
  unmatchedHeaders?: string[];
  dryRun: boolean;
  results: ImportResult[];
};
export type ImportOptions = { dryRun: boolean; includePast?: boolean; sourceIds?: string[] };

// ---- accounts ----
export type Role = "owner" | "admin" | "instructor" | "finance";
export const ROLES: Role[] = ["owner", "admin", "instructor", "finance"];
export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  instructor: "Instructor",
  finance: "Finance",
};
export const ROLE_HINTS: Record<Role, string> = {
  owner: "Everything, including other owners",
  admin: "Team, settings, classes and money",
  instructor: "Courses, cohorts, imports and check-in",
  finance: "Orders, payouts, refunds and reports",
};
export type Permission = "team" | "settings" | "classes:write" | "classes:read" | "money:read" | "money:write";
export type Me = {
  user: { id: string; email: string; name: string | null; avatarUrl: string | null };
  organization: { id: string; name: string; kind: "company" | "individual" | null; currency: string; country: string; paymentMode: PaymentMode; paymentsConnected: boolean; paymentsSetup: "none" | "incomplete" | "ready" } | null;
  role: Role | null;
  permissions: Permission[];
  memberships: { organizationId: string; organizationName: string; kind: "company" | "individual" | null; role: Role }[];
};
export type HomeLine = { eventId: string; name: string; courseName: string | null; startsAt: string; endsAt: string | null; timezone: string; format: EventFormat; sold: number; capacity: number };
export type HomeAttention = {
  id: string;
  kind: "payments_setup" | "release_ready" | "low_enrolment" | "unpaid_invoices" | "missing_prework" | "no_tickets";
  tone: "green" | "amber" | "red";
  title: string;
  detail: string;
  action: { label: string; kind: "link"; href: string } | { label: string; kind: "release"; eventId: string } | { label: string; kind: "stripe" };
};
export type EventLine = HomeLine & { status: EventStatus; minEnrollment: number | null; free: boolean };
export type EventOverview = {
  line: EventLine;
  sessions: { startsAt: string; endsAt: string }[];
  attendees: { seatId: string; name: string | null; email: string; checkedIn: boolean; payment: "paid" | "invoice" | "pending" | null; certificate: { code: string; kind: "attendance" | "completion" } | null }[];
  money: { currency: string; grossMinor: number; netMinor: number; heldMinor: number } | null;
  course: { id: string; name: string; slug: string; prework: boolean; survey: boolean } | null;
  instructors: { id: string; name: string }[];
  publicUrl: string | null;
};
export type Home = {
  money: { currency: string; grossMinor: number; netMinor: number; feesMinor: number; heldMinor: number; paidOrders: number }[] | null;
  attention: HomeAttention[];
  live: (HomeLine & { day: number; days: number; confirmed: number; checkedIn: number }) | null;
  week: HomeLine[];
  setup: { done: number; total: number; steps: { key: "account" | "payments" | "course" | "cohort" | "registration"; done: boolean }[] };
};
export type ApiKeyInfo = { id: string; name: string; prefix: string; access: "full" | "read"; createdAt: string; lastUsedAt: string | null; revokedAt: string | null };
export type WebhookInfo = { id: string; url: string; secret: string; events: string[]; description: string | null; enabled: boolean; createdAt: string };
export type WebhookDeliveryInfo = { id: string; type: string; status: "pending" | "succeeded" | "failed"; attempts: number; responseStatus: number | null; error: string | null; createdAt: string; updatedAt: string; body: string };
export type Member = { userId: string; email: string; name: string | null; avatarUrl: string | null; role: Role; joinedAt: string };
export type Invitation = { id: string; email: string; role: Role; createdAt: string; expiresAt: string };

export type ScheduleRule =
  | { repeat: "weekly"; everyWeeks: number; weekday?: number }
  | { repeat: "monthly"; everyMonths: number; week: 1 | 2 | 3 | 4 | "last"; weekday: number }
  | { repeat: "dates"; dates: string[] };
export type ScheduleInput = { rule: ScheduleRule; from?: string; count?: number; until?: string; skip?: string[]; publish?: boolean; dryRun?: boolean };
export type SchedulePlanRow = { startDate: string; endDate: string; conflict: boolean };
export type Promotion = { id: string; courseId: string; placement: "category" | "top"; weeks: number; amountMinor: number; currency: string; status: "pending_payment" | "active" | "failed"; startsAt: string | null; endsAt: string | null; createdAt: string };
export type PromotionPrices = { currency: string; weeks: number[]; category: number[]; top: number[] };
/** Topics in Find a class; mirrors the API's fixed list. */
export const COURSE_CATEGORIES: { id: string; label: string }[] = [
  { id: "agile", label: "Agile & Scrum" },
  { id: "project-management", label: "Project management" },
  { id: "product", label: "Product management" },
  { id: "leadership", label: "Leadership & management" },
  { id: "it-service", label: "IT service management" },
  { id: "devops-cloud", label: "DevOps & cloud" },
  { id: "security", label: "Security" },
  { id: "data-ai", label: "Data & AI" },
  { id: "quality", label: "Quality & Lean" },
  { id: "business", label: "Business & finance" },
  { id: "other", label: "Other" },
];
export type BillingAddress = { country: string; region?: string; postalCode?: string; city?: string; line1?: string; taxId?: string };
export type CorporateAccount = { id: string; name: string; billingEmail: string; address: BillingAddress; poRequired: boolean; netTermsDays: number; currency: string; createdAt: string };
export type InvoiceStatus = "issued" | "partially_paid" | "paid" | "void";
export type InvoicePaymentMethod = "bank_transfer" | "wire" | "ach" | "cheque" | "other";
export type Invoice = {
  id: string; orderId: string; corporateAccountId: string | null; number: string; poNumber: string | null; currency: string;
  subtotalMinor: number; taxMinor: number; totalMinor: number; paidMinor: number; status: InvoiceStatus;
  issuedAt: string; dueAt: string; createdAt: string;
  payments: { id: string; amountMinor: number; method: InvoicePaymentMethod | "card"; reference: string | null; receivedAt: string }[];
};
export const INVOICE_PAYMENT_METHODS: InvoicePaymentMethod[] = ["bank_transfer", "wire", "ach", "cheque", "other"];
export const INVOICE_PAYMENT_METHOD_LABELS: Record<string, string> = { bank_transfer: "Bank transfer", wire: "Wire", ach: "ACH", cheque: "Cheque", card: "Card", other: "Other" };
export type CreateInvoiceOrderInput = { corporateAccountId: string; ticketTypeId: string; quantity: number; attendees?: { email: string; name?: string }[]; poNumber?: string; currency?: string; dueDays?: number };

export const api = {
  // ---- accounts and team ----
  providers: () => request<{ providers: { id: string; label: string }[]; email: boolean }>("GET", "/auth/providers"),
  emailSignIn: (email: string, returnTo?: string) => request<{ sent: boolean }>("POST", "/auth/email", { email, ...(returnTo ? { returnTo } : {}) }),
  exchange: (code: string) => request<{ token: string; returnTo: string | null; me: Me }>("POST", "/auth/exchange", { code }),
  me: () => request<Me>("GET", "/auth/me"),
  logout: () => request<{ ok: boolean }>("POST", "/auth/logout", {}),
  switchOrganization: (organizationId: string) => request<Me>("POST", "/auth/switch", { organizationId }),
  createOrganization: (input: { kind: "company" | "individual"; name?: string; country: string; currency: string }) => request<Me>("POST", "/auth/organizations", input),
  acceptInvitation: (token: string) => request<Me>("POST", "/auth/invitations/accept", { token }),
  listMembers: () => request<{ members: Member[]; invitations: Invitation[] }>("GET", "/v1/members"),
  invite: (email: string, role: Role) => request<{ invitation: Invitation; emailed: boolean; acceptUrl: string }>("POST", "/v1/invitations", { email, role }),
  revokeInvitation: (id: string) => request<{ ok: boolean }>("DELETE", `/v1/invitations/${enc(id)}`),
  changeRole: (userId: string, role: Role) => request<{ userId: string; role: Role }>("PATCH", `/v1/members/${enc(userId)}`, { role }),
  removeMember: (userId: string) => request<{ ok: boolean }>("DELETE", `/v1/members/${enc(userId)}`),
  connectPayments: () => request<{ mode: PaymentMode; paymentsAccountRef: string; onboardingUrl: string | null; ready: boolean; requirementsDue: string[] }>("POST", "/v1/organizations/me/payments/connect", {}),
  refreshPayments: () => request<PaymentsState>("GET", "/v1/organizations/me/payments"),
  setPaymentMode: (mode: PaymentMode) => request<PaymentsState>("PUT", "/v1/organizations/me/payments/mode", { mode }),

  home: () => request<Home>("GET", "/v1/home"),
  eventLines: () => request<{ items: EventLine[] }>("GET", "/v1/events/overview"),
  eventOverview: (id: string) => request<EventOverview>("GET", `/v1/events/${enc(id)}/overview`),
  listApiKeys: () => request<{ items: ApiKeyInfo[] }>("GET", "/v1/api-keys"),
  createApiKey: (name: string, access: "full" | "read") => request<{ key: ApiKeyInfo; secret: string }>("POST", "/v1/api-keys", { name, access }),
  revokeApiKey: (id: string) => request<{ ok: boolean }>("DELETE", `/v1/api-keys/${enc(id)}`),
  listWebhooks: () => request<{ items: WebhookInfo[]; events: string[] }>("GET", "/v1/webhooks"),
  createWebhook: (input: { url: string; events: string[]; description?: string }) => request<WebhookInfo>("POST", "/v1/webhooks", input),
  updateWebhook: (id: string, input: { events?: string[]; enabled?: boolean }) => request<WebhookInfo>("PATCH", `/v1/webhooks/${enc(id)}`, input),
  testWebhook: (id: string) => request<WebhookDeliveryInfo>("POST", `/v1/webhooks/${enc(id)}/test`, {}),
  listDeliveries: (id: string) => request<{ items: WebhookDeliveryInfo[] }>("GET", `/v1/webhooks/${enc(id)}/deliveries`),
  publishEvent: (id: string) => request<Event>("POST", `/v1/events/${enc(id)}/publish`, {}),
  setEventInstructors: (id: string, instructorIds: string[]) => request<Event>("PUT", `/v1/events/${enc(id)}/instructors`, { instructorIds }),
  updateInstructorAccess: (input: Partial<InstructorAccess>) => request<Organization>("PATCH", "/v1/organizations/me/instructor-access", input),
  duplicateEvent: (id: string, input: { startDate?: string; name?: string }) => request<{ event: Event; ticketTypes: TicketType[] }>("POST", `/v1/events/${enc(id)}/duplicate`, input),
  getOrganization: () => request<Organization>("GET", "/v1/organizations/me"),
  earlyReleaseQuote: (eventId: string) => request<EarlyReleaseQuote>("GET", `/v1/events/${enc(eventId)}/release-early`),
  releaseEarly: (eventId: string) => request<{ released: number; amountMinor: number; feeMinor: number }>("POST", `/v1/events/${enc(eventId)}/release-early`, {}),
  updateOrganization: (input: UpdateOrganizationInput) =>
    request<Organization>("PATCH", "/v1/organizations/me", input),
  updatePricing: (input: UpdatePricingInput) => request<Organization>("PATCH", "/v1/organizations/me/pricing", input),
  refreshFxRates: () => request<Organization>("POST", "/v1/organizations/me/pricing/refresh-rates"),

  listEvents: () => request<{ items: Event[] }>("GET", "/v1/events"),
  createEvent: (input: CreateEventInput) => request<Event>("POST", "/v1/events", input),
  getEvent: (id: string) => request<Event>("GET", `/v1/events/${enc(id)}`),

  createMeeting: (eventId: string, input: CreateMeetingInput) =>
    request<Event>("POST", `/v1/events/${enc(eventId)}/meeting`, input),

  setInstructorFees: (eventId: string, input: SetInstructorFeesInput) =>
    request<Event>("PUT", `/v1/events/${enc(eventId)}/instructor-fees`, input),
  cancelEvent: (eventId: string, input: CancelEventInput) =>
    request<CancelEventResult>("POST", `/v1/events/${enc(eventId)}/cancel`, input),
  releaseFunds: (eventId: string) => request<ReleaseFundsResult>("POST", `/v1/events/${enc(eventId)}/release`),

  listAttendance: (eventId: string) =>
    request<{ items: Attendance[] }>("GET", `/v1/events/${enc(eventId)}/attendance`),
  syncAttendance: (eventId: string) =>
    request<{ updated: number; items: Attendance[] }>("POST", `/v1/events/${enc(eventId)}/attendance/sync`),
  recordAttendance: (eventId: string, input: RecordAttendanceInput) =>
    request<Attendance>("POST", `/v1/events/${enc(eventId)}/attendance`, input),

  listCertificates: (eventId: string) =>
    request<{ items: Certificate[] }>("GET", `/v1/events/${enc(eventId)}/certificates`),
  issueCertificates: (eventId: string, input: IssueCertificatesInput) =>
    request<{ issued: Certificate[] }>("POST", `/v1/events/${enc(eventId)}/certificates`, input),

  getRosterCsv: (eventId: string, format: RosterFormat) =>
    requestCsv(`/v1/events/${enc(eventId)}/roster.csv?format=${enc(format)}`),

  listMessages: (eventId: string) =>
    request<{ items: SentMessage[] }>("GET", `/v1/events/${enc(eventId)}/messages`),
  runSequences: () => request<{ sent: number }>("POST", "/v1/sequences/run"),

  listTicketTypes: (eventId: string) =>
    request<{ items: TicketType[] }>("GET", `/v1/events/${enc(eventId)}/ticket-types`),
  createTicketType: (eventId: string, input: CreateTicketTypeInput) =>
    request<TicketType>("POST", `/v1/events/${enc(eventId)}/ticket-types`, input),

  listCourses: () => request<{ items: Course[] }>("GET", "/v1/courses"),
  createCourse: (input: CreateCourseInput) => request<Course>("POST", "/v1/courses", input),
  importEventbrite: (input: ImportOptions & { token: string; eventbriteOrganizationId?: string }) => request<ImportResponse>("POST", "/v1/imports/eventbrite", input),
  importCsv: (input: ImportOptions & { csv: string; timezone?: string; currency?: string }) => request<ImportResponse>("POST", "/v1/imports/csv", input),
  getCourse: (id: string) => request<Course>("GET", `/v1/courses/${enc(id)}`),
  updateCourse: (id: string, input: UpdateCourseInput) => request<Course>("PATCH", `/v1/courses/${enc(id)}`, input),
  uploadCourseImage: (id: string, bytes: ArrayBuffer, contentType: string) => request<Course>("PUT", `/v1/courses/${enc(id)}/image`, new RawBody(bytes, contentType)),
  importCourseImage: (id: string, url: string) => request<Course>("POST", `/v1/courses/${enc(id)}/image/from-url`, { url }),
  uploadOrganizationLogo: (bytes: ArrayBuffer, contentType: string) => request<Organization>("PUT", "/v1/organizations/me/logo", new RawBody(bytes, contentType)),
  removeOrganizationLogo: () => request<Organization>("DELETE", "/v1/organizations/me/logo"),
  buildSchedule: (eventId: string, input: ScheduleInput) => request<{ plan: SchedulePlanRow[]; created: Event[] }>("POST", `/v1/events/${enc(eventId)}/schedule`, input),
  removeCourseImage: (id: string) => request<Course>("DELETE", `/v1/courses/${enc(id)}/image`),
  listBadges: () => request<{ items: BadgeOverviewItem[] }>("GET", "/v1/badges"),
  migrateBadge: (courseId: string) => request<{ result: BadgeMigration; course: Course }>("POST", `/v1/courses/${enc(courseId)}/badge/migrate`, {}),
  migrateAllBadges: () => request<{ results: BadgeMigration[] }>("POST", "/v1/badges/migrate", {}),
  awardBadge: (courseId: string, notify: boolean) => request<{ awarded: number }>("POST", `/v1/courses/${enc(courseId)}/badge/award`, { notify }),
  uploadBadgeImage: (id: string, bytes: ArrayBuffer, contentType: string, name?: string) =>
    request<Course>("PUT", `/v1/courses/${enc(id)}/badge-image${name ? `?name=${enc(name)}` : ""}`, new RawBody(bytes, contentType)),
  listCohorts: (courseId: string) => request<{ items: Event[] }>("GET", `/v1/courses/${enc(courseId)}/cohorts`),
  createCohort: (courseId: string, input: CreateCohortInput) =>
    request<Event>("POST", `/v1/courses/${enc(courseId)}/cohorts`, input),

  listParties: () => request<{ items: Party[] }>("GET", "/v1/parties"),
  createParty: (input: CreatePartyInput) => request<Party>("POST", "/v1/parties", input),

  listSeats: (eventId: string) => request<{ items: Seat[] }>("GET", `/v1/seats?eventId=${enc(eventId)}`),
  checkIn: (input: { token?: string; code?: string; eventId?: string; undo?: boolean }) => request<CheckInResult>("POST", "/v1/checkins", input),

  listOrders: () => request<{ items: Order[] }>("GET", "/v1/orders"),
  listPromotions: () => request<{ items: Promotion[]; prices: PromotionPrices }>("GET", "/v1/promotions"),
  createPromotion: (input: { courseId: string; placement: "category" | "top"; weeks: 1 | 2 | 4 }) => request<{ promotion: Promotion; clientSecret: string | null }>("POST", "/v1/promotions", input),
  listCorporateAccounts: () => request<{ items: CorporateAccount[] }>("GET", "/v1/corporate-accounts"),
  createCorporateAccount: (input: { name: string; billingEmail: string; address: BillingAddress; poRequired?: boolean; netTermsDays?: number; currency?: string }) =>
    request<CorporateAccount>("POST", "/v1/corporate-accounts", input),
  listInvoices: () => request<{ items: Invoice[] }>("GET", "/v1/invoices"),
  invoicePayLink: (id: string) => request<{ url: string }>("GET", `/v1/invoices/${enc(id)}/pay-link`),
  recordInvoicePayment: (id: string, input: { amountMinor: number; method: InvoicePaymentMethod; reference?: string }) =>
    request<Invoice>("POST", `/v1/invoices/${enc(id)}/payments`, input),
  voidInvoice: (id: string, reason: string) => request<Invoice>("POST", `/v1/invoices/${enc(id)}/void`, { reason }),
  createInvoiceOrder: (input: CreateInvoiceOrderInput) => request<{ order: Order; invoice: Invoice; dryRun: boolean }>("POST", "/v1/invoice-orders", input),
  createOrder: (input: CreateOrderInput) => request<CreateOrderResult>("POST", "/v1/orders", input),

  getBalances: () => request<{ accounts: LedgerAccount[] }>("GET", "/v1/ledger/balances"),

  createRefund: (input: CreateRefundInput) => request<CreateRefundResult>("POST", "/v1/refunds", input),

  /** Revenue report for cohorts overlapping [from, to]; both bounds are ISO timestamps. */
  getRevenueReport: (from: string, to: string) =>
    request<RevenueReport>("GET", `/v1/reports/revenue?from=${enc(from)}&to=${enc(to)}`),
  listPayables: () => request<{ items: PayableItem[] }>("GET", "/v1/reports/payables"),

  listPayouts: () => request<{ items: Payout[] }>("GET", "/v1/payouts"),
  createPayout: (input: CreatePayoutInput) => request<{ payout: Payout }>("POST", "/v1/payouts", input),
};

/** Human-readable one-liner for any failure, used by inline error panels. */
export function describeFailure(failure: ApiFailure): string {
  if (failure.kind === "unreachable") {
    return `API unreachable at ${failure.url}`;
  }
  return failure.hint ? `${failure.message} (${failure.hint})` : failure.message;
}
