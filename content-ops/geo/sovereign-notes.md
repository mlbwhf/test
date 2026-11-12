# Sovereign AI Index rebuild: research notes

Compiled 12 Nov 2026 for page 934 (`/indexes/geography-of-ai/sovereign-ai-index-2026/`). Data is in `sovereign-data.json` in this folder. This was read-only research; nothing was written to WordPress.

## Coverage

- **Models: 58 rows across 33 countries or regions.** Every country on the brief is covered. Two exceptions:
  - Black Forest Labs (an image-model company, not a sovereign LLM) is left out.
  - Masakhane is a research community with no model metrics, so it has no row.
  - OpenThaiGPT and Brazil's Maritaca/Sabiá were not researched.
- **Popularity: 12 comparison blocks.** They cover:
  - Hugging Face download share by country and by model family
  - derivatives (fine-tunes)
  - OpenRouter token share
  - leaderboards
  - home-market use in China, Korea, France, Russia and India
  - Malaysia, Kazakhstan and the Japanese government trial
  - counts from the CNAS and Counterpoint indexes
- **Compute: 14 programmes.** Stargate US, Stargate UAE, HUMAIN, EU, UK, France, Germany, India, Japan, Korea, Canada, Nvidia sovereign revenue, Brazil, and other national systems.
- **Typology: 9 entries.** These are the definitions plus the build-type split: from scratch, adapted, or deployed.
- **Corrections: 16 stop-quoting claims and 29 stale-text items**, each tied to a site page.

## Confidence and access

> [11 Nov ET verification] This section describes the first pass. It has been superseded: Hugging Face, Artificial Analysis, OpenRouter, Statcounter and arXiv were opened in the verification pass below, so their figures are now HIGH. LMArena (`arena.ai`) and PIB (`www.pib.gov.in`) are still blocked.

- **HIGH (primary data opened) applies only to Epoch AI.** Its site was reachable. I downloaded `data_centers.csv`, `data_center_timelines.csv` and `gpu_clusters.csv`, and read the Stargate report. That covers:
  - Stargate sites and capacity
  - the Abilene timeline, including Oracle's 618 MW (10 Sep 2026)
  - **Stargate UAE: 0 MW operational in Nov 2026**, projected for Dec 2026
  - GPU counts for JUPITER, Isambard-AI, ABCI 3.0, Alps and others
  - country shares of Epoch-tracked frontier compute (DERIVED)
- **Everything else is MEDIUM.** It comes from WebSearch summaries of reputable secondary or company sources. The proxy blocked Hugging Face, arXiv, LMArena, Artificial Analysis, OpenRouter, Statcounter, PIB, Mistral, TII and most news sites. The full list is under `blocked_hosts` in the JSON.
- **Hugging Face download counts could not be read for any model.** Where counts exist, they are vendor or secondary figures:
  - Falcon 55M+
  - KazLLM 140k+
  - SEA-LION ~235k (2025)
  - ATOM family totals: Qwen 942.1M, Llama 476.0M, DeepSeek 128.2M, Mistral 124.3M
  - Qwen 2.05B in Jan–Aug 2026 (Hugging Face summer 2026 report)
- **"Last-month" Hugging Face downloads are a gap for every model.** Allowing `huggingface.co` would fill most of the empty `hf_downloads_*` fields in one pass, through `api/models?author=<org>&sort=downloads`.

## Judgement calls

1. **Popularity is measured in at least six ways that cannot be compared.** They are Hugging Face downloads, derivatives, app MAU/WAU, web-traffic share, Statcounter referral share, OpenRouter tokens, and leaderboard rank. Each figure keeps its own scope, and none are summed. The page should explain this up front.
2. **Build type is recorded for every model.** It is either "from scratch" or "adapted" from a named foreign base. The two outside indexes disagree slightly on the split:
   - CNAS: about 40% of tracked model projects are from scratch.
   - Counterpoint H1 2026: 56% of sovereign LLMs are adapted.
   - I quote both with their own scopes.
