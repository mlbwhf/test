<?php
/**
 * The AI Index — Global + Mobile Navigation (single WPCode snippet)
 * =================================================================
 * Implements the report-ai.org navigation handoff: mobile drawer (<1180px)
 * + desktop "1a" index bar with hover shelves and condense-on-scroll (>=1180px).
 *
 * DATA IS PAGE-DRIVEN (per your choice): the four index tabs / drawer rows come
 * from your real /indexes/ silo pages; counts = their published child pages.
 * Flat rows (Reports, Glossary, About, Subscribe) come from the "Primary" nav
 * menu so editors control them at Appearance -> Menus.
 *
 * INSTALL: WPCode -> Add Snippet -> Custom Code -> **PHP Snippet**, paste this
 * whole file, Auto-Insert -> "Run Everywhere", Save + Activate.
 * (Or drop into a GeneratePress child theme functions.php, minus the <?php line.)
 *
 * ONE THING TO CHECK — $hide_selector below hides your CURRENT header so you
 * don't get two navs. Defaults to GeneratePress's header. If the old header
 * still shows, change it to your header wrapper (or send me the header markup).
 * =================================================================
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/* ============================ CONFIG ============================ */
if ( ! function_exists( 'ai_nav_config' ) ) {
	function ai_nav_config() {
		return array(
			// Hide the theme's existing header on all widths (avoid a double nav).
			'hide_selector' => '.site-header, #masthead',
			// The four items under "Indexes". Page ID => labels. THIS is the rename point:
			//   'name'  = full label in the mobile drawer row  (rename here — does NOT change the page/SEO title)
			//   'short' = short label on the desktop tab        (~131px max at 1180px, or it ellipsizes)
			//   'desc'  = grey description line in the drawer
			// Order = display order. Swap the page IDs to change which silos appear (exactly 4 by design).
			'indexes' => array(
				393 => array( 'name' => 'Enterprise AI Adoption',  'short' => 'Adoption',    'desc' => 'Adoption, gen AI, agentic workflows' ),       // page /indexes/enterprise-ai/
				392 => array( 'name' => 'AI Business & Economics', 'short' => 'Economics',   'desc' => 'Investment, spend, forecasts, LLM market' ),   // page /indexes/ai-economics/
				394 => array( 'name' => 'Technical Performance',   'short' => 'Performance', 'desc' => 'Benchmarks, compute, infrastructure, safety' ), // page /indexes/technical-benchmarks/
				395 => array( 'name' => 'Workforce & Labor',       'short' => 'Workforce',   'desc' => 'Jobs created & displaced, skills premium' ),    // page /indexes/workforce-labor/
			),
			'menu_id'      => 34,                               // "Primary" menu (flat rows)
			'subscribe'    => home_url( '/about/contact/' ),    // CTA target
			'glossary'     => home_url( '/glossary/' ),
			'about'        => home_url( '/about/' ),
		);
	}
}

/* ===================== DATA HELPERS (page-driven) ===================== */
if ( ! function_exists( 'ai_nav_indexes' ) ) {
	function ai_nav_indexes() {
		$cfg = ai_nav_config();
		$out = array();
		foreach ( $cfg['indexes'] as $pid => $meta ) {
			$p = get_post( $pid );
			if ( ! $p || 'publish' !== $p->post_status ) { continue; }
			$kids = get_pages( array( 'parent' => $pid, 'post_status' => 'publish', 'sort_column' => 'menu_order,post_title', 'sort_order' => 'ASC' ) );
			$out[] = array(
				'id'    => (int) $pid,
				'name'  => isset( $meta['name'] ) ? $meta['name'] : get_the_title( $pid ),
				'short' => isset( $meta['short'] ) ? $meta['short'] : ( isset( $meta['name'] ) ? $meta['name'] : get_the_title( $pid ) ),
				'desc'  => $meta['desc'],
				'count' => is_array( $kids ) ? count( $kids ) : 0,
				'url'   => get_permalink( $pid ),
				'kids'  => is_array( $kids ) ? array_slice( $kids, 0, 4 ) : array(),
			);
		}
		return $out;
	}
}
if ( ! function_exists( 'ai_nav_total' ) ) {
	function ai_nav_total() {
		$c = wp_count_posts( 'post' );
		return (int) ( isset( $c->publish ) ? $c->publish : 0 );
	}
}
if ( ! function_exists( 'ai_nav_updated' ) ) {
	function ai_nav_updated() {
		$q = get_posts( array( 'numberposts' => 1, 'orderby' => 'modified', 'order' => 'DESC', 'post_status' => 'publish', 'post_type' => array( 'post', 'page' ), 'fields' => 'ids' ) );
		return empty( $q ) ? '' : get_the_modified_time( 'F Y', $q[0] );
	}
}

