/* Agile Agilist — course hero (3A) + registration (2B).
   From the design handoff, with the invoice stub replaced by a real
   Stripe Checkout redirect. Load order matters: the calendar defines the
   selection the hero syncs to, so calendar first, hero second — which is
   the order they are concatenated here. */

/* Agile Agilist — Course Calendar 2B behaviour. Vanilla, no deps, IIFE-scoped.
   Progressive enhancement: markup already shows the full schedule with the next
   available cohort preselected; this file only adds interaction. */
(function () {
  var root = document.getElementById('aacal');
  if (!root) return;

  /* Wired by the PHP snippet (window.AA_REG). No hand-edited constant: the
     REST route and its nonce have to match what the server actually
     registered, and a stale hardcoded URL fails silently at the worst
     possible moment — the pay click. */
  var CFG = window.AA_REG || {};
  var ENDPOINT = CFG.checkout || null;
  /* Currency comes from the server with the page, not a constant here. The
     handoff was written for a Canadian price list; this site charges USD, and
     a hardcoded 'C$' would have put the wrong currency next to a real Stripe
     button. Whatever the server says it will charge is what the page shows. */
  var PRICE_CURRENCY = (CFG.symbol || '$');
  var PRICE_LOCALE   = (CFG.locale || 'en-US');
  var MAX_SEATS = 12;

  var tabs   = Array.prototype.slice.call(root.querySelectorAll('.aacal-tab'));
  var panels = Array.prototype.slice.call(root.querySelectorAll('.aacal-grid'));
  var cards  = Array.prototype.slice.call(root.querySelectorAll('.aacal-card'));

  var form1 = root.querySelector('[data-panel="1"]');
  var form2 = root.querySelector('[data-panel="2"]');
  var done  = root.querySelector('[data-panel="done"]');
  var steps = Array.prototype.slice.call(root.querySelectorAll('.aacal-step'));

  var elSelLabel = root.querySelector('[data-sel-label]');
  var elSelRange = root.querySelector('[data-sel-range]');
  var elSelBatch = root.querySelector('[data-sel-batch]');
  var elSeats    = root.querySelector('[data-seats-value]');
  var elTotal    = root.querySelector('[data-total]');
  var btnNext    = root.querySelector('[data-next]');
  var btnPay     = root.querySelector('[data-pay]');
  var elHint     = root.querySelector('[data-hint]');
  var consent    = form2.querySelector('[name="consent"]');

  var defaultCohort = cards[0];          // next available — the default selection
  var state = { card: cards[0], seats: 1, step: 1 };

  function money(n) {
    return PRICE_CURRENCY + n.toLocaleString(PRICE_LOCALE);
  }
  function price(card) { return parseInt(card.getAttribute('data-price'), 10) || 0; }
  function total() { return price(state.card) * state.seats; }
  function val(name) { return (form1.querySelector('[name="' + name + '"]').value || '').trim(); }
  function detailsOk() {
    return val('first').length > 1 && val('last').length > 0 && /.+@.+\..+/.test(val('email'));
  }

  /* ── month tabs ──────────────────────────────────────────────── */
  function showMonth(month) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-month') === month;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p) { p.hidden = p.getAttribute('data-month') !== month; });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showMonth(t.getAttribute('data-month')); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var next = tabs[(i + d + tabs.length) % tabs.length];
      next.focus(); showMonth(next.getAttribute('data-month'));
    });
  });

  /* ── cohort selection ────────────────────────────────────────── */
  function selectCard(card) {
    state.card = card;
    cards.forEach(function (c) {
      var on = c === card;
      c.classList.toggle('is-on', on);
      c.querySelector('.aacal-cardbtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var seatsLeft = parseInt(card.getAttribute('data-seats-left'), 10) || MAX_SEATS;
    if (state.seats > seatsLeft) state.seats = seatsLeft;
    render();
  }
  cards.forEach(function (c) {
    c.querySelector('.aacal-cardbtn').addEventListener('click', function () {
      goStep(1, false);
      selectCard(c);
    });
  });

  /* cross-component sync: the hero picker (aa-hero.js) and this calendar share a selection */
  function announce(card) {
    document.dispatchEvent(new CustomEvent('aa:cohort-select', {
      detail: { cohort: card.getAttribute('data-cohort'), source: 'calendar' }
    }));
  }
  cards.forEach(function (c) {
    c.querySelector('.aacal-cardbtn').addEventListener('click', function () { announce(c); });
  });
  document.addEventListener('aa:cohort-select', function (e) {
    if (!e.detail || e.detail.source === 'calendar') return;
    var match = cards.filter(function (c) { return c.getAttribute('data-cohort') === e.detail.cohort; })[0];
    if (!match || match === state.card) return;
    var panel = match.closest('.aacal-grid');
    if (panel) showMonth(panel.getAttribute('data-month'));
    goStep(1, false);
    selectCard(match);
  });

  /* ── seats ───────────────────────────────────────────────────── */
  root.querySelectorAll('[data-seats]').forEach(function (b) {
    b.addEventListener('click', function () {
      var cap = Math.min(MAX_SEATS, parseInt(state.card.getAttribute('data-seats-left'), 10) || MAX_SEATS);
      state.seats = Math.min(cap, Math.max(1, state.seats + parseInt(b.getAttribute('data-seats'), 10)));
      render();
    });
  });

  /* ── steps ───────────────────────────────────────────────────── */
  function goStep(n, focus) {
    state.step = n;
    form1.hidden = n !== 1;
    form2.hidden = n !== 2;
    done.hidden  = n !== 'done';
    steps.forEach(function (s) {
      var i = parseInt(s.getAttribute('data-step'), 10);
      s.classList.toggle('is-on', n === i);
      s.classList.toggle('is-past', typeof n === 'number' && n > i);
      s.querySelector('.aacal-num').textContent = (typeof n === 'number' && n > i) ? '✓' : String(i);
    });
    if (focus !== false) {
      var target = n === 2 ? form2 : n === 'done' ? done : form1;
      var f = target.querySelector('button, input');
      if (f) f.focus({ preventScroll: true });
    }
    render();
  }

  form1.addEventListener('input', render);
  form1.addEventListener('submit', function (e) {
    e.preventDefault();
    if (detailsOk()) goStep(2);
  });
  consent.addEventListener('change', render);
  root.querySelector('[data-back]').addEventListener('click', function () { goStep(1); });

  form2.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!consent.checked) { return; }

    /* NOTE what is NOT sent: the price, and the total. The browser can edit
       data-price with devtools, so an amount posted from here could be a
       dollar. The server takes the cohort id and looks the price up in its
       own table; seats is sent but re-clamped there too. */
    var payload = {
      cohort:  state.card.getAttribute('data-cohort'),
      seats:   state.seats,
      first:   val('first'), last: val('last'), email: val('email'),
      company: val('company'), phone: val('phone')
    };

    if (!ENDPOINT) {   // no server wired up — say so rather than pretending
      elHint.textContent = CFG.msgUnavailable || 'Registration is not available right now.';
      return;
    }

    btnPay.disabled = true;
    var wasLabel = btnPay.textContent;
    btnPay.textContent = CFG.msgSending || 'Taking you to checkout…';

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': CFG.nonce || '' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, body: j }; });
    }).then(function (res) {
      if (res.ok && res.body && res.body.url) {
        // Stripe hosts the card form; we never see card data.
        window.location.assign(res.body.url);
        return;
      }
      throw new Error((res.body && res.body.message) || 'checkout failed');
    }).catch(function (err) {
      btnPay.disabled = false;
      btnPay.textContent = wasLabel;
      elHint.textContent = (err && err.message) || CFG.msgError ||
        'Something went wrong — please email us and we will register you by hand.';
    });
  });

  /* The confirmation panel is shown only when Stripe sends the buyer back with
     ?aa_paid=<cohort>. It is never shown straight after submit: at that point
     the card has not been charged, and "You're in" would be a lie the user
     acts on. The webhook is what actually records the sale. */
  function showPaidReturn() {
    var q = new URLSearchParams(window.location.search);
    var paid = q.get('aa_paid');
    if (!paid) { return; }
    var card = cards.filter(function (c) { return c.getAttribute('data-cohort') === paid; })[0];
    if (card) { selectCard(card); }
    var name = q.get('aa_name') || 'there';
    root.querySelector('[data-done-name]').textContent = name;
    root.querySelector('[data-done-email]').textContent = q.get('aa_email') || 'you';
    root.querySelector('[data-done-summary]').textContent =
      (card ? card.getAttribute('data-range') : paid) +
      (q.get('aa_seats') ? ' · ' + q.get('aa_seats') + ' seat(s)' : '');
    goStep('done');
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  root.querySelector('[data-reset]').addEventListener('click', function () {
    form1.reset(); form2.reset();
    state.seats = 1;
    selectCard(defaultCohort);
    goStep(1);
  });

  /* ── render ──────────────────────────────────────────────────── */
  function render() {
    var c = state.card;
    elSelLabel.textContent = c === defaultCohort ? 'Selected · next available' : 'Selected';
    elSelRange.textContent = c.getAttribute('data-range');
    elSelBatch.textContent = c.getAttribute('data-batch');
    elSeats.textContent = String(state.seats);
    elTotal.textContent = money(total());

    var ok = detailsOk();
    btnNext.disabled = !ok;
    elHint.textContent = ok ? 'One more screen — then you\u2019re done.' : 'Name and work email to continue.';

    root.querySelector('[data-rev-dates]').textContent = c.getAttribute('data-range');
    root.querySelector('[data-rev-name]').textContent  = (val('first') + ' ' + val('last')).trim() || '—';
    root.querySelector('[data-rev-email]').textContent = val('email') || '—';
    root.querySelector('[data-rev-seats]').textContent = String(state.seats);
    root.querySelector('[data-rev-total]').textContent = money(total());
    btnPay.disabled = !consent.checked;
  }

  render();
  showPaidReturn();
})();


