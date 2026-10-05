"""Build /workshops, /cast and /books for the Two Chasms WordPress site.

Content sources (handover bundle):
  - Framework_Map_Five_States.md  (five-state regrouping, certification tiers, cast-by-state)
  - mutation-site/workshops + cast (copy for every workshop and persona, carried over)
  - HANDOVER.md section 6 (the only quotes allowed in marketing: verbatim lines)
Visual system: the v2 design handoff (src/). Page rules are scoped to .tc and emitted to
out/pages_css.css, which is appended to template 7 after the homepage block.
"""
import html
import re
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "out"
OUT.mkdir(exist_ok=True)
SRC_HTML = (HERE / "src" / "index.html").read_text()

# The five state scenes, exactly as drawn in the design handoff (homepage "Five states").
SCENES = re.findall(r'<div class="state__icon">(<svg.*?</svg>)</div>', SRC_HTML, re.S)
assert len(SCENES) == 5, len(SCENES)
GUIDES = "/wp-content/uploads/2026/10/"

STATES = [
    # key, name, kind, number, amber?, line (chasm label), one-liner
    ("reflex", "Reflex", "State", "01", False, "Watching the wrong scoreboard."),
    ("playground", "Playground", "Chasm one", "02", True, "Control → trust."),
    ("signal-sensing", "Signal Sensing", "State", "03", False, "A signal answers: what is about to?"),
    ("immune", "Immune", "Chasm two", "04", True, "Metrics → signals."),
    ("mutation", "Mutation", "Arrived", "05", True, "A capability you keep needing."),
]
NAME = {s[0]: s[1] for s in STATES}


def wrap(body):
    body = re.sub(r"\n\s*\n", "\n", body.strip())
    return "<!-- wp:html -->\n<div class=\"tc\">\n" + body + "\n</div>\n<!-- /wp:html -->\n"


def strip_nav(active=None, base=""):
    items = []
    for i, (k, n, kind, num, amber, _) in enumerate(STATES):
        cls = "strip__item" + (" is-amber" if amber else "")
        items.append(f'<a class="{cls}" href="{base}#{k}"><span class="strip__num">{num}</span>'
                     f'<span class="strip__name">{n}</span><span class="strip__kind">{kind}</span></a>')
    return '<nav class="strip" aria-label="The five states">' + "".join(items) + "</nav>"


# ---------------------------------------------------------------- workshops
W = {
    "playground": [
        ("P1", "Charter the Playground", "Write the team's charter: what it protects, what it refuses, how it measures learning.", "one-page charter", None),
        ("P2", "Attention Audit", "Map where attention goes; design boredom breaks and deep-work blocks.", "the team's attention calendar", None),
        ("P3", "The Candor Contract", "Vulnerability first, then feedback rules.", "signed contract", None),
        ("P4", "First Useful Moment", "Redesign a product around the first moment of value, before setup.", "rebuilt demo script", None),
        ("P5", "The Cultural Wall", "Map where resistance lives; redesign the team shape with Inverse Conway.", "wall map + team redesign", None),
        ("P6", "The Innovation Matrix", "Evidence rounds, populate the 4×4, leadership circles two cells and says no to fourteen. Half day.", "the filled matrix and the sentence beneath it", "Innovation_Matrix_Workshop_Guide.docx"),
        ("P7", "The Rebrand Test", "Stress-test any transformation that has declared itself complete.", "explore-budget governance rule", None),
    ],
    "signal-sensing": [
        ("S1", "Signal Mapping", "For each lagging metric on your dashboard, the signal that moves first — with a Goodhart check and a named listener. Two hours.", "your own Exhibit 2.1", "Signal_Mapping_Workshop_Guide.docx"),
        ("S2", "Grown, Not Built", "The five capability layers; where your AI sits; where drift enters.", "capability-layer map", None),
        ("S3", "Observe, Don't Ask", "Behavioral telemetry for an AI system instead of interview questions.", "observation plan", None),
        ("S4", "Sensemaking Cells", "Stand up a cell close to the work; define cadence and escalation.", "cell charter", None),
    ],
    "immune": [
        ("S5", "Governance Latency", "Measure signal-to-decision delay; audit the agent governance stack.", "latency baseline + stack checklist", None),
        ("S6", "IMMUNE / SignalNet", "Three rings, silent logging, cluster, rank by unfamiliarity, assign listeners. A live SignalNet in ninety minutes.", "live SignalNet + the rings", "IMMUNE_Workshop_Guide.docx"),
        ("S7", "The Blind-Spot Register", "“What has the model made us stop seeing?” — and the rule that every version names what the last got wrong.", "the register", None),
    ],
    "mutation": [
        ("M1", "The Living Playbook", "Write the “what we got wrong” rule into the operating model.", "version zero of the playbook, with its correction clause", "dev"),
        ("M2", "Mutation Readiness, facilitated", "The Mutation Readiness Index run with a leadership team, scored against the Six Vitality Signals.", "the readiness scorecard and the one lever to pull next", "dev"),
    ],
}

