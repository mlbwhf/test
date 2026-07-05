# A2 — CRM Activation: Segments + Email Sequences
_Status: **APPROVED by Mark 2026-07-05** — copy approved as drafted; returning-student discount set at **10% (code `ALUMNI10`)**. Outstanding: GBP review short-link for A6._
_Rules honored: every email links **directly to the Eventbrite listing** (no intermediate pages); ads and ad landing pages untouched; leads ≠ conversions — success is measured only in the A1 report._

## Tracking convention (read before building links)

Every link uses an Eventbrite **tracking link** so paid registrations attribute per sequence in the A1 report (`Attribution` section). Create in Eventbrite: Event → Marketing → Tracking links, one per sequence+email:

```
aff=em-quiz-1 / em-quiz-2 / em-quiz-3          (Quiz-to-cohort emails 1–3)
aff=em-alum-1 / em-alum-2 / em-alum-3 / em-alum-4
aff=em-react-1 / em-react-2 / em-react-3
```

Link shape: `https://www.eventbrite.ca/e/<event-id>?aff=em-quiz-1`
Organizer page (all live listings): `https://www.eventbrite.ca/o/agileagilist-56013628813`

## Segments (HubSpot active lists)

| Segment | Criteria | Sequence |
|---|---|---|
| **Quiz leads** | Completed Cert Recommender OR Career Compass (form submission exists); has recommended path/archetype property; NOT an Eventbrite/Stripe customer | 1. Quiz-to-cohort |
| **Alumni — SA** | Deal/registration for Leading SAFe (SA), closed-won | 2. Alumni ladder → offer **POPM or SSM** |
| **Alumni — SSM/POPM** | Registration for SSM or POPM | 2. Alumni ladder → offer **RTE or SPC** |
| **Alumni — any** | Any completed course | 2. Alumni ladder → **AI-Native Foundations** as the new frontier |
| **Cold inquiries** | Contact created or last engaged within 18 months; zero registrations; not in the two segments above | 3. Reactivation |

Suppression on all lists: unsubscribed, bounced, active-sequence membership in another A2 sequence (one sequence per contact at a time).

---

## Sequence 1 — Quiz-to-cohort (3 emails / 2 weeks)

**Day 0 — "Your result, made concrete"**
Subject: `Your {{quiz_result}} path — here's the exact next cohort`
- Recap their quiz result in one sentence ("Your result pointed you at {{recommended_course}}").
- One paragraph: what the certification unlocks (use the course's hero_sub copy from the site).
- **CTA button:** "Reserve your seat — {{next_cohort_date}}" → Eventbrite listing `?aff=em-quiz-1`
- One alumni story (2–3 sentences, from the A6 testimonial bank once live; until then use an existing permissioned quote).

**Day 5 — "What the class is actually like"**
Subject: `What happens in the 2 days of {{recommended_course}}`
- Bullet the module arc (from courses.json modules), exam-included + pass guarantee.
- CTA → `?aff=em-quiz-2`

**Day 12 — "Cohort closes" (only if a real date is near)**
Subject: `{{next_cohort_date}} cohort — registration closing`
- Honest scarcity only: real date, real seat count if available via API.
- CTA → `?aff=em-quiz-3`

## Sequence 2 — Alumni ladder (4 emails / 3 weeks)

Personalization by segment: SA alumni → POPM/SSM; SSM/POPM alumni → RTE/SPC; everyone → AI-Native Foundations in email 4.

**Day 0 — "Your next rung"**
Subject: `You're certified {{current_cert}} — here's the natural next step`
- "Most {{current_cert}} holders we train go on to {{next_course}} because …" (one concrete career reason).
- Returning-student code: `ALUMNI10` (10%, set by Mark 2026-07-05). CTA → `?aff=em-alum-1`

**Day 6 — proof**
Subject: `How {{first_name_of_alumnus}} used {{next_course}}` — one story, one CTA → `?aff=em-alum-2`

**Day 13 — the discount, plainly**
Subject: `Your returning-student discount on {{next_course}}`
- Restate code + expiry (end of month). CTA → `?aff=em-alum-3`

**Day 20 — the frontier**
Subject: `The certification that didn't exist when you trained with us`
- AI-Native Foundations: the only-in-Canada claim, Toronto cohort first. CTA → Corsizio/Eventbrite listing `?aff=em-alum-4`

## Sequence 3 — Reactivation (3 emails / 2 weeks)

**Day 0 — "What's new since you asked"**
Subject: `Since you last looked: AI-Native training, new cohorts`
- Two updates max: AI-Native track (only-in-Canada claim) + current cohort calendar. CTA → `?aff=em-react-1`

**Day 6 — "The question you came with"**
Subject: `Still weighing a SAFe certification? The 3 questions that decide it`
- Answer the three commonest decision questions in-line (cost/ROI, time, which cert). CTA → `?aff=em-react-2`

**Day 13 — dates only**
Subject: `Upcoming cohort dates (next 8 weeks)`
- Plain list of real dates, each a direct Eventbrite link with `?aff=em-react-3`.

---

## Build checklist (agent, once copy approved)

- [x] Mark approves all copy above and sets discount: 10% → `ALUMNI10` (2026-07-05)
- [ ] Three active lists built in HubSpot per the segment table
- [ ] Eventbrite tracking links created per the `aff` convention
- [ ] Sequences built in HubSpot (marketing emails + delays), suppression rules on
- [ ] First send small: 10% of each segment for 48h, check bounces/unsubs, then full
- [ ] A1 report confirms attribution codes appearing → **Done** criterion met
