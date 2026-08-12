# -*- coding: utf-8 -*-
"""Generate ES/FR course pages for SP, ARCH and ASE.

Text comes from two sources, in order:
  1. tm.py          - wording harvested from the LPM/APM/SDP pages already live
  2. translations.py - fresh translations for everything the TM can't supply

Anything neither source resolves is reported and the run fails, so a page is
never emitted with untranslated English silently left in it.
"""
import re, io, os, sys, json, difflib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tm as T
import translations as TR

OUT = "/home/user/test/snippets/pages/translations"
TARGETS = T.TARGETS  # SP / ARCH / ASE -> EN backup filename


def url_map():
    """Learn EN->ES and EN->FR href rewriting from the already-translated pairs."""
    href = re.compile(r'href="([^"]+)"')
    maps = {"es": {}, "fr": {}}
    for code, en, es, fr in T.PAIRS:
        he = href.findall(T.load(en))
        for lang, f in (("es", es), ("fr", fr)):
            ht = href.findall(T.load(f))
            if len(he) != len(ht):
                continue
            for a, b in zip(he, ht):
                if a != b:
                    maps[lang][a] = b
    return maps


def rewrite_url(u, lang, maps):
    if u in maps[lang]:
        return maps[lang][u]
    # generalise: /training/<section>/<slug>/ -> /<lang>/<slug>/
    m = re.match(r'^(?:https://agile-agilist\.com)?/training/[a-z-]+/([a-z0-9-]+)/?$', u)
    if m:
        return "/%s/%s/" % (lang, m.group(1))
    return u


def build_schema(course, lang, en_json):
    """Translate the Course JSON-LD, keeping every non-text field intact."""
    obj = json.loads(en_json)
    spec = TR.SCHEMA[course]
    name, desc = spec[lang]
    obj["name"] = name
    obj["description"] = desc
    obj["url"] = "https://agile-agilist.com/%s/%s/" % (lang, spec["slug"])
    obj["inLanguage"] = lang
    if "hasCourseInstance" in obj and "instructor" in obj["hasCourseInstance"]:
        obj["hasCourseInstance"]["instructor"]["name"] = TR.INSTRUCTOR[lang]
    return json.dumps(obj, ensure_ascii=False)


def generate(course, lang, memory, maps):
    src = T.load(TARGETS[course])
    toks = T.tokens(src)
    out, unresolved = [], []
    for tok in toks:
        if T.is_tag(tok):
            def _sub(m):
                return 'href="%s"' % rewrite_url(m.group(1), lang, maps)
            out.append(re.sub(r'href="([^"]+)"', _sub, tok))
            continue
        raw, s = tok, tok.strip()
        if not s:
            out.append(raw); continue
        if s.startswith('{"@context"'):
            out.append(raw.replace(s, build_schema(course, lang, s))); continue
        if not T.translatable(s):
            out.append(raw); continue
        hit = TR.lookup(course, s, lang)
        if hit is None:
            hit = memory[lang].get(s)
        if hit is None:
            unresolved.append(s); out.append(raw); continue
        out.append(raw.replace(s, hit))
    return "".join(out), unresolved


def main():
    memory, ambig = T.build()
    maps = url_map()
    print("TM: es=%d fr=%d  |  url rewrites: es=%d fr=%d"
          % (len(memory["es"]), len(memory["fr"]), len(maps["es"]), len(maps["fr"])))
    failed = {}
    for course in TARGETS:
        for lang in ("es", "fr"):
            html, unresolved = generate(course, lang, memory, maps)
            if unresolved:
                failed[(course, lang)] = unresolved
                continue
            stem = {"SP": "sp", "ARCH": "arch", "ASE": "ase"}[course]
            path = os.path.join(OUT, "%s-%s.html" % (stem, lang))
            io.open(path, "w", encoding="utf-8").write(html)
            print("  wrote %-28s %6d bytes" % (os.path.basename(path), len(html)))
    if failed:
        print("\nUNRESOLVED — nothing written for these:")
        for (c, l), segs in failed.items():
            print("  %s/%s: %d segments" % (c, l, len(segs)))
            for s in dict.fromkeys(segs):
                print("      %s" % s[:130])
        sys.exit(1)
    print("\nAll pages generated with zero unresolved segments.")


if __name__ == "__main__":
    main()
