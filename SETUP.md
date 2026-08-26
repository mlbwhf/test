# Agile Agilist — full setup

Everything, in the order to do it. Each part works on its own, so you can stop
after any of them.

**Where you are:** Part 2 (calendar) is installed and working — it needs two
snippet updates, not an install. Part 3 (course hero + registration) is the
one that has never been installed; that is the "change of design list and hero
in each course page" you were describing. Part 1 depends on whether the
homepage cohorts snippet and `AA – Home JS` are the versions below.

**No file uploads anywhere.** Everything is a WPCode snippet, Additional CSS,
or a page edit.

**The golden rule, learned the hard way:** one snippet per *kind*. CSS goes in
a CSS snippet, JavaScript in a JavaScript snippet, PHP in a PHP snippet. Never
paste CSS or JS inside a PHP snippet — a 60KB paste through WPCode's editor is
what corrupted the calendar snippet, and a corrupted snippet takes down the
snippets queued behind it, which is how the homepage cohorts died with it.

---

## Part 0 — Clean up first (5 min)

**If you cannot find any of these, there is nothing to do — skip to Part 2.**
Not finding them is the expected result if you already replaced the corrupted
snippet with the three split ones. This part only exists to catch leftovers.

1. WPCode → Code Snippets. **Delete** the old, corrupted calendar PHP snippet —
   the single-snippet one you disabled, not the `AA – Calendar PHP` you
   replaced it with. Gone already? Fine.
2. Leave the homepage cohorts PHP snippet alone for now.
3. `aa-shortcodes-mu-plugin.php` in `wp-content/mu-plugins/` — delete if
   present. It is superseded and it is what took the site down. You never
   uploaded it successfully, so it is very likely not there.

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

## Part 2 — Course calendar — **already installed, two updates outstanding**

The three calendar snippets are live on your site and you confirmed them
working. Do **not** reinstall. Two changes were made *after* that
confirmation, both fixing things you reported, and they need re-pasting over
the snippets you already have:

| WPCode snippet | Re-paste | What it fixes |
|---|---|---|
| `AA – Calendar PHP` | `aa-mini-calendar-wpcode-snippet.php` | **"Aug 27 there are two running"** — the same class stored as two `wp_events` posts now collapses to one bar, keyed on course code + start + end. |
| `AA – Calendar JS` | `snippets/calendar/aa-calendar.js` | **RTE's Mon/Wed/Fri batches** all drew identical bars. A course appearing more than once in the visible month now labels its bars with the date range instead of the name. |

`AA – Calendar CSS` is unchanged — leave it alone.

Re-paste = open the existing snippet, select all, replace, update. Do not
create new snippets, or you get two of each.

Still to do from this part, if you have not already:

1. Deactivate the old **"AA — Class Calendar"** JS snippet (it double-renders
   against the new one).
2. Deactivate the **Xylus** calendar plugin.

Then check `/training/`, `/training/adv-safe/`, `/training/safe/` (calendars,
each scoped to its own track), `/training/safe-industry/` and
`/training/safe-found/` (cohorts section gone entirely), and any course page.

---

## Part 2.5 — Claims cleanup (install this one on its own, today)

| # | WPCode type | Name | Paste | Settings |
|---|---|---|---|---|
| 1 | **PHP Snippet** | `AA – Claims` | `aa-claims-wpcode-snippet.php` | Auto Insert, **Run Everywhere** |

Independent of everything else — it does not wait for Stripe. It removes two
claims from every page as it renders, in all four languages:

- **`aggregateRating`** in the Course JSON-LD — a 4.9 from 2,500 reviews with
  no 2,500 reviews visible on the page. Google requires the rating to be
  visible to the reader on the same page, so this is a manual-action risk
  rather than an SEO win.
- **The pass guarantee** — "money-back pass guarantee", "retake the next cohort
  free or a full refund". It contradicts the copy rule in your own design
  handoff, and it is a refund promise on **24 published English pages** plus
  their Spanish, French and Arabic mirrors.

Nothing is written to the database, so deactivating the snippet puts every page
back exactly as it was. Put **`[aa_claims_report]`** on any page and view it as
an administrator to see which pages still hold the claim in their stored
content — that is the list for cleaning the source later, at leisure.

