# WordPress Build Guide — Agile Agilist Full-Site Redesign

**Audience:** a developer using Claude Code to implement this redesign on **agile-agilist.com (WordPress)**.
**Companion:** `README.md` is the design spec (brand tokens, per-page layout, SEO/LLM, performance).
This file is *how to build it in WordPress*.

The `.dc.html` files + `support.js` are a prototype format — **read them as spec, don't ship them.**
Lift the interactive logic (course checkout stepper/total/toggle; the assessment runner scoring) into
vanilla JS as described below.

---

## 0. Inspect the existing stack first
Confirm before building, and match conventions instead of fighting them:
- Theme type: **classic PHP theme** (page templates + `functions.php`), **block theme** (`theme.json` +
  templates), or a **builder** (Elementor / WPBakery / Bricks / Divi)? The live site looks classic/builder.
- **WooCommerce** active? Recommended for the course checkout (cohort = product/variation; Stripe handles
  card + Apple/Google Pay).
- **ACF** present? Cleanest way to make cohorts, services, assessments, and copy editable.
- How are today's pages (`/training/safe/sa/`, `/services/`, `/assessments/`) built? Reuse the content model.

Pick the lowest-risk integration that fits. The notes below assume classic theme + WooCommerce + ACF.

---

## 1. Global building blocks (build once, reuse on every page)

### 1a. Tokens
Put the palette + type in ONE place:
- **Block theme:** `theme.json` → `settings.color.palette` + `settings.typography`.
- **Classic/builder:** CSS custom properties on `:root` in one enqueued stylesheet:
```css
:root{
  --aa-ink:#0E3A44; --aa-accent:#127E88; --aa-accent-hover:#0C5E66; --aa-mint:#8FCFCF;
  --aa-mint-bg:#E6F3F3; --aa-mint-bd:#BFE1E1; --aa-canvas:#FBFDFD; --aa-canvas-alt:#F1F8F8;
  --aa-dark:#0B2E35; --aa-footer:#08252B; --aa-ink-muted:#3C565E; --aa-ink-soft:#5E7378;
  --aa-ink-faint:#88A0A4; --aa-hairline:#DCEAEA; --aa-hairline-strong:#C7DEDE;
  --aa-success:#1F8A5B; --aa-safe:#2C7C8C; --aa-safe-bd:#BCE0E5; --aa-safe-bg:#EAF6F7;
  --aa-ai:#6E3CF4; --aa-ai-bd:#DAD2F4; --aa-ai-bg:#F3EFFE;
  --aa-serif:'Newsreader',Georgia,'Times New Roman',serif;
  --aa-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --aa-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --aa-radius:2px;
}
```
Headings/quotes → `var(--aa-serif)`; everything else → `var(--aa-sans)`; labels → `var(--aa-mono)`.
**Only Newsreader** is loaded over the network (self-host + `font-display:swap`, subset Latin).

### 1b. Header part (masthead + main bar + mega-menu + animated logo)
Build as the site header (`header.php` / `parts/header.html`). Spec in `Brand Nav - Animated Logo.dc.html`.
- Logo: official **SVG** (interim PNG in `assets/`). Animation CSS:
```css
@keyframes aaLogoPop{0%{opacity:.85;transform:scale(.93)}55%{opacity:1;transform:scale(1.02)}100%{opacity:1;transform:scale(1)}}
@keyframes aaShine{0%,14%{transform:translateX(-150%)}58%,100%{transform:translateX(170%)}}
.aa-logo{opacity:1;animation:aaLogoPop 1s cubic-bezier(.2,.7,.2,1) both}   /* never starts at 0 */
@media (prefers-reduced-motion:reduce){.aa-logo,.aa-logo .shn{animation:none}}
```
- Menu source: register a `primary` menu. Training **mega-menu** = a custom `Walker_Nav_Menu` OR an ACF
  `training_tracks` repeater (so marketing edits it). Open on hover **and** click/keyboard; `aria-expanded`,
  Escape to close. Main bar `position:sticky;top:0` + `backdrop-filter:blur(12px)`.

### 1c. Footer part
`#08252B`, 4-column, white logo via `filter:brightness(0) invert(1)`. Static + a menu or ACF options.

### 1d. SEO scaffolding (site-wide)
- Use Yoast/RankMath **or** hand-rolled: per-page `<title>`/description/canonical/OG/Twitter.
- Inject **JSON-LD** per template (see §3). Site-wide `Organization` + `BreadcrumbList`.

---

## 2. Page templates & content models

### Homepage
Static page template (`front-page.php` or a "Homepage" template) assembled from section partials. Mostly
editorial content; expose hero copy, stats, and the cert/assessment lists as ACF (or reuse the CPTs below).

### Training landing (template)
`page-training.php` (or block template). The five tracks + their certs come from a **`course` CPT**
(below) grouped by a `track` taxonomy — so the landing renders all certs automatically and new certs
appear without template edits. AI-Native track is the dark featured section.

