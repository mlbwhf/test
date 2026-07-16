# Optimization audit — agile-agilist.com (perf · mobile · SEO · LLM)

Date: 2026-07-16 · Scope: nav/CSS/JS snippets + page architecture.
Companion: `MOBILE-PERF.md` (host-level steps, still valid).

## A. Shipped in this pass (already in the two files)

| # | Change | Wins |
|---|--------|------|
| 1 | **CSS v20** — closed mega panels are `display:none` (were `display:grid` + hidden) | Kills the invisible click-trap (verified in headless Chromium against the live cascade); also perf: browser no longer lays out / hit-tests four ~1200px hidden grids on every frame |
| 2 | **JS v18** — `BreadcrumbList` JSON-LD injected alongside the visual breadcrumb | Breadcrumb rich results in Google; machine-readable site hierarchy for answer engines |
| 3 | **JS v18** — Module 2 MutationObserver debounced (350ms, mobile-only) | Was re-running the accordion wiring on *every* DOM mutation site-wide (animations, embeds, chat widget) — constant mobile CPU tax |

## B. Highest-impact next steps (need wp-admin, ~30 min total)

1. **Kill the render-blocking font `@import`** — line 1 of Additional CSS
   (`@import url('https://fonts.googleapis.com/...Newsreader...')`) is the
   single worst font-loading pattern: it serializes CSS parsing behind a
   network fetch on every page view, desktop and mobile.
   Fix: Appearance → Customize → Typography → set Newsreader there (Astra
   self-hosts/preconnects with `display=swap`), then delete the @import line.
   Biggest single mobile-LCP win available.

2. **Legacy CSS debt.** Additional CSS currently carries the OLD nav system
   (sections B/C/G/R + "NAV FIX v3" + old mobile accordion + trailing patch
   blocks) *plus* the v20 appendix that overrides it — roughly 15–20 KB of
   dead-weight CSS inlined into the `<head>` of **every page**. Once v20 has
   been stable a few days, ask me for the **cleaned Additional CSS**: I'll
   produce one file with the dead nav layers surgically removed (everything
   else — footer, course template, calendar, legal — untouched). Est. 30–40%
   smaller head CSS and far easier maintenance.

3. **Re-add stripped `<script>` blocks** to pages 964 / 28854 / 28785
   (accordions, radar chart, tabs, HubSpot embeds still missing live) —
   functional debt from the WAF workaround, see REDEPLOY.md §1.

## C. SEO (structured data + hygiene)

4. **Server-side schema per page type** (JS-injected JSON-LD is read by
   Google but NOT by most LLM/AEO crawlers — for those it must be in the
   page HTML). Recommended, in priority order:
   - **Course + Offer** on every training page (name, description, provider,
     price/currency, upcoming `CourseInstance` dates) → course rich results.
   - **FAQPage** on /about/faq/ (the Q&A is already structured on-page).
   - **Organization** site-wide (name, logo, phone, sameAs socials) — one
     small WPCode HTML header snippet; I can generate it on request.
5. **Meta descriptions** — confirm each redesigned page has one (Jetpack SEO
   field). Hand-built HTML pages don't get them automatically.
6. **One `<h1>` per page** — the redesigned heroes do this; keep it when
   adding pages (Astra's auto-title is already suppressed via section S).

## D. LLM / answer-engine (AEO)

7. **The right architecture is already in place**: pages are static HTML in
   the post content — LLM crawlers (which do not execute JS) see the full
   copy. The JS-injected chrome (breadcrumb pill, utility strip) is
   navigation, not content, so nothing important is invisible to them.
8. **Add `/llms.txt`** — a plain-markdown index of what the company does,
   the service/training catalogue with canonical URLs, and contact. Cheap,
   emerging standard, and this site's service-layer naming (Operating Model
   in the Age of AI, its 5 layers) benefits from being spelled out for
   retrieval. I can draft it on request.
9. **FAQ phrasing** — keep questions in natural language ("How long does an
   agile maturity assessment take?"); that's what answer engines quote.

## E. Mobile rendering

10. Debounced observer (shipped, #3) + CSS-transition accordion = the nav is
    now cheap on mobile. Remaining mobile wins are host-level and already
    documented in `MOBILE-PERF.md` (LiteSpeed page cache, WebP, defer
    non-critical JS) — unchanged, still recommended.
11. Images across redesigned pages already have explicit dimensions +
    `loading="lazy"` / `decoding="async"` (REDEPLOY.md) — keep that pattern
    for new pages.
12. After the font fix (#1) + cleaned CSS (#2), re-test with PageSpeed
    Insights mobile; expect LCP and "eliminate render-blocking resources" to
    move materially.

## F. Not recommended

- Minifying the two snippet files: WordPress.com/LiteSpeed already
  minify+gzip CSS/JS output; hand-minifying would only make the snippets
  unmaintainable for ~1–2 KB post-gzip.
- More `!important`/specificity escalation: v20 ends that arms race — future
  changes should go into the appendix (or the cleaned sheet from #2), never
  as new append-layers.
