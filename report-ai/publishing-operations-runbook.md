# Report AI (report-ai.org) — Publishing & Operations Runbook

**Audience:** a Claude Code session (any model tier, including Haiku/Sonnet) picking up
operations for report-ai.org. Follow this document top-to-bottom; it contains every ID,
convention, and guardrail you need. Do not improvise around the guardrails.

---

## 0. Site facts (use these exactly)

| Fact | Value |
|---|---|
| Site | report-ai.org — WordPress.com hosted |
| WordPress.com site ID | `255349241` (pass as `wpcom_site` on every MCP call) |
| MCP server | `WordPress_com` — main tool: `wpcom-mcp-content-authoring` (posts, pages, categories, media); `wpcom-mcp-site-editing` for menus |
| Write calls | Always include `"user_confirmed": true` in params for create/update operations |
| Theme | GeneratePress (free) + WPCode snippets |
| Menu | Menu ID `34` ("Primary"). Items: Indexes 626 → page 39 · Reports 627 → page 40 (children: 847 Dark Side → page 498, 848 Real-World → page 446, 849 Latest News custom link) · Glossary 628 → page 41 (no children, keep it that way) · About 629 → page 7 · Subscribe 630 |
| Homepage | Page ID `6` — **self-contained HTML** (inline `<style>` + `wp:html` blocks). Never strip its `<style>` block; it must render without the global CSS. |
| Hub pages | Indexes `39` · Reports `40` · Glossary `41` · Dark Side of AI `498` · Real-World AI `446` · Technical Benchmarks index `394` · State of AI index `362` |
| Brand | Font Archivo (900 for display) + IBM Plex Mono for stats/labels · ink `#111114` · cobalt `#2545f5` · hairline `#e6e6ea` |
| Caching | SiteGround page cache. If a published change doesn't show, it's almost always cache — tell the owner to purge SG Cache; don't re-edit the content. |

**Reliability notes (learned the hard way):**
- Large `pages.update` payloads occasionally fail with a transient stream error. After ANY
  error on a write, verify by re-listing (`pages.list` ordered by `modified`) before
  re-sending — the write may or may not have landed.
- The REST API cannot assign menu locations on this site (returns
  `rest_invalid_menu_location` for every slug). Menu *location* changes are wp-admin-only:
  Appearance → Menus → tick "Primary Menu" → Save. Never burn time retrying via API.

## 1. Data integrity (non-negotiable)

The entire value of report-ai.org is that the numbers are REAL. This inherits the warning
in `report-ai/ai-native-certification-hub.md`:

1. **Never invent a statistic.** Every figure needs a named primary source (McKinsey,
   Gartner, Stanford HAI, IEA, official filings…) and a date.
2. If you cannot verify a figure with WebSearch/WebFetch during the session, either drop
   it or label it visibly: *"illustrative estimate pending source confirmation"* — the
   homepage already uses this pattern for 2024–2025 trend bars.
3. Every report page ends with a **Sources** section listing each source with publisher,
   title, and date.
4. Prefer updating a stale number over adding a new unsourced one.

## 2. Publishing schedule (what "scheduled publishing" means here)

There is **no plugin scheduler**. Use WordPress-native scheduling: create the page/post
with `"status": "future"` and a `"date"` in the future (site-local time, format
`YYYY-MM-DDTHH:MM:SS`). WordPress publishes it automatically at that time. Verify queued
content anytime with `posts.list`/`pages.list` + `"status": "future"`.

The WPCode snippet **"Report AI — AI News Aggregator (cron)"** independently auto-publishes
News posts. Leave it alone; it is not part of this calendar.

### Editorial calendar

| Cadence | What | How |
|---|---|---|
| **Every Monday 09:00** | One new flagship report (see §4 queue) | Create as `future`-status page the week before |
| **First Monday of each month** | **Index refresh** (see §3) | Do in-place `pages.update`s, same day |
| Ad hoc | News analysis when a major AI story breaks | Post in **News** category (cron covers most of this) |

### §3. Monthly index refresh — exact procedure

The "index update" the owner asked for. On the first Monday of each month:

