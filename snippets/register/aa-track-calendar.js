/* ============================================================================
   AA — TRACK CALENDAR behaviour                          [aa_track_calendar]
   ----------------------------------------------------------------------------
   WPCode -> JavaScript Snippet, Site Wide Footer.

   PROGRESSIVE ENHANCEMENT, deliberately. Every month, every cohort bar and the
   register panel for the first cohort are already in the HTML the server sent.
   Six months of dates are in the source whether or not this file runs -- which
   is the point, because those dates are what a crawler or an assistant comes
   for. Every bar is a real <a> to that cohort's enrolment, so with scripts off
   the calendar is still a working index of the whole schedule.

   This adds three things and nothing else:

     month nav      show one month, hide the rest
     chip filter    dim the courses you did not ask for
     bar click      repaint the panel instead of navigating

   The filter DIMS rather than removes. Removing bars reflows the week under
   the pointer, so the bar you were about to click moves as you click.
   ========================================================================== */
(function () {
  var root = document.querySelector('[data-aatc]');
  if (!root || !window.AA_TC) { return; }

  var D       = window.AA_TC;
  var months  = D.months || [];
  var cohorts = D.cohorts || {};
  var idx     = 0;
  var filter  = 'All';

  function q(sel) { return root.querySelector(sel); }
  function all(sel, ctx) { return Array.prototype.slice.call((ctx || root).querySelectorAll(sel)); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var label = q('[data-aatc-monthlabel]');
  var prev  = q('[data-aatc-prev]');
  var next  = q('[data-aatc-next]');
  var panel = q('[data-aatc-panel]');

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
    /* A capped week hides its sixth lane onward. Asking for one certification
       is a request to see it wherever it falls, so a filter opens them all. */
    root.classList.toggle('is-filtered', filter !== 'All');
    all('[data-aatc-c]').forEach(function (el) {
      var on = (filter === 'All') || el.getAttribute('data-aatc-c') === filter;
      if (el.classList.contains('aat-calday')) {
        el.style.display = on ? '' : 'none';
      } else if (on) {
        el.removeAttribute('data-aatc-hide');
      } else {
        el.setAttribute('data-aatc-hide', '1');
      }
    });
  }

  /* The card, kept in step with aa_reg_track_panel() on the server -- including
     the in-place checkout form, which is the whole point of the panel: the
     purchase happens here, on whatever page the calendar is on, for whichever
     of the track's courses is selected. The form posts a cohort id and the
     server resolves it, so one form sells seven courses -- and sells a course
     that has no page of its own to send anyone to. */
  function form(c) {
    var live = D.live;
    return '<form class="aareg-inline aatco-inline" data-aa-inline data-aa-inline-fixed novalidate'
      + ' data-cohort="' + esc(c.id) + '" data-price="' + esc(c.raw) + '"'
      + ' data-seats-left="' + esc(c.left) + '">'
      + '<label class="aareg-inline-field"><span class="aacal-sr">' + esc(D.labels.email) + '</span>'
      + '<input name="email" type="email" autocomplete="email" inputmode="email"'
      + ' placeholder="' + esc(D.labels.email) + '" required></label>'
      + '<div class="aareg-inline-row"><div class="aareg-inline-stepper">'
      + '<button type="button" data-inline-seats="-1" aria-label="Fewer seats">&minus;</button>'
      + '<span data-inline-seats-value aria-live="polite">1</span>'
      + '<button type="button" data-inline-seats="1" aria-label="More seats">+</button></div>'
      + '<p class="aareg-inline-total" data-inline-total>' + esc(c.price) + '</p></div>'
      + '<button type="submit" class="aareg-inline-pay" data-inline-pay' + (live ? '' : ' disabled') + '>'
      + esc(live ? D.labels.pay : D.labels.payOff) + '</button>'
      + '<p class="aareg-inline-note" data-inline-note>'
      + esc(live ? D.labels.payNote : D.labels.payOffNote) + '</p></form>';
  }

  function card(c) {
    var seats = (c.left <= 6)
      ? ' &middot; ' + esc(String(D.labels.seatsLeft).replace('%d', c.left))
      : '';
    var where = [c.place, c.hours].filter(Boolean).join(' · ');
    return '<article class="aat-co" style="--bar:' + esc(c.color) + '">'
      + '<p class="aat-co__eyebrow">' + esc(D.label || c.code) + '</p>'
      + '<h3 class="aat-co__h">' + esc(c.name) + '</h3>'
      + (c.blurb ? '<p class="aat-co__blurb">' + esc(c.blurb) + '</p>' : '')
      + '<dl class="aat-co__facts">'
      + '<div><dt>' + esc(D.labels.dates) + '</dt><dd>' + esc(c.range) + '</dd></div>'
      + '<div><dt>' + esc(D.labels.schedule) + '</dt><dd>' + esc(c.days) + ' ' + esc(D.labels.daysL) + '</dd></div>'
      + (where ? '<div class="aat-co__facts-wide"><dt>Format</dt><dd>' + esc(where) + '</dd></div>' : '')
      + '</dl>'
      + ((c.proof && c.proof.length)
          ? '<ul class="aat-co__proof">' + c.proof.map(function (p) {
              return '<li>' + esc(p) + '</li>';
            }).join('') + '</ul>'
          : '')
      + '<div class="aat-co__pay"><div class="aat-co__price">' + esc(c.price) + '</div>'
      + '<div class="aat-co__incl">' + esc(D.labels.incl) + seats + '</div></div>'
      + form(c)
      + (c.url
          ? '<a class="aat-co__more" href="' + esc(c.url) + '">' + esc(D.labels.details) + ' &#10230;</a>'
          : '')
      + '</article>';
  }

  function select(id) {
    var c = cohorts[id];
    if (!c) { return; }
    all('[data-aatc-co]').forEach(function (el) {
      var on = el.getAttribute('data-aatc-co') === id;
      el.classList.toggle('aat-bar--on', on && el.classList.contains('aat-bar'));
      if (el.classList.contains('aat-calday')) {
        el.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    });
    if (!panel) { return; }
    /* The payload is keyed by cohort id, so the card needs the key put back on
       the record before it can name itself in the form. */
    c.id = id;
    panel.innerHTML = card(c);
    /* The in-place checkout paints its total from the form's own attributes.
       `true` marks this as the owning component talking about its own form, so
       the retarget is not refused by data-aa-inline-fixed. */
    var f = panel.querySelector('[data-aa-inline]');
    if (f && window.AA_REG_RETARGET) {
      window.AA_REG_RETARGET(f, { cohort: id, price: c.raw }, true);
    }
  }

  root.addEventListener('click', function (e) {
    var co = e.target.closest('[data-aatc-co]');
    if (co) {
      /* The bar is a real link so it works without this file. With it, the
         click selects instead -- the panel's own button is what navigates. */
      e.preventDefault();
      select(co.getAttribute('data-aatc-co'));
      return;
    }

    var more = e.target.closest('[data-aatc-more]');
    if (more) {
      var week = more.closest('.aat-week');
      var open = week.classList.toggle('is-open');
      more.setAttribute('aria-expanded', open ? 'true' : 'false');
      return;
    }

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
