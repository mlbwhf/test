// The Kanban systems of each SAFe level: their own states with WIP limits, their own kinds of
// work (epics, capabilities, features, stories, each with its enablers) and what a card's detail
// holds. One board design (apps/web kanban-board.tsx) draws all four.

export type KanbanLevel = "portfolio" | "solution" | "art" | "team";

export interface KanbanState {
  name: string;
  /** Work-in-progress limit; 0 for none. A board may change it. */
  wip: number;
  /** A state where the work is being built (tinted). */
  build?: boolean;
}

export interface KanbanSpec {
  level: KanbanLevel;
  name: string;
  eyebrow: string;
  title: string;
  lede: string;
  /** What one item is called, singular and plural. */
  unit: [string, string];
  /** The detail panel's heading. */
  panel: string;
  states: KanbanState[];
  /** Kinds of work by key: name, card colour, text colour. */
  types: Record<string, { name: string; bg: string; fg: string }>;
  /** The detail's text fields: key, label, placeholder. */
  fields: [string, string, string][];
  /** How the work is sized: WSJF with its three components and job size, or story points. */
  sizing: "wsjf" | "points";
  /** Example items for the template's preview: name, type, state, business value, time criticality, risk reduction, size. */
  examples: [string, string, number, number, number, number, number][];
}

export interface KanbanItem {
  id: string;
  name: string;
  type: string;
  /** Index into the level's states. */
  state: number;
  bv?: number;
  tc?: number;
  rr?: number;
  size?: number;
  [field: string]: unknown;
}

const HYP: [string, string, string][] = [["hypothesis", "Benefit hypothesis", "[The measurable benefit if this is delivered]"], ["acceptance", "Acceptance criteria", "[How we will know it is complete]"]];

