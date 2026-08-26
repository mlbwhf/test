/* ============================================================================
   AA — HOME PAGE HERO (1A) picker                             [aa_home_hero]
   ----------------------------------------------------------------------------
   WPCode -> JavaScript Snippet, "AA – Home Hero JS", Site Wide Footer.

   Progressive enhancement, deliberately. Every row, every price and every date
   is already in the HTML the server sent, and the CTA already points at a real
   batch. This file adds the track filter, the selection state and keeps the
   CTA's label and destination in step with the selection. With JS off the hero
   is a readable list of dated batches and a working button, which is what the
   home page most needs it to be.
   ============================================================================ */
(function () {
  'use strict';

  var root = document.querySelector('.aa-hh');
  if (!root) { return; }

  /* DOUBLE-RUN GUARD. Two copies of this snippet would bind every handler
     twice: one chip click would run the filter twice and one row click would
     fight itself over the selection. Marking the element rather than a global
     means the second copy stops here. */
  if (root.getAttribute('data-hh-bound')) { return; }
  root.setAttribute('data-hh-bound', '1');

  var chips   = Array.prototype.slice.call(root.querySelectorAll('[data-hh-track]'));
  var rows    = Array.prototype.slice.call(root.querySelectorAll('[data-hh-row]'));
  var weeks   = Array.prototype.slice.call(root.querySelectorAll('[data-hh-week]'));
  var elCount = root.querySelector('[data-hh-count]');
  var elEmpty = root.querySelector('[data-hh-nomatch]');
  var elCta   = root.querySelector('[data-hh-cta]');
  var elLabel = root.querySelector('[data-hh-cta-label]');

  if (!rows.length) { return; }

  var total = rows.length;
  var state = { track: '', row: rows.filter(function (r) { return r.classList.contains('is-on'); })[0] || rows[0] };

  function plural(n, one, many) { return n === 1 ? one : many.replace('%d', n); }

  /* The CTA names the batch it will book. "Reserve Sep 14–17 · SPC" is a
     different promise from "Browse cohorts", and it is the difference between
     the hero being a menu and the hero being a checkout entrance. */
  function paintCta() {
    if (!state.row) { return; }
    if (elLabel) {
      elLabel.textContent = 'Reserve ' + state.row.getAttribute('data-range') +
                            ' · ' + state.row.getAttribute('data-code');
    }
    if (elCta) { elCta.setAttribute('href', state.row.getAttribute('data-href')); }
  }

  function select(row) {
    if (!row) { return; }
    state.row = row;
    rows.forEach(function (r) {
      var on = r === row;
      r.classList.toggle('is-on', on);
      r.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    paintCta();
  }

  function apply() {
    var shown = 0;

    rows.forEach(function (r) {
      var match = !state.track || r.getAttribute('data-track') === state.track;
      r.hidden = !match;
      if (match) { shown++; }
    });

    /* A week heading over nothing reads as a rendering bug, so a group with no
       visible rows is hidden whole -- and its own count is recomputed, because
       "3 batches" over one row is worse than no count at all. */
    weeks.forEach(function (w) {
      var vis = Array.prototype.slice.call(w.querySelectorAll('[data-hh-row]'))
                 .filter(function (r) { return !r.hidden; });
      w.hidden = vis.length === 0;
      var c = w.querySelector('[data-hh-weekcount]');
      if (c) { c.textContent = plural(vis.length, '1 batch', '%d batches'); }
    });

    if (elCount) {
      elCount.textContent = state.track
        ? shown + ' of ' + total + ' batches'
        : plural(shown, '1 upcoming batch', '%d upcoming batches');
    }
    if (elEmpty) { elEmpty.hidden = shown > 0; }

    /* Never leave the CTA pointed at a batch the visitor can no longer see:
       after a filter, the selection moves to the first row still on screen. */
    if (shown && (!state.row || state.row.hidden)) {
      select(rows.filter(function (r) { return !r.hidden; })[0]);
    }
  }

  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      state.track = c.getAttribute('data-hh-track') || '';
      chips.forEach(function (o) {
        var on = o === c;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      apply();
    });
  });

  rows.forEach(function (r) {
    r.addEventListener('click', function () { select(r); });
  });

  select(state.row);
  apply();
})();
