#!/usr/bin/env python3
"""Render compact 1x (1080px) versions of every card for cheap hosting/upload."""
import os, subprocess, tempfile, html, importlib.util

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
BASE = "/home/user/test/report-ai/social/"

def load(path):
    # exec the generator source up to (but not including) its render loop,
    # so we get THEMES / TPL / num_size / CARDS without re-rendering @2x.
    src = open(path).read().split("for i, (num")[0]
    g = {"__name__": "x"}
    exec(src, g)
    return g

for gen, outdir in [("generate_cards.py", "cards-small"),
                    ("generate_cards_full.py", "cards-full-small")]:
    m = load(BASE + gen)
    OUT = BASE + outdir
    os.makedirs(OUT, exist_ok=True)
    for i, (num, label, src, theme) in enumerate(m["CARDS"], 1):
        bg, ncol, ink, muted, eyebrow, rule = m["THEMES"][theme]
        doc = m["TPL"].format(bg=bg, num=ncol, ink=ink, muted=muted, eyebrow=eyebrow,
                              numsize=m["num_size"](num), numtext=html.escape(num),
                              label=html.escape(label), src=html.escape(src))
        with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
            f.write(doc); path = f.name
        out = os.path.join(OUT, f"{i:02d}.png")
        subprocess.run([CHROME, "--headless", "--no-sandbox", "--disable-gpu",
            "--hide-scrollbars", f"--screenshot={out}", "--window-size=1080,1080", path],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        os.unlink(path)
    print(outdir, "done")
