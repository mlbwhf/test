// SAFe's planning canvases as data. One engine holds them all: each canvas type is a list of
// sections, each section a kind of field (a value statement, free text, a list, labelled
// pairs, a table, chevrons drawn from a value stream, a timeline, a checklist). Canvases can
// be prefilled from a value stream identification, and a SWOT can be turned into TOWS
// strategies that generate a future-state portfolio canvas and a portfolio vision draft.

import type { ValueStreamIdentification } from "./valuestreams.js";

export type CanvasTypeId = "lace-mission" | "portfolio-canvas" | "swot" | "tows" | "portfolio-vision" | "dvs-canvas" | "art-canvas" | "art-launch" | "epic-hypothesis" | "lean-business-case" | "feature-canvas" | "enabler-canvas";

export type SectionKind = "statement" | "text" | "list" | "pairs" | "table" | "chevrons" | "timeline" | "checklist" | "wsjf";

export interface SectionDef {
  key: string;
  title: string;
  kind: SectionKind;
  prompt?: string;
  /** Labels of a value statement's rows, the columns of a table, or the fixed labels of pairs. */
  labels?: string[];
  /** Grid placement on a 12-column canvas. */
  span: number;
  /** Rows the section spans, for a tall section beside a grid of smaller ones. */
  rows?: number;
  /** Visual tone of the header: dark (title bars), teal (SAFe band) or light. */
  tone?: "dark" | "teal" | "light" | "green";
  /** For chevrons: which value stream steps to draw. */
  chevrons?: "operational" | "development";
  /** Group heading drawn above this section, e.g. "For Solution Trains". */
  group?: string;
}

export interface CanvasTypeDef {
  id: CanvasTypeId;
  name: string;
  blurb: string;
  /** Where this canvas sits in SAFe. */
  where: string;
  sections: SectionDef[];
}

const STATEMENT = ["For", "Who", "The", "Is a", "That", "Unlike", "Our solution"];

