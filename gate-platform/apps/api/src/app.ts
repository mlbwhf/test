import Fastify, { type FastifyInstance, type FastifyRequest, type FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { hasZodFastifySchemaValidationErrors, jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { Core, DEFAULT_INSTRUCTOR_ACCESS, DomainError, FakePaymentsAdapter, Identities, buildIcs, can, courseJsonLd, createInMemoryIdentityRepos, createInMemoryIntegrationRepos, Integrations, homeSummary, type Certificate, eventLines, eventOverview, type Notifier, type Organization, type Role } from "@gate/core";
import { bearer, permissionFor, randomId, registerAuth, registerTeam } from "./auth.js";
import type { ProviderConfig } from "./oauth.js";
import rateLimit from "@fastify/rate-limit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AiGatewayError, type AiGateway, Copilot } from "@gate/ai-gateway";
import type { IdempotencyStore } from "@gate/db";
import type { StripePaymentsAdapter } from "@gate/payments-stripe";
import { InMemoryIdempotencyStore, registerIdempotency } from "./plugins/idempotency.js";
import * as S from "./schemas.js";
import { registerImports } from "./imports.js";
import { InMemoryMediaStore, registerCourseImageRoutes, registerMediaRoutes, type MediaStore } from "./media.js";
import { TicketSigner, registerCheckIns, registerPublicTickets, ticketUrl, withTicket } from "./tickets.js";
import { secretMatches } from "./secrets.js";
import { presentedKey, registerIntegrationRoutes, registerMcpRoute } from "./integrations.js";

/** Request logging without personal data: no query strings (they carry learner emails), no credentials. */
const privacyLogger: Exclude<FastifyServerOptions["logger"], boolean | undefined> = {
  redact: { paths: ["req.headers.x-api-key", "req.headers.x-admin-key", "req.headers.authorization", "req.headers.cookie", "req.headers['stripe-signature']"], censor: "[redacted]" },
  serializers: {
    req(req) {
      return { id: req.id, method: req.method, url: req.url.split("?")[0] ?? "", remoteAddress: req.ip };
    },
  },
};

declare module "fastify" {
  interface FastifyRequest {
    org?: Organization;
    /** Role of the caller in req.org; an organization API key acts as owner. */
    role?: Role;
    /** Set for people signed in with a session (not for API keys). */
    userId?: string;
    /** Instructor profile (party) of the caller in req.org, when they have one. */
    partyId?: string;
    /** Instructors limited to the classes they are assigned to (organization setting). */
    ownClassesOnly?: boolean;
  }
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
  /** Outbound HTTP for importers; tests inject a fake. */
  fetchImpl?: typeof fetch;
  /** Where course images are kept; defaults to memory (tests, dev). */
  media?: MediaStore;
  /** Signs ticket links and QR codes. Required in production. */
  ticketSecret?: string;
  /** Base URL of the web app (learner ticket pages, organizer check-in). */
  webUrl?: string;
  /** Accounts, sessions and teams; defaults to in-memory storage. */
  identities?: Identities;
  /** API keys, webhooks and the hosted MCP endpoint; in-memory when not given. */
  integrations?: Integrations;
  /** Enabled sign-in providers (see oauth.ts). */
  providers?: ProviderConfig[];
  /** Sends sign-in links and invitations; email sign-in is off without it. */
  mailer?: Notifier;
}

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const env = deps.env ?? "development";
  const app = Fastify({ logger: deps.logger ? privacyLogger : false, genReqId: () => `req_${Math.random().toString(36).slice(2, 12)}` }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cors, { origin: true, allowedHeaders: ["content-type", "x-api-key", "idempotency-key", "authorization"] });
  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: { title: "EnrollClass API", version: "0.1.0", description: "Events money OS: ticketing, split payments, payouts, ledger. All amounts are integer minor units." },
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

  const media = deps.media ?? new InMemoryMediaStore();
  const identities = deps.identities ?? new Identities(createInMemoryIdentityRepos(), deps.core, { now: () => new Date() }, { next: randomId });
  const integrations = deps.integrations ?? new Integrations(createInMemoryIntegrationRepos(), { now: () => new Date() }, { next: randomId }, { allowPrivateUrls: env !== "production" });
  registerMcpRoute(app, integrations);
  const authDeps = { core: deps.core, identities, providers: deps.providers ?? [], publicUrl: deps.publicUrl ?? "", webUrl: deps.webUrl ?? "http://localhost:3000", mailer: deps.mailer, fetchImpl: deps.fetchImpl, adminKey: deps.adminKey };
  await registerAuth(app, authDeps);
  if (env === "production" && !deps.ticketSecret) throw new Error("ticketSecret is required in production");
  const tickets = { core: deps.core, signer: new TicketSigner(deps.ticketSecret ?? "development-ticket-secret"), publicUrl: deps.publicUrl ?? "", webUrl: deps.webUrl ?? "http://localhost:3000" };
  registerMediaRoutes(app, { store: media });

  app.get("/health", { schema: { tags: ["system"], security: [], response: { 200: z.object({ ok: z.boolean(), payments: z.string(), env: z.string() }) } } }, async () => ({ ok: true, payments: deps.core.payments.provider, env }));

  // ---------- admin: create organizations ----------
  app.post("/v1/organizations", {
    schema: { tags: ["organizations"], security: [{ adminKey: [] }], body: S.CreateOrganizationBody, response: { 201: z.object({ organization: S.OrganizationSchema, apiKey: z.string() }), 401: S.ErrorSchema } },
  }, async (req, reply) => {
    if (!secretMatches(req.headers["x-admin-key"], deps.adminKey)) throw new DomainError("UNAUTHORIZED", "x-admin-key required");
    const res = await deps.core.createOrganization(req.body);
    return reply.code(201).send({ organization: S.toOrganization(res.organization), apiKey: res.apiKey });
  });

  app.post("/v1/organizations/:id/api-key", {
    schema: { tags: ["organizations"], security: [{ adminKey: [] }], params: z.object({ id: z.string() }), response: { 200: z.object({ organization: S.OrganizationSchema, apiKey: z.string() }), 401: S.ErrorSchema, 404: S.ErrorSchema } },
  }, async (req) => {
    if (!secretMatches(req.headers["x-admin-key"], deps.adminKey)) throw new DomainError("UNAUTHORIZED", "x-admin-key required");
    const res = await deps.core.rotateApiKey(req.params.id);
    return { organization: S.toOrganization(res.organization), apiKey: res.apiKey };
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
    return reply.header("content-type", "text/html; charset=utf-8").send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>EnrollClass widget demo</title></head><body style="font-family:system-ui;max-width:720px;margin:40px auto;padding:0 16px"><h1>Course page (demo)</h1><p>This is what an organizer's course page looks like with the widget embedded.</p><div data-gate-widget ${attrs}></div><script src="${base}/widget/v1/gate-widget.js" async></script></body></html>`);
  });

  // ---------- public catalogue + checkout (no api key; rate limited) ----------
  await app.register(async (pubRaw) => {
    const pub = pubRaw.withTypeProvider<ZodTypeProvider>();
    await pub.register(rateLimit, { max: 120, timeWindow: "1 minute" });
    registerPublicTickets(pub, tickets);
    const OrgCourseParams = z.object({ orgId: z.string(), slug: z.string() });

    // Sitemaps and AI crawlers: every course with upcoming classes and its public page.
    pub.get("/public/v1/catalog", { schema: { tags: ["public"], security: [], response: { 200: z.object({ items: z.array(z.object({ organizationId: z.string(), organizationName: z.string(), slug: z.string(), name: z.string(), nextStartsAt: z.string(), classes: z.number().int(), url: z.string().nullable() })) }) } } }, async (_req, reply) => {
      const items = (await deps.core.publicCatalog()).map((c) => ({ ...c, nextStartsAt: c.nextStartsAt.toISOString(), url: deps.publicPageUrl?.(c.organizationId, c.slug) ?? null }));
      reply.header("cache-control", "public, max-age=900");
      return { items };
    });
    pub.get("/public/v1/organizations/:orgId/courses/:slug", { schema: { tags: ["public"], security: [], params: OrgCourseParams, response: { 200: S.PublicCourseSchema, 404: S.ErrorSchema } } }, async (req) => {
      const res = await deps.core.publicCourse(req.params.orgId, req.params.slug);
      return {
        organization: { ...res.organization, ratesUpdatedAt: res.organization.ratesUpdatedAt?.toISOString() ?? null },
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
        ticketUrl: ticketUrl(tickets, tickets.signer.token(o.seat.id)),
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
    pub.get("/public/v1/certificates/:code", { schema: { tags: ["public"], security: [], params: z.object({ code: z.string() }), response: { 200: z.object({ valid: z.boolean(), attendeeName: z.string().optional(), courseName: z.string().optional(), cohort: z.string().optional(), issuedAt: z.string().optional(), organization: z.string().optional(), kind: z.enum(["attendance", "completion"]).optional(), hours: z.number().nullable().optional(), startsAt: z.string().optional(), endsAt: z.string().nullable().optional(), timezone: z.string().optional(), format: z.string().optional(), instructors: z.array(z.string()).optional(), certificationBody: z.string().nullable().optional(), badge: S.CourseSchema.shape.badge.optional() }) } } }, async (req) => {
      const v = await deps.core.verifyCertificate(req.params.code);
      if (!v.valid || !v.certificate) return { valid: false };
      return {
        valid: true, attendeeName: v.certificate.attendeeName, courseName: v.certificate.courseName, ...(v.cohort ? { cohort: v.cohort.name, startsAt: v.cohort.startsAt.toISOString(), endsAt: v.cohort.endsAt?.toISOString() ?? null, timezone: v.cohort.timezone, format: v.cohort.format } : {}),
        issuedAt: v.certificate.issuedAt.toISOString(), ...(v.organizationName ? { organization: v.organizationName } : {}), kind: v.certificate.kind ?? "completion", hours: v.certificate.hours ?? null,
        instructors: v.instructors ?? [], certificationBody: v.course?.certificationBody ?? null, badge: v.course?.badge ?? null,
      };
    });
    pub.get("/public/v1/certificates/:code/view", { schema: { tags: ["public"], security: [], params: z.object({ code: z.string() }), response: { 200: z.string(), 404: z.string() } } }, async (req, reply) => {
      const v = await deps.core.verifyCertificate(req.params.code);
      reply.header("content-type", "text/html; charset=utf-8");
      const esc = (x: string) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      if (!v.valid || !v.certificate) return reply.code(404).send(`<!doctype html><html><body style="font-family:system-ui;max-width:640px;margin:60px auto;text-align:center"><h1>Certificate not found</h1><p>This verification code is not valid.</p></body></html>`);
      const c = v.certificate;
      const date = new Intl.DateTimeFormat("en-CA", { dateStyle: "long", timeZone: v.cohort?.timezone ?? "UTC" }).format(c.issuedAt);
      return reply.send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificate — ${esc(c.attendeeName)}</title></head>
<body style="margin:0;background:#eef2f4;font-family:Georgia,serif"><div style="max-width:860px;margin:40px auto;background:#fff;border:12px double #053947;padding:56px 64px;text-align:center">
<div style="font-family:system-ui;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#64748b">${esc(v.organizationName ?? "")}</div>
<h1 style="font-size:40px;color:#053947;margin:24px 0 8px">Certificate of Completion</h1>
<p style="font-size:18px;color:#475569;margin:0">This certifies that</p>
<p style="font-size:34px;margin:18px 0;color:#0f172a">${esc(c.attendeeName)}</p>
<p style="font-size:18px;color:#475569;margin:0">has completed</p>
<p style="font-size:26px;margin:14px 0;color:#0f172a">${esc(c.courseName)}</p>
${v.cohort ? `<p style="font-size:16px;color:#64748b;margin:0">${esc(v.cohort.name)}</p>` : ""}
<p style="font-family:system-ui;font-size:14px;color:#64748b;margin-top:40px">Issued ${esc(date)} · Verification code <code>${esc(c.verifyCode)}</code></p>
<p style="font-family:system-ui;font-size:12px;color:#94a3b8">Verify at ${esc(deps.publicUrl ?? "")}/public/v1/certificates/${esc(c.verifyCode)}</p>
</div></body></html>`);
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
    ticketUrl: ticketUrl(tickets, tickets.signer.token(o.seat.id)),
  });

  // ---------- authenticated tenant API ----------
  await app.register(async (apiRaw) => {
    const api = apiRaw.withTypeProvider<ZodTypeProvider>();
    // Two ways in: an organization API key (integrations; acts as owner) or a signed-in
    // person's session (role from their membership). Every route then needs a permission.
    api.addHook("preHandler", async (req) => {
      const key = req.headers["x-api-key"];
      const issued = presentedKey(req);
      if (issued) {
        // A key the organizer created in Integrations: acts as an admin; read-only keys only read.
        const k = await integrations.authenticateKey(issued);
        if (!k) throw new DomainError("UNAUTHORIZED", "invalid or revoked api key", "create a new key in Team → Integrations");
        req.org = await deps.core.getOrganization(k.organizationId);
        req.role = "admin";
        if (k.access === "read" && req.method !== "GET" && req.method !== "HEAD") throw new DomainError("FORBIDDEN", "this API key is read-only", "use a key with full access to make changes");
      } else if (typeof key === "string" && key) {
        req.org = await deps.core.authenticate(key);
        req.role = "owner";
      } else {
        const ctx = await identities.resolveSession(bearer(req));
        if (!ctx) throw new DomainError("UNAUTHORIZED", "please sign in", "send x-api-key or a session token");
        if (!ctx.organization || !ctx.role) throw new DomainError("FORBIDDEN", "create or join an organization first");
        req.org = ctx.organization;
        req.role = ctx.role;
        req.userId = ctx.user.id;
        const partyId = ctx.memberships.find((m) => m.organizationId === ctx.organization!.id)?.partyId;
        if (partyId) req.partyId = partyId;
        req.ownClassesOnly = ctx.role === "instructor" && (ctx.organization.instructorAccess ?? DEFAULT_INSTRUCTOR_ACCESS).scope === "own";
      }
      const need = permissionFor(req.method, req.url);
      if (!can(req.role, need)) throw new DomainError("FORBIDDEN", `your role (${req.role}) does not allow this`, need.startsWith("money") ? "ask an owner, admin or finance member" : "ask an owner or admin");
      if (req.ownClassesOnly) await guardOwnClasses(req);
    });
    // An instructor limited to their own classes gets "not found" for anyone else's, whichever route names it.
    const teaches = (req: FastifyRequest, e: { instructorIds: string[] }) => !req.ownClassesOnly || (req.partyId !== undefined && e.instructorIds.includes(req.partyId));
    const assertTeaches = async (req: FastifyRequest, eventId: string) => {
      const event = await deps.core.getEvent(req.org!.id, eventId);
      if (!teaches(req, event)) throw new DomainError("NOT_FOUND", "event not found", "you can only open classes you teach");
    };
    async function guardOwnClasses(req: FastifyRequest) {
      const path = req.url.split("?")[0]!;
      const ev = path.match(/^\/v1\/events\/([^/]+)/);
      if (ev && ev[1] !== "overview") return assertTeaches(req, decodeURIComponent(ev[1]!));
      const seat = path.match(/^\/v1\/seats\/([^/]+)/);
      if (seat) {
        const s = await deps.core.repos.seats.get(decodeURIComponent(seat[1]!));
        if (!s || s.organizationId !== req.org!.id) throw new DomainError("NOT_FOUND", "seat not found");
        return assertTeaches(req, s.eventId);
      }
      if (path === "/v1/seats") {
        const eventId = (req.query as { eventId?: string }).eventId;
        if (!eventId) throw new DomainError("FORBIDDEN", "pick a class", "list seats with ?eventId=");
        return assertTeaches(req, eventId);
      }
      if (path === "/v1/checkins") {
        const body = (req.body ?? {}) as { token?: string; eventId?: string };
        const seatId = body.token ? tickets.signer.verify(body.token) : undefined;
        const eventId = seatId ? (await deps.core.repos.seats.get(seatId))?.eventId : body.eventId;
        if (eventId) return assertTeaches(req, eventId);
      }
    }
    /** Classes an instructor creates include them, and wait for approval when the organization asks for it. */
    const asCreator = (req: FastifyRequest, instructorIds: string[] | undefined): { instructorIds?: string[]; status?: "draft" } => {
      if (req.role !== "instructor") return instructorIds ? { instructorIds } : {};
      const ids = [...new Set([...(instructorIds ?? []), ...(req.partyId ? [req.partyId] : [])])];
      return { instructorIds: ids, ...((req.org!.instructorAccess ?? DEFAULT_INSTRUCTOR_ACCESS).publish === "approval" ? { status: "draft" as const } : {}) };
    };
    registerIdempotency(api, deps.idempotency ?? new InMemoryIdempotencyStore());
    const org = (req: { org?: Organization }) => req.org!;
    const outbound = deps.fetchImpl ? { fetchImpl: deps.fetchImpl } : {};
    registerImports(api, { core: deps.core, media, publicUrl: deps.publicUrl ?? "", ...outbound }, org);
    registerCourseImageRoutes(api, { core: deps.core, store: media, publicUrl: deps.publicUrl ?? "", ...outbound }, org);
    registerCheckIns(api, tickets, org);
    registerTeam(api, authDeps, (req) => ({ org: req.org!, role: req.role!, userId: req.userId }));
    registerIntegrationRoutes(api, integrations, (req) => ({ org: req.org!, userId: req.userId }));

    api.get("/v1/organizations/me", { schema: { tags: ["organizations"], response: { 200: S.OrganizationSchema } } }, async (req) => S.toOrganization(org(req)));

    // The console's "Today" screen. Money and setup items only appear for roles that can act on them.
    api.get("/v1/home", { schema: { tags: ["organizations"] } }, async (req) => {
      const h = await homeSummary(deps.core, org(req).id, { money: can(req.role!, "money:read"), settings: can(req.role!, "settings"), eventFilter: (e) => teaches(req, e) });
      return JSON.parse(JSON.stringify(h)) as unknown;
    });
    // Events screen: list rows with fill, and one cohort's detail pane.
    api.get("/v1/events/overview", { schema: { tags: ["events"] } }, async (req) => {
      const events = (await deps.core.listEvents(org(req).id)).filter((e) => teaches(req, e));
      return { items: JSON.parse(JSON.stringify(await eventLines(deps.core, org(req).id, events))) as unknown };
    });
    api.get("/v1/events/:id/overview", { schema: { tags: ["events"], params: z.object({ id: z.string() }) } }, async (req) => {
      const o = await eventOverview(deps.core, org(req).id, req.params.id, { money: can(req.role!, "money:read") });
      return { ...(JSON.parse(JSON.stringify(o)) as object), publicUrl: o.course && deps.publicPageUrl ? deps.publicPageUrl(org(req).id, o.course.slug) : null };
    });

    api.patch("/v1/organizations/me/pricing", { schema: { tags: ["organizations"], body: S.UpdatePricingBody, response: { 200: S.OrganizationSchema, 400: S.ErrorSchema } } }, async (req) => S.toOrganization(await deps.core.updatePricing(org(req).id, req.body)));
    api.post("/v1/organizations/me/pricing/refresh-rates", { schema: { tags: ["organizations"], response: { 200: S.OrganizationSchema, 400: S.ErrorSchema, 409: S.ErrorSchema, 502: S.ErrorSchema } } }, async (req) => S.toOrganization(await deps.core.refreshFxRates(org(req).id)));

    // Re-reads the account from the provider (e.g. on return from Stripe's onboarding).
    api.get("/v1/organizations/me/payments", { schema: { tags: ["organizations"], response: { 200: z.object({ setup: z.enum(["none", "incomplete", "ready"]), status: S.OrganizationSchema.shape.paymentsStatus }) } } }, async (req) => {
      const o = await deps.core.refreshPaymentsStatus(org(req).id);
      return { setup: !o.paymentsAccountRef ? "none" as const : o.paymentsStatus?.ready ? "ready" as const : "incomplete" as const, status: S.toOrganization(o).paymentsStatus };
    });
    api.post("/v1/organizations/me/payments/connect", { schema: { tags: ["organizations"], body: z.object({ email: z.string().email().optional() }).optional(), response: { 200: z.object({ paymentsAccountRef: z.string(), onboardingUrl: z.string().nullable(), ready: z.boolean(), requirementsDue: z.array(z.string()) }) } } }, async (req) => {
      const res = await deps.core.connectPayments(org(req).id, req.body?.email);
      return { paymentsAccountRef: res.paymentsAccountRef!, onboardingUrl: res.onboardingUrl ?? null, ready: Boolean(res.paymentsStatus?.ready), requirementsDue: res.paymentsStatus?.requirementsDue ?? [] };
    });

    api.get("/v1/parties", { schema: { tags: ["parties"], response: { 200: z.object({ items: z.array(S.PartySchema) }) } } }, async (req) => ({ items: (await deps.core.listParties(org(req).id)).map(S.toParty) }));
    api.post("/v1/parties", { schema: { tags: ["parties"], body: S.CreatePartyBody, response: { 201: S.PartySchema } } }, async (req, reply) => reply.code(201).send(S.toParty(await deps.core.createParty(org(req).id, req.body))));

    api.get("/v1/courses", { schema: { tags: ["courses"], response: { 200: z.object({ items: z.array(S.CourseSchema) }) } } }, async (req) => ({ items: (await deps.core.listCourses(org(req).id)).map(S.toCourse) }));
    api.post("/v1/courses", { schema: { tags: ["courses"], body: S.CreateCourseBody, response: { 201: S.CourseSchema, 409: S.ErrorSchema } } }, async (req, reply) => reply.code(201).send(S.toCourse(await deps.core.createCourse(org(req).id, req.body))));
    api.get("/v1/courses/:id", { schema: { tags: ["courses"], params: z.object({ id: z.string() }), response: { 200: S.CourseSchema, 404: S.ErrorSchema } } }, async (req) => S.toCourse(await deps.core.getCourse(org(req).id, req.params.id)));
    api.get("/v1/courses/:id/cohorts", { schema: { tags: ["courses"], params: z.object({ id: z.string() }), response: { 200: z.object({ items: z.array(S.EventSchema) }) } } }, async (req) => ({ items: (await deps.core.listCohorts(org(req).id, req.params.id)).filter((e) => teaches(req, e)).map(S.toEvent) }));
    api.post("/v1/courses/:id/cohorts", { schema: { tags: ["courses"], params: z.object({ id: z.string() }), body: S.CreateEventBody.omit({ courseId: true }), response: { 201: S.EventSchema } } }, async (req, reply) => {
      const { startsAt, sessions, ...rest } = req.body;
      return reply.code(201).send(S.toEvent(await deps.core.createEvent(org(req).id, { ...rest, ...asCreator(req, rest.instructorIds), courseId: req.params.id, startsAt: startsAt ? new Date(startsAt) : undefined, sessions: S.parseSessions(sessions) })));
    });

    api.get("/v1/events", { schema: { tags: ["events"], response: { 200: z.object({ items: z.array(S.EventSchema) }) } } }, async (req) => ({ items: (await deps.core.listEvents(org(req).id)).filter((e) => teaches(req, e)).map(S.toEvent) }));
    api.post("/v1/events", { schema: { tags: ["events"], body: S.CreateEventBody, response: { 201: S.EventSchema } } }, async (req, reply) => {
      const { startsAt, sessions, ...rest } = req.body;
      return reply.code(201).send(S.toEvent(await deps.core.createEvent(org(req).id, { ...rest, ...asCreator(req, rest.instructorIds), startsAt: startsAt ? new Date(startsAt) : undefined, sessions: S.parseSessions(sessions) })));
    });
    api.post("/v1/events/:id/duplicate", { schema: { tags: ["events"], params: z.object({ id: z.string() }), body: z.object({ startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), name: z.string().min(1).max(200).optional() }).optional(), response: { 201: z.object({ event: S.EventSchema, ticketTypes: z.array(S.TicketTypeSchema) }), 400: S.ErrorSchema, 404: S.ErrorSchema } } }, async (req, reply) => {
      const r = await deps.core.duplicateEvent(org(req).id, req.params.id, { startDate: req.body?.startDate, name: req.body?.name, status: asCreator(req, undefined).status });
      if (req.role === "instructor" && req.partyId && !r.event.instructorIds.includes(req.partyId)) r.event = await deps.core.setEventInstructors(org(req).id, r.event.id, [...r.event.instructorIds, req.partyId]);
      return reply.code(201).send({ event: S.toEvent(r.event), ticketTypes: r.ticketTypes.map(S.toTicketType) });
    });
    // Owners and admins: approve an instructor's draft, and choose who teaches a class.
    api.post("/v1/events/:id/publish", { schema: { tags: ["events"], params: z.object({ id: z.string() }), response: { 200: S.EventSchema, 404: S.ErrorSchema, 409: S.ErrorSchema } } }, async (req) => S.toEvent(await deps.core.publishEvent(org(req).id, req.params.id)));
    api.put("/v1/events/:id/instructors", { schema: { tags: ["events"], params: z.object({ id: z.string() }), body: z.object({ instructorIds: z.array(z.string()).max(20) }), response: { 200: S.EventSchema, 400: S.ErrorSchema, 404: S.ErrorSchema } } }, async (req) => S.toEvent(await deps.core.setEventInstructors(org(req).id, req.params.id, req.body.instructorIds)));
    api.patch("/v1/organizations/me/instructor-access", { schema: { tags: ["organizations"], body: z.object({ scope: z.enum(["own", "all"]).optional(), publish: z.enum(["direct", "approval"]).optional() }), response: { 200: S.OrganizationSchema } } }, async (req) => S.toOrganization(await deps.core.updateInstructorAccess(org(req).id, req.body)));
    api.get("/v1/events/:id", { schema: { tags: ["events"], params: z.object({ id: z.string() }), response: { 200: S.EventSchema, 404: S.ErrorSchema } } }, async (req) => S.toEvent(await deps.core.getEvent(org(req).id, req.params.id)));
    api.get("/v1/events/:id/ticket-types", { schema: { tags: ["events"], params: z.object({ id: z.string() }), response: { 200: z.object({ items: z.array(S.TicketTypeSchema) }) } } }, async (req) => ({ items: (await deps.core.listTicketTypes(org(req).id, req.params.id)).map(S.toTicketType) }));
    api.post("/v1/events/:id/ticket-types", { schema: { tags: ["events"], params: z.object({ id: z.string() }), body: S.CreateTicketTypeBody, response: { 201: S.TicketTypeSchema } } }, async (req, reply) => {
      const { earlyBird, ...rest } = req.body;
      const t = await deps.core.createTicketType(org(req).id, req.params.id, { ...rest, earlyBird: earlyBird ? { until: new Date(earlyBird.until), priceMinor: earlyBird.priceMinor, ...(earlyBird.prices ? { prices: earlyBird.prices } : {}) } : undefined });
      return reply.code(201).send(S.toTicketType(t));
    });
    api.get("/v1/seats", { schema: { tags: ["seats"], querystring: z.object({ eventId: z.string().optional(), orderId: z.string().optional() }), response: { 200: z.object({ items: z.array(S.SeatSchema) }) } } }, async (req) => ({ items: (await deps.core.listSeats(org(req).id, req.query)).map((s) => withTicket(tickets, s)) }));

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

    // ---------- money: release, instructor fees, payouts, reports, cohort cancellation ----------
    api.patch("/v1/organizations/me", { schema: { tags: ["organizations"], body: S.UpdateOrganizationBody, response: { 200: S.OrganizationSchema } } }, async (req) => S.toOrganization(await deps.core.updateOrganization(org(req).id, req.body)));
    api.put("/v1/events/:id/instructor-fees", { schema: { tags: ["money"], params: z.object({ id: z.string() }), body: z.object({ fees: z.array(S.InstructorFeeSchema).max(20) }), response: { 200: S.EventSchema } } }, async (req) => S.toEvent(await deps.core.setInstructorFees(org(req).id, req.params.id, req.body.fees)));
    api.post("/v1/events/:id/release", { schema: { tags: ["money"], params: z.object({ id: z.string() }), response: { 200: z.object({ released: z.number().int(), amountMinor: z.number().int() }), 409: S.ErrorSchema } } }, async (req) => deps.core.releaseEvent(org(req).id, req.params.id));
    api.post("/v1/events/:id/cancel", { schema: { tags: ["money"], params: z.object({ id: z.string() }), body: z.object({ reason: z.string().min(1).max(500), transferToEventId: z.string().optional() }), response: { 200: z.object({ event: S.EventSchema, refunded: z.number().int(), transferred: z.number().int(), voided: z.number().int() }), 409: S.ErrorSchema } } }, async (req) => {
      const r = await deps.core.cancelCohort(org(req).id, req.params.id, req.body);
      return { event: S.toEvent(r.event), refunded: r.refunded, transferred: r.transferred, voided: r.voided };
    });
    api.get("/v1/reports/revenue", { schema: { tags: ["reports"], querystring: z.object({ from: z.string().datetime({ offset: true }), to: z.string().datetime({ offset: true }) }), response: { 200: z.object({ from: z.string(), to: z.string(), byCurrency: z.record(z.string(), z.object({ recognizedMinor: z.number().int(), deferredMinor: z.number().int(), refundedMinor: z.number().int() })), cohorts: z.array(S.RevenueCohortSchema) }) } } }, async (req) => {
      const r = await deps.core.revenueReport(org(req).id, { from: new Date(req.query.from), to: new Date(req.query.to) });
      return { from: r.from.toISOString(), to: r.to.toISOString(), byCurrency: r.byCurrency, cohorts: r.cohorts.map((c) => ({ ...c, startsAt: c.startsAt.toISOString(), endsAt: c.endsAt?.toISOString() ?? null })) };
    });
    api.get("/v1/reports/payables", { schema: { tags: ["reports"], response: { 200: z.object({ items: z.array(S.PayableSchema) }) } } }, async (req) => ({ items: await deps.core.payables(org(req).id) }));
    api.get("/v1/payouts", { schema: { tags: ["money"], response: { 200: z.object({ items: z.array(S.PayoutSchema) }) } } }, async (req) => ({ items: (await deps.core.listPayouts(org(req).id)).map(S.toPayout) }));
    api.post("/v1/payouts", { schema: { tags: ["money"], body: S.CreatePayoutBody, response: { 201: z.object({ payout: S.PayoutSchema }), 400: S.ErrorSchema } } }, async (req, reply) => reply.code(201).send({ payout: S.toPayout(await deps.core.recordPayout(org(req).id, req.body)) }));
    api.post("/v1/jobs/release", { schema: { tags: ["money"], response: { 200: z.object({ events: z.number().int(), orders: z.number().int(), amountMinor: z.number().int() }) } } }, async () => deps.core.releaseDelivered());
    api.post("/v1/jobs/review-min-enrollment", { schema: { tags: ["money"], response: { 200: z.object({ flagged: z.array(S.EventSchema) }) } } }, async () => ({ flagged: (await deps.core.reviewMinEnrollment()).map(S.toEvent) }));

    // ---------- delivery: meetings, attendance, certificates, roster, sequences ----------
    const certOut = (c: Certificate) => ({
      id: c.id, seatId: c.seatId, eventId: c.eventId, attendeeName: c.attendeeName, attendeeEmail: c.attendeeEmail, courseName: c.courseName, issuedAt: c.issuedAt.toISOString(), verifyCode: c.verifyCode,
      verifyUrl: `${deps.publicUrl ?? ""}/public/v1/certificates/${c.verifyCode}`, viewUrl: `${tickets.webUrl}/cert/${encodeURIComponent(c.verifyCode)}`,
      kind: c.kind ?? "completion" as const, hours: c.hours ?? null,
    });
    const attendanceOut = (a: { seatId: string; email: string; name: string | null; status: "present" | "partial" | "absent" | "unknown"; minutes: number; sessionsAttended: number; source: "provider" | "manual" | "none"; updatedAt: Date }) => ({ ...a, updatedAt: a.updatedAt.toISOString() });
    api.patch("/v1/courses/:id", { schema: { tags: ["courses"], params: z.object({ id: z.string() }), body: S.UpdateCourseBody, response: { 200: S.CourseSchema } } }, async (req) => {
      const b = req.body;
      const clean = (v: string | number | null | undefined) => (v === null ? "" : v);
      return S.toCourse(await deps.core.updateCourse(org(req).id, req.params.id, { description: clean(b.description) as string | undefined, prework: clean(b.prework) as string | undefined, surveyUrl: clean(b.surveyUrl) as string | undefined, certificationBody: clean(b.certificationBody) as string | undefined, durationDays: b.durationDays === null ? undefined : b.durationDays, imageUrl: clean(b.imageUrl) as string | undefined, badge: b.badge === undefined ? undefined : b.badge === null ? null : { platform: b.badge.platform, name: b.badge.name, url: b.badge.url, ...(b.badge.imageUrl ? { imageUrl: b.badge.imageUrl } : {}) } }));
    });
    api.post("/v1/events/:id/meeting", { schema: { tags: ["delivery"], params: z.object({ id: z.string() }), body: z.object({ provider: z.enum(["zoom", "teams", "manual"]), joinUrl: z.string().optional(), hostUrl: z.string().optional(), passcode: z.string().optional() }), response: { 200: S.EventSchema, 409: S.ErrorSchema } } }, async (req) => S.toEvent(await deps.core.setMeeting(org(req).id, req.params.id, req.body)));
    api.get("/v1/events/:id/attendance", { schema: { tags: ["delivery"], params: z.object({ id: z.string() }), response: { 200: z.object({ items: z.array(S.AttendanceRowSchema) }) } } }, async (req) => ({ items: (await deps.core.listAttendance(org(req).id, req.params.id)).map(attendanceOut) }));
    api.post("/v1/events/:id/attendance/sync", { schema: { tags: ["delivery"], params: z.object({ id: z.string() }), response: { 200: z.object({ updated: z.number().int(), items: z.array(S.AttendanceRowSchema) }), 409: S.ErrorSchema } } }, async (req) => { const r = await deps.core.syncAttendance(org(req).id, req.params.id); return { updated: r.updated, items: r.items.map(attendanceOut) }; });
    api.post("/v1/events/:id/attendance", { schema: { tags: ["delivery"], params: z.object({ id: z.string() }), body: z.object({ seatId: z.string(), status: z.enum(["present", "partial", "absent", "unknown"]), minutes: z.number().min(0).optional() }), response: { 200: S.AttendanceRowSchema } } }, async (req) => attendanceOut(await deps.core.setAttendance(org(req).id, req.params.id, req.body)));
    api.get("/v1/events/:id/certificates", { schema: { tags: ["delivery"], params: z.object({ id: z.string() }), response: { 200: z.object({ items: z.array(S.CertificateSchema) }) } } }, async (req) => ({ items: (await deps.core.listCertificates(org(req).id, req.params.id)).map(certOut) }));
    api.post("/v1/events/:id/certificates", { schema: { tags: ["delivery"], params: z.object({ id: z.string() }), body: z.object({ onlyPresent: z.boolean().optional(), onlyCheckedIn: z.boolean().optional(), kind: z.enum(["attendance", "completion"]).optional() }).optional(), response: { 200: z.object({ issued: z.array(S.CertificateSchema) }) } } }, async (req) => ({ issued: (await deps.core.issueCertificates(org(req).id, req.params.id, req.body ?? {})).map(certOut) }));
    api.get("/v1/events/:id/roster.csv", { schema: { tags: ["delivery"], params: z.object({ id: z.string() }), querystring: z.object({ format: z.string().optional() }), response: { 200: z.string(), 400: S.ErrorSchema } } }, async (req, reply) => {
      const r = await deps.core.roster(org(req).id, req.params.id, req.query.format ?? "default");
      return reply.header("content-type", "text/csv; charset=utf-8").header("content-disposition", `attachment; filename="roster-${req.params.id}-${req.query.format ?? "default"}.csv"`).send(r.csv);
    });
    api.get("/v1/events/:id/messages", { schema: { tags: ["delivery"], params: z.object({ id: z.string() }), response: { 200: z.object({ items: z.array(S.MessageSchema) }) } } }, async (req) => ({ items: (await deps.core.listMessages(org(req).id, req.params.id)).map((m) => ({ key: m.key, step: m.step, to: m.to, sentAt: m.sentAt.toISOString() })) }));
    api.post("/v1/sequences/run", { schema: { tags: ["delivery"], response: { 200: z.object({ sent: z.number().int() }) } } }, async (req) => ({ sent: (await deps.core.runSequences(undefined, org(req).id)).sent }));

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
