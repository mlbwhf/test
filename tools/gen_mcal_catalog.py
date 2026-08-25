#!/usr/bin/env python3
"""Emit the PHP course catalog for the calendar snippet.

The calendar is keyed by event_category term slug, courses.json by course-page
slug, and the two are not the same string (event "sasm" is course
safe-advanced-scrum-master-sasm at /training/safe/asm/). MAP below is the only
hand-maintained part; duration, exam wording and the description come straight
from courses.json so they cannot drift from the course pages.

Courses with no courses.json row (BO, SA-Gov, the micro-credentials) still get
an entry — name, track and URL — and simply carry no description. The panel
omits what is missing rather than printing a placeholder.

NO PRICE IS EMITTED, deliberately. Every one of the 13 prices in courses.json
disagrees with the live course page (SA 850 vs 997, ASPC 2495 vs 2899, ARCH
1295 vs 2200 — checked, all 13 mismatch), so that file cannot be the source of
a number shown next to a Register button. The panel reads a per-cohort `price`
event meta when one exists — per-cohort is the more correct model anyway, since
early-bird and group rates vary by date — and otherwise shows no price at all
and sends the visitor to the course page, where the authoritative price lives.
Do not "fix" this by re-adding the courses.json price; fix courses.json first.

    python3 tools/gen_mcal_catalog.py > /tmp/catalog.php
"""
import html
import json
import re

# Track palette, verbatim from the design handoff's Design Tokens table.
TRACKS = {
    'role':  ('SAFe by Role',      '#0E8074', '#E7F2F0', '#C6E1DC'),
    'adv':   ('Advanced SAFe',     '#1F6FB2', '#E8F1F9', '#C7DEEF'),
    'port':  ('Portfolio & Lean',  '#7A4FA3', '#F1EAF7', '#DCC9EA'),
    'ai':    ('AI-Native',         '#D34B2A', '#FBEAE4', '#F2CDC0'),
    'micro': ('Micro-Credentials', '#2E7D5B', '#E7F3ED', '#C6E3D5'),
}

# event_category slug -> (courses.json slug or None, track, course page URL)
# The design ships five tracks and no "by industry" one. ARCH and ASE are
# advanced technical courses so they sit in Advanced SAFe; SA-Gov is a Leading
# SAFe variant so it sits with the role courses. Move them if that reads wrong.
MAP = {
    'aspc':  ('advanced-safe-practice-consultant-aspc',   'adv',   '/training/adv-safe/aspc/'),
    'spc':   ('implementing-safe-spc',                    'adv',   '/training/adv-safe/spc/'),
    'rte':   ('safe-rte',                                 'adv',   '/training/adv-safe/rte/'),
    'lpm':   ('safe-lean-portfolio-management-lpm',       'port',  '/training/adv-safe/lpm/'),
    'apm':   ('safe-agile-product-management-apm',        'port',  '/training/adv-safe/apm/'),
    'sa':    ('leading-safe-sa',                          'role',  '/training/safe/sa/'),
    'ssm':   ('safe-scrum-master-ssm',                    'role',  '/training/safe/scrum-master/'),
    'popm':  ('safe-popm',                                'role',  '/training/safe/popm/'),
    'sdp':   ('safe-devops-sdp',                          'role',  '/training/safe/devops/'),
    'sasm':  ('safe-advanced-scrum-master-sasm',          'role',  '/training/safe/asm/'),
    'asm':   ('safe-advanced-scrum-master-sasm',          'role',  '/training/safe/asm/'),
    'sp':    ('safe-for-teams-sp',                        'role',  '/training/safe-industry/team-practitioner/'),
    'bo':    (None,                                       'role',  '/training/safe/bo/'),
    'arch':  ('safe-architect-arch',                      'adv',   '/training/safe-industry/arch/'),
    'ase':   ('safe-agile-software-engineering-ase',      'adv',   '/training/safe-industry/ase/'),
    'sagov': (None,                                       'role',  '/training/safe-industry/sa-gov/'),
    'ai-native': ('ai-native-foundations',                'ai',    '/training/ai-native/'),
    'micro-conflict': (None, 'micro', '/training/safe-found/conflict-collaboration/'),
    'micro-vsm':      (None, 'micro', '/training/safe-found/value-stream-mapping/'),
    'micro-rai':      (None, 'micro', '/training/safe-found/responsible-ai-safe/'),
    'micro-gov':      (None, 'micro', '/training/safe-found/agile-contracting-government/'),
}