### Course = WooCommerce product (recommended) — Leading SAFe + every cert
Model each course as a **WC product**; each **cohort = a variation** (or an ACF `cohorts` repeater on a
single product). Free: cart, Stripe (card + Apple/Google Pay via *Stripe*/*WooPayments*), invoices, order emails.
```
Product "Leading SAFe (SA)"  (price 850)
  ACF "course_meta": badge_image, subtitle, lede, pdus, duration, family(safe|ai_native),
                     exam{format,duration,passing,access,validity}
  ACF repeater "includes"  (6: title, blurb)
  ACF repeater "curriculum"(6: title, blurb)
  ACF repeater "cohorts"   (date, label, status[fast_filling|open], price, seats_left)
  ACF group "path_cards"   (SAFe card + AI-Native card: family, badge, title, meta, price_from, url)
  ACF repeater "faqs"      (question, answer)
```
**Inline checkout:** the on-page form adds the selected cohort to the cart (qty) and redirects to Woo
checkout. Port the prototype logic (vanilla JS):
```
qty (1..20) → total = '$' + (qty*price).toLocaleString('en-US') + '.00'
  → update submit-button label "Complete enrollment · {total} ⟶" AND order-summary "Tuition × {qty}" + "Total"
attendee toggle self|team → show/hide attendee sub-form; swap segmented styles
attendee fields → saved as WC order item meta (woocommerce_after_order_notes / Checkout block fields API)
FAQ → native <details>; "+" rotates 45° to × via details[open] .faq-plus{transform:rotate(45deg)}
```
If WooCommerce is off the table: `course` CPT + a Stripe Checkout Session endpoint (more work).

### Services landing + Service detail (templates)
`service` **CPT** + ACF. Landing lists all services (the 6-row hairline list; AI-Native tinted purple).
Detail template (Digital Transformation is the reference) renders ACF: hero, "engagement at a glance",
problem list, deliverables repeater (6), phases repeater (4), outcomes, related services. Reused for every
service — content differs, layout doesn't.

### Assessments landing + Runner
- Landing: `page-assessments.php` listing an `assessment` CPT (featured Cert Recommender + 5 cards).
- **Runner = a self-contained vanilla-JS widget** (script enqueued only on assessment pages; mount in a
  shortcode/block, or a dedicated template). Port the prototype's logic class:
  - State `{stage:'intro'|'quiz'|'result', idx, answers[]}`.
  - Questions + scale as data (move to a JSON/ACF field so non-devs can edit; 12 Qs across 6 dimensions).
  - Scoring: per-dimension `% = sum/(n*5)*100`; overall = mean; level Forming<40 / Developing<60 /
    Maturing<80 / Leading≥80; recommendation = map of lowest dimension → course.
  - Result bars animate (`barGrow`), `fadeUp` on transitions, reduced-motion respected.
  - Persist progress in `localStorage` so a refresh doesn't lose answers; "Email me my results" posts to a
    REST endpoint / CRM. Each assessment can reuse the engine with a different question set.

---

## 3. JSON-LD per template (rich results + LLM)
- **Course pages:** `Course` + `Offer`(850 USD, availability) + `AggregateRating`(4.9, reviewCount) + `FAQPage` from the FAQ repeater.
- **Service pages:** `Service` + `Provider`(Organization).
- **Assessments:** landing `ItemList`; runner `WebApplication`/`Quiz`.
- **Every page:** `BreadcrumbList`; site-wide `Organization`(logo, sameAs socials).
Generate from the same ACF data that renders the page so they never drift.

## 4. Enqueueing (keep it light)
One small CSS + one small JS, enqueued only where needed:
```php
add_action('wp_enqueue_scripts', function () {
  $dir = get_stylesheet_directory(); $uri = get_stylesheet_directory_uri();
  wp_enqueue_style('aa-fonts','https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,400&display=swap',[],null);
  wp_enqueue_style('aa-base', "$uri/assets/aa.css", [], filemtime("$dir/assets/aa.css"));
  if (is_singular('course')) { /* enqueue aa-checkout.js + localize price/cart url */ }
  if (is_page_template('page-assessments.php') || is_singular('assessment')) { /* enqueue aa-runner.js + question JSON */ }
});
```
No framework, no jQuery. System fonts mean no webfont for body — biggest perf win.

## 5. Accessibility & responsive
- Real `<button>`/`<label>`/`<select>`; `aria-expanded`/`aria-controls` on menu + FAQ + quiz; visible focus
  rings restyled in teal (don't remove outlines); honor `prefers-reduced-motion`.
- Container 1280px / `padding:0 30px` (→ 20px under 600px). Collapse multi-col grids to 1–2 col; cohort rows
  stack; mega-menu → accordion in the mobile drawer; sticky course bar shortens to title+price+Enroll.
- Quiz is keyboard-navigable (number keys 1–5 optional); large hit targets.

## 6. Definition of done
1. All pages match `README.md` (tokens, type, layout, copy) at desktop/tablet/mobile.
2. Courses, cohorts, services, assessments, FAQs are **ACF/CPT-editable** — no hardcoded copy.
3. Course checkout: live total in button + summary; attendee toggle; routes through **WooCommerce + Stripe**
   (card + Apple/Google Pay); attendee meta on the order; confirmation email.
4. Assessment runner: full intro→quiz→result flow, correct scoring + recommendation, localStorage resume,
   reduced-motion safe; engine reusable for all 6 diagnostics.
5. Header mega-menu works hover + click + keyboard; **animated logo never disappears when backgrounded**.
6. SEO: semantic structure, per-page meta/OG, JSON-LD (Course/Service/FAQ/Organization/Breadcrumb).
7. Performance: only Newsreader loads; CSS/JS scoped per template; images optimized; Lighthouse Perf ≥ 90, A11y ≥ 95.
