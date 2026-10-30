import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import rateLimit from "@fastify/rate-limit";
import { CHALLENGE_MESSAGE, type Turnstile } from "./turnstile.js";
import { DomainError, ROLES, activePayments, can, type Core, type Identities, type Notifier, type Organization, type Permission, type Role, type SessionContext } from "@gate/core";
import { authorizeUrl, exchangeCode, pkcePair, safeReturnTo, type ProviderConfig } from "./oauth.js";
import * as S from "./schemas.js";
import { secretMatches } from "./secrets.js";

export interface AuthDeps {
  core: Core;
  identities: Identities;
  providers: ProviderConfig[];
  publicUrl: string;
  webUrl: string;
  mailer?: Notifier | undefined;
  fetchImpl?: typeof fetch | undefined;
  adminKey?: string | undefined;
  emailFromName?: string | undefined;
  /** Cloudflare Turnstile: when set, asking for a sign-in link needs a token from the form. */
  turnstile?: Turnstile | undefined;
}

export const randomId = (prefix: string) => `${prefix}_${randomBytes(9).toString("base64url")}`;

const RoleEnum = z.enum(ROLES as [Role, ...Role[]]);
export const MeSchema = z.object({
  user: z.object({ id: z.string(), email: z.string(), name: z.string().nullable(), avatarUrl: z.string().nullable() }),
  organization: z.object({
    id: z.string(), name: z.string(), kind: z.enum(["company", "individual"]).nullable(), currency: z.string(), country: z.string(),
    /** protected: EnrollClass collects and holds until delivery; direct: the organizer's own Stripe account. */
    paymentMode: z.enum(["protected", "direct"]),
    /** True only once the provider enables charges and payouts (for the active mode's account). */
    paymentsConnected: z.boolean(),
    /** none: not started; incomplete: account exists, setup unfinished; ready. */
    paymentsSetup: z.enum(["none", "incomplete", "ready"]),
  }).nullable(),
  role: RoleEnum.nullable(),
  permissions: z.array(z.string()),
  memberships: z.array(z.object({ organizationId: z.string(), organizationName: z.string(), kind: z.enum(["company", "individual"]).nullable(), role: RoleEnum })),
});
const PERMS: Permission[] = ["team", "settings", "classes:write", "classes:read", "money:read", "money:write"];

export function meOut(ctx: SessionContext) {
  const org = ctx.organization;
  return {
    user: { id: ctx.user.id, email: ctx.user.email, name: ctx.user.name ?? null, avatarUrl: ctx.user.avatarUrl ?? null },
    organization: org ? { id: org.id, name: org.name, kind: org.kind ?? null, currency: org.currency, country: org.country, paymentMode: activePayments(org).mode, paymentsConnected: Boolean(activePayments(org).status?.ready), paymentsSetup: !activePayments(org).accountRef ? "none" as const : activePayments(org).status?.ready ? "ready" as const : "incomplete" as const } : null,
    role: ctx.role ?? null,
    permissions: PERMS.filter((p) => can(ctx.role, p)),
    memberships: ctx.memberships.map((m) => ({ organizationId: m.organizationId, organizationName: m.organizationName, kind: m.organizationKind ?? null, role: m.role })),
  };
}

export function bearer(req: FastifyRequest): string | undefined {
  const h = req.headers.authorization;
  return typeof h === "string" && h.startsWith("Bearer ") ? h.slice(7).trim() : undefined;
}

// ---------- emails ----------

const shell = (title: string, body: string, cta: { href: string; label: string }, foot: string) => `<!doctype html><html><body style="margin:0;background:#eeebe2;font-family:'Instrument Sans',Helvetica,Arial,sans-serif;color:#14213d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center">
<table role="presentation" width="440" cellpadding="0" cellspacing="0" style="max-width:440px;width:100%;background:#fdfdfb;border-radius:24px;overflow:hidden">
<tr><td style="background:#14213d;padding:22px 26px;color:#f7f6f2;font-weight:800;font-size:16px;letter-spacing:-.03em">enrollclass</td></tr>
<tr><td style="padding:26px"><div style="font-weight:800;font-size:24px;letter-spacing:-.03em;line-height:1.1">${title}</div><p style="font-size:15px;line-height:1.55;margin:12px 0 22px">${body}</p>
<a href="${cta.href}" style="display:inline-block;padding:13px 24px;border-radius:999px;background:#3fcb7e;color:#14213d;font-weight:600;font-size:15px;text-decoration:none">${cta.label}</a>
<p style="font-size:13px;color:#6b7280;line-height:1.5;margin:22px 0 0">${foot}</p></td></tr></table></td></tr></table></body></html>`;
const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------- routes ----------

