#!/usr/bin/env python3
"""
Brew-n-Chill — NATIVE-FIRST page generator.

Produces Gutenberg content that uses core presets and blocks instead of
custom inline HTML/CSS wherever possible:

  * Colours -> palette slugs (has-navy-background-color, has-teal-color, ...)
    — these slugs match the brand theme.json in this folder. Add that
    theme.json to a Hello Biz child theme, or activate a block theme
    (Twenty Twenty-Five works well) with these palette entries.
  * Font sizes -> slugs (small / medium / large / x-large / xx-large / hero).
  * Layouts -> align="wide" / "full" and layout.type="constrained" (no CSS).
  * Top nav -> a single core wp:navigation ref (one shared menu across pages),
    NOT a hand-coded <p> of links.
  * Buttons, cover, columns, media-text, image, table -> stock blocks.

Regenerates preview HTML and a JSON with each page's block content ready
for pages.update once the WordPress API is reachable again.
"""
import json, os

# ---- palette slug names — must exist in theme.json for the site to render them nicely
COLORS = {
    "navy": "navy", "navy-dark": "navy-dark", "teal": "teal",
    "teal-bright": "teal-bright", "teal-soft": "teal-soft",
    "cream": "cream", "white": "white", "muted": "muted", "faint": "faint",
}

NAV_REF_ID = "REPLACE_WITH_wp_navigation_ID"  # set once the menu exists

# ---- small block helpers (native attrs, minimal inline style) --------------

def nav_block():
    """Shared native Navigation block — one menu, referenced everywhere."""
    return (
        f'<!-- wp:navigation {{"ref":{NAV_REF_ID},"overlayMenu":"mobile",'
        f'"layout":{{"type":"flex","justifyContent":"center"}}}} /-->'
    )

def hero_cover(image_url, alt, h1, sub, ctas):
    buttons = "".join(
        f'<!-- wp:button {{"backgroundColor":"{c}","textColor":"white"}} -->'
        f'<div class="wp-block-button"><a class="wp-block-button__link has-{c}-background-color '
        f'has-white-color has-text-color has-background wp-element-button" href="{href}">{label}</a></div>'
        f'<!-- /wp:button -->'
        for c, label, href in ctas
    )
    return (
        f'<!-- wp:cover {{"url":"{image_url}","dimRatio":50,"overlayColor":"navy","align":"full","minHeight":540}} -->'
        f'<div class="wp-block-cover alignfull" style="min-height:540px">'
        f'<span aria-hidden="true" class="wp-block-cover__background has-navy-background-color has-background-dim"></span>'
        f'<img class="wp-block-cover__image-background" alt="{alt}" src="{image_url}" data-object-fit="cover"/>'
        f'<div class="wp-block-cover__inner-container">'
        f'<!-- wp:heading {{"textAlign":"center","level":1,"textColor":"white","fontSize":"hero"}} -->'
        f'<h1 class="wp-block-heading has-text-align-center has-white-color has-text-color has-hero-font-size">{h1}</h1>'
        f'<!-- /wp:heading -->'
        f'<!-- wp:paragraph {{"align":"center","textColor":"cream","fontSize":"medium"}} -->'
        f'<p class="has-text-align-center has-cream-color has-text-color has-medium-font-size">{sub}</p>'
        f'<!-- /wp:paragraph -->'
        f'<!-- wp:buttons {{"layout":{{"type":"flex","justifyContent":"center"}}}} -->'
        f'<div class="wp-block-buttons">{buttons}</div>'
        f'<!-- /wp:buttons -->'
        f'</div></div><!-- /wp:cover -->'
    )

def band(bg_slug, inner, wide=True):
    """Group section with a palette background — one style attr, no CSS."""
    align = ' "align":"full",'
    return (
        f'<!-- wp:group {{{align}"backgroundColor":"{bg_slug}","layout":{{"type":"constrained"}}}} -->'
        f'<div class="wp-block-group alignfull has-{bg_slug}-background-color has-background">{inner}</div>'
        f'<!-- /wp:group -->'
    )

