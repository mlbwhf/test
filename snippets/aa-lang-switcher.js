/* ============================================================
   Agile Agilist — Language Switcher + Smart Redirect
   ------------------------------------------------------------
   HOW TO INSTALL (once):
   wp-admin → Code Snippets (WPCode) → Add Snippet → "Add Your Custom Code"
   → type: JavaScript Snippet → paste EVERYTHING below → Insertion:
   "Auto Insert", location "Site Wide Footer" → Save & Activate.
   Name it "AA – Language Switcher".

   WHAT IT DOES
   - Injects a small EN · ES · FR · ع switcher into the header (top-right).
   - English is the DEFAULT and canonical language. English URLs are never
     altered — ads/tracking keep pointing at them.
   - Optional auto-redirect: a FIRST-TIME visitor whose browser language is
     Spanish/French/Arabic is sent to that language's version — but ONLY when
     it is safe (see guards). Set AUTO_REDIRECT=false to disable.

   AD & SEO SAFETY GUARDS (auto-redirect is skipped when ANY apply)
   - The URL carries ad/tracking params (gclid, gbraid, wbraid, fbclid,
     msclkid, or any utm_*)  → ad landings always stay on the English page.
   - The visitor already has an aa_lang choice cookie (so we never loop and
     never override a manual choice).
   - The page is already a /es/ /fr/ /ar/ page.
   - No published translation exists for the current page.
   NOTE: browser-language auto-redirect is a trade-off for SEO. The manual
   switcher works regardless; if you prefer, set AUTO_REDIRECT=false and keep
   only the manual switcher.
   ============================================================ */
(function () {
  var AUTO_REDIRECT = true;              // set false to keep only the manual switcher

  var LANGS = [
    { code: 'en', label: 'EN', home: '/' },
    { code: 'es', label: 'ES', home: '/es/' },
    { code: 'fr', label: 'FR', home: '/fr/' },
    { code: 'ar', label: 'ع', home: '/ar/', rtl: true }  // ع
  ];

  /* English path  ->  translated paths.
     Extend this map as pages are published. Only include LIVE (published)
     translations; a draft target would 404 for logged-out visitors. */
  var MAP = {
    '/training/safe/sa/':           { es: '/es/liderando-safe-sa/', fr: '/fr/leading-safe-sa/', ar: '/ar/leading-safe-sa/' },
    '/training/':                   { es: '/es/formacion/',         fr: '/fr/formation/',       ar: '/ar/formation/' },
    '/training/adv-safe/spc/':      { es: '/es/spc/',               fr: '/fr/spc/',             ar: '/ar/spc/' },
    '/training/adv-safe/aspc/':     { es: '/es/aspc/',              fr: '/fr/aspc/',            ar: '/ar/aspc/' },
    '/training/adv-safe/rte/':      { es: '/es/rte/',               fr: '/fr/rte/',             ar: '/ar/rte/' },
    '/training/safe/scrum-master/': { es: '/es/scrum-master/',      fr: '/fr/scrum-master/',    ar: '/ar/scrum-master/' },
    '/training/safe/popm/':         { es: '/es/popm/',              fr: '/fr/popm/',            ar: '/ar/popm/' }
  };

  function norm(p) { return p.replace(/\/+$/, '') + '/'; }
  function curLang() {
    var p = location.pathname;
    if (p.indexOf('/es/') === 0) return 'es';
    if (p.indexOf('/fr/') === 0) return 'fr';
    if (p.indexOf('/ar/') === 0) return 'ar';
    return 'en';
  }
  function getCookie(n) {
    var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : null;
  }
  function setCookie(n, v) {
    document.cookie = n + '=' + encodeURIComponent(v) + ';path=/;max-age=' + (365 * 864e2) + ';SameSite=Lax';
  }
  function hasAdParams() {
    return /[?&](gclid|gbraid|wbraid|fbclid|msclkid|utm_[a-z]+)=/i.test(location.search);
  }
  /* Resolve the English base path for the current page (whatever language). */
  function enBase() {
    var cur = curLang(), path = norm(location.pathname);
    if (cur === 'en') return MAP[path] ? path : null;
    for (var k in MAP) { if (norm(MAP[k][cur] || '') === path) return k; }
    return null;
  }
  /* Where should `lang` go from the current page? null if nowhere sensible. */
  function targetFor(lang) {
    if (lang === curLang()) return null;
    var base = enBase();
    if (lang === 'en') return base || '/';
    if (base && MAP[base] && MAP[base][lang]) return MAP[base][lang];
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === lang) return LANGS[i].home;
    return '/';
  }
  function go(lang) {
    setCookie('aa_lang', lang);
    var t = targetFor(lang);
    if (t) location.href = t;
  }

  /* ---- UI ---- */
  function buildUI() {
    if (document.getElementById('aa-langsw')) return;
    var cur = curLang();
    var wrap = document.createElement('div');
    wrap.id = 'aa-langsw';
    wrap.setAttribute('role', 'navigation');
    wrap.setAttribute('aria-label', 'Language');
    var html = '<span class="aa-langsw-globe" aria-hidden="true">◉</span>';
    for (var i = 0; i < LANGS.length; i++) {
      var L = LANGS[i], on = (L.code === cur);
      html += '<a href="#" data-lang="' + L.code + '" class="aa-langsw-i' + (on ? ' on' : '') + '"' +
              (on ? ' aria-current="true"' : '') + ' lang="' + L.code + '">' + L.label + '</a>';
    }
    wrap.innerHTML = html;
    wrap.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-lang]'); if (!a) return;
      e.preventDefault(); go(a.getAttribute('data-lang'));
    });
    document.body.appendChild(wrap);
  }

  var css =
    '#aa-langsw{position:fixed;top:auto;bottom:18px;right:18px;z-index:99990;display:inline-flex;align-items:center;gap:2px;' +
    'background:#0B2E35;color:#fff;border:1px solid rgba(143,207,207,.35);border-radius:999px;padding:5px 8px 5px 10px;' +
    'font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:.04em;box-shadow:0 8px 24px -10px rgba(11,46,53,.6)}' +
    '#aa-langsw .aa-langsw-globe{color:#8FCFCF;margin-right:4px;font-size:13px;line-height:1}' +
    '#aa-langsw a{color:#B9D4D4;text-decoration:none;padding:3px 7px;border-radius:999px;transition:background .15s,color .15s}' +
    '#aa-langsw a:hover{color:#fff;background:rgba(255,255,255,.08)}' +
    '#aa-langsw a.on{color:#0B2E35;background:#8FCFCF;font-weight:700}' +
    '@media(max-width:600px){#aa-langsw{bottom:12px;right:12px;font-size:11px}}';

  function injectCSS() {
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }

  /* ---- Auto-redirect (guarded) ---- */
  function maybeRedirect() {
    if (!AUTO_REDIRECT) return false;
    if (getCookie('aa_lang')) return false;      // already chose / already redirected
    if (hasAdParams()) return false;             // protect ad + tracking traffic
    if (curLang() !== 'en') return false;        // only leave from English
    var nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase().slice(0, 2);
    if (nav !== 'es' && nav !== 'fr' && nav !== 'ar') return false;
    var t = targetFor(nav);
    if (t && norm(t) !== norm(location.pathname)) {
      setCookie('aa_lang', nav);
      location.replace(t);
      return true;
    }
    return false;
  }

  function init() {
    if (maybeRedirect()) return;   // if redirecting, don't bother drawing UI
    injectCSS();
    buildUI();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
