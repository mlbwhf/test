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

## Still to do

- Test the connectors against a real Jira and Azure DevOps account (only recorded responses so far)
- SSO (OIDC/SAML): today users sign in with an API key
- Multiple workspaces per server
- GitHub Issues connector
- Jira Data Center and Azure DevOps Server have adapters by configuration (`host`, `baseUrl`) but no tests against them

SAFe® and Scaled Agile Framework® are registered trademarks of Scaled Agile, Inc. Other framework names belong to their owners. Templates are summaries for configuration, not copies of framework materials. The EU AI Act gate policy is a starting point for a governance board, not legal advice.
