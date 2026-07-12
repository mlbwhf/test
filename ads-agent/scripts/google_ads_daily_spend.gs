/**
 * Agile Agilist — Daily Spend Logger + Budget-Cap Insurance Alert
 * Google Ads Script (native, free — no API approval needed).
 *
 * WHAT IT DOES (Phase 1: monitor + alert ONLY, no account writes):
 *   1. Appends one row PER ENABLED CAMPAIGN for yesterday to the "GoogleAdsSpend"
 *      tab of the Sheet below: date, campaign, cost, clicks, impressions, ctr, avgCpc.
 *   2. Writes an account-total row (campaign = "__ACCOUNT_TOTAL__").
 *   3. INSURANCE: if account cost today-so-far exceeds ALERT_CAD, emails ALERT_EMAIL.
 *      (Covers the catastrophic overspend case while the full agent is built.)
 *
 * It NEVER pauses, edits budgets, or changes bids. Read-only by design.
 *
 * SETUP (Mark, in ads.google.com):
 *   Tools & Settings > Bulk Actions > Scripts > "+" > paste this file.
 *   Authorize when prompted (Sheets + Mail). Preview once, then Run.
 *   Schedule: Frequency = "Daily", time = 05:30 ET (before the 06:00 n8n pull).
 *   The Sheet must be owned by / shared-editable to the same Google account
 *   (safeoncop@gmail.com) that owns the Ads account.
 */

var SHEET_ID   = '1kPbLU_wHGosHz4Oh02_e-LKHkDJ03NlCNJMAjfv_gu8';
var TAB_NAME   = 'GoogleAdsSpend';
var ALERT_CAD  = 50;                 // week-1 insurance threshold (account/day)
var ALERT_EMAIL = 'mark@agile-agilist.com';  // <-- set to the inbox you actually watch

function main() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(TAB_NAME) || ss.insertSheet(TAB_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['date', 'campaign', 'cost', 'clicks', 'impressions', 'ctr', 'avgCpc', 'currency', 'loggedAt']);
  }

  var tz = AdsApp.currentAccount().getTimeZone();
  var yday = Utilities.formatDate(new Date(Date.now() - 24 * 3600 * 1000), tz, 'yyyy-MM-dd');
  var currency = AdsApp.currentAccount().getCurrencyCode();
  var nowStamp = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm');

  // --- Per-campaign spend for YESTERDAY (complete day) ---
  var rows = [];
  var accCost = 0, accClicks = 0, accImpr = 0;
  var it = AdsApp.campaigns()
    .forDateRange(yday.replace(/-/g, ''), yday.replace(/-/g, ''))
    .withCondition('metrics.impressions >= 0')
    .get();
  while (it.hasNext()) {
    var c = it.next();
    var s = c.getStatsFor(yday.replace(/-/g, ''), yday.replace(/-/g, ''));
    var cost = s.getCost(), clicks = s.getClicks(), impr = s.getImpressions();
    accCost += cost; accClicks += clicks; accImpr += impr;
    rows.push([yday, c.getName(), round2(cost), clicks, impr,
               impr ? round2(clicks / impr * 100) : 0,
               clicks ? round2(cost / clicks) : 0, currency, nowStamp]);
  }
  rows.push([yday, '__ACCOUNT_TOTAL__', round2(accCost), accClicks, accImpr,
             accImpr ? round2(accClicks / accImpr * 100) : 0,
             accClicks ? round2(accCost / accClicks) : 0, currency, nowStamp]);
  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }

  // --- INSURANCE: account cost TODAY-so-far vs cap ---
  var todayCost = AdsApp.currentAccount().getStatsFor('TODAY').getCost();
  if (todayCost > ALERT_CAD) {
    MailApp.sendEmail(ALERT_EMAIL,
      'Google Ads spend alert: ' + round2(todayCost) + ' ' + currency + ' today (> ' + ALERT_CAD + ')',
      'Account 337-177-3090 has spent ' + round2(todayCost) + ' ' + currency +
      ' so far today, exceeding the ' + ALERT_CAD + ' ' + currency + ' insurance cap.\n\n' +
      'This is an alert only — no campaign was changed. Check the account.');
  }
  Logger.log('Logged ' + rows.length + ' rows for ' + yday + '; today-so-far ' + round2(todayCost) + ' ' + currency);
}

function round2(n) { return Math.round(n * 100) / 100; }
