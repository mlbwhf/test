// Operating models: a scaling framework described as data. Templates below are starting
// points that a coach forks and edits; the planner, board and reports read only the model,
// so a homegrown hybrid works exactly like a published framework.
//
// Framework names are trademarks of their owners (SAFe® and Scaled Agile Framework® are
// registered trademarks of Scaled Agile, Inc.). Templates are our own summaries, not
// copies of the frameworks' materials.

export type Scope = "team" | "group" | "portfolio";
export type AutonomyLevel = 0 | 1 | 2 | 3 | 4;

export interface GroupLevel {
  key: string;
  label: string;
  /** Key of the enclosing group level; omitted for the top level. */
  parent?: string;
}

export interface WorkLevel {
  key: string;
  label: string;
  parent?: string;
  /** The level planned onto the program board (features in SAFe). */
  planned?: boolean;
}

export interface Cadence {
  /** "iterations" plans into time boxes; "flow" uses replenishment windows instead. */
  mode: "iterations" | "flow";
  iterationLabel: string;
  iterationWeeks: number;
  incrementLabel: string;
  iterationsPerIncrement: number;
  /** Reserve the last iteration of each increment for innovation and planning. */
  ipIteration: boolean;
}

export interface RoleDef {
  key: string;
  label: string;
  scope: Scope;
}

export interface EventDef {
  key: string;
  label: string;
  scope: Scope;
  when: "iteration" | "increment" | "continuous";
}

export interface AiNativeSettings {
  enabled: boolean;
  /** Every AI agent must name a human who is accountable for what it does. */
  requireAccountableHuman: boolean;
  /** Agents can be added to teams and appear on the board next to people. */
  agentsAsTeamMembers: boolean;
  /** Highest autonomy level any agent may be given (0 suggest only … 4 fully autonomous). */
  maxAgentAutonomy: AutonomyLevel;
  /** Stage gates require sign-off from the AI value architect role. */
  valueArchitectSignOff: boolean;
}

export interface OperatingModel {
  id: string;
  name: string;
  framework: string;
  description: string;
  /** Template this model was forked from, if any. */
  basedOn?: string;
  groupLevels: GroupLevel[];
  workLevels: WorkLevel[];
  cadence: Cadence;
  roles: RoleDef[];
  events: EventDef[];
  /** Metric keys shown by default on this model's dashboards. */
  metrics: string[];
  aiNative: AiNativeSettings;
}

const AI_OFF: AiNativeSettings = {
  enabled: false,
  requireAccountableHuman: true,
  agentsAsTeamMembers: false,
  maxAgentAutonomy: 1,
  valueArchitectSignOff: false,
};

const SAFE_TEAM_ROLES: RoleDef[] = [
  { key: "po", label: "Product Owner", scope: "team" },
  { key: "team-coach", label: "Scrum Master / Team Coach", scope: "team" },
];
const SAFE_ART_ROLES: RoleDef[] = [
  { key: "rte", label: "Release Train Engineer", scope: "group" },
  { key: "pm", label: "Product Management", scope: "group" },
  { key: "architect", label: "System Architect", scope: "group" },
  { key: "business-owner", label: "Business Owner", scope: "group" },
];
const SAFE_TEAM_EVENTS: EventDef[] = [
  { key: "iteration-planning", label: "Iteration Planning", scope: "team", when: "iteration" },
  { key: "team-sync", label: "Team Sync", scope: "team", when: "continuous" },
  { key: "iteration-review", label: "Iteration Review", scope: "team", when: "iteration" },
  { key: "iteration-retro", label: "Iteration Retrospective", scope: "team", when: "iteration" },
];
const SAFE_ART_EVENTS: EventDef[] = [
  { key: "pi-planning", label: "PI Planning", scope: "group", when: "increment" },
  { key: "art-sync", label: "ART Sync", scope: "group", when: "continuous" },
  { key: "system-demo", label: "System Demo", scope: "group", when: "iteration" },
  { key: "inspect-adapt", label: "Inspect & Adapt", scope: "group", when: "increment" },
];
const SAFE_CADENCE: Cadence = {
  mode: "iterations",
  iterationLabel: "Iteration",
  iterationWeeks: 2,
  incrementLabel: "PI",
  iterationsPerIncrement: 5,
  ipIteration: true,
};
const FLOW_METRICS = ["flow-velocity", "flow-time", "flow-load", "flow-distribution", "predictability"];

