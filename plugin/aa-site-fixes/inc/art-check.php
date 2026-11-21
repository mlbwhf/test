<?php
/**
 * AA — AI-Native ART readiness check   [aa_art_check]
 *
 * A free twelve-statement self-check on our own site, one statement for each
 * of the twelve critical success factors the Launching AI-Native ARTs course
 * works through. About three minutes. The result names the gaps and, for each
 * gap, the course that closes it, with the next real date and the price the
 * checkout charges (sale price shown while a sale runs).
 *
 * WHY ITS OWN SMALL SCRIPT, NOT THE ASSESSMENT ENGINE. The engine is 86 KB,
 * built for free-text answers and a trial gate. This is twelve taps. The whole
 * check here is one inline script of a few KB with no library, so it is quick
 * on a phone, and the statements, the gap-to-course table and the FAQ are in
 * the HTML itself, where search engines and AI assistants can read them
 * without running anything.
 *
 * THE STATEMENTS ARE OURS. They are written by Agile Agilist. This is not
 * Scaled Agile's AI-Native ART Launch Readiness Assessment, which is used in
 * the course itself, and the page says so.
 *
 * FLOW. All twelve statements are in the page as radio groups. The script
 * turns them into one-at-a-time steps with a progress bar; picking an answer
 * moves on. The score and band show at once. The factor-by-factor plan opens
 * after an email (skipped if this browser already gave one to another
 * assessment), which goes to the same HubSpot form the other assessments use.
 * The last block hands a whole train over to the team version on Trainyard
 * when aa_art_ready_url is set (Tools → ART readiness).
 *
 * Edit aa_sf_ac_factors() for wording, aa_sf_ac_matrix() for the courses.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_ac_factors' ) ) :

function aa_sf_ac_slug() { return apply_filters( 'aa_sf_ac_slug', 'ai-native-art-readiness' ); }

/** id => [ factor name, statement, what good looks like ]. */
function aa_sf_ac_factors() {
	return apply_filters( 'aa_sf_ac_factors', array(
		'sf1'  => array( 'Outcome-Driven Product Development', 'Our teams are measured on customer and business outcomes, not on features shipped.', 'Each team can name the outcome its current work is meant to move.' ),
		'sf2'  => array( 'Portfolio and Investment Strategy', 'AI work is funded through the portfolio, with guardrails, not through one-off project requests.', 'There is a budget for AI work and a rule for who decides.' ),
		'sf3'  => array( 'Curated Data', 'The data our AI needs is known, owned, of trusted quality and cleared for AI use.', 'You could tell a regulator which data trained or feeds each AI use.' ),
		'sf4'  => array( 'AI-Native ART', 'At least one train is organized around a value stream, with AI built into how it plans and delivers.', 'The train exists today, with a real backlog and a cadence.' ),
		'sf5'  => array( 'AI-Native Teams', 'Team members use AI tools in their daily work and share a common language for it.', 'Not two enthusiasts: most of the team, most days.' ),
		'sf6'  => array( 'AI Value Architect', 'A named person leads AI adoption beyond individual copilots: into processes, roles and governance.', 'You can say who, and they have time for it.' ),
		'sf7'  => array( 'Product Vision and Roadmap', 'Our product vision and roadmap say where AI changes the product, and teams can explain it.', 'Ask three people on the train; the answers match.' ),
		'sf8'  => array( 'PI Outcome Planning', 'Our PI Planning sets outcomes we can measure, not only a list of features to deliver.', 'Last PI, you checked the outcomes, not just the delivery.' ),
		'sf9'  => array( 'Sense and Respond Event', 'We have a regular event where we read new signals and change the plan because of them.', 'The plan changed at least once last quarter because of it.' ),
		'sf10' => array( 'Intent, Specifications and Context', 'Work handed to AI comes with clear intent, specifications and context that both people and AI can act on.', 'Written down, kept with the work, and reused.' ),
		'sf11' => array( 'AI Innovation Pipeline', 'AI ideas move through a visible pipeline: hypothesis, experiment, decision, then into delivery.', 'You can see what is being tested this month and what was stopped.' ),
		'sf12' => array( 'AI Governance and Ethics', 'We have agreed rules for responsible AI use, and the teams know them.', 'A new team member is shown them in the first week.' ),
	) );
}

