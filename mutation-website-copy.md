# Mutation Readiness — Website Copy & Funnel Pack (Workstream 1)

**Status: v1.0-draft — owner has final say on all copy. Built from the
Handover Brief (June 2026).**
Implementation targets: Framer Pro (site), ScoreApp (assessment), Kit
(email), Cal.com (booking), Stripe (checkout).
Domain placeholder used throughout: `{{DOMAIN}}` (owner decision pending:
mutationreadiness.com / mutationreadinessframework.com / themutationage.com).

---

## 1. Home (/)

**Hero headline:** Your market is mutating. Is your organization?

**Subhead:** Most companies see disruption coming and respond too late
anyway. The Mutation Readiness Framework measures the gap — in 18
questions — and gives you a 30-day plan to close it.

**Primary CTA (button):** Take the free assessment → /assessment
**Secondary CTA:** Read the books → /books

**Three product cards:**
1. **The Books** — *The Innovation Playground* (the story) and *Mutation
   Readiness* (the operating manual). Start where every readiness journey
   starts: seeing the problem clearly. → /books
2. **The Assessment** — 18 questions, 6 dimensions, instant personalized
   report. Free for individuals; team scans for leadership groups. → /assessment
3. **Workshops & Advisory** — From a half-day leadership scan debrief to a
   full operating-cadence installation. → /workshops

**Social proof band:** [Owner to supply: 3–5 testimonials/logos from beta
readers and early workshop clients. Placeholder slots in Framer template.]

**Footer:** nav links, newsletter signup (Kit form), Privacy, Terms,
Discord (added at community launch), GitHub repo (added at repo announce).

## 2. About (/about)

**Headline:** The Mutation Age has its own rules. I wrote them down.

[Owner to supply: bio paragraphs, credentials, headshot.]
Closing block — **The Mutation Age thesis** (draft): Strategy cycles
assumed environments change slower than organizations can plan. AI broke
that assumption. When the environment mutates faster than the annual plan,
readiness — not prediction — becomes the only durable strategy.
CTA: Take the assessment.

## 3. Books (/books, /books/novel, /books/manual)

**/books headline:** Two books. One framework. Read the story, then run
the manual.

- **The Innovation Playground** (novel): What disruption feels like from
  inside the building — before anyone calls it disruption. → /books/novel
- **Mutation Readiness: An Operating Manual for Innovation in the Age of
  AI** → /books/manual

Each sub-page: cover, Amazon buy button, **sample chapter download gated
behind email capture** (Kit form + tag `sample-novel` / `sample-manual`),
3–5 pull-quote endorsements [owner to supply].

## 4. Assessment (/assessment)

**Headline:** Find out where you stand in 10 minutes.
**Subhead:** 18 questions across the six dimensions of mutation readiness.
Instant score, dimension-by-dimension radar, and three actions matched to
your band — free.

**How it works (3 steps):** Answer honestly → Get your band and profile →
Start your 30 days.

Email gate → redirect to ScoreApp funnel.
**ScoreApp config:** questions and scoring exactly per
`mutation-framework/assessments/mutation-readiness-scorecard.yaml`
(dimension = floor(sum × 12 / 15), total /72; bands 0–30 / 31–50 / 51–72). Result page must show:
total score, band, 6-axis radar, three band actions, PDF download,
**CTA: book a discovery call (Cal.com embed)**.

**Team scan upsell block (on result page + /assessment):**
> One person's view is a data point. Your leadership team's *spread* is a
> diagnosis. Run the team scan — every leader answers independently, we
> consolidate the profile and the gaps.
> **$497** — up to 50 seats · **$1,997** — unlimited seats + facilitated
> debrief call. [Stripe checkout]

## 5. Workshops (/workshops)

**Headline:** From score to operating system.
Sections: public cohort dates [owner to schedule], custom engagement
inquiry form (Kit form, tag `workshop-inquiry`), pricing band
[owner to confirm], testimonials [owner to supply].
Stripe checkout for public workshop seats.

## 6. Framework (/framework)

**Headline:** The framework is open source. All of it.
Body: Scorecards, templates, the 4×4 matrix, the versioned Framework
Guide, Claude Code skills, and an MCP server — free, machine-readable,
CC BY-SA / MIT licensed.
Buttons: GitHub repo · Framework Guide PDF (v1.0) · Join the Discord
(hidden until community launch).

## 7. Insights (/insights)

Framer CMS blog + Kit newsletter signup. **Three launch posts (drafts to
be written in Week 3, titles locked now):**
1. "The Mutation Age: why readiness beat prediction"
2. "Your weakest dimension is your strategy: reading a Mutation Readiness
   profile"
3. "Why we open-sourced the framework"

## 8. Contact (/contact)

Cal.com embed (30-min discovery call) + inquiry form (Kit, tag
`contact-inquiry`). One line of copy: "Fastest route: take the assessment
first, then bring your profile to the call."

## 9. Privacy + Terms (/privacy, /terms)

Generate via Termly (or equivalent), link from footer. Must cover: Kit
email processing, ScoreApp data, Stripe payments, analytics.

---

## Kit email automation — 5-email post-assessment nurture

Trigger: ScoreApp completion → Kit subscriber with tag `assessment-done`
+ band tag (`band-blind` / `band-aware` / `band-ready`). One sequence,
band-personalized subject lines and body blocks. Send cadence:
Day 0 / 2 / 5 / 9 / 14.

**Email 1 — Day 0 — "Your report, and the one number that matters"**
Deliver PDF link again. Point to their *lowest dimension*: "The framework's
rule: the lowest dimension, not the total, sets the work program."
CTA: reply with your lowest dimension (replies train deliverability and
start conversations).

**Email 2 — Day 2 — band-specific story**
- `band-blind`: the DeltaCore arc — the signal arrived twice; nothing was
  obligated to act on it. CTA: read the cautionary case study.
- `band-aware`: the Elevate Labs arc — awareness became capability in
  three quarters. CTA: read the case study.
- `band-ready`: the Meridian plateau — staying ready is a practice, not a
  status. CTA: read the mixed case study.

**Email 3 — Day 5 — "Steal this: the 30-minute meeting that changes the
year"** — The weekly signal review, with the SignalNet template attached.
CTA: GitHub repo / templates.

**Email 4 — Day 9 — "What your team's spread would tell you"**
The team-scan pitch: the CEO-scores-12-points-higher problem.
CTA: Team scan ($497 / $1,997, Stripe link).
`band-ready` variant: lead with quarterly trend tracking instead.

**Email 5 — Day 14 — "Two ways to go faster"**
Workshop + discovery call (Cal.com). Soft close: "Or just keep running
the framework free — that's why it's open source. The Discord opens soon;
you'll be first to know."

---

## Stripe products to create

| Product | Price | Notes |
|---|---|---|
| Team Scan — 50 seats | $497 one-time | ScoreApp team funnel access |
| Team Scan — unlimited | $1,997 one-time | + facilitated debrief call |
| Workshop seat (public cohort) | [owner to confirm band] | per cohort date |

## Build checklist (maps to brief's acceptance criteria)

- [ ] 8 sitemap pages live on chosen Framer template
- [ ] ScoreApp funnel scoring verified against `score.py` on 5 test vectors
- [ ] Result-page PDF generation end-to-end
- [ ] Kit: tags, 5-email sequence, band segmentation, sample-chapter gates
- [ ] Cal.com on /contact and ScoreApp result page
- [ ] Stripe products + checkout links live
- [ ] <2.5s load on throttled 3G (test via WebPageTest)
- [ ] Privacy/Terms generated and footer-linked
- [ ] Cross-browser/mobile QA, soft launch to beta list
