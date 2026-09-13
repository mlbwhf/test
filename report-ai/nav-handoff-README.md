# Handoff: report-ai.org Navigation (mobile-first)

## Overview
Complete navigation system for **report-ai.org (The AI Index)** — a WordPress AI-statistics library. Two parts of one system:

1. **Mobile navigation** (< 900px) — a full-screen index drawer: search first, the four indexes with live report counts, flat links, subscribe pinned.
2. **Desktop global nav** (>= 900px) — three approved options (1a index bar, 1b utility strip + mega panel, 1c numbered left rail). **Build 1a first**; it is the smallest, fastest, and shares 100% of its data with the mobile drawer. 1b/1c are documented as upgrade paths.

Design goal: the navigation itself should communicate that the site is an indexed reference library — visible structure, visible counts, visible last-updated date — rather than hiding categories behind a generic hamburger.

## About the Design Files
The `.dc.html` files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, **not production code to paste in**. The task is to **recreate them in this site's existing environment: WordPress, GeneratePress child theme.**

That means:
- Markup lives in the child theme (`header.php` override or `generate_header` hooks + template parts), not in a page's Custom HTML block.
- Links come from a registered **WP nav menu** so editors can reorder them without a developer.
- Index rows (titles, descriptions, counts) come from **real category terms** via `get_terms`, so counts never go stale.
- CSS/JS are **enqueued** in the child theme, versioned by `filemtime`.

`reference/nav-reference.html` in this bundle is a **standalone, working HTML/CSS/JS implementation** of the mobile drawer + 1a bar with no framework. Use it as the source of truth for exact markup, class names, CSS and behavior, then port it into PHP templates. It is deliberately dependency-free and accessible; if you keep its class names, the CSS in `reference/nav.css` drops in unchanged.

If a future implementer is in a different environment (React/Vue/etc.), recreate the same design with that framework's own patterns.

## Fidelity
**High-fidelity.** All colors, type, spacing, timings below are final and exact. Recreate pixel-accurately.

---

## Breakpoints
| Range | Navigation |
|---|---|
| `< 1180px` | Mobile/tablet: 60px sticky header + full-screen drawer. Desktop bar hidden. |
| `>= 1180px` | Desktop: 1a index bar (or 1b / 1c). Menu button hidden. |

Single breakpoint at **1180px** — the width 1a was designed at. This is a geometry constraint, not a preference: the brand cell (203px) and the utility cell (308px) are fixed-width, so the four index tabs absorb every pixel of shortfall. At 1180px each title gets **131px**; below that the labels ellipsize and the bar stops doing its one job. The drawer serves the whole 0–1180px band, tablets included. Use `min-width` media queries (mobile-first: the drawer CSS is the base, the desktop bar is the override).

---

## Screen 1 — Mobile header (always visible, < 900px)
**Layout:** `position: sticky; top: 0; z-index: 60`, full width, **height 60px**, `background #ffffff`, `border-bottom: 1px solid #e6e6ea`, `display:flex; align-items:center; justify-content:space-between; padding: 0 18px`. Stays fixed and visible when the drawer opens (the drawer starts at `top: 60px`).

**Components**
- **Monogram (rising bars).** `display:flex; align-items:flex-end; gap:3px; height:20px`. Three bars, `width:5px` each; heights `9px / 14px / 20px`; fills `#2545f5 / #2545f5 / #111114`. Pure geometry — inline SVG or three spans. No image asset.
- **Wordmark.** `THE AI INDEX` — Archivo **900**, `16px`, `letter-spacing:-0.02em`, `#111114`, 9px gap from monogram. Monogram + wordmark are one link to `/`.
- **Menu button.** Exactly **44 x 44px** tap target; contents right-aligned; `display:flex; flex-direction:column; justify-content:center; align-items:flex-end; gap:5px`. Two bars `height:2px; background:#111114` — top `width:22px`, bottom `width:15px` (intentionally uneven: reads as a data mark). `<button aria-label="Open menu" aria-expanded="false" aria-controls="ai-drawer">`.
- **Open state.** Both bars `width:22px; background:#2545f5`, crossed: top `translateY(3.5px) rotate(45deg)`, bottom `translateY(-3.5px) rotate(-45deg)`; `transition: all .2s ease`. `aria-label` becomes "Close menu", `aria-expanded="true"`.