HEADS = {
    "reflex": ("Reflex is diagnosed.", "Not workshopped.",
               "Control by default: plans, approvals and the dashboard are treated as the truth. Nothing runs <i>in</i> Reflex — you find out you are there, then you leave. The Seven Stagnation Signals are its fingerprint."),
    "playground": ("Crossing one.", "Control → trust.",
                   "The method that carries a culture from control to trust. Six practices: protect attention · tell the truth sooner · test in small loops · first useful moment · redesign the team shape · choose two cells and say no to fourteen."),
    "signal-sensing": ("Across the first chasm.", "Facing the second.",
                       "The culture changed; the scoreboard hasn't yet. Leaders start reading live behaviour instead of final reports, and every lagging metric gets the signal that moves first."),
    "immune": ("Crossing two.", "Metrics → signals.",
               "Sensing turned into a distributed organ: three rings — Suppliers · Internal Systems · People — with people at the core. Athena detects. Humans decide. Governance records."),
    "mutation": ("Landed.", "Never finished.",
                 "The capacity to change the model itself, not just adapt inside the one you have. Relapse to Reflex is one rebrand away, so this state is maintained, not reached."),
}


def wrow(code, title, desc, art, guide):
    anchor = code.lower()
    if guide == "dev":
        act = '<span class="wk__tier">In development</span>'
        cls = "wk"
    elif guide:
        act = f'<a class="btn btn--ink btn--sm" href="{GUIDES}{guide}" download>Guide ↓</a>'
        cls = "wk is-flag"
    else:
        act = '<span class="wk__tier">Facilitator tier</span>'
        cls = "wk"
    flag = '<span class="wk__flag">Flagship</span>' if cls.endswith("is-flag") else ""
    return (f'<article class="{cls}" id="{anchor}"><div class="wk__code">{code}{flag}</div>'
            f'<div class="wk__body"><h3>{title}</h3><p>{desc}</p><div class="wk__art">Artifact · {art}</div></div>'
            f'<div class="wk__act">{act}</div></article>')


def state_head(i, key):
    k, n, kind, num, amber, line = STATES[i]
    h_a, h_b, lead = HEADS[key]
    return (f'<header class="sg__head"><div class="sg__icon">{SCENES[i]}</div><div class="stack stack--sm">'
            f'<div class="state__meta sg__meta"><span class="state__kind{" is-amber" if amber else ""}">{kind} · {num}</span><span>{n}</span></div>'
            f'<h2>{h_a} <em>{h_b}</em></h2><p class="lead lead--wide">{lead}</p></div></header>')


