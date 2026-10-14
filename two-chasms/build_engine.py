"""Build the data-driven assessments for the Two Chasms site.

Engine:  engine/tc-engine.js  (site-wide, inlined into template 7; renders every screen from strings)
Pages:   out/assess.html     — "Where's your team?"  placement reader  (15 state items + the red panel)
         out/maturity.html   — "How mature is each state?"  levels reader  (25 items, 5 per state)
Strings: i18n/en.json        — the complete English catalogue; a translation is a copy with the
                               same keys. Missing keys render as [key] on the page.

Keys:
  ui.*                       engine chrome (buttons, gate, counters, card)
  dim.<state>.name|sub|def   the five states (shared by both assessments)
  q.<assessment>.<item>      a statement;   p.<assessment>.<item>  its probe line
  red.<assessment>.*         the reverse-scored red panel (placement only)
  read.<assessment>.*        result copy, with {placeholders}
  level.<assessment>.<id>.*  maturity level names and bodies
  ws.<code>                  workshop labels used by result CTAs
"""
import base64
import json
import re
import sys
from pathlib import Path

PLAIN = "--plain" in sys.argv   # readable JSON blocks; default is base64 (safe to paste into WordPress)

HERE = Path(__file__).parent
OUT = HERE / "out"
I18N = HERE / "i18n"
I18N.mkdir(exist_ok=True)
SRC_HTML = (HERE / "src" / "index.html").read_text()
SCENES = re.findall(r'<div class="state__icon">(<svg.*?</svg>)</div>', SRC_HTML, re.S)

S = {}  # the English catalogue


def put(key, val):
    assert key not in S, key
    S[key] = val


# ------------------------------------------------------------------ engine chrome
for k, v in {
    "ui.start": "Start the assessment →",
    "ui.back": "← Previous",
    "ui.persp.kicker": "Before you start",
    "ui.persp.title": "Whose answers", "ui.persp.title.em": "are these?",
    "ui.persp.lead": "Answer for the unit you can actually see. The reading is only as honest as the vantage point.",
    "ui.persp.self": "Myself", "ui.persp.team": "My team (under 30)", "ui.persp.unit": "A business unit", "ui.persp.org": "The whole organization",
    "ui.q.counter": "Statement {n} of {total}",
    "ui.q.dim": "State {n} · {name} — {sub}",
    "ui.q.red": "The red panel · Stagnation signal {n} of {total} — {name}",
    "ui.scale.freq.1": "Never", "ui.scale.freq.2": "Rarely", "ui.scale.freq.3": "Sometimes", "ui.scale.freq.4": "Often", "ui.scale.freq.5": "Always",
    "ui.scale.agree.0": "Not true of us", "ui.scale.agree.1": "Rarely true", "ui.scale.agree.2": "Sometimes true", "ui.scale.agree.3": "Mostly true", "ui.scale.agree.4": "Consistently true",
    "ui.scale.na": "N/A",
    "ui.gate.kicker": "Your reading is ready",
    "ui.gate.title": "All answers in.", "ui.gate.title.em": "One email away.",
    "ui.gate.body": "Enter your work email to see your reading and the workshop that gets you across. We'll also send the first chapter of The Mutation Age when it releases.",
    "ui.gate.name": "First name", "ui.gate.email": "Work email", "ui.gate.go": "Show my reading →",
    "ui.gate.fine": "One email per launch update. Unsubscribe anytime. — Agile Agilist Inc.",
    "ui.gate.invalid": "A valid work email is needed",
    "ui.result.kicker": "Your Two Chasms reading",
    "ui.result.retake": "Retake",
    "ui.result.fine": "A directional reading. A facilitated assessment scores each state against its measurable signals with your leadership team.",
    "ui.result.share": "Share on LinkedIn →",
    "ui.result.next.workshops": "All fourteen workshops →",
    "ui.result.next.mrx": "Deep dive: Mutation Readiness Index ↗",
    "ui.result.next.placement": "Place your team on the five states →",
    "ui.chasm.one": "chasm one", "ui.chasm.two": "chasm two",
    "ui.card.top": "OUR TWO CHASMS RESULT", "ui.card.handle": "@TWOCHASMS", "ui.card.foot": "WHERE’S YOUR TEAM?", "ui.card.url": "TWOCHASMS.COM/ASSESS →",
}.items():
    put(k, v)

