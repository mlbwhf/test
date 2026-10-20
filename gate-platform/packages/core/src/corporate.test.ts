import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { codes } from "./accounts.js";
import { FakePaymentsAdapter } from "./fake-payments.js";
import { createInMemoryRepos } from "./memory-repos.js";
import { Core } from "./services.js";
import { FlatRateTax } from "./tax.js";
import type { InvoiceIssuedContext } from "./hooks.js";

let core: Core;
let payments: FakePaymentsAdapter;
let ledger: Ledger;
let now: Date;
const issued: InvoiceIssuedContext[] = [];

beforeEach(() => {
  now = new Date("2026-10-15T12:00:00Z");
  payments = new FakePaymentsAdapter();
  ledger = new Ledger({ store: new InMemoryLedgerStore() });
  issued.length = 0;
  core = new Core({ repos: createInMemoryRepos(), ledger, payments, tax: new FlatRateTax(), clock: { now: () => now }, hooks: [{ invoiceIssued: async (ctx) => { issued.push(ctx); } }] });
});

async function setup() {
  const { organization: org } = await core.createOrganization({ releasePolicy: "immediate", name: "Agile Agilist", country: "CA", currency: "CAD" });
  const course = await core.createCourse(org.id, { slug: "leading-safe", name: "Leading SAFe" });
  const cohort = await core.createEvent(org.id, { courseId: course.id, name: "Nov", startsAt: new Date("2026-11-20T14:00:00Z"), timezone: "America/Toronto" });
  const tt = await core.createTicketType(org.id, cohort.id, { name: "Std", priceMinor: 100_000, quantity: 10, prices: { USD: 80_000, GBP: 60_000 } });
  const bank = await core.createCorporateAccount(org.id, { name: "Big Bank", billingEmail: "ap@bigbank.ca", address: { country: "CA", region: "ON", postalCode: "M5H 1A1", line1: "1 Bay St", city: "Toronto" }, poRequired: true, netTermsDays: 30 });
  return { org, course, cohort, tt, bank };
}

describe("tax", () => {
  it("Ontario buyer of a Canadian seller pays 13% HST; foreign buyers are zero-rated; UK B2B with VAT id is reverse charged", async () => {
    const tax = new FlatRateTax();
    const on = await tax.calculate({ currency: "CAD", amountMinor: 100_000, sellerCountry: "CA", buyer: { country: "CA", region: "ON" }, businessCustomer: true });
    expect(on).toMatchObject({ taxMinor: 13_000, rateBps: 1_300, jurisdiction: "CA-ON" });
    const us = await tax.calculate({ currency: "USD", amountMinor: 100_000, sellerCountry: "CA", buyer: { country: "US", region: "NY" }, businessCustomer: false });
    expect(us.taxMinor).toBe(0);
    const uk = await tax.calculate({ currency: "GBP", amountMinor: 100_000, sellerCountry: "LT", buyer: { country: "GB", taxId: "GB123456789" }, businessCustomer: true });
    expect(uk).toMatchObject({ taxMinor: 0, reverseCharge: true });
    const de = await tax.calculate({ currency: "EUR", amountMinor: 100_000, sellerCountry: "LT", buyer: { country: "DE" }, businessCustomer: false });
    expect(de).toMatchObject({ taxMinor: 19_000, rateBps: 1_900 });
    const ae = await tax.calculate({ currency: "AED", amountMinor: 100_000, sellerCountry: "AE", buyer: { country: "AE" }, businessCustomer: true });
    expect(ae.taxMinor).toBe(5_000);
  });

  it("card orders with a billing address carry tax to a tax-payable account; without one no tax is calculated", async () => {
    const { org, tt } = await setup();
    const taxed = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "a@b.ca", billingAddress: { country: "CA", region: "ON" } });
    expect(taxed.order.pricing.taxMinor).toBe(13_000);
    expect(taxed.order.pricing.totalMinor).toBe(113_000);
    expect(taxed.order.pricing.organizerNetMinor).toBe(100_000 - 4_990);
    await core.handlePaymentEvent(payments.succeed(taxed.order.paymentRef!, 113_000, "CAD"));
    const bal = await core.balancesFor(org.id);
    expect(bal.find((b) => b.code === codes.taxPayable(org.id, "CAD"))?.balanceMinor).toBe(13_000);
    await ledger.assertBalanced();
    const untaxed = await core.createOrder(org.id, { ticketTypeId: tt.id, quantity: 1, buyerEmail: "a@b.ca" });
    expect(untaxed.order.pricing.taxMinor).toBe(0);
  });
});

