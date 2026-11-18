<?php
/**
 * AA — Monthly newsletter, built and sent on a schedule
 *
 * The footer promises "Monthly SAFe + AI-Native insights. New cohort dates."
 * This sends it. Once a month (first Tuesday, 10:00 site time, both settable
 * under Tools → Newsletter) every address collected by the footer Subscribe
 * box gets one email, built at send time from what the site already knows:
 *
 *   - a hero spotlight on one AI-Native ART article, rotating through the series
 *   - an optional note you type in Tools → Newsletter (used once, then cleared)
 *   - a career snap: one role, its salary range and where it leads
 *   - how AI is changing the Scrum Master, RTE and SPC roles (our view)
 *   - what is new in SAFe and AI-Native, and the free assessment tools
 *   - the next dates of the main classes, read from the registration schedule
 *   - up to three blog posts published since the last issue
 *   - four salary benchmarks, rotating monthly, from the site's own salary data
 *     and its sources line
 *   - the team-training link
 *
 * NOTHING IS INVENTED. No salary figures, no prices, no claims: only class
 * names, dates and post titles the site already publishes. A month with no
 * dates and no posts sends nothing.
 *
 * SAFEGUARDS
 *   - Two days before each issue, the exact email goes to info@ first, with
 *     a "Skip this month" link.
 *   - The FIRST issue is not sent until someone presses "Approve and start
 *     sending" in that preview (or on the settings page). After that it runs
 *     on its own.
 *   - Only subscribers get it: the footer box, and (with the HubSpot token)
 *     HubSpot contacts marked Subscribed. HubSpot email opt-outs are respected. Every email has a
 *     one-click unsubscribe link (also offered to the mail app as
 *     List-Unsubscribe) and the business postal address.
 *   - Sent in small batches, one email per person, never a shared To/Bcc.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_nl_settings' ) ) :

function aa_sf_nl_settings() {
	$d = array( 'on' => 1, 'approved' => 0, 'week' => 1, 'dow' => 'tuesday', 'hour' => 10, 'notify' => 'info@agile-agilist.com', 'note' => '', 'skip' => '', 'preview' => '', 'last' => '', 'last_at' => '', 'audience' => 'both' );
	$s = get_option( 'aa_sf_nl', array() );
	return array_merge( $d, is_array( $s ) ? $s : array() );
}
function aa_sf_nl_set( $k, $v ) { $s = aa_sf_nl_settings(); $s[ $k ] = $v; update_option( 'aa_sf_nl', $s, false ); }

function aa_sf_nl_key( $what ) { return substr( hash_hmac( 'sha256', $what, wp_salt( 'auth' ) . '|aa-nl' ), 0, 32 ); }
function aa_sf_nl_link( $do, $arg = '' ) {
	return add_query_arg( array( 'action' => 'aa_sf_nl', 'do' => $do, 'a' => rawurlencode( $arg ), 'k' => aa_sf_nl_key( $do . '|' . $arg ) ), admin_url( 'admin-post.php' ) );
}
function aa_sf_nl_unsub_link( $email ) {
	$e = rtrim( strtr( base64_encode( strtolower( $email ) ), '+/', '-_' ), '=' );
	return add_query_arg( array( 'action' => 'aa_sf_nl', 'do' => 'unsub', 'a' => $e, 'k' => aa_sf_nl_key( 'unsub|' . $e ) ), admin_url( 'admin-post.php' ) );
}

/** When this month's issue goes out (site time). $ym = 'Y-m'. */
function aa_sf_nl_send_time( $ym, $s = null ) {
	$s     = $s ?: aa_sf_nl_settings();
	$words = array( 1 => 'first', 2 => 'second', 3 => 'third', 4 => 'fourth' );
	$w     = isset( $words[ (int) $s['week'] ] ) ? $words[ (int) $s['week'] ] : 'first';
	$dow   = in_array( $s['dow'], array( 'monday', 'tuesday', 'wednesday', 'thursday', 'friday' ), true ) ? $s['dow'] : 'tuesday';
	$d     = new DateTime( $ym . '-01 00:00:00', wp_timezone() );
	$d->modify( $w . ' ' . $dow . ' of ' . $d->format( 'F Y' ) );
	$d->setTime( max( 0, min( 23, (int) $s['hour'] ) ), 0, 0 );
	return $d;
}
/** The next issue that has not gone out: array( 'ym' => 'Y-m', 'at' => DateTime ). */
function aa_sf_nl_next( $now = null ) {
	$s   = aa_sf_nl_settings();
	$now = $now ?: new DateTime( 'now', wp_timezone() );
	$ym  = $now->format( 'Y-m' );
	$at  = aa_sf_nl_send_time( $ym, $s );
	$end = ( clone $at )->modify( '+3 days' );
	if ( $s['last'] === $ym || $now > $end ) {
		$ym = ( new DateTime( $ym . '-01', wp_timezone() ) )->modify( '+1 month' )->format( 'Y-m' );
		$at = aa_sf_nl_send_time( $ym, $s );
	}
	return array( 'ym' => $ym, 'at' => $at );
}

/**
 * HUBSPOT AS THE CONTACT LIST.
 *
 * With the HubSpot private app token (wp-config AA_HUBSPOT_TOKEN or the
 * aa_hubspot_token option), the audience can include HubSpot contacts whose
 * "Agile Agilist — newsletter" property (aa_newsletter) says "Subscribed",
 * however they got there: the footer box, a HubSpot form, an import, or set by
 * hand in HubSpot. Anyone who has opted out of email in HubSpot
 * (hs_email_optout) or whose property says "Unsubscribed" is dropped, here and
 * in the site's own list. Read with the contacts read scope the token already
 * has; no list API needed.
 *
 * The sync copies HubSpot subscribers into the site list (marked src=hubspot)
 * so each address still gets exactly one email per issue, and runs at most every
 * six hours, plus once just before each send.
 */
function aa_sf_nl_hs_search( $filters, $after = '' ) {
	if ( ! function_exists( 'aa_sf_sub_token' ) || aa_sf_sub_token() === '' ) { return null; }
	$body = array( 'filterGroups' => array( array( 'filters' => $filters ) ), 'properties' => array( 'email', 'firstname', 'aa_newsletter', 'hs_email_optout' ), 'limit' => 100 );
	if ( $after !== '' ) { $body['after'] = $after; }
	$res = wp_remote_post( 'https://api.hubapi.com/crm/v3/objects/contacts/search', array( 'timeout' => 15,
		'headers' => array( 'Authorization' => 'Bearer ' . aa_sf_sub_token(), 'Content-Type' => 'application/json' ), 'body' => wp_json_encode( $body ) ) );
	if ( is_wp_error( $res ) || (int) wp_remote_retrieve_response_code( $res ) !== 200 ) { return null; }
	$j = json_decode( wp_remote_retrieve_body( $res ), true );
	return is_array( $j ) ? $j : null;
}
function aa_sf_nl_hs_all( $filters ) {
	$out = array(); $after = '';
	for ( $page = 0; $page < 50; $page++ ) {
		$j = aa_sf_nl_hs_search( $filters, $after );
		if ( $j === null ) { return $page ? $out : null; }
		foreach ( (array) ( isset( $j['results'] ) ? $j['results'] : array() ) as $r ) {
			$p = isset( $r['properties'] ) ? $r['properties'] : array();
			$e = isset( $p['email'] ) ? strtolower( trim( (string) $p['email'] ) ) : '';
			if ( is_email( $e ) ) { $out[ $e ] = $p; }
		}
		$after = isset( $j['paging']['next']['after'] ) ? (string) $j['paging']['next']['after'] : '';
		if ( $after === '' ) { break; }
	}
	return $out;
}
function aa_sf_nl_sync( $force = false ) {
	$s = aa_sf_nl_settings();
	if ( $s['audience'] === 'local' ) { return 'Audience is the site list only; HubSpot not read.'; }
	if ( ! $force && get_transient( 'aa_sf_nl_synced' ) ) { return 'Synced recently.'; }
	$subs = aa_sf_nl_hs_all( array( array( 'propertyName' => 'aa_newsletter', 'operator' => 'CONTAINS_TOKEN', 'value' => 'Subscribed' ) ) );
	if ( $subs === null ) { return 'HubSpot could not be read (token missing or refused).'; }
	$outs = aa_sf_nl_hs_all( array( array( 'propertyName' => 'hs_email_optout', 'operator' => 'EQ', 'value' => 'true' ) ) );
	$outs = is_array( $outs ) ? $outs : array();
	$list = get_option( 'aa_sf_subscribers', array() ); $list = is_array( $list ) ? $list : array();
	$added = 0; $dropped = 0; $now = current_time( 'mysql' );
	foreach ( $subs as $email => $p ) {
		$optout = ( isset( $p['hs_email_optout'] ) && (string) $p['hs_email_optout'] === 'true' ) || isset( $outs[ $email ] );
		if ( $optout ) { continue; }
		if ( ! isset( $list[ $email ] ) ) { $list[ $email ] = array( 't' => $now, 'page' => '', 'lang' => 'en', 'hs' => 'from HubSpot', 'src' => 'hubspot' ); $added++; }
	}
	foreach ( $list as $email => $r ) {
		if ( ! empty( $r['unsub'] ) ) { continue; }
		$hs_unsub = isset( $subs[ $email ] ) ? false : null;
		if ( isset( $outs[ $email ] ) ) { $list[ $email ]['unsub'] = $now; $list[ $email ]['why'] = 'opted out in HubSpot'; $dropped++; continue; }
		/* Came from HubSpot and HubSpot no longer says Subscribed: drop it too. */
		if ( ! empty( $r['src'] ) && $r['src'] === 'hubspot' && $hs_unsub === null ) { $list[ $email ]['unsub'] = $now; $list[ $email ]['why'] = 'no longer subscribed in HubSpot'; $dropped++; }
	}
	update_option( 'aa_sf_subscribers', $list, false );
	set_transient( 'aa_sf_nl_synced', 1, 6 * HOUR_IN_SECONDS );
	aa_sf_nl_set( 'synced', current_time( 'mysql' ) . ' · ' . count( $subs ) . ' subscribed in HubSpot, ' . $added . ' added, ' . $dropped . ' dropped' );
	return 'HubSpot: ' . count( $subs ) . ' subscribed, ' . $added . ' new to the site list, ' . $dropped . ' dropped.';
}

