# Virtual Training Vertical — "Gate for Training"

Target: live-virtual and blended training providers (certification ATOs, independent instructors, training companies, bootcamps, corporate L&D vendors). First customer and proving ground: Agile Agilist (SAFe Gold Partner, cohorts across Toronto/NA, UK, EU, South Africa, Gulf).

---

## 1. Why this vertical, from our own experience

What running Leading SAFe, POPM, SPC, RTE, AI-Native cohorts on Eventbrite + WordPress actually costs us today (from the runbooks in this repo):

| Pain we live with | Evidence in our stack | What it costs |
|---|---|---|
| ~7% Eventbrite take on a $1,299 seat | `onsite-registration-solution.md` | ~$90 per seat, more than the instructor's coffee budget for the whole cohort |
| Buyer bounced off-domain to eventbrite.com | same | a second drop-off point on a page that already buries the CTA |
| 8 overlapping event/Eventbrite plugins | same | slow pages, fragile checkout, CPU plan on SiteGround |
| Capacity and roster handled by a form entry limit | `direct-stripe-vs-woocommerce.md` | overselling risk, manual roster to SAFe Studio before class |
| One Fluent Form per course, price inside the form | `registration-rollout-playbook.md` | 10 forms to maintain, no single source of truth for price |
| Cohort dates in The Events Calendar, cohort list in a PHP snippet, dropdown populated by a filter | `course-dates-architecture.md`, `aa-cohorts-wpcode-snippet.php` | every new cohort touches three places |
| Confirmation "ticket" email built by hand per course | `leading-safe-registration-emails.md` | no transfers, no ICS, no reminders, no pre-work |
| Regional landing pages in GBP/EUR/ZAR/AED/SAR but one checkout currency | `google-ads-regional-playbook.md` | FX friction at the moment of payment |
| Corporate buyers: "Request a group quote" form, then manual invoice | `leading-safe-native-checkout-build.md` | the biggest deals are the slowest to collect |
| HubSpot sync through Zapier | same | brittle, delayed, no payment status |
| BNPL/financing wanted because competitors (KnowledgeHut, Simplilearn) offer it | same | lost high-ticket conversions |

Every independent trainer and small ATO has this exact stack. That is the market.

## 2. Jobs a training provider needs done

1. Publish courses and dated cohorts (time zone, format, instructor, capacity, price per region).
2. Sell seats to individuals (card, wallet, BNPL, local currency) and to companies (quote, PO, invoice, net-30, multiple learners).
3. Hold the money safely until delivery and pay out instructors, co-trainers and partners.
4. Fulfil: roster, calendar invites, Zoom/Teams links, pre-work, reminders, materials, attendance, certificates, exam vouchers, credits (PDU/SEU).
5. Handle change: transfers between cohorts, substitutes, cancellations under policy, waitlists, cohorts that don't reach minimum.
6. Comply: taxes (GST/HST, VAT, UAE VAT), receipts and invoices, learner privacy, certification body rules.
7. Know the numbers: revenue per course, cohort and region; margin after instructor cost; deferred revenue until delivery; refund and no-show rates.
8. Grow: SEO-correct course pages, regional pricing, CRM sync, reviews, re-marketing of alumni.

Everything below is a service against one of those eight jobs.

## 3. The service catalogue

### 3.1 Catalogue and scheduling (job 1)
- **Course and Cohort model.** Course (canonical page, evergreen) with many Cohorts (dated instances), matching Google's `Course` + `hasCourseInstance`. A cohort has sessions (day 1, day 2), time zone, delivery format (live-virtual, in-person, hybrid, self-paced), instructor(s), capacity, minimum enrolment, sale windows and price lists.
- **Regional price lists.** One cohort, prices in USD, CAD, GBP, EUR, ZAR, AED, SAR, INR, chosen by buyer locale. Fee schedules already exist per currency in `@gate/pricing`.
- **Early-bird and tiered pricing.** Date-based and quantity-based tiers on the ticket type.
- **Waitlist and demand-triggered cohorts.** When the waitlist for a course in a region hits N, propose a new cohort (and the instructor availability) to the organizer. Nobody does this; it turns marketing data into schedule decisions.
- **Embeddable schedule + checkout widget.** A `<script>` or WordPress block that renders the cohort list and an on-page checkout. Replaces `[aa_cohorts]`, the Fluent Form, the Eventbrite modal and the dropdown populator in one drop-in. Server-rendered fallback for SEO.
- **JSON-LD generator.** Course + CourseInstance schema served from the API per course page.

