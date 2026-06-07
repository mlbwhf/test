# Agile Agilist — Build Status & Draft Register
_Updated 2026-06-07. All items below are DRAFTS. Nothing live, no existing slug/URL/redirect/ad target touched._

## ✅ Created this session (drafts — safe, new slugs)
| Page | ID | Slug | Preview | Notes |
|---|---|---|---|---|
| SAFe Training — London/UK | 26177 | `/safe-certification-training-london/` | `?page_id=26177&preview=true` | UK time, GBP. SAFe-only. |
| SAFe Training — Europe | 26178 | `/safe-certification-training-europe/` | `?page_id=26178&preview=true` | CET, EUR. SAFe-only. |
| SAFe Training — South Africa | 26179 | `/safe-certification-training-south-africa/` | `?page_id=26179&preview=true` | SAST, ZAR. SAFe-only. |
| SAFe & AI — Middle East | 26180 | `/safe-ai-training-middle-east/` | `?page_id=26180&preview=true` | GST, Sun–Thu, AED/SAR, Arabic-on-request, **in-person AI-Native section**. |
| [PREVIEW] Homepage SAFe Band | 26181 | `/zz-preview-homepage-safe-band/` | `?page_id=26181&preview=true` | Throwaway preview of the band only. noindex. Delete after review. |

Preview links are login-required (you must be logged into wp-admin). Full form:
`https://agile-agilist.com/?page_id=<ID>&preview=true`

### To finish each regional page (your fill-ins)
- Replace `[DATE n]` and `[PRICE]` / `[AED/SAR PRICE]` with real cohort dates + prices.
- Apply the matching **Course JSON-LD** (in `agile-agilist-safe-london-landing.md`) per page, adjusting currency/areaServed.
- Add **hreflang** only AFTER publishing (never point hreflang at a draft).
- Then publish + add to nav when ready. (I did NOT publish or link them.)

## 🟡 Homepage band — how to ship it (no redesign)
- Mock file: `agile-agilist-homepage-safe-global-band.html` (paste-safe, additive, CSS namespaced `.aa-sg-*`).
- Live preview of the band: page **26181**.
- Placement: paste the block ABOVE `<!-- ============ ASSESSMENTS — with proper SVG icons per card ============ -->` on Home (961), Code editor.
- I did NOT duplicate or edit the live homepage. Option still open: I can build a full draft-COPY of the homepage with the band pre-inserted (string-insert into the fetched content, no hand-retyping) if you want a true full-page preview.

## ⏳ Approved, NOT yet done — these touch LIVE / ad-targeted URLs (sign-off gated)
1. **/sa/ Leading SAFe geo-aware fix (24467).** Plan: build a DRAFT COPY of 24467 with a global+hub-cities ribbon and live-virtual scheduling so you preview it, then you publish-swap. Will NOT edit the live ad page directly.
2. **SPC consolidation.** Need to first identify the 4 competing SPC URLs (GA4 showed 4 titles). 301s on these can affect ads → I will produce a redirect PLAN for your sign-off, and confirm which SPC URLs currently have ads before anything redirects.
3. **US + Canada combined pages.** ⚠️ Flag before building: dedicated US/Canada pages may CANNIBALIZE existing pages that already rank for US/Canada (homepage, /training/*). Recommend confirming this is wanted before creating — unlike London/Gulf, these markets are already served.

## 🔗 report-ai.org integration (confirmed: user's own domain, related to Agile Agilist)
- **About page:** add a sentence mentioning report-ai.org as Agile Agilist's AI-readiness reporting tool. (Approved — additive edit to live About page; low risk.)
- **Assessments band / hub:** add an "AI Readiness Report" card linking to report-ai.org (additive, one link).
- **llms.txt:** add report-ai.org under "Assessments & Tools".
- No DNS/subdomain/iframe changes. Track outbound clicks in GTM. See `report-ai-integration-plan.md`.