## Screen 2 — Mobile drawer (open)
**Layout:** `position: fixed; left:0; right:0; top:60px; bottom:0; background:#ffffff; z-index:50; display:flex; flex-direction:column`. Three regions: search (fixed), nav list (`flex:1; overflow-y:auto; overscroll-behavior: contain`), subscribe bar (fixed).

**Components**
- **Search field.** Wrapper padding `22px 18px 12px`. Field `border: 1.5px solid #111114` (square, radius 0), `padding: 12px 14px`, `display:flex; align-items:center; gap:10px`. Glyph `⌕` IBM Plex Mono 13px `#9a9aa2`. Input font-size **16px** (prevents iOS zoom-on-focus) rendered at a visual 14.5px is not possible — use 16px and accept it, or set `font-size:16px` and keep the placeholder short. Placeholder: `Search 240 statistics…` where **240 is dynamic** (total published statistics/reports count).
- **Top-level rows.** Horizontal padding `0 18px`. Each row: `display:flex; justify-content:space-between; align-items:center; padding:20px 0; border-top:1px solid #e6e6ea; min-height:44px`. Label Archivo **900, 27px, letter-spacing:-0.03em, #111114**. Right meta IBM Plex Mono **12px `#9a9aa2`**. Last row also `border-bottom: 1px solid #e6e6ea`.
  | Row | Meta | Behavior |
  |---|---|---|
  | Indexes | `4` + toggle glyph `+` / `–` (17px, `#2545f5`, 10px gap) | `<button>`, expands accordion |
  | Reports | `33` (real post count) | link to `/reports` |
  | Glossary | `A–Z` | link to `/glossary` |
  | About | `Method` | link to `/about` |
- **Indexes accordion.** `overflow:hidden; transition: max-height .2s ease`; collapsed `max-height:0`; expanded `max-height` = measured `scrollHeight` (prototype uses 340px). Each child row: `display:flex; justify-content:space-between; gap:14px; padding:13px 0; border-top:1px solid #f0f0f3`. Title **14.5px / 700 / #111114**; description **11.5px / #8a8a92 / margin-top:2px**; count IBM Plex Mono **11px / #9a9aa2 / flex:0 0 auto**.
  | Title | Description | Count |
  |---|---|---|
  | Enterprise AI Adoption | Adoption, gen AI, agentic workflows | 12 |
  | AI Business & Economics | Investment, spend, forecasts, LLM market | 9 |
  | Technical Performance | Benchmarks, compute, infrastructure, safety | 7 |
  | Workforce & Labor | Jobs created & displaced, skills premium | 5 |

  All four rows render from category terms — `name`, `description`, `count`. Never hardcode.
- **Footer note.** IBM Plex Mono `10.5px`, `letter-spacing:0.1em`, uppercase, `#9a9aa2`, `line-height:1.7`, `padding:18px 0 22px`. Line 1 `Index updated June 2026` (render real last-modified month), line 2 `Every figure sourced & dated`.
- **Subscribe bar.** `flex:0 0 auto; padding:14px 18px 20px; border-top:1px solid #e6e6ea; background:#fff`; use `padding-bottom: max(20px, env(safe-area-inset-bottom))`. Button full width, `background:#2545f5; color:#fff`, centered, Archivo **700 / 15px**, `padding:15px`, `border-radius:2px`, label `Subscribe to the monthly index`.

## Screen 3 — Desktop 1a: index bar (>= 900px)
One row, full width, `background:#fff`, `border-bottom:1px solid #e6e6ea`.
- **Brand cell.** `padding: 0 26px; border-right:1px solid #e6e6ea; display:flex; align-items:center; gap:11px`. Monogram bars `width:5px`, heights `10/15/22px`, colors `#2545f5 / #2545f5 / #111114`. Wordmark Archivo 900 **17px** `letter-spacing:-0.025em`.
- **Index tabs.** Four equal cells (`flex:1; min-width:0`), `padding:14px 18px`, `border-right:1px solid #f0f0f3` (last one `#e6e6ea`), `border-top:3px solid transparent`. Title **13.5px / 700 / letter-spacing:-0.01em**; below it IBM Plex Mono **10.5px `#9a9aa2`** reading `N reports`.
  - Tab titles are single-line: `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`, and the tab is a flex column with `justify-content:space-between` so the `N reports` lines share a baseline across all four tabs. `.ai-tabs` carries `min-width:0` so the group shrinks before the utility cell does.
  - **Tab labels are short by default: `Adoption`, `Economics`, `Performance`, `Workforce`** — the full category names appear everywhere else (drawer, shelf, archives). Each tab has ~131px of title space at 1180px; any replacement label wider than that ellipsizes. Labels are filterable via `ai_index_short_labels` in `functions-snippet.php`, but measure before changing them.
  - **Idle** `background:#fbfbfc`, title `#4a4a52`. **Hover / current** `background:#fff`, title `#111114`, `border-top-color:#2545f5`. Transition `all .18s ease`.
