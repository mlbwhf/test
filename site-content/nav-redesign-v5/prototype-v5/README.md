# Handoff: Report AI — Global Nav + Homepage (WordPress / GeneratePress)

## Overview
Redesign of **report-ai.org**: global navigation (ledger-style dropdowns with a two-pane Index Library browser) and the homepage (Figure-of-the-week hero, right sidebar, figures ticker, Model Watch, Index Library band, Compare + Methodology band). Goals in priority order: credibility (measurement-institution signal), findability of the 9 index sections + Reports, low maintenance (nav never edited when a page publishes), mobile/touch support, **LLM/crawler accessibility** (every link server-rendered at all times).

## How to view the prototypes
Open any `.dc.html` file directly in a browser (keep `support.js` in the same folder). `Report AI Homepage.dc.html` has a **Desktop / Mobile toggle in the top-right** — Mobile renders the full stacked homepage in a 390px frame with a working nav drawer (tap the hamburger). Both views live in the same file and share the same data.

## About the Design Files
The `.dc.html` files are **interactive design references** — open in a browser to inspect look and behavior. They are prototypes, NOT production code. Recreate the designs inside the existing WordPress + GeneratePress theme using its mechanisms (`wp_nav_menu()`, block/theme templates, Customizer Additional CSS, child-theme PHP filters). Do not ship the prototype JS.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and interaction states are final.

## Design tokens
- Accent cobalt `#2545f5` · Ink `#111114` · Surface `#f5f5f7` · Hairline `#e6e6ea`
- Secondary grays: body `#44444a`, muted `#77777f`, faint `#b8b8bf`, row divider (light) `#f0f0f2`, inactive bar `#d8d8de`, bar track `#f0f0f2`/`#e6e6ea`
- Fonts (Google): **Archivo** 400–900 (headings/UI), **IBM Plex Mono** 400–600 (labels, meta, eyebrows, numbers)
- Radius 0 (2–3px max). No shadows, no gradients. Mono eyebrows: 10–12px uppercase, letter-spacing 0.04–0.08em. Heading tracking −0.02em to −0.05em.
- Page container: max-width 1280px, centered, 1px hairline left/right borders, white on `#f5f5f7` body.

## 1. Navigation

### Information architecture (Appearance → Menus)
Primary (4 items): **Indexes · Reports · Glossary · About**.
Utility strip (secondary menu, right-aligned above the bar): Subscribe · Contact · Log in. **Never** put Subscribe/CTAs in the primary menu.

**Header layout:** three-column grid `1fr auto 1fr` with 20px/40px padding — wordmark **left**, primary menu **optically centered** in the header, third column empty (reserved for a future search/CTA). Do not use `justify-content:space-between`; the menu must stay centered as items are added or removed.

- Indexes → 9 section hubs + Compare Tool (level 2), each section's index pages (level 3, auto-generated — see below).
- Reports → **two levels, same pattern as Indexes**: 3 collections (level 2) → that collection's reports (level 3, auto-generated from the Reports CPT/taxonomy) + "All Reports →" footer. Collections: The Dark Side of AI · Real-World AI · Latest Reports.
- Glossary, About → flat links, no dropdown.
- Numbers 01–09 are **CSS counters**, never typed into labels (reorder = auto renumber).

