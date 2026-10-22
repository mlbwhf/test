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
  /** Systems these people build or run. */
  systemIds: string[];
}

export interface DevelopmentValueStream {
  id: string;
  name: string;
  systemIds: string[];
}

export interface ArtCandidate {
  id: string;
  name: string;
  people: number;
  locations: string;
  systemIds: string[];
  devStreamId?: string;
}

export interface ValueStreamIdentification {
  id: string;
  name: string;
  trigger: string;
  value: string;
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
  return {
    id: "vsi-consumer-loan",
    name: "Consumer loan",
    trigger: "Loan need",
    value: "Loan repayment with interest",
    steps: [
      step("attract", "Attract customer", "staff"),
      step("quote", "Quick rate quote", "staff"),
      step("apply", "Complete loan application", "customer"),
      step("eligibility", "Eligibility decision and underwriting", "staff"),
      step("terms", "Extend loan terms", "staff"),
      step("award", "Award loan", "staff"),
      step("payments", "Set up payment terms", "staff"),
      step("repay", "Repay money", "customer"),
      step("close", "Close loan", "staff"),
    ],
    systems: [
      { id: "channels", name: "Channels", note: "web, mobile, branch", stepIds: ["attract"] },
      { id: "los", name: "Loan origination system", note: "quotes and applications", stepIds: ["quote", "apply"] },
      { id: "credit", name: "Credit scoring system", note: "eligibility and risk", stepIds: ["eligibility"] },
      { id: "core", name: "Core banking", note: "terms, award, payments, closure", stepIds: ["terms", "award", "payments", "repay", "close"] },
    ],
    groups: [
      { id: "g-paris", people: 20, locations: "Paris", systemIds: ["channels"] },
      { id: "g-us", people: 80, locations: "Redmond · Atlanta", systemIds: ["los"] },
      { id: "g-india", people: 200, locations: "Bangalore · Delhi", systemIds: ["channels", "los", "credit"] },
      { id: "g-estonia", people: 30, locations: "Estonia", systemIds: ["credit"] },
      { id: "g-chicago", people: 150, locations: "Chicago", systemIds: ["core"] },
    ],
    devStreams: [
      { id: "dvs-origination", name: "Acquisition and origination", systemIds: ["channels", "los", "credit"] },
      { id: "dvs-servicing", name: "Servicing on core banking", systemIds: ["core"] },
    ],
    arts: [
      { id: "art-channels", name: "Channel Support", people: 100, locations: "40 US · 60 Bangalore", systemIds: ["channels"], devStreamId: "dvs-origination" },
      { id: "art-origination", name: "Loan Origination", people: 115, locations: "15 US · 100 Delhi", systemIds: ["los"], devStreamId: "dvs-origination" },
      { id: "art-credit", name: "Credit", people: 100, locations: "25 Atlanta · 15 Redmond · 30 Estonia · 30 Bangalore", systemIds: ["credit"], devStreamId: "dvs-origination" },
      { id: "art-core", name: "Core Banking", people: 150, locations: "150 Chicago", systemIds: ["core"], devStreamId: "dvs-servicing" },
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
