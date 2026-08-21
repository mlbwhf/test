# v2 "Ledger" rollout — nav + homepage (design handoff of 2026-08-21)

Source: `prototype-v2/README.md` (in repo). Supersedes the Option B dark-palette nav.
**Every prior constraint carries forward:**

1. **Design only — site structure wins.** Real URLs, existing menu items, no invented
   pages. "All 40 countries" in the prototype → our real link
   `/indexes/geography-of-ai/popular-ai-models-by-country/` ("See every country, and why →").
   Methodology link → `/about/` until a dedicated methodology page exists.
2. **Content we built stays.** H1 "AI, BY THE NUMBERS." hero (with Figure-of-the-week
   chart panel) stays; **AI by the Numbers stays untouched**; Popular reports +
   Straight answers stay; newsletter band stays. The v2 "figures ticker" duplicates
   AI by the Numbers → intentionally NOT added.
3. **What v2 changes on the homepage (page 6):**
   - "Leading AI assistants" + "Which AI model leads in each country" +
     "AI models, rated" → merged into ONE **Model Watch** band (three ledger panels
     in a single hairline frame). Same data, new skin. (`homepage-bands.html` §1)
   - "Explore the Indexes" 4-card grid → **Index Library** 3×3 ledger band, all 9
     sections + Compare footer. (§2)
   - New **Compare + Methodology** split band inserted before the dark newsletter
     band — the HIGH/MEDIUM/DERIVED explainer is the credibility signal the funding
     application wants above the fold of the homepage. (§3)
4. **Nav:** ledger dropdowns (white, 1px ink border, numbered rows) replace the dark
   palette — `nav-ledger.css` REPLACES the "NAV OPTION B" block in the shared
   stylesheet (post 258); do not stack both. Two-pane Index Library browser requires
   the custom walker: `walker-and-toggle.php` → **owner pastes into WPCode** (PHP
   goes through WPCode's error-handling, per the standing split). Until the walker
   is active the CSS renders a clean single-pane ledger — no broken state.
5. **No Subscribe in the primary menu** (v2 agrees); utility strip unchanged.
6. **Backups before every write**; WAF-friendly small `wp_alter_post` edits; Customizer
   click-arrow setting already live; menu classes (`nav-tool`, `nav-all`,
   `menu-reports`) and Reports eyebrows already live.

## Apply order (when the WordPress connector is up)

1. Backup page 6 fragments being replaced → `backups/6-<date>-v2-bands.html`.
2. Three `wp_alter_post` swaps on page 6 per `homepage-bands.html` markers.
3. Replace the "NAV OPTION B" CSS block in post 258 with `nav-ledger.css`
   (single regex edit, anchored on the block's banner comment).
4. Owner: paste `walker-and-toggle.php` as WPCode PHP snippet (replaces the earlier
   `child-theme-snippets.php` — includes the utility strip + eyebrow filter + walker
   + pane-toggle JS; one snippet, not two).
5. Verify acceptance checklist in prototype README (JS-off view-source, iPhone taps,
   900–1280px overlap, Escape/aria).
