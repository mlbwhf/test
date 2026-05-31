#!/usr/bin/env python3
import re, sys

# Per-page jump menus from the approved table: id -> (eyebrow_fallback, [ (num,name,tag,href) ])
MENUS = {
    39: [("01","Why You","When consulting fits","#why"),
         ("02","3 Tiers","Coached → Co-Delivered → Full","#tiers"),
         ("03","Delivery Rhythm","Discover → Mutate","#rhythm"),
         ("04","SPCT Lead","Practice anchor","#spct"),
         ("05","FAQ","Buyer questions","#faq")],
    40: [("01","5 Phases","Assess → Mutate","#phases"),
         ("02","3 Models","DIY → Coached → Delivered","#models"),
         ("03","Milestones","90/180/365","#milestones"),
         ("04","Free Assessment","Start here","#assess")],
    41: [("01","Plus the Framework","What's different","#plus"),
         ("02","4 Days","Curriculum","#days"),
         ("03","Outcomes","What you walk out with","#outcomes"),
         ("04","FAQ","Common questions","#faq"),
         ("05","Enroll","Reserve a seat","#enroll")],
    42: [("01","Who For","Eligibility","#who"),
         ("02","D3/D4/D5","Advanced dims","#dims"),
         ("03","90-Day Cadence","How it runs","#cadence"),
         ("04","Enterprise","Private cohort","#enterprise"),
         ("05","FAQ","Common questions","#faq")],
    86: [("01","3 Tracks","Foundations · Change · Exec","#tracks"),
         ("02","6 Modules","Curriculum","#modules"),
         ("03","90-Day Cadence","How it runs","#cadence"),
         ("04","Enterprise","Private cohort","#enterprise"),
         ("05","FAQ","Common questions","#faq")],
    88: [("01","4 Tracks","Practitioner · Leader · Master · Coach","#tracks"),
         ("02","5 Dimensions","Strategy → Metrics","#dimensions"),
         ("03","Curriculum","5 modules","#modules"),
         ("04","90-Day Cadence","How it runs","#cadence"),
         ("05","FAQ","Common questions","#faq")],
    90: [("01","4 Paths","SPC · ASPC · AI-Native · Innovation","#paths"),
         ("02","Compare","Side-by-side table","#compare"),
         ("03","Path Call","Talk it through","#call")],
    121:[("01","6 Phases","Prepare → Innovate","#phases"),
         ("02","Enablers","5 transformation enablers","#enablers"),
         ("03","Foundation Layers","Team → Enterprise","#layers"),
         ("04","Outcomes","Business results","#outcomes")],
}

# border color cycle + matching badge tints
CYCLE = [("#22D3EE","rgba(34,211,238,.12)","#22D3EE"),
         ("#84CC16","rgba(132,204,22,.12)","#84CC16"),
         ("#06B6D4","rgba(6,182,212,.12)","#06B6D4"),
         ("#A3E635","rgba(163,230,53,.12)","#A3E635")]

def color(i):
    return CYCLE[i % len(CYCLE)]

def build_menu(items):
    out = []
    for i,(num,name,tag,href) in enumerate(items):
        border,bbg,btext = color(i)
        out.append(f'''    <a href="{href}" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:transparent;border:1px solid rgba(255,255,255,.08);border-left:3px solid {border};border-radius:6px;text-decoration:none;transition:all .2s">
      <span style="flex-shrink:0;width:32px;height:32px;border-radius:6px;background:{bbg};color:{btext};font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">{num}</span>
      <span style="flex:1;min-width:0">
        <span style="display:block;font-size:14px;font-weight:800;color:#F1F5F9;line-height:1.25">{name}</span>
        <span style="display:block;font-size:11px;color:#94A3B8;margin-top:2px">{tag}</span>
      </span>
      <span style="flex-shrink:0;color:#64748B;font-size:14px">&rsaquo;</span>
    </a>''')
    return "\n".join(out)

