<?php
/**
 * ARCHIVE ONLY — DO NOT RE-ENABLE.
 *
 * WPCode snippet 427, "Report AI — AI News Aggregator (cron)".
 * Deactivated 8 September 2026. This snippet published ~600 posts built from
 * other publishers' RSS feeds (MIT Tech Review, OpenAI, arXiv, Google, IEEE,
 * BAIR). Each post was a 45-word excerpt of someone else's article plus a
 * source link, with rel=canonical pointing off-domain.
 *
 * That is the content-scraper signature corporate URL-filter vendors classify
 * on, and it is the reason report-ai.org is being blocked. The snippet body was
 * replaced in place with the one-shot cleanup routine; this file is the
 * original, kept only so we know what ran and what it stamped.
 *
 * Fingerprints it left on every post it created:
 *   post meta _rai_aggregated  = '1'
 *   post meta _rai_source_url  = <original article URL>
 *   category 10 ("News")
 */

function rai_news_feeds() {
    return array(
        'https://news.mit.edu/rss/topic/artificial-intelligence2',
        'https://bair.berkeley.edu/blog/feed.xml',
        'https://spectrum.ieee.org/feeds/topic/artificial-intelligence.rss',
        'http://export.arxiv.org/rss/cs.AI',
        'https://www.technologyreview.com/feed/',
        'https://blog.google/technology/ai/rss/',
        'https://openai.com/news/rss.xml',
    );
}

add_action('init', function () {
    if (! wp_next_scheduled('rai_pull_ai_news')) {
        wp_schedule_event(time() + 60, 'twicedaily', 'rai_pull_ai_news');
    }
});
add_action('rai_pull_ai_news', 'rai_pull_ai_news');

function rai_pull_ai_news($return_report = false) {
    if (! function_exists('fetch_feed')) { include_once ABSPATH . WPINC . '/feed.php'; }
    $news_cat = 10;
    $per_feed = 3;
    $report   = array();

    foreach (rai_news_feeds() as $url) {
        $feed = fetch_feed($url);
        if (is_wp_error($feed)) {
            $report[$url] = 'FEED ERROR: ' . $feed->get_error_message();
            error_log('[rai_news] ' . $url . ' :: ' . $feed->get_error_message());
            continue;
        }
        $source = $feed->get_title();
        $made = 0; $skipped = 0;
        $max  = $feed->get_item_quantity($per_feed);

        foreach ($feed->get_items(0, $max) as $item) {
            $link = esc_url_raw($item->get_permalink());
            if (! $link) { $skipped++; continue; }

            $dupe = get_posts(array('post_type'=>'post','post_status'=>'any',
                'meta_key'=>'_rai_source_url','meta_value'=>$link,'fields'=>'ids','numberposts'=>1));
            if ($dupe) { $skipped++; continue; }

            $title = sanitize_text_field($item->get_title());
            if (! $title) { $skipped++; continue; }
            $raw     = wp_strip_all_tags($item->get_description() ?: $item->get_content());
            $excerpt = wp_trim_words($raw, 45, '…');

            $body  = '<p>' . esc_html($excerpt) . '</p>';
            $body .= '<p><strong>Source:</strong> <a href="' . esc_url($link) . '" target="_blank" rel="noopener nofollow">'
                   . esc_html($source ?: 'Read the original article') . '</a></p>';
            $body .= '<p><em>Automatically aggregated summary — full article and all rights belong to the original publisher.</em></p>';

            $post_id = wp_insert_post(array(
                'post_title'=>$title, 'post_content'=>$body, 'post_excerpt'=>$excerpt,
                'post_status'=>'publish', 'post_author'=>1, 'post_category'=>array($news_cat),
                'post_date'=> ($item->get_date('Y-m-d H:i:s') ?: current_time('mysql')),
            ), true);

            if (is_wp_error($post_id)) { $report[$url . ' [insert]'] = $post_id->get_error_message(); continue; }
            update_post_meta($post_id, '_rai_source_url', $link);
            update_post_meta($post_id, '_rai_aggregated', '1');
            $made++;
        }
        $report[$url] = "OK — \"{$source}\" — created {$made}, skipped {$skipped}";
    }
    if ($return_report) { return $report; }
}

add_action('admin_post_rai_run_news', function () {
    if (! current_user_can('manage_options')) { wp_die('Not allowed.'); }
    echo '<h1>Report AI — news import report</h1><pre style="font-size:14px;">'
       . esc_html(print_r(rai_pull_ai_news(true), true)) . '</pre>';
    exit;
});

add_action('wp_head', function () {
    if (is_singular('post')) {
        $src = get_post_meta(get_the_ID(), '_rai_source_url', true);
        if ($src) { echo '<link rel="canonical" href="' . esc_url($src) . '" />' . "\n"; }
    }
}, 1);
add_filter('wpseo_canonical', function ($c) {
    if (is_singular('post')) { $s = get_post_meta(get_the_ID(),'_rai_source_url',true); if ($s) return $s; } return $c;
});
add_filter('rank_math/frontend/canonical', function ($c) {
    if (is_singular('post')) { $s = get_post_meta(get_the_ID(),'_rai_source_url',true); if ($s) return $s; } return $c;
});
