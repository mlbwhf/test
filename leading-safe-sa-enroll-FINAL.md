# Leading SAFe — FINAL Enroll Section + Schema (FORM_ID = 3 · $850 USD)
_Paste-ready. Price filled ($850). Cohort dates are TBD → shown as "announced soon"; update labels/dates when scheduled._

## A) ENROLL SECTION — paste near the top of `/training/safe/sa/`
wp-admin → Pages → Leading SAFe (SA) → Edit → add a **Custom HTML** block near the top → paste:

```html
<div style="max-width:1080px;margin:0 auto 28px;background:linear-gradient(135deg,#053947,#0170B9);color:#fff;border-radius:16px;padding:34px 28px;display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between">
  <div style="flex:1;min-width:260px">
    <span style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#fbbf24">SAFe® Gold Partner · SPCT-led</span>
    <h2 style="margin:6px 0 6px;font-size:26px;font-weight:800;color:#fff">Reserve your Leading SAFe® seat</h2>
    <p style="margin:0;color:#cbd5e1;font-size:14px">Live-virtual · exam included · pass guarantee · secure checkout right here 🔒</p>
  </div>
  <div style="text-align:center;min-width:200px">
    <div style="font-size:13px;color:#cbd5e1">From</div>
    <div style="font-size:30px;font-weight:800;color:#fff;line-height:1">$850 USD</div>
    <div style="font-size:12px;color:#fbbf24;margin-bottom:12px">card · Apple/Google Pay · or financing</div>
    <a href="#register" style="display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:13px 28px;border-radius:8px;text-decoration:none">See dates &amp; enroll →</a>
  </div>
</div>
<style>.aa-coh td,.aa-coh th{padding:11px 14px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:14px}.aa-coh th{background:#053947;color:#fff;font-size:12px;text-transform:uppercase}.aa-coh a.aa-enr{display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:7px 15px;border-radius:6px;text-decoration:none;font-size:13px}</style>
<h3 id="register" style="margin:8px 0 12px;color:#053947">Upcoming Leading SAFe® cohorts</h3>
<div style="overflow-x:auto"><table class="aa-coh" style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0">
<thead><tr><th>Cohort</th><th>Dates</th><th>Format</th><th>Price (USD)</th><th></th></tr></thead>
<tbody>
<tr><td><strong>Cohort 1</strong></td><td>Dates announced soon</td><td>Live virtual</td><td>$850</td><td><a class="aa-enr" href="https://agile-agilist.com/training/safe/sa/?cohort=cohort-1#enroll-form">Register interest →</a></td></tr>
<tr><td><strong>Cohort 2</strong></td><td>Dates announced soon</td><td>Live virtual</td><td>$850</td><td><a class="aa-enr" href="https://agile-agilist.com/training/safe/sa/?cohort=cohort-2#enroll-form">Register interest →</a></td></tr>
<tr><td><strong>Cohort 3</strong></td><td>Dates announced soon</td><td>Live virtual</td><td>$850</td><td><a class="aa-enr" href="https://agile-agilist.com/training/safe/sa/?cohort=cohort-3#enroll-form">Register interest →</a></td></tr>
<tr><td>Private / in-house</td><td>On request</td><td>On-site or virtual</td><td>Contact us</td><td><a class="aa-enr" href="https://meetings.hubspot.com/john2795">Enquire →</a></td></tr>
</tbody></table></div>
<p style="font-size:12px;color:#64748b;margin:8px 0 0">Billed in USD; local-currency invoice available on request. Financing (Klarna/Affirm) shown at checkout where eligible.</p>
<div id="enroll-form" style="margin-top:24px">[fluentform id="3"]</div>
```

### Make the `?cohort=` links match the form (important)
In form #3's **Cohort dropdown**, set each option's **value** to `cohort-1`, `cohort-2`, `cohort-3` (stable), and the **label** to the human text ("Cohort 1 — TBD", later "Jun 20–21, 2026 · ET"). Because the *value* stays `cohort-1`, your Enroll links keep working even after you rename the label to a real date.

## B) SCHEMA — paste into AIOSEO → Schema → Custom (or WPCode)
Dates are TBD, so ship the **Course** now (valid). Add a **CourseInstance** per cohort **only once it has a real start date** (rich results require `startDate`).
```json
{ "@context":"https://schema.org","@type":"Course",
  "name":"Leading SAFe® (SAFe Agilist) Certification",
  "description":"SPCT-led Leading SAFe certification — live-virtual, exam included, pass guarantee.",
  "provider":{"@type":"Organization","name":"Agile Agilist","url":"https://agile-agilist.com"},
  "offers":{"@type":"Offer","price":"850","priceCurrency":"USD","category":"Paid","url":"https://agile-agilist.com/training/safe/sa/"}
}
```
**Add this block into `hasCourseInstance` once each date is set:**
```json
"hasCourseInstance":[
  {"@type":"CourseInstance","courseMode":"online","startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD",
   "location":{"@type":"VirtualLocation","url":"https://agile-agilist.com/training/safe/sa/"},
   "offers":{"@type":"Offer","price":"850","priceCurrency":"USD","availability":"https://schema.org/InStock"}}
]
```

## ⚠️ Strong recommendation: add real dates ASAP
"Dates announced soon" converts far worse than concrete dates, and the **CourseInstance schema (rich results) needs real `startDate`s**. The moment you set the 3 dates, rename the dropdown labels (keep values `cohort-1/2/3`), update the table's "Dates announced soon" cells, and add the `hasCourseInstance` block — and I can regenerate both fully filled.
