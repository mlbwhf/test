import { describe, expect, it } from "vitest";
import { DEMO_NOW, MetricRegistry, demoWorkspace, forkModel, getTemplate } from "@trainyard/core";
import {
  AI_METRICS,
  GateBlockedError,
  advance,
  checkAgent,
  demoAgents,
  demoInitiatives,
  evaluateGate,
  requiredEvidence,
  spendSummary,
  valueRealised,
  type Initiative,
} from "./index.js";

const model = getTemplate("safe-ai-native");
const agents = demoAgents();
const byId = (id: string) => demoInitiatives().find((i) => i.id === id)!;

describe("required evidence", () => {
  it("accumulates and tightens for high risk", () => {
    const minimal = { riskTier: "minimal" as const, dataSources: [] };
    const high = { riskTier: "high" as const, dataSources: [] };
    expect(requiredEvidence(minimal, "data")).toEqual(["value-hypothesis"]);
    expect(requiredEvidence(minimal, "pilot")).toEqual(["value-hypothesis", "data-provenance", "model-card", "eval-report", "human-oversight-plan"]);
    expect(requiredEvidence(high, "pilot")).toContain("red-team");
    expect(requiredEvidence(high, "production")).toContain("conformity-assessment");
  });

  it("asks for a privacy assessment when personal data is used", () => {
    const i = { riskTier: "minimal" as const, dataSources: [{ name: "x", provenance: "internal" as const, personalData: true, curated: true }] };
    expect(requiredEvidence(i, "data")).not.toContain("privacy-assessment");
    expect(requiredEvidence(i, "experiment")).toContain("privacy-assessment");
  });
});

describe("stage gates", () => {
  it("blocks a failing eval and a missing sign-off", () => {
    const g = evaluateGate(byId("ai-support"), "pilot", { model, agents });
    expect(g.allowed).toBe(false);
    const codes = g.blockers.map((b) => b.code);
    expect(codes).toContain("eval");
    expect(codes).toContain("sign-off");
    expect(codes).toContain("evidence");
    expect(g.blockers.find((b) => b.code === "eval")!.message).toMatch(/Policy violations.*2.4.*at most 1/);
    expect(g.evidence.find((e) => e.kind === "eval-report")).toMatchObject({ present: false });
  });

  it("passes once evidence, evals and sign-off are in place", () => {
    const i = byId("ai-support");
    const fixed: Initiative = {
      ...i,
      evidence: [...i.evidence, { kind: "eval-report", url: "u", addedBy: "p", addedAt: "t" }],
      evals: i.evals.map((m) => ({ ...m, latest: m.direction === "max" ? 0.5 : m.latest! })),
      signOffs: [{ stage: "pilot", by: "p-ava", role: "ai-value-architect", at: "t" }],
    };
    const g = evaluateGate(fixed, "pilot", { model, agents });
    expect(g.blockers).toEqual([]);
    const moved = advance(fixed, "pilot", { model, agents }, "2026-10-21T00:00:00Z");
    expect(moved.stage).toBe("pilot");
    expect(moved.stageHistory.at(-1)).toEqual({ stage: "pilot", at: "2026-10-21T00:00:00Z" });
    expect(fixed.stage).toBe("evaluate");
  });

  it("does not ask for sign-off when the model does not use the role", () => {
    const plain = forkModel(getTemplate("safe-portfolio"), "p", { aiNative: { enabled: true } });
    const g = evaluateGate(byId("ai-support"), "pilot", { model: plain, agents });
    expect(g.blockers.map((b) => b.code)).not.toContain("sign-off");
  });

  it("asks for sign-off only at pilot and production", () => {
    expect(evaluateGate(byId("ai-fraud"), "monitor", { model, agents }).allowed).toBe(true);
  });

  it("requires curated data before experimenting", () => {
    const g = evaluateGate(byId("ai-returns"), "experiment", { model, agents });
    expect(g.blockers.some((b) => b.code === "data-curation" && b.message.includes("Returns comments"))).toBe(true);
  });

  it("allows one step at a time and never blocks moving back or retiring", () => {
    const i = byId("ai-contracts");
    expect(evaluateGate(i, "experiment", { model, agents }).blockers.map((b) => b.code)).toContain("skip");
    const prod = byId("ai-fraud");
    expect(evaluateGate(prod, "evaluate", { model, agents }).allowed).toBe(true);
    expect(evaluateGate({ ...byId("ai-credit"), riskTier: "prohibited" }, "retired", { model, agents }).allowed).toBe(true);
  });

  it("stops prohibited uses and retired initiatives from moving forward", () => {
    expect(evaluateGate({ ...byId("ai-contracts"), riskTier: "prohibited" }, "data", { model, agents }).blockers.map((b) => b.code)).toContain("prohibited");
    expect(evaluateGate({ ...byId("ai-contracts"), stage: "retired" }, "idea", { model, agents }).allowed).toBe(true);
  });

  it("requires a human on or in the loop for high-risk pilots", () => {
    const i: Initiative = { ...byId("ai-credit"), stage: "evaluate", oversight: "out-of-loop" };
    expect(evaluateGate(i, "pilot", { model, agents }).blockers.map((b) => b.code)).toContain("oversight");
  });

  it("checks the initiative's agents from pilot on", () => {
    const i: Initiative = { ...byId("ai-credit"), stage: "evaluate", agentIds: ["agent-triage"] };
    const msgs = evaluateGate(i, "pilot", { model, agents }).blockers.filter((b) => b.code === "agent").map((b) => b.message);
    expect(msgs.join(" ")).toMatch(/Ticket triage: high-risk work allows autonomy up to 2/);
  });

  it("throws a typed error when advancing through a blocked gate", () => {
    expect(() => advance(byId("ai-support"), "pilot", { model, agents }, "t")).toThrow(GateBlockedError);
  });
});

