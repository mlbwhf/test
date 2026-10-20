import type { Currency, MinorUnits } from "@gate/ledger";
import type { BillingAddress, Certificate, CorporateAccount, Course, Event, Invoice, MeetingInfo, MessageLogEntry, Order, Organization, Party, Payout, Refund, Seat, SeatTransfer, TicketType, WaitlistEntry } from "./types.js";

export interface Clock {
  now(): Date;
}
export interface IdGenerator {
  next(prefix: string): string;
}

/** Abstraction over Stripe Connect / Finix / Adyen. Everything is idempotent by key. */
/** What the payments provider says about an organizer's account right now. */
export interface PaymentsAccountStatus {
  /** Learners can be charged on this account's behalf. */
  chargesEnabled: boolean;
  /** Money can be paid out to the organizer's bank. */
  payoutsEnabled: boolean;
  /** The organizer finished the provider's onboarding form. */
  detailsSubmitted: boolean;
  /** Fields the provider still needs, in its own words (e.g. "external_account"). */
  requirementsDue: string[];
  disabledReason?: string | undefined;
}

export interface PaymentsPort {
  readonly provider: string;
  createConnectedAccount(input: {
    organizationId: string;
    country: string;
    email?: string;
    businessName: string;
    /** Independent instructors onboard as individuals, organizations as companies. */
    businessType?: "individual" | "company";
    /**
     * protected (default): the platform pays card fees and carries losses; funds arrive by transfer.
     * direct: the organizer's own account with the full provider dashboard, which pays its own card
     * fees and carries refunds and disputes.
     */
    mode?: "protected" | "direct";
  }): Promise<{ accountRef: string; onboardingUrl?: string }>;
  /** Live status of a connected account. */
  getAccountStatus(accountRef: string): Promise<PaymentsAccountStatus>;
  /** A fresh link to the provider's hosted onboarding, for resuming an unfinished setup. */
  createOnboardingLink(accountRef: string): Promise<string | undefined>;
  createPayment(input: {
    orderId: string;
    amountMinor: MinorUnits;
    currency: Currency;
    transferGroup: string;
    buyerEmail: string;
    metadata: Record<string, string>;
    /** Charge on the organizer's own account (a direct charge) and keep this application fee. */
    direct?: { accountRef: string; applicationFeeMinor: MinorUnits };
  }): Promise<{ paymentRef: string; clientSecret: string | null; status: "requires_payment" | "succeeded" }>;
  createTransfer(input: {
    idempotencyKey: string;
    paymentRef: string;
    destinationAccountRef: string;
    amountMinor: MinorUnits;
    currency: Currency;
    transferGroup: string;
  }): Promise<{ transferRef: string }>;
  refund(input: {
    idempotencyKey: string;
    paymentRef: string;
    amountMinor: MinorUnits;
    reason: string;
    /** The organizer's account that took a direct charge; the application fee is returned pro rata. */
    accountRef?: string | undefined;
  }): Promise<{ refundRef: string; status: "pending" | "succeeded" | "failed" }>;
}

/** Video meeting provider (Zoom, Teams). Adapters live in @gate/meetings; core only needs this surface. */
export interface MeetingProvider {
  readonly provider: MeetingInfo["provider"];
  createMeeting(req: { topic: string; startsAt: Date; durationMinutes: number; timezone: string; externalId: string; agenda?: string | undefined }): Promise<MeetingInfo>;
  getParticipants(meetingId: string): Promise<Array<{ email?: string | undefined; name?: string | undefined; joinedAt: Date; leftAt: Date; durationMinutes: number }>>;
}

/** Tax engine abstraction: flat-rate table in core, Stripe Tax or Avalara as adapters. */
export interface TaxPort {
  readonly provider: string;
  calculate(input: {
    currency: Currency;
    amountMinor: MinorUnits;
    sellerCountry: string;
    buyer: BillingAddress;
    /** True for B2B when a valid tax id is present and the seller accepts reverse charge. */
    businessCustomer: boolean;
  }): Promise<{ taxMinor: MinorUnits; rateBps: number; jurisdiction: string; reverseCharge: boolean }>;
}

/** Normalized provider webhook events. Adapters map provider payloads to these. */
export type PaymentEvent =
  | { type: "payment.succeeded"; paymentRef: string; amountMinor: MinorUnits; currency: Currency; providerEventId: string }
  | { type: "payment.failed"; paymentRef: string; reason: string; providerEventId: string }
  | { type: "refund.succeeded"; paymentRef: string; refundRef: string; amountMinor: MinorUnits; providerEventId: string }
  | { type: "refund.failed"; paymentRef: string; refundRef: string; reason: string; providerEventId: string }
  | { type: "account.updated"; accountRef: string; status: PaymentsAccountStatus; providerEventId: string }
  | { type: "ignored"; providerEventId: string; providerType: string };

