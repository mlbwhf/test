<?php
/**
 * Agile Agilist — HOME HERO cohort list  [aa_home_cohorts]
 * -----------------------------------------------------------------------------
 * The hero panel on the home page shows the next live cohort for a *priority*
 * set of courses, not the whole catalogue — high-value certifications first.
 *
 * Reuses the plumbing already pinned for [aa_cohorts]:
 *     post type  wp_events
 *     taxonomy   event_category   (term slug = course code, e.g. "aspc")
 *     date meta  start_ts         (Unix timestamp)
 *     optional   seats_left, end_ts
 * All classes run 09:00–17:00 Eastern, so dates are formatted in that zone and
 * stay correct across DST.
 *
 * USE (inside the home page's Custom HTML block, or its own shortcode block):
 *     [aa_home_cohorts]
 *     [aa_home_cohorts limit="8"]
 *     [aa_home_cohorts courses="aspc,spc,rte,lpm,apm"]
 *     [aa_home_cohorts lang="es"]           (Spanish / French home pages)
 *     [aa_home_cohorts debug="1"]           (admin only)
 *
 * lang="es|fr" translates the chrome — "Live-virtual", "in N days", the seat
 * chip, month abbreviations — and points each card at the translated course
 * page (/es/spc/ rather than /training/adv-safe/spc/). The certification names
 * themselves stay in English on every locale, exactly as the translated course
 * pages already render them: "SAFe Release Train Engineer" is the credential's
 * name, not a phrase to translate.
 *
 * Emits .aa-cohort cards for .aa-cohorts__list (or .aa-ticker__item spans with
 * part="ticker") AND the matching Course /
 * CourseInstance JSON-LD, so the structured data always describes the dates
 * actually printed on the page.
 *
 * NOTE: "ai-native" is in the default priority order but has no event_category
 * term on the site yet. Courses with no upcoming event are skipped silently,
 * so the panel simply fills from the next priority course until that term and
 * its events exist.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/** Priority order — highest-value certifications first. */
function aa_home_cohort_catalog() {
	return array(
		'aspc' => array( 'code' => 'ASPC', 'name' => 'Adv. Practice Consultant', 'days' => 4, 'url' => '/training/adv-safe/aspc/',      'schema' => 'Advanced SAFe® Practice Consultant (ASPC)' ),
		'spc'  => array( 'code' => 'SPC',  'name' => 'Implementing SAFe',        'days' => 4, 'url' => '/training/adv-safe/spc/',       'schema' => 'Implementing SAFe® (SPC)' ),
		'rte'  => array( 'code' => 'RTE',  'name' => 'Release Train Engineer',   'days' => 3, 'url' => '/training/adv-safe/rte/',       'schema' => 'SAFe® Release Train Engineer (RTE)' ),
		'lpm'  => array( 'code' => 'LPM',  'name' => 'Lean Portfolio Management','days' => 2, 'url' => '/training/adv-safe/lpm/',       'schema' => 'SAFe® Lean Portfolio Management (LPM)' ),
		// no event_category term yet — see note above
		'ai-native' => array( 'code' => 'AI', 'name' => 'AI-Native Foundations', 'days' => 2, 'url' => '/training/ai-native/ai-native-foundations/', 'schema' => 'AI-Native Foundations' ),
		'apm'  => array( 'code' => 'APM',  'name' => 'Agile Product Management', 'days' => 3, 'url' => '/training/adv-safe/apm/',        'schema' => 'SAFe® Agile Product Management (APM)' ),
		'popm' => array( 'code' => 'POPM', 'name' => 'SAFe POPM',                'days' => 2, 'url' => '/training/safe/popm/',           'schema' => 'SAFe® Product Owner / Product Manager (POPM)' ),
		'ssm'  => array( 'code' => 'SSM',  'name' => 'SAFe Scrum Master',        'days' => 2, 'url' => '/training/safe/scrum-master/',   'schema' => 'SAFe® Scrum Master (SSM)' ),
	);
}

/**
 * Chrome strings per locale. Only the wrapper copy is translated; the
 * certification names in aa_home_cohort_catalog() are proper nouns.
 */
