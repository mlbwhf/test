# Leading SAFe — Native Checkout: Implementation Runbook
_Who does what, in order. Eventbrite stays running in parallel._

## Ownership at a glance
| # | Task | Owner | Why |
|---|---|---|---|
| 1 | Connect **Stripe** in Fluent Forms; enable **BNPL + Apple/Google Pay + currencies** in Stripe dashboard | **You** | Payment account/config — not MCP-accessible |
| 2 | **Build the Fluent Forms registration form** (spec below) | **You** | Form builder is wp-admin; spec provided |
| 3 | **Zapier → HubSpot** automation (new registrant → contact/deal) | **You** | Zapier config |
| 4 | Add cohort **events in The Events Calendar** + capacity | **You** | wp-admin |
| 5 | Give me **FORM_ID + price + real dates** | **You** | unblocks my parts |
| 6 | **Finalize the enroll page / surfaced Enroll section** copy & layout | **Me (MCP)** | content |
| 7 | **Paste-safe Enroll section** for live `/training/safe/sa/` | **Me builds / You paste** | /sa/ too big to MCP-edit safely |
| 8 | **Course + CourseInstance schema** | **Me drafts / You paste** into AIOSEO Custom Schema or WPCode |
| 9 | **AIOSEO titles/metas** (the GSC quick-win pack) | **You** | AIOSEO not MCP-writable |
| 10 | **301s** (SPC dedup, AI-Native dup, safe-spc.com) | **You** (Redirection plugin) | redirects |
| 11 | Test a live payment (Stripe test mode → live), then publish | **You** | checkout test |
| 12 | Measure native vs Eventbrite 2–3 wks → roll out to other courses | **Both** | |

**Rule of thumb:** anything that's *content/copy/page structure* = I can do via MCP. Anything that's *payment, plugin config, AIOSEO, Zapier, redirects, or editing the 100K `/sa/` page* = you (I supply exact specs/snippets).

---

## DELIVERABLE 1 — Fluent Forms registration form spec (build this)
Create a form named **"Leading SAFe — Register"**. Fields:
| Field | Type | Notes |
|---|---|---|
| First name, Last name | Name | required |
| Email | Email | required |
| Company | Text | optional |
| Phone | Phone | optional |
| **Cohort** | Dropdown (radio ok) | options = your scheduled dates, e.g. `2026-06-20 · Live-Virtual ET`. **Set default value = dynamic from URL** param `cohort` (Fluent Forms → field → Advanced → "Dynamic default value" → `{get.cohort}`). This is the `?cohort=` pre-fill. |
| Quantity / # seats | Number | default 1 (group later) |
| **Payment (Stripe)** | Payment field | amount = course price (or map per-cohort via conditional pricing) |
| Consent / terms | Checkbox | required |

**Settings:**
- **Entry limit per cohort** (capacity) — Fluent Forms → Settings → Form Scheduling & Restrictions, or a per-cohort limit. Prevents overselling a seat count.
- **Confirmation:** success message + redirect to a thank-you; **email** to registrant + you.
- **Integrations:** Stripe (payment), **Zapier/HubSpot** (push registrant → CRM).
- Copy the form's shortcode → that's your **FORM_ID** for the page.

---

## DELIVERABLE 2 — Paste-safe Enroll section for `/training/safe/sa/`
Surfaces dates + on-site checkout on the canonical course page (the bounce + ranking fix). Paste **near the top** of `/sa/` (Code editor / Custom HTML). Replace `FORM_ID`, `$[PRICE]`, and the date rows. (Cohort rows can later be auto-generated from The Events Calendar.)