export const TEMPLATES: readonly OperatingModel[] = [
  {
    id: "safe-essential",
    name: "SAFe Essential",
    framework: "SAFe 6",
    description: "Agile teams on one Agile Release Train, planning features into a PI.",
    groupLevels: [
      { key: "train", label: "Agile Release Train" },
      { key: "team", label: "Agile Team", parent: "train" },
    ],
    workLevels: [
      { key: "feature", label: "Feature", planned: true },
      { key: "story", label: "Story", parent: "feature" },
    ],
    cadence: SAFE_CADENCE,
    roles: [...SAFE_ART_ROLES, ...SAFE_TEAM_ROLES],
    events: [...SAFE_ART_EVENTS, ...SAFE_TEAM_EVENTS],
    metrics: FLOW_METRICS,
    aiNative: AI_OFF,
  },
  {
    id: "safe-portfolio",
    name: "SAFe Portfolio",
    framework: "SAFe 6",
    description: "Essential plus Lean Portfolio Management: epics, value streams and Lean budgets.",
    groupLevels: [
      { key: "portfolio", label: "Portfolio" },
      { key: "train", label: "Agile Release Train", parent: "portfolio" },
      { key: "team", label: "Agile Team", parent: "train" },
    ],
    workLevels: [
      { key: "epic", label: "Epic" },
      { key: "feature", label: "Feature", parent: "epic", planned: true },
      { key: "story", label: "Story", parent: "feature" },
    ],
    cadence: SAFE_CADENCE,
    roles: [
      { key: "lpm", label: "Lean Portfolio Management", scope: "portfolio" },
      { key: "epic-owner", label: "Epic Owner", scope: "portfolio" },
      { key: "enterprise-architect", label: "Enterprise Architect", scope: "portfolio" },
      ...SAFE_ART_ROLES,
      ...SAFE_TEAM_ROLES,
    ],
    events: [
      { key: "portfolio-sync", label: "Portfolio Sync", scope: "portfolio", when: "continuous" },
      { key: "strategic-review", label: "Strategic Portfolio Review", scope: "portfolio", when: "increment" },
      { key: "participatory-budgeting", label: "Participatory Budgeting", scope: "portfolio", when: "increment" },
      ...SAFE_ART_EVENTS,
      ...SAFE_TEAM_EVENTS,
    ],
    metrics: [...FLOW_METRICS, "objective-achievement"],
    aiNative: AI_OFF,
  },
  {
    id: "safe-full",
    name: "SAFe Full",
    framework: "SAFe 6",
    description: "Portfolio plus Large Solution: solution trains coordinating several ARTs through capabilities.",
    groupLevels: [
      { key: "portfolio", label: "Portfolio" },
      { key: "solution", label: "Solution Train", parent: "portfolio" },
      { key: "train", label: "Agile Release Train", parent: "solution" },
      { key: "team", label: "Agile Team", parent: "train" },
    ],
    workLevels: [
      { key: "epic", label: "Epic" },
      { key: "capability", label: "Capability", parent: "epic" },
      { key: "feature", label: "Feature", parent: "capability", planned: true },
      { key: "story", label: "Story", parent: "feature" },
    ],
    cadence: SAFE_CADENCE,
    roles: [
      { key: "lpm", label: "Lean Portfolio Management", scope: "portfolio" },
      { key: "epic-owner", label: "Epic Owner", scope: "portfolio" },
      { key: "ste", label: "Solution Train Engineer", scope: "group" },
      { key: "solution-management", label: "Solution Management", scope: "group" },
      { key: "solution-architect", label: "Solution Architect", scope: "group" },
      ...SAFE_ART_ROLES,
      ...SAFE_TEAM_ROLES,
    ],
    events: [
      { key: "portfolio-sync", label: "Portfolio Sync", scope: "portfolio", when: "continuous" },
      { key: "solution-sync", label: "Solution Train Sync", scope: "group", when: "continuous" },
      { key: "solution-demo", label: "Solution Demo", scope: "group", when: "increment" },
      ...SAFE_ART_EVENTS,
      ...SAFE_TEAM_EVENTS,
    ],
    metrics: [...FLOW_METRICS, "objective-achievement", "dependency-health"],
    aiNative: AI_OFF,
  },
  {
    id: "safe-ai-native",
    name: "AI-Native SAFe",
    framework: "AI-Native SAFe",
    description:
      "Smaller AI-augmented teams, shorter cycles, an AI value architect accountable for cost, ethics, legal and risk, and governed, curated data. The cadence defaults are a starting point: adjust them to your reading of Scaled Agile's guidance.",
    groupLevels: [
      { key: "portfolio", label: "Portfolio" },
      { key: "train", label: "Agile Release Train", parent: "portfolio" },
      { key: "team", label: "AI-Augmented Team", parent: "train" },
    ],
    workLevels: [
      { key: "epic", label: "Epic" },
      { key: "feature", label: "Feature", parent: "epic", planned: true },
      { key: "story", label: "Story", parent: "feature" },
    ],
    cadence: { ...SAFE_CADENCE, iterationWeeks: 1, iterationsPerIncrement: 7 },
    roles: [
      { key: "lpm", label: "Lean Portfolio Management", scope: "portfolio" },
      { key: "ai-value-architect", label: "AI Value Architect", scope: "portfolio" },
      { key: "data-steward", label: "Data Steward", scope: "group" },
      ...SAFE_ART_ROLES,
      ...SAFE_TEAM_ROLES,
    ],
    events: [
      { key: "portfolio-sync", label: "Portfolio Sync", scope: "portfolio", when: "continuous" },
      { key: "ai-governance-review", label: "AI Governance Review", scope: "portfolio", when: "increment" },
      ...SAFE_ART_EVENTS,
      ...SAFE_TEAM_EVENTS,
    ],
    metrics: [...FLOW_METRICS, "ai-stage-mix", "ai-spend", "ai-value-realised", "agents-on-teams"],
    aiNative: {
      enabled: true,
      requireAccountableHuman: true,
      agentsAsTeamMembers: true,
      maxAgentAutonomy: 3,
      valueArchitectSignOff: true,
    },
  },
  {
    id: "less",
    name: "LeSS",
    framework: "LeSS",
    description: "Up to about eight teams on one product, one Product Owner and one Product Backlog, with a shared Sprint.",
    groupLevels: [
      { key: "product", label: "Product" },
      { key: "team", label: "Team", parent: "product" },
    ],
    workLevels: [{ key: "item", label: "Product Backlog Item", planned: true }],
    cadence: { mode: "iterations", iterationLabel: "Sprint", iterationWeeks: 2, incrementLabel: "Release", iterationsPerIncrement: 3, ipIteration: false },
    roles: [
      { key: "po", label: "Product Owner", scope: "group" },
      { key: "scrum-master", label: "Scrum Master", scope: "team" },
    ],
    events: [
      { key: "sprint-planning-1", label: "Sprint Planning One", scope: "group", when: "iteration" },
      { key: "sprint-planning-2", label: "Sprint Planning Two", scope: "team", when: "iteration" },
      { key: "refinement", label: "Product Backlog Refinement", scope: "group", when: "continuous" },
      { key: "sprint-review", label: "Sprint Review", scope: "group", when: "iteration" },
      { key: "overall-retro", label: "Overall Retrospective", scope: "group", when: "iteration" },
    ],
    metrics: ["flow-velocity", "flow-time", "flow-load"],
    aiNative: AI_OFF,
  },
  {
    id: "less-huge",
    name: "LeSS Huge",
    framework: "LeSS",
    description: "LeSS for larger products: requirement areas, each with an Area Product Owner and its own teams.",
    groupLevels: [
      { key: "product", label: "Product" },
      { key: "area", label: "Requirement Area", parent: "product" },
      { key: "team", label: "Team", parent: "area" },
    ],
    workLevels: [{ key: "item", label: "Product Backlog Item", planned: true }],
    cadence: { mode: "iterations", iterationLabel: "Sprint", iterationWeeks: 2, incrementLabel: "Release", iterationsPerIncrement: 3, ipIteration: false },
    roles: [
      { key: "po", label: "Product Owner", scope: "portfolio" },
      { key: "apo", label: "Area Product Owner", scope: "group" },
      { key: "scrum-master", label: "Scrum Master", scope: "team" },
    ],
    events: [
      { key: "sprint-planning-1", label: "Sprint Planning One", scope: "group", when: "iteration" },
      { key: "sprint-review", label: "Sprint Review", scope: "group", when: "iteration" },
      { key: "overall-retro", label: "Overall Retrospective", scope: "group", when: "iteration" },
    ],
    metrics: ["flow-velocity", "flow-time", "flow-load", "flow-distribution"],
    aiNative: AI_OFF,
  },
  {
    id: "scrum-at-scale",
    name: "Scrum@Scale",
    framework: "Scrum@Scale",
    description: "Scrum teams joined into Scrums of Scrums, steered by an Executive Action Team and Executive MetaScrum.",
    groupLevels: [
      { key: "executive", label: "Executive Action Team" },
      { key: "sos", label: "Scrum of Scrums", parent: "executive" },
      { key: "team", label: "Scrum Team", parent: "sos" },
    ],
    workLevels: [
      { key: "epic", label: "Epic" },
      { key: "item", label: "Backlog Item", parent: "epic", planned: true },
    ],
    cadence: { mode: "iterations", iterationLabel: "Sprint", iterationWeeks: 2, incrementLabel: "Release", iterationsPerIncrement: 4, ipIteration: false },
    roles: [
      { key: "cpo", label: "Chief Product Owner", scope: "group" },
      { key: "sosm", label: "Scrum of Scrums Master", scope: "group" },
      { key: "po", label: "Product Owner", scope: "team" },
      { key: "scrum-master", label: "Scrum Master", scope: "team" },
    ],
    events: [
      { key: "scaled-daily", label: "Scaled Daily Scrum", scope: "group", when: "continuous" },
      { key: "metascrum", label: "Executive MetaScrum", scope: "portfolio", when: "iteration" },
      { key: "sprint-review", label: "Sprint Review", scope: "team", when: "iteration" },
    ],
    metrics: ["flow-velocity", "flow-time", "predictability"],
    aiNative: AI_OFF,
  },
  {
    id: "nexus",
    name: "Nexus",
    framework: "Nexus",
    description: "Three to nine Scrum teams on one product with a Nexus Integration Team.",
    groupLevels: [
      { key: "nexus", label: "Nexus" },
      { key: "team", label: "Scrum Team", parent: "nexus" },
    ],
    workLevels: [{ key: "item", label: "Product Backlog Item", planned: true }],
    cadence: { mode: "iterations", iterationLabel: "Sprint", iterationWeeks: 2, incrementLabel: "Release", iterationsPerIncrement: 3, ipIteration: false },
    roles: [
      { key: "po", label: "Product Owner", scope: "group" },
      { key: "nit", label: "Nexus Integration Team", scope: "group" },
      { key: "scrum-master", label: "Scrum Master", scope: "team" },
    ],
    events: [
      { key: "nexus-planning", label: "Nexus Sprint Planning", scope: "group", when: "iteration" },
      { key: "nexus-daily", label: "Nexus Daily Scrum", scope: "group", when: "continuous" },
      { key: "nexus-review", label: "Nexus Sprint Review", scope: "group", when: "iteration" },
      { key: "nexus-retro", label: "Nexus Sprint Retrospective", scope: "group", when: "iteration" },
    ],
    metrics: ["flow-velocity", "flow-time", "dependency-health"],
    aiNative: AI_OFF,
  },
  {
    id: "flight-levels",
    name: "Flight Levels",
    framework: "Flight Levels",
    description: "Kanban-based coordination at three levels: operational, coordination and strategic portfolio.",
    groupLevels: [
      { key: "strategic", label: "Strategic (Level 3)" },
      { key: "coordination", label: "Coordination (Level 2)", parent: "strategic" },
      { key: "team", label: "Operational (Level 1)", parent: "coordination" },
    ],
    workLevels: [
      { key: "initiative", label: "Initiative" },
      { key: "epic", label: "Epic", parent: "initiative", planned: true },
      { key: "task", label: "Task", parent: "epic" },
    ],
    cadence: { mode: "flow", iterationLabel: "Replenishment", iterationWeeks: 2, incrementLabel: "Quarter", iterationsPerIncrement: 6, ipIteration: false },
    roles: [
      { key: "flow-coach", label: "Flow Coach", scope: "group" },
      { key: "service-owner", label: "Service Request Manager", scope: "team" },
    ],
    events: [
      { key: "replenishment", label: "Replenishment", scope: "group", when: "iteration" },
      { key: "strategy-review", label: "Strategy Review", scope: "portfolio", when: "increment" },
      { key: "flow-review", label: "Flow Review", scope: "group", when: "continuous" },
    ],
    metrics: ["flow-time", "flow-load", "flow-distribution"],
    aiNative: AI_OFF,
  },
  {
    id: "tribes",
    name: "Tribes and squads",
    framework: "Spotify-style",
    description: "Autonomous squads grouped into tribes, with chapters and guilds across them.",
    groupLevels: [
      { key: "tribe", label: "Tribe" },
      { key: "team", label: "Squad", parent: "tribe" },
    ],
    workLevels: [
      { key: "bet", label: "Bet" },
      { key: "item", label: "Backlog Item", parent: "bet", planned: true },
    ],
    cadence: { mode: "iterations", iterationLabel: "Sprint", iterationWeeks: 2, incrementLabel: "Quarter", iterationsPerIncrement: 6, ipIteration: false },
    roles: [
      { key: "tribe-lead", label: "Tribe Lead", scope: "group" },
      { key: "chapter-lead", label: "Chapter Lead", scope: "group" },
      { key: "po", label: "Product Owner", scope: "team" },
      { key: "agile-coach", label: "Agile Coach", scope: "team" },
    ],
    events: [
      { key: "qbr", label: "Quarterly Business Review", scope: "group", when: "increment" },
      { key: "sprint-planning", label: "Sprint Planning", scope: "team", when: "iteration" },
    ],
    metrics: ["flow-velocity", "flow-time"],
    aiNative: AI_OFF,
  },
];

