---
name: mutation-readiness-assessment
description: >
  Run the Mutation Readiness Assessment — an 18-question, 6-dimension
  diagnostic of an organization's capability to sense, respond, and adapt
  at AI-age speed. Trigger when the user says things like "assess my
  organization's innovation capability," "run a mutation readiness check,"
  "score my team on innovation," "where does my company sit on AI
  readiness," or asks for a diagnostic of how AI-ready / signal-led /
  adaptive their organization is. Conducts the assessment conversationally,
  scores the result, and produces a written personalized report with a
  30-60-90-day action plan.
allowed-tools: Read, Write
---

# Mutation Readiness Assessment

This skill conducts a diagnostic conversation with the user about their organization's innovation and adaptation capability. It is the runnable version of the assessment in *Mutation Readiness: An Operating Manual for Innovation in the Age of AI* (the companion to the novel *The Innovation Playground*).

## When to use

The user is asking, in one form or another, "how does my organization rate on innovation / AI readiness / adaptive capacity?" Possible phrasings:

- "Run a mutation readiness assessment on my team"
- "Score my company on innovation capability"
- "How AI-native is my organization really?"
- "Help me diagnose where we are on adaptive capacity"
- "Give me an honest read on our innovation maturity"
- "I want to assess my team against the Five Levers framework"

Do **not** use this skill for generic strategy advice or for one-off questions about a single innovation practice. It is a multi-turn diagnostic that takes about 15 minutes to complete properly.

## What the skill does

1. Briefs the user on what the assessment is, what it measures, and how long it takes (~15 min).
2. Asks the user to choose perspective (themselves, their team, their whole organization). The unit-of-analysis matters; a 50-person team can be Mutation-Ready while the surrounding 5,000-person enterprise is Mutation-Blind.
3. Walks the user through 18 questions across 6 dimensions, in order. For each question:
   - Ask the question conversationally (do NOT paste a 5-point Likert scale at them).
   - If the user gives a free-text answer, infer a 1–5 score and tell them what you inferred, asking for confirmation.
   - If the user wants to skip or doesn't know, mark as N/A and reduce the dimension's denominator proportionally.
4. After all 18 questions, computes the total score (max 60 for 12 questions answered out of 12; max 72 with full 18; if some N/A, normalize to a percentage).
5. Interprets the score against the three bands.
6. Writes a personalized report to a file (default: mutation-readiness-report-{date}.md) containing:
   - Total score and band
   - Per-dimension scores
   - Top 3 specific weaknesses with named practices to install
   - A 30-60-90 day action plan tailored to the band
   - Recommended reading from the bibliography

## The 6 dimensions

Each dimension is scored from 0 to 12 (three questions, 1–5 each, max 15; but the rubric uses 0–12 as the operationally meaningful band).

### Dimension 1 — Signal Sensitivity

The capability to detect, interpret, and act on weak signals before lagging metrics confirm them.

**Q1.1** Does your team monitor weak signals from at least three sources outside your own dashboards on a weekly basis? (Examples of sources: customer Discord channels, developer forums, GitHub trends, competitor hiring patterns, regulatory leaks.)

**Q1.2** Can you name a specific behavioural change in your customer base that you noticed in the past 30 days *before* it appeared in your metrics?

**Q1.3** Do you have a structured cadence — a meeting, a ritual, a tool — for surfacing internal anomalies without political consequence to the person who raised them?

### Dimension 2 — Structural Flexibility

The organization's ability to reshape itself faster than competitors can retool.

**Q2.1** Are your teams aligned to customer outcomes (streams of value) rather than to internal functions (marketing, engineering, sales, etc.)?

**Q2.2** Can a new product idea move from concept to validated learning in your organization in under 90 days?

**Q2.3** When you identified a need to restructure something in the past 12 months, did you act on it within a quarter?

### Dimension 3 — AI Talent Flywheel

The organization's capability to attract, retain, and integrate AI-literate talent across functions.

**Q3.1** Do you have at least one AI-literate person embedded in every major product or business team?

**Q3.2** Is your AI talent distributed across the organization, or isolated in a single AI/ML function?