function aa_home_cohort_strings( $lang ) {
	$all = array(
		'en' => array(
			'mode'      => 'Live-virtual',
			'in_days'   => 'in %d days',
			'tomorrow'  => 'tomorrow',
			'today'     => 'today',
			'view'      => 'view dates',
			'seats'     => '%d seats left',
			'all_name'  => 'See all upcoming cohorts',
			'all_meta'  => 'Live-virtual · new dates monthly',
			'all_cta'   => 'View schedule',
			'months'    => array( 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ),
			'day_first' => false,
		),
		'es' => array(
			'mode'      => 'En vivo online',
			'in_days'   => 'en %d días',
			'tomorrow'  => 'mañana',
			'today'     => 'hoy',
			'view'      => 'ver fechas',
			'seats'     => 'quedan %d plazas',
			'all_name'  => 'Ver todas las convocatorias',
			'all_meta'  => 'En vivo online · nuevas fechas cada mes',
			'all_cta'   => 'Ver calendario',
			'months'    => array( 'ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic' ),
			'day_first' => true,
		),
		'fr' => array(
			'mode'      => 'Live à distance',
			'in_days'   => 'dans %d jours',
			'tomorrow'  => 'demain',
			'today'     => 'aujourd’hui',
			'view'      => 'voir les dates',
			'seats'     => '%d places restantes',
			'all_name'  => 'Voir toutes les sessions',
			'all_meta'  => 'Live à distance · nouvelles dates chaque mois',
			'all_cta'   => 'Voir le calendrier',
			'months'    => array( 'janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.' ),
			'day_first' => true,
			'first_ordinal' => 'er',
		),
	);
	return isset( $all[ $lang ] ) ? $all[ $lang ] : $all['en'];
}

/**
 * Course URL for a locale. The translated course pages sit at /es/<slug>/,
 * not under /es/training/<section>/, which is the shape already live for
 * every ES/FR course page on the site.
 */
function aa_home_cohort_url( $slug, $url, $lang ) {
	if ( $lang === 'en' ) { return $url; }
	return '/' . $lang . '/' . $slug . '/';
}

/**
 * Resolve the priority list to its upcoming events, cached twice over.
 *
 * Uncached, one home page view costs up to 16 event queries: 8 courses, each
 * a term lookup plus a meta-ordered get_posts, and the shortcode runs twice
 * per page (cards + ticker). The per-request memo collapses the second run to
 * zero; the 10-minute transient collapses repeat views to zero. The key
 * carries the Eastern day so a cached payload can never leak yesterday's
 * "starts today" across midnight, and a newly added event appears within
 * 10 minutes. debug="1" bypasses both caches.
 *
 * Only slug + event facts are stored — names/URLs are re-read from the
 * catalog on render, so editing this file never serves stale copy.
 */
function aa_home_cohort_rows( $courses, $limit, $now, &$dbg, $fresh = false ) {
	static $memo = array();
	$key = 'aa_home_cohorts_' . md5( $courses . '|' . $limit . '|' . gmdate( 'Ymd', $now ) );
	if ( ! $fresh ) {
		if ( isset( $memo[ $key ] ) ) { return $memo[ $key ]; }
		$cached = get_transient( $key );
		if ( is_array( $cached ) ) {
			$dbg[] = '(served from transient cache)';
			return $memo[ $key ] = $cached;
		}
	}
	$catalog = aa_home_cohort_catalog();
	$rows = array();
	foreach ( array_filter( array_map( 'trim', explode( ',', $courses ) ) ) as $slug ) {
		if ( count( $rows ) >= $limit )     { break; }
		if ( ! isset( $catalog[ $slug ] ) ) { $dbg[] = $slug . ': not in catalog'; continue; }
		$next = aa_home_next_cohort( $slug, $now );
		if ( ! $next ) { $dbg[] = $slug . ': no upcoming event'; continue; }
		$rows[] = array( 'slug' => $slug, 'e' => $next );
		$dbg[]  = $slug . ': ' . gmdate( 'Y-m-d', $next['start'] );
	}
	set_transient( $key, $rows, 10 * MINUTE_IN_SECONDS );
	return $memo[ $key ] = $rows;
}

/** Next upcoming event for one course slug, or null. */
function aa_home_next_cohort( $slug, $now ) {
	$term = get_term_by( 'slug', $slug, 'event_category' );
	if ( ! $term || is_wp_error( $term ) ) { return null; }

	$posts = get_posts( array(
		'post_type'      => 'wp_events',
		'post_status'    => 'publish',
		'posts_per_page' => 12,
		'no_found_rows'  => true,
		'meta_key'       => 'start_ts',
		'orderby'        => 'meta_value_num',
		'order'          => 'ASC',
		'meta_query'     => array( array( 'key' => 'start_ts', 'value' => $now, 'compare' => '>=', 'type' => 'NUMERIC' ) ),
		'tax_query'      => array( array( 'taxonomy' => 'event_category', 'field' => 'term_id', 'terms' => $term->term_id ) ),
	) );
	if ( empty( $posts ) ) { return null; }

	$p     = $posts[0];
	$start = (int) get_post_meta( $p->ID, 'start_ts', true );
	$end   = (int) get_post_meta( $p->ID, 'end_ts', true );
	$seats = get_post_meta( $p->ID, 'seats_left', true );

	return array(
		'id'    => $p->ID,
		'start' => $start,
		'end'   => $end ?: 0,
		'seats' => ( $seats === '' || $seats === null ) ? null : (int) $seats,
	);
}