### Desktop — Indexes dropdown: two-pane Library browser
Anchored to the **header row** (`position:relative` on the primary-nav row; panel `position:absolute; top:100%; left:50%; transform:translateX(-50%)` — centered under the centered menu), never to the menu item — prevents viewport clipping. `top:100%` exactly: **no gap** between the nav row and the panel, or the pointer leaves the menu on the way down and the panel closes. Width `min(760px, 100vw - 80px)`, white, 1px ink border, grid `minmax(220px,300px) 1fr`.
- **Left rail** — the 9 sections: grid row `28px 1fr auto`, padding 11px 18px, hairline dividers; mono cobalt number, Archivo 700 14px name, mono arrow (cobalt when active, `#d8d8de` idle). **Active/hovered row: bg `#eef1fd`, text cobalt `#2545f5`, 3px cobalt left marker (`box-shadow: inset 3px 0 0 #2545f5`), 120ms ease** — hovering a section *is* selecting it, so the two states are one. Footer row on `#f5f5f7`: "Compare Tool →" (mono 11px uppercase cobalt).
- **Right pane** — pages of the hovered/focused section: header row (mono 10px uppercase section name + count, 1px ink underline), then page links (Archivo 500 13.5px, 9px 2px padding, `#f0f0f2` dividers, mono arrow), "Section hub →" pinned to bottom.
- Switching: `mouseenter` on desktop, click/tap on touch. All 9 sections' page lists are **in the server-rendered DOM**; only visibility toggles (CSS + `aria-expanded`).
- **Maintenance rule:** level 3 is generated from the section taxonomy via a custom `Walker_Nav_Menu` or `wp_nav_menu` filter — never hand-maintained. Publishing an index page auto-appears in the panel.

### Desktop — Reports dropdown: two-pane, same as Indexes
Identical structure and styling to the Indexes panel, width `min(680px, 100vw - 80px)`, grid `minmax(220px,280px) 1fr`.
- **Left rail** — the 3 collections: mono cobalt number 01–03, Archivo 700 14px name, mono arrow; 13px 18px padding, `#f0f0f2` dividers. Footer row on `#f5f5f7`: "All Reports →".
- **Right pane** — that collection's reports: header (mono 10px uppercase collection name + "N reports"), report links (Archivo 500 13.5px), "Collection hub →" pinned bottom.
- **No Collection/News eyebrow tags** — removed by request; the left rail already names the collection. Menu-item Description fields are not used here.
- Report titles in the prototype are **placeholders** — pull real titles from the Reports CPT.

### Mobile (≤768px) — see the Mobile toggle in `Report AI Homepage.dc.html`
No hover anywhere. GeneratePress off-canvas menu with **Dropdown behaviour: "Click – arrow"** (arrow toggles, label navigates). Indexes accordion shows the 9 sections; each section row expands to its pages (same auto-generated level 3). Tap targets ≥44px. Utility links at the drawer footer.

**Prototype-accurate drawer spec (390px frame):**
- Header 14px/16px padding, hairline bottom border; wordmark Archivo 900 17px; hamburger 44×44px, 1px `#e6e6ea` border, three 18×1.5px ink bars, 4px gap.
- Drawer is a full-cover panel (`position:absolute; inset:0`, white, above page) with the same header row and a 44×44px `×` close button.
- Top-level rows: Archivo 700 17px, 16px padding, min-height 44px, `#e6e6ea` bottom border, mono 13px ▲/▼ chevron right-aligned. Indexes defaults **open**, Reports **closed**; Glossary/About are flat links.
- Section rows (level 2): grid `28px 1fr auto`, 11px 2px padding, min-height 44px, `#f0f0f2` divider — mono 11px cobalt number · Archivo 600 15px name · mono 12px chevron. Each toggles independently (multiple can be open).
- Page rows (level 3): indented 38px, 10px padding, min-height 40px, `#f5f5f7` divider, Archivo 500 13.5px ink; each section's list ends with a mono 10px cobalt "Section hub →".
- "Compare Tool →" pinned below the 9 sections (mono 11px uppercase cobalt, min-height 44px).
- Reports rows (level 2): grid `28px 1fr auto`, mono 11px cobalt number · Archivo 600 15px collection name · mono 12px chevron, min-height 44px; expands to that collection's report list (indented 38px, min-height 40px) ending in "Collection hub →". No tag eyebrows.
- Drawer footer: 16px padding, 1px top border, mono 11px uppercase Subscribe · Contact · Log in (Log in ink, others `#77777f`).