def h(level, text, color="navy", size=None):
    fs = f',"fontSize":"{size}"' if size else ""
    cls = f'has-{color}-color has-text-color' + (f' has-{size}-font-size' if size else '')
    return (f'<!-- wp:heading {{"level":{level},"textColor":"{color}"{fs}}} -->'
            f'<h{level} class="wp-block-heading {cls}">{text}</h{level}>'
            f'<!-- /wp:heading -->')

def p(text, color="muted", size=None, align=None):
    parts, cls = [], []
    if color: parts.append(f'"textColor":"{color}"'); cls.append(f'has-{color}-color has-text-color')
    if size:  parts.append(f'"fontSize":"{size}"');   cls.append(f'has-{size}-font-size')
    if align: parts.append(f'"align":"{align}"');     cls.append(f'has-text-align-{align}')
    attrs = ',' .join(parts)
    return (f'<!-- wp:paragraph {{{attrs}}} -->'
            f'<p class="{" ".join(cls)}">{text}</p>'
            f'<!-- /wp:paragraph -->')

def ul(items):
    lis = "".join(f"<li>{i}</li>" for i in items)
    return f'<!-- wp:list --><ul class="wp-block-list">{lis}</ul><!-- /wp:list -->'

def cta_button(label, href, bg="teal", fg="white"):
    return (f'<!-- wp:buttons {{"layout":{{"type":"flex","justifyContent":"center"}}}} -->'
            f'<div class="wp-block-buttons"><!-- wp:button {{"backgroundColor":"{bg}","textColor":"{fg}"}} -->'
            f'<div class="wp-block-button"><a class="wp-block-button__link has-{bg}-background-color '
            f'has-{fg}-color has-text-color has-background wp-element-button" href="{href}">{label}</a></div>'
            f'<!-- /wp:button --></div><!-- /wp:buttons -->')

def image(src, alt, radius=True):
    style = ',"style":{"border":{"radius":"12px"}}' if radius else ""
    return (f'<!-- wp:image {{"sizeSlug":"large"{style}}} -->'
            f'<figure class="wp-block-image size-large has-custom-border">'
            f'<img src="{src}" alt="{alt}"' + (' style="border-radius:12px"' if radius else '') + '/></figure>'
            f'<!-- /wp:image -->')

def cols(*columns, wide=True):
    align = ' {"align":"wide"}' if wide else ''
    inner = "".join(
        f'<!-- wp:column --><div class="wp-block-column">{c}</div><!-- /wp:column -->'
        for c in columns
    )
    return (f'<!-- wp:columns {{"align":"wide"}} -->'
            f'<div class="wp-block-columns alignwide">{inner}</div>'
            f'<!-- /wp:columns -->')

def footer():
    """Native footer using columns + site-title/paragraph, no CSS."""
    site = (h(3, "Brew-n-Chill", color="white") +
            p("Coffee &amp; ice cream from one automated Robo-Barista — 24/7, zero staffing.",
              color="faint"))
    explore = (h(3, "Explore", color="white", size="medium") +
               p('<a href="/">Home</a><br><a href="/how-it-works/">How It Works</a><br>'
                 '<a href="/machines/">Robo-Barista</a><br><a href="/industries/">Industries</a>',
                 color="cream"))
    more = (h(3, "More", color="white", size="medium") +
            p('<a href="/pricing-roi/">Pricing &amp; ROI</a><br>'
              '<a href="/owners/">Own a Robo-Barista</a><br>'
              '<a href="/our-coffee/">Our Coffee</a><br>'
              '<a href="/about/">About</a>', color="cream"))
    contact = (h(3, "Get in touch", color="white", size="medium") +
               p('<a href="/contact/"><strong>Book a Free Demo</strong></a><br>'
                 '<a href="mailto:info@brew-n-chill.com">info@brew-n-chill.com</a><br>'
                 '<a href="tel:+16479997433">+1 647-999-7433</a><br>'
                 'Serving: US · Canada · UAE · Saudi Arabia', color="cream"))
    inner = cols(site, explore, more, contact) + p(
        "© 2026 Brew-n-Chill. All rights reserved.",
        color="faint", size="small", align="center")
    return band("navy-dark", inner)

