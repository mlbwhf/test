/* ==================== AA — NAV JS (v12.2, consolidated) ====================
   ONE WPCode JavaScript snippet: "AA – Nav JS"
   Auto Insert -> Site-Wide Footer.

   ****************************************************************************
   * Go to Code Snippets and DEACTIVATE every other snippet that touches the *
   * nav, mega-menu, mobile accordion, or breadcrumb before activating this. *
   * Do not just add this one alongside the others.                          *
   ****************************************************************************

   Why this matters: this file guards against re-inserting its own elements
   with `if(document.getElementById('aa-crumb-wrap')) return;` (same idea for
   the utility strip and mobile chevrons). If an OLD breadcrumb/nav script is
   still active too, whichever script's DOMContentLoaded handler happens to
   run FIRST wins and the other is silently skipped by that guard. This is
   exactly what was seen live: an old script still handles the routes it
   recognizes (About, FAQ, Customers — rendering the OLD "<- Back to Home"
   1-level link) and blocks this file from running there, while this file
   only got to run on routes the old script didn't have a route for (deep
   Training pages), rendering the NEW full-path breadcrumb correctly. Both
   were active at once. Turn off every one of the following:
     Live WPCode snippets confirmed active on-site:
       "hover-intent" (id 28796), "JS-Mobile global Nav" (id 28830),
       "Mobile-nav accordion" (id 28840), any snippet named "aa-breadcrumb"
       or similar if one exists separately from those three.
     Repo files (history only, not live WPCode snippets — for reference):
       nav-all-in-one.js, nav-mega-hover-intent.js (dead duplicate of module 1
       below), nav-mobile-accordion.js (dead duplicate of module 2 below),
       nav-2a-utility-strip.js, aa-breadcrumb.js

   Four independent modules, no shared state:
     1. Desktop (min-width:922px) — mega-menu hover-intent + panel placement
     2. Mobile (max-width:921px) — tappable accordion
     3. Utility strip injector — dark strip above #masthead (2A)
     4. Breadcrumb injector — pill above the utility strip (must run AFTER
        module 3 so it inserts itself before the strip, not the masthead)
   Pairs with the single "AA – Global CSS" appendix (aa-global-appendix.css).

   v9 changelog (live-QA fixes):
     - Module 1 place(tab): dropdown panel now centers on the site's
       1280px content column (viewport-centered, capped at 1280px) instead
       of centering under whichever tab is hovered — fixes Services'
       mega-menu drifting off the page's actual content edges.

   v10 changelog:
     - Module 4 rebuilt: was a 1-level "back to parent" link, not a real
       breadcrumb. buildChain() now walks MAP up to Home and renders every
       ancestor as a link ("Home / Services / Operating Model / ..."),
       ending in the current page as a non-link pill. Works for MAP entries
       and the dynamic /training/ resolver (both recurse through resolve()).

   v12 changelog:
     - buildChain()/place() logic unchanged from v10. Bumped to match
       aa-global-appendix.css v12 (now a full REPLACE, not an append) and
       added the deactivate-everything-else warning above, since the root
       cause of "nothing I paste seems to change anything" turned out to be
       old JS snippets still running alongside this one, not a bug here.
     - Removed `dark:true` from the `/about/` MAP entry only (About page's
       breadcrumb was reported "all teal" — the dark navy variant with every
       crumb in some shade of teal read as a flat block once v10 added the
       full path chain; the light variant used everywhere else now applies
       to About too). FAQ/Customers/Agile Maturity still use dark — not
       reported as an issue, left as-is.

   v12.2 changelog:
     - Module 1: top-level mega parents (Services, Assessments, Training,
       About) now NAVIGATE to their own landing page on click. The mega
       still opens on hover, but a click on the parent used to do nothing
       (items-with-children swallow the click in this setup). We now force
       window.location on click — but only when the item has a real URL, so
       genuine "#" placeholder parents are left alone. Modifier-clicks
       (cmd/ctrl/shift/middle) fall through to the browser's new-tab handling.
   ========================================================================== */

