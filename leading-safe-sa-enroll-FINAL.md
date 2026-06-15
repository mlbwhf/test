# Leading SAFe — FINAL Enroll Section + Schema (FORM_ID = 3, USD)
_Paste-ready. FORM_ID is wired (`[fluentform id="3"]`). Fill in the **USD price** and the **cohort dates** where marked._

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
    <div style="font-size:30px;font-weight:800;color:#fff;line-height:1">$[PRICE] USD</div>
    <div style="font-size:12px;color:#fbbf24;margin-bottom:12px">card · Apple/Google Pay · or financing</div>
    <a href="#register" style="display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:13px 28px;border-radius:8px;text-decoration:none">See dates &amp; enroll →</a>
  </div>
</div>
<style>.aa-coh td,.aa-coh th{padding:11px 14px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:14px}.aa-coh th{background:#053947;color:#fff;font-size:12px;text-transform:uppercase}.aa-coh a.aa-enr{display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:7px 15px;border-radius:6px;text-decoration:none;font-size:13px}</style>
<h3 id="register" style="margin:8px 0 12px;color:#053947">Upcoming Leading SAFe® cohorts</h3>
<div style="overflow-x:auto"><table class="aa-coh" style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0">
<thead><tr><th>Dates</th><th>Format</th><th>Timezone</th><th>Price (USD)</th><th></th></tr></thead>
<tbody>
<tr><td><strong>[DATE 1 — e.g. Jun 20–21, 2026]</strong></td><td>Live virtual</td><td>ET</td><td>$[PRICE]</td><td><a class="aa-enr" href="https://agile-agilist.com/training/safe/sa/?cohort=[YYYY-MM-DD-1]#enroll-form">Enroll →</a></td></tr>
<tr><td><strong>[DATE 2]</strong></td><td>Live virtual</td><td>BST (UK)</td><td>$[PRICE]</td><td><a class="aa-enr" href="https://agile-agilist.com/training/safe/sa/?cohort=[YYYY-MM-DD-2]#enroll-form">Enroll →</a></td></tr>
<tr><td><strong>[DATE 3]</strong></td><td>Live virtual</td><td>GST (Gulf)</td><td>$[PRICE]</td><td><a class="aa-enr" href="https://agile-agilist.com/training/safe/sa/?cohort=[YYYY-MM-DD-3]#enroll-form">Enroll →</a></td></tr>
<tr><td>Private / in-house</td><td>On-site or virtual</td><td>Your timezone</td><td>Contact us</td><td><a class="aa-enr" href="https://meetings.hubspot.com/john2795">Enquire →</a></td></tr>
</tbody></table></div>
<p style="font-size:12px;color:#64748b;margin:8px 0 0">Billed in USD; local-currency invoice available on request. Financing (Klarna/Affirm) shown at checkout where eligible.</p>
<div id="enroll-form" style="margin-top:24px">[fluentform id="3"]</div>
```

### IMPORTANT — make the `?cohort=` links match the form
The `cohort=` value in each Enroll link **must exactly equal the matching option *value*** in your form's **Cohort dropdown** (form #3), so the form pre-selects it.
- In Fluent Forms, give each cohort option a clean **value** like `2026-06-20` (label can be pretty: "Jun 20–21, 2026 · Live-Virtual ET").
- Then the link `…?cohort=2026-06-20#enroll-form` pre-selects that option (via the `{get.cohort}` dynamic default).

## B) SCHEMA — paste into AIOSEO → Schema → Custom (or a WPCode header snippet)
USD; one Course → one CourseInstance per date. Fill price + dates.
```json
{ "@context":"https://schema.org","@type":"Course",
  "name":"Leading SAFe® (SAFe Agilist) Certification",
  "description":"SPCT-led Leading SAFe certification — live-virtual, exam included, pass guarantee.",
  "provider":{"@type":"Organization","name":"Agile Agilist","url":"https://agile-agilist.com"},
  "hasCourseInstance":[
    {"@type":"CourseInstance","courseMode":"online","startDate":"[YYYY-MM-DD-1]","endDate":"[YYYY-MM-DD-1-end]",
     "location":{"@type":"VirtualLocation","url":"https://agile-agilist.com/training/safe/sa/"},
     "offers":{"@type":"Offer","price":"[PRICE]","priceCurrency":"USD","availability":"https://schema.org/InStock","url":"https://agile-agilist.com/training/safe/sa/"}},
    {"@type":"CourseInstance","courseMode":"online","startDate":"[YYYY-MM-DD-2]","endDate":"[YYYY-MM-DD-2-end]",
     "location":{"@type":"VirtualLocation","url":"https://agile-agilist.com/training/safe/sa/"},
     "offers":{"@type":"Offer","price":"[PRICE]","priceCurrency":"USD","availability":"https://schema.org/InStock","url":"https://agile-agilist.com/training/safe/sa/"}}
  ]}
```

## What I still need from you to make it zero-placeholder
- **USD price** (e.g. `795`)
- **Cohort dates** (each date + the dropdown `value` you used, e.g. `2026-06-20`)
Send those and I'll return the section + schema fully filled (no placeholders).