3. **Search reach is kept separate from chatbot use.** Naver's AI Briefing has about 30M monthly users, but that is reach inside search. It is not a chatbot MAU, and the standalone Clova X chatbot closed in Apr 2026. I kept it apart from ChatGPT's Korean app MAU of 18.76M.
4. **Ceilings are kept separate from contracts.** HUMAIN's "up to 600,000 GPUs" is a three-year ceiling. Its contracted October 2026 deal is about 27,000 GPUs, which is 4.5% of that ceiling (DERIVED). The EU's €200B is a mobilisation target, as page 374 already says.
5. **Hosting is not sovereignty.** In Epoch's tracked frontier data centres, Malaysia holds 9.1% of capacity, mostly for foreign tenants. France's "sovereign" Campus AI is 70% owned by MGX.
6. **Vendor benchmark claims stay flagged as self-reported.** Examples are Sarvam's "~90% win rate" and Jais 2's AraGen result.
7. **Artificial Analysis rebased its index during 2026.** K-EXAONE's January score of 32 and Qwen3.8-Max's September score of 58 are on different scales and should not be compared.
8. **The ¥387.3B Japanese figure needs checking before use.** Page 374 lists it as METI's "AI-specific" line. Kyodo reports the same amount as FY2026 aid for the Noetra/AIST national model. It is probably one figure; confirm before printing both.

## Most important corrections

- **The Russia row on page 1266 needs a correction-log entry.** [11 Nov ET verification] My first pass said the "~48%" had no source; that was wrong. Statcounter's April 2026 reading was 47.92% for Perplexity, so the number is real. What's wrong is the framing: it is a dated share of referral clicks, presented as market share, with an unsourced causal story. See "Verification pass" below for replacement wording. A fact-check entry (`#fc-*`) is also worth adding.
- **The Korea and Japan rows on page 1266 are out of date.**
  - Korea: Clova X closed, Naver was cut from the national project, and ChatGPT holds about 91% of Korean AI-app users.
  - Japan: the "Fugaku-LLM in the public sector" claim has no supporting evidence.
- **India is now ChatGPT's largest market, not its second** (OpenAI, 3 Nov 2026). This affects pages 957 and 1266.
- **Counts that have moved:**
  - IndiaAI GPUs: 34,000 → 38,231 (Mar 2026)
  - Falcon downloads: 45M → 55M+
  - Mistral valuation: $14B → €21B+
  - Doubao: 382M → 419M; Qwen app: 167M → 158M; DeepSeek: 130M → 123M
- **New events to add:**
  - Le Chat was renamed Vibe (28 May 2026).
  - Cohere is acquiring Aleph Alpha (announced 24 Apr 2026).
  - China's draft export controls on model weights (16 Oct 2026; comments close 15 Nov). These matter for every adapted national model built on Qwen.

## Gaps (null in the JSON)

- **Leaderboards:** there is no verified LMArena top-20 by developer country. The only snapshot is from a news aggregator: Gemini 4 at #1, Kimi K3 at #19, GLM 5.3 at #28, DeepSeek V4.1 Flash at #35.
- **Consumer users:** there is no official MAU for GigaChat, HUMAIN Chat, Jais Chat, Sarvam Indus, Sahabat-AI or Typhoon. Mistral's Le Chat/Vibe MAU is CONTESTED, with estimates from 5M to 65M.
- **Nvidia sovereign revenue for FY2027:** no dollar figure has been published. Q2 growth ("more than doubled") comes from one source, and Q3 results are due in late November.
- **Not yet confirmed:**
  - whether India's +20,000 GPUs were onboarded
  - HUMAIN's operating capacity
  - whether any EU gigafactory site has been selected (awards are due early 2027)
  - whether OpenEuroLLM's first models have shipped
  - whether the Cohere–Aleph Alpha deal has closed
  - the second-round winners of Korea's national project (due Dec 2026)
- **Funding amounts** for most public model programmes were not found: GPT-NL, ALIA, Teuken, Apertus, Fanar and IndiaAI per-team grants. The SEA-LION $52M figure on page 934 was not re-verified.
- **Older index references:** the Tortoise 2024 figure on page 934 may be superseded by an Observer Global AI Index (Dec 2025), but only one secondary source supports that. The OECD.AI "900+ policies" count was not re-checked.

## Suggested page structure (for the rebuild)

1. Stat-tile strip:
   - CNAS: 184 sovereign AI projects in 67 countries
   - Counterpoint: 56% of sovereign LLMs adapted from foreign bases
   - Hugging Face: 41% of downloads go to Chinese models
   - Epoch: 0 MW live at Stargate UAE
