# mutation.agile-agilist.com

No build step, no dependencies, one small PHP file. Upload the contents of this
folder to the subdomain's document root.

```
index.html          landing — hero, IMMUNE rings, chasms, layers, assess, workshops, certification
assess/             the 15-statement five-layer placement assessment
  lead.php          captures one reading — CSV + email. No account, no key, no fee.
  .htaccess         stops leads.csv being served over the web
workshops/          all fourteen workshops + the three facilitator guides
cast/               the eight characters
books/              the two source texts
assets/             site.css, site.js, assess.js, favicon.svg
```

The only server-side file is `assess/lead.php`; everything else is static.
Hostinger runs PHP on the subdomain by default, so there is nothing to enable.

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
4. **Check the lead capture works** — take the assessment once on the live
   site, then confirm three things: a row in `assess/leads.csv`, a mail to
   info@agile-agilist.com, and a new contact in HubSpot. The HubSpot leg is
   wired but has never been fired for real — it is a cross-origin POST, so the
   browser sends a CORS preflight first, and a preflight failure would drop the
   submission silently (the call is deliberately fire-and-forget so it can
   never block the reading). The CSV is the backstop if it does.

   `assess/lead.php` needs nothing
   configured and runs the moment it is uploaded: it appends each reading to
   `assess/leads.csv` and emails `info@agile-agilist.com`. Take the assessment
   once on the live site and confirm both. If the mail does not arrive, your
   host may require the `From:` address to exist as a real mailbox — create
   `no-reply@agile-agilist.com` in hPanel, or change `$FROM` to a mailbox that
   does exist. The CSV is the record either way.
5. **HubSpot — already wired.** Portal `46316757`, form
   `c6f0d4c1-d233-4875-9b0c-4528cda02237` ("Mutation Readiness Assessment":
   Email required, First name optional, no reCAPTCHA, GDPR consent off, and
   "automatically create new contacts from unknown email addresses" ON — that
   last one matters, because without it a submission records but no contact
   appears). Both IDs are public by design; nothing secret is in that file.

   The portal is region `na1`, which is what `api.hsforms.com` resolves to by
   default. An eu1 portal would need `api-eu1.hsforms.com`.

   **HubSpot receives the contact only — not the scores.** The form carries
   just email and firstname, and HubSpot rejects an entire submission that
   names a field the form does not have, which would lose the email with it.
   The layer scores, weakest layer and UTMs go to `lead.php` (CSV + email). To
   get the reading into the CRM as well: create a single-line text property on
   the contact, add it to that form, then put its internal name in
   `HUBSPOT_SCORE_FIELD`.
6. **Analytics** — add the same GA4 / conversion snippet the main site uses so
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

## Lead capture, and why it is not n8n

The original deploy note pointed the assessment at an n8n cloud webhook. n8n
cloud is a paid subscription, so this build uses two free paths instead and you
can run either or both:

- **`assess/lead.php`** — on this host, zero setup, zero cost. CSV plus an
  email. It exists so the page can never collect an address and discard it.
- **HubSpot Forms API** — free tier, straight into the portal where your
  contacts already live, no middleman to pay for or keep running.

Both are fire-and-forget. A failure in either is swallowed and the person still
gets their reading — the results are computed in the browser and never wait on
the network.

If you later want routing logic (dedupe, alert on a weak layer-01 score, fan out
somewhere else), that is the point at which a workflow tool earns its fee — and
self-hosted n8n on your own box is free if you want it then.

## Privacy

`assess/leads.csv` holds names and email addresses. It is blocked from the web
by `assess/.htaccess`, excluded from git by `.gitignore`, and should be moved
above the document root if your plan allows it (`$STORE` in `lead.php`). The
gate promises "one email per launch update, unsubscribe anytime" — that promise
is only keepable if these addresses reach a list that actually honours it, which
is the real argument for wiring HubSpot rather than living on the CSV.
