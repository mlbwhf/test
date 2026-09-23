# -*- coding: utf-8 -*-
import re, csv, io
from collections import Counter

src   = io.open('aa-register-wpcode-snippet.php', encoding='utf-8').read()
lines = src.split('\n')
ARA   = re.compile(r'[؀-ۿ]')

def strip_code(s):
    """Blank out comments so they never look like code."""
    s = re.sub(r'/\*.*?\*/', lambda m: ' ' * len(m.group(0)), s, flags=re.S)
    s = re.sub(r'(?m)//[^\n]*', lambda m: ' ' * len(m.group(0)), s)
    return s

def read_sq(s, i):
    i += 1; out = []
    while i < len(s):
        c = s[i]
        if c == '\\' and i+1 < len(s) and s[i+1] in ("'", '\\'):
            out.append(s[i+1]); i += 2; continue
        if c == "'": return ''.join(out), i+1
        out.append(c); i += 1
    raise ValueError('unterminated string')

def balanced(s, i):
    """i points at 'array(' or '('. Return (inner_text, index_after)."""
    while s[i] != '(': i += 1
    depth = 0; j = i
    while j < len(s):
        c = s[j]
        if c == "'": _, j = read_sq(s, j); continue
        if c == '(': depth += 1
        elif c == ')':
            depth -= 1
            if depth == 0: return s[i+1:j], j+1
        j += 1
    raise ValueError('unbalanced')

def read_value(s, i):
    while i < len(s) and s[i] in ' \t\r\n': i += 1
    if s.startswith('array(', i):
        inner, nxt = balanced(s, i)
        items = []; k = 0
        while k < len(inner):
            if inner[k] == "'":
                v, k = read_sq(inner, k); items.append(v)
            else: k += 1
        return ' | '.join(items), nxt
    parts = []
    while True:
        while i < len(s) and s[i] in ' \t\r\n': i += 1
        if i >= len(s) or s[i] != "'": break
        v, i = read_sq(s, i); parts.append(v)
        k = i
        while k < len(s) and s[k] in ' \t\r\n': k += 1
        if k < len(s) and s[k] == '.': i = k + 1; continue
        break
    return ''.join(parts), i

KEY = re.compile(r"'([A-Za-z0-9_\-]+)'\s*=>\s*")
def pairs(text):
    out = []; i = 0
    while True:
        m = KEY.search(text, i)
        if not m: return out
        try: val, i = read_value(text, m.end())
        except Exception: i = m.end(); continue
        out.append((m.group(1), val))

def fn_body(name):
    for i, l in enumerate(lines):
        if re.match(r'^function\s+' + name + r'\b', l):
            j = i + 1
            while j < len(lines) and lines[j] != '}': j += 1
            return strip_code('\n'.join(lines[i:j+1]))
    raise ValueError(name)

def sub_array(body, opener):
    k = body.index(opener)
    inner, _ = balanced(body, k + len(opener) - 1)
    return inner

# ---- English defaults for aa_reg_strings come from the aa_reg_t() call sites
en_reg = {}
for m in re.finditer(r"aa_reg_t\(\s*'([A-Za-z0-9_\-]+)'\s*,\s*'", strip_code(src)):
    v, _ = read_sq(strip_code(src), m.end()-1)
    en_reg.setdefault(m.group(1), v)

rows = []
def add(where, key, en, ar):
    if ar and ARA.search(ar): rows.append([where, key, en, ar, ''])

# 1. registration UI
for k, v in pairs(sub_array(fn_body('aa_reg_strings'), "'ar' => array(")):
    # a key no aa_reg_t() call reads is translated but never displayed
    add('Registration panel / calendar', k,
        en_reg.get(k, '(UNUSED - no code reads this key)'), v)

# 2. confirmation email + invoice
b = fn_body('aa_reg_confirm_strings')
en = dict(pairs(sub_array(b, "'en' => array(")))
for k, v in pairs(sub_array(b, "'ar' => array(")):
    add('Confirmation email + invoice', k, en.get(k, ''), v)

# 3. home page chrome
b = fn_body('aa_home_copy_l10n')
en = dict(pairs(sub_array(b, '$en = array(')))
for k, v in pairs(sub_array(b, "'ar' => array(")):
    add('Home page chrome', k, en.get(k, ''), v)

# 4. training track copy
en_tracks = {}
b = fn_body('aa_training_copy')
for m in re.finditer(r"'([a-z0-9\-]+)' => array\(", b):
    inner, _ = balanced(b, m.end()-1)
    en_tracks[m.group(1)] = dict(pairs(inner))
ar_b = sub_array(fn_body('aa_training_copy_i18n'), "'ar' => array(")
for m in re.finditer(r"'([a-z0-9\-]+)' => array\(", ar_b):
    track = m.group(1)
    if track not in en_tracks: continue
    inner, _ = balanced(ar_b, m.end()-1)
    for k, v in pairs(inner):
        add('Training track: %s' % track, k, en_tracks[track].get(k, ''), v)

# 5. navigation menu
b = sub_array(fn_body('aa_reg_menu_labels'), 'return array(')
for m in re.finditer(r"'((?:[^'\\]|\\.)+)'\s*=>\s*array\(", b):
    eng = m.group(1); inner, _ = balanced(b, m.end()-1)
    d = dict(pairs(inner))
    add('Navigation menu', eng, eng, d.get('ar', ''))

with io.open('arabic-copy-review.csv', 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['Where it appears', 'Key', 'English source', 'Current Arabic', 'Better Arabic (fill in)'])
    w.writerows(rows)

print('rows:', len(rows))
for k, n in Counter(r[0] for r in rows).most_common(): print('  %-34s %d' % (k, n))
