<?php
/**
 * The AI Index — CONTENTS menu + contents document (option 2a, overlay build)
 * =========================================================================
 * ONE WPCode snippet. Adds a global header whose single control is CONTENTS;
 * clicking it opens a dark, numbered contents document (every index + its
 * reports) as an OVERLAY — desktop slide-over and mobile full-screen — with a
 * :target no-JS fallback. NOTHING on your pages is created or edited.
 *
 * Data is page-driven: indexes = your /indexes/ silo pages; reports = their
 * published child pages; counts/dates are live. Numbers are positional (the
 * permanent stored-meta ledger + /llms.txt are the deferred pass-2).
 *
 * INSTALL: WPCode -> Add Snippet -> PHP Snippet -> paste -> Run Everywhere ->
 * Save + Activate. Deactivate the earlier global-nav snippet — this replaces it.
 *
 * CHECK $hide_selector below if your old header still shows.
 * =========================================================================
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

if ( ! function_exists( 'ai_c_config' ) ) {
	function ai_c_config() {
		return array(
			'hide_selector' => '.site-header, #masthead',
			// Ordered index silo page IDs. Reports = each page's published children.
			'indexes'       => array( 393, 392, 394, 395, 362, 930, 938, 1093, 576 ),
			'stat_total'    => 240,                            // header "· N stats" (filterable)
			'subscribe'     => home_url( '/about/contact/' ),
			'glossary'      => home_url( '/glossary/' ),
			'about'         => home_url( '/about/' ),
			'methodology'   => home_url( '/about/' ),
		);
	}
}

/* ---------- page-driven contents data ---------- */
if ( ! function_exists( 'ai_c_data' ) ) {
	function ai_c_data() {
		static $cache = null;
		if ( null !== $cache ) { return $cache; }
		$cfg = ai_c_config();
		$out = array( 'indexes' => array(), 'report_total' => 0, 'stat_total' => (int) $cfg['stat_total'], 'updated' => '' );
		$latest = 0; $n = 0;
		foreach ( $cfg['indexes'] as $pid ) {
			$p = get_post( $pid );
			if ( ! $p || 'publish' !== $p->post_status ) { continue; }
			$kids = get_pages( array( 'parent' => $pid, 'post_status' => 'publish', 'sort_column' => 'menu_order,post_title', 'sort_order' => 'ASC' ) );
			if ( empty( $kids ) ) { continue; }
			$n++;
			$reports = array();
			$i = 0;
			foreach ( $kids as $k ) {
				$i++;
				$mod = (int) get_post_modified_time( 'U', false, $k );
				$latest = max( $latest, $mod );
				$reports[] = array( 'num' => $n . '.' . $i, 'title' => get_the_title( $k ), 'url' => get_permalink( $k ), 'modified' => $mod );
			}
			$out['indexes'][] = array(
				'num'   => str_pad( $n, 2, '0', STR_PAD_LEFT ),
				'name'  => get_the_title( $pid ),
				'url'   => get_permalink( $pid ),
				'count' => count( $reports ),
				'reports' => $reports,
			);
			$out['report_total'] += count( $reports );
		}
		$out['updated'] = $latest ? date_i18n( 'F Y', $latest ) : '';
		$cache = $out;
		return $out;
	}
}

