import { describe, expect, it } from "vitest";
import { artFit, demoIdentification, demoMap, identificationIssues, mapMetrics, stepImpact } from "./valuestreams.js";

describe("value stream mapping", () => {
  it("reproduces SAFe's feature-to-production totals for the current state", () => {
    const m = mapMetrics(demoMap(), "current");
    expect(m.totalActive).toBe(98);
    expect(m.totalWait).toBe(1796);
    expect(Math.round(m.flowEfficiency * 100)).toBe(5);
    expect(Math.round(m.rolledCA * 100)).toBe(35);
    expect(m.bottleneck).toMatchObject({ name: "Deploy to prod", wait: 999 });
    expect(m.ranking[0]!.name).toBe("Deploy to prod");
  });

  it("shows the future state is shorter and more efficient", () => {
    const cur = mapMetrics(demoMap(), "current");
    const fut = mapMetrics(demoMap(), "future");
    expect(fut.leadTime).toBeLessThan(cur.leadTime / 10);
    expect(fut.flowEfficiency).toBeGreaterThan(0.5);
    expect(fut.rolledCA).toBeGreaterThan(cur.rolledCA);
  });

  it("handles an empty map", () => {
    expect(mapMetrics({ steps: [] }, "current")).toMatchObject({ leadTime: 0, flowEfficiency: 0, rolledCA: 0 });
  });
});

describe("value stream identification", () => {
  it("traces a step to its systems, people and trains", () => {
    const vsi = demoIdentification();
    const quote = stepImpact(vsi, "quote");
    expect(quote.systems.map((s) => s.id)).toEqual(["los"]);
    expect(quote.people).toBe(280);
    expect(quote.arts.map((a) => a.name)).toEqual(["Loan Origination"]);
    expect(stepImpact(vsi, "terms").verdict).toContain("Core Banking");
  });

  it("checks train sizes against 50 to 125 and flags gaps", () => {
    expect([artFit(30), artFit(100), artFit(150)]).toEqual(["merge", "fits", "split"]);
    const vsi = demoIdentification();
    expect(identificationIssues(vsi).map((i) => i.kind)).toEqual(["art-size"]);
    vsi.steps.push({ id: "x", name: "Refinance", actor: "customer" });
    expect(identificationIssues(vsi).some((i) => i.kind === "orphan-step")).toBe(true);
  });
});
