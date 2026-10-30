"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { api, describeFailure, ROLES, type Role } from "@/lib/api";
import { safePath } from "@/lib/urls";
import type { ActionState } from "@/components/action-form";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const f = (d: FormData, k: string) => String(d.get(k) ?? "").trim();
const fail = (message: string): ActionState => ({ status: "error", message });

export async function emailSignInAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const email = f(data, "email").toLowerCase();
  if (!EMAIL_RE.test(email)) return fail("Enter a valid email address.");
  const r = await api.emailSignIn(email, safePath(f(data, "returnTo"), ""), f(data, "turnstileToken") || undefined);
  if (!r.ok) return fail(describeFailure(r.error));
  return { status: "ok", message: `Check ${email}. We sent a sign-in link that works for 20 minutes.` };
}

export async function createOrganizationAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const kind = f(data, "kind") === "company" ? "company" : f(data, "kind") === "individual" ? "individual" : "";
  if (!kind) return fail("Choose whether you are an organization or an independent instructor.");
  const name = f(data, "name");
  if (kind === "company" && !name) return fail("Enter your organization's name.");
  const country = f(data, "country").toUpperCase();
  const currency = f(data, "currency").toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) return fail("Choose a country.");
  if (!/^[A-Z]{3}$/.test(currency)) return fail("Choose a currency.");
  const r = await api.createOrganization({ kind, ...(name ? { name } : {}), country, currency });
  if (!r.ok) return fail(describeFailure(r.error));
  redirect("/dashboard?welcome=1");
}

export async function acceptInvitationAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const r = await api.acceptInvitation(f(data, "token"));
  if (!r.ok) return fail(describeFailure(r.error));
  redirect("/dashboard");
}

export async function switchOrganizationAction(data: FormData): Promise<void> {
  const r = await api.switchOrganization(f(data, "organizationId"));
  if (r.ok) revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function inviteAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const email = f(data, "email").toLowerCase();
  const role = f(data, "role") as Role;
  if (!EMAIL_RE.test(email)) return fail("Enter a valid email address.");
  if (!ROLES.includes(role)) return fail("Choose a role.");
  const r = await api.invite(email, role);
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/team");
  return r.data.emailed
    ? { status: "ok", message: `Invitation emailed to ${email}.` }
    : { status: "ok", message: `Invitation created. Email is not configured, so send this link to ${email} yourself:`, details: [{ label: "Link", value: r.data.acceptUrl }] };
}

export async function changeRoleAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const role = f(data, "role") as Role;
  if (!ROLES.includes(role)) return fail("Choose a role.");
  const r = await api.changeRole(f(data, "userId"), role);
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/team");
  return { status: "ok", message: "Role updated." };
}

export async function removeMemberAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const r = await api.removeMember(f(data, "userId"));
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/team");
  return { status: "ok", message: "Removed." };
}

export async function revokeInvitationAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const r = await api.revokeInvitation(f(data, "id"));
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/team");
  return { status: "ok", message: "Invitation withdrawn." };
}

export async function connectStripeAction(_prev: ActionState, _data: FormData): Promise<ActionState> {
  const r = await api.connectPayments();
  if (!r.ok) return fail(describeFailure(r.error));
  if (r.data.onboardingUrl) redirect(r.data.onboardingUrl);
  revalidatePath("/dashboard");
  return r.data.ready
    ? { status: "ok", message: "Stripe is connected: you can take payments and receive payouts." }
    : { status: "error", message: "Stripe still needs information before payouts can start. Try again in a moment." };
}

export async function setPaymentModeAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const mode = String(data.get("mode") ?? "");
  if (mode !== "protected" && mode !== "direct") return fail("Choose Protected or Direct.");
  const r = await api.setPaymentMode(mode);
  if (!r.ok) return fail(describeFailure(r.error));
  revalidatePath("/money");
  revalidatePath("/dashboard");
  const next = mode === "direct" ? "Direct: new payments go to your own Stripe account." : "Protected: new payments are held until each class is delivered.";
  return { status: "ok", message: r.data.setup === "ready" ? next : `${next} Connect the Stripe account for this mode to take card payments.` };
}
