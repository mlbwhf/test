# Report AI (report-ai.org) — Migration & Backup Notes

**Purpose:** safety net for migrating report-ai.org from **WordPress.com (SiteGround-fronted)**
to **Hostinger**. If something breaks on the new host, use this doc + the `report-ai/backup/`
files in this repo to diagnose and rebuild. Written 2026-07 during the migration prep.

---

## 0. Site facts

| Fact | Value |
|---|---|
| Domain | report-ai.org |
| Current host | WordPress.com (site ID `255349241`), SiteGround page cache in front |
| Target host | Hostinger |
| Theme | GeneratePress (free) + WPCode snippets |
| Front page | Static page **ID 6** ("Home") — self-contained custom HTML (inline `<style>` + `wp:html` blocks) |
| Primary menu | Menu ID `34`, assigned to theme location "Primary" |

## 1. A migration needs THREE separate backups (they live in different places)

1. **Content** — pages, posts, categories, tags, menus, media.
   Export via **Tools → Export** (or on WordPress.com: **Settings → Export**) → produces a WXR
   `.xml` file. Media images come as a separate download / are referenced by URL — confirm they
   transfer (Hostinger's importer can side-load them, but verify).
2. **WPCode snippets** — **NOT in the WXR.** Export separately: WPCode → Code Snippets → Tools →
   Export. The active snippets to preserve:
   - **"Report AI — AI News Aggregator (cron)"** — PHP; auto-publishes News posts on WP-Cron.
   - **"Display a message after the 1st paragraph of posts"** — PHP.
   - **Brand CSS snippet** (the global stylesheet) — CSS. Its source is in this repo at
     `the-ai-index-global.css` (delivered earlier). If the CSS instead lives in
     **Appearance → Customize → Additional CSS**, it's a theme mod and also NOT in the WXR —
     copy it out manually.
3. **Customizer / theme settings** — GeneratePress settings, menu-location assignment, static
   front-page setting, widget areas. These are theme mods; re-set them on the new host (checklist below).

## 2. What is backed up IN THIS REPO (`report-ai/backup/`)

- `pages-inventory.json` — every page (id, slug, title, status, parent, link, modified).
- `posts-inventory.json` — every post (id, slug, title, status, categories, link, modified).
- `categories.json` — all categories with ids/slugs/descriptions.
- `menu-34.json` — the Primary menu structure (items, parents, order, targets).
- `page-6-home.html` + `page-<id>-<slug>.html` for the 6 reports (861–866) — full raw content,
  so the custom/hand-built pages can be re-pasted if the WXR import mangles them.
- Plus already in repo: `the-ai-index-global.css` (brand CSS), `publishing-operations-runbook.md`
  (ongoing ops), `redirects-301-map.md` (existing redirect map), `llms.txt`.

This repo backup is a **supplement** to the WXR export, focused on the custom-built pieces most
likely to break in migration. It is **not** a full-site backup (no media binaries, no DB, no plugins).

## 3. Post-migration verification checklist (do these on Hostinger before DNS cutover)

- [ ] **Permalinks match exactly.** Set Settings → Permalinks so URLs stay
  `/reports/%postname%/`, `/indexes/...`, `/glossary/...`, `/category/...`. Mismatch = mass 404s + lost SEO.
- [ ] **Static front page.** Settings → Reading → front page = the "Home" page (was ID 6; the new
  host may assign a new ID — pick the Home page by title). Confirm the self-contained hero/stat
  layout renders (it depends on `wp:html` blocks being allowed — GeneratePress + block editor is fine).
- [ ] **Scheduled reports survived.** These were `future`-status pages with publish dates — verify
  they still show as Scheduled with the right dates, or they won't auto-publish:
  - 863 AI in Healthcare → 2026-07-13 09:00
  - 861 Open vs Closed AI Models → 2026-07-20 09:00
  - 865 AI in Education → 2026-07-27 09:00
  - 864 Global AI Regulation Tracker → 2026-08-03 09:00
  - 866 AI Deepfakes & Fraud → 2026-08-10 09:00
  - (862 Agentic AI is already published.) **WP-Cron must be working** on Hostinger for scheduled
    posts to fire — Hostinger uses real cron; confirm, or scheduled posts publish late ("missed schedule").
- [ ] **Menu assigned to Primary location.** Appearance → Menus → tick the Primary location for the
  imported menu. If skipped, GeneratePress falls back to auto-listing every page (the giant-dropdown
  bug we fixed). Confirm Glossary has NO dropdown and Reports shows only its 3 children.
- [ ] **WPCode snippets active.** Re-import and activate the 3 snippets. Confirm the News Aggregator
  cron runs on the new host (check a new News post appears) and the brand CSS loads (cobalt nav).
- [ ] **Categories intact** — 20 categories, Uncategorized empty. Cross-check against `categories.json`.
- [ ] **Media loads** — spot-check images aren't hotlinking back to the old wordpress.com URLs.
- [ ] **Redirects** — re-apply `redirects-301-map.md` on the new host (via Hostinger/LiteSpeed or a
  redirects plugin).
- [ ] **SSL** — issue/verify the Hostinger SSL cert for report-ai.org before cutover.
- [ ] **Caching** — SiteGround cache won't exist on Hostinger; Hostinger uses LiteSpeed Cache.
  Purge it after import. (When a change "doesn't show," it's cache — purge before re-editing.)
- [ ] **sitemap.xml / robots.txt / llms.txt** — regenerate/verify; resubmit sitemap in Search Console.

## 4. Safe cutover & rollback

- **Keep the WordPress.com site live** until the Hostinger copy is fully verified. Do not cancel it first.
- **Lower DNS TTL** (e.g. to 300s) a day before cutover so you can revert quickly.
- **Cutover** = repoint the domain's A/CNAME (or nameservers) to Hostinger only after the checklist
  passes on a staging URL / hosts-file preview.
- **Rollback** = point DNS back to WordPress.com (still live). No data lost.
- **Email/MX:** if report-ai.org has mail service, migrating nameservers can break MX — copy the
  current DNS records first and re-create MX/SPF/DKIM on the new DNS.

## 5. Recommended migration method

WordPress.com's hosted environment limits plugins on lower plans, so the cleanest path is usually:
**WordPress.com Export (WXR) → Hostinger's WordPress importer** (Tools → Import → WordPress), then
side-load media. If the plan allows plugins, **All-in-One WP Migration** or Hostinger's automated
migration service can move everything (incl. theme mods) in one shot — preferred if available,
because it preserves the Customizer settings and menu-location assignments the WXR route loses.