- **Utility cell.** `padding: 0 26px; display:flex; align-items:center; gap:20px`: search glyph (mono 13px `#9a9aa2`), `Glossary` and `About` at **13px / 600**, then Subscribe button `background:#2545f5; color:#fff; padding:9px 17px; font-size:12.5px; font-weight:700; border-radius:2px`.

**The 1a open state — the shelf.** 1a never overlays the page.
- Each tab is a **real link** to its index archive; clicking the label navigates. The shelf is a shortcut, not a gate.
- Shelf: full-width strip directly under the bar, `background:#f7f7f9; border-bottom:1px solid #e6e6ea; padding:18px 26px; display:flex; align-items:center; gap:26px`. Left block: mono label `In this index` (10px, `0.14em`, uppercase, `#2545f5`), index name **15px / 800**, count mono 10.5px `#9a9aa2`. Then up to four report titles, each `flex:1; padding:0 16px; border-left:1px solid #e0e0e6; font-size:12.5px; font-weight:600; line-height:1.4`. Right: `View index →` mono 11px `#2545f5`.
- **Trigger:** desktop hover with **120ms intent delay**; touch/keyboard = tap/Enter on the disclosure. Closes on **200ms grace** after pointer leaves the bar+shelf, on `Esc`, and on scroll. Only one shelf open at a time.
- **Motion:** `max-height 0 → scrollHeight` over **180ms ease-out**; shelf content fades in over 120ms. Content below is **pushed down, never covered**.
- **Condensed on scroll:** past **120px** scroll the bar collapses to **48px** — tab padding `14px 18px → 9px 18px`, the `N reports` line hides, the active cobalt rule stays. Any open shelf closes rather than following.

## Options 1b and 1c (documented, not first build)
- **1b — utility strip + mega panel.** Dark strip above the main row (`background:#111114`, `padding:8px 26px`, IBM Plex Mono 11px `0.1em` uppercase; left `Index updated June 2026 · 240 sourced statistics` in `#8a8a96`; right `⌕ Search` in `#5a78ff` plus `Methodology`, `Newsletter`). Main row: monogram (bars 6px wide, 12/18/26px) + wordmark 20px/900, nav at 14px/600 with `Indexes ▾` in cobalt with a 2px cobalt underline. Hovering `Indexes` drops a full-width panel: `grid-template-columns: repeat(4,1fr) 280px`, each column `padding:26px 22px; border-right:1px solid #f0f0f3` with a small bar mark, category title 14.5px/800, mono count, then report titles 12.5px/600 separated by `1px solid #f0f0f3` top borders; the fifth column is a `#111114` stat-of-the-week card. Panel shadow `0 8px 18px rgba(0,0,0,.06)`. Same 120ms intent / 200ms grace / 180ms motion rules. **Choose this when a fifth index appears or when report-title exposure in nav becomes an SEO priority.**
- **1c — numbered left rail.** `grid-template-columns: 236px 1fr`; rail `background:#111114; color:#fff; padding:24px 20px`, sticky full height. Sections: brand lockup (bars in `#2545f5 / #3f5cff / #5a78ff`), search box `border:1px solid #2f3040`, mono section label `Indexes` (9.5px, `0.16em`, `#5f5f6b`), then four rows `padding:11px 0; border-top:1px solid #2a2a34` each with mono ordinal `01–04`, title 13px, count right-aligned; current row `background:#1a1a22; border-left:3px solid #2545f5`, ordinal `#5a78ff`. Then flat links, then Subscribe button and mono updated-date block pinned bottom. Content column gets a breadcrumb bar `padding:15px 26px; border-bottom:1px solid #e6e6ea`, mono 11px, plus `Cite this page` in cobalt. Mobile: rail collapses to a **dark** 56px header and the drawer inherits the `01–04` numbering.

