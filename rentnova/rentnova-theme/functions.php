<?php
/**
 * RentNova Blueprint — theme functions
 *
 * @package rentnova
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'RENTNOVA_VERSION', '1.0.0' );

/* ============================================================
 * 1. THEME SUPPORT
 * ============================================================ */
function rentnova_setup() {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support(
		'html5',
		array( 'search-form', 'gallery', 'caption', 'style', 'script', 'navigation-widgets' )
	);
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 40,
			'width'       => 200,
			'flex-width'  => true,
			'flex-height' => true,
		)
	);

	register_nav_menus(
		array(
			'primary' => __( 'Primary Menu', 'rentnova' ),
		)
	);
}
add_action( 'after_setup_theme', 'rentnova_setup' );

/* ============================================================
 * 2. ASSETS
 * ============================================================ */
function rentnova_assets() {
	// Google Fonts.
	wp_enqueue_style(
		'rentnova-fonts',
		'https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Hanken+Grotesk:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap',
		array(),
		null
	);

	// Main stylesheet (the theme style.css).
	wp_enqueue_style(
		'rentnova-style',
		get_stylesheet_uri(),
		array( 'rentnova-fonts' ),
		RENTNOVA_VERSION
	);

	// Front-end JS (mobile menu + replay-on-scroll).
	wp_enqueue_script(
		'rentnova-script',
		get_theme_file_uri( 'assets/js/rentnova.js' ),
		array(),
		RENTNOVA_VERSION,
		true
	);
}
add_action( 'wp_enqueue_scripts', 'rentnova_assets' );

/* ============================================================
 * 3. STAYS CUSTOM POST TYPE
 * ============================================================ */
function rentnova_register_stays() {
	$labels = array(
		'name'               => __( 'Stays', 'rentnova' ),
		'singular_name'      => __( 'Stay', 'rentnova' ),
		'add_new'            => __( 'Add Stay', 'rentnova' ),
		'add_new_item'       => __( 'Add New Stay', 'rentnova' ),
		'edit_item'          => __( 'Edit Stay', 'rentnova' ),
		'new_item'           => __( 'New Stay', 'rentnova' ),
		'view_item'          => __( 'View Stay', 'rentnova' ),
		'search_items'       => __( 'Search Stays', 'rentnova' ),
		'not_found'          => __( 'No stays found', 'rentnova' ),
		'menu_name'          => __( 'Stays', 'rentnova' ),
	);

	register_post_type(
		'stay',
		array(
			'labels'       => $labels,
			'public'       => true,
			'has_archive'  => true,
			'menu_icon'    => 'dashicons-admin-home',
			'menu_position' => 5,
			'rewrite'      => array( 'slug' => 'stays' ),
			'supports'     => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
			'show_in_rest' => true,
		)
	);
}
add_action( 'init', 'rentnova_register_stays' );

/* ============================================================
 * 4. STAY LISTING META (price, beds, sleeps, min nights, location)
 * ============================================================ */
function rentnova_stay_meta_fields() {
	return array(
		'rn_location'   => __( 'Location', 'rentnova' ),
		'rn_price'      => __( 'Price per night ($)', 'rentnova' ),
		'rn_bedrooms'   => __( 'Bedrooms', 'rentnova' ),
		'rn_sleeps'     => __( 'Sleeps', 'rentnova' ),
		'rn_min_nights' => __( 'Minimum nights', 'rentnova' ),
		'rn_book_url'   => __( 'Booking URL', 'rentnova' ),
	);
}

function rentnova_add_stay_metabox() {
	add_meta_box(
		'rentnova_stay_details',
		__( 'Listing Details', 'rentnova' ),
		'rentnova_render_stay_metabox',
		'stay',
		'side',
		'high'
	);
}
add_action( 'add_meta_boxes', 'rentnova_add_stay_metabox' );

function rentnova_render_stay_metabox( $post ) {
	wp_nonce_field( 'rentnova_save_stay', 'rentnova_stay_nonce' );
	foreach ( rentnova_stay_meta_fields() as $key => $label ) {
		$value = get_post_meta( $post->ID, $key, true );
		printf(
			'<p style="margin:0 0 12px;"><label for="%1$s" style="display:block;font-weight:600;margin-bottom:4px;">%2$s</label>
			<input type="text" id="%1$s" name="%1$s" value="%3$s" style="width:100%%;" /></p>',
			esc_attr( $key ),
			esc_html( $label ),
			esc_attr( $value )
		);
	}
}

