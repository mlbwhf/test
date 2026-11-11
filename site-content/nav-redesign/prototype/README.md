# Handoff: Report AI Global Navigation (Option B "Jump Palette") + Homepage Hero

## Overview
Redesign of the global navigation for **report-ai.org** (WordPress + GeneratePress), plus a new homepage hero ("Figure of the week" with a YoY comparison chart). Goals, in priority order: credibility on first impression (research-institution signal), findability of the 9 index sections and Reports library, low maintenance (nav never needs editing when a page publishes), and full mobile/touch support. Must also stay **LLM/crawler accessible**: every link server-rendered at all times.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these designs inside the existing WordPress + GeneratePress theme** using its established mechanisms (`wp_nav_menu()`, Customizer settings, Additional CSS, child-theme PHP filters where needed). Do not ship the prototype HTML/JS.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and interaction states are final. Recreate pixel-perfectly within GeneratePress's markup.

## Target platform constraints (hard requirements)
1. **WordPress menu**: the entire nav must render from a standard nested `<ul>` produced by `wp_nav_menu()`. No JS frameworks.
2. **LLM/crawler accessible**: all second-level links present in server-rendered HTML at all times. Sub-menus hide via CSS (`visibility`/`opacity`) + `aria-expanded` — never lazy-loaded, never removed from the DOM. Verify with JS disabled: every `<a href>` must appear in view-source.
3. **Mobile/touch**: no hover-only dropdowns anywhere. GeneratePress Customizer → Layout → Primary Navigation → **Dropdown behaviour: "Click – arrow"** (arrow toggles the palette, label navigates to the hub page). Mobile breakpoint 768px uses GP's off-canvas menu (same list as accordions). All tap targets ≥ 44px.
4. **Low maintenance**: second level = section hub pages and report collections ONLY. Individual index pages / news reports never become menu items; they live on hub-page card grids. Section numbering (01–09) is rendered with CSS counters, never typed into menu labels.

## Information architecture (Appearance → Menus)
Primary menu (4 top-level items):
```
Indexes                → /indexes/            (Index Library hub)
  Enterprise AI Adoption      → /indexes/enterprise-adoption/
  AI Business & Economics     → /indexes/business-economics/
  Technical Performance       → /indexes/technical-performance/
  Workforce & Labor           → /indexes/workforce-labor/
  The Dark Side of AI         → /indexes/dark-side/
  State of AI                 → /indexes/state-of-ai/
  Regulating AI               → /indexes/regulating-ai/
  The Geography of AI         → /indexes/geography/
  AI by Industry              → /indexes/by-industry/
  Compare Tool                → /compare/        (menu class: nav-tool)
  View full Index Library     → /indexes/        (menu class: nav-all)
Reports                → /reports/
  The Dark Side of AI (Collection) → /reports/dark-side/
  Real-World AI (Collection)       → /reports/real-world-ai/
  Latest Reports (News)            → /reports/latest/
Glossary               → /glossary/
About                  → /about/
```
Secondary/utility menu (thin strip above the primary bar, right-aligned):
```
Subscribe → /subscribe/    Contact → /contact/    Log in → /wp-login.php (or member area)
```
Slugs are illustrative — keep existing URLs. **Never** place Subscribe or any conversion CTA in the primary menu (explicit non-goal: wrong signal for an independent measurement institution).

## Design tokens
- Accent cobalt `#2545f5` · Ink `#111114` · Surface `#f5f5f7` · Hairline `#e6e6ea`
- Dark-panel internals: row divider `#26262a`, top divider `#333336`, muted arrow `#55555c`, muted text `#77777f` / `#9a9aa2`, faint `#b8b8bf`, body gray `#44444a`, inactive bar `#d8d8de`
- Fonts: **Archivo** (headings/UI, 400–900), **IBM Plex Mono** (labels, meta, eyebrows). Google Fonts.
- Radius: 0 everywhere (2–3px max where unavoidable). No shadows, no gradients.
- Mono eyebrow style: 10–12px, uppercase, letter-spacing 0.04–0.08em.
- Heading letter-spacing: -0.02em to -0.05em (tighter as size grows).

## Screens / Views

