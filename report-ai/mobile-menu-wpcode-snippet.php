<?php
/**
 * The AI Index — Mobile Navigation Drawer
 * ------------------------------------------------------------------
 * Drop-in for report-ai.org (GeneratePress). Renders a sticky 60px
 * mobile header + full-screen "index drawer" below 900px, driven by
 * the existing WP nav menu (Appearance → Menus → "Primary", id 34).
 *
 * INSTALL (pick one):
 *   A) WPCode → Add Snippet → "Add Your Custom Code (New Snippet)" →
 *      choose **PHP Snippet**, paste this whole file (minus the opening
 *      <?php line if WPCode adds its own), Auto-Insert → "Run Everywhere",
 *      Save + Activate.
 *   B) Child theme functions.php → paste everything below the <?php line.
 *
 * ONE THING TO CHECK — the CONFIG block hides your current header on
 * mobile so you don't get two headers. If the old header still shows on
 * a phone, change $hide_selector to your header's wrapper selector
 * (or send me the header markup and I'll finalise it).
 *
 * Editors control the menu at Appearance → Menus. Any top-level item
 * WITH children renders as an accordion; items without children are
 * flat links. A menu item's optional "Description" field is shown as
 * grey sub-text on its row.
 * ------------------------------------------------------------------
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

add_action( 'wp_footer', 'dcx_mobile_nav_render', 20 );
function dcx_mobile_nav_render() {

	if ( is_admin() ) { return; }

	/* ---------- CONFIG ---------- */
	$menu_id       = 34;                        // "Primary" menu id
	$hide_selector = '.site-header, #masthead'; // header(s) to hide < 900px — ADJUST if needed
	$breakpoint    = '899.98px';                // desktop nav takes over at 900px
	$updated_line  = 'Index updated ' . date_i18n( 'F Y' );
	$note_line2    = 'Every figure sourced &amp; dated';
	$brand_text    = 'THE AI INDEX';
	$cta_text      = 'Subscribe to the monthly index';
	/* ---------------------------- */

	$items = wp_get_nav_menu_items( $menu_id );
	if ( empty( $items ) ) { return; }

	// Build parent → children map.
	$by_parent = array();
	foreach ( $items as $it ) {
		$by_parent[ (int) $it->menu_item_parent ][] = $it;
	}
	$top = isset( $by_parent[0] ) ? $by_parent[0] : array();
	if ( empty( $top ) ) { return; }

	// Find a "Subscribe" item for the CTA link.
	$cta_url = home_url( '/about/contact/' );
	foreach ( $items as $it ) {
		if ( stripos( $it->title, 'subscribe' ) !== false ) { $cta_url = $it->url; break; }
	}

	$home = esc_url( home_url( '/' ) );
	$search_action = esc_url( home_url( '/' ) );

	ob_start(); ?>
