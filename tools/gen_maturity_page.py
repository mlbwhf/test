# -*- coding: utf-8 -*-
"""Build the French Agile Maturity assessment page from the English one.

The EN and ES pages are line-aligned — 68 of 339 lines differ, and every one of
those is a translated string. So rather than re-authoring the page, this
replaces those lines and leaves the other 271 byte-identical: the scoring
maths, the radar geometry and the DOM wiring cannot drift between languages.

Every replacement is keyed on the exact English line. If the English page is
edited, the key stops matching and the run fails, instead of silently emitting
a French page built from stale English.

The four data blocks (LEVELS, SHORT, DIMS, STAGE_DESC) are rendered from
snippets/assessments/data/maturity-fr.json rather than typed out again, so the
page and the data file cannot disagree about a level name or an option count.
"""
import json, io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EN_PAGE = "snippets/pages/agile-maturity-assessment.html"
FR_DATA = "snippets/assessments/data/maturity-fr.json"
OUT = "snippets/pages/translations/maturity-fr.html"
OUT_ENGINE = "snippets/pages/translations/maturity-fr-engine.html"

SLUG = "/fr/evaluation-maturite-agile/"

# ---------------------------------------------------------------- line pairs
# exact English line -> French line. Whitespace is preserved from the English.
PAIRS = [
 ('<!-- AIOSEO TITLE: Agile Maturity Assessment — Free Self-Assessment | Agile Agilist -->',
  '<!-- AIOSEO TITLE: Évaluation de Maturité Agile — Auto-évaluation Gratuite | Agile Agilist -->'),
 ('<!-- AIOSEO DESC: Where is your organization on the journey from Absent to Flying? Rate 4 dimensions of agile maturity and get an instant profile with what to build next. Free, no login. -->',
  "<!-- AIOSEO DESC: Où en est votre organisation sur le chemin qui va d'Absent à En vol ? Évaluez 4 dimensions de maturité agile et obtenez un profil instantané avec la prochaine capacité à construire. Gratuit, sans inscription. -->"),

 ('  "name":"Agile Maturity Assessment",',
  '  "name":"Évaluation de Maturité Agile",'),
 ('  "url":"https://agile-agilist.com/assessments/agile-maturity/",',
  '  "url":"https://agile-agilist.com%s",' % SLUG),
 ('  "description":"A free self-assessment of enterprise agile maturity across four dimensions — Operating Model & Alignment, Value Delivery Engagement, Workforce Enablement, and Ways of Working — scored on a five-stage model from Absent to Flying."',
  '  "description":"Une auto-évaluation gratuite de la maturité agile d\'entreprise sur quatre dimensions — Modèle opérationnel et alignement, Engagement dans la livraison de valeur, Capacités des équipes et Modes de travail — notée sur un modèle en cinq stades, d\'Absent à En vol."'),

 ('&larr; Back to Assessments</a><span style="color:#0B2E35;background:#8FCFCF;border-radius:999px;padding:5px 13px">Agile Maturity</span>',
  '&larr; Retour aux évaluations</a><span style="color:#0B2E35;background:#8FCFCF;border-radius:999px;padding:5px 13px">Maturité agile</span>'),
 ('href="/assessments/" style="color:#B9D4D4', 'href="/fr/assessments/" style="color:#B9D4D4'),

 ('    <span class="aa-mat-eb">Free self-assessment</span>',
  '    <span class="aa-mat-eb">Auto-évaluation gratuite</span>'),
 ('    <h1>Agile Maturity <em>Assessment</em></h1>',
  '    <h1>Évaluation de <em>maturité agile</em></h1>'),
 ('    <p>Where is your organization on the journey from <em>Absent</em> to <em>Flying</em>? Rate four dimensions and get an instant maturity profile &mdash; with what to build next.</p>',
  '    <p>Où en est votre organisation sur le chemin qui va d&rsquo;<em>Absent</em> à <em>En vol</em> ? Évaluez quatre dimensions et obtenez un profil de maturité instantané &mdash; avec la prochaine capacité à construire.</p>'),
 ('      <span><b>1</b> Absent</span><span><b>2</b> Nascent</span><span><b>3</b> Designed</span><span><b>4</b> Accelerating</span><span><b>5</b> Flying</span>',
  '      <span><b>1</b> Absent</span><span><b>2</b> Émergent</span><span><b>3</b> Conçu</span><span><b>4</b> En accélération</span><span><b>5</b> En vol</span>'),
 ('    <p class="note" style="margin-top:18px">Takes 2 minutes &middot; No login &middot; Instant results</p>',
  '    <p class="note" style="margin-top:18px">2 minutes &middot; Sans inscription &middot; Résultats immédiats</p>'),

 ('    <p class="aa-mat-intro">For each dimension, choose the description that best matches your organization <em>today</em>. Be honest &mdash; the profile is only useful if it&rsquo;s real.</p>',
  '    <p class="aa-mat-intro">Pour chaque dimension, choisissez la description qui correspond le mieux à votre organisation <em>aujourd&rsquo;hui</em>. Soyez honnête &mdash; le profil n&rsquo;a d&rsquo;intérêt que s&rsquo;il est réel.</p>'),
 ('      <button class="aa-mat-btn p" id="mat-submit" disabled>See my maturity profile &rarr;</button>',
  '      <button class="aa-mat-btn p" id="mat-submit" disabled>Voir mon profil de maturité &rarr;</button>'),
 ('      <div class="aa-mat-hint" id="mat-hint">Select a level for all four dimensions to continue.</div>',
  '      <div class="aa-mat-hint" id="mat-hint">Sélectionnez un niveau pour les quatre dimensions afin de continuer.</div>'),

 ("    if(done){ hint.textContent='Ready — see your profile.'; }",
  "    if(done){ hint.textContent='Prêt — voir votre profil.'; }"),
 ('role="img" aria-label="Agile maturity radar across four dimensions"',
  'role="img" aria-label="Radar de maturité agile sur quatre dimensions"'),

 ('''      '<div class="aa-mat-kpi"><div class="k">Overall stage</div><div class="v">'+stage+'</div><div class="s">Stage '+(stageIdx+1)+' of 5</div></div>'+''',
  '''      '<div class="aa-mat-kpi"><div class="k">Stade global</div><div class="v">'+stage+'</div><div class="s">Stade '+(stageIdx+1)+' sur 5</div></div>'+'''),
 ('''      '<div class="aa-mat-kpi"><div class="k">Maturity score</div><div class="v">'+avg.toFixed(1)+'</div><div class="s">out of 5.0</div></div>'+''',
  '''      '<div class="aa-mat-kpi"><div class="k">Score de maturité</div><div class="v">'+avg.toFixed(1).replace('.',',')+'</div><div class="s">sur 5,0</div></div>'+'''),
 ('''      '<div class="aa-mat-kpi"><div class="k">Strongest</div><div class="v" style="font-size:17px">'+SHORT[strongIdx]+'</div><div class="s">'+LEVELS[maxv-1]+'</div></div>'+''',
  '''      '<div class="aa-mat-kpi"><div class="k">Point fort</div><div class="v" style="font-size:17px">'+SHORT[strongIdx]+'</div><div class="s">'+LEVELS[maxv-1]+'</div></div>'+'''),
 ('''      '<div class="aa-mat-kpi"><div class="k">Focus area</div><div class="v" style="font-size:17px">'+SHORT[weakIdx]+'</div><div class="s">'+LEVELS[minv-1]+'</div></div>';''',
  '''      '<div class="aa-mat-kpi"><div class="k">Axe de progrès</div><div class="v" style="font-size:17px">'+SHORT[weakIdx]+'</div><div class="s">'+LEVELS[minv-1]+'</div></div>';'''),

 ('''        '<div class="aa-mat-panel"><div class="cap">Maturity radar</div>'+radarSVG(scores)+'</div>'+''',
  '''        '<div class="aa-mat-panel"><div class="cap">Radar de maturité</div>'+radarSVG(scores)+'</div>'+'''),
 ('''        '<div class="aa-mat-panel"><div class="cap">At a glance</div><div class="aa-mat-kpis">'+kpis+'</div>'+''',
  '''        '<div class="aa-mat-panel"><div class="cap">En un coup d\\'œil</div><div class="aa-mat-kpis">'+kpis+'</div>'+'''),

 ('''        next='<p class="aa-mat-row-next"><b>Next ('+LEVELS[lv+1]+'):</b> '+nextItems+'</p>';''',
  '''        next='<p class="aa-mat-row-next"><b>Suivant ('+LEVELS[lv+1]+') :</b> '+nextItems+'</p>';'''),
 ('''        next='<p class="aa-mat-row-next"><b>Top of the model.</b> Sustain it, and mentor others toward it.</p>';''',
  '''        next='<p class="aa-mat-row-next"><b>Sommet du modèle.</b> Maintenez-le et accompagnez les autres vers ce niveau.</p>';'''),

 ('''    var focusHtml='<span class="aa-mat-eb">Where to focus next</span>'+''',
  '''    var focusHtml='<span class="aa-mat-eb">Où concentrer vos efforts</span>'+'''),
 ('''      '<h4>Start with '+lowNames.join(' & ')+'.</h4>'+''',
  '''      '<h4>Commencez par '+lowNames.join(' et ')+'.</h4>'+'''),
 ('''      '<p>Your lowest-scoring dimension'+(lowNames.length>1?'s are':' is')+' <strong>'+lowNames.join(' & ')+'</strong> at <strong>'+LEVELS[min]+'</strong>. '+''',
  '''      '<p>'+(lowNames.length>1?'Vos dimensions les moins bien notées sont':'Votre dimension la moins bien notée est')+' <strong>'+lowNames.join(' et ')+'</strong> à <strong>'+LEVELS[min]+'</strong>. '+'''),
 ('''      'Maturity compounds when the weakest dimension moves &mdash; that&rsquo;s the highest-leverage place to invest next.</p>';''',
  '''      'La maturité progresse quand la dimension la plus faible avance &mdash; c&rsquo;est là que l&rsquo;investissement a le plus d&rsquo;effet de levier.</p>';'''),

 ('''      '<div class="aa-mat-res-card"><div class="lab">Your overall maturity</div>'+''',
  '''      '<div class="aa-mat-res-card"><div class="lab">Votre maturité globale</div>'+'''),
 ('''        '<div class="aa-mat-res-score">Score <b>'+avg.toFixed(1)+' / 5.0</b> &middot; stage '+(stageIdx+1)+' of 5</div>'+''',
  '''        '<div class="aa-mat-res-score">Score <b>'+avg.toFixed(1).replace('.',',')+' / 5,0</b> &middot; stade '+(stageIdx+1)+' sur 5</div>'+'''),
 ('''      '<div class="aa-mat-profile"><h4>Your profile, dimension by dimension</h4>'+rows+'</div>'+''',
  '''      '<div class="aa-mat-profile"><h4>Votre profil, dimension par dimension</h4>'+rows+'</div>'+'''),

 ('''      '<div class="aa-mat-cta"><p>Want a facilitated maturity assessment and a roadmap to the next stage? Our SPCTs do this with enterprise teams every week.</p>'+''',
  '''      '<div class="aa-mat-cta"><p>Vous souhaitez une évaluation de maturité animée et une feuille de route vers le stade suivant ? Nos SPCT le font chaque semaine avec des équipes d&rsquo;entreprise.</p>'+'''),
 ('''        '<div class="aa-mat-btns"><a class="aa-mat-btn p" href="https://meetings.hubspot.com/john2795">Book a maturity consult &rarr;</a>'+''',
  '''        '<div class="aa-mat-btns"><a class="aa-mat-btn p" href="https://meetings.hubspot.com/john2795">Réserver un échange sur la maturité &rarr;</a>'+'''),
 ('''        '<a class="aa-mat-btn g" href="/services/business-agility/">See how we transform</a>'+''',
  '''        '<a class="aa-mat-btn g" href="/fr/services/business-agility/">Voir comment nous transformons</a>'+'''),
 ('''        '<button class="aa-mat-btn g" id="mat-print" type="button">Save / print</button>'+''',
  '''        '<button class="aa-mat-btn g" id="mat-print" type="button">Enregistrer / imprimer</button>'+'''),
 ('''        '<button class="aa-mat-btn g" id="mat-retake" type="button">Retake</button></div></div>';''',
  '''        '<button class="aa-mat-btn g" id="mat-retake" type="button">Refaire</button></div></div>';'''),

 ("      submit.disabled=true; hint.textContent='Select a level for all four dimensions to continue.';",
  "      submit.disabled=true; hint.textContent='Sélectionnez un niveau pour les quatre dimensions afin de continuer.';"),
]

