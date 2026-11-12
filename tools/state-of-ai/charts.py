"""Inline-SVG exhibits for Report AI pages (no JS; native <title> tooltips; data table under each).

Palette validated with the dataviz validator (light surface): CVD ΔE ≥ 10.8, normal-vision ΔE ≥ 27.7.
Orange and yellow sit below 3:1 contrast, so every exhibit carries direct labels and a data table.
"""
import html, math, re

PAL = ['#2545f5', '#e8730c', '#11826a', '#a33fb8', '#c9a100']
GRID = '#e6e6ea'; AXIS = '#9a9aa2'; INK = '#33333a'; MUTED = '#6e6e76'
W = 720
H = 330
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


SUP = str.maketrans('0123456789-', '⁰¹²³⁴⁵⁶⁷⁸⁹⁻')


def sci(v):
    """Scientific notation for log-scale exhibits: 3.8×10²⁵ (plain fmt below 10,000)."""
    if v is None:
        return ''
    if 0 < abs(v) < 1e4 and abs(v) >= 1e-2:
        return fmt(v)
    e = math.floor(math.log10(abs(v)))
    m = v / 10 ** e
    ms = f'{m:.1f}'.rstrip('0').rstrip('.')
    return ('' if ms == '1' else ms + '×') + '10' + str(e).translate(SUP)


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