/* ---------- the contents document (used for the overlay panel) ---------- */
if ( ! function_exists( 'ai_c_doc' ) ) {
	function ai_c_doc() {
		$cfg = ai_c_config();
		$d   = ai_c_data();
		$cur = get_queried_object_id();
		ob_start(); ?>
<div class="ai-contents is-embedded" id="ai-contents-panel" role="dialog" aria-modal="true" aria-label="Contents — every index and report" aria-hidden="true" tabindex="-1">
	<div class="ai-contents-head">
		<p class="ai-contents-title" role="heading" aria-level="2">CONTENTS</p>
		<span class="ai-contents-meta">/contents/ &middot; every AI index &amp; report</span>
		<button class="ai-contents-close" type="button" aria-label="Close contents">esc &middot; close &#10005;</button>
	</div>
	<div class="ai-contents-grid">
		<?php foreach ( $d['indexes'] as $ix ) : ?>
			<section class="ai-contents-col">
				<a class="ai-contents-ix" href="<?php echo esc_url( $ix['url'] ); ?>">
					<span class="ai-num"><?php echo esc_html( $ix['num'] ); ?></span>
					<strong><?php echo esc_html( $ix['name'] ); ?></strong>
				</a>
				<span class="ai-contents-count"><?php echo esc_html( sprintf( _n( '%s report', '%s reports', $ix['count'] ), number_format_i18n( $ix['count'] ) ) ); ?></span>
				<ul>
					<?php foreach ( $ix['reports'] as $r ) : ?>
						<li>
							<a href="<?php echo esc_url( $r['url'] ); ?>"<?php echo ( (int) url_to_postid( $r['url'] ) === (int) $cur ) ? ' aria-current="page"' : ''; ?>>
								<span class="ai-num"><?php echo esc_html( $r['num'] ); ?></span>
								<span class="ai-title"><?php echo esc_html( $r['title'] ); ?></span>
								<time datetime="<?php echo esc_attr( gmdate( 'Y-m', $r['modified'] ) ); ?>"><?php echo esc_html( date_i18n( 'M y', $r['modified'] ) ); ?></time>
							</a>
						</li>
					<?php endforeach; ?>
				</ul>
				<a class="ai-contents-more" href="<?php echo esc_url( $ix['url'] ); ?>">Index page &rarr;</a>
			</section>
		<?php endforeach; ?>
	</div>
	<div class="ai-contents-foot">
		<span><?php echo esc_html( $d['updated'] ? sprintf( 'Updated %s · every figure sourced & dated', $d['updated'] ) : 'Every figure sourced & dated' ); ?></span>
		<span>
			<a href="<?php echo esc_url( $cfg['glossary'] ); ?>">Glossary</a> &middot;
			<a href="<?php echo esc_url( $cfg['about'] ); ?>">About</a> &middot;
			<a href="<?php echo esc_url( $cfg['methodology'] ); ?>">Methodology</a>
		</span>
	</div>
</div>
		<?php
		return ob_get_clean();
	}
}

/* ---------- global header (the menu) ---------- */
if ( ! function_exists( 'ai_c_header' ) ) {
	function ai_c_header() {
		if ( is_admin() ) { return; }
		$cfg  = ai_c_config();
		$d    = ai_c_data();
		$home = esc_url( home_url( '/' ) );
		?>
<header class="ai-header">
	<a class="ai-brand" href="<?php echo $home; ?>" rel="home">
		<span class="ai-mark" aria-hidden="true"><i></i><i></i><i></i></span>
		<span class="ai-wordmark">THE AI INDEX</span>
	</a>
	<a class="ai-contents-btn" href="#ai-contents-panel" aria-controls="ai-contents-panel" aria-expanded="false">
		<span class="ai-contents-glyph" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
		<span class="ai-contents-label">CONTENTS</span>
		<span class="ai-contents-btn-meta"><?php echo esc_html( sprintf( '%s reports · %s stats', number_format_i18n( $d['report_total'] ), number_format_i18n( $d['stat_total'] ) ) ); ?></span>
	</a>
	<div class="ai-utils">
		<a class="ai-glyph" href="<?php echo esc_url( home_url( '/?s=' ) ); ?>" aria-label="Search">&#8981;</a>
		<a class="ai-cta" href="<?php echo esc_url( $cfg['subscribe'] ); ?>">Subscribe</a>
	</div>
</header>
		<?php
	}
}

/* ---------- hooks: header at top of body, panel late in DOM ---------- */
add_action( 'wp_body_open', 'ai_c_header', 5 );
add_action( 'generate_before_header', function () { if ( did_action( 'wp_body_open' ) ) { return; } ai_c_header(); }, 5 );
add_action( 'after_setup_theme', function () {
	remove_action( 'generate_after_header', 'generate_navigation_position' );
	remove_action( 'generate_before_header', 'generate_navigation_position' );
} );
add_action( 'wp_footer', function () { echo ai_c_doc(); }, 30 );

