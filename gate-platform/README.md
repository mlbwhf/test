# Gate Platform

Events money OS: ticketing, split payments, payouts and a double-entry ledger today; embedded business banking next. See `../payments-platform-blueprint.md` for the strategy, fee model, jurisdictions and phase plan.

## What is here

| Path | Package | What it does | Verified by |
|---|---|---|---|
| `packages/ledger` | `@gate/ledger` | Double-entry ledger: integer minor units, balanced idempotent entries, natural balances, largest-remainder allocation | unit + property tests |
| `packages/pricing` | `@gate/pricing` | Fee schedules per currency (USD/EUR/AED), order pricing (pass-fee-to-attendee, caps, POS, free tickets), split engine | unit + property tests |
| `packages/core` | `@gate/core` | Domain: organizations, parties, events, ticket types, orders, refunds. Checkout, settlement to ledger, transfers, pro-rata refunds, webhook idempotency. Payments port + fake adapter | unit tests |
| `packages/payments-stripe` | `@gate/payments-stripe` | Stripe Connect adapter: custom accounts + onboarding links, payment intents, separate charges and transfers, refunds with transfer reversal, signed webhook parsing | unit tests (offline) |
| `packages/db` | `@gate/db` | Postgres schema (ledger balance enforced by a deferred constraint trigger; journal tables append-only), migrations, ledger store, repositories, HTTP idempotency store | integration tests on Postgres 16 |
| `packages/ai-gateway` | `@gate/ai-gateway` | Every AI call goes through here: per-tenant model config (bring your own provider), budgets, feature flags, reversible PII redaction, audit. Providers: Anthropic first-party (default `claude-opus-5-5` / `claude-haiku-5-5`, structured outputs, prompt caching, server-side refusal fallbacks) and OpenAI-compatible endpoints. Copilot features: explain order, support triage | unit tests |
| `apps/api` | `@gate/api` | Fastify 5 REST API with zod validation, OpenAPI 3.1 at `/docs`, API-key auth, `Idempotency-Key` replay/conflict, `dry_run` quotes, Stripe webhook, copilot routes, dev-only payment simulation | unit tests + live boot on Postgres |
| `apps/mcp` | `@gate/mcp` | MCP server (stdio) exposing the platform to AI agents. Money movement is never executed by a tool: `propose_refund` returns a `requires_approval` proposal | unit tests |
| `apps/web` | `@gate/web` | Next.js 16 organizer dashboard: cash position, events, ticket types, test sales, orders, refunds | typecheck + production build |

## Run it locally

```bash
pnpm install
pnpm build

# API on in-memory storage and the fake payments adapter (no Stripe, no Postgres needed)
GATE_BOOTSTRAP_API_KEY=dev_key GATE_ADMIN_KEY=admin pnpm dev:api
# -> http://localhost:4000/docs

# Web dashboard
NEXT_PUBLIC_GATE_API_URL=http://localhost:4000 NEXT_PUBLIC_GATE_API_KEY=dev_key pnpm dev:web
# -> http://localhost:3000/dashboard

# With Postgres
docker compose up -d postgres
DATABASE_URL=postgres://gate:gate@localhost:5432/gate GATE_BOOTSTRAP_API_KEY=dev_key pnpm dev:api

# With Stripe Connect (test mode)
STRIPE_SECRET_KEY=sk_test_... STRIPE_WEBHOOK_SECRET=whsec_... pnpm dev:api
stripe listen --forward-to localhost:4000/v1/webhooks/stripe

# MCP server for Claude Desktop / Claude Code / any MCP client
GATE_API_URL=http://localhost:4000 GATE_API_KEY=dev_key pnpm dev:mcp
```

Simulate a payment when running on the fake adapter:

```bash
curl -X POST -H 'x-api-key: dev_key' localhost:4000/v1/dev/payments/<paymentRef>/succeed
```

## Tests

```bash
pnpm test                                             # unit tests everywhere; Postgres tests skip without DATABASE_URL
DATABASE_URL=postgres://gate:gate@localhost:5432/gate pnpm --filter @gate/db test
```

CI (`.github/workflows/ci.yml`) runs typecheck, tests against a Postgres service, build, and a guard that fails on card-number-shaped strings anywhere in source.

## Design rules

- Money is integer minor units everywhere. No floats.
- Every money movement is a balanced ledger entry with an idempotency key. The database enforces balance and append-only on commit, independent of application code.
- Card numbers never reach this codebase (Stripe Elements / Terminal keep PCI scope at SAQ-A). CI fails on PAN-shaped strings.
- Payments providers sit behind `PaymentsPort`. Stripe is the first adapter; Finix or Adyen is a second adapter, not a rewrite.
- AI never moves money. Copilot routes are read-only; MCP money tools return proposals for human approval.
- Tenants may bring their own model. The gateway owns redaction, budgets and audit regardless of provider.

## Not built yet (next in the blueprint order)

- Payout scheduling and same-day payout into the platform balance (Phase 1, weeks 6-7).
- Expo mobile app with Tap to Pay point of sale and attendee wallet (weeks 8-9).
- Persistent AI audit log, tenant AI config and budget tables in Postgres (in-memory today).
- Hash-chained audit log for admin actions, WORM export.
- WorkOS/Clerk user auth and roles on top of the organization API keys.
- Terraform for AWS (two regions, US and EU) and the Phase 2 banking adapters (Unit / Treasury Prime / Stripe Treasury).

## Move to its own repository

```bash
git subtree split --prefix=gate-platform -b gate-platform-main
```
