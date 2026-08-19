# -*- coding: utf-8 -*-
"""Generate ES/FR versions of the aa-sx single-block pages (homepage, Five
Dimensions). Fails rather than emitting a page with untranslated copy left in.
"""
import re, io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sx

OUT = "/home/user/test/snippets/pages/translations"

PAGES = {
    "home": ("snippets/pages/home-961.html", "home"),
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


def generate(src_path, table, keep, lang):
    html = io.open(src_path, encoding='utf-8').read()
    out, unresolved = [], []
    for kind, tok in sx.shred(html):
        if kind == 'skip':
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
    return tidy("".join(out)), unresolved


def main():
    import translations_home as H
    tables = {"home": (H.HOME, H.KEEP)}
    failed = {}
    for key, (src, stem) in PAGES.items():
        table, keep = tables[key]
        for lang in ("es", "fr"):
            html, unresolved = generate(src, table, keep, lang)
            if unresolved:
                failed[(key, lang)] = unresolved
                continue
            p = os.path.join(OUT, "%s-%s.html" % (stem, lang))
            io.open(p, "w", encoding="utf-8").write(html)
            print("  wrote %-24s %6d bytes" % (os.path.basename(p), len(html)))
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
