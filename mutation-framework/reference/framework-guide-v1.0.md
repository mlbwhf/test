# The Mutation Readiness Framework Guide

**Version 1.0-draft** · June 2026
**Status: DRAFT — pending owner review and sign-off before publication.**

*The definitive guide to the Mutation Readiness Framework: the rules,
definitions, instruments, and cadences for building an organization that
adapts faster than its market changes.*

This guide is licensed under Creative Commons Attribution-ShareAlike 4.0
(CC BY-SA 4.0), pending owner confirmation. You may share and adapt it with
attribution, under the same license.

---

## 1. Purpose and Use

Every organization is built for the environment that existed when it was
designed. Environments no longer hold still long enough for that design to
pay back. The arrival of capable AI has compressed the cycle further: the
cost of producing software, content, analysis, and coordination is
collapsing, and with it the moats built on those costs.

**Mutation readiness** is an organization's capacity to sense, decide, and
reconfigure faster than its environment changes. It is not a transformation
program with an end date. It is an operating property, like solvency or
safety — something you maintain, measure, and can lose.

This guide is the canonical definition of the framework. Like other
reference guides of its kind, it is deliberately minimal: it defines the
concepts, the instruments, and the cadence, and leaves the application to
practitioners. The companion books — *The Innovation Playground* (a novel)
and *Mutation Readiness: An Operating Manual for Innovation in the Age of
AI* — supply narrative, evidence, and extended practice. The framework
repository supplies the machine-readable instruments. Where any of these
disagree with this guide, this guide prevails.

**Who this is for.** Leaders accountable for an organization's continued
relevance; practitioners running the framework inside teams; facilitators
teaching it; and builders integrating it into tools (the entire framework is
published in machine-readable form for that purpose).

**How to use it.** Read it once end to end (it is short by design). Then run
the Mutation Readiness Scorecard, plot your portfolio on the 4×4 Innovation
Matrix, install the weekly signal review, and reassess quarterly. That loop
— assess, plot, review, reassess — is the whole operating system. Everything
else is technique.

## 2. Definitions

**Mutation.** A change in the environment significant enough that the
organization's current design is no longer the right answer. Mutations are
not projects, trends, or quarters; they are shifts in what works. The
emergence of capable generative AI is a mutation. So was the smartphone. So
is a regulatory regime change in your industry.

**Mutation readiness.** The organization's capability to sense, respond,
and adapt at AI-age speed — measured across six dimensions (§3) on a 0–72
scale with three bands:

- **Mutation-Blind (0–30):** the organization is operating on lagging
  metrics in an environment that is mutating around it. Disruption is
  probably already happening, undetected.
- **Mutation-Aware (31–50):** the organization can sense change but cannot
  yet act on it at the right cadence. The sense-to-respond gap is the
  primary risk.
- **Mutation-Ready (51–72):** the organization is operating in the top
  decile. The risk now is complacency.

**Signal.** A discrete, observable piece of evidence that a mutation may be
under way: a customer behaving differently, a technology crossing a
capability threshold, a competitor making an otherwise-irrational move, a
regulation drafted. Signals are logged, not debated, at the point of
detection (see the SignalNet template).

**Weak signal.** A signal supported by a single source or speculative
interpretation. Weak signals are the cheapest information an organization
will ever acquire about its future; the framework's first rule is that
logging them must cost almost nothing.

**Leading indicator.** A measure that moves *before* an outcome does, while
intervention is still possible. Every dimension and every initiative in the
framework carries at least one leading indicator (see the Leading Indicator
Dashboard template). Lagging indicators are kept for accountability; leading
indicators are kept for steering.

**Experiment.** A time-boxed, cost-capped initiative with kill criteria
written *before* funding. An initiative without kill criteria is a
commitment, which is legitimate — but the framework requires the
organization to say which one it is making.

**Kill criteria.** The evidence, defined in advance with a date, that ends
an experiment. Kill criteria written after a pitch has been approved are
theater.

## 3. The Six Dimensions

