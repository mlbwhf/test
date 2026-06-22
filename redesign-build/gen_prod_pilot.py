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
        '<!-- wp:html -->\n<div class="aa-rd"><section id="cohorts" style="width:100%;max-width:var(--aa-w,1340px);'
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


DEMAND_NAV_FN = (
    "  function addDemandNav(){\n"
    "    var nav=document.querySelector('.aa-rd .aa-coursebar .coh-hide');\n"
    "    if(!nav || document.getElementById('aa-nav-demand')) return;\n"
    "    var ref=nav.querySelector('a[href=\"#included\"]');\n"
    "    var a=document.createElement('a'); a.id='aa-nav-demand'; a.href='#demand'; a.className='lnk'; a.textContent='In demand';\n"
    "    if(ref ? ref.nextSibling : false){ nav.insertBefore(a, ref.nextSibling); } else { nav.appendChild(a); }\n"
    "  }\n"
)


HERO_FN = r'''  function heroUpcoming(){
    /* Fill the hero 'Next date' + 'Upcoming classes' list. Prefer real dates read
       from the live wp_events schedule on the page; if none are readable, compute
       the next Monday / Thursday / Saturday automatically so it is never empty and
       always advances over time. */
    var MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var MONF=['January','February','March','April','May','June','July','August','September','October','November','December'];
    var WD=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var CLASS_DAYS=[1,4,6];
    function computed(n){
      var out=[], base=new Date(); base.setHours(0,0,0,0);
      for(var s=1; (out.length<n)?(s<140):false; s++){
        var d=new Date(base.getTime()+s*86400000);
        if(CLASS_DAYS.indexOf(d.getDay())>=0){
          out.push({ mon:MON[d.getMonth()], day:String(d.getDate()),
            title:'Leading SAFe® (SA) — Live Virtual',
            when:WD[d.getDay()]+', '+d.getDate()+' '+MONF[d.getMonth()]+', 09:00 ET',
            href:'#cohorts' });
        }
      }
      return out;
    }
    function scraped(){
      var rows=document.querySelectorAll('.wpea_frontend_archive .archive-event'), out=[];
      for(var i=0;i<rows.length;i++){
        var ev=rows[i], mEl=ev.querySelector('.event_date .month'), dEl=ev.querySelector('.event_date .date');
        if(!mEl||!dEl) continue;
        var tEl=ev.querySelector('.event_title'), aEl=ev.querySelector('a.wpea-text-deco'), wEl=ev.querySelector('.widget_event_sdate');
        out.push({ mon:(mEl.textContent||'').trim(), day:(dEl.textContent||'').trim(),
          title:tEl?(tEl.textContent||'').trim():'', when:wEl?(wEl.textContent||'').replace(/\s+/g,' ').trim():'',
          href:aEl?aEl.getAttribute('href'):'#cohorts' });
      }
      return out;
    }
    var items=scraped(); if(!items.length) items=computed(4);
    if(!items.length) return;
    var spans=document.querySelectorAll('.aa-rd section .nr'), dateEl=null;
    for(var j=0;j<spans.length;j++){ if(spans[j].textContent.trim()==='Next date'){ dateEl=spans[j]; break; } }
    if(dateEl){ dateEl.textContent=items[0].mon+' '+items[0].day; }
    var host=document.getElementById('aa-upcoming');
    if(host){
      var esc=function(s){ var x=document.createElement('div'); x.textContent=s||''; return x.innerHTML; };
      var top=items.slice(0,3), html='<div class="aa-up-h">Upcoming classes</div>';
      for(var k=0;k<top.length;k++){
        var it=top[k];
        var ext=it.href ? (it.href.charAt(0)!=='#') : false;
        var o=it.href?('<a href="'+esc(it.href)+'"'+(ext?' target="_blank" rel="noopener"':'')+' '):'<div ';
        var c=it.href?'</a>':'</div>';
        html+=o+'class="aa-up-row">'
          +'<span class="aa-up-chip"><span class="aa-up-mon">'+esc(it.mon)+'</span><span class="aa-up-day">'+esc(it.day)+'</span></span>'
          +'<span class="aa-up-meta"><span class="aa-up-title">'+esc(it.title)+'</span><span class="aa-up-when">'+esc(it.when)+'</span></span>'
          +c;
      }
      host.innerHTML=html; host.style.display='block';
    }
  }
'''


