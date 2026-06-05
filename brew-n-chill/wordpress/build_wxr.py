#!/usr/bin/env python3
"""
Brew-n-Chill website builder.

Single source of truth for all page content. Running this script produces:
  1. wordpress/brew-n-chill.wordpress.xml  -> import via WP Admin > Tools > Import > WordPress
  2. content/<slug>.html                   -> human-readable previews of every page

Content is authored in Gutenberg block markup so it remains fully editable in the
WordPress block editor after import. Copy is grounded in the research captured in
research/market-research.md.

Usage:
    python3 wordpress/build_wxr.py
"""

import html
import os
import datetime

SITE_TITLE = "Brew-n-Chill"
SITE_URL = "https://brew-n-chill.com"
AUTHOR_LOGIN = "admin"
AUTHOR_EMAIL = "hello@brew-n-chill.com"
NOW = datetime.datetime.utcnow()

# ---------------------------------------------------------------------------
# Small Gutenberg block helpers
# ---------------------------------------------------------------------------

def h(text, level=2):
    return f'<!-- wp:heading {{"level":{level}}} -->\n<h{level} class="wp-block-heading">{text}</h{level}>\n<!-- /wp:heading -->'

def p(text):
    return f'<!-- wp:paragraph -->\n<p>{text}</p>\n<!-- /wp:paragraph -->'

def lead(text):
    return ('<!-- wp:paragraph {"fontSize":"large"} -->\n'
            f'<p class="has-large-font-size">{text}</p>\n<!-- /wp:paragraph -->')

def ul(items):
    lis = "".join(f"<li>{i}</li>" for i in items)
    return f'<!-- wp:list -->\n<ul class="wp-block-list">{lis}</ul>\n<!-- /wp:list -->'

def button(text, url):
    return ('<!-- wp:buttons -->\n<div class="wp-block-buttons"><!-- wp:button -->\n'
            f'<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="{url}">{text}</a></div>\n'
            '<!-- /wp:button --></div>\n<!-- /wp:buttons -->')

def quote(text, cite):
    return ('<!-- wp:quote -->\n<blockquote class="wp-block-quote">'
            f'<p>{text}</p><cite>{cite}</cite></blockquote>\n<!-- /wp:quote -->')

def separator():
    return '<!-- wp:separator -->\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n<!-- /wp:separator -->'

def columns(*cols):
    """Each col is a list of block strings."""
    inner = ""
    for col in cols:
        inner += ('<!-- wp:column -->\n<div class="wp-block-column">'
                  + "\n".join(col) + '</div>\n<!-- /wp:column -->')
    return f'<!-- wp:columns -->\n<div class="wp-block-columns">{inner}</div>\n<!-- /wp:columns -->'

def join(*blocks):
    return "\n\n".join(b for b in blocks if b)

# ---------------------------------------------------------------------------
# Page content
# ---------------------------------------------------------------------------

PAGES = []

def page(slug, title, menu_order, content, excerpt="", parent=0, is_front=False, template=""):
    PAGES.append(dict(slug=slug, title=title, menu_order=menu_order, content=content,
                      excerpt=excerpt, parent=parent, is_front=is_front, template=template))

