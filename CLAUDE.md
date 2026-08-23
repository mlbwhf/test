# Working rules for report-ai.org (The AI Index)

## Content-depth rule (standing, applies to ALL future work)

Every **index** and **report** page on report-ai.org must be a full, self-contained piece — never a thin list of linked stats. Before publishing or updating any index/report, verify it has:

1. **A narrative "Analysis" section** (3–4 paragraphs of original interpretation) plus a "Key takeaways" bullet block — matching the house pattern used on the Enterprise AI Adoption hub.
2. **Data tables, not link lists** — figures presented in tables/prose with the citation attached inline (source name, date, confidence rating HIGH/MEDIUM/DERIVED). External links are citations only, never the content itself.
3. **Enough substance to stand alone** — target roughly 1,500+ words equivalent: stat-tile strip, 4+ substantive sections, definitions where useful, an expanded FAQ (4–5 questions), a "Methodology & sources" note, and a "Related on The AI Index" block.
4. **Deep-dives become their own reports** — when a sub-topic deserves depth (e.g., a market-size breakdown), create a dedicated report under /reports/ and link to it internally, rather than stuffing external links into the index. Prefer internal links over external ones wherever an on-site page covers the topic.
5. **Schema on every page** — Article + FAQPage JSON-LD, dateModified kept current.
6. **Derived figures labeled** — anything The AI Index computes (interpolations, extrapolations) is marked DERIVED and explained in the methodology note.

If an existing index/report is found to be thin (mostly links, no analysis, no tables), expanding it takes priority over creating new pages.

## Linking rules (standing, applies to ALL future work)

1. **External links open in a new tab** — every external `<a>` gets `target="_blank" rel="nofollow noopener"`. A site-wide WPCode JS snippet also enforces this at render time (see site-content/external-links-new-tab.html in the repo); still bake the attributes into new content.
2. **Internal links open in the same tab** (standard UX/SEO practice — new tabs for internal navigation breaks the back button and multiplies tabs). If the owner explicitly asks for internal links in new tabs too, confirm once, then comply.
3. **Maximize internal links** — every index/report should link generously to related indexes, reports, and glossary terms. When citing a topic an on-site page covers, always link the on-site page, not the external source.
4. **Localize external reports/news** — when an external report, study, or news item is worth referencing, REWRITE it in our own voice as an on-site /reports/ page, index section, or dashboard entry (original summary + analysis + data tables, with attribution — never a copied full text; the auto-republished RSS posts are the anti-pattern and should be noindexed/pruned or replaced with rewritten briefs). Then link the on-site version everywhere; the external source remains a citation on that one page.

## Site facts

- Site: https://report-ai.org (self-hosted WordPress on Hostinger; managed via the "set_up_the_agent" WordPress MCP server).
- House style: inline-styled HTML using Archivo + IBM Plex Mono, `.tai-*` class system, #2545f5 accent, stat-tile strips, confidence chips.
- Section hubs live under /indexes/ (9 sections); deep-dives under /reports/; definitions under /glossary/.
- Main Indexes hub is page ID 39; Enterprise AI hub is ID 393.
- SEO stack: All in One SEO, Redirection, Site Kit, Optimole, Bing URL Submission.

## Known infrastructure quirk

The site's firewall (WAF) intermittently 403-blocks large POST payloads and anything containing JSON-like `{"..."}` sequences:
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
