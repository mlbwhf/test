<?php
/**
 * AA — Agent ready
 *
 * WPCode: PHP snippet, "Run everywhere". Paste everything below the <?php line.
 *
 * What it adds, all read-only and public:
 *   1. robots.txt   Content-Signal line (search=yes, ai-input=yes, ai-train=no).
 *   2. /llms.txt    Markdown summary of the business, every course with price,
 *                   length and next dates, and the key pages.
 *   3. Markdown     Any page or post answers Accept: text/markdown (or ?format=md)
 *                   with a Markdown version of its content.
 *   4. WebMCP       In-browser tools registered with navigator.modelContext:
 *                   list_courses, find_course_dates, open_course_registration.
 *   5. MCP          A public, read-only MCP server at /wp-json/aa/v1/mcp, its
 *                   server card at /.well-known/mcp/server-card.json, and the
 *                   JSON catalog both use at /wp-json/aa/v1/catalog.
 *   6. Schema       Address and contact point on AIOSEO's Organization node, and
 *                   an ItemList of Courses with Offer (price, currency) on the
 *                   home page.
 *
 * Prices and dates come from the register snippet (aa_reg_courses /
 * aa_reg_upcoming), so nothing here has to be edited when a price changes.
 * Without the register snippet everything still loads; the course list is
 * simply empty.
 *
 * Nothing here can write, book or charge. The MCP server is separate from the
 * AI Engine admin MCP and does not expose it.
 */

if ( ! defined( 'ABSPATH' ) ) { return; }

if ( ! defined( 'AA_AG_VER' ) ) { define( 'AA_AG_VER', '1.0.0' ); }

/* ----------------------------------------------------------------------------
   Business facts. One place, used by llms.txt, the MCP card and the schema.
   ------------------------------------------------------------------------- */
function aa_ag_org() {
	return apply_filters( 'aa_ag_org', array(
		'name'        => 'Agile Agilist',
		'summary'     => 'Live, instructor-led SAFe® and AI-Native certification training (online, exam fee included) and SPCT-led agile and AI transformation consulting for enterprises.',
		'email'       => 'info@agile-agilist.com',
		'phone'       => '+1-647-999-7433',
		'address'     => array(
			'streetAddress'   => '55 Village Centre Place',
			'addressLocality' => 'Mississauga',
			'addressRegion'   => 'ON',
			'postalCode'      => 'L4Z 1V9',
			'addressCountry'  => 'CA',
		),
	) );
}

function aa_ag_address_line() {
	$a = aa_ag_org()['address'];
	return $a['streetAddress'] . ', ' . $a['addressLocality'] . ', ' . $a['addressRegion'] . ' ' . $a['postalCode'] . ', Canada';
}

/** The pages an agent should know about, in reading order. */
function aa_ag_key_pages() {
	return apply_filters( 'aa_ag_key_pages', array(
		array( '/training/',                 'Training', 'All SAFe® and AI-Native certifications, by track' ),
		array( '/training/select/',          'Choose your classes', 'Pick classes and dates, compare prices, register' ),
		array( '/training/ai-native/',       'AI-Native track', 'AI-Native SAFe courses' ),
		array( '/training/safe/',            'Core SAFe roles', 'Leading SAFe, Scrum Master, POPM and more' ),
		array( '/training/adv-safe/',        'Advanced SAFe', 'SPC, RTE, LPM, APM and more' ),
		array( '/training/safe-found/',      'Micro-credentials', 'Short, badge-only SAFe courses' ),
		array( '/training/safe-industry/',   'SAFe by industry', 'Government and hardware' ),
		array( '/services/',                 'Services', 'Transformation consulting' ),
		array( '/services/operating-model/', 'Operating model in the age of AI', 'The five-layer consulting model' ),
		array( '/assessments/',              'Assessments', 'Free agile, AI and product diagnostics' ),
		array( '/customers/',                'Customers', 'Results and industries' ),
		array( '/about/faq/',                'FAQ', 'Exams, payment, rescheduling' ),
		array( '/about/contact/',            'Contact', 'Send a message' ),
		array( '/blogs/',                    'Blog', 'Articles' ),
	) );
}

/* ----------------------------------------------------------------------------
   The catalog: every course on sale, its price and next dates.
   Cached for an hour; the register snippet is the source of truth.
   ------------------------------------------------------------------------- */