# --- HOME -------------------------------------------------------------------
page("home", "Brew-n-Chill — Automated Coffee Kiosks for Your Space", 0, is_front=True,
     excerpt="Brew-n-Chill installs and services fully automated coffee kiosks for offices, gyms, hotels, campuses and clinics — barista-grade coffee, zero staffing, served 24/7.",
     content=join(
        h("Barista-grade coffee. Zero staffing. Working 24/7.", 1),
        lead("Brew-n-Chill brings fully automated coffee kiosks to offices, gyms, hotels, "
             "hospitals and campuses — premium specialty drinks in under 60 seconds, served "
             "around the clock with no barista, no queue and no closing time."),
        columns(
            [button("Book a Free Demo", "/contact/")],
            [button("See the Machines", "/machines/")],
        ),
        separator(),
        h("Coffee as a technology — run as a brand"),
        p("We do two things, and they reinforce each other. We <strong>supply, install and "
          "service the kiosk hardware</strong> as a turnkey technology partner, and we put "
          "our own <strong>Brew-n-Chill coffee</strong> in the hopper — beans, blends and "
          "recipes dialled in for the machine. You get the convenience of an appliance and "
          "the cup quality of a café."),
        columns(
            [h("60 sec", 3), p("From tap to finished latte, cappuccino or cold brew.")],
            [h("24/7", 3), p("Self-serve, unattended, every hour of every day.")],
            [h("~2 m²", 3), p("A complete coffee bar in the footprint of a vending machine.")],
        ),
        separator(),
        h("Why it works right now"),
        p("The robot coffee kiosk market is projected to grow from roughly $20 billion in 2024 "
          "to over $50 billion by 2032. Office occupancy has climbed back to about 62% in early "
          "2026, and 89% of workers say high-quality coffee makes them more engaged at work. "
          "Premium coffee has quietly become a recruiting and retention tool — and replacing one "
          "good employee costs 50–200% of their salary."),
        ul([
            "<strong>For the building owner / employer:</strong> a standout amenity with no payroll, no spills to staff, no shift to cover.",
            "<strong>For the operator / investor:</strong> a well-placed machine can net $3,000–$4,000 a month with payback typically in 12–18 months.",
            "<strong>For the visitor:</strong> consistent, genuinely good coffee whenever they want it.",
        ]),
        button("See the numbers", "/pricing-roi/"),
        separator(),
        h("Where Brew-n-Chill kiosks belong"),
        columns(
            [p("<strong>Offices &amp; coworking</strong><br>A perk that pays for itself in retention.")],
            [p("<strong>Gyms &amp; studios</strong><br>Pre- and post-workout drinks, zero staff.")],
            [p("<strong>Hotels &amp; lobbies</strong><br>24/7 service the front desk never touches.")],
        ),
        columns(
            [p("<strong>Hospitals &amp; clinics</strong><br>Coffee for staff and visitors at 3am.")],
            [p("<strong>Universities</strong><br>High footfall, captive audience, long hours.")],
            [p("<strong>Retail &amp; transit</strong><br>Micro-retail in two square metres.")],
        ),
        button("Explore by industry", "/industries/"),
        separator(),
        h("Ready to taste it?"),
        p("Tell us about your space and we'll recommend a machine, model the economics and "
          "arrange a tasting. No obligation, no jargon."),
        button("Book a Free Demo", "/contact/"),
     ))

# --- HOW IT WORKS -----------------------------------------------------------
page("how-it-works", "How It Works", 20,
     excerpt="From site survey to first cup: how a Brew-n-Chill automated coffee kiosk gets installed, stocked and serviced.",
     content=join(
        h("How a Brew-n-Chill kiosk works", 1),
        lead("A complete, self-running coffee bar — installed in an afternoon and managed for you."),
        h("1. We survey your space"),
        p("We look at footfall, power (a standard outlet is usually enough), water options "
          "(plumbed or bottled), and the spot that will catch the most traffic. Location is the "
          "single biggest driver of performance, so we get it right before anything ships."),
        h("2. We recommend the right machine"),
        p("Small office? A compact 30-cup-per-hour unit. Airport or busy campus? A high-throughput "
          "robotic kiosk that pushes 60+ drinks an hour. We match the machine to your volume, drink "
          "menu and budget — purchase, lease or revenue-share."),
        h("3. We install and brand it"),
        p("Delivery, setup and a working first cup typically happen in a single visit. The kiosk is "
          "wrapped in Brew-n-Chill branding (or co-branded with you) and loaded with our beans, milk "
          "options and syrups, all dialled in for the machine."),
        h("4. Guests order and pay themselves"),
        p("Touchscreen or phone, tap or scan to pay, drink in under a minute. Customers choose "
          "espresso, latte, cappuccino, flat white, americano, hot chocolate, iced and cold-brew "
          "options — barista-grade, every time, with no human in the loop."),
        h("5. We keep it running"),
        p("Remote monitoring flags low stock and service needs before anyone notices. Restocking takes "
          "about an hour a day (we can do it or train your team), and ingredients run around 20–25% of "
          "revenue. Telemetry, sales and uptime are visible to you in a simple dashboard."),
        separator(),
        h("What you don't have to deal with"),
        ul([
            "No hiring, training, scheduling or covering shifts.",
            "No barista skill required — the machine is the barista.",
            "No build-out: it's an appliance, not a café fit-out.",
            "No surprise downtime: connected machines alert us first.",
        ]),
        button("Book a Free Demo", "/contact/"),
     ))

