# Execution log — "go ahead with all" (29 Oct 2026)

Progress record so worker restarts can't lose state.

- [x] Social profile URLs recovered from Jetpack share meta → backups/social-profiles-2026-10-29.md
- [x] **94 News posts trashed** (reversible). Verified: News count 0, trash 94, 36 genuine posts remain.
- [x] Author display name: email → "Report AI Editorial Team"
- [!] AIOSEO settings NOT changed via API: options are stored as JSON strings; the MCP
      option tool decodes JSON into arrays → AIOSEO json_decode(array) = PHP 8 fatal error.
      Owner checklist instead (see final section).
- [!] Feedzy RSS Feeds Lite + WP RSS Aggregator still installed → deactivate/delete (owner; no plugin-activation tool).
- [!] LiteSpeed Cache active → purge after this session so edits show.
- [x] **Brand rename "The AI Index" → "Report AI"** — 96 pages, ~281 occurrences (bylines,
      cite lines, "Related on…", JSON-LD names). 9 JSON-LD blocks with alternateName "Report AI"
      set to "report-ai.org" first. Exact-phrase search afterwards: **0 remaining** in pages/posts.
      Full raw pre-rename backup: backups/content-snapshot-2026-10-29.json.gz. No Stanford
      references were touched (none within 80 chars of any match).
- [x] 546 FAQ: removed my own unverified "often misreported" claim; re-stamped 29 Oct.
- [x] NEW PAGES, all live, parents set, permalinks verified, every internal link checked:
      - 3227 /reports/ai-statistics-fact-check/ — 13 entries, anchors #fc-*, Article+FAQPage
      - 3229 /about/corrections/ — 24 corrections of error + 5 major supersessions, Aug→Oct 2026
      - 3231 /about/editorial-standards/ — sourcing, confidence scale, writing-for-citation rule,
        cadence, forecasts, corrections, **AI-tool use disclosure**, independence/disclosure
      - 3233 /reports/ai-predictions-scoreboard/ — 13 forecasts, hit-tests written in advance,
        3 due Jan 2027 incl. our own kill-switch odds
- [!] Logo file is cropped-AI-Index-Logo.png — likely shows old name; vision check failed (AI
      Engine model unavailable) and the image is not fetchable from here. Owner to check.
- [x] **About page (7)**: removed the line selling Agile Agilist training/assessments
      (breached the independence firewall); kept the ownership disclosure, made the link
      nofollow/new-tab, added an independence statement + links to standards, corrections,
      fact-check, scoreboard.
- [x] Homepage (6): methodology link → editorial standards + corrections; fact-check and
      scoreboard added to "Popular reports".
- [x] Reports hub (40): new "Accountability" row (3 cards); **the Sept reports 2589, 2553, 2293
      were missing from the hub entirely** — added; JSON-LD hasPart extended.
- [x] **Sidebar widget (every page)** rewritten: "$25M largest heist" → €95M Fideuram;
      "74% contain AI content" → "some AI content"; stale-flagged "52 index score" replaced with
      FBI $893M; broken nudify link fixed; "~98%" aligned to 541's "96–98%"; Aug "latest"
      items → Oct; new "Checked & scored" block. Stored as PHP array (verified raw).
- [x] Broken nudify slug also fixed on 498 (hub), 503, 576 (5 instances).
- [x] **Consolidation 500 ← 866 + 1111**: unique material from both (Sumsub +700%, Entrust
      every-5-min / 24% liveness / 244% docs, iProov 0.1%, 55.5% meta-analysis, Deepfake-Eval 78%,
      FBI 2024 $16B, Deloitte $11.5B email scenario, C2PA/SynthID provenance, FTC Voice Cloning
      Challenge) merged into 500 as "Attack volume, detection and provenance" + new FAQ;
      500 re-stamped 29 Oct. 866 and 1111 → redirect stubs (instant meta refresh + JS
      location.replace + visible link); tags verified preserved. All 7 inbound internal links
      repointed to 500; exact-search confirms 0 remaining. 576 list de-duplicated (17 → 16).
      **Owner: add two 301s in Redirection to make these server-side** (see checklist).
- [x] 499 vs 576 differentiated with explicit role statements and cross-links
      (576 = data index; 499 = analysis + forecast scoring).
- [x] **CSV downloads + Dataset schema — 45 pages, 98 tables, 2,091 cells.**
      Long-format CSV per page (page_url, page_updated, table_no, table_section, row, column,
      value), extracted from live content; source copies in `site-content/data/`, uploaded to
      the media library by URL from the public repo (commit 72c34bc). Visible "Download the
      data" box after the last table (+ its source note) on every page. Schema: 21 pages had a
      Dataset object → `distribution` (DataDownload, text/csv) added; 24 pages got a new
      Dataset JSON-LD. Verified: all 45 live pages byte-identical to the locally simulated
      result, every JSON-LD block parses, exactly one box per page.