### 3.2 Checkout for individuals (job 2)
- Embedded, on-domain checkout (Stripe Payment Element), Apple Pay, Google Pay, Klarna/Affirm/Afterpay, local methods (iDEAL, Bancontact, SEPA, UPI later).
- Multi-seat purchase with learner details captured per seat (name, email, company, dietary/accessibility for in-person).
- Coupons, referral codes, alumni discounts.
- Instalments: 3- or 4-pay plans run by the platform with the seat locked until paid (not only BNPL, which rejects some buyers).
- Pass-fee-to-attendee option; already in the pricing engine.
- Abandoned checkout recovery with the cohort still held for 20 minutes.

### 3.3 Corporate billing (job 2, the money most providers leave on the table)
- **Corporate account** with a training coordinator who books multiple learners, sees the roster and invoices.
- **Quote → PO → invoice → payment** flow: seat held in `invoice_pending`, invoice with PO number, net-30, partial payments, auto-reminders, dunning, payment by card, ACH, SEPA, wire, UAE bank transfer.
- **Consolidated monthly invoicing** for large accounts.
- **Training budget wallet.** A company pre-funds a balance (earns the platform float) and coordinators spend it on any cohort; unused budget reports for finance.
- **Invoice financing.** Platform pays the provider on delivery, collects from the corporate at net-30/60. This is the training-specific form of the ticket-backed advance in the blueprint and the reason to be a money platform rather than a scheduler.

### 3.4 Money handling and payouts (job 3)
- Same-day payout into the provider's Gate account (free), instant to external bank at 1%.
- **Instructor and partner splits.** Contract instructors paid a day rate or percentage per cohort through the existing split engine; co-marketing partners paid a referral share; venue paid for in-person days. All settle through the ledger with transfers on delivery.
- **Delivery-linked release ("cohort guarantee").** Buyer funds settle to the provider's payable on booking but release to payout on the cohort's end date, with an opt-in for early release against a reserve. Buyers see a guarantee badge; chargeback rates fall; the float earns the platform yield.
- **Minimum-enrolment protection.** If a cohort is cancelled for low numbers, refunds and transfers run automatically from the held funds; optionally insured so the provider still covers instructor costs.
- **Cross-border instructor payouts** in GBP, EUR, ZAR, AED, INR via Stripe Connect cross-border, later Wise or stablecoin rails.
- **Deferred revenue done right.** Ledger entries carry `effectiveAt`; recognition posts on delivery date so the P&L matches what accountants expect.

### 3.5 Fulfilment automation (job 4)
- Calendar invites (ICS) per session in the learner's time zone, with changes propagating.
- Zoom and Microsoft Teams meeting creation per cohort, unique join links per learner, attendance pulled back from the meeting report.
- Email and SMS sequence: confirmation ticket, pre-work T-14, reminder T-7 and T-1, day-of link, post-class survey, certificate, exam instructions, review request. Branded templates replace the hand-built HTML in `leading-safe-registration-emails.md`.
- **Certification-body roster export.** For SAFe: a per-cohort CSV in the SAFe Studio import format plus a checklist the day before class; where a body offers an API (Scrum.org, PMI partner feeds), push directly. The "remember to add the attendee to the SAFe Studio roster" line in our admin email becomes a button.
- Exam voucher inventory and distribution; PDU/SEU statements; certificate of completion with verification URL.
- Materials delivery (PDF, links) gated to paid seats.

