/**
 * WPCode Snippet — "AA - Message Pivot CTAs" (v2)
 * REPLACES the old "Assessments Hub: rewrite results-screen CTAs to HubSpot" snippet.
 *
 * PASTE INSTRUCTIONS:
 *   WP Admin → Code Snippets (WPCode) → open the old assessments-CTA snippet →
 *   replace its code with this file → Save & Activate.
 *   (Type: JavaScript Snippet · Location: Site Wide Footer)
 *
 * WHAT CHANGED (message pivot — HubSpot meetings are OUT):
 *   1. Assessments-hub results CTAs now point to the Message Mark form on
 *      /about/#message, carrying attribution as ?aa_page=<assessment>&aa_band=<band>.
 *      The About page prefills the message textarea from those params.
 *   2. SITEWIDE SAFETY NET: any leftover meetings.hubspot.com/john2795 link
 *      anywhere on the site is rewritten to /about/#message with attribution.
 *      (Course pages are frozen for ads — this is client-side only, no content
 *      edits — links behave per the pivot without touching frozen pages.)
 *   3. GA4: clicking a rewritten CTA fires message_cta_click (a LEAD signal,
 *      never a conversion — Eventbrite registrations remain the only conversion).
 */
(function () {
  'use strict';
  if (window.__aaMsgPivot) return;
  window.__aaMsgPivot = true;

  var HUBSPOT = 'meetings.hubspot.com/john2795';
  var MSG_BASE = 'https://agile-agilist.com/about/';

  function readAssessmentContext() {
    try {
      var raw = sessionStorage.getItem('aa_result');
      if (!raw) return null;
      var r = JSON.parse(raw);
      return {
        aid: (r && r.assessmentId) || 'assessments',
        band: (r && r.band && r.band.id) || ''
      };
    } catch (e) { return null; }
  }

  function buildMsgUrl(page, band) {
    var u = MSG_BASE + '?aa_page=' + encodeURIComponent(page || location.pathname.replace(/\//g, '') || 'site');
    if (band) u += '&aa_band=' + encodeURIComponent(band);
    return u + '#message';
  }

  function rewriteCtas() {
    var ctx = readAssessmentContext();
    var onAssessments = location.pathname.indexOf('/assessments') === 0;
    var page = onAssessments && ctx ? ctx.aid : location.pathname.replace(/^\/|\/$/g, '') || 'home';
    var band = ctx ? ctx.band : '';
    var url = buildMsgUrl(page, band);

    // 1. Assessments SPA: replace the "Start 14-day free trial" button.
    var trialBtn = document.querySelector('button.aa-btn-accent[onclick*="signupTrial"]');
    if (trialBtn && !trialBtn.dataset.aaCtaFixed) {
      var link = document.createElement('a');
      link.className = 'aa-btn aa-btn-accent';
      link.href = url;
      link.textContent = 'Message Mark →';
      link.dataset.aaCtaFixed = '1';
      trialBtn.parentNode.replaceChild(link, trialBtn);
    }

    // 2. Sitewide: any remaining HubSpot meeting link → Message Mark.
    var links = document.querySelectorAll('a[href*="' + HUBSPOT + '"]');
    links.forEach(function (a) {
      if (a.dataset.aaCtaFixed) return;
      a.href = url;
      // Relabel obvious booking labels; leave custom labels alone.
      var t = (a.textContent || '').trim();
      if (/book|consult|talk to mark|15|schedule|meeting/i.test(t)) {
        a.textContent = 'Message Mark →';
      }
      a.dataset.aaCtaFixed = '1';
    });
  }

  // GA4 lead-signal on click of a rewritten CTA (event name is a LEAD, not a conversion).
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[data-aa-cta-fixed], a[href*="/about/?aa_page="]') : null;
    if (a && window.gtag) {
      gtag('event', 'message_cta_click', { cta_page: location.pathname });
    }
  }, true);

  function watch() {
    var target = document.querySelector('.aa-app, #aa-app, main, body');
    if (!target) return;
    var mo = new MutationObserver(function () { rewriteCtas(); });
    mo.observe(target, { childList: true, subtree: true });
    rewriteCtas();
    window.addEventListener('hashchange', function () { setTimeout(rewriteCtas, 50); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watch);
  } else {
    watch();
  }
})();
