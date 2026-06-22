<?php
/**
 * Template Name: Contact
 *
 * Contact page. Same hero + rn-section pattern as the Stays archive,
 * with a 2-col contact info / feasibility-form grid as the body.
 *
 * Activates automatically for a page with slug "contact", and is also
 * selectable on any page via Page Attributes -> Template -> Contact.
 *
 * @package rentnova
 */

get_header();
?>
<main id="content">

	<section class="rn-hero" style="padding-bottom:48px;">
		<div class="rn-hero__inner">
			<div class="rn-eyebrow" style="margin-bottom:22px;"><?php esc_html_e( 'Contact', 'rentnova' ); ?></div>
			<h1 style="font-size:64px;max-width:820px;"><?php
				echo wp_kses_post( __( 'Send your address.<br>Get <em>real numbers</em> back.', 'rentnova' ) );
			?></h1>
			<p class="rn-hero__lead" style="max-width:560px;"><?php esc_html_e( "Thirty-minute feasibility call. Free. You'll leave with what your lot allows, what it could generate, and what it would cost — concrete figures, not ranges.", 'rentnova' ); ?></p>
		</div>
	</section>

	<section class="rn-section">
		<div class="rn-contact">

			<div class="rn-contact__info">
				<div class="rn-contact__row">
					<div class="rn-contact__label"><?php esc_html_e( 'Email', 'rentnova' ); ?></div>
					<div class="rn-contact__val"><a href="mailto:hello@rent-nova.com">hello@rent-nova.com</a></div>
				</div>
				<div class="rn-contact__row">
					<div class="rn-contact__label"><?php esc_html_e( 'Phone', 'rentnova' ); ?></div>
					<div class="rn-contact__val"><a href="tel:+19055550143">+1 (905) 555-0143</a></div>
				</div>
				<div class="rn-contact__row">
					<div class="rn-contact__label"><?php esc_html_e( 'Where', 'rentnova' ); ?></div>
					<div class="rn-contact__val"><?php esc_html_e( 'Mississauga · GTA west', 'rentnova' ); ?></div>
				</div>
				<div class="rn-contact__row">
					<div class="rn-contact__label"><?php esc_html_e( 'Hours', 'rentnova' ); ?></div>
					<div class="rn-contact__val"><?php esc_html_e( 'Mon–Fri · 9am–6pm ET', 'rentnova' ); ?></div>
				</div>
				<div class="rn-contact__row">
					<div class="rn-contact__label"><?php esc_html_e( 'Response', 'rentnova' ); ?></div>
					<div class="rn-contact__val"><?php esc_html_e( 'Within one business day', 'rentnova' ); ?></div>
				</div>
			</div>

			<form class="rn-form" method="post" action="#">
				<?php wp_nonce_field( 'rentnova_contact', 'rentnova_contact_nonce' ); ?>
				<input type="hidden" name="action" value="rentnova_contact" />

				<div class="rn-form__cols">
					<div class="rn-form__row">
						<label for="rn-name"><?php esc_html_e( 'Your name', 'rentnova' ); ?></label>
						<input type="text" id="rn-name" name="rn_name" required autocomplete="name" />
					</div>
					<div class="rn-form__row">
						<label for="rn-email"><?php esc_html_e( 'Email', 'rentnova' ); ?></label>
						<input type="email" id="rn-email" name="rn_email" required autocomplete="email" />
					</div>
				</div>

				<div class="rn-form__cols">
					<div class="rn-form__row">
						<label for="rn-phone"><?php esc_html_e( 'Phone (optional)', 'rentnova' ); ?></label>
						<input type="tel" id="rn-phone" name="rn_phone" autocomplete="tel" />
					</div>
					<div class="rn-form__row">
						<label for="rn-goal"><?php esc_html_e( "What you're after", 'rentnova' ); ?></label>
						<select id="rn-goal" name="rn_goal">
							<option value="convert"><?php esc_html_e( 'Convert my home', 'rentnova' ); ?></option>
							<option value="manage"><?php esc_html_e( 'Manage an existing unit', 'rentnova' ); ?></option>
							<option value="stay"><?php esc_html_e( 'Book a stay', 'rentnova' ); ?></option>
							<option value="other"><?php esc_html_e( 'Something else', 'rentnova' ); ?></option>
						</select>
					</div>
				</div>

				<div class="rn-form__row">
					<label for="rn-address"><?php esc_html_e( 'Property address (optional)', 'rentnova' ); ?></label>
					<input type="text" id="rn-address" name="rn_address" autocomplete="street-address" placeholder="<?php esc_attr_e( 'Street, City, ON', 'rentnova' ); ?>" />
				</div>

				<div class="rn-form__row">
					<label for="rn-msg"><?php esc_html_e( 'Anything we should know', 'rentnova' ); ?></label>
					<textarea id="rn-msg" name="rn_msg" rows="4" placeholder="<?php esc_attr_e( 'Lot size, basement situation, timeline…', 'rentnova' ); ?>"></textarea>
				</div>

				<button type="submit" class="rn-btn rn-btn--terra"><?php esc_html_e( 'Send → book the call', 'rentnova' ); ?></button>
			</form>

		</div>
	</section>

	<section class="rn-cta">
		<h2 class="rn-h2"><?php
			echo wp_kses_post( __( 'Prefer to read first?<br>See <em>finished homes</em>.', 'rentnova' ) );
		?></h2>
		<p><?php esc_html_e( 'Browse the homes we converted and now run. Walk-throughs of the basement / main / garden split.', 'rentnova' ); ?></p>
		<a class="rn-btn rn-btn--dark" href="<?php echo esc_url( home_url( '/stays/' ) ); ?>"><?php esc_html_e( 'View finished homes →', 'rentnova' ); ?></a>
	</section>

</main>
<?php
get_footer();
