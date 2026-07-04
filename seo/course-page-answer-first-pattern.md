# Course-page answer-first restructure — pattern + one worked example

## Why

LLMs (and Google's SGE) increasingly answer "buyer questions" directly by
extracting the first 40–80 words after a matching H2. Long-form intros
optimised for narrative flow lose that extraction battle to a competitor
that leads with the direct answer.

Restructuring course pages **answer-first** means:

1. Every scannable H2 is phrased as a **buyer question in natural
   language** — the way someone would actually type it into ChatGPT.
2. The **immediate next 40–80 words** are a *direct, complete answer*.
   No throat-clearing. No "In this article we'll cover…"
3. Depth (curriculum details, dates, testimonials, form) comes **after**
   the answer, not before it.

This targets what Google calls "fan-out sub-queries" — the follow-up
questions ChatGPT generates when a buyer researches a purchase.

---

## The buyer-question canon

For every SAFe / AI-Native course page, cover these seven questions in this
order (feel free to add course-specific ones):

| # | H2 (question form)                                                    | Answer length |
|---|-----------------------------------------------------------------------|---------------|
| 1 | How much does [Course] certification cost in Canada?                  | 40–60 words   |
| 2 | Who should take the [Course] course?                                  | 50–70 words   |
| 3 | How long is the [Course] course, and what does the schedule look like? | 50–80 words   |
| 4 | What does the [Course] exam cover, and what's the pass rate here?     | 60–100 words  |
| 5 | What's the difference between [Course] and [related cert]?            | 60–100 words  |
| 6 | Is [Course] worth it — what jobs and salary does it unlock?           | 60–100 words  |
| 7 | Why choose Agile Agilist for [Course] over [competitor]?              | 60–100 words  |

Wrap the top-3 (cost, audience, schedule) in FAQPage JSON-LD via the
`aa_faq_jsonld` post-meta the sitewide snippet reads (see
`aa-jsonld-sitewide-snippet.php`). That double-emits the answer: once as
crawlable HTML text, once as structured data — Google prefers both.

---

## Worked example: Leading SAFe (SAFe Agilist / SA)

Below is what the top-of-page copy for `/training/safe/sa/` should look
like after the restructure. Keep the existing curriculum / testimonial /
cohort blocks below this — the pattern replaces the *lead*, not the whole
page.

```html
<article class="aa-course">

  <!-- Hero remains as-is (title / eyebrow / CTA / cohort schedule chip) -->

  <!-- BEGIN ANSWER-FIRST BLOCK — replaces the current narrative intro -->

  <section class="aa-af">

    <h2>How much does Leading SAFe certification cost in Canada?</h2>
    <p>
      Leading SAFe (SAFe Agilist / SA) certification with Agile Agilist is
      <strong>USD $850</strong> per seat, and includes the two-day live
      cohort, all workbooks, one exam attempt, one re-take voucher, and
      recordings for life. Canadian corporate teams can invoice in CAD;
      GST/HST applies where required.
    </p>

    <h2>Who should take Leading SAFe?</h2>
    <p>
      Leading SAFe is aimed at leaders and change agents driving an
      enterprise Agile transformation — VPs of engineering and product,
      programme directors, transformation leads, senior scrum masters
      moving into RTE roles, and any executive on a SAFe steering
      committee. No prior SAFe experience is required, but two years of
      delivery experience makes the material land faster.
    </p>

    <h2>How long is the course, and when's the next cohort?</h2>
    <p>
      Two consecutive days, live-virtual, 9am–5pm Eastern. Cohorts run
      roughly every four weeks; the next confirmed dates are
      <strong>July 9–10 2026</strong> and <strong>August 13–14 2026</strong>.
      Class sizes cap at 20 so every learner gets facilitator time. Every
      cohort is led by an SPCT — the top 1% of SAFe trainers — not a
      contract instructor.
    </p>

    <h2>What does the exam cover, and what's the pass rate here?</h2>
    <p>
      The SAFe Agilist exam is 45 multiple-choice questions in 90 minutes,
      taken online after the cohort. It covers the Lean-Agile mindset, the
      SAFe House of Lean, the Continuous Delivery Pipeline, PI Planning
      mechanics, and Leading by Example. Passing mark is 77%. Agile
      Agilist cohorts hit a <strong>98% first-attempt pass rate</strong>
      across the last 248 sessions.
    </p>

    <h2>What's the difference between Leading SAFe and SAFe for Teams (SP)?</h2>
    <p>
      Leading SAFe is the leader-facing certification — you leave able to
      launch and lead an Agile Release Train. SAFe for Teams (SP) is the
      practitioner-facing one — team members leave able to work inside an
      ART. Most transformations start with Leading SAFe for the leadership
      layer, then run SP as a company-wide upskill. If you're the person
      deciding whether to adopt SAFe, take Leading SAFe first.
    </p>

    <h2>Is Leading SAFe worth it — what jobs and salary does it unlock?</h2>
    <p>
      Leading SAFe unlocks Scaled Agile leadership roles: RTE ($120k–$160k
      CAD), Programme Director ($140k–$180k), Transformation Lead
      ($160k–$210k), and it's a prerequisite for the higher-value SPC
      certification which typically adds another $20k–$40k. In our 2026
      alumni survey, <strong>67% reported a promotion or role change
      within nine months</strong> of certifying.
    </p>

    <h2>Why choose Agile Agilist over the alternatives?</h2>
    <p>
      Agile Agilist is a Scaled Agile <strong>Gold Partner</strong>
      delivered by an SPCT — the top 1% of SAFe trainers, one of a handful
      in Canada. Every cohort is led personally by the SPCT (not a
      subcontractor), capped at 20 seats for real facilitator time, and
      backed by a written pass guarantee: if you don't pass on the second
      attempt, your next cohort is on us. Compare against
      the anonymous instructor pools that most training brokers use.
    </p>

  </section>

  <!-- END ANSWER-FIRST BLOCK -->

  <!-- Existing curriculum / testimonials / cohort schedule / registration form continues below -->

</article>
```

## Post-meta seed for FAQPage schema

Set the following JSON on the SA page as `aa_faq_jsonld` custom field. The
sitewide snippet (`aa-jsonld-sitewide-snippet.php`) picks it up and emits
FAQPage schema automatically.

```json
[
  {
    "q": "How much does Leading SAFe certification cost in Canada?",
    "a": "Leading SAFe (SAFe Agilist / SA) certification with Agile Agilist is USD $850 per seat, and includes the two-day live cohort, all workbooks, one exam attempt, one re-take voucher, and recordings for life. Canadian corporate teams can invoice in CAD; GST/HST applies where required."
  },
  {
    "q": "Who should take Leading SAFe?",
    "a": "Leading SAFe is aimed at leaders and change agents driving an enterprise Agile transformation — VPs of engineering and product, programme directors, transformation leads, senior scrum masters moving into RTE roles, and any executive on a SAFe steering committee. No prior SAFe experience is required, but two years of delivery experience makes the material land faster."
  },
  {
    "q": "How long is Leading SAFe, and when is the next cohort?",
    "a": "Two consecutive days, live-virtual, 9am–5pm Eastern. Cohorts run roughly every four weeks; the next confirmed dates are July 9–10 2026 and August 13–14 2026. Class sizes cap at 20 so every learner gets facilitator time."
  },
  {
    "q": "What does the SAFe Agilist exam cover, and what is the pass rate?",
    "a": "The SAFe Agilist exam is 45 multiple-choice questions in 90 minutes, taken online after the cohort. It covers the Lean-Agile mindset, the SAFe House of Lean, the Continuous Delivery Pipeline, PI Planning mechanics, and Leading by Example. Passing mark is 77%. Agile Agilist cohorts hit a 98% first-attempt pass rate across the last 248 sessions."
  },
  {
    "q": "Is Leading SAFe worth it — what roles and salary does it unlock?",
    "a": "Leading SAFe unlocks Scaled Agile leadership roles: RTE ($120k–$160k CAD), Programme Director ($140k–$180k), Transformation Lead ($160k–$210k), and is a prerequisite for the higher-value SPC certification. In our 2026 alumni survey, 67% reported a promotion or role change within nine months of certifying."
  }
]
```

---

## Applying the pattern to the other 13 course pages

The pattern is identical; only the copy changes. Priority order (from
`agile-agilist-strategic-optimization-plan.md`):

1. `/training/safe/sa/` — Leading SAFe — worked above
2. `/training/adv-safe/spc/` — SPC — biggest cannibalisation problem, fix first
3. `/training/ai-native/ai-native-foundations/` — AI-Native — lowest bounce, capitalise
4. `/training/adv-safe/aspc/` — ASPC
5. `/training/adv-safe/rte/` — RTE
6. Rest of the SAFe by role and advanced tracks
