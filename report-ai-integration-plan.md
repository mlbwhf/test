# report-ai.org → agile-agilist.com — Integration Plan

## Status: needs ONE confirmation from you
Public search found a similarly-named impact-reporting SaaS (`reports-ai.app`) but **nothing
definitive for `report-ai.org`**. The `.org` + the fact that you want it on your own homepage
strongly suggests it's **your own property** — most likely an **AI-readiness / AI-report
generator** (a tool that produces an AI assessment report for a visitor).

So this plan is built around that assumption. Confirm in one line which it is:
  (A) It's our own AI-readiness / report-generator tool → use it as a LEAD MAGNET (recommended below).
  (B) It's a partner/3rd-party tool → use a referral/affiliate link, lighter integration.
  (C) Something else → tell me what it does and I'll re-spec.

---

## Best way to integrate (assuming A — our own AI-report tool)

The strategic fit is obvious: report-ai.org GENERATES an AI report; agile-agilist SELLS the
training that acts on it. So integrate it as the **top of your AI funnel** — a free, valuable
diagnostic that captures a lead and hands them to the right course.

### Funnel
report-ai.org (free AI report)  →  capture email  →  recommend AI-Native (US/CA/ME) or SAFe (global)  →  book advisor call

### 3 placement options, lowest-risk first

**1. Assessment-card slot (LOWEST RISK — recommended start).**
You already have an "Assessments & Tools" band on the homepage and an `/assessments/` hub.
Add report-ai.org as ONE more card titled e.g. **"AI Readiness Report"** linking out to
report-ai.org. This is purely additive — a single new link, no design change, no slug change,
fits the existing pattern exactly. It also strengthens your llms.txt "Assessments & Tools" list.

**2. Hero / band lead-magnet line.**
Inside the SAFe-global band (or the assessments band), add: "Not sure where you stand?
Get your free AI Readiness Report →". Soft, additive, points at the funnel entry.

**3. Inline on AI-Native pages (US/CA/ME).**
On the AI-Native course pages, a "Start with your free AI Readiness Report" CTA above the
fold — pre-qualifies the premium buyer before they ever ask for a quote.

### How to wire it WITHOUT disrupting ads/search
- **Linking, not embedding.** Keep report-ai.org on its own domain. A plain outbound link
  (optionally `target="_blank" rel="noopener"`) — no iframe, no subdomain change, no DNS change,
  nothing that touches agile-agilist's running URLs.
- **If you later want it to feel native:** a subfolder reverse-proxy (`agile-agilist.com/ai-report/`
  → report-ai.org) is the KnowledgeHut-style "keep authority on one domain" move — but that's a
  hosting/SiteGround task, NOT something to do mid-campaign. Defer until after ads are stable.
- **Tracking:** tag the outbound clicks in GTM (GTM-KNLG4JL5) as an event so you can see how many
  homepage visitors start the report — measures the integration without changing any page logic.
- **Lead handoff:** pipe report-ai.org email captures into the same HubSpot the advisor CTAs use
  (meetings.hubspot.com/john2795), so AI-report leads land in one pipeline.
- **GEO/SEO:** add report-ai.org to llms.txt under "Assessments & Tools" and cross-link it from
  the AI Assessment page — so LLMs and Google see the tool as part of your authority cluster.

### What I will NOT do
- No iframe/embed that could slow the homepage or break mobile.
- No DNS, nameserver, or subdomain change (that's the one thing that *would* disrupt ads/search).
- No change to any existing slug, redirect, or ad landing URL.

---

## Recommended first step (additive, reversible)
Add report-ai.org as a single **"AI Readiness Report"** card in the existing Assessments band +
one llms.txt line. One link. Zero design change. Measurable in GTM. Everything else (reverse-proxy,
inline AI-page CTAs) layered on later once you confirm what report-ai.org is and ads are stable.
