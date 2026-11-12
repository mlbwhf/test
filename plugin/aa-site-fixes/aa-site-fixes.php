<?php
/**
 * Plugin Name: AA — Site fixes
 * Description: Course-page badges, team training quote page and form, Training-menu NEW tags, contact-form spam gate and HubSpot relay, checkout guard, Pay gate, Gold-to-Platinum partner tier. Installed as a plugin because WPCode runs snippets from a preload copy that only its own editor refreshes.
 * Version:     2026.11.12.1
 * Author:      Agile Agilist
 * Requires PHP: 7.4
 *
 * Each part is a file in inc/ and stands alone. Remove a file (or deactivate
 * the plugin) and that fix is gone; nothing else on the site depends on it.
 * Every function is wrapped in function_exists() so a WPCode copy of the same
 * code cannot cause a redeclare fatal: whichever loads first wins, silently.
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'AA_SF_VERSION', '2026.11.12.1' );

require_once __DIR__ . '/inc/course-bar.php';
require_once __DIR__ . '/inc/menu-new.php';
require_once __DIR__ . '/inc/menu-landing.php';
require_once __DIR__ . '/inc/forms-guard.php';
require_once __DIR__ . '/inc/team-quote.php';
require_once __DIR__ . '/inc/checkout-guard.php';
require_once __DIR__ . '/inc/mail-reply-to.php';
require_once __DIR__ . '/inc/pay-gate.php';
require_once __DIR__ . '/inc/partner-tier.php';
