/* ============================================================================
   AA — COURSE FAQ (design 1A) behaviour
   ----------------------------------------------------------------------------
   WPCode -> JavaScript Snippet, "AA – Course FAQ JS", Site Wide Footer.

   Two variables, exactly as the handoff specifies:
       cat   the active category
       open  the open card within it, or none

   Category click  -> {cat: clicked, open: first}
   Question click  -> {open: isOpen ? none : this}

   EVERY answer is in the DOM and every answer stays there. The category
   filter toggles `hidden` on cards it is not showing, and an answer that is
   not open is `hidden` rather than removed. That is deliberate and is the
   handoff's own instruction: a crawler, a screen reader in browse mode, and
   anything reading the page as text still get all sixteen answers, and
   Ctrl-F still finds them.
   ============================================================================ */
(function () {
  'use strict';

  var root = document.querySelector('.aa-fq');
  if (!root) { return; }

  /* DOUBLE-RUN GUARD — a second copy of this snippet would bind every tab and
     every question twice, and each click would toggle then untoggle. */
  if (root.getAttribute('data-fq-bound')) { return; }
  root.setAttribute('data-fq-bound', '1');

  var tabs  = Array.prototype.slice.call(root.querySelectorAll('[data-fq-cat]'));
  var cards = Array.prototype.slice.call(root.querySelectorAll('[data-fq-item]'));
  if (!cards.length) { return; }

  function cardsOf(cat) {
    return cards.filter(function (c) { return c.getAttribute('data-fq-of') === cat; });
  }

  function setOpen(card, on) {
    card.classList.toggle('is-open', on);
    var btn = card.querySelector('.aa-fq-q');
    var ans = card.querySelector('.aa-fq-a');
    if (btn) { btn.setAttribute('aria-expanded', on ? 'true' : 'false'); }
    if (ans) { ans.hidden = !on; }
  }

  function open(card) {
    /* One at a time, and only within the visible category — closing cards in
       a category nobody is looking at would leave it collapsed the next time
       that tab is opened, and the section is never meant to show an
       all-closed state. */
    cardsOf(card.getAttribute('data-fq-of')).forEach(function (c) {
      setOpen(c, c === card);
    });
  }

  function showCategory(cat) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-fq-cat') === cat;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });

    var list = cardsOf(cat);
    cards.forEach(function (c) { c.hidden = c.getAttribute('data-fq-of') !== cat; });
    // Opening the first question of the new category is what stops the panel
    // reading as empty the moment a category is chosen.
    if (list.length) { open(list[0]); }
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () { showCategory(t.getAttribute('data-fq-cat')); });
  });

  cards.forEach(function (c) {
    var btn = c.querySelector('.aa-fq-q');
    if (!btn) { return; }
    btn.addEventListener('click', function () {
      if (c.classList.contains('is-open')) { setOpen(c, false); }
      else { open(c); }
    });
  });
})();

/* ----------------------------------------------------------------------------
   Closing band: "Enroll now" goes to the registration, not to an anchor above
   it. #enroll is the id of the whole cohorts SECTION, so the jump lands on its
   heading with the form still off screen — the same thing that made the home
   page's Reserve button look like it had done nothing.
   -------------------------------------------------------------------------- */
(function () {
  'use strict';
  var link = document.querySelector('[data-fb2-enrol]');
  if (!link) { return; }

  link.addEventListener('click', function (e) {
    var target = document.getElementById('aacal') ||
                 document.getElementById('aahero') ||
                 document.getElementById('enroll');
    if (!target) { return; }   // no registration on this page; follow the href
    e.preventDefault();
    try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    catch (err) { target.scrollIntoView(); }
  });
})();
