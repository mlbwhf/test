# Trainyard

Scaled agile planning and AI portfolio management that runs on top of Jira and Azure DevOps, or on its own. See `../scaled-planning-opportunity.html` for the market research behind it.

Working name; rename freely.

## Edition and license

One edition, every module, free: planning board, operating-model builder, dashboards, Lean portfolio, AI portfolio with stage gates, agent registry, Jira and Azure DevOps sync, users and audit, AI facilitation. Licensed under **Apache-2.0** (see `LICENSE`), so anyone can self-host it, change it and use it commercially; the trademark attributions below still apply. Nothing is gated behind a paid tier. If a hosted or supported offering is added later, it should be the same code with operations and support on top, not features held back.

AI assistance runs three ways, chosen by environment variables: Claude through the Anthropic API (best drafts, paid per use), **any OpenAI-compatible local model** such as Ollama, vLLM or LM Studio (free, runs on your own box, slower and rougher), or off.

## What is here

| Path | Package | What it does | Verified by |
|---|---|---|---|
| `packages/core` | `@trainyard/core` | Domain model (work items, teams, groups, increments, dependencies, ROAM risks, objectives). **Operating models as data**: templates for SAFe Essential, Portfolio and Full, **AI-Native SAFe**, LeSS, LeSS Huge, Scrum@Scale, Nexus, Flight Levels and tribes/squads, plus fork and validation. Planning: increment layout, team load against capacity, dependency checks, planning readiness. **Lean portfolio**: value streams with budgets per PI, epics ranked by WSJF, guardrails (enabler floor, single-epic budget cap, business case above a threshold), OKRs with key results typed in or read from a metric. **Metric registry and dashboard engine** with flow, predictability, dependency, risk, capacity, budget, WSJF and OKR metrics. **Boards**: imported boards, templates (structure kept, content cleared) and a mapping that promotes cards or rows into items, risks, dependencies and teams. Deterministic demo workspace with mixed Jira and ADO teams | 33 unit tests |
| `packages/ai-portfolio` | `@trainyard/ai-portfolio` | **AI project module**: lifecycle (idea → data readiness → experiment → evaluate → pilot → production → monitor → retired), evidence-based stage gates that tighten by EU AI Act risk tier, eval thresholds, curated-data and human-oversight checks, AI value architect sign-off at pilot and production, an **agent registry** (accountable human, autonomy levels 0–4, limits per model and risk tier), spend against budget with month-end forecast, value realised against KPIs, and six AI dashboard metrics | 16 unit tests |
| `packages/ai-assist` | `@trainyard/ai-assist` | **AI facilitation** through the Anthropic SDK with schema-validated answers (`messages.parse` + zod): draft PI objectives from a team's planned features, suggest ROAM for risks and spot unraised ones, write the readiness briefing, narrate a dashboard, prepare an AI governance review. Prompts carry titles and numbers only, never people's names. A fake provider makes every feature testable offline | 7 tests |
| `packages/importers` | `@trainyard/importers` | **Bring your own boards**: Miro (REST v2), Lucid (REST, Lucidchart and Lucidspark, plus the shape data CSV), Mural (public API), monday.com (GraphQL), Trello (REST), plus CSV and a documented JSON format for anything else. Each pulls a board as it is into a `Board` (frames, cards with text/colour/position, connectors, columns, groups, rows; unknown fields kept verbatim) | 17 offline tests with recorded responses |
| `packages/connectors` | `@trainyard/connectors` | Jira Cloud adapter (enhanced JQL search with `nextPageToken`, field updates, sprint moves, Blocks links) and Azure DevOps adapter (WIQL, `workitemsbatch` in batches of 200, JSON Patch updates, Successor links). Retries on 429/5xx with `Retry-After`. **Two-way sync planner**: remote changes flow in, local plan changes flow out, a field changed on both sides becomes a conflict | 9 offline tests with a recorded fake `fetch` |
| `packages/db` | `@trainyard/db` | Persistence port with optimistic versioning (a stale save is refused, never merged silently) and an append-only audit log. Three stores: memory, JSON files (single box) and **Postgres** (migrations, advisory-locked; the audit table rejects update and delete) | 9 tests; Postgres ones run when `DATABASE_URL` is set |
| `apps/api` | `@trainyard/api` | Fastify 5 REST API with zod validation and OpenAPI at `/docs`. **Users, roles and API keys** (admin, planner, architect, viewer; keys hashed, shown once; open mode until the first user exists). Every mutation is committed and audited. Model, board, items, dependencies, risks, objectives, metrics, dashboards, portfolio, AI initiatives, agents, assist routes, tracker sync on request, **on a schedule or from a Jira/ADO webhook** | 24 tests via `inject` |
| `apps/web` | `@trainyard/web` | Next.js 16 app: dashboard builder with narrative, drag-and-drop PI planning board (milestones and events, dependency strings, risks) with objective drafting, ROAM suggestions and readiness briefing, portfolio page (budgets, WSJF, guardrails, OKRs), AI portfolio lifecycle and gate pages with governance review, agent registry, operating model editor, tracker connections, users and audit log, sign-in | typecheck, production build, browser run-through |
| `integrations/` | | The Jira app (Forge Custom UI) and the Azure DevOps extension (hub), both showing `/embed/*` pages | build in CI; VSIX packaged with `tfx` |
| `infra/`, `docker-compose.yml` | | Dockerfiles for the API and web app, and a compose file with Postgres for self-hosting | |

## Run it locally

```bash
pnpm install
pnpm build

pnpm dev:api   # http://localhost:4100/docs, demo workspace, in-memory, open mode
pnpm dev:web   # http://localhost:3100
```

The demo runs on a fixed date (21 October 2026) so its numbers stay stable; set `TRAINYARD_DEMO_CLOCK=0` for the real clock.

## Self-host

Any box with Docker:

```bash
TRAINYARD_ADMIN_KEY=$(openssl rand -hex 24) docker compose up -d --build
# open http://localhost:3100/login and sign in with that key, then create users under Users
```

For a single box without Postgres, run the API with `TRAINYARD_DATA_DIR=/var/lib/trainyard` instead of `DATABASE_URL`: state is a JSON file written atomically, the audit log a JSONL file next to it.

### Local AI with Ollama

```bash
ollama pull qwen2.5:7b          # or qwen2.5:3b on a small machine
TRAINYARD_LLM_URL=http://localhost:11434/v1 TRAINYARD_LLM_MODEL=qwen2.5:7b pnpm dev:api
```

Every assist feature then runs against the local model. Answers are validated against the same schemas as Claude's and retried once with the validation errors; expect 20–60 s per draft on a CPU and plainer wording.

### On the EnrollClass VPS (same Hostinger box, same Traefik)

Trainyard runs beside gate under `/opt/trainyard`, with its own Postgres, published by the Traefik the Hostinger template installed. Hosts default to `plan.<domain>` and `plan-api.<domain>`.

