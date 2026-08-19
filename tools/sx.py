# -*- coding: utf-8 -*-
"""Segment extraction for the aa-sx single-block pages (homepage, Five Dimensions).

These are one wp:html block carrying inline <style>, so the extractor has to
protect style/script/comment regions and only surface real copy.
"""
import re, io

PROTECT = re.compile(r'(<style\b.*?</style>|<script\b.*?</script>|<!--.*?-->)', re.S | re.I)
TAG = re.compile(r'(<[^>]+>)')
# HTML entities are glyphs, not copy: collapse them before judging noise, so
# "30&ndash;75%" and "&middot;" read as figures/punctuation rather than words.
ENTITY = re.compile(r'&(?:[a-zA-Z]+|#\d+);')
# not worth translating: pure punctuation, numerals, single glyphs
NOISE = re.compile(r'^[\s\d.,%$~:/|·—–\-→←⟶⟵✦✧◆●○«»""\'()\[\]+×x]*$')

def shred(html):
    """Yield (kind, text) where kind is 'skip' | 'tag' | 'text'."""
    for chunk in PROTECT.split(html):
        if not chunk:
            continue
        if PROTECT.fullmatch(chunk):
            yield ('skip', chunk); continue
        for tok in TAG.split(chunk):
            if not tok:
                continue
            yield (('tag' if tok.startswith('<') else 'text'), tok)

def translatable(t):
    s = t.strip()
    if not s:
        return False
    if NOISE.fullmatch(ENTITY.sub('·', s)):
        return False
    # single letters matter: "A <strong>scaling model</strong> that ..." needs
    # its article translated too
    return len(s) > 1 or s.isalpha()

def segments(html):
    out, seen = [], set()
    for kind, tok in shred(html):
        if kind != 'text':
            continue
        s = tok.strip()
        if translatable(s) and s not in seen:
            seen.add(s); out.append(s)
    return out

if __name__ == "__main__":
    import sys
    PAGES = [("home", "snippets/pages/home-961.html"),
             ("operating-model", "snippets/pages/operating-model.html"),
             ("scaling-iterative-model", "snippets/pages/scaling-iterative-model.html"),
             ("ai-native-operating-model", "snippets/pages/ai-native-operating-model.html"),
             ("ai-automation", "snippets/pages/ai-automation.html"),
             ("mutation", "snippets/pages/mutation.html")]
    tot_s = tot_c = 0
    print(f"{'page':28s} {'segments':>9s} {'chars':>8s}")
    for name, p in PAGES:
        segs = segments(io.open(p, encoding='utf-8').read())
        c = sum(len(x) for x in segs)
        tot_s += len(segs); tot_c += c
        print(f"{name:28s} {len(segs):9d} {c:8,d}")
    print(f"{'TOTAL (per language)':28s} {tot_s:9d} {tot_c:8,d}")
    print(f"{'TOTAL (ES+FR)':28s} {tot_s*2:9d} {tot_c*2:8,d}")