function aa_sf_nl_recipients() {
	$list = get_option( 'aa_sf_subscribers', array() );
	$out  = array();
	foreach ( is_array( $list ) ? $list : array() as $email => $r ) {
		if ( ! is_email( $email ) || ! empty( $r['unsub'] ) ) { continue; }
		$hs = ! empty( $r['src'] ) && $r['src'] === 'hubspot';
		$mode = aa_sf_nl_settings()['audience'];
		if ( $mode === 'local' && $hs ) { continue; }
		if ( $mode === 'hubspot' && ! $hs && ! preg_match( '/contact 2\d\d/', (string) ( isset( $r['hs'] ) ? $r['hs'] : '' ) ) ) { continue; }   /* HubSpot-only: the address must be on a HubSpot contact */
		$out[ $email ] = is_array( $r ) ? $r : array();
	}
	return $out;
}

/* ---------------------------------------------------------------- content */

function aa_sf_nl_classes() {
	if ( ! function_exists( 'aa_reg_course' ) || ! function_exists( 'aa_reg_upcoming' ) ) { return array(); }
	$slugs = apply_filters( 'aa_sf_nl_courses', array( 'ai-native-foundations', 'ai-native-change-agent', 'launching-ai-native-arts', 'sa', 'popm', 'scrum-master', 'spc', 'rte' ) );
	$from  = ( new DateTime( 'now', wp_timezone() ) )->modify( '+3 days' )->format( 'Y-m-d' );
	$to    = ( new DateTime( 'now', wp_timezone() ) )->modify( '+60 days' )->format( 'Y-m-d' );
	$out   = array();
	foreach ( $slugs as $slug ) {
		$c = aa_reg_course( $slug );
		if ( ! is_array( $c ) || empty( $c['name'] ) || empty( $c['url'] ) ) { continue; }
		if ( function_exists( 'aa_reg_on_sale' ) && ! aa_reg_on_sale( $c ) ) { continue; }
		$dates = array();
		foreach ( (array) aa_reg_upcoming( $slug, $c ) as $h ) {
			if ( $h['start'] < $from || $h['start'] > $to ) { continue; }
			$dates[] = function_exists( 'aa_reg_range' ) ? aa_reg_range( $h['start'], $h['end'], true ) : $h['start'];
			if ( count( $dates ) >= 3 ) { break; }
		}
		if ( ! $dates ) { continue; }
		$out[] = array( 'name' => trim( preg_replace( '/\s+Certification$/i', '', (string) $c['name'] ) ), 'url' => home_url( $c['url'] ), 'dates' => $dates, 'days' => (int) $c['days'] );
	}
	return $out;
}

function aa_sf_nl_posts( $since ) {
	$q = array( 'post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 3, 'orderby' => 'date', 'order' => 'DESC', 'no_found_rows' => true, 'ignore_sticky_posts' => true,
	            'date_query' => array( array( 'after' => $since, 'inclusive' => false ) ) );
	if ( function_exists( 'pll_default_language' ) ) { $q['lang'] = 'en'; }
	$out = array();
	foreach ( get_posts( $q ) as $p ) {
		$ex = has_excerpt( $p ) ? get_the_excerpt( $p ) : wp_trim_words( wp_strip_all_tags( strip_shortcodes( $p->post_content ) ), 28, '…' );
		$out[] = array( 'title' => get_the_title( $p ), 'url' => get_permalink( $p ), 'excerpt' => wp_strip_all_tags( $ex ) );
	}
	return $out;
}

/**
 * SALARY BENCHMARKS, from the figures the site already publishes in its salary
 * sections (aa_salary_data() in the registration snippet, with its own sources
 * line). Nothing is computed or added here: four roles per issue, rotating by
 * month so a reader sees the whole set over a quarter. Empty when the
 * registration snippet is not loaded.
 */
function aa_sf_nl_salaries( $ym ) {
	if ( ! function_exists( 'aa_salary_data' ) ) { return array(); }
	$d     = aa_salary_data();
	$bands = array();
	foreach ( (array) ( isset( $d['bands'] ) ? $d['bands'] : array() ) as $b ) {
		if ( ! empty( $b['code'] ) && ! empty( $b['median'] ) ) { $bands[ $b['code'] ] = $b; }
	}
	foreach ( (array) ( isset( $d['extra'] ) ? $d['extra'] : array() ) as $code => $median ) {
		if ( ! isset( $bands[ $code ] ) && (int) $median > 0 ) { $bands[ $code ] = array( 'code' => $code, 'median' => (int) $median ); }
	}
	$order = apply_filters( 'aa_sf_nl_salary_order', array( 'SPC', 'RTE', 'POPM', 'SSM', 'AINF', 'AINVA', 'LPM', 'APM', 'ASPC', 'SDP', 'ARCH', 'AINORG' ) );
	$order = array_values( array_filter( $order, function ( $c ) use ( $bands ) { return isset( $bands[ $c ] ); } ) );
	if ( ! $order ) { return array(); }
	$n     = count( $order );
	$start = ( ( (int) substr( $ym, 0, 4 ) * 12 + (int) substr( $ym, 5, 2 ) ) * 4 ) % $n;
	$rows  = array();
	for ( $i = 0; $i < min( 4, $n ); $i++ ) {
		$b    = $bands[ $order[ ( $start + $i ) % $n ] ];
		$name = function_exists( 'aa_salary_label' ) ? aa_salary_label( $b['code'] ) : $b['code'];
		$url  = function_exists( 'aa_salary_url' ) ? aa_salary_url( $b['code'] ) : '';
		$rows[] = array(
			'code'   => $b['code'],
			'name'   => ( $name === $b['code'] || strpos( $name, '(' . $b['code'] . ')' ) !== false ) ? $name : $name . ' (' . $b['code'] . ')',
			'median' => (int) $b['median'],
			'range'  => ! empty( $b['lo'] ) && ! empty( $b['hi'] ) ? array( (int) $b['lo'], (int) $b['hi'] ) : null,
			'url'    => $url ? home_url( $url ) : '',
		);
	}
	return array( 'rows' => $rows, 'sources' => isset( $d['sources'] ) ? (string) $d['sources'] : '' );
}

/* ============================================================================
   ISSUE CONTENT, in the order of the Claude Design layout (16-18 Nov 2026):
   hero spotlight, career snap, the role with AI, what's new, latest posts,
   free tools, next classes, team training, footer.
   ========================================================================== */

/**
 * The AI-Native ART spotlight: one article per issue, taken in order from this
 * pool of published posts and never repeated until the whole pool has run.
 * A post can carry an optional contrast pair (two short labelled statements
 * from the article itself). Edit the pool with the aa_sf_nl_spotlight_pool
 * filter, or set "spotlight" (a post ID) in the settings to choose the next one.
 */
