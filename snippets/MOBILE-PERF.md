# Mobile performance plan (from the PageSpeed/diagnostics report)

Two buckets: **(A) fixed in the page files** (done, offline, in this repo) and **(B) host/plugin settings** you apply on the new Hostinger site. B is where the 0-score items live — they cannot be fixed in page HTML.

---

## A. Fixed in the page files (done — deploys with the rest)
- **Explicit image dimensions (CLS):** added `width`/`height` to the Services-landing logos and the About/BA/IC avatars → stops layout shift. *(Report: "Image elements do not have explicit width and height".)*
- **Lazy + async images:** added `loading="lazy"` + `decoding="async"` to below-the-fold images → defers off-screen image work on mobile.
- **Forced reflow:** the nav JS now measures the header inside `requestAnimationFrame` and only writes when the value changes, instead of reading `getBoundingClientRect()` on every scroll event. *(Report: "Forced reflow".)*
- Our page CSS/JS is already **inline per page** (no extra render-blocking request) and the hero animations already respect `prefers-reduced-motion`.

---

## B. Host / plugin settings (apply on Hostinger — biggest wins)
Hostinger runs **LiteSpeed** servers, so install **LiteSpeed Cache** (free) and configure it. This single plugin addresses almost every 0/50 item.

### 1. Caching — *"Use efficient cache lifetimes", "Document request latency", TTI*
- LiteSpeed Cache → **Cache: ON** (page cache) + **Browser Cache: ON** (sets long `Cache-Control` on static assets).
- Enable **Object Cache** if Redis/Memcached is available in hPanel.
- Turn on **QUIC.cloud CDN** (or Cloudflare via hPanel) → edge caching + lower latency + fewer redirects.

### 2. CSS — *"Reduce unused CSS", "Render-blocking requests", "Minify CSS"*
- Page Optimization → CSS: **Minify ON**, **Combine ON** (test), **Generate UCSS ON** (drops unused CSS), **Load CSS Asynchronously ON** + **Generate Critical CSS ON** (moves CSS off the critical path → faster LCP).

### 3. JavaScript — *"Reduce unused JavaScript", "Minify JavaScript", TTI, Max FID, "Render-blocking"*
- Page Optimization → JS: **Minify ON**, **Defer ON** (or **Delay** for non-critical), and **Delay/Defer third-party** (HubSpot meetings embed, Jetpack, chat, analytics) — these are the main TTI/FID offenders, not our code.
- Load jQuery deferred only if the theme tolerates it (test).

### 4. Images — *"Image elements … width and height" (site-wide), LCP*
- Media/Image Optimization: **Lazy Load Images ON**, **Add Missing Sizes ON** (auto-injects width/height on every image site-wide → finishes the CLS fix beyond the pages we hand-edited), **Image WebP Replacement ON**, **Optimize Original Images**.

### 5. HTML & compression — *"Document request latency", "Minify"*
- HTML **Minify ON**.
- Ensure **Brotli/Gzip text compression** is on (LiteSpeed default; verify in hPanel).

### 6. Redirects & request chain — *"Avoid multiple page redirects", "Network dependency tree"*
- Set one canonical URL (https + non-www **or** www — pick one) so there's a **single** redirect hop, not a chain. Settings → General → Site Address, and the host's domain/redirect config.
- After migration, confirm no `http→https→www` triple-hop.
- Preconnect/DNS-prefetch fonts + `meetings.hubspot.com` (LiteSpeed → Tuning, or a `<link rel="preconnect">`).

### 7. Fonts
- Self-host or `font-display: swap` the Newsreader/Inter fonts (Google Fonts) to avoid render-block + FOIT. LiteSpeed → "Font Display Optimization: swap".

### 8. Server
- hPanel → PHP 8.1/8.2, **OPcache ON**.
- Remove any leftover WordPress.com-only plugins (already handled the mu-plugins crash).

---

## Priority order (do these first)
1. LiteSpeed Cache ON + Browser Cache + CDN (caching, latency)
2. JS **Defer/Delay** (TTI, FID, render-block, unused JS) — biggest mobile lever
3. CSS **async + critical + UCSS** (render-block, unused CSS)
4. Image **Add Missing Sizes + Lazy + WebP** (CLS, LCP)
5. Single-hop redirect + preconnect (latency, redirects)

Expected: the 0-score items (render-blocking, unused CSS/JS, caching, redirects, document latency) move up substantially once LiteSpeed Cache is configured, because they are all delivery-layer, not markup.
