// Sign-ups from the public website. A sign-up is a request, not an account: the API cannot
// create a workspace per customer yet, so an admin reviews the list under Users and sends the
// invitation (a user with a key). Each sign-up is audited, and TRAINYARD_SIGNUP_WEBHOOK can
// forward it to Slack, n8n, a CRM or a mailbox so nobody has to watch the page.

import { randomBytes } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { require } from "./auth.js";
import { ApiError } from "./errors.js";
import { PASSWORD_MIN, hashKey, hashPassword, newKey, type User } from "./auth.js";
import type { Tenants } from "./tenants.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

export const PLANS = ["practice", "trainer", "academy", "insights"] as const;
export type Plan = (typeof PLANS)[number];

export interface Signup {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  audience: "trainer" | "enterprise";
  company?: string;
  /** Trains (Academy) or trainers (Trainer) the person expects to need. */
  seats?: number;
  note?: string;
  /** Where the form was shown: the website path, the Jira app, the Azure DevOps extension. */
  source?: string;
  createdAt: string;
  /** Hash of the password chosen at sign-up, copied to the user when the account is created. */
  passwordHash?: string;
  status: "new" | "invited" | "declined";
  /** Set when an admin creates the user for this sign-up. */
  userId?: string;
}

export interface SignupOptions {
  /** Receives every new sign-up as JSON; failures are logged, never shown to the visitor. */
  webhookUrl?: string;
  fetch?: typeof fetch;
}

const Body = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  plan: z.enum(PLANS),
  audience: z.enum(["trainer", "enterprise"]).default("trainer"),
  company: z.string().trim().max(120).optional(),
  seats: z.number().int().min(1).max(100_000).optional(),
  note: z.string().trim().max(1000).optional(),
  source: z.string().trim().max(120).optional(),
  /** Honeypot: bots fill every field; people never see this one. */
  website: z.string().max(200).optional(),
  /** Chosen at sign-up; the person signs in with email and password from then on. */
  password: z.string().min(PASSWORD_MIN).max(200).optional(),
});

const BLOCKED_DOMAINS = /@(example\.(com|org|net)|test\.com|mailinator\.com)$/i;

export function registerSignupRoutes(app: App, tenants: Tenants, opts: SignupOptions = {}) {
  const store = tenants.platform;
  const list = () => (store.state.signups ??= []);
  const notify = async (s: Signup) => {
    if (!opts.webhookUrl) return;
    const f = opts.fetch ?? fetch;
    try {
      const res = await f(opts.webhookUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ event: "signup", signup: s, text: `New Trainyard sign-up: ${s.name} <${s.email}> wants ${s.plan}${s.company ? ` for ${s.company}` : ""}${s.seats ? ` (${s.seats})` : ""}.` }) });
      if (!res.ok) app.log.warn({ status: res.status }, "signup webhook refused");
    } catch (e) {
      app.log.warn({ err: (e as Error).message }, "signup webhook failed");
    }
  };

  // Public, and tighter than the global limit: ten a minute from one address is plenty for people.
  app.post("/v1/signups", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } }, schema: { body: Body } }, async (req, reply) => {
    const { website, ...body } = req.body;
    if (website) return reply.code(202).send({ ok: true });
    if (BLOCKED_DOMAINS.test(body.email)) throw new ApiError(422, "BAD_EMAIL", "Use the email address you read.");
    const email = body.email.toLowerCase();
    // Every sign-in is made once per email. Paying for a plan on an email that already signs in
    // happens from Billing, signed in, so a sign-up can never take over someone's account.
    if (store.state.users.some((u) => u.email.toLowerCase() === email)) throw new ApiError(409, "EMAIL_TAKEN", "There is already a sign-in for this email. Sign in, then change the plan from Billing.");
    const existing = list().find((s) => s.email === email && s.status === "new");
    if (existing) {
      // Same person again: one row, the newest wishes and password. The id is the key to checkout,
      // so it is issued afresh to whoever asked last and the earlier one stops working.
      const id = signupId();
      for (const p of store.state.purchases ?? []) if (p.signupId === existing.id) p.signupId = id;
      Object.assign(existing, { id, plan: body.plan, audience: body.audience, ...(body.company ? { company: body.company } : {}), ...(body.seats ? { seats: body.seats } : {}), ...(body.note ? { note: body.note } : {}) });
      if (body.password) existing.passwordHash = hashPassword(body.password);
      else delete existing.passwordHash;
      await store.commit(req.principal, "signup.update", { id: existing.id, plan: existing.plan });
      return reply.code(200).send({ signup: publicView(existing), repeated: true });
    }
    const signup: Signup = {
      id: signupId(),
      name: body.name,
      email,
      plan: body.plan,
      audience: body.audience,
      ...(body.company ? { company: body.company } : {}),
      ...(body.seats ? { seats: body.seats } : {}),
      ...(body.note ? { note: body.note } : {}),
      ...(body.source ? { source: body.source } : {}),
      createdAt: store.now().toISOString(),
      ...(body.password ? { passwordHash: hashPassword(body.password) } : {}),
      status: "new",
    };
    list().push(signup);
    await store.commit(req.principal, "signup.create", { id: signup.id, plan: signup.plan, audience: signup.audience });
    void notify(signup);
    if (signup.plan === "practice") {
      // Free plan: the workspace exists right away, with the key shown once on the website.
      const key = newKey();
      const user: User = { id: `u-${store.now().getTime().toString(36)}-${Math.random().toString(36).slice(2, 5)}`, name: signup.name, email, role: "admin", keyHash: hashKey(key), createdAt: store.now().toISOString(), ...(signup.passwordHash ? { passwordHash: signup.passwordHash } : {}) };
      store.state.users.push(user);
      const ws = await tenants.create({ name: signup.company ?? `${signup.name}'s workspace`, plan: "practice", seats: 1, ownerUserId: user.id }, req.principal);
      user.workspaceId = ws.id;
      signup.status = "invited";
      signup.userId = user.id;
      await store.commit(req.principal, "signup.practice", { id: signup.id, userId: user.id, workspaceId: ws.id });
      return reply.code(201).send({ signup: publicView(signup), apiKey: key, workspace: { id: ws.id, name: ws.name, plan: ws.plan } });
    }
    return reply.code(201).send({ signup: publicView(signup) });
  });

  app.get("/v1/signups", async (req) => {
    require(req, "users");
    return { signups: [...list()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
  });

  app.patch("/v1/signups/:id", { schema: { params: z.object({ id: z.string() }), body: z.object({ status: z.enum(["new", "invited", "declined"]), userId: z.string().optional() }) } }, async (req) => {
    require(req, "users");
    const s = list().find((x) => x.id === req.params.id);
    if (!s) throw new ApiError(404, "NOT_FOUND", "No such sign-up.");
    s.status = req.body.status;
    if (req.body.userId) s.userId = req.body.userId;
    await store.commit(req.principal, "signup.status", { id: s.id, status: s.status });
    return { signup: s };
  });
}

/** What the visitor gets back: enough to confirm, nothing that lists other people. */
/** Sign-up ids are bearer tokens for checkout, so they are unguessable. */
const signupId = () => `su-${randomBytes(12).toString("base64url")}`;

function publicView(s: Signup) {
  return { id: s.id, name: s.name, email: s.email, plan: s.plan, status: s.status, createdAt: s.createdAt };
}
