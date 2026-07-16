# Redeploy manifest — agile-agilist.com (site 247366622)

**STATUS: Pages are live.** Content in `snippets/pages/` has been pushed to the
live site for 14 of 15 pages (see §1 table — `1705` still needs a manual
push/retry, WordPress.com's endpoint was intermittently rejecting large
payloads with inline `<script>` tags). CSS/JS below is **not yet pasted live**
— WPCode snippets can't be pushed via the content API, they need to be pasted
manually in wp-admin.

## Deploy checklist
- [x] 14 of 15 pages live (table in §1) — `1705` (Innovation Culture) still needs a push
- [x] Pill breadcrumb — now **global**, auto-injected by JS (§3 Module 4) above the utility strip on every page. No longer baked into individual page HTML — the old hardcoded `<nav aria-label="Breadcrumb">` per page is hidden via CSS (§2, section 3) so there's no duplicate, and can be deleted from page HTML later.
- [x] Services landing — Five Dimensions block added; "Mark"/booking CTAs → "Get in touch" (/about/contact/)
- [x] Testimonials — role-based reviews (from `reviews.md`) embedded per page
- [x] "Get in touch" CTA sweep — booking/HubSpot/"Message Mark" → /about/contact/ across service pages
- [x] Books → "coming soon" (Mutation, Innovation Culture)
- [ ] **CSS — paste `aa-global-appendix.css` to "AA – Global CSS"** (§2) — ONE consolidated block, not yet pasted live
- [ ] **JS — paste `aa-nav-js.js` as "AA – Nav JS"** (§3) — ONE consolidated snippet, not yet pasted live
- [ ] Menu — `aa-mega`/`aa-flag` classes, About submenu (flagship + 4), 5 layers under Operating Model (§4)
- [ ] AI Automation (layer 04) page — BUILT (`ai-automation.html`); create at /services/ai-automation/ and repoint menu item 28864 (currently → /services/digital-transformation/)
- [ ] Mobile perf — page-level fixes done (image dims + lazy/async, nav-JS reflow). Host/plugin steps in `MOBILE-PERF.md`

## 1) Pages — content is in `snippets/pages/<file>` → publish to the page ID

| File | Page ID | URL | Live? |
|---|---|---|---|
| home-961.html | 961 | / | ✅ |
| about-964.html | 964 | /about/ | ✅ (script-stripped — see note) |
| services-966.html | 966 | /services/ | ✅ |
| faq-1799.html | 1799 | /about/faq/ | ✅ |
| customers.html | 28778 | /customers/ | ✅ |
| ba-1702.html | 1702 | /services/business-agility/ | ✅ |
| dt-1714.html | 1714 | /services/digital-transformation/ | ✅ |
| pm-1731.html | 1731 | /services/product-operating-model/ | ✅ |
| ic-1705.html | 1705 | /services/innovation-culture/ | ⚠️ still a stub — retry push |
| operating-model.html | 28854 | /services/operating-model/ | ✅ (script-stripped — see note) |
| scaling-iterative-model.html | 28858 | /services/scaling-iterative-model/ | ✅ |
| ai-native-operating-model.html | 28869 | /services/ai-native-operating-model/ | ✅ |
| mutation.html | 28870 | /services/mutation/ | ✅ |
| assessments-landing.html | 15940 | /assessments/ | ✅ |
| agile-maturity-assessment.html | 28785 | /assessments/agile-maturity/ | ✅ (script-stripped — see note) |
| ai-automation.html | NEW (create) | /services/ai-automation/ | not yet created |

**Script-stripped note:** WordPress.com's content-authoring endpoint intermittently rejects payloads that are both large (~33KB+) and contain inline `<script>` tags (`invalid_json` error — appears to be a WAF rule, per WP.com support). Pages 964, 28854, and 28785 landed live with their `<script>` blocks removed as a workaround. Their **interactive JS (accordions, radar chart, tab-switching, hero-scroll animation, HubSpot form embed)** is currently missing from the live page and needs to be re-added — either by retrying the full push with scripts once support confirms the rule is cleared, or by pasting the missing `<script>` block(s) directly in the block editor.

## 2) CSS — the "AA – Global CSS" snippet (WPCode, Site-Wide Header, CSS)
Keep the existing base rules (core mega-menu markup + original `::after` descriptions), then paste **`snippets/aa-global-appendix.css`** at the end — ONE consolidated block covering:
- header fixed positioning + 2A translucent/blur chrome
- utility strip styling
- breadcrumb pill styling (+ hides old per-page breadcrumbs)
- logo + top-level nav link typography + action pills (2A)
- mega panel positioning (desktop) + open state + hover-bridge
- mobile accordion (chevron expand/collapse)
- mega content: flagship fully-clickable card + flagship/About/Assessments descriptions

This file **replaces** the old separate append-blocks — `nav-fix-v3.css`, `nav-fix-v4-add.css`, `nav-fix-v5-add.css`, `nav-fix-v6-add.css`, `nav-mobile-accordion.css`, `nav-mega-v2-patch.css`, `nav-2a.css`, `aa-breadcrumb.css` (all now folded in; those files are kept in the repo for history but should not be pasted separately — pasting both would duplicate rules).

`footer-social-icons.css` and `event-register-top.css` are unrelated, independently-scoped features — keep them as their own small snippets.

## 3) JS — WPCode snippets
- **`AA – Nav JS`** (JavaScript · Site-Wide Footer) = **`snippets/aa-nav-js.js`** — ONE consolidated snippet, 4 modules: desktop mega hover-intent, mobile accordion, utility-strip injector, breadcrumb injector. Replaces `nav-all-in-one.js`, `nav-mega-hover-intent.js`, `nav-mobile-accordion.js`, `nav-2a-utility-strip.js`, `aa-breadcrumb.js` (all folded in — don't paste those separately).
- `AA – Course JS` = `snippets/aa-course-js.MERGED.js` — the course-date rail's Eventbrite fallback reads a per-course URL from `#aa-cohorts data-eb`. Add `data-eb="<course's Eventbrite Collection/series URL>"` to filter each course page to its own classes; without it, falls back to the org calendar.
- `AA – Book a Consult popup`, cohort/schedule snippets — verify active.

### Eventbrite behavior notes
- The date **rail is course-specific** (scraped from each page). Only the *fallback* link was org-wide — fixed to be per-course via `data-eb`.
- The **embedded-in-page Eventbrite modal is gone by design** — Eventbrite retired embeddable checkout and blocks iframing event pages. In-page checkout today is **Stripe** ("Register [Stripe]" → FluentForm 21).

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
`snippets/reviews.md` — the role-based testimonials already embedded in each page file.

## Not-yet-done / open
- Restore page 1705 (Innovation Culture) — still showing stub content live.
- Re-add scripts to 964 / 28854 / 28785 (see script-stripped note in §1).
- AI Automation (layer 04) dedicated page — built but not yet created live.
- Real company logos to pair with the role-based testimonials (optional).
- Update SPC + ASPC training pages to $2,815 USD (requested, not yet located/done).