- [x] **Article schema was missing on 11 pages** (CLAUDE.md rule 5): 1100–1104, 1112–1115,
      964, 576 — added with the new Dataset block. dateModified matches the visible stamp
      ("Updated July 2026" → 2026-07-28; 964 → 2026-09-10); omitted where the page shows no
      date (576, 1102, 1104).
- [!] 1104 (model security ratings) still has no FAQPage and no visible update date; 576 and
      1102 have no visible update stamp. Need a content pass, not a schema patch.
- [x] **Stale $25M record fixed**: 498 hub stat tile "$25M largest single deepfake heist" →
      €95M (Fideuram, Sept 2026; was Arup $25M); card blurb + card title + hub JSON-LD
      "The $25M Heist Era" → "The Nine-Figure Heist Era"; same stale link title on 1195; 500
      Article description now leads with the €95M record. Logged in the corrections log (3229).
- [x] **Empty excerpts: 39 pages had none** (Indexes hub, 6 section hubs, glossary + 9 terms,
      12 data indexes incl. 576/421/413, Contact, Terms, 3 news briefs). With AIOSEO set to
      `#post_excerpt` these would have fallen back to the same breadcrumb text. All 39 now
      have a written excerpt (119–181 chars, no new figures). Verified: 0 empty; content of
      the 13 comparable pages unchanged. 26 blog posts also lack excerpts but their
      auto-excerpt is the opening prose, not junk — left as is.
      → **The owner's AIOSEO switch (Pages meta description `#post_content` → `#post_excerpt`)
      is now safe to make.**
- [~] **Per-page OG images — not done, deliberately.** AIOSEO decides the og:image source and
      its settings can't be changed safely via MCP; featured images are ignored while the
      source is "default image". The existing August stat cards (media 1482–1491) are not
      used on any page, and two of them (1489 "AI Slop 74%", 1488 "Deepfakes 98%") show
      superseded figures — do not reuse them. Owner path: AIOSEO → Social Networks →
      Facebook → Default Post Image Source = Featured Image, then a templated card per index.
- [!] Test upload `report-ai-upload-test.csv` (media 3264) left in place: media has no trash
      here, so deletion is permanent and needs the owner's OK. Nothing links to it.
- [x] CLAUDE.md updated: brand, accountability pages, CSV maintenance rule, writing-for-citation
      rule, edit mechanics (sequential same-post edits, `$` in regex replacements, site-local
      dates, AIOSEO hazard, no media trash).

## Owner checklist (things only the owner can do)

1. **AIOSEO → Search Appearance → Content Types → Pages → Meta Description:** `#post_content`
   → `#post_excerpt`. Safe now: every page has a written excerpt. Spot-check 3 pages after.
2. **AIOSEO → General → Organization/Schema:** name "Report AI"; alternate name
   "report-ai.org"; description "Independent AI statistics. Every figure traced to its primary
   source, dated, confidence-rated and corrected in public."; founding date; social profiles —
   X https://x.com/AIbyNumbers · LinkedIn https://www.linkedin.com/company/142992294/ ·
   Threads https://www.threads.com/@the.ai.index · Facebook https://www.facebook.com/1232377199960917
3. **AIOSEO homepage title** "Home - The AI Index" → "Report AI — AI, by the numbers" (or similar).
4. **AIOSEO sitemap:** exclude the Attachment post type. **llms.txt** description → the
   positioning line in item 2.
5. **Redirection plugin — two 301s** into `/reports/dark-side-of-ai/ai-deepfake-fraud-statistics/`
   from `/reports/dark-side-of-ai/ai-deepfakes-fraud-statistics/` and
   `/indexes/ai-dark-side-statistics/deepfake-fraud-scams-2026/`.
6. **Logo** `cropped-AI-Index-Logo(-1).png` — check for the old name.
7. **Plugins:** deactivate/delete Feedzy RSS Feeds Lite and WP RSS Aggregator.
   **Purge LiteSpeed Cache** after that.
8. **Bing Webmaster Tools** verification + confirm IndexNow submissions fire (Bing URL
   Submission plugin). **GA4** channel group for AI referrers. Start the monthly
   AI-assistant citation check (20 core questions).
9. **Social display names** still say "The AI Index" / the.ai.index → Report AI.
10. **Named editor** for the editorial standards page (or keep "Editorial Team").
11. **OG images:** AIOSEO → Social Networks → Facebook → Default Post Image Source =
    Featured Image, then a card per index. Don't reuse media 1488/1489 (superseded figures).
12. **Delete media 3264** (`report-ai-upload-test.csv`, my test upload) — permanent on this site.
