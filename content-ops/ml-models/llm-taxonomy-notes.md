# How to categorize large language models: research notes (15 Nov 2026)

Data file: `content-ops/ml-models/llm-taxonomy-data.json`, with the keys `meta`, `dimensions` (8), `models` (93 rows), `aggregates` (22) and `sources` (22). The generator was a scratch script and is not in the repo. Edit the JSON directly. This was research only: nothing was written to WordPress and nothing was committed.

## What was verified and how

- **Opened at source (HIGH):**
  - Hugging Face (`huggingface.co`). For 66 repos we read the API metadata, `config.json`, the README model card and, where they matter, the LICENSE files.
  - 50 arXiv papers and model cards (abstract pages, plus HTML full text for Gemini 1.0, 1.5 and 2.5, Apple 2025 and NVIDIA's SLM paper).
  - Anthropic's Claude Platform models overview and deprecations pages, and nine Anthropic launch posts.
  - Epoch AI: all four model CSVs (downloaded 15 Nov 2026) and the "models over 1e25 FLOP" data insight with its CSV.
  - The Artificial Analysis leaderboard (Intelligence Index v5.0.1). We parsed the page's embedded data: 290 model variants and 526 release dates.
  - The OpenRouter models API.
  - The Hugging Face model-listing counts.
- **Blocked:** openai.com (403), ai.google.dev, deepmind.google, blog.google, opensource.org, eur-lex, artificialintelligenceact.eu, leginfo.legislature.ca.gov, mistral.ai, x.ai, Apple's ML site, ibm.com, DeepSeek's API docs and export.arxiv.org. WebFetch fails DNS for all of them. Facts about OpenAI, Google, xAI, the OSI and the regulations therefore come from Wikipedia, aggregators or search summaries, and are rated **MEDIUM**. Wikipedia rate-limited us (HTTP 429) after six pages.
- **Rows:** 76 are HIGH, meaning the model card, official page or paper was opened and the core fields were seen there. 17 are MEDIUM. Each row's `note` says which fields are weaker. All closed OpenAI, Google and xAI rows are MEDIUM except where an arXiv report covers them (GPT-4, Gemini 1.5, 2.5 and Nano).
- **Table size:** 93 rows, not the ~50–60 in the brief. The brief's required list already comes to about 65 models. Adding one example of every category (diffusion, embedding, guard, medical, on-device, open-source) and the 2026 models (GPT-5.5/6, Claude 5.x, Gemini 4, Muse, Qwen3.8, Kimi K3.1, Mistral Large 4, Inkling) brings it to 93. For a ~60-row on-page table, the easiest cuts are second examples within a family: Qwen3-32B, Gemma 2, Llama 3 70B, Command R+, GPT-6 Sol, Claude 3.5 Sonnet, Mistral Small 3, GLM-5 and DeepSeek-V3.1.

## Headline findings (citation-ready sentences)

1. **Hugging Face:** it listed 3,239,530 public models on 15 Nov 2026, of which 438,509 were tagged text-generation and 47,061 image-text-to-text (HIGH). The site currently says only that the Hub "crossed 2 million public models in 2025".
2. **Epoch's 1e25 list:** Epoch AI's dedicated list (page updated 6 Jun 2025, CSV 21 Nov 2025) has 33 models from 12 developers estimated above 10^25 FLOP. Only 3 have open weights: Llama 3.1-405B, Mistral Large 2 and Nemotron-4 340B (HIGH). The list stops at May 2025.
3. **Epoch's main database:** on 15 Nov 2026 it held 28 entries (27 distinct models) with a point estimate of at least 10^25 FLOP, 8 of them open-weight. 4 exceed 10^26 FLOP: Grok 3, GPT-4.5, Grok 4 and GPT-6 Astra, all closed (HIGH; the count is DERIVED). Three open-weight models released in 2026 cross 10^25 on Epoch's estimates: Mistral Large 4 (1.24e25, Confident), Inkling from Thinking Machines (1.1e25, Likely) and Kimi K3/K3.1 Pro (2e25, Speculative). Meituan's LongCat-2.0 (1.01e25) is a fourth.
4. **Open–closed gap:** on Artificial Analysis's Intelligence Index v5.0.1 (read 15 Nov 2026), the best proprietary model, Claude Fable 5.2 at max effort, scores 64.6. The best open-weights model, Kimi K3.1 Pro, scores 46.5. The gap is ~18 points (HIGH; the gap is DERIVED).
5. **Shares on Artificial Analysis:** 44 of the 113 indexed model variants (38.9%) are open-weights, and 108 (95.6%) are reasoning variants (HIGH; counts DERIVED, and they count variants, not distinct models).
6. **MoE has become the default for open weights:** in our table, 27 of 43 open-weight models released in 2025–26 (62.8%) use MoE layers, against 5 of 18 in 2023–24 (27.8%) (DERIVED, depends on which models we selected).
7. **Reasoning went from rare to standard:** 1 of 27 table models from 2023–24 has a reasoning mode (o1, Dec 2024), against 43 of 64 from 2025–26 (67.2%) (DERIVED).
8. **Closed models disclose almost nothing:** of 32 closed models, 25 do not disclose even their architecture family. Only Gemini Nano and Apple's on-device model have official parameter counts (DERIVED). Google is the one closed lab that disclosed MoE, for Gemini 1.5 and 2.5, without giving sizes.
9. **Total parameters ≠ training compute:** DeepSeek-V4-Pro has 1.6T total and 49B active parameters, yet Epoch puts it at 9.7e24 FLOP, below the EU AI Act's 10^25 presumption. Kimi K3.1 Pro (2.8T total, 104B active, the largest model in the table by total parameters) is estimated at only 2e25 (Speculative), and Qwen3.8-2.4T-A95B has no Epoch estimate.
10. **New categories in 2026:**
    - Google's DiffusionGemma 26B A4B is the first open-weight diffusion LLM from a frontier lab (Apache 2.0, June 2026).
    - Gemma moved from the Gemma Terms of Use to Apache 2.0 with Gemma 4 (Apr 2026).
    - Meta's first frontier model without open weights was Muse Spark (8 Apr 2026, closed). Its open-weight line now runs under the Muse Model License: Muse Spark Open has 816B total and 42B active parameters (15 Oct 2026). Its licence requires "Built with Muse Spark Open" attribution and a separate licence for model-as-a-service businesses above $20M revenue.
11. **Hybrid linear attention reached the open frontier:**
    - Kimi K3 and K3.1 Pro use 69 Kimi Delta Attention layers plus 24 gated MLA layers.
    - Qwen3-Next, Qwen3.8-27B and Qwen3.8-2.4T use a 3:1 Gated DeltaNet to gated-attention layout.
    - MiniMax went the other way. M1 used hybrid lightning attention, but M2's config has full attention in all 62 layers.
12. **Regulatory thresholds (MEDIUM; legal texts were not reachable):**
    - The EU AI Act Art. 51 presumption is above 10^25 FLOP. Secondary sources say the May 2026 Digital Omnibus agreement did not change it.
    - EO 14110's 10^26 threshold (10^23 for models trained mainly on biological sequence data) was rescinded on 20 Jan 2025. Sources differ on whether EO 14148 or EO 14179 rescinded it.
    - California SB 53 uses more than 10^26 operations, including fine-tuning. It was signed 29 Sep 2025 and took effect 1 Jan 2026.
    - New York's RAISE Act uses 10^26 plus a compute cost above $100M. The final chapter amendment was signed 27 Mar 2026, effective 1 Jan 2027.
    - On Epoch's point estimates, only GPT-6 Astra (9.4e26), Grok 4 (5e26), GPT-4.5 (3.8e26) and Grok 3 (3.5e26) clear 10^26.

## Taxonomy as built (8 dimensions)

Each dimension has category definitions with primary-source quotes (each under 25 words) and examples. All counts below describe our table and are DERIVED.

| Dimension | Categories (count in table) |
|---|---|
| Architecture | MoE 28, dense 26, undisclosed 25, hybrid SSM/linear-attention 10, diffusion 4. Encoder-only and encoder–decoder are defined for contrast only (BERT, T5) and have no rows. |
| Training stage / reasoning | none 47, reasoning 25, hybrid 19, not verified 2 (Muse Spark, GLM-5). Base and agentic are covered as definitions and the `agentic_trained` flag. |
| Openness | open-weight 57, closed 32, open-source 4 (Pythia, OLMo 2, Olmo 3, Apertus). Licence class: permissive 29, restricted 24, non-commercial 4. |
| Modality | text-only 50, multimodal input 41, omni 1 (GPT-4o), embedding output 1. Image-output models (Nano Banana) are defined but have no rows. |
| Size | frontier 32, mid-size 24, large 23, undisclosed efficient tier 6, on-device 4, small (<10B) 4 |
| Specialisation | general 88, code 2, medical 1, embedding 1, guard 1. Maths is defined only; AlphaProof is mentioned from site data. |
| Compute class | no estimate 33, 1e24–1e25 28, 1e25–1e26 14, <1e24 10, ≥1e26 4, ≥1e25 by Epoch's assessment without a point estimate 4 |
| Origin | AI lab 46, big tech 38, academic/non-profit 6, government 3. 31 rows belong to families listed in the Sovereign AI Index. By country: US 58, China 19, France 5, UAE 3, Canada 2, one each for Israel, Switzerland, Germany, South Korea, India and Japan. |

**Judgement calls (document these in the page's methodology note):**
- **Frontier rule (DERIVED):** a model counts as frontier if it has Epoch's top-5-by-compute flag, or an Epoch estimate of at least 1e25, or is the top-tier closed flagship of a developer with a ≥1e25 run on record (OpenAI, Anthropic, Google DeepMind, xAI, Meta). We need the extension because Epoch has no compute estimates for most 2025–26 closed flagships. Epoch's own flag stops at Grok 4 (Jul 2025) and then GPT-6 Astra.
- **Reasoning labels:**
  - "reasoning" means the model always reasons, even if the effort level is adjustable. "hybrid" means thinking can be switched off or given a zero budget.
  - GPT-5 is classed hybrid at the product level, because Wikipedia describes it as a routed system.
  - The Fable 5 and Mythos 5 labels are MEDIUM. Anthropic documents "Adaptive (always on)" thinking only for Fable 5.2 and Opus 5.5.
- **Small (<10B):** this follows the NVIDIA paper (arXiv 2506.02153). Its working definition is functional (fits on a consumer device), plus the remark that most models below 10bn parameters count as small as of 2025. No regulator defines the term.
- **Gemma 3n "active" parameters:** the 4B is Google's "effective" size, a memory-footprint figure, not MoE routing.
- **Hybrid architecture:** sliding-window or compressed attention (Gemma, DeepSeek-V4 CSA/HCA, K-EXAONE's 3:1 sliding/global) is still attention, so it is not counted as hybrid.

## Conflicts with existing site data

| # | Site file / page | Site says | Found | Source |
|---|---|---|---|---|
| C1 | models.json `aa_open_weight_gap` (pages 861/964) | Open–closed gap of 12 points on AA v5 (Oct 2026); ~26 points counting only published weights, because Kimi K3.1 Pro's weights were "not yet published" | Kimi K3.1 Pro's weights went up on Hugging Face on 2 Nov 2026, so the "published weights only" variant no longer applies. On 15 Nov the gap is 64.6 − 46.5 ≈ 18 points, after Claude Fable 5.2 launched on 9 Nov | HF `moonshotai/Kimi-K3.1-Pro` (created 2026-11-02); AA leaderboard 15 Nov |
| C2 | models.json `flagship_context_window` gaps | "Opus 5.5's window not confirmed" | 1M tokens, 128K max output | Anthropic models overview (HIGH) |
| C3 | models.json `largest_training_compute` 2026 | No public 2026 estimate | Epoch: GPT-6 Astra 9.4e26 (Likely). Also already listed in followups F | Epoch database |
| C4 | sovereign-data.json, Qwen row | "Qwen3.8-Max 2.4T total / 95B active (closed)"; open weights "mostly (flagship Max closed)" | The underlying Qwen3.8-2.4T-A95B weights have been public on Hugging Face since 8 Aug 2026 under a custom "qwen3.8-max" licence. The card says Qwen3.8-Max is "the official version based on" these weights, adding vision, non-thinking mode and 1M context. Better wording: the hosted Max service is closed, but its 2.4T base is open-weight | HF `Qwen/Qwen3.8-2.4T-A95B` |
| C5 | sovereign-data.json, Jais row | build_type "from scratch (2.6T tokens; trained and served on Cerebras)", latest version Jais 3 | The Jais 3 paper (arXiv 2611.10224, 6 Nov 2026) says: "Instead of pretraining from scratch, we adapt each model of the fully open K2 Horizon fleet to Arabic through continual pretraining." The from-scratch label fits Jais 1/2, not Jais 3 | arXiv 2611.10224 (HIGH) |
| C6 | history-data / Epoch usage | GPT-4.5 3.8e26 and Grok 3 3.5e26 (Epoch database) | Epoch's own 1e25 CSV (Nov 2025) gives GPT-4.5 2.1e26 (Speculative) and Grok-3 4.64e26 (Confident). The site uses the newer database values, which is right, but any page that cites "Epoch's 1e25 list" needs to say which file | Epoch 1e25 CSV vs all_ai_models.csv |
| C7 | followups E / models.json | Fable 5.2 pricing "to check" | Confirmed: Claude Fable 5.2 and Mythos 5.2 cost $8/$40 per M tokens with 1M context; Fable 5.1 and Fable 5 cost $10/$50 | Anthropic models overview (HIGH) |
| C8 | sovereign-data.json, Teuken row | Release 2024-11-26 | Epoch dates Teuken 7B 2025-08-21 and labels it non-commercial (the research variant). The Hugging Face commercial-variant repo was created 25 Oct 2024 under Apache 2.0. Keep the site's date and treat Epoch's as a discrepancy | Epoch, HF API |
| C9 | (external, not the site) Epoch's Kimi K3 accessibility | Epoch labels Kimi K3 "Open weights (non-commercial)" | The Kimi K3 LICENSE allows commercial use. It adds terms only for model-as-a-service operators above $20M revenue and products above 100M MAU or $20M monthly revenue | HF `moonshotai/Kimi-K3/LICENSE` |

## Possible site errors (do not fix silently: each needs a corrections-log row on 3229 if confirmed)

1. **"Llama 5" (page 964, Best AI Models 2026, and models.json `frontier_releases` / `flagship_context_window`).** The site says Llama 5 was "announced April 8, 2026" as a "~600B open-weight model" with a 5M-token context window, and models.json lists "Llama 5 (8 Apr)" and "Llama 5, 5M tokens".
   - **Evidence against:**
     - The `meta-llama` org on Hugging Face has no repo newer than Apr 2025 (Llama 4, Llama Guard 4, Prompt Guard 2).
     - Neither Epoch's database (3,709 models) nor Artificial Analysis (526 releases) nor OpenRouter (467 models) has any Llama 5 entry.
     - Meta's 8 Apr 2026 release was **Muse Spark**, a closed model (Bloomberg, The Decoder).
     - Meta's later open-weight releases are Muse Glimmer 30B (Apache 2.0, Aug 2026) and Muse Spark Open 816B-A42B (Oct 2026, 1M context).
     - The "Llama 5 released" stories trace to a few aggregator sites, and OrcaRouter's posts rebut them.
   - **Recommendation:** check Meta's newsroom in a browser. If it is unconfirmed, remove Llama 5 from 964 and models.json, replace it with Muse Spark Open as the open-weight long-context pick, and add a fact-check entry on 3227 (this is a widely repeated claim).
   - The "largest advertised context" for 2026 would then fall back to Llama 4 Scout's 10M tokens (Apr 2025). Among 2026 releases, 1M (Muse Spark Open, Kimi K3.1 Pro, Mistral Large 4, DeepSeek-V4) is the most common. Gemini 3.1 Pro's "2M" was not verified this session.
2. **Jais 3 "from scratch"** (sovereign-data.json, and any page built from it, e.g. 3915 or 934): see C5. The Sovereign AI Index typology lists Jais under "from scratch". For Jais 3 it should be "adapted (continual pre-training of MBZUAI's K2 Horizon)". K2 Horizon is itself UAE-built, so the sovereign framing survives but the build type changes.
3. **Qwen3.8-Max "closed"** (sovereign-data.json): see C4. Partially wrong: the weights are open-weight under a custom licence.
4. **Site HF count stale:** "Hugging Face itself crossed 2 million public models in 2025" is not wrong, but it is stale. On 15 Nov 2026 the Hub listed 3,239,530.

## Open questions and gaps

- **OpenAI (MEDIUM, all via aggregators):**
  - GPT-4o modalities and o1/o3/GPT-5 context windows.
  - Whether GPT-5.5 and GPT-6 can run with reasoning fully off.
  - GPT-6 Sol tiering (OpenAI pages return 403).
- **Google:**
  - Gemini 3 Pro and Gemini 4 Argon details are MEDIUM. Argon's date is ambiguous: announced 30 Sep 2026 for cyber defenders, broadly available 13 Oct (Epoch and the site use 13 Oct; Artificial Analysis uses 30 Sep).
  - Gemini 2.0 Flash is labelled MoE by inference from the Gemini 2.X report's framing (MEDIUM).
- **xAI:**
  - xAI appears as "SpaceX Super Intelligence (SpaceXSI)" on Wikipedia and as "SpaceXAI" on OpenRouter and Artificial Analysis. The site should check the current legal name before using either.
  - Grok-1's 8-expert/2-active split and its 8K context were not re-read (MEDIUM). Grok 2's parameter count is not published (~500 GB of weights).
- **GLM-5 reasoning mode** was not verified. GLM-4.5 is hybrid; GLM-5.3 shows reasoning variants on Artificial Analysis.
- **Regulation:**
  - EUR-Lex and the OSI site were unreachable. The Art. 51 wording and the OSAID text are MEDIUM.
  - The claim that the EU Omnibus did not change the threshold rests on blogs. One blog names Regulation (EU) 2026/1744, which could not be confirmed. The site's followups also cite "Omnibus 2026/1744", so check that number against the Official Journal.
  - The EO 14110 rescission instrument is CONTESTED (EO 14148 vs EO 14179).
- **Epoch coverage:** Epoch has no compute estimates for Claude 4.x/5.x, Gemini 2.5–4, GPT-5.5/6 Sol or Muse. Any "share of models above 10^25" figure undercounts closed 2025–26 models. Its 1e25-specific list was last refreshed in Nov 2025.
- **Unopened OSAID validation list:** "Pythia, OLMo, Amber, CrystalCoder, T5 passed; Llama 2, Grok, Phi-2, Mixtral did not" comes from search summaries of OSI's announcement (MEDIUM). Apertus and Olmo 3 meet the components by their developers' descriptions but were not validated by OSI.
- **LLM-jp-4.1:** our notes call it "fully open", but the pre-training data release was not checked, so the row stays open-weight.
- **Context windows not verified this session (MEDIUM, flagged in row notes):** Llama 2 70B (4,096), Llama 3 70B (8,192), Gemma 2 27B (8,192), Nemotron-4 340B (4,096), Falcon-180B (2,048), Claude 3.7 Sonnet (200K), Grok-1 (8,192) and Grok 4 (256K).

## Suggested internal links for the report

- Sovereign AI Index (`/indexes/geography-of-ai/sovereign-ai-index-2026/`) for the origin dimension.
- Open vs Closed AI Models 2026 (`/indexes/technical-benchmarks/open-vs-closed-ai-models-2026/`) for the openness and gap figures.
- Chinese AI Models 2026 (page 1654) for DeepSeek, Qwen, Kimi and GLM.
- State of AI Models & Prices 2026 (draft 3628) and the LLM Token Price Index (`/indexes/ai-economics/llm-token-price-index/`).
- AI Regulation by Country (page 1100) and the EU AI Act pages (573/503/353) for the compute-threshold section.
- AI Development Index draft (3789) for the Epoch compute series.
- Glossary terms worth creating if missing: mixture of experts, active parameters, test-time compute, hybrid reasoning, open-weight vs open-source, state-space model, diffusion LLM, small language model.

The page will need a CSV ("Download the data" box) built from `models` in long format, as CLAUDE.md requires for pages with tables.
