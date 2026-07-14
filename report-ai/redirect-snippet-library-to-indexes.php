<?php
/**
 * Report AI — 301 redirects: old /library/ URLs → /indexes/
 * WPCode: Add Snippet → PHP Snippet → Auto Insert (Run Everywhere) → Active.
 *
 * Why: Site Kit shows real sessions landing on 404s at old /library/ paths
 * (10 views on llm-market, 8 on ai-safety-governance in the last 28 days).
 * 301s recover that traffic and consolidate the SEO signals.
 */
add_action('template_redirect', function () {
    if (!is_404()) {
        return;
    }
    $path = strtok($_SERVER['REQUEST_URI'], '?');

    // 1) Known one-to-one mappings (checked 2026-07-14).
    $map = array(
        '/library/ai-economics/llm-market-statistics-2026'                    => '/indexes/ai-economics/llm-market-statistics-2026/',
        '/library/technical-benchmarks/ai-safety-governance-statistics-2026'  => '/indexes/technical-benchmarks/', // no 1:1 page; hub covers safety & governance
    );
    $trimmed = untrailingslashit($path);
    if (isset($map[$trimmed])) {
        wp_redirect(home_url($map[$trimmed]), 301);
        exit;
    }

    // 2) Generic: /library/<anything> — if a page with the same final slug
    //    exists, send visitors there; otherwise send them to the Indexes hub.
    if (preg_match('#^/library/(.+)$#', $trimmed, $m)) {
        $slug  = basename($m[1]);
        $pages = get_posts(array(
            'name'        => $slug,
            'post_type'   => 'page',
            'post_status' => 'publish',
            'numberposts' => 1,
        ));
        $target = $pages ? get_permalink($pages[0]) : home_url('/indexes/');
        wp_redirect($target, 301);
        exit;
    }
});