# ------------------------------------------------------------------ the five states (shared)
STATES = [
    ("reflex", "Reflex", "Iterative delivery at scale", False, None,
     "Delivery works beyond a few teams: dependencies, alignment, a shared cadence. Without it, nothing above has a floor.", ("ws.s1", "/workshops/#reflex")),
    ("playground", "Playground", "Innovation in cadence", True, "one",
     "Chasm one, control → trust. Innovation recurring and protected inside the existing rhythm — not run beside it.", ("ws.p6", "/workshops/#p6")),
    ("signal-sensing", "Signal Sensing", "AI-Native", False, None,
     "Processes, roles and governance redesigned around AI — and leading signals read before the lagging metrics move.", ("ws.s1", "/workshops/#s1")),
    ("immune", "Immune", "AI automation", True, "two",
     "Chasm two, metrics → signals. Automate where it changes the economics of work; the human keeps the decision and the accountability.", ("ws.s6", "/workshops/#s6")),
    ("mutation", "Mutation", "Mutation", True, None,
     "The capacity to change the model itself, not just adapt inside the one you have.", ("ws.m2", "/workshops/#m2")),
]
for sid, name, sub, amber, chasm, d, ws in STATES:
    put(f"dim.{sid}.name", name); put(f"dim.{sid}.sub", sub); put(f"dim.{sid}.def", d)
for k, v in {"ws.s1": "S1 Signal Mapping", "ws.p6": "P6 The Innovation Matrix", "ws.s6": "S6 IMMUNE / SignalNet",
             "ws.m2": "M2 Mutation Readiness, facilitated", "ws.s1.exit": "S1 Signal Mapping — the exit from Reflex"}.items():
    put(k, v)

SCALE_FREQ = [[0, "ui.scale.freq.1"], [1, "ui.scale.freq.2"], [2, "ui.scale.freq.3"], [3, "ui.scale.freq.4"], [4, "ui.scale.freq.5"], [None, "ui.scale.na"]]
SCALE_AGREE = [[0, "ui.scale.agree.0"], [1, "ui.scale.agree.1"], [2, "ui.scale.agree.2"], [3, "ui.scale.agree.3"], [4, "ui.scale.agree.4"], [None, "ui.scale.na"]]
HUBSPOT = {"portal": "46316757", "form": "c6f0d4c1-d233-4875-9b0c-4528cda02237"}
LINKS = {"workshops": "/workshops/", "mrx": "https://agile-agilist.com/assessments/mutation-readiness/", "placement": "/assess/", "maturity": "/maturity/"}


def dims(ws_override=None):
    out = []
    for sid, name, sub, amber, chasm, d, ws in STATES:
        o = {"id": sid, "amber": amber, "ws": list(ws)}
        if chasm: o["chasm"] = chasm
        if ws_override and sid in ws_override: o["ws"] = ws_override[sid]
        out.append(o)
    return out


