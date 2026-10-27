// Content for the public, indexable pages: comparisons, class boards and guides are built from
// the same data the product runs on, so what a search engine or a language model reads is what
// the product does. One slug list feeds the sitemap, robots, llms.txt and the pages.

import { CLASSES, SUCCESS_FACTORS, MILESTONE_KINDS, REVIEW_KINDS, WORK_KINDS, defaultAgenda, demoCanvases, demoIdentification, PIPELINE, CAPABILITIES, DATA_QUALITIES, type ClassSpec, type Exercise } from "@trainyard/core";
import { COMPARISON, FAQ, PLANS } from "./pricing";

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---- comparisons ---------------------------------------------------------------------------

const REPO = "https://github.com/mlbwhf/test/tree/claude/confident-cray-JTbgD/trainyard";

/** One line per capability, for llms-full.txt. */
export const FEATURES = [
  "PI planning board: milestones and events on top, features by team and iteration, significant dependencies with strings, risks to ROAM; drag a card and the change syncs back to Jira or Azure DevOps.",
  "Team capacity from members (8 points per full-time contributor per iteration, allocation applied, one point off per day of leave, Scrum Master and Product Owner excluded), from velocity, or typed in.",
  "Coach Sync: the six checkpoints of the two-day PI planning agenda, four questions each, answered per team on a question × team grid.",
  "ART PI objectives written from the team objectives, by the assistant or by a rule-based synthesis, each keeping the trace to its team objectives.",
  "PI Outcome Planning (AI-Native SAFe): outcome tree, PI Outcome Planning Board and team boards with drag-and-drop, strings between any two cards, management review, agenda and confidence vote.",
  "Universal cards and links: any card on any board can point at any record (item, epic, risk, dependency, milestone, objective, outcome, canvas, board, team, person) and embed a view from another board; SAFe colour legend for cards, configurable by admins.",
  "Value stream identification the way the SPC workshop runs it: operational value stream types (fulfilment, manufacturing, software product, supporting, or your own), the template fields, who performs each step, solutions, people who develop and support them by group, development value streams, ART topologies; click anything to edit.",
  "Value stream mapping with active time, wait time and percent complete and accurate, current and future state, calculated from status history on request.",
  "SAFe canvases: portfolio canvas (current and future state, dated), SWOT and TOWS, Envision the future state with scored options and the epics it yields, portfolio vision, LACE mission, epic hypothesis, Lean business case, value stream and ART canvases, ART launch readiness.",
  "Lean portfolio: portfolio Kanban, epics with WSJF, budgets and guardrails, OKRs, roadmaps.",
  "Outcome dashboard (Insights): data sources from the CRM, finance, learning platform, survey vendors and Jira; measures alone or combined across sources; objectives per entity with outcomes and KPIs; initiatives with funders, spend, burn against time and what the money bought; printable one-pagers per entity rolled up to the top. Two example customers built in.",
  "Fifty board templates by method, each in its own words: SAFe (PI planning, team breakout, ROAM, Inspect and Adapt, portfolio and ART Kanban, roadmaps), Scrum (Product Backlog, Sprint Planning, Sprint Backlog, Sprint Review, Sprint Retrospective), Kanban (system board, STATIK, service delivery review, flight levels), Lean (A3, PDCA, value stream map, kaizen, hoshin kanri, obeya), Six Sigma (DMAIC, charter, SIPOC, VOC to CTQ, fishbone, FMEA, control plan), manufacturing (SQDC, andon, OEE, heijunka, 5S, gemba).",
  "Class boards for Leading SAFe, SPC, Advanced SPC, POPM and RTE, free with a sign-up: a start-here strip and one frame per lesson with its exercises, including a PI planning simulation; the chapters on PI planning, value streams, PI planning readiness and Inspect and Adapt are built from the same definitions as the tools, so they change when the tools do.",
  "Bring your own boards: Miro, Lucid (Lucidchart and Lucidspark), Mural, Trello, monday.com, iObeya exports, CSV and JSON, kept as imported, saved as templates, mapped onto the plan on demand.",
  "AI portfolio: initiatives with lifecycle stages and gates, evidence, EU AI Act risk tiers, an agent registry with autonomy levels, value-architect sign-off, audit log. AI-Native ART with the five-stage pipeline, intent and specification records, curated data and the twelve-factor assessment.",
  "Sign in with email and password (thirty-day sessions) or an API key; roles admin, planner, architect, viewer; every workspace its own; Stripe billing with a free trial, monthly start, money-back guarantee and the trial emails card networks ask for.",
];

