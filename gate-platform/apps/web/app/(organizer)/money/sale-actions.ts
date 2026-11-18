"use server";

import { revalidatePath } from "next/cache";
import { api, describeFailure } from "@/lib/api";

export type SaleResult = { ok: boolean; message: string };

/** Start or change the sale. Steps' end times come from the organizer's browser (end of the chosen day, their time). */
export async function saveSaleAction(input: { label: string; startsAt?: string; steps: { until: string; percentOff: number }[] }): Promise<SaleResult> {
  const r = await api.setSale(input);
  if (!r.ok) return { ok: false, message: describeFailure(r.error) };
  revalidatePath("/money");
  return { ok: true, message: "Sale saved. Prices on your class pages, checkout and Find a class update within a few minutes, and the enrollclass.com homepage shows the banner while it runs." };
}

export async function endSaleAction(): Promise<SaleResult> {
  const r = await api.endSale();
  if (!r.ok) return { ok: false, message: describeFailure(r.error) };
  revalidatePath("/money");
  return { ok: true, message: "Sale ended. Regular prices are back." };
}
