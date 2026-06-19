# Leading SAFe — Native Checkout Pilot (Option A + Option B)
_Pilot course: Leading SAFe® (SAFe Agilist). Build both native paths; keep Eventbrite running in parallel._

## What I can build (MCP) vs what's wp-admin
- **MCP (done):** a draft "Enroll: Leading SAFe" page scaffolding the register UI with both A & B placeholders (see page created this session).
- **wp-admin/dev (you):** the actual product/ticket + payment config below. No MCP API exists for WooCommerce products.

---

## SHARED config (do once — powers both options)
1. **WooCommerce → Settings → Payments → WooPayments:** enable cards + **BNPL/financing** (Affirm/Klarna/Afterpay) — the financing lever competitors use on high-ticket certs.
2. **Multi-currency** (WooPayments multi-currency): USD/CAD/GBP/EUR/AED/INR — ties to the regional strategy.
3. **Checkout → enable Guest checkout**, one-page if available; show price + tax early (no surprise fees).
4. **Coupons** (WooCommerce → Marketing → Coupons) for promos.
5. **Corporate/group:** a "Request a group quote" path (Fluent Forms, already active) + qty-based discount.
6. **Trust:** money-back / pass-guarantee line + reviews near the button; SSL badge.

---

## OPTION A — Event Tickets Plus + WooCommerce (recommended; calendar-native)
Sell each Leading SAFe cohort as a dated ticket tied to The Events Calendar; checkout via WooCommerce on-site.
1. Install + activate **Event Tickets Plus** (~$99/yr).
2. **Tickets → Settings → Payments:** set **WooCommerce** as the ticket commerce provider.
3. Open each **Leading SAFe event** (your existing calendar cohorts) → **Tickets → New Ticket**:
   - Name: `Leading SAFe® — [Cohort date]`
   - Price: `[PRICE]` · Capacity: `[seats]` · Sale window: open until start.
4. The event/page now shows a native ticket selector → "Add to cart" → WooCommerce checkout **on your domain**.
5. Surface it on the training page with `[tribe_tickets post_id="EVENT_ID"]` (renders the ticket form for that event).

**Pros:** date/seat/capacity logic, ties to calendar you already run. **Best for** cohort-based scheduling.

---

## OPTION B — Plain WooCommerce product (simplest)
One product for the course; variations for dates/format.
1. **WooCommerce → Products → Add New:** `Leading SAFe® (SAFe Agilist) Certification`.
2. Product type: **Variable product** → attribute **"Cohort"** with options = your dates/formats (e.g., "Jun 20 · Live-Virtual ET"); generate variations; set price per variation.
   - (Or **Simple product** + one price if you don't need per-date variants.)
3. Set SKU, short description (the value props), featured image.
4. Embed on the training page with `[product_page id="PRODUCT_ID"]` (full buy box) or `[add_to_cart id="PRODUCT_ID"]` (button).

**Pros:** no add-on cost, simplest. **Con:** less event/seat-aware than A.

---

## On the Leading SAFe training page (the bounce fix)
- Put a **surfaced "Enroll Now" band in the hero** (not buried at 25% depth) — see the scaffold page + paste-safe snippet.
- Show **price + "from $X or 4× $Y with financing"** and a trust line.
- **One primary register path per page** — don't show Woo + Eventbrite buttons together. Make Woo the primary; keep Eventbrite as a secondary/legacy or on other cohorts.

## Pilot → measure → roll out
1. Wire Leading SAFe with Option A **and** B on a staging/draft, pick the one that feels cleanest operationally.
2. Make it the primary CTA on `/training/safe/sa/`.
3. Compare conversion vs the Eventbrite redirect for 2–3 weeks.
4. Roll the winner out to SPC, AI-Native, POPM, etc., then consolidate the ~8 event plugins.

## Decision captured
- Pilot = **Leading SAFe**, building **both A and B** to compare.
- Eventbrite stays live in parallel.
