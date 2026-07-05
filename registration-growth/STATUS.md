# Registration Growth — Execution Status
_Plan of record: `PLAN.md`. Single KPI: paid Eventbrite registrations. Ads + ad landing pages frozen 30 days; one funnel change per 2 weeks after that. Update this file every Monday alongside the A1 report._

## Phase A (days 1–30)

| Item | Status | Blocked on |
|---|---|---|
| **A1** Registration truth dashboard | ✅ Script built (`a1_registration_report.py`). Run with `EVENTBRITE_PRIVATE_TOKEN` set → first 12-week backfill report lands in `reports/` | Running once where the Eventbrite token is available |
| **A2** CRM activation | ✏️ Segments defined + all 3 sequences drafted (`A2-crm-email-sequences.md`) | **Mark:** approve copy, set returning-student discount % |
| **A3** AI-Native Foundations on Corsizio | ⬜ Not started (needs Corsizio access + cohort date) | **Mark:** Corsizio setup session + Toronto cohort date |
| **A4** Next-cohort modules on unfrozen pages | ✅ Module built (`A4-next-cohorts-module.html`) + data file (`next-cohorts.json`) | **Mark:** first monthly cohort-date list (replace REPLACE placeholders), confirm the 4 target pages are outside ad campaigns |
| **A5** Content CTA pass | 🔁 Standing rule (below) | Real dates from A4 list |
| **A6** Review collection engine | ✅ Ask email drafted + tracking sheet created | **Mark:** GBP review short-link; approve email |

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
| 2026-W27 | A1 script, A2 drafts, A4 module, A6 pack (this commit) | Run A1 backfill → baseline | Items 1–5 above |
