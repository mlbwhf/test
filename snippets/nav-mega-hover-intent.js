<script>
/* AA — Mega-menu hover-intent. Keeps each .aa-mega panel open while the cursor is
   over the tab OR the panel, with a short close delay so the gap can be crossed.
   Deterministic replacement for the CSS :hover bridge. Desktop only. */
(function(){
  function init(){
    if(!window.matchMedia || !window.matchMedia('(min-width:922px)').matches) return;
    var header = document.getElementById('masthead');
    if(!header) return;
    var tabs = header.querySelectorAll('.main-header-menu > .menu-item.aa-mega');
    if(!tabs.length) return;
    var timer;
    function closeAll(){ tabs.forEach(function(t){ t.classList.remove('aa-open'); }); }
    function open(tab){ clearTimeout(timer); tabs.forEach(function(t){ if(t!==tab) t.classList.remove('aa-open'); }); tab.classList.add('aa-open'); }
    function schedule(){ clearTimeout(timer); timer = setTimeout(closeAll, 240); }
    tabs.forEach(function(tab){
      var panel = tab.querySelector(':scope > .sub-menu');
      tab.addEventListener('mouseenter', function(){ open(tab); });
      tab.addEventListener('mouseleave', schedule);
      tab.addEventListener('focusin', function(){ open(tab); });
      tab.addEventListener('focusout', schedule);
      if(panel){
        panel.addEventListener('mouseenter', function(){ clearTimeout(timer); });
        panel.addEventListener('mouseleave', schedule);
      }
    });
    /* hovering a non-mega top item closes any open mega */
    header.querySelectorAll('.main-header-menu > .menu-item:not(.aa-mega)').forEach(function(li){
      li.addEventListener('mouseenter', closeAll);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
</script>