def _stat(num, label):
    return (
        '<div style="padding:6px 0">'
        '<div class="nr" style="font-size:48px;line-height:1;color:#127E88">' + num + '</div>'
        '<div class="mono" style="font-size:11px;letter-spacing:.04em;color:#5E7378;margin-top:8px;text-transform:uppercase">' + label + '</div>'
        '</div>'
    )


def _pill(t):
    return '<span class="mono" style="font-size:12px;letter-spacing:.03em;color:#3C565E;border:1px solid #C7DEDE;padding:9px 14px;border-radius:2px">' + t + '</span>'


def build_demand_sa():
    """Job-demand / career-outcomes section, adapted from the old page into the
    new design language. Stats are the client's existing claims; salary is clearly
    flagged as role compensation, not course price."""
    stats = [
        _stat("70%", "of Fortune 500 use SAFe&reg;"),
        _stat("$148K", "Median role salary &middot; $130K&ndash;$158K US"),
        _stat("1.4M+", "Professionals SAFe-certified globally"),
        _stat("62%", "of Agile jobs prefer SAFe certification"),
        _stat("35%", "YoY job growth vs 14% IT average"),
        _stat("12K+", "Active listings &middot; US &amp; Canada"),
    ]
    pills = [_pill(t) for t in [
        "Transformation Leader", "Snr. Program Manager", "Head of PMO",
        "AVP Delivery", "Change Agent", "Consultant",
    ]]
    return (
        '<!-- IN DEMAND -->\n  <section id="demand" style="width:100%;max-width:var(--aa-w,1340px);margin:0 auto;padding:84px 30px 0">\n'
        '    <div style="padding-bottom:30px;border-bottom:1px solid #0E3A44">\n'
        '      <div class="mono" style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#127E88">Career outcomes &mdash; in demand</div>\n'
        '      <h2 class="nr h2" style="font-weight:400;font-size:52px;line-height:1.02;letter-spacing:-.02em;color:#0E3A44;margin-top:14px">SAFe Agilists are in <span style="font-style:italic">massive demand.</span></h2>\n'
        '    </div>\n'
        '    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:30px 24px;margin-top:34px">' + ''.join(stats) + '</div>\n'
        '    <div class="mono" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#88A0A4;margin-top:46px;margin-bottom:14px">Roles you&#39;ll qualify for</div>\n'
        '    <div style="display:flex;flex-wrap:wrap;gap:9px">' + ''.join(pills) + '</div>\n'
        '    <p style="font-size:12px;color:#9AB0B4;margin-top:20px">Salary figures reflect typical role compensation in the US &mdash; not the course price. Sources: Scaled Agile &amp; public job-market data.</p>\n'
        '  </section>'
    )


def _faq(q, a):
    return (
        '<details style="border-bottom:1px solid #DCEAEA">'
        '<summary class="nr" style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 4px;font-style:italic;font-weight:400;font-size:19px;color:#0E3A44">' + q +
        '<span class="faq-plus" style="font-size:22px;color:#127E88;transition:transform .2s;flex:none">+</span></summary>'
        '<p style="font-size:14px;line-height:1.6;color:#5E7378;padding:0 4px 20px">' + a + '</p></details>'
    )