Checked against all 52 page files in the repo: 33 carried a claim, none carried
one afterwards, and every JSON-LD block still parses. Legitimate uses of the
word are untouched — "no garantías", "pas des garanties", the customer quote
"le dispositif de réussite garantie", and the retake-policy FAQ all survive,
because every pattern is anchored on the whole claim, never on the word.

---

## Part 3 — Course registration with Stripe

| # | WPCode type | Name | Paste | Settings |
|---|---|---|---|---|
| 1 | **CSS Snippet** | `AA – Register CSS` | `snippets/register/aa-register.css` | Auto Insert, Site Wide Header |
| 2 | **JavaScript Snippet** | `AA – Register JS` | `snippets/register/aa-register.js` | Auto Insert, **Site Wide Footer** |
| 3 | **PHP Snippet** | `AA – Register PHP` | `aa-register-wpcode-snippet.php` | Auto Insert, **Run Everywhere** |

### Then tick one box — no page edits

**Settings → AA Registration → "Replace the hero and the Fluent Form" → tick.**

That is the whole page-side install. Your course pages are all built from the
same template, and two of their blocks are the ones being replaced:

| Block in the page | Becomes |
|---|---|
| `<!-- wp:group {"className":"aa-sec aa-hero"} -->` | the new hero with the date picker |
| `<!-- wp:group {"className":"aa-reg"} -->` — holds `[fluentform id="8"]` | the new two-step registration |

The swap happens as the page renders. Nothing is written to the pages, so:

- there is no moment where a visitor sees the literal text
  `[aa_course_hero course="spc"]`, which is what a pasted shortcode shows
  before the snippet is active;
- unticking the box puts the old hero and the Fluent Form straight back, with
  nothing to undo by hand;
- it picks up the other 16 courses automatically once their cadence is added.

**English pages only.** The mirrors reuse the English slug — `/fr/rte/` and
`/ar/rte/` are both `rte` — so a plain slug match would put an English hero and
an English form on a French page. Pages under `/es/`, `/fr/` and `/ar/` are
skipped until the course table carries copy in those languages.

It applies only to English pages whose slug has a row in `aa_reg_courses()` —
today `spc`, `aspc`, `rte`. Every other page is untouched. Send me the cadence for
the other courses and I will add them.

**If you would rather place them by hand**, leave the box unticked and put the
two shortcodes in the pages yourself:

```
[aa_course_hero course="spc"]        <- replacing the hero block
[aa_course_register course="spc"]    <- replacing the [fluentform id="8"] block
```

Step-by-step for that is in `course-page-shortcode-work-order.md`.

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

## The AI-Native suite — classroom courses, one date a month per city

Three courses, three cities, **90 cohorts generated**, no dates typed by hand:

| Course | Page | Price | Days | Seats |
|---|---|---|---|---|
| AI-Native Foundations (AINF) | 11792 | $1,500 | 2 | 18 |
| **AI-Native Value Architect** (AINCA) | 11818 | $2,500 | 2 | 18 |
| Leading the AI-Native Organization (AINORG) | 23813 | $1,500 | 1 | 12 |

Prices came off your own live pages; **durations are the ones you gave me**, and
they override what those pages say. Worth knowing: the AINCA page states three
days in four separate places (the chip, the curriculum heading, the FAQ, and
`courseWorkload: P3D`), and the AINORG page states two the same way. The
schedule now uses 2 and 1. **Those pages contradict the schedule until their
copy is corrected.**

**Cities.** Mississauga monthly, Dubai and Riyadh quarterly, for each course.
Each course takes a different week so one trainer is never in two rooms at once
— Foundations 1st Thursday, Value Architect 2nd Thursday (your 10 September),
Leading the Org 3rd Thursday. Verified: zero same-day clashes in a city.

**The Gulf runs on Sundays, not Thursdays.** Friday and Saturday are the weekend
in Saudi Arabia and the UAE, so a Thursday start there is a weekend class;
Sunday is the first working day. North American public holidays only move North
American dates — a Riyadh class no longer shifts off Canadian Remembrance Day.

**No class runs into the weekend, and that is now a rule rather than a lucky
choice of dates.** A span that would touch the local rest days is pushed to the
next start that does not. This matters because durations change: at 3 days,
Value Architect ran Thursday–Saturday on all 18 Canadian dates. Verified across
every duration from 1 to 5 days, in both regions: **zero weekend dates**.

To change any date, change `first` on that city — the series is derived, not
listed.

---

## How the schedule works — live-online courses

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
