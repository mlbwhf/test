"use server";

import { revalidatePath } from "next/cache";
import { api, describeFailure } from "@/lib/api";
import type { ActionState } from "@/components/action-form";

const fail = (message: string): ActionState => ({ status: "error", message });
const done = (message: string, details?: ActionState["details"]): ActionState => {
  revalidatePath("/integrations");
  return { status: "ok", message, ...(details ? { details } : {}) };
};

export async function createApiKeyAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const name = String(data.get("name") ?? "").trim();
  const access = data.get("access") === "read" ? "read" : "full";
  if (!name) return fail("Name the key after where you'll use it, e.g. Zapier.");
  const r = await api.createApiKey(name, access);
  if (!r.ok) return fail(describeFailure(r.error));
  // The only time the key is shown; it is stored hashed.
  return done("Copy this key now. It won't be shown again.", [{ label: "Key", value: r.data.secret }]);
}

export async function revokeApiKeyAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const r = await api.revokeApiKey(String(data.get("id") ?? ""));
  if (!r.ok) return fail(describeFailure(r.error));
  return done("Key revoked. Anything using it stops working now.");
}

export async function createWebhookAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const url = String(data.get("url") ?? "").trim();
  const events = data.getAll("events").map(String);
  const description = String(data.get("description") ?? "").trim();
  if (!url) return fail("Paste the URL from Zapier, Make, n8n or your own server.");
  if (!events.length) return fail("Pick at least one event.");
  const r = await api.createWebhook({ url, events, ...(description ? { description } : {}) });
  if (!r.ok) return fail(describeFailure(r.error));
  return done("Webhook added. Send a test to check it's reachable.");
}

export async function toggleWebhookAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const r = await api.updateWebhook(String(data.get("id") ?? ""), { enabled: data.get("enabled") === "1" });
  if (!r.ok) return fail(describeFailure(r.error));
  return done(r.data.enabled ? "Webhook turned on." : "Webhook paused.");
}

export async function testWebhookAction(_prev: ActionState, data: FormData): Promise<ActionState> {
  const r = await api.testWebhook(String(data.get("id") ?? ""));
  if (!r.ok) return fail(describeFailure(r.error));
  return r.data.status === "succeeded"
    ? done(`Delivered (HTTP ${r.data.responseStatus}).`)
    : { status: "error", message: `Not delivered: ${r.data.error ?? `HTTP ${r.data.responseStatus}`}.` };
}
