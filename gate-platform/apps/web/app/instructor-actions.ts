"use server";

import { revalidatePath } from "next/cache";
import { api, describeFailure, type InstructorAccess } from "@/lib/api";
import type { ActionState } from "@/components/action-form";

const fail = (message: string): ActionState => ({ status: "error", message });

export async function updateInstructorAccessAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const scope = String(data.get("scope") ?? "");
  const publish = String(data.get("publish") ?? "");
  if (!["own", "all"].includes(scope) || !["direct", "approval"].includes(publish)) return fail("Pick both settings.");
  const r = await api.updateInstructorAccess({ scope: scope as InstructorAccess["scope"], publish: publish as InstructorAccess["publish"] });
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/team");
  return { status: "ok", message: "Saved. Instructors see the change on their next page load." };
}

export async function publishEventAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const id = String(data.get("eventId") ?? "");
  const r = await api.publishEvent(id);
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { status: "ok", message: "Published: registration is open." };
}

export async function setInstructorsAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const id = String(data.get("eventId") ?? "");
  const ids = data.getAll("instructorIds").map(String).filter(Boolean);
  const r = await api.setEventInstructors(id, ids);
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/events");
  return { status: "ok", message: ids.length ? "Instructors updated." : "No instructor assigned." };
}

/** Events pane: certificates for this class, from an organizer or its instructor. */
export async function issuePaneCertificatesAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const id = String(data.get("eventId") ?? "");
  const kind = data.get("kind") === "completion" ? "completion" : "attendance";
  const onlyCheckedIn = data.get("onlyCheckedIn") === "on";
  const r = await api.issueCertificates(id, { kind, ...(onlyCheckedIn ? { onlyCheckedIn } : {}) });
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/events");
  const n = r.data.issued.length;
  return { status: "ok", message: n ? `Issued ${n} certificate${n === 1 ? "" : "s"} and emailed each learner their link.` : "Nothing new to issue: everyone eligible already has one." };
}
