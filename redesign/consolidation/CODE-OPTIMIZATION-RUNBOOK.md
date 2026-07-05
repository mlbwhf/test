# Code Optimization Runbook — CSS/JS Consolidation (Rule 10/11)
**Date:** 2026-07-05 · **Canonical choice (your call):** WordPress-native → **Astra Customizer Additional CSS** is THE stylesheet. WPCode keeps only JS + PHP.

---

## 1. Inventory (before)

| # | Source | Type | State |
|---|---|---|---|
| 1 | Astra Customizer Additional CSS | CSS ~20K | Kept — becomes the canonical sheet (replaced with consolidated file) |
| 2 | WPCode "AA - Global CSS" (mega menu) | CSS | MERGE → section G of consolidated file, then **delete snippet** |
| 3 | WPCode "AA – Course CSS" | CSS ~14K | MERGE → sections I–N, then **delete snippet** |
| 4 | WPCode "emergency snipp it" | CSS | Already merged previously → **delete snippet** if still active |
| 5 | WPCode "Assessments Hub CTA rewriter" | JS | REPLACE code with `snippets/wpcode-message-pivot-cta-v2.js` (message pivot + sitewide HubSpot safety net) |
| 6 | WPCode "AA – Course JS" | JS | Keep as-is (no changes needed) |
| 7 | WPCode "AA – Book a Consult popup" | PHP | REPLACE with `snippets/aa-book-consult-popup-FIXED.php` — **bug: broken nested shortcode meant the form never rendered** |
| 8 | WPCode "Fluent Forms cohort populate" | PHP | Keep as-is |
| 9 | WPCode "aa_cohorts shortcode" | PHP | Keep, ONE edit needed (see §3.4) |
| 10 | Per-page `<style>` blocks (About, quizzes, pillar, course pages) | CSS | Phase 2 — strip AFTER the canonical sheet is verified live (frozen /training/ pages excluded for 30 days) |

## 2. Bugs found & fixed in the merge (`aa-customizer-consolidated.css`)

1. **Breadcrumbs**: three contradictory rule-sets (14px / 22px `!important` / 4px `!important`) were fighting. Collapsed to ONE block = the approved tight breadcrumb fix. *(This is the only intentional visual change.)*
2. **Nav "dark pill" kill** declared 3× at escalating specificity → only the winning `html body` block kept. Output identical, ~60 lines removed.
3. **"Book Consult" button** styled twice (sections 4 + 13) → merged, all selectors preserved.
4. **`.admin-bar body` → `body.admin-bar`** — old selector never matched (the class is on `<body>`), so logged-in admin views had the wrong top offset.
5. **`@import` Google Font** was mid-file in Course CSS (invalid position once merged) → moved to line 1. **Native upgrade recommended:** load Newsreader via Appearance → Customize → Typography, then delete line 1 — Astra adds preconnect and loads it faster. Better performance + more native.
6. **Events-calendar row styling** was defined differently in two files (white vs teal date chip) — which one won depended on load order. Kept the version currently rendering (white cohort rows); removed the shadowed rules.
7. All raw hex values swapped to the `:root` tokens (single palette source — translation/rebrand ready). Values unchanged.
8. **Added shared classes** (additive): `.aa-msg-embed` (Message Mark form card) and `.aa-legal` (legal pages wrapper) — so new pages stop shipping their own `<style>` blocks.

`!important` count: reduced only where rules were exact duplicates. Remaining ones fight Astra/plugin inline styles and are load-bearing; removing them needs per-page visual verification (phase 2).

## 3. Apply steps (do in this order)

1. **Backup current state**: copy the existing Customizer → Additional CSS into a text file (keep it until verification passes).
2. **Paste** `redesign/consolidation/aa-customizer-consolidated.css` into Appearance → Customize → Additional CSS → Publish.
3. **WPCode**: replace code in the assessments-CTA snippet with `snippets/wpcode-message-pivot-cta-v2.js`; replace the Book-a-Consult popup PHP with `snippets/aa-book-consult-popup-FIXED.php`. Save both.
4. **aa_cohorts PHP snippet** — one line to change (message pivot): the empty-state text links to HubSpot. Change
   `<a href="https://meetings.hubspot.com/john2795">request a date</a>`
   → `<a href="/about/#message">request a date</a>`.
   (The sitewide JS safety net in step 3 covers it either way, but fixing the source is cleaner.)
5. **Deactivate + delete** WPCode snippets: "AA - Global CSS", "AA – Course CSS", "emergency snipp it". *(Deactivate first, verify, then delete.)*
6. **Flush Jetpack/CDN cache.**

## 4. Verify (Rule 11 — output must not change except breadcrumbs)

Screenshot before/after and compare:
- Homepage · Leading SAFe `/training/safe/sa/` (ad landing page — **roll back immediately if anything regresses**) · Cert Recommender · About · Assessments hub · every other ad landing page under `/training/`
- Check specifically: mega menu hover (Training/Assessments/Services), sticky header offset, footer, course-page cohort rows, breadcrumbs (should now be tight — intended change), "Book a consult" popup now actually shows the form.

**Rollback:** re-paste the step-1 backup into Additional CSS, re-activate the two deleted CSS snippets, flush cache.

## 5. Performance / SEO / LLM wins from this pass
- 2 fewer CSS sources parsed on every page; zero load-order-dependent styling left.
- Astra-native Additional CSS = survives plugin changes, editable in Customizer with live preview (your "native" preference).
- Newsreader via native typography (after step §2.5) removes a render-blocking `@import`.
- One token set in `:root` → consistent palette for schema-matching brand signals and for the fr-CA/es/ar rollout (one sheet serves all language versions; RTL overrides will be one small addition later).
- Phase 2 (after this sheet is verified): strip duplicated `<style>` blocks from About/quizzes/pillar pages → smaller HTML payloads, better LCP.