function aa_sf_nl_spotlight_pool() {
	return apply_filters( 'aa_sf_nl_spotlight_pool', array(
		37678 => array( 'kicker' => 'From PI Objectives to', 'accent' => 'PI Outcomes',
		                'pair' => array( array( 'PI Objective', 'Describes what the train will do.' ), array( 'PI Outcome', 'Describes what will change, and can fail honestly.' ) ),
		                'also' => 34220 ),
		34220 => array( 'kicker' => 'PI Planning is now', 'accent' => 'one day', 'also' => 37678 ),
		37938 => array( 'kicker' => 'The AI Innovation', 'accent' => 'Pipeline', 'also' => 37811 ),
		37811 => array( 'kicker' => 'Why the AI-Native ART', 'accent' => 'exists', 'also' => 37938 ),
		37676 => array( 'kicker' => 'AI-Native SAFe:', 'accent' => 'what it is', 'also' => 37678 ),
		38170 => array( 'kicker' => 'How AI reshapes', 'accent' => 'ART leadership', 'also' => 38173 ),
		38173 => array( 'kicker' => 'RTEs in an AI-Native ART:', 'accent' => 'same job, faster pace', 'also' => 38170 ),
		38171 => array( 'kicker' => 'Product Management:', 'accent' => 'from backlog to evidence', 'also' => 38170 ),
		38172 => array( 'kicker' => 'System Architects:', 'accent' => 'guardrails, not documents', 'also' => 38170 ),
		38174 => array( 'kicker' => 'Business Owners:', 'accent' => 'steering on live evidence', 'also' => 38170 ),
	) );
}
function aa_sf_nl_spotlight( $ym ) {
	$s    = aa_sf_nl_settings();
	$pool = aa_sf_nl_spotlight_pool();
	$done = isset( $s['spotlit'] ) && is_array( $s['spotlit'] ) ? $s['spotlit'] : array();
	if ( isset( $done[ $ym ] ) ) { $id = (int) $done[ $ym ]; }                                   /* this issue already chose */
	elseif ( ! empty( $s['spotlight'] ) && get_post_status( (int) $s['spotlight'] ) === 'publish' ) { $id = (int) $s['spotlight']; }
	else {
		$used = array_map( 'intval', array_values( $done ) ); $id = 0;
		foreach ( array_keys( $pool ) as $pid ) { if ( ! in_array( (int) $pid, $used, true ) && get_post_status( (int) $pid ) === 'publish' ) { $id = (int) $pid; break; } }
		if ( ! $id ) { foreach ( array_keys( $pool ) as $pid ) { if ( get_post_status( (int) $pid ) === 'publish' ) { $id = (int) $pid; break; } } }   /* pool ran out: start again */
	}
	if ( ! $id ) { return null; }
	$p = get_post( $id ); if ( ! $p ) { return null; }
	$x = isset( $pool[ $id ] ) ? $pool[ $id ] : array();
	$also = ! empty( $x['also'] ) && get_post_status( (int) $x['also'] ) === 'publish' ? get_post( (int) $x['also'] ) : null;
	return array(
		'id' => $id, 'url' => get_permalink( $p ), 'title' => get_the_title( $p ),
		'kicker' => isset( $x['kicker'] ) ? $x['kicker'] : '', 'accent' => isset( $x['accent'] ) ? $x['accent'] : '',
		'dek' => wp_strip_all_tags( has_excerpt( $p ) ? get_the_excerpt( $p ) : wp_trim_words( wp_strip_all_tags( strip_shortcodes( $p->post_content ) ), 40, '…' ) ),
		'pair' => isset( $x['pair'] ) ? $x['pair'] : array(),
		'also' => $also ? array( 'title' => get_the_title( $also ), 'url' => get_permalink( $also ) ) : null,
	);
}

/** One role per issue for the career snap, with where it leads. Figures from aa_salary_data() only. */
function aa_sf_nl_career( $ym ) {
	if ( ! function_exists( 'aa_salary_data' ) ) { return null; }
	$d = aa_salary_data(); $bands = array();
	foreach ( (array) ( isset( $d['bands'] ) ? $d['bands'] : array() ) as $b ) { if ( ! empty( $b['code'] ) && ! empty( $b['lo'] ) && ! empty( $b['hi'] ) ) { $bands[ $b['code'] ] = $b; } }
	$about = apply_filters( 'aa_sf_nl_role_about', array(
		'RTE'  => array( 'Release Train Engineer', 'Runs the Agile Release Train: PI Planning, flow across teams, and the cadence that keeps a train of teams delivering together.', '/training/adv-safe/rte/' ),
		'SPC'  => array( 'SAFe Practice Consultant', 'Leads the transformation: trains leaders and teams, launches trains, and coaches the change through.', '/training/adv-safe/spc/' ),
		'POPM' => array( 'Product Owner / Product Manager', 'Decides what gets built and why, and turns customer needs into a backlog a train can deliver.', '/training/safe/popm/' ),
		'LPM'  => array( 'Lean Portfolio Manager', 'Connects strategy to funding: decides which work gets investment, and how the portfolio is governed.', '/training/adv-safe/lpm/' ),
		'APM'  => array( 'Agile Product Manager', 'Owns product strategy: market, customers, roadmap and the value a product delivers.', '/training/adv-safe/apm/' ),
		'SSM'  => array( 'Scrum Master', 'Coaches a team to deliver: flow, improvement, and clearing what gets in the way.', '/training/safe/scrum-master/' ),
		'ASPC' => array( 'Advanced SAFe Practice Consultant', 'Guides enterprise-wide change: coaching executives and portfolio leaders, and scaling what works.', '/training/adv-safe/aspc/' ),
		'ARCH' => array( 'SAFe Architect', 'Shapes the technical direction of a train so teams can build fast without breaking the system.', '/training/safe/arch/' ),
	) );
	$order = array_values( array_filter( array( 'RTE', 'SPC', 'POPM', 'LPM', 'APM', 'SSM', 'ASPC', 'ARCH' ), function ( $c ) use ( $bands, $about ) { return isset( $bands[ $c ], $about[ $c ] ); } ) );
	if ( ! $order ) { return null; }
	/* December 2026 is the first issue and opens with RTE; then one role a month in this order. */
	$n    = count( $order );
	$i    = ( ( ( (int) substr( $ym, 0, 4 ) * 12 + (int) substr( $ym, 5, 2 ) ) - ( 2026 * 12 + 12 ) ) % $n + $n ) % $n;
	$code = $order[ $i ]; $b = $bands[ $code ];
	$med  = array(); foreach ( $bands as $c => $x ) { $med[ $c ] = (int) $x['median']; }
	foreach ( (array) ( isset( $d['extra'] ) ? $d['extra'] : array() ) as $c => $m ) { if ( ! isset( $med[ $c ] ) ) { $med[ $c ] = (int) $m; } }
	/* Where the role leads, across every ladder it sits on, in ladder order, up
	   to two steps. A ladder continues to its destination course: the
	   delivery track (SSM -> SASM -> RTE) ends at Large Solution SAFe (LSSP),
	   so RTE leads to LSSP before SPC, and Scrum Master's chain ends on LSSP.

	   A destination with no published median is still shown, as "new class",
	   never with a number -- the salary data says outright that no source
	   publishes one for LSSP yet, and we do not make one up. */
	$next = array(); $dest = array();
	foreach ( (array) ( isset( $d['paths'] ) ? $d['paths'] : array() ) as $p ) {
		$steps = isset( $p['steps'] ) ? array_values( (array) $p['steps'] ) : array(); $k = array_search( $code, $steps, true );
		if ( $k === false ) { continue; }
		$after = array_slice( $steps, $k + 1 );
		/* The ladder's destination course follows its last step, so Scrum
		   Master reads SSM -> SASM -> RTE -> LSSP and RTE reads RTE -> LSSP. */
		if ( ! empty( $p['dest']['code'] ) ) {
			$after[] = $p['dest']['code'];
			$dest[ $p['dest']['code'] ] = isset( $p['dest']['label'] ) ? (string) $p['dest']['label'] : $p['dest']['code'];
		}
		foreach ( $after as $c ) { if ( ! in_array( $c, $next, true ) ) { $next[] = $c; } }
	}
	$path = array( array( $code, (int) $b['median'] ) );
	foreach ( $next as $c ) {
		/* Three chips, plus a fourth only when it is a destination course. */
		if ( count( $path ) >= 4 || ( count( $path ) >= 3 && ! isset( $dest[ $c ] ) ) ) { break; }
		if ( isset( $med[ $c ] ) ) { $path[] = array( $c, $med[ $c ] ); }
		elseif ( isset( $dest[ $c ] ) ) { $path[] = array( $c, 0 ); }
	}
	/* A destination course on the path gets its own line and link under the chips. */
	$courses = apply_filters( 'aa_sf_nl_path_courses', array(
		'LSSP' => array( 'Large Solution SAFe®', '/training/adv-safe/large-solution/',
		                 'For RTEs whose job grows from one train to several: coordinating trains, suppliers and compliance across a large system. Foundational level, no prerequisites.' ),
	) );
	$new = null;
	foreach ( $path as $st ) {
		if ( $st[1] === 0 && isset( $courses[ $st[0] ] ) ) {
			$new = array( 'code' => $st[0], 'name' => $courses[ $st[0] ][0], 'url' => home_url( $courses[ $st[0] ][1] ), 'about' => $courses[ $st[0] ][2] );
			break;
		}
	}
	$pos = max( 0, min( 100, (int) round( ( $b['median'] - $b['lo'] ) / max( 1, $b['hi'] - $b['lo'] ) * 100 ) ) );
	return array( 'code' => $code, 'name' => $about[ $code ][0], 'about' => $about[ $code ][1], 'url' => home_url( $about[ $code ][2] ),
	              'median' => (int) $b['median'], 'lo' => (int) $b['lo'], 'hi' => (int) $b['hi'], 'pos' => $pos, 'path' => $path, 'new' => $new,
	              'sources' => isset( $d['sources'] ) ? (string) $d['sources'] : '' );
}

