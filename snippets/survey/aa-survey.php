<?php
/**
 * AA — Survey   [aa_survey id="…"]   [aa_survey_results id="…"]
 *
 * WPCode: PHP snippet, "Run everywhere". Paste everything below the <?php line.
 *
 * A post-class survey page in the site's own design, with every answer stored
 * as a structured record and written to the person's HubSpot contact.
 *
 * HOW IT FITS TOGETHER
 *   - Surveys are defined in aa_sv_surveys(): questions, options, English and
 *     French copy. One shortcode per page: [aa_survey id="leading-safe-sc"].
 *   - Each recipient gets a personal link ?r=<token>. The token maps to their
 *     name and email in the option aa_sv_recipients_<survey>, so the page can
 *     greet them and the answer is attributed without asking for an email.
 *     Without a token the page still works: it asks for name and email.
 *   - ?q1=4 on the link pre-selects the first scale question, so the email can
 *     offer one-click answers that open the rest of the survey.
 *   - Answers POST to /wp-json/aa/v1/survey and are saved as private
 *     aa_survey_response posts (one per person per survey; a second submission
 *     from the same token updates the first). info@ gets an email per answer.
 *   - HubSpot: with a private-app token (constant AA_HUBSPOT_TOKEN in
 *     wp-config.php, or Settings -> AA Registration), each answer is written to
 *     the contact as properties (aa_sv_<survey>_<question>) and a note. Missing
 *     properties are created on first use. Answers that could not be synced are
 *     retried hourly, so a token added later still catches up.
 *   - Results: [aa_survey_results id="…"] on a private page shows a summary,
 *     every answer, and a CSV export. Admins only.
 *
 * PRIVACY. No email in any URL. Tokens are random, not derived from the email.
 * Honeypot + per-IP rate limit on the endpoint. Pages carrying the shortcode
 * are noindex and never page-cached.
 */

if ( ! defined( 'ABSPATH' ) ) { return; }

/* ============================================================================
   SURVEYS
   ========================================================================== */

function aa_sv_surveys() {
	$next = array(
		'sagov'  => array( 'Leading SAFe® for Government', 'Leading SAFe® for Government' ),
		'pisim'  => array( 'A hands-on PI Planning simulation for our own teams', 'Une simulation pratique de planification de PI avec nos propres équipes' ),
		'ssm'    => array( 'SAFe® Scrum Master', 'SAFe® Scrum Master' ),
		'popm'   => array( 'SAFe® Product Owner / Product Manager', 'SAFe® Product Owner / Product Manager' ),
		'lpm'    => array( 'Lean Portfolio Management', 'Gestion de portefeuille Lean' ),
		'rte'    => array( 'Release Train Engineer', 'Release Train Engineer' ),
		'ainf'   => array( 'AI-Native Foundations', 'AI-Native Foundations' ),
		'acg'    => array( 'Agile Contracting for Government', 'Agile Contracting for Government' ),
		'other'  => array( 'Something else (tell us below)', 'Autre chose (précisez ci-dessous)' ),
	);
	return apply_filters( 'aa_sv_surveys', array(
		'leading-safe-sc' => array(
			'title'   => array( 'Leading SAFe® · your feedback', 'Leading SAFe® · votre avis' ),
			'kicker'  => array( 'Service Canada · BDMISDB', 'Service Canada · BDMISDB' ),
			'intro'   => array(
				'Thank you for joining the Leading SAFe® class. Six short questions, about two minutes: is this something you can use, and what would help you most next?',
				'Merci d’avoir suivi la formation Leading SAFe®. Six courtes questions, environ deux minutes : est-ce applicable pour vous, et qu’est-ce qui vous aiderait le plus pour la suite?',
			),
			'book'    => 'https://meetings.hubspot.com/john2795',
			'notify'  => 'info@agile-agilist.com',
			'questions' => array(
				'session' => array( 'type' => 'radio', 'required' => true,
					'label' => array( 'Which session did you attend?', 'À quelle session avez-vous participé?' ),
					'options' => array( 'oct' => array( 'October 20–21', '20–21 octobre' ), 'nov' => array( 'November 3–4', '3–4 novembre' ), 'other' => array( 'Another date', 'Une autre date' ) ) ),
				'q1' => array( 'type' => 'scale', 'required' => true,
					'label' => array( 'How confident are you about using what you learned in your own work over the next three months?', 'À quel point vous sentez-vous en mesure d’appliquer ce que vous avez appris dans votre travail au cours des trois prochains mois?' ),
					'low' => array( 'Not at all', 'Pas du tout' ), 'high' => array( 'Very confident', 'Tout à fait' ) ),
				'q2' => array( 'type' => 'multi', 'required' => true,
					'label' => array( 'Which parts will you use first?', 'Quels éléments utiliserez-vous en premier?' ),
					'hint'  => array( 'Pick any.', 'Plusieurs choix possibles.' ),
					'options' => array(
						'lead'  => array( 'Lean-Agile leadership and mindset', 'Leadership et état d’esprit Lean-Agile' ),
						'pi'    => array( 'PI Planning', 'Planification de PI' ),
						'art'   => array( 'Agile Release Trains and team-of-teams delivery', 'Agile Release Trains et livraison en équipe d’équipes' ),
						'vs'    => array( 'Value streams and flow', 'Chaînes de valeur et flux' ),
						'lpm'   => array( 'Lean Portfolio Management', 'Gestion de portefeuille Lean' ),
						'other' => array( 'Something else', 'Autre chose' ),
					) ),
				'q3' => array( 'type' => 'text', 'required' => false,
					'label' => array( 'What is most likely to get in the way of applying it?', 'Qu’est-ce qui risque le plus de freiner la mise en pratique?' ),
					'hint'  => array( 'Governance or approvals, team structure, tooling, time, buy-in from others, or nothing in particular. One line is plenty.', 'Gouvernance ou approbations, structure des équipes, outils, temps, adhésion des autres, ou rien en particulier. Une ligne suffit.' ) ),
				'q4' => array( 'type' => 'multi', 'required' => false,
					'label' => array( 'What would you like next?', 'Que souhaiteriez-vous pour la suite?' ),
					'hint'  => array( 'Pick any that interest you.', 'Choisissez tout ce qui vous intéresse.' ),
					'options' => $next ),
				'q4other' => array( 'type' => 'text', 'required' => false, 'short' => true,
					'label' => array( 'Another topic, or anything else you want to tell us', 'Un autre sujet, ou tout ce que vous souhaitez nous dire' ) ),
				'q5' => array( 'type' => 'radio', 'required' => true,
					'label' => array( 'Would you like a free 30-minute consultation?', 'Souhaitez-vous une consultation gratuite de 30 minutes?' ),
					'hint'  => array( 'A one-to-one conversation about your team or program: where SAFe would help first, what to try in the next quarter, and which training, if any, makes sense for whom. No sales pitch.', 'Un échange individuel sur votre équipe ou votre programme : où SAFe aiderait en premier, quoi essayer au prochain trimestre, et quelle formation, s’il y a lieu, convient à qui. Sans argumentaire de vente.' ),
					'options' => array( 'yes' => array( 'Yes, please contact me', 'Oui, contactez-moi' ), 'later' => array( 'Maybe later', 'Peut-être plus tard' ), 'no' => array( 'No, thank you', 'Non, merci' ) ) ),
			),
			'thanks' => array(
				array( 'Thank you. Your answers are in.', 'Merci. Vos réponses sont enregistrées.' ),
				array( 'If you asked for a consultation, pick a time that suits you:', 'Si vous avez demandé une consultation, choisissez un moment qui vous convient :' ),
				array( 'Book a time', 'Réserver un moment' ),
			),
		),
	) );
}

