# SETUP — Agile Agilist Ads Agent

## Where is the .env file?
It IS included in this package at the ROOT of the ads-agent folder (same level as README.md).
On some systems files starting with "." are hidden. To see it:
- Mac Finder: press Cmd + Shift + . (period) to reveal hidden files
- Windows Explorer: View menu > Show > Hidden items
- Terminal: `ls -la` (the -a shows dotfiles)
- VS Code / Claude Code: it shows in the file tree automatically

## Credentials already filled in .env
- EVENTBRITE_TOKEN — provided (ROTATE after first run)
- MS_ADS_DEVELOPER_TOKEN — provided (ROTATE after first run)
- MS_ADS_CUSTOMER_ID — 187136875

## Still to fill (marked FILL_ in .env)
- EVENTBRITE_ORG_ID — Eventbrite > Account Settings > find your Organization ID
- ANTHROPIC_API_KEY — for the weekly analysis
- MS_ADS_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN — from Azure app registration + one OAuth run
- GOOGLE_ADS_SHEET_ID — from the Google Ads Script you'll create in Phase A

## Deploy order (see README.md and Ads_Agent_Build_Spec.md)
1. Phase A: Google Ads Script -> Google Sheet (spend alert insurance, no API approval needed)
2. Phase B: unzip, `cp .env.example .env` is NOT needed now — .env is already here and filled
3. Phase C: test `python src/eventbrite_pull.py`
4. Phase D: Azure app registration for Microsoft
5. Phase E: schedule daily + weekly workflows in n8n
6. Phase G: rotate the two provided tokens

## SECURITY REMINDER
The Eventbrite and Microsoft tokens in .env were shared in a chat transcript.
Rotate BOTH once the agent is confirmed working with fresh values.
