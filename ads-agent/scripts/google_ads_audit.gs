/**
 * Agile Agilist: Conversion Audit (Google Ads Script). READ-ONLY.
 *
 * Pulls what decides conversions in the high season into tabs of the agent Sheet:
 * campaign settings + impression share lost to budget/rank, conversion actions
 * (which ones are PRIMARY), conversions by action, keywords (match type, QS),
 * search terms, ads (strength, approval), device / day / hour, regions, and the
 * month-by-month history for last year's season.
 *
 * It NEVER changes the account: no bids, budgets, keywords, ads or settings.
 * It only writes to the Sheet below.
 *
 * SETUP (once): Google Ads > Tools > Bulk actions > Scripts > + > paste > Authorize >
 * Preview > Run. Then in the Sheet: File > Download > Microsoft Excel (.xlsx) and send
 * the file to Claude. Re-run any time; each run replaces the Audit tabs.
 */

var SHEET_ID = '1kPbLU_wHGosHz4Oh02_e-LKHkDJ03NlCNJMAjfv_gu8';
var LAST30 = "segments.date DURING LAST_30_DAYS";

var QUERIES = [
  ['Audit_Campaigns',
   "SELECT campaign.name, campaign.status, campaign.advertising_channel_type, " +
   "campaign.bidding_strategy_type, campaign.target_cpa.target_cpa_micros, " +
   "campaign.maximize_conversions.target_cpa_micros, campaign_budget.amount_micros, " +
   "campaign.network_settings.target_google_search, campaign.network_settings.target_search_network, " +
   "campaign.network_settings.target_content_network, campaign.network_settings.target_partner_search_network, " +
   "campaign.geo_target_type_setting.positive_geo_target_type, " +
   "metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, " +
   "metrics.conversions_value, metrics.all_conversions, metrics.search_impression_share, " +
   "metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share, " +
   "metrics.search_top_impression_share " +
   "FROM campaign WHERE campaign.status != 'REMOVED' AND " + LAST30],
  ['Audit_ConversionActions',
   "SELECT conversion_action.name, conversion_action.status, conversion_action.type, " +
   "conversion_action.category, conversion_action.primary_for_goal, " +
   "conversion_action.include_in_conversions_metric, conversion_action.counting_type, " +
   "conversion_action.click_through_lookback_window_days FROM conversion_action " +
   "WHERE conversion_action.status != 'REMOVED'"],
  ['Audit_ConvByAction',
   "SELECT campaign.name, segments.conversion_action_name, metrics.conversions, " +
   "metrics.all_conversions, metrics.conversions_value FROM campaign WHERE " + LAST30],
  ['Audit_Keywords',
   "SELECT campaign.name, ad_group.name, ad_group_criterion.keyword.text, " +
   "ad_group_criterion.keyword.match_type, ad_group_criterion.status, ad_group_criterion.negative, " +
   "ad_group_criterion.quality_info.quality_score, ad_group_criterion.final_urls, " +
   "metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, " +
   "metrics.search_impression_share FROM keyword_view WHERE campaign.status = 'ENABLED' AND " + LAST30],
  ['Audit_SearchTerms',
   "SELECT campaign.name, ad_group.name, search_term_view.search_term, search_term_view.status, " +
   "segments.search_term_match_type, metrics.impressions, metrics.clicks, metrics.cost_micros, " +
   "metrics.conversions FROM search_term_view WHERE " + LAST30 +
   " AND metrics.impressions > 0 ORDER BY metrics.cost_micros DESC LIMIT 1000"],
  ['Audit_Ads',
   "SELECT campaign.name, ad_group.name, ad_group_ad.ad.id, ad_group_ad.ad.type, ad_group_ad.status, " +
   "ad_group_ad.ad_strength, ad_group_ad.policy_summary.approval_status, ad_group_ad.ad.final_urls, " +
   "metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions " +
   "FROM ad_group_ad WHERE campaign.status = 'ENABLED' AND " + LAST30],
  ['Audit_Device',
   "SELECT campaign.name, segments.device, metrics.impressions, metrics.clicks, metrics.cost_micros, " +
   "metrics.conversions FROM campaign WHERE " + LAST30],
  ['Audit_DayHour',
   "SELECT segments.day_of_week, segments.hour, metrics.impressions, metrics.clicks, " +
   "metrics.cost_micros, metrics.conversions FROM campaign WHERE " + LAST30],
  ['Audit_Regions',
   "SELECT campaign.name, geographic_view.country_criterion_id, geographic_view.location_type, " +
   "segments.geo_target_region, metrics.impressions, metrics.clicks, metrics.cost_micros, " +
   "metrics.conversions FROM geographic_view WHERE " + LAST30],
  ['Audit_Season',   // last year's high season vs now, by month
   "SELECT campaign.name, segments.month, metrics.impressions, metrics.clicks, metrics.cost_micros, " +
   "metrics.conversions, metrics.all_conversions FROM campaign " +
   "WHERE segments.date BETWEEN '2025-09-01' AND '2026-11-30'"]
];

function openSheet() {
  // The agent Sheet may not be shared with the Google account running this script.
  // Then make a new sheet owned by that account, and print its link in the Logs.
  try { return SpreadsheetApp.openById(SHEET_ID); }
  catch (e) {
    var ss = SpreadsheetApp.create('Agile Agilist - Ads Audit ' + new Date().toISOString().slice(0, 10));
    Logger.log('Could not open the agent Sheet (' + e + '). Wrote the audit here instead: ' + ss.getUrl());
    return ss;
  }
}

function main() {
  var ss = openSheet();
  Logger.log('Audit sheet: ' + ss.getUrl());
  var log = [['tab', 'rows', 'error']];
  for (var i = 0; i < QUERIES.length; i++) {
    var tab = QUERIES[i][0], query = QUERIES[i][1];
    try {
      var rows = [], header = null, it = AdsApp.search(query);
      while (it.hasNext()) {
        var flat = {};
        flatten(it.next(), '', flat);
        if (!header) { header = Object.keys(flat); }
        rows.push(header.map(function (k) { return flat[k] === undefined ? '' : flat[k]; }));
      }
      write(ss, tab, header ? [header].concat(rows) : [['no rows']]);
      log.push([tab, rows.length, '']);
    } catch (e) {
      log.push([tab, 0, String(e)]);   // one bad query never stops the others
    }
  }
  log.push(['run at', new Date().toISOString(), AdsApp.currentAccount().getCustomerId()]);
  write(ss, 'Audit_ReadMe', log);
}

// {campaign: {name: 'x'}, metrics: {costMicros: '1'}} -> {'campaign.name': 'x', 'metrics.costMicros': '1'}
function flatten(obj, prefix, out) {
  for (var k in obj) {
    var v = obj[k], key = prefix ? prefix + '.' + k : k;
    if (v !== null && typeof v === 'object' && !(v instanceof Array)) { flatten(v, key, out); }
    else { out[key] = (v instanceof Array) ? v.join(' | ') : v; }
  }
}

function write(ss, name, values) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clearContents();
  var width = values.reduce(function (m, r) { return Math.max(m, r.length); }, 1);
  values = values.map(function (r) { while (r.length < width) { r.push(''); } return r; });
  sh.getRange(1, 1, values.length, width).setValues(values);
}