def build_faq_sa():
    """Two-column FAQ in the new design language, expanded to 12 questions."""
    left = [
        _faq("What&#39;s the real-world value of becoming a SAFe Agilist?", "Leading SAFe is the credential leaders use to drive a Lean-Agile transformation. It signals you can align teams around a shared way of working &mdash; and it opens roles like Transformation Leader, Program Manager, and Change Agent."),
        _faq("What&#39;s included in the Agilist course tuition?", "The live 2-day course, the official SA exam, one year of SAFe Studio, the digital workbook, our Fast-Pass study kit, recordings for life, and a 1:1 career-coaching session. No hidden fees."),
        _faq("What are the prerequisites for SAFe Agilist certification?", "None. The course suits executives, managers, and change agents leading an Agile transformation &mdash; no prior SAFe experience required."),
        _faq("Is the SAFe Agilist certification worth the investment?", "Yes &mdash; SAFe Agilist is one of the most in-demand Agile credentials, with strong salary and role growth (see the demand stats above). Your first exam attempt and a money-back pass guarantee are included."),
        _faq("How is this course delivered?", "Fully live and instructor-led in a virtual classroom with an authorised SAFe instructor (SPC/ASPC). You also keep the session recordings forever."),
        _faq("What&#39;s the exam format?", "45 multiple-choice questions, 90 minutes, passing at 35/45 (77%). Taken online within 30 days of class; your first attempt is included."),
    ]
    right = [
        _faq("What if I don&#39;t pass the exam on the first attempt?", "Retake the next cohort free, or get a full refund &mdash; your choice. Most students pass first time with our Fast-Pass study kit."),
        _faq("How long is the certification valid?", "The SAFe Agilist certification is valid for one year and renewable through SAFe Studio."),
        _faq("Can I get a refund if my plans change?", "Yes &mdash; plans change. Contact us before class for a full refund or to transfer to a later cohort. See our guarantee for details."),
        _faq("Do you offer group or corporate discounts?", "Yes. We offer group pricing for teams of five or more and private cohorts on your schedule. Request a group quote at checkout or talk to an advisor."),
        _faq("Is SAFe Agilist training &amp; certification available in other languages?", "Yes &mdash; training and the exam are available in multiple languages. Ask us about availability for your preferred language and timezone."),
        _faq("Who teaches the course?", "Authorised SAFe instructors (SPC/ASPC) with real transformation experience &mdash; not generalist trainers."),
    ]
    return (
        '<!-- FAQ -->\n  <section id="faq" style="width:100%;max-width:1100px;margin:0 auto;padding:88px 30px 0">\n'
        '    <h2 class="nr" style="font-weight:400;font-size:44px;line-height:1.04;letter-spacing:-.02em;color:#0E3A44;text-align:center">Frequently asked questions</h2>\n'
        '    <p style="text-align:center;font-style:italic;color:#88A0A4;margin-top:8px">Click any question to expand the answer.</p>\n'
        '    <div class="g2" style="display:grid;grid-template-columns:1fr 1fr;gap:0 48px;margin-top:30px">\n'
        '      <div style="border-top:1px solid #0E3A44">' + ''.join(left) + '</div>\n'
        '      <div style="border-top:1px solid #0E3A44">' + ''.join(right) + '</div>\n'
        '    </div>\n  </section>'
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

    i_cta = html.index("  <!-- FINAL CTA -->")
    i_scripts = html.index('<script src="https://www.eventbrite.com')
    cta = html[i_cta:i_scripts]
    scripts = html[i_scripts:]
    scripts = scripts.replace("  function init(){", DEMAND_NAV_FN + HERO_FN + "  function init(){")
    scripts = scripts.replace(
        "    setHeaderOffset();\n    window.addEventListener('resize',setHeaderOffset);",
        "    setHeaderOffset();\n    addDemandNav();\n    heroUpcoming();\n    window.addEventListener('resize',setHeaderOffset);")

    block_head = html[:i_coh].rstrip() + "\n</div>\n<!-- /wp:html -->"
    block_demand = wrap_html(build_demand_sa())
    block_sched = schedule_blocks(cat)
    block_path = wrap_html(build_path_sa())
    block_enroll = wrap_html(enroll_design(html[i_enroll:i_faq]))
    block_form = '<!-- wp:shortcode -->\n[fluentform id="%s"]\n<!-- /wp:shortcode -->' % fluent_id
    block_faq = '<!-- wp:html -->\n<div class="aa-rd">\n  ' + build_faq_sa() + '\n\n  ' + cta + scripts

    return "\n\n".join([block_head, block_demand, block_sched, block_path, block_enroll, block_form, block_faq]), cat


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