# The English data blocks, replaced wholesale from maturity-fr.json.
DATA_START = '  var LEVELS=['
DATA_END_MARK = '  };'          # closes STAGE_DESC


def js(s):
    """A JS double-quoted literal — json.dumps escapes exactly what JS needs."""
    return json.dumps(s, ensure_ascii=False)


def data_block(fr):
    """Re-render LEVELS / SHORT / DIMS / STAGE_DESC in the page's own layout."""
    out = []
    out.append('  var LEVELS=[%s];' % ",".join(js(x) for x in fr["levels"]))
    out.append('  var SHORT=[%s];' % ",".join(js(x) for x in fr["short"]))
    out.append('  var DIMS=[')
    for i, d in enumerate(fr["dims"]):
        out.append('    {n:%s, s:%s,' % (js(d["n"]), js(d["s"])))
        out.append('     o:[')
        for j, opt in enumerate(d["o"]):
            out.append('      [%s]%s' % (",".join(js(x) for x in opt),
                                         "," if j < len(d["o"]) - 1 else ""))
        out.append('     ]}%s' % ("," if i < len(fr["dims"]) - 1 else ""))
    out.append('  ];')
    out.append('  var STAGE_DESC={')
    for i, lvl in enumerate(fr["levels"]):
        out.append('    %s:%s%s' % (js(lvl), js(fr["stageDesc"][lvl]),
                                    "," if i < len(fr["levels"]) - 1 else ""))
    out.append('  };')
    return out


