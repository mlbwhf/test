"use server";

import { publicApi } from "@/lib/public-api";
import { describeFailure } from "@/lib/api";

export async function startInvoicePaymentAction(token: string): Promise<{ clientSecret?: string; error?: string }> {
  const r = await publicApi.startInvoicePayment(token);
  if (!r.ok) return { error: describeFailure(r.error) };
  return r.data.clientSecret ? { clientSecret: r.data.clientSecret } : { error: "Card payment isn't configured." };
}