Mutation readiness is measured across six dimensions. Each is necessary;
none is sufficient. The dimensions are deliberately cross-functional — no
single department can own mutation readiness, and an organization that
assigns it to one has already failed the assessment.

1. **Signal Sensitivity.** The capability to detect, interpret, and act on
   weak signals before lagging metrics confirm them. Operationalized by the
   SignalNet — a distributed, semi-anonymous log any employee can write to
   — and a weekly, anomaly-focused signal review.

2. **Structural Flexibility.** The organization's ability to reshape itself
   faster than competitors can retool: teams aligned to streams of value
   rather than functions, concept-to-validated-learning in under 90 days,
   restructuring decisions acted on within a quarter.

3. **AI Talent Flywheel.** The capability to attract, retain, and integrate
   AI-literate talent across functions — embedded in every major team
   rather than isolated in a single AI/ML silo, and exposed to strategy
   decisions, not just implementation work.

4. **Ambidextrous Capital.** The discipline of balancing exploit (proven
   operations) with explore (uncertain bets) in the funding model: a
   protected exploration budget separate from the core P&L, bets evaluated
   on learning yield, experiments that can survive their first quarterly
   business review.

5. **Ethical Guardrails.** Containment-as-velocity: the institutional
   discipline that lets you ship AI fast without dramatic reputational
   failure. Explicit operating boundaries and a recalibration cadence for
   every AI deployment; a governance function with engineering rather than
   legal at its centre; audit-quality explanations on request.

6. **Narrative Coherence.** The shared story that lets the organization act
   in concert under uncertainty: employees who can say what the company is
   for in the *current* market, a strategic narrative refreshed within the
   past 18 months, new hires who can articulate it after their first month.

The full instrument — 18 questions, three per dimension, with scoring rubric
— is defined in §6 and published in machine-readable form in the framework
repository (`assessments/mutation-readiness-scorecard.yaml`).

## 4. The 4×4 Innovation Matrix

The matrix plots every initiative in the portfolio on two axes.

**Ambition** (columns): *Optimize* — make the existing thing measurably
better; *Extend* — take it to new users, markets, or uses; *Transform* —
replace how it works while keeping what it is for; *Mutate* — change what
the organization is for, obsoleting part of yourself before the market does.

**Unit of change** (rows): *Product* — what you sell; *Process* — how work
gets done; *Business model* — how value is captured; *Organization* — how
people, structure, and incentives are arranged.

The matrix exists to make portfolio shape visible. Three rules govern its
use:

1. **Every active initiative gets exactly one cell.** Arguments about which
   cell are not friction; they are the diagnosis surfacing.
2. **Healthy portfolios hold positions in at least three of the four
   ambition columns at all times.** A portfolio entirely in Optimize/Extend
   is optimizing itself into irrelevance; a portfolio entirely in
   Transform/Mutate has mistaken adrenaline for strategy.
3. **The Mutate column is funded only with capped, kill-criteria
   experiments** — never from the core P&L, and ideally shielded
   structurally (separate team, separate rules, separate building if
   necessary).

Initiatives drift left over time as they mature. The drift is normal;
*unnoticed* drift is how transformation programs quietly become maintenance
programs. Re-plot quarterly.

## 5. The Five Levers of Reinvention

> **Draft note:** the canonical Five Levers are defined in Chapter 9 of
> *Mutation Readiness: An Operating Manual for Innovation in the Age of
> AI*. The lever names below are a working draft and must be reconciled
> against Chapter 9 by the author before v1.0 final.

When an assessment reveals a gap, these are the five levers an organization
can actually pull. Every intervention the framework prescribes is a setting
of one or more of these levers; if a proposed action does not map to a
lever, it is commentary, not intervention.

1. **Capital.** Move money on a rolling cadence instead of an annual one.
   Reallocation ratio — the percentage of innovation budget that moved this
   quarter — is the lever's gauge. Zero for three consecutive quarters means
   the lever is rusted shut.

