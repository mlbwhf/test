<?php
/**
 * AA — Assessment results: suggested training per weak principle
 *
 * The Innovation Framework assessment scores five Principles (Fail Forward,
 * Open Communication, Challenging Mental Models, Flexible Structure, Growth
 * Mindset at Scale) and then stops at reading lists and a trial gate. Nothing
 * on the results screen says which class would move a low score.
 *
 * This adds a "Training for your lowest principles" panel under "What your
 * score means", for everyone who has unlocked their results (free or trial):
 *
 *   Innovation Theatre (0-30)   the single lowest principle, one course,
 *                               because the band's own advice is "one
 *                               practice, installed well"
 *   Innovation Practicing       the two lowest principles, one course each
 *   Innovation Native (56+)     the next step the band names: the Mutation
 *                               Readiness assessment, plus one class
 *
 * Each card shows the course, why it fits that principle (taken from what the
 * course page says it covers), the next real cohort, and the price the
 * checkout will charge, crossed out against the list price while a sale runs.
 * Who was assessed changes the pick: "myself" and "my team" get the
 * practitioner course, "business unit" and "whole organization" the leader one.
 * Where a principle is mostly about the performance system rather than skills
 * (Open Communication, Growth Mindset), the card also says so and links the
 * Innovation Culture service instead of pretending a class fixes it.
 *
 * The assessment engine is inline on the page and is not edited: the panel is
 * added in the browser when the results view appears. Prices and dates come
 * from the register snippet (aa_reg_course, aa_reg_next_cohort_for); without
 * it the panel still shows courses and links, just no date or price.
 *
 * To add another assessment, add its key to aa_sf_at_map() with its own
 * dimension ids; the browser code is not assessment-specific.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_at_map' ) ) :

/**
 * Assessment key => per-dimension picks.
 * 'team' is for "myself" / "my team", 'lead' for "business unit" / "organization".
 * Each pick is a register course slug. 'why' is per slug, per language.
 */