export const KANBAN_LEVELS: Record<KanbanLevel, KanbanSpec> = {
  portfolio: {
    level: "portfolio", name: "Portfolio Kanban", eyebrow: "Lean portfolio management · Portfolio Kanban", title: "Epics from funnel to done, inside their WIP limits",
    lede: "Select an epic to read its Lean business case and move it on. A state at its limit turns amber and refuses more work until something leaves it.",
    unit: ["epic", "epics"], panel: "Lean business case", sizing: "wsjf",
    states: [{ name: "Funnel", wip: 0 }, { name: "Reviewing", wip: 4 }, { name: "Analyzing", wip: 4 }, { name: "Portfolio backlog", wip: 0 }, { name: "Implementing: MVP", wip: 3, build: true }, { name: "Implementing: persevere", wip: 5, build: true }, { name: "Done", wip: 0 }],
    types: { business: { name: "Business epic", bg: "#0b3d4c", fg: "#ffffff" }, enabler: { name: "Enabler epic", bg: "#8acece", fg: "#0b2a33" }, compliance: { name: "Compliance or expedite", bg: "#e2462a", fg: "#ffffff" } },
    fields: [["hypothesis", "Hypothesis", "If we deliver [this epic], [the customers it serves] will [the change in behaviour we expect]."], ["mvp", "MVP", "[The smallest release that tests the hypothesis]"], ["indicators", "Leading indicators", "[Early measures that show whether the hypothesis holds]"]],
    examples: [["Integration with Jira", "compliance", 0, 8, 8, 5, 5], ["Instant collaboration module", "enabler", 0, 5, 3, 3, 8], ["New community platform", "business", 0, 2, 4, 6, 4], ["Integration with MS Teams", "compliance", 0, 8, 5, 3, 3], ["Partner platform", "business", 1, 13, 8, 5, 8], ["New community tools", "enabler", 1, 5, 5, 8, 5], ["CQRS library", "business", 1, 3, 2, 8, 3], ["Full integration", "enabler", 2, 8, 5, 8, 13], ["Provide new integration offer", "business", 2, 13, 13, 5, 8], ["Sorting order", "enabler", 3, 3, 2, 3, 2], ["Search", "business", 3, 13, 8, 5, 5], ["Shopping and delivery", "business", 3, 3, 3, 1, 2], ["Lean-Agile tools", "compliance", 4, 8, 13, 8, 8], ["CRM deployment", "enabler", 6, 8, 5, 5, 8]],
  },
  solution: {
    level: "solution", name: "Solution Train Kanban", eyebrow: "Solution Train · Solution Train Kanban", title: "Capabilities from funnel to done",
    lede: "Select a capability to read its benefit hypothesis and move it on. A state at its limit turns amber and refuses more work until something leaves it.",
    unit: ["capability", "capabilities"], panel: "Capability", sizing: "wsjf", fields: HYP,
    states: [{ name: "Funnel", wip: 0 }, { name: "Analyzing", wip: 3 }, { name: "Ready", wip: 6 }, { name: "Implementing", wip: 4, build: true }, { name: "Validating on staging", wip: 3, build: true }, { name: "Deploying to production", wip: 3, build: true }, { name: "Releasing", wip: 2, build: true }, { name: "Done", wip: 0 }],
    types: { business: { name: "Capability", bg: "#3a2a6b", fg: "#ffffff" }, enabler: { name: "Enabler capability", bg: "#c9bdf0", fg: "#241a45" } },
    examples: [["Cross-border payments", "business", 0, 13, 8, 5, 13], ["Unified customer identity", "business", 1, 13, 13, 8, 13], ["Event streaming backbone", "enabler", 1, 5, 8, 13, 8], ["Partner onboarding", "business", 2, 8, 5, 3, 5], ["Zero-trust network", "enabler", 3, 5, 8, 13, 13], ["Real-time fraud scoring", "business", 3, 13, 13, 8, 8], ["Regulatory reporting", "business", 4, 8, 13, 5, 8], ["Shared design system", "enabler", 7, 5, 3, 5, 5]],
  },
  art: {
    level: "art", name: "ART Kanban", eyebrow: "Agile Release Train · ART Kanban", title: "Features through the continuous delivery pipeline",
    lede: "Select a feature to read its benefit hypothesis and move it on. A state at its limit turns amber and refuses more work until something leaves it.",
    unit: ["feature", "features"], panel: "Feature", sizing: "wsjf", fields: HYP,
    states: [{ name: "Funnel", wip: 0 }, { name: "Analyzing", wip: 2 }, { name: "Ready", wip: 6 }, { name: "Implementing", wip: 4, build: true }, { name: "Validating on staging", wip: 6, build: true }, { name: "Deploying to production", wip: 4, build: true }, { name: "Releasing", wip: 5, build: true }, { name: "Done", wip: 0 }],
    types: { business: { name: "Feature", bg: "#1f5f8b", fg: "#ffffff" }, enabler: { name: "Enabler feature", bg: "#b9d7ee", fg: "#102c40" } },
    examples: [["Shipping method selection", "business", 0, 8, 5, 3, 5], ["Saved carts across devices", "business", 1, 8, 5, 3, 8], ["Shopping cart", "business", 2, 13, 8, 5, 8], ["Checkout latency budget", "enabler", 2, 5, 8, 8, 5], ["One-page guest checkout", "business", 3, 13, 13, 5, 13], ["Search relevance eval harness", "enabler", 3, 5, 5, 8, 8], ["Semantic product search", "business", 4, 13, 8, 5, 13], ["Wallet tokenisation", "business", 5, 8, 13, 8, 13], ["Retire legacy payout job", "enabler", 7, 3, 2, 5, 5]],
  },
  team: {
    level: "team", name: "Team Kanban", eyebrow: "Agile Team · Team Kanban", title: "Stories from backlog to accepted",
    lede: "Select a story to read it and move it on. A state at its limit turns amber and refuses more work until something leaves it.",
    unit: ["story", "stories"], panel: "Story", sizing: "points",
    states: [{ name: "Team backlog", wip: 0 }, { name: "Ready", wip: 5 }, { name: "In progress", wip: 3, build: true }, { name: "In review", wip: 2, build: true }, { name: "Integrated and tested", wip: 3, build: true }, { name: "Accepted", wip: 0 }],
    types: { business: { name: "Story", bg: "#bcde81", fg: "#1c2a08" }, enabler: { name: "Enabler story", bg: "#d9e8f7", fg: "#17212b" }, spike: { name: "Spike", bg: "#fde8a6", fg: "#3b2e00" } },
    fields: [["story", "Story", "As a [role], I want [activity] so that [business value]."], ["acceptance", "Acceptance criteria", "[Given … when … then …]"]],
    examples: [["Save an item to retrieve it later", "business", 0, 0, 0, 0, 5], ["Research AJAX for the shopping experience", "spike", 0, 0, 0, 0, 5], ["Remove items from my shopping cart", "business", 1, 0, 0, 0, 2], ["Get a shipping quote from my cart", "business", 1, 0, 0, 0, 8], ["Change the number of items in my cart", "business", 2, 0, 0, 0, 3], ["Upgrade Eclipse for better stability", "enabler", 2, 0, 0, 0, 3], ["Calculate shipping costs with UPS and FedEx", "spike", 2, 0, 0, 0, 8], ["See a cart icon with the item count", "business", 3, 0, 0, 0, 2], ["See the delivery speed for each shipping method", "business", 5, 0, 0, 0, 2]],
  },
};

