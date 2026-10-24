// Value streams, in the two forms SAFe uses them:
//
//   Identification (a workshop): the operational value stream (trigger → steps → value), the
//   systems that support each step, the people who build and run those systems and where
//   they sit, the development value streams that emerge, and the Agile Release Trains cut
//   from them (50–125 people each).
//
//   Mapping (a measurement): the steps work goes through from request to customers, each with
//   its active (process) time, the wait in front of it and its percent complete and accurate,
//   for a current and a future state. From those: total active and wait time, lead time,
//   flow efficiency, rolled %C&A, and the queue to attack first.

export type Actor = "customer" | "staff";

export interface OperationalStep {
  id: string;
  name: string;
  actor: Actor;
  /** Who performs the step on the operational side ("Marketing, Sales", "Loan agents"); shown above the chevron. */
  people?: string;
}

/**
 * The kinds of operational value stream SAFe distinguishes. Four come built in; a workspace
 * adds its own. Each carries the example that seeds a new identification.
 */
export interface OvsType {
  id: string;
  name: string;
  blurb: string;
  /** The development value stream pattern that usually realises it. */
  pattern: string;
  example: {
    name: string;
    description: string;
    customers: string;
    trigger: string;
    valueToEnterprise: string;
    valueToCustomer: string;
    steps: { name: string; actor: Actor; people?: string }[];
    /** Systems (or, for manufacturing, the specifications solution intent holds) and the steps they support, by step name. */
    systems?: { name: string; note?: string; steps: string[] }[];
    /** The development value streams of the pattern and the systems each builds, by system name. */
    devStreams?: { name: string; note?: string; systems: string[] }[];
  };
  builtin?: boolean;
}

