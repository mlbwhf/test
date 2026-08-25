# Agile Agilist — full setup

Nothing here is installed yet. This is everything, in the order to do it.
Each part works on its own, so you can stop after any of them.

**No file uploads anywhere.** Everything is a WPCode snippet, Additional CSS,
or a page edit.

**The golden rule, learned the hard way:** one snippet per *kind*. CSS goes in
a CSS snippet, JavaScript in a JavaScript snippet, PHP in a PHP snippet. Never
paste CSS or JS inside a PHP snippet — a 60KB paste through WPCode's editor is
what corrupted the calendar snippet, and a corrupted snippet takes down the
snippets queued behind it, which is how the homepage cohorts died with it.

---

## Part 0 — Clean up first (5 min)

1. WPCode → Code Snippets. **Delete** the old calendar PHP snippet (the one you
   disabled). Do not edit it — its stored copy is corrupted.
2. Leave the homepage cohorts PHP snippet alone for now.
3. If a file called `aa-shortcodes-mu-plugin.php` is still in
   `wp-content/mu-plugins/`, delete it. It is superseded and it is what took
   the site down.

---

## Part 1 — Homepage (already built, not yet installed)

| # | WPCode type | Name | Paste | Settings |
|---|---|---|---|---|
| 1 | Additional CSS | — | `snippets/additional-css-home-section.css` at the **end** of the sheet | Customizer → Additional CSS |
| 2 | **JavaScript Snippet** | `AA – Home JS` | `redesign-build/aa-home/aa-home.js` | Auto Insert, **Site Wide Footer** |
| 3 | **PHP Snippet** | `AA – Home Cohorts` | `aa-home-cohorts-wpcode-snippet.php` | Auto Insert, **Run Everywhere** |

Also add the fonts `@import` at the **top** of Additional CSS, under the
existing Newsreader import (an `@import` is invalid anywhere else):

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
```

Then the three page blocks — each goes into a single **Custom HTML** block,
replacing that block's contents:

| Page | File |
|---|---|
| `/` (front page, 961) | `snippets/pages/home-961-v3-markup-only.html` |
| `/es/` (29277) | `snippets/pages/translations/home-es.html` |
| `/fr/` (29281) | `snippets/pages/translations/home-fr.html` |

**`/es/` and `/fr/` need one extra step.** Both pages hold *two* top-level
blocks: a Group with class `aa-rd` (the whole previous page — old header, old
six-card grid, and a "4.9/5" claim) and the Custom HTML block. Replacing the
second never touches the first. Open the block list (top-left icon), select the
first Group, delete it.

**The English page needs it too**: its first Custom HTML block still carries an
`aggregateRating` and a duplicate Organization/Person JSON-LD. Delete that
block, keep the one you paste into.

---

## Part 2 — Course calendar (all pages)

| # | WPCode type | Name | Paste | Settings |
|---|---|---|---|---|
| 1 | **CSS Snippet** | `AA – Calendar CSS` | `snippets/calendar/aa-calendar.css` | Auto Insert, Site Wide Header |
| 2 | **JavaScript Snippet** | `AA – Calendar JS` | `snippets/calendar/aa-calendar.js` | Auto Insert, **Site Wide Footer** |
| 3 | **PHP Snippet** | `AA – Calendar PHP` | `aa-mini-calendar-wpcode-snippet.php` | Auto Insert, **Run Everywhere** |

Activate 1 and 2 before 3.

*Or* put the CSS in Additional CSS instead of a snippet, using
`snippets/additional-css-calendar-section.css` (section Z). One or the other,
never both.

No page edits: the snippet takes over `[easy_events_calendar]` and
`[easy_event_calendar_mini]`, so every page carrying them switches over. Then:

1. Check `/training/`, `/training/adv-safe/`, `/training/safe/` (calendars,
   each scoped to its own track), `/training/safe-industry/` and
   `/training/safe-found/` (cohorts section gone entirely), and any course page.
2. Deactivate the old **"AA — Class Calendar"** JS snippet.
3. Deactivate the **Xylus** calendar plugin.

---

## Part 3 — Course registration with Stripe

| # | WPCode type | Name | Paste | Settings |
|---|---|---|---|---|
| 1 | **CSS Snippet** | `AA – Register CSS` | `snippets/register/aa-register.css` | Auto Insert, Site Wide Header |
| 2 | **JavaScript Snippet** | `AA – Register JS` | `snippets/register/aa-register.js` | Auto Insert, **Site Wide Footer** |
| 3 | **PHP Snippet** | `AA – Register PHP` | `aa-register-wpcode-snippet.php` | Auto Insert, **Run Everywhere** |

Then on each course page, two shortcodes:

```
[aa_course_hero course="spc"]        <- first block on the page
[aa_course_register course="spc"]    <- further down
```

`course` is `spc`, `aspc` or `rte`. Other courses need a row added to
`aa_reg_courses()` first — send me their cadence and I will add them.

### Before it can charge anyone

**Checkout is off by default and the pay button is disabled.** Three steps:

1. **Settings → AA Registration → Stripe secret key.** Use a **`sk_test_`** key
   first. (If you would rather keep keys out of the database, put
   `define( 'AA_STRIPE_SECRET', 'sk_...' );` in `wp-config.php` and the field is
   ignored.)
2. **Stripe → Developers → Webhooks → Add endpoint:**
   - URL: `https://agile-agilist.com/wp-json/aa/v1/stripe-webhook`
   - Event: `checkout.session.completed`
   - Copy the signing secret (`whsec_…`) into the settings page.