/* ===================== RENDER (mobile header+drawer + desktop 1a bar) ===================== */
if ( ! function_exists( 'ai_nav_render' ) ) {
	function ai_nav_render() {
		if ( is_admin() ) { return; }
		$cfg     = ai_nav_config();
		$indexes = ai_nav_indexes();
		$total   = ai_nav_total();
		$updated = ai_nav_updated();
		$sub     = esc_url( $cfg['subscribe'] );
		$home    = esc_url( home_url( '/' ) );
		$cur_id  = get_queried_object_id();

		// Flat rows from the Primary menu, skipping the "Indexes" parent (the accordion covers it).
		$flat  = array();
		$items = wp_get_nav_menu_items( $cfg['menu_id'] );
		if ( $items ) {
			foreach ( $items as $it ) {
				if ( (int) $it->menu_item_parent !== 0 ) { continue; }
				if ( 0 === strcasecmp( trim( $it->title ), 'Indexes' ) ) { continue; }
				if ( 0 === strcasecmp( trim( $it->title ), 'Subscribe' ) ) { continue; } // Subscribe is the pinned CTA
				$flat[] = $it;
			}
		}
		?>
<div class="ai-nav" data-open="false">

	<header class="ai-header">
		<a class="ai-brand" href="<?php echo $home; ?>" rel="home">
			<span class="ai-mark" aria-hidden="true"><i></i><i></i><i></i></span>
			<span class="ai-wordmark">THE AI INDEX</span>
		</a>
		<button class="ai-burger" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="ai-drawer">
			<i aria-hidden="true"></i><i aria-hidden="true"></i>
		</button>
	</header>

	<nav id="ai-drawer" class="ai-drawer" aria-label="Main">
		<div class="ai-search">
			<form role="search" method="get" action="<?php echo $home; ?>">
				<span aria-hidden="true">&#8981;</span>
				<label class="screen-reader-text" for="ai-s">Search statistics</label>
				<input id="ai-s" type="search" name="s" placeholder="<?php echo esc_attr( sprintf( 'Search %s statistics&hellip;', number_format_i18n( $total ) ) ); ?>">
			</form>
		</div>

		<div class="ai-list">
			<button class="ai-row" type="button" data-accordion-toggle aria-expanded="false" aria-controls="ai-sub">
				<b>Indexes</b>
				<em><?php echo esc_html( count( $indexes ) ); ?> <i aria-hidden="true">+</i></em>
			</button>
			<div class="ai-sub" id="ai-sub">
				<?php foreach ( $indexes as $ix ) : ?>
					<a href="<?php echo esc_url( $ix['url'] ); ?>"<?php echo ( $ix['id'] === $cur_id ) ? ' aria-current="page"' : ''; ?>>
						<span>
							<strong><?php echo esc_html( $ix['name'] ); ?></strong>
							<?php if ( $ix['desc'] ) : ?><small><?php echo esc_html( $ix['desc'] ); ?></small><?php endif; ?>
						</span>
						<span class="ai-sub-count"><?php echo esc_html( $ix['count'] ); ?></span>
					</a>
				<?php endforeach; ?>
			</div>

			<?php foreach ( $flat as $it ) :
				$meta = $it->description;
				if ( '' === $meta && 0 === strcasecmp( trim( $it->title ), 'Reports' ) ) { $meta = number_format_i18n( $total ); }
				$is_cur = ( untrailingslashit( $it->url ) === untrailingslashit( home_url( add_query_arg( array() ) ) ) );
				?>
				<a class="ai-row" href="<?php echo esc_url( $it->url ); ?>"<?php echo $is_cur ? ' aria-current="page"' : ''; ?>>
					<b><?php echo esc_html( $it->title ); ?></b>
					<em><?php echo esc_html( $meta ); ?></em>
				</a>
			<?php endforeach; ?>

			<p class="ai-note">
				<?php if ( $updated ) : ?><?php echo esc_html( sprintf( 'Index updated %s', $updated ) ); ?><br><?php endif; ?>
				Every figure sourced &amp; dated
			</p>
		</div>

		<div class="ai-cta-bar">
			<a class="ai-cta" href="<?php echo $sub; ?>">Subscribe to the monthly index</a>
		</div>
	</nav>

	<div class="ai-bar" data-condensed="false">
		<div class="ai-bar-row">
			<a class="ai-bar-brand" href="<?php echo $home; ?>" rel="home">
				<span class="ai-mark" aria-hidden="true"><i></i><i></i><i></i></span>
				<span class="ai-wordmark">THE AI INDEX</span>
			</a>

			<nav class="ai-tabs" aria-label="Indexes">
				<?php foreach ( $indexes as $ix ) :
					$active = ( $ix['id'] === $cur_id ); ?>
					<a class="ai-tab" href="<?php echo esc_url( $ix['url'] ); ?>" data-active="<?php echo $active ? 'true' : 'false'; ?>"<?php echo $active ? ' aria-current="page"' : ''; ?>>
						<strong><?php echo esc_html( $ix['short'] ); ?></strong>
						<span><?php echo esc_html( sprintf( _n( '%s report', '%s reports', $ix['count'] ), number_format_i18n( $ix['count'] ) ) ); ?></span>
					</a>
				<?php endforeach; ?>
			</nav>

			<div class="ai-bar-utils">
				<a class="ai-glyph" href="<?php echo esc_url( home_url( '/?s=' ) ); ?>" aria-label="Search">&#8981;</a>
				<a href="<?php echo esc_url( $cfg['glossary'] ); ?>">Glossary</a>
				<a href="<?php echo esc_url( $cfg['about'] ); ?>">About</a>
				<a class="ai-cta" href="<?php echo $sub; ?>">Subscribe</a>
			</div>
		</div>

		<?php foreach ( $indexes as $ix ) : ?>
			<div class="ai-shelf" data-open="false">
				<div class="ai-shelf-in">
					<div class="ai-shelf-head">
						<em>In this index</em>
						<strong><?php echo esc_html( $ix['name'] ); ?></strong>
						<span><?php echo esc_html( sprintf( _n( '%s report', '%s reports', $ix['count'] ), number_format_i18n( $ix['count'] ) ) ); ?></span>
					</div>
					<div class="ai-shelf-items">
						<?php foreach ( $ix['kids'] as $kid ) : ?>
							<a href="<?php echo esc_url( get_permalink( $kid ) ); ?>"><?php echo esc_html( get_the_title( $kid ) ); ?></a>
						<?php endforeach; ?>
					</div>
					<a class="ai-shelf-more" href="<?php echo esc_url( $ix['url'] ); ?>">View index &rarr;</a>
				</div>
			</div>
		<?php endforeach; ?>
	</div>
</div>
		<?php
	}
}

