# Report AI — Project Handoff Brief (for Claude in-browser)

You are continuing work on **report-ai.org**, a one-stop hub for **sourced AI statistics, reports, and trends**. The site is largely built; your job is to finish setup steps that require the WordPress admin / Site Editor (the previous agent worked through the WordPress REST API and could not reach those screens — you can, in the browser).

## 1. Non-negotiable brand rule
**Every published statistic must link to a primary source and be dated.** Never invent or publish unsourced numbers. Editorial/syndicated posts that contain unsourced figures must be labelled "Syndicated" and kept in the **Blog** category — never mixed into the `/stats/` pillars.

## 2. Platform & access
- **Hosting:** self-hosted WordPress on **SiteGround**, Jetpack-connected. Full plugin access.
- **Theme:** Twenty Twenty-Five (block theme). A custom child theme exists in a git branch (see §9) but is **not deployed** yet.
- **Active plugins:** Jetpack, All in One SEO (AIOSEO), AIOSEO Broken Link Checker, **Feedzy RSS Feeds Lite**, MonsterInsights (GA), OptinMonster, SiteGround Security/Speed/Central, AI Agent by SiteGround. **WP RSS Aggregator** is installed but inactive.

## 3. Design system (AI-Index identity)
- Colors: **#0e2f56** Deep Network Blue (headings, nav, table headers, structural borders) · **#4a90e2** Data Flow Blue (body links) · **#e67e22** Insight Orange (value callouts, metric numerals, primary CTAs — use sparingly) · surfaces **#f5f8fc / #f8faff** · body text **#2d3748**.
- Font: **Inter** (headings use clamp scaling, weight 700, letter-spacing -0.02em).
- Signature components: charcoal "data-highlight widget" (3 metrics, orange numerals) atop each pillar; "AI at a glance" fact-card grid; orange-left-border "Syndicated" callout; dashboard-styled tables.

## 4. GEO/SEO template every /stats/ pillar follows
Fact-first bold opener → "AI at a glance"/data widget → **Executive summary** (Fast Fact / Driver / Bottleneck bullets) → sourced tables → "Deep dive" H3 → FAQ (H3 questions) → **Data sources & methodology** citation matrix (claim → verified data point → linked source) → JSON-LD `Dataset` + `FAQPage` in a wp:html block.

## 5. Site map (slugs · IDs)
**Pages:** Home `/` (6, front page) · About & Methodology `/about/` (7) · Privacy `/privacy/` (75) · **Statistics Library hub** `/stats/` (39) · Reports `/reports/` (40) · **AI Glossary hub** `/glossary/` (41).

**8 stats pillars** (children of 39, under `/stats/`): ai-adoption-statistics-2026 (43) · enterprise-ai-statistics-2026 (46) · generative-ai-statistics-2026 (47) · ai-investment-funding-statistics-2026 (73) · ai-jobs-statistics-2026 (88) · ai-models-benchmarks-statistics-2026 (89) · ai-safety-governance-statistics-2026 (92) · ai-infrastructure-compute-statistics-2026 (93).

**11 glossary terms** (children of 41, under `/glossary/`): large-language-model (62) · generative-ai (63) · agentic-ai (64) · ai-inference (65) · retrieval-augmented-generation (66) · foundation-model (67) · fine-tuning (98) · context-window (99) · tokens (100) · mlops (101) · multimodal-ai (102).

**Single-stat posts (Tier-2 hubs):** 88% adoption (15) · $252.3B investment (16) · 23% agentic (17) · 280× inference (18).
**Blog posts:** ai-in-2026-by-the-numbers (103, native roundup) · state-of-ai-2025-key-statistics (106, syndicated) · ai-in-2026-explosive-growth-delayed-value (107, syndicated).
**Redirect stubs (do not edit):** old flat-URL posts 20/21/22 JS-redirect to the `/stats/` pillars.
**Categories:** AI Adoption&Usage (2) · Enterprise AI (3) · Investment&Funding (4) · AI&Jobs (5) · Models&Benchmarks (6) · Safety&Governance (7) · Generative AI (8) · AI Infrastructure (9) · News (10) · Blog (11).

## 6. Schema inventory
`Dataset` + `FAQPage` on each pillar · `DataCatalog` (with dataset[] array of all 8) on `/stats/` · `DefinedTerm` on each glossary term · `BlogPosting` on the roundup · `AboutPage` on About. All injected via in-body `wp:html` blocks (valid for crawlers).

## 7. Internal-linking (3-tier entity graph) — keep this pattern
Tier 1 pillar (`/stats/...`) → Tier 2 metric node (single-stat post) → Tier 3 glossary term → links back up to the hub. Every new asset must link up, lateral, and down.

## 8. Verified sources already used
McKinsey *State of AI* (Nov 2025) · Stanford HAI *AI Index* 2025 & 2026 · Menlo Ventures · OECD · KPMG Venture Pulse Q4 2025 · IDC · IEA · WEF Future of Jobs 2025 · PwC AI Jobs Barometer · Gartner · European Commission / EU AI Act · Bick/Blandin/Deming · Challenger Gray & Christmas · Sacra · TechCrunch.

## 9. Child theme (in git, not deployed)
Branch `claude/peaceful-gauss-clw4O` in repo `mlbwhf/test`, folder `report-ai-theme/`: `theme.json` (palette + Inter), `functions.php` (`ai-statistic` CPT at /stats/ + `wp_head` Dataset JSON-LD), `templates/archive-ai-statistic.html`, `templates/single-ai-statistic.html`, `style.css` (premium table/typography/fact-card CSS), `DEPLOYMENT.md`.

## 10. TO-DO — what to finish in the browser (priority order)
1. **Header nav:** Appearance → Editor → Patterns → Header → Navigation block → remove links → add a **Page List** block (auto-builds dropdowns from the page hierarchy: Statistics/Glossary nest their children).
2. **Footer:** remove the "Proudly powered by WordPress" credit in the Footer template part.
3. **Design polish:** Appearance → Customize → Additional CSS → paste contents of `report-ai-theme/style.css`.
4. **Feedzy import:** Feedzy → Import Posts → New Import → feed `https://agile-agilist.com/category/ai/feed/` → as Post → category **Blog** → Published → daily. (Lite = excerpts only; Pro/WP RSS Aggregator Feed-to-Post for full text. Backfill older posts via Tools → Export(Category: AI) on agile-agilist → Tools → Import on Report AI.)
5. **Canonical (Report AI is the canonical home):** on **agile-agilist.com**, set AIOSEO Canonical URL → the matching Report AI URL for each AI post (or 301).
6. **Search submission:** GSC + Bing — submit `/stats/`, all 8 pillars, and the AIOSEO sitemap (`/sitemap.xml`).
7. **Validate schema:** validator.schema.org → `/stats/` (DataCatalog), pillars (Dataset+FAQ), a glossary term (DefinedTerm).
8. **Newsletter:** wire OptinMonster to an email provider; point the homepage "Get the AI numbers in your inbox" button at the real signup.
9. **Readiness Assessment:** add a quiz plugin (WPForms Quiz / HD Quiz); build a 10-question Enterprise AI Readiness quiz with a scored results page.

## 11. Hard constraints / gotchas
- `/privacy-policy/` is locked by WordPress's protected default page; the real policy lives at `/privacy/`.
- Don't publish the sample "live feed" numbers ($2.40/1M tokens, 74% adoption) — they're illustrative and conflict with verified data. The fact-grid on `/stats/` uses sourced numbers.
- Keep syndicated agile-agilist posts in **Blog**, labelled, never in `/stats/`.
- Home page uses a user-customized cover-image hero — preserve it.