export function getTemplate(id: string): OperatingModel {
  const t = TEMPLATES.find((m) => m.id === id);
  if (!t) throw new Error(`unknown operating model template: ${id}`);
  return t;
}

export type ModelPatch = Partial<Omit<OperatingModel, "id" | "basedOn" | "cadence" | "aiNative">> & {
  cadence?: Partial<Cadence>;
  aiNative?: Partial<AiNativeSettings>;
};

/** Copy a template (or any model) under a new id, applying edits. The source is never changed. */
export function forkModel(source: OperatingModel, id: string, patch: ModelPatch = {}): OperatingModel {
  const base = structuredClone(source);
  return {
    ...base,
    ...structuredClone({ ...patch, cadence: undefined, aiNative: undefined }),
    id,
    basedOn: source.id,
    cadence: { ...base.cadence, ...patch.cadence },
    aiNative: { ...base.aiNative, ...patch.aiNative },
  } as OperatingModel;
}

/** Levels ordered from the top of the hierarchy down. Assumes a valid model. */
export function orderLevels<T extends { key: string; parent?: string }>(levels: readonly T[]): T[] {
  const out: T[] = [];
  let current = levels.find((l) => !l.parent);
  while (current && out.length < levels.length) {
    out.push(current);
    const key: string = current.key;
    current = levels.find((l) => l.parent === key);
  }
  return out;
}

