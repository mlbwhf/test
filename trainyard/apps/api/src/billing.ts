// Subscriptions through Stripe, paid without leaving the website. The API talks to Stripe's
// REST API directly (no SDK). The website creates a sign-up, then asks for a subscription:
// the server makes a Stripe Customer and a Subscription that is incomplete until its first
// invoice is paid, and hands the website the client secret of that invoice's PaymentIntent
// (or of a SetupIntent when a trial defers the first charge). The website's Payment Element
// confirms it in place. Payment confirmed, the server creates the user and keeps the key for
// one pickup. Renewals, failures and cancellations arrive on the webhook; a cancelled or
// unpaid subscription disables the user. Stripe Checkout remains as a hosted fallback.
// Without STRIPE_SECRET_KEY the routes report billing as off and the sign-up stays a request
// an admin fulfils by hand.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { hashKey, newKey, require as requirePermission, type Principal, type User } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import { limitsFor, usageOf } from "./plans.js";
import type { Plan } from "./signups.js";
import type { Tenants } from "./tenants.js";
import { LogMailer, type Mailer } from "./mailer.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

export interface BillingOptions {
  secretKey?: string;
  /** Shown to the browser for Stripe.js; required for in-page payment. */
  publishableKey?: string;
  webhookSecret?: string;
  /** Stripe price ids per plan and interval. */
  prices?: Partial<Record<`${"trainer" | "academy"}-${"monthly" | "yearly"}`, string>>;
  /** Where Stripe sends people back: the website's origin. */
  webUrl?: string;
  fetch?: typeof fetch;
  /** Trial days on new subscriptions (0 = none). */
  trialDays?: number;
  /** Sends the trial confirmation and the reminder before the first charge. */
  mailer?: Mailer;
  /** How often to look for reminders that are due; 0 or absent = only on demand. */
  reminderEveryMs?: number;
}

/** Days before the first charge that the reminder goes out (Visa asks for at least 7). */
export const TRIAL_REMINDER_DAYS = 7;

export type PurchaseStatus = "open" | "paid" | "expired" | "past_due" | "cancelled" | "refunded";

export interface Purchase {
  id: string;
  /** The sign-up it came from (new customer) ... */
  signupId?: string;
  /** ... or the existing workspace it upgrades or adds seats to. */
  workspaceId?: string;
  plan: Plan;
  interval: "monthly" | "yearly";
  quantity: number;
  /** In-page flow: the subscription; hosted flow: the Checkout session. */
  checkoutSessionId?: string;
  subscriptionId?: string;
  customerId?: string;
  status: PurchaseStatus;
  userId?: string;
  /** The API key, kept until the welcome step picks it up once. */
  pendingKey?: string;
  createdAt: string;
  paidAt?: string;
  /** When the free trial ends and the first charge happens. */
  trialEndsAt?: string;
  /** Who gets the trial emails, and what the first charge will be. */
  email?: string;
  amountCents?: number;
  currency?: string;
  /** The confirmation sent when the trial started, and the reminder before it ends. */
  trialStartEmailAt?: string;
  trialReminderSentAt?: string;
  /** The first paid invoice's PaymentIntent, refundable under the first-month guarantee. */
  firstPaymentIntent?: string;
  firstPaidAt?: string;
  refundedAt?: string;
  /** Last renewal invoice paid, or the last failure. */
  lastInvoiceAt?: string;
  lastFailureAt?: string;
  cancelledAt?: string;
}

const STRIPE_ACTOR: Principal = { userId: "stripe", name: "Stripe", role: "admin", anonymous: false, workspaceId: "platform", platformAdmin: true };

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

type StripeObject = Record<string, unknown> & { id?: string };
const requirePermissionQuiet = (p: Principal) => p.role === "admin" && !p.anonymous;
/** Money back on the first paid month, claimed from Billing within this many days of the first charge. */
export const GUARANTEE_DAYS = 30;

