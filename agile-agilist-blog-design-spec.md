# Blog Index / Hub — SEO Design Spec (Most-Read surfacing)
_agile-agilist.com (WordPress, Jetpack/Atomic) · ~120 posts · 5 categories. Pairs with agile-agilist-blog-consolidation-design.md (taxonomy/dedupe). Goal: surface MOST-READ posts + 2025–2026 SEO best practice._

## 1. "Most Popular" surfacing — hybrid model
**Primary data source: Jetpack Stats "Top Posts & Pages" block** (you already run Jetpack — real pageview data, no extra plugin/queries).
- Caveat: Jetpack Top Posts lags a few hours and is volatile on short windows for a 120-post B2B blog.

**Recommended: hybrid (curated hero + auto trending)** — what HubSpot/Ahrefs effectively do (their "popular" lists are curated from analytics, not raw auto-feeds):

| Strip | Source | Why |
|---|---|---|
| **Most Popular / Editor's Top Picks** (hero) | Manually curated, re-validated quarterly from a Jetpack Stats CSV export | Stable, keyword-rich, carries internal-link equity to your strongest evergreen pillars; no daily flicker |
| **Trending this month** (secondary) | Jetpack Top Posts block, 30-day window, grid, 4 items | Auto-freshness, zero maintenance |

> Curate the hero (most link equity); automate the secondary.

## 2. Page layout (top → bottom)
1. Breadcrumb: Home › Blog
2. H1 "The Agile-Agilist Blog" + 40–60-word keyword-rich intro (indexable hub context)
3. ⭐ **Most Popular / Editor's Top Picks** — H2 + 4–5 large curated cards (the LCP zone)
4. **Category nav** — 5 pills + "All", real `<a href>` to `/category/` archives (crawlable, not JS-only)
5. 🔥 **Trending this month** — Jetpack Top Posts block (30-day grid, 4 items)
6. **Latest posts** — 3-col card grid, 12/page, numbered crawlable pagination
7. **Browse by topic** — 5 category cluster cards w/ descriptions
8. Newsletter CTA / footer

## 3. Card anatomy
- 16:9 featured image (explicit width/height or `aspect-ratio` → no CLS)
- Category pill (real `<a>` to archive) + read time (~225 wpm, round up)
- Title as H3, descriptive keyword-rich anchor — **whole card clickable but anchor text = the title**, never "Read more"
- 2-line custom excerpt (`-webkit-line-clamp`), hand-written for top posts
- Author · Date; don't shrink card text below 14px

## 4. Schema markup
- **Hub:** `CollectionPage` wrapping `ItemList` (summary format — `ListItem` = `position` + `url`).
- **Each post:** `Article`/`BlogPosting`.
- **Breadcrumb:** `BreadcrumbList`. Validate with Google Rich Results Test.

## 5. Internal linking & crawlability
- **Pillar/cluster = your 5 categories.** Posts link up to pillar; pillar links down; 2–3 lateral links per post. 3-click rule.
- **Pagination = numbered `<a href>`** (`/blogs/page/2/`). **No JS-only infinite scroll / Load-more as sole nav.** Category pills = real links.
- Self-referencing canonicals on paginated pages; keep page/2+ indexable.

## 6. Core Web Vitals
- **LCP:** first 1–2 above-fold images `loading="eager"` + `fetchpriority="high"` (never lazy-load LCP image); rest `loading="lazy"`; WebP/AVIF via Jetpack Photon; preconnect `i0.wp.com`.
- **CLS:** explicit dimensions on every image; reserve pill/read-time space; `font-display:swap`.
- **INP:** defer non-critical JS.
- 12 posts/page; don't add a 2nd popular-posts plugin (Jetpack block is server-cached); test mobile CWV.

## Validation (what top blogs do)
- Ahrefs hand-curates "Top blogs of 2025" → supports curated hero.
- 56% of most-viewed 2025 posts were research/data-driven → curate evergreen winners (your McKinsey/BCG pieces) into a permanent "Most Popular" slot.
- Topic clusters: ~30% more organic traffic, rankings hold 2.5× longer.
