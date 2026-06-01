# Blog Consolidation — Highlight + Revised Design
_Grounded in live read of site 247366622 on 2026-06-01. 118 posts, 6 real categories, 3 duplicate clusters, flat root URLs._

## 1. Highlight (what the live data actually shows)

| Finding | Detail | Impact |
|---|---|---|
| **Flat root URLs** | All 118 posts live at `agile-agilist.com/<slug>/` — none under `/blogs/` or `/blog-post-agile-agilist/`. The `/blogs/` page (ID **7156**) is just an index, not a URL parent. | No URL change is strictly required to "consolidate" — posts already share the root. The real work is **taxonomy + dedupe**, not folder moves. |
| **44 Uncategorized** | Category `Uncategorized` (ID **1**) holds **44 of 118 posts** (~37%). | Largest SEO/GEO leak — these posts have no topical signal and don't surface in category archives. |
| **Duplicate clusters** | At least 3 hard duplicates (same title, different slug/ID) — see §4. | Keyword cannibalization; split link equity. |
| **6 real categories** | Agile (84), AI (83), Digital Transformation (86), Executive Coaching (85), Innovation (100) + Uncategorized (1). Posts are multi-tagged (most carry 3–5 categories). | Over-tagging dilutes archives. Recommend **1 primary + ≤2 secondary**. |
| **Translation stubs** | Auto-created `Sin categoría` (ID 104, es) and `غير مصنف` (ID 103, ar) categories exist, count 0. | Confirms a multilingual plugin is installed but no translated posts exist yet — see translation note in chat. |

## 2. Revised information architecture

**Decision: keep posts at root, fix taxonomy.** Moving 118 posts under `/blogs/<slug>/` would force 118 301 redirects for near-zero SEO gain (root-level post URLs are fine and already indexed). Consolidation = **make `/blogs/` the canonical hub that filters by the 5 real categories**, not a URL prefix.

```
/blogs/                         ← index hub (ID 7156), redesigned grid (see §5)
  ?cat=ai                       ← AI (47)
  ?cat=digital-transformation   ← Digital Transformation (51)
  ?cat=exec_coaching            ← Executive Coaching (50)
  ?cat=innovation               ← Innovation (40)
  ?cat=agile                    ← Agile (25)
/<post-slug>/                   ← posts stay here (no redirects needed)
```

## 3. Category cleanup (the core task)

1. **Empty "Uncategorized" (ID 1).** Re-assign all 44 posts to one of the 5 real categories. Most are AI/Leadership essays → map to **AI** or **Executive Coaching**. (Uncategorized posts list is in the live `posts.list` dump — categories `[1]`.)
2. **Enforce a single primary category per post** for the breadcrumb/canonical archive; keep at most 2 secondary. Posts currently carry up to 5 (e.g. `every-child-is-an-artist` has 84,83,86,85,100 — all five).
3. **Delete the orphan translation default categories** 104 (`Sin categoría`) and 103 (`غير مصنف`) **only after** confirming the multilingual plugin isn't actively using them as language defaults (deleting an in-use default can break new-post assignment). Hold for translation decision.

## 4. Deduplication + 301 redirect map

| Keep (canonical) | Redirect (301 →) | Reason |
|---|---|---|
| **18676** `ais-growth-has-been-bottom-up-not-top-down` | **17008** `ais-growth` AND **23564** `ai-adoption-didnt-start-boardroom` | 3 copies of "AI's Growth Has Been Bottom-Up" — keep the fullest slug |
| **8067** `safe-launches-native-ai-certification` | **6841** `safe-native-ai-certification` | dup "SAFe Launches First Native AI Certification" |
| **8065** `industry-disruption-at-scale` | **6849** `ai-disruption-at-scale` | dup "Generative AI Revolution: Industry Disruption at Scale" |
| **8063** `revolutions-from-dot-com-to-the-ai-era` | **6851** `evolution-of-tech-ai-era` | dup "Evolution of Tech Revolutions: Dot-Com to AI Era" |

> Verify canonical choice by checking which URL has inbound links / higher impressions in Search Console before redirecting. Set 301s, then trash (don't hard-delete) the losers.

## 5. Revised blog grid design (`/blogs/` index)

Replace the default theme loop with a filterable card grid:

- **Sticky filter bar** — 5 category pills (AI · Digital Transformation · Executive Coaching · Innovation · Agile) + search. Active pill drives `?cat=`.
- **Card** — 16:9 featured image, category chip (primary only), title (2-line clamp), 120-char excerpt, read-time, date. Hover lifts + shadow.
- **Featured strip** — top 3 most-recent or editor-picked posts as wide hero cards above the grid.
- **3-col desktop / 2-col tablet / 1-col mobile**, lazy-loaded, 12 per page with "Load more."
- **GEO/LLM payoff** — each card emits `Article` schema (headline, datePublished, author, articleSection=primary category). The category chip + section schema is the signal AI engines use to attribute topical authority.

## 6. Migration steps (safe order)

1. **Backup** (export posts XML).
2. **Recategorize** the 44 Uncategorized posts → real categories (bulk-edit in wp-admin Posts list).
3. **Trim** over-tagged posts to 1 primary + ≤2 secondary.
4. **Dedupe** — set 4 × 301 redirects (Redirection plugin), then trash the 4 duplicate losers.
5. **Rebuild** `/blogs/` index with the grid in §5.
6. **Resubmit** sitemap; spot-check category archives render.
7. **Decide translation** before touching categories 103/104.

_All post IDs/slugs above are from the live 2026-06-01 read and are safe to act on directly._
