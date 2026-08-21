# Handoff: Report AI — Global Nav + Homepage (WordPress / GeneratePress)

## Overview
Redesign of **report-ai.org**: global navigation (ledger-style dropdowns with a two-pane Index Library browser) and the homepage (Figure-of-the-week hero, right sidebar, figures ticker, Model Watch, Index Library band, Compare + Methodology band). Goals in priority order: credibility (measurement-institution signal), findability of the 9 index sections + Reports, low maintenance (nav never edited when a page publishes), mobile/touch support, **LLM/crawler accessibility** (every link server-rendered at all times).

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

- Indexes → 9 section hubs + Compare Tool (level 2), each section's index pages (level 3, auto-generated — see below).
- Reports → The Dark Side of AI (Collection) · Real-World AI (Collection) · Latest Reports (News) + "All Reports →" footer.
- Glossary, About → flat links, no dropdown.
- Numbers 01–09 are **CSS counters**, never typed into labels (reorder = auto renumber).

### Desktop — Indexes dropdown: two-pane Library browser
Anchored to the **header row** (`position:relative` on the primary-nav row; panel `position:absolute; top:100%; right:40px`), never to the menu item — prevents viewport clipping. Width `min(760px, 100vw - 80px)`, white, 1px ink border, grid `minmax(220px,300px) 1fr`.
- **Left rail** — the 9 sections: grid row `28px 1fr auto`, padding 11px 18px, hairline dividers; mono cobalt number, Archivo 700 14px name, mono arrow (cobalt when active, `#d8d8de` idle). Active/hovered row bg `#f5f5f7`. Footer row on `#f5f5f7`: "Compare Tool →" (mono 11px uppercase cobalt).
- **Right pane** — pages of the hovered/focused section: header row (mono 10px uppercase section name + count, 1px ink underline), then page links (Archivo 500 13.5px, 9px 2px padding, `#f0f0f2` dividers, mono arrow), "Section hub →" pinned to bottom.
- Switching: `mouseenter` on desktop, click/tap on touch. All 9 sections' page lists are **in the server-rendered DOM**; only visibility toggles (CSS + `aria-expanded`).
- **Maintenance rule:** level 3 is generated from the section taxonomy via a custom `Walker_Nav_Menu` or `wp_nav_menu` filter — never hand-maintained. Publishing an index page auto-appears in the panel.

### Desktop — Reports dropdown
Same anchoring, width 320px. Rows: mono 10px uppercase eyebrow (Collection/News, `#77777f`, via menu-item Description field) above Archivo 700 15px name, arrow right. Footer "All Reports →" on `#f5f5f7`.

### Mobile (≤768px)
No hover anywhere. GeneratePress off-canvas menu with **Dropdown behaviour: "Click – arrow"** (arrow toggles, label navigates). Indexes accordion shows the 9 sections; each section row expands to its pages (same auto-generated level 3). Tap targets ≥44px. Utility links at the drawer footer.

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

## Interactions & Behavior
- Dropdown toggles set `aria-expanded`; Escape closes; one panel open at a time; keyboard Tab reaches every link, visible focus.
- Hovers: rows → `#f5f5f7`; cobalt buttons → ink bg/white; links darken to ink.
- No animation on desktop dropdowns; mobile drawer/accordion ~220ms ease.

## LLM / crawler accessibility (hard requirement)
- All nav links — including all level-3 index pages inside the library panel — present in server-rendered HTML at all times; hide via CSS (`visibility`/`opacity`/`display` toggled by class), never lazy-load or inject on click.
- Verify with JS disabled: view-source must contain every `<a href>`.
- Semantic markup: `<nav aria-label="Primary">`, nested `<ul>`, real headings on homepage bands.

## Known flags
- Two-pane library panel needs a custom walker + ~40 lines child-theme CSS/JS (pane switching); markup remains one nested `<ul>` (level 3 = the right pane lists).
- Reports eyebrows: menu Description field + small PHP filter.
- Verify panel fit at 769–1100px (`min(760px, 100vw - 80px)` cap).
- Mobile homepage: sidebar stacks below the ticker; Model Watch panels stack vertically; ticker becomes 2×2.

## Acceptance checklist
- [ ] Publish a new index page → appears in nav panel + hub with zero menu edits.
- [ ] JS disabled: every level-2 and level-3 link in view-source.
- [ ] iPhone: arrow-tap toggles, label-tap navigates; no dead first tap; targets ≥44px.
- [ ] Escape/`aria-expanded` behavior correct; keyboard complete.
- [ ] Hero figure + chart, ticker, Model Watch, latest report/news update from CMS without deploys.
- [ ] Subscribe only in utility strip + sidebar newsletter block — never primary menu.
- [ ] No overlap of hero chart and sidebar at 900–1280px.

## Files in this bundle
- `Report AI Homepage.dc.html` — **primary reference**: final homepage with working nav (two-pane library, ledger Reports dropdown), hero, sidebar, ticker, Model Watch, library band, Compare+Methodology, footer.
- `Report AI Nav.dc.html` — earlier nav exploration (Options A/B, desktop + mobile states) — useful for mobile drawer behavior.
- `Nav Directions v2.dc.html` — direction studies (1a strip / 1b takeover / 1c ledger — 1c chosen).
- `Nav Handoff (Option B).dc.html` — earlier WP spec document; superseded where it conflicts with this README.
- `support.js` — prototype runtime only; ignore.
