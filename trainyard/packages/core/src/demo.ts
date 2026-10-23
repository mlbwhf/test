// Deterministic demo workspace: one Agile Release Train with two Jira teams and two Azure
// DevOps teams, the previous PI finished and scored, the current PI in flight. Used by the
// API when no tracker is connected, by the UI's sample mode and by tests.

import { getTemplate } from "./frameworks.js";
import { buildIncrement } from "./planning.js";
import { applyCapacity } from "./capacity.js";
import type { Dependency, FlowType, Increment, Objective, Person, Risk, Team, WorkItem, Workspace } from "./model.js";
import type { Portfolio } from "./portfolio.js";

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TEAMS: { id: string; name: string; source: "jira" | "ado"; key: string }[] = [
  { id: "t-checkout", name: "Checkout", source: "jira", key: "CHK" },
  { id: "t-search", name: "Search & Discovery", source: "jira", key: "SRC" },
  { id: "t-payments", name: "Payments", source: "ado", key: "" },
  { id: "t-assist", name: "AI Assist", source: "ado", key: "" },
];

const FEATURES: { title: string; team: string; flow: FlowType; est: number; bv: number; ai?: string }[] = [
  { title: "One-page guest checkout", team: "t-checkout", flow: "feature", est: 13, bv: 8 },
  { title: "Saved carts across devices", team: "t-checkout", flow: "feature", est: 8, bv: 5 },
  { title: "Checkout latency budget", team: "t-checkout", flow: "enabler", est: 5, bv: 3 },
  { title: "Semantic product search", team: "t-search", flow: "feature", est: 13, bv: 9, ai: "ai-search" },
  { title: "Search relevance eval harness", team: "t-search", flow: "enabler", est: 8, bv: 5, ai: "ai-search" },
  { title: "Facet performance fix", team: "t-search", flow: "defect", est: 3, bv: 3 },
  { title: "Wallet tokenisation", team: "t-payments", flow: "feature", est: 13, bv: 8 },
  { title: "PSD3 strong authentication", team: "t-payments", flow: "enabler", est: 8, bv: 7 },
  { title: "Fraud score model v2", team: "t-payments", flow: "feature", est: 13, bv: 8, ai: "ai-fraud" },
  { title: "Retire legacy payout job", team: "t-payments", flow: "debt", est: 5, bv: 2 },
  { title: "Support reply drafting agent", team: "t-assist", flow: "feature", est: 13, bv: 9, ai: "ai-support" },
  { title: "Agent guardrails and audit log", team: "t-assist", flow: "enabler", est: 8, bv: 6, ai: "ai-support" },
  { title: "Return-reason classifier", team: "t-assist", flow: "feature", est: 8, bv: 5, ai: "ai-returns" },
  { title: "Prompt and model registry", team: "t-assist", flow: "enabler", est: 5, bv: 4 },
];

export const DEMO_NOW = new Date("2026-10-21T12:00:00Z");