function aa_ag_catalog() {
	$cached = get_transient( 'aa_ag_catalog' );
	if ( is_array( $cached ) ) { return $cached; }

	$out = array();
	if ( function_exists( 'aa_reg_courses' ) ) {
		foreach ( (array) aa_reg_courses() as $slug => $c ) {
			if ( empty( $c['name'] ) || empty( $c['url'] ) ) { continue; }
			$price = isset( $c['price'] ) ? (float) $c['price'] : 0;
			$url   = home_url( $c['url'] );
			$dates = array();
			if ( function_exists( 'aa_reg_upcoming' ) ) {
				/* Classes already under way are still "upcoming" to the register
				   (it drops them when they end); an agent wants start dates ahead. */
				$today = ( new DateTime( 'now', new DateTimeZone( 'America/New_York' ) ) )->format( 'Y-m-d' );
				foreach ( (array) aa_reg_upcoming( $slug, $c ) as $k ) {
					if ( empty( $k['start'] ) || $k['start'] < $today ) { continue; }
					if ( count( $dates ) >= 6 ) { break; }
					$dates[] = array(
						'start'    => $k['start'],
						'end'      => isset( $k['end'] ) ? $k['end'] : $k['start'],
						'batch'    => isset( $k['batch'] ) ? (string) $k['batch'] : '',
						'register' => $url . '?cohort=' . rawurlencode( (string) $k['id'] ) . '#enroll',
					);
				}
			}
			$out[] = array(
				'slug'       => (string) $slug,
				'code'       => isset( $c['code'] ) ? (string) $c['code'] : '',
				'name'       => wp_strip_all_tags( (string) $c['name'] ),
				'url'        => $url,
				'price'      => $price > 0 ? $price : null,
				'currency'   => strtoupper( isset( $c['currency'] ) ? (string) $c['currency'] : 'usd' ),
				'days'       => isset( $c['days'] ) ? (int) $c['days'] : 0,
				'format'     => 'Live online, instructor-led; exam fee included',
				'next_dates' => $dates,
			);
		}
	}
	set_transient( 'aa_ag_catalog', $out, HOUR_IN_SECONDS );
	return $out;
}

/** Find one course by code, slug or a piece of its name. */
function aa_ag_match_course( $q ) {
	$q = strtolower( trim( (string) $q ) );
	if ( $q === '' ) { return null; }
	$cat = aa_ag_catalog();
	foreach ( $cat as $c ) {
		if ( strtolower( $c['code'] ) === $q || $c['slug'] === $q ) { return $c; }
	}
	foreach ( $cat as $c ) {
		if ( strpos( strtolower( $c['name'] ), $q ) !== false ) { return $c; }
	}
	return null;
}

function aa_ag_money( $c ) {
	return $c['price'] ? $c['currency'] . ' ' . number_format( $c['price'], 0 ) : 'Price on request';
}

function aa_ag_range( $d ) {
	$s = strtotime( $d['start'] );
	$e = strtotime( $d['end'] );
	if ( ! $s ) { return $d['start']; }
	if ( ! $e || $d['end'] === $d['start'] ) { return gmdate( 'D j M Y', $s ); }
	return gmdate( 'D j M', $s ) . ' – ' . gmdate( 'D j M Y', $e );
}

/* ----------------------------------------------------------------------------
   1. robots.txt: Content-Signal
   Only reaches visitors if robots.txt is generated by WordPress. A physical
   robots.txt file in the site root wins over this filter.
   ------------------------------------------------------------------------- */
add_filter( 'robots_txt', function ( $txt, $public ) {
	if ( ! $public || stripos( (string) $txt, 'Content-Signal' ) !== false ) { return $txt; }
	$sig = "# Content signals (contentsignals.org): search=yes allows search indexing,\n"
	     . "# ai-input=yes allows use as input to AI answers, ai-train=no disallows AI model training.\n"
	     . "Content-Signal: search=yes, ai-input=yes, ai-train=no";
	if ( preg_match( '/^User-agent:[ \t]*\*[ \t]*\r?$/mi', (string) $txt ) ) {
		return preg_replace( '/^(User-agent:[ \t]*\*[ \t]*)\r?$/mi', '$1' . "\n" . $sig, (string) $txt, 1 );
	}
	return "User-agent: *\n" . $sig . "\nAllow: /\n\n" . $txt;
}, 9999, 2 );

/* ----------------------------------------------------------------------------
   2 and 5. /llms.txt and /.well-known/mcp/server-card.json
   ------------------------------------------------------------------------- */
function aa_ag_request_path() {
	$path = (string) wp_parse_url( isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '', PHP_URL_PATH );
	$base = (string) wp_parse_url( home_url( '/' ), PHP_URL_PATH );
	if ( $base !== '/' && $base !== '' && strpos( $path, rtrim( $base, '/' ) ) === 0 ) {
		$path = substr( $path, strlen( rtrim( $base, '/' ) ) );
	}
	return $path;
}