export const COMPETITORS = COMPARISON.filter((c) => !c.ours).map((c) => ({ ...c, slug: slugify(c.tool) }));
export const OURS = COMPARISON.find((c) => c.ours)!;
export const competitor = (slug: string) => COMPETITORS.find((c) => c.slug === slug);

/** One honest sentence per competitor: when it is the better pick. */
export const WHEN_THEM: Record<string, string> = {
  "jira-align": "Jira Align is the better pick when a large enterprise standardises on Atlassian for the whole SAFe hierarchy, from strategy and portfolio financials down to teams, and wants one vendor's reporting across many trains with permissions that follow the org structure.",
  iobeya: "iObeya is the better pick when your organisation already runs its visual management on it beyond PI planning (obeya rooms, lean boards across plants) and wants one vendor for all of it.",
  "easy-agile": "Easy Agile is the better pick when every participant already lives in Jira, planning never leaves Jira, and you want nothing to host.",
  "agile-hive": "Agile Hive is the better pick when you want SAFe modelled strictly inside Jira with reporting by the same vendor.",
  bigpicture: "BigPicture is the better pick when project portfolio reporting inside Jira (Gantt, resources) matters more than the planning room itself.",
  "piplanning-io": "PIPlanning.io is the better pick when you want a dedicated PI planning board with little else around it and a per-team price.",
  miro: "Miro is the better pick when the whiteboard is used for everything and PI planning is a template among many, with no need for planning data to flow back to a tracker.",
};

// ---- classes ---------------------------------------------------------------------------------

export const classSlugs = () => CLASSES.map((c) => c.id);
export const classById = (id: string): ClassSpec | undefined => CLASSES.find((c) => c.id === id);
export const exerciseKindLabel: Record<Exercise["kind"], string> = { slide: "Instructions", stickies: "Sticky notes", zones: "Sorting zones", kanban: "Kanban", table: "Table", canvas: "Canvas", link: "Live Trainyard room", "pi-planning": "PI planning simulation" };

// ---- guides ----------------------------------------------------------------------------------

export interface GuideSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: { columns: string[]; rows: string[][] };
}
export interface Guide {
  slug: string;
  title: string;
  description: string;
  updated: string;
  sections: GuideSection[];
  cta: { href: string; label: string };
}

const readiness = () => {
  const launch = demoCanvases(demoIdentification(), "2026-10-01T00:00:00.000Z").find((c) => c.type === "art-launch" || (c.fields as { readiness?: unknown })?.readiness);
  return ((launch?.fields as { readiness?: { text: string; question?: string; tier?: string }[] } | undefined)?.readiness ?? []);
};

