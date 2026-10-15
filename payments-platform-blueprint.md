# Payments + Banking Platform — Build Blueprint

Working name: **Gate** (events money OS). Replace freely.
Scope: ticketing/registration + split payments + on-site POS (Phase 1), embedded business banking (Phase 2), own licences (Phase 3).
Decisions already made in conversation: rent rails (Stripe Connect / Finix, BaaS sponsor bank), Delaware entity, launch in US, UK/Lithuania licensing track later.

---

## 1. Fee strategy: how to beat Corsizio, Eventbrite and Square

### What the incumbents charge (US, paid ticket, card)

| Provider | Platform fee | Processing | Effective on a $100 ticket |
|---|---|---|---|
| Corsizio | $1.00 flat + $0.10/registration | Stripe 2.9% + $0.30 | ~$4.30 (4.3%) |
| Eventbrite (Flex/paid) | 3.7% + $1.79 | 2.9% | ~$8.39 (8.4%) |
| Square (online) | none | 2.9% + $0.30 | ~$3.20 (3.2%) |
| Square (in person) | none | 2.6% + $0.15 | ~$2.75 (2.75%) |
| Stripe Instant Payout | 1% of payout (min $0.50) | — | organizer pays to get money fast |

### Your cost of goods (what you pay underneath)

- Stripe Connect as platform: 2.9% + $0.30 per charge, plus Connect account fees (Express/Custom: ~0.25% + $0.25 per payout, or ~$2/active account/month). Negotiable below ~$1M/month volume only marginally.
- Finix / Adyen interchange-plus at scale: interchange (~1.6–2.1% US blended) + ~0.15–0.30%. This is where margin appears once you clear ~$5M/yr volume.
- BaaS (Phase 2): per-account monthly fee ($0.50–$2), per-transaction cents, and a revenue share on interchange (you keep ~60–80% of ~1.1–1.5% on business debit spend) and on float (sponsor bank pays yield on balances).

### Pricing model to launch with

Do not try to be the cheapest per transaction. Be the cheapest **total cost of money** for an organizer, and make the fee lower when the money stays with you.

| Product | Price | Why it works |
|---|---|---|
| Paid ticket, payout to a Gate account | 2.5% + $0.50, capped at $5/ticket | Below Square online; the cap kills Eventbrite on high-priced courses and conferences |
| Paid ticket, payout to external bank | 2.9% + $0.30 + $0.75 flat | Still beats Corsizio; nudges organizers to open the account |
| Pass-fee-to-attendee toggle | 0% to organizer | Corsizio and Eventbrite both allow it; you must match |
| Free events / free registrations | $0 | Table stakes; costs you nothing on Stripe |
| On-site POS (Tap to Pay, no hardware) | 2.4% + $0.10 | Beats Square in person, no reader purchase |
| Same-day payout to Gate account | free | Stripe charges 1%; this is your headline |
| Instant payout to external card/bank | 1% (min $0.50) | Pass-through at Stripe's rate |
| Refund | processing not returned to organizer, platform fee returned | Same as Stripe; be transparent |
| Team / multi-venue / API plan | $49–$199/month SaaS | Recovers margin on power users without taxing small ones |

Unit economics at launch on Stripe Connect: a $100 ticket paid into a Gate account earns you $3.00, costs you ~$3.45 at Stripe list price. **You lose money per ticket until interchange and float revenue arrive in Phase 2, or until you move to interchange-plus.** Three ways to keep it sane in Phase 1:

1. Set the cap at $5 but start the percentage at 2.7% + $0.50 and lower it publicly when you move to Finix.
2. Charge the attendee-side fee by default (organizer can switch it off), which is what Eventbrite does and what buyers already tolerate.
3. Negotiate Stripe volume pricing on day one with a 12-month volume forecast; Stripe will give 2.7% + $0.30 or better with a committed platform story.

Where the real money is (Phase 2 onward): interchange on the organizer's debit card, float yield on balances, ticket-revenue advances (10–15% APR-equivalent, originated by the sponsor bank), FX margin on cross-border payouts, and the SaaS tier. Processing becomes a near-zero-margin acquisition channel, which is exactly how Square and Toast run.

---

## 2. Technology stack

Principles: one language end to end, boring and auditable infra, never touch raw card numbers, every money movement idempotent and ledgered, every API agent-callable.

