# AI Use by Country 2026: research notes (12 Nov 2026)

This is read-only research for the planned index "AI Use by Country 2026: Adoption Across the World". Nothing was written to WordPress.
Data file: `content-ops/geo/ai-use-data.json`.

## Coverage

| Block | What's in it | Confidence |
|---|---|---|
| `country_table` | 153 economies. 147 come from Microsoft's AI Diffusion dataset: all four editions (H1 2025, H2 2025, Q1 2026, Q2 2026), the Q2 rank, and pp and relative change. 6 more are EU/EEA economies that have only Eurostat data (CY, EE, LV, LU, MT, MK). Added where available: Anthropic AUI and usage share, Eurostat individuals (2025) and enterprises (2024/2025), ITU internet use, Ipsos 2026 sentiment, Pew 2025, Similarweb chatgpt.com country share, Microsoft's DeepSeek share map, and national trackers (CNNIC, QuestMobile, MIC Japan, Cetic.br, APJII, Mediascope, Mobile Index/Wiseapp, Sensor Tower, OpenAI India, World Bank firms, Census BTOS, BCG, GWI) | Microsoft, Anthropic, Eurostat-individuals, ITU: **HIGH** (primary dataset or report opened). Most others: MEDIUM |
| `world` | Microsoft world, Global North and Global South for four editions; the North-South gap; ITU connectivity; OECD, KPMG, Ipsos, Pew, Stanford; ChatGPT and Gemini user counts; Anthropic concentration; Google ATLAS | mixed |
| `surveys` | 18 cross-country and national surveys, each with its measure and base | mixed |
| `traffic` | Similarweb Oct 2026 shares, chatgpt.com shares by country, StatCounter referral shares (world and Russia), QuestMobile China, Korea apps, India apps, Russia (Mediascope), DeepSeek share map | MEDIUM except the Microsoft map |
| `regions` | Regional averages by World Bank region, weighted by working-age population (DERIVED), plus summaries for Africa, Middle East, SE Asia, South Asia, LatAm, EU and US states | DERIVED / HIGH / MEDIUM |
| `growth` | Fastest risers (relative and pp), quarterly movers and declines, Microsoft's own growth chart, large-economy table, Korea and UAE profiles, national-tracker growth | DERIVED / HIGH |
| `stop_quoting` | 12 entries | |
| `stale_on_site` | 14 items on page 1266 | |

## Headline findings for the page

1. **Microsoft (HIGH):** the world figure is 18.8% of people aged 15-64 in June 2026. The series runs 15.1% (H1 2025), 16.3% (H2 2025), 17.8% (Q1 2026), 18.8% (Q2 2026).
   - Global North: 22.9% to 28.8%. Global South: 13.1% to 16.2%.
   - The gap widened in every edition: 9.8, 10.6, 12.1, then 12.6 pp.
2. **Leaders, Q2 2026:**
   - UAE 73.3%, Singapore 64.3%, Ireland 49.9%, France 49.6%, Norway 49.4%.
   - Korea is 12th at 40.6%. The US is 21st at 33.0%.
   - Lowest: Cambodia 6.1%, Afghanistan, Tajikistan and Turkmenistan 6.3%.
3. **Largest economies, Q2 2026:** Germany 32.3%, UK 43.7%, France 49.6%, Japan 24.7% (45th), Brazil 20.2%, India 18.5% (64th), China 17.5% (67th), Indonesia 14.8%, Nigeria 10.4%, Russia 9.9%.
4. **Fastest growth from H1 2025 to Q2 2026 (DERIVED):**
   - Relative: South Korea +56.8%, Japan +47.9%, Thailand +47.3%, Mongolia +42.1%, Turkey +41.0%.
   - Absolute: Korea +14.7 pp and UAE +13.9 pp.
   - Slowest: Ukraine +4.4%, Papua New Guinea +5.6%, Gambia +8.5%, Norway +9.1%. Norway's slow rate is a ceiling effect, since it started high.
   - Only Syria and Papua New Guinea fell in Q2 (each −0.1 pp).
