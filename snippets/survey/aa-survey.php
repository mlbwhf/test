<?php
/**
 * AA — Survey   automatic post-class follow-up, driven by the learning@ calendar
 *
 * WPCode: PHP snippet, "Run everywhere". Paste everything below the <?php line.
 *
 * WHAT IT DOES
 *   1. Once a day it reads the class calendar (the secret iCal address of
 *      learning@agile-agilist.com, pasted in Settings → Follow-up surveys),
 *      recognises each class from the event title (Leading SAFe, RTE, POPM…),
 *      collects the invited attendees, and when the class has ended plus a
 *      grace period it emails every attendee a personal survey link. The
 *      questions, the "which parts will you use first" options and the "what
 *      next" suggestions are specific to the class attended.
 *   2. Classes that are not on the calendar can be added by hand: pick the
 *      class, paste the invite's attendee list, send.
 *   3. Answers are stored as structured records (private posts), emailed to
 *      info@, written to the HubSpot contact when a token is configured, and
 *      summarised on a private results page with CSV export.
 *   4. One reminder to non-responders after a few days. A stop link in every
 *      email. No email address ever appears in a URL.
 *
 * SHORTCODES
 *   [aa_survey]            the survey page (/survey/). The personal link ?r=<token>
 *                          selects the class and greets the person. ?c=<class>
 *                          shows a class survey to someone without a link.
 *   [aa_survey_results]    admins only. Summary, every answer, CSV, non-responders.
 *
 * SETTINGS  WP Admin → Settings → Follow-up surveys.
 *
 * Every declaration is wrapped in function_exists so a second execution of the
 * snippet in the same request (WPCode's activation check) cannot fatal.
 */

if ( ! defined( 'ABSPATH' ) ) { return; }
if ( ! function_exists( 'aa_sv_classes' ) ) :

/* ============================================================================
   CLASSES: how to recognise them, what to ask, what to suggest next
   ========================================================================== */

/** Short labels for the "what next" suggestions (EN, FR). */
function aa_sv_next_labels() {
	return apply_filters( 'aa_sv_next_labels', array(
		'laart' => array( 'Launching AI-Native ARTs', 'Launching AI-Native ARTs' ),
		'spc'   => array( 'Implementing SAFe® (SPC)', 'Implementing SAFe® (SPC)' ),
		'aspc'  => array( 'Advanced SAFe® Practice Consultant (ASPC)', 'Advanced SAFe® Practice Consultant (ASPC)' ),
		'ls'    => array( 'Large Solution SAFe®', 'Large Solution SAFe®' ),
		'aiva'  => array( 'AI-Native Value Architect', 'AI-Native Value Architect' ),
		'sa'    => array( 'Leading SAFe®', 'Leading SAFe®' ),
		'sagov' => array( 'Leading SAFe® for Government', 'Leading SAFe® for Government' ),
		'pisim' => array( 'A hands-on PI Planning simulation for our own teams', 'Une simulation pratique de planification de PI avec nos propres équipes' ),
		'ssm'   => array( 'SAFe® Scrum Master', 'SAFe® Scrum Master' ),
		'asm'   => array( 'SAFe® Advanced Scrum Master', 'SAFe® Advanced Scrum Master' ),
		'popm'  => array( 'SAFe® Product Owner / Product Manager', 'SAFe® Product Owner / Product Manager' ),
		'apm'   => array( 'SAFe® Agile Product Management', 'SAFe® Agile Product Management' ),
		'lpm'   => array( 'Lean Portfolio Management', 'Gestion de portefeuille Lean' ),
		'rte'   => array( 'Release Train Engineer', 'Release Train Engineer' ),
		'arch'  => array( 'SAFe® for Architects', 'SAFe® for Architects' ),
		'devops'=> array( 'SAFe® DevOps', 'SAFe® DevOps' ),
		'sp'    => array( 'SAFe® for Teams', 'SAFe® for Teams' ),
		'ainf'  => array( 'AI-Native Foundations', 'AI-Native Foundations' ),
		'ainsf' => array( 'AI-Native SAFe Fundamentals', 'AI-Native SAFe Fundamentals' ),
		'ainorg'=> array( 'Leading the AI-Native Organization', 'Leading the AI-Native Organization' ),
		'acg'   => array( 'Agile Contracting for Government', 'Agile Contracting for Government' ),
	) );
}

/**
 * The class table. Keys are the register's course slugs where one exists.
 *   match : regexes (case-insensitive) tried against the calendar event title,
 *           in the order of this table. The first class that matches wins, so
 *           the more specific entries sit first.
 *   parts : "Which parts will you use first?" options (EN, FR).
 *   next  : keys of aa_sv_next_labels(), in display order.
 */
function aa_sv_classes() {
	$P = array( /* shared option texts */
		'pi'    => array( 'PI Planning', 'Planification de PI' ),
		'lead'  => array( 'Lean-Agile leadership and mindset', 'Leadership et état d’esprit Lean-Agile' ),
		'art'   => array( 'Agile Release Trains and team-of-teams delivery', 'Agile Release Trains et livraison en équipe d’équipes' ),
		'vs'    => array( 'Value streams and flow', 'Chaînes de valeur et flux' ),
		'lpm'   => array( 'Lean Portfolio Management', 'Gestion de portefeuille Lean' ),
		'flow'  => array( 'Flow metrics, Kanban and predictability', 'Métriques de flux, Kanban et prévisibilité' ),
		'coach' => array( 'Coaching teams and leaders', 'Accompagner les équipes et les leaders' ),
		'ia'    => array( 'Inspect & Adapt and problem solving', 'Inspect & Adapt et résolution de problèmes' ),
		'ai'    => array( 'Putting AI agents to work in the flow', 'Mettre des agents IA au travail dans le flux' ),
		'gov'   => array( 'Guardrails, governance and measurement', 'Garde-fous, gouvernance et mesure' ),
		'other' => array( 'Something else', 'Autre chose' ),
	);
	$c = array(
		'aspc' => array( 'code' => 'ASPC', 'name' => array( 'Advanced SAFe® Practice Consultant', 'Advanced SAFe® Practice Consultant' ),
			'match' => array( '/advanced\s+safe\s+practice/i', '/\bASPC\b/' ),
			'parts' => array( 'exec' => array( 'Coaching executives and portfolio leaders', 'Accompagner les dirigeants et les leaders de portefeuille' ), 'strat' => array( 'Transformation strategy and measure & grow', 'Stratégie de transformation et mesurer et croître' ), 'art' => array( 'Advanced ART and Solution Train coaching', 'Coaching avancé d’ART et de Solution Train' ), 'lace' => array( 'Running the LACE', 'Animer le LACE' ), 'other' => $P['other'] ),
			'next' => array( 'aiva', 'ainorg', 'laart', 'ls' ) ),
		'spc' => array( 'code' => 'SPC', 'name' => array( 'Implementing SAFe®', 'Implementing SAFe®' ),
			'match' => array( '/implementing\s+safe/i', '/\bSPC\b/' ),
			'parts' => array( 'roadmap' => array( 'The implementation roadmap', 'La feuille de route de mise en œuvre' ), 'launch' => array( 'Identifying value streams and launching ARTs', 'Identifier les chaînes de valeur et lancer des ART' ), 'train' => array( 'Training and coaching leaders and teams', 'Former et accompagner leaders et équipes' ), 'lace' => array( 'Setting up the LACE', 'Mettre en place le LACE' ), 'other' => $P['other'] ),
			'next' => array( 'aspc', 'laart', 'aiva', 'ls', 'ainorg' ) ),
		'rte' => array( 'code' => 'RTE', 'name' => array( 'SAFe® Release Train Engineer', 'SAFe® Release Train Engineer' ),
			'match' => array( '/release\s+train\s+engineer/i', '/\bRTE\b/' ),
			'parts' => array( 'pi' => array( 'Facilitating PI Planning', 'Animer la planification de PI' ), 'sync' => array( 'ART sync, Coach sync and PO sync', 'ART sync, Coach sync et PO sync' ), 'ia' => $P['ia'], 'flow' => $P['flow'], 'coach' => array( 'Coaching the train and its leaders', 'Accompagner le train et ses leaders' ), 'other' => $P['other'] ),
			'next' => array( 'laart', 'spc', 'aspc', 'ls', 'aiva' ) ),
		'large-solution' => array( 'code' => 'LSSP', 'name' => array( 'Large Solution SAFe®', 'Large Solution SAFe®' ),
			'match' => array( '/large\s+solution/i', '/\bLSSP\b/' ),
			'parts' => array( 'st' => array( 'Solution Train roles and events', 'Rôles et événements du Solution Train' ), 'prepost' => array( 'Pre- and post-PI Planning', 'Pré- et post-planification de PI' ), 'intent' => array( 'Solution intent and compliance', 'Intention de solution et conformité' ), 'sbd' => array( 'Set-based design and MBSE', 'Conception par ensembles et MBSE' ), 'other' => $P['other'] ),
			'next' => array( 'aspc', 'aiva', 'laart', 'lpm' ) ),
		'ai-chan' => array( 'code' => 'AINVA', 'name' => array( 'AI-Native Value Architect', 'AI-Native Value Architect' ),
			'match' => array( '/value\s+architect/i', '/\bAINVA\b/' ),
			'parts' => array( 'map' => array( 'Mapping AI opportunities to value', 'Relier les occasions d’IA à la valeur' ), 'vs' => array( 'Architecting value streams with AI', 'Architecturer des chaînes de valeur avec l’IA' ), 'ai' => $P['ai'], 'gov' => $P['gov'], 'other' => $P['other'] ),
			'next' => array( 'laart', 'aspc', 'ainorg', 'lpm' ) ),
		'launching-ai-native-arts' => array( 'code' => 'ARTL', 'name' => array( 'Launching AI-Native ARTs', 'Launching AI-Native ARTs' ),
			'match' => array( '/launch\w*\s+(ai[- ]native\s+)?arts?\b/i', '/\bARTL\b/' ),
			'parts' => array( 'design' => array( 'Designing an AI-native ART', 'Concevoir un ART AI-native' ), 'launch' => array( 'The launch plan and quickstart', 'Le plan de lancement et le quickstart' ), 'ai' => $P['ai'], 'flow' => $P['flow'], 'other' => $P['other'] ),
			'next' => array( 'aiva', 'spc', 'aspc', 'ls', 'rte' ) ),
		'ai-native-change-agent' => array( 'code' => 'AINF', 'name' => array( 'AI-Native Foundations', 'AI-Native Foundations' ),
			'match' => array( '/ai[- ]native\s+foundations?/i', '/change\s+agent/i', '/\bAINF\b/' ),
			'parts' => array( 'mind' => array( 'AI literacy and mindset', 'Culture et état d’esprit IA' ), 'cases' => array( 'Finding and shaping use cases', 'Trouver et cadrer des cas d’usage' ), 'ai' => array( 'Prompting and agents in daily work', 'Prompts et agents dans le travail quotidien' ), 'gov' => $P['gov'], 'other' => $P['other'] ),
			'next' => array( 'laart', 'aiva', 'ainsf', 'sa' ) ),
		'ainsf' => array( 'code' => 'AINSF', 'name' => array( 'AI-Native SAFe Fundamentals', 'AI-Native SAFe Fundamentals' ),
			'match' => array( '/ai[- ]native\s+safe\s+fundamentals/i', '/\bAINSF\b/' ),
			'parts' => array( 'mind' => $P['lead'], 'pi' => $P['pi'], 'ai' => $P['ai'], 'vs' => $P['vs'], 'other' => $P['other'] ),
			'next' => array( 'ainf', 'sa', 'laart' ) ),
		'ainorg' => array( 'code' => 'AINORG', 'name' => array( 'Leading the AI-Native Organization', 'Leading the AI-Native Organization' ),
			'match' => array( '/ai[- ]native\s+organi[sz]ation/i', '/\bAINORG\b/' ),
			'parts' => array( 'strat' => array( 'AI strategy and operating model', 'Stratégie IA et modèle opérationnel' ), 'lead' => $P['lead'], 'gov' => $P['gov'], 'ai' => $P['ai'], 'other' => $P['other'] ),
			'next' => array( 'aiva', 'laart', 'lpm' ) ),
		'lpm' => array( 'code' => 'LPM', 'name' => array( 'SAFe® Lean Portfolio Management', 'SAFe® Lean Portfolio Management' ),
			'match' => array( '/lean\s+portfolio/i', '/\bLPM\b/' ),
			'parts' => array( 'strat' => array( 'Strategy, investment funding and guardrails', 'Stratégie, financement des investissements et garde-fous' ), 'kanban' => array( 'Portfolio Kanban and epics', 'Kanban de portefeuille et epics' ), 'budget' => array( 'Lean budgets and participatory budgeting', 'Budgets Lean et budgétisation participative' ), 'okr' => array( 'Portfolio sync, OKRs and measuring outcomes', 'Synchronisation de portefeuille, OKR et mesure des résultats' ), 'other' => $P['other'] ),
			'next' => array( 'aiva', 'ls', 'laart', 'spc', 'ainorg' ) ),
		'apm' => array( 'code' => 'APM', 'name' => array( 'SAFe® Agile Product Management', 'SAFe® Agile Product Management' ),
			'match' => array( '/agile\s+product\s+management/i', '/\bAPM\b/' ),
			'parts' => array( 'vision' => array( 'Vision, strategy and market research', 'Vision, stratégie et étude de marché' ), 'personas' => array( 'Design thinking and personas', 'Design thinking et personas' ), 'roadmap' => array( 'Roadmaps and pricing', 'Feuilles de route et tarification' ), 'deliver' => array( 'Delivering and measuring the solution', 'Livrer et mesurer la solution' ), 'other' => $P['other'] ),
			'next' => array( 'lpm', 'aiva', 'laart', 'ls' ) ),
		'popm' => array( 'code' => 'POPM', 'name' => array( 'SAFe® Product Owner / Product Manager', 'SAFe® Product Owner / Product Manager' ),
			'match' => array( '/product\s+owner/i', '/\bPOPM\b/' ),
			'parts' => array( 'backlog' => array( 'Features, stories and backlog refinement', 'Fonctionnalités, stories et affinage du backlog' ), 'pi' => array( 'Preparing for and running PI Planning', 'Préparer et vivre la planification de PI' ), 'customer' => array( 'Customer centricity and design thinking', 'Centrage client et design thinking' ), 'iter' => array( 'Iteration execution and reviews', 'Exécution des itérations et revues' ), 'other' => $P['other'] ),
			'next' => array( 'apm', 'laart', 'lpm', 'ls', 'ainf', 'aiva' ) ),
		'asm' => array( 'code' => 'ASM', 'name' => array( 'SAFe® Advanced Scrum Master', 'SAFe® Advanced Scrum Master' ),
			'match' => array( '/advanced\s+scrum\s+master/i', '/\bASM\b/' ),
			'parts' => array( 'flow' => $P['flow'], 'coach' => $P['coach'], 'art' => array( 'Supporting ART events and the RTE', 'Soutenir les événements de l’ART et le RTE' ), 'ia' => $P['ia'], 'other' => $P['other'] ),
			'next' => array( 'rte', 'laart', 'popm', 'ainf' ) ),
		'scrum-master' => array( 'code' => 'SSM', 'name' => array( 'SAFe® Scrum Master', 'SAFe® Scrum Master' ),
			'match' => array( '/scrum\s+master/i', '/\bSSM\b/' ),
			'parts' => array( 'events' => array( 'Iteration events and team facilitation', 'Événements d’itération et facilitation d’équipe' ), 'pi' => array( 'PI Planning with the team', 'La planification de PI avec l’équipe' ), 'flow' => $P['flow'], 'coach' => array( 'Coaching the team and removing impediments', 'Accompagner l’équipe et lever les obstacles' ), 'other' => $P['other'] ),
			'next' => array( 'asm', 'rte', 'laart', 'popm', 'ainf' ) ),
		'devops' => array( 'code' => 'SDP', 'name' => array( 'SAFe® DevOps', 'SAFe® DevOps' ),
			'match' => array( '/devops/i', '/\bSDP\b/' ),
			'parts' => array( 'vsm' => array( 'Value stream mapping', 'Cartographie de la chaîne de valeur' ), 'cdp' => array( 'The continuous delivery pipeline', 'Le pipeline de livraison continue' ), 'rod' => array( 'Release on demand', 'Livraison à la demande' ), 'flow' => $P['flow'], 'other' => $P['other'] ),
			'next' => array( 'laart', 'arch', 'rte', 'aiva' ) ),
		'arch' => array( 'code' => 'ARCH', 'name' => array( 'SAFe® for Architects', 'SAFe® for Architects' ),
			'match' => array( '/architect/i', '/\bARCH\b/' ),
			'parts' => array( 'runway' => array( 'Architectural runway and enablers', 'Piste architecturale et facilitateurs' ), 'flow' => array( 'Architecting for flow and continuous delivery', 'Architecturer pour le flux et la livraison continue' ), 'pi' => array( 'Participating in PI Planning', 'Participer à la planification de PI' ), 'devops' => array( 'Collaborating with DevOps and the teams', 'Collaborer avec DevOps et les équipes' ), 'other' => $P['other'] ),
			'next' => array( 'ls', 'laart', 'aiva', 'devops' ) ),
		'team-practitioner' => array( 'code' => 'SP', 'name' => array( 'SAFe® for Teams', 'SAFe® for Teams' ),
			'match' => array( '/safe\s+for\s+teams/i', '/practitioner/i', '/\bSP\b/' ),
			'parts' => array( 'iter' => array( 'Planning and running iterations', 'Planifier et vivre les itérations' ), 'pi' => $P['pi'], 'stories' => array( 'Stories, estimation and built-in quality', 'Stories, estimation et qualité intégrée' ), 'art' => $P['art'], 'other' => $P['other'] ),
			'next' => array( 'ssm', 'popm', 'sa', 'ainf' ) ),
		'sa' => array( 'code' => 'SA', 'name' => array( 'Leading SAFe®', 'Leading SAFe®' ),
			'match' => array( '/leading\s+safe/i', '/safe\s+agilist/i', '/\bSA\b/' ),
			'parts' => array( 'lead' => $P['lead'], 'pi' => $P['pi'], 'art' => $P['art'], 'vs' => $P['vs'], 'lpm' => $P['lpm'], 'other' => $P['other'] ),
			'next' => array( 'laart', 'sagov', 'pisim', 'ssm', 'popm', 'lpm', 'ls', 'rte', 'ainf', 'acg' ) ),
	);
	return apply_filters( 'aa_sv_classes', $c );
}