```
infra/docker/Dockerfile.api, Dockerfile.web   images built by GitHub Actions, pushed to ghcr.io/mlbwhf/trainyard-{api,web}
infra/compose/docker-compose.prod.yml         postgres, api, web; optional ollama (--profile llm) and backup (--profile backup)
infra/compose/env.production.example          every runtime variable
infra/scripts/first-run.sh                    one-time: /opt/trainyard, .env with generated secrets, Traefik values copied from /opt/gate/.env
infra/scripts/deploy.sh                       pull, roll, wait for /health (CI and by hand)
infra/scripts/smoke.sh                        checks the live site from outside
.github/workflows/trainyard-deploy.yml        test, build, push, roll the VPS over SSH with the DEPLOY_* secrets gate already uses
```

Steps:

1. DNS: A records for `plan.<domain>` and `plan-api.<domain>` to the VPS.
2. On the VPS, as root or `deploy`: `git clone --depth 1 -b claude/confident-cray-JTbgD https://github.com/mlbwhf/test.git /root/trainyard-src && bash /root/trainyard-src/trainyard/infra/scripts/first-run.sh <domain>`. It prints the admin key.
3. Optional, in `/opt/trainyard/.env`: `ANTHROPIC_API_KEY`, or `LLM_PROFILE=llm` plus `TRAINYARD_LLM_URL=http://ollama:11434/v1` to run a free model on the box (a 3B model needs about 3 GB of RAM, a 7B about 6 GB; check `free -h` next to gate first).
4. GitHub: the `DEPLOY_HOST`, `DEPLOY_USER` and `DEPLOY_SSH_KEY` secrets already exist for gate; add repository variables `TRAINYARD_WEB_HOST` and `TRAINYARD_API_HOST` if the hosts differ from the defaults. Push to the deploy branch and the workflow rolls it out; or run `cd /opt/trainyard && ./deploy.sh` by hand.
5. Sign in at `https://plan.<domain>/login` with the admin key and create users.

**Keeping EnrollClass safe.** The two stacks share nothing but the host and Traefik: separate Compose projects (`gate`, `trainyard`), networks, volumes, Postgres instances, router, middleware and service names, and hostnames; Trainyard publishes no host ports; its workflow only runs on changes under `trainyard/` and `gate-deploy` only on `gate-platform/`. `deploy.sh` checks gate's public `/health` before and after every roll and exits non-zero if gate was healthy before and is not after, so the GitHub run turns red instead of a customer noticing. Memory on a KVM2 (8 GB): gate's limits add up to about 3.5 GB and Trainyard to about 1.5 GB, so both fit. Ollama is capped at 3 GB and one CPU, and `deploy.sh` refuses to start it unless that much memory plus 1 GB of headroom is free; on a KVM2 beside gate, leave it off and use Claude or a bigger box.

## Domains

One canonical web host and one API host, plus optional aliases, all in `.env`: `TRAINYARD_WEB_HOST` (e.g. `trainyard.app`), `TRAINYARD_API_HOST` (`api.agileagilist.com`), `TRAINYARD_WEB_ALT` and `TRAINYARD_WEB_ALT2` (`www.agileagilist.com`, `plan.agile-agilist.com`), `TRAINYARD_API_ALT` (`plan-api.agile-agilist.com`). Web aliases get their own certificate and a permanent redirect to the canonical host, so search engines index one site; the API alias answers directly because a redirect would break browsers' CORS preflight. Every host needs an A record to the VPS. The smoke test checks the canonical hosts and that each alias redirects.

## Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres. Else `TRAINYARD_DATA_DIR` for JSON files, else memory (refused in production) |
| `TRAINYARD_ADMIN_KEY` | Bootstrap admin key. Without it and with no users, the API runs **open**: everyone is an admin (refused in production) |
| `ANTHROPIC_API_KEY` | AI facilitation through Claude. Model: `TRAINYARD_AI_MODEL` (default `claude-opus-5-5`) |
| `TRAINYARD_LLM_URL` | AI facilitation through an OpenAI-compatible server instead, e.g. `http://localhost:11434/v1` (Ollama). `TRAINYARD_LLM_MODEL` (default `qwen2.5:7b`), optional `TRAINYARD_LLM_KEY`; `TRAINYARD_LLM_JSON_SCHEMA=0` for servers that reject `response_format`. Used only when no Anthropic key is set |
| `TRAINYARD_JIRA` + `JIRA_API_TOKEN` | Jira connection: mapping JSON plus the token |
| `TRAINYARD_ADO` + `ADO_PAT` | Azure DevOps connection: mapping JSON plus the PAT |
| `TRAINYARD_SYNC_EVERY_MINUTES` | Scheduled sync of every connected tracker |
| `TRAINYARD_WEBHOOK_SECRET` | Enables `POST /v1/webhooks/{jira\|ado}?token=…`; point Jira and ADO service hooks at it and a sync runs a few seconds after each burst of changes |
| `TRAINYARD_WEB_URL` | CORS origin for the web app |
| `TRAINYARD_SIGNUP_WEBHOOK` | Website sign-ups are POSTed here as JSON; they are always listed under Users |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_TRAINER_MONTHLY`/`_YEARLY`, `STRIPE_PRICE_ACADEMY_MONTHLY`/`_YEARLY`, `STRIPE_TRIAL_DAYS` | Stripe subscriptions for the paid plans, paid in page. Unset: payments off, paid sign-ups are handled by hand |
| `TRAINYARD_FRAME_ANCESTORS` | Web app: hosts allowed to frame `/embed/*` for the Jira app and Azure DevOps extension. Empty means the Atlassian and Azure DevOps defaults; `none` turns embedding off |
| `TRAINYARD_ENV=production` | Refuses memory persistence and open mode |
| `TRAINYARD_SMTP_URL`, `TRAINYARD_MAIL_FROM` | Outbound mail: sign-up codes and trial emails. Any SMTP service works (Postmark, Resend, Amazon SES, Mailgun) |
| `TRAINYARD_EMAIL_VERIFICATION` | `required` or `off`. Default: required when SMTP is set |
| `TRAINYARD_TRUSTED_PROXIES` | Edge proxy ranges to trust for client addresses (default Cloudflare's). See `docs/proxy.md` |

Roles: **admin** (everything), **planner** (board, dashboards, portfolio, AI initiatives, sync), **architect** (planner plus stage-gate sign-off, tied to a person with the AI value architect role), **viewer** (read only). A user may also be linked to a person in the workspace; a non-admin can only sign off as that person.

### Tracker mappings

```bash
export JIRA_API_TOKEN=...
export TRAINYARD_JIRA='{
  "baseUrl": "https://yourco.atlassian.net",
  "email": "planning-bot@yourco.com",
  "jql": "project in (CHK, SRC) AND updated >= -180d",
  "fields": { "storyPoints": "customfield_10016", "sprint": "customfield_10020" },
  "mapping": {
    "levels": { "Epic": "epic", "Feature": "feature", "Story": "story", "Bug": "story" },
    "projectTeams": { "CHK": "t-checkout", "SRC": "t-search" },
    "iterations": { "4211": "pi-26-4.1", "4212": "pi-26-4.2" }
  }
}'

export ADO_PAT=...
export TRAINYARD_ADO='{
  "organization": "yourco",
  "project": "Customer",
  "where": "[System.AreaPath] UNDER '\''Customer'\''",
  "mapping": {
    "levels": { "Epic": "epic", "Feature": "feature", "User Story": "story", "Bug": "story" },
    "areaTeams": { "Customer\\Payments": "t-payments", "Customer\\Assist": "t-assist" },
    "iterations": { "Customer\\PI 26.4\\Iteration 1": "pi-26-4.1" }
  }
}'
```

Custom field ids differ per Jira site. Jira's issue-link API does not fix which side "blocks", so create one test link on a sandbox and set `providerSide` if dependencies come out reversed.

Trainyard writes back plan fields only (iteration, estimate, business value, title, dependency links). Status stays owned by the teams' own boards.

## Bring your own boards

**iObeya.** Upload the .zip that iObeya's board Export produces (or the .csv inside it). Program boards come in with their teams × iterations grid, dates, milestone row and dependency strings; team boards with each iteration's capacity and load; Kanban boards with their stages and WIP limits; roadmaps with their lanes; free boards as they are. Cards keep their position, colour, story points, WSJF, team and iteration; notes, free text, stickers and embedded images come along; charts keep their data series and are redrawn. Cards from the room's card library that were never placed on the board stay out unless you tick "Also bring the card library". Mapping onto the plan reads each card's own team, iteration, story points and business value.

**Lucid.** Connect Lucidchart and Lucidspark with an API key from the Lucid Developer Portal or an OAuth2 user token (`lucidchart.document.content:readonly`, `lucidspark.document.content:readonly`), browse your documents and import one, or upload the file from File → Export → CSV of Shape Data. Each page becomes a frame, containers become frames inside it, shapes and sticky notes become cards with their text, shape library, custom data and any extra columns (votes, tags, comments) kept in fields, and lines become connectors with their labels. Neither the API's document contents nor the CSV carry canvas positions, so cards are laid out in a grid on each page; a bounding box is used where the API returns one.

Under **Bring your own boards**, connect Miro, Lucid, Mural, monday.com or Trello with a token (stored encrypted under `TRAINYARD_SECRET`), browse and import boards, or upload a CSV from any tool with a header row, or post the JSON format below. Imports are kept exactly as they came and drawn at their original positions and colours (or as the original table with its groups). Any board can be saved as a template and new boards created from it. "Map onto the plan" previews, then on Apply creates work items, risks, dependencies and teams from cards or rows: team from the frame/group/column, iteration by name, estimate and status columns, colour rules for risks and enablers, connectors as dependencies. Nothing is written until Apply.

Plan limits to know: Miro's REST API needs a Developer team app (free). Mural's API needs a registered app and an OAuth token. monday.com personal tokens work on every plan within its complexity limits. Trello needs an API key and token from a Power-Up admin page. Lucid API keys can be turned off by an account admin; OAuth tokens need the Lucidchart and Lucidspark content scopes for the documents you want. All five have been tested against recorded responses only; the first live import may surface a field we map differently.

Board JSON (`POST /v1/imports/json`, body `{ "board": ... }`):

```json
{
  "name": "PI 26.5 board",
  "url": "https://where.it.came.from/optional",
  "frames": [{ "id": "f1", "title": "Checkout", "x": 0, "y": 0, "width": 1000, "height": 600 }],
  "nodes": [{ "id": "n1", "kind": "sticky", "text": "Guest checkout", "x": 100, "y": 100, "color": "#fff9b1", "frameId": "f1", "tags": ["mvp"] }],
  "edges": [{ "fromId": "n1", "toId": "n2", "label": "needs" }],
  "columns": ["Title", { "id": "pts", "title": "Points", "type": "numbers" }],
  "rows": [{ "Title": "Guest checkout", "Points": 13, "Team": "Checkout" }]
}
```

Every key but `name` is optional; rows may be flat objects keyed by column title (new columns are added as needed) or `{ id, groupId, cells }`; unknown node keys are kept under `fields`.

## Templates and the board editor

**Templates** lists the built-in boards by method, each in that method's own words: SAFe boards use SAFe's names exactly (the classes depend on it); Scrum boards the Scrum Guide's (Product Backlog, Sprint Planning, Sprint Backlog board, Sprint Review, Sprint Retrospective); Kanban the Kanban Method's (Kanban system board with WIP limits, classes of service and explicit policies, STATIK canvas, service delivery review, flight levels); Lean its own (A3, PDCA, value stream map, kaizen newspaper, hoshin kanri X-matrix, obeya); Six Sigma (DMAIC with tollgates, project charter, SIPOC, VOC → CTQ tree, 6M fishbone, FMEA, control plan); and manufacturing (SQDC tiered board, andon, OEE tracker, heijunka box, 5S audit, gemba walk). Filter by method and by tag. Each board is sized to the workspace's teams and iterations when it is created. The SAFe set: PI Planning board, Team breakout (capacity and load, stories and features per iteration, IP iteration, PI objectives with BV/AV, risks, features backlog, planning poker), ROAM risk board, PI planning board, Confidence vote, Retrospective, Team Kanban, Inspect & Adapt, Epic / Lean business case, OKR tree, Dependency map, Obeya wall, User story map, Value stream and ART identification, Portfolio Kanban, ART Kanban, Portfolio roadmap per ART, Portfolio ART planning board and Solutions by investment horizon. Boards you imported and saved as templates sit beside them. Filter by SAFe, Team, Portfolio, Risk, Flow / Kanban or Lean / Obeya, read what each one is used for and how it maps onto the plan, name the board and create it. Built-in templates are read only; the boards made from them are yours. Class boards are not listed in the gallery; they live under **Classes**, together with any class saved as a template.

**Template packages** sit at the top of the gallery and create the boards a SAFe event needs at once: *Prepare for PI planning* (PI planning readiness, ART Kanban, Portfolio ART planning board), *PI planning* (agenda, PI planning board, team breakout, ROAM, confidence vote) and *Close the PI* (IP iteration, then Inspect & Adapt). Choose one board with the templates side by side or a board for each, optionally in a room. API: `GET /v1/templates/boards` returns `packages`; `POST /v1/templates/packages/:id/create` takes `{ name, mode: "one-board" | "boards", roomId? }`.

Every board opens in the canvas editor: drag cards (they re-home to the frame they land in, so a risk dragged from Inbox to Resolved is resolved), drag whole frames with their cards, add cards, double-click to write, recolour, connect two cards with the Connect tool, delete connectors, zoom. Each change is one API call (`/v1/boards/:id/nodes`, `/edges`, `/frames`) so the same editor works for imported boards, and "Map onto the plan" sees the edits.

The look follows the "Trainyard Glass" design: a lit backdrop with frosted rail, panels and cards (three blur strengths), the amber signal colour for the one thing that matters on a screen, Bricolage Grotesque for display type, Instrument Sans for text and IBM Plex Mono for numbers, with a dark scheme that follows the system. The design artboards are at https://claude.ai/artifact/M8AL14GSFFZX7uoCFtwTmq.

## Security, SEO and the model

**Security.** API keys hashed at rest with constant-time comparison and roles; a ten-minute lockout after twenty bad keys from one address; rate limits (600 requests a minute per key or address, 30 on AI routes) and an 8 MB body cap; a Content Security Policy with a per-request nonce and `strict-dynamic` on the web app and `default-src 'none'` on the API; HSTS, frame denial, nosniff, a restrictive Permissions-Policy; connection tokens sealed with AES-256-GCM; containers without capabilities, non-root, read-only where possible, Postgres on a private network; CI fails on high or critical advisories in production dependencies and Dependabot opens weekly updates. The full list, what the host must do, and how to report a problem are in [SECURITY.md](SECURITY.md).

**SEO.** The root `/` is a public, server-rendered landing page with a canonical URL, Open Graph and Twitter cards (`/og.png`), `SoftwareApplication` and `FAQPage` structured data, `/robots.txt` and `/sitemap.xml`, and `/llms.txt` for answer engines. Every application route is `noindex` and disallowed for crawlers. The site URL comes from `TRAINYARD_PUBLIC_WEB_URL`, so one image serves any domain.

**The model.** Pick one in `.env`: `ANTHROPIC_API_KEY` for Claude (recommended; `TRAINYARD_AI_MODEL` defaults to `claude-opus-5-5`), `TRAINYARD_LLM_URL` for any OpenAI-compatible server (hosted or `LLM_PROFILE=llm` for Ollama on the VPS). With a provider set, every page's AI buttons light up: PI objective drafts, ROAM suggestions, readiness briefing, dashboard narrative, gate reviews, and **Review this board** on any canvas, which groups cards into themes, names risks and missing connections and proposes questions for the room. Card text is sent as data with an instruction never to follow what it says; answers are schema-validated and nothing is written until someone accepts.

## Value streams

**Value streams** has two views, because SAFe uses value streams in two ways.

- **Identification** is the workshop, run the way the SPC deck runs it. Pick the operational value stream type (fulfilment, manufacturing, software product, supporting, or a type you add) and a new workshop is seeded from its example; fill SAFe's template (type, name, description, customers, triggers, value to the enterprise, value to the customer). Then the chevrons: who performs each step sits above it, the solutions that support the steps below, then the people who develop and support those solutions (always by group: count, location, function), the development value streams drawn around people and solutions (with the legal, marketing, support and operations people the full business solution needs), and the trains cut from them with a topology (stream-aligned, platform, complicated subsystem, enabling). Click any chevron, bar, group or train to edit it in place; + adds one where you are. Click a step to see which solutions, people and trains a change to it touches. Each train is checked against 50 to 125 people, and the facilitator's flags list steps without a solution, solutions no one builds or owns, and trains outside the band.
- **Mapping** is the measurement. Each step carries its active time, the wait in front of it and its percent complete and accurate, for a current and a future state. The totals are SAFe's: total active time, total wait time, flow efficiency (process time over lead time) and total %C&A (the product of every step's), plus the longest queue to attack first and a to-scale lead-time ladder. The starting map is SAFe's feature-to-production example and reproduces its published figures: 98 hours active, 1,796 hours waiting, 5% flow efficiency, 35% complete and accurate.

API: `GET /v1/value-streams` (with `ovsTypes` and `topologies`), `POST /v1/value-streams/ovs-types`, `POST /v1/value-streams/identifications/from-type`, `PUT /v1/value-streams/identifications/:id`, `PUT /v1/value-streams/maps/:id`, `DELETE /v1/value-streams/:kind/:id`, and `GET /v1/value-streams/identifications/:id/steps/:stepId` for a step's impact. References inside a workshop are checked on save.

### The current state from status history

**Calculate from data** on a map reads status history instead of asking people to estimate: a CSV of status changes from any Kanban tool (columns named like item/key, status/to/column and date/timestamp/changed), Jira issue changelogs (with optional JQL) or Azure DevOps work item revisions (with an optional WIQL clause), through the connected tracker. A first mapping is suggested from the order statuses usually occur in: each "working" status becomes a step and the "waiting" statuses before it (Ready…, To do, Blocked, Awaiting…) its queue; Done and Closed are left out. Edit it, then per step:

- **wait** and **active**: time per item in the waiting and working statuses, combined as the median, mean or 85th percentile, optionally within a date window;
- **%C&A**: 1 − (items that came back to the step after moving past it ÷ items that moved past it).

The preview shows each step's sample size and any statuses nothing claims. **Use as the current state** writes the numbers into the map: steps with the same name are updated, new steps added, and optionally the old steps replaced. `POST /v1/value-streams/maps/:id/derive` with `{source: "csv"|"jira"|"ado", csv?, query?, limit?, mapping?, stat?, since?, until?, apply?, replace?}`.

## Canvases

SAFe's working artifacts as structured, editable canvases, laid out like the originals: **Portfolio canvas** (value propositions per value stream, key partners, activities, resources, cost structure, revenue streams; current and future state), **SWOT**, **TOWS**, **Portfolio vision**, **LACE mission statement**, **Epic hypothesis statement** and **Lean business case** (with WSJF), **Development value stream canvas** and **ART canvas** (prefilled from a value stream identification), **ART launch timeline with PI planning readiness**, **Feature canvas** (benefit hypothesis, acceptance criteria, WSJF) and **Enabler canvas** (architectural runway).

- **SWOT → TOWS → future state.** A SWOT pairs its internal and external factors into SO, ST, WO and WT strategy suggestions; pick the worthwhile ones into a TOWS canvas, rewrite them, then generate the future-state portfolio canvas (the current one with these strategies as planned changes) and a draft portfolio vision.
- **PI planning readiness.** The launch timeline lays out weekly lanes (content, cadence, teams, leadership) up to the date-certain quick-start; the readiness checklist is scored against it: share done, weeks to go, open items per lane, and on track or at risk given how far along the launch is.

API: `GET/POST /v1/canvases`, `GET/PUT/DELETE /v1/canvases/:id`, `POST /v1/canvases/from-identification`, `GET /v1/canvases/:id/tows-suggestions`, `POST /v1/canvases/future-state`.

## Classes

Five class boards for trainers, under **Templates → Classes**: Leading SAFe (2 days), SPC (4 days), Advanced SPC (3 days), POPM (2 days) and RTE (3 days). Each opens with a "Start here" strip (Trainyard intro, quick agenda, remote working agreements, team and challenge, parking lot, daily structure) and then one frame per lesson holding that lesson's exercises. Exercises are authored in a small vocabulary in `packages/core/src/classes.ts` (slide, stickies, zones, table, canvas, link, PI planning simulation) and rendered into frames and cards, so a class is a few lines to write and edits like any board.

Shared material is shared: SPC's first lessons are Leading SAFe's (with four simulation teams instead of three); the PI planning simulation plans the autonomous delivery vehicle backlog (31 stories across three features) on an ART board plus team boards, with coach-sync questions, ROAM and the confidence vote; the ART readiness checklist (Y/D/N) sits in SPC lesson 10 and RTE lesson 3 and links to the live ART launch canvas; the design-sprint learning lab and the CARS case studies are in Advanced SPC. The POPM board carries the common POPM exercises until its own Miro export is imported.

**Miro imports.** Miro's "Export board as CSV" lists every widget's text in reading order without positions (the `.rtb` backup holds positions but is encrypted by Miro). `POST /v1/imports/miro-csv` rebuilds it as one frame per block, with tables as grids of cards, so a class board arrives as its lessons and exercises, ready to tidy. **Bring your own boards → Miro board CSV.**

Class boards and Miro imports need a signed-up trainer (`403 SIGNUP_REQUIRED` for anonymous or open-mode access); the planning boards stay open.


**Running a class.** A class board opens with a Welcome area (how to work on the board, the agenda and the day's logistics, an icebreaker, the team and its challenge, working agreements, parking lot) and a tab per lesson: the lesson alone on the canvas, fitted, with full screen and zoom (buttons, Fit, Ctrl+wheel, pinch). The trainer renames the class, wipes it (back to how it starts, or empty), saves it as their own class template keeping every card, or deletes it. **Students** are added by name and email; each gets a personal link (`/join/…`) that opens that one class board with no account, emailed when mail is configured, otherwise copied; a link reads the board and adds, edits and moves cards, nothing else, and can be replaced or removed (`GET/POST /v1/boards/:id/students`, `POST …/students/:sid/link`, `DELETE …/students/:sid`, `POST /v1/boards/:id/reset`). **Your own course deck**: a trainer uploads the .pptx they are licensed to teach from (`POST /v1/imports/class-deck`) and it becomes a class template in their workspace only, one tab per lesson by slide title; licensed courseware is never part of this repository or the built-in classes. **Activities**: any frame in a lesson can be an activity with a kind (Activity, Discussion…), prepare and share minutes, its steps, and material shown beside it: a web page, a picture, text, or an answer key only the trainer sees. A strip under the lesson tabs opens each one with its steps on the side. Mapping activities carry connection types: learners pick a type and drag from a card or marker to another, or onto a spot of a locked picture (such as a framework diagram) where a named marker appears; each type shows its count and a tick once drawn. The trainer starts one timer for the class (prepare, then share; pause, +1 minute, stop) and every learner sees it; the board refreshes when someone else changes it. Trainers set activities up in place (select a frame → *Set up as an activity*) or bring a set into a lesson from a JSON file they hold (`POST /v1/boards/:id/activities`, `PATCH …/frames/:id` with `activity`, `GET/PUT /v1/boards/:id/timer`), so licensed exercise wording stays in their workspace. **The RTE class** is built chapter by chapter from the course (`packages/core/src/courses/rte.ts`, pictures in `apps/web/public/courses/rte/`): the Welcome area holds the icebreaker, then each chapter's exercises with their timings, steps and references, including mapping the RTE's connections on the Big Picture, a more/less pre-planning quadrant (double-click a spot to add a sticky) and the ART readiness checklist answered Y, N or D on each card. That course content is © Scaled Agile, Inc., used under a partner agreement and not covered by the Apache-2.0 licence (see `packages/core/src/courses/NOTICE.md`). **Your own course**: under Classes → Your course decks, a trainer imports a course file (.json: `{ "name", "lessons": [{ "title", "activities": [...] }] }`, `POST /v1/imports/class-pack`) and gets a private class template with the Welcome area and a tab per lesson ("01 …", "02 …") holding exactly those exercises. Every lesson shows a sub-tab per exercise; the trainer marks each one complete (`PATCH …/frames/:id` with `done`), and a lesson shows a tick once all its exercises are.
## PI Outcome Planning

AI-Native SAFe replaced two-day PI Planning with a one-day **PI Outcome Planning** event, and **PI Outcome Planning** in the app is that event's set of artifacts for one ART and one PI:

- **The outcome tree** as SAFe's flip-chart pads: ART outcomes (the year, with the state so far), the PI outcomes that advance them, and each team's outcomes that contribute to a PI outcome or stand as the team's own commitments. Every outcome carries key results; a target changed during the event keeps its draft value, so cuts show red and raises green on the final sheets, the way SAFe draws them.
- **The PI Outcome Planning Board**: PI outcomes × iterations plus "Next PI", team outcomes per row, an ART milestones row for fixed-date milestones, and learning, synchronization and release milestones on the outcome rows. Drag a milestone between iterations and rows (into the ART row to fix its date), click it to edit, press + in a cell to add one there.
- **Team Outcome Planning Boards**: a team's outcomes × iterations with the experiments, prototypes, enablers and features it expects to need and the milestones it owns; the busiest iteration is flagged, where capacity clashes hide. Cards drag between iterations and outcome rows; a card ticked "Show on the PI Outcome Planning Board" also appears on the ART-level board under its PI outcome.
- **Strings**: any two cards on any of the boards can be strung together (depends on, or related); the string is drawn on every board that shows both ends.
- **The Management Review Board**: decisions needed and risks on the top, confirmed decisions and actions underneath, each answering the item it resolves.
- **The agenda** (3.5 hours each half, outcome and team breakouts, the draft presentation, lunch and management review, planning adjustments, final plan review) and the **fist-of-five confidence vote** per team, with concerns for anyone voting 1 or 2.

The worked example is SAFe's Retail Pharmacy ART planning its second PI, including the Cart Team's capacity clash and the deferral of the diet-swap pilot. API: `GET/POST /v1/outcome-planning`, `GET/PUT/DELETE /v1/outcome-planning/:id` (references checked on save), `POST /v1/outcome-planning/:id/votes`.

## AI-Native ART

The PI Outcome Planning page carries the rest of the AI-Native ART, built to the change delta from classic SAFe:

- **Outcome spine.** Portfolio → ART → PI → team outcomes as OKRs, each tagged moonshot or roofshot with status, owner and approver; wording that reads like a mechanism is flagged (a soft warning), and so is a key-result set outside two to five.
- **Outputs and the pipeline.** Experiments and prototypes (learning) and features and enablers (value) move Discover → Specify → Build → Validate → Release, learning items concluding at Validate (A/B tests may release). Gates: an outcome link to leave Discover (and a hypothesis for learning items); a metric, a specification and a clean intent to leave Specify; a named verification owner to enter Validate; evidence to release, the uncertainty reduced to conclude. **Discard** is one reason from any stage, and the button sits next to Advance. Prioritisation is pluggable: WSJF for value items, information gain per unit cost for learning items.
- **Intent, specifications, context.** Versioned records with dependency links. Editing an intent creates a new version, marks every specification and context under it for review, holds their outputs at Specify, and logs the propagation into insights and evidence; reviews are cleared one record at a time.
- **Curated data register.** Assets that power development or power products, scored 0–5 on complete, accurate, securely accessed and maintained (with sub-qualities), visible wherever an output depends on them.
- **Team capabilities.** Product, builder, domain expert and AI as capabilities people carry, the AI Value Architect as an assignment; uncovered capabilities and sizes outside 3–7 are flagged.
- **Sense and Respond.** Two hours every iteration, with the agenda pulled from data: key-result deltas, what shipped and the customer demos, discard candidates (no metric, or no movement after N iterations), the review queue, AI cost variance and workflow friction by impact; decisions recorded per event.
- **Assessment and launch plan.** The twelve success factors under the four shifts, rated individually in writing before discussion, splits detected by spread and kept as both positions, gaps sequenced before the first PI Outcome Planning, before the first Sense and Respond, or later, in a versioned launch plan.
- **Views.** Exploration funnel with the discard rate, AI operating cost (fixed and variable, limit, variance attributed to workflow), verification capacity (queue depth, days in review, approver load), and the customer demo planner (purpose × reach, sixteen formats).

API under `/v1/outcome-planning/:id/art`: GET/PUT the record (references checked), `outputs/:id/advance` and `outputs/:id/discard`, `outputs/:id/priority`, `intents/:id/edit`, `reviews/:id/clear`, `sense-respond/:iteration`. Items the framework has not confirmed (Scrum Master removal, the two other Sense and Respond purposes, the sub-quality mapping, the learning prioritisation rule, the 2–5 key-result range) are warnings or defaults, never hard blocks.

## Inside Jira and Azure DevOps

The same server can run inside the trackers. Both plugins are thin: they read the context (site, organization, project) and open `/embed/<page>?source=…&project=…` in a frame, which serves the normal pages with a compact header instead of the side navigation. Navigating inside the frame stays embedded. Only `/embed/*` and documents loaded into a frame accept framing, and only from `TRAINYARD_FRAME_ANCESTORS` (by default Atlassian and Azure DevOps hosts; set your own sites in production). Every other page still sends `X-Frame-Options: DENY` and `frame-ancestors 'none'`. People sign in once inside the frame with their Trainyard key.

**Jira (Atlassian Forge, Custom UI)** in `integrations/jira-forge`: a project page (opens the program board for the project) and a global page (dashboards).

```bash
cd integrations/jira-forge
npm ci
npm install -g @forge/cli && forge login
forge register                      # writes your app id into manifest.yml
# self-hosted? set the frames address in manifest.yml and build with TRAINYARD_URL=https://your-host
npm run build && forge deploy
forge install                       # pick your site and Jira
```

**Azure DevOps** in `integrations/azure-devops`: a **Trainyard** hub under Boards.

```bash
cd integrations/azure-devops
npm ci
TRAINYARD_URL=https://trainyard.app npm run package    # out/agileagilist.trainyard-0.1.0.vsix
# Change "publisher" in vss-extension.json to your Marketplace publisher, then:
npx tfx extension publish --vsix out/*.vsix --share-with <your-organization> --token <PAT with Marketplace publish>
```

CI builds both on every push and keeps the VSIX and the Forge bundle as the `trainyard-plugins` artifact.

## Website, pricing and sign-up

The public page at `/` is the "Session" design: a speech-bubble hero with a trainer/enterprise toggle, three rooms (planning, workshop, measuring), the kit, the comparison table, pricing, a chat-style FAQ and the sign-up. Copy describes what the app does today. Plans, the comparison and the FAQ live in `apps/web/lib/pricing.ts`, so the page, the structured data and `llms.txt` agree; the reasoning behind the prices is in `docs/pricing.md`.

**Plans.** Practice (free: self-host everything, or one hosted room of up to 5 people, paid from the sixth), Trainer ($19 per trainer per month, $16 billed yearly, unlimited participants), Academy ($249 per Agile Release Train per month, $199 billed yearly, unlimited people per train, the Jira app and Azure DevOps extension, SSO). Participants are never the price unit.

**Sign-up.** `POST /v1/signups` (public, 10 a minute per address, honeypot field, disposable domains refused) stores the request, audits it and forwards it to `TRAINYARD_SIGNUP_WEBHOOK` if set. Admins see the list under **Users**, create the user, send the key and mark the sign-up invited (`PATCH /v1/signups/:id`). A sign-up is a request, not an account: the server has one workspace, so a person hands out access.

**Workspaces.** Every customer gets a workspace of their own: boards, canvases, model, people and audit log isolated from every other customer's, opened lazily from the same persistence (one JSON document per workspace). The platform workspace is the operator's own, and also holds what spans workspaces: users (each tagged with their workspace), sign-ups, purchases and the workspace registry. A request runs in the workspace its key belongs to; a platform admin (an admin of the platform workspace, or the bootstrap key) may enter any workspace as support by sending `x-trainyard-workspace: <id>`, which the web app does from the **Support console** (`/admin`): list every workspace with plan, seats, usage, subscription and last activity; open it as support (a banner shows, every change lands in the customer's audit log under the support person's name, the visit is noted on the workspace); change plan, seats or a note by hand (`PATCH /v1/admin/workspaces/:id`); freeze or thaw it; issue the owner a new key; export it as JSON. Owners export their own workspace at `GET /v1/workspace/export`.

**Plans and limits.** A Practice sign-up creates its workspace and shows the key at once: one board of its own, up to 5 people (and one train). Trainer counts trainers (people above viewer) against the seats paid; participants and boards are unlimited. Academy counts trains against the seats; people are unlimited. Limits are checked where they are felt (adding a person, creating or importing a board) and answer `402 PLAN_LIMIT` with what to do; the refused change is dropped before anything is saved. **Plan & billing** (`/billing`) shows usage against the plan, upgrades from Practice in page (`POST /v1/billing/subscribe` without a sign-up id: the signed-in owner pays, the login stays the same), adds trainers or trains to a running subscription pro rata (`POST /v1/billing/seats`), opens Stripe's portal and exports the workspace. A cancelled or unpaid subscription freezes the workspace (`423 WORKSPACE_FROZEN` on writes, reads and export still work, a banner says why) until it is paid again or support thaws it.

**Envision the future state** (`/portfolio/vision`, SAFe's portfolio vision workshop). The current-state portfolio canvas, a SWOT and a TOWS go in; `POST /v1/canvases/options` drafts four candidate future states (divergent thinking: offensive SO+WO, defensive ST+WT, fix-first WO+WT, balanced), each an editable future-state portfolio canvas. `PATCH /v1/canvases/:id/option` scores an option 1–5 on five weighted criteria (strategic fit, value, feasibility, cost, risk; the last two inverted) and `POST /v1/canvases/:id/select` makes one the future state and drafts the portfolio vision from its changes (convergent thinking). `GET /v1/canvases/:id/epic-drafts` turns each new planned change into an epic or an enabler (capability-building changes become enablers) with a benefit hypothesis, and `POST /v1/canvases/:id/epics` creates them in the Portfolio Kanban funnel, tagged with their kind and source canvas.

**Payment.** Trainer and Academy are Stripe subscriptions paid without leaving the website. Every paid subscription starts with a free trial (`STRIPE_TRIAL_DAYS`, 14 by default; one per customer) and is billed month by month; `POST /v1/billing/interval` switches to yearly once the first month is paid. The first paid month carries a money-back guarantee: `POST /v1/billing/refund`, within 30 days of the first charge, refunds that charge through Stripe, ends the subscription and moves the workspace to Practice with everything kept. With `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` set, the sign-up card turns into a payment step: `POST /v1/billing/subscribe` creates a Stripe Customer and a Subscription that stays incomplete until its first invoice is paid (one line item per seat, yearly or monthly, optional trial) and returns the client secret; Stripe's Payment Element, rendered inside our page, confirms it (3-D Secure included). `POST /v1/billing/claim` then creates the user as a planner (or rotates the key of an existing user with that email), marks the sign-up invited and returns the key once, asking Stripe for the subscription's status directly so it never waits on webhook delivery. Stripe's webhook (`POST /v1/webhooks/stripe`, signature over the raw body, 5-minute tolerance, idempotent) keeps the subscription in step afterwards: `invoice.paid` records renewals, `invoice.payment_failed` marks it past due, `customer.subscription.updated` recovers it, `customer.subscription.deleted` cancels it and disables the user's key. Subscribers manage card, invoices and cancellation through `POST /v1/billing/portal` (Stripe's customer portal, back to Users afterwards); admins list everything at `GET /v1/billing/purchases` and under Users → Subscription. Without the publishable key the website falls back to hosted Stripe Checkout (`POST /v1/billing/checkout`, `/welcome?session_id=…`). `infra/scripts/stripe-setup.sh https://api.<domain>` (with `STRIPE_SECRET_KEY` in the environment) creates the products, the four prices and the webhook endpoint and prints the `.env` lines. No Stripe SDK on the server: the API uses Stripe's REST endpoints directly; the browser loads Stripe.js from js.stripe.com, which the CSP allows. Sign-up, the billing routes and the tracker webhooks stay reachable without a key once the workspace is closed; everything else needs one.

## Search engines and AI assistants

The public pages (home, pricing, the OKRs and KPIs example, comparisons, classes, guides) are server-rendered with titles, descriptions, canonical URLs, Open Graph and JSON-LD (Organization, WebSite, SoftwareApplication, Product with offers, FAQPage, TechArticle, BreadcrumbList). `robots.txt` admits search and AI crawlers by name (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, Bingbot and others) to the public pages and keeps the app out. `/llms.txt` and `/llms-full.txt` are generated from the same data as the pages, so they never go stale. The sitemap carries each page's last substantive change. Every deploy submits the sitemap's URLs to IndexNow (Bing, which feeds ChatGPT search and Copilot, plus Yandex, Seznam and Naver). Search Console and Bing Webmaster Tools ownership tokens go in `TRAINYARD_GOOGLE_VERIFICATION` and `TRAINYARD_BING_VERIFICATION` on the server.

## Workspace: Rooms, OKRs, Classes, Templates, Plan

**Rooms** organise boards by purpose (an ART room, the OKR room, the portfolio room, a class cohort, a team) and decide who may enter: open to the workspace at a default access, or private to the people added plus admins. Boards inherit their room's access, the workspace role is the ceiling (a viewer only looks), rooms connect to each other both ways, and each kind starts with the app views it needs pinned. Plans cap rooms (Practice 1, Trainer 5 per trainer, Academy unlimited, Insights 2) and private rooms are paid. The model, access table and licensing options are in `docs/rooms.md`. API: `GET/POST /v1/rooms`, `GET/PATCH/DELETE /v1/rooms/:id`, `PUT /v1/rooms/:id/members`, `PUT /v1/rooms/:id/links/:other`, `PUT /v1/boards/:id/room`; `POST /v1/boards/blank` and template create take a `roomId`.

The signed-in app's other spaces, each with its own sub-views and theme: **OKRs** (Dashboard, Alignment, Check-in, and the sources, measures and funding behind them), **Classes** (class boards, breakout tables of four, a day plan of 180-minute half-days), **Templates** (the gallery, your boards, bring your own) and **Plan**, grouped in the order an ART lives through it: Strategy (portfolio, value streams), Launch & readiness (readiness with the WSJF-ranked ART backlog and risks with ROAM, and the canvases), PI planning (PI planning board, Coach Sync, PI Outcome Planning), Measure (delivery dashboards); setup lives in the account menu. Choosing a method in the template gallery re-themes the page in that method's language (Train for SAFe, Sprint, Flow for Kanban, Obeya for Lean, Lab, Factory, Plain); themes are tokens in `apps/web/lib/themes.ts` that also re-point the existing pages' CSS variables. Lane boards (`components/lane-board.tsx`) drag cards between lanes with the rules in `packages/core/src/lanes.ts` (soft capacity, WIP limits, hard seats, a human gate), plus notes, ink, timeboxes, list view, zoom, smart-board mode and copy as Markdown. Value stream identification has a **Full breakdown** of all five levels at once: a Sankey carrying people from operational steps through solutions, people and development value streams to ARTs (click a box to trace it through the solutions it touches), coverage per level, and a step × train matrix showing which steps one train owns and which need several to coordinate (`identificationBreakdown`, `breakdownTrace` in core). **Help and support**: press ? on any page (or the ? in the top bar) for how to use that page; the help centre at `/help` lists every page, searchable; the public `/support` page gives the support channels by plan (email from `TRAINYARD_SUPPORT_EMAIL`, default support@trainyard.app), GitHub issues, security reports and the same page-by-page guide. The text lives once in `apps/web/lib/help.ts`. **Blank whiteboards** start empty (`POST /v1/boards/blank`) and any template, built-in, class or your own, can be added onto any board beside what is already there (`POST /v1/boards/:id/insert-template`), so one board can hold a PI planning board, a retrospective and a fishbone. Features carry a WSJF score (`PATCH /v1/items/:id` with `wsjf`), scored inline on the readiness page; an unranked backlog fails the readiness check. API: `GET /v1/okrs`, `PUT /v1/okrs/check-in`, `PUT /v1/okrs/align`, `GET/PUT /v1/lane-boards/:key`.

The public site has a page per module: `/classes`, `/methods` (templates) and `/insights` (OKRs), with a shared nav whose Modules and Integrations menus open on hover or click.

## The tools inside the classes

The chapters that teach something Trainyard runs are built from the same definitions the tools use, not copies and not links: Leading SAFe and SPC lesson 4 (PI planning: the capacity rule, the Coach Sync checkpoints, team and ART PI objectives), SPC lesson 9 (value streams: the operational value stream types and template, the workshop steps, the ART topologies), SPC lesson 10 and RTE lesson 3 (PI planning readiness: `PI_PLANNING_READINESS`, the list the ART launch canvas scores), SPC lesson 11 and RTE lesson 6 (Inspect & Adapt: `INSPECT_AND_ADAPT`, which also builds the I&A board template), POPM lesson 2 (readiness plus the feature and enabler canvases and the WSJF table from the canvas's own cost-of-delay parts), POPM lesson 3 (PI planning) and lesson 5 (Inspect & Adapt), and Advanced SPC lesson 2 (the AI-Native success factors as a 1–5 assessment), lesson 4 (LACE mission, SWOT, TOWS and portfolio vision canvases), lesson 5 (Portfolio Kanban states from `EPIC_STATES`, epic hypothesis, Lean business case, WSJF) and lesson 6 (every operating model in `frameworks.ts`, to keep, adapt or drop). Built-in class boards are regenerated from these on every start, so a change to a tool's definition changes the class. The chapter mapping is `CLASS_TOOL_CHAPTERS` in `packages/core/src/classes.ts`.

## Signing in

People sign in with **email and password** (`POST /v1/auth/login` returns a thirty-day session token; `POST /v1/auth/logout` ends it). The password is chosen at sign-up on the website, set by the person under Users (`POST /v1/auth/password`, the current one required when signed in by password) or set and reset by an admin (`POST /v1/users/:id/password`, which ends that person's sessions). Passwords are stored as scrypt hashes. With mail configured, a new address is confirmed with a six-digit emailed code before any workspace is created or any plan paid for (`POST /v1/signups/:id/verify`, `/resend`; `TRAINYARD_EMAIL_VERIFICATION=required|off` overrides the default). `GET /v1/auth/providers` lists the sign-in methods; single sign-on (OIDC, SAML) plugs in through `apps/api/src/identity.ts`, linking to users by the provider's subject id. Every user also has an **API key** for scripts and integrations, issued once at creation and rotatable; the bootstrap admin key (`TRAINYARD_ADMIN_KEY`) opens the platform without a user record, so to sign in with a password the operator creates their own admin user and sets one.

## Outcome dashboard: outcomes, KPIs and funding across systems

Delivery data lives in Jira; the evidence that the work changed anything lives elsewhere. The **Outcome dashboard** (`/outcomes`) takes extracts from any system that can export a table (CRM, finance, the learning platform, survey vendors, Jira) as **sources** with a period column; defines **measures** over them, alone (sum, average, count or latest of a column per month, optionally filtered) or combined across sources (one measure divided by or minus another: cost per completion is finance over the learning platform); groups them under each **entity's objectives** as outcomes (the change sought) and KPIs (ongoing health), each with a target, a direction and a rationale for why it is evidence; tracks **initiatives and their funding** (committed, funders, spend to date from a finance measure over the initiative's dates or typed in, burn against time elapsed, and the outcome measures that show what the money bought, with cost per outcome); and rolls it up into the **one-pager** for an entity and everything beneath it, printable for an executive team or a board. Two example customers come built in: an education programme (free modules for clinicians in low- and middle-income countries) with a young-investigator grant programme, and Northstar Bank, the SAFe training example of digital payments traced from the portfolio through the development value stream to two ARTs, whose figures match the published executive dashboard; "Start empty" clears either for real extracts. The dashboard is sold on its own as the **Insights** plan (per pack of ten data sources, unlimited viewers, up to five editors); Practice includes two sources, Trainer three, Academy unlimited. Every workspace's sources, measures, objectives and initiatives are its own. API: `GET /v1/insights`, `GET /v1/insights/one-pager/:entityId`, `POST /v1/insights/sources` (CSV or rows), `PUT/DELETE /v1/insights/{measures,objectives,initiatives,entities}/:id`, `POST /v1/insights/reset`. A live connection to a CRM or warehouse feeds the same source endpoint on a schedule.

## PI planning board, capacity, Coach Sync and ART objectives

The **PI planning board** (`/board`) is the living program board: milestones and events on top, features by team and iteration with dependency strings, risks to ROAM below. Each team's name opens its **capacity**: typed in, calculated from members (SAFe's quick-start: 8 points per full-time contributor per iteration, allocation applied, one point off per day of leave, Scrum Master and Product Owner excluded) or taken from velocity (the mean of the last three iterations' finished points). Members, allocation, days off and people can be edited there; the board's load meters read the result. API: `GET/PATCH /v1/teams/:id/capacity`.

**Coach Sync** (`/board/coach-sync`) is the Scrum of Scrums during PI planning: six checkpoints across the two days (1:00 Getting started, 2:00 Iteration planning progress, 3:00 Team objectives progress, 3:45 Draft plan readiness; 10:30 Progress check-in, 11:30 Final plan readiness), four questions each, answered per team on a question × team grid with notes. API: `GET /v1/coach-sync`, `PUT /v1/coach-sync/answer`, `PUT /v1/coach-sync/note`.

**ART PI objectives** are written from the team objectives: the assistant drafts them when a provider is configured (`POST /v1/assist/art-objectives`), and a rule-based synthesis clusters team objectives that share a theme without one (`POST /v1/objectives/synthesise`). Each ART objective keeps the trace to its team objectives, carries the highest business value among them and is uncommitted when any of them is. `POST /v1/objectives` takes `level: "art"` with `sourceObjectiveIds`.

**Trial emails**: every trial is confirmed by email when it starts (nothing charged today, the first charge's amount and date, how to cancel) and announced again 7 days before the first charge, as card networks ask. An hourly job sends what is due, once per purchase; set `TRAINYARD_SMTP_URL` and `TRAINYARD_MAIL_FROM` for mail to leave the server (without them the API logs that nothing was sent and retries later). The trial length is `STRIPE_TRIAL_DAYS` (30 by default; the deploy takes it from the repository variable of the same name).

Canvases carry an as-of date (a target date for a future state), editable in the header.

## Still to do

- Test the connectors against a real Jira and Azure DevOps account (only recorded responses so far)
- SSO (OIDC/SAML): today users sign in with an API key
- Multiple workspaces per server
- GitHub Issues connector
- Self-serve sign-up: create the workspace and send the key automatically (needs multiple workspaces per server and outbound email)
- Publish the Jira app to the Atlassian Marketplace and the extension to the Visual Studio Marketplace (today: private install)
- Pass the tracker project from the plugins into a filtered board (today it is shown, not applied)
- Solution-level pre-PI planning (to be designed with the user)
- Live cursors and multi-user editing on the canvas (today edits are per request; reload shows other people's changes)
- Jira Data Center and Azure DevOps Server have adapters by configuration (`host`, `baseUrl`) but no tests against them

SAFe® and Scaled Agile Framework® are registered trademarks of Scaled Agile, Inc. Other framework names belong to their owners. Templates are summaries for configuration, not copies of framework materials. The EU AI Act gate policy is a starting point for a governance board, not legal advice.
