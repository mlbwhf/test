# GO-LIVE Checklist — Leading SAFe Native Checkout (Stripe + Fluent Forms)
_Do in order. 🟦 = you (wp-admin) · 🟩 = me (I hand you paste-ready content). Eventbrite stays running in parallel the whole time._

## Phase 1 — Payments
1. 🟦 **Connect Stripe to Fluent Forms:** Fluent Forms → **Global Settings → Payments → Stripe → Connect**.
2. 🟦 **In the Stripe dashboard**, turn on the payment methods you want: cards, **Apple/Google Pay**, **BNPL** (Klarna/Affirm/Afterpay), and your **currencies**.

## Phase 2 — Build the registration form  *(full field spec: `leading-safe-implementation-runbook.md` → Deliverable 1)*
3. 🟦 Fluent Forms → **New Form** → name it **"Leading SAFe — Register"**. Add fields: Name, Email, Company, Phone, **Cohort (dropdown)**, Quantity, **Stripe Payment** field (set the price), Consent checkbox.
4. 🟦 On the **Cohort** field → Advanced → **Dynamic default value = `{get.cohort}`** (this pre-fills the date from the link).
5. 🟦 **Capacity:** Settings → *Form Scheduling & Restrictions* → set a max-entries limit; close/remove a cohort option when it fills.
6. 🟦 Copy the form's **shortcode** → note the **FORM_ID** and the **price**.

## Phase 3 — Emails  *(paste-ready templates: `leading-safe-registration-emails.md`)*
7. 🟦 Settings → **Email Notifications** → add **Admin alert** (to your email).
8. 🟦 Add **Attendee ticket confirmation** (paste the HTML); **Send To = `{inputs.email}`**; **Conditional Logic → Payment Status = paid**.
9. 🟦 Set a proper **From name/email** (+ an SMTP plugin if possible) so emails don't go to spam.

## Phase 4 — HubSpot
10. 🟦 Fluent Forms → **Integrations → HubSpot** (or **Zapier → HubSpot**): create **contact + deal**, map the fields, **trigger on Payment = paid**.

## Phase 5 — Page + register links
11. 🟦 **Send me: FORM_ID + price + the cohort dates.**
12. 🟩 **I deliver** the paste-safe **Enroll section** (band + form) and the **Course/CourseInstance schema**.
13. 🟦 Paste the **Enroll section** into `/training/safe/sa/` (Code editor, near the top); paste the **schema** into AIOSEO → Schema → Custom (or WPCode).
14. 🟦 In each **Easy Events Calendar "sa" event**, set its **Register URL** to:
    `https://agile-agilist.com/training/safe/sa/?cohort=<DATE>#register`
    *(keeps your hero list + calendar design exactly as-is; just sends "Register" to the on-site form, pre-selecting that date).*

## Phase 6 — Test, launch, expand
15. 🟦 **Stripe TEST mode** → do a full dry run: pay → check (a) entry in Fluent Forms, (b) contact+deal in HubSpot, (c) admin alert to you, (d) branded ticket to the attendee renders.
16. 🟦 Switch Stripe to **LIVE** → one small real test → refund it.
17. 🟦 **Go live** on `/sa/`. Keep Eventbrite running.
18. ⬜ Measure native vs Eventbrite **2–3 weeks**.
19. 🟦🟩 **Roll out** to other courses: in Fluent Forms **duplicate** the Leading SAFe form → change price/cohorts → I supply that course's Enroll snippet. (One form per course.)

## The 2 things that unblock everything
- **Phase 1–4 are all yours** and can start now (Stripe → form → emails → HubSpot).
- **The moment you send me FORM_ID + price + dates (step 11),** I produce the page Enroll section + schema (step 12) so you can paste and launch.

### Reference docs (committed)
- `leading-safe-implementation-runbook.md` — full spec + ownership + form fields
- `leading-safe-registration-emails.md` — admin alert + branded ticket email
- `course-dates-architecture.md` — one-page + dates model
- `direct-stripe-vs-woocommerce.md` — why direct Stripe