MONTHS = {m: i for i, m in enumerate(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'])}


def when(label):
    """Label -> months since year 0 (float), or None if it is not a plain date."""
    s = str(label).strip().lower().replace('–', '-').replace('—', '-')
    s = re.sub(r'\s*\(.*?\)\s*', ' ', s).strip()
    m = re.fullmatch(r'(?:(\d{1,2}) )?([a-z]{3})[a-z]*\.? (\d{4})', s)
    if m and m.group(2) in MONTHS:
        return int(m.group(3)) * 12 + MONTHS[m.group(2)] + (int(m.group(1)) / 31 if m.group(1) else 0.5)
    m = re.fullmatch(r'([a-z]{3})[a-z]*-([a-z]{3})[a-z]* (\d{4})', s)
    if m and m.group(1) in MONTHS and m.group(2) in MONTHS:
        a, b = MONTHS[m.group(1)], MONTHS[m.group(2)]
        return int(m.group(3)) * 12 + (a + b + 1) / 2
    m = re.fullmatch(r'q([1-4]) (\d{4})', s)
    if m:
        return int(m.group(2)) * 12 + (int(m.group(1)) - 1) * 3 + 1.5
    m = re.fullmatch(r'h([12]) (\d{4})', s)
    if m:
        return int(m.group(2)) * 12 + (0 if m.group(1) == '1' else 6) + 3
    m = re.fullmatch(r'(end|end of|early|mid|late) (\d{4})', s)
    if m:
        return int(m.group(2)) * 12 + {'end': 11.5, 'end of': 11.5, 'early': 2, 'mid': 6, 'late': 10}[m.group(1)]
    m = re.fullmatch(r'(\d{4})', s)
    if m:
        return int(m.group(1)) * 12 + 6
    return None


def log_line_chart(ex):
    """Log-10 y axis for series spanning many orders of magnitude (e.g. training compute).
    Points may carry a third element, a short annotation drawn beside the marker."""
    series = [s for s in ex.get('series', []) if s.get('points')]
    pts_all = [(p[0], num(p[1])) for s in series for p in s['points'] if (num(p[1]) or 0) > 0]
    labs = labels_of(series)
    T = {l: when(l) for l in labs}
    if len(pts_all) < 2 or any(v is None for v in T.values()):
        return ''
    labs = sorted(labs, key=lambda l: T[l])
    lv = [math.log10(v) for _, v in pts_all]
    lo, hi = math.floor(min(lv)), math.ceil(max(lv))
    if hi == lo:
        hi += 1
    step = max(1, math.ceil((hi - lo) / 8))
    lo = (lo // step) * step
    hi = lo + math.ceil((hi - lo) / step) * step
    top = 46 if len(series) > 1 else 30
    h = H + 40; x0, x1, y0, y1 = 70, W - 130, top, h - 44
    t0, t1 = T[labs[0]], T[labs[-1]]
    X = lambda t: x0 + (t - t0) / ((t1 - t0) or 1) * (x1 - x0)
    Y = lambda v: y1 - (math.log10(v) - lo) / (hi - lo) * (y1 - y0)
    out = svg_open(h, ex.get('title', '')) + legend(series, 14)
    for e in range(lo, hi + 1, step):
        y = y1 - (e - lo) / (hi - lo) * (y1 - y0)
        out += f'<line x1="{x0}" x2="{x1}" y1="{y:.1f}" y2="{y:.1f}" stroke="{GRID}" stroke-width="1"/>'
        out += f'<text x="{x0 - 8}" y="{y + 4:.1f}" font-size="11.5" fill="{AXIS}" text-anchor="end">10{str(e).translate(SUP)}</text>'
    if ex.get('unit'):
        out += f'<text x="{x0 - 8}" y="{y0 - 14}" font-size="11.5" fill="{MUTED}" text-anchor="end">{E(ex["unit"])} (log scale)</text>'
    y_a, y_b = int(t0 // 12), int(t1 // 12) + 1
    span = y_b - y_a
    yst = 10 if span > 40 else 5 if span > 15 else 2 if span > 6 else 1
    for yr in range(((y_a + yst - 1) // yst) * yst, y_b + 1, yst):
        x = X(yr * 12)
        if x0 - 1 <= x <= x1 + 1:
            out += f'<text x="{x:.1f}" y="{h - 22}" font-size="11.5" fill="{AXIS}" text-anchor="middle">{yr}</text>'
            out += f'<line x1="{x:.1f}" x2="{x:.1f}" y1="{y1}" y2="{y1 + 5}" stroke="{AXIS}" stroke-width="1"/>'
    out += f'<line x1="{x0}" x2="{x1}" y1="{y1}" y2="{y1}" stroke="{AXIS}" stroke-width="1"/>'
    for si, s in enumerate(series):
        c = PAL[si % len(PAL)]
        pts = sorted([(T[p[0]], num(p[1]), (p[2] if len(p) > 2 else '')) for p in s['points'] if (num(p[1]) or 0) > 0])
        if ex.get('connect', True) and len(pts) > 1:
            d = ' '.join(f'{"M" if k == 0 else "L"}{X(t):.1f},{Y(v):.1f}' for k, (t, v, _) in enumerate(pts))
            out += f'<path d="{d}" fill="none" stroke="{c}" stroke-width="1.6" stroke-opacity=".45" stroke-linejoin="round"/>'
        for k, (t, v, note) in enumerate(pts):
            out += f'<circle cx="{X(t):.1f}" cy="{Y(v):.1f}" r="4.5" fill="{c}" stroke="#fff" stroke-width="2"><title>{E(note or s["name"])}: {sci(v)} {E(ex.get("unit", ""))}</title></circle>'
            if note:
                above = k % 2 == 0
                out += f'<text x="{X(t) + (7 if X(t) < x1 - 60 else -7):.1f}" y="{Y(v) + (-8 if above else 15):.1f}" font-size="10.5" fill="{INK}" text-anchor="{"start" if X(t) < x1 - 60 else "end"}">{E(str(note)[:24])}</text>'
    return out + '</svg></div>'


def line_chart(ex):
    if ex.get('log'):
        return log_line_chart(ex)
    series = [s for s in ex.get('series', []) if s.get('points')]
    labs = labels_of(series)
    vals = [num(p[1]) for s in series for p in s['points'] if num(p[1]) is not None]
    if not vals or len(labs) < 2:
        return ''
    lo = min(0, min(vals)); hi = nice_max(max(vals))
    top = 46 if len(series) > 1 else 30
    h = H; x0, x1, y0, y1 = 70, W - 120, top, h - 44
    T = {l: when(l) for l in labs}
    timed = all(v is not None for v in T.values()) and len(set(T.values())) == len(labs)
    if timed:  # dated labels: sort chronologically and place in proportion to time
        labs = sorted(labs, key=lambda l: T[l])
        t0, t1 = T[labs[0]], T[labs[-1]]
        X = lambda i: x0 + (T[labs[i]] - t0) / ((t1 - t0) or 1) * (x1 - x0)
    else:
        X = lambda i: x0 + i * (x1 - x0) / max(1, len(labs) - 1)
    Y = lambda v: y1 - (v - lo) / (hi - lo) * (y1 - y0)
    out = svg_open(h, ex.get('title', '')) + legend(series, 14) + yaxis(x0, x1, y0, y1, lo, hi, ex.get('unit', ''))
    shown = []  # x-axis labels: keep the last, drop any closer than 68 units to a kept neighbour
    for i in range(len(labs) - 1, -1, -1):
        if not shown or X(shown[-1]) - X(i) >= 68:
            shown.append(i)
    for i in shown:
        out += f'<text x="{X(i):.1f}" y="{h - 22}" font-size="11.5" fill="{AXIS}" text-anchor="middle">{E(labs[i])}</text>'
    for si, s in enumerate(series):
        c = PAL[si % len(PAL)]
        pts = sorted([(labs.index(p[0]), num(p[1])) for p in s['points'] if num(p[1]) is not None])
        d = ' '.join(f'{"M" if k == 0 else "L"}{X(i):.1f},{Y(v):.1f}' for k, (i, v) in enumerate(pts))
        out += f'<path d="{d}" fill="none" stroke="{c}" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round"/>'
        for i, v in pts:
            out += f'<circle cx="{X(i):.1f}" cy="{Y(v):.1f}" r="4.5" fill="{c}" stroke="#fff" stroke-width="2"><title>{E(s["name"])}, {E(labs[i])}: {fmt(v)} {E(ex.get("unit", ""))}</title></circle>'
        li, lv = pts[-1]
        out += f'<text x="{X(li) + 9:.1f}" y="{Y(lv) + 4:.1f}" font-size="12.5" font-weight="600" fill="{INK}">{fmt(lv)}</text>'
        if len(series) > 1 and len(series) <= 4:
            out += f'<text x="{X(li) + 9:.1f}" y="{Y(lv) + 18:.1f}" font-size="10.5" fill="{MUTED}">{E(str(s["name"])[:22])}</text>'
        if len(pts) > 1:
            fi, fv = pts[0]
            out += f'<text x="{X(fi) + 6:.1f}" y="{Y(fv) - 10:.1f}" font-size="11.5" fill="{MUTED}" text-anchor="start">{fmt(fv)}</text>'
    return out + '</svg></div>'


def bar_chart(ex, grouped=False):
    global H
    series = [s for s in ex.get('series', []) if s.get('points')]
    if not grouped:
        series = series[:1]
    maxes = [max((num(p[1]) or 0) for p in s['points']) for s in series]
    if grouped and len(series) > 1 and min(maxes) > 0 and max(maxes) / min(maxes) > 20:
        # one axis would flatten the smaller series: draw small multiples, each on its own scale
        keep, H = H, 210
        try:
            parts = [f'<div class="tai-mm-t">{E(s["name"])} <span>(own scale)</span></div>' + bar_chart(dict(ex, series=[s]))
                     for s in series]
        finally:
            H = keep
        return '<div class="tai-mm">' + ''.join(parts) + '</div>'
    labs = labels_of(series)
    vals = [num(p[1]) for s in series for p in s['points'] if num(p[1]) is not None]
    if not vals:
        return ''
    lo = min(0, min(vals)); hi = nice_max(max(vals)) if max(vals) > 0 else 1
    top = 46 if len(series) > 1 else 30
    h = H; x0, x1, y0, y1 = 70, W - 20, top, h - 44
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
    nyears = (hi - lo) // 12
    if nyears > 16:  # long spans: gridlines and labels per decade (or 5 years), placed on the line
        st = 10 if nyears > 40 else 5
        lo = (lo // (12 * st)) * 12 * st; hi = -(-hi // (12 * st)) * 12 * st
        for yv in range(lo // 12, hi // 12 + 1, st):
            x = X(yv * 12)
            out += f'<line x1="{x:.1f}" x2="{x:.1f}" y1="{top - 6}" y2="{h - 26}" stroke="{GRID}" stroke-width="1"/>'
            out += f'<text x="{x:.1f}" y="{h - 10}" font-size="11.5" fill="{AXIS}" text-anchor="middle">{yv}</text>'
    for yv in (range(lo // 12, hi // 12 + 1) if nyears <= 16 else []):
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
        f_ = sci if ex.get('log') else fmt
        if any(len(p) > 2 for s in series for p in s['points']):  # annotated points: one row per point
            cols = ['Date', 'Item', ex.get('unit', '') or 'Value']
            rows = [[p[0], p[2] if len(p) > 2 else s['name'], f_(num(p[1]))] for s in series for p in s['points']]
        else:
            cols = [''] + [s['name'] for s in series]
            rows = [[l] + [next((f_(num(p[1])) for p in s['points'] if p[0] == l), '') for s in series] for l in labs]
    return f'<details class="tai-exdata"><summary>View the data</summary>{table_html(cols, rows)}</details>'


STAMP_SPRITE = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs>'
    '<path id="rai-ring" d="M18,80 a62,62 0 1,1 124,0 a62,62 0 1,1 -124,0"/>'
    '<symbol id="rai-stamp" viewBox="0 0 160 160"><g fill="none" stroke="#2545f5"><circle cx="80" cy="80" r="76" stroke-width="3.2"/>'
    '<circle cx="80" cy="80" r="72" stroke-width=".9"/><circle cx="80" cy="80" r="50" stroke-width="1.6"/></g>'
    '<g fill="#2545f5"><text font-family="IBM Plex Mono,monospace" font-size="10" font-weight="600"><textPath href="#rai-ring" textLength="386" lengthAdjust="spacing">'
    'SOURCED · DATED · CONFIDENCE-RATED · REPORT-AI.ORG ·</textPath></text>'
    '<text x="80" y="75" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="900" font-size="17">REPORT</text>'
    '<text x="80" y="104" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="900" font-size="32">AI</text>'
    '<text x="80" y="117" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-weight="600" font-size="6.6" letter-spacing="1">BY THE NUMBERS</text></g>'
    '<path d="M56 83H104" stroke="#2545f5" stroke-width="1.2"/></symbol></defs></svg>')
STAMP_USE = '<svg class="tai-ex-stamp" viewBox="0 0 160 160" role="img" aria-label="Report AI stamp"><use href="#rai-stamp"/></svg>'
WORDMARK = '<span class="tai-ex-wm">REPORT<b>AI</b> <i>report-ai.org</i></span>'


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
    return (f'<figure class="tai-ex" id="exhibit-{n}">{STAMP_USE}<div class="tai-ex-n">Exhibit {n}</div>'
            f'<div class="tai-ex-t">{E(ex.get("title", ""))}</div>'
            f'<div class="tai-ex-s">{E(ex.get("subtitle", ""))}</div>{body}{data_table(ex) if body and t != "table" else ""}'
            f'<figcaption class="tai-ex-src">{E(ex.get("source", ""))}{chip}{notes}{WORDMARK}</figcaption></figure>')


CSS = """.tai-ex{position:relative;margin:26px 0 30px;padding:22px 0 0;border-top:2px solid #111114;max-width:900px;}
.tai-ex-stamp{position:absolute;top:10px;right:0;width:76px;height:76px;transform:rotate(-8deg);opacity:.9;}
.tai-ex-t,.tai-ex-s{padding-right:90px;}
.tai-ex-wm{display:block;text-align:right;margin-top:6px;font-family:'Archivo',sans-serif;font-weight:900;font-size:15px;letter-spacing:-.02em;color:#111114;}.tai-ex-wm b{color:#2545f5;font-weight:900;}.tai-ex-wm i{font-style:normal;font-family:'IBM Plex Mono',monospace;font-weight:400;font-size:11.5px;color:#77777f;letter-spacing:0;margin-left:6px;}
@media(max-width:600px){.tai-ex-stamp{width:56px;height:56px;}.tai-ex-t,.tai-ex-s{padding-right:64px;}}
.tai-ex-n{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#2545f5;margin-bottom:6px;}
.tai-ex-t{font-weight:800;font-size:19px;line-height:1.3;letter-spacing:-0.01em;color:#111114;margin-bottom:4px;}
.tai-ex-s{font-size:13.5px;color:#6e6e76;margin-bottom:14px;}
.tai-mm-t{font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:600;color:#33333a;margin:12px 0 2px;}.tai-mm-t span{font-weight:400;color:#77777f;}
.tai-ex-svg{overflow-x:auto;-webkit-overflow-scrolling:touch;}
.tai-ex-svg text{font-family:'IBM Plex Mono',monospace;}
.tai-ex-src{font-size:12px;line-height:1.5;color:#77777f;margin-top:10px;border-top:1px solid #e6e6ea;padding-top:8px;}
.tai-exdata{margin-top:8px;font-size:12.5px;}.tai-exdata summary{cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#2545f5;}
"""
