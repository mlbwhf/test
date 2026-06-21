#!/usr/bin/env python3
"""Generate the global site header (Twenty Twenty-Five 'header' template part) as a
single wp:html block, per the design handoff: mono masthead + sticky main bar +
animated wordmark + Training MEGA-MENU + mobile drawer. The Training panel mirrors
the LIVE page structure (/training/<section>/<course>/) so every course page is
reachable, rendered in the handoff's editorial mega style. Writes header_part.html.
"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))

# Live training structure (section title, section url, [(course label, url)...])
SECTIONS = [
    ("SAFe by Role", "/training/safe/", [
        ("Leading SAFe (SA)", "/training/safe/sa/"),
        ("SAFe Scrum Master (SSM)", "/training/safe/scrum-master/"),
        ("Advanced Scrum Master (SASM)", "/training/safe/asm/"),
        ("Product Owner / Manager (POPM)", "/training/safe/popm/"),
        ("SAFe DevOps (SDP)", "/training/safe/devops/"),
    ]),
    ("SAFe by Industry", "/training/safe-industry/", [
        ("SAFe for Teams (SP)", "/training/safe-industry/team-practitioner/"),
        ("SAFe Architect (ARCH)", "/training/safe-industry/arch/"),
        ("Agile Software Engineering (ASE)", "/training/safe-industry/ase/"),
    ]),
    ("Advanced SAFe", "/training/adv-safe/", [
        ("Release Train Engineer (RTE)", "/training/adv-safe/rte/"),
        ("Agile Product Management (APM)", "/training/adv-safe/apm/"),
        ("Lean Portfolio Management (LPM)", "/training/adv-safe/lpm/"),
        ("Implementing SAFe (SPC)", "/training/adv-safe/spc/"),
        ("Advanced Practice Consultant (ASPC)", "/training/adv-safe/aspc/"),
    ]),
]
AI = ("AI-Native", "/training/ai-native/", "AI-Native Foundations — extend SAFe into the AI age",
      "/training/ai-native/ai-native-foundations/")
TOP = [("Home", "/"), ("Assessments", "/assessments/"),
       ("Services", "/services/"), ("Digital Transformation", "/service-digital-transformation/")]

CSS = """
.aa-hd *{margin:0;padding:0;box-sizing:border-box}
.aa-hd{--ink:#0E3A44;--accent:#127E88;--accent-h:#0C5E66;--mint:#8FCFCF;--canvas:#FBFDFD;--canvas-alt:#F1F8F8;--dark:#0B2E35;--soft:#5E7378;--faint:#88A0A4;--hair:#DCEAEA;--hair2:#C7DEDE;--ai:#6E3CF4;--serif:'Newsreader',Georgia,serif;--sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.aa-hd a{text-decoration:none;color:inherit}
.aa-wrap{max-width:1280px;margin:0 auto;padding:0 30px}
.aa-masthead{border-bottom:1px solid var(--hair);background:var(--canvas);font-family:var(--mono)}
.aa-masthead .aa-wrap{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-top:10px;padding-bottom:10px}
.aa-masthead span{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#7C9298}
.aa-mast-mid{text-align:center}.aa-mast-rating{display:flex;align-items:center;gap:8px}.aa-star{color:var(--accent)}
.aa-header{position:sticky;top:0;z-index:50;background:rgba(251,253,253,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--hair)}
.aa-nav{display:flex;align-items:center;gap:34px;padding-top:12px;padding-bottom:12px}
.aa-logo{position:relative;display:inline-flex;align-items:baseline;gap:1px;flex:none;font-family:var(--serif);font-weight:500;font-size:23px;letter-spacing:-.01em;line-height:1;opacity:1;animation:aaPop 1s cubic-bezier(.2,.7,.2,1) both;overflow:hidden}
.aa-logo b{font-weight:500;color:var(--ink)}.aa-logo i{font-style:normal;font-weight:500;color:var(--accent)}
.aa-logo .shn{position:absolute;top:-20%;left:-60%;width:45%;height:140%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.9),transparent);transform:skewX(-12deg);animation:aaShine 4.2s ease-in-out 1s infinite}
.aa-logo:hover{transform:scale(1.04)}
@keyframes aaPop{0%{opacity:.85;transform:scale(.93)}55%{opacity:1;transform:scale(1.02)}100%{opacity:1;transform:scale(1)}}
@keyframes aaShine{0%,14%{left:-60%}58%,100%{left:160%}}
.aa-menu{display:flex;align-items:center;gap:26px;margin:0 0 0 4px;padding:0;list-style:none}
.aa-mi{position:relative}
.aa-link{position:relative;display:flex;align-items:center;gap:6px;padding:6px 0;font-family:var(--sans);font-size:14.5px;font-weight:500;color:#3C565E;background:none;border:0;cursor:pointer}
.aa-link:hover,.aa-link[aria-expanded=true]{color:var(--accent)}
.aa-link::after{content:"";position:absolute;left:0;right:100%;bottom:-5px;height:1.5px;background:var(--accent);transition:right .28s ease}
.aa-mi:hover .aa-link::after,.aa-link:focus-visible::after{right:0}
.aa-caret{font-size:10px;transition:transform .2s}.aa-link[aria-expanded=true] .aa-caret{transform:rotate(180deg)}
.aa-mega{position:absolute;top:calc(100% + 11px);left:-24px;width:860px;background:#fff;border:1px solid var(--ink);box-shadow:0 30px 60px -28px rgba(11,46,53,.35);opacity:0;visibility:hidden;transform:translateY(8px);transition:opacity .2s,transform .2s,visibility .2s;z-index:60}
.aa-mi.has-mega:hover .aa-mega,.aa-mega.is-open{opacity:1;visibility:visible;transform:translateY(0)}
.aa-mega-cols{display:grid;grid-template-columns:1fr 1fr 1fr}
.aa-col{padding:20px 22px;border-right:1px solid var(--hair)}.aa-col:last-child{border-right:0}
.aa-col-h{display:block;font-family:var(--serif);font-style:italic;font-size:18px;color:var(--ink);padding-bottom:4px}
.aa-col-h em{font-style:normal;font-family:var(--mono);font-size:10px;letter-spacing:.06em;color:var(--faint);margin-left:6px}
.aa-col a.c{display:block;font-family:var(--sans);font-size:13px;color:var(--soft);padding:7px 0;border-top:1px solid var(--hair)}
.aa-col a.c:hover{color:var(--accent)}
.aa-mega-feat{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 22px;background:var(--dark);color:#fff;position:relative;overflow:hidden}
.aa-mega-feat:hover{background:#11383F}
.aa-feat-glow{position:absolute;top:-40px;right:90px;width:170px;height:170px;border-radius:50%;background:radial-gradient(circle,rgba(110,60,244,.4),transparent 68%)}
.aa-feat-b{position:relative}.aa-feat-no{font-family:var(--mono);font-size:10px;letter-spacing:.06em;color:#B7A6FF}
.aa-feat-t{display:block;font-family:var(--serif);font-style:italic;font-size:20px;margin-top:2px}
.aa-feat-d{display:block;font-family:var(--sans);font-size:12.5px;color:#AEC8C8;margin-top:2px}
.aa-feat-go{position:relative;font-family:var(--mono);font-size:12px;font-weight:700;color:#B7A6FF;white-space:nowrap}
.aa-actions{margin-left:auto;display:flex;align-items:center;gap:16px}
.aa-act-t{font-family:var(--sans);font-size:14px;font-weight:600;color:var(--ink)}.aa-act-t:hover{color:var(--accent)}
.aa-act-c{font-family:var(--sans);font-size:14px;font-weight:600;color:#fff;background:var(--ink);padding:11px 19px;border-radius:2px}.aa-act-c:hover{background:var(--accent)}
.aa-burger{display:none;flex-direction:column;gap:5px;background:none;border:0;cursor:pointer;padding:8px;margin-left:auto}
.aa-burger span{width:22px;height:2px;background:var(--ink);transition:transform .2s,opacity .2s}
.aa-burger[aria-expanded=true] span:nth-child(1){transform:translateY(7px) rotate(45deg)}
.aa-burger[aria-expanded=true] span:nth-child(2){opacity:0}
.aa-burger[aria-expanded=true] span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.aa-drawer{position:fixed;inset:0 0 0 auto;width:min(86vw,380px);background:var(--canvas);z-index:70;border-left:1px solid var(--hair);padding:24px;overflow-y:auto;transform:translateX(100%);transition:transform .26s ease}
.aa-drawer.is-open{transform:translateX(0)}
.aa-dl{list-style:none;margin:0;padding:0}.aa-dl>li{border-bottom:1px solid var(--hair)}
.aa-dl a,.aa-dt{display:flex;justify-content:space-between;align-items:center;width:100%;font-family:var(--serif);font-style:italic;font-size:21px;color:var(--ink);background:none;border:0;padding:15px 4px;cursor:pointer}
.aa-ds{display:flex;flex-direction:column;gap:2px;padding:0 4px 12px}
.aa-ds a{font-family:var(--sans);font-style:normal;font-size:14px;color:var(--soft);padding:7px 0}
.aa-ds .ai{color:var(--ai)}
.aa-dcta{display:inline-block;margin-top:18px;text-align:center}
@media(max-width:980px){.aa-menu,.aa-actions{display:none}.aa-burger{display:flex}.aa-mast-mid{display:none}}
@media(prefers-reduced-motion:reduce){.aa-logo,.aa-logo .shn{animation:none}.aa-mega,.aa-drawer{transition:none}}
"""

JS = """
(function(){'use strict';
 document.querySelectorAll('.aa-hd .aa-mi.has-mega').forEach(function(item){
  var link=item.querySelector('.aa-link'),mega=item.querySelector('.aa-mega');if(!link||!mega)return;var t;
  function open(){clearTimeout(t);mega.classList.add('is-open');link.setAttribute('aria-expanded','true');}
  function close(){mega.classList.remove('is-open');link.setAttribute('aria-expanded','false');}
  link.addEventListener('click',function(e){if(mega.classList.contains('is-open'))return;e.preventDefault();open();});
  item.addEventListener('mouseenter',open);item.addEventListener('mouseleave',function(){t=setTimeout(close,120);});
  mega.addEventListener('mouseenter',function(){clearTimeout(t);});
  item.addEventListener('keydown',function(e){if(e.key==='Escape'){close();link.focus();}});
  item.addEventListener('focusout',function(e){if(!item.contains(e.relatedTarget))close();});
 });
 var b=document.querySelector('.aa-hd .aa-burger'),d=document.getElementById('aa-drawer');
 if(b&&d){function set(o){d.classList.toggle('is-open',o);b.setAttribute('aria-expanded',o?'true':'false');document.body.style.overflow=o?'hidden':'';}
  b.addEventListener('click',function(){set(!d.classList.contains('is-open'));});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&d.classList.contains('is-open')){set(false);b.focus();}});
  d.querySelectorAll('.aa-dt').forEach(function(btn){var s=btn.nextElementSibling;btn.addEventListener('click',function(){var o=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',o?'false':'true');btn.querySelector('span').textContent=o?'+':'\\u2013';if(s)s.hidden=o;});});
 }
})();
"""


def esc(s):
    return s.replace("&", "&amp;")


def build():
    # mega columns
    cols = []
    for title, url, courses in SECTIONS:
        links = "".join('<a class="c" href="%s">%s</a>' % (u, esc(l)) for l, u in courses)
        cols.append('<div class="aa-col"><a class="aa-col-h" href="%s">%s<em>%d</em></a>%s</div>'
                    % (url, esc(title), len(courses), links))
    feat = ('<a class="aa-mega-feat" href="%s"><span class="aa-feat-glow"></span>'
            '<span class="aa-feat-b"><span class="aa-feat-no">05 · FLAGSHIP</span>'
            '<span class="aa-feat-t">%s</span><span class="aa-feat-d">%s</span></span>'
            '<span class="aa-feat-go">Explore &rarr;</span></a>' % (AI[3], AI[0], esc(AI[2])))
    top_after = "".join('<li class="aa-mi"><a class="aa-link" href="%s">%s</a></li>' % (u, l) for l, u in TOP[1:])
    # drawer
    dsections = ""
    for title, url, courses in SECTIONS:
        sub = "".join('<a href="%s">%s</a>' % (u, esc(l)) for l, u in courses)
        dsections += ('<button class="aa-dt" aria-expanded="false">%s<span>+</span></button>'
                      '<div class="aa-ds" hidden>%s</div>' % (esc(title), sub))
    dsections += '<a href="%s" class="ai" style="padding:7px 0;font-family:var(--sans)">%s — Flagship</a>' % (AI[3], Aic := AI[0])

    html = (
        '<!-- wp:html -->\n<div class="aa-hd"><style>%s</style>\n'
        '<div class="aa-masthead"><div class="aa-wrap">'
        '<span>SAFe&reg; Gold Partner — SPCT-led</span>'
        '<span class="aa-mast-mid">Toronto &rarr; Delivered globally · 9 languages</span>'
        '<span class="aa-mast-rating"><span class="aa-star">&#9733;</span> 4.9 / 2,500+ certified</span>'
        '</div></div>\n'
        '<header class="aa-header"><nav class="aa-wrap aa-nav" aria-label="Primary">'
        '<a href="%s" class="aa-logo" aria-label="Agile Agilist — home"><b>AGILE</b><i>AGILIST</i><span class="shn"></span></a>'
        '<button class="aa-burger" aria-label="Open menu" aria-expanded="false" aria-controls="aa-drawer"><span></span><span></span><span></span></button>'
        '<ul class="aa-menu" role="menubar">'
        '<li class="aa-mi"><a class="aa-link" href="%s">%s</a></li>'
        '<li class="aa-mi has-mega"><a class="aa-link" href="/training/" aria-haspopup="true" aria-expanded="false" aria-controls="aa-mega-tr">Training<span class="aa-caret">&#9662;</span></a>'
        '<div class="aa-mega" id="aa-mega-tr" role="region" aria-label="Training menu"><div class="aa-mega-cols">%s</div>%s</div></li>'
        '%s'
        '</ul>'
        '<div class="aa-actions"><a href="/services/" class="aa-act-t">Book a consult</a><a href="/training/" class="aa-act-c">View cohorts &rarr;</a></div>'
        '</nav></header>\n'
        '<div class="aa-drawer" id="aa-drawer" hidden><ul class="aa-dl">'
        '<li><a href="%s">%s</a></li>'
        '<li><button class="aa-dt" aria-expanded="false">Training<span>+</span></button><div class="aa-ds" hidden>%s</div></li>'
        '%s'
        '</ul><a href="/training/" class="aa-act-c aa-dcta">View cohorts &rarr;</a></div>'
        '<script>%s</script></div>\n<!-- /wp:html -->'
    ) % (
        CSS, TOP[0][1], TOP[0][1], TOP[0][0], "".join(cols), feat, top_after,
        TOP[0][1], TOP[0][0], dsections,
        "".join('<li><a href="%s">%s</a></li>' % (u, l) for l, u in TOP[1:]),
        JS,
    )
    return html


if __name__ == "__main__":
    out = build()
    open(os.path.join(HERE, "header_part.html"), "w").write(out)
    print("wrote header_part.html (%d bytes)" % len(out))
    print("course links in mega:", out.count('class="c"'), "| sections:", out.count('aa-col-h'))
