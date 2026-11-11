<?php
/**
 * Report AI — nav redesign PHP snippets.
 * Destination: child theme functions.php, or a WPCode PHP snippet
 * (site already runs WPCode; one snippet named "Report AI — nav support").
 */

/* 1. Utility strip above the primary bar.
 * Subscribe / Contact / Log in live ONLY here — never in the primary menu
 * (explicit non-goal in the design handoff: no conversion CTA in primary nav). */
add_action( 'generate_before_header', function () {
	?>
	<div class="tai-utility" role="navigation" aria-label="Utility">
		<a href="/subscribe/">Subscribe</a>
		<a href="/about/contact/">Contact</a>
		<a class="tai-login" href="<?php echo esc_url( wp_login_url() ); ?>">Log in</a>
	</div>
	<?php
}, 5 );

/* 2. Reports-palette eyebrows: render each menu item's Description field
 * ("Collection" / "News") inside the link, above the label. Styled by
 * .menu-item-description in Additional CSS. */
add_filter( 'nav_menu_item_title', function ( $title, $item, $args ) {
	if ( isset( $args->theme_location ) && 'primary' === $args->theme_location
		&& ! empty( $item->description ) && (int) $item->menu_item_parent !== 0 ) {
		return '<span class="menu-item-description">' . esc_html( $item->description ) . '</span>'
			. '<span class="menu-item-label">' . $title . '</span>';
	}
	return $title;
}, 10, 3 );
