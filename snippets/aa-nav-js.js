/* ==================== AA — NAV JS (v14, consolidated) ====================
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
       window.location on click.

   v13 changelog:
     - Parent-click fix strengthened after live test showed it still not
       working: (a) the parents are "#" placeholders, so v12.2's "real URL
       only" guard skipped them — added a label->section fallback
       (Services->/services/, About->/about/, etc.); (b) moved the listener
       to CAPTURE phase and use stopImmediatePropagation so we navigate
       before the theme's own toggle handler can eat the click.
     - (paired with aa-global-appendix.css v13, which adds order:-1 so the
       flagship band is always the top item in the panel.)

   v14 changelog:
     - Fixed "mega panel stays open on top of the page / hero not clickable".
       The old close was a single 240ms timeout that could get skipped if the
       cursor ended up over the (large, fixed) open panel. Added authoritative
       closes: (a) a document-level mouseover that closes the moment the
       cursor is over anything that isn't a mega tab/panel; (b) close on page
       scroll; (c) close on Escape; (d) close on any click outside the mega
       system. The panel can no longer get stuck open over the page.
     - CSS side unchanged this round — aa-global-appendix.css stays v13.
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
    /* section landing pages, used as a fallback when a mega parent's own link
       is a "#" placeholder (common — the item exists just to hold the dropdown).
       Matched against the parent's visible label, case-insensitively. */
    var SECTION = { services:'/services/', assessments:'/assessments/', training:'/training/', about:'/about/' };
    function topLink(tab){
      var k=tab.children;
      for(var i=0;i<k.length;i++){ if(k[i].tagName==='A') return k[i]; }
      return tab.querySelector(':scope > a');
    }
    function targetHref(a){
      if(!a) return null;
      var h=a.getAttribute('href');
      /* 1) a real URL on the link itself wins */
      if(h && h!=='#' && h.charAt(h.length-1)!=='#' && h.indexOf('javascript:')!==0) return a.href;
      /* 2) otherwise fall back to the section landing page by label */
      var t=(a.textContent||'').trim().toLowerCase();
      for(var key in SECTION){ if(t.indexOf(key)!==-1) return SECTION[key]; }
      return null;
    }
    tabs.forEach(function(tab){
      var panel=tab.querySelector(':scope > .sub-menu');
      tab.addEventListener('mouseenter', function(){ open(tab); });
      tab.addEventListener('mouseleave', schedule);
      tab.addEventListener('focusin', function(){ open(tab); });
      tab.addEventListener('focusout', schedule);
      if(panel){ panel.addEventListener('mouseenter', function(){ clearTimeout(timer); }); panel.addEventListener('mouseleave', schedule); }

      /* make the top-level parent link NAVIGATE on click. The mega opens on
         hover; a click on "Services"/"About"/etc. should go to /services/,
         /about/, ... This menu setup swallows that click (the parent is a
         "#" toggle), so we force it. Attached in CAPTURE phase so we win
         before any theme handler can preventDefault/toggle. */
      var a=topLink(tab);
      if(a){
        a.addEventListener('click', function(e){
          if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button!==0) return; /* let new-tab clicks pass */
          var href=targetHref(a);
          if(!href) return;               /* genuinely no destination — leave alone */
          e.preventDefault();
          e.stopImmediatePropagation();
          window.location.assign(href);
        }, true);
      }
    });
    header.querySelectorAll('.main-header-menu > .menu-item:not(.aa-mega)').forEach(function(li){ li.addEventListener('mouseenter', closeAll); });
    window.addEventListener('resize', function(){ var o=header.querySelector('.menu-item.aa-mega.aa-open'); if(o) place(o); });

    /* ---- authoritative close (fixes "panel stays open on top of the page,
       hero not clickable"). The 240ms timeout above is only a soft grace
       period; these guarantee the panel can never get stuck open: ---- */
    function anyOpen(){ return header.querySelector('.menu-item.aa-mega.aa-open'); }
    /* if the pointer is anywhere that is NOT a mega tab or its panel, close.
       (the open panel is a DOM child of .menu-item.aa-mega, so hovering it
       still counts as "inside" and keeps it open — only real page content
       triggers the close.) */
    document.addEventListener('mouseover', function(e){
      if(!anyOpen()) return;
      var t=e.target;
      if(t && t.closest && t.closest('.main-header-menu > .menu-item.aa-mega, .menu-item.aa-mega')){ clearTimeout(timer); }
      else { schedule(); }
    }, true);
    /* scrolling the page, Escape, or a click outside the mega system all
       close immediately */
    window.addEventListener('scroll', function(){ if(anyOpen()) closeAll(); }, {passive:true});
    document.addEventListener('keydown', function(e){ if(e.key==='Escape'||e.keyCode===27) closeAll(); });
    document.addEventListener('click', function(e){
      if(!anyOpen()) return;
      var t=e.target;
      if(!t || !t.closest || !t.closest('.menu-item.aa-mega')) closeAll();
    }, true);
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