function aa_sv_class( $slug ) {
	$all = aa_sv_classes();
	return isset( $all[ $slug ] ) ? $all[ $slug ] : null;
}

/** Which class is a calendar event about? Returns the slug or ''. */
function aa_sv_match_class( $title ) {
	$title = (string) $title;
	foreach ( aa_sv_classes() as $slug => $c ) {
		foreach ( (array) $c['match'] as $re ) {
			if ( @preg_match( $re, $title ) ) { return $slug; }
		}
	}
	return '';
}

/* ============================================================================
   SURVEY DEFINITION, built per class (and per delivery when it has sessions)
   ========================================================================== */

function aa_sv_survey( $slug, $delivery = null ) {
	$c = aa_sv_class( $slug );
	if ( ! $c ) { return null; }
	$set  = aa_sv_settings();
	$name = $c['name'];
	$labels = aa_sv_next_labels();
	$next = array();
	foreach ( (array) $c['next'] as $k ) { if ( isset( $labels[ $k ] ) ) { $next[ $k ] = $labels[ $k ]; } }
	$next['other'] = array( 'Something else (tell us below)', 'Autre chose (précisez ci-dessous)' );
	$q = array();
	if ( $delivery && ! empty( $delivery['sessions'] ) ) {
		$opts = array();
		foreach ( (array) $delivery['sessions'] as $i => $label ) { $opts[ 's' . ( $i + 1 ) ] = array( $label, $label ); }
		$opts['other'] = array( 'Another date', 'Une autre date' );
		$q['session'] = array( 'type' => 'radio', 'required' => true, 'label' => array( 'Which session did you attend?', 'À quelle session avez-vous participé?' ), 'options' => $opts );
	}
	$q['q1'] = array( 'type' => 'scale', 'required' => true,
		'label' => array( 'How confident are you about using what you learned in your own work over the next three months?', 'À quel point vous sentez-vous en mesure d’appliquer ce que vous avez appris dans votre travail au cours des trois prochains mois?' ),
		'low' => array( 'Not at all', 'Pas du tout' ), 'high' => array( 'Very confident', 'Tout à fait' ) );
	$q['q2'] = array( 'type' => 'multi', 'required' => true, 'label' => array( 'Which parts will you use first?', 'Quels éléments utiliserez-vous en premier?' ), 'hint' => array( 'Pick any.', 'Plusieurs choix possibles.' ), 'options' => $c['parts'] );
	$q['q3'] = array( 'type' => 'text', 'required' => false, 'label' => array( 'What is most likely to get in the way of applying it?', 'Qu’est-ce qui risque le plus de freiner la mise en pratique?' ),
		'hint' => array( 'Governance or approvals, team structure, tooling, time, buy-in from others, or nothing in particular. One line is plenty.', 'Gouvernance ou approbations, structure des équipes, outils, temps, adhésion des autres, ou rien en particulier. Une ligne suffit.' ) );
	$q['q4'] = array( 'type' => 'multi', 'required' => false, 'label' => array( 'What would you like next?', 'Que souhaiteriez-vous pour la suite?' ), 'hint' => array( 'Pick any that interest you.', 'Choisissez tout ce qui vous intéresse.' ), 'options' => $next );
	$q['q4other'] = array( 'type' => 'text', 'required' => false, 'short' => true, 'label' => array( 'Another topic, or anything else you want to tell us', 'Un autre sujet, ou tout ce que vous souhaitez nous dire' ) );
	$q['q5'] = array( 'type' => 'radio', 'required' => true,
		'label' => array( 'Would you like a free 30-minute consultation?', 'Souhaitez-vous une consultation gratuite de 30 minutes?' ),
		'hint'  => array( 'A one-to-one conversation about your team or program: where SAFe would help first, what to try in the next quarter, and which training, if any, makes sense for whom. No sales pitch.', 'Un échange individuel sur votre équipe ou votre programme : où SAFe aiderait en premier, quoi essayer au prochain trimestre, et quelle formation, s’il y a lieu, convient à qui. Sans argumentaire de vente.' ),
		'options' => array( 'yes' => array( 'Yes, please contact me', 'Oui, contactez-moi' ), 'later' => array( 'Maybe later', 'Peut-être plus tard' ), 'no' => array( 'No, thank you', 'Non, merci' ) ) );
	return apply_filters( 'aa_sv_survey', array(
		'id'     => $slug,
		'code'   => $c['code'],
		'name'   => $name,
		'title'  => array( $name[0] . ' · your feedback', $name[1] . ' · votre avis' ),
		'intro'  => array(
			sprintf( 'Thank you for joining the %s class. Five short questions, about two minutes: is this something you can use, and what would help you most next?', $name[0] ),
			sprintf( 'Merci d’avoir suivi la formation %s. Cinq courtes questions, environ deux minutes : est-ce applicable pour vous, et qu’est-ce qui vous aiderait le plus pour la suite?', $name[1] ),
		),
		'book'   => $set['book'],
		'notify' => $set['notify'],
		'questions' => $q,
		'thanks' => array(
			array( 'Thank you. Your answers are in.', 'Merci. Vos réponses sont enregistrées.' ),
			array( 'If you asked for a consultation, pick a time that suits you:', 'Si vous avez demandé une consultation, choisissez un moment qui vous convient :' ),
			array( 'Book a time', 'Réserver un moment' ),
		),
	), $slug, $delivery );
}

/* ============================================================================
   SETTINGS, RECIPIENTS, DELIVERIES
   ========================================================================== */

function aa_sv_settings() {
	$d = array(
		'enabled'       => 1,            // read the calendar and send automatically
		'days_after'    => 2,            // days after the class ends
		'reminder_days' => 6,            // one reminder to non-responders; 0 = none
		'since'         => '2026-10-15', // ignore classes that ended before this date
		'ics_url'       => '',           // secret iCal address of learning@agile-agilist.com
		'page_id'       => 0,            // the page carrying [aa_survey]; 0 = page with slug "survey"
		'notify'        => 'info@agile-agilist.com',
		'book'          => 'https://meetings.hubspot.com/john2795',
		'skip_domains'  => "agile-agilist.com\ntrainyard.app\ngroup.calendar.google.com\nresource.calendar.google.com",
		'orgs'          => "servicecanada.gc.ca=Service Canada\nhrsdc-rhdcc.gc.ca=Service Canada\nesdc-edsc.gc.ca=Service Canada\nlabour-travail.gc.ca=Service Canada",
		'last_sync'     => '', 'last_sync_note' => '',
	);
	$s = get_option( 'aa_sv_settings', array() );
	return array_merge( $d, is_array( $s ) ? $s : array() );
}
function aa_sv_set( $k, $v ) {
	$s = get_option( 'aa_sv_settings', array() ); $s = is_array( $s ) ? $s : array();
	$s[ $k ] = $v; update_option( 'aa_sv_settings', $s, false );
}
function aa_sv_today() { return ( new DateTime( 'now', wp_timezone() ) )->format( 'Y-m-d' ); }
function aa_sv_date_add( $ymd, $days ) { $d = new DateTime( $ymd . ' 00:00:00', wp_timezone() ); $d->modify( ( $days >= 0 ? '+' : '' ) . (int) $days . ' days' ); return $d->format( 'Y-m-d' ); }

function aa_sv_survey_url( $args = array() ) {
	$set = aa_sv_settings();
	$id  = (int) $set['page_id'];
	if ( ! $id ) { $p = get_page_by_path( 'survey' ); $id = $p ? $p->ID : 0; }
	$url = $id ? get_permalink( $id ) : home_url( '/survey/' );
	return $args ? add_query_arg( $args, $url ) : $url;
}