function rentnova_save_stay_meta( $post_id ) {
	if ( ! isset( $_POST['rentnova_stay_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['rentnova_stay_nonce'] ), 'rentnova_save_stay' ) ) {
		return;
	}
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}
	foreach ( array_keys( rentnova_stay_meta_fields() ) as $key ) {
		if ( isset( $_POST[ $key ] ) ) {
			update_post_meta( $post_id, $key, sanitize_text_field( wp_unslash( $_POST[ $key ] ) ) );
		}
	}
}
add_action( 'save_post_stay', 'rentnova_save_stay_meta' );

/* ============================================================
 * 5. HELPERS
 * ============================================================ */
/**
 * Demo stays used when no Stay posts exist yet, so the homepage
 * is never empty on a fresh install. Uses the real RentNova photos.
 */
function rentnova_demo_stays() {
	return array(
		array(
			'name'  => 'The Two-Story Home',
			'loc'   => 'Erin Mills · Mississauga',
			'meta'  => '4BR · Sleeps 6 · Min 15 nights',
			'price' => '167',
			'img'   => 'https://rent-nova.com/wp-content/uploads/2026/05/6019-featherhead-crescent-mississauga-W4633966-1.jpg',
			'url'   => '#',
		),
		array(
			'name'  => 'The Erin Mills Suite',
			'loc'   => 'Erin Mills · Mississauga',
			'meta'  => '1BR · Sleeps 2 · Min 3 nights',
			'price' => '65',
			'img'   => 'https://rent-nova.com/wp-content/uploads/2026/05/Bedroom-1-scaled.jpg',
			'url'   => '#',
		),
	);
}

/**
 * Build the "4BR · Sleeps 6 · Min 15 nights" string from meta.
 */
function rentnova_stay_meta_line( $post_id ) {
	$parts = array();
	$beds  = get_post_meta( $post_id, 'rn_bedrooms', true );
	$sleep = get_post_meta( $post_id, 'rn_sleeps', true );
	$min   = get_post_meta( $post_id, 'rn_min_nights', true );
	if ( $beds ) {
		$parts[] = $beds . 'BR';
	}
	if ( $sleep ) {
		$parts[] = 'Sleeps ' . $sleep;
	}
	if ( $min ) {
		$parts[] = 'Min ' . $min . ' nights';
	}
	return implode( ' · ', $parts );
}

/* ============================================================
 * 6. BLUEPRINT HERO — shortcode + block
 * Usage: [rentnova_blueprint]  (renders the animated section drawing)
 * ============================================================ */
function rentnova_blueprint_shortcode() {
	ob_start();
	get_template_part( 'template-parts/blueprint', 'figure' );
	return ob_get_clean();
}
add_shortcode( 'rentnova_blueprint', 'rentnova_blueprint_shortcode' );

function rentnova_register_blueprint_block() {
	if ( ! function_exists( 'register_block_type' ) ) {
		return;
	}
	register_block_type(
		'rentnova/blueprint',
		array(
			'render_callback' => 'rentnova_blueprint_shortcode',
		)
	);
}
add_action( 'init', 'rentnova_register_blueprint_block' );

/* ============================================================
 * 7. FALLBACK MENU
 * ============================================================ */
function rentnova_fallback_menu() {
	echo '<ul id="rn-primary-menu" class="rn-menu">';
	$items = array(
		__( 'Owners', 'rentnova' )  => home_url( '/owners/' ),
		__( 'Stays', 'rentnova' )   => home_url( '/stays/' ),
		__( 'About', 'rentnova' )   => home_url( '/about/' ),
		__( 'Contact', 'rentnova' ) => home_url( '/contact/' ),
	);
	foreach ( $items as $label => $url ) {
		printf( '<li><a href="%s">%s</a></li>', esc_url( $url ), esc_html( $label ) );
	}
	printf(
		'<li><a class="rn-nav__cta" href="%s">%s</a></li>',
		esc_url( home_url( '/contact/' ) ),
		esc_html__( 'Free feasibility →', 'rentnova' )
	);
	echo '</ul>';
}
