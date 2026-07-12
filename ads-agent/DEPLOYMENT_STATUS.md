# Ads Agent — Deployment Status

**Deployed to:** branch `claude/ads-agent-deploy-eisu0m` in `mlbwhf/test`, under `ads-agent/`
**Date:** 2026-07-12 · **Mode:** Phase 1 (monitor + alert + recommend — ZERO writes to ad platforms)

This session ran inside a sandbox with two hard constraints that shaped what could be
*executed* vs. what was *built ready-to-run*:

1. **Network policy blocks outbound HTTPS to third-party APIs.** The agent proxy returned
   `403 (policy denial)` for `eventbriteapi.com`; the same applies to Groq / Microsoft /
   Google. So no live API call could be made from here.
2. **Non-interactive session.** OAuth flows that need a browser sign-in can't be completed here.

Everything below is committed to git (secrets excluded — `.env` is git-ignored).

---

## Step-by-step status

### 1. Test `src/eventbrite_pull.py` — ⚠️ verified offline; live run is yours to make
- The live call **cannot run in this sandbox** (proxy denies `eventbriteapi.com`).
- The script was **hardened** and its parsing/grouping **proven** with an offline self-test:
  ```
  cd ads-agent && python3 src/eventbrite_pull.py --selftest      # PASS
  ```
  Fixes made: Eventbrite v3 paginates via `continuation` (the old `?page=` never worked
  past page 1); env is read lazily; added `--days`, `--expand-event`, currency + course_family
  in output; refunded/non-`placed` orders are dropped.
- **To see your real recent orders**, run it where outbound to Eventbrite is allowed
  (your laptop or the n8n Cloud box) with `EVENTBRITE_TOKEN` + `EVENTBRITE_ORG_ID` set:
  ```
  python3 src/eventbrite_pull.py --days 30 --expand-event
  ```

### 2. Import 2-year sales CSV → Airtable baseline — ⛔ blocked on the CSV
- **The CSV was not included** in the uploads, so there was nothing to import.
- Ready to go the moment you provide it: `scripts/airtable_import_baseline.py` parses the CSV,
  derives `course_family` with the same logic as the live feed, and batches into Airtable.
- Airtable access is live via MCP. One base is visible: **"Eventbrite Series Automator"**
  (`appwJMaD43wjjjPI6`) — it has no registration/snapshot tables yet. Confirm whether to import
  there or into a new dedicated base, and I'll create the schema + load the rows.

### 3. Google Ads Script → Google Sheet — ✅ built (paste-to-install)
- `scripts/google_ads_daily_spend.gs`, with your Sheet ID
  `1kPbLU_wHGosHz4Oh02_e-LKHkDJ03NlCNJMAjfv_gu8` baked in.
- Logs per-campaign + account-total daily spend to a `GoogleAdsSpend` tab, and emails an
  alert if account spend crosses **CA$50/day** (the week-1 insurance from the spec).
- Read-only — it never pauses or edits anything.
- **You install it** (Ads Scripts run inside the Google Ads UI; can't be pushed via API):
  Ads > Tools & Settings > Bulk Actions > Scripts > paste > authorize > schedule daily 05:30 ET.
  Set `ALERT_EMAIL` at the top first.

### 4. Microsoft OAuth refresh token — ⛔ must run on your machine
- Interactive browser sign-in + network to `login.microsoftonline.com` — neither is available here.
- `scripts/get_ms_refresh_token.py` walks the auth-code flow and prints
  `MS_ADS_REFRESH_TOKEN=...` to paste into `.env`. You have Client ID + Secret already.
- Azure prerequisite: register redirect URI `https://login.microsoftonline.com/common/oauth2/nativeclient`
  and consent scope `https://ads.microsoft.com/msads.manage`. Details in the script header.

### 5. Schedule daily + weekly in n8n — ✅ importable JSON built
- The n8n MCP server was **not connected** this session, so workflows couldn't be pushed
  directly to `agile-agilist.app.n8n.cloud`. Import these instead (n8n > Workflows > Import from File):
  - `n8n/daily_tripwire_check.json` — Schedule 06:00 ET → Eventbrite ground-truth pull →
    tripwire checks (ported from `rules_engine.py`) → Gmail alert only when something fires.
  - `n8n/weekly_monday_analysis.json` — Schedule Mon 08:00 ET → gather 14d+YoY → Groq analysis
    (mirrors `weekly_analysis.py`) → Gmail report.
- On import: set workflow timezone to **America/Toronto**, attach Gmail OAuth2 + HTTP-Header-Auth
  credentials, and replace the two clearly-marked ad-platform spend **STUB** nodes once the Google
  Ads Sheet feed and the Microsoft API (needs step 4's refresh token) are wired.

### 6. Phase 1 monitoring mode — ✅ enforced by construction
- Nothing in this codebase writes to Google or Microsoft Ads. `rules_engine.py` only returns
  alert strings; `asset_generator.py` only validates drafts; both n8n workflows only read + email.
- The immutable core in `config/rules.yaml` (ground truth = registrations; no broad match /
  Display / PMax / unverified smart bidding; human approval for campaign/bid/budget changes) is
  the constitution — the agent may never propose weakening it.

---

## What I need from you to finish the blocked items
1. **The 2-year sales CSV** (+ which Airtable base) → I create the schema and load the baseline.
2. Run `scripts/get_ms_refresh_token.py` once → paste `MS_ADS_REFRESH_TOKEN` into `.env`.
3. Paste the `.gs` into Google Ads and import the two n8n workflows.
4. Confirm the alert email address (placeholder is `mark@agile-agilist.com`).

## 🔒 Security — rotate the shared tokens
`SETUP.md` flags that the **Eventbrite token** and **Microsoft developer token** were shared in a
chat transcript. The Groq key and MS client secret arrived the same way. **Rotate all of them**
once the agent is confirmed working, and keep the fresh values only in `.env` (git-ignored) or the
n8n credential store — never in git.