/* ===================== HOOKS: swap in our nav, hide the old header ===================== */
add_action( 'wp_body_open', 'ai_nav_render', 5 );

// If the theme lacks wp_body_open support, fall back to GeneratePress's before-header hook.
add_action( 'after_setup_theme', function () {
	if ( ! function_exists( 'wp_is_block_theme' ) ) { return; }
} );
add_action( 'generate_before_header', function () {
	if ( did_action( 'wp_body_open' ) ) { return; } // already rendered
	ai_nav_render();
}, 5 );

// Remove GeneratePress's default navigation so it can't render alongside ours.
add_action( 'after_setup_theme', function () {
	remove_action( 'generate_after_header', 'generate_navigation_position' );
	remove_action( 'generate_before_header', 'generate_navigation_position' );
	remove_action( 'generate_before_right_sidebar_content', 'generate_navigation_position' );
} );

/* ===================== CSS (critical, inlined in <head> for CLS 0) ===================== */
add_action( 'wp_head', function () {
	$cfg = ai_nav_config();
	echo '<style id="ai-nav-css">' . "\n";
	echo esc_html( $cfg['hide_selector'] ) . "{display:none !important;}\n";
	echo <<<'AINAVCSS_9f3a2b'
/* The AI Index — navigation. Mobile-first. No dependencies. */
:root{
  --ai-cobalt:#2545f5; --ai-cobalt-light:#5a78ff; --ai-ink:#111114;
  --ai-body:#33333a; --ai-muted:#55555e; --ai-meta:#8a8a92; --ai-meta-light:#9a9aa2;
  --ai-rule:#e6e6ea; --ai-rule-light:#f0f0f3; --ai-surface:#fff;
  --ai-shelf:#f7f7f9; --ai-tab-idle:#fbfbfc;
  --ai-gutter:18px;
}
.ai-nav *,.ai-nav *::before,.ai-nav *::after{box-sizing:border-box;}
.ai-nav button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer;touch-action:manipulation;}
.ai-nav a{color:inherit;text-decoration:none;}
.ai-nav :focus-visible{outline:2px solid var(--ai-cobalt);outline-offset:2px;}

/* ---------- CRITICAL: header (inline this block in <head>) ---------- */
.ai-header{position:sticky;top:0;z-index:60;display:flex;align-items:center;justify-content:space-between;
  height:60px;padding:0 var(--ai-gutter);background:var(--ai-surface);border-bottom:1px solid var(--ai-rule);
  font-family:'Archivo',system-ui,sans-serif;color:var(--ai-ink);}
.ai-brand{display:flex;align-items:center;gap:9px;}
.ai-mark{display:flex;align-items:flex-end;gap:3px;height:20px;}
.ai-mark i{display:block;width:5px;background:var(--ai-cobalt);}
.ai-mark i:nth-child(1){height:9px;}
.ai-mark i:nth-child(2){height:14px;}
.ai-mark i:nth-child(3){height:20px;background:var(--ai-ink);}
.ai-wordmark{font-weight:900;font-size:16px;letter-spacing:-.02em;white-space:nowrap;}
.ai-burger{width:44px;height:44px;margin-right:-10px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:5px;}
.ai-burger i{display:block;height:2px;background:var(--ai-ink);transition:all .2s ease;}
.ai-burger i:nth-child(1){width:22px;}
.ai-burger i:nth-child(2){width:15px;}
.ai-nav[data-open="true"] .ai-burger i{width:22px;background:var(--ai-cobalt);}
.ai-nav[data-open="true"] .ai-burger i:nth-child(1){transform:translateY(3.5px) rotate(45deg);}
.ai-nav[data-open="true"] .ai-burger i:nth-child(2){transform:translateY(-3.5px) rotate(-45deg);}

/* ---------- drawer ---------- */
.ai-drawer{position:fixed;left:0;right:0;top:60px;bottom:0;z-index:50;display:flex;flex-direction:column;
  height:calc(100vh - 60px);height:calc(100dvh - 60px);background:var(--ai-surface);
  font-family:'Archivo',system-ui,sans-serif;color:var(--ai-ink);
  opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .18s ease-out,transform .18s ease-out;}
.ai-nav[data-open="true"] .ai-drawer,.ai-drawer:target{opacity:1;transform:none;pointer-events:auto;}
.ai-search{padding:22px var(--ai-gutter) 12px;flex:0 0 auto;}
.ai-search form{display:flex;align-items:center;gap:10px;border:1.5px solid var(--ai-ink);padding:12px 14px;}
.ai-search span{font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--ai-meta-light);}
.ai-search input{flex:1;min-width:0;border:0;font-size:16px;font-family:inherit;color:var(--ai-ink);background:none;}
.ai-search input::placeholder{color:var(--ai-meta-light);}
.ai-list{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:0 var(--ai-gutter);}
.ai-row{display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;text-align:left;
  min-height:44px;padding:20px 0;border-top:1px solid var(--ai-rule);}