### Core
| Layer | Choice | Reason |
|---|---|---|
| Language | TypeScript everywhere (Node 22 LTS) | One hiring pool, shared types across API, web, mobile, MCP server |
| Monorepo | pnpm + Turborepo | Shared packages: `@gate/ledger`, `@gate/sdk`, `@gate/ui` |
| API framework | NestJS (or Fastify + tRPC for internal) | Opinionated modules, guards, OpenAPI generation |
| Primary DB | PostgreSQL 16 (AWS RDS/Aurora) | ACID, row-level security per tenant, pgvector for AI retrieval |
| Ledger | Double-entry tables in Postgres from day one; migrate hot path to TigerBeetle when volume demands | Every balance is a sum of immutable journal lines, never a mutable column |
| Workflows | Temporal (Temporal Cloud) | Payment sagas: authorize → split → settle → payout → reconcile, with retries and compensation |
| Queue / cache | Redis (ElastiCache) + BullMQ | Webhook fan-out, notifications |
| Events | Postgres outbox → SNS/SQS (Kafka only if you reach it) | Exactly-once semantics without running Kafka early |
| Search | Postgres full text first; OpenSearch later | |

### Money rails
| Need | Phase 1 | Phase 2+ |
|---|---|---|
| Card acquiring, splits, payouts | Stripe Connect (Custom accounts, separate charges + transfers) | Finix or Adyen for Platforms (interchange-plus) |
| Checkout | Stripe Payment Element / Checkout Sessions | Own hosted checkout on Finix tokenization |
| In-person | Stripe Terminal + Tap to Pay on iPhone/Android | Same |
| KYC/KYB | Stripe Identity + Persona | Alloy (orchestration across banks) |
| Fraud | Stripe Radar rules | Sift or Unit21 + own models |
| Bank accounts, cards | — | Unit, Treasury Prime, or Stripe Treasury + Issuing (pick by sponsor-bank quality, not API polish) |
| Lending | — | Sponsor bank originates; you underwrite on ticket data |
| Cross-border payouts | Stripe Connect cross-border | Wise Platform, Airwallex, or stablecoin rails via Bridge (Stripe) |

### Frontend and mobile
- **Web:** Next.js 15 (App Router), Tailwind, shadcn/ui, TanStack Query. Organizer dashboard, attendee checkout, admin console.
- **Mobile:** React Native + Expo (EAS builds, OTA updates). Three surfaces in one codebase with feature flags: Organizer app (sales, payouts, approvals), POS app (Stripe Terminal SDK, Tap to Pay), Attendee wallet (tickets, stored value, QR). NativeWind shares Tailwind tokens with web.
- **Offline POS:** local queue with SQLite (expo-sqlite), replay on reconnect, server-side dedupe via idempotency keys.
- **Push:** Expo Notifications → APNs/FCM. Biometric unlock for approvals (expo-local-authentication).

### Identity and security
- **Auth:** WorkOS or Clerk (SSO, MFA, passkeys, SCIM for larger organizers). Short-lived JWTs, refresh rotation, device binding on mobile.
- **Authorization:** role + resource scopes (org, event, venue). Enforce in Postgres row-level security as well as in the API.
- **Secrets:** AWS Secrets Manager + KMS; envelope encryption for PII fields (name, DOB, tax IDs); no secrets in env files in CI.
- **PCI:** stay SAQ-A by using Stripe Elements/Terminal; card numbers never touch your servers or logs. Add a CI check that fails on PAN-shaped strings in test fixtures.
- **Network:** Cloudflare WAF + rate limiting + bot management in front; private subnets for DB; egress allow-list.
- **Audit:** append-only, hash-chained audit log table for every money action and every admin action; export to S3 Object Lock (WORM).
- **Idempotency:** every mutating endpoint takes an `Idempotency-Key`; stored with request hash and response for 24h.
- **Compliance tooling:** Vanta or Drata from month one (SOC 2 Type I at ~6 months, Type II at ~12). Pen test before public launch.
- **Supply chain:** pnpm lockfile, Socket.dev or Snyk, signed container images, Dependabot.
- **Data residency:** region tag per tenant; EU tenants in eu-west-1 when the UK/EU track starts.

### Infrastructure
- AWS from day one (ECS Fargate, RDS, ElastiCache, SQS, S3, CloudFront), Terraform, separate accounts for dev/staging/prod. Sponsor banks and SOC 2 auditors expect this; Vercel/Railway are fine for marketing site only.
- OpenTelemetry → Grafana Cloud or Datadog. Trace every payment through Temporal with the ledger entry ID as the correlation key.
- GitHub Actions: lint, typecheck, unit, contract tests against Stripe test mode, Playwright e2e, Terraform plan.

---

## 3. LLM-friendly by design

