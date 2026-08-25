<?php
/**
 * Agile Agilist — COURSE CALENDAR  [aa_mini_calendar]
 * -----------------------------------------------------------------------------
 * Replaces the Xylus calendar, driven by our own schedule and registration:
 *   post type wp_events · taxonomy event_category · meta start_ts/end_ts
 *   optional per-cohort meta: seats_left · price · hours · instructor
 *
 * THREE SNIPPETS, one per kind. The CSS and the JS do NOT belong in here.
 *   1. WPCode -> CSS Snippet        "AA - Calendar CSS"  <- aa-calendar.css
 *   2. WPCode -> JavaScript Snippet "AA - Calendar JS"   <- aa-calendar.js
 *                                   (Site Wide Footer, like "AA - Home JS")
 *   3. WPCode -> PHP Snippet        "AA - Calendar PHP"  <- this file
 *                                   (Auto Insert, Run Everywhere)
 *
 * An earlier build inlined the CSS and JS in a nowdoc, making this a 60KB
 * paste into a browser code editor. What WPCode stored came back corrupted —
 * its tail held a stray top-level statement present in no version of the
 * source — and a snippet that errors takes the snippets queued behind it with
 * it, which is how the homepage cohort panel died alongside this calendar.
 * Splitting by snippet type cut this file by half and removed both the nowdoc
 * and every backslash from the PHP.
 *
 * Shortcodes: [aa_mini_calendar category="aspc" link="course" lang="es"
 * months="6" wide="1"] and the admin-only [aa_mcal_selftest]. This file also
 * takes over [easy_events_calendar] and [easy_event_calendar_mini], so pages
 * embedding those switch over with no page edits; deactivating hands them
 * back to the Xylus plugin. Full behaviour: snippets/CALENDAR.md
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/* DOUBLE-LOAD GUARD. If another copy of this code is active — an older WPCode
   snippet left beside this one, or the mu-plugin version — declaring these
   functions again is a PHP FATAL, and WPCode's error protection answers a
   fatal by silently deactivating the snippet: "the shortcode stopped working
   right after we updated the code."

   The whole body is wrapped in this conditional because that is the only
   placement that works. PHP binds unconditional top-level functions at
   COMPILE time, before any statement runs — an early `return` guard neither
   stops the redeclare fatal on the second copy nor lets the first copy run
   (its own functions already exist by the time it executes). Inside a
   conditional, declaration happens at runtime: first copy runs everything,
   second copy skips everything. */
