"""Inline-SVG exhibits for Report AI pages (no JS; native <title> tooltips; data table under each).

Palette validated with the dataviz validator (light surface): CVD ΔE ≥ 10.8, normal-vision ΔE ≥ 27.7.
Orange and yellow sit below 3:1 contrast, so every exhibit carries direct labels and a data table.
"""
import html, math, re

PAL = ['#2545f5', '#e8730c', '#11826a', '#a33fb8', '#c9a100']
GRID = '#e6e6ea'; AXIS = '#9a9aa2'; INK = '#33333a'; MUTED = '#6e6e76'
W = 720
E = lambda s: html.escape(str(s), quote=False)
A = lambda s: html.escape(str(s), quote=True)
FONT = ''  # font set in CSS (.tai-ex-svg text)


def fmt(v):
    if v is None:
        return ''
    a = abs(v)
    if a >= 100:
        s = f'{v:,.0f}'
    elif a >= 10:
        s = f'{v:,.1f}'.rstrip('0').rstrip('.')
    elif a >= 1:
        s = f'{v:,.2f}'.rstrip('0').rstrip('.')
    elif a == 0:
        s = '0'
    else:
        s = f'{v:.3g}'
    return s


def nice_step(span, n=5):
    raw = span / n if span > 0 else 1
    e = 10 ** math.floor(math.log10(raw))
    for f in (1, 2, 2.5, 5, 10):
        if f * e >= raw:
            return f * e
    return 10 * e


def nice_max(m):
    if m <= 0:
        return 1
    st = nice_step(m, 5)
    return math.ceil(m / st - 1e-9) * st


def ticks(lo, hi, n=5):
    st = nice_step(hi - lo, n)
    out, v = [], math.floor(lo / st) * st
    while v <= hi + 1e-9:
        out.append(v); v += st
    return out


def num(x):
    try:
        if x is None or x == '':
            return None
        return float(x)
    except Exception:
        try:
            return float(re.sub(r'[^0-9.\-]', '', str(x)))
        except Exception:
            return None


def svg_open(h, label):
    return (f'<div class="tai-ex-svg"><svg viewBox="0 0 {W} {h}" role="img" aria-label="{A(label)}" '
            f'style="width:100%;max-width:760px;min-width:540px;height:auto;display:block;" xmlns="http://www.w3.org/2000/svg">')


def legend(series, y):
    if len(series) < 2:
        return ''
    out, x = '', 0
    for i, s in enumerate(series):
        c = PAL[i % len(PAL)]
        out += f'<rect x="{x}" y="{y - 9}" width="12" height="12" rx="3" fill="{c}"/><text x="{x + 18}" y="{y + 1}" font-size="12.5" fill="{INK}">{E(s["name"])}</text>'
        x += 30 + 7.6 * len(str(s['name']))
    return out


def labels_of(series):
    seen = []
    for s in series:
        for p in s.get('points', []):
            if p[0] not in seen:
                seen.append(p[0])
    return seen


def yaxis(x0, x1, y0, y1, lo, hi, unit):
    out = ''
    for t in ticks(lo, hi):
        y = y1 - (t - lo) / (hi - lo) * (y1 - y0)
        out += f'<line x1="{x0}" x2="{x1}" y1="{y:.1f}" y2="{y:.1f}" stroke="{GRID}" stroke-width="1"/>'
        out += f'<text x="{x0 - 8}" y="{y + 4:.1f}" font-size="11.5" fill="{AXIS}" text-anchor="end">{fmt(t)}</text>'
    if unit:
        out += f'<text x="{x0 - 8}" y="{y0 - 14}" font-size="11.5" fill="{MUTED}" text-anchor="end">{E(unit)}</text>'
    return out


