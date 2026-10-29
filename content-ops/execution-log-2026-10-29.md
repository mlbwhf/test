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