describe("agents", () => {
  it("needs an accountable human and respects the autonomy limit", () => {
    const pi = agents.find((a) => a.id === "agent-pi-prep")!;
    expect(checkAgent(pi, model)).toEqual(["name the human accountable for this agent."]);
    const capped = forkModel(model, "m", { aiNative: { maxAgentAutonomy: 2 } });
    expect(checkAgent(agents.find((a) => a.id === "agent-triage")!, capped)[0]).toMatch(/above this model's limit of 2/);
    const noAgents = forkModel(model, "m2", { aiNative: { agentsAsTeamMembers: false } });
    expect(checkAgent(agents.find((a) => a.id === "agent-reply")!, noAgents)).toContain("this operating model does not allow agents as team members.");
  });
});

describe("spend and value", () => {
  it("projects month-end spend", () => {
    const s = spendSummary(byId("ai-fraud"), DEMO_NOW);
    expect(s.spent).toBe(6100);
    expect(s.state).toBe("over");
    const support = spendSummary(byId("ai-support"), DEMO_NOW);
    expect(support.spent).toBe(6000);
    // 6000 over 20.5 days, projected to 31 days.
    expect(support.forecast).toBe(Math.round((6000 / 20.5) * 31));
    expect(support.state).toBe("watch");
  });

  it("measures progress from baseline to target, including KPIs that go down", () => {
    expect(valueRealised(byId("ai-support"))).toBe(35);
    expect(valueRealised(byId("ai-credit"))).toBeNull();
    expect(valueRealised({ ...byId("ai-support"), kpis: [{ name: "k", baseline: 10, target: 5, current: 20 }] })).toBe(0);
  });
});

describe("AI metrics", () => {
  it("run in the shared registry", () => {
    const reg = new MetricRegistry();
    for (const m of AI_METRICS) reg.register(m);
    const ctx = { workspace: demoWorkspace(), now: DEMO_NOW, extensions: { ai: { model, initiatives: demoInitiatives(), agents } } };
    for (const m of AI_METRICS) {
      const out = reg.run({ id: m.key, title: m.label, metric: m.key, viz: "bar" }, ctx);
      expect("error" in out ? out.error : null).toBeNull();
    }
    const stage = reg.run({ id: "s", title: "s", metric: "ai-stage-mix", viz: "bar" }, ctx);
    if ("error" in stage) throw new Error(stage.error);
    expect(stage.result.value).toBe(6);
    const noAi = reg.run({ id: "s", title: "s", metric: "ai-spend", viz: "kpi" }, { ...ctx, extensions: {} });
    expect(noAi).toMatchObject({ error: "No AI portfolio data in this workspace." });
  });
});
