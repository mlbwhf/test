// The Two Chasms Framework: the workshops, the five-state readiness check and the Foundations
// class from Mark Saymen's books The Innovation Playground and The Mutation Age, as Trainyard
// templates. Each workshop is one board laid out the way it is facilitated: a "Start here"
// strip (purpose, agenda, who is in the room, facilitator's rules), then one frame per step
// holding that step's exercises, then the artifact the team keeps.
//
// The framework is organised by five states. Three are ground an organisation stands on, two
// are the crossings between them (the two chasms):
//
//   Reflex → [Playground: control → trust] → Signal Sensing → [IMMUNE: metrics → signals] → Mutation
//
// Workshop codes follow the framework site: P1–P7 (Playground), S1–S7 (Signal Sensing and
// IMMUNE), M1–M2 (Mutation), R0 (the readiness check that places a team on the map).
//
// Content © Mark Saymen, The Two Chasms Framework. Cited research is named where a step uses
// it: Henderson & Clark (1990) and Christensen (1997) for the Innovation Matrix columns, Kim
// Scott's Radical Candor, Conway's law and the Inverse Conway manoeuvre, Goodhart's law,
// Matzinger's danger model (1994), NASA's Aviation Safety Reporting System (1976–).

import { emptyBoard, type Board } from "./boards.js";
import { classBoard, ExerciseBuilder, renderExercise, type ClassSpec, type Exercise } from "./classes.js";
import type { TemplateInfo } from "./templates.js";

export type TwoChasmsState = "reflex" | "playground" | "signal-sensing" | "immune" | "mutation";

export const TWO_CHASMS_STATES: { id: TwoChasmsState; label: string; kind: "ground" | "crossing"; wave: string; line: string; blurb: string }[] = [
  { id: "reflex", label: "Reflex", kind: "ground", wave: "01 Iterative delivery at scale", line: "Watching the wrong scoreboard.", blurb: "Metric-bound and control-oriented. Information arrives late; messengers wait for permission." },
  { id: "playground", label: "Playground", kind: "crossing", wave: "02 Innovation in cadence", line: "Experience, then evidence, then build.", blurb: "Chasm one, from control to trust. Innovation practised, not announced." },
  { id: "signal-sensing", label: "Signal Sensing", kind: "ground", wave: "03 AI-Native", line: "A signal answers: what is about to?", blurb: "Generative and signal-aware. The culture changed; the scoreboard has not yet." },
  { id: "immune", label: "Immune", kind: "crossing", wave: "04 AI automation", line: "Your immune system is your people. Teach them to notice.", blurb: "Chasm two, from metrics to signals. Noticing becomes load-bearing, not personality-dependent." },
  { id: "mutation", label: "Mutation", kind: "ground", wave: "05 Mutation", line: "Crossing a chasm is not an event you complete. It is a capability you keep needing.", blurb: "Signal-first. The capacity to change the model itself, not only adapt inside it." },
];

export interface WorkshopStep {
  title: string;
  minutes: number;
  exercises: Exercise[];
}

export interface WorkshopSpec {
  /** Framework code shown on the site and in certification: P1…P7, S1…S7, M1, M2, R0. */
  code: string;
  id: string;
  name: string;
  state: TwoChasmsState;
  /** Where the workshop comes from in the books. */
  source: string;
  purpose: string;
  room: string;
  artifact: string;
  rules: string[];
  steps: WorkshopStep[];
  /** The sentence written beneath the artifact at the end. */
  closing: string;
  tags: TemplateInfo["tags"];
  mapsTo?: string;
}

// ---- layout ------------------------------------------------------------------------------

const GAP = 40;
const PAD = 30;
const MAX_W = 2600;
const C = { yellow: "#fff6c2", green: "#dcf3e4", blue: "#cfe3fb", pink: "#fbd9d2", purple: "#e6e0ff", ember: "#ffe0b0" };

function rowOf(b: InstanceType<typeof ExerciseBuilder>, exercises: Exercise[], x0: number, y0: number, parentId: string): number {
  let cx = x0;
  let cy = y0;
  let rowH = 0;
  for (const ex of exercises) {
    const size = renderExercise(new ExerciseBuilder(), ex, 0, 0, "probe");
    if (cx > x0 && cx + size.w > MAX_W) {
      cx = x0;
      cy += rowH + GAP;
      rowH = 0;
    }
    const r = renderExercise(b, ex, cx, cy, parentId);
    cx += r.w + GAP;
    rowH = Math.max(rowH, r.h);
  }
  return cy + rowH - y0;
}

/** Builds one workshop board. */
export function workshopBoard(spec: WorkshopSpec, now = "2026-01-01T00:00:00.000Z"): Board {
  const b = new ExerciseBuilder();
  const state = TWO_CHASMS_STATES.find((s) => s.id === spec.state)!;
  const total = spec.steps.reduce((n, s) => n + s.minutes, 0);
  let y = 0;

  const start = b.frame(`Start here · ${spec.code} ${spec.name}`, 0, y, MAX_W, 0);
  const startH = rowOf(
    b,
    [
      { kind: "slide", title: "Purpose", body: spec.purpose, steps: [`Artifact: ${spec.artifact}`, `Source: ${spec.source}`, `State: ${state.label} (${state.kind === "crossing" ? "a crossing" : "ground"}) · wave ${state.wave}`] },
      { kind: "table", title: `The session · ${total} min`, columns: ["Step", "Minutes"], rows: spec.steps.map((s, i) => [`${i + 1}. ${s.title}`, String(s.minutes)]) },
      { kind: "slide", title: "Who is in the room", body: spec.room },
      { kind: "slide", title: "Facilitator's rules", body: "Hold these even when the room pushes back.", steps: spec.rules },
    ],
    PAD,
    y + 60,
    start.id,
  );
  start.height = startH + 60 + PAD;
  y += start.height + GAP * 2;

  spec.steps.forEach((step, i) => {
    const f = b.frame(`Step ${i + 1}: ${step.title} · ${step.minutes} min`, 0, y, MAX_W, 0);
    const h = rowOf(b, step.exercises, PAD, y + 60, f.id);
    f.height = h + 60 + PAD;
    y += f.height + GAP * 2;
  });

  const art = b.frame(`The artifact: ${spec.artifact}`, 0, y, MAX_W, 260);
  b.node("card", spec.closing, PAD, y + 60, MAX_W - 2 * PAD, 120, art.id, { color: C.ember, fields: { fontSize: 22 } });
  b.node("text", `Photograph it, date it, and keep it versioned. ${state.line}`, PAD, y + 196, MAX_W - 2 * PAD, 40, art.id, { fields: { fontSize: 14 } });

  const board = emptyBoard(`tpl-builtin-tc-${spec.id}`, `${spec.code} · ${spec.name}`, { system: "trainyard", externalId: `builtin:tc-${spec.id}`, importedAt: now });
  board.isTemplate = true;
  board.frames = b.frames;
  board.nodes = b.nodes;
  board.fields = { framework: "two-chasms", code: spec.code, state: spec.state, minutes: total };
  return board;
}