function aa_ag_send( $type, $body, $max_age = 3600 ) {
	if ( ! defined( 'DONOTCACHEPAGE' ) ) { define( 'DONOTCACHEPAGE', true ); }
	status_header( 200 );
	header( 'Content-Type: ' . $type );
	header( 'Cache-Control: public, max-age=' . (int) $max_age );
	header( 'Access-Control-Allow-Origin: *' );
	header( 'X-Content-Type-Options: nosniff' );
	echo $body; // phpcs:ignore -- plain text / JSON built here, not HTML
	exit;
}

add_action( 'parse_request', function () {
	$path = aa_ag_request_path();
	if ( $path === '/llms.txt' ) {
		aa_ag_send( 'text/plain; charset=utf-8', aa_ag_llms() );
	}
	if ( $path === '/.well-known/mcp/server-card.json' || $path === '/.well-known/mcp.json' ) {
		aa_ag_send( 'application/json; charset=utf-8', wp_json_encode( aa_ag_server_card(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT ) );
	}
}, 0 );

function aa_ag_llms() {
	$o   = aa_ag_org();
	$md  = '# ' . $o['name'] . "\n\n";
	$md .= '> ' . $o['summary'] . " Prices are in US dollars and include the certification exam fee.\n\n";
	$md .= 'Contact: ' . $o['email'] . ' · ' . $o['phone'] . ' · ' . aa_ag_address_line() . "\n\n";
	$md .= "Every page on this site is also available as Markdown: send `Accept: text/markdown`, or add `?format=md` to the URL.\n\n";

	$cat = aa_ag_catalog();
	if ( $cat ) {
		$md .= "## Courses, prices and next dates\n\n";
		foreach ( $cat as $c ) {
			$line = '- [' . $c['name'] . '](' . $c['url'] . ')';
			$bits = array();
			if ( $c['code'] ) { $bits[] = $c['code']; }
			if ( $c['days'] ) { $bits[] = $c['days'] . ( $c['days'] === 1 ? ' day' : ' days' ); }
			$bits[] = aa_ag_money( $c );
			$line  .= ': ' . implode( ' · ', $bits );
			if ( $c['next_dates'] ) {
				$line .= ' · next: ' . implode( '; ', array_map( 'aa_ag_range', array_slice( $c['next_dates'], 0, 3 ) ) );
			}
			$md .= $line . "\n";
		}
		$md .= "\n";
	}

	$md .= "## Key pages\n\n";
	foreach ( aa_ag_key_pages() as $p ) {
		$md .= '- [' . $p[1] . '](' . home_url( $p[0] ) . '): ' . $p[2] . "\n";
	}
	$md .= "\n## For agents\n\n";
	$md .= '- Course catalog as JSON: ' . rest_url( 'aa/v1/catalog' ) . "\n";
	$md .= '- MCP server (read-only, no auth): ' . rest_url( 'aa/v1/mcp' ) . "\n";
	$md .= '- MCP server card: ' . home_url( '/.well-known/mcp/server-card.json' ) . "\n";
	$md .= "- Registration and payment happen on each course page (card via Stripe). A person has to complete payment.\n";
	return $md;
}

/* ----------------------------------------------------------------------------
   3. Markdown for agents
   ------------------------------------------------------------------------- */
function aa_ag_wants_md() {
	if ( isset( $_GET['format'] ) && $_GET['format'] === 'md' ) { return true; } // phpcs:ignore
	$accept = isset( $_SERVER['HTTP_ACCEPT'] ) ? (string) $_SERVER['HTTP_ACCEPT'] : '';
	if ( stripos( $accept, 'text/markdown' ) === false ) { return false; }
	$q = array( 'md' => 0.0, 'html' => 0.0 );
	foreach ( explode( ',', $accept ) as $part ) {
		$bits = array_map( 'trim', explode( ';', $part ) );
		$type = strtolower( array_shift( $bits ) );
		$qv   = 1.0;
		foreach ( $bits as $b ) {
			if ( stripos( $b, 'q=' ) === 0 ) { $qv = (float) substr( $b, 2 ); }
		}
		if ( $type === 'text/markdown' ) { $q['md'] = max( $q['md'], $qv ); }
		if ( $type === 'text/html' || $type === 'application/xhtml+xml' ) { $q['html'] = max( $q['html'], $qv ); }
	}
	return $q['md'] > 0 && $q['md'] >= $q['html'];
}

/* Point agents at the Markdown. No site-wide "Vary: Accept": it would split
   or switch off SiteGround's page cache for every visitor. The Markdown
   answer is never cached (headers below), so a cache cannot hand it to a
   person; at worst an agent behind a cache gets the HTML. */
add_action( 'wp_head', function () {
	if ( ! is_singular() && ! is_front_page() ) { return; }
	$url = is_front_page() ? home_url( '/' ) : get_permalink();
	if ( ! $url ) { return; }
	echo '<link rel="alternate" type="text/markdown" href="' . esc_url( add_query_arg( 'format', 'md', $url ) ) . '">' . "\n";
}, 2 );

add_action( 'template_redirect', function () {
	if ( is_admin() || is_feed() || is_404() || is_search() ) { return; }
	if ( ! aa_ag_wants_md() ) { return; }
	$post = get_queried_object();
	if ( ! ( $post instanceof WP_Post ) || post_password_required( $post ) || $post->post_status !== 'publish' ) { return; }

	$GLOBALS['post'] = $post;
	setup_postdata( $post );
	$html = apply_filters( 'the_content', $post->post_content );
	wp_reset_postdata();

	$url   = is_front_page() ? home_url( '/' ) : get_permalink( $post );
	$title = wp_strip_all_tags( html_entity_decode( get_the_title( $post ), ENT_QUOTES, 'UTF-8' ) );
	$desc  = wp_strip_all_tags( html_entity_decode( (string) $post->post_excerpt, ENT_QUOTES, 'UTF-8' ) );

	$md  = "---\ntitle: " . $title . "\nurl: " . $url . "\n";
	if ( $desc !== '' && strpos( $desc, '[' ) === false && strlen( $desc ) < 400 ) { $md .= 'description: ' . str_replace( "\n", ' ', $desc ) . "\n"; }
	$md .= "---\n\n# " . $title . "\n\n";

	/* On a course page, lead with the facts an agent came for. */
	$path = (string) wp_parse_url( $url, PHP_URL_PATH );
	foreach ( aa_ag_catalog() as $c ) {
		if ( (string) wp_parse_url( $c['url'], PHP_URL_PATH ) !== $path ) { continue; }
		$md .= '**Price:** ' . aa_ag_money( $c ) . ( $c['days'] ? ' · **Length:** ' . $c['days'] . ( $c['days'] === 1 ? ' day' : ' days' ) : '' ) . ' · ' . $c['format'] . "\n\n";
		if ( $c['next_dates'] ) {
			$md .= "**Next dates:**\n\n";
			foreach ( $c['next_dates'] as $d ) {
				$md .= '- ' . aa_ag_range( $d ) . ( $d['batch'] ? ' (' . $d['batch'] . ')' : '' ) . ': [register](' . $d['register'] . ")\n";
			}
			$md .= "\n";
		}
		break;
	}

	$md .= aa_ag_html_to_md( $html ) . "\n";

	if ( ! defined( 'DONOTCACHEPAGE' ) ) { define( 'DONOTCACHEPAGE', true ); }
	status_header( 200 );
	header( 'Content-Type: text/markdown; charset=utf-8' );
	header( 'Vary: Accept' );
	header( 'Cache-Control: private, no-store' );
	header( 'X-Cache-Enabled: False' );     // SiteGround: never cache this variant
	header( 'X-Robots-Tag: noindex' );      // the HTML page is the canonical one
	header( 'Link: <' . esc_url_raw( $url ) . '>; rel="canonical"' );
	echo $md; // phpcs:ignore -- Markdown, not HTML
	exit;
}, 0 );

function aa_ag_html_to_md( $html ) {
	$html = (string) $html;
	if ( trim( $html ) === '' ) { return ''; }
	if ( ! class_exists( 'DOMDocument' ) ) { return trim( wp_strip_all_tags( $html ) ); }
	$doc  = new DOMDocument();
	$prev = libxml_use_internal_errors( true );
	$doc->loadHTML( '<?xml encoding="utf-8"?><div>' . $html . '</div>', LIBXML_NOERROR | LIBXML_NOWARNING );
	libxml_clear_errors();
	libxml_use_internal_errors( $prev );
	$body = $doc->getElementsByTagName( 'body' )->item( 0 );
	if ( ! $body ) { return trim( wp_strip_all_tags( $html ) ); }
	$md = aa_ag_md_node( $body, 0 );
	$md = preg_replace( "/[ \t]+\n/", "\n", $md );
	$md = preg_replace( "/\n{3,}/", "\n\n", $md );
	return trim( $md );
}

function aa_ag_md_node( $node, $depth ) {
	static $skip = array( 'script', 'style', 'noscript', 'svg', 'form', 'iframe', 'button', 'input', 'select',
	                      'textarea', 'template', 'canvas', 'video', 'audio', 'nav', 'dialog', 'head', 'link', 'meta' );
	$out = '';
	foreach ( $node->childNodes as $n ) {
		if ( $n->nodeType === XML_TEXT_NODE ) {
			$out .= preg_replace( '/\s+/u', ' ', $n->nodeValue );
			continue;
		}
		if ( $n->nodeType !== XML_ELEMENT_NODE ) { continue; }
		$tag = strtolower( $n->nodeName );
		if ( in_array( $tag, $skip, true ) ) { continue; }
		$cls = ' ' . $n->getAttribute( 'class' ) . ' ';
		if ( $n->hasAttribute( 'hidden' ) || $n->getAttribute( 'aria-hidden' ) === 'true'
			|| preg_match( '/display\s*:\s*none/i', $n->getAttribute( 'style' ) )
			|| preg_match( '/\s(sharedaddy|sd-sharing-enabled|jp-relatedposts|screen-reader-text|aa-modal|aa-book)\s/', $cls ) ) {
			continue;
		}
		$inner = aa_ag_md_node( $n, $depth + ( ( $tag === 'ul' || $tag === 'ol' ) ? 1 : 0 ) );
		$t     = trim( $inner );
		switch ( $tag ) {
			case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
				if ( $t !== '' ) { $out .= "\n\n" . str_repeat( '#', min( 6, (int) $tag[1] + 1 ) ) . ' ' . preg_replace( '/\s+/', ' ', $t ) . "\n\n"; }
				break;
			case 'blockquote':
				if ( $t !== '' ) { $out .= "\n\n> " . str_replace( "\n", "\n> ", $t ) . "\n\n"; }
				break;
			case 'summary':
				if ( $t !== '' ) { $out .= "\n\n**" . $t . "**\n\n"; }
				break;
			case 'br':
				$out .= "\n";
				break;
			case 'hr':
				$out .= "\n\n---\n\n";
				break;
			case 'li':
				if ( $t !== '' ) { $out .= "\n" . str_repeat( '  ', max( 0, $depth - 1 ) ) . '- ' . $t; }
				break;
			case 'ul': case 'ol':
				$out .= "\n" . $inner . "\n";
				break;
			case 'a':
				$href = trim( $n->getAttribute( 'href' ) );
				if ( $t === '' ) { break; }
				if ( $href === '' || $href[0] === '#' || stripos( $href, 'javascript:' ) === 0 ) { $out .= $inner; break; }
				if ( $href[0] === '/' && substr( $href, 0, 2 ) !== '//' ) { $href = home_url( $href ); }
				$out .= '[' . preg_replace( '/\s+/', ' ', $t ) . '](' . $href . ')';
				break;
			case 'strong': case 'b':
				$out .= $t !== '' ? '**' . $t . '** ' : '';
				break;
			case 'em': case 'i':
				$out .= $t !== '' ? '*' . $t . '* ' : '';
				break;
			case 'img':
				$alt = trim( $n->getAttribute( 'alt' ) );
				if ( $alt !== '' ) { $out .= '![' . $alt . '](' . $n->getAttribute( 'src' ) . ')'; }
				break;
			case 'tr':
				$cells = array();
				foreach ( $n->childNodes as $cell ) {
					if ( $cell->nodeType === XML_ELEMENT_NODE && in_array( strtolower( $cell->nodeName ), array( 'td', 'th' ), true ) ) {
						$cells[] = str_replace( array( "\n", '|' ), array( ' ', '/' ), trim( aa_ag_md_node( $cell, $depth ) ) );
					}
				}
				if ( $cells ) { $out .= "\n| " . implode( ' | ', $cells ) . ' |'; }
				break;
			case 'table':
				/* Markdown tables need a separator under the first row. */
				$rows = explode( "\n", trim( $inner ) );
				if ( $rows && $rows[0] !== '' ) {
					array_splice( $rows, 1, 0, '|' . str_repeat( ' --- |', max( 1, substr_count( $rows[0], ' | ' ) + 1 ) ) );
				}
				$out .= "\n\n" . implode( "\n", $rows ) . "\n\n";
				break;
			case 'p': case 'div': case 'section': case 'article': case 'header': case 'footer':
			case 'main': case 'aside': case 'figure': case 'figcaption': case 'details': case 'dl': case 'dt': case 'dd':
				if ( $t !== '' ) { $out .= "\n\n" . $t . "\n\n"; }
				break;
			default:
				$out .= $inner;
		}
	}
	return $out;
}

/* ----------------------------------------------------------------------------
   5. REST: JSON catalog and the read-only MCP server
   ------------------------------------------------------------------------- */
add_action( 'rest_api_init', function () {
	register_rest_route( 'aa/v1', '/catalog', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => function () {
			$o = aa_ag_org();
			$r = new WP_REST_Response( array(
				'organization' => array(
					'name'    => $o['name'],
					'summary' => $o['summary'],
					'email'   => $o['email'],
					'phone'   => $o['phone'],
					'address' => aa_ag_address_line(),
					'url'     => home_url( '/' ),
				),
				'currency_note' => 'Prices in USD, certification exam fee included.',
				'courses'       => aa_ag_catalog(),
			) );
			$r->header( 'Cache-Control', 'public, max-age=900' );
			return $r;
		},
	) );

	register_rest_route( 'aa/v1', '/mcp', array(
		array(
			'methods'             => 'POST',
			'permission_callback' => '__return_true',
			'callback'            => 'aa_ag_mcp',
		),
		array(
			'methods'             => 'GET',
			'permission_callback' => '__return_true',
			'callback'            => function () {
				$r = new WP_REST_Response( array( 'error' => 'This MCP endpoint takes JSON-RPC over POST. See ' . home_url( '/.well-known/mcp/server-card.json' ) ), 405 );
				$r->header( 'Allow', 'POST' );
				return $r;
			},
		),
	) );
} );