/** id => [ main course slugs, also-suggested slugs, extra (label, path) ]. */
function aa_sf_ac_matrix() {
	return apply_filters( 'aa_sf_ac_matrix', array(
		'sf1'  => array( array( 'popm' ), array( 'apm', 'innovation-creator' ), null ),
		'sf2'  => array( array( 'lpm' ), array( 'bo', 'ai-native-ready-certification-2', 'innovation-leader' ), null ),
		'sf3'  => array( array( 'responsible-ai-safe' ), array( 'ai-native-foundations' ), array( 'Free AI Maturity & Readiness Assessment (Data Readiness score)', '/assessments/ai-assessment/' ) ),
		'sf4'  => array( array( 'launching-ai-native-arts', 'ai-native-ready-certification-2' ), array(), null ),
		'sf5'  => array( array( 'ai-native-ready-certification' ), array( 'ai-native-foundations', 'asm' ), null ),
		'sf6'  => array( array( 'ai-native-change-agent' ), array( 'ai-native-foundations' ), null ),
		'sf7'  => array( array( 'apm' ), array( 'popm' ), null ),
		'sf8'  => array( array( 'launching-ai-native-arts' ), array( 'rte' ), null ),
		'sf9'  => array( array( 'rte' ), array( 'asm' ), array( 'Free Mutation Readiness assessment', '/assessments/mutation-readiness/' ) ),
		'sf10' => array( array( 'arch' ), array( 'ai-native-change-agent' ), null ),
		'sf11' => array( array( 'devops' ), array( 'ai-native-ready-certification', 'arch', 'innovation-facilitator' ), null ),
		'sf12' => array( array( 'responsible-ai-safe' ), array( 'ai-native-ready-certification-2' ), null ),
	) );
}

/** Name and page for every course in the matrix; date and price are added from the register when it knows the course. */
function aa_sf_ac_names() {
	$i = '/training/innovation-framework/';
	return array(
		'popm'                            => array( 'SAFe POPM', '/training/safe/popm/' ),
		'apm'                             => array( 'Agile Product Management', '/training/adv-safe/apm/' ),
		'lpm'                             => array( 'SAFe Lean Portfolio Management', '/training/adv-safe/lpm/' ),
		'bo'                              => array( 'SAFe Business Owner', '/training/safe/bo/' ),
		'rte'                             => array( 'SAFe Release Train Engineer', '/training/adv-safe/rte/' ),
		'asm'                             => array( 'Advanced Scrum Master', '/training/safe/asm/' ),
		'arch'                            => array( 'SAFe for Architects', '/training/safe/arch/' ),
		'devops'                          => array( 'SAFe DevOps', '/training/safe/devops/' ),
		'responsible-ai-safe'             => array( 'Achieving Responsible AI with SAFe', '/training/safe-found/responsible-ai-safe/' ),
		'ai-native-foundations'           => array( 'AI-Native Foundations', '/training/ai-native/ai-native-foundations/' ),
		'ai-native-ready-certification'   => array( 'AI-Native SAFe Fundamentals', '/training/ai-native/ai-native-ready-certification/' ),
		'ai-native-ready-certification-2' => array( 'Leading the AI-Native Organization', '/training/ai-native/ai-native-ready-certification-2/' ),
		'ai-native-change-agent'          => array( 'AI-Native Value Architect', '/training/ai-native/ai-native-change-agent/' ),
		'launching-ai-native-arts'        => array( 'Launching AI-Native ARTs', '/training/ai-native/launching-ai-native-arts/' ),
		'innovation-creator'              => array( 'Innovation Creator', $i . 'innovation-creator/', 'soon' ),
		'innovation-facilitator'          => array( 'Innovation Facilitator', $i . 'innovation-facilitator/', 'soon' ),
		'innovation-leader'               => array( 'Innovation Leader', $i . 'innovation-leader/', 'soon' ),
	);
}

function aa_sf_ac_courses() {
	$out = array();
	foreach ( aa_sf_ac_names() as $slug => $n ) {
		$c = array( 'name' => $n[0], 'url' => home_url( $n[1] ), 'when' => '', 'iso' => '', 'price' => '', 'was' => '', 'soon' => ! empty( $n[2] ) );
		if ( empty( $n[2] ) && function_exists( 'aa_sf_at_course' ) ) {
			$live = aa_sf_at_course( $slug, 'en' );
			if ( is_array( $live ) ) {
				foreach ( array( 'when', 'iso', 'price', 'was' ) as $k ) { $c[ $k ] = (string) $live[ $k ]; }
			}
		}
		$out[ $slug ] = $c;
	}
	return $out;
}

function aa_sf_ac_faq() {
	return array(
		array( 'What is the AI-Native ART readiness check?', 'A free twelve-statement self-check from Agile Agilist. It scores one Agile Release Train against the twelve critical success factors of AI-Native SAFe and names, for each gap, the course that closes it. It takes about three minutes.' ),
		array( 'Is this the official Scaled Agile assessment?', 'No. The statements are written by Agile Agilist. The official AI-Native ART Launch Readiness Assessment from Scaled Agile is used live in the Launching AI-Native ARTs course, against your own organization.' ),
		array( 'How is it scored?', 'Each statement is rated from 1 (not at all) to 5 (fully). The total is out of 60: 12 to 28 is Not yet ready, 29 to 44 is Getting ready, 45 to 60 is Ready to launch. Any factor rated 3 or lower is listed as a gap.' ),
		array( 'Can my whole train take it?', 'Yes. One person can take the quick check here. For a whole train, the team version runs on Trainyard, where everyone answers and the scores are combined.' ),
		array( 'What happens to my answers?', 'Your answers stay in your browser. If you ask for the full plan, your email is sent to Agile Agilist so we can follow up; your individual answers are not.' ),
	);
}

