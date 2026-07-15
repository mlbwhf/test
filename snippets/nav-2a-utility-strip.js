/* ============================================================
   AA — GLOBAL NAV 2A · Utility strip injector
   WPCode: JavaScript snippet, Auto Insert -> Site-Wide Footer.
   Adds the slim dark utility strip ABOVE the Astra header (#masthead).
   Pairs with the "NAV 2A" CSS in "AA – Global CSS".
   NOT PUBLISHED — queued for deploy after migration.
   ============================================================ */
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