function aa_ag_tool_defs() {
	return array(
		array(
			'name'        => 'list_courses',
			'title'       => 'List courses',
			'description' => 'List Agile Agilist certification courses with price (USD, exam fee included), length in days, page URL and the next start dates with registration links. Optional track filter: ai-native, safe, adv-safe, safe-found, safe-industry.',
			'inputSchema' => array(
				'type'       => 'object',
				'properties' => array( 'track' => array( 'type' => 'string', 'description' => 'Optional track slug, e.g. "ai-native".' ) ),
			),
			'annotations' => array( 'readOnlyHint' => true, 'openWorldHint' => false ),
		),
		array(
			'name'        => 'find_course_dates',
			'title'       => 'Find course dates',
			'description' => 'Upcoming start dates, price and registration links for one course, by code (e.g. "RTE", "SA", "POPM") or by part of its name (e.g. "Value Architect").',
			'inputSchema' => array(
				'type'       => 'object',
				'properties' => array( 'course' => array( 'type' => 'string', 'description' => 'Course code or part of the name.' ) ),
				'required'   => array( 'course' ),
			),
			'annotations' => array( 'readOnlyHint' => true, 'openWorldHint' => false ),
		),
		array(
			'name'        => 'get_contact_info',
			'title'       => 'Contact details',
			'description' => 'How to reach Agile Agilist: email, phone, address and the contact page, for team quotes, private sessions or questions.',
			'inputSchema' => array( 'type' => 'object', 'properties' => new stdClass() ),
			'annotations' => array( 'readOnlyHint' => true, 'openWorldHint' => false ),
		),
	);
}

