# Chrome-Extension Work Order — agile-agilist.com
_Hand these to the Chrome extension one task at a time. Each step lists the exact URL, field, and value. Nothing here changes URLs except Task C (which is intentional + has a redirect)._

---

## TASK A — Set SEO Title + Meta Description on 7 pages (Jetpack SEO)
**Why manual:** Jetpack stores these outside standard post meta, so they can't be pushed by API. Enter them in the editor's **Jetpack** panel.

**For each page below:**
1. Go to `https://agile-agilist.com/wp-admin/post.php?post=<ID>&action=edit`
2. In the block editor, open the **Settings sidebar** (gear icon) → scroll to the **Jetpack** panel → **SEO** section (fields labeled **"SEO Title"** and **"SEO Description"**). _If you use the AIOSEO/Yoast box instead, use its Title + Meta Description fields — whichever your editor shows._
3. Paste the **SEO Title** and **SEO Description** exactly as given.
4. Click **Update**.
5. **Do NOT change the page's main Title/H1** — only the SEO Title field.

| # | ID | SEO Title | SEO Description |
|---|---|---|---|
| 1 | **961** | `SAFe Gold Partner & AI-Native Training \| Agile Agilist` | `SPCT-led SAFe certification & enterprise transformation. AI-Native SAFe from a Gold Partner serving Toronto, Canada & North America. Book now.` |
| 2 | **1835** | `Advanced SAFe Practice Consultant (ASPC) Cert \| Agile Agilist` | `Earn your ASPC certification with SPCT-led, AI-driven training for senior SPCs. Lead large-scale SAFe transformations. Reserve your seat today.` |
| 3 | **1914** | `Implementing SAFe® with SPC Certification \| Agile Agilist` | `Become a SAFe Practice Consultant. 4-day SPCT-led Implementing SAFe course + exam. Lead Agile transformation in Toronto & North America. Enroll.` |
| 4 | **1917** | `SAFe Release Train Engineer (RTE) Certification \| Agile Agilist` | `Lead Agile Release Trains & PI Planning. AI-empowered, SPCT-led RTE certification training with exam included. Toronto & North America. Book now.` |
| 5 | **1928** | `SAFe Lean Portfolio Management (LPM) Cert \| Agile Agilist` | `Master Lean budgeting, governance & portfolio strategy. SPCT-led SAFe LPM certification with exam. Serving Toronto, Canada & the US. Enroll today.` |
| 6 | **3605** | `SAFe Agile Product Management (APM) Cert \| Agile Agilist` | `Lead product strategy, vision & roadmaps with SAFe. 3-day SPCT-led APM certification training + exam. Toronto & North America. Reserve a seat.` |
| 7 | **24467** | `Leading SAFe® Certification – SAFe Agilist \| Agile Agilist` | `Earn your SAFe Agilist (SA) certification in our 2-day AI-empowered Leading SAFe course. SPCT-led, exam included. Toronto & Canada. Book today.` |

**Verify:** after Update, the browser tab title should show the new SEO Title.

---

## TASK B — Apply P2 bloat cleanup to ASPC (page 1835)
**Goal:** replace the page content with the pre-cleaned version (−15.2 KB; removes junk media-object metadata + stale nonces). Visual layout is unchanged.

1. Open `https://agile-agilist.com/wp-admin/post.php?post=1835&action=edit`
2. Editor → top-right **⋮ (Options)** menu → **Code editor**.
3. **Select all** existing content and delete it.
4. Paste the **entire contents** of the file `backups/aspc-1835-P2-cleaned.html` (from the repo / the file I sent).
5. Switch back to **Visual editor** → confirm the page looks identical (hero, trust badges, tabs all render).
6. Click **Preview** → eyeball it → then **Update**.
7. **Rollback if needed:** the file `backups/aspc-1835-backup-2026-06-01.html` is the exact original — paste it back to restore.

> Do TASK A step #2 (the SEO title for 1835) in the same editing session to save a round-trip.

---

## TASK C — 301 redirect for the old misspelled URL
**Goal:** merge SEO authority + flush stale AI/search cache from the old typo URL.

1. Go to `https://agile-agilist.com/wp-admin/tools.php?page=redirection.php` (Redirection plugin). If not installed: **Plugins → Add New → search "Redirection" → Install → Activate.**
2. **Add New** redirect:
   - **Source URL:** `/training/safe-industry/safe-for-harware/`
   - **Target URL:** `/training/adv-safe/aspc/`
   - **HTTP code:** `301 - Moved Permanently`
3. **Add Redirect** → test by visiting the old URL; it should land on the ASPC page.

---

## TASK D — Fix the generic blog slug (optional, low priority)
1. Open `https://agile-agilist.com/wp-admin/post.php?post=1754&action=edit` ("Transforming Procurement with Lean Agile Strategies").
2. In the URL/Permalink field, change slug `blog-post` → `transforming-procurement-lean-agile`.
3. **Update.** Then add a 301 (Task C method) from `/blog-post/` → `/transforming-procurement-lean-agile/`.

---

### Notes for whoever runs the extension
- Pages are **Gutenberg block** pages — use the **block editor**, not Elementor.
- Only Task B changes page content; Tasks A/C/D are metadata/URL only.
- The `®` symbol in titles is intentional; keep it.
- After all tasks, the only thing left is the GEO-manifest section pastes (separate doc: `agile-agilist-geo-seo-manifest.md`) and the Polylang install.
