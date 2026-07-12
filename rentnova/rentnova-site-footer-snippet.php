<?php
/**
 * RentNova — site-wide footer snippet
 *
 * Hides the active theme's default footer (built for Kadence, works
 * on most themes) and prints a proper RentNova footer on every page.
 *
 * DEPLOY (WPCode — the same route you used for other snippets):
 *  1. Plugins → WPCode → Add New → **PHP Snippet**.
 *  2. Title: "RentNova site footer".
 *  3. Paste this entire file (including the <?php line, or omit it
 *     and paste from `if ( ! defined(...) )` onwards — WPCode will
 *     handle either).
 *  4. Insertion → **Auto Insert** → Location: **Frontend Only**.
 *  5. Save + Activate.
 *
 * DEPLOY (child theme alternative):
 *  Drop this file into `wp-content/themes/kadence-child/inc/` and
 *  require it once from the child theme's `functions.php`:
 *      require_once __DIR__ . '/inc/rentnova-site-footer-snippet.php';
 *
 * WHAT TO EDIT AFTER INSTALL
 *  Every value marked `TODO(deploy):` — grep the file:
 *      grep -n "TODO(deploy):" rentnova/rentnova-site-footer-snippet.php
 *  Currently that's the STR licence #, MAT rate, insurance amount,
 *  email, phone, and social URLs.
 *
 * @package rentnova
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* ============================================================
 * 1. Hide the active theme's default footer.
 *    Scoped in <head> so it hits before layout paints and doesn't
 *    flash the old footer momentarily.
 * ============================================================ */
function rentnova_hide_theme_footer_css() {
	?>
	<style id="rn-hide-theme-footer">
	/* Hide Kadence's default footer + any generic fallback selectors */
	footer#colophon,
	.site-footer:not(.rn-footer),
	.site-bottom-footer-wrap,
	.site-top-footer-wrap,
	.site-middle-footer-wrap { display: none !important; }
	</style>
	<?php
}
add_action( 'wp_head', 'rentnova_hide_theme_footer_css', 5 );

/* ============================================================
 * 2. RentNova footer — printed on every page via wp_footer.
 * ============================================================ */