/**
 * The cohort's dates, in Eastern time.
 *
 *   en   Sep 3–4      Sep 30–Oct 2
 *   es   3–4 sep      30 sep–2 oct
 *   fr   3–4 sept.    30 sept.–2 oct.
 *
 * English puts the month first; Spanish and French put the day first, so the
 * order is part of the locale, not just the month name. Month names are looked
 * up in a table rather than formatted, because DateTime::format('M') is always
 * English and strftime() depends on whatever locale the host happens to set.
 */
function aa_home_date_range( $start, $end, $days, $str = null ) {
	$tz     = new DateTimeZone( 'America/New_York' );
	$months = $str && ! empty( $str['months'] ) ? $str['months'] : null;
	$first  = $str && ! empty( $str['day_first'] );
	$ord    = $str && ! empty( $str['first_ordinal'] ) ? $str['first_ordinal'] : '';

	$s = ( new DateTime( '@' . $start ) )->setTimezone( $tz );
	$e = $end ? ( new DateTime( '@' . $end ) )->setTimezone( $tz )
	          : ( clone $s )->modify( '+' . max( 0, (int) $days - 1 ) . ' days' );

	$mon = function ( $d ) use ( $months ) {
		return $months ? $months[ (int) $d->format( 'n' ) - 1 ] : $d->format( 'M' );
	};
	// "1er octobre" in French; plain "1" everywhere else.
	$day = function ( $d ) use ( $ord ) {
		return $d->format( 'j' ) === '1' && $ord ? '1' . $ord : $d->format( 'j' );
	};
	$one = function ( $d ) use ( $mon, $day, $first ) {
		return $first ? $day( $d ) . ' ' . $mon( $d ) : $mon( $d ) . ' ' . $day( $d );
	};

	if ( $s->format( 'Y-m-d' ) === $e->format( 'Y-m-d' ) ) { return $one( $s ); }
	if ( $s->format( 'Y-m' ) !== $e->format( 'Y-m' ) )     { return $one( $s ) . '–' . $one( $e ); }
	// Same month: print it once, on the side the locale puts it.
	return $first ? $day( $s ) . '–' . $day( $e ) . ' ' . $mon( $s )
	              : $mon( $s ) . ' ' . $day( $s ) . '–' . $day( $e );
}