function aa_ag_tool_call( $name, $args ) {
	$args = is_array( $args ) ? $args : array();
	switch ( $name ) {
		case 'list_courses':
			$list  = aa_ag_catalog();
			$track = isset( $args['track'] ) ? trim( (string) $args['track'], " /\t" ) : '';
			if ( $track !== '' ) {
				$list = array_values( array_filter( $list, function ( $c ) use ( $track ) {
					return strpos( $c['url'], '/' . $track . '/' ) !== false;
				} ) );
			}
			return array( 'courses' => $list );
		case 'find_course_dates':
			$c = aa_ag_match_course( isset( $args['course'] ) ? $args['course'] : '' );
			if ( ! $c ) { return new WP_Error( 'not_found', 'No course matches that code or name. Call list_courses to see them all.' ); }
			return array( 'course' => $c );
		case 'get_contact_info':
			$o = aa_ag_org();
			return array(
				'email'        => $o['email'],
				'phone'        => $o['phone'],
				'address'      => aa_ag_address_line(),
				'contact_page' => home_url( '/about/contact/' ),
			);
	}
	return null;
}

function aa_ag_mcp( WP_REST_Request $req ) {
	$body = json_decode( (string) $req->get_body(), true );
	if ( ! is_array( $body ) || ! $body ) {
		return new WP_REST_Response( array( 'jsonrpc' => '2.0', 'id' => null, 'error' => array( 'code' => -32700, 'message' => 'Parse error' ) ), 400 );
	}
	$batch = wp_is_numeric_array( $body );
	$out   = array();
	foreach ( ( $batch ? $body : array( $body ) ) as $m ) {
		$r = is_array( $m ) ? aa_ag_rpc( $m ) : array( 'jsonrpc' => '2.0', 'id' => null, 'error' => array( 'code' => -32600, 'message' => 'Invalid request' ) );
		if ( $r !== null ) { $out[] = $r; }
	}
	if ( ! $out ) { return new WP_REST_Response( null, 202 ); }
	$res = new WP_REST_Response( $batch ? $out : $out[0], 200 );
	$res->header( 'Cache-Control', 'no-store' );
	return $res;
}

