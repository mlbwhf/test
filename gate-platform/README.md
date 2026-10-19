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
| `apps/web` | `@gate/web` | Next.js 16 organizer dashboard (cash position, courses, cohorts with sessions, instructors, regional and early-bird pricing, roster CSV, test sales, orders, refunds) plus the learner portal at `/my/seat/:id` | typecheck + production build |
| `apps/widget` | `@gate/widget` | 22 KB embeddable schedule + on-page checkout widget (`<div data-gate-widget …>`): regional currency, early bird, Stripe Payment Element or test mode, served by the API at `/widget/v1/gate-widget.js` with a demo page at `/widget/v1/demo` | 23 jsdom tests + bundle size guard |
| `packages/integrations-hubspot` | `@gate/integrations-hubspot` | CRM port with a HubSpot adapter: contacts and deals upserted on paid orders and refunds | 14 tests (offline) |
| `packages/meetings` | `@gate/meetings` | Meeting port with Zoom and Microsoft Teams adapters (create, update, delete, participant reports with retries) and attendance summarisation | 24 tests (offline) |

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

## Training vertical (see `../virtual-training-vertical-plan.md`)

| Sprint | Status | What landed |
|---|---|---|
| 1 | done | Courses, cohorts with sessions/time zone/format/instructors/minimum enrolment, seats per learner, regional price lists and early-bird tiers, public catalogue + JSON-LD |
| 2 | done | Embeddable widget, confirmation ticket email with `.ics` per seat (`/public/v1/seats/:id/calendar.ics`), domain hooks, HubSpot sync, dashboard pages for courses/cohorts/roster |
| 3 | done | Corporate accounts, invoice orders with PO and net terms, partial payments via customer deposits, card payment against an invoice, voiding, flat-rate tax engine (GST/HST, VAT, UAE VAT, reverse charge) behind a `TaxPort`, receivables ageing report |
| 4 | done | Change policy engine (per organization or course), learner self-service with seat id + email as credential: substitute, transfer between cohorts (free window, fee + price difference charged by card), cancel with tiered refund; waitlist with held seats, 24-hour offers, claim through the widget, expiry; learner portal at `/my/seat/:id?email=` with no organizer chrome; offer and change emails |
| 5 | done | Zoom (server-to-server OAuth) and Microsoft Teams (Graph) meeting creation per cohort or a manual link; attendance synced from the provider's participant report and matched to seats, with manual overrides; certificates of completion with public verify JSON and a printable view page; roster export in certification-body formats (`default`, `safe_studio`, `scrum_org`); email sequence (pre-work T-14, reminders T-7 and T-1, day-of join link, post-class survey, certificate) driven by an idempotent in-process scheduler; course pre-work and survey settings; dashboard Delivery section |
| 6 | done | Delivery-linked release: organizer-side funds held in a `held` liability until the cohort ends plus a grace period (or released early by the organizer), then released pro rata and transferred; flat instructor fees settled on delivery; payouts recorded against payables; minimum-enrolment review at the decision point with organizer alert; cohort cancellation with full refunds or bulk transfer to another cohort, invoice voiding and waitlist clearing; revenue recognised on delivery with deferred and refunded figures per currency and margin per cohort; dashboard Money page and cohort money controls |

## Not built yet (platform backlog)

- Automated payouts (Stripe payout schedules / bank rails) on top of the recorded-payout ledger; same-day payout into the platform balance.
- Deposit-reserve early release (today early release moves the whole held amount).
- Expo mobile app with Tap to Pay point of sale and attendee wallet.
- Persistent AI audit log, tenant AI config and budget tables in Postgres (in-memory today).
- Hash-chained audit log for admin actions, WORM export.
- WorkOS/Clerk user auth and roles on top of the organization API keys.
- Stripe Tax adapter behind `TaxPort` (flat-rate table today; counsel review required per corridor).
- Terraform for AWS (two regions, US and EU) and the Phase 2 banking adapters (Unit / Treasury Prime / Stripe Treasury).

## Move to its own repository

```bash
git subtree split --prefix=gate-platform -b gate-platform-main
```

## Deploy

Production runs as two container images (API, web) plus Postgres on a single VPS behind
Traefik, built and rolled by the `gate-deploy` GitHub Actions workflow. The runbook, the
Dockerfiles, the Compose file and the server scripts are in [`infra/`](infra/README.md).
