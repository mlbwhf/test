import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { DomainError, WEBHOOK_EVENTS, type ApiKey, type Integrations, type Organization, type WebhookDelivery, type WebhookEndpoint } from "@gate/core";
import { GateClient, handleMcpHttp } from "@gate/mcp";
import { bearer } from "./auth.js";
import * as S from "./schemas.js";

const KeyOut = z.object({ id: z.string(), name: z.string(), prefix: z.string(), access: z.enum(["full", "read"]), createdAt: z.string(), lastUsedAt: z.string().nullable(), revokedAt: z.string().nullable() });
const keyOut = (k: ApiKey) => ({ id: k.id, name: k.name, prefix: k.prefix, access: k.access, createdAt: k.createdAt.toISOString(), lastUsedAt: k.lastUsedAt?.toISOString() ?? null, revokedAt: k.revokedAt?.toISOString() ?? null });
const HookOut = z.object({ id: z.string(), url: z.string(), secret: z.string(), events: z.array(z.string()), description: z.string().nullable(), enabled: z.boolean(), createdAt: z.string() });
const hookOut = (w: WebhookEndpoint) => ({ id: w.id, url: w.url, secret: w.secret, events: w.events, description: w.description ?? null, enabled: !w.disabledAt, createdAt: w.createdAt.toISOString() });
const DeliveryOut = z.object({ id: z.string(), type: z.string(), status: z.enum(["pending", "succeeded", "failed"]), attempts: z.number(), responseStatus: z.number().nullable(), error: z.string().nullable(), createdAt: z.string(), updatedAt: z.string(), body: z.string() });
const deliveryOut = (d: WebhookDelivery) => ({ id: d.id, type: d.type, status: d.status, attempts: d.attempts, responseStatus: d.responseStatus ?? null, error: d.error ?? null, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString(), body: d.body });

/** The API key in x-api-key or `Authorization: Bearer`, when it is an organizer-made `eck_` key. */
export function presentedKey(req: FastifyRequest): string | undefined {
  const header = req.headers["x-api-key"];
  const k = typeof header === "string" && header ? header : bearer(req);
  return k?.startsWith("eck_") ? k : undefined;
}

