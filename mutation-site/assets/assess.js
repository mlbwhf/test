/* Mutation — the five-layer placement assessment.

   Loaded only by /assess/. The instrument (15 statements, the 0–4 scale, the
   scoring and the four readings) is carried over unchanged from the original
   build; only the presentation moved to the new design system.

   Scoring, for whoever maintains this:
     layer score   = sum of that layer's 3 answers / 12, as a percentage
     wave          = highest layer that is >= 60 with every layer below it also >= 60
     highest tried = highest layer scoring >= 60 is not required; >= 40 is enough
     weakest       = lowest-scoring layer (first one, on a tie)

   The gap between "wave" and "highest tried" is the whole point of the
   instrument: it finds the organisation that has climbed past a layer it never
   made hold. Do not "simplify" the two into one number. */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     CONFIG — paste the n8n production Webhook URL here before launch.
     Until it starts with http the page simply skips the POST, so the
     assessment stays fully usable while the automation is being wired.
     Payload: {name,email,layers:{"01".."05"},wave,weakest,utm_*,ts}
     --------------------------------------------------------------------- */
  var WEBHOOK_URL = 'PASTE_N8N_WEBHOOK_URL_HERE';

  var LAYERS = [
    { n: '01', name: 'Iterative delivery at scale', def: 'Delivery works beyond a few teams: dependencies, alignment, a shared cadence. Without this, nothing above it has a floor.' },
    { n: '02', name: 'Innovation in cadence',       def: 'Innovation is recurring and protected inside the existing rhythm — not run beside it as a special project.' },
    { n: '03', name: 'AI-Native',                   def: 'AI is native to how the work is done — processes, roles and governance redesigned, not copilots bolted on.' },
    { n: '04', name: 'AI automation',               def: 'Automation is applied where it changes the economics of work — and the human keeps the decision and the accountability.' },
    { n: '05', name: 'Mutation',                    def: 'The capacity to change the model itself, not just adapt inside the one you have.' }
  ];

  var Q = [
    { l: 0, t: 'Work that spans more than three teams reaches customers on a predictable cadence, without heroics.' },
    { l: 0, t: 'Cross-team dependencies are visible and managed before they become escalations.' },
    { l: 0, t: 'One planning rhythm governs all the teams that need to move together.' },
    { l: 1, t: 'A protected share of capacity goes to experiments every cycle — and survives quarterly pressure.' },
    { l: 1, t: 'Experiments have pre-agreed success criteria, and some are expected to fail.' },
    { l: 1, t: 'An idea from outside the leadership team shipped to customers in the last quarter.' },
    { l: 2, t: 'At least one core process has been redesigned around AI rather than having a copilot added to it.' },
    { l: 2, t: 'Roles have changed because of AI — what people are accountable for is different than eighteen months ago.' },
    { l: 2, t: 'Governance treats AI systems as actors with identity and scoped permissions, not as tools.' },
    { l: 3, t: 'Where AI acts autonomously, a named human owns the decision and can explain it after the fact.' },
    { l: 3, t: 'Automation was chosen where it changed the unit economics of the work — not where it was merely possible.' },
    { l: 3, t: 'Every autonomous action leaves enough evidence to reconstruct what happened.' },
    { l: 4, t: 'We have retired or fundamentally rebuilt a core part of our operating model in the last twelve months.' },
    { l: 4, t: 'We track leading signals — behaviour, language, workflow drift — not only lagging metrics.' },
    { l: 4, t: 'Someone was visibly rewarded in the last year for raising a signal that invalidated a plan.' }
  ];

  var SCALE = [
    ['0', 'Not true of us'],
    ['1', 'Rarely true'],
    ['2', 'Sometimes true'],
    ['3', 'Mostly true'],
    ['4', 'Consistently true']
  ];

  var idx = 0;
  var ans = [];

  function $(id) { return document.getElementById(id); }

  function show(id) {
    var stages = document.querySelectorAll('.stage');
    Array.prototype.forEach.call(stages, function (s) { s.classList.remove('is-on'); });
    var el = $(id);
    if (el) el.classList.add('is-on');
    window.scrollTo({ top: 0 });
  }

  function progress() {
    var bar = $('progBar');
    if (bar) bar.style.width = (idx / Q.length * 100) + '%';
  }

  function render() {
    var q = Q[idx];
    var L = LAYERS[q.l];
    $('dimTag').textContent = 'Layer ' + L.n + ' — ' + L.name;
    $('dimDef').textContent = L.def;
    $('qNum').textContent = 'Statement ' + (idx + 1) + ' of ' + Q.length;
    $('qText').textContent = q.t;

    var opts = $('opts');
    opts.innerHTML = '';
    SCALE.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt';
      var tick = document.createElement('span');
      tick.className = 'opt__tick';
      tick.textContent = s[0];
      var txt = document.createElement('span');
      txt.textContent = s[1];
      b.appendChild(tick);
      b.appendChild(txt);
      b.addEventListener('click', function () {
        ans[idx] = i;
        idx++;
        progress();
        if (idx < Q.length) render(); else show('gate');
      });
      opts.appendChild(b);
    });

    var back = $('backBtn');
    if (back) back.hidden = idx === 0;
    progress();
  }

  function layerScores() {
    var s = [0, 0, 0, 0, 0];
    Q.forEach(function (q, i) { s[q.l] += ans[i] || 0; });
    return s.map(function (v) { return Math.round(v / 12 * 100); });
  }

  function submitGate() {
    var nameEl = $('nameIn');
    var mailEl = $('emailIn');
    var name = nameEl.value.trim();
    var email = mailEl.value.trim();

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      mailEl.classList.add('is-bad');
      mailEl.value = '';
      mailEl.placeholder = 'A valid work email is needed';
      mailEl.focus();
      return;
    }
    mailEl.classList.remove('is-bad');

    var ls = layerScores();

    var wave = 0;
    for (var i = 0; i < 5; i++) {
      if (ls[i] >= 60) wave = i + 1; else break;
    }

    var highestAttempted = 0;
    ls.forEach(function (v, i) { if (v >= 40) highestAttempted = i + 1; });

    var weakest = ls.indexOf(Math.min.apply(null, ls));

    var params = new URLSearchParams(location.search);
    var payload = {
      name: name,
      email: email,
      layers: LAYERS.reduce(function (o, L, i) { o[L.n] = ls[i]; return o; }, {}),
      wave: wave,
      weakest: LAYERS[weakest].n,
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      ts: new Date().toISOString()
    };

    if (WEBHOOK_URL.indexOf('http') === 0) {
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () {});
    }

    $('waveName').textContent = wave === 0
      ? 'Before the first wave'
      : 'Wave ' + LAYERS[wave - 1].n + ' — ' + LAYERS[wave - 1].name;

    $('scoreLine').textContent = 'Solid through layer ' + (wave || '—')
      + ' · highest layer attempted: ' + (highestAttempted || '—');

    $('layerBars').innerHTML = LAYERS.map(function (L, i) {
      return '<div class="barrow' + (i === weakest ? ' barrow--weak' : '') + '">'
        + '<div class="barrow__lab"><span><b>' + L.n + '</b> ' + L.name + '</span><span>' + ls[i] + '</span></div>'
        + '<div class="bar"><i style="width:' + ls[i] + '%"></i></div>'
        + '</div>';
    }).join('');

    var read;
    if (highestAttempted > wave + 1) {
      read = 'You are operating at layer ' + highestAttempted + ' while layer ' + (wave + 1)
        + ' (' + LAYERS[wave].name + ') is not holding. That gap is the most common and most expensive '
        + 'pattern we see: the organization has climbed higher than its governance can support. The next '
        + 'move is not another layer up. It is closing the gap beneath you.';
    } else if (wave === 5) {
      read = 'All five layers are holding. The risk now is success hardening — practices freezing into '
        + 'routines that stop being questioned. Re-score quarterly, and treat a falling layer-05 score as '
        + 'the first signal, not a rounding error.';
    } else if (wave === 0) {
      read = 'Delivery at scale is not yet holding, so nothing above it has a floor. This is not a '
        + 'criticism — it is the honest place to start, and it is the layer with the fastest, most visible payoff.';
    } else {
      read = 'Layers 01–0' + wave + ' are holding. Layer ' + LAYERS[wave].n + ' (' + LAYERS[wave].name
        + ') is the one to build next — and only if the market demands it. Going higher than the problem '
        + 'requires is an expensive way to be wrong.';
    }
    $('readout').textContent = read;

    show('results');
  }

  function boot() {
    var start = $('startBtn');
    if (!start) return;

    start.addEventListener('click', function () {
      idx = 0;
      ans = [];
      show('quiz');
      render();
    });

    var back = $('backBtn');
    if (back) {
      back.addEventListener('click', function () {
        if (idx === 0) return;
        idx--;
        render();
      });
    }

    $('gateBtn').addEventListener('click', submitGate);
    $('emailIn').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); submitGate(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
