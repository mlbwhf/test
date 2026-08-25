#!/usr/bin/env python3
"""Bundle the shortcode snippets into one must-use plugin.

The WPCode copies of these snippets never register their shortcodes on
agile-agilist.com. The live homepage texturized `part="ticker"` into curly
quotes — WordPress only does that outside registered shortcodes — and the
site-down reproduction below shows the cohorts copy DOES define its early
functions, i.e. it executes partially and stops before add_shortcode: the
signature of a truncated paste. A must-use plugin sidesteps the whole
question: files in wp-content/mu-plugins/ are loaded whole by WordPress
itself, before regular plugins, with no editor paste in the path.

The output is a single self-contained file so there is one thing to upload.
Regenerate after editing either source:

    python3 tools/gen_mu_plugin.py > aa-shortcodes-mu-plugin.php

Every function in the output is renamed to an aamu_ prefix so the bundle can
never collide with whatever the WPCode snippet manager still holds — the
first bundle shared the snippets' function names and a stale WPCode copy
redeclaring one took the whole site down (reproduced). Shortcode tags are
left as-is; re-registering a tag is safe by design in WordPress.
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
 * These two bodies of code were originally WPCode PHP snippets. On this site
 * the stored copies execute but never register their shortcodes — the
 * evidence fits a paste truncated at a clean function boundary: it parses,
 * runs silently, defines its early functions, and never reaches its
 * add_shortcode call. So the homepage printed a literal "[aa_home_cohorts]"
 * and the calendar pages kept the old Xylus calendar. This file is loaded by
 * WordPress core itself, whole, with no editor paste in the path.
 *
 * WHY EVERY FUNCTION IS PREFIXED aamu_
 *
 * The first bundle used the snippets' own function names and took the site
 * down on upload: WPCode runs its (partial) copies AFTER mu-plugins, and
 * redefining a function is a PHP fatal on every request, admin included —
 * reproduced exactly against the stored copies. With its own prefix this
 * file cannot collide with anything WPCode holds, in any state, in any
 * order. The shortcode TAGS are unchanged — re-registering a tag is normal
 * WordPress behaviour, never a fatal.
 *
 * INSTALL
 *   1. UPLOAD this file into  wp-content/mu-plugins/  (create the folder if
 *      needed) using the file manager's Upload — do not create an empty file
 *      and paste into a web editor, which is how code gets truncated. After
 *      upload, confirm the file size matches the local file.
 *   2. Load the homepage: cohort cards and ticker should render. Put
 *      [aa_mcal_selftest] on any page and view it as an administrator to see
 *      what registered. The WPCode snippets can stay active or not — they
 *      cannot conflict with this file either way.
 *
 * IF THE SITE EVER WHITE-SCREENS AFTER A CHANGE HERE: delete this file via
 * the file manager and the site is back instantly; then check the
 * "Your Site is Experiencing a Technical Issue" email WordPress sends the
 * admin — it names the exact file and line of the fatal.
 *
 * The calendar's CSS and JS are NOT in here — they install as their own
 * WPCode CSS and JavaScript snippets (snippets/calendar/aa-calendar.css and
 * aa-calendar.js). This file carries PHP only.
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

# No wrapper of our own: each source now carries its whole body inside an
# `if ( ! function_exists(...) ) : ... endif;` double-load guard, which also
# protects this bundle against a WPCode copy left active beside it. (An early
# `return` cannot do this job — PHP binds unconditional top-level functions at
# compile time, so the redeclare fatal fires before any guard statement runs.)
SECTION = '''
/* =============================================================================
   %(title)s
   from %(src)s
   ============================================================================= */
%(body)s
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


def rename_functions(body):
    """Give every function in the bundle its own aamu_ prefix.

    Installing the first bundle took the live site down. The function_exists
    guards protect whichever copy loads SECOND — but WPCode snippets run after
    mu-plugins, and the copies stored in WPCode are whatever was pasted there,
    guardless and in an unknown state (the homepage evidence says at least one
    executes partially without ever reaching its add_shortcode call). A
    same-named function in that copy redeclares one defined here: fatal, on
    every request, admin included.

    Renaming ends the whole class of failure instead of managing it: no
    function here shares a name with any snippet, past or future, so no load
    order and no stale paste can collide with this file. Shortcode TAGS are
    left untouched deliberately — re-registering a tag is how WordPress
    shortcodes work (last registration wins, never a fatal), and the tags are
    the public interface the pages use.

    The rename is mechanical: collect every `function aa_*` the sources
    declare, then word-boundary-replace each name everywhere — declarations,
    call sites, and the 'aa_...' string literals used by function_exists
    guards and callable references.
    """
    names = sorted(set(re.findall(r'\bfunction\s+(aa_\w+)', body)),
                   key=len, reverse=True)
    for name in names:
        body = re.sub(r'\b%s\b' % re.escape(name), 'aamu' + name[2:], body)
    return body


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
    bodies = []
    for fname, probe, title in SOURCES:
        with open(os.path.join(root, fname)) as fh:
            bodies.append((title, fname, strip_open_tag(fh.read())))
    # Rename across the CONCATENATION so cross-file call sites (none today,
    # but cheap insurance) rename consistently.
    joined = '\x00'.join(b for _, _, b in bodies)
    joined = rename_functions(joined)
    for (title, fname, _), body in zip(bodies, joined.split('\x00')):
        parts.append(SECTION % {'title': title, 'src': fname, 'body': body})
    print(''.join(parts).rstrip() + '\n')


if __name__ == '__main__':
    main()