export const OVS_TYPES: OvsType[] = [
  {
    id: "fulfilment",
    name: "Fulfilment",
    blurb: "A customer asks for a product or service and the enterprise delivers it: a loan, an insurance claim, an e-commerce order, a patient episode.",
    pattern: "One or a few development value streams build the systems the steps run on (channels, origination, scoring, core processing); each becomes an ART or a Solution Train.",
    builtin: true,
    example: {
      name: "Consumer loans",
      description: "Provides customers with unsecured or secured loans",
      customers: "Existing retail customers",
      trigger: "The customer wants to borrow money and approaches the bank through any existing channel",
      valueToEnterprise: "Repayment plus interest",
      valueToCustomer: "Loan",
      steps: [
        { name: "Attract customer", actor: "staff", people: "Marketing, Sales" },
        { name: "Quick rate quote", actor: "staff", people: "Loan agents" },
        { name: "Complete loan application", actor: "customer" },
        { name: "Eligibility decision and underwriting", actor: "staff", people: "Underwriters" },
        { name: "Extend loan terms", actor: "staff", people: "Loan agents" },
        { name: "Award loan", actor: "staff", people: "Loan agents" },
        { name: "Set up payment terms", actor: "staff", people: "Servicing" },
        { name: "Repay money", actor: "customer" },
        { name: "Close loan", actor: "staff", people: "Servicing" },
      ],
      systems: [
        { name: "Channels", note: "web, mobile, branch", steps: ["Attract customer"] },
        { name: "Loan origination system", note: "quotes and applications", steps: ["Quick rate quote", "Complete loan application"] },
        { name: "Credit scoring system", note: "eligibility and risk", steps: ["Eligibility decision and underwriting"] },
        { name: "Core banking", note: "terms, award, payments, closure", steps: ["Extend loan terms", "Award loan", "Set up payment terms", "Repay money", "Close loan"] },
      ],
      devStreams: [
        { name: "Acquisition and origination", note: "Builds the channels, origination and scoring the loan is sold and decided on", systems: ["Channels", "Loan origination system", "Credit scoring system"] },
        { name: "Servicing on core banking", note: "Builds the core banking the loan is run on", systems: ["Core banking"] },
      ],
    },
  },
  {
    id: "manufacturing",
    name: "Manufacturing",
    blurb: "Raw materials and components become a physical product: a vehicle, a device, a consumable.",
    pattern: "Development value streams produce the specifications the plant builds to (bills of material, design, test and validation, packaging) and the tools designers need (design platform, digital twin); solution intent holds the fixed and variable parts.",
    builtin: true,
    example: {
      name: "Vehicle",
      description: "Builds and ships vehicles to order",
      customers: "Dealers and fleet buyers",
      trigger: "Order received",
      valueToEnterprise: "Revenue per vehicle",
      valueToCustomer: "Vehicle",
      steps: [
        { name: "Procure materials", actor: "staff", people: "Purchasing" },
        { name: "Manage inventory", actor: "staff", people: "Logistics" },
        { name: "Manufacture subassemblies", actor: "staff", people: "Plant" },
        { name: "Assemble final product", actor: "staff", people: "Plant" },
        { name: "Validate product", actor: "staff", people: "Quality" },
        { name: "Package and ship", actor: "staff", people: "Logistics" },
      ],
      // In manufacturing the development value stream's output is the solution intent: the
      // specifications each operational step builds to, its fixed and variable parts, and the digital twin.
      systems: [
        { name: "Bills of material", note: "solution intent", steps: ["Procure materials", "Manage inventory"] },
        { name: "Design specifications", note: "solution intent", steps: ["Manufacture subassemblies"] },
        { name: "Manufacturing specifications", note: "solution intent", steps: ["Assemble final product"] },
        { name: "Test and validation specifications", note: "solution intent", steps: ["Validate product"] },
        { name: "Packaging and shipping specifications", note: "solution intent", steps: ["Package and ship"] },
        { name: "Digital twin", note: "simulates and validates the vehicle", steps: ["Validate product"] },
        { name: "Design tools platform", note: "design, simulation and validation tools", steps: [] },
      ],
      devStreams: [
        { name: "Vehicle development", note: "Develops the specific manufacturing and validation specifications needed for the vehicle", systems: ["Bills of material", "Design specifications", "Manufacturing specifications", "Test and validation specifications", "Packaging and shipping specifications", "Digital twin"] },
        { name: "Design tools platform", note: "Builds the tools that the vehicle designers need to design, simulate and validate the vehicle", systems: ["Design tools platform"] },
      ],
    },
  },
  {
    id: "software-product",
    name: "Software product",
    blurb: "The enterprise sells and operates a software product: SaaS, mobile or desktop, from contract to renewal.",
    pattern: "One development value stream develops the software solution itself; provisioning, help desk, CRM and the customer portal support the operational steps around it.",
    builtin: true,
    example: {
      name: "SaaS product",
      description: "Sells, provisions and supports a subscription software product",
      customers: "Business customers",
      trigger: "Order received",
      valueToEnterprise: "Subscription revenue and renewals",
      valueToCustomer: "SaaS, mobile and desktop software products",
      steps: [
        { name: "Sales cycle", actor: "staff", people: "Sales" },
        { name: "Contracts and licensing", actor: "staff", people: "Legal, Sales" },
        { name: "Provisioning", actor: "staff", people: "Operations" },
        { name: "Customer care", actor: "staff", people: "Support" },
        { name: "Renewals", actor: "staff", people: "Account management" },
      ],
      systems: [
        { name: "Customer portal", steps: ["Sales cycle", "Provisioning", "Customer care", "Renewals"] },
        { name: "CRM", steps: ["Sales cycle", "Contracts and licensing", "Renewals"] },
        { name: "Provisioning", note: "system", steps: ["Provisioning"] },
        { name: "Help desk", steps: ["Customer care"] },
        { name: "Software product", note: "SaaS, mobile, desktop", steps: [] },
      ],
      devStreams: [
        { name: "Customer portal", note: "Builds the portal customers buy, provision and get help through", systems: ["Customer portal"] },
        { name: "Business systems", note: "Builds CRM, provisioning and the help desk the operational steps run on", systems: ["CRM", "Provisioning", "Help desk"] },
        { name: "Software product", note: "Develops the software solution itself", systems: ["Software product"] },
      ],
    },
  },
  {
    id: "supporting",
    name: "Supporting",
    blurb: "Internal value streams the enterprise runs for itself: onboarding personnel, procuring operational supplies, preparing and auditing financials.",
    pattern: "A single development value stream supports a shared system (an ERP) used by several supporting value streams across the enterprise: procurement of operational supplies, onboarding and supporting personnel, preparing and auditing financials.",
    builtin: true,
    example: {
      name: "Personnel onboarding",
      description: "Brings a new hire from talent need to productive, onboarded staff",
      customers: "Hiring managers and new hires",
      trigger: "Talent need",
      valueToEnterprise: "Onboarded staff",
      valueToCustomer: "A productive start in the role",
      steps: [
        { name: "Post job", actor: "staff", people: "Recruiting" },
        { name: "Review resumes", actor: "staff", people: "Recruiting, hiring manager" },
        { name: "Interview", actor: "staff", people: "Hiring team" },
        { name: "Hire employee", actor: "staff", people: "HR" },
        { name: "Train new hire", actor: "staff", people: "Manager, L&D" },
        { name: "Offboard", actor: "staff", people: "HR, IT" },
      ],
      systems: [
        { name: "ERP system", note: "also runs procurement of operational supplies and preparing and auditing financials", steps: ["Post job", "Hire employee", "Train new hire", "Offboard"] },
        { name: "Applicant tracking", steps: ["Post job", "Review resumes", "Interview"] },
      ],
      devStreams: [
        { name: "ERP", note: "A single development value stream that supports the ERP system used throughout the enterprise", systems: ["ERP system"] },
        { name: "Talent systems", note: "Builds the applicant tracking the hiring steps run on", systems: ["Applicant tracking"] },
      ],
    },
  },
];

