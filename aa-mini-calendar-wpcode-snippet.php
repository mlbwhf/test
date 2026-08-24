<?php
/**
 * Agile Agilist — COURSE CALENDAR  [aa_mini_calendar]
 * -----------------------------------------------------------------------------
 * Replaces the Xylus calendar. Driven by the site's OWN schedule and
 * registration, never Eventbrite:
 *
 *     post type  wp_events  ·  taxonomy event_category  ·  meta start_ts/end_ts
 *     optional per-cohort meta:  seats_left · price · hours · instructor
 *
 * Built to the "1A split" option of the course-calendar design handoff:
 *
 *   - Each class is a LABELLED BAR spanning its real days — a 4-day SPC is one
 *     bar four cells wide, carrying its code, name and a day-count chip. A
 *     class crossing a Saturday renders as one bar per week row; overlapping
 *     classes pack into lanes so nothing ever covers anything else.
 *   - HOVERING (or tab-focusing) a bar raises a preview card — dates, hours,
 *     price, seats — so the visitor sees the cohort BEFORE clicking. The card
 *     flips at the viewport edge instead of opening off-screen.
 *   - CLICKING opens that cohort in the panel BESIDE the calendar: description,
 *     a fact grid, what's included, price, and the register CTA.
 *
 * REGISTRATION IS NEVER A SECOND PATH. The CTA hands off to the enrol form the
 * site already has: on a page that carries one it scrolls to #enroll and
 * pre-selects the cohort through the same AA_PICK bridge the cohort cards use;
 * everywhere else it deep-links the course page's enrol section with
 * ?cohort=<event id>, which the form's populator reads. This snippet never
 * collects a name, an email or a payment of its own.
 *
 * USE — drop-in for the old shortcode, same attribute name:
 *     [aa_mini_calendar category="aspc"]          one course (course pages)
 *     [aa_mini_calendar]                          every course (training page)
 *     [aa_mini_calendar category="aspc,spc"]      a chosen set
 *     [aa_mini_calendar link="course"]            register goes to the course
 *                                                 page (default: same-page
 *                                                 #enroll form)
 *     [aa_mini_calendar lang="es"]                Spanish chrome (also: fr)
 *     [aa_mini_calendar months="6"]               lookahead window (default 6)
 *     [aa_mini_calendar wide="1"]                 larger grid for a full-width
 *                                                 slot; the detail panel is
 *                                                 beside the calendar either way
 *     [aa_mcal_selftest]                          admin-only diagnostic box
 *
 * INSTALL: WPCode -> PHP Snippet -> Auto Insert, Run Everywhere. That is
 * ALL: this snippet also takes over the old [easy_events_calendar] and
 * [easy_event_calendar_mini] shortcodes (see the bottom of the file), so
 * every page that embeds them switches to this calendar with no page edits.
 * Deactivating the snippet hands them straight back to the Xylus plugin.
 *
 * The takeover keeps each page's own category= list, so the hub calendars
 * stay scoped to their track: /training/adv-safe/ shows only the five
 * advanced courses, /training/safe/ only the seven role courses. Two pages
 * carry no calendar at all — see aa_mcal_hidden_slugs() at the bottom.
 *
 * The events query is cached the same way as [aa_home_cohorts]: per-request
 * memo + 10-minute transient keyed by the Eastern day.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * Course palette + destinations, keyed by event_category slug.
 *
 * The keys are the term slugs the pages actually pass to the calendar
 * shortcode, not the course-page slugs — those differ (event "sasm" lives at
 * /training/safe/asm/, event "sp" at /training/safe-industry/team-practitioner/).
 * "asm" is kept as an alias because older embeds pass that spelling.
 *
 * An unlisted slug still renders: it falls back to the slug uppercased, the
 * house teal, and /training/. The two SAFe-for-Hardware terms (shwa, shwp) are
 * deliberately absent — the term slugs do not map unambiguously onto the two
 * hardware course pages, and the page that used them no longer shows a
 * calendar. Add them here if that changes.
 */
