# Registration Growth — Execution Status
_Plan of record: `PLAN.md`. Single KPI: paid Eventbrite registrations. Ads + ad landing pages frozen 30 days; one funnel change per 2 weeks after that. Update this file every Monday alongside the A1 report._

## Phase A (days 1–30)

| Item | Status | Blocked on |
|---|---|---|
| **A1** Registration truth dashboard | ✅ Script built (`a1_registration_report.py`) | **Mark:** add `EVENTBRITE_PRIVATE_TOKEN` env secret to the Claude Code environment (chosen 2026-07-05), then run backfill |
| **A2** CRM activation | ✅ Copy **approved by Mark 2026-07-05**, discount 10% (`ALUMNI10`). Segments sized in HubSpot: quiz/form leads ~262 identifiable, 18-mo window 2,344 contacts, `training`-interest 413. ⚠️ Alumni NOT in HubSpot (0 customers, 4 deals) — alumni list needs Eventbrite attendee export (same token as A1) | HubSpot lists + marketing emails must be built in the HubSpot UI (the connected tools here can't create lists/emails) — build runbook is the checklist in `A2-crm-email-sequences.md` |
| **A3** AI-Native Foundations on Corsizio | ⬜ Not started (needs Corsizio access + cohort date) | **Mark:** Corsizio setup session + Toronto cohort date |
| **A4** Next-cohort modules on unfrozen pages | 🟡 Auto-feed module built (`A4-deployed-block.html`, uses live `[wp_events]` feed — zero monthly upkeep). Pillar `/training/` already shows cohorts natively (parallel session's `#cohorts` section) — covered. | Quiz results ×2 + About: block handed to the website session via `SESSION-COORDINATION.md` (those pages were being edited concurrently; no safe write path from this session) |
| **A5** Content CTA pass | 🔁 Standing rule (below) | Live dates exist on `/training/#cohorts` — usable now |
| **A6** Review collection engine | ✅ Ask email **approved 2026-07-05** + tracking sheet created | **Mark:** GBP review short-link (said he'd send it — not yet received) |

### A5 standing rule (every Thursday post)
Each LinkedIn + blog post carries exactly one specific next-cohort CTA — a real date from `next-cohorts.json` with a direct registration link — placed **above** the locked signature close. Template: `Next {{course}} cohort: {{date}} — register: {{eventbrite_link}}?aff=th-post`. (The `th-post` code makes Thursday-post registrations visible in the A1 attribution section.)

## Phase B (days 30–60) — gated
**Gate:** A1 shows registrations stable or recovering. B1 embedded checkout → one page first, 2 weeks measured. B2 urgency/proof one at a time. B3 aggregateRating only when A6 sheet supports it.

## Phase C (days 30–90) — gated
C1 ad expansion order: POPM → SSM → Vancouver → French/Quebec (only after fr-CA pages) → Microsoft audit. Each change measured 2 weeks against A1; unproductive changes get reverted, not optimized. C3 referral offer: **Mark decides terms.**

## What Mark must provide (rollup)
1. Returning-student discount % + referral terms (A2/C3)
2. Monthly cohort date list → `next-cohorts.json` (A4/A5)
3. Copy approval: A2 sequences, A6 review ask
4. Freeze list: confirmation of which URLs are active ad landing pages
5. GBP review short-link (A6) · Corsizio access/date (A3)

## Weekly log
| Week | Shipped | This week's ONE change | Blocked |
|---|---|---|---|
| 2026-W27 | A1 script; A2 approved (10% `ALUMNI10`) + segments sized; A4 auto-feed module built, pillar confirmed covered; A6 approved; session coordination file | Run A1 backfill → baseline (once env secret set) | Eventbrite token; GBP link; HubSpot UI build; A4 paste on 3 classic pages (website session) |
