// The support console: platform admins see every customer workspace, change its plan or
// seats by hand (a comped class, a refund), freeze or thaw it, hand the owner a new key and
// export its data. Opening a workspace as support goes through the x-trainyard-workspace
// header (see auth.ts), which records the visit on the workspace.

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { hashKey, newKey, require as requirePermission } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import { limitsFor, usageOf } from "./plans.js";
import { PLANS } from "./signups.js";
import type { Tenants } from "./tenants.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

export function registerAdminRoutes(app: App, tenants: Tenants) {
  const platform = tenants.platform;
  const requirePlatformAdmin = (req: FastifyRequest) => {
    if (!req.principal.platformAdmin) throw new ApiError(403, "FORBIDDEN", "Only platform admins can use the support console.");
    return req.principal;
  };
  const Id = z.object({ id: z.string().min(1).max(80) });

  // What the server sees of the caller's address: to check the proxy setup (docs/proxy.md).
  app.get("/v1/admin/client-ip", async (req) => {
    requirePlatformAdmin(req);
    const h = (k: string) => (Array.isArray(req.headers[k]) ? (req.headers[k] as string[]).join(", ") : (req.headers[k] as string | undefined)) ?? null;
    return { clientIp: req.clientIp, ip: req.ip, chain: req.ips ?? [req.ip], socket: req.socket.remoteAddress ?? null, xForwardedFor: h("x-forwarded-for"), cfConnectingIp: h("cf-connecting-ip") };
  });
  const record = (id: string) => tenants.record(id) ?? (() => { throw notFound("Workspace"); })();

  const view = async (id: string) => {
    const r = record(id);
    const store = await tenants.get(id);
    const members = tenants.members(id);
    const owner = platform.state.users.find((u) => u.id === r.ownerUserId);
    const usage = usageOf(store.state, members);
    const purchase = (platform.state.purchases ?? []).filter((p) => p.workspaceId === id).at(-1);
    const last = (await store.recentAudit(1))[0];
    return {
      ...r,
      owner: owner ? { id: owner.id, name: owner.name, email: owner.email, disabled: !!owner.disabled } : null,
      members: members.length,
      usage,
      limits: limitsFor(r.plan, r.seats),
      subscription: purchase ? { status: purchase.status, interval: purchase.interval, quantity: purchase.quantity, paidAt: purchase.paidAt, lastInvoiceAt: purchase.lastInvoiceAt, lastFailureAt: purchase.lastFailureAt, cancelledAt: purchase.cancelledAt, subscriptionId: purchase.subscriptionId } : null,
      lastActivityAt: last?.at ?? null,
      lastAction: last?.action ?? null,
      version: store.version,
    };
  };

  app.get("/v1/admin/workspaces", async (req) => {
    requirePlatformAdmin(req);
    const rows = await Promise.all(tenants.records().map((r) => view(r.id)));
    return { workspaces: rows, platformId: tenants.platformId };
  });

  app.get("/v1/admin/workspaces/:id", { schema: { params: Id } }, async (req) => {
    requirePlatformAdmin(req);
    return { workspace: await view(req.params.id), audit: await (await tenants.get(req.params.id)).recentAudit(30) };
  });

  app.patch("/v1/admin/workspaces/:id", { schema: { params: Id, body: z.object({ name: z.string().min(1).max(120).optional(), plan: z.enum(PLANS).optional(), seats: z.number().int().min(1).max(10_000).optional(), status: z.enum(["active", "frozen"]).optional(), frozenReason: z.string().max(200).optional(), note: z.string().max(500).optional() }) } }, async (req) => {
    const me = requirePlatformAdmin(req);
    const r = record(req.params.id);
    const { status, frozenReason, ...rest } = req.body;
    Object.assign(r, Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)));
    if (status === "frozen" && r.status !== "frozen") {
      r.status = "frozen";
      r.frozenAt = platform.now().toISOString();
      r.frozenReason = frozenReason ?? `frozen by support (${me.name})`;
    } else if (status === "active" && r.status !== "active") {
      r.status = "active";
      delete r.frozenAt;
      delete r.frozenReason;
    }
    await platform.commit(me, "support.workspace.update", { workspaceId: r.id, ...req.body });
    return { workspace: await view(r.id) };
  });

  // The owner lost their key: a new one, shown once to the support person who passes it on.
  app.post("/v1/admin/workspaces/:id/owner-key", { schema: { params: Id } }, async (req) => {
    const me = requirePlatformAdmin(req);
    const r = record(req.params.id);
    const owner = platform.state.users.find((u) => u.id === r.ownerUserId);
    if (!owner) throw notFound("Owner");
    const key = newKey();
    owner.keyHash = hashKey(key);
    delete owner.disabled;
    await platform.commit(me, "support.owner-key", { workspaceId: r.id, userId: owner.id });
    return { apiKey: key, owner: { name: owner.name, email: owner.email } };
  });

  // Everything in the workspace as one JSON document: for the owner, or for support.
  // The platform workspace's state also holds every sign-in, sign-up and purchase; an export
  // carries the workspace's own planning data only, never credentials.
  const exportable = (state: typeof platform.state) => {
    const { users: _u, signups: _su, purchases: _p, workspaces: _w, ...rest } = state as typeof state & Record<"users" | "signups" | "purchases" | "workspaces", unknown>;
    return rest;
  };
  const exportOf = async (id: string) => {
    const store = await tenants.get(id);
    const r = tenants.record(id);
    return { exportedAt: platform.now().toISOString(), workspace: r ?? { id, name: store.state.workspace.name }, members: tenants.members(id).map(({ keyHash: _k, passwordHash, sessions: _s, ...u }) => ({ ...u, hasPassword: !!passwordHash })), state: exportable(store.state), version: store.version };
  };
  app.get("/v1/admin/workspaces/:id/export", { schema: { params: Id } }, async (req) => {
    requirePlatformAdmin(req);
    record(req.params.id);
    return exportOf(req.params.id);
  });
  app.get("/v1/workspace/export", async (req) => {
    requirePermission(req, "users");
    return exportOf(req.principal.workspaceId);
  });
}
