# AI history dataset: notes, gaps and judgement calls (12 Nov 2026)

Data file: `content-ops/ai-history/history-data.json`. It has the keys `meta`, `eras`, `milestones`, `series` (a–k), `stop_quoting` and `sources`. The generator script was a scratch file and is not in the repo. If you change something, edit the JSON directly.

## How confident the data is
- **No primary source could be opened.** WebFetch was blocked for `epoch.ai` and `ourworldindata.org`. Earlier sessions had also recorded `iea.org` and `sec.gov` as unreachable. Every web figure therefore comes from search-result summaries and is rated **MEDIUM**. Nothing from the web is rated HIGH.
- **Fix:** allow `epoch.ai` and `ourworldindata.org` in this environment's network settings. Then download `epoch.ai/data/notable_ai_models.csv` and re-check series a–c. That one CSV would upgrade about 40 rows.
- **Reused site figures:** these keep our own ratings. Their notes start with `[Report AI State of AI data: file#metric]`. Rows the site rates CONTESTED are MEDIUM here, with "CONTESTED" written in the note.
- **DERIVED rows:** there are 23. Each gives its formula in the note: growth multiples, implied doubling times, implied base years, the IEA CAGR and the GPT-4-level price blend.

## Figures taken from our own data (content-ops/state-of-ai/data)
- models.json: largest_training_compute, frontier_training_cost, swe_bench_verified_top, gpqa_diamond_top, hle_top, arc_agi_top, mmlu_saturation, imo_ai_result, notable_models_us/china, gpt35_class_inference_cost, silicon_data_token_index, frontier_releases, stop_quoting (280×, DeepSeek $5.6M)
- tokens.json: gpt4_bar_tokens_per_dollar (converted back to a blended $/M series), fixed_capability_price_decline, openrouter_agent_token_share
- finance.json: ai_vc_global_crunchbase, largest_ai_round, openai_valuation, anthropic_revenue
- usage.json: chatgpt_wau (2024–26), org_ai_adoption (2024–26)
- infrastructure.json: IEA/Gartner electricity, US LBNL 2023, Stargate
- regulation.json, risk.json, geography.json: EU AI Act fines and dates, AIID 2025 count, US private investment 2025
- spending.json was read but nothing was needed from it, because the history series stop at the AI Index investment measures.

## New findings that conflict with our live pages (action needed)
1. **2026 training compute.** models.json says there is "no public compute estimate for 2026 frontier models". Search results now show an Epoch estimate of **~9.4×10^26 FLOP for GPT-6 Astra** (3 Sep 2026, rated "Likely"). This came via the AI Pulse aggregator and is MEDIUM. Update the State of AI models page once epoch.ai can be reached.
2. **AI Index 2026 training cost.** One secondary summary says the AI Index 2026 reports frontier training costs down about 30%, with the largest run around $120M in mid-2025. That conflicts with Epoch's ~$490M for Grok 4. It is marked CONTESTED. Do not publish it until it has been checked against the chapter PDF.
3. **GPT-4.5 compute.** Epoch's own page gives 6.4e25 FLOP; an aggregator gives 3.8e26. It is excluded from the headline chart.

## Judgement calls
- **Era boundaries** follow the brief. The second winter's end in **1993 is a convention**: Wikipedia uses 1987–2000. The page should say that. The statistical-ML era ends in 2011 so that AlexNet (Sep 2012) opens the deep-learning era. The final era is open-ended (`end: null`).
- **AlphaGo Zero** is kept in the data but flagged: values of 3e23, 3.41e23 and 6.5e20 all appear in the sources, and Epoch excludes it from trend fits. Leave it off the trend line.
- **ImageNet 2013:** we use the winning entry's 11.2% (Clarifai), not ZFNet's often-quoted 11.7%. The 2011 and 2016 values are not directly confirmed.
- **Training-cost methods differ.** AI Index uses cloud-rental costs (GPT-4 $78M, Gemini Ultra $191M). Epoch's amortised-hardware method gives about $40M and $30M. The two must not be mixed silently on one chart. DeepSeek's $5.58M is included only as a labelled "not comparable" row.
- **Investment series are restated between AI Index editions.** Examples: 2021 private investment is $93.5B in the 2022 edition and $125.4B in the 2023 edition; 2021 corporate investment is $276.1B, and another source gives "$360B". Every row names its edition. Chart one edition per line and do not splice editions together.
- **Generative-AI investment for 2025 ($170.9B)** comes from a single source and is internally inconsistent with the report's "more than 200%" growth. It is marked CONTESTED.
- **McKinsey 2022 (50%) and 2023 (55%)** come from the AI Index 2024 summary, not the McKinsey PDFs. In 2024 McKinsey ran two surveys (72% and 78%), and both are listed.
- **ChatGPT 500M weekly users (Mar 2025)** has no primary OpenAI source. The UBS figure of 100M is *monthly* users estimated from web traffic. Chart it separately from the weekly series.
- The milestone list has 68 items, so a few can be dropped. Items marked "not re-checked" are the weakest: LSTM, GPT-2 date, FLI letter, Bletchley signatories, Shakey dates, Siri date, Stable Diffusion and LLaMA dates.

## Gaps not filled
- **Annual series 2013–2025 for corporate and private investment.** Only scattered years were found (2013/14 are implied, plus 2018, 2020–22, 2024 and 2025). The 2023 private-investment figure was not found. The full series needs the AI Index 2026 Economy chapter PDF.
- **Notable models per year (total) and by country before 2023.** Only 2023–2025 were found. Epoch's CSV or the OWID grapher would fill this.
- **AI incidents by year, 2013–2022.** Only 2012 (fewer than 10), 2024 and 2025 are sourced, and 2023 is derived. The AIID downloadable index or the OWID grapher would fill this.
- **AI publications and patents for intermediate years.** Only the end points are included.
- **FrontierMath and HLE 2026** readings conflict across aggregators. Use Epoch's benchmarking hub and Scale's leaderboard directly.
- No sources were checked for the Mansfield Amendment text, the MYCIN accuracy figure (dropped) or word2vec and DQN (dropped).
- **IEA 2025 (485 TWh)** remains CONTESTED on its growth rate, as on our infrastructure page.

## Suggested use on the AI Development Index page
- **Headline log chart:** series a, rows where unit == "FLOP", excluding AlphaGo Zero and GPT-4.5.
- **Benchmark small-multiples:** series d, one panel per benchmark with saturation markers. ARC-AGI-1 and ARC-AGI-2 must be separate panels.
- **Price chart:** the blended GPT-4-level price from series e. Put Stanford's GPT-3.5-level pair on its own line.
- **Year-by-year index:** if a composite score is built, mark it DERIVED and document the weights in the methodology note, as house rule 6 requires.
