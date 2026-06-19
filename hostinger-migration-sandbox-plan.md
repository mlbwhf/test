# Hostinger migration → sandbox → (maybe) cutover — plan
_Goal: copy agile-agilist.com to Hostinger as a **safe sandbox**, trim plugins + test what breaks, compare performance, and only redirect traffic if it's genuinely better. Live SiteGround site stays untouched until proven._

## ⚠️ Reality check first
- **A new host alone does NOT fix the CPU/bloat** — the 67 plugins still run. The win is using the sandbox to **safely remove the bloat** (which you can't risk on the live site). Hostinger's **LiteSpeed + LSCache** also helps a lot. So: migrate **and** trim — not just migrate.
- Hostinger shared plans **also meter resources** (entry processes / I/O / CPU). Check the plan's limits; if you stay bloated you'll hit the same wall. Cloud/higher tiers have more headroom.

## Phase 1 — Copy to a SAFE sandbox (don't touch DNS)
1. Migrate to a **temporary URL** (Hostinger temp domain or a `staging.` subdomain) — **not** the live domain, and **don't repoint DNS yet**.
2. Tools: Hostinger's **automated migration**, or **Duplicator / All-in-One WP Migration**.
3. **Lock the sandbox down immediately:**
   - **Password-protect** the staging site (Hostinger has this) — so it's private.
   - **Settings → Reading → Discourage search engines** (noindex) — never let staging get indexed (duplicate-content + URL leaks).
   - **Stripe → TEST mode** on the sandbox (never process real cards from staging).
   - **Pause real outbound:** don't let staging send real registration emails or push duplicate **HubSpot** leads (use Fluent Forms test entries; disable the live HubSpot/Zapier feed on the copy).

## Phase 2 — Make it Hostinger-native
- **Remove SiteGround-only plugins** on the copy (they do nothing/err on Hostinger): **Speed Optimizer (sg-cachepress), Security Optimizer (sg-security), SiteGround Central, AI Agent by SiteGround**.
- Install **LiteSpeed Cache** and enable full-page + object cache (LiteSpeed's equivalent of SG's Dynamic Cache + Memcached).
- **PHP 8.2/8.3**, set up real cron, disable WP-Cron (same as the CPU plan).

## Phase 3 — Trim plugins + test what breaks (the whole point)
Work the **plugin audit** list. After each removal, retest the **critical paths**:
- **Registration (most important):** the **WPCode snippet 26810** is active → `[aa_cohorts]` schedule renders → click a cohort → form expands → **Fluent Forms + Stripe (TEST mode)** completes → confirmation email + entry recorded.
- **Events source:** WP Event Aggregator → `wp_events` still feeding the schedule.
- Homepage, training pages, Services, menus, forms, tracking tags.

Prime removal candidates to test (from the audit):
- **WooCommerce stack** (Woo + WooPayments + Google/Pinterest/TikTok-for-Woo) — if no store. Biggest CPU win.
- **The Events Calendar + Pro + Event Tickets** — if no `/events/` page.
- **Formidable Forms (+Pro)** — if Fluent is the only form builder used.
- **4 redundant Eventbrite plugins**, **extra block libraries** (keep 1), **Gutenberg dev plugin**, **redundant analytics** (keep GTM + Clarity).
> On staging you can just deactivate and click around — if nothing breaks, it's safe to remove live too.

## Phase 4 — Measure (decide on real data)
- Compare **TTFB + full load** (GTmetrix / PageSpeed) sandbox vs live, on the **same pages**, logged-out, cache warm.
- Watch Hostinger's **resource usage** with the trimmed plugin set.
- Decide: cut over only if it's clearly faster **and** stable through the registration test.

## Phase 5 — Cutover (only if better) — careful checklist
1. **Lower DNS TTL** to 300s a day before.
2. Make the sandbox the **real domain** on Hostinger (add domain, issue **SSL** first — must be ready before traffic).
3. **Point DNS** (A record / nameservers) to Hostinger. Keep **SiteGround live** as fallback until verified.
4. **Reconnect integrations on the new host:**
   - **Stripe:** switch back to **LIVE**, re-verify the connection + **webhooks** (Fluent Forms ↔ Stripe). Do one real $1 test → refund.
   - **HubSpot / Zapier** feed re-enabled.
   - **Jetpack:** reconnect (this also affects the WordPress.com MCP we use — site ID may change; I'll re-link).
   - **Email/SMTP** deliverability (registration tickets) — set SPF/DKIM for the domain on Hostinger.
   - **GTM / GA4 / pixels / Search Console:** domain is unchanged so they continue, but **verify they fire** + confirm GSC still resolves.
5. **Remove `noindex`** + remove the staging password on the live copy.
6. **301s / slugs:** domain and slugs unchanged → no redirects needed (don't introduce any). Keep Polylang's "hide /en/" setting if Polylang is on.
7. Monitor 48h; keep SiteGround payment active a few weeks as rollback.

## Watch-outs specific to your site
- **Registration is the revenue path** — it must pass the Stripe TEST → LIVE check on the new host before and after cutover.
- **Don't double-bill or double-email** from staging (Stripe test mode + HubSpot feed off).
- **Polylang:** if active, the `/en/` URL setting + language assignments must be correct on the new host too.
- **Jetpack/MCP reconnect** after cutover so I can keep helping via the connection.
- **Trim, don't just move** — otherwise you hit the same resource wall on Hostinger.