function aa_sf_at_map() {
	return apply_filters( 'aa_sf_at_map', array(
		'innovation-framework' => array(
			'dims' => array(
				'ff' => array( 'team' => 'apm',                      'lead' => 'ai-native-ready-certification',   'service' => false ),
				'oc' => array( 'team' => 'scrum-master',             'lead' => 'sa',                              'service' => true ),
				'mm' => array( 'team' => 'sa',                       'lead' => 'ai-native-ready-certification-2', 'service' => false ),
				'fs' => array( 'team' => 'launching-ai-native-arts', 'lead' => 'lpm',                             'service' => false ),
				'gm' => array( 'team' => 'rte',                      'lead' => 'ai-native-ready-certification-2', 'service' => true ),
			),
			/* The book workshop (Crossing one, layer 02) that works on each principle. */
			'workshops' => array(
				'ff' => 'P1 Charter the Playground', 'oc' => 'P3 The Candor Contract', 'mm' => 'P7 The Rebrand Test',
				'fs' => 'P5 The Cultural Wall', 'gm' => 'P2 Attention Audit', 'native' => 'P6 The Innovation Matrix',
			),
			/* Innovation Native: the band says "graduate to the AI-age frontier". */
			'native' => array( 'team' => 'launching-ai-native-arts', 'lead' => 'ai-native-ready-certification-2' ),
			'names'  => array(
				'en' => array( 'ff' => 'Fail Forward', 'oc' => 'Open Communication', 'mm' => 'Challenging Mental Models', 'fs' => 'Flexible Structure', 'gm' => 'Growth Mindset at Scale' ),
				'fr' => array( 'ff' => 'Échouer pour avancer', 'oc' => 'Communication ouverte', 'mm' => 'Remettre en question les modèles mentaux', 'fs' => 'Structure flexible', 'gm' => 'État d’esprit de croissance à grande échelle' ),
				'es' => array( 'ff' => 'Fallar hacia adelante', 'oc' => 'Comunicación abierta', 'mm' => 'Cuestionar los modelos mentales', 'fs' => 'Estructura flexible', 'gm' => 'Mentalidad de crecimiento a escala' ),
			),
			'why' => array(
				'en' => array(
					'ff:apm'                             => 'Continuous exploration is the core of the course: turn an idea into a hypothesis, test it with customers and decide from the result before you build.',
					'ff:ai-native-ready-certification'   => 'Covers the AI Innovation Pipeline, the structured route from an idea to a tested result, and gives the whole organization one language for it. One day, no prerequisites.',
					'oc:scrum-master'                    => 'Facilitating the team’s events and coaching the team is the job, so feedback happens every iteration instead of once a year.',
					'oc:sa'                              => 'For the leaders: Lean-Agile leadership grounded in Lean and systems thinking. Teams speak up when the people at the top lead this way.',
					'mm:sa'                              => 'Built on Lean and systems thinking: look at the whole system and ask why it works the way it does, instead of optimizing the parts you inherited.',
					'mm:ai-native-ready-certification-2' => 'An executive cohort of senior leaders who design the AI-Native operating model together, which starts by questioning how the organization works today.',
					'fs:launching-ai-native-arts'        => 'Organize teams into a train around the flow of value, and build AI into how that train executes. You leave as an ART Leader.',
					'fs:lpm'                             => 'Fund value streams instead of projects, with Lean budgets and guardrails, so teams decide inside clear limits instead of escalating.',
					'gm:rte'                             => 'Relentless improvement is part of the RTE’s job: the train makes time to learn and improve, not only to deliver.',
					'gm:ai-native-ready-certification-2' => 'Includes six months of follow-up coaching, so leaders keep practising, and learning in front of their teams, after the class ends.',
					'native:launching-ai-native-arts'    => 'Your culture is ready. Turn it into execution: a train organized around value, with AI built into how it delivers.',
					'native:ai-native-ready-certification-2' => 'Your culture is ready. Leaders design the AI-Native operating model together, with six months of follow-up coaching.',
				),
				'fr' => array(
					'ff:apm'                             => 'L’exploration continue est au cœur du cours : transformer une idée en hypothèse, la tester auprès des clients et décider sur la base du résultat avant de construire.',
					'ff:ai-native-ready-certification'   => 'Couvre l’AI Innovation Pipeline, le chemin structuré d’une idée à un résultat testé, et donne à toute l’organisation un langage commun. Une journée, sans prérequis.',
					'oc:scrum-master'                    => 'Animer les événements de l’équipe et la coacher, c’est le rôle : le feedback se fait à chaque itération, pas une fois par an.',
					'oc:sa'                              => 'Pour les dirigeants : un leadership Lean-Agile fondé sur le Lean et la pensée systémique. Les équipes osent parler quand la direction mène ainsi.',
					'mm:sa'                              => 'Fondé sur le Lean et la pensée systémique : regarder le système entier et se demander pourquoi il fonctionne ainsi, au lieu d’optimiser les parties héritées.',
					'mm:ai-native-ready-certification-2' => 'Une cohorte de dirigeants qui conçoivent ensemble le modèle opérationnel AI-Native, ce qui commence par remettre en question le fonctionnement actuel.',
					'fs:launching-ai-native-arts'        => 'Organiser les équipes en train autour du flux de valeur et intégrer l’IA à son exécution. Vous en sortez ART Leader.',
					'fs:lpm'                             => 'Financer des chaînes de valeur plutôt que des projets, avec budgets Lean et garde-fous : les équipes décident dans un cadre clair sans tout faire remonter.',
					'gm:rte'                             => 'L’amélioration continue fait partie du rôle de RTE : le train prend le temps d’apprendre et de s’améliorer, pas seulement de livrer.',
					'gm:ai-native-ready-certification-2' => 'Inclut six mois de coaching de suivi : les dirigeants continuent de pratiquer, et d’apprendre devant leurs équipes, après la formation.',
					'native:launching-ai-native-arts'    => 'Votre culture est prête. Passez à l’exécution : un train organisé autour de la valeur, avec l’IA intégrée à la livraison.',
					'native:ai-native-ready-certification-2' => 'Votre culture est prête. Les dirigeants conçoivent ensemble le modèle opérationnel AI-Native, avec six mois de coaching de suivi.',
				),
				'es' => array(
					'ff:apm'                             => 'La exploración continua es el núcleo del curso: convertir una idea en hipótesis, probarla con clientes y decidir según el resultado antes de construir.',
					'ff:ai-native-ready-certification'   => 'Cubre el AI Innovation Pipeline, el camino estructurado de una idea a un resultado probado, y da a toda la organización un lenguaje común. Un día, sin requisitos previos.',
					'oc:scrum-master'                    => 'Facilitar los eventos del equipo y entrenarlo es el rol: el feedback ocurre en cada iteración, no una vez al año.',
					'oc:sa'                              => 'Para los líderes: liderazgo Lean-Agile basado en Lean y pensamiento sistémico. Los equipos hablan cuando la dirección lidera así.',
					'mm:sa'                              => 'Basado en Lean y pensamiento sistémico: mirar el sistema completo y preguntar por qué funciona así, en lugar de optimizar las partes heredadas.',
					'mm:ai-native-ready-certification-2' => 'Una cohorte de altos directivos que diseñan juntos el modelo operativo AI-Native, lo que empieza por cuestionar cómo funciona hoy la organización.',
					'fs:launching-ai-native-arts'        => 'Organizar los equipos en un tren alrededor del flujo de valor e integrar la IA en su ejecución. Sale como ART Leader.',
					'fs:lpm'                             => 'Financiar flujos de valor en lugar de proyectos, con presupuestos Lean y límites claros, para que los equipos decidan sin escalar todo.',
					'gm:rte'                             => 'La mejora continua es parte del rol del RTE: el tren dedica tiempo a aprender y mejorar, no solo a entregar.',
					'gm:ai-native-ready-certification-2' => 'Incluye seis meses de coaching de seguimiento, para que los líderes sigan practicando, y aprendiendo frente a sus equipos, después del curso.',
					'native:launching-ai-native-arts'    => 'Su cultura está lista. Llévela a la ejecución: un tren organizado alrededor del valor, con la IA integrada en la entrega.',
					'native:ai-native-ready-certification-2' => 'Su cultura está lista. Los líderes diseñan juntos el modelo operativo AI-Native, con seis meses de coaching de seguimiento.',
				),
			),
		),
	) );
}

