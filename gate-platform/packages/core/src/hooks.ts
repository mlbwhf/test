import type { CorporateAccount, Course, Event, Invoice, Order, Organization, Refund, Seat, TicketType } from "./types.js";

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

export interface CoreHooks {
  orderPaid?: ((ctx: OrderPaidContext) => Promise<void>) | undefined;
  orderRefunded?: ((ctx: OrderRefundedContext) => Promise<void>) | undefined;
  invoiceIssued?: ((ctx: InvoiceIssuedContext) => Promise<void>) | undefined;
}

export interface HookFailure {
  hook: keyof CoreHooks;
  orderId: string;
  error: string;
  at: Date;
}
