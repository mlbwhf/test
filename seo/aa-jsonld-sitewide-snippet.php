<?php
/**
 * Agile Agilist — sitewide JSON-LD injector
 *
 * WPCode "PHP Snippet" (or child-theme functions.php). Runs on every
 * front-end request, picks the right schema types for the current URL,
 * and emits validated JSON-LD into <head>.
 *
 * DEPLOY:
 *  - WPCode → Add New → PHP Snippet → paste this file → Location
 *    "Site Wide Header" → Save → Activate.
 *  - Alternatively, drop into the child theme's functions.php.
 *
 * VERIFY:
 *  - View a course page → View Source → search for `application/ld+json`.
 *  - Paste each block into search.google.com/test/rich-results.
 *  - Re-test after each edit to this file.
 *
 * WHY sitewide, not per-page:
 *  - AIOSEO / manual paste per page rots. Editors forget it on new pages.
 *  - Course dates and prices come from a single source of truth (the
 *    $AA_COURSES array below) — one edit propagates everywhere.
 *  - LocalBusiness per city is one loop, not 6 duplicated pastes.
 *
 * @package  agileagilist-seo
 * @version  1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* ============================================================
 * 1. Single source of truth for course pages
 *    Edit dates, price, provider once — schema follows.
 * ============================================================ */
function aa_jsonld_courses() {
	// Provider block reused on every course.
	$provider = array(
		'@type'  => 'Organization',
		'name'   => 'Agile Agilist',
		'sameAs' => 'https://agile-agilist.com',
	);

	return array(
		// URL path (without host, with trailing slash) => Course data.
		'/training/safe/sa/'                       => array(
			'name'        => 'Leading SAFe® (SAFe Agilist / SA) Certification',
			'description' => 'Leading SAFe® / SAFe Agilist certification — SPCT-led, live-virtual, exam included, pass guarantee.',
			'price'       => '850',
			'currency'    => 'USD',
			'provider'    => $provider,
			// Real dates ship as CourseInstance children. Update or empty as needed.
			'instances'   => array(
				array( 'start' => '2026-07-09', 'end' => '2026-07-10', 'mode' => 'online' ),
				array( 'start' => '2026-08-13', 'end' => '2026-08-14', 'mode' => 'online' ),
			),
		),
		'/training/adv-safe/spc/'                  => array(
			'name'        => 'Implementing SAFe® (SPC) Certification — SAFe 6 Practice Consultant',
			'description' => 'Become a SAFe® Practice Consultant (SPC) — train teams and launch Agile Release Trains. SPCT-led, SAFe 6.0, exam & pass support.',
			'provider'    => $provider,
		),
		'/training/adv-safe/aspc/'                 => array(
			'name'        => 'Advanced SAFe Practice Consultant (ASPC) Certification',
			'description' => 'Advance from SPC to ASPC — lead large-scale, AI-native SAFe transformations. SPCT-led 4-day cohorts, exam included.',
			'provider'    => $provider,
		),
		'/training/adv-safe/rte/'                  => array(
			'name'        => 'SAFe® Release Train Engineer (RTE) Certification',
			'description' => 'RTE certification — facilitate Agile Release Trains and PI Planning at program level. Live-virtual, exam included.',
			'provider'    => $provider,
		),
		'/training/adv-safe/lpm/'                  => array(
			'name'        => 'SAFe® Lean Portfolio Management (LPM) Certification',
			'description' => 'SAFe® LPM certification — Lean budgets, portfolio strategy and governance to connect strategy to execution.',
			'provider'    => $provider,
		),
		'/training/adv-safe/apm/'                  => array(
			'name'        => 'SAFe® Agile Product Management (APM) Certification',
			'description' => 'SAFe® APM certification — Design Thinking and customer-centric product management aligned to SAFe 6.0.',
			'provider'    => $provider,
		),
		'/training/safe/popm/'                     => array(
			'name'        => 'SAFe® Product Owner / Product Manager (POPM) Certification',
			'description' => 'SAFe® POPM certification — SPC-taught, live-virtual, exam included. Build, prioritize and deliver value in a SAFe enterprise.',
			'provider'    => $provider,
		),
		'/training/safe/asm/'                      => array(
			'name'        => 'SAFe® Advanced Scrum Master (ASM/SASM) Certification',
			'description' => 'SASM certification — lead high-performing Agile teams in a SAFe enterprise. SPC-taught, live-virtual, exam included.',
			'provider'    => $provider,
		),
		'/training/safe/devops/'                   => array(
			'name'        => 'SAFe® DevOps (SDP) Certification',
			'description' => 'SAFe® DevOps Practitioner certification — build a continuous delivery pipeline with CALMR. SPC-taught, exam included.',
			'provider'    => $provider,
		),
		'/training/ai-native/ai-native-foundations/' => array(
			'name'        => 'AI-Native Foundations Certification',
			'description' => 'AI-Native Foundations certification: prompt engineering, AI ethics and daily AI workflows. No coding required. SPC-taught, live-virtual, exam included.',
			'provider'    => $provider,
		),
	);
}

