<?php
/**
 * Template Name: RentNova Contact
 *
 * Drop-in Contact-page template for any existing WordPress theme.
 * Self-contained: all CSS is scoped under `.rnbp` and printed inline,
 * so it does NOT depend on your active theme's styles.
 *
 * HOW TO USE
 * 1. Copy this file into your active theme (or child theme) folder.
 * 2. WordPress admin → Pages → Add New (title: "Contact", slug: "contact").
 * 3. In Page Attributes → Template, choose "RentNova Contact".
 * 4. Publish. Then wire the form to your preferred mail handler
 *    (Contact Form 7, WPForms, or a custom admin-post handler).
 *
 * @package rentnova-dropin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();
?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Hanken+Grotesk:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">

<style>
/* ===== RentNova Contact — scoped drop-in styles ===== */
.rnbp{
  width:100vw; position:relative; left:50%; right:50%;
  margin-left:-50vw; margin-right:-50vw;
  --rn-ink:#16241b; --rn-ink2:#1a1a17; --rn-paper:#f1efe8; --rn-paper2:#e9e5da;
  --rn-terra:#c45e35; --rn-sand:#e0a583; --rn-muted:#5a574c; --rn-line:#d8d3c5;
  --rn-line-dk:#2f4537; --rn-mint:#8ba090; --rn-pad:56px; --rn-max:1320px;
  font-family:'Hanken Grotesk',system-ui,-apple-system,sans-serif;
  color:var(--rn-ink2); background:var(--rn-paper); line-height:1.5;
  -webkit-font-smoothing:antialiased; box-sizing:border-box; overflow:hidden;
}
.rnbp *,.rnbp *::before,.rnbp *::after{ box-sizing:border-box; }
.rnbp h1,.rnbp h2,.rnbp h3{ margin:0; }
.rnbp a{ color:inherit; text-decoration:none; }
.rnbp__sec{ max-width:var(--rn-max); margin:0 auto; padding:64px var(--rn-pad); }
.rnbp__eyebrow{ font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:.16em; color:var(--rn-terra); text-transform:uppercase; }
.rnbp__btn{ display:inline-block; font-size:15px; font-weight:700; padding:14px 24px; border-radius:4px; cursor:pointer; border:none; transition:transform .15s ease,filter .15s ease; }
.rnbp__btn:hover{ transform:translateY(-1px); filter:brightness(1.05); }
.rnbp__btn--terra{ background:var(--rn-terra); color:#fff; }
.rnbp__btn--dark{ background:var(--rn-ink2); color:#fff; }
.rnbp__h2{ font-family:'Archivo',sans-serif; font-weight:800; letter-spacing:-.03em; }

/* hero */
.rnbp__hero{ background:var(--rn-ink); color:var(--rn-paper); padding:56px var(--rn-pad) 64px; }
.rnbp__hero-in{ max-width:var(--rn-max); margin:0 auto; }
.rnbp__hero h1{ font-family:'Archivo',sans-serif; font-size:64px; font-weight:900; line-height:.95; letter-spacing:-.04em; margin:22px 0; max-width:820px; }
.rnbp__hero h1 em{ color:var(--rn-sand); font-style:normal; }
.rnbp__lead{ font-size:18px; line-height:1.55; color:#c8d2c8; margin:0; max-width:560px; }

/* contact grid */
.rnbp__contact{ display:grid; grid-template-columns:1fr 1.1fr; gap:60px; align-items:start; }
.rnbp__cinfo{ display:flex; flex-direction:column; }
.rnbp__crow{ padding:18px 0; border-bottom:1px solid var(--rn-line); }
.rnbp__crow:last-child{ border-bottom:none; }
.rnbp__clabel{ font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--rn-terra); margin-bottom:6px; }
.rnbp__cval{ font-size:17px; font-weight:600; color:var(--rn-ink2); }
.rnbp__cval a{ transition:color .15s ease; }
.rnbp__cval a:hover{ color:var(--rn-terra); }

/* form */
.rnbp__form{ background:var(--rn-paper2); border:1px solid var(--rn-line); border-radius:10px; padding:32px; display:grid; gap:16px; }
.rnbp__form-cols{ display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.rnbp__form-row{ display:grid; gap:6px; }
.rnbp__form-row label{ font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:var(--rn-muted); }
.rnbp__form input,.rnbp__form textarea,.rnbp__form select{ font:inherit; padding:12px 14px; border:1px solid var(--rn-line); border-radius:4px; background:#fff; color:var(--rn-ink2); }
.rnbp__form input:focus,.rnbp__form textarea:focus,.rnbp__form select:focus{ outline:2px solid var(--rn-terra); outline-offset:2px; border-color:var(--rn-terra); }
.rnbp__form textarea{ min-height:110px; resize:vertical; }
.rnbp__form button{ justify-self:start; margin-top:6px; }

/* cta */
.rnbp__cta{ background:var(--rn-terra); color:#fff; padding:64px var(--rn-pad); text-align:center; }
.rnbp__cta .rnbp__h2{ font-size:48px; font-weight:900; letter-spacing:-.035em; line-height:.98; margin-bottom:14px; }
.rnbp__cta .rnbp__h2 em{ color:var(--rn-ink2); font-style:normal; }
.rnbp__cta p{ font-size:17px; line-height:1.5; opacity:.92; max-width:560px; margin:0 auto 28px; }

@media (max-width:1100px){
  .rnbp__hero h1{ font-size:56px; }
}
@media (max-width:860px){
  .rnbp{ --rn-pad:28px; }
  .rnbp__hero h1{ font-size:42px; }
  .rnbp__contact{ grid-template-columns:1fr; gap:30px; }
  .rnbp__form{ padding:24px; }
  .rnbp__form-cols{ grid-template-columns:1fr; }
  .rnbp__cta .rnbp__h2{ font-size:34px; }
}
</style>

<div class="rnbp">

	<!-- HERO -->
	<section class="rnbp__hero">
		<div class="rnbp__hero-in">
			<div class="rnbp__eyebrow">Contact</div>
			<h1>Send your address.<br>Get <em>real numbers</em> back.</h1>
			<p class="rnbp__lead">Thirty-minute feasibility call. Free. You'll leave with what your lot allows, what it could generate, and what it would cost — concrete figures, not ranges.</p>
		</div>
	</section>

	<!-- CONTACT GRID -->
	<section class="rnbp__sec">
		<div class="rnbp__contact">

			<div class="rnbp__cinfo">
				<div class="rnbp__crow"><div class="rnbp__clabel">Email</div><div class="rnbp__cval"><a href="mailto:hello@rent-nova.com">hello@rent-nova.com</a></div></div>
				<div class="rnbp__crow"><div class="rnbp__clabel">Phone</div><div class="rnbp__cval"><a href="tel:+16479997433">647-999-7433</a></div></div>
				<div class="rnbp__crow"><div class="rnbp__clabel">Where</div><div class="rnbp__cval">Mississauga · GTA West</div></div>
				<div class="rnbp__crow"><div class="rnbp__clabel">Hours</div><div class="rnbp__cval">Mon–Fri · 9am–6pm ET</div></div>
				<div class="rnbp__crow"><div class="rnbp__clabel">Response</div><div class="rnbp__cval">Within one business day</div></div>
			</div>

			<form class="rnbp__form" method="post" action="#">
				<?php wp_nonce_field( 'rentnova_contact', 'rentnova_contact_nonce' ); ?>
				<input type="hidden" name="action" value="rentnova_contact" />
				<div class="rnbp__form-cols">
					<div class="rnbp__form-row"><label for="rnbp-name">Your name</label><input type="text" id="rnbp-name" name="rn_name" required autocomplete="name"></div>
					<div class="rnbp__form-row"><label for="rnbp-email">Email</label><input type="email" id="rnbp-email" name="rn_email" required autocomplete="email"></div>
				</div>
				<div class="rnbp__form-cols">
					<div class="rnbp__form-row"><label for="rnbp-phone">Phone (optional)</label><input type="tel" id="rnbp-phone" name="rn_phone" autocomplete="tel"></div>
					<div class="rnbp__form-row"><label for="rnbp-goal">What you're after</label><select id="rnbp-goal" name="rn_goal"><option value="convert">Convert my home</option><option value="manage">Manage an existing unit</option><option value="stay">Book a stay</option><option value="other">Something else</option></select></div>
				</div>
				<div class="rnbp__form-row"><label for="rnbp-address">Property address (optional)</label><input type="text" id="rnbp-address" name="rn_address" autocomplete="street-address" placeholder="Street, City, ON"></div>
				<div class="rnbp__form-row"><label for="rnbp-msg">Anything we should know</label><textarea id="rnbp-msg" name="rn_msg" rows="4" placeholder="Lot size, basement situation, timeline…"></textarea></div>
				<button type="submit" class="rnbp__btn rnbp__btn--terra">Send message</button>
			</form>

		</div>
	</section>

	<!-- CTA -->
	<section class="rnbp__cta">
		<h2 class="rnbp__h2">Prefer to read first?<br>See <em>finished homes</em>.</h2>
		<p>Browse the homes we converted and now run. Walk-throughs of the basement / main / garden split.</p>
		<a class="rnbp__btn rnbp__btn--dark" href="<?php echo esc_url( home_url( '/stays/' ) ); ?>">View finished homes →</a>
	</section>

</div>
<?php
get_footer();