### 3.6 Changes and self-service (job 5)
- Learner portal: transfer to another cohort (policy: free until T-7, fee after), substitute a colleague, cancel under the published policy, download receipt or invoice, re-send calendar invite.
- Organizer rules engine: cancellation and transfer policy per course, auto-applied; refunds post pro rata through the ledger (already built).
- Waitlist auto-offer when a seat frees up, with a 24-hour hold.

### 3.7 Compliance (job 6)
- Stripe Tax: Canadian GST/HST by province, UK and EU VAT, UAE 5% VAT, South Africa VAT. Live-virtual training place-of-supply rules differ by jurisdiction; the platform stores the buyer evidence and lets counsel set the rule per corridor.
- Receipts and tax invoices that meet local format rules (UAE tax invoice fields, EU VAT invoice fields).
- Learner data: PIPEDA, GDPR, UAE PDPL; EU tenants pinned to the EU region; data export and deletion.
- PCI stays at SAQ-A: the platform never touches card numbers.

### 3.8 Reporting (job 7)
- Revenue by course, cohort, region, channel and instructor; margin after instructor and venue cost; fill rate per cohort; days-to-sell-out; refund, transfer and no-show rates; corporate receivables ageing; deferred vs recognised revenue; tax reports per jurisdiction.
- Exports to QuickBooks, Xero, and CSV; webhook feed for the data warehouse.

### 3.9 Growth and CRM (job 8)
- Native HubSpot sync (contacts, companies, deals, payment status, cohort attendance) replacing Zapier; also Salesforce and generic webhooks.
- Google Ads and Meta conversion events fired server-side from paid orders, with cohort and region attributes.
- Alumni segments for the next certification (SA → POPM → SPC ladder) with one-click re-enrol offers.
- Reviews collected post-class and published with schema.

### 3.10 AI inside the product (the layer competitors cannot copy quickly)
- Organizer copilot: "which cohort should I open next and where" from waitlists, regional demand and instructor availability; draft a corporate quote from an email; explain any payout; reconcile a month.
- Learner assistant: answers prerequisite, schedule and transfer questions from the course data, hands off money actions to the policy engine.
- Agent checkout: enterprise L&D agents book seats through the MCP server with a scoped payment token; approvals stay with humans.
- All of it through the existing AI gateway, so a provider can bring their own model.

## 4. What exists in the code today vs what this vertical adds

| Capability | Status | Where |
|---|---|---|
| Ledger, pricing, splits, settlement, refunds | built | `packages/ledger`, `packages/pricing`, `packages/core` |
| Stripe Connect payments, webhooks | built | `packages/payments-stripe` |
| Events, ticket types, orders, parties (venue/vendor) | built | `packages/core` |
| API, OpenAPI, idempotency, MCP, dashboard | built | `apps/api`, `apps/mcp`, `apps/web` |
| Course and Cohort with sessions, time zone, format, instructors, min enrolment, waitlist | new | `packages/core` (Course, Cohort, Session, Seat entities) |
| Seat as the unit (per learner, transferable, substitutable) | new | `packages/core` |
| Regional price lists, early-bird tiers | new | `packages/pricing` (PriceList) |
| Corporate accounts, quotes, invoices, PO, net terms, partial payments | new | `packages/core` + `packages/payments-stripe` (Invoices) |
| Delivery-linked release and reserves | new | `packages/core` scheduler on cohort end date |
| Instructor party kind and day-rate split | small change | `packages/pricing` split rules, `packages/core` Party kind |
| Embeddable schedule + checkout widget, JSON-LD endpoint | new | `apps/widget` (Preact or vanilla), `apps/api` |
| Fulfilment: ICS, Zoom/Teams, email sequences, roster export | new | `packages/fulfilment` + `apps/worker` (Temporal or BullMQ) |
| Learner portal | new | `apps/web` routes with magic-link auth |
| Stripe Tax, tax invoices | new | `packages/payments-stripe` |
| HubSpot native sync | new | `packages/integrations-hubspot` |

