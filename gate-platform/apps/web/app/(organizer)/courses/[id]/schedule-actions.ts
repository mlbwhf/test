"use server";

import { revalidatePath } from "next/cache";
import { api, describeFailure, type ScheduleInput, type SchedulePlanRow } from "@/lib/api";

export async function scheduleAction(templateEventId: string, courseId: string, input: ScheduleInput): Promise<{ plan?: SchedulePlanRow[]; created?: number; error?: string }> {
  const r = await api.buildSchedule(templateEventId, input);
  if (!r.ok) return { error: describeFailure(r.error) };
  if (!input.dryRun) {
    revalidatePath(`/courses/${courseId}`);
    revalidatePath("/events");
  }
  return { plan: r.data.plan, created: r.data.created.length };
}