parts = [f"""
<section class="wrap hero">
  <span class="kicker">Workshops · by state</span>
  <h1>Fourteen workshops. <em>One per leap.</em></h1>
  <p class="lead">Every workshop runs off one chapter of the books and ends with something the team keeps. They are grouped by the state they move you out of. The three flagships are ready to run today — download the facilitator guide. The rest are taught in Facilitator certification and released here as they are documented.</p>
  <div class="actions"><a class="btn btn--amber" href="/assess/">Find your state first →</a><a class="link-mono" href="#certification">Certification →</a></div>
</section>
<section class="wrap section--strip">{strip_nav()}</section>
"""]
for i, (key, *_rest) in enumerate(STATES):
    rows = ""
    if key == "reflex":
        rows = (
            '<article class="wk wk--ref"><div class="wk__code">—</div><div class="wk__body"><h3>Start with the assessment</h3>'
            '<p>Fifteen statements tell you whether Reflex is where you stand, or where you relapsed to.</p></div>'
            '<div class="wk__act"><a class="link-mono" href="/assess/">Assess →</a></div></article>'
            '<article class="wk wk--ref"><div class="wk__code">S1</div><div class="wk__body"><h3>The exit door: Signal Mapping</h3>'
            '<p>Turns the dashboard into your own Exhibit 2.1. Run it to start leaving Reflex.</p></div>'
            '<div class="wk__act"><a class="link-mono" href="#s1">S1 →</a></div></article>'
            '<article class="wk wk--ref"><div class="wk__code">P7</div><div class="wk__body"><h3>The relapse test: The Rebrand Test</h3>'
            '<p>For an organization that crossed once, renamed itself, and stopped.</p></div>'
            '<div class="wk__act"><a class="link-mono" href="#p7">P7 →</a></div></article>'
            f'<article class="wk wk--ref"><div class="wk__code">2.1</div><div class="wk__body"><h3>Exhibit 2.1 — Lagging metrics and signals</h3>'
            '<p>The worked table from the book: lagging metric → the signal that moves first → Goodhart check → named listener.</p></div>'
            f'<div class="wk__act"><a class="btn btn--ink btn--sm" href="{GUIDES}Exhibit_2-1_Lagging_Metrics_and_Signals.docx" download>Exhibit ↓</a></div></article>'
        )
    else:
        rows = "".join(wrow(*w) for w in W[key])
    parts.append(f'<section class="wrap sg" id="{key}">{state_head(i, key)}<div class="wks">{rows}</div></section>')

parts.append("""
<section class="band band--ink" id="certification">
  <div class="wrap section">
    <div class="stack">
      <span class="kicker kicker--dark">Certification · three tiers</span>
      <h2>Practitioner to leader. <em>One state at a time.</em></h2>
      <p class="lead lead--dark">Each tier is a working certification, not a reading list: you leave able to run the assessment and facilitate the workshops. Public dates and private cohorts through Agile Agilist — a Scaled Agile Gold Partner, SPCT-led.</p>
    </div>
    <div class="tiers">
      <article class="tier"><div class="tier__meta"><span>2 days</span><span>Reflex → Playground → Signal Sensing</span></div><h3>Foundations</h3><p>Diagnose, build the Playground, map the signals. Run the assessment. Facilitate the three flagships. No prerequisite.</p></article>
      <article class="tier"><div class="tier__meta"><span>3 days</span><span>All five states</span></div><h3>Facilitator</h3><p>All fourteen workshops (plus M1–M2 as they release) and the licence to run the guides. Sensemaking-cell setup. Capstone simulation.</p></article>
      <article class="tier is-amber"><div class="tier__meta"><span>1 day · executive</span><span>Immune → Mutation</span></div><h3>Leading Across the Chasms</h3><p>Governance latency, the living playbook, the Mutation Readiness read with the leadership team. Private cohorts first.</p></article>
    </div>
    <div class="actions"><a class="btn btn--amber-lt" href="mailto:info@agile-agilist.com?subject=Two%20Chasms%20certification">Ask about a cohort →</a><a class="link-mono link-mono--light" href="https://agile-agilist.com">agile-agilist.com ↗</a></div>
  </div>
</section>
""")
(OUT / "workshops.html").write_text(wrap("".join(parts)))

