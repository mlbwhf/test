---
name: innovation-framework-assessment
description: >
  Run the Innovation Framework Assessment — a 15-question, 5-principle
  diagnostic of an organization's innovation operating system. Measures
  Fail Forward (grit & agility), Open Communication & Candid Feedback,
  Challenging Mental Models, Flexible Structure, and Growth Mindset at
  scale. Trigger when the user says things like "assess our innovation
  culture," "score my team on innovation maturity," "do we have a real
  innovation system," "are we actually innovative or are we just calling
  ourselves innovative," "run the five principles diagnostic," or asks for
  a diagnostic of how innovative their organization really is (as opposed
  to how AI-ready, which is the Mutation Readiness skill). Conducts the
  assessment conversationally, scores the result, and writes a
  personalized 30-60-90 day action plan.
allowed-tools: Read, Write
---

# Innovation Framework Assessment

This skill conducts a diagnostic conversation with the user about their organization's innovation operating system. It is the runnable version of the Innovators Framework — the five Principles from Part I of *Mutation Readiness: An Operating Manual for Innovation in the Age of AI* (the companion to the novel *The Innovation Playground*).

It is the companion assessment to Mutation Readiness. Mutation Readiness measures whether your organization can sense and respond to AI-age change. The Innovation Framework Assessment measures whether your organization has the cultural operating system underneath that lets innovation happen at all. Most organizations need both diagnostics. Some need only this one — they have a healthy culture but aren't yet wrestling with AI velocity.

## When to use

The user is asking, in one form or another, "how strong is our innovation culture / operating system?" Possible phrasings:

- "Run an innovation framework assessment on my team"
- "Are we actually innovative or just calling ourselves innovative?"
- "Score us on the five principles"
- "Where does my team sit on innovation maturity?"
- "We say we have a 'fail forward' culture — do we?"
- "Help me figure out which innovation principle to focus on this quarter"
- "Diagnose our innovation operating system"

Do **not** use this skill for AI-specific readiness questions (use mutation-readiness-assessment for those), for one-off questions about a single practice (just answer the question), or for org-design questions (those usually need a Team Topologies conversation rather than a diagnostic).

If the user's question spans both innovation culture AND AI readiness, run this assessment first and then offer to run the Mutation Readiness one. The order matters — without the cultural foundation this assessment measures, the AI-age practices the Mutation Readiness assessment scores cannot stick.

## What the skill does

1. Briefs the user: 15 questions across 5 principles, ~12 minutes. The diagnostic is honest, not flattering.
2. Asks the user to choose perspective (themselves, their immediate team, their business unit, their whole organization). The smaller the unit, the more accurate the result; a healthy 30-person team can exist inside a dysfunctional 5,000-person organization.
3. Walks through 15 questions, three per principle. For each:
   - Ask conversationally; do not paste a Likert scale.
   - If the user gives a story, infer a 1–5 score and reflect it back ("I'd score that a 3 — does that feel right?").
   - If unclear or N/A, skip and reduce the denominator.
4. Computes a total score (max 75, or normalized to a percentage if items are N/A) and per-principle scores out of 15.
5. Interprets against the three bands.
6. Writes the report to innovation-framework-report-{date}.md containing per-principle scores, the diagnostic, the strongest and weakest principles, a 30-60-90 day action plan tied to the weakest two principles, and reading recommendations.

## The 5 Principles

Each principle is scored 0–15 (three questions × 1–5).

### Principle 1 — Fail Forward (Grit & Agility)

The discipline of running structured experiments, learning from failure, and recovering quickly. The slogan is "fail fast." The discipline is Amy Edmondson's intelligent failure (Right Kind of Wrong, 2023): failures in new territory, opportunity-driven, informed by prior knowledge, sized to be as small as possible while still producing learning.

**Q1.1** Does your team run small, structured experiments with explicit hypotheses and pre-defined learning goals — not just "let's try it and see"?

**Q1.2** When something fails, do you have a structured way to debrief it (Failure Harvest, post-mortem) that surfaces what the team believed before, what they believe now, and what to do next — without blame?

**Q1.3** Is iteration and perseverance publicly recognized in your performance system, not just successful outcomes?

### Principle 2 — Open Communication & Candid Feedback

