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

### 2. Import 2-year sales CSV → Airtable baseline — ✅ base built, import in progress
- Created a new dedicated Airtable base **"Ads Agent"** (`appCXSWnIISm0c6iF`) with two tables:
  - **Registration Baseline** (`tblGznEo7jS2Dz0rs`) — ground-truth registrations
  - **Ad Daily Snapshots** (`tblfivllr8U7t3hFX`) — per-campaign/platform/day (Layer 1)
- Parsed the CSV (`Certified_SAFe_...Sales_...csv`): a per-class Eventbrite sales export,
  2022-01-07 → 2026-08-10. Registrations = **Paid tickets sold**, revenue = **Net sales**.
  Kept the 220 classes with ≥1 paid registration (zero-sale scheduled classes excluded).
  Reconciles to the CSV TOTALS: **433 registrations, $974,402.94 net**.
- **Course-family note:** per your correction, **ASPC is its own family** (23 classes,
  41 registrations, first sale 2025-02-12 — the newer course), kept separate from **SPC**
  (149 registrations). This split is locked into `eventbrite_pull.course_family` + its self-test.
- Import status: **75 of 220 rows imported via MCP** before the Airtable connector became
  unstable (it began dropping ~half of all writes mid-flight — a connector issue, not the data).
  **Finish in one reliable command** (needs outbound network, which this sandbox blocks — run it
  on your machine): it clears the partial 75 and loads all 220 cleanly, no duplicates:
  ```
  cd ads-agent && export AIRTABLE_TOKEN=pat...        # PAT with data.records:read+write on the base
  python scripts/airtable_import_baseline.py "/path/to/Certified_SAFe...Sales...csv" --replace
  ```
  The script is pre-wired to base `appCXSWnIISm0c6iF` / table "Registration Baseline" and to this
  CSV's columns. Registration totals of the full 220 (what you'll see after): **433 registrations,
  $974,402.94 net.** By family (registrations): RTE 164, SPC 149, ASPC 41, LEADING_SAFE 29,
  OTHER 23, SCRUM_MASTER 10, AI_NATIVE 9, POPM 8.

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
