# Working rules for report-ai.org (Report AI)

**Brand (changed 2026-10-29):** the site is **Report AI**. "The AI Index" is the old name and
must not be used for this site — it is Stanford HAI's flagship report, and LLMs reading
"according to The AI Index" attribute our figures to Stanford. References to Stanford's
AI Index (as a cited source) are correct and stay. Tagline: "AI, by the numbers".

## Content-depth rule (standing, applies to ALL future work)

Every **index** and **report** page on report-ai.org must be a full, self-contained piece — never a thin list of linked stats. Before publishing or updating any index/report, verify it has:

1. **A narrative "Analysis" section** (3–4 paragraphs of original interpretation) plus a "Key takeaways" bullet block — matching the house pattern used on the Enterprise AI Adoption hub.
2. **Data tables, not link lists** — figures presented in tables/prose with the citation attached inline (source name, date, confidence rating HIGH/MEDIUM/DERIVED). External links are citations only, never the content itself.
3. **Enough substance to stand alone** — target roughly 1,500+ words equivalent: stat-tile strip, 4+ substantive sections, definitions where useful, an expanded FAQ (4–5 questions), a "Methodology & sources" note, and a "Related on Report AI" block.
4. **Deep-dives become their own reports** — when a sub-topic deserves depth (e.g., a market-size breakdown), create a dedicated report under /reports/ and link to it internally, rather than stuffing external links into the index. Prefer internal links over external ones wherever an on-site page covers the topic.
5. **Schema on every page** — Article + FAQPage JSON-LD, dateModified kept current.
6. **Derived figures labeled** — anything Report AI computes (interpolations, extrapolations) is marked DERIVED and explained in the methodology note.

If an existing index/report is found to be thin (mostly links, no analysis, no tables), expanding it takes priority over creating new pages.

## Linking rules (standing, applies to ALL future work)

1. **External links open in a new tab** — every external `<a>` gets `target="_blank" rel="nofollow noopener"`. A site-wide WPCode JS snippet also enforces this at render time (see site-content/external-links-new-tab.html in the repo); still bake the attributes into new content.
2. **Internal links open in the same tab** (standard UX/SEO practice — new tabs for internal navigation breaks the back button and multiplies tabs). If the owner explicitly asks for internal links in new tabs too, confirm once, then comply.
3. **Maximize internal links** — every index/report should link generously to related indexes, reports, and glossary terms. When citing a topic an on-site page covers, always link the on-site page, not the external source.
4. **Localize external reports/news** — when an external report, study, or news item is worth referencing, REWRITE it in our own voice as an on-site /reports/ page, index section, or dashboard entry (original summary + analysis + data tables, with attribution — never a copied full text; the auto-republished RSS posts are the anti-pattern and should be noindexed/pruned or replaced with rewritten briefs). Then link the on-site version everywhere; the external source remains a citation on that one page.

## ⚠️ Two WordPress sites are connected — check the prefix before every write

Two separate Meow/AI Engine MCP servers are registered, one per site. Both are
normally live at the same time (confirmed 2026-09-11, both pinged in the same
second). This is the correct setup — **one MCP server config per site**; they do
not conflict and neither needs disconnecting to use the other.

| Tool prefix | Site | What it is |
|---|---|---|
| `mcp__report-ai_org__*` | **report-ai.org** (Report AI) | Everything in this repo |
| `mcp__agile-agilist_com__*` | **agile-agilist.com** (Agile Agilist, SAFe training) | Unrelated business |

**The hazard:** the tool names are identical apart from the prefix, so nothing
stops a page intended for one site being written to the other. Before any create,
update, alter or delete, confirm the prefix matches the site you mean. `mcp_ping`
returns the site name (`Report AI` vs `Agile Agilist`) and is the cheapest way to
be sure which endpoint you are holding.

