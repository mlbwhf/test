import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { IdempotencyStore } from "@gate/db";

export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly m = new Map<string, { requestHash: string; statusCode: number; response: unknown }>();
  async get(org: string, key: string) { return this.m.get(`${org}:${key}`); }
  async put(org: string, key: string, rec: { requestHash: string; statusCode: number; response: unknown }) { this.m.set(`${org}:${key}`, rec); }
}

declare module "fastify" {
  interface FastifyRequest { idempotency?: { key: string; requestHash: string } }
}

/**
 * Idempotency-Key support for mutating requests: the same key with the same
 * body replays the stored response; the same key with a different body is a
 * 422 so a retry can never silently do something else.
 */
export function registerIdempotency(app: FastifyInstance, store: IdempotencyStore): void {
  app.addHook("preHandler", async (req, reply) => {
    if (req.method !== "POST" || !req.org) return;
    const key = req.headers["idempotency-key"];
    if (typeof key !== "string" || !key) return;
    const requestHash = createHash("sha256").update(`${req.method} ${req.url}\n${JSON.stringify(req.body ?? null)}`).digest("hex");
    const prior = await store.get(req.org.id, key);
    if (prior) {
      if (prior.requestHash !== requestHash) {
        return reply.code(422).send({ error: { code: "IDEMPOTENCY_CONFLICT", message: `Idempotency-Key ${key} was already used with a different request`, hint: "use a new key for a new request" } });
      }
      reply.header("idempotent-replayed", "true");
      return reply.code(prior.statusCode).send(prior.response);
    }
    req.idempotency = { key, requestHash };
  });
  app.addHook("onSend", async (req, reply, payload) => {
    if (!req.idempotency || !req.org || reply.statusCode >= 500) return payload;
    try {
      const response = typeof payload === "string" ? JSON.parse(payload) : payload;
      await store.put(req.org.id, req.idempotency.key, { requestHash: req.idempotency.requestHash, statusCode: reply.statusCode, response });
    } catch { /* non-JSON payloads are not replayable */ }
    return payload;
  });
}