/* ============================================================
 * 2. LocalBusiness per city (Toronto, NY, Chicago, London, Dubai)
 * ============================================================ */
function aa_jsonld_locations() {
	return array(
		'toronto'   => array( 'name' => 'Toronto',   'region' => 'ON',       'country' => 'CA' ),
		'new-york'  => array( 'name' => 'New York',  'region' => 'NY',       'country' => 'US' ),
		'chicago'   => array( 'name' => 'Chicago',   'region' => 'IL',       'country' => 'US' ),
		'london'    => array( 'name' => 'London',    'region' => 'England',  'country' => 'GB' ),
		'dubai'     => array( 'name' => 'Dubai',     'region' => 'DU',       'country' => 'AE' ),
		'ottawa'    => array( 'name' => 'Ottawa',    'region' => 'ON',       'country' => 'CA' ),
		'montreal'  => array( 'name' => 'Montreal',  'region' => 'QC',       'country' => 'CA' ),
	);
}

/* ============================================================
 * 3. Global Organization + WebSite blocks (every page)
 * ============================================================ */
function aa_jsonld_organization() {
	return array(
		'@context'    => 'https://schema.org',
		'@type'       => 'Organization',
		'name'        => 'Agile Agilist',
		'url'         => home_url( '/' ),
		'logo'        => home_url( '/wp-content/uploads/logo.png' ),
		'description' => 'SAFe® Gold Partner delivering SPCT-led SAFe certification, enterprise Agile transformation, innovation, and AI-Native leadership training across Toronto, Canada, and North America.',
		'sameAs'      => array(
			'https://www.linkedin.com/company/agile-agilist',
			'https://scaledagile.com/partners/agile-agilist/',
		),
		'contactPoint' => array(
			'@type'       => 'ContactPoint',
			'contactType' => 'customer support',
			'email'       => 'hello@agile-agilist.com',
			'areaServed'  => array( 'CA', 'US', 'GB', 'AE' ),
		),
	);
}

function aa_jsonld_website() {
	return array(
		'@context'        => 'https://schema.org',
		'@type'           => 'WebSite',
		'name'            => 'Agile Agilist',
		'url'             => home_url( '/' ),
		'potentialAction' => array(
			'@type'       => 'SearchAction',
			'target'      => home_url( '/?s={search_term_string}' ),
			'query-input' => 'required name=search_term_string',
		),
	);
}

/* ============================================================
 * 4. Course + CourseInstance builder
 * ============================================================ */
function aa_jsonld_course_for_path( $path, $courses ) {
	if ( ! isset( $courses[ $path ] ) ) {
		return null;
	}
	$c = $courses[ $path ];
	$node = array(
		'@context'    => 'https://schema.org',
		'@type'       => 'Course',
		'name'        => $c['name'],
		'description' => $c['description'],
		'url'         => home_url( $path ),
		'provider'    => $c['provider'],
	);
	if ( ! empty( $c['price'] ) ) {
		$node['offers'] = array(
			'@type'         => 'Offer',
			'category'      => 'Paid',
			'price'         => (string) $c['price'],
			'priceCurrency' => $c['currency'],
			'url'           => home_url( $path ),
		);
	}
	if ( ! empty( $c['instances'] ) ) {
		$node['hasCourseInstance'] = array();
		foreach ( $c['instances'] as $inst ) {
			$node['hasCourseInstance'][] = array(
				'@type'          => 'CourseInstance',
				'courseMode'     => $inst['mode'],
				'startDate'      => $inst['start'],
				'endDate'        => $inst['end'],
				'courseWorkload' => 'P2D',
			);
		}
	}
	return $node;
}

