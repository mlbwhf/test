# Blog Index/Hub Redesign — "Most-Read" + SEO Design Spec
_Pairs with agile-agilist-blog-consolidation-design.md (taxonomy/dedupe). This doc = the new front-end design. Site: WP.com Jetpack/Atomic, ~120 posts, 5 categories._

## 1. "Most Popular" surfacing strategy
**Two-tier model** (HubSpot's editorial + data pattern):

| Tier | Source | Why |
|---|---|---|
| Real popularity | **Jetpack Stats → Top Posts & Pages**, 30-day window | Already on the Atomic stack; server-side; **no per-view DB writes**. Use 30-day for "Most-Read This Month", all-time for "Reader Favorites". |
| Editorial override | A `featured` tag / sticky posts | Promote strategic pillar posts even if a clickbait post out-views them. |

Avoid view-logging plugins (WordPress Popular Posts) unless needed — they write on every request (CWV hit). Jetpack all-time list caps at top 500 (irrelevant at 120 posts).

**Rule:** headline strip = 3 curated "Featured"; second strip = 6 Jetpack 30-day Top Posts.

## 2. Page layout (top → bottom)
1. **Breadcrumb** — Home › Blog
2. **Hub hero / H1** — e.g. "Insights on Agile, AI & Transformation" + 140–160-char SEO intro
3. **Sticky category nav** — AI · Digital Transformation · Exec Coaching · Innovation · Agile + 🔍 search
4. **Featured strip** (editorial) — 1 large + 2 small cards, "Editor's Picks"
5. **⭐ Most-Read This Month** (Jetpack 30-day) — numbered 1–5 list or 4–6 card row
6. **Browse by category** — 5 pillar tiles linking to `/category/…` hubs
7. **Latest posts** — 3-col/2/1 responsive card grid
8. **Numbered pagination** (`/blog/page/2/`) — not infinite scroll
9. **Newsletter / CTA**
10. **Footer internal links**

Label Featured vs Most-Read distinctly (editorial vs data). Keep hero text-led so LCP stays small.

## 3. Card anatomy (minimal)
- 16:9 featured image in a fixed `aspect-ratio` box (zero CLS), WebP, `srcset`; eager only for above-fold popular strip, else `loading="lazy"`.
- One metadata line: category pill (links to archive) · read-time (~200–230 wpm).
- Title = H3, **the title is the crawlable anchor** (descriptive anchor text, not "read more").
- Excerpt clamped to fixed char count (~120–160) via `-webkit-line-clamp`.
- Whole card clickable; 16px padding; `minmax()`+`fr` grid tracks.

## 4. Schema (JSON-LD)
- **Blog hub:** `ItemList` (position-ordered visible posts) + `BreadcrumbList`; optional `CollectionPage`/`Blog` page type.
- **Category pages:** `BreadcrumbList` (Home › Blog › AI).
- **Posts:** `Article` + `Person` (author) + `Organization` (publisher+logo) + `BreadcrumbList`.
- Yoast/Rank Math (or AIOSEO) emit Breadcrumb/Article automatically; **ItemList for the curated strips is the one custom dev piece** (custom block or `wp_head` hook).

## 5. Internal linking & crawlability
- Treat each **category as a pillar hub** with a real intro paragraph (not a bare archive). Clusters link up to pillar; pillars link down; siblings cross-link. Priority posts within 1–3 clicks; no orphans.
- **Numbered pagination** with real `<a href>` (no JS-only buttons, no `#fragment`); `rel=next/prev` is deprecated — don't rely on it. Self-referencing canonical on each page; **do NOT `noindex` page 2+** (blocks crawl paths). Avoid pure infinite scroll; if "Load more", keep crawlable paginated `href` fallback.
- Descriptive anchor text = post title/topic phrase.

## 6. Core Web Vitals checklist
- **LCP <2.5s:** WebP/AVIF hero via `srcset`/`sizes`, `fetchpriority="high"` + `loading="eager"` on the single above-fold LCP image; text-led hero; Jetpack Site Accelerator CDN.
- **CLS <0.1:** every card image in fixed `aspect-ratio` box w/ explicit width/height; reserve nav/font space; `font-display: swap`; no content injected above existing on load-more.
- **INP <200ms:** minimize hub JS; prefer link-based category filtering (real archives) over heavy client-side JS; defer non-critical scripts.

## 7. Atomic/WP.com implementation notes
- Most-Popular = Jetpack **Top Posts & Pages** block (30-day + all-time). No extra plugin.
- Featured strip = sticky posts or `featured` tag + Query Loop block.
- Latest grid = Query Loop block, 3-col, numbered pagination block.
- Category tiles + breadcrumbs + Article schema = native theme blocks + SEO plugin.
- **ItemList JSON-LD for curated strips = the one custom piece.**
- Build as a **draft page** first, pull theme presets, preview, then publish.