# ------------------------------------------------------------------ PLACEMENT ("Where's your team?")
# The 15 statements and scoring carried over unchanged from "Which wave are you in?" (page 13).
PLACEMENT_Q = {
    "reflex": [
        ("r1", "Work that spans more than three teams reaches customers on a predictable cadence, without heroics.", "Think of the last release that needed several teams. Did it land when planned?"),
        ("r2", "Cross-team dependencies are visible and managed before they become escalations.", "Could anyone list this quarter’s top five dependencies today, without a meeting?"),
        ("r3", "One planning rhythm governs all the teams that need to move together.", "Same cadence, same planning event — or a calendar of local plans stitched together?"),
    ],
    "playground": [
        ("p1", "A protected share of capacity goes to experiments every cycle — and survives quarterly pressure.", "When the last quarter got tight, what happened to the experiment budget?"),
        ("p2", "Experiments have pre-agreed success criteria, and some are expected to fail.", "Name the last experiment that was stopped on its own criteria rather than by a calendar."),
        ("p3", "An idea from outside the leadership team shipped to customers in the last quarter.", "Where did the last shipped idea actually come from?"),
    ],
    "signal-sensing": [
        ("s1", "At least one core process has been redesigned around AI rather than having a copilot added to it.", "Redesigned means the steps changed, not that a tool was added to the old steps."),
        ("s2", "Roles have changed because of AI — what people are accountable for is different than eighteen months ago.", "Has any job description been rewritten because of what AI now does?"),
        ("s3", "Governance treats AI systems as actors with identity and scoped permissions, not as tools.", "Does every AI system that acts have its own identity, owner and permission scope?"),
    ],
    "immune": [
        ("i1", "Where AI acts autonomously, a named human owns the decision and can explain it after the fact.", "Pick one autonomous action from last week. Who owns it, by name?"),
        ("i2", "Automation was chosen where it changed the unit economics of the work — not where it was merely possible.", "Could you show the before-and-after cost per unit for your largest automation?"),
        ("i3", "Every autonomous action leaves enough evidence to reconstruct what happened.", "If a customer challenged an automated decision tomorrow, could you replay it?"),
    ],
    "mutation": [
        ("m1", "We have retired or fundamentally rebuilt a core part of our operating model in the last twelve months.", "Retired or rebuilt — not renamed. The rebrand doesn’t count."),
        ("m2", "We track leading signals — behaviour, language, workflow drift — not only lagging metrics.", "For each metric on the dashboard, is there a signal that moves first, with a named listener?"),
        ("m3", "Someone was visibly rewarded in the last year for raising a signal that invalidated a plan.", "Not tolerated — rewarded, and visibly."),
    ],
}
# The red panel: Seven Stagnation Signals (The Mutation Age, Part II). Statements by the author.
STAG = [
    ("rd", "R&D Translation Gap", "We research and prototype far more than we ship — labs and pilots rarely reach the customer."),
    ("platform", "Platform Dilution", "Our tools are built for internal use; there is no API, SDK or developer program that others build on."),
    ("ecosystem", "Ecosystem Disengagement", "Fewer third parties integrate with us than two years ago, and top AI or engineering talent is choosing startups or rivals."),
    ("consulting", "Consulting-to-Product Imbalance", "Headcount grows while product revenue stays flat; we solve with people what competitors solve with platforms."),
    ("talent", "Talent Flight from Core Teams", "Our strongest builders and product leaders have quietly moved to edge roles, competitors or their own startups."),
    ("brand", "Brand Perception Lag", "Customers, analysts and journalists still describe us by a product or era we are trying to move past."),
    ("anomaly", "Absence of Anomaly Listening", "“That’s just noise” is a common response to odd data, user pushback or internal dissent, and there is no route to escalate it."),
]


def register_questions(aid, qs):
    for sid, items in qs.items():
        for qid, text, probe in items:
            put(f"q.{aid}.{qid}", text); put(f"p.{aid}.{qid}", probe)
    return {sid: [q[0] for q in items] for sid, items in qs.items()}


pq = register_questions("placement", PLACEMENT_Q)
for qid, name, text in STAG:
    put(f"q.placement.{qid}", text); put(f"red.placement.{qid}.name", name)
