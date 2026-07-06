#!/usr/bin/env python3
"""Build the new ( 04 ) — What you can teach wp:group blocks for SPC and ASPC pages."""
import os
OUT = "/tmp/claude-0/-home-user-test/64e476a6-2f18-52ab-88ab-b28688212ae0/scratchpad"
os.makedirs(OUT, exist_ok=True)

BADGE = {
 'SA':   'https://agile-agilist.com/wp-content/uploads/2026/05/SAFe-Badge_SA.png',
 'SSM':  'https://agile-agilist.com/wp-content/uploads/2025/11/SAFe-Badge_SSM-AI.png',
 'POPM': 'https://agile-agilist.com/wp-content/uploads/2025/11/SAFe-Badge_POPM-AI.png',
 'SASM': 'https://agile-agilist.com/wp-content/uploads/2026/05/SAFe-Badge_SASM.png',
 'RTE':  'https://agile-agilist.com/wp-content/uploads/2025/11/RTE-AI.png',
 'LPM':  'https://agile-agilist.com/wp-content/uploads/2025/08/LPM.png',
 'APM':  'https://agile-agilist.com/wp-content/uploads/2025/08/APM.png',
}
PC = ('<a href="{href}" class="aa-pcard" style="flex-direction:column;align-items:center;'
      'text-align:center;gap:12px;padding:22px 14px;min-height:0">')
def img_card(href, badge, name):
    return (PC.format(href=href) +
            f'<img class="aa-pcard-badge" width="48" height="48" src="{badge}" alt="{name} badge" '
            f'style="width:48px!important;height:48px!important">'
            f'<h3 class="aa-pcard-h" style="margin:0;font-size:16px;line-height:1.25;font-weight:400">{name}</h3></a>')
def text_card(href, code, name):
    return (PC.format(href=href) +
            f'<span class="badge badge-sm" aria-hidden="true" style="width:48px;height:48px">'
            f'<b>{code}</b><i>CERT</i></span>'
            f'<h3 class="aa-pcard-h" style="margin:0;font-size:16px;line-height:1.25;font-weight:400">{name}</h3></a>')

FOUND = [
    img_card('/training/safe/sa/', BADGE['SA'], 'Leading SAFe (SA)'),
    text_card('/training/safe-industry/team-practitioner/', 'SP', 'SAFe for Teams (SP)'),
    img_card('/training/safe/scrum-master/', BADGE['SSM'], 'SAFe Scrum Master (SSM)'),
    img_card('/training/safe/popm/', BADGE['POPM'], 'Product Owner / Manager (POPM)'),
    text_card('/training/safe/devops/', 'SDP', 'SAFe DevOps (SDP)'),
    text_card('/training/safe/bo/', 'BO', 'Business Owner (BO)'),
    text_card('/training/safe-industry/arch/', 'ARCH', 'SAFe for Architects'),
    text_card('/training/safe-industry/ase/', 'ASE', 'Agile Software Engineering (ASE)'),
]
ADV = [
    img_card('/training/safe/asm/', BADGE['SASM'], 'Advanced Scrum Master (SASM)'),
    img_card('/training/adv-safe/rte/', BADGE['RTE'], 'Release Train Engineer (RTE)'),
    img_card('/training/adv-safe/lpm/', BADGE['LPM'], 'Lean Portfolio Management (LPM)'),
    img_card('/training/adv-safe/apm/', BADGE['APM'], 'Agile Product Management (APM)'),
]
GRID = '<div class="aa-pathgrid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px">'
FOOT = ('<p class="aa-sub" style="max-width:660px;margin-top:22px">Also included: '
        '<strong>SAFe for Government</strong>, <strong>SAFe for Hardware</strong>, and every SAFe '
        'micro-credential &mdash; Value Stream Mapping, Conflict &amp; Collaboration, Responsible AI, '
        'and Agile Contracting for Government.</p>')

def block(sub, groups):
    body = f'<p class="aa-sub" style="max-width:660px;margin-top:12px">{sub}</p>\n'
    for cap, cards in groups:
        body += f'<div class="aa-pathcap">{cap}</div>\n' + GRID + '\n' + '\n'.join(cards) + '\n</div>\n'
    body += FOOT
    return (
        '<!-- wp:group {"tagName":"section","className":"aa-sec","layout":{"type":"default"}} -->\n'
        '<section class="wp-block-group aa-sec" id="path">\n'
        '<!-- wp:paragraph {"className":"aa-eyebrow"} --><p class="aa-eyebrow">( 04 ) — What you can teach</p><!-- /wp:paragraph -->\n'
        '<!-- wp:heading {"level":2,"className":"aa-h2"} --><h2 class="wp-block-heading aa-h2">Classes you’re <em>licensed to teach.</em></h2><!-- /wp:heading -->\n'
        '<!-- wp:html -->\n' + body + '\n<!-- /wp:html -->\n'
        '</section>\n'
        '<!-- /wp:group -->'
    )

spc = block(
    'As an authorised <strong>SAFe&reg; Practice Consultant (SPC)</strong> you’re licensed to teach '
    'the full set of Foundational SAFe courses and every SAFe micro-credential. The Advanced courses '
    '(SASM, RTE, LPM, APM) require ASPC; Implementing SAFe and ASPC are taught by SPCTs. These are pulled from our live course catalogue.',
    [('Foundational certifications you can teach', FOUND)],
)
aspc = block(
    'As an <strong>Advanced SAFe&reg; Practice Consultant (ASPC)</strong> you can teach everything an SPC can '
    '— plus the Advanced SAFe courses. The full catalogue you’re licensed to deliver is below. '
    '(Implementing SAFe and the ASPC course itself remain SPCT-only.)',
    [('Foundational certifications', FOUND), ('Advanced certifications', ADV)],
)

open(f'{OUT}/block-spc.html','w').write(spc)
open(f'{OUT}/block-aspc.html','w').write(aspc)
print("SPC block bytes:", len(spc), "| cards:", spc.count('class="aa-pcard"'))
print("ASPC block bytes:", len(aspc), "| cards:", aspc.count('class="aa-pcard"'))
print("OK -> block-spc.html, block-aspc.html")