describe("corporate invoice orders", () => {
  it("issues a numbered invoice with net terms and tax, reserves seats, and requires a PO when the account demands one", async () => {
    const { org, tt, bank } = await setup();
    await expect(core.createInvoiceOrder(org.id, { corporateAccountId: bank.id, ticketTypeId: tt.id, quantity: 3 })).rejects.toMatchObject({ code: "VALIDATION", hint: expect.stringContaining("purchase order") });
    const { order, invoice, created } = await core.createInvoiceOrder(org.id, { corporateAccountId: bank.id, ticketTypeId: tt.id, quantity: 3, poNumber: "PO-4471", attendees: [{ email: "x@bigbank.ca", name: "X" }], idempotencyKey: "bb-1" });
    expect(created).toBe(true);
    expect(order.paymentMethod).toBe("invoice");
    expect(order.status).toBe("pending");
    expect(order.attendees[1]).toEqual({ email: "ap@bigbank.ca", company: "Big Bank" });
    expect(invoice.number).toBe("INV-2026-0001");
    expect(invoice.poNumber).toBe("PO-4471");
    expect(invoice.subtotalMinor).toBe(300_000);
    expect(invoice.taxMinor).toBe(39_000);
    expect(invoice.totalMinor).toBe(339_000);
    expect(invoice.dueAt.toISOString()).toBe("2026-11-14T12:00:00.000Z");
    expect(issued).toHaveLength(1);
    expect(issued[0]!.account.name).toBe("Big Bank");
    const seats = await core.listSeats(org.id, { orderId: order.id });
    expect(seats.map((s) => s.status)).toEqual(["reserved", "reserved", "reserved"]);
    expect((await core.listTicketTypes(org.id, tt.eventId))[0]?.sold).toBe(3);
    const again = await core.createInvoiceOrder(org.id, { corporateAccountId: bank.id, ticketTypeId: tt.id, quantity: 3, poNumber: "PO-4471", idempotencyKey: "bb-1" });
    expect(again.created).toBe(false);
    expect(again.invoice.id).toBe(invoice.id);
    const second = await core.createInvoiceOrder(org.id, { corporateAccountId: bank.id, ticketTypeId: tt.id, quantity: 1, poNumber: "PO-4472" });
    expect(second.invoice.number).toBe("INV-2026-0002");
    expect(payments.calls.filter((c) => c.method === "createPayment")).toHaveLength(0);
  });

  it("partial bank payments sit in customer deposits; the final payment settles the order, confirms seats and clears deposits", async () => {
    const { org, tt, bank } = await setup();
    const { order, invoice } = await core.createInvoiceOrder(org.id, { corporateAccountId: bank.id, ticketTypeId: tt.id, quantity: 2, poNumber: "PO-1" });
    const part = await core.recordInvoicePayment(org.id, { invoiceId: invoice.id, amountMinor: 100_000, method: "bank_transfer", reference: "WIRE-1" });
    expect(part.status).toBe("partially_paid");
    expect(part.paidMinor).toBe(100_000);
    let platform = await core.platformBalances();
    expect(platform.find((b) => b.code === codes.bankClearing("CAD"))?.balanceMinor).toBe(100_000);
    expect(platform.find((b) => b.code === codes.customerDeposits("CAD"))?.balanceMinor).toBe(100_000);
    expect((await core.getOrder(org.id, order.id)).status).toBe("pending");
    await expect(core.recordInvoicePayment(org.id, { invoiceId: invoice.id, amountMinor: 999_999, method: "wire" })).rejects.toMatchObject({ code: "VALIDATION" });

    const done = await core.recordInvoicePayment(org.id, { invoiceId: invoice.id, amountMinor: invoice.totalMinor - 100_000, method: "wire", reference: "WIRE-2" });
    expect(done.status).toBe("paid");
    expect(done.payments).toHaveLength(2);
    const paid = await core.getOrder(org.id, order.id);
    expect(paid.status).toBe("paid");
    expect(paid.transferRefs).toEqual({}); // invoice cash pays out via payouts, not Stripe transfers
    expect((await core.listSeats(org.id, { orderId: order.id })).every((s) => s.status === "confirmed")).toBe(true);
    platform = await core.platformBalances();
    expect(platform.find((b) => b.code === codes.bankClearing("CAD"))?.balanceMinor).toBe(invoice.totalMinor);
    expect(platform.find((b) => b.code === codes.customerDeposits("CAD"))?.balanceMinor).toBe(0);
    const bal = await core.balancesFor(org.id);
    expect(bal.find((b) => b.code === codes.orgPayable(org.id, "CAD"))?.balanceMinor).toBe(200_000 - 9_980);
    expect(bal.find((b) => b.code === codes.taxPayable(org.id, "CAD"))?.balanceMinor).toBe(26_000);
    await ledger.assertBalanced();
    await expect(core.recordInvoicePayment(org.id, { invoiceId: invoice.id, amountMinor: 1, method: "wire" })).rejects.toMatchObject({ code: "INVALID_STATE" });
  });

  it("an invoice can be paid by card: the provider webhook settles it", async () => {
    const { org, tt, bank } = await setup();
    const { order, invoice } = await core.createInvoiceOrder(org.id, { corporateAccountId: bank.id, ticketTypeId: tt.id, quantity: 1, poNumber: "PO-9" });
    const { clientSecret, paymentRef } = await core.createInvoiceCardPayment(org.id, invoice.id);
    expect(clientSecret).toContain("secret");
    const r = await core.handlePaymentEvent(payments.succeed(paymentRef, invoice.totalMinor, "CAD"));
    expect(r.handled).toBe(true);
    expect((await core.getInvoice(org.id, invoice.id)).status).toBe("paid");
    expect((await core.getOrder(org.id, order.id)).status).toBe("paid");
    expect((await core.platformBalances()).find((b) => b.code === codes.clearing("CAD"))?.balanceMinor).toBe(invoice.totalMinor);
    await ledger.assertBalanced();
  });

  it("voiding an unpaid invoice cancels the order and frees the seats; refunds of invoice orders settle from bank clearing", async () => {
    const { org, tt, bank } = await setup();
    const a = await core.createInvoiceOrder(org.id, { corporateAccountId: bank.id, ticketTypeId: tt.id, quantity: 4, poNumber: "PO-1" });
    expect((await core.listTicketTypes(org.id, tt.eventId))[0]?.sold).toBe(4);
    const voided = await core.voidInvoice(org.id, a.invoice.id, "buyer withdrew");
    expect(voided.status).toBe("void");
    expect((await core.getOrder(org.id, a.order.id)).status).toBe("cancelled");
    expect((await core.listTicketTypes(org.id, tt.eventId))[0]?.sold).toBe(0);
    expect((await core.listSeats(org.id, { orderId: a.order.id })).every((s) => s.status === "cancelled")).toBe(true);

    const b = await core.createInvoiceOrder(org.id, { corporateAccountId: bank.id, ticketTypeId: tt.id, quantity: 1, poNumber: "PO-2" });
    await core.recordInvoicePayment(org.id, { invoiceId: b.invoice.id, amountMinor: b.invoice.totalMinor, method: "bank_transfer" });
    await expect(core.voidInvoice(org.id, b.invoice.id, "x")).rejects.toMatchObject({ code: "INVALID_STATE" });
    const refund = await core.refundOrder(org.id, { orderId: b.order.id, reason: "cancelled cohort" });
    expect(refund.status).toBe("succeeded");
    expect((await core.platformBalances()).find((x) => x.code === codes.bankClearing("CAD"))?.balanceMinor).toBe(0);
    expect((await core.balancesFor(org.id)).find((x) => x.code === codes.taxPayable(org.id, "CAD"))?.balanceMinor).toBe(0);
    await ledger.assertBalanced();
  });

  it("receivables ageing buckets open invoices by days past due", async () => {
    const { org, tt, bank } = await setup();
    const a = await core.createInvoiceOrder(org.id, { corporateAccountId: bank.id, ticketTypeId: tt.id, quantity: 1, poNumber: "PO-1" });
    const b = await core.createInvoiceOrder(org.id, { corporateAccountId: bank.id, ticketTypeId: tt.id, quantity: 2, poNumber: "PO-2", dueDays: 0 });
    await core.recordInvoicePayment(org.id, { invoiceId: b.invoice.id, amountMinor: 50_000, method: "wire" });
    const report = await core.receivablesAgeing(org.id, new Date("2026-11-30T00:00:00Z"));
    expect(report.byCurrency.CAD).toEqual({ current: 0, d1_30: a.invoice.totalMinor, d31_60: b.invoice.totalMinor - 50_000, d61_90: 0, d90_plus: 0 });
    expect(report.items.find((i) => i.invoiceId === b.invoice.id)?.daysPastDue).toBe(45);
  });

  it("validates corporate accounts", async () => {
    const { org } = await setup();
    await expect(core.createCorporateAccount(org.id, { name: "", billingEmail: "a@b.co", address: { country: "CA" } })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(core.createCorporateAccount(org.id, { name: "X", billingEmail: "nope", address: { country: "CA" } })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(core.createCorporateAccount(org.id, { name: "X", billingEmail: "a@b.co", address: { country: "Canada" } })).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(core.createCorporateAccount(org.id, { name: "X", billingEmail: "a@b.co", address: { country: "CA" }, netTermsDays: 365 })).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
