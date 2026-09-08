<?php
/**
 * AA – TRACK LANDING PAGE  [aa_training_category category="adv-safe"]
 * -----------------------------------------------------------------------------
 * The five training category pages, in the design from the training-category
 * handoff, built on our own data.
 *
 * WHAT COMES FROM WHERE, and why it matters:
 *
 *   courses, prices, durations, cohorts   aa_reg_course() / aa_reg_upcoming()
 *   headline, opening, chips              aa_training_copy()
 *
 * The handoff hand-maintains prices and cohorts in a JS data file, and its own
 * notes flag the prices for ai-native and safe-roles as placeholders. They were
 * wrong: it lists Leading SAFe at $1,095 where the site charges $997, and
 * AI-Native Value Architect at $2,295 where the site charges $2,500. A landing
 * page quoting a price the checkout does not honour is worse than no landing
 * page, so every figure here is read from the same table the checkout reads.
 *
 * Hand-maintained cohorts are the same trap one level down: that is exactly
 * what left /training/ai-native/ showing an empty calendar. Nothing on this
 * page is entered by hand twice.
 *
 * SECTIONS. Hero and calendar are built here. Career impact, certification
 * costs and roles-in-demand need salary bands, role definitions and live
 * postings -- genuinely editorial content that is not in any system yet -- so
 * they are deliberately absent rather than filled with invented numbers.
 * Adding them is a data edit once that content exists.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Which courses belong to which track. Slugs, resolved through aa_reg_course(). */
function aa_training_courses( $cat ) {
	$map = array(
		'adv-safe'      => array( 'spc', 'aspc', 'rte', 'apm', 'lpm', 'arch', 'large-solution' ),
		'safe-roles'    => array( 'sa', 'scrum-master', 'popm', 'asm', 'devops', 'team-practitioner', 'bo' ),
		'ai-native'     => array( 'ai-native-foundations', 'ai-native-change-agent', 'ai-native-ready-certification-2' ),
		'safe-found'    => array(),
		'safe-industry' => array(),
	);
	return isset( $map[ $cat ] ) ? $map[ $cat ] : array();
}