/** The identification workshop, step by step; the page and the class boards both use it. */
export const VS_WORKSHOP_STEPS: [string, string][] = [
  ["Operational value stream", "Start from the customer: the trigger, the steps they and your staff go through, and the value at the end. Above each step, who performs it."],
  ["Solutions", "Under each step, the solutions (systems) that support it or that the stream provides to customers. A solution spanning several steps means one team of teams owns a long stretch of the stream."],
  ["People who develop and support", "Below the solutions: who builds and runs them, how many, where they sit and what they do. Always by group, never by name."],
  ["Development value streams", "Draw a line around the people and solutions that must change together to deliver a feature; add the people the full business solution needs (legal, marketing, support, operations)."],
  ["ART design", "Apply the topologies to cut each development value stream into trains of 50 to 125 people that can plan and deliver together."],
];

/** SAFe's operational value stream template. */
export const OVS_TEMPLATE_FIELDS = ["Type", "Name", "Description", "Customer(s)", "Triggers", "Value received to enterprise", "Value received to customer"] as const;

/** SAFe's ART topologies, applied when a development value stream is cut into trains. */
export type ArtTopology = "stream-aligned" | "platform" | "complicated-subsystem" | "enabling";
export const ART_TOPOLOGIES: { id: ArtTopology; name: string; blurb: string }[] = [
  { id: "stream-aligned", name: "Stream-aligned ART", blurb: "Aligned to a single value stream or product; releases value on its own. The default." },
  { id: "platform", name: "Platform ART", blurb: "Builds the shared platform the stream-aligned trains consume, offered as a service." },
  { id: "complicated-subsystem", name: "Complicated subsystem ART", blurb: "Owns a part needing deep specialist knowledge the others cannot absorb." },
  { id: "enabling", name: "Enabling ART", blurb: "Helps other trains adopt new practices or technology for a time." },
];

