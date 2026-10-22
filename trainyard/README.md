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
| `packages/importers` | `@trainyard/importers` | **Bring your own boards**: Miro (REST v2), Mural (public API), monday.com (GraphQL), Trello (REST), plus CSV and a documented JSON format for anything else. Each pulls a board as it is into a `Board` (frames, cards with text/colour/position, connectors, columns, groups, rows; unknown fields kept verbatim) | 11 offline tests with recorded responses |
| `packages/connectors` | `@trainyard/connectors` | Jira Cloud adapter (enhanced JQL search with `nextPageToken`, field updates, sprint moves, Blocks links) and Azure DevOps adapter (WIQL, `workitemsbatch` in batches of 200, JSON Patch updates, Successor links). Retries on 429/5xx with `Retry-After`. **Two-way sync planner**: remote changes flow in, local plan changes flow out, a field changed on both sides becomes a conflict | 9 offline tests with a recorded fake `fetch` |
| `packages/db` | `@trainyard/db` | Persistence port with optimistic versioning (a stale save is refused, never merged silently) and an append-only audit log. Three stores: memory, JSON files (single box) and **Postgres** (migrations, advisory-locked; the audit table rejects update and delete) | 9 tests; Postgres ones run when `DATABASE_URL` is set |
| `apps/api` | `@trainyard/api` | Fastify 5 REST API with zod validation and OpenAPI at `/docs`. **Users, roles and API keys** (admin, planner, architect, viewer; keys hashed, shown once; open mode until the first user exists). Every mutation is committed and audited. Model, board, items, dependencies, risks, objectives, metrics, dashboards, portfolio, AI initiatives, agents, assist routes, tracker sync on request, **on a schedule or from a Jira/ADO webhook** | 24 tests via `inject` |
| `apps/web` | `@trainyard/web` | Next.js 16 app: dashboard builder with narrative, drag-and-drop program board with objective drafting, ROAM suggestions and readiness briefing, portfolio page (budgets, WSJF, guardrails, OKRs), AI portfolio lifecycle and gate pages with governance review, agent registry, operating model editor, tracker connections, users and audit log, sign-in | typecheck, production build, browser run-through |
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

One canonical web host and one API host, plus optional aliases, all in `.env`: `TRAINYARD_WEB_HOST` (e.g. `agileagilist.com`), `TRAINYARD_API_HOST` (`api.agileagilist.com`), `TRAINYARD_WEB_ALT` and `TRAINYARD_WEB_ALT2` (`www.agileagilist.com`, `plan.agile-agilist.com`), `TRAINYARD_API_ALT` (`plan-api.agile-agilist.com`). Web aliases get their own certificate and a permanent redirect to the canonical host, so search engines index one site; the API alias answers directly because a redirect would break browsers' CORS preflight. Every host needs an A record to the VPS. The smoke test checks the canonical hosts and that each alias redirects.

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
| `TRAINYARD_FRAME_ANCESTORS` | Web app: hosts allowed to frame `/embed/*` for the Jira app and Azure DevOps extension. Empty means the Atlassian and Azure DevOps defaults; `none` turns embedding off |
| `TRAINYARD_ENV=production` | Refuses memory persistence and open mode |

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

Under **Bring your own boards**, connect Miro, Mural, monday.com or Trello with a token (stored encrypted under `TRAINYARD_SECRET`), browse and import boards, or upload a CSV from any tool with a header row, or post the JSON format below. Imports are kept exactly as they came and drawn at their original positions and colours (or as the original table with its groups). Any board can be saved as a template and new boards created from it. "Map onto the plan" previews, then on Apply creates work items, risks, dependencies and teams from cards or rows: team from the frame/group/column, iteration by name, estimate and status columns, colour rules for risks and enablers, connectors as dependencies. Nothing is written until Apply.

Plan limits to know: Miro's REST API needs a Developer team app (free). Mural's API needs a registered app and an OAuth token. monday.com personal tokens work on every plan within its complexity limits. Trello needs an API key and token from a Power-Up admin page. All four have been tested against recorded responses only; the first live import may surface a field we map differently.

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

**Templates** lists nineteen built-in boards, each sized to the workspace's teams and iterations when it is created: PI Planning board, Team breakout (capacity and load, stories and features per iteration, IP iteration, PI objectives with BV/AV, risks, features backlog, planning poker), ROAM risk board, Program board, Confidence vote, Retrospective, Team Kanban, Inspect & Adapt, Epic / Lean business case, OKR tree, Dependency map, Obeya wall, User story map, Value stream and ART identification, Portfolio Kanban, ART Kanban, Portfolio roadmap per ART, Portfolio ART planning board and Solutions by investment horizon. Boards you imported and saved as templates sit beside them. Filter by SAFe, Team, Portfolio, Risk, Flow / Kanban or Lean / Obeya, read what each one is used for and how it maps onto the plan, name the board and create it. Built-in templates are read only; the boards made from them are yours.

