<?php
/**
 * AA — Course page fixes   [no shortcode; the_content filter on course pages]
 *
 * Part of the "AA — Site fixes" plugin. (Also valid as a WPCode PHP snippet,
 * "Run everywhere", pasted without the <?php line.)
 *
 * 1. BADGES, NOT LETTER MARKS. Older course pages draw the credential as a
 *    round <span class="badge"><b>CODE</b><i>CERT</i></span>. Wherever the
 *    real badge image is known for that code, the span is replaced by the
 *    image, at the same size, in the sticky bar and everywhere else on the
 *    page (credential box, final call to action, path cards). Codes without a
 *    badge image keep the mark, so nothing breaks while the image is missing.
 *
 * 2. TEAM QUOTE GOES TO A FORM. The "Request a team quote" strip pointed at
 *    #enroll (the public schedule) on older pages. It now opens the Book a
 *    Consult popup (Fluent Form 5, "Training Contact us"), with the message
 *    pre-filled with the course name, so the request arrives as a form entry
 *    and a notification. "Talk to an advisor" in the final block does the same.
 *
 * Edit aa_cb_badges() to add a badge image for a code.
 */

if ( ! defined( 'ABSPATH' ) ) { return; }
if ( ! function_exists( 'aa_cb_badges' ) ) :

/** Credential code (as printed in the mark) => badge image URL. */
function aa_cb_badges() {
	$u = 'https://agile-agilist.com/wp-content/uploads/';
	return apply_filters( 'aa_cb_badges', array(
		'SA'     => $u . '2026/05/SAFe-Badge_SA.png',
		'SSM'    => $u . '2025/11/SAFe-Badge_SSM-AI.png',
		'SASM'   => $u . '2026/05/SAFe-Badge_SASM.png',
		'ASM'    => $u . '2026/05/SAFe-Badge_SASM.png',
		'POPM'   => $u . '2025/11/SAFe-Badge_POPM-AI.png',
		'SP'     => $u . '2025/08/SP.png',
		'SDP'    => $u . '2025/08/SDP.png',
		'ARCH'   => $u . '2025/08/ARCH.png',
		'ASE'    => $u . '2025/08/ASE.png',
		'SPC'    => $u . '2026/05/SAFe-Badge_SPC.png',
		'ASPC'   => $u . '2025/11/New_ASPC.png',
		'RTE'    => $u . '2025/11/RTE-AI.png',
		'APM'    => $u . '2025/08/APM.png',
		'LPM'    => $u . '2025/08/LPM.png',
		'LSSP'   => $u . '2026/09/LSSP.png',
		'SHWP'   => $u . '2025/09/Cert-Mark-SHWP-1.svg',
		'AINF'   => $u . '2025/12/ai_foundation_badge_2026.png',
		'AINCA'  => $u . '2025/12/AI-Native-Change-Agent.png',
		'AINVA'  => $u . '2025/12/AI-Native-Change-Agent.png',
		'AINSF'  => $u . '2026/11/Fundamentals_AI-Native.png',
		'ARTL'   => $u . '2026/09/SAFe-Badge_ART-Leader.webp',
	) );
}

function aa_cb_badge_url( $code ) {
	$map  = aa_cb_badges();
	$code = strtoupper( trim( (string) $code ) );
	if ( isset( $map[ $code ] ) ) { return $map[ $code ]; }
	$code = preg_replace( '/-?(GOV|AI)$/', '', $code );          // SA-GOV wears the SA badge
	return isset( $map[ $code ] ) ? $map[ $code ] : '';
}

/** The course name the page's bar shows, for the pre-filled quote message. */
function aa_cb_course_name( $content ) {
	if ( preg_match( '~aa-coursebar.*?<span class="nr"[^>]*>(.*?)</span>~s', $content, $m ) ) { return trim( wp_strip_all_tags( $m[1] ) ); }
	return get_the_title();
}

add_filter( 'the_content', function ( $content ) {
	if ( is_admin() || strpos( $content, 'aa-coursebar' ) === false ) { return $content; }

	/* 1. Letter marks → badge images. Keeps the inline width/height the mark had. */
	$content = preg_replace_callback(
		'~<span class="badge[^"]*"([^>]*)>\s*<b[^>]*>\s*([A-Za-z0-9\-]{2,8})\s*</b>\s*<i[^>]*>[^<]*</i>\s*</span>~s',
		function ( $m ) {
			$url = aa_cb_badge_url( $m[2] );
			if ( $url === '' ) { return $m[0]; }
			$w = preg_match( '/width:\s*(\d+)px/', $m[1], $mw ) ? (int) $mw[1] : 52;
			$h = preg_match( '/height:\s*(\d+)px/', $m[1], $mh ) ? (int) $mh[1] : $w;
			return '<img class="aa-badge-img aa-badge-auto" src="' . esc_url( $url ) . '" alt="' . esc_attr( strtoupper( $m[2] ) . ' badge' ) . '" width="' . $w . '" height="' . $h . '" loading="lazy" decoding="async" style="width:' . $w . 'px;height:' . $h . 'px;object-fit:contain;flex:none">';
		},
		$content
	);

	/* 2. The team-quote strip and the advisor button open the consult form. */
	$name = aa_cb_course_name( $content );
	$content = preg_replace_callback(
		'~(<div class="aa-corp">.*?)<a href="#[^"]*"(?![^>]*aa-book)([^>]*)>~s',
		function ( $m ) use ( $name ) { return $m[1] . '<a href="#aa-book" class="aa-book aa-corp-quote" data-aa-course="' . esc_attr( $name ) . '"' . $m[2] . '>'; },
		$content, 1
	);
	$content = preg_replace( '~(<a href=")#enroll(" class="btn-wghost"[^>]*>\s*Talk to an advisor)~', '$1#aa-book$2', $content, 1 );
	return $content;
}, 20 );

/* Pre-fill the consult form's message when the popup was opened from a quote link. */
add_action( 'wp_footer', function () {
	if ( is_admin() || ! is_singular() ) { return; }
	$p = get_post();
	if ( ! $p || strpos( (string) $p->post_content, 'aa-coursebar' ) === false ) { return; }
	?>
<script id="aa-cb-quote">document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('.aa-corp-quote'):null;if(!a)return;var course=a.getAttribute('data-aa-course')||document.title;setTimeout(function(){var m=document.getElementById('aa-book-modal');if(!m)return;var t=m.querySelector('textarea');if(t&&!t.value){t.value='Team quote request: '+course+'\nTeam size: \nPreferred dates / timezone: \n';t.dispatchEvent(new Event('input',{bubbles:true}))}},80)},true);</script>
	<?php
}, 98 );

endif;