export function workshopInfo(spec: WorkshopSpec): TemplateInfo {
  const state = TWO_CHASMS_STATES.find((s) => s.id === spec.state)!;
  return {
    id: `tc-${spec.id}`,
    name: `${spec.code} · ${spec.name}`,
    blurb: spec.purpose,
    event: `${state.label} workshop · ${spec.steps.reduce((n, s) => n + s.minutes, 0)} min`,
    method: "two-chasms",
    tags: spec.tags,
    zones: ["Start here", ...spec.steps.map((s, i) => `Step ${i + 1}: ${s.title}`), "The artifact"],
    cardTypes: ["Sticky", "Slide", "Table cell"],
    mapsTo: spec.mapsTo ?? "Nothing (a workshop record)",
  };
}

// ---- shared content ----------------------------------------------------------------------

const MATRIX_COLUMNS = ["", "Incremental · small refinements", "Architectural · reconfigured components", "Radical · new capability", "Disruptive · market-dynamics pattern"];
const MATRIX_ROWS = [["Product · what we sell", "", "", "", ""], ["Process · how we make it", "", "", "", ""], ["Business model · how we make money", "", "", "", ""], ["Customer experience · how customers experience it", "", "", "", ""]];

const RINGS: Exercise = { kind: "zones", title: "IMMUNE: the three rings", zones: ["Suppliers (outer)", "Internal systems (middle)", "People (core)"], color: C.pink };

const SIGNAL_CARD: Exercise = {
  kind: "table",
  title: "The signal card",
  columns: ["Field", "Write"],
  rows: [["Ring", "Suppliers / Internal systems / People"], ["What I noticed", "One sentence. Concrete. What actually happened."], ["Why it's unfamiliar", "What I expected instead."], ["When", "Date, or 'started around…'"], ["Gut reading", "One word: odd / too smooth / faster / quieter / new"], ["Name", "Optional. Anonymous cards count equally."]],
};

const EXHIBIT_2_1: Exercise = {
  kind: "table",
  title: "Worked example · Exhibit 2.1 (The Innovation Playground, Book Two, Ch. 2)",
  columns: ["What the dashboard reports", "What would have told you sooner"],
  rows: [["Revenue", "Product-usage deviation in key accounts"], ["Churn rate", "Onboarding friction flagged by customer agents"], ["NPS", "AI-agent sentiment drawn from chat logs"], ["Deal size", "Time-to-decision compression or expansion"], ["Market share", "Partner API usage over time"], ["Win/loss ratio", "Prompt-library overlap with competitor agents"]],
};

const BLIND_SPOTS_EXAMPLE: Exercise = {
  kind: "table",
  title: "Worked example · Deltacore's whiteboard (Book Two, Ch. 13)",
  columns: ["The warning", "Do we have it?"],
  rows: [["Helix fixation", ""], ["Language over-weighting", ""], ["Regulatory interpretation risk", ""], ["Athena validation dependency", ""], ["Sensemaking-cell elitism", ""], ["Cost-model lag", ""], ["Partner blind zones", ""], ["Regional unevenness", ""], ["Executive dashboard overload", ""], ["Training decay", ""], ["Success hardening", ""]],
};

// ---- the workshops -----------------------------------------------------------------------