export const CANVAS_TYPES: CanvasTypeDef[] = [
  {
    id: "lace-mission",
    name: "LACE mission statement",
    blurb: "Why the Lean-Agile Center of Excellence exists, what it covers and how success is measured.",
    where: "Implementation roadmap · LACE",
    sections: [
      { key: "statement", title: "Mission statement", kind: "statement", labels: ["For", "Who", "The", "Is a", "That", "Unlike", "We"], span: 12, tone: "dark" },
      { key: "inScope", title: "In scope", kind: "list", span: 5, tone: "teal" },
      { key: "outScope", title: "Out of scope", kind: "list", span: 3, tone: "teal" },
      { key: "success", title: "Success criteria", kind: "pairs", labels: ["Adoption", "Assessment", "Outcome"], span: 4, tone: "teal" },
    ],
  },
  {
    id: "portfolio-canvas",
    name: "Portfolio canvas",
    blurb: "The portfolio's value streams and what each delivers, to whom, through which channels, for what budget and KPIs.",
    where: "Lean Portfolio Management · current and future state",
    sections: [
      { key: "valueProps", title: "Value propositions", kind: "table", labels: ["Value stream", "Solutions", "Customer segments", "Channels", "Customer relationships", "Budget", "KPIs / revenue"], span: 12, tone: "dark", prompt: "One row per value stream." },
      { key: "partners", title: "Key partners", kind: "list", span: 4, prompt: "Partners, suppliers, the resources and activities they provide." },
      { key: "activities", title: "Key activities", kind: "list", span: 4, prompt: "Strategic themes and Lean budgets, portfolio sync, PI planning, system demo, Inspect & Adapt…" },
      { key: "resources", title: "Key resources", kind: "list", span: 4, prompt: "Epic owners, enterprise architects, LPM authorities, VMO, LACE, shared services…" },
      { key: "costs", title: "Cost structure", kind: "text", span: 6, prompt: "Total portfolio budget; the most important and most expensive costs, resources and activities." },
      { key: "revenue", title: "Revenue streams", kind: "text", span: 6, prompt: "Revenue per monetised value stream; the value of non-monetised (development) value streams." },
      { key: "changes", title: "Planned changes (future state)", kind: "list", span: 12, tone: "green", prompt: "What changes between the current and the future state, and why." },
    ],
  },
  {
    id: "swot",
    name: "SWOT analysis",
    blurb: "Strengths and weaknesses (internal), opportunities and threats (external), as input to the portfolio's future state.",
    where: "Portfolio vision · future state",
    sections: [
      { key: "strengths", title: "Strengths", kind: "list", span: 6, tone: "teal", prompt: "Internal origin" },
      { key: "weaknesses", title: "Weaknesses", kind: "list", span: 6, tone: "teal", prompt: "Internal origin" },
      { key: "opportunities", title: "Opportunities", kind: "list", span: 6, tone: "light", prompt: "External origin" },
      { key: "threats", title: "Threats", kind: "list", span: 6, tone: "light", prompt: "External origin" },
    ],
  },
  {
    id: "tows",
    name: "TOWS strategies",
    blurb: "Pair the SWOT's internal factors with its external ones to turn analysis into strategy.",
    where: "Portfolio vision · future state",
    sections: [
      { key: "so", title: "Strengths × opportunities: use strengths to capture opportunities", kind: "list", span: 6, tone: "green" },
      { key: "wo", title: "Weaknesses × opportunities: fix weaknesses by taking opportunities", kind: "list", span: 6, tone: "light" },
      { key: "st", title: "Strengths × threats: use strengths to counter threats", kind: "list", span: 6, tone: "light" },
      { key: "wt", title: "Weaknesses × threats: reduce weaknesses to avoid threats", kind: "list", span: 6, tone: "teal" },
    ],
  },
  {
    id: "portfolio-vision",
    name: "Portfolio vision",
    blurb: "Where the portfolio is heading: the vision statement, strategic themes and the changes that get it there.",
    where: "Lean Portfolio Management · strategy",
    sections: [
      { key: "statement", title: "Vision statement", kind: "statement", labels: STATEMENT, span: 7, tone: "dark" },
      { key: "themes", title: "Strategic themes", kind: "list", span: 5, tone: "dark" },
      { key: "changes", title: "Key changes from today", kind: "list", span: 7, tone: "green" },
      { key: "horizon", title: "Time horizon and milestones", kind: "pairs", span: 5, labels: ["Horizon", "Next milestone", "Review"], tone: "light" },
    ],
  },
  {
    id: "dvs-canvas",
    name: "Development value stream canvas",
    blurb: "One development value stream: the operational steps it supports, what it builds, for whom, with which people, budget and KPIs.",
    where: "Value stream and ART identification",
    sections: [
      { key: "operational", title: "Operational value stream supported", kind: "chevrons", chevrons: "operational", span: 12, tone: "teal" },
      { key: "statement", title: "Value proposition", kind: "statement", labels: STATEMENT, span: 3, rows: 3, tone: "light" },
      { key: "solutions", title: "Solutions", kind: "list", span: 3, prompt: "Systems, products, services developed" },
      { key: "context", title: "Solution context", kind: "text", span: 3, prompt: "Context in which the solution will operate for each customer segment" },
      { key: "people", title: "People and locations", kind: "list", span: 3, prompt: "Estimated number of people, by geography" },
      { key: "segments", title: "Customer segments", kind: "list", span: 3 },
      { key: "channels", title: "Channels", kind: "list", span: 3, prompt: "Paths used to reach each customer segment" },
      { key: "relationships", title: "Customer relationships", kind: "text", span: 3 },
      { key: "budget", title: "Budget", kind: "text", span: 3, prompt: "People and resources allocated, OpEx and CapEx" },
      { key: "kpis", title: "KPIs / revenue", kind: "list", span: 3 },
      { key: "economics", title: "Economic framework", kind: "text", span: 3, prompt: "Decision rules that align everyone to the solution's financial objectives" },
      { key: "arts", title: "ARTs and suppliers", kind: "list", span: 6, group: "For Solution Trains", prompt: "ARTs and suppliers with their responsibilities" },
      { key: "roles", title: "Value stream roles", kind: "pairs", labels: ["Solution Train Engineer", "Solution Management", "Solution Architect"], span: 6, group: "For Solution Trains" },
    ],
  },
  {
    id: "art-canvas",
    name: "Agile Release Train canvas",
    blurb: "One train: its value statement, business owners, customers, roles, team design, solution and the value streams it serves.",
    where: "Value stream and ART identification · ART launch",
    sections: [
      { key: "statement", title: "Value statement", kind: "statement", labels: STATEMENT, span: 4, rows: 3, tone: "light" },
      { key: "owners", title: "Business owners", kind: "list", span: 3 },
      { key: "people", title: "People and locations", kind: "list", span: 5, prompt: "Number of practitioners and geographic locations" },
      { key: "customers", title: "Key customers", kind: "list", span: 3 },
      { key: "roles", title: "Principal roles", kind: "pairs", labels: ["Product Manager", "RTE", "System Architect"], span: 5 },
      { key: "success", title: "Success measures", kind: "list", span: 3 },
      { key: "teams", title: "Team design strategy", kind: "text", span: 5, prompt: "Outline of teams, their topologies and responsibilities" },
      { key: "solution", title: "Solution", kind: "list", span: 4, prompt: "Systems, products, services developed and maintained by the ART" },
      { key: "assets", title: "Technical assets", kind: "list", span: 3, prompt: "Development tools and environment" },
      { key: "stakeholders", title: "Other stakeholders", kind: "list", span: 5 },
      { key: "development", title: "Development value stream", kind: "chevrons", chevrons: "development", span: 12, tone: "teal" },
      { key: "operational", title: "Operational value stream supported", kind: "chevrons", chevrons: "operational", span: 12, tone: "teal" },
    ],
  },
  {
    id: "art-launch",
    name: "ART launch timeline and PI planning readiness",
    blurb: "Weeks to the date-certain quick-start: backlog workshops, cadence, team composition, leadership commitments, and a readiness checklist.",
    where: "ART launch · first PI planning",
    sections: [
      { key: "timeline", title: "Launch timeline", kind: "timeline", span: 12, tone: "dark" },
      { key: "readiness", title: "PI planning readiness", kind: "checklist", span: 12, tone: "teal" },
    ],
  },
  {
    id: "epic-hypothesis",
    name: "Epic hypothesis statement",
    blurb: "The epic's elevator pitch, the business outcomes it should produce, the leading indicators that predict them, and its NFRs.",
    where: "Portfolio Kanban · funnel and reviewing",
    sections: [
      { key: "header", title: "Epic", kind: "pairs", labels: ["Funnel entry date", "Epic name", "Epic owner"], span: 12, tone: "dark" },
      { key: "statement", title: "Epic description", kind: "statement", labels: STATEMENT, span: 6, rows: 3, tone: "light", prompt: "An elevator pitch that describes the epic clearly and concisely." },
      { key: "outcomes", title: "Business outcomes", kind: "list", span: 6, prompt: "The measurable benefits the business can expect if the hypothesis is proven correct." },
      { key: "indicators", title: "Leading indicators", kind: "list", span: 6, prompt: "Early measures that help predict the business outcomes." },
      { key: "nfrs", title: "Nonfunctional requirements", kind: "list", span: 6 },
    ],
  },
  {
    id: "lean-business-case",
    name: "Lean business case",
    blurb: "The epic owner's case for a go or no-go: outcomes, scope, MVP, costs and returns, development strategy.",
    where: "Portfolio Kanban · analyzing",
    sections: [
      { key: "header", title: "Epic", kind: "pairs", labels: ["Funnel entry date", "Epic owner", "Key stakeholders"], span: 12, tone: "dark" },
      { key: "description", title: "Epic description", kind: "text", span: 12, prompt: "Start from the epic hypothesis statement." },
      { key: "outcome", title: "Business outcome hypothesis", kind: "text", span: 6, prompt: "How success is measured, e.g. 50% increase in shoppers under 25." },
      { key: "indicators", title: "Leading indicators", kind: "list", span: 6, prompt: "Innovation accounting metrics that show early whether the hypothesis holds." },
      { key: "inScope", title: "In scope", kind: "list", span: 4 },
      { key: "outScope", title: "Out of scope", kind: "list", span: 4 },
      { key: "nfrs", title: "Nonfunctional requirements", kind: "list", span: 4 },
      { key: "mvp", title: "Minimum viable product (MVP) features", kind: "list", span: 6, tone: "green" },
      { key: "additional", title: "Additional potential features", kind: "list", span: 6 },
      { key: "summary", title: "Analysis summary", kind: "text", span: 8 },
      { key: "decision", title: "Go / no-go", kind: "pairs", labels: ["Recommendation"], span: 4, tone: "teal" },
      { key: "solution", title: "Solution analysis", kind: "pairs", labels: ["Customers affected, and how", "Impact on solutions, programs and services", "Impact on sales, distribution, deployment and support"], span: 12, tone: "light" },
      { key: "costs", title: "Forecasted costs", kind: "pairs", labels: ["MVP cost", "Estimated implementation cost"], span: 6, tone: "light" },
      { key: "returns", title: "Forecasted returns", kind: "pairs", labels: ["Type of return"], span: 6, tone: "light" },
      { key: "strategy", title: "Development strategy", kind: "pairs", labels: ["In-house or outsourced development", "Incremental implementation strategy", "Sequencing and dependencies"], span: 12, tone: "light" },
      { key: "support", title: "Additional supporting data", kind: "pairs", labels: ["Attachments", "Other notes and comments"], span: 12, tone: "light" },
    ],
  },
  {
    id: "feature-canvas",
    name: "Feature canvas",
    blurb: "One feature: the problem, the benefit hypothesis, objectives, acceptance criteria and its WSJF.",
    where: "ART backlog · refinement and PI planning prep",
    sections: [
      { key: "header", title: "Feature", kind: "pairs", labels: ["Feature name", "Source epic"], span: 12, tone: "dark" },
      { key: "problem", title: "Problem statement", kind: "text", span: 6, prompt: "What is going wrong today, and the 'How might we…' question." },
      { key: "objectives", title: "Objectives", kind: "list", span: 6, prompt: "What success looks like, with measurable targets." },
      { key: "hypothesis", title: "Benefit hypothesis", kind: "text", span: 6, prompt: "We believe… if… (justifies the development cost)." },
      { key: "wsjf", title: "Cost of delay ÷ size = WSJF", kind: "wsjf", labels: ["User / business value", "Time criticality", "Risk reduction / opportunity enablement", "Job size"], span: 6, tone: "teal" },
      { key: "valueNotes", title: "User / business value", kind: "list", span: 4 },
      { key: "timeNotes", title: "Time criticality", kind: "list", span: 4 },
      { key: "riskNotes", title: "Risk reduction / opportunity enablement", kind: "list", span: 4 },
      { key: "acceptance", title: "Acceptance criteria", kind: "list", span: 8, prompt: "Functional and nonfunctional; usually written in ART backlog refinement. The feature fits in one PI." },
      { key: "nfrs", title: "Nonfunctional requirements", kind: "list", span: 4 },
    ],
  },
  {
    id: "enabler-canvas",
    name: "Enabler canvas",
    blurb: "An enabler that extends the architectural runway: exploration, architecture, infrastructure or compliance, and the features it unlocks.",
    where: "ART backlog · architectural runway",
    sections: [
      { key: "header", title: "Enabler", kind: "pairs", labels: ["Enabler name", "Type (exploration, architecture, infrastructure, compliance)", "Source epic"], span: 12, tone: "dark" },
      { key: "description", title: "What it builds", kind: "text", span: 6, prompt: "e.g. A single sign-on mechanism will enable sign-on in multiple applications." },
      { key: "enables", title: "Features it enables", kind: "list", span: 6, tone: "green", prompt: "Implemented now… to support future functionality." },
      { key: "acceptance", title: "Acceptance criteria", kind: "list", span: 6 },
      { key: "runway", title: "Runway and capacity", kind: "pairs", labels: ["Capacity allocation for enablers this PI", "Runway consumed by", "Runway expires or needs upkeep"], span: 6, tone: "light" },
      { key: "wsjf", title: "Cost of delay ÷ size = WSJF", kind: "wsjf", labels: ["User / business value", "Time criticality", "Risk reduction / opportunity enablement", "Job size"], span: 12, tone: "teal" },
    ],
  },
];

