import type { Currency, MinorUnits } from "@gate/ledger";
import type { Event, Order, Organization, Party, Refund, TicketType } from "./types.js";

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
export interface EventRepo {
  create(e: Event): Promise<void>;
  update(e: Event): Promise<void>;
  get(id: string): Promise<Event | undefined>;
  listByOrganization(organizationId: string): Promise<Event[]>;
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
  events: EventRepo;
  ticketTypes: TicketTypeRepo;
  orders: OrderRepo;
  refunds: RefundRepo;
  processedEvents: ProcessedEventRepo;
}
