/* Mutation — interactions. Vanilla, no dependencies, no build step.

   Two independent blocks:
     initRings()  the IMMUNE readout on the landing page
     initCast()   the character detail swap on /cast/

   Each one returns early if its host element is absent, and each is called
   inside its own try/catch so a fault in one can never stop the other. The
   assessment lives in assess.js and is loaded only by /assess/ for the same
   reason: one script file is one failure domain. */
(function () {
  'use strict';

  var RINGS = {
    people: {
      title: 'People', kicker: 'the sensing layer',
      log: 'What a person noticed and could not explain — a hesitation in a handoff, a customer phrasing something in a new way.',
      not: 'Performance complaints. This ring is for the unfamiliar, not the unhappy.'
    },
    internal: {
      title: 'Internal systems', kicker: 'workflow friction · unexplained delays',
      log: 'Decisions with no lineage. Queues that got longer for no visible reason. A model output nobody can source.',
      not: 'Metric breaches — the dashboard already has those.'
    },
    suppliers: {
      title: 'Suppliers', kicker: 'vendors that got faster · too perfect',
      log: 'A vendor that suddenly got faster. Output that is too clean. A new agent quietly in the loop.',
      not: 'Policy violations — the perimeter already has those.'
    }
  };
  var RING_ORDER = ['people', 'internal', 'suppliers'];

  function initRings() {
    var root = document.querySelector('[data-immune]');
    if (!root) return;
    var rings = root.querySelectorAll('.ring');
    var out = {
      index:  root.querySelector('[data-ring-index]'),
      title:  root.querySelector('[data-ring-title]'),
      kicker: root.querySelector('[data-ring-kicker]'),
      log:    root.querySelector('[data-ring-log]'),
      not:    root.querySelector('[data-ring-not]')
    };
    function select(key) {
      var r = RINGS[key];
      if (!r) return;
      Array.prototype.forEach.call(rings, function (el) {
        el.setAttribute('aria-pressed', String(el.getAttribute('data-ring') === key));
      });
      if (out.index)  out.index.textContent = 'IMMUNE · RING ' + (RING_ORDER.indexOf(key) + 1) + ' / 3';
      if (out.title)  out.title.textContent = r.title;
      if (out.kicker) out.kicker.textContent = r.kicker;
      if (out.log)    out.log.textContent = r.log;
      if (out.not)    out.not.textContent = r.not;
    }
    Array.prototype.forEach.call(rings, function (el) {
      el.addEventListener('click', function () { select(el.getAttribute('data-ring')); });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          select(el.getAttribute('data-ring'));
        }
      });
    });
    select('people');
  }

  /* Cast detail swap. Every character is already in the page inside a
     <template data-person-detail="slug">, so the full copy ships in the HTML
     source and is crawlable; the script only clones the selected one into the
     slot. Do not move this to fetch/AJAX — the indexable copy is the point. */
  function initCast() {
    var root = document.querySelector('[data-cast]');
    if (!root) return;
    var slot = root.querySelector('[data-cast-detail]');
    var triggers = root.querySelectorAll('[data-person]');
    if (!slot || !triggers.length) return;

    function select(id) {
      var tpl = root.querySelector('template[data-person-detail="' + id + '"]');
      if (!tpl) return;
      slot.innerHTML = '';
      slot.appendChild(tpl.content.cloneNode(true));
      Array.prototype.forEach.call(triggers, function (t) {
        if (t.classList.contains('cast-chip')) {
          t.setAttribute('aria-pressed', String(t.getAttribute('data-person') === id));
        }
      });
      if (history.replaceState) history.replaceState(null, '', '#' + id);
    }

    Array.prototype.forEach.call(triggers, function (t) {
      t.addEventListener('click', function () { select(t.getAttribute('data-person')); });
    });

    /* A /cast/#slug link followed from anywhere is a same-document navigation
       when you are already on /cast/ — no reload, no DOMContentLoaded. Without
       this the URL would change and the page would not. */
    window.addEventListener('hashchange', function () {
      var id = (location.hash || '').replace('#', '');
      if (id) select(id);
    });

    var initial = (location.hash || '').replace('#', '');
    var known = initial && root.querySelector('template[data-person-detail="' + initial + '"]');
    select(known ? initial : triggers[0].getAttribute('data-person'));
  }

  function boot() {
    try { initRings(); } catch (e) {}
    try { initCast();  } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