## 5. Migration path for Agile Agilist (dogfood plan)

1. Import courses from the event categories (`sa`, `popm`, `asm`, `spc`, `aspc`, `rte`, `lpm`, `apm`, `devops`, `ai-native`) and upcoming cohorts from The Events Calendar.
2. Drop the Gate schedule widget on `/training/safe/sa/` in place of `[aa_cohorts]` + Fluent Form 3. Keep Eventbrite live for other courses during the pilot.
3. Run two or three Leading SAFe cohorts; compare conversion, fee cost and admin time against the Eventbrite path.
4. Switch regional pages (London, Europe, South Africa, Middle East) to regional price lists; same cohort, local currency at checkout.
5. Move corporate deals to quote → invoice; measure days-to-cash.
6. Roll the widget to every course, then retire the 8 event plugins and the per-course forms.
7. Publish the result as the first case study for the vertical.

## 6. Pricing for the vertical

| Plan | Who | Price | Includes |
|---|---|---|---|
| Instructor | solo trainers | free, per-seat fee only | catalogue, checkout, payouts, fulfilment emails, portal |
| Training company | 2–20 instructors | $99/month + per-seat fee | corporate billing, instructor splits, HubSpot, reporting, Stripe Tax |
| ATO / Enterprise | certification partners, bootcamps | $499/month + per-seat fee | SSO, API and MCP, invoice financing, delivery-linked release, EU region, custom roster integrations |

Per-seat fee follows the blueprint (2.5% + $0.50 capped at $5 into a Gate account). Corporate invoices carry a flat $15 or 1% fee, whichever is lower. Invoice financing is priced per deal (1.5–3% of face value for 30–60 days).

## 7. Positioning against what exists

- Scheduling-first tools (Arlo, Administrate, accessplanit, Trainiq) manage courses and hand money to Stripe or an accounting system; none hold funds, pay instructors, finance corporate invoices or offer a buyer guarantee.
- Course platforms (Thinkific, Teachable, Kajabi) are built for self-paced content, weak on dated cohorts, corporate billing and certification rosters.
- Eventbrite and Corsizio sell tickets; no roster, no transfers, no corporate terms, no payouts logic.
- Gate for Training is the money operating system with the scheduler included, not the other way round.

## 8. Build order for the vertical (after the Phase 1 foundation)

| Sprint | Deliverable | Done when |
|---|---|---|
| 1 | Course, Cohort, Session, Seat entities; instructor party kind; regional price lists; JSON-LD endpoint | A Leading SAFe cohort with two sessions sells seats in CAD and GBP from one record |
| 2 | Embeddable schedule + checkout widget; learner confirmation with ICS; HubSpot sync | The widget runs on `/training/safe/sa/` in parallel with Eventbrite |
| 3 | Corporate accounts, quotes, invoices, PO, net terms, partial payments; Stripe Tax | A company books 5 seats on a PO and pays by bank transfer; receivables ageing report |
| 4 | Transfers, substitutes, cancellation policy engine, waitlist with auto-offer; learner portal | A learner self-transfers to the next cohort within policy |
| 5 | Zoom/Teams, email sequences, attendance, certificates, roster export for SAFe Studio | Day-before roster button; attendance and certificates issued without admin work |
| 6 | Delivery-linked release, instructor payouts on delivery, minimum-enrolment protection, deferred revenue report | Funds release on cohort end date; instructor paid automatically; accountant signs off the report |

Sources used for the competitor notes: [Trainiq listing on Capterra](https://www.capterra.com/p/10045803/Trainiq/) and the corporate purchase-order flow described by [CMU's training purchase order page](https://education.rec.ri.cmu.edu/Training/purchase-orders.html). Arlo, Administrate and accessplanit are characterised from general product knowledge and should be re-verified before any public comparison.