### Reference CSS starting point
See `Nav Handoff (Option B).dc.html` for the earlier annotated spec; adapt selectors to `.main-navigation .sub-menu`, add classes `nav-tool`, `menu-reports` via the Menus screen (enable CSS Classes in Screen Options).

## 2. Homepage (`Report AI Homepage.dc.html` — the source of truth)

Layout: header (utility strip + primary nav) → **two-column zone** `grid: minmax(0,1fr) 340px` (main content | right sidebar) → **full-width bands** → footer.

### 2.1 Hero — Figure of the week (left zone, grid `minmax(0,1.1fr) minmax(0,1fr)`, bottom border 1px ink)
- Left: eyebrow row ("FIGURE OF THE WEEK" mono 11px cobalt + week stamp mono `#b8b8bf`); stat Archivo 900 120px, line-height 0.9, tracking −0.05em, unit in cobalt; statement Archivo 22px/1.4 max 26ch; meta row: confidence badge (mono 11px uppercase, 1px ink border, 5px 10px, square) + source line (mono 12px `#77777f`) + "Full figure →".
- Right (surface bg): **YoY comparison bar chart** — pure CSS flex bars, 280px tall, gap 12px, baseline 1px ink rule; past years `#d8d8de`, current cobalt; mono value labels above, year labels below. **Data is dynamic** — featured figure + series from CMS meta (ACF/block), updates weekly without deploys.
- Both hero columns need `min-width:0` (or `minmax(0,…)` tracks) so the chart never overflows under the sidebar.

### 2.2 Right sidebar (340px, left hairline border — REQUIRED, spans hero + ticker rows)
Top to bottom:
1. **Search** — bordered input row (mono placeholder "Search figures, indexes, reports…"). Wire to WP search.
2. **Newsletter** — surface bg block: cobalt mono eyebrow "THE WEEKLY FIGURE — NEWSLETTER", 14px pitch copy, email field + full-width cobalt Subscribe button (hover: ink bg).
3. **Latest report** — eyebrow, collection tag + date (mono 10px), Archivo 700 17px title, "All reports →". Auto-populated (latest from Reports CPT).
4. **Latest news** — eyebrow + 3 dated items (mono 10px date, Archivo 600 14px title, `#f0f0f2` dividers). Auto-populated.

### 2.3 Figures ticker (left zone, under hero, beside sidebar)
"RECENTLY UPDATED FIGURES" eyebrow; 4 stat cards in `repeat(4, minmax(0,1fr))`: Archivo 800 26px value, 13px text, mono 10px source·date·rating meta. Hover bg surface. Auto-populated from most recently updated figures.

### 2.4 Model Watch (full-width band, top border 1px ink)
Header: cobalt eyebrow "MODEL WATCH" + H2 Archivo 800 30px "Assistants, countries, ratings — one view." + "Technical Performance →" link. Three equal panels inside one 1px hairline frame:
1. **Leading AI assistants — weekly active users**: 5 rows, name (Archivo 600 13px) + WAU value (mono 12px), 8px bar on `#f0f0f2` track, cobalt fill proportional to leader; source line below.
2. **Which AI model leads in each country**: rows `1fr auto auto` — country (Archivo 600 13px) · model (mono 11px cobalt) · share (mono 11px gray); "All 40 countries →" footer link.
3. **AI models, rated**: ranked ledger — mono cobalt rank 01–05, name, mono score; "Full ratings →".
All values in the prototype are placeholders; feed from CMS.

### 2.5 Index Library (full-width band, top border 1px ink)
Cobalt eyebrow "THE INDEX LIBRARY" + H2 "Nine sections. Every figure sourced, dated, rated." + "All indexes →". 3×3 grid of ledger cells (`36px 1fr auto`): mono cobalt number, Archivo 700 16px section name, mono 10px index count (from term counts, auto). Hairline borders, hover surface bg.

