# AI predictions: forecasting & scoring track

**Separate workstream.** Not part of the pillar/cluster work. Opened 11 Sep 2026
on the owner's instruction that prediction content needs its own forecasting and
update discipline.

---

## Why predictions can't ride the normal refresh cadence

The freshness policy in CLAUDE.md is built for **statistics**, which go stale. A
prediction fails differently, and in three ways the current register cannot catch:

1. **It resolves.** On a fixed date the claim becomes true or false. Nothing in the
   register currently fires on a resolution date, so a resolved prediction sits on
   the site indefinitely still phrased as a forecast.
2. **Its odds move before it resolves.** A legislative forecast at 30% passage is a
   different page at 70%, with no underlying statistic having changed.
3. **It gets superseded.** The forecaster revises, or the scenario's premise is
   overtaken. The old number is not wrong, it is withdrawn — which the RESTATED
   rule half-covers but was written for source restatements, not forecaster updates.

**The consequence:** a stale statistic is embarrassing; an unresolved prediction
left standing past its own resolution date is a credibility problem, because the
site is visibly not keeping its own score.

## The opportunity

Almost nobody scores their own predictions in public. A page that says *here is
what was forecast, here is what happened, here is our hit rate* is a genuine
differentiator and exactly the house voice — sourced, dated, honest about misses.
The strong version of this track is not "keep the forecasts fresh," it is
**publish the scoreboard.**

## Inventory (from search excerpts — each page still needs opening to confirm)

| Page | The prediction | Resolves | Urgency |
|---|---|---|---|
| **2297** pillar *Will AI Replace My Job?* | Forrester: ~**50% of AI-attributed layoffs reversed** by end-2026 | **Dec 2026** | 🔴 resolves in ~3 months, and it's on a page we just built |
| **1102** AI Kill-Switch Bill | Odds of US passage; House + Senate proposals | live legislative | 🔴 CRITICAL — live negotiation, odds move weekly |
| **931** Daniel Kokotajlo | ~**70%** odds of AI catastrophe; AI 2027 scenario → superintelligence | 2027 scenario dates | 🔴 AI 2027 milestones start landing *next year* |
| **1111** Deepfakes & AI Fraud | US losses → **$40B by 2027** | 2027 | 🟡 |
| **1234** AI Video Market | → **$47.8B by 2034** | 2034 | 🟢 long-dated, but interim path checkable |
| **498 / 576** Dark Side of AI | 2030 forecast | 2030 | 🟢 |
| **967** AI Bubble Tracker | capex-revenue gap thesis | continuous | 🟡 no fixed date; needs a stated test |
| **88** AI Jobs Report | WEF **170M created / 92M displaced** by 2030 | 2030 | 🟢 but interim WEF revisions matter |

## Proposed approach (for approval — not started)

**1. A prediction ledger.** Every forecast on the site gets a row: claim, forecaster,
date made, resolution date, what we said at the time, current status —
`OPEN` / `HIT` / `MISS` / `PARTIAL` / `SUPERSEDED` / `UNFALSIFIABLE`.

**2. Resolution dates become a trigger.** The register is cadence-driven (monthly /
quarterly / semi-annual). Predictions need a second trigger type: *fires on date X
regardless of cadence.* A prediction inside 90 days of resolving is automatically
CRITICAL.

**3. Score honestly, including the misses.** A tracked miss is worth more than a
quietly deleted one. `UNFALSIFIABLE` is a real verdict and should be used — a lot
of AI forecasting is not actually a claim.

**4. Then a hub page.** `/indexes/ai-predictions/` or `/reports/ai-predictions/` —
the scoreboard, with per-forecaster and per-domain pages beneath it. This should be
built *after* the ledger exists, not before, or it becomes another thin list page.

## Open questions for the owner

- **Do we score third-party forecasts only, or do we make our own?** Scoring others
  is lower-risk and already differentiating. Making our own is more valuable and
  means publishing our own misses. Recommend starting with scoring others.
- **Where does the hub live** — a tenth `/indexes/` section, or under `/reports/`?
- **Kokotajlo (931) is the test case.** AI 2027 has dated milestones that begin
  resolving in 2027, it is already on the site, and it is the page most likely to
  look foolish if left unmaintained. Suggest starting there.

## Immediate, regardless of the rest

The Forrester ~50% reversal figure on the new pillar (2297) resolves **this December**.
Whatever shape this track takes, that one needs a resolution check diarised now — it
is on a page published under our name with a date attached.