export async function registerAuth(app: FastifyInstance, d: AuthDeps) {
  const fetchImpl = d.fetchImpl ?? fetch;
  const redirectUri = (id: string) => `${d.publicUrl}/auth/${id}/callback`;
  const toWeb = (path: string, q: Record<string, string>) => `${d.webUrl}${path}?${new URLSearchParams(q)}`;
  const finish = async (reply: FastifyReply, userId: string, returnTo: string | undefined) =>
    reply.redirect(toWeb("/auth/complete", { code: await d.identities.issueLoginCode(userId, returnTo) }), 303);
  const fail = (reply: FastifyReply, err: unknown, returnTo?: string) =>
    reply.redirect(toWeb("/login", { error: err instanceof DomainError ? err.message : "sign-in failed, please try again", ...(returnTo ? { returnTo } : {}) }), 303);
  const ctxOf = async (req: FastifyRequest) => {
    const ctx = await d.identities.resolveSession(bearer(req));
    if (!ctx) throw new DomainError("UNAUTHORIZED", "please sign in");
    return ctx;
  };

  await app.register(async (raw) => {
    const r = raw.withTypeProvider<ZodTypeProvider>();
    await r.register(rateLimit, { max: 30, timeWindow: "1 minute" });

    r.get("/auth/providers", { schema: { tags: ["auth"], security: [], response: { 200: z.object({ providers: z.array(z.object({ id: z.string(), label: z.string() })), email: z.boolean(), turnstile: z.boolean() }) } } },
      async () => ({ providers: d.providers.map((p) => ({ id: p.id, label: p.label })), email: Boolean(d.mailer), turnstile: Boolean(d.turnstile) }));

    r.get("/auth/:provider/start", { schema: { tags: ["auth"], security: [], params: z.object({ provider: z.string() }), querystring: z.object({ returnTo: z.string().optional() }) } }, async (req, reply) => {
      const p = d.providers.find((x) => x.id === req.params.provider);
      if (!p) return fail(reply, new DomainError("NOT_FOUND", "that sign-in option is not available"));
      const { verifier, challenge } = pkcePair();
      const returnTo = safeReturnTo(req.query.returnTo);
      const state = await d.identities.issueToken("oauth_state", { provider: p.id, verifier, ...(returnTo ? { returnTo } : {}) });
      return reply.redirect(authorizeUrl(p, redirectUri(p.id), state, challenge), 302);
    });

    r.get("/auth/:provider/callback", { schema: { tags: ["auth"], security: [], params: z.object({ provider: z.string() }), querystring: z.object({ code: z.string().optional(), state: z.string().optional(), error: z.string().optional(), error_description: z.string().optional() }) } }, async (req, reply) => {
      let returnTo: string | undefined;
      try {
        const state = await d.identities.consumeToken("oauth_state", req.query.state ?? "");
        returnTo = safeReturnTo(state.returnTo);
        const p = d.providers.find((x) => x.id === req.params.provider && x.id === state.provider);
        if (!p) throw new DomainError("UNAUTHORIZED", "sign-in did not match, please try again");
        if (req.query.error || !req.query.code) throw new DomainError("UNAUTHORIZED", req.query.error === "access_denied" ? "sign-in was cancelled" : `${p.label} did not complete the sign-in`);
        const accessToken = await exchangeCode(p, req.query.code, redirectUri(p.id), typeof state.verifier === "string" ? state.verifier : undefined, fetchImpl);
        const user = await d.identities.signIn(await p.profile(accessToken, fetchImpl));
        return await finish(reply, user.id, returnTo);
      } catch (err) {
        req.log.warn({ provider: req.params.provider, err: err instanceof Error ? err.message : String(err) }, "oauth sign-in failed");
        return fail(reply, err, returnTo);
      }
    });

    // Passwordless: a sign-in link by email. Always answers the same way, so it cannot be
    // used to find out who has an account.
    r.post("/auth/email", { schema: { tags: ["auth"], security: [], body: z.object({ email: z.string().email().max(254), returnTo: z.string().max(500).optional(), turnstileToken: z.string().max(4096).optional() }), response: { 202: z.object({ sent: z.boolean() }) } } }, async (req, reply) => {
      if (!d.mailer) throw new DomainError("INVALID_STATE", "email sign-in is not configured");
      if (d.turnstile && !(await d.turnstile.verify(req.body.turnstileToken))) throw new DomainError("VALIDATION", CHALLENGE_MESSAGE);
      const email = req.body.email.trim().toLowerCase();
      const returnTo = safeReturnTo(req.body.returnTo);
      const token = await d.identities.issueToken("email_link", { email, ...(returnTo ? { returnTo } : {}) });
      const link = `${d.publicUrl}/auth/email/verify?${new URLSearchParams({ token })}`;
      await d.mailer.send({
        key: `signin:${token.slice(-12)}`, to: email, subject: "Your EnrollClass sign-in link",
        text: `Sign in to EnrollClass:\n\n${link}\n\nThe link works once and expires in 20 minutes. If you did not ask for it, ignore this email.`,
        html: shell("Sign in to EnrollClass", "Use the button below to sign in. It works once and expires in 20 minutes.", { href: link, label: "Sign in" }, "If you did not ask for this, you can ignore it; nobody can sign in without the link."),
      });
      return reply.code(202).send({ sent: true });
    });

    r.get("/auth/email/verify", { schema: { tags: ["auth"], security: [], querystring: z.object({ token: z.string().max(200) }) } }, async (req, reply) => {
      let returnTo: string | undefined;
      try {
        const payload = await d.identities.consumeToken("email_link", req.query.token);
        returnTo = safeReturnTo(payload.returnTo);
        const email = String(payload.email);
        const user = await d.identities.signIn({ provider: "email", subject: email, email, emailVerified: true });
        return await finish(reply, user.id, returnTo);
      } catch (err) {
        return fail(reply, err, returnTo);
      }
    });

    // The web app trades the one-time code for a session token, server to server.
    r.post("/auth/exchange", { schema: { tags: ["auth"], security: [], body: z.object({ code: z.string().max(200) }), response: { 200: z.object({ token: z.string(), returnTo: z.string().nullable(), me: MeSchema }) } } }, async (req) => {
      const { token, context, returnTo } = await d.identities.exchangeLoginCode(req.body.code);
      return { token, returnTo: returnTo ?? null, me: meOut(context) };
    });

    r.get("/auth/me", { schema: { tags: ["auth"], response: { 200: MeSchema, 401: S.ErrorSchema } } }, async (req) => meOut(await ctxOf(req)));

    r.post("/auth/logout", { schema: { tags: ["auth"], response: { 200: z.object({ ok: z.boolean() }) } } }, async (req) => {
      await d.identities.signOut(bearer(req) ?? "");
      return { ok: true };
    });

    r.post("/auth/switch", { schema: { tags: ["auth"], body: z.object({ organizationId: z.string() }), response: { 200: MeSchema, 404: S.ErrorSchema } } }, async (req) =>
      meOut(await d.identities.switchOrganization(bearer(req) ?? "", req.body.organizationId)));

    r.post("/auth/organizations", {
      schema: { tags: ["auth"], body: z.object({ kind: z.enum(["company", "individual"]), name: z.string().max(120).optional(), country: z.string().length(2), currency: S.Currency }), response: { 201: MeSchema, 400: S.ErrorSchema, 409: S.ErrorSchema } },
    }, async (req, reply) => {
      const ctx = await ctxOf(req);
      const { organization } = await d.identities.createOrganizationFor(ctx.user.id, req.body);
      return reply.code(201).send(meOut(await d.identities.switchOrganization(bearer(req)!, organization.id)));
    });

    r.post("/auth/invitations/accept", { schema: { tags: ["auth"], body: z.object({ token: z.string().max(200) }), response: { 200: MeSchema, 404: S.ErrorSchema, 409: S.ErrorSchema } } }, async (req) => {
      const ctx = await ctxOf(req);
      const m = await d.identities.acceptInvitation(req.body.token, ctx.user.id);
      return meOut(await d.identities.switchOrganization(bearer(req)!, m.organizationId));
    });

    // Break-glass for the operator: a sign-in link for an address, plus an owner invitation,
    // printed by infra/scripts/grant-owner.sh. Works before OAuth or email are configured.
    r.post("/v1/organizations/:id/owner-link", {
      schema: { tags: ["organizations"], security: [{ adminKey: [] }], params: z.object({ id: z.string() }), body: z.object({ email: z.string().email() }), response: { 200: z.object({ signInUrl: z.string(), expiresInMinutes: z.number() }), 401: S.ErrorSchema, 404: S.ErrorSchema } },
    }, async (req) => {
      if (!secretMatches(req.headers["x-admin-key"], d.adminKey)) throw new DomainError("UNAUTHORIZED", "x-admin-key required");
      await d.core.getOrganization(req.params.id);
      await d.identities.invite(req.params.id, { role: "owner" }, { email: req.body.email, role: "owner" }).catch((err) => {
        if (!(err instanceof DomainError && err.code === "CONFLICT")) throw err;
      });
      const token = await d.identities.issueToken("email_link", { email: req.body.email.trim().toLowerCase(), returnTo: "/dashboard" });
      return { signInUrl: `${d.publicUrl}/auth/email/verify?${new URLSearchParams({ token })}`, expiresInMinutes: 20 };
    });
  });
}