# --- MACHINES ---------------------------------------------------------------
page("machines", "The Machines", 30,
     excerpt="The Brew-n-Chill kiosk lineup — compact countertop units to full robotic coffee bars, matched to your footfall and budget.",
     content=join(
        h("The machines", 1),
        lead("We're technology-agnostic. We curate the best automated coffee hardware on the "
             "market and stand behind every unit we install — so you get the right machine, not "
             "whatever one brand happens to sell."),
        h("Compact Kiosk"),
        p("A countertop or slimline automated barista for smaller offices, studios and waiting "
          "rooms. Up to ~30 drinks per hour, fits almost anywhere with a power outlet, and serves "
          "the espresso-based core menu plus hot chocolate."),
        ul(["Best for: 10–80 daily cups", "Footprint: countertop / ~1 m²", "Hot drinks, optional iced"]),
        h("Pro Kiosk"),
        p("Our workhorse free-standing unit for busy offices, gyms, hotels and clinics. Bean-to-cup "
          "espresso, fresh-milk options, syrups, and iced/cold-brew. Self-cleaning cycles and a large "
          "hopper mean fewer touches per day."),
        ul(["Best for: 60–150 daily cups", "Footprint: ~1.5–2 m²", "Full menu, fresh milk, iced &amp; cold brew"]),
        h("Robotic Barista Kiosk"),
        p("A fully robotic, glass-fronted coffee bar for airports, malls, campuses and flagship "
          "lobbies. A theatrical robotic arm, 60+ drinks per hour, app pre-ordering and a complete "
          "specialty menu. It's an attraction as much as an amenity."),
        ul(["Best for: 100–400+ daily cups", "Footprint: ~2–4 m²", "Robotic service, app ordering, premium menu"]),
        separator(),
        h("Every machine includes"),
        ul([
            "Cashless payment (tap, chip and mobile wallet) and optional QR / app ordering.",
            "Remote telemetry: sales, stock levels, uptime and fault alerts.",
            "Self-cleaning and automated maintenance cycles.",
            "Brew-n-Chill branding — or co-branding with your organisation.",
            "Brew-n-Chill beans, milk and syrups tuned to the machine.",
        ]),
        p("<em>Not sure which fits? That's our job. Tell us your space and footfall and we'll spec it.</em>"),
        button("Get a recommendation", "/contact/"),
     ))

# --- INDUSTRIES -------------------------------------------------------------
page("industries", "Industries We Serve", 40,
     excerpt="Automated coffee kiosks for offices, gyms, hotels, hospitals, universities and retail — the verticals where unattended coffee performs best.",
     content=join(
        h("Industries we serve", 1),
        lead("Captive audiences and long hours are where automated coffee shines. These are the "
             "spaces we know best."),
        h("Offices &amp; coworking"),
        p("The flagship use case. Quality coffee ranks among the top three workplace perks for "
          "retention, and with replacement costs at 50–200% of salary, a kiosk that keeps one good "
          "hire is already paid for. No more cheap drip pot — a real café in the breakroom, with no "
          "office manager playing barista."),
        h("Gyms &amp; fitness studios"),
        p("Pre-workout espresso, post-workout protein lattes and cold brew — an extra revenue line "
          "and a membership perk that runs itself while your team focuses on the floor."),
        h("Hotels &amp; serviced apartments"),
        p("24/7 lobby coffee the front desk never has to make. Guests get specialty drinks at any "
          "hour; you get an amenity with no labour and a new ancillary revenue stream."),
        h("Hospitals &amp; healthcare"),
        p("Staff on night shifts and visitors in waiting rooms need coffee when the café is shut. "
          "Unattended kiosks deliver consistent quality around the clock in a tiny footprint."),
        h("Universities &amp; campuses"),
        p("High footfall, long hours and a captive student audience. Moving a machine from a "
          "moderate-traffic office (~55 cups/day) to a busy campus (~95+ cups/day) can lift monthly "
          "net profit by 40–60%."),
        h("Retail, transit &amp; convenience"),
        p("Malls, stations, forecourts and lobbies. A full coffee offer in two square metres turns "
          "dead corners into 24/7 micro-retail."),
        separator(),
        p("Don't see your space? If people walk past it and want coffee, we can probably make the "
          "numbers work."),
        button("Talk to us about your site", "/contact/"),
     ))