1. `pages.list` with `parent` = each hub (39, 394, 362, 40) to enumerate index pages.
2. For each index/statistics page **and the homepage (page 6)**:
   - Update every "Updated <Month> 2026" stamp to the current month.
   - Re-verify the 3–5 headline figures via WebSearch. If a source has newer data
     (e.g., a new McKinsey survey wave), update the figure AND its source line.
   - Homepage specifics: the four stat tiles, the "Stat of the week" card, and the
     assistant-WAU bar chart (labelled *illustrative* — confirm against provider
     disclosures and remove the label for any figure you can source).
3. Do NOT redesign anything during a refresh. Numbers, dates, and source lines only.
4. Log what changed in the commit/summary: page ID → figures touched.

## 4. Report generation queue (task 3 — "suggest new report to be generated")

**STATUS — the first six are DONE (published/scheduled 2026-07-06). Do NOT regenerate them.**
All six were researched against named primary sources and created as pages under Reports (40):

| # | Publish date | Title | Page ID | Status |
|---|---|---|---|---|
| 1 | 2026-07-06 | Agentic AI Statistics 2026 | `862` | ✅ live |
| 2 | 2026-07-13 | AI in Healthcare: Adoption & Outcomes 2026 | `863` | ⏳ scheduled |
| 3 | 2026-07-20 | Open vs Closed AI Models 2026 | `861` | ⏳ scheduled |
| 4 | 2026-07-27 | AI in Education Statistics 2026 | `865` | ⏳ scheduled |
| 5 | 2026-08-03 | The Global AI Regulation Tracker | `864` | ⏳ scheduled |
| 6 | 2026-08-10 | AI Deepfakes & Fraud by the Numbers | `866` | ⏳ scheduled |

The queue is filled through **2026-08-10**. Starting the week of **2026-08-17**, generate the
NEXT report each Monday. Pick from the backlog below (or propose new topics to the owner first),
then follow the per-report procedure. Suggested next batch, each with a home category already made:
AI & Jobs / labor-market 2026 (`5`); AI Safety & Governance 2026 (`7`); AI Investment & Funding
H2 2026 (`4`); Generative AI usage 2026 (`8`); LLM Market share update (`21`); AI Infrastructure /
compute & energy refresh (`9`). Confirm the pick, research, schedule for the next open Monday 09:00.

**Editorial-review flags on the scheduled six (skim before their publish dates — there is time):**
- #3 Open vs Closed (861): cites some 2026 model names surfaced via search (e.g. "GPT-5.5",
  "Kimi K2.6") — verify against provider disclosures before Jul 20.
- #5 Regulation Tracker (864): EO 14409 and the "Great American AI Act" discussion draft are
  confirmed real and described accurately; the EU Annex III deferral to 2 Dec 2027 is labeled
  "reported-but-evolving" — re-check before Aug 3.