def build_hero(eyebrow, h1, subhead, buttons, trust, items):
    # buttons: list of (href,label). first=primary, second=secondary
    btn_html = '<div style="display:flex;gap:14px;flex-wrap:wrap">\n'
    for j,(href,label) in enumerate(buttons):
        if j == 0:
            btn_html += f'    <a href="{href}" style="display:inline-block;padding:14px 26px;background:#06B6D4;color:#0F172A;text-decoration:none;font-size:15px;font-weight:700">{label}</a>\n'
        else:
            btn_html += f'    <a href="{href}" style="display:inline-block;padding:14px 26px;background:transparent;color:#F1F5F9;border:2px solid #F1F5F9;text-decoration:none;font-size:15px;font-weight:700">{label}</a>\n'
    btn_html += '  </div>'
    trust_html = f'\n  <p style="margin-top:24px;color:#94A3B8;font-size:12px">{trust}</p>' if trust else ''
    return f'''<!-- wp:cover {{"customOverlayColor":"#0F172A","minHeight":480,"style":{{"spacing":{{"padding":{{"top":"88px","right":"24px","bottom":"88px","left":"24px"}}}}}}}} -->
<div class="wp-block-cover" style="padding-top:88px;padding-right:24px;padding-bottom:88px;padding-left:24px;min-height:480px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim" style="background-color:#0F172A"></span><div class="wp-block-cover__inner-container">
<!-- wp:html -->
<div style="max-width:1240px;margin:0 auto;display:grid;grid-template-columns:1.5fr 1fr;gap:56px;align-items:start" class="hero-2col">
<style>
@media(max-width:1000px){{.hero-2col{{grid-template-columns:1fr !important;gap:40px !important}}}}
</style>
<div>
  <p style="color:#06B6D4;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;margin-bottom:14px">{eyebrow}</p>
  <h1 style="color:#F1F5F9;font-size:48px;font-weight:800;line-height:1.06;letter-spacing:-0.02em;margin-bottom:18px">{h1}</h1>
  <p style="color:#CBD5E1;font-size:18px;line-height:1.6;margin-bottom:28px">{subhead}</p>
  {btn_html}{trust_html}
</div>
<aside style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:24px">
  <p style="font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#22D3EE;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.08)">&rarr; Jump to section</p>
  <div style="display:flex;flex-direction:column;gap:8px">
{build_menu(items)}
  </div>
</aside>
</div>
<!-- /wp:html -->
</div></div>
<!-- /wp:cover -->'''

def extract_hero_copy(cover):
    paras = re.findall(r'<p\b[^>]*>(.*?)</p>', cover, re.DOTALL)
    h1m = re.search(r'<h1\b[^>]*>(.*?)</h1>', cover, re.DOTALL)
    h1 = h1m.group(1).strip() if h1m else ""
    btns = re.findall(r'<a class="wp-block-button__link[^>]*href="([^"]+)"[^>]*>(.*?)</a>', cover, re.DOTALL)
    btns = [(h.strip(), l.strip()) for h,l in btns]
    eyebrow = paras[0].strip() if len(paras) >= 1 else ""
    subhead = paras[1].strip() if len(paras) >= 2 else ""
    trust   = paras[2].strip() if len(paras) >= 3 else ""
    return eyebrow, h1, subhead, btns, trust

report = []
for pid, items in MENUS.items():
    src = f"page{pid}.html"
    content = open(src, encoding="utf-8").read()
    marker = "<!-- /wp:cover -->"
    idx = content.find(marker)
    cover = content[:idx+len(marker)]
    body  = content[idx+len(marker):]
    eyebrow, h1, subhead, btns, trust = extract_hero_copy(cover)
    new_hero = build_hero(eyebrow, h1, subhead, btns, trust, items)
    new = new_hero + body
    out = f"page{pid}_new.html"
    open(out, "w", encoding="utf-8").write(new)
    # checks
    opens = new.count("<!-- wp:")
    closes = new.count("<!-- /wp:")
    dollars = re.findall(r'\$[0-9][0-9,]*', new)
    sticky = new.lower().count("position:sticky") + new.lower().count("sub-nav")
    # anchor presence in body
    missing = []
    for (_n,_nm,_tg,href) in items:
        if href.startswith("#"):
            aid = href[1:]
            if f'id="{aid}"' not in body and f'"anchor":"{aid}"' not in body:
                missing.append(href)
    report.append({
        "pid": pid, "bytes": len(new), "opens": opens, "closes": closes,
        "balanced": opens == closes, "dollars": dollars, "sticky": sticky,
        "eyebrow": eyebrow[:40], "h1_len": len(h1), "n_btns": len(btns),
        "btn_hrefs": [h for h,_ in btns], "trust_ok": bool(trust),
        "missing_anchors": missing
    })

print("PID | bytes | blocks(o/c bal) | $ | sticky | btns | eyebrow | missing anchors")
for r in report:
    print(f"{r['pid']:>3} | {r['bytes']:>6} | {r['opens']}/{r['closes']} {'OK' if r['balanced'] else 'BAD'} | "
          f"{len(r['dollars'])} | {r['sticky']} | {r['n_btns']}{r['btn_hrefs']} | "
          f"'{r['eyebrow']}' h1={r['h1_len']}c trust={r['trust_ok']} | {r['missing_anchors']}")
