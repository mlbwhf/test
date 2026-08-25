# Calendar — install and behaviour

The calendar replaces the Xylus calendar everywhere it appears, driven by our
own `wp_events` schedule and our own registration instead of Eventbrite.

## Install — mu-plugin ONLY, never a WPCode paste

> **Do not paste this code into WPCode again.** The copy that was pasted there
> came out corrupted — its stored tail contains a stray `return false;` that
> exists in no version of the source — and while that broken snippet was
> active it also blocked the snippets queued after it, which is why the
> homepage cohorts died with it and came back the moment it was deactivated.
> A 40KB paste through a web editor is how this happens; a file upload is not.

Install **`aa-shortcodes-mu-plugin.php`** instead (it carries this calendar
AND the homepage cohorts):

1. Leave the "mini calendar" WPCode snippet **deactivated** — or delete it.
2. Upload `aa-shortcodes-mu-plugin.php` into `wp-content/mu-plugins/` using
   the file manager's **Upload** (not create-and-paste). Confirm the uploaded
   size matches the local file. It is live immediately; no activation exists.
3. Every function in that bundle is renamed to an `aamu_` prefix, so it cannot
   collide with anything still stored in WPCode, active or not, in any order.
4. If anything ever white-screens: delete the file from `mu-plugins/` and the
   site is back instantly.

No page edits. The snippet intercepts `[easy_events_calendar]` and
`[easy_event_calendar_mini]` through `pre_do_shortcode_tag`, which runs just
before WordPress calls whichever handler is registered — so every page that
already embeds one switches over on activation, regardless of load order.

### If the old calendar is still showing

Put `[aa_mcal_selftest]` on any page and view it **while logged in as an
administrator** (it prints nothing for anyone else, so it is safe to leave).
It reports whether the snippet ran at all and who owns each shortcode tag:

* **Nothing appears** → the snippet is not running. Check it is Activated,
  set to *Auto Insert · Run Everywhere*, and has no conditional logic
  attached. This is the usual cause.
* **Box appears, calendar still old** → the interception is being bypassed
  by something else on the page; send me the box's contents.
* **Box appears and says `cohorts section here: suppressed`** on
  safe-industry / safe-found → that half is working.

Clear any page cache before judging — a cached copy of the page will keep
serving the old calendar no matter what the snippet does.

Then, once the pages below look right:

1. Deactivate the old **"AA — Class Calendar"** JS snippet. `[aa_mini_calendar]`
   is a strict superset of it, including the `AA_PICK` hand-off to the course
   page's cohort picker, so running both would double-render.
2. Deactivate the **Xylus** calendar plugin.

Deactivating this snippet is the whole undo — both shortcodes go straight back
to the plugin.

## What each page gets

| Page | Calendar | Scope |
|---|---|---|
| `/training/` | full width | every course |
| `/training/adv-safe/` | full width | `spc, aspc, rte, lpm, apm` |
| `/training/safe/` | full width | `sa, ssm, popm, sp, sdp, sasm, bo` |
| `/training/safe-industry/` | **none** — whole section dropped | — |
| `/training/safe-found/` | **none** — whole section dropped | — |
| course pages | compact mini | that course |

The hub pages already pass their own `category=` list, so the scoping above is
their existing markup, not a new setting — nothing to configure per page.

### The two pages with no calendar

Their cohorts section is an eyebrow, an H2, a sub-line, the calendar and a
hidden `[wp_events]` feed that exists only to supply it. Hiding just the
calendar would leave the heading standing over nothing, so the **whole section**
is dropped — at render time, by `aa_mcal_hidden_slugs()`, not by editing the
pages. It is never emitted, so it is gone for crawlers and for anything reading
the page as text too; a `display:none` rule would not manage that.

To put a calendar back on one of them, remove its slug from that function. To
retire the section permanently, delete the block in the editor.

## Reading the grid

Each class is a **labelled bar spanning its real days** — a four-day SPC is one
bar four cells wide carrying its code, course name and a `4d` chip. A class
crossing a Saturday renders as one bar per week row; overlapping classes pack
into lanes so nothing ever covers anything else. One-day classes show the code
only. Past cohorts dim to 55% and lose the hover lift.

**Hover or tab to a bar** and a preview card opens below it — track, course,
dates, hours, price and seats, ending in "Click to open". No click needed, and
keyboard focus behaves exactly like hover. Near the edge of the window the card
flips rather than opening off-screen.

**Click a bar** and that cohort opens in the panel beside the calendar:
description, a fact grid (dates · schedule · credits or instructor · seats
left), what's included, the price, and the register button. Seats of 6 or fewer
turn red. The panel is `aria-live`, so a screen reader hears the change.

Below ~1024px the panel moves under the calendar and scrolls into view on
select. Below ~720px the month grid is replaced by a vertical agenda list of
the same cohorts — a 7-column grid is unusable at phone width.

### Registration

The register button never collects anything itself. On a page that already has
the enrol form it scrolls to `#enroll` and pre-selects the cohort through the
same `AA_PICK` bridge the cohort cards use. On a hub page, where there is no
form, it deep-links the course page's enrol section as
`/training/adv-safe/aspc/?cohort=101#enroll` — the `?cohort=` the form's
populator already reads. There is no second registration path and no second
payment path.

### Prices

The panel shows a price **only** when the cohort's event carries a `price`
meta. That is deliberate: a cohort's price is a property of the cohort
(early-bird, group rates), and the prices in `redesign-build/courses.json` are
all stale — every one of the 13 disagrees with its live course page (SA 850 vs
997, ASPC 2495 vs 2899, ARCH 1295 vs 2200). With no `price` meta the panel
shows no price and the button sends the visitor to the course page, where the
authoritative number lives. **Fix `courses.json` before wiring it back in.**

`seats_left`, `hours` and `instructor` work the same way — populate the meta
and the fact appears; leave it empty and the fact is omitted rather than shown
as "TBC".

## Course slugs

`aa_mcal_catalog()` maps each `event_category` slug to a code, a colour and a
course page. The keys are **term slugs, not course-page slugs** — they differ:
`sasm` lives at `/training/safe/asm/`, `sp` at
`/training/safe-industry/team-practitioner/`.

Unlisted slugs still render, falling back to the slug uppercased, the house
teal and `/training/`. Two are deliberately unlisted: **`shwa`** and **`shwp`**,
the SAFe-for-Hardware terms, because they do not map unambiguously onto the two
hardware course pages. The only page that used them no longer shows a calendar;
add them to the catalog if that changes.