/** array( subject, html ) for one recipient, or null when there is nothing to say. */
function aa_sf_nl_build( $ym, $email, $preview = false ) {
	$s       = aa_sf_nl_settings();
	$month   = ( new DateTime( $ym . '-01', wp_timezone() ) )->format( 'F Y' );
	$spot    = aa_sf_nl_spotlight( $ym );
	$career  = aa_sf_nl_career( $ym );
	$classes = aa_sf_nl_classes();
	$since   = $s['last_at'] !== '' ? $s['last_at'] : ( new DateTime( 'now', wp_timezone() ) )->modify( '-35 days' )->format( 'Y-m-d H:i:s' );
	$posts   = array_values( array_filter( aa_sf_nl_posts( $since ), function ( $p ) use ( $spot ) { return ! $spot || $p['url'] !== $spot['url']; } ) );
	$note    = trim( (string) $s['note'] );
	if ( ! $spot && ! $classes && ! $posts && $note === '' ) { return null; }

	$utm  = function ( $url ) use ( $ym ) { return add_query_arg( array( 'utm_source' => 'newsletter', 'utm_medium' => 'email', 'utm_campaign' => 'monthly-' . $ym ), $url ); };
	$e    = function ( $x ) { return esc_html( $x ); };
	$F    = 'font-family:Arial,Helvetica,sans-serif;';
	$SER  = 'font-family:Georgia,\'Times New Roman\',serif;';
	$eye  = 'margin:0 0 10px;' . $F . 'font-size:11px;line-height:1.3;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#0E8074;';
	$h2   = 'margin:0 0 10px;' . $SER . 'font-weight:400;font-size:24px;line-height:1.2;color:#0B2E35;';
	$mute = $F . 'font-size:14px;line-height:1.5;color:#5C7479;';
	$sec  = function ( $inner, $top = 26 ) { return '<tr><td style="padding:' . (int) $top . 'px 28px 4px;">' . $inner . '</td></tr>'; };
	/* A button is a table cell with bgcolor, the link inside it. A fill set only
	   in CSS on the <a> is the first thing mail filters drop (the Nov 18 preview
	   lost every one), and the label then sits white on white. */
	$btn  = function ( $url, $label, $bg, $fg, $border = '' ) use ( $F ) {
		return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin:0 8px 8px 0;"><tr>'
		     . '<td bgcolor="' . $bg . '" style="background-color:' . $bg . ';border-radius:100px;' . ( $border ? 'border:1px solid ' . $border . ';' : '' ) . '">'
		     . '<a href="' . esc_url( $url ) . '" style="display:inline-block;' . $F . 'font-size:15px;font-weight:700;text-decoration:none;padding:13px 20px;border-radius:100px;background-color:' . $bg . ';color:' . $fg . ';">' . $label . '</a>'
		     . '</td></tr></table>';
	};
	$addr  = function_exists( 'aa_ag_address_line' ) ? aa_ag_address_line() : '55 Village Centre Place, Mississauga, ON L4Z 1V9, Canada';
	$unsub = aa_sf_nl_unsub_link( $email );
	$b = '';

	if ( $preview ) {
		$b .= '<tr><td style="padding:16px 24px;background:#FFF6E6;border-bottom:1px solid #F2B66D;' . $F . 'font-size:14px;line-height:1.5;color:#0B2E35;">'
		    . '<strong>Preview.</strong> This is the ' . $e( $month ) . ' newsletter as subscribers will get it. It goes to ' . count( aa_sf_nl_recipients() ) . ' subscriber(s) on '
		    . $e( aa_sf_nl_send_time( $ym )->format( 'l, F j \a\t g:i a' ) ) . ' (site time).<br>'
		    . ( $s['approved'] ? '' : '<strong>The first issue waits for your approval:</strong> <a href="' . esc_url( aa_sf_nl_link( 'approve', $ym ) ) . '" style="color:#0E8074;font-weight:700;">Approve and start sending</a> &nbsp;·&nbsp; ' )
		    . '<a href="' . esc_url( aa_sf_nl_link( 'skip', $ym ) ) . '" style="color:#0E8074;">Skip this month</a> &nbsp;·&nbsp; '
		    . '<a href="' . esc_url( admin_url( 'tools.php?page=aa-sf-newsletter' ) ) . '" style="color:#0E8074;">Add a note or change the schedule</a></td></tr>';
	}

	/* Masthead */
	$b .= '<tr><td style="padding:24px 28px 18px;background:#0B2E35;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
	    . '<td style="' . $SER . 'font-size:24px;color:#FFFFFF;">Agile Agilist<div style="' . $F . 'margin-top:6px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8FCFCF;">Monthly · ' . $e( $month ) . '</div></td>'
	    . '<td align="right" style="' . $F . 'font-size:12px;color:#B9DCDC;vertical-align:bottom;">SAFe® Platinum Partner</td></tr></table></td></tr>';

	/* 0. Hero: AI-Native ART spotlight */
	if ( $spot ) {
		$head = $spot['kicker'] !== '' ? $e( $spot['kicker'] ) . ' <em style="font-style:italic;color:#8FCFCF;">' . $e( $spot['accent'] ) . '</em>' : $e( $spot['title'] );
		$h = '<div style="' . $F . 'font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#F2B66D;margin:0 0 12px;">Spotlight · AI-Native ART</div>'
		   . '<h1 style="margin:0 0 14px;' . $SER . 'font-weight:400;font-size:36px;line-height:1.08;color:#FFFFFF;">' . $head . '</h1>'
		   . '<p style="margin:0 0 18px;' . $F . 'font-size:16px;line-height:1.6;color:#D6ECEB;">' . $e( $spot['dek'] ) . '</p>';
		if ( count( $spot['pair'] ) === 2 ) {
			$h .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;"><tr>';
			foreach ( $spot['pair'] as $i => $pr ) {
				$h .= ( $i ? '<td width="12"></td>' : '' ) . '<td width="50%" style="vertical-align:top;padding:12px 14px;border-radius:10px;border:1px solid ' . ( $i ? '#8FCFCF;background:#1B4A4F' : '#3E5F64' ) . ';">'
				    . '<div style="' . $F . 'font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' . ( $i ? '#8FCFCF' : '#B9DCDC' ) . ';margin-bottom:4px;">' . $e( $pr[0] ) . '</div>'
				    . '<div style="' . $F . 'font-size:15px;line-height:1.4;color:#FFFFFF;">' . $e( $pr[1] ) . '</div></td>';
			}
			$h .= '</tr></table>';
		}
		$h .= $btn( $utm( $spot['url'] ), 'Read the article ⟶', '#8FCFCF', '#0B2E35' )
		    . $btn( $utm( home_url( '/training/ai-native/launching-ai-native-arts/' ) ), 'Launching AI-Native ARTs class', '#0B2E35', '#FFFFFF', '#8FCFCF' );
		if ( $spot['also'] ) { $h .= '<p style="margin:16px 0 0;' . $F . 'font-size:13px;line-height:1.5;color:#B9DCDC;">Also on this: <a href="' . esc_url( $utm( $spot['also']['url'] ) ) . '" style="color:#FFFFFF;">' . $e( $spot['also']['title'] ) . '</a></p>'; }
		$b .= '<tr><td style="padding:28px 28px 28px;background:#0E3A44;border-top:1px solid #2A5258;">' . $h . '</td></tr>';
	}

	/* Greeting or your note */
	$intro = $note !== '' ? $note : 'Here is this month in five minutes: what one role pays, how AI is changing three roles, what\'s new, and the next classes.';
	$b .= '<tr><td style="padding:22px 28px 0;' . $F . 'font-size:15.5px;line-height:1.6;color:#35555B;">';
	foreach ( preg_split( '/\R{2,}/', $intro ) as $para ) { $b .= '<p style="margin:0 0 12px;">' . nl2br( $e( trim( $para ) ) ) . '</p>'; }
	$b .= '</td></tr>';

	/* 1. Career snap */
	if ( $career ) {
		$c = $career; $chips = '';
		foreach ( $c['path'] as $i => $st ) {
			/* Inline blocks, not table cells, so the chain wraps on a phone. */
			$chips .= ( $i ? '<span style="display:inline-block;margin:0 4px 6px 0;color:#8FCFCF;' . $F . 'font-size:14px;">⟶</span>' : '' )
			        . '<span style="display:inline-block;margin:0 4px 6px 0;padding:7px 12px;border-radius:100px;' . ( $i ? 'border:1px solid #8FCFCF;' : 'background:#0E8074;border:1px solid #0E8074;' ) . $F . 'font-size:13px;font-weight:600;color:#FFFFFF;white-space:nowrap;">' . $e( $st[0] ) . ' · ' . ( (int) $st[1] > 0 ? (int) $st[1] . 'K' : '<span style="color:#F2B66D;">new class</span>' ) . '</span>';
		}
		$newline = '';
		if ( ! empty( $c['new'] ) ) {
			$nw = $c['new'];
			$newline = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 0;border:1px solid #2A5258;border-radius:10px;"><tr><td style="padding:12px 14px;">'
			         . '<span style="display:inline-block;padding:2px 8px;border-radius:100px;background:#F2B66D;border:1px solid #F2B66D;' . $F . 'font-size:10.5px;font-weight:700;letter-spacing:.08em;color:#0B2E35;">NEW</span> '
			         . '<a href="' . esc_url( $utm( $nw['url'] ) ) . '" style="' . $F . 'font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;">' . $e( $nw['name'] ) . ' (' . $e( $nw['code'] ) . ') ⟶</a>'
			         . '<div style="' . $F . 'font-size:13.5px;line-height:1.5;color:#B9DCDC;margin-top:4px;">' . $e( $nw['about'] ) . '</div></td></tr></table>';
		}
		$bar = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;"><tr>'
		     . ( $c['pos'] > 0 ? '<td width="' . (int) $c['pos'] . '%" style="height:10px;background:#5FA9A6;border-radius:100px 0 0 100px;font-size:0;line-height:0;">&nbsp;</td>' : '' )
		     . '<td width="4" style="height:10px;background:#F2B66D;font-size:0;line-height:0;">&nbsp;</td>'
		     . '<td style="height:10px;background:#5FA9A6;border-radius:0 100px 100px 0;font-size:0;line-height:0;">&nbsp;</td></tr></table>'
		     . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="' . $F . 'font-size:11.5px;color:#B9DCDC;">' . (int) $c['lo'] . 'K</td><td align="center" style="' . $F . 'font-size:11.5px;color:#B9DCDC;">median ' . (int) $c['median'] . 'K</td><td align="right" style="' . $F . 'font-size:11.5px;color:#B9DCDC;">' . (int) $c['hi'] . 'K</td></tr></table>';
		$card = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B2E35;border-radius:12px;"><tr><td style="padding:22px;">'
		      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="' . $F . 'font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8FCFCF;">01 · Career snap</td><td align="right" style="' . $F . 'font-size:12px;color:#B9DCDC;">US base salary, USD</td></tr></table>'
		      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0 10px;"><tr>'
		      . '<td style="vertical-align:bottom;"><div style="' . $SER . 'font-size:28px;line-height:1.1;color:#FFFFFF;">' . $e( $c['name'] ) . '</div><div style="' . $F . 'margin-top:6px;font-size:14px;line-height:1.55;color:#B9DCDC;">' . $e( $c['about'] ) . '</div></td>'
		      . '<td align="right" style="vertical-align:bottom;padding-left:16px;white-space:nowrap;"><div style="' . $SER . 'font-size:48px;line-height:1;color:#FFFFFF;">' . (int) $c['median'] . 'K</div><div style="' . $F . 'font-size:12px;color:#B9DCDC;">median</div></td></tr></table>'
		      . $bar
		      . ( count( $c['path'] ) > 1 ? '<div style="' . $F . 'margin:16px 0 8px;font-size:12px;font-weight:600;color:#FFFFFF;">Where it leads</div><div>' . $chips . '</div>' . $newline : '' )
		      . '<div style="margin:18px 0 0;padding-top:14px;border-top:1px solid #2A5258;">' . $btn( $utm( $c['url'] ), 'See the ' . $e( $c['code'] ) . ' class ⟶', '#8FCFCF', '#0B2E35' )
		      . '<div style="' . $F . 'margin-top:12px;font-size:11.5px;line-height:1.5;color:#8FB5B8;">' . $e( $c['sources'] ) . ' Pay varies with market, industry and employer.</div></div>'
		      . '</td></tr></table>';
		$b .= '<tr><td style="padding:20px 28px 6px;">' . $card . '</td></tr>';
	}

	/* 2. The role, with AI in the room */
	$roles = apply_filters( 'aa_sf_nl_roles', array(
		array( 'SCRUM MASTER', 'Running the ceremonies and chasing status.', 'Bringing the context that makes an AI proposal fit the team, and coaching people to work alongside it.', 'Where did the Scrum Master go?', '/the-domain-expert-capability-in-an-ai-native-team-and-the-answer-to-the-question-everyone-asks-where-did-the-scrum-master-go/' ),
		array( 'RTE', 'Compiling dependency boards and train reports by hand.', 'The same job, flow, obstacles, risk and dependencies, at a faster pace, with tools that keep up. Some RTEs are moving toward AI-Native Value Architect.', 'RTEs in an AI-Native ART', '/rtes-in-an-ai-native-art-the-job-doesnt-change-the-pace-does-and-the-rte-is-the-person-who-keeps-the-system-flowing-while-everything-inside-it-speeds-up/' ),
		array( 'SPC', 'Launching trains to a fixed template.', 'Deciding where AI belongs in each value stream, and teaching leaders to govern and measure it.', 'AI-Native Value Architect', '/training/ai-native/ai-native-change-agent/' ),
	) );
	$r = '<div style="' . $eye . '">02 · The role, with AI in the room</div><h2 style="' . $h2 . '">How the Scrum Master, RTE and SPC roles are changing</h2>'
	   . '<p style="margin:0 0 14px;' . $F . 'font-size:14.5px;line-height:1.6;color:#35555B;">AI takes on more of the tracking, drafting and analysis. What stays with people is judgment, context and the decisions a team owns.</p>';
	foreach ( $roles as $ro ) {
		$r .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;border:1px solid #DCEAE8;border-radius:10px;"><tr><td style="padding:14px 16px;">'
		    . '<span style="display:inline-block;padding:3px 9px;border-radius:100px;background:#EAF5F3;' . $F . 'font-size:11px;font-weight:700;letter-spacing:.06em;color:#0B2E35;">' . $e( $ro[0] ) . '</span>'
		    . '<p style="margin:10px 0 4px;' . $F . 'font-size:14px;line-height:1.5;color:#0B2E35;"><span style="color:#5C7479;">Less of:</span> ' . $e( $ro[1] ) . '</p>'
		    . '<p style="margin:0 0 8px;' . $F . 'font-size:14px;line-height:1.5;color:#0B2E35;"><span style="color:#0E8074;font-weight:700;">More of:</span> ' . $e( $ro[2] ) . '</p>'
		    . '<a href="' . esc_url( $utm( home_url( $ro[4] ) ) ) . '" style="' . $F . 'font-size:14px;font-weight:700;color:#0E8074;text-decoration:none;">' . $e( $ro[3] ) . ' ⟶</a></td></tr></table>';
	}
	$r .= '<p style="margin:2px 0 0;' . $F . 'font-size:12px;line-height:1.5;color:#5C7479;">Our view, not an official Scaled Agile position. One route, not the only one.</p>';
	$b .= $sec( $r );

	/* 3. What's new */
	$new = apply_filters( 'aa_sf_nl_whats_new', array(
		array( 'NEW', 'AI-Native SAFe Fundamentals', 'A one-day introduction to running SAFe with AI in the flow of work. Live online, exam included.', '/training/ai-native/ai-native-ready-certification/' ),
		array( 'NEW', 'Launching AI-Native ARTs', 'Turn your Lean-Agile foundation into an engine for AI-driven execution. Two days, SAFe® ART Leader certification, exam included.', '/training/ai-native/launching-ai-native-arts/' ),
		array( 'UPDATED', 'Large Solution SAFe®', 'Built on Scaled Agile\'s recently updated Large Solution Delivery discipline, for complex systems with external partners. Two days, SPCT-led.', '/training/adv-safe/large-solution/' ),
	) );
	if ( $new ) {
		$w = '<div style="' . $eye . '">03 · What\'s new in SAFe &amp; AI-Native</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #DCEAE8;">';
		foreach ( $new as $n ) {
			$w .= '<tr><td style="padding:14px 0;border-bottom:1px solid #DCEAE8;"><span style="display:inline-block;padding:2px 8px;border-radius:100px;background:' . ( $n[0] === 'NEW' ? '#F2B66D' : '#B9DCDC' ) . ';' . $F . 'font-size:10.5px;font-weight:700;letter-spacing:.08em;color:#0B2E35;">' . $e( $n[0] ) . '</span>'
			    . '<div style="margin-top:6px;"><a href="' . esc_url( $utm( home_url( $n[3] ) ) ) . '" style="' . $F . 'font-size:16px;font-weight:700;color:#0B2E35;text-decoration:none;">' . $e( $n[1] ) . '</a></div>'
			    . '<div style="' . $mute . 'margin-top:3px;">' . $e( $n[2] ) . '</div></td></tr>';
		}
		$b .= $sec( $w . '</table>' );
	}

	/* 4. Latest from the blog */
	if ( $posts ) {
		$l = '<div style="' . $eye . '">04 · Latest from the blog</div>';
		foreach ( array_slice( $posts, 0, 3 ) as $p ) {
			$l .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;background:#F4F9F8;border-radius:10px;"><tr><td style="padding:16px;">'
			    . '<a href="' . esc_url( $utm( $p['url'] ) ) . '" style="' . $SER . 'font-size:19px;line-height:1.25;color:#0B2E35;text-decoration:none;">' . $e( $p['title'] ) . '</a>'
			    . '<div style="' . $mute . 'margin-top:6px;">' . $e( $p['excerpt'] ) . '</div></td></tr></table>';
		}
		$b .= $sec( $l );
	}

	/* 5. Free tools */
	$tools = apply_filters( 'aa_sf_nl_tools', array(
		array( 'Career Compass', 'Map your next role and the step to get there.', '/career-compass/' ),
		array( 'Agile Career Selector', 'Six questions to the certification that fits you.', '/assessments/cert-recommender/' ),
		array( 'Agile Assessment', 'Six capability dimensions of organizational agility.', '/assessments/agile-assessment/' ),
		array( 'AI Assessment', 'AI maturity and readiness across eight dimensions.', '/assessments/ai-assessment/' ),
		array( 'Product Management', 'Product practice, or a feature factory with PM titles?', '/assessments/product-management-assessment/' ),
		array( 'Innovation Framework', 'A 15-question check of your innovation operating system.', '/assessments/innovation-framework/' ),
		array( 'Mutation Readiness', 'Ready to change the model, not only work inside it?', '/assessments/mutation-readiness/' ),
		array( 'Agile Maturity', 'Where your teams sit today, and the next step up.', '/assessments/agile-maturity/' ),
	) );
	$t = '<div style="' . $eye . '">05 · Free tools we use with clients</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0">';
	foreach ( array_chunk( $tools, 2 ) as $row ) {
		$t .= '<tr>';
		foreach ( $row as $i => $tl ) {
			$t .= ( $i ? '<td width="10"></td>' : '' ) . '<td width="50%" style="vertical-align:top;padding:12px 14px;border:1px solid #DCEAE8;border-radius:10px;">'
			    . '<a href="' . esc_url( $utm( home_url( $tl[2] ) ) ) . '" style="' . $F . 'font-size:15px;font-weight:700;color:#0B2E35;text-decoration:none;">' . $e( $tl[0] ) . '</a>'
			    . '<div style="' . $F . 'font-size:13px;line-height:1.45;color:#5C7479;margin-top:3px;">' . $e( $tl[1] ) . '</div></td>';
		}
		$t .= '</tr><tr><td colspan="3" height="10" style="font-size:0;line-height:0;">&nbsp;</td></tr>';
	}
	$b .= $sec( $t . '</table>' );

	/* 6. Next classes */
	if ( $classes ) {
		$n = '<div style="' . $eye . '">06 · Next classes</div>';
		if ( substr( $ym, 5, 2 ) === '12' ) {
			$n .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;background:#FFF6E6;border:1px solid #F2B66D;border-radius:10px;"><tr><td style="padding:12px 14px;' . $F . 'font-size:14px;line-height:1.45;color:#0B2E35;"><strong>Holiday week:</strong> two-day classes start every day from Dec 26 to Dec 30, so you can certify without taking leave.</td></tr></table>';
		}
		$n .= '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #DCEAE8;">';
		foreach ( array_slice( $classes, 0, 6 ) as $c ) {
			$n .= '<tr><td style="padding:12px 0;border-bottom:1px solid #DCEAE8;"><a href="' . esc_url( $utm( $c['url'] ) . '#enroll' ) . '" style="' . $F . 'font-size:15px;font-weight:700;color:#0B2E35;text-decoration:none;">' . $e( $c['name'] ) . ' ⟶</a>'
			    . '<div style="' . $F . 'font-size:13.5px;color:#5C7479;margin-top:2px;">' . $e( implode( '  ·  ', $c['dates'] ) ) . '</div></td></tr>';
		}
		$n .= '</table><p style="margin:10px 0 0;' . $F . 'font-size:12.5px;color:#5C7479;">Live online, instructor-led. Exam fee included in every class. <a href="' . esc_url( $utm( home_url( '/training/' ) ) ) . '" style="color:#0E8074;">All classes</a></p>';
		$b .= $sec( $n );
	}

	/* 7. Team training + sign-off */
	$b .= '<tr><td style="padding:22px 28px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F9F8;border-radius:12px;"><tr><td style="padding:18px 20px;">'
	    . '<div style="' . $SER . 'font-size:20px;color:#0B2E35;">Training a team?</div><div style="' . $mute . 'margin:4px 0 12px;">Private classes on your dates, or a block of seats in public classes.</div>'
	    . $btn( $utm( home_url( '/team-training/' ) ), 'Request a quote ⟶', '#0E8074', '#FFFFFF' ) . '</td></tr></table>'
	    . '<p style="margin:20px 0 0;' . $F . 'font-size:15px;line-height:1.5;color:#0B2E35;">John Scott, Agile Agilist<br><span style="font-size:13.5px;color:#5C7479;">Reply to this email and it reaches us at info@agile-agilist.com.</span></p></td></tr>';

	/* Footer */
	$b .= '<tr><td style="padding:16px 28px 22px;border-top:1px solid #DCEAE8;' . $F . 'font-size:12px;line-height:1.6;color:#6B8286;">Agile Agilist · ' . $e( $addr ) . '<br>'
	    . 'You are receiving this because you subscribed at agile-agilist.com. <a href="' . esc_url( $unsub ) . '" style="color:#6B8286;text-decoration:underline;">Unsubscribe</a>.</td></tr>';

	$subj = $spot ? 'Agile Agilist · ' . $month . ': ' . ( $spot['kicker'] !== '' ? $spot['kicker'] . ' ' . $spot['accent'] : $spot['title'] ) : 'Agile Agilist · ' . $month;
	$pre  = ( $career ? 'Career snap: ' . $career['name'] . ', median USD ' . $career['median'] . 'K. ' : '' ) . 'How AI is changing the Scrum Master, RTE and SPC roles.';
	$html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . $e( $subj ) . '</title></head>'
	      . '<body style="margin:0;padding:0;background:#EEF4F3;"><div style="display:none;max-height:0;overflow:hidden;color:#EEF4F3;">' . $e( $pre ) . '</div>'
	      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF4F3;"><tr><td align="center" style="padding:20px 10px;">'
	      . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#FFFFFF;border-radius:14px;overflow:hidden;">' . $b . '</table></td></tr></table></body></html>';
	$html = aa_sf_nl_harden( $html );
	return array( 'subject' => ( $preview ? '[Preview] ' : '' ) . $subj, 'html' => $html, 'classes' => count( $classes ), 'posts' => count( $posts ), 'spotlight' => $spot ? $spot['id'] : 0 );
}

