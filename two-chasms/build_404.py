"""Build the designed 404 ("third chasm") as a block-theme template.

Output: out/404_template.html - the full contents of the TT5 "Page: 404"
template (wp_template slug 404). Self-contained: fonts, v2 CSS, masthead,
404 body, colophon. Paste into Site Editor > Templates > Page: 404 > Code editor.
"""
from pathlib import Path

OUT = Path(__file__).parent / "out"

NF_CSS = """.tc .nf{padding-top:72px;padding-bottom:48px;display:flex;flex-direction:column;gap:56px}
.tc .nf h1{font-size:clamp(40px,8vw,96px);line-height:.92;letter-spacing:-.035em;max-width:14ch}
.tc .nf__copy .actions{margin-top:6px}
.tc .nf__scene{display:block;width:100%;height:auto;overflow:hidden}
.tc .nf__num{font-family:var(--mono);font-size:120px;font-weight:600;letter-spacing:-.04em;fill:var(--line)}
.tc .nf__ball{animation:nf-fall 3.6s ease-in infinite}
@keyframes nf-fall{0%,12%{transform:translateY(-190px)}40%{transform:translateY(0)}52%{transform:translateY(-26px)}64%,100%{transform:translateY(0)}}
@media (prefers-reduced-motion:reduce){.tc .nf__ball{animation:none}}
.tc .nf__links{border-top:1px solid var(--line);padding-top:24px;display:flex;flex-direction:column;gap:14px}
.tc .nf__links .nav a{color:var(--amber);font-weight:600}
.tc .nf__links .nav a:hover{color:var(--ink)}
body{background:#fff;margin:0;font-family:var(--sans);color:var(--ink)}
.masthead .wrap,.colophon.wrap{max-width:var(--max);margin:0 auto;padding-left:var(--pad);padding-right:var(--pad);box-sizing:border-box}
.masthead a,.colophon a{text-decoration:none}
.wp-site-blocks{padding:0!important}
.wp-site-blocks>*{margin-block-start:0!important}"""

MAIN = """<div class="tc">
<main class="wrap nf">
  <div class="stack nf__copy">
    <span class="kicker">Error 404 · Page not found</span>
    <h1>You’ve fallen into a <em>third chasm.</em></h1>
    <p class="lead">This page doesn’t exist, or it moved. The framework has two chasms. This one isn’t on the map.</p>
    <div class="actions"><a class="btn btn--amber" href="/">Back to the framework →</a><a class="link-mono" href="/assess/">Take the assessment →</a></div>
  </div>
  <svg class="nf__scene" viewBox="0 0 1100 260" role="img" aria-label="A ball has dropped into the gap between two ground segments">
    <rect x="418" y="161" width="264" height="99" fill="#F7F9FB"/>
    <line x1="418" y1="161" x2="418" y2="260" stroke="#C87A16" stroke-width="2" stroke-dasharray="6 6"/><line x1="682" y1="161" x2="682" y2="260" stroke="#C87A16" stroke-width="2" stroke-dasharray="6 6"/>
    <rect x="0" y="161" width="418" height="22" fill="#101418"/><rect x="682" y="161" width="418" height="22" fill="#101418"/>
    <text x="704" y="146" class="nf__num">404</text>
    <circle class="nf__ball" cx="550" cy="226" r="16" fill="#C87A16"/>
  </svg>
  <div class="nf__links"><span class="label">Try one of these instead</span><ul class="nav"><li><a href="/">Framework</a></li><li><a href="/assess/">Assess</a></li><li><a href="/workshops/">Workshops</a></li><li><a href="/cast/">Cast</a></li><li><a href="/books/">Books</a></li></ul></div>
</main>
</div>"""

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;700;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">')


def block(html):
    return f"<!-- wp:html -->\n{html}\n<!-- /wp:html -->"


css = (OUT / "template_css.css").read_text() + "\n" + NF_CSS
parts = [
    block(FONTS + "\n<style>\n" + css + "\n</style>"),
    block((OUT / "masthead.html").read_text().strip()),
    block(MAIN),
    block((OUT / "colophon.html").read_text().strip()),
]
(OUT / "404_template.html").write_text("\n\n".join(parts) + "\n")
print("out/404_template.html", len("\n\n".join(parts) + "\n"), "bytes")