/* Recipients: option aa_sv_recipients = { token: {email, first, last, class, delivery, lang, sent, reminded, stopped, test} } */
function aa_sv_recipients() { $r = get_option( 'aa_sv_recipients', array() ); return is_array( $r ) ? $r : array(); }
function aa_sv_recipient( $token ) {
	if ( ! preg_match( '/^[A-Za-z0-9]{12,40}$/', (string) $token ) ) { return null; }
	$r = aa_sv_recipients();
	return isset( $r[ $token ] ) ? array_merge( array( 'token' => $token ), $r[ $token ] ) : null;
}
function aa_sv_recipient_update( $token, $fields ) {
	$r = aa_sv_recipients();
	if ( ! isset( $r[ $token ] ) ) { return; }
	$r[ $token ] = array_merge( $r[ $token ], $fields );
	update_option( 'aa_sv_recipients', $r, false );
}
/** Find or create the recipient for (email, delivery). Returns the token. */
function aa_sv_recipient_for( $email, $first, $last, $class, $delivery, $lang = 'en' ) {
	$r = aa_sv_recipients();
	$email = strtolower( trim( $email ) );
	foreach ( $r as $tok => $p ) {
		if ( $p['email'] === $email && $p['delivery'] === $delivery ) { return $tok; }
	}
	do { $tok = wp_generate_password( 16, false, false ); } while ( isset( $r[ $tok ] ) );
	$r[ $tok ] = array( 'email' => $email, 'first' => $first, 'last' => $last, 'class' => $class, 'delivery' => $delivery, 'lang' => $lang, 'sent' => '', 'reminded' => '', 'stopped' => 0, 'test' => 0, 'created' => current_time( 'mysql' ) );
	update_option( 'aa_sv_recipients', $r, false );
	return $tok;
}

/* Deliveries: option aa_sv_deliveries = { key: {key, class, label, org, start, end, source, sessions[], people{email:[first,last]}, status, send_at, sent_at, uids[]} } */
function aa_sv_deliveries() { $d = get_option( 'aa_sv_deliveries', array() ); return is_array( $d ) ? $d : array(); }
function aa_sv_delivery( $key ) { $d = aa_sv_deliveries(); return isset( $d[ $key ] ) ? $d[ $key ] : null; }
function aa_sv_delivery_save( $del ) {
	$d = aa_sv_deliveries(); $d[ $del['key'] ] = $del;
	uasort( $d, function ( $a, $b ) { return strcmp( $b['end'], $a['end'] ); } );
	update_option( 'aa_sv_deliveries', $d, false );
}
function aa_sv_delivery_label( $del ) {
	$c = aa_sv_class( $del['class'] );
	$name = $c ? $c['name'][0] : $del['class'];
	$dates = $del['start'] && $del['end'] ? ( $del['start'] === $del['end'] ? date_i18n( 'M j, Y', strtotime( $del['start'] ) ) : date_i18n( 'M j', strtotime( $del['start'] ) ) . ' – ' . date_i18n( 'M j, Y', strtotime( $del['end'] ) ) ) : '';
	return trim( $name . ( $del['org'] ? ' · ' . $del['org'] : '' ) . ( $dates ? ' · ' . $dates : '' ) );
}

/* ----------------------------------------------------------------------------
   Attendee parsing: calendar ATTENDEE lines, or a pasted invite list.
   ------------------------------------------------------------------------- */
function aa_sv_name_from_email( $email ) {
	$local = preg_replace( '/[+@].*$/', '', $email );
	$local = preg_replace( '/\d+/', '', $local );
	$parts = preg_split( '/[._-]+/', $local );
	$parts = array_values( array_filter( array_map( 'trim', $parts ) ) );
	if ( ! $parts ) { return array( '', '' ); }
	$first = ucfirst( strtolower( $parts[0] ) );
	$last  = count( $parts ) > 1 ? ucfirst( strtolower( end( $parts ) ) ) : '';
	return array( $first, $last );
}
/** "Last, First [X]" | "First Last" | "First Last <email>" → [first, last]. */
function aa_sv_split_name( $cn, $email ) {
	$cn = trim( preg_replace( '/\s*[\[\(].*?[\]\)]\s*/', ' ', (string) $cn ) );
	$cn = trim( preg_replace( '/<[^>]*>/', '', $cn ) );
	if ( $cn === '' || strpos( $cn, '@' ) !== false ) { return aa_sv_name_from_email( $email ); }
	if ( strpos( $cn, ',' ) !== false ) { $p = array_map( 'trim', explode( ',', $cn, 2 ) ); $f = preg_split( '/\s+/', $p[1] ); return array( $f[0], $p[0] ); }
	$p = preg_split( '/\s+/', $cn );
	return array( $p[0], count( $p ) > 1 ? implode( ' ', array_slice( $p, 1 ) ) : '' );
}
function aa_sv_skip_email( $email ) {
	$set = aa_sv_settings();
	$email = strtolower( $email );
	$dom = substr( strrchr( $email, '@' ), 1 );
	$local = strstr( $email, '@', true );
	/* Shared and system mailboxes are not people. */
	if ( preg_match( '/^(info|support|admin|helpdesk|noreply|no-reply|donotreply|sales|billing|accounts?|hr|team|learning|training|apprentissage|formation|mailbox|office|reception)([._-]|$)|[._-](learning|apprentissage|mailbox|team|group|noreply)([._-]|$)|^edsc\.|\.mvp\./', $local ) ) { return true; }
	foreach ( preg_split( '/[\s,;]+/', strtolower( $set['skip_domains'] ) ) as $d ) {
		$d = trim( $d ); if ( $d === '' ) { continue; }
		if ( strpos( $d, '@' ) !== false ) { if ( $email === $d ) { return true; } continue; }   // a full address
		if ( $dom === $d || substr( $dom, -strlen( '.' . $d ) ) === '.' . $d ) { return true; }
	}
	return false;
}
/**
 * Pasted text (any format) → { email: [first, last] }.
 * A name is taken only from the same line as its address ("First Last <email>",
 * "Last, First <email>"). Outlook-style lists put resolved names and bare
 * addresses on separate lines as separate people, so a name on the line above
 * is never attached to the address below; the first name then comes from the
 * address itself (first.last@ → First).
 */
function aa_sv_parse_people( $text ) {
	$out = array();
	foreach ( preg_split( '/\r\n|\r|\n|;/', (string) $text ) as $line ) {
		$line = trim( $line );
		if ( $line === '' || ! preg_match_all( '/[A-Z0-9._%+\-\']+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', $line, $m ) ) { continue; }
		foreach ( $m[0] as $email ) {
			$email = strtolower( $email );
			if ( ! is_email( $email ) || aa_sv_skip_email( $email ) ) { continue; }
			$cn = trim( str_replace( $m[0], '', $line ) );
			$cn = trim( $cn, " \t<>\"',;:-()" );
			$out[ $email ] = aa_sv_split_name( count( $m[0] ) === 1 ? $cn : '', $email );
		}
	}
	return $out;
}
/** Calendar events that name a class but are not one. */
function aa_sv_not_a_class( $title ) {
	return (bool) preg_match( '/orientation|kick[- ]?off|prep\b|office hours|info session|q&a|webinar|\bcall\b|meeting|sync\b|interview|debrief|retro|planning session|exam/i', (string) $title );
}
/** The organisation shown on the survey, from the attendees' domains. */
function aa_sv_org_for( $people ) {
	$set = aa_sv_settings(); $map = array();
	foreach ( preg_split( '/\r\n|\r|\n/', $set['orgs'] ) as $l ) { if ( strpos( $l, '=' ) !== false ) { list( $d, $o ) = array_map( 'trim', explode( '=', $l, 2 ) ); $map[ strtolower( $d ) ] = $o; } }
	$count = array();
	foreach ( array_keys( $people ) as $e ) { $dom = strtolower( substr( strrchr( $e, '@' ), 1 ) ); if ( isset( $map[ $dom ] ) ) { $count[ $map[ $dom ] ] = ( isset( $count[ $map[ $dom ] ] ) ? $count[ $map[ $dom ] ] : 0 ) + 1; } }
	if ( ! $count ) { return ''; }
	arsort( $count ); return (string) key( $count );
}

/* ============================================================================
   CALENDAR (iCal feed) → deliveries
   ========================================================================== */

/** Minimal, careful ICS parser: returns events {uid, summary, start, end, status, attendees{email:[first,last]}, rrule}. Dates are Y-m-d in the site timezone. */
function aa_sv_parse_ics( $ics ) {
	$ics = str_replace( array( "\r\n", "\r" ), "\n", (string) $ics );
	$ics = preg_replace( "/\n[ \t]/", '', $ics );              // unfold continuation lines
	$events = array();
	if ( ! preg_match_all( '/BEGIN:VEVENT\n(.*?)\nEND:VEVENT/s', $ics, $blocks ) ) { return $events; }
	$tz = wp_timezone();
	foreach ( $blocks[1] as $b ) {
		$ev = array( 'uid' => '', 'summary' => '', 'start' => '', 'end' => '', 'status' => '', 'attendees' => array(), 'rrule' => '', 'allday' => false );
		foreach ( explode( "\n", $b ) as $line ) {
			if ( ! preg_match( '/^([A-Z\-]+)((?:;[^:]*)?):(.*)$/', $line, $m ) ) { continue; }
			$prop = $m[1]; $params = $m[2]; $val = $m[3];
			switch ( $prop ) {
				case 'UID':     $ev['uid'] = $val; break;
				case 'STATUS':  $ev['status'] = strtoupper( $val ); break;
				case 'RRULE':   $ev['rrule'] = $val; break;
				case 'SUMMARY': $ev['summary'] = str_replace( array( '\\,', '\\;', '\\n', '\\\\' ), array( ',', ';', ' ', '\\' ), $val ); break;
				case 'DTSTART': case 'DTEND':
					$isDate = strpos( $params, 'VALUE=DATE' ) !== false || preg_match( '/^\d{8}$/', $val );
					try {
						if ( $isDate ) { $dt = new DateTime( substr( $val, 0, 8 ), $tz ); if ( $prop === 'DTEND' ) { $dt->modify( '-1 day' ); } }  // DTEND is exclusive for all-day
						elseif ( substr( $val, -1 ) === 'Z' ) { $dt = new DateTime( $val, new DateTimeZone( 'UTC' ) ); $dt->setTimezone( $tz ); }
						else { $ptz = preg_match( '/TZID=([^;:]+)/', $params, $t ) ? $t[1] : null; try { $z = $ptz ? new DateTimeZone( $ptz ) : $tz; } catch ( Exception $e ) { $z = $tz; } $dt = new DateTime( $val, $z ); $dt->setTimezone( $tz ); }
						$ev[ $prop === 'DTSTART' ? 'start' : 'end' ] = $dt->format( 'Y-m-d' );
						if ( $isDate ) { $ev['allday'] = true; }
					} catch ( Exception $e ) {}
					break;
				case 'ATTENDEE':
					if ( ! preg_match( '/mailto:([^\s]+)/i', $val, $mm ) ) { break; }
					$email = strtolower( trim( $mm[1] ) );
					if ( ! is_email( $email ) ) { break; }
					if ( preg_match( '/CUTYPE=(RESOURCE|ROOM)/i', $params ) ) { break; }
					if ( preg_match( '/PARTSTAT=DECLINED/i', $params ) ) { break; }
					if ( aa_sv_skip_email( $email ) ) { break; }
					$cn = preg_match( '/CN="?([^";]*)"?/', $params, $c ) ? $c[1] : '';
					$ev['attendees'][ $email ] = aa_sv_split_name( $cn, $email );
					break;
			}
		}
		if ( $ev['end'] === '' ) { $ev['end'] = $ev['start']; }
		if ( $ev['start'] !== '' ) { $events[] = $ev; }
	}
	return $events;
}

