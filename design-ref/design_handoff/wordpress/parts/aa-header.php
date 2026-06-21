<?php
/**
 * Agile Agilist — Site Header component (masthead + main bar + Training mega-menu + animated logo)
 * ------------------------------------------------------------------------------------------------
 * Drop-in for a CLASSIC theme. Usage in header.php:  get_template_part('parts/aa-header');
 * Enqueue assets/aa-nav.css + assets/aa-nav.js (see aa-enqueue.php).
 *
 * The Training mega-menu is data-driven: edit the $aa_tracks array below, OR wire it to an ACF
 * repeater / a custom Walker on the 'primary' menu (see notes at bottom). Keeping it as a PHP
 * array here makes it trivial to port and to hand to marketing via ACF later.
 *
 * Brand tokens live in aa-nav.css (:root). Replace the logo with the official SVG in production.
 */

if ( ! defined('ABSPATH') ) exit;

// --- Mega-menu data (swap for ACF/CPT query in production) -------------------------------------
$aa_track_groups = [
  [ 'no' => '01', 'title' => 'Micro-Credentials', 'desc' => 'Stackable SAFe + ICAgile badges', 'count' => '18 badges', 'url' => '/training/micro-credentials/', 'tone' => 'teal' ],
  [ 'no' => '02', 'title' => 'SAFe by Role',      'desc' => 'SSM · POPM · SASM · DevOps · BO',   'count' => '6 certs',   'url' => '/training/safe-by-role/',     'tone' => 'teal' ],
  [ 'no' => '03', 'title' => 'Advanced Training', 'desc' => 'RTE · LPM · APM · SPC · ASPC',       'count' => '5 certs',   'url' => '/training/advanced/',         'tone' => 'teal' ],
  [ 'no' => '04', 'title' => 'SAFe by Industry',  'desc' => 'Architect · Hardware · Government',  'count' => '6 tracks',  'url' => '/training/by-industry/',      'tone' => 'teal' ],
];
$aa_ai_track = [ 'no' => '05', 'title' => 'AI-Native', 'desc' => 'AI-Ready · Foundations · Change Agent · Leading the AI-Native Org', 'count' => '4 tracks · Flagship', 'url' => '/training/ai-native/' ];

$aa_logo = get_stylesheet_directory_uri() . '/assets/logo-agile-agilist.png'; // replace with .svg
$aa_nav  = [
  [ 'label' => 'Training',    'url' => '/training/',    'mega' => true  ],
  [ 'label' => 'Assessments', 'url' => '/assessments/', 'mega' => false ],
  [ 'label' => 'Services',    'url' => '/services/',    'mega' => false ],
  [ 'label' => 'Methodology', 'url' => '/methodology/', 'mega' => false ],
  [ 'label' => 'About',       'url' => '/about/',       'mega' => false ],
];
?>

<div class="aa-masthead">
  <div class="aa-wrap">
    <span>SAFe® Gold Partner — SPCT-led</span>
    <span class="aa-mast-mid">Toronto &rarr; Delivered globally · 9 languages</span>
    <span class="aa-mast-rating"><span class="aa-star">&#9733;</span> 4.9 / 2,500+ certified</span>
  </div>
</div>