export const canvasType = (id: string) => CANVAS_TYPES.find((t) => t.id === id);

/** Cost of delay (value + time criticality + risk reduction / opportunity enablement) and WSJF = CoD ÷ job size. */
export function wsjfOf(v: Record<string, string> | undefined): { cod: number; size: number; wsjf: number | null } {
  const n = (k: string) => Math.max(0, Number(v?.[k] ?? 0) || 0);
  const cod = n("User / business value") + n("Time criticality") + n("Risk reduction / opportunity enablement");
  const size = n("Job size");
  return { cod, size, wsjf: size ? Math.round((cod / size) * 10) / 10 : null };
}

// ---- the stored document -----------------------------------------------------------------

export interface TableRow {
  id: string;
  cells: Record<string, string>;
}
export interface Pair {
  label: string;
  text: string;
}
export interface TimelineLane {
  id: string;
  name: string;
  items: { id: string; week: number; label: string; kind: "bar" | "milestone" }[];
}
export interface Timeline {
  /** ISO date of the first week. */
  start: string;
  weeks: number;
  /** The date-certain quick-start (PI planning), as a week index. */
  dateCertainWeek: number;
  dateCertainLabel: string;
  lanes: TimelineLane[];
}
export interface CheckItem {
  id: string;
  text: string;
  done: boolean;
  /** Which lane of the timeline the item belongs to, if any. */
  laneId?: string;
  /** SAFe's ART readiness checklist splits needed items from desirable ones; needed drive the verdict. */
  tier?: "needed" | "desirable";
  /** The consideration behind the item: the question to answer before ticking it. */
  question?: string;
}

