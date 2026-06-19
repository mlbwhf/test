# Adding Cohorts + Connecting the Scaled Agile Calendar — Workflow
_How new SAFe classes flow between Scaled Agile and your website._

## The key mental model: TWO separate systems
There is **no automatic sync** between Scaled Agile and your site. They do different jobs:

| System | Job |
|---|---|
| **SAFe Studio → Partner Portal** (was "SAFe Community Platform") | Schedule the class, get your license/course materials, manage the **attendee roster**, and trigger **exam access**. Your public classes also appear on Scaled Agile's **Find Training** calendar (academy.safe.com). |
| **Your website (agile-agilist.com)** | Market the cohort + take **registration & payment** (Fluent Forms + Stripe, or Eventbrite). |

You keep them aligned **manually** — that's the standard SAFe-partner process.

## Adding a new cohort (future workflow — repeat per class)
1. **Schedule in SAFe Studio → Partner Portal (Class Setup):** pick course, date(s), online/in-person. This secures your license, course materials, exam access, and lists the class on Scaled Agile's public partner calendar.
2. **Open registration on your site:**
   - **Stripe/Fluent Forms path:** add the new date as an option in the **"Cohort date" dropdown** of the Leading SAFe registration form, set its **price** and a **capacity/entry limit**. (Optionally also add a matching event in **The Events Calendar** for display + SEO.)
   - **If keeping a cohort on Eventbrite:** create it in Eventbrite → **WP Event Aggregator** auto-imports it to your site calendar (your current setup).
3. **Market it:** regional pages, blog CTAs, ads.
4. **Collect registrations:** Fluent Forms + Stripe → Zapier → **HubSpot** (contact/deal). Watch the capacity limit.
5. **1–2 weeks before start:** upload the **paid attendees to the SAFe Studio class roster.** Scaled Agile then sends each attendee the Welcome Email, SAFe Studio access, course materials, and (after class) **exam access**.
6. **After class:** attendees take the web-based exam via Scaled Agile.

> So: **you sell on your site → you fulfil through SAFe Studio.** Money + marketing on your side; licensing, roster, materials, exam on Scaled Agile's side.

## "Connecting the Scaled Agile public calendar to specific dates/events"
Honest answer: **there is no documented automatic iCal/API feed** that pulls your SAFe-scheduled classes onto WordPress. The SAFe Find-Training calendar and your site are separate. Practical options:

1. **Manual mirror (standard, recommended):** when you schedule a class in SAFe Studio, add the same date to your site (the form's cohort dropdown + an optional Events Calendar entry). One source of truth: **SAFe Studio for licensing/roster, your site for sales.**
2. **Link out for trust/SEO:** add a "See our scheduled SAFe® classes on Scaled Agile" link to your partner listing on academy.safe.com.
3. **Check for an export:** ask **Scaled Agile Partner Support** whether SAFe Studio can export your scheduled classes as an **iCal/.ics** feed. If yes, you can import it into **The Events Calendar** (your **WP Event Aggregator** already supports iCal/ICS import) — that would semi-automate the mirror. I can't confirm this feed exists; verify with them.
4. **Eventbrite bridge (today's setup):** you already import Eventbrite → site via WP Event Aggregator. If you schedule public classes in Eventbrite too, your site calendar stays populated automatically — but that's the Eventbrite calendar, not the SAFe one.

## Recommended simplest operating model
- **SAFe Studio** = system of record for scheduling, roster, exam (required as a partner anyway).
- **Your site (Fluent Forms + Stripe)** = registration + payment; add each new date to the form dropdown.
- **Mirror manually** (2 min per class). Revisit automation (iCal import) only if Scaled Agile offers a feed.
- Keep **Eventbrite** running in parallel during the pilot for any cohorts you don't move yet.
