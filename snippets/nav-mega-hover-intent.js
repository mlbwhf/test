<script>
/* AA — Mega-menu: (1) measure the real header height into --aa-hdr so the panel sits
   FLUSH under the nav (no gap/eyebrow strip between them); (2) hover-intent so the panel
   stays open while the cursor is over the tab OR the panel (240ms grace to cross). */
(function(){
  function setHdr(){
    var m=document.getElementById('masthead');
    if(m){ document.documentElement.style.setProperty('--aa-hdr', Math.round(m.getBoundingClientRect().bottom)+'px'); }
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
    function open(tab){ clearTimeout(timer); tabs.forEach(function(t){ if(t!==tab) t.classList.remove('aa-open'); }); tab.classList.add('aa-open'); setHdr(); }
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
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
</script>
