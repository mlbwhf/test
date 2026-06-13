# Course Dates: One Page + Schedule List vs Page-Per-Date
_How comparators structure cohort dates, and the SEO-correct model for you._

## The verdict: ONE course page with a list of dates — NOT a page per date
Both the competitor pattern and Google's schema guidance say the same thing.

### What comparators do (KnowledgeHut, Simplilearn, Edureka)
- **One canonical page per course** (e.g. "Leading SAFe Certification").
- On it, an **"Upcoming Cohorts / Schedule" list** — each row = **date · time/timezone · format · price · [Enroll] button**.
- Clicking a row's **Enroll** carries *that* cohort into checkout (the "pointer to the chosen date").
- They do **NOT** publish a separate indexed landing page for every date.

### Why — the SEO reason (decisive)
- Google's structured-data guidance: model **one `Course` with multiple `hasCourseInstance`** entries (each instance = a dated cohort with `startDate`, format, price). ([schema.org/CourseInstance](https://schema.org/CourseInstance), [Course schema guide](https://www.greadme.com/blog/schemas/what-is-course-schema-complete-guide))
- **Separate page per date = thin, near-duplicate content** that splits link authority across dozens of URLs — exactly the cannibalization that's already burying your training pages on page 3–5. One strong page concentrates authority and ranks.
- One page also lets Google show **multiple dates in education-rich results** from a single URL.

**So:** page-per-date is the wrong model for organic. The single-page-with-schedule is the standard *and* fixes your ranking problem.

### The one exception
A **dedicated date/landing page** is only worth it for a **specific paid-ad campaign** (a focused conversion LP for one promoted cohort) — kept `noindex` so it doesn't compete organically. Not for your normal catalog.

---

## How to build it with YOUR stack
**1. The course page = canonical (e.g. `/training/safe/sa/`).** Keep one strong page per course.

**2. "Upcoming Cohorts" schedule list on that page** — auto-generated from **The Events Calendar** (your SAFe cohort events), so it updates itself as you add dates. Each row: date · timezone · format · price · **Enroll**. (You already render an events widget; this formalizes it and surfaces it near the top.)

**3. Per-row "Enroll" → registration form with the cohort pre-selected.** Two clean ways with Fluent Forms:
- **URL parameter:** Enroll links to the form with `?cohort=2026-06-20` → Fluent Forms **dynamically pre-fills** the cohort dropdown from the query string. (Fluent Forms supports dynamic default values from URL params.)
- Or anchor to the form on the same page with the cohort pre-selected.
This is the "pointer to the chosen date."

**4. Schema = one Course + many CourseInstance** (add via AIOSEO Custom Schema or WPCode). Example below.

**5. When you add a class** (from the SAFe Studio workflow): add the event date in The Events Calendar + the cohort option in the form. The schedule list + schema update from there — **no new page.**

### Course + CourseInstance JSON-LD (one page, many dates)
```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Leading SAFe® (SAFe Agilist) Certification",
  "description": "SPCT-led Leading SAFe certification — live-virtual, exam included.",
  "provider": { "@type": "Organization", "name": "Agile Agilist", "url": "https://agile-agilist.com" },
  "hasCourseInstance": [
    { "@type": "CourseInstance", "courseMode": "online",
      "startDate": "2026-06-20", "endDate": "2026-06-21",
      "location": { "@type": "VirtualLocation", "url": "https://agile-agilist.com/training/safe/sa/" },
      "offers": { "@type": "Offer", "price": "[PRICE]", "priceCurrency": "USD", "availability": "https://schema.org/InStock" } },
    { "@type": "CourseInstance", "courseMode": "online",
      "startDate": "2026-07-18", "endDate": "2026-07-19",
      "location": { "@type": "VirtualLocation", "url": "https://agile-agilist.com/training/safe/sa/" },
      "offers": { "@type": "Offer", "price": "[PRICE]", "priceCurrency": "USD", "availability": "https://schema.org/InStock" } }
  ]
}
```

## Recommendation
- **Model:** single canonical course page + auto "Upcoming Cohorts" list + per-row Enroll (cohort pre-selected) + Course/CourseInstance schema. Mirror KnowledgeHut/Simplilearn.
- **Don't** build a page per date for organic. Reserve a dedicated LP only for a specific paid campaign (noindex).
- This **also helps the rankings** (one strong page) and the **bounce** (dates + enroll surfaced, on-site checkout).
