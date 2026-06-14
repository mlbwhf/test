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
    <span style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#fbbf24">SAFe® Gold Partner · SPCT-led</span>
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
  "description":"SPCT-led Leading SAFe certification — live-virtual, exam included.",
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