# --- PRICING / ROI ----------------------------------------------------------
page("pricing-roi", "Pricing &amp; ROI", 50,
     excerpt="Buy, lease or revenue-share a Brew-n-Chill coffee kiosk. Transparent unit economics: ~$240/day revenue potential, $3–4k monthly net, 12–18 month payback.",
     content=join(
        h("Pricing &amp; ROI", 1),
        lead("Three ways to get a kiosk, and honest numbers behind all of them."),
        h("Three ways to work with us"),
        columns(
            [h("Buy", 3),
             p("Own the machine outright. Best lifetime value if you have the capital and a strong "
               "location. We handle install, branding, supply and service."),
             ul(["You own the asset", "Lowest cost per cup over time", "Optional service plan"])],
            [h("Lease", 3),
             p("Spread the cost monthly with little money down. Maintenance and software included. "
               "Upgrade as the range improves."),
             ul(["Low upfront cost", "Maintenance included", "Predictable monthly fee"])],
            [h("Revenue share", 3),
             p("For the right high-traffic sites, we place the machine at little or no cost and split "
               "the takings. We're only paid when it performs."),
             ul(["Little/no upfront cost", "Aligned incentives", "We carry the hardware risk"])],
        ),
        separator(),
        h("What the machines cost"),
        p("Automated coffee hardware spans a wide range depending on throughput and features:"),
        ul([
            "<strong>Entry / compact:</strong> roughly $2,000–$7,500",
            "<strong>Mid-range professional:</strong> roughly $10,000–$25,000",
            "<strong>Premium robotic kiosk:</strong> roughly $28,000–$60,000+",
        ]),
        p("<em>Indicative market ranges — your exact quote depends on the model, contract type and "
          "supply agreement. Ask us for a tailored number.</em>"),
        h("A worked example (single office machine)"),
        ul([
            "60 cups/day &times; $4 average price = <strong>$240/day</strong> revenue",
            "Ingredients ~$0.80/cup (20–25% of revenue)",
            "≈ <strong>$5,760/month</strong> gross profit before location costs",
            "≈ <strong>$3,000–$4,000/month net</strong> per machine after location fee, power and restocking",
            "Typical payback: <strong>12–18 months</strong> (as fast as 6–12 in prime spots)",
        ]),
        p("Location is everything. The same machine that does 55 cups/day in a quiet office can do "
          "95+ on a busy campus — a 40–60% swing in monthly profit. We help you place it right."),
        separator(),
        h("Want your own numbers?"),
        p("Send us your location type, opening hours and rough footfall and we'll model revenue, "
          "costs and payback for your specific site — no obligation."),
        button("Request an ROI model", "/contact/"),
     ))