# ---- assemble a page from parts, ONLY blocks -------------------------------

def page(slug, title, seo_title, seo_desc, sections):
    body = nav_block() + "\n" + "\n".join(sections) + "\n" + footer()
    return dict(slug=slug, title=title,
                seo_title=seo_title, seo_desc=seo_desc, content=body)

# ---- pages ----------------------------------------------------------------

HOME = page(
    "home",
    "Brew-n-Chill — Coffee & Ice Cream Robo-Barista",
    "Robo-Barista: Coffee & Ice Cream Machine for Business | Brew-n-Chill",
    "Automated Robo-Barista serving barista-grade coffee and soft-serve ice cream 24/7. "
    "Zero staffing. Offices, gyms, malls, hotels. Book a free demo.",
    [
        hero_cover(
            "https://picsum.photos/seed/brewhero/1600/900",
            "Brew-n-Chill Robo-Barista",
            "Coffee and ice cream. From one robot. 24/7.",
            "The Brew-n-Chill Robo-Barista serves barista-grade coffee AND soft-serve ice cream "
            "in under 60 seconds — for offices, gyms, hotels, malls and campuses.",
            [("teal", "Book a Free Demo", "/contact/"),
             ("teal-bright", "Meet the Robo-Barista", "/machines/")],
        ),
        band("white",
            h(2, "One machine, two cravings", color="navy", size="x-large") +
            p("The name is the menu. <strong>Brew</strong> the coffee, <strong>Chill</strong> "
              "with ice cream — both poured by the same robot, both on our own Brew-n-Chill brand.",
              color="muted", align="center", size="medium") +
            cols(
                band("teal-soft",
                    h(3, "☕ Brew", color="navy") +
                    p("Espresso, latte, cappuccino, cold brew — specialty beans dialled in for "
                      "the machine.", color="muted"), wide=False),
                band("cream",
                    h(3, "🍦 Chill", color="teal") +
                    p("Soft-serve ice cream, frozen treats, iced refreshers — a second profit "
                      "centre from the same footprint.", color="muted"), wide=False),
            )),
        # stats
        band("cream",
            cols(
                h(2, "60 sec", color="teal", size="xx-large") +
                p("From tap to finished serve.", color="muted", align="center"),
                h(2, "24/7", color="teal", size="xx-large") +
                p("Self-serve, unattended, every hour.", color="muted", align="center"),
                h(2, "~2 m²", color="teal", size="xx-large") +
                p("Coffee bar + ice-cream stand in one tiny footprint.", color="muted", align="center"),
            )),
        # CTA
        band("teal",
            h(2, "Ready to taste it?", color="white", size="x-large") +
            p("Tell us about your space and we'll recommend a Robo-Barista, model the economics "
              "and arrange a tasting.", color="cream", align="center") +
            cta_button("Book a Free Demo", "/contact/", bg="navy")),
    ])

# (Machines, Pricing, Owners, Industries, Our Coffee, How It Works, About, FAQ,
#  Contact pages follow the same builder pattern — omitted here for brevity but
#  each one just chains hero_cover + band(...) + cta_button + footer.)
PAGES = [HOME]

def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(here, "native_pages.json")
    json.dump([{k: v for k, v in pg.items()} for pg in PAGES], open(out, "w"), indent=2)
    print(f"wrote {out}  ({len(PAGES)} pages ready — extend this file for the rest)")

if __name__ == "__main__":
    main()