Psychological safety (Amy Edmondson, *The Fearless Organization*, 2018) combined with radical candor (Kim Scott, *Radical Candor*, 2017 / 2019). The combination is the practice. Either one alone collapses — safety without candor becomes comfort; candor without safety becomes harassment.

**Q2.1** Do team members feel safe to challenge ideas — including ideas from leadership — without political consequence to the person who challenged?

**Q2.2** Is feedback typically shared in real time, in the moment, rather than saved for annual reviews?

**Q2.3** When senior leaders make decisions employees disagree with, do those employees say so — and is the disagreement engaged seriously rather than dismissed?

### Principle 3 — Challenging Mental Models

The discipline of questioning assumptions you have been treating as facts. First-principles thinking (the Musk discipline; equally usable by anyone). Blue-ocean reframing (Kim & Mauborgne). Scenario planning (the Shell Wack tradition). IDEO's "what if we assumed the opposite" practice.

**Q3.1** Does your team regularly question fundamental assumptions about your industry, customers, or business model — not as a workshop exercise, but in real decisions?

**Q3.2** When you face a hard problem, does someone on the team know how to use first-principles reasoning to break it down to underlying physical or economic facts?

**Q3.3** Has your team explicitly retired a "sacred cow" — a practice everyone assumed was non-negotiable — in the past 12 months?

### Principle 4 — Flexible Structure / Agile Decision-Making

The organization is structured so that decisions happen close to the work and information flows across boundaries faster than it flows up the chain. Conway's Law (the system mirrors the org chart). The Inverse Conway Maneuver (Skelton & Pais, *Team Topologies*, 2019).

**Q4.1** Are teams aligned to customer outcomes or value streams, rather than to internal functions (marketing, engineering, sales)?

**Q4.2** Do teams have decision-making autonomy without escalation for most operational choices in their area?

**Q4.3** When something needs to change structurally — a new team, a different reporting line, a deprecated process — does it happen within a quarter, or does it take a year of approvals?

### Principle 5 — Growth Mindset at Scale

Carol Dweck's individual mindset framework (Mindset, 2006) extended to the organizational level by Mary Murphy (Cultures of Growth, 2024). Adam Grant's complementary work on character skills (Hidden Potential, 2023). The mechanism: how the organization rewards effort and learning vs how it rewards talent and outcomes.

**Q5.1** Does your performance review system explicitly reward how an employee helped others grow — with comparable weight to delivery metrics?

**Q5.2** Do employees have dedicated, protected time for self-directed learning, experimentation, or curiosity-driven work (Google 20%, Atlassian Innovation Weeks, LinkedIn InDay, Cisco Illuminate, or your own equivalent)?

**Q5.3** When senior leaders fail or change their minds, do they share what they learned, publicly, more than once a year?

## Scoring

- Each question: 1 (strongly disagree) to 5 (strongly agree). N/A allowed.
- Principle score: sum of three answered questions (max 15).
- Total score: sum of 5 principles (max 75).
- If any items are N/A, normalize the total to a percentage rather than reporting a raw score.

## Bands

| **Band** | **Score** | **Reading** |
|:-:|:-:|:-:|
| Innovation Theatre | 0–30 | The organization uses the language of innovation but does not run the practices. Innovation work is performed for management or external audiences, not lived in daily decisions. The cultural foundation is missing. |
| Innovation Practicing | 31–55 | The rituals exist. Some teams have internalized them. The whole organization has not yet absorbed them into how decisions are actually made. The biggest gap is usually between what leadership says and what the performance system rewards. |
| Innovation Native | 56–75 | Innovation is identity, not department. The practices are visible in everyday decisions, in how people talk in meetings, in how the performance system actually works. The risk is now complacency rather than absence. |

## Recommended actions by band

### Innovation Theatre (0–30)

Pick the lowest-scoring principle and install the smallest possible practice from it within the next 30 days. Do not try to install all five at once — that is the failure mode of every culture-change initiative.

**If the weakest is Fail Forward:** Run one Failure Harvest in the next 14 days. Pick a real recent failure. Use the four-question structure (what did we believe before / after / what is the smallest next experiment / what should the rest of the org know). Forty-five minutes. No PowerPoint. Report the results internally.

