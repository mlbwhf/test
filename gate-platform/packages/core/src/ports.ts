import type { Currency, MinorUnits } from "@gate/ledger";
import type { BillingAddress, CorporateAccount, Course, Event, Invoice, Order, Organization, Party, Refund, Seat, TicketType } from "./types.js";

export interface Clock {
  now(): Date;
}
export interface IdGenerator {
  next(prefix: string): string;
}

/** Abstraction over Stripe Connect / Finix / Adyen. Everything is idempotent by key. */
export interface PaymentsPort {
  readonly provider: string;
  createConnectedAccount(input: {
    organizationId: string;
    country: string;
    email?: string;
    businessName: string;
  }): Promise<{ accountRef: string; onboardingUrl?: string }>;
  createPayment(input: {
    orderId: string;
    amountMinor: MinorUnits;
    currency: Currency;
    transferGroup: string;
    buyerEmail: string;
    metadata: Record<string, string>;
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
  }): Promise<{ refundRef: string; status: "pending" | "succeeded" | "failed" }>;
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
  refunds: RefundRepo;
  processedEvents: ProcessedEventRepo;
}
