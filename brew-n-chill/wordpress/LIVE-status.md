# Brew-n-Chill — LIVE status

**Published live on 2026-06-08** to the Jetpack-connected SiteGround site
`marks750.sg-host.com` (blog_id `255395488`).

## Done (via WordPress MCP)
- ✅ 9 pages created and **published** (Gutenberg blocks, SEO title + meta description on each).
- ✅ Site title set to **Brew-n-Chill**; tagline set.
- ✅ Static homepage set to **Home** (page id 6).
- ✅ **Homepage redesigned** (2026-06-08) with a full-width hero cover, brand-colored
  section bands (cream / espresso / roast), media-text rows, a 6-card industries image grid,
  and a CTA banner. Uses 8 **placeholder images** (picsum.photos seeds) the owner will replace
  — each has descriptive alt text ("…replace with your photo"). Brand colors used:
  Espresso `#2B1D13`, Roast `#7A4A25`, Cream `#F6EFE6`, Chill teal `#2FA89B`.
- ✅ **All 8 interior pages restyled** to the same template (hero banner + colored bands +
  image placeholders + CTA): How It Works, The Machines (3 product images), Industries
  (6-card grid), Pricing & ROI (colored pricing columns), Our Coffee (3 blend cards), About
  (media-text), FAQ, Contact (2-column with contact card). ~25 placeholder images total, all
  with "…replace with your photo" alt text.

| Page | ID | URL |
|---|---|---|
| Home | 6 | https://marks750.sg-host.com/home/ |
| How It Works | 7 | https://marks750.sg-host.com/how-it-works/ |
| The Machines | 8 | https://marks750.sg-host.com/machines/ |
| Industries We Serve | 9 | https://marks750.sg-host.com/industries/ |
| Pricing & ROI | 10 | https://marks750.sg-host.com/pricing-roi/ |
| Our Coffee | 11 | https://marks750.sg-host.com/our-coffee/ |
| About | 12 | https://marks750.sg-host.com/about/ |
| FAQ | 13 | https://marks750.sg-host.com/faq/ |
| Contact / Book a Demo | 14 | https://marks750.sg-host.com/contact/ |

## Remaining manual steps (not possible via the MCP)
1. **Navigation menu** — the MCP has no menu operation, and Hello Biz uses a classic menu.
   In wp-admin → **Appearance → Menus**, create a menu and add the pages in this order,
   then assign it to the theme's primary/header location:
   ```
   Home · How It Works · The Machines · Industries · Pricing & ROI · Our Coffee · About · Contact
   ```
   (Tip: with Hello Biz/Elementor you may set the header menu in the Elementor header template.)
2. **Trash the default "Sample Page"** (id 2) — leftover from setup. (I can do this for you.)
3. **Images, real prices, machine specs, contact details** — see implementation-guide.md.
4. **Point brew-n-chill.com** at the site and set it primary when ready.