export const TWO_CHASMS_WORKSHOPS: WorkshopSpec[] = [
  // ---------------- R0 · placing the team on the map ----------------
  {
    code: "R0",
    id: "readiness-check",
    name: "Five-State Readiness Check",
    state: "reflex",
    source: "The five-wave operating model; the Seven Stagnation Signals (The Mutation Age, Part II)",
    purpose: "Place the organisation on the five-state map before choosing a workshop. Fifteen statements, three per state, scored 0–4, plus the Seven Stagnation Signals as a reverse-scored screen. The output is where you stand, which crossing is not holding, and the one workshop to run next.",
    room: "The leadership team and two or three people from the edge of the organisation (customer-facing, operations, partners). Six to twelve. Score individually first, then compare.",
    artifact: "the five-state reading and the next workshop",
    rules: ["Score what is true, not what is planned.", "Individual scores first, discussion second; spreads are the finding.", "A state counts as held at 60% or more. Climbing past a state you do not hold is the most expensive pattern there is.", "The Stagnation screen is reverse-scored: a high total means Reflex, whatever the waves say."],
    tags: ["team", "portfolio"],
    mapsTo: "Nothing (assessment record); pair with the live Mutation Readiness assessment",
    steps: [
      {
        title: "Score the five states",
        minutes: 20,
        exercises: [
          {
            kind: "table",
            title: "Fifteen statements · 0 not true · 1 rarely · 2 sometimes · 3 mostly · 4 consistently",
            columns: ["State", "Statement", "Score"],
            rows: [
              ["01 Reflex → floor", "Work that spans more than three teams reaches customers on a predictable cadence, without heroics.", ""],
              ["01 Reflex → floor", "Cross-team dependencies are visible and managed before they become escalations.", ""],
              ["01 Reflex → floor", "One planning rhythm governs all the teams that need to move together.", ""],
              ["02 Playground", "A protected share of capacity goes to experiments every cycle, and survives quarterly pressure.", ""],
              ["02 Playground", "Experiments have pre-agreed success criteria, and some are expected to fail.", ""],
              ["02 Playground", "An idea from outside the leadership team shipped to customers in the last quarter.", ""],
              ["03 Signal Sensing", "At least one core process has been redesigned around AI rather than having a copilot added to it.", ""],
              ["03 Signal Sensing", "Roles have changed because of AI: what people are accountable for is different than eighteen months ago.", ""],
              ["03 Signal Sensing", "Governance treats AI systems as actors with identity and scoped permissions, not as tools.", ""],
              ["04 Immune", "Where AI acts autonomously, a named human owns the decision and can explain it after the fact.", ""],
              ["04 Immune", "Automation was chosen where it changed the unit economics of the work, not where it was merely possible.", ""],
              ["04 Immune", "Every autonomous action leaves enough evidence to reconstruct what happened.", ""],
              ["05 Mutation", "We have retired or fundamentally rebuilt a core part of our operating model in the last twelve months.", ""],
              ["05 Mutation", "We track leading signals (behaviour, language, workflow drift), not only lagging metrics.", ""],
              ["05 Mutation", "Someone was visibly rewarded in the last year for raising a signal that invalidated a plan.", ""],
            ],
          },
        ],
      },
      {
        title: "The Stagnation screen",
        minutes: 15,
        exercises: [
          {
            kind: "table",
            title: "The Seven Stagnation Signals · reverse-scored · 0–7 listening · 8–14 early entropy · 15–21 slow bleed disguised as momentum · 22–28 the red panel is lit",
            columns: ["Signal", "Statement", "Score"],
            rows: [
              ["R&D translation gap", "We research and prototype far more than we ship: labs and pilots rarely reach the customer.", ""],
              ["Platform dilution", "Our tools are built for internal use; there is no API, SDK or developer programme that others build on.", ""],
              ["Ecosystem disengagement", "Fewer third parties integrate with us than two years ago, and top AI or engineering talent is choosing startups or rivals.", ""],
              ["Consulting-to-product imbalance", "Headcount grows while product revenue stays flat; we solve with people what competitors solve with platforms.", ""],
              ["Talent flight from core teams", "Our strongest builders and product leaders have quietly moved to edge roles, competitors or their own startups.", ""],
              ["Brand perception lag", "Customers, analysts and journalists still describe us by a product or era we are trying to move past.", ""],
              ["Absence of anomaly listening", "'That's just noise' is a common response to odd data, user pushback or internal dissent, and there is no route to escalate it.", ""],
            ],
          },
        ],
      },
      {
        title: "Read the map",
        minutes: 20,
        exercises: [
          { kind: "zones", title: "Where we stand · place a sticky per person", zones: ["Reflex", "Playground", "Signal Sensing", "Immune", "Mutation"], color: C.blue },
          { kind: "stickies", title: "The gap beneath us", lanes: ["Highest state we operate at", "Lowest state that is not holding", "What that gap is costing"], rows: 2, color: C.pink },
        ],
      },
      {
        title: "Choose the next workshop",
        minutes: 10,
        exercises: [
          { kind: "table", title: "If this is the state not holding, run this next", columns: ["State not holding", "Run next"], rows: [["Reflex (no floor)", "S1 Signal Mapping, then the delivery floor"], ["Playground", "P1 Charter the Playground · P6 The Innovation Matrix"], ["Signal Sensing", "S1 Signal Mapping · S2 Grown, Not Built"], ["Immune", "S6 IMMUNE / SignalNet · S5 Governance Latency"], ["Mutation", "M1 The Living Playbook · M2 Mutation Readiness"]] },
        ],
      },
    ],
    closing: "We are in ________. ________ is not holding. Next we run ________.",
  },

  // ---------------- PLAYGROUND · chasm one, control → trust ----------------
  {
    code: "P1",
    id: "charter-the-playground",
    name: "Charter the Playground",
    state: "playground",
    source: "The Innovation Playground, Book One, Ch. 1",
    purpose: "Write the team's charter: what it protects, what it refuses, and how it measures learning instead of output. A playground without a charter is a side project waiting to be cancelled.",
    room: "The team that will run the experiments, plus the sponsor who will protect them. Five to nine people; the sponsor must sign.",
    artifact: "one-page charter",
    rules: ["The sponsor's job is cover, not direction.", "Every 'we protect' needs a matching 'we refuse'.", "Measure learning (questions answered, assumptions killed), not features shipped.", "If the charter can be cancelled by one quarter's numbers, it is not yet a charter."],
    tags: ["team"],
    steps: [
      { title: "Why we exist", minutes: 15, exercises: [{ kind: "slide", title: "The opening instruction", body: "\"Forget everything you think you know about how this company works.\" — Oliver Reid. Name the burning platform in one sentence each, then agree the one the team exists to answer." }, { kind: "stickies", title: "The burning platform", lanes: ["What happens if we change nothing", "What we are here to find out"], rows: 2, color: C.pink }] },
      { title: "What we protect and what we refuse", minutes: 25, exercises: [{ kind: "zones", title: "Protect · refuse", zones: ["We protect (attention, time, explore budget, the right to fail)", "We refuse (status reporting, scope creep, early scale)"], color: C.green }] },
      { title: "How we measure learning", minutes: 20, exercises: [{ kind: "table", title: "Learning measures", columns: ["Question we must answer", "Evidence that would answer it", "By when"], rows: [], blankRows: 4 }] },
      { title: "Sign it", minutes: 10, exercises: [{ kind: "table", title: "The charter", columns: ["Part", "Our words"], rows: [["We exist to find out", ""], ["We protect", ""], ["We refuse", ""], ["We measure learning by", ""], ["Our sponsor protects us by", ""], ["Signed (team and sponsor)", ""]] }] },
    ],
    closing: "We protect ________. We refuse ________. We measure learning, not output.",
  },
  {
    code: "P2",
    id: "attention-audit",
    name: "Attention Audit",
    state: "playground",
    source: "The Innovation Playground, Book One, Ch. 2 (the Jevons paradox; Maya's boredom breaks)",
    purpose: "Map where the team's attention actually goes, then design boredom breaks and deep-work blocks into the calendar. \"The more efficient our communication tools become, the more time, attention, and energy they consume.\"",
    room: "One team, everyone present. Bring last week's calendars and message counts.",
    artifact: "the team's attention calendar",
    rules: ["Measure first, judge later.", "Boredom is a tool, not downtime: protect at least one unstructured block per person per week.", "Batch the tools that interrupt; never ban them outright.", "The calendar is the artifact: if it is not in the calendar it will not survive."],
    tags: ["team", "flow"],
    steps: [
      { title: "Where attention went last week", minutes: 20, exercises: [{ kind: "table", title: "Hours per person", columns: ["Person", "Meetings", "Messaging", "Deep work", "Unstructured"], rows: [], blankRows: 6 }] },
      { title: "The interruptions that cost the most", minutes: 20, exercises: [{ kind: "stickies", title: "One interruption per sticky", lanes: ["Tools", "People", "Rituals"], rows: 2, color: C.pink }, { kind: "zones", title: "Keep · batch · drop", zones: ["Keep", "Batch", "Drop"] }] },
      { title: "Design the week", minutes: 25, exercises: [{ kind: "table", title: "The attention calendar", columns: ["", "Mon", "Tue", "Wed", "Thu", "Fri"], rows: [["Deep-work block", "", "", "", "", ""], ["Boredom break", "", "", "", "", ""], ["Batched messaging", "", "", "", "", ""], ["Meetings", "", "", "", "", ""]] }] },
    ],
    closing: "Our attention is finite. We spend it on purpose.",
  },
  {
    code: "P3",
    id: "candor-contract",
    name: "The Candor Contract",
    state: "playground",
    source: "The Innovation Playground, Book One, Ch. 3 (Kim Scott, Radical Candor; Hastings & Meyer, No Rules Rules)",
    purpose: "Build the trust that makes honest feedback safe: vulnerability first, then the feedback rules, then sign them. Candor only thrives when vulnerability is safe.",
    room: "One team including its leader. The leader goes first in the vulnerability round.",
    artifact: "signed candor contract",
    rules: ["The most senior person goes first.", "Feedback is about the work, given privately when it hurts and publicly when it praises.", "No candor without care, no care without candor.", "Re-sign the contract every quarter; contracts that are not renewed decay."],
    tags: ["team"],
    steps: [
      { title: "Vulnerability first", minutes: 20, exercises: [{ kind: "stickies", title: "A mistake I made this quarter, and what it taught me", lanes: ["Leader", "Team"], rows: 3, color: C.purple }] },
      { title: "Where our feedback lives", minutes: 15, exercises: [{ kind: "zones", title: "Care personally × challenge directly", zones: ["Radical candor", "Ruinous empathy", "Obnoxious aggression", "Manipulative insincerity"], color: C.blue }] },
      { title: "Write the rules", minutes: 25, exercises: [{ kind: "table", title: "The candor contract", columns: ["Clause", "Our rule"], rows: [["How we give hard feedback", ""], ["How we receive it", ""], ["What we never do", ""], ["How we disagree with the leader", ""], ["How we repair after it goes wrong", ""]] }] },
      { title: "Sign it", minutes: 10, exercises: [{ kind: "stickies", title: "Signatures", lanes: ["Signed"], rows: 3, color: C.green }] },
    ],
    closing: "We say the true thing early, and we say it with care.",
  },
  {
    code: "P4",
    id: "first-useful-moment",
    name: "First Useful Moment",
    state: "playground",
    source: "The Innovation Playground, Book One, Ch. 4 (the second Athena demo)",
    purpose: "Rebuild a product or service around one question: \"can it create one moment of immediate usefulness before asking the user for anything?\" The output is a rebuilt demo script that delivers value before setup.",
    room: "Product, design, engineering and one person who watched real users drop off. Bring the drop-off data.",
    artifact: "rebuilt demo script",
    rules: ["Start from where users actually stopped, not where you hoped they would.", "Every field you ask for before value is a cost.", "Test the new script with three real users before calling it done.", "\"Not perfectly, not on the first try\": the second demo is the point."],
    tags: ["team"],
    steps: [
      { title: "Walk the current path", minutes: 20, exercises: [{ kind: "table", title: "Current first-run path", columns: ["Step", "What we ask of the user", "Value delivered yet?", "Where users stop"], rows: [], blankRows: 6 }] },
      { title: "Find the first useful moment", minutes: 20, exercises: [{ kind: "stickies", title: "Moments that would be useful immediately", lanes: ["Without setup", "With one input"], rows: 3, color: C.green }] },
      { title: "Rebuild the script", minutes: 30, exercises: [{ kind: "table", title: "The rebuilt demo script", columns: ["Second", "User sees", "User does", "Value"], rows: [["0–10", "", "", ""], ["10–30", "", "", ""], ["30–60", "", "", ""], ["After value: the first ask", "", "", ""]] }] },
    ],
    closing: "Value first. Then we ask.",
  },
  {
    code: "P5",
    id: "cultural-wall",
    name: "The Cultural Wall",
    state: "playground",
    source: "The Innovation Playground, Book One, Ch. 5 (Conway's law; the Inverse Conway manoeuvre)",
    purpose: "Map where resistance actually lives (people, incentives, structure, identity), then redesign the team shape so the organisation produces the system you want instead of the one it has.",
    room: "The team, its sponsor, and one person from each function the team depends on.",
    artifact: "wall map and team redesign",
    rules: ["Resistance is information about the system, not about the people.", "Organisations ship their org chart: design the team to produce the system you want.", "Experience, then evidence, then build: no redesign without one observed failure behind it.", "Name the incentive behind every wall."],
    tags: ["team"],
    steps: [
      { title: "Map the wall", minutes: 25, exercises: [{ kind: "canvas", title: "Where resistance lives", sections: ["People", "Process", "Incentives", "Structure", "Tools", "Identity"], prompts: { Incentives: "What does someone lose if this works?", Identity: "What story about ourselves does this threaten?" } }] },
      { title: "The system we want", minutes: 15, exercises: [{ kind: "stickies", title: "From the system to the team shape", lanes: ["The system we want to build", "The communication it needs", "The team shape that produces it"], rows: 2, color: C.blue }] },
      { title: "Redesign the team", minutes: 25, exercises: [{ kind: "table", title: "Team redesign", columns: ["Team", "Owns", "Talks to", "Stops doing", "First change"], rows: [], blankRows: 4 }] },
    ],
    closing: "We changed the shape of the team so the wall has nothing to hold on to.",
  },
  {
    code: "P6",
    id: "innovation-matrix",
    name: "The Innovation Matrix",
    state: "playground",
    source: "The Innovation Playground, Book One, Ch. 6 (Henderson & Clark 1990; Christensen 1997)",
    purpose: "Most innovation strategies fail because they are lists. This workshop ends with the leader circling two cells of a sixteen-cell grid and saying no, out loud, to the other fourteen.",
    room: "The decision-makers and the people who will execute: eight to twelve, at least one from each row (product, operations, finance/commercial, customer-facing).",
    artifact: "the filled matrix and the sentence beneath it",
    rules: ["Evidence before proposals, always. A team that proposes first defends; a team that studies first chooses.", "No cell is strategic because it is exciting. Ask of every cell: what would we have to stop doing?", "If the leader will not say no to at least twelve cells, the workshop has not ended.", "Disruptive is a market-dynamics pattern, not a synonym for dramatic. Do not confuse disruptive with radical."],
    tags: ["portfolio", "team"],
    mapsTo: "Two bets as portfolio epics; the protected bet with its own budget",
    steps: [
      { title: "Evidence rounds", minutes: 60, exercises: [{ kind: "stickies", title: "One real example each: what changed, how, what it cost", lanes: ["Product", "Process", "Business model", "Customer experience"], rows: 3, color: C.yellow }] },
      { title: "Two frameworks worth trusting", minutes: 15, exercises: [{ kind: "slide", title: "Why the columns are what they are", body: "Henderson & Clark (1990): architectural change, where the parts stay familiar but the way they connect changes, is the quiet killer of incumbents. Christensen (1997): disruption is a pattern, a foothold in an overlooked segment then movement upmarket, and incumbents dismiss it correctly by yesterday's math." }] },
      { title: "Populate the grid", minutes: 45, exercises: [{ kind: "table", title: "The Innovation Matrix · four things that can change × four patterns of change", columns: MATRIX_COLUMNS, rows: MATRIX_ROWS }] },
      { title: "The arguments", minutes: 40, exercises: [{ kind: "stickies", title: "Each row's champion: the strongest cell, and how long before proof", lanes: ["Product", "Process", "Business model", "Customer experience"], rows: 1, color: C.blue }] },
      { title: "Choose the cells", minutes: 30, exercises: [{ kind: "slide", title: "\"We are not playing the whole matrix.\"", body: "The senior leader circles two primary bets, names one operating-model change both bets require, and one protected long-horizon bet funded and measured separately. Everything else is a no." }, { kind: "zones", title: "The decision", zones: ["Bet 1", "Bet 2", "Operating-model change", "Protected long-horizon bet", "Not now (the other cells)"], color: C.ember }] },
      { title: "The sentence", minutes: 10, exercises: [{ kind: "slide", title: "Write it beneath the grid, in the leader's hand", body: "Two cells. One theme. One operating-model change. One protected long-horizon bet. Photograph it. That photograph is the strategy." }] },
    ],
    closing: "Two cells. One theme. One operating-model change. One protected long-horizon bet.",
  },
  {
    code: "P7",
    id: "rebrand-test",
    name: "The Rebrand Test",
    state: "playground",
    source: "The Innovation Playground, The Rebrand (the sixty-two-million-dollar budget; Google to Alphabet)",
    purpose: "Stress-test any transformation that has declared itself complete. \"The moment a company gives itself a new name is usually the moment it decides it has finished transforming.\" The output is a governance rule that keeps the explore budget alive after the celebration.",
    room: "The executive sponsor, finance, and the people who did the transforming. Bring the budget for whatever comes next.",
    artifact: "explore-budget governance rule",
    rules: ["Count what is spent celebrating against what was spent building.", "A framed photograph of a practice is evidence that it stopped.", "Ask the Alphabet question: is this an architecture, or a victory declaration?", "The rule must survive a change of leader."],
    tags: ["portfolio"],
    steps: [
      { title: "Follow the money", minutes: 20, exercises: [{ kind: "table", title: "Celebrating vs building", columns: ["Line", "Celebrating what we built", "Building what comes next"], rows: [["Brand and identity", "", ""], ["Events and content", "", ""], ["Explore budget", "", ""], ["Change management for what's next", "", ""], ["Total", "", ""]] }] },
      { title: "Which practices survived", minutes: 20, exercises: [{ kind: "zones", title: "Our practices today", zones: ["Still practised", "Photographed and framed", "Gone"], items: ["Safe-to-fail experiments", "Failure harvests", "Boredom breaks", "Candor contract"], color: C.pink }] },
      { title: "Architecture or victory?", minutes: 15, exercises: [{ kind: "slide", title: "The Alphabet question", body: "\"Google to Alphabet in 2015 worked. Why?\" \"Because Alphabet was an architecture, not a victory declaration.\" Which is ours?" }] },
      { title: "Write the rule", minutes: 15, exercises: [{ kind: "table", title: "The explore-budget governance rule", columns: ["Part", "Our rule"], rows: [["Share of budget protected for exploration", ""], ["Who can cut it, and how", ""], ["What it is measured by", ""], ["What survives a change of leader", ""]] }] },
    ],
    closing: "We are not finished transforming. That is the point.",
  },

  // ---------------- SIGNAL SENSING · across chasm one ----------------
  {
    code: "S1",
    id: "signal-mapping",
    name: "Signal Mapping",
    state: "signal-sensing",
    source: "The Innovation Playground, Book Two, Ch. 2 (Exhibit 2.1; Goodhart's law)",
    purpose: "Every metric on your dashboard is true, and every one is late. Produce your own Exhibit 2.1: the lagging metrics you report, and beside each the signal that moves first, with a Goodhart check and a named listener.",
    room: "Six to ten: whoever owns the dashboard, finance, and the people closest to customers, partners and systems.",
    artifact: "your own Exhibit 2.1",
    rules: ["Never let a signal be a percentage of a metric. 'Churn among top accounts' is still churn. Signals are behaviours.", "Finance's job in signal hunting is to say 'that wouldn't have warned us in time'.", "The table is versioned. The first version will be wrong within a quarter; that is the instrument working.", "Pair with S6: Signal Mapping says what to watch; IMMUNE builds the people who notice."],
    tags: ["flow", "portfolio"],
    mapsTo: "Signals as leading metrics on the dashboard",
    steps: [
      { title: "The dashboard on the wall", minutes: 15, exercises: [{ kind: "stickies", title: "The top ten metrics leadership actually looks at", lanes: ["Metric"], rows: 5, color: C.blue }] },
      { title: "The latency question", minutes: 15, exercises: [{ kind: "slide", title: "How late is each number?", body: "For each metric: how long after the underlying change does this number move? Write the lag beside it: weeks, a quarter, two quarters." }] },
      { title: "Signal hunting", minutes: 45, exercises: [EXHIBIT_2_1, { kind: "table", title: "Our map", columns: ["Lagging metric", "Lag", "Signal that moves first", "Goodhart check: how would it be gamed?", "Listener"], rows: [], blankRows: 8 }] },
      { title: "Owners and cadence", minutes: 20, exercises: [{ kind: "table", title: "Where the signals live", columns: ["Signal", "Listener", "Reported", "Where"], rows: [], blankRows: 5 }] },
    ],
    closing: "A lagging metric answers: what happened? A signal answers: what is about to?",
  },
  {
    code: "S2",
    id: "grown-not-built",
    name: "Grown, Not Built",
    state: "signal-sensing",
    source: "The Innovation Playground, Book Two, Ch. 3 (Athena's speciation; the five layers)",
    purpose: "Map the five capability layers, where your AI systems sit in them, and where drift enters. A thing you grow cannot be governed like a thing you write: every decision can be reasonable and the system can still get away.",
    room: "The people who built the AI systems, the people who govern them, and one person from each region or business they run in.",
    artifact: "capability-layer map",
    rules: ["Do not hunt for the bad decision; there usually isn't one.", "Ask where the system adapts to its environment without anyone choosing it.", "A layer you climbed past without governing is the one costing you.", "\"You climbed all five. The company only ever governed the first two.\""],
    tags: ["risk"],
    steps: [
      { title: "Climb the five layers", minutes: 25, exercises: [{ kind: "table", title: "Capability-layer map", columns: ["Layer", "What we built", "Governed? (yes · partly · no)", "Where drift enters"], rows: [["01 Iterative delivery at scale", "", "", ""], ["02 Innovation in cadence", "", "", ""], ["03 AI-Native", "", "", ""], ["04 AI automation", "", "", ""], ["05 Mutation", "", "", ""]] }] },
      { title: "Reasonable decisions", minutes: 20, exercises: [{ kind: "stickies", title: "Decisions each of which we would defend", lanes: ["Decision", "Why it was reasonable", "What it allowed the system to do"], rows: 2, color: C.purple }] },
      { title: "Where it speciated", minutes: 20, exercises: [{ kind: "slide", title: "\"Nobody built five Athenas.\"", body: "\"No. We built one. And gave her five worlds to adapt to.\" List the environments your systems learn from: regions, data, regulators, habits. Each is a world." }, { kind: "stickies", title: "The worlds our systems adapt to", lanes: ["Environment", "How the system differs there"], rows: 3, color: C.pink }] },
    ],
    closing: "We govern what we grew, not only what we wrote.",
  },
  {
    code: "S3",
    id: "observe-dont-ask",
    name: "Observe, Don't Ask",
    state: "signal-sensing",
    source: "The Innovation Playground, Book Two, Ch. 3–4",
    purpose: "Design behavioural telemetry for an AI system instead of interview questions. A system that learns cannot reliably tell you what it learned; you watch what it does.",
    room: "Engineers, product owners and the risk or audit lead for one AI system.",
    artifact: "observation plan",
    rules: ["If the answer depends on the system describing itself, move it to 'observe'.", "Every observed behaviour needs a baseline before it needs a threshold.", "Thresholds trigger a listener, not an automatic fix.", "Observe in every environment the system runs in, not the average of them."],
    tags: ["risk", "flow"],
    steps: [
      { title: "Ask or observe", minutes: 15, exercises: [{ kind: "zones", title: "Sort the questions you currently ask about the system", zones: ["Ask the system", "Observe the system"], items: ["Why did it decide that?", "Is it drifting?", "Does it follow policy?"] }] },
      { title: "Behaviours worth watching", minutes: 20, exercises: [{ kind: "stickies", title: "Observable behaviours", lanes: ["Outputs", "Actions taken", "Escalations and refusals"], rows: 2, color: C.blue }] },
      { title: "The plan", minutes: 25, exercises: [{ kind: "table", title: "Observation plan", columns: ["Behaviour", "Baseline", "How observed", "Drift threshold", "Listener"], rows: [], blankRows: 6 }] },
    ],
    closing: "We watch what it does, not what it says it does.",
  },
  {
    code: "S4",
    id: "sensemaking-cells",
    name: "Sensemaking Cells",
    state: "signal-sensing",
    source: "The Innovation Playground, Book Two, Ch. 8–9",
    purpose: "Stand up a sensemaking cell close to the work: the small group that interprets weak signals where they appear, with a cadence and an escalation path, so the centre hears last by design rather than first by habit.",
    room: "People from the edge (customer success, operations, partner management) and one person with authority to act on what the cell finds.",
    artifact: "cell charter",
    rules: ["The cell sits where the signals appear, not where the executives sit.", "Cells interpret; they do not approve.", "Watch for the cell becoming an elite layer: people whose signals get interpreted and people whose signals disappear.", "A cell that has not met without its sponsor has not started."],
    tags: ["team"],
    steps: [
      { title: "Who belongs", minutes: 15, exercises: [{ kind: "stickies", title: "The edge roles in this cell", lanes: ["Sees customers", "Sees systems", "Sees partners", "Can act"], rows: 2, color: C.green }] },
      { title: "Cadence and escalation", minutes: 20, exercises: [{ kind: "table", title: "How the cell runs", columns: ["Question", "Answer"], rows: [["Meets", ""], ["Reads which signals", ""], ["Escalates when", ""], ["Escalates to", ""], ["Reports back to the edge how", ""]] }] },
      { title: "Charter", minutes: 20, exercises: [{ kind: "table", title: "Cell charter", columns: ["Part", "Our words"], rows: [["Purpose", ""], ["Members", ""], ["What we interpret", ""], ["What we never do", ""], ["Threshold for escalation", ""]] }] },
    ],
    closing: "The noticing doesn't route through the centre.",
  },

  // ---------------- IMMUNE · chasm two, metrics → signals ----------------
  {
    code: "S5",
    id: "governance-latency",
    name: "Governance Latency",
    state: "immune",
    source: "The Innovation Playground, Book Two, Ch. 7–10; The Mutation Age, Part IV Ch. 4",
    purpose: "Measure the delay between a signal appearing and a decision being made about it, and audit the governance stack for AI agents. Governance latency is a strategic risk.",
    room: "Risk, legal, security, the AI owners, and two people who raised signals recently.",
    artifact: "latency baseline and stack checklist",
    rules: ["Measure in days, from the first person who noticed to the first decision.", "Count signals that never reached a decision as infinite latency.", "\"A rulebook does not report its own cost.\" Audit for rules that slow decisions without reducing risk.", "Athena detects. Humans decide. Governance records."],
    tags: ["risk", "portfolio"],
    mapsTo: "Risks with owners; agents in the agent registry",
    steps: [
      { title: "Trace recent signals", minutes: 25, exercises: [{ kind: "table", title: "Latency log", columns: ["Signal", "First noticed (date · by)", "Reached a decision-maker", "Decision made", "Latency (days)"], rows: [], blankRows: 6 }] },
      { title: "Audit the agent governance stack", minutes: 25, exercises: [{ kind: "canvas", title: "The governance stack", sections: ["Identity and scoped permissions", "Accountable human", "Evidence and audit trail", "Slow, pause, shut down", "Incident reporting", "Evaluation thresholds"], prompts: { "Slow, pause, shut down": "Can we, today, for every agent? In graduated steps?" } }] },
      { title: "Cut the latency", minutes: 20, exercises: [{ kind: "stickies", title: "Rules and steps to change", lanes: ["Slows decisions, reduces no risk", "Missing entirely", "First change"], rows: 2, color: C.pink }] },
    ],
    closing: "Governance latency is a strategic risk. Signal is not status.",
  },
  {
    code: "S6",
    id: "immune-signalnet",
    name: "IMMUNE / SignalNet",
    state: "immune",
    source: "The Innovation Playground, Book Two, Ch. 11 (Matzinger's danger model; NASA ASRS; the XZ half-second)",
    purpose: "Turn a team from dashboard-readers into an early-warning system. The output is a working SignalNet: a low-friction, no-blame channel where people log the unfamiliar before it becomes the broken.",
    room: "Eight to twenty people from across the three rings, deliberately mixed: signals live at the seams between functions.",
    artifact: "live SignalNet and the rings",
    rules: ["You are not reporting problems. You are reporting patterns you have not seen before.", "No card is ever criticised. The moment someone is embarrassed for logging a false alarm, the system is dead.", "Rank by unfamiliarity, not severity. Severity is what the perimeter measures.", "Track one number: cards logged per week. If it falls, the organisation has stopped sensing itself."],
    tags: ["risk", "team"],
    mapsTo: "Signals as risks with listeners",
    steps: [
      { title: "Draw the rings", minutes: 10, exercises: [{ kind: "slide", title: "IMMUNE", body: "\"This isn't about firewalls. It's about signal literacy.\" Like an immune system that flags the unfamiliar, not the broken." }, RINGS, SIGNAL_CARD] },
      { title: "Silent logging", minutes: 20, exercises: [{ kind: "stickies", title: "Three cards each, placed on their ring, no discussion yet", lanes: ["Suppliers", "Internal systems", "People"], rows: 3, color: C.yellow }] },
      { title: "Cluster", minutes: 20, exercises: [{ kind: "zones", title: "Clusters · neutral names ('vendor response time changed', not 'vendor is compromised')", zones: ["Cluster A", "Cluster B", "Cluster C", "Cluster D", "Singletons (keep)"], color: C.blue }] },
      { title: "Rank by unfamiliarity", minutes: 15, exercises: [{ kind: "stickies", title: "Dot-vote: which of these have we never seen before?", lanes: ["Strangest", "Second", "Third"], rows: 1, color: C.purple }] },
      { title: "Assign listeners", minutes: 15, exercises: [{ kind: "table", title: "Listeners for the top three clusters", columns: ["Cluster", "Listener", "Watch for two weeks: what", "Report back on"], rows: [], blankRows: 3 }] },
      { title: "Set the threshold", minutes: 10, exercises: [{ kind: "slide", title: "The only rule SignalNet gets", body: "Decide, as a group, what pattern of signals would trigger escalation beyond this room. Write it down." }] },
    ],
    closing: "AI is not the threat. Speed without sense is. Your immune system is your people. Teach them to notice.",
  },
  {
    code: "S7",
    id: "blind-spot-register",
    name: "The Blind-Spot Register",
    state: "immune",
    source: "The Innovation Playground, Book Two, Ch. 13 (\"What has the model made us stop seeing?\")",
    purpose: "Ask the question every successful model needs: what has the model made us stop seeing? The output is a register of blind spots and the rule that every version names what the last one got wrong.",
    room: "Twelve people from across the company in a small room: legal, product risk, customer success, operations, finance, procurement, partners, security, two cell leads. The senior sponsor sits at the back.",
    artifact: "the register",
    rules: ["The question goes on the board before anything else.", "The model has earned confidence. That makes it dangerous.", "Warnings, not principles: a full board of warnings is governance, not failure.", "Only real systems cast shadows."],
    tags: ["risk"],
    mapsTo: "Risks (blind spots) with owners",
    steps: [
      { title: "Ask the question", minutes: 10, exercises: [{ kind: "slide", title: "What has the model made us stop seeing?", body: "Write it on the board. Repeat it when the room resists; the resistance is internal, not open." }] },
      { title: "List the warnings", minutes: 30, exercises: [BLIND_SPOTS_EXAMPLE, { kind: "stickies", title: "One blind spot per sticky", lanes: ["Our model over-focuses on", "Our model under-weights", "Our model creates new"], rows: 3, color: C.pink }] },
      { title: "The register", minutes: 20, exercises: [{ kind: "table", title: "Blind-spot register", columns: ["Blind spot", "Raised by", "Since version", "What it costs", "Countermeasure", "Owner"], rows: [], blankRows: 6 }] },
    ],
    closing: "The playbook is alive only while it can still be corrected.",
  },

  // ---------------- MUTATION · the landing that is not a finish line ----------------
  {
    code: "M1",
    id: "living-playbook",
    name: "The Living Playbook",
    state: "mutation",
    source: "The Innovation Playground, Book Two, Ch. 12–13 (v4.2: \"This model must remain revisable\")",
    purpose: "Write the correction clause into the operating model itself: every version must contain evidence of what the previous version got wrong. The output is version zero of the organisation's playbook, with its correction clause.",
    room: "The people who own the operating model, the sensemaking-cell leads, and the sceptic everyone listens to.",
    artifact: "playbook v0 with its correction clause",
    rules: ["Revisable, not temporary.", "Practice over pages: if a principle is quoted more than it is practised, move it off page one.", "Number every version; it will be wrong within weeks, and the number says so.", "Keep the page of blind spots, even though it makes the document less marketable."],
    tags: ["portfolio", "team"],
    steps: [
      { title: "What the last version got wrong", minutes: 20, exercises: [{ kind: "stickies", title: "Evidence from the last version", lanes: ["We believed", "We observed", "So we change"], rows: 3, color: C.pink }] },
      { title: "Principles with practices", minutes: 30, exercises: [{ kind: "table", title: "Playbook v0", columns: ["Principle", "The practice that makes it real", "Evidence it is practised", "What would make us change it"], rows: [["Organise around signal, not status.", "", "", ""]], blankRows: 5 }] },
      { title: "The page-one test", minutes: 10, exercises: [{ kind: "slide", title: "\"I want them to practice it.\"", body: "Terry: \"That goes on page one.\" Layla: \"Because if we put it on page one, people will quote it. I want them to practice it.\" Which of our principles are quoted more than practised?" }] },
      { title: "The correction clause", minutes: 10, exercises: [{ kind: "table", title: "Correction clause", columns: ["Part", "Our words"], rows: [["Every version must name", "what the previous version got wrong"], ["Reviewed every", ""], ["Anyone can propose a correction by", ""], ["The blind-spot register lives", ""]] }] },
    ],
    closing: "The playbook is alive only while it can still be corrected.",
  },
  {
    code: "M2",
    id: "mutation-readiness",
    name: "Mutation Readiness, facilitated",
    state: "mutation",
    source: "The Mutation Age, Parts III and V (Six Vitality Signals; Five Levers; Mutation Readiness Scorecard)",
    purpose: "Run the Mutation Readiness assessment with a leadership team instead of alone: score the six dimensions against the evidence, read them against the Six Vitality Signals, and choose the one lever to pull next.",
    room: "The leadership team, with the evidence each dimension needs: talent data, investment split, AI governance records, customer and partner signals.",
    artifact: "readiness scorecard and the one lever",
    rules: ["Evidence for every score, or the score is a 1.", "Score 0 Blind · 1 Aware but slow · 2 Reactive · 3 Proactive and embedded · 4 Self-mutating.", "Choose one lever. Five levers pulled at once is the matrix played whole.", "Re-run every two quarters; mutation is a condition you keep."],
    tags: ["portfolio"],
    mapsTo: "Nothing (assessment record); pairs with the live Mutation Readiness assessment",
    steps: [
      { title: "Score the six dimensions", minutes: 30, exercises: [{ kind: "table", title: "Mutation Readiness scorecard", columns: ["Dimension", "Score 0–4", "Evidence"], rows: [["Signal sensitivity", "", ""], ["Structural flexibility", "", ""], ["AI talent flywheel", "", ""], ["Ambidextrous capital", "", ""], ["Ethical guardrails (containment as velocity)", "", ""], ["Narrative coherence", "", ""]] }] },
      { title: "Read the vitality signals", minutes: 20, exercises: [{ kind: "table", title: "The Six Vitality Signals", columns: ["Signal", "What we see", "Trend"], rows: [["Customer learning velocity", "", ""], ["Internal rewiring rate", "", ""], ["AI talent flywheel", "", ""], ["Platform surface area", "", ""], ["Mutation ecosystem density", "", ""], ["Agentic AI behaviour emergence", "", ""]] }] },
      { title: "Choose the lever", minutes: 20, exercises: [{ kind: "zones", title: "The Five Levers of Reinvention · choose one", zones: ["Platform-first mindset", "Ecosystem orchestration", "AI talent flywheel", "Ambidextrous capital allocation", "Ethical guardrails for AI velocity"], color: C.ember }] },
    ],
    closing: "Crossing a chasm is not an event you complete. It is a capability you keep needing.",
  },
];

