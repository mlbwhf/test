// Payment through Stripe Checkout for the Trainer and Academy plans. The API talks to
// Stripe's REST API directly (no SDK): a Checkout Session per sign-up, and a webhook that,
// once the session is paid, creates the user and keeps the key for one pickup from the
// welcome page. Without STRIPE_SECRET_KEY the routes report billing as off and the sign-up
// stays a request an admin fulfils by hand.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { hashKey, newKey, type User } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Plan } from "./signups.js";
import type { Store } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

export interface BillingOptions {
  secretKey?: string;
  webhookSecret?: string;
  /** Stripe price ids per plan and interval. */
  prices?: Partial<Record<`${"trainer" | "academy"}-${"monthly" | "yearly"}`, string>>;
  /** Where Stripe sends people back: the website's origin. */
  webUrl?: string;
  fetch?: typeof fetch;
  /** Trial days on new subscriptions (0 = none). */
  trialDays?: number;
}

export interface Purchase {
  id: string;
  signupId: string;
  plan: Plan;
  interval: "monthly" | "yearly";
  quantity: number;
  checkoutSessionId: string;
  status: "open" | "paid" | "expired";
  customerId?: string;
  subscriptionId?: string;
  userId?: string;
  /** The API key, kept until the welcome page picks it up once. */
  pendingKey?: string;
  createdAt: string;
  paidAt?: string;
}

const form = (o: Record<string, string | number | undefined>) =>
  Object.entries(o)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

