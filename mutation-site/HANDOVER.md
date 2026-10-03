# Mutation / Two Chasms — handover

Written for a fresh Claude Code session picking this up cold. Read this before
`DEPLOY.md`. They describe **two different deployment targets** for the same
design, and only one of them is currently live.

- `DEPLOY.md` — the **static** build, for upload to `mutation.agile-agilist.com`
  on Hostinger. Complete, never deployed.
- this file — the **WordPress port**, on a standalone Hostinger WordPress.
  Partially built. This is the one with work in flight.

---

## 1. What this is

**The Two Chasms Framework**, the public face of two books by Mark Saymen —
*The Innovation Playground* and *The Mutation Age*. It is a separate property
from `agile-agilist.com`, not a section of it. Agile Agilist is the parent
brand and the commercial route (public dates, private cohorts).

Two crossings, and the second is the one the whole site is pointed at:

- **Crossing one — The Playground.** Control → trust. Protected attention,
  candor before feedback, safe-to-fail experiments, the Innovation Matrix and
  the discipline of choosing two cells out of sixteen. Anchor
  `/workshops/#crossing-one`.
- **Crossing two — Signal (the second chasm).** Metrics → signals. The gap
  between organisations that manage a *representation* of the world
  (dashboards, lagging metrics) and those that sense the world itself.
  Lagging metrics paired with leading signals, sensemaking cells close to the
  work, governance that measures its own latency, an immune system instead of a
  perimeter. Anchor `/workshops/#crossing-two`.

The framing claim, and the reason the assessment is built the way it is: most
transformations that look finished have crossed the first chasm and are quietly
falling into the second.

**Five layers** (an operating model, not an org chart — the rules for how work
is funded, decided, produced, measured): 01 Iterative delivery at scale ·
02 Innovation in cadence · 03 AI-Native · 04 AI automation · 05 Mutation.

### The instrument, and the one thing not to break

`/assess/` is a 15-statement placement assessment, 3 statements per layer, 0–4
scale.

- `layer score` = sum of that layer's 3 answers / 12, as a percentage
- `wave` = highest layer scoring ≥ 60 **with every layer below it also ≥ 60**
- `highest attempted` = highest layer scoring ≥ 40, ignoring that ordering
- `weakest` = lowest-scoring layer (first one, on a tie)

**`wave` and `highest attempted` are not redundant and must never be collapsed
into one number.** The gap between them is the entire finding the instrument
exists to surface: an organisation that has climbed past a layer it never made
hold. This is stated in `DEPLOY.md` too. Do not "simplify" it.

---

## 2. Hard constraints — read before touching anything

### Confidentiality

- **`/mutation-age-beta/` must never be linked from any public page.** It is a
  password-protected reading room for invited readers, on `agile-agilist.com`.
- **The BICE Career Path Design document is a client deliverable.** Its content
  must never appear on a public page.
- **`assess/leads.csv` holds personal data.** Blocked from the web by
  `assess/.htaccess`, excluded by `.gitignore`, never committed.
- **Arabic marketing copy comes from the client's own translator.** Never write
  it.

### What this environment cannot do

These are not preferences, they are walls hit and confirmed in-session:

1. **Egress to the site is blocked.** The environment's network policy denies
   `springgreen-sardine-416356.hostingersite.com` (gateway 403 on CONNECT).
   `agile-agilist.com` is blocked the same way. Consequence: **the rendered
   site cannot be viewed, fetched or screenshotted from here.** No curl, no
   Playwright. Everything below is written blind and verified only by reading
   content back through the connector.
   *To fix:* environment settings → Network access → Custom, add the host,
   keep the default package-manager list.
   https://code.claude.com/docs/en/cloud-environments#network-access
2. **No WPCode on this install, and no way to add PHP.** The connector exposes
   only `wp_*` content tools. No shortcode can be registered, no REST route, no
   page template file, no `lead.php`.
3. **`.css` and `.js` uploads are refused** (`upload_error`: file type not
   allowed). Confirmed by probe. CSS and JS must be inlined.
4. **`claude mcp add` does nothing useful here.** This session's MCP servers
   are read from the account/environment at session start; the container's own
   local config is empty and the container is ephemeral.
5. **`wp_create_post` runs plain prose through a Markdown converter.** Content
   containing real HTML tags is stored byte-for-byte (verified: `<style>`,
   `<script>`, raw `<`/`>` inside JS, entities, media queries, newlines all
   survived). Content with no recognisable markup gets `<p>`-wrapped and
   entity-escaped. **Always pass raw HTML, never escaped.**

### Design invariants

`DEPLOY.md` §"Things worth knowing before you edit" is authoritative. The three
that get broken most often:

- **Amber `#C87A16` on light grounds only; `#F0A93C` on dark only.** Each meets
  4.5:1 against its own ground. Swapped, neither does.
- **No border radius anywhere except the rings. No shadows** except the
  active-ring focus ring. Square corners are the identity.