function aa_mcal_catalog() {
	return array(
		'aspc'             => array( 'code' => 'ASPC',    'name' => 'Advanced SAFe Practice Consultant Certification',
			'track' => 'Advanced SAFe', 'color' => '#1F6FB2', 'tint' => '#E8F1F9', 'tint_border' => '#C7DEEF',
			'url' => '/training/adv-safe/aspc/', 'duration' => '3 days', 'pdus' => '24 PDUs / SEUs',
			'bullets' => array( '3 days live-virtual, instructor-led', 'Certification exam fee included', '24 PDUs / SEUs', 'Exam: 60 multiple-choice · 120 minutes' ),
			'desc' => 'Deepen your consulting practice beyond SPC — advanced coaching, measuring transformation outcomes, and guiding complex enterprise change at the portfolio and solution level. Three days…' ),
		'spc'              => array( 'code' => 'SPC',     'name' => 'SAFe Practice Consultant Certification',
			'track' => 'Advanced SAFe', 'color' => '#1F6FB2', 'tint' => '#E8F1F9', 'tint_border' => '#C7DEEF',
			'url' => '/training/adv-safe/spc/', 'duration' => '4 days', 'pdus' => '32 PDUs / SEUs',
			'bullets' => array( '4 days live-virtual, instructor-led', 'Certification exam fee included', '32 PDUs / SEUs', 'Exam: 60 multiple-choice · 180 minutes' ),
			'desc' => 'Become the change agent who can teach SAFe, launch Agile Release Trains, and lead an enterprise transformation end-to-end. Four days, live-virtual, with the SPC exam and licensing to teach…' ),
		'rte'              => array( 'code' => 'RTE',     'name' => 'SAFe RTE Certification',
			'track' => 'Advanced SAFe', 'color' => '#1F6FB2', 'tint' => '#E8F1F9', 'tint_border' => '#C7DEEF',
			'url' => '/training/adv-safe/rte/', 'duration' => '3 days', 'pdus' => '24 PDUs / SEUs',
			'bullets' => array( '3 days live-virtual, instructor-led', 'Certification exam fee included', '24 PDUs / SEUs', 'Exam: 60 multiple-choice · 180 minutes' ),
			'desc' => 'Become the servant leader and coach of the Agile Release Train — facilitating ART events and processes, driving relentless improvement, and leading the program through PI execution. Three…' ),
		'lpm'              => array( 'code' => 'LPM',     'name' => 'SAFe LPM Certification',
			'track' => 'Portfolio & Lean', 'color' => '#7A4FA3', 'tint' => '#F1EAF7', 'tint_border' => '#DCC9EA',
			'url' => '/training/adv-safe/lpm/', 'duration' => '2 days', 'pdus' => '16 PDUs / SEUs',
			'bullets' => array( '2 days live-virtual, instructor-led', 'Certification exam fee included', '16 PDUs / SEUs', 'Exam: 45 multiple-choice · 90 minutes' ),
			'desc' => 'Align strategy and execution by applying Lean and systems thinking to portfolio strategy, funding, and operations — connecting the portfolio to enterprise strategy and Lean budgets. Two…' ),
		'apm'              => array( 'code' => 'APM',     'name' => 'SAFe APM Certification',
			'track' => 'Portfolio & Lean', 'color' => '#7A4FA3', 'tint' => '#F1EAF7', 'tint_border' => '#DCC9EA',
			'url' => '/training/adv-safe/apm/', 'duration' => '3 days', 'pdus' => '24 PDUs / SEUs',
			'bullets' => array( '3 days live-virtual, instructor-led', 'Certification exam fee included', '24 PDUs / SEUs', 'Exam: 60 multiple-choice · 120 minutes' ),
			'desc' => 'Use design thinking and a Lean-Agile mindset to discover, build, and bring to market products customers love — from vision and roadmap to pricing, packaging, and continuous value. Three…' ),
		'sa'               => array( 'code' => 'SA',      'name' => 'SAFe Agilist Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/sa/', 'duration' => '2 days', 'pdus' => '16 PDUs / SEUs',
			'bullets' => array( '2 days live-virtual, instructor-led', 'Certification exam fee included', '16 PDUs / SEUs', 'Exam: 45 multiple-choice · 90 minutes' ),
			'desc' => 'Lead a Lean-Agile transformation by applying SAFe® and its principles of Lean, systems thinking, and agile development. Two days, live-virtual, with an authorised SAFe instructor (SPC/ASPC)…' ),
		'ssm'              => array( 'code' => 'SSM',     'name' => 'SAFe Scrum Master Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/scrum-master/', 'duration' => '2 days', 'pdus' => '15 PDUs / SEUs',
			'bullets' => array( '2 days live-virtual, instructor-led', 'Certification exam fee included', '15 PDUs / SEUs', 'Exam: 45 multiple-choice · 90 minutes' ),
			'desc' => 'Become the Scrum Master who facilitates Agile teams within a SAFe enterprise — running team and program events, supporting PI execution, and coaching teams to high performance. Two days…' ),
		'popm'             => array( 'code' => 'POPM',    'name' => 'SAFe POPM Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/popm/', 'duration' => '2 days', 'pdus' => '15 PDUs / SEUs',
			'bullets' => array( '2 days live-virtual, instructor-led', 'Certification exam fee included', '15 PDUs / SEUs', 'Exam: 45 multiple-choice · 90 minutes' ),
			'desc' => 'Master the responsibilities of the Product Owner and Product Manager in a SAFe enterprise — writing stories, managing backlogs, and delivering value through the Continuous Delivery…' ),
		'sdp'              => array( 'code' => 'SDP',     'name' => 'SAFe DevOps Practitioner Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/devops/', 'duration' => '2 days', 'pdus' => '16 PDUs / SEUs',
			'bullets' => array( '2 days live-virtual, instructor-led', 'Certification exam fee included', '16 PDUs / SEUs', 'Exam: 45 multiple-choice · 90 minutes' ),
			'desc' => 'Map your Continuous Delivery Pipeline, optimise the flow of value from idea to production, and build the culture, automation, and measurement that release on demand. Two days, live-virtual…' ),
		'sasm'             => array( 'code' => 'SASM',    'name' => 'SAFe Advanced Scrum Master Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/asm/', 'duration' => '2 days', 'pdus' => '16 PDUs / SEUs',
			'bullets' => array( '2 days live-virtual, instructor-led', 'Certification exam fee included', '16 PDUs / SEUs', 'Exam: 60 multiple-choice · 120 minutes' ),
			'desc' => 'Take your Scrum Master practice to the program level — facilitating cross-team interactions, supporting DevOps and built-in quality, and coaching the Agile Release Train. Two days…' ),
		'asm'              => array( 'code' => 'SASM',    'name' => 'SAFe Advanced Scrum Master Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/asm/', 'duration' => '2 days', 'pdus' => '16 PDUs / SEUs',
			'bullets' => array( '2 days live-virtual, instructor-led', 'Certification exam fee included', '16 PDUs / SEUs', 'Exam: 60 multiple-choice · 120 minutes' ),
			'desc' => 'Take your Scrum Master practice to the program level — facilitating cross-team interactions, supporting DevOps and built-in quality, and coaching the Agile Release Train. Two days…' ),
		'sp'               => array( 'code' => 'SP',      'name' => 'SAFe Practitioner Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe-industry/team-practitioner/', 'duration' => '2 days', 'pdus' => '15 PDUs / SEUs',
			'bullets' => array( '2 days live-virtual, instructor-led', 'Certification exam fee included', '15 PDUs / SEUs', 'Exam: 45 multiple-choice · 90 minutes' ),
			'desc' => 'Build the skills to be a high-performing member of an Agile Release Train — how to plan and execute work, collaborate across teams, and deliver value in a Program Increment. Two days…' ),
		'bo'               => array( 'code' => 'BO',      'name' => 'SAFe® Business Owner',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/bo/', 'duration' => '', 'pdus' => '',
			'bullets' => array(),
			'desc' => '' ),
		'arch'             => array( 'code' => 'ARCH',    'name' => 'SAFe Architect Certification',
			'track' => 'Advanced SAFe', 'color' => '#1F6FB2', 'tint' => '#E8F1F9', 'tint_border' => '#C7DEEF',
			'url' => '/training/safe-industry/arch/', 'duration' => '3 days', 'pdus' => '24 PDUs / SEUs',
			'bullets' => array( '3 days live-virtual, instructor-led', 'Certification exam fee included', '24 PDUs / SEUs', 'Exam: 60 multiple-choice · 120 minutes' ),
			'desc' => 'Lead the architecture of large solutions in a Lean-Agile enterprise — aligning architecture with business value, enabling continuous delivery, and guiding teams through architectural…' ),
		'ase'              => array( 'code' => 'ASE',     'name' => 'SAFe Agile Software Engineer Certification',
			'track' => 'Advanced SAFe', 'color' => '#1F6FB2', 'tint' => '#E8F1F9', 'tint_border' => '#C7DEEF',
			'url' => '/training/safe-industry/ase/', 'duration' => '3 days', 'pdus' => '24 PDUs / SEUs',
			'bullets' => array( '3 days live-virtual, instructor-led', 'Certification exam fee included', '24 PDUs / SEUs', 'Exam: 60 multiple-choice · 120 minutes' ),
			'desc' => 'Build the technical practices that make continuous delivery real — test-first, behaviour-driven development, and Agile architecture that lets teams release on demand with built-in quality…' ),
		'sagov'            => array( 'code' => 'SA-GOV',  'name' => 'Leading SAFe® for Government',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe-industry/sa-gov/', 'duration' => '', 'pdus' => '',
			'bullets' => array(),
			'desc' => '' ),
		'ai-native'        => array( 'code' => 'AINF',    'name' => 'AI-Native Foundations Certification',
			'track' => 'AI-Native', 'color' => '#D34B2A', 'tint' => '#FBEAE4', 'tint_border' => '#F2CDC0',
			'url' => '/training/ai-native/', 'duration' => '2 days', 'pdus' => '16 PDUs / SEUs',
			'bullets' => array( '2 days live-virtual, instructor-led', 'Certification exam fee included', '16 PDUs / SEUs', 'Exam: 45 multiple-choice · 90 minutes' ),
			'desc' => 'Extend SAFe into the AI age — AI-Native ways of working, an AI Enablement layer, and Innovation Culture baked into delivery. Learn the Five Disciplines and AI-Empowered Agility that define…' ),
		'micro-conflict'   => array( 'code' => 'CONFLICT', 'name' => 'Advanced Facilitator: Conflict & Collaboration',
			'track' => 'Micro-Credentials', 'color' => '#2E7D5B', 'tint' => '#E7F3ED', 'tint_border' => '#C6E3D5',
			'url' => '/training/safe-found/conflict-collaboration/', 'duration' => '', 'pdus' => '',
			'bullets' => array(),
			'desc' => '' ),
		'micro-vsm'        => array( 'code' => 'VSM',     'name' => 'Advanced Facilitator: Value Stream Mapping',
			'track' => 'Micro-Credentials', 'color' => '#2E7D5B', 'tint' => '#E7F3ED', 'tint_border' => '#C6E3D5',
			'url' => '/training/safe-found/value-stream-mapping/', 'duration' => '', 'pdus' => '',
			'bullets' => array(),
			'desc' => '' ),
		'micro-rai'        => array( 'code' => 'RAI',     'name' => 'Achieving Responsible AI with SAFe',
			'track' => 'Micro-Credentials', 'color' => '#2E7D5B', 'tint' => '#E7F3ED', 'tint_border' => '#C6E3D5',
			'url' => '/training/safe-found/responsible-ai-safe/', 'duration' => '', 'pdus' => '',
			'bullets' => array(),
			'desc' => '' ),
		'micro-gov'        => array( 'code' => 'GOV',     'name' => 'Agile Contracting for Government',
			'track' => 'Micro-Credentials', 'color' => '#2E7D5B', 'tint' => '#E7F3ED', 'tint_border' => '#C6E3D5',
			'url' => '/training/safe-found/agile-contracting-government/', 'duration' => '', 'pdus' => '',
			'bullets' => array(),
			'desc' => '' ),
	);
}