/** Team management under the authenticated tenant API (permission "team"). */
export function registerTeam(api: FastifyInstance, d: AuthDeps, ctxOf: (req: FastifyRequest) => { org: Organization; role: Role; userId?: string | undefined }) {
  const r = api.withTypeProvider<ZodTypeProvider>();
  const Member = z.object({ userId: z.string(), email: z.string(), name: z.string().nullable(), avatarUrl: z.string().nullable(), role: RoleEnum, joinedAt: z.string() });
  const Invite = z.object({ id: z.string(), email: z.string(), role: RoleEnum, createdAt: z.string(), expiresAt: z.string() });

  r.get("/v1/members", { schema: { tags: ["team"], response: { 200: z.object({ members: z.array(Member), invitations: z.array(Invite) }) } } }, async (req) => {
    const { org } = ctxOf(req);
    const members = (await d.identities.listMembers(org.id)).map((m) => ({ userId: m.userId, email: m.user.email, name: m.user.name ?? null, avatarUrl: m.user.avatarUrl ?? null, role: m.role, joinedAt: m.createdAt.toISOString() }));
    const invitations = (await d.identities.listInvitations(org.id)).map((i) => ({ id: i.id, email: i.email, role: i.role, createdAt: i.createdAt.toISOString(), expiresAt: i.expiresAt.toISOString() }));
    return { members, invitations };
  });

  r.post("/v1/invitations", { schema: { tags: ["team"], body: z.object({ email: z.string().email().max(254), role: RoleEnum }), response: { 201: z.object({ invitation: Invite, emailed: z.boolean(), acceptUrl: z.string() }), 400: S.ErrorSchema, 403: S.ErrorSchema, 409: S.ErrorSchema } } }, async (req, reply) => {
    const c = ctxOf(req);
    const { invitation, token } = await d.identities.invite(c.org.id, { userId: c.userId, role: c.role }, req.body);
    const acceptUrl = `${d.webUrl}/invite/${encodeURIComponent(token)}`;
    let emailed = false;
    if (d.mailer) {
      const roleText = { owner: "an owner", admin: "an admin", instructor: "an instructor", finance: "finance" }[invitation.role];
      await d.mailer.send({
        key: `invite:${invitation.id}`, to: invitation.email, subject: `Join ${c.org.name} on EnrollClass`,
        text: `You've been invited to join ${c.org.name} on EnrollClass as ${roleText}.\n\nAccept: ${acceptUrl}\n\nThe invitation expires in 14 days.`,
        html: shell(`Join ${esc(c.org.name)}`, `You've been invited to join <strong>${esc(c.org.name)}</strong> on EnrollClass as ${roleText}. Sign in with Google, Microsoft, LinkedIn or your email to accept.`, { href: acceptUrl, label: "Accept invitation" }, "The invitation expires in 14 days. If you weren't expecting it, you can ignore this email."),
      }).then(() => { emailed = true; }, () => { emailed = false; });
    }
    return reply.code(201).send({ invitation: { id: invitation.id, email: invitation.email, role: invitation.role, createdAt: invitation.createdAt.toISOString(), expiresAt: invitation.expiresAt.toISOString() }, emailed, acceptUrl });
  });

  r.delete("/v1/invitations/:id", { schema: { tags: ["team"], params: z.object({ id: z.string() }), response: { 200: z.object({ ok: z.boolean() }), 404: S.ErrorSchema } } }, async (req) => {
    await d.identities.revokeInvitation(ctxOf(req).org.id, req.params.id);
    return { ok: true };
  });

  r.patch("/v1/members/:userId", { schema: { tags: ["team"], params: z.object({ userId: z.string() }), body: z.object({ role: RoleEnum }), response: { 200: z.object({ userId: z.string(), role: RoleEnum }), 403: S.ErrorSchema, 404: S.ErrorSchema, 409: S.ErrorSchema } } }, async (req) => {
    const c = ctxOf(req);
    const m = await d.identities.changeRole(c.org.id, c.role, req.params.userId, req.body.role);
    return { userId: m.userId, role: m.role };
  });

  r.delete("/v1/members/:userId", { schema: { tags: ["team"], params: z.object({ userId: z.string() }), response: { 200: z.object({ ok: z.boolean() }), 403: S.ErrorSchema, 404: S.ErrorSchema, 409: S.ErrorSchema } } }, async (req) => {
    const c = ctxOf(req);
    await d.identities.removeMember(c.org.id, c.role, req.params.userId);
    return { ok: true };
  });
}

