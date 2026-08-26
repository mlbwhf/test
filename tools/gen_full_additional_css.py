#!/usr/bin/env python3
"""Assemble the complete Customizer -> Additional CSS sheet.

The live sheet is three things concatenated, and losing any one of them takes
a whole area of the site down with it:

    base  aa-additional-css-v21-PLUS-meridian.css   the course template (.aa-rd)
    Y     additional-css-home-section.css           the home page redesign
    Z     additional-css-calendar-section.css       the course calendar

The base is the meridian one, not CLEAN: only it carries .aa-mhero,
.aa-rte-crumb and .aa-rte-kick, which every live course page uses. Pasting
CLEAN would leave the course heroes unstyled.

    python3 tools/gen_full_additional_css.py > snippets/aa-additional-css-FULL.css
"""
import os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS = [
    ('snippets/aa-additional-css-v21-PLUS-meridian.css', 'BASE — course template, header, footer, mega-menu'),
    ('snippets/additional-css-home-section.css',         'Y — home page redesign'),
    ('snippets/additional-css-calendar-section.css',     'Z — course calendar'),
]

BANNER = """/* ############################################################################
   AGILE AGILIST — COMPLETE ADDITIONAL CSS
   ----------------------------------------------------------------------------
   Customizer -> Additional CSS. This is the WHOLE sheet: select all, replace,
   publish. It is assembled from three files by tools/gen_full_additional_css.py
   so the parts cannot drift apart.

   %(manifest)s

   Do NOT paste a section on its own over the top of this. The home and
   calendar sections are meant to be APPENDED to the base, and replacing the
   whole sheet with one of them removes the .aa-rd course template - which is
   what unstyles every course page at once, FAQ columns included.
   ############################################################################ */

"""

def main():
    out, manifest = [], []
    for rel, label in PARTS:
        path = os.path.join(ROOT, rel)
        with open(path) as fh:
            css = fh.read().rstrip('\n')
        # A stray unclosed brace in one part silently eats every rule after it.
        if css.count('{') != css.count('}'):
            sys.stderr.write('REFUSING: unbalanced braces in %s (%d open, %d close)\n'
                             % (rel, css.count('{'), css.count('}')))
            return 1
        manifest.append('%-52s %6d bytes  %s' % (rel, len(css), label))
        out.append('/* ===== %s ===== */\n%s' % (label, css))

    sys.stdout.write(BANNER % {'manifest': '\n   '.join(manifest)})
    sys.stdout.write('\n\n'.join(out) + '\n')
    return 0

if __name__ == '__main__':
    sys.exit(main())
