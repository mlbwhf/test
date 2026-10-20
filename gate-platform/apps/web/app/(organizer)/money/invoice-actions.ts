"use server";

import { revalidatePath } from "next/cache";
import { api, describeFailure, INVOICE_PAYMENT_METHODS, type CreateInvoiceOrderInput, type InvoicePaymentMethod } from "@/lib/api";
import { formatDateTime, formatMoney, parseMajorToMinor } from "@/lib/format";
import type { ActionState } from "@/components/action-form";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function fail(message: string): ActionState {
  return { status: "error", message };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function createCorporateAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = field(formData, "name");
  const billingEmail = field(formData, "billingEmail");
  const country = field(formData, "country").toUpperCase();
  const currency = field(formData, "currency").toUpperCase();
  const terms = Number(field(formData, "netTermsDays") || "30");
  if (!name) return fail("Company name is required.");
  if (!EMAIL_RE.test(billingEmail)) return fail("Enter the email address invoices go to.");
  if (!/^[A-Z]{2}$/.test(country)) return fail("Country must be a 2-letter code (e.g. US, GB, DE).");
  if (currency && !/^[A-Z]{3}$/.test(currency)) return fail("Currency must be a 3-letter code (e.g. USD).");
  if (!Number.isInteger(terms) || terms < 0 || terms > 180) return fail("Payment terms must be 0–180 days.");
  const address = {
    country,
    ...(field(formData, "line1") ? { line1: field(formData, "line1") } : {}),
    ...(field(formData, "city") ? { city: field(formData, "city") } : {}),
    ...(field(formData, "postalCode") ? { postalCode: field(formData, "postalCode") } : {}),
    ...(field(formData, "taxId") ? { taxId: field(formData, "taxId") } : {}),
  };
  const r = await api.createCorporateAccount({ name, billingEmail, address, netTermsDays: terms, poRequired: formData.get("poRequired") === "on", ...(currency ? { currency } : {}) });
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/money");
  return { status: "ok", message: `Added ${r.data.name}. You can now invoice them from any event.` };
}

export async function createInvoiceOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const corporateAccountId = field(formData, "corporateAccountId");
  const ticketTypeId = field(formData, "ticketTypeId");
  const quantity = Number(field(formData, "quantity"));
  const poNumber = field(formData, "poNumber");
  if (!corporateAccountId) return fail("Pick the company to invoice.");
  if (!ticketTypeId) return fail("Pick a ticket type.");
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) return fail("Seats must be a whole number from 1 to 500.");
  const emails = field(formData, "attendees").split(/[\s,;]+/).filter(Boolean);
  const bad = emails.find((e) => !EMAIL_RE.test(e));
  if (bad) return fail(`"${bad}" is not an email address.`);
  if (emails.length > quantity) return fail(`You listed ${emails.length} attendees for ${quantity} seat${quantity === 1 ? "" : "s"}.`);
  const input: CreateInvoiceOrderInput = { corporateAccountId, ticketTypeId, quantity };
  if (poNumber) input.poNumber = poNumber;
  if (emails.length) input.attendees = emails.map((email) => ({ email }));
  const r = await api.createInvoiceOrder(input);
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/money");
  const inv = r.data.invoice;
  return {
    status: "ok",
    message: `Invoice ${inv.number} issued and emailed to the billing contact with a pay link.`,
    details: [
      { label: "Total", value: formatMoney(inv.totalMinor, inv.currency) },
      { label: "Due", value: formatDateTime(inv.dueAt) },
      { label: "Seats", value: emails.length < quantity ? `${quantity} (${quantity - emails.length} under the billing contact until named)` : String(quantity) },
    ],
  };
}

export async function recordInvoicePaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "invoiceId");
  const currency = field(formData, "currency");
  const amountMinor = parseMajorToMinor(field(formData, "amount"), currency);
  const method = field(formData, "method") as InvoicePaymentMethod;
  const reference = field(formData, "reference");
  if (amountMinor === null || amountMinor <= 0) return fail(`Amount must be a positive amount in ${currency}.`);
  if (!INVOICE_PAYMENT_METHODS.includes(method)) return fail("Pick how it was paid.");
  const r = await api.recordInvoicePayment(id, { amountMinor, method, ...(reference ? { reference } : {}) });
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/money");
  return { status: "ok", message: r.data.status === "paid" ? `Invoice ${r.data.number} is paid in full.` : `Recorded. ${formatMoney(r.data.totalMinor - r.data.paidMinor, r.data.currency)} still outstanding.` };
}

export async function voidInvoiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const id = field(formData, "invoiceId");
  const reason = field(formData, "reason");
  if (!reason) return fail("Give a reason; it is kept with the invoice.");
  const r = await api.voidInvoice(id, reason);
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/money");
  return { status: "ok", message: `Invoice ${r.data.number} voided; its seats were released.` };
}