/* ---------- CSS: tokens + critical + overlay positioning + full sheet (inlined in head, CLS 0) ---------- */
add_action( 'wp_head', function () {
	$cfg = ai_c_config();
	echo '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
	echo '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap">' . "\n";
	echo '<style id="ai-contents-css">' . "\n";
	// Design tokens (guaranteed defined even if the critical file omits any).
	echo ":root{--ai-cobalt:#2545f5;--ai-cobalt-light:#5a78ff;--ai-ink:#111114;--ai-body:#33333a;--ai-muted:#55555e;--ai-meta:#8a8a92;--ai-meta-light:#9a9aa2;--ai-rule:#e6e6ea;--ai-rule-light:#f0f0f3;--ai-surface:#fff;--ai-btn-open:#f4f5ff;--ai-dark-rule:#2a2a34;--ai-dark-hover:#1a1a22;--ai-dark-meta:#5f5f6b;--ai-dark-meta2:#7a7a86;--ai-dark-title:#e4e4ea;--ai-header-h:60px;}\n";
	// Hide the theme's existing header (avoid a double header).
	echo $cfg['hide_selector'] . "{display:none !important;}\n";
	echo <<<'AICCRIT_7b2'
/* The AI Index — critical header CSS (inline in <head>). Header + hidden panel only. */
.ai-header{position:sticky;top:0;z-index:60;height:60px;background:#fff;border-bottom:1px solid #e6e6ea;display:flex;align-items:center;justify-content:space-between;padding:0 18px;font-family:Archivo,sans-serif}
.ai-brand{display:flex;align-items:center;gap:9px;text-decoration:none;color:#111114}
.ai-mark{display:flex;align-items:flex-end;gap:3px;height:20px}
.ai-mark i{width:5px;background:#2545f5}
.ai-mark i:nth-child(1){height:9px}.ai-mark i:nth-child(2){height:14px}.ai-mark i:nth-child(3){height:20px;background:#111114}
.ai-wordmark{font-weight:900;font-size:16px;letter-spacing:-.02em}
.ai-contents-btn{display:flex;align-items:center;gap:8px;border:1.5px solid #111114;padding:6px 10px;text-decoration:none;color:#111114;background:#fff}
.ai-contents-label{font-weight:800;font-size:11px;letter-spacing:.02em}
.ai-contents-btn-meta{display:none}
.ai-cta{background:#2545f5;color:#fff;padding:9px 17px;font-size:12.5px;font-weight:700;border-radius:2px;text-decoration:none}
#ai-contents-panel[hidden]{display:none}
@media (min-width:900px){.ai-header{height:auto;padding:14px 26px}.ai-contents-btn{gap:14px;padding:10px 18px}.ai-contents-label{font-size:14px}.ai-contents-btn-meta{display:inline;font-family:'IBM Plex Mono',monospace;font-size:11px;color:#8a8a92}}
AICCRIT_7b2;
	echo "\n";
	echo <<<'AICFULL_7b2'
/* The AI Index — Contents navigation (option 2a). Mobile-first. */

/* ===== tokens ===== */
:root{
  --ai-cobalt:#2545f5; --ai-cobalt-light:#5a78ff; --ai-ink:#111114;
  --ai-meta:#8a8a92; --ai-meta-light:#9a9aa2; --ai-rule:#e6e6ea;
  --ai-dark-rule:#2a2a34; --ai-dark-hover:#1a1a22; --ai-dark-meta:#5f5f6b;
  --ai-dark-meta2:#7a7a86; --ai-dark-title:#e4e4ea; --ai-btn-open:#f4f5ff;
}

/* ===== header (base = mobile) ===== */
.ai-header{position:sticky;top:0;z-index:60;height:60px;background:#fff;
  border-bottom:1px solid var(--ai-rule);display:flex;align-items:center;
  justify-content:space-between;padding:0 18px;font-family:Archivo,sans-serif;}
.ai-brand{display:flex;align-items:center;gap:9px;text-decoration:none;color:var(--ai-ink);}
.ai-mark{display:flex;align-items:flex-end;gap:3px;height:20px;}
.ai-mark i{width:5px;background:var(--ai-cobalt);}
.ai-mark i:nth-child(1){height:9px;}.ai-mark i:nth-child(2){height:14px;}
.ai-mark i:nth-child(3){height:20px;background:var(--ai-ink);}
.ai-wordmark{font-weight:900;font-size:16px;letter-spacing:-0.02em;}
.ai-contents-btn{display:flex;align-items:center;gap:8px;border:1.5px solid var(--ai-ink);
  padding:6px 10px;text-decoration:none;color:var(--ai-ink);background:#fff;
  touch-action:manipulation;position:relative;}
.ai-contents-btn::after{content:"";position:absolute;inset:-8px;} /* 44px target */
.ai-contents-btn[aria-expanded="true"]{background:var(--ai-btn-open);}
.ai-contents-glyph{display:grid;grid-template-columns:repeat(2,5px);gap:2.5px;}
.ai-contents-glyph i{height:5px;background:var(--ai-ink);}
.ai-contents-glyph i:nth-child(1),.ai-contents-glyph i:nth-child(4){background:var(--ai-cobalt);}
.ai-contents-label{font-weight:800;font-size:11px;letter-spacing:0.02em;}
.ai-contents-btn-meta{display:none;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ai-meta);}
.ai-utils{display:flex;align-items:center;gap:20px;}
.ai-glyph{font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--ai-meta-light);text-decoration:none;}
.ai-cta{background:var(--ai-cobalt);color:#fff;padding:9px 17px;font-size:12.5px;
  font-weight:700;border-radius:2px;text-decoration:none;}
:is(.ai-brand,.ai-contents-btn,.ai-glyph,.ai-cta):focus-visible{outline:2px solid var(--ai-cobalt);outline-offset:2px;}

@media (min-width:900px){
  .ai-header{height:auto;padding:14px 26px;}
  .ai-mark{height:22px;}.ai-mark i:nth-child(1){height:10px;}
  .ai-mark i:nth-child(2){height:15px;}.ai-mark i:nth-child(3){height:22px;}
  .ai-wordmark{font-size:17px;letter-spacing:-0.025em;}
  .ai-contents-btn{gap:14px;padding:10px 18px;}
  .ai-contents-btn::after{content:none;}
  .ai-contents-label{font-size:14px;}
  .ai-contents-btn-meta{display:inline;}
}

/* ===== the contents document (page and takeover share this) ===== */
.ai-contents{background:var(--ai-ink);color:#fff;font-family:Archivo,sans-serif;}
.ai-contents-head{display:flex;align-items:baseline;gap:18px;flex-wrap:wrap;
  padding:30px 18px 22px;border-bottom:1px solid var(--ai-dark-rule);}
.ai-contents-title{font-weight:900;font-size:34px;letter-spacing:-0.03em;margin:0;color:#fff;}
.ai-contents-meta{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--ai-dark-meta2);}
.ai-contents-close{margin-left:auto;background:none;border:0;cursor:pointer;
  font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--ai-dark-meta2);}
.ai-contents-grid{display:grid;grid-template-columns:1fr;}
.ai-contents-col{padding:24px 18px 28px;border-top:1px solid var(--ai-dark-rule);}
.ai-contents-ix{display:flex;align-items:baseline;gap:10px;text-decoration:none;color:#fff;}
.ai-contents-ix .ai-num{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:22px;color:var(--ai-cobalt-light);}
.ai-contents-ix strong{font-weight:800;font-size:15px;letter-spacing:-0.01em;}
.ai-contents-count{display:block;font-family:'IBM Plex Mono',monospace;font-size:10.5px;
  color:var(--ai-dark-meta);margin:4px 0 16px;}
.ai-contents-col ul{list-style:none;margin:0;padding:0;}
.ai-contents-col li a{display:flex;gap:10px;align-items:baseline;min-height:44px;
  padding:9px 0;border-top:1px solid var(--ai-dark-rule);text-decoration:none;transition:background .12s;}
.ai-contents-col li a:hover{background:var(--ai-dark-hover);}
.ai-contents-col li a:hover .ai-title,.ai-contents-col li a[aria-current="page"] .ai-title{color:#fff;}
.ai-contents-col li .ai-num{font-family:'IBM Plex Mono',monospace;font-size:10.5px;
  color:var(--ai-cobalt-light);flex:0 0 26px;}
.ai-contents-col li .ai-title{font-size:12.5px;font-weight:600;color:var(--ai-dark-title);line-height:1.35;}
.ai-contents-col li time{font-family:'IBM Plex Mono',monospace;font-size:9.5px;
  color:var(--ai-dark-meta);margin-left:auto;white-space:nowrap;}
.ai-contents-more{display:inline-block;margin-top:10px;font-size:12px;font-weight:700;
  color:var(--ai-cobalt-light);text-decoration:none;}
.ai-contents-foot{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;
  padding:12px 18px;border-top:1px solid var(--ai-dark-rule);
  font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:0.08em;
  text-transform:uppercase;color:var(--ai-dark-meta);}
.ai-contents-foot a{color:var(--ai-dark-meta2);text-decoration:none;}
.ai-contents a:focus-visible{outline:2px solid var(--ai-cobalt-light);outline-offset:2px;}

@media (min-width:900px){
  .ai-contents-head{padding:30px 26px 22px;}
  .ai-contents-grid{grid-template-columns:repeat(4,1fr);}
  .ai-contents-col{padding:24px 22px 28px;border-top:0;border-right:1px solid var(--ai-dark-rule);}
  .ai-contents-col:last-child{border-right:0;}
  .ai-contents-foot{padding:12px 26px;}
}

/* ===== desktop takeover ===== */
.ai-contents.is-embedded{position:fixed;left:0;right:0;top:60px;bottom:0;z-index:50;
  overflow-y:auto;overscroll-behavior:contain;
  opacity:0;transform:translateY(-8px);pointer-events:none;
  transition:opacity .18s ease-out,transform .18s ease-out;}
@media (min-width:900px){.ai-contents.is-embedded{top:70px;}}
.ai-contents.is-embedded.is-open{opacity:1;transform:none;pointer-events:auto;}
/* [hidden] is removed by JS before opening; keep display honest otherwise */
.ai-contents.is-embedded[hidden]{display:none;}

@media (prefers-reduced-motion:reduce){
  .ai-contents.is-embedded{transition:none;}
  .ai-contents-col li a{transition:none;}
}
AICFULL_7b2;
	echo "\n";
	// Overlay positioning + no-JS :target fallback (not in the provided sheet).
	echo <<<'AICOVL_7b2'
.ai-contents.is-embedded{position:fixed;left:0;right:0;top:var(--ai-header-h);bottom:0;overflow-y:auto;-webkit-overflow-scrolling:touch;z-index:55;opacity:0;transform:translateY(-8px);pointer-events:none;transition:opacity .18s ease-out,transform .18s ease-out;}
.ai-contents.is-embedded.is-open{opacity:1;transform:none;pointer-events:auto;}
.ai-contents.is-embedded:target{opacity:1;transform:none;pointer-events:auto;}
html.ai-c-lock{overflow:hidden;}
@media (prefers-reduced-motion: reduce){.ai-contents.is-embedded{transition:none;}}
AICOVL_7b2;
	echo "\n</style>\n";
}, 6 );

/* ---------- JS: overlay controller (all widths), scroll-lock, focus trap, Esc, :target-aware ---------- */
add_action( 'wp_footer', function () {
	?>
<script id="ai-contents-js">
(function(){
	var btn=document.querySelector('.ai-contents-btn');
	var panel=document.getElementById('ai-contents-panel');
	if(!btn||!panel) return;
	var closeBtn=panel.querySelector('.ai-contents-close');
	var open=false, sy=0;
	function set(v){
		if(v===open) return; open=v;
		if(open){
			sy=window.scrollY;
			panel.classList.add('is-open');
			document.documentElement.classList.add('ai-c-lock');
			btn.setAttribute('aria-expanded','true');
			panel.setAttribute('aria-hidden','false');
			var f=panel.querySelector('a[href],button'); if(f){ setTimeout(function(){try{f.focus();}catch(e){}},180); }
		}else{
			panel.classList.remove('is-open');
			document.documentElement.classList.remove('ai-c-lock');
			btn.setAttribute('aria-expanded','false');
			panel.setAttribute('aria-hidden','true');
			if(location.hash==='#ai-contents-panel'){ history.replaceState(null,'',location.pathname+location.search); }
			try{btn.focus();}catch(e){}
			window.scrollTo(0,sy);
		}
	}
	btn.addEventListener('click',function(e){ e.preventDefault(); history.replaceState(null,'','#ai-contents-panel'); set(true); });
	if(closeBtn) closeBtn.addEventListener('click',function(){ set(false); });
	document.addEventListener('keydown',function(e){
		if(!open) return;
		if(e.key==='Escape'){ set(false); return; }
		if(e.key!=='Tab') return;
		var f=panel.querySelectorAll('a[href],button'); if(!f.length) return;
		var first=f[0], last=f[f.length-1];
		if(e.shiftKey && document.activeElement===first){ last.focus(); e.preventDefault(); }
		else if(!e.shiftKey && document.activeElement===last){ first.focus(); e.preventDefault(); }
	});
	window.addEventListener('hashchange',function(){ if(location.hash==='#ai-contents-panel'){ set(true); } else if(open){ set(false); } });
	if(location.hash==='#ai-contents-panel'){ set(true); }
})();
</script>
	<?php
}, 31 );