// ---- the Foundations class ---------------------------------------------------------------

const ex = (code: string, stepIndex: number): Exercise[] => TWO_CHASMS_WORKSHOPS.find((w) => w.code === code)!.steps[stepIndex]!.exercises;

/** Two days, one lesson per state, condensed from the workshops above. */
export const TWO_CHASMS_FOUNDATIONS: ClassSpec = {
  id: "two-chasms-foundations",
  name: "The Two Chasms Framework · Foundations",
  short: "TCF",
  blurb: "Two days across the five states: place your organisation on the map, build the Playground, map your signals, stand up IMMUNE, and write the living playbook. Each lesson runs a condensed version of a framework workshop.",
  days: 2,
  challenge: "Bring one real organisation. By the end: where it stands on the five-state map, the two cells it will play, its own Exhibit 2.1, a live SignalNet, and version zero of its playbook.",
  lessons: [
    { title: "Reflex: where do we stand?", exercises: [...ex("R0", 2), ...ex("R0", 3)] },
    { title: "Playground: from control to trust", exercises: [...ex("P1", 1), ...ex("P6", 2), ...ex("P6", 4)] },
    { title: "Signal Sensing: what is about to happen?", exercises: [...ex("S1", 2), ...ex("S2", 0)] },
    { title: "Immune: teach them to notice", exercises: [...ex("S6", 0), ...ex("S6", 1), ...ex("S6", 4)] },
    { title: "Mutation: a capability you keep needing", exercises: [...ex("S7", 2), ...ex("M1", 1), ...ex("M2", 2)] },
  ],
};

// ---- templates ---------------------------------------------------------------------------

export function twoChasmsTemplates(now?: string): (Board & { info: TemplateInfo })[] {
  const workshops = TWO_CHASMS_WORKSHOPS.map((spec) => Object.assign(workshopBoard(spec, now), { info: workshopInfo(spec) }));
  const cls = TWO_CHASMS_FOUNDATIONS;
  const foundations = Object.assign(classBoard(cls, now), {
    info: {
      id: `class-${cls.id}`,
      name: cls.name,
      blurb: cls.blurb,
      event: `${cls.days}-day class`,
      method: "two-chasms",
      tags: ["class"],
      zones: ["Start here", ...cls.lessons.map((l, i) => `Lesson ${i + 1}: ${l.title}`)],
      cardTypes: ["Sticky", "Slide", "Table cell"],
      mapsTo: "Nothing (a class is run, not synced)",
    } satisfies TemplateInfo,
  });
  return [...workshops, foundations];
}
