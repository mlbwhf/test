# Google Ads — How to Apply the New Regional Landing Pages
_Pairing the 4 new live pages with Google Ads, WITHOUT disrupting your existing (Toronto/NA) campaigns._

## The 4 live landing pages (use these as Final URLs)
| Region | Final URL | Geo target | Landing-page currency |
|---|---|---|---|
| UK | https://agile-agilist.com/safe-certification-training-london/ | United Kingdom | GBP |
| Europe | https://agile-agilist.com/safe-certification-training-europe/ | EU countries you serve | EUR |
| South Africa | https://agile-agilist.com/safe-certification-training-south-africa/ | South Africa | ZAR |
| Middle East | https://agile-agilist.com/safe-ai-training-middle-east/ | UAE + Saudi Arabia (+ Qatar/Kuwait if wanted) | AED/SAR |

---

## GOLDEN RULE: build NEW, don't touch existing
Create **new campaigns** (or new ad groups) for these regions. Do **not** change the Final URL, geo, or keywords of any running Toronto/NA campaign. This keeps your current spend/Quality Score intact and isolates the new geos so you can measure them cleanly.

To prevent the new campaigns from competing with your existing ones:
- In **existing** NA campaigns: make sure location targeting is **Canada/US only** (so they never serve in UK/EU/ZA/Gulf).
- In **new** regional campaigns: target only that region. No overlap = no internal auction competition = no wasted spend.

---

## Recommended account structure
**Option A (simplest): one campaign per region.**
```
Campaign: SAFe – UK            (Location: United Kingdom)
  Ad group: Leading SAFe UK    → /safe-certification-training-london/
  Ad group: SAFe POPM UK       → /safe-certification-training-london/
  Ad group: SPC UK             → /safe-certification-training-london/
Campaign: SAFe – Europe        (Location: Germany, Netherlands, etc.)
Campaign: SAFe – South Africa  (Location: South Africa)
Campaign: SAFe & AI – Gulf     (Location: UAE, Saudi Arabia)
```
Per-region campaigns let you set **separate budgets, bids, and ad schedules** (important — see timezones below).

---

## Location targeting (this is where money leaks)
- Set each campaign's location to its region.
- **CRITICAL:** Settings → Locations → Location options → choose **"Presence: People in your targeted locations"** — NOT the default "Presence or interest." The default shows your UK ad to anyone *interested in* the UK worldwide and burns budget. You want people physically in-region.
- Gulf: add **United Arab Emirates** and **Saudi Arabia** as the two locations (and Qatar/Kuwait/Bahrain if you'll serve them).

## Ad scheduling (match the landing page's promise)
Your pages promise local-timezone, business-hours delivery — schedule ads to match buyer hours:
- UK/Europe: Mon–Fri, ~07:00–19:00 local.
- South Africa: Mon–Fri business hours (SAST).
- **Gulf: schedule Sunday–Thursday** (Fri–Sat is the weekend). This alone makes the Gulf ads feel native.

## Currency note (important nuance)
- Your **Google Ads account currency is fixed** (likely CAD) — budgets/bids stay in that currency. You can't bill per-region.
- That's fine: what converts the visitor is the **landing page showing their local currency**, which these pages do (GBP/EUR/ZAR/AED-SAR). The ad account currency is invisible to the searcher.

---

## Keywords (per region, phrase/exact to control spend)
Lead with **region + course** terms:
- UK: `"safe certification uk"`, `"leading safe training london"`, `[safe agilist course uk]`, `"safe popm uk"`
- Europe: `"safe certification europe"`, `"leading safe training online cet"`
- South Africa: `"safe certification south africa"`, `"safe agilist johannesburg"`
- Gulf: `"safe certification dubai"`, `"safe training riyadh"`, `[leading safe dubai]`, `"agile certification uae"`

Add **negative keywords**: `free`, `pdf`, `jobs`, `salary` (filters non-buyers), and cross-add other regions as negatives if you ever consolidate.

## Ad copy (Responsive Search Ads) — put the REGION in Headline 1
Quality Score jumps when the **ad → keyword → landing page** all say the same region. Now that the page says "London/UK," your ad should too.
- **Pin Headline 1 = region:** "SAFe® Certification — London/UK", "SAFe® Training Dubai & Riyadh"
- Other headlines (let Google rotate 10–15): "Live-Virtual in UK Time", "SAFe® Gold Partner", "SPCT-Led Instructors", "Exam Included + Pass Support", "Leading SAFe, POPM, SPC & RTE", "Book a Free Advisor Call"
- Descriptions (4): lead with the local-timezone + Gold Partner + exam-pass USP; one with a CTA.

## Assets / extensions (add to every regional campaign)
- **Sitelinks:** Leading SAFe · SAFe POPM · Implementing SAFe (SPC) · Talk to an Advisor
- **Callouts:** SAFe® Gold Partner · SPCT-Led · Exam Included · Live in Your Timezone · Pass Support
- **Structured snippets** (Courses): Leading SAFe, POPM, SPC, RTE, LPM, APM
- **Call asset** (region phone if you have one) + **Lead form asset** if you want in-SERP capture.

---

## Quality Score = the real payoff
These pages exist so the ad and landing page finally match on geography. Expect:
- **Higher Quality Score** (better Ad Relevance + Landing Page Experience) → **lower CPC** for the same position.
- This is the #1 reason to run region-specific landing pages instead of pointing every ad at the generic page. Watch the **Landing Page Experience** column climb after a week.

## Conversion tracking (don't skip)
- Confirm a **Google Ads conversion** fires on the real goal: the HubSpot advisor booking (`meetings.hubspot.com/john2795`) and/or the enquiry/register click. Wire it through your existing **GTM container (GTM-KNLG4JL5)**.
- Set the booking/enquiry as the **primary conversion**; optimize bidding to it (Maximize Conversions, then tCPA once you have ~15–30 conversions/region).

## Budget & ramp
- Start each region small (e.g., a modest daily cap) on **Manual CPC or Maximize Clicks** to gather data, then switch to **Maximize Conversions**.
- Google organic/CPC is currently *underused* for you (Bing dominates via IndexNow), so this is **incremental** reach, not cannibalizing existing demand.
- Pause any region that isn't converting after a fair test; double down on the one that does (likely UK or Gulf given existing GA4 interest).

## First-week checklist
1. New campaign per region, **Presence-only** location targeting.
2. Final URLs = the 4 pages above.
3. Region in Headline 1 (pinned), full RSA, all assets attached.
4. Gulf scheduled Sun–Thu; others business hours local.
5. Conversion tracking verified firing **before** spending.
6. Existing NA campaigns locked to US/Canada so no overlap.
