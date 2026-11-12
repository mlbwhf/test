# AI history dataset: notes, gaps and judgement calls (12 Nov 2026)

Data file: `content-ops/ai-history/history-data.json`. It has the keys `meta`, `eras`, `milestones`, `series` (a–k), `stop_quoting` and `sources`. The generator script was a scratch file and is not in the repo. If you change something, edit the JSON directly.

> **Updated the same day:** see "Verification pass 12 Nov" at the end. It supersedes the points below on source access, AlphaGo Zero, GPT-4.5 and the investment gaps. Every changed row carries a `[12 Nov verification]` tag in its note, and every change is listed in `meta.verification_pass.changes`.

## How confident the data is (first pass, before verification)
- **No primary source could be opened in the first pass.** WebFetch was blocked for `epoch.ai` and `ourworldindata.org`. Earlier sessions had also recorded `iea.org` and `sec.gov` as unreachable. Every web figure therefore comes from search-result summaries and is rated **MEDIUM**. Nothing from the web is rated HIGH.
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

## Verification pass 12 Nov

**What was opened.** Epoch AI's Notable AI Models CSV (1,092 rows, downloaded 12 Nov 2026), Epoch's Trends page ("Updated Feb. 5, 2026"), the Grok 4 data insight (12 Sep 2025) and the training-cost blog (Cottier et al.). From Our World in Data: grapher CSVs and metadata for private investment, corporate investment by type, affiliation of notable-system teams and cumulative large-scale systems by country. From Anthropic: the Fable 5 / Mythos 5 post with its 12 Jun and 1 Jul updates, Project Glasswing, and the Fable 5.1 / Mythos 5.1 page. epoch.ai downloads only worked through curl; WebFetch still fails DNS for it. Raw downloads stay in the session scratchpad and are not in the repo.

**Result.** 282 rows are now HIGH, 131 MEDIUM and 123 DERIVED. The first pass had 0 HIGH. 107 changes are logged in `meta.verification_pass.changes`. A HIGH rating on an Epoch row means "Epoch states this value". Epoch's own label (Confident, Likely or Speculative) is still given in each note.

### Corrections (values that changed)
| Item | Was | Now | Why |
|---|---|---|---|
| AlphaGo Zero training compute | ~3×10^23 | **6.49×10^20** (Epoch "Confident") | Epoch now counts only direct training and excludes self-play data generation. The 3.4e23 figure is OpenAI's 2018 number. Era marker, milestone and stop-quoting entry updated to match. |
| GPT-4.5 training compute | 6.4×10^25 | **3.8×10^26** (Epoch "Likely"; range 2.7–5.4e26) | The first-pass figure came from a search summary of an older page. |
| GPT-5 training compute | 5×10^25 (blog median) | **6.6×10^25** (Epoch CSV "Speculative"; CI 2e25–2e26) | The CSV takes precedence over the earlier article. |
| Perceptron → GPT-6 Astra multiple | 1.36×10^21 | **1.35×10^21** | Recomputed from the CSV's 6.949e5. |
| Transformer → Grok 4 cost multiple | ~527,000× | **~885,000×** | Recomputed on a single method (Epoch amortised cost, 2023 USD). The first pass mixed cost bases. |
| Milestone "Claude Fable 5 launched and withdrawn" | MEDIUM, implied permanent | **HIGH**: launched 9 Jun, suspended 12 Jun under US export controls, restored 1 Jul (Mythos 5 for US organisations only) | Taken from Anthropic's post (opened). The 30 Jun termination of the Commerce directive is press-only (MEDIUM). |
| Two DERIVED "implied" investment rows (2013 private, ~2014 corporate) | removed | OWID actuals | Superseded by the full 2013–2025 series. |