5. **Regional averages for Q2 2026 (DERIVED, weighted by working-age population):**
   - North America 33.6%, Europe & Central Asia 26.6%, Latin America 20.1%, East Asia & Pacific 18.9%, MENA 18.2%, South Asia 16.4%, Sub-Saharan Africa 10.6%.
   - Check: the same weighting applied to all 147 economies gives 18.8% for Q2 2026, matching Microsoft's published figure. The economies cover 98.6% of the world's working-age population.
6. **18.8% × 5.26B working-age people (2023) ≈ 0.99B users (DERIVED, order of magnitude).** That is lower than ChatGPT's 1B+ *weekly* users alone. The Microsoft series undercounts, above all in China and Russia, where domestic tools are not measured.
7. **Claude per capita, Anthropic (HIGH):**
   - Aug 2025 sample: Israel 7.0, Singapore 4.57, Australia 4.10, NZ 4.05, Korea 3.73, US 3.62 … India 0.27, Nigeria 0.2.
   - Feb 2026 sample: Canada 4.4, Australia 4.1 (7th).
   - India is 2nd by volume but 101st of 116 per capita.

## Judgement calls

- **Microsoft is the spine of the country table.** It is the only source that covers 147 economies on one definition over four dated editions, and its primary data (GitHub CSV and PDFs) opened.
  - The dataset reproduces the PDF tables exactly; I spot-checked UAE, US, Korea, Japan and China.
  - H1 2025 values come from the dataset as carried in the Q2 2026 update. The first report (Oct 2025) is an image-only PDF, so I could not check whether H1 2025 was later restated. It matches data/geography.json (UAE 59.4%, US 26.3%).
- **Imputed values are flagged.** 36 economies have identical values in all four editions within their group:
  - 12 West African economies, Nigeria and Ghana among them, at 10.4%.
  - 8 East African economies at 8.0%.
  - 5 Central African economies.
  - Angola, Madagascar, Malawi and Mozambique.
  - Venezuela, Guyana, Suriname and French Guiana.
  - Afghanistan, Tajikistan and Turkmenistan.

  These are regional estimates, not national measurements. Each carries a note, and Nigeria has a stop-quoting entry.
- **China and Russia are under-measured by Microsoft.**
  - Microsoft says its Q2 tool list omits several Chinese domestic tools. The next edition will add them, and Microsoft expects China to rise the most.
  - I kept the Microsoft values but always pair them with CNNIC, QuestMobile and Mediascope, labelled as different measures.
- **Ranks:**
  - Ranks 1-30 are Microsoft's printed ranks.
  - All other ranks are DERIVED (1 + the number of economies with a higher value), so ties share a rank.
  - China's derived rank of 67 matches Microsoft and data/geography.json.
- **Regional averages are DERIVED.**
  - They use UN WPP 2023 population aged 15-64 (via OWID) as weights. Microsoft does not publish its regional method.
  - Regions follow the World Bank grouping. Israel is in MENA, Turkey in Europe & Central Asia, French Guiana in LatAm.
- **Eurostat individuals' data is rated HIGH** because the dataset was opened. It came through OWID's copy (updated 7 Apr 2026), not eurostat.ec.europa.eu, which is blocked.
  - Eurostat enterprise figures are MEDIUM (secondary).
  - The 2024 enterprise values in some aggregators are often mislabelled as 2025; I used the 2025 values from the Eurostat release coverage.
- **Survey bases are not comparable, so every row states its base.** Examples:
  - Japan: 58.8% (MIC, ever used, online panel aged 15-69) against 24.7% (Microsoft, 15-64 telemetry).
  - China: 93.6% (MIC online panel), against CNNIC's "above 50%", against Microsoft's 17.5%.
  - Kenya: 97.5% (GWI, online adults) against 8.9% (Microsoft).