export const GUIDES: Guide[] = [
  {
    slug: "art-readiness-checklist",
    title: "ART readiness checklist: the 15 questions before you launch an Agile Release Train",
    description: "SAFe's ART readiness checklist as a working tool: nine needed items and six desirable ones, each with the consideration question behind it, mapped to the launch timeline. Score it before the date-certain quick-start.",
    updated: "2026-10-22",
    sections: [
      { heading: "What the checklist is for", paragraphs: ["Launching an Agile Release Train on a date certain works when the few things that must be true on day one are true. SAFe's readiness checklist names them. Nine are needed: without them the first PI Planning does not happen or does not hold. Six are desirable: they make the first PI smoother but can be finished during it.", "Trainyard keeps the checklist on the ART launch canvas next to the launch timeline (content, cadence, teams, leadership), so each item sits on the lane that prepares it and the readiness score is the share of needed items done."] },
      { heading: "Needed before PI Planning", table: { columns: ["Item", "The question to answer"], rows: readiness().filter((r) => r.tier === "needed").map((r) => [r.text, r.question ?? ""]) } },
      { heading: "Desirable", table: { columns: ["Item", "The question to answer"], rows: readiness().filter((r) => r.tier === "desirable").map((r) => [r.text, r.question ?? ""]) } },
      { heading: "How trainers use it", bullets: ["In the SPC class (Launching an Agile Release Train) and the RTE class (Organizing the ART), the checklist is the exercise: each team scores a case study Y, N or Depends and defends the calls.", "In a real launch, the RTE owns it and reviews it at each weekly launch sync; items move to done only with a named owner.", "The score is honest by design: desirable items do not count towards readiness, so a train cannot look ready by finishing the easy things."] },
    ],
    cta: { href: "/canvases", label: "Open the ART launch canvas" },
  },
  {
    slug: "pi-outcome-planning",
    title: "PI Outcome Planning: the one-day, outcome-first alternative to PI Planning (AI-Native SAFe)",
    description: "What PI Outcome Planning is, the outcome tree from portfolio to team, the PI Outcome Planning Board, team boards, the management review board, the one-day agenda and the confidence vote, as run in Trainyard.",
    updated: "2026-10-22",
    sections: [
      { heading: "What changes", paragraphs: ["Classic PI Planning plans features into iterations. PI Outcome Planning plans outcomes: measurable changes in customer or business behaviour, each with two to five key results, and lets teams choose the experiments, prototypes, enablers and features that move them. It fits in one day because the unit of agreement is the outcome and its milestones, not every story.", "The spine is an outcome tree: portfolio outcomes above the ART, ART outcomes, PI outcomes for this increment, and team outcomes that contribute to them. Ambition is explicit: moonshot or roofshot."] },
      { heading: "Milestones on the board", table: { columns: ["Kind", "Meaning"], rows: Object.entries(MILESTONE_KINDS).map(([k, v]) => [v.label, v.blurb || k]) } },
      { heading: "What teams put on their boards", bullets: Object.entries(WORK_KINDS).map(([k, v]) => `${v.label}: ${k === "experiment" ? "a cheap test of an assumption with a clear learning goal" : k === "prototype" ? "something customers can touch that answers a riskier question" : k === "enabler" ? "capability, data or infrastructure the outcome needs" : "value delivered to customers, with a hypothesis and acceptance criteria"}`) },
      { heading: "The one-day agenda", table: { columns: ["Half", "Minutes", "Slot", "What happens"], rows: defaultAgenda().map((a) => [a.half, String(a.minutes), a.title, a.detail ?? ""]) } },
      { heading: "Management review board", bullets: Object.entries(REVIEW_KINDS).map(([k, v]) => `${v.label}: ${k === "decision-needed" ? "raised by teams during the breakouts, with the options" : k === "risk" ? "ROAMed at the review" : k === "decision-confirmed" ? "the decision as made, with who made it" : "an action with an owner and a date"}`) },
      { heading: "The vote", paragraphs: ["The final plan review ends with a fist-of-five vote per PI outcome and for the plan as a whole. Anything under three gets a voice before the vote closes. Trainyard records the votes against the outcome so the next Sense and Respond knows where confidence was thin."] },
    ],
    cta: { href: "/outcome-planning", label: "Open PI Outcome Planning" },
  },
  {
    slug: "ai-native-art",
    title: "Running an AI-Native Agile Release Train: pipeline, gates, intent records and the twelve success factors",
    description: "How an AI-Native ART works in practice: the five-stage pipeline with gates, learning versus value outputs, intent, specification and context records with change propagation, curated data, team capability coverage, Sense and Respond, and the twelve-factor assessment.",
    updated: "2026-10-22",
    sections: [
      { heading: "Outputs, not just features", paragraphs: ["An AI-Native ART produces four kinds of output. Experiments and prototypes exist to learn: they conclude with the uncertainty they reduced. Features and enablers exist to deliver value: they release with verification evidence. Every output hangs off an outcome and a metric, and stopping one is as easy as advancing it: discard from any stage, with a reason."] },
      { heading: "The pipeline and its gates", table: { columns: ["Stage", "Gate to leave it"], rows: PIPELINE.map((s) => [s, s === "discover" ? "an outcome and a metric are linked" : s === "specify" ? "a specification exists, the intent record is clean (no pending review) and the metric is set" : s === "build" ? "a verification owner is named" : s === "validate" ? "value items need verification evidence; learning items record the uncertainty reduced" : "released, or concluded for learning items"]) } },
      { heading: "Intent, specification, context", paragraphs: ["Three records carry what an AI system is meant to do. The intent record states the current and future state and the measure. Specifications and context records derive from it. When an intent changes, every derived record is marked for review and the item is held at Specify until each review is cleared; the evidence log keeps the trail."] },
      { heading: "Curated data", bullets: Object.values(DATA_QUALITIES).map((q) => `${q.label}: ${q.definition}`) },
      { heading: "Team capability coverage", bullets: Object.values(CAPABILITIES).map((c) => `${c.label}: ${c.blurb}`) },
      { heading: "The twelve success factors", table: { columns: ["Shift", "Factors"], rows: SUCCESS_FACTORS.map((s) => [s.shift, s.factors.join("; ")]) } },
      { heading: "Sense and Respond", paragraphs: ["Every iteration the ART answers three questions from data, not slides: what did we learn, what moved, what should we stop. Trainyard pulls the agenda from the records: key result deltas, what released, discard candidates (no metric linked, no movement since release), the review queue and AI cost variance by workflow."] },
    ],
    cta: { href: "/outcome-planning", label: "Open the AI-Native ART tabs" },
  },
  {
    slug: "pi-planning-tools",
    title: "PI planning tools compared: Jira plugins, dedicated boards, whiteboards and open source",
    description: "A capability comparison of PI planning tools: iObeya, Easy Agile, Agile Hive, BigPicture, PIPlanning.io, Miro and Trainyard, by hosting, PI planning support, ART boards, what sits beyond planning, integration and how each is priced.",
    updated: "2026-10-22",
    sections: [
      { heading: "Five families", paragraphs: ["PI planning tools come in five families. Enterprise agile platforms (Jira Align) model the whole SAFe hierarchy from strategy to teams, with portfolio financials and reporting across many trains, on an enterprise contract. Jira plugins (Easy Agile, Agile Hive, BigPicture) keep planning inside Jira and price by every Jira user on the site. Dedicated planning servers (iObeya, PIPlanning.io) give a purpose-built room and integrate with the tracker. Whiteboards (Miro) give freedom and templates with no planning data model. Open source (Trainyard) gives the purpose-built room, the integrations and the choice of hosting it yourself.", "Prices change and most vendors quote; this page compares what each does and what the price is counted by, not amounts."] },
      { heading: "Side by side", table: { columns: ["Tool", "Hosting", "PI planning", "ART and team boards", "Beyond planning", "Integration", "Priced by"], rows: COMPARISON.map((c) => [c.tool, c.hosting, c.pi, c.art, c.beyond, c.integration, c.pricedBy]) } },
      { heading: "Questions to ask before choosing", bullets: ["Who is in the room? If it is a whole train including business owners who are not Jira users, per-Jira-user pricing counts them too.", "Where must the plan end up? If features and dependencies have to flow back into Jira or Azure DevOps, a whiteboard means retyping.", "Can you host it? Regulated organisations often cannot put planning data in a vendor's cloud; on-premises or open source are the options.", "What else do you need? Portfolio Kanban, value streams and canvases, or just the board."] },
    ],
    cta: { href: "/compare", label: "See each comparison" },
  },
  {
    slug: "okrs-and-kpis-in-safe",
    title: "OKRs and KPIs in SAFe: how one objective traces from the portfolio to the teams, and how you know it worked",
    description: "A worked example (Northstar Bank, business payments) of OKRs and KPIs in SAFe: the objective, the key results that prove the change, the KPIs that watch ongoing health, operational versus development value streams, alignment from portfolio to ARTs to teams, a key result carried by a KPI across four quarters, and the quarterly review.",
    updated: "2026-10-24",
    sections: [
      { heading: "Three words that get mixed up", paragraphs: ["An objective is the change you want: make business payments faster, easier and more reliable. A key result is a time-bound, measurable commitment that proves the change happened: digital adoption from 40% to 65% by Q4. A KPI is a health signal you keep watching whether or not a key result is attached to it: adoption rate, payment success rate, cost per transaction.", "The difference matters at the review. A key result ends when it is met or missed and a new one is set. A KPI never ends; it stays on the dashboard to catch a slide back."] },
      { heading: "Operational and development value streams measure different things", paragraphs: ["The operational value stream is the customer's journey: initiate a payment, authenticate, clear, confirm. Its KPIs are completion time, success rate and cost per payment.", "The development value stream is how the bank builds and changes the systems behind that journey: identify the need, design, build and integrate, release and learn. Its KPIs are flow time, throughput and release quality.", "Agile Release Trains deliver inside the development value stream; what they deliver enables the operational one. Measuring the development stream alone shows activity, not value."] },
      { heading: "One outcome from the portfolio to the teams", table: { columns: ["Level", "Objective", "Key result", "KPIs to watch"], rows: [["Portfolio", "Grow profitable digital payments", "Adoption 40% → 65%", "Adoption, revenue, cost per payment"], ["Development value stream", "Enable faster, reliable payments", "Journey 5 min → 1 min", "Flow time, completion time"], ["Payments ART", "Improve payment reliability", "Success 98.5% → 99.9%", "Success, latency, defects"], ["Digital Channels ART", "Make journeys frictionless", "Abandonment 30% → 10%", "Abandonment, conversion"], ["Agile teams", "Build and test solution increments", "Stories: APIs, UX, automated tests", "Cycle time, escaped defects"]] } },
      { heading: "A KPI can carry a key result", paragraphs: ["Digital Channels ART owns payment abandonment. The key result says 10% by Q4. The KPI reads 30% in Q1, 22% in Q2, 14% in Q3 and 9% in Q4. The key result closes in Q4; the KPI keeps being watched in Q1 of the next year, because a redesign that drifts can take the number back up."] },
      { heading: "What to inspect each quarter", bullets: ["Did we achieve the targeted customer or business change?", "Are operational and solution health KPIs stable?", "Did the ARTs improve the capabilities that drive the outcome?", "What should we fund, stop, improve, or experiment with next?"] },
      { heading: "A balanced measurement system", paragraphs: ["SAFe's Measure and Grow names three lenses. Outcomes: are customers and the business better off (adoption, revenue, satisfaction)? Flow: how efficiently does value move (flow time, throughput, efficiency)? Competency: can the organisation keep delivering (technical quality, business agility)? Reviewing only flow mistakes delivery for value; reviewing only outcomes hides why they moved.", "Walk the example yourself at /examples/okrs-kpis, where every element is clickable, or load Northstar Bank as an example customer in the outcome dashboard."] },
    ],
    cta: { href: "/examples/okrs-kpis", label: "Open the interactive example" },
  },
  {
    slug: "outcome-dashboard-for-boards",
    title: "An outcome dashboard for executives and boards: outcomes, KPIs and funding from the CRM, finance, the learning platform and Jira on one page",
    description: "How to build the one-pager an executive team or a board reads: data sources from every system that holds the evidence, measures that combine them, outcomes kept apart from KPIs, initiatives with their funding and what the money bought, and one page per entity rolled up to the top. For associations, foundations, nonprofits and any organisation whose results live outside Jira.",
    updated: "2026-10-24",
    sections: [
      { heading: "Why Jira cannot answer the board's question", paragraphs: ["A delivery tool knows what was built and when. The board asks what changed: did clinicians in low-income countries learn something, did the grantees stay in research, did adoption rise, did the cost per payment fall. That evidence lives in the CRM, the finance ledger, the learning platform, a survey vendor's follow-up and, for the delivery part, Jira. Pulling from several systems and making sense of the data together is the whole job.", "Usage is the trap. Active learners and learning hours say people came; they do not say anyone learned or changed how they work. An outcome dashboard keeps that distinction visible: outcomes are the change sought, KPIs are the health signals, and every objective needs at least one outcome measure or it is activity dressed up as results."] },
      { heading: "Five building blocks", bullets: ["Sources: a table from each system with a period column. A CSV export is enough to start; a scheduled extract from the CRM or a data warehouse feeds the same place later.", "Measures: a column aggregated per month (sum, average, count, latest), filtered where needed (only low and lower-middle income countries), or two measures combined across sources: cost per completion is the finance ledger over the learning platform; knowledge gain is post-test minus pre-test.", "Objectives per entity: each entity under the organisation (an education arm, a foundation, a publishing unit) states its objectives and which measures are its outcomes and which its KPIs, with a target, a direction and a sentence on why the measure is evidence and what it does not prove.", "Initiatives and funding: what was committed, who funds it, spend to date from the ledger over the initiative's dates, burn against time elapsed, and the outcome measures that show what the money bought, down to the cost per completion or per grant.", "The one-pager: one page per entity, rolled up to the organisation, with the sources and their load dates in the footer so a board member can ask where a number came from."] },
      { heading: "An example: free learning for clinicians", table: { columns: ["Measure", "Role", "Built from"], rows: [["Knowledge gain (post-test minus pre-test)", "Outcome", "Learning platform"], ["Learners reporting a change in practice at three months", "Outcome", "Survey vendor"], ["Clinicians reached in low and lower-middle income countries", "Outcome", "CRM, filtered by income group"], ["Active learners, completion rate", "KPI", "Learning platform"], ["Cost per completion", "KPI", "Finance ledger ÷ learning platform"], ["Module cycle time", "KPI", "Jira"]] } },
      { heading: "What the quarterly review looks like", paragraphs: ["Read the outcomes first, KPIs second, funding third. An outcome off target with healthy KPIs means the activity is fine and the theory of change is not: the modules are completed but practice does not change, so the content or the follow-up needs work. Healthy outcomes with a KPI off target is a cost or capacity problem, not a value problem. An initiative spending ahead of time with no outcome moving is the one to stop or redesign."] },
      { heading: "Running it", paragraphs: ["Trainyard's outcome dashboard does exactly this, sold on its own as the Insights plan: per pack of ten data sources, unlimited viewers, printable one-pagers. Two example customers come built in, an education and grants programme and Northstar Bank's digital payments, so the method can be seen before the first extract is loaded."] },
    ],
    cta: { href: "/pricing", label: "See the Insights plan" },
  },
];
export const guide = (slug: string) => GUIDES.find((g) => g.slug === slug);

