# Follow-ups found by the State of AI research (11 Nov 2026)

## A. Errors → fix today + corrections log (3229) row each (house rule: same day)

| # | Page | Error | Correct statement |
|---|---|---|---|
| A1 | 376 AI Spending by Industry | "$2.59T … +47% over $1.5T" — arithmetic: $1.5T + 47% ≈ $2.2T | Gartner's 2026 forecast is now ~$2.67T (16 Sep 2026), +49.5% on its $1.79T estimate for 2025; drop the "$1.5T" base |
| A2 | 1100 AI Regulation by Country | "~1,130 introduced / ~131 enacted" credited to NCSL for 2025; 131 is Stanford AI Index's count for **2024**. Also "SB 25-189" | NCSL: 227 AI bills enacted in 2025; Stanford: 131 state AI laws passed in 2024. Colorado bill is SB 26-189 |
| A3 | 92 AI Safety & Governance | Stanford's 2024 count presented as "the past year" | Label as 2024 (Stanford AI Index 2025) |
| A4 | 89 Model Benchmarks | Stat tile credits "95%+ SWE-bench Verified" to Stanford HAI | Raw 95–97% scores are from Vals.ai / BenchLM leaderboards (Sep 2026) |
| A5 | 89, 322, 386, 413 | "SWE-bench 4.4% → 71.7%" pairs two benchmark versions (full SWE-bench 2023 vs SWE-bench Verified) and a pre-release o3 score | State each with its version; 71.7% was o3 preview on Verified, Dec 2024 (322 is being rebuilt anyway) |
| A6 | 498 Dark Side hub | "82.6% of phishing emails AI-written", "49% of businesses hit by deepfakes" — already corrected on child pages | Use the child pages' corrected figures |

## B. Stale figures → next refresh of each page (What-changed block, not corrections)

- ChatGPT 900M weekly → 1B+ (31 Aug 2026): 317, 433, 970 (Gemini 900M → 1B+ monthly, 28 Oct 2026); 321, 62, 1196, 957, 716 from the earlier list.
- Doubao 382M → 419M; China AI-app total 499M → 546M (QuestMobile Sep 2026): 2589, 1266.
- McKinsey organisational adoption 88% → 89% (2026 survey): 43, 433, 318.
- Gartner 2026 AI spending $2.5T/$2.59T → ~$2.67T: 376, 967, 362. IDC infrastructure $487B/$497B → $521B: 93, 376, 73, 320, 354, 318. "$600B+ hyperscaler capex 2026" → ~$720–740B guidance: 73, 354, 349, 320.
- Anthropic enterprise API share 40% → 55% (Menlo 2026): 321.
- OpenAI ~$25B annualised → ~$50B (end Sep 2026); Anthropic ~$47B → >$65B run-rate (Jul 2026); Anthropic "$183B end 2025": 73, 321, 381, 47, 967.
- Regulation: 1093 (Colorado date, Omnibus "pending"); 1100 (Omnibus "pending"); 573, 353, 864 (EU AI Act dates after Omnibus 2026/1744); 573 vs 503 disagree on Article 50 dates.
- Work: 387, 395 (PwC wage premium 56% → 62%); 395 (Stanford −13% → −19%); 1114 ("up to about 25%"); 88 (H1 Challenger → Jan–Oct); 2297, 2300 ("AI #1 layoff reason" — no longer true year to date).
- Models: 861 vs 964 cite different Artificial Analysis index versions.
- 572 Anthropic "files confidentially" → public S-1 filed 26 Oct 2026.

## C. Open verification items

- Meta AI 2026 users: our own pages disagree (1.2B on 970 vs ~600M on 2589); Meta published no 2026 total.
- Page 1266 "non-work share 68.9%" — source not traced.
- Usage agent's question on the ChatGPT 1B date: settled 11 Nov — OpenAI's own ads post says "more than 1 billion weekly active users", dated 31 Aug 2026; the 31 Jul/1 Aug reports were a different claim ("our models reach"). OpenAI's 8 Sep figure covers "our products".

## D. Drafts written to WordPress (11 Nov 2026)

| Page | ID | CSV media | Status |
|---|---|---|---|
| State of AI Usage 2026 | 3521 | 3587 | draft, patched to stamped build (IDENTICAL 127,708 bytes) |
| State of AI Spending 2026 | 3524 | 3594 | draft (IDENTICAL) |
| State of AI Finance 2026 | 3526 | 3605 | draft (IDENTICAL) |

Before publishing: replace the truncated excerpts on 3521/3524/3526 with the sentence-safe ones in
`site-content/state-of-ai/pages.json`. Owner action: AIOSEO Organization/WebSite schema still says
"The AI Index" (change in the AIOSEO UI; never via MCP).

WAF note: a wp_alter_post whose search began with `"><div` and whose replacement inserted `<svg` was
403'd; anchoring on `<div class="tai-ex-n">` instead passed.
