/* ==================== NAV — MOBILE ACCORDION (v7) ====================
   WPCode → JavaScript snippet, Auto Insert → Site Wide Footer.
   Adds one tappable chevron to every parent menu item on mobile and toggles
   its submenu (accordion). Works in BOTH mobile render modes (inline header and
   Astra's off-canvas drawer), so the menu behaves identically on every page.
   Pairs with nav-mobile-accordion.css.
   ==================================================================== */
(function () {
  var MQ = window.matchMedia('(max-width:921px)');

  function parents() {
    return document.querySelectorAll(
      '#masthead li.menu-item-has-children,' +
      '.ast-mobile-popup-drawer li.menu-item-has-children,' +
      '.ast-mobile-header-content li.menu-item-has-children,' +
      '#ast-mobile-header li.menu-item-has-children,' +
      '.main-navigation li.menu-item-has-children'
    );
  }

  function directSub(li) {
    var kids = li.children;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].classList && kids[i].classList.contains('sub-menu')) return kids[i];
    }
    return null;
  }
  function directChevron(li) {
    var kids = li.children;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].classList && kids[i].classList.contains('aa-mchevron')) return kids[i];
    }
    return null;
  }

  function wire() {
    if (!MQ.matches) return;
    parents().forEach(function (li) {
      if (li.getAttribute('data-aa-acc')) return;
      if (!directSub(li)) return;
      li.setAttribute('data-aa-acc', '1');

      var chev = document.createElement('button');
      chev.type = 'button';
      chev.className = 'aa-mchevron';
      chev.setAttribute('aria-label', 'Expand submenu');
      chev.setAttribute('aria-expanded', 'false');
      chev.innerHTML = '<span class="aa-mchevron-i" aria-hidden="true"></span>';

      chev.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var open = li.classList.toggle('aa-mopen');
        chev.setAttribute('aria-expanded', open ? 'true' : 'false');
        // accordion: close siblings at the same level
        var pl = li.parentElement;
        if (pl) {
          Array.prototype.forEach.call(pl.children, function (sib) {
            if (sib !== li && sib.classList && sib.classList.contains('aa-mopen')) {
              sib.classList.remove('aa-mopen');
              var c = directChevron(sib);
              if (c) c.setAttribute('aria-expanded', 'false');
            }
          });
        }
      });

      li.appendChild(chev);
    });
  }

  function run() { if (MQ.matches) wire(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
  if (MQ.addEventListener) MQ.addEventListener('change', run);

  // Astra injects / animates the drawer only when the hamburger is tapped — re-wire then.
  document.addEventListener('click', function (e) {
    if (e.target.closest('.menu-toggle, .ast-mobile-menu-trigger-fill, .ast-mobile-menu-buttons, [class*="menu-toggle"]')) {
      setTimeout(wire, 350);
    }
  }, true);

  // Safety net: catch late-injected menus.
  if (window.MutationObserver) {
    var mo = new MutationObserver(function () { if (MQ.matches) wire(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }
})();
