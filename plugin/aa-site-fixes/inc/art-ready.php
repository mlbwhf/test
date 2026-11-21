<?php
/**
 * AA — Free AI-Native ART readiness check, linked in four places
 *
 * The quick check runs on this site ([aa_art_check], inc/art-check.php, page
 * /assessments/ai-native-art-readiness/). Once that page is published, the
 * check is linked from:
 *  1. Launching AI-Native ARTs course page: a box after the hero, "check your
 *     ART before class; bring the result".
 *  2. Assessments hub (/assessments/): a box in the suite, above the Career
 *     Selector box.
 *  3. Five-layer roadmap, layer 03 "Measure": a second instrument beside the
 *     AI Maturity & Readiness Assessment.
 *  4. AI Maturity & Readiness results, middle band (AI-Maturing): a card under
 *     "What your score means".
 * Until the page is published nothing prints, so no page shows a dead link.
 * (If only the Trainyard link is set, the placements point there instead.)
 *
 * The team version lives on Trainyard. Its address is the option
 * aa_art_ready_url (Tools → ART readiness); the check's results end with a
 * hand-off to it when it is set.
 *
 * Named "readiness check", not "AI-Native ART Launch Readiness Assessment":
 * that is the name of Scaled Agile's tool used inside the course, and the free
 * check must not read as the official one.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_art_url' ) ) :

/** The team version on Trainyard (Tools → ART readiness). */
function aa_sf_art_team_url() {
	$u = trim( (string) get_option( 'aa_art_ready_url', '' ) );
	return ( $u !== '' && preg_match( '~^https://~', $u ) ) ? $u : '';
}

/** Our own quick check, once its page is published. */
function aa_sf_art_own_url() {
	static $u = null;
	if ( $u !== null ) { return $u; }
	$u    = '';
	$slug = function_exists( 'aa_sf_ac_slug' ) ? aa_sf_ac_slug() : 'ai-native-art-readiness';
	$p    = function_exists( 'get_page_by_path' ) ? get_page_by_path( 'assessments/' . $slug ) : null;
	if ( $p && $p->post_status === 'publish' ) { $u = (string) get_permalink( $p ); }
	return $u;
}

/** Where every placement links: our own check if it is live, otherwise the Trainyard one, otherwise nowhere (and nothing prints). */
function aa_sf_art_url() {
	$own = aa_sf_art_own_url();
	return $own !== '' ? $own : aa_sf_art_team_url();
}

function aa_sf_art_ext() { return aa_sf_art_own_url() === '' ? ' target="_blank" rel="noopener"' : ''; }

function aa_sf_art_note() {
	if ( aa_sf_art_own_url() !== '' ) { return 'Free, about three minutes, no login.'; }
	$n = trim( (string) get_option( 'aa_art_ready_note', '' ) );
	return $n !== '' ? $n : 'Free, on Trainyard.';
}

function aa_sf_art_css() {
	static $done = false;
	if ( $done ) { return ''; }
	$done = true;
	return '<style id="aa-art-css">'
	     . '.aa-art{display:grid;grid-template-columns:1fr auto;gap:14px 28px;align-items:center;max-width:1180px;margin:28px auto;padding:22px 26px;border:1.5px dashed #0E8074;background:rgba(242,182,109,.10);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#0B2E35}'
	     . '.aa-art__k{margin:0 0 6px;font:700 11px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:#0E8074}'
	     . '.aa-art h3{margin:0;font-family:"Newsreader",Georgia,serif;font-weight:400;font-size:24px;line-height:1.2;color:#0B2E35}'
	     . '.aa-art p{margin:6px 0 0;font-size:15px;line-height:1.55;color:#3C565E}'
	     . '.aa-art__go{display:inline-block;padding:13px 20px;border-radius:2px;background:#0B2E35;color:#fff!important;font-weight:600;font-size:15px;text-decoration:none;white-space:nowrap}'
	     . '.aa-art__go:hover{background:#0E8074}'
	     . '.aa-art--dark{background:rgba(255,255,255,.03);border-color:rgba(143,207,207,.5);color:#E4F1F1;margin:44px 0 0;max-width:none}'
	     . '.aa-art--dark h3{color:#fff}.aa-art--dark p{color:#A7C2C2}.aa-art--dark .aa-art__k{color:#8FCFCF}'
	     . '.aa-art--dark .aa-art__go{background:#8FCFCF;color:#0B2E35!important}'
	     . '@media(max-width:700px){.aa-art{grid-template-columns:1fr;margin:20px 16px;padding:18px}.aa-art--dark{margin:32px 0 0}.aa-art__go{display:block;text-align:center;white-space:normal}}'
	     . '</style>';
}

