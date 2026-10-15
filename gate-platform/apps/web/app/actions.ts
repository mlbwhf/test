"use server";

import { revalidatePath } from "next/cache";
import { api, describeFailure } from "@/lib/api";
import { formatMoney, parseMajorToMinor, truncate } from "@/lib/format";
import type { ActionState } from "@/components/action-form";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function fail(message: string): ActionState {
  return { status: "error", message };
}

function positiveInt(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return n > 0 && Number.isSafeInteger(n) ? n : null;
}

export async function createEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const name = field(formData, "name");
  const startsAtRaw = field(formData, "startsAt");
  const currency = field(formData, "currency").toUpperCase();

  if (!name) return fail("Event name is required.");
  if (!startsAtRaw) return fail("Start date/time is required.");
  if (!/^[A-Z]{3}$/.test(currency)) return fail("Currency must be a 3-letter ISO code (e.g. EUR).");

  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) return fail("Start date/time is not a valid date.");

  const result = await api.createEvent({ name, startsAt: startsAt.toISOString(), currency });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath("/events");
  revalidatePath("/dashboard");
  return {
    status: "ok",
    message: `Created event "${result.data.name}".`,
    details: [
      { label: "Event ID", value: result.data.id },
      { label: "Status", value: result.data.status },
    ],
  };
}

export async function createTicketTypeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = field(formData, "eventId");
  const currency = field(formData, "currency").toUpperCase();
  const name = field(formData, "name");
  const priceRaw = field(formData, "price");
  const quantityRaw = field(formData, "quantity");

  if (!eventId) return fail("Missing event id.");
  if (!name) return fail("Ticket type name is required.");

  const priceMinor = parseMajorToMinor(priceRaw, currency || "USD");
  if (priceMinor === null) return fail(`Price must be a non-negative amount in ${currency || "the event currency"} (e.g. 12.50).`);

  const quantity = positiveInt(quantityRaw);
  if (quantity === null) return fail("Quantity must be a positive whole number.");

  const result = await api.createTicketType(eventId, { name, priceMinor, quantity });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath(`/events/${eventId}`);
  return {
    status: "ok",
    message: `Created ticket type "${result.data.name}".`,
    details: [
      { label: "Ticket type ID", value: result.data.id },
      { label: "Price", value: formatMoney(result.data.priceMinor, currency || "USD") },
      { label: "Quantity", value: String(result.data.quantity) },
    ],
  };
}

export async function sellTestTicketAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const eventId = field(formData, "eventId");
  const ticketTypeId = field(formData, "ticketTypeId");
  const quantityRaw = field(formData, "quantity");
  const buyerEmail = field(formData, "buyerEmail");

  if (!ticketTypeId) return fail("Pick a ticket type.");
  const quantity = positiveInt(quantityRaw);
  if (quantity === null) return fail("Quantity must be a positive whole number.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) return fail("Buyer email is not a valid email address.");

  const result = await api.createOrder({ ticketTypeId, quantity, buyerEmail });
  if (!result.ok) return fail(describeFailure(result.error));

  const { order, clientSecret } = result.data;
  const money = (minor: number) => formatMoney(minor, order.currency);

  if (eventId) revalidatePath(`/events/${eventId}`);
  revalidatePath("/orders");
  revalidatePath("/dashboard");

  return {
    status: "ok",
    message: `Order ${order.id} created (${order.status}).`,
    details: [
      { label: "Buyer", value: order.buyerEmail },
      { label: "Quantity", value: String(order.quantity) },
      { label: "Subtotal", value: money(order.pricing.subtotalMinor) },
      { label: "Platform fee", value: money(order.pricing.platformFeeMinor) },
      { label: "Attendee fee", value: money(order.pricing.attendeeFeeMinor) },
      { label: "Total charged", value: money(order.pricing.totalMinor) },
      { label: "Organizer net", value: money(order.pricing.organizerNetMinor) },
      { label: "Client secret", value: clientSecret ? truncate(clientSecret, 16) : "none (no payment required)" },
    ],
  };
}

export async function refundOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const orderId = field(formData, "orderId");
  const reason = field(formData, "reason") || "requested_by_customer";
  const currency = field(formData, "currency");

  if (!orderId) return fail("Missing order id.");

  const result = await api.createRefund({ orderId, reason });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidatePath("/orders");
  revalidatePath("/dashboard");

  const { refund } = result.data;
  return {
    status: "ok",
    message: `Refund ${refund.id} ${refund.status}.`,
    details: [
      {
        label: "Amount",
        value: currency ? formatMoney(refund.amountMinor, currency) : String(refund.amountMinor),
      },
    ],
  };
}
