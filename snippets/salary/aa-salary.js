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