function aa_sv_get( $id ) {
	$all = aa_sv_surveys();
	return isset( $all[ $id ] ) ? $all[ $id ] : null;
}
/** Responses are stored as private posts; 'any' would skip them, so always name the statuses. */
function aa_sv_statuses() {
	return array( 'private', 'publish', 'draft' );
}

/* ----------------------------------------------------------------------------
   Recipients: option aa_sv_recipients_<survey> = { token: {email, first, last} }
   ------------------------------------------------------------------------- */
function aa_sv_recipients( $survey ) {
	$r = get_option( 'aa_sv_recipients_' . $survey, array() );
	return is_array( $r ) ? $r : array();
}
function aa_sv_recipient( $survey, $token ) {
	if ( ! preg_match( '/^[A-Za-z0-9]{12,40}$/', (string) $token ) ) { return null; }
	$r = aa_sv_recipients( $survey );
	return isset( $r[ $token ] ) ? $r[ $token ] : null;
}
/** Add recipients (email => [first, last]) and return their tokens. For the admin-only generator below. */
function aa_sv_add_recipients( $survey, $people ) {
	$r = aa_sv_recipients( $survey );
	$by_email = array();
	foreach ( $r as $tok => $p ) { $by_email[ strtolower( $p['email'] ) ] = $tok; }
	$out = array();
	foreach ( $people as $email => $name ) {
		$email = strtolower( trim( $email ) );
		if ( ! is_email( $email ) ) { continue; }
		if ( isset( $by_email[ $email ] ) ) { $out[ $email ] = $by_email[ $email ]; continue; }
		do { $tok = wp_generate_password( 16, false, false ); } while ( isset( $r[ $tok ] ) );
		$r[ $tok ] = array( 'email' => $email, 'first' => (string) $name[0], 'last' => isset( $name[1] ) ? (string) $name[1] : '' );
		$out[ $email ] = $tok;
	}
	update_option( 'aa_sv_recipients_' . $survey, $r, false );
	return $out;
}

/* ============================================================================
   PAGE
   ========================================================================== */

function aa_sv_lang() {
	if ( isset( $_GET['lang'] ) && in_array( $_GET['lang'], array( 'en', 'fr' ), true ) ) { return $_GET['lang']; } // phpcs:ignore
	return 'en';
}

function aa_sv_page_has_survey() {
	static $has = null;
	if ( $has !== null ) { return $has; }
	$has = false;
	if ( is_singular() ) {
		$p = get_post();
		$has = $p && strpos( (string) $p->post_content, '[aa_survey' ) !== false;
	}
	return $has;
}

/* Never cache, never index, a page that greets someone by name. */
add_action( 'template_redirect', function () {
	if ( is_admin() || ! aa_sv_page_has_survey() ) { return; }
	foreach ( array( 'DONOTCACHEPAGE', 'DONOTCACHEOBJECT', 'DONOTCACHEDB' ) as $f ) { if ( ! defined( $f ) ) { define( $f, true ); } }
	nocache_headers();
	header( 'X-Cache-Enabled: False' );
}, 0 );
add_filter( 'wp_robots', function ( $r ) {
	if ( aa_sv_page_has_survey() ) { $r['noindex'] = true; $r['nofollow'] = true; }
	return $r;
} );

