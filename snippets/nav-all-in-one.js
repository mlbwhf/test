/* ==================== AA — NAV JS (combined) ====================
   ONE WPCode JavaScript snippet (Auto Insert -> Site-Wide Footer).
   Replaces BOTH the old "JS-Mobile global Nav" (desktop mega-menu hover +
   positioning) AND the "NAV - MOBILE ACCORDION" snippet.
   Two independent modules, no shared state, no conflict:
     • Module 1 runs on desktop (min-width:922px) — mega-menu hover-intent.
     • Module 2 runs on mobile (max-width:921px) — tappable accordion.
   Pairs with the NAV FIX + NAV MOBILE ACCORDION CSS in Additional CSS.
   ================================================================ */

/* ---------- Module 1 — desktop mega-menu (hover-intent + contained card) ---------- */
(function(){
  var MAXW = 940;
  function setHdr(){
    var m=document.getElementById('masthead');
    if(m){ document.documentElement.style.setProperty('--aa-hdr', Math.round(m.getBoundingClientRect().bottom)+'px'); }
  }
  function place(tab){
    var panel = tab.querySelector(':scope > .sub-menu'); if(!panel) return;
    var w = Math.min(MAXW, window.innerWidth - 40);
    var r = tab.getBoundingClientRect();
    var left = r.left + r.width/2 - w/2;                 // center under the tab
    left = Math.max(16, Math.min(left, window.innerWidth - 16 - w)); // clamp to viewport
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
    tabs.forEach(function(tab){
      var panel=tab.querySelector(':scope > .sub-menu');
      tab.addEventListener('mouseenter', function(){ open(tab); });
      tab.addEventListener('mouseleave', schedule);
      tab.addEventListener('focusin', function(){ open(tab); });
      tab.addEventListener('focusout', schedule);
      if(panel){ panel.addEventListener('mouseenter', function(){ clearTimeout(timer); }); panel.addEventListener('mouseleave', schedule); }
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
