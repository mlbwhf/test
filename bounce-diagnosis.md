# Bounce-Rate Diagnosis — agile-agilist.com Training Pages
_2026-06-12. Evidence from on-page inspection of RTE (id 1917), AI-Native Foundations (id 11792), Leading SAFe /sa/ (id 24467). GA4 snapshot for bounce %._

## Bounce by page
| Page | Bounce | Note |
|---|---|---|
| AI-Native Foundations | 43% | ⭐ the winner |
| Leading SAFe /sa/ | 70% | generic hero, no city |
| RTE | 70% | **stale past date in lead cohort** |

## Root causes (evidence)
1. **No Register/Buy button in the hero — all pages.** Hero only has an anchor ("Upcoming Cohorts") + a **"Talk to Advisor" link with EMPTY href (broken)**. First real Register/price CTA is at ~24–31% scroll depth.
2. **RTE lead cohort card = "Wednesday, 10 June" — already past** (stale = looks dead → bounce). Single biggest RTE driver.
3. **Hero copy ≠ search intent on weak pages.** /sa/ = generic "Lead Enterprise Agile Transformation," no city, events "Online Event" only. RTE = jargon "Program Increments." AI-Native = concrete keywords ("Prompt Engineering, AI Ethics, No coding required") + named personas ("accountant, marketer, manager, consultant") + valid date.
4. Schedule/price buried at ~¼–⅓ depth (event cards ~13–14%, prices ~27–31%).
5. ~40% traffic is Bing/PPC (IndexNow) — lower-intent, bounces harder than AI-Native's intent-matched organic.

## Fix priorities
- **P0 — Purge past cohorts** so no training page ever shows a past lead date (RTE). Events plugin (The Events Calendar / tribe_events): expire/hide past events or fix the widget to show only upcoming.
- **P0 — Add a real "Register / View Dates & Pricing →" button IN the hero** on every training page, and **fix the empty-href "Talk to Advisor"** (point to https://meetings.hubspot.com/john2795). Highest leverage — applies to all pages.
- **P1 — Rewrite /sa/ hero** to AI-Native's formula: concrete benefit-led subhead + named personas + an Online/Global (+ timezone) label. Plus the geo ribbon snippet already provided.
- **P1 — Surface "next cohort date + starting price" as a one-line strip just under the hero** so buyers see it without scrolling 25%.
- **P2 — Consolidate the 4 SPC pages** to the 43%-bounce winner; 301 the rest.

## The ATF formula that works (copy AI-Native)
Hero must answer, above the fold: **(1) is this for me** (named personas + plain-language benefit), **(2) when** (valid upcoming date), **(3) how much + register** (price hint + a real button). The winner does all three; the losers do none.

## Constraints
- These pages are ~80–100K chars → do NOT full-rewrite via MCP (risk). Apply hero changes as **paste-safe snippets** in the Code editor, or via the page builder.
- Past-cohort purge is an events-plugin task, not page content.
- True per-query search data still pending: Google Search Console → Pages export.