function aa_sv_render( $atts ) {
	$atts = shortcode_atts( array( 'id' => '' ), $atts, 'aa_survey' );
	$s = aa_sv_get( $atts['id'] );
	if ( ! $s ) { return ''; }
	$sid   = $atts['id'];
	$lang  = aa_sv_lang();
	$L     = $lang === 'fr' ? 1 : 0;
	$tok   = isset( $_GET['r'] ) ? sanitize_text_field( wp_unslash( $_GET['r'] ) ) : ''; // phpcs:ignore
	$who   = $tok ? aa_sv_recipient( $sid, $tok ) : null;
	$pre   = array();
	foreach ( $s['questions'] as $qid => $q ) {
		if ( $q['type'] === 'scale' && isset( $_GET[ $qid ] ) ) { $pre[ $qid ] = max( 1, min( 5, (int) $_GET[ $qid ] ) ); } // phpcs:ignore
	}
	$other = add_query_arg( array( 'lang' => $L ? 'en' : 'fr' ) );
	$t = function ( $pair ) use ( $L ) { return is_array( $pair ) ? $pair[ $L ] : (string) $pair; };
	$str = $L ? array(
		'lang_switch' => 'English', 'hello' => 'Bonjour %s,', 'required' => 'obligatoire', 'optional' => 'facultatif',
		'name' => 'Votre nom', 'email' => 'Votre courriel professionnel', 'send' => 'Envoyer mes réponses', 'sending' => 'Envoi…',
		'missing' => 'Il manque une réponse : %s', 'failed' => 'Nous n’avons pas pu enregistrer vos réponses. Réessayez, ou répondez simplement au courriel.',
		'privacy' => 'Vos réponses servent uniquement à préparer la suite de votre formation. Elles ne sont pas partagées.',
		'reply' => 'Vous préférez écrire? Répondez simplement au courriel que nous vous avons envoyé.',
	) : array(
		'lang_switch' => 'Français', 'hello' => 'Hi %s,', 'required' => 'required', 'optional' => 'optional',
		'name' => 'Your name', 'email' => 'Your work email', 'send' => 'Send my answers', 'sending' => 'Sending…',
		'missing' => 'One answer is missing: %s', 'failed' => 'We could not save your answers. Please try again, or simply reply to our email.',
		'privacy' => 'Your answers are used only to plan what comes next for your training. They are not shared.',
		'reply' => 'Prefer to write? Just reply to the email we sent you.',
	);

	$h  = aa_sv_assets();
	$h .= '<div class="aa-sv" lang="' . ( $L ? 'fr' : 'en' ) . '" data-aa-sv="' . esc_attr( $sid ) . '" data-token="' . esc_attr( $who ? $tok : '' ) . '" data-lang="' . ( $L ? 'fr' : 'en' ) . '" data-endpoint="' . esc_url( rest_url( 'aa/v1/survey' ) ) . '">';
	$h .= '<div class="aa-sv__top"><div><p class="aa-sv__kicker">' . esc_html( $t( $s['kicker'] ) ) . '</p><h1 class="aa-sv__h1">' . esc_html( $t( $s['title'] ) ) . '</h1></div>'
	    . '<a class="aa-sv__lang" href="' . esc_url( $other ) . '" hreflang="' . ( $L ? 'en' : 'fr' ) . '">' . esc_html( $str['lang_switch'] ) . '</a></div>';
	$h .= '<form class="aa-sv__form" novalidate>';
	if ( $who ) { $h .= '<p class="aa-sv__hello">' . esc_html( sprintf( $str['hello'], $who['first'] ) ) . '</p>'; }
	$h .= '<p class="aa-sv__intro">' . esc_html( $t( $s['intro'] ) ) . '</p>';
	if ( ! $who ) {
		$h .= '<div class="aa-sv__card"><div class="aa-sv__grid2">'
		    . '<label class="aa-sv__field"><span>' . esc_html( $str['name'] ) . '</span><input type="text" name="name" autocomplete="name" required></label>'
		    . '<label class="aa-sv__field"><span>' . esc_html( $str['email'] ) . '</span><input type="email" name="email" autocomplete="email" inputmode="email" required></label>'
		    . '</div></div>';
	}
	$n = 0;
	foreach ( $s['questions'] as $qid => $q ) {
		$type = $q['type'];
		if ( $type === 'text' && ! empty( $q['short'] ) ) {
			$h .= '<div class="aa-sv__card aa-sv__card--soft"><label class="aa-sv__field"><span>' . esc_html( $t( $q['label'] ) ) . '</span><input type="text" name="' . esc_attr( $qid ) . '" maxlength="300"></label></div>';
			continue;
		}
		$n++;
		$h .= '<fieldset class="aa-sv__card" data-q="' . esc_attr( $qid ) . '" data-type="' . esc_attr( $type ) . '" data-required="' . ( ! empty( $q['required'] ) ? '1' : '0' ) . '">'
		    . '<legend><span class="aa-sv__num">' . $n . '</span><span class="aa-sv__q">' . esc_html( $t( $q['label'] ) ) . '</span>'
		    . '<span class="aa-sv__req">' . esc_html( ! empty( $q['required'] ) ? $str['required'] : $str['optional'] ) . '</span></legend>';
		if ( ! empty( $q['hint'] ) ) { $h .= '<p class="aa-sv__hint">' . esc_html( $t( $q['hint'] ) ) . '</p>'; }
		if ( $type === 'scale' ) {
			$h .= '<div class="aa-sv__scale" role="radiogroup" aria-label="' . esc_attr( $t( $q['label'] ) ) . '">';
			for ( $i = 1; $i <= 5; $i++ ) {
				$h .= '<label class="aa-sv__pip"><input type="radio" name="' . esc_attr( $qid ) . '" value="' . $i . '"' . ( isset( $pre[ $qid ] ) && $pre[ $qid ] === $i ? ' checked' : '' ) . '><span>' . $i . '</span></label>';
			}
			$h .= '</div><div class="aa-sv__ends"><span>1 · ' . esc_html( $t( $q['low'] ) ) . '</span><span>5 · ' . esc_html( $t( $q['high'] ) ) . '</span></div>';
		} elseif ( $type === 'radio' || $type === 'multi' ) {
			$h .= '<div class="aa-sv__opts">';
			foreach ( $q['options'] as $val => $pair ) {
				$h .= '<label class="aa-sv__opt"><input type="' . ( $type === 'radio' ? 'radio' : 'checkbox' ) . '" name="' . esc_attr( $qid ) . ( $type === 'multi' ? '[]' : '' ) . '" value="' . esc_attr( $val ) . '"><span class="aa-sv__tick" aria-hidden="true"></span><span>' . esc_html( $t( $pair ) ) . '</span></label>';
			}
			$h .= '</div>';
			if ( $qid === 'q5' && ! empty( $s['book'] ) ) {
				$h .= '<p class="aa-sv__hint" style="margin-top:12px"><a class="aa-sv__link" href="' . esc_url( $s['book'] ) . '">' . esc_html( $L ? 'Ou réservez directement un moment dans notre calendrier ⟶' : 'Or pick a time in our calendar directly ⟶' ) . '</a></p>';
			}
		} else {
			$h .= '<textarea name="' . esc_attr( $qid ) . '" rows="3" maxlength="1000"></textarea>';
		}
		$h .= '</fieldset>';
	}
	$h .= '<input type="text" name="website" class="aa-sv__hp" tabindex="-1" autocomplete="off" aria-hidden="true">';
	$h .= '<div class="aa-sv__bar"><p class="aa-sv__alert" role="alert"></p><button type="submit" class="aa-sv__send" data-sending="' . esc_attr( $str['sending'] ) . '">' . esc_html( $str['send'] ) . ' <span aria-hidden="true">⟶</span></button></div>';
	$h .= '<p class="aa-sv__privacy">' . esc_html( $str['privacy'] ) . ' ' . esc_html( $str['reply'] ) . '</p>';
	$h .= '</form>';
	$h .= '<div class="aa-sv__done" hidden><p class="aa-sv__kicker">✓</p><h2>' . esc_html( $t( $s['thanks'][0] ) ) . '</h2>'
	    . ( ! empty( $s['book'] ) ? '<p>' . esc_html( $t( $s['thanks'][1] ) ) . '</p><p><a class="aa-sv__send aa-sv__send--link" href="' . esc_url( $s['book'] ) . '">' . esc_html( $t( $s['thanks'][2] ) ) . ' ⟶</a></p>' : '' )
	    . '</div>';
	$h .= '<script type="application/json" class="aa-sv-strings">' . wp_json_encode( array( 'missing' => $str['missing'], 'failed' => $str['failed'] ) ) . '</script>';
	$h .= '</div>';
	return $h;
}
add_shortcode( 'aa_survey', 'aa_sv_render' );

