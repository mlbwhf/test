"use server";

// Learner self-service actions. These call the PUBLIC client only (no api key):
// the seat id plus the attendee's email submitted with the form are the credential.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { describeFailure } from "@/lib/api";
import { publicApi, seatPagePath, type PublicSeat } from "@/lib/public-api";
import { formatMoney } from "@/lib/format";
import type { ActionState } from "@/components/action-form";
import type { TransferState } from "@/components/transfer-form";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function fail(message: string): ActionState {
  return { status: "error", message };
}

/** Credential pair every learner form carries as hidden inputs. */
function credential(formData: FormData): { seatId: string; email: string } | ActionState {
  const seatId = field(formData, "seatId");
  const email = field(formData, "email");
  if (!seatId) return fail("Missing seat id. Open the link from your confirmation email.");
  if (!EMAIL_RE.test(email)) return fail("Open the link from your confirmation email.");
  return { seatId, email };
}

function isState(value: { seatId: string; email: string } | ActionState): value is ActionState {
  return "status" in value;
}

function revalidateSeat(seatId: string) {
  revalidatePath(`/my/seat/${encodeURIComponent(seatId)}`);
}

function seatPage(seatId: string, email: string, notice: string, extra: Record<string, string> = {}): string {
  const params = new URLSearchParams({ notice, ...extra });
  return `${seatPagePath(seatId, email)}&${params.toString()}`;
}

export async function substituteSeatAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const cred = credential(formData);
  if (isState(cred)) return cred;

  const name = field(formData, "newName");
  const newEmail = field(formData, "newEmail");
  const company = field(formData, "newCompany");

  if (!name) return fail("The new attendee's name is required.");
  if (!EMAIL_RE.test(newEmail)) return fail("The new attendee's email is not a valid email address.");
  if (newEmail.toLowerCase() === cred.email.toLowerCase()) return fail("The new attendee must have a different email address.");

  const result = await publicApi.substitute(cred.seatId, {
    email: cred.email,
    attendee: { email: newEmail, name, ...(company ? { company } : {}) },
  });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidateSeat(cred.seatId);
  // The seat now belongs to the new attendee, so the current link (old email)
  // no longer opens it: continue on the new attendee's link.
  const seat: PublicSeat = result.data.seat;
  redirect(seatPage(seat.id, seat.attendee.email, "substituted"));
}

export async function transferSeatAction(_prev: TransferState, formData: FormData): Promise<TransferState> {
  const cred = credential(formData);
  if (isState(cred)) return cred;

  const toEventId = field(formData, "toEventId");
  const currency = field(formData, "currency").toUpperCase() || "USD";
  if (!toEventId) return fail("Pick the cohort to move to.");

  const result = await publicApi.transfer(cred.seatId, { email: cred.email, toEventId });
  if (!result.ok) return fail(describeFailure(result.error));

  const { seat, transfer, clientSecret, stripeAccount } = result.data;
  revalidateSeat(cred.seatId);
  if (seat) revalidateSeat(seat.id);

  if (transfer.status === "completed") {
    // Land on the new seat when the API returned it; otherwise the original
    // seat page shows "This seat was transferred" with a link to the new one.
    redirect(seatPage(seat ? seat.id : cred.seatId, cred.email, "transferred"));
  }

  return {
    status: "ok",
    message: `Transfer ${transfer.id} is reserved. A fee of ${formatMoney(transfer.feeMinor, currency)} is due to complete it.`,
    details: [
      { label: "Fee", value: formatMoney(transfer.feeMinor, currency) },
      { label: "Status", value: transfer.status },
    ],
    payment: {
      transferId: transfer.id,
      feeMinor: transfer.feeMinor,
      currency,
      paymentRef: transfer.paymentRef ?? null,
      clientSecret,
      stripeAccount: stripeAccount ?? null,
      seatId: cred.seatId,
      newSeatId: seat ? seat.id : null,
      email: cred.email,
    },
  };
}

export async function simulateFeePaymentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const cred = credential(formData);
  if (isState(cred)) return cred;

  const paymentRef = field(formData, "paymentRef");
  const newSeatId = field(formData, "newSeatId");
  if (!paymentRef) return fail("Missing payment reference.");

  const result = await publicApi.devSucceedPayment(paymentRef);
  if (!result.ok) return fail(describeFailure(result.error));
  if (!result.data.handled) return fail(`Payment was not applied${result.data.reason ? ` (${result.data.reason})` : ""}.`);

  revalidateSeat(cred.seatId);
  if (newSeatId) revalidateSeat(newSeatId);
  redirect(seatPage(newSeatId || cred.seatId, cred.email, "paid"));
}

export async function cancelSeatAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const cred = credential(formData);
  if (isState(cred)) return cred;

  const reason = field(formData, "reason");
  const confirmed = formData.get("confirm") === "on";
  if (!confirmed) return fail("Tick the box to confirm you want to cancel this registration.");

  const result = await publicApi.cancel(cred.seatId, { email: cred.email, ...(reason ? { reason } : {}) });
  if (!result.ok) return fail(describeFailure(result.error));

  revalidateSeat(cred.seatId);
  const { refund } = result.data;
  redirect(
    seatPage(cred.seatId, cred.email, "cancelled", refund ? { refundMinor: String(refund.amountMinor), refundStatus: refund.status } : {}),
  );
}
