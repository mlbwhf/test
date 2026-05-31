#!/usr/bin/env python3
import re, sys, os

MENUS = {
 39:[("01","Why You","When consulting fits","#why"),("02","3 Tiers","Coached -> Co-Delivered -> Full","#tiers"),("03","Delivery Rhythm","Discover -> Mutate","#rhythm"),("04","SPCT Lead","Practice anchor","#spct"),("05","FAQ","Buyer questions","#faq")],
 40:[("01","5 Phases","Assess -> Mutate","#phases"),("02","3 Models","DIY -> Coached -> Delivered","#models"),("03","Milestones","90/180/365","#milestones"),("04","Free Assessment","Start here","#assess")],
 41:[("01","Plus the Framework","What's different","#plus"),("02","4 Days","Curriculum","#days"),("03","Outcomes","What you walk out with","#outcomes"),("04","FAQ","Common questions","#faq"),("05","Enroll","Reserve a seat","#enroll")],
 42:[("01","Who For","Eligibility","#who"),("02","D3/D4/D5","Advanced dims","#dims"),("03","90-Day Cadence","How it runs","#cadence"),("04","Enterprise","Private cohort","#enterprise"),("05","FAQ","Common questions","#faq")],
 86:[("01","3 Tracks","Foundations - Change - Exec","#tracks"),("02","6 Modules","Curriculum","#modules"),("03","90-Day Cadence","How it runs","#cadence"),("04","Enterprise","Private cohort","#enterprise"),("05","FAQ","Common questions","#faq")],
 88:[("01","4 Tracks","Practitioner - Leader - Master - Coach","#tracks"),("02","5 Dimensions","Strategy -> Metrics","#dimensions"),("03","Curriculum","5 modules","#modules"),("04","90-Day Cadence","How it runs","#cadence"),("05","FAQ","Common questions","#faq")],
 90:[("01","4 Paths","SPC - ASPC - AI-Native - Innovation","#paths"),("02","Compare","Side-by-side table","#compare"),("03","Path Call","Talk it through","#call")],
 121:[("01","6 Phases","Prepare -> Innovate","#phases"),("02","Enablers","5 transformation enablers","#enablers"),("03","Foundation Layers","Team -> Enterprise","#layers"),("04","Outcomes","Business results","#outcomes")],
}
EYEBROW = {90:"Certifications", 121:"Implementation Journey"}
CYCLE = ["#22D3EE","#84CC16","#06B6D4","#A3E635"]
TINT = {"#22D3EE":"rgba(34,211,238,.12)","#84CC16":"rgba(132,204,22,.12)","#06B6D4":"rgba(6,182,212,.12)","#A3E635":"rgba(163,230,53,.12)"}

COVER_END = "<!-- /wp:cover -->"

def first_cover(src):
    i = src.find(COVER_END)
    return src[:i]

def extract(pid, src):
    cov = first_cover(src)
    h1m = re.search(r'<h1\b[^>]*>(.*?)</h1>', cov, re.DOTALL)
    h1 = h1m.group(1).strip() if h1m else ""
    hp = h1m.start() if h1m else 0
    before = re.findall(r'<p\b[^>]*>(.*?)</p>', cov[:hp], re.DOTALL)
    after = re.findall(r'<p\b[^>]*>(.*?)</p>', cov[hp:], re.DOTALL)
    eyebrow = re.sub(r'<[^>]+>', '', before[-1]).strip() if before else ""
    subhead = after[0].strip() if after else ""
    btns = re.findall(r'<a class="wp-block-button__link[^>]*href="([^"]+)"[^>]*>(.*?)</a>', cov, re.DOTALL)
    btns = [(h.strip(), re.sub(r'<[^>]+>', '', l).strip()) for h, l in btns]
    # trust: last <p> after last buttons block that has <strong>
    trust = ""
    bm = list(re.finditer(r'<!-- /wp:buttons -->', cov))
    if bm:
        for tp in re.finditer(r'<p\b[^>]*>(.*?)</p>', cov[bm[-1].end():], re.DOTALL):
            if '<strong' in tp.group(1):
                trust = tp.group(1).strip(); break
    if pid in EYEBROW and not eyebrow:
        eyebrow = EYEBROW[pid]
    if pid in EYEBROW:
        eyebrow = EYEBROW[pid]
    return eyebrow, h1, subhead, btns, trust

