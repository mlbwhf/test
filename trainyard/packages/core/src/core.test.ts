import { describe, expect, it } from "vitest";
import {
  DEMO_NOW,
  FLOW_METRICS,
  MetricRegistry,
  PORTFOLIO_METRICS,
  budgetLines,
  checkGuardrails,
  okrProgress,
  rankEpics,
  wsjf,
  type Portfolio,
  TEMPLATES,
  buildIncrement,
  checkDependencies,
  demoWorkspace,
  forkModel,
  getTemplate,
  orderLevels,
  percentile,
  planningReadiness,
  teamLoad,
  validateModel,
  type Dependency,
  type Team,
  type WorkItem,
} from "./index.js";

const metricKeys = new Set([...FLOW_METRICS.map((m) => m.key), "ai-stage-mix", "ai-spend", "ai-value-realised", "agents-on-teams"]);

describe("operating model templates", () => {
  it.each(TEMPLATES.map((t) => [t.id, t] as const))("%s is valid", (_id, t) => {
    expect(validateModel(t, metricKeys)).toEqual([]);
  });

  it("forking copies and leaves the template untouched", () => {
    const t = getTemplate("safe-essential");
    const before = JSON.stringify(t);
    const m = forkModel(t, "acme", { name: "Acme SAFe", cadence: { iterationWeeks: 3 }, aiNative: { enabled: true } });
    m.groupLevels[0]!.label = "Changed";
    expect(JSON.stringify(t)).toBe(before);
    expect(m.basedOn).toBe("safe-essential");
    expect(m.cadence).toMatchObject({ iterationWeeks: 3, iterationsPerIncrement: 5 });
    expect(m.aiNative.enabled).toBe(true);
    expect(m.aiNative.requireAccountableHuman).toBe(true);
  });

  it("orders levels from the top down", () => {
    const shuffled = [...getTemplate("safe-full").workLevels].reverse();
    expect(orderLevels(shuffled).map((l) => l.key)).toEqual(["epic", "capability", "feature", "story"]);
  });

  it("reports structural problems", () => {
    const bad = forkModel(getTemplate("safe-portfolio"), "bad", {
      workLevels: [
        { key: "epic", label: "Epic" },
        { key: "feature", label: "Feature", parent: "missing", planned: true },
        { key: "feature", label: "Dup" },
      ],
      cadence: { iterationWeeks: 0 },
      aiNative: { enabled: true, valueArchitectSignOff: true },
      metrics: ["flow-time", "nonsense"],
    });
    const msgs = validateModel(bad, metricKeys).map((i) => i.path);
    expect(msgs).toEqual(expect.arrayContaining(["workLevels[2].key", "workLevels[1].parent", "cadence.iterationWeeks", "aiNative.valueArchitectSignOff", "metrics[1]"]));
  });

  it("requires a team level and exactly one planned level", () => {
    const m = forkModel(getTemplate("nexus"), "x", {
      groupLevels: [{ key: "nexus", label: "Nexus" }],
      workLevels: [{ key: "item", label: "Item" }],
    });
    const msgs = validateModel(m).map((i) => i.message).join(" ");
    expect(msgs).toContain('key "team"');
    expect(msgs).toContain("found 0");
  });

  it("AI-Native SAFe turns on agent governance", () => {
    const m = getTemplate("safe-ai-native");
    expect(m.aiNative).toMatchObject({ enabled: true, requireAccountableHuman: true, valueArchitectSignOff: true });
    expect(m.roles.some((r) => r.key === "ai-value-architect")).toBe(true);
  });
});

