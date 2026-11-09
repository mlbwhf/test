<?php
/**
 * AA — Replies to registration emails go to info@
 *
 * The register's confirmation and reschedule emails set Reply-To to the
 * WordPress admin email, which is a personal inbox. A buyer who replied to
 * her confirmation on 9 Nov 2026 to fix her name reached that inbox instead
 * of info@. The register exposes a filter for exactly this; it is set here.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

add_filter( 'aa_reg_confirmation_reply_to', function () {
	return 'info@agile-agilist.com';
}, 20 );
