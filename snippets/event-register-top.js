/* ============================================================================
   AA — Event page top area  (WP Event Aggregator / Eventbrite events)
   WPCode → JavaScript snippet, Auto Insert → Site Wide Footer.
   No-op on every non-event page (guarded on the /wp-event/ URL + .wpea markup).

   On each event page it:
     1. Hides the Venue / organizer / map block  (our events are online)
     2. Hides the "Leave a Comment / By … / date" post-meta line
     3. Rebuilds the Details block into a clean HORIZONTAL row
        (Date · Time · Event Category · Register), reading the <strong> labels
     4. Turns the "Click to Register" link into a teal button
     5. Adds a top block: the certification badge + a prominent Register button
   It rebuilds the markup itself, so it is immune to the plugin's row wrapping.
   ========================================================================== */
(function () {
  var BADGES = {
    SPC:  'https://agile-agilist.com/wp-content/uploads/2026/05/SAFe-Badge_SPC.png',
    SA:   'https://agile-agilist.com/wp-content/uploads/2026/05/SAFe-Badge_SA.png',
    SASM: 'https://agile-agilist.com/wp-content/uploads/2026/05/SAFe-Badge_SASM.png',
    SSM:  'https://agile-agilist.com/wp-content/uploads/2025/11/SAFe-Badge_SSM-AI.png',
    POPM: 'https://agile-agilist.com/wp-content/uploads/2025/11/SAFe-Badge_POPM-AI.png',
    APM:  'https://agile-agilist.com/wp-content/uploads/2025/08/APM.png',
    AIF:  'https://agile-agilist.com/wp-content/uploads/2025/12/ai_foundation_badge_2026.png'
  };

  // Map a course title / category to its credential badge. Order = most specific first.
  function pickBadge(text) {
    var t = (text || '').toUpperCase();
    if (/\bASPC\b|ADVANCED\s+SAFE\s+PRACTICE|ADVANCED\s+PRACTICE\s+CONSULTANT/.test(t)) return BADGES.SPC;
    if (/\bSPC\b|IMPLEMENTING\s+SAFE|PRACTICE\s+CONSULTANT/.test(t)) return BADGES.SPC;
    if (/\bSASM\b|ADVANCED\s+SCRUM\s+MASTER/.test(t)) return BADGES.SASM;
    if (/\bSSM\b|SCRUM\s+MASTER/.test(t)) return BADGES.SSM;
    if (/\bPOPM\b|PRODUCT\s+OWNER|PRODUCT\s+MANAGER/.test(t)) return BADGES.POPM;
    if (/\bAPM\b|AGILE\s+PRODUCT\s+MANAGEMENT/.test(t)) return BADGES.APM;
    if (/\bSA\b|LEADING\s+SAFE|SAFE\s+AGILIST|\bAGILIST\b/.test(t)) return BADGES.SA;
    if (/AI[-\s]?NATIVE|FOUNDATION/.test(t)) return BADGES.AIF;
    return null;
  }

  function isEventPage() {
    if (/\/wp-event\//.test(location.pathname)) return true;
    return !!document.querySelector('.wpea_organizer, .single-wp_events, .single-wp_event');
  }

  // Break a container into {label, valueHTML} items using <strong> as delimiters.
  function parseItems(container) {
    var items = [];
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

    /* 2) Hide the "Leave a Comment / By … / date" post-meta line ----------- */
    document.querySelectorAll('.entry-meta, .ast-single-post-meta, .post-meta')
      .forEach(function (el) { el.style.display = 'none'; });
    var metaTxt = Array.prototype.find.call(
      document.querySelectorAll('.entry-header p, .entry-header div, .entry-header span, header p, header div'),
      function (e) {
        var tx = (e.textContent || '').trim();
        return /leave a comment/i.test(tx) && tx.length < 140 && !e.querySelector('h1');
      });
    if (metaTxt) (metaTxt.closest('.entry-meta') || metaTxt).style.display = 'none';

    /* Determine this event's certification (title + details text) ---------- */
    var titleEl = document.querySelector('h1.entry-title, .entry-header h1, .page-title, h1');
    var detailsEl = document.querySelector('.details');
    var certText = (titleEl ? titleEl.textContent : '') + ' ' + (detailsEl ? detailsEl.textContent : '') + ' ' + document.title;
    var badgeUrl = pickBadge(certText);

    /* 3) Rebuild Details horizontally -------------------------------------- */
    var regUrl = null;
    if (detailsEl && !detailsEl.querySelector('.aa-ev-details-grid')) {
      var items = parseItems(detailsEl);
      if (items.length) {
        var grid = document.createElement('div');
        grid.className = 'aa-ev-details-grid';
        items.forEach(function (it) {
          var isReg = /regist|eventbrite/i.test(it.label) || /eventbrite/i.test(it.html);
          var cell = document.createElement('div');
          cell.className = 'aa-ev-cell' + (isReg ? ' aa-ev-cell-reg' : '');
          if (isReg) {
            cell.innerHTML = it.html;
          } else {
            cell.innerHTML =
              '<span class="aa-ev-k">' + it.label + '</span>' +
              '<span class="aa-ev-v">' + it.html + '</span>';
          }
          grid.appendChild(cell);
        });
        detailsEl.innerHTML = '';
        detailsEl.appendChild(grid);
        detailsEl.classList.add('aa-ev-details');

        var regLink = detailsEl.querySelector('.aa-ev-cell-reg a[href]');
        if (regLink) {
          regUrl = regLink.href;
          regLink.classList.add('aa-ev-reg-inline');
          regLink.innerHTML = 'Register<span class="aa-ev-reg-arrow" aria-hidden="true">&#8594;</span>';
          regLink.setAttribute('target', '_blank');
          regLink.setAttribute('rel', 'noopener noreferrer');
        }
      }
    }
    if (!regUrl) {
      var any = document.querySelector('.details a[href*="eventbrite"], a[href*="eventbrite"]');
      if (any) regUrl = any.href;
    }

    /* 4 + 5) Top block: badge + prominent Register button ------------------ */
    if ((regUrl || badgeUrl) && !document.querySelector('.aa-ev-reg-top') && titleEl && titleEl.parentNode) {
      var wrap = document.createElement('div');
      wrap.className = 'aa-ev-reg-top';
      var html = '';
      if (badgeUrl) {
        html += '<img class="aa-ev-badge" src="' + badgeUrl + '" alt="SAFe credential badge" loading="lazy">';
      }
      html += '<div class="aa-ev-reg-cta">';
      if (regUrl) {
        html += '<a class="aa-ev-reg-btn" href="' + regUrl + '" target="_blank" rel="noopener noreferrer">' +
                'Register<span class="aa-ev-reg-arrow" aria-hidden="true">&#8594;</span></a>';
      }
      html += '<span class="aa-ev-reg-note">Online course &middot; earn a verifiable SAFe digital badge</span>';
      html += '</div>';
      wrap.innerHTML = html;
      titleEl.parentNode.insertBefore(wrap, titleEl.nextSibling);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