/** Read the calendar, group class events into deliveries, create what is new. Returns a note for the admin page. */
function aa_sv_calendar_sync() {
	$set = aa_sv_settings();
	if ( $set['ics_url'] === '' ) { return 'No calendar address set.'; }
	$res = wp_remote_get( $set['ics_url'], array( 'timeout' => 30, 'user-agent' => 'AgileAgilist-Survey/1.0' ) );
	if ( is_wp_error( $res ) ) { aa_sv_set( 'last_sync_note', 'Fetch failed: ' . $res->get_error_message() ); return 'Fetch failed: ' . $res->get_error_message(); }
	$code = (int) wp_remote_retrieve_response_code( $res );
	$body = wp_remote_retrieve_body( $res );
	if ( $code !== 200 || strpos( $body, 'BEGIN:VCALENDAR' ) === false ) { $n = 'Calendar returned HTTP ' . $code . ' (not an iCal feed). Check the secret address.'; aa_sv_set( 'last_sync_note', $n ); return $n; }
	$events = aa_sv_parse_ics( $body );
	$today  = aa_sv_today();
	$since  = $set['since'] ?: aa_sv_date_add( $today, -30 );
	$horizon = aa_sv_date_add( $today, 60 );
	$classes = array();
	foreach ( $events as $ev ) {
		if ( $ev['status'] === 'CANCELLED' || $ev['rrule'] !== '' ) { continue; }
		if ( $ev['end'] < $since || $ev['start'] > $horizon ) { continue; }
		$slug = aa_sv_match_class( $ev['summary'] );
		if ( $slug === '' || ! $ev['attendees'] || aa_sv_not_a_class( $ev['summary'] ) ) { continue; }
		$classes[] = array_merge( $ev, array( 'class' => $slug ) );
	}
	usort( $classes, function ( $a, $b ) { return strcmp( $a['start'], $b['start'] ); } );
	/* Cluster: same class, within a week, sharing at least one attendee (a 3-day RTE is often three events, or one). */
	$clusters = array();
	foreach ( $classes as $ev ) {
		$placed = false;
		foreach ( $clusters as &$cl ) {
			if ( $cl['class'] !== $ev['class'] ) { continue; }
			if ( $ev['start'] > aa_sv_date_add( $cl['end'], 7 ) ) { continue; }
			if ( ! array_intersect_key( $cl['people'], $ev['attendees'] ) ) { continue; }
			$cl['end'] = max( $cl['end'], $ev['end'] ); $cl['start'] = min( $cl['start'], $ev['start'] );
			$cl['people'] += $ev['attendees']; $cl['uids'][] = $ev['uid']; $cl['titles'][] = $ev['summary'];
			$placed = true; break;
		}
		unset( $cl );
		if ( ! $placed ) { $clusters[] = array( 'class' => $ev['class'], 'start' => $ev['start'], 'end' => $ev['end'], 'people' => $ev['attendees'], 'uids' => array( $ev['uid'] ), 'titles' => array( $ev['summary'] ) ); }
	}
	$existing = aa_sv_deliveries(); $new = 0; $updated = 0;
	foreach ( $clusters as $cl ) {
		$key = 'cal-' . $cl['class'] . '-' . $cl['start'];
		if ( isset( $existing[ $key ] ) ) {
			$del = $existing[ $key ];
			if ( $del['status'] === 'pending' ) {   // still refresh attendees and dates until it goes out
				$del['people'] = $cl['people']; $del['end'] = $cl['end']; $del['send_at'] = aa_sv_date_add( $cl['end'], (int) $set['days_after'] ); $del['uids'] = $cl['uids'];
				aa_sv_delivery_save( $del ); $updated++;
			} elseif ( $del['status'] === 'sent' ) {  // late additions to the invite still get their email
				$added = array_diff_key( $cl['people'], $del['people'] );
				if ( $added ) { $del['people'] += $added; aa_sv_delivery_save( $del ); aa_sv_delivery_send( $key ); }
			}
			continue;
		}
		$del = array( 'key' => $key, 'class' => $cl['class'], 'org' => aa_sv_org_for( $cl['people'] ), 'start' => $cl['start'], 'end' => $cl['end'], 'source' => 'calendar',
			'title' => $cl['titles'][0], 'sessions' => array(), 'people' => $cl['people'], 'status' => 'pending', 'send_at' => aa_sv_date_add( $cl['end'], (int) $set['days_after'] ), 'sent_at' => '', 'uids' => $cl['uids'], 'lang' => 'en', 'created' => current_time( 'mysql' ) );
		aa_sv_delivery_save( $del ); $new++;
	}
	$note = sprintf( '%s · %d events, %d class deliveries (%d new, %d refreshed).', current_time( 'M j H:i' ), count( $events ), count( $clusters ), $new, $updated );
	aa_sv_set( 'last_sync', current_time( 'mysql' ) ); aa_sv_set( 'last_sync_note', $note );
	return $note;
}

/* ============================================================================
   SENDING
   ========================================================================== */

/** Send the survey email to everyone in a delivery who has not had it. Returns the number sent. */
function aa_sv_delivery_send( $key ) {
	$del = aa_sv_delivery( $key );
	if ( ! $del ) { return 0; }
	$n = 0;
	foreach ( $del['people'] as $email => $name ) {
		$tok = aa_sv_recipient_for( $email, $name[0], isset( $name[1] ) ? $name[1] : '', $del['class'], $key, $del['lang'] );
		$rec = aa_sv_recipient( $tok );
		if ( $rec['sent'] || $rec['stopped'] ) { continue; }
		if ( aa_sv_send_email( $rec, false ) ) { aa_sv_recipient_update( $tok, array( 'sent' => current_time( 'mysql' ) ) ); $n++; }
	}
	$del['status'] = 'sent'; $del['sent_at'] = $del['sent_at'] ?: current_time( 'mysql' );
	aa_sv_delivery_save( $del );
	if ( $n ) {
		$set = aa_sv_settings();
		wp_mail( $set['notify'], 'Survey sent — ' . aa_sv_delivery_label( $del ) . ' (' . $n . ')', "The follow-up survey went to " . $n . " attendee(s) of " . aa_sv_delivery_label( $del ) . ".\n\nResults: " . aa_sv_results_url( $key ) . "\nSettings: " . admin_url( 'options-general.php?page=aa-surveys' ) . "\n" );
	}
	return $n;
}

/** One reminder to those who have not answered. */
function aa_sv_delivery_remind( $key ) {
	$del = aa_sv_delivery( $key ); if ( ! $del ) { return 0; }
	$answered = aa_sv_answered_emails( $del['class'], $key ); $n = 0;
	foreach ( aa_sv_recipients() as $tok => $p ) {
		if ( $p['delivery'] !== $key || ! $p['sent'] || $p['reminded'] || $p['stopped'] || ! empty( $p['test'] ) ) { continue; }
		if ( isset( $answered[ $p['email'] ] ) ) { continue; }
		if ( aa_sv_send_email( array_merge( array( 'token' => $tok ), $p ), true ) ) { aa_sv_recipient_update( $tok, array( 'reminded' => current_time( 'mysql' ) ) ); $n++; }
	}
	return $n;
}

function aa_sv_send_email( $rec, $reminder = false ) {
	$mail = aa_sv_email( $rec, $reminder );
	if ( ! $mail ) { return false; }
	$html = function () { return 'text/html'; };
	add_filter( 'wp_mail_content_type', $html );
	$ok = wp_mail( $rec['email'], $mail['subject'], $mail['html'], array( 'Reply-To: ' . aa_sv_settings()['notify'] ) );
	remove_filter( 'wp_mail_content_type', $html );
	return (bool) $ok;
}

/** Subject + HTML for a recipient. Bilingual, English first. */
function aa_sv_email( $rec, $reminder = false ) {
	$del = aa_sv_delivery( $rec['delivery'] );
	$s   = aa_sv_survey( $rec['class'], $del );
	if ( ! $s ) { return null; }
	$name  = $s['name']; $first = $rec['first'] ?: '';
	$url   = aa_sv_survey_url( array( 'r' => $rec['token'] ) );
	$urlfr = aa_sv_survey_url( array( 'r' => $rec['token'], 'lang' => 'fr' ) );
	$stop  = aa_sv_survey_url( array( 'r' => $rec['token'], 'stop' => 1 ) );
	$org   = $del && $del['org'] ? $del['org'] : '';
	$e = function ( $x ) { return esc_html( $x ); };
	$pips = function ( $lang ) use ( $url, $urlfr ) {
		$h = '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px 0 4px"><tr>';
		for ( $i = 1; $i <= 5; $i++ ) { $h .= '<td style="padding:0 6px 0 0"><a href="' . esc_url( add_query_arg( 'q1', $i, $lang === 'fr' ? $urlfr : $url ) ) . '" style="display:block;width:44px;height:44px;line-height:44px;text-align:center;border:1.5px solid #BFD9D5;border-radius:10px;color:#0E3A44;font-weight:700;font-size:17px;text-decoration:none;background:#ffffff">' . $i . '</a></td>'; }
		return $h . '</tr></table>';
	};
	$card = 'background:#F3FAFA;border:1px solid #CDE6E6;border-radius:8px;padding:14px 16px;';
	$lbl  = 'margin:0 0 6px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#127E88;font-weight:700;';
	$btn  = 'display:inline-block;background:#127E88;color:#ffffff;font-weight:700;font-size:15px;text-decoration:none;padding:13px 24px;border-radius:100px;';
	$subject = $reminder
		? sprintf( 'A reminder: two minutes on your %s class / Un rappel : deux minutes sur votre formation %s', $name[0], $name[1] )
		: sprintf( 'Your %s class: two minutes for your feedback / Votre formation %s : deux minutes pour votre avis', $name[0], $name[1] );
	$pre = $reminder ? 'Still two minutes, and it shapes what we offer you next.' : 'Five quick questions about your class, and what you would like next.';

	$en  = '<p style="margin:0 0 14px;font-size:16px;line-height:1.55;">Hi ' . $e( $first ) . ',</p>';
	$en .= $reminder
		? '<p style="margin:0 0 14px;font-size:15.5px;line-height:1.6;">A short reminder, in case our last email slipped by. We would still like to know whether the ' . $e( $name[0] ) . ' class is something you can use, and what would help you most next. Two minutes, five questions.</p>'
		: '<p style="margin:0 0 14px;font-size:15.5px;line-height:1.6;">Thank you for joining the ' . $e( $name[0] ) . ' class with us. Now that you are back at work, we would like to know two things: whether what we covered is something you can actually use, and what would help you most next.</p>';
	$en .= '<p style="margin:0 0 6px;font-size:15.5px;line-height:1.6;"><strong>Start with one click.</strong> How confident are you about using what you learned over the next three months? 1 = not at all, 5 = very confident.</p>' . $pips( 'en' );
	$en .= '<p style="margin:0 0 18px;font-size:13px;color:#5E7378;">Your choice opens the rest of the survey, four more questions.</p>';
	$en .= '<p style="margin:0 0 18px;"><a href="' . esc_url( $url ) . '" style="' . $btn . '">Answer in two minutes ⟶</a></p>';
	$en .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#0E3A44;border-radius:8px;padding:16px 16px 18px;color:#ffffff;">'
	     . '<p style="' . $lbl . 'color:#8FCFCF;">Free 30-minute consultation</p>'
	     . '<p style="margin:0 0 8px;font-size:15px;line-height:1.5;font-weight:600;color:#ffffff;">Would a one-to-one conversation help?</p>'
	     . '<p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:#BFE1E1;">About your team or program: where SAFe would help first, what to try in the next quarter, and which training, if any, makes sense for whom. No sales pitch.</p>'
	     . '<a href="' . esc_url( $s['book'] ) . '" style="display:inline-block;background:#8FCFCF;color:#0E3A44;font-weight:700;font-size:14px;text-decoration:none;padding:11px 20px;border-radius:100px;">Book a time ⟶</a></td></tr></table>';
	$en .= '<p style="margin:18px 0 0;font-size:14.5px;line-height:1.6;color:#3C565E;">Prefer to write? Just reply to this email. And if you have not yet taken the certification exam, tell us: we will send our exam prep notes and a study plan.</p>';
	$en .= '<p style="margin:14px 0 0;font-size:15.5px;line-height:1.5;"><strong>Agile Agilist Learning and Development Team</strong><br><span style="color:#5E7378;font-size:14px;">info@agile-agilist.com · +1 647 999 7433</span></p>';

	$fr  = '<p style="margin:0 0 14px;font-size:16px;line-height:1.55;">Bonjour ' . $e( $first ) . ',</p>';
	$fr .= $reminder
		? '<p style="margin:0 0 14px;font-size:15.5px;line-height:1.6;">Un court rappel, au cas où notre dernier courriel vous aurait échappé. Nous aimerions toujours savoir si la formation ' . $e( $name[1] ) . ' est applicable dans votre contexte, et ce qui vous aiderait le plus pour la suite. Deux minutes, cinq questions.</p>'
		: '<p style="margin:0 0 14px;font-size:15.5px;line-height:1.6;">Merci d’avoir suivi la formation ' . $e( $name[1] ) . ' avec nous. Maintenant que vous êtes de retour au travail, nous aimerions savoir deux choses : si ce que nous avons vu est réellement applicable dans votre contexte, et ce qui vous aiderait le plus pour la suite.</p>';
	$fr .= '<p style="margin:0 0 6px;font-size:15.5px;line-height:1.6;"><strong>Commencez en un clic.</strong> À quel point vous sentez-vous en mesure d’appliquer ce que vous avez appris au cours des trois prochains mois? 1 = pas du tout, 5 = tout à fait.</p>' . $pips( 'fr' );
	$fr .= '<p style="margin:0 0 18px;font-size:13px;color:#5E7378;">Votre choix ouvre la suite du sondage, quatre autres questions.</p>';
	$fr .= '<p style="margin:0 0 18px;"><a href="' . esc_url( $urlfr ) . '" style="' . $btn . '">Répondre en deux minutes ⟶</a></p>';
	$fr .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#0E3A44;border-radius:8px;padding:16px 16px 18px;color:#ffffff;">'
	     . '<p style="' . $lbl . 'color:#8FCFCF;">Consultation gratuite de 30 minutes</p>'
	     . '<p style="margin:0 0 8px;font-size:15px;line-height:1.5;font-weight:600;color:#ffffff;">Un échange individuel vous aiderait-il?</p>'
	     . '<p style="margin:0 0 14px;font-size:14px;line-height:1.55;color:#BFE1E1;">Sur votre équipe ou votre programme : où SAFe aiderait en premier, quoi essayer au prochain trimestre, et quelle formation, s’il y a lieu, convient à qui. Sans argumentaire de vente.</p>'
	     . '<a href="' . esc_url( $s['book'] ) . '" style="display:inline-block;background:#8FCFCF;color:#0E3A44;font-weight:700;font-size:14px;text-decoration:none;padding:11px 20px;border-radius:100px;">Réserver un moment ⟶</a></td></tr></table>';
	$fr .= '<p style="margin:18px 0 0;font-size:14.5px;line-height:1.6;color:#3C565E;">Vous préférez écrire? Répondez simplement à ce courriel. Et si vous n’avez pas encore passé l’examen de certification, dites-le-nous : nous vous enverrons nos notes de préparation et un plan d’étude.</p>';
	$fr .= '<p style="margin:14px 0 22px;font-size:15.5px;line-height:1.5;"><strong>Équipe Apprentissage et développement, Agile Agilist</strong><br><span style="color:#5E7378;font-size:14px;">info@agile-agilist.com · +1 647 999 7433</span></p>';

	$html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . $e( $subject ) . '</title></head>'
	 . '<body style="margin:0;padding:0;background:#F4F8F8;"><div style="display:none;max-height:0;overflow:hidden;color:#F4F8F8;">' . $e( $pre ) . '</div>'
	 . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F8F8;"><tr><td align="center" style="padding:24px 12px;">'
	 . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #DCEAEA;border-radius:10px;font-family:-apple-system,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;color:#0E3A44;">'
	 . '<tr><td style="padding:22px 28px 18px;border-bottom:3px solid #127E88;"><span style="font-size:19px;font-weight:800;letter-spacing:.01em;color:#0E3A44;">Agile Agilist</span>'
	 . '<span style="display:block;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#88A0A4;margin-top:4px;">' . $e( $name[0] . ( $org ? ' · ' . $org : '' ) ) . '</span></td></tr>'
	 . '<tr><td style="padding:26px 28px 8px;">' . $en . '</td></tr>'
	 . '<tr><td style="padding:22px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid #DCEAEA;"></td><td style="padding:0 12px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#88A0A4;white-space:nowrap;">Version française</td><td style="border-top:1px solid #DCEAEA;"></td></tr></table></td></tr>'
	 . '<tr><td style="padding:22px 28px 8px;" lang="fr">' . $fr . '</td></tr>'
	 . '<tr><td style="padding:16px 28px 20px;border-top:1px solid #DCEAEA;font-size:12px;line-height:1.6;color:#88A0A4;">Agile Agilist · SAFe® Platinum Partner · <a href="https://agile-agilist.com/training/" style="color:#127E88;text-decoration:none;">agile-agilist.com/training</a> · info@agile-agilist.com · +1 647 999 7433<br>'
	 . 'You are receiving this because you attended a ' . $e( $name[0] ) . ' class delivered by Agile Agilist. <a href="' . esc_url( $stop ) . '" style="color:#88A0A4;">No more emails about this class</a>. / Vous recevez ce courriel parce que vous avez suivi une formation ' . $e( $name[1] ) . ' donnée par Agile Agilist. <a href="' . esc_url( $stop ) . '" style="color:#88A0A4;">Plus de courriels à ce sujet</a>.</td></tr>'
	 . '</table></td></tr></table></body></html>';
	return array( 'subject' => $subject, 'html' => $html );
}

