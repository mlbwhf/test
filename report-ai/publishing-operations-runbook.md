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

Six reports are approved and queued. Generate **one per week**, in order, scheduled for
Monday 09:00 publishes:

| # | Publish date | Title | Slug | Parent page | Category ID |
|---|---|---|---|---|---|
| 1 | 2026-07-06 | Agentic AI Statistics 2026 | `agentic-ai-statistics-2026` | Reports `40` | Agentic AI `35` |
| 2 | 2026-07-13 | AI in Healthcare: Adoption & Outcomes 2026 | `ai-healthcare-statistics-2026` | Reports `40` | AI in Healthcare `36` |
| 3 | 2026-07-20 | Open vs Closed Models 2026 | `open-vs-closed-ai-models-2026` | Reports `40` | Open-Source AI `40` |
| 4 | 2026-07-27 | AI in Education Statistics 2026 | `ai-education-statistics-2026` | Reports `40` | AI in Education `37` |
| 5 | 2026-08-03 | The Global AI Regulation Tracker | `global-ai-regulation-tracker` | Reports `40` | AI Policy & Regulation `38` |
| 6 | 2026-08-10 | AI Deepfakes & Fraud by the Numbers | `ai-deepfakes-fraud-statistics` | Reports `40` | AI Incidents & Misuse `39` |

(If the current date is already past a slot, publish immediately and shift the rest to the
following Mondays. Categories apply to posts; for pages, the parent placement is what matters.)

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

## 7. Session checklist (start here each run)

1. `pages.list` status=`future` → is the queue healthy (next Monday's report scheduled)?
2. If a queue slot is empty → generate the next report from §4.
3. If it's the first Monday of the month (or the refresh was missed) → run §3.
4. Any Uncategorized posts or leftover duplicate categories → continue §5.
5. Summarize: what published, what's queued, what changed, with links.
