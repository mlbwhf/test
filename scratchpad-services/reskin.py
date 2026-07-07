#!/usr/bin/env python3
import re, sys

# old-hex (upper) -> new-hex
CMAP = {
    # dark navy
    "053947": "0B2E35",
    "0A4F63": "0E3A44",
    # blue -> teal
    "0170B9": "127E88",
    "0284C7": "127E88",
    "015A96": "0C5E66",
    "1E40AF": "0C5E66",
    # blue tint
    "DBEAFE": "DCEAEA",
    # gold/amber -> aa amber
    "FBBF24": "E6B23C",
    "F59E0B": "C7902A",
    "FACC15": "EFC55E",
    "FEF3C7": "F5E7C8",
    "FFFBEB": "FBF6EC",
    "92400E": "6B4A1C",
    # greens -> teal (on-brand)
    "22C55E": "127E88",
    "166534": "0B5760",
    "127919": "0C5E66",
    "128640": "0C5E66",
    # purple -> navy/teal
    "8B5CF6": "127E88",
    "6D28D9": "0E3A44",
    # neutrals
    "E2E8F0": "DCEAEA",
    "F1F5F9": "EAF4F4",
    "F8FAFC": "F5FAFA",
    "475569": "3C565E",
    "64748B": "5E7378",
    "94A3B8": "88A0A4",
    "CBD5E1": "B9D4D4",
    # keep semantic red: EF4444, 991B1B  (not mapped)
}

RGBA = [
    (r"rgba\(1,112,185,", "rgba(18,126,136,"),   # blue glow -> teal
    (r"rgba\(251,191,36,", "rgba(230,178,60,"),  # gold glow -> amber
    (r"rgba\(5,57,71,", "rgba(11,46,53,"),        # navy rgba -> teal-dark
]

def reskin(text, P):
    # hex replacements, case-insensitive
    for old, new in CMAP.items():
        text = re.sub("#" + old, "#" + new, text, flags=re.IGNORECASE)
    for pat, rep in RGBA:
        text = re.sub(pat, rep, text)

    override = f"""
<!-- wp:html -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@1,6..72,400;1,6..72,500;1,6..72,600&family=Inter:wght@400;500;600;700;800;900&display=swap">
<style>
/* ===== aa-teal re-skin overrides ({P}) ===== */
.{P}-hero h1,.{P}-section-head h2,.{P}-meth-left h2{{font-family:'Newsreader',Georgia,serif !important;font-weight:500 !important;font-style:italic !important;letter-spacing:-.01em !important}}
.{P}-eb,.{P}-hero-eb{{background:transparent !important;border:none !important;padding:0 !important;border-radius:0 !important;color:#127E88 !important;font-family:ui-monospace,'SF Mono',Menlo,monospace !important;font-weight:600 !important;font-size:12px !important;letter-spacing:2px !important;text-transform:uppercase !important}}
.{P}-eb.gold{{color:#C7902A !important}}
.{P}-hero-eb{{color:#8FCFCF !important}}
/* light section bands */
.wp-block-group.has-ast-global-color-5-background-color{{background:#F5FAFA !important}}
.wp-block-group.has-ast-global-color-4-background-color{{background:#EAF6F7 !important}}
/* dark bands + hero cover -> teal-dark */
.wp-block-group.has-ast-global-color-2-background-color{{background:#0B2E35 !important}}
.wp-block-cover__background.has-ast-global-color-2-background-color{{background:linear-gradient(160deg,#0B2E35 0%,#0E3A44 100%) !important;opacity:1 !important}}
</style>
<!-- /wp:html -->
"""
    # insert after the first schema wp:html block's closing tag
    marker = "<!-- /wp:html -->"
    idx = text.find(marker)
    if idx == -1:
        # no schema block; prepend
        return override + "\n" + text
    end = idx + len(marker)
    return text[:end] + "\n" + override + text[end:]

if __name__ == "__main__":
    infile, prefix, outfile = sys.argv[1], sys.argv[2], sys.argv[3]
    src = open(infile).read()
    open(outfile, "w").write(reskin(src, prefix))
    print("wrote", outfile)
