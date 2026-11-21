# Site fixes for the web team (from the ads review, 20 Nov 2026)

Read-only review of the English course pages that the ads point to. **I changed nothing on
WordPress** (your rule). This list is in priority order, because ads send paid traffic to these pages, and
Google reviews landing pages against the ads.

## 1. Fix before the ads go live (copy rules and ad-policy risk)
| # | Issue | Where |
|---|---|---|
| 1.1 | **"Money-back" pass-guarantee wording**: "Retake the next cohort free, or get a full refund. No questions." Your rule: no pass guarantee or money-back; use "exam prep and support". | AI-Native Foundations, Value Architect, Leading the AI-Native Org, RTE, LPM, POPM, DevOps, ASM (in the opening paragraph on RTE, LPM, POPM, DevOps, ASM). SPC's "Exam prep and support" card still ends "or get a full refund". Clean: Launching, Fundamentals, ASPC |
| 1.2 | **"Gold" instead of Platinum** | /about/ ("Scaled Agile Gold Partner"), Leading the AI-Native Org intro ("Gold SPCT"), NY / Chicago / Dubai AI pages, Europe and South Africa pages, /training/safe/sa/enroll-leading-safe-pilot/. Also check Home, Services, Customers, FAQ, Leading SAFe, Large Solution, Terms, assessments and /face-to-face-ai-native-canada/, which also matched "Gold". FR/AR pages too |
| 1.3 | **Black Friday dates**: /black-friday/ says **23-30 Nov**. Owner-confirmed (20 Nov): the offer runs **20-30 Nov**, labelled Black Friday on 20-29 Nov and **Cyber Monday on 30 Nov**. Update the page (and check the checkout applies 15% from 20 Nov) | /black-friday/ |
| 1.4 | **Unsourced statistics**: "78% of enterprise AI rollouts fail…", "6 mo avg time to enterprise adoption", "saving 2+ hours per day", "measurable productivity gains in the first week" | Value Architect, AI-Native Foundations |
| 1.5 | **Testimonials look templated**: the same sentences repeat across courses, and "Marcus L." appears as an RTE, a CEO and a DevOps Lead. Google can treat this as misrepresentation | All course pages |
| 1.6 | **Ratings/graduate counts don't agree**: 4.9 / 2,500+ certified; 3,000+ (AINF); 200+ reviews (city pages); 4.9 from 2,500 reviews in structured data (RTE, LPM, POPM). Pick one sourced figure, or remove | Course and city pages |

## 2. Make pages match what the ads say
| # | Issue | Where |
|---|---|---|
| 2.1 | **Add PI Outcome Planning** to the course page. You confirmed the course covers it, but today only the blog says it (/the-two-day-pi-planning-event-is-now-one-day/ and /the-pi-objective-is-gone-…/). The ad leads with it | Launching AI-Native ARTs |
| 2.2 | **Delivery format**: course page and FAQ say "every cohort runs live online"; NY/Chicago/Dubai say "In-Person & Live Virtual"; /face-to-face-ai-native-canada/ says the full AI-Native track runs in person. The **Face-to-Face** Google campaign points here. Which is true? | AI-Native Foundations |
| 2.3 | **1 day or 2 days?** The course page says 2 days; /event/ listings say "one-day working session". In-person: the FAQ says "Both", the header says "Live online". The exam FAQ says "taken online" for an in-class capstone | Leading the AI-Native Org |
| 2.4 | **Prerequisites contradict each other**: the header says "No prerequisites", while structured data or the FAQ says Leading SAFe (RTE, LPM), "familiarity with Agile" (POPM), or "a valid Scrum Master credential" (ASM) | RTE, LPM, POPM, ASM |
| 2.5 | **Curriculum subhead copied from SPC** ("Train to teach SAFe…") | RTE, LPM, POPM, DevOps, ASM |
| 2.6 | RTE intro says "SPCT"; the body says SPC/ASPC | RTE |
| 2.7 | ASPC FAQ says ASPC unlocks ARCH and ASE; the SPC page lists them as already teachable by an SPC | ASPC, SPC |
| 2.8 | "SAFe Insider" (every other page says "SAFe Studio") | Launching AI-Native ARTs |

## 3. Housekeeping
- **City pages show the placeholder** "Next cohort starts [DATE]": ai-training-new-york, -chicago, -dubai.
- **SAFe pages filed under the AI-Native Foundations URL**: …/ai-native-foundations/safe-certification-training-london, -europe, -south-africa, safe-ai-training-middle-east.
- **Duplicate checkout page**: /training/safe/sa/enroll-leading-safe-pilot/ ("From $850", "Gold Partner").
- **Blank list price** ("$ $X") on 12 course cards: ARCH, ASE, SASM, BO, SDP, SP, SA-Gov, SHWA, SHWP, AINF, AINCA, AINORG.
- Cert Recommender says "7 AI-Native tracks"; there are 5 AI-Native course pages.
- URL slugs don't match course names (…/ai-native-ready-certification/ is Fundamentals, …-2/ is Leading the AI-Native Org, …/ai-native-change-agent/ is Value Architect). Don't change them while ads point at them; it would break the ads. Just noting it.

## 4. Added 21 Nov (APM, Business Owner, Architects, Innovation pages)
- **APM and Business Owner also carry the refund wording** (add them to 1.1): "money-back pass guarantee … full refund. No questions." It also contradicts /refund/ (full refund only for cancellations 7+ days before the class). Architects is clean: "exam prep and instructor support until you pass" is the model wording.
- **Delivery format**: APM, BO and ARCH headers say live-virtual, but their FAQs say "in-person or live-virtual". Pick one.
- **Unsourced statistics** on all three (salaries, "2.8x higher product success", "40% higher PI value delivery", job counts), sourced only as "Scaled Agile & public job-market data". **Templated testimonials** on all three. **Copied SPC curriculum subhead** on APM and BO.
- **Placeholders**: an empty crossed-out "$" price on BO (top bar, intro, final button) and ARCH; the cohort widget has two different lengths on BO (2 and 4 days) and ARCH (3 and 4).
- **16 PDUs** on both 2-day and 3-day courses looks templated. Confirm the real numbers.
- **APM FR/ES** show $2,000 struck through above $2,150; English shows $2,150 struck through above $1,799.
- **ARCH** uses a different calendar shortcode (`easy_events_calendar`). Check that the calendar renders.
- **Innovation Framework**:
  - The pages can't be booked yet: no dates, no prices, and the button goes to twochasms.com.
  - **For ads**: add dates, prices and the website checkout (Stripe, marked `origin=agile-agilist.com`), so a paid registration happens on agile-agilist.com.
  - The hub and Facilitator say "seven workshops"; the course pages link to "all fourteen".
  - The assessment credits *Mutation Readiness* for the Principles; the hub credits *The Innovation Playground*.
  - /training/ says 22 certifications, but its meta and footer say 19.
  - /services/innovation-culture/ has the typo "The the Six Practices", with only five listed.