for k, v in {
    "red.placement.def": "The Seven Stagnation Signals are the fingerprint of Reflex. Here, agreeing is the warning sign.",
    "red.placement.probe": "How true is this of your organization today?",
    "red.placement.title": "The red panel", "red.placement.sub": "Seven Stagnation Signals · high = Reflex",
    "red.placement.band.listening": "Listening", "red.placement.band.entropy": "Early entropy",
    "red.placement.band.bleed": "A slow bleed disguised as momentum", "red.placement.band.reflex": "Reflex — the red panel is lit",
    # result copy (placement reader)
    "read.placement.all.head": "All five holding.", "read.placement.all.head.em": "You’re in Mutation.",
    "read.placement.all.body": "Every state is holding. The risk now is success hardening — practices freezing into routines that stop being questioned. Re-score quarterly, and treat a falling Mutation score as the first signal, not a rounding error. Relapse to Reflex is one rebrand away.",
    "read.placement.all.card": "Both chasms crossed.", "read.placement.all.card.em": "Keep crossing.",
    "read.placement.floor.head": "You’re in Reflex.", "read.placement.floor.head.em": "The floor isn’t holding yet.",
    "read.placement.floor.body": "Iterative delivery at scale is not yet holding, so nothing above it has a floor. That is not a criticism — it is the honest place to start, and the state with the fastest, most visible payoff. Start by making the dashboard tell the truth.",
    "read.placement.floor.card": "Standing in Reflex.", "read.placement.floor.card.em": "Next leap: Playground.",
    "read.placement.gap.head": "You’re in {at}.", "read.placement.gap.head.em": "{weak} is not holding.",
    "read.placement.gap.body": "You are operating in {at} while {weak} ({weakSub}) is not holding.",
    "read.placement.gap.stuck": "Part of the team is still in {chasm}.",
    "read.placement.gap.tail": "This is the most common and most expensive pattern we see: the organization has climbed higher than its governance can support. The next move is not another state up. It is closing the gap beneath you.",
    "read.placement.gap.card.stuck": "Stuck in {chasm}.", "read.placement.gap.card.em": "Next leap: {weak}.",
    "read.placement.gap.card": "Climbed past {weak}.", "read.placement.gap.card2.em": "Go back and close it.",
    "read.placement.next.head": "You’re in {at}.", "read.placement.next.head.em": "Next leap: {weak}.",
    "read.placement.next.body": "{holding} holding. {weak} ({weakSub}) is the leap in front of you — and only if the market demands it. Climbing higher than the problem requires is an expensive way to be wrong.",
    "read.placement.next.card.edge": "Standing on the edge.", "read.placement.next.card.one": "One chasm down.", "read.placement.next.card.two": "Two chasms down.",
    "read.placement.next.card.em": "Next leap: {weak}.",
    "read.placement.red.reflex": "The red panel disagrees, though: delivery holds, but the Seven Stagnation Signals read Reflex. That is the scoreboard being wrong — start with S1 Signal Mapping.",
}.items():
    put(k, v)

PLACEMENT = {
    "id": "placement", "scaleMax": 4,
    "dimensions": [dict(d, questions=pq[d["id"]]) for d in dims({"reflex": ["ws.s1.exit", "/workshops/#reflex"]})],
    "red": {"questions": [q[0] for q in STAG], "scaleMax": 4, "litAt": 3,
            "bands": [[7, "listening"], [14, "entropy"], [21, "bleed"], [28, "reflex"]]},
    "scales": {"main": SCALE_FREQ, "red": SCALE_AGREE},
    "reader": {"type": "placement", "holdAt": 60, "triedAt": 40, "deepDiveAt": 3, "redReflexAt": 22},
    "hubspot": HUBSPOT, "links": LINKS,
}