export function demoWorkspace(): Workspace {
  const model = getTemplate("safe-ai-native");
  const prev = buildIncrement("pi-26-3", "PI 26.3", "2026-08-17", model.cadence);
  const curr = buildIncrement("pi-26-4", "PI 26.4", "2026-10-05", model.cadence);
  curr.milestones = [
    { id: "ms-trade-show", label: "Pharmacy trade show demo", kind: "event", iterationId: curr.iterations[2]!.id, date: curr.iterations[2]!.end },
    { id: "ms-rel-26-4", label: "Release 26.4 to all stores", kind: "release", iterationId: curr.iterations[3]!.id },
    { id: "ms-audit", label: "Controlled-substances audit", kind: "milestone" },
  ];
  const increments: Increment[] = [prev, curr];
  const rand = rng(2604);
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;

  // Team members: five or six people each, a Scrum Master and Product Owner who do not
  // deliver points, and a few part-timers. Checkout and Payments calculate capacity from
  // them (SAFe's 8 points per full-timer); Search uses its velocity; AI Assist types it in.
  const MEMBERS: Record<string, { name: string; role: string; allocation: number; vacation?: Record<string, number> }[]> = {
    "t-checkout": [
      { name: "Noah Petersen", role: "developer", allocation: 1 },
      { name: "Mei Tanaka", role: "developer", allocation: 1, vacation: { [curr.iterations[1]!.id]: 3 } },
      { name: "Yusuf Demir", role: "developer", allocation: 1 },
      { name: "Hannah Weiss", role: "tester", allocation: 1 },
      { name: "Tomás Rivera", role: "ux", allocation: 0.5 },
      { name: "Ella Novak", role: "scrum-master", allocation: 1 },
      { name: "Diego Ramos", role: "po", allocation: 0.5 },
    ],
    "t-search": [
      { name: "Aiko Mori", role: "developer", allocation: 1 },
      { name: "Ben Carter", role: "developer", allocation: 1 },
      { name: "Sofia Rossi", role: "developer", allocation: 0.8 },
      { name: "Kwame Mensah", role: "tester", allocation: 1 },
      { name: "Ella Novak", role: "scrum-master", allocation: 0 },
    ],
    "t-payments": [
      { name: "Ravi Iyer", role: "developer", allocation: 1 },
      { name: "Clara Dubois", role: "developer", allocation: 1, vacation: { [curr.iterations[0]!.id]: 5 } },
      { name: "Jonas Lind", role: "developer", allocation: 1 },
      { name: "Fatima Zahra", role: "tester", allocation: 1 },
      { name: "Oliver Grant", role: "architect", allocation: 0.25 },
      { name: "Ines Costa", role: "scrum-master", allocation: 1 },
    ],
    "t-assist": [
      { name: "Leo Brandt", role: "developer", allocation: 1 },
      { name: "Zara Khan", role: "ml-engineer", allocation: 1 },
      { name: "Sam Okoro", role: "ml-engineer", allocation: 1 },
      { name: "Lena Fischer", role: "ai-value-architect", allocation: 0.25 },
    ],
  };
  const teamPeople: Person[] = [];
  const personId = (name: string, role: string) => {
    if (name === "Diego Ramos") return "p-pm";
    if (name === "Lena Fischer") return "p-ava";
    const id = `p-${name.toLowerCase().replace(/[^a-z]+/g, "-")}`;
    if (!teamPeople.some((p) => p.id === id)) teamPeople.push({ id, name, roles: [role] });
    return id;
  };
  const modeOf: Record<string, Team["capacityMode"]> = { "t-checkout": "calculated", "t-payments": "calculated", "t-search": "velocity", "t-assist": "manual" };
  const teams: Team[] = TEAMS.map((t) => {
    const members = (MEMBERS[t.id] ?? []).map((m) => ({ personId: personId(m.name, m.role), allocation: m.allocation, contributes: !["scrum-master", "po", "rte"].includes(m.role), ...(m.vacation ? { vacationDays: m.vacation } : {}) }));
    return {
      id: t.id,
      name: t.name,
      groupId: "art-customer",
      source: t.source,
      capacity: Object.fromEntries(increments.flatMap((inc) => inc.iterations.map((i) => [i.id, i.isIP ? 0 : 10 + Math.floor(rand() * 4)]))),
      capacityMode: modeOf[t.id] ?? "manual",
      members,
      pointsPerFullTime: 8,
      memberIds: members.map((m) => m.personId),
      agentIds: t.id === "t-assist" ? ["agent-triage", "agent-reply"] : t.id === "t-checkout" ? ["agent-codereview"] : [],
    };
  });

  const items: WorkItem[] = [];
  let jiraSeq = 100;
  let adoSeq = 4100;
  const sourceFor = (teamId: string, updatedAt: string) => {
    const t = TEAMS.find((x) => x.id === teamId)!;
    if (t.source === "jira") {
      const key = `${t.key}-${jiraSeq++}`;
      return { system: "jira" as const, externalId: key, url: `https://northwind.atlassian.net/browse/${key}`, updatedAt };
    }
    const id = String(adoSeq++);
    return { system: "ado" as const, externalId: id, url: `https://dev.azure.com/northwind/Customer/_workitems/edit/${id}`, updatedAt };
  };

  items.push(
    { id: "e-conversion", title: "Lift checkout conversion 3 points", level: "epic", status: "in_progress", flowType: "feature", createdAt: "2026-06-01T09:00:00Z", startedAt: "2026-08-17T09:00:00Z", source: { system: "native", externalId: "" } },
    { id: "e-ai-service", title: "AI-assisted customer service", level: "epic", status: "in_progress", flowType: "feature", createdAt: "2026-06-15T09:00:00Z", startedAt: "2026-08-17T09:00:00Z", source: { system: "native", externalId: "" } },
  );

  // Previous PI: finished stories spread over its iterations, so flow metrics have history.
  const prevWork = prev.iterations.filter((i) => !i.isIP);
  for (const team of TEAMS) {
    for (let n = 0; n < 16; n++) {
      const iter = pick(prevWork);
      const startMs = Date.parse(`${iter.start}T09:00:00Z`) + Math.floor(rand() * 3) * 86_400_000;
      const doneMs = startMs + (1 + Math.floor(rand() * 6)) * 86_400_000;
      const flow = pick<FlowType>(["feature", "feature", "feature", "enabler", "defect", "debt"]);
      const doneAt = new Date(Math.min(doneMs, Date.parse(`${iter.end}T18:00:00Z`))).toISOString();
      items.push({
        id: `s-prev-${team.id}-${n}`,
        title: `${team.name} story ${n + 1}`,
        level: "story",
        teamId: team.id,
        iterationId: iter.id,
        status: "done",
        flowType: flow,
        estimate: pick([1, 2, 3, 5]),
        createdAt: new Date(startMs - 7 * 86_400_000).toISOString(),
        startedAt: new Date(startMs).toISOString(),
        doneAt,
        source: sourceFor(team.id, doneAt),
      });
    }
  }

  // Current PI: features on the board, stories partly done.
  const currWork = curr.iterations.filter((i) => !i.isIP);
  const nowIso = DEMO_NOW.toISOString();
  FEATURES.forEach((f, idx) => {
    const iter = currWork[Math.min(currWork.length - 1, Math.floor(idx / 3) + (idx % 2))]!;
    const id = `f-${idx + 1}`;
    const started = iter.start < nowIso.slice(0, 10);
    items.push({
      id,
      title: f.title,
      level: "feature",
      parentId: f.ai || f.team === "t-assist" ? "e-ai-service" : "e-conversion",
      teamId: f.team,
      iterationId: iter.id,
      status: started ? "in_progress" : "todo",
      flowType: f.flow,
      estimate: f.est,
      businessValue: f.bv,
      createdAt: "2026-09-01T09:00:00Z",
      ...(started ? { startedAt: `${iter.start}T09:00:00Z` } : {}),
      source: sourceFor(f.team, "2026-10-20T16:00:00Z"),
      ...(f.ai ? { aiInitiativeId: f.ai } : {}),
    });
    for (let s = 0; s < 3; s++) {
      const done = started && rand() < 0.6;
      const startedAt = started ? `${iter.start}T10:00:00Z` : undefined;
      const doneAt = done ? new Date(Date.parse(`${iter.start}T10:00:00Z`) + (1 + Math.floor(rand() * 5)) * 86_400_000).toISOString() : undefined;
      items.push({
        id: `${id}-s${s + 1}`,
        title: `${f.title}: slice ${s + 1}`,
        level: "story",
        parentId: id,
        teamId: f.team,
        iterationId: iter.id,
        status: done ? "done" : started ? (rand() < 0.7 ? "in_progress" : "todo") : "todo",
        flowType: f.flow,
        estimate: pick([2, 3, 5]),
        createdAt: "2026-09-20T09:00:00Z",
        ...(startedAt ? { startedAt } : {}),
        ...(doneAt && doneAt < nowIso ? { doneAt } : {}),
        source: sourceFor(f.team, "2026-10-20T16:00:00Z"),
      });
    }
  });
  // Stories marked done but with a future doneAt were trimmed above; keep status consistent.
  for (const it of items) if (it.status === "done" && !it.doneAt) it.status = "in_progress";

  const dependencies: Dependency[] = [
    { id: "d-1", providerId: "f-7", consumerId: "f-1", note: "Guest checkout needs wallet tokens", status: "committed" },
    { id: "d-2", providerId: "f-5", consumerId: "f-4", note: "Relevance evals gate the semantic search rollout", status: "committed" },
    { id: "d-3", providerId: "f-12", consumerId: "f-11", note: "Agent cannot pilot before guardrails exist", status: "open" },
    { id: "d-4", providerId: "f-6", consumerId: "f-13", note: "Classifier reads facet data from the fixed index", status: "open" },
    { id: "d-5", providerId: "f-8", consumerId: "f-10", note: "New payout flow needs the strong-auth session", status: "open" },
  ];

  const risks: Risk[] = [
    { id: "r-1", title: "Card network certification may slip past iteration 4", roam: "owned", ownerId: "p-rte", groupId: "art-customer", itemIds: ["f-7"], raisedAt: "2026-10-06T09:00:00Z" },
    { id: "r-2", title: "Support agent drafts could expose customer data in logs", roam: "mitigated", groupId: "art-customer", itemIds: ["f-11", "f-12"], raisedAt: "2026-10-06T09:00:00Z" },
    { id: "r-3", title: "Search eval set is too small to trust", roam: "unroamed", groupId: "art-customer", itemIds: ["f-5"], raisedAt: "2026-10-14T09:00:00Z" },
    { id: "r-4", title: "GPU quota for fraud model retraining not approved", roam: "unroamed", groupId: "art-customer", itemIds: ["f-9"], raisedAt: "2026-10-15T09:00:00Z" },
    { id: "r-5", title: "Legacy payout job has undocumented consumers", roam: "accepted", groupId: "art-customer", itemIds: ["f-10"], raisedAt: "2026-10-06T09:00:00Z" },
  ];

  const objectives: Objective[] = [];
  const objTitles: Record<string, string[]> = {
    "t-checkout": ["Ship address autocomplete", "Cut checkout errors by half", "Pilot express pay"],
    "t-search": ["Typo-tolerant search", "Search analytics dashboard", "Synonym management"],
    "t-payments": ["SEPA instant payouts", "Chargeback automation", "Settlement report v2"],
    "t-assist": ["Intent classifier in production", "Deflect 10% of tickets", "Agent evaluation suite"],
  };
  for (const team of TEAMS) {
    objTitles[team.id]!.forEach((title, i) => {
      const planned = 4 + Math.floor(rand() * 7);
      const committed = i < 2;
      // Committed objectives land at or a little under plan; stretch objectives add a little.
      const actual = committed ? Math.max(0, planned - Math.floor(rand() * 3)) : Math.floor(planned * 0.3 * rand());
      objectives.push({ id: `o-prev-${team.id}-${i}`, incrementId: prev.id, teamId: team.id, title, plannedValue: planned, actualValue: actual, committed });
    });
  }
  FEATURES.forEach((f, i) => {
    if (i % 2 === 0) objectives.push({ id: `o-curr-${f.team}-${i}`, incrementId: curr.id, teamId: f.team, title: f.title, plannedValue: f.bv, committed: true });
  });

  const portfolio: Portfolio = {
    currency: "USD",
    valueStreams: [
      {
        id: "vs-commerce",
        name: "Commerce",
        portfolioId: "pf-digital",
        budgets: { [prev.id]: 900_000, [curr.id]: 950_000 },
        guardrails: { minEnablerPercent: 20, maxEpicBudgetPercent: 60, businessCaseAbove: 300_000 },
        groupIds: ["art-customer"],
      },
    ],
    epics: [
      {
        id: "pe-conversion",
        itemId: "e-conversion",
        title: "Lift checkout conversion 3 points",
        valueStreamId: "vs-commerce",
        state: "implementing",
        ownerId: "p-pm",
        hypothesis: "If guest checkout and saved carts remove two steps, conversion rises from 2.1% to 5% within two PIs.",
        wsjf: { userBusinessValue: 13, timeCriticality: 8, riskReductionOpportunity: 3, jobSize: 8 },
        spend: [
          { incrementId: prev.id, planned: 380_000, actual: 362_000 },
          { incrementId: curr.id, planned: 420_000 },
        ],
      },
      {
        id: "pe-ai-service",
        itemId: "e-ai-service",
        title: "AI-assisted customer service",
        valueStreamId: "vs-commerce",
        state: "implementing",
        ownerId: "p-ava",
        hypothesis: "Drafting and triage agents cut handle time 30% without raising escalations.",
        wsjf: { userBusinessValue: 8, timeCriticality: 5, riskReductionOpportunity: 8, jobSize: 13 },
        spend: [
          { incrementId: prev.id, planned: 300_000, actual: 318_000 },
          { incrementId: curr.id, planned: 410_000 },
        ],
      },
      {
        id: "pe-marketplace",
        title: "Third-party marketplace sellers",
        valueStreamId: "vs-commerce",
        state: "analyzing",
        wsjf: { userBusinessValue: 20, timeCriticality: 3, riskReductionOpportunity: 2, jobSize: 20 },
        spend: [{ incrementId: curr.id, planned: 60_000 }],
      },
      {
        id: "pe-observability",
        title: "Platform observability",
        valueStreamId: "vs-commerce",
        state: "backlog",
        wsjf: { userBusinessValue: 3, timeCriticality: 5, riskReductionOpportunity: 13, jobSize: 5 },
        spend: [{ incrementId: curr.id, planned: 90_000 }],
      },
    ],
    okrs: [
      {
        id: "okr-growth",
        title: "Make checkout the easiest in the category",
        level: "portfolio",
        ownerId: "p-pm",
        keyResults: [
          { id: "kr-conv", title: "Checkout conversion (%)", baseline: 2.1, target: 5, current: 3.4 },
          { id: "kr-flow", title: "Median story flow time (days)", baseline: 6, target: 3, metric: { key: "flow-time", filters: { level: "story" } } },
        ],
      },
      {
        id: "okr-ai",
        title: "Scale AI safely in customer service",
        level: "group",
        ownerGroupId: "art-customer",
        ownerId: "p-ava",
        incrementId: curr.id,
        keyResults: [
          { id: "kr-aht", title: "Average handle time (min)", baseline: 11, target: 7, current: 9.6 },
          { id: "kr-esc", title: "Escalations per 1,000 tickets", baseline: 42, target: 40 },
        ],
      },
    ],
  };

  const people: Person[] = [
    { id: "p-rte", name: "Amara Okafor", roles: ["rte"] },
    { id: "p-ava", name: "Lena Fischer", roles: ["ai-value-architect"] },
    { id: "p-pm", name: "Diego Ramos", roles: ["pm"] },
    { id: "p-steward", name: "Priya Nair", roles: ["data-steward"] },
    ...teamPeople,
  ];

  return {
    id: "ws-northwind",
    name: "Northwind Digital",
    modelId: model.id,
    groups: [
      { id: "pf-digital", name: "Digital Commerce", level: "portfolio" },
      { id: "art-customer", name: "Customer Platform ART", level: "train", parentId: "pf-digital" },
    ],
    teams: teams.map((t) => applyCapacity(t, { people, items, increments })),
    people,
    increments,
    items,
    dependencies,
    risks,
    objectives,
    portfolio,
  };
}
