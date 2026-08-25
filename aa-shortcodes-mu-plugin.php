<?php
/**
 * Plugin Name:  Agile Agilist — Shortcodes
 * Description:  Registers [aa_home_cohorts] and [aa_mini_calendar], and takes
 *               over the old Xylus calendar shortcodes. Must-use plugin: loaded
 *               by WordPress before regular plugins, with no activation step.
 * Version:      039dc42
 * Requires PHP: 7.0
 *
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 *
 * These two bodies of code were originally WPCode PHP snippets. On this site
 * the stored copies execute but never register their shortcodes — the
 * evidence fits a paste truncated at a clean function boundary: it parses,
 * runs silently, defines its early functions, and never reaches its
 * add_shortcode call. So the homepage printed a literal "[aa_home_cohorts]"
 * and the calendar pages kept the old Xylus calendar. This file is loaded by
 * WordPress core itself, whole, with no editor paste in the path.
 *
 * WHY EVERY FUNCTION IS PREFIXED aamu_
 *
 * The first bundle used the snippets' own function names and took the site
 * down on upload: WPCode runs its (partial) copies AFTER mu-plugins, and
 * redefining a function is a PHP fatal on every request, admin included —
 * reproduced exactly against the stored copies. With its own prefix this
 * file cannot collide with anything WPCode holds, in any state, in any
 * order. The shortcode TAGS are unchanged — re-registering a tag is normal
 * WordPress behaviour, never a fatal.
 *
 * INSTALL
 *   1. UPLOAD this file into  wp-content/mu-plugins/  (create the folder if
 *      needed) using the file manager's Upload — do not create an empty file
 *      and paste into a web editor, which is how code gets truncated. After
 *      upload, confirm the file size matches the local file.
 *   2. Load the homepage: cohort cards and ticker should render. Put
 *      [aa_mcal_selftest] on any page and view it as an administrator to see
 *      what registered. The WPCode snippets can stay active or not — they
 *      cannot conflict with this file either way.
 *
 * IF THE SITE EVER WHITE-SCREENS AFTER A CHANGE HERE: delete this file via
 * the file manager and the site is back instantly; then check the
 * "Your Site is Experiencing a Technical Issue" email WordPress sends the
 * admin — it names the exact file and line of the fatal.
 *
 * The calendar's CSS and JS are NOT in here — they install as their own
 * WPCode CSS and JavaScript snippets (snippets/calendar/aa-calendar.css and
 * aa-calendar.js). This file carries PHP only.
 *
 * UNINSTALL: delete the file. mu-plugins cannot be deactivated from the admin.
 *
 * DO NOT EDIT HERE. This file is generated from the two sources by
 * tools/gen_mu_plugin.py — edit those and regenerate, or the next regeneration
 * silently discards your change.
 * -----------------------------------------------------------------------------
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/* =============================================================================
   Homepage cohort cards + ticker  [aa_home_cohorts]
   from aa-home-cohorts-wpcode-snippet.php
   ============================================================================= */
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
if ( ! function_exists( 'aamu_home_cohort_rows' ) ) :

