#!/usr/bin/env python3
"""Reorder Training (1699) sections and renumber eyebrows. Moves whole blocks byte-for-byte."""
import re, sys

SRC = "backups/1699-training-2026-07-06.orig.html"
OUT = "backups/1699-training-2026-07-06.new.html"

text = open(SRC, encoding="utf-8").read()

MARK = '<!-- wp:group {"tagName":"section"'
TAIL_MARK = '<!-- wp:html -->\n<div class="aa-final">'

tail_idx = text.index(TAIL_MARK)
body, tail = text[:tail_idx], text[tail_idx:]

parts = body.split(MARK)
head = parts[0]
chunks = [MARK + p for p in parts[1:]]

def sid(c):
    return re.search(r'id="([^"]+)"', c).group(1)

by_id = {sid(c): c for c in chunks}
present = list(by_id.keys())
expected = ["hero","salary","paths","roles","hardware","jobs","certifications","coaching","cohorts","not-ready"]
assert set(present) == set(expected), f"section id mismatch: {present}"

# NEW order (hero stays first): roles, jobs(Live signals), coaching, then the rest
new_order = ["hero","roles","jobs","coaching","salary","paths","hardware","certifications","cohorts","not-ready"]
# eyebrow renumber: id -> new number (only the numbered sections)
renum = {"roles":"01","jobs":"02","coaching":"03","salary":"04","paths":"05","hardware":"06","certifications":"07"}

def apply_num(c, cid):
    if cid in renum:
        c2, n = re.subn(r'\( 0\d \) —', f'( {renum[cid]} ) —', c, count=1)
        assert n == 1, f"eyebrow not found in {cid}"
        return c2
    return c

new_chunks = [apply_num(by_id[cid], cid) for cid in new_order]
new_text = head + "".join(new_chunks) + tail

# fidelity guard: renumber swaps 2-char for 2-char, so length must be identical
assert len(new_text) == len(text), f"length changed {len(text)} -> {len(new_text)}"
for cid in expected:
    assert new_text.count(f'id="{cid}"') == 1, f"id {cid} count != 1"

open(OUT, "w", encoding="utf-8").write(new_text)

# report
print("NEW SECTION ORDER + EYEBROWS:")
for cid in new_order:
    c = apply_num(by_id[cid], cid)
    m = re.search(r'<p class="aa-eyebrow">([^<]+)</p>', c)
    print(f"  {cid:15} -> {m.group(1) if m else '(no eyebrow)'}")
print(f"\nlen OK ({len(text)} bytes, unchanged), all 10 ids present once. Wrote {OUT}")