### 1. Desktop nav bar (`Report AI Nav.dc.html`, Option B)
- Utility strip: right-aligned row, `padding: 8px 32px`, bottom hairline; IBM Plex Mono 11px uppercase; Subscribe/Contact `#77777f`, Log in `#111114` (last).
- Primary bar: `padding: 20px 32px`; logo "REPORT AI" Archivo 900 20px, letter-spacing -0.02em; items Archivo 600 14px, letter-spacing -0.01em, `padding: 10px 14px`; open item turns cobalt with ▲.
- **Indexes flyout ("jump palette")**: anchored below the item, right-aligned (`right: 0`), width 360px, background `#111114`, `margin-top: 8px`, z-index above content.
  - Optional decorative header row: "⌕ Jump to a section…" mono 12px `#77777f`, bottom border `#333336`. (A live filter needs JS — drop it or link the row to /indexes/ in phase 1.)
  - 9 rows: `padding: 11px 16px`, bottom border `#26262a`; leading number 01–09 (CSS counter, IBM Plex Mono 11px cobalt), name Archivo 500 14px white, trailing "→" mono 12px `#55555c`. Hover: row background `#1a1a1f`, arrow turns cobalt.
  - Compare Tool row: mono 11px uppercase `#77777f`, cobalt arrow, no number.
  - Footer row: "View full Index Library →" mono 11px uppercase cobalt, top border `#333336`.
- **Reports flyout**: same style, width 300px. 3 rows with a 10px uppercase mono eyebrow (`Collection` / `Collection` / `News`, `#77777f`) above the name (Archivo 500 14px white). Eyebrows come from the WP menu-item **Description** field rendered via a GP filter (`.menu-item-description`). Footer: "All Reports →".

### 2. Mobile nav (Option B bottom sheet — phase 2; ship GP off-canvas first)
- Header: logo + 44×44px hamburger button (1px hairline border, three 18×1.5px ink bars).
- Phase 1 (ship first): GeneratePress standard off-canvas overlay — same nested list as accordions. Fully acceptable.
- Phase 2 (prototype behavior): tapping hamburger opens a **bottom sheet** at 72% viewport height over a `rgba(17,17,20,0.4)` scrim (tap scrim to close). Sheet background `#111114`, top radius 3px, drag-handle bar 36×3px `#444`.
  - Tab row: Indexes / Reports / More — mono 12px uppercase, active tab cobalt with 2px cobalt bottom border, inactive `#77777f`, bottom border `#26262a`.
  - Indexes tab: 9 numbered rows (`padding: 14px 20px`, min-height 44px, divider `#26262a`) + "View full Index Library →". Reports tab: 3 rows with eyebrow + name. More tab: Glossary, About (Archivo 600 15px white), then Subscribe, Contact (mono 11px uppercase `#77777f`), then Log in (mono 11px uppercase white).
  - Slide-up transition ~220ms ease.

### 3. Homepage hero (`Report AI Homepage.dc.html`)
Two-column grid (`1.15fr 1fr`), bottom border 1px `#111114`. Everything **below** the hero is the existing homepage, unchanged.
- **Left column** (white, `padding: 64px 48px 56px 40px`, right hairline):
  - Eyebrow row: "FIGURE OF THE WEEK" mono 11px uppercase cobalt + "W34 · 2026" mono 11px `#b8b8bf`.
  - Stat: Archivo 900 120px, line-height 0.9, letter-spacing -0.05em, ink; unit ("%") in cobalt.
  - Statement: Archivo 22px, line-height 1.4, max-width 26ch.
  - Meta row: confidence badge (`HIGH confidence`, mono 11px uppercase, 1px ink border, `padding: 5px 10px`, square) + source line (mono 12px `#77777f`, "Source: … · date") + "Full figure →" mono link.