3. **Check every price in the snippet**, then tick **"Prices confirmed"**. The
   prices came off your live course pages and have never been checked against
   finance. Nothing charges until this is ticked.

Do one full test purchase with the test key before switching to `sk_live_`.

### What the buyer does

Pick a batch → enter **work email** → seats → review → **Pay securely with
Stripe** → Stripe's hosted page → back to your page confirmed.

That is the only field on your site. Stripe collects the cardholder name,
billing details and card, and the name comes back on the webhook into the
registration record. Registrations appear in wp-admin under **Registrations**.

### Why Checkout Sessions and not your Payment Links

I went with sessions. Reasons, in order:

- **Price integrity (SEO).** The `Offer` JSON-LD on the page and the amount
  charged both come from one table in the snippet, so the structured data
  cannot advertise a price the checkout will not honour. A link's price lives
  in the Stripe dashboard and diverges the day either side changes.
- **Seats.** A session is refused when a batch is full. A link with adjustable
  quantity lets a buyer raise the seat count on Stripe's page, past any check.
- **Maintenance.** One link per class cannot work here: the schedule is
  generated, so **201 batches are live at once and about seven appear weekly** —
  364 links a year to create and retire, each dying when its date passes.

The cost is one server round trip before the redirect (~⅓ second, hidden behind
the button's pending state). Stripe hosts the same mobile-optimised page either
way, so nothing about the payment experience, its SEO or its readability
differs. Your existing links still work for anything else — and if you want a
specific course to use one, set `'payment_link' => '…'` on that course.

---

## How the schedule works

You never type a date. Each course carries a cadence:

- **SPC, ASPC** — every Monday and Thursday
- **RTE** — every Monday, Wednesday and Friday, Friday always afternoon

A batch is a **weekend** batch when any of its days lands on a Saturday or
Sunday — so on a Mon+Thu cadence the Thursday class is the weekend option,
because it runs Thursday to Sunday. That is what the Weekday/Weekend filter
splits on.

**Public holidays are an opportunity, not a blackout.** A North American public
holiday on a cadence day produces **two** offers: the holiday itself, marked
*long weekend*, and the next working day, marked *after the holiday*. Labour Day
2026 gives you Mon 7 Sep and Tue 8 Sep.

**Only Christmas Day and New Year's Day remove a class**, and they remove any
class that would *touch* them — so no four-day SPC starts Thursday 24 Dec, and
starts appear on 26, 27 and 28 Dec instead.

To change any of this, edit `aa_reg_courses()` (cadence, price, seats, weeks
ahead) or `aa_reg_blackout()` (the two hard dates). Holidays compute themselves.

---

## If something goes wrong

| Symptom | Cause |
|---|---|
| Literal `[aa_...]` on the page | The PHP snippet is not running. Put `[aa_mcal_selftest]` on a page, view as admin. |
| Unstyled block of text | The CSS snippet. |
| Styled but nothing moves | The JavaScript snippet. |
| White screen after a change | Delete/deactivate the snippet you just touched. Check the "Your Site is Experiencing a Technical Issue" email — it names the file and line. |
| Pay button says "temporarily unavailable" | Prices not confirmed, or no Stripe key. |

Always purge cache before judging any of it.

---

## Still owed from your side

- Cadences for the other 16 courses (I only have SPC, ASPC, RTE)
- Confirm every price, then tick the box
- Decide on the **"retake free or full refund"** guarantee — it is in 28 files
  including every course page, and it contradicts the copy rule in your own
  design handoff ("exam fee included; a free retake is not")
- Create the `ai-native` event_category term + its events
- Populate `seats_left` on events so the calendar shows real seat counts
- STE course specifics from the partner portal
- Search Console 404 export
- Move both fonts to Customizer → Typography, then delete the `@import` lines
