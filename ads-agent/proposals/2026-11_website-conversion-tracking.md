# End-to-end conversion tracking on the website checkout (proposal)

**Goal:** count *paid* registrations from the on-site (Stripe) checkout in Google Ads and
Microsoft Ads, so the platforms finally measure sales instead of Eventbrite outbound clicks.
This closes the measurement gap behind the May 2026 collapse.

Per your rules, I changed **nothing** on WordPress. Section 2 is a proposal for you and your web
team. Section 3 is what you click in the ad platforms.

## 1. What I found (read-only checks, 2026-11-19)
| Finding | Why it matters |
|---|---|
| Payments run through **Stripe** via your custom register flow, then a redirect to `/registration-confirmed/`. WooCommerce is inactive. | Good: you control the whole path end-to-end. |
| **GTM4WP has container `GTM-K9627QZB` configured, but its output is OFF** ("placement: off"). The container in your handover, **`GTM-KNLG4JL5`**, isn't injected by any active snippet I could see. | It's unclear which container, if any, loads today. This may explain why Google reported only 0.8 "conversions" last week. **Verify first** (step 2.1). |
| The confirmation page reads **`?name=…&course=…&cohort=…` from the URL**. | Any Google or Microsoft tag firing there sends the **buyer's name** in the page URL. That breaks both platforms' no-personal-data policies, and anyone can open the URL without paying. |
| Active snippet **"AA — Checkout telemetry"** (updated 9 Nov). I couldn't read its code. | It may already emit checkout events. Check it before adding tags, so purchases aren't counted twice. |

## 2. Proposed site changes (for your web team)
**2.1 Load exactly one GTM container site-wide.** Choose `GTM-K9627QZB` or `GTM-KNLG4JL5` and
retire the other. Confirm with Google Tag Assistant on the homepage and on `/registration-confirmed/`.

**2.2 Stop putting personal data in the URL.** Set Stripe's `success_url` to
`/registration-confirmed/?session_id={CHECKOUT_SESSION_ID}` (or the equivalent payment ID for
your integration). Have `[aa_reg_confirmation]` look up the payment server-side, check it is
**paid**, and render the name, course and dates from Stripe, not from the URL.

**2.3 Push one purchase event, only for a verified paid payment, once:**
```js
dataLayer.push({ ecommerce: null });
dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: 'cs_…',          // Stripe session/payment id: de-duplicates reloads
    value: 1865.75,                  // amount actually paid (after the Black Friday 15%)
    currency: 'USD',
    items: [{ item_name: 'AI-Native Value Architect', item_category: 'AI_NATIVE' }]
  }
});
```
Server-side, mark the payment "tracked" (or use a sessionStorage flag) so a refresh doesn't
fire it again.

**2.4 Capture click IDs for a later server-side upgrade.** On landing, store `gclid` / `wbraid` /
`msclkid` in a first-party cookie and pass them into the Stripe payment's **metadata**. That makes
offline / server-side conversion imports possible later, which survive ad blockers and consent
denials. Not needed for Black Friday.

**2.5 Keep the Microsoft Ads tracking suffixes exactly as they are** (your rule).

## 3. Ad-platform setup (you, in the UIs)
**Google Ads** → Goals → Conversions → New → Website → *Add manually*:
- Name **Website Purchase - Paid Registration**, category **Purchase**
- Value: *use different values* (from the data layer); Count: **One**; click-through window 30 days
- GTM tags: **Conversion Linker** (all pages) + **Google Ads Conversion Tracking** fired on custom
  event `purchase`, with value, currency and transaction ID from the data layer variables
- Optional, recommended: **Enhanced conversions** (hashed email), only where consent allows

**Microsoft Ads** (UET tag 343248805) → Conversion goals → New → **Event**:
- Action = `purchase`, revenue = dynamic, count = **Unique**
- GTM: UET event tag on `purchase`, sending `revenue_value` and `currency`

## 4. Sequencing: don't switch what bidding optimizes for mid-promotion
Your campaigns run **Maximize Conversions** (already flagged by the tripwires: smart bidding
without ≥15 verified registrations). Changing the primary conversion goal restarts the bidding
algorithm's learning period, and doing that **during Black Friday** would be the documented
mistake: a change made for a metric, mid-peak.
1. **Now → 30 Nov:** add the new goal as **SECONDARY** (observe only). You collect real purchase
   data through Black Friday, and bidding is undisturbed.
2. **From 1 Dec:** make it **PRIMARY**, and demote *Eventbrite Click - Register* to secondary.
3. Smart bidding stays **blocked** by your constitution until a campaign has **≥15 verified
   registrations in 30 days**. With this tracking in place, that becomes measurable for the
   first time, which is the real path to Phase 2.

## 5. Verify before you trust it
1. A Stripe **test-mode** purchase → GTM Preview shows exactly one `purchase` event with the right value.
2. Google Tag Assistant + Microsoft UET Tag Helper on `/registration-confirmed/` → tags fire, and
   **no name or email appears in the page URL**.
3. Reload the confirmation page → **no second** conversion.
4. After the first live sale: the daily agent's Stripe count (ground truth) matches the
   platforms' "Website Purchase" count. If they drift apart, the tag is broken, not the sales.