function aa_training_category_shortcode( $atts ) {
	$a = shortcode_atts( array( 'category' => 'adv-safe', 'h' => 'h1' ), $atts, 'aa_training_category' );

	$copy = aa_training_copy();
	$cat  = $a['category'];
	if ( ! isset( $copy[ $cat ] ) ) { return ''; }
	$c = $copy[ $cat ];

	$slugs = aa_training_courses( $cat );
	if ( ! $slugs ) { return ''; }

	/* Resolve courses once. A slug that will not resolve is skipped rather than
	   rendered as a broken row -- Large Solution has no page yet, and a course
	   with no page cannot be registered for. */
	$courses = array();
	foreach ( $slugs as $slug ) {
		$course = aa_reg_course( $slug );
		if ( $course && ! empty( $course['url'] ) ) { $courses[ $slug ] = $course; }
	}
	if ( ! $courses ) { return ''; }

	/* Next cohort per course, and the soonest overall -- the hero's default. */
	$next = array();
	foreach ( $courses as $slug => $course ) {
		$up = aa_reg_upcoming( $slug, $course );
		if ( $up ) { $next[ $slug ] = $up[0]; }
	}
	if ( ! $next ) { return ''; }
	uasort( $next, function ( $x, $y ) { return strcmp( $x['start'], $y['start'] ); } );
	$first_slug = key( $next );
	$first      = $next[ $first_slug ];
	$fc         = $courses[ $first_slug ];

	/* One <h1> per page. The pages already carry their own heading in some
	   cases, so h="h2" demotes this rather than shipping a second one. */
	$H = ( $a['h'] === 'h2' ) ? 'h2' : 'h1';

	$h  = '<section class="aat-hero"' . aa_reg_dir_attr() . '><div class="aat-hero__grid"><div>';
	$h .= '<div class="aat-hero__kicker"><b>' . esc_html( $c['label'] ) . '</b><i></i><span>'
	    . esc_html( $c['kicker'] ) . '</span></div>';
	$h .= '<' . $H . ' class="aat-hero__h">' . esc_html( $c['title'] )
	    . ' <em>' . esc_html( $c['accent'] ) . '</em></' . $H . '>';
	$h .= '<p class="aat-hero__sub">' . esc_html( $c['sub'] ) . '</p>';

	if ( ! empty( $c['points'] ) ) {
		$h .= '<ul class="aat-hero__points">';
		foreach ( $c['points'] as $p ) { $h .= '<li>' . esc_html( $p ) . '</li>'; }
		$h .= '</ul>';
	}

	$h .= '<div class="aat-hero__btns">'
	    . '<a class="aat-cta" href="#cohorts">' . esc_html( aa_reg_t( 'see_dates', 'See all dates' ) )
	    . ' <span class="aat-cta__arrow">&#10230;</span></a>'
	    . '<a class="aat-btn2" href="/assessments/cert-recommender/">'
	    . esc_html( aa_reg_t( 'find_cert', 'Find my certification' ) ) . '</a></div>';
	$h .= '<p class="aat-hero__foot">' . esc_html( $c['comp'] ) . '</p>';
	$h .= '</div>';

	/* The registration card. Every option is a real cohort at a real price, and
	   choosing one goes to that course's own enrol section with it preselected
	   -- the same contract the home page picker uses. The purchase happens in
	   one place, which is also the only place seats and price are
	   authoritative. */
	$h .= '<div class="aat-reg"><div class="aat-reg__head"><strong>'
	    . esc_html( aa_reg_t( 'register_now', 'Register' ) ) . '</strong><span>'
	    . esc_html( sprintf( aa_reg_t( 'n_courses', '%d certifications' ), count( $courses ) ) )
	    . '</span></div><div class="aat-reg__body">';

	$h .= '<label class="aat-field"><span>' . esc_html( aa_reg_t( 'certification', 'Certification' ) ) . '</span>'
	    . '<span class="aat-select"><select data-aatr-course>';
	foreach ( $courses as $slug => $course ) {
		if ( ! isset( $next[ $slug ] ) ) { continue; }
		$n = $next[ $slug ];
		$h .= '<option value="' . esc_attr( $slug ) . '"' . ( $slug === $first_slug ? ' selected' : '' )
		    . ' data-url="' . esc_attr( $course['url'] . ( strpos( $course['url'], '?' ) === false ? '?' : '&' )
		      . 'cohort=' . rawurlencode( $n['id'] ) . '#enroll' ) . '"'
		    . ' data-price="' . esc_attr( aa_reg_money( $course['price'], $course['currency'] ) ) . '"'
		    . ' data-days="' . (int) $course['days'] . '"'
		    . ' data-range="' . esc_attr( aa_reg_range( $n['start'], $n['end'] ) ) . '">'
		    . esc_html( $course['name'] ) . '</option>';
	}
	$h .= '</select></span></label>';

	$h .= '<div class="aat-reg__facts">'
	    . '<div><span>' . esc_html( aa_reg_t( 'next_batch', 'Next batch' ) ) . '</span>'
	    . '<b data-aatr-range>' . esc_html( aa_reg_range( $first['start'], $first['end'] ) ) . '</b></div>'
	    . '<div><span>' . esc_html( aa_reg_t( 'duration', 'Duration' ) ) . '</span>'
	    . '<b data-aatr-days>' . (int) $fc['days'] . ' ' . esc_html( aa_reg_t( 'days_l', 'days' ) ) . '</b></div>'
	    . '<div><span>' . esc_html( aa_reg_t( 'investment', 'Investment' ) ) . '</span>'
	    . '<b data-aatr-price>' . esc_html( aa_reg_money( $fc['price'], $fc['currency'] ) ) . '</b></div>'
	    . '</div>';

	$h .= '<a class="aat-cta aat-reg__go" data-aatr-go href="'
	    . esc_url( $fc['url'] . ( strpos( $fc['url'], '?' ) === false ? '?' : '&' )
	      . 'cohort=' . rawurlencode( $first['id'] ) . '#enroll' ) . '">'
	    . esc_html( aa_reg_t( 'register_now', 'Register' ) ) . ' <span class="aat-cta__arrow">&#10230;</span></a>';
	$h .= '<p class="aat-reg__note">' . esc_html( aa_reg_t( 'exam_included', 'exam included' ) ) . ' &middot; '
	    . esc_html( aa_reg_t( 'resched', 'reschedule at no fee' ) ) . '</p>';

	$h .= '</div></div></div></section>';

	/* The calendar, already built and already sourced from the same cohorts. */
	$h .= '<section id="cohorts" class="aat-cohorts-sec">'
	    . aa_reg_track_calendar( array( 'courses' => implode( ',', array_keys( $courses ) ), 'months' => 6 ) )
	    . '</section>';

	return $h;
}
add_shortcode( 'aa_training_category', 'aa_training_category_shortcode' );