# Names for the rows courses.json does not carry, taken from the live pages.
FALLBACK_NAMES = {
    'bo':    ('BO',      'SAFe® Business Owner'),
    'sagov': ('SA-GOV',  'Leading SAFe® for Government'),
    'micro-conflict': ('CONFLICT', 'Advanced Facilitator: Conflict & Collaboration'),
    'micro-vsm':      ('VSM',      'Advanced Facilitator: Value Stream Mapping'),
    'micro-rai':      ('RAI',      'Achieving Responsible AI with SAFe'),
    'micro-gov':      ('GOV',      'Agile Contracting for Government'),
}


def clean(s, limit=None):
    """courses.json copy carries HTML entities and markup; the panel wants text."""
    if not s:
        return ''
    s = re.sub(r'<[^>]+>', '', s)
    s = html.unescape(s).replace(' ', ' ')
    s = re.sub(r'\s+', ' ', s).strip()
    if limit and len(s) > limit:
        cut = s[:limit].rsplit(' ', 1)[0]
        s = cut.rstrip('.,;:') + '…'
    return s


def php(s):
    return "'" + str(s).replace('\\', '\\\\').replace("'", "\\'") + "'"


def num(s):
    """Leading integer of "3 days" / "60 multiple-choice" / "24 PDUs / SEUs".

    Only NUMBERS cross into the catalog; every word around them is added in
    JS from the locale strings table. Emitting the English phrases meant the
    Spanish panel read "3 days en vivo" and the French "60 multiple-choice",
    because those fragments came from courses.json and were never translated.

    courses.json uses «TBC» where a course is not yet specified (STE). That
    yields 0 here, and the JS omits the bullet — a visitor must never be shown
    a placeholder token.
    """
    m = re.match(r'\s*(\d+)', clean(s) or '')
    return int(m.group(1)) if m else 0


def main():
    courses = {c['slug']: c for c in json.load(open('redesign-build/courses.json'))['courses']}
    rows = []
    for term, (cslug, track, url) in MAP.items():
        c = courses.get(cslug) if cslug else None
        if c:
            code = c['code']
            name = clean(c.get('cert') or c.get('title'))
            desc = clean(c.get('hero_sub'), 130)
            duration = num(c.get('duration'))
            pdus = num(c.get('pdus'))
            ex = c.get('exam') if isinstance(c.get('exam'), dict) else {}
            exam_q = num(ex.get('format'))
            exam_m = num(ex.get('duration'))
        else:
            code, name = FALLBACK_NAMES.get(term, (term.upper(), term.upper()))
            desc, duration, pdus, exam_q, exam_m = '', 0, 0, 0, 0
        t = TRACKS[track]
        rows.append(
            "\t\t%-18s => array( 'code' => %-10s 'name' => %s,\n"
            "\t\t\t'track' => %s, 'color' => %s, 'tint' => %s, 'tint_border' => %s,\n"
            "\t\t\t'url' => %s, 'days' => %d, 'pdus' => %d, 'exam_q' => %d, 'exam_m' => %d,\n"
            "\t\t\t'desc' => %s ),"
            % (php(term), php(code) + ',', php(name),
               php(t[0]), php(t[1]), php(t[2]), php(t[3]),
               php(url), duration, pdus, exam_q, exam_m,
               php(desc))
        )
    print("\n".join(rows))


if __name__ == '__main__':
    main()
