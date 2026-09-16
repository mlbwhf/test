#!/usr/bin/env python3
"""Render branded 'AI Index' stat cards (1080x1080) to PNG via headless Chromium."""
import os, subprocess, tempfile, html

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
OUT = "/home/user/test/report-ai/social/cards"
os.makedirs(OUT, exist_ok=True)

# theme -> (page bg, number color, ink, muted, eyebrow color, rule color)
THEMES = {
    "light": ("#ffffff", "#2545f5", "#111114", "#6e6e76", "#2545f5", "#e6e6ea"),
    "dark":  ("#111114", "#ffffff", "#ffffff", "#8a8a92", "#5a78ff", "#2a2a30"),
    "red":   ("#111114", "#ff5a45", "#ffffff", "#8a8a92", "#ff5a45", "#2a2a30"),
    "green": ("#ffffff", "#1c7a43", "#111114", "#6e6e76", "#1c7a43", "#e6e6ea"),
}

CARDS = [
    ("88%",       "of organizations now use AI in at least one business function — up from ~50% in 2022", "McKinsey, The State of AI", "light"),
    ("71%",       "of organizations use generative AI regularly — up from just 33% a year earlier", "McKinsey / Stanford HAI", "light"),
    ("$37B",      "enterprise spend on generative AI in 2025 — a 3.2× jump over 2024", "Menlo Ventures", "light"),
    ("61%",       "of global venture capital went to AI in 2025 — double its 2022 share", "OECD, 2026", "light"),
    ("+67pts",    "AI coding leapt on SWE-bench: 4.4% → 71.7% in a single year", "Stanford HAI, AI Index 2025", "light"),
    ("40%",       "Anthropic's share of enterprise LLM spend in 2025 — up from 12%, now #1", "Menlo Ventures", "light"),
    ("945 TWh",   "projected global data-center electricity demand by 2030 — roughly double 2024", "IEA, Energy and AI", "dark"),
    ("$1T+",      "annual AI infrastructure spending by 2029 — up from $487B in 2026", "IDC", "light"),
    ("+78M",      "net new jobs by 2030: 170M created against 92M displaced", "WEF, Future of Jobs 2025", "light"),
    ("$20M/day",  "proposed US fine for a company that defies a federal AI shutdown order", "AI Kill Switch Act, 2026", "red"),
    ("€35M", "or 7% of global turnover — the EU AI Act's maximum fine for banned uses", "EU AI Act, Article 99", "light"),
    ("Dec 2027",  "EU's toughest high-risk AI rules — slipped ~16 months from Aug 2026", "Digital Omnibus, 2026", "light"),
    ("1st",       "disclosed case of an AI autonomously running a real cyberattack (Hugging Face)", "OpenAI, July 2026", "dark"),
    ("$40B",      "projected US generative-AI fraud losses by 2027 — up from $12.3B in 2023", "Deloitte Center for Financial Services", "red"),
    ("$25M",      "stolen in one deepfake video call — every 'colleague', incl. the CFO, was AI-generated", "CNN / SCMP, 2024", "red"),
    ("3,000%+",   "rise in deepfake fraud attempts in some regions in a single year", "Sumsub Identity Fraud Report", "red"),
    ("A",         "Anthropic's Claude tops our AI model security scorecard — grade A overall", "The AI Index, Model Security Ratings 2026", "green"),
]

def num_size(s):
    n = len(s)
    if n <= 1:  return 460
    if n <= 3:  return 300
    if n <= 5:  return 250
    if n <= 8:  return 185
    return 150

TPL = """<!doctype html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1080px;height:1080px}}
body{{background:{bg};font-family:'Liberation Sans','DejaVu Sans',sans-serif;
  padding:86px 84px;display:flex;flex-direction:column;justify-content:space-between}}
.top{{display:flex;align-items:center;justify-content:space-between}}
.eyebrow{{font-family:'Liberation Mono','DejaVu Sans Mono',monospace;font-size:24px;
  letter-spacing:.22em;text-transform:uppercase;color:{eyebrow};font-weight:bold}}
.dot{{width:34px;height:34px;background:{eyebrow};border-radius:6px}}
.rule{{width:120px;height:8px;background:{eyebrow};margin:0 0 34px;border-radius:2px}}
.num{{font-size:{numsize}px;line-height:.92;font-weight:bold;color:{num};
  letter-spacing:-.04em;margin-bottom:40px}}
.label{{font-size:44px;line-height:1.24;font-weight:bold;color:{ink};max-width:900px;letter-spacing:-.01em}}
.foot{{display:flex;align-items:flex-end;justify-content:space-between}}
.src{{font-family:'Liberation Mono','DejaVu Sans Mono',monospace;font-size:23px;color:{muted};max-width:720px;line-height:1.4}}
.src b{{color:{muted};font-weight:normal;text-transform:uppercase;letter-spacing:.06em;font-size:19px;display:block;margin-bottom:5px}}
.brand{{font-family:'Liberation Mono','DejaVu Sans Mono',monospace;font-size:24px;
  color:{eyebrow};font-weight:bold;letter-spacing:.02em;white-space:nowrap}}
</style></head><body>
<div class="top"><span class="eyebrow">The AI Index</span><span class="dot"></span></div>
<div>
  <div class="rule"></div>
  <div class="num">{numtext}</div>
  <div class="label">{label}</div>
</div>
<div class="foot">
  <div class="src"><b>Source</b>{src}</div>
  <div class="brand">report-ai.org</div>
</div>
</body></html>"""

for i, (num, label, src, theme) in enumerate(CARDS, 1):
    bg, ncol, ink, muted, eyebrow, rule = THEMES[theme]
    doc = TPL.format(bg=bg, num=ncol, ink=ink, muted=muted, eyebrow=eyebrow,
                     numsize=num_size(num), numtext=html.escape(num),
                     label=html.escape(label), src=html.escape(src))
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
        f.write(doc); path = f.name
    out = os.path.join(OUT, f"{i:02d}.png")
    subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu",
        "--hide-scrollbars", "--force-device-scale-factor=2",
        f"--screenshot={out}", "--window-size=1080,1080", path],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    os.unlink(path)
    print(f"{i:02d}.png  {num}")
print("done ->", OUT)
