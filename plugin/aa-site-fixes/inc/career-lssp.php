<?php
/**
 * AA — Career paths: Large Solution SAFe (LSSP) after RTE on the delivery ladder
 *
 * The delivery ladder on [aa_career_paths] runs Scrum Master → SASM → RTE and
 * stops, although the delivery track itself ends at Large Solution SAFe: the
 * salary chart names it as the destination and the RTE course page lists it
 * as the next step. The ladder left it out on purpose -- every step is drawn
 * as a salary bar and no source publishes a median for LSSP yet -- so it is
 * added here as a "Next step" card after the bars, with the next real cohort
 * and a Register link, and no salary figure. If a sourced median is ever added
 * to the salary data, LSSP can become a fourth bar instead.
 *
 * Done on the finished shortcode HTML, so the WPCode snippets are untouched.
 * It applies everywhere the delivery ladder shows: the home page, the SAFe by
 * Role and Advanced SAFe track pages, and the Scrum Master, SASM and RTE
 * course pages.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_lssp_card' ) ) :

function aa_sf_lssp_info() {
	return apply_filters( 'aa_sf_lssp_info', array(
		'code'  => 'LSSP',
		'name'  => 'Large Solution SAFe®',
		'path'  => '/training/adv-safe/large-solution/',
		'after' => 'RTE',
		'about' => 'For RTEs whose job grows from one train to several: coordinating trains, suppliers and '
		         . 'compliance across a large system. Foundational level, no prerequisites.',
		'role'  => 'Solution Train Engineer, multi-train delivery lead',
	) );
}

function aa_sf_lssp_card() {
	$i   = aa_sf_lssp_info();
	$url = function_exists( 'aa_reg_code_url' ) ? (string) aa_reg_code_url( $i['code'] ) : '';
	if ( $url === '' ) { $url = home_url( $i['path'] ); }
	$c = function_exists( 'aacp_cohort' ) ? aacp_cohort( array( 'code' => $i['code'], 'url' => $url ) ) : null;
	$when = ( $c && function_exists( 'aacp_range' ) )
		? '<time datetime="' . esc_attr( $c['start'] ) . '">' . esc_html( aacp_range( $c['start'], $c['end'] ) ) . '</time>'
		: '<strong>New dates soon</strong>';

	static $css = false;
	$style = '';
	if ( ! $css ) {
		$css   = true;
		$style = '<style id="aa-sf-lssp-css">'
		       . '.aacp-then{margin:22px 0 0;display:grid;grid-template-columns:auto 1fr auto;gap:14px 18px;align-items:center;padding:16px 18px;border-radius:16px;border:1.5px dashed var(--teal,#0E8074);background:rgba(242,182,109,.10)}'
		       . '.aacp-then__arrow{font-size:20px;font-weight:700;color:var(--teal,#0E8074)}'
		       . '.aacp-then__k{margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--teal,#0E8074)}'
		       . '.aacp-then__new{display:inline-block;margin-right:8px;padding:2px 8px;border-radius:100px;background:var(--amber,#F2B66D);color:var(--ink,#0B2E35);letter-spacing:.06em}'
		       . '.aacp-then h5{margin:0 0 4px;font-size:18px;line-height:1.3}'
		       . '.aacp-then h5 a{color:inherit;text-decoration:none}.aacp-then h5 a:hover{text-decoration:underline}'
		       . '.aacp-then__about,.aacp-then__role{margin:0;font-size:14px;line-height:1.5}'
		       . '.aacp-then__role{margin-top:4px;opacity:.85}'
		       . '.aacp-then__foot{display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-size:13px;white-space:nowrap}'
		       . '.aacp-then h5 abbr{color:var(--teal,#0E8074);text-decoration:none;border:0}'
		       . '.aacp-then .aacp-reg{min-width:160px;padding:0 22px}'
		       . '@media (max-width:720px){.aacp-then{grid-template-columns:1fr}.aacp-then__arrow{display:none}.aacp-then__foot{align-items:stretch;white-space:normal}.aacp-then .aacp-reg{width:100%}}'
		       . '</style>';
	}

	return $style
		. '<div class="aacp-then" data-code="' . esc_attr( $i['code'] ) . '">'
		. '<span class="aacp-then__arrow" aria-hidden="true">&#10230;</span>'
		. '<div><p class="aacp-then__k"><span class="aacp-then__new">New class</span>Next step after ' . esc_html( $i['after'] ) . '</p>'
		. '<h5><a href="' . esc_url( $url ) . '">' . esc_html( $i['name'] ) . '</a> <abbr title="' . esc_attr( $i['name'] ) . '">(' . esc_html( $i['code'] ) . ')</abbr></h5>'
		. '<p class="aacp-then__about">' . esc_html( $i['about'] ) . '</p>'
		. '<p class="aacp-then__role">Unlocks — ' . esc_html( $i['role'] ) . '</p></div>'
		. '<div class="aacp-then__foot"><span class="aacp-next">Next cohort · ' . $when . '</span>'
		. '<a class="aacp-reg" href="' . esc_url( $c ? $c['url'] : $url ) . '" aria-label="' . esc_attr( 'Register for ' . $i['name'] ) . '">Register <span aria-hidden="true">&#10230;</span></a></div>'
		. '</div>';
}

/** Insert the card after the bars of every delivery-ladder panel in the shortcode output. */
function aa_sf_lssp_inject( $html ) {
	if ( ! is_string( $html ) || strpos( $html, '-path-delivery"' ) === false || strpos( $html, 'class="aacp-then"' ) !== false ) { return $html; }
	$out = preg_replace_callback(
		'~(<article class="aacp-panel" id="[^"]*-path-delivery"[^>]*>.*?</ol>)~s',
		function ( $m ) { return $m[1] . aa_sf_lssp_card(); },
		$html
	);
	return is_string( $out ) ? $out : $html;
}

add_filter( 'do_shortcode_tag', function ( $out, $tag ) {
	return $tag === 'aa_career_paths' ? aa_sf_lssp_inject( $out ) : $out;
}, 20, 2 );

endif;
