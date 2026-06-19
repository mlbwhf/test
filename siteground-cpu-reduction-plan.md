# SiteGround CPU-seconds — reduction plan (agile-agilist.com)
_Warning: plan hit 80% of monthly CPU seconds; at 100% the site is throttled. Root cause is almost certainly the heavy runtime (67 plugins, 110–120 KB pages) + uncached/bot traffic. Fix the waste before paying for a bigger plan._

## Step 0 — find the culprit (5 min)
1. SiteGround → **Statistics → CPU usage** (link in the email). See **which site** and **which script** dominates:
   - `wp-cron.php` → cron overload (Step 2)
   - `admin-ajax.php` → Heartbeat / form / popup plugins (Steps 2 & 3)
   - `index.php` high → uncached front-end / bots (Steps 1 & 4)
2. Note the spikes' timing (steady = plugins/cron; spikes = bots/crawlers).

## Step 1 — Caching (biggest single lever; do first)
- SG **Speed Optimizer → Caching → enable Dynamic Caching + Memcached**.
- Cached page views **don't run PHP or plugins** → huge CPU drop.
- Make sure logged-out pages are cached (the registration page `[aa_cohorts]` is fine to cache; Fluent Forms uses AJAX so it still works behind cache).
- Exclude only what must be dynamic (cart/checkout if any).

## Step 2 — Cron + Heartbeat (steady CPU drain)
- **Disable WP-Cron on page loads** and use a real server cron:
  - `wp-config.php`: `define('DISABLE_WP_CRON', true);`
  - SiteGround → **Cron Jobs** → run `wp cron event run --due-now` (or wget wp-cron.php) every **15 min**.
- **Limit WP Heartbeat** (SG Optimizer has this, or "Heartbeat Control"): set to 60s or disable on front end. With MailPoet, Woo, OptinMonster, NotificationX all polling, Heartbeat is a major admin-ajax CPU source.

## Step 3 — Cut plugins (structural fix — see agile-agilist-plugin-audit.md)
Fewer active plugins = less PHP per request + fewer cron jobs. Verify-then-deactivate:
- **WooCommerce stack** (Woo + WooPayments + Google/Pinterest/TikTok-for-Woo) — if no store. **Huge** CPU + cron load.
- **The Events Calendar + Pro + Event Tickets** — if no TEC `/events/` page (you use WP Event Aggregator).
- **Formidable Forms + Pro** — redundant with Fluent Forms.
- **4 redundant Eventbrite plugins**, **extra block libraries** (keep one), **Gutenberg dev plugin**, **redundant analytics** (MonsterInsights/PixelYourSite if GTM covers them).
- **MailPoet / OptinMonster / NotificationX** — heavy if not essential; each adds cron + admin-ajax.

## Step 4 — Block bot/abuse traffic (common shared-host CPU spike)
- SG **Security Optimizer**: limit login attempts, **disable XML-RPC**, block bad bots.
- Consider blocking aggressive crawlers/AI scrapers hammering uncached URLs (`?s=` search, faceted/filter URLs). Search queries bypass cache and are CPU-expensive.
- If Search & Filter plugin powers uncached query pages, that's a known CPU sink — review.

## Step 5 — PHP version + page weight
- SiteGround → **PHP Manager → latest stable (8.2/8.3)** — faster, less CPU per request.
- **Lighten pages (P2/P3 runbook)** — 120 KB → ~70 KB renders cheaper on every uncached hit.

## Step 6 — Only then, upgrade the plan
- If after the above you still need more, upgrade (GoGeek / Cloud). But don't pay to host waste — Steps 1–4 usually resolve the warning.

## Quick-win order (most CPU saved, least risk)
1. **Dynamic Cache + Memcached ON** (Step 1).
2. **Disable WP-Cron → server cron + limit Heartbeat** (Step 2).
3. **Latest PHP** (Step 5).
4. **Deactivate the clearly-unused heavy plugins** (Step 3 — WooCommerce/TEC suite first, after confirming unused).
5. **SG Security: XML-RPC off, block bad bots** (Step 4).

> Note: the draft pages and MCP edits we've done do **not** drive front-end CPU — this is the live runtime/plugins/bots. The plugin audit is now urgent, not just nice-to-have.
