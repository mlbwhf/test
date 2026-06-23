# Brew-n-Chill — SEO + LLM/GEO Optimization (v2)

_Updated for the Robo-Barista line, coffee **and ice cream**, and the US · Canada · UAE · Saudi Arabia service area._

## 1. Primary entities & keywords

**Brand/product entity:** "Brew-n-Chill Robo-Barista" (own this phrase everywhere — name, H1s, alt text, schema).

High-intent keywords to target:
- robo barista / robotic barista machine / coffee robot
- automated coffee kiosk for business / self-serve coffee machine
- coffee and ice cream vending machine / automated ice cream kiosk / soft serve robot
- office coffee service · coffee machine for gym / hotel / mall / hospital / university
- buy / lease / rent a coffee robot · coffee kiosk ROI · coffee kiosk franchise
- coffee robot UAE / Saudi Arabia / Canada (geo long-tail)

## 2. Per-page title tags & meta descriptions (≤60 / ≤155 chars)

| Page | Title tag | Meta description |
|---|---|---|
| Home `/` | `Robo-Barista: Coffee & Ice Cream Machine for Business \| Brew-n-Chill` | `Automated Robo-Barista that serves barista-grade coffee and soft-serve ice cream 24/7 — zero staffing. Offices, gyms, malls, hotels. Book a free demo.` |
| Robo-Barista `/machines/` | `Brew-n-Chill Robo-Barista — Mini, Pro & Max \| Coffee + Ice Cream Robot` | `Compact to full robotic coffee + ice cream kiosks. Robo-Barista Mini, Pro and Max — matched to your footfall and budget. See specs.` |
| How It Works `/how-it-works/` | `How the Robo-Barista Works — Install to First Cup \| Brew-n-Chill` | `Site survey to first cup: how a Brew-n-Chill Robo-Barista is installed, stocked and serviced — fully managed, no barista, coffee and ice cream.` |
| Industries `/industries/` | `Coffee & Ice Cream Kiosks for Offices, Malls, Gyms, Hotels \| Brew-n-Chill` | `Automated Robo-Barista kiosks for offices, malls, cinemas, gyms, hotels, hospitals and campuses. See where coffee + ice cream performs best.` |
| Pricing & ROI `/pricing-roi/` | `Robo-Barista Pricing & ROI — $75K vs a Café \| Brew-n-Chill` | `A staffed café costs ~$280K/yr in payroll. A $75K Robo-Barista needs zero baristas. See the savings, payback and maintenance options.` |
| Our Coffee `/our-coffee/` | `Our Coffee & Ice Cream — Brew and Chill \| Brew-n-Chill` | `Specialty beans for the coffee, premium soft-serve for the chill. Brew-n-Chill recipes are dialled in for the Robo-Barista — café-grade every time.` |
| About `/about/` | `About Brew-n-Chill — Coffee + Ice Cream Robo-Barista Partner` | `We pair the best automated coffee + ice cream technology with our own brand — turnkey Robo-Barista kiosks for businesses. Buy, lease or revenue-share.` |
| FAQ `/faq/` | `Robo-Barista FAQ — Install, Cost, Coffee & Ice Cream \| Brew-n-Chill` | `Space, power, maintenance, payment, coffee + ice cream quality and contracts — common questions about the Brew-n-Chill Robo-Barista, answered.` |
| Contact `/contact/` | `Book a Free Robo-Barista Demo \| Brew-n-Chill` | `Tell us about your space and we'll recommend a Robo-Barista, model the economics and arrange a tasting. Serving US, Canada, UAE & Saudi Arabia.` |

Set these via the page `meta` fields `jetpack_seo_html_title` and `advanced_seo_description` (already wired in the page updates), or in Rank Math / Yoast.

## 3. Structured data (schema.org) — for SEO + LLM citeability

Add via **Rank Math** or **Yoast** (most reliable; the REST API strips inline `<script>` for non-admins):
- **Organization** (site-wide): name, logo, url, sameAs (socials), areaServed = US, CA, AE, SA, contactPoint (phone +1 647-999-7433, email info@brew-n-chill.com).
- **Product** + **Offer** on the Robo-Barista page (Mini/Pro/Max).
- **FAQPage** on the FAQ page (each Q/A).
- **LocalBusiness** / **Service** with areaServed for the four countries.
- **BreadcrumbList** site-wide.

## 4. LLM / GEO (Generative Engine Optimization)

Make the site easy for ChatGPT, Claude, Perplexity, Google AI Overviews to quote:
- **Lead with a one-sentence definition** on each page (entity + what it does) — done in hero/intro copy.
- **Question-style H2/H3s** + concise answers (FAQ format) — high citation rate.
- **Concrete numbers** stated plainly (60 sec, ~2 m², $75K, ~$280K/yr payroll, 12–18 mo payback).
- **Consistent entity name** "Brew-n-Chill Robo-Barista" so models bind the brand.
- **Descriptive alt text** naming the product + action.
- Publish **`/llms.txt`** at the site root (see `seo/llms.txt`) — a growing convention that gives LLMs a clean map of the site.
- Keep content in **server-rendered HTML** (it is — Gutenberg), not JS-only, so crawlers/LLMs read it.

## 5. Blog topics (long-tail + GEO authority)

1. "Robo-Barista vs traditional café: a 2026 cost comparison"
2. "How much does an automated coffee + ice cream kiosk cost?"
3. "Best locations for a coffee and ice cream robot"
4. "Coffee robots in the UAE & Saudi Arabia: what to know"
5. "Office coffee and employee retention: the real ROI"
6. "Buy vs lease vs revenue-share a Robo-Barista"