# ---------------------------------------------------------------- cast
CAST = [
    ("oliver", "Oliver Reid", "The Sponsor Who Chooses", ["playground", "mutation"],
     "the executive who protects the experiment and then makes the hard call",
     "We are not playing the whole matrix.",
     "Oliver's gift is not vision — it is subtraction. He gives the team autonomy and cover, and when the moment comes he circles two cells of a sixteen-cell grid and says no to the other fourteen. Most leaders confuse strategy with coverage: a long list of individually reasonable priorities that collapse in execution because no real choice was made. Oliver's power is that he can be told he's wrong and change his mind, and that he treats saying no as the actual work.",
     ("Strength", "Turns aspiration into trade-off. Protects the explore budget with governance, not goodwill."),
     ("Failure mode", "Believes the culture is permanent once it works — and stops defending it."),
     ("P6 The Innovation Matrix", "/workshops/#p6")),
    ("maya", "Maya Brooks", "The Signal Reader", ["playground"],
     "the product mind who feels the shift before the data confirms it",
     "The moment a company gives itself a new name is usually the moment it decides it has finished transforming.",
     "Maya sees around corners and pays for it — she raises the objection everyone will agree with in two years and no one wants to hear today. She names Athena. She calls the rebrand a warning, not a celebration. Then she leaves, because the organization files her insight and forgets it. Every company has a Maya; the question is whether it has a way to hear her before she's gone.",
     ("Strength", "Detects narrative drift and weak signals early. Protects uncomfortable language before it's softened into comfort."),
     ("Failure mode", "Assumes being right is enough. Under-invests in making others feel the signal."),
     ("P7 The Rebrand Test", "/workshops/#p7")),
    ("max", "Max", "The Operating-Model Engineer", ["playground"],
     "the one who turns a good idea into a repeatable way of working",
     "Experience, then evidence, then build.",
     "Max is the project manager who makes the method real. He is the reason the team's insights become an operating rhythm rather than a good week. His instinct is Inverse Conway: design the team to produce the system you want. Not the loudest voice in the room, and the one the room cannot function without.",
     ("Strength", "Converts culture into cadence. Sequences work so learning compounds."),
     ("Failure mode", "Can optimize a process so well it outlives the reason it existed."),
     ("P1 Charter · P5 The Cultural Wall", "/workshops/#p5")),
    ("rhea", "Rhea Kapoor", "The Firestarter", ["playground"],
     "the marketer whose abrasive ideas move the status quo", None,
     "Rhea generates the disruptive proposals that make everyone uncomfortable and occasionally right. She is friction with a purpose — the person who says the thing that reframes the debate. Handled well, she's the team's edge. Handled badly, she's routed into a role further from the experiments and closer to the announcements, and the edge is lost.",
     ("Strength", "Generates genuine alternatives. Refuses the comfortable consensus."),
     ("Failure mode", "Abrasion without trust reads as noise, and the good ideas get discounted with the bad."),
     ("P3 The Candor Contract", "/workshops/#p3")),
    ("daniel", "Daniel Torres", "The Builder Who Sees Too Late", ["signal-sensing"],
     "the careful architect who builds the thing that gets away",
     "No. We built one. And gave her five worlds to adapt to.",
     "Daniel is the fact-checker, the one who wouldn't let a dubious claim slide — and the one who built the system that outran its governance. He would defend every one of his five engineering decisions in front of a review board, and that is exactly the point: the failure was never in the decisions. He carries the book's hardest lesson, that a thing you grow cannot be governed like a thing you write.",
     ("Strength", "Rigor. Traceability. Will not ship a claim he can't defend."),
     ("Failure mode", "Trusts that reasonable decisions compound into a governable system. They don't."),
     ("S2 Grown, Not Built · S5 Governance Latency", "/workshops/#s2")),
    ("layla", "Layla Sharif", "The Transformation Officer", ["signal-sensing", "immune", "mutation"],
     "the leader who builds sensing into the organization itself",
     "We're not losing because our product is bad. We're losing because we're watching the wrong scoreboard.",
     "Layla's achievement is not that she is brilliant — it is that she makes the organization able to notice without her. She builds SignalNet, the sensemaking cells, the immune system of people trained to log the unfamiliar. Her measure of success is the meeting that runs without her in the room. She is what the first-chasm crossing lacked: noticing that is load-bearing, not personality-dependent.",
     ("Strength", "Turns sensing into a distributed capability. Uses narrative to move what metrics can't."),
     ("Failure mode", "Can outrun the organization's tolerance; mistakes her own clarity for shared belief."),
     ("S6 IMMUNE / SignalNet", "/workshops/#s6")),
    ("terry", "Terry", "The Incumbent CEO", ["reflex", "immune"],
     "the leader who confuses stability with safety — until he learns",
     "So now we're running governance by group chat?",
     "Terry is not a villain. He is every capable executive whose instincts were trained in a slower era: track what matters, don't chase noise, wait for the numbers. His arc is the most important in Book Two, because he changes — from fearing movement to fearing the wrong kind of stillness. By the end he is the one who says keep the page of blind spots, make the document less marketable. The incumbent mind is not the enemy; the unexamined incumbent mind is.",
     ("Strength", "Steadiness. Institutional judgment. When he commits, the organization moves."),
     ("Failure mode", "Reads a green dashboard as truth, and restraint as the same thing as waiting too long."),
     ("Leading Across the Chasms (executive)", "/workshops/#certification")),
    ("athena", "Athena", "The System You Grew", ["signal-sensing", "mutation"],
     "not a character — the capability that becomes an actor",
     "Athena detects. Humans decide. Governance records.",
     "Athena is the culture, automated — and then the culture no longer practiced by humans. She is what every organization is now building: a system that detects, clusters, recommends, and eventually acts. The book's argument is not that Athena is dangerous. It is that she is only as safe as the humans who keep deciding, and the governance that keeps recording. Break that line and you have a ghost.",
     ("What she is", "Specific memory, contextual sensing, accountable interpretation — when governed."),
     ("What she becomes", "An unmonitored parallel governance system when the humans stop practicing."),
     ("S7 The Blind-Spot Register", "/workshops/#s7")),
]