describe("planning", () => {
  const cadence = getTemplate("safe-essential").cadence;
  const inc = buildIncrement("pi1", "PI 1", "2026-01-05", cadence);

  it("lays out iterations with an IP iteration last", () => {
    expect(inc.iterations).toHaveLength(5);
    expect(inc.iterations[0]).toMatchObject({ start: "2026-01-05", end: "2026-01-18" });
    expect(inc.iterations[4]).toMatchObject({ name: "PI 1.IP", isIP: true, end: "2026-03-15" });
    expect(inc.end).toBe("2026-03-15");
  });

  it("rejects a bad start date", () => {
    expect(() => buildIncrement("x", "x", "05/01/2026", cadence)).toThrow(/invalid start/);
  });

  const team: Team = { id: "t1", name: "T1", groupId: "g", source: "native", capacity: { "pi1.1": 10, "pi1.2": 10 }, memberIds: [], agentIds: [] };
  const item = (id: string, iterationId: string | undefined, estimate: number, extra: Partial<WorkItem> = {}): WorkItem => ({
    id,
    title: id,
    level: "feature",
    teamId: "t1",
    ...(iterationId ? { iterationId } : {}),
    status: "todo",
    flowType: "feature",
    estimate,
    createdAt: "2026-01-01T00:00:00Z",
    source: { system: "native", externalId: "" },
    ...extra,
  });

  it("computes load against capacity", () => {
    const cells = teamLoad([item("a", "pi1.1", 6), item("b", "pi1.1", 6), item("c", "pi1.2", 9), item("d", "pi1.3", 1), { ...item("s", "pi1.2", 50), level: "story" }], [team], inc, "feature");
    const at = (id: string) => cells.find((c) => c.iterationId === id)!;
    expect(at("pi1.1")).toMatchObject({ load: 12, capacity: 10, state: "over" });
    expect(at("pi1.2")).toMatchObject({ load: 9, state: "near" });
    expect(at("pi1.3")).toMatchObject({ load: 1, capacity: 0, ratio: Infinity, state: "over" });
    expect(at("pi1.4")).toMatchObject({ load: 0, ratio: 0, state: "ok" });
  });

  it("flags dependencies planned out of order", () => {
    const items = [item("p1", "pi1.3", 1), item("c1", "pi1.2", 1), item("p2", "pi1.2", 1), item("c2", "pi1.2", 1), item("p3", undefined, 1), item("c3", "pi1.1", 1), item("p4", "pi1.1", 1), item("c4", "pi1.3", 1), item("p5", "pi1.4", 1, { status: "done" })];
    const deps: Dependency[] = [
      { id: "late", providerId: "p1", consumerId: "c1", status: "open" },
      { id: "same", providerId: "p2", consumerId: "c2", status: "open" },
      { id: "unplanned", providerId: "p3", consumerId: "c3", status: "open" },
      { id: "fine", providerId: "p4", consumerId: "c4", status: "open" },
      { id: "done", providerId: "p5", consumerId: "c1", status: "open" },
      { id: "gone", providerId: "nope", consumerId: "c1", status: "open" },
    ];
    const res = Object.fromEntries(checkDependencies(deps, items, [inc]).map((c) => [c.dependencyId, c.problem ?? c.severity]));
    expect(res).toEqual({ late: "provider-after-consumer", same: "same-iteration", unplanned: "provider-unscheduled", fine: "ok", done: "ok", gone: "missing-item" });
  });

  it("checks readiness before a planning event", () => {
    const r = planningReadiness({ increment: inc, teams: [team], items: [item("a", undefined, 3)], plannedLevel: "feature" });
    expect(r.ready).toBe(false);
    expect(r.checks.find((c) => c.key === "capacity")!.ok).toBe(false);
    expect(r.checks.find((c) => c.key === "value")!.ok).toBe(false);
  });
});

describe("metrics", () => {
  const ws = demoWorkspace();
  const ctx = { workspace: ws, now: DEMO_NOW, extensions: {} };
  const reg = new MetricRegistry();

  it("demo workspace is internally consistent", () => {
    const ids = new Set(ws.items.map((i) => i.id));
    for (const d of ws.dependencies) {
      expect(ids.has(d.providerId)).toBe(true);
      expect(ids.has(d.consumerId)).toBe(true);
    }
    for (const it of ws.items) {
      if (it.status === "done") expect(it.doneAt).toBeDefined();
      if (it.doneAt) expect(it.doneAt <= DEMO_NOW.toISOString()).toBe(true);
    }
    expect(new Set(ws.teams.map((t) => t.source))).toEqual(new Set(["jira", "ado"]));
  });

  it("is deterministic", () => {
    expect(JSON.stringify(demoWorkspace())).toBe(JSON.stringify(ws));
  });

  it("computes every built-in metric on the demo data", () => {
    for (const def of reg.list()) {
      const out = reg.run({ id: def.key, title: def.label, metric: def.key, viz: "bar" }, ctx);
      expect("error" in out ? out.error : null).toBeNull();
    }
  });

  it("flow velocity counts finished items per iteration", () => {
    const out = reg.run({ id: "v", title: "v", metric: "flow-velocity", viz: "line", filters: { incrementId: "pi-26-3", level: "story" } }, ctx);
    if ("error" in out) throw new Error(out.error);
    expect(out.result.points).toHaveLength(7);
    expect(out.result.points.reduce((s, p) => s + p.value, 0)).toBe(64);
  });

  it("predictability uses committed planned value and all actual value", () => {
    const out = reg.run({ id: "p", title: "p", metric: "predictability", viz: "bar", groupBy: "team", filters: { incrementId: "pi-26-3" } }, ctx);
    if ("error" in out) throw new Error(out.error);
    const objs = ws.objectives.filter((o) => o.incrementId === "pi-26-3");
    const planned = objs.filter((o) => o.committed).reduce((s, o) => s + o.plannedValue, 0);
    const actual = objs.reduce((s, o) => s + (o.actualValue ?? 0), 0);
    expect(out.result.value).toBeCloseTo((actual / planned) * 100, 0);
    expect(out.result.points).toHaveLength(4);
  });

  it("finds the critical dependency in the demo", () => {
    const out = reg.run({ id: "d", title: "d", metric: "dependency-health", viz: "kpi" }, ctx);
    if ("error" in out) throw new Error(out.error);
    expect(out.result.value).toBeGreaterThanOrEqual(1);
  });

  it("reports unknown metrics and bad groupings as widget errors", () => {
    expect(reg.run({ id: "x", title: "x", metric: "nope", viz: "kpi" }, ctx)).toMatchObject({ error: expect.stringContaining("Unknown") });
    expect(reg.run({ id: "x", title: "x", metric: "risk-roam", viz: "kpi", groupBy: "team" }, ctx)).toMatchObject({ error: expect.stringContaining("cannot be grouped") });
    expect(() => reg.register(FLOW_METRICS[0]!)).toThrow(/already registered/);
  });

  it("percentile interpolates", () => {
    expect(percentile([], 50)).toBeNull();
    expect(percentile([1, 2, 3, 4], 50)).toBe(2.5);
    expect(percentile([5, 1, 3], 100)).toBe(5);
  });
});