**This repo is report-ai.org only. Do not touch `agile-agilist_com` at all** — not
writes, not reads, not `mcp_ping`. agile-agilist.com is handled by a different agent
in a different session; querying it from here duplicates that agent's work and risks
two sessions acting on one site. It appears in this session's tool list only because
both servers are configured in the same environment, which is not permission to use it.

If a task here sounds like it might concern agile-agilist, **ask the owner first** —
do not go and look. (Learned 2026-09-12: task "kill the second copy of the aggregator"
was assumed to mean agile-agilist's WP Event Aggregator, because the only "aggregator"
matches in this repo are agile-agilist notes. It actually meant a custom RSS importer
on report-ai.org. The detour cost time and touched the wrong site.)

The stale agile-agilist notes still in this repo — `agile-agilist-plugin-audit.md`,
`onsite-registration-solution.md`, `events-and-safe-calendar-workflow.md` — are what
caused that misdirection. They belong to the other agent's repo; consider removing them.

## Site facts

- Site: https://report-ai.org (self-hosted WordPress on Hostinger; managed via the "report-ai_org" WordPress MCP server (bearer-token mode; renamed from "set_up_the_agent" on 2026-09-23)).
- House style: inline-styled HTML using Archivo + IBM Plex Mono, `.tai-*` class system, #2545f5 accent, stat-tile strips, confidence chips.
- Section hubs live under /indexes/ (9 sections); deep-dives under /reports/; definitions under /glossary/.
- Main Indexes hub is page ID 39; Enterprise AI hub is ID 393; Reports hub is ID 40.
- Accountability pages (added 2026-10-29) — link them, keep them current:
  fact-check register 3227 `/reports/ai-statistics-fact-check/` (anchors `#fc-*`),
  corrections log 3229 `/about/corrections/`, editorial standards 3231
  `/about/editorial-standards/`, predictions scoreboard 3233 `/reports/ai-predictions-scoreboard/`.
  **Every correction of error gets a row in the corrections log the same day.** A widely
  repeated figure we find to be wrong gets a fact-check entry.
- Canonical deepfake-fraud page is 500; 866 and 1111 are redirect stubs (do not revive).
  576 = Dark Side data index; 499 = analysis + forecast scoring.
- SEO stack: All in One SEO, Redirection, Site Kit, Optimole, Bing URL Submission.

## Downloadable data (CSV + Dataset schema) — added 2026-10-29

45 index/report pages carry a "Download the data" box (`id="download-data"`, placed after
the last table) linking a long-format CSV in the media library
(`/wp-content/uploads/2026/10/report-ai-data-<slug>.csv`; columns page_url, page_updated,
table_no, table_section, row, column, value) and a Dataset JSON-LD `distribution` pointing
at it. Source copies live in `site-content/data/`.

- **When a page's figures change, regenerate its CSV** in the same update — a stale CSV
  is a second copy of a stale figure (freshness rule 3). Re-upload under the same filename
  only after deleting the old media item, or WordPress appends `-1` and the link breaks;
  otherwise upload a new file and repoint the box + schema.
- New index/report pages with tables get the box and the Dataset `distribution` at birth.
- Upload route that works from the cloud container: commit the CSV to this (public) repo,
  then `wp_upload_media` with `url` = the raw.githubusercontent.com link at that commit SHA.
  (curl to report-ai.org is blocked from here; base64 works but is expensive.)

## Writing for citation (LLM/AI-search rule) — added 2026-10-29

