// Users, roles and API keys. A key is shown once at creation and stored as a SHA-256 hash.
// When the workspace has no users and no bootstrap key is configured, the API runs open and
// every request acts as an admin: that is the demo and local-development mode, and the
// response header `x-trainyard-auth: open` says so.

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;
import { z } from "zod";
import { ApiError, defined, notFound } from "./errors.js";
import type { Store } from "./store.js";

export const ROLES = ["admin", "planner", "architect", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  keyHash: string;
  createdAt: string;
  disabled?: boolean;
  /** Person in the workspace this login belongs to, for sign-offs and ownership. */
  personId?: string;
}

export interface Principal {
  userId: string;
  name: string;
  role: Role;
  personId?: string;
  /** True in open mode, where no one has logged in. */
  anonymous: boolean;
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

function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && timingSafeEqual(x, y);
}

declare module "fastify" {
  interface FastifyRequest {
    principal: Principal;
  }
}

export interface AuthOptions {
  /** Key for a bootstrap admin, usually from TRAINYARD_ADMIN_KEY. */
  bootstrapAdminKey?: string;
}

export function registerAuth(app: App, store: Store, opts: AuthOptions = {}) {
  const bootstrapHash = opts.bootstrapAdminKey ? hashKey(opts.bootstrapAdminKey) : undefined;
  const open = () => store.state.users.length === 0 && !bootstrapHash;

  app.decorateRequest("principal", null as unknown as Principal);
  app.addHook("onRequest", async (req, reply) => {
    if (!req.url.startsWith("/v1/")) return;
    if (open()) {
      reply.header("x-trainyard-auth", "open");
      req.principal = { userId: "anonymous", name: "Anonymous (open mode)", role: "admin", anonymous: true };
      return;
    }
    const header = req.headers.authorization ?? "";
    const key = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!key) throw new ApiError(401, "UNAUTHORIZED", "Send Authorization: Bearer <api key>.");
    const h = hashKey(key);
    if (bootstrapHash && sameHash(h, bootstrapHash)) {
      req.principal = { userId: "bootstrap", name: "Bootstrap admin", role: "admin", anonymous: false };
      return;
    }
    const user = store.state.users.find((u) => sameHash(u.keyHash, h));
    if (!user || user.disabled) throw new ApiError(401, "UNAUTHORIZED", "This API key is not valid.");
    req.principal = { userId: user.id, name: user.name, role: user.role, anonymous: false, ...(user.personId ? { personId: user.personId } : {}) };
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

export function registerUserRoutes(app: App, store: Store) {
  const publicUser = ({ keyHash: _k, ...u }: User) => u;

  app.get("/v1/me", async (req) => ({ principal: req.principal, open: store.state.users.length === 0, permissions: Object.fromEntries(Object.entries(PERMISSIONS).map(([k, roles]) => [k, (roles as readonly Role[]).includes(req.principal.role)])) }));

  app.get("/v1/users", async (req) => {
    require(req, "users");
    return { users: store.state.users.map(publicUser) };
  });

  app.post(
    "/v1/users",
    { schema: { body: z.object({ name: z.string().min(1).max(80), email: z.string().email(), role: z.enum(ROLES), personId: z.string().optional() }) } },
    async (req, reply) => {
      // The first user may be created in open mode; after that, admins only.
      if (store.state.users.length > 0) require(req, "users");
      if (store.state.users.some((u) => u.email.toLowerCase() === req.body.email.toLowerCase())) throw new ApiError(409, "EMAIL_TAKEN", "A user with this email already exists.");
      if (req.body.personId && !store.state.workspace.people.some((p) => p.id === req.body.personId)) throw notFound("Person");
      const key = newKey();
      const user: User = { id: `u-${Date.now().toString(36)}`, createdAt: store.now().toISOString(), keyHash: hashKey(key), ...defined(req.body) };
      store.state.users.push(user);
      await store.commit(req.principal, "user.create", { userId: user.id, role: user.role });
      return reply.code(201).send({ user: publicUser(user), apiKey: key, note: "Store this key now; it is not shown again." });
    },
  );

  app.patch("/v1/users/:id", { schema: { params: z.object({ id: Id }), body: z.object({ role: z.enum(ROLES).optional(), disabled: z.boolean().optional(), name: z.string().min(1).max(80).optional(), personId: z.string().nullable().optional() }) } }, async (req) => {
    require(req, "users");
    const u = store.state.users.find((x) => x.id === req.params.id);
    if (!u) throw notFound("User");
    const admins = store.state.users.filter((x) => x.role === "admin" && !x.disabled);
    const losingAdmin = u.role === "admin" && !u.disabled && (req.body.role !== undefined && req.body.role !== "admin" || req.body.disabled === true);
    if (losingAdmin && admins.length === 1) throw new ApiError(409, "LAST_ADMIN", "Keep at least one active admin.");
    const { personId, ...rest } = req.body;
    Object.assign(u, defined(rest));
    if (personId === null) delete u.personId;
    else if (personId) u.personId = personId;
    await store.commit(req.principal, "user.update", { userId: u.id, ...defined(req.body) });
    return { user: publicUser(u) };
  });

  app.post("/v1/users/:id/rotate-key", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    if (req.principal.userId !== req.params.id) require(req, "users");
    const u = store.state.users.find((x) => x.id === req.params.id);
    if (!u) throw notFound("User");
    const key = newKey();
    u.keyHash = hashKey(key);
    await store.commit(req.principal, "user.rotate-key", { userId: u.id });
    return { user: publicUser(u), apiKey: key };
  });

  app.get("/v1/audit", { schema: { querystring: z.object({ limit: z.coerce.number().int().min(1).max(500).default(100) }) } }, async (req) => {
    require(req, "users");
    return { entries: await store.recentAudit(req.query.limit) };
  });
}