/**
 * Make every fill survive mail filters. The shorthand "background:" is dropped
 * by Gmail's sanitiser and several others, so each one becomes the longhand
 * background-color, and every <table>, <td> and <body> that has a fill also
 * gets the old bgcolor attribute, which nearly every client keeps.
 */
function aa_sf_nl_harden( $html ) {
	$html = preg_replace( '/(?<![-\w])background:\s*(#[0-9A-Fa-f]{3,8})/', 'background-color:$1', $html );
	return preg_replace_callback( '/<(table|td|body)\b([^>]*)>/i', function ( $m ) {
		if ( stripos( $m[2], 'bgcolor=' ) !== false ) { return $m[0]; }
		if ( ! preg_match( '/background-color:\s*(#[0-9A-Fa-f]{3,8})/i', $m[2], $c ) ) { return $m[0]; }
		return '<' . $m[1] . ' bgcolor="' . $c[1] . '"' . $m[2] . '>';
	}, $html );
}

function aa_sf_nl_mail( $to, $mail, $unsub = '' ) {
	$headers = array( 'Content-Type: text/html; charset=UTF-8', 'Reply-To: Agile Agilist <info@agile-agilist.com>' );
	if ( $unsub !== '' ) { $headers[] = 'List-Unsubscribe: <' . $unsub . '>'; $headers[] = 'List-Unsubscribe-Post: List-Unsubscribe=One-Click'; }
	return (bool) wp_mail( $to, $mail['subject'], $mail['html'], $headers );
}