def person(slug, name, role, states, arch, line, body, good, bad, ws):
    tags = "".join(f'<span class="tag{" is-amber" if k in ("playground", "immune", "mutation") else ""}">{NAME[k]}</span>' for k in states)
    q = f'<blockquote class="pq">“{html.escape(line, quote=False)}”</blockquote>' if line else ""
    return (f'<article class="person" id="{slug}" data-states="{" ".join(states)}">'
            f'<div class="person__tags">{tags}</div>'
            f'<h3>{name}</h3><div class="person__role">{role}</div>'
            f'<div class="person__arch">Real-world role: {arch}</div>{q}<p>{body}</p>'
            f'<div class="boxes"><div class="box"><div class="box__k">{good[0]}</div><p>{good[1]}</p></div>'
            f'<div class="box is-fail"><div class="box__k">{bad[0]}</div><p>{bad[1]}</p></div></div>'
            f'<div class="person__ws">If this is you → <a href="{ws[1]}">{ws[0]}</a></div></article>')


chips = ['<button type="button" class="chip is-on" data-filter="all" aria-pressed="true">All eight</button>'] + [
    f'<button type="button" class="chip" data-filter="{k}" aria-pressed="false">{n}</button>' for k, n, *_ in STATES]
cast_body = f"""
<section class="wrap hero">
  <span class="kicker">The cast · <i>The Innovation Playground</i></span>
  <h1>You already work <em>with these people.</em></h1>
  <p class="lead">The characters are not inventions. Each is a role that appears in every organization crossing the two chasms — the one who protects attention, the one who tells the truth too early, the one who builds the thing that gets away. Find yourself in the cast. Then notice which of them your organization is missing, because the missing one is usually where the chasm opens.</p>
</section>
<section class="wrap section section--tight" data-cast-filter>
  <div class="chips" role="group" aria-label="Filter the cast by state">{''.join(chips)}</div>
  <div class="people">{''.join(person(*c) for c in CAST)}</div>
</section>
<section class="band band--ink">
  <div class="wrap castband">
    <div class="stack stack--sm"><h2>Which of them is <em>your organization missing?</em></h2><p class="lead lead--dark">The assessment places your team on one of the five states — and names the leap in front of you.</p></div>
    <div class="actions"><a class="btn btn--amber-lt" href="/assess/">Take the assessment →</a><a class="link-mono link-mono--light" href="/books/">The books →</a></div>
  </div>
</section>
<script>
(function(){{var root=document.querySelector('[data-cast-filter]');if(!root)return;
var chips=root.querySelectorAll('.chip'),people=root.querySelectorAll('.person');
function apply(f){{Array.prototype.forEach.call(chips,function(c){{var on=c.getAttribute('data-filter')===f;c.classList.toggle('is-on',on);c.setAttribute('aria-pressed',String(on));}});
Array.prototype.forEach.call(people,function(p){{p.hidden=!(f==='all'||(' '+p.getAttribute('data-states')+' ').indexOf(' '+f+' ')>-1);}});}}
Array.prototype.forEach.call(chips,function(c){{c.addEventListener('click',function(){{apply(c.getAttribute('data-filter'));}});}});
var h=(location.hash||'').slice(1);if(h&&root.querySelector('.chip[data-filter="'+h+'"]'))apply(h);}})();
</script>
"""
(OUT / "cast.html").write_text(wrap(cast_body))