### 2.6 Compare + Methodology (full-width split band, top border 1px ink)
- Left: "COMPARE TOOL" eyebrow, H2 26px, pitch copy, 2 labelled comparison bars (10px, `#e6e6ea` track, cobalt fill, mono source·rating line), cobalt "Open Compare →" button (hover ink).
- Right (surface bg): "METHODOLOGY" eyebrow, H2 "How we rate confidence", 3 ledger rows `110px 1fr`: badge (HIGH ink-filled / MEDIUM ink-outline / DERIVED cobalt-outline, mono 11px uppercase) + description; "Read the full methodology →".

### 2.7 Footer
Ink top border; "REPORT AI" Archivo 900 16px left; mono 11px uppercase links right: Glossary · About · Republishing · Terms.

## 3. Mobile homepage (≤768px) — `Report AI Homepage.dc.html`, Mobile toggle
Single column, no sidebar. Order top to bottom:
1. **Header** — wordmark + hamburger (spec above).
2. **Hero** — 36px/20px padding, ink bottom border. Stat Archivo 900 **72px** (vs 120px desktop); statement 17px/1.45; mono 10px eyebrow + week stamp; confidence badge + source line wrap. The chart moves **below** the statement on `#f5f5f7`, 20px/16px padding, bars 140px tall, 10px gap, mono 11px values / 10px year labels.
3. **Figures ticker** — 2×2 grid, 16px gap; value Archivo 800 22px, text 12px, meta mono 9px.
4. **Model Watch** — H2 22px; the three desktop panels stack vertically in one column, each keeping its mono 10px uppercase label. Country and rated-model rows get `min-height:44px`.
5. **Index Library** — 9 rows as a single-column ledger, grid `32px 1fr auto`, 12px padding, min-height 44px.
6. **Compare tool** — H2 22px, same two labelled bars, full-width cobalt button (14px vertical padding).
7. **Methodology** — `#f5f5f7`, H2 22px; the desktop `110px 1fr` badge/description grid becomes a **vertical stack** (badge above text) so descriptions get full width.
8. **Newsletter** — `#f5f5f7`, email field 12px padding, full-width cobalt Subscribe (13px vertical padding).
9. **Footer** — wordmark stacked above wrapping mono 11px links, 18px gap.

Dropped on mobile: the desktop utility strip (moves into the drawer footer), the sidebar search, and the Latest report / Latest news blocks. **Decision needed** — if the client wants those on mobile, add them as bands after the newsletter; otherwise wire search to the drawer or a header icon.

## Interactions & Behavior

### Desktop dropdowns open on HOVER
- `mouseenter` on **Indexes** / **Reports** opens that panel; click also toggles it (keyboard and touch fallback). Only one panel open at a time.
- **Closing uses a 180ms grace timer**, cancelled by `mouseenter` on the menu item, the menu row, or the panel itself. An instant close on `mouseleave` makes the panel unreachable — do not implement it that way.
- Each menu item carries an invisible **hover bridge** (`padding-bottom:20px; margin-bottom:-20px`) so the pointer never crosses dead space between the label and the panel.
- `mouseenter` on Glossary/About closes any open panel.
- Still set `aria-expanded`; Escape closes; keyboard Tab reaches every link with visible focus; on touch, hover is ignored and click toggles.

### Hover states (all in CSS, not JS)
- Index/Reports left-rail rows → cobalt tint + cobalt text + inset marker (above).
- Right-pane page/report rows → `background:#eef1fd; color:#2545f5`.
- Figures ticker cards → `background:#f5f5f7`.
- Cobalt buttons (Subscribe, Open Compare) → `background:#111114; color:#fff`.
- Plain links darken to ink `#111114`.
- No animation on desktop dropdown open/close; mobile drawer/accordion ~220ms ease.

