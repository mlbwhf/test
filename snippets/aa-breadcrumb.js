/* ============================================================
   AA — GLOBAL BREADCRUMB (auto-injected above #masthead)
   WPCode: JavaScript · Site-Wide Header · Run "Frontend Only"
   Snippet name: "AA – Breadcrumb JS"

   Auto-generates a pill breadcrumb on every page based on the URL,
   inserted BEFORE the utility strip (if present) and #masthead.
   Homepage renders nothing (returns early).
   ============================================================ */
(function(){
  // path -> { parent, parentLabel, label, dark? }
  // Add or edit entries here as new pages are added. Order doesn't matter.
  var MAP = {
    '/':                                   { hidden: true },

    // ABOUT
    '/about/':                             { parent: '/',          parentLabel: 'Home',            label: 'About',                dark: true },
    '/about/faq/':                         { parent: '/about/',    parentLabel: 'About',           label: 'FAQ',                  dark: true },
    '/about/contact/':                     { parent: '/about/',    parentLabel: 'About',           label: 'Contact' },

    // CUSTOMERS — parent = About (per your directive)
    '/customers/':                         { parent: '/about/',    parentLabel: 'About',           label: 'Customers',            dark: true },

    // SERVICES
    '/services/':                          { parent: '/',          parentLabel: 'Home',            label: 'Services' },
    '/services/business-agility/':         { parent: '/services/', parentLabel: 'Services',        label: 'Business Agility' },
    '/services/digital-transformation/':   { parent: '/services/', parentLabel: 'Services',        label: 'Digital Transformation' },
    '/services/product-operating-model/':  { parent: '/services/', parentLabel: 'Services',        label: 'Product Operating Model' },
    '/services/innovation-culture/':       { parent: '/services/', parentLabel: 'Services',        label: 'Innovation Culture' },
    '/services/operating-model/':          { parent: '/services/', parentLabel: 'Services',        label: 'Operating Model' },
    '/services/scaling-iterative-model/':  { parent: '/services/operating-model/', parentLabel: 'Operating Model', label: 'Scaling Iterative Model' },
    '/services/ai-native-operating-model/':{ parent: '/services/operating-model/', parentLabel: 'Operating Model', label: 'AI-Native' },
    '/services/mutation/':                 { parent: '/services/operating-model/', parentLabel: 'Operating Model', label: 'Mutation' },
    '/services/ai-automation/':            { parent: '/services/operating-model/', parentLabel: 'Operating Model', label: 'AI Automation' },

    // ASSESSMENTS
    '/assessments/':                       { parent: '/',              parentLabel: 'Home',            label: 'Assessments' },
    '/assessments/agile-maturity/':        { parent: '/assessments/',  parentLabel: 'Assessments',     label: 'Agile Maturity',       dark: true },
    '/assessments/cert-recommender/':      { parent: '/assessments/',  parentLabel: 'Assessments',     label: 'Career Selector' },
    '/assessments/mutation-readiness/':    { parent: '/assessments/',  parentLabel: 'Assessments',     label: 'Mutation Readiness' },

    // TRAINING (top; deeper /training/*/*/ handled by dynamic fallback below)
    '/training/':                          { parent: '/',          parentLabel: 'Home',            label: 'Training' }
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
    // Dynamic fallback for /training/<cat>/ and /training/<cat>/<course>/
    if(path.indexOf('/training/') === 0){
      var parts = path.split('/').filter(Boolean); // ['training', 'safe', 'popm']
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

  function build(){
    if(document.getElementById('aa-crumb-wrap')) return;
    var path = pathnameNormalized();
    var m = resolve(path);
    if(!m || m.hidden) return;

    var mast = document.getElementById('masthead') || document.querySelector('header#masthead') || document.querySelector('header.site-header');
    if(!mast) return;

    var wrap = document.createElement('div');
    wrap.id = 'aa-crumb-wrap';
    wrap.className = 'aa-crumb-wrap' + (m.dark ? ' is-dark' : '');
    wrap.innerHTML =
      '<div class="aa-crumb-in">' +
        '<nav aria-label="Breadcrumb" class="aa-crumb mono">' +
          '<a href="' + m.parent + '" class="aa-crumb-back">&larr; Back to ' + m.parentLabel + '</a>' +
          '<span class="aa-crumb-here">' + m.label + '</span>' +
        '</nav>' +
      '</div>';

    // insert ABOVE utility strip if present (which is itself above #masthead), else above #masthead
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
