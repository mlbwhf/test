<?php
/**
 * Report AI — nav v6 (CSS + PHP + JS in one WPCode snippet, "Report AI — nav support v2", ID 1497).
 *
 * v6 (16 Nov 2026) over v5:
 *  - Every published index/report is reachable from the menu: auto lists are no longer
 *    capped at 10 (sections with 11–21 pages were being cut off). Panes scroll on desktop.
 *  - Real menu children are not duplicated by the auto list; redirect stubs are never listed.
 *  - "Latest reports" lists up to 30 standalone reports (was 6), newest first.
 *  - Phones: section rows are collapsed accordions with a 44px +/− button, so the drawer
 *    opens to 11 section names, not 150 links. Every link is still in the HTML (no JS needed
 *    to discover them) for crawlers and AI agents.
 *  - Tablets (touch, >768px): first tap on a section row shows its pane instead of navigating.
 *  - Phones: tapping "Indexes"/"Reports" text navigates again (v5 swallowed the first tap).
 *  - Plain dropdowns (About) open under their own item.
 *  - Search box + Site map link in the desktop utility strip and the phone drawer.
 *
 * Source of truth: site-content/nav-v6/nav-snippet-v6.php in the repo.
 */

/* ---------- 0. Shared bits ---------- */
if ( ! function_exists( 'tai_nav_search_form' ) ) {
	function tai_nav_search_form( $id ) {
		?>
		<form class="tai-search" role="search" method="get" action="<?php echo esc_url( home_url( '/' ) ); ?>">
			<label class="screen-reader-text" for="<?php echo esc_attr( $id ); ?>">Search Report AI</label>
			<input id="<?php echo esc_attr( $id ); ?>" type="search" name="s" placeholder="Search AI statistics…" autocomplete="off">
			<button type="submit">Search</button>
		</form>
		<?php
	}
}

/* ---------- 1. Utility strip (desktop) ---------- */
add_action( 'generate_before_header', function () {
	?>
	<nav class="tai-utility" aria-label="Utility">
		<?php tai_nav_search_form( 'tai-s-top' ); ?>
		<a href="/site-map/">Site map</a>
		<a href="/subscribe/">Subscribe</a>
		<a href="/about/contact/">Contact</a>
		<a class="tai-login" href="<?php echo esc_url( wp_login_url() ); ?>">Log in</a>
	</nav>
	<?php
}, 5 );

/* ---------- 2. Search + utility links in the mobile drawer footer ---------- */
add_action( 'generate_after_primary_menu', function () {
	?>
	<div class="tai-utility-drawer">
		<?php tai_nav_search_form( 'tai-s-drawer' ); ?>
		<a href="/site-map/">Site map</a>
		<a href="/subscribe/">Subscribe</a>
		<a href="/about/contact/">Contact</a>
		<a class="tai-login" href="<?php echo esc_url( wp_login_url() ); ?>">Log in</a>
	</div>
	<?php
} );