2. **Cadence.** Install the operating rhythm: weekly signal review,
   quarterly reassessment and portfolio re-plot, annual recalibration (§7).
   Cadence is the cheapest lever and the most commonly skipped, because
   calendars are where intentions go to die.

3. **Capability.** Build AI fluency and experimentation skill deliberately:
   embedded in real workflows with measured before/after deltas, not
   training catalogs. Capability investments are experiments too — they
   carry leading indicators and review dates.

4. **Configuration.** Make structure cheap to change: modular processes,
   value-stream funding, teams that can form and dissolve in weeks. The
   gauge is the last actual reconfiguration, timed end to end.

5. **Conviction.** Leadership behavior and incentives. Leaders run their own
   experiments and publish their own position changes; compensation rewards
   adaptation. This lever cannot be delegated, which is why it is listed
   last and matters first.

## 6. The Mutation Readiness Scorecard

The scorecard is the framework's core instrument: **18 questions, three per
dimension, each rated 1–5** (strongly disagree → strongly agree), N/A
allowed. It is published in full in Appendix A of the Operating Manual and
in machine-readable form in the framework repository.

**Scoring rubric.** Dimension score = sum of the three answered questions
(max 15), converted to the 0–12 headline number by floor(sum × 12 / 15);
with N/A items the denominator reduces proportionally. Total = sum of the
six dimension scores, out of **72**, reported alongside a six-axis profile
(radar chart in rendered reports); if any items are N/A the total is also
normalized to a percentage. Band thresholds: Mutation-Blind 0–30,
Mutation-Aware 31–50, Mutation-Ready 51–72.

**Administration.** Choose the unit of analysis first — yourself, a team,
or the whole organization — and hold every answer to it. A 50-person team
can be Mutation-Ready inside a Mutation-Blind enterprise, and a "yes" that
applies only to a sub-team is a 3, not a 5. Three modes, in increasing
order of value:

- *Personal scan* (~15 minutes): one leader answers. Fast, free, and
  systematically optimistic — useful as a door, not a diagnosis.
- *Team scan*: each member of a leadership team answers independently
  before seeing each other's responses. The spread between answers is
  itself a primary finding; a team whose scores on Narrative Coherence
  diverge by more than 4 points has located its real agenda.
- *Quarterly trend*: the same team scan repeated on the recalibration
  cadence. The trend line matters more than any absolute score.

A *rapid mode* exists for screening: six questions, one per dimension
(Q1.2, Q2.2, Q3.2, Q4.3, Q5.3, Q6.1), scored out of 30 with bands 0–12 /
13–22 / 23–30. It is a screen, not a diagnosis.

**Interpretation rules.**

- The *lowest* dimension, not the total, sets the work program. Dimensions
  compound; a 12-12-12-12-12-2 profile underperforms a 9-9-9-9-9-9 one.
- Each band carries prescribed actions and a reading list (published in
  the scorecard specification), delivered as a 30-60-90-day plan in
  facilitated reports. A key Mutation-Aware metric: **mutation latency**,
  the time from signal identification to organizational decision —
  target under 21 days.
- Scores are self-reported and will inflate under audience pressure. Never
  attach compensation or public league tables to scorecard results; the
  instrument measures honesty as much as readiness, and incentivized
  scores measure neither.

The full question text, band definitions, and actions are normative and
published in the repository at
`assessments/mutation-readiness-scorecard.{md,yaml}`. The companion
**Innovation Framework Scorecard** (15 questions across the five
Principles of the Innovators Framework: Fail Forward, Open Communication &
Candid Feedback, Challenging Mental Models, Flexible Structure / Agile
Decision-Making, Growth Mindset at Scale; scored /75 into Innovation
Theatre / Practicing / Native) measures the cultural operating system
underneath these practices. Run it *first*: an organization in Innovation
Theatre will fail at mutation readiness regardless of what it installs.

## 7. Recommended Cadence

The framework runs on three loops. All three are required; the framework
does not function as an annual event.

