# Agile Agilist Ads Agent — Starter Build
Built July 2026. Deploy via Claude Code session with Ads_Agent_Build_Spec.md.

## Structure
- config/rules.yaml — the constitution (immutable core + adaptive calendar + tripwires)
- src/eventbrite_pull.py — ground-truth registrations (needs EVENTBRITE_TOKEN, EVENTBRITE_ORG_ID)
- src/rules_engine.py — daily tripwire checks (tested, working)
- src/weekly_analysis.py — Monday Claude report (needs ANTHROPIC_API_KEY)
- src/asset_generator.py — draft asset validation (tested: correctly blocks unverified claims)

## Deploy order
1. Set env vars; test eventbrite_pull.py against live API — backfill 2yr baseline from the sales CSV
2. Add Google Ads API + Bing Ads API pull scripts (needs OAuth setup — Claude Code session)
3. Schedule daily: pulls -> Airtable -> rules_engine alerts -> Gmail (via n8n at agile-agilist.app.n8n.cloud)
4. Schedule weekly Monday: weekly_analysis.py -> email report
5. Week 1 insurance: native Google Ads Script budget alert at $50/day (independent of this repo)

## Phase 1 (60 days): monitor + alert + recommend ONLY. No writes to ad platforms.
