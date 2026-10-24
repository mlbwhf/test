// Users, roles and API keys. A key is shown once at creation and stored as a SHA-256 hash.
// When the workspace has no users and no bootstrap key is configured, the API runs open and
// every request acts as an admin: that is the demo and local-development mode, and the
// response header `x-trainyard-auth: open` says so.

import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;
import { z } from "zod";
import { ApiError, defined, notFound } from "./errors.js";
import { limitsFor, planLimitError, usageOf, type WorkspaceRecord } from "./plans.js";
import type { Tenants } from "./tenants.js";

export const ROLES = ["admin", "planner", "architect", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  keyHash: string;
  /** scrypt hash of the password, "salt:hash", when the person signs in with email and password. */
  passwordHash?: string;
  /** Browser sessions from password sign-ins: the token's hash and when it lapses. */
  sessions?: { hash: string; expiresAt: string }[];
  createdAt: string;
  disabled?: boolean;
  /** Person in the workspace this login belongs to, for sign-offs and ownership. */
  personId?: string;
  /** The customer workspace this login belongs to; absent for the platform's own users. */
  workspaceId?: string;
  /** When the person proved they read this address (sign-up code, or an identity provider). */
  emailVerifiedAt?: string;
  /**
   * Sign-ins from outside identity providers linked to this user (identity.ts): single
   * sign-on through OIDC or SAML adds one entry per provider, keyed by its subject id.
   */
  identities?: { provider: string; subject: string; linkedAt: string }[];
}

export interface Principal {
  userId: string;
  name: string;
  role: Role;
  personId?: string;
  /** True in open mode, where no one has logged in. */
  anonymous: boolean;
  /** The workspace this request runs in. */
  workspaceId: string;
  /** Admin of the platform workspace (or the bootstrap key): may enter any workspace as support. */
  platformAdmin: boolean;
  /** Set when a platform admin is inside a customer workspace. */
  support?: boolean;
}

/** What each role may do. Reads are open to every role. */
export const PERMISSIONS = {
  plan: ["admin", "planner", "architect"],
  ai: ["admin", "planner", "architect"],
  "sign-off": ["admin", "architect"],
  sync: ["admin", "planner"],
  model: ["admin"],
  users: ["admin"],
  portfolio: ["admin", "planner", "architect"],
  assist: ["admin", "planner", "architect"],
} as const satisfies Record<string, readonly Role[]>;
export type Permission = keyof typeof PERMISSIONS;

export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

export function newKey(): string {
  return `ty_${randomBytes(24).toString("hex")}`;
}

