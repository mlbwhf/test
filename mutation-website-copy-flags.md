# Website Copy — Canon Review Flags (for owner review)

**Date:** 2026-06-11 · **Reviewer:** Claude Code agent
**Scope:** `mutation-website-copy.md`, `mutation-launch-content.md`,
`mutation-discord-runbook.md` (seed posts), checked against the four
canonical files integrated today, the two canonical Claude Code skills,
and the canonical scorecard YAML.

**Per your instruction, nothing has been changed — each item below is a
flag with a proposed fix, awaiting your call.**

---

## 🔴 Flag 1 — DeltaCore name collision (the big one)

The canonical matrix YAML reveals that **Deltacore is the novel's
protagonist company** (Oliver, Maya, Daniel, Max, Rhea; Helix is the
competitor taking its mid-market; the matrix is the Chapter 6 artifact).

My cautionary case study `examples/case-study-deltacore.md` — written
before I had any novel content — invents an **unrelated** company with the
same name (a 2,800-person industrial equipment manufacturer). Website
copy compounds this: **Email 2** sells "the DeltaCore arc — the signal
arrived twice" to the `band-blind` segment, which is the composite's arc,
not the book's. Readers who buy the novel will expect Deltacore's actual
story and find a different company.

The handover brief's repo structure listed `case-study-elevate-labs.md`
and `case-study-deltacore.md` — in hindsight these were probably meant to
be derived from the books. *Elevate Labs may have the same issue* — please
confirm whether Elevate Labs appears in either book.

**Options:** (a) rename the composite (e.g. "Forsberg Industrial") and
keep it as the cautionary case; (b) replace it with the novel's actual
Deltacore arc once the FINAL docx is in Drive; (c) both — novel-derived
Deltacore case + renamed composite as a fourth example. Email 2 copy
follows whichever you choose.

## 🟠 Flag 2 — "10 minutes" vs canonical "~15 minutes"

- `mutation-website-copy.md` §4 headline: "Find out where you stand in
  **10 minutes**."
- Canonical skill: the full assessment "takes about **15 minutes**."
- Blog post 1 already says "fifteen minutes" — so the site contradicts
  its own blog.

**Proposed:** change the /assessment headline to 15 minutes, or pitch the
**rapid mode** (6 questions — that one genuinely fits "under 5 minutes")
as the hook with the full scan behind it.

## 🟠 Flag 3 — "30-day plan" vs canonical 30-60-90

- Home subhead: "gives you a **30-day plan** to close it"; /assessment
  step 3: "Start your **30 days**"; Email 1 framing.
- Canon: both skills produce a **30-60-90-day action plan**. (The
  instant ScoreApp result showing the band's 3 recommended actions is
  fine per the YAML — the flag is only the "30-day plan" label for the
  overall deliverable.)

**Proposed:** "a 30-60-90-day plan" on Home; "Start your first 30 days"
for the step copy (accurate — the first tranche is 30-day actions).

## 🟠 Flag 4 — "The lowest dimension sets the work program" is not canon

Email 1 and Blog post 2 lean on: *"The framework's rule: the lowest
dimension, not the total, sets the work program."* That rule is my
Framework Guide draft's invention. Canon's nearest statements: the report
names the **top 3 specific weaknesses** with practices to install
(Mutation Readiness skill), and the Mutation-Aware action *"pick the two
levers your organization scored lowest on"* (Chapter 9 framing). The
companion Innovation Framework skill does have a weakest-principle rule —
but for principles, not dimensions.

**Proposed:** either bless the rule (it's a good one, and the guide can
keep it as framework doctrine you've approved), or reword the email/blog
to "your lowest one or two dimensions are where the work starts." Your
call — this is doctrine, not arithmetic.

## 🟠 Flag 5 — Invented empirics presented as data

None of these have a source yet; all read as claims of fact:

1. Blog 2: leadership-team spread "is **routinely ten points or more**."
2. Email 4: "the **CEO-scores-12-points-higher** problem" (number comes
   from my composite Elevate Labs case, not field data).
3. Blog 1: "**Most organizations** that take it for the first time land
   in Mutation-Aware."
4. Discord seed post 3: "Q5.3 is the **most-skipped question in early
   data**" — there is no early data yet.

**Proposed:** soften to forward-looking/anecdotal phrasing until the
15-20-user beta (your risk-register item) produces real numbers — which
would then make these claims true and citable.

## 🟡 Flag 6 — Scrum Guide age (fact-check)

Blog 3: "The Scrum Guide has been free for **twenty-five years**." The
Scrum Guide was first published in **2010** (≈16 years by 2026); Scrum
itself dates to 1995 (≈30 years). **Proposed:** "free for over fifteen
years" or "Scrum has been an open framework for thirty years."

## 🟡 Flag 7 — Matrix naming and axes

Canon (novel Ch. 6): "**Innovation Matrix** — Four Types × Four
Patterns," axes *Types* (Product / Process / Business Model / Customer
Experience) × *Patterns* (Incremental / Architectural / Radical /
Disruptive), with the Christensen caveat. Website /framework page says
"the 4×4 matrix" — harmless as shorthand, but any copy that names axes or
cells must use Types/Patterns vocabulary (my earlier Ambition/Unit-of-
change axes are gone from the repo as of today). If the matrix is ever
shown on the site, the caveat ships with it per your instruction — the
regenerated SVG already embeds it verbatim.

## 🟢 Verified clean against canon

- Blog 1's six dimension one-liners — all six match canonical
  definitions, including the "not the 2018 market" phrasing.
- Blog 1: "Eighteen questions… score out of 72… three bands" ✓.
- Discord seed 4: mutation latency < 21 days ✓ (Chapter 9 / skill).
- Discord seed 5: Q4.3 quarterly-business-review framing ✓.
- Email 3: weekly 30-minute signal review ✓ (note the canonical agenda is
  now Cluster–Triage–Assign–Capture if the email ever details it).
- ScoreApp config line: floor(sum × 12 / 15), /72, band ranges ✓.
- Band names, ranges, and the "three actions per band" on the result
  page ✓ (each canonical band carries exactly 3 recommended actions).

## 📘 Word/page-count check

You asked me to sanity-check "30,000 words, 105 pages"-type references:
**the current website copy and launch content contain no word-count or
page-count claims at all**, so there is nothing to correct. If you want
such claims on /books, I'd need the manuscripts — dropping
`The_Innovation_Playground_FINAL_with_Ch6_Matrix.docx` (and ideally the
Operating Manual equivalent) into Drive would also let me resolve Flag 1
option (b), and pull real sample chapters, blurbs, and pull quotes for
the /books sub-pages.
