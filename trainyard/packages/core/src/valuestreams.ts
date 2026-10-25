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
    /**
     * Who develops and supports each system, sized from published averages for that kind of
     * application (basis says which), plus the people the business solution needs, by stream.
     */
    groups?: { people: number; locations: string; function: string; systems: string[]; devStream?: string; basis?: string }[];
    /** The trains cut from the development value streams, by stream and system name. */
    arts?: { name: string; people: number; locations: string; systems: string[]; devStream: string; topology: ArtTopology }[];
    /** The organisation the example is sized for, so the numbers can be scaled to yours. */
    sizing?: string;
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
      sizing: "A retail bank with about 600 people building and running its lending systems.",
      groups: [
        { people: 20, locations: "Paris", function: "Development", systems: ["Channels"] },
        { people: 80, locations: "Redmond · Atlanta", function: "Development", systems: ["Loan origination system"] },
        { people: 200, locations: "Bangalore · Delhi", function: "Development", systems: ["Channels", "Loan origination system", "Credit scoring system"] },
        { people: 30, locations: "Estonia", function: "Development", systems: ["Credit scoring system"] },
        { people: 150, locations: "Chicago", function: "Development", systems: ["Core banking"] },
        { people: 5, locations: "Atlanta", function: "Legal", systems: [], devStream: "Acquisition and origination" },
        { people: 13, locations: "Atlanta", function: "Marketing", systems: [], devStream: "Acquisition and origination" },
        { people: 15, locations: "Delhi", function: "Support", systems: [], devStream: "Servicing on core banking" },
        { people: 12, locations: "Estonia", function: "Operations", systems: [], devStream: "Servicing on core banking" },
      ],
      arts: [
        { name: "Channel Support", people: 100, locations: "40 US · 60 Bangalore", systems: ["Channels"], devStream: "Acquisition and origination", topology: "stream-aligned" },
        { name: "Loan Origination", people: 115, locations: "15 US · 100 Delhi", systems: ["Loan origination system"], devStream: "Acquisition and origination", topology: "stream-aligned" },
        { name: "Credit", people: 100, locations: "25 Atlanta · 15 Redmond · 30 Estonia · 30 Bangalore", systems: ["Credit scoring system"], devStream: "Acquisition and origination", topology: "complicated-subsystem" },
        { name: "Core Banking", people: 150, locations: "150 Chicago", systems: ["Core banking"], devStream: "Servicing on core banking", topology: "platform" },
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
        { name: "Bills of material", note: "solution intent", steps: ["Procure materials"] },
        { name: "Design specifications", note: "solution intent", steps: ["Manufacture subassemblies"] },
        { name: "Manufacturing specifications", note: "solution intent", steps: ["Assemble final product"] },
        { name: "Test and validation specifications", note: "solution intent", steps: ["Validate product"] },
        { name: "Packaging and shipping specifications", note: "solution intent", steps: ["Package and ship"] },
        { name: "Digital twin", note: "the virtual vehicle, simulated and validated", steps: [] },
        { name: "Design tools platform", note: "the tools designers design, simulate and validate with", steps: [] },
      ],
      devStreams: [
        { name: "Vehicle development", note: "Develops the specific manufacturing and validation specifications needed for the vehicle", systems: ["Bills of material", "Design specifications", "Manufacturing specifications", "Test and validation specifications", "Packaging and shipping specifications", "Digital twin"] },
        { name: "Design tools platform", note: "Builds the tools that the vehicle designers need to design, simulate and validate the vehicle", systems: ["Design tools platform"] },
      ],
      sizing: "One vehicle line at a carmaker. Carmakers and suppliers employ engineers by the thousand across all their lines (Aptiv over 19,000, Porsche Engineering about 1,500), so one line's specification and tooling work is sized in the low hundreds.",
      groups: [
        { people: 60, locations: "Stuttgart", function: "Product engineering", systems: ["Design specifications"], basis: "Body, chassis and powertrain design: several specialist teams" },
        { people: 45, locations: "Stuttgart · Puebla", function: "Manufacturing engineering", systems: ["Bills of material", "Manufacturing specifications"], basis: "Process and assembly engineering for the plant, with the bill of material" },
        { people: 35, locations: "Stuttgart", function: "Test and validation", systems: ["Test and validation specifications"], basis: "Test rigs, homologation and validation planning" },
        { people: 15, locations: "Puebla", function: "Packaging and logistics engineering", systems: ["Packaging and shipping specifications"] },
        { people: 30, locations: "Bangalore", function: "Simulation", systems: ["Digital twin"], basis: "Virtual vehicle models used before and alongside physical tests" },
        { people: 70, locations: "Bangalore · Stuttgart", function: "Platform software", systems: ["Design tools platform"], basis: "CAD, simulation and PLM tooling shared by every vehicle line" },
      ],
      arts: [
        { name: "Vehicle Design", people: 90, locations: "60 Stuttgart · 30 Bangalore", systems: ["Design specifications", "Digital twin"], devStream: "Vehicle development", topology: "stream-aligned" },
        { name: "Manufacturing and Validation", people: 95, locations: "65 Stuttgart · 30 Puebla", systems: ["Bills of material", "Manufacturing specifications", "Test and validation specifications", "Packaging and shipping specifications"], devStream: "Vehicle development", topology: "stream-aligned" },
        { name: "Design Tools Platform", people: 70, locations: "50 Bangalore · 20 Stuttgart", systems: ["Design tools platform"], devStream: "Design tools platform", topology: "platform" },
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
      // As on SAFe's pattern: each application serves only the steps it is drawn to.
      systems: [
        { name: "Customer portal", steps: ["Sales cycle", "Contracts and licensing", "Customer care"] },
        { name: "CRM", steps: ["Sales cycle", "Renewals"] },
        { name: "Provisioning", note: "system", steps: ["Provisioning"] },
        { name: "Help desk", steps: ["Customer care"] },
        { name: "SaaS, mobile, desktop software products", note: "what the customer receives", steps: [] },
      ],
      devStreams: [
        { name: "Customer portal", note: "Builds the portal customers buy, license and get help through", systems: ["Customer portal"] },
        { name: "CRM, provisioning and help desk", note: "Builds the business systems the operational steps run on", systems: ["CRM", "Provisioning", "Help desk"] },
        { name: "Software solution", note: "Develops the software solution itself", systems: ["SaaS, mobile, desktop software products"] },
      ],
      sizing: "A SaaS company of about 400 people with about 1,000 internal users of its CRM.",
      groups: [
        { people: 16, locations: "Austin", function: "Development", systems: ["Customer portal"], basis: "Two product teams of 6 to 8 (Insight Partners: 6 to 8 people per product team)" },
        { people: 24, locations: "Austin · Dublin", function: "Admins and developers", systems: ["CRM"], basis: "About one admin per 75 to 100 CRM users plus developers, analysts and an architect: for 1,000 users, 10 admins and 14 others (FoundHQ; BlackLine runs 11 for 500 reps)" },
        { people: 14, locations: "Dublin", function: "Development", systems: ["Provisioning"], basis: "Two teams of 6 to 8" },
        { people: 12, locations: "Manila", function: "Platform team", systems: ["Help desk"], basis: "IT service management platforms run on 4 to 7 people for 1,000 to 50,000 users, more when processes are built in-house: admins, developers and process engineers" },
        { people: 140, locations: "Austin · Kraków", function: "Engineering", systems: ["SaaS, mobile, desktop software products"], basis: "R&D is about 30 to 40% of a mature SaaS company's headcount, 80 to 90% of it engineering (Drivetrain, ICONIQ): about 140 of 400" },
        { people: 6, locations: "Dublin", function: "Operations", systems: [], devStream: "CRM, provisioning and help desk" },
        { people: 10, locations: "Manila", function: "Support", systems: [], devStream: "Software solution" },
        { people: 6, locations: "Austin", function: "Marketing", systems: [], devStream: "Software solution" },
      ],
      arts: [
        // The portal stream is too small for a train of its own (16): it joins the business systems.
        { name: "Customer Operations", people: 72, locations: "30 Austin · 26 Dublin · 16 Manila", systems: ["Customer portal", "CRM", "Provisioning", "Help desk"], devStream: "CRM, provisioning and help desk", topology: "stream-aligned" },
        // 156 people is above 125: two trains on the one product.
        { name: "Product Platform", people: 80, locations: "40 Austin · 40 Kraków", systems: ["SaaS, mobile, desktop software products"], devStream: "Software solution", topology: "platform" },
        { name: "Product Experience", people: 76, locations: "36 Austin · 30 Kraków · 10 Manila", systems: ["SaaS, mobile, desktop software products"], devStream: "Software solution", topology: "stream-aligned" },
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
      // As on SAFe's pattern: the ERP serves the middle of each supporting value stream.
      systems: [
        { name: "ERP system", note: "also runs procurement of operational supplies and preparing and auditing financials", steps: ["Interview", "Hire employee", "Train new hire"] },
      ],
      devStreams: [
        { name: "ERP", note: "A single development value stream that supports the ERP system used throughout the enterprise", systems: ["ERP system"] },
      ],
      sizing: "An enterprise of about 6,000 people, 4,800 of them ERP users across procurement, HR and finance.",
      groups: [
        { people: 80, locations: "Dublin · Manila", function: "ERP development and support", systems: ["ERP system"], basis: "Avasant's median is 60 ERP users per support staff member: 4,800 users ÷ 60 = 80" },
        { people: 8, locations: "Dublin", function: "Process owners", systems: [], devStream: "ERP" },
      ],
      arts: [
        { name: "ERP", people: 88, locations: "50 Dublin · 38 Manila", systems: ["ERP system"], devStream: "ERP", topology: "platform" },
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
  const dvsId = (nm?: string) => (nm ? devStreams.find((x) => x.name === nm)?.id : undefined);
  const sysIds = (names: string[]) => names.map(sysId).filter((x): x is string => !!x);
  const groups: PeopleGroup[] = (type.example.groups ?? []).map((g, i) => {
    const d = dvsId(g.devStream);
    return { id: `grp-${i + 1}`, people: g.people, locations: g.locations, function: g.function, systemIds: sysIds(g.systems), ...(d ? { devStreamId: d } : {}), ...(g.basis ? { basis: g.basis } : {}) };
  });
  const arts: ArtCandidate[] = (type.example.arts ?? []).map((a, i) => {
    const d = dvsId(a.devStream);
    return { id: `art-${i + 1}`, name: a.name, people: a.people, locations: a.locations, systemIds: sysIds(a.systems), topology: a.topology, ...(d ? { devStreamId: d } : {}) };
  });
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
    groups,
    devStreams,
    arts,
    ...(type.example.sizing ? { sizing: type.example.sizing } : {}),
    updatedAt: now,
  };
}

/**
 * Switch an identification to another type's example: its fields, steps, systems, people,
 * development value streams and trains, keeping the identification's id.
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
  /** Where the number comes from: a benchmark, a ratio, an assumption. */
  basis?: string;
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
  /** The organisation the people numbers are sized for (examples), so they can be scaled. */
  sizing?: string;
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

// ---- the full breakdown: all five levels at once ----------------------------------------
// Operational steps → solutions → people → development value streams → ARTs, with people as
// the quantity that flows (a Sankey: band width = people). A group building several solutions
// is shared evenly between them; a solution supporting several steps likewise. Beside the
// flow: a step × train matrix (who must coordinate on which step) and coverage per level.

export type BreakdownLevel = "step" | "system" | "group" | "dvs" | "art";

export interface BreakdownNode {
  id: string;
  level: BreakdownLevel;
  label: string;
  sub?: string;
  people: number;
}

export interface BreakdownLink {
  from: string;
  to: string;
  people: number;
}

export interface BreakdownCoverage {
  level: BreakdownLevel;
  label: string;
  covered: number;
  total: number;
  /** What "covered" means at this level. */
  rule: string;
  gaps: string[];
}

export interface IdentificationBreakdown {
  nodes: BreakdownNode[];
  links: BreakdownLink[];
  /** Per operational step: the trains whose solutions support it, with those solutions. */
  matrix: { stepId: string; step: string; cells: { artId: string; systems: string[] }[] }[];
  coverage: BreakdownCoverage[];
  totalPeople: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function identificationBreakdown(vsi: ValueStreamIdentification): IdentificationBreakdown {
  const nodes: BreakdownNode[] = [];
  const links: BreakdownLink[] = [];
  const key = (level: BreakdownLevel, id: string) => `${level}:${id}`;
  const add = (from: string, to: string, people: number) => {
    if (people <= 0) return;
    const l = links.find((x) => x.from === from && x.to === to);
    if (l) l.people = round1(l.people + people);
    else links.push({ from, to, people: round1(people) });
  };
  // people → solutions, shared evenly across the solutions a group builds
  const sysPeople = new Map<string, number>();
  for (const g of vsi.groups) for (const sid of g.systemIds) sysPeople.set(sid, (sysPeople.get(sid) ?? 0) + g.people / g.systemIds.length);

  for (const st of vsi.steps) {
    const systems = vsi.systems.filter((s) => s.stepIds.includes(st.id));
    const people = systems.reduce((n, s) => n + (sysPeople.get(s.id) ?? 0) / Math.max(1, s.stepIds.length), 0);
    nodes.push({ id: key("step", st.id), level: "step", label: st.name, ...(st.people ? { sub: st.people } : {}), people: round1(people) });
    for (const s of systems) add(key("step", st.id), key("system", s.id), (sysPeople.get(s.id) ?? 0) / Math.max(1, s.stepIds.length));
  }
  for (const s of vsi.systems) {
    nodes.push({ id: key("system", s.id), level: "system", label: s.name, ...(s.note ? { sub: s.note } : {}), people: round1(sysPeople.get(s.id) ?? 0) });
    for (const g of vsi.groups.filter((x) => x.systemIds.includes(s.id))) add(key("system", s.id), key("group", g.id), g.people / g.systemIds.length);
  }
  for (const g of vsi.groups) {
    nodes.push({ id: key("group", g.id), level: "group", label: `${g.people} ${g.function ?? "people"}`.trim(), sub: g.locations, people: g.people });
    for (const d of vsi.devStreams) {
      const share = g.devStreamId === d.id ? g.people : g.systemIds.length ? (g.people * g.systemIds.filter((x) => d.systemIds.includes(x)).length) / g.systemIds.length : 0;
      add(key("group", g.id), key("dvs", d.id), share);
    }
  }
  for (const d of vsi.devStreams) {
    nodes.push({ id: key("dvs", d.id), level: "dvs", label: d.name, ...(d.note ? { sub: d.note } : {}), people: devStreamPeople(vsi, d.id).people });
    for (const a of vsi.arts) {
      const share = a.devStreamId === d.id ? a.people : !a.devStreamId && a.systemIds.length ? (a.people * a.systemIds.filter((x) => d.systemIds.includes(x)).length) / a.systemIds.length : 0;
      add(key("dvs", d.id), key("art", a.id), share);
    }
  }
  for (const a of vsi.arts) nodes.push({ id: key("art", a.id), level: "art", label: a.name, sub: `${a.people} people · ${artFit(a.people) === "fits" ? "fits 50–125" : artFit(a.people) === "split" ? "over 125: split" : "under 50: merge"}`, people: a.people });

  const matrix = vsi.steps.map((st) => {
    const systems = vsi.systems.filter((s) => s.stepIds.includes(st.id));
    return {
      stepId: st.id,
      step: st.name,
      cells: vsi.arts.map((a) => ({ artId: a.id, systems: systems.filter((s) => a.systemIds.includes(s.id)).map((s) => s.name) })),
    };
  });

  const staffed = vsi.systems.filter((s) => (sysPeople.get(s.id) ?? 0) > 0);
  const inDvs = vsi.groups.filter((g) => vsi.devStreams.some((d) => g.devStreamId === d.id || g.systemIds.some((x) => d.systemIds.includes(x))));
  const dvsWithArt = vsi.devStreams.filter((d) => vsi.arts.some((a) => a.devStreamId === d.id || (!a.devStreamId && a.systemIds.some((x) => d.systemIds.includes(x)))));
  const supported = vsi.steps.filter((st) => vsi.systems.some((s) => s.stepIds.includes(st.id)));
  const fitting = vsi.arts.filter((a) => artFit(a.people) === "fits");
  const coverage: BreakdownCoverage[] = [
    { level: "step", label: "Operational steps", covered: supported.length, total: vsi.steps.length, rule: "supported by at least one solution", gaps: vsi.steps.filter((s) => !supported.includes(s)).map((s) => s.name) },
    { level: "system", label: "Solutions", covered: staffed.length, total: vsi.systems.length, rule: "someone builds or runs it", gaps: vsi.systems.filter((s) => !staffed.includes(s)).map((s) => s.name) },
    { level: "group", label: "People", covered: inDvs.reduce((n, g) => n + g.people, 0), total: vsi.groups.reduce((n, g) => n + g.people, 0), rule: "belong to a development value stream", gaps: vsi.groups.filter((g) => !inDvs.includes(g)).map((g) => `${g.people} ${g.function ?? ""} ${g.locations}`.replace(/\s+/g, " ").trim()) },
    { level: "dvs", label: "Development value streams", covered: dvsWithArt.length, total: vsi.devStreams.length, rule: "realised by at least one ART", gaps: vsi.devStreams.filter((d) => !dvsWithArt.includes(d)).map((d) => d.name) },
    { level: "art", label: "ARTs", covered: fitting.length, total: vsi.arts.length, rule: "between 50 and 125 people", gaps: vsi.arts.filter((a) => !fitting.includes(a)).map((a) => `${a.name} (${a.people})`) },
  ];
  return { nodes, links, matrix, coverage, totalPeople: vsi.groups.reduce((n, g) => n + g.people, 0) };
}

/**
 * Everything one box of the breakdown touches across the five levels, traced through the
 * solutions themselves (not through whole development value streams), so a solution lights
 * only the trains that own it.
 */
export function breakdownTrace(vsi: ValueStreamIdentification, nodeId: string): Set<string> {
  const [level, id] = nodeId.split(":") as [BreakdownLevel, string];
  const dvs = level === "dvs" ? vsi.devStreams.find((d) => d.id === id) : undefined;
  const art = level === "art" ? vsi.arts.find((a) => a.id === id) : undefined;
  const group = level === "group" ? vsi.groups.find((g) => g.id === id) : undefined;
  const seed = new Set<string>(
    level === "step"
      ? vsi.systems.filter((s) => s.stepIds.includes(id)).map((s) => s.id)
      : level === "system"
        ? [id]
        : group
          ? group.systemIds.length
            ? group.systemIds
            : (vsi.devStreams.find((d) => d.id === group.devStreamId)?.systemIds ?? [])
          : dvs
            ? dvs.systemIds
            : (art?.systemIds ?? []),
  );
  const out = new Set<string>([nodeId]);
  for (const s of vsi.systems) if (seed.has(s.id)) out.add(`system:${s.id}`);
  for (const st of vsi.steps) if (vsi.systems.some((s) => seed.has(s.id) && s.stepIds.includes(st.id))) out.add(`step:${st.id}`);
  const streamIds = new Set(vsi.devStreams.filter((d) => d.id === dvs?.id || d.id === art?.devStreamId || d.systemIds.some((x) => seed.has(x))).map((d) => d.id));
  if (group?.devStreamId) streamIds.add(group.devStreamId);
  for (const d of streamIds) out.add(`dvs:${d}`);
  for (const g of vsi.groups) {
    const builds = g.systemIds.some((x) => seed.has(x));
    // People attached to a stream directly (legal, marketing) belong to the stream, so only a stream or one of its trains lights them.
    const attached = g.devStreamId !== undefined && streamIds.has(g.devStreamId) && (level === "dvs" || level === "art");
    if (builds || attached || g.id === group?.id) out.add(`group:${g.id}`);
  }
  for (const a of vsi.arts) if (a.id === art?.id || a.systemIds.some((x) => seed.has(x)) || (dvs && a.devStreamId === dvs.id)) out.add(`art:${a.id}`);
  return out;
}