export type SectionValue = string | string[] | Record<string, string> | Pair[] | TableRow[] | Timeline | CheckItem[];

export interface Canvas {
  id: string;
  type: CanvasTypeId;
  title: string;
  /** Current or future state, for canvases SAFe draws twice (the portfolio canvas). */
  state?: "current" | "future";
  /** What it was prefilled from or belongs to. */
  links?: { identificationId?: string; devStreamId?: string; artId?: string; sourceCanvasIds?: string[] };
  fields: Record<string, SectionValue>;
  updatedAt: string;
}

const rid = (p: string, i: number) => `${p}-${i + 1}`;

/** A new canvas of a type, with every section empty but shaped right. */
export function emptyCanvas(type: CanvasTypeId, id: string, title: string, now: string): Canvas {
  const def = canvasType(type)!;
  const fields: Record<string, SectionValue> = {};
  for (const s of def.sections) {
    if (s.kind === "statement") fields[s.key] = Object.fromEntries((s.labels ?? []).map((l) => [l, ""]));
    else if (s.kind === "text") fields[s.key] = "";
    else if (s.kind === "list") fields[s.key] = [];
    else if (s.kind === "pairs") fields[s.key] = (s.labels ?? []).map((label) => ({ label, text: "" }));
    else if (s.kind === "table") fields[s.key] = [];
    else if (s.kind === "timeline") fields[s.key] = { start: now.slice(0, 10), weeks: 10, dateCertainWeek: 10, dateCertainLabel: "Quick-start", lanes: [] };
    else if (s.kind === "checklist") fields[s.key] = [];
    else if (s.kind === "wsjf") fields[s.key] = Object.fromEntries((s.labels ?? []).map((l) => [l, ""]));
  }
  return { id, type, title, ...(type === "portfolio-canvas" ? { state: "current" as const } : {}), fields, updatedAt: now };
}