---

## Interactions & Behavior (complete)
| Behavior | Spec |
|---|---|
| Drawer open | `opacity 0 → 1`, `transform translateY(12px) → 0`, **180ms ease-out**; closed state `pointer-events:none` |
| Menu bars → X | 200ms ease, see Screen 1 |
| Accordion | `max-height` 200ms ease; glyph `+` ⇄ `–`; collapses whenever the drawer closes |
| Scroll lock | On open, `<html>`/`<body> overflow:hidden` + preserve and restore `scrollY` (iOS needs the position restore); `overscroll-behavior: contain` on the drawer list |
| Focus | On open, focus the search input; trap Tab within the drawer; `Esc` closes and returns focus to the menu button |
| Current page | Mark with `aria-current="page"`; visually the cobalt top rule (desktop) or cobalt label (mobile) |
| Shelf (1a) | 120ms hover intent, 200ms leave grace, closes on `Esc` and on scroll |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` — remove translate + max-height transitions, toggle instantly |
| Hit targets | Every interactive row >= 44px tall; menu button exactly 44x44 |
| No-JS | Drawer content ships in the DOM; a `:target` fallback (`#ai-drawer`) opens it without JS so crawlers and no-JS users reach every link |
| Loading / error | None — navigation is server-rendered. No skeletons, no async states. |

## Mobile rendering & performance requirements
This site's traffic is majority mobile search; the nav must not cost LCP or CLS.
1. **No layout shift.** The 60px header is a fixed height reserved in the document flow. Never inject the nav after paint; never animate its height on load. Target **CLS 0**.
2. **Inline the critical nav CSS** (header + closed drawer, ~1.5KB) in `<head>`; load the rest of `nav.css` normally. The drawer's own styles are not critical — it starts closed.
3. **Fonts.** Archivo 700/900 and IBM Plex Mono 400/500 only — subset `latin`, `font-display: swap`, `preconnect` to the font host, and `preload` the Archivo 900 woff2 used by the wordmark. Self-host if the theme already self-hosts.
4. **JS budget.** The whole nav script is < 2KB, vanilla, no dependency, `defer`. No jQuery. Do not load it above 900px if only the shelf needs it — gate with `matchMedia`.
5. **Zero images.** Monogram is markup; the search glyph is a text character. Nothing to download, nothing to lazy-load.
6. **Touch.** `touch-action: manipulation` on buttons to kill the 300ms tap delay; no `:hover`-only affordances on touch (`@media (hover: hover)` guards the shelf hover trigger).
7. **Safe areas.** `env(safe-area-inset-bottom)` on the subscribe bar; `viewport-fit=cover` in the meta viewport.
8. **Height units.** Use `100dvh` (with a `100vh` fallback) for the drawer so mobile browser chrome doesn't clip the subscribe bar.
9. **Accessibility.** `<nav aria-label="Main">`; `aria-expanded`/`aria-controls` on both the menu button and the accordion; visible focus rings (2px `#2545f5` outline, 2px offset); contrast is >= 4.5:1 everywhere (`#9a9aa2` on `#fff` is used for meta text at >= 10.5px mono — keep it non-essential or darken to `#767680` if an audit flags it).

## State Management
Local, no store needed.
- `open: boolean` — drawer. Toggled by the menu button; forced false by `Esc`, the close button, and page navigation. Setting false also sets `indexesExpanded = false`.
- `indexesExpanded: boolean` — mobile accordion.
- `shelfIndex: number | null` — desktop 1a open shelf (null = closed).
- `condensed: boolean` — desktop bar, derived from `scrollY > 120` (throttle with `requestAnimationFrame`).

Side effects of `open`: body scroll lock, focus move/trap, `aria-expanded`. **No runtime data fetching** — every label and count is server-rendered by WordPress.

