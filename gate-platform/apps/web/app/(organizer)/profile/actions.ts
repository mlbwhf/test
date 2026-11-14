"use server";

import { revalidatePath } from "next/cache";
import { api, describeFailure, type CoursePage } from "@/lib/api";
import type { ActionState } from "@/components/action-form";

const IMAGE_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const f = (d: FormData, k: string) => String(d.get(k) ?? "").trim();
const fail = (message: string): ActionState => ({ status: "error", message });

function image(d: FormData, key: string): File | string | null {
  const file = d.get(key);
  if (!(file instanceof File) || file.size === 0) return null;
  if (!IMAGE_MIME.has(file.type)) return "Use a PNG, JPEG, WebP or GIF image.";
  if (file.size > 5 * 1024 * 1024) return "The image is larger than 5 MB.";
  return file;
}

/** Brand, profile address and the public profile's details. */
export async function saveProfileAction(_prev: ActionState, d: FormData): Promise<ActionState> {
  const name = f(d, "name");
  if (name.length < 2) return fail("Enter your organization's name.");
  const slug = f(d, "slug").toLowerCase();
  const accent = f(d, "accentColor");
  const r = await api.updateOrganization({
    name,
    slug: slug || null,
    accentColor: /^#[0-9a-fA-F]{6}$/.test(accent) ? accent : null,
    checkoutInvoices: d.get("checkoutInvoices") === "on",
    profile: { website: f(d, "website"), partnerLevel: f(d, "partnerLevel"), about: f(d, "about"), basedIn: f(d, "basedIn"), teachesIn: f(d, "teachesIn") },
  });
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/profile");
  return { status: "ok", message: r.data.slug ? `Saved. Your profile is live at enrollclass.com/o/${r.data.slug}.` : "Saved." };
}

/** The wide cover image (also the default class banner). */
export async function saveCoverAction(_prev: ActionState, d: FormData): Promise<ActionState> {
  let r;
  if (d.get("mode") === "remove") r = await api.updateOrganization({ profile: { coverUrl: "" } });
  else {
    const file = image(d, "cover");
    if (file === null) return fail("Choose an image.");
    if (typeof file === "string") return fail(file);
    r = await api.uploadOrganizationCover(await file.arrayBuffer(), file.type);
  }
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/profile");
  return { status: "ok", message: r.data.profile?.coverUrl ? "Cover saved." : "Cover removed." };
}

/** An instructor's title, short bio and photo, shown on class pages and the profile. */
export async function saveInstructorAction(_prev: ActionState, d: FormData): Promise<ActionState> {
  const id = f(d, "partyId");
  const name = f(d, "name");
  if (!id) return fail("Missing instructor.");
  const photo = image(d, "photo");
  if (typeof photo === "string") return fail(photo);
  const r = await api.updateParty(id, { ...(name ? { name } : {}), title: f(d, "title") || null, bio: f(d, "bio") || null });
  if (!r.ok) return fail(describeFailure(r.error));
  if (photo) {
    const p = await api.uploadPartyPhoto(id, await photo.arrayBuffer(), photo.type);
    if (!p.ok) return fail(describeFailure(p.error));
  }
  revalidatePath("/profile");
  return { status: "ok", message: `Saved ${name || "instructor"}.` };
}

/** The class page's sections and content, from the page designer. */
export async function savePageDesignAction(courseId: string, page: CoursePage): Promise<ActionState> {
  const r = await api.updateCourse(courseId, { page });
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath(`/courses/${courseId}`);
  return { status: "ok", message: "Published. The class page shows these changes now." };
}