/* ---------- 3. Auto level-3 for Indexes (39) and Reports (40) ---------- */
add_filter( 'wp_nav_menu_objects', function ( $items, $args ) {
	if ( ! isset( $args->theme_location ) || 'primary' !== $args->theme_location ) {
		return $items;
	}
	$roots = array( 39 => 'menu-indexes', 40 => 'menu-reports' );
	// Redirect stubs (CLAUDE.md: 866 and 1111 redirect to the canonical deepfake page 500).
	$never = array( 866, 1111 );
	$tops  = array();
	foreach ( $items as $item ) {
		$oid = (int) $item->object_id;
		if ( 0 === (int) $item->menu_item_parent && isset( $roots[ $oid ] ) ) {
			$item->classes[]         = $roots[ $oid ];
			$tops[ (int) $item->ID ] = $oid;
		}
	}
	if ( empty( $tops ) ) {
		return $items;
	}
	// Pages already in the menu anywhere (kept out of "Latest reports"), and the pages
	// each item already has as real menu children (never listed twice).
	$in_menu = array();
	$present = array();
	foreach ( $items as $item ) {
		if ( 'page' === $item->object ) {
			$in_menu[] = (int) $item->object_id;
			$p         = (int) $item->menu_item_parent;
			if ( $p ) {
				$present[ $p ][ (int) $item->object_id ] = true;
			}
		}
	}
	$injected = array();
	$synth    = 900000;
	foreach ( $items as $item ) {
		$pid = (int) $item->menu_item_parent;
		if ( ! isset( $tops[ $pid ] ) ) {
			continue;
		}
		$kids = array();
		if ( 'page' === $item->object && (int) $item->object_id ) {
			$kids = get_pages( array(
				'parent'      => (int) $item->object_id,
				'sort_column' => 'menu_order,post_title',
				'exclude'     => implode( ',', $never ),
			) );
		} elseif ( 40 === $tops[ $pid ] && false !== strpos( (string) $item->url, '#latest' ) ) {
			$kids = get_pages( array(
				'parent'      => 40,
				'exclude'     => implode( ',', array_merge( $in_menu, $never ) ),
				'sort_column' => 'post_date',
				'sort_order'  => 'DESC',
				'number'      => 30,
			) );
		}
		foreach ( $kids as $child ) {
			if ( isset( $present[ (int) $item->ID ][ (int) $child->ID ] ) ) {
				continue;
			}
			$node                        = new stdClass();
			$node->ID                    = ++$synth;
			$node->db_id                 = $node->ID;
			$node->menu_item_parent      = $item->ID;
			$node->object_id             = $child->ID;
			$node->object                = 'page';
			$node->type                  = 'post_type';
			$node->type_label            = 'Page';
			$node->title                 = $child->post_title;
			$node->url                   = get_permalink( $child );
			$node->target                = '';
			$node->xfn                   = '';
			$node->attr_title            = '';
			$node->description           = '';
			$node->classes               = array( 'tai-auto-l3' );
			$node->current               = false;
			$node->current_item_ancestor = false;
			$node->current_item_parent   = false;
			$injected[]                  = $node;
		}
	}
	if ( $injected ) {
		$items = array_merge( $items, $injected );
	}
	return $items;
}, 10, 2 );