/** Priority order — highest-value certifications first. */
function aamu_home_cohort_catalog() {
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
 * certification names in aamu_home_cohort_catalog() are proper nouns.
 */
function aamu_home_cohort_strings( $lang ) {
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
function aamu_home_cohort_url( $slug, $url, $lang ) {
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
function aamu_home_cohort_rows( $courses, $limit, $now, &$dbg, $fresh = false ) {
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
	$catalog = aamu_home_cohort_catalog();
	$rows = array();
	foreach ( array_filter( array_map( 'trim', explode( ',', $courses ) ) ) as $slug ) {
		if ( count( $rows ) >= $limit )     { break; }
		if ( ! isset( $catalog[ $slug ] ) ) { $dbg[] = $slug . ': not in catalog'; continue; }
		$next = aamu_home_next_cohort( $slug, $now );
		if ( ! $next ) { $dbg[] = $slug . ': no upcoming event'; continue; }
		$rows[] = array( 'slug' => $slug, 'e' => $next );
		$dbg[]  = $slug . ': ' . gmdate( 'Y-m-d', $next['start'] );
	}
	set_transient( $key, $rows, 10 * MINUTE_IN_SECONDS );
	return $memo[ $key ] = $rows;
}

/** Next upcoming event for one course slug, or null. */
function aamu_home_next_cohort( $slug, $now ) {
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
function aamu_home_date_range( $start, $end, $days, $str = null ) {
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
	$str     = aamu_home_cohort_strings( $lang );
	$catalog = aamu_home_cohort_catalog();
	// Cut off at the start of today in Eastern time, not "right now", so a
	// cohort that begins today is still listed during the morning.
	$today   = new DateTime( 'now', new DateTimeZone( 'America/New_York' ) );
	$today->setTime( 0, 0, 0 );
	$now     = $today->getTimestamp();
	$limit   = max( 1, (int) $a['limit'] );

	$dbg  = array();
	$rows = aamu_home_cohort_rows( $a['courses'], $limit, $now, $dbg, (bool) $a['debug'] );

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
		$range = aamu_home_date_range( $e['start'], $e['end'], $c['days'], $str );
		$startD = ( new DateTime( '@' . $e['start'] ) )->setTimezone( new DateTimeZone( 'America/New_York' ) );
		$iso   = $startD->format( 'Y-m-d' );
		$curl  = aamu_home_cohort_url( $r['slug'], $c['url'], $lang );

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

endif; // double-load guard


/* =============================================================================
   Course calendar + Xylus takeover  [aa_mini_calendar]
   from aa-mini-calendar-wpcode-snippet.php
   ============================================================================= */
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
if ( ! function_exists( 'aamu_mcal_render' ) ) :

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
function aamu_mcal_catalog() {
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
function aamu_mcal_strings( $lang ) {
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
 * {s:"Y-m-d", e:"Y-m-d", c:"slug", id:int}. Cached like aamu_home_cohort_rows.
 */
function aamu_mcal_events( $cats, $months, &$dbg ) {
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

function aamu_mcal_render( $atts ) {
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
	$str  = aamu_mcal_strings( $lang );
	$cats = array_filter( array_map( 'trim', explode( ',', strtolower( $a['category'] ) ) ) );
	$dbg  = array();
	$rows = aamu_mcal_events( $cats, (int) $a['months'], $dbg );

	$catalog = aamu_mcal_catalog();
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

add_shortcode( 'aa_mini_calendar', 'aamu_mcal_render' );

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
function aamu_mcal_takeover( $tag, $atts ) {
	$a = shortcode_atts( array( 'category' => '', 'lang' => 'en' ), $atts, $tag );
	$args = array( 'category' => $a['category'], 'lang' => $a['lang'] );
	if ( $tag === 'easy_events_calendar' ) {
		// The hub-page calendar: full width, stripes link to course pages.
		$args['link'] = 'course';
		$args['wide'] = '1';
	}
	return aamu_mcal_render( $args );
}

add_filter( 'pre_do_shortcode_tag', function ( $short, $tag, $attr ) {
	if ( $tag === 'easy_events_calendar' || $tag === 'easy_event_calendar_mini' ) {
		// $attr is '' rather than array() when the shortcode carries none.
		return aamu_mcal_takeover( $tag, is_array( $attr ) ? $attr : array() );
	}
	return $short;
}, 10, 3 );

add_action( 'init', function () {
	add_shortcode( 'easy_events_calendar', function ( $atts ) {
		return aamu_mcal_takeover( 'easy_events_calendar', $atts );
	} );
	add_shortcode( 'easy_event_calendar_mini', function ( $atts ) {
		return aamu_mcal_takeover( 'easy_event_calendar_mini', $atts );
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
		'cohorts section here    : ' . ( aamu_mcal_hide_here() ? 'suppressed' : 'kept' ),
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
   aamu_mcal_hidden_slugs(). To retire the section for good, delete the block in
   the editor and this filter stops matching anything.
   ========================================================================== */

/** Page slugs whose cohorts section is dropped. Both are unique site-wide. */
function aamu_mcal_hidden_slugs() {
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
function aamu_mcal_hide_here() {
	static $hide = null;
	if ( $hide !== null ) { return $hide; }
	$hide = false;
	if ( ! is_admin() ) {
		$obj = get_queried_object();
		if ( ! ( $obj instanceof WP_Post ) && isset( $GLOBALS['post'] ) ) {
			$obj = $GLOBALS['post'];
		}
		if ( $obj instanceof WP_Post && $obj->post_type === 'page' ) {
			$hide = in_array( $obj->post_name, aamu_mcal_hidden_slugs(), true );
		}
	}
	return $hide;
}

/** Does this block, or anything nested inside it, embed the big calendar? */
function aamu_mcal_holds_calendar( $block ) {
	if ( isset( $block['blockName'] ) && $block['blockName'] === 'core/shortcode'
		&& isset( $block['innerHTML'] ) && strpos( $block['innerHTML'], 'easy_events_calendar' ) !== false ) {
		return true;
	}
	if ( ! empty( $block['innerBlocks'] ) ) {
		foreach ( $block['innerBlocks'] as $child ) {
			if ( aamu_mcal_holds_calendar( $child ) ) { return true; }
		}
	}
	return false;
}

add_filter( 'render_block', function ( $html, $block ) {
	// Cheapest test first — this filter runs for every block on every page.
	if ( empty( $block['blockName'] ) || $block['blockName'] !== 'core/group' ) { return $html; }
	if ( ! aamu_mcal_hide_here() ) { return $html; }
	// Only the section wrapper, so the match fires once and not again for the
	// inner .aa-sechead / .aa-feed-src groups nested inside it.
	$cls = isset( $block['attrs']['className'] ) ? $block['attrs']['className'] : '';
	if ( strpos( $cls, 'aa-sec' ) === false ) { return $html; }
	return aamu_mcal_holds_calendar( $block ) ? '' : $html;
}, 10, 2 );

endif; // double-load guard

