#!/usr/bin/env python3
"""Build a single HTML contact sheet: each post's caption paired with its card image."""
import os, subprocess, tempfile, html, base64, csv, importlib.util

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
BASE = "/home/user/test/report-ai/social/"

def load(path):
    src = open(BASE + path).read().split("for i, (num")[0]
    g = {"__name__": "x"}; exec(src, g); return g

def thumb_datauri(m, num, label, src, theme):
    bg, ncol, ink, muted, eyebrow, rule = m["THEMES"][theme]
    doc = m["TPL"].format(bg=bg, num=ncol, ink=ink, muted=muted, eyebrow=eyebrow,
                          numsize=m["num_size"](num), numtext=html.escape(num),
                          label=html.escape(label), src=html.escape(src))
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
        f.write(doc); p = f.name
    out = p + ".png"
    subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
        "--force-device-scale-factor=0.3333", f"--screenshot={out}", "--window-size=1080,1080", p],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    data = base64.b64encode(open(out, "rb").read()).decode()
    os.unlink(p); os.unlink(out)
    return "data:image/png;base64," + data

SECTIONS = [
    ("stat-bank-batch1.csv", "generate_cards.py", "cards", "Batch 1 — scheduled 3–25 Aug"),
    ("stat-bank-full.csv", "generate_cards_full.py", "cards-full", "Full bank — scheduled 26 Aug–22 Oct"),
]

rows_html = []
n = 0
for csvf, genf, folder, title in SECTIONS:
    m = load(genf)
    with open(BASE + csvf) as f:
        posts = list(csv.DictReader(f))
    rows_html.append(f'<h2>{title} &middot; {len(posts)} posts</h2>')
    for i, (card, post) in enumerate(zip(m["CARDS"], posts), 1):
        n += 1
        num, label, src, theme = card
        uri = thumb_datauri(m, num, label, src, theme)
        fname = f"{folder}/{i:02d}.png"
        cap = html.escape(post["Text"])
        tags = html.escape(post["Hashtags"])
        link = html.escape(post["Link"])
        date = html.escape(post["Date"])
        rows_html.append(f'''<div class="row">
  <img src="{uri}" alt="card {i}">
  <div class="meta">
    <div class="hd"><span class="idx">#{n:02d}</span> <span class="file">{fname}</span> <span class="date">{date}</span></div>
    <p class="cap">{cap}</p>
    <p class="tags">{tags}</p>
    <p class="link">{link}</p>
    <p class="chan">X &middot; Instagram &middot; Google Business</p>
  </div>
</div>''')

doc = f'''<!doctype html><html><head><meta charset="utf-8"><title>Report-AI social posts</title>
<style>
body{{font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:900px;margin:0 auto;padding:24px;color:#111114;background:#fafafa}}
h1{{font-size:24px}} h2{{font-size:16px;margin:28px 0 10px;color:#2545f5;border-top:2px solid #2545f5;padding-top:10px}}
.row{{display:flex;gap:16px;background:#fff;border:1px solid #e6e6ea;border-radius:6px;padding:14px;margin-bottom:12px}}
.row img{{width:180px;height:180px;flex:0 0 180px;border-radius:4px;border:1px solid #eee}}
.meta{{min-width:0}}
.hd{{font-family:ui-monospace,monospace;font-size:12px;color:#9a9aa2;margin-bottom:6px}}
.idx{{color:#2545f5;font-weight:700}} .file{{color:#111114}} .date{{float:right}}
.cap{{font-size:14px;line-height:1.45;margin:6px 0}}
.tags{{font-family:ui-monospace,monospace;font-size:12px;color:#2545f5;margin:4px 0}}
.link{{font-family:ui-monospace,monospace;font-size:11px;color:#6e6e76;margin:4px 0;word-break:break-all}}
.chan{{font-family:ui-monospace,monospace;font-size:11px;color:#9a9aa2;margin:4px 0}}
</style></head><body>
<h1>Report-AI &mdash; social posts &amp; images ({n} total)</h1>
<p>Each post with the card image to attach (filename shown). Use the full-res files in <code>report-ai/social/cards/</code> and <code>cards-full/</code>.</p>
{''.join(rows_html)}
</body></html>'''

open(BASE + "contact-sheet.html", "w").write(doc)
print("wrote contact-sheet.html,", n, "posts, bytes:", len(doc))
