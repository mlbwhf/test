---
# SignalNet — The Signal-Logging Template
# Source: Mutation Readiness Operating Manual, Appendix E
# License: CC BY-SA 4.0
# Version: 1.0 — June 2026
---

# Appendix E: The Signal-Logging Template (SignalNet)

Inside The Innovation Playground, the protagonists build a tool they call SignalNet — a distributed, semi-anonymous platform inside the organization where any employee can log a weak signal, an anomaly, or a hesitation about what they're seeing. The tool is fictional. The pattern is replicable. Below is the template you can implement in any organization in under a week.

## The Logging Form

Each signal entry should answer five questions. Keep the form short — under two minutes to fill in.

| Field | Prompt | Format |
| --- | --- | --- |
| What did you notice? | Describe the signal in one or two sentences. | Short text |
| Where did you notice it? | What context — customer call, internal Slack, competitor announcement, your own gut. | Dropdown + free text |
| What might it mean? | Your best hypothesis about what the signal indicates. (Hypothesis, not fact.) | Short text |
| Confidence | How confident are you in your interpretation? | 1-5 scale |
| Anonymous? | Should this entry be attributed to you or surfaced anonymously? | Toggle |

## The Review Cadence

Signal entries go into a shared database, searchable across the company. The leadership team reviews the database weekly for thirty minutes, using a structured agenda:

Cluster: group signals by theme. Use simple tagging. AI tools can do most of the clustering at this point.

Triage: for each cluster, decide whether it is noise, weak signal, or actionable signal.

Assign: for actionable signals, name an owner and a 30-day investigation budget.

Capture: write a one-paragraph note for the Insight Journal documenting the cluster and the decision.

## The Cultural Layer

SignalNet only works if the culture rewards signal surfacing. Three practices that protect it:

Quarterly award for the highest-value signal surfaced, with explicit recognition that the value is not the signal being right but the signal being early and well-articulated.

Explicit protection from retaliation. The CEO needs to say, in public, more than once a year, that surfacing an unwelcome signal is a behavior that is rewarded, not punished.

Visible follow-through. When a signal leads to a decision, the SignalNet entry should be linked to the decision and the outcome. The visibility of follow-through is what convinces people that the system is worth using.
