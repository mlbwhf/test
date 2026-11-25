# Microsoft Ads review: 25 Oct - 23 Nov 2026 (30 days)

Source: the owner's Microsoft Ads "Campaign" report (campaign x ad distribution x device x day x
hour), uploaded 25 Nov. Amounts are in the account currency. Phase 1: these are recommendations,
and Mark applies them.

## The numbers
| | Impressions | Clicks | Spend | Conversions |
|---|---|---|---|---|
| **Total** | 202,177 | 1,553 | **2,428.56** (about **81/day**) | **1** |
| Search network | 26,788 | 658 | 1,810.76 (CPC 2.75) | **0** |
| **Audience Network** | 175,389 | 895 | **617.80** (CPC 0.69) | 1 |

| Campaign | Spend | of which Audience | Search CPC | Conversions |
|---|---|---|---|---|
| Certifications - English | 1,456.80 | 378.89 | 2.68 | 1 (Audience, smartphone) |
| AI-Native - Virtual | 736.82 | 85.92 | 2.70 | 0 |
| AgileAgilist Defense - English (brand) | 153.36 | **111.23** | **14.04** (3 clicks) | 0 |
| AI-Native - Face-to-Face | 81.58 | 41.76 | 3.32 | 0 |

## What's wrong, in order
1. **Audience Network is ON in all 4 campaigns.** That breaks the owner rule "Audience Network off".
   It took **25% of spend (CA$618, about 20/day)** and 87% of impressions, for 1 conversion. That
   conversion is the account's only one, and it's probably an Eventbrite click, not a sale.
2. **The brand campaign is barely a brand campaign.** 73% of its spend went to the Audience Network,
   and its 3 search clicks cost CA$14 each. The rule caps brand CPC at CA$2.
3. **Spend is above the approved band.** Microsoft alone averages about **CA$81/day**; the November
   band approved on 25 Nov is **up to CA$50/day for both accounts**. With Audience off, Microsoft
   would run about **CA$60/day** on Search.
4. **Search: 658 clicks and CA$1,811 with zero conversions.** Either the conversion goal isn't
   firing, or the click-to-registration path is broken. On 25 Nov the Launching AI-Native ARTs page
   showed no class dates to book (site fixes, section 5), and the goal counts Eventbrite clicks, not
   sales. Until website purchase tracking is live, Microsoft can't tell which clicks pay.
5. Not acted on yet, because there are no conversions to judge by:
   - Computer clicks cost 2x smartphone clicks (Search CPC 3.02 vs 1.39).
   - CA$244 of Search spend falls 00:00-05:59 **Pacific** (the account time zone, 03:00-08:59 Toronto).
   - Don't cut hours or devices before conversions are measured. That's the May 2026 over-optimizing mistake.

## Fix today (about 15 minutes, in Microsoft Ads)
1. **Turn off Audience Network** in all 4 campaigns, including their ad groups' ad distribution
   settings. Saves about CA$20/day.
2. **Brand campaign:** after step 1, set the max CPC to CA$2.00 or less (the rule).
3. **Budgets until 30 Nov:** the decision is yours (see "Decision needed" below).
4. **Keep the tracking suffixes exactly as they are** (owner rule). None of the steps above touch them.
5. **Check the conversion goal:** Conversions → Conversion goals. Is the Eventbrite-click goal
   "Active", and when was it last recorded? Use Microsoft's UET Tag Helper (browser extension) on
   agile-agilist.com to confirm the UET tag (343248805) fires. Send a screenshot.

## Decision needed: budget for the last 5 days of November
- **Option A (keeps the approved band):** total Microsoft daily budgets about **CA$35/day**, which
  leaves room for Google, mostly Certifications - English Search.
- **Option B (start the December ramp now):** keep Microsoft Search at today's about **CA$60/day**,
  since Black Friday / Cyber Monday is live. That's above the November band, so it needs your OK.

From 1 Dec the band is about CA$100/day across both accounts. The Google audit decides the split.
