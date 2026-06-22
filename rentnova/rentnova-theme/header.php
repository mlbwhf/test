<?php
/**
 * Header — opening markup, nav.
 *
 * @package rentnova
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="rn-header">
	<nav class="rn-nav" aria-label="<?php esc_attr_e( 'Primary', 'rentnova' ); ?>">
		<a class="rn-brand" href="<?php echo esc_url( home_url( '/' ) ); ?>">
			<?php if ( has_custom_logo() ) : ?>
				<?php the_custom_logo(); ?>
			<?php else : ?>
				<span class="rn-brand__name"><?php bloginfo( 'name' ); ?></span>
				<span class="rn-brand__loc"><?php esc_html_e( 'Mississauga · GTA', 'rentnova' ); ?></span>
			<?php endif; ?>
		</a>

		<button class="rn-burger" aria-expanded="false" aria-controls="rn-primary-menu" aria-label="<?php esc_attr_e( 'Menu', 'rentnova' ); ?>">
			<svg width="20" height="14" viewBox="0 0 20 14" fill="none"><path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" stroke-width="1.6"/></svg>
		</button>

		<?php
		if ( has_nav_menu( 'primary' ) ) {
			wp_nav_menu(
				array(
					'theme_location' => 'primary',
					'container'      => false,
					'menu_id'        => 'rn-primary-menu',
					'menu_class'     => 'rn-menu',
					'depth'          => 1,
					'items_wrap'     => '<ul id="%1$s" class="%2$s">%3$s<li><a class="rn-nav__cta" href="' . esc_url( home_url( '/contact/' ) ) . '">' . esc_html__( 'Free feasibility →', 'rentnova' ) . '</a></li></ul>',
				)
			);
		} else {
			rentnova_fallback_menu();
		}
		?>
	</nav>
</header>