function aa_sf_art_box( $kind ) {
	$u = aa_sf_art_url();
	if ( $u === '' ) { return ''; }
	$copy = array(
		'course' => array( 'Before you register', 'Is your ART ready to launch?',
			'Take the free AI-Native ART readiness check, built on the 12 critical success factors this course works through. Bring your result to class: it is the baseline your launch plan starts from.' ),
		'hub'    => array( 'New · Free', 'AI-Native ART readiness check',
			'Twelve success factors for launching or relaunching an Agile Release Train as an AI-Native execution engine. Each gap comes back with the course that closes it.' ),
	);
	$c = isset( $copy[ $kind ] ) ? $copy[ $kind ] : $copy['course'];
	return aa_sf_art_css()
	     . '<aside class="aa-art' . ( $kind === 'hub' ? ' aa-art--dark' : '' ) . '" aria-label="' . esc_attr( $c[1] ) . '">'
	     . '<div><p class="aa-art__k">' . esc_html( $c[0] ) . '</p><h3>' . esc_html( $c[1] ) . '</h3><p>' . esc_html( $c[2] ) . ' ' . esc_html( aa_sf_art_note() ) . '</p></div>'
	     . '<a class="aa-art__go" href="' . esc_url( $u ) . '"' . aa_sf_art_ext() . ' data-aa-ev="art_ready_' . esc_attr( $kind ) . '">Take the free check &#10230;</a>'
	     . '</aside>';
}

add_filter( 'the_content', function ( $html ) {
	if ( is_admin() || ! is_string( $html ) || aa_sf_art_url() === '' || strpos( $html, 'aa-art__go' ) !== false || strpos( $html, 'id="aa-ac"' ) !== false ) { return $html; }

	/* 1. Course page: after the hero, before the credential band. */
	if ( strpos( $html, 'data-title="Launching AI-Native ARTs"' ) !== false ) {
		$html = preg_replace( '~(<div class="aa-cred"><div class="aa-cred-in">)~', aa_sf_art_box( 'course' ) . '$1', $html, 1 );
	}
	/* 2. Assessments hub: inside the suite, above the Career Selector box. */
	if ( strpos( $html, '<!-- Career Selector flagship -->' ) !== false ) {
		$html = str_replace( '<!-- Career Selector flagship -->', aa_sf_art_box( 'hub' ) . '<!-- Career Selector flagship -->', $html );
	}
	/* 3. Roadmap, layer 03 Measure cell. */
	$m = 'Eight dimensions. AI-Aspiring &rarr; Maturing &rarr; Integrated.</small>';
	if ( strpos( $html, 'id="layer-03"' ) !== false && strpos( $html, $m ) !== false ) {
		$html = str_replace( $m, $m . '<p style="margin-top:10px"><a href="' . esc_url( aa_sf_art_url() ) . '"' . aa_sf_art_ext() . '>Free AI-Native ART readiness check &rarr;</a></p><small>Twelve success factors for launching an AI-Native train.</small>', $html );
	}
	return $html;
}, 25 );