- **Right column** (surface `#f5f5f7`, `padding: 64px 40px 56px 48px`): YoY comparison bar chart.
  - Title: mono 11px uppercase `#77777f`.
  - 4 bars (2023–2026) in a 280px-tall flex row, `gap: 40px`, baseline = 1px ink rule; bar max-width 72px; heights proportional to value (32/44/55/78 → % of max); past years `#d8d8de`, current year cobalt; value labels mono 13px ink above bars, year labels mono 11px `#77777f`` below the rule.
  - **Data is dynamic**: pull the featured figure + series from the CMS (e.g. an ACF/meta-driven block or shortcode); this should update weekly without a deploy. Chart can be pure CSS (flex heights) — no chart library needed.
- Page container: max-width 1280px, centered, 1px hairline left/right borders, white.

## Interactions & Behavior
- Desktop dropdown: click arrow → toggle palette (`aria-expanded` true/false); click label → navigate to hub. Escape closes. One palette open at a time.
- Keyboard: Tab reaches every item; focus visible; Escape closes open palette.
- Hover: palette rows `#1a1a1f` bg + cobalt arrow; links darken to ink; CTA buttons invert to ink bg / white text.
- No animations on desktop dropdowns (instant open is fine); mobile sheet slides up ~220ms ease.

## State Management
None beyond menu open/closed state (GP handles `aria-expanded` toggling). Hero figure/chart data comes from post meta / options — no client state.

## Reference CSS (desktop palette, Customizer → Additional CSS)
```css
.main-navigation .sub-menu {
  width: 360px; background: #111114; border: 1px solid #111114;
  box-shadow: none; right: 0; left: auto; margin-top: 8px; counter-reset: idx;
}
.main-navigation .sub-menu li { border-bottom: 1px solid #26262a; counter-increment: idx; }
.main-navigation .sub-menu a {
  display: flex; align-items: center; gap: 12px; padding: 11px 16px;
  font-family: Archivo, sans-serif; font-weight: 500; font-size: 14px;
  color: #fff; letter-spacing: -0.01em;
}
.main-navigation .sub-menu a::before {
  content: counter(idx, decimal-leading-zero);
  font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #2545f5;
}
.main-navigation .sub-menu a::after {
  content: "→"; margin-left: auto;
  font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #55555c;
}
.main-navigation .sub-menu a:hover { background: #1a1a1f; color: #fff; }
.main-navigation .sub-menu a:hover::after { color: #2545f5; }
.main-navigation .sub-menu .nav-tool a::before,
.main-navigation .sub-menu .nav-all a::before { content: none; }
.main-navigation .sub-menu .nav-tool a,
.main-navigation .sub-menu .nav-all a {
  font-family: 'IBM Plex Mono', monospace; font-size: 11px;
  text-transform: uppercase; letter-spacing: 0.04em; color: #2545f5;
}
.main-navigation .sub-menu .nav-all { border-top: 1px solid #333336; }
.menu-reports .sub-menu { width: 300px; }
```
Enable "CSS Classes" in the Menus screen (Screen Options) to add `nav-tool`, `nav-all`, `menu-reports`.

## Known flags / can't-do-in-plain-WP
- Bottom sheet + tab chrome: ~30 lines of custom CSS/JS in a child theme on top of the same markup. Phase 2.
- "Jump to a section…" live filter: requires JS. Phase 2 or drop.
- Reports eyebrows: WP menu Description field + small PHP filter to output `.menu-item-description` inside the link.
- Right-anchored flyouts: verify no overflow at 769–1100px viewport widths.

## Acceptance checklist
- [ ] All 9 sections + Compare in the Indexes palette; numbering via CSS counters.
- [ ] iPhone: one tap on the Indexes arrow opens the palette; tap on the label navigates. No dead first tap.
- [ ] View-source with JS disabled: every second-level `<a href>` present.
- [ ] Keyboard: Tab order complete, Escape closes, `aria-expanded` toggles.
- [ ] Publish a test index page → nav requires no edit.
- [ ] Subscribe/Contact/Log in only in the utility strip, never in the primary menu.
- [ ] Hero figure updates from CMS data without touching templates.

## Files in this bundle
- `Report AI Nav.dc.html` — nav prototype. Option A/B toggle top-right (**Option B "Jump Palette" is the chosen direction**); Desktop/Mobile toggle; IA rationale + flags annotated below the prototype.
- `Nav Handoff (Option B).dc.html` — the WordPress implementation spec as a formatted document (same content as this README, §§1–6).
- `Report AI Homepage.dc.html` — homepage hero prototype with working Option B nav.
- `support.js` — prototype runtime only; ignore for implementation.

Open the `.dc.html` files in a browser to interact with them.