Make the platform as easy for an AI agent to operate as for a human. This is a differentiator today and a requirement within two years.

1. **OpenAPI 3.1 is the source of truth.** Generated from NestJS decorators, published, versioned. Generate SDKs with Stainless or Speakeasy (TypeScript, Python, Go).
2. **Ship an MCP server** (`@gate/mcp`) exposing scoped tools: `list_events`, `create_event`, `sell_ticket`, `issue_refund`, `get_cash_position`, `schedule_payout`, `explain_transaction`. OAuth 2.1 with granular scopes; any tool that moves money returns a `requires_approval` object and completes only after a human taps approve in the mobile app.
3. **Agent checkout.** Let third-party agents buy tickets on a user's behalf through MCP plus a single-use scoped payment token (same pattern as Stripe agentic commerce, Visa Intelligent Commerce, Mastercard Agent Pay). No incumbent event platform offers this yet.
4. **Structured, stable errors** (`error.code`, `error.hint`, `error.docs_url`) so an agent can self-correct.
5. **Webhooks with replay** and an `/events` cursor API, so agents can reconcile without polling.
6. **`llms.txt` and docs as Markdown** at the API root, mirroring what you already do on agile-agilist.
7. **Deterministic sandboxes:** a test tenant with seeded data that agents can hit safely, plus a `dry_run: true` flag on every mutating endpoint.

---

## 4. AI layer and bring-your-own-LLM

### Default provider: Anthropic Claude via the official SDK
Use the official SDK (`@anthropic-ai/sdk` in TypeScript, `anthropic` in Python for risk/ML jobs). Current model routing:

| Job | Model | Notes |
|---|---|---|
| Organizer copilot (cash-flow questions, dispute response drafting, pricing advice, "why is my payout smaller") | `claude-opus-5-5` | Adaptive thinking on by default; set `output_config.effort` explicitly (`high` for advice, `medium` for chat) |
| High-volume classification (transaction categorization, support triage, first-pass KYC document checks, fraud note summarization) | `claude-haiku-5-5` | `effort: "low"`, structured outputs, batch API for nightly jobs at half price |
| Mid-tier agentic flows (refund workflow assistant, reconciliation explanations) | `claude-sonnet-5-5` | When Opus cost is not justified |

Patterns that matter in a fintech context:
- **Tool use with approval gates.** The copilot can read anything in the tenant and propose money actions; it never executes one. Tool results go back as `tool_result`; money tools return a pending-approval object.
- **Structured outputs** (`output_config.format`) for anything that feeds a database. No free-text parsing.
- **Prompt caching** on the frozen system prompt + tenant policy document; verify with `usage.cache_read_input_tokens`.
- **PII hygiene.** Tokenize names, account numbers and emails before they reach the model; map back on display. Never send PANs (you never have them anyway).
- **Server-side refusal fallbacks** on Opus 5.5 (`fallbacks: "default"` with the beta header) so a safety-classifier decline degrades gracefully instead of erroring in the UI.
- **Evals before launch.** A 200-case eval set per feature (support triage, categorization, dispute drafts) scored on held-out data; re-run on every prompt or model change.
- **Retrieval, not fine-tuning.** Claude does not offer fine-tuning. Tenant knowledge (refund policy, event history, prior tickets) goes into pgvector and is retrieved per request. Reusable procedures become Agent Skills.

### Bring-your-own-LLM (the "connect your own model" feature)
Build a thin **LLM gateway service** (`@gate/ai-gateway`) that every product feature calls instead of calling a vendor directly:

- **Provider adapters:** Anthropic first-party (default), Claude on Amazon Bedrock and Google Vertex AI (for tenants with data-residency or existing cloud commitments), and an OpenAI-compatible adapter for tenants who insist on their own endpoint, including self-hosted open-weight models.
- **Per-tenant config:** provider, model, region, API key (stored in KMS, never logged), monthly token budget, allowed features.
- **Policy layer:** PII redaction, prompt-injection screening on retrieved content, output schema validation, per-tenant rate limits, full audit trail of prompts and completions (hashed, retained per policy).
- **Fallback chain:** tenant model → Anthropic default → degrade to rules-based behavior. The product must work with AI off.
- **Cost attribution:** every call tagged with tenant, feature and user; surfaced on the tenant's bill.

Off-the-shelf gateways (Portkey, LiteLLM, Cloudflare AI Gateway) can stand in for the adapter layer in month one; keep the policy layer yours because it is where the compliance story lives.

---

## 5. Build order (first 12 weeks, 3–4 engineers)

