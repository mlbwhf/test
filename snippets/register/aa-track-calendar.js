/* ============================================================================
   AA — TRACK CALENDAR behaviour                          [aa_track_calendar]
   ----------------------------------------------------------------------------
   WPCode -> JavaScript Snippet, Site Wide Footer.

   PROGRESSIVE ENHANCEMENT, deliberately. Every month, every cohort bar and the
   register panel for the first cohort are already in the HTML the server sent.
   Three months of dates are in the source whether or not this file runs --
   which is the point, because those dates are what a crawler or an assistant
   comes for. Three rather than six because six was 1,386 bars on a
   seven-course track and the hosting provider noticed. Every bar is a real <a> to that cohort's enrolment, so with scripts off
   the calendar is still a working index of the whole schedule.

   This adds four things and nothing else:

     month nav      show one month, hide the rest
     chip filter    dim the courses you did not ask for
     week expand    open a week capped at five lanes
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

  /* The rest of this course's schedule, right where the decision is made. One
     cohort is an answer; it is not a schedule, and a visitor for whom this date
     does not work should not have to go back and hunt the grid for the next. */
  function dates(c) {
    var list = (D.dates && D.dates[c.code]) || [];
    var out = '', n = 0;
    for (var i = 0; i < list.length && n < 6; i++) {
      if (list[i].id === c.id) { continue; }
      n++;
      out += '<button type="button" class="aat-dateopt" data-aatc-co="'
           + esc(list[i].id) + '">' + esc(list[i].label) + '</button>';
    }
    if (!out) { return ''; }
    return '<div class="aat-co__dates"><p class="aat-co__dateslabel">'
      + esc(D.labels.otherDates) + '</p><div class="aat-co__datelist">' + out + '</div></div>';
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
      + dates(c)
      + '<div class="aat-co__pay"><div class="aat-co__price">' + esc(c.price) + '</div>'
      + '<div class="aat-co__incl">' + esc(D.labels.incl) + seats + '</div></div>'
      + form(c)
      + (c.url
          ? '<a class="aat-co__more" href="' + esc(c.url) + '">' + esc(D.labels.details) + ' &#10230;</a>'
          : '')
      + '</article>';
  }

  /* One cohort record, merged with its course's.
     The payload stores the ten fields that belong to a COURSE once per course
     rather than once per cohort -- 283 copies of the same blurb, proof list and
     URL was a third of the page. This puts the two halves back together. */
  function cohort(id) {
    var c = cohorts[id];
    if (!c) { return null; }
    var m = (D.courses && D.courses[c.code]) || {};
    var o = { id: id }, k;
    for (k in m) { if (Object.prototype.hasOwnProperty.call(m, k)) { o[k] = m[k]; } }
    for (k in c) { if (Object.prototype.hasOwnProperty.call(c, k)) { o[k] = c[k]; } }
    return o;
  }

  function select(id) {
    var c = cohort(id);
    if (!c) { return; }
    all('[data-aatc-co]').forEach(function (el) {
      var on = el.getAttribute('data-aatc-co') === id;
      el.classList.toggle('aat-bar--on', on && el.classList.contains('aat-bar'));
      if (el.classList.contains('aat-calday')) {
        el.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    });
    if (!panel) { return; }
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

/* ============================================================================
   AA — TRACK LANDING HERO picker                      [aa_training_category]
   ----------------------------------------------------------------------------
   The hero card used to offer one date for the chosen certification and a link
   to go and pick it again on the course page. It offers several now and takes
   the money itself, which is the same shape the home page and the course pages
   already use.

   Every course's dates are already in the HTML with all but one hidden, so the
   whole set is in the page for a crawler; this only switches which block shows
   and points the in-place form at whichever date is chosen.
   ========================================================================== */
(function () {
  var card = document.querySelector('[data-aah]');
  if (!card) { return; }

  var sel  = card.querySelector('[data-aah-course]');
  var form = card.querySelector('[data-aa-inline]');

  function blocks() {
    return Array.prototype.slice.call(card.querySelectorAll('[data-aah-dates]'));
  }

  function point(btn) {
    if (!btn || !form) { return; }
    blocks().forEach(function (b) {
      Array.prototype.forEach.call(b.querySelectorAll('[data-aah-pick]'), function (o) {
        var on = (o === btn);
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });
    if (window.AA_REG_RETARGET) {
      window.AA_REG_RETARGET(form, {
        cohort: btn.getAttribute('data-aah-pick'),
        price: parseInt(btn.getAttribute('data-price'), 10) || 0
      }, true);
    }
  }

  if (sel) {
    sel.addEventListener('change', function () {
      var want = sel.value, first = null;
      blocks().forEach(function (b) {
        var on = (b.getAttribute('data-aah-dates') === want);
        b.hidden = !on;
        if (on && !first) { first = b.querySelector('[data-aah-pick]'); }
      });
      /* A course change is a new schedule, so the form must follow it to that
         course's first date -- leaving it on the old cohort would charge for a
         course the card is no longer showing. */
      point(first);
    });
  }

  card.addEventListener('click', function (e) {
    var pick = e.target.closest('[data-aah-pick]');
    if (pick) { point(pick); }
  });
})();


/* ============================================================================
   AA — SALARY INSIGHTS behaviour                        [aa_salary_insights]
   ----------------------------------------------------------------------------
   WPCode -> JavaScript Snippet, Site Wide Footer.

   PROGRESSIVE ENHANCEMENT, like the calendar. The server already sent every
   band, every figure, every path and every step chip. Without this file the
   block is a complete salary table with three career ladders written out
   underneath it -- which is the version a crawler and an assistant read, and
   the only reason publishing the figures is worth anything.

   This adds one thing: choosing a path redraws the chart as that ladder, in
   order, with the lift between consecutive steps. It moves bars that are
   already on the page. It never invents a row.
   ========================================================================== */
(function () {
  var root = document.querySelector('[data-aas]');
  if (!root) { return; }

  var bandsBox = root.querySelector('[data-aas-bands]');
  var titleEl  = root.querySelector('[data-aas-title]');
  var subEl    = root.querySelector('[data-aas-sub]');
  var resetEl  = root.querySelector('[data-aas-reset]');
  var scaleEl  = root.querySelector('[data-aas-scale]');
  if (!bandsBox) { return; }

  var SCALE = scaleEl ? parseInt(scaleEl.getAttribute('data-aas-scale'), 10) : 0;
  if (!SCALE) { return; }

  var bands = Array.prototype.slice.call(bandsBox.querySelectorAll('[data-aas-band]'));
  var paths = Array.prototype.slice.call(root.querySelectorAll('[data-aas-path]'));

  /* The server's own numbers, read back off the elements rather than shipped a
     second time as a script payload. One copy of the data, in the markup. */
  var ALL = bands.map(function (el) {
    return {
      el:     el,
      code:   el.getAttribute('data-aas-band'),
      median: parseInt(el.getAttribute('data-median'), 10) || 0,
      lo:     parseInt(el.getAttribute('data-lo'), 10) || 0,
      hi:     parseInt(el.getAttribute('data-hi'), 10) || 0
    };
  });

  var LADDERS = {};
  Array.prototype.forEach.call(root.querySelectorAll('[data-aas-ladder]'), function (s) {
    try { LADDERS[s.getAttribute('data-aas-ladder')] = JSON.parse(s.textContent); }
    catch (e) { /* a malformed ladder simply has no interactive view */ }
  });

  function pct(v) { return (v / SCALE) * 100; }
  function money(k) { return '$' + Math.round(k).toLocaleString() + 'K'; }

  function paint(row, left, width, markAt) {
    var bar  = row.el.querySelector('[data-aas-bar]');
    var mark = row.el.querySelector('[data-aas-mark]');
    if (bar)  { bar.style.left = left + '%'; bar.style.width = width + '%'; }
    if (mark) { mark.style.left = markAt + '%'; }
  }

  /* Every credential, low to high, no step numbers. The state the page loads in
     and the state "Show all" returns to. */
  function showAll() {
    bandsBox.classList.add('aas__bands--all');
    ALL.forEach(function (r, i) {
      r.el.removeAttribute('data-aas-off');
      r.el.style.order = '';
      var step = r.el.querySelector('[data-aas-step]');
      if (step) { step.textContent = String(i + 1); }
      paint(r, pct(r.lo), pct(r.hi) - pct(r.lo), pct(r.median));
      var med = r.el.querySelector('[data-aas-median]');
      var sub = r.el.querySelector('[data-aas-subfig]');
      if (med) { med.textContent = money(r.median); }
      if (sub) {
        sub.textContent = money(r.lo) + '–' + money(r.hi);
        sub.classList.remove('aas__sub--delta');
      }
    });
    if (titleEl) { titleEl.textContent = 'All credentials'; }
    if (subEl)   { subEl.textContent = ALL.length + ' roles · median and range'; }
    if (resetEl) { resetEl.hidden = true; }
    paths.forEach(function (p) { p.setAttribute('aria-pressed', 'false'); });
  }

  /* One ladder. Bars run from zero to the median so the chart reads as a
     climb rather than as eight independent ranges, and the sub-figure becomes
     the step-up from the credential before it. */
  function showPath(key) {
    var L = LADDERS[key];
    if (!L || !L.steps || L.steps.length < 2) { return; }

    bandsBox.classList.remove('aas__bands--all');

    var order = {};
    L.steps.forEach(function (s, i) { order[s.code] = i; });

    ALL.forEach(function (r) {
      var i = order[r.code];

      if (i === undefined) {
        /* Not on this ladder. Dimmed and pushed below, never removed -- the
           row keeps its place in the DOM so nothing reflows under the cursor. */
        r.el.setAttribute('data-aas-off', '1');
        r.el.style.order = '99';
        return;
      }

      r.el.removeAttribute('data-aas-off');
      r.el.style.order = String(i);

      var step = r.el.querySelector('[data-aas-step]');
      if (step) { step.textContent = String(i + 1); }

      var m = L.steps[i].median;
      paint(r, 0, pct(m), pct(m));

      var med = r.el.querySelector('[data-aas-median]');
      var sub = r.el.querySelector('[data-aas-subfig]');
      if (med) { med.textContent = money(m); }
      if (sub) {
        var delta = i > 0 ? m - L.steps[i - 1].median : 0;
        if (delta > 0) {
          sub.textContent = '+' + money(delta) + ' on the step before';
          sub.classList.add('aas__sub--delta');
        } else {
          sub.textContent = 'Starting point';
          sub.classList.remove('aas__sub--delta');
        }
      }
    });

    /* A ladder step with no band row of its own -- SASM, the AI-Native codes --
       has nothing to move here. Its figure is already in the path card's chip,
       which is why the chips carry the money and not just the code. */

    if (titleEl) { titleEl.textContent = L.label; }
    if (subEl)   { subEl.textContent = L.steps.length + ' steps · median at each'; }
    if (resetEl) { resetEl.hidden = false; }

    paths.forEach(function (p) {
      p.setAttribute('aria-pressed', p.getAttribute('data-aas-path') === key ? 'true' : 'false');
    });
  }

  root.addEventListener('click', function (e) {
    if (e.target.closest('[data-aas-reset]')) { showAll(); return; }

    var p = e.target.closest('[data-aas-path]');
    if (!p) { return; }
    var key = p.getAttribute('data-aas-path');
    /* Clicking the chosen path again is a way back out, so the control does not
       become a one-way door on touch, where there is no hover to hint at it. */
    if (p.getAttribute('aria-pressed') === 'true') { showAll(); }
    else { showPath(key); }
  });

  showAll();
})();