<style id="dcx-mnav-css">
#dcx-root{display:none;}
@media (max-width:<?php echo esc_html( $breakpoint ); ?>){
  <?php echo $hide_selector; // header(s) to hide on mobile ?>{display:none !important;}
  body.dcx-lock{overflow:hidden;}
  #dcx-root{display:block;font-family:'Archivo',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111114;}
  #dcx-root *{box-sizing:border-box;}
  .dcx-vh{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;}
  .dcx-hd{position:sticky;top:0;z-index:1000;height:60px;background:#fff;border-bottom:1px solid #e6e6ea;display:flex;align-items:center;justify-content:space-between;padding:0 18px;}
  .dcx-brand{display:flex;align-items:center;gap:9px;text-decoration:none;color:#111114;}
  .dcx-mono{display:flex;align-items:flex-end;gap:3px;height:20px;}
  .dcx-mono i{display:block;width:5px;}
  .dcx-mono .m1{height:9px;background:#2545f5;}
  .dcx-mono .m2{height:14px;background:#2545f5;}
  .dcx-mono .m3{height:20px;background:#111114;}
  .dcx-wm{font-weight:900;font-size:16px;letter-spacing:-0.02em;color:#111114;}
  .dcx-btn{width:44px;height:44px;margin-right:-10px;display:flex;flex-direction:column;justify-content:center;align-items:flex-end;gap:5px;cursor:pointer;background:none;border:0;padding:0;}
  .dcx-btn .bar{display:block;height:2px;background:#111114;transition:all .2s ease;}
  .dcx-btn .b1{width:22px;}
  .dcx-btn .b2{width:15px;}
  #dcx-open:checked ~ .dcx-hd .dcx-btn .b1{width:22px;background:#2545f5;transform:translateY(3.5px) rotate(45deg);}
  #dcx-open:checked ~ .dcx-hd .dcx-btn .b2{width:22px;background:#2545f5;transform:translateY(-3.5px) rotate(-45deg);}
  .dcx-dw{position:fixed;left:0;right:0;top:60px;bottom:0;background:#fff;z-index:999;display:flex;flex-direction:column;opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .18s ease-out,transform .18s ease-out;}
  #dcx-open:checked ~ .dcx-dw{opacity:1;transform:none;pointer-events:auto;}
  .dcx-search{padding:22px 18px 12px;}
  .dcx-sf{display:flex;align-items:center;gap:10px;border:1.5px solid #111114;padding:12px 14px;}
  .dcx-sf .g{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:13px;color:#9a9aa2;}
  .dcx-sf input{flex:1;border:0;outline:0;background:transparent;font-family:'Archivo',sans-serif;font-size:14.5px;color:#111114;}
  .dcx-sf input::placeholder{color:#9a9aa2;}
  .dcx-list{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 18px;}
  .dcx-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:20px 0;border-top:1px solid #e6e6ea;min-height:44px;text-decoration:none;cursor:pointer;}
  .dcx-row .lbl{font-weight:900;font-size:27px;letter-spacing:-0.03em;color:#111114;line-height:1;}
  .dcx-row .meta{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:12px;color:#9a9aa2;display:flex;align-items:center;gap:10px;white-space:nowrap;}
  .dcx-row .caret{font-size:17px;color:#2545f5;line-height:1;width:12px;text-align:center;}
  .dcx-acc .caret::before{content:'+';}
  .dcx-acc input:checked ~ .dcx-row .caret::before{content:'\2013';}
  .dcx-last{border-bottom:1px solid #e6e6ea;}
  .dcx-sub{overflow:hidden;max-height:0;transition:max-height .2s ease;}
  .dcx-acc input:checked ~ .dcx-sub{max-height:1400px;}
  .dcx-subrow{display:flex;justify-content:space-between;gap:14px;padding:13px 0;border-top:1px solid #f0f0f3;text-decoration:none;}
  .dcx-subrow .t{font-size:14.5px;font-weight:700;color:#111114;}
  .dcx-subrow .d{font-size:11.5px;color:#8a8a92;margin-top:2px;}
  .dcx-note{font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:0.1em;text-transform:uppercase;color:#9a9aa2;padding:18px 0 22px;line-height:1.7;}
  .dcx-cta{flex:0 0 auto;padding:14px 18px 20px;padding-bottom:max(20px,env(safe-area-inset-bottom));border-top:1px solid #e6e6ea;background:#fff;}
  .dcx-cta a{display:block;background:#2545f5;color:#fff;text-align:center;font-weight:700;font-size:15px;padding:15px;border-radius:2px;text-decoration:none;}
}
@media (prefers-reduced-motion: reduce){
  .dcx-dw,.dcx-sub,.dcx-btn .bar{transition:none !important;}
}
</style>

<div id="dcx-root">
  <input type="checkbox" id="dcx-open" class="dcx-vh" aria-hidden="true">

  <header class="dcx-hd">
    <a class="dcx-brand" href="<?php echo $home; ?>" aria-label="The AI Index — home">
      <span class="dcx-mono" aria-hidden="true"><i class="m1"></i><i class="m2"></i><i class="m3"></i></span>
      <span class="dcx-wm"><?php echo esc_html( $brand_text ); ?></span>
    </a>
    <label class="dcx-btn" for="dcx-open" id="dcx-btn" role="button" tabindex="0" aria-controls="dcx-drawer" aria-expanded="false" aria-label="Open menu">
      <span class="bar b1"></span><span class="bar b2"></span>
    </label>
  </header>

  <nav class="dcx-dw" id="dcx-drawer" aria-label="Site">
    <div class="dcx-search">
      <form class="dcx-sf" role="search" method="get" action="<?php echo $search_action; ?>">
        <span class="g" aria-hidden="true">&#9906;</span>
        <input type="search" name="s" placeholder="Search the index&hellip;" aria-label="Search">
      </form>
    </div>

    <div class="dcx-list">
      <?php
      $last = count( $top ) - 1;
      foreach ( $top as $i => $t ) {
          $kids     = isset( $by_parent[ $t->ID ] ) ? $by_parent[ $t->ID ] : array();
          $title    = esc_html( $t->title );
          $url      = esc_url( $t->url );
          $is_last  = ( $i === $last );
          $meta_txt = $t->description ? esc_html( $t->description ) : '';

          if ( ! empty( $kids ) ) {
              $acc_id = 'dcx-a-' . (int) $t->ID;
              echo '<div class="dcx-acc">';
              echo '<input type="checkbox" id="' . esc_attr( $acc_id ) . '" class="dcx-vh">';
              echo '<label class="dcx-row" for="' . esc_attr( $acc_id ) . '">';
              echo '<span class="lbl">' . $title . '</span>';
              echo '<span class="meta">' . ( $meta_txt ? $meta_txt . ' ' : count( $kids ) . ' ' ) . '<span class="caret" aria-hidden="true"></span></span>';
              echo '</label>';
              echo '<div class="dcx-sub">';
              foreach ( $kids as $k ) {
                  echo '<a class="dcx-subrow dcx-link" href="' . esc_url( $k->url ) . '">';
                  echo '<span><span class="t">' . esc_html( $k->title ) . '</span>';
                  if ( $k->description ) { echo '<span class="d">' . esc_html( $k->description ) . '</span>'; }
                  echo '</span></a>';
              }
              echo '</div>';
              echo '</div>';
          } else {
              $cls = 'dcx-row dcx-link' . ( $is_last ? ' dcx-last' : '' );
              echo '<a class="' . $cls . '" href="' . $url . '">';
              echo '<span class="lbl">' . $title . '</span>';
              echo '<span class="meta">' . ( $meta_txt ? $meta_txt : '&rsaquo;' ) . '</span>';
              echo '</a>';
          }
      }
      ?>
      <div class="dcx-note"><?php echo esc_html( $updated_line ); ?><br><?php echo $note_line2; ?></div>
    </div>

    <div class="dcx-cta">
      <a href="<?php echo esc_url( $cta_url ); ?>"><?php echo esc_html( $cta_text ); ?></a>
    </div>
  </nav>
</div>

<script id="dcx-mnav-js">
(function(){
  var cb = document.getElementById('dcx-open');
  var btn = document.getElementById('dcx-btn');
  var drawer = document.getElementById('dcx-drawer');
  if(!cb || !btn || !drawer) return;
  var search = drawer.querySelector('input[type=search]');

  function sync(){
    var open = cb.checked;
    document.body.classList.toggle('dcx-lock', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if(open && search){ setTimeout(function(){ try{ search.focus(); }catch(e){} }, 200); }
  }
  cb.addEventListener('change', sync);

  // Keyboard operability for the label toggle.
  btn.addEventListener('keydown', function(e){
    if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){
      e.preventDefault(); cb.checked = !cb.checked; sync();
    }
  });

  // Esc closes and returns focus to the button.
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && cb.checked){ cb.checked = false; sync(); btn.focus(); }
  });

  // Close when a navigation link is tapped (covers same-page/hash links).
  drawer.addEventListener('click', function(e){
    var a = e.target.closest('a.dcx-link');
    if(a){ cb.checked = false; document.body.classList.remove('dcx-lock'); }
  });
})();
</script>
<?php
	echo ob_get_clean(); // phpcs:ignore -- static markup assembled above
}
