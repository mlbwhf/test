# Agile Agilist — Website Redesign Handoff (Full Site)

A complete redesign of agile-agilist.com in a single **editorial brand system**, recolored to the
**official Agile Agilist palette** (deep teal + mint) with a **performance-first font strategy**.
This package is the source of truth for a developer implementing the design in **WordPress** with
**Claude Code**.

Read order: **this README** (brand system + page specs + SEO/LLM + performance) → **WORDPRESS_BUILD_GUIDE.md**
(how to build it in WP).

---

## What's included (pages)
| File | Page | Notes |
|---|---|---|
| `Homepage - Direction C.dc.html` | Homepage | Editorial hero, catalogue, assessments, methodology, coaching |
| `Training Landing.dc.html` | Training landing | **Template** — organises all 19 certs into 5 tracks |
| `Leading SAFe Course.dc.html` | Course + checkout | Detail page **merged** with inline enrollment (live total, attendee toggle) |
| `Services Landing.dc.html` | Services landing | **Template** — 6 service lines |
| `Service - Digital Transformation.dc.html` | Service detail | **Template** — reused for every service |
| `Assessments Landing.dc.html` | Assessments landing | **Template** — 6 diagnostics |
| `Assessment Runner.dc.html` | Assessment runner | **Interactive** quiz: intro → progress → scored result |
| `Brand Nav - Animated Logo.dc.html` | Header reference | Animated logo + Training mega-menu spec |

Each `.dc.html` is an in-house prototype format that loads `support.js`. **Do not ship the `.dc.html`
files or `support.js`.** Read them as the spec (markup = structure/styling; the logic class at the
bottom of interactive files = behavior to port). Recreate the UI with WordPress-native markup/PHP/CSS.

---

## Brand System (THE source of truth for design tokens)

### Logo
`assets/logo-agile-agilist.png` — the official stacked "AGILE / AGILIST" wordmark with the white
background removed (transparent, 1459×719). Deep-teal letterforms + mint fills. **Replace with the
original SVG** in production for crispness and to enable per-letter animation. In dark footers it is
shown white via `filter:brightness(0) invert(1)`.

### Color (official palette, sampled from the logo)
| Token | Hex | Role |
|---|---|---|
| **Ink / primary** | `#0E3A44` | deep teal — headings, primary buttons, rules, body emphasis |
| **Accent** | `#127E88` | mid teal — links, eyebrows, italic emphasis, hover, progress |
| Accent hover | `#0C5E66` | button/link hover |
| **Mint** | `#8FCFCF` | accent fills, dots, dark-panel CTAs, highlights |
| Mint bg / border | `#E6F3F3` / `#BFE1E1` | chips, soft fills |
| Canvas | `#FBFDFD` | page background |
| Canvas alt | `#F1F8F8` / `#F4FAFA` | bands, input fills |
| Dark panel | `#0B2E35` | methodology/CTA panels |
| Footer | `#08252B` | footer |
| Ink muted | `#3C565E` / `#5E7378` | body copy |
| Ink faint | `#88A0A4` / `#9AB0B4` | mono labels, captions |
| Hairline | `#DCEAEA` | light dividers/grids |
| Hairline strong | `#C7DEDE` | input/tile borders |
| Success | `#1F8A5B` + `#C7F2D0` | "Included", "Fast filling" |
| **SAFe family** | `#2C7C8C` / border `#BCE0E5` / bg `#EAF6F7` | SAFe-track badge + cards |
| **AI-Native family** | `#6E3CF4` / border `#DAD2F4` / bg `#F3EFFE` | AI-Native badge + cards |

Two cert/service families are **color-coded**: SAFe = teal, AI-Native = purple. The purple is the only
non-teal hue and is used sparingly as the AI-Native differentiator.

### Typography — performance-first (only ONE webfont)
- **Headings / display / blockquotes:** `Newsreader` (serif), weights 300/400/500, *italic for emphasis*.
  This is the **only** font loaded over the network. Fallback stack: `'Newsreader',Georgia,'Times New Roman',serif`.
- **Body / UI / buttons / inputs:** the **system font stack** — `-apple-system,BlinkMacSystemFont,
  "Segoe UI",Roboto,Helvetica,Arial,sans-serif`. Zero network cost, instant paint.
- **Labels / meta / eyebrows / spec numerals:** the **system monospace stack** — `ui-monospace,
  SFMono-Regular,Menlo,Consolas,monospace`, uppercase, letter-spacing .04–.1em.
- Heading sizes: H1 80–88px, section H2 40–54px, card titles 19–30px; tracking -.02 to -.03em on large
  sizes; `text-wrap:balance` on big headings.

### Shape & layout
- Container `max-width:1280px` (runner 1080px), padding `0 30px`.
- **Border radius is deliberately 2px** on buttons/inputs/chips/tiles — the editorial signature. (Circles
  for dots/avatars only.)
- **Hairline borders (1px)** instead of heavy cards; section heads close with a 1px ink rule.
- Section rhythm ~72–88px. Shadows used sparingly (only some hover states).

### Motion
- **Animated logo** (`Brand Nav` file): `aaLogoPop` entrance (scale .93→1) + a periodic light `aaShine`
  sweep masked to the letterforms. **Critical rule:** the resting frame is fully visible — the animation
  never starts at `opacity:0`, so the logo can't disappear when a tab is backgrounded.
- Quiz uses `fadeUp` on question/result; result bars use `barGrow` (scaleX). All wrapped in
  `@media (prefers-reduced-motion:reduce){ animation:none }`.

