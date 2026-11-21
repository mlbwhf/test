# SEO and search submission, 21 Nov 2026

## Applied (live, verified with wp_get_seo and wp_get_rendered)
Custom AIOSEO title, meta description, focus keyphrase, OG title and OG description on 27 pages:
the 23 pages launched 16–18 Nov plus the hubs 39, 40, 394 and 930. Full values are in `seo-meta-20261121.json`.
- Every description opens with a self-contained figure sentence (figure, unit, date, source), so search snippets and LLM
  answers quote a dated, attributed number. Each figure was checked against the page's own text.
- Before this change, no page had custom fields. The AIOSEO default (`#post_content`) put the masthead stamp text
  ("SOURCED · DATED · CONFIDENCE-RATED …") at the start of every auto description.
- Meta keywords: AIOSEO's per-post keywords field is not exposed, and the global "Use meta keywords" setting is off.
  It is better left off, because Google ignores the tag and Bing treats it as a weak spam signal. Each page has one
  focus keyphrase instead.

| ID | Path | SEO title | Focus keyphrase |
|---|---|---|---|
| 362 | /indexes/state-of-ai/ | State of AI 2026: Quarterly Reports & Data - Report AI | state of AI 2026 |
| 3521 | /indexes/state-of-ai/state-of-ai-usage/ | State of AI Usage 2026: ChatGPT, Gemini & Adoption Data | AI usage statistics 2026 |
| 3524 | /indexes/state-of-ai/state-of-ai-spending/ | State of AI Spending 2026: Capex, Budgets & Forecasts | AI spending 2026 |
| 3526 | /indexes/state-of-ai/state-of-ai-finance/ | State of AI Finance 2026: Funding, Valuations, Revenue | AI funding 2026 |
| 3626 | /indexes/state-of-ai/state-of-ai-work/ | State of AI Work 2026: AI Layoffs, Hiring & Skills Pay | AI job losses 2026 |
| 3628 | /indexes/state-of-ai/state-of-ai-models-prices/ | State of AI Models & Prices 2026: Benchmarks and Costs | AI model prices 2026 |
| 3633 | /indexes/state-of-ai/state-of-ai-tokens/ | State of AI Tokens 2026: Token Prices and Volumes - Report AI | AI token prices |
| 3695 | /indexes/state-of-ai/state-of-ai-infrastructure-energy/ | State of AI Infrastructure & Energy 2026 - Report AI | AI data center energy 2026 |
| 3704 | /indexes/state-of-ai/state-of-ai-geography/ | State of AI Geography 2026: US, China, Europe, Gulf | AI geography 2026 |
| 3705 | /indexes/state-of-ai/state-of-ai-industries/ | State of AI Industries 2026: Adoption by Sector - Report AI | AI adoption by industry |
| 3756 | /indexes/state-of-ai/state-of-ai-risk/ | State of AI Risk 2026: Deepfake Fraud, Incidents, Harm | AI risk statistics 2026 |
| 3757 | /indexes/state-of-ai/state-of-ai-regulation/ | State of AI Regulation 2026: EU AI Act, US, China | AI regulation 2026 |
| 3851 | /indexes/state-of-ai/state-of-ai-year-over-year/ | AI Statistics 2024 vs 2025 vs 2026: Year over Year | AI statistics year over year |
| 4007 | /indexes/state-of-ai/state-of-ai-2024/ | State of AI in Numbers 2024: The Year in AI Statistics | AI statistics 2024 |
| 4009 | /indexes/state-of-ai/state-of-ai-2025/ | State of AI in Numbers 2025: The Year in AI Statistics | AI statistics 2025 |
| 3789 | /indexes/state-of-ai/ai-development-index/ | AI Development Index: How AI Grew, 1950–2026 - Report AI | AI development timeline |
| 3788 | /reports/how-ai-developed-1950-2026/ | How AI Developed, 1950–2026: Seven Decades in Numbers | history of AI |
| 3821 | /reports/ai-technological-revolution-perez/ | Is AI a Technological Revolution? The Perez Method | AI technological revolution |
| 3916 | /indexes/geography-of-ai/ai-use-by-country-2026/ | AI Use by Country 2026: Adoption in 147 Economies | AI use by country |
| 3915 | /indexes/geography-of-ai/sovereign-ai-index-2026/ | Sovereign AI Index 2026: National AI Models by Country | sovereign AI |
| 4094 | /indexes/technical-benchmarks/llm-taxonomy-2026/ | LLM Taxonomy 2026: How to Categorize LLMs - Report AI | types of LLMs |
| 4104 | /reports/machine-learning-models-compared/ | Machine-Learning Models Compared: 13 Algorithms Tested | machine learning models comparison |
| 4231 | /site-map/ | Site Map: All Indexes, Reports and Glossary - Report AI | Report AI site map |
| 39 | /indexes/ | AI Statistics Indexes 2026: Sourced, Dated Data - Report AI | AI statistics 2026 |
| 40 | /reports/ | AI Reports: Original Research and Analysis - Report AI | AI research reports |
| 394 | /indexes/technical-benchmarks/ | AI Technical Performance: Benchmarks, Compute, Safety | AI benchmarks 2026 |
| 930 | /indexes/geography-of-ai/ | The Geography of AI 2026: US vs China vs Europe - Report AI | US vs China AI |