**If the weakest is Open Communication:** Start every team meeting for the next month with a one-line round of "what's on your mind that the rest of the team might not see." Two minutes total. It normalizes vulnerability before substance.

**If the weakest is Mental Models:** Run an Assumption Audit on your current strategy this quarter. Two hours, cross-functional team. Mark every claim as Verified, Inherited, or Aspirational. Most teams discover that 60–70% of their working strategy is inherited rather than verified.

**If the weakest is Structure:** Identify one bureaucratic friction point that you can remove this quarter — one approval that does not need to exist, one meeting that should be a Slack message, one reporting line that should be flatter. Remove it. Document what happened.

**If the weakest is Growth Mindset:** Add a single "how you helped others grow" dimension to your next round of performance reviews. Equal weight to delivery dimensions. Do not announce it as a culture initiative. Just do it.

Read: Edmondson, *Right Kind of Wrong* (2023); Scott, *Radical Candor* (revised 2019); Murphy, *Cultures of Growth* (2024).

### Innovation Practicing (31–55)

You have the rituals. The work now is integration. Pick the two lowest-scoring principles and design 90-day plans that connect them.

The most common combination at this level: medium scores on Fail Forward and Mental Models but low scores on Growth Mindset, because the performance system still rewards delivery over learning. The fix is to change the mechanism, not the speech. Rewrite the performance review questions. Reallocate compensation weight. Make the "how you helped others grow" dimension count for a real percentage of the rating, not as a soft signal.

The second common pattern: high scores on Open Communication inside the team but low scores when leadership is involved. The fix is leadership AMAs about past mistakes — not as PR but as practice, monthly, with the CEO and senior team narrating in front of the company what they have changed their mind about and what they learned. This is the Microsoft / Nadella pattern.

Read: Mollick, *Co-Intelligence* (2024); Iansiti & Lakhani, *Competing in the Age of AI* (2020); Skelton & Pais, *Team Topologies* (2019); Grant, *Hidden Potential* (2023).

### Innovation Native (56–75)

You are operating in the top decile. Three things matter now.

**Institutionalize the practices.** They erode without explicit maintenance. The companies that lose adaptive capacity usually lose it because the founder or the CEO who installed the practices leaves, and nobody documented the operating model. Write down what you do. Train your senior team on how to run it without you.

**Begin to mentor adjacent organizations.** The stress test of whether the practices are real is whether you can teach them. Bring in a partner, a customer, a portfolio company. Run a Failure Harvest with them. See whether you can transfer the discipline.

**Run the Mutation Readiness assessment.** If your innovation operating system is healthy but you have not measured AI-age readiness, that is the next frontier. The cultural foundation is necessary but not sufficient for the AI age. Run mutation-readiness-assessment next.

Read: Edmondson, *The Fearless Organization* (2018); the Anthropic interpretability research (Mapping the Mind, May 2024; On the Biology of a Large Language Model, March 2025); Suleyman, *The Coming Wave* (2023).

## How to facilitate the assessment

Tone: collegial, specific, opinionated. Same as the Mutation Readiness assessment. You are a consultant walking a human through a diagnostic, not a survey form.

Pacing: ~45 seconds per question. Reflect back what you heard before moving on.

Inference: if the user gives you a story, infer the score, name it, ask for confirmation.

Pattern-watch: roughly two-thirds of users score themselves higher than what their stories warrant. When the user says they "have psychological safety" and then describes leadership shutting down dissent in their last all-hands, gently surface the contradiction. This is the practice the assessment is measuring, applied to the assessment itself.

Be specific about scope: a "yes" answer that applies only to the user's three-person team is a 3, not a 5. Push for the unit of analysis the user chose at the start.

After all 15 questions, summarize per-principle scores conversationally. Ask: "Which of these scores feels lowest in a way that bothers you?" The answer is often the most diagnostic question in the whole exercise. Then offer to write the report.

## Output format

Write the report to innovation-framework-report-{YYYY-MM-DD}.md in the current directory.

