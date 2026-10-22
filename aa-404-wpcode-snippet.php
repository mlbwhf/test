<?php
/**
 * Agile Agilist — 404 PAGE  [no shortcode; renders on any 404]
 * ---------------------------------------------------------------------------
 * The design handoff (design_handoff_404) ships three files for an Astra CHILD
 * THEME: 404.php in the theme root, assets/aa-404.css, and an enqueue snippet
 * for functions.php. None of those can be used here as written, because this
 * site has no theme-file access -- everything is a WPCode snippet. So the same
 * page is delivered the only way it can be:
 *
 *   404.php              -> rendered on template_redirect, between the theme's
 *                           own get_header() and get_footer()
 *   assets/aa-404.css    -> inlined in wp_head, ON 404 PAGES ONLY
 *   functions.php snippet-> the wp_robots noindex filter, kept verbatim
 *
 * The markup, the CSS, the SVG and the copy are the handoff's, unchanged. What
 * changed is only how they are mounted, plus the two things below.
 *
 * TEMPLATE_REDIRECT AT 999, NOT A TEMPLATE FILTER. Rendering here and exiting
 * means the theme's own 404.php never runs, so there is no second 404 body
 * underneath this one. The late priority matters: a redirect plugin that turns
 * an old URL into a 301 hooks template_redirect too, and it has to get its
 * turn first -- a 301 to the real page is always better than a pretty 404.
 *
 * THE LINKS ARE CHECKED AT RUNTIME, which is the one place this departs from
 * the handoff's hard-coded hrefs. The handoff's own README leaves it open --
 * "Confirm /career-outcomes/, /assessments/, /contact/ exist" -- and a dead
 * link on the page whose entire job is dead links is the worst bug this page
 * could ship. So every destination resolves through get_page_by_path() and a
 * card whose page does not exist is dropped rather than rendered. The grid is
 * auto-fit, so three cards still fill the row; if that would leave fewer than
 * three, a spare is pulled in. /assessments/ is confirmed present (page
 * 15940); /career-outcomes/ could not be confirmed from here, which is exactly
 * why this check exists.
 *
 * Under Polylang each destination also resolves to its translation, so a
 * visitor who 404s at /fr/... is sent to /fr/services/ and not to the English
 * page. The COPY is still English only -- the handoff says so, and it goes
 * through the same translation route as the hero when that happens. Every
 * string lives in aa_404_copy() so there is one place to translate.
 *
 * THE REQUESTED PATH IS ECHOED, THE QUERY STRING IS NOT. It can carry a token,
 * a utm trail or an email address, none of which belongs on a rendered page.
 * Path only, capped at 120 characters, escaped.
 *
 * No JavaScript. All motion is CSS plus SVG SMIL, and prefers-reduced-motion
 * stops everything and hides the packets.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Off switch, so this can be disabled without deleting the snippet. */
function aa_404_enabled() { return true; }

/* ---------------------------------------------------------------------------
   Copy. One place, so a translator never has to read the markup.
   -------------------------------------------------------------------------- */
function aa_404_copy() {
	return array(
		'eyebrow'   => 'Error 404 · Route not found',
		'title_a'   => 'We mapped the whole model. ',
		'title_em'  => 'This node is missing.',
		'lede'      => 'The page you asked for has moved, or the link is out of date. '
		             . 'Every other part of the operating model still connects. Pick one below.',
		'btn_main'  => 'Browse services',
		'btn_home'  => 'Go to home page',
		'graph_alt' => 'Diagram of an operating model: six connected nodes around a '
		             . 'missing centre node labelled 404.',
		'links_h'   => 'Reconnect to',
		'help'      => 'Still can&rsquo;t find it? ',
		'help_cta'  => 'Tell us what you were looking for',
	);
}

/* ---------------------------------------------------------------------------
   Destinations, resolved rather than typed.
   -------------------------------------------------------------------------- */

/**
 * The permalink for a site path, in the CURRENT language, or '' if there is no
 * published page there. Cached per path: the cards and the buttons ask for the
 * same handful of paths.
 */
