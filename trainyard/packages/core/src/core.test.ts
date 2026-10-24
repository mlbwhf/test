import { describe, expect, it } from "vitest";
import {
  DEMO_NOW,
  FLOW_METRICS,
  MetricRegistry,
  PORTFOLIO_METRICS,
  boardShape,
  budgetLines,
  emptyBoard,
  instantiate,
  mapBoard,
  templateFrom,
  type Board,
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
  rankByWsjf,
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
    expect(r.checks.find((c) => c.key === "wsjf")!.ok).toBe(false);
    const ranked = rankByWsjf([
      { ...item("low", undefined, 3), wsjf: { userBusinessValue: 2, timeCriticality: 1, riskReductionOpportunity: 1, jobSize: 8 } },
      item("none", undefined, 3),
      { ...item("high", undefined, 3), wsjf: { userBusinessValue: 8, timeCriticality: 5, riskReductionOpportunity: 3, jobSize: 4 } },
    ]);
    expect(ranked.map((i) => [i.id, i.wsjfScore])).toEqual([["high", 4], ["low", 0.5], ["none", null]]);
    expect(ranked[0]!.costOfDelay).toBe(16);
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

describe("boards", () => {
  const now = "2026-10-21T12:00:00.000Z";
  const canvas: Board = {
    ...emptyBoard("b-miro", "PI board", { system: "miro", externalId: "uXj", url: "https://miro.com/app/board/uXj", importedAt: now }),
    frames: [
      { id: "f-chk", title: "Checkout", x: 0, y: 0, width: 800, height: 400 },
      { id: "f-pay", title: "Payments", x: 900, y: 0, width: 800, height: 400 },
      { id: "f-risks", title: "Risks", x: 0, y: 500, width: 800, height: 300 },
    ],
    nodes: [
      { id: "n1", kind: "sticky", text: "Guest checkout", x: 10, y: 10, color: "#fff9b1", frameId: "f-chk", tags: [], fields: {} },
      { id: "n2", kind: "sticky", text: "Wallet tokens", x: 910, y: 10, color: "light_blue", frameId: "f-pay", tags: [], fields: {} },
      { id: "n3", kind: "sticky", text: "Card network cert may slip", x: 10, y: 510, color: "#f24726", frameId: "f-risks", tags: [], fields: {} },
      { id: "n4", kind: "sticky", text: "", x: 50, y: 50, frameId: "f-chk", tags: [], fields: {} },
      { id: "n5", kind: "text", text: "Loose note", x: 2000, y: 2000, tags: [], fields: {} },
    ],
    edges: [
      { id: "e1", fromId: "n2", toId: "n1", label: "needs tokens" },
      { id: "e2", fromId: "n3", toId: "n1" },
    ],
  };
  const table: Board = {
    ...emptyBoard("b-monday", "Roadmap", { system: "monday", externalId: "123", importedAt: now }),
    columns: [
      { id: "name", title: "Item" },
      { id: "c-team", title: "Team", type: "dropdown" },
      { id: "c-status", title: "Status", type: "status" },
      { id: "c-pts", title: "Points", type: "numbers" },
      { id: "c-sprint", title: "Sprint", type: "text" },
    ],
    groups: [
      { id: "g1", title: "PI 26.4" },
      { id: "g2", title: "Later" },
    ],
    rows: [
      { id: "r1", groupId: "g1", cells: { name: "Semantic search", "c-team": "Search & Discovery", "c-status": "Working on it", "c-pts": "13", "c-sprint": "PI 26.4.2" } },
      { id: "r2", groupId: "g1", cells: { name: "Facet fix", "c-team": "Search & Discovery", "c-status": "Done", "c-pts": 3 } },
      { id: "r3", groupId: "g2", cells: { name: "", "c-team": "Nobody" } },
      { id: "r4", groupId: "g2", cells: { name: "New thing", "c-team": "Growth" } },
    ],
  };
  const ws = demoWorkspace();
  const ctx = { teams: ws.teams, iterations: ws.increments.flatMap((i) => i.iterations), groupId: "art-customer", now };

  it("tells canvas from table boards", () => {
    expect(boardShape(canvas)).toBe("canvas");
    expect(boardShape(table)).toBe("table");
    expect(boardShape(emptyBoard("x", "x", canvas.origin))).toBe("empty");
  });

  it("makes a template that keeps structure and drops content, then instantiates it with fresh ids", () => {
    const t = templateFrom(canvas, "tpl-1", "PI board template", now);
    expect(t.isTemplate).toBe(true);
    expect(t.frames.map((f) => f.title)).toEqual(["Checkout", "Payments", "Risks"]);
    expect(t.nodes).toHaveLength(3);
    expect(t.nodes.every((n) => n.text === "" && n.fields.placeholder === true)).toBe(true);
    expect(t.edges).toEqual([]);
    const tt = templateFrom(table, "tpl-2", "Roadmap template", now);
    expect(tt.columns).toHaveLength(5);
    expect(tt.rows).toEqual([]);
    const b = instantiate(t, "b-new", "PI 26.5 board", now);
    expect(b.templateId).toBe("tpl-1");
    expect(b.frames[0]!.id).toBe("b-new:f-chk");
    expect(b.nodes[0]!.frameId).toBe("b-new:f-chk");
    b.frames[0]!.title = "changed";
    expect(t.frames[0]!.title).toBe("Checkout");
  });

  it("maps canvas cards to items, risks and dependencies by frame and colour", () => {
    const r = mapBoard(canvas, { from: "nodes", level: "feature", team: { by: "frame" }, colorRules: [{ color: "f24726", as: "risk" }, { color: "light_blue", as: "enabler" }], edgesAsDependencies: true }, ctx);
    expect(r.items.map((i) => [i.title, i.teamId, i.flowType])).toEqual([
      ["Guest checkout", "t-checkout", "feature"],
      ["Wallet tokens", "t-payments", "enabler"],
      ["Loose note", undefined, "feature"],
    ]);
    expect(r.risks.map((x) => x.title)).toEqual(["Card network cert may slip"]);
    expect(r.dependencies).toEqual([{ id: "b-miro:e1", providerId: "b-miro:n2", consumerId: "b-miro:n1", status: "open", note: "needs tokens" }]);
    expect(r.skipped).toEqual([{ id: "n4", reason: "empty text" }, { id: "e2", reason: "connector between non-items" }]);
    expect(r.warnings).toEqual([]);
    const loose = mapBoard({ ...canvas, nodes: [{ id: "n9", kind: "sticky", text: "Orphan", x: 0, y: 0, frameId: "f-risks", tags: [], fields: {} }] }, { from: "nodes", level: "feature", team: { by: "frame" } }, ctx);
    expect(loose.warnings.join(" ")).toContain('"Risks" matches no team');
    expect(r.items[0]!.source.url).toBe("https://miro.com/app/board/uXj");
  });

  it("maps table rows with columns, groups, status words and missing teams", () => {
    const r = mapBoard(table, { from: "rows", level: "feature", titleColumn: "Item", team: { by: "column", column: "Team" }, iteration: { by: "column", column: "Sprint" }, estimateColumn: "Points", statusColumn: "Status", createMissingTeams: true }, ctx);
    expect(r.items.map((i) => [i.title, i.teamId, i.status, i.estimate, i.iterationId])).toEqual([
      ["Semantic search", "t-search", "in_progress", 13, "pi-26-4.2"],
      ["Facet fix", "t-search", "done", 3, undefined],
      ["New thing", "t-growth", "todo", undefined, undefined],
    ]);
    expect(r.items[1]!.doneAt).toBe(now);
    expect(r.newTeams.map((t) => t.name)).toEqual(["Growth"]);
    expect(r.skipped).toEqual([{ id: "r3", reason: "empty title" }]);
    const byGroup = mapBoard(table, { from: "rows", level: "story", iteration: { by: "group" } }, ctx);
    expect(byGroup.items[0]!.iterationId).toBeUndefined();
    expect(byGroup.items[0]!.level).toBe("story");
    expect(mapBoard({ ...table, columns: [] }, { from: "rows", level: "x" }, ctx).warnings[0]).toMatch(/no columns/);
  });
});
