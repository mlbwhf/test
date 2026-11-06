# Mutation Readiness — Launch Content Pack

**Status: v1.0-draft — owner has final say on all copy.**
Contains: the three launch blog posts for /insights (titles locked in the
website copy pack) and the remaining four Discord seed posts (runbook §7).

---

## Blog post 1 — "The Mutation Age: why readiness beat prediction"

*Target: 700 words · CTA: free assessment · Publish: launch day*

Every strategy function I've ever sat with owns some version of the same
machine: gather data, forecast the market, plan three years, execute. The
machine assumes one thing so deeply that nobody writes it down — that the
environment changes slower than the plan.

That assumption just died. It didn't die loudly; it died the way load-bearing
assumptions always do, while everyone was looking at something else. The
cost of producing software, content, analysis, and coordination — the
things most plans are made of — is collapsing. When the environment can
mutate inside a single planning cycle, the question "what will the market
do?" quietly becomes unanswerable, and a better question takes its place:
**"how fast can we notice, decide, and change?"**

That question has an answer you can measure. We call it mutation
readiness, and it has six dimensions:

- **Signal Sensitivity** — do you detect weak signals before your lagging
  metrics confirm them?
- **Structural Flexibility** — can you reshape yourself faster than
  competitors can retool?
- **AI Talent Flywheel** — is AI-literate talent embedded everywhere, or
  walled into one function?
- **Ambidextrous Capital** — does exploration money survive contact with
  the quarterly business review?
- **Ethical Guardrails** — can you ship AI fast *because* your containment
  discipline is real?
- **Narrative Coherence** — can your people say what the company is for in
  the current market, not the 2018 one?

Eighteen questions, fifteen minutes, a score out of 72, and three bands:
Mutation-Blind, Mutation-Aware, Mutation-Ready. Most organizations that
take it for the first time land in Mutation-Aware — they can see change
coming, they just can't act on it at the right cadence. The gap between
sensing and responding is where companies die now. Not from being blind;
from being slow.

The framework behind the assessment is open source — every question, every
scoring rule, every template, free on GitHub. Prediction was a proprietary
game. Readiness is a practice, and practices spread by being practiced.

**→ Take the free assessment. Fifteen minutes, honest answers, and you'll
know your weakest dimension by lunch.**

---

## Blog post 2 — "Your weakest dimension is your strategy: reading a Mutation Readiness profile"

*Target: 650 words · CTA: team scan · Publish: launch +1 week*

Two companies take the assessment. Both score 41 out of 72 —
Mutation-Aware, dead center. Same number, same band. One of them is fine.
The other is in trouble. The total can't tell you which is which. The
profile can.

The first company is a 9-7-7-6-6-6: balanced, a little gray everywhere,
strong nowhere. Its work program is ordinary — pick the cheapest dimension
to move and start the cadence.

The second is a 12-11-9-4-3-2. Look at that tail. World-class signal
detection, real structural flexibility — and almost no exploration
capital, untested guardrails, and a strategic narrative nobody below the
executive floor can repeat. This company *sees everything and can fund
nothing*. Its beautiful signal log is a list of opportunities it is
contractually unable to pursue. The strong dimensions don't average out
the weak ones; they *mask* them, right up until the moment they can't.

That's the framework's first interpretation rule: **the lowest dimension,
not the total, sets the work program.** Dimensions compound. Signal
Sensitivity without Ambidextrous Capital is a telescope bolted to a parked
car. An AI Talent Flywheel without Ethical Guardrails is how you end up
explaining yourself to a regulator. Narrative Coherence is the one that
surprises people — but an organization that can't say what it's for can't
decide fast, because every decision reopens the identity question.

There's a second thing the total hides: **the spread.** When a leadership
team takes the assessment independently — before seeing each other's
answers — the gap between the CEO's score and everyone else's is routinely
ten points or more. That gap is not noise. It is the most accurate
measurement you will ever get of how filtered the information reaching the
top has become.

One person's score is a data point. A team's spread is a diagnosis.

**→ Run the team scan: every leader answers independently, we consolidate
the profile, the gaps, and the spread, and debrief it with you.**

---

## Blog post 3 — "Why we open-sourced the framework"

*Target: 550 words · CTA: GitHub repo + Discord waitlist · Publish: repo announce day (day 30)*

Today the entire Mutation Readiness Framework goes public on GitHub: all
18 assessment questions and the full scoring rubric in machine-readable
YAML, the templates, the 4×4 Innovation Matrix, the versioned Framework
Guide, two Claude Code skills, and an MCP server so any AI agent can run
the assessment programmatically. License: CC BY-SA for the documents, MIT
for the code. No email wall in front of the repo. Clone it and go.

People keep asking some version of: *isn't the framework the product?*

No. The framework is the language. Nobody ever built a durable business on
a proprietary language — they built it on being the best speaker of a
shared one. The Scrum Guide has been free for twenty-five years; that fact
created the demand for every Scrum trainer who ever invoiced. Closed
frameworks die with their consultancy. Open ones get translated, taught,
forked, argued with — and arguing with a framework is how a framework
wins.

There's also a more practical reason, specific to this moment. The
framework is built for the AI age, so it had to be *legible to AI*. The
machine-readable spec isn't a gimmick: it means your agents can run your
readiness assessment on a cadence, your tooling can plot your portfolio,
and a consultant in another hemisphere can build something on top of the
scoring engine without asking permission. A framework about adaptation
that couldn't be adapted would be its own counterexample.

What's *not* free: our time. Facilitated team scans, workshops, and the
practitioner certification (coming later this year) are how we fund the
open work. That line is bright and it will stay bright.

The repo ships with a contribution guide — case studies, translations, and
template improvements are open to everyone. The community Discord opens in
the next few weeks, with practitioners, facilitators, and contributors
channels.

**→ github.com/[org]/framework — star it, clone it, break it, tell us
where it's wrong.**

---

## Discord seed posts 3–6 (runbook §7; posts 1–2 already drafted there)

**Seed post 3 — #practitioners — "The N/A question"**
> When you ran the scorecard, which question did you N/A — and was it
> really "not applicable," or was it "nobody knows the answer"? Those are
> very different findings. Q5.3 (audit-quality explanation of an AI
> decision) is the most-skipped question in early data. Curious if that
> matches this group.

**Seed post 4 — #questions — "Mutation latency: who's actually measured it?"**
> The Operating Manual's target is signal-to-decision in under 21 days.
> Before you measure, write down your guess. Mine was off by 6x at my own
> shop. Post your guess vs. your measured number — anonymized stories
> welcome.

**Seed post 5 — #practitioners — "The exploration budget that survived"**
> Q4.3 asks whether an experiment with no clear ROI can survive its first
> quarterly business review. If yours did: what protected it? A person, a
> policy, or a pot of money the QBR couldn't see? The mechanism matters
> more than the amount — share yours.

**Seed post 6 — #facilitators — "Scoring the storytellers"**
> Facilitation question for this room: a respondent answers Q2.2 with a
> 20-minute story instead of a number. The skill files say infer the score
> and reflect it back ("I'd score that a 3 — does that feel right?"). What
> do you do when they push back two points higher? Share how you handle
> the negotiation without poisoning the rest of the session.