| Weeks | Deliverable | Done when |
|---|---|---|
| 1–2 | Monorepo, CI, AWS accounts, Terraform, auth (WorkOS), tenant model, double-entry ledger package with property tests | A test org exists and every ledger invariant test passes |
| 3–5 | Events, ticket types, checkout (Stripe Payment Element), Connect Custom onboarding, splits to venue/vendor, refunds, webhooks → ledger | A real card buys a test ticket, money lands split across three accounts in Stripe test mode, ledger balances to zero |
| 6–7 | Payout scheduling, same-day payout into platform balance, organizer dashboard, reporting exports | Organizer sees cash position and gets paid on schedule |
| 8–9 | Expo app: organizer + POS with Tap to Pay, offline queue, attendee QR tickets and check-in | A ticket is sold on a phone with no reader and appears in the same ledger |
| 10–11 | OpenAPI + SDKs, MCP server with approval gates, Claude copilot v1 (read-only answers + refund drafting), AI gateway with tenant config | An agent lists events and proposes a refund that a human approves on mobile |
| 12 | Pen test, SOC 2 kickoff in Vanta, Stripe production approval as platform, pilot with agile-agilist cohorts | First live paid registration |

Parallel non-engineering track: Delaware C-corp, fintech counsel opinion on Phase 1 money-transmission posture, Stripe platform agreement, BaaS RFP to Unit / Treasury Prime / Stripe Treasury for Phase 2.

---

## 6. What to do today

1. Create a new repository (`gate-platform`), not this one. Seed it with the monorepo skeleton: `apps/api`, `apps/web`, `apps/mobile`, `apps/mcp`, `packages/ledger`, `packages/sdk`, `packages/ui`, `packages/ai-gateway`, `infra/terraform`.
2. Open a Stripe account for the platform entity and enable Connect in test mode.
3. Authorize the Stripe connector in your Claude settings so the next session can prototype checkout and splits against a live test account.
4. Write the ledger package first. Everything else is replaceable; the ledger is not.

---

## 7. Entity structure and jurisdictions

Existing licences: Delaware, Canada, UAE. Preference: EU over Canada.

| Entity | Role | Licence path |
|---|---|---|
| Delaware C-corp (parent) | IP holder, fundraising, US operations | Phase 1: Stripe Connect platform, no licence. Phase 3: state money transmitter licences |
| Lithuanian UAB | EU operations, engineering hub, future Electronic Money Institution (EMI) | Phase 1: Stripe platform via Stripe Payments Europe. Phase 2: agent of a licensed EMI (Swan, Solaris, Treezor, Intergiro). Phase 3: own EMI licence from the Bank of Lithuania, passported to all 30 EEA states; UK licence afterwards |
| UAE entity (ADGM preferred) | Gulf go-to-market, investor base, Dubai/Riyadh events market | Phase 2: UAE BaaS partners (NymCard, Zand). Own Retail Payment Services licence only if Gulf volume justifies it |
| Canada | Dormant or payroll only | None |

Why Lithuania: fastest EU EMI licence, full EEA passport, affordable fintech talent in Vilnius. Requirement: real local substance (management, compliance and risk heads in country); the regulator fines shells. Alternatives: Netherlands (predictable regulator, Adyen/Mollie ecosystem) if a Western HQ matters; Ireland is slow and costly; Estonia and Malta are fast but weaker on reputation.

EU rules that help: Instant Payments Regulation (instant SEPA mandatory and cheap, 2025-2026) makes same-day payouts nearly free; MiCA gives a clear path for stablecoin payouts later.
EU rules that cost: DORA (operational resilience audits from day one), GDPR (EU tenants pinned to an EU region).

Changes to the build order:
- Two AWS regions from day one (us-east-1, eu-central-1 or eu-west-1), tenant data pinned by region.
- Stripe platform agreements under both the Delaware and Lithuanian entities.
- Bank of Lithuania pre-application around month 9 once live volume exists; expect 6-12 months, ~EUR 350k regulatory capital plus comparable setup cost.
- One law firm covering US, EU and UAE to confirm Phase 1 posture and handle transfer pricing and UAE corporate tax.

---

## 8. Build status

Code lives in `gate-platform/` (pnpm + Turborepo monorepo, TypeScript). Built and verified so far: ledger, pricing and split engine, core domain with checkout/settlement/refunds, Stripe Connect adapter, Postgres schema with database-enforced ledger invariants, AI gateway with bring-your-own-LLM, REST API with OpenAPI and idempotency, MCP server with approval-gated money actions, and the Next.js organizer dashboard. See `gate-platform/README.md` for how to run it and what is next.