// ---- prefill from a value stream identification ------------------------------------------

/** The steps a development value stream supports in the operational value stream. */
export function supportedSteps(vsi: ValueStreamIdentification, systemIds: string[]): string[] {
  const ids = new Set(vsi.systems.filter((s) => systemIds.includes(s.id)).flatMap((s) => s.stepIds));
  return vsi.steps.filter((s) => ids.has(s.id)).map((s) => s.name);
}

export function dvsCanvasFrom(vsi: ValueStreamIdentification, devStreamId: string, id: string, now: string): Canvas {
  const d = vsi.devStreams.find((x) => x.id === devStreamId);
  if (!d) throw new Error(`No development value stream ${devStreamId}`);
  const c = emptyCanvas("dvs-canvas", id, `Development value stream canvas: ${d.name}`, now);
  c.links = { identificationId: vsi.id, devStreamId };
  const groups = vsi.groups.filter((g) => g.systemIds.some((x) => d.systemIds.includes(x)));
  c.fields.solutions = vsi.systems.filter((s) => d.systemIds.includes(s.id)).map((s) => (s.note ? `${s.name}: ${s.note}` : s.name));
  c.fields.people = groups.map((g) => `${g.people} · ${g.locations}`);
  c.fields.arts = vsi.arts.filter((a) => a.devStreamId === devStreamId || a.systemIds.some((x) => d.systemIds.includes(x))).map((a) => `${a.name} (${a.people} people): ${vsi.systems.filter((s) => a.systemIds.includes(s.id)).map((s) => s.name).join(", ")}`);
  c.fields.statement = { ...(c.fields.statement as Record<string, string>), For: vsi.value ? `Customers who need ${vsi.value.toLowerCase()}` : "", The: d.name };
  return c;
}

export function artCanvasFrom(vsi: ValueStreamIdentification, artId: string, id: string, now: string): Canvas {
  const a = vsi.arts.find((x) => x.id === artId);
  if (!a) throw new Error(`No ART ${artId}`);
  const c = emptyCanvas("art-canvas", id, `ART canvas: ${a.name}`, now);
  c.links = { identificationId: vsi.id, artId, ...(a.devStreamId ? { devStreamId: a.devStreamId } : {}) };
  c.fields.people = [`${a.people} practitioners`, ...a.locations.split("·").map((s) => s.trim()).filter(Boolean)];
  c.fields.solution = vsi.systems.filter((s) => a.systemIds.includes(s.id)).map((s) => (s.note ? `${s.name}: ${s.note}` : s.name));
  c.fields.statement = { ...(c.fields.statement as Record<string, string>), The: `${a.name} ART` };
  return c;
}

