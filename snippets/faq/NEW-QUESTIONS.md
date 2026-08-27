# New FAQ questions — SPC, ASPC, RTE

Paste each block into the matching `.aa-faqcol` group on the page. The FAQ
snippet reads the page's own `<details>` and sorts them, so **adding a question
here is all that is needed** — no snippet change.

Each block carries an explicit category class, `aa-faq--career` or `aa-faq--ai`
(also available: `aa-faq--exam`, `aa-faq--before`). That class decides the
bucket. Leave it off and the old keyword matching decides instead, so existing
questions are unaffected; misspell it and it falls back to the keywords rather
than inventing a bucket.

This is new, and it exists because the keywords are a good default and a bad
contract: "Does SPC let me earn as a licensed instructor?" is plainly a career
question and contains none of the career words, so it filed itself silently
under "Before you book". Four of the fifteen below did that on the first pass.
Whoever writes question sixteen should not have to reverse-engineer a regex to
place it.

All fifteen were run through the real `aa_faq_extract()` and land where the
heading says.

## What is deliberately not here

No salary figures, no "X% of employers" and no placement claims. The demand
section further up each page already carries the numbers you have sourced, and
a second set in the FAQ would be a second thing to defend. These answers point
at that section rather than restating it.

Nothing states which specific courses an SPC may teach. That is Scaled Agile's
licensing to define and it changes; the answer sends people to SAFe Studio for
the current list instead of naming courses we would then have to keep in sync.

---

## SPC — Career impact (has 1: "Where can SPC take my career?")

```html
<!-- wp:details {"className":"aa-faq aa-faq--career"} -->
<details class="wp-block-details aa-faq aa-faq--career"><summary>Is SPC a full-time role, or something I add to my current job?</summary><!-- wp:paragraph -->
<p>Both are common. Some SPCs move into a dedicated transformation or Agile CoE post; many others keep their existing job — Scrum Master, Product Manager, engineering lead — and use the credential to lead change from inside the team they already have. The course is built for either, because the hardest part is the same: getting an organisation to adopt something it did not ask for.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"className":"aa-faq aa-faq--career"} -->
<details class="wp-block-details aa-faq aa-faq--career"><summary>Which roles do employers usually fill with an SPC?</summary><!-- wp:paragraph -->
<p>Most commonly Enterprise or Transformation Agile Coach, Agile CoE Lead, Release Train Engineer, and internal consultant roles inside a transformation office. On the supplier side it is the standard entry requirement for delivery consultants at firms running SAFe engagements — for many of those postings SPC is a screening filter rather than a nice-to-have.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"className":"aa-faq aa-faq--career"} -->
<details class="wp-block-details aa-faq aa-faq--career"><summary>Does SPC let me earn as a licensed instructor alongside my main job?</summary><!-- wp:paragraph -->
<p>Yes — SPC is the credential that carries teaching rights, which is what separates it from every other SAFe certification and why people treat it as a second income stream as much as a job title. Which courses you are licensed to deliver, and on what terms, is set by Scaled Agile and does change: check the current list in SAFe Studio once your credential is active. We cover how to run your first class in the post-course coaching session.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"className":"aa-faq aa-faq--career"} -->
<details class="wp-block-details aa-faq aa-faq--career"><summary>How quickly does SPC pay off in career terms?</summary><!-- wp:paragraph -->
<p>It depends far more on your situation than on the credential. People already inside a SAFe adoption tend to use it immediately and see it recognised at the next review; people using it to change employer are running a job search, which takes as long as a job search takes. The market figures above are role compensation, not a promise about your outcome — we would rather set that expectation now than sell you a number.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->
```

---

## ASPC — Career impact (has none)

```html
<!-- wp:details {"className":"aa-faq aa-faq--career"} -->
<details class="wp-block-details aa-faq aa-faq--career"><summary>What roles does ASPC open that SPC does not?</summary><!-- wp:paragraph -->
<p>ASPC is the credential for people already doing the work who now want to lead it: Principal or Lead Agile Consultant, Transformation Director, and portfolio-level advisory work. Where SPC establishes that you can run an adoption, ASPC is aimed at the part that comes after — multiple trains, competing portfolios, and executives who have already been through one failed change programme.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"className":"aa-faq aa-faq--career"} -->
<details class="wp-block-details aa-faq aa-faq--career"><summary>Is ASPC worth it if I am already in an SPC role?</summary><!-- wp:paragraph -->
<p>If your engagements are getting larger or more political, yes — that is exactly the gap it addresses. If you are still delivering your first few trains, the honest answer is to spend another cycle doing that first. ASPC assumes real transformation experience to argue with, and the cohort discussion is most of its value.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"className":"aa-faq aa-faq--career"} -->
<details class="wp-block-details aa-faq aa-faq--career"><summary>Do employers and clients recognise ASPC when hiring for senior roles?</summary><!-- wp:paragraph -->
<p>Within organisations already invested in SAFe, yes — it reads as "has done this at scale, more than once". Outside that world it needs the same explanation any framework credential needs, so treat it as evidence supporting your track record rather than a substitute for one. It is most persuasive in consultancy selection and internal promotion to lead-coach positions.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"className":"aa-faq aa-faq--career"} -->
<details class="wp-block-details aa-faq aa-faq--career"><summary>What kind of work will I be able to do after ASPC?</summary><!-- wp:paragraph -->
<p>Advising at portfolio and executive level: designing an operating model rather than installing a framework, coaching leaders through the decisions that stall adoptions, and diagnosing why a transformation that looks correct on paper is not producing anything. You also take the facilitation material for the workshops that get those conversations to a decision.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->
```

