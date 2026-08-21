# -*- coding: utf-8 -*-
"""Generate ES/FR versions of the aa-sx single-block pages (homepage, Five
Dimensions). Fails rather than emitting a page with untranslated copy left in.
"""
import re, io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sx
import schema_clean

OUT = "/home/user/test/snippets/pages/translations"

PAGES = {
    "home":            ("snippets/pages/home-961.html", "home"),
    "operating-model": ("snippets/pages/operating-model.html", "operating-model"),
    "scaling":         ("snippets/pages/scaling-iterative-model.html", "scaling-iterative-model"),
    "ai-native-om":    ("snippets/pages/ai-native-operating-model.html", "ai-native-operating-model"),
    "ai-automation":   ("snippets/pages/ai-automation.html", "ai-automation"),
    "mutation":        ("snippets/pages/mutation.html", "mutation"),
}

# /training/... and /services/... keep their shape but gain the language prefix
def rewrite_url(u, lang):
    if u.startswith(("http", "#", "mailto:", "tel:")):
        return u
    if u.startswith("/"):
        return "/%s%s" % (lang, u)
    return u


def tidy(html):
    """Clean artefacts left by reordering around <em> in split headings."""
    html = re.sub(r'(</(?:em|strong|span)>)\s+([.,;:!?])', r'\1\2', html)
    html = re.sub(r'\s{2,}([.,;:!?])', r'\1', html)
    return html


LD = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)


def localize_schema(block, lang, unresolved):
    """Translate JSON-LD text, localise its URLs, and drop FAQPage.

    FAQPage is removed rather than translated: these pages carry FAQ markup
    with no visible FAQ section on the page, and shipping that claim in two
    more languages compounds a defect instead of copying it faithfully.
    """
    import json
    from translations_schema import SCHEMA
    try:
        obj = json.loads(block)
    except ValueError:
        return block, False
    dropped = False

    def walk(node):
        nonlocal dropped
        if isinstance(node, list):
            keep = []
            for n in node:
                if isinstance(n, dict) and n.get('@type') == 'FAQPage':
                    dropped = True; continue
                keep.append(walk(n))
            return keep
        if not isinstance(node, dict):
            return node
        for k, v in list(node.items()):
            if k in ('name', 'description') and isinstance(v, str):
                pair = SCHEMA.get(v)
                if pair:
                    node[k] = pair[0] if lang == 'es' else pair[1]
                elif len(v) > 40:
                    unresolved.append('[JSON-LD] ' + v)
            elif k in ('url', '@id', 'item') and isinstance(v, str) \
                    and v.startswith('https://agile-agilist.com/'):
                tail = v[len('https://agile-agilist.com/'):]
                node[k] = 'https://agile-agilist.com/%s/%s' % (lang, tail)
            else:
                node[k] = walk(v)
        return node

    obj = walk(obj)
    if isinstance(obj, dict):
        obj['inLanguage'] = lang
    return json.dumps(obj, ensure_ascii=False, indent=2), dropped


def generate(src_path, table, keep, lang):
    html = io.open(src_path, encoding='utf-8').read()
    out, unresolved = [], []
    dropped_faq = False
    for kind, tok in sx.shred(html):
        if kind == 'skip':
            m = LD.fullmatch(tok)
            if m:
                body, d = localize_schema(m.group(2), lang, unresolved)
                dropped_faq = dropped_faq or d
                out.append(m.group(1) + body + m.group(3)); continue
            out.append(tok); continue
        if kind == 'tag':
            out.append(re.sub(r'href="([^"]+)"',
                              lambda m: 'href="%s"' % rewrite_url(m.group(1), lang), tok))
            continue
        s = tok.strip()
        if not s or not sx.translatable(s):
            out.append(tok); continue
        if s in keep:
            out.append(tok); continue
        pair = table.get(s)
        if pair is None:
            unresolved.append(s); out.append(tok); continue
        out.append(tok.replace(s, pair[0] if lang == 'es' else pair[1]))
    html = tidy("".join(out))
    html, notes = schema_clean.clean_html(html)
    if notes:
        dropped_faq = True
    return html, unresolved, dropped_faq


def main():
    import translations_home as H
    import translations_five as F
    five = (F.FIVE, F.KEEP | H.KEEP)
    tables = {"home": (H.HOME, H.KEEP), "operating-model": five, "scaling": five,
              "ai-native-om": five, "ai-automation": five, "mutation": five}
    failed = {}
    for key, (src, stem) in PAGES.items():
        table, keep = tables[key]
        for lang in ("es", "fr"):
            html, unresolved, dropped = generate(src, table, keep, lang)
            if unresolved:
                failed[(key, lang)] = unresolved
                continue
            p = os.path.join(OUT, "%s-%s.html" % (stem, lang))
            io.open(p, "w", encoding="utf-8").write(html)
            print("  wrote %-30s %6d bytes%s" % (os.path.basename(p), len(html),
                  "  [FAQPage dropped - no visible FAQ section]" if dropped else ""))
    if failed:
        for (k, l), segs in failed.items():
            uniq = list(dict.fromkeys(segs))
            print("\nUNRESOLVED %s/%s: %d segments" % (k, l, len(uniq)))
            for s in uniq:
                print("   %s" % s[:120])
        sys.exit(1)
    print("\nGenerated with zero unresolved segments.")


if __name__ == "__main__":
    main()