export const PASSWORD_MIN = 10;
/** Thirty days of browser session per sign-in. */
export const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_SESSIONS = 10;

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")): string {
  return `${salt}:${scryptSync(password.normalize("NFKC"), salt, 32, { N: 16384, r: 8, p: 1 }).toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(hashPassword(password, salt).split(":")[1]!, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Compared against when the email is unknown, so a miss costs the same scrypt as a wrong password. */
const DUMMY_HASH = hashPassword("no such user");

/** A session token looks like a key but comes from a password sign-in and lapses. */
export function newSessionToken(): string {
  return `ts_${randomBytes(24).toString("hex")}`;
}

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}

declare module "fastify" {
  interface FastifyRequest {
    principal: Principal;
    /** The client's address, worked out from the trusted proxy chain (proxies.ts). */
    clientIp: string;
  }
}

export interface AuthOptions {
  /** Key for a bootstrap admin, usually from TRAINYARD_ADMIN_KEY. */
  bootstrapAdminKey?: string;
}

/** Failed sign-ins per client before a 10-minute lockout. Keys are 192-bit random, so this only slows a guesser; it mostly keeps logs readable. */
export const LOCKOUT_FAILURES = 20;
const LOCKOUT_MS = 10 * 60 * 1000;

export function registerAuth(app: App, tenants: Tenants, opts: AuthOptions = {}) {
  const platform = tenants.platform;
  const bootstrapHash = opts.bootstrapAdminKey ? hashKey(opts.bootstrapAdminKey) : undefined;
  const open = () => platform.state.users.length === 0 && !bootstrapHash;
  const failures = new Map<string, { count: number; since: number }>();
  const failed = (ip: string) => {
    const now = Date.now();
    const f = failures.get(ip);
    const cur = f && now - f.since < LOCKOUT_MS ? { count: f.count + 1, since: f.since } : { count: 1, since: now };
    failures.set(ip, cur);
    if (failures.size > 10_000) for (const [k, v] of failures) if (now - v.since > LOCKOUT_MS) failures.delete(k);
    return cur.count;
  };
  const lockedOut = (ip: string) => {
    const f = failures.get(ip);
    return !!f && f.count >= LOCKOUT_FAILURES && Date.now() - f.since < LOCKOUT_MS;
  };

  // Routes the public reaches without a key once the workspace is closed: the website sign-up,
  // payment (subscription start, Stripe's webhook, the one-time key pickup) and the tracker
  // webhooks, which check their own token. They get a visitor principal with no permissions.
  const isPublic = (method: string, url: string) => {
    const path = url.split("?")[0] ?? url;
    if (method === "POST" && path === "/v1/signups") return true;
    if (method === "POST" && path === "/v1/auth/login") return true;
    if (method === "POST" && path.startsWith("/v1/webhooks/")) return true;
    if (method === "GET" && path === "/v1/billing/config") return true;
    if (method === "POST" && (path === "/v1/billing/checkout" || path === "/v1/billing/subscribe" || path === "/v1/billing/claim")) return true;
    return false;
  };
  const visitor = (): Principal => ({ userId: "anonymous", name: "Visitor", role: "viewer", anonymous: true, workspaceId: tenants.platformId, platformAdmin: false });

  const resolve = async (req: FastifyRequest, reply: FastifyReply): Promise<Principal> => {
    if (open()) {
      reply.header("x-trainyard-auth", "open");
      return { userId: "anonymous", name: "Anonymous (open mode)", role: "admin", anonymous: true, workspaceId: tenants.platformId, platformAdmin: true };
    }
    const header = req.headers.authorization ?? "";
    const key = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!key) {
      if (isPublic(req.method, req.url)) return visitor();
      throw new ApiError(401, "UNAUTHORIZED", "Send Authorization: Bearer <api key>.");
    }
    if (lockedOut(req.clientIp)) throw new ApiError(429, "LOCKED_OUT", "Too many failed sign-ins from this address; try again in a few minutes.");
    const h = hashKey(key);
    if (bootstrapHash && sameHash(h, bootstrapHash)) return { userId: "bootstrap", name: "Bootstrap admin", role: "admin", anonymous: false, workspaceId: tenants.platformId, platformAdmin: true };
    const nowIso = new Date().toISOString();
    const user = key.startsWith("ts_") ? platform.state.users.find((u) => (u.sessions ?? []).some((x) => x.expiresAt > nowIso && sameHash(x.hash, h))) : platform.state.users.find((u) => sameHash(u.keyHash, h));
    if (!user || user.disabled) {
      const n = failed(req.clientIp);
      req.log.warn({ ip: req.clientIp, failures: n }, key.startsWith("ts_") ? "invalid or expired session" : "invalid api key");
      throw new ApiError(401, "UNAUTHORIZED", key.startsWith("ts_") ? "This session has ended; sign in again." : "This API key is not valid.");
    }
    const home = user.workspaceId ?? tenants.platformId;
    return { userId: user.id, name: user.name, role: user.role, anonymous: false, workspaceId: home, platformAdmin: home === tenants.platformId && user.role === "admin", ...(user.personId ? { personId: user.personId } : {}) };
  };

  // ---- email and password sign-in ---------------------------------------------------------
  app.post("/v1/auth/login", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } }, schema: { body: z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(200) }) } }, async (req) => {
    if (lockedOut(req.clientIp)) throw new ApiError(429, "LOCKED_OUT", "Too many failed sign-ins from this address; try again in a few minutes.");
    const user = platform.state.users.find((u) => u.email.toLowerCase() === req.body.email.toLowerCase());
    // One answer and about the same time for every failure, so the form never tells which emails exist.
    const ok = verifyPassword(req.body.password, user?.passwordHash ?? DUMMY_HASH) && !!user?.passwordHash && !user.disabled;
    if (!user || !ok) {
      failed(req.clientIp);
      throw new ApiError(401, "BAD_LOGIN", "Email or password is wrong. No password set yet? Sign in with your key once and set one under Users, or ask your admin.");
    }
    const token = newSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_MS).toISOString();
    const live = (user.sessions ?? []).filter((x) => x.expiresAt > new Date().toISOString());
    user.sessions = [...live.slice(-(MAX_SESSIONS - 1)), { hash: hashKey(token), expiresAt }];
    await platform.commit(req.principal, "auth.login", { userId: user.id });
    const { keyHash: _k, passwordHash: _p, sessions: _s, ...pub } = user;
    return { token, expiresAt, user: { ...pub, hasPassword: true } };
  });

  app.decorateRequest("principal", null as unknown as Principal);
  // Callback style on purpose: the rest of the request runs inside the workspace's async context.
  app.addHook("onRequest", (req, reply, done) => {
    if (!req.url.startsWith("/v1/")) return done();
    resolve(req, reply)
      .then(async (principal) => {
        // A platform admin may step into any workspace as support; everyone else stays home.
        const asked = req.headers["x-trainyard-workspace"];
        let target = principal.workspaceId;
        if (typeof asked === "string" && asked && asked !== principal.workspaceId) {
          if (!principal.platformAdmin) throw new ApiError(403, "FORBIDDEN", "Only platform admins can open another workspace.");
          const record = tenants.record(asked);
          if (!record) throw notFound("Workspace");
          target = asked;
          principal = { ...principal, workspaceId: asked, support: true };
          if (req.method !== "GET" || !record.supportVisitAt || Date.now() - Date.parse(record.supportVisitAt) > 60 * 60 * 1000) {
            record.supportVisitAt = new Date().toISOString();
            record.supportVisitBy = principal.name;
          }
        }
        req.principal = principal;
        return target === tenants.platformId ? platform : tenants.get(target);
      })
      .then((store) => tenants.run(store, done), done);
  });
}

export function require(req: FastifyRequest, permission: Permission): Principal {
  const p = req.principal;
  if (!(PERMISSIONS[permission] as readonly Role[]).includes(p.role)) {
    throw new ApiError(403, "FORBIDDEN", `Your role (${p.role}) cannot do this; it needs one of: ${PERMISSIONS[permission].join(", ")}.`);
  }
  return p;
}

const Id = z.string().min(1).max(200);

export function registerUserRoutes(app: App, tenants: Tenants) {
  const platform = tenants.platform;
  const publicUser = ({ keyHash: _k, passwordHash, sessions: _s, ...u }: User) => ({ ...u, hasPassword: !!passwordHash });
  const Password = z.string().min(PASSWORD_MIN, `at least ${PASSWORD_MIN} characters`).max(200);

  app.post("/v1/auth/logout", async (req) => {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const user = platform.state.users.find((u) => u.id === req.principal.userId);
    if (user && token.startsWith("ts_")) {
      const h = hashKey(token);
      user.sessions = (user.sessions ?? []).filter((x) => !sameHash(x.hash, h));
      await platform.commit(req.principal, "auth.logout", { userId: user.id });
    }
    return { ok: true };
  });

  // Your own password: the current one is needed whenever one is set, however you signed in.
  app.post("/v1/auth/password", { schema: { body: z.object({ current: z.string().max(200).optional(), password: Password }) } }, async (req) => {
    const user = platform.state.users.find((u) => u.id === req.principal.userId);
    if (!user) throw new ApiError(409, "NO_USER", "The bootstrap admin key has no user record; create your admin user under Users first, then set its password.");
    const header = req.headers.authorization ?? "";
    if (user.passwordHash && !verifyPassword(req.body.current ?? "", user.passwordHash)) throw new ApiError(403, "BAD_CURRENT", "The current password is wrong.");
    user.passwordHash = hashPassword(req.body.password);
    // Other browsers signed in with the old password are signed out.
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    user.sessions = token.startsWith("ts_") ? (user.sessions ?? []).filter((x) => sameHash(x.hash, hashKey(token))) : [];
    await platform.commit(req.principal, "auth.password", { userId: user.id });
    return { user: publicUser(user) };
  });

  // An admin sets or resets someone's password (and ends their sessions).
  app.post("/v1/users/:id/password", { schema: { params: z.object({ id: Id }), body: z.object({ password: Password }) } }, async (req) => {
    require(req, "users");
    const u = members(req).find((x) => x.id === req.params.id);
    if (!u) throw notFound("User");
    u.passwordHash = hashPassword(req.body.password);
    u.sessions = [];
    await platform.commit(req.principal, "user.password", { userId: u.id, by: req.principal.userId });
    return { user: publicUser(u) };
  });
  const here = (req: FastifyRequest) => req.principal.workspaceId;
  const members = (req: FastifyRequest) => tenants.members(here(req));
  const tag = (req: FastifyRequest) => (here(req) === tenants.platformId ? {} : { workspaceId: here(req) });
  const recordOf = (req: FastifyRequest): WorkspaceRecord | undefined => tenants.record(here(req));

  app.get("/v1/me", async (req) => {
    const record = recordOf(req);
    const ws = tenants.handle.state.workspace;
    return {
      principal: req.principal,
      open: platform.state.users.length === 0,
      permissions: Object.fromEntries(Object.entries(PERMISSIONS).map(([k, roles]) => [k, (roles as readonly Role[]).includes(req.principal.role)])),
      workspace: { id: ws.id, name: record?.name ?? ws.name, plan: record?.plan ?? "platform", seats: record?.seats ?? 0, status: record?.status ?? "active", ...(record?.frozenReason ? { frozenReason: record.frozenReason } : {}), platform: here(req) === tenants.platformId },
    };
  });

  app.get("/v1/users", async (req) => {
    require(req, "users");
    return { users: members(req).map(publicUser) };
  });

  app.post(
    "/v1/users",
    { schema: { body: z.object({ name: z.string().min(1).max(80), email: z.string().email(), role: z.enum(ROLES), personId: z.string().optional() }) } },
    async (req, reply) => {
      // The first user may be created in open mode; after that, admins only.
      if (platform.state.users.length > 0) require(req, "users");
      if (platform.state.users.some((u) => u.email.toLowerCase() === req.body.email.toLowerCase())) throw new ApiError(409, "EMAIL_TAKEN", "A user with this email already exists.");
      if (req.body.personId && !tenants.handle.state.workspace.people.some((p) => p.id === req.body.personId)) throw notFound("Person");
      const record = recordOf(req);
      if (record) {
        const limits = limitsFor(record.plan, record.seats);
        const usage = usageOf(tenants.handle.state, members(req));
        if (limits.members !== null && usage.members + 1 > limits.members) throw planLimitError(record, "members", limits.members, usage.members);
        if (limits.staff !== null && req.body.role !== "viewer" && usage.staff + 1 > limits.staff) throw planLimitError(record, "staff", limits.staff, usage.staff);
      }
      const key = newKey();
      const user: User = { id: `u-${Date.now().toString(36)}`, createdAt: platform.now().toISOString(), keyHash: hashKey(key), ...defined(req.body), ...tag(req) };
      platform.state.users.push(user);
      await platform.commit(req.principal, "user.create", { userId: user.id, role: user.role, workspaceId: here(req) });
      return reply.code(201).send({ user: publicUser(user), apiKey: key, note: "Store this key now; it is not shown again." });
    },
  );

  app.patch("/v1/users/:id", { schema: { params: z.object({ id: Id }), body: z.object({ role: z.enum(ROLES).optional(), disabled: z.boolean().optional(), name: z.string().min(1).max(80).optional(), personId: z.string().nullable().optional() }) } }, async (req) => {
    require(req, "users");
    const u = members(req).find((x) => x.id === req.params.id);
    if (!u) throw notFound("User");
    const admins = members(req).filter((x) => x.role === "admin" && !x.disabled);
    const losingAdmin = u.role === "admin" && !u.disabled && (req.body.role !== undefined && req.body.role !== "admin" || req.body.disabled === true);
    if (losingAdmin && admins.length === 1) throw new ApiError(409, "LAST_ADMIN", "Keep at least one active admin.");
    const record = recordOf(req);
    if (record) {
      // Turning someone back on counts against the plan like adding them; so does lifting a viewer.
      const enabling = !!u.disabled && req.body.disabled === false;
      const role = req.body.role ?? u.role;
      const limits = limitsFor(record.plan, record.seats);
      const usage = usageOf(tenants.handle.state, members(req));
      if (enabling && limits.members !== null && usage.members + 1 > limits.members) throw planLimitError(record, "members", limits.members, usage.members);
      if (role !== "viewer" && (enabling || u.role === "viewer") && (enabling || !u.disabled) && limits.staff !== null && usage.staff + 1 > limits.staff) throw planLimitError(record, "staff", limits.staff, usage.staff);
    }
    const { personId, ...rest } = req.body;
    Object.assign(u, defined(rest));
    if (personId === null) delete u.personId;
    else if (personId) u.personId = personId;
    await platform.commit(req.principal, "user.update", { userId: u.id, ...defined(req.body) });
    return { user: publicUser(u) };
  });

  app.post("/v1/users/:id/rotate-key", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    if (req.principal.userId !== req.params.id) require(req, "users");
    const u = members(req).find((x) => x.id === req.params.id);
    if (!u) throw notFound("User");
    const key = newKey();
    u.keyHash = hashKey(key);
    // A new key ends every browser session too, so a leaked key stops working everywhere.
    u.sessions = [];
    await platform.commit(req.principal, "user.rotate-key", { userId: u.id });
    return { user: publicUser(u), apiKey: key };
  });

  app.get("/v1/audit", { schema: { querystring: z.object({ limit: z.coerce.number().int().min(1).max(500).default(100) }) } }, async (req) => {
    require(req, "users");
    return { entries: await tenants.handle.recentAudit(req.query.limit) };
  });
}
