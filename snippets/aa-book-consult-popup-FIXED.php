<?php
/**
 * WPCode Snippet — "AA – Book a Consult popup (modal + form)" — FIXED VERSION
 *
 * BUG FIXED: the original had a nested/broken shortcode:
 *     do_shortcode('[fluentform id="[fluentform id="5"]"]')
 *   which renders literal broken text instead of the form.
 *   Corrected to: do_shortcode('[fluentform id="5"]')
 *
 * Everything else unchanged. Replace the snippet's code with this file in
 * WPCode and re-save.
 */
add_action('wp_footer', function () {
    if (is_admin()) return;
    $form = do_shortcode('[fluentform id="5"]');
    echo <<<HTML
<div id="aa-book-modal" class="aa-book-modal" hidden>
  <div class="aa-book-overlay" data-aa-close></div>
  <div class="aa-book-card" role="dialog" aria-modal="true" aria-label="Book a consult">
    <button type="button" class="aa-book-x" data-aa-close aria-label="Close">&times;</button>
    <div class="aa-book-head">
            <span class="aa-book-logo"><img src="https://agile-agilist.com/wp-content/uploads/2025/07/AA-SAFe-Brankd-color.png" alt="Agile Agilist"></span>
      <h3>Book a consult</h3>
      <p>Tell us about your goals — we'll be in touch.</p>
    </div>
    $form
  </div>
</div>
<script>
(function(){
  var m=document.getElementById('aa-book-modal'); if(!m) return;
  function open(e){ if(e) e.preventDefault(); m.hidden=false; document.body.style.overflow='hidden'; }
  function close(){ m.hidden=true; document.body.style.overflow=''; }
  document.addEventListener('click', function(e){
    if(e.target.closest('.aa-book, a[href="#aa-book"]')){ open(e); return; }
    if(e.target.closest('[data-aa-close]')){ close(); }
  });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') close(); });
})();
</script>
HTML;
});