- **Ipsos 2026 country figures:** superseded by the verification pass. They are now HIGH, read from the primary PDF, and Japan's 47% excited / 31% nervous is confirmed.
- **The Stanford "benefits outweigh drawbacks" country values** (China 83, Indonesia 80, Thailand 77, US 39, Canada 40) are the 2024 Ipsos wave. The verification pass confirmed this against the trend columns in the Ipsos 2026 PDF.
- **The Korean, Indian and Russian tracker figures are single secondary readings.**
  - Korea (Mobile Index, Wiseapp), India (Sensor Tower, OpenAI India MD) and Russia (Mediascope) all fall in this group.
  - The Mediascope Alice AI figure (~48% reach) comes from several outlets but not from Mediascope's own release.

## Stale or wrong on page 1266 (needs editor action)

All 14 items are listed in `stale_on_site`. Two of them look like **corrections, not refreshes**, and so need rows in corrections log 3229:

- **Russia "most-used = Perplexity, ~48%":** this is a StatCounter *referral* share from April 2026. Usage data puts Alice AI, DeepSeek and GigaChat ahead, and StatCounter's own August reading has ChatGPT ahead of Perplexity.
- **South Korea "most-used = HyperCLOVA X":** app trackers give ChatGPT about 91% of Korean AI-app users.

The remaining refreshes:
- Doubao 382M → 419.08M; Qianwen 167M → ~158M; DeepSeek 130M → ~122.65M; China apps 499M → 546M.
- ChatGPT's web share 53.9% → 55.7% (Oct 2026).
- ChatGPT "1.1B monthly" → 1B+ weekly; Gemini 662M → 1B+ monthly.
- India "198M, #2" → now #1 by weekly users (OpenAI India, 3 Nov 2026).
- Growth figures from the Q1 to the Q2 edition.
- The Anthropic per-capita values were from Aug 2025 and need dating.
- The QuestMobile rating should drop from HIGH to MEDIUM.
- The "Updated August 2026" stamp does not match dateModified (29 Oct).
- The untraced 59.8% → 68.9% non-work figure.
- The unsourced US 61.7% and Europe 70.8% shares.

## Gaps

