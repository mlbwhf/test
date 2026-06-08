# Brew-n-Chill — WordPress Implementation Guide

This is the step-by-step to take the generated content live on your WordPress site
(`https://marks750.sg-host.com/`, later `brew-n-chill.com`). The content is delivered as a
standard **WordPress import file (WXR)** so it drops straight into the block editor.

> **Why an import file rather than direct publishing?** The target is a self-hosted
> (SiteGround) WordPress site, not a WordPress.com site, so the WordPress.com tooling can't
> write to it directly. If you'd rather I publish the pages straight in, see
> **"Option B: let me publish for you"** at the bottom — you just need to create an
> Application Password.

---

## What's in this delivery

```
brew-n-chill/
├── research/market-research.md        # the market case + sources
├── brand/brand-positioning.md         # positioning, voice, palette, taglines
├── seo/keywords-and-meta.md           # title tags, metas, schema, blog ideas
├── content/*.html                     # readable preview of every page (open in a browser)
├── wordpress/
│   ├── build_wxr.py                   # single source of truth for all page copy
│   ├── brew-n-chill.wordpress.xml     # <-- IMPORT THIS into WordPress
│   └── implementation-guide.md        # this file
```

9 pages: **Home, How It Works, The Machines, Industries, Pricing & ROI, Our Coffee, About, FAQ, Contact.**

---

## Option A: import it yourself (15–20 min)

### 1. Theme — keep the current one (Hello Biz)
We're staying on the site's current theme, **Hello Biz** (Elementor's lightweight starter). The
published page content renders through it as-is. Hello Biz is intentionally minimal and is styled
through **Elementor**, not theme.json, so set the brand look there:
- **Elementor → Site Settings → Global Colors:** replace the default orange accent with the
  coffee-brown / chill-teal palette in `brand/brand-positioning.md` (Roast `#7A4A25`, Espresso
  `#3A2A1E`, Cream `#F6EFE6`, Chill teal `#2FA89B`).
- **Elementor → Site Settings → Global Fonts:** set a friendly sans for body and a display face for headings.
- **Templates → Theme Builder:** the **Header** (logo + navigation menu) and **Footer** are built
  here in Hello Biz. This is also where the nav menu lives.
- Content width is 800px (wide 1200px) — matches the layout the pages were written for.

### 2. Import the pages
1. WordPress Admin → **Tools → Import → WordPress** (install the "WordPress" importer if prompted).
2. Upload `wordpress/brew-n-chill.wordpress.xml`.
3. Assign the author to your user; **do not** tick "download and import file attachments" (there are no images in the file yet).
4. Run the import. You'll get 9 published pages.

### 3. Set the homepage
**Settings → Reading → Your homepage displays → A static page → Homepage:** select
*"Brew-n-Chill — Automated Coffee Kiosks for Your Space."*

### 4. Build the menu
**Appearance → Menus** (or the block editor's Navigation block). Suggested structure:

```
Home
Coffee Kiosks ▾
   How It Works
   The Machines
   Industries
Pricing & ROI
Our Coffee
About
Contact            (style as a button: "Book a Demo")
```

### 5. Install essential plugins
- **SEO:** Yoast SEO or Rank Math → paste the titles/metas from `seo/keywords-and-meta.md`; enable FAQ schema on the FAQ page.
- **Forms:** WPForms Lite / Forms by Jetpack → build the contact form (fields listed on the Contact page) and drop it in.
- **Performance/security** are already strong on SiteGround; add caching (SiteGround Optimizer) if not enabled.

### 6. Add images
The copy is image-ready but ships text-only (so the import never breaks). Add:
- A hero shot on Home (a kiosk in a bright office/lobby, or the robotic arm).
- One image per Industries section and per machine on The Machines.
- Brand the cups/menu with the palette. See `brand/brand-positioning.md` for direction.

### 7. Final polish
- Update **Contact** with real phone, email and service area.
- Replace indicative prices on **Pricing & ROI** with your actual quotes if you want them public.
- Add real machine names/specs on **The Machines** once your supplier line-up is set.
- Point **brew-n-chill.com** at the site and set it as the primary domain.

---

## Editing the content later

All copy lives in `wordpress/build_wxr.py` (the `PAGES` definitions). To change wording in
bulk and regenerate both the import file and the HTML previews:

```bash
python3 wordpress/build_wxr.py
```

Re-importing will create duplicate pages, so for small edits after the first import, just
edit in the WordPress block editor. Use `build_wxr.py` as the canonical copy deck / for a
clean re-import on a fresh site.

---

## Option B: let me publish for you

If you'd like me to push these pages straight into `marks750.sg-host.com` (no manual import),
create a WordPress **Application Password** and share it with me:

1. WP Admin → **Users → Profile → Application Passwords**.
2. Name it `claude-brew-n-chill`, click **Add New Application Password**, copy the value.
3. Give me the **site URL, your username, and that application password**.

I'll then create/update the pages via the WordPress REST API, set the homepage and menu, and
report back. (Revoke the application password whenever you want to cut access.)

> Heads-up: sharing an application password grants write access to the site's content. Only do
> this if you're comfortable with that; Option A keeps everything in your hands.
