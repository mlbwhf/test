# Calendar — install and behaviour

The calendar replaces the Xylus calendar everywhere it appears, driven by our
own `wp_events` schedule and our own registration instead of Eventbrite.

## Install — three WPCode snippets, one per kind

The calendar ships as **three files**, matching the snippet types your site
already uses successfully (`AA – Home JS`, `AA – Nav JS`):

| # | WPCode snippet type | Name | Paste this | Settings |
|---|---|---|---|---|
| 1 | **CSS Snippet** | `AA – Calendar CSS` | `snippets/calendar/aa-calendar.css` | Auto Insert, Site Wide Header |
|1b | *or* Additional CSS | — | `snippets/additional-css-calendar-section.css` | paste at the end of the sheet |
| 2 | **JavaScript Snippet** | `AA – Calendar JS` | `snippets/calendar/aa-calendar.js` | Auto Insert, **Site Wide Footer** |
| 3 | **PHP Snippet** | `AA – Calendar PHP` | `aa-mini-calendar-wpcode-snippet.php` | Auto Insert, **Run Everywhere** |

Activate 1 and 2 **before** 3, so the first page load that renders a calendar
already has its styles and behaviour.

> **Why three and not one.** The previous build inlined the CSS and JS inside
> the PHP, in a nowdoc — a 60KB paste into a browser code editor. The copy
> WPCode stored came back corrupted: its tail carried a stray top-level
> statement that appears in no version of the source. A snippet that errors
> takes the snippets queued behind it down with it, which is why the homepage
> cohort panel died at the same time and revived the moment this snippet was
> disabled. Split by type, the PHP is half the size, contains no nowdoc, and
> contains no backslashes at all (the JS regexes now live in a JS snippet,
> where WordPress slash handling cannot touch them).

**Never paste the CSS or JS back into the PHP snippet.** That is the specific
change that broke the site.

### CSS: snippet or Additional CSS?

Both work; pick one, never both. `snippets/additional-css-calendar-section.css`
is the same rules wrapped as **section Z** in the house style of your Additional
CSS, where the home page already lives as section Y.

* **Additional CSS** — one canonical stylesheet, one less snippet to manage.
  This matches the principle you set earlier ("why are we introducing another
  CSS in a snippet, why not update the existing CSS").
* **CSS snippet** — keeps the calendar's three parts together, so switching the
  calendar off takes its styles with it, and a bad paste can't touch the sheet
  every other page depends on.

Safe in the shared sheet either way: every selector is scoped under `.aa-mcal`,
and the generator refuses to emit the section if that ever stops being true, so
it cannot reach the course template's `.aa-rd` rules or section Y.

Then, once the calendars render:

1. Deactivate the old **"AA — Class Calendar"** JS snippet. `[aa_mini_calendar]`
   is a strict superset of it, including the `AA_PICK` hand-off, so running
   both would double-render.
2. Deactivate the **Xylus** calendar plugin.

Deactivating the PHP snippet is the whole undo — both old shortcodes go
straight back to the plugin.

### If a calendar does not appear

Put `[aa_mcal_selftest]` on any page and view it **as an administrator** (it
prints nothing for anyone else). It reports whether the PHP snippet ran and
who owns each shortcode tag. Unstyled block of text → the CSS snippet. Styled
but frozen, no bars → the JS snippet. Nothing at all → the PHP snippet.

Clear any page cache before judging.

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

## Repeating courses and duplicates

**A course that runs weekly** — RTE starting Monday, Wednesday and Friday every
week — would otherwise put three bars in one week that are identical down to
the pixel: same code, same colour, same name, same day chip. When a course
appears more than once in the visible month its bars show the **date range**
instead of the course name, since that is the only field that differs. A course
appearing once keeps its name, which is more useful there.

**The same class stored twice** is collapsed to one bar. A class can exist as
more than one `wp_events` post — an Eventbrite import beside a hand-made entry,
a re-import, or one class tagged with two terms meaning the same course (`sasm`
and `asm` both resolve to SASM). The calendar keys on **course code + start +
end**, not the term slug, so the alias case collapses too. The first post wins,
but any optional fact it lacks is filled in from the duplicate — if the import
carries the dates and the manual entry carries `seats_left`, you keep both.
`[aa_mini_calendar debug="1"]` lists what was merged, for admins only.

This hides the symptom, not the cause: duplicate posts still sit in `wp_events`
and still feed anything else reading that post type. Worth cleaning up at source.

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
