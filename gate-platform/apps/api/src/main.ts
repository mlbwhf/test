import { InMemoryLedgerStore, Ledger } from "@gate/ledger";
import { Core, FakePaymentsAdapter, createInMemoryRepos, type PaymentsPort, type Repos } from "@gate/core";
import { createPool, migrate, PgIdempotencyStore, PostgresLedgerStore, createPgRepos, type IdempotencyStore } from "@gate/db";
import { StripePaymentsAdapter } from "@gate/payments-stripe";
import { AiGateway, AnthropicProvider, DEFAULT_TENANT_DEFAULTS, EnvSecretResolver, InMemoryAuditSink, InMemoryBudgetStore, InMemoryTenantAiConfigStore, OpenAICompatibleProvider } from "@gate/ai-gateway";
import { buildApp } from "./app.js";

async function main() {
  const env = (process.env.GATE_ENV as "development" | "test" | "production" | undefined) ?? "development";
  const port = Number(process.env.PORT ?? 4000);
  const publicUrl = process.env.GATE_PUBLIC_URL ?? `http://localhost:${port}`;

  // Persistence
  let repos: Repos;
  let ledger: Ledger;
  let idempotency: IdempotencyStore | undefined;
  if (process.env.DATABASE_URL) {
    const pool = createPool(process.env.DATABASE_URL);
    const ran = await migrate(pool);
    if (ran.length) console.log(`[db] applied migrations: ${ran.join(", ")}`);
    repos = createPgRepos(pool);
    ledger = new Ledger({ store: new PostgresLedgerStore(pool) });
    idempotency = new PgIdempotencyStore(pool);
    console.log("[db] postgres");
  } else {
    repos = createInMemoryRepos();
    ledger = new Ledger({ store: new InMemoryLedgerStore() });
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
    });
    payments = stripe;
    console.log("[payments] stripe connect");
  } else {
    if (env === "production") throw new Error("STRIPE_SECRET_KEY is required in production");
    payments = new FakePaymentsAdapter();
    console.log("[payments] fake adapter (set STRIPE_SECRET_KEY for stripe)");
  }

  const core = new Core({ repos, ledger, payments });

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

  const app = await buildApp({
    core, ...(stripe ? { stripe } : {}), ...(aiEnabled ? { ai } : {}), ...(idempotency ? { idempotency } : {}),
    ...(process.env.GATE_ADMIN_KEY ? { adminKey: process.env.GATE_ADMIN_KEY } : {}), env, logger: true,
  });
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`[api] listening on ${publicUrl}  docs: ${publicUrl}/docs`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
