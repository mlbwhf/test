# Registration Growth Strategy — Agent Execution Plan
**Owner:** Mark Saymen · Agile Agilist
**Single KPI:** Eventbrite registrations (paid). Nothing else counts as success.
**Prepared:** 5 Jul 2026

## Operating constraints (read first, never violate)

1. **Ads are frozen.** No campaign, budget, keyword, or bidding changes for 30 days from restoration. Ad landing pages are frozen too (content, CTAs, slugs).
2. **One change at a time.** After the freeze, any funnel change ships alone with a 2-week measurement window before the next.
3. **Leads ≠ conversions.** Form fills and quiz completions are leads. Only Eventbrite registrations are conversions.
4. **All standing rules from HANDOVERCOMPLETE_1.md and KICKOFF-NEW-SESSION.md apply.**

## The logic

Traffic is restored and must not be touched. Therefore registrations grow in the next 90 days from three levers, in order of speed:
- **Lever 1 (days 1–30):** Monetize the audience we already own — CRM contacts, quiz leads, 3,000+ alumni. Zero risk to ads, fastest payback.
- **Lever 2 (days 30–60):** Remove friction at the moment of purchase — embedded checkout, urgency, social proof on course pages (unfrozen by then).
- **Lever 3 (days 30–90):** Controlled ad expansion + LLM/SEO compounding, one change at a time.

---

## PHASE A — Days 1–30 (during the ads freeze)

### A1. Registration truth dashboard (agent — build first)
Build a script using the Eventbrite REST API (existing API access from the event-copy script) that pulls all registrations weekly, broken down by course, city, date, and week-over-week trend. Output: a simple weekly report emailed or saved. This is the scoreboard for every decision in this plan.
**Done when:** first weekly report produced with a 12-week backfill as baseline.

### A2. CRM activation — the biggest untapped lever (agent via HubSpot MCP, Mark approves copy)
Segment HubSpot contacts into:
- **Quiz leads** — Cert Recommender + Career Compass completions (path/archetype known)
- **Alumni by certification** — completed SA → offer POPM/SSM; completed SSM/POPM → offer RTE/SPC; anyone → AI-Native Foundations as the new frontier
- **Cold inquiries** — contacted in the last 18 months but never registered

Build three email sequences (3–4 emails each, spaced over 2–3 weeks):
1. **Quiz-to-cohort:** matched course recommendation + next cohort date + one alumni story
2. **Alumni ladder:** "your next certification" with a returning-student discount code (Mark sets %)
3. **Reactivation:** what's new (AI-Native track, the only-in-Canada claim) + upcoming dates

Every email links directly to the Eventbrite listing — no intermediate pages.
**Done when:** sequences live, sends tracked, registrations from email visible in A1 report (use Eventbrite tracking links per sequence).

### A3. AI-Native Foundations on Corsizio (agent + Mark)
Complete the pending Corsizio event setup for AI-Native Foundations public cohorts (Toronto first per the city rotation). This is a new revenue line with a monopoly claim behind it and no dependency on frozen assets.
**Done when:** first public cohort is bookable and linked from the pillar page and quiz results.

### A4. Next-cohort modules on unfrozen pages (agent)
Add a "Next cohorts" date/CTA module to the pillar page, both quiz results screens, and the About page — pages confirmed outside ad campaigns. Data source: manual list Mark provides monthly (later: Eventbrite API).
**Done when:** every unfrozen high-intent page shows real upcoming dates with a direct registration link.

### A5. Content CTA pass (agent)
Every Thursday post (LinkedIn + blog) gets one specific next-cohort link — a real date, not a generic "learn more." Signature close stays locked; the CTA sits above it.

### A6. Review collection engine (Mark + agent)
Start collecting verifiable reviews now: post-class email asking for a Google review (GBP) and a testimonial with permission to publish. Agent drafts the ask email and builds the tracking sheet. This feeds legitimate aggregateRating schema and course-page social proof in Phase B.

---

## PHASE B — Days 30–60 (after the Eventbrite verdict)

**Gate:** Proceed only if A1 shows registrations stable or recovering. If not, stop and diagnose before changing anything.

### B1. Eventbrite Embedded Checkout on course pages (agent)
The single biggest conversion-friction fix: registration completes on-page instead of redirecting. Roll out on ONE course page first (highest-traffic ad landing page), measure 2 weeks in A1, then roll to the rest.

### B2. Urgency and proof modules (agent)
On course pages, sequenced one at a time after B1 stabilizes:
- Early-bird deadline with real price difference
- "X of Y seats remaining" from real Eventbrite capacity (API)
- Verified testimonials from A6 with names/companies (with permission)

### B3. Real aggregateRating restored (agent)
Once A6 has a credible, displayable review base, re-add aggregateRating schema backed by visible on-page reviews.

---

## PHASE C — Days 30–90 (parallel, controlled expansion)

### C1. Ad expansion, one change per 2 weeks, in this order (agent proposes, Mark approves each)
1. POPM ad group (existing demand, proven course)
2. Scrum Master ad group
3. Vancouver campaign test (city rotation support)
4. French/Quebec campaign (after fr-CA landing content exists — do not run French ads to English pages)
5. Microsoft Ads keyword audit
Each measured solely against A1 registrations. Any change that doesn't produce registrations in 2 weeks gets reverted, not "optimized."

### C2. LLM/SEO Phases 3–5 continue (agent + Mark)
Answer-first course page restructure (post-freeze), FAQ schema completion, Bing/IndexNow, monthly prompt-panel test, GA4 AI-referral segments. "State of SAFe Training in Canada" report drafted from alumni data — the citation magnet that compounds.

### C3. Referral mechanism (Mark decides, agent builds)
Alumni referral offer: past student refers a colleague, both get a discount. Delivered through the A2 alumni sequence. Cheapest acquisition channel available.

---

## Weekly rhythm

Every Monday the agent produces: A1 registration report + what shipped last week + the ONE change proposed for this week + anything blocked on Mark. No week ships more than one funnel-affecting change.

## What Mark must provide

- Returning-student discount % and referral offer terms
- Monthly cohort date list until the API module exists
- Approval on all email copy before sending
- Confirmation of which URLs are active ad landing pages (freeze list)
