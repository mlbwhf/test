import type { Attendee, Certificate, CorporateAccount, Course, Event, Invoice, InvoiceReminderStep, Order, Organization, Refund, Seat, SequenceStep, TicketType, WaitlistEntry } from "./types.js";

export interface OrderPaidContext {
  organization: Organization;
  order: Order;
  event: Event;
  course?: Course | undefined;
  ticketType: TicketType;
  seats: Seat[];
}
export interface OrderRefundedContext {
  organization: Organization;
  order: Order;
  refund: Refund;
  fully: boolean;
  event: Event;
  course?: Course | undefined;
}

/**
 * Side effects after money facts are recorded: emails, CRM, calendars.
 * Hooks never affect the ledger. A failing hook is reported, not fatal,
 * so a CRM outage can't block a payment from settling.
 */
export interface InvoiceIssuedContext {
  organization: Organization;
  order: Order;
  invoice: Invoice;
  account: CorporateAccount;
  event: Event;
}

export type SeatChangedContext =
  | { kind: "substituted"; seat: Seat; previousAttendee: Attendee }
  | { kind: "transferred"; seat: Seat; previousSeat: Seat }
  | { kind: "cancelled"; seat: Seat; refund: Refund | null };

export interface WaitlistOfferedContext {
  entry: WaitlistEntry;
  event: Event;
  organization: Organization | null;
}

export interface CoreHooks {
  orderPaid?: ((ctx: OrderPaidContext) => Promise<void>) | undefined;
  orderRefunded?: ((ctx: OrderRefundedContext) => Promise<void>) | undefined;
  invoiceIssued?: ((ctx: InvoiceIssuedContext) => Promise<void>) | undefined;
  /** An open invoice reached a reminder step (see Core.runInvoiceReminders). */
  invoiceReminder?: ((ctx: InvoiceIssuedContext & { step: InvoiceReminderStep }) => Promise<void>) | undefined;
  seatChanged?: ((ctx: SeatChangedContext) => Promise<void>) | undefined;
  waitlistOffered?: ((ctx: WaitlistOfferedContext) => Promise<void>) | undefined;
  sequenceStep?: ((ctx: { step: SequenceStep; seat: Seat; event: Event; course?: Course | undefined; organization: Organization }) => Promise<void>) | undefined;
  cohortAtRisk?: ((ctx: { event: Event; organization: Organization; confirmed: number; minimum: number }) => Promise<void>) | undefined;
  cohortCancelled?: ((ctx: { event: Event; organization: Organization; target?: Event | undefined; refunded: number; transferred: number }) => Promise<void>) | undefined;
  certificateIssued?: ((ctx: { certificate: Certificate; seat: Seat; event: Event; course?: Course | undefined }) => Promise<void>) | undefined;
  /** A class was created (live or draft) or a draft was published. */
  eventCreated?: ((ctx: { event: Event }) => Promise<void>) | undefined;
  eventPublished?: ((ctx: { event: Event }) => Promise<void>) | undefined;
  /** Someone was checked in at the door. */
  checkedIn?: ((ctx: { seat: Seat }) => Promise<void>) | undefined;
}

export interface HookFailure {
  hook: keyof CoreHooks;
  orderId: string;
  error: string;
  at: Date;
}
