/* Agile Agilist — home page redesign behavior. Vanilla JS, no dependencies.
   Handles: rotating spotlights (cohorts, tracks, assessments, layers, quotes),
   assessment report panel swap, score-bar fills, stat count-ups.
   All content is already in the DOM — JS only toggles classes and text. */
(function () {
  'use strict';
  var ROTATE_MS = 4200;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // The page's language, not the visitor's — this file runs on /, /es/ and /fr/.
  var lang = document.documentElement.lang || undefined;

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* Generic rotating group: items get .is-active; hover/focus selects; auto-advance pauses on hover. */
  function rotator(items, onChange) {
    if (!items.length) return null;
    var idx = 0, timer = null, paused = false;
    function set(i) {
      idx = (i + items.length) % items.length;
      items.forEach(function (el, n) { el.classList.toggle('is-active', n === idx); });
      if (onChange) onChange(items[idx], idx);
    }
    items.forEach(function (el, n) {
      el.addEventListener('mouseenter', function () { paused = true; set(n); });
      el.addEventListener('focus', function () { paused = true; set(n); });
      el.addEventListener('mouseleave', function () { paused = false; });
      el.addEventListener('blur', function () { paused = false; });
    });
    set(0);
    if (!reduce) {
      timer = setInterval(function () { if (!paused) set(idx + 1); }, ROTATE_MS);
    }
    return { set: set, stop: function () { clearInterval(timer); } };
  }

  /* Fires cb once when el scrolls into view. */
  function onceInView(el, cb) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) return cb();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { cb(); io.disconnect(); }
      });
    }, { threshold: 0.25 });
    io.observe(el);
  }

  ready(function () {
    var root = document.querySelector('.aa');
    if (!root) return;

    /* ---- 01 hero: cohorts + "in N days" ----
       The label is rendered server-side too; this recomputes it so a cached
       page does not show a stale countdown. Wording comes from data-labels,
       which [aa_home_cohorts] emits in the page's own language — hardcoding
       "in N days" here printed English over the Spanish and French cards.
       Counting from local midnight, not from now, is what makes the day
       boundary land on "tomorrow" instead of "in 1 days". */
    var midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    var cohorts = [].slice.call(root.querySelectorAll('.aa-cohort'));
    cohorts.forEach(function (el) {
      var days = el.querySelector('.aa-cohort__days');
      var start = el.getAttribute('data-start');
      if (days && start) {
        var L = {};
        try { L = JSON.parse(el.getAttribute('data-labels') || '{}'); } catch (err) {}
        var d = Math.round((new Date(start + 'T00:00:00') - midnight) / 86400000);
        var txt = d > 1 ? (L.days || 'in %d days').replace('%d', d)
                : d === 1 ? (L.tomorrow || 'tomorrow')
                : d === 0 ? (L.today || 'today')
                : (L.view || 'view dates');
        days.textContent = txt + ' ⟶';
      }
      var seats = el.querySelector('.aa-cohort__seats');
      var n = parseInt(el.getAttribute('data-seats'), 10);
      if (seats && !isNaN(n)) seats.classList.toggle('aa-cohort__seats--low', n <= 6);
    });
    rotator(cohorts);

    /* ---- 01 hero: ticker (duplicate items once for a seamless loop) ---- */
    var track = root.querySelector('.aa-ticker__track');
    if (track && !track.hasAttribute('data-cloned')) {
      track.setAttribute('data-cloned', '');
      track.innerHTML += track.innerHTML;
    }

    /* ---- 02 all training ---- */
    rotator([].slice.call(root.querySelectorAll('.aa-track')));

    /* ---- 03 assessments: list drives the report panel ---- */
    var report = root.querySelector('.aa-report');
    var rows = [].slice.call(root.querySelectorAll('.aa-assess__row'));
    if (report && rows.length) {
      var elName = report.querySelector('[data-report="name"]');
      var elMeta = report.querySelector('[data-report="meta"]');
      var elDesc = report.querySelector('[data-report="desc"]');
      var elCta = report.querySelector('[data-report="cta"]');
      var barWrap = report.querySelector('.aa-report__bars');
      var barsVisible = reduce;

      function paint(row) {
        var d = JSON.parse(row.getAttribute('data-report') || '{}');
        if (elName) elName.textContent = d.name || '';
        if (elMeta) elMeta.textContent = d.meta || '';
        if (elDesc) elDesc.textContent = d.desc || '';
        if (elCta) elCta.setAttribute('href', row.getAttribute('href') || '#');
        if (barWrap && d.bars) {
          barWrap.innerHTML = d.bars.map(function (b) {
            return '<div class="aa-bar"><div class="aa-bar__label"><span>' + b.label +
              '</span><b>' + b.val + '</b></div><div class="aa-bar__track">' +
              '<div class="aa-bar__fill" style="--aa-final-width:' + Math.round(b.pct * 100) + '%"></div>' +
              '</div></div>';
          }).join('');
          if (barsVisible) fillBars();
        }
      }
      function fillBars() {
        barsVisible = true;
        [].slice.call(report.querySelectorAll('.aa-bar__fill')).forEach(function (f) {
          requestAnimationFrame(function () {
            f.style.width = getComputedStyle(f).getPropertyValue('--aa-final-width').trim();
          });
        });
      }
      rotator(rows, paint);
      onceInView(report, fillBars);
    }

    /* ---- 04 five dimensions: pyramid drives the description panel ---- */
    var panel = root.querySelector('.aa-dim-panel');
    var layers = [].slice.call(root.querySelectorAll('.aa-layer'));
    if (panel && layers.length) {
      var pNum = panel.querySelector('[data-dim="num"]');
      var pName = panel.querySelector('[data-dim="name"]');
      var pDetail = panel.querySelector('[data-dim="detail"]');
      var pTags = panel.querySelector('[data-dim="tags"]');
      var pLink = panel.querySelector('[data-dim="link"]');
      rotator(layers, function (el) {
        var d = JSON.parse(el.getAttribute('data-dim') || '{}');
        if (pNum) pNum.textContent = d.num || '';
        if (pName) pName.textContent = d.name || '';
        if (pDetail) pDetail.textContent = d.detail || '';
        if (pTags) pTags.innerHTML = (d.tags || []).map(function (t) { return '<span>' + t + '</span>'; }).join('');
        if (pLink) pLink.setAttribute('href', el.getAttribute('href') || '#');
      });
    }

    /* ---- restored sections: their own rotator groups ----
       Separate selectors on purpose. These cards are not .aa-track or
       .aa-layer, so they spotlight independently instead of joining the
       training and pyramid groups. */
    rotator([].slice.call(root.querySelectorAll('.aa-proof__card')));
    rotator([].slice.call(root.querySelectorAll('.aa-stack__row')));
    rotator([].slice.call(root.querySelectorAll('.aa-step')));

    /* ---- 07 results: stat count-ups + rotating quotes ---- */
    var stats = [].slice.call(root.querySelectorAll('.aa-stat__num'));
    if (stats.length) {
      onceInView(root.querySelector('.aa-stats'), function () {
        var t0 = null, dur = 1600;
        stats.forEach(function (el) { el.setAttribute('data-final', el.textContent); });
        function step(t) {
          if (t0 === null) t0 = t;
          var p = Math.min(1, (t - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          stats.forEach(function (el) {
            // The last frame restores the markup's own string rather than
            // reformatting it. The source is the translated copy — "2 500+"
            // on the French page — and toLocaleString() would otherwise
            // group it by the *visitor's* locale, not the page's.
            if (p >= 1 || reduce) { el.textContent = el.getAttribute('data-final'); return; }
            var v = parseFloat(el.getAttribute('data-value')) || 0;
            var pre = el.getAttribute('data-prefix') || '';
            var suf = el.getAttribute('data-suffix') || '';
            el.textContent = pre + Math.round(v * eased).toLocaleString(lang) + suf;
          });
          if (p < 1 && !reduce) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
    rotator([].slice.call(root.querySelectorAll('.aa-quote')));
  });
})();
