#!/usr/bin/env python3
"""Bundle the shortcode snippets into one must-use plugin.

WPCode PHP snippets are not executing on agile-agilist.com — two independent
snippets both failed to register their shortcodes, and the live homepage proves
it: WordPress texturized `part="ticker"` into `part=&#8221;ticker&#8221;`, which
it only does OUTSIDE registered shortcodes. A must-use plugin sidesteps the
whole question: files in wp-content/mu-plugins/ are loaded by WordPress itself,
before regular plugins, with no activation step and no UI to get wrong.

The output is a single self-contained file so there is one thing to upload.
Regenerate after editing either source:

    python3 tools/gen_mu_plugin.py > aa-shortcodes-mu-plugin.php

IMPORTANT: the WPCode copies of these snippets must be deactivated first. Both
would define the same functions, and the second definition is a fatal error.
"""
import os
import re
import subprocess

SOURCES = [
    ('aa-home-cohorts-wpcode-snippet.php', 'aa_home_cohort_rows',
     'Homepage cohort cards + ticker  [aa_home_cohorts]'),
    ('aa-mini-calendar-wpcode-snippet.php', 'aa_mcal_render',
     'Course calendar + Xylus takeover  [aa_mini_calendar]'),
]

HEADER = '''<?php
/**
 * Plugin Name:  Agile Agilist — Shortcodes
 * Description:  Registers [aa_home_cohorts] and [aa_mini_calendar], and takes
 *               over the old Xylus calendar shortcodes. Must-use plugin: loaded
 *               by WordPress before regular plugins, with no activation step.
 * Version:      %(version)s
 * Requires PHP: 7.0
 *
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 *
 * These two bodies of code were originally WPCode PHP snippets, and on this
 * site WPCode PHP snippets do not run: both snippets failed to register their
 * shortcodes, so the homepage printed a literal "[aa_home_cohorts]" and the
 * calendar pages kept rendering the old Xylus calendar. mu-plugins are loaded
 * by WordPress core itself — there is no Activate toggle, no conditional logic,
 * and no snippet manager in the path that can silently drop them.
 *
 * INSTALL
 *   1. DEACTIVATE the two WPCode PHP snippets first. Leaving them active
 *      redeclares every function below, which is a PHP fatal error. (They are
 *      not doing anything today, so this costs nothing.)
 *   2. Upload this file to  wp-content/mu-plugins/  (create the folder if it
 *      does not exist). No activation — it is live as soon as it is there.
 *   3. Load the homepage. The cohort cards and the ticker should render.
 *      Put [aa_mcal_selftest] on any page and view it as an administrator to
 *      confirm what registered.
 *
 * UNINSTALL: delete the file. mu-plugins cannot be deactivated from the admin.
 *
 * DO NOT EDIT HERE. This file is generated from the two sources by
 * tools/gen_mu_plugin.py — edit those and regenerate, or the next regeneration
 * silently discards your change.
 * -----------------------------------------------------------------------------
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
'''

SECTION = '''
/* =============================================================================
   %(title)s
   from %(src)s
   ============================================================================= */
if ( ! function_exists( '%(probe)s' ) ) :

%(body)s

endif;
'''


def strip_open_tag(src):
    """Drop the leading <?php and the file's own ABSPATH guard.

    The guard is re-asserted once at the top of the bundle; repeating it inside
    a conditional block would be dead weight, and an `exit` there would be a
    surprising thing to leave in the middle of a generated file.
    """
    src = re.sub(r'^<\?php\s*', '', src, count=1)
    src = re.sub(r"^if \( ! defined\( 'ABSPATH' \) \) \{ exit; \}\s*", '', src,
                 count=1, flags=re.M)
    return src.rstrip() + '\n'


def version():
    """Stamp the bundle with the sources' commit so a live file is traceable."""
    try:
        out = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'],
                             capture_output=True, text=True, check=True)
        return out.stdout.strip() or '0'
    except Exception:
        return '0'


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    parts = [HEADER % {'version': version()}]
    for fname, probe, title in SOURCES:
        with open(os.path.join(root, fname)) as fh:
            body = strip_open_tag(fh.read())
        parts.append(SECTION % {'title': title, 'src': fname,
                                'probe': probe, 'body': body})
    print(''.join(parts).rstrip() + '\n')


if __name__ == '__main__':
    main()