add_shortcode( 'aa_home_cohorts', function ( $atts ) {

	$a = shortcode_atts( array(
		'courses' => 'aspc,spc,rte,lpm,ai-native,apm,popm,ssm',
		'limit'   => 6,
		'schema'  => '1',
		'part'    => 'cards',   // cards | ticker
		'lang'    => 'en',      // en | es | fr
		'debug'   => '',
	), $atts, 'aa_home_cohorts' );

	$lang    = in_array( $a['lang'], array( 'es', 'fr' ), true ) ? $a['lang'] : 'en';
	$str     = aa_home_cohort_strings( $lang );
	$catalog = aa_home_cohort_catalog();
	// Cut off at the start of today in Eastern time, not "right now", so a
	// cohort that begins today is still listed during the morning.
	$today   = new DateTime( 'now', new DateTimeZone( 'America/New_York' ) );
	$today->setTime( 0, 0, 0 );
	$now     = $today->getTimestamp();
	$limit   = max( 1, (int) $a['limit'] );

	$dbg  = array();
	$rows = aa_home_cohort_rows( $a['courses'], $limit, $now, $dbg, (bool) $a['debug'] );

	if ( empty( $rows ) ) {
		if ( $a['part'] === 'ticker' ) { return ''; }
		// Never print an empty panel — send people to the full schedule instead.
		$all_url = $lang === 'en' ? '/training/' : '/' . $lang . '/training/';
		return '<a class="aa-cohort" href="' . esc_url( $all_url ) . '">'
		     . '<span class="aa-cohort__txt"><span class="aa-cohort__name">' . esc_html( $str['all_name'] ) . '</span>'
		     . '<span class="aa-cohort__meta">' . esc_html( $str['all_meta'] ) . '</span></span>'
		     . '<span class="aa-cohort__right"><span class="aa-cohort__days">' . esc_html( $str['all_cta'] ) . ' &#10230;</span></span></a>';
	}

	$html = '';
	$instances = array();
	$today = new DateTime( 'now', new DateTimeZone( 'America/New_York' ) );
	$today->setTime( 0, 0, 0 );
	foreach ( $rows as $r ) {
		// cached rows carry only the slug — a slug cached before a catalog
		// edit that removed it is skipped rather than fataling
		if ( ! isset( $catalog[ $r['slug'] ] ) ) { continue; }
		$c = $catalog[ $r['slug'] ]; $e = $r['e'];
		$range = aa_home_date_range( $e['start'], $e['end'], $c['days'], $str );
		$startD = ( new DateTime( '@' . $e['start'] ) )->setTimezone( new DateTimeZone( 'America/New_York' ) );
		$iso   = $startD->format( 'Y-m-d' );
		$curl  = aa_home_cohort_url( $r['slug'], $c['url'], $lang );

		if ( $a['part'] === 'ticker' ) {
			// One item per course; aa-home.js clones the whole track for the loop.
			$html .= '<span class="aa-ticker__item">'
			      . '<span class="aa-ticker__code">' . esc_html( $c['code'] ) . '</span>'
			      . '<span>' . esc_html( $c['name'] ) . '</span>'
			      . '<span class="aa-ticker__dates">' . esc_html( $range ) . '</span>'
			      . '<span class="aa-ticker__sep"></span></span>';
			continue;
		}

		// Day count is rendered server-side so it is real text for crawlers;
		// aa-home.js recomputes it from data-start on every load.
		$days = (int) $today->diff( ( clone $startD )->setTime( 0, 0, 0 ) )->format( '%r%a' );
		$label = $days > 1 ? sprintf( $str['in_days'], $days )
		       : ( $days === 1 ? $str['tomorrow'] : ( $days === 0 ? $str['today'] : $str['view'] ) );

		$seats_html = '';
		if ( $e['seats'] !== null && $e['seats'] > 0 ) {
			$low = $e['seats'] <= 6 ? ' aa-cohort__seats--low' : '';
			$seats_html = '<span class="aa-cohort__seats' . $low . '">'
			            . esc_html( sprintf( $str['seats'], (int) $e['seats'] ) ) . '</span>';
		}

		// aa-home.js recomputes the countdown on cached pages; hand it this
		// locale's wording so it does not overwrite the card in English.
		$labels = wp_json_encode( array(
			'days'     => $str['in_days'],
			'tomorrow' => $str['tomorrow'],
			'today'    => $str['today'],
			'view'     => $str['view'],
		) );

		$html .= '<a class="aa-cohort"'
		      . ' data-labels="' . esc_attr( $labels ) . '"'
		      . ' data-start="' . esc_attr( $iso ) . '"'
		      . ( $e['seats'] !== null ? ' data-seats="' . (int) $e['seats'] . '"' : '' )
		      . ' href="' . esc_url( $curl ) . '?cohort=' . (int) $e['id'] . '">'
		      . '<span class="aa-cohort__txt">'
		      . '<span class="aa-cohort__name">' . esc_html( $c['name'] ) . '</span>'
		      . '<span class="aa-cohort__meta">' . esc_html( $str['mode'] . ' · ' . $range ) . '</span></span>'
		      . '<span class="aa-cohort__right">' . $seats_html
		      . '<span class="aa-cohort__days">' . esc_html( $label ) . ' &#10230;</span></span></a>';

		$instances[] = array(
			'@type'    => 'Course',
			'name'     => $c['schema'],
			'url'      => home_url( $curl ),
			'inLanguage' => $lang,
			'provider' => array( '@type' => 'Organization', 'name' => 'Agile Agilist', 'url' => home_url( '/' ) ),
			'hasCourseInstance' => array(
				'@type'      => 'CourseInstance',
				'courseMode' => 'online',
				'startDate'  => $iso,
				'location'   => array( '@type' => 'VirtualLocation', 'url' => home_url( $curl ) ),
			),
		);
	}

	if ( $a['schema'] === '1' && $instances && $a['part'] !== 'ticker' ) {
		$html .= '<script type="application/ld+json">'
		      . wp_json_encode( array( '@context' => 'https://schema.org', '@graph' => $instances ) )
		      . '</script>';
	}

	if ( $a['debug'] && current_user_can( 'manage_options' ) ) {
		$html .= '<pre style="background:#101C33;color:#3FBFAE;padding:12px;font-size:12px;white-space:pre-wrap">'
		      . esc_html( "aa_home_cohorts\n" . implode( "\n", $dbg ) ) . '</pre>';
	}

	return $html;
} );