/* ============================================================================
   DAILY RUN
   ========================================================================== */

function aa_sv_daily() {
	$set = aa_sv_settings();
	if ( ! $set['enabled'] ) { return; }
	if ( $set['ics_url'] !== '' ) { aa_sv_calendar_sync(); }
	$today = aa_sv_today();
	foreach ( aa_sv_deliveries() as $key => $del ) {
		if ( $del['status'] === 'pending' && $del['send_at'] <= $today && $del['end'] >= $set['since'] ) { aa_sv_delivery_send( $key ); }
		elseif ( $del['status'] === 'sent' && (int) $set['reminder_days'] > 0 && empty( $del['reminded_at'] ) && $del['sent_at'] && substr( $del['sent_at'], 0, 10 ) <= aa_sv_date_add( $today, -(int) $set['reminder_days'] ) ) {
			aa_sv_delivery_remind( $key ); $del['reminded_at'] = current_time( 'mysql' ); aa_sv_delivery_save( $del );
		}
	}
	aa_sv_hubspot_retry();
}
add_action( 'aa_sv_daily_event', 'aa_sv_daily' );
add_action( 'init', function () {
	if ( ! wp_next_scheduled( 'aa_sv_daily_event' ) ) {
		$at = new DateTime( 'tomorrow 09:10', wp_timezone() );   // a quiet hour, local time
		wp_schedule_event( $at->getTimestamp(), 'daily', 'aa_sv_daily_event' );
	}
} );

/* ============================================================================
   PAGE  [aa_survey]
   ========================================================================== */

function aa_sv_lang() {
	if ( isset( $_GET['lang'] ) && in_array( $_GET['lang'], array( 'en', 'fr' ), true ) ) { return $_GET['lang']; } // phpcs:ignore
	return 'en';
}
function aa_sv_page_has_survey() {
	static $has = null;
	if ( $has !== null ) { return $has; }
	$has = false;
	if ( is_singular() ) { $p = get_post(); $has = $p && strpos( (string) $p->post_content, '[aa_survey' ) !== false; }
	return $has;
}
add_action( 'template_redirect', function () {
	if ( is_admin() || ! aa_sv_page_has_survey() ) { return; }
	foreach ( array( 'DONOTCACHEPAGE', 'DONOTCACHEOBJECT', 'DONOTCACHEDB' ) as $f ) { if ( ! defined( $f ) ) { define( $f, true ); } }
	nocache_headers();
	header( 'X-Cache-Enabled: False' );
	/* The stop link in every email. */
	if ( isset( $_GET['stop'], $_GET['r'] ) ) { // phpcs:ignore
		$rec = aa_sv_recipient( sanitize_text_field( wp_unslash( $_GET['r'] ) ) ); // phpcs:ignore
		if ( $rec ) { aa_sv_recipient_update( $rec['token'], array( 'stopped' => 1 ) ); }
	}
}, 0 );
add_filter( 'wp_robots', function ( $r ) { if ( aa_sv_page_has_survey() ) { $r['noindex'] = true; $r['nofollow'] = true; } return $r; } );