if ( ! function_exists( 'aa_mcal_render' ) ) :

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
			'url' => '/training/adv-safe/aspc/', 'days' => 3, 'pdus' => 24, 'exam_q' => 60, 'exam_m' => 120,
			'desc' => 'Deepen your consulting practice beyond SPC — advanced coaching, measuring transformation outcomes, and guiding complex enterprise…' ),
		'spc'              => array( 'code' => 'SPC',     'name' => 'SAFe Practice Consultant Certification',
			'track' => 'Advanced SAFe', 'color' => '#1F6FB2', 'tint' => '#E8F1F9', 'tint_border' => '#C7DEEF',
			'url' => '/training/adv-safe/spc/', 'days' => 4, 'pdus' => 32, 'exam_q' => 60, 'exam_m' => 180,
			'desc' => 'Become the change agent who can teach SAFe, launch Agile Release Trains, and lead an enterprise transformation end-to-end. Four…' ),
		'rte'              => array( 'code' => 'RTE',     'name' => 'SAFe RTE Certification',
			'track' => 'Advanced SAFe', 'color' => '#1F6FB2', 'tint' => '#E8F1F9', 'tint_border' => '#C7DEEF',
			'url' => '/training/adv-safe/rte/', 'days' => 3, 'pdus' => 24, 'exam_q' => 60, 'exam_m' => 180,
			'desc' => 'Become the servant leader and coach of the Agile Release Train — facilitating ART events and processes, driving relentless…' ),
		'lpm'              => array( 'code' => 'LPM',     'name' => 'SAFe LPM Certification',
			'track' => 'Portfolio & Lean', 'color' => '#7A4FA3', 'tint' => '#F1EAF7', 'tint_border' => '#DCC9EA',
			'url' => '/training/adv-safe/lpm/', 'days' => 2, 'pdus' => 16, 'exam_q' => 45, 'exam_m' => 90,
			'desc' => 'Align strategy and execution by applying Lean and systems thinking to portfolio strategy, funding, and operations — connecting…' ),
		'apm'              => array( 'code' => 'APM',     'name' => 'SAFe APM Certification',
			'track' => 'Portfolio & Lean', 'color' => '#7A4FA3', 'tint' => '#F1EAF7', 'tint_border' => '#DCC9EA',
			'url' => '/training/adv-safe/apm/', 'days' => 3, 'pdus' => 24, 'exam_q' => 60, 'exam_m' => 120,
			'desc' => 'Use design thinking and a Lean-Agile mindset to discover, build, and bring to market products customers love — from vision and…' ),
		'sa'               => array( 'code' => 'SA',      'name' => 'SAFe Agilist Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/sa/', 'days' => 2, 'pdus' => 16, 'exam_q' => 45, 'exam_m' => 90,
			'desc' => 'Lead a Lean-Agile transformation by applying SAFe® and its principles of Lean, systems thinking, and agile development. Two days…' ),
		'ssm'              => array( 'code' => 'SSM',     'name' => 'SAFe Scrum Master Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/scrum-master/', 'days' => 2, 'pdus' => 15, 'exam_q' => 45, 'exam_m' => 90,
			'desc' => 'Become the Scrum Master who facilitates Agile teams within a SAFe enterprise — running team and program events, supporting PI…' ),
		'popm'             => array( 'code' => 'POPM',    'name' => 'SAFe POPM Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/popm/', 'days' => 2, 'pdus' => 15, 'exam_q' => 45, 'exam_m' => 90,
			'desc' => 'Master the responsibilities of the Product Owner and Product Manager in a SAFe enterprise — writing stories, managing backlogs…' ),
		'sdp'              => array( 'code' => 'SDP',     'name' => 'SAFe DevOps Practitioner Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/devops/', 'days' => 2, 'pdus' => 16, 'exam_q' => 45, 'exam_m' => 90,
			'desc' => 'Map your Continuous Delivery Pipeline, optimise the flow of value from idea to production, and build the culture, automation, and…' ),
		'sasm'             => array( 'code' => 'SASM',    'name' => 'SAFe Advanced Scrum Master Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/asm/', 'days' => 2, 'pdus' => 16, 'exam_q' => 60, 'exam_m' => 120,
			'desc' => 'Take your Scrum Master practice to the program level — facilitating cross-team interactions, supporting DevOps and built-in…' ),
		'asm'              => array( 'code' => 'SASM',    'name' => 'SAFe Advanced Scrum Master Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/asm/', 'days' => 2, 'pdus' => 16, 'exam_q' => 60, 'exam_m' => 120,
			'desc' => 'Take your Scrum Master practice to the program level — facilitating cross-team interactions, supporting DevOps and built-in…' ),
		'sp'               => array( 'code' => 'SP',      'name' => 'SAFe Practitioner Certification',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe-industry/team-practitioner/', 'days' => 2, 'pdus' => 15, 'exam_q' => 45, 'exam_m' => 90,
			'desc' => 'Build the skills to be a high-performing member of an Agile Release Train — how to plan and execute work, collaborate across…' ),
		'bo'               => array( 'code' => 'BO',      'name' => 'SAFe® Business Owner',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe/bo/', 'days' => 0, 'pdus' => 0, 'exam_q' => 0, 'exam_m' => 0,
			'desc' => '' ),
		'arch'             => array( 'code' => 'ARCH',    'name' => 'SAFe Architect Certification',
			'track' => 'Advanced SAFe', 'color' => '#1F6FB2', 'tint' => '#E8F1F9', 'tint_border' => '#C7DEEF',
			'url' => '/training/safe-industry/arch/', 'days' => 3, 'pdus' => 24, 'exam_q' => 60, 'exam_m' => 120,
			'desc' => 'Lead the architecture of large solutions in a Lean-Agile enterprise — aligning architecture with business value, enabling…' ),
		'ase'              => array( 'code' => 'ASE',     'name' => 'SAFe Agile Software Engineer Certification',
			'track' => 'Advanced SAFe', 'color' => '#1F6FB2', 'tint' => '#E8F1F9', 'tint_border' => '#C7DEEF',
			'url' => '/training/safe-industry/ase/', 'days' => 3, 'pdus' => 24, 'exam_q' => 60, 'exam_m' => 120,
			'desc' => 'Build the technical practices that make continuous delivery real — test-first, behaviour-driven development, and Agile…' ),
		'sagov'            => array( 'code' => 'SA-GOV',  'name' => 'Leading SAFe® for Government',
			'track' => 'SAFe by Role', 'color' => '#0E8074', 'tint' => '#E7F2F0', 'tint_border' => '#C6E1DC',
			'url' => '/training/safe-industry/sa-gov/', 'days' => 0, 'pdus' => 0, 'exam_q' => 0, 'exam_m' => 0,
			'desc' => '' ),
		'ai-native'        => array( 'code' => 'AINF',    'name' => 'AI-Native Foundations Certification',
			'track' => 'AI-Native', 'color' => '#D34B2A', 'tint' => '#FBEAE4', 'tint_border' => '#F2CDC0',
			'url' => '/training/ai-native/', 'days' => 2, 'pdus' => 16, 'exam_q' => 45, 'exam_m' => 90,
			'desc' => 'Extend SAFe into the AI age — AI-Native ways of working, an AI Enablement layer, and Innovation Culture baked into delivery…' ),
		'micro-conflict'   => array( 'code' => 'CONFLICT', 'name' => 'Advanced Facilitator: Conflict & Collaboration',
			'track' => 'Micro-Credentials', 'color' => '#2E7D5B', 'tint' => '#E7F3ED', 'tint_border' => '#C6E3D5',
			'url' => '/training/safe-found/conflict-collaboration/', 'days' => 0, 'pdus' => 0, 'exam_q' => 0, 'exam_m' => 0,
			'desc' => '' ),
		'micro-vsm'        => array( 'code' => 'VSM',     'name' => 'Advanced Facilitator: Value Stream Mapping',
			'track' => 'Micro-Credentials', 'color' => '#2E7D5B', 'tint' => '#E7F3ED', 'tint_border' => '#C6E3D5',
			'url' => '/training/safe-found/value-stream-mapping/', 'days' => 0, 'pdus' => 0, 'exam_q' => 0, 'exam_m' => 0,
			'desc' => '' ),
		'micro-rai'        => array( 'code' => 'RAI',     'name' => 'Achieving Responsible AI with SAFe',
			'track' => 'Micro-Credentials', 'color' => '#2E7D5B', 'tint' => '#E7F3ED', 'tint_border' => '#C6E3D5',
			'url' => '/training/safe-found/responsible-ai-safe/', 'days' => 0, 'pdus' => 0, 'exam_q' => 0, 'exam_m' => 0,
			'desc' => '' ),
		'micro-gov'        => array( 'code' => 'GOV',     'name' => 'Agile Contracting for Government',
			'track' => 'Micro-Credentials', 'color' => '#2E7D5B', 'tint' => '#E7F3ED', 'tint_border' => '#C6E3D5',
			'url' => '/training/safe-found/agile-contracting-government/', 'days' => 0, 'pdus' => 0, 'exam_q' => 0, 'exam_m' => 0,
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
			'b_live' => '%d days live-virtual, instructor-led', 'b_exam' => 'Certification exam fee included',
			'b_pdus' => '%d PDUs / SEUs', 'b_examfmt' => 'Exam: %q multiple-choice · %m minutes',
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
			'b_live' => '%d días en vivo, con instructor', 'b_exam' => 'Tasa de examen incluida',
			'b_pdus' => '%d PDUs / SEUs', 'b_examfmt' => 'Examen: %q preguntas tipo test · %m minutos',
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
			'b_live' => '%d jours en direct, avec formateur', 'b_exam' => "Frais d'examen inclus",
			'b_pdus' => '%d PDUs / SEUs', 'b_examfmt' => 'Examen : %q questions à choix multiple · %m minutes',
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

	$rows    = array();
	$seen    = array();   // course+dates already taken, for dedup
	$catalog = aa_mcal_catalog();
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

		/* DEDUPLICATE. The same class can exist as more than one wp_events post
		   — an Eventbrite import alongside a hand-made entry, a re-import, or
		   one class tagged with two terms that mean the same course (sasm and
		   asm both resolve to SASM). All of those render as two identical bars
		   stacked on the same days, which is what "two running on Aug 27"
		   looks like.

		   The key is COURSE CODE plus the two dates, not the term slug, so the
		   alias case collapses too. The first post wins, but any optional fact
		   it is missing is filled in from the duplicate: if the import carries
		   the dates and the manual entry carries seats_left, keeping only one
		   of them blindly would throw away real data. */
		$code = isset( $catalog[ $slug ] ) ? $catalog[ $slug ]['code'] : strtoupper( $slug );
		$dkey = $code . '|' . $row['s'] . '|' . $row['e'];
		if ( isset( $seen[ $dkey ] ) ) {
			$first = $seen[ $dkey ];
			foreach ( array( 'seats', 'price', 'hours', 'instructor' ) as $k ) {
				if ( ! isset( $rows[ $first ][ $k ] ) && isset( $row[ $k ] ) ) {
					$rows[ $first ][ $k ] = $row[ $k ];
				}
			}
			$dbg[] = $dkey . ' DUPLICATE of post ' . $rows[ $first ]['id'] . ' — merged, not shown';
			continue;
		}
		$seen[ $dkey ] = count( $rows );

		$rows[] = $row;
		$dbg[]  = $slug . ' ' . $s->format( 'Y-m-d' ) . '..' . $e->format( 'Y-m-d' )
		        . ( isset( $row['seats'] ) ? ' seats=' . $row['seats'] : ' seats=?' )
		        . ( isset( $row['price'] ) ? ' price=' . $row['price'] : '' );
	}
	set_transient( $key, $rows, 10 * MINUTE_IN_SECONDS );
	return $memo[ $key ] = $rows;
}

function aa_mcal_render( $atts ) {
	static $instance = 0;
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
			         'url' => '/training/', 'desc' => '' );
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

endif; // double-load guard