2. Analysis: sovereignty is mostly infrastructure plus adaptation, and popularity follows distribution.
3. Typology table.
4. Model catalogue table, split by region.
5. Popularity tables: downloads, tokens, home markets.
6. Compute programmes table.
7. "Numbers to stop quoting."
8. FAQ, methodology note, CSV download box (`report-ai-data-sovereign-ai-index-2026.csv`), and links to pages 954–957, 1266, 374, 375, 861 and 1654.

## Verification pass [11 Nov ET verification]

This pass ran on 12 Nov 2026 UTC (evening of 11 Nov, US Eastern) after the network update. Every edit in `sovereign-data.json` carries the tag `[11 Nov ET verification]`, and the full list is in `verification_log` (82 entries). A pre-pass copy of the JSON is in the scratchpad.

### Access results

- **Opened (HIGH):**
  - Hugging Face API and blogs
  - Artificial Analysis models leaderboard (Intelligence Index **v5.0.1**)
  - OpenRouter Rankings
  - Statcounter pages, chart CSVs and FAQ
  - arXiv ATOM PDF
- **Still blocked:**
  - **LMArena:** `lmarena.ai` now redirects to `arena.ai`, which the proxy refuses (403).
  - **PIB:** `pib.gov.in` redirects to `www.pib.gov.in`, which is blocked. `static.pib.gov.in`, `indiaai.gov.in` and `compute.indiaai.gov.in` are also blocked.
  - **These need allowing:** `arena.ai`, `www.pib.gov.in`, `static.pib.gov.in`.

### 1. Hugging Face (30-day = API `downloads`; all-time = `downloadsAllTime`)

- **Coverage:** HIGH figures added to 52 model rows, as an org-wide 30-day sum, an org-wide all-time sum, and flagship repo counts.
  - Not on Hugging Face: UK-LLM, Lumen, GPT-NL, Gnani, tsuzumi, Noetra, Viettel, ILMU, Brazil.
  - Soket's EKA-1 was also not found.
- **Main numbers (30-day downloads, org sum):**
  - Qwen 234.5M
  - DeepSeek 23.4M
  - Zhipu (zai-org) 16.4M
  - Meta Llama 12.3M
  - Mistral 8.12M
  - LG EXAONE 725k
  - PFN 731k
  - Cohere Labs 591k
  - LLM-jp 509k
  - TII Falcon 378k
  - Sber ai-sage 378k
  - SKT 344k
  - Swiss AI 325k
  - Typhoon 320k
  - IFM (MBZUAI) 273k
  - Upstage 186k
  - Sahabat-AI 126k
  - HUMAIN 93k
  - BSC 82k
  - AI Singapore 66k
  - Sarvam 64k
  - TAIDE 54k
  - Naver HyperCLOVA X 34k
  - Jais (`inception42`) 30k
  - Yandex 25k
  - BharatGen 18k
  - KazLLM/ISSAI 5.5k
  - InkubaLM 251
  - **Fugaku-LLM 24**
- **DERIVED comparisons:**
  - The 31 sovereign/national orgs together had 13.56M downloads in 30 days, which is 5.8% of the Qwen org alone. Mistral is 60% of that total.
  - Qwen's org had 19.1x Meta Llama's 30-day downloads.
- **Corrected or added via Hugging Face:**
  - Falcon: 68.7M all-time across TII's repos, against TII's own "55M+".
  - SEA-LION: 1.13M all-time across the org, replacing 235k (May 2025).
  - Apertus: the "30k" figure is gone. Apertus-v1.5-70B has 35,309 all-time and Apertus-8B has 4.44M.
  - Sarvam-M: 955k all-time, so the "334 downloads" story was a launch-week number.
  - KazLLM 8B: 143,889 all-time, which confirms ISSAI's figure.
- **New releases found on Hugging Face, now in `latest_version`:**
  - **Jais 3** (375B-A23B, Apache 2.0, 29 Sep 2026)
  - K-EXAONE 2.0 (750B-A37B, Jul 2026)
  - SKT A.X K2 (353B, Aug 2026)
  - Solar Open 2 (250B, Jul 2026)
  - GigaChat 3.5 (432B-A28B, MIT, Sep 2026). **GigaChat now has open weights.**
  - Yandex AliceAI-Foundation-80B (Apache 2.0, Sep 2026)
  - DeepSeek V4.1 Flash (Sep 2026)
  - Kimi K3.1 Pro (2 Nov 2026)
  - TAIDE on Gemma 3 (Feb 2026)
  - ISSAI Qwen3.5-9B-Kazakh (Aug 2026; ISSAI has moved to a Qwen base)
  - Aleph Alpha Kolibri-1 (Oct 2026)
