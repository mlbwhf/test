<?php
/**
 * Report AI — [recent_reports] shortcode
 * Auto-lists the newest published reports/index pages, styled to match the
 * homepage "Popular reports" block. Add via Code Snippets or WPCode as a
 * PHP snippet (Run Everywhere / Auto Insert), then put [recent_reports]
 * where the static list currently is on the Home page.
 *
 * Usage:  [recent_reports count="5"]
 *
 * Note: this is "latest" (by publish date), not view-based "popular".
 * Scheduled/future posts don't appear until they go live. True
 * popularity-by-views would need a pageview source (MonsterInsights/Site Kit).
 */
add_shortcode('recent_reports', function ($atts) {
    $a = shortcode_atts(array('count' => 5), $atts);

    // Direct children of the Reports hub + the Indexes sub-hubs =
    // the actual report / statistics pages (not the hub landings themselves).
    $hub_ids = array(40, 498, 446, 392, 393, 394, 395, 362, 938, 930, 576);

    $q = new WP_Query(array(
        'post_type'        => 'page',
        'post_status'      => 'publish',
        'post_parent__in'  => $hub_ids,
        'posts_per_page'   => max(1, intval($a['count'])),
        'orderby'          => 'date',
        'order'            => 'DESC',
        'no_found_rows'    => true,
        'ignore_sticky_posts' => true,
    ));

    if (!$q->have_posts()) {
        return '';
    }

    $out = '<div style="display:flex;flex-direction:column;">';
    while ($q->have_posts()) {
        $q->the_post();
        $out .= '<a class="tai-rep" href="' . esc_url(get_permalink()) . '" '
              . 'style="text-decoration:none;color:#111114;padding:14px 0;border-top:1px solid #e6e6ea;display:flex;justify-content:space-between;gap:16px;">'
              . '<span class="tai-rep-t" style="font-size:14px;font-weight:600;">' . esc_html(get_the_title()) . '</span>'
              . '<span class="tai-mono" style="font-size:11px;color:#9a9aa2;white-space:nowrap;">' . esc_html(get_the_date('M j')) . '</span>'
              . '</a>';
    }
    $out .= '</div>';
    wp_reset_postdata();

    return $out;
});