function aa_ag_rpc( array $m ) {
	$note   = ! array_key_exists( 'id', $m );
	$id     = $note ? null : $m['id'];
	$method = isset( $m['method'] ) ? (string) $m['method'] : '';
	$params = isset( $m['params'] ) && is_array( $m['params'] ) ? $m['params'] : array();

	switch ( $method ) {
		case 'initialize':
			$known = array( '2025-06-18', '2025-03-26', '2024-11-05' );
			$ask   = isset( $params['protocolVersion'] ) ? (string) $params['protocolVersion'] : '';
			$res   = array(
				'protocolVersion' => in_array( $ask, $known, true ) ? $ask : $known[0],
				'capabilities'    => array( 'tools' => array( 'listChanged' => false ) ),
				'serverInfo'      => array( 'name' => 'agile-agilist-catalog', 'title' => 'Agile Agilist course catalog', 'version' => AA_AG_VER ),
				'instructions'    => 'Read-only. Use list_courses or find_course_dates for prices and dates; registration and payment happen on the course page and need a person.',
			);
			break;
		case 'ping':
			$res = new stdClass();
			break;
		case 'tools/list':
			$res = array( 'tools' => aa_ag_tool_defs() );
			break;
		case 'tools/call':
			$name = isset( $params['name'] ) ? (string) $params['name'] : '';
			$data = aa_ag_tool_call( $name, isset( $params['arguments'] ) ? $params['arguments'] : array() );
			if ( $data === null ) {
				return $note ? null : array( 'jsonrpc' => '2.0', 'id' => $id, 'error' => array( 'code' => -32602, 'message' => 'Unknown tool: ' . $name ) );
			}
			if ( is_wp_error( $data ) ) {
				$res = array( 'content' => array( array( 'type' => 'text', 'text' => $data->get_error_message() ) ), 'isError' => true );
			} else {
				$res = array(
					'content'           => array( array( 'type' => 'text', 'text' => wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) ) ),
					'structuredContent' => $data,
				);
			}
			break;
		default:
			if ( $note ) { return null; }   // notifications/initialized and friends
			return array( 'jsonrpc' => '2.0', 'id' => $id, 'error' => array( 'code' => -32601, 'message' => 'Method not found' ) );
	}
	return $note ? null : array( 'jsonrpc' => '2.0', 'id' => $id, 'result' => $res );
}

