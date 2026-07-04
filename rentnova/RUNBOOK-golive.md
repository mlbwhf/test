# RentNova — go-live runbook

Everything below is **operational work** that needs a human with real accounts
and access. The design and code side is already shipped in this repo.

---

## What's already done in-repo (design / code)

| Item | File(s) | Status |
|---|---|---|
| Guest-facing homepage (search above the fold) | `template-rentnova-home.php` + `home.html` | Shipped |
| Owner content moved to "List With Us" | `template-rentnova-list-with-us.php` + `list-with-us.html` (renamed from Owners) | Shipped |
| Compliance strip UI (STR / MAT / insurance) | `template-rentnova-home.php` (bottom of page + footer copy) | Placeholders in place |
| About / Contact / Guide pages | `template-rentnova-{about,contact,guide}.php` + previews | Shipped earlier |

Every deploy-time token is marked `TODO(deploy):` in the templates. Grep the
`rentnova/` folder before pushing to production:

```
grep -rn "TODO(deploy)\|\[STR-LICENSE\]" rentnova/
```

---

## Phase A — Lodgify + Airbnb (this week, before touching WordPress)

Do this **before** you install anything in WordPress. If Lodgify ⇄ Airbnb sync
doesn't work, none of the WP wiring matters.

### A1. Start the Lodgify trial
1. Go to lodgify.com → **Start free trial**.
2. Set up one property in Lodgify with real dates and a real rate. This is
   the property you'll use to verify sync in step A3.

### A2. Connect Airbnb via the **API channel** (not iCal)
- In Lodgify: **Channels → Airbnb → Connect**.
- Choose **API** integration, not the iCal fallback. iCal only syncs
  blocked dates; API syncs pricing, availability, guest details, messaging.
- Airbnb OAuth will ask you to authorise Lodgify against your Airbnb host
  account. Do this on the Airbnb host account (not a personal booking
  account).
- Map the Lodgify property → the Airbnb listing.

### A3. Verify sync (before doing ANY WP work)
Run all three checks on the trial property:
1. **Availability push**: block a date in Lodgify → confirm it appears
   blocked on Airbnb within 15 minutes.
2. **Rate push**: change nightly rate in Lodgify → confirm it appears on
   Airbnb.
3. **Booking pull**: create a test reservation on Airbnb (use your own
   card, cancel after) → confirm it lands in the Lodgify inbox with the
   guest name, dates, and payout amount.

**Only proceed to Phase B when all three tests pass.** If any leg fails,
open a Lodgify support ticket before wiring WordPress; a broken sync is
much cheaper to catch here.

---

## Phase B — WordPress + plugin + Stripe

### B1. Install the RentNova templates
Copy any/all of these into `wp-content/themes/<active-or-child-theme>/`:
- `template-rentnova-home.php` (guest homepage)
- `template-rentnova-list-with-us.php` (owner pitch)
- `template-rentnova-about.php`
- `template-rentnova-contact.php`
- `template-rentnova-guide.php`
- `template-rentnova-blueprint.php` (reference / alt homepage)

### B2. Publish the pages
Pages → Add New, then assign each via Page Attributes → Template:

| Page title | Slug | Template |
|---|---|---|
| Home | `home` | RentNova Home (Guest-facing) |
| List With Us | `list-with-us` | RentNova List With Us |
| About | `about` | RentNova About |
| Contact | `contact` | RentNova Contact |
| Guide | `guide` | RentNova Guide |

Settings → Reading → Your homepage displays → **A static page** → Home.

### B3. Install & connect the Lodgify WP plugin
- Plugins → Add New → search **Lodgify Vacation Rentals** → Install → Activate.
- Lodgify plugin settings → paste the API key from your Lodgify dashboard
  (Account → Integrations → API key).

### B4. Wire the search widget into the homepage template
Open `template-rentnova-home.php` and find:

```php
// ===== SEARCH WIDGET =====
```

Replace the entire `<form class="rnbp__search">…</form>` fallback with the
Lodgify shortcode. The exact shortcode depends on which widget you chose —
common options:
- `[lodgify-search-bar]` — a compact search bar (use for the hero).
- `[lodgify-search-form]` — a fuller multi-property form.

Wrap it in `<?php echo do_shortcode( '[lodgify-search-bar]' ); ?>`.

