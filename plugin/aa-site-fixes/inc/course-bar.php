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
 *    #enroll (the public schedule) on older pages. It now goes to the team
 *    training page (/team-training/, form in inc/team-quote.php) with
 *    ?course=<this page's slug>, so the form opens with the class chosen.
 *    "Talk to an advisor" in the final block opens the Book a Consult popup.
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

	/* 2. The team-quote strip goes to the team training page; the advisor button opens the consult form. */
	$slug = (string) get_post_field( 'post_name', get_the_ID() );
	$to   = add_query_arg( 'course', rawurlencode( $slug ), apply_filters( 'aa_cb_team_url', home_url( '/team-training/' ) ) ) . '#quote';
	$content = preg_replace_callback(
		'~(<div class="aa-corp">.*?)<a href="[^"]*"([^>]*)>~s',
		function ( $m ) use ( $to ) {
			$attrs = preg_replace( '~\sclass="[^"]*"|\sdata-aa-course="[^"]*"~', '', $m[2] );
			return $m[1] . '<a href="' . esc_url( $to ) . '" class="aa-corp-quote"' . $attrs . '>';
		},
		$content, 1
	);
	$content = preg_replace( '~(<a href=")#enroll(" class="btn-wghost"[^>]*>\s*Talk to an advisor)~', '$1#aa-book$2', $content, 1 );
	return $content;
}, 20 );

/* Pre-fill the consult form's message with the course when "Talk to an advisor" opens it. */
add_action( 'wp_footer', function () {
	if ( is_admin() || ! is_singular() ) { return; }
	$p = get_post();
	if ( ! $p || strpos( (string) $p->post_content, 'aa-coursebar' ) === false ) { return; }
	?>
<script id="aa-cb-quote">document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a.btn-wghost[href="#aa-book"]'):null;if(!a)return;var n=document.querySelector('.aa-coursebar .nr'),course=n?n.textContent.trim():document.title;setTimeout(function(){var m=document.getElementById('aa-book-modal');if(!m)return;var t=m.querySelector('textarea');if(t&&!t.value){t.value='Question about: '+course+'\n';t.dispatchEvent(new Event('input',{bubbles:true}))}},80)},true);</script>
	<?php
}, 98 );

endif;