function aa_sf_nl_send_preview( $ym ) {
	$s    = aa_sf_nl_settings();
	$mail = aa_sf_nl_build( $ym, $s['notify'], true );
	if ( ! $mail ) { return false; }
	return aa_sf_nl_mail( $s['notify'], $mail );
}

/* ------------------------------------------------------------------- run */

function aa_sf_nl_tick() {
	$s = aa_sf_nl_settings();
	if ( ! $s['on'] ) { return; }
	aa_sf_nl_sync();
	$now  = new DateTime( 'now', wp_timezone() );
	$next = aa_sf_nl_next( $now );
	$ym   = $next['ym']; $at = $next['at'];

	/* Two days before: the preview, once per issue. */
	if ( $s['preview'] !== $ym && $now >= ( clone $at )->modify( '-2 days' ) && $now < ( clone $at )->modify( '+3 days' ) && aa_sf_nl_recipients() ) {
		if ( aa_sf_nl_send_preview( $ym ) ) { aa_sf_nl_set( 'preview', $ym ); }
	}
	if ( $now < $at || $s['skip'] === $ym || ! $s['approved'] ) { return; }
	if ( $s['last'] !== $ym && ! get_transient( 'aa_sf_nl_presend_' . $ym ) ) { set_transient( 'aa_sf_nl_presend_' . $ym, 1, DAY_IN_SECONDS ); aa_sf_nl_sync( true ); }

	/* The issue, in batches. Each row remembers the last issue it was sent. */
	$list = get_option( 'aa_sf_subscribers', array() );
	$list = is_array( $list ) ? $list : array();
	$sent = 0; $left = 0;
	foreach ( aa_sf_nl_recipients() as $email => $r ) {
		if ( isset( $r['nl'] ) && $r['nl'] === $ym ) { continue; }
		if ( $sent >= 40 ) { $left++; continue; }
		$mail = aa_sf_nl_build( $ym, $email );
		if ( ! $mail ) { aa_sf_nl_set( 'last', $ym ); aa_sf_nl_log( $ym, 0, 'nothing to send' ); return; }
		$list[ $email ]['nl'] = $ym;                       /* marked first, so a crash cannot send twice */
		update_option( 'aa_sf_subscribers', $list, false );
		if ( aa_sf_nl_mail( $email, $mail, aa_sf_nl_unsub_link( $email ) ) ) { $sent++; }
	}
	if ( $sent ) { aa_sf_nl_log( $ym, $sent, '' ); }
	if ( $left ) { if ( ! wp_next_scheduled( 'aa_sf_nl_tick_more' ) ) { wp_schedule_single_event( time() + 180, 'aa_sf_nl_tick_more' ); } return; }
	aa_sf_nl_set( 'last', $ym );
	aa_sf_nl_set( 'last_at', current_time( 'mysql' ) );
	$sp = aa_sf_nl_spotlight( $ym ); $done = isset( $s['spotlit'] ) && is_array( $s['spotlit'] ) ? $s['spotlit'] : array();
	if ( $sp ) { $done[ $ym ] = $sp['id']; aa_sf_nl_set( 'spotlit', $done ); }
	if ( ! empty( $s['spotlight'] ) ) { aa_sf_nl_set( 'spotlight', 0 ); }   /* a chosen spotlight is for one issue */
	if ( $s['note'] !== '' ) { aa_sf_nl_set( 'note', '' ); }  /* a note is for one issue */
}
add_action( 'aa_sf_nl_tick', 'aa_sf_nl_tick' );
add_action( 'aa_sf_nl_tick_more', 'aa_sf_nl_tick' );
add_action( 'init', function () {
	if ( ! wp_next_scheduled( 'aa_sf_nl_tick' ) ) { wp_schedule_event( time() + 300, 'hourly', 'aa_sf_nl_tick' ); }
} );

