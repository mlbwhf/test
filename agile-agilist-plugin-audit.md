# agile-agilist.com — Plugin Audit (67 installed, 63 active)
_From live `plugin.list` (2026-06). Goal: cut bloat/security/conflict risk. **Rule: back up first, remove a few at a time, never bulk-delete on a live commercial site. Verify the ⚠️ ones aren't powering a live page before removing.**_

## 🔴 Remove now — inactive or clearly redundant (low risk)
| Plugin | Why |
|---|---|
| **Header Footer Code Manager** (inactive) | WPCode already does header/footer code |
| **Pixel Manager for WooCommerce** (inactive) | dead; tied to Woo |
| **Temporary Login Without Password** (inactive) | security — don't leave login-bypass tools installed |
| **WooCommerce PayPal Payments** (inactive) | dead (and Woo likely going — see below) |

## 🟠 Big wins — VERIFY not in use, then remove (heaviest bloat)
### WooCommerce stack — *is the store actually used?*
Registration is **Fluent Forms + Stripe**, not WooCommerce. If nothing sells via Woo, this whole stack is dead weight (WooCommerce is one of the heaviest plugins there is):
- WooCommerce · WooPayments · Google for WooCommerce · Pinterest for WooCommerce · TikTok (for Woo) · Pixel Manager (inactive) · PayPal Payments (inactive)
→ **Check for any live product/cart/checkout. If none → remove the whole cluster. Single biggest performance + security win.**

### The Events Calendar suite — *is it powering any page?*
You run events via **WP Event Aggregator → `wp_events`** + Easy Events Calendar + the custom schedule. The Events Calendar is a *separate* system:
- The Events Calendar · The Events Calendar Pro (very heavy) · Event Tickets
→ **If no live `/events/` pages use TEC, remove all three.** Big win.

### Form builders — two full suites
- Keep **Fluent Forms (+ Pro + Block)** — your registration runs on it.
- **Formidable Forms + Formidable Forms Pro** → remove if no live Formidable form exists.

### Gutenberg (dev plugin v23.2.2) — remove
Running the **experimental** Gutenberg feature plugin on a production site is risky (bleeding-edge, breaks things). Core WP editor is enough. **Deactivate/remove.**

## 🟡 Consolidate — too many doing the same job
### Eventbrite plugins (you have 5 + 2 aggregators)
Blocks for Eventbrite · Display Eventbrite Events · Event Feed for Eventbrite · WP Eventbrite Embedded Checkout · Import Eventbrite Events · WP Event Aggregator (+Pro)
→ Keep only what feeds your schedule (**WP Event Aggregator Pro** → `wp_events`, + Import Eventbrite Events if you still import). **Remove the 4 display/embedded-checkout ones** (you've moved to native Stripe).

### Block libraries (≈8 — each adds CSS/JS to every page)
Essential Blocks · Spectra/UAGB · Nexter Blocks (+Pro) · Gutena Kit · Gutena Accordion · Carousel Slider Block · WDesignKit
→ **Pick ONE primary** (Spectra is the most maintained; your course pages use EssentialBlocks + Spectra). Migrate pages off the others, then remove. ⚠️ Removing a block library breaks pages built with it — check each before removing.

### Analytics / tag layers (overlapping, can double-count)
MonsterInsights (GA) · Site Kit (GA+Search Console) · GTM4WP (tag manager) · PixelYourSite (pixels) · Microsoft Clarity
→ Standardize on **GTM4WP** as the single tag layer (fire GA4 + Meta + ads through it). Keep **Site Kit** for Search Console, **Clarity** for heatmaps. **Remove MonsterInsights + PixelYourSite** once their tags are moved into GTM. ⚠️ Don't lose conversion tracking — migrate, then remove.

## 🟢 Minor cleanups
- **WebP Conversion** — SiteGround Speed Optimizer already does WebP; remove to avoid double-processing.
- **MailPoet** — if email runs through HubSpot, MailPoet may be redundant.
- **Carousel Slider Block** — remove if unused.
- **Wheel of Life (+Pro) · Sensei Post to Course · Search & Filter · Zapier · XT Feed for LinkedIn** — keep only if actively used; otherwise candidates.

## ✅ Keep (core stack)
All in One SEO · Jetpack · WPCode Lite · Fluent Forms (+Pro/Block) · WP Event Aggregator Pro · Easy Events Calendar · Redirection · IndexNow + Bing · Site Kit · GTM4WP · Microsoft Clarity · HubSpot (leadin) · SiteGround Speed/Security/Central/AI Agent · AI Provider for Anthropic · Custom Post Type UI · Favicon · Health Check · WordPress Importer · Xylus Toolkit · **Polylang (new)** · one chosen block library.

## Suggested order
1. **🔴 the 4 inactive** — zero risk, do first.
2. **Gutenberg dev plugin** — deactivate, confirm editor still fine.
3. **Verify + remove WooCommerce stack** (biggest win) and **The Events Calendar suite**.
4. **Eventbrite pile → keep 1.**
5. **Formidable → remove if unused.**
6. **Block-library + analytics consolidation** (slowest, most care).

> Potential result: from 67 → ~35–40 plugins, with the two heaviest suites (WooCommerce, Events Calendar Pro) likely gone — major speed + security + maintenance win. I can run the **uninstall previews** (they show what data each removal touches) so you decide safely, one at a time.