/* ---------- Module 1 — desktop mega-menu (hover-intent + contained card) ---------- */
(function(){
  var CONTENT_MAX = 1280, SIDE_PAD = 30; /* matches the site's own content container (max-width:1280px, 30px side padding) */
  var hdrTicking=false, lastHdr=-1;
  function readWriteHdr(){
    hdrTicking=false;
    var m=document.getElementById('masthead'); if(!m) return;
    var b=Math.round(m.getBoundingClientRect().bottom);
    if(b!==lastHdr){ lastHdr=b; document.documentElement.style.setProperty('--aa-hdr', b+'px'); }
  }
  function setHdr(){ if(!hdrTicking){ hdrTicking=true; (window.requestAnimationFrame||function(f){setTimeout(f,16);})(readWriteHdr); } }
  function place(tab){
    /* v9: align to the page's content column (centered on the viewport, capped
       at 1280px) instead of centering under the hovered tab — v8 drifted off
       the site's actual content edges depending on which tab was open. */
    var panel = tab.querySelector(':scope > .sub-menu'); if(!panel) return;
    var w = Math.min(CONTENT_MAX - SIDE_PAD*2, window.innerWidth - SIDE_PAD*2);
    var left = Math.max(SIDE_PAD, (window.innerWidth - w) / 2);
    panel.style.setProperty('left', left+'px', 'important');
    panel.style.setProperty('right', 'auto', 'important');
    panel.style.setProperty('width', w+'px', 'important');
    panel.style.setProperty('transform', 'none', 'important');
  }
  function init(){
    setHdr();
    window.addEventListener('resize', setHdr);
    window.addEventListener('scroll', setHdr, {passive:true});
    if(!window.matchMedia || !window.matchMedia('(min-width:922px)').matches) return;
    var header=document.getElementById('masthead'); if(!header) return;
    var tabs=header.querySelectorAll('.main-header-menu > .menu-item.aa-mega'); if(!tabs.length) return;
    var timer;
    function closeAll(){ tabs.forEach(function(t){ t.classList.remove('aa-open'); }); }
    function open(tab){ clearTimeout(timer); tabs.forEach(function(t){ if(t!==tab) t.classList.remove('aa-open'); }); setHdr(); place(tab); tab.classList.add('aa-open'); }
    function schedule(){ clearTimeout(timer); timer=setTimeout(closeAll,240); }
    function topLink(tab){
      var k=tab.children;
      for(var i=0;i<k.length;i++){ if(k[i].tagName==='A') return k[i]; }
      return tab.querySelector(':scope > a');
    }
    function realHref(a){
      if(!a) return null;
      var h=a.getAttribute('href');
      if(!h || h==='#' || h.charAt(h.length-1)==='#' || h.indexOf('javascript:')===0) return null;
      return a.href; /* resolved absolute URL */
    }
    tabs.forEach(function(tab){
      var panel=tab.querySelector(':scope > .sub-menu');
      tab.addEventListener('mouseenter', function(){ open(tab); });
      tab.addEventListener('mouseleave', schedule);
      tab.addEventListener('focusin', function(){ open(tab); });
      tab.addEventListener('focusout', schedule);
      if(panel){ panel.addEventListener('mouseenter', function(){ clearTimeout(timer); }); panel.addEventListener('mouseleave', schedule); }

      /* make the top-level parent link navigate to its OWN page on click.
         The mega opens on hover; a click on "Services"/"About"/etc. should go
         to /services/, /about/, ... Some theme/menu setups swallow that click
         (toggle behaviour on items-with-children), so we force it here — but
         only when the item has a real URL (not "#" placeholder parents). */
      var a=topLink(tab), href=realHref(a);
      if(a && href){
        a.addEventListener('click', function(e){
          /* let modifier-clicks (new tab / download) behave normally */
          if(e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button!==0) return;
          e.preventDefault();
          e.stopPropagation();
          window.location.assign(href);
        });
      }
    });
    header.querySelectorAll('.main-header-menu > .menu-item:not(.aa-mega)').forEach(function(li){ li.addEventListener('mouseenter', closeAll); });
    window.addEventListener('resize', function(){ var o=header.querySelector('.menu-item.aa-mega.aa-open'); if(o) place(o); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

/* ---------- Module 2 — mobile accordion (chevron toggles, both render modes) ---------- */
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
  function directSub(li){var k=li.children;for(var i=0;i<k.length;i++){if(k[i].classList&&k[i].classList.contains('sub-menu'))return k[i];}return null;}
  function directChevron(li){var k=li.children;for(var i=0;i<k.length;i++){if(k[i].classList&&k[i].classList.contains('aa-mchevron'))return k[i];}return null;}
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
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', run); } else { run(); }
  if (MQ.addEventListener) MQ.addEventListener('change', run);
  document.addEventListener('click', function (e) {
    if (e.target.closest('.menu-toggle, .ast-mobile-menu-trigger-fill, .ast-mobile-menu-buttons, [class*="menu-toggle"]')) { setTimeout(wire, 350); }
  }, true);
  if (window.MutationObserver) {
    var mo = new MutationObserver(function () { if (MQ.matches) wire(); });
    mo.observe(document.body, { childList: true, subtree: true });
  }
})();

/* ---------- Module 3 — utility strip injector (2A) ---------- */
(function(){
  function build(){
    if(document.getElementById('aa-utilstrip')) return;
    var m = document.getElementById('masthead'); if(!m) return;
    var d = document.createElement('div');
    d.id = 'aa-utilstrip';
    d.className = 'aa-utilstrip';
    d.innerHTML =
      '<div class="aa-utilstrip-in">' +
        '<span class="u-partner">Scaled Agile Gold Partner</span>' +
        '<span class="u-dot">&middot;</span>' +
        '<span class="u-rating"><span class="u-star">&#9733;</span> 4.9/5 &middot; 2,500+ leaders trained</span>' +
        '<span class="u-right">' +
          '<a class="u-phone" href="tel:+16479997433">+1 (647) 999-7433</a>' +
          '<span class="u-div"></span>' +
          '<a class="u-signin" href="/sign-in/">' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
            ' Sign in' +
          '</a>' +
        '</span>' +
      '</div>';
    m.parentNode.insertBefore(d, m);
  }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', build); } else { build(); }
})();

/* ---------- Module 4 — breadcrumb injector (runs after Module 3) ---------- */
(function(){
  var MAP = {
    '/':                                    { hidden: true },

    '/about/':                              { parent: '/',          parentLabel: 'Home',        label: 'About' },
    '/about/faq/':                          { parent: '/about/',    parentLabel: 'About',       label: 'FAQ',                   dark: true },
    '/about/contact/':                      { parent: '/about/',    parentLabel: 'About',       label: 'Contact' },

    '/customers/':                          { parent: '/about/',    parentLabel: 'About',       label: 'Customers',             dark: true },

    '/services/':                           { parent: '/',          parentLabel: 'Home',        label: 'Services' },
    '/services/business-agility/':          { parent: '/services/', parentLabel: 'Services',    label: 'Business Agility' },
    '/services/digital-transformation/':    { parent: '/services/', parentLabel: 'Services',    label: 'Digital Transformation' },
    '/services/product-operating-model/':   { parent: '/services/', parentLabel: 'Services',    label: 'Product Operating Model' },
    '/services/innovation-culture/':        { parent: '/services/', parentLabel: 'Services',    label: 'Innovation Culture' },
    '/services/operating-model/':           { parent: '/services/', parentLabel: 'Services',    label: 'Operating Model' },
    '/services/scaling-iterative-model/':   { parent: '/services/operating-model/', parentLabel: 'Operating Model', label: 'Scaling Iterative Model' },
    '/services/ai-native-operating-model/': { parent: '/services/operating-model/', parentLabel: 'Operating Model', label: 'AI-Native' },
    '/services/mutation/':                  { parent: '/services/operating-model/', parentLabel: 'Operating Model', label: 'Mutation' },
    '/services/ai-automation/':             { parent: '/services/operating-model/', parentLabel: 'Operating Model', label: 'AI Automation' },

    '/assessments/':                        { parent: '/',              parentLabel: 'Home',        label: 'Assessments' },
    '/assessments/agile-maturity/':         { parent: '/assessments/',  parentLabel: 'Assessments', label: 'Agile Maturity',     dark: true },
    '/assessments/cert-recommender/':       { parent: '/assessments/',  parentLabel: 'Assessments', label: 'Career Selector' },
    '/assessments/mutation-readiness/':     { parent: '/assessments/',  parentLabel: 'Assessments', label: 'Mutation Readiness' },

    '/training/':                           { parent: '/',          parentLabel: 'Home',        label: 'Training' }
  };

  function toTitle(slug){
    return slug.replace(/-/g,' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  }
  function pathnameNormalized(){
    var p = location.pathname || '/';
    if(!/\/$/.test(p)) p += '/';
    return p;
  }
  function resolve(path){
    if(MAP[path]) return MAP[path];
    if(path.indexOf('/training/') === 0){
      var parts = path.split('/').filter(Boolean);
      if(parts.length === 2){
        return { parent: '/training/', parentLabel: 'Training', label: toTitle(parts[1]) };
      }
      if(parts.length >= 3){
        var parent = '/training/' + parts[1] + '/';
        return { parent: parent, parentLabel: toTitle(parts[1]), label: toTitle(parts[2]) };
      }
    }
    return null;
  }
  function buildChain(path){
    var m = resolve(path);
    if(!m || m.hidden) return null;
    var chain = [{ href: path, label: m.label, current: true }];
    var parentPath = m.parent, parentLabel = m.parentLabel;
    while(parentPath){
      chain.unshift({ href: parentPath, label: parentLabel, current: false });
      if(parentPath === '/') break;
      var pm = resolve(parentPath);
      if(!pm || pm.hidden) break;
      parentPath = pm.parent;
      parentLabel = pm.parentLabel;
    }
    return chain;
  }
  function build(){
    if(document.getElementById('aa-crumb-wrap')) return;
    var path = pathnameNormalized();
    var chain = buildChain(path);
    if(!chain) return;
    var m = resolve(path);

    var mast = document.getElementById('masthead') || document.querySelector('header#masthead') || document.querySelector('header.site-header');
    if(!mast) return;

    var crumbsHtml = chain.map(function(node){
      if(node.current){
        return '<span class="aa-crumb-here">' + node.label + '</span>';
      }
      return '<a href="' + node.href + '" class="aa-crumb-link">' + node.label + '</a>' +
             '<span class="aa-crumb-sep" aria-hidden="true">/</span>';
    }).join('');

    var wrap = document.createElement('div');
    wrap.id = 'aa-crumb-wrap';
    wrap.className = 'aa-crumb-wrap' + (m.dark ? ' is-dark' : '');
    wrap.innerHTML =
      '<div class="aa-crumb-in">' +
        '<nav aria-label="Breadcrumb" class="aa-crumb mono">' + crumbsHtml + '</nav>' +
      '</div>';

    var util = document.getElementById('aa-utilstrip');
    var target = util || mast;
    target.parentNode.insertBefore(wrap, target);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
