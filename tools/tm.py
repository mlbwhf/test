"""Translation memory for agile-agilist course pages.

ES/FR course pages share their EN source's Gutenberg structure, but not
byte-for-byte: the certification badge row marks the current course with an
extra class, which shifts a naive index alignment. So we align the EN and
target token streams with difflib over the *tag* skeleton and only harvest
text pairs from regions where the skeleton matches exactly.
"""
import re, io, json, os, difflib
from collections import defaultdict

ENFIX = "/tmp/claude-0/-home-user-test/64e476a6-2f18-52ab-88ab-b28688212ae0/scratchpad/enfix"
PAIRS = [
    ("LPM", "backup-1928.html", "backup-es-30890.html", "backup-fr-30892.html"),
    ("APM", "backup-3605.html", "backup-es-30891.html", "backup-fr-30894.html"),
    ("SDP", "backup-1941.html", "backup-es-30895.html", "frresume-30898-before.html"),
]
TARGETS = {"SP": "backup-3710.html", "ARCH": "backup-1943.html", "ASE": "backup-1937.html"}

TOKEN = re.compile(r'(<[^>]+>)')
# course codes / badge captions are identifiers, never translated
SKIP = re.compile(r'^(CERT|[A-Z]{2,6}|[\s&;#0-9./|·—–\-]*)$')

def tokens(html):
    return TOKEN.split(html)

def is_tag(t):
    return t.startswith('<')

def skeleton(toks):
    """Tag stream with text runs collapsed to a placeholder."""
    return [t if is_tag(t) else '\x00TEXT' for t in toks]

def translatable(t):
    s = t.strip()
    return bool(s) and not SKIP.match(s)

def load(f):
    return io.open(os.path.join(ENFIX, f), encoding='utf-8').read()

def align(en_html, tg_html):
    """Yield (en_text, target_text) for text runs in skeleton-identical regions."""
    a, b = tokens(en_html), tokens(tg_html)
    sa, sb = skeleton(a), skeleton(b)
    for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, sa, sb, autojunk=False).get_opcodes():
        if op != 'equal':
            continue
        for k in range(i2 - i1):
            ea, tb = a[i1 + k], b[j1 + k]
            if is_tag(ea):
                continue
            e, t = ea.strip(), tb.strip()
            if translatable(e) and t:
                yield e, t

def build(pairs=None):
    pairs = pairs or PAIRS
    counts = {"es": defaultdict(lambda: defaultdict(int)), "fr": defaultdict(lambda: defaultdict(int))}
    for code, en, es, fr in pairs:
        eh = load(en)
        for lang, f in (("es", es), ("fr", fr)):
            for e, t in align(eh, load(f)):
                counts[lang][e][t] += 1
    tm, ambig = {"es": {}, "fr": {}}, {"es": 0, "fr": 0}
    for lang in ("es", "fr"):
        for e, cands in counts[lang].items():
            if len(cands) > 1:
                ambig[lang] += 1
            tm[lang][e] = max(cands.items(), key=lambda kv: kv[1])[0]
    return tm, ambig

def pending(code, tm):
    """Translatable EN segments of a target page with no TM entry."""
    toks = tokens(load(TARGETS[code]))
    out = []
    for t in toks:
        if is_tag(t):
            continue
        s = t.strip()
        if translatable(s) and s not in tm["es"]:
            out.append(s)
    seen, uniq = set(), []
    for s in out:
        if s not in seen:
            seen.add(s); uniq.append(s)
    return uniq

if __name__ == "__main__":
    tm, ambig = build()
    json.dump(tm, io.open("/home/user/test/tools/tm.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"TM: es={len(tm['es'])} ({ambig['es']} ambiguous)  fr={len(tm['fr'])} ({ambig['fr']} ambiguous)")
