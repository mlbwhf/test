<?php
/**
 * AA — Clear the page cache when the date changes
 *
 * Course pages are served from the page cache with the class dates printed in
 * them. Nothing cleared that cache when a day ended, so a page cached on the
 * 21st still offered the class of the 21st on the 22nd. The checkout rightly
 * refuses a class that has started ("That batch is not available"), and the
 * buyer is left at a Pay button that cannot work. That happened on
 * 22 Nov 2026 with AI-Native Foundations, 21 Nov.
 *
 * The cache is now cleared once a day, a few minutes after midnight Eastern,
 * so every page is rebuilt with the dates that are still open. The checkout is
 * not touched. The next run is scheduled from local midnight each time, so the
 * clock change does not move it to before midnight.
 *
 * A class also stops being sold at 3 PM Eastern on the day it starts (the rule
 * is in the register code, aa_reg_closed_for_sale()). The cache is cleared a
 * second time just after 3 PM so that class leaves the pages at that moment
 * and not at midnight.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }
if ( ! function_exists( 'aa_sf_cm_next' ) ) :

function aa_sf_cm_next() {
	$d = new DateTime( 'tomorrow', new DateTimeZone( 'America/New_York' ) );
	$d->setTime( 0, 7 );
	return $d->getTimestamp();
}

/** The next 3:02 PM Eastern: today's if it has not passed, otherwise tomorrow's. */
function aa_sf_cm_next_close() {
	$tz = new DateTimeZone( 'America/New_York' );
	$d  = new DateTime( 'now', $tz );
	$d->setTime( 15, 2 );
	if ( $d->getTimestamp() <= time() ) { $d->modify( '+1 day' ); $d->setTime( 15, 2 ); }
	return $d->getTimestamp();
}

add_action( 'init', function () {
	if ( ! wp_next_scheduled( 'aa_sf_midnight_purge' ) ) { wp_schedule_single_event( aa_sf_cm_next(), 'aa_sf_midnight_purge' ); }
	if ( ! wp_next_scheduled( 'aa_sf_close_purge' ) ) { wp_schedule_single_event( aa_sf_cm_next_close(), 'aa_sf_close_purge' ); }
} );

add_action( 'aa_sf_close_purge', function () {
	do_action( 'litespeed_purge_all' );
	if ( function_exists( 'aa_mm_flush' ) ) { aa_mm_flush(); }
	update_option( 'aa_sf_close_purged', current_time( 'mysql' ), false );
	if ( ! wp_next_scheduled( 'aa_sf_close_purge' ) ) { wp_schedule_single_event( aa_sf_cm_next_close(), 'aa_sf_close_purge' ); }
} );

add_action( 'aa_sf_midnight_purge', function () {
	do_action( 'litespeed_purge_all' );
	if ( function_exists( 'aa_mm_flush' ) ) { aa_mm_flush(); }
	update_option( 'aa_sf_midnight_purged', current_time( 'mysql' ), false );
	if ( ! wp_next_scheduled( 'aa_sf_midnight_purge' ) ) { wp_schedule_single_event( aa_sf_cm_next(), 'aa_sf_midnight_purge' ); }
} );

endif;