# ------------------------------------------------------------------ MATURITY (five-state maturity)
# Five statements per state, each one a practice named in Framework_Map §2. Levels = the book's
# Mutation Readiness Scorecard scale: 0 Blind · 1 Aware but slow · 2 Reactive · 3 Proactive and
# embedded · 4 Self-mutating, applied per state and to the mean.
MATURITY_Q = {
    "reflex": [
        ("r1", "Work that spans more than three teams reaches customers on a predictable cadence, without heroics.", "Think of the last release that needed several teams. Did it land when planned?"),
        ("r2", "Cross-team dependencies are visible and managed before they become escalations.", "Could anyone list this quarter’s top five dependencies today, without a meeting?"),
        ("r3", "One planning rhythm governs all the teams that need to move together.", "Same cadence, same planning event — or a calendar of local plans stitched together?"),
        ("r4", "Information reaches decision-makers in time to act — not aggregated into a report after the fact.", "The Aggregation filter: by the time the number is on a slide, is it already too late?"),
        ("r5", "People raise what they noticed without waiting for permission to say it.", "The Hierarchy filter: does a signal have to be cleared by a manager before it travels?"),
    ],
    "playground": [
        ("p1", "A protected share of capacity goes to experiments every cycle — and survives quarterly pressure.", "When the last quarter got tight, what happened to the experiment budget?"),
        ("p2", "Experiments run in small loops with pre-agreed success criteria, and some are expected to fail.", "Name the last experiment that was stopped on its own criteria rather than by a calendar."),
        ("p3", "People tell each other the uncomfortable truth early, and it is met with enquiry rather than blame.", "The Candor Contract: when did someone last say the thing nobody wanted to hear — and what happened to them?"),
        ("p4", "Deep-work time is protected; attention is treated as a budget, not an assumption.", "Protect attention: are boredom breaks and uninterrupted blocks on the calendar, or only in the values deck?"),
        ("p5", "Leadership has circled two cells of the Innovation Matrix and visibly said no to the rest.", "Choose two cells. Could you name the fourteen you are not playing?"),
    ],
    "signal-sensing": [
        ("s1", "For each lagging metric on the dashboard, we know the signal that moves first — and who is listening for it.", "Exhibit 2.1: lagging metric → the signal that moves first → Goodhart check → named listener."),
        ("s2", "Before a signal is acted on, we ask whether it repeats and whether it costs the source something to send.", "The two signal tests. A single loud complaint is noise; a quiet pattern that costs the sender is a signal."),
        ("s3", "At least one core process has been redesigned around AI rather than having a copilot added to it.", "Redesigned means the steps changed, not that a tool was added to the old steps."),
        ("s4", "We learn from how customers and systems actually behave, not only from what people say in interviews.", "Observe, don’t ask: behavioural telemetry before survey questions."),
        ("s5", "A sensemaking cell close to the work meets on a cadence and can escalate without going through the hierarchy.", "Who met last week, how close to the customer, and what did they escalate?"),
    ],
    "immune": [
        ("i1", "Anyone can log something unfamiliar — from a supplier, a system or a person — without blame or consequence.", "The three rings. The NASA reporting-system precedent: log the unfamiliar, not the unhappy."),
        ("i2", "Logged signals are clustered, ranked by how unfamiliar they are, and each cluster has a named listener.", "A live SignalNet, or a suggestion box nobody reads?"),
        ("i3", "Where AI acts autonomously, a named human owns the decision and can explain it after the fact.", "Athena detects. Humans decide. Governance records. Which of the three is missing?"),
        ("i4", "We measure the delay between a signal being raised and a decision being made.", "Governance latency: do you know your signal-to-decision time in days?"),
        ("i5", "We keep a register of what the current model has made us stop seeing, and every new version names what the last one got wrong.", "The blind-spot register. Is there a page the rulebook would rather not have?"),
    ],
    "mutation": [
        ("m1", "We have retired or fundamentally rebuilt a core part of our operating model in the last twelve months.", "Retired or rebuilt — not renamed. The rebrand doesn’t count."),
        ("m2", "Leading indicators — behaviour, language, workflow drift — sit on the dashboard beside the lagging ones.", "The leading-indicator dashboard: which of the Six Vitality Signals do you actually watch?"),
        ("m3", "Someone was visibly rewarded in the last year for raising a signal that invalidated a plan.", "Not tolerated — rewarded, and visibly."),
        ("m4", "The story we tell about ourselves matches what we actually do this quarter — not the year we rebranded.", "Narrative coherence: could a new hire describe what you are for, in the current market?"),
        ("m5", "We re-score our readiness on a cadence and treat a falling score as a signal, not a rounding error.", "Mutation is maintained, not reached. When did you last re-score?"),
    ],
}
mq = register_questions("maturity", MATURITY_Q)
LEVELS = [
    ("blind", 19, "Blind", "This state is not practised. What it protects against is happening unseen, and the dashboard will be the last to know."),
    ("aware", 39, "Aware but slow", "The ideas are known and the language is in use, but the practices are occasional and depend on individuals. Nothing here is load-bearing yet."),
    ("reactive", 59, "Reactive", "The practices run when something forces them — a miss, a crisis, a review. They work, late. The gap is cadence: make them routine before the next shock, not after it."),
    ("proactive", 79, "Proactive and embedded", "The practices run on a rhythm, with named owners, and survive quarterly pressure. The risk is success hardening — keep the correction clause alive."),
    ("selfmutating", 100, "Self-mutating", "The state corrects itself: the practices change the practices. Re-score on a cadence and treat a fall as the first signal."),
]
for lid, _, name, body in LEVELS:
    put(f"level.maturity.{lid}.name", name); put(f"level.maturity.{lid}.body", body)
