# Trainyard

Scaled agile planning and AI portfolio management that runs on top of Jira and Azure DevOps, or on its own. See `../scaled-planning-opportunity.html` for the market research behind it.

Working name; rename freely.

## What is here

| Path | Package | What it does | Verified by |
|---|---|---|---|
| `packages/core` | `@trainyard/core` | Domain model (work items, teams, groups, increments, dependencies, ROAM risks, objectives). **Operating models as data**: templates for SAFe Essential, Portfolio and Full, **AI-Native SAFe**, LeSS, LeSS Huge, Scrum@Scale, Nexus, Flight Levels and tribes/squads, plus fork and validation. Planning: increment layout, team load against capacity, dependency checks, planning readiness. **Metric registry and dashboard engine** with flow velocity, flow time, flow load, flow distribution, predictability, objectives met, dependency health, risks by ROAM and capacity used. Deterministic demo workspace with mixed Jira and ADO teams | 28 unit tests |
| `packages/ai-portfolio` | `@trainyard/ai-portfolio` | **AI project module**: lifecycle (idea → data readiness → experiment → evaluate → pilot → production → monitor → retired), evidence-based stage gates that tighten by EU AI Act risk tier, eval thresholds, curated-data and human-oversight checks, AI value architect sign-off, an **agent registry** (accountable human, autonomy levels 0–4, limits per model and risk tier), spend against budget with month-end forecast, value realised against KPIs, and six AI dashboard metrics | 16 unit tests |
| `packages/connectors` | `@trainyard/connectors` | Jira Cloud adapter (enhanced JQL search with `nextPageToken`, field updates, sprint moves, Blocks links) and Azure DevOps adapter (WIQL, `workitemsbatch` in batches of 200, JSON Patch updates, Successor links). Retries on 429/5xx with `Retry-After`. **Two-way sync planner**: remote changes flow in, local plan changes flow out, a field changed on both sides becomes a conflict | 9 offline tests with a recorded fake `fetch` |
| `apps/api` | `@trainyard/api` | Fastify 5 REST API with zod validation and OpenAPI at `/docs`. Model, board, items, dependencies, risks, objectives, metrics and dashboards, AI initiatives (gate check, advance, evidence, sign-off, evals, costs), agents, and tracker sync with dry run | 14 tests via `inject` |
| `apps/web` | `@trainyard/web` | Next.js 16 app: dashboard builder, drag-and-drop program board, AI portfolio lifecycle and initiative gate pages, agent registry, operating model editor, tracker connections | typecheck, production build, browser run-through |

## Run it

```bash
pnpm install
pnpm build

pnpm dev:api   # http://localhost:4100/docs, demo workspace in memory
pnpm dev:web   # http://localhost:3100
```

The demo runs on a fixed date (21 October 2026) so its numbers stay stable. Set `TRAINYARD_DEMO_CLOCK=0` to use the real clock. Set `TRAINYARD_API_KEY` to require a bearer key; the web app sends `NEXT_PUBLIC_TRAINYARD_API_KEY`.

## Connect Jira and Azure DevOps

Mappings are JSON in an environment variable; secrets are separate variables.

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

## Not built yet

- Persistence (the store is in memory; Postgres goes behind `Store`)
- Users, SSO and permissions
- Scheduled sync and webhooks (sync runs on request today)
- Lean portfolio budgets and OKRs
- AI facilitation (LLM drafting of objectives and risk summaries)
- Self-hosted packaging

SAFe® and Scaled Agile Framework® are registered trademarks of Scaled Agile, Inc. Other framework names belong to their owners. Templates are summaries for configuration, not copies of framework materials. The EU AI Act gate policy is a starting point for a governance board, not legal advice.