function aa_sf_at_strings( $lang ) {
	$s = array(
		'en' => array(
			'h'        => 'Training for your lowest principles',
			'h_native' => 'Your next step',
			'sub1'     => 'Start with one principle, your lowest. One practice installed well moves the score more than five initiatives.',
			'sub2'     => 'Your two lowest principles, and the class that works on each.',
			'sub_n'    => 'Innovation is already how you work. The next frontier is sensing and responding at AI speed.',
			'for_lead' => 'Picked for leaders, because you assessed a business unit or the whole organization.',
			'for_team' => 'Picked for practitioners, because you assessed yourself or your team.',
			'next'     => 'Next class',
			'soon'     => 'New dates soon',
			'cta'      => 'See dates and register',
			'service'  => 'Not only a class: changing what the review form rewards and protecting learning time is organizational work. Our Innovation Culture service builds it into the cadence you already run.',
			'service_l'=> 'Innovation Culture service',
			'mr'       => 'Take the Mutation Readiness assessment',
			'mr_d'     => 'The AI-age extension of this framework: 18 questions, free.',
			'team'     => 'Training a team? Request a team quote',
			'until'    => 'until',
			'wk_k'     => 'Layer 02 · Innovation Framework certification',
			'wk'       => 'The workshops from the book that work on these principles, taught in the Innovation Creator and Innovation Facilitator certifications (launching soon):',
			'wk_l'     => 'See the certifications on twochasms.com',
		),
		'fr' => array(
			'h'        => 'Formations pour vos principes les plus faibles',
			'h_native' => 'Votre prochaine étape',
			'sub1'     => 'Commencez par un seul principe, le plus faible. Une pratique bien installée fait plus bouger le score que cinq initiatives.',
			'sub2'     => 'Vos deux principes les plus faibles, et la formation qui travaille chacun.',
			'sub_n'    => 'L’innovation fait déjà partie de votre façon de travailler. La prochaine frontière : percevoir et réagir à la vitesse de l’IA.',
			'for_lead' => 'Choisi pour les dirigeants, car vous avez évalué une division ou toute l’organisation.',
			'for_team' => 'Choisi pour les praticiens, car vous vous êtes évalué vous-même ou votre équipe.',
			'next'     => 'Prochaine session',
			'soon'     => 'Nouvelles dates bientôt',
			'cta'      => 'Voir les dates et s’inscrire',
			'service'  => 'Pas seulement une formation : changer ce que l’évaluation de performance récompense et protéger le temps d’apprentissage est un travail organisationnel. Notre service Culture d’innovation l’intègre à la cadence que vous avez déjà.',
			'service_l'=> 'Service Culture d’innovation',
			'mr'       => 'Faire l’évaluation de Préparation à la Mutation',
			'mr_d'     => 'Le prolongement de ce cadre à l’ère de l’IA : 18 questions, gratuit.',
			'team'     => 'Former une équipe ? Demander un devis',
			'until'    => 'jusqu’au',
			'wk_k'     => 'Couche 02 · Certification Innovation Framework',
			'wk'       => 'Les ateliers du livre qui travaillent ces principes, enseignés dans les certifications Innovation Creator et Innovation Facilitator (lancement prochain) :',
			'wk_l'     => 'Voir les certifications sur twochasms.com',
		),
		'es' => array(
			'h'        => 'Formación para sus principios más bajos',
			'h_native' => 'Su siguiente paso',
			'sub1'     => 'Empiece por un principio, el más bajo. Una práctica bien instalada mueve más la puntuación que cinco iniciativas.',
			'sub2'     => 'Sus dos principios más bajos, y la formación que trabaja cada uno.',
			'sub_n'    => 'La innovación ya es su forma de trabajar. La siguiente frontera: detectar y responder a la velocidad de la IA.',
			'for_lead' => 'Elegido para líderes, porque evaluó una unidad de negocio o toda la organización.',
			'for_team' => 'Elegido para profesionales, porque se evaluó a sí mismo o a su equipo.',
			'next'     => 'Próxima clase',
			'soon'     => 'Nuevas fechas pronto',
			'cta'      => 'Ver fechas e inscribirse',
			'service'  => 'No solo una clase: cambiar lo que premia la evaluación de desempeño y proteger el tiempo de aprendizaje es trabajo organizacional. Nuestro servicio de Cultura de innovación lo integra en la cadencia que ya tiene.',
			'service_l'=> 'Servicio de Cultura de innovación',
			'mr'       => 'Hacer la evaluación de Preparación para la Mutación',
			'mr_d'     => 'La extensión de este marco a la era de la IA: 18 preguntas, gratis.',
			'team'     => '¿Forma a un equipo? Pida una cotización',
			'until'    => 'hasta el',
			'wk_k'     => 'Capa 02 · Certificación Innovation Framework',
			'wk'       => 'Los talleres del libro que trabajan estos principios, enseñados en las certificaciones Innovation Creator e Innovation Facilitator (próximo lanzamiento):',
			'wk_l'     => 'Ver las certificaciones en twochasms.com',
		),
	);
	return isset( $s[ $lang ] ) ? $s[ $lang ] : $s['en'];
}

