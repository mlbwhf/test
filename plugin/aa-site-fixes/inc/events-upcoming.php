<?php
/**
 * AA — /events/ shows only classes that start today or later
 *
 * The Events Calendar's list view shows every event that has not ENDED yet,
 * so a three- or four-day class that started yesterday (or last week) stays at
 * the top of /events/ until its last day. To a visitor that reads as a past
 * event, and it is no longer open for registration anyway.
 *
 * Here the list, month, day, photo and summary views only show events that
 * START today or later (site time zone). The "Previous events" link still
 * shows past events when someone asks for them.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

add_filter( 'tribe_events_views_v2_view_repository_args', function ( $args, $context = null, $view = null ) {
	if ( ! is_array( $args ) ) { return $args; }
	$slug = is_object( $view ) && method_exists( $view, 'get_slug' ) ? (string) $view->get_slug() : '';
	if ( $slug !== '' && ! in_array( $slug, array( 'list', 'month', 'day', 'photo', 'summary' ), true ) ) { return $args; }
	$mode = is_object( $context ) && method_exists( $context, 'get' ) ? (string) $context->get( 'event_display_mode', '' ) : '';
	if ( $mode === 'past' || ( isset( $args['past'] ) && $args['past'] ) ) { return $args; }   /* "Previous events" */
	try {
		$cut = new DateTime( 'today', wp_timezone() );
		$cut->modify( '-1 second' );
		$args['starts_after'] = $cut->format( 'Y-m-d H:i:s' );
	} catch ( Exception $e ) {}
	return $args;
}, 20, 3 );
