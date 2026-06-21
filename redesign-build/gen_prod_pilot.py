#!/usr/bin/env python3
"""Transform a staging course page (single wp:html design block) into the PRODUCTION
page. Does ALL of:
  - preserves live registration: real [wp_events]/[easy_events_calendar] cohort
    schedule (in wp:shortcode blocks so they execute; they won't run inside wp:html)
  - embeds the real Fluent Form ([fluentform id=N]) inline as the native checkout,
    framed by a designed intro + static "what's included / guarantee" panel
  - wires the Eventbrite modal to the live event id
  - routes advisor CTAs to the live HubSpot booking link
  - sticky course bar offsets below the theme header (handled in the template JS)

Output: prod-<slug>.page.html  (multi-block Gutenberg content for pages.update)
"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
HUBSPOT = "https://meetings.hubspot.com/john2795"


def wrap_html(inner):
    return '<!-- wp:html -->\n<div class="aa-rd">\n' + inner.strip() + '\n</div>\n<!-- /wp:html -->'


def schedule_blocks(cat):
    intro = (
        '<!-- wp:html -->\n<div class="aa-rd"><section style="width:100%;max-width:var(--aa-w,1340px);'
        'margin:0 auto;padding:84px 30px 0">'
        '<div class="mono" style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#127E88">'
        '( 03 ) — Upcoming cohorts</div>'
        '<h2 class="nr h2" style="font-weight:400;font-size:52px;line-height:1.02;letter-spacing:-.02em;'
        'color:#0E3A44;margin-top:14px">Pick a date.<br><span style="font-style:italic">Register your seat.</span></h2>'
        '<p style="font-size:15px;line-height:1.6;color:#5E7378;margin-top:12px;max-width:560px">'
        'Live virtual classes — register via Eventbrite from the schedule below, or '
        '<a href="' + HUBSPOT + '" style="color:#127E88;font-weight:600">book a call</a> for group rates &amp; private cohorts.</p>'
        '</section></div>\n<!-- /wp:html -->'
    )
    s1 = '<!-- wp:shortcode -->\n[wp_events category="' + cat + '" events_list layout="style4" col="1" posts_per_page="5"]\n<!-- /wp:shortcode -->'
    s2 = '<!-- wp:shortcode -->\n[easy_events_calendar category="' + cat + '"]\n<!-- /wp:shortcode -->'
    return "\n\n".join([intro, s1, s2])


GREEN = 'color:#1F8A5B;font-weight:600'
ROW = 'display:flex;align-items:center;justify-content:space-between;font-size:14.5px;color:#3C565E'

def enroll_design(enroll):
    """Keep the designed enroll intro; replace the mock form card + dynamic order
    summary with a static included/guarantee panel and a heading; the real Fluent
    Form renders in the wp:shortcode block immediately after this block."""
    intro = enroll[:enroll.index('<div class="g2"')].rstrip()   # section open + intro div (eb-trigger-2 kept)
    panel = (
        '\n    <div class="g2" style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:36px;align-items:start">'
        '\n      <div style="border:1px solid #DCEAEA;background:#fff;padding:24px 26px">'
        '<span class="mono" style="font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:#88A0A4">What\'s included</span>'
        '<div style="margin-top:14px;display:flex;flex-direction:column;gap:11px">'
        '<div style="' + ROW + '"><span>Live 2-day course</span><span style="' + GREEN + '">Included</span></div>'
        '<div style="' + ROW + '"><span>Official exam &amp; certification</span><span style="' + GREEN + '">Included</span></div>'
        '<div style="' + ROW + '"><span>SAFe Studio (1 yr)</span><span style="' + GREEN + '">Included</span></div>'
        '<div style="' + ROW + '"><span>Career coaching</span><span style="' + GREEN + '">Included</span></div>'
        '</div>'
        '<p class="mono" style="margin-top:16px;font-size:11px;letter-spacing:.03em;color:#9AB0B4">Tuition &amp; secure payment are shown in the registration below.</p>'
        '</div>'
        '\n      <div style="border:1px solid #DCEAEA;background:#F1F8F8;padding:24px 26px">'
        '<div style="display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;color:#0E3A44"><span style="color:#1F8A5B">&#10022;</span>Money-back pass guarantee</div>'
        '<p style="font-size:13px;line-height:1.55;color:#5E7378;margin-top:9px">Don\'t pass on your first attempt? Retake the next cohort free &mdash; or get a full refund. No questions.</p>'
        '<div style="margin-top:16px;display:flex;align-items:center;gap:10px;font-size:14px;font-weight:600;color:#0E3A44"><span style="color:#127E88">&#9211;</span>Instant confirmation</div>'
        '<p style="font-size:13px;line-height:1.55;color:#5E7378;margin-top:9px">Ticket, invoice, and SAFe Studio access land in your inbox right after you register.</p>'
        '</div>'
        '\n    </div>'
        '\n    <h3 class="nr" style="font-style:italic;font-weight:400;font-size:26px;color:#0E3A44;margin-top:40px">Your details &mdash; register &amp; pay below &#8595;</h3>'
        '\n  </section>'
    )
    return intro + panel


def _card(b, cat, title, desc, url, accent="#C7DEDE"):
    return (
        '<a href="' + url + '" class="path-card" style="border:1px solid ' + accent + ';background:#fff;padding:22px 24px;display:flex;flex-direction:column;transition:border-color .16s">'
        '<div style="display:flex;align-items:center;gap:11px">'
        '<span class="badge badge-sm" aria-hidden="true"><b>' + b + '</b><i>CERT</i></span>'
        '<span class="mono" style="font-size:10.5px;letter-spacing:.05em;text-transform:uppercase;color:#88A0A4">' + cat + '</span>'
        '</div>'
        '<h3 class="nr" style="font-weight:400;font-size:22px;color:#0E3A44;margin-top:15px">' + title + '</h3>'
        '<p style="font-size:13.5px;line-height:1.55;color:#5E7378;margin-top:8px;flex:1">' + desc + '</p>'
        '<span style="font-size:13px;font-weight:600;color:#127E88;margin-top:16px">View course &#10230;</span>'
        '</a>'
    )


def _group(label, cards, minw="270px"):
    return (
        '<div class="mono" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#127E88;margin-top:44px;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #DCEAEA">' + label + '</div>'
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(' + minw + ',1fr));gap:16px">' + ''.join(cards) + '</div>'
    )


def build_path_sa():
    """SA career-path navigation: variations of Leading SAFe, same-category SAFe
    roles, and the advanced leadership next steps. URLs verified against the live
    site. Replaces the generic 14-badge map + off-path AI-Native card."""
    g1 = _group("Variations of Leading SAFe &mdash; same SA cert, specialised context", [
        _card("SA", "Government", "Leading SAFe for Government", "The SAFe Agilist course tailored to public-sector programs, compliance, and government delivery.", "/training/safe-industry/sa-gov/", "#BCE0E5"),
        _card("SA", "Hardware", "SAFe for Hardware", "Lean-Agile leadership applied to cyber-physical and hardware-intensive systems.", "/training/safe-industry/safe-for-hardware/", "#BCE0E5"),
    ], "330px")
    g2 = _group("More SAFe role certifications &mdash; same category", [
        _card("SSM", "SAFe role", "SAFe Scrum Master", "Facilitate Agile teams and the key events of an Agile Release Train.", "/training/safe/scrum-master/"),
        _card("POPM", "SAFe role", "Product Owner / Manager", "Deliver value through the Continuous Delivery Pipeline as a PO/PM.", "/training/safe/popm/"),
        _card("SASM", "SAFe role", "Advanced Scrum Master", "Coach Agile teams to excel across a SAFe enterprise.", "/training/safe/asm/"),
        _card("SDP", "SAFe role", "SAFe DevOps", "Build a continuous delivery pipeline and a DevOps culture.", "/training/safe/devops/"),
    ])
    g3 = _group("Advance your leadership path &mdash; next steps", [
        _card("SPC", "Advanced", "Implementing SAFe", "Become the change agent who can teach SAFe and launch Agile Release Trains.", "/training/adv-safe/spc/"),
        _card("LPM", "Advanced", "Lean Portfolio Management", "Connect strategy to execution with Lean budgeting and portfolio flow.", "/training/adv-safe/lpm/"),
        _card("APM", "Advanced", "Agile Product Management", "Design and deliver products with Design Thinking and customer centricity.", "/training/adv-safe/apm/"),
        _card("ARCH", "Advanced", "SAFe for Architects", "Lead architecture across Agile Release Trains and value streams.", "/training/safe-industry/arch/"),
        _card("ASPC", "Advanced", "Advanced Practice Consultant", "The senior SAFe consultant credential, beyond SPC.", "/training/adv-safe/aspc/"),
    ])
    return (
        '<!-- YOUR PATH -->\n  <section id="path" style="width:100%;max-width:var(--aa-w,1340px);margin:0 auto;padding:84px 30px 0">\n'
        '    <div class="mono" style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#127E88">( 04 ) — Where this leads</div>\n'
        '    <h2 class="nr h2" style="font-weight:400;font-size:52px;line-height:1.02;letter-spacing:-.02em;color:#0E3A44;margin-top:14px;max-width:760px">Your SAFe <span style="font-style:italic">career path.</span></h2>\n'
        '    <p style="font-size:15px;line-height:1.6;color:#5E7378;margin-top:12px;max-width:620px">Leading SAFe is your foundation. Specialise by industry, round out the core SAFe roles, or advance into portfolio, product, and consulting credentials.</p>\n'
        '    ' + g1 + '\n    ' + g2 + '\n    ' + g3 + '\n'
        '  </section>'
    )


def transform(code, fluent_id, eb_event_id):
    pub = {c["code"]: c for c in json.load(open(os.path.join(HERE, "courses_publish.json")))}
    c = pub[code]
    cat = c["slug"]
    html = open(os.path.join(HERE, c["file"])).read()
    html = html.replace('href="/services/"', 'href="%s"' % HUBSPOT)
    html = html.replace("REPLACE_WITH_EVENTBRITE_EVENT_ID", eb_event_id)

    i_coh = html.index("  <!-- COHORTS -->")
    i_path = html.index("  <!-- YOUR PATH -->")
    i_enroll = html.index("  <!-- ENROLL / CHECKOUT -->")
    i_faq = html.index("  <!-- FAQ -->")

    block_head = html[:i_coh].rstrip() + "\n</div>\n<!-- /wp:html -->"
    block_sched = schedule_blocks(cat)
    block_path = wrap_html(build_path_sa())
    block_enroll = wrap_html(enroll_design(html[i_enroll:i_faq]))
    block_form = '<!-- wp:shortcode -->\n[fluentform id="%s"]\n<!-- /wp:shortcode -->' % fluent_id
    block_faq = '<!-- wp:html -->\n<div class="aa-rd">\n' + html[i_faq:]

    return "\n\n".join([block_head, block_sched, block_path, block_enroll, block_form, block_faq]), cat


def main():
    code = sys.argv[1] if len(sys.argv) > 1 else "SA"
    fluent_id = sys.argv[2] if len(sys.argv) > 2 else "3"
    eb_event_id = sys.argv[3] if len(sys.argv) > 3 else "1988473663255"
    out, cat = transform(code, fluent_id, eb_event_id)
    fn = os.path.join(HERE, "prod-%s.page.html" % code.lower())
    open(fn, "w").write(out)
    print("wrote %s (%d bytes) category=%s fluent=%s eb=%s" % (os.path.basename(fn), len(out), cat, fluent_id, eb_event_id))
    print("wp:html open/close:", out.count("<!-- wp:html -->"), "/", out.count("<!-- /wp:html -->"))
    print("wp:shortcode open/close:", out.count("<!-- wp:shortcode -->"), "/", out.count("<!-- /wp:shortcode -->"))
    print("wp_events:", "[wp_events" in out, "| easy_events_calendar:", "[easy_events_calendar" in out, "| fluentform:", ('[fluentform id="%s"]' % fluent_id) in out)
    print("EB live id:", eb_event_id in out, "| placeholder gone:", "REPLACE_WITH_EVENTBRITE" not in out)
    print("hubspot:", out.count(HUBSPOT), "| sticky offset:", "--aa-top" in out, "| header JS:", "setHeaderOffset" in out)
    print("leftover /services/:", out.count('href="/services/"'), "| mock form gone (aa-qty-sum):", out.count("aa-qty-sum"))


if __name__ == "__main__":
    main()
