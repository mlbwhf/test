# Agile Agilist Ads Agent

Monitors Google (and later Microsoft) Ads against **paid registrations**: website (Stripe)
payments + Eventbrite orders. It enforces the strategy guardrails and emails you alerts and a
weekly analysis. **Phase 1: it never changes anything in the ad accounts.**

Start with **[DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md)** (current state, VPS install steps,
what's waiting on you).

## Layout
- `config/rules.yaml`: the constitution (immutable core, seasonal calendar, tripwires, owner
  directives, confirmed promotions)
- `src/daily_run.py` / `src/weekly_run.py`: the two scheduled entry points
- `src/stripe_pull.py`, `src/eventbrite_pull.py`: ground-truth registrations
- `src/spend_sheet.py`: Google Ads spend from the Sheet the Ads Script writes
- `src/rules_engine.py`: tripwires · `src/asset_generator.py`: copy + landing-page validator
- `src/airtable_client.py`, `src/notify.py`, `src/config.py`: store, email, config
- `scripts/`: Google Ads Script, Microsoft OAuth helper, baseline importer, proposal builders
- `deploy/`: VPS installer + systemd timers · `tests/test_offline.py`: no-network end-to-end test
- `proposals/`: drafts awaiting your approval (keywords, Black Friday kit, tracking, images)
- `n8n/`: earlier n8n workflows, superseded by the VPS timers (reference only)
