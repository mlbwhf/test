#!/usr/bin/env python3
"""Render the 42 full-bank stat cards (1080x1080) to PNG via headless Chromium.
Filenames match the data-row order of stat-bank-full.csv (01..42)."""
import os, subprocess, tempfile, html

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
OUT = "/home/user/test/report-ai/social/cards-full"
os.makedirs(OUT, exist_ok=True)

THEMES = {
    "light": ("#ffffff", "#2545f5", "#111114", "#6e6e76", "#2545f5", "#e6e6ea"),
    "dark":  ("#111114", "#ffffff", "#ffffff", "#8a8a92", "#5a78ff", "#2a2a30"),
    "red":   ("#111114", "#ff5a45", "#ffffff", "#8a8a92", "#ff5a45", "#2a2a30"),
    "green": ("#ffffff", "#1c7a43", "#111114", "#6e6e76", "#1c7a43", "#e6e6ea"),
}

CARDS = [
    ("$109B", "US private AI investment in 2024 — about 12x China and 24x the UK", "Stanford HAI", "light"),
    ("74.5%", "of the world's AI-supercomputer performance sits in the United States", "Epoch AI", "light"),
    ("40 / 15 / 3", "notable AI models released in 2024 — US / China / Europe", "Stanford HAI", "light"),
    ("2.7%", "how far China's best model now trails the top US model — was 31.6% in 2023", "Stanford HAI", "light"),
    ("69.7%", "of global AI patents were filed by China in 2023 (US: 14.2%)", "Stanford HAI / WIPO", "light"),
    ("$294K", "what DeepSeek says it cost to train its R1 reasoning model", "Nature", "light"),
    ("1,130", "AI bills filed across ~40 US states in 2025 — about 131 enacted", "NCSL", "light"),
    ("~$20K", "South Korea's max AI-law fine — Asia's first comprehensive national AI statute", "Cooley", "light"),
    ("$200K", "per-violation cap under Texas's TRAIGA — a top US state AI penalty", "Norton Rose Fulbright", "light"),
    ("$0", "monetary penalty in Japan's AI Promotion Act — it names bad actors, not fines", "White & Case", "light"),
    ("2-3%", "of bills introduced in the US Congress ever become law", "GovTrack", "dark"),
    ("99-1", "US Senate vote to protect states' power to regulate AI (July 2025)", "US Senate Commerce Committee", "light"),
    ("$3.5M", "Anthropic's H1-2026 federal lobbying — roughly tripled (OpenAI ~$2.2M)", "CNBC", "light"),
    ("16", "companies signed the Seoul Frontier AI Safety Commitments in 2024", "AI Seoul Summit", "light"),
    ("ASL-3", "safety tier Anthropic activated with Claude Opus 4 — as a precaution", "Anthropic", "dark"),
    ("D", "Meta's open-weight Llama on weight security — public weights can't be recalled", "The AI Index, 2026", "red"),
    ("BBB-", "S&P's cut of Oracle — one notch above junk — over its AI build-out", "S&P Global Ratings", "red"),
    ("$1.5T", "debt the AI build-out needs through 2028 — about $800B from private credit", "Morgan Stanley", "dark"),
    ("$7B", "collateral Wisconsin ordered Oracle to post before powering an AI data center", "Financial Times", "dark"),
    ("$965B", "Anthropic's May-2026 post-money valuation, on $47B run-rate revenue", "Bloomberg / Anthropic", "light"),
    ("$1.4T", "OpenAI's chip & data-center commitments — center of the bubble debate", "CNBC / TipRanks", "dark"),
    ("$800B", "the shortfall Bain sees against the $2T a year AI needs by 2030", "Bain & Company", "red"),
    ("0.4%", "of global output an AI-valuation correction could cut in 2026, the IMF warns", "IMF WEO", "red"),
    ("$1.65T", "the five AI hyperscalers' off-balance-sheet obligations — up ~8x since 2022", "Nikkei Asia", "dark"),
    ("$27B", "debt behind Meta's Hyperion campus — the largest private-credit deal on record", "Meta / Blue Owl", "dark"),
    ("80-90%", "of the tactical work in the first AI-orchestrated cyber-espionage campaign", "Anthropic", "red"),
    ("1,060", "vulnerabilities XBOW filed to top HackerOne — first AI above human bug hunters", "Dark Reading", "dark"),
    ("#1", "global short-term risk, per the WEF: mis- and disinformation", "WEF Global Risks Report", "red"),
    ("1,000+", "unreliable AI-generated news sites by 2024 — up from ~49 in May 2023", "NewsGuard", "red"),
    ("$6M", "FCC fine after an AI voice-clone of Biden told voters to stay home", "US FCC", "red"),
    ("40%", "of global jobs are exposed to AI — rising toward 60% in advanced economies", "IMF", "light"),
    ("34%", "facial-analysis error for darker-skinned women — vs under 1% for lighter men", "Gender Shades", "red"),
    ("+25%", "wage premium PwC finds for roles that demand AI skills", "PwC", "light"),
    ("50B+", "faces Clearview scraped off the open web into one database — no consent", "Clearview AI", "red"),
    ("€20M", "Italy's fine on Clearview AI, plus an order to delete residents' biometric data", "Garante", "light"),
    ("10-100x", "higher facial-recognition false-match rates for Asian and Black faces", "NIST", "red"),
    ("152-4", "UN vote on lethal autonomous weapons — its first stand-alone resolution (2023)", "UN Res. 78/241", "light"),
    ("Extinction", "risk from AI 'should be a global priority, alongside pandemics and nuclear war'", "Center for AI Safety", "dark"),
    ("58.9", "GPT-5.6 Sol's top composite on the Artificial Analysis Intelligence Index (Jul 2026)", "Artificial Analysis", "light"),
    ("69.2%", "Claude Opus 4.8 leads SWE-bench Pro — the reference agentic-coding model", "SWE-bench", "green"),
    ("2M", "token context on Gemini 3.1 Pro, paired with best-in-class multimodal scores", "Google DeepMind", "light"),
    ("$0.87", "per million output tokens for DeepSeek V4-Pro at MMLU-Pro 87.5", "DeepSeek / NIST CAISI", "light"),
]

def num_size(s):
    n = len(s)
    if n <= 1:  return 460
    if n <= 3:  return 300
    if n <= 5:  return 250
    if n <= 8:  return 185
    if n <= 11: return 150
    return 128

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
print("done ->", OUT, "count:", len(CARDS))