/** Seeds an identification from a type's example. */
export function identificationFromType(type: OvsType, id: string, now: string, name = type.example.name): ValueStreamIdentification {
  let n = 0;
  const steps = type.example.steps.map((st) => ({ id: `step-${++n}`, name: st.name, actor: st.actor, ...(st.people ? { people: st.people } : {}) }));
  const stepId = (nm: string) => steps.find((x) => x.name === nm)?.id;
  const systems = (type.example.systems ?? []).map((sy, i) => ({ id: `sys-${i + 1}`, name: sy.name, ...(sy.note ? { note: sy.note } : {}), stepIds: sy.steps.map(stepId).filter((x): x is string => !!x) }));
  const sysId = (nm: string) => systems.find((x) => x.name === nm)?.id;
  const devStreams = (type.example.devStreams ?? []).map((d, i) => ({ id: `dvs-${i + 1}`, name: d.name, ...(d.note ? { note: d.note } : {}), systemIds: d.systems.map(sysId).filter((x): x is string => !!x) }));
  return {
    id,
    name,
    type: type.id,
    description: type.example.description,
    customers: type.example.customers,
    trigger: type.example.trigger,
    value: type.example.valueToEnterprise,
    valueToEnterprise: type.example.valueToEnterprise,
    valueToCustomer: type.example.valueToCustomer,
    steps,
    systems,
    groups: [],
    devStreams,
    arts: [],
    updatedAt: now,
  };
}

/**
 * Switch an identification to another type's example: its fields, steps, systems and
 * development value streams, keeping the identification's id. People and trains are cleared,
 * since they belonged to the systems being replaced.
 */
export function applyTypeExample(vsi: ValueStreamIdentification, type: OvsType, now: string): ValueStreamIdentification {
  return { ...identificationFromType(type, vsi.id, now), id: vsi.id };
}

/** True when the identification still holds a type's example unchanged (switching loses nothing). */
export function isTypeExample(vsi: ValueStreamIdentification, type: OvsType | undefined): boolean {
  if (!type) return vsi.steps.length === 0 && vsi.systems.length === 0;
  const ex = identificationFromType(type, vsi.id, vsi.updatedAt);
  const sig = (v: ValueStreamIdentification) => JSON.stringify([v.name, v.steps.map((x) => [x.name, x.actor, x.people ?? ""]), v.systems.map((x) => [x.name, x.stepIds.length]), v.devStreams.map((x) => [x.name, x.systemIds.length]), v.groups.length, v.arts.length]);
  return sig(vsi) === sig(ex);
}

export interface SupportingSystem {
  id: string;
  name: string;
  note?: string;
  /** Operational steps this system supports. */
  stepIds: string[];
}

export interface PeopleGroup {
  id: string;
  people: number;
  /** Where they sit, e.g. "Bangalore · Delhi". */
  locations: string;
  /** What they do: development, support, operations, legal, marketing… */
  function?: string;
  /** Systems these people build or run. */
  systemIds: string[];
  /** A development value stream the group belongs to even when it builds no system (legal, marketing, support). */
  devStreamId?: string;
}

export interface DevelopmentValueStream {
  id: string;
  name: string;
  /** What it develops, in a sentence. */
  note?: string;
  systemIds: string[];
}

export interface ArtCandidate {
  id: string;
  name: string;
  people: number;
  locations: string;
  systemIds: string[];
  devStreamId?: string;
  topology?: ArtTopology;
}

export interface ValueStreamIdentification {
  id: string;
  name: string;
  /** Operational value stream type: a built-in id or one the workspace added. */
  type?: string;
  description?: string;
  customers?: string;
  trigger: string;
  /** The value label at the end of the chevrons (the value to the enterprise). */
  value: string;
  valueToEnterprise?: string;
  valueToCustomer?: string;
  steps: OperationalStep[];
  systems: SupportingSystem[];
  groups: PeopleGroup[];
  devStreams: DevelopmentValueStream[];
  arts: ArtCandidate[];
  updatedAt: string;
}

export interface MapMeasure {
  /** Hours (or days) waiting before the step; null for "variable", e.g. the first step. */
  wait: number | null;
  /** Hands-on time in the step. */
  active: number;
  /** Percent complete and accurate, 0–100. */
  ca: number;
}

export interface MapStep {
  id: string;
  name: string;
  current: MapMeasure;
  future: MapMeasure;
  /** The improvement that moves this step from current to future. */
  kaizen?: string;
}

export interface ValueStreamMap {
  id: string;
  name: string;
  /** The identification (and development value stream) this map measures, if any. */
  identificationId?: string;
  devStreamId?: string;
  unit: "hours" | "days";
  trigger: string;
  steps: MapStep[];
  updatedAt: string;
}

