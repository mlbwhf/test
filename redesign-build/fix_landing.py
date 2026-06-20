#!/usr/bin/env python3
"""Fix the hand-authored redesign LANDING pages so they sit correctly inside the
WordPress theme:
  1. full-bleed width  -> .aa-rd breaks out of the theme's narrow content column
  2. remove the top part (MASTHEAD + NAV) -> theme already renders the site menu
  3. remove the page's own FOOTER          -> theme already renders the footer

Each page shares the .aa-rd wrapper and <!-- MASTHEAD -->/<!-- NAV -->/<!-- FOOTER -->
comment markers, so the transform is uniform. Writes *.fixed.html next to each.
"""
import os, re

HERE = os.path.dirname(os.path.abspath(__file__))

PAGES = [
    "assessments-landing.html",
    "homepage.html",
    "services-landing.html",
    "training.html",
    "service---digital-transformation.html",
]

FULLBLEED = ("width:100vw;max-width:100vw;margin-left:calc(50% - 50vw);"
             "margin-right:calc(50% - 50vw);overflow-x:hidden;")


def fix(html):
    # 1) full-bleed: prepend an override rule right after <style>
    override = ("<style>\n/* fit into theme: full-bleed width */\n"
                ".aa-rd{%s}\n" % FULLBLEED)
    html = html.replace("<style>", override, 1)
    # homepage uses an unclassed root div with an inline width:100% style -> patch it
    html = html.replace(
        'width:100%;overflow-x:hidden;background:#FBFDFD;color:#0E3A44',
        FULLBLEED + 'background:#FBFDFD;color:#0E3A44')

    # 2) remove MASTHEAD + NAV: from the masthead marker up to the 3rd comment
    #    marker (= first real content section that follows NAV).
    markers = [m.start() for m in re.finditer(r"<!-- [A-Z][A-Z /]* -->", html)]
    mast = html.find("<!-- MASTHEAD -->")
    if mast != -1 and len(markers) >= 3:
        # the 3rd marker overall is MASTHEAD(0), NAV(1), firstContent(2)
        after = [p for p in markers if p > mast]
        if len(after) >= 2:
            cut_to = after[1]  # start of first content section after NAV
            html = html[:mast] + html[cut_to:]

    # 3) remove the page's own footer
    html = re.sub(r"\s*<!-- FOOTER -->.*?</footer>", "", html, flags=re.S)
    return html


def main():
    for name in PAGES:
        path = os.path.join(HERE, name)
        if not os.path.exists(path):
            print("skip (missing):", name); continue
        src = open(path).read()
        out = fix(src)
        outpath = path.replace(".html", ".fixed.html")
        open(outpath, "w").write(out)
        has_mast = "<!-- MASTHEAD -->" in out
        has_foot = "</footer>" in out
        print("%-42s -> %-46s mast=%s foot=%s %d->%d bytes"
              % (name, os.path.basename(outpath), has_mast, has_foot, len(src), len(out)))


if __name__ == "__main__":
    main()