function aa_sf_nl_log( $ym, $n, $why ) {
	$log = get_option( 'aa_sf_nl_log', array() ); $log = is_array( $log ) ? $log : array();
	if ( isset( $log[ $ym ] ) ) { $n += (int) $log[ $ym ]['n']; }
	$log[ $ym ] = array( 'n' => $n, 't' => current_time( 'mysql' ), 'why' => $why );
	krsort( $log );
	update_option( 'aa_sf_nl_log', array_slice( $log, 0, 36, true ), false );
}

/* ------------------------------------------- links in emails (no login) */

function aa_sf_nl_page( $title, $text ) {
	nocache_headers();
	wp_die( '<h1 style="font:400 28px/1.2 Georgia,serif;color:#0B2E35">' . esc_html( $title ) . '</h1><p style="font:16px/1.6 Arial,sans-serif;color:#35555B">' . esc_html( $text ) . '</p><p><a href="' . esc_url( home_url( '/' ) ) . '">agile-agilist.com</a></p>', esc_html( $title ), array( 'response' => 200 ) );
}
function aa_sf_nl_handle() {
	$do = isset( $_REQUEST['do'] ) ? sanitize_key( $_REQUEST['do'] ) : '';                        // phpcs:ignore WordPress.Security.NonceVerification -- signed link
	$a  = isset( $_REQUEST['a'] ) ? rawurldecode( (string) wp_unslash( $_REQUEST['a'] ) ) : '';   // phpcs:ignore
	$k  = isset( $_REQUEST['k'] ) ? (string) $_REQUEST['k'] : '';                                 // phpcs:ignore
	if ( ! in_array( $do, array( 'unsub', 'approve', 'skip' ), true ) || ! hash_equals( aa_sf_nl_key( $do . '|' . $a ), $k ) ) { aa_sf_nl_page( 'That link is not valid', 'Please use the link from the most recent email, or write to info@agile-agilist.com.' ); }

	if ( $do === 'unsub' ) {
		$email = strtolower( (string) base64_decode( strtr( $a, '-_', '+/' ) ) );
		$list  = get_option( 'aa_sf_subscribers', array() ); $list = is_array( $list ) ? $list : array();
		if ( is_email( $email ) && empty( $list[ $email ]['unsub'] ) ) {
			$list[ $email ] = array_merge( isset( $list[ $email ] ) ? (array) $list[ $email ] : array( 't' => current_time( 'mysql' ) ), array( 'unsub' => current_time( 'mysql' ), 'why' => 'unsubscribe link' ) );
			update_option( 'aa_sf_subscribers', $list, false );
			/* HubSpot too, so the contact list and the next sync agree. */
			if ( function_exists( 'aa_sf_sub_token' ) && aa_sf_sub_token() !== '' ) {
				aa_sf_sub_hs( 'PATCH', '/crm/v3/objects/contacts/' . rawurlencode( $email ) . '?idProperty=email', array( 'properties' => array( 'aa_newsletter' => 'Unsubscribed ' . current_time( 'Y-m-d' ) ) ) );
			}
		}
		aa_sf_nl_page( 'You are unsubscribed', 'You will not get the monthly newsletter again. If this was a mistake, subscribe again in the footer of agile-agilist.com.' );
	}
	if ( $do === 'approve' ) { aa_sf_nl_set( 'approved', 1 ); aa_sf_nl_page( 'Approved', 'The newsletter will go out on its scheduled date, and every month after. You will get a preview two days before each issue.' ); }
	if ( $do === 'skip' )    { aa_sf_nl_set( 'skip', preg_match( '/^\d{4}-\d{2}$/', $a ) ? $a : '' ); aa_sf_nl_page( 'Skipped', 'This month\'s newsletter will not be sent. Next month runs as usual.' ); }
}
add_action( 'admin_post_aa_sf_nl', 'aa_sf_nl_handle' );
add_action( 'admin_post_nopriv_aa_sf_nl', 'aa_sf_nl_handle' );

