# Enroll Section — Reusable Paste Block (uses test form id 3)
_Paste via the page **Code editor** (⋮ → Code editor), NOT a Custom HTML block — the `[fluentform]` is a shortcode and needs the `wp:shortcode` wrapper to render._

## How to use
1. Open the course page → **Edit** → top-right **⋮ → Code editor**.
2. Paste the block below where you want the enroll experience (top of page, or its own section).
3. Switch back to Visual editor → **Preview** (don't Update until happy).
4. Change per course: `[COURSE NAME]`, the **price** ($850), and the **cohort rows / values**.
5. **Form:** this uses `[fluentform id="3"]` (your test form). For production, duplicate the form per course and swap the id.

> If the page **already has a cohort list** (e.g. `/sa/` with `[wp_events]`), delete the "Upcoming cohorts" table part to avoid duplication — keep the band + the `#enroll-form` + shortcode.

---

```html
<!-- wp:html -->
<div style="max-width:1080px;margin:0 auto;background:linear-gradient(135deg,#053947 0%,#0170B9 100%);color:#fff;border-radius:16px;padding:36px 30px">
<div style="display:flex;flex-wrap:wrap;gap:24px;align-items:center;justify-content:space-between">
<div style="flex:1;min-width:280px">
<span style="display:inline-block;font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#fbbf24;margin-bottom:10px">SAFe® Gold Partner · SPCT-led</span>
<h2 style="margin:0 0 8px;font-size:28px;font-weight:800;color:#fff;line-height:1.15">Leading SAFe® (SAFe Agilist) Certification</h2>
<p style="margin:0 0 12px;color:#cbd5e1;font-size:15px;line-height:1.55">Live-virtual · exam included · pass guarantee. Secure checkout right here — card, Apple/Google Pay or financing.</p>
<div style="font-size:13px;color:#e2e8f0">★★★★★ <strong>4.9/5</strong> · Exam included · Money-back pass guarantee 🔒</div>
</div>
<div style="text-align:center;min-width:200px">
<div style="font-size:13px;color:#cbd5e1">From</div>
<div style="font-size:34px;font-weight:800;color:#fff;line-height:1">$850 USD</div>
<div style="font-size:12px;color:#fbbf24;margin-bottom:14px">or interest-free financing</div>
<a href="#cohorts" style="display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:14px 30px;border-radius:8px;text-decoration:none;font-size:16px">See dates &amp; enroll →</a>
</div>
</div>
</div>
<!-- /wp:html -->

<!-- wp:heading {"anchor":"cohorts","level":2,"style":{"spacing":{"margin":{"top":"44px"}}}} -->
<h2 class="wp-block-heading" id="cohorts" style="margin-top:44px">Upcoming cohorts</h2>
<!-- /wp:heading -->

<!-- wp:html -->
<style>.aa-coh td,.aa-coh th{padding:11px 14px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:14px}.aa-coh th{background:#053947;color:#fff;font-size:12px;text-transform:uppercase}.aa-coh a{display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:7px 15px;border-radius:6px;text-decoration:none;font-size:13px}</style>
<div style="overflow-x:auto"><table class="aa-coh" style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0">
<thead><tr><th>Cohort</th><th>Dates</th><th>Format</th><th>Price (USD)</th><th></th></tr></thead>
<tbody>
<tr><td><strong>Cohort 1</strong></td><td>Dates announced soon</td><td>Live virtual</td><td>$850</td><td><a href="?cohort=cohort-1#enroll-form">Select &amp; enroll →</a></td></tr>
<tr><td><strong>Cohort 2</strong></td><td>Dates announced soon</td><td>Live virtual</td><td>$850</td><td><a href="?cohort=cohort-2#enroll-form">Select &amp; enroll →</a></td></tr>
<tr><td><strong>Cohort 3</strong></td><td>Dates announced soon</td><td>Live virtual</td><td>$850</td><td><a href="?cohort=cohort-3#enroll-form">Select &amp; enroll →</a></td></tr>
<tr><td>Private / in-house</td><td>On request</td><td>On-site or virtual</td><td>Contact us</td><td><a href="https://meetings.hubspot.com/john2795">Enquire →</a></td></tr>
</tbody></table></div>
<!-- /wp:html -->

<!-- wp:html -->
<div id="enroll-form" style="max-width:1080px;margin:40px auto 8px">
<div id="aa-selected-cohort" style="display:none;margin:0 0 14px;padding:12px 18px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;color:#92400e;font-size:14px;font-weight:700">✅ You're enrolling in: <strong id="aa-cohort-name"></strong> — just enter your details below.</div>
<h2 style="color:#053947;margin:0 0 6px">Register &amp; pay — securely, right here</h2>
<p style="color:#475569;font-size:14px;margin:0 0 16px">Pay by card · Apple/Google Pay · or interest-free financing. Instant confirmation + ticket; SAFe Studio access before class. Billed in USD; local-currency invoice on request.</p>
</div>
<script>(function(){var p=new URLSearchParams(location.search).get('cohort');if(!p)return;var map={'cohort-1':'Cohort 1','cohort-2':'Cohort 2','cohort-3':'Cohort 3'};var box=document.getElementById('aa-selected-cohort');var nm=document.getElementById('aa-cohort-name');if(box&&nm){nm.textContent=map[p]||p;box.style.display='block';}})();</script>
<!-- /wp:html -->

<!-- wp:shortcode -->
[fluentform id="3"]
<!-- /wp:shortcode -->

<!-- wp:html -->
<div style="margin:30px auto 0;max-width:1080px;padding:20px 24px;border-radius:14px;background:#f1f5f9;border:1px solid #e2e8f0">
<p style="margin:0;color:#334155;font-size:14px">Everything completes on agile-agilist.com — no redirect. Enrolling a team? <a href="https://meetings.hubspot.com/john2795">Request a group quote</a>.</p>
</div>
<!-- /wp:html -->
```

## Per-course swap checklist
- Course **name** (H2 in the band)
- **Price** (band + cohort rows + the form's payment item)
- **Cohort rows** + their `?cohort=` values, and the `map` in the `<script>` (so the "You're enrolling in" label matches)
- **Form id** — `id="3"` is the shared test form; for production duplicate the form per course and change the id
- For pages that already list cohorts, drop the "Upcoming cohorts" table block

## Reminder (form side, not page side)
For the cohort to actually pre-select, set the form's **Cohort Date** field → Advanced → **Default Value = `{get.cohort}`** (option values are already `cohort-1/2/3`).