def line_chart(ex):
    series = [s for s in ex.get('series', []) if s.get('points')]
    labs = labels_of(series)
    vals = [num(p[1]) for s in series for p in s['points'] if num(p[1]) is not None]
    if not vals or len(labs) < 2:
        return ''
    lo = min(0, min(vals)); hi = nice_max(max(vals))
    top = 46 if len(series) > 1 else 30
    h = 330; x0, x1, y0, y1 = 70, W - 120, top, h - 44
    X = lambda i: x0 + i * (x1 - x0) / max(1, len(labs) - 1)
    Y = lambda v: y1 - (v - lo) / (hi - lo) * (y1 - y0)
    out = svg_open(h, ex.get('title', '')) + legend(series, 14) + yaxis(x0, x1, y0, y1, lo, hi, ex.get('unit', ''))
    every = max(1, math.ceil(len(labs) / 8))
    for i, l in enumerate(labs):
        if i % every == 0 or i == len(labs) - 1:
            out += f'<text x="{X(i):.1f}" y="{h - 22}" font-size="11.5" fill="{AXIS}" text-anchor="middle">{E(l)}</text>'
    for si, s in enumerate(series):
        c = PAL[si % len(PAL)]
        pts = [(labs.index(p[0]), num(p[1])) for p in s['points'] if num(p[1]) is not None]
        d = ' '.join(f'{"M" if k == 0 else "L"}{X(i):.1f},{Y(v):.1f}' for k, (i, v) in enumerate(pts))
        out += f'<path d="{d}" fill="none" stroke="{c}" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round"/>'
        for i, v in pts:
            out += f'<circle cx="{X(i):.1f}" cy="{Y(v):.1f}" r="4.5" fill="{c}" stroke="#fff" stroke-width="2"><title>{E(s["name"])}, {E(labs[i])}: {fmt(v)} {E(ex.get("unit", ""))}</title></circle>'
        li, lv = pts[-1]
        out += f'<text x="{X(li) + 9:.1f}" y="{Y(lv) + 4:.1f}" font-size="12.5" font-weight="600" fill="{INK}">{fmt(lv)}</text>'
        if len(series) > 1 and len(series) <= 4:
            out += f'<text x="{X(li) + 9:.1f}" y="{Y(lv) + 18:.1f}" font-size="10.5" fill="{MUTED}">{E(str(s["name"])[:16])}</text>'
        if len(pts) > 1:
            fi, fv = pts[0]
            out += f'<text x="{X(fi) + 6:.1f}" y="{Y(fv) - 10:.1f}" font-size="11.5" fill="{MUTED}" text-anchor="start">{fmt(fv)}</text>'
    return out + '</svg></div>'


def bar_chart(ex, grouped=False):
    series = [s for s in ex.get('series', []) if s.get('points')]
    if not grouped:
        series = series[:1]
    labs = labels_of(series)
    vals = [num(p[1]) for s in series for p in s['points'] if num(p[1]) is not None]
    if not vals:
        return ''
    lo = min(0, min(vals)); hi = nice_max(max(vals)) if max(vals) > 0 else 1
    top = 46 if len(series) > 1 else 30
    h = 330; x0, x1, y0, y1 = 70, W - 20, top, h - 44
    Y = lambda v: y1 - (v - lo) / (hi - lo) * (y1 - y0)
    out = svg_open(h, ex.get('title', '')) + legend(series, 14) + yaxis(x0, x1, y0, y1, lo, hi, ex.get('unit', ''))
    band = (x1 - x0) / len(labs); ns = len(series)
    bw = min(56, (band * 0.72) / ns)
    for li, l in enumerate(labs):
        cx = x0 + band * (li + .5)
        out += f'<text x="{cx:.1f}" y="{h - 22}" font-size="11.5" fill="{AXIS}" text-anchor="middle">{E(str(l)[:22])}</text>'
        for si, s in enumerate(series):
            v = next((num(p[1]) for p in s['points'] if p[0] == l), None)
            if v is None:
                continue
            c = PAL[si % len(PAL)]
            bx = cx - ns * bw / 2 + si * bw + 1
            yt, yb = (Y(v), Y(0)) if v >= 0 else (Y(0), Y(v))
            hh = max(1, yb - yt)
            r = min(4, hh / 2, (bw - 2) / 2)
            out += (f'<path d="M{bx:.1f},{yb:.1f} V{yt + r:.1f} Q{bx:.1f},{yt:.1f} {bx + r:.1f},{yt:.1f} H{bx + bw - 2 - r:.1f} '
                    f'Q{bx + bw - 2:.1f},{yt:.1f} {bx + bw - 2:.1f},{yt + r:.1f} V{yb:.1f} Z" fill="{c}"><title>{E(s["name"])}, {E(l)}: {fmt(v)} {E(ex.get("unit", ""))}</title></path>')
            if ns <= 3 or len(labs) <= 4:
                out += f'<text x="{bx + (bw - 2) / 2:.1f}" y="{yt - 6:.1f}" font-size="11" fill="{INK}" text-anchor="middle">{fmt(v)}</text>'
    out += f'<line x1="{x0}" x2="{x1}" y1="{Y(0):.1f}" y2="{Y(0):.1f}" stroke="{AXIS}" stroke-width="1"/>'
    return out + '</svg></div>'


