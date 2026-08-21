# -*- coding: utf-8 -*-
"""Strip structured data that claims things the page does not show.

Two standing rules for this site:

  aggregateRating — always removed. Every page carried ratingValue 4.9 /
    reviewCount 2500, but none of them display a single review. Google's
    review-snippet policy requires the rated content to be visible on the
    page, so this is a markup-only claim.

  FAQPage — removed ONLY when the page has no visible FAQ. The course pages
    render 16 real <details>/<summary> entries, so their FAQPage is honest and
    must be kept. The homepage declares four questions it never shows, so
    there it goes.

Used by the translation generators and by the one-off sweep, so a
regenerated page can never quietly reintroduce either.
"""
import re, json

LD = re.compile(r'(<script type="application/ld\+json">)(.*?)(</script>)', re.S)


def has_visible_faq(html):
    return bool(re.search(r'<summary\b', html, re.I))


def clean_html(html, drop_faq=None):
    """Return (cleaned_html, notes). drop_faq=None decides from visible FAQs."""
    if drop_faq is None:
        drop_faq = not has_visible_faq(html)
    notes = []

    def fix(m):
        head, body, tail = m.group(1), m.group(2), m.group(3)
        try:
            obj = json.loads(body)
        except ValueError:
            return m.group(0)

        def walk(node):
            if isinstance(node, list):
                out = []
                for n in node:
                    if drop_faq and isinstance(n, dict) and n.get('@type') == 'FAQPage':
                        notes.append('FAQPage (%d questions, none visible)'
                                     % len(n.get('mainEntity', [])))
                        continue
                    out.append(walk(n))
                return out
            if not isinstance(node, dict):
                return node
            if 'aggregateRating' in node:
                ar = node.pop('aggregateRating')
                notes.append('aggregateRating %s from %s reviews'
                             % (ar.get('ratingValue'), ar.get('reviewCount')))
            if drop_faq and node.get('@type') == 'FAQPage':
                notes.append('FAQPage (%d questions, none visible)'
                             % len(node.get('mainEntity', [])))
                return None
            for k, v in list(node.items()):
                node[k] = walk(v)
            return node

        before = len(notes)
        obj = walk(obj)
        if len(notes) == before:
            return m.group(0)  # nothing to strip — leave the block byte-identical
        if obj is None:
            return ''
        if isinstance(obj, dict) and '@graph' in obj:
            obj['@graph'] = [n for n in obj['@graph'] if n is not None]
        return head + '\n' + json.dumps(obj, ensure_ascii=False, indent=2) + '\n' + tail

    return LD.sub(fix, html), notes