Every board opens in the canvas editor: drag cards (they re-home to the frame they land in, so a risk dragged from Inbox to Resolved is resolved), drag whole frames with their cards, add cards, double-click to write, recolour, connect two cards with the Connect tool, delete connectors, zoom. Each change is one API call (`/v1/boards/:id/nodes`, `/edges`, `/frames`) so the same editor works for imported boards, and "Map onto the plan" sees the edits.

The look follows the "Trainyard Glass" design: a lit backdrop with frosted rail, panels and cards (three blur strengths), the amber signal colour for the one thing that matters on a screen, Bricolage Grotesque for display type, Instrument Sans for text and IBM Plex Mono for numbers, with a dark scheme that follows the system. The design artboards are at https://claude.ai/artifact/M8AL14GSFFZX7uoCFtwTmq.

## Security, SEO and the model

**Security.** API keys hashed at rest with constant-time comparison and roles; a ten-minute lockout after twenty bad keys from one address; rate limits (600 requests a minute per key or address, 30 on AI routes) and an 8 MB body cap; a Content Security Policy with a per-request nonce and `strict-dynamic` on the web app and `default-src 'none'` on the API; HSTS, frame denial, nosniff, a restrictive Permissions-Policy; connection tokens sealed with AES-256-GCM; containers without capabilities, non-root, read-only where possible, Postgres on a private network; CI fails on high or critical advisories in production dependencies and Dependabot opens weekly updates. The full list, what the host must do, and how to report a problem are in [SECURITY.md](SECURITY.md).

**SEO.** The root `/` is a public, server-rendered landing page with a canonical URL, Open Graph and Twitter cards (`/og.png`), `SoftwareApplication` and `FAQPage` structured data, `/robots.txt` and `/sitemap.xml`, and `/llms.txt` for answer engines. Every application route is `noindex` and disallowed for crawlers. The site URL comes from `TRAINYARD_PUBLIC_WEB_URL`, so one image serves any domain.

**The model.** Pick one in `.env`: `ANTHROPIC_API_KEY` for Claude (recommended; `TRAINYARD_AI_MODEL` defaults to `claude-opus-5-5`), `TRAINYARD_LLM_URL` for any OpenAI-compatible server (hosted or `LLM_PROFILE=llm` for Ollama on the VPS). With a provider set, every page's AI buttons light up: PI objective drafts, ROAM suggestions, readiness briefing, dashboard narrative, gate reviews, and **Review this board** on any canvas, which groups cards into themes, names risks and missing connections and proposes questions for the room. Card text is sent as data with an instruction never to follow what it says; answers are schema-validated and nothing is written until someone accepts.

## Value streams

**Value streams** has two views, because SAFe uses value streams in two ways.

- **Identification** is the workshop. Start from the operational value stream (trigger, the customer's and staff's steps, the value at the end), add the systems behind each step, the people who build and run them and where they sit, group them into development value streams, then cut trains. Click a step to see which systems, people and trains a change to it touches, and whether one train can change it alone. Each train is checked against 50 to 125 people, and the facilitator's flags list steps without a system, systems no one builds or owns, and trains outside the band. Everything is editable and saved.
- **Mapping** is the measurement. Each step carries its active time, the wait in front of it and its percent complete and accurate, for a current and a future state. The totals are SAFe's: total active time, total wait time, flow efficiency (process time over lead time) and total %C&A (the product of every step's), plus the longest queue to attack first and a to-scale lead-time ladder. The starting map is SAFe's feature-to-production example and reproduces its published figures: 98 hours active, 1,796 hours waiting, 5% flow efficiency, 35% complete and accurate.

API: `GET /v1/value-streams`, `PUT /v1/value-streams/identifications/:id`, `PUT /v1/value-streams/maps/:id`, `DELETE /v1/value-streams/:kind/:id`, and `GET /v1/value-streams/identifications/:id/steps/:stepId` for a step's impact. References inside a workshop are checked on save.

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
TRAINYARD_URL=https://agileagilist.com npm run package    # out/agileagilist.trainyard-0.1.0.vsix
# Change "publisher" in vss-extension.json to your Marketplace publisher, then:
npx tfx extension publish --vsix out/*.vsix --share-with <your-organization> --token <PAT with Marketplace publish>
```

CI builds both on every push and keeps the VSIX and the Forge bundle as the `trainyard-plugins` artifact.

## Still to do

- Test the connectors against a real Jira and Azure DevOps account (only recorded responses so far)
- SSO (OIDC/SAML): today users sign in with an API key
- Multiple workspaces per server
- GitHub Issues connector
- Publish the Jira app to the Atlassian Marketplace and the extension to the Visual Studio Marketplace (today: private install)
- Pass the tracker project from the plugins into a filtered board (today it is shown, not applied)
- A PI objectives screen with business value plan and actual (designed on the Claude Design canvas)
- Live cursors and multi-user editing on the canvas (today edits are per request; reload shows other people's changes)
- Jira Data Center and Azure DevOps Server have adapters by configuration (`host`, `baseUrl`) but no tests against them

SAFe® and Scaled Agile Framework® are registered trademarks of Scaled Agile, Inc. Other framework names belong to their owners. Templates are summaries for configuration, not copies of framework materials. The EU AI Act gate policy is a starting point for a governance board, not legal advice.