**Weekly — signal review (30 minutes).** Fixed agenda: new signals (10
minutes, 60 seconds each, no debate), status changes on watched signals (10
minutes), and at most one escalation decision (10 minutes). One owner, one
log, same slot every week. This meeting is the framework's heartbeat; if
only one practice survives contact with your calendar, keep this one.

**Quarterly — reassessment and re-plot (half day).** Re-run the scorecard as
a team scan; re-plot the portfolio on the 4×4 matrix; review the leading
indicator dashboard and the KPI scorecard; audit the quarter's surprises
against the SignalNet (was the miss a sensing failure or a deciding
failure?); set or reset one lever (§5).

**Annual — recalibration (one to two days).** Step back from the loops:
re-examine whether the dimensions are weighted right for your context,
retire gamed indicators, review every kill decision of the year for false
positives, and decide deliberately what the organization will *stop*
sensing — attention is the scarcest budget the framework spends.

## 8. Glossary

| Term | Definition |
|---|---|
| **Band** | One of three scored ranges on the scorecard: Mutation-Blind (0–30), Mutation-Aware (31–50), Mutation-Ready (51–72). |
| **Dimension** | One of the six measured components of mutation readiness (§3). |
| **Experiment** | A time-boxed, cost-capped initiative with pre-written kill criteria. |
| **Kill criteria** | Evidence, defined before funding, that ends an experiment by a set date. |
| **Kill latency** | How long an initiative survives past its own kill criteria. Target: zero. |
| **Leading indicator** | A measure that moves before the outcome does, while action is still possible. |
| **Lever** | One of the Five Levers of reinvention (Operating Manual, Chapter 9; working draft names in §5). |
| **Mutation** | An environmental change large enough that the organization's current design is no longer the right answer. |
| **Mutation exposure** | The cost of *inaction* if a signal proves real; the systematically underpriced side of the risk ledger. |
| **Mutation latency** | Time from signal identification to organizational decision. Target: under 21 days. |
| **Reallocation ratio** | Percentage of innovation budget that moved between initiatives in a quarter. |
| **Signal** | A discrete, observable piece of evidence that a mutation may be under way. |
| **SignalNet** | A distributed, semi-anonymous logging system for any employee to surface weak signals, with a weekly review cadence (Operating Manual, Appendix E). |
| **Team scan** | Scorecard mode where each leader answers independently; the spread is a primary finding. |

## 9. Acknowledgments and References

The Mutation Readiness Framework was developed by Mark Saymen and is
elaborated in *The Innovation Playground* and *Mutation Readiness: An
Operating Manual for Innovation in the Age of AI*.

The framework integrates work by Amy Edmondson (psychological safety,
intelligent failure), Mary Murphy (cultures of growth), Carol Dweck
(mindset), Kim Scott (radical candor), Ethan Mollick (co-intelligence),
Mustafa Suleyman (containment), Marco Iansiti and Karim Lakhani (the AI
factory), Rita McGrath (inflection points), Adam Grant (hidden potential),
Matthew Skelton and Manuel Pais (Team Topologies), Peter Senge (the
learning organization), and the Anthropic interpretability research from
2024–2025.

It also stands on ground prepared by the lean startup and
evidence-based innovation tradition (build–measure–learn, innovation
accounting); portfolio approaches to innovation ambition (McKinsey's three
horizons and their critics); the agile and lean-portfolio body of practice,
including the Scaled Agile Framework's treatment of lean budgeting and
value streams; the organizational-learning literature on psychological
safety (Edmondson) and dynamic capabilities (Teece); and the format example
of the Scrum Guide, which demonstrated that a framework's canonical text
can and should fit in a short, versioned document.

Contributions, translations, and case studies are welcome — see
`CONTRIBUTING.md` in the framework repository.

---

**Changelog**
- **v1.0-draft (June 2026)** — initial draft for owner review. Dimensions,
  questions, scoring rubric, bands, and band actions reconciled with the
  canonical assessment (Appendix A of the Operating Manual). Five Lever
  names (§5) and 4×4 matrix cell archetypes (§4) remain working drafts
  requiring owner sign-off before v1.0 final.