/** Chrome strings — month/day names never go through the server locale. */
function aa_mcal_strings( $lang ) {
	$all = array(
		'en' => array(
			'months'    => array( 'January','February','March','April','May','June','July','August','September','October','November','December' ),
			'mon_short' => array( 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ),
			'dow_long'  => array( 'Sun','Mon','Tue','Wed','Thu','Fri','Sat' ),
			'eyebrow'   => 'Upcoming cohorts',
			'empty'     => 'No classes this month',
			'prev'      => 'Previous month', 'next' => 'Next month',
			'selected'  => 'Selected cohort',
			'pick_hint' => 'Select a cohort in the calendar to see its dates, what is included, and register.',
			'days_n'    => '%d days', 'seats' => '%d seats', 'seats_left' => '%d seats left',
			'click_open'=> 'Click to open ⟶',
			'f_dates'   => 'Dates', 'f_schedule' => 'Schedule', 'f_seats' => 'Seats left',
			'f_instructor' => 'Instructor', 'f_pdus' => 'Credits',
			'register'  => 'Register for these dates ⟶',
			'exam_incl' => 'Exam fee included',
			'reassure'  => 'Live-virtual with a certified instructor. Secure checkout.',
			'course_page' => 'Full course details ⟶', 'day_first' => false,
		),
		'es' => array(
			'months'    => array( 'Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre' ),
			'mon_short' => array( 'ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic' ),
			'dow_long'  => array( 'Dom','Lun','Mar','Mié','Jue','Vie','Sáb' ),
			'eyebrow'   => 'Próximas cohortes',
			'empty'     => 'Sin clases este mes',
			'prev'      => 'Mes anterior', 'next' => 'Mes siguiente',
			'selected'  => 'Cohorte seleccionada',
			'pick_hint' => 'Elige una cohorte en el calendario para ver sus fechas, qué incluye e inscribirte.',
			'days_n'    => '%d días', 'seats' => '%d plazas', 'seats_left' => 'Quedan %d plazas',
			'click_open'=> 'Haz clic para abrir ⟶',
			'f_dates'   => 'Fechas', 'f_schedule' => 'Horario', 'f_seats' => 'Plazas libres',
			'f_instructor' => 'Instructor', 'f_pdus' => 'Créditos',
			'register'  => 'Inscríbete en estas fechas ⟶',
			'exam_incl' => 'Examen incluido',
			'reassure'  => 'En vivo con instructor certificado. Pago seguro.',
			'course_page' => 'Ver el curso completo ⟶', 'day_first' => true,
		),
		'fr' => array(
			'months'    => array( 'Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre' ),
			'mon_short' => array( 'janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.' ),
			'dow_long'  => array( 'Dim','Lun','Mar','Mer','Jeu','Ven','Sam' ),
			'eyebrow'   => 'Prochaines cohortes',
			'empty'     => 'Pas de classe ce mois-ci',
			'prev'      => 'Mois précédent', 'next' => 'Mois suivant',
			'selected'  => 'Cohorte sélectionnée',
			'pick_hint' => 'Choisissez une cohorte dans le calendrier pour voir ses dates, ce qui est inclus et vous inscrire.',
			'days_n'    => '%d jours', 'seats' => '%d places', 'seats_left' => '%d places restantes',
			'click_open'=> 'Cliquez pour ouvrir ⟶',
			'f_dates'   => 'Dates', 'f_schedule' => 'Horaire', 'f_seats' => 'Places restantes',
			'f_instructor' => 'Formateur', 'f_pdus' => 'Crédits',
			'register'  => 'S\'inscrire à ces dates ⟶',
			'exam_incl' => 'Examen inclus',
			'reassure'  => 'En direct avec un formateur certifié. Paiement sécurisé.',
			'course_page' => 'Voir la fiche complète ⟶', 'day_first' => true,
		),
	);
	return isset( $all[ $lang ] ) ? $all[ $lang ] : $all['en'];
}

/**
 * Upcoming events for the requested categories, as plain rows:
 * {s:"Y-m-d", e:"Y-m-d", c:"slug", id:int}. Cached like aa_home_cohort_rows.
 */
function aa_mcal_events( $cats, $months, &$dbg ) {
	static $memo = array();
	$tz    = new DateTimeZone( 'America/New_York' );
	$from  = new DateTime( 'first day of this month', $tz );
	$from->setTime( 0, 0, 0 );
	$to    = ( clone $from )->modify( '+' . max( 1, (int) $months ) . ' months' );
	$key   = 'aa_mcal_' . md5( implode( ',', $cats ) . '|' . $months . '|' . $from->format( 'Ymd' ) );
	if ( isset( $memo[ $key ] ) ) { return $memo[ $key ]; }
	$cached = get_transient( $key );
	if ( is_array( $cached ) ) { $dbg[] = '(transient cache)'; return $memo[ $key ] = $cached; }

	$tax = array( 'taxonomy' => 'event_category', 'field' => 'slug', 'terms' => null );
	$q   = array(
		'post_type'      => 'wp_events',
		'post_status'    => 'publish',
		'posts_per_page' => 200,
		'no_found_rows'  => true,
		'meta_key'       => 'start_ts',
		'orderby'        => 'meta_value_num',
		'order'          => 'ASC',
		'meta_query'     => array( array(
			'key' => 'start_ts', 'compare' => 'BETWEEN', 'type' => 'NUMERIC',
			'value' => array( $from->getTimestamp(), $to->getTimestamp() ),
		) ),
	);
	if ( $cats ) {
		$tax['terms']   = $cats;
		$q['tax_query'] = array( $tax );
	}

	$rows = array();
	foreach ( get_posts( $q ) as $p ) {
		$start = (int) get_post_meta( $p->ID, 'start_ts', true );
		$end   = (int) get_post_meta( $p->ID, 'end_ts', true );
		if ( ! $start ) { continue; }
		$terms = get_the_terms( $p->ID, 'event_category' );
		$slug  = ( $terms && ! is_wp_error( $terms ) ) ? $terms[0]->slug : '';
		if ( $cats && ! in_array( $slug, $cats, true ) ) {
			// first term wasn't the requested one — find the one that is
			foreach ( (array) $terms as $t ) {
				if ( in_array( $t->slug, $cats, true ) ) { $slug = $t->slug; break; }
			}
		}
		$s = ( new DateTime( '@' . $start ) )->setTimezone( $tz );
		$e = $end ? ( new DateTime( '@' . $end ) )->setTimezone( $tz ) : $s;
		if ( $e < $s ) { $e = $s; }
		$row = array( 's' => $s->format( 'Y-m-d' ), 'e' => $e->format( 'Y-m-d' ),
		              'c' => $slug, 'id' => $p->ID );

		// Per-cohort facts for the detail panel. All four are OPTIONAL: the
		// panel omits a fact it has no value for rather than printing a
		// placeholder, so an unpopulated site still renders correctly.
		//
		// price is read HERE and nowhere else on purpose. It is the only
		// price the calendar will ever show, because a cohort's price is a
		// property of the cohort (early-bird, group rates) and because the
		// prices in redesign-build/courses.json are all stale — every one of
		// the 13 disagrees with its live course page. With no price meta the
		// panel shows no price and sends the visitor to the course page.
		$seats = get_post_meta( $p->ID, 'seats_left', true );
		if ( $seats !== '' && $seats !== null ) { $row['seats'] = (int) $seats; }
		foreach ( array( 'price', 'hours', 'instructor' ) as $k ) {
			$v = get_post_meta( $p->ID, $k, true );
			if ( is_scalar( $v ) && $v !== '' ) { $row[ $k ] = (string) $v; }
		}

		$rows[] = $row;
		$dbg[]  = $slug . ' ' . $s->format( 'Y-m-d' ) . '..' . $e->format( 'Y-m-d' )
		        . ( isset( $row['seats'] ) ? ' seats=' . $row['seats'] : ' seats=?' )
		        . ( isset( $row['price'] ) ? ' price=' . $row['price'] : '' );
	}
	set_transient( $key, $rows, 10 * MINUTE_IN_SECONDS );
	return $memo[ $key ] = $rows;
}