- **`.dark a` (0,2,0) outranks `.btn` colour rules (0,1,0).** The block
  restating dark-band button colours with the anchor in the selector exists
  because without it every primary CTA in a dark band is amber-on-amber —
  invisible. Do not fold those rules back in.

---

## 3. WordPress port — current state

Site: `https://springgreen-sardine-416356.hostingersite.com`
Theme: **Twenty Twenty-Five** (block theme). Plugins: AI Engine (the MCP
bridge), Hostinger tooling, LiteSpeed Cache. **No WPCode, no Astra.**
Permalinks already `/%postname%/`, so the static build's root-absolute links
(`/assess/`, `/books/`, `/cast/`, `/workshops/`) resolve to page slugs with no
rewriting.

### Built

| Object | ID | State | Notes |
|---|---|---|---|
| `wp_template` `page-mutation` | 7 | publish | Shared chrome + all CSS + all JS |
| Page — The Two Chasms Framework | 8 | publish, **front page** | slug `framework`, template assigned |
| Page — Which Wave Are You In? | 13 | **draft** | slug `assess`, template assigned, content complete |
| Term `twentytwentyfive` in `wp_theme` | 2 | — | Required or the template never resolves |

Options changed: `blog_public=0` (noindex — set deliberately, see §5),
`show_on_front=page`, `page_on_front=8`.

### How the port is structured

A block theme stores page templates in the database as `wp_template` posts, so
a chrome-free template could be created over the connector without theme file
access. **It must carry the `wp_theme` term or WordPress will not resolve it**
(term 2 above), and each page needs meta `_wp_page_template = page-mutation`.

Template 7 holds, in one place for every page:

- Google Fonts `<link>` (Archivo 400/500/700/900, IBM Plex Mono 400/500/600)
- the whole of `assets/site.css`, verbatim
- a **WordPress-port-only** CSS block that hides TT5's header/footer template
  parts and removes its constrained content width. Scoped to the theme's own
  wrappers; nothing in the design above it is touched.
- the `.masthead` nav and the `.colophon` footer
- `<!-- wp:post-content /-->` between them
- the whole of `assets/site.js`, plus two additions (§4)

Each page's `post_content` is therefore only what was inside `<main>`.
`/assess/` additionally inlines all of `assets/assess.js`, because that script
belongs to one page and the static build's "one script is one failure domain"
property is worth keeping.

### Not built yet

- **Pages `/workshops/`, `/cast/`, `/books/`** — source is
  `workshops/index.html`, `cast/index.html`, `books/index.html`. Port the
  `<main>` contents only; chrome comes from the template. Note
  `cast/index.html` uses `<main data-cast>` and `/workshops/` and `/books/` use
  a bare `<main>` — the `data-cast` attribute is what `initCast()` hooks, so it
  must move onto a wrapper `<div data-cast>` inside the page content.
- **Six workshop downloads not uploaded.** `.docx` and `.png` are allowed
  mime types, so `wp_upload_media` with base64 works; then repoint the six
  `/workshops/*.docx|png` links at the media URLs.
  `IMMUNE_Workshop_Guide.docx`, `Innovation_Matrix_Workshop_Guide.docx`,
  `Signal_Mapping_Workshop_Guide.docx`,
  `Exhibit_2-1_Lagging_Metrics_and_Signals.docx` (all small),
  `Figure_IMMUNE_Map.png` (347KB), `Template_IMMUNE_Workshop.png` (234KB).
  Base64 roughly doubles the payload; send the two PNGs in their own calls.
- **Page 13 is a draft on purpose.** It was created, then the build was
  interrupted; it went live for a few minutes before its template was assigned,
  so it rendered unstyled. Content is complete and the template is now
  assigned — publishing it is a one-field change once someone can actually
  look at a rendered page.

### Workshop inventory (for the `/workshops/` port)

Fourteen, seven per crossing. Three flagships have facilitator guides; the
other eleven are Facilitator-tier and released as documented.

Crossing one: P1 Charter the Playground · P2 Attention Audit · P3 The Candor
Contract · P4 First Useful Moment · P5 The Cultural Wall · **P6 The Innovation
Matrix (flagship)** · P7 The Rebrand Test

Crossing two: **S1 Signal Mapping (flagship)** · S2 Grown, Not Built ·
S3 Observe, Don't Ask · S4 Sensemaking Cells · S5 Governance Latency ·
**S6 IMMUNE / SignalNet (flagship)** · S7 The Blind-Spot Register

Cast (8, anchored `/cast/#slug`): `oliver-reid`, `maya-brooks`, `max`,
`rhea-kapoor`, `daniel-torres`, `layla-sharif`, `terry`, `athena`.

---

## 4. Changes made to the design, and why

Everything here is a deliberate departure from the static build. Nothing else
was changed.

1. **`initNavHere()`** — new. The static build hand-wrote `aria-current="page"`
   on each page's nav. The masthead now lives in one template serving every
   page, so the current item is set from `location.pathname` instead.