- Single-firm market-size projections (agentic #1, education #4) are labeled in-text as one estimate.

(If the current date is already past a slot, publish immediately and shift the rest to the
following Mondays. Categories apply to posts; for pages, the parent placement is what matters.)

**Still open (nice-to-have):** add a link to each report from the Reports hub (page 40) as it goes
live — deferred here to avoid editing the hub's self-contained HTML blind. Do it when next editing page 40.

### Per-report procedure

1. **Research first.** WebSearch for 8–15 verifiable statistics from primary sources.
   No sources found for a claim → the claim doesn't go in.
2. **Match the house format.** Read an existing report before writing —
   page `93` (AI Infrastructure) or page `717` (US policy) are good models. Pattern:
   - Breadcrumb line (Home / Reports / <title>)
   - H1 + one-sentence dek stating the headline finding with its number
   - "Key numbers" stat-tile row (big Archivo-900 numerals, mono source captions)
   - 4–7 H2 sections, each anchored on a sourced figure
   - A short FAQ (3 questions) + matching FAQPage JSON-LD in a `wp:html` block
   - Sources section
3. **SEO fields:** title ≤ 60 chars with the year; meta description ≤ 155 chars containing
   the headline stat; slug from the table above.
4. **Create** via `pages.create`: `parent: 40`, `status: "future"`, `date` per the table.
5. **Verify** the page appears in `pages.list` with `status: future`, then report the
   preview link.
6. **After publish, link it:** add one link to the new report from the Reports hub
   (page 40) and, if it's a strong stat, consider it for the next homepage refresh.

## 5. Category cleanup (task 2 — remaining work)

Categories already created (done, don't recreate): Agentic AI `35`, AI in Healthcare `36`,
AI in Education `37`, AI Policy & Regulation `38`, AI Incidents & Misuse `39`,
Open-Source AI `40`.

Remaining work, in order:

1. **Re-file the 11 Uncategorized posts.** `posts.list` with `categories: 1`, read each
   title, assign the best real category via `posts.update` (categories param = array of
   IDs, drop `1`). Most will be News (`10`) or Blog (`11`).
2. **Merge empty duplicates** (each: confirm `count` is still 0 via `categories.list`,
   then `categories.delete`):
   - Enterprise AI Spending `20` → covered by AI Investment & Funding `4`
   - Workplace AI `24` and Daily AI Usage `19` → covered by AI Adoption & Usage `2`
   - Real-World AI Use Cases `33` → keep **AI Use Cases `23`** (broader), delete `33`
     **unless** posts have been assigned to `33` since — then move them to `23` first.
3. If a category unexpectedly has posts, move the posts first; never delete a category
   that still has posts.

## 6. Guardrails — do NOT

- Do not invent statistics or strip "illustrative" labels without a verified source.
- Do not redesign the homepage, nav, or global CSS — those are owner-managed
  (CSS lives in a WPCode CSS snippet / Additional CSS, file `the-ai-index-global.css`).
- Do not touch the News Aggregator cron snippet or other WPCode PHP snippets.
- Do not add children under Glossary in menu 34, and do not add more than ~4 children
  under Reports.
- Do not delete or bulk-edit published pages outside the §3 refresh scope.
- Do not retry menu-location assignment via REST (known dead end, see §0).
- After any failed write, re-list before re-sending (duplicate-content risk).

## 6b. Monthly SEO loop (Site Kit → actions)

Each month the owner pastes the Site Kit "top search queries" and "top content" tables. Then:
1. **High-impressions / low-CTR queries** → retitle + re-meta the matching page to lead with the
   query phrase (done 2026-07: page 862 retitled "AI Agent Statistics 2026…" to chase the
   "ai agent" query's 1,232 impressions).
2. **Queries with no matching page** → new report into the Monday queue (done 2026-07:
   Sovereign AI Index published; AI Revenue Per Employee scheduled 2026-08-17).
3. **404s in top content** → add a 301 to the WPCode redirect snippet
   (`report-ai/redirect-snippet-library-to-indexes.php`; owner must paste updates into WPCode).
4. **Pages with ~1s duration / <15% engagement** → content mismatch; rework the intro so the
   promised stat appears in the first screenful. Flagged 2026-07: `ai-models-benchmarks-statistics-2026`
   (17 views, 1s duration).
5. **High-engagement pages** (e.g. `/indexes/compare/`, 2m52s) → add homepage/pillar links to them.

## 6d. Information architecture & title conventions (restructured 2026-07-14)

**The one rule: Indexes = evergreen statistics; Reports = news, analysis, and the two series.**
Never create a new evergreen "…statistics 2026" page under Reports — it belongs under an
Indexes sub-hub. Current sub-hubs under Indexes (39): State of AI `362`, AI Economics `392`,
Enterprise AI `393`, Technical Performance `394`, Workforce & Labor `395`,
**AI by Industry `938`** (healthcare 863, education 865; add finance/manufacturing/retail here),
**Geography of AI `930`** (pillar: Sovereign AI 934, Regulation Tracker 864; add country/region
pages here), Compare `360`. Reports (40) holds one-off news reports + Dark Side (498) +
Real-World (446).

**Title formula (SEO + LLM):** `[Primary keyword phrase] [Year]: [2–3 word qualifier]`,
≤60 chars, keyword first, year always present on evergreen pages (e.g. "AI Agent Statistics
2026: Adoption, Market & Reliability"). Nav labels stay short (2–3 words, no year).

**Nav (menu 34):** Indexes (626) now has 8 children (items 946–953, the sub-hubs above).
Reports keeps 3 children. Glossary stays childless. When adding a sub-hub page, also add a
menu item under 626.

**Moved-page 301s** (owner adds in Redirection plugin; also in redirect-snippet file):
`/geography-of-ai/` → `/indexes/geography-of-ai/` · `/reports/sovereign-ai-index-2026/` →
`/indexes/geography-of-ai/sovereign-ai-index-2026/` · `/reports/agentic-ai-statistics-2026/` →
`/indexes/enterprise-ai/agentic-ai-statistics-2026/` · `/reports/ai-healthcare-statistics-2026/`
→ `/indexes/ai-by-industry/ai-healthcare-statistics-2026/`

**SCHEDULED TASKS from search-phrase research (work through in order, one per session):**
1. ~~"sovereign ai index"~~ ✅ done (934). ~~"cursor $3.3m revenue per employee"~~ ✅ scheduled (935).
2. "ai hyperscalers" (17 impressions) → add a "Hyperscalers" H2 + FAQ to AI Infrastructure page 93.
3. "improving health intelligence in chatgpt" → add an FAQ to Healthcare page 863.
4. "agentic world modeling" → glossary entry for "World Model" exists? verify /glossary/world-model/; expand if thin.
5. Geography pillar expansion — regional deep-dives under pillar 930, linked from its
   "Explore by region" grid: ~~China (954, live)~~ ✅ ~~Europe (956, live)~~ ✅
   ~~India (957, sched Aug 24)~~ ✅ ~~Middle East (955, sched Aug 31)~~ ✅. NEXT regions to add
   (parent 930, add card to the pillar grid + "Go deeper" on publish): AI in the UK 2026,
   AI in Japan & South Korea 2026, AI in Southeast Asia 2026, AI in Africa 2026, AI in Latin America 2026.
   When India/Gulf go live, swap their greyed "Publishes …" cards in pillar 930 for real links.
6. AI by Industry expansion: "AI in Finance Statistics 2026" (parent 938), then manufacturing, retail, legal.
7. Retitle-with-year sweep: Dark Side children (500-503, 541-549, 552) and Real-World children
   (466-472) lack years/keywords — retitle one batch per session using the title formula.
8. Benchmarks page 1s-duration fix (from §6b) — still open.

## 6c. Visitor AI assistant (AI Engine plugin, installed 2026-07-14)

The **AI Engine** plugin (v3.6+) is active: a site-wide chatbot that helps visitors find
reports instead of using search, and **logs every visitor question** (Discussions in wp-admin).
- LLM backend: **Groq** (OpenAI-compatible endpoint `https://api.groq.com/openai/v1`) — key is
  owner-managed in Meow Apps → AI Engine → Environments. Do not print or move keys.
- Treat the **chat logs as a demand signal**, same as the Site Kit loop (§6b): each month, scan
  Discussions for questions the site couldn't answer well → those become report topics.
- If AI Engine is ever insufficient (multi-step flows, RAG pipelines), the owner's chosen
  escalation is **Flowise** self-hosted (e.g., on the Hostinger VPS post-migration) with its
  chat widget embedded via WPCode; the AI Engine logs migrate with the WP database.

## 6e. PENDING — retry after 2026-07-14 22:30 UTC session-limit reset

These were queued when the session hit its usage limit; finish them next:
1. **Homepage LLM-ratings band** — add an "AI models, rated" band to the Home page (id 6)
   linking the Best AI Models page (/indexes/technical-benchmarks/best-ai-models-2026/, id 964).
   Insert just before the "Explore the Indexes" section; keep page 6 self-contained; preserve
   all other content byte-for-byte.
2. **Analysis blocks on the remaining index hubs** (same pattern as §6d — sourced "The state of
   play in 2026" block, preserve existing content, back up original first):
   - **State of AI (362)** — synthesize the 2022→2026 arc (ChatGPT launch → near-universal
     adoption 88%, ~$2.5T spend, concentrated value).
   - **AI by Industry (938)** — synthesize cross-sector adoption (healthcare 81% physicians,
     education 92% undergrads) and the sector-by-sector spread.
   (Geography 930 and Dark Side stats 576 already have analytical sections — skip.)

## 7. Session checklist (start here each run)

1. `pages.list` status=`future` → is the queue healthy (next Monday's report scheduled)?
2. If a queue slot is empty → generate the next report from §4.
3. If it's the first Monday of the month (or the refresh was missed) → run §3.
4. Any Uncategorized posts or leftover duplicate categories → continue §5.
5. Summarize: what published, what's queued, what changed, with links.
