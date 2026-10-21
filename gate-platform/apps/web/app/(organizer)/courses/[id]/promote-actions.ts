"use server";

import { revalidatePath } from "next/cache";
import { api, COURSE_CATEGORIES, describeFailure } from "@/lib/api";
import type { ActionState } from "@/components/action-form";

export async function updateCourseCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const courseId = String(formData.get("courseId") ?? "");
  const category = String(formData.get("category") ?? "");
  const language = String(formData.get("language") ?? "");
  if (category && !COURSE_CATEGORIES.some((c) => c.id === category)) return { status: "error", message: "Pick a topic from the list." };
  if (language && !/^[a-z]{2}$/.test(language)) return { status: "error", message: "Pick a language from the list." };
  const r = await api.updateCourse(courseId, { category: category || null, ...(formData.has("language") ? { language: language || null } : {}) });
  if (!r.ok) return { status: "error", message: describeFailure(r.error) };
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/courses");
  return { status: "ok", message: category ? "Saved. Find a class lists it under this topic." : "Saved. EnrollClass will pick the topic from the course name." };
}

export async function startPromotionAction(input: { courseId: string; placement: "category" | "top"; weeks: 1 | 2 | 4 }): Promise<{ clientSecret?: string; error?: string }> {
  const r = await api.createPromotion(input);
  if (!r.ok) return { error: describeFailure(r.error) };
  return r.data.clientSecret ? { clientSecret: r.data.clientSecret } : { error: "Card payment isn't configured." };
}
