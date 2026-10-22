import { describe, expect, it } from "vitest";
import { demoAgents, demoInitiatives, evaluateGate } from "@trainyard/ai-portfolio";
import { checkDependencies, demoWorkspace, getTemplate, planningReadiness } from "@trainyard/core";
import { AssistError, FakeProvider, draftObjectives, gateReviewPrompt, narrativePrompt, objectivesPrompt, readinessPrompt, reviewRisks, riskReviewPrompt } from "./index.js";

const ws = demoWorkspace();
const team = ws.teams.find((t) => t.id === "t-assist")!;
const features = ws.items.filter((i) => i.level === "feature" && i.teamId === team.id);

describe("prompts", () => {
  it("objectives prompt carries the features and no person names", () => {
    const p = objectivesPrompt(team, features, "PI 26.4");
    expect(p.user).toContain("Support reply drafting agent");
    expect(p.user).toContain("f-11 |");
    for (const person of ws.people) expect(p.user + p.system).not.toContain(person.name);
    expect(p.schema.safeParse({ objectives: [], gaps: "" }).success).toBe(false);
  });

  it("risk review prompt includes dependency checks", () => {
    const checks = checkDependencies(ws.dependencies, ws.items, ws.increments);
    const p = riskReviewPrompt(ws.risks, ws.items, ws.dependencies, checks);
    expect(p.user).toContain("CRITICAL: Wallet tokenisation -> One-page guest checkout");
    expect(p.user).toContain("r-3 | unroamed");
  });

  it("readiness prompt lists failures and overloaded cells", () => {
    const inc = ws.increments[1]!;
    const r = planningReadiness({ increment: inc, teams: ws.teams, items: ws.items.filter((i) => i.level === "feature"), plannedLevel: "feature" });
    const p = readinessPrompt(inc.name, r, [{ team: "Payments", iteration: "PI 26.4.3", load: 26, capacity: 10 }], []);
    expect(p.user).toContain("Payments | PI 26.4.3 | 26/10");
    expect(p.user).toMatch(/PASS: Every team has capacity/);
  });

  it("gate review prompt names the stage move and blockers", () => {
    const i = demoInitiatives().find((x) => x.id === "ai-support")!;
    const gate = evaluateGate(i, "pilot", { model: getTemplate("safe-ai-native"), agents: demoAgents() });
    const p = gateReviewPrompt(i, gate);
    expect(p.system).toContain("from Evaluate to Pilot");
    expect(p.user).toContain("MISSING: Evaluation report");
    expect(p.user).toContain("[sign-off]");
  });

  it("narrative prompt summarises widget outputs including errors", () => {
    const p = narrativePrompt("ART overview", [
      { widget: { id: "a", title: "Predictability", metric: "predictability", viz: "kpi" }, result: { value: 89.1, unit: "percent", points: [] } },
      { widget: { id: "b", title: "AI spend", metric: "ai-spend", viz: "kpi" }, error: "No AI portfolio data in this workspace." },
    ]);
    expect(p.user).toContain("Predictability: 89.1 percent");
    expect(p.user).toContain("AI spend: unavailable");
  });
});

describe("features with a provider", () => {
  it("returns validated drafts and records the call", async () => {
    const fake = new FakeProvider({
      "draft-objectives": { objectives: [{ title: "Deflect routine tickets with safe drafts", businessValue: 8, committed: true, featureIds: ["f-11", "f-12"], rationale: "Guardrails gate the agent." }], gaps: "" },
    });
    const res = await draftObjectives(fake, team, features, "PI 26.4");
    expect(res.data.objectives[0]!.featureIds).toEqual(["f-11", "f-12"]);
    expect(fake.calls[0]).toMatchObject({ feature: "draft-objectives" });
  });

  it("rejects answers that do not match the schema", async () => {
    const fake = new FakeProvider({ "review-risks": { summary: "x", suggestions: [{ riskId: "r-3", roam: "maybe", reason: "" }], missingRisks: [] } });
    await expect(reviewRisks(fake, ws.risks, ws.items, [], [])).rejects.toMatchObject({ code: "UNPARSEABLE" });
    await expect(draftObjectives(new FakeProvider({}), team, features, "PI")).rejects.toBeInstanceOf(AssistError);
  });
});