```html
<div style="max-width:1080px;margin:0 auto 28px;background:linear-gradient(135deg,#053947,#0170B9);color:#fff;border-radius:16px;padding:34px 28px;display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between">
  <div style="flex:1;min-width:260px">
    <span style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#fbbf24">SAFe® Gold Partner · Authorised SAFe Instructor (SPC/ASPC)</span>
    <h2 style="margin:6px 0 6px;font-size:26px;font-weight:800;color:#fff">Reserve your Leading SAFe® seat</h2>
    <p style="margin:0;color:#cbd5e1;font-size:14px">Live-virtual · exam included · pass guarantee · secure checkout right here 🔒</p>
  </div>
  <div style="text-align:center;min-width:200px">
    <div style="font-size:13px;color:#cbd5e1">From</div>
    <div style="font-size:30px;font-weight:800;color:#fff;line-height:1">$[PRICE]</div>
    <div style="font-size:12px;color:#fbbf24;margin-bottom:12px">or 4 interest-free payments</div>
    <a href="#register" style="display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:13px 28px;border-radius:8px;text-decoration:none">See dates &amp; enroll →</a>
  </div>
</div>
<style>.aa-coh td,.aa-coh th{padding:11px 14px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:14px}.aa-coh th{background:#053947;color:#fff;font-size:12px;text-transform:uppercase}.aa-coh a{display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:7px 15px;border-radius:6px;text-decoration:none;font-size:13px}</style>
<h3 id="register" style="margin:8px 0 12px;color:#053947">Upcoming cohorts</h3>
<div style="overflow-x:auto"><table class="aa-coh" style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0">
<thead><tr><th>Dates</th><th>Format</th><th>Timezone</th><th>Price</th><th></th></tr></thead>
<tbody>
<tr><td><strong>[Jun 20–21]</strong></td><td>Live virtual</td><td>ET</td><td>$[PRICE]</td><td><a href="#enroll-form">Enroll →</a></td></tr>
<tr><td><strong>[Jul 18–19]</strong></td><td>Live virtual</td><td>BST</td><td>£[PRICE]</td><td><a href="#enroll-form">Enroll →</a></td></tr>
<tr><td>Private / in-house</td><td>On-site or virtual</td><td>Your TZ</td><td>Contact</td><td><a href="https://meetings.hubspot.com/john2795">Enquire →</a></td></tr>
</tbody></table></div>
<div id="enroll-form" style="margin-top:24px">[fluentform id="FORM_ID"]</div>
```

---

## DELIVERABLE 3 — Course + CourseInstance schema (paste into AIOSEO → Schema → Custom, or WPCode)
One Course, many dated instances (the SEO-correct model). Update dates/price.
```json
{ "@context":"https://schema.org","@type":"Course",
  "name":"Leading SAFe® (SAFe Agilist) Certification",
  "description":"Leading SAFe certification taught by an Authorised SAFe Instructor (SPC/ASPC) — live-virtual, exam included.",
  "provider":{"@type":"Organization","name":"Agile Agilist","url":"https://agile-agilist.com"},
  "hasCourseInstance":[
    {"@type":"CourseInstance","courseMode":"online","startDate":"2026-06-20","endDate":"2026-06-21",
     "location":{"@type":"VirtualLocation","url":"https://agile-agilist.com/training/safe/sa/"},
     "offers":{"@type":"Offer","price":"[PRICE]","priceCurrency":"USD","availability":"https://schema.org/InStock"}},
    {"@type":"CourseInstance","courseMode":"online","startDate":"2026-07-18","endDate":"2026-07-19",
     "location":{"@type":"VirtualLocation","url":"https://agile-agilist.com/training/safe/sa/"},
     "offers":{"@type":"Offer","price":"[PRICE]","priceCurrency":"GBP","availability":"https://schema.org/InStock"}}
  ]}
```

---

## Order of operations
1. **You:** Stripe connect (1) → build form (2) → Zapier/HubSpot (3) → send me FORM_ID + price + dates (5).
2. **Me:** finalize enroll content (6) + deliver the /sa/ paste-safe section (7, above) + schema (8, above).
3. **You:** paste the /sa/ section + schema; add cohort events (4); test payment (11).
4. **Both:** go live on /sa/, keep Eventbrite parallel, measure 2–3 wks, then roll to SPC/AI-Native/POPM.
5. **Parallel (you, anytime):** AIOSEO titles/metas (9) + 301s (10) from the other packs.

---

## ADDENDUM — keep current course-page design + language handling

### How the course pages are actually built (inspected on /sa/ 24467)
Both the hero "recent cohorts" list AND the calendar are the **Easy Events Calendar** plugin, pulling native event posts by category:
- Hero list: `[wp_events category="sa" events_list layout="style4" col="1" posts_per_page="5"]`
- Calendar: `[easy_events_calendar category="sa"]`
**Eventbrite is only the per-event Register link — not the data source.** Dates already come from your own event posts.

### Go native WITHOUT changing the design
1. Keep both shortcodes. (Change `posts_per_page="5"`→`"4"` for 4 in the hero.)
2. Per cohort event, **repoint "Register"** from the Eventbrite URL → native checkout target:
   - WooCommerce product/variation (**stock = seat capacity**), or Event Tickets ticket, or registration page `?cohort=`.
3. New cohort = create the Easy Events Calendar event (category, date) + its native checkout target; hero + calendar auto-update.
- **Display layer = Easy Events Calendar (unchanged). Checkout + capacity layer = WooCommerce product/Event Tickets + Stripe.**

