/* ============================================================================
   AA — Event page: Register CTA at the TOP
   WPCode → add as a JavaScript snippet, Auto Insert → Site Wide Footer.
   (The isEventPage() guard makes it a no-op on every non-event page.)

   What it does: on a The Events Calendar single-event page it finds the
   existing Eventbrite "Click to Register" link, then inserts a formatted
   aa-teal Register button directly under the event title so visitors see a
   clear call-to-action the moment they land — without removing the one at
   the bottom.
   ========================================================================== */
(function () {
  function run() {
    // Only on a single event page
    var isEvent =
      document.body.classList.contains('single-tribe_events') ||
      document.querySelector('.tribe-events-single, .single-tribe_events, .tribe-events-event-meta');
    if (!isEvent) return;

    // Don't run twice
    if (document.querySelector('.aa-ev-reg-top')) return;

    // Find the existing register link anywhere in the page body (skip header/nav/footer)
    var anchors = Array.prototype.slice.call(document.querySelectorAll('a[href]'));
    var reg = anchors.find(function (a) {
      if (!/register/i.test(a.textContent || '')) return false;
      if (a.getAttribute('href').charAt(0) === '#') return false;
      if (a.closest('#masthead, header, nav, .main-header-menu, footer, .site-footer, .ast-footer')) return false;
      return true;
    });
    var url = reg ? reg.href : null;
    if (!url) return;

    // Anchor point: the event title
    var title = document.querySelector(
      '.tribe-events-single-event-title, .tribe-events-header .tribe-events-single-event-title, h1.entry-title, .entry-header h1, h1'
    );
    if (!title || !title.parentNode) return;

    var wrap = document.createElement('div');
    wrap.className = 'aa-ev-reg-top';
    wrap.innerHTML =
      '<a class="aa-ev-reg-btn" href="' + url + '" target="_blank" rel="noopener noreferrer">' +
      'Register for this course<span class="aa-ev-reg-arrow" aria-hidden="true">&#8594;</span></a>' +
      '<span class="aa-ev-reg-note">Secure your seat &middot; registration via Eventbrite</span>';

    title.parentNode.insertBefore(wrap, title.nextSibling);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