def hbar_chart(ex):
    series = [s for s in ex.get('series', []) if s.get('points')][:1]
    if not series:
        return ''
    pts = [(p[0], num(p[1])) for p in series[0]['points'] if num(p[1]) is not None]
    if not pts:
        return ''
    hi = nice_max(max(v for _, v in pts)); lo = min(0, min(v for _, v in pts))
    rowh = 30; h = 40 + rowh * len(pts)
    x0, x1 = 210, W - 70
    X = lambda v: x0 + (v - lo) / (hi - lo) * (x1 - x0)
    out = svg_open(h, ex.get('title', ''))
    if ex.get('unit'):
        out += f'<text x="{x1}" y="16" font-size="11.5" fill="{MUTED}" text-anchor="end">{E(ex["unit"])}</text>'
    for i, (l, v) in enumerate(pts):
        y = 30 + i * rowh
        out += f'<text x="{x0 - 10}" y="{y + 15}" font-size="12.5" fill="{INK}" text-anchor="end">{E(str(l)[:26])}</text>'
        xa, xb = (X(0), X(v)) if v >= 0 else (X(v), X(0))
        w = max(1, xb - xa); r = min(4, w / 2)
        c = PAL[0]
        out += (f'<path d="M{xa:.1f},{y + 3} H{xb - r:.1f} Q{xb:.1f},{y + 3} {xb:.1f},{y + 3 + r} V{y + 19 - r} Q{xb:.1f},{y + 19} {xb - r:.1f},{y + 19} H{xa:.1f} Z" fill="{c}">'
                f'<title>{E(l)}: {fmt(v)} {E(ex.get("unit", ""))}</title></path>')
        out += f'<text x="{xb + 7:.1f}" y="{y + 15}" font-size="12" font-weight="600" fill="{INK}">{fmt(v)}</text>'
    out += f'<line x1="{X(0):.1f}" x2="{X(0):.1f}" y1="26" y2="{h - 8}" stroke="{AXIS}" stroke-width="1"/>'
    return out + '</svg></div>'


def ym(s):
    m = re.match(r'(\d{4})(?:-(\d{1,2}))?', str(s or ''))
    if not m:
        return None
    return int(m.group(1)) * 12 + (int(m.group(2) or 1) - 1)


