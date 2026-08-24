# -*- coding: utf-8 -*-
"""Wrap aa-home.css as a section of the site's Additional CSS.

The site keeps ONE canonical stylesheet — Appearance -> Customize ->
Additional CSS ("v21 CLEAN SHEET"). Shipping the home page's CSS as a separate
WPCode snippet created a second place styles live, which is exactly the split
that sheet exists to prevent. So the home CSS is delivered as a section to
append to that file instead, in the sheet's own house style (banner header,
END marker), regenerated from redesign-build/aa-home/aa-home.css so the two
copies cannot drift.

    python3 tools/gen_additional_css_section.py
"""
import io, os, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS = "redesign-build/aa-home/aa-home.css"
OUT = "snippets/additional-css-home-section.css"

IMPORT_LINE = ("@import url('https://fonts.googleapis.com/css2"
               "?family=Space+Grotesk:wght@400;500;600;700"
               "&family=Instrument+Serif:ital@0;1&display=swap');")

HEADER = """\
/* ############################################################################
   Y. HOME PAGE (.aa) — /, /es/, /fr/   (v22 addition — paste at the VERY END)
   ----------------------------------------------------------------------------
   The redesigned home page: hero + live cohort panel, ticker, training tracks,
   assessments, why/methodology/path/coaching, five dimensions, results.
   Source of truth: redesign-build/aa-home/aa-home.css in the repo — regenerate
   this section with tools/gen_additional_css_section.py after any edit there;
   do not hand-edit it here.

   Every selector is scoped under .aa (verified by script, zero exceptions),
   so it cannot touch the nav, the .aa-rd course template, or anything else in
   this sheet. The shared names (.aa-hero/.aa-stats) collide with nothing:
   the course template's versions are all .aa-rd-scoped.

   FONTS — one extra @import belongs AT THE TOP of this sheet, directly under
   the existing Newsreader import (@import is invalid anywhere else):

     %(import_line)s

   Same perf caveat as the Newsreader import: better set in Customizer
   Typography later, then delete both import lines.

   Pairs with WPCode JS snippet "AA - Home JS" (aa-home.js) — same pattern as
   "AA - Nav JS". Content hash: %(ver)s
   ############################################################################ */

"""

FOOTER = """
/* ==================== END — Y. home page (.aa) ==================== */
"""


def main():
    css = io.open(os.path.join(ROOT, CSS), encoding='utf-8').read().rstrip("\n")
    if "@import" in css:
        raise SystemExit("aa-home.css must not carry the @import itself — "
                         "it would be invalid mid-sheet")
    ver = hashlib.sha1(css.encode('utf-8')).hexdigest()[:8]
    out = HEADER % {"import_line": IMPORT_LINE, "ver": ver} + css + "\n" + FOOTER
    path = os.path.join(ROOT, OUT)
    io.open(path, 'w', encoding='utf-8').write(out)
    print("  wrote %s (%d bytes, hash %s)" % (OUT, len(out), ver))
    print("  top-of-sheet import line:\n    %s" % IMPORT_LINE)


if __name__ == "__main__":
    main()