export async function registerBillingRoutes(app: App, tenants: Tenants, opts: BillingOptions = {}) {
  const store = tenants.platform;
  const enabled = !!opts.secretKey;
  const f = opts.fetch ?? fetch;
  const purchases = () => (store.state.purchases ??= []);
  const signups = () => store.state.signups ?? [];
  const stripe = async (path: string, body?: Record<string, string | number | undefined>, method: "GET" | "POST" | "DELETE" = body ? "POST" : "GET"): Promise<StripeObject> => {
    const res = await f(`https://api.stripe.com/v1/${path}`, method === "GET" || method === "DELETE" ? { method, headers: { authorization: `Bearer ${opts.secretKey}` } } : { method, headers: { authorization: `Bearer ${opts.secretKey}`, "content-type": "application/x-www-form-urlencoded" }, body: form(body ?? {}) });
    const json = (await res.json()) as { error?: { message?: string } } & StripeObject;
    if (!res.ok) throw new ApiError(502, "STRIPE", json.error?.message ?? `Stripe answered ${res.status}.`);
    return json;
  };
  const web = () => (opts.webUrl ?? "").replace(/\/$/, "");
  const mailer: Mailer = opts.mailer ?? new LogMailer();

  // ---- trial emails ------------------------------------------------------------------------
  // Card networks ask that a trial which turns into a paid subscription is confirmed when it
  // starts and announced again at least seven days before the first charge, with the amount,
  // the date and a way to cancel. Both emails are sent once per purchase; a failure (no SMTP,
  // a bounce) leaves them unsent so the next run tries again.
  const PLAN_NAME: Record<string, string> = { trainer: "Trainer", academy: "Academy", practice: "Practice" };
  const recipient = (p: Purchase) => p.email ?? signups().find((s) => s.id === p.signupId)?.email ?? store.state.users.find((u) => u.id === p.userId)?.email;
  const amount = (p: Purchase) => (p.amountCents === undefined ? null : new Intl.NumberFormat("en-US", { style: "currency", currency: (p.currency ?? "usd").toUpperCase() }).format(p.amountCents / 100));
  const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  const trialMail = (p: Purchase, kind: "start" | "reminder") => {
    const plan = `${PLAN_NAME[p.plan] ?? p.plan}${p.quantity > 1 ? ` × ${p.quantity}` : ""}`;
    const price = amount(p);
    const when = day(p.trialEndsAt!);
    const charge = price ? `${price} a month` : "the monthly price of your plan";
    const manage = `${web()}/billing`;
    const lines =
      kind === "start"
        ? [
            `Your free Trainyard trial (${plan}) has started.`,
            "",
            `Nothing is charged today. Your card is saved and the first charge of ${charge} happens on ${when}, then every month until you cancel.`,
            `You will get a reminder at least ${TRIAL_REMINDER_DAYS} days before that charge.`,
            "",
            `Cancel any time before ${when} and you pay nothing: ${manage} (Plan & billing).`,
            `If the first paid month does not suit you, claim your money back from the same page within ${GUARANTEE_DAYS} days.`,
          ]
        : [
            `Your free Trainyard trial (${plan}) ends on ${when}.`,
            "",
            `On that day your card is charged ${charge}, and the subscription renews every month until you cancel.`,
            "",
            `To keep going, do nothing. To stop, cancel before ${when} and you pay nothing: ${manage} (Plan & billing).`,
            `After the first charge you still have ${GUARANTEE_DAYS} days to ask for your money back from the same page.`,
          ];
    const text = [...lines, "", `Terms and prices: ${web()}/pricing`, "", "Trainyard"].join("\n");
    const subject = kind === "start" ? `Your Trainyard trial has started: first charge on ${when}` : `Your Trainyard trial ends on ${when}: ${price ? `${price} a month` : "first charge"} after that`;
    return { subject, text };
  };
  let mailing = false;
  /** Sends every trial email that is due. Returns what was sent. */
  async function sendTrialMail(): Promise<{ started: string[]; reminded: string[]; failed: string[] }> {
    const out = { started: [] as string[], reminded: [] as string[], failed: [] as string[] };
    if (mailing) return out;
    mailing = true;
    try {
      const now = store.now().getTime();
      let changed = false;
      for (const p of purchases()) {
        if (!p.trialEndsAt || p.firstPaidAt || !["paid", "open"].includes(p.status)) continue;
        if (p.status === "open" && !p.subscriptionId) continue;
        const end = Date.parse(p.trialEndsAt);
        if (!(end > now)) continue;
        const to = recipient(p);
        if (!to) continue;
        const due: ("start" | "reminder")[] = [];
        const remind = end - now <= TRIAL_REMINDER_DAYS * 86_400_000;
        // A trial shorter than the reminder window gets the start email only when it starts;
        // once inside the window, the reminder says everything the start email would.
        if (!p.trialStartEmailAt && !p.trialReminderSentAt && !remind && p.status === "paid") due.push("start");
        if (!p.trialReminderSentAt && remind && p.status === "paid") due.push("reminder");
        for (const kind of due) {
          try {
            await mailer.send({ to, ...trialMail(p, kind) });
            const at = store.now().toISOString();
            if (kind === "start") (p.trialStartEmailAt = at), out.started.push(p.id);
            else (p.trialReminderSentAt = at), (p.trialStartEmailAt ??= at), out.reminded.push(p.id);
            changed = true;
          } catch (e) {
            out.failed.push(p.id);
            if (mailer.live) console.error(`[mail] trial ${kind} for ${p.id} failed: ${(e as Error).message}`);
          }
        }
      }
      if (changed) await store.commit(STRIPE_ACTOR, "billing.trial-mail", { started: out.started, reminded: out.reminded });
    } finally {
      mailing = false;
    }
    return out;
  }
  if (opts.reminderEveryMs && opts.reminderEveryMs > 0) {
    const timer = setInterval(() => void sendTrialMail().catch((e) => console.error(`[mail] trial run failed: ${(e as Error).message}`)), opts.reminderEveryMs);
    timer.unref();
    app.addHook("onClose", async () => clearInterval(timer));
  }
  // Platform admins can check the mail setup with one message.
  app.post("/v1/admin/mail/test", { schema: { body: z.object({ to: z.string().trim().email().max(200) }) } }, async (req) => {
    if (!req.principal.platformAdmin) throw new ApiError(403, "FORBIDDEN", "Platform admins only.");
    if (!mailer.live) throw new ApiError(409, "MAIL_OFF", "Mail is not set up: put TRAINYARD_SMTP_URL and TRAINYARD_MAIL_FROM in .env and redeploy.");
    try {
      await mailer.send({ to: req.body.to, subject: "Trainyard mail works", text: "This is a test from your Trainyard server. Trial confirmations and the 7-day reminders will be sent from this address.\n\nTrainyard" });
    } catch (e) {
      throw new ApiError(502, "MAIL_FAILED", `The mail server refused: ${(e as Error).message}`);
    }
    return { sent: true, to: req.body.to };
  });
  // Platform admins can run the check by hand (and the tests do).
  app.post("/v1/billing/trial-mail/run", async (req) => {
    if (!req.principal.platformAdmin) throw new ApiError(403, "FORBIDDEN", "Platform admins only.");
    return { ...(await sendTrialMail()), mail: mailer.live ? "smtp" : "off" };
  });
  const priceFor = (plan: Plan, interval: "monthly" | "yearly") => {
    if (plan === "practice") throw new ApiError(422, "FREE_PLAN", "Practice is free; nothing to pay.");
    const price = opts.prices?.[`${plan}-${interval}`];
    if (!price) throw new ApiError(409, "NO_PRICE", `No Stripe price is configured for ${plan} ${interval}.`);
    return price;
  };
  const findSignup = (id: string) => signups().find((s) => s.id === id) ?? (() => { throw notFound("Sign-up"); })();
  const newId = (p: string) => `${p}-${store.now().getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  /** Payment is in. New customer: user + workspace, key kept for one pickup. Existing workspace: plan and seats applied. */
  const fulfil = async (purchase: Purchase, patch: Partial<Purchase> = {}) => {
    if (purchase.workspaceId) {
      const record = tenants.record(purchase.workspaceId);
      if (!record) return purchase;
      record.plan = purchase.plan;
      record.seats = purchase.quantity;
      if (record.status === "frozen" && (record.frozenReason ?? "").startsWith("subscription")) {
        record.status = "active";
        delete record.frozenAt;
        delete record.frozenReason;
      }
      Object.assign(purchase, patch, { status: "paid" as const, paidAt: store.now().toISOString(), userId: record.ownerUserId });
      await store.commit(STRIPE_ACTOR, "billing.paid", { purchase: purchase.id, workspaceId: record.id, plan: purchase.plan, quantity: purchase.quantity });
      return purchase;
    }
    const signup = signups().find((s) => s.id === purchase.signupId);
    if (!signup) return purchase;
    let user = store.state.users.find((u) => u.email.toLowerCase() === signup.email.toLowerCase());
    const key = newKey();
    if (!user) {
      user = { id: newId("u"), name: signup.name, email: signup.email, role: "admin", keyHash: hashKey(key), createdAt: store.now().toISOString() } satisfies User;
      store.state.users.push(user);
    } else {
      user.keyHash = hashKey(key);
      delete user.disabled;
    }
    let record = user.workspaceId ? tenants.record(user.workspaceId) : undefined;
    if (record) {
      record.plan = purchase.plan;
      record.seats = purchase.quantity;
      record.status = "active";
      delete record.frozenAt;
      delete record.frozenReason;
    } else {
      record = await tenants.create({ name: signup.company ?? `${signup.name}'s workspace`, plan: purchase.plan, seats: purchase.quantity, ownerUserId: user.id }, STRIPE_ACTOR);
      user.workspaceId = record.id;
      user.role = "admin";
    }
    Object.assign(purchase, patch, { status: "paid" as const, paidAt: store.now().toISOString(), userId: user.id, workspaceId: record.id, pendingKey: key });
    signup.status = "invited";
    signup.userId = user.id;
    await store.commit(STRIPE_ACTOR, "billing.paid", { purchase: purchase.id, plan: purchase.plan, interval: purchase.interval, quantity: purchase.quantity, userId: user.id, workspaceId: record.id });
    return purchase;
  };
  /** Subscription gone: the workspace stays, read-only, until it is paid again. */
  const freeze = async (purchase: Purchase, reason: string) => {
    const record = purchase.workspaceId ? tenants.record(purchase.workspaceId) : undefined;
    if (!record || record.status === "frozen") return;
    record.status = "frozen";
    record.frozenAt = store.now().toISOString();
    record.frozenReason = reason;
  };
  const claimView = (p: Purchase) => {
    const user = store.state.users.find((u) => u.id === p.userId);
    const record = p.workspaceId ? tenants.record(p.workspaceId) : undefined;
    return { status: p.status, plan: p.plan, interval: p.interval, quantity: p.quantity, ...(user ? { name: user.name, email: user.email } : {}), ...(record ? { workspace: { id: record.id, name: record.name, plan: record.plan, seats: record.seats } } : {}) };
  };

  app.get("/v1/billing/config", async () => ({
    enabled,
    inPage: enabled && !!opts.publishableKey,
    ...(enabled && opts.publishableKey ? { publishableKey: opts.publishableKey } : {}),
    plans: enabled ? Object.fromEntries(Object.entries(opts.prices ?? {}).map(([k, v]) => [k, !!v])) : {},
    trialDays: opts.trialDays ?? 0,
    guaranteeDays: GUARANTEE_DAYS,
  }));

  const StartBody = z.object({ signupId: z.string().min(1).max(80), interval: z.enum(["monthly", "yearly"]).default("monthly"), quantity: z.number().int().min(1).max(500).default(1) });
  // Every paid plan starts the same way: a free trial, then month by month. Yearly is a switch
  // made later from Billing, once the first month is behind. The interval here is accepted for
  // compatibility and ignored.
  const SubscribeBody = z.object({ signupId: z.string().min(1).max(80).optional(), plan: z.enum(["trainer", "academy"]).optional(), interval: z.enum(["monthly", "yearly"]).optional(), quantity: z.number().int().min(1).max(500).default(1) });
  /** One trial per customer: none when this email or workspace has paid before. */
  const trialFor = (who: { email: string; workspaceId?: string }) => {
    const trial = opts.trialDays ?? 0;
    if (!trial) return 0;
    const before = purchases().some((p) => (p.status === "paid" || p.status === "past_due" || p.status === "cancelled" || p.status === "refunded") && ((who.workspaceId && p.workspaceId === who.workspaceId) || (p.userId && store.state.users.find((u) => u.id === p.userId)?.email.toLowerCase() === who.email.toLowerCase())));
    return before ? 0 : trial;
  };
  /** Who is paying: a sign-up from the website, or the signed-in owner of an existing workspace. */
  const payer = (req: { principal: Principal; body: { signupId?: string | undefined; plan?: "trainer" | "academy" | undefined } }) => {
    if (req.body.signupId) {
      const signup = findSignup(req.body.signupId);
      return { email: signup.email, name: signup.name, plan: signup.plan, signupId: signup.id, company: signup.company };
    }
    if (req.principal.anonymous) throw new ApiError(401, "UNAUTHORIZED", "Sign in to change the plan of your workspace.");
    requirePermission(req as never, "users");
    const record = tenants.record(req.principal.workspaceId);
    if (!record) throw new ApiError(409, "PLATFORM_WORKSPACE", "The platform workspace has no plan to pay for.");
    if (!req.body.plan) throw new ApiError(422, "PLAN_REQUIRED", "Say which plan: trainer or academy.");
    const owner = store.state.users.find((u) => u.id === req.principal.userId);
    return { email: owner?.email ?? "", name: owner?.name ?? record.name, plan: req.body.plan as Plan, workspaceId: record.id, company: record.name };
  };

  // In-page flow: a subscription that waits for its first payment, confirmed by the Payment Element.
  app.post("/v1/billing/subscribe", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } }, schema: { body: SubscribeBody } }, async (req) => {
    if (!enabled) throw new ApiError(409, "BILLING_OFF", "Payments are not set up on this server; the sign-up will be handled by hand.");
    const who = payer(req);
    const interval = "monthly" as const;
    const price = priceFor(who.plan, interval);
    // One customer per sign-up or workspace; reuse it when the person retries.
    const existing = purchases().find((p) => p.customerId && ((who.signupId && p.signupId === who.signupId) || (who.workspaceId && p.workspaceId === who.workspaceId)));
    const customerId = existing?.customerId ?? String((await stripe("customers", { email: who.email, name: who.name, ...(who.signupId ? { "metadata[signupId]": who.signupId } : {}), ...(who.workspaceId ? { "metadata[workspaceId]": who.workspaceId } : {}), ...(who.company ? { description: who.company } : {}) })).id);
    const signup = { id: who.signupId ?? "", plan: who.plan };
    const trial = trialFor(who);
    const sub = await stripe("subscriptions", {
      customer: customerId,
      "items[0][price]": price,
      "items[0][quantity]": req.body.quantity,
      payment_behavior: "default_incomplete",
      "payment_settings[save_default_payment_method]": "on_subscription",
      ...(who.signupId ? { "metadata[signupId]": who.signupId } : {}),
      ...(who.workspaceId ? { "metadata[workspaceId]": who.workspaceId } : {}),
      "metadata[plan]": signup.plan,
      ...(trial ? { trial_period_days: trial } : {}),
      "expand[0]": "latest_invoice.payment_intent",
      "expand[1]": "pending_setup_intent",
    });
    const invoice = sub.latest_invoice as StripeObject | null;
    const intent = (invoice?.payment_intent as StripeObject | null) ?? (sub.pending_setup_intent as StripeObject | null);
    const clientSecret = intent?.client_secret as string | undefined;
    if (!clientSecret) throw new ApiError(502, "STRIPE", "Stripe returned a subscription without a payment to confirm.");
    const trialEnd = typeof sub.trial_end === "number" ? new Date(sub.trial_end * 1000).toISOString() : undefined;
    const item = ((sub.items as { data?: StripeObject[] } | undefined)?.data ?? [])[0];
    const unitAmount = Number((item?.price as StripeObject | undefined)?.unit_amount ?? 0);
    const currency = String(invoice?.currency ?? (item?.price as StripeObject | undefined)?.currency ?? "usd");
    const p: Purchase = { id: newId("pur"), ...(who.signupId ? { signupId: who.signupId } : {}), ...(who.workspaceId ? { workspaceId: who.workspaceId } : {}), plan: signup.plan, interval, quantity: req.body.quantity, customerId, subscriptionId: String(sub.id), status: "open", createdAt: store.now().toISOString(), ...(trialEnd ? { trialEndsAt: trialEnd } : {}), ...(who.email ? { email: who.email } : {}), amountCents: unitAmount * req.body.quantity, currency };
    purchases().push(p);
    await store.commit(req.principal, "billing.subscribe", { purchase: p.id, plan: p.plan, interval: p.interval, quantity: p.quantity, ...(who.workspaceId ? { workspaceId: who.workspaceId } : {}) });
    return {
      purchaseId: p.id,
      subscriptionId: p.subscriptionId,
      clientSecret,
      mode: invoice?.payment_intent ? "payment" : "setup",
      amountDue: Number(invoice?.amount_due ?? 0),
      /** What each month costs once the trial ends. */
      recurringAmount: unitAmount * req.body.quantity,
      currency,
      trialDays: trial,
      ...(trialEnd ? { trialEndsAt: trialEnd } : {}),
      guaranteeDays: GUARANTEE_DAYS,
    };
  });

  // Seats: more trainers or trains on a running subscription, billed now, pro rata.
  app.post("/v1/billing/seats", { schema: { body: z.object({ quantity: z.number().int().min(1).max(500) }) } }, async (req) => {
    if (!enabled) throw new ApiError(409, "BILLING_OFF", "Payments are not set up on this server.");
    requirePermission(req, "users");
    const record = tenants.record(req.principal.workspaceId) ?? (() => { throw new ApiError(409, "PLATFORM_WORKSPACE", "The platform workspace has no subscription."); })();
    const p = purchases().filter((x) => x.workspaceId === record.id && x.status === "paid" && x.subscriptionId).at(-1);
    if (!p) throw new ApiError(409, "NO_SUBSCRIPTION", "This workspace has no paid subscription yet; choose a plan first.");
    if (req.body.quantity === p.quantity) return { seats: p.quantity };
    // Never below what is in use.
    const usage = usageOf(tenants.handle.state, tenants.members(record.id));
    const inUse = record.plan === "academy" ? usage.trains : usage.staff;
    if (req.body.quantity < inUse) throw new ApiError(422, "SEATS_IN_USE", `${inUse} ${record.plan === "academy" ? "trains" : "trainers"} are in use; remove some before going below that.`);
    const sub = await stripe(`subscriptions/${encodeURIComponent(p.subscriptionId!)}`);
    const item = ((sub.items as { data?: StripeObject[] } | undefined)?.data ?? [])[0];
    if (!item?.id) throw new ApiError(502, "STRIPE", "The subscription has no item to change.");
    await stripe(`subscriptions/${encodeURIComponent(p.subscriptionId!)}`, { "items[0][id]": String(item.id), "items[0][quantity]": req.body.quantity, proration_behavior: "always_invoice" });
    p.quantity = req.body.quantity;
    record.seats = req.body.quantity;
    await store.commit(req.principal, "billing.seats", { purchase: p.id, workspaceId: record.id, seats: record.seats });
    return { seats: record.seats };
  });

  // Yearly, once the first month is paid: the item moves to the yearly price, difference billed now.
  app.post("/v1/billing/interval", { schema: { body: z.object({ interval: z.enum(["monthly", "yearly"]) }) } }, async (req) => {
    if (!enabled) throw new ApiError(409, "BILLING_OFF", "Payments are not set up on this server.");
    requirePermission(req, "users");
    const record = tenants.record(req.principal.workspaceId) ?? (() => { throw new ApiError(409, "PLATFORM_WORKSPACE", "The platform workspace has no subscription."); })();
    const p = purchases().filter((x) => x.workspaceId === record.id && x.status === "paid" && x.subscriptionId).at(-1);
    if (!p) throw new ApiError(409, "NO_SUBSCRIPTION", "This workspace has no paid subscription yet.");
    if (p.interval === req.body.interval) return { interval: p.interval };
    if (req.body.interval === "yearly" && !p.firstPaidAt) throw new ApiError(409, "FIRST_MONTH", "Every plan starts month by month; yearly billing opens after the first paid month.");
    const price = priceFor(record.plan, req.body.interval);
    const sub = await stripe(`subscriptions/${encodeURIComponent(p.subscriptionId!)}`);
    const item = ((sub.items as { data?: StripeObject[] } | undefined)?.data ?? [])[0];
    if (!item?.id) throw new ApiError(502, "STRIPE", "The subscription has no item to change.");
    await stripe(`subscriptions/${encodeURIComponent(p.subscriptionId!)}`, { "items[0][id]": String(item.id), "items[0][price]": price, "items[0][quantity]": p.quantity, proration_behavior: "always_invoice" });
    p.interval = req.body.interval;
    await store.commit(req.principal, "billing.interval", { purchase: p.id, workspaceId: record.id, interval: p.interval });
    return { interval: p.interval };
  });

  // The guarantee: not satisfied in the first month? The first charge comes back, the
  // subscription ends, the workspace drops to Practice with everything kept.
  app.post("/v1/billing/refund", { schema: { body: z.object({ reason: z.string().trim().max(500).optional() }) } }, async (req) => {
    if (!enabled) throw new ApiError(409, "BILLING_OFF", "Payments are not set up on this server.");
    requirePermission(req, "users");
    const record = tenants.record(req.principal.workspaceId) ?? (() => { throw new ApiError(409, "PLATFORM_WORKSPACE", "The platform workspace has no subscription."); })();
    const p = purchases().filter((x) => x.workspaceId === record.id && (x.status === "paid" || x.status === "past_due") && x.subscriptionId).at(-1);
    if (!p) throw new ApiError(409, "NO_SUBSCRIPTION", "This workspace has no paid subscription.");
    const since = p.firstPaidAt ? (store.now().getTime() - Date.parse(p.firstPaidAt)) / 86_400_000 : null;
    if (since !== null && since > GUARANTEE_DAYS) throw new ApiError(409, "GUARANTEE_OVER", `The money-back guarantee covers the first ${GUARANTEE_DAYS} days after the first charge; that was ${Math.floor(since)} days ago. You can still cancel from the portal.`);
    let refunded = 0;
    if (p.firstPaymentIntent) {
      const r = await stripe("refunds", { payment_intent: p.firstPaymentIntent, reason: "requested_by_customer", "metadata[workspaceId]": record.id, ...(req.body.reason ? { "metadata[note]": req.body.reason.slice(0, 500) } : {}) });
      refunded = Number(r.amount ?? 0);
    }
    await stripe(`subscriptions/${encodeURIComponent(p.subscriptionId!)}`, undefined, "DELETE");
    p.status = "refunded";
    p.refundedAt = store.now().toISOString();
    record.plan = "practice";
    record.seats = 1;
    record.status = "active";
    delete record.frozenAt;
    delete record.frozenReason;
    record.note = `${record.note ? record.note + " · " : ""}money-back claimed ${p.refundedAt.slice(0, 10)}${req.body.reason ? `: ${req.body.reason.slice(0, 120)}` : ""}`;
    await store.commit(req.principal, "billing.refund", { purchase: p.id, workspaceId: record.id, refunded, reason: req.body.reason });
    return { refunded, plan: record.plan };
  });

  // What the Billing page shows: plan, limits, usage, the subscription and whether payments run.
  app.get("/v1/billing/workspace", async (req) => {
    const record = tenants.record(req.principal.workspaceId);
    const members = tenants.members(req.principal.workspaceId);
    const usage = usageOf(tenants.handle.state, members);
    const latest = record ? purchases().filter((x) => x.workspaceId === record.id || (x.userId && x.userId === record.ownerUserId)).at(-1) : undefined;
    return {
      enabled,
      inPage: enabled && !!opts.publishableKey,
      ...(enabled && opts.publishableKey ? { publishableKey: opts.publishableKey } : {}),
      plans: enabled ? Object.fromEntries(Object.entries(opts.prices ?? {}).map(([k, v]) => [k, !!v])) : {},
      workspace: record ?? null,
      limits: record ? limitsFor(record.plan, record.seats) : null,
      usage,
      subscription: latest ? { id: latest.id, status: latest.status, plan: latest.plan, interval: latest.interval, quantity: latest.quantity, paidAt: latest.paidAt, trialEndsAt: latest.trialEndsAt, firstPaidAt: latest.firstPaidAt, refundedAt: latest.refundedAt, lastInvoiceAt: latest.lastInvoiceAt, lastFailureAt: latest.lastFailureAt, cancelledAt: latest.cancelledAt, hasSubscription: !!latest.subscriptionId, guaranteeUntil: latest.firstPaidAt ? new Date(Date.parse(latest.firstPaidAt) + GUARANTEE_DAYS * 86_400_000).toISOString() : null, trialDays: opts.trialDays ?? 0 } : null,
      trialDays: opts.trialDays ?? 0,
      guaranteeDays: GUARANTEE_DAYS,
      canManage: requirePermissionQuiet(req.principal),
    };
  });

  // Hosted fallback: Stripe Checkout. Public: the sign-up id is the handle, the email on it is
  // what Stripe shows; nothing about other people is exposed.
  app.post("/v1/billing/checkout", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } }, schema: { body: StartBody } }, async (req) => {
    if (!enabled) throw new ApiError(409, "BILLING_OFF", "Payments are not set up on this server; the sign-up will be handled by hand.");
    const signup = findSignup(req.body.signupId);
    const price = priceFor(signup.plan, req.body.interval);
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
      success_url: `${web()}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${web()}/#pricing`,
    });
    const p: Purchase = { id: newId("pur"), signupId: signup.id, plan: signup.plan, interval: req.body.interval, quantity: req.body.quantity, checkoutSessionId: String(session.id), status: "open", createdAt: store.now().toISOString() };
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
      let event: { type: string; data: { object: StripeObject } };
      try {
        event = JSON.parse(raw) as typeof event;
      } catch {
        throw new ApiError(400, "BAD_JSON", "The webhook body is not JSON.");
      }
      const obj = event.data.object;
      const bySubscription = (id: unknown) => (id ? purchases().find((p) => p.subscriptionId === id) : undefined);

      switch (event.type) {
        // Hosted Checkout paid.
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
          const purchase = purchases().find((p) => p.checkoutSessionId === obj.id);
          const signupId = String((obj.metadata as Record<string, string> | undefined)?.signupId ?? obj.client_reference_id ?? purchase?.signupId ?? "");
          if (!signups().some((s) => s.id === signupId)) return reply.code(200).send({ ignored: "unknown sign-up" });
          if (purchase?.status === "paid") return reply.code(200).send({ ok: true, already: true });
          if (String(obj.payment_status ?? "paid") !== "paid") return reply.code(200).send({ ok: true, pending: true });
          const p = purchase ?? (() => { const n: Purchase = { id: newId("pur"), signupId, plan: (signups().find((s) => s.id === signupId)!.plan), interval: "monthly", quantity: 1, checkoutSessionId: String(obj.id), status: "open", createdAt: store.now().toISOString() }; purchases().push(n); return n; })();
          await fulfil(p, { ...(obj.customer ? { customerId: String(obj.customer) } : {}), ...(obj.subscription ? { subscriptionId: String(obj.subscription) } : {}) });
          return reply.code(200).send({ ok: true });
        }
        case "checkout.session.expired": {
          const p = purchases().find((x) => x.checkoutSessionId === obj.id);
          if (p && p.status === "open") {
            p.status = "expired";
            await store.commit(STRIPE_ACTOR, "billing.expired", { purchase: p.id });
          }
          return reply.code(200).send({ ok: true });
        }
        // In-page flow: the first invoice paid (or any renewal).
        case "invoice.paid":
        case "invoice.payment_succeeded": {
          // Newer API versions put the subscription under parent.subscription_details.
          const details = (obj.parent as StripeObject | undefined)?.subscription_details as StripeObject | undefined;
          const subId = obj.subscription ?? details?.subscription;
          const p = bySubscription(subId);
          if (!p) return reply.code(200).send({ ignored: "unknown subscription" });
          if (Number(obj.amount_paid ?? 0) > 0 && !p.firstPaymentIntent && obj.payment_intent) {
            p.firstPaymentIntent = String(obj.payment_intent);
            p.firstPaidAt = store.now().toISOString();
          }
          if (p.status === "paid") {
            p.lastInvoiceAt = store.now().toISOString();
            delete p.lastFailureAt;
            await store.commit(STRIPE_ACTOR, "billing.renewed", { purchase: p.id });
            return reply.code(200).send({ ok: true, renewed: true });
          }
          await fulfil(p, { lastInvoiceAt: store.now().toISOString(), ...(obj.customer ? { customerId: String(obj.customer) } : {}) });
          return reply.code(200).send({ ok: true });
        }
        // A trial starts without a charge: the subscription is live as soon as it exists.
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const p = bySubscription(obj.id) ?? purchases().find((x) => !x.subscriptionId && x.signupId && x.signupId === (obj.metadata as Record<string, string> | undefined)?.signupId);
          if (!p) return reply.code(200).send({ ignored: "unknown subscription" });
          if (!p.subscriptionId) p.subscriptionId = String(obj.id);
          const status = String(obj.status ?? "");
          if (typeof obj.trial_end === "number") {
            const end = new Date(obj.trial_end * 1000).toISOString();
            // A moved trial end needs its own reminder.
            if (p.trialEndsAt !== end) delete p.trialReminderSentAt;
            p.trialEndsAt = end;
          }
          const subItem = ((obj.items as { data?: StripeObject[] } | undefined)?.data ?? [])[0];
          const subPrice = subItem?.price as StripeObject | undefined;
          if (subPrice?.unit_amount !== undefined) {
            p.amountCents = Number(subPrice.unit_amount) * Number(subItem?.quantity ?? p.quantity);
            p.currency = String(subPrice.currency ?? p.currency ?? "usd");
          }
          if ((status === "trialing" || status === "active") && p.status === "open") await fulfil(p);
          else if (status === "past_due" || status === "unpaid") {
            p.status = status === "unpaid" ? "cancelled" : "past_due";
            p.lastFailureAt = store.now().toISOString();
            if (status === "unpaid") await freeze(p, "subscription unpaid");
            await store.commit(STRIPE_ACTOR, "billing.past-due", { purchase: p.id, status });
          } else if (status === "active" && p.status === "past_due") {
            p.status = "paid";
            delete p.lastFailureAt;
            const record = p.workspaceId ? tenants.record(p.workspaceId) : undefined;
            if (record?.status === "frozen" && (record.frozenReason ?? "").startsWith("subscription")) { record.status = "active"; delete record.frozenAt; delete record.frozenReason; }
            await store.commit(STRIPE_ACTOR, "billing.recovered", { purchase: p.id });
          }
          else await store.commit(STRIPE_ACTOR, "billing.subscription", { purchase: p.id, status });
          // The trial confirmation (or, inside the window, the reminder) goes out right away.
          void sendTrialMail().catch(() => undefined);
          return reply.code(200).send({ ok: true });
        }
        case "invoice.payment_failed": {
          const p = bySubscription(obj.subscription);
          if (p && p.status === "paid") {
            p.status = "past_due";
            p.lastFailureAt = store.now().toISOString();
            await store.commit(STRIPE_ACTOR, "billing.payment-failed", { purchase: p.id });
          }
          return reply.code(200).send({ ok: true });
        }
        case "customer.subscription.deleted": {
          const p = bySubscription(obj.id);
          if (p && p.status !== "cancelled" && p.status !== "refunded") {
            p.status = "cancelled";
            p.cancelledAt = store.now().toISOString();
            await freeze(p, "subscription cancelled");
            await store.commit(STRIPE_ACTOR, "billing.cancelled", { purchase: p.id, workspaceId: p.workspaceId });
          }
          return reply.code(200).send({ ok: true });
        }
        default:
          return reply.code(200).send({ ok: true, ignored: event.type });
      }
    });
  });

  // The welcome step picks the key up once; after that it is gone from the server. If the
  // webhook has not arrived yet, the server asks Stripe for the subscription itself, so the
  // in-page flow never waits on webhook delivery.
  app.post("/v1/billing/claim", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } }, schema: { body: z.object({ sessionId: z.string().min(1).max(200).optional(), purchaseId: z.string().min(1).max(200).optional() }) } }, async (req) => {
    const p = purchases().find((x) => (req.body.purchaseId && x.id === req.body.purchaseId) || (req.body.sessionId && x.checkoutSessionId === req.body.sessionId));
    if (!p) throw notFound("Purchase");
    if (p.status === "open" && p.subscriptionId && enabled) {
      const sub = await stripe(`subscriptions/${encodeURIComponent(p.subscriptionId)}`);
      const status = String(sub.status ?? "");
      if (status === "active" || status === "trialing") await fulfil(p);
    }
    if (p.status !== "paid") return { status: p.status };
    const key = p.pendingKey;
    delete p.pendingKey;
    if (key) await store.commit({ userId: p.userId ?? "stripe", name: claimView(p).name ?? "Stripe", role: "admin", anonymous: false, workspaceId: p.workspaceId ?? tenants.platformId, platformAdmin: false }, "billing.key-claimed", { purchase: p.id });
    return { ...claimView(p), ...(key ? { apiKey: key } : { claimed: true }) };
  });

  // A signed-in subscriber manages card, invoices and cancellation in Stripe's portal.
  app.post("/v1/billing/portal", async (req) => {
    const me = req.principal;
    if (me.anonymous) throw new ApiError(401, "UNAUTHORIZED", "Sign in to manage your subscription.");
    if (!enabled) throw new ApiError(409, "BILLING_OFF", "Payments are not set up on this server.");
    const p = purchases().filter((x) => x.customerId && (x.workspaceId === me.workspaceId || x.userId === me.userId)).at(-1);
    if (!p) throw notFound("Subscription");
    const session = await stripe("billing_portal/sessions", { customer: p.customerId!, return_url: `${web()}/users` });
    return { url: session.url };
  });

  // Admins see who pays for what.
  app.get("/v1/billing/purchases", async (req) => {
    requirePermission(req, "users");
    const all = req.principal.platformAdmin && req.principal.workspaceId === tenants.platformId;
    return { purchases: purchases().filter((p) => all || p.workspaceId === req.principal.workspaceId).map(({ pendingKey: _k, ...p }) => ({ ...p, hasPendingKey: !!_k })) };
  });
}