export interface ModelIssue {
  path: string;
  message: string;
}

/** Structural checks run before a model is saved. An empty list means the model is usable. */
export function validateModel(model: OperatingModel, knownMetrics?: ReadonlySet<string>): ModelIssue[] {
  const issues: ModelIssue[] = [];
  const checkTree = (name: "groupLevels" | "workLevels", levels: readonly { key: string; parent?: string }[]) => {
    if (levels.length === 0) {
      issues.push({ path: name, message: "Add at least one level." });
      return;
    }
    const keys = new Set<string>();
    for (const [i, l] of levels.entries()) {
      if (!l.key.trim()) issues.push({ path: `${name}[${i}].key`, message: "Level key is empty." });
      if (keys.has(l.key)) issues.push({ path: `${name}[${i}].key`, message: `Level key "${l.key}" is used twice.` });
      keys.add(l.key);
    }
    const roots = levels.filter((l) => !l.parent);
    if (roots.length !== 1) issues.push({ path: name, message: `Exactly one top level is needed, found ${roots.length}.` });
    for (const [i, l] of levels.entries()) {
      if (l.parent && !keys.has(l.parent)) issues.push({ path: `${name}[${i}].parent`, message: `Parent "${l.parent}" does not exist.` });
    }
    const children = new Map<string, number>();
    for (const l of levels) if (l.parent) children.set(l.parent, (children.get(l.parent) ?? 0) + 1);
    for (const [parent, n] of children) {
      if (n > 1) issues.push({ path: name, message: `"${parent}" has ${n} child levels; levels form a single chain.` });
    }
    if (roots.length === 1 && orderLevels(levels).length !== levels.length) {
      issues.push({ path: name, message: "Levels contain a cycle or a disconnected level." });
    }
  };
  checkTree("groupLevels", model.groupLevels);
  checkTree("workLevels", model.workLevels);

  if (!model.groupLevels.some((g) => g.key === "team")) {
    issues.push({ path: "groupLevels", message: 'One group level must have the key "team"; teams are planned against it.' });
  }
  const planned = model.workLevels.filter((w) => w.planned);
  if (planned.length !== 1) issues.push({ path: "workLevels", message: `Mark exactly one work level as planned on the board, found ${planned.length}.` });

  const c = model.cadence;
  if (!Number.isInteger(c.iterationWeeks) || c.iterationWeeks < 1 || c.iterationWeeks > 8) {
    issues.push({ path: "cadence.iterationWeeks", message: "Iteration length must be 1 to 8 weeks." });
  }
  if (!Number.isInteger(c.iterationsPerIncrement) || c.iterationsPerIncrement < 1 || c.iterationsPerIncrement > 26) {
    issues.push({ path: "cadence.iterationsPerIncrement", message: "An increment holds 1 to 26 iterations." });
  }
  if (c.ipIteration && c.iterationsPerIncrement < 2) {
    issues.push({ path: "cadence.ipIteration", message: "An IP iteration needs at least one other iteration in the increment." });
  }

  const roleKeys = new Set<string>();
  for (const [i, r] of model.roles.entries()) {
    if (roleKeys.has(r.key)) issues.push({ path: `roles[${i}].key`, message: `Role key "${r.key}" is used twice.` });
    roleKeys.add(r.key);
  }
  if (knownMetrics) {
    for (const [i, m] of model.metrics.entries()) {
      if (!knownMetrics.has(m)) issues.push({ path: `metrics[${i}]`, message: `Unknown metric "${m}".` });
    }
  }
  const ai = model.aiNative;
  if (ai.enabled && ai.valueArchitectSignOff && !roleKeys.has("ai-value-architect")) {
    issues.push({ path: "aiNative.valueArchitectSignOff", message: 'Sign-off needs a role with the key "ai-value-architect".' });
  }
  if (!Number.isInteger(ai.maxAgentAutonomy) || ai.maxAgentAutonomy < 0 || ai.maxAgentAutonomy > 4) {
    issues.push({ path: "aiNative.maxAgentAutonomy", message: "Autonomy level must be 0 to 4." });
  }
  return issues;
}
