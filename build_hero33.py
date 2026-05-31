import json

# Menu items for page 33 (hub): NUM, NAME, TAG, HREF, BORDER, BADGE_BG, BADGE_TEXT
items = [
    ("01","SAFe Implementation","The proven base","/framework/safe-implementation/","#22D3EE","rgba(34,211,238,.12)","#22D3EE"),
    ("02","Innovation Framework","Repeatable innovation","/framework/innovation/","#84CC16","rgba(132,204,22,.12)","#84CC16"),
    ("03","AI-Native","Operating model rebuilt","/framework/ai-native/","#06B6D4","rgba(6,182,212,.12)","#06B6D4"),
    ("04","AI Automation","End-to-end technical","/framework/ai-automation/","#A3E635","rgba(163,230,53,.12)","#A3E635"),
    ("05","Mutation","Where change sticks","/framework/mutation/","#22D3EE","rgba(34,211,238,.12)","#22D3EE"),
]

menu_items = ""
for num,name,tag,href,border,bbg,btext in items:
    menu_items += f'''    <a href="{href}" style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:transparent;border:1px solid rgba(255,255,255,.08);border-left:3px solid {border};border-radius:6px;text-decoration:none;transition:all .2s">
      <span style="flex-shrink:0;width:32px;height:32px;border-radius:6px;background:{bbg};color:{btext};font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center">{num}</span>
      <span style="flex:1;min-width:0">
        <span style="display:block;font-size:14px;font-weight:800;color:#F1F5F9;line-height:1.25">{name}</span>
        <span style="display:block;font-size:11px;color:#94A3B8;margin-top:2px">{tag}</span>
      </span>
      <span style="flex-shrink:0;color:#64748B;font-size:14px">&rsaquo;</span>
    </a>
'''

hero = f'''<!-- wp:cover {{"customOverlayColor":"#0F172A","minHeight":480,"style":{{"spacing":{{"padding":{{"top":"88px","right":"24px","bottom":"88px","left":"24px"}}}}}}}} -->
<div class="wp-block-cover" style="padding-top:88px;padding-right:24px;padding-bottom:88px;padding-left:24px;min-height:480px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim" style="background-color:#0F172A"></span><div class="wp-block-cover__inner-container">
<!-- wp:html -->
<div style="max-width:1240px;margin:0 auto;display:grid;grid-template-columns:1.5fr 1fr;gap:56px;align-items:start" class="hero-2col">
<style>
@media(max-width:1000px){{.hero-2col{{grid-template-columns:1fr !important;gap:40px !important}}}}
</style>
<div>
  <p style="color:#06B6D4;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;margin-bottom:14px">The Framework</p>
  <h1 style="color:#F1F5F9;font-size:48px;font-weight:800;line-height:1.06;letter-spacing:-0.02em;margin-bottom:18px">Five dimensions for actually <span style="color:#06B6D4">implementing SAFe</span> in an AI-native enterprise</h1>
  <p style="color:#CBD5E1;font-size:18px;line-height:1.6;margin-bottom:28px">Our 5-dimensional framework for implementing SAFe in AI-native enterprises &mdash; SAFe Implementation, Innovation Framework, AI-Native operating model, AI Automation, and Mutation. Built from 21 years of leading enterprise transformations across Fortune 500s, federal agencies, and high-growth scale-ups. 2,500+ practitioners trained.</p>
  <div style="display:flex;gap:14px;flex-wrap:wrap">
    <a href="/roadmap/" style="display:inline-block;padding:14px 26px;background:#06B6D4;color:#0F172A;text-decoration:none;font-size:15px;font-weight:700">See the engagement path &rarr;</a>
    <a href="/consulting/" style="display:inline-block;padding:14px 26px;background:transparent;color:#F1F5F9;border:2px solid #F1F5F9;text-decoration:none;font-size:15px;font-weight:700">Enterprise consulting</a>
  </div>
  <p style="margin-top:24px;color:#94A3B8;font-size:12px"><strong style="color:#F1F5F9">SAFe&reg; Gold Partner</strong> &middot; <strong style="color:#F1F5F9">SPCT</strong>-led &middot; <strong style="color:#F1F5F9">21+ years</strong></p>
</div>
<aside style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:24px">
  <p style="font-size:10px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;color:#22D3EE;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.08)">&rarr; Jump to section</p>
  <div style="display:flex;flex-direction:column;gap:8px">
{menu_items}  </div>
</aside>
</div>
<!-- /wp:html -->
</div></div>
<!-- /wp:cover -->'''

# Read existing content, replace the first cover block (lines 1..28 -> through first "<!-- /wp:cover -->")
with open('/home/user/test/page33.html') as f:
    content = f.read()

marker = "<!-- /wp:cover -->"
idx = content.find(marker)
assert idx != -1, "no cover end found"
rest = content[idx+len(marker):]
new_content = hero + rest

with open('/home/user/test/page33_new.html','w') as f:
    f.write(new_content)

print("OLD len:", len(content), "NEW len:", len(new_content))
print("rest starts with:", rest[:80].strip())
