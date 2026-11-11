# Report AI — freshness & versioning policy

Standing rule as of 2026-08-22. Applies to every index and report.

A measurement institution is judged on whether its numbers are current and whether
it is honest about what changed. Two obligations follow:

1. **Every page has a cadence** and a visible next-review date.
2. **Every update shows the comparison** — the previous value, the new value, the
   delta, and why it moved. We never silently overwrite a figure.

---

## 1. Cadence tiers

| Tier | Cadence | Applies to | Test |
|---|---|---|---|
| **CRITICAL** | Monthly | Figures that move monthly, or live deals whose terms are still being negotiated | "Could this number be wrong within 30 days?" |
| **STANDARD** | Quarterly | Sourced statistics from bodies that publish on a quarterly/annual rhythm | "Does the source refresh a few times a year?" |
| **STABLE** | Semi-annual | Definitions, methodology, historical series, closed events | "Is the underlying fact settled?" |

Anything that carries a MEDIUM confidence chip and a live negotiation (e.g. the
Nvidia/OpenAI financing) is automatically CRITICAL regardless of tier logic —
uncertainty plus movement is the highest-risk combination we publish.

## 2. What an update must contain

An update is not a date bump. To count as updated, a page needs:

1. **The "What changed" block** (`whats-changed-block.html`) placed directly under
   the stat-tile strip: previous value → new value → delta → source and date.
   Keep the last **three** revisions visible; older ones roll into the methodology note.
2. **The figure itself changed everywhere it appears** — stat tiles, prose, tables,
   FAQ answers, and the JSON-LD. A figure updated in the tile but stale in the FAQ is
   the failure mode most likely to embarrass us.
3. **`dateModified` bumped** in the Article schema, and the visible "Updated <month>"
   stamp changed to match. These two must never disagree.
4. **Confidence re-rated** if the evidence changed quality — a MEDIUM that a primary
   source later confirms becomes HIGH, and we say so in the change row.
5. **No change is also a result.** If we check and nothing moved, we still stamp
   "Reviewed <date> — no change" rather than leaving the page looking unattended.

## 3. Comparison discipline

- **Never overwrite silently.** The previous value stays visible in the change block.
- **Restated figures are labelled.** If a source revises its own history (Gartner does
  this often), we mark the row `RESTATED` and keep both numbers.
- **Direction matters more than the point value.** Where a series exists, the update
  should refresh the whole series, not just the headline year.
- **DERIVED figures are recomputed**, not carried forward, whenever an input changes.

## 4. Review workflow (per page)

1. Re-check the primary source. Record: unchanged / revised / superseded / retracted.
2. If revised → update the figure everywhere (§2.2), add the change row, re-rate
   confidence, bump `dateModified`.
3. If superseded by a better source → swap the citation and note the substitution.
4. If retracted → strike the figure the same day, regardless of cadence. Corrections
   are not scheduled work.
5. Set the next review date on the page.

## 5. Automation

A recurring task runs the pass:

- **Monthly** (1st): every CRITICAL page.
- **Quarterly** (1 Jan / 1 Apr / 1 Jul / 1 Oct): every STANDARD page, plus a sweep of
  CRITICAL pages missed in the month.
- **Semi-annual** (1 Jan / 1 Jul): STABLE pages.

The register in `refresh-register.md` is the work list. Each run updates the register's
"last reviewed" column, so drift is visible.

## 6. What this buys the funding application

The independence claim rests on being auditable. A published cadence, a visible change
history per figure, and a "reviewed, no change" stamp are the difference between a
statistics site and a measurement institution. This policy is the mechanism.
