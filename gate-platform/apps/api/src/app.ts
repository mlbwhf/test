import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { hasZodFastifySchemaValidationErrors, jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { Core, DomainError, FakePaymentsAdapter, type Organization } from "@gate/core";
import { AiGatewayError, type AiGateway, Copilot } from "@gate/ai-gateway";
import type { IdempotencyStore } from "@gate/db";
import type { StripePaymentsAdapter } from "@gate/payments-stripe";
import { InMemoryIdempotencyStore, registerIdempotency } from "./plugins/idempotency.js";
import * as S from "./schemas.js";

declare module "fastify" {
  interface FastifyRequest { org?: Organization }
}

export interface AppDeps {
  core: Core;
  /** Present when the Stripe adapter is configured; enables /v1/webhooks/stripe. */
  stripe?: StripePaymentsAdapter;
  ai?: AiGateway;
  idempotency?: IdempotencyStore;
  adminKey?: string;
  env?: "development" | "test" | "production";
  logger?: boolean;
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const env = deps.env ?? "development";
  const app = Fastify({ logger: deps.logger ?? false, genReqId: () => `req_${Math.random().toString(36).slice(2, 12)}` }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cors, { origin: true, allowedHeaders: ["content-type", "x-api-key", "idempotency-key"] });
  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: { title: "Gate Platform API", version: "0.1.0", description: "Events money OS: ticketing, split payments, payouts, ledger. All amounts are integer minor units." },
      components: { securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "x-api-key" }, adminKey: { type: "apiKey", in: "header", name: "x-admin-key" } } },
      security: [{ apiKey: [] }],
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  // ---------- errors ----------
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof DomainError) {
      return reply.code(err.httpStatus).send({ error: { code: err.code, message: err.message, ...(err.hint ? { hint: err.hint } : {}), requestId: req.id } });
    }
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.code(400).send({ error: { code: "VALIDATION", message: err.validation.map((v) => `${v.instancePath || "body"} ${v.message}`).join("; "), requestId: req.id } });
    }
    if (err instanceof AiGatewayError) {
      const status = err.code === "BUDGET_EXCEEDED" ? 429 : err.code === "FEATURE_DISABLED" ? 403 : 503;
      return reply.code(status).send({ error: { code: err.code, message: err.message, requestId: req.id } });
    }
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) req.log.error(err);
    return reply.code(status).send({ error: { code: status >= 500 ? "INTERNAL" : "REQUEST", message: status >= 500 ? "internal error" : (err as Error).message, requestId: req.id } });
  });

  app.get("/health", { schema: { tags: ["system"], security: [], response: { 200: z.object({ ok: z.boolean(), payments: z.string(), env: z.string() }) } } }, async () => ({ ok: true, payments: deps.core.payments.provider, env }));

  // ---------- admin: create organizations ----------
  app.post("/v1/organizations", {
    schema: { tags: ["organizations"], security: [{ adminKey: [] }], body: S.CreateOrganizationBody, response: { 201: z.object({ organization: S.OrganizationSchema, apiKey: z.string() }), 401: S.ErrorSchema } },
  }, async (req, reply) => {
    if (!deps.adminKey || req.headers["x-admin-key"] !== deps.adminKey) throw new DomainError("UNAUTHORIZED", "x-admin-key required");
    const res = await deps.core.createOrganization(req.body);
    return reply.code(201).send({ organization: S.toOrganization(res.organization), apiKey: res.apiKey });
  });

  // ---------- webhooks (raw body, no api key) ----------
  await app.register(async (hooksRaw) => {
    const hooks = hooksRaw.withTypeProvider<ZodTypeProvider>();
    hooks.addContentTypeParser("application/json", { parseAs: "buffer" }, (_req, body, done) => done(null, body));
    hooks.post("/v1/webhooks/stripe", { schema: { tags: ["webhooks"], security: [], response: { 200: z.object({ received: z.boolean(), handled: z.boolean(), reason: z.string().optional() }) } } }, async (req, reply) => {
      if (!deps.stripe) throw new DomainError("INVALID_STATE", "stripe is not configured");
      const sig = req.headers["stripe-signature"];
      if (typeof sig !== "string") throw new DomainError("UNAUTHORIZED", "missing stripe-signature");
      let event;
      try {
        event = deps.stripe.parseWebhook(req.body as Buffer, sig);
      } catch (err) {
        throw new DomainError("UNAUTHORIZED", `invalid webhook signature: ${(err as Error).message}`);
      }
      const result = await deps.core.handlePaymentEvent(event);
      return reply.send({ received: true, handled: result.handled, ...(result.reason ? { reason: result.reason } : {}) });
    });
  });

  // ---------- authenticated tenant API ----------
  await app.register(async (apiRaw) => {
    const api = apiRaw.withTypeProvider<ZodTypeProvider>();
    api.addHook("preHandler", async (req) => {
      const key = req.headers["x-api-key"];
      req.org = await deps.core.authenticate(typeof key === "string" ? key : undefined);
    });
    registerIdempotency(api, deps.idempotency ?? new InMemoryIdempotencyStore());
    const org = (req: { org?: Organization }) => req.org!;

    api.get("/v1/organizations/me", { schema: { tags: ["organizations"], response: { 200: S.OrganizationSchema } } }, async (req) => S.toOrganization(org(req)));

    api.post("/v1/organizations/me/payments/connect", { schema: { tags: ["organizations"], body: z.object({ email: z.string().email().optional() }).optional(), response: { 200: z.object({ paymentsAccountRef: z.string(), onboardingUrl: z.string().nullable() }) } } }, async (req) => {
      const res = await deps.core.connectPayments(org(req).id, req.body?.email);
      return { paymentsAccountRef: res.paymentsAccountRef!, onboardingUrl: res.onboardingUrl ?? null };
    });

    api.get("/v1/parties", { schema: { tags: ["parties"], response: { 200: z.object({ items: z.array(S.PartySchema) }) } } }, async (req) => ({ items: (await deps.core.listParties(org(req).id)).map(S.toParty) }));
    api.post("/v1/parties", { schema: { tags: ["parties"], body: S.CreatePartyBody, response: { 201: S.PartySchema } } }, async (req, reply) => reply.code(201).send(S.toParty(await deps.core.createParty(org(req).id, req.body))));

    api.get("/v1/events", { schema: { tags: ["events"], response: { 200: z.object({ items: z.array(S.EventSchema) }) } } }, async (req) => ({ items: (await deps.core.listEvents(org(req).id)).map(S.toEvent) }));
    api.post("/v1/events", { schema: { tags: ["events"], body: S.CreateEventBody, response: { 201: S.EventSchema } } }, async (req, reply) => {
      const { startsAt, ...rest } = req.body;
      return reply.code(201).send(S.toEvent(await deps.core.createEvent(org(req).id, { ...rest, startsAt: new Date(startsAt) })));
    });
    api.get("/v1/events/:id", { schema: { tags: ["events"], params: z.object({ id: z.string() }), response: { 200: S.EventSchema, 404: S.ErrorSchema } } }, async (req) => S.toEvent(await deps.core.getEvent(org(req).id, req.params.id)));
    api.get("/v1/events/:id/ticket-types", { schema: { tags: ["events"], params: z.object({ id: z.string() }), response: { 200: z.object({ items: z.array(S.TicketTypeSchema) }) } } }, async (req) => ({ items: await deps.core.listTicketTypes(org(req).id, req.params.id) }));
    api.post("/v1/events/:id/ticket-types", { schema: { tags: ["events"], params: z.object({ id: z.string() }), body: S.CreateTicketTypeBody, response: { 201: S.TicketTypeSchema } } }, async (req, reply) => reply.code(201).send(await deps.core.createTicketType(org(req).id, req.params.id, req.body)));

    api.get("/v1/orders", { schema: { tags: ["orders"], querystring: z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }), response: { 200: z.object({ items: z.array(S.OrderSchema) }) } } }, async (req) => ({ items: (await deps.core.listOrders(org(req).id, req.query.limit)).map(S.toOrder) }));
    api.get("/v1/orders/:id", { schema: { tags: ["orders"], params: z.object({ id: z.string() }), response: { 200: S.OrderSchema, 404: S.ErrorSchema } } }, async (req) => S.toOrder(await deps.core.getOrder(org(req).id, req.params.id)));
    api.post("/v1/orders", {
      schema: {
        tags: ["orders"], body: S.CreateOrderBody, querystring: z.object({ dry_run: z.enum(["true", "false"]).optional() }),
        response: { 200: z.object({ order: S.OrderSchema, clientSecret: z.string().nullable(), dryRun: z.boolean() }), 201: z.object({ order: S.OrderSchema, clientSecret: z.string().nullable(), dryRun: z.boolean() }), 409: S.ErrorSchema },
      },
    }, async (req, reply) => {
      const dryRun = req.body.dryRun === true || req.query.dry_run === "true";
      const idem = req.headers["idempotency-key"];
      const res = await deps.core.createOrder(org(req).id, { ...req.body, dryRun, ...(typeof idem === "string" ? { idempotencyKey: idem } : {}) });
      return reply.code(res.created ? 201 : 200).send({ order: S.toOrder(res.order), clientSecret: res.clientSecret, dryRun });
    });

    api.post("/v1/refunds", { schema: { tags: ["refunds"], body: S.CreateRefundBody, response: { 201: z.object({ refund: S.RefundSchema }), 409: S.ErrorSchema } } }, async (req, reply) => {
      const idem = req.headers["idempotency-key"];
      const refund = await deps.core.refundOrder(org(req).id, { ...req.body, ...(typeof idem === "string" ? { idempotencyKey: idem } : {}) });
      return reply.code(201).send({ refund: S.toRefund(refund) });
    });

    api.get("/v1/ledger/balances", { schema: { tags: ["ledger"], response: { 200: z.object({ accounts: z.array(S.BalanceSchema) }) } } }, async (req) => ({ accounts: await deps.core.balancesFor(org(req).id) }));
    api.get("/v1/ledger/entries", { schema: { tags: ["ledger"], querystring: z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }), response: { 200: z.object({ items: z.array(z.object({ id: z.string(), description: z.string(), currency: z.string(), effectiveAt: z.string(), postings: z.array(z.object({ accountCode: z.string(), amount: z.number().int() })), metadata: z.record(z.string(), z.string()).optional() })) }) } } }, async (req) => {
      const o = org(req);
      const accounts = await deps.core.ledger.listAccounts({ tenantId: o.id });
      const ids = new Map(accounts.map((a) => [a.id, a.code]));
      const seen = new Set<string>();
      const items = [];
      for (const a of accounts) {
        for (const e of await deps.core.ledger.listEntries({ accountId: a.id, limit: req.query.limit ?? 100 })) {
          if (seen.has(e.id)) continue;
          seen.add(e.id);
          items.push({ id: e.id, description: e.description, currency: e.currency, effectiveAt: e.effectiveAt.toISOString(), postings: e.postings.map((p) => ({ accountCode: ids.get(p.accountId) ?? "platform:*", amount: p.amount })), ...(e.metadata ? { metadata: e.metadata } : {}) });
        }
      }
      return { items };
    });

    // ---------- AI copilot (read-only; never moves money) ----------
    api.post("/v1/copilot/explain-order", { schema: { tags: ["copilot"], body: z.object({ orderId: z.string(), question: z.string().max(2000).optional() }), response: { 200: z.object({ answer: z.unknown(), model: z.string(), refused: z.boolean() }) } } }, async (req) => {
      if (!deps.ai) throw new DomainError("INVALID_STATE", "AI is not configured", "set ANTHROPIC_API_KEY or a tenant AI config");
      const o = org(req);
      const order = await deps.core.getOrder(o.id, req.body.orderId);
      const accounts = await deps.core.ledger.listAccounts({ tenantId: o.id });
      const entries = (await Promise.all(accounts.map((a) => deps.core.ledger.listEntries({ accountId: a.id, limit: 50 })))).flat().filter((e) => e.metadata?.orderId === order.id);
      const res = await new Copilot(deps.ai).explainOrder(o.id, { order: S.toOrder(order), ledgerEntries: entries, ...(req.body.question ? { question: req.body.question } : {}) });
      return { answer: res.parsed ?? res.text, model: res.model, refused: res.refused };
    });
    api.post("/v1/copilot/triage", { schema: { tags: ["copilot"], body: z.object({ message: z.string().min(1).max(5000) }), response: { 200: z.object({ triage: z.unknown(), model: z.string(), refused: z.boolean() }) } } }, async (req) => {
      if (!deps.ai) throw new DomainError("INVALID_STATE", "AI is not configured", "set ANTHROPIC_API_KEY or a tenant AI config");
      const res = await new Copilot(deps.ai).triageSupport(org(req).id, req.body.message);
      return { triage: res.parsed ?? res.text, model: res.model, refused: res.refused };
    });

    // ---------- dev-only: simulate provider events when running on the fake adapter ----------
    if (env !== "production" && deps.core.payments instanceof FakePaymentsAdapter) {
      const fake = deps.core.payments;
      api.post("/v1/dev/payments/:paymentRef/succeed", { schema: { tags: ["dev"], params: z.object({ paymentRef: z.string() }), response: { 200: z.object({ handled: z.boolean(), reason: z.string().optional() }) } } }, async (req) => {
        const order = await deps.core.repos.orders.getByPaymentRef(req.params.paymentRef);
        if (!order || order.organizationId !== org(req).id) throw new DomainError("NOT_FOUND", `payment ${req.params.paymentRef} not found`);
        const r = await deps.core.handlePaymentEvent(fake.succeed(order.paymentRef!, order.pricing.totalMinor, order.currency));
        return { handled: r.handled, ...(r.reason ? { reason: r.reason } : {}) };
      });
      api.post("/v1/dev/payments/:paymentRef/fail", { schema: { tags: ["dev"], params: z.object({ paymentRef: z.string() }), response: { 200: z.object({ handled: z.boolean(), reason: z.string().optional() }) } } }, async (req) => {
        const order = await deps.core.repos.orders.getByPaymentRef(req.params.paymentRef);
        if (!order || order.organizationId !== org(req).id) throw new DomainError("NOT_FOUND", `payment ${req.params.paymentRef} not found`);
        const r = await deps.core.handlePaymentEvent(fake.fail(order.paymentRef!));
        return { handled: r.handled, ...(r.reason ? { reason: r.reason } : {}) };
      });
    }
  });

  return app;
}
