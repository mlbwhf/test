#!/usr/bin/env python3
import re, html

HUB = open('/home/user/test/page33_new.html', encoding='utf-8').read()

# Sibling jump menu (same on every sub-page): num,name,tag,href,border,badgebg,badgetext
MENU = [
    ("01","SAFe Implementation","The proven base","/framework/safe-implementation/","#22D3EE","rgba(34,211,238,.12)","#22D3EE"),
    ("02","Innovation Framework","Repeatable innovation","/framework/innovation/","#84CC16","rgba(132,204,22,.12)","#84CC16"),
    ("03","AI-Native","Operating model rebuilt","/framework/ai-native/","#06B6D4","rgba(6,182,212,.12)","#06B6D4"),
    ("04","AI Automation","End-to-end technical","/framework/ai-automation/","#A3E635","rgba(163,230,53,.12)","#A3E635"),
    ("05","Mutation","Where change sticks","/framework/mutation/","#22D3EE","rgba(34,211,238,.12)","#22D3EE"),
]

def menu_html():
    out=[]
    for num,name,tag,href,border,bbg,btext in MENU:
        out.append(f'''    <a href="{href}" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:transparent;border:1px solid rgba(255,255,255,.08);border-left:3px solid {border};border-radius:6px;text-decoration:none;transition:all .2s">
      <span style="flex-shrink:0;width:32px;height:32px;border-radius:6px;background:{bbg};color:{btext};font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">{num}</span>
      <span style="flex:1;min-width:0">
        <span style="display:block;font-size:14px;font-weight:800;color:#F1F5F9;line-height:1.25">{name}</span>
        <span style="display:block;font-size:11px;color:#94A3B8;margin-top:2px">{tag}</span>
      </span>
      <span style="flex-shrink:0;color:#64748B;font-size:14px">&rsaquo;</span>
    </a>''')
    return "\n".join(out)

def hero(eyebrow,h1,subhead):
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
  <div style="display:flex;gap:14px;flex-wrap:wrap">
    <a href="https://agile-agilist.com/contact/" style="display:inline-block;padding:14px 26px;background:#06B6D4;color:#0F172A;text-decoration:none;font-size:15px;font-weight:700">Talk to our team &rarr;</a>
    <a href="/framework/" style="display:inline-block;padding:14px 26px;background:transparent;color:#F1F5F9;border:2px solid #F1F5F9;text-decoration:none;font-size:15px;font-weight:700">Back to the framework</a>
  </div>
</div>
<aside style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:24px">
  <p style="font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#22D3EE;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.08)">&rarr; Explore the dimensions</p>
  <div style="display:flex;flex-direction:column;gap:8px">
{menu_html()}
  </div>
</aside>
</div>
<!-- /wp:html -->
</div></div>
<!-- /wp:cover -->'''

def extract_group(anchor):
    # find the wp:group opener comment carrying this anchor
    m = re.search(r'<!-- wp:group [^\n]*"anchor":"'+re.escape(anchor)+r'"[^\n]*-->', HUB)
    if not m:
        raise SystemExit("anchor not found: "+anchor)
    start = m.start()
    # balance wp:group open/close from start
    depth = 0
    pos = start
    token = re.compile(r'<!-- wp:group\b|<!-- /wp:group -->')
    end = None
    for t in token.finditer(HUB, start):
        if t.group().startswith('<!-- wp:group'):
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                end = t.end()
                break
    if end is None:
        raise SystemExit("unbalanced group for "+anchor)
    return HUB[start:end]

def first_paragraph_text(group):
    m = re.search(r'<p\b[^>]*>(.*?)</p>', group, re.DOTALL)
    if not m: return ""
    txt = re.sub(r'<[^>]+>', '', m.group(1)).strip()
    return txt

PAGES = [
    ("safe-implementation","d1-safe-implementation","SAFe Implementation"),
    ("innovation","d2-innovation","Innovation Framework"),
    ("ai-native","d3-ai-native","AI-Native"),
    ("ai-automation","d4-ai-automation","AI Automation"),
    ("mutation","d5-mutation","Mutation"),
]

print("slug | bytes | wp open/close | $count | hero-2col | menu5 | subhead(40)")
for slug, anchor, h1 in PAGES:
    body = extract_group(anchor)
    sub = first_paragraph_text(body)
    if len(sub) > 240: sub = sub[:237].rstrip()+"&hellip;"
    page = hero("The 5-Dimensional Framework", h1, sub) + "\n\n" + body
    out = f"/home/user/test/final/sub-{slug}_full.html"
    open(out,"w",encoding="utf-8").write(page)
    o = page.count("<!-- wp:"); c = page.count("<!-- /wp:")
    dollars = len(re.findall(r'\$', page))
    h2 = "hero-2col" in page
    m5 = all(u in page for *_, u, _, _, _ in [(x) for x in []]) # placeholder
    menu_ok = all(href in page for _,_,_,href,_,_,_ in MENU)
    print(f"{slug} | {len(page)} | {o}/{c} {'OK' if o==c else 'BAD'} | {dollars} | {h2} | {menu_ok} | {sub[:40]}")
