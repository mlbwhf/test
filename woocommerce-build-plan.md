# Native Registration — Competitor Benchmark + WooCommerce Build Plan
_Decision: keep Eventbrite running, build a native WooCommerce checkout alongside it._

## 1. What comparators are using (benchmark)
Every major SAFe/Agile training competitor takes registration **natively on their own site — none redirect to Eventbrite:**
- **Simplilearn:** "Enroll Now" → choose payment method → complete on-site → immediate access. ([Simplilearn](https://trainingcenter.com/simplilearn-login))
- **KnowledgeHut:** registration/enrollment on their own platform, transparent pricing, no hidden fees. ([KnowledgeHut – How it works](https://www.knowledgehut.com/how-it-works))
- **Sprintzeal / Edureka / Agilemania:** on-site enrollment + payment, online & classroom options.

**The pattern:** a prominent **"Enroll Now"** button → **same-domain checkout** → instant confirmation/account. The redirect-to-Eventbrite model you have now is *below* industry standard and is a known bounce/abandonment driver.

### Checkout features competitors offer (and what converts — match these)
From e-commerce checkout best-practice research ([BigCommerce](https://www.bigcommerce.com/articles/ecommerce/checkout-optimization/), [Stripe](https://stripe.com/resources/more/how-to-reduce-cart-abandonment), [Salesforce](https://www.salesforce.com/commerce/online-payment-solution/checkout-guide/)):
- **Same-domain checkout + SSL/trust badges** → reduces drop-off (the core win).
- **Financing / BNPL** (Klarna, Affirm, Afterpay) — big for high-ticket certs; Indian competitors push **EMI** hard. A major conversion lever.
- **Multi-currency** — aligns with your regional/London/Gulf/India strategy.
- **Guest checkout / one-page checkout** — fewer steps = fewer drop-offs.
- **No surprise fees** — show price (and tax) early.
- **Mobile-first** — most of your traffic.
- **Coupons/discounts, corporate & group enrollment, invoicing** — competitors all offer these.

## 2. You already have the foundation
Active on your site: **WooCommerce**, **WooPayments**, **The Events Calendar (+Pro)**, **Event Tickets (free)**. The only paid add-on needed for cohort-seat selling is **Event Tickets Plus (~$99/yr)** to bridge Event Tickets → WooCommerce.

## 3. Recommended build (two viable structures)
**Option A — Event Tickets Plus + WooCommerce (recommended).**
Sell each cohort as a **dated ticket** tied to your existing calendar; checkout runs through WooCommerce/WooPayments on-site. Best fit because you already run The Events Calendar.
- Add **Event Tickets Plus** → enable WooCommerce as the ticketing commerce engine.
- Each cohort = a ticket with date, capacity, price.
- Checkout stays on agile-agilist.com.

**Option B — Plain WooCommerce products.**
One **product per cohort/course** (variations for dates/format). Simpler, less event-aware, no Event Tickets Plus cost. Fine if you don't need calendar/seat logic.

## 4. Build checklist (config = wp-admin/dev; content = I can help via MCP)
**Store/config (wp-admin or dev):**
1. WooCommerce → Settings: currency display, tax, checkout = guest checkout ON, one-page.
2. WooPayments: enable cards + **BNPL/financing** (Affirm/Klarna/Afterpay) to match competitors.
3. Multi-currency (WooPayments multi-currency or a plugin) for GBP/EUR/AED/INR/CAD/USD.
4. Event Tickets Plus (Option A) → set WooCommerce as ticket commerce; OR create products (Option B).
5. Coupons; a **corporate/group** path (qty discounts + invoice/"request a quote").
6. Trust: SSL badge, money-back/pass-guarantee, reviews near the button.
**What I can do via MCP:**
- Scaffold the **"Register / Enroll" section** on training pages (paste-safe, surfaced in hero) pointing at the Woo product/ticket.
- Create **product pages / placeholders** and supporting copy.
- Cross-link from the buried pages + regional pages.

## 5. Transition strategy (keep Eventbrite + Woo together)
- **Don't show two register buttons on the same page** (confusing). Per course/cohort, pick ONE primary path.
- Run native **WooCommerce checkout as the primary CTA** on your highest-value pages first (Leading SAFe, SPC, AI-Native); keep **Eventbrite** for discovery/legacy cohorts and as fallback.
- Measure conversion native-vs-Eventbrite, then migrate the rest.
- Revisit the **plugin bloat** (~8 event plugins) — consolidate once native is proven.

## 6. Why this is the right call
Competitors keep the entire transaction on-site with financing + multi-currency; you currently bounce buyers to Eventbrite at the moment of intent. Native WooCommerce closes that gap, adds the financing/EMI lever competitors use, and ties directly into your global/multi-currency regional strategy — while Eventbrite keeps running so nothing breaks during the transition.