### Languages — ONE product per cohort (do NOT split by language)
- **Website language** (page translated, same class) = **same product** — translate display only. Separate products per language would **split seat capacity** and reporting. Don't.
- **Delivery language** (class actually taught in another language, own date) = **different cohort = its own event/product.**
- **Currency** = multi-currency at checkout, not duplicate products.
- To translate product display across language pages cleanly: WPML/Polylang + WooCommerce multilingual add-on (same product, translated content, **shared stock**), or link all language pages to the one product.

---

## ADDENDUM 2 — "same design + all native payment + auto-updating": how

### Competitor class-page structure (researched)
Competitors use **ONE combined page per course** — information + schedule + enroll CTA all on the **same** page. They do **NOT** keep a separate "information" page and a separate "registration" page for the same course (that's duplicate content / cannibalization). Registration is a **CTA + checkout step** on the course page, not a second indexable page. **Your current single course page IS the correct model — keep it; don't split.** (The pilot enroll page must therefore be either merged into the course page or kept noindex as a transactional step — never a competing indexed page.)

### The blocker to "one record, fully automatic"
Your display plugin **Easy Events Calendar (Xylus)** only *displays* events — it does **not** sell paid tickets or manage seat capacity. So with it you can't have ONE record per cohort that both shows AND sells; you'd keep two records (display event + a separate product/ticket) = semi-manual.

### Recommended path to get all three (same look + all native + auto)
**Migrate cohort events from Easy Events Calendar → The Events Calendar + Event Tickets (which you ALREADY have installed).** Then:
- **One record per cohort** (the event) = appears in hero + calendar AND is purchasable with **price + seat capacity** via WooCommerce/WooPayments (Stripe) on-site.
- **Add an event once → everything updates automatically** (hero "recent 4", calendar, availability, sold-out).
- **Re-skin** the hero "recent 4" list + calendar with The Events Calendar shortcodes/blocks to **match your current look** (a styling task — I can produce the markup).
- **Bonus: consolidates plugin bloat** — drop the Xylus event plugins + redundant Eventbrite plugins; one events engine.
- Keep **Eventbrite parallel** during the cutover.

**Trade-off:** a re-skin of the two display blocks + migrating existing events. End result looks identical, works better, fully automatic. Need **Event Tickets Plus (~$99/yr)** for WooCommerce-paid tickets.

**If you'd rather not migrate now:** keep Easy Events Calendar for display and point each event's Register at a native product/ticket (two records, semi-manual). Same design, but not single-record-automatic.

---

## ADDENDUM 3 — Leading SAFe migration: YOUR SIDE vs MY SIDE

### 🟦 YOUR SIDE (wp-admin / payments — I can't reach these)
1. **Install + activate Event Tickets Plus** (~$99/yr). (The Events Calendar + Event Tickets free already active.)
2. **Payments:** WooCommerce → **WooPayments** (already active = Stripe) → enable **BNPL (Klarna/Affirm) + Apple/Google Pay + multi-currency**.
3. **Event Tickets → Settings → Commerce → set WooCommerce** as the ticket provider.
4. **Create the Leading SAFe cohorts as events** in The Events Calendar (date, time, **timezone**, online/in-person). Put them in a **category/tag** for Leading SAFe — **tell me that slug** (e.g. `leading-safe`).
5. On **each event → add a Ticket** (Event Tickets): **price + capacity (= seats)**. Capacity auto-sells-out.
6. **Test a ticket purchase** (Stripe test mode → live).
7. **Send me:** the category slug + price + (optionally) the dates → unblocks my markup.
8. *(Optional)* migrate the existing Easy Events Calendar "sa" events into The Events Calendar so there's one system.
9. After my snippets: **paste them** into `/sa/` (Code editor) + add the schema (AIOSEO/WPCode). Then **publish**.

### 🟩 MY SIDE (content/markup via MCP — paste-safe, I won't edit the 100K page directly)
1. **Surfaced Enroll band** for the top of `/sa/` (price, financing, trust, "See dates & enroll").
2. **Re-skinned cohorts list + calendar** using The Events Calendar blocks/shortcodes (auto-updating), styled to match your current look — delivered as **paste-safe snippets** that replace the old `[wp_events …]` and `[easy_events_calendar …]` blocks.
3. **Course + CourseInstance schema** (one course, many dated instances).
4. Each cohort's Enroll → its ticket/checkout.

### Honest note
The **backend (events + tickets + payments + capacity) is yours** — that's what makes it native, automatic, and capacity-aware. **I do the page markup.** A pixel-perfect match of the current list style may need a small page-builder tweak on your side; the function (auto-pull, native checkout, capacity) will be solid.

### Fastest alternative (if you don't want a re-skin yet)
Keep your **existing display blocks** unchanged and only **repoint each event's Register link** to the native ticket/checkout. Zero re-skin, registration goes native immediately; downside = two records per cohort (display + ticket) instead of one. Good for a quick pilot; full migration later.

---

## ✅ CONFIRMED DECISION (2026-06-14) — supersedes Addendums 2 & 3
**Payment path = DIRECT STRIPE via Fluent Forms. NO WooCommerce, NO Event Tickets, no new plugins.**
(Addendums 2–3 proposing Event Tickets/The Events Calendar migration are a DEFERRED alternative — only revisit if strict *automatic* per-cohort sold-out becomes essential.)

What this means for the Leading SAFe page update:
- **Display stays exactly as-is** — keep the Easy Events Calendar hero list + calendar. **No re-skin needed.**
- **Each "sa" event's Register link → the Fluent Forms form** on the course page, pre-selecting the cohort:
  `https://agile-agilist.com/training/safe/sa/?cohort=<DATE>#register`
- **Form** = "Leading SAFe — Register" (Deliverable 1): cohort dropdown with `{get.cohort}` prefill + Stripe payment + attendee fields → Zapier → HubSpot.
- **Capacity (honest):** managed *within Fluent Forms* — set an entry limit, and close/remove a cohort option when it fills. This is the one thing Event Tickets would do more automatically; we accept manual capacity in exchange for staying lean (the trade we already chose).

### Your side
1. Connect **Stripe** in Fluent Forms; enable BNPL + wallets + currencies in Stripe.
2. Build the **"Leading SAFe — Register"** form (Deliverable 1).
3. **Zapier → HubSpot**.
4. In each Easy Events Calendar "sa" event, set the **Register URL** → `/training/safe/sa/?cohort=<DATE>#register`.
5. Set the form **entry limit** (capacity); close a cohort option when full.
6. Send me **FORM_ID + price**.

### My side
1. **Surfaced Enroll band + a "#register" form section** (`[fluentform id="FORM_ID"]`) → paste-safe snippet for `/sa/`.
2. **Course + CourseInstance schema.**
(No re-skin — display unchanged.)

---

## ADDENDUM 4 — Registrant ≠ Attendee (registering on behalf of others)
Add to the form:
1. **Registrant block** (buyer): Name, Email, Company, Phone — always shown.
2. **Radio "Who is attending this course?"** → "I'm attending myself" / "I'm registering someone else / my team".
3. **Attendee block — Conditional Logic: show when radio = "someone else / my team":**
   - Single: Attendee First/Last Name + Attendee Email.
   - Group: a **Repeater field** (Name + Email per row), one per seat.
4. **If "myself"** → attendee = registrant (no extra fields).
5. **Payment = Seats × price** (tie Quantity to the payment Item Quantity).

Implications:
- **Ticket email** → send to the ATTENDEE (`{inputs.attendee_email}`) too, not only the buyer (add a 2nd conditional notification). Group/repeater: send the registrant a summary listing all attendees first; per-attendee emails = advanced.
- **SAFe Studio roster + HubSpot** → upload the **attendee** to the roster; registrant = the HubSpot contact/deal, attendees in deal notes (or as extra contacts).
- **Also add:** "How did you hear about us?" (Search engine / LLM / Referral / Scaled Agile / Other+specify) → map to a HubSpot property for attribution (the LLM option tracks GEO/AI-search referrals).

Pilot recommendation: ship with the **toggle + single conditional attendee** (covers "manager registers one person"); add the repeater or route big groups via the **group-quote** path as a fast follow.

---

## ADDENDUM 5 — Stop hand-editing the cohort dropdown (auto-populate from the calendar)
**Problem:** 6+ months of cohorts → don't maintain dates twice (calendar + form dropdown).
**Single source of truth = Easy Events Calendar events** (category `sa`) — already drives the hero + calendar.
**Fix:** make the form's Cohort field **auto-populate from those events** so adding a class once = it appears in hero, calendar, AND the form.

Options (Fluent Forms Pro):
- **A (recommended): Post / CPT Selection (Dynamic Field)** → Post Type = the events CPT, filter category `sa`, upcoming, order by event start-date meta. `{get.cohort}` still pre-selects from `?cohort=`. Auto-updates; works for direct visitors. Ref: fluentforms.com/docs/post-selection-module-in-fluent-forms/
- **B (leanest): hidden Cohort field** = `{get.cohort}` from each event's Register link; no dropdown. Pair with the auto cohort list above the form for direct visitors.
- Custom code alt: filter `fluentform/rendering_field_data_select` to populate from a wp_query.

Competitor validation: KnowledgeHut/Simplilearn run a central schedule that auto-feeds display + registration — same single-source pattern.

TODO: identify the Easy Events Calendar CPT slug + the order-by-event-date query for the Post Selection field.
