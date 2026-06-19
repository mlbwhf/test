# On-Site "One-Click Register" — Removing the Eventbrite Redirect
_Goal: let visitors register/buy on agile-agilist.com without being bounced to eventbrite.com. Reduces drop-off and bounce._

## Short answer: YES — two ways, and you already have both installed.

Right now your training pages show event cards (via **WP Event Aggregator**) whose "Register" links send the visitor **off to eventbrite.com**. Every redirect = a drop-off point. Two ways to keep it on-site:

---

## Option 1 — Eventbrite Embedded Checkout (FAST, recommended first)
Keep Eventbrite as the engine, but the **checkout happens on your page** in a modal/inline iframe — no redirect. Eventbrite officially supports this in two styles: a **button that opens a modal overlay**, or **checkout embedded inline** in the page. ([Eventbrite Help](https://www.eventbrite.com/help/en-us/articles/300423/how-to-add-eventbrite-s-embedded-checkout-to-your-wordpress-org-site/))

**You already have the plugins active for this:**
- **WP Eventbrite Embedded Checkout** (v2.1.5, active) — literally: "Sell Eventbrite tickets directly from your WordPress site **without redirecting** users to Eventbrite."
- **Blocks for Eventbrite** (active) — "Eventbrite events with modern design and **embedded checkout**."

**How to turn it on (per training page):**
1. In each Eventbrite event → **Marketing → Embedded Checkout** → choose **Modal** (button) or **Inline** → it generates a snippet. ([Eventbrite Help](https://www.eventbrite.com/help/en-us/articles/300423/how-to-add-eventbrite-s-embedded-checkout-to-your-wordpress-org-site/))
2. OR use the **WP Eventbrite Embedded Checkout** block/shortcode in the page editor and enter the Event ID.
3. Place a **"Register Now"** button in the hero (fixes the bounce issue: surfaced CTA + on-site checkout).

**Requirements/caveats:** site must be HTTPS (✓ you are). A few Eventbrite features (e.g. certain reserved-seating/promo setups) disqualify an event from embedded checkout — test per event.

### Paste-safe modal "Register Now" button (official Eventbrite widget)
Drop into a page (Custom HTML block); replace `EVENTID` with the Eventbrite event ID:
```html
<a id="eb-reg-EVENTID" href="#" style="display:inline-block;background:#fbbf24;color:#053947;font-weight:800;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:16px">Register Now →</a>
<script src="https://www.eventbrite.com/static/widgets/eb_widgets.js"></script>
<script>
window.EBWidgets.createWidget({
  widgetType: 'checkout',
  eventId: 'EVENTID',
  modal: true,
  modalTriggerElementId: 'eb-reg-EVENTID'
});
</script>
```
Clicking it opens the Eventbrite checkout in a modal **on your page** — true one-click, no redirect.

---

## Option 2 — Fully native (WooCommerce + Event Tickets Plus) — strategic
Sell tickets **entirely on your site**, no Eventbrite at all: attendees never leave, full branding, your own checkout, **and you drop Eventbrite's ~7% fee.** ([Event Tickets](https://wordpress.org/plugins/event-tickets/), [WPMayor](https://wpmayor.com/best-wordpress-plugins-for-selling-tickets/))

**You already have:** WooCommerce (active), WooPayments (active), Event Tickets free (active).
**You'd need:** **Event Tickets Plus (~$99/yr)** to connect Event Tickets → WooCommerce for paid tickets.

**Trade-off:** most control + lowest fees + best data, BUT more setup/migration, and you lose Eventbrite's discovery marketplace (some buyers find events *on* Eventbrite). Bigger project.

---

## ⚠️ The hidden problem to fix either way: plugin bloat
You have **~8 overlapping event/Eventbrite plugins active** at once: Blocks for Eventbrite, Display Eventbrite Events, Event Feed for Eventbrite, WP Eventbrite Embedded Checkout, WP Event Aggregator (+Pro), Import Eventbrite Events, The Events Calendar (+Pro, +Event Tickets). That's a real **performance + conflict risk** — and page speed itself affects bounce. **Pick ONE registration path and deactivate the rest.** Fewer plugins = faster pages = lower bounce, on top of the redirect fix.

---

## Recommendation
1. **Now (fast win):** turn on **Eventbrite Embedded Checkout** (modal) using the plugin you already have. Add a surfaced **"Register Now"** button to each training-page hero (also fixes the buried-CTA bounce driver from `bounce-diagnosis.md`). Test one page → roll out.
2. **Consolidate** the event plugins down to the one stack you keep.
3. **Later (strategic):** if you want to drop the ~7% Eventbrite fee and own the funnel, migrate to **WooCommerce + Event Tickets Plus** (native).

## Why this reduces bounce
The current flow makes a ready-to-buy visitor (a) scroll ~25% to find Register, then (b) leave your domain for eventbrite.com — two drop-off points. Embedded checkout collapses it to **one click, on-page**. Combined with surfacing the button in the hero, you remove both friction points the data flagged.