/** WSJF = (business value + time criticality + risk reduction and opportunity enablement) ÷ job size, to one decimal; null until sized. */
export function kanbanWsjf(i: Pick<KanbanItem, "bv" | "tc" | "rr" | "size">): number | null {
  const size = Number(i.size) || 0;
  return size > 0 ? Math.round(((Number(i.bv) || 0) + (Number(i.tc) || 0) + (Number(i.rr) || 0)) / size * 10) / 10 : null;
}

/** Where an item goes next: one state on, except a portfolio epic, whose MVP ends in a persevere or pivot decision. */
export function kanbanNext(spec: KanbanSpec, state: number): number | null {
  if (spec.level === "portfolio" && state === 4) return null;
  return state < spec.states.length - 1 ? state + 1 : null;
}

/** The level a board runs as: its own marker, or the built-in Kanban template it was made from. */
export function kanbanLevelOf(b: { fields?: Record<string, unknown>; templateId?: string; id?: string }): KanbanLevel | null {
  const f = b.fields?.kanban;
  if (f === "portfolio" || f === "solution" || f === "art" || f === "team") return f;
  const t = b.templateId ?? b.id ?? "";
  return t === "tpl-builtin-portfolio-kanban" ? "portfolio" : t === "tpl-builtin-solution-kanban" ? "solution" : t === "tpl-builtin-art-kanban" ? "art" : null;
}

const KANBAN_TEMPLATES: Record<string, KanbanLevel> = { "tpl-builtin-portfolio-kanban": "portfolio", "tpl-builtin-solution-kanban": "solution", "tpl-builtin-art-kanban": "art", "tpl-builtin-kanban": "team" };
// Where the old Team Kanban table's groups land in the team states.
const OLD_TEAM_GROUPS: Record<string, number> = { ready: 1, doing: 2, review: 3, done: 5 };

/**
 * A board made from a Kanban template before the Kanban board existed (columns on a canvas, or a
 * table with groups) becomes that level's Kanban board: its cards become items in the matching
 * state, kept in one frame's state. Returns whether the board changed.
 */
export function upgradeKanbanBoard(b: {
  id: string; isTemplate?: boolean; templateId?: string; fields?: Record<string, unknown>;
  frames: { id: string; title: string; x: number; y: number; width: number; height: number; state?: Record<string, unknown> }[];
  nodes: { id: string; text: string; frameId?: string; kind?: string }[];
  rows?: { id: string; groupId?: string; cells?: Record<string, unknown> }[]; columns?: unknown[]; groups?: unknown[]; edges?: unknown[];
}): boolean {
  const level = KANBAN_TEMPLATES[b.templateId ?? ""];
  if (!level || b.isTemplate || b.fields?.kanban) return false;
  const spec = KANBAN_LEVELS[level], type = Object.keys(spec.types)[0]!, items: KanbanItem[] = [];
  const cols = [...b.frames].sort((x, y) => x.x - y.x);
  for (const n of b.nodes) {
    const text = n.text.trim(), col = cols.findIndex((f) => f.id === n.frameId);
    if (!text || /^Add a card here$/i.test(text) || col < 0) continue;
    items.push({ id: `k${items.length}-${n.id.replace(/[^a-z0-9]/gi, "").slice(-8)}`, name: text.slice(0, 160), type, state: Math.min(col, spec.states.length - 1) });
  }
  for (const r of b.rows ?? []) {
    const name = String(r.cells?.title ?? "").trim();
    if (name) items.push({ id: `k${items.length}-${r.id.replace(/[^a-z0-9]/gi, "").slice(-8)}`, name: name.slice(0, 160), type, state: OLD_TEAM_GROUPS[(r.groupId ?? "").split(":").pop() ?? ""] ?? 0 });
  }
  b.fields = { ...(b.fields ?? {}), kanban: level };
  b.frames = [{ id: `${b.id}:kanban`, title: spec.name, x: 0, y: 0, width: 2400, height: 900, state: { items } }];
  b.nodes = [];
  if (b.rows) b.rows = [];
  if (b.columns) b.columns = [];
  if (b.groups) b.groups = [];
  if (b.edges) b.edges = [];
  return true;
}