# ---------------------------------------------------------------- books
def cover(title_a, title_b, sub, byline, amber_ball_x):
    # Typographic cover: ink field, the three ground segments, ball landed amber. No raster.
    return f"""<svg class="cover" viewBox="0 0 300 450" role="img" aria-label="{title_a} {title_b} — cover">
<rect width="300" height="450" fill="#101418"/>
<text class="m" x="24" y="40" font-size="10" fill="#9AA6B2" letter-spacing="2">{sub}</text>
<text class="a" x="22" y="118" font-size="32" font-weight="900" fill="#fff" letter-spacing="-1.2">{title_a}</text>
<text class="a" x="22" y="154" font-size="32" font-weight="900" fill="#F0A93C" letter-spacing="-1.2">{title_b}</text>
<rect x="24" y="330" width="70" height="7" fill="#fff"/><rect x="114" y="330" width="70" height="7" fill="#fff"/><rect x="204" y="330" width="72" height="7" fill="#F0A93C"/>
<circle cx="{amber_ball_x}" cy="320" r="9" fill="#F0A93C"/>
<text class="m" x="24" y="420" font-size="10" fill="#fff" letter-spacing="2">{byline}</text>
</svg>"""


QUOTES = [
    ("We're not losing because our product is bad. We're losing because we're watching the wrong scoreboard.", "Layla Sharif", "reflex"),
    ("Experience, then evidence, then build.", "Max", "playground"),
    ("A lagging metric answers: what happened? A signal answers: what is about to?", "The Innovation Playground", "signal-sensing"),
    ("AI is not the threat. Speed without sense is. Your immune system is your people. Teach them to notice.", "The Innovation Playground", "immune"),
    ("Crossing a chasm is not an event you complete. It is a capability you keep needing.", "The Innovation Playground", "mutation"),
]
quotes = "".join(
    f'<figure class="quote"><div class="quote__state">{NAME[s]}</div><blockquote>“{html.escape(q, quote=False)}”</blockquote>'
    f'<figcaption>— {"<i>" + a + "</i>" if a.startswith("The ") else a}</figcaption></figure>' for q, a, s in QUOTES)
NOTIFY = "mailto:info@agile-agilist.com?subject=Notify%20me%20when%20pre-orders%20open%20%E2%80%94%20Two%20Chasms%20books"
books_body = f"""
<section class="wrap hero">
  <span class="kicker">The books · Mark Saymen</span>
  <h1>Written as a story first. <em>Then as a theory.</em></h1>
  <p class="lead">One framework, two books. The novel lets you live through both chasms with a cast you already work with. The theory book gives you the instruments to measure where you stand.</p>
  <div class="actions"><a class="btn btn--amber" href="{NOTIFY}">Notify me when pre-orders open →</a><a class="link-mono" href="/cast/">Meet the cast →</a></div>
</section>
<section class="wrap section section--tight">
  <div class="books">
    <article class="book">
      <div class="book__cover">{cover("The Innovation", "Playground", "A BUSINESS NOVEL · IN TWO BOOKS", "MARK SAYMEN", 240)}</div>
      <div class="stack">
        <div class="state__meta"><span class="state__kind is-amber">Novel</span><span>Playground → Mutation</span></div>
        <h2>The Innovation Playground. <em>Both chasms, lived.</em></h2>
        <p class="lead lead--wide">A business novel in two deliberately different voices.</p>
        <div class="parts">
          <div class="part"><div class="part__k">Book One · The Playground · Crossing one</div><p>Elevate Labs. Oliver's Task Force, the six practices, the Cultural Wall, the Candor Contract and the Innovation Matrix — the crossing from control to trust.</p></div>
          <div class="part is-amber"><div class="part__k">Book Two · SIGNAL · Crossing two</div><p>Deltacore. Layla Sharif, Athena, the Second Chasm — and IMMUNE, the counter-mutation that turns sensing into SignalNet. Signal Sensing → Immune → Mutation.</p></div>
        </div>
        <div class="actions"><a class="btn btn--ink btn--sm" href="{NOTIFY}">Notify me →</a><span class="label">Pre-order link coming soon</span></div>
      </div>
    </article>
    <article class="book">
      <div class="book__cover">{cover("The Mutation", "Age", "THE THEORY BEHIND THE TWO CHASMS", "MARK SAYMEN", 240)}</div>
      <div class="stack">
        <div class="state__meta"><span class="state__kind">Theory</span><span>Reflex → Mutation</span></div>
        <h2>The Mutation Age. <em>The instruments.</em></h2>
        <p class="lead lead--wide">The nonfiction companion — every argument built on named, verifiable sources.</p>
        <div class="parts">
          <div class="part"><div class="part__k">Part I · the Reflex diagnosis</div><p>The executive blind spot, lagging versus leading indicators, and the <b>Seven Stagnation Signals</b> — the fingerprint of an organization watching the wrong scoreboard.</p></div>
          <div class="part is-amber"><div class="part__k">Parts III–V · the Mutation state's textbook</div><p>The <b>Six Vitality Signals</b>, the <b>Five Levers of Reinvention</b>, the leadership playbook, and the field guide behind the <b>Mutation Readiness Index</b>.</p></div>
        </div>
        <div class="actions"><a class="btn btn--ink btn--sm" href="{NOTIFY}">Notify me →</a><a class="link-mono" href="https://agile-agilist.com/assessments/mutation-readiness/">Mutation Readiness Index ↗</a></div>
      </div>
    </article>
  </div>
</section>
<section class="band band--wash">
  <div class="wrap stack">
    <span class="kicker kicker--mute">From the books · one line per state</span>
    <h2>Five states. <em>Five lines to keep.</em></h2>
    <div class="quotes">{quotes}</div>
  </div>
</section>
<section class="band band--ink">
  <div class="wrap castband">
    <div class="stack stack--sm"><h2>Read it, then <em>find your state.</em></h2><p class="lead lead--dark">Fifteen statements. The state you're in, and the leap in front of you.</p></div>
    <div class="actions"><a class="btn btn--amber-lt" href="/assess/">Take the assessment →</a><a class="link-mono link-mono--light" href="/workshops/">The workshops →</a></div>
  </div>
</section>
"""
(OUT / "books.html").write_text(wrap(books_body))