export interface OrganizationRepo {
  create(org: Organization): Promise<void>;
  update(org: Organization): Promise<void>;
  get(id: string): Promise<Organization | undefined>;
  getByApiKeyHash(hash: string): Promise<Organization | undefined>;
  list(): Promise<Organization[]>;
}
export interface PartyRepo {
  create(p: Party): Promise<void>;
  get(id: string): Promise<Party | undefined>;
  listByOrganization(organizationId: string): Promise<Party[]>;
}
export interface CourseRepo {
  create(c: Course): Promise<void>;
  update(c: Course): Promise<void>;
  get(id: string): Promise<Course | undefined>;
  getBySlug(organizationId: string, slug: string): Promise<Course | undefined>;
  listByOrganization(organizationId: string): Promise<Course[]>;
}
export interface EventRepo {
  create(e: Event): Promise<void>;
  update(e: Event): Promise<void>;
  get(id: string): Promise<Event | undefined>;
  listByOrganization(organizationId: string): Promise<Event[]>;
  listByCourse(courseId: string): Promise<Event[]>;
}
export interface SeatRepo {
  create(s: Seat): Promise<void>;
  update(s: Seat): Promise<void>;
  get(id: string): Promise<Seat | undefined>;
  listByOrder(orderId: string): Promise<Seat[]>;
  listByEvent(eventId: string): Promise<Seat[]>;
}
export interface TicketTypeRepo {
  create(t: TicketType): Promise<void>;
  get(id: string): Promise<TicketType | undefined>;
  listByEvent(eventId: string): Promise<TicketType[]>;
  /** Atomically increment sold by qty if capacity allows; returns false when sold out. */
  reserve(id: string, qty: number): Promise<boolean>;
  release(id: string, qty: number): Promise<void>;
}
export interface OrderRepo {
  create(o: Order): Promise<void>;
  update(o: Order): Promise<void>;
  get(id: string): Promise<Order | undefined>;
  getByPaymentRef(paymentRef: string): Promise<Order | undefined>;
  getByIdempotencyKey(organizationId: string, key: string): Promise<Order | undefined>;
  listByOrganization(organizationId: string, limit?: number): Promise<Order[]>;
}
export interface SeatTransferRepo {
  create(t: SeatTransfer): Promise<void>;
  update(t: SeatTransfer): Promise<void>;
  get(id: string): Promise<SeatTransfer | undefined>;
  getByPaymentRef(ref: string): Promise<SeatTransfer | undefined>;
  listBySeat(seatId: string): Promise<SeatTransfer[]>;
}
export interface WaitlistRepo {
  create(e: WaitlistEntry): Promise<void>;
  update(e: WaitlistEntry): Promise<void>;
  get(id: string): Promise<WaitlistEntry | undefined>;
  /** Waiting + offered entries for an event, oldest first. */
  listOpenByEvent(eventId: string): Promise<WaitlistEntry[]>;
  listOffered(): Promise<WaitlistEntry[]>;
  findOpen(eventId: string, email: string): Promise<WaitlistEntry | undefined>;
}
export interface CertificateRepo {
  create(c: Certificate): Promise<void>;
  update(c: Certificate): Promise<void>;
  get(id: string): Promise<Certificate | undefined>;
  getByCode(code: string): Promise<Certificate | undefined>;
  getBySeat(seatId: string): Promise<Certificate | undefined>;
  listByEvent(eventId: string): Promise<Certificate[]>;
}
export interface MessageLogRepo {
  /** Returns false when the key was already recorded (idempotent sends). */
  record(entry: MessageLogEntry): Promise<boolean>;
  listByEvent(eventId: string): Promise<MessageLogEntry[]>;
}
export interface PayoutRepo {
  create(p: Payout): Promise<void>;
  listByOrganization(organizationId: string, limit?: number): Promise<Payout[]>;
}
export interface CorporateAccountRepo {
  create(a: CorporateAccount): Promise<void>;
  update(a: CorporateAccount): Promise<void>;
  get(id: string): Promise<CorporateAccount | undefined>;
  getByBillingEmail(organizationId: string, email: string): Promise<CorporateAccount | undefined>;
  listByOrganization(organizationId: string): Promise<CorporateAccount[]>;
}
export interface InvoiceRepo {
  create(i: Invoice): Promise<void>;
  update(i: Invoice): Promise<void>;
  get(id: string): Promise<Invoice | undefined>;
  getByOrder(orderId: string): Promise<Invoice | undefined>;
  getByCardPaymentRef(ref: string): Promise<Invoice | undefined>;
  listByOrganization(organizationId: string, filter?: { status?: Invoice["status"][] | undefined }): Promise<Invoice[]>;
  /** Atomically allocate the next sequence number for the organization and year. */
  nextNumber(organizationId: string, year: number): Promise<number>;
}
export interface RefundRepo {
  create(r: Refund): Promise<void>;
  update(r: Refund): Promise<void>;
  get(id: string): Promise<Refund | undefined>;
  getByProviderRef(ref: string): Promise<Refund | undefined>;
  listByOrder(orderId: string): Promise<Refund[]>;
}
/** Remembers provider event ids so webhooks replay safely. */
export interface ProcessedEventRepo {
  /** Returns true if newly recorded, false if already seen. */
  record(providerEventId: string): Promise<boolean>;
}

export interface Repos {
  organizations: OrganizationRepo;
  parties: PartyRepo;
  courses: CourseRepo;
  events: EventRepo;
  seats: SeatRepo;
  ticketTypes: TicketTypeRepo;
  orders: OrderRepo;
  corporateAccounts: CorporateAccountRepo;
  invoices: InvoiceRepo;
  seatTransfers: SeatTransferRepo;
  waitlist: WaitlistRepo;
  certificates: CertificateRepo;
  messageLog: MessageLogRepo;
  payouts: PayoutRepo;
  refunds: RefundRepo;
  processedEvents: ProcessedEventRepo;
}
