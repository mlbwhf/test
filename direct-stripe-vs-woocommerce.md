# Direct Stripe vs WooCommerce — for selling course seats
_Decision input: keep Eventbrite running; choose the native on-site payment path._

## Key realization
You already run **WooPayments, which IS Stripe under the hood.** So this isn't "Stripe vs WooCommerce" on payment rails — both use Stripe. The real choice is **how much store machinery you wrap around it:**
- **WooCommerce** = a full cart/catalog/order system on top of Stripe.
- **Direct Stripe** = a lightweight payment form/checkout, no cart.

For a business selling a **defined set of cohorts** (not a 100-SKU store), the lighter path usually wins.

## What direct Stripe gives you (and competitors use)
Stripe natively provides the exact features competitors lean on — **no extra plugins:**
- **Financing / BNPL** (Klarna, Affirm, Afterpay) built into Stripe.
- **135+ currencies**, 45+ countries — matches your London/Gulf/India regional plan.
- **Apple Pay / Google Pay**, SCA, fraud protection, PCI handled by Stripe.
- **Stripe Checkout** = highest-converting drop-in; **Embedded Checkout keeps the buyer on your domain** end-to-end (no redirect bounce). ([Stripe](https://stripe.com/payments/checkout))
- Fees ~2.9%+30¢ — **far below Eventbrite's ~7%.**

## The 4 direct-Stripe paths (best fit first)
1. **Fluent Forms + Stripe (RECOMMENDED — you already have Fluent Forms active).**
   A registration **form that also takes Stripe payment** in one step, on-site: captures attendee name/email/cohort **and** payment together, then pushes to **HubSpot via Zapier** (both already active). Solves the "who's attending + grant access" fulfillment gap that plain Stripe doesn't. Zero new heavy plugins. *(Formidable Pro, also active, can do this too.)*
2. **WP Simple Pay** — dedicated "cartless" Stripe plugin; no-code one-time/recurring, multi-currency, BNPL. Add if the forms' Stripe addon is too limited. ([WP Simple Pay](https://wpsimplepay.com/))
3. **Stripe Checkout (embedded)** — most polished, stays on-domain; needs a dev to create checkout sessions via API.
4. **Stripe Payment Links** — fastest no-code (make a link in the Stripe dashboard); slight redirect to a Stripe-branded page (still trusted), weakest data capture.

## Honest trade-offs vs WooCommerce
| | Direct Stripe | WooCommerce |
|---|---|---|
| Plugins / bloat | **Lean** (helps speed→bounce) | Heavy (adds to your ~8 event plugins) |
| Financing, multi-currency, wallets | **Native in Stripe** | Native in WooPayments (also Stripe) |
| Fees | ~2.9% | ~2.9% (same rails) |
| Catalog / cart / coupons | Minimal | **Full** |
| **Cohort capacity / seat limits** | Manual or form-entry limits | **Strong** (Event Tickets) |
| **Attendee roster / order admin** | Form + Zapier→HubSpot | **Built-in** orders |
| Speed to launch | **Fast** | Slower |

**The one thing to plan for with direct Stripe:** cohort **capacity** (don't oversell a seat count) and **attendee fulfillment** (roster + access). Fluent Forms handles entry limits + data capture; Zapier→HubSpot handles fulfillment. Good enough for a defined cohort schedule. If you ever need true seat-inventory/roster management at scale, WooCommerce+Event Tickets is more robust.

## Recommendation
**Skip WooCommerce; go direct Stripe via Fluent Forms + Stripe.** Reasons:
1. Uses plugins you already have — **no new store stack, less bloat** (which also helps the speed/bounce problem).
2. Native **BNPL + multi-currency + Apple/Google Pay** — the competitor features, free in Stripe.
3. Captures **attendee data + payment in one on-site step** → straight into HubSpot.
4. Cheapest, fastest to ship, on-brand.
Keep **Eventbrite** running in parallel during the pilot.

## Updated Leading SAFe pilot
The scaffold page (26639) stays — just swap the WooCommerce/Event-Tickets shortcodes for the **Fluent Forms registration+payment form** shortcode once built. The surfaced "Enroll Now" hero band is identical either way.

### Build steps (Fluent Forms + Stripe)
1. **Connect Stripe:** Fluent Forms → Settings → Payments → connect your Stripe account; enable BNPL + wallets + currencies in the Stripe dashboard.
2. **Build the form:** Name, Email, Company, **Cohort (dropdown of dates)**, Quantity, **Payment field (Stripe)** with the course price (per-cohort or fixed). Set an **entry limit** per cohort for capacity.
3. **Confirmation + fulfillment:** success message + email; Zapier → HubSpot contact/deal + your LMS/calendar.
4. **Embed:** put the form's shortcode in the scaffold page (26639) and surface the Enroll band on `/training/safe/sa/`.
5. Test a live payment (Stripe test mode first), then go live. Compare vs Eventbrite for 2–3 weeks.
