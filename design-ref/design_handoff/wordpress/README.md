# WordPress Header Component — Agile Agilist

A drop-in, dependency-free site header: **mono masthead + sticky main bar + animated logo +
Training mega-menu + mobile drawer**. Built to the brand system in `../README.md`.

## Why a mega-menu, not a dropdown
Training has **19 certifications** — a vertical dropdown would be a wall of links. This component keeps
most nav items as **direct links** and gives **Training** a full-width **editorial mega-panel** (the same
hairline grid as the site): the four SAFe tracks in a 2×2 with cert counts, and the **AI-Native flagship**
on its own navy/purple row. It opens on **hover, click, and keyboard**, and collapses to an **accordion in
a slide-in drawer** on mobile. Marketing can edit it without touching layout.

## Files
```
wordpress/
├─ parts/aa-header.php     ← the markup (include in header.php)
├─ assets/aa-nav.css       ← styles (tokens + mega-menu + drawer)
├─ assets/aa-nav.js        ← hover/click/keyboard + mobile drawer (vanilla JS)
├─ assets/logo-agile-agilist.png  ← interim logo (replace with official SVG)
└─ aa-enqueue.php          ← enqueues fonts + css + js; registers 'primary' menu
```

## Install (classic theme)
1. Copy `parts/` and `assets/` into your child theme; copy `aa-enqueue.php` content into `functions.php`
   (or `require` it).
2. In `header.php`, where the nav should render:
   ```php
   <?php get_template_part('parts/aa-header'); ?>
   ```
3. Replace `assets/logo-agile-agilist.png` with the **official SVG** (update the `<img>` in `aa-header.php`
   and the two `mask` URLs in `aa-nav.css`). Keep `width`/`height` to avoid layout shift.

## Make the mega-menu editable
`aa-header.php` ships the tracks as a PHP array (`$aa_track_groups` + `$aa_ai_track`). For marketing
control, swap it for an **ACF Options repeater** — `get_field('training_tracks','option')` — or drive the
top-level links from **Appearance → Menus** (the `primary` menu is registered) with a custom `Walker` that
injects `<div class="aa-mega">` for items that have children. Keep the same class names so the CSS/JS apply.

## Accessibility & performance
- `aria-haspopup`/`aria-expanded` on the Training link; `Escape` closes and restores focus; focus-out closes.
- Burger toggles `aria-expanded` + `aria-label`; drawer locks body scroll; `Escape` closes.
- `prefers-reduced-motion` disables the logo animation, shine, and panel transitions.
- **Only Newsreader** loads over the network; everything else uses the system font stack. No framework, no
  jQuery — `aa-nav.js` is ~3 KB.
- **Logo animation never starts at `opacity:0`** (rests at .85→1 scale) so it can't disappear when a tab is
  backgrounded.

## Block theme / builder
- **Block theme:** put the markup in `parts/header.html` as a pattern; move tokens into `theme.json`; enqueue
  the same CSS/JS.
- **Builder (Elementor/etc.):** paste the markup into an HTML widget in the global header, load the CSS/JS via
  the theme, and edit the tracks array (or bind to ACF).
