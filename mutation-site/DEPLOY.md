# mutation.agile-agilist.com

Static site. No build step, no dependencies, no server code. Upload the contents
of this folder to the subdomain's document root.

```
index.html          landing — hero, IMMUNE rings, chasms, layers, assess, workshops, certification
assess/             the 15-statement five-layer placement assessment
workshops/          all fourteen workshops + the three facilitator guides
cast/               the eight characters
books/              the two source texts
assets/             site.css, site.js, assess.js, favicon.svg
```

## Deploy (Hostinger)

1. **Subdomain** — hPanel → Websites → agile-agilist.com → Subdomains → create
   `mutation`. Hostinger adds the DNS A record; DNS is authoritative at
   Hostinger, so do not touch the old SiteGround zone.
2. **Upload** — File Manager or SFTP → the subdomain's document root → upload
   everything in this folder, preserving the directory structure. Links are
   root-absolute (`/assess/`, `/assets/site.css`), so the folder must sit at the
   document root, not in a subfolder.
3. **SSL** — hPanel → Security → SSL → free certificate for the subdomain, then
   force HTTPS.
4. **Wire the assessment** — in `assets/assess.js`, replace
   `PASTE_N8N_WEBHOOK_URL_HERE` with a production Webhook URL from
   agile-agilist.app.n8n.cloud and route it to HubSpot (create/update contact,
   tag `five-waves-lead`, store the five layer scores, the weakest layer and the
   UTM fields). Until that value starts with `http` the page simply skips the
   POST — the assessment stays fully usable in the meantime.
5. **Analytics** — add the same GA4 / conversion snippet the main site uses so
   assessment completions register as real events.

## Before launch

- **Retail links on `/books/`.** Neither book has a public store page, so both
  blocks carry the launch-list CTA instead. The three slots to fill are marked
  `[RETAIL-1]`, `[RETAIL-2]` and `[RETAIL-3]` in a comment at the top of
  `books/index.html`. No price appears anywhere until a real one exists.
- **Do not** link `/mutation-age-beta/` from any public page — it is a
  password-protected reading room for invited readers.
- **Portraits.** Eight monogram placeholders are live. Drop the WebP files into
  `assets/portraits/` and uncomment the `<img>` line inside each
  `<template data-person-detail>` in `cast/index.html`; the monogram tile
  disappears on its own. Naming and art direction: `PORTRAIT-BRIEF.md` in the
  design handoff.
- **Book covers.** Replace the hatched `.book__cover` figures in
  `books/index.html` with `<img>` when the publisher artwork arrives.

## Things worth knowing before you edit

- **Fonts** load from Google Fonts. To remove the third-party dependency,
  download Archivo (400/500/700/900) and IBM Plex Mono (400/500/600) — both SIL
  OFL — into `assets/fonts/`, and replace the `<link>` in each page with an
  `@font-face` block at the top of `site.css`.
- **The cast copy ships in the HTML source** inside `<template>` tags, so all
  eight characters are crawlable on first fetch while only one is visible. If
  you move this to fetch/AJAX you lose that. Don't.
- **`.dark a` outranks the `.btn` colour rules on specificity.** That is why the
  block at the bottom of `site.css` restates the dark-band button colours with
  the anchor in the selector. Without it the primary CTA in every dark band is
  amber text on an amber fill — invisible. Do not fold those rules back in.
- **Amber `#C87A16` only on light grounds, `#F0A93C` only on dark.** Both meet
  4.5:1 against their own ground; swapped, neither does.
- **No border radius anywhere except the rings, and no shadows** except the
  active-ring focus ring. Square corners are the identity.
- **The assessment's two numbers are not redundant.** `wave` is the highest
  layer that holds with every layer below it; `highest attempted` ignores that
  ordering. The gap between them is the finding the instrument exists to
  surface. Do not collapse them into one score.

## Not built

- **`/workshops` beyond the catalog** — the eleven non-flagship guides are
  Facilitator-tier and released here as they are documented.
- Five of the fourteen workshops are still unnamed in the design handoff; all
  fourteen are named here from the original site content.
