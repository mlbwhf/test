/* Agile Agilist — course hero (3A) + registration (2B shell + 4D dense picker).
   Calendar half from the latest handoff, with the invoice stub replaced by a
   real Stripe Checkout redirect. Hero half unchanged and deliberately so.
   Load order: calendar first (it owns the selection), hero second. */

/* Agile Agilist — Course Calendar (2B shell + 4D dense picker). Vanilla, IIFE, no deps.
   Progressive enhancement: the markup already lists every batch with the next available one
   selected; this file adds month tabs, filtering, seats and the two-step wizard.
   Adopts the hero's pick via the `aa:cohort-select` document event (one-way, hero → calendar). */
(function () {
  var root = document.getElementById('aacal');
  if (!root) return;

  /* DOUBLE-RUN GUARD. If this file is active twice — an older snippet left
     beside a newer one with the same name — every handler below binds twice:
     one click on a seat button adds two seats, one tab click fires two
     fetches, and one submit posts to Stripe twice. The PHP has the same guard
     for the same reason. Marking the element rather than a global means a
     second copy stops here instead of silently doubling everything. */
  if (root.getAttribute('data-aa-bound')) return;
  root.setAttribute('data-aa-bound', '1');

  /* Wired by the PHP snippet. The REST route and its nonce must match what the
     server registered, and currency must match what the server will charge —
     the handoff is written for a Canadian price list and this site bills USD. */
  var CFG = window.AA_REG || {};
  var PRICE_CURRENCY = CFG.symbol || '$';
  var PRICE_LOCALE   = CFG.locale || 'en-US';
  var MAX_SEATS = 12;
  var ENDPOINT = CFG.checkout || null;
  var BATCHES  = CFG.batches || null;

  var tabs   = q('.aacal-tab');
  var months = q('.aacal-panel-month');
  var chips  = q('.aacal-chip');
  var cards  = q('.aacal-card');
  var weeks  = q('.aacal-week');

  var form1 = root.querySelector('[data-panel="1"]');
  var form2 = root.querySelector('[data-panel="2"]');
  var done  = root.querySelector('[data-panel="done"]');
  var steps = q('.aacal-step');

  var elMonthLabel = root.querySelector('[data-month-label]');
  function on(node, evt, fn) { if (node) node.addEventListener(evt, fn); }
  function txt(node, s) { if (node) node.textContent = s; }
  var elCount   = root.querySelector('[data-count]');
  var elEmpty   = root.querySelector('[data-empty]');
  var elSelLbl  = root.querySelector('[data-sel-label]');
  var elSelRng  = root.querySelector('[data-sel-range]');
  var elSelBat  = root.querySelector('[data-sel-batch]');
  var elSeats   = root.querySelector('[data-seats-value]');
  var elTotal   = root.querySelector('[data-total]');
  var btnNext   = root.querySelector('[data-next]');
  var btnPay    = root.querySelector('[data-pay]');
  var elHint    = root.querySelector('[data-hint]');
  var elHint2   = root.querySelector('[data-hint2]');
  var consent   = form2 ? form2.querySelector('[name="consent"]') : null;

  var defaultCohort = cards[0];  // next available — the default selection
  var state = { card: cards[0], seats: 1, step: 1, month: tabs[0].getAttribute('data-month'), filter: 'all' };

  function q(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
  function money(n) { return PRICE_CURRENCY + n.toLocaleString(PRICE_LOCALE); }
  function price(card) { return parseInt(card.getAttribute('data-price'), 10) || 0; }
  function total() { return price(state.card) * state.seats; }
  function val(name) {
    var f = form1 && form1.querySelector('[name="' + name + '"]');
    return f ? (f.value || '').trim() : '';
  }
  /* One field gates the flow: an email. Stripe collects the cardholder
     name, billing details and the card itself on its own page, and asking for
     them here first means typing the same things twice. The email is worth
     keeping — it prefills Stripe, and it is the only trace of someone who
     abandons on Stripe's page. */
  function detailsOk() {
    return /.+@.+\..+/.test(val('email'));
  }
  function monthCards(month) {
    return cards.filter(function (c) { return c.closest('.aacal-panel-month').getAttribute('data-month') === month; });
  }
  function matches(card) {
    return state.filter === 'all' || card.getAttribute('data-kind') === state.filter;
  }

  /* ── visibility: month + filter, then empty groups ───────────── */
  function applyVisibility() {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-month') === state.month;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on) txt(elMonthLabel, t.getAttribute('data-month-name'));
    });
    months.forEach(function (m) { m.hidden = m.getAttribute('data-month') !== state.month; });
    chips.forEach(function (c) {
      var on = c.getAttribute('data-filter') === state.filter;
      c.classList.toggle('is-on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    cards.forEach(function (c) { c.hidden = !matches(c); });
    weeks.forEach(function (w) {
      var shown = Array.prototype.slice.call(w.querySelectorAll('.aacal-card')).filter(function (c) { return !c.hidden; });
      w.hidden = shown.length === 0;
      txt(w.querySelector('[data-week-count]'), shown.length === 1 ? '1 batch' : shown.length + ' batches');
    });

    var panel = monthEl(state.month);
    var lazy = panel && panel.hasAttribute('data-lazy');
    var all = monthCards(state.month);
    var visible = all.filter(function (c) { return !c.hidden; });
    /* While a month is still arriving its rows are not in the DOM, so count
       from the total the server put on the panel rather than from zero cards —
       otherwise the header reads "0 batches" for the length of the fetch. */
    var totalInMonth = lazy ? (parseInt(panel.getAttribute('data-month-count'), 10) || 0) : all.length;
    txt(elCount, state.filter === 'all' || lazy
      ? (totalInMonth === 1 ? '1 batch' : totalInMonth + ' batches')
      : visible.length + ' of ' + all.length + ' batches');
    if (elEmpty) elEmpty.hidden = lazy || visible.length > 0;

    /* never leave a selection the user cannot see */
    if (visible.length && visible.indexOf(state.card) === -1) selectCard(visible[0]);
  }

  /* ── months that arrive on demand ────────────────────────────────
     Only the open month's rows are in the page; the rest are fetched the
     first time their tab is opened. See the note in the PHP snippet for why.
     Every month the user has not asked for stays unfetched, and a month is
     only ever fetched once. */
  var pending = {};

  function monthEl(month) {
    return months.filter(function (m) { return m.getAttribute('data-month') === month; })[0];
  }

  /* Re-find the rows and bind the new ones. Called after a month lands, so
     the click handlers, the filter and the visibility pass all see the rows
     that just arrived. Binding is marked on the element rather than tracked
     in a list, so a second call cannot double-bind a row. */
  function rescan() {
    cards = q('.aacal-card');
    weeks = q('.aacal-week');
    cards.forEach(function (c) {
      if (c.getAttribute('data-bound')) return;
      c.setAttribute('data-bound', '1');
      c.querySelector('.aacal-cardbtn').addEventListener('click', function () {
        goStep(1, false);
        selectCard(c);
      });
    });
  }

  function ensureMonth(month) {
    var panel = monthEl(month);
    if (!panel || !panel.hasAttribute('data-lazy')) return Promise.resolve();
    if (!BATCHES || !CFG.course) return Promise.resolve();
    if (pending[month]) return pending[month];

    panel.setAttribute('aria-busy', 'true');
    pending[month] = fetch(BATCHES + '?course=' + encodeURIComponent(CFG.course) +
                           '&month=' + encodeURIComponent(month))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        panel.innerHTML = (j && j.html) || '';
        panel.removeAttribute('data-lazy');
        panel.removeAttribute('aria-busy');
        rescan();
      })
      .catch(function () {
        /* Leave data-lazy on so the next tab visit tries again, and drop the
           promise so it is not a cached failure. */
        panel.removeAttribute('aria-busy');
        delete pending[month];
      });
    return pending[month];
  }

  /* Everything, for the two paths that look a cohort up by id and cannot know
     which month it is in: the calendar's hand-off and the return from Stripe. */
  function ensureAll() {
    return Promise.all(months.map(function (m) {
      return ensureMonth(m.getAttribute('data-month'));
    }));
  }

  function goMonth(month) {
    state.month = month;
    applyVisibility();                              // tab moves now, not after the fetch
    ensureMonth(month).then(applyVisibility);       // again once the rows are in
  }

  /* ── selection ───────────────────────────────────────────────── */
  function selectCard(card) {
    state.card = card;
    cards.forEach(function (c) {
      var on = c === card;
      c.classList.toggle('is-on', on);
      c.querySelector('.aacal-cardbtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var left = parseInt(card.getAttribute('data-seats-left'), 10) || MAX_SEATS;
    if (state.seats > left) state.seats = left;
    render();
  }

  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { goMonth(t.getAttribute('data-month')); });
    t.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = tabs[(i + d + tabs.length) % tabs.length];
      n.focus();
      goMonth(n.getAttribute('data-month'));
    });
  });

  chips.forEach(function (c) {
    c.addEventListener('click', function () { state.filter = c.getAttribute('data-filter'); applyVisibility(); });
  });
  on(root.querySelector('[data-clear]'), 'click', function () {
    state.filter = 'all';
    applyVisibility();
  });

  rescan();

  /* one-way: the hero hands its pick down to this calendar and never listens back */
  document.addEventListener('aa:cohort-select', function (e) {
    if (!e.detail) return;
    // Our own echo, not someone else's pick.
    if (e.detail.source === 'aacal') return;
    adopt(e.detail);
  });

  /* The hero and the month calendar both hand a batch down, and either can
     name one in a month whose rows have not been fetched. So: try, and if it
     is not here yet, fetch the rest and try once more.

     Two ways in, because the two senders know different things:
       cohort  the hero, which renders the same batches as this list
       start   the calendar, whose bars are wp_events posts with ids from a
               different space entirely — the start date is the only field
               both sides agree on, so that is what it matches. */
  function find(detail) {
    return cards.filter(function (c) {
      if (detail.cohort && c.getAttribute('data-cohort') === detail.cohort) { return true; }
      return !!detail.start && c.getAttribute('data-start') === detail.start;
    })[0];
  }

  function adopt(detail) {
    if (typeof detail === 'string') { detail = { cohort: detail }; }
    var match = find(detail);
    if (!match) { ensureAll().then(function () { land(detail); }); return; }
    land(detail, match);
  }

  function land(detail, match) {
    match = match || find(detail);
    if (!match || match === state.card) return;
    state.month = match.closest('.aacal-panel-month').getAttribute('data-month');
    if (!matches(match)) state.filter = 'all';
    goStep(1, false);
    selectCard(match);
    applyVisibility();
  }

  /* ── seats ───────────────────────────────────────────────────── */
  q('[data-seats]').forEach(function (b) {
    b.addEventListener('click', function () {
      var cap = Math.min(MAX_SEATS, parseInt(state.card.getAttribute('data-seats-left'), 10) || MAX_SEATS);
      state.seats = Math.min(cap, Math.max(1, state.seats + parseInt(b.getAttribute('data-seats'), 10)));
      render();
    });
  });

  /* ── steps ───────────────────────────────────────────────────── */
  function goStep(n, focus) {
    state.step = n;
    if (form1) form1.hidden = n !== 1;
    if (form2) form2.hidden = n !== 2;
    if (done) done.hidden = n !== 'done';
    steps.forEach(function (s) {
      var i = parseInt(s.getAttribute('data-step'), 10);
      s.classList.toggle('is-on', n === i);
      s.classList.toggle('is-past', typeof n === 'number' && n > i);
      s.querySelector('.aacal-num').textContent = (typeof n === 'number' && n > i) ? '✓' : String(i);
    });
    if (focus !== false) {
      var target = (n === 2 ? form2 : n === 'done' ? done : form1) || root;
      var f = target.querySelector('button, input');
      if (f) f.focus({ preventScroll: true });
    }
    render();
  }

  on(form1, 'input', render);
  on(form1, 'submit', function (e) { e.preventDefault(); if (detailsOk()) goStep(2); });
  on(consent, 'change', render);
  on(root.querySelector('[data-back]'), 'click', function () { goStep(1); });

  on(form2, 'submit', function (e) {
    e.preventDefault();
    if (!consent || !consent.checked) { return; }

    /* Note what is NOT sent: price, total, currency. data-price is in the
       markup so the page can show a running total, and devtools can rewrite
       it to 1. The server takes the cohort id, looks the price up in its own
       table, and re-clamps seats against what is actually left. */
    var payload = {
      cohort:  state.card.getAttribute('data-cohort'),
      seats:   state.seats,
      email:   val('email')
    };

    if (!ENDPOINT) {
      txt(elHint2 || elHint, CFG.msgUnavailable || 'Registration is not available right now.');
      return;
    }

    var wasLabel = btnPay ? btnPay.textContent : '';
    if (btnPay) { btnPay.disabled = true; btnPay.textContent = CFG.msgSending || 'Taking you to checkout…'; }

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': CFG.nonce || '' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, body: j }; });
    }).then(function (res) {
      if (res.ok && res.body && res.body.url) {
        window.location.assign(res.body.url);   // Stripe hosts the card form
        return;
      }
      throw new Error((res.body && res.body.message) || 'checkout failed');
    }).catch(function (err) {
      if (btnPay) { btnPay.disabled = false; btnPay.textContent = wasLabel; }
      txt(elHint2 || elHint, (err && err.message) || CFG.msgError ||
        'We could not start checkout. Please try again, or email us and we will register you by hand.');
    });
  });

  /* Shown only when Stripe sends the buyer back with ?aa_paid=<cohort>. Never
     straight after submit: at that moment the card has not been charged, and
     "You're in" is a claim the buyer would act on. The webhook records the
     sale. No name or email in the URL — that is PII in analytics and
     referrers — so the confirmation stays impersonal. */
  function showPaidReturn() {
    var q2 = new URLSearchParams(window.location.search);
    var paid = q2.get('aa_paid');
    if (!paid) { return; }
    var hit = cards.filter(function (c) { return c.getAttribute('data-cohort') === paid; })[0];
    /* The batch they bought is very often months out, so its rows are not in
       the page. Fetch the rest and come back, rather than confirming a
       purchase with a bare cohort id where the dates should be. */
    if (!hit) { ensureAll().then(showPaidReturn); return; }
    selectCard(hit, false);
    var seats = parseInt(q2.get('aa_seats'), 10) || 1;
    txt(root.querySelector('[data-done-name]'), 'you');
    txt(root.querySelector('[data-done-email]'), 'your inbox');
    txt(root.querySelector('[data-done-summary]'),
      hit.getAttribute('data-range') + ' · ' + seats + (seats === 1 ? ' seat' : ' seats'));
    goStep('done');
  }

  on(root.querySelector('[data-reset]'), 'click', function () {
    if (form1) form1.reset();
    if (form2) form2.reset();
    state.seats = 1; state.filter = 'all';
    // the default is always in the month rendered inline, so no fetch here
    state.month = defaultCohort.closest('.aacal-panel-month').getAttribute('data-month');
    selectCard(defaultCohort);
    applyVisibility();
    goStep(1);
  });

  /* ── render ──────────────────────────────────────────────────── */
  function render() {
    var c = state.card;
    txt(elSelLbl, c === defaultCohort ? 'Selected · next available' : 'Selected');
    txt(elSelRng, c.getAttribute('data-range'));
    txt(elSelBat, c.getAttribute('data-batch'));
    txt(elSeats, String(state.seats));
    txt(elTotal, money(total()));

    var ok = detailsOk();
    if (btnNext) btnNext.disabled = !ok;
    txt(elHint, ok ? 'One more screen — then you\u2019re done.' : 'Name and email to continue.');

    txt(root.querySelector('[data-rev-dates]'), c.getAttribute('data-range'));
    txt(root.querySelector('[data-rev-email]'), val('email') || '—');
    txt(root.querySelector('[data-rev-seats]'), String(state.seats));
    txt(root.querySelector('[data-rev-total]'), money(total()));
    if (btnPay) btnPay.disabled = !consent || !consent.checked;
  }

  applyVisibility();
  render();
  showPaidReturn();
})();


