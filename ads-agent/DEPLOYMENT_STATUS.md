# Ads Agent: deployment status

**Updated:** 2026-11-20 · **Mode:** Phase 1 (monitor + alert + recommend; **zero writes to ad platforms**)
**Code:** branch `claude/ads-agent-deploy-eisu0m`, folder `ads-agent/` · **Host:** your VPS (82.180.155.101)

## What runs where
| Piece | Where | Status |
|---|---|---|
| Daily pull + tripwires (06:15 ET) | VPS, systemd timer | **Built + tested offline.** Install with `deploy/install.sh` |
| Weekly analysis email (Mon 08:00 ET) | VPS, systemd timer | **Built + tested offline** (Groq by default) |
| Ground truth: **website (Stripe)** payments | `src/stripe_pull.py` | Built. Classifies each Stripe payment: **website** (counts for ads) vs Corsizio / other / unknown (internal only). Needs a read-only Stripe key |
| Ground truth: Eventbrite orders | `src/eventbrite_pull.py` | Built; internal data only (never an ad conversion) |
| Google Ads spend → Sheet | `scripts/google_ads_daily_spend.gs` | **Re-paste the updated script.** It now also logs status, bid strategy and the website-vs-other conversion breakdown |
| Claude Code on the VPS | `deploy/CLAUDE-CODE-ON-VPS.md` | Runbook ready: runs as `claudeops`, can't read the keys, driven from your app via Remote Control |
| Agent store | Airtable "Ads Agent" (`appCXSWnIISm0c6iF`) | Live; 75 of 220 baseline rows loaded |
| Microsoft Ads data | n/a | Not wired: needs the one-time OAuth (`scripts/get_ms_refresh_token.py`) |
| n8n workflows (`n8n/`) | n/a | **Superseded by the VPS timers.** Kept for reference; don't run both |

## Install on the VPS (about 15 minutes)
I can't SSH in from my sandbox, and keys don't belong in chat. Run this yourself, or enable
Remote Control on the VPS and I'll do it from there:
```bash
git clone -b claude/ads-agent-deploy-eisu0m https://github.com/mlbwhf/test.git ads-agent-src
cd ads-agent-src/ads-agent
sudo bash deploy/install.sh                 # installs to /opt/ads-agent, runs the offline self-test, timers OFF
sudo nano /opt/ads-agent/.env               # fill in keys (see .env.example: read-only keys everywhere)
sudo runuser -u adsagent -- /opt/ads-agent/venv/bin/python /opt/ads-agent/src/daily_run.py --dry-run
sudo bash deploy/install.sh --enable        # switch the daily + weekly timers on
```
The agent runs as its own unprivileged `adsagent` user. systemd only lets it write its own
`logs/` folder, so it can't touch the web server or the other sites on this machine.

Keys to put in `/opt/ads-agent/.env`:
- **Stripe:** a *restricted*, read-only Charges key
- **Airtable:** a PAT scoped to the Ads Agent base only
- **Eventbrite:** your token
- **Google Sheet:** the published-CSV link to the `GoogleAdsSpend` tab
- **Email:** SMTP details (a Gmail app password works)
- **Groq:** your key

**Rotate the Eventbrite, Groq and Microsoft keys that were shared in chat in July before you put
them on the server.**

## What the daily run does
1. Pulls paid registrations from the **website (Stripe)** and **Eventbrite** (last 3 days) and
   stores new ones in Airtable. It's de-duplicated by order ID, so re-runs are safe.
2. Reads yesterday's Google Ads spend from the Sheet.
3. Tripwires: account > 130% of the seasonal target · over plan 2 days running · brand CPC >
   CA$2 · **a paused campaign re-enabled** · **a bid strategy changed** · smart bidding without
   ≥15 verified registrations · no spend data at all.
4. Promo reminders: **29 Nov** (Black Friday wording ends; Cyber Monday takes over 30 Nov), **30 Nov** and **1 Dec** (remove offer copy).
5. **Emails you only when something needs attention.** Logs go to `/opt/ads-agent/logs/`.

## Fixed in this round
- **Tripwires never fired:** they checked "today", but spend is logged for *yesterday*. Now
  checked on the completed day, with the change-detection tripwires from the spec added.
- **Eventbrite course = buyer's name:** an order's `name` field is the *buyer*, not the course.
  So every order fell into OTHER, and personal data was being read. Course now comes only from
  the event; seats are counted from attendees; no personal data is stored. A test guards this.
- **Weekly report fallback:** an outdated model ID, and it read the first content block (current
  models return a thinking block first). Fixed; Groq remains the default.
- **Your 19 Nov rules are now enforced in code** (`src/asset_generator.py`): approved stable
  landing pages only; never `/event/`, `/wp-training/` or translations; no "pass guarantee" or
  "money-back" wording; no CAD pricing for US; offer copy only inside owner-confirmed promo dates.
  The validator self-test (14 cases) passes.

## Tests
`python tests/test_offline.py` runs the whole daily + weekly flow on generated data, with no
network: **ALL PASS**. The installer runs it on the VPS before the timers can be enabled.

## Waiting on you
| # | Item | File |
|---|---|---|
| 1 | **Approved 20 Nov:** import the keywords in 3 stages (stage 1 now: 6 AI-Native keywords + negatives; stage 2 on 1 Dec; stage 3 only after stage 1's 14-day review). 2 Advanced Scrum Master keywords are on hold until you send the English page URL | `proposals/2026-11_keyword-proposal.md`, `proposals/2026-11_keywords_stage*_google-ads-editor.csv` |
| 2 | **Approved:** apply the Black Friday kit (25 validated strings, 19-30 Nov; checklist inside; Microsoft by hand to protect the tracking suffixes) + decide the promo budget | `proposals/2026-11_black-friday-kit.md` |
| 3 | **Website-only tracking:** web team ships section 2 (mark website payments with `origin=agile-agilist.com`, verified purchase event, remove Eventbrite/Corsizio tags); you then switch goals in one go (section 4) | `proposals/2026-11_website-conversion-tracking.md` |
| 4 | Upload the 2 career-progression photos + logo (Google only) | `proposals/2026-11_image-assets.md` |
| 5 | ~~Partner tier~~ **Done:** "SAFe Platinum Partner" confirmed; the validator rejects "Gold" | `config/rules.yaml` |
| 6 | Install on the VPS (above), then set up Claude Code there | `deploy/install.sh`, `deploy/CLAUDE-CODE-ON-VPS.md` |
| 7 | Finish the Airtable baseline: re-upload the sales CSV, or run the importer with `--replace` | `scripts/airtable_import_baseline.py` |
| 8 | Fix the account settings the Google export showed: **Search Partners on**, **"Display Select"** on Certifications - English, **smart bidding without verified registrations** | Google Ads UI |