- **Microsoft's US-state table** (United States AI Diffusion Q1 2026, 27 May 2026) is an embedded app. Only Colorado (32.3%, 15th) and Arkansas (26%, 40th) were found, both secondary.
- **Google/Gemini country figures:** the ATLAS v1.0 PDF on ai.google is blocked. There are no country numbers, only its qualitative findings. Gemini by country exists only for India (118M app MAU, Jan 2026) and Korea (9.87M).
- **OpenAI per-country user counts:** India has no absolute November figure. There is no OpenAI country table, and openai.com and cdn.openai.com are blocked.
- **The KPMG/Melbourne 47-country table:** closed in the verification pass. All 47 countries are now in the data at HIGH.
- **McKinsey regional adoption** was not collected (mckinsey.com is blocked). The Similarweb per-country shares for Gemini, DeepSeek, Perplexity and Claude were not found.
- **Appfigures and Sensor Tower:** downloads by country only for India.
- **Pew 2025 country values** are partial: South Korea 16% concerned, UK, Argentina and Spain 39%, France 35%.
- **Anthropic AUI for 2026 by country:** only Canada and Australia are published. The full country file is on huggingface.co, which is blocked.
- **Indonesia, APJII:** the reported fall from ~27% to 18.2% is unexplained (possibly a question change). Do not headline it as a decline.
- **Language coverage:** the only quantified points are Google ATLAS (English is about a third of Gemini conversations) and Microsoft's MMMLU/Korean CSAT discussion. There is no clean "languages served" statistic.
- **The Pebblous critique** (aggregates can't be recomputed) is carried from data/geography.json, not re-read. Our derived reweighting does reproduce 18.8%.

## Blocked hosts (network proxy; no workaround attempted)

The full list is in `blocked_hosts`. Main ones:

- **Microsoft:** blogs.microsoft.com, news.microsoft.com, aka.ms, microsoft.ai, api.github.com (raw.githubusercontent.com worked).
- **AI companies:** openai.com, cdn.openai.com, ai.google, huggingface.co.
- **Research and statistics bodies:** hai.stanford.edu, kpmg.com, assets.kpmg.com, mbs.edu, www.ipsos.com, ec.europa.eu, eurostat.ec.europa.eu, www.oecd.org, www.census.gov, www.pewresearch.org, www.itu.int, data.worldbank.org.
- **Trackers:** www.similarweb.com, gs.statcounter.com, www.questmobile.com.cn, 36kr.com, www.cnnic.net.cn.
- **Other:** arxiv.org, www.nber.org, epoch.ai, plus most news sites.

Reachable: www.microsoft.com, www.anthropic.com, ourworldindata.org, en.wikipedia.org, raw.githubusercontent.com.

## Verification pass [11 Nov ET verification]

Nine hosts were allowed after the first pass, and I used six of them. Every change in `ai-use-data.json` carries a `"verified": "[11 Nov ET verification] …"` field, and there is a `verification_log` array at the top level. A pre-edit copy of the file is in the scratchpad (`geo_build/ai-use-data.pre-verify.json`).

### 1. Microsoft AI Diffusion methodology (HIGH)

**Sources opened:**
- the technical paper (Misra et al., arXiv 2511.02781)
- the On the Issues blogs for H2 2025 (8 Jan 2026), Q1 2026 (7 May 2026), Q2 2026 (21 Sep 2026) and US Q1 2026 (28 May 2026)

**Definition, quoted in Q1 and Q2 2026:** "the share of people worldwide between ages 15 and 64 who have used a generative AI product during the reported period … derived from aggregated and anonymized Microsoft telemetry … adjusted to reflect differences in OS and device-market share, internet penetration, and country population". The H2 2025 blog leaves out the age band.

**Mechanics (from the paper):**
- AI User Share = (% of Microsoft telemetry users who visit listed AI sites) × (desktop device penetration) × (a mobile scaling factor based on StatCounter's mobile/desktop ratios), minus an estimated desktop/mobile overlap.
- The telemetry is mainly Windows PC and tablet.
- Only users with at least 90 minutes of total monthly usage count.
- Countries with low telemetry opt-in, "particularly in parts of Europe", are blended toward the global average.
- The denominator is World Bank population aged 15-64.
- The measure covers 19 named sites/apps. These include Alice, GigaChat, CLOVA X, ERNIE and Tongyi Qianwen, but not Doubao, Kimi or Yuanbao.

**Regional modelling:** 36 economies are marked † "Region-imputed estimate due to insufficient telemetry coverage". The list matches the 36 identical-value economies I had flagged in the first pass exactly. Their notes now cite the paper.
- Telemetry is "limited" in Russia, Iran and "partly China"; notes added to those countries.
- 111 of the 147 economies have their own country-specific estimates.

**H1 2025 check:** the dataset's H1 2025 values equal the paper's Table 2 for all 147 economies, so there was no restatement.

**Added data:**
- The paper's "connected population" share (AI users as a % of internet users, H1 2025) for 137 economies.
- Microsoft's US county averages: metro 32.9% vs rural 16.2%; counties with high 18-24 shares 28.6% vs 20.3%.

**Still blocked:** the full US state table sits behind aka.ms.

### 2. KPMG / University of Melbourne 2025 (HIGH)

All values come from the global report PDF on assets.kpmg.com. Figure 43 is a chart, so I rendered the page and read the values from the image.

**General population, Figure 2:** % using AI at least every few months, for all 47 countries.
- Highest: India and Nigeria 92%, UAE 91%, Egypt 90%, China 89%.
- Lowest: Belgium 47%, Netherlands 43%.
- US 53%, UK 52%, Germany 51%, Japan 50%.
- Correction to the first pass: emerging economies average 80% and **advanced economies 58%**, replacing "most below 70%".

**Trust and acceptance, Figure 13:**
- Trust ranges from Nigeria 79% down to Finland 25%. Japan 28%, US 41%.
- High-acceptance shares are added for every country.

**Work, Figure 43:** % of employees using AI at work, and % trusting AI at work.
- Use: India 91% down to the Czech Republic 33%. US 52%, Japan 44%.
- Trust: from Japan 31% up to India and Nigeria 81%.
- Overall: 58% use, 53% trust.

**Frequency, Figure 1:** daily 21%, weekly 17%; 38% use AI weekly or daily.

### 3. Ipsos AI Monitor 2026 (HIGH)

Source: the primary PDF. The survey covered 32 countries and 23,532 adults, from 20 March to 3 April 2026.

**Added for all 32 countries:** % excited, % nervous, % saying benefits outweigh drawbacks, and % saying AI saved them time at work.
- 32-country averages: excited 51%, nervous 50%, benefits 55%, saved time 62%.
- Japan is confirmed at 47% excited, 31% nervous.
- Every secondary value from the first pass matched the primary.
- New: China nervous 40%; China saved time 90%; Korea excited 74%, nervous 40%.

**Stanford HAI:** the country values I had attached to it are the 2024 Ipsos wave. The 2026 figures are China 85%, US 38% and Canada 34% saying benefits outweigh drawbacks.

### 4. Eurostat (HIGH, from the Eurostat dissemination API)

**Enterprises using at least one AI technology, isoc_eb_ai, 10+ employees:** 2024 and 2025 for 34 countries.
- EU 13.48% → 19.95%.
- Denmark 42.03%, Finland 37.82%, Sweden 35.04% vs Romania 5.21%, Türkiye 7.41%, Poland 8.36%.
- Greece fell from 9.81% to 8.93%.
- All earlier secondary values matched to rounding.

**Individuals, isoc_ai_iaiu, 2025, ages 16-74:**
- Any gen-AI use, EU 32.66%: identical to the OWID copy, so now sourced to Eurostat directly.
- Use for work, EU 15.36%.
- Ages 16-24, EU 63.81%.

**New rows:** Montenegro and Kosovo.

### 5. StatCounter AI chatbot share (HIGH)

Sources: country pages for October 2026, the Russia CSV export for Oct 2025-Oct 2026, the FAQ, and the press release of 7 May 2026.

**What it measures:** the share of page views *referred by* AI chatbots to the 1M+ websites running StatCounter's tracker, across all platforms. In plain terms, which chatbot sends clicks onward. It is not usage or user share.
- Grok is excluded because it sends no referrer.
- Local assistants (Alice, GigaChat, Doubao, CLOVA X, Meta AI) are not listed.
- Proof that it is not usage: StatCounter shows ChatGPT at 42.59% in China.

**October 2026, ChatGPT / Gemini / Perplexity:**

| Market | ChatGPT | Gemini | Perplexity |
|---|---|---|---|
| World | 51.58 | 28.86 | 15.04 |
| Russia | 23.38 | 32.44 | **39.34** |
| Korea | 23.62 | **65.25** | 8.05 |
| Japan | 34.94 | **45.62** | 7.02 |
| India | **50.39** | 35.11 | 8.90 |
| Brazil | 41.02 | **47.07** | 6.36 |
| France | **43.33** | 36.38 | 12.05 |
| Germany | **41.50** | 34.88 | 15.87 |
| UK | **44.43** | 31.14 | 9.67 |
| US | **37.10** | 35.42 | 10.34 |

Copilot is about 10-11% in Japan, the UK and the US.

**Russia series (CSV):**
- Perplexity led from Oct 2025 to Apr 2026, peaking at 69.27% in Dec 2025.
- April 2026 was **47.92%**, the likely source of page 1266's "48%".
- ChatGPT led May-Sep 2026; Perplexity led again in Oct 2026.

### Exact corrected wording for page 1266

The full replacement texts are in `stale_on_site[*].corrected_wording`. Both items need a row on corrections log 3229.

**Russia**

- **Stat tile.** Replace "48% — Perplexity's share in Russia — the map's strangest line" with:
  > "55% — Russians aged 12+ who used an AI service in September 2026; Yandex's Alice AI reached about 48% (Mediascope)"
- **Table row.** Replace it with:
  > "Russia | Alice AI — Yandex (about 48% monthly reach of people aged 12+, Mediascope, Sep 2026) | DeepSeek (11%, 13M), GigaChat — Sber (5%, 6M) | US assistants face access and payment restrictions, so built-in and free tools win: Alice ships inside Yandex search and browser, and DeepSeek took 43% of the generative-AI use Microsoft could measure in Russia in H2 2025"
- **FAQ.** Replace "Why does Perplexity dominate Russia?" with the question "Which AI do Russians use most?" and this answer:
  > "Yandex's Alice AI. Mediascope's September 2026 data show 55% of Russians aged 12 and over used an AI service that month; Alice AI reached about 48%, DeepSeek 11% (13 million people) and Sber's GigaChat 5% (6 million). Microsoft estimated that DeepSeek accounted for 43% of the generative-AI use it could measure in Russia in the second half of 2025. Perplexity's lead in StatCounter data (39.34% in October 2026) measures referrals — clicks from a chatbot answer through to websites that run StatCounter's tracker — not how many people use each assistant; on that measure ChatGPT led from May to September 2026."
- **Intro.** Change "Russia (improbably) on Perplexity and GigaChat" to "Russia on Yandex's Alice AI and DeepSeek". The matching analysis sentence is rewritten in the JSON.
- **Sources:**
  - Mediascope via kod.ru (MEDIUM; Mediascope's own release not opened)
  - StatCounter Russia page and CSV (HIGH)
  - Microsoft H2 2025 PDF (HIGH; DeepSeek 43% map label, and "U.S. services face restrictions")

**South Korea**

- **Table row.** Replace it with:
  > "South Korea | ChatGPT (18.8M monthly app users, about 91% of users of tracked AI apps, IGAWorks Mobile Index, Oct 2026) | Gemini (9.87M), Claude (4.04M) monthly app users (Wiseapp, Sep 2026); Naver's HyperCLOVA X inside Naver search | Frontier models became fluent in Korean (Korean CSAT: GPT-3.5 16, GPT-4o 75, GPT-5 100, per Microsoft), and Korea posted the largest gain of any major economy for three straight Microsoft editions, to 40.6% in June 2026"
- **Deep dive.** Change the heading to "Korea, proof that language quality drives adoption." The full replacement paragraph is in the JSON. It is built on Microsoft (25.9% → 40.6%, 12th; policy, Korean-language gains, the image-generation moment) and Mobile Index (ChatGPT 18.8M, ~91%), and says HyperCLOVA X is used inside Naver search, not as a standalone app.
- **FAQ "local models".** Remove Korea from the list.
- **Growth claim.** Replace "world's fastest usage growth (+43.2%)" with "the largest absolute gain of any major economy: +14.7 points from H1 2025 to Q2 2026 (25.9% to 40.6%, Microsoft)".
- **Drop unless re-sourced.** Three claims were not verified: "~63% of search", "AI Briefing" and KoBALT-700 48.9 vs 32.4.
- **Sources:**
  - Seoul Economic Daily / Mobile Index (MEDIUM; en.sedaily.com is still blocked)
  - Wiseapp via BigGo (MEDIUM)
  - Microsoft H2 2025 and Q2 2026 PDFs (HIGH)

### Still MEDIUM after this pass

- Mediascope (Russia): kod.ru is blocked.
- Korea app trackers.
- QuestMobile and CNNIC.
- OpenAI India.
- Similarweb.
- Pew country values.
- OECD and Census BTOS.
- World Bank firms.
- BCG.
- MIC Japan, Cetic.br and APJII.

### Still blocked and relevant

aka.ms, openai.com, hai.stanford.edu, ai.google, en.sedaily.com and kod.ru. huggingface.co is now allowed, but I did not fetch Anthropic's country file in this pass.
