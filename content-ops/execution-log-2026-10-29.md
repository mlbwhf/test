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