/** Chevrons for a canvas: the operational steps it supports, or its development stream's steps. */
export function canvasChevrons(c: Canvas, vsi: ValueStreamIdentification | undefined, which: "operational" | "development"): string[] {
  if (!vsi) return [];
  if (which === "operational") {
    if (c.links?.artId) {
      const a = vsi.arts.find((x) => x.id === c.links!.artId);
      return a ? supportedSteps(vsi, a.systemIds) : [];
    }
    const d = vsi.devStreams.find((x) => x.id === c.links?.devStreamId);
    return d ? supportedSteps(vsi, d.systemIds) : vsi.steps.map((s) => s.name);
  }
  // Development steps are not modelled per stream; use the trains of the stream in order.
  const d = vsi.devStreams.find((x) => x.id === c.links?.devStreamId);
  return d ? vsi.arts.filter((a) => a.devStreamId === d.id).map((a) => a.name) : [];
}

// ---- SWOT → TOWS → future state -------------------------------------------------------

const list = (v: SectionValue | undefined): string[] => (Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === "string" && x.trim() !== "") : []);

export interface TowsSuggestion {
  quadrant: "so" | "st" | "wo" | "wt";
  text: string;
  from: [string, string];
}

/** Candidate strategies from every internal × external pairing, for people (or the assistant) to choose and rewrite. */
export function towsSuggestions(swot: Canvas, perQuadrant = 6): TowsSuggestion[] {
  const S = list(swot.fields.strengths);
  const W = list(swot.fields.weaknesses);
  const O = list(swot.fields.opportunities);
  const T = list(swot.fields.threats);
  const pair = (q: TowsSuggestion["quadrant"], A: string[], B: string[], text: (a: string, b: string) => string) => {
    const out: TowsSuggestion[] = [];
    for (const a of A) for (const b of B) if (out.length < perQuadrant) out.push({ quadrant: q, text: text(a, b), from: [a, b] });
    return out;
  };
  const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  return [
    ...pair("so", S, O, (s, o) => `Use ${lc(s)} to capture ${lc(o)}`),
    ...pair("st", S, T, (s, t) => `Use ${lc(s)} to counter ${lc(t)}`),
    ...pair("wo", W, O, (w, o) => `Fix ${lc(w)} by taking ${lc(o)}`),
    ...pair("wt", W, T, (w, t) => `Reduce ${lc(w)} to limit exposure to ${lc(t)}`),
  ];
}

/**
 * The future state: a copy of the current portfolio canvas whose planned changes are the chosen
 * TOWS strategies, and a portfolio vision draft whose themes are the offensive strategies
 * (SO, then WO) and whose key changes are all of them.
 */
export function futureStateFrom(current: Canvas, tows: Canvas, ids: { canvas: string; vision: string }, now: string): { canvas: Canvas; vision: Canvas } {
  const so = list(tows.fields.so);
  const wo = list(tows.fields.wo);
  const st = list(tows.fields.st);
  const wt = list(tows.fields.wt);
  const all = [...so, ...wo, ...st, ...wt];
  const canvas: Canvas = {
    ...structuredClone(current),
    id: ids.canvas,
    title: current.title.replace(/\s*\((current|future) state\)$/i, "") + " (future state)",
    state: "future",
    links: { ...(current.links ?? {}), sourceCanvasIds: [current.id, tows.id] },
    fields: { ...structuredClone(current.fields), changes: [...list(current.fields.changes), ...all] },
    updatedAt: now,
  };
  const vision = emptyCanvas("portfolio-vision", ids.vision, current.title.replace(/\s*\((current|future) state\)$/i, "") + ": portfolio vision", now);
  vision.links = { sourceCanvasIds: [current.id, tows.id] };
  vision.fields.themes = [...so, ...wo].slice(0, 5);
  vision.fields.changes = all;
  const rows = (current.fields.valueProps as TableRow[] | undefined) ?? [];
  vision.fields.statement = {
    ...(vision.fields.statement as Record<string, string>),
    For: rows.map((r) => r.cells["Customer segments"]).filter(Boolean).join("; "),
    "Our solution": rows.map((r) => r.cells["Solutions"]).filter(Boolean).join("; "),
  };
  return { canvas, vision };
}

// ---- launch readiness ---------------------------------------------------------------------

export interface LaunchReadiness {
  done: number;
  total: number;
  /** 0–1: the share of needed items done (every item counts as needed when none is tiered). */
  share: number;
  needed: { done: number; total: number };
  desirable: { done: number; total: number };
  /** Weeks from `today` to the date-certain quick-start; negative once past. */
  weeksLeft: number | null;
  /** Lanes with open checklist items, most open first. */
  openByLane: { laneId: string | undefined; name: string; open: number }[];
  verdict: "ready" | "on-track" | "at-risk";
}