/** Stripe's signature header: t=…,v1=… over `${t}.${payload}` with the endpoint secret. */
export function verifyStripeSignature(payload: string, header: string | undefined, secret: string, now = Date.now(), toleranceSeconds = 300): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const t = parts.t;
  const v1 = parts.v1;
  if (!t || !v1) return false;
  if (Math.abs(now / 1000 - Number(t)) > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function registerBillingRoutes(app: App, store: Store, opts: BillingOptions = {}) {
  const enabled = !!opts.secretKey;
  const f = opts.fetch ?? fetch;
  const purchases = () => (store.state.purchases ??= []);
  const stripe = async (path: string, body: Record<string, string | number | undefined>) => {
    const res = await f(`https://api.stripe.com/v1/${path}`, { method: "POST", headers: { authorization: `Bearer ${opts.secretKey}`, "content-type": "application/x-www-form-urlencoded" }, body: form(body) });
    const json = (await res.json()) as { error?: { message?: string } } & Record<string, unknown>;
    if (!res.ok) throw new ApiError(502, "STRIPE", json.error?.message ?? `Stripe answered ${res.status}.`);
    return json;
  };

  app.get("/v1/billing/config", async () => ({
    enabled,
    plans: enabled ? Object.fromEntries(Object.entries(opts.prices ?? {}).map(([k, v]) => [k, !!v])) : {},
    trialDays: opts.trialDays ?? 0,
  }));

  // Start Checkout for a sign-up. Public: the sign-up id is the handle, the email on it is
  // what Stripe shows; nothing about other people is exposed.
  app.post("/v1/billing/checkout", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } }, schema: { body: z.object({ signupId: z.string().min(1).max(80), interval: z.enum(["monthly", "yearly"]).default("monthly"), quantity: z.number().int().min(1).max(500).default(1) }) } }, async (req) => {
    if (!enabled) throw new ApiError(409, "BILLING_OFF", "Payments are not set up on this server; the sign-up will be handled by hand.");
    const signup = (store.state.signups ?? []).find((s) => s.id === req.body.signupId) ?? (() => { throw notFound("Sign-up"); })();
    if (signup.plan === "practice") throw new ApiError(422, "FREE_PLAN", "Practice is free; nothing to pay.");
    const price = opts.prices?.[`${signup.plan}-${req.body.interval}`];
    if (!price) throw new ApiError(409, "NO_PRICE", `No Stripe price is configured for ${signup.plan} ${req.body.interval}.`);
    const web = (opts.webUrl ?? "").replace(/\/$/, "");
    const session = await stripe("checkout/sessions", {
      mode: "subscription",
      "line_items[0][price]": price,
      "line_items[0][quantity]": req.body.quantity,
      customer_email: signup.email,
      client_reference_id: signup.id,
      "metadata[signupId]": signup.id,
      "metadata[plan]": signup.plan,
      "subscription_data[metadata][signupId]": signup.id,
      ...(opts.trialDays ? { "subscription_data[trial_period_days]": opts.trialDays } : {}),
      allow_promotion_codes: "true",
      success_url: `${web}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${web}/#pricing`,
    });
    const p: Purchase = { id: `pur-${store.now().getTime().toString(36)}`, signupId: signup.id, plan: signup.plan, interval: req.body.interval, quantity: req.body.quantity, checkoutSessionId: String(session.id), status: "open", createdAt: store.now().toISOString() };
    purchases().push(p);
    await store.commit(req.principal, "billing.checkout", { purchase: p.id, plan: p.plan, interval: p.interval, quantity: p.quantity });
    return { url: session.url, purchaseId: p.id };
  });

  // Stripe calls this. The signature covers the raw body, so this route lives in its own
  // encapsulated plugin with a JSON parser that keeps the body as a string.
  await app.register(async (sub) => {
    sub.addContentTypeParser("application/json", { parseAs: "string" }, (_req, body, done) => done(null, body));
    sub.post("/v1/webhooks/stripe", async (req, reply) => {
      if (!enabled || !opts.webhookSecret) throw new ApiError(404, "BILLING_OFF", "Payments are not set up.");
      const raw = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
      if (!verifyStripeSignature(raw, req.headers["stripe-signature"] as string | undefined, opts.webhookSecret, store.now().getTime())) throw new ApiError(400, "BAD_SIGNATURE", "Stripe signature does not verify.");
      let event: { type: string; data: { object: Record<string, unknown> } };
      try {
        event = JSON.parse(raw) as typeof event;
      } catch {
        throw new ApiError(400, "BAD_JSON", "The webhook body is not JSON.");
      }
      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const obj = event.data.object;
        const purchase = purchases().find((p) => p.checkoutSessionId === obj.id);
        const signupId = String((obj.metadata as Record<string, string> | undefined)?.signupId ?? obj.client_reference_id ?? purchase?.signupId ?? "");
        const signup = (store.state.signups ?? []).find((s) => s.id === signupId);
        if (!signup) return reply.code(200).send({ ignored: "unknown sign-up" });
        if (purchase?.status === "paid") return reply.code(200).send({ ok: true, already: true });
        if (String(obj.payment_status ?? "paid") !== "paid") return reply.code(200).send({ ok: true, pending: true });
        // Create the user, or reuse one with that email, and keep the key for the welcome page.
        let user = store.state.users.find((u) => u.email.toLowerCase() === signup.email);
        const key = newKey();
        if (!user) {
          user = { id: `u-${store.now().getTime().toString(36)}`, name: signup.name, email: signup.email, role: "planner", keyHash: hashKey(key), createdAt: store.now().toISOString() } satisfies User;
          store.state.users.push(user);
        } else user.keyHash = hashKey(key);
        const paid: Purchase = { ...(purchase ?? { id: `pur-${store.now().getTime().toString(36)}`, signupId: signup.id, plan: signup.plan, interval: "monthly", quantity: 1, checkoutSessionId: String(obj.id), createdAt: store.now().toISOString() }), status: "paid", paidAt: store.now().toISOString(), userId: user.id, pendingKey: key, ...(obj.customer ? { customerId: String(obj.customer) } : {}), ...(obj.subscription ? { subscriptionId: String(obj.subscription) } : {}) };
        store.state.purchases = [...purchases().filter((p) => p.id !== paid.id), paid];
        signup.status = "invited";
        signup.userId = user.id;
        await store.commit({ userId: "stripe", name: "Stripe", role: "admin", anonymous: false }, "billing.paid", { purchase: paid.id, plan: paid.plan, userId: user.id });
        return reply.code(200).send({ ok: true });
      }
      if (event.type === "checkout.session.expired") {
        const p = purchases().find((x) => x.checkoutSessionId === event.data.object.id);
        if (p) {
          p.status = "expired";
          await store.commit({ userId: "stripe", name: "Stripe", role: "admin", anonymous: false }, "billing.expired", { purchase: p.id });
        }
      }
      return reply.code(200).send({ ok: true });
    });
  });

  // The welcome page picks the key up once; after that it is gone from the server.
  app.post("/v1/billing/claim", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } }, schema: { body: z.object({ sessionId: z.string().min(1).max(200) }) } }, async (req) => {
    const p = purchases().find((x) => x.checkoutSessionId === req.body.sessionId);
    if (!p) throw notFound("Purchase");
    if (p.status !== "paid") return { status: p.status };
    const key = p.pendingKey;
    delete p.pendingKey;
    const user = store.state.users.find((u) => u.id === p.userId);
    if (key) await store.commit({ userId: p.userId ?? "stripe", name: user?.name ?? "Stripe", role: "planner", anonymous: false }, "billing.key-claimed", { purchase: p.id });
    return { status: "paid", plan: p.plan, interval: p.interval, quantity: p.quantity, name: user?.name, email: user?.email, ...(key ? { apiKey: key } : { claimed: true }) };
  });
}
