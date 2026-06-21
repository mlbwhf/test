/* Agile Agilist — header interactions: mega-menu (hover + click + keyboard), mobile drawer.
   Vanilla JS, no dependencies. Enqueue in footer. */
(function () {
  'use strict';

  // ---- Training mega-menu: hover is CSS; JS adds click + keyboard + a11y ----
  document.querySelectorAll('.aa-menu-item.has-mega').forEach(function (item) {
    var link = item.querySelector('.aa-link');
    var mega = item.querySelector('.aa-mega');
    if (!link || !mega) return;
    var closeTimer;

    function open() {
      clearTimeout(closeTimer);
      mega.classList.add('is-open');
      link.setAttribute('aria-expanded', 'true');
    }
    function close() {
      mega.classList.remove('is-open');
      link.setAttribute('aria-expanded', 'false');
    }
    function closeSoon() { closeTimer = setTimeout(close, 120); }

    // Click toggles (also handles touch + lets keyboard users open without navigating immediately)
    link.addEventListener('click', function (e) {
      // allow real navigation on a second click / when already open
      if (mega.classList.contains('is-open')) return; // go to /training/
      e.preventDefault();
      open();
    });

    // Hover intent (mirrors CSS but keeps aria in sync + adds close delay)
    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', closeSoon);
    mega.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });

    // Keyboard: Escape closes and returns focus; focus leaving the item closes
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(); link.focus(); }
    });
    item.addEventListener('focusout', function (e) {
      if (!item.contains(e.relatedTarget)) close();
    });
  });

  // ---- Mobile drawer ----
  var burger = document.querySelector('.aa-burger');
  var drawer = document.getElementById('aa-drawer');
  if (burger && drawer) {
    function setDrawer(open) {
      drawer.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function () {
      setDrawer(!drawer.classList.contains('is-open'));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) { setDrawer(false); burger.focus(); }
    });
    // Accordion inside the drawer
    drawer.querySelectorAll('.aa-drawer-toggle').forEach(function (btn) {
      var sub = btn.nextElementSibling;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        btn.querySelector('span').textContent = open ? '+' : '\u2013';
        if (sub) sub.hidden = open;
      });
    });
  }
})();
