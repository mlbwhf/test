# Blog Recategorization Map — 44 Uncategorized Posts
_Live pull 2026-06-02 (category 1 = Uncategorized, count 44). Target categories: AI(83), Agile(84), Executive Coaching(85), Digital Transformation(86), Innovation(100). Action: add the primary category, remove cat 1. Posts already carrying real categories keep them; just drop Uncategorized._

| ID | Title | → Primary category |
|---|---|---|
| 23542 | Divergent Thinking: The Skill Leaders Need in the AI Age | AI (already multi-tagged; drop Uncat only) |
| 23537 | AI in 2026: Explosive Growth, Delayed Value | AI |
| 23535 | "Only a Baby Likes Change" — Resistance | Digital Transformation |
| 23533 | "Fear Is a Liar — Don't Miss the Class" | Executive Coaching |
| 23529 | Surviving Transformation: Cloud to AI | Digital Transformation |
| 23527 | Organization & Team Resilience | Executive Coaching |
| 23525 | Transformation as a Service | Digital Transformation |
| 23523 | The "Frozen Middle" in Change | Digital Transformation |
| 23521 | "People Don't Like Change" — Or Do They? | Digital Transformation |
| 23519 | Failure Isn't the Opposite of Success | Executive Coaching |
| 23515 | "Let Chaos Reign" — Andy Grove | Digital Transformation |
| 23512 | "The King Who Knows His Limits" | Executive Coaching |
| 18676 | AI's Growth Has Been Bottom-Up | AI *(dedupe canonical — keep)* |
| 18673 | The Crack Filled with Gold: Kintsugi | Executive Coaching |
| 18671 | Imperfection Becomes Your Advantage | AI |
| 18669 | Your Past Has No Meaning — Ego | Executive Coaching |
| 18665 | Prompt Repetition — AI Output | AI |
| 18663 | Parkinson's Law and the AI Launch Problem | AI |
| 18661 | Don't Explain the Depth of the Ocean | Executive Coaching |
| 1733 | What If That Obstacle… Empty Boat | Executive Coaching |
| 1748 | Your Brain on AI | AI |
| 1738 | Empowering Innovation with AI | Innovation |
| 1726 | IBM Reinventing Itself | Digital Transformation |
| 1732 | Customer Adoption and Change Management | Digital Transformation |
| 1709 | Self Driving Level 5 | AI |
| 1737 | The Innovation Death Zone | Innovation |
| 1755 | The Evolution of GenAI Use Cases (2022–2025) | AI |
| 1751 | The Illusion of Thinking | AI |
| 1750 | Shell Revolution | Digital Transformation |
| 1717 | Coaching Conversations | Executive Coaching |
| 1729 | What Is Coaching? A Fierce Perspective | Executive Coaching |
| 1724 | AI's Impact on Agile Roles | Agile |
| 1743 | Future of Agile Transformation Services… SAFe? | Agile |
| 1754 | Transforming Procurement with Lean Agile | Agile |
| 1740 | The Next Chapter in SAFe: Purposeful Configuration | Agile |
| 1711 | Is Agile Dead? Or a Maturity Stage | Agile |
| 1759 | "Muzzle Velocity" and Executive Coaching | Executive Coaching |
| 1734 | Good is Great — Global Accreditation | Agile |
| 1730 | The Increasing Value of Courses and Credentials | Agile |
| 1728 | Driving Exponential Change in Innovation | Innovation |
| 1739 | Advanced Learning Pathway | Agile |
| 1713 | SAFe Simplified — Streamlining SAFe | Agile |
| 1749 | Challenges in Government | Digital Transformation |
| 1725 | Demand for SAFe Practice Consultants (SPCs) | Agile |

## Distribution after cleanup (primary)
- AI: 11 · Executive Coaching: 11 · Digital Transformation: 10 · Agile: 9 · Innovation: 3

## Notes
- **Slug to improve:** post 1754 has the generic slug `blog-post` ("Transforming Procurement…") — rename + 301 when convenient.
- A few are judgment calls (1750 "Shell Revolution", 1749 "Challenges in Government", 1734) — flagged; easy to flip.
- Execution = per-post `posts.update` setting `categories` (throttle-paced, ~44 writes). Ready to run once the blog-design pass is finalized.