### State model (prototype — mirror this in WP/JS)
- `panel`: `null | 'indexes' | 'reports'` — one desktop dropdown open at a time.
- `activeSection`: `0–8` — which section the desktop right pane shows; set on `mouseenter` (desktop) / click (touch); defaults to 0.
- `activeReport`: `0–2` — same for the Reports panel's right pane; defaults to 0.
- Close timer handle — one `setTimeout` per component, cleared on re-enter and on unmount.
- `drawerOpen`: boolean — mobile off-canvas.
- `mIndexes` / `mReports`: booleans — top-level accordions; Indexes defaults **true**.
- `mSections`: map of section index → boolean — Indexes level-3 accordions, independently toggleable.
- `mReportGroups`: map of collection index → boolean — Reports level-3 accordions, same behavior.
- `view`: prototype-only Desktop/Mobile switch. **Do not port** — production uses real media queries plus the GeneratePress off-canvas menu.

## LLM / crawler accessibility (hard requirement)
- All nav links — including all level-3 index pages inside the library panel — present in server-rendered HTML at all times; hide via CSS (`visibility`/`opacity`/`display` toggled by class), never lazy-load or inject on click.
- Verify with JS disabled: view-source must contain every `<a href>`.
- Semantic markup: `<nav aria-label="Primary">`, nested `<ul>`, real headings on homepage bands.

## Known flags
- Reports level 3 needs the same auto-generation treatment as Indexes (walker over the Reports collection taxonomy) — do not hand-maintain report titles in the menu.
- Two-pane library panel needs a custom walker + ~40 lines child-theme CSS/JS (pane switching); markup remains one nested `<ul>` (level 3 = the right pane lists).
- Reports eyebrows: menu Description field + small PHP filter.
- Verify panel fit at 769–1100px (`min(760px, 100vw - 80px)` cap).
- Mobile homepage: exact stacking is specified in section 3 below and demonstrated in the prototype's Mobile view.
- Mobile drops the sidebar search and the Latest report / Latest news blocks — confirm with the client before shipping (see section 3).

## Acceptance checklist
- [ ] Publish a new index page → appears in nav panel + hub with zero menu edits.
- [ ] JS disabled: every level-2 and level-3 link in view-source.
- [ ] iPhone: arrow-tap toggles, label-tap navigates; no dead first tap; targets ≥44px.
- [ ] Mobile: hero stat legible without zoom; chart bars don't overflow at 320px width.
- [ ] Mobile: Model Watch stacks vertically, ticker is 2×2, methodology badges stack above their text.
- [ ] Client sign-off on dropping search / latest report / latest news from mobile.
- [ ] Desktop: pointer can travel from menu label into the panel without it closing; panel closes ~180ms after leaving both.
- [ ] Menu stays optically centered with the logo left at 1024–1600px.
- [ ] Reports panel shows collection → reports, no Collection/News tags anywhere.
- [ ] Every hover state above is present (rails, page rows, ticker, buttons).
- [ ] Escape/`aria-expanded` behavior correct; keyboard complete.
- [ ] Hero figure + chart, ticker, Model Watch, latest report/news update from CMS without deploys.
- [ ] Subscribe only in utility strip + sidebar newsletter block — never primary menu.
- [ ] No overlap of hero chart and sidebar at 900–1280px.

## Files in this bundle
- `Report AI Homepage.dc.html` — **primary reference**: desktop homepage (two-pane library nav, ledger Reports dropdown, hero, sidebar, ticker, Model Watch, library band, Compare+Methodology, footer) **and** the complete mobile homepage + nav drawer behind the Mobile toggle.
- `Report AI Nav.dc.html` — earlier nav exploration (Options A/B, desktop + mobile states) — useful for mobile drawer behavior.
- `Nav Directions v2.dc.html` — direction studies (1a strip / 1b takeover / 1c ledger — 1c chosen).
- `Nav Handoff (Option B).dc.html` — earlier WP spec document; superseded where it conflicts with this README.
- `support.js` — prototype runtime. Required to open the `.dc.html` files locally; **never ship it.**