## Design Tokens
**Colors**
| Token | Hex | Use |
|---|---|---|
| `--ai-cobalt` | `#2545f5` | accent, CTA, active rules, monogram |
| `--ai-cobalt-light` | `#5a78ff` | accent on dark surfaces |
| `--ai-ink` | `#111114` | text, dark surfaces, tallest bar |
| `--ai-body` | `#33333a` | body copy |
| `--ai-muted` | `#55555e` | secondary copy |
| `--ai-meta` | `#8a8a92` | sub-row descriptions |
| `--ai-meta-light` | `#9a9aa2` | mono meta, placeholders |
| `--ai-rule` | `#e6e6ea` | primary hairlines |
| `--ai-rule-light` | `#f0f0f3` | sub-row hairlines |
| `--ai-surface` | `#ffffff` | header, drawer, bar |
| `--ai-shelf` | `#f7f7f9` | 1a shelf background |
| `--ai-tab-idle` | `#fbfbfc` | 1a idle tab |

Dark-rail extras (1c): `#1a1a22` (current row), `#2a2a34` (rail hairline), `#2f3040` (rail input border), `#5f5f6b` (rail mono), `#8a8a96` (strip mono, 1b).

**Typography** — `Archivo` 400/600/700/800/900 + `IBM Plex Mono` 400/500.
| Use | Spec |
|---|---|
| Mobile nav label | Archivo 900 · 27px · -0.03em |
| Wordmark (mobile) | Archivo 900 · 16px · -0.02em |
| Wordmark (1a) | Archivo 900 · 17px · -0.025em |
| Sub-row title | Archivo 700 · 14.5px |
| Desktop tab title | Archivo 700 · 13.5px · -0.01em |
| CTA | Archivo 700 · 15px (mobile) / 12.5px (desktop) |
| Sub-row description | Archivo 400 · 11.5px |
| Meta / counts | IBM Plex Mono 400 · 10.5–12px |
| Uppercase mono label | IBM Plex Mono 500 · 10–11px · 0.1–0.16em |

**Spacing scale used** — 2 / 3 / 5 / 9 / 10 / 11 / 12 / 13 / 14 / 16 / 18 / 20 / 22 / 26px. Mobile gutter **18px**; desktop gutter **26px**.

**Radius** — `0` everywhere except the CTA button (`2px`).

**Borders** — `1px #e6e6ea` (rows, header, bar), `1px #f0f0f3` (sub-rows, tab dividers), `1.5px #111114` (mobile search), `3px` cobalt (active tab top rule / current rail row left rule).

**Shadows** — none on mobile. `0 8px 18px rgba(0,0,0,.06)` on the 1b mega panel only. The `0 2px 10px rgba(0,0,0,.13)` in the prototypes is mockup phone-frame chrome, not UI.

**Motion** — 120ms (hover intent), 180ms ease-out (drawer, shelf), 200ms ease (accordion, bar rotation, leave grace).

## Assets
No raster assets at all. Monogram = three rectangles from tokens (see `reference/monogram.svg`). Search glyph = the character `⌕` in IBM Plex Mono; swap for the theme's icon set if one exists. Fonts from Google Fonts (Archivo, IBM Plex Mono) or self-hosted.

## Files in this bundle
| File | What it is |
|---|---|
`README.md` | this document — self-sufficient spec |
| `CLAUDE_CODE_PROMPT.md` | paste-ready brief for Claude Code, with task order and acceptance criteria |
| `reference/nav-reference.html` | working standalone HTML/CSS/JS implementation (mobile drawer + 1a bar + shelf) |
| `reference/nav.css` | the stylesheet from the reference, ready to enqueue |
| `reference/nav.js` | the behavior script from the reference, ready to enqueue |
| `reference/monogram.svg` | the rising-bars mark |
| `wordpress/functions-snippet.php` | menu registration, asset enqueue, index-terms helper |
| `wordpress/template-part-nav.php` | the PHP template part rendering header + drawer + 1a bar |
| `prototypes/The AI Index - Mobile Menu.dc.html` | mobile drawer prototype (interactive) |
| `prototypes/The AI Index - Global Nav.dc.html` | 1a / 1b / 1c options + "how 1a opens" (interactive) |

Wider project context: `The AI Index - Index System.dc.html` (landing, indexes hub, report template) and `design_handoff_ai_index_redesign/` (site-wide bundle). Match the tokens documented here.
