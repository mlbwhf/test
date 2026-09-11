# Refresh register

Work list for the cadence defined in `refresh-policy.md`. Tier logic: CRITICAL = could be
wrong within 30 days; STANDARD = source refreshes a few times a year; STABLE = settled.

**Status key:** ⏳ due at next run · ✅ reviewed, current · ⚠️ known stale · 🟡 partially
updated, one or more figures open pending primary-source access

Baseline established 2026-08-22. "Last reviewed" = when the figure was last verified
against its primary source in this workstream.

---

## CRITICAL — monthly (1st of each month)

| Page | Key figures to re-check | Source & why it moves | Last reviewed | Status |
|---|---|---|---|---|
| `/indexes/technical-benchmarks/best-ai-models-2026/` (page 964) | Intelligence Index composite (58.9), SWE-bench Pro (69.2%), all 9-criteria ratings | Artificial Analysis / LMArena / SWE-bench — leaderboards shift weekly; the page itself says so | **2026-09-10 — PARTIALLY UPDATED** | 🟡 **partial** |
| `/indexes/technical-benchmarks/chinese-ai-models-2026/` **PUBLISHED 2026-09-03** | Kimi K3 57.1, Qwen3.8-Max 58 (volatile: 53→56→58), Qwen3.8-27B 52, SWE-bench Pro 61.7 | Artificial Analysis; Chinese labs ship fast and scores get revised | 2026-09-03 | ✅ |
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
| **PILLAR** `/indexes/workforce-labor/will-ai-replace-my-job/` (page 2297, **DRAFT**) | WEF +78M net, AI as #1 stated layoff reason (25% of Mar 2026 cuts), 55% regret, ~50% reversal forecast | WEF, Forrester, Robert Half — annual with interim cuts | 2026-09-11 | 🟡 **draft** |
| ├ `…/customer-support/` (page 2298, **DRAFT**) | Deflection 41.2% median / 58.7% top quartile, <25% on complaints, CSAT 4.10 vs 4.30, re-contact 11.3% vs 8.7%, Klarna 700→853 FTE-equivalent | Enterprise CX benchmarking + Klarna disclosures — vendor data revises often | 2026-09-11 | 🟡 **draft** |
| ├ `…/software-developers/` (page 2299, **DRAFT**) | 11.4h vs 9.8h, +441% PR review, +54% bugs/PR, +31% unreviewed merges, GitClear 9.4%→15.7%, −67% entry-level | DORA, GitClear, Faros, Sonar — annual reports | 2026-09-11 | 🟡 **draft** |
| └ `…/by-occupation/` (page 2300, **DRAFT**) | Translators 98%+, office/admin 46%, legal 44%, paralegals 80%, writing −33%, bookkeeping −35–50%, HR 30–40% | Mixed methodologies; presented as a ranking, not a forecast | 2026-09-11 | 🟡 **draft** |
| `/indexes/ai-dark-side-statistics/` + 5 sub-indexes | Deepfake fraud, surveillance, misinformation series | Multiple; annual reports with interim incidents | 2026-08 | ⏳ |
| `/reports/ai-replacement-reversal-2026/` (page 2293, **DRAFT**) | Meta Project OT figures (+220%/+36%/+40%/+70%), 55% regret, 32% refilled, 30.9%/42.4% cost split, 20–35% premium, 11.4h vs 9.8h review time, +441% PR review, −67% entry-level postings | Reuters + Forrester/Robert Half/DORA/GitClear/Faros/Sonar — vendor research refreshes a few times a year; the Meta figures are fixed history | 2026-09-11 | 🟡 **draft, MEDIUM figures unverified at source** |
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

## Second pass — run 2026-09-10 (September CRITICAL)

**Blocker found, and it governs the whole pass.** Every external domain is unreachable
from the session running these reviews — `artificialanalysis.ai`, and equally every news
and primary source tried. The only external signal available was search-engine result
summaries. Under §4.1 of the policy a figure changes only against its primary source,
so **no externally-sourced figure was updated in this pass.** That is a deliberate
refusal, not an oversight: the three secondary trackers checked for the Intelligence
Index disagreed with one another by up to **12 index points** (Fable 5.1 quoted at 56.8,
53.7 and 66 by different aggregators on the same week). Publishing any of those would
have put invented precision on our most benchmark-dependent page.

**1. `/indexes/technical-benchmarks/best-ai-models-2026/` (page 964) — PARTIALLY UPDATED.**
The page contradicted our own `chinese-ai-models-2026` (published 3 Sep, verified). Fixed
using our own verified figures only — no external source needed:
- "What changed" block added above the methodology box: three rows, previous → new →
  source, including an explicit **open row** for the US-frontier composites.
- `Qwen3.7-Max` → **`Qwen3.8-Max`** in the comparison matrix and the model card
  (supersession we verified on 3 Sep). Old figures retained in the card for comparison,
  per §3 "never overwrite silently".
- Lede, methodology stamp, visible FAQ and JSON-LD FAQ all updated together so no
  surface disagrees with another (§2.2).
- Cadence and **next review (October 2026)** now stated on the page.
- Internal link added to `chinese-ai-models-2026`.
- Nine-criteria dot ratings for the Alibaba row are **inherited from the 3.7 assessment**
  and labelled as due for re-rating — they were not silently transferred.

*Still open on this page:* GPT-5.6 Sol 58.9, Claude Opus 4.8 55.7, GPT-5.6 Terra 55.0,
Gemini 3.1 Pro, SWE-bench Pro 69.2%, and the Opus 4.8 → Opus 5 / Fable 5.1 generational
question. Search results also surfaced a model (`GPT-6 Astra`) that appears nowhere on
the site. All of it needs one pass from a machine with normal internet access.

**2. Remaining CRITICAL rows not attempted** — `llm-token-price-index`,
`ai-bubble-tracker`, `ai-data-center-cost`, `meta-blackrock`, homepage figure of the week.
Each is gated on the same blocker: every figure on them is externally sourced.

## Remaining queue

Ordered by risk — highest first:
3. **`/indexes/technical-benchmarks/best-ai-models-2026/`** — ratings are stamped
   July 2026 and the page admits leaderboards shift weekly. Currently our most
   visibly-dated page.
4. **`/indexes/ai-economics/llm-token-price-index/`** — the 280× figure anchors the
   homepage and the sidebar; if it moved, three surfaces are wrong at once.
5. **`⚠️ unknown` rows above** — pages I have not verified in this workstream. First
   quarterly run should establish their baseline rather than assume they're current.
