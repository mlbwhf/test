#!/usr/bin/env python3
"""Wrap the calendar CSS as section Z of the site's Additional CSS.

The site's Additional CSS is the canonical stylesheet — its own header says so,
and the home page redesign already lives there as section Y. This emits the
calendar's rules in the same house style so they can go in the same place
rather than in a separate WPCode CSS snippet.

Either home works. Additional CSS keeps one canonical sheet and one less
snippet to manage; a WPCode CSS snippet keeps the calendar's three parts
together, so removing the calendar removes its styles with it. Pick one and
only one — two copies of these rules will drift.

Also asserts what makes the shared sheet safe: every selector is scoped under
.aa-mcal, so nothing here can reach the course template's .aa-rd rules or the
home page's section Y.

    python3 tools/gen_calendar_css_section.py > snippets/additional-css-calendar-section.css
"""
import hashlib
import os
import re
import sys

BANNER = """/* ############################################################################
   Z. COURSE CALENDAR                                    [aa_mini_calendar]
   ----------------------------------------------------------------------------
   Generated from snippets/calendar/aa-calendar.css — content hash %(hash)s.
   Do not hand-edit here; edit that file and regenerate, or the next update
   overwrites the change.

   Every selector below is scoped under .aa-mcal (verified by this generator,
   zero exceptions), so this section cannot reach the course template's .aa-rd
   rules or the home page's section Y.

   If this section is in the sheet, do NOT also run the "AA - Calendar CSS"
   WPCode snippet — two copies of the same rules, and one of them will drift.
   ############################################################################ */

%(css)s
/* ==================== END — Z. course calendar ==================== */
"""


def unscoped_selectors(css):
    """Selectors that escape .aa-mcal — the only thing that could hurt the sheet.

    Skips at-rule preludes (@media, @keyframes) and declarations; looks only at
    the class/id selectors that open a rule block.
    """
    out = []
    for line in css.splitlines():
        line = line.strip()
        if not line or line.startswith(('@', '/*', '*', '}')) or ':' in line.split('{')[0] and '{' not in line:
            continue
        head = line.split('{')[0].strip()
        if not head or '{' not in line:
            continue
        for sel in head.split(','):
            sel = sel.strip()
            if sel.startswith(('.aa-mcal', '@', 'from', 'to', '0%', '50%', '100%')):
                continue
            if sel:
                out.append(sel)
    return out


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = os.path.join(root, 'snippets', 'calendar', 'aa-calendar.css')
    with open(src) as fh:
        css = fh.read().rstrip('\n')

    bad = unscoped_selectors(css)
    if bad:
        sys.stderr.write('REFUSING: selectors not scoped under .aa-mcal:\n  '
                         + '\n  '.join(sorted(set(bad))) + '\n')
        return 1

    sys.stdout.write(BANNER % {
        'hash': hashlib.sha1(css.encode('utf-8')).hexdigest()[:8],
        'css': css,
    })
    return 0


if __name__ == '__main__':
    sys.exit(main())
