import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { ConsoleNotifier, Core, Identities, Integrations, createInMemoryIdentityRepos, createInMemoryIntegrationRepos, type IdentityRepos, type IntegrationRepos, FakePaymentsAdapter, FlatRateTax, FrankfurterRates, cohortHooks, confirmationHook, selfServiceHooks, sequenceHooks, createInMemoryRepos, type CoreHooks, type Notifier, type PaymentsPort, type Repos } from "@gate/core";
import { ResendNotifier } from "./notifiers/resend.js";
import { CrmSync, HubSpotCrm } from "@gate/integrations-hubspot";
import { TeamsMeetings, ZoomMeetings } from "@gate/meetings";
import type { MeetingProvider } from "@gate/core";
import { createPool, migrate, PgIdempotencyStore, PostgresLedgerStore, createPgIdentityRepos, createPgIntegrationRepos, createPgRepos, type IdempotencyStore } from "@gate/db";
import { StripePaymentsAdapter } from "@gate/payments-stripe";
import { AiGateway, AnthropicProvider, DEFAULT_TENANT_DEFAULTS, EnvSecretResolver, InMemoryAuditSink, InMemoryBudgetStore, InMemoryTenantAiConfigStore, OpenAICompatibleProvider } from "@gate/ai-gateway";
import { buildApp } from "./app.js";
import { randomId } from "./auth.js";
import { configuredProviders } from "./oauth.js";
import { LocalMediaStore } from "./media.js";
import { TicketSigner, ticketUrl } from "./tickets.js";

