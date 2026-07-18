/* ============================================================
   Agile Agilist — Language Switcher + Suggestion Banner
   (bot-neutral: NO hard redirect — SEO/LLM-safe)
   ------------------------------------------------------------
   INSTALL (once): wp-admin → WPCode → Add Snippet → Custom Code
   → JavaScript Snippet → paste all of this → Auto Insert →
   "Site Wide Footer" → Save & Activate. Name "AA – Language Switcher".

   WHAT IT DOES
   1. A small persistent EN · ES · FR · ع pill (visual selector) — links to
      the exact translated page when one exists, else the language home.
   2. A one-time, non-intrusive suggestion BANNER: a first-time visitor whose
      browser language differs from the page they're on sees a top banner
      ("¿Prefieres leer en Español? [Cambiar]"). It NEVER auto-redirects, so
      bots crawl every URL normally and ad landings are never bounced.
      Dismiss (×) is remembered via localStorage.

   English is the default/canonical language; its URLs are never rewritten.
   Extend AA_MAP as pages are PUBLISHED (a draft target would 404).
   ============================================================ */
(function () {
  var LANGS = [
    { code: 'en', label: 'EN', home: '/' },
    { code: 'es', label: 'ES', home: '/es/' },
    { code: 'fr', label: 'FR', home: '/fr/' },
    { code: 'ar', label: 'ع', home: '/ar/', rtl: true }
  ];

  /* English path -> translated paths. Add rows only once the targets are LIVE. */
  var AA_MAP = {
    '/training/safe/sa/':           { es: '/es/liderando-safe-sa/', fr: '/fr/leading-safe-sa/', ar: '/ar/leading-safe-sa/' },
    '/training/':                   { es: '/es/formacion/',         fr: '/fr/formation/',       ar: '/ar/formation/' },
    '/training/adv-safe/spc/':      { es: '/es/spc/',               fr: '/fr/spc/',             ar: '/ar/spc/' },
    '/training/adv-safe/aspc/':     { es: '/es/aspc/',              fr: '/fr/aspc/',            ar: '/ar/aspc/' },
    '/training/adv-safe/rte/':      { es: '/es/rte/',               fr: '/fr/rte/',             ar: '/ar/rte/' },
    '/training/safe/scrum-master/': { es: '/es/scrum-master/',      fr: '/fr/scrum-master/',    ar: '/ar/scrum-master/' },
    '/training/safe/popm/':         { es: '/es/popm/',              fr: '/fr/popm/',            ar: '/ar/popm/' }
  };

  var BANNER = {
    es: { text: '¿Prefieres ver este contenido en español?', btn: 'Cambiar a Español' },
    fr: { text: 'Préférez-vous consulter cette page en français ?', btn: 'Passer au Français' },
    ar: { text: 'هل تفضّل تصفّح هذه الصفحة بالعربية؟', btn: 'التبديل إلى العربية', rtl: true },
    en: { text: 'Prefer to read this page in English?', btn: 'Switch to English' }
  };

  function norm(p) { return p.replace(/\/+$/, '') + '/'; }
  function curLang() {
    var p = location.pathname;
    if (p.indexOf('/es/') === 0) return 'es';
    if (p.indexOf('/fr/') === 0) return 'fr';
    if (p.indexOf('/ar/') === 0) return 'ar';
    return 'en';
  }
  function enBase() {
    var cur = curLang(), path = norm(location.pathname);
    if (cur === 'en') return AA_MAP[path] ? path : null;
    for (var k in AA_MAP) { if (norm(AA_MAP[k][cur] || '') === path) return k; }
    return null;
  }
  function targetFor(lang) {
    if (lang === curLang()) return null;
    var base = enBase();
    if (lang === 'en') return base || '/';
    if (base && AA_MAP[base] && AA_MAP[base][lang]) return AA_MAP[base][lang];
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === lang) return LANGS[i].home;
    return null;                       // no sensible target → don't offer it
  }

  /* ---------- persistent switcher pill ---------- */
  function buildPill() {
    if (document.getElementById('aa-langsw')) return;
    var cur = curLang(), wrap = document.createElement('div');
    wrap.id = 'aa-langsw';
    wrap.setAttribute('aria-label', 'Language');
    var html = '<span class="aa-langsw-globe" aria-hidden="true">◉</span>';
    for (var i = 0; i < LANGS.length; i++) {
      var L = LANGS[i], on = (L.code === cur), t = on ? '#' : (targetFor(L.code) || null);
      if (!t) continue;                // hide languages with no live target
      html += '<a href="' + t + '" data-lang="' + L.code + '" class="aa-langsw-i' + (on ? ' on' : '') + '"' +
              (on ? ' aria-current="true"' : '') + ' lang="' + L.code + '">' + L.label + '</a>';
    }
    wrap.innerHTML = html;
    document.body.appendChild(wrap);
  }

  /* ---------- one-time suggestion banner (no redirect) ---------- */
  function buildBanner() {
    try { if (localStorage.getItem('aa-skip-lang') === '1') return; } catch (e) {}
    var cur = curLang();
    var bl = (navigator.language || navigator.userLanguage || 'en').toLowerCase().split('-')[0];
    if (!BANNER[bl] || bl === cur) return;
    var target = targetFor(bl);
    if (!target || norm(target) === norm(location.pathname)) return;  // only if a real alternate exists

    var cfg = BANNER[bl];
    var bar = document.createElement('div');
    bar.id = 'aa-langbanner';
    if (cfg.rtl) bar.setAttribute('dir', 'rtl');
    bar.setAttribute('lang', bl);
    bar.innerHTML =
      '<span class="aa-lb-t">' + cfg.text + '</span>' +
      '<a class="aa-lb-go" href="' + target + '">' + cfg.btn + '</a>' +
      '<button class="aa-lb-x" type="button" aria-label="Close">&times;</button>';
    bar.querySelector('.aa-lb-x').addEventListener('click', function () {
      bar.remove();
      try { localStorage.setItem('aa-skip-lang', '1'); } catch (e) {}
    });
    // Remember choice if they accept, so we don't nag next page
    bar.querySelector('.aa-lb-go').addEventListener('click', function () {
      try { localStorage.setItem('aa-skip-lang', '1'); } catch (e) {}
    });
    document.body.insertBefore(bar, document.body.firstChild);
  }

  var css =
    /* pill */
    '#aa-langsw{position:fixed;bottom:18px;right:18px;z-index:99990;display:inline-flex;align-items:center;gap:2px;' +
    'background:#0B2E35;color:#fff;border:1px solid rgba(143,207,207,.35);border-radius:999px;padding:5px 8px 5px 10px;' +
    'font-family:ui-monospace,Menlo,monospace;font-size:12px;letter-spacing:.04em;box-shadow:0 8px 24px -10px rgba(11,46,53,.6)}' +
    '#aa-langsw .aa-langsw-globe{color:#8FCFCF;margin-right:4px;font-size:13px;line-height:1}' +
    '#aa-langsw a{color:#B9D4D4;text-decoration:none;padding:3px 7px;border-radius:999px;transition:background .15s,color .15s}' +
    '#aa-langsw a:hover{color:#fff;background:rgba(255,255,255,.08)}' +
    '#aa-langsw a.on{color:#0B2E35;background:#8FCFCF;font-weight:700}' +
    '@media(max-width:600px){#aa-langsw{bottom:12px;right:12px;font-size:11px}}' +
    /* banner */
    '#aa-langbanner{position:relative;z-index:99991;display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;' +
    'background:#0B2E35;color:#fff;padding:11px 20px;font-family:Inter,system-ui,sans-serif;font-size:14px;' +
    'border-bottom:1px solid rgba(143,207,207,.30)}' +
    '#aa-langbanner .aa-lb-t{color:#D6E7E7}' +
    '#aa-langbanner .aa-lb-go{color:#0B2E35;background:#8FCFCF;font-weight:600;text-decoration:none;padding:6px 14px;border-radius:999px;transition:background .15s}' +
    '#aa-langbanner .aa-lb-go:hover{background:#B9E4E4}' +
    '#aa-langbanner .aa-lb-x{background:transparent;border:none;color:#9fc4c4;font-size:20px;line-height:1;cursor:pointer;padding:0 4px}' +
    '#aa-langbanner .aa-lb-x:hover{color:#fff}';

  function init() {
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    buildBanner();   // top of body, before pill
    buildPill();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
