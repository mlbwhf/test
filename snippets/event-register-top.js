/* ============================================================================
   AA — Event page top area (The Events Calendar single event)
   WPCode → JavaScript snippet, Auto Insert → Site Wide Footer.
   No-op on every non-event page (guarded).

   Does, on each event page:
     1. Hides the Venue block + Google map  (our events are online)
     2. Marks the Details block so CSS can lay it out HORIZONTALLY
     3. Turns the "Click to Register" link into a button
     4. Adds a prominent Register button directly under the event title
   It keys off visible structure/text, so it survives plugin markup changes.
   ========================================================================== */
(function () {
  function isEventPage() {
    return /(^|\s)(single-tribe_events|tribe-events)/.test(document.body.className) ||
      !!document.querySelector('.tribe-events-single, .tribe-events-event-meta, .single-tribe_events');
  }

  function metaGroups() {
    var g = document.querySelectorAll('.tribe-events-event-meta .tribe-events-meta-group');
    if (g.length) return Array.prototype.slice.call(g);
    return Array.prototype.slice.call(document.querySelectorAll('.tribe-events-event-meta > div, .tribe-events-meta-group'));
  }

  function run() {
    if (!isEventPage()) return;

    /* 1) Remove Venue + map (online) --------------------------------------- */
    document.querySelectorAll(
      '.tribe-events-meta-group-venue, .tribe-events-meta-group-gmap, ' +
      '.tribe-events-venue-map, #tribe-events-gmap-0, .tribe-events-gmap'
    ).forEach(function (el) { el.style.display = 'none'; });

    metaGroups().forEach(function (grp) {
      var t = grp.querySelector('.tribe-events-single-section-title, h2, h3');
      if (t && /venue|location|map|ubicaci|lugar|المكان/i.test(t.textContent)) {
        grp.style.display = 'none';
      }
    });
    document.querySelectorAll('.tribe-events-single iframe[src*="google"], .tribe-events-single iframe[src*="maps"]')
      .forEach(function (el) { (el.closest('.tribe-events-meta-group') || el).style.display = 'none'; });

    /* 2) Details block -> horizontal --------------------------------------- */
    var details = document.querySelector('.tribe-events-meta-group-details');
    if (!details) {
      details = metaGroups().filter(function (grp) {
        var t = grp.querySelector('.tribe-events-single-section-title, h2, h3');
        return t && /details|detalles|التفاصيل/i.test(t.textContent);
      })[0];
    }
    if (details) {
      details.classList.add('aa-ev-details');
      var dl = details.querySelector('dl');
      if (dl) dl.classList.add('aa-ev-details-dl');
    }

    /* 3) "Click to Register" -> button ------------------------------------- */
    var scope = document.querySelector('.tribe-events-single, .tribe-events-event-meta') || document;
    var regAnchors = Array.prototype.filter.call(scope.querySelectorAll('a[href]'), function (a) {
      if (!/register|regist|سجل|تسجيل/i.test(a.textContent || '')) return false;
      if (a.getAttribute('href').charAt(0) === '#') return false;
      if (a.closest('#masthead, header, nav, .main-header-menu, footer, .site-footer, .ast-footer, .aa-ev-reg-top')) return false;
      return true;
    });
    var url = regAnchors.length ? regAnchors[0].href : null;
    regAnchors.forEach(function (a) { a.classList.add('aa-ev-reg-inline'); });

    /* 4) Prominent Register button under the title ------------------------- */
    if (url && !document.querySelector('.aa-ev-reg-top')) {
      var title = document.querySelector(
        '.tribe-events-single-event-title, h1.entry-title, .entry-header h1, .ast-single-post .entry-title, h1'
      );
      if (title && title.parentNode) {
        var wrap = document.createElement('div');
        wrap.className = 'aa-ev-reg-top';
        wrap.innerHTML =
          '<a class="aa-ev-reg-btn" href="' + url + '" target="_blank" rel="noopener noreferrer">' +
          'Register<span class="aa-ev-reg-arrow" aria-hidden="true">&#8594;</span></a>' +
          '<span class="aa-ev-reg-note">Online course &middot; secure your seat via Eventbrite</span>';
        title.parentNode.insertBefore(wrap, title.nextSibling);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