// ---- the whole public site as text, for language models --------------------------------------

/** The short llms.txt: what Trainyard is, where each public page is, and the facts an assistant is most often asked. Built from the same data as the pages. */
export function llmsText(base: string): string {
  const lines: string[] = [];
  lines.push("# Trainyard", "");
  lines.push("> Open-source (Apache-2.0) planning rooms for scaled agile and the classroom for anyone who trains it: PI planning boards with milestones, dependency strings and ROAM, team capacity from members or velocity, Coach Sync, ART PI objectives, PI Outcome Planning, SAFe canvases, value stream identification and mapping, portfolio Kanban, an outcome dashboard that joins CRM, finance, learning, survey and Jira data into executive one-pagers (sold on its own as Insights), class boards for Leading SAFe, SPC, Advanced SPC, POPM and RTE (free), fifty board templates across SAFe, Scrum, Kanban, Lean, Six Sigma and manufacturing, two-way Jira and Azure DevOps sync, and imports from Miro, Mural, Trello, monday.com, iObeya and CSV.", "");
  lines.push("Hosted at trainyard.app or self-hosted with Docker Compose. Sign in with email and password; API keys for scripts. AI assistance runs with Claude, any OpenAI-compatible server or a local Ollama model, and every AI answer is a draft a person accepts.", "");
  lines.push("## Pages", "");
  lines.push(`- Home: ${base}/`, `- Pricing, free trial and money-back guarantee: ${base}/pricing`, `- Interactive OKRs and KPIs example (Northstar Bank): ${base}/examples/okrs-kpis`);
  lines.push(`- PI planning tools compared: ${base}/compare` + COMPETITORS.map((c) => `, ${base}/compare/${c.slug}`).join(""));
  lines.push(`- Class boards for trainers: ${base}/classes` + CLASSES.map((c) => `, ${base}/classes/${c.id}`).join(""));
  lines.push(`- Board templates by method (SAFe, Scrum, Kanban, Lean, Six Sigma, manufacturing): ${base}/methods`, `- OKR and KPI dashboard for executives and boards (Insights): ${base}/insights`);
  lines.push(`- Support, help and how to use every page: ${base}/support`);
  lines.push(`- Guides: ` + GUIDES.map((g) => `${base}/guides/${g.slug}`).join(", "));
  lines.push(`- Every public page as one text file: ${base}/llms-full.txt`, `- Sign in: ${base}/login`, "");
  lines.push("## Pricing", "");
  for (const p of PLANS) lines.push(`- ${p.name}: ${p.monthly === null ? "free" : `$${p.monthly} ${p.unit} ($${p.yearly} billed yearly)`}. ${p.blurb}`);
  lines.push("", "Every paid plan starts with a free 30-day trial (card saved, nothing charged, a reminder 7 days before the first charge), then month by month; yearly is a switch after the first paid month; the first paid month carries a 30-day money-back guarantee the customer claims themselves. Classes and templates are free with a sign-up.", "");
  lines.push("## Guides", "");
  for (const g of GUIDES) lines.push(`- ${g.title}: ${base}/guides/${g.slug}`);
  lines.push("", "## Source", "", `- Code and README: ${REPO}`, "- API reference (OpenAPI): the API host serves /docs", "");
  lines.push("## Trademarks", "", "SAFe and Scaled Agile Framework are registered trademarks of Scaled Agile, Inc. Trainyard is independent of Scaled Agile, Atlassian and Microsoft.", "");
  return lines.join("\n");
}