/* 4. AI Maturity & Readiness results, AI-Maturing band: one card under "What your score means". */
add_action( 'wp_footer', function () {
	if ( is_admin() || ! is_singular() || aa_sf_art_url() === '' ) { return; }
	$p = get_post();
	if ( ! $p || strpos( (string) $p->post_content, 'aa-app' ) === false || strpos( (string) $p->post_content, "'ai-assessment'" ) === false ) { return; }
	$d = array( 'url' => aa_sf_art_url(), 'ext' => aa_sf_art_own_url() === '', 'band' => apply_filters( 'aa_sf_art_ai_bands', array( 'maturing' ) ), 'note' => aa_sf_art_note() );
	?>
<script id="aa-art-ai">(function(){var D=<?php echo wp_json_encode( $d ); ?>;
function h(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function add(){var box=document.getElementById('aa-content');if(!box)return;var inner=box.querySelector('.aa-results-inner');if(!inner||inner.querySelector('.aa-art-ai'))return;var grid=inner.querySelector('.aa-grid-2');if(!grid)return;
var r;try{r=JSON.parse(sessionStorage.getItem('aa_result')||'null')}catch(e){r=null}if(!r||r.assessmentId!=='ai-assessment'||!r.band||D.band.indexOf(r.band.id)<0)return;
var after=inner.querySelector('.aa-at')||(grid.nextElementSibling&&grid.nextElementSibling.classList.contains('aa-panel')?grid.nextElementSibling:grid);
after.insertAdjacentHTML('afterend','<div class="aa-panel aa-art-ai" style="margin-bottom:22px;border:1.5px dashed #0E8074;background:rgba(242,182,109,.10)"><p style="margin:0 0 6px;font:700 11px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:#0E8074">Next step for AI-Maturing organizations</p><h3 style="margin:0 0 6px">Ready to launch an AI-Native train?</h3><p style="margin:0 0 14px;font-size:15px;line-height:1.6">Your score says the foundations are in place. The free AI-Native ART readiness check scores the twelve success factors for launching one train, and names the course for each gap. '+h(D.note)+'</p><a href="'+h(D.url)+'"'+(D.ext?' target="_blank" rel="noopener"':'')+' data-aa-ev="art_ready_ai" style="display:inline-block;padding:12px 18px;background:#0B2E35;color:#fff;font-weight:600;border-radius:2px;text-decoration:none">Take the free check &#10230;</a></div>');}
function w(){var b=document.getElementById('aa-content');if(!b)return;add();new MutationObserver(add).observe(b,{childList:true})}
document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[data-aa-ev^="art_ready"]'):null;if(!a)return;try{(window.dataLayer=window.dataLayer||[]).push({event:'art_ready_click',aa_place:a.getAttribute('data-aa-ev')})}catch(x){}},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',w);else w();})();</script>
	<?php
}, 99 );

/* Tools → ART readiness: set the address without touching code. */
add_action( 'admin_menu', function () {
	add_management_page( 'ART readiness check', 'ART readiness', 'manage_options', 'aa-art-ready', function () {
		if ( isset( $_POST['aa_art_ready_url'] ) && check_admin_referer( 'aa_art_ready' ) ) {
			$u = esc_url_raw( wp_unslash( $_POST['aa_art_ready_url'] ) );
			update_option( 'aa_art_ready_url', preg_match( '~^https://~', $u ) ? $u : '' );
			update_option( 'aa_art_ready_note', sanitize_text_field( wp_unslash( isset( $_POST['aa_art_ready_note'] ) ? $_POST['aa_art_ready_note'] : '' ) ) );
			do_action( 'litespeed_purge_all' );
			echo '<div class="notice notice-success"><p>Saved. Cache purged.</p></div>';
		}
		echo '<div class="wrap"><h1>Free AI-Native ART readiness check</h1><form method="post">';
		wp_nonce_field( 'aa_art_ready' );
		echo '<p><label>Trainyard link for the team version (https://…)<br><input type="url" name="aa_art_ready_url" class="regular-text" value="' . esc_attr( get_option( 'aa_art_ready_url', '' ) ) . '"></label></p>';
		echo '<p><label>Short note shown after the text<br><input type="text" name="aa_art_ready_note" class="regular-text" value="' . esc_attr( get_option( 'aa_art_ready_note', '' ) ) . '" placeholder="Free, on Trainyard."></label></p>';
		echo '<p>The quick check runs on this site at /assessments/ai-native-art-readiness/. This link is the team version: it appears at the end of the results. Leave it empty to hide that block.</p>';
		submit_button();
		echo '</form></div>';
	} );
} );

endif;
