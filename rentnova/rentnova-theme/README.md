# RentNova Blueprint — WordPress Theme

A homeowner-led theme for **RentNova** built around the *“turn your residence into income”* message. Bold green + terracotta on warm paper, with an animated architectural **section-drawing hero** and the full three-track services model.

---

## What’s included

| Area | Detail |
|---|---|
| **Animated hero** | A self-drawing architectural section (basement suite → main residence → garden suite) with dimensions, leader callouts, north arrow, title block and a looping scan line. Replays when scrolled into view; respects `prefers-reduced-motion`. |
| **Three tracks** | Convert · Manage · Stay — your three revenue streams, on the homepage. |
| **Pipeline** | Six-step band: Feasibility → Design → Build → Furnish → List → Manage. |
| **Revenue share** | “You own the asset. We run the income. We split the upside.” |
| **Stays CPT** | A **Stays** custom post type with per-listing fields (location, price/night, bedrooms, sleeps, min nights, booking URL). Manage listings from wp-admin. |
| **Reusable hero** | `[rentnova_blueprint]` shortcode **and** a `rentnova/blueprint` block — drop the animated drawing on any page or post. |
| **Templates** | `front-page`, `archive-stay`, `single-stay`, `page-owners`, `page-about`, `page-contact`, `page`, `index`, plus `header` / `footer`. |
| **Block patterns** | A **RentNova** category in the inserter with the hero / tracks / pipeline / feature-grid / narrative / values / contact-grid / revenue-share / CTA sections. Marketing pages are composed in the editor — no template editing required. |
| **Responsive** | Mobile nav, stacked grids, reflowed pipeline. |

---

## Install

### Option A — upload the zip
1. Zip the **`rentnova-theme`** folder so the archive contains `rentnova-theme/style.css` at its root.
2. WordPress admin → **Appearance → Themes → Add New → Upload Theme** → choose the zip → **Install** → **Activate**.

### Option B — manual
1. Copy the **`rentnova-theme`** folder into `wp-content/themes/`.
2. Admin → **Appearance → Themes** → activate **RentNova Blueprint**.

---

## Set up after activating

1. **Homepage** — Settings → Reading → *Your homepage displays* → **A static page**, or just leave it on the default; `front-page.php` renders the blueprint homepage automatically. (A fresh install shows two demo stays using the real RentNova photos until you add your own.)
2. **Menu** — Appearance → Menus → create a menu, assign it to **Primary Menu**. (Without one, a sensible fallback menu shows.) The terracotta **“Free feasibility →”** button is appended automatically and links to `/contact/`.
3. **Logo** — Appearance → Customize → Site Identity → add a custom logo (optional; the wordmark shows otherwise).
4. **Add stays** — **Stays → Add Stay**. Set the featured image, write the description, and fill the *Listing Details* box (location, price, bedrooms, sleeps, min nights, booking URL). The homepage shows the two most recent; `/stays/` lists them all.
5. **Marketing pages (Owners / About / Contact)** — Pages → Add New, give each one the slug `owners` / `about` / `contact`. The matching template auto-activates; or assign it manually via Page Attributes → Template. The templates are deliberately thin (`the_content()` only) so the layout is composed from the **RentNova** patterns in the block editor.

### Suggested pattern assembly per page

In the editor, open the inserter → **Patterns** → **RentNova** and drop these in order:

| Page | Patterns |
|---|---|
| **Owners** (`/owners/`) | Owners hero · Three tracks · Six-step pipeline · What's-included feature grid · Revenue-share card · Closing CTA |
| **About** (`/about/`) | About hero · Narrative + side facts · Three values · Revenue-share card · Closing CTA |
| **Contact** (`/contact/`) | Contact hero · Contact info + form · Closing CTA |

Every pattern uses native core blocks (group / heading / paragraph) where possible, and a single HTML block for sections where the design needs precise grid markup (tracks, pipeline, feature grid, contact form). All copy is editable in-place in the editor.

---

## Reusing the blueprint drawing
- **Block editor:** add the **RentNova Blueprint** block.
- **Classic / shortcode:** `[rentnova_blueprint]`
- **In a template:** `<?php get_template_part( 'template-parts/blueprint', 'figure' ); ?>`

---

## Customizing colours
All tokens live at the top of `style.css` under `:root` — `--rn-ink` (dark green), `--rn-terra` (terracotta), `--rn-sand`, `--rn-paper`, etc. Change them once and the whole theme follows.

---

## Notes
- Demo stay images are hot-linked from `rent-nova.com`. Once you add real Stay posts with featured images, the demos disappear — or download those two images into your Media Library and set them as featured images.
- Fonts (Archivo, Hanken Grotesk, IBM Plex Mono) load from Google Fonts. To self-host for privacy/performance, drop the files in `assets/fonts/` and adjust the `wp_enqueue_style( 'rentnova-fonts', … )` call in `functions.php`.
- Built against WordPress 6.x / PHP 7.4+.