# --- OUR COFFEE -------------------------------------------------------------
page("our-coffee", "Our Coffee", 60,
     excerpt="The Brew-n-Chill coffee brand — specialty beans and blends dialled in for automated kiosks, so every cup tastes like a café made it.",
     content=join(
        h("Our coffee", 1),
        lead("The machine is only half the story. Brew-n-Chill is a coffee brand first — we choose "
             "the beans, build the blends and tune every recipe so the kiosk pours like a café."),
        h("Beans worth the machine"),
        p("Great hardware pouring mediocre coffee is just a faster way to make a bad cup. We source "
          "specialty-grade beans, roast for consistency, and profile each blend specifically for "
          "automated extraction — grind, dose, temperature and pressure all dialled to the machine, "
          "not a barista's guesswork."),
        h("The Brew-n-Chill range"),
        columns(
            [h("Signature Blend", 3), p("Balanced, chocolatey and crowd-pleasing — the everyday "
                                        "house espresso behind every latte and flat white.")],
            [h("Bold Roast", 3), p("Darker, punchier and unapologetic, for people who take their "
                                   "morning seriously.")],
            [h("Chill Cold Brew", 3), p("Smooth, low-acid and built for iced and cold-brew menus — "
                                        "the 'chill' half of the name.")],
        ),
        h("'Brew' and 'Chill' — hot and iced, done well"),
        p("The name is the menu. <strong>Brew</strong> covers the full hot line — espresso, latte, "
          "cappuccino, flat white, americano, hot chocolate. <strong>Chill</strong> covers iced "
          "lattes, cold brew and refreshers. One kiosk, both moods, all day."),
        h("Consistency is the feature"),
        p("A café is only as good as its worst barista on their worst day. Our beans plus automated "
          "precision mean the 400th cup tastes like the first. That reliability is what turns a "
          "novelty into a habit — and a habit into recurring revenue."),
        separator(),
        p("Curious how it tastes? Book a tasting and we'll bring the coffee to you."),
        button("Book a tasting", "/contact/"),
     ))

# --- ABOUT ------------------------------------------------------------------
page("about", "About Brew-n-Chill", 70,
     excerpt="Brew-n-Chill pairs the best automated coffee technology with a coffee brand built for it — turnkey kiosks for businesses that want great coffee without running a café.",
     content=join(
        h("About Brew-n-Chill", 1),
        lead("We make great coffee effortless for the places people work, train, heal, study and "
             "pass through."),
        h("Why we exist"),
        p("Everyone wants good coffee on site. Almost nobody wants to hire baristas, manage a café, "
          "or babysit a temperamental machine. Brew-n-Chill closes that gap: we bring the technology, "
          "the beans and the service, and you get a self-running coffee bar that just works."),
        h("Technology partner and coffee brand"),
        p("Most companies in this space sell you a box. We do two jobs at once. As a <strong>technology "
          "reseller</strong> we pick the best automated kiosks on the market, install them and keep "
          "them running. As a <strong>coffee brand</strong> we make sure what comes out of them is "
          "genuinely worth drinking. Hardware that performs, coffee that delivers — under one roof."),
        h("How we work"),
        ul([
            "<strong>Honest economics.</strong> We model the numbers before you commit, and we'll tell you if a location won't work.",
            "<strong>Flexible terms.</strong> Buy, lease or revenue-share — whatever fits your risk appetite.",
            "<strong>Genuinely hands-off.</strong> We monitor, restock and service so you don't think about it.",
            "<strong>Quality, not novelty.</strong> The robot is fun; the coffee is the point.",
        ]),
        separator(),
        h("Let's put a kiosk in your space"),
        p("Whether you run an office, a gym, a hotel or a hospital, we'd love to show you what "
          "good automated coffee looks like."),
        button("Get in touch", "/contact/"),
     ))

# --- FAQ --------------------------------------------------------------------
page("faq", "FAQ", 80,
     excerpt="Common questions about Brew-n-Chill automated coffee kiosks — install, maintenance, cost, payment, coffee quality and contracts.",
     content=join(
        h("Frequently asked questions", 1),
        h("How much space does a kiosk need?", 3),
        p("Most units fit in about 1–2 square metres — roughly a vending-machine footprint. Compact "
          "models sit on a countertop; robotic kiosks need up to ~4 m²."),
        h("What does it need to run?", 3),
        p("A standard power outlet and either a plumbed water line or a refillable tank. We confirm "
          "everything in the site survey."),
        h("Who maintains and restocks it?", 3),
        p("We do, or we train your team. Connected machines alert us to low stock and service needs "
          "automatically; day-to-day restocking is about an hour."),
        h("How do customers pay?", 3),
        p("Tap, chip, mobile wallet, and optional QR / app ordering. You can also set drinks to free "
          "(employer-subsidised) or any price you like."),
        h("Is the coffee actually good?", 3),
        p("Yes — that's the whole point. We use specialty-grade Brew-n-Chill beans tuned for the "
          "machine, so the quality is café-level and identical cup after cup."),
        h("Buy, lease or revenue-share?", 3),
        p("All three. Buying is cheapest long-term, leasing keeps upfront cost low, and revenue-share "
          "suits high-traffic sites where we place the machine and split takings. See "
          "<a href=\"/pricing-roi/\">Pricing &amp; ROI</a>."),
        h("How fast can we go live?", 3),
        p("Once the machine and location are confirmed, install and first cup usually happen in a "
          "single visit. Book a demo and we'll map out the timeline."),
        button("Still have questions? Ask us", "/contact/"),
     ))

