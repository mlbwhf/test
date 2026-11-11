# State of AI Tokens — theme brief (adds to BRIEF.md and BRIEF-NARRATIVE.md)

The owner asked for "a yearly tokens per dollar, how tokens evolved over the year, not only from a
price perspective but from a usage perspective across all the platforms, and an ROI per token".
Report title: **State of AI Tokens 2026: Price, Volume and Return per Token**. Theme id `tokens`.
Existing site page to stay consistent with: **421** LLM Token Price Index (also 386 test-time
compute, 93 infrastructure, 321 LLM market, 935 revenue per employee, 966 coding tools).

## The three lenses (each needs yearly values for 2023, 2024, 2025, 2026 where they exist —
put 2023 in `note` or a separate metric, since the data schema keys are 2024/2025/2026)

1. **Price → tokens per dollar.** For each year: (a) tokens per $1 at the cheapest model that
   matches GPT-4 (March 2023) quality (Epoch AI / a16z "LLMflation" / Stanford AI Index cost
   curves); (b) tokens per $1 at the flagship frontier model's list price (blended 3:1
   input:output — state the blend); (c) the usage-weighted market price (Silicon Data LLM Token
   Expenditure Index, launched 2026; peak ~$2.07/M late May 2026, below $1/M October 2026). Show
   2026 month by month where readings exist. Note reasoning models burn more tokens per task, so
   cheaper tokens ≠ cheaper tasks (Epoch, Artificial Analysis cost-to-run-the-index figures).
2. **Volume → tokens processed across platforms.** Dated readings per platform: Google (monthly
   tokens processed across products: 9.7T Apr 2024 → 480T Apr 2025 → 980T Jul 2025 → 1.3
   quadrillion Oct 2025 → any 2026 figure), Microsoft (Azure AI Foundry tokens per quarter),
   OpenAI API (tokens per minute, DevDay 2025 and 2026), OpenRouter (weekly tokens), ByteDance
   Volcano Engine / Doubao (daily tokens), Alibaba Cloud, Anthropic, any others with disclosures.
   Each platform's own unit; never add different units together. If you build a cross-platform
   total, make it DERIVED, normalise to tokens per month, list the inputs and say what is missing.
3. **Return → ROI per token.** There is no standard measure; build transparent DERIVED ones and
   explain each formula in `note` and in a sidebar:
   - **Revenue per million tokens served** for a provider where both revenue and token volume are
     disclosed or credibly reported (e.g. a lab's API/inference revenue ÷ tokens).
   - **Spend side:** enterprise spend on model APIs (Menlo Ventures and similar), total token
     spend vs tokens consumed → the "Jevons" picture: price per token down X×, tokens up Y×,
     spend up Z× (2024→2026).
   - **Task economics:** cost in tokens of a representative task (e.g. a coding task, a support
     ticket, a page of summarisation) at 2024 vs 2026 prices vs the human labour cost of the same
     task (state wage source). Only where a published study gives the inputs.
   - **Business return evidence:** surveys of measured ROI on generative AI (e.g. MIT NANDA 2025
     "95% no measurable return", Wharton, IBM, Google Cloud ROI studies, 2026 updates), paired
     with what organisations spend on tokens. Mark CONTESTED where studies disagree.
   State plainly what cannot be measured (firm-level return per token is not disclosed by anyone).

Aim for 18–25 metrics; exhibits must include: a tokens-per-dollar line (log-scale note is fine —
plot the values, the generator can't do log axes, so prefer a `table` or index-to-100 if the range
spans >1,000×), a platform-volume chart, a 2026 monthly price line, and a Jevons comparison
(`grouped`: price index, volume index, spend index, 2024=100 — DERIVED).

Write `content-ops/state-of-ai/data/tokens.json` (BRIEF.md schema) and then
`content-ops/state-of-ai/narrative/tokens.json` (BRIEF-NARRATIVE.md schema).
