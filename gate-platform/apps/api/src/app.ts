import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { hasZodFastifySchemaValidationErrors, jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { Core, DomainError, FakePaymentsAdapter, buildIcs, courseJsonLd, type Organization } from "@gate/core";
import rateLimit from "@fastify/rate-limit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
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
  /** Public URL of the organizer-facing pages, used in JSON-LD. */
  publicPageUrl?: (orgId: string, courseSlug: string) => string;
  /** Path to the built embeddable widget bundle; defaults to apps/widget/dist/gate-widget.js in the monorepo. */
  widgetBundlePath?: string;
  /** Base URL this API is reachable at, for the widget demo page. */
  publicUrl?: string;
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

  // ---------- embeddable widget bundle + demo page ----------
  const widgetPath = deps.widgetBundlePath ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../widget/dist/gate-widget.js");
  let widgetCache: { body: string; etag: string } | undefined;
  app.get("/widget/v1/gate-widget.js", { schema: { tags: ["widget"], security: [], response: { 200: z.string(), 304: z.string(), 404: S.ErrorSchema } } }, async (req, reply) => {
    if (!widgetCache || env !== "production") {
      try {
        const body = await readFile(widgetPath, "utf8");
        widgetCache = { body, etag: `"${Buffer.byteLength(body).toString(16)}-${body.length.toString(36)}"` };
      } catch {
        throw new DomainError("NOT_FOUND", "widget bundle is not built", "run `pnpm --filter @gate/widget build`");
      }
    }
    if (req.headers["if-none-match"] === widgetCache.etag) return reply.code(304).send("");
    return reply.header("content-type", "application/javascript; charset=utf-8").header("cache-control", "public, max-age=300").header("etag", widgetCache.etag).send(widgetCache.body);
  });
  app.get("/widget/v1/demo", { schema: { tags: ["widget"], security: [], querystring: z.object({ org: z.string(), course: z.string(), currency: z.string().optional(), stripePk: z.string().optional() }), response: { 200: z.string() } } }, async (req, reply) => {
    const base = deps.publicUrl ?? "";
    const attrs = [`data-gate-api="${base}"`, `data-gate-org="${req.query.org}"`, `data-gate-course="${req.query.course}"`, ...(req.query.currency ? [`data-gate-currency="${req.query.currency}"`] : []), ...(req.query.stripePk ? [`data-gate-stripe-pk="${req.query.stripePk}"`] : [])].join(" ");
    return reply.header("content-type", "text/html; charset=utf-8").send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gate widget demo</title></head><body style="font-family:system-ui;max-width:720px;margin:40px auto;padding:0 16px"><h1>Course page (demo)</h1><p>This is what an organizer's course page looks like with the widget embedded.</p><div data-gate-widget ${attrs}></div><script src="${base}/widget/v1/gate-widget.js" async></script></body></html>`);
  });

  // ---------- public catalogue + checkout (no api key; rate limited) ----------
  await app.register(async (pubRaw) => {
    const pub = pubRaw.withTypeProvider<ZodTypeProvider>();
    await pub.register(rateLimit, { max: 120, timeWindow: "1 minute" });
    const OrgCourseParams = z.object({ orgId: z.string(), slug: z.string() });

    pub.get("/public/v1/organizations/:orgId/courses/:slug", { schema: { tags: ["public"], security: [], params: OrgCourseParams, response: { 200: S.PublicCourseSchema, 404: S.ErrorSchema } } }, async (req) => {
      const res = await deps.core.publicCourse(req.params.orgId, req.params.slug);
      return {
        organization: res.organization,
        course: S.toCourse(res.course),
        cohorts: res.cohorts.map((c) => ({ event: S.toEvent(c.event), ticketTypes: c.ticketTypes.map((t) => ({ ...t, earlyBirdUntil: t.earlyBirdUntil?.toISOString() ?? null })) })),
      };
    });

    pub.get("/public/v1/organizations/:orgId/courses/:slug/jsonld", { schema: { tags: ["public"], security: [], params: OrgCourseParams, querystring: z.object({ pageUrl: z.string().url().optional() }), response: { 200: z.record(z.string(), z.unknown()), 404: S.ErrorSchema } } }, async (req, reply) => {
      const res = await deps.core.publicCourse(req.params.orgId, req.params.slug);
      const pageUrl = req.query.pageUrl ?? deps.publicPageUrl?.(req.params.orgId, req.params.slug) ?? `urn:gate:course:${res.course.id}`;
      const doc = courseJsonLd({
        organization: res.organization, course: res.course, pageUrl,
        cohorts: res.cohorts.map((c) => {
          const cheapest = c.ticketTypes.map((t) => ({ p: t.prices[c.event.currency], r: t.remaining })).filter((x): x is { p: number; r: number } => x.p !== undefined).sort((a, b) => a.p - b.p)[0];
          return { event: c.event, priceMinor: cheapest?.p, currency: c.event.currency, remaining: c.ticketTypes.reduce((a, t) => a + t.remaining, 0) };
        }),
      });
      return reply.header("content-type", "application/ld+json; charset=utf-8").send(doc);
    });

    pub.get("/public/v1/orders/:orderId", { schema: { tags: ["public"], security: [], params: z.object({ orderId: z.string() }), querystring: z.object({ buyerEmail: z.string().email() }), response: { 200: z.object({ order: S.OrderSchema }), 404: S.ErrorSchema } } }, async (req) => {
      const o = await deps.core.publicOrder(req.params.orderId, req.query.buyerEmail);
      return { order: { ...S.toOrder(o), splits: { organizerMinor: 0, lines: [] }, transferRefs: {} } };
    });

    pub.get("/public/v1/seats/:seatId/calendar.ics", { schema: { tags: ["public"], security: [], params: z.object({ seatId: z.string() }), response: { 200: z.string(), 404: S.ErrorSchema } } }, async (req, reply) => {
      const { seat, event, course, organization } = await deps.core.publicSeat(req.params.seatId);
      const ics = buildIcs({
        uid: `seat-${seat.id}`, summary: course?.name ?? event.name,
        description: `${event.name}\nOrganizer: ${organization.name}`,
        attendeeEmail: seat.attendee.email, sessions: event.sessions,
        fallback: { startsAt: event.startsAt, endsAt: event.endsAt ?? event.startsAt },
        location: event.format === "in_person" ? undefined : "Online (joining link to follow)",
      });
      return reply.header("content-type", "text/calendar; charset=utf-8").header("content-disposition", `attachment; filename="${(course?.slug ?? "cohort")}.ics"`).send(ics);
    });

    // ----- learner self-service: seat id + attendee email are the credential -----
    const seatOptionsOut = async (seatId: string, email: string) => {
      const o = await deps.core.seatOptions(seatId, { attendeeEmail: email });
      return {
        seat: S.toSeat(o.seat), event: S.toEvent(o.event), course: o.course ? S.toCourse(o.course) : null, organization: { id: o.organization.id, name: o.organization.name },
        policy: {
          transfer: { ...o.policyTerms.transfer, freeUntil: o.policyTerms.transfer.freeUntil.toISOString() },
          cancel: { ...o.policyTerms.cancel, fullRefundUntil: o.policyTerms.cancel.fullRefundUntil.toISOString() },
          substitute: { ...o.policyTerms.substitute, until: o.policyTerms.substitute.until.toISOString() },
        },
        transferOptions: o.transferOptions.map((t) => ({ ...t, startsAt: t.startsAt.toISOString(), endsAt: t.endsAt?.toISOString() ?? null })),
        calendarUrl: `${deps.publicUrl ?? ""}/public/v1/seats/${o.seat.id}/calendar.ics`,
      };
    };
    pub.get("/public/v1/seats/:seatId", { schema: { tags: ["public"], security: [], params: z.object({ seatId: z.string() }), querystring: z.object({ email: z.string().email() }), response: { 200: S.SeatOptionsSchema, 404: S.ErrorSchema } } }, async (req) => seatOptionsOut(req.params.seatId, req.query.email));
    pub.post("/public/v1/seats/:seatId/substitute", { schema: { tags: ["public"], security: [], params: z.object({ seatId: z.string() }), body: z.object({ email: z.string().email(), attendee: S.AttendeeSchema }), response: { 200: z.object({ seat: S.SeatSchema }), 404: S.ErrorSchema, 409: S.ErrorSchema } } }, async (req) => ({ seat: S.toSeat(await deps.core.substituteSeat(req.params.seatId, req.body.attendee, { attendeeEmail: req.body.email })) }));
    pub.post("/public/v1/seats/:seatId/transfer", { schema: { tags: ["public"], security: [], params: z.object({ seatId: z.string() }), body: z.object({ email: z.string().email(), toEventId: z.string() }), response: { 200: z.object({ seat: S.SeatSchema.nullable(), transfer: S.SeatTransferSchema, clientSecret: z.string().nullable() }), 404: S.ErrorSchema, 409: S.ErrorSchema } } }, async (req) => {
      const r = await deps.core.transferSeat(req.params.seatId, req.body.toEventId, { attendeeEmail: req.body.email });
      return { seat: r.seat ? S.toSeat(r.seat) : null, transfer: S.toTransfer(r.transfer), clientSecret: r.clientSecret };
    });
    pub.post("/public/v1/seats/:seatId/cancel", { schema: { tags: ["public"], security: [], params: z.object({ seatId: z.string() }), body: z.object({ email: z.string().email(), reason: z.string().max(500).optional() }), response: { 200: z.object({ seat: S.SeatSchema, refund: z.object({ id: z.string(), amountMinor: z.number().int(), status: z.string() }).nullable() }), 404: S.ErrorSchema, 409: S.ErrorSchema } } }, async (req) => {
      const r = await deps.core.cancelSeat(req.params.seatId, req.body.reason ?? "", { attendeeEmail: req.body.email });
      return { seat: S.toSeat(r.seat), refund: r.refund ? { id: r.refund.id, amountMinor: r.refund.amountMinor, status: r.refund.status } : null };
    });
    pub.post("/public/v1/organizations/:orgId/waitlist", { schema: { tags: ["public"], security: [], params: z.object({ orgId: z.string() }), body: S.JoinWaitlistBody, response: { 201: z.object({ entry: S.WaitlistEntrySchema.extend({ position: z.number().int() }) }), 409: S.ErrorSchema } } }, async (req, reply) => {
      const r = await deps.core.joinWaitlist(req.params.orgId, req.body);
      return reply.code(201).send({ entry: { ...S.toWaitlist(r.entry), position: r.position } });
    });

    pub.post("/public/v1/organizations/:orgId/orders", {
      schema: {
        tags: ["public"], security: [], params: z.object({ orgId: z.string() }), body: S.CreateOrderBody,
        response: { 201: z.object({ order: S.OrderSchema, clientSecret: z.string().nullable(), dryRun: z.boolean() }), 200: z.object({ order: S.OrderSchema, clientSecret: z.string().nullable(), dryRun: z.boolean() }), 409: S.ErrorSchema },
      },
    }, async (req, reply) => {
      const idem = req.headers["idempotency-key"];
      const dryRun = req.body.dryRun === true;
      const res = await deps.core.createOrder(req.params.orgId, { ...req.body, dryRun, ...(typeof idem === "string" ? { idempotencyKey: idem } : {}) });
      // Buyers never see split or transfer internals.
      const order = S.toOrder(res.order);
      return reply.code(res.created ? 201 : 200).send({ order: { ...order, splits: { organizerMinor: 0, lines: [] }, transferRefs: {} }, clientSecret: res.clientSecret, dryRun });
    });

    if (env !== "production" && deps.core.payments instanceof FakePaymentsAdapter) {
      const fake = deps.core.payments;
      pub.post("/public/v1/dev/payments/:paymentRef/succeed", { schema: { tags: ["dev"], security: [], params: z.object({ paymentRef: z.string() }), response: { 200: z.object({ handled: z.boolean(), reason: z.string().optional() }) } } }, async (req) => {
        const { amountMinor, currency } = await fakePaymentFor(req.params.paymentRef);
        const r = await deps.core.handlePaymentEvent(fake.succeed(req.params.paymentRef, amountMinor, currency));
        return { handled: r.handled, ...(r.reason ? { reason: r.reason } : {}) };
      });
    }
  });

  /** Test mode only: what amount/currency a fake payment ref stands for (order, transfer fee or invoice card payment). */
  const fakePaymentFor = async (paymentRef: string, organizationId?: string) => {
    const order = await deps.core.repos.orders.getByPaymentRef(paymentRef);
    if (order && (!organizationId || order.organizationId === organizationId)) return { amountMinor: order.pricing.totalMinor, currency: order.currency };
    const transfer = await deps.core.repos.seatTransfers.getByPaymentRef(paymentRef);
    if (transfer && (!organizationId || transfer.organizationId === organizationId)) return { amountMinor: transfer.feeMinor, currency: transfer.currency };
    const invoice = await deps.core.repos.invoices.getByCardPaymentRef(paymentRef);
    if (invoice && (!organizationId || invoice.organizationId === organizationId)) return { amountMinor: invoice.totalMinor - invoice.paidMinor, currency: invoice.currency };
    throw new DomainError("NOT_FOUND", `payment ${paymentRef} not found`);
  };

  const seatOptionsOutFrom = (o: Awaited<ReturnType<Core["seatOptions"]>>) => ({
    seat: S.toSeat(o.seat), event: S.toEvent(o.event), course: o.course ? S.toCourse(o.course) : null, organization: { id: o.organization.id, name: o.organization.name },
    policy: {
      transfer: { ...o.policyTerms.transfer, freeUntil: o.policyTerms.transfer.freeUntil.toISOString() },
      cancel: { ...o.policyTerms.cancel, fullRefundUntil: o.policyTerms.cancel.fullRefundUntil.toISOString() },
      substitute: { ...o.policyTerms.substitute, until: o.policyTerms.substitute.until.toISOString() },
    },
    transferOptions: o.transferOptions.map((t) => ({ ...t, startsAt: t.startsAt.toISOString(), endsAt: t.endsAt?.toISOString() ?? null })),
    calendarUrl: `${deps.publicUrl ?? ""}/public/v1/seats/${o.seat.id}/calendar.ics`,
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

    api.get("/v1/courses", { schema: { tags: ["courses"], response: { 200: z.object({ items: z.array(S.CourseSchema) }) } } }, async (req) => ({ items: (await deps.core.listCourses(org(req).id)).map(S.toCourse) }));
    api.post("/v1/courses", { schema: { tags: ["courses"], body: S.CreateCourseBody, response: { 201: S.CourseSchema, 409: S.ErrorSchema } } }, async (req, reply) => reply.code(201).send(S.toCourse(await deps.core.createCourse(org(req).id, req.body))));
    api.get("/v1/courses/:id", { schema: { tags: ["courses"], params: z.object({ id: z.string() }), response: { 200: S.CourseSchema, 404: S.ErrorSchema } } }, async (req) => S.toCourse(await deps.core.getCourse(org(req).id, req.params.id)));
    api.get("/v1/courses/:id/cohorts", { schema: { tags: ["courses"], params: z.object({ id: z.string() }), response: { 200: z.object({ items: z.array(S.EventSchema) }) } } }, async (req) => ({ items: (await deps.core.listCohorts(org(req).id, req.params.id)).map(S.toEvent) }));
    api.post("/v1/courses/:id/cohorts", { schema: { tags: ["courses"], params: z.object({ id: z.string() }), body: S.CreateEventBody.omit({ courseId: true }), response: { 201: S.EventSchema } } }, async (req, reply) => {
      const { startsAt, sessions, ...rest } = req.body;
      return reply.code(201).send(S.toEvent(await deps.core.createEvent(org(req).id, { ...rest, courseId: req.params.id, startsAt: startsAt ? new Date(startsAt) : undefined, sessions: S.parseSessions(sessions) })));
    });

    api.get("/v1/events", { schema: { tags: ["events"], response: { 200: z.object({ items: z.array(S.EventSchema) }) } } }, async (req) => ({ items: (await deps.core.listEvents(org(req).id)).map(S.toEvent) }));
    api.post("/v1/events", { schema: { tags: ["events"], body: S.CreateEventBody, response: { 201: S.EventSchema } } }, async (req, reply) => {
      const { startsAt, sessions, ...rest } = req.body;
      return reply.code(201).send(S.toEvent(await deps.core.createEvent(org(req).id, { ...rest, startsAt: startsAt ? new Date(startsAt) : undefined, sessions: S.parseSessions(sessions) })));
    });
    api.get("/v1/events/:id", { schema: { tags: ["events"], params: z.object({ id: z.string() }), response: { 200: S.EventSchema, 404: S.ErrorSchema } } }, async (req) => S.toEvent(await deps.core.getEvent(org(req).id, req.params.id)));
    api.get("/v1/events/:id/ticket-types", { schema: { tags: ["events"], params: z.object({ id: z.string() }), response: { 200: z.object({ items: z.array(S.TicketTypeSchema) }) } } }, async (req) => ({ items: (await deps.core.listTicketTypes(org(req).id, req.params.id)).map(S.toTicketType) }));
    api.post("/v1/events/:id/ticket-types", { schema: { tags: ["events"], params: z.object({ id: z.string() }), body: S.CreateTicketTypeBody, response: { 201: S.TicketTypeSchema } } }, async (req, reply) => {
      const { earlyBird, ...rest } = req.body;
      const t = await deps.core.createTicketType(org(req).id, req.params.id, { ...rest, earlyBird: earlyBird ? { until: new Date(earlyBird.until), priceMinor: earlyBird.priceMinor, ...(earlyBird.prices ? { prices: earlyBird.prices } : {}) } : undefined });
      return reply.code(201).send(S.toTicketType(t));
    });
    api.get("/v1/seats", { schema: { tags: ["seats"], querystring: z.object({ eventId: z.string().optional(), orderId: z.string().optional() }), response: { 200: z.object({ items: z.array(S.SeatSchema) }) } } }, async (req) => ({ items: (await deps.core.listSeats(org(req).id, req.query)).map(S.toSeat) }));

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

    // ---------- change policy, seats, waitlist (organizer) ----------
    api.get("/v1/policy", { schema: { tags: ["policy"], querystring: z.object({ courseId: z.string().optional() }), response: { 200: S.ChangePolicySchema } } }, async (req) => deps.core.policyFor(org(req).id, req.query.courseId));
    api.put("/v1/policy", { schema: { tags: ["policy"], querystring: z.object({ courseId: z.string().optional() }), body: S.ChangePolicySchema, response: { 200: S.ChangePolicySchema } } }, async (req) => deps.core.setChangePolicy(org(req).id, req.body, req.query.courseId));
    api.get("/v1/seats/:id/options", { schema: { tags: ["seats"], params: z.object({ id: z.string() }), response: { 200: S.SeatOptionsSchema, 404: S.ErrorSchema } } }, async (req) => {
      const o = await deps.core.seatOptions(req.params.id, { organizationId: org(req).id });
      return seatOptionsOutFrom(o);
    });
    api.post("/v1/seats/:id/substitute", { schema: { tags: ["seats"], params: z.object({ id: z.string() }), body: z.object({ attendee: S.AttendeeSchema }), response: { 200: S.SeatSchema } } }, async (req) => S.toSeat(await deps.core.substituteSeat(req.params.id, req.body.attendee, { organizationId: org(req).id })));
    api.post("/v1/seats/:id/transfer", { schema: { tags: ["seats"], params: z.object({ id: z.string() }), body: z.object({ toEventId: z.string() }), response: { 200: z.object({ seat: S.SeatSchema.nullable(), transfer: S.SeatTransferSchema, clientSecret: z.string().nullable() }) } } }, async (req) => {
      const r = await deps.core.transferSeat(req.params.id, req.body.toEventId, { organizationId: org(req).id });
      return { seat: r.seat ? S.toSeat(r.seat) : null, transfer: S.toTransfer(r.transfer), clientSecret: r.clientSecret };
    });
    api.post("/v1/seats/:id/cancel", { schema: { tags: ["seats"], params: z.object({ id: z.string() }), body: z.object({ reason: z.string().max(500).optional() }), response: { 200: z.object({ seat: S.SeatSchema, refund: z.object({ id: z.string(), amountMinor: z.number().int(), status: z.string() }).nullable() }) } } }, async (req) => {
      const r = await deps.core.cancelSeat(req.params.id, req.body.reason ?? "", { organizationId: org(req).id });
      return { seat: S.toSeat(r.seat), refund: r.refund ? { id: r.refund.id, amountMinor: r.refund.amountMinor, status: r.refund.status } : null };
    });
    api.get("/v1/events/:id/waitlist", { schema: { tags: ["waitlist"], params: z.object({ id: z.string() }), response: { 200: z.object({ items: z.array(S.WaitlistEntrySchema) }) } } }, async (req) => ({ items: (await deps.core.listWaitlist(org(req).id, req.params.id)).map(S.toWaitlist) }));
    api.post("/v1/waitlist/expire", { schema: { tags: ["waitlist"], response: { 200: z.object({ expired: z.array(S.WaitlistEntrySchema) }) } } }, async () => ({ expired: (await deps.core.expireWaitlistOffers()).map(S.toWaitlist) }));

    // ---------- corporate billing ----------
    api.get("/v1/corporate-accounts", { schema: { tags: ["corporate"], response: { 200: z.object({ items: z.array(S.CorporateAccountSchema) }) } } }, async (req) => ({ items: (await deps.core.listCorporateAccounts(org(req).id)).map(S.toCorporateAccount) }));
    api.post("/v1/corporate-accounts", { schema: { tags: ["corporate"], body: S.CreateCorporateAccountBody, response: { 201: S.CorporateAccountSchema } } }, async (req, reply) => reply.code(201).send(S.toCorporateAccount(await deps.core.createCorporateAccount(org(req).id, req.body))));
    api.post("/v1/invoice-orders", { schema: { tags: ["corporate"], body: S.CreateInvoiceOrderBody, response: { 201: z.object({ order: S.OrderSchema, invoice: S.InvoiceSchema, dryRun: z.boolean() }), 200: z.object({ order: S.OrderSchema, invoice: S.InvoiceSchema, dryRun: z.boolean() }), 409: S.ErrorSchema } } }, async (req, reply) => {
      const idem = req.headers["idempotency-key"];
      const dryRun = req.body.dryRun === true;
      const res = await deps.core.createInvoiceOrder(org(req).id, { ...req.body, dryRun, ...(typeof idem === "string" ? { idempotencyKey: idem } : {}) });
      return reply.code(res.created ? 201 : 200).send({ order: S.toOrder(res.order), invoice: S.toInvoice(res.invoice), dryRun });
    });
    api.get("/v1/invoices", { schema: { tags: ["corporate"], querystring: z.object({ status: z.enum(["issued", "partially_paid", "paid", "void"]).optional() }), response: { 200: z.object({ items: z.array(S.InvoiceSchema) }) } } }, async (req) => ({ items: (await deps.core.listInvoices(org(req).id, req.query.status ? { status: [req.query.status] } : undefined)).map(S.toInvoice) }));
    api.get("/v1/invoices/:id", { schema: { tags: ["corporate"], params: z.object({ id: z.string() }), response: { 200: S.InvoiceSchema, 404: S.ErrorSchema } } }, async (req) => S.toInvoice(await deps.core.getInvoice(org(req).id, req.params.id)));
    api.post("/v1/invoices/:id/payments", { schema: { tags: ["corporate"], params: z.object({ id: z.string() }), body: S.RecordInvoicePaymentBody, response: { 200: S.InvoiceSchema, 409: S.ErrorSchema } } }, async (req) => {
      const { receivedAt, ...rest } = req.body;
      return S.toInvoice(await deps.core.recordInvoicePayment(org(req).id, { invoiceId: req.params.id, ...rest, receivedAt: receivedAt ? new Date(receivedAt) : undefined }));
    });
    api.post("/v1/invoices/:id/card-payment", { schema: { tags: ["corporate"], params: z.object({ id: z.string() }), response: { 200: z.object({ invoice: S.InvoiceSchema, clientSecret: z.string().nullable(), paymentRef: z.string() }) } } }, async (req) => {
      const r = await deps.core.createInvoiceCardPayment(org(req).id, req.params.id);
      return { invoice: S.toInvoice(r.invoice), clientSecret: r.clientSecret, paymentRef: r.paymentRef };
    });
    api.post("/v1/invoices/:id/void", { schema: { tags: ["corporate"], params: z.object({ id: z.string() }), body: z.object({ reason: z.string().min(1) }), response: { 200: S.InvoiceSchema, 409: S.ErrorSchema } } }, async (req) => S.toInvoice(await deps.core.voidInvoice(org(req).id, req.params.id, req.body.reason)));
    api.get("/v1/reports/receivables", { schema: { tags: ["reports"], querystring: z.object({ asOf: z.string().datetime({ offset: true }).optional() }), response: { 200: z.object({ asOf: z.string(), byCurrency: z.record(z.string(), z.object({ current: z.number().int(), d1_30: z.number().int(), d31_60: z.number().int(), d61_90: z.number().int(), d90_plus: z.number().int() })), items: z.array(z.object({ invoiceId: z.string(), number: z.string(), corporateAccountId: z.string().nullable(), currency: z.string(), outstandingMinor: z.number().int(), dueAt: z.string(), daysPastDue: z.number().int(), bucket: z.string() })) }) } } }, async (req) => {
      const r = await deps.core.receivablesAgeing(org(req).id, req.query.asOf ? new Date(req.query.asOf) : undefined);
      return { asOf: r.asOf.toISOString(), byCurrency: r.byCurrency, items: r.items.map((i) => ({ ...i, corporateAccountId: i.corporateAccountId ?? null, dueAt: i.dueAt.toISOString() })) };
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
        const { amountMinor, currency } = await fakePaymentFor(req.params.paymentRef, org(req).id);
        const r = await deps.core.handlePaymentEvent(fake.succeed(req.params.paymentRef, amountMinor, currency));
        return { handled: r.handled, ...(r.reason ? { reason: r.reason } : {}) };
      });
      api.post("/v1/dev/payments/:paymentRef/fail", { schema: { tags: ["dev"], params: z.object({ paymentRef: z.string() }), response: { 200: z.object({ handled: z.boolean(), reason: z.string().optional() }) } } }, async (req) => {
        await fakePaymentFor(req.params.paymentRef, org(req).id);
        const r = await deps.core.handlePaymentEvent(fake.fail(req.params.paymentRef));
        return { handled: r.handled, ...(r.reason ? { reason: r.reason } : {}) };
      });
    }
  });

  return app;
}