/* ============================================================
 * 5. FAQPage builder — reads from post-meta if present
 *    Set a custom field `aa_faq_jsonld` on any page with a JSON
 *    array of { q, a } pairs. If present, FAQPage schema is emitted.
 * ============================================================ */
function aa_jsonld_faq_for_current_post() {
	if ( ! is_singular() ) {
		return null;
	}
	$raw = get_post_meta( get_the_ID(), 'aa_faq_jsonld', true );
	if ( empty( $raw ) ) {
		return null;
	}
	$pairs = json_decode( $raw, true );
	if ( ! is_array( $pairs ) || empty( $pairs ) ) {
		return null;
	}
	$entities = array();
	foreach ( $pairs as $p ) {
		if ( empty( $p['q'] ) || empty( $p['a'] ) ) {
			continue;
		}
		$entities[] = array(
			'@type'          => 'Question',
			'name'           => $p['q'],
			'acceptedAnswer' => array(
				'@type' => 'Answer',
				'text'  => $p['a'],
			),
		);
	}
	if ( empty( $entities ) ) {
		return null;
	}
	return array(
		'@context'   => 'https://schema.org',
		'@type'      => 'FAQPage',
		'mainEntity' => $entities,
	);
}

/* ============================================================
 * 6. LocalBusiness builder for /locations/{city}/ hub pages
 * ============================================================ */
function aa_jsonld_localbusiness_for_path( $path, $locations ) {
	// Match /locations/{slug}/ pattern (permissive to trailing slash).
	if ( ! preg_match( '#^/locations/([a-z0-9-]+)/?$#', $path, $m ) ) {
		return null;
	}
	$slug = $m[1];
	if ( ! isset( $locations[ $slug ] ) ) {
		return null;
	}
	$loc = $locations[ $slug ];
	return array(
		'@context'    => 'https://schema.org',
		'@type'       => 'LocalBusiness',
		'name'        => sprintf( 'Agile Agilist — %s', $loc['name'] ),
		'url'         => home_url( $path ),
		'areaServed'  => array(
			'@type' => 'City',
			'name'  => $loc['name'],
		),
		'address'     => array(
			'@type'           => 'PostalAddress',
			'addressLocality' => $loc['name'],
			'addressRegion'   => $loc['region'],
			'addressCountry'  => $loc['country'],
		),
		'parentOrganization' => array(
			'@type' => 'Organization',
			'name'  => 'Agile Agilist',
			'url'   => home_url( '/' ),
		),
	);
}

/* ============================================================
 * 7. Emit — wp_head hook
 * ============================================================ */
function aa_jsonld_emit() {
	$path      = wp_parse_url( home_url( add_query_arg( array() ) ), PHP_URL_PATH );
	$path      = '/' . ltrim( $path, '/' );
	if ( '/' !== substr( $path, -1 ) ) {
		$path .= '/';
	}
	$courses   = aa_jsonld_courses();
	$locations = aa_jsonld_locations();

	$blocks = array();
	// Always emit Organization + WebSite.
	$blocks[] = aa_jsonld_organization();
	$blocks[] = aa_jsonld_website();

	// Add Course if the current URL is a mapped course.
	$course = aa_jsonld_course_for_path( $path, $courses );
	if ( $course ) {
		$blocks[] = $course;
	}

	// Add LocalBusiness if under /locations/{slug}/.
	$local = aa_jsonld_localbusiness_for_path( $path, $locations );
	if ( $local ) {
		$blocks[] = $local;
	}

	// Add FAQPage if the page has aa_faq_jsonld meta.
	$faq = aa_jsonld_faq_for_current_post();
	if ( $faq ) {
		$blocks[] = $faq;
	}

	foreach ( $blocks as $b ) {
		$json = wp_json_encode( $b, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		if ( false !== $json ) {
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON encoded above.
			echo "\n<script type=\"application/ld+json\">{$json}</script>\n";
		}
	}
}
add_action( 'wp_head', 'aa_jsonld_emit', 5 );
