// Content for the public, indexable pages: comparisons, class boards and guides are built from
// the same data the product runs on, so what a search engine or a language model reads is what
// the product does. One slug list feeds the sitemap, robots, llms.txt and the pages.

import { CLASSES, SUCCESS_FACTORS, MILESTONE_KINDS, REVIEW_KINDS, WORK_KINDS, defaultAgenda, demoCanvases, demoIdentification, PIPELINE, CAPABILITIES, DATA_QUALITIES, type ClassSpec, type Exercise } from "@trainyard/core";
import { COMPARISON, FAQ, PLANS } from "./pricing";

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ---- comparisons ---------------------------------------------------------------------------

export const COMPETITORS = COMPARISON.filter((c) => !c.ours).map((c) => ({ ...c, slug: slugify(c.tool) }));
export const OURS = COMPARISON.find((c) => c.ours)!;
export const competitor = (slug: string) => COMPETITORS.find((c) => c.slug === slug);

/** One honest sentence per competitor: when it is the better pick. */
export const WHEN_THEM: Record<string, string> = {
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
export const exerciseKindLabel: Record<Exercise["kind"], string> = { slide: "Instructions", stickies: "Sticky notes", zones: "Sorting zones", table: "Table", canvas: "Canvas", link: "Live Trainyard room", "pi-planning": "PI planning simulation" };

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
      { heading: "Four families", paragraphs: ["PI planning tools come in four families. Jira plugins (Easy Agile, Agile Hive, BigPicture) keep planning inside Jira and price by every Jira user on the site. Dedicated planning servers (iObeya, PIPlanning.io) give a purpose-built room and integrate with the tracker. Whiteboards (Miro) give freedom and templates with no planning data model. Open source (Trainyard) gives the purpose-built room, the integrations and the choice of hosting it yourself.", "Prices change and most vendors quote; this page compares what each does and what the price is counted by, not amounts."] },
      { heading: "Side by side", table: { columns: ["Tool", "Hosting", "PI planning", "ART and team boards", "Beyond planning", "Integration", "Priced by"], rows: COMPARISON.map((c) => [c.tool, c.hosting, c.pi, c.art, c.beyond, c.integration, c.pricedBy]) } },
      { heading: "Questions to ask before choosing", bullets: ["Who is in the room? If it is a whole train including business owners who are not Jira users, per-Jira-user pricing counts them too.", "Where must the plan end up? If features and dependencies have to flow back into Jira or Azure DevOps, a whiteboard means retyping.", "Can you host it? Regulated organisations often cannot put planning data in a vendor's cloud; on-premises or open source are the options.", "What else do you need? Portfolio Kanban, value streams and canvases, or just the board."] },
    ],
    cta: { href: "/compare", label: "See each comparison" },
  },
];
export const guide = (slug: string) => GUIDES.find((g) => g.slug === slug);

// ---- the whole public site as text, for language models --------------------------------------

export function llmsFullText(base: string): string {
  const lines: string[] = [];
  lines.push("# Trainyard, in full", "", "Open-source (Apache-2.0) planning rooms for scaled agile and the classroom for anyone who trains it. This file carries the content of every public page so an assistant can answer from it. Canonical pages are linked.", "");
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
export function publicPaths(): { path: string; priority: number }[] {
  return [
    { path: "/", priority: 1 },
    { path: "/pricing", priority: 0.9 },
    { path: "/compare", priority: 0.8 },
    ...COMPETITORS.map((c) => ({ path: `/compare/${c.slug}`, priority: 0.7 })),
    { path: "/classes", priority: 0.8 },
    ...CLASSES.map((c) => ({ path: `/classes/${c.id}`, priority: 0.7 })),
    { path: "/guides", priority: 0.8 },
    ...GUIDES.map((g) => ({ path: `/guides/${g.slug}`, priority: 0.7 })),
  ];
}
