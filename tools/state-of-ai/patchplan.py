"""Turn the difference between two builds of a page into minimal wp_alter_post edits.

python3 tools/state-of-ai/patchplan.py <old.html> <new.html> <out.json>
Each edit is {"search": ..., "replace": ...} for PLAIN mode. Search strings are unique in the
current document at the time they are applied (edits are checked in order on a simulated copy),
start just after a '>' (never with `">` + tag, which the site's firewall blocks) and are
kept short. Applying all edits in order to old.html must yield new.html exactly; the script
verifies that before writing.
"""
import difflib, json, re, sys


def toks(s):
    return re.findall(r'[^>]*>|[^>]+$', s)


def plan(old, new):
    a, b = toks(old), toks(new)
    assert ''.join(a) == old and ''.join(b) == new
    ops = [o for o in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes() if o[0] != 'equal']
    edits = []
    cur = list(a); delta = 0
    for tag, i1, i2, j1, j2 in ops:  # forward: uniqueness is checked on the document as it stands
        i1 += delta; i2 += delta
        doc = ''.join(cur)
        for ctx in range(0, 60):
            lo, hi = max(0, i1 - ctx), min(len(cur), i2 + ctx)
            search = ''.join(cur[lo:hi])
            if search and doc.count(search) == 1 and not search.startswith('">'):
                break
        else:
            raise SystemExit(f'no unique anchor for tokens {i1}-{i2}')
        replace = ''.join(cur[lo:i1]) + ''.join(b[j1:j2]) + ''.join(cur[i2:hi])
        edits.append({'search': search, 'replace': replace})
        cur = cur[:i1] + b[j1:j2] + cur[i2:]
        delta += (j2 - j1) - (i2 - i1)
    # re-verify in forward order on a fresh copy (uniqueness at the time of each edit)
    doc = old
    for e in edits:
        assert doc.count(e['search']) == 1, e['search'][:80]
        doc = doc.replace(e['search'], e['replace'])
    assert doc == new, 'plan does not reproduce new build'
    return edits


if __name__ == '__main__':
    old, new = open(sys.argv[1]).read(), open(sys.argv[2]).read()
    e = plan(old, new)
    json.dump(e, open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
    print(f'{len(e)} edits, largest search {max((len(x["search"]) for x in e), default=0):,} chars, '
          f'largest replace {max((len(x["replace"]) for x in e), default=0):,} chars')