function rentnova_site_footer_html() {
	// TODO(deploy): replace placeholders with real values.
	$rn_str_license = '[STR-LICENSE]';
	$rn_mat_pct     = '6%';
	$rn_insurance   = '$1M';
	$rn_email       = 'hello@rent-nova.com';
	$rn_phone_disp  = '+1 (905) 555-0143';
	$rn_phone_tel   = '+19055550143';
	$rn_year        = gmdate( 'Y' );
	$rn_social      = array(
		'Instagram' => 'https://instagram.com/rentnova',
		'LinkedIn'  => 'https://linkedin.com/company/rentnova',
	);

	// Loading fonts inside the footer is safe — browsers dedupe against
	// the ones the drop-in templates already load in <head>.
	?>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Hanken+Grotesk:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">

	<style id="rn-footer-styles">
	.rn-footer{
		width:100vw; position:relative; left:50%; right:50%;
		margin-left:-50vw; margin-right:-50vw;
		background:#16241b; color:#f1efe8;
		font-family:'Hanken Grotesk',system-ui,-apple-system,sans-serif;
		font-size:14.5px; line-height:1.55;
		box-sizing:border-box; -webkit-font-smoothing:antialiased;
	}
	.rn-footer *,.rn-footer *::before,.rn-footer *::after{ box-sizing:border-box; }
	.rn-footer a{ color:#f1efe8; text-decoration:none; transition:color .15s ease; }
	.rn-footer a:hover{ color:#e0a583; }

	/* Compliance strip — highest priority visual */
	.rn-footer__comply{ background:#1a2e21; border-bottom:1px solid #2f4537; }
	.rn-footer__comply-in{ max-width:1320px; margin:0 auto; padding:18px 56px; display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
	.rn-footer__comply-c strong{ display:block; font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.16em; color:#e0a583; text-transform:uppercase; margin-bottom:4px; font-weight:500; }
	.rn-footer__comply-c span{ font-size:13.5px; color:#f1efe8; font-weight:600; }
	.rn-footer__comply-c mark{ background:none; color:#8ba090; font-weight:400; }

	/* Main grid */
	.rn-footer__main{ max-width:1320px; margin:0 auto; padding:56px 56px 40px; display:grid; grid-template-columns:2fr 1fr 1fr 1fr 1fr; gap:48px; }
	.rn-footer__brand-name{ font-family:'Archivo',sans-serif; font-size:28px; font-weight:800; letter-spacing:-.02em; display:block; margin-bottom:8px; }
	.rn-footer__brand-loc{ font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.12em; color:#7f9384; text-transform:uppercase; display:block; margin-bottom:22px; }
	.rn-footer__brand-tag{ font-size:14.5px; color:#c8d2c8; margin:0 0 24px; max-width:340px; line-height:1.6; }
	.rn-footer__contact{ display:flex; flex-direction:column; gap:6px; font-size:14px; }
	.rn-footer__contact strong{ font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.16em; color:#e0a583; text-transform:uppercase; font-weight:500; margin-right:8px; }

	.rn-footer__col h3{ font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.16em; color:#e0a583; text-transform:uppercase; margin:0 0 18px; font-weight:500; }
	.rn-footer__col ul{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; }
	.rn-footer__col li{ font-size:14.5px; }

	/* Bottom bar */
	.rn-footer__bar{ border-top:1px solid #2f4537; }
	.rn-footer__bar-in{ max-width:1320px; margin:0 auto; padding:22px 56px; display:flex; justify-content:space-between; align-items:center; gap:24px; flex-wrap:wrap; }
	.rn-footer__copy{ font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.06em; color:#7f9384; text-transform:uppercase; }
	.rn-footer__copy span{ color:#e0a583; margin-left:12px; }
	.rn-footer__social{ display:flex; gap:20px; align-items:center; }
	.rn-footer__social a{ font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#8ba090; border-bottom:1px solid transparent; padding-bottom:2px; }
	.rn-footer__social a:hover{ color:#e0a583; border-color:#e0a583; }
	.rn-footer__made{ font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.12em; color:#8ba090; text-transform:uppercase; }
	.rn-footer__made em{ font-style:normal; color:#e0a583; }

	@media (max-width:1100px){
		.rn-footer__main{ grid-template-columns:1fr 1fr 1fr; gap:40px 32px; }
		.rn-footer__brand{ grid-column:1 / -1; }
	}
	@media (max-width:860px){
		.rn-footer__comply-in{ grid-template-columns:1fr; padding:16px 28px; gap:12px; }
		.rn-footer__main{ grid-template-columns:1fr; padding:40px 28px 28px; gap:32px; }
		.rn-footer__bar-in{ padding:20px 28px; flex-direction:column; align-items:flex-start; gap:16px; }
	}
	</style>

	<footer class="rn-footer" role="contentinfo">

		<!-- Compliance strip — appears above the main footer grid -->
		<div class="rn-footer__comply">
			<div class="rn-footer__comply-in">
				<div class="rn-footer__comply-c">
					<strong>Toronto STR license</strong>
					<span>#<?php echo esc_html( $rn_str_license ); ?> · <mark>displayed on every stay confirmation</mark></span>
				</div>
				<div class="rn-footer__comply-c">
					<strong>MAT included</strong>
					<span>Toronto MAT (<?php echo esc_html( $rn_mat_pct ); ?>) already in the nightly rate — <mark>no surprise line item</mark></span>
				</div>
				<div class="rn-footer__comply-c">
					<strong>Insured to <?php echo esc_html( $rn_insurance ); ?></strong>
					<span>Every guest stay covered by short-term rental liability + property insurance</span>
				</div>
			</div>
		</div>

		<!-- Main grid: brand + 4 link columns -->
		<div class="rn-footer__main">

			<div class="rn-footer__brand">
				<span class="rn-footer__brand-name">RentNova</span>
				<span class="rn-footer__brand-loc">Mississauga · GTA West</span>
				<p class="rn-footer__brand-tag">Direct-book short stays across Mississauga, Oakville, Burlington, Hamilton and Milton. Homes we designed, built, furnished and now run.</p>
				<div class="rn-footer__contact">
					<div><strong>Email</strong><a href="mailto:<?php echo esc_attr( $rn_email ); ?>"><?php echo esc_html( $rn_email ); ?></a></div>
					<div><strong>Phone</strong><a href="tel:<?php echo esc_attr( $rn_phone_tel ); ?>"><?php echo esc_html( $rn_phone_disp ); ?></a></div>
					<div><strong>Hours</strong>Mon–Fri · 9am–6pm ET</div>
				</div>
			</div>

			<nav class="rn-footer__col" aria-label="Explore">
				<h3>Explore</h3>
				<ul>
					<li><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Home</a></li>
					<li><a href="<?php echo esc_url( home_url( '/stays/' ) ); ?>">Stays</a></li>
					<li><a href="<?php echo esc_url( home_url( '/guide/' ) ); ?>">Guide</a></li>
					<li><a href="<?php echo esc_url( home_url( '/about/' ) ); ?>">About</a></li>
				</ul>
			</nav>

			<nav class="rn-footer__col" aria-label="For owners">
				<h3>For owners</h3>
				<ul>
					<li><a href="<?php echo esc_url( home_url( '/list-with-us/' ) ); ?>">List with us</a></li>
					<li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Free feasibility →</a></li>
					<li><a href="<?php echo esc_url( home_url( '/guide/' ) ); ?>">How it works</a></li>
				</ul>
			</nav>

			<nav class="rn-footer__col" aria-label="Company">
				<h3>Company</h3>
				<ul>
					<li><a href="<?php echo esc_url( home_url( '/about/' ) ); ?>">About</a></li>
					<li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Contact</a></li>
					<li><a href="<?php echo esc_url( home_url( '/careers/' ) ); ?>">Careers</a></li>
				</ul>
			</nav>

			<nav class="rn-footer__col" aria-label="Legal">
				<h3>Legal</h3>
				<ul>
					<li><a href="<?php echo esc_url( home_url( '/privacy/' ) ); ?>">Privacy</a></li>
					<li><a href="<?php echo esc_url( home_url( '/terms/' ) ); ?>">Terms of service</a></li>
					<li><a href="<?php echo esc_url( home_url( '/cancellation/' ) ); ?>">Cancellation policy</a></li>
					<li><a href="<?php echo esc_url( home_url( '/house-rules/' ) ); ?>">House rules</a></li>
				</ul>
			</nav>

		</div>

		<!-- Bottom bar: © + social + made-in -->
		<div class="rn-footer__bar">
			<div class="rn-footer__bar-in">
				<div class="rn-footer__copy">
					© <?php echo esc_html( $rn_year ); ?> RentNova · Mississauga &amp; GTA West
					<span>STR #<?php echo esc_html( $rn_str_license ); ?></span>
				</div>
				<div class="rn-footer__social">
					<?php foreach ( $rn_social as $label => $url ) : ?>
						<a href="<?php echo esc_url( $url ); ?>" rel="me noopener"><?php echo esc_html( $label ); ?></a>
					<?php endforeach; ?>
				</div>
				<div class="rn-footer__made">Made in <em>Mississauga</em></div>
			</div>
		</div>

	</footer>
	<?php
}
add_action( 'wp_footer', 'rentnova_site_footer_html', 20 );