```markdown
# Innovation Framework Assessment — {Organization or Team Name}

**Date:** {date}
**Unit of analysis:** {team / business unit / whole org}
**Total score:** {score} / 75 — **{Band}**

## Per-principle scores

| Principle | Score | Read |
| --- | --- | --- |
| Fail Forward (Grit & Agility) | X / 15 | {strong/medium/weak} |
| Open Communication & Candid Feedback | X / 15 | … |
| Challenging Mental Models | X / 15 | … |
| Flexible Structure / Agile Decision-Making | X / 15 | … |
| Growth Mindset at Scale | X / 15 | … |

## The diagnostic

{2-3 paragraphs of personalized analysis. Quote back at least three
specific things the user said. Name the strongest principle and the
weakest, and the gap between them — because the gap is usually the most
actionable finding.}

## The contradiction worth surfacing

{If the user contradicted themselves at any point during the assessment —
said one thing in an answer and another thing in a story — name it here.
Without judgement. The contradiction is usually where the real diagnostic
is hiding.}

## What surprised you

{If the user told you something in the scoring surprised them, repeat it.
That's almost always the leading signal worth acting on.}

## 30-day actions (tied to the weakest principle)

{3-5 specific, concrete actions sized to be doable in the next 30 days.
Each names what to do, who to involve, what success looks like.}

## 60-day actions

{2-4 actions for the next 31-60 days, building on the 30-day work.}

## 90-day actions

{1-3 larger structural actions — usually involving the performance
system, the org structure, or the budget.}

## Recommended reading for your band

{3-5 sources from the band-specific list above. Author and book; no URLs.}

## Whether to run Mutation Readiness next

{If the user scored above 55 (Innovation Native) or above 40 in
Practicing, suggest running the Mutation Readiness assessment next — that
is the AI-age extension. If the user scored below 30, do NOT suggest it;
they need the cultural foundation first.}

---

*This assessment was conducted using the Innovators Framework from*
Mutation Readiness: An Operating Manual for Innovation in the Age of AI
*(Part I, the Innovation Operating System).*
```

## Quality bar

A good Innovation Framework report is:

- **Honest about the gap between leadership rhetoric and the performance system.** The single most common finding in this assessment is that the company talks like Innovation Native and rewards like Innovation Theatre. Name it.
- **Tied to one specific principle to fix.** Five concurrent culture initiatives is the failure mode. One focused 90-day push on the weakest principle is the success mode.
- **Concrete on the mechanism.** "Improve psychological safety" is not an action. "Add the 'what's on your mind' question to your standing 1:1 agenda" is an action.
- **Comfortable with discomfort.** If everything in the report feels reassuring, the assessment was done wrong.

## Variant: rapid mode

If the user says "give me a quick read" or "I don't have 12 minutes," compress to 5 questions — one per principle, the strongest single signal each. Use Q1.2 (failure debrief structure), Q2.1 (challenge leadership), Q3.3 (sacred cow retired), Q4.3 (structural change velocity), Q5.1 (performance system rewards learning). Score out of 25. Bands: 0–10 Innovation Theatre, 11–18 Innovation Practicing, 19–25 Innovation Native. The full 15-question version remains the default.

## How this relates to the Mutation Readiness assessment

| **Question** | **Use this skill** | **Use mutation-readiness-assessment** |
|:-:|:-:|:-:|
| Do we have an innovation culture? | ✓ | |
| Are we AI-ready? | | ✓ |
| Why is our innovation initiative stalling? | ✓ | |
| Are we missing AI-age signals our competitors are catching? | | ✓ |
| Both? | run this first | run second |

The Innovation Framework Assessment measures the cultural operating system underneath the practices the Mutation Readiness Assessment scores. Most organizations should run this one first, then the Mutation Readiness one. An organization scoring as Innovation Theatre will fail at Mutation Readiness regardless of what they install — the foundation is missing.

## Source

This skill packages the five Principles from Part I of *Mutation Readiness: An Operating Manual for Innovation in the Age of AI* by Mark Saymen. The framework integrates work by Amy Edmondson (psychological safety, intelligent failure), Kim Scott (Radical Candor), Carol Dweck and Mary Murphy (mindset / cultures of growth), Patrick Lencioni (trust as infrastructure), Daniel Pink (autonomy, mastery, purpose), Reed Hastings and Erin Meyer (Netflix culture), Adam Grant (hidden potential, character skills), Peter Senge (systems thinking, the learning organization), and Matthew Skelton and Manuel Pais (Team Topologies).