/** Key and webhook management: people signed in as owner or admin only (a key can't mint keys). */
export function registerIntegrationRoutes(api: FastifyInstance, ints: Integrations, ctx: (req: FastifyRequest) => { org: Organization; userId?: string | undefined }) {
  const r = api.withTypeProvider<ZodTypeProvider>();
  const person = (req: FastifyRequest) => {
    const c = ctx(req);
    if (!c.userId) throw new DomainError("FORBIDDEN", "manage integrations from the EnrollClass console", "API keys can't create or change keys and webhooks");
    return c;
  };

  r.get("/v1/api-keys", { schema: { tags: ["integrations"], response: { 200: z.object({ items: z.array(KeyOut) }) } } }, async (req) => ({ items: (await ints.listApiKeys(person(req).org.id)).map(keyOut) }));
  r.post("/v1/api-keys", { schema: { tags: ["integrations"], body: z.object({ name: z.string().min(1).max(80), access: z.enum(["full", "read"]) }), response: { 201: z.object({ key: KeyOut, secret: z.string() }) } } }, async (req, reply) => {
    const c = person(req);
    const { key, secret } = await ints.createApiKey(c.org.id, { ...req.body, createdByUserId: c.userId });
    return reply.code(201).send({ key: keyOut(key), secret });
  });
  r.delete("/v1/api-keys/:id", { schema: { tags: ["integrations"], params: z.object({ id: z.string() }), response: { 200: z.object({ ok: z.boolean() }), 404: S.ErrorSchema } } }, async (req) => {
    await ints.revokeApiKey(person(req).org.id, req.params.id);
    return { ok: true };
  });

  r.get("/v1/webhooks", { schema: { tags: ["integrations"], response: { 200: z.object({ items: z.array(HookOut), events: z.array(z.string()) }) } } }, async (req) => ({ items: (await ints.listWebhooks(person(req).org.id)).map(hookOut), events: [...WEBHOOK_EVENTS] }));
  r.post("/v1/webhooks", { schema: { tags: ["integrations"], body: z.object({ url: z.string().url().max(2000), events: z.array(z.string()).min(1).max(WEBHOOK_EVENTS.length), description: z.string().max(200).optional() }), response: { 201: HookOut, 400: S.ErrorSchema, 409: S.ErrorSchema } } }, async (req, reply) => reply.code(201).send(hookOut(await ints.createWebhook(person(req).org.id, req.body))));
  r.patch("/v1/webhooks/:id", { schema: { tags: ["integrations"], params: z.object({ id: z.string() }), body: z.object({ events: z.array(z.string()).min(1).optional(), enabled: z.boolean().optional() }), response: { 200: HookOut, 400: S.ErrorSchema, 404: S.ErrorSchema } } }, async (req) => hookOut(await ints.updateWebhook(person(req).org.id, req.params.id, req.body)));
  r.post("/v1/webhooks/:id/test", { schema: { tags: ["integrations"], params: z.object({ id: z.string() }), response: { 200: DeliveryOut, 404: S.ErrorSchema } } }, async (req) => deliveryOut(await ints.testWebhook(person(req).org.id, req.params.id)));
  r.get("/v1/webhooks/:id/deliveries", { schema: { tags: ["integrations"], params: z.object({ id: z.string() }), response: { 200: z.object({ items: z.array(DeliveryOut) }), 404: S.ErrorSchema } } }, async (req) => ({ items: (await ints.listDeliveries(person(req).org.id, req.params.id)).map(deliveryOut) }));
}

/**
 * Hosted MCP endpoint: POST /mcp with `Authorization: Bearer eck_…`. Tools call this same API
 * in-process with the caller's key, so every permission rule applies unchanged.
 */
export function registerMcpRoute(app: FastifyInstance, ints: Integrations) {
  const inProcess = (async (input: string | URL | Request, init?: RequestInit) => {
    const u = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const res = await app.inject({ method: (init?.method ?? "GET") as "GET", url: u.pathname + u.search, headers: (init?.headers ?? {}) as Record<string, string>, ...(init?.body ? { payload: String(init.body) } : {}) });
    const empty = res.statusCode === 204 || res.statusCode === 304;
    return new Response(empty ? null : res.body, { status: res.statusCode, headers: { "content-type": String(res.headers["content-type"] ?? "application/json") } });
  }) as typeof fetch;

  const handler = async (req: FastifyRequest, reply: import("fastify").FastifyReply) => {
    const secret = presentedKey(req);
    const key = secret ? await ints.authenticateKey(secret) : undefined;
    if (!secret || !key) {
      return reply.code(401).header("www-authenticate", 'Bearer realm="EnrollClass"').send({ error: { code: "UNAUTHORIZED", message: "send an EnrollClass API key as Authorization: Bearer eck_…", hint: "create one in Team → Integrations" } });
    }
    reply.hijack();
    await handleMcpHttp(req.raw, reply.raw, req.body, new GateClient({ baseUrl: "http://in-process", apiKey: secret, fetch: inProcess }));
  };
  app.post("/mcp", { schema: { hide: true } }, handler);
  // Stateless server: no server-initiated stream and no sessions to end.
  app.get("/mcp", { schema: { hide: true } }, async (_req, reply) => reply.code(405).header("allow", "POST").send({ error: { code: "METHOD_NOT_ALLOWED", message: "use POST" } }));
  app.delete("/mcp", { schema: { hide: true } }, async (_req, reply) => reply.code(405).header("allow", "POST").send({ error: { code: "METHOD_NOT_ALLOWED", message: "use POST" } }));
}