def gantt_chart(ex):
    items = [g for g in ex.get('gantt', []) if ym(g.get('start')) is not None]
    if not items:
        return ''
    starts = [ym(g['start']) for g in items]; ends = [ym(g.get('end') or g['start']) for g in items]
    lo = (min(starts) // 12) * 12; hi = (max(ends) // 12 + 1) * 12
    groups = []
    for g in items:
        if (g.get('group') or '') not in groups:
            groups.append(g.get('group') or '')
    rowh = 26; top = 46 if len(groups) > 1 else 30
    h = top + rowh * len(items) + 30
    x0, x1 = 250, W - 16
    X = lambda m: x0 + (m - lo) / (hi - lo) * (x1 - x0)
    out = svg_open(h, ex.get('title', ''))
    if len(groups) > 1:
        out += legend([{'name': g or 'Other'} for g in groups], 14)
    for yv in range(lo // 12, hi // 12 + 1):
        x = X(yv * 12)
        out += f'<line x1="{x:.1f}" x2="{x:.1f}" y1="{top - 6}" y2="{h - 26}" stroke="{GRID}" stroke-width="1"/>'
        if yv * 12 < hi:
            out += f'<text x="{X(yv * 12 + 6):.1f}" y="{h - 10}" font-size="11.5" fill="{AXIS}" text-anchor="middle">{yv}</text>'
    for i, g in enumerate(items):
        y = top + i * rowh
        c = PAL[groups.index(g.get('group') or '') % len(PAL)]
        s, e = ym(g['start']), ym(g.get('end') or g['start'])
        out += f'<text x="{x0 - 10}" y="{y + 15}" font-size="11.5" fill="{INK}" text-anchor="end">{E(str(g["label"])[:34])}</text>'
        tip = f'{E(g["label"])}: {E(g["start"])}' + ('' if g.get('milestone') or e == s else f' to {E(g.get("end"))}')
        if g.get('milestone') or e == s:
            cx = X(s + .5); cy = y + 11
            out += f'<path d="M{cx:.1f},{cy - 7} L{cx + 7:.1f},{cy} L{cx:.1f},{cy + 7} L{cx - 7:.1f},{cy} Z" fill="{c}" stroke="#fff" stroke-width="1.5"><title>{tip}</title></path>'
        else:
            xa, xb = X(s), X(e + 1)
            out += f'<rect x="{xa:.1f}" y="{y + 4}" width="{max(3, xb - xa - 2):.1f}" height="14" rx="4" fill="{c}"><title>{tip}</title></rect>'
    return out + '</svg></div>'


def table_html(cols, rows):
    return ('<div class="tai-tablewrap"><table class="tai-table"><tr>' + ''.join(f'<th>{E(c)}</th>' for c in cols) + '</tr>' +
            ''.join('<tr>' + ''.join(f'<td>{E(x)}</td>' for x in r) + '</tr>' for r in rows) + '</table></div>')


def data_table(ex):
    t = ex.get('type')
    if t == 'table':
        return ''
    if t == 'gantt':
        rows = [[g.get('label', ''), g.get('group', ''), g.get('start', ''), '' if g.get('milestone') else g.get('end', '')] for g in ex.get('gantt', [])]
        cols = ['Event', 'Group', 'Start', 'End']
    else:
        series = [s for s in ex.get('series', []) if s.get('points')]
        labs = labels_of(series)
        cols = [''] + [s['name'] for s in series]
        rows = [[l] + [next((fmt(num(p[1])) for p in s['points'] if p[0] == l), '') for s in series] for l in labs]
    return f'<details class="tai-exdata"><summary>View the data</summary>{table_html(cols, rows)}</details>'


def exhibit(n, ex):
    t = ex.get('type')
    body = {'line': line_chart, 'bar': bar_chart, 'hbar': hbar_chart, 'gantt': gantt_chart,
            'grouped': lambda e: bar_chart(e, grouped=True)}.get(t, lambda e: '')(ex)
    if t == 'table' or (not body and ex.get('table')):
        tb = ex.get('table') or {}
        body = table_html(tb.get('columns', []), tb.get('rows', []))
    if not body:
        return ''
    conf = (ex.get('confidence') or '').upper()
    chip = f' <span class="tai-c tai-c-{conf}">{conf}</span>' if conf in ('HIGH', 'MEDIUM', 'DERIVED', 'CONTESTED') else ''
    notes = f'<br>Notes: {E(ex["notes"])}' if ex.get('notes') else ''
    return (f'<figure class="tai-ex" id="exhibit-{n}"><div class="tai-ex-n">Exhibit {n}</div>'
            f'<div class="tai-ex-t">{E(ex.get("title", ""))}</div>'
            f'<div class="tai-ex-s">{E(ex.get("subtitle", ""))}</div>{body}{data_table(ex) if body and t != "table" else ""}'
            f'<figcaption class="tai-ex-src">{E(ex.get("source", ""))}{chip}{notes}</figcaption></figure>')


CSS = """.tai-ex{margin:26px 0 30px;padding:22px 0 0;border-top:2px solid #111114;max-width:900px;}
.tai-ex-n{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#2545f5;margin-bottom:6px;}
.tai-ex-t{font-weight:800;font-size:19px;line-height:1.3;letter-spacing:-0.01em;color:#111114;margin-bottom:4px;}
.tai-ex-s{font-size:13.5px;color:#6e6e76;margin-bottom:14px;}
.tai-ex-svg{overflow-x:auto;-webkit-overflow-scrolling:touch;}
.tai-ex-svg text{font-family:'IBM Plex Mono',monospace;}
.tai-ex-src{font-size:12px;line-height:1.5;color:#77777f;margin-top:10px;border-top:1px solid #e6e6ea;padding-top:8px;}
.tai-exdata{margin-top:8px;font-size:12.5px;}.tai-exdata summary{cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#2545f5;}
"""