.ai-list > a.ai-row:last-of-type{border-bottom:1px solid var(--ai-rule);}
.ai-row b{font-weight:900;font-size:27px;letter-spacing:-.03em;}
.ai-row em{font-style:normal;font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--ai-meta-light);
  display:flex;align-items:center;gap:10px;}
.ai-row em i{font-style:normal;font-size:17px;color:var(--ai-cobalt);}
.ai-row[aria-current="page"] b{color:var(--ai-cobalt);}
.ai-sub{overflow:hidden;max-height:0;transition:max-height .2s ease;}
.ai-sub a{display:flex;justify-content:space-between;gap:14px;padding:13px 0;border-top:1px solid var(--ai-rule-light);}
.ai-sub strong{display:block;font-family:'Archivo',system-ui,sans-serif;font-size:14.5px;font-weight:700;color:var(--ai-ink);}
.ai-sub small{display:block;font-family:'Archivo',system-ui,sans-serif;font-size:11.5px;font-weight:400;color:var(--ai-meta);margin-top:2px;}
.ai-sub-count{flex:0 0 auto;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ai-meta-light);}
.ai-note{font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--ai-meta-light);line-height:1.7;padding:18px 0 22px;}
.ai-cta-bar{flex:0 0 auto;padding:14px var(--ai-gutter) max(20px,env(safe-area-inset-bottom));
  border-top:1px solid var(--ai-rule);background:var(--ai-surface);}
