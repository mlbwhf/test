<?php
/**
 * Agile Agilist — enqueue header assets (+ fonts). Drop into functions.php or include it.
 * Only Newsreader loads over the network; body/labels use system fonts (performance-first).
 */
if ( ! defined('ABSPATH') ) exit;

add_action('wp_enqueue_scripts', function () {
  $uri = get_stylesheet_directory_uri();
  $dir = get_stylesheet_directory();

  // The ONLY webfont (self-host for best performance; Google Fonts shown for simplicity)
  wp_enqueue_style(
    'aa-fonts',
    'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,400&display=swap',
    [], null
  );

  // Header / nav styles + behavior (load site-wide since the header is global)
  wp_enqueue_style ('aa-nav', "$uri/assets/aa-nav.css", ['aa-fonts'], @filemtime("$dir/assets/aa-nav.css") ?: null);
  wp_enqueue_script('aa-nav', "$uri/assets/aa-nav.js",  [], @filemtime("$dir/assets/aa-nav.js")  ?: null, true);
});

/**
 * Optional: register the primary menu so you can drive the top-level links from Appearance → Menus.
 * (The Training mega-panel stays data-driven in aa-header.php / ACF — see notes there.)
 */
add_action('after_setup_theme', function () {
  register_nav_menu('primary', 'Primary navigation');
});