/* Agile Agilist — hero picker (3A). Vanilla, IIFE, no deps.
   Emits `aa:cohort-select` on document so the calendar below can adopt the choice
   (aa-calendar.js listens for it). Load AFTER aa-calendar.js on the page. */
(function () {
  var root = document.getElementById('aahero');
  if (!root) return;

  var tabs   = Array.prototype.slice.call(root.querySelectorAll('.aahero-tab'));
  var panels = Array.prototype.slice.call(root.querySelectorAll('.aahero-list'));
  var cards  = Array.prototype.slice.call(root.querySelectorAll('.aahero-card'));
  var elRange = root.querySelector('[data-hero-range]');
  var elShort = root.querySelector('[data-hero-short]');

  function showMonth(month) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-month') === month;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p) { p.hidden = p.getAttribute('data-month') !== month; });
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { showMonth(t.getAttribute('data-month')); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = tabs[(i + d + tabs.length) % tabs.length];
      n.focus(); showMonth(n.getAttribute('data-month'));
    });
  });

  function select(card, emit) {
    cards.forEach(function (c) {
      var on = c === card;
      c.classList.toggle('is-on', on);
      c.querySelector('.aahero-cardbtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    elRange.textContent = card.getAttribute('data-range');
    elShort.textContent = card.getAttribute('data-short');
    if (emit !== false) {
      document.dispatchEvent(new CustomEvent('aa:cohort-select', {
        detail: { cohort: card.getAttribute('data-cohort'), source: 'hero' }
      }));
    }
  }

  cards.forEach(function (c) {
    c.querySelector('.aahero-cardbtn').addEventListener('click', function () { select(c, true); });
  });

  /* keep the hero in sync when the user changes their mind in the calendar below */
  document.addEventListener('aa:cohort-select', function (e) {
    if (!e.detail || e.detail.source === 'hero') return;
    var match = cards.filter(function (c) { return c.getAttribute('data-cohort') === e.detail.cohort; })[0];
    if (!match) return;
    var panel = match.closest('.aahero-list');
    if (panel) showMonth(panel.getAttribute('data-month'));
    select(match, false);
  });

  select(cards[0], false); // next available — default, never empty
})();