function aa_sv_render( $atts ) {
	$atts = shortcode_atts( array( 'class' => '' ), $atts, 'aa_survey' );
	$lang = aa_sv_lang(); $L = $lang === 'fr' ? 1 : 0;
	$tok  = isset( $_GET['r'] ) ? sanitize_text_field( wp_unslash( $_GET['r'] ) ) : ''; // phpcs:ignore
	$who  = $tok ? aa_sv_recipient( $tok ) : null;
	$del  = $who ? aa_sv_delivery( $who['delivery'] ) : null;
	$slug = $who ? $who['class'] : ( isset( $_GET['c'] ) ? sanitize_key( $_GET['c'] ) : sanitize_key( $atts['class'] ) ); // phpcs:ignore
	$s    = $slug ? aa_sv_survey( $slug, $del ) : null;
	$h    = aa_sv_assets();
	if ( isset( $_GET['stop'] ) && $who ) { // phpcs:ignore
		return $h . '<div class="aa-sv"><div class="aa-sv__done"><h2>' . ( $L ? 'C’est noté.' : 'Done.' ) . '</h2><p>' . ( $L ? 'Vous ne recevrez plus de courriels au sujet de cette formation.' : 'You will not receive further emails about this class.' ) . '</p></div></div>';
	}
	if ( ! $s ) {
		return $h . '<div class="aa-sv"><div class="aa-sv__done"><h2>' . ( $L ? 'Votre lien personnel' : 'Your personal link' ) . '</h2><p>' . ( $L ? 'Ce sondage s’ouvre à partir du lien que nous vous avons envoyé par courriel. Si vous ne le retrouvez pas, écrivez-nous : info@agile-agilist.com.' : 'This survey opens from the link we emailed you. If you cannot find it, write to info@agile-agilist.com and we will send it again.' ) . '</p></div></div>';
	}
	$pre = array();
	foreach ( $s['questions'] as $qid => $q ) { if ( $q['type'] === 'scale' && isset( $_GET[ $qid ] ) ) { $pre[ $qid ] = max( 1, min( 5, (int) $_GET[ $qid ] ) ); } } // phpcs:ignore
	$other = add_query_arg( array( 'lang' => $L ? 'en' : 'fr' ) );
	$t = function ( $pair ) use ( $L ) { return is_array( $pair ) ? $pair[ $L ] : (string) $pair; };
	$str = $L ? array(
		'lang_switch' => 'English', 'hello' => 'Bonjour %s,', 'required' => 'obligatoire', 'optional' => 'facultatif',
		'name' => 'Votre nom', 'email' => 'Votre courriel professionnel', 'send' => 'Envoyer mes réponses', 'sending' => 'Envoi…',
		'missing' => 'Il manque une réponse : %s', 'failed' => 'Nous n’avons pas pu enregistrer vos réponses. Réessayez, ou répondez simplement au courriel.',
		'privacy' => 'Vos réponses servent uniquement à préparer la suite de votre formation. Elles ne sont pas partagées.',
		'reply' => 'Vous préférez écrire? Répondez simplement au courriel que nous vous avons envoyé.',
		'book' => 'Ou réservez directement un moment dans notre calendrier ⟶',
	) : array(
		'lang_switch' => 'Français', 'hello' => 'Hi %s,', 'required' => 'required', 'optional' => 'optional',
		'name' => 'Your name', 'email' => 'Your work email', 'send' => 'Send my answers', 'sending' => 'Sending…',
		'missing' => 'One answer is missing: %s', 'failed' => 'We could not save your answers. Please try again, or simply reply to our email.',
		'privacy' => 'Your answers are used only to plan what comes next for your training. They are not shared.',
		'reply' => 'Prefer to write? Just reply to the email we sent you.',
		'book' => 'Or pick a time in our calendar directly ⟶',
	);
	$kicker = ( $del && $del['org'] ? $del['org'] . ' · ' : '' ) . $s['code'];
	$h .= '<div class="aa-sv" lang="' . ( $L ? 'fr' : 'en' ) . '" data-aa-sv="' . esc_attr( $s['id'] ) . '" data-token="' . esc_attr( $who ? $tok : '' ) . '" data-lang="' . ( $L ? 'fr' : 'en' ) . '" data-endpoint="' . esc_url( rest_url( 'aa/v1/survey' ) ) . '">';
	$h .= '<div class="aa-sv__top"><div><p class="aa-sv__kicker">' . esc_html( $kicker ) . '</p><h1 class="aa-sv__h1">' . esc_html( $t( $s['title'] ) ) . '</h1></div>'
	    . '<a class="aa-sv__lang" href="' . esc_url( $other ) . '" hreflang="' . ( $L ? 'en' : 'fr' ) . '">' . esc_html( $str['lang_switch'] ) . '</a></div>';
	$h .= '<form class="aa-sv__form" novalidate>';
	if ( $who && $who['first'] ) { $h .= '<p class="aa-sv__hello">' . esc_html( sprintf( $str['hello'], $who['first'] ) ) . '</p>'; }
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
			for ( $i = 1; $i <= 5; $i++ ) { $h .= '<label class="aa-sv__pip"><input type="radio" name="' . esc_attr( $qid ) . '" value="' . $i . '"' . ( isset( $pre[ $qid ] ) && $pre[ $qid ] === $i ? ' checked' : '' ) . '><span>' . $i . '</span></label>'; }
			$h .= '</div><div class="aa-sv__ends"><span>1 · ' . esc_html( $t( $q['low'] ) ) . '</span><span>5 · ' . esc_html( $t( $q['high'] ) ) . '</span></div>';
		} elseif ( $type === 'radio' || $type === 'multi' ) {
			$h .= '<div class="aa-sv__opts">';
			foreach ( $q['options'] as $val => $pair ) {
				$h .= '<label class="aa-sv__opt"><input type="' . ( $type === 'radio' ? 'radio' : 'checkbox' ) . '" name="' . esc_attr( $qid ) . ( $type === 'multi' ? '[]' : '' ) . '" value="' . esc_attr( $val ) . '"><span class="aa-sv__tick" aria-hidden="true"></span><span>' . esc_html( $t( $pair ) ) . '</span></label>';
			}
			$h .= '</div>';
			if ( $qid === 'q5' && ! empty( $s['book'] ) ) { $h .= '<p class="aa-sv__hint" style="margin-top:12px"><a class="aa-sv__link" href="' . esc_url( $s['book'] ) . '">' . esc_html( $str['book'] ) . '</a></p>'; }
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
	    . ( ! empty( $s['book'] ) ? '<p>' . esc_html( $t( $s['thanks'][1] ) ) . '</p><p><a class="aa-sv__send aa-sv__send--link" href="' . esc_url( $s['book'] ) . '">' . esc_html( $t( $s['thanks'][2] ) ) . ' ⟶</a></p>' : '' ) . '</div>';
	$h .= '<script type="application/json" class="aa-sv-strings">' . wp_json_encode( array( 'missing' => $str['missing'], 'failed' => $str['failed'] ) ) . '</script>';
	return $h . '</div>';
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
    var form=root.querySelector('.aa-sv__form');if(!form)return;
    var done=root.querySelector('.aa-sv__done'),alertEl=root.querySelector('.aa-sv__alert'),btn=root.querySelector('.aa-sv__send'),
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

function aa_sv_statuses() { return array( 'private', 'publish', 'draft' ); }

add_action( 'init', function () {
	register_post_type( 'aa_survey_response', array(
		'label' => 'Survey responses', 'public' => false, 'show_ui' => true, 'show_in_menu' => true,
		'menu_icon' => 'dashicons-feedback', 'supports' => array( 'title' ), 'capability_type' => 'post',
		'map_meta_cap' => true, 'show_in_rest' => false,
	) );
} );
add_action( 'rest_api_init', function () {
	register_rest_route( 'aa/v1', '/survey', array( 'methods' => 'POST', 'permission_callback' => '__return_true', 'callback' => 'aa_sv_submit' ) );
} );

function aa_sv_submit( $req ) {
	$d = (array) $req->get_json_params();
	if ( ! empty( $d['website'] ) ) { return new WP_Error( 'aa_sv_spam', 'Thank you.', array( 'status' => 200 ) ); }
	$ip  = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	$key = 'aa_sv_rl_' . md5( $ip );
	$n   = (int) get_transient( $key );
	if ( $n >= 10 ) { return new WP_Error( 'aa_sv_rate', 'Too many submissions. Please try again later.', array( 'status' => 429 ) ); }
	set_transient( $key, $n + 1, HOUR_IN_SECONDS );

	$tok = isset( $d['token'] ) ? sanitize_text_field( $d['token'] ) : '';
	$who = $tok ? aa_sv_recipient( $tok ) : null;
	$del = $who ? aa_sv_delivery( $who['delivery'] ) : null;
	$sid = $who ? $who['class'] : ( isset( $d['survey'] ) ? sanitize_key( $d['survey'] ) : '' );
	$s   = $sid ? aa_sv_survey( $sid, $del ) : null;
	if ( ! $s ) { return new WP_Error( 'aa_sv_unknown', 'Unknown survey.', array( 'status' => 400 ) ); }
	$ans  = isset( $d['answers'] ) && is_array( $d['answers'] ) ? $d['answers'] : array();
	$lang = isset( $d['lang'] ) && $d['lang'] === 'fr' ? 'fr' : 'en';
	if ( $who ) { $email = $who['email']; $name = trim( $who['first'] . ' ' . $who['last'] ); }
	else {
		$email = isset( $ans['email'] ) ? sanitize_email( $ans['email'] ) : '';
		$name  = isset( $ans['name'] ) ? sanitize_text_field( $ans['name'] ) : '';
		if ( ! is_email( $email ) ) { return new WP_Error( 'aa_sv_email', 'Please enter a valid email address.', array( 'status' => 400 ) ); }
	}
	$clean = array();
	foreach ( $s['questions'] as $qid => $q ) {
		$v = isset( $ans[ $qid ] ) ? $ans[ $qid ] : '';
		switch ( $q['type'] ) {
			case 'scale': $v = (int) $v; $v = ( $v >= 1 && $v <= 5 ) ? $v : 0; break;
			case 'radio': $v = is_string( $v ) && isset( $q['options'][ $v ] ) ? $v : ''; break;
			case 'multi': $v = array_values( array_filter( array_unique( (array) $v ), function ( $x ) use ( $q ) { return is_string( $x ) && isset( $q['options'][ $x ] ); } ) ); break;
			default:      $v = mb_substr( sanitize_textarea_field( (string) $v ), 0, 1000 );
		}
		if ( ! empty( $q['required'] ) && ( $v === '' || $v === 0 || $v === array() ) ) { return new WP_Error( 'aa_sv_missing', 'A required answer is missing.', array( 'status' => 400 ) ); }
		$clean[ $qid ] = $v;
	}
	$dkey = $who ? $who['delivery'] : '';
	$existing = get_posts( array( 'post_type' => 'aa_survey_response', 'post_status' => aa_sv_statuses(), 'posts_per_page' => 1, 'fields' => 'ids', 'no_found_rows' => true,
		'meta_query' => array( 'relation' => 'AND', array( 'key' => 'survey', 'value' => $sid ), array( 'key' => 'email', 'value' => $email ), array( 'key' => 'delivery', 'value' => $dkey ) ) ) );
	$post_id = $existing ? (int) $existing[0] : 0;
	$args = array( 'post_type' => 'aa_survey_response', 'post_status' => 'private', 'post_title' => $name . ' — ' . ( $del ? aa_sv_delivery_label( $del ) : $s['name'][0] ),
		'meta_input' => array( 'survey' => $sid, 'delivery' => $dkey, 'org' => $del ? $del['org'] : '', 'email' => $email, 'name' => $name, 'lang' => $lang, 'token' => $who ? $tok : '',
			'answers' => $clean, 'submitted_at' => current_time( 'mysql' ), 'ip_hash' => $ip ? substr( md5( $ip . wp_salt() ), 0, 12 ) : '', 'hs_synced' => 0, 'test' => $who && ! empty( $who['test'] ) ? 1 : 0 ) );
	if ( $post_id ) { $args['ID'] = $post_id; $post_id = wp_update_post( $args ); } else { $post_id = wp_insert_post( $args ); }
	if ( ! $post_id || is_wp_error( $post_id ) ) { return new WP_Error( 'aa_sv_store', 'Could not save.', array( 'status' => 500 ) ); }
	aa_sv_notify( $s, $post_id, $name, $email, $clean, $lang, $del );
	if ( ! ( $who && ! empty( $who['test'] ) ) ) { aa_sv_hubspot_sync( $post_id ); }
	return array( 'ok' => true );
}

function aa_sv_answer_text( $s, $qid, $v, $L = 0 ) {
	if ( ! isset( $s['questions'][ $qid ] ) ) { return ''; }
	$q = $s['questions'][ $qid ];
	if ( $q['type'] === 'scale' ) { return $v ? $v . ' / 5' : ''; }
	if ( $q['type'] === 'radio' ) { return $v !== '' && isset( $q['options'][ $v ] ) ? $q['options'][ $v ][ $L ] : ''; }
	if ( $q['type'] === 'multi' ) { $o = array(); foreach ( (array) $v as $x ) { if ( isset( $q['options'][ $x ] ) ) { $o[] = $q['options'][ $x ][ $L ]; } } return implode( '; ', $o ); }
	return (string) $v;
}

function aa_sv_notify( $s, $post_id, $name, $email, $clean, $lang, $del ) {
	$lines = array();
	foreach ( $s['questions'] as $qid => $q ) { $txt = aa_sv_answer_text( $s, $qid, $clean[ $qid ] ); if ( $txt !== '' ) { $lines[] = $q['label'][0] . "\n  " . $txt; } }
	$body = $name . ' <' . $email . '> answered the ' . $s['name'][0] . ' survey' . ( $del ? ' (' . aa_sv_delivery_label( $del ) . ')' : '' ) . ' in ' . strtoupper( $lang ) . ".\n\n" . implode( "\n\n", $lines )
	      . "\n\nAll answers: " . aa_sv_results_url( $del ? $del['key'] : '' ) . "\n";
	$consult = isset( $clean['q5'] ) && $clean['q5'] === 'yes';
	wp_mail( $s['notify'], ( $consult ? 'CONSULTATION REQUESTED — ' : 'Survey answer — ' ) . $name . ' (' . $s['code'] . ')', $body );
}

function aa_sv_responses( $class = '', $delivery = '' ) {
	$mq = array( array( 'key' => 'test', 'value' => '1', 'compare' => '!=' ) );
	if ( $class ) { $mq[] = array( 'key' => 'survey', 'value' => $class ); }
	if ( $delivery ) { $mq[] = array( 'key' => 'delivery', 'value' => $delivery ); }
	return get_posts( array( 'post_type' => 'aa_survey_response', 'post_status' => aa_sv_statuses(), 'posts_per_page' => 1000, 'orderby' => 'date', 'order' => 'DESC', 'meta_query' => $mq ) );
}
function aa_sv_answered_emails( $class, $delivery ) {
	$out = array();
	foreach ( aa_sv_responses( $class, $delivery ) as $p ) { $out[ strtolower( get_post_meta( $p->ID, 'email', true ) ) ] = 1; }
	return $out;
}
function aa_sv_results_url( $delivery = '' ) {
	$p = get_page_by_path( 'survey/results' );
	$url = $p ? get_permalink( $p->ID ) : admin_url( 'edit.php?post_type=aa_survey_response' );
	return $delivery && $p ? add_query_arg( 'd', $delivery, $url ) : $url;
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
function aa_sv_hs_prop( $sid, $qid ) { return 'aa_sv_' . str_replace( '-', '_', $sid ) . '_' . $qid; }
function aa_sv_hs_ensure_props( $sid, $s ) {
	if ( get_transient( 'aa_sv_hs_props_' . $sid ) ) { return true; }
	$have = aa_sv_hs( 'GET', '/crm/v3/properties/contacts?archived=false' );
	if ( is_wp_error( $have ) ) { return false; }
	$names = array();
	foreach ( (array) ( isset( $have['results'] ) ? $have['results'] : array() ) as $p ) { $names[ $p['name'] ] = true; }
	$want = array();
	foreach ( $s['questions'] as $qid => $q ) {
		$want[ aa_sv_hs_prop( $sid, $qid ) ] = array( 'label' => $s['name'][0] . ' — ' . $q['label'][0], 'type' => 'string', 'fieldType' => $q['type'] === 'text' ? 'textarea' : 'text', 'groupName' => 'contactinformation', 'description' => 'Answer collected by the Agile Agilist post-class survey (' . $sid . ' / ' . $qid . ').' );
	}
	$want[ aa_sv_hs_prop( $sid, 'date' ) ] = array( 'label' => $s['name'][0] . ' — survey answered on', 'type' => 'string', 'fieldType' => 'text', 'groupName' => 'contactinformation' );
	$want['aa_sv_last_class'] = array( 'label' => 'Agile Agilist — last class surveyed', 'type' => 'string', 'fieldType' => 'text', 'groupName' => 'contactinformation' );
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
	$del = aa_sv_delivery( (string) get_post_meta( $post_id, 'delivery', true ) );
	$s   = aa_sv_survey( $sid, $del );
	if ( ! $s ) { return false; }
	$email = (string) get_post_meta( $post_id, 'email', true );
	$name  = (string) get_post_meta( $post_id, 'name', true );
	$ans   = (array) get_post_meta( $post_id, 'answers', true );
	aa_sv_hs_ensure_props( $sid, $s );
	$props = array( aa_sv_hs_prop( $sid, 'date' ) => (string) get_post_meta( $post_id, 'submitted_at', true ), 'aa_sv_last_class' => $del ? aa_sv_delivery_label( $del ) : $s['name'][0] );
	foreach ( $s['questions'] as $qid => $q ) { $props[ aa_sv_hs_prop( $sid, $qid ) ] = aa_sv_answer_text( $s, $qid, isset( $ans[ $qid ] ) ? $ans[ $qid ] : '' ); }
	$r = aa_sv_hs( 'PATCH', '/crm/v3/objects/contacts/' . rawurlencode( $email ) . '?idProperty=email', array( 'properties' => $props ) );
	$status = is_wp_error( $r ) ? (array) $r->get_error_data() : array();
	if ( is_wp_error( $r ) && isset( $status['status'] ) && (int) $status['status'] === 404 ) {
		$parts = explode( ' ', $name, 2 );
		$r = aa_sv_hs( 'POST', '/crm/v3/objects/contacts', array( 'properties' => array_merge( $props, array( 'email' => $email, 'firstname' => $parts[0], 'lastname' => isset( $parts[1] ) ? $parts[1] : '' ) ) ) );
	}
	if ( is_wp_error( $r ) ) { update_post_meta( $post_id, 'hs_error', $r->get_error_message() ); return false; }
	$contact_id = isset( $r['id'] ) ? (string) $r['id'] : '';
	if ( $contact_id ) {
		$lines = array();
		foreach ( $s['questions'] as $qid => $q ) { $txt = aa_sv_answer_text( $s, $qid, isset( $ans[ $qid ] ) ? $ans[ $qid ] : '' ); if ( $txt !== '' ) { $lines[] = '<p><strong>' . esc_html( $q['label'][0] ) . '</strong><br>' . esc_html( $txt ) . '</p>'; } }
		aa_sv_hs( 'POST', '/crm/v3/objects/notes', array(
			'properties'   => array( 'hs_timestamp' => (string) ( time() * 1000 ), 'hs_note_body' => '<p><strong>Post-class survey: ' . esc_html( $s['name'][0] . ( $del ? ' · ' . aa_sv_delivery_label( $del ) : '' ) ) . '</strong></p>' . implode( '', $lines ) ),
			'associations' => array( array( 'to' => array( 'id' => $contact_id ), 'types' => array( array( 'associationCategory' => 'HUBSPOT_DEFINED', 'associationTypeId' => 202 ) ) ) ),
		) );
	}
	update_post_meta( $post_id, 'hs_synced', 1 ); update_post_meta( $post_id, 'hs_contact_id', $contact_id ); delete_post_meta( $post_id, 'hs_error' );
	return true;
}
function aa_sv_hubspot_retry() {
	if ( aa_sv_hs_token() === '' ) { return; }
	$ids = get_posts( array( 'post_type' => 'aa_survey_response', 'post_status' => aa_sv_statuses(), 'posts_per_page' => 50, 'fields' => 'ids', 'no_found_rows' => true,
		'meta_query' => array( array( 'key' => 'hs_synced', 'value' => '0' ), array( 'key' => 'test', 'value' => '1', 'compare' => '!=' ) ) ) );
	foreach ( $ids as $id ) { aa_sv_hubspot_sync( (int) $id ); }
}

/* ============================================================================
   ADMIN  Settings → Follow-up surveys
   ========================================================================== */

add_action( 'admin_menu', function () {
	add_options_page( 'Follow-up surveys', 'Follow-up surveys', 'manage_options', 'aa-surveys', 'aa_sv_admin_page' );
} );

function aa_sv_admin_page() {
	if ( ! current_user_can( 'manage_options' ) ) { return; }
	$set = aa_sv_settings(); $dels = aa_sv_deliveries(); $classes = aa_sv_classes();
	$notice = isset( $_GET['aa_sv_msg'] ) ? sanitize_text_field( wp_unslash( $_GET['aa_sv_msg'] ) ) : ''; // phpcs:ignore
	$act = admin_url( 'admin-post.php' );
	echo '<div class="wrap"><h1>Follow-up surveys</h1>';
	if ( $notice ) { echo '<div class="notice notice-success is-dismissible"><p>' . esc_html( $notice ) . '</p></div>'; }
	echo '<p>After each class, attendees from the <strong>learning@agile-agilist.com</strong> calendar get a personal survey link, with questions and next-class suggestions for the class they attended. Survey page: <a href="' . esc_url( aa_sv_survey_url() ) . '">' . esc_html( aa_sv_survey_url() ) . '</a> · Results: <a href="' . esc_url( aa_sv_results_url() ) . '">' . esc_html( aa_sv_results_url() ) . '</a></p>';
	echo '<p><strong>Calendar:</strong> ' . ( $set['ics_url'] ? 'connected' : '<span style="color:#B3261E">not connected</span>' ) . ( $set['last_sync_note'] ? ' · last read ' . esc_html( $set['last_sync_note'] ) : '' )
	   . ' · <strong>HubSpot:</strong> ' . ( aa_sv_hs_token() !== '' ? 'token set' : '<span style="color:#B3261E">no token</span> (answers are kept here and synced once it is set)' )
	   . ' · <strong>Next daily run:</strong> ' . ( wp_next_scheduled( 'aa_sv_daily_event' ) ? esc_html( get_date_from_gmt( gmdate( 'Y-m-d H:i:s', wp_next_scheduled( 'aa_sv_daily_event' ) ), 'M j, H:i' ) ) : '–' ) . '</p>';

	/* Settings */
	echo '<h2>Settings</h2><form method="post" action="' . esc_url( $act ) . '">' . wp_nonce_field( 'aa_sv_settings', '_wpnonce', true, false ) . '<input type="hidden" name="action" value="aa_sv_settings"><table class="form-table">';
	echo '<tr><th>Automatic sending</th><td><label><input type="checkbox" name="enabled" value="1"' . checked( $set['enabled'], 1, false ) . '> Read the calendar daily and send surveys when a class has ended</label></td></tr>';
	echo '<tr><th>Calendar address</th><td><input type="password" name="ics_url" value="' . esc_attr( $set['ics_url'] ) . '" class="large-text" autocomplete="off" placeholder="https://calendar.google.com/calendar/ical/…/private-…/basic.ics"><p class="description">In Google Calendar as learning@agile-agilist.com: Settings → the class calendar → <em>Secret address in iCal format</em>. Keep it private; it lists the invitees.</p></td></tr>';
	echo '<tr><th>Timing</th><td>Send <input type="number" name="days_after" min="0" max="30" value="' . (int) $set['days_after'] . '" style="width:60px"> days after the class ends · one reminder after <input type="number" name="reminder_days" min="0" max="30" value="' . (int) $set['reminder_days'] . '" style="width:60px"> days (0 = no reminder) · ignore classes that ended before <input type="date" name="since" value="' . esc_attr( $set['since'] ) . '"></td></tr>';
	echo '<tr><th>Answers go to</th><td><input type="email" name="notify" value="' . esc_attr( $set['notify'] ) . '" class="regular-text"> · consultation link <input type="url" name="book" value="' . esc_attr( $set['book'] ) . '" class="regular-text"></td></tr>';
	echo '<tr><th>Survey page ID</th><td><input type="number" name="page_id" value="' . (int) $set['page_id'] . '" style="width:90px"> <span class="description">0 = the page with slug <code>survey</code>. The page must contain <code>[aa_survey]</code>.</span></td></tr>';
	echo '<tr><th>Never email these domains</th><td><textarea name="skip_domains" rows="3" class="large-text">' . esc_textarea( $set['skip_domains'] ) . '</textarea></td></tr>';
	echo '<tr><th>Organisation names</th><td><textarea name="orgs" rows="3" class="large-text">' . esc_textarea( $set['orgs'] ) . '</textarea><p class="description">domain=Name, one per line. Shown on the survey header for that organisation’s attendees.</p></td></tr>';
	echo '<tr><th>HubSpot private app token</th><td><input type="password" name="aa_hubspot_token" value="' . esc_attr( get_option( 'aa_hubspot_token', '' ) ) . '" class="regular-text" autocomplete="off"><p class="description">HubSpot → Settings → Integrations → Private apps. Scopes: crm.objects.contacts.read, crm.objects.contacts.write, crm.schemas.contacts.write, crm.objects.notes.write. Ignored when wp-config.php defines AA_HUBSPOT_TOKEN.</p></td></tr>';
	echo '</table><p><button class="button button-primary">Save settings</button> ';
	echo '<a class="button" href="' . esc_url( wp_nonce_url( add_query_arg( 'action', 'aa_sv_sync', $act ), 'aa_sv_sync' ) ) . '">Read the calendar now</a> ';
	echo '<a class="button" href="' . esc_url( wp_nonce_url( add_query_arg( array( 'action' => 'aa_sv_test', 'class' => 'sa' ), $act ), 'aa_sv_test' ) ) . '">Email me a test (Leading SAFe)</a> ';
	echo '<a class="button" href="' . esc_url( wp_nonce_url( add_query_arg( array( 'action' => 'aa_sv_test', 'class' => 'rte' ), $act ), 'aa_sv_test' ) ) . '">Email me a test (RTE)</a></p></form>';

	/* Deliveries */
	echo '<h2>Classes</h2>';
	if ( ! $dels ) { echo '<p>Nothing yet. Connect the calendar, or add a class below.</p>'; }
	else {
		echo '<table class="widefat striped"><thead><tr><th>Class</th><th>Attendees</th><th>Status</th><th>Answered</th><th></th></tr></thead><tbody>';
		foreach ( $dels as $key => $d ) {
			$answered = count( aa_sv_answered_emails( $d['class'], $key ) );
			$sent = 0; foreach ( aa_sv_recipients() as $p ) { if ( $p['delivery'] === $key && $p['sent'] ) { $sent++; } }
			echo '<tr><td><strong>' . esc_html( aa_sv_delivery_label( $d ) ) . '</strong><br><span class="description">' . esc_html( $d['source'] === 'calendar' ? 'calendar: ' . $d['title'] : 'added by hand' ) . ( ! empty( $d['sessions'] ) ? ' · sessions: ' . esc_html( implode( ', ', $d['sessions'] ) ) : '' ) . '</span></td>';
			echo '<td>' . count( $d['people'] ) . '<br><span class="description" title="' . esc_attr( implode( ', ', array_keys( $d['people'] ) ) ) . '">' . esc_html( implode( ', ', array_slice( array_map( function ( $n ) { return trim( $n[0] . ' ' . $n[1] ); }, array_values( $d['people'] ) ), 0, 6 ) ) ) . ( count( $d['people'] ) > 6 ? '…' : '' ) . '</span></td>';
			echo '<td>' . ( $d['status'] === 'sent' ? 'sent ' . esc_html( substr( $d['sent_at'], 0, 10 ) ) . ' (' . $sent . ')' . ( ! empty( $d['reminded_at'] ) ? '<br>reminded ' . esc_html( substr( $d['reminded_at'], 0, 10 ) ) : '' ) : ( $d['status'] === 'skipped' ? 'skipped' : 'pending · sends ' . esc_html( $d['send_at'] ) ) ) . '</td>';
			echo '<td>' . $answered . ( $d['status'] === 'sent' ? ' <a href="' . esc_url( aa_sv_results_url( $key ) ) . '">results</a>' : '' ) . '</td><td style="white-space:nowrap">';
			if ( $d['status'] !== 'sent' ) { echo '<a class="button button-small" href="' . esc_url( wp_nonce_url( add_query_arg( array( 'action' => 'aa_sv_send', 'key' => $key ), $act ), 'aa_sv_send' ) ) . '" onclick="return confirm(\'Email the survey to ' . count( $d['people'] ) . ' attendees now?\')">Send now</a> '; }
			if ( $d['status'] === 'sent' ) { echo '<a class="button button-small" href="' . esc_url( wp_nonce_url( add_query_arg( array( 'action' => 'aa_sv_remind', 'key' => $key ), $act ), 'aa_sv_remind' ) ) . '" onclick="return confirm(\'Send one reminder to those who have not answered?\')">Remind</a> '; }
			if ( $d['status'] === 'pending' ) { echo '<a class="button button-small" href="' . esc_url( wp_nonce_url( add_query_arg( array( 'action' => 'aa_sv_skip', 'key' => $key ), $act ), 'aa_sv_skip' ) ) . '">Skip</a> '; }
			echo '<a class="button button-small" href="' . esc_url( wp_nonce_url( add_query_arg( array( 'action' => 'aa_sv_preview', 'key' => $key ), $act ), 'aa_sv_preview' ) ) . '" target="_blank">Preview email</a></td></tr>';
		}
		echo '</tbody></table>';
	}

	/* Manual delivery */
	echo '<h2>Add a class by hand</h2><p>For a class that is not on the calendar. Paste the invite’s attendee list in any format: emails, "First Last &lt;email&gt;", or the Outlook/Google list with names and asterisks.</p>';
	echo '<form method="post" action="' . esc_url( $act ) . '">' . wp_nonce_field( 'aa_sv_manual', '_wpnonce', true, false ) . '<input type="hidden" name="action" value="aa_sv_manual"><table class="form-table">';
	echo '<tr><th>Class</th><td><select name="class">';
	foreach ( $classes as $slug => $c ) { echo '<option value="' . esc_attr( $slug ) . '">' . esc_html( $c['name'][0] . ' (' . $c['code'] . ')' ) . '</option>'; }
	echo '</select></td></tr>';
	echo '<tr><th>Dates</th><td>from <input type="date" name="start"> to <input type="date" name="end" required> · organisation <input type="text" name="org" placeholder="Service Canada" class="regular-text"></td></tr>';
	echo '<tr><th>Sessions (optional)</th><td><input type="text" name="sessions" class="regular-text" placeholder="October 20–21, November 3–4"><p class="description">If several groups took the same class, list the dates separated by commas and the survey asks which one they attended.</p></td></tr>';
	echo '<tr><th>Attendees</th><td><textarea name="people" rows="8" class="large-text" required></textarea></td></tr>';
	echo '<tr><th>Language of the link</th><td><label><input type="radio" name="lang" value="en" checked> English first</label> &nbsp; <label><input type="radio" name="lang" value="fr"> French first</label> <span class="description">(the email itself is always bilingual)</span></td></tr>';
	echo '<tr><th></th><td><label><input type="checkbox" name="send_now" value="1"> Send the survey email right away</label> <span class="description">Otherwise it waits in the list above until you press Send now.</span></td></tr>';
	echo '</table><p><button class="button button-primary">Add class</button></p></form></div>';
}

/* Admin actions */
function aa_sv_admin_back( $msg ) { wp_safe_redirect( add_query_arg( array( 'page' => 'aa-surveys', 'aa_sv_msg' => $msg ), admin_url( 'options-general.php' ) ) ); exit; }
add_action( 'admin_post_aa_sv_settings', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No.' ); } check_admin_referer( 'aa_sv_settings' );
	$p = wp_unslash( $_POST ); // phpcs:ignore
	$s = get_option( 'aa_sv_settings', array() ); $s = is_array( $s ) ? $s : array();
	$s['enabled'] = empty( $p['enabled'] ) ? 0 : 1;
	$s['ics_url'] = isset( $p['ics_url'] ) ? esc_url_raw( trim( $p['ics_url'] ) ) : '';
	$s['days_after'] = max( 0, min( 30, (int) $p['days_after'] ) ); $s['reminder_days'] = max( 0, min( 30, (int) $p['reminder_days'] ) );
	$s['since'] = preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) $p['since'] ) ? $p['since'] : '';
	$s['notify'] = sanitize_email( $p['notify'] ) ?: 'info@agile-agilist.com'; $s['book'] = esc_url_raw( $p['book'] ); $s['page_id'] = (int) $p['page_id'];
	$s['skip_domains'] = sanitize_textarea_field( $p['skip_domains'] ); $s['orgs'] = sanitize_textarea_field( $p['orgs'] );
	update_option( 'aa_sv_settings', $s, false );
	if ( isset( $p['aa_hubspot_token'] ) ) { update_option( 'aa_hubspot_token', sanitize_text_field( $p['aa_hubspot_token'] ), false ); }
	aa_sv_admin_back( 'Settings saved.' );
} );
add_action( 'admin_post_aa_sv_sync', function () { if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No.' ); } check_admin_referer( 'aa_sv_sync' ); aa_sv_admin_back( 'Calendar: ' . aa_sv_calendar_sync() ); } );
add_action( 'admin_post_aa_sv_send', function () { if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No.' ); } check_admin_referer( 'aa_sv_send' ); $n = aa_sv_delivery_send( sanitize_text_field( wp_unslash( $_GET['key'] ) ) ); aa_sv_admin_back( 'Sent to ' . $n . ' attendee(s).' ); } ); // phpcs:ignore
add_action( 'admin_post_aa_sv_remind', function () { if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No.' ); } check_admin_referer( 'aa_sv_remind' ); $k = sanitize_text_field( wp_unslash( $_GET['key'] ) ); $n = aa_sv_delivery_remind( $k ); $d = aa_sv_delivery( $k ); if ( $d ) { $d['reminded_at'] = current_time( 'mysql' ); aa_sv_delivery_save( $d ); } aa_sv_admin_back( 'Reminder sent to ' . $n . ' attendee(s).' ); } ); // phpcs:ignore
add_action( 'admin_post_aa_sv_skip', function () { if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No.' ); } check_admin_referer( 'aa_sv_skip' ); $d = aa_sv_delivery( sanitize_text_field( wp_unslash( $_GET['key'] ) ) ); if ( $d ) { $d['status'] = 'skipped'; aa_sv_delivery_save( $d ); } aa_sv_admin_back( 'Skipped.' ); } ); // phpcs:ignore
add_action( 'admin_post_aa_sv_preview', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No.' ); } check_admin_referer( 'aa_sv_preview' );
	$d = aa_sv_delivery( sanitize_text_field( wp_unslash( $_GET['key'] ) ) ); // phpcs:ignore
	if ( ! $d ) { wp_die( 'Unknown class.' ); }
	$first = reset( $d['people'] ); $email = key( $d['people'] );
	$mail = aa_sv_email( array( 'token' => 'PREVIEWTOKEN0000', 'email' => $email, 'first' => $first[0], 'last' => $first[1], 'class' => $d['class'], 'delivery' => $d['key'] ), isset( $_GET['reminder'] ) ); // phpcs:ignore
	header( 'Content-Type: text/html; charset=utf-8' ); echo $mail['html']; exit; // phpcs:ignore
} );
add_action( 'admin_post_aa_sv_test', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No.' ); } check_admin_referer( 'aa_sv_test' );
	$class = sanitize_key( $_GET['class'] ); $u = wp_get_current_user(); // phpcs:ignore
	if ( ! aa_sv_class( $class ) ) { aa_sv_admin_back( 'Unknown class.' ); }
	$key = 'test-' . $class;
	if ( ! aa_sv_delivery( $key ) ) { aa_sv_delivery_save( array( 'key' => $key, 'class' => $class, 'org' => 'Test', 'start' => aa_sv_today(), 'end' => aa_sv_today(), 'source' => 'test', 'title' => 'test', 'sessions' => array(), 'people' => array(), 'status' => 'sent', 'send_at' => aa_sv_today(), 'sent_at' => current_time( 'mysql' ), 'uids' => array(), 'lang' => 'en', 'created' => current_time( 'mysql' ) ) ); }
	$tok = aa_sv_recipient_for( $u->user_email, $u->first_name ?: $u->display_name, $u->last_name, $class, $key );
	aa_sv_recipient_update( $tok, array( 'test' => 1 ) );
	$ok = aa_sv_send_email( aa_sv_recipient( $tok ), false );
	aa_sv_admin_back( $ok ? 'Test email sent to ' . $u->user_email . '. Its link opens a real survey; test answers are kept out of the results.' : 'wp_mail failed. Check WP Mail SMTP.' );
} );
add_action( 'admin_post_aa_sv_manual', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No.' ); } check_admin_referer( 'aa_sv_manual' );
	$p = wp_unslash( $_POST ); // phpcs:ignore
	$class = sanitize_key( $p['class'] ); if ( ! aa_sv_class( $class ) ) { aa_sv_admin_back( 'Unknown class.' ); }
	$people = aa_sv_parse_people( $p['people'] );
	if ( ! $people ) { aa_sv_admin_back( 'No usable email addresses found in the list.' ); }
	$end = preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) $p['end'] ) ? $p['end'] : aa_sv_today();
	$start = preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) $p['start'] ) ? $p['start'] : $end;
	$sessions = array_values( array_filter( array_map( 'trim', explode( ',', sanitize_text_field( $p['sessions'] ) ) ) ) );
	$key = 'man-' . $class . '-' . $start . '-' . substr( md5( implode( ',', array_keys( $people ) ) ), 0, 6 );
	$set = aa_sv_settings();
	aa_sv_delivery_save( array( 'key' => $key, 'class' => $class, 'org' => sanitize_text_field( $p['org'] ) ?: aa_sv_org_for( $people ), 'start' => $start, 'end' => $end, 'source' => 'manual', 'title' => '', 'sessions' => $sessions, 'people' => $people,
		'status' => 'pending', 'send_at' => max( aa_sv_today(), aa_sv_date_add( $end, (int) $set['days_after'] ) ), 'sent_at' => '', 'uids' => array(), 'lang' => ( isset( $p['lang'] ) && $p['lang'] === 'fr' ) ? 'fr' : 'en', 'created' => current_time( 'mysql' ) ) );
	if ( ! empty( $p['send_now'] ) ) { $n = aa_sv_delivery_send( $key ); aa_sv_admin_back( 'Added and sent to ' . $n . ' attendee(s).' ); }
	aa_sv_admin_back( 'Added with ' . count( $people ) . ' attendee(s). Press Send now when ready.' );
} );

/* ============================================================================
   RESULTS   [aa_survey_results]   (admins only; ?d=<delivery> or ?c=<class>; CSV via ?aa_sv_csv=1)
   ========================================================================== */

add_action( 'template_redirect', function () {
	if ( ! isset( $_GET['aa_sv_csv'] ) || ! current_user_can( 'manage_options' ) ) { return; }
	if ( ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'aa_sv_csv' ) ) { return; }
	$dkey = isset( $_GET['d'] ) ? sanitize_text_field( wp_unslash( $_GET['d'] ) ) : ''; // phpcs:ignore
	$del  = $dkey ? aa_sv_delivery( $dkey ) : null;
	$class = $del ? $del['class'] : ( isset( $_GET['c'] ) ? sanitize_key( $_GET['c'] ) : '' ); // phpcs:ignore
	$s = $class ? aa_sv_survey( $class, $del ) : null;
	if ( ! $s ) { return; }
	nocache_headers(); header( 'Content-Type: text/csv; charset=utf-8' ); header( 'Content-Disposition: attachment; filename="survey-' . $class . ( $dkey ? '-' . $dkey : '' ) . '.csv"' );
	$out = fopen( 'php://output', 'w' ); fputs( $out, "\xEF\xBB\xBF" );
	$head = array( 'Submitted', 'Name', 'Email', 'Class', 'Organisation', 'Language' );
	foreach ( $s['questions'] as $qid => $q ) { $head[] = $q['label'][0]; }
	$head[] = 'HubSpot synced'; fputcsv( $out, $head );
	foreach ( aa_sv_responses( $class, $dkey ) as $p ) {
		$ans = (array) get_post_meta( $p->ID, 'answers', true );
		$row = array( get_post_meta( $p->ID, 'submitted_at', true ), get_post_meta( $p->ID, 'name', true ), get_post_meta( $p->ID, 'email', true ), $s['name'][0], get_post_meta( $p->ID, 'org', true ), get_post_meta( $p->ID, 'lang', true ) );
		foreach ( $s['questions'] as $qid => $q ) { $row[] = aa_sv_answer_text( $s, $qid, isset( $ans[ $qid ] ) ? $ans[ $qid ] : '' ); }
		$row[] = get_post_meta( $p->ID, 'hs_synced', true ) ? 'yes' : 'no'; fputcsv( $out, $row );
	}
	exit;
} );

