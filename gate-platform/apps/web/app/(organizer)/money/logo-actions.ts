"use server";

import { revalidatePath } from "next/cache";
import { api, describeFailure } from "@/lib/api";
import type { ActionState } from "@/components/action-form";

const IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function updateOrganizationLogoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const file = formData.get("logo");
  let result;
  if (formData.get("mode") === "remove") result = await api.removeOrganizationLogo();
  else if (file instanceof File && file.size > 0) {
    if (!IMAGE_MIME.has(file.type)) return { status: "error", message: "Use a PNG, JPEG, WebP or GIF image." };
    if (file.size > 5 * 1024 * 1024) return { status: "error", message: "The logo is larger than 5 MB." };
    result = await api.uploadOrganizationLogo(await file.arrayBuffer(), file.type);
  } else return { status: "error", message: "Choose a logo file." };
  if (!result.ok) return { status: "error", message: describeFailure(result.error) };
  revalidatePath("/money");
  return { status: "ok", message: result.data.logoUrl ? "Logo saved. It shows in Find a class within a few minutes." : "Logo removed." };
}
