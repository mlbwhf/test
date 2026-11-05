# Training menu + class selection flow — handover

Everything a developer needs to build the training navigation and the class-selection flow on agile-agilist.com (WordPress + Astra). Start with `CLAUDE.md`.

## Start here
1. `WORDPRESS-REBUILD.md` — the install and wiring guide for WordPress (read first).
2. `CLAUDE.md` — rules and definition of done.
3. `FLOW.md` — product spec for the selection flow.

## Contents
- `html/select-flow.html` — working vanilla-JS preview of the full flow (classes → dates → register or compare).
- `wordpress/theme/` — Astra child-theme page templates for /training/select/ and /training/compare/.
- `wordpress/aa-mm/includes/flow.php`, `assets/aa-fl.css`, `assets/aa-fl.js` — flow shortcodes and assets.
- `html/mega-menu.html` — working preview of the category menu (same CSS, JS, markup as WordPress).
- `html/compare-table.html` — crawlable comparison table (plain HTML).
- `html/training-menu.txt` — sample of the plain-text index served at `/training-menu.txt`.
- `data/training-menu.json` — single source of truth: categories, classes, and (for the Core flow classes) price, who it's for, prerequisites, cohorts.
- `wordpress/aa-mm/` — plugin: shortcode `[aa_training_menu]`, CSS, JS, JSON, JSON-LD, `/training-menu.txt`.
- `reference/Training Mega Menu.dc.html`, `reference/Course Selection Flow.dc.html` — the design files. Read the source for exact spacing, colours and states.
- `FLOW.md` — full spec for select classes → select dates → register or compare.

## Categories (current)
| Category | Classes |
|---|---|
| AI-Native (flagship) | AI-Native Foundations, Ready Certification, Leading the AI-Native Org, Value Architect, Launching AI-Native ARTs |
| **Core** (NEW) | SAFe DevOps, SAFe for Teams (SP), Leading SAFe (SA), Scrum Master, SAFe POPM |
| **SAFe Roles** (renamed from "Core SAFe Roles") | Advanced Scrum Master, Business Owner, Agile Software Engineering (ASE), SAFe for Architects, Large Solution SAFe (LSSP) |
| Advanced SAFe | Implementing SAFe (SPC), ASPC, RTE, APM, LPM |
| Micro-Credential | Responsible AI, Conflict & Collaboration, Value Stream Mapping, Agile Contracting for Government |
| SAFe by Industry | SAFe for Hardware, Hardware Teams, Leading SAFe for Government |

Changes in this version: LSSP moved from Advanced SAFe to SAFe Roles; classes that are in Core were removed from SAFe Roles; "Core" dropped from the SAFe Roles name. A class can still appear in two categories if needed, but none do now.

## Menu behaviour
Category rail (swipeable strip under 760px) with sliding highlight; staggered class cards; + / ✓ toggle (44px) with a flying dot to the shortlist counter; sticky shortlist tray (count + one button on mobile, expandable chips); search across all categories; swipe between categories; keyboard arrows on tabs; optional header dropdown mode. All motion stops under `prefers-reduced-motion`.

## LLM and search visibility (required)
- All categories and classes exist in server-rendered HTML. JS only toggles classes. No fetches.
- Category `<h2>`, class `<h3>`, dates in `<time datetime>`, plain-list `<details>`.
- `ItemList` / `Course` / `CourseInstance` JSON-LD from the block.
- `/training-menu.txt` generated from the JSON. Add it to `/llms.txt`.
- `/training/compare/` is a real `<table>` of the Core classes (see `html/compare-table.html`).
- Course pages list their cohorts as plain HTML (see FLOW.md §5).

## Mobile (required)
- 360px and 390px tested. Targets 44px or larger. Search text 16px (no iOS zoom).
- Sticky bottom bar with safe-area padding. Date cards scroll sideways with snap. Compare table scrolls sideways with the label column fixed.
- No horizontal page scroll at any width.

## Install
1. Copy `wordpress/aa-mm/` to `wp-content/plugins/`, activate, save Permalinks once.
2. Put `[aa_training_menu]` on /training/. For a header dropdown use `mode="dropdown"` and give the Training menu item the class `aa-mm-trigger`.
3. Build the flow per `FLOW.md`.

## Open items
- Dates, prices, prerequisites and URLs are placeholders. Wire to the real cohort calendar and checkout records.
- Confirm class lengths and codes.
- Decide multi-class checkout (flow assumes one payment per class, see FLOW.md §6).
- Copy is English only. Button labels stay under about 22 characters for FR, ES and AR.