export function launchReadiness(c: Canvas, today: string): LaunchReadiness {
  const items = (c.fields.readiness as CheckItem[] | undefined) ?? [];
  const tl = c.fields.timeline as Timeline | undefined;
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const count = (xs: CheckItem[]) => ({ done: xs.filter((i) => i.done).length, total: xs.length });
  const desirable = count(items.filter((i) => i.tier === "desirable"));
  const needed = count(items.filter((i) => i.tier !== "desirable"));
  const share = needed.total ? needed.done / needed.total : 0;
  let weeksLeft: number | null = null;
  if (tl?.start) {
    const certain = new Date(`${tl.start}T00:00:00Z`).getTime() + tl.dateCertainWeek * 7 * 86_400_000;
    weeksLeft = Math.round(((certain - new Date(`${today.slice(0, 10)}T00:00:00Z`).getTime()) / (7 * 86_400_000)) * 10) / 10;
  }
  const lanes = new Map<string | undefined, { name: string; open: number }>();
  for (const i of items.filter((x) => !x.done)) {
    const name = tl?.lanes.find((l) => l.id === i.laneId)?.name ?? "General";
    const cur = lanes.get(i.laneId) ?? { name, open: 0 };
    cur.open++;
    lanes.set(i.laneId, cur);
  }
  // Expect readiness to climb linearly to 100% by the date-certain week.
  const expected = tl && weeksLeft !== null ? Math.max(0, Math.min(1, 1 - weeksLeft / Math.max(1, tl.dateCertainWeek))) : 0;
  const verdict = share >= 1 ? "ready" : share + 0.1 >= expected ? "on-track" : "at-risk";
  return { done, total, share, needed, desirable, weeksLeft, openByLane: [...lanes.entries()].map(([laneId, v]) => ({ laneId, ...v })).sort((a, b) => b.open - a.open), verdict };
}

// ---- starting content -----------------------------------------------------------------

