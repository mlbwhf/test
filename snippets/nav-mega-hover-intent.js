<script>
/* AA — Mega-menu: measure header -> --aa-hdr (flush), hover-intent (stay open),
   and position a CONTAINED card under the hovered tab (clamped to viewport). */
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
</script>
