#!/usr/bin/env python3
"""Transform a staging course page (single wp:html block) into a PRODUCTION page
that does BOTH: preserves the live events-plugin registration (real cohort schedule
+ Eventbrite links via [wp_events]/[easy_events_calendar] shortcodes, which must
live in wp:shortcode blocks — they won't run inside wp:html) AND keeps the new
designed checkout + Eventbrite modal. Advisor CTAs route to the live HubSpot link.

Output: prod-<slug>.page.html  (multi-block Gutenberg content for pages.update)
"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
HUBSPOT = "https://meetings.hubspot.com/john2795"

def transform(code):
    pub = {c["code"]: c for c in json.load(open(os.path.join(HERE, "courses_publish.json")))}
    c = pub[code]
    cat = c["slug"]                       # events-plugin join key (verified: sa, rte)
    html = open(os.path.join(HERE, c["file"])).read()

    # advisor / consult CTAs -> live HubSpot booking link (was /services/)
    html = html.replace('href="/services/"', 'href="%s"' % HUBSPOT)

    # split the single wp:html block at the COHORTS section: drop the static design
    # cohorts and insert the real schedule as wp:shortcode blocks between two blocks.
    a = html.index("  <!-- COHORTS -->")
    b = html.index("  <!-- YOUR PATH -->")
    head = html[:a].rstrip()              # opening wp:html + style + hero/included/curriculum
    tail = html[b:]                        # path + enroll(checkout+EB) + faq + cta + scripts + /wp:html

    block1 = head + "\n</div>\n<!-- /wp:html -->"
    schedule = (
        '\n\n<!-- wp:html -->\n<div class="aa-rd"><section style="width:100%%;max-width:var(--aa-w,1340px);'
        'margin:0 auto;padding:84px 30px 0">'
        '<div class="mono" style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#127E88">'
        '( 03 ) — Upcoming cohorts</div>'
        '<h2 class="nr h2" style="font-weight:400;font-size:52px;line-height:1.02;letter-spacing:-.02em;'
        'color:#0E3A44;margin-top:14px">Pick a date.<br><span style="font-style:italic">Register your seat.</span></h2>'
        '<p style="font-size:15px;line-height:1.6;color:#5E7378;margin-top:12px;max-width:560px">'
        'Live virtual classes — register via Eventbrite from the schedule below, or '
        '<a href="%s" style="color:#127E88;font-weight:600">book a call</a> for group rates &amp; private cohorts.</p>'
        '</section></div>\n<!-- /wp:html -->\n\n'
        '<!-- wp:shortcode -->\n[wp_events category="%s" events_list layout="style4" col="1" posts_per_page="5"]\n<!-- /wp:shortcode -->\n\n'
        '<!-- wp:shortcode -->\n[easy_events_calendar category="%s"]\n<!-- /wp:shortcode -->\n\n'
        '<!-- wp:html -->\n<div class="aa-rd">\n  '
    ) % (HUBSPOT, cat, cat)

    out = block1 + schedule + tail
    return out, cat


def main():
    code = sys.argv[1] if len(sys.argv) > 1 else "SA"
    out, cat = transform(code)
    fn = os.path.join(HERE, "prod-%s.page.html" % code.lower())
    open(fn, "w").write(out)
    print("wrote %s (%d bytes) category=%s" % (os.path.basename(fn), len(out), cat))
    # sanity
    print("wp:html blocks:", out.count("<!-- wp:html -->"), "/ closes:", out.count("<!-- /wp:html -->"))
    print("wp:shortcode blocks:", out.count("<!-- wp:shortcode -->"))
    print("wp_events present:", "[wp_events" in out, "| easy_events_calendar:", "[easy_events_calendar" in out)
    print("hubspot links:", out.count(HUBSPOT), "| eventbrite script:", "eb_widgets.js" in out, "| checkout aa-self:", "aa-self" in out)
    print("schema ld+json:", "application/ld+json" in out, "| leftover /services/:", out.count('href="/services/"'))


if __name__ == "__main__":
    main()
