# Web team brief: website purchase tracking (agile-agilist.com), 27 Nov 2026

**From:** Mark Saymen (owner), prepared with the ads agent.
**Goal:** Google Ads and Microsoft Ads must count **only paid registrations made through the
agile-agilist.com checkout (Stripe)**. Eventbrite and Corsizio sales are never ad conversions.
**Already done on the ads side:**
- The conversion actions exist in Google Ads and Microsoft Ads.
- The tags are built in GTM-KNLG4JL5 (workspace `website-purchase`, unpublished).
- **They wait for one thing from you: a `purchase` event on the website.**

## 1. What to build
### 1.1 Mark every website payment in Stripe
Wherever the site creates a Stripe Checkout Session or Payment Link, set:
- `metadata.origin = "agile-agilist.com"` (required: this is how website payments are told apart);
- `metadata.course` = the course name; `metadata.seats` if more than 1.
- **Success / after-payment URL:**
  `https://agile-agilist.com/registration-confirmed/?session_id={CHECKOUT_SESSION_ID}`

### 1.2 No personal data in URLs
Stop putting `?name=…&course=…` in the confirmation URL. `[aa_reg_confirmation]` looks the session up
**server-side** from `session_id` and renders the name and course from Stripe.

### 1.3 Push ONE purchase event, server-verified
On `/registration-confirmed/`, retrieve the Checkout Session from Stripe and require **all** of:
- `payment_status = paid`;
- `metadata.origin = agile-agilist.com`;
- the session isn't already marked as tracked.

Only then print this before the GTM container, and mark the session tracked:
```js
window.dataLayer = window.dataLayer || [];
dataLayer.push({ ecommerce: null });
dataLayer.push({
  event: 'purchase',
  ecommerce: {
    transaction_id: 'cs_…',        // the Stripe Checkout Session id
    value: 999.00,                 // amount actually paid (after any discount)
    currency: 'USD',               // or 'CAD': the charge currency
    items: [{ item_name: 'Launching AI-Native ARTs', item_category: 'AI_NATIVE', quantity: 1 }]
  }
});
```
**No event** on reloads, direct visits without a valid session, or Eventbrite/Corsizio buyers sent to
the page.

### 1.4 Cover every payment path (one event serves all courses)
Apply 1.1 to **every** place on the site that takes payment. The ones we've seen:
- course-page registration ("Pick a date" → "Register with Agile Agilist", snippet "AA – Register PHP");
- the class picker `/training/select/` (`[aa_class_flow]`);
- the Leading SAFe native checkout `/training/safe/sa/enroll-leading-safe-pilot/`;
- any course configured with a Stripe `payment_link`. Set its "After payment → Redirect" to the URL in 1.1.
- card-payment links or invoices sent to teams, if any.

Please send back the complete list you find.

### 1.5 Tag Manager: one container only
- **GTM-KNLG4JL5** is the container in use (GA4 + Google Ads + Microsoft UET). Please confirm how it's
  loaded today (theme, plugin or snippet).
- **Keep the GTM4WP plugin output OFF.** It's set to GTM-K9627QZB; switching it on would load a second
  container and double-count.
- **Don't publish anything in GTM.** The ads side publishes the `website-purchase` workspace after the
  test in section 2 passes.

### 1.6 GA4 setting
GA4 (G-9PD6PWS906) → Admin → Data streams → Configure tag settings → **List unwanted referrals** →
add `stripe.com`.

## 2. How we'll test it (definition of done)
For **each** payment path in 1.4, in **Stripe test mode** (card 4242 4242 4242 4242):
1. Start from the course page with **Tag Assistant** connected to GTM-KNLG4JL5 in Preview.
2. Losing the tag on Stripe's page is expected. Complete the payment.
3. Back on `/registration-confirmed/?session_id=…`:
   - **exactly one** `purchase` event, with the right value, currency and transaction_id;
   - the tags "Google Ads - Website Purchase - Paid Registration" and "Microsoft Ads - UET - Website
     Purchase" fire **once**.
4. **Reload** the page: **no** purchase event.
5. No name or email in any URL.
6. In Stripe, the test payment shows `metadata.origin = agile-agilist.com`.

Send the owner a screenshot per path. He then gives the go for the cut-over.

## 3. Also urgent (same snippet, separate from tracking)
**Launching AI-Native ARTs shows almost no bookable dates.** In "AA – Register PHP", the
`'launching-ai-native-arts'` cadence is still the 3 Nov pattern. Change it to the owner's schedule:
every Monday and Thursday, plus a weekend class twice a month.
```php
'cadence'  => array(
	array( 'dow' => 'Mon', 'slot' => 'morning' ),
	array( 'dow' => 'Thu', 'slot' => 'morning' ),
	array( 'dow' => 'Sat', 'slot' => 'morning', 'week' => 2 ),
	array( 'dow' => 'Sat', 'slot' => 'morning', 'week' => 4 ),
),
```
Then confirm the course page lists those dates for several weeks ahead.

The full list of other page fixes (refund wording, "Gold" → "Platinum", and more) is in
`proposals/2026-11_site-fixes.md` on the same branch.