function aa_ag_server_card() {
	$tools = array();
	foreach ( aa_ag_tool_defs() as $t ) {
		$tools[] = array( 'name' => $t['name'], 'description' => $t['description'] );
	}
	return array(
		'$schema'          => 'https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json',
		'name'             => 'agile-agilist-catalog',
		'title'            => 'Agile Agilist course catalog',
		'version'          => AA_AG_VER,
		'description'      => 'Read-only catalog of Agile Agilist SAFe® and AI-Native certification courses: prices, length, next dates and registration links.',
		'protocolVersion'  => '2025-06-18',
		'serverInfo'       => array( 'name' => 'agile-agilist-catalog', 'title' => 'Agile Agilist course catalog', 'version' => AA_AG_VER ),
		'endpoint'         => rest_url( 'aa/v1/mcp' ),
		'url'              => rest_url( 'aa/v1/mcp' ),
		'transport'        => array( 'type' => 'streamable-http', 'url' => rest_url( 'aa/v1/mcp' ) ),
		'remotes'          => array( array( 'type' => 'streamable-http', 'url' => rest_url( 'aa/v1/mcp' ) ) ),
		'capabilities'     => array( 'tools' => array( 'listChanged' => false ) ),
		'authentication'   => array( 'required' => false ),
		'tools'            => $tools,
		'documentationUrl' => home_url( '/llms.txt' ),
		'websiteUrl'       => home_url( '/' ),
		'contact'          => array( 'email' => aa_ag_org()['email'] ),
	);
}

/* ----------------------------------------------------------------------------
   4. WebMCP: register the same tools with an in-browser agent on page load.
   Tiny, and does nothing at all unless the browser exposes navigator.modelContext.
   ------------------------------------------------------------------------- */