---

## Page specs (build notes per page)

### Header (every page)
Three tiers: (1) mono **masthead** with trust signals; (2) sticky **main bar** — animated logo (top-left),
nav links with a draw-in underline, two right-side actions; (3) on the course page, a **sticky course bar**.
Training opens a **mega-menu**: a hairline 2×2 of SAFe tracks (teal counts) + an AI-Native featured row
(navy/purple). Must work on **hover AND click/keyboard**; `aria-expanded`, Escape to close.

### Homepage
Editorial: mono index eyebrows `( 01 / 06 )`, oversized Newsreader hero with italic teal accent, credentials
marquee, 19-cert catalogue as a numbered hairline list (AI-Native row inverted), assessments grid, dark
methodology spread (4 layers), pull-quote proof, coaching, closing.

### Training landing (template)
Hero + stat grid → track index chips → five track sections (Micro-Credentials, SAFe by Role, Advanced,
By Industry, AI-Native dark feature). Each cert is a hairline row/card linking to its course page (e.g.
Leading SAFe). Slots the remaining ~14 certs by adding rows. → How-a-cohort-works → FAQ → CTA.

### Leading SAFe course + checkout
Sticky course bar (with SPC badge) → hero + sticky enrollment card → **issued-credential strip** (SAFe SPC
badge) → what's included (6, hairline grid, item 6 inverted) + exam-at-a-glance → curriculum (6) → cohorts
(6 rows) → **"Where this leads"** (SAFe-teal card + AI-Native-purple card, each with its real badge) →
pull-quote → **inline checkout** → FAQ → final CTA. **Interactive:** quantity stepper → live total in the
submit button + order summary; attendee toggle reveals attendee sub-form. Badges: `assets/badge-safe-spc.png`,
`assets/badge-ai-native-foundations.png`.

### Services landing + Service detail (templates)
Landing: hero + outcome stats → 6-service hairline list (AI-Native tinted) → dark 4-step approach → proof →
contact CTA. Detail (Digital Transformation): hero + "engagement at a glance" card → the problem → deliverables
(6) → dark 4-phase plan → measurable outcomes + quote → related services → contact CTA. Detail is the
**reusable template** for all services.

### Assessments landing + Runner
Landing: hero + stats → featured Cert Recommender panel → 5-diagnostic hairline grid → how-it-works → CTA.
**Runner (interactive):** `intro` → `quiz` → `result` state machine. Quiz: top progress bar, dimension label,
Newsreader statement, 5-point Likert (auto-advances, Back enabled), 12 questions across 6 dimensions. Result:
big overall %, maturity level (Forming/Developing/Maturing/Leading), per-dimension animated bars, and a
**recommendation derived from the lowest-scoring dimension** (maps to a course). Logic class in the file is
the scoring spec — port it verbatim.

---

## SEO + LLM-readability (bake into the build)
- **Semantic HTML:** one `<h1>` per page; ordered `<h2>/<h3>`; `<header><nav><main><section><article><footer>`;
  breadcrumb in a `<nav aria-label="Breadcrumb">`. The designs already use this structure.
- **Meta + social:** per-page `<title>` (~55 chars), meta description (~155), canonical, Open Graph + Twitter
  cards. Course/service titles lead with the credential/service name.
- **Structured data (JSON-LD)** — add per page type:
  - Course pages → `Course` + `Offer` (price 850 USD, availability) + `AggregateRating` (4.9 / count) + `FAQPage`.
  - Service pages → `Service` (+ `Provider` = `Organization`).
  - Assessments → `WebApplication`/`Quiz` as appropriate; landing → `ItemList` of assessments.
  - Site-wide → `Organization` (logo, sameAs socials) + `BreadcrumbList` on every page.
- **LLM-readability:** lead each section with a plain-language summary sentence; keep FAQ as real Q&A text
  (not images); use descriptive anchor text ("View Leading SAFe cohorts", not "click here"); give cohorts/prices
  as machine-readable text; `alt` text on the logo and both badges; descriptive `id`s on sections.
- **Headings carry meaning:** the italic-accented phrases are styling only — the full heading text reads
  naturally for crawlers and screen readers.

## Performance budget ("light when loaded")
- **Fonts:** only **Newsreader** loads over the network (self-host + `font-display:swap` recommended; subset to
  Latin). Body + labels use **system fonts** — no webfont for them. This is the single biggest weight win.
- **No CSS framework, no JS framework, no jQuery.** The interactions (stepper, toggle, mega-menu, quiz, FAQ)
  are a few KB of vanilla JS; FAQ uses native `<details>`.
- **Inline-styled prototype** → in WP, consolidate into one small stylesheet using the tokens; enqueue CSS/JS
  **only on the templates that need them**.
- **Images:** logo is small; resize/compress the two badge PNGs to ~2× their display size; `loading="lazy"`
  on below-fold images (never the logo). Prefer SVG for the logo.
- **Targets:** Lighthouse Performance ≥ 90, Accessibility ≥ 95, minimal CLS (system fonts + sized images).

## Assets
- `assets/logo-agile-agilist.png` — official wordmark, transparent (replace with SVG in prod).
- `assets/badge-safe-spc.png` — SAFe SPC credential badge (teal) — SAFe-family training badge.
- `assets/badge-ai-native-foundations.png` — AI-Native Foundations 2026 badge (purple) — AI-Native family.
- Fonts: Newsreader via Google Fonts or self-hosted.