### B5. Stripe → Lodgify
- In Lodgify: **Settings → Payments → Stripe → Connect**.
- OAuth into a real Stripe account (business, not personal).
- In Stripe dashboard: confirm the connected app under **Settings → Connect → Authorised applications**.
- Test-mode toggle should be **off** for go-live but **on** for phase B6.

### B6. End-to-end test booking (Stripe test mode)
1. Lodgify → put Stripe in **test mode**.
2. Set the trial property price to $1 for tonight.
3. Book it from the guest-facing homepage using Stripe's `4242 4242 4242 4242` card.
4. Verify:
   - Booking appears in Lodgify with `test_` prefix
   - Confirmation email fires
   - Stripe test dashboard shows the $1 charge
   - Airbnb calendar blocks the dates (API sync)
5. Switch Stripe back to live mode. Re-book with a real card for $1 to
   verify live rails, refund immediately.

---

## Phase C — Compliance BEFORE going live

### C1. Toronto STR license
- Apply at **toronto.ca/business-economy/business-start-ups/short-term-rentals/**.
- Cost: ~$55/yr (as of 2026 — verify current fee).
- Requirement: the property must be your principal residence, or you must
  be operating within Toronto's zoning-permitted STR rules.
- Once issued, do a global find-and-replace across the theme:

```
grep -rn "\[STR-LICENSE\]" rentnova/
```

Replace **every** occurrence with the real licence number. The current
placeholders are in:
- `template-rentnova-home.php` (two locations: compliance strip + footer copy)
- `home.html` (preview)

### C2. Municipal Accommodation Tax (MAT)
- Toronto MAT is **6% of the accommodation portion** of every stay
  (verify current rate at toronto.ca/mat before publishing).
- In Lodgify: **Property → Fees → Add Tax** → 6%, applied to accommodation,
  remit to City of Toronto.
- Lodgify collects it via Stripe. You file with the city **quarterly** (register
  as a MAT-remitting operator at toronto.ca/mat).
- The homepage compliance strip already says "MAT included". Verify the copy
  still matches once the rate is configured.

### C3. Insurance
Homeowners policies **do not** cover short-term rental guests. Bind an STR
policy before your first booking. Canadian options:
- **Duuo by Co-operators** — short-term rental host insurance (per-night or annual)
- **Slice** — pay-per-night STR liability
- **APOLLO** — annual STR policy for hosts
- **Proper Insurance** (US-based, some CA properties)

Minimums:
- **$2M liability** (Airbnb Aircover covers up to $1M — layer your own on top)
- Contents / furnishings coverage
- Loss-of-income during outages

Update the compliance strip line (currently `$1M`) to whatever your bound
policy covers. Grep for `$rn_insurance` in `template-rentnova-home.php`.

### C4. Cross-check before go-live
Before flipping DNS or announcing:

- [ ] `[STR-LICENSE]` placeholder replaced everywhere (`grep -rn STR-LICENSE rentnova/` returns 0 hits)
- [ ] MAT rate in Lodgify matches the compliance strip copy
- [ ] Insurance dollar amount in the compliance strip matches the bound policy
- [ ] Stripe live mode confirmed with a real $1 test booking
- [ ] Airbnb sync verified in both directions after Stripe switch
- [ ] Terms of Service / Cancellation Policy pages linked from the footer
- [ ] Privacy Policy updated to disclose Lodgify / Stripe / Airbnb data flows

---

## Phase D — Post-launch

- **Monitoring**: enable Lodgify's built-in booking alerts + a Stripe daily
  summary email.
- **Analytics**: GA4 property connected via the theme's `wp_head` hook.
- **Reviews**: within 24hrs of the first stay ending, send the direct-book
  guest a review link. Airbnb reviews come through the API.

---

## Hero image + real listings

The current hero and stay cards use hot-linked photos from `rent-nova.com`.
Before go-live:
- Download the real property photos to the Media Library.
- Update `$rn_hero_img` at the top of `template-rentnova-home.php`.
- Update the three stay cards in the same file with real listing URLs, names,
  prices and metadata.

If you switch to the rentnova-theme Stays CPT, replace the hardcoded card
block with a `WP_Query` loop over `post_type='stay'` — the pattern already
exists in `rentnova-theme/front-page.php`.