function aa_404_url( $path ) {
	static $memo = array();
	$key = (string) $path;
	if ( isset( $memo[ $key ] ) ) { return $memo[ $key ]; }

	$page = get_page_by_path( trim( $key, '/' ) );

	/* Polylang: send a French 404 to the French page. pll_get_post() returns
	   the translation in the current language, or false when there is none --
	   in which case the original stands, which is better than nothing. */
	if ( $page instanceof WP_Post && function_exists( 'pll_get_post' ) ) {
		$tr = pll_get_post( $page->ID );
		if ( $tr ) {
			$t = get_post( $tr );
			if ( $t instanceof WP_Post ) { $page = $t; }
		}
	}

	$url = ( $page instanceof WP_Post && $page->post_status === 'publish' )
		? (string) get_permalink( $page )
		: '';

	return $memo[ $key ] = $url;
}

/**
 * The four link cards from the handoff, minus any whose page is not there.
 *
 * The spares are only reached if dropping a card would leave fewer than three,
 * because two cards in a four-column auto-fit grid reads as a mistake.
 */
function aa_404_cards() {
	$want = array(
		array( '/services/',        'Services',     'Transformation and operating-model advisory.' ),
		array( '/training/',        'Training',     'Live SAFe&reg; and AI-Native certification courses.' ),
		array( '/assessments/',     'Assessments',  'Measure where your organization stands.' ),
		array( '/career-outcomes/', 'Career paths', 'See roles, progression and salary ranges.' ),
	);
	$spare = array(
		array( '/operating-model/', 'Operating model', 'The five layers, and the maturity signals for each.' ),
		array( '/customers/',       'Customers',       'The outcomes behind the training.' ),
		array( '/about/',           'About us',        'Who we are, and who we have done this for.' ),
	);

	$out = array();
	foreach ( $want as $c ) {
		$url = aa_404_url( $c[0] );
		if ( $url !== '' ) { $out[] = array( $url, $c[1], $c[2] ); }
	}
	foreach ( $spare as $c ) {
		if ( count( $out ) >= 3 ) { break; }
		$url = aa_404_url( $c[0] );
		if ( $url === '' ) { continue; }
		foreach ( $out as $have ) { if ( $have[0] === $url ) { continue 2; } }
		$out[] = array( $url, $c[1], $c[2] );
	}
	return $out;
}

/** The path that 404'd. Never the query string. */
function aa_404_path() {
	$uri  = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';
	$path = wp_parse_url( $uri, PHP_URL_PATH );
	if ( ! $path ) { return '/'; }
	return function_exists( 'mb_substr' ) ? mb_substr( $path, 0, 120 ) : substr( $path, 0, 120 );
}

/* ---------------------------------------------------------------------------
   noindex — the handoff's functions.php filter, unchanged.
   An SEO plugin normally does this; this is the belt to its braces, and it is
   written so it cannot fight one (both only ever ADD noindex).
   -------------------------------------------------------------------------- */
add_filter( 'wp_robots', 'aa_404_robots' );

function aa_404_robots( $robots ) {
	if ( aa_404_enabled() && is_404() ) {
		$robots['noindex'] = true;
		$robots['follow']  = true;
	}
	return $robots;
}

/* ---------------------------------------------------------------------------
   The stylesheet. Inline, and only on a 404.
   The handoff enqueues it as a child-theme asset; there is nowhere to put the
   file, and a site-wide WPCode CSS snippet would ship 3KB to every page on the
   site for one page nobody is supposed to reach. Inline here means it also
   cannot drift out of step with the markup below it.
   -------------------------------------------------------------------------- */
add_action( 'wp_head', 'aa_404_head', 5 );