export interface MapMetrics {
  totalActive: number;
  totalWait: number;
  leadTime: number;
  /** 0–1 */
  flowEfficiency: number;
  /** 0–1, product of every step's %C&A */
  rolledCA: number;
  bottleneck?: { stepId: string; name: string; wait: number; shareOfLead: number };
  /** Steps sorted by time they take end to end (wait + active), longest first. */
  ranking: { stepId: string; name: string; total: number }[];
}

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

export function mapMetrics(map: Pick<ValueStreamMap, "steps">, state: "current" | "future"): MapMetrics {
  const rows = map.steps.map((s) => ({ s, m: s[state] }));
  const totalActive = rows.reduce((n, r) => n + r.m.active, 0);
  const totalWait = rows.reduce((n, r) => n + (r.m.wait ?? 0), 0);
  const leadTime = totalActive + totalWait;
  const rolledCA = rows.reduce((p, r) => p * Math.max(0, Math.min(100, r.m.ca)) / 100, 1);
  let neck: (typeof rows)[number] | undefined;
  for (const r of rows) if ((r.m.wait ?? 0) > 0 && (!neck || (r.m.wait ?? 0) > (neck.m.wait ?? 0))) neck = r;
  return {
    totalActive: round(totalActive),
    totalWait: round(totalWait),
    leadTime: round(leadTime),
    flowEfficiency: leadTime ? totalActive / leadTime : 0,
    rolledCA: rows.length ? rolledCA : 0,
    ...(neck ? { bottleneck: { stepId: neck.s.id, name: neck.s.name, wait: neck.m.wait ?? 0, shareOfLead: leadTime ? (neck.m.wait ?? 0) / leadTime : 0 } } : {}),
    ranking: rows.map((r) => ({ stepId: r.s.id, name: r.s.name, total: round((r.m.wait ?? 0) + r.m.active) })).sort((a, b) => b.total - a.total),
  };
}

export type ArtFit = "fits" | "split" | "merge";

/** SAFe's guidance: an ART is a team of teams of roughly 50 to 125 people. */
export function artFit(people: number): ArtFit {
  return people > 125 ? "split" : people < 50 ? "merge" : "fits";
}

export interface StepImpact {
  stepId: string;
  systems: SupportingSystem[];
  groups: PeopleGroup[];
  people: number;
  arts: ArtCandidate[];
  verdict: string;
}

/** Who and what a change to one operational step touches. */
export function stepImpact(vsi: ValueStreamIdentification, stepId: string): StepImpact {
  const systems = vsi.systems.filter((s) => s.stepIds.includes(stepId));
  const ids = new Set(systems.map((s) => s.id));
  const groups = vsi.groups.filter((g) => g.systemIds.some((x) => ids.has(x)));
  const arts = vsi.arts.filter((a) => a.systemIds.some((x) => ids.has(x)));
  const people = groups.reduce((n, g) => n + g.people, 0);
  const verdict = !systems.length
    ? "No system supports this step yet."
    : arts.length > 1
      ? `${arts.length} trains must coordinate on this step: plan them together, or re-cut the trains.`
      : arts.length === 1
        ? `Owned by one train, ${arts[0]!.name}: it can change this step on its own.`
        : "No train owns the systems behind this step yet.";
  return { stepId, systems, groups, people, arts, verdict };
}

/** Everyone in a development value stream: the groups behind its systems plus the groups attached to it directly. */
export function devStreamPeople(vsi: ValueStreamIdentification, devStreamId: string): { groups: PeopleGroup[]; people: number } {
  const d = vsi.devStreams.find((x) => x.id === devStreamId);
  if (!d) return { groups: [], people: 0 };
  const groups = vsi.groups.filter((g) => g.devStreamId === d.id || g.systemIds.some((x) => d.systemIds.includes(x)));
  return { groups, people: groups.reduce((n, g) => n + g.people, 0) };
}