# --- CONTACT ----------------------------------------------------------------
page("contact", "Contact / Book a Demo", 90,
     excerpt="Book a free demo or tasting. Tell us about your space and Brew-n-Chill will recommend a machine and model the economics.",
     content=join(
        h("Book a free demo", 1),
        lead("Tell us about your space and we'll recommend a machine, model the economics and "
             "arrange a tasting — no obligation."),
        p("<strong>Email:</strong> <a href=\"mailto:hello@brew-n-chill.com\">hello@brew-n-chill.com</a><br>"
          "<strong>Phone:</strong> (add your number)<br>"
          "<strong>Service area:</strong> (add your region)"),
        p("<em>Add your contact form below using a form plugin (WPForms, Gravity Forms, or the "
          "WordPress.com / Jetpack Form block). Suggested fields:</em>"),
        ul([
            "Name and company",
            "Email and phone",
            "Type of location (office, gym, hotel, hospital, campus, retail)",
            "Approximate daily footfall",
            "Preferred: buy / lease / revenue-share",
            "Message",
        ]),
        button("Email us now", "mailto:hello@brew-n-chill.com"),
     ))


# ---------------------------------------------------------------------------
# WXR generation
# ---------------------------------------------------------------------------

WXR_HEADER = """<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
    xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
    xmlns:content="http://purl.org/rss/1.0/modules/content/"
    xmlns:wfw="http://wellformedweb.org/CommentAPI/"
    xmlns:dc="http://purl.org/dc/elements/1.1/"
    xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
    <title>{title}</title>
    <link>{url}</link>
    <description>Automated coffee kiosks for business</description>
    <pubDate>{pubdate}</pubDate>
    <language>en-US</language>
    <wp:wxr_version>1.2</wp:wxr_version>
    <wp:base_site_url>{url}</wp:base_site_url>
    <wp:base_blog_url>{url}</wp:base_blog_url>
    <wp:author>
        <wp:author_id>1</wp:author_id>
        <wp:author_login><![CDATA[{login}]]></wp:author_login>
        <wp:author_email><![CDATA[{email}]]></wp:author_email>
        <wp:author_display_name><![CDATA[Brew-n-Chill]]></wp:author_display_name>
        <wp:author_first_name><![CDATA[]]></wp:author_first_name>
        <wp:author_last_name><![CDATA[]]></wp:author_last_name>
    </wp:author>
    <generator>https://wordpress.org/?v=6.5</generator>
"""

ITEM_TEMPLATE = """
    <item>
        <title>{title}</title>
        <link>{url}/{slug}/</link>
        <pubDate>{pubdate}</pubDate>
        <dc:creator><![CDATA[{login}]]></dc:creator>
        <guid isPermaLink="false">{url}/?page_id={pid}</guid>
        <description></description>
        <content:encoded><![CDATA[{content}]]></content:encoded>
        <excerpt:encoded><![CDATA[{excerpt}]]></excerpt:encoded>
        <wp:post_id>{pid}</wp:post_id>
        <wp:post_date><![CDATA[{date}]]></wp:post_date>
        <wp:post_date_gmt><![CDATA[{date}]]></wp:post_date_gmt>
        <wp:comment_status><![CDATA[closed]]></wp:comment_status>
        <wp:ping_status><![CDATA[closed]]></wp:ping_status>
        <wp:post_name><![CDATA[{slug}]]></wp:post_name>
        <wp:status><![CDATA[publish]]></wp:status>
        <wp:post_parent>{parent}</wp:post_parent>
        <wp:menu_order>{menu_order}</wp:menu_order>
        <wp:post_type><![CDATA[page]]></wp:post_type>
        <wp:post_password><![CDATA[]]></wp:post_password>
        <wp:is_sticky>0</wp:is_sticky>
{meta}    </item>
"""

