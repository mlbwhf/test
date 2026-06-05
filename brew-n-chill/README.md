# Brew-n-Chill — Website Package

A complete, research-backed website for **brew-n-chill.com**: a business that **resells
automated coffee kiosk machines as a technology partner (B2B, primary)** while **running its
own coffee brand on those machines (B2C, secondary)**.

Built for WordPress. Everything here is ready to import and go live.

## Start here

1. **`wordpress/implementation-guide.md`** — how to get it live (15–20 min import, or let me publish for you).
2. **`wordpress/brew-n-chill.wordpress.xml`** — the importable site (9 pages). WP Admin → Tools → Import.
3. **`content/index.html`** — open in a browser to read every page before importing.

## What's inside

| File | What it is |
|---|---|
| `research/market-research.md` | The market case, unit economics, verticals, sources |
| `brand/brand-positioning.md` | Positioning, audiences, voice, palette, taglines |
| `seo/keywords-and-meta.md` | Title tags, meta descriptions, schema, blog ideas |
| `content/*.html` | Browser previews of all 9 pages |
| `wordpress/build_wxr.py` | Single source of truth for all copy → regenerates the import file & previews |
| `wordpress/brew-n-chill.wordpress.xml` | WordPress import file (WXR) |
| `wordpress/implementation-guide.md` | Step-by-step launch guide |

## The site (9 pages)

Home · How It Works · The Machines · Industries · Pricing & ROI · Our Coffee · About · FAQ · Contact

## Positioning in one line

> Barista-grade coffee, zero staffing, 24/7 — automated coffee kiosks for offices, gyms, hotels,
> hospitals and campuses, poured with our own specialty beans.

## Regenerate after editing copy

```bash
python3 wordpress/build_wxr.py
```

## Notes / open items

- **Target site** `marks750.sg-host.com` is self-hosted (SiteGround), so direct publishing
  needs a WordPress Application Password — see the implementation guide, "Option B".
- Add real **images**, **prices**, **machine specs**, and **contact details** before launch.
- Point **brew-n-chill.com** at the site and set it primary.
