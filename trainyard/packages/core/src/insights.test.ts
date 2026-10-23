import { describe, expect, it } from "vitest";
import { demoInsights, initiativeView, insightIssues, measureSeries, measureView, onePager, type InsightsState } from "./insights.js";

describe("outcomes across systems", () => {
  const s = demoInsights();

  it("builds monthly series from one source, filtered, and combines two sources period by period", () => {
    const active = measureSeries(s, "m-active");
    expect(active.series).toHaveLength(12);
    expect(active.series[0]!.period).toBe("2025-11");
    expect(active.sourceIds).toEqual(["lms"]);
    // Only low and lower-middle income rows count toward LMIC reach.
    const reach = measureView(s, "m-lmic-reach");
    expect(reach.sources.map((x) => x.id)).toEqual(["crm"]);
    expect(reach.current!).toBeLessThan(measureSeries(s, "m-active").series.at(-1)!.value);
    // Cost per completion = finance ÷ learning platform.
    const cost = measureView(s, "m-cost-completion");
    expect(cost.sources.map((x) => x.id).sort()).toEqual(["finance", "lms"]);
    expect(cost.unit).toBe("$");
    expect(cost.status).toBe("off-target");
    // Knowledge gain = post − pre.
    const gain = measureView(s, "m-gain");
    expect(gain.current!).toBeGreaterThan(18);
    expect(gain.status).toBe("on-target");
    expect(gain.trend).toBe("better");
  });

  it("reports a measure that points at a missing source or itself instead of failing the page", () => {
    const broken: InsightsState = { ...s, measures: [...s.measures, { id: "bad", name: "Bad", role: "kpi", formula: { kind: "field", sourceId: "nope", field: "x", aggregate: "sum" }, unit: "", higherIsBetter: true }, { id: "loop", name: "Loop", role: "kpi", formula: { kind: "ratio", a: "loop", b: "m-active" }, unit: "", higherIsBetter: true }] };
    expect(measureView(broken, "bad").error).toContain("no source");
    expect(measureView(broken, "loop").error).toContain("itself");
    expect(insightIssues(broken).some((i) => i.startsWith("Bad:"))).toBe(true);
  });

  it("rolls objectives and funding up into the one-pager for an entity and everything under it", () => {
    const org = onePager(s, "org");
    expect(org.scope.map((e) => e.id)).toEqual(["org", "education", "foundation"]);
    expect(org.objectives).toHaveLength(2);
    expect(org.totals.outcomes).toBe(5);
    expect(org.initiatives).toHaveLength(3);
    expect(org.funding.committed).toBe(5_020_000);
    expect(org.sources.map((x) => x.id).sort()).toEqual(["crm", "finance", "grants", "jira", "lms", "survey"]);
    const edu = onePager(s, "education");
    expect(edu.objectives).toHaveLength(1);
    expect(edu.initiatives.map((i) => i.initiative.id)).toEqual(["init-modules", "init-portal"]);
    expect(() => onePager(s, "nope")).toThrow();
  });

  it("tracks funding per initiative: spend from the ledger over the dates, burn against time, funders and cost per outcome", () => {
    const modules = initiativeView(s, "init-modules");
    expect(modules.spentFrom).toBe("measure");
    expect(modules.spent).toBeGreaterThan(1_500_000);
    expect(modules.burn).toBeLessThan(1);
    expect(modules.pace).toBe("on-pace");
    expect(modules.unfunded).toBe(0);
    expect(modules.costPerOutcome?.measure).toBe("Completions");
    expect(modules.costPerOutcome!.value).toBeGreaterThan(50);
    const yia = initiativeView(s, "init-yia");
    expect(yia.spent).toBe(1_400_000);
    expect(yia.unfunded).toBe(300_000);
    expect(yia.costPerOutcome?.measure).toBe("Grants awarded");
    expect(yia.costPerOutcome!.value).toBe(50_000);
    const portal = initiativeView(s, "init-portal");
    expect(portal.spentFrom).toBe("none");
    expect(portal.pace).toBe("unknown");
    const issues = insightIssues(s);
    expect(issues.some((i) => i.includes("Young Investigator") && i.includes("no funder"))).toBe(true);
    // A typed-in spend when there is no ledger.
    const manual = initiativeView({ ...s, initiatives: [{ ...s.initiatives![2]!, spentManual: 100_000 }] }, "init-portal");
    expect(manual.spentFrom).toBe("manual");
    expect(manual.remaining).toBe(320_000);
  });
});
