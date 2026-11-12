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

- **The Russia row on page 1266 is unsupported and needs a correction-log entry.** It says Perplexity has "~48%" in Russia, but no source shows that. Statcounter shows ChatGPT at 48.68%, so 48% is most likely ChatGPT's share credited to Perplexity. 2025 web-traffic data has DeepSeek second at 27.8% and GigaChat at 7.3%. A fact-check entry (`#fc-*`) is also worth adding.
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