function aa_sf_at_links( $lang ) {
	$l = array(
		'en' => array( 'mr' => '/assessments/mutation-readiness/', 'service' => '/services/innovation-culture/' ),
		'fr' => array( 'mr' => '/fr/evaluation-preparation-mutation/', 'service' => '/fr/innovation-culture/' ),
		'es' => array( 'mr' => '/es/evaluacion-preparacion-mutacion/', 'service' => '/services/innovation-culture/' ),
	);
	$l = isset( $l[ $lang ] ) ? $l[ $lang ] : $l['en'];
	$l = array_map( 'home_url', $l );
	$l['tc'] = apply_filters( 'aa_sf_at_twochasms_url', 'https://twochasms.com/?utm_source=agile-agilist&utm_medium=assessment&utm_campaign=innovation-certification' );
	return $l;
}

/** "Nov 25–26" in the page's language. */
function aa_sf_at_range( $start, $end, $lang ) {
	$s = strtotime( $start );
	$e = strtotime( $end ? $end : $start );
	if ( ! $s ) { return ''; }
	$mon = array(
		'fr' => array( '', 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.' ),
		'es' => array( '', 'ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.' ),
	);
	if ( isset( $mon[ $lang ] ) ) {
		$m  = $mon[ $lang ];
		$sm = $m[ (int) date( 'n', $s ) ];
		$em = $m[ (int) date( 'n', $e ) ];
		if ( $s === $e ) { return date( 'j', $s ) . ' ' . $sm; }
		if ( $sm === $em ) { return date( 'j', $s ) . '–' . date( 'j', $e ) . ' ' . $sm; }
		return date( 'j', $s ) . ' ' . $sm . ' – ' . date( 'j', $e ) . ' ' . $em;
	}
	if ( $s === $e ) { return date( 'M j', $s ); }
	if ( date( 'm', $s ) === date( 'm', $e ) ) { return date( 'M j', $s ) . '–' . date( 'j', $e ); }
	return date( 'M j', $s ) . ' – ' . date( 'M j', $e );
}

/** One course as the browser needs it: name, link, next date, price now and before the sale. */
function aa_sf_at_course( $slug, $lang ) {
	if ( ! function_exists( 'aa_reg_course' ) ) { return null; }
	$c = aa_reg_course( $slug );
	if ( ! is_array( $c ) || empty( $c['url'] ) ) { return null; }
	$out = array(
		'slug' => $slug,
		'code' => isset( $c['code'] ) ? (string) $c['code'] : '',
		'name' => isset( $c['name'] ) ? (string) $c['name'] : $slug,
		'url'  => home_url( $c['url'] ),
		'when' => '',
		'iso'  => '',
		'price'=> '',
		'was'  => '',
		'team' => add_query_arg( 'course', rawurlencode( $slug ), home_url( '/team-training/' ) ) . '#quote',
	);
	$out['name'] = trim( preg_replace( '/\s+Certification$/u', '', $out['name'] ) );
	if ( function_exists( 'aa_reg_next_cohort_for' ) ) {
		$n = aa_reg_next_cohort_for( $slug );
		if ( is_array( $n ) && ! empty( $n['start'] ) ) {
			$out['when'] = aa_sf_at_range( $n['start'], isset( $n['end'] ) ? $n['end'] : '', $lang );
			$out['iso']  = (string) $n['start'];
		}
	}
	if ( function_exists( 'aa_reg_money' ) && ! empty( $c['price'] ) ) {
		$cur          = isset( $c['currency'] ) ? $c['currency'] : 'usd';
		$out['price'] = aa_reg_money( $c['price'], $cur ) . ' ' . strtoupper( $cur );
		if ( ! empty( $c['price_was'] ) ) { $out['was'] = aa_reg_money( $c['price_was'], $cur ); }
	}
	return $out;
}

/** The sale line ("Black Friday price until Nov 30"), or '' when no sale is running. */
function aa_sf_at_sale( $lang ) {
	if ( ! function_exists( 'aa_reg_sale_pct' ) || ! function_exists( 'aa_reg_sale_config' ) || ! aa_reg_sale_pct() ) { return ''; }
	$cfg = aa_reg_sale_config();
	$to  = ! empty( $cfg['to'] ) ? strtotime( $cfg['to'] ) : 0;
	$s   = aa_sf_at_strings( $lang );
	$nm  = ! empty( $cfg['name'] ) ? $cfg['name'] : '';
	$day = $to ? trim( aa_sf_at_range( date( 'Y-m-d', $to ), '', $lang ) ) : '';
	return trim( $nm . ' · −' . (int) aa_reg_sale_pct() . '%' . ( $day ? ' ' . $s['until'] . ' ' . $day : '' ) );
}

/** Everything the browser needs for one assessment, in the page's language. */
function aa_sf_at_payload( $key, $lang ) {
	$map = aa_sf_at_map();
	if ( empty( $map[ $key ] ) ) { return null; }
	$m     = $map[ $key ];
	$lang  = isset( $m['why'][ $lang ] ) ? $lang : 'en';
	$slugs = array();
	foreach ( $m['dims'] as $d ) { $slugs[ $d['team'] ] = 1; $slugs[ $d['lead'] ] = 1; }
	if ( ! empty( $m['native'] ) ) { foreach ( $m['native'] as $sl ) { $slugs[ $sl ] = 1; } }
	$courses = array();
	foreach ( array_keys( $slugs ) as $sl ) {
		$c = aa_sf_at_course( $sl, $lang );
		if ( $c ) { $courses[ $sl ] = $c; }
	}
	return array(
		'dims'    => $m['dims'],
		'native'  => isset( $m['native'] ) ? $m['native'] : null,
		'wk'      => isset( $m['workshops'] ) ? $m['workshops'] : array(),
		'names'   => isset( $m['names'][ $lang ] ) ? $m['names'][ $lang ] : $m['names']['en'],
		'why'     => $m['why'][ $lang ],
		'courses' => $courses,
		'sale'    => aa_sf_at_sale( $lang ),
		's'       => aa_sf_at_strings( $lang ),
		'links'   => aa_sf_at_links( $lang ),
	);
}

function aa_sf_at_lang() {
	if ( function_exists( 'aa_reg_lang' ) ) {
		$l = (string) aa_reg_lang();
		if ( in_array( $l, array( 'en', 'fr', 'es' ), true ) ) { return $l; }
	}
	$path = isset( $_SERVER['REQUEST_URI'] ) ? (string) $_SERVER['REQUEST_URI'] : '';
	if ( strpos( $path, '/fr/' ) === 0 ) { return 'fr'; }
	if ( strpos( $path, '/es/' ) === 0 ) { return 'es'; }
	return 'en';
}

/** Pages that carry the assessment engine with an assessment we have picks for. */
function aa_sf_at_keys_on_page() {
	if ( is_admin() || ! is_singular() ) { return array(); }
	$p = get_post();
	if ( ! $p ) { return array(); }
	$body = (string) $p->post_content;
	if ( strpos( $body, 'aa-app' ) === false ) { return array(); }
	$keys = array();
	foreach ( array_keys( aa_sf_at_map() ) as $k ) {
		if ( strpos( $body, "'" . $k . "'" ) !== false || strpos( $body, '"' . $k . '"' ) !== false ) { $keys[] = $k; }
	}
	return $keys;
}

add_action( 'wp_footer', function () {
	$keys = aa_sf_at_keys_on_page();
	if ( ! $keys ) { return; }
	$lang = aa_sf_at_lang();
	$data = array();
	foreach ( $keys as $k ) {
		$p = aa_sf_at_payload( $k, $lang );
		if ( $p ) { $data[ $k ] = $p; }
	}
	if ( ! $data ) { return; }
	?>
<style id="aa-at-css">
#aa-app .aa-at{margin:0 0 22px;padding:24px;border-radius:14px;background:#fff;border:1px solid #B9DCDC}
#aa-app .aa-at h3{margin:0 0 6px;font-size:20px;color:#0B2E35}
#aa-app .aa-at__sub{margin:0 0 4px;font-size:15px;line-height:1.55;color:#334155}
#aa-app .aa-at__who{margin:0 0 16px;font-size:13px;color:#64748b}
#aa-app .aa-at__sale{display:inline-block;margin:0 0 14px;padding:3px 10px;border-radius:100px;background:#F2B66D;color:#0B2E35;font-size:12px;font-weight:700}
#aa-app .aa-at__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
#aa-app .aa-at__card{display:flex;flex-direction:column;gap:8px;padding:18px;border-radius:12px;background:#F5FAFB;border-left:4px solid var(--c,#0E8074)}
#aa-app .aa-at__k{margin:0;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#0E8074}
#aa-app .aa-at__card h4{margin:0;font-size:17px;line-height:1.3;color:#0B2E35}
#aa-app .aa-at__card h4 a{color:inherit;text-decoration:none}#aa-app .aa-at__card h4 a:hover{text-decoration:underline}
#aa-app .aa-at__why{margin:0;font-size:14px;line-height:1.55;color:#334155}
#aa-app .aa-at__meta{margin:auto 0 0;display:flex;flex-wrap:wrap;gap:4px 12px;font-size:13px;color:#0B2E35}
#aa-app .aa-at__meta s{color:#64748b}#aa-app .aa-at__meta b{font-weight:700}
#aa-app .aa-at__go{display:block;margin-top:6px;padding:11px 14px;border-radius:8px;background:#0E8074;color:#fff;font-weight:700;font-size:14px;text-align:center;text-decoration:none;min-height:44px;box-sizing:border-box}
#aa-app .aa-at__go:hover{background:#0B2E35;color:#fff}
#aa-app .aa-at__svc{margin:0;font-size:13px;line-height:1.5;color:#475569}
#aa-app .aa-at__svc a,#aa-app .aa-at__foot a{color:#0E8074;font-weight:700}
#aa-app .aa-at__foot{margin:16px 0 0;font-size:14px}
#aa-app .aa-at__wk{margin-top:16px;padding:16px 18px;border-radius:12px;border:1.5px dashed #0E8074;background:rgba(242,182,109,.10)}
#aa-app .aa-at__wk ul{margin:8px 0 10px;padding-left:18px;font-size:14px;line-height:1.6;color:#0B2E35}
#aa-app .aa-at__wk a{color:#0E8074;font-weight:700}
@media (max-width:600px){#aa-app .aa-at{padding:18px}}
</style>
<script id="aa-at-data" type="application/json"><?php echo wp_json_encode( array( 'lang' => $lang, 'a' => $data ) ); ?></script>
<script id="aa-at-js">
(function(){
var el=document.getElementById('aa-at-data');if(!el)return;var D;try{D=JSON.parse(el.textContent)}catch(e){return}
function h(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function card(P,k,c,dimName,score,max,color){
  var w=P.why[k+':'+c.slug]||'';var price=c.price?(c.was?'<s>'+h(c.was)+'</s> ':'')+'<b>'+h(c.price)+'</b>':'';
  var when=c.when?'<span>'+h(P.s.next)+' · <time datetime="'+h(c.iso)+'">'+h(c.when)+'</time></span>':'<span>'+h(P.s.soon)+'</span>';
  return '<div class="aa-at__card" style="--c:'+h(color||'#0E8074')+'">'
   +(dimName?'<p class="aa-at__k">'+h(dimName)+(max?' · '+score+'/'+max:'')+'</p>':'')
   +'<h4><a href="'+h(c.url)+'" data-aa-at="'+h(c.slug)+'">'+h(c.name)+(c.code&&c.name.indexOf('('+c.code+')')<0?' ('+h(c.code)+')':'')+'</a></h4>'
   +(w?'<p class="aa-at__why">'+h(w)+'</p>':'')
   +'<p class="aa-at__meta">'+when+(price?'<span>'+price+'</span>':'')+'</p>'
   +'<a class="aa-at__go" href="'+h(c.url)+'" data-aa-at="'+h(c.slug)+'">'+h(P.s.cta)+' &rarr;</a></div>';
}
function build(){
  var box=document.getElementById('aa-content');if(!box)return;
  var inner=box.querySelector('.aa-results-inner');if(!inner||inner.querySelector('.aa-at'))return;
  var grid=inner.querySelector('.aa-grid-2');if(!grid)return; /* email gate: results not unlocked yet */
  var r;try{r=JSON.parse(sessionStorage.getItem('aa_result')||'null')}catch(e){r=null}
  if(!r||!D.a[r.assessmentId])return;
  var P=D.a[r.assessmentId],lead=(r.perspective==='bu'||r.perspective==='org'),pick=lead?'lead':'team';
  var band=r.band&&r.band.id||'',scores=r.dimScores||{},ids=Object.keys(P.dims);
  var max=0;inner.querySelectorAll('.aa-dim-score').forEach(function(x){var m=/\/(\d+)/.exec(x.textContent);if(m)max=+m[1]});
  var colors={};inner.querySelectorAll('.aa-dim-fill').forEach(function(x,i){if(ids[i])colors[ids[i]]=x.style.background});
  var cards='',seen={},head=P.s.h,sub,svc=0,wks=[];
  if(band==='native'&&P.native){
    head=P.s.h_native;sub=P.s.sub_n;var c=P.courses[P.native[pick]];
    cards+='<div class="aa-at__card"><p class="aa-at__k">Mutation Readiness</p><h4><a href="'+h(P.links.mr)+'">'+h(P.s.mr)+'</a></h4><p class="aa-at__why">'+h(P.s.mr_d)+'</p><a class="aa-at__go" href="'+h(P.links.mr)+'">'+h(P.s.mr)+' &rarr;</a></div>';
    if(c)cards+=card(P,'native',c,'',0,0,'#0E8074');
    if(P.wk&&P.wk.native)wks.push(['',P.wk.native]);
  }else{
    var order=ids.slice().sort(function(a,b){return (scores[a]||0)-(scores[b]||0)});
    var n=band==='theatre'?1:2;sub=n===1?P.s.sub1:P.s.sub2;
    for(var i=0;i<order.length&&n>0;i++){
      var d=order[i],sl=P.dims[d][pick];if(seen[sl]||!P.courses[sl])sl=P.dims[d][pick==='lead'?'team':'lead'];
      if(seen[sl]||!P.courses[sl])continue;seen[sl]=1;n--;
      if(P.wk&&P.wk[d])wks.push([P.names[d],P.wk[d]]);if(P.dims[d].service)svc=1;cards+=card(P,d,P.courses[sl],P.names[d],scores[d]||0,max,colors[d]);
    }
  }
  if(!cards)return;
  var first=null;for(var s in seen){first=P.courses[s];break}
  var html='<section class="aa-at" aria-labelledby="aa-at-h"><h3 id="aa-at-h">'+h(head)+'</h3><p class="aa-at__sub">'+h(sub)+'</p>'
   +(band!=='native'?'<p class="aa-at__who">'+h(lead?P.s.for_lead:P.s.for_team)+'</p>':'')
   +(P.sale?'<p class="aa-at__sale">'+h(P.sale)+'</p>':'')
   +'<div class="aa-at__grid">'+cards+'</div>'
   +(svc?'<p class="aa-at__svc" style="margin-top:14px">'+h(P.s.service)+' <a href="'+h(P.links.service)+'">'+h(P.s.service_l)+' &rarr;</a></p>':'')
   +(wks.length&&P.links.tc?'<div class="aa-at__wk"><p class="aa-at__k">'+h(P.s.wk_k)+'</p><p class="aa-at__why">'+h(P.s.wk)+'</p><ul>'+wks.map(function(w){return '<li>'+(w[0]?h(w[0])+': ':'')+'<b>'+h(w[1])+'</b></li>'}).join('')+'</ul><a href="'+h(P.links.tc)+'" data-aa-at="twochasms" rel="noopener">'+h(P.s.wk_l)+' &rarr;</a></div>':'')
   +(first?'<p class="aa-at__foot"><a href="'+h(first.team)+'" data-aa-at="team-quote">'+h(P.s.team)+' &rarr;</a></p>':'')+'</section>';
  var after=grid.nextElementSibling&&grid.nextElementSibling.classList.contains('aa-panel')?grid.nextElementSibling:grid;
  after.insertAdjacentHTML('afterend',html);
  try{(window.dataLayer=window.dataLayer||[]).push({event:'assessment_training_shown',aa_assessment:r.assessmentId,aa_band:band})}catch(e){}
}
document.addEventListener('click',function(e){var a=e.target&&e.target.closest?e.target.closest('a[data-aa-at]'):null;if(!a)return;try{var r=JSON.parse(sessionStorage.getItem('aa_result')||'{}');(window.dataLayer=window.dataLayer||[]).push({event:'assessment_training_click',aa_assessment:r.assessmentId||'',aa_course:a.getAttribute('data-aa-at')})}catch(x){}},true);
function watch(){var box=document.getElementById('aa-content');if(!box)return;build();new MutationObserver(build).observe(box,{childList:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();
})();
</script>
	<?php
}, 99 );

endif;
