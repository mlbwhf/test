# HubSpot integration — Report AI

Portal: **46316757** (`info@agile-agilist.com`) — shared with Agile Agilist.
Built to **Option B**: one portal, hard separation. See §1 before anything goes live.

---

## 1. The separation controls (do these FIRST — they are the firewall)

Report AI publishes measurement; Agile Agilist sells remediation. A subscriber to the
former must never become a sales lead for the latter without their own explicit,
separate consent. These five controls make that structural rather than a matter of
someone remembering:

| # | Control | Where | Why |
|---|---|---|---|
| 1 | Custom contact property **`ra_source`** (single-select: `report-ai.org`, `agile-agilist.com`, `both`) — set on every form submission | Settings → Properties → Contact | Without this you cannot tell the two audiences apart later, and migration to a separate portal becomes impossible |
| 2 | Custom property **`ra_consent_basis`** (text: what they actually agreed to, e.g. `newsletter:report-ai:2026-08-24`) | Same | Consent must be evidenced per purpose, not assumed |
| 3 | **Active list "Report AI — publication audience"**: `ra_source = report-ai.org` AND `ra_source ≠ both` | Contacts → Lists | The audience that may receive Report AI email |
| 4 | **Suppression list "Do not market — Agile Agilist"**: same membership, applied as an exclusion on *every* Agile Agilist marketing send | Marketing → Email → each send | The actual firewall. Without this, control 1 is just a label |
| 5 | **Subscription types split**: create "Report AI — The Weekly Figure" as its own subscription type, separate from any Agile Agilist type | Settings → Marketing → Email → Subscription Types | Lets people unsubscribe from one without the other, and makes the separation visible to the subscriber |

**Reversibility:** with 1 + 2 in place from the first submission, moving Report AI to its
own portal later is an export/import filtered on `ra_source`. Without them, the audiences
are permanently entangled. This is the single most important thing on this page.

## 2. Form approach — native HTML, not the embed script

Two options; I recommend the first:

**A. Native form posting to HubSpot's Forms API** ✅
- Full control of markup and styling — matches the house design system exactly
- No iframe, no HubSpot embed script, no layout shift
- Lighter: one `fetch()` on submit vs. a third-party bundle on every page load
- We own the honeypot and the consent checkbox
- Endpoint: `https://api.hsforms.com/submissions/v3/integration/submit/46316757/{FORM_GUID}`

**B. HubSpot embed script**
- Faster to set up, gets HubSpot's spam handling and form analytics free
- But: iframe styling limits, extra JS weight, and it drops tracking cookies on every
  page it loads — which brings a cookie-consent obligation site-wide

Given we've been protecting Core Web Vitals and the site has a strict design system,
**A** is the better fit. Files: `newsletter-form.html`, `contact-form.html`.

## 3. What I still need from you

| Needed | Where to get it | Blocks |
|---|---|---|
| **Newsletter form GUID** | HubSpot → Marketing → Forms → your newsletter form → Share/Embed → the `formId` | Newsletter form going live |
| **Contact form GUID** | Same, for the contact form | Contact form going live |
| **Reauthorize the HubSpot connector** with Forms + Marketing Email scopes | claude.ai → Settings → Connectors → HubSpot → reconnect | Me reading/creating forms and sends directly |

The portal ID (46316757) I already have.

## 4. Cookie consent — a real obligation, not a formality

HubSpot's tracking code sets cookies. If you load it, EU/UK visitors need a consent
banner before it fires. Two ways to avoid that entirely:

- **Don't load the tracking script at all.** The Forms API approach in §2 does not require
  it. You lose HubSpot's page-view attribution; you keep a clean cookie profile.
- If you do want tracking, add a consent banner and gate the script behind it.

My recommendation: skip the tracking script. Report AI's analytics needs are already
served by Site Kit / MonsterInsights, and a measurement institution carrying a third-party
marketing tracker is a bad look on top of the legal overhead.

## 5. Decommissioning Jetpack sending (must happen, or people get duplicates)

Current state: Jetpack's subscription form is on the homepage and in the sidebar, and
Jetpack emails subscribers **when a post publishes**. Since indexes and reports are
**pages**, subscribers have effectively been receiving nothing — the defect HubSpot fixes.

Order matters:

1. Put the HubSpot forms live first (so signups keep working).
2. **Export existing Jetpack subscribers** — Jetpack → Subscribers → Export CSV. Keep this
   file; it is the record of who consented and when.
3. **Do not bulk-import them into HubSpot.** They consented to a Report AI newsletter from
   WordPress, not to a CRM shared with a consultancy. Instead: send them one final Jetpack
   email announcing the move with a link to re-subscribe via the new form. Those who opt in
   arrive with fresh, evidenced consent and `ra_source = report-ai.org`.
4. Only then turn off Jetpack's subscription emails (Jetpack → Settings → Discussion →
   Subscriptions), and remove the Jetpack form from the homepage and sidebar widget.

Step 3 costs you some of the list. It is also the only version that survives scrutiny.

## 6. Order of work

- [ ] §1 controls 1–5 in HubSpot (you; ~20 min)
- [ ] Send me the two form GUIDs
- [ ] I swap the homepage + sidebar newsletter forms and wire `/about/contact/`
- [ ] Privacy policy updated with the disclosure text in `privacy-text.md`
- [ ] Jetpack decommission per §5
- [ ] Test: submit both forms, confirm `ra_source` and `ra_consent_basis` populate