export function llmsFullText(base: string): string {
  const lines: string[] = [];
  lines.push("# Trainyard, in full", "", "Open-source (Apache-2.0) planning rooms for scaled agile and the classroom for anyone who trains it. This file carries the content of every public page so an assistant can answer from it. Canonical pages are linked.", "");
  lines.push("## What it does", "");
  for (const f of FEATURES) lines.push(`- ${f}`);
  lines.push("");
  lines.push("## Pricing", `Source: ${base}/pricing`, "");
  for (const p of PLANS) lines.push(`- ${p.name} (${p.tag}): ${p.monthly === null ? "free" : `$${p.monthly} ${p.unit}, or $${p.yearly} ${p.unit} billed yearly`}. ${p.blurb} Includes: ${p.items.join("; ")}.`);
  lines.push("", "Every paid plan starts with a free 30-day trial, then month by month; yearly is a switch after the first paid month. The first paid month carries a 30-day money-back guarantee the customer claims from Plan & billing: the charge is refunded, the subscription ends, the workspace stays on the free plan with everything kept. Each customer gets a workspace of their own.", "");
  lines.push("## Frequently asked", "");
  for (const f of FAQ) lines.push(`Q: ${f.q}`, `A: ${f.a}`, "");
  lines.push("## Comparisons", `Source: ${base}/compare`, "");
  for (const c of COMPARISON) lines.push(`- ${c.tool}: hosting: ${c.hosting}. PI planning: ${c.pi}. ART and team boards: ${c.art}. Beyond planning: ${c.beyond}. Integration: ${c.integration}. Priced by: ${c.pricedBy}.`);
  for (const c of COMPETITORS) lines.push(`- When ${c.tool} is the better pick: ${WHEN_THEM[c.slug] ?? ""} (${base}/compare/${c.slug})`);
  lines.push("", "## Class boards for trainers", `Source: ${base}/classes`, "");
  for (const c of CLASSES) {
    lines.push(`### ${c.name} (${c.days} days) · ${base}/classes/${c.id}`, c.blurb, "");
    c.lessons.forEach((l, i) => lines.push(`- Lesson ${i + 1}: ${l.title}. Exercises: ${l.exercises.map((e) => e.title).join("; ")}.`));
    lines.push("");
  }
  lines.push("## Interactive example: OKRs and KPIs in SAFe (Northstar Bank)", `Source: ${base}/examples/okrs-kpis`, "");
  lines.push("Objective: make business payments faster, easier and more reliable. Key results: digital adoption 40% to 65%; abandonment 30% to 10%. Ongoing KPIs: adoption rate, payment success rate, cost per transaction. Alignment: portfolio (grow profitable digital payments, adoption 40% to 65%), development value stream (faster, reliable payments, journey 5 min to 1 min), Payments ART (reliability, success 98.5% to 99.9%), Digital Channels ART (frictionless journeys, abandonment 30% to 10%), teams (stories: APIs, UX, automated tests). Dashboard (hypothetical current values): adoption 58% vs 65%; cost per payment $0.78 vs $0.60; development flow time 24 vs 15 days; payment completion time 1.4 vs 1.0 min; success 99.7% vs 99.9%; abandonment 14% vs 10%. Measurement lenses: outcomes, flow, competency. Quarterly review: did we achieve the change, are health KPIs stable, did the ARTs improve the capabilities, what to fund, stop, improve or experiment with next.", "");
  lines.push("## Guides", `Source: ${base}/guides`, "");
  for (const g of GUIDES) {
    lines.push(`### ${g.title} · ${base}/guides/${g.slug}`, g.description, "");
    for (const s of g.sections) {
      lines.push(`#### ${s.heading}`);
      for (const p of s.paragraphs ?? []) lines.push(p);
      for (const b of s.bullets ?? []) lines.push(`- ${b}`);
      if (s.table) {
        lines.push(`| ${s.table.columns.join(" | ")} |`, `| ${s.table.columns.map(() => "---").join(" | ")} |`);
        for (const r of s.table.rows) lines.push(`| ${r.map((x) => x.replace(/\|/g, "/")).join(" | ")} |`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

/** Every public URL, for the sitemap, robots and llms.txt. */
/** When the non-guide pages last changed in substance; the sitemap reports it. */
export const SITE_UPDATED = "2026-10-24";

export function publicPaths(): { path: string; priority: number; updated: string }[] {
  return [
    { path: "/", priority: 1, updated: SITE_UPDATED },
    { path: "/pricing", priority: 0.9, updated: SITE_UPDATED },
    { path: "/examples/okrs-kpis", priority: 0.9, updated: SITE_UPDATED },
    { path: "/compare", priority: 0.8, updated: SITE_UPDATED },
    ...COMPETITORS.map((c) => ({ path: `/compare/${c.slug}`, priority: 0.7, updated: SITE_UPDATED })),
    { path: "/classes", priority: 0.9, updated: SITE_UPDATED },
    { path: "/methods", priority: 0.9, updated: SITE_UPDATED },
    { path: "/insights", priority: 0.9, updated: SITE_UPDATED },
    { path: "/support", priority: 0.6, updated: SITE_UPDATED },
    { path: "/book", priority: 0.6, updated: SITE_UPDATED },
    { path: "/privacy", priority: 0.3, updated: SITE_UPDATED },
    { path: "/terms", priority: 0.3, updated: SITE_UPDATED },
    ...CLASSES.map((c) => ({ path: `/classes/${c.id}`, priority: 0.7, updated: SITE_UPDATED })),
    { path: "/guides", priority: 0.8, updated: SITE_UPDATED },
    ...GUIDES.map((g) => ({ path: `/guides/${g.slug}`, priority: 0.8, updated: g.updated })),
  ];
}