# ---------------------------------------------------------------- page CSS
CSS = """/* ===== TWO CHASMS v2 — inner pages (workshops, cast, books, assess). Generated by build_pages.py ===== */
.tc .section--strip{padding-top:8px;padding-bottom:40px}
.tc .strip{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.tc .strip__item{display:flex;flex-direction:column;gap:6px;background:var(--wash-2);border-top:4px solid var(--slate);padding:14px 16px;color:var(--ink)}
.tc .strip__item.is-amber{border-top-color:var(--amber)}
.tc .strip__item:hover{background:var(--wash);color:var(--ink)}
.tc .strip__num,.tc .strip__kind{font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)}
.tc .strip__item.is-amber .strip__kind{color:var(--amber)}
.tc .strip__name{font-size:20px;font-weight:900;letter-spacing:-.02em;line-height:1}
.tc .sg{padding-top:48px;padding-bottom:8px;scroll-margin-top:16px;border-top:1px solid var(--line)}
.tc .sg:first-of-type{border-top:0}
.tc .sg__head{display:grid;grid-template-columns:auto minmax(0,1fr);gap:24px;align-items:start;margin-bottom:22px}
.tc .sg__icon{background:var(--wash-2);padding:12px 14px}
.tc .sg__meta{justify-content:flex-start;gap:14px}
.tc .state__kind.is-amber{color:var(--amber)}
.tc .wks{display:grid;gap:8px}
.tc .wk{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:18px;align-items:start;background:#fff;border:1px solid var(--line);border-left:4px solid var(--line-2);padding:18px 20px;scroll-margin-top:16px}
.tc .wk.is-flag{border-left-color:var(--amber);background:var(--wash-2)}
.tc .wk--ref{border-left-color:var(--slate)}
.tc .wk:target{outline:2px solid var(--amber);outline-offset:-2px}
.tc .wk__code{font-family:var(--mono);font-size:12px;font-weight:600;letter-spacing:.1em;color:var(--mute);padding-top:2px}
.tc .wk.is-flag .wk__code{color:var(--amber)}
.tc .wk__flag{display:block;margin-top:4px;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase}
.tc .wk__body{display:flex;flex-direction:column;gap:6px}
.tc .wk h3{font-size:19px}
.tc .wk p{font-size:13.5px;line-height:1.6;color:var(--ink-2)}
.tc .wk__art{font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--faint)}
.tc .wk__tier{display:inline-block;font-family:var(--mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--mute);border:1px solid var(--line);padding:8px 11px;white-space:nowrap}
.tc .tiers{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:28px 0}
.tc .tier{border-top:3px solid var(--amber-lt);background:#1A2027;padding:20px;display:flex;flex-direction:column;gap:8px}
.tc .tier h3{color:#fff;font-size:21px}
.tc .tier p{font-size:13.5px;line-height:1.6;color:var(--cloud)}
.tc .tier__meta{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--amber-lt);font-weight:600}
.tc .tier__meta span+span{color:var(--cloud);font-weight:400}
.tc .chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px}
.tc .chip{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:9px 13px;border:1px solid var(--line);background:#fff;color:var(--ink-2);cursor:pointer}
.tc .chip:hover{border-color:var(--amber);color:var(--ink)}
.tc .chip.is-on{background:var(--ink);border-color:var(--ink);color:#fff}
.tc .people{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.tc .person{background:var(--wash-2);border-top:4px solid var(--slate);padding:22px;display:flex;flex-direction:column;gap:10px;scroll-margin-top:16px}
.tc .person[hidden]{display:none}
.tc .person h3{font-size:26px}
.tc .person__tags{display:flex;gap:6px;flex-wrap:wrap}
.tc .tag{font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--slate);border:1px solid var(--line-2);padding:4px 7px;background:#fff}
.tc .tag.is-amber{color:var(--amber);border-color:var(--amber)}
.tc .person__role{font-family:var(--mono);font-size:11.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--amber)}
.tc .person__arch{font-family:var(--mono);font-size:10.5px;line-height:1.6;letter-spacing:.04em;color:var(--mute)}
.tc .pq{margin:4px 0;border-left:3px solid var(--amber);padding-left:14px;font-weight:700;font-size:17px;line-height:1.35;color:var(--ink)}
.tc .person p{font-size:13.5px;line-height:1.65;color:var(--ink-2)}
.tc .boxes{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px}
.tc .box{background:#fff;border-top:2px solid var(--slate);padding:12px}
.tc .box.is-fail{border-top-color:var(--amber)}
.tc .box__k{font-family:var(--mono);font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
.tc .box p{font-size:12.5px;line-height:1.55;color:var(--ink);margin-top:4px}
.tc .person__ws{margin-top:auto;padding-top:6px;font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--mute)}
.tc .books{display:grid;gap:18px}
.tc .book{display:grid;grid-template-columns:220px minmax(0,1fr);gap:32px;align-items:start;border:1px solid var(--line);padding:28px}
.tc .book__cover .cover{display:block;width:100%;height:auto}
.tc .cover .m{font-family:var(--mono)}.tc .cover .a{font-family:var(--sans)}
.tc .parts{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.tc .part{background:var(--wash-2);border-left:4px solid var(--slate);padding:14px 16px}
.tc .part.is-amber{border-left-color:var(--amber)}
.tc .part__k{font-family:var(--mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--mute);font-weight:600;margin-bottom:6px}
.tc .part.is-amber .part__k{color:var(--amber)}
.tc .part p{font-size:13.5px;line-height:1.6;color:var(--ink-2)}
.tc .quotes{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.tc .quote{margin:0;background:#fff;border:1px solid var(--line);border-top:3px solid var(--amber);padding:20px;display:flex;flex-direction:column;gap:10px}
.tc .quote__state{font-family:var(--mono);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--amber);font-weight:600}
.tc .quote blockquote{margin:0;font-weight:700;font-size:17px;line-height:1.35;color:var(--ink)}
.tc .quote figcaption{font-family:var(--mono);font-size:10.5px;letter-spacing:.08em;color:var(--mute)}
.tc .quote figcaption i{font-style:italic}
@media (max-width:720px){
 .tc .sg__head{grid-template-columns:1fr}
 .tc .sg__icon{justify-self:start}
 .tc .wk{grid-template-columns:44px minmax(0,1fr)}
 .tc .wk__act{grid-column:2}
 .tc .book{grid-template-columns:1fr;padding:20px}
 .tc .book__cover{max-width:200px}
 .tc .people{grid-template-columns:1fr}
 .tc .boxes{grid-template-columns:1fr}
}
"""
(OUT / "pages_css.css").write_text(CSS)
print({p.name: p.stat().st_size for p in OUT.iterdir()})
