# Mutation Readiness Scorecard

**Version 1.0-draft** · 18 questions · 6 dimensions · ~15 minutes
**Source:** Appendix A of *Mutation Readiness: An Operating Manual for Innovation in the Age of AI* by Mark Saymen

> Machine-readable source of truth: [`mutation-readiness-scorecard.yaml`](mutation-readiness-scorecard.yaml).
> The web assessment, the Claude Code skill, and the MCP server all derive
> from that file. If you change a question, change it there first.

## What this measures

The organization's capability to **sense, respond, and adapt at AI-age
speed**, across six dimensions, three questions each. The unit-of-analysis
matters: a 50-person team can be Mutation-Ready while the surrounding
5,000-person enterprise is Mutation-Blind. Decide what you are scoring
before you start, and hold every answer to that unit.

## How to score

Rate each question 1 (strongly disagree) to 5 (strongly agree). N/A is
allowed — reduce that dimension's denominator proportionally.

- **Dimension score:** sum of the three answers (max 15), converted to the
  0–12 headline number by floor(sum × 12 / 15).
- **Total score:** sum of the six dimension scores, out of 72.
- If some questions are N/A, normalize the total to a percentage.

| Band | Score | Reading |
|---|---|---|
| **Mutation-Blind** | 0–30 | Operating on lagging metrics in an environment that is mutating around you. Disruption is probably already happening, undetected. |
| **Mutation-Aware** | 31–50 | You can sense change but cannot yet act on it at the right cadence. The sense-to-respond gap is the primary risk. |
| **Mutation-Ready** | 51–72 | Top decile. The risk now is complacency. |

## The questions

### Dimension 1 — Signal Sensitivity
*The capability to detect, interpret, and act on weak signals before lagging metrics confirm them.*

- **Q1.1** Does your team monitor weak signals from at least three sources outside your own dashboards on a weekly basis? (Customer Discord channels, developer forums, GitHub trends, competitor hiring patterns, regulatory leaks.)
- **Q1.2** Can you name a specific behavioural change in your customer base that you noticed in the past 30 days *before* it appeared in your metrics?
- **Q1.3** Do you have a structured cadence — a meeting, a ritual, a tool — for surfacing internal anomalies without political consequence to the person who raised them?

### Dimension 2 — Structural Flexibility
*The organization's ability to reshape itself faster than competitors can retool.*

- **Q2.1** Are your teams aligned to customer outcomes (streams of value) rather than to internal functions?
- **Q2.2** Can a new product idea move from concept to validated learning in under 90 days?
- **Q2.3** When you identified a need to restructure something in the past 12 months, did you act on it within a quarter?

### Dimension 3 — AI Talent Flywheel
*The capability to attract, retain, and integrate AI-literate talent across functions.*

- **Q3.1** Do you have at least one AI-literate person embedded in every major product or business team?
- **Q3.2** Is your AI talent distributed across the organization, or isolated in a single AI/ML function?
- **Q3.3** Does your AI talent have direct exposure to strategy decisions, not just to implementation work?

### Dimension 4 — Ambidextrous Capital
*The discipline of balancing exploit (proven operations) with explore (uncertain bets) in your funding model.*

- **Q4.1** Do you have a protected exploration budget that is separate from your core P&L?
- **Q4.2** Are exploration bets evaluated on learning yield, not on traditional ROI?
- **Q4.3** Can an experiment with no clear ROI survive its first quarterly business review without being defunded?

### Dimension 5 — Ethical Guardrails
*Containment-as-velocity: the institutional discipline that lets you ship AI fast without dramatic reputational failure.*

- **Q5.1** Is every AI deployment governed by explicit operating boundaries and a recalibration cadence?
- **Q5.2** Do you have an AI governance function (not just a compliance function) with engineering rather than legal at its centre?
- **Q5.3** Can you produce, on request, an audit-quality explanation of any AI-driven decision affecting a customer?

### Dimension 6 — Narrative Coherence
*The shared story that lets the organization act in concert under uncertainty.*

- **Q6.1** Can your employees describe, in their own words, what your organization is for in the *current* market (not the 2018 market)?
- **Q6.2** Has your leadership team updated the strategic narrative in the past 18 months?
- **Q6.3** Can new hires articulate your strategic narrative after their first month on the job?

## Rapid mode

Six questions — the strongest single signal per dimension: Q1.2, Q2.2,
Q3.2, Q4.3, Q5.3, Q6.1. Score out of 30. Bands: 0–12 Mutation-Blind,
13–22 Mutation-Aware, 23–30 Mutation-Ready.

## After scoring

Each band carries recommended actions and a reading list — see the YAML
spec or the [Framework Guide](../reference/framework-guide-v1.0.md). For a
guided conversational session with a personalized 30-60-90-day report, use
the [Claude Code skill](../claude-skills/mutation-readiness-assessment.md).

To score programmatically (18 answers in Q1.1…Q6.3 order; `na` allowed):

```bash
python3 score.py --answers 3,4,2,3,3,4,2,2,3,4,3,3,2,2,3,3,4,3
python3 score.py --answers 3,4,na,3,3,4,2,2,3,4,3,3,2,2,3,3,4,3
python3 score.py --rapid --answers 4,3,2,3,4,2
```

## Companion instrument

Run the [Innovation Framework Scorecard](innovation-framework-scorecard.md)
*first* if you haven't measured your innovation culture: it scores the
cultural operating system underneath these practices. An organization in
Innovation Theatre will fail at Mutation Readiness regardless of what it
installs.