def menu_html(items):
    out = []
    for i,(num,name,tag,href) in enumerate(items):
        col = CYCLE[i % len(CYCLE)]; bbg = TINT[col]
        out.append(f'''    <a href="{href}" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:transparent;border:1px solid rgba(255,255,255,.08);border-left:3px solid {col};border-radius:6px;text-decoration:none;transition:all .2s">
      <span style="flex-shrink:0;width:32px;height:32px;border-radius:6px;background:{bbg};color:{col};font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">{num}</span>
      <span style="flex:1;min-width:0">
        <span style="display:block;font-size:14px;font-weight:800;color:#F1F5F9;line-height:1.25">{name}</span>
        <span style="display:block;font-size:11px;color:#94A3B8;margin-top:2px">{tag}</span>
      </span>
      <span style="flex-shrink:0;color:#64748B;font-size:14px">&rsaquo;</span>
    </a>''')
    return "\n".join(out)

def build_hero(eyebrow, h1, subhead, btns, trust, items):
    if not btns:
        btns = [("https://meetings.hubspot.com/john2795","Talk to our team &rarr;"), ("/framework/","Back to the framework")]
    b0h, b0l = btns[0]; rest = btns[1:2]
    bhtml = '<div style="display:flex;gap:14px;flex-wrap:wrap">\n'
    bhtml += f'    <a href="{b0h}" style="display:inline-block;padding:14px 26px;background:#06B6D4;color:#0F172A;text-decoration:none;font-size:15px;font-weight:700">{b0l}</a>\n'
    for h,l in rest:
        bhtml += f'    <a href="{h}" style="display:inline-block;padding:14px 26px;background:transparent;color:#F1F5F9;border:2px solid #F1F5F9;text-decoration:none;font-size:15px;font-weight:700">{l}</a>\n'
    bhtml += '  </div>'
    thtml = f'\n  <p style="margin-top:24px;color:#94A3B8;font-size:12px">{trust}</p>' if trust else ''
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
  {bhtml}{thtml}
</div>
<aside style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:24px">
  <p style="font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#22D3EE;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.08)">&rarr; Jump to section</p>
  <div style="display:flex;flex-direction:column;gap:8px">
{menu_html(items)}
  </div>
</aside>
</div>
<!-- /wp:html -->
</div></div>
<!-- /wp:cover -->'''

def scrub(t):
    log = []
    def rep(pat, repl, desc):
        nonlocal t
        n = len(re.findall(pat, t))
        if n:
            t = re.sub(pat, repl, t); log.append(f"{desc} x{n}")
    # "$$ &middot; X" / "$$$ &middot; X" -> "X"  (dollar-tier prefix before middot)
    rep(r'\$+\s*&middot;\s*', '', 'dollar-tier &middot; prefix')
    # "Investment $$$" / "Investment $" -> "Investment: contact us"
    rep(r'Investment\s*\$+', 'Investment: contact us', 'Investment $tier')
    # remove $-amounts like $1,000
    rep(r'\$[0-9][0-9,]*', '', 'numeric $amount')
    # remove standalone 1-4 $ runs
    rep(r'\$+', '', 'stray $run')
    # tidy stray " &middot; " sequences at start/end and doubles
    t = re.sub(r'>\s*&middot;\s*', '>', t)
    t = re.sub(r'\s*&middot;\s*<', '<', t)
    t = re.sub(r'(?:\s*&middot;\s*){2,}', ' &middot; ', t)
    return t, log

def build_one(pid):
    src = open(f"/home/user/test/src{pid}.html", encoding="utf-8").read()
    assert COVER_END in src, f"no cover end in src{pid}"
    e,h1,s,b,t = extract(pid, src)
    hero = build_hero(e,h1,s,b,t, MENUS[pid])
    body = src[src.find(COVER_END)+len(COVER_END):]
    full = hero + body
    full,_ = scrub(full)
    hero_s,_ = scrub(hero)
    os.makedirs("/home/user/test/final", exist_ok=True)
    open(f"/home/user/test/final/page{pid}_full.html","w",encoding="utf-8").write(full)
    open(f"/home/user/test/final/hero{pid}.html","w",encoding="utf-8").write(hero_s)
    return full, e, h1, s, b, t

if __name__ == "__main__":
    pid = int(sys.argv[1])
    full, e, h1, s, b, t = build_one(pid)
    print(f"BUILT page{pid}: bytes={len(full)} eyebrow={e!r} h1_len={len(h1)} nbtns={len(b)} trust={bool(t)}")
