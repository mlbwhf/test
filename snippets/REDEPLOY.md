# Redeploy manifest — apply to the LIVE site after migration completes

**STATUS: ALL CHANGES QUEUED — do NOT deploy until the user confirms migration is finished.**
All work below is currently **offline only** (in this repo). Nothing is published or drafted on any live site. When the new hosting is ready, redeploy everything in this order.

## Queued in this work (deploy checklist)
- [ ] All 15 page files → republish to their page IDs (table in §1) — content is final in `snippets/pages/`
- [ ] Pill "back-to-parent" breadcrumb — on all 14 content pages (light pill on light pages; dark-variant pill on About / Customers / FAQ / Agile Maturity dark heroes)
- [ ] Services landing — Five Dimensions block added; "Mark"/booking CTAs → "Get in touch" (/about/contact/)
- [ ] Testimonials — role-based reviews (from `reviews.md`) already embedded per page (unique set each)
- [ ] "Get in touch" CTA sweep — booking/HubSpot/"Message Mark" → /about/contact/ across service pages
- [ ] Books → "coming soon" (Mutation, Innovation Culture)
- [ ] CSS — append `nav-mega-v2-patch.css` (+ nav-fix layers) to "AA – Global CSS" (§2)
- [ ] Nav JS — recreate `AA – Nav JS` from `nav-all-in-one.js` (§3)
- [ ] Menu — `aa-mega`/`aa-flag` classes, About submenu (flagship + 4), 5 layers under Operating Model (§4)
- [ ] AI Automation (layer 04) page — BUILT (`ai-automation.html`); create at /services/ai-automation/ and repoint menu item 28864 (currently → /services/digital-transformation/)
- [ ] Mobile perf — page-level fixes done (image dims + lazy/async, nav-JS reflow). Host/plugin steps in `MOBILE-PERF.md` (LiteSpeed Cache: defer JS, async/critical CSS, add-missing-sizes, WebP, caching, single-hop redirects) — apply after migration.

## 1) Pages — content is in `snippets/pages/<file>` → publish to the page ID

| File | Page ID | URL |
|---|---|---|
| home-961.html | 961 | / |
| about-964.html | 964 | /about/ |
| services-966.html | 966 | /services/ |
| faq-1799.html | 1799 | /about/faq/ |
| customers.html | 28778 | /customers/ |
| ba-1702.html | 1702 | /services/business-agility/ |
| dt-1714.html | 1714 | /services/digital-transformation/ |
| pm-1731.html | 1731 | /services/product-operating-model/ |
| ic-1705.html | 1705 | /services/innovation-culture/ |
| operating-model.html | 28854 | /services/operating-model/ |
| scaling-iterative-model.html | 28858 | /services/scaling-iterative-model/ |
| ai-native-operating-model.html | 28869 | /services/ai-native-operating-model/ |
| mutation.html | 28870 | /services/mutation/ |
| assessments-landing.html | 15940 | /assessments/ |
| agile-maturity-assessment.html | 28785 | /assessments/agile-maturity/ |
| ai-automation.html | NEW (create) | /services/ai-automation/ |

(Page IDs are from the old WordPress.com site; on the migrated DB the same slugs/IDs should carry over. Each file is a full `<!-- wp:html -->` Custom-HTML block — paste as-is.)

## 2) CSS — the "AA – Global CSS" snippet (WPCode, Site-Wide Header, CSS)
Keep the existing mega-menu CSS, then append, in order:
- `snippets/nav-fix-v3.css`, `nav-fix-v5-add.css`, `nav-fix-v6-add.css` (header/panel positioning)
- `snippets/nav-mobile-accordion.css` (mobile)
- `snippets/nav-mega-v2-patch.css` (flagship fully-clickable + flagship/About/Assessments descriptions)

## 3) JS — WPCode snippets
- `AA – Nav JS` (JavaScript · Site-Wide Footer) = `snippets/nav-all-in-one.js`
- `AA – Course JS` = `snippets/aa-course-js.MERGED.js` — RE-PASTE (updated: the course-date rail's Eventbrite fallback now reads a per-course URL from `#aa-cohorts data-eb` instead of the org-wide URL). To filter each course to its own classes, add `data-eb="<that course's Eventbrite Collection/series URL>"` to the course page's `#aa-cohorts` element. Without it, it falls back to the org calendar (all courses).
- `AA – Book a Consult popup`, cohort/schedule snippets — already migrated; verify active.

### Eventbrite behavior notes
- The date **rail is already course-specific** (scraped from each page). Only the *fallback* link was org-wide — now fixed to be per-course via `data-eb`.
- The **embedded-in-page Eventbrite modal is gone by design** (the snippet scrolls to `#cohorts` and opens Eventbrite in a new tab). Eventbrite retired its embeddable checkout widget and blocks iframing event pages, so an in-page Eventbrite modal is no longer reliable. The in-page checkout path today is **Stripe** ("Register [Stripe]" → FluentForm 21). If you want to attempt restoring the Eventbrite embedded widget, confirm your Eventbrite account still has embedded checkout enabled first.

## 4) Menu (Appearance → Menus) — classes + structure
- `aa-mega` on top-level: Assessments, Services, Training, About
- `aa-flag` on flagship (order them FIRST under their parent):
  - Services → Operating Model in the Age of AI (children: the 5 layers)
  - Assessments → Career Selector
  - Training → AI-Native
  - About → Customers
- About submenu = Customers (aa-flag) + Our Story (/about/), FAQ (/about/faq/), Send us a message (/about/contact/), Global Offices (/about/#offices)
- 5 layers under Operating Model: Scaling Iterative Model /services/scaling-iterative-model/, Innovation Framework /services/innovation-culture/, AI-Native /services/ai-native-operating-model/, AI Automation /services/ai-automation/, Mutation /services/mutation/

## 5) Reviews source
`snippets/reviews.md` — the role-based testimonials already embedded in each page file (no action needed unless refreshing).

## Not-yet-done / open
- AI Automation (layer 04) dedicated page — not built yet (menu item currently points to /services/digital-transformation/).
- Real company logos to pair with the role-based testimonials (optional).
