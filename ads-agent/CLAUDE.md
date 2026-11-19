# Ads Agent: working notes for Claude Code

Owner: Mark Saymen (Agile Agilist). Read `DEPLOYMENT_STATUS.md` for current state before doing anything.

## Non-negotiable rules
- **Paid registrations are the only success metric.** Ad-platform "conversions" are not sales
  unless they are the `Website Purchase - Paid Registration` action.
- **Ads count ONLY Stripe payments made through the website checkout** (`source=website_stripe`).
  Eventbrite, Corsizio, invoices and other Stripe payments are internal data only.
- **Phase 1: never write to Google Ads or Microsoft Ads.** Produce drafts in `proposals/`; Mark applies them.
- **Never change the WordPress site** (pages, posts, plugins, settings). Propose changes to Mark.
- Ads point only to approved stable pages (`config/rules.yaml` → `owner_directives.approved_final_urls`).
  **Never** `/event/` or `/wp-training/` (one page per class date; they go stale) or `/fr/ /es/ /ar/`
  in English campaigns. Don't edit or delete those pages: they feed the registration calendar.
- Copy: no "pass guarantee" or "money-back" ("exam prep and support" instead); no CAD prices to US;
  "SAFe Platinum Partner" (never "Gold"); offer copy only inside `confirmed_promotions` dates.
- Microsoft: keep tracking suffixes as they are, Audience Network off, no multimedia/image assets.
- Constitution (`rules.yaml` → `immutable`) is Mark's to edit: no broad match, no Display/Search
  Partners/Audience Network, no PMax, no smart bidding without ≥15 verified registrations/30d.
  Don't propose weakening it. Over-optimizing is the documented failure mode (May 2026).

## Run things locally instead of relaying data (saves tokens)
- Tests (no network): `python tests/test_offline.py`
- Validate copy/URLs: `src/asset_generator.py` (`validate_asset`, `validate_final_url`)
- Rebuild drafts: `python scripts/build_black_friday_kit.py`, `python scripts/build_keyword_proposal.py`
- Live dry run on the VPS (as the service user, never reads secrets into chat):
  `sudo -u adsagent /opt/ads-agent/venv/bin/python /opt/ads-agent/src/daily_run.py --dry-run`
- Deploy code changes: `sudo bash deploy/install.sh` (keeps `.env` and logs)
- Logs: `/opt/ads-agent/logs/`, `journalctl -u ads-agent-daily -u ads-agent-weekly`
- Airtable: use `src/airtable_client.py` (REST, de-duplicated). Don't paste big batches through MCP.

## Where things are
- Airtable base `appCXSWnIISm0c6iF`: "Registration Baseline" (`tblGznEo7jS2Dz0rs`),
  "Ad Daily Snapshots" (`tblfivllr8U7t3hFX`)
- Google Ads 337-177-3090 · Microsoft Ads 187136875 (UET 343248805) · Sheet `1kPbLU_wHGosHz4Oh02_e-LKHkDJ03NlCNJMAjfv_gu8`
- Secrets: `/opt/ads-agent/.env` only (chmod 600, owner adsagent). Never print, copy or commit them.

## Gotchas already learned
- An Eventbrite order's `name` is the **buyer**, not the course. The course comes from the event.
- Spend is logged for **yesterday** (complete day); tripwires check `as_of = yesterday`.
- Course families: ASPC is its own family (not SPC).
- Stripe payments without `metadata.origin=agile-agilist.com` (or a checkout returning to the site)
  are `stripe_unverified`: never counted as website.