def main():
    en = io.open(os.path.join(ROOT, EN_PAGE), encoding='utf-8').read()
    fr_data = json.load(io.open(os.path.join(ROOT, FR_DATA), encoding='utf-8'))
    lines = en.split("\n")

    # 1. swap the data blocks
    i = next(k for k, l in enumerate(lines) if l.startswith(DATA_START))
    j = next(k for k in range(i, len(lines)) if lines[k] == DATA_END_MARK)
    lines = lines[:i] + data_block(fr_data) + lines[j + 1:]

    # 2. add inLanguage next to operatingSystem, as the ES page does
    k = next(idx for idx, l in enumerate(lines) if l.strip().startswith('"operatingSystem"'))
    lines.insert(k + 1, '  "inLanguage":"fr",')

    page = "\n".join(lines)

    # 3. the line-for-line replacements
    missing = []
    for src, dst in PAIRS:
        if src not in page:
            missing.append(src[:100])
            continue
        page = page.replace(src, dst)
    if missing:
        print("These English strings are no longer in the source page —")
        print("the English page changed and the French copy is now stale:")
        for m in missing:
            print("   %s" % m)
        sys.exit(1)

    # 4. nothing English may survive
    # "Absent" is deliberately absent from this list — it is the French level
    # name too.
    leftovers = [w for w in ("Nascent", "Designed", "Accelerating",
                             "Flying", "Free self-assessment", "Retake",
                             "Save / print", "out of 5.0", "At a glance")
                 if w in page]
    if leftovers:
        print("Untranslated English left in the page: %s" % ", ".join(leftovers))
        sys.exit(1)

    io.open(os.path.join(ROOT, OUT), 'w', encoding='utf-8').write(page)
    engine = engine_page(page, fr_data)
    io.open(os.path.join(ROOT, OUT_ENGINE), 'w', encoding='utf-8').write(engine)

    import difflib
    sm = difflib.SequenceMatcher(None, en.split("\n"), page.split("\n"), autojunk=False)
    same = sum(b - a for op, a, b, _, _ in sm.get_opcodes() if op == 'equal')
    print("  wrote %s (%d bytes)" % (OUT, len(page)))
    print("  wrote %s (%d bytes)" % (OUT_ENGINE, len(engine)))
    print("  %d of %d English lines carried through unchanged"
          % (same, len(en.split("\n"))))


