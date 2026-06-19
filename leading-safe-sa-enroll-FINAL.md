# Leading SAFe — INTEGRATED Enroll blocks for the EXISTING /sa/ page
_FORM_ID = 3 · $850 USD. Your existing page keeps ALL its content. You add only TWO blocks and repoint the event "Register" links. No duplicate date table — your existing `[wp_events]` list IS the date list._

## Where each block goes (final page order)
1. [EXISTING] Hero
2. **[ADD] Block A — Enroll band** (just under the hero)
3. [EXISTING] `[wp_events category="sa" …]` cohort list  → each event's Register URL = `…/sa/?cohort=<value>#enroll-form`
4. [EXISTING] value props / journeys / role cards
5. **[ADD] Block B — Register & pay (the form)** = the `#enroll-form` target
6. [EXISTING] `[easy_events_calendar category="sa"]` calendar
7. [EXISTING] FAQ / footer

---

## BLOCK A — Enroll band (Custom HTML block, just under the hero)
```html
<div style="max-width:1080px;margin:18px auto;background:linear-gradient(135deg,#053947,#0170B9);color:#fff;border-radius:16px;padding:28px 28px;display:flex;flex-wrap:wrap;gap:20px;align-items:center;justify-content:space-between">
  <div style="flex:1;min-width:260px">
    <span style="font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;color:#fbbf24">SAFe® Gold Partner · Authorised SAFe Instructor (SPC/ASPC)</span>
    <h2 style="margin:6px 0 6px;font-size:24px;font-weight:800;color:#fff">Reserve your Leading SAFe® seat — secure checkout on-site</h2>
    <p style="margin:0;color:#cbd5e1;font-size:14px">Live-virtual · exam included · pass guarantee · card, Apple/Google Pay or financing 🔒</p>
  </div>
  <div style="text-align:center;min-width:190px">
    <div style="font-size:13px;color:#cbd5e1">From</div>
    <div style="font-size:30px;font-weight:800;color:#fff;line-height:1">$850 USD</div>
    <a href="#enroll-form" style="display:inline-block;margin-top:10px;background:#fbbf24;color:#053947;font-weight:800;padding:12px 26px;border-radius:8px;text-decoration:none">Enroll now →</a>
  </div>
</div>
```

## BLOCK B — Register & pay section (Custom HTML block, after the cohort list / value props)
```html
<div id="enroll-form" style="max-width:1080px;margin:36px auto 8px">
<h2 style="color:#053947;margin:0 0 6px">Register &amp; pay — securely, right here</h2>
<p style="color:#475569;font-size:14px;margin:0 0 18px">Pick your cohort, pay by card · Apple/Google Pay · or interest-free financing. Instant confirmation + ticket; SAFe Studio access before class. Billed in USD; local-currency invoice on request.</p>
<div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:18px">
  <div style="flex:1;min-width:190px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:13px 15px"><strong style="color:#053947">1. Choose cohort</strong><br><span style="color:#475569;font-size:13px">Pre-filled if you came from a date above.</span></div>
  <div style="flex:1;min-width:190px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:13px 15px"><strong style="color:#053947">2. Pay (Stripe)</strong><br><span style="color:#475569;font-size:13px">Card · wallets · financing.</span></div>
  <div style="flex:1;min-width:190px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:13px 15px"><strong style="color:#053947">3. Confirmed</strong><br><span style="color:#475569;font-size:13px">Ticket emailed instantly.</span></div>
</div>
</div>
[fluentform id="3"]
```

## Repoint the existing event "Register" links
In each Easy Events Calendar **"sa" event**, set its Register URL to:
`https://agile-agilist.com/training/safe/sa/?cohort=<event-value>#enroll-form`
→ clicking "Register" in your existing cohort list jumps to Block B with the cohort pre-selected.

## Schema (unchanged from before)
Course schema now; add `hasCourseInstance` per cohort when dates are set (see prior file).

---

## How to SEE the integrated page (60 sec, zero risk)
The live `/sa/` page is ~104K chars — too large for me to safely duplicate via the API (that's the operation that broke once), so the genuine integrated render is best seen by you:
1. wp-admin → Pages → **Leading SAFe (SA) → Edit**.
2. Add **Block A** under the hero and **Block B** lower down (Custom HTML blocks).
3. Click **Preview → Preview in new tab** (do NOT click Update) → you see the **full integrated page** with all existing content + the new blocks.
4. Happy → **Update**. Not happy → leave without saving; nothing changed.