function aa_sv_assets() {
	static $done = false;
	if ( $done ) { return ''; }
	$done = true;
	ob_start(); ?>
<style id="aa-sv-css">
.aa-sv{--ink:#0E3A44;--teal:#127E88;--mint:#8FCFCF;--line:#DCEAEA;--soft:#F3FAFA;--mute:#5E7378;max-width:720px;margin:0 auto;padding:8px 0 48px;color:var(--ink);font-family:inherit;-webkit-font-smoothing:antialiased}
.aa-sv *{box-sizing:border-box}
.aa-sv__top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin:0 0 18px}
.aa-sv__kicker{margin:0 0 6px;font:600 11px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--teal)}
.aa-sv__h1{margin:0;font-family:'Newsreader',Georgia,serif;font-weight:400;font-size:clamp(30px,5vw,42px);line-height:1.08;letter-spacing:-.01em;color:var(--ink)}
.aa-sv__lang{flex:none;margin-top:6px;font-size:13px;font-weight:600;color:var(--teal);text-decoration:none;border:1px solid var(--line);border-radius:100px;padding:8px 14px;min-height:40px;display:inline-flex;align-items:center}
.aa-sv__hello{margin:0 0 6px;font-size:17px;font-weight:600}
.aa-sv__intro{margin:0 0 20px;font-size:16px;line-height:1.6;color:#3C565E}
.aa-sv__card{position:relative;margin:0 0 12px;padding:18px 18px 20px;border:1px solid var(--line);border-radius:14px;background:#fff;min-width:0}
.aa-sv__card--soft{background:var(--soft)}
.aa-sv__card legend{display:flex;align-items:flex-start;gap:12px;width:100%;padding:0;margin:0 0 8px;float:left}
.aa-sv__card legend+*{clear:both}
.aa-sv__num{flex:none;width:28px;height:28px;border-radius:50%;background:var(--ink);color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}
.aa-sv__q{flex:1;font-size:16.5px;font-weight:600;line-height:1.4}
.aa-sv__req{flex:none;font:600 10.5px/1.2 ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:#88A0A4;margin-top:6px}
.aa-sv__hint{margin:0 0 12px;clear:both;font-size:14px;line-height:1.55;color:var(--mute)}
.aa-sv__scale{display:flex;gap:8px;clear:both;margin-top:4px}
.aa-sv__pip{flex:1;position:relative;cursor:pointer}
.aa-sv__pip input{position:absolute;opacity:0;width:1px;height:1px;margin:0}
.aa-sv__pip span{display:flex;align-items:center;justify-content:center;min-height:52px;border:1.5px solid #BFD9D5;border-radius:12px;background:#fff;font-size:18px;font-weight:700;color:var(--ink);transition:background .15s,border-color .15s,color .15s,transform .1s}
.aa-sv__pip:hover span{border-color:var(--teal)}
.aa-sv__pip input:checked+span{background:var(--teal);border-color:var(--teal);color:#fff;transform:scale(1.03)}
.aa-sv__pip input:focus-visible+span{outline:2px solid var(--teal);outline-offset:2px}
.aa-sv__ends{display:flex;justify-content:space-between;margin-top:8px;font-size:12.5px;color:var(--mute)}
.aa-sv__opts{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:8px;clear:both}
.aa-sv__opt{position:relative;display:flex;align-items:center;gap:12px;min-height:48px;padding:10px 14px;border:1.5px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;font-size:15px;line-height:1.35;transition:border-color .15s,background .15s}
.aa-sv__opt:hover{border-color:var(--teal)}
.aa-sv__opt input{position:absolute;opacity:0;width:1px;height:1px;margin:0}
.aa-sv__tick{flex:none;width:22px;height:22px;border-radius:7px;border:1.5px solid #BFD9D5;background:#fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700}
.aa-sv__opt input[type=radio]+.aa-sv__tick{border-radius:50%}
.aa-sv__opt input:checked~.aa-sv__tick{background:var(--teal);border-color:var(--teal)}
.aa-sv__opt input:checked~.aa-sv__tick::before{content:"✓"}
.aa-sv__opt:has(input:checked){border-color:var(--teal);background:var(--soft)}
.aa-sv__opt input:focus-visible~.aa-sv__tick{outline:2px solid var(--teal);outline-offset:2px}
.aa-sv textarea,.aa-sv__field input{width:100%;padding:12px 14px;border:1.5px solid var(--line);border-radius:10px;font:inherit;font-size:16px;color:var(--ink);background:#fff;box-shadow:none;margin:0}
.aa-sv textarea:focus,.aa-sv__field input:focus{outline:none;border-color:var(--teal);box-shadow:0 0 0 4px rgba(18,126,136,.12)}
.aa-sv__field{display:flex;flex-direction:column;gap:6px;margin:0}
.aa-sv__field span{font-size:13px;font-weight:600;color:#3C565E}
.aa-sv__grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px}
.aa-sv__hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.aa-sv__bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-top:18px}
.aa-sv__alert{margin:0;flex:1 1 240px;font-size:14px;font-weight:600;color:#B3261E}
.aa-sv__alert:empty{display:none}
.aa-sv__send,.aa-sv__send:visited{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 26px;border:0;border-radius:100px;background:var(--teal);color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer;text-decoration:none;transition:background .2s,transform .15s}
.aa-sv__send:hover{background:var(--ink);color:#fff}.aa-sv__send:active{transform:scale(.98)}
.aa-sv__send[disabled]{opacity:.6;cursor:wait}
.aa-sv__link{color:var(--teal);font-weight:600;text-decoration:underline;text-underline-offset:3px}
.aa-sv__privacy{margin:16px 0 0;font-size:12.5px;line-height:1.55;color:#88A0A4}
.aa-sv__done{padding:28px 22px;border:1px solid var(--line);border-radius:16px;background:var(--soft);text-align:center}
.aa-sv__done h2{margin:0 0 10px;font-family:'Newsreader',Georgia,serif;font-weight:400;font-size:30px;color:var(--ink)}
.aa-sv__done p{margin:0 0 12px;font-size:15.5px;color:#3C565E}
.aa-sv__done .aa-sv__kicker{font-size:28px;color:var(--teal);letter-spacing:0}
.aa-sv .is-missing{border-color:#D9534F;box-shadow:0 0 0 4px rgba(217,83,79,.12)}
@media (max-width:560px){.aa-sv__card{padding:16px 14px 18px}.aa-sv__scale{gap:6px}.aa-sv__pip span{min-height:48px;font-size:17px}.aa-sv__top{flex-direction:column}.aa-sv__send{width:100%}}
@media (prefers-reduced-motion:reduce){.aa-sv *{transition:none!important}}
</style>
<script id="aa-sv-js">
(function(){
  function init(root){
    var form=root.querySelector('.aa-sv__form'),done=root.querySelector('.aa-sv__done'),alertEl=root.querySelector('.aa-sv__alert'),btn=root.querySelector('.aa-sv__send'),
        S=JSON.parse((root.querySelector('.aa-sv-strings')||{}).textContent||'{}');
    function collect(){
      var out={},missing=null;
      [].forEach.call(root.querySelectorAll('.aa-sv__card[data-q]'),function(fs){
        var q=fs.getAttribute('data-q'),type=fs.getAttribute('data-type'),req=fs.getAttribute('data-required')==='1',v;
        fs.classList.remove('is-missing');
        if(type==='multi'){v=[].map.call(fs.querySelectorAll('input:checked'),function(i){return i.value})}
        else if(type==='text'){v=(fs.querySelector('textarea')||{}).value||''}
        else{var c=fs.querySelector('input:checked');v=c?c.value:''}
        out[q]=v;
        if(req&&(!v||(Array.isArray(v)&&!v.length))&&!missing){missing=fs}
      });
      [].forEach.call(root.querySelectorAll('.aa-sv__card--soft input, .aa-sv__field input'),function(i){if(i.name)out[i.name]=i.value});
      return {answers:out,missing:missing};
    }
    form.addEventListener('submit',function(e){
      e.preventDefault();alertEl.textContent='';
      var c=collect();
      if(c.missing){c.missing.classList.add('is-missing');var label=c.missing.querySelector('.aa-sv__q').textContent;alertEl.textContent=S.missing.replace('%s',label);c.missing.scrollIntoView({behavior:'smooth',block:'center'});return}
      if(!root.getAttribute('data-token')&&(!c.answers.email||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.answers.email))){alertEl.textContent=S.missing.replace('%s',form.querySelector('input[name=email]').previousElementSibling.textContent);return}
      var label=btn.firstChild.textContent;btn.disabled=true;btn.firstChild.textContent=btn.getAttribute('data-sending')+' ';
      var payload={survey:root.getAttribute('data-aa-sv'),token:root.getAttribute('data-token'),lang:root.getAttribute('data-lang'),answers:c.answers,website:(form.querySelector('[name=website]')||{}).value||''};
      fetch(root.getAttribute('data-endpoint'),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(payload)})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j}})})
      .then(function(x){if(!x.ok)throw new Error(x.j&&x.j.message||'');form.hidden=true;done.hidden=false;done.scrollIntoView({behavior:'smooth',block:'start'})})
      .catch(function(){alertEl.textContent=S.failed;btn.disabled=false;btn.firstChild.textContent=label});
    });
    var pre=root.querySelector('.aa-sv__pip input:checked');if(pre){pre.closest('.aa-sv__card').scrollIntoView({block:'center'})}
  }
  function boot(){[].forEach.call(document.querySelectorAll('[data-aa-sv]'),init)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
</script>
<?php
	return ob_get_clean();
}

/* ============================================================================
   STORAGE + ENDPOINT
   ========================================================================== */

add_action( 'init', function () {
	register_post_type( 'aa_survey_response', array(
		'label' => 'Survey responses', 'public' => false, 'show_ui' => true, 'show_in_menu' => true,
		'menu_icon' => 'dashicons-feedback', 'supports' => array( 'title' ), 'capability_type' => 'post',
		'map_meta_cap' => true, 'show_in_rest' => false,
	) );
} );

add_action( 'rest_api_init', function () {
	register_rest_route( 'aa/v1', '/survey', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true',
		'callback'            => 'aa_sv_submit',
	) );
} );

function aa_sv_submit( WP_REST_Request $req ) {
	$d = (array) $req->get_json_params();
	if ( ! empty( $d['website'] ) ) { return new WP_Error( 'aa_sv_spam', 'Thank you.', array( 'status' => 200 ) ); }   // honeypot: say nothing useful
	$sid = isset( $d['survey'] ) ? sanitize_key( $d['survey'] ) : '';
	$s   = aa_sv_get( $sid );
	if ( ! $s ) { return new WP_Error( 'aa_sv_unknown', 'Unknown survey.', array( 'status' => 400 ) ); }

	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	$key = 'aa_sv_rl_' . md5( $sid . '|' . $ip );
	$n   = (int) get_transient( $key );
	if ( $n >= 10 ) { return new WP_Error( 'aa_sv_rate', 'Too many submissions. Please try again later.', array( 'status' => 429 ) ); }
	set_transient( $key, $n + 1, HOUR_IN_SECONDS );

	$tok = isset( $d['token'] ) ? sanitize_text_field( $d['token'] ) : '';
	$who = $tok ? aa_sv_recipient( $sid, $tok ) : null;
	$ans = isset( $d['answers'] ) && is_array( $d['answers'] ) ? $d['answers'] : array();
	$lang = isset( $d['lang'] ) && $d['lang'] === 'fr' ? 'fr' : 'en';

	if ( $who ) {
		$email = $who['email']; $name = trim( $who['first'] . ' ' . $who['last'] );
	} else {
		$email = isset( $ans['email'] ) ? sanitize_email( $ans['email'] ) : '';
		$name  = isset( $ans['name'] ) ? sanitize_text_field( $ans['name'] ) : '';
		if ( ! is_email( $email ) ) { return new WP_Error( 'aa_sv_email', 'Please enter a valid email address.', array( 'status' => 400 ) ); }
	}

	/* Validate against the definition: only known questions, only known options. */
	$clean = array();
	foreach ( $s['questions'] as $qid => $q ) {
		$v = isset( $ans[ $qid ] ) ? $ans[ $qid ] : '';
		switch ( $q['type'] ) {
			case 'scale':
				$v = (int) $v; $v = ( $v >= 1 && $v <= 5 ) ? $v : 0; break;
			case 'radio':
				$v = is_string( $v ) && isset( $q['options'][ $v ] ) ? $v : ''; break;
			case 'multi':
				$v = array_values( array_filter( array_unique( (array) $v ), function ( $x ) use ( $q ) { return is_string( $x ) && isset( $q['options'][ $x ] ); } ) ); break;
			default:
				$v = mb_substr( sanitize_textarea_field( (string) $v ), 0, 1000 );
		}
		if ( ! empty( $q['required'] ) && ( $v === '' || $v === 0 || $v === array() ) ) {
			return new WP_Error( 'aa_sv_missing', 'A required answer is missing.', array( 'status' => 400 ) );
		}
		$clean[ $qid ] = $v;
	}

	/* One record per person per survey: a second submission updates the first. */
	$existing = get_posts( array( 'post_type' => 'aa_survey_response', 'post_status' => aa_sv_statuses(), 'posts_per_page' => 1, 'fields' => 'ids', 'no_found_rows' => true,
		'meta_query' => array( 'relation' => 'AND', array( 'key' => 'survey', 'value' => $sid ), array( 'key' => 'email', 'value' => $email ) ) ) );
	$post_id = $existing ? (int) $existing[0] : 0;
	$args = array(
		'post_type'   => 'aa_survey_response',
		'post_status' => 'private',
		'post_title'  => $name . ' — ' . $sid,
		'meta_input'  => array(
			'survey' => $sid, 'email' => $email, 'name' => $name, 'lang' => $lang, 'token' => $who ? $tok : '',
			'answers' => $clean, 'submitted_at' => current_time( 'mysql' ), 'ip_hash' => $ip ? substr( md5( $ip . wp_salt() ), 0, 12 ) : '',
			'hs_synced' => 0,
		),
	);
	if ( $post_id ) { $args['ID'] = $post_id; $post_id = wp_update_post( $args ); } else { $post_id = wp_insert_post( $args ); }
	if ( ! $post_id || is_wp_error( $post_id ) ) { return new WP_Error( 'aa_sv_store', 'Could not save.', array( 'status' => 500 ) ); }

	aa_sv_notify( $s, $sid, $post_id, $name, $email, $clean, $lang );
	aa_sv_hubspot_sync( $post_id );
	return array( 'ok' => true );
}

function aa_sv_answer_text( $s, $qid, $v, $L = 0 ) {
	$q = $s['questions'][ $qid ];
	if ( $q['type'] === 'scale' ) { return $v ? $v . ' / 5' : ''; }
	if ( $q['type'] === 'radio' ) { return $v !== '' && isset( $q['options'][ $v ] ) ? $q['options'][ $v ][ $L ] : ''; }
	if ( $q['type'] === 'multi' ) { $o = array(); foreach ( (array) $v as $x ) { if ( isset( $q['options'][ $x ] ) ) { $o[] = $q['options'][ $x ][ $L ]; } } return implode( '; ', $o ); }
	return (string) $v;
}

function aa_sv_notify( $s, $sid, $post_id, $name, $email, $clean, $lang ) {
	$to = ! empty( $s['notify'] ) ? $s['notify'] : get_option( 'admin_email' );
	$lines = array();
	foreach ( $s['questions'] as $qid => $q ) {
		$txt = aa_sv_answer_text( $s, $qid, $clean[ $qid ] );
		if ( $txt === '' ) { continue; }
		$lines[] = $q['label'][0] . "\n  " . $txt;
	}
	$body = $name . ' <' . $email . '> answered "' . $s['title'][0] . '" (' . strtoupper( $lang ) . ").\n\n" . implode( "\n\n", $lines )
	      . "\n\nAll answers: " . admin_url( 'edit.php?post_type=aa_survey_response' ) . "\n";
	$consult = isset( $clean['q5'] ) && $clean['q5'] === 'yes';
	wp_mail( $to, ( $consult ? 'CONSULTATION REQUESTED — ' : 'Survey answer — ' ) . $name . ' (' . $sid . ')', $body );
}

/* ============================================================================
   HUBSPOT
   ========================================================================== */

function aa_sv_hs_token() {
	if ( defined( 'AA_HUBSPOT_TOKEN' ) && AA_HUBSPOT_TOKEN ) { return (string) AA_HUBSPOT_TOKEN; }
	return (string) get_option( 'aa_hubspot_token', '' );
}

function aa_sv_hs( $method, $path, $body = null ) {
	$tok = aa_sv_hs_token();
	if ( $tok === '' ) { return new WP_Error( 'aa_hs_token', 'no token' ); }
	$args = array( 'method' => $method, 'timeout' => 15, 'headers' => array( 'Authorization' => 'Bearer ' . $tok, 'Content-Type' => 'application/json' ) );
	if ( $body !== null ) { $args['body'] = wp_json_encode( $body ); }
	$res = wp_remote_request( 'https://api.hubapi.com' . $path, $args );
	if ( is_wp_error( $res ) ) { return $res; }
	$code = (int) wp_remote_retrieve_response_code( $res );
	$json = json_decode( wp_remote_retrieve_body( $res ), true );
	if ( $code >= 300 ) { return new WP_Error( 'aa_hs_' . $code, isset( $json['message'] ) ? $json['message'] : 'HubSpot error ' . $code, array( 'status' => $code, 'body' => $json ) ); }
	return is_array( $json ) ? $json : array();
}

/** Property name for a survey question; created in HubSpot on first use. */
function aa_sv_hs_prop( $sid, $qid ) {
	return 'aa_sv_' . str_replace( '-', '_', $sid ) . '_' . $qid;
}

function aa_sv_hs_ensure_props( $sid, $s ) {
	if ( get_transient( 'aa_sv_hs_props_' . $sid ) ) { return true; }
	$have = aa_sv_hs( 'GET', '/crm/v3/properties/contacts?archived=false' );
	if ( is_wp_error( $have ) ) { return false; }
	$names = array();
	foreach ( (array) ( isset( $have['results'] ) ? $have['results'] : array() ) as $p ) { $names[ $p['name'] ] = true; }
	$want = array();
	foreach ( $s['questions'] as $qid => $q ) {
		$want[ aa_sv_hs_prop( $sid, $qid ) ] = array(
			'label'     => $s['title'][0] . ' — ' . $q['label'][0],
			'type'      => 'string', 'fieldType' => $q['type'] === 'text' ? 'textarea' : 'text',
			'groupName' => 'contactinformation',
			'description' => 'Answer collected by the Agile Agilist survey "' . $sid . '" (' . $qid . ').',
		);
	}
	$want[ aa_sv_hs_prop( $sid, 'date' ) ] = array( 'label' => $s['title'][0] . ' — answered on', 'type' => 'string', 'fieldType' => 'text', 'groupName' => 'contactinformation' );
	$ok = true;
	foreach ( $want as $name => $def ) {
		if ( isset( $names[ $name ] ) ) { continue; }
		$def['name'] = $name;
		$r = aa_sv_hs( 'POST', '/crm/v3/properties/contacts', $def );
		if ( is_wp_error( $r ) && strpos( $r->get_error_message(), 'already exists' ) === false ) { $ok = false; }
	}
	if ( $ok ) { set_transient( 'aa_sv_hs_props_' . $sid, 1, DAY_IN_SECONDS ); }
	return $ok;
}

function aa_sv_hubspot_sync( $post_id ) {
	if ( aa_sv_hs_token() === '' ) { return false; }
	$sid = (string) get_post_meta( $post_id, 'survey', true );
	$s   = aa_sv_get( $sid );
	if ( ! $s ) { return false; }
	$email = (string) get_post_meta( $post_id, 'email', true );
	$name  = (string) get_post_meta( $post_id, 'name', true );
	$ans   = (array) get_post_meta( $post_id, 'answers', true );
	aa_sv_hs_ensure_props( $sid, $s );

	$props = array( aa_sv_hs_prop( $sid, 'date' ) => (string) get_post_meta( $post_id, 'submitted_at', true ) );
	foreach ( $s['questions'] as $qid => $q ) {
		$props[ aa_sv_hs_prop( $sid, $qid ) ] = aa_sv_answer_text( $s, $qid, isset( $ans[ $qid ] ) ? $ans[ $qid ] : '' );
	}
	/* Update by email; create the contact if HubSpot does not know them. */
	$r = aa_sv_hs( 'PATCH', '/crm/v3/objects/contacts/' . rawurlencode( $email ) . '?idProperty=email', array( 'properties' => $props ) );
	$contact_id = '';
	$status = is_wp_error( $r ) ? (array) $r->get_error_data() : array();
	if ( is_wp_error( $r ) && isset( $status['status'] ) && (int) $status['status'] === 404 ) {
		$parts = explode( ' ', $name, 2 );
		$r = aa_sv_hs( 'POST', '/crm/v3/objects/contacts', array( 'properties' => array_merge( $props, array( 'email' => $email, 'firstname' => $parts[0], 'lastname' => isset( $parts[1] ) ? $parts[1] : '' ) ) ) );
	}
	if ( is_wp_error( $r ) ) { update_post_meta( $post_id, 'hs_error', $r->get_error_message() ); return false; }
	$contact_id = isset( $r['id'] ) ? (string) $r['id'] : '';

	/* A note on the timeline, readable without opening properties. */
	if ( $contact_id ) {
		$lines = array();
		foreach ( $s['questions'] as $qid => $q ) {
			$txt = aa_sv_answer_text( $s, $qid, isset( $ans[ $qid ] ) ? $ans[ $qid ] : '' );
			if ( $txt !== '' ) { $lines[] = '<p><strong>' . esc_html( $q['label'][0] ) . '</strong><br>' . esc_html( $txt ) . '</p>'; }
		}
		aa_sv_hs( 'POST', '/crm/v3/objects/notes', array(
			'properties'   => array( 'hs_timestamp' => (string) ( time() * 1000 ), 'hs_note_body' => '<p><strong>Survey: ' . esc_html( $s['title'][0] ) . '</strong></p>' . implode( '', $lines ) ),
			'associations' => array( array( 'to' => array( 'id' => $contact_id ), 'types' => array( array( 'associationCategory' => 'HUBSPOT_DEFINED', 'associationTypeId' => 202 ) ) ) ),
		) );
	}
	update_post_meta( $post_id, 'hs_synced', 1 );
	update_post_meta( $post_id, 'hs_contact_id', $contact_id );
	delete_post_meta( $post_id, 'hs_error' );
	return true;
}

/* Retry anything unsynced once an hour, so a token added later catches up. */
add_action( 'aa_sv_sync_event', function () {
	if ( aa_sv_hs_token() === '' ) { return; }
	$ids = get_posts( array( 'post_type' => 'aa_survey_response', 'post_status' => aa_sv_statuses(), 'posts_per_page' => 50, 'fields' => 'ids', 'no_found_rows' => true,
		'meta_query' => array( array( 'key' => 'hs_synced', 'value' => '0' ) ) ) );
	foreach ( $ids as $id ) { aa_sv_hubspot_sync( (int) $id ); }
} );
add_action( 'init', function () {
	if ( ! wp_next_scheduled( 'aa_sv_sync_event' ) ) { wp_schedule_event( time() + 600, 'hourly', 'aa_sv_sync_event' ); }
} );

/* The token is saved by the AA Registration settings form (option group aa_reg). */
add_action( 'admin_init', function () {
	register_setting( 'aa_reg', 'aa_hubspot_token', array( 'sanitize_callback' => 'sanitize_text_field' ) );
} );
/* That page prints its own table, so the field is appended to it here. */
add_action( 'admin_footer', function () {
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen || $screen->id !== 'settings_page_aa-reg' ) { return; }
	?>
<script>(function(){var f=document.querySelector('form[action="options.php"]');if(!f)return;var tbl=f.querySelector('table.form-table');if(!tbl)return;
var row=document.createElement('tr');row.innerHTML='<th scope="row">HubSpot private app token</th><td><input type="password" name="aa_hubspot_token" value="<?php echo esc_js( get_option( 'aa_hubspot_token', '' ) ); ?>" class="regular-text" autocomplete="off"><p class="description">Settings → Integrations → Private apps in HubSpot. Scopes: crm.objects.contacts.read, crm.objects.contacts.write, crm.schemas.contacts.write, crm.objects.notes.write. Ignored if wp-config.php defines AA_HUBSPOT_TOKEN. Survey answers are written to each contact as properties and a note.</p></td>';
tbl.querySelector('tbody').appendChild(row)})();</script>
	<?php
} );

/* ============================================================================
   RESULTS   [aa_survey_results id="…"]  (admins only; CSV via ?aa_sv_csv=1)
   ========================================================================== */

function aa_sv_responses( $sid ) {
	return get_posts( array( 'post_type' => 'aa_survey_response', 'post_status' => aa_sv_statuses(), 'posts_per_page' => 500, 'orderby' => 'date', 'order' => 'DESC',
		'meta_query' => array( array( 'key' => 'survey', 'value' => $sid ) ) ) );
}

add_action( 'template_redirect', function () {
	if ( ! isset( $_GET['aa_sv_csv'] ) || ! current_user_can( 'manage_options' ) ) { return; }
	$sid = sanitize_key( $_GET['aa_sv_csv'] ); // phpcs:ignore
	$s   = aa_sv_get( $sid );
	if ( ! $s || ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'aa_sv_csv' ) ) { return; }
	nocache_headers();
	header( 'Content-Type: text/csv; charset=utf-8' );
	header( 'Content-Disposition: attachment; filename="' . $sid . '-responses.csv"' );
	$out = fopen( 'php://output', 'w' );
	fputs( $out, "\xEF\xBB\xBF" );
	$head = array( 'Submitted', 'Name', 'Email', 'Language' );
	foreach ( $s['questions'] as $qid => $q ) { $head[] = $q['label'][0]; }
	$head[] = 'HubSpot synced';
	fputcsv( $out, $head );
	foreach ( aa_sv_responses( $sid ) as $p ) {
		$ans = (array) get_post_meta( $p->ID, 'answers', true );
		$row = array( get_post_meta( $p->ID, 'submitted_at', true ), get_post_meta( $p->ID, 'name', true ), get_post_meta( $p->ID, 'email', true ), get_post_meta( $p->ID, 'lang', true ) );
		foreach ( $s['questions'] as $qid => $q ) { $row[] = aa_sv_answer_text( $s, $qid, isset( $ans[ $qid ] ) ? $ans[ $qid ] : '' ); }
		$row[] = get_post_meta( $p->ID, 'hs_synced', true ) ? 'yes' : 'no';
		fputcsv( $out, $row );
	}
	exit;
} );

add_shortcode( 'aa_survey_results', function ( $atts ) {
	if ( ! current_user_can( 'manage_options' ) ) { return '<p>Sign in as an administrator to see survey results.</p>'; }
	$atts = shortcode_atts( array( 'id' => '' ), $atts, 'aa_survey_results' );
	$sid  = sanitize_key( $atts['id'] );
	$s    = aa_sv_get( $sid );
	if ( ! $s ) { return ''; }
	$rows = aa_sv_responses( $sid );
	$recips = aa_sv_recipients( $sid );
	$h  = '<div class="aa-svr" style="font-family:inherit;color:#0E3A44">';
	$h .= '<p><strong>' . count( $rows ) . '</strong> response' . ( count( $rows ) === 1 ? '' : 's' ) . ( $recips ? ' of ' . count( $recips ) . ' invited' : '' )
	    . ' · <a href="' . esc_url( wp_nonce_url( add_query_arg( 'aa_sv_csv', $sid ), 'aa_sv_csv' ) ) . '">Download CSV</a>'
	    . ' · HubSpot token: ' . ( aa_sv_hs_token() !== '' ? 'set' : '<strong style="color:#B3261E">not set</strong> (answers are kept here and synced once it is)' ) . '</p>';
	/* Summary per question */
	$h .= '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin:14px 0 22px">';
	foreach ( $s['questions'] as $qid => $q ) {
		if ( $q['type'] === 'text' ) { continue; }
		$count = array(); $sum = 0; $nn = 0;
		foreach ( $rows as $p ) {
			$ans = (array) get_post_meta( $p->ID, 'answers', true ); $v = isset( $ans[ $qid ] ) ? $ans[ $qid ] : '';
			if ( $q['type'] === 'scale' ) { if ( $v ) { $sum += (int) $v; $nn++; $count[ $v ] = ( isset( $count[ $v ] ) ? $count[ $v ] : 0 ) + 1; } }
			else { foreach ( (array) $v as $x ) { if ( $x !== '' ) { $count[ $x ] = ( isset( $count[ $x ] ) ? $count[ $x ] : 0 ) + 1; } } }
		}
		$h .= '<div style="border:1px solid #DCEAEA;border-radius:10px;padding:12px 14px"><p style="margin:0 0 8px;font-weight:600;font-size:14px">' . esc_html( $q['label'][0] ) . '</p>';
		if ( $q['type'] === 'scale' ) {
			$h .= '<p style="margin:0 0 6px;font-size:22px;font-weight:700">' . ( $nn ? number_format( $sum / $nn, 1 ) : '–' ) . ' <span style="font-size:12px;color:#5E7378;font-weight:400">average / 5 · ' . $nn . ' answers</span></p>';
			for ( $i = 1; $i <= 5; $i++ ) { $c = isset( $count[ $i ] ) ? $count[ $i ] : 0; $h .= '<div style="display:flex;gap:8px;align-items:center;font-size:12.5px"><span style="width:14px">' . $i . '</span><span style="flex:1;height:8px;background:#EAF3F3;border-radius:4px;overflow:hidden"><span style="display:block;height:100%;width:' . ( $nn ? round( $c / $nn * 100 ) : 0 ) . '%;background:#127E88"></span></span><span style="width:24px;text-align:right">' . $c . '</span></div>'; }
		} else {
			arsort( $count );
			foreach ( $q['options'] as $val => $pair ) { $c = isset( $count[ $val ] ) ? $count[ $val ] : 0; $h .= '<div style="display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:3px 0;border-top:1px solid #F0F5F5"><span>' . esc_html( $pair[0] ) . '</span><strong>' . $c . '</strong></div>'; }
		}
		$h .= '</div>';
	}
	$h .= '</div>';
	/* Every answer */
	$h .= '<div style="overflow:auto"><table style="border-collapse:collapse;width:100%;font-size:13px"><thead><tr style="background:#F3FAFA"><th style="text-align:left;padding:8px">When</th><th style="text-align:left;padding:8px">Who</th>';
	foreach ( $s['questions'] as $qid => $q ) { $h .= '<th style="text-align:left;padding:8px">' . esc_html( mb_substr( $q['label'][0], 0, 40 ) ) . '…</th>'; }
	$h .= '<th style="padding:8px">HubSpot</th></tr></thead><tbody>';
	foreach ( $rows as $p ) {
		$ans = (array) get_post_meta( $p->ID, 'answers', true );
		$h .= '<tr style="border-top:1px solid #E6EFEF"><td style="padding:8px;white-space:nowrap">' . esc_html( get_post_meta( $p->ID, 'submitted_at', true ) ) . '</td><td style="padding:8px">' . esc_html( get_post_meta( $p->ID, 'name', true ) ) . '<br><span style="color:#5E7378">' . esc_html( get_post_meta( $p->ID, 'email', true ) ) . '</span></td>';
		foreach ( $s['questions'] as $qid => $q ) { $h .= '<td style="padding:8px;vertical-align:top">' . esc_html( aa_sv_answer_text( $s, $qid, isset( $ans[ $qid ] ) ? $ans[ $qid ] : '' ) ) . '</td>'; }
		$h .= '<td style="padding:8px;text-align:center">' . ( get_post_meta( $p->ID, 'hs_synced', true ) ? '✓' : ( get_post_meta( $p->ID, 'hs_error', true ) ? '<span title="' . esc_attr( get_post_meta( $p->ID, 'hs_error', true ) ) . '">!</span>' : '–' ) ) . '</td></tr>';
	}
	$h .= '</tbody></table></div>';
	/* Who has not answered */
	if ( $recips ) {
		$done = array(); foreach ( $rows as $p ) { $done[ strtolower( get_post_meta( $p->ID, 'email', true ) ) ] = 1; }
		$left = array(); foreach ( $recips as $tok => $r ) { if ( empty( $done[ strtolower( $r['email'] ) ] ) ) { $left[] = $r['first'] . ' ' . $r['last'] . ' (' . $r['email'] . ')'; } }
		$h .= '<p style="margin-top:16px;font-size:13px;color:#5E7378"><strong>' . count( $left ) . ' not yet answered:</strong> ' . esc_html( implode( ', ', $left ) ) . '</p>';
	}
	return $h . '</div>';
} );
