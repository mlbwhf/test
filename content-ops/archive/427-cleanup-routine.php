/**
 * Report AI — one-shot aggregated-content cleanup.
 *
 * Replaces the old news-aggregator body in snippet 427. Inert by default: it
 * does nothing at all unless option 'ra_cleanup_cmd' is set to 'audit' or
 * 'trash', and it clears that option before doing any work, so a fault can
 * never re-run on the next request.
 *
 * Target set = published posts carrying an aggregator fingerprint
 *   _rai_aggregated = '1'   OR   _rai_source_url <> ''
 * minus an explicit protect list of original Report AI writing.
 *
 * Posts are TRASHED, never force-deleted, so everything is recoverable.
 * Batched at 100 per run to stay inside the request timeout.
 */
add_action('init', function () {

    $cmd = get_option('ra_cleanup_cmd', '');
    if ($cmd !== 'audit' && $cmd !== 'trash') { return; }

    // Disarm first. If anything below fatals, it fatals once, not forever.
    update_option('ra_cleanup_cmd', '', false);

    global $wpdb;

    // Original Report AI essays and structural stubs — never touch these.
    $protect = array(20, 217, 218, 219, 220, 221);

    $matched = $wpdb->get_col(
        "SELECT DISTINCT p.ID
           FROM {$wpdb->posts} p
           JOIN {$wpdb->postmeta} m ON m.post_id = p.ID
          WHERE p.post_type   = 'post'
            AND p.post_status = 'publish'
            AND ( ( m.meta_key = '_rai_aggregated' AND m.meta_value = '1' )
               OR ( m.meta_key = '_rai_source_url' AND m.meta_value <> '' ) )
          ORDER BY p.ID ASC"
    );
    $matched = array_values(array_diff(array_map('intval', (array) $matched), $protect));

    // Published posts with no aggregator fingerprint — everything we keep.
    $keep = $wpdb->get_results(
        "SELECT p.ID, p.post_title, p.post_date
           FROM {$wpdb->posts} p
          WHERE p.post_type   = 'post'
            AND p.post_status = 'publish'
            AND p.ID NOT IN (
                  SELECT post_id FROM {$wpdb->postmeta}
                   WHERE meta_key IN ( '_rai_aggregated', '_rai_source_url' )
                     AND meta_value <> ''
                )
          ORDER BY p.ID ASC",
        ARRAY_A
    );

    $report = array(
        'ran_at'         => current_time('mysql'),
        'command'        => $cmd,
        'published_now'  => (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type='post' AND post_status='publish'"
        ),
        'matched_count'  => count($matched),
        'keep_count'     => count($keep),
        'keep_list'      => $keep,
        'protected'      => $protect,
    );

    if ($cmd === 'trash') {
        $batch    = array_slice($matched, 0, 100);
        $manifest = get_option('ra_cleanup_manifest', array());
        if (! is_array($manifest)) { $manifest = array(); }
        $done = 0;

        foreach ($batch as $id) {
            $p = get_post($id);
            if (! $p) { continue; }
            $manifest[] = array(
                'id'     => $id,
                'title'  => $p->post_title,
                'slug'   => $p->post_name,
                'source' => get_post_meta($id, '_rai_source_url', true),
            );
            if (wp_trash_post($id)) { $done++; }
        }

        update_option('ra_cleanup_manifest', $manifest, false);
        $report['trashed_this_run'] = $done;
        $report['remaining']        = max(0, count($matched) - $done);
        $report['manifest_total']   = count($manifest);
    }

    update_option('ra_cleanup_report', $report, false);
}, 999);