/* ---------- 4. All nav CSS — printed after Additional CSS so it always wins ---------- */
add_action( 'wp_head', function () {
	?>
	<style id="tai-nav-v6">
	@media(min-width:769px){
		/* Header: wordmark left, menu optically centered */
		.site-header .inside-header{ display:grid!important; grid-template-columns:1fr auto 1fr; align-items:center; padding:20px 40px; }
		.site-header .inside-header .site-branding{ grid-column:1; justify-self:start; }
		.site-header .inside-header .main-navigation{ grid-column:2; justify-self:center; float:none!important; width:auto!important; }
		.site-header .inside-header .main-navigation .main-nav > ul{ justify-content:center; }
		/* Invisible hover bridge so the pointer never crosses dead space */
		.main-navigation .main-nav > ul > li.menu-indexes,
		.main-navigation .main-nav > ul > li.menu-reports{ padding-bottom:20px; margin-bottom:-20px; }
		.main-navigation .main-nav{ position:relative; }
		.main-navigation .main-nav > ul > li{ position:static; }
		/* Plain dropdowns (About) open under their own item */
		.main-navigation .main-nav > ul > li:not(.menu-indexes):not(.menu-reports){ position:relative; }
		/* Panels open to the RIGHT, flush under the nav row */
		.main-navigation .main-nav > ul > li.tai-open > .sub-menu,
		.main-navigation .main-nav > ul > li.sfHover > .sub-menu,
		.main-navigation .main-nav > ul > li:hover > .sub-menu{
			left:0!important; right:auto!important; transform:none!important; top:100%!important;
			visibility:visible!important; opacity:1!important; height:auto!important; overflow:visible;
			max-width:calc(100vw - 40px);
		}
	}

	/* Panel shell */
	.main-navigation .sub-menu{ width:300px; background:#fff; border:1px solid #111114; box-shadow:none; margin-top:0; counter-reset:idx; z-index:999; }
	.main-navigation .sub-menu li{ border-bottom:1px solid #f0f0f2; }
	.main-navigation .sub-menu > li{ counter-increment:idx; }
	.main-navigation .sub-menu .sub-menu li{ counter-increment:none; }
	.main-navigation .sub-menu li:last-child{ border-bottom:none; }
	.main-navigation .sub-menu a{ display:flex; align-items:baseline; gap:12px; padding:11px 18px; font-family:'Archivo',sans-serif; font-weight:700; font-size:14px; color:#111114!important; letter-spacing:-0.01em; line-height:1.3; background:#fff; transition:background .12s ease,color .12s ease,box-shadow .12s ease; }
	.main-navigation .sub-menu a::before{ content:counter(idx,decimal-leading-zero); font-family:'IBM Plex Mono',monospace; font-size:11px; color:#2545f5; }
	.main-navigation .sub-menu a::after{ content:"\2192"; margin-left:auto; font-family:'IBM Plex Mono',monospace; font-size:12px; color:#d8d8de; }

	/* Hover / active row */
	.main-navigation .sub-menu > li > a:hover,
	.main-navigation .sub-menu > li > a:focus,
	.main-navigation .sub-menu > li.tai-pane-active > a{ background:#eef1fd!important; color:#2545f5!important; box-shadow:inset 3px 0 0 #2545f5; }
	.main-navigation .sub-menu > li > a:hover::after,
	.main-navigation .sub-menu > li > a:focus::after,
	.main-navigation .sub-menu > li.tai-pane-active > a::after{ color:#2545f5; }

	/* Tool / footer rows */
	.main-navigation .sub-menu .nav-tool a::before,
	.main-navigation .sub-menu .nav-all a::before{ content:none; }
	.main-navigation .sub-menu .nav-tool a,
	.main-navigation .sub-menu .nav-all a{ font-family:'IBM Plex Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.04em; color:#2545f5!important; background:#f5f5f7; }
	.main-navigation .sub-menu .nav-tool a:hover,
	.main-navigation .sub-menu .nav-all a:hover{ background:#eef1fd!important; }
	.main-navigation .sub-menu .nav-all{ border-top:1px solid #e6e6ea; }

	/* No Collection/News tags */
	.main-navigation .sub-menu .menu-item-description{ display:none!important; }

	/* Level-3 rows */
	.main-navigation .sub-menu .sub-menu a{ font-weight:500!important; font-size:13.5px!important; padding:9px 2px!important; }
	.main-navigation .sub-menu .sub-menu a::before{ content:none; }
	.main-navigation .sub-menu .sub-menu a:hover{ background:#eef1fd!important; color:#2545f5!important; }

	/* Section +/− button: phones only */
	.tai-l3-toggle{ display:none; }

	@media(min-width:769px){
		/* Two-pane: Indexes 760 / rail 300, Reports 680 / rail 280 */
		.main-navigation .menu-indexes > .sub-menu,
		.main-navigation .menu-reports > .sub-menu{ position:absolute!important; }
		.main-navigation .menu-indexes > .sub-menu{ width:min(760px,calc(100vw - 80px))!important; min-height:470px!important; }
		.main-navigation .menu-reports > .sub-menu{ width:min(680px,calc(100vw - 80px))!important; min-height:400px!important; }
		.main-navigation .menu-indexes > .sub-menu > li,
		.main-navigation .menu-reports > .sub-menu > li{ position:static!important; float:none!important; display:block!important; }
		.main-navigation .menu-indexes > .sub-menu > li{ width:300px!important; }
		.main-navigation .menu-reports > .sub-menu > li{ width:280px!important; }
		.main-navigation .menu-indexes > .sub-menu > li > .sub-menu,
		.main-navigation .menu-reports > .sub-menu > li > .sub-menu{
			display:none!important; position:absolute!important;
			top:0!important; right:0!important; bottom:0!important; left:auto!important;
			transform:none!important; margin:0!important;
			border:none!important; border-left:1px solid #e6e6ea!important;
			background:#fff!important; padding:20px 22px!important;
			max-height:none!important; overflow-y:auto!important; overscroll-behavior:contain;
		}
		.main-navigation .menu-indexes > .sub-menu > li > .sub-menu{ width:calc(100% - 300px)!important; }
		.main-navigation .menu-reports > .sub-menu > li > .sub-menu{ width:calc(100% - 280px)!important; }
		.main-navigation .menu-indexes > .sub-menu > li.tai-pane-active > .sub-menu,
		.main-navigation .menu-reports > .sub-menu > li.tai-pane-active > .sub-menu{
			display:flex!important; flex-direction:column!important;
			visibility:visible!important; opacity:1!important; height:auto!important;
		}
		.main-navigation .sub-menu .dropdown-menu-toggle{ display:none; }
	}

	/* Pane chrome */
	.main-navigation .sub-menu .tai-pane-head{ position:sticky; top:-20px; background:#fff; z-index:2; display:flex; justify-content:space-between; align-items:baseline; padding:0 0 10px; border-bottom:1px solid #111114; margin:0 0 8px; font-family:'IBM Plex Mono',monospace; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:#77777f; }
	.main-navigation .sub-menu .tai-pane-head .tai-pane-cnt{ color:#b8b8bf; }
	.main-navigation .sub-menu .tai-pane-hub{ position:sticky; bottom:-20px; background:#fff; z-index:2; margin-top:auto; border-bottom:none; border-top:1px solid #f0f0f2; padding-bottom:6px; }
	.main-navigation .sub-menu .sub-menu .tai-pane-hub a{ font-family:'IBM Plex Mono',monospace; font-size:10.5px!important; letter-spacing:.05em; text-transform:uppercase; color:#2545f5!important; font-weight:600!important; padding:12px 2px 0!important; }
	.main-navigation .sub-menu .sub-menu .tai-pane-hub a::after{ content:none; }

	/* Search form (utility strip + drawer) */
	.tai-search{ display:flex; margin:0; }
	.tai-search input[type=search]{ font-family:'IBM Plex Mono',monospace; font-size:12px; border:1px solid #e6e6ea; border-right:none; padding:6px 10px; background:#fff; color:#111114; width:210px; min-height:32px; }
	.tai-search input[type=search]::placeholder{ color:#9a9aa2; }
	.tai-search input[type=search]:focus{ outline:2px solid #2545f5; outline-offset:-2px; }
	.tai-search button{ font-family:'IBM Plex Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:.05em; background:#111114; color:#fff; border:none; padding:0 12px; cursor:pointer; }

	/* Utility strip */
	.tai-utility{ display:flex; justify-content:flex-end; align-items:center; gap:22px; padding:8px 32px; border-bottom:1px solid #e6e6ea; background:#fff; }
	.tai-utility .tai-search{ margin-right:auto; }
	.tai-utility a{ font-family:'IBM Plex Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#77777f; text-decoration:none; }
	.tai-utility a:hover{ color:#111114; }
	.tai-utility a.tai-login{ color:#111114; }

	/* Sidebar chrome */
	#right-sidebar .inside-right-sidebar{ border-left:1px solid #e6e6ea; padding-left:24px; }
	.sidebar .wp-block-search input[type=search]{ font-family:'IBM Plex Mono',monospace; font-size:12px; border:1px solid #e6e6ea; padding:10px 12px; background:#fff; color:#111114; }
	.sidebar .wp-block-search input[type=search]::placeholder{ color:#9a9aa2; }
	.sidebar .wp-block-search .wp-block-search__button{ background:#111114; border:none; color:#fff; }

	/* Mobile drawer */
	@media(max-width:768px){
		.tai-utility{ display:none; }
		.site-header .inside-header{ display:flex!important; }
		/* Specificity note: GP's generate-style-inline-css sets
		   .main-navigation .menu-toggle { color: var(--base-3) } = #fff at (0,2,0),
		   and button.menu-toggle { background-color: transparent } at (0,1,1).
		   A bare .menu-toggle rule (0,1,0) loses both — the toggle renders white on
		   the white header and looks absent. Match GP's specificity and win on order. */
		.main-navigation .menu-toggle{ min-width:44px; min-height:44px; border:1px solid #e6e6ea; background:#fff; color:#111114; }
		.main-navigation .sub-menu{ width:100%; margin-top:0; border:none; }
		.main-navigation .main-nav ul li a{ min-height:44px; font-size:17px; font-weight:700; padding:12px 16px; border-bottom:1px solid #e6e6ea; }
		.main-navigation .sub-menu a{ font-size:15px; font-weight:600; padding:11px 16px; border-bottom:none; }
		.main-navigation .sub-menu li{ border-bottom:1px solid #f0f0f2; }
		.main-navigation .sub-menu .sub-menu a{ font-size:13.5px!important; font-weight:500!important; padding:10px 16px 10px 38px!important; min-height:40px; }
		.main-navigation .sub-menu .sub-menu li{ border-bottom:1px solid #f5f5f7; }
		.main-navigation .menu-indexes > .sub-menu,
		.main-navigation .menu-reports > .sub-menu{ width:100%; }
		.main-navigation .menu-indexes > .sub-menu > li,
		.main-navigation .menu-reports > .sub-menu > li{ position:relative; width:100%; }
		/* Section rows are accordions: collapsed until their +/− button is pressed */
		.main-navigation .menu-indexes > .sub-menu > li > .sub-menu,
		.main-navigation .menu-reports > .sub-menu > li > .sub-menu{ display:none; position:static; width:100%; border-left:none; overflow:visible; padding:0; }
		.main-navigation .menu-indexes > .sub-menu > li.tai-l3-open > .sub-menu,
		.main-navigation .menu-reports > .sub-menu > li.tai-l3-open > .sub-menu{ display:block; visibility:visible; opacity:1; height:auto; left:auto; }
		.main-navigation .menu-indexes > .sub-menu > li > a .dropdown-menu-toggle,
		.main-navigation .menu-reports > .sub-menu > li > a .dropdown-menu-toggle{ display:none; }
		.main-navigation .menu-indexes > .sub-menu > li.tai-has-pane > a,
		.main-navigation .menu-reports > .sub-menu > li.tai-has-pane > a{ padding-right:60px; }
		.tai-l3-toggle{ display:flex; align-items:center; justify-content:center; position:absolute; top:0; right:0; width:52px; height:44px; padding:0; margin:0; border:none; border-left:1px solid #f0f0f2; background:transparent; color:#2545f5; font-family:'IBM Plex Mono',monospace; font-size:20px; line-height:1; cursor:pointer; }
		.tai-l3-toggle:focus-visible{ outline:2px solid #2545f5; outline-offset:-2px; }
		.tai-l3-toggle .tai-l3-cnt{ font-size:10px; color:#9a9aa2; margin-right:4px; }
		.main-navigation .sub-menu .tai-pane-head,
		.main-navigation .sub-menu .tai-pane-hub{ display:none; }
		.tai-utility-drawer{ display:flex; flex-wrap:wrap; gap:4px 18px; padding:16px; border-top:1px solid #e6e6ea; }
		.tai-utility-drawer .tai-search{ flex:1 1 100%; margin-bottom:8px; }
		.tai-utility-drawer .tai-search input[type=search]{ flex:1; width:auto; min-height:44px; font-size:16px; }
		.tai-utility-drawer a{ font-family:'IBM Plex Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:#77777f; text-decoration:none; min-height:44px; display:inline-flex; align-items:center; }
		.tai-utility-drawer a.tai-login{ color:#111114; }
	}
	@media(min-width:769px){ .tai-utility-drawer{ display:none; } }
	</style>
	<?php
}, 999 );

/* ---------- 5. Pane chrome + switching + 180ms hover grace timer + phone accordions ---------- */
add_action( 'wp_footer', function () {
	?>
	<script>
	(function(){
		var OPEN='tai-open', ACTIVE='tai-pane-active', L3OPEN='tai-l3-open', GRACE=180;
		var tops=document.querySelectorAll('.main-navigation .main-nav > ul > li.menu-indexes, .main-navigation .main-nav > ul > li.menu-reports');
		if(!tops.length)return;
		var wide=window.matchMedia('(min-width: 769px)');
		/* A touch tap fires an emulated mouseenter BEFORE click, which would open the panel and then
		   let the same tap follow the link. Record the state at pointerdown, before the emulation. */
		function touchGuard(el,isReady,onFirstTap){
			var wasReady=true, touch=false;
			el.addEventListener('pointerdown',function(e){ touch=(e.pointerType==='touch'||e.pointerType==='pen'); wasReady=isReady(); });
			el.addEventListener('click',function(e){
				if(touch && wide.matches && !wasReady){ e.preventDefault(); onFirstTap(); }
				touch=false; wasReady=true;
			});
		}
		var timer=null;
		function closeAll(){
			tops.forEach(function(t){
				t.classList.remove(OPEN);
				var a=t.querySelector(':scope > a');
				if(a)a.setAttribute('aria-expanded','false');
			});
		}
		function cancel(){ if(timer){clearTimeout(timer);timer=null;} }
		/* Touch browsers fire mouseleave right after every tap; after a touch, close only on a tap outside the menu. */
		var lastTouch=0;
		document.addEventListener('pointerdown',function(e){
			if(e.pointerType!=='touch'&&e.pointerType!=='pen')return;
			lastTouch=Date.now();
			if(!e.target.closest('.main-navigation'))closeAll();
		},true);
		function scheduleClose(){ if(Date.now()-lastTouch<1500)return; cancel(); timer=setTimeout(closeAll,GRACE); }
		function open(top){
			cancel(); closeAll();
			top.classList.add(OPEN);
			var a=top.querySelector(':scope > a');
			if(a)a.setAttribute('aria-expanded','true');
		}
		tops.forEach(function(top){
			var panel=top.querySelector(':scope > .sub-menu');
			if(!panel)return;
			var isReports=top.classList.contains('menu-reports');
			var hubLabel=isReports?'Collection hub':'Section hub';
			var rows=panel.querySelectorAll(':scope > li');
			function activate(row){ rows.forEach(function(r){ r.classList.toggle(ACTIVE, r===row); }); }
			rows.forEach(function(row){
				var pane=row.querySelector(':scope > .sub-menu');
				if(!pane)return;
				row.classList.add('tai-has-pane');
				var link=row.querySelector(':scope > a');
				var clone=link?link.cloneNode(true):null;
				if(clone){ clone.querySelectorAll('.dropdown-menu-toggle,.menu-item-description').forEach(function(x){x.remove();}); }
				var name=clone?clone.textContent.trim():'';
				var n=pane.querySelectorAll(':scope > li').length;
				var head=document.createElement('li');
				head.className='tai-pane-head';
				var cnt=isReports?(n+' report'+(n===1?'':'s')):(n+' page'+(n===1?'':'s'));
				head.innerHTML='<span></span><span class="tai-pane-cnt"></span>';
				head.children[0].textContent=name;
				head.children[1].textContent=cnt;
				pane.insertBefore(head,pane.firstChild);
				var hub=document.createElement('li');
				hub.className='tai-pane-hub';
				var a=document.createElement('a');
				a.setAttribute('href', link?link.getAttribute('href'):'#');
				a.textContent=hubLabel+' →';
				hub.appendChild(a);
				pane.appendChild(hub);
				/* Phone accordion button */
				if(!pane.id){ pane.id='tai-pane-'+Math.random().toString(36).slice(2,9); }
				var b=document.createElement('button');
				b.type='button';
				b.className='tai-l3-toggle';
				b.setAttribute('aria-expanded','false');
				b.setAttribute('aria-controls',pane.id);
				b.setAttribute('aria-label','Show the '+n+' pages in '+name);
				b.innerHTML='<span class="tai-l3-cnt"></span><span class="tai-l3-sign" aria-hidden="true">+</span>';
				b.firstChild.textContent=n;
				row.insertBefore(b,pane);
				b.addEventListener('click',function(e){
					e.preventDefault(); e.stopPropagation();
					var on=row.classList.toggle(L3OPEN);
					b.setAttribute('aria-expanded',on?'true':'false');
					b.setAttribute('aria-label',(on?'Hide':'Show')+' the '+n+' pages in '+name);
					b.lastChild.textContent=on?'−':'+';
				});
				row.addEventListener('mouseenter',function(){activate(row);});
				row.addEventListener('focusin',function(){activate(row);});
				/* Tablets: first tap on a section shows its pane; second tap opens the hub */
				if(link){ touchGuard(link,function(){return row.classList.contains(ACTIVE);},function(){activate(row);}); }
			});
			for(var i=0;i<rows.length;i++){
				if(rows[i].querySelector(':scope > .sub-menu')){ activate(rows[i]); break; }
			}
			top.addEventListener('mouseenter',function(){ open(top); });
			top.addEventListener('mouseleave',scheduleClose);
			panel.addEventListener('mouseenter',cancel);
			panel.addEventListener('mouseleave',scheduleClose);
			var toplink=top.querySelector(':scope > a');
			if(toplink){
				toplink.setAttribute('aria-expanded','false');
				touchGuard(toplink,function(){return top.classList.contains(OPEN);},function(){open(top);});
			}
		});
		document.querySelectorAll('.main-navigation .main-nav > ul > li:not(.menu-indexes):not(.menu-reports)').forEach(function(li){
			li.addEventListener('mouseenter',closeAll);
		});
		document.addEventListener('keydown',function(e){ if(e.key==='Escape')closeAll(); });
	})();
	</script>
	<?php
}, 99 );
