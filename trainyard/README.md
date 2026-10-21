# Trainyard

Scaled agile planning and AI portfolio management that runs on top of Jira and Azure DevOps, or on its own. See `../scaled-planning-opportunity.html` for the market research behind it.

Working name; rename freely.

## What is here

| Path | Package | What it does | Verified by |
|---|---|---|---|
| `packages/core` | `@trainyard/core` | Domain model (work items, teams, groups, increments, dependencies, ROAM risks, objectives). **Operating models as data**: templates for SAFe Essential, Portfolio and Full, **AI-Native SAFe**, LeSS, LeSS Huge, Scrum@Scale, Nexus, Flight Levels and tribes/squads, plus fork and validation. Planning: increment layout, team load against capacity, dependency checks, planning readiness. **Lean portfolio**: value streams with budgets per PI, epics ranked by WSJF, guardrails (enabler floor, single-epic budget cap, business case above a threshold), OKRs with key results typed in or read from a metric. **Metric registry and dashboard engine** with flow, predictability, dependency, risk, capacity, budget, WSJF and OKR metrics. Deterministic demo workspace with mixed Jira and ADO teams | 33 unit tests |
| `packages/ai-portfolio` | `@trainyard/ai-portfolio` | **AI project module**: lifecycle (idea → data readiness → experiment → evaluate → pilot → production → monitor → retired), evidence-based stage gates that tighten by EU AI Act risk tier, eval thresholds, curated-data and human-oversight checks, AI value architect sign-off at pilot and production, an **agent registry** (accountable human, autonomy levels 0–4, limits per model and risk tier), spend against budget with month-end forecast, value realised against KPIs, and six AI dashboard metrics | 16 unit tests |
| `packages/ai-assist` | `@trainyard/ai-assist` | **AI facilitation** through the Anthropic SDK with schema-validated answers (`messages.parse` + zod): draft PI objectives from a team's planned features, suggest ROAM for risks and spot unraised ones, write the readiness briefing, narrate a dashboard, prepare an AI governance review. Prompts carry titles and numbers only, never people's names. A fake provider makes every feature testable offline | 7 tests |
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

```bash
TRAINYARD_ADMIN_KEY=$(openssl rand -hex 24) docker compose up -d --build
# open http://localhost:3100/login and sign in with that key, then create users under Users
```

The compose file runs Postgres, the API and the web app. For a single box without Postgres, run the API with `TRAINYARD_DATA_DIR=/var/lib/trainyard` instead of `DATABASE_URL`: state is a JSON file written atomically, the audit log a JSONL file next to it.

## Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres. Else `TRAINYARD_DATA_DIR` for JSON files, else memory (refused in production) |
| `TRAINYARD_ADMIN_KEY` | Bootstrap admin key. Without it and with no users, the API runs **open**: everyone is an admin (refused in production) |
| `ANTHROPIC_API_KEY` | Turns AI facilitation on. Model: `TRAINYARD_AI_MODEL` (default `claude-opus-5-5`) |
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

## Still to do

- Test the connectors against a real Jira and Azure DevOps account (only recorded responses so far)
- SSO (OIDC/SAML): today users sign in with an API key
- Multiple workspaces per server
- GitHub Issues connector
- Jira Data Center and Azure DevOps Server have adapters by configuration (`host`, `baseUrl`) but no tests against them

SAFe® and Scaled Agile Framework® are registered trademarks of Scaled Agile, Inc. Other framework names belong to their owners. Templates are summaries for configuration, not copies of framework materials. The EU AI Act gate policy is a starting point for a governance board, not legal advice.