function aa_sf_ac_course_label( $slug, $courses ) {
	if ( empty( $courses[ $slug ] ) ) { return ''; }
	$c = $courses[ $slug ];
	return '<a href="' . esc_url( $c['url'] ) . '">' . esc_html( $c['name'] ) . '</a>' . ( $c['soon'] ? ' <span class="aa-ac__soon">Launching soon</span>' : '' );
}

function aa_sf_ac_shortcode() {
	$f       = aa_sf_ac_factors();
	$mx      = aa_sf_ac_matrix();
	$courses = aa_sf_ac_courses();
	$faq     = aa_sf_ac_faq();
	$url     = home_url( '/assessments/' . aa_sf_ac_slug() . '/' );
	$team    = function_exists( 'aa_sf_art_team_url' ) ? aa_sf_art_team_url() : '';
	$sale    = function_exists( 'aa_sf_at_sale' ) ? aa_sf_at_sale( 'en' ) : '';
	$scale   = array( 1 => 'Not at all', 2 => 'Rarely', 3 => 'Partly', 4 => 'Mostly', 5 => 'Fully' );

	$ld = array( '@context' => 'https://schema.org', '@graph' => array(
		array( '@type' => array( 'WebPage', 'Quiz' ), '@id' => $url . '#check', 'url' => $url, 'name' => 'AI-Native ART Readiness Check',
			'description' => 'Free twelve-statement self-check: is your Agile Release Train ready to launch as an AI-Native train? Scores the twelve critical success factors and names the course for each gap.',
			'isAccessibleForFree' => true, 'timeRequired' => 'PT3M', 'inLanguage' => 'en',
			'provider' => array( '@type' => 'Organization', '@id' => 'https://agile-agilist.com/#organization', 'name' => 'Agile Agilist', 'url' => home_url( '/' ) ),
			'about' => array_values( array_map( function ( $x ) { return array( '@type' => 'DefinedTerm', 'name' => $x[0] ); }, $f ) ) ),
		array( '@type' => 'FAQPage', 'mainEntity' => array_map( function ( $q ) {
			return array( '@type' => 'Question', 'name' => $q[0], 'acceptedAnswer' => array( '@type' => 'Answer', 'text' => $q[1] ) );
		}, $faq ) ),
		array( '@type' => 'BreadcrumbList', 'itemListElement' => array(
			array( '@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => home_url( '/' ) ),
			array( '@type' => 'ListItem', 'position' => 2, 'name' => 'Assessments', 'item' => home_url( '/assessments/' ) ),
			array( '@type' => 'ListItem', 'position' => 3, 'name' => 'AI-Native ART Readiness Check', 'item' => $url ),
		) ),
	) );

	ob_start();
	?>
<script type="application/ld+json"><?php echo wp_json_encode( $ld ); ?></script>
<div class="aa-ac" id="aa-ac">
<style>
.aa-ac{--ink:#0B2E35;--teal:#0E8074;--mint:#8FCFCF;--mist:#B9DCDC;--warm:#F2B66D;--line:#DCEAEA;--mute:#5E7378;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:#FBFDFD;line-height:1.55;max-width:1080px;margin:0 auto;padding:0 20px 60px;overflow-x:clip}
.aa-ac *{box-sizing:border-box}
.aa-ac h1,.aa-ac h2,.aa-ac h3{font-family:'Newsreader',Georgia,'Times New Roman',serif;font-weight:400;letter-spacing:-.02em;margin:0;color:var(--ink)}
.aa-ac h1 em,.aa-ac h2 em{color:var(--teal)}
.aa-ac a{color:var(--teal);font-weight:600}
.aa-ac__mono{font:600 12px/1.3 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--teal)}
.aa-ac__hero{padding:30px 0 26px}
.aa-ac__crumb{display:inline-flex;gap:10px;padding:5px 14px;border:1px solid var(--line);border-radius:999px;background:#F4F8F8;color:#88A0A4}
.aa-ac__crumb a{color:#88A0A4;font-weight:400;text-decoration:none}
.aa-ac h1{font-size:clamp(34px,6vw,58px);line-height:1.03;margin-top:18px;text-wrap:balance}
.aa-ac__lede{font-family:'Newsreader',Georgia,serif;font-weight:300;font-size:clamp(18px,2.2vw,22px);line-height:1.45;color:#3C565E;max-width:760px;margin:16px 0 0}
.aa-ac__facts{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 0;padding:0;list-style:none}
.aa-ac__facts li{padding:6px 12px;border:1px solid var(--line);border-radius:999px;background:#fff;font-size:13px}
.aa-ac__card{background:#fff;border:1px solid var(--line);border-top:4px solid var(--teal);padding:26px;border-radius:2px}
.aa-ac__bar{height:6px;background:#E8F1F1;border-radius:3px;overflow:hidden;margin:10px 0 22px}
.aa-ac__bar i{display:block;height:100%;width:0;background:var(--teal);transition:width .25s ease}
.aa-ac fieldset{border:0;margin:0 0 26px;padding:0;min-width:0}
.aa-ac legend{padding:0;width:100%}
.aa-ac__n{display:block;margin-bottom:8px}
.aa-ac__q{display:block;font-family:'Newsreader',Georgia,serif;font-size:clamp(21px,3.2vw,28px);line-height:1.25}
.aa-ac__hint{margin:8px 0 0;font-size:14.5px;color:var(--mute)}
.aa-ac__opts{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:16px}
.aa-ac__opts label{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:64px;padding:8px 4px;border:1.5px solid var(--line);border-radius:8px;background:#fff;cursor:pointer;text-align:center;font-size:12.5px;color:var(--mute);transition:border-color .15s,background .15s}
.aa-ac__opts label b{font-size:20px;color:var(--ink);font-weight:700}
.aa-ac__opts input{position:absolute;opacity:0;inset:0;width:100%;height:100%;margin:0;cursor:pointer}
.aa-ac__opts label:hover{border-color:var(--teal)}
.aa-ac__opts label:has(input:checked){border-color:var(--teal);background:#E3F3F1;color:var(--ink)}
.aa-ac__opts label:has(input:focus-visible){outline:3px solid var(--warm);outline-offset:2px}
.aa-ac__nav{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:8px}
.aa-ac__btn{display:inline-block;min-height:48px;padding:13px 22px;border:0;border-radius:2px;background:var(--ink);color:#fff!important;font:600 15px/1.3 inherit;cursor:pointer;text-decoration:none}
.aa-ac__btn:hover{background:var(--teal)}
.aa-ac__btn[disabled]{opacity:.45;cursor:not-allowed}
.aa-ac__btn--ghost{background:transparent;color:var(--ink)!important;border:1px solid var(--line)}
.aa-ac__btn--ghost:hover{background:#F4F8F8}
.aa-ac__btn--warm{background:var(--warm);color:var(--ink)!important}
.aa-ac.is-js fieldset{display:none;margin:0}.aa-ac.is-js fieldset.is-on{display:block}
.aa-ac:not(.is-js) .aa-ac__nav [data-prev],.aa-ac:not(.is-js) .aa-ac__bar{display:none}
.aa-ac__res{margin-top:6px}
.aa-ac__score{display:grid;grid-template-columns:auto 1fr;gap:8px 26px;align-items:center;padding:28px;background:var(--ink);color:#E4F1F1;border-radius:2px}
.aa-ac__num{font-family:'Newsreader',Georgia,serif;font-size:72px;line-height:1;color:#fff}
.aa-ac__num small{font-size:22px;color:var(--mint)}
.aa-ac__score h2{color:#fff;font-size:clamp(26px,3.6vw,36px)}
.aa-ac__score p{margin:8px 0 0;color:#B9DCDC;max-width:620px}
.aa-ac__rows{margin:22px 0 0;padding:0;list-style:none}
.aa-ac__rows li{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) 34px;gap:12px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line);font-size:14.5px}
.aa-ac__track{height:8px;background:#E8F1F1;border-radius:4px;overflow:hidden}
.aa-ac__track i{display:block;height:100%;background:var(--teal)}
.aa-ac__rows li.is-gap .aa-ac__track i{background:var(--warm)}
.aa-ac__rows li.is-gap span:first-child:after{content:" · gap";color:#9A6A14;font-weight:600}
.aa-ac__rows b{text-align:right}
.aa-ac__gate{margin-top:22px;padding:24px;border:1.5px dashed var(--teal);background:rgba(242,182,109,.10)}
.aa-ac__gate form{display:grid;grid-template-columns:1fr 1fr auto;gap:10px;margin-top:14px}
.aa-ac__gate input{min-height:48px;padding:10px 12px;border:1px solid #B9CFCF;border-radius:2px;font:inherit;width:100%}
.aa-ac__err{margin:8px 0 0;color:#B42318;font-size:14px}
.aa-ac__plan h2,.aa-ac__sec h2{font-size:clamp(26px,3.6vw,36px);margin:44px 0 6px}
.aa-ac__sale{display:inline-block;margin:6px 0 0;padding:3px 10px;border-radius:999px;background:var(--warm);font-size:12px;font-weight:700}
.aa-ac__gaps{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:14px;margin-top:16px}
.aa-ac__gap{display:flex;flex-direction:column;gap:8px;padding:20px;background:#fff;border:1px solid var(--line);border-left:4px solid var(--warm)}
.aa-ac__gap h3{font-size:21px;line-height:1.25}
.aa-ac__gap h3 a{color:inherit;text-decoration:none}.aa-ac__gap h3 a:hover{text-decoration:underline}
.aa-ac__gap p{margin:0;font-size:14px;color:#3C565E}
.aa-ac__meta{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:13.5px;color:var(--ink)!important}
.aa-ac__meta s{color:var(--mute)}
.aa-ac__gap .aa-ac__btn{margin-top:auto;text-align:center;background:var(--teal)}
.aa-ac__gap .aa-ac__btn:hover{background:var(--ink)}
.aa-ac__soon{display:inline-block;padding:1px 7px;border-radius:999px;background:#E8F1F1;color:var(--mute);font-size:11px;font-weight:600;white-space:nowrap}
.aa-ac__more{margin:16px 0 0;padding:0;list-style:none;font-size:14.5px}
.aa-ac__more li{padding:8px 0;border-bottom:1px solid var(--line)}
.aa-ac__cta{display:flex;flex-wrap:wrap;gap:18px 30px;align-items:center;justify-content:space-between;margin-top:26px;padding:26px;background:var(--ink);color:#E4F1F1}
.aa-ac__cta h3{color:#fff;font-size:24px}.aa-ac__cta p{margin:6px 0 0;color:#B9DCDC;max-width:560px}
.aa-ac__tbl{width:100%;border-collapse:collapse;margin-top:14px;font-size:14.5px}
.aa-ac__tbl th,.aa-ac__tbl td{padding:11px 10px 11px 0;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
.aa-ac__tbl th{font:600 11px/1.3 ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--teal)}
.aa-ac__faq details{border-bottom:1px solid var(--line);padding:14px 0}
.aa-ac__faq summary{cursor:pointer;font-family:'Newsreader',Georgia,serif;font-size:20px}
.aa-ac__faq p{margin:8px 0 0;color:#3C565E;max-width:820px}
.aa-ac__src{margin:22px 0 0;font-size:12.5px;color:#88A0A4}
.aa-ac [hidden]{display:none!important}
@media (max-width:700px){.aa-ac{padding:0 16px 48px}.aa-ac__card{padding:18px 16px}.aa-ac__opts{gap:6px}.aa-ac__opts label{min-height:60px;font-size:11px}.aa-ac__score{grid-template-columns:1fr;padding:22px}.aa-ac__num{font-size:60px}.aa-ac__gate form{grid-template-columns:1fr}.aa-ac__rows li{grid-template-columns:minmax(0,1fr) 70px 30px}.aa-ac__tbl thead{display:none}.aa-ac__tbl tr{display:block;padding:12px 0;border-bottom:1px solid var(--line)}.aa-ac__tbl td{display:block;padding:2px 0;border:0}.aa-ac__tbl td:first-child{font-weight:700}.aa-ac__tbl td[data-l]:before{content:attr(data-l) ": ";color:var(--mute);font-size:12.5px}.aa-ac__cta .aa-ac__btn{width:100%;text-align:center}}
@media (prefers-reduced-motion:reduce){.aa-ac__bar i,.aa-ac__opts label{transition:none}}
</style>

<header class="aa-ac__hero">
	<nav aria-label="Breadcrumb" class="aa-ac__mono aa-ac__crumb"><a href="<?php echo esc_url( home_url( '/assessments/' ) ); ?>">&larr; Assessments</a><span>ART readiness</span></nav>
	<h1>Is your train ready to launch <em>AI-Native?</em></h1>
	<p class="aa-ac__lede">A free twelve-statement check of one Agile Release Train against the twelve critical success factors of AI-Native SAFe. You get a readiness score, your gaps, and the course that closes each one.</p>
	<ul class="aa-ac__facts"><li><b>12</b> statements</li><li>About <b>3 minutes</b></li><li><b>Free</b>, no login</li><li>Score and gaps <b>at once</b></li></ul>
</header>

<form class="aa-ac__card" id="aa-ac-form" novalidate>
	<p class="aa-ac__mono" id="aa-ac-step" aria-live="polite">Rate each statement for one train, from 1 (not at all) to 5 (fully)</p>
	<div class="aa-ac__bar" aria-hidden="true"><i id="aa-ac-prog"></i></div>
	<?php $n = 0; foreach ( $f as $id => $x ) : $n++; ?>
	<fieldset data-f="<?php echo esc_attr( $id ); ?>"<?php echo $n === 1 ? ' class="is-on"' : ''; ?>>
		<legend><span class="aa-ac__mono aa-ac__n"><?php echo esc_html( sprintf( '%02d / 12 · %s', $n, $x[0] ) ); ?></span><span class="aa-ac__q"><?php echo esc_html( $x[1] ); ?></span></legend>
		<p class="aa-ac__hint"><?php echo esc_html( 'What good looks like: ' . $x[2] ); ?></p>
		<div class="aa-ac__opts">
			<?php foreach ( $scale as $v => $lab ) : ?>
			<label><input type="radio" name="<?php echo esc_attr( $id ); ?>" value="<?php echo (int) $v; ?>"><b><?php echo (int) $v; ?></b><?php echo esc_html( $lab ); ?></label>
			<?php endforeach; ?>
		</div>
	</fieldset>
	<?php endforeach; ?>
	<div class="aa-ac__nav">
		<button type="button" class="aa-ac__btn aa-ac__btn--ghost" data-prev hidden>&larr; Back</button>
		<span></span>
		<button type="submit" class="aa-ac__btn" data-done>See my result &#10230;</button>
	</div>
	<noscript><p class="aa-ac__hint">The score needs JavaScript. Without it, use the table below: any statement you would rate 3 or lower is a gap.</p></noscript>
</form>

<section class="aa-ac__res" id="aa-ac-res" hidden aria-live="polite" tabindex="-1"></section>

<section class="aa-ac__sec" aria-labelledby="aa-ac-mx">
	<h2 id="aa-ac-mx">The twelve factors, and the course for <em>each gap</em></h2>
	<p>Each factor rated 3 or lower counts as a gap. This is the course we suggest first for each one, and what else helps.</p>
	<table class="aa-ac__tbl">
		<thead><tr><th scope="col">Success factor</th><th scope="col">Start with</th><th scope="col">Also helps</th></tr></thead>
		<tbody>
		<?php foreach ( $f as $id => $x ) :
			$m    = $mx[ $id ];
			$main = implode( '; ', array_filter( array_map( function ( $s ) use ( $courses ) { return aa_sf_ac_course_label( $s, $courses ); }, $m[0] ) ) );
			$also = array_filter( array_map( function ( $s ) use ( $courses ) { return aa_sf_ac_course_label( $s, $courses ); }, $m[1] ) );
			if ( $m[2] ) { $also[] = '<a href="' . esc_url( home_url( $m[2][1] ) ) . '">' . esc_html( $m[2][0] ) . '</a>'; }
		?>
			<tr><td><?php echo esc_html( $x[0] ); ?></td><td data-l="Start with"><?php echo $main; // phpcs:ignore -- built from escaped parts ?></td><td data-l="Also helps"><?php echo $also ? implode( '; ', $also ) : '&ndash;'; // phpcs:ignore ?></td></tr>
		<?php endforeach; ?>
		</tbody>
	</table>
</section>

<section class="aa-ac__sec aa-ac__faq" aria-labelledby="aa-ac-faq">
	<h2 id="aa-ac-faq">Questions</h2>
	<?php foreach ( $faq as $q ) : ?>
	<details><summary><?php echo esc_html( $q[0] ); ?></summary><p><?php echo esc_html( $q[1] ); ?></p></details>
	<?php endforeach; ?>
	<p class="aa-ac__src">An Agile Agilist self-check. Not the official Scaled Agile AI-Native ART Launch Readiness Assessment, which is used in the <a href="<?php echo esc_url( home_url( '/training/ai-native/launching-ai-native-arts/' ) ); ?>">Launching AI-Native ARTs</a> course. SAFe&reg; is a registered trademark of Scaled Agile, Inc.</p>
</section>

<script type="application/json" id="aa-ac-data"><?php echo wp_json_encode( array(
	'f' => array_map( function ( $x ) { return $x[0]; }, $f ), 'mx' => $mx, 'c' => $courses, 'sale' => $sale, 'team' => $team,
	'launch' => 'launching-ai-native-arts', 'quote' => home_url( '/team-training/?course=launching-ai-native-arts#quote' ),
	'hs' => array( '46316757', 'c6f0d4c1-d233-4875-9b0c-4528cda02237' ),
) ); ?></script>
<script>
(function(){
var root=document.getElementById('aa-ac'),form=document.getElementById('aa-ac-form'),res=document.getElementById('aa-ac-res');if(!root||!form||!res)return;
var D;try{D=JSON.parse(document.getElementById('aa-ac-data').textContent)}catch(e){return}
var sets=[].slice.call(form.querySelectorAll('fieldset')),ids=sets.map(function(s){return s.getAttribute('data-f')}),i=0;
var prev=form.querySelector('[data-prev]'),done=form.querySelector('[data-done]'),step=document.getElementById('aa-ac-step'),prog=document.getElementById('aa-ac-prog');
var KEY='aa_ac_answers',slow=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function h(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function ev(n,o){try{o=o||{};o.event=n;(window.dataLayer=window.dataLayer||[]).push(o)}catch(e){}}
function val(id){var r=form.querySelector('input[name="'+id+'"]:checked');return r?+r.value:0}
function answers(){var a={};ids.forEach(function(id){a[id]=val(id)});return a}
function count(){return ids.filter(val).length}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(answers()))}catch(e){}}
function show(n,focus){i=Math.max(0,Math.min(sets.length-1,n));sets.forEach(function(s,k){s.classList.toggle('is-on',k===i)});
  prev.hidden=i===0;var all=count()===sets.length;done.hidden=!(i===sets.length-1||all);done.disabled=!all;
  step.textContent='Statement '+(i+1)+' of '+sets.length;prog.style.width=Math.round(count()/sets.length*100)+'%';
  if(focus){var r=sets[i].querySelector('input:checked')||sets[i].querySelector('input');if(r)r.focus({preventScroll:true})}}
root.classList.add('is-js');
try{var old=JSON.parse(sessionStorage.getItem(KEY)||'null');if(old)ids.forEach(function(id){var r=old[id]&&form.querySelector('input[name="'+id+'"][value="'+old[id]+'"]');if(r)r.checked=true})}catch(e){}
var first=ids.findIndex(function(id){return!val(id)});show(first<0?sets.length-1:first,false);
var started=false;
form.addEventListener('change',function(e){if(!e.target||e.target.type!=='radio')return;if(!started){started=true;ev('art_check_start')}save();
  var k=ids.indexOf(e.target.name);if(k===i&&i<sets.length-1){setTimeout(function(){show(i+1,true)},slow?0:220)}else{show(i,false)}});
prev.addEventListener('click',function(){show(i-1,true)});
form.addEventListener('submit',function(e){e.preventDefault();if(count()<sets.length){var m=ids.findIndex(function(id){return!val(id)});show(m,true);return}render()});

function user(){try{return JSON.parse(localStorage.getItem('aa_user')||'null')}catch(e){return null}}
function band(t){return t>=45?['Ready to launch','The foundations are in place. Close the last gaps and set a launch date.']:t>=29?['Getting ready','Some factors are in place and some are not. Work on the gaps below before you launch, or they become the reasons the launch stalls.']:['Not yet ready','Most factors are still missing. Start with a shared language for the team, then the gaps below, before you plan a launch.']}
function meta(c){if(c.soon)return '<p class="aa-ac__meta"><span class="aa-ac__soon">Launching soon</span></p>';
  var w=c.when?'<span>Next class · <time datetime="'+h(c.iso)+'">'+h(c.when)+'</time></span>':'<span>Dates on request</span>';
  var p=c.price?'<span>'+(c.was?'<s>'+h(c.was)+'</s> ':'')+'<b>'+h(c.price)+'</b></span>':'';return '<p class="aa-ac__meta">'+w+p+'</p>'}
function link(s){var c=D.c[s];return c?'<a href="'+h(c.url)+'" data-ac="'+h(s)+'">'+h(c.name)+'</a>'+(c.soon?' <span class="aa-ac__soon">Launching soon</span>':''):''}
function also(id){var m=D.mx[id],a=m[1].map(link).filter(Boolean);if(m[2])a.push('<a href="'+h(m[2][1])+'">'+h(m[2][0])+'</a>');return a}
function plan(a){
  var gaps=ids.filter(function(id){return a[id]<=3}).sort(function(x,y){return a[x]-a[y]}),top=gaps.slice(0,3),rest=gaps.slice(3),o='';
  o+='<div class="aa-ac__plan"><h2>'+(gaps.length?'Your gaps, and the course for <em>each one</em>':'No gaps. <em>Launch.</em>')+'</h2>';
  if(D.sale)o+='<p class="aa-ac__sale">'+h(D.sale)+'</p>';
  if(gaps.length){o+='<div class="aa-ac__gaps">';
    top.forEach(function(id){var m=D.mx[id],c=D.c[m[0][0]];if(!c)return;var al=m[0].slice(1).map(link).filter(Boolean).concat(also(id));
      o+='<div class="aa-ac__gap"><p class="aa-ac__mono">'+h(D.f[id])+' · '+a[id]+'/5</p><h3><a href="'+h(c.url)+'" data-ac="'+h(m[0][0])+'">'+h(c.name)+'</a></h3>'+meta(c)
       +(al.length?'<p>Also helps: '+al.join('; ')+'</p>':'')+'<a class="aa-ac__btn" href="'+h(c.url)+'" data-ac="'+h(m[0][0])+'">See dates and register &#10230;</a></div>'});
    o+='</div>';
    if(rest.length){o+='<ul class="aa-ac__more">';rest.forEach(function(id){o+='<li><b>'+h(D.f[id])+'</b> ('+a[id]+'/5): '+D.mx[id][0].map(link).filter(Boolean).join('; ')+'</li>'});o+='</ul>'}}
  var L=D.c[D.launch];
  if(L)o+='<div class="aa-ac__cta"><div><h3>All twelve factors, in two days.</h3><p>Launching AI-Native ARTs works through every factor on this list against your own organization, and you leave with a launch plan.'+(L.when?' Next class '+h(L.when)+'.':'')+'</p></div><a class="aa-ac__btn aa-ac__btn--warm" href="'+h(L.url)+'" data-ac="launch-cta">See the course &#10230;</a></div>';
  if(D.team){var q=ids.map(function(id){return a[id]}).join('');o+='<div class="aa-ac__cta" style="background:#fff;color:#0B2E35;border:1px solid #DCEAEA"><div><h3 style="color:#0B2E35">Run it with your whole train.</h3><p style="color:#3C565E">One person\'s view is a start. On Trainyard everyone on the train answers and the scores are combined.</p></div><a class="aa-ac__btn" href="'+h(D.team+(D.team.indexOf('?')<0?'?':'&')+'sf='+q+'&utm_source=agile-agilist&utm_medium=art-check')+'" target="_blank" rel="noopener" data-ac="trainyard">Open the team version &#10230;</a></div>'}
  o+='<p style="margin-top:18px"><a href="'+h(D.quote)+'" data-ac="team-quote">Training the whole train? Request a team quote &rarr;</a> &nbsp; <a href="#aa-ac" data-again>Take it again</a></p></div>';
  return o}
function render(){
  var a=answers(),t=0;ids.forEach(function(id){t+=a[id]});var b=band(t),gaps=ids.filter(function(id){return a[id]<=3}).length,u=user();
  var rows='<ul class="aa-ac__rows">'+ids.map(function(id){return '<li'+(a[id]<=3?' class="is-gap"':'')+'><span>'+h(D.f[id])+'</span><span class="aa-ac__track"><i style="width:'+(a[id]*20)+'%"></i></span><b>'+a[id]+'/5</b></li>'}).join('')+'</ul>';
  var o='<div class="aa-ac__score"><div class="aa-ac__num">'+t+'<small>/60</small></div><div><p class="aa-ac__mono" style="color:#8FCFCF">Your readiness · '+gaps+' gap'+(gaps===1?'':'s')+'</p><h2>'+h(b[0])+'</h2><p>'+h(b[1])+'</p></div></div>'+rows;
  if(u&&u.email){o+=plan(a)}else{
    o+='<div class="aa-ac__gate" id="aa-ac-gate"><h3>Get the course for each gap, with dates and prices.</h3><p style="margin:6px 0 0;color:#3C565E">Your plan opens here at once. We send nothing else unless you ask.</p>'
     +'<form id="aa-ac-lead" novalidate><input type="text" name="name" autocomplete="given-name" placeholder="First name (optional)" aria-label="First name"><input type="email" name="email" autocomplete="email" inputmode="email" placeholder="Work email" aria-label="Work email" required><button class="aa-ac__btn" type="submit">Show my plan &#10230;</button></form><p class="aa-ac__err" id="aa-ac-err" hidden>Please enter a valid email.</p></div>'}
  form.hidden=true;res.innerHTML=o;res.hidden=false;res.focus({preventScroll:true});res.scrollIntoView({behavior:slow?'auto':'smooth',block:'start'});
  ev('art_check_complete',{aa_score:t,aa_band:b[0],aa_gaps:gaps});
  var lf=document.getElementById('aa-ac-lead');
  if(lf)lf.addEventListener('submit',function(e){e.preventDefault();var em=lf.email.value.trim(),nm=lf.name.value.trim(),er=document.getElementById('aa-ac-err');
    if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){er.hidden=false;lf.email.focus();return}
    try{localStorage.setItem('aa_user',JSON.stringify({tier:'free',email:em,name:nm,ts:Date.now()}))}catch(x){}
    var fields=[{name:'email',value:em}];if(nm)fields.push({name:'firstname',value:nm});
    try{fetch('https://api.hsforms.com/submissions/v3/integration/submit/'+D.hs[0]+'/'+D.hs[1],{method:'POST',headers:{'Content-Type':'application/json'},keepalive:true,body:JSON.stringify({fields:fields,context:{pageUri:location.href,pageName:'AI-Native ART Readiness Check - '+b[0]+' '+t+'/60, '+gaps+' gaps'}})}).catch(function(){})}catch(x){}
    ev('art_check_lead',{aa_score:t,aa_band:b[0]});
    document.getElementById('aa-ac-gate').outerHTML=plan(a)});
}
res.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a'):null;if(!a)return;
  if(a.hasAttribute('data-again')){e.preventDefault();try{sessionStorage.removeItem(KEY)}catch(x){}form.reset();res.hidden=true;res.innerHTML='';form.hidden=false;show(0,true);root.scrollIntoView({block:'start'});return}
  if(a.hasAttribute('data-ac'))ev('art_check_click',{aa_course:a.getAttribute('data-ac')})});
})();
</script>
</div>
	<?php
	return ob_get_clean();
}
add_shortcode( 'aa_art_check', 'aa_sf_ac_shortcode' );

endif;