- **Base models confirmed on model cards:** Fanar-2 is built on `google/gemma-3-27b-pt`. Qwen-SEA-LION-v4.5 is built on `Qwen/Qwen3.6-27B`. Latam-GPT is built on `meta-llama/Llama-3.1-70B`.

### 2. Artificial Analysis (v5.0.1, 107 variants) — LMArena not verified

- **Top 20 distinct models: 15 US, 5 China.** The top nine are all US: Claude Fable 5.2 at 64.6, then Gemini 4 Carbon at 60.0.
- **Best model by country:**
  - US: Claude Fable 5.2, 64.6
  - China: Kimi K3.1 Pro, 46.5 (#10, the top open-weights model)
  - France: Mistral Large 4, 26.1
  - UAE: IFM K2 Horizon 375B, 17.8
  - South Korea: Upstage Solar Pro 4, 14.2 (LG's K-EXAONE 2.0 scores 7.6)
  - Canada: Cohere Command A+, 6.2
  - India, Japan, Germany, Russia and others: no model on the leaderboard
- **This contradicts pages 1654 and 964**, which say "two Chinese models in the global top four". Those scores came from an earlier index version, so the pages need re-baselining. There is also a Qwen inconsistency to resolve: the AA page shows "Qwen3.8 Max (0902)" at 33.7, while OpenRouter's AA panel shows "Qwen3.8 Max" at 53.4.

### 3. OpenRouter (opened)

- **Text requests, week beginning 2 Nov 2026:** DeepSeek 31.8%, OpenAI 19.3%, Google 13.6%, Z.ai 7.4%, Anthropic 5.8%, Qwen 5.7%, Mistral 2.3%, Tencent 2.3%.
- **By country of author (DERIVED):** Chinese authors 47.2%, US 38.7%.
- **By tokens:** Chinese models are 83.4% of the top-10 models' volume (DERIVED). OpenRouter states that its rankings measure neither users nor spend.

### 4. StatCounter: Oct 2026, % of chatbot-referred page views

| Country | ChatGPT | Gemini | Perplexity | other |
|---|---|---|---|---|
| Russia | 23.38 | 32.44 | **39.34** | Claude 2.47, Copilot 2.27, DeepSeek 0.10 |
| South Korea | 23.62 | **65.25** | 8.05 | Copilot 1.92, Claude 1.15 |
| Japan | 34.94 | **45.62** | 7.02 | Copilot 10.09, Claude 2.25 |
| France | **43.33** | 36.38 | 12.05 | Claude 4.65, Copilot 3.59 |
| Germany | **41.50** | 34.88 | 15.87 | Claude 4.04, Copilot 3.68 |
| India | **50.39** | 35.11 | 8.90 | Claude 3.33, Copilot 2.27 |
| China | **42.59** | 32.47 | 5.41 | DeepSeek 19.29 |
| Brazil | 41.02 | **47.07** | 6.36 | Claude 2.97, Copilot 2.59 |
| UAE | **48.65** | 33.87 | 8.94 | Claude 5.27, Copilot 3.21 |
| Saudi Arabia | 40.62 | **41.64** | 9.67 | Claude 4.39, Copilot 3.68 |
| Worldwide | **51.58** | 28.86 | 15.04 | Claude 2.30, Copilot 2.18 |

**What StatCounter measures:** page views on websites that carry Statcounter's tracking code and were *referred by* an AI chatbot. Its pages describe the base as "over 3 billion monthly page views", and its FAQ describes the same referral method for search and social. So the figure counts clicks out of chatbot answers. It does not count users, prompts or sessions.

- **Local assistants are not tracked.** Statcounter lists only six global assistants. Doubao, Qwen, GigaChat, Alice, Naver and Mistral's Le Chat/Vibe do not appear for any of these ten countries. "Le Chat not in top 5" in France should therefore read "not measured".
- **October 2026 is a series break.** Between September and October, ChatGPT fell and Gemini rose by 20–50 points everywhere. Worldwide, ChatGPT went from 80.47% to 51.03%; in Korea, ChatGPT went from 64.30% to 23.35% while Gemini went from 29.35% to 65.53%. This looks like an attribution change, so do not report October as a trend.

### 5. India

- PIB is still blocked, and search found no PIB release from October or November 2026.
- **The count stays at 38,231 GPUs (25 Mar 2026, Lok Sabha; MEDIUM).** The MeitY Secretary already cited ~38,000 in September 2025, so onboarding has barely moved in six months. An unconfirmed report says ~30,000 GPUs are deployed against 45,000 committed.
- Still 12 foundation-model teams.

### Re-check of the three page-1266 problems: corrected wording

**1. Russia (Perplexity ~48%).**
- *Verdict:* the figure exists, but the claim is wrong as written. Statcounter's Russia CSV (all platforms) shows:
  - Perplexity led referrals from Oct 2025 to Apr 2026: 52.5%, then a 69.27% peak in Dec 2025, then 47.92% in Apr 2026.
  - It trailed ChatGPT from May to Sep 2026, falling to 21.33% in September.
  - It led again in Oct 2026 at 39.34%.
- The page's "remained accessible while rivals restricted access" explanation has no source.
- *Replacement sentence:* "Statcounter, which counts clicks from AI chatbots through to websites rather than users, put Perplexity at 47.9% of chatbot referrals in Russia in April 2026 and 39.3% in October 2026, ahead of Google Gemini (32.4%) and ChatGPT (23.4%); it does not track Sber's GigaChat or Yandex's Alice AI."
- *Table row:* "Russia | Perplexity on referral clicks (39.3%, Statcounter, Oct 2026) | ChatGPT on web traffic (~40%, 2025); GigaChat and Alice AI not measured by Statcounter".
- *FAQ answer:* "Perplexity leads Statcounter's Russian referral-click data (39.3% in October 2026), but that measures clicks to websites, not users. Domestic GigaChat and Alice AI are not in Statcounter's data, and an operator-data study (Beeline, Q1 2026) put Alice AI first."
- *Sources:* https://gs.statcounter.com/ai-chatbot-market-share/all/russian-federation (opened); Kommersant / 3DNews.
- *Process:* this needs a corrections-log row.

**2. Korea (HyperCLOVA X most-used).**
- *Verdict:* wrong.
- *Replacement sentence:* "In South Korea, ChatGPT's app had 18.76 million monthly users in October 2026 (Mobile Index), about 91% of AI-app users. Naver's HyperCLOVA X reaches users through search instead: Naver said its AI Briefing answers reach about 30 million people a month (May 2026), after it closed the standalone Clova X chatbot in April 2026."
- *Table row:* "South Korea | ChatGPT (18.8M app MAU, Oct 2026) | Gemini; Naver HyperCLOVA X inside search (AI Briefing ~30M/month)".
- *Supporting facts:*
  - Statcounter (Oct 2026): Gemini 65.25%, ChatGPT 23.62%; Naver not tracked.
  - Hugging Face, last 30 days: `naver-hyperclovax` 33,507 vs LG's `LGAI-EXAONE` 724,713.
  - Naver was cut from the national model project (15 Jan 2026).
- *Sources:* Mobile Index via Hankyung/FourWeekMBA (MEDIUM); Naver press release, 28 May 2026 (MEDIUM); Statcounter Korea (HIGH); HF API (HIGH).

**3. Japan (Fugaku-LLM in the public sector).**
- *Verdict:* unsupported. Remove it.
- *Replacement sentence:* "Japan's Digital Agency began testing three domestic models on its government AI platform Gennai in July 2026 — NTT's tsuzumi 2, Fujitsu's Takane 32B and Preferred Networks' PLaMo 2.0 Prime — with paid procurement planned from fiscal 2027."
- *Table row:* "Japan | ChatGPT | Gemini; domestic tsuzumi 2 / Takane / PLaMo on government trial (Jul 2026)". Statcounter (Oct 2026) has Gemini at 45.62% and ChatGPT at 34.94% (series-break month).
- *Supporting fact:* the Fugaku-LLM org's three Hugging Face repos had 24 downloads in the last 30 days.
- *Sources:* Dempa Digital, 10 Jul 2026 (MEDIUM); HF API (HIGH); Statcounter Japan (HIGH).