export interface IdentificationIssue {
  kind: "orphan-step" | "orphan-system" | "unstaffed-system" | "art-size" | "unowned-system";
  message: string;
  ref: string;
}

/** Gaps a facilitator would point out: steps no system supports, systems no one builds, trains outside 50–125. */
export function identificationIssues(vsi: ValueStreamIdentification): IdentificationIssue[] {
  const out: IdentificationIssue[] = [];
  for (const st of vsi.steps) if (!vsi.systems.some((s) => s.stepIds.includes(st.id))) out.push({ kind: "orphan-step", ref: st.id, message: `"${st.name}" has no supporting system.` });
  for (const s of vsi.systems) {
    if (!s.stepIds.length) out.push({ kind: "orphan-system", ref: s.id, message: `${s.name} supports no step.` });
    if (!vsi.groups.some((g) => g.systemIds.includes(s.id))) out.push({ kind: "unstaffed-system", ref: s.id, message: `No one is listed as building ${s.name}.` });
    if (vsi.arts.length && !vsi.arts.some((a) => a.systemIds.includes(s.id))) out.push({ kind: "unowned-system", ref: s.id, message: `No train owns ${s.name}.` });
  }
  for (const a of vsi.arts) {
    const fit = artFit(a.people);
    if (fit !== "fits") out.push({ kind: "art-size", ref: a.id, message: fit === "split" ? `${a.name} has ${a.people} people: above 125, split it or run a Solution Train.` : `${a.name} has ${a.people} people: below 50, merge it with a neighbour.` });
  }
  return out;
}

// ---- starting content -------------------------------------------------------------------

/** The consumer-loan example used throughout SAFe's value stream identification guidance. */
export function demoIdentification(now = "2026-01-01T00:00:00.000Z"): ValueStreamIdentification {
  const step = (id: string, name: string, actor: Actor): OperationalStep => ({ id, name, actor });
  const who = (st: OperationalStep, people: string): OperationalStep => ({ ...st, people });
  return {
    id: "vsi-consumer-loan",
    name: "Consumer loan",
    type: "fulfilment",
    description: "Provides customers with unsecured or secured loans",
    customers: "Existing retail customers",
    trigger: "Loan need",
    value: "Loan repayment with interest",
    valueToEnterprise: "Repayment plus interest",
    valueToCustomer: "Loan",
    steps: [
      who(step("attract", "Attract customer", "staff"), "Marketing, Sales"),
      who(step("quote", "Quick rate quote", "staff"), "Loan agents"),
      step("apply", "Complete loan application", "customer"),
      who(step("eligibility", "Eligibility decision and underwriting", "staff"), "Underwriters"),
      who(step("terms", "Extend loan terms", "staff"), "Loan agents"),
      who(step("award", "Award loan", "staff"), "Loan agents"),
      who(step("payments", "Set up payment terms", "staff"), "Servicing"),
      step("repay", "Repay money", "customer"),
      who(step("close", "Close loan", "staff"), "Servicing"),
    ],
    systems: [
      { id: "channels", name: "Channels", note: "web, mobile, branch", stepIds: ["attract"] },
      { id: "los", name: "Loan origination system", note: "quotes and applications", stepIds: ["quote", "apply"] },
      { id: "credit", name: "Credit scoring system", note: "eligibility and risk", stepIds: ["eligibility"] },
      { id: "core", name: "Core banking", note: "terms, award, payments, closure", stepIds: ["terms", "award", "payments", "repay", "close"] },
    ],
    groups: [
      { id: "g-paris", people: 20, locations: "Paris", function: "Development", systemIds: ["channels"] },
      { id: "g-us", people: 80, locations: "Redmond · Atlanta", function: "Development", systemIds: ["los"] },
      { id: "g-india", people: 200, locations: "Bangalore · Delhi", function: "Development", systemIds: ["channels", "los", "credit"] },
      { id: "g-estonia", people: 30, locations: "Estonia", function: "Development", systemIds: ["credit"] },
      { id: "g-chicago", people: 150, locations: "Chicago", function: "Development", systemIds: ["core"] },
      // People the full business solution needs beyond development, attached to the development value streams directly.
      { id: "g-legal", people: 5, locations: "Atlanta", function: "Legal", systemIds: [], devStreamId: "dvs-origination" },
      { id: "g-marketing", people: 13, locations: "Atlanta", function: "Marketing", systemIds: [], devStreamId: "dvs-origination" },
      { id: "g-support", people: 15, locations: "Delhi", function: "Support", systemIds: [], devStreamId: "dvs-servicing" },
      { id: "g-ops", people: 12, locations: "Estonia", function: "Operations", systemIds: [], devStreamId: "dvs-servicing" },
    ],
    devStreams: [
      { id: "dvs-origination", name: "Acquisition and origination", systemIds: ["channels", "los", "credit"] },
      { id: "dvs-servicing", name: "Servicing on core banking", systemIds: ["core"] },
    ],
    arts: [
      { id: "art-channels", name: "Channel Support", people: 100, locations: "40 US · 60 Bangalore", systemIds: ["channels"], devStreamId: "dvs-origination", topology: "stream-aligned" },
      { id: "art-origination", name: "Loan Origination", people: 115, locations: "15 US · 100 Delhi", systemIds: ["los"], devStreamId: "dvs-origination", topology: "stream-aligned" },
      { id: "art-credit", name: "Credit", people: 100, locations: "25 Atlanta · 15 Redmond · 30 Estonia · 30 Bangalore", systemIds: ["credit"], devStreamId: "dvs-origination", topology: "complicated-subsystem" },
      { id: "art-core", name: "Core Banking", people: 150, locations: "150 Chicago", systemIds: ["core"], devStreamId: "dvs-servicing", topology: "platform" },
    ],
    updatedAt: now,
  };
}

