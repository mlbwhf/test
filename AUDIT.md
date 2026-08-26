# Snippet & CSS audit — agile-agilist.com

46 WPCode snippets, 33 active. Below: what each one is for, whether it still
has a job, and why. Split by how sure I am, because I could only read the
bodies of the ones you pasted — WPCode stores snippets in a post type the
site API does not expose, so I could not fetch the rest.

Do this in the order given. Each group is independent, and each step is a
toggle rather than a delete, so anything can go straight back.

---

## Group 1 — Superseded, and actively conflicting (turn OFF first)

These do the same job as the new snippets, later in the page lifecycle, so
they win. This is the group that caused the last week of symptoms.

| ID | Snippet | Why it goes |
|---|---|---|
| **27849** | `AA – Course JS` | **The big one.** Rewrites the hero (`buildHeroV2`), fills `#aa-agenda` and `#aa-pick` with its own schedule, injects a second Course JSON-LD, and geo-IPs the visitor to rewrite every price — that is where **C$3,910** came from. Fully replaced by the register snippet. |
| **30934** | `AA — Class Calendar` | The old calendar JS. `[aa_mini_calendar]` is a strict superset including the `AA_PICK` bridge, so both running double-renders. |
| **26810** | `Agile Agilist – Auto cohort schedule` | `[aa_cohorts]` — its own schedule, month calendar, filter bar, coupon box and form accordion, plus ~200 lines of inline CSS. Entirely replaced by `[aa_course_register]`. |
| **26894** | `Fluent Forms – Cohort Date options (form 3)` | Populates a Fluent Form dropdown from `wp_events`. There is no Fluent Form in the new flow. |
| **29961** | `aa-ff-cohort-validation-fix` | Works around Fluent Forms rejecting JS-populated cohort values. Same reason. |
| **29892** | `aa-eec-mini-fix` | Patches the Xylus mini calendar's month/category bug. The takeover replaces Xylus. |
| **29893** | `aa-eec-category-fix` | Patches Xylus honouring `category=`. Same. |

**Caveat on 27849 you already hit:** it also draws the hero rail on course
pages the new snippet does not cover yet — every course except SPC, ASPC, RTE
and the three AI-Native ones. Those six now get the new hero; the rest fall
back to their plain markup, which is why the right column went blank. Two ways
forward: send me the cadences for the remaining courses (a one-line row each),
or say the word and I will make the register snippet render a simple
"upcoming dates" card on courses that have no cadence yet, so nothing is ever
blank.

**Then the Xylus plugin itself** can be deactivated — nothing left reads it.

---

## Group 2 — Duplicates (delete the older of each pair)

| Keep | Delete | Note |
|---|---|---|
| 32394 `AA – Register JS` | **32332** | Aug 25 copy. Two copies bound every handler twice until the guard went in. |
| 32393 `AA – Register CSS` | **32331** | Aug 25 copy. |
| 32391 `AA – Register PHP` | **32333** | Already disabled. This is the one that was winning and hiding autoplace. Rename 32391 to `AA – Register PHP`. |
| 29372 `AA – Message Pivot CTAs` | **29371** | Same name, one active one not — confirm which is live before deleting. |
| 29056 `AA — NAV JS` | **29075** | Same name, one active one not. The CSS comments pin **v18** as the one the nav CSS pairs with — check which of the two that is before deleting either. |

---

## Group 3 — Wrong configuration, not wrong code

| ID | Snippet | Problem |
|---|---|---|
| **32310** | `AA – Calendar CSS` | Inactive **and** set to *Site Wide Footer*. CSS in the footer paints after first render. Either activate it as *Site Wide Header*, **or** leave it off because section Z is already in Additional CSS — but not both, see below. |

---

## Group 4 — The Additional CSS sheet

Two provable problems in the sheet you pasted:

1. **Section Y is in there twice.** The whole home-page block, `/* Y. HOME PAGE */`
   through `END — Y. home page`, appears verbatim twice at the end. That is
   **~28KB served twice**, on every page of the site. Deleting the second copy
   changes nothing visually.
2. **The Space Grotesk `@import` is in twice** — once at the top, once indented
   just below it. A duplicate `@import` is a second render-blocking request.

And one to decide:

3. **Section Z (the calendar) may be duplicated across two homes.** Section Z in
   the sheet and the `AA – Calendar CSS` snippet are the *same 105 rules* —
   verified byte-for-byte in the repo. Right now the snippet is off, so there
   is no double. Keep it that way: **section Z in the sheet, snippet off**, or
   the reverse. Never both, or they drift.

**Sheet size after the dedupe:** roughly 28KB smaller with no visual change.

---

## Group 5 — Already inactive (13). Leave, or bulk-trash

`32012` · `28840` · `28830` · `28796` · `28630` · `28592` · `28589` · `27433`
· `11960` · `11959` · plus the inactive halves of the pairs above.

Inactive snippets cost nothing at runtime. The argument for trashing them is
only that a list of 46 is hard to reason about — which is exactly how a stale
duplicate won for a week. **27433 `AA – Global CSS` is the one to check before
trashing:** its name says header/footer/menu/calendar, and if anything in it is
*not* also in the Additional CSS sheet, turning it off has already cost you
those rules.

---

## What I could not audit

I could not read the bodies of these, so they are listed but not judged.
Paste any of them and I will fold them in:

`31160` AA-PDU fix by duration · `31101` AA-Strip-Aggregatorator ·
`31067` dynamic badge share image · `30856` AA — QBank Assessment Engine ·
`29965` AA — MENU DEBUG OVERLAY · `29962` AA — MOBILE MENU HARD RESET ·
`29453` aa-flagband *(read — keep, it builds the Assessments split band)* ·
`29361` AA-Assessment Engine · `29328` aa-hreflang · `29327` AA-Lang-Switcher ·
`28811` event-page Register CTA · `28718` AA Logo wall · `27566` AA – Book a
Consult popup · `32237` AA-Home · `31972` aa_home_cohorts *(read — keep)* ·
`32243` aa_mini_calendar *(read — keep)*

Two worth a look on their own:

- **29965 `AA — MENU DEBUG OVERLAY`** is *active*. A debug overlay running in
  production is worth a second look.
- **31101 `AA-Strip-Aggregatorator`** is active and, from the name, strips
  `aggregateRating` — which the new `AA – Claims` snippet also does. Probably a
  duplicate; send me its code and I will confirm.

---

## Expected result

| | Before | After |
|---|---|---|
| Active snippets | 33 | ~24 |
| Additional CSS | ~140KB | ~112KB |
| Systems drawing the course page | 2 | 1 |
| Course JSON-LD blocks per page | 2 | 1 |
| Geo-IP call per page view (`ipapi.co`) | 1 | 0 |
