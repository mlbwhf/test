<?php
/**
 * Report AI — nav v2 support (single WPCode PHP snippet, "Auto Insert / Run Everywhere").
 * REPLACES the earlier "Report AI — nav support" snippet — one snippet, four jobs:
 *   1. Utility strip above the header (Subscribe / Contact / Log in — never in primary menu)
 *   2. Reports-dropdown eyebrows from the menu-item Description field
 *   3. Auto level-3: child index pages injected under each Indexes section (never hand-maintained)
 *   4. Pane-switching JS + body class for the two-pane library browser
 */

/* 1 — Utility strip */
add_action( 'generate_before_header', function () {
	?>
	<div class="tai-utility" role="navigation" aria-label="Utility">
		<a href="/subscribe/">Subscribe</a>
		<a href="/about/contact/">Contact</a>
		<a class="tai-login" href="<?php echo esc_url( wp_login_url() ); ?>">Log in</a>
	</div>
	<?php
}, 5 );

/* 1b — Utility links inside the mobile drawer footer (v3 spec: the desktop
 *      utility strip is hidden ≤768px and these take its place) */
add_action( 'generate_after_primary_menu', function () {
	?>
	<div class="tai-utility-drawer">
		<a href="/subscribe/">Subscribe</a>
		<a href="/about/contact/">Contact</a>
		<a class="tai-login" href="<?php echo esc_url( wp_login_url() ); ?>">Log in</a>
	</div>
	<?php
} );

/* 2 — Reports eyebrows (menu-item Description rendered inside the link) */
add_filter( 'nav_menu_item_title', function ( $title, $item, $args ) {
	if ( isset( $args->theme_location ) && 'primary' === $args->theme_location
		&& ! empty( $item->description ) && (int) $item->menu_item_parent !== 0 ) {
		return '<span class="menu-item-description">' . esc_html( $item->description ) . '</span>'
			. '<span class="menu-item-label">' . $title . '</span>';
	}
	return $title;
}, 10, 3 );

/* 3 — Auto level-3: for each level-2 Indexes section item that points at a page,
 *     inject that page's child pages as level-3 items. Publishing a new index page
 *     makes it appear in the nav with zero menu edits. */
add_filter( 'wp_nav_menu_objects', function ( $items, $args ) {
	if ( ! isset( $args->theme_location ) || 'primary' !== $args->theme_location ) {
		return $items;
	}
	// Find the top-level "Indexes" item (points at page 39).
	$indexes_item_id = 0;
	foreach ( $items as $item ) {
		if ( 0 === (int) $item->menu_item_parent && 39 === (int) $item->object_id ) {
			$indexes_item_id = (int) $item->ID;
			// mark for CSS scoping
			$item->classes[] = 'menu-indexes';
			break;
		}
	}
	if ( ! $indexes_item_id ) {
		return $items;
	}
	$injected  = array();
	$synthetic = 900000; // synthetic menu-item IDs, far above real ones
	foreach ( $items as $item ) {
		if ( (int) $item->menu_item_parent !== $indexes_item_id || 'page' !== $item->object ) {
			continue;
		}
		$children = get_pages( array(
			'parent'      => (int) $item->object_id,
			'sort_column' => 'menu_order,post_title',
			'number'      => 12,
		) );
		foreach ( $children as $child ) {
			$node                   = new stdClass();
			$node->ID               = ++$synthetic;
			$node->db_id            = $node->ID;
			$node->menu_item_parent = $item->ID;
			$node->object_id        = $child->ID;
			$node->object           = 'page';
			$node->type             = 'post_type';
			$node->type_label       = 'Page';
			$node->title            = $child->post_title;
			$node->url              = get_permalink( $child );
			$node->target           = '';
			$node->xfn              = '';
			$node->attr_title       = '';
			$node->description      = '';
			$node->classes          = array( 'tai-auto-l3' );
			$node->current          = false;
			$node->current_item_ancestor = false;
			$node->current_item_parent   = false;
			$injected[] = $node;
		}
	}
	if ( $injected ) {
		$items = array_merge( $items, $injected );
		add_filter( 'body_class', function ( $classes ) {
			$classes[] = 'tai-ledger-2pane';
			return $classes;
		} );
	}
	return $items;
}, 10, 2 );

/* 4 — Pane switching (desktop): hovering/focusing a section row shows its page list.
 *     All lists are server-rendered; this only toggles a class. */
add_action( 'wp_footer', function () {
	?>
	<script>
	(function(){
		var panel=document.querySelector('.menu-indexes > .sub-menu');
		if(!panel)return;
		var rows=panel.querySelectorAll(':scope > li');
		function activate(row){
			rows.forEach(function(r){r.classList.toggle('tai-pane-active',r===row);});
		}
		rows.forEach(function(row){
			var pane=row.querySelector(':scope > .sub-menu');
			if(!pane)return;
			var link=row.querySelector(':scope > a');
			var nm=link?link.cloneNode(true):null;
			if(nm){nm.querySelectorAll('.dropdown-menu-toggle,.menu-item-description').forEach(function(x){x.remove();});}
			var name=nm?nm.textContent.trim():'';
			var count=pane.querySelectorAll('li').length;
			var head=document.createElement('li');
			head.className='tai-pane-head';
			head.innerHTML='<span>'+name+'</span><span class="tai-pane-cnt">'+count+(count===1?' index':' indexes')+'</span>';
			pane.insertBefore(head,pane.firstChild);
			var hub=document.createElement('li');
			hub.className='tai-pane-hub';
			var href=link?link.getAttribute('href'):'#';
			hub.innerHTML='<a href="'+href+'">Section hub →</a>';
			pane.appendChild(hub);
			row.addEventListener('mouseenter',function(){activate(row);});
			row.addEventListener('focusin',function(){activate(row);});
		});
		for(var i=0;i<rows.length;i++){
			if(rows[i].querySelector(':scope > .sub-menu')){activate(rows[i]);break;}
		}
		document.addEventListener('keydown',function(e){
			if(e.key==='Escape'){
				document.querySelectorAll('.main-navigation .sfHover').forEach(function(li){li.classList.remove('sfHover');});
			}
		});
	})();
	</script>
	<?php
}, 99 );