async function main() {
  const env = (process.env.GATE_ENV as "development" | "test" | "production" | undefined) ?? "development";
  const port = Number(process.env.PORT ?? 4000);
  const publicUrl = process.env.GATE_PUBLIC_URL ?? `http://localhost:${port}`;

  // Persistence
  let repos: Repos;
  let ledger: Ledger;
  let idempotency: IdempotencyStore | undefined;
  let identityRepos: IdentityRepos;
  let integrationRepos: IntegrationRepos;
  if (process.env.DATABASE_URL) {
    const pool = createPool(process.env.DATABASE_URL);
    const ran = await migrate(pool);
    if (ran.length) console.log(`[db] applied migrations: ${ran.join(", ")}`);
    repos = createPgRepos(pool);
    ledger = new Ledger({ store: new PostgresLedgerStore(pool) });
    idempotency = new PgIdempotencyStore(pool);
    identityRepos = createPgIdentityRepos(pool);
    integrationRepos = createPgIntegrationRepos(pool);
    console.log("[db] postgres");
  } else {
    repos = createInMemoryRepos();
    ledger = new Ledger({ store: new InMemoryLedgerStore() });
    identityRepos = createInMemoryIdentityRepos();
    integrationRepos = createInMemoryIntegrationRepos();
    console.log("[db] in-memory (set DATABASE_URL for postgres)");
  }

  // Payments
  let payments: PaymentsPort;
  let stripe: StripePaymentsAdapter | undefined;
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = StripePaymentsAdapter.fromSecretKey(process.env.STRIPE_SECRET_KEY, {
      onboardingReturnUrl: `${process.env.GATE_WEB_URL ?? "http://localhost:3000"}/dashboard?connect=return`,
      onboardingRefreshUrl: `${process.env.GATE_WEB_URL ?? "http://localhost:3000"}/dashboard?connect=refresh`,
      ...(process.env.STRIPE_WEBHOOK_SECRET ? { webhookSecret: process.env.STRIPE_WEBHOOK_SECRET } : {}),
      ...(process.env.STRIPE_CONNECT_WEBHOOK_SECRET ? { connectWebhookSecret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET } : {}),
    });
    payments = stripe;
    console.log("[payments] stripe connect");
  } else {
    if (env === "production") throw new Error("STRIPE_SECRET_KEY is required in production");
    payments = new FakePaymentsAdapter();
    console.log("[payments] fake adapter (set STRIPE_SECRET_KEY for stripe)");
  }

  // Notifications: Resend when configured, otherwise log to the console.
  const notifier: Notifier = process.env.RESEND_API_KEY
    ? new ResendNotifier({ apiKey: process.env.RESEND_API_KEY, from: process.env.EMAIL_FROM ?? "EnrollClass <no-reply@enrollclass.com>" })
    : new ConsoleNotifier({ printBody: env !== "production" });
  console.log(`[email] ${notifier.provider}`);
  const webUrl = process.env.GATE_WEB_URL ?? "http://localhost:3000";
  // The organizer's own course page when configured, else EnrollClass's public course page.
  const coursePageUrl = (org: string, slug: string) => (process.env.GATE_COURSE_PAGE_URL ? process.env.GATE_COURSE_PAGE_URL.replace("{slug}", slug) : `${webUrl}/c/${encodeURIComponent(org)}/${encodeURIComponent(slug)}`);
  // Ticket links and QR codes are signed with this; changing it invalidates issued tickets.
  const ticketSecret = process.env.GATE_TICKET_SECRET || (process.env.GATE_ADMIN_KEY ? `admin:${process.env.GATE_ADMIN_KEY}` : env === "production" ? "" : "development-ticket-secret");
  if (!ticketSecret) throw new Error("set GATE_TICKET_SECRET (or GATE_ADMIN_KEY) in production");
  const signer = new TicketSigner(ticketSecret);
  const organizerEmail = process.env.GATE_ORGANIZER_EMAIL ?? process.env.EMAIL_REPLY_TO;
  const hooks: CoreHooks[] = [
    confirmationHook(notifier, {
      fromName: process.env.EMAIL_FROM_NAME ?? "EnrollClass",
      replyTo: process.env.EMAIL_REPLY_TO,
      calendarUrl: (seatId) => `${publicUrl}/public/v1/seats/${seatId}/calendar.ics`,
      pageUrl: (ctx) => (ctx.course ? coursePageUrl(ctx.organization.id, ctx.course.slug) : undefined),
      ticket: (seatId) => {
        const token = signer.token(seatId);
        return { url: ticketUrl({ webUrl }, token), qrUrl: `${publicUrl}/public/v1/tickets/${encodeURIComponent(token)}/qr.png`, code: signer.code(seatId) };
      },
      manageUrl: (seatId, email) => `${webUrl}/my/seat/${seatId}?email=${encodeURIComponent(email)}`,
      // With an organizer address the attachment is a real calendar invitation.
      organizer: (ctx) => (organizerEmail ? { name: process.env.EMAIL_FROM_NAME ?? ctx.organization.name, email: organizerEmail } : undefined),
    }),
  ];
  hooks.push(selfServiceHooks(notifier, {
    fromName: process.env.EMAIL_FROM_NAME ?? "EnrollClass",
    replyTo: process.env.EMAIL_REPLY_TO,
    claimUrl: ({ entryId, courseSlug }) => (courseSlug && process.env.GATE_COURSE_PAGE_URL ? `${process.env.GATE_COURSE_PAGE_URL.replace("{slug}", courseSlug)}?gate_waitlist=${entryId}` : `${webUrl}/?gate_waitlist=${entryId}`),
    seatUrl: (seatId, email) => `${webUrl}/my/seat/${seatId}?email=${encodeURIComponent(email)}`,
    getCourseSlug: async (eventId) => { const e = await repos.events.get(eventId); return e?.courseId ? (await repos.courses.get(e.courseId))?.slug : undefined; },
  }));
  hooks.push(sequenceHooks(notifier, {
    fromName: process.env.EMAIL_FROM_NAME ?? "EnrollClass",
    replyTo: process.env.EMAIL_REPLY_TO,
    seatUrl: (seatId, email) => `${webUrl}/my/seat/${seatId}?email=${encodeURIComponent(email)}`,
    certificateUrl: (code) => `${webUrl}/cert/${encodeURIComponent(code)}`,
  }));
  hooks.push(cohortHooks(notifier, {
    fromName: process.env.EMAIL_FROM_NAME ?? "EnrollClass",
    organizerEmail: async () => process.env.EMAIL_REPLY_TO ?? process.env.GATE_ORGANIZER_EMAIL,
    seatUrl: (seatId, email) => `${webUrl}/my/seat/${seatId}?email=${encodeURIComponent(email)}`,
    listSeats: (eventId) => repos.seats.listByEvent(eventId),
  }));
  if (process.env.HUBSPOT_ACCESS_TOKEN) {
    const sync = new CrmSync(new HubSpotCrm({ accessToken: process.env.HUBSPOT_ACCESS_TOKEN }));
    hooks.push({
      orderPaid: async (ctx) => {
        await sync.onOrderPaid({
          orderId: ctx.order.id, buyerEmail: ctx.order.buyerEmail, attendees: ctx.order.attendees,
          amountMinor: ctx.order.pricing.totalMinor, currency: ctx.order.currency,
          courseName: ctx.course?.name ?? ctx.event.name, cohortName: ctx.event.name, cohortStartsAt: ctx.event.startsAt, organizationName: ctx.organization.name,
        });
      },
      orderRefunded: async (ctx) => {
        await sync.onOrderRefunded({
          orderId: ctx.order.id, fully: ctx.fully, buyerEmail: ctx.order.buyerEmail, courseName: ctx.course?.name ?? ctx.event.name, cohortName: ctx.event.name,
          amountMinor: ctx.order.pricing.totalMinor, refundedMinor: ctx.order.refundedMinor, currency: ctx.order.currency,
        });
      },
    });
    console.log("[crm] hubspot sync enabled");
  }
  // Meeting providers from environment; absent ones leave the organizer with manual links.
  const meetings: Partial<Record<"zoom" | "teams", MeetingProvider>> = {};
  if (process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET) {
    meetings.zoom = new ZoomMeetings({ accountId: process.env.ZOOM_ACCOUNT_ID, clientId: process.env.ZOOM_CLIENT_ID, clientSecret: process.env.ZOOM_CLIENT_SECRET, ...(process.env.ZOOM_USER_ID ? { userId: process.env.ZOOM_USER_ID } : {}) });
    console.log("[meetings] zoom enabled");
  }
  if (process.env.MS_TENANT_ID && process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET && process.env.MS_ORGANIZER_USER_ID) {
    meetings.teams = new TeamsMeetings({ tenantId: process.env.MS_TENANT_ID, clientId: process.env.MS_CLIENT_ID, clientSecret: process.env.MS_CLIENT_SECRET, organizerUserId: process.env.MS_ORGANIZER_USER_ID });
    console.log("[meetings] teams enabled");
  }
  // Outgoing webhooks for automation platforms; local development may target localhost receivers.
  const integrations = new Integrations(integrationRepos, { now: () => new Date() }, { next: randomId }, { allowPrivateUrls: env !== "production" });
  hooks.push(integrations.hooks());
  const core = new Core({ repos, ledger, payments, hooks, tax: new FlatRateTax(), meetings, fx: new FrankfurterRates(), onHookFailure: (f) => console.error(`[hook:${f.hook}] order ${f.orderId}: ${f.error}`) });

  // AI gateway: Anthropic first-party by default; tenants may bring their own provider.
  const ai = new AiGateway({
    configs: new InMemoryTenantAiConfigStore(),
    budgets: new InMemoryBudgetStore(),
    audit: new InMemoryAuditSink(),
    secrets: new EnvSecretResolver(),
    defaults: { ...DEFAULT_TENANT_DEFAULTS, model: process.env.GATE_AI_DEFAULT_MODEL ?? DEFAULT_TENANT_DEFAULTS.model, fastModel: process.env.GATE_AI_FAST_MODEL ?? DEFAULT_TENANT_DEFAULTS.fastModel },
    providerFactory: (config, apiKey) => {
      if (config.provider === "openai-compatible") return new OpenAICompatibleProvider({ baseUrl: config.baseUrl ?? "", ...(apiKey ? { apiKey } : {}) });
      return new AnthropicProvider({ ...(apiKey ? { apiKey } : {}), kind: config.provider });
    },
  });
  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);
  console.log(aiEnabled ? "[ai] anthropic enabled" : "[ai] disabled (set ANTHROPIC_API_KEY)");

  // Dev bootstrap: a first organization with a known API key.
  if (env !== "production" && process.env.GATE_BOOTSTRAP_API_KEY && (await repos.organizations.list()).length === 0) {
    const { organization } = await core.createOrganization({ name: "Dev Organization", country: "US", currency: "USD", apiKey: process.env.GATE_BOOTSTRAP_API_KEY });
    await core.connectPayments(organization.id);
    console.log(`[bootstrap] created ${organization.id} with GATE_BOOTSTRAP_API_KEY`);
  }

  // Sequence scheduler: due emails and expired waitlist offers, every few minutes.
  const everyMs = Number(process.env.GATE_SCHEDULER_INTERVAL_MS ?? 5 * 60_000);
  if (everyMs > 0) {
    const tick = async () => {
      try {
        const r = await core.runSequences();
        const expired = await core.expireWaitlistOffers();
        const released = await core.releaseDelivered();
        const flagged = await core.reviewMinEnrollment();
        if (r.sent || expired.length || released.orders || flagged.length) console.log(`[scheduler] sent ${r.sent} emails, expired ${expired.length} offers, released ${released.orders} orders (${released.amountMinor}), flagged ${flagged.length} cohorts`);
      } catch (err) {
        console.error("[scheduler]", err);
      }
    };
    setInterval(tick, everyMs).unref();
    setTimeout(tick, 5_000).unref();
  }

  const providers = configuredProviders(process.env);
  console.log(`[auth] sign-in: ${[...providers.map((p) => p.id), ...(process.env.RESEND_API_KEY || env !== "production" ? ["email link"] : [])].join(", ") || "none configured"}`);

  const app = await buildApp({
    core, ...(stripe ? { stripe } : {}), ...(aiEnabled ? { ai } : {}), ...(idempotency ? { idempotency } : {}),
    ...(process.env.GATE_ADMIN_KEY ? { adminKey: process.env.GATE_ADMIN_KEY } : {}), env, logger: true, publicUrl,
    media: new LocalMediaStore(process.env.GATE_MEDIA_DIR ?? "./data/media"),
    webUrl,
    ticketSecret,
    identities: new Identities(identityRepos, core, { now: () => new Date() }, { next: randomId }),
    integrations,
    providers,
    ...(process.env.RESEND_API_KEY || env !== "production" ? { mailer: notifier } : {}),
    publicPageUrl: coursePageUrl,
  });
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`[api] listening on ${publicUrl}  docs: ${publicUrl}/docs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