/* Agile Agilist — hero picker (3A). Vanilla, IIFE, no deps.
   Emits `aa:cohort-select` on document so the calendar below can adopt the choice
   (aa-calendar.js listens for it). Load AFTER aa-calendar.js on the page. */
(function () {
  var root = document.getElementById('aahero');
  if (!root) return;
  if (root.getAttribute('data-aa-bound')) return;   // see the guard note above
  root.setAttribute('data-aa-bound', '1');

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
    /* Both are optional. [data-hero-short] lived inside the old "Reserve
       <dates>" button, which the in-place checkout replaced — writing to it
       unguarded threw on every hero pick, and because the throw happened
       during parse it took the in-place checkout's own listeners down with
       it. A hero element this code does not own is an element it must test
       for. */
    if (elRange) elRange.textContent = card.getAttribute('data-range');
    if (elShort) elShort.textContent = card.getAttribute('data-short');
    if (emit !== false) {
      /* start and price travel with the pick so the in-place checkout can
         retarget itself without re-reading the DOM — and so a listener that
         only understands dates (the calendar) can follow along too. */
      document.dispatchEvent(new CustomEvent('aa:cohort-select', {
        detail: {
          cohort: card.getAttribute('data-cohort'),
          start:  card.getAttribute('data-start'),
          price:  parseInt(card.getAttribute('data-price'), 10) || 0,
          source: 'hero'
        }
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


/* ============================================================================
   IN-PLACE CHECKOUT — every [data-aa-inline] form on the page
   ----------------------------------------------------------------------------
   A batch can be chosen in three places: the hero picker, the schedule below,
   and the month calendar. Each of them now takes the money where it stands,
   instead of sending someone to a form elsewhere on the page to choose the
   same batch a second time.

   One handler for all of them, delegated from the document, so a form that
   arrives later — the calendar builds its panel in JS — is wired without
   anything having to re-run.

   WHAT IS SENT, AND WHAT IS NOT. The form posts a cohort id (or a course and
   a start date, which is all the calendar has), a seat count and an email.
   It does NOT post a price. data-price is on the form so the total can be
   shown while typing; the amount charged is looked up on the server from the
   same generated schedule. Editing data-price in devtools changes the number
   on screen and nothing about the charge.
   ========================================================================== */
(function () {
  var CFG = window.AA_REG || {};
  var MAX = 12;

  function money(n) {
    return (CFG.symbol || '$') + n.toLocaleString(CFG.locale || 'en-US');
  }
  function seatsOf(form) {
    return parseInt(form.getAttribute('data-seats') || '1', 10) || 1;
  }
  function paint(form) {
    // A form built by the calendar has no price of its own — the course price
    // from the config is the same number the server will charge.
    var price = parseInt(form.getAttribute('data-price'), 10) || CFG.price || 0;
    var n = seatsOf(form);
    var v = form.querySelector('[data-inline-seats-value]');
    var t = form.querySelector('[data-inline-total]');
    if (v) v.textContent = String(n);
    if (t) t.textContent = money(price * n);
  }

  /* Keep a form pointed at whatever its own component currently has selected.
     Exported so the pickers can call it; also driven by the shared
     aa:cohort-select event so a pick made anywhere updates every form. */
  function retarget(form, detail) {
    if (!form || !detail) return;
    /* A form whose component sets its own batch — the calendar panel, which
       rebuilds itself for whatever bar is selected — opts out. Otherwise a
       pick made elsewhere would silently repoint it at a different date than
       the one printed above it. */
    if (form.hasAttribute('data-aa-inline-fixed')) return;

    if (detail.cohort) {
      form.setAttribute('data-cohort', detail.cohort);
    } else if (detail.start) {
      /* A sender that knows only a date (the calendar) must CLEAR any batch id
         left by an earlier pick. The server resolves `cohort` before it looks
         at `start`, so a stale id would win and charge for the old batch while
         the form shows the new date. */
      form.removeAttribute('data-cohort');
    }
    if (detail.start) form.setAttribute('data-start', detail.start);
    if (detail.price) form.setAttribute('data-price', String(detail.price));
    paint(form);
  }
  window.AA_REG_RETARGET = retarget;

  document.addEventListener('click', function (e) {
    var step = e.target.closest && e.target.closest('[data-inline-seats]');
    if (!step) return;
    var form = step.closest('[data-aa-inline]');
    if (!form) return;
    var left = parseInt(form.getAttribute('data-seats-left'), 10);
    var cap = Math.min(MAX, isNaN(left) ? MAX : left);
    var n = seatsOf(form) + parseInt(step.getAttribute('data-inline-seats'), 10);
    form.setAttribute('data-seats', String(Math.min(cap, Math.max(1, n))));
    paint(form);
  });

  document.addEventListener('submit', function (e) {
    var form = e.target.closest && e.target.closest('[data-aa-inline]');
    if (!form) return;
    e.preventDefault();

    var note = form.querySelector('[data-inline-note]');
    var btn = form.querySelector('[data-inline-pay]');
    var email = (form.querySelector('[name="email"]') || {}).value || '';
    if (!/.+@.+\..+/.test(email.trim())) {
      if (note) note.textContent = 'Please enter a valid email address.';
      return;
    }
    if (!CFG.checkout) {
      if (note) note.textContent = CFG.msgUnavailable || 'Registration is not available right now.';
      return;
    }

    var payload = { seats: seatsOf(form), email: email.trim() };
    var cohort = form.getAttribute('data-cohort');
    if (cohort) payload.cohort = cohort;
    // The calendar has a date, not one of our ids — the server resolves it.
    if (form.getAttribute('data-start')) {
      payload.course = CFG.course;
      payload.start = form.getAttribute('data-start');
    }

    var was = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = CFG.msgSending || 'Taking you to Stripe…'; }

    fetch(CFG.checkout, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': CFG.nonce || '' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, body: j }; });
    }).then(function (res) {
      if (res.ok && res.body && res.body.url) { window.location.assign(res.body.url); return; }
      throw new Error((res.body && res.body.message) || 'checkout failed');
    }).catch(function (err) {
      if (btn) { btn.disabled = false; btn.textContent = was; }
      if (note) note.textContent = (err && err.message) || CFG.msgError || 'We could not start checkout.';
    });
  });

  // A pick made anywhere retargets every in-place form on the page.
  document.addEventListener('aa:cohort-select', function (e) {
    if (!e.detail) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-aa-inline]'), function (f) {
      retarget(f, e.detail);
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-aa-inline]'), paint);
})();