function aa_mcal_render( $atts ) {
	static $instance = 0, $assets_done = false;
	$instance++;

	$a = shortcode_atts( array(
		'category' => '',            // "" = all courses
		'months'   => 6,
		'link'     => 'enroll',      // enroll | course
		'lang'     => 'en',
		'wide'     => '',            // "1" = full-width training-page variant
		'debug'    => '',
	), $atts, 'aa_mini_calendar' );

	$lang = in_array( $a['lang'], array( 'es', 'fr' ), true ) ? $a['lang'] : 'en';
	$str  = aa_mcal_strings( $lang );
	$cats = array_filter( array_map( 'trim', explode( ',', strtolower( $a['category'] ) ) ) );
	$dbg  = array();
	$rows = aa_mcal_events( $cats, (int) $a['months'], $dbg );

	$catalog = aa_mcal_catalog();
	$meta    = array();   // term slug => course record, for the JS
	foreach ( $rows as $r ) {
		$slug = $r['c'];
		if ( isset( $meta[ $slug ] ) ) { continue; }
		$meta[ $slug ] = isset( $catalog[ $slug ] )
			? $catalog[ $slug ]
			: array( 'code' => strtoupper( $slug ), 'name' => strtoupper( $slug ), 'track' => '',
			         'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			         'url' => '/training/', 'bullets' => array(), 'desc' => '' );
	}

	// The course URL stays a real course URL even when link="enroll": the panel
	// needs somewhere to send "Full course details", and the enrol handoff is
	// decided in JS from cfg.link, not by blanking the URL here.
	$payload = wp_json_encode( array(
		'events' => $rows, 'courses' => $meta, 'lang' => $lang, 'link' => $a['link'],
		'months' => max( 1, (int) $a['months'] ), 'str' => $str,
	) );

	$id   = 'aa-mcal-' . $instance;
	$html = '<div class="aa-mcal' . ( $a['wide'] ? ' aa-mcal--wide' : '' ) . '" id="' . esc_attr( $id ) . '">'
	      . '<script type="application/json">' . $payload . '</script>'
	      . '<div class="aa-mcal__cal"></div>'
	      . '<div class="aa-mcal__panel" aria-live="polite"></div>'
	      . '<noscript>';
	// Crawlers and no-JS get a real dated list with real links — the calendar
	// itself is JS-rendered, so without this the cohorts would be invisible to
	// anything that does not run scripts.
	foreach ( array_slice( $rows, 0, 12 ) as $r ) {
		$m   = $meta[ $r['c'] ];
		$url = $m['url'] . ( strpos( $m['url'], '?' ) === false ? '?' : '&' ) . 'cohort=' . (int) $r['id'] . '#enroll';
		$html .= '<a href="' . esc_url( $url ) . '">'
		       . esc_html( $m['code'] . ' · ' . $m['name'] . ' · ' . $r['s'] . ' – ' . $r['e'] ) . '</a><br>';
	}
	$html .= '</noscript></div>';

	if ( $assets_done ) { return $html; }
	$assets_done = true;

	$html .= <<<'AA_MCAL_ASSETS'
<style>
/* Agile Agilist course calendar — tokens and layout from the design handoff
   (design_handoff_course_calendar), option 1A "split": calendar left, detail +
   register panel right. Type FAMILY inherits from the page on purpose — the
   handoff specifies DM Sans, but the site already loads three families and is
   being asked to cut font requests, so only the sizes/weights are adopted. */
.aa-mcal{
  --ink:#101C33; --body:#3D3A33; --muted:#4E4A40; --meta:#6B6455;
  --faint:#8A8375; --faint2:#9A9384; --disabled:#C9C3B4;
  --l1:#DCD7CB; --l2:#E4E0D6; --l3:#E9E5DB; --l4:#EEEAE0; --l5:#F1EDE3;
  --panel:#FBFAF7; --onink:#F7F5F0; --teal:#0E8074;
  display:grid; grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);
  background:#fff; border:1px solid var(--l2); border-radius:20px;
  color:var(--ink); font-family:inherit; text-align:left;
}
/* No overflow:hidden on the card. The hover preview is absolutely positioned
   and hangs below its bar, so clipping the card would decapitate every preview
   opened from the bottom week or the last column. The two children carry the
   rounded corners instead, which is what overflow:hidden was there for. */
.aa-mcal__cal{border-radius:20px 0 0 20px}
.aa-mcal__panel{border-radius:0 20px 20px 0}
.aa-mcal *{box-sizing:border-box}
.aa-mcal__cal{padding:26px 26px 30px; border-right:1px solid var(--l3); min-width:0}

/* ---- header ---- */
.aa-mcal-head{display:flex; align-items:flex-end; justify-content:space-between; gap:14px}
.aa-mcal-eyebrow{display:block; font-size:11.5px; font-weight:700; letter-spacing:.16em;
  text-transform:uppercase; color:var(--teal); margin-bottom:4px}
.aa-mcal-title{font-size:27px; font-weight:600; letter-spacing:-.025em; line-height:1.1; margin:0}
.aa-mcal-nav{display:flex; gap:7px; flex:none}
.aa-mcal-nav button{width:36px; height:36px; border:1px solid var(--l1); border-radius:10px;
  background:#fff; color:var(--meta); font-size:15px; line-height:1; cursor:pointer;
  display:flex; align-items:center; justify-content:center}
.aa-mcal-nav button:hover:not(:disabled),
.aa-mcal-nav button:focus-visible{border-color:var(--teal); color:var(--teal)}
.aa-mcal-nav button:disabled{opacity:.35; cursor:default}

/* ---- grid ---- */
.aa-mcal-dows{display:grid; grid-template-columns:repeat(7,1fr); margin-top:18px;
  border-bottom:1px solid var(--l4); padding-bottom:8px}
.aa-mcal-dows span{font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
  color:var(--faint2); padding-left:4px}
.aa-mcal-week{border-bottom:1px solid var(--l5); padding:7px 0 9px}
.aa-mcal-nums{display:grid; grid-template-columns:repeat(7,1fr)}
.aa-mcal-nums span{font-size:12.5px; font-weight:600; color:var(--body); padding-left:4px}
.aa-mcal-nums span.is-out{font-weight:400; color:var(--disabled)}
.aa-mcal-bars{display:grid; grid-template-columns:repeat(7,1fr); gap:4px 2px; margin-top:3px}
.aa-mcal-slot{position:relative; min-width:0}
.aa-mcal-slot.is-hov{z-index:60}

/* ---- course bar: the width IS the class length ---- */
.aa-mcal-bar{display:flex; align-items:center; gap:6px; width:100%; height:26px;
  padding:0 8px; border-radius:7px; cursor:pointer; text-align:left; overflow:hidden;
  white-space:nowrap; font-family:inherit; font-size:11.5px;
  background:var(--tint); color:var(--c); border:1px solid var(--tb);
  transition:transform .15s ease, box-shadow .15s ease}
.aa-mcal-bar:hover,.aa-mcal-bar:focus-visible{transform:translateY(-1px); box-shadow:0 2px 10px var(--tb)}
.aa-mcal-bar.is-sel{background:var(--c); color:#fff; border-color:var(--c); box-shadow:none}
.aa-mcal-bar b{font-weight:700; flex:none}
.aa-mcal-bar .n{overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0; opacity:.92; font-weight:400}
.aa-mcal-bar .d{font-size:10px; font-weight:700; opacity:.8; flex:none}
.aa-mcal-bar.is-tight .n,.aa-mcal-bar.is-tight .d{display:none}
/* past / sold out */
.aa-mcal-bar.is-gone{opacity:.55}
.aa-mcal-bar.is-gone:hover,.aa-mcal-bar.is-gone:focus-visible{transform:none; box-shadow:none}

/* ---- hover preview ---- */
.aa-mcal-pv{position:absolute; top:calc(100% + 7px); left:0; width:252px; max-width:70vw;
  background:#fff; border:1px solid var(--l2); border-radius:13px; padding:14px;
  box-shadow:0 18px 40px rgba(16,28,51,.14); pointer-events:none; z-index:70;
  opacity:0; visibility:hidden; transform:translateY(-4px);
  transition:opacity .16s ease, transform .16s ease; white-space:normal}
.aa-mcal-slot.is-hov .aa-mcal-pv{opacity:1; visibility:visible; transform:translateY(0)}
.aa-mcal-pv.flip-x{left:auto; right:0}
.aa-mcal-pv.flip-y{top:auto; bottom:calc(100% + 7px)}
.aa-mcal-pv__track{font-size:10.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--faint2)}
.aa-mcal-pv__name{font-size:15px; font-weight:600; margin:5px 0 4px; line-height:1.25}
.aa-mcal-pv__when{font-size:12.5px; color:var(--muted); line-height:1.45}
.aa-mcal-pv__hr{height:1px; background:var(--l4); margin:11px 0}
.aa-mcal-pv__row{display:flex; align-items:center; justify-content:space-between; gap:8px}
.aa-mcal-pv__price{font-size:12.5px; font-weight:600}
.aa-mcal-pv__go{font-size:11.5px; font-weight:600; color:var(--teal); margin-top:9px}
.aa-mcal-pill{font-size:11.5px; font-weight:600; padding:3px 8px; border-radius:100px;
  background:#E7F2F0; color:#0B665C; white-space:nowrap}
.aa-mcal-pill.is-low{background:#FBE9E3; color:#B0413E}

/* ---- legend ---- */
.aa-mcal-legend{display:flex; flex-wrap:wrap; gap:8px 16px; margin-top:16px}
.aa-mcal-key{display:inline-flex; align-items:center; gap:8px; font-size:12px; color:var(--meta)}
.aa-mcal-key i{width:10px; height:10px; border-radius:3px; background:var(--c); flex:none}
.aa-mcal-empty{padding:26px 4px; font-size:13.5px; color:var(--meta)}

/* ---- detail + register panel ---- */
.aa-mcal__panel{background:var(--panel); padding:26px 26px 30px; display:flex; flex-direction:column; min-width:0}
.aa-mcal-sel{display:flex; align-items:center; gap:8px; font-size:11.5px; font-weight:700;
  letter-spacing:.14em; text-transform:uppercase; color:var(--faint2)}
.aa-mcal-sel i{width:7px; height:7px; border-radius:50%; background:#D34B2A; flex:none;
  animation:aa-mcal-pulse 1.4s ease-in-out infinite}
@keyframes aa-mcal-pulse{0%,100%{opacity:1}50%{opacity:.35}}
.aa-mcal-rule{width:4px; height:54px; border-radius:2px; background:var(--c,#0E8074); margin:16px 0 14px}
.aa-mcal-track{font-size:10.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--faint2)}
.aa-mcal-name{font-size:25px; font-weight:600; letter-spacing:-.028em; line-height:1.14; margin:7px 0 0}
.aa-mcal-desc{font-size:14px; line-height:1.6; color:var(--muted); margin:11px 0 0}

.aa-mcal-facts{display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--l3);
  border:1px solid var(--l3); border-radius:12px; overflow:hidden; margin-top:18px}
.aa-mcal-fact{background:#fff; padding:12px 14px; min-width:0}
.aa-mcal-fact dt{font-size:10.5px; font-weight:700; letter-spacing:.13em; text-transform:uppercase;
  color:var(--faint2); margin:0}
.aa-mcal-fact dd{font-size:14.5px; font-weight:600; margin:4px 0 0}
.aa-mcal-fact dd.is-low{color:#B0413E}

.aa-mcal-inc{list-style:none; margin:18px 0 0; padding:0; display:flex; flex-direction:column; gap:7px}
.aa-mcal-inc li{display:flex; gap:7px; font-size:13.5px; color:var(--body); line-height:1.45}
.aa-mcal-inc li::before{content:"✓"; color:var(--teal); font-weight:700; flex:none}

.aa-mcal-reg{margin-top:auto; padding-top:22px; border-top:1px solid var(--l3)}
.aa-mcal-price{font-size:22px; font-weight:600; line-height:1.2}
.aa-mcal-price small{display:block; font-size:11.5px; font-weight:400; color:var(--faint); margin-top:3px}
.aa-mcal-cta{display:block; width:100%; margin-top:14px; padding:14px; border-radius:100px;
  background:var(--ink); color:var(--onink) !important; text-align:center; font-size:14.5px;
  font-weight:600; text-decoration:none !important; border:0; cursor:pointer; font-family:inherit}
.aa-mcal-cta:hover,.aa-mcal-cta:focus-visible{background:var(--teal); color:var(--onink) !important}
.aa-mcal-note{font-size:11.5px; color:var(--faint); margin:10px 0 0; line-height:1.5}
.aa-mcal-more{display:inline-block; margin-top:10px; font-size:12.5px; color:var(--teal)}
.aa-mcal-hint{font-size:13.5px; color:var(--meta); line-height:1.6; margin:0}

/* ---- wide variant: same layout, larger grid ---- */
.aa-mcal--wide .aa-mcal__cal{padding:30px 34px 32px}
.aa-mcal--wide .aa-mcal-title{font-size:32px; letter-spacing:-.03em}
.aa-mcal--wide .aa-mcal-nums span{font-size:14px; padding-left:6px}
.aa-mcal--wide .aa-mcal-dows span{padding-left:6px}
.aa-mcal--wide .aa-mcal-bars{gap:5px 3px}
.aa-mcal--wide .aa-mcal-bar{height:32px; padding:0 11px; font-size:13px}
.aa-mcal--wide .aa-mcal-bar .d{font-size:11px}
.aa-mcal--wide .aa-mcal-week{padding:9px 0 12px}

/* ---- agenda fallback ----
   Defined BEFORE the media query that switches it on: both rules are a
   single class, so whichever comes last wins, and with the base rule after
   the query its display:none silently beat the display:flex and the mobile
   list never appeared. */
.aa-mcal-agenda{display:none; flex-direction:column; gap:8px; margin-top:16px}
.aa-mcal-arow{display:flex; align-items:center; gap:10px; width:100%; padding:11px 12px;
  border:1px solid var(--l2); border-radius:12px; background:#fff; cursor:pointer;
  font-family:inherit; text-align:left}
.aa-mcal-arow.is-sel{border-color:var(--c); box-shadow:inset 3px 0 0 var(--c)}
.aa-mcal-arow i{width:10px; height:10px; border-radius:3px; background:var(--c); flex:none}
.aa-mcal-arow .t{flex:1; min-width:0}
.aa-mcal-arow .t b{display:block; font-size:13.5px; font-weight:600}
.aa-mcal-arow .t span{display:block; font-size:12px; color:var(--meta); margin-top:2px}

/* ---- responsive: stack, then fall back to an agenda list ---- */
@media (max-width:1023px){
  .aa-mcal{grid-template-columns:minmax(0,1fr)}
  .aa-mcal__cal{border-right:0; border-bottom:1px solid var(--l3); border-radius:20px 20px 0 0}
  .aa-mcal__panel{padding:22px 22px 26px; border-radius:0 0 20px 20px}
}
@media (max-width:719px){
  .aa-mcal__cal{padding:20px 18px 22px}
  .aa-mcal--wide .aa-mcal__cal{padding:20px 18px 22px}
  .aa-mcal-title,.aa-mcal--wide .aa-mcal-title{font-size:22px}
  /* A 7-column month grid stops working here — show the same cohorts as rows. */
  .aa-mcal-dows,.aa-mcal-weeks{display:none}
  .aa-mcal-agenda{display:flex}
  .aa-mcal-name{font-size:21px}
}

@media (prefers-reduced-motion:reduce){
  .aa-mcal-bar,.aa-mcal-pv{transition:opacity .16s ease}
  .aa-mcal-bar:hover,.aa-mcal-bar:focus-visible{transform:none}
  .aa-mcal-slot.is-hov .aa-mcal-pv{transform:none}
  .aa-mcal-pv{transform:none}
  .aa-mcal-sel i{animation:none}
}
</style>
<script>
/* Course calendar. One instance per .aa-mcal; config arrives as inline JSON so
   nothing is fetched. Bars are buttons: hover AND keyboard focus both raise the
   preview, click selects, and the panel is aria-live so a screen reader hears
   the change. */
(function () {
  'use strict';
  var MON = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function boot(root) {
    if (root.getAttribute('data-mcal-ready')) { return; }
    root.setAttribute('data-mcal-ready', '1');
    var tag = root.querySelector('script[type="application/json"]');
    if (!tag) { return; }
    var cfg;
    try { cfg = JSON.parse(tag.textContent); } catch (e) { return; }

    var S = cfg.str, C = cfg.courses;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    // Local parsing: new Date("2026-09-22") is UTC and shifts bars a day west.
    function d(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
    var ev = cfg.events.map(function (r, i) {
      var s = d(r.s), e = d(r.e);
      return { i: i, s: s, e: e, c: r.c, id: r.id, seats: r.seats,
               price: r.price, hours: r.hours, instructor: r.instructor,
               days: Math.round((e - s) / 86400000) + 1, past: e < today };
    });
    function meta(o) { return C[o.c] || { code: o.c.toUpperCase(), name: o.c.toUpperCase(),
      track: '', color: '#0E8074', tint: '#E7F2F0', tint_border: '#C6E1DC', url: '/training/', bullets: [] }; }

    var view = new Date(today.getFullYear(), today.getMonth(), 1);
    var last = new Date(today.getFullYear(), today.getMonth() + (cfg.months - 1), 1);
    var sel = null, hov = null;
    // Open on the soonest upcoming cohort so the panel is never empty on load.
    for (var k = 0; k < ev.length; k++) { if (!ev[k].past) { sel = ev[k].i; break; } }
    if (sel === null && ev.length) { sel = ev[0].i; }
    // ...and open the GRID on that cohort's month, not on today's. A course
    // page whose next class is two months out would otherwise load showing an
    // empty current month while the panel described a cohort not on screen.
    if (sel !== null) { view = new Date(ev[sel].s.getFullYear(), ev[sel].s.getMonth(), 1); }
    // The forward bound has to cover the cohorts actually loaded, or the last
    // one is unreachable when it sits past the months= window.
    ev.forEach(function (o) {
      var m = new Date(o.e.getFullYear(), o.e.getMonth(), 1);
      if (m > last) { last = m; }
    });

    /* Spanish and French put the day before the month — "17–19 sept. 2026",
       not "sept. 17–19, 2026" — and drop the comma before the year. Same
       day_first switch the cohort shortcode uses, so both read alike. */
    function fmtRange(o) {
      var M = S.mon_short, a = o.s, b = o.e, y = b.getFullYear();
      if (S.day_first) {
        if (a.getMonth() === b.getMonth()) {
          return a.getDate() + '–' + b.getDate() + ' ' + M[b.getMonth()] + ' ' + y;
        }
        return a.getDate() + ' ' + M[a.getMonth()] + ' – ' + b.getDate() + ' ' + M[b.getMonth()] + ' ' + y;
      }
      if (a.getMonth() === b.getMonth()) {
        return M[a.getMonth()] + ' ' + a.getDate() + '–' + b.getDate() + ', ' + y;
      }
      return M[a.getMonth()] + ' ' + a.getDate() + ' – ' + M[b.getMonth()] + ' ' + b.getDate() + ', ' + y;
    }
    /* The price meta may be "2899", "2,899", "$2,899" or "USD 2899" — editors
       type all four. A bare number gets grouped and a $ prefix; anything that
       already carries a symbol or separator is left exactly as entered, since
       the editor clearly meant that formatting. Grouping uses the PAGE's
       language, not the visitor's: "2 899" is right on /fr/ and wrong on /. */
    function money(v) {
      var s = String(v).trim();
      if (/^\d+(\.\d+)?$/.test(s)) {
        try { return '$' + Number(s).toLocaleString(cfg.lang || 'en'); }
        catch (e) { return '$' + s; }
      }
      return s;
    }
    function seatsLabel(o) {
      if (typeof o.seats !== 'number') { return null; }
      return o.seats <= 6 ? S.seats_left.replace('%d', o.seats) : S.seats.replace('%d', o.seats);
    }
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }

    /* Where "Register" goes. Never a second registration path: on a page that
       already carries the enrol form we scroll to it and pre-select the cohort
       through the same AA_PICK bridge the cohort cards use; everywhere else we
       deep-link the course page's enrol section with ?cohort=<event id>, which
       is what the form's populator reads. */
    function regHref(o) {
      var m = meta(o);
      if (cfg.link === 'enroll') { return '#enroll'; }
      return m.url + (m.url.indexOf('?') < 0 ? '?' : '&') + 'cohort=' + o.id + '#enroll';
    }

    function weeksOf(y, mo) {
      var first = new Date(y, mo, 1), dim = new Date(y, mo + 1, 0).getDate();
      var gridStart = new Date(y, mo, 1 - first.getDay());
      var n = Math.ceil((first.getDay() + dim) / 7), DAY = 86400000, out = [];
      for (var w = 0; w < n; w++) {
        var ws = new Date(gridStart.getTime() + w * 7 * DAY);
        var we = new Date(ws.getTime() + 6 * DAY);
        var days = [];
        for (var i = 0; i < 7; i++) {
          var dt = new Date(ws.getTime() + i * DAY);
          days.push({ num: dt.getDate(), out: dt.getMonth() !== mo, today: +dt === +today });
        }
        // Greedy first-fit lane packing, clipped to this week, so a class that
        // crosses a Saturday renders as one bar per week row and nothing overlaps.
        var lanes = [], bars = [];
        ev.filter(function (o) { return o.e >= ws && o.s <= we; })
          .sort(function (p, q) { return p.s - q.s; })
          .forEach(function (o) {
            var c0 = Math.max(0, Math.round((o.s - ws) / DAY));
            var c1 = Math.min(6, Math.round((o.e - ws) / DAY));
            var lane = 0;
            while (lanes[lane] !== undefined && lanes[lane] >= c0) { lane++; }
            lanes[lane] = c1;
            bars.push({ o: o, col: c0 + 1, span: c1 - c0 + 1, lane: lane + 1 });
          });
        out.push({ days: days, bars: bars });
      }
      return out;
    }

    function barHTML(b) {
      var o = b.o, m = meta(o), tight = b.span === 1;
      var sl = seatsLabel(o);
      var aria = m.name + ', ' + fmtRange(o) + ', ' + S.days_n.replace('%d', o.days) + (sl ? ', ' + sl : '');
      var pv =
        '<span class="aa-mcal-pv" aria-hidden="true">' +
          (m.track ? '<span class="aa-mcal-pv__track">' + esc(m.track) + '</span>' : '') +
          '<div class="aa-mcal-pv__name">' + esc(m.name) + '</div>' +
          '<div class="aa-mcal-pv__when">' + esc(fmtRange(o)) + ' · ' + esc(S.days_n.replace('%d', o.days)) +
            (o.hours ? '<br>' + esc(o.hours) : '') + '</div>' +
          '<div class="aa-mcal-pv__hr"></div>' +
          '<div class="aa-mcal-pv__row">' +
            (o.price ? '<span class="aa-mcal-pv__price">' + esc(money(o.price)) + '</span>' : '<span></span>') +
            (sl ? '<span class="aa-mcal-pill' + (o.seats <= 6 ? ' is-low' : '') + '">' + esc(sl) + '</span>' : '') +
          '</div>' +
          '<div class="aa-mcal-pv__go">' + esc(S.click_open) + '</div>' +
        '</span>';
      return '<span class="aa-mcal-slot" style="grid-column:' + b.col + ' / span ' + b.span +
        ';grid-row:' + b.lane + '">' +
        '<button type="button" class="aa-mcal-bar' + (o.i === sel ? ' is-sel' : '') +
          (tight ? ' is-tight' : '') + (o.past ? ' is-gone' : '') +
          '" data-i="' + o.i + '" aria-label="' + esc(aria) + '"' +
          ' style="--c:' + m.color + ';--tint:' + m.tint + ';--tb:' + m.tint_border + '">' +
          '<b>' + esc(m.code) + '</b><span class="n">' + esc(m.name) + '</span>' +
          '<i class="d">' + o.days + 'd</i>' +
        '</button>' + pv + '</span>';
    }

    function renderCal() {
      var y = view.getFullYear(), mo = view.getMonth();
      var weeks = weeksOf(y, mo);
      var inMonth = ev.filter(function (o) {
        return o.e >= new Date(y, mo, 1) && o.s <= new Date(y, mo + 1, 0);
      });
      var h = '<div class="aa-mcal-head"><div>' +
        '<span class="aa-mcal-eyebrow">' + esc(S.eyebrow) + '</span>' +
        '<h3 class="aa-mcal-title">' + esc((S.months[mo] || MON[mo]) + ' ' + y) + '</h3></div>' +
        '<div class="aa-mcal-nav">' +
          '<button type="button" data-nav="-1" aria-label="' + esc(S.prev) + '"' +
            (view <= new Date(today.getFullYear(), today.getMonth(), 1) ? ' disabled' : '') + '>&lsaquo;</button>' +
          '<button type="button" data-nav="1" aria-label="' + esc(S.next) + '"' +
            (view >= last ? ' disabled' : '') + '>&rsaquo;</button>' +
        '</div></div>';

      h += '<div class="aa-mcal-dows">';
      S.dow_long.forEach(function (n) { h += '<span>' + esc(n) + '</span>'; });
      h += '</div><div class="aa-mcal-weeks">';
      weeks.forEach(function (w) {
        h += '<div class="aa-mcal-week"><div class="aa-mcal-nums">';
        w.days.forEach(function (dd) {
          h += '<span class="' + (dd.out ? 'is-out' : '') + '">' + dd.num + '</span>';
        });
        h += '</div>';
        if (w.bars.length) {
          h += '<div class="aa-mcal-bars">' + w.bars.map(barHTML).join('') + '</div>';
        }
        h += '</div>';
      });
      h += '</div>';

      // Under ~720px the month grid is hidden by CSS and this list shows instead.
      h += '<div class="aa-mcal-agenda">';
      inMonth.forEach(function (o) {
        var m = meta(o), sl = seatsLabel(o);
        h += '<button type="button" class="aa-mcal-arow' + (o.i === sel ? ' is-sel' : '') +
          '" data-i="' + o.i + '" style="--c:' + m.color + '">' +
          '<i></i><span class="t"><b>' + esc(m.code + ' · ' + m.name) + '</b>' +
          '<span>' + esc(fmtRange(o) + ' · ' + S.days_n.replace('%d', o.days)) + '</span></span>' +
          (sl ? '<span class="aa-mcal-pill' + (o.seats <= 6 ? ' is-low' : '') + '">' + esc(sl) + '</span>' : '') +
          '</button>';
      });
      h += '</div>';

      if (!inMonth.length) { h += '<div class="aa-mcal-empty">' + esc(S.empty) + '</div>'; }

      var seen = {}, leg = '';
      inMonth.forEach(function (o) {
        var m = meta(o);
        if (seen[m.track || m.code]) { return; }
        seen[m.track || m.code] = 1;
        leg += '<span class="aa-mcal-key" style="--c:' + m.color + '"><i></i>' + esc(m.track || m.code) + '</span>';
      });
      if (leg) { h += '<div class="aa-mcal-legend">' + leg + '</div>'; }
      root.querySelector('.aa-mcal__cal').innerHTML = h;
    }

    function renderPanel() {
      var el = root.querySelector('.aa-mcal__panel');
      if (sel === null) {
        el.innerHTML = '<p class="aa-mcal-hint">' + esc(S.pick_hint) + '</p>';
        return;
      }
      var o = ev[sel], m = meta(o), sl = seatsLabel(o);
      var facts = [
        [S.f_dates, fmtRange(o), false],
        [S.f_schedule, S.days_n.replace('%d', o.days) + (o.hours ? ' · ' + o.hours : ''), false]
      ];
      // Only facts we actually hold. An unpopulated instructor or seat count is
      // omitted, never rendered as "TBC".
      if (o.instructor) { facts.push([S.f_instructor, o.instructor, false]); }
      else if (m.pdus)  { facts.push([S.f_pdus, m.pdus, false]); }
      if (sl) { facts.push([S.f_seats, sl, o.seats <= 6]); }

      var h = '<div class="aa-mcal-sel"><i></i>' + esc(S.selected) + '</div>' +
        '<div class="aa-mcal-rule" style="--c:' + m.color + '"></div>' +
        (m.track ? '<div class="aa-mcal-track">' + esc(m.track) + '</div>' : '') +
        '<h4 class="aa-mcal-name">' + esc(m.name) + '</h4>' +
        (m.desc ? '<p class="aa-mcal-desc">' + esc(m.desc) + '</p>' : '') +
        '<dl class="aa-mcal-facts">' + facts.map(function (f) {
          return '<div class="aa-mcal-fact"><dt>' + esc(f[0]) + '</dt>' +
            '<dd' + (f[2] ? ' class="is-low"' : '') + '>' + esc(f[1]) + '</dd></div>';
        }).join('') + '</dl>' +
        ((m.bullets && m.bullets.length)
          ? '<ul class="aa-mcal-inc">' + m.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>'
          : '');

      h += '<div class="aa-mcal-reg">' +
        (o.price ? '<div class="aa-mcal-price">' + esc(money(o.price)) +
          '<small>' + esc(S.exam_incl) + '</small></div>' : '') +
        '<a class="aa-mcal-cta" href="' + esc(regHref(o)) + '" data-reg="' + o.i + '">' +
          esc(S.register) + '</a>' +
        '<p class="aa-mcal-note">' + esc(S.reassure) + '</p>' +
        '<a class="aa-mcal-more" href="' + esc(m.url) + '">' + esc(S.course_page) + '</a>' +
        '</div>';
      el.innerHTML = h;
    }

    function render() { renderCal(); renderPanel(); }

    /* Keep the preview inside the viewport. The prototype did not flip; the
       handoff asks production to, and without it a bar in the last column or
       bottom week opens its card off-screen. */
    function place(slot) {
      var pv = slot.querySelector('.aa-mcal-pv');
      if (!pv) { return; }
      pv.classList.remove('flip-x', 'flip-y');
      var r = pv.getBoundingClientRect();
      if (r.right > window.innerWidth - 8) { pv.classList.add('flip-x'); }
      if (r.bottom > window.innerHeight - 8) { pv.classList.add('flip-y'); }
    }

    root.addEventListener('click', function (e) {
      var nav = e.target.closest('[data-nav]');
      if (nav) {
        view = new Date(view.getFullYear(), view.getMonth() + (+nav.getAttribute('data-nav')), 1);
        render();
        return;
      }
      var reg = e.target.closest('[data-reg]');
      if (reg && cfg.link === 'enroll') {
        // Same page: hand the cohort to the enrol form rather than navigating.
        e.preventDefault();
        var o = ev[+reg.getAttribute('data-reg')];
        if (typeof window.AA_PICK === 'function') {
          try { window.AA_PICK(fmtRange(o), o.id); } catch (err) {}
        }
        var target = document.getElementById('enroll');
        if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        return;
      }
      var bar = e.target.closest('[data-i]');
      if (bar) {
        sel = +bar.getAttribute('data-i');
        hov = null;
        render();
        if (window.matchMedia && window.matchMedia('(max-width:1023px)').matches) {
          root.querySelector('.aa-mcal__panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });

    // Hover and focus must behave identically — the bars are buttons and a
    // keyboard user has to get the same preview a mouse user gets.
    function show(e) {
      var b = e.target.closest('.aa-mcal-bar');
      if (!b) { return; }
      var slot = b.parentNode;
      slot.classList.add('is-hov');
      place(slot);
    }
    function hide(e) {
      var b = e.target.closest('.aa-mcal-bar');
      if (b) { b.parentNode.classList.remove('is-hov'); }
    }
    root.addEventListener('mouseover', show);
    root.addEventListener('mouseout', hide);
    root.addEventListener('focusin', show);
    root.addEventListener('focusout', hide);

    render();
  }

  function init() {
    [].forEach.call(document.querySelectorAll('.aa-mcal'), boot);
  }
  if (document.readyState !== 'loading') { init(); }
  else { document.addEventListener('DOMContentLoaded', init); }
})();
</script>
AA_MCAL_ASSETS;

	if ( $a['debug'] && current_user_can( 'manage_options' ) ) {
		$html .= '<pre style="font-size:11px;white-space:pre-wrap">' . esc_html( "aa_mini_calendar\n" . implode( "\n", $dbg ) ) . '</pre>';
	}
	return $html;
}

add_shortcode( 'aa_mini_calendar', 'aa_mcal_render' );

/**
 * TAKEOVER of the old Xylus calendar shortcodes — zero page edits needed.
 *
 *   [easy_events_calendar]                the big training-page calendar ->
 *                                         full-width stripes, course links
 *   [easy_event_calendar_mini ...]        the per-course mini -> compact
 *                                         stripes, own registration
 *
 * Every page keeps its existing shortcode untouched; deactivating this
 * snippet hands both back to the Xylus plugin — that is the whole undo.
 *
 * Done TWO ways, because re-registering alone is not reliable here.
 *
 *   1. pre_do_shortcode_tag (the one that actually decides). This filter
 *      runs immediately before WordPress calls whichever handler is
 *      registered, and returning anything other than false short-circuits
 *      that handler. It does not care who registered the tag or when, so it
 *      works no matter how late WPCode loads this snippet.
 *
 *   2. add_shortcode at init:99, kept as a plain re-registration.
 *
 * The first attempt used (2) alone, on the reasoning that WordPress hands a
 * shortcode to whichever handler registered it LAST. That is true, but it
 * assumes this file is executed before init:99 has already fired — and a
 * snippet manager that runs its PHP on a later hook silently loses the race,
 * leaving the old calendar rendering with nothing to show for it. Reproduced:
 * with init already over, (2) alone hands both tags back to the old plugin,
 * while (1) takes them over either way. Whether that is what happened on the
 * live site is unconfirmed — it is simply a failure mode this no longer has.
 */
function aa_mcal_takeover( $tag, $atts ) {
	$a = shortcode_atts( array( 'category' => '', 'lang' => 'en' ), $atts, $tag );
	$args = array( 'category' => $a['category'], 'lang' => $a['lang'] );
	if ( $tag === 'easy_events_calendar' ) {
		// The hub-page calendar: full width, stripes link to course pages.
		$args['link'] = 'course';
		$args['wide'] = '1';
	}
	return aa_mcal_render( $args );
}

add_filter( 'pre_do_shortcode_tag', function ( $short, $tag, $attr ) {
	if ( $tag === 'easy_events_calendar' || $tag === 'easy_event_calendar_mini' ) {
		// $attr is '' rather than array() when the shortcode carries none.
		return aa_mcal_takeover( $tag, is_array( $attr ) ? $attr : array() );
	}
	return $short;
}, 10, 3 );

add_action( 'init', function () {
	add_shortcode( 'easy_events_calendar', function ( $atts ) {
		return aa_mcal_takeover( 'easy_events_calendar', $atts );
	} );
	add_shortcode( 'easy_event_calendar_mini', function ( $atts ) {
		return aa_mcal_takeover( 'easy_event_calendar_mini', $atts );
	} );
}, 99 );

/**
 * "Is this snippet actually running?" — [aa_mcal_selftest]
 *
 * Drop it on any page while logged in as an administrator. It prints what
 * this file can see: whether the takeover filter is attached, who currently
 * owns each old shortcode tag, and whether the current page is on the
 * suppression list. Nothing renders for logged-out visitors, so it is safe
 * to leave in place. Answers the one question a screenshot cannot: whether
 * the old calendar is still showing because the snippet lost, or because
 * the snippet never ran at all.
 */
add_shortcode( 'aa_mcal_selftest', function () {
	if ( ! current_user_can( 'manage_options' ) ) { return ''; }
	$owner = function ( $tag ) {
		global $shortcode_tags;
		if ( ! isset( $shortcode_tags[ $tag ] ) ) { return 'not registered'; }
		$cb = $shortcode_tags[ $tag ];
		if ( is_string( $cb ) ) { return $cb; }
		if ( is_array( $cb ) ) { return ( is_object( $cb[0] ) ? get_class( $cb[0] ) : $cb[0] ) . '::' . $cb[1]; }
		return 'closure';
	};
	// If this shortcode rendered at all, the file loaded and both filters
	// were attached with it — they are added unconditionally above. What is
	// worth printing is who ended up owning the tags, and this page's verdict.
	$lines = array(
		'snippet file            : loaded (this box proves it)',
		'takeover filter         : attached',
		'easy_events_calendar    : ' . $owner( 'easy_events_calendar' ),
		'easy_event_calendar_mini: ' . $owner( 'easy_event_calendar_mini' ),
		'cohorts section here    : ' . ( aa_mcal_hide_here() ? 'suppressed' : 'kept' ),
	);
	return '<pre style="font:12px/1.5 monospace;background:#F5FAFA;border:1px solid #CFE3E3;padding:12px;white-space:pre-wrap">'
		. esc_html( implode( "\n", $lines ) ) . '</pre>';
} );

/* ============================================================================
   PAGES THAT SHOULD CARRY NO CALENDAR AT ALL
   ----------------------------------------------------------------------------
   /training/safe-industry/ and /training/safe-found/ each hold a section built
   around [easy_events_calendar] — an eyebrow, an H2, a sub-line, the calendar,
   and a hidden [wp_events] feed that exists only to supply it. Suppressing the
   shortcode alone would leave the heading standing over nothing, so the whole
   section goes.

   This is done at render time rather than by editing the two pages: the page
   markup stays exactly as it is, the section is simply never emitted, and
   deactivating this snippet restores it. Because it is never emitted, it is
   also gone for crawlers and for anything reading the page as text — which a
   display:none rule would not achieve.

   To bring a calendar back on one of these pages, delete its slug from
   aa_mcal_hidden_slugs(). To retire the section for good, delete the block in
   the editor and this filter stops matching anything.
   ========================================================================== */

/** Page slugs whose cohorts section is dropped. Both are unique site-wide. */
function aa_mcal_hidden_slugs() {
	return array( 'safe-industry', 'safe-found' );
}

/**
 * True when the page whose content is being rendered is one of those.
 * Resolved once per request.
 *
 * Deliberately not gated on is_page(): that is false whenever the content is
 * rendered outside a normal front-end page view — a REST render, or a cache
 * being primed through one — and gating on it would let the suppressed
 * section come back in exactly those contexts, including into a cache entry
 * later served to visitors. So the queried object is used when there is one
 * and the post being rendered otherwise. is_admin() still excludes the
 * editor, where the block must stay visible and editable.
 */
function aa_mcal_hide_here() {
	static $hide = null;
	if ( $hide !== null ) { return $hide; }
	$hide = false;
	if ( ! is_admin() ) {
		$obj = get_queried_object();
		if ( ! ( $obj instanceof WP_Post ) && isset( $GLOBALS['post'] ) ) {
			$obj = $GLOBALS['post'];
		}
		if ( $obj instanceof WP_Post && $obj->post_type === 'page' ) {
			$hide = in_array( $obj->post_name, aa_mcal_hidden_slugs(), true );
		}
	}
	return $hide;
}

/** Does this block, or anything nested inside it, embed the big calendar? */
function aa_mcal_holds_calendar( $block ) {
	if ( isset( $block['blockName'] ) && $block['blockName'] === 'core/shortcode'
		&& isset( $block['innerHTML'] ) && strpos( $block['innerHTML'], 'easy_events_calendar' ) !== false ) {
		return true;
	}
	if ( ! empty( $block['innerBlocks'] ) ) {
		foreach ( $block['innerBlocks'] as $child ) {
			if ( aa_mcal_holds_calendar( $child ) ) { return true; }
		}
	}
	return false;
}

add_filter( 'render_block', function ( $html, $block ) {
	// Cheapest test first — this filter runs for every block on every page.
	if ( empty( $block['blockName'] ) || $block['blockName'] !== 'core/group' ) { return $html; }
	if ( ! aa_mcal_hide_here() ) { return $html; }
	// Only the section wrapper, so the match fires once and not again for the
	// inner .aa-sechead / .aa-feed-src groups nested inside it.
	$cls = isset( $block['attrs']['className'] ) ? $block['attrs']['className'] : '';
	if ( strpos( $cls, 'aa-sec' ) === false ) { return $html; }
	return aa_mcal_holds_calendar( $block ) ? '' : $html;
}, 10, 2 );