add_action( 'wp_footer', function () {
	if ( is_admin() ) { return; }
	$api = esc_url_raw( rest_url( 'aa/v1/catalog' ) );
	?>
<script id="aa-webmcp">(function(){var mc=navigator.modelContext;if(!mc)return;var API=<?php echo wp_json_encode( $api ); ?>,P;
function cat(){P=P||fetch(API,{credentials:'omit'}).then(function(r){return r.json()});return P}
function out(o){return{content:[{type:'text',text:JSON.stringify(o)}],structuredContent:o}}
function find(list,q){q=String(q||'').toLowerCase().trim();if(!q)return null;var i;for(i=0;i<list.length;i++){if(list[i].code.toLowerCase()===q||list[i].slug===q)return list[i]}for(i=0;i<list.length;i++){if(list[i].name.toLowerCase().indexOf(q)>-1)return list[i]}return null}
var tools=[
{name:'list_courses',description:'List Agile Agilist certification courses with price (USD, exam fee included), length in days, page URL and next start dates. Optional track: ai-native, safe, adv-safe, safe-found, safe-industry.',inputSchema:{type:'object',properties:{track:{type:'string'}}},annotations:{readOnlyHint:true},execute:function(a){return cat().then(function(d){var c=d.courses||[];if(a&&a.track){c=c.filter(function(x){return x.url.indexOf('/'+a.track+'/')>-1})}return out({courses:c})})}},
{name:'find_course_dates',description:'Upcoming dates, price and registration links for one course, by code (e.g. "RTE") or part of its name.',inputSchema:{type:'object',properties:{course:{type:'string'}},required:['course']},annotations:{readOnlyHint:true},execute:function(a){return cat().then(function(d){var m=find(d.courses||[],a&&a.course);return m?out({course:m}):out({error:'No course matches. Use list_courses.'})})}},
{name:'open_course_registration',description:'Open the registration section of a course page so the user can choose a date and pay. Payment is completed by the user on Stripe.',inputSchema:{type:'object',properties:{course:{type:'string'},start:{type:'string',description:'Optional start date YYYY-MM-DD'}},required:['course']},execute:function(a){return cat().then(function(d){var m=find(d.courses||[],a&&a.course);if(!m)return out({error:'No course matches. Use list_courses.'});var u=m.url+'#enroll';(m.next_dates||[]).forEach(function(x){if(a.start&&x.start===a.start)u=x.register});location.href=u;return out({opened:u})})}}
];
tools.forEach(function(t){try{if(mc.registerTool)mc.registerTool(t)}catch(e){}});
if(!mc.registerTool&&mc.provideContext){try{mc.provideContext({tools:tools})}catch(e){}}
})();</script>
	<?php
}, 99 );

/* ----------------------------------------------------------------------------
   6. Schema
   ------------------------------------------------------------------------- */

/* Address and contact point on AIOSEO's Organization node. */
add_filter( 'aioseo_schema_output', function ( $graphs ) {
	if ( ! is_array( $graphs ) ) { return $graphs; }
	$o = aa_ag_org();
	foreach ( $graphs as $i => $g ) {
		if ( ! is_array( $g ) || empty( $g['@type'] ) ) { continue; }
		$types = (array) $g['@type'];
		if ( ! array_intersect( $types, array( 'Organization', 'EducationalOrganization', 'LocalBusiness', 'ProfessionalService' ) ) ) { continue; }
		if ( empty( $g['address'] ) ) {
			$graphs[ $i ]['address'] = array_merge( array( '@type' => 'PostalAddress' ), $o['address'] );
		}
		if ( empty( $g['email'] ) )     { $graphs[ $i ]['email'] = $o['email']; }
		if ( empty( $g['telephone'] ) ) { $graphs[ $i ]['telephone'] = $o['phone']; }
		if ( empty( $g['contactPoint'] ) ) {
			$graphs[ $i ]['contactPoint'] = array(
				'@type'       => 'ContactPoint',
				'contactType' => 'customer service',
				'email'       => $o['email'],
				'telephone'   => $o['phone'],
				'url'         => home_url( '/about/contact/' ),
			);
		}
	}
	return $graphs;
}, 20 );

/* Every course with its price as an Offer, on the home page. Kept lean: the
   home hero already emits each course's next CourseInstance. */
add_action( 'wp_head', function () {
	if ( ! is_front_page() ) { return; }
	$items = array();
	$pos   = 0;
	foreach ( aa_ag_catalog() as $c ) {
		if ( ! $c['price'] ) { continue; }
		$course = array(
			'@type'       => 'Course',
			'name'        => $c['name'],
			'url'         => $c['url'],
			'provider'    => array( '@id' => home_url( '/#organization' ) ),
			'offers'      => array(
				'@type'         => 'Offer',
				'price'         => number_format( (float) $c['price'], 2, '.', '' ),
				'priceCurrency' => $c['currency'],
				'category'      => 'Paid',
				'availability'  => 'https://schema.org/InStock',
				'url'           => $c['url'] . '#enroll',
			),
		);
		if ( $c['code'] ) { $course['courseCode'] = $c['code']; }
		$items[] = array( '@type' => 'ListItem', 'position' => ++$pos, 'item' => $course );
	}
	if ( ! $items ) { return; }
	echo '<script type="application/ld+json">' . wp_json_encode( array(
		'@context'        => 'https://schema.org',
		'@type'           => 'ItemList',
		'name'            => 'Certification courses and prices',
		'url'             => home_url( '/training/select/' ),
		'itemListElement' => $items,
	), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ) . "</script>\n";
}, 30 );
