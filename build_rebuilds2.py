#!/usr/bin/env python3
import re, sys

MENUS = {
 39:[("01","Why You","When consulting fits","#why"),("02","3 Tiers","Coached → Co-Delivered → Full","#tiers"),("03","Delivery Rhythm","Discover → Mutate","#rhythm"),("04","SPCT Lead","Practice anchor","#spct"),("05","FAQ","Buyer questions","#faq")],
 40:[("01","5 Phases","Assess → Mutate","#phases"),("02","3 Models","DIY → Coached → Delivered","#models"),("03","Milestones","90/180/365","#milestones"),("04","Free Assessment","Start here","#assess")],
 41:[("01","Plus the Framework","What's different","#plus"),("02","4 Days","Curriculum","#days"),("03","Outcomes","What you walk out with","#outcomes"),("04","FAQ","Common questions","#faq"),("05","Enroll","Reserve a seat","#enroll")],
 42:[("01","Who For","Eligibility","#who"),("02","D3/D4/D5","Advanced dims","#dims"),("03","90-Day Cadence","How it runs","#cadence"),("04","Enterprise","Private cohort","#enterprise"),("05","FAQ","Common questions","#faq")],
 86:[("01","3 Tracks","Foundations · Change · Exec","#tracks"),("02","6 Modules","Curriculum","#modules"),("03","90-Day Cadence","How it runs","#cadence"),("04","Enterprise","Private cohort","#enterprise"),("05","FAQ","Common questions","#faq")],
 88:[("01","4 Tracks","Practitioner · Leader · Master · Coach","#tracks"),("02","5 Dimensions","Strategy → Metrics","#dimensions"),("03","Curriculum","5 modules","#modules"),("04","90-Day Cadence","How it runs","#cadence"),("05","FAQ","Common questions","#faq")],
 90:[("01","4 Paths","SPC · ASPC · AI-Native · Innovation","#paths"),("02","Compare","Side-by-side table","#compare"),("03","Path Call","Talk it through","#call")],
 121:[("01","6 Phases","Prepare → Innovate","#phases"),("02","Enablers","5 transformation enablers","#enablers"),("03","Foundation Layers","Team → Enterprise","#layers"),("04","Outcomes","Business results","#outcomes")],
}
# per-page eyebrow override where auto-extraction is unreliable (None = use auto)
EYEBROW = {90:"Certifications", 121:"Implementation Journey"}

def first_cover(hero_src):
    end = hero_src.find("<!-- /wp:cover -->")
    return hero_src[:end]

def first_column(block):
    m = re.search(r'<!-- wp:column\b', block)
    if not m: return None
    start=m.start(); depth=0
    for t in re.finditer(r'<!-- wp:column\b|<!-- /wp:column -->', block[start:]):
        if t.group().startswith('<!-- wp:column'): depth+=1
        else:
            depth-=1
            if depth==0: return block[start:start+t.end()]
    return block[start:]

def main_region(cover):
    if '<!-- wp:columns' in cover:
        col=first_column(cover)
        if col: return col
    return cover

def texts(region):
    return [re.sub(r'<[^>]+>','',p).strip() for p in re.findall(r'<p\b[^>]*>(.*?)</p>', region, re.DOTALL)]

def inner_html_paras(region):
    return re.findall(r'<p\b[^>]*>(.*?)</p>', region, re.DOTALL)

def extract(pid, src):
    cover = first_cover(src)
    region = main_region(cover)
    h1m = re.search(r'<h1\b[^>]*>(.*?)</h1>', region, re.DOTALL)
    h1 = h1m.group(1).strip() if h1m else ""
    h1pos = h1m.start() if h1m else 0
    paras = inner_html_paras(region)
    # eyebrow = first <p> before h1; subhead = first <p> after h1
    before=[p for p in re.findall(r'<p\b[^>]*>(.*?)</p>', region[:h1pos], re.DOTALL)]
    after=[p for p in re.findall(r'<p\b[^>]*>(.*?)</p>', region[h1pos:], re.DOTALL)]
    eyebrow = (before[-1].strip() if before else "")
    subhead = (after[0].strip() if after else "")
    btns = re.findall(r'<a class="wp-block-button__link[^>]*href="([^"]+)"[^>]*>(.*?)</a>', region, re.DOTALL)
    btns = [(h.strip(), re.sub(r'<[^>]+>','',l).strip()) for h,l in btns]
    # trust: a <p> after the buttons containing <strong>
    trust=""
    bm = list(re.finditer(r'<!-- /wp:buttons -->', region))
    if bm:
        tail = region[bm[-1].end():]
        tp = re.search(r'<p\b[^>]*>(.*?)</p>', tail, re.DOTALL)
        if tp and '<strong' in tp.group(1): trust = tp.group(1).strip()
    if pid in EYEBROW: eyebrow = EYEBROW[pid]
    return eyebrow, h1, subhead, btns, trust

for pid in [39,40,41,42,86,88,90,121]:
    src=open(f"/home/user/test/src{pid}.html",encoding="utf-8").read()
    e,h1,s,b,t = extract(pid,src)
    print(f"\n=== {pid} ===")
    print("EYEBROW:", e[:80])
    print("H1     :", h1[:110])
    print("SUBHEAD:", s[:110])
    print("BTNS   :", b)
    print("TRUST  :", (t[:90] if t else "(none)"))