### Verified (now HIGH, value unchanged within 2%)
- **Series a:** compute for Perceptron Mark I and 1960, NETtalk, LeNet-5, AlexNet, Seq2Seq, Transformer, BERT-Large, GPT-2, GPT-3, PaLM, GPT-4, Gemini 1.0 Ultra, Grok-2, Llama 3.1 405B, Grok 3 and Grok 4.
- **GPT-6 Astra ~9.4×10^26 FLOP is confirmed in Epoch's CSV.** It is rated "Likely", with a CI of about 5e26–2e27, based on at least 100,000 GB200s for about 90 days and a power draw of about 233 MW. This contradicts `state-of-ai/data/models.json`, which says no 2026 estimate exists, so that page needs updating.
- **Growth rates:** frontier language-model compute grows **5× a year since 2020** (90% CI 4–6×, doubling every 5.2 months). This is now HIGH from epoch.ai/trends.
- **New HIGH cost figures:** frontier language-model training cost grows **3.5× a year since 2020** (doubling about every 7 months, from the Trends page). The older 2.4× a year since 2016 is also confirmed (the blog text says 95% CI 2.0–3.1, while its update note says it moved to 90% CIs).
- **Grok 4 at $490M** is confirmed on Epoch's page. Both cost methods give that median, alongside 246M H100-hours and 310 GWh. The page states emissions three different ways: 140k, 150k and 154k t CO2e.
- **Series c:** parameter counts verified. GPT-3 is recorded as 174.6B. GPT-4 stays null: Epoch's CSV stores 1.8T, but its own note marks that as a rumour, and the stop-quoting entry now warns not to cite Epoch as confirmation.

### Added
- **Series a:** 8 landmark rows from the CSV (Theseus 1950, Gopher, Chinchilla, LLaMA-65B, DeepSeek-V3, Kimi K2, DeepSeek-V4-Pro, Claude 3.5 Sonnet). Also a **"largest estimated training run of the year" frontier line** with 51 rows from 1950 to 2026 (years with at least one estimate). It is DERIVED as an annual maximum and is the natural headline line for the Development Index.
- **Series b:** a consistent-method cost series from the Epoch CSV, as amortised 2023 USD for 13 models and cloud-basis cost for 6. The AI Index 2024 rows stay MEDIUM, but each now carries a cross-check. For example, the Transformer is $930 in the AI Index against $438 amortised in Epoch's CSV.
- **Series f:** OWID's **2013–2025 annual series** for global, US and China private AI investment, plus global corporate investment by type (total, private, M&A, minority stake and public offering). These are in **constant 2021 US$**, so they run below the AI Index's nominal headlines: 2025 private investment is $290.1B here against $344.7B nominal. This also explains the "$360B for 2021" figure: it is the 2026-edition corporate total of $360.7B, after Quid restated the series.
- **Series g:** OWID/Epoch notable systems by affiliation, 2003–2025 (HIGH), which matches our own CSV count within ±1. Also Epoch CSV counts per year, 2010–2026, for all, US and China (DERIVED), and cumulative large-scale systems for 2020–2025: by 2025 the US had 221 and China 194 of 497.
- **Milestones:** 7 Apr 2026 Claude Mythos Preview and Project Glasswing (HIGH: 12 launch organisations including Anthropic, 40+ more, up to $100M in credits). 1 Sep 2026 Fable 5.1 / Mythos 5.1 (HIGH; the page says "September 2026", and the day comes from mythos-factcheck.md).
- **Stop quoting:** "Claude Fable 5 was withdrawn within a week". It was suspended for 19 days and then restored.

### Still unresolved or not upgraded
- **AI Index 2026 "$120M / −30%" training-cost claim: CONTESTED, not resolved.** hai.stanford.edu is refused by the proxy. The claim conflicts with Epoch's own CSV, which is the AI Index's data source: 2025 amortised costs are $218M for Grok 3, $366M for GPT-4.5 and $388M for Grok 4, and the Trends page shows costs rising 3.5× a year. Do not publish it.
- **IEA:** iea.org serves a Cloudflare browser challenge (HTTP 403) to scripted requests, and api.iea.org is refused by the proxy. All IEA rows stay MEDIUM. Someone needs to open the Energy and AI executive summary in a browser.
- **Other unopened sources:** Sevilla et al. (arxiv.org refused) and OpenAI's "AI and Compute" (openai.com returns 403). The pre-2010 doubling-time rows stay MEDIUM.
- **AI incidents:** OWID's incidents chart has been retired and now redirects to the AI topic page. AIID isn't reachable. The series still has only 2012, 2023 (derived), 2024 and 2025.
- **Generative-AI private investment:** OWID has no chart for it. The 2025 figure of $170.9B is still CONTESTED.
- **Benchmarks (series d), prices (e), adoption (h) and publications/patents (k)** were not part of this pass and are unchanged.
- **Our live pages:** `models.json` (no 2026 compute estimate; "withdrawn within a week") and `geography.json` ("withdrawn within a week") are now contradicted by HIGH-rated rows here. Correcting them needs a corrections-log row. That falls outside this read-only task.