function aa_404_head() {
	if ( ! aa_404_enabled() || ! is_404() ) { return; }

	/* Instrument Serif for the italic clause in the headline, IBM Plex Mono for
	   the eyebrow, the GET line and the 404 glyph. The body face is inherited
	   from the theme on purpose -- .aa-404 sets font-family:inherit -- so this
	   does not drop a second sans onto the page. */
	echo '<link rel="preconnect" href="https://fonts.googleapis.com">'
	   . '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
	   . '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
	   . 'family=Instrument+Serif:ital@0;1&amp;family=IBM+Plex+Mono:wght@500;600&amp;display=swap">';

	echo '<style id="aa-404-css">' . aa_404_css() . '</style>';
}

function aa_404_css() {
	return <<<'CSS'
.aa-404{--aa-ink:#0B2E35;--aa-teal:#0E8074;--aa-mint:#8FCFCF;--aa-mist:#B9DCDC;--aa-warn:#FFB59E;position:relative;overflow:hidden;background:var(--aa-ink);color:#fff;font-family:inherit;-webkit-font-smoothing:antialiased;min-height:70vh}
.aa-404 *{box-sizing:border-box}
.aa-404 a{color:var(--aa-mint);text-decoration:none}
.aa-404 a:hover,.aa-404 a:focus-visible{color:#fff}
.aa-404__dots{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(rgba(143,207,207,.14) 1px,transparent 1px);background-size:28px 28px;-webkit-mask-image:radial-gradient(ellipse at 70% 45%,#000 0,transparent 70%);mask-image:radial-gradient(ellipse at 70% 45%,#000 0,transparent 70%)}
.aa-404__main{position:relative;max-width:1200px;margin:0 auto;padding:clamp(32px,6vw,72px) clamp(16px,4vw,40px);display:flex;flex-direction:column;gap:clamp(36px,5vw,56px)}
.aa-404__hero{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:clamp(24px,4vw,56px);align-items:center}
.aa-404__copy{display:flex;flex-direction:column;gap:20px}
.aa-404__eyebrow,.aa-404__h2{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;font-weight:600;color:var(--aa-mint);margin:0}
.aa-404__title{margin:0;font-size:clamp(36px,6.6vw,68px);line-height:1.03;letter-spacing:-.035em;font-weight:600;text-wrap:balance;color:#fff}
.aa-404__title em{font-family:"Instrument Serif",Georgia,serif;font-weight:400;font-style:italic;color:var(--aa-mint)}
.aa-404__lede{margin:0;font-size:17px;line-height:1.6;color:var(--aa-mist);max-width:52ch;text-wrap:pretty}
.aa-404__req{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:10px;background:rgba(143,207,207,.08);border:1px solid rgba(143,207,207,.22);align-self:flex-start;max-width:100%;min-width:0;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:13px}
.aa-404__req code{font:inherit;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;direction:ltr}
.aa-404__req .get{color:var(--aa-mint);flex:none}.aa-404__req .code{color:var(--aa-warn);font-weight:600;font-size:12px;flex:none}
.aa-404__caret{color:var(--aa-mint);animation:aa404-blink 1s steps(1) infinite}
.aa-404__actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:4px}
.aa-404 .aa-404__btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 28px;border-radius:100px;font-weight:600;font-size:15.5px;line-height:1;transition:background .2s,color .2s,border-color .2s}
.aa-404 .aa-404__btn--primary{background:var(--aa-mint);color:var(--aa-ink);font-weight:700}
.aa-404 .aa-404__btn--primary:hover,.aa-404 .aa-404__btn--primary:focus-visible{background:#fff;color:var(--aa-ink)}
.aa-404 .aa-404__btn--ghost{border:1px solid rgba(143,207,207,.5);color:#fff}
.aa-404 .aa-404__btn--ghost:hover,.aa-404 .aa-404__btn--ghost:focus-visible{border-color:#fff}
.aa-404__arrow{display:inline-block}
[dir=rtl] .aa-404__arrow{transform:scaleX(-1)}
.aa-404__graph{width:100%;max-width:560px;justify-self:center;aspect-ratio:1/1}
.aa-404__graph svg{display:block;width:100%;height:100%;overflow:visible}
.aa-404__links{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px}
.aa-404 .aa-404__card{display:flex;flex-direction:column;gap:6px;padding:18px;min-height:96px;border:1px solid rgba(143,207,207,.25);border-radius:14px;background:rgba(143,207,207,.06);transition:border-color .2s,background .2s}
.aa-404 .aa-404__card:hover,.aa-404 .aa-404__card:focus-visible{border-color:var(--aa-mint);background:rgba(143,207,207,.14)}
.aa-404__card strong{font-size:16px;font-weight:600;letter-spacing:-.01em;color:#fff}
.aa-404__card span{font-size:13.5px;line-height:1.45;color:var(--aa-mist)}
.aa-404__help{margin:0;font-size:14.5px;color:var(--aa-mist)}.aa-404__help a{font-weight:600;text-decoration:underline;text-underline-offset:3px}
.aa-404 [data-r]{opacity:0;animation:aa404-rise .7s cubic-bezier(.2,.7,.2,1) forwards;animation-delay:var(--d,0s)}
.aa-404__ring{transform-box:fill-box;transform-origin:center;animation:aa404-pulse 3.2s ease-out infinite}
.aa-404__orbit{transform-box:fill-box;transform-origin:center;animation:aa404-spin 28s linear infinite}
.aa-404__orbit2{transform-box:fill-box;transform-origin:center;animation:aa404-spin-r 40s linear infinite}
.aa-404__flick{animation:aa404-flicker 4.5s steps(1) infinite}
.aa-404__drift{animation:aa404-drift 9s ease-in-out infinite}
.aa-404__edge{animation:aa404-dash 1.6s linear infinite}
@keyframes aa404-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes aa404-spin{to{transform:rotate(360deg)}}
@keyframes aa404-spin-r{to{transform:rotate(-360deg)}}
@keyframes aa404-pulse{0%{opacity:.55;transform:scale(1)}100%{opacity:0;transform:scale(2.6)}}
@keyframes aa404-flicker{0%,100%{opacity:1}8%{opacity:.25}10%{opacity:1}52%{opacity:1}54%{opacity:.4}57%{opacity:1}80%{opacity:.85}}
@keyframes aa404-drift{0%,100%{transform:translate(0,0)}25%{transform:translate(5px,-6px)}50%{transform:translate(-4px,4px)}75%{transform:translate(6px,5px)}}
@keyframes aa404-dash{to{stroke-dashoffset:-24}}
@keyframes aa404-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.aa-404 [data-r]{opacity:1;animation:none}.aa-404__ring,.aa-404__orbit,.aa-404__orbit2,.aa-404__flick,.aa-404__drift,.aa-404__edge,.aa-404__caret{animation:none}.aa-404__pkt{display:none}}
/* Astra: make the 404 full-bleed */
body.error404 .site-content>.ast-container{display:block;max-width:none;padding:0}
body.error404 #primary{width:100%;margin:0;padding:0}
body.error404 .ast-breadcrumbs-wrapper{display:none}
CSS;
}

/* ---------------------------------------------------------------------------
   The diagram. Six nodes, packets that set off for the centre and fall back.
   Verbatim from the handoff; aria-hidden, with the description carried by the
   role="img" wrapper so a screen reader hears one sentence, not 40 shapes.
   -------------------------------------------------------------------------- */
function aa_404_svg() {
	return <<<'SVG'
<svg viewBox="0 0 400 400" aria-hidden="true" focusable="false">
<circle cx="200" cy="200" r="138" fill="none" stroke="rgba(143,207,207,.14)"/>
<g class="aa-404__orbit2"><circle cx="200" cy="200" r="176" fill="none" stroke="rgba(143,207,207,.18)" stroke-dasharray="2 9"/></g>
<line class="aa-404__edge" x1="200" y1="62" x2="200" y2="200" stroke="rgba(143,207,207,.35)" stroke-width="1.2" stroke-dasharray="4 8"/>
<circle class="aa-404__pkt" r="3.4" fill="#8FCFCF"><animateMotion dur="3.4s" begin="0s" repeatCount="indefinite" path="M200 62 L200 200" keyPoints="0;0.78;0" keyTimes="0;0.6;1" calcMode="linear"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.55;1" dur="3.4s" begin="0s" repeatCount="indefinite"/></circle>
<line class="aa-404__edge" x1="319.5" y1="131" x2="200" y2="200" stroke="rgba(143,207,207,.35)" stroke-width="1.2" stroke-dasharray="4 8"/>
<circle class="aa-404__pkt" r="3.4" fill="#8FCFCF"><animateMotion dur="3.4s" begin="0.55s" repeatCount="indefinite" path="M319.5 131 L200 200" keyPoints="0;0.78;0" keyTimes="0;0.6;1" calcMode="linear"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.55;1" dur="3.4s" begin="0.55s" repeatCount="indefinite"/></circle>
<line class="aa-404__edge" x1="319.5" y1="269" x2="200" y2="200" stroke="rgba(143,207,207,.35)" stroke-width="1.2" stroke-dasharray="4 8"/>
<circle class="aa-404__pkt" r="3.4" fill="#8FCFCF"><animateMotion dur="3.4s" begin="1.1s" repeatCount="indefinite" path="M319.5 269 L200 200" keyPoints="0;0.78;0" keyTimes="0;0.6;1" calcMode="linear"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.55;1" dur="3.4s" begin="1.1s" repeatCount="indefinite"/></circle>
<line class="aa-404__edge" x1="200" y1="338" x2="200" y2="200" stroke="rgba(143,207,207,.35)" stroke-width="1.2" stroke-dasharray="4 8"/>
<circle class="aa-404__pkt" r="3.4" fill="#8FCFCF"><animateMotion dur="3.4s" begin="1.65s" repeatCount="indefinite" path="M200 338 L200 200" keyPoints="0;0.78;0" keyTimes="0;0.6;1" calcMode="linear"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.55;1" dur="3.4s" begin="1.65s" repeatCount="indefinite"/></circle>
<line class="aa-404__edge" x1="80.5" y1="269" x2="200" y2="200" stroke="rgba(143,207,207,.35)" stroke-width="1.2" stroke-dasharray="4 8"/>
<circle class="aa-404__pkt" r="3.4" fill="#8FCFCF"><animateMotion dur="3.4s" begin="2.2s" repeatCount="indefinite" path="M80.5 269 L200 200" keyPoints="0;0.78;0" keyTimes="0;0.6;1" calcMode="linear"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.55;1" dur="3.4s" begin="2.2s" repeatCount="indefinite"/></circle>
<line class="aa-404__edge" x1="80.5" y1="131" x2="200" y2="200" stroke="rgba(143,207,207,.35)" stroke-width="1.2" stroke-dasharray="4 8"/>
<circle class="aa-404__pkt" r="3.4" fill="#8FCFCF"><animateMotion dur="3.4s" begin="2.75s" repeatCount="indefinite" path="M80.5 131 L200 200" keyPoints="0;0.78;0" keyTimes="0;0.6;1" calcMode="linear"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.55;1" dur="3.4s" begin="2.75s" repeatCount="indefinite"/></circle>
<g><circle class="aa-404__ring" cx="200" cy="62" r="9" fill="none" stroke="#8FCFCF" stroke-width="1.2" style="animation-delay:0s"/><circle cx="200" cy="62" r="9" fill="#0B2E35" stroke="#8FCFCF" stroke-width="2"/><circle cx="200" cy="62" r="3.2" fill="#8FCFCF"/><text x="200" y="46" text-anchor="middle" font-size="12" font-weight="600" fill="#DDEFEF" font-family="inherit">Strategy</text></g>
<g><circle class="aa-404__ring" cx="319.5" cy="131" r="9" fill="none" stroke="#8FCFCF" stroke-width="1.2" style="animation-delay:0.5s"/><circle cx="319.5" cy="131" r="9" fill="#0B2E35" stroke="#8FCFCF" stroke-width="2"/><circle cx="319.5" cy="131" r="3.2" fill="#8FCFCF"/><text x="335.5" y="135" text-anchor="start" font-size="12" font-weight="600" fill="#DDEFEF" font-family="inherit">Value streams</text></g>
<g><circle class="aa-404__ring" cx="319.5" cy="269" r="9" fill="none" stroke="#8FCFCF" stroke-width="1.2" style="animation-delay:1s"/><circle cx="319.5" cy="269" r="9" fill="#0B2E35" stroke="#8FCFCF" stroke-width="2"/><circle cx="319.5" cy="269" r="3.2" fill="#8FCFCF"/><text x="335.5" y="273" text-anchor="start" font-size="12" font-weight="600" fill="#DDEFEF" font-family="inherit">Teams</text></g>
<g><circle class="aa-404__ring" cx="200" cy="338" r="9" fill="none" stroke="#8FCFCF" stroke-width="1.2" style="animation-delay:1.5s"/><circle cx="200" cy="338" r="9" fill="#0B2E35" stroke="#8FCFCF" stroke-width="2"/><circle cx="200" cy="338" r="3.2" fill="#8FCFCF"/><text x="200" y="362" text-anchor="middle" font-size="12" font-weight="600" fill="#DDEFEF" font-family="inherit">Delivery</text></g>
<g><circle class="aa-404__ring" cx="80.5" cy="269" r="9" fill="none" stroke="#8FCFCF" stroke-width="1.2" style="animation-delay:2s"/><circle cx="80.5" cy="269" r="9" fill="#0B2E35" stroke="#8FCFCF" stroke-width="2"/><circle cx="80.5" cy="269" r="3.2" fill="#8FCFCF"/><text x="64.5" y="273" text-anchor="end" font-size="12" font-weight="600" fill="#DDEFEF" font-family="inherit">Governance</text></g>
<g><circle class="aa-404__ring" cx="80.5" cy="131" r="9" fill="none" stroke="#8FCFCF" stroke-width="1.2" style="animation-delay:2.5s"/><circle cx="80.5" cy="131" r="9" fill="#0B2E35" stroke="#8FCFCF" stroke-width="2"/><circle cx="80.5" cy="131" r="3.2" fill="#8FCFCF"/><text x="64.5" y="135" text-anchor="end" font-size="12" font-weight="600" fill="#DDEFEF" font-family="inherit">Customers</text></g>
<g class="aa-404__drift"><circle cx="200" cy="200" r="52" fill="rgba(255,181,158,.07)"/><g class="aa-404__orbit"><circle cx="200" cy="200" r="46" fill="none" stroke="#FFB59E" stroke-width="1.6" stroke-dasharray="7 7" stroke-linecap="round"/></g><text class="aa-404__flick" x="200" y="209" text-anchor="middle" font-size="30" font-weight="600" fill="#FFB59E" font-family="IBM Plex Mono,monospace">404</text><text x="200" y="228" text-anchor="middle" font-size="8.5" letter-spacing="1" fill="#FFB59E" font-family="IBM Plex Mono,monospace">OPERATING-MODEL</text></g>
</svg>
SVG;
}

/* ---------------------------------------------------------------------------
   The page body.
   -------------------------------------------------------------------------- */
function aa_404_body() {
	$t     = aa_404_copy();
	$cards = aa_404_cards();
	$home  = home_url( '/' );

	/* The primary button wants Services. If there is no Services page it takes
	   the first card instead, and only then falls back to home -- two buttons
	   both pointing at the home page is not two buttons. */
	$main = aa_404_url( '/services/' );
	if ( $main === '' ) { $main = $cards ? $cards[0][0] : $home; }

	$h  = '<main id="primary" class="site-main">';
	$h .= '<section class="aa-404" aria-labelledby="aa-404-title">';
	$h .= '<div class="aa-404__dots" aria-hidden="true"></div>';
	$h .= '<div class="aa-404__main">';

	$h .= '<div class="aa-404__hero"><div class="aa-404__copy">';
	$h .= '<p class="aa-404__eyebrow" data-r style="--d:.05s">' . esc_html( $t['eyebrow'] ) . '</p>';
	$h .= '<h1 class="aa-404__title" id="aa-404-title" data-r style="--d:.15s">'
	    . esc_html( $t['title_a'] ) . '<em>' . esc_html( $t['title_em'] ) . '</em></h1>';
	$h .= '<p class="aa-404__lede" data-r style="--d:.28s">' . esc_html( $t['lede'] ) . '</p>';

	/* The GET line. Path only, escaped. */
	$h .= '<div class="aa-404__req" data-r style="--d:.4s">'
	    . '<span class="get" aria-hidden="true">GET</span>'
	    . '<code dir="ltr">' . esc_html( aa_404_path() )
	    . '<span class="aa-404__caret" aria-hidden="true">&#9613;</span></code>'
	    . '<span class="code">404</span></div>';

	$h .= '<div class="aa-404__actions" data-r style="--d:.52s">'
	    . '<a class="aa-404__btn aa-404__btn--primary" href="' . esc_url( $main ) . '">'
	    . esc_html( $t['btn_main'] ) . ' <span class="aa-404__arrow" aria-hidden="true">&#10230;</span></a>'
	    . '<a class="aa-404__btn aa-404__btn--ghost" href="' . esc_url( $home ) . '">'
	    . esc_html( $t['btn_home'] ) . '</a>'
	    . '</div>';
	$h .= '</div>';

	$h .= '<div class="aa-404__graph" data-r style="--d:.3s" role="img" aria-label="'
	    . esc_attr( $t['graph_alt'] ) . '">' . aa_404_svg() . '</div>';
	$h .= '</div>';

	if ( $cards ) {
		$h .= '<nav aria-labelledby="aa-404-links">';
		$h .= '<h2 class="aa-404__h2" id="aa-404-links" style="margin-bottom:16px">'
		    . esc_html( $t['links_h'] ) . '</h2>';
		$h .= '<div class="aa-404__links">';
		$d = 0.6;
		foreach ( $cards as $c ) {
			$h .= '<a class="aa-404__card" data-r style="--d:' . esc_attr( number_format( $d, 2, '.', '' ) ) . 's"'
			    . ' href="' . esc_url( $c[0] ) . '">'
			    . '<strong>' . esc_html( $c[1] )
			    . ' <span class="aa-404__arrow" aria-hidden="true" style="color:#8FCFCF">&#10230;</span></strong>'
			    . '<span>' . wp_kses( $c[2], array() ) . '</span>'
			    . '</a>';
			$d += 0.08;
		}
		$h .= '</div></nav>';
	}

	$contact = aa_404_url( '/contact/' );
	if ( $contact === '' ) { $contact = aa_404_url( '/about/contact/' ); }
	if ( $contact !== '' ) {
		$h .= '<p class="aa-404__help">' . $t['help']
		    . '<a href="' . esc_url( $contact ) . '">' . esc_html( $t['help_cta'] ) . '</a>.</p>';
	}

	$h .= '</div></section></main>';
	return $h;
}

/* ---------------------------------------------------------------------------
   Mount it.
   -------------------------------------------------------------------------- */
add_action( 'template_redirect', 'aa_404_render', 999 );

function aa_404_render() {
	if ( ! aa_404_enabled() || is_admin() || ! is_404() ) { return; }

	/* A 404 is not always a page view. Feeds, robots.txt, AJAX and the REST
	   API all reach template_redirect on a miss, and none of them wants a
	   themed HTML body. */
	if ( is_robots() || is_feed() || is_comment_feed() ) { return; }
	if ( function_exists( 'wp_doing_ajax' ) && wp_doing_ajax() ) { return; }
	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) { return; }
	if ( defined( 'DOING_CRON' ) && DOING_CRON ) { return; }

	/* WordPress has already sent this; stated again so the status cannot be
	   lost to anything that rendered before us. */
	status_header( 404 );
	nocache_headers();

	get_header();
	echo aa_404_body();   /* escaped field by field in aa_404_body() */
	get_footer();
	exit;
}