**Q3.3** Does your AI talent have direct exposure to strategy decisions, not just to implementation work?

### Dimension 4 — Ambidextrous Capital

The discipline of balancing exploit (proven operations) with explore (uncertain bets) in your funding model.

**Q4.1** Do you have a protected exploration budget that is separate from your core P&L?

**Q4.2** Are exploration bets evaluated on learning yield, not on traditional ROI?

**Q4.3** Can an experiment with no clear ROI survive its first quarterly business review without being defunded?

### Dimension 5 — Ethical Guardrails

Containment-as-velocity: the institutional discipline that lets you ship AI fast without dramatic reputational failure.

**Q5.1** Is every AI deployment in your organization governed by explicit operating boundaries and a recalibration cadence?

**Q5.2** Do you have an AI governance function (not just a compliance function) with engineering rather than legal at its centre?

**Q5.3** Can you produce, on request, an audit-quality explanation of any AI-driven decision affecting a customer?

### Dimension 6 — Narrative Coherence

The shared story that lets the organization act in concert under uncertainty.

**Q6.1** Can your employees describe, in their own words, what your organization is for in the current market (not the 2018 market)?

**Q6.2** Has your leadership team updated the strategic narrative — the story you tell about why this company exists and why it wins — in the past 18 months?

**Q6.3** Can new hires articulate your strategic narrative after their first month on the job?

## Scoring

- Each question: 1 (strongly disagree) to 5 (strongly agree). N/A allowed.
- Dimension score: sum of three answered questions (max 15); convert to /12 by floor(sum * 12 / 15) for the headline number.
- Total score: sum of 6 dimension scores out of 72.

## Bands

| **Band** | **Score** | **Reading** |
|:-:|:-:|:-:|
| Mutation-Blind | 0–30 | Your organization is operating on lagging metrics in an environment that is mutating around it. Disruption is probably already happening, undetected. |
| Mutation-Aware | 31–50 | Your organization can sense change but cannot yet act on it at the right cadence. The sense-to-respond gap is the primary risk. |
| Mutation-Ready | 51–72 | Your organization is operating in the top decile. The risk now is complacency. |

## Recommended actions by band

### Mutation-Blind (0–30)

Install signal-sensitivity practices in the next 30 days. Specifically:

- Stand up a SignalNet — a distributed, semi-anonymous logging system for any employee to surface weak signals (full template in *Mutation Readiness* Appendix E)
- Run an Assumption Audit on your current strategy (full template in Appendix C, or see Chapter 4 of the Operating Manual)
- Begin a weekly signal review at the leadership team level, 30 minutes, anomaly-focused
- Read: Amy Edmondson, *Right Kind of Wrong* (2023); Mustafa Suleyman, *The Coming Wave* (2023)

### Mutation-Aware (31–50)

You can see signals but can't act on them. Focus on closing the sense-to-respond gap.

- Build an experimentation engine using the five components in Chapter 10 of the Operating Manual
- Apply the Five Levers framework deliberately (Chapter 9) — pick the two levers your organization scored lowest on and design specific 90-day moves on each
- Measure mutation latency: time from signal identification to organizational decision. Target < 21 days.
- Read: Iansiti & Lakhani, *Competing in the Age of AI* (2020); Rita McGrath, *Seeing Around Corners* (2019); Ethan Mollick, *Co-Intelligence* (2024)

### Mutation-Ready (51–72)

You're in the top decile. The risk is complacency.

- Institutionalize the practices that got you here. They erode without explicit maintenance.
- Begin to mentor adjacent organizations. The best stress-test of whether your practices are real is whether you can teach them.
- Consider whether the language of "mutation readiness" should be part of how you describe your operating model externally — to investors, to talent, to partners.
- Read: Edmondson, *The Fearless Organization* (2018); Murphy, *Cultures of Growth* (2024); the Anthropic interpretability research (Mapping the Mind, May 2024; On the Biology of a Large Language Model, March 2025)

## How to facilitate the assessment

Tone: collegial, specific, opinionated. You are not a survey form. You are a thoughtful consultant walking a real human through a diagnostic.

