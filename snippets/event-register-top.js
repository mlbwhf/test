/* ============================================================================
   AA — Event page top area  (WP Event Aggregator / Eventbrite events)
   WPCode → JavaScript snippet, Auto Insert → Site Wide Footer.
   No-op on every non-event page (guarded on the /wp-event/ URL + .wpea markup).

   On each event page it:
     1. Hides the Venue / organizer / map block  (our events are online)
     2. Rebuilds the Details block into a clean HORIZONTAL row
        (Date · Time · Event Category · Register), reading the <strong> labels
     3. Turns the "Click to Register" link into a teal button
     4. Adds a prominent Register button directly under the event title
   It rebuilds the markup itself, so it is immune to the plugin's row wrapping.
   ========================================================================== */
(function () {
  function isEventPage() {
    if (/\/wp-event\//.test(location.pathname)) return true;
    return !!document.querySelector('.wpea_organizer, .single-wp_events, .single-wp_event');
  }

  // Break a container into {label, valueHTML} items using <strong> as delimiters.
  function parseItems(container) {
    var items = [];

    // Case A: each field is its own block element containing a <strong>
    var blocks = Array.prototype.filter.call(container.children, function (c) {
      return c.tagName !== 'STRONG' && c.tagName !== 'BR' && c.querySelector && c.querySelector('strong');
    });
    var topStrongs = Array.prototype.filter.call(container.children, function (c) { return c.tagName === 'STRONG'; });

    if (blocks.length >= 2 && topStrongs.length === 0) {
      blocks.forEach(function (row) {
        var clone = row.cloneNode(true);
        var s = clone.querySelector('strong');
        var label = s.textContent.replace(/[:：\s]+$/, '').trim();
        s.remove();
        items.push({ label: label, html: clone.innerHTML.trim() });
      });
      return items;
    }

    // Case B: flat — <strong>label</strong> value <br> <strong>…
    var cur = null;
    Array.prototype.forEach.call(container.childNodes, function (n) {
      if (n.nodeType === 1 && n.tagName === 'STRONG') {
        if (cur) items.push(cur);
        cur = { label: n.textContent.replace(/[:：\s]+$/, '').trim(), html: '' };
      } else if (cur) {
        if (n.nodeType === 1 && n.tagName === 'BR') return;
        cur.html += (n.nodeType === 1 ? n.outerHTML : (n.textContent || ''));
      }
    });
    if (cur) items.push(cur);
    return items;
  }

  function run() {
    if (!isEventPage()) return;

    /* 1) Hide Venue / organizer / map (online) ----------------------------- */
    document.querySelectorAll('.wpea_organizer, .venue, .wpea_map, .wpea-map')
      .forEach(function (el) { el.style.display = 'none'; });

    /* 2) Rebuild Details horizontally -------------------------------------- */
    var details = document.querySelector('.details');
    var regUrl = null;
    if (details && !details.querySelector('.aa-ev-details-grid')) {
      var items = parseItems(details);
      if (items.length) {
        var grid = document.createElement('div');
        grid.className = 'aa-ev-details-grid';
        items.forEach(function (it) {
          var isReg = /regist|eventbrite/i.test(it.label) || /eventbrite/i.test(it.html);
          var cell = document.createElement('div');
          cell.className = 'aa-ev-cell' + (isReg ? ' aa-ev-cell-reg' : '');
          if (isReg) {
            cell.innerHTML = it.html; // just the link; we button-ify it below
          } else {
            cell.innerHTML =
              '<span class="aa-ev-k">' + it.label + '</span>' +
              '<span class="aa-ev-v">' + it.html + '</span>';
          }
          grid.appendChild(cell);
        });
        details.innerHTML = '';
        details.appendChild(grid);
        details.classList.add('aa-ev-details');

        var regLink = details.querySelector('.aa-ev-cell-reg a[href]');
        if (regLink) {
          regUrl = regLink.href;
          regLink.classList.add('aa-ev-reg-inline');
          regLink.innerHTML = 'Register<span class="aa-ev-reg-arrow" aria-hidden="true">&#8594;</span>';
          regLink.setAttribute('target', '_blank');
          regLink.setAttribute('rel', 'noopener noreferrer');
        }
      }
    }

    /* fallback: find the register URL anywhere in the details/body ---------- */
    if (!regUrl) {
      var any = document.querySelector('.details a[href*="eventbrite"], a[href*="eventbrite"]');
      if (any) regUrl = any.href;
    }

    /* 3) Prominent Register button under the title ------------------------- */
    if (regUrl && !document.querySelector('.aa-ev-reg-top')) {
      var title = document.querySelector('h1.entry-title, .entry-header h1, .page-title, h1');
      if (title && title.parentNode) {
        var wrap = document.createElement('div');
        wrap.className = 'aa-ev-reg-top';
        wrap.innerHTML =
          '<a class="aa-ev-reg-btn" href="' + regUrl + '" target="_blank" rel="noopener noreferrer">' +
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