2. **`initReveal()` + motion CSS** — new, requested. Scroll-entrance reveals on
   `[data-reveal]` bands with a stagger on `[data-reveal-item]`, plus hover
   lifts on the card components.
   **The hidden state is gated behind `html.js-reveal`**, which an inline script
   sets only when `IntersectionObserver` exists. If that script never runs,
   nothing is ever hidden. *Do not move those rules out from under the
   `html.js-reveal` prefix* — a reveal pattern that hides content by default
   blanks the page when the script fails. Fully disabled under
   `prefers-reduced-motion`, matching the existing ring animation.
   Bands are unobserved once revealed: these are entrances, not scroll-linked
   effects.
3. **Latest Posts section on the landing page** — new, requested ("more
   dynamic"). `core/latest-posts` is a dynamic core block, so published posts
   appear with no edit to the page. **A shortcode was written first and was
   wrong** — with no WPCode there is no PHP path to register one and it would
   have rendered as literal text. Styled via `.mutation-updates`; those class
   names are WordPress's render output, not ours.
4. **`LEAD_ENDPOINT` emptied on `/assess/`.** This is the one real functional
   loss and it needs a decision — see §5.

---

## 5. Open items

### Needs the owner

- **Social handles.** "More dynamic + links to existing social media account
  for innovation framework" was requested; the framework has a *separate*
  social presence from Agile Agilist. **The handles were never supplied, and a
  web search did not find them** — the closest hit,
  `linkedin.com/company/the-innovation-playground`, appears to be an unrelated
  innovation space. **Nothing was wired.** `.social` CSS is in the template and
  ready for the masthead and colophon; adding the markup is a two-minute change
  once real URLs exist. Do not guess a handle onto a live page.
  For reference, the **Agile Agilist** accounts (parent brand, found in repo
  backups dated July, unverified against the live site):
  `linkedin.com/company/agile-agilist`, `youtube.com/@AgileAgilist`,
  `instagram.com/agile.agilist`, `facebook.com/agileagilist`,
  `linkedin.com/in/marksaymen`.
- **Open egress to the host** so the site can actually be render-verified.
  Until then every change is unverified. This is the single highest-value
  unblock.
- **Domain.** The site is on the temporary `hostingersite.com` URL.
  `mutation.agile-agilist.com` is not pointed at it. Links are root-absolute so
  they work either way.
- **`blog_public=0` must be reverted at launch.** Set deliberately: the temp
  URL is live and crawlable, and indexing it would create duplicate content
  against the real domain later. One click in Settings → Reading.
- **Retail links on `/books/`.** Neither book has a public store page. Three
  slots marked `[RETAIL-1]`, `[RETAIL-2]`, `[RETAIL-3]` in a comment at the top
  of `books/index.html`. **No price appears anywhere until a real one exists.**
- **Portraits.** Eight monogram placeholders are live; nine
  `assets/portraits/*.webp` references wait on real files. Drop the WebP in and
  uncomment the `<img>` inside each `<template data-person-detail>`; the
  monogram tile disappears on its own. Art direction: `PORTRAIT-BRIEF.md` in
  the design handoff.
- **Book covers.** Replace the hatched `.book__cover` figures with `<img>` when
  publisher artwork arrives.

### Decision needed: the assessment's scores are no longer captured

On WordPress, HubSpot receives **the contact only** — email and first name. The
layer scores, weakest layer and UTMs are computed, shown to the person, and
discarded. `assess/lead.php` (CSV + notification email) was the backstop and
there is no PHP path to it here.

Two ways out, and the second is better than what was lost:

1. Upload `assess/lead.php` and `assess/.htaccess` by hand via Hostinger File
   Manager. Restores the CSV. Two files, and it keeps personal data in a flat
   file that must stay blocked from the web.
2. **Put the reading in the CRM instead.** Create a single-line text property
   on the HubSpot contact, add it to form
   `c6f0d4c1-d233-4875-9b0c-4528cda02237` ("Mutation Readiness Assessment",
   portal `46316757`, region na1), then set `HUBSPOT_SCORE_FIELD` to its
   internal name in the inlined script on page 13.
   **Leave it blank until that property really exists** — HubSpot rejects an
   entire submission that names a field the form does not have, and the email
   would be lost with it. That failure mode is why it is empty now.

Both portal ID and form GUID are public by design; the Forms submission API is
meant to be called from a browser. Nothing secret is in that file.

### Known-good but unverified

Everything in §3 was written through the connector and read back to confirm
storage. **None of it has been seen rendered.** The highest-risk assumption is
that a database-only `wp_template` with the `wp_theme` term and
`_wp_page_template` meta actually resolves on TT5. If it does not, the symptom
is a page with no masthead, no footer and no styling, and the fallback is to
move the `<style>` block and chrome into each page's own content — mechanical,
but it duplicates 20KB of CSS five times, which is why it was not done first.

---

## 6. Credentials note

An AI Engine bearer token for this site was pasted into the originating chat in
plain text. It was used once, against that host only, and the connection was
refused by the network policy before any bytes left the container. **It should
be rotated in AI Engine.** Do not put it in this repo.