describe("lean portfolio", () => {
  const ws = demoWorkspace();
  const p = ws.portfolio!;

  it("ranks epics by WSJF with smaller jobs first on ties", () => {
    expect(wsjf({ userBusinessValue: 13, timeCriticality: 8, riskReductionOpportunity: 3, jobSize: 8 })).toBe(3);
    expect(wsjf({ userBusinessValue: 1, timeCriticality: 1, riskReductionOpportunity: 1, jobSize: 0 })).toBe(0);
    const ranked = rankEpics([
      { ...p.epics[0]!, id: "a", wsjf: { userBusinessValue: 4, timeCriticality: 4, riskReductionOpportunity: 2, jobSize: 5 } },
      { ...p.epics[0]!, id: "b", wsjf: { userBusinessValue: 8, timeCriticality: 8, riskReductionOpportunity: 4, jobSize: 10 } },
      { ...p.epics[0]!, id: "done", state: "done" },
    ]);
    expect(ranked.map((e) => e.id)).toEqual(["a", "b"]);
    expect(rankEpics(p.epics)[0]!.id).toBe("pe-observability");
  });

  it("computes budget lines per value stream and increment", () => {
    const lines = budgetLines(p, ws.increments);
    const curr = lines.find((l) => l.incrementId === "pi-26-4")!;
    expect(curr).toMatchObject({ budget: 950_000, planned: 980_000, state: "over" });
    expect(curr.plannedPercent).toBeCloseTo(103.2, 1);
    const prev = lines.find((l) => l.incrementId === "pi-26-3")!;
    expect(prev).toMatchObject({ planned: 680_000, actual: 680_000, state: "ok" });
    const unfunded = budgetLines({ ...p, valueStreams: [{ ...p.valueStreams[0]!, budgets: {} }] }, ws.increments)[0]!;
    expect(unfunded.state).toBe("unfunded");
    expect(unfunded.plannedPercent).toBeNull();
  });

  it("flags guardrail breaches", () => {
    const curr = ws.increments[1]!;
    const breaches = checkGuardrails(p, curr, ws.items);
    expect(breaches.map((b) => b.rule)).toEqual([]);
    const strict: Portfolio = {
      ...p,
      valueStreams: [{ ...p.valueStreams[0]!, guardrails: { maxEpicBudgetPercent: 40, businessCaseAbove: 50_000, minEnablerPercent: 90 } }],
    };
    const rules = checkGuardrails(strict, curr, ws.items);
    expect(rules.map((b) => b.rule)).toEqual(expect.arrayContaining(["maxEpicBudgetPercent", "minEnablerPercent", "businessCaseAbove"]));
    expect(rules.find((b) => b.rule === "businessCaseAbove")?.epicId).toBe("pe-observability");
    // The previous PI's stories are not parented under an epic, so the enabler floor has nothing to judge.
    expect(checkGuardrails(strict, ws.increments[0]!, ws.items).map((b) => b.rule)).not.toContain("minEnablerPercent");
  });

  it("measures OKR progress from typed values and metrics", () => {
    const okr = p.okrs[0]!;
    const pr = okrProgress(okr, (key) => (key === "flow-time" ? 4.5 : null));
    expect(pr.keyResults[0]!.percent).toBe(45);
    expect(pr.keyResults[1]!.percent).toBe(50);
    expect(pr.percent).toBe(48);
    const none = okrProgress(okr, () => null);
    expect(none.keyResults[1]!.percent).toBeNull();
    expect(none.percent).toBe(45);
    expect(okrProgress({ ...okr, keyResults: [{ id: "k", title: "k", baseline: 5, target: 5, current: 5 }] }, () => null).percent).toBeNull();
  });

  it("portfolio metrics run in the registry", () => {
    const reg = new MetricRegistry([...FLOW_METRICS, ...PORTFOLIO_METRICS]);
    const ctx = { workspace: ws, now: DEMO_NOW, extensions: {} };
    for (const key of ["budget-used", "epic-wsjf", "okr-progress"]) {
      const out = reg.run({ id: key, title: key, metric: key, viz: "bar" }, ctx);
      expect("error" in out ? out.error : null).toBeNull();
    }
    const noPortfolio = reg.run({ id: "b", title: "b", metric: "budget-used", viz: "kpi" }, { ...ctx, workspace: { ...ws, portfolio: undefined } });
    expect(noPortfolio).toMatchObject({ error: "This workspace has no portfolio yet." });
  });
});