/**
 * Which permission an authenticated route needs. Reads of classes are open to every
 * member; anything touching money, settings or the team is gated.
 */
export function permissionFor(method: string, url: string): Permission {
  const path = url.split("?")[0]!;
  const write = method !== "GET" && method !== "HEAD";
  if (/^\/v1\/(members|invitations)(\/|$)/.test(path)) return "team";
  if (/^\/v1\/(api-keys|webhooks)(\/|$)/.test(path)) return "settings";
  if (/^\/v1\/organizations\/me(\/|$)/.test(path) && write) return "settings";
  if (path === "/v1/policy" && write) return "settings";
  if (/^\/v1\/(sequences\/run|waitlist\/expire|jobs\/)/.test(path)) return "settings";
  if (/^\/v1\/(ledger|reports|payouts|refunds|invoices|invoice-orders|corporate-accounts|promotions)(\/|$)/.test(path)) return write ? "money:write" : "money:read";
  if (/^\/v1\/orders(\/|$)/.test(path)) return write ? "money:write" : "money:read";
  if (/^\/v1\/copilot\/explain-order$/.test(path)) return "money:read";
  if (/^\/v1\/events\/[^/]+\/(release|release-early|cancel|instructor-fees)$/.test(path)) return write ? "money:write" : "money:read";
  if (/^\/v1\/events\/[^/]+\/(publish|instructors|schedule)$/.test(path) && write) return "settings";
  if (/^\/v1\/seats\/[^/]+\/cancel$/.test(path)) return "money:write";
  if (path === "/v1/parties" && write) return "settings";
  // Moving badges to EnrollClass changes what paid seats cost, and awarding emails past learners.
  if ((/^\/v1\/badges(\/|$)/.test(path) || /^\/v1\/courses\/[^/]+\/badge\/(migrate|award)$/.test(path)) && write) return "settings";
  return write ? "classes:write" : "classes:read";
}