for k, v in {
    "read.maturity.head": "{level}.", "read.maturity.head.em": "{overall} across the five states.",
    "read.maturity.weak": "Weakest state: {weak} ({weakLevel}). Strongest: {strong}. Maturity is only as real as its weakest state — that is where the next workshop goes.",
    "read.maturity.card": "{level}.", "read.maturity.card.em": "Next: {weak}.",
}.items():
    put(k, v)

MATURITY = {
    "id": "maturity", "scaleMax": 4,
    "dimensions": [dict(d, questions=mq[d["id"]]) for d in dims()],
    "scales": {"main": SCALE_AGREE},
    "reader": {"type": "levels", "bands": [[lv[1], lv[0]] for lv in LEVELS], "deepDiveAt": 60},
    "hubspot": HUBSPOT, "links": LINKS,
}

# ------------------------------------------------------------------ pages
STATE_CARDS = "".join(
    f'<article class="state{" is-amber" if a else ""}"><div class="state__icon">{SCENES[i]}</div>'
    f'<div class="state__meta"><span class="state__kind">{kind}</span><span>0{i + 1}</span></div><h3>{n}</h3><p>{blurb}</p></article>'
    for i, ((sid, n, sub, a, chasm, d, ws), kind, blurb) in enumerate(zip(
        STATES, ["State", "Chasm one", "State", "Chasm two", "Arrived"],
        [f"Wave 0{i + 1} · {s[2]}." for i, s in enumerate(STATES)])))