add_shortcode( 'aa_survey_results', function () {
	if ( ! current_user_can( 'manage_options' ) ) { return '<p>Sign in as an administrator to see survey results.</p>'; }
	$dkey  = isset( $_GET['d'] ) ? sanitize_text_field( wp_unslash( $_GET['d'] ) ) : ''; // phpcs:ignore
	$del   = $dkey ? aa_sv_delivery( $dkey ) : null;
	$class = $del ? $del['class'] : ( isset( $_GET['c'] ) ? sanitize_key( $_GET['c'] ) : '' ); // phpcs:ignore
	$h = '<div class="aa-svr" style="font-family:inherit;color:#0E3A44;font-size:15px">';
	/* Picker */
	$h .= '<p style="font-size:13px;color:#5E7378">Show: <a href="' . esc_url( remove_query_arg( array( 'd', 'c' ) ) ) . '">all classes</a>';
	foreach ( aa_sv_deliveries() as $k => $d ) { if ( $d['source'] === 'test' ) { continue; } $h .= ' · <a href="' . esc_url( add_query_arg( array( 'd' => $k ), remove_query_arg( 'c' ) ) ) . '"' . ( $k === $dkey ? ' style="font-weight:700"' : '' ) . '>' . esc_html( aa_sv_delivery_label( $d ) ) . '</a>'; }
	$h .= '</p>';
	if ( ! $class ) {
		/* Overview table */
		$h .= '<table style="border-collapse:collapse;width:100%;font-size:14px"><thead><tr style="background:#F3FAFA"><th style="text-align:left;padding:8px">Class</th><th style="padding:8px">Invited</th><th style="padding:8px">Answered</th><th style="padding:8px">Confidence</th><th style="padding:8px">Consultations</th></tr></thead><tbody>';
		foreach ( aa_sv_deliveries() as $k => $d ) {
			if ( $d['source'] === 'test' ) { continue; }
			$rows = aa_sv_responses( $d['class'], $k ); $sum = 0; $nn = 0; $yes = 0;
			foreach ( $rows as $p ) { $a = (array) get_post_meta( $p->ID, 'answers', true ); if ( ! empty( $a['q1'] ) ) { $sum += (int) $a['q1']; $nn++; } if ( isset( $a['q5'] ) && $a['q5'] === 'yes' ) { $yes++; } }
			$h .= '<tr style="border-top:1px solid #E6EFEF"><td style="padding:8px"><a href="' . esc_url( add_query_arg( 'd', $k ) ) . '">' . esc_html( aa_sv_delivery_label( $d ) ) . '</a><br><span style="font-size:12px;color:#5E7378">' . esc_html( $d['status'] === 'sent' ? 'sent ' . substr( $d['sent_at'], 0, 10 ) : $d['status'] ) . '</span></td><td style="padding:8px;text-align:center">' . count( $d['people'] ) . '</td><td style="padding:8px;text-align:center">' . count( $rows ) . '</td><td style="padding:8px;text-align:center">' . ( $nn ? number_format( $sum / $nn, 1 ) . ' / 5' : '–' ) . '</td><td style="padding:8px;text-align:center">' . $yes . '</td></tr>';
		}
		return $h . '</tbody></table></div>';
	}
	$s = aa_sv_survey( $class, $del ); if ( ! $s ) { return $h . '</div>'; }
	$rows = aa_sv_responses( $class, $dkey );
	$invited = array();
	if ( $del ) { $invited = $del['people']; }
	$h .= '<h2 style="margin:6px 0 4px;font-size:24px">' . esc_html( $del ? aa_sv_delivery_label( $del ) : $s['name'][0] ) . '</h2>';
	$h .= '<p><strong>' . count( $rows ) . '</strong> response' . ( count( $rows ) === 1 ? '' : 's' ) . ( $invited ? ' of ' . count( $invited ) . ' invited' : '' )
	    . ' · <a href="' . esc_url( wp_nonce_url( add_query_arg( array( 'aa_sv_csv' => 1, 'c' => $class, 'd' => $dkey ) ), 'aa_sv_csv' ) ) . '">Download CSV</a>'
	    . ' · HubSpot: ' . ( aa_sv_hs_token() !== '' ? 'syncing' : '<strong style="color:#B3261E">no token</strong>' ) . '</p>';
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
			foreach ( $q['options'] as $val => $pair ) { $c = isset( $count[ $val ] ) ? $count[ $val ] : 0; $h .= '<div style="display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:3px 0;border-top:1px solid #F0F5F5"><span>' . esc_html( $pair[0] ) . '</span><strong>' . $c . '</strong></div>'; }
		}
		$h .= '</div>';
	}
	$h .= '</div>';
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
	if ( $invited ) {
		$done = aa_sv_answered_emails( $class, $dkey ); $left = array();
		foreach ( $invited as $e => $nm ) { if ( empty( $done[ $e ] ) ) { $left[] = trim( $nm[0] . ' ' . $nm[1] ) . ' (' . $e . ')'; } }
		$h .= '<p style="margin-top:16px;font-size:13px;color:#5E7378"><strong>' . count( $left ) . ' not yet answered:</strong> ' . esc_html( implode( ', ', $left ) ) . '</p>';
	}
	return $h . '</div>';
} );

endif;
