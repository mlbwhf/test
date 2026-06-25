# Handoff: RentNova Blueprint homepage → apply to existing WordPress site

## Overview
This package contains a redesigned homepage for **RentNova** (https://rent-nova.com/) — a homeowner-led "turn your residence into income" landing experience built around an animated architectural **section-drawing hero**, a three-stream services model (Convert / Manage / Stay), a six-step delivery pipeline, a revenue-share pitch, featured direct-book stays, and a free-feasibility CTA.

The goal of this task: **apply this design to the existing rent-nova.com WordPress site** with minimal disruption — without rebuilding the whole site.

## About the design files
The files in this bundle are **design references**, not a finished site:
- `RentNova Blueprint.dc.html` — the visual source of truth (a self-contained HTML prototype). Open it in a browser to see exact layout, colors, type, spacing, and the hero animation timeline. **This is the look to match.**
- `template-rentnova-blueprint.php` — **ready-to-use WordPress Page Template** for the homepage.
- `template-rentnova-owners.php` — drop-in **Owners** page template (animated-blueprint hero + tracks + pipeline + what's-included + revenue share + CTA).
- `template-rentnova-about.php` — drop-in **About** page template (hero with by-the-numbers sidebar + narrative + values + revenue share + CTA).
- `template-rentnova-contact.php` — drop-in **Contact** page template (hero + contact info + feasibility-call form + CTA).
- `owners.html`, `about.html`, `contact.html` — standalone browsable previews of the three pages above (open directly, no WordPress needed).
- `rentnova-theme/` — a complete standalone WordPress **theme** version (same design) including a `Stays` custom post type, in case a fuller build is preferred over the drop-in templates.
- `screenshot.png` — static reference of the finished hero.

The prototype was built in HTML; treat it as the spec. The two PHP deliverables already translate it to WordPress — your job is to install, wire real content/links, and verify on the live theme.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and the hero animation are final. Match them exactly. All values are listed under **Design Tokens** below, and all are already encoded in `template-rentnova-blueprint.php` (scoped under `.rnbp`).

---

## Recommended path: the drop-in Page Templates

This is the lowest-risk way to "apply to the existing site." It does **not** replace the active theme.

1. Copy any (or all) of these four templates into the active theme — ideally a **child theme** so updates don't overwrite them:
   - `template-rentnova-blueprint.php` → homepage
   - `template-rentnova-owners.php` → Owners page
   - `template-rentnova-about.php` → About page
   - `template-rentnova-contact.php` → Contact page

   Drop them into `wp-content/themes/<active-or-child-theme>/`.
2. WordPress admin → **Pages → Add New** for each (titles: Owners / About / Contact; slugs match).
3. **Page Attributes → Template** → pick the matching one (**RentNova Blueprint** / **RentNova Owners** / **RentNova About** / **RentNova Contact**).
4. Publish. To make the homepage the front page: **Settings → Reading → Your homepage displays → A static page → Homepage =** the page using *RentNova Blueprint*.

### Why this is safe
- All CSS is **scoped under `.rnbp`** and printed inline in each template — it cannot leak into or be broken by the active theme.
- Each template calls `get_header()` / `get_footer()`, so the site's existing nav, footer, analytics, and `wp_head` / `wp_footer` hooks all still fire.
- The hero/sections use a **full-bleed breakout** (`width:100vw; left:50%; margin-left:-50vw`) so they span edge-to-edge even if the theme wraps page content in a narrow container.

### What to wire up after install
- **CTA links**: the "Book the call →" button points to `home_url('/contact/')`. Confirm that page exists or change the slug. The hero buttons use in-page anchors (`#rnbp-contact`, `#rnbp-stays`).
- **Stay cards**: currently two hardcoded cards using live images from `rent-nova.com`. Replace `href="#"`, names, prices, meta, and `src` with the real listings (or pull from the existing Stays data — see next section).
- **"View all stays →"**: point to the real stays archive/listing URL.

---

## Optional fuller build: the theme + Stays CPT
If RentNova wants listings managed in wp-admin rather than hardcoded, the `rentnova-theme/` folder is a complete theme that:
- Registers a **`stay`** custom post type with per-listing meta: `rn_location`, `rn_price`, `rn_bedrooms`, `rn_sleeps`, `rn_min_nights`, `rn_book_url`.
- Renders the homepage via `front-page.php`, pulling the latest two stays (falls back to demo data when none exist).
- Exposes the hero as a `[rentnova_blueprint]` shortcode **and** a `rentnova/blueprint` block for reuse on any page.
- Ships `archive-stay.php` and `single-stay.php` for the stays listing + detail pages.

**Best of both**: if they like the drop-in template but want managed listings, port just the CPT registration + meta box from `rentnova-theme/functions.php` into the child theme's `functions.php`, then replace the two hardcoded cards in the template with a `WP_Query` loop over `post_type => 'stay'` (the loop already exists in `rentnova-theme/front-page.php` — copy it).

---

## Screens / Views

### Homepage (single scroll)
Full-width, stacked sections, max content width **1320px** centered, horizontal padding **56px** (28px under 860px).

**1. Hero** — `background #16241b` (dark green), text `#f1efe8`.
- Two-column grid `430px / 1fr`, `gap 52px`, vertically centered. Collapses to one column under 1100px.
- Left: eyebrow (IBM Plex Mono, 12px, `#c45e35`, uppercase, letter-spacing .16em) "Turn your residence into income"; H1 (Archivo 900, 74px, line-height .9, letter-spacing -.04em) "Make your home **pay.**" with "pay." in `#e0a583`; lead paragraph (18px, `#c8d2c8`, max 400px); two buttons.
- Buttons: terracotta `#c45e35` filled "Make your home pay →"; ghost (1.5px border `#4a5e4f`) "Browse stays". Hover: `translateY(-1px)` + brightness 1.05.
- Right: **animated blueprint** (see Interactions). Container: `#13201a` with a 34px grid background, 1px border `#34493b`, 4px radius, four L-shaped corner ticks.
- Below both columns: a 4-cell **stat strip**, top border `#2f4537`, each cell right-bordered: "3 units / from one lot", "1 team / design → manage", "$0 / feasibility call", "Rev-share / paid when you are". Numbers Archivo 800 34px; labels 13px `#8ba090`.

**2. Three tracks** — paper background `#f1efe8`.
- Head row: H2 (Archivo 800, 46px) "Three tracks, one address." left; note (15px `#5a574c`, right-aligned, max 280px) right.
- 3-column grid inside a 1px `#d8d3c5` border, each cell padding 32px, dividers between. Middle cell has `#e9e5da` background.
- Each: track number (Archivo 800, 15px, `#c45e35`) "01 — CONVERT" etc.; H3 (23px 800); paragraph (15px `#5a574c`).
- Copy: **01 CONVERT** "Turn your home into units" / **02 MANAGE** "Furnish, list & run it" / **03 STAY** "Book a stay, direct" (exact body copy in the template).

**3. Pipeline** — paper background.
- Head: H2 (38px) "One contract. Every step." + inline note "Builders hand you keys. We keep going."
- 6-column grid, gap 12px. Each step is a rounded (6px) block, padding 20px 18px, with a mono number (12px `#e0a583`) above a 16px/700 label. Backgrounds step from `#16241b` → `#3a5e45` (steps 1–5), step 6 is terracotta `#c45e35`. Labels: Feasibility, Design, Build, Furnish, List, Manage.

**4. Revenue share** — dark card `#1a1a17`, 10px radius, padding 48px, 2-col grid `1.3fr / 1fr`.
- H2 (Archivo 800, 40px) "You own the asset. We run the income. **We split the upside.**" (last line `#e0a583`); paragraph 16px `#c7c3b6`.

**5. Featured stays** — paper.
- Head: H2 (38px, max 560px) "The homes we built, available to book." + "View all stays →" link (`#c45e35`).
- 2-col card grid, gap 24px. Card: white, 1px `#d8d3c5` border, 8px radius; image 240px tall `object-fit:cover`; body padding 22px with name/loc/meta left and price right. Hover: `translateY(-3px)` + shadow.

**6. CTA** — terracotta `#c45e35`, white text, centered, padding 64px.
- H2 (Archivo 900, 48px) "A free 30-minute feasibility call."; paragraph (17px, max 560px); dark button `#1a1a17` "Book the call →".

---

## Interactions & Behavior

### Hero blueprint animation (the signature element)
An SVG architectural section that **draws itself in** on load, then idles with a looping scan line.
- **Draw-in**: strokes use `stroke-dasharray`/`stroke-dashoffset` animated to 0 via `@keyframes rnbpDraw`. Ground line starts at .2s; house silhouette .05s/1.7s; floor slabs .9–1.1s; garden suite 1.2s; chimney 1.5s.
- **Fade/rise**: hatch fills (`rnbpIn`), furniture + scale figure, dimensions, leader callouts and title block fade/rise (`rnbpUp`) on a staggered 1.1s → 2.8s timeline.
- **Scan line**: terracotta horizontal line loops top→bottom every 5s (`rnbpScan`, infinite, 2.6s delay).
- **Float tag**: "● 3 units · 1 lot" bobs (`rnbpFloat`).
- **Replay on scroll**: an `IntersectionObserver` (threshold .35) re-triggers the draw-in each time the hero re-enters view, by nulling and restoring `style.animation` after a reflow.
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` freezes everything to the final state (offsets 0, opacity 1) and disables the observer.

Blueprint content (label these correctly if rebuilding the SVG): three stacked floors of the main house (01 LEGAL BASEMENT SUITE 1BR, 02 MAIN RESIDENCE 4BR) + a detached 03 GARDEN SUITE; dimension callouts 9.0 m (height), 12.6 m (width), 6.4 m (garden); north arrow; title block "RENTNOVA — SECTION A–A / PROJECT RN·MISS·01 / SCALE 1:100".

### Other
- Card and button hovers as described above.
- All section CTAs are anchors today; wire to real URLs/forms.

## State Management
None required for the drop-in template — it is static markup + one IntersectionObserver. If using the theme's Stays CPT, the only "state" is the `WP_Query` over `post_type=stay` and the per-post meta fields listed above.

## Responsive behavior
- **≤1100px**: hero collapses to one column; H1 → 60px.
- **≤860px**: `--rn-pad` → 28px; H1 → 48px; stat strip wraps to 2×2; tracks stack; pipeline → 2 columns; revenue card stacks (H2 30px); stays stack; section heads left-align; CTA H2 → 34px.

---

## Design Tokens

**Colors**
| Token | Hex | Use |
|---|---|---|
| ink (dark green) | `#16241b` | hero/footer bg, step 1 |
| ink2 (near-black) | `#1a1a17` | body text, revenue card, dark btn |
| paper | `#f1efe8` | page bg, light text on dark |
| paper2 | `#e9e5da` | alt track cell, image bg |
| terracotta | `#c45e35` | primary accent, CTA, step 6 |
| sand / clay | `#e0a583` | hero highlight, mono numbers |
| muted | `#5a574c` | body copy on paper |
| line | `#d8d3c5` | borders on paper |
| line-dk | `#2f4537` | borders on dark |
| mint | `#8ba090` | stat labels |
| pipeline ramp | `#16241b · #1f3326 · #284230 · #31503b · #3a5e45 · #c45e35` | steps 1→6 |
| blueprint stroke | `#eae5d6` (structure), `#cdd6cc` (furniture/dims), `#e0a583` (leaders) | SVG |

**Typography** (Google Fonts: Archivo, Hanken Grotesk, IBM Plex Mono)
- Display / headings: **Archivo** 800–900, tight letter-spacing (-.03 to -.04em).
- Body / UI: **Hanken Grotesk** 400–800.
- Labels / technical / numbers: **IBM Plex Mono** 400–500, letter-spacing .06–.16em, often uppercase.
- Key sizes: H1 74, section H2 46/38, CTA H2 48, body 15–18, eyebrow/labels 11–13.

**Spacing / radius / shadow**
- Content max-width 1320px; section padding 64px vertical / 56px horizontal (28 mobile).
- Radii: buttons/steps 4–6px; cards 8px; revenue card 10px; blueprint 4px.
- Card hover shadow: `0 12px 28px rgba(22,36,27,.12)`.

## Assets
- Stay photos are hot-linked from the live site:
  - `https://rent-nova.com/wp-content/uploads/2026/05/6019-featherhead-crescent-mississauga-W4633966-1.jpg` (The Two-Story Home)
  - `https://rent-nova.com/wp-content/uploads/2026/05/Bedroom-1-scaled.jpg` (The Erin Mills Suite)
  Prefer moving these into the Media Library / Stay featured images for production.
- The blueprint hero is **inline SVG** — no external asset.
- Fonts load from Google Fonts; self-host if privacy/performance requires.

## Files
- `template-rentnova-blueprint.php` — drop-in Page Template (primary deliverable).
- `RentNova Blueprint.dc.html` — HTML design reference (visual source of truth).
- `screenshot.png` — static hero reference.
- `rentnova-theme/` — full standalone theme alternative (CPT, shortcode/block, archive + single templates, README).

## Suggested commit / PR for Claude Code
1. Add `template-rentnova-blueprint.php` to the child theme.
2. Create/assign the homepage page to the template; set as static front page.
3. Replace hardcoded stay cards + CTA links with real content (or wire to the Stays CPT).
4. QA: hero animation on load + scroll-replay, reduced-motion, full-bleed at 1440/1024/375 widths, that scoped styles don't clash with the active theme.