PAGE_TEMPLATE_META = """        <wp:postmeta>
            <wp:meta_key><![CDATA[_wp_page_template]]></wp:meta_key>
            <wp:meta_value><![CDATA[{tmpl}]]></wp:meta_value>
        </wp:postmeta>
"""

def rfc822(dt):
    return dt.strftime("%a, %d %b %Y %H:%M:%S +0000")

def build_wxr():
    pubdate = rfc822(NOW)
    date = NOW.strftime("%Y-%m-%d %H:%M:%S")
    out = WXR_HEADER.format(title=SITE_TITLE, url=SITE_URL, pubdate=pubdate,
                            login=AUTHOR_LOGIN, email=AUTHOR_EMAIL)
    pid = 100
    for pg in PAGES:
        pid += 1
        meta = ""
        if pg["template"]:
            meta = PAGE_TEMPLATE_META.format(tmpl=pg["template"])
        out += ITEM_TEMPLATE.format(
            title=html.escape(pg["title"].replace("&amp;", "&")),
            url=SITE_URL, slug=pg["slug"], pubdate=pubdate, login=AUTHOR_LOGIN,
            pid=pid, content=pg["content"], excerpt=pg["excerpt"],
            date=date, parent=pg["parent"], menu_order=pg["menu_order"], meta=meta,
        )
    out += "</channel>\n</rss>\n"
    return out

HTML_PREVIEW = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} — Brew-n-Chill preview</title>
<style>
 body{{font:17px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;color:#1c1a17}}
 h1,h2,h3{{line-height:1.2}} h1{{font-size:2.2rem}}
 a{{color:#7a4a25}} .wp-block-button__link{{display:inline-block;background:#7a4a25;color:#fff;padding:.6rem 1.1rem;border-radius:6px;text-decoration:none;margin:.3rem .3rem .3rem 0}}
 .wp-block-columns{{display:flex;gap:1.4rem;flex-wrap:wrap}} .wp-block-column{{flex:1;min-width:200px}}
 blockquote{{border-left:4px solid #c8a06a;margin:1.4rem 0;padding:.2rem 1rem;color:#555}}
 hr{{border:none;border-top:1px solid #e4ddd3;margin:2rem 0}}
 .note{{background:#f6efe6;padding:.6rem 1rem;border-radius:6px;font-size:.85rem;color:#6b5d4d}}
</style></head><body>
<p class="note">Static preview of the <strong>{title}</strong> page. Final styling comes from the WordPress theme after import.</p>
{body}
</body></html>
"""

def strip_block_comments(content):
    import re
    return re.sub(r"<!--\s*/?wp:.*?-->", "", content)

def main():
    here = os.path.dirname(os.path.abspath(__file__))
    root = os.path.dirname(here)
    # WXR
    wxr_path = os.path.join(here, "brew-n-chill.wordpress.xml")
    with open(wxr_path, "w", encoding="utf-8") as f:
        f.write(build_wxr())
    print(f"wrote {wxr_path}")
    # HTML previews
    content_dir = os.path.join(root, "content")
    os.makedirs(content_dir, exist_ok=True)
    index_rows = []
    for pg in PAGES:
        body = strip_block_comments(pg["content"])
        path = os.path.join(content_dir, f"{pg['slug']}.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(HTML_PREVIEW.format(title=html.escape(pg["title"]), body=body))
        index_rows.append(f'<li><a href="{pg["slug"]}.html">{html.escape(pg["title"])}</a></li>')
        print(f"wrote {path}")
    # preview index
    idx = os.path.join(content_dir, "index.html")
    with open(idx, "w", encoding="utf-8") as f:
        f.write(HTML_PREVIEW.format(title="All pages",
                body="<h1>Brew-n-Chill — page previews</h1><ul>" + "".join(index_rows) + "</ul>"))
    print(f"wrote {idx}")
    print(f"\n{len(PAGES)} pages built.")

if __name__ == "__main__":
    main()