/** SAFe's feature-to-production value stream map, with an improved future state. Hours. */
export function demoMap(now = "2026-01-01T00:00:00.000Z"): ValueStreamMap {
  const s = (id: string, name: string, cur: [number | null, number, number], fut: [number | null, number, number], kaizen: string): MapStep => ({
    id, name, current: { wait: cur[0], active: cur[1], ca: cur[2] }, future: { wait: fut[0], active: fut[1], ca: fut[2] }, kaizen,
  });
  return {
    id: "vsm-feature-to-production",
    name: "New feature idea to production sign-off",
    identificationId: "vsi-consumer-loan",
    devStreamId: "dvs-origination",
    unit: "hours",
    trigger: "New feature idea",
    steps: [
      s("definition", "Feature definition", [null, 4, 75], [null, 4, 90], "Acceptance criteria written with the team at refinement; a definition of ready."),
      s("design", "Design", [4, 4, 80], [4, 4, 90], "Architecture runway agreed before PI planning."),
      s("code", "Code", [16, 24, 80], [4, 24, 90], "Teams pull work at the daily stand-up instead of waiting for assignment."),
      s("test", "Test", [16, 24, 80], [2, 8, 90], "Automated regression; testing inside the team as code is written."),
      s("staging", "Deploy to staging", [696, 4, 90], [4, 0.5, 98], "Continuous integration deploys every merge to staging."),
      s("smoke-staging", "Smoke test", [4, 4, 100], [0.5, 0.5, 100], "Automated smoke tests on every staging deploy."),
      s("pm-accepts", "PM accepts", [38, 2, 100], [8, 2, 100], "Product management accepts at the iteration review."),
      s("uat-staging", "QA + UAT", [16, 24, 100], [4, 8, 100], "Business users join the system demo; UAT on the riskiest paths only."),
      s("prod", "Deploy to prod", [999, 1, 100], [8, 0.5, 100], "Release on demand with feature toggles; no quarterly window."),
      s("smoke-prod", "Smoke test", [2, 2, 100], [0.5, 0.5, 100], "The same automated suite, pointed at production."),
      s("uat-prod", "QA + UAT", [4, 4, 100], [2, 2, 100], "Monitor real usage; keep only checks that catch defects."),
      s("signoff", "Production sign-off", [1, 1, 100], [1, 1, 100], "Sign-off becomes an approval in the tool."),
    ],
    updatedAt: now,
  };
}
