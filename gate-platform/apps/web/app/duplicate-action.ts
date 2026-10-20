"use server";

import { revalidatePath } from "next/cache";
import { api, describeFailure } from "@/lib/api";

export type DuplicateResult = { ok: true; ids: string[] } | { ok: false; error: string; ids: string[] };

/** One copy per date (YYYY-MM-DD, first day in the cohort's time zone); null keeps the original dates. */
export async function duplicateEventAction(eventId: string, dates: Array<string | null>): Promise<DuplicateResult> {
  if (dates.length < 1 || dates.length > 12) return { ok: false, error: "Make between 1 and 12 copies.", ids: [] };
  const ids: string[] = [];
  for (const d of dates) {
    if (d !== null && !/^\d{4}-\d{2}-\d{2}$/.test(d)) return { ok: false, error: `"${d}" is not a date.`, ids };
    const r = await api.duplicateEvent(eventId, d ? { startDate: d } : {});
    if (!r.ok) return { ok: false, error: `${ids.length ? `Made ${ids.length}, then: ` : ""}${describeFailure(r.error)}`, ids };
    ids.push(r.data.event.id);
  }
  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { ok: true, ids };
}
