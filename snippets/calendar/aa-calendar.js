/* Course calendar. One instance per .aa-mcal; config arrives as inline JSON so
   nothing is fetched. Bars are buttons: hover AND keyboard focus both raise the
   preview, click selects, and the panel is aria-live so a screen reader hears
   the change. */
(function () {
  'use strict';
  var MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function boot(root) {
    if (root.getAttribute('data-mcal-ready')) { return; }
    root.setAttribute('data-mcal-ready', '1');
    var tag = root.querySelector('script[type="application/json"]');
    if (!tag) { return; }
    var cfg;
    try { cfg = JSON.parse(tag.textContent); } catch (e) { return; }

    var S = cfg.str, C = cfg.courses;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    // Local parsing: new Date("2026-09-22") is UTC and shifts bars a day west.
    function d(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
    var ev = cfg.events.map(function (r, i) {
      var s = d(r.s), e = d(r.e);
      return { i: i, s: s, e: e, c: r.c, id: r.id, seats: r.seats,
               price: r.price, hours: r.hours, instructor: r.instructor,
               days: Math.round((e - s) / 86400000) + 1, past: e < today };
    });
    function meta(o) { return C[o.c] || { code: o.c.toUpperCase(), name: o.c.toUpperCase(),
      track: '', color: '#0E8074', tint: '#E7F2F0', tint_border: '#C6E1DC', url: '/training/' }; }

    var view = new Date(today.getFullYear(), today.getMonth(), 1);
    var last = new Date(today.getFullYear(), today.getMonth() + (cfg.months - 1), 1);
    var sel = null, hov = null;
    // Open on the soonest upcoming cohort so the panel is never empty on load.
    for (var k = 0; k < ev.length; k++) { if (!ev[k].past) { sel = ev[k].i; break; } }
    if (sel === null && ev.length) { sel = ev[0].i; }
    // ...and open the GRID on that cohort's month, not on today's. A course
    // page whose next class is two months out would otherwise load showing an
    // empty current month while the panel described a cohort not on screen.
    if (sel !== null) { view = new Date(ev[sel].s.getFullYear(), ev[sel].s.getMonth(), 1); }
    // The forward bound has to cover the cohorts actually loaded, or the last
    // one is unreachable when it sits past the months= window.
    ev.forEach(function (o) {
      var m = new Date(o.e.getFullYear(), o.e.getMonth(), 1);
      if (m > last) { last = m; }
    });

    /* Spanish and French put the day before the month — "17–19 sept. 2026",
       not "sept. 17–19, 2026" — and drop the comma before the year. Same
       day_first switch the cohort shortcode uses, so both read alike. */
    function fmtRange(o) {
      var M = S.mon_short, a = o.s, b = o.e, y = b.getFullYear();
      if (S.day_first) {
        if (a.getMonth() === b.getMonth()) {
          return a.getDate() + '–' + b.getDate() + ' ' + M[b.getMonth()] + ' ' + y;
        }
        return a.getDate() + ' ' + M[a.getMonth()] + ' – ' + b.getDate() + ' ' + M[b.getMonth()] + ' ' + y;
      }
      if (a.getMonth() === b.getMonth()) {
        return M[a.getMonth()] + ' ' + a.getDate() + '–' + b.getDate() + ', ' + y;
      }
      return M[a.getMonth()] + ' ' + a.getDate() + ' – ' + M[b.getMonth()] + ' ' + b.getDate() + ', ' + y;
    }
    /* The price meta may be "2899", "2,899", "$2,899" or "USD 2899" — editors
       type all four. A bare number gets grouped and a $ prefix; anything that
       already carries a symbol or separator is left exactly as entered, since
       the editor clearly meant that formatting. Grouping uses the PAGE's
       language, not the visitor's: "2 899" is right on /fr/ and wrong on /. */
    function money(v) {
      var s = String(v).trim();
      if (/^\d+(\.\d+)?$/.test(s)) {
        try { return '$' + Number(s).toLocaleString(cfg.lang || 'en'); }
        catch (e) { return '$' + s; }
      }
      return s;
    }
    function seatsLabel(o) {
      if (typeof o.seats !== 'number') { return null; }
      return o.seats <= 6 ? S.seats_left.replace('%d', o.seats) : S.seats.replace('%d', o.seats);
    }
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }

    /* Where "Register" goes. Never a second registration path: on a page that
       already carries the enrol form we scroll to it and pre-select the cohort
       through the same AA_PICK bridge the cohort cards use; everywhere else we
       deep-link the course page's enrol section with ?cohort=<event id>, which
       is what the form's populator reads. */
    function regHref(o) {
      var m = meta(o);
      if (cfg.link === 'enroll') { return '#enroll'; }
      return m.url + (m.url.indexOf('?') < 0 ? '?' : '&') + 'cohort=' + o.id + '#enroll';
    }

    function weeksOf(y, mo) {
      var first = new Date(y, mo, 1), dim = new Date(y, mo + 1, 0).getDate();
      var gridStart = new Date(y, mo, 1 - first.getDay());
      var n = Math.ceil((first.getDay() + dim) / 7), DAY = 86400000, out = [];
      for (var w = 0; w < n; w++) {
        var ws = new Date(gridStart.getTime() + w * 7 * DAY);
        var we = new Date(ws.getTime() + 6 * DAY);
        var days = [];
        for (var i = 0; i < 7; i++) {
          var dt = new Date(ws.getTime() + i * DAY);
          days.push({ num: dt.getDate(), out: dt.getMonth() !== mo, today: +dt === +today });
        }
        // Greedy first-fit lane packing, clipped to this week, so a class that
        // crosses a Saturday renders as one bar per week row and nothing overlaps.
        var lanes = [], bars = [];
        ev.filter(function (o) { return o.e >= ws && o.s <= we; })
          .sort(function (p, q) { return p.s - q.s; })
          .forEach(function (o) {
            var c0 = Math.max(0, Math.round((o.s - ws) / DAY));
            var c1 = Math.min(6, Math.round((o.e - ws) / DAY));
            var lane = 0;
            while (lanes[lane] !== undefined && lanes[lane] >= c0) { lane++; }
            lanes[lane] = c1;
            bars.push({ o: o, col: c0 + 1, span: c1 - c0 + 1, lane: lane + 1 });
          });
        out.push({ days: days, bars: bars });
      }
      return out;
    }

    /* Courses that run on a weekly cadence — RTE starts Monday, Wednesday and
       Friday every week — put three bars in one week that are identical down
       to the pixel: same code, same colour, same course name, same 3d chip.
       Nothing on the face of them says which is which. When a course appears
       more than once in the visible month its bars carry the DATE RANGE in
       place of the name, which is the only field that actually differs. A
       course appearing once keeps its name, which is more useful there. */
    var repeats = {};

    function barHTML(b) {
      var o = b.o, m = meta(o), tight = b.span === 1;
      var label = repeats[m.code] > 1 ? fmtRange(o) : m.name;
      var sl = seatsLabel(o);
      var aria = m.name + ', ' + fmtRange(o) + ', ' + S.days_n.replace('%d', o.days) + (sl ? ', ' + sl : '');
      var pv =
        '<span class="aa-mcal-pv" aria-hidden="true">' +
          (m.track ? '<span class="aa-mcal-pv__track">' + esc(m.track) + '</span>' : '') +
          '<div class="aa-mcal-pv__name">' + esc(m.name) + '</div>' +
          '<div class="aa-mcal-pv__when">' + esc(fmtRange(o)) + ' · ' + esc(S.days_n.replace('%d', o.days)) +
            (o.hours ? '<br>' + esc(o.hours) : '') + '</div>' +
          '<div class="aa-mcal-pv__hr"></div>' +
          '<div class="aa-mcal-pv__row">' +
            (o.price ? '<span class="aa-mcal-pv__price">' + esc(money(o.price)) + '</span>' : '<span></span>') +
            (sl ? '<span class="aa-mcal-pill' + (o.seats <= 6 ? ' is-low' : '') + '">' + esc(sl) + '</span>' : '') +
          '</div>' +
          '<div class="aa-mcal-pv__go">' + esc(S.click_open) + '</div>' +
        '</span>';
      return '<span class="aa-mcal-slot" style="grid-column:' + b.col + ' / span ' + b.span +
        ';grid-row:' + b.lane + '">' +
        '<button type="button" class="aa-mcal-bar' + (o.i === sel ? ' is-sel' : '') +
          (tight ? ' is-tight' : '') + (o.past ? ' is-gone' : '') +
          '" data-i="' + o.i + '" aria-label="' + esc(aria) + '"' +
          ' style="--c:' + m.color + ';--tint:' + m.tint + ';--tb:' + m.tint_border + '">' +
          '<b>' + esc(m.code) + '</b><span class="n">' + esc(label) + '</span>' +
          '<i class="d">' + o.days + 'd</i>' +
        '</button>' + pv + '</span>';
    }

    function renderCal() {
      var y = view.getFullYear(), mo = view.getMonth();
      var weeks = weeksOf(y, mo);
      var inMonth = ev.filter(function (o) {
        return o.e >= new Date(y, mo, 1) && o.s <= new Date(y, mo + 1, 0);
      });
      repeats = {};
      inMonth.forEach(function (o) {
        var c = meta(o).code;
        repeats[c] = (repeats[c] || 0) + 1;
      });

      var h = '<div class="aa-mcal-head"><div>' +
        '<span class="aa-mcal-eyebrow">' + esc(S.eyebrow) + '</span>' +
        '<h3 class="aa-mcal-title">' + esc((S.months[mo] || MON[mo]) + ' ' + y) + '</h3></div>' +
        '<div class="aa-mcal-nav">' +
          '<button type="button" data-nav="-1" aria-label="' + esc(S.prev) + '"' +
            (view <= new Date(today.getFullYear(), today.getMonth(), 1) ? ' disabled' : '') + '>&lsaquo;</button>' +
          '<button type="button" data-nav="1" aria-label="' + esc(S.next) + '"' +
            (view >= last ? ' disabled' : '') + '>&rsaquo;</button>' +
        '</div></div>';

      h += '<div class="aa-mcal-dows">';
      S.dow_long.forEach(function (n) { h += '<span>' + esc(n) + '</span>'; });
      h += '</div><div class="aa-mcal-weeks">';
      weeks.forEach(function (w) {
        h += '<div class="aa-mcal-week"><div class="aa-mcal-nums">';
        w.days.forEach(function (dd) {
          h += '<span class="' + (dd.out ? 'is-out' : '') + '">' + dd.num + '</span>';
        });
        h += '</div>';
        if (w.bars.length) {
          h += '<div class="aa-mcal-bars">' + w.bars.map(barHTML).join('') + '</div>';
        }
        h += '</div>';
      });
      h += '</div>';

      // Under ~720px the month grid is hidden by CSS and this list shows instead.
      h += '<div class="aa-mcal-agenda">';
      inMonth.forEach(function (o) {
        var m = meta(o), sl = seatsLabel(o);
        h += '<button type="button" class="aa-mcal-arow' + (o.i === sel ? ' is-sel' : '') +
          '" data-i="' + o.i + '" style="--c:' + m.color + '">' +
          '<i></i><span class="t"><b>' + esc(m.code + ' · ' + m.name) + '</b>' +
          '<span>' + esc(fmtRange(o) + ' · ' + S.days_n.replace('%d', o.days)) + '</span></span>' +
          (sl ? '<span class="aa-mcal-pill' + (o.seats <= 6 ? ' is-low' : '') + '">' + esc(sl) + '</span>' : '') +
          '</button>';
      });
      h += '</div>';

      if (!inMonth.length) { h += '<div class="aa-mcal-empty">' + esc(S.empty) + '</div>'; }

      var seen = {}, leg = '';
      inMonth.forEach(function (o) {
        var m = meta(o);
        if (seen[m.track || m.code]) { return; }
        seen[m.track || m.code] = 1;
        leg += '<span class="aa-mcal-key" style="--c:' + m.color + '"><i></i>' + esc(m.track || m.code) + '</span>';
      });
      if (leg) { h += '<div class="aa-mcal-legend">' + leg + '</div>'; }
      root.querySelector('.aa-mcal__cal').innerHTML = h;
    }

    function renderPanel() {
      var el = root.querySelector('.aa-mcal__panel');
      if (sel === null) {
        el.innerHTML = '<p class="aa-mcal-hint">' + esc(S.pick_hint) + '</p>';
        return;
      }
      var o = ev[sel], m = meta(o), sl = seatsLabel(o);
      var facts = [
        [S.f_dates, fmtRange(o), false],
        [S.f_schedule, S.days_n.replace('%d', o.days) + (o.hours ? ' · ' + o.hours : ''), false]
      ];
      // Only facts we actually hold. An unpopulated instructor or seat count is
      // omitted, never rendered as "TBC".
      if (o.instructor) { facts.push([S.f_instructor, o.instructor, false]); }
      else if (m.pdus)  { facts.push([S.f_pdus, m.pdus, false]); }
      if (sl) { facts.push([S.f_seats, sl, o.seats <= 6]); }

      /* "What's included" is assembled here, not shipped as a ready-made
         array from PHP: the array duplicated duration and pdus that the row
         already carries, and its connecting words were hardcoded English, so
         the Spanish and French panels printed English bullets. */
      var bullets = [];
      if (m.days)  { bullets.push(S.b_live.replace('%d', m.days)); }
      bullets.push(S.b_exam);
      if (m.pdus)  { bullets.push(S.b_pdus.replace('%d', m.pdus)); }
      if (m.exam_q && m.exam_m) {
        bullets.push(S.b_examfmt.replace('%q', m.exam_q).replace('%m', m.exam_m));
      }

      var h = '<div class="aa-mcal-sel"><i></i>' + esc(S.selected) + '</div>' +
        '<div class="aa-mcal-rule" style="--c:' + m.color + '"></div>' +
        (m.track ? '<div class="aa-mcal-track">' + esc(m.track) + '</div>' : '') +
        '<h4 class="aa-mcal-name">' + esc(m.name) + '</h4>' +
        (m.desc ? '<p class="aa-mcal-desc">' + esc(m.desc) + '</p>' : '') +
        '<dl class="aa-mcal-facts">' + facts.map(function (f) {
          return '<div class="aa-mcal-fact"><dt>' + esc(f[0]) + '</dt>' +
            '<dd' + (f[2] ? ' class="is-low"' : '') + '>' + esc(f[1]) + '</dd></div>';
        }).join('') + '</dl>' +
        '<ul class="aa-mcal-inc">' +
          bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>';

      h += '<div class="aa-mcal-reg">' +
        (o.price ? '<div class="aa-mcal-price">' + esc(money(o.price)) +
          '<small>' + esc(S.exam_incl) + '</small></div>' : '') +
        '<a class="aa-mcal-cta" href="' + esc(regHref(o)) + '" data-reg="' + o.i + '">' +
          esc(S.register) + '</a>' +
        '<p class="aa-mcal-note">' + esc(S.reassure) + '</p>' +
        '<a class="aa-mcal-more" href="' + esc(m.url) + '">' + esc(S.course_page) + '</a>' +
        '</div>';
      el.innerHTML = h;
    }

    function render() { renderCal(); renderPanel(); }

    /* Keep the preview inside the viewport. The prototype did not flip; the
       handoff asks production to, and without it a bar in the last column or
       bottom week opens its card off-screen. */
    function place(slot) {
      var pv = slot.querySelector('.aa-mcal-pv');
      if (!pv) { return; }
      pv.classList.remove('flip-x', 'flip-y');
      var r = pv.getBoundingClientRect();
      if (r.right > window.innerWidth - 8) { pv.classList.add('flip-x'); }
      if (r.bottom > window.innerHeight - 8) { pv.classList.add('flip-y'); }
    }

    root.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-nav]');
      if (nav) {
        view = new Date(view.getFullYear(), view.getMonth() + (+nav.getAttribute('data-nav')), 1);
        render();
        return;
      }
      var reg = e.target.closest('[data-reg]');
      if (reg && cfg.link === 'enroll') {
        // Same page: hand the cohort to the registration rather than navigating.
        e.preventDefault();
        var o = ev[+reg.getAttribute('data-reg')];

        /* Two registrations can be below us, and which one is present depends
           on whether the new block is switched on.

           The new one keys on the START DATE, not on the id: its batches are
           generated from a cadence and carry ids like "spc-2026-09-03", while
           a calendar bar carries a wp_events post id. The two id spaces have
           nothing in common, so matching on id would silently never match.
           The date is the one thing both sides agree on.

           AA_PICK is the older enrol form's bridge and stays as the fallback,
           so a page that has not switched over still works. */
        var handled = false;
        try {
          document.dispatchEvent(new CustomEvent('aa:cohort-select', {
            detail: { start: o.s, end: o.e, cohort: o.id, source: 'calendar' }
          }));
          handled = !!document.getElementById('aacal');
        } catch (err) {}

        if (!handled && typeof window.AA_PICK === 'function') {
          try { window.AA_PICK(fmtRange(o), o.id); } catch (err2) {}
        }

        // Scroll to whichever is actually on the page.
        var target = document.getElementById('aacal') || document.getElementById('enroll');
        if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        return;
      }
      var bar = e.target.closest('[data-i]');
      if (bar) {
        sel = +bar.getAttribute('data-i');
        hov = null;
        render();
        if (window.matchMedia && window.matchMedia('(max-width:1023px)').matches) {
          root.querySelector('.aa-mcal__panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });

    // Hover and focus must behave identically — the bars are buttons and a
    // keyboard user has to get the same preview a mouse user gets.
    function show(e) {
      var b = e.target.closest('.aa-mcal-bar');
      if (!b) { return; }
      var slot = b.parentNode;
      slot.classList.add('is-hov');
      place(slot);
    }
    function hide(e) {
      var b = e.target.closest('.aa-mcal-bar');
      if (b) { b.parentNode.classList.remove('is-hov'); }
    }
    root.addEventListener('mouseover', show);
    root.addEventListener('mouseout', hide);
    root.addEventListener('focusin', show);
    root.addEventListener('focusout', hide);

    render();
  }

  function init() {
    [].forEach.call(document.querySelectorAll('.aa-mcal'), boot);
  }
  if (document.readyState !== 'loading') { init(); }
  else { document.addEventListener('DOMContentLoaded', init); }
})();
