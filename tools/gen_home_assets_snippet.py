# -*- coding: utf-8 -*-
"""Rebuild aa-home-assets-wpcode-snippet.php from aa-home.css and aa-home.js.

The WPCode snippet carries the CSS and the JS inline, because on this site a
<style> or <script> pasted into a Custom HTML block is stripped by wp_kses and
"&&" in inline JS is entity-encoded by the editor. Enqueuing from PHP avoids
both.

The cost of that is a second copy of two files, and it went stale exactly once:
four sections were added to the page and the snippet still served the CSS from
before them, so those sections rendered as unstyled text. Generating the PHP
means the copy cannot drift again — regenerate after any CSS or JS edit.

    python3 tools/gen_home_assets_snippet.py
"""
import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS = "redesign-build/aa-home/aa-home.css"
JS = "redesign-build/aa-home/aa-home.js"
OUT = "aa-home-assets-wpcode-snippet.php"

HEADER = '''<?php
/**
 * Agile Agilist — HOME page assets (aa-home.css + aa-home.js)
 * -----------------------------------------------------------------------------
 * GENERATED FILE — do not hand-edit.
 *   Source:    redesign-build/aa-home/aa-home.css
 *              redesign-build/aa-home/aa-home.js
 *   Rebuild:   python3 tools/gen_home_assets_snippet.py
 * Editing the CSS here instead of at the source is how this file went stale
 * and left four sections of the page unstyled.
 *
 * WHY THIS EXISTS
 * On WordPress.com / Atomic, `unfiltered_html` is disabled, so <style> and
 * <script> pasted into a Custom HTML block are stripped by wp_kses before they
 * ever reach the browser. The markup survives; the CSS and the behaviour do
 * not — which looks exactly like "the design and the effects are missing".
 * The editor also rewrites `&&` to `&#038;&#038;` in inline JS, which is a
 * SyntaxError that kills every effect on the page.
 *
 * Enqueuing from a WPCode PHP snippet bypasses both, so the rotating
 * spotlights (cohorts, training tracks, assessments, proof cards, methodology
 * rows, layers, steps, testimonials), the report-panel swap, bar fills,
 * count-ups and the ticker all work.
 *
 * INSTALL / UPDATE
 *   WPCode -> Add Snippet -> PHP Snippet -> paste this WHOLE file -> Auto
 *   Insert, Run Everywhere -> Save + Activate.
 *   Updating: open the existing snippet, select all, and paste this file over
 *   it. It is a full replacement, not something to append to.
 *   Then paste the MARKUP-ONLY block (home-961-v3-markup-only.html) into the
 *   page. That block contains no <style> or <script>, so nothing is stripped.
 *
 * SCOPE
 *   The English front page plus the ES and FR home pages, which are ordinary
 *   pages and would otherwise load none of this — the same markup with no CSS
 *   renders as a column of plain text. Their IDs are in AA_HOME_PAGES below;
 *   change them there if the pages are ever recreated.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** /es/ and /fr/ — the translated home pages. The English home is the front page. */
if ( ! defined( 'AA_HOME_PAGES' ) ) { define( 'AA_HOME_PAGES', '29277,29281' ); }

add_action( 'wp_enqueue_scripts', function () {

\t$extra = array_filter( array_map( 'intval', explode( ',', AA_HOME_PAGES ) ) );
\tif ( ! is_front_page() && ! is_page( $extra ) ) { return; }

\twp_enqueue_style(
\t\t'aa-fonts',
\t\t'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap',
\t\tarray(),
\t\tnull
\t);

\t// No stylesheet file to host: register an empty handle and hang the CSS off it.
\twp_register_style( 'aa-home', false, array( 'aa-fonts' ), '%(ver)s' );
\twp_enqueue_style( 'aa-home' );
\twp_add_inline_style( 'aa-home', aa_home_css() );

\twp_register_script( 'aa-home', '', array(), '%(ver)s', true );
\twp_enqueue_script( 'aa-home' );
\twp_add_inline_script( 'aa-home', aa_home_js() );
}, 20 );
'''


def nowdoc(fn_name, terminator, body):
    """A PHP function returning body as a nowdoc — no interpolation, no escaping."""
    for i, line in enumerate(body.split("\n"), 1):
        if line.startswith(terminator):
            raise SystemExit("line %d starts with the nowdoc terminator %r — "
                             "it would close the block early" % (i, terminator))
    return "\nfunction %s() {\n\treturn <<<'%s'\n%s\n%s;\n}\n" % (
        fn_name, terminator, body.rstrip("\n"), terminator)


def main():
    css = io.open(os.path.join(ROOT, CSS), encoding='utf-8').read()
    js = io.open(os.path.join(ROOT, JS), encoding='utf-8').read()

    # Bump the enqueue version with the content so browsers and page caches
    # cannot serve the previous CSS against the new markup.
    import hashlib
    ver = hashlib.sha1((css + js).encode('utf-8')).hexdigest()[:8]

    php = (HEADER % {"ver": ver}
           + nowdoc("aa_home_css", "AA_HOME_CSS", css)
           + nowdoc("aa_home_js", "AA_HOME_JS", js))

    path = os.path.join(ROOT, OUT)
    io.open(path, 'w', encoding='utf-8').write(php)
    print("  wrote %s (%d bytes)" % (OUT, len(php)))
    print("  css %d bytes, js %d bytes, asset version %s" % (len(css), len(js), ver))


if __name__ == "__main__":
    main()