/** SAFe's LACE mission statement example, and an ART launch timeline shaped like SAFe's. */
export function demoCanvases(vsi: ValueStreamIdentification | undefined, now = "2026-01-01T00:00:00.000Z"): Canvas[] {
  const lace = emptyCanvas("lace-mission", "canvas-lace", "LACE mission statement (example)", now);
  lace.fields.statement = {
    For: "EMV Productions, Inc.",
    Who: "Produces automated guided vehicles and amusement park rides",
    The: "EMV Lean-Agile Center of Excellence",
    "Is a": "Full-time, cross-functional, Lean-Agile change management team",
    That: "Is driving the transformation of our enterprise to a Lean-Agile way of working using SAFe",
    Unlike: "Our traditional ad-hoc transformation efforts",
    We: "Provide practitioners and the committed leadership the training, process, technology, tooling, culture and governance changes needed to achieve the business benefits of a Lean-Agile way of working",
  };
  lace.fields.inScope = ["Communication", "Leadership and team training and coaching", "ART launches and coaching", "Agile tooling", "Consultant and supplier coaching and training management"];
  lace.fields.outScope = ["Organizational structure changes", "Outsourcing strategy changes"];
  lace.fields.success = [
    { label: "Adoption", text: "% trained, number of ARTs launched" },
    { label: "Assessment", text: "Business agility assessments" },
    { label: "Outcome", text: "% improvement in predictability, % decrease in time-to-market, % increase in customer satisfaction, % improvement in employee engagement" },
  ];

  const launch = emptyCanvas("art-launch", "canvas-launch", "ART launch: first PI planning", now);
  const lanes: TimelineLane[] = [
    { id: "content", name: "Content: product management aligned", items: [
      { id: "w1", week: 1, label: "Backlog workshop", kind: "bar" }, { id: "w3", week: 3, label: "Backlog workshop", kind: "bar" },
      { id: "w5", week: 5, label: "Backlog workshop", kind: "bar" }, { id: "w6", week: 6, label: "PO and architect backlogs", kind: "bar" },
      { id: "w7", week: 7, label: "Dry run with teams", kind: "bar" }, { id: "w8", week: 8, label: "ART backlog ready", kind: "milestone" },
    ] },
    { id: "cadence", name: "Cadence defined and socialized", items: [{ id: "c1", week: 2, label: "PI and iteration calendar published", kind: "milestone" }] },
    { id: "teams", name: "Agile teams, system team and ART roles", items: [{ id: "t1", week: 3, label: "Agile team composition", kind: "bar" }, { id: "t2", week: 5, label: "System team composition", kind: "bar" }, { id: "t3", week: 6, label: "ART roles named", kind: "milestone" }] },
    { id: "leadership", name: "VP discussion: current commitments and flexibility", items: [{ id: "l1", week: 4, label: "Commitments reviewed", kind: "milestone" }] },
  ];
  // Three weeks into the launch, on a Monday, so the example reads as a launch in progress.
  const day = new Date(now.slice(0, 10) + "T00:00:00Z");
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7) - 21);
  launch.fields.timeline = { start: day.toISOString().slice(0, 10), weeks: 10, dateCertainWeek: 9, dateCertainLabel: "Quick-start", lanes };
  // SAFe's ART readiness checklist: the needed items and the desirable ones, each with the
  // consideration behind it, placed on the launch lane that prepares it.
  const N = "needed", D = "desirable";
  launch.fields.readiness = ([
    ["Planning scope and context", "Is the scope (product, system, technology domains) of the planning process understood? Have we identified our value stream(s) and Agile Release Train(s)?", N, "content", true],
    ["Release Train Engineer", "Have we identified the Release Train Engineer? Do they understand the scope of the role in preparing the organization and preparing for the PI Planning event?", N, "teams", true],
    ["Planning timeframe, iteration and PI cadence", "Have we identified the PI Planning dates, the iteration cadence, and the PI cadence?", N, "cadence", true],
    ["Agile Teams (SM/TCs, POs)", "Does each team have an identified Scrum Master/Team Coach and Product Owner?", N, "teams", false],
    ["Team makeup/commitment", "Have we identified cross-functional Agile Teams? Are there dedicated team members on every team?", N, "teams", false],
    ["Agile Team attendance", "Are all team members attending PI Planning, whether in person or involved remotely?", N, "teams", false],
    ["Executive, Business Owner", "Do we know who will set and present the business context and strategy? Do we know who will assign business value and accept the plans?", N, "leadership", true],
    ["Business alignment", "Is there reasonable agreement on priorities amongst the Business Owners and Product Management?", N, "content", false],
    ["Architecture vision and development practices", "Do we know who will present the architecture vision and required development practices?", N, "content", true],
    ["System Team", "Has the system team been identified and formed?", D, "teams", false],
    ["Shared Services", "Have the shared services (User Experience, Architecture, etc.) been identified?", D, "teams", false],
    ["Other Attendees", "Do we know what other key business and technology stakeholders should attend?", D, "leadership", true],
    ["Agile Lifecycle Management (ALM) tooling", "Do we know how and where iterations, PIs, features, stories, measures, etc., will be maintained?", D, undefined, true],
    ["Development infrastructure", "Do we have a strategy for using and improving the Continuous Delivery Pipeline?", D, undefined, false],
    ["Quality practices", "Is there a strategy for applying built-in quality practices?", D, undefined, false],
  ] as [string, string, "needed" | "desirable", string | undefined, boolean][]).map(([text, question, tier, laneId, done], i) => ({ id: rid("r", i), text, question, tier, done, ...(laneId ? { laneId } : {}) }));

  const out = [lace, launch];
  if (vsi) {
    const dvs = vsi.devStreams[0];
    if (dvs) out.push(dvsCanvasFrom(vsi, dvs.id, "canvas-dvs-1", now));
    const art = vsi.arts.find((a) => a.devStreamId === dvs?.id) ?? vsi.arts[0];
    if (art) out.push(artCanvasFrom(vsi, art.id, "canvas-art-1", now));
  }
  const feature = emptyCanvas("feature-canvas", "canvas-feature-mfa", "Feature canvas: multi-factor authentication", now);
  feature.fields.header = [{ label: "Feature name", text: "Multi-factor authentication" }, { label: "Source epic", text: "" }];
  feature.fields.hypothesis = "Enhance user security via both password and a device.";
  feature.fields.acceptance = ["USB tokens as a first layer", "Password authentication second layer", "Multiple tokens on a single device", "User activity log reflecting both authentication factors"];
  out.push(feature);
  const enabler = emptyCanvas("enabler-canvas", "canvas-enabler-sso", "Enabler canvas: single sign-on", now);
  enabler.fields.header = [{ label: "Enabler name", text: "Single sign-on" }, { label: "Type (exploration, architecture, infrastructure, compliance)", text: "Architecture" }, { label: "Source epic", text: "" }];
  enabler.fields.description = "A single sign-on mechanism will enable sign-on in multiple applications.";
  out.push(enabler);
  out.push(emptyCanvas("portfolio-canvas", "canvas-portfolio", "Portfolio canvas", now));
  out.push(emptyCanvas("swot", "canvas-swot", "Portfolio SWOT", now));
  return out;
}
