# -*- coding: utf-8 -*-
"""Segment extraction + rewriting for the v3 homepage (redesign-build/aa-home).

The v3 markup differs from the older aa-sx pages in one way that matters: a
third of the copy does not live in text nodes at all. The assessment rows carry
their whole report payload in a data-report JSON attribute, and the five
dimension layers carry theirs in data-dim, so the panel can be repainted on
hover without a round trip. sx.py walks text nodes only and would have shipped
Spanish rows driving an English panel.

So this module surfaces three kinds of segment:

  text        ordinary text nodes, same rule as sx.translatable
  attr JSON   data-report / data-dim payloads, translated key by key
  shortcode   [aa_home_cohorts] — left intact, but gains lang="xx"

Everything else (style, script, comments, ids, class names, image alt text for
company logos) is passed through byte-for-byte.
"""
import re, json, html as _html

import sx

# JSON-carrying attributes and the keys inside them that are real copy.
# "num", "val" and "pct" are figures; they stay as they are.
ATTR_JSON = {
    'data-report': {'name', 'meta', 'desc', 'label'},
    'data-dim':    {'name', 'detail', 'tags'},
}
ATTR_RE = re.compile(r"(data-(?:report|dim))='([^']*)'")
SHORTCODE_RE = re.compile(r'\[aa_home_cohorts([^\]]*)\]')


def _walk_json(node, keys, fn, key=None):
    """Apply fn to every string that sits under one of `keys`."""
    if isinstance(node, dict):
        return {k: _walk_json(v, keys, fn, k) for k, v in node.items()}
    if isinstance(node, list):
        return [_walk_json(v, keys, fn, key) for v in node]
    if isinstance(node, str) and key in keys:
        return fn(node)
    return node


def attr_segments(tag):
    """Every translatable string inside this tag's JSON attributes."""
    out = []
    for m in ATTR_RE.finditer(tag):
        keys = ATTR_JSON[m.group(1)]
        try:
            obj = json.loads(_html.unescape(m.group(2)))
        except ValueError:
            continue
        _walk_json(obj, keys, lambda s: out.append(s) or s)
    return out


def rewrite_attrs(tag, fn):
    """Rewrite JSON attributes through fn; unresolved strings come back unchanged."""
    def one(m):
        attr, raw = m.group(1), m.group(2)
        try:
            obj = json.loads(_html.unescape(raw))
        except ValueError:
            return m.group(0)
        obj = _walk_json(obj, ATTR_JSON[attr], fn)
        # Single-quoted attribute: only & and ' need escaping, and json.dumps
        # already has no raw newlines. Keep &amp; so the markup stays valid.
        s = json.dumps(obj, ensure_ascii=False)
        s = s.replace('&', '&amp;').replace("'", '&#39;')
        return "%s='%s'" % (attr, s)
    return ATTR_RE.sub(one, tag)


def segments(html):
    """Ordered, de-duplicated list of everything that needs translating."""
    out, seen = [], set()

    def add(s):
        s = s.strip()
        if s and s not in seen:
            seen.add(s)
            out.append(s)

    for kind, tok in sx.shred(html):
        if kind == 'tag':
            for s in attr_segments(tok):
                add(s)
        elif kind == 'text':
            for part in SHORTCODE_RE.split(tok)[::2] if SHORTCODE_RE.search(tok) else [tok]:
                if sx.translatable(part.strip()):
                    add(part)
    return out


if __name__ == "__main__":
    import io, sys
    src = sys.argv[1] if len(sys.argv) > 1 else \
        "snippets/pages/home-961-v3-markup-only.html"
    segs = segments(io.open(src, encoding='utf-8').read())
    print("%d segments, %d chars\n" % (len(segs), sum(len(s) for s in segs)))
    for s in segs:
        print("  %s" % s)