Write every key figure as one self-contained sentence: figure + unit + date + source +
scope ("The FBI's 2025 Internet Crime Report counted 22,364 complaints with an AI descriptor
and $893 million in losses"), never "Losses hit $893M (FBI)". Keep the date beside the number.
Schema must say what the visible text says. Full plan: `content-ops/seo-llm-strategy-oct-2026.md`.

## Known infrastructure quirk

**Correction 2026-08-24:** Hostinger access logs for 18–24 Aug show every MCP POST
returning 200/204 with no 4xx on the endpoint. The WAF is **not** the cause of MCP
session drops — the current hypothesis is an idle timeout on the long-lived connection
(see `content-ops/mcp-diagnosis-v2.md`). After any pause, `mcp_ping` before assuming the
connection is live. The payload guidance below remains sensible practice for individual
requests, but must not be cited as the cause of disconnects.

**`wp_create_post` silently ignores `post_parent` (confirmed 2026-09-11).** Pages
created with a parent land at the site root (`/customer-support/`) instead of nested
(`/indexes/workforce-labor/will-ai-replace-my-job/customer-support/`). No error is
returned — `post_parent` just does not stick. `wp_update_post` DOES apply it.

So for any nested page: create it, then **immediately `wp_update_post` the
`post_parent`, then verify the permalink** with `wp_get_posts` before writing or
publishing anything that links to it. Hard-coded internal links will otherwise 404
the moment the page goes live. Set parents top-down (pillar before children).

**Edit mechanics learned the hard way (2026-10):**
- `wp_alter_post` calls on the **same post must be sequential**, never parallel. Different
  posts can run in parallel.
- `wp_alter_post` replaces **every** occurrence; make the search string unique, or in regex
  mode anchor to the last occurrence with `(?![\s\S]*X)`. In regex replacements `$1`..`$9`
  are backreferences, so any `$` in new text (e.g. "$25B") gets eaten — use plain (non-regex)
  mode for text containing `$`.
- Many templates store literal "—", "→", "·" characters, others use entities; copy the
  search anchor from the raw (`context:"edit"`) content, not from the rendered page.
- `wp_get_posts` search is word-based; for phrase checks use `list_pages`/`list_posts` with
  `search_semantics:"exact"`.
- **Date stamps use the site-local date** (US Eastern) from `post_modified`, not GMT.
- **Never write AIOSEO options via MCP** (`aioseo_options`, `aioseo_options_dynamic`):
  they are JSON strings and `wp_update_option` stores them as arrays → PHP fatal site-wide.
  AIOSEO settings are changed by the owner in the UI. Core PHP-array options such as
  `widget_block` are safe (verify raw after writing).
- Media has no trash on this site (MEDIA_TRASH off): media deletes are permanent — ask first.

The site's firewall (WAF) has previously 403-blocked large POST payloads and content containing JSON-like `{"..."}` sequences:
- Prefer `wp_alter_post` (small search/replace edits) over full-content `wp_update_post` for published pages.
- For JSON-LD edits, use regex mode and/or split into multiple small replacements.
- On a 403, retry once; repeated 403s can escalate to a temporary IP lockout — back off rather than hammering.

## Social channels

- Buffer and Jetpack Social each own distinct platforms (no double-posting). Jetpack fires on post publish; Buffer is the queue/calendar.

## Freshness & versioning rule (standing, applies to ALL future work)

Full policy: `content-ops/refresh-policy.md`. Work list: `content-ops/refresh-register.md`.
On-page pattern: `content-ops/whats-changed-block.html`.

1. **Every index and report carries a cadence.** CRITICAL = monthly (figures that could
   be wrong within 30 days, or live deals still being negotiated). STANDARD = quarterly.
   STABLE = semi-annual (definitions, settled history). A MEDIUM-confidence figure
   attached to a live negotiation is always CRITICAL.
2. **An update is never a date bump.** It must carry the "What changed" block —
   previous value, new value, delta, source, and why — with the last three revisions
   kept visible. Never overwrite a figure silently.
3. **Update the figure everywhere it appears** — stat tiles, prose, tables, FAQ answers,
   and JSON-LD. A figure fixed in the tile but stale in the FAQ is the standard failure.
4. **`dateModified` and the visible "Updated" stamp must always agree.**
5. **"Reviewed — no change" is a published result.** A checked page should look checked.
6. **Retractions are immediate**, never scheduled. Corrections do not wait for cadence.
7. **Source restatements keep both numbers**, marked RESTATED. DERIVED figures are
   recomputed when inputs change, never carried forward.