## ASPC — AI &amp; SAFe 6.0 (has none)

```html
<!-- wp:details {"className":"aa-faq aa-faq--ai"} -->
<details class="wp-block-details aa-faq aa-faq--ai"><summary>How is AI changing what a senior SAFe consultant is expected to bring?</summary><!-- wp:paragraph -->
<p>The questions arriving from executives have shifted. Where the brief used to be "help us scale delivery", it is increasingly "we have AI pilots everywhere and nothing in production — what is wrong with how we work?" That is an operating-model question, and answering it is the part of the consultant's job that has changed most.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"className":"aa-faq aa-faq--ai"} -->
<details class="wp-block-details aa-faq aa-faq--ai"><summary>Does this course cover AI-Native ways of working?</summary><!-- wp:paragraph -->
<p>Yes. We cover where AI genuinely accelerates the flow of value, where it quietly adds rework, and how to keep humans accountable for the decisions that matter. If you want to go further, our AI-Native track treats this as its whole subject rather than one module.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"className":"aa-faq aa-faq--ai"} -->
<details class="wp-block-details aa-faq aa-faq--ai"><summary>What does it mean that SAFe is now "AI-empowered"?</summary><!-- wp:paragraph -->
<p>It means role-based AI assistance is treated as part of how the work gets done rather than a separate initiative — using AI to move faster while keeping people in the loop on the decisions. In practice, at your level, it is less about the tools and more about governance: who is accountable when the assistant is wrong.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"className":"aa-faq aa-faq--ai"} -->
<details class="wp-block-details aa-faq aa-faq--ai"><summary>What did SAFe 6.0 change for consultants?</summary><!-- wp:paragraph -->
<p>The centre of gravity moved from delivery scaling to business agility — flow measurement, Value Stream Management, and clearer enterprise roles. For a consultant that changes the opening conversation: the sponsor is more often a business leader asking about flow of value than an engineering leader asking about release cadence.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->
```

---

## AI-Native Value Architect — Before you book

**This course was called AI-Native Change Agent.** The URL still is
(`/training/ai-native/ai-native-change-agent/`), the menu still says the old
name, and anyone who saw it under the old name — a colleague's recommendation,
a bookmark, a search result — arrives at a page whose title does not match what
they were looking for and assumes they are on the wrong course.

The first question below exists to answer that in the one place they will look.
It is forced to **Before you book** with `aa-faq--before`: it contains "AI-" so
the keyword matcher would otherwise file it under AI &amp; SAFe 6.0, which is
where nobody checking they are on the right page would think to look.

```html
<!-- wp:details {"className":"aa-faq aa-faq--before"} -->
<details class="wp-block-details aa-faq aa-faq--before"><summary>Is this the same course as the AI-Native Change Agent?</summary><!-- wp:paragraph -->
<p>Yes. AI-Native Change Agent was renamed AI-Native Value Architect — same course, same three days, same certification. The web address still carries the old name, so a bookmark or an older link will bring you to exactly the right place. If you were recommended the Change Agent course, this is it.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"className":"aa-faq aa-faq--before"} -->
<details class="wp-block-details aa-faq aa-faq--before"><summary>Why was the name changed?</summary><!-- wp:paragraph -->
<p>"Change Agent" described how the work feels from the inside; "Value Architect" describes what you are actually accountable for — designing where AI creates value across the organisation and proving it did. The second is what people found themselves explaining to their sponsors anyway, so the title now matches the conversation.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->
```

### Also carrying the old name

- **Menu item 27524**, under Training → AI-Native, still reads "AI-Native Change
  Agent". Retitle it to "AI-Native Value Architect" — the URL does not need to
  change, and should not.
- The register snippet is already correct (`AI-Native Value Architect
  Certification`), so the hero and checkout use the new name today. That is the
  mismatch a visitor currently sees: new name on the page, old name in the menu
  that got them there.

---

## RTE — Career impact (has 2)

```html
<!-- wp:details {"className":"aa-faq aa-faq--career"} -->
<details class="wp-block-details aa-faq aa-faq--career"><summary>Is RTE a promotion from Scrum Master, or a different role entirely?</summary><!-- wp:paragraph -->
<p>Different, though it is the usual next step. A Scrum Master serves one team; an RTE serves the train — a dozen teams, their dependencies, and the leaders who fund them. The facilitation instinct carries over; the influencing-without-authority part is genuinely new, and it is what the course spends most of its time on.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"className":"aa-faq aa-faq--career"} -->
<details class="wp-block-details aa-faq aa-faq--career"><summary>Which job titles will this credential actually match?</summary><!-- wp:paragraph -->
<p>Release Train Engineer most directly, plus Senior Scrum Master, Program or Delivery Manager, and Agile Program Coach. Postings vary in what they call it — "ART Lead" and "Programme Delivery Lead" are the same job — so search on the responsibilities as well as the title.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->

<!-- wp:details {"className":"aa-faq aa-faq--career"} -->
<details class="wp-block-details aa-faq aa-faq--career"><summary>Do I need to be in an RTE role already for this to be worth taking?</summary><!-- wp:paragraph -->
<p>No, and a good share of each cohort is not. Two groups get the most from it: people about to take an ART and want to arrive credible, and Scrum Masters or Product Owners who keep hitting problems that live above their team. If your organisation has no trains at all, Leading SAFe is the better starting point.</p>
<!-- /wp:paragraph --></details>
<!-- /wp:details -->
```
