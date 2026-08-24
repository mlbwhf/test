# Refresh register

Work list for the cadence defined in `refresh-policy.md`. Tier logic: CRITICAL = could be
wrong within 30 days; STANDARD = source refreshes a few times a year; STABLE = settled.

**Status key:** ⏳ due at next run · ✅ reviewed, current · ⚠️ known stale

Baseline established 2026-08-22. "Last reviewed" = when the figure was last verified
against its primary source in this workstream.

---

## CRITICAL — monthly (1st of each month)

| Page | Key figures to re-check | Source & why it moves | Last reviewed | Status |
|---|---|---|---|---|
| `/indexes/technical-benchmarks/best-ai-models-2026/` | Intelligence Index composite (58.9), SWE-bench Pro (69.2%), all 9-criteria ratings | Artificial Analysis / LMArena / SWE-bench — leaderboards shift weekly; the page itself says so | 2026-07 | ⏳ |
| `/indexes/ai-economics/llm-token-price-index/` | ~280× drop, ~10×/yr rate, per-model $/M tokens | Provider price lists — change without notice | 2026-08-05 | ⏳ |
| `/reports/ai-data-center-cost/` | ~~$250B~~ **$105B** guarantee (phase one only), ~$350B chip financing, $30–40B phase one | **Deal terms under active negotiation** — page states they may change | **2026-08-24 — UPDATED** | ✅ |
| `/reports/meta-blackrock-off-balance-sheet-ai-financing/` | 80/20 split, $14.3B, $12.5B notes, lease terms | Transaction documents may be amended; watch for deal #3 | 2026-08-24 (Nvidia comparison figure updated; Meta terms unchanged) | ✅ |
| `/indexes/ai-economics/ai-bubble-tracker/` | Valuation and capex markers | Market-sensitive by definition | unknown | ⚠️ |
| Homepage "Figure of the week" (page 6) | Featured figure + 4-year series | Weekly by design — swap the WEEKLY-EDIT lines | 2026-08-22 | ✅ |

## STANDARD — quarterly (1 Jan / 1 Apr / 1 Jul / 1 Oct)

| Page | Key figures to re-check | Source & rhythm | Last reviewed | Status |
|---|---|---|---|---|
| `/indexes/enterprise-ai/` + `enterprise-ai-statistics-2026` | 88% orgs using AI, 72% gen-AI, ~95% no measurable return | McKinsey State of AI / State of Organizations — annual with interim cuts | 2026-08-07 | ✅ |
| `/indexes/ai-economics/` | $2.59T worldwide spend, +47% YoY, ~41% of IT spend | Gartner — forecasts revised ~quarterly (Jan/May/Aug/Nov) | 2026-08-07 | ✅ |
| `/indexes/ai-economics/llm-market-statistics-2026/` | Provider share, revenue run-rates | Company disclosures, quarterly earnings | 2026-08 | ⏳ |
| `/indexes/ai-economics/ai-investment-funding-statistics-2026/` | $581.7B corporate AI investment, round sizes | Stanford HAI + funding trackers | 2026-08 | ⏳ |
| `/indexes/geography-of-ai/popular-ai-models-by-country/` | Doubao 382M MAU, ChatGPT 61.7% US / 70.8% EU, Perplexity ~48% RU | QuestMobile / Similarweb — monthly data, but our framing is structural | 2026-08 | ✅ |
| `/indexes/technical-benchmarks/` + infrastructure/compute | Compute trends, ~945 TWh by 2030 | IEA, vendor disclosures | 2026-08-18 | ✅ |
| `/indexes/workforce-labor/` + `ai-jobs-statistics-2026` | 92M jobs displaced by 2030, skills premium | WEF Future of Jobs, ILO | unknown | ⚠️ |
| `/indexes/ai-dark-side-statistics/` + 5 sub-indexes | Deepfake fraud, surveillance, misinformation series | Multiple; annual reports with interim incidents | 2026-08 | ⏳ |
| `/reports/dark-side-of-ai/ai-workslop-statistics/` | 40%, 1h56m, $186/worker/month | BetterUp/Stanford study is fixed — re-check for replication or newer studies | 2026-08-18 | ✅ |
| `/reports/dark-side-of-ai/ai-hidden-debt-financing-risk/` | ~$1.7T off-balance-sheet obligations | Nikkei analysis; hyperscaler filings quarterly | 2026-08 | ⏳ |
| `/reports/eu-ai-act-fully-applicable-august-2026/` | Obligation timeline, May 2026 amendments | Regulatory — check for delegated acts and guidance | 2026-08-02 | ✅ |
| `/indexes/compare/` (10 comparison threads) | Every paired figure | Inherits the cadence of whichever series it compares | 2026-08 | ⏳ |
| `/indexes/enterprise-ai/ai-search-statistics-2026/` | AI Overviews ~50% of queries, CTR −34.5%, referrals +527% | Fast-moving SEO/GEO data | 2026-08 | ✅ |
| `/indexes/enterprise-ai/ai-video-generation-statistics-2026/` + market-size report | 124M users, Kling ~$500M ARR, $47.8B by 2034 | Vendor disclosures + forecasters | 2026-08 | ✅ |
| `/indexes/state-of-ai/` (2022–2026 series) | Year snapshots | Historical, but the current year keeps moving | 2026-08 | ⏳ |
| `/indexes/ai-by-industry/` | Sector adoption rates | Sector surveys, annual | unknown | ⚠️ |

## STABLE — semi-annual (1 Jan / 1 Jul)

| Page | What to re-check | Last reviewed | Status |
|---|---|---|---|
| `/glossary/` (all terms) | Definitions still standard; add terms that entered common use | unknown | ⚠️ |
| `/about/` methodology & corrections policy | Confidence definitions match what the pages actually do | 2026-08 | ✅ |
| `/reports/real-world-ai/` (8-part series) | Case studies still accurate; outcomes updated | unknown | ⚠️ |
| Historical `state-of-ai` years 2022–2025 | Only if a source restates history | 2026-08 | ✅ |

---

## First pass — run 2026-08-24

**1. `/reports/ai-data-center-cost/` — UPDATED. Material change found.**
The Nvidia guarantee was cut from ~$250B to **up to $105B**, and now covers only the
project's first phase (~5GW of 10GW), after investors raised concerns about Nvidia's
risk exposure. Reported by WSJ 14 Aug, corroborated by Reuters and Fortune (18 Aug).
Actions taken: stat tile, intro, Analysis, financing-loop section, methodology note and
JSON-LD `dateModified` all updated; "What changed" block added with the previous value
retained; visible stamp now "Published 18 Aug · Updated 24 Aug". The same figure was
corrected in the Meta/BlackRock report, which cited it as a comparison.
*Editorial note:* the cut strengthens the report's thesis — Nvidia pulled back precisely
because the circular-financing risk the piece describes was questioned by its investors.

**2. `/reports/meta-blackrock-off-balance-sheet-ai-financing/`** — Meta/BlackRock terms
unchanged; no third JV found. Nvidia comparison figure corrected. Still watch for deal #3.

## Remaining queue

Ordered by risk — highest first:
3. **`/indexes/technical-benchmarks/best-ai-models-2026/`** — ratings are stamped
   July 2026 and the page admits leaderboards shift weekly. Currently our most
   visibly-dated page.
4. **`/indexes/ai-economics/llm-token-price-index/`** — the 280× figure anchors the
   homepage and the sidebar; if it moved, three surfaces are wrong at once.
5. **`⚠️ unknown` rows above** — pages I have not verified in this workstream. First
   quarterly run should establish their baseline rather than assume they're current.
