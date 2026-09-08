/* ============================================================================
   AA — TRACK CALENDAR behaviour                          [aa_track_calendar]
   ----------------------------------------------------------------------------
   WPCode -> JavaScript Snippet, Site Wide Footer.

   PROGRESSIVE ENHANCEMENT, deliberately. Every month, every day cell and the
   register panel for the first available date are already in the HTML the
   server sent. Six months of dates are in the source whether or not this file
   runs -- which is the point, because those dates are what a crawler or an
   assistant comes for. This adds three things and nothing else:

     month nav      show one month's grid, hide the rest
     chip filter    dim the courses you did not ask for
     day click      repaint the register panel from window.AA_TC

   The filter DIMS rather than removes. Removing day chips reflows the grid
   under the pointer, so the cell you were about to click moves as you click.
   ========================================================================== */
(function () {
  var root = document.querySelector('[data-aatc]');
  if (!root || !window.AA_TC) { return; }

  var D      = window.AA_TC;
  var months = D.months || [];
  var idx    = 0;
  var filter = 'All';

  function q(sel, ctx) { return (ctx || root).querySelector(sel); }
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || root).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var label = q('[data-aatc-monthlabel]');
  var prev  = q('[data-aatc-prev]');
  var next  = q('[data-aatc-next]');
  var panel = q('[data-aatc-panel]');
  var selEl = q('[data-aatc-selday]');

  function monthName(mk) {
    var p = mk.split('-');
    return new Date(+p[0], +p[1] - 1, 1)
      .toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  function showMonth(i) {
    if (i < 0 || i >= months.length) { return; }
    idx = i;
    all('[data-aatc-month]').forEach(function (g) {
      g.hidden = (g.getAttribute('data-aatc-month') !== months[idx]);
    });
    all('[data-aatc-mob]').forEach(function (g) {
      g.hidden = (g.getAttribute('data-aatc-mob') !== months[idx]);
    });
    if (label) { label.textContent = monthName(months[idx]); }
    if (prev) { prev.disabled = (idx === 0); }
    if (next) { next.disabled = (idx === months.length - 1); }
  }

  function applyFilter() {
    all('.aat-day').forEach(function (d) {
      var codes = (d.getAttribute('data-aatc-codes') || '').split(',').filter(Boolean);
      var match = (filter === 'All') || codes.indexOf(filter) !== -1;
      d.classList.toggle('aat-day--dim', !match && codes.length > 0);
      all('[data-aatc-chip]', d).forEach(function (chip) {
        var on = (filter === 'All') || chip.getAttribute('data-aatc-chip') === filter;
        if (on) { chip.removeAttribute('data-aatc-hide'); }
        else { chip.setAttribute('data-aatc-hide', '1'); }
      });
    });
    all('.aat-calday').forEach(function (r) {
      var codes = all('.aat-calday__code', r).map(function (c) {
        return (c.textContent || '').trim().split(' ')[0];
      });
      r.style.display = (filter === 'All' || codes.indexOf(filter) !== -1) ? '' : 'none';
    });
  }

  function card(c) {
    var left = (c.left <= 6)
      ? ' &middot; ' + esc(String(D.labels.seatsLeft).replace('%d', c.left))
      : '';
    var where = [c.place, c.hours].filter(Boolean).join(' · ');
    return '<article class="aat-cohort"><div class="aat-cohort__top">'
      + '<span class="aat-badge" style="background:' + esc(c.tint) + ';color:' + esc(c.color)
      + ';border:1px solid ' + esc(c.bd) + '">' + esc(c.code) + '</span></div>'
      + '<h3>' + esc(c.name) + '</h3>'
      + '<div class="aat-cohort__when"><i>&#9679;</i><b>' + esc(c.range) + '</b>'
      + '<span>' + esc(where) + '</span></div>'
      + '<div class="aat-cohort__pay"><div>'
      + '<div class="aat-cohort__price">' + esc(c.price) + '</div>'
      + '<div class="aat-cohort__incl">' + esc(D.labels.incl) + left + '</div></div>'
      + '<a class="aat-cta" href="' + esc(c.url) + '">' + esc(D.labels.register)
      + ' <span class="aat-cta__arrow">&#10230;</span></a>'
      + '</div></article>';
  }

  function select(key) {
    var rows = D.days[key];
    if (!rows) { return; }
    all('[data-aatc-day]').forEach(function (b) {
      var on = b.getAttribute('data-aatc-day') === key;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.classList.toggle('aat-day--on', on && b.classList.contains('aat-day'));
      if (on && b.classList.contains('aat-day')) { b.classList.remove('aat-day--has'); }
      else if (b.classList.contains('aat-day') && !b.disabled) { b.classList.add('aat-day--has'); }
    });
    if (panel) { panel.innerHTML = rows.map(card).join(''); }
    if (selEl) {
      var p = key.split('-');
      selEl.textContent = new Date(+p[0], +p[1] - 1, +p[2])
        .toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    }
  }

  root.addEventListener('click', function (e) {
    var day = e.target.closest('[data-aatc-day]');
    if (day && !day.disabled) { select(day.getAttribute('data-aatc-day')); return; }

    var chip = e.target.closest('[data-aatc-code]');
    if (chip) {
      filter = chip.getAttribute('data-aatc-code');
      all('[data-aatc-code]').forEach(function (c) {
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });
      applyFilter();
      return;
    }

    if (e.target.closest('[data-aatc-prev]')) { showMonth(idx - 1); return; }
    if (e.target.closest('[data-aatc-next]')) { showMonth(idx + 1); }
  });

  showMonth(0);
})();
