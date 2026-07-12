<?php
/**
 * Template Name: RentNova Home (Guest-facing)
 *
 * Drop-in guest-facing homepage — search / book above the fold with a
 * clearly-marked slot for the Lodgify booking-widget shortcode.
 * Featured stays, why-book-direct, "own a home like this?" band to
 * List With Us, and the compliance strip (STR license / MAT / insurance)
 * that Toronto STR rules require. Self-contained: all CSS scoped under
 * `.rnbp` and printed inline; no dependency on the active theme.
 *
 * HOW TO USE
 * 1. Copy this file into the active (or child) theme folder.
 * 2. Pages → Add New (title: "Home").
 * 3. Page Attributes → Template → "RentNova Home (Guest-facing)".
 * 4. Publish. Settings → Reading → static Home page → this page.
 *
 * BEFORE GO-LIVE (see RUNBOOK-golive.md):
 *  - Replace the [rentnova-search] block below with your actual
 *    Lodgify search shortcode (e.g. [lodgify-search-bar]).
 *  - Swap the hero image URL and stay cards for real listings.
 *  - Replace every occurrence of the token [STR-LICENSE] with the
 *    real Toronto STR licence number once issued.
 *  - Confirm the "$1M" and "6% MAT" numbers are still accurate.
 *
 * @package rentnova-dropin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// One place to edit compliance placeholders. Search RUNBOOK-golive.md for details.
$rn_str_license = '[STR-LICENSE]';   // Toronto STR licence (issued by City of Toronto).
$rn_mat_pct     = '6%';              // Ontario / Toronto Municipal Accommodation Tax.
$rn_insurance   = '$1M';             // Guest liability + property coverage per stay.
$rn_hero_img    = 'https://rent-nova.com/wp-content/uploads/2026/05/6019-featherhead-crescent-mississauga-W4633966-1.jpg';

get_header();
?>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800;900&family=Hanken+Grotesk:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">

<style>
/* ===== RentNova Home (guest) — scoped drop-in styles ===== */
.rnbp{
  width:100vw; position:relative; left:50%; right:50%;
  margin-left:-50vw; margin-right:-50vw;
  --rn-ink:#16241b; --rn-ink2:#1a1a17; --rn-paper:#f1efe8; --rn-paper2:#e9e5da;
  --rn-terra:#c45e35; --rn-sand:#e0a583; --rn-muted:#5a574c; --rn-line:#d8d3c5;
  --rn-mint:#8ba090; --rn-pad:56px; --rn-max:1320px;
  font-family:'Hanken Grotesk',system-ui,-apple-system,sans-serif;
  color:var(--rn-ink2); background:var(--rn-paper); line-height:1.5;
  -webkit-font-smoothing:antialiased; box-sizing:border-box;
}
.rnbp *,.rnbp *::before,.rnbp *::after{ box-sizing:border-box; }
.rnbp h1,.rnbp h2,.rnbp h3{ margin:0; }
.rnbp a{ color:inherit; text-decoration:none; }
.rnbp__sec{ max-width:var(--rn-max); margin:0 auto; padding:64px var(--rn-pad); }
.rnbp__eyebrow{ font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:.16em; color:var(--rn-sand); text-transform:uppercase; }
.rnbp__btn{ display:inline-block; font-size:15px; font-weight:700; padding:14px 24px; border-radius:4px; cursor:pointer; border:none; }
.rnbp__btn--terra{ background:var(--rn-terra); color:#fff; }
.rnbp__h2{ font-family:'Archivo',sans-serif; font-weight:800; letter-spacing:-.03em; font-size:44px; line-height:1; }

/* hero with search */
.rnbp__hero{ position:relative; color:var(--rn-paper); background-color:#0f1a13; background-size:cover; background-position:center; background-repeat:no-repeat; }
.rnbp__hero::before{ content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(15,26,19,0.35) 0%, rgba(15,26,19,0.72) 100%); }
.rnbp__hero-in{ position:relative; max-width:var(--rn-max); margin:0 auto; padding:80px var(--rn-pad) 60px; }
.rnbp__hero h1{ font-family:'Archivo',sans-serif; font-size:72px; font-weight:900; line-height:.95; letter-spacing:-.04em; margin:22px 0 20px; max-width:820px; color:#fff; }
.rnbp__hero h1 em{ color:var(--rn-sand); font-style:normal; }
.rnbp__lead{ font-size:19px; line-height:1.55; color:#e6ebe4; margin:0 0 40px; max-width:560px; }

/* search widget (fallback UI — replaced by Lodgify shortcode at deploy) */
.rnbp__search{ background:rgba(20,32,24,0.85); border:1px solid rgba(255,255,255,0.14); border-radius:8px; padding:14px; display:grid; grid-template-columns:1.4fr 1fr 1fr .9fr auto; gap:2px; max-width:960px; }
.rnbp__search label{ display:flex; flex-direction:column; padding:12px 16px; background:rgba(255,255,255,0.03); }
.rnbp__search span{ font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.16em; color:var(--rn-sand); text-transform:uppercase; margin-bottom:4px; }
.rnbp__search input, .rnbp__search select{ font:inherit; background:transparent; border:none; color:#fff; padding:0; font-size:15px; font-weight:600; }
.rnbp__search input:focus, .rnbp__search select:focus{ outline:none; }
.rnbp__search input::placeholder{ color:rgba(255,255,255,0.45); }
.rnbp__search option{ background:var(--rn-ink); color:#fff; }
.rnbp__search-btn{ background:var(--rn-terra); color:#fff; padding:0 28px; border-radius:4px; font-weight:700; font-size:15px; border:none; cursor:pointer; }

/* trust bar */
.rnbp__trust{ background:var(--rn-paper2); border-bottom:1px solid var(--rn-line); }
.rnbp__trust-in{ max-width:var(--rn-max); margin:0 auto; padding:16px var(--rn-pad); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; font-family:'IBM Plex Mono',monospace; font-size:11.5px; letter-spacing:.16em; color:var(--rn-muted); text-transform:uppercase; }
.rnbp__trust b{ color:var(--rn-terra); }

/* section head */
.rnbp__head{ display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:36px; gap:24px; }
.rnbp__note{ font-size:15px; color:var(--rn-muted); max-width:280px; text-align:right; margin:0; }

/* stays 3-col */
.rnbp__stays3{ display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.rnbp__stay{ border:1px solid var(--rn-line); border-radius:8px; overflow:hidden; background:#fff; transition:transform .18s ease,box-shadow .18s ease; }
.rnbp__stay:hover{ transform:translateY(-3px); box-shadow:0 12px 28px rgba(22,36,27,.12); }
.rnbp__stay img{ width:100%; height:220px; object-fit:cover; display:block; }
.rnbp__stay-body{ padding:22px; display:flex; justify-content:space-between; align-items:flex-end; gap:16px; }
.rnbp__stay-loc{ font-family:'IBM Plex Mono',monospace; font-size:11px; color:#8a8576; letter-spacing:.06em; text-transform:uppercase; margin-bottom:6px; }
.rnbp__stay-name{ font-size:22px; font-weight:800; }
.rnbp__stay-meta{ font-size:14px; color:var(--rn-muted); margin-top:4px; }
.rnbp__stay-price{ text-align:right; flex:none; }
.rnbp__stay-price b{ font-family:'Archivo',sans-serif; font-size:26px; font-weight:800; display:block; }
.rnbp__stay-price span{ font-size:11px; color:#8a8576; }

/* why direct */
.rnbp__why{ display:grid; grid-template-columns:repeat(3,1fr); border:1px solid var(--rn-line); border-radius:8px; overflow:hidden; background:#fff; }
.rnbp__why-c{ padding:32px; border-right:1px solid var(--rn-line); }
.rnbp__why-c:last-child{ border-right:none; }
.rnbp__why-no{ font-family:'IBM Plex Mono',monospace; font-size:11.5px; letter-spacing:.16em; color:var(--rn-terra); text-transform:uppercase; margin-bottom:16px; }
.rnbp__why-c h3{ font-family:'Archivo',sans-serif; font-size:22px; font-weight:800; letter-spacing:-.01em; margin:0 0 10px; }
.rnbp__why-c p{ font-size:15px; line-height:1.55; color:var(--rn-muted); margin:0; }

/* list-with-us band */
.rnbp__lwu{ max-width:calc(var(--rn-max) - var(--rn-pad)*2); margin:0 auto; background:var(--rn-ink); color:var(--rn-paper); border-radius:10px; padding:40px 44px; display:flex; justify-content:space-between; align-items:center; gap:32px; }
.rnbp__lwu-l{ font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:.16em; color:var(--rn-sand); text-transform:uppercase; margin-bottom:10px; }
.rnbp__lwu h3{ font-family:'Archivo',sans-serif; font-size:28px; font-weight:800; letter-spacing:-.02em; margin:0; line-height:1.05; }
.rnbp__lwu h3 em{ color:var(--rn-sand); font-style:normal; }
.rnbp__lwu p{ font-size:14.5px; color:#c8d2c8; margin:8px 0 0; max-width:520px; }

/* compliance strip */
.rnbp__comply{ background:var(--rn-paper2); border-top:1px solid var(--rn-line); border-bottom:1px solid var(--rn-line); }
.rnbp__comply-in{ max-width:var(--rn-max); margin:0 auto; padding:20px var(--rn-pad); display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.rnbp__comply-c strong{ display:block; font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.16em; color:var(--rn-terra); text-transform:uppercase; margin-bottom:4px; }
.rnbp__comply-c span{ font-size:13.5px; color:var(--rn-ink2); font-weight:600; }
.rnbp__comply-c mark{ background:none; color:var(--rn-muted); font-weight:400; }

@media (max-width:1100px){
  .rnbp__hero h1{ font-size:56px; }
  .rnbp__search{ grid-template-columns:1fr 1fr; }
  .rnbp__search-btn{ grid-column:1/-1; padding:14px 0; }
  .rnbp__stays3{ grid-template-columns:1fr 1fr; }
  .rnbp__stays3 > :nth-child(3){ display:none; }
}
@media (max-width:860px){
  .rnbp{ --rn-pad:28px; }
  .rnbp__hero-in{ padding:56px 28px; }
  .rnbp__hero h1{ font-size:40px; }
  .rnbp__search{ grid-template-columns:1fr; }
  .rnbp__stays3{ grid-template-columns:1fr; }
  .rnbp__why{ grid-template-columns:1fr; }
  .rnbp__why-c{ border-right:none; border-bottom:1px solid var(--rn-line); }
  .rnbp__why-c:last-child{ border-bottom:none; }
  .rnbp__lwu{ flex-direction:column; align-items:flex-start; padding:32px; }
  .rnbp__comply-in{ grid-template-columns:1fr; }
  .rnbp__h2{ font-size:32px; }
  .rnbp__head{ flex-direction:column; align-items:flex-start; }
  .rnbp__note{ text-align:left; }
}
</style>

<div class="rnbp">

	<!-- HERO with SEARCH -->
	<section class="rnbp__hero" style="background-image:url('<?php echo esc_url( $rn_hero_img ); ?>');">
		<div class="rnbp__hero-in">
			<div class="rnbp__eyebrow">Direct-book · Mississauga &amp; GTA</div>
			<h1>Stay in a home<br>we <em>built to be lived in</em>.</h1>
			<p class="rnbp__lead">Direct-book short stays around Mississauga, Oakville, Burlington, Hamilton and Milton. No platform fees, no surprise cleaning charges — just the key code and coffee in the cupboard.</p>

			<?php
			// ===== SEARCH WIDGET =====
			// After the Lodgify WP plugin is installed and connected, replace this
			// entire block with the Lodgify search shortcode, e.g.:
			//   echo do_shortcode( '[lodgify-search-bar]' );
			// The static markup below is a visual placeholder only — it does not
			// perform a real search.
			?>
			<form class="rnbp__search" method="get" action="#">
				<label><span>Where</span><input type="text" name="dest" placeholder="Mississauga, ON" value="Mississauga, ON"></label>
				<label><span>Check in</span><input type="date" name="in"></label>
				<label><span>Check out</span><input type="date" name="out"></label>
				<label><span>Guests</span><select name="guests"><option>1 guest</option><option>2 guests</option><option>3 guests</option><option>4 guests</option><option>5+ guests</option></select></label>
				<button type="submit" class="rnbp__search-btn">Search →</button>
			</form>
		</div>
	</section>

	<!-- TRUST BAR -->
	<div class="rnbp__trust">
		<div class="rnbp__trust-in">
			<span><b>✦</b> Book direct · no platform fees</span>
			<span><b>✦</b> Real hosts · local, on-call</span>
			<span><b>✦</b> Every stay insured to <?php echo esc_html( $rn_insurance ); ?></span>
			<span><b>✦</b> Licensed &amp; MAT-remitting operator</span>
		</div>
	</div>

	<!-- FEATURED STAYS -->
	<section class="rnbp__sec">
		<div class="rnbp__head">
			<h2 class="rnbp__h2">Homes ready to book.</h2>
			<p class="rnbp__note">Every home below is one we designed, furnished and now run.</p>
		</div>
		<?php
		// ===== FEATURED STAYS =====
		// If using rentnova-theme's Stays CPT: replace the hardcoded cards below
		// with a WP_Query loop over post_type='stay' (see rentnova-theme/front-page.php).
		?>
		<div class="rnbp__stays3">
			<a class="rnbp__stay" href="#"><img src="<?php echo esc_url( $rn_hero_img ); ?>" alt="The Two-Story Home" loading="lazy"><div class="rnbp__stay-body"><div><div class="rnbp__stay-loc">Erin Mills · Mississauga</div><div class="rnbp__stay-name">The Two-Story Home</div><div class="rnbp__stay-meta">4BR · Sleeps 6 · Min 15 nights</div></div><div class="rnbp__stay-price"><b>$167</b><span>/ night</span></div></div></a>
			<a class="rnbp__stay" href="#"><img src="https://rent-nova.com/wp-content/uploads/2026/05/Bedroom-1-scaled.jpg" alt="The Erin Mills Suite" loading="lazy"><div class="rnbp__stay-body"><div><div class="rnbp__stay-loc">Erin Mills · Mississauga</div><div class="rnbp__stay-name">The Erin Mills Suite</div><div class="rnbp__stay-meta">1BR · Sleeps 2 · Min 3 nights</div></div><div class="rnbp__stay-price"><b>$65</b><span>/ night</span></div></div></a>
			<a class="rnbp__stay" href="#"><img src="<?php echo esc_url( $rn_hero_img ); ?>" alt="The Garden Suite" loading="lazy"><div class="rnbp__stay-body"><div><div class="rnbp__stay-loc">Erin Mills · Mississauga</div><div class="rnbp__stay-name">The Garden Suite</div><div class="rnbp__stay-meta">1BR · Sleeps 2 · Min 2 nights</div></div><div class="rnbp__stay-price"><b>$89</b><span>/ night</span></div></div></a>
		</div>
	</section>

	<!-- WHY BOOK DIRECT -->
	<section class="rnbp__sec" style="padding-top:0;">
		<div class="rnbp__head">
			<h2 class="rnbp__h2">Why book direct.</h2>
			<p class="rnbp__note">The reason we built this instead of just running Airbnb listings.</p>
		</div>
		<div class="rnbp__why">
			<div class="rnbp__why-c">
				<div class="rnbp__why-no">01 — Cheaper</div>
				<h3>No platform fees</h3>
				<p>Airbnb and Booking.com typically add 14–20% on top of the nightly rate for guests. Booking direct with us skips it entirely.</p>
			</div>
			<div class="rnbp__why-c">
				<div class="rnbp__why-no">02 — Faster</div>
				<h3>Direct line to real humans</h3>
				<p>Text or call the same person who designed the unit. No shift-handoff, no chatbot triage, no "escalating your case."</p>
			</div>
			<div class="rnbp__why-c">
				<div class="rnbp__why-no">03 — Better</div>
				<h3>The stay we'd want</h3>
				<p>Real espresso, actual pillows, working heat. We stay in every unit ourselves before it goes live — and after.</p>
			</div>
		</div>
	</section>

	<!-- LIST WITH US BAND -->
	<section style="padding:0 var(--rn-pad) 64px;">
		<div class="rnbp__lwu">
			<div>
				<div class="rnbp__lwu-l">Own a home like these?</div>
				<h3>List your home.<br>Turn it into <em>legal income</em>.</h3>
				<p>We design, build, furnish, list and run legal short-stay units on your lot. One team, one contract, monthly statements.</p>
			</div>
			<a class="rnbp__btn rnbp__btn--terra" href="<?php echo esc_url( home_url( '/list-with-us/' ) ); ?>">List with us →</a>
		</div>
	</section>

	<!-- COMPLIANCE STRIP -->
	<div class="rnbp__comply">
		<div class="rnbp__comply-in">
			<div class="rnbp__comply-c">
				<strong>Toronto STR license</strong>
				<span>#<?php echo esc_html( $rn_str_license ); ?> · <mark>displayed on every stay confirmation</mark></span>
			</div>
			<div class="rnbp__comply-c">
				<strong>MAT included</strong>
				<span>Toronto Municipal Accommodation Tax (<?php echo esc_html( $rn_mat_pct ); ?>) already in the nightly rate — <mark>no surprise line item</mark></span>
			</div>
			<div class="rnbp__comply-c">
				<strong>Insured to <?php echo esc_html( $rn_insurance ); ?></strong>
				<span>Every guest stay covered by short-term rental liability + property insurance</span>
			</div>
		</div>
	</div>

</div>
<?php
get_footer();