/* --------------------------------------------------- Tools → Newsletter */

add_action( 'admin_menu', function () {
	add_management_page( 'Newsletter', 'Newsletter', 'manage_options', 'aa-sf-newsletter', 'aa_sf_nl_admin' );
} );
function aa_sf_nl_admin() {
	$s = aa_sf_nl_settings(); $next = aa_sf_nl_next(); $n = count( aa_sf_nl_recipients() );
	$log = get_option( 'aa_sf_nl_log', array() ); $log = is_array( $log ) ? $log : array();
	$post = esc_url( admin_url( 'admin-post.php' ) );
	echo '<div class="wrap"><h1>Newsletter</h1>';
	if ( isset( $_GET['msg'] ) ) { echo '<div class="notice notice-success"><p>' . esc_html( sanitize_text_field( wp_unslash( $_GET['msg'] ) ) ) . '</p></div>'; } // phpcs:ignore
	$all = get_option( 'aa_sf_subscribers', array() ); $all = is_array( $all ) ? $all : array(); $nh = 0; $nu = 0;
	foreach ( $all as $r ) { if ( ! empty( $r['unsub'] ) ) { $nu++; } elseif ( ! empty( $r['src'] ) && $r['src'] === 'hubspot' ) { $nh++; } }
	echo '<p><strong>' . (int) $n . '</strong> will get the next issue (' . (int) ( $n - $nh ) . ' from the footer box, ' . (int) $nh . ' from HubSpot; ' . (int) $nu . ' unsubscribed). <a href="' . esc_url( admin_url( 'tools.php?page=aa-sf-subscribers' ) ) . '">See the list</a>. '
	   . ( ! empty( $s['synced'] ) ? 'Last HubSpot sync: ' . esc_html( $s['synced'] ) . '. ' : '' ) . '</p><p>'
	   . 'Next issue: <strong>' . esc_html( $next['at']->format( 'l, F j, Y \a\t g:i a' ) ) . '</strong> (site time)'
	   . ( $s['skip'] === $next['ym'] ? ' — <strong>skipped</strong>' : '' ) . '. A preview goes to ' . esc_html( $s['notify'] ) . ' two days before.</p>';
	if ( ! $s['on'] ) { echo '<p><strong>Sending is switched off.</strong></p>'; }
	elseif ( ! $s['approved'] ) { echo '<div class="notice notice-warning inline"><p><strong>Not approved yet.</strong> Nothing is sent to subscribers until you approve the first issue: send yourself a preview, then press Approve.</p></div>'; }

	echo '<form method="post" action="' . $post . '">' . wp_nonce_field( 'aa_sf_nl_admin', '_wpnonce', true, false ) . '<input type="hidden" name="action" value="aa_sf_nl_admin">'
	   . '<table class="form-table"><tr><th>Send automatically</th><td><label><input type="checkbox" name="on" value="1"' . checked( 1, (int) $s['on'], false ) . '> Yes, every month</label></td></tr>'
	   . '<tr><th>When</th><td>The <select name="week">';
	foreach ( array( 1 => 'first', 2 => 'second', 3 => 'third', 4 => 'fourth' ) as $k => $v ) { echo '<option value="' . (int) $k . '"' . selected( $k, (int) $s['week'], false ) . '>' . esc_html( $v ) . '</option>'; }
	echo '</select> <select name="dow">';
	foreach ( array( 'monday', 'tuesday', 'wednesday', 'thursday', 'friday' ) as $d ) { echo '<option value="' . esc_attr( $d ) . '"' . selected( $d, $s['dow'], false ) . '>' . esc_html( ucfirst( $d ) ) . '</option>'; }
	echo '</select> of the month at <input type="number" name="hour" min="0" max="23" value="' . (int) $s['hour'] . '" style="width:64px">:00 (site time)</td></tr>'
	   . '<tr><th>Who gets it</th><td><select name="audience">'
	   . '<option value="both"' . selected( 'both', $s['audience'], false ) . '>Footer sign-ups and HubSpot contacts marked Subscribed (recommended)</option>'
	   . '<option value="hubspot"' . selected( 'hubspot', $s['audience'], false ) . '>HubSpot contacts marked Subscribed only</option>'
	   . '<option value="local"' . selected( 'local', $s['audience'], false ) . '>Footer sign-ups only (HubSpot not read)</option>'
	   . '</select><p class="description">HubSpot: contacts whose "Agile Agilist — newsletter" property says Subscribed. Anyone opted out of email in HubSpot is never sent to.</p></td></tr>'
	   . '<tr><th>Preview goes to</th><td><input type="email" name="notify" value="' . esc_attr( $s['notify'] ) . '" class="regular-text"></td></tr>'
	   . '<tr><th>Your note for the next issue</th><td><textarea name="note" rows="5" class="large-text" placeholder="Optional. Appears at the top of the next issue only, in your words.">' . esc_textarea( $s['note'] ) . '</textarea></td></tr></table>'
	   . '<p><button class="button button-primary" name="go" value="save">Save</button> '
	   . '<button class="button" name="go" value="preview">Save and send me a preview now</button> '
	   . '<button class="button" name="go" value="sync">Save and read HubSpot now</button> '
	   . ( $s['approved'] ? '' : '<button class="button" name="go" value="approve">Approve and start sending</button> ' )
	   . '<button class="button" name="go" value="' . ( $s['skip'] === $next['ym'] ? 'unskip' : 'skip' ) . '">' . ( $s['skip'] === $next['ym'] ? 'Do not skip the next issue' : 'Skip the next issue' ) . '</button></p></form>';

	echo '<h2>Sent</h2><table class="widefat striped" style="max-width:640px"><thead><tr><th>Issue</th><th>Emails</th><th>When</th><th></th></tr></thead><tbody>';
	foreach ( $log as $ym => $r ) { echo '<tr><td>' . esc_html( $ym ) . '</td><td>' . (int) $r['n'] . '</td><td>' . esc_html( $r['t'] ) . '</td><td>' . esc_html( $r['why'] ) . '</td></tr>'; }
	if ( ! $log ) { echo '<tr><td colspan="4">Nothing sent yet.</td></tr>'; }
	echo '</tbody></table></div>';
}
add_action( 'admin_post_aa_sf_nl_admin', function () {
	if ( ! current_user_can( 'manage_options' ) ) { wp_die( 'No.' ); }
	check_admin_referer( 'aa_sf_nl_admin' );
	$s = aa_sf_nl_settings(); $p = wp_unslash( $_POST );
	$s['on']     = empty( $p['on'] ) ? 0 : 1;
	$s['week']   = max( 1, min( 4, (int) ( isset( $p['week'] ) ? $p['week'] : 1 ) ) );
	$s['dow']    = isset( $p['dow'] ) ? sanitize_key( $p['dow'] ) : 'tuesday';
	$s['hour']   = max( 0, min( 23, (int) ( isset( $p['hour'] ) ? $p['hour'] : 10 ) ) );
	$s['notify'] = isset( $p['notify'] ) && is_email( $p['notify'] ) ? sanitize_email( $p['notify'] ) : $s['notify'];
	$s['note']   = isset( $p['note'] ) ? sanitize_textarea_field( $p['note'] ) : '';
	$s['audience'] = isset( $p['audience'] ) && in_array( $p['audience'], array( 'both', 'hubspot', 'local' ), true ) ? $p['audience'] : 'both';
	$go  = isset( $p['go'] ) ? sanitize_key( $p['go'] ) : 'save';
	$msg = 'Saved.';
	if ( $go === 'approve' ) { $s['approved'] = 1; $msg = 'Approved. The newsletter will go out on its scheduled date.'; }
	update_option( 'aa_sf_nl', $s, false );
	$next = aa_sf_nl_next();
	if ( $go === 'skip' )   { aa_sf_nl_set( 'skip', $next['ym'] ); $msg = 'The next issue will be skipped.'; }
	if ( $go === 'unskip' ) { aa_sf_nl_set( 'skip', '' ); $msg = 'The next issue will be sent.'; }
	if ( $go === 'sync' ) { $msg = aa_sf_nl_sync( true ); }
	if ( $go === 'preview' ) { $msg = aa_sf_nl_send_preview( $next['ym'] ) ? 'Preview sent to ' . $s['notify'] . '.' : 'Nothing to preview: no class dates, no new posts and no note.'; }
	wp_safe_redirect( add_query_arg( array( 'page' => 'aa-sf-newsletter', 'msg' => rawurlencode( $msg ) ), admin_url( 'tools.php' ) ) );
	exit;
} );

endif;