.ai-cta{display:block;width:100%;text-align:center;background:var(--ai-cobalt);color:#fff;
  font-weight:700;font-size:15px;padding:15px;border-radius:2px;}
.ai-bar{display:none;}

/* ---------- desktop: 1a index bar ---------- */
@media (min-width:1180px){
  .ai-header,.ai-drawer{display:none;}
  .ai-bar{display:block;position:sticky;top:0;z-index:60;background:var(--ai-surface);
    border-bottom:1px solid var(--ai-rule);font-family:'Archivo',system-ui,sans-serif;color:var(--ai-ink);}
  .ai-bar-row{display:flex;align-items:stretch;}
  .ai-bar-brand{flex:0 0 auto;display:flex;align-items:center;gap:11px;padding:0 26px;border-right:1px solid var(--ai-rule);}
  .ai-bar-brand .ai-mark{height:22px;}
  .ai-bar-brand .ai-mark i:nth-child(1){height:10px;}
  .ai-bar-brand .ai-mark i:nth-child(2){height:15px;}
  .ai-bar-brand .ai-mark i:nth-child(3){height:22px;}
  .ai-bar-brand .ai-wordmark{font-size:17px;letter-spacing:-.025em;}
  .ai-tabs{display:flex;flex:1;min-width:0;}
  .ai-tab{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-between;
    padding:14px 18px;border-right:1px solid var(--ai-rule-light);
    border-top:3px solid transparent;background:var(--ai-tab-idle);transition:all .18s ease;}
  .ai-tab:last-child{border-right:1px solid var(--ai-rule);}
  .ai-tab strong{display:block;font-size:13.5px;font-weight:700;letter-spacing:-.01em;color:#4a4a52;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  /* Titles must fit without ellipsis at 1180px: 1180 - 203 (brand) - 308 (utils) = 669
     across four tabs = 131px of title space each. Keep every short label under ~120px. */
  .ai-tab span{display:block;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--ai-meta-light);margin-top:3px;}
  .ai-tab:hover,.ai-tab[data-active="true"],.ai-tab[aria-current="page"]{background:#fff;border-top-color:var(--ai-cobalt);}
  .ai-tab:hover strong,.ai-tab[data-active="true"] strong,.ai-tab[aria-current="page"] strong{color:var(--ai-ink);}
  .ai-bar-utils{flex:0 0 auto;display:flex;align-items:center;gap:20px;padding:0 26px;font-size:13px;font-weight:600;white-space:nowrap;}
  .ai-bar-utils .ai-glyph{font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--ai-meta-light);}
  .ai-bar-utils .ai-cta{width:auto;padding:9px 17px;font-size:12.5px;}
  .ai-shelf{max-height:0;overflow:hidden;background:var(--ai-shelf);transition:max-height .18s ease-out;}
  .ai-shelf[data-open="true"]{border-bottom:1px solid var(--ai-rule);}
  .ai-shelf-in{display:flex;align-items:center;gap:26px;padding:18px 26px;opacity:0;transition:opacity .12s ease .06s;}
  .ai-shelf[data-open="true"] .ai-shelf-in{opacity:1;}
  .ai-shelf-head{flex:0 0 auto;}
  .ai-shelf-head em{font-style:normal;display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;
    letter-spacing:.14em;text-transform:uppercase;color:var(--ai-cobalt);margin-bottom:5px;}
  .ai-shelf-head strong{display:block;font-size:15px;font-weight:800;letter-spacing:-.02em;}
  .ai-shelf-head span{display:block;font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--ai-meta-light);margin-top:3px;}
  .ai-shelf-items{display:flex;flex:1;min-width:0;}
  .ai-shelf-items a{flex:1;padding:0 16px;border-left:1px solid #e0e0e6;font-size:12.5px;font-weight:600;line-height:1.4;}
  .ai-shelf-more{flex:0 0 auto;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ai-cobalt);}
  .ai-bar[data-condensed="true"] .ai-tab{padding:9px 18px;}
  .ai-bar[data-condensed="true"] .ai-tab span{display:none;}
}
@media (hover:none){ .ai-shelf{display:none;} }
@media (prefers-reduced-motion:reduce){
  .ai-drawer,.ai-sub,.ai-shelf,.ai-shelf-in,.ai-burger i,.ai-tab{transition:none;}
}
AINAVCSS_9f3a2b;
	echo "\n</style>\n";
}, 6 );

