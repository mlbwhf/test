// Plans, the comparison and the FAQ: one place for the numbers the website shows, so the
// landing page, llms.txt and the structured data agree. Rationale in docs/pricing.md.

export type PlanId = "practice" | "trainer" | "academy";

export interface Plan {
  id: PlanId;
  tag: string;
  name: string;
  /** USD per month, billed monthly; null for free. */
  monthly: number | null;
  /** USD per month when billed yearly (ten months for twelve). */
  yearly: number | null;
  unit: string;
  blurb: string;
  items: string[];
  cta: string;
  badge?: string;
  bg: string;
  fg: string;
}

export const PLANS: Plan[] = [
  {
    id: "practice",
    tag: "SOLO",
    name: "Practice",
    monthly: null,
    yearly: null,
    unit: "/ forever",
    blurb: "Self-host the whole product, or run one small room on ours. Free up to 5 people; paid plans start from the sixth.",
    items: ["Teach the five SAFe classes, free", "Fifty ready-made templates, or bring your own", "Every planning board, canvas and value stream tool", "Self-hosted: unlimited people and trains", "Hosted: one room, up to 5 people", "Community support"],
    cta: "Start free",
    bg: "#fff",
    fg: "#14123a",
  },
  {
    id: "trainer",
    tag: "TRAINER",
    name: "Trainer",
    monthly: 19,
    yearly: 16,
    unit: "/ trainer / mo",
    blurb: "Everything a working coach or trainer needs, with unlimited people in the room.",
    items: ["Free 14-day trial, then month by month", "Money back on the first paid month", "Unlimited participants, hosted", "Class boards: Leading SAFe, SPC, Advanced SPC, POPM, RTE", "Import your own Miro class boards", "Jira and Azure DevOps sync", "AI co-trainer with your own key", "Email support"],
    cta: "Start Trainer",
    badge: "MOST PICKED",
    bg: "#4a5fe8",
    fg: "#fff",
  },
  {
    id: "academy",
    tag: "ACADEMY",
    name: "Academy",
    monthly: 249,
    yearly: 199,
    unit: "/ train / mo",
    blurb: "For Agile Release Trains and the academies that launch them. Priced per train, not per person.",
    items: ["Free 14-day trial, then month by month", "Money back on the first paid month", "Unlimited people per train", "Jira app and Azure DevOps extension", "SSO and an audit trail", "Hosted by us or on your servers", "Named success lead"],
    cta: "Start Academy",
    bg: "#ffe27a",
    fg: "#14123a",
  },
];

export function priceFor(p: Plan, yearly: boolean): { amount: string; unit: string } {
  if (p.monthly === null) return { amount: "$0", unit: p.unit };
  const n = yearly ? p.yearly! : p.monthly;
  return { amount: `$${n}`, unit: `${p.unit}${yearly ? ", billed yearly" : ""}` };
}

/** Capabilities only, from a side-by-side evaluation of PI planning dashboard tools and public pages. */
export const COMPARISON: { tool: string; hosting: string; pi: string; art: string; beyond: string; integration: string; pricedBy: string; ours?: boolean }[] = [
  {
    tool: "Trainyard",
    hosting: "Self-hosted, open source; hosted; Jira app and Azure DevOps extension",
    pi: "Integrated: PI planning, team breakouts, PI objectives, confidence vote",
    art: "ART and team boards, PI planning board with milestones and dependency strings, ROAM, WSJF, retrospectives",
    beyond: "Portfolio Kanban, roadmaps, SAFe canvases, value stream identification and mapping, AI portfolio, dashboards",
    integration: "Jira and Azure DevOps, two ways; imports from iObeya, Miro, Mural, monday.com",
    pricedBy: "Trainer or train; people in the room are free",
    ours: true,
  },
  { tool: "iObeya", hosting: "On premises or separate server", pi: "Integrated web interface", art: "ART board, ROAM, WSJF, retrospectives", beyond: "Portfolio and more", integration: "Full integration through API and iFrame", pricedBy: "Room, with a minimum number of rooms" },
  { tool: "Easy Agile", hosting: "Jira plugin", pi: "Within Jira", art: "ART and team boards", beyond: "None", integration: "Jira only", pricedBy: "Every Jira user on the site" },
  { tool: "Agile Hive", hosting: "Jira plugin", pi: "Within Jira", art: "ART board, ROAM, WSJF, team execution", beyond: "Portfolio Kanban, roadmap, reporting", integration: "Jira only", pricedBy: "User, by quote" },
  { tool: "BigPicture", hosting: "Jira plugin", pi: "Within Jira", art: "ART board, ROAM, WSJF, team execution", beyond: "Project planning and reporting, OKR and risk widgets", integration: "Jira only", pricedBy: "Every Jira user on the site" },
  { tool: "PIPlanning.io", hosting: "On premises or separate server", pi: "Dedicated tool", art: "ART and ROAM boards", beyond: "None", integration: "Jira", pricedBy: "Team" },
  { tool: "Miro", hosting: "Public cloud", pi: "Not integrated; templates", art: "Limited ART board", beyond: "None", integration: "None for planning data", pricedBy: "Every member" },
];

export const FAQ: { q: string; a: string }[] = [
  { q: "Is it free for independent trainers?", a: "Yes. Practice is free for one hosted room of up to 5 people, and the whole product is open source under Apache-2.0: self-host it with every feature and no limits. From the sixth person, Trainer or Academy." },
  { q: "How do the trial and the guarantee work?", a: "Trainer and Academy start with a free 14-day trial: you enter a card, nothing is charged, and you can cancel before the trial ends from Plan & billing. After the trial it is month by month. If the first paid month does not convince you, claim the money back yourself from Plan & billing within 30 days of that charge: the charge is refunded, the subscription ends, and your workspace stays on the free plan with everything kept. Yearly billing is a switch you can make after the first month." },
  { q: "Do participants need accounts?", a: "They open the board in a browser from a link. On a free room anyone with the link can take part; once you turn authentication on, viewers read and planners move cards, each with a key you send. Nothing to install." },
  { q: "Which frameworks are supported?", a: "SAFe (Essential, Portfolio, Full), AI-Native SAFe, LeSS, Scrum@Scale, Nexus, Flight Levels and tribe models, as editable operating models. Change the model and the boards and dashboards follow." },
  { q: "Can I use my own boards?", a: "Yes. Upload iObeya exports, connect Miro, Mural, monday.com or Trello, or drop a CSV. Boards arrive at their positions and colours, become templates, and map onto the plan only when you say so." },
  { q: "Can it run inside Jira or Azure DevOps?", a: "Yes. The Jira app (Atlassian Forge) and the Azure DevOps extension put the boards, value streams and canvases in a project page or hub. Academy includes both." },
  { q: "Why is Academy priced per train?", a: "Because a PI planning room holds a whole train, and the tools priced per user or per room make the room the expensive part. One train is the smallest unit; portfolios with more than ten get a quote." },
  { q: "Does it work online and in person?", a: "Both. Project the board on the wall or have everyone open it on their laptops; the facilitator sees every move either way." },
];