def engine_page(page, fr):
    """The QBank-engine shell: hero markup plus the config payload.

    Same shape as maturity-es-engine.html — the shared engine renders the
    questions and the report from .aa-assess-cfg, so this file carries no
    scoring code of its own.
    """
    ld = re.search(r'<script type="application/ld\+json">[\s\S]*?</script>', page).group(0)
    scale = "".join('<span><b>%d</b> %s</span>' % (i + 1, l)
                    for i, l in enumerate(fr["levels"]))
    return (
        '<!-- wp:html -->\n'
        '%s\n'
        '<div class="aa-mat" id="aa-mat">\n'
        '<section class="aa-mat-hero"><div class="aa-mat-hero-in">\n'
        '<span class="aa-mat-eb">%s</span>\n'
        '<h1>%s</h1>\n'
        '<p>%s</p>\n'
        '<div class="aa-mat-scale">%s</div>\n'
        '<p class="note" style="margin-top:18px">%s</p>\n'
        '</div></section>\n'
        '<div class="aa-assess"></div>\n'
        '<script type="application/json" class="aa-assess-cfg">\n%s\n</script>\n'
        '</div>\n'
        '<!-- /wp:html -->\n'
        % (ld, fr["hero"]["eyebrow"], fr["hero"]["title"], fr["hero"]["sub"],
           scale, fr["hero"]["note"],
           json.dumps(fr, ensure_ascii=False, indent=1)))


if __name__ == "__main__":
    main()