// Google Fonts (Archivo 700/900, IBM Plex Mono 400/500) — matches the handoff.
add_action( 'wp_head', function () {
	echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
	echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
	echo '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;700;800;900&family=IBM+Plex+Mono:wght@400;500&display=swap">' . "\n";
}, 4 );

/* ===================== JS (vanilla, no jQuery) ===================== */
add_action( 'wp_footer', function () {
	echo '<script id="ai-nav-js">' . "\n";
	echo <<<'AINAVJS_9f3a2b'
/* The AI Index — navigation behavior. Vanilla, defer, <2KB minified. */
(function () {
  var nav = document.querySelector('.ai-nav');
  if (!nav) return;

  /* ---- mobile drawer ---- */
  var burger = nav.querySelector('.ai-burger');
  var drawer = nav.querySelector('.ai-drawer');
  var scrollY = 0;

  function focusables() {
    return drawer.querySelectorAll('a[href],button,input,[tabindex]:not([tabindex="-1"])');
  }
  function setOpen(open) {
    nav.setAttribute('data-open', open ? 'true' : 'false');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) {
      scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = -scrollY + 'px';
      document.body.style.width = '100%';
      var input = drawer.querySelector('input');
      if (input) input.focus();
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
      collapse();
    }
  }
  if (burger) {
    burger.addEventListener('click', function () {
      setOpen(nav.getAttribute('data-open') !== 'true');
    });
  }
  document.addEventListener('keydown', function (e) {
    if (nav.getAttribute('data-open') !== 'true') return;
    if (e.key === 'Escape') { setOpen(false); burger.focus(); return; }
    if (e.key !== 'Tab') return;
    var f = focusables(); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---- indexes accordion ---- */
  var toggle = nav.querySelector('[data-accordion-toggle]');
  var sub = nav.querySelector('.ai-sub');
  function collapse() {
    if (!sub || !toggle) return;
    sub.style.maxHeight = '0px';
    toggle.setAttribute('aria-expanded', 'false');
    var glyph = toggle.querySelector('i'); if (glyph) glyph.textContent = '+';
  }
  if (toggle && sub) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      if (open) return collapse();
      sub.style.maxHeight = sub.scrollHeight + 'px';
      toggle.setAttribute('aria-expanded', 'true');
      var glyph = toggle.querySelector('i'); if (glyph) glyph.textContent = '\u2013';
    });
  }

  /* ---- desktop: 1a shelf + condense ---- */
  if (!window.matchMedia('(min-width:1180px)').matches) return;
  var bar = nav.querySelector('.ai-bar');
  if (!bar) return;
  var tabs = bar.querySelectorAll('.ai-tab');
  var shelves = bar.querySelectorAll('.ai-shelf');
  var enterTimer, leaveTimer;

  function closeShelves() {
    Array.prototype.forEach.call(shelves, function (s) {
      s.setAttribute('data-open', 'false'); s.style.maxHeight = '0px';
    });
    Array.prototype.forEach.call(tabs, function (t) { t.setAttribute('data-active', 'false'); });
  }
  function openShelf(i) {
    closeShelves();
    var s = shelves[i]; if (!s) return;
    s.setAttribute('data-open', 'true');
    s.style.maxHeight = s.firstElementChild.offsetHeight + 'px';
    tabs[i].setAttribute('data-active', 'true');
  }
  Array.prototype.forEach.call(tabs, function (tab, i) {
    tab.addEventListener('mouseenter', function () {
      clearTimeout(leaveTimer);
      enterTimer = setTimeout(function () { openShelf(i); }, 120);
    });
    tab.addEventListener('focus', function () { openShelf(i); });
  });
  bar.addEventListener('mouseleave', function () {
    clearTimeout(enterTimer);
    leaveTimer = setTimeout(closeShelves, 200);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeShelves(); });

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var condensed = window.scrollY > 120;
      bar.setAttribute('data-condensed', condensed ? 'true' : 'false');
      if (condensed) closeShelves();
      ticking = false;
    });
  }, { passive: true });
})();
AINAVJS_9f3a2b;
	echo "\n</script>\n";
}, 20 );
