# Calendar — install and behaviour

One file: **`aa-mini-calendar-wpcode-snippet.php`**. It replaces the Xylus
calendar everywhere it appears, driven by our own `wp_events` schedule and our
own registration instead of Eventbrite.

## Install

WPCode → **Add Snippet → PHP Snippet** → paste the whole file → **Auto Insert,
Run Everywhere** → Save + Activate.

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

Each class is a **stripe spanning its days** — a four-day SPC is one continuous
band across four cells, rounded only at the true start and end, so a class that
crosses a week boundary continues on the next row in the same lane. Clicking a
stripe goes to our own registration: `#enroll` on the page it sits on, or the
course page when the calendar is a hub calendar. The legend lists every course
with a class in the visible month.

Overlapping classes stack in lanes: five on the wide hub calendars, three on
the compact mini. Anything beyond that shows as a **`+N`** on the day rather
than disappearing — the legend still names those courses, so a silently
dropped class would have the grid contradicting the legend below it.

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