Pacing: average ~50 seconds per question. Don't rush. After each answer, briefly reflect back what you heard so the user feels heard before moving on.

Inference: if the user gives a story rather than a score (most will), infer the score and say "I'd score that a 3 out of 5 — does that feel right?" before logging.

Honesty: if the user gives an obviously self-flattering answer that doesn't square with what they've said elsewhere in the conversation, gently note the tension. This is the Edmondson candor practice applied to the assessment itself.

Skip with grace: if the user doesn't know an answer or it's not applicable, mark N/A and move on. Do not stall.

After all 18 questions, summarize back the per-dimension scores conversationally, ask the user if anything in the scoring surprises them (their answer to that question is often the most useful diagnostic in the whole assessment), then offer to write the report.

## Output format

Write the report to a file in the current directory. Default filename: mutation-readiness-report-{YYYY-MM-DD}.md.

The report structure:

```markdown
# Mutation Readiness Assessment — {Organization or Team Name}

**Date:** {date}
**Unit of analysis:** {what they assessed — team, business unit, whole org}
**Total score:** {score} / 72 — **{Band}**

## Per-dimension scores

| Dimension | Score | Band |
| --- | --- | --- |
| Signal Sensitivity | X / 12 | {strong/medium/weak} |
| Structural Flexibility | X / 12 | … |
| AI Talent Flywheel | X / 12 | … |
| Ambidextrous Capital | X / 12 | … |
| Ethical Guardrails | X / 12 | … |
| Narrative Coherence | X / 12 | … |

## The diagnostic

{2-3 paragraphs of personalized analysis based on the user's answers.
Quote back specific things they said. Name the top 2-3 strengths and the
top 2-3 weaknesses.}

## What surprised the user

{If they told you something surprised them in the scoring, repeat it here
and treat it as the leading signal. It usually is.}

## 30-day actions

{3-5 specific, concrete actions sized to be doable in the next 30 days.
Each action names: what to do, who to involve, what success looks like.}

## 60-day actions

{2-4 actions sized for the next 31-60 days, building on the 30-day work.}

## 90-day actions

{1-3 larger actions that compound on the 30/60 work. These usually involve
a structural move — a hire, a budget reallocation, a re-org.}

## Recommended reading for this band

{Pull 3-5 sources from the band-specific list above. Include one author /
book per source, no URLs.}

---

*This assessment was conducted using the Mutation Readiness framework
from* Mutation Readiness: An Operating Manual for Innovation in the Age of
AI *(the companion volume to the novel* The Innovation Playground*).*
```

## Quality bar

A good Mutation Readiness report is:

- **Specific.** Quote back at least three things the user actually said. Generic advice is the failure mode of every assessment.
- **Uncomfortable.** If everything in the report feels reassuring, you have done the assessment wrong. Surface at least one thing the user did not want to hear.
- **Actionable on Monday.** If a 30-day action requires more than two people to approve before it can begin, it is not a 30-day action. Redesign it.
- **Honest about uncertainty.** Where the user's answers were thin, say so. Don't pretend the assessment knows more than the inputs warrant.

## Variant: rapid mode

If the user says "give me a quick read" or "I don't have 15 minutes," compress to 6 questions — one per dimension, the strongest single signal each. Use Q1.2, Q2.2, Q3.2, Q4.3, Q5.3, Q6.1. Score out of 30. Bands: 0–12 Mutation-Blind, 13–22 Mutation-Aware, 23–30 Mutation-Ready. The full version remains the default.

## Source

This skill packages the Mutation Readiness Scorecard from Appendix A of *Mutation Readiness: An Operating Manual for Innovation in the Age of AI* by Mark Saymen. The framework integrates work by Amy Edmondson (psychological safety, intelligent failure), Mary Murphy (cultures of growth), Carol Dweck (mindset), Ethan Mollick (co-intelligence), Mustafa Suleyman (containment), Marco Iansiti and Karim Lakhani (AI factory), Rita McGrath (inflection points), Skelton & Pais (Team Topologies), and the Anthropic interpretability research from 2024–2025.
