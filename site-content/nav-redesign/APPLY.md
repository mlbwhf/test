# Apply plan — Option B "Jump Palette" nav + Figure-of-the-week hero

Source of truth: `prototype/README.md` (design handoff). This file maps it onto the
real site. Status 2026-08-20: **blocked on the WordPress connector** (disconnected);
everything below is ready to apply the moment it returns.

Homepage content below the hero is **unchanged** — AI by the Numbers, Leading AI
Assistants, Popular Models by Country etc. stay exactly as structured today (owner
direction, 2026-08-20). The hero is added above them.

## Step 1 — Menu 34 (primary), Appearance → Menus equivalent via MCP

Real URLs (handoff slugs were illustrative). Top level: **Indexes, Reports, Glossary,
About** — remove Subscribe from primary nav if present (it moves to the utility strip).

Under **Indexes** (order = palette numbering 01–09, then tool rows):

| # | Label | URL | CSS class | Notes |
|---|-------|-----|-----------|-------|
| 01 | Enterprise AI Adoption | /indexes/enterprise-ai/ | | hub 393 |
| 02 | AI Business & Economics | /indexes/ai-economics/ | | hub 392 |
| 03 | Technical Performance | /indexes/technical-benchmarks/ | | hub 394 |
| 04 | Workforce & Labor | /indexes/workforce-labor/ | | |
| 05 | The Dark Side of AI | /indexes/ai-dark-side-statistics/ | | index 576 |
| 06 | State of AI | /indexes/state-of-ai/ | | |
| 07 | The Geography of AI | /indexes/geography-of-ai/ | | hub 930 |
| 08 | *(verify)* | | | pull sections 8–9 from Indexes hub (page 39) — handoff lists Regulating AI + AI by Industry; confirm real slugs before creating |
| 09 | *(verify)* | | | |
| — | Compare Tool | /indexes/compare/ | `nav-tool` | page 360 |
| — | View full Index Library | /indexes/ | `nav-all` | |

Under **Reports** (top-level item gets class `menu-reports`; each child's
**Description field** = eyebrow text):

| Label | URL | Description |
|-------|-----|-------------|
| The Dark Side of AI | /reports/dark-side-of-ai/ | Collection |
| Real-World AI | /reports/real-world-ai/ | Collection |
| Latest Reports | /reports/ | News |
| All Reports | /reports/ | *(class `nav-all`, no description)* |

MCP mechanics: menu items are `nav_menu_item` posts. Update via `wp_update_post` +
`wp_update_post_meta`: URL in `_menu_item_url`, nesting in `_menu_item_menu_item_parent`,
CSS classes in `_menu_item_classes` (serialized array), ordering in `menu_order`.
The eyebrow **Description** is the nav_menu_item post's `post_content` field
(`wp_setup_nav_menu_item` maps post_content → description). Verify on one item,
then batch. Screen-Options toggles are wp-admin UI only — irrelevant via MCP.

## Step 2 — Customizer setting

`generate_settings` option → `nav_dropdown_type` = `click-arrow` (Dropdown behaviour:
"Click – arrow"). Read the option first, change only that key, write back
(`wp_get_option` / `wp_update_option`). Take a copy of the original value into
`backups/generate_settings-YYYYMMDD.json` first.

## Step 3 — CSS

`additional-css-nav.css` → merge INTO the existing shared stylesheet (Additional CSS,
post 258). Standing rule: refactor the existing sheet, never append a duplicate block.
Check for collisions with existing `.main-navigation` rules first.

## Step 4 — PHP snippets

`child-theme-snippets.php` → one new WPCode PHP snippet ("Report AI — nav support"):
utility strip via `generate_before_header` + Reports eyebrow filter. Subscribe/Contact/
Log in appear ONLY here.

## Step 5 — Homepage hero

`homepage-hero.html` → insert at the very top of page 6 content (draft-first per
standing rules is impossible on the live homepage; take the full-content backup to
`backups/6-YYYYMMDD.html` before the write, then `wp_alter_post` an anchor-based
insert). Everything below stays untouched. Weekly refresh = edit the `WEEKLY-EDIT`
lines only. Chart uses the real McKinsey series 55/72/78/88 (the prototype's
32/44/55/78 was placeholder data).

## Step 6 — Verify (acceptance checklist from the handoff)

- [ ] 9 sections + Compare in the Indexes palette, numbers from CSS counters
- [ ] Mobile: tap arrow opens palette, tap label navigates, no dead first tap
- [ ] view-source with JS off: every second-level `<a href>` present
- [ ] Tab order complete; Escape closes; `aria-expanded` toggles
- [ ] Publishing a new index page requires no menu edit
- [ ] Subscribe/Contact/Log in only in the utility strip
- [ ] No flyout overflow at 769–1100px widths
- [ ] Hero renders above unchanged existing sections; mobile stacks to one column

## Phase 2 (later, explicitly deferred)

- Bottom-sheet mobile menu + tab chrome (~30 lines child-theme CSS/JS)
- "Jump to a section…" live filter row
