<?php
/**
 * Report AI — child theme functions.
 * Registers the `ai-statistic` custom post type and injects per-page
 * Dataset JSON-LD into <head> for LLM/GEO crawlers.
 *
 * Deploy as a block child theme of Twenty Twenty-Five (see DEPLOYMENT.md).
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/**
 * 1) Register the "AI Statistic" custom post type at /stats/.
 */
add_action( 'init', 'reportai_register_ai_statistic' );
function reportai_register_ai_statistic() {
	register_post_type( 'ai-statistic', array(
		'labels' => array(
			'name'          => 'AI Statistics',
			'singular_name' => 'AI Statistic',
			'add_new_item'  => 'Add New AI Statistic',
			'edit_item'     => 'Edit AI Statistic',
		),
		'public'       => true,
		'has_archive'  => true,
		'show_in_rest' => true,                       // Gutenberg + REST/MCP support
		'menu_icon'    => 'dashicons-chart-bar',
		'supports'     => array( 'title', 'editor', 'excerpt', 'author', 'thumbnail', 'custom-fields', 'revisions' ),
		'rewrite'      => array( 'slug' => 'stats', 'with_front' => false ),
	) );
}

/**
 * 2) Inject a Dataset JSON-LD block into <head> on every single ai-statistic page.
 *    Reads the post title/excerpt dynamically so each node is self-describing
 *    for Google and LLM crawlers (Gemini, ChatGPT, Perplexity).
 */
add_action( 'wp_head', 'reportai_inject_dataset_schema' );
function reportai_inject_dataset_schema() {
	if ( ! is_singular( 'ai-statistic' ) ) {
		return;
	}

	$schema = array(
		'@context'    => 'https://schema.org',
		'@type'       => 'Dataset',
		'name'        => get_the_title(),
		'description' => wp_strip_all_tags( get_the_excerpt() ),
		'url'         => get_permalink(),
		'datePublished' => get_the_date( 'c' ),
		'dateModified'  => get_the_modified_date( 'c' ),
		'isAccessibleForFree' => true,
		'creator'     => array(
			'@type' => 'Organization',
			'name'  => 'Report AI',
			'url'   => home_url( '/' ),
		),
		'publisher'   => array(
			'@type' => 'Organization',
			'name'  => 'Report AI',
			'url'   => home_url( '/' ),
		),
	);

	echo "\n<script type=\"application/ld+json\">"
		. wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE )
		. "</script>\n";
}