<header class="aa-header" id="aa-header">
  <nav class="aa-wrap aa-nav" aria-label="Primary">

    <a href="<?php echo esc_url( home_url('/') ); ?>" class="aa-logo" aria-label="Agile Agilist — home">
      <img src="<?php echo esc_url( $aa_logo ); ?>" alt="Agile Agilist" width="82" height="40" decoding="async">
      <span class="aa-logo-shine" aria-hidden="true"><span></span></span>
    </a>

    <button class="aa-burger" aria-label="Open menu" aria-expanded="false" aria-controls="aa-drawer">
      <span></span><span></span><span></span>
    </button>

    <ul class="aa-menu" role="menubar">
      <?php foreach ( $aa_nav as $i => $item ) :
        $is_mega = ! empty($item['mega']); ?>
        <li class="aa-menu-item<?php echo $is_mega ? ' has-mega' : ''; ?>" role="none">
          <a href="<?php echo esc_url($item['url']); ?>" class="aa-link" role="menuitem"
             <?php if ($is_mega) : ?>aria-haspopup="true" aria-expanded="false" aria-controls="aa-mega-training"<?php endif; ?>>
            <?php echo esc_html($item['label']); ?>
            <?php if ($is_mega) : ?><span class="aa-caret" aria-hidden="true">&#9662;</span><?php endif; ?>
          </a>

          <?php if ($is_mega) : ?>
          <div class="aa-mega" id="aa-mega-training" role="region" aria-label="Training menu">
            <div class="aa-mega-grid">
              <?php foreach ( $aa_track_groups as $g ) : ?>
                <a class="aa-mega-cell" href="<?php echo esc_url($g['url']); ?>">
                  <span class="aa-mega-no aa-tone-<?php echo esc_attr($g['tone']); ?>"><?php echo esc_html($g['no'] . ' · ' . $g['count']); ?></span>
                  <span class="aa-mega-title"><?php echo esc_html($g['title']); ?></span>
                  <span class="aa-mega-desc"><?php echo esc_html($g['desc']); ?></span>
                </a>
              <?php endforeach; ?>
            </div>
            <a class="aa-mega-feature" href="<?php echo esc_url($aa_ai_track['url']); ?>">
              <span class="aa-mega-feature-glow" aria-hidden="true"></span>
              <span class="aa-mega-feature-body">
                <span class="aa-mega-no aa-feature-no"><?php echo esc_html($aa_ai_track['no'] . ' · ' . $aa_ai_track['count']); ?></span>
                <span class="aa-mega-feature-title"><?php echo esc_html($aa_ai_track['title']); ?></span>
                <span class="aa-mega-feature-desc"><?php echo esc_html($aa_ai_track['desc']); ?></span>
              </span>
              <span class="aa-mega-feature-go">Explore &rarr;</span>
            </a>
          </div>
          <?php endif; ?>
        </li>
      <?php endforeach; ?>
    </ul>

    <div class="aa-actions">
      <a href="/contact/" class="aa-action-text">Book a consult</a>
      <a href="/training/" class="aa-action-cta">View cohorts &rarr;</a>
    </div>
  </nav>
</header>

<!-- Mobile drawer (mirrors the menu as an accordion) -->
<div class="aa-drawer" id="aa-drawer" hidden>
  <ul class="aa-drawer-list">
    <?php foreach ( $aa_nav as $item ) : ?>
      <li>
        <?php if ( ! empty($item['mega']) ) : ?>
          <button class="aa-drawer-toggle" aria-expanded="false"><?php echo esc_html($item['label']); ?><span>+</span></button>
          <div class="aa-drawer-sub" hidden>
            <?php foreach ( $aa_track_groups as $g ) : ?>
              <a href="<?php echo esc_url($g['url']); ?>"><?php echo esc_html($g['title']); ?> <em><?php echo esc_html($g['count']); ?></em></a>
            <?php endforeach; ?>
            <a href="<?php echo esc_url($aa_ai_track['url']); ?>" class="aa-drawer-ai"><?php echo esc_html($aa_ai_track['title']); ?> <em>Flagship</em></a>
          </div>
        <?php else : ?>
          <a href="<?php echo esc_url($item['url']); ?>"><?php echo esc_html($item['label']); ?></a>
        <?php endif; ?>
      </li>
    <?php endforeach; ?>
  </ul>
  <a href="/training/" class="aa-action-cta aa-drawer-cta">View cohorts &rarr;</a>
</div>

<?php /*
====================================================================================================
WIRING NOTES
----------------------------------------------------------------------------------------------------
• Make it editable: replace $aa_track_groups / $aa_ai_track with an ACF Options repeater
  (get_field('training_tracks','option')) so marketing edits the mega-menu without code.
• Use WP menus instead: register_nav_menu('primary',…); render top links with wp_nav_menu() and a
  custom Walker that injects <div class="aa-mega"> when a top item has children. Keep the markup
  classes identical so aa-nav.css/js still apply.
• Active state: add aria-current="page" / a .is-active class on the matching top link.
• Logo: swap the PNG for the official SVG; keep width/height to avoid CLS.
==================================================================================================== */ ?>