## Also done
- **362:** post_title changed from "State of AI" to "State of AI: The Report AI Series", matching the H1.
  - The excerpt was rewritten to describe the series, replacing the old 2022–2026 timeline text.
  - That edit moved post_modified to 21 Nov, so the visible stamp and the CollectionPage `dateModified` were moved to
    21 Nov to match ("page title and summary; no figures changed"). Backup: `backups/362-20261121.html`.
- **301 redirects (Redirection):**
  - #82 `/reports/dark-side-of-ai/ai-deepfakes-fraud-statistics/` (866) → `/reports/dark-side-of-ai/ai-deepfake-fraud-statistics/` (500)
  - #83 `/indexes/ai-dark-side-statistics/deepfake-fraud-scams-2026/` (1111) → 500
  - Backstop on both stubs: AIOSEO noindex, with the canonical pointing to 500. The internal renderer bypasses
    Redirection, so the 301 has to be confirmed from outside: open either old URL in a browser.

## Submitting to search engines (owner, in each tool's UI)
There is no API route from here. Google retired sitemap pings in 2023, and its Indexing API covers only job and
livestream pages. IndexNow needs a key file at the site root, which cannot be created through these tools
(WPCode and Code Snippets are off-limits). URL list: `urls-to-submit-20261121.txt` (27 URLs).
1. **Google Search Console** (the site is verified through the AIOSEO meta tag):
   - Sitemaps: resubmit `https://report-ai.org/sitemap.xml`.
   - URL Inspection: request indexing for the top 10 (362, 3521, 3851, 4104, 3916, 3915, 4094, 3788, 4009, 39).
     The daily quota is about 10 to 12.
2. **Bing Webmaster Tools:**
   - Add the site, or import it from Search Console.
   - Submit the sitemap.
   - URL Submission: paste all 27 URLs.
   - Copy the verification code into AIOSEO → Webmaster Tools → Bing, which is currently empty.
   - Paste the API key into WP Admin → Settings → Bing Webmaster (the "Bing Webmaster Url Submission" plugin) and turn
     on auto-submission, so every future publish and update is pushed to Bing and IndexNow partners such as Yandex,
     Seznam and Naver. Bing's index also feeds ChatGPT search and Copilot.
3. **AIOSEO → Search Appearance → Global Settings → Knowledge Graph (brand fix, high priority for LLMs):**
   - Website name, alternate name and organization name all read "The AI Index". Set them to "Report AI", with
     "report-ai.org" as the alternate name. This schema goes out on every page, and it is the old brand that LLMs
     attribute to Stanford.
   - Replace the organization description ("…the platform is positioning itself as…") with a plain one, for example:
     "Report AI publishes sourced, dated, confidence-rated AI statistics, indexes and reports."
   - Social Networks: add the X and LinkedIn profile URLs. They become `sameAs` and help search engines and LLMs
     recognise the entity.
   - Default social image: `cropped-AI-Index-Logo.png` carries the old name. Upload a Report AI image.
4. Home page title (still "The AI Index") and WPCode snippet 425 (the "Thank you for reading this post" line in every
   page's first paragraph, which every crawler and LLM extracts) remain open from 18 Nov.