def jdump(o):
    # "</" would end the inline <script> block; "<\/" is the same JSON string.
    return json.dumps(o, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")


def block(cls, o):
    if PLAIN:
        return f'<script type="application/json" class="{cls}">{jdump(o)}</script>'
    b = base64.b64encode(json.dumps(o, ensure_ascii=False, separators=(",", ":")).encode()).decode()
    return f'<script type="application/json" class="{cls}" data-enc="base64">{b}</script>'


def page(aid, cfg, hero_kicker, h1, h1_em, lead, intro_note, deeper):
    strings = {k: v for k, v in S.items() if k.startswith("ui.") or k.startswith("dim.") or k.startswith("ws.") or f".{aid}." in k}
    body = f"""
<section class="wrap hero" data-tc-intro>
  <span class="kicker">{hero_kicker}</span>
  <h1>{h1} <em>{h1_em}</em></h1>
  <p class="lead">{lead}</p>
  <div class="actions"><button class="btn btn--amber" type="button" data-tc-start>Start the assessment →</button><a class="link-mono" href="/workshops/">The workshops →</a></div>
</section>
<section class="wrap section section--tight" data-tc-intro>
  <div class="states">{STATE_CARDS}</div>
  <p class="as__note">{intro_note}</p>
</section>
<div data-tc-mount data-tc-assessment="{aid}"></div>
{block("tc-config", cfg)}
{block("tc-strings", strings)}
{deeper}
"""
    body = re.sub(r"\n\s*\n", "\n", body.strip())
    return "<!-- wp:html -->\n<div class=\"tc\">\n" + body + "\n</div>\n<!-- /wp:html -->\n"


DEEPER_ASSESS = """
<section class="band band--wash">
  <div class="wrap stack">
    <span class="kicker kicker--mute">Go deeper</span>
    <h2>Placement first. <em>Then maturity, then readiness.</em></h2>
    <p class="lead lead--wide">Placement tells you which state you stand on. The maturity assessment scores how well each of the five states is practised. If you land in Immune or Mutation, the Mutation Readiness Index on agile-agilist.com is the full readiness read.</p>
    <div class="actions"><a class="btn btn--ink" href="/maturity/">Five-state maturity →</a><a class="link-mono" href="https://agile-agilist.com/assessments/mutation-readiness/">Mutation Readiness Index ↗</a></div>
  </div>
</section>"""
DEEPER_MATURITY = """
<section class="band band--wash">
  <div class="wrap stack">
    <span class="kicker kicker--mute">Go deeper</span>
    <h2>Maturity by state. <em>Placement tells you which one you stand on.</em></h2>
    <p class="lead lead--wide">If you haven't placed your team yet, start there: fifteen statements and the red panel name the state you operate in and the leap in front of you. The Mutation Readiness Index on agile-agilist.com is the full readiness read.</p>
    <div class="actions"><a class="btn btn--ink" href="/assess/">Where's your team? →</a><a class="link-mono" href="https://agile-agilist.com/assessments/mutation-readiness/">Mutation Readiness Index ↗</a></div>
  </div>
</section>"""

(OUT / "assess.html").write_text(page(
    "placement", PLACEMENT, "The assessment · 22 statements · about 12 minutes as a team",
    "Where's your team?", "Find the ball.",
    "Answer as a team. Fifteen statements, three for each state, then the red panel: the Seven Stagnation Signals from <i>The Mutation Age</i>. You get the state you're operating in, the one beneath you that isn't holding, how loudly the red panel is lit, and the workshop that gets you across.",
    "Three statements per state, then seven for the red panel.", DEEPER_ASSESS))
(OUT / "maturity.html").write_text(page(
    "maturity", MATURITY, "Maturity assessment · 25 statements · about 15 minutes as a team",
    "How mature is each state?", "Five scores, one weakest.",
    "Twenty-five statements, five for each of the five states — every one a practice from the books. Each state is scored and placed on the five-level scale of the Mutation Readiness Scorecard, from Blind to Self-mutating. The weakest state names your next workshop.",
    "Five statements per state. Levels: Blind · Aware but slow · Reactive · Proactive and embedded · Self-mutating.", DEEPER_MATURITY))

(I18N / "en.json").write_text(json.dumps(dict(sorted(S.items())), ensure_ascii=False, indent=1) + "\n")
(OUT / "engine_css.css").write_text("""/* ----- tc-engine additions ----- */
.tc .as__note{font-family:var(--mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--mute);margin-top:14px}
.tc .as__lvl{font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--amber);font-weight:600;margin-right:10px}
.tc .as__bar.is-hold .as__lvl{color:var(--slate)}
""")
print({p.name: p.stat().st_size for p in [OUT / "assess.html", OUT / "maturity.html", I18N / "en.json"]}, "strings:", len(S))
