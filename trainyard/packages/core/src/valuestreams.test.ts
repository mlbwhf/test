import { describe, expect, it } from "vitest";
import { OVS_TYPES, artFit, demoIdentification, demoMap, devStreamPeople, identificationFromType, identificationIssues, mapMetrics, stepImpact } from "./valuestreams.js";

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

  it("seeds an identification from an operational value stream type and counts a development value stream's people by group", () => {
    expect(OVS_TYPES.map((t) => t.id)).toEqual(["fulfilment", "manufacturing", "software-product", "supporting"]);
    const mfg = identificationFromType(OVS_TYPES[1]!, "vsi-x", "2026-01-01T00:00:00.000Z");
    expect(mfg.type).toBe("manufacturing");
    expect(mfg.steps.map((s) => s.name)).toEqual(["Procure materials", "Manage inventory", "Manufacture subassemblies", "Assemble final product", "Validate product", "Package and ship"]);
    expect(mfg.steps[0]!.people).toBe("Purchasing");
    expect(mfg.valueToCustomer).toBe("Vehicle");
    const vsi = demoIdentification();
    // Origination: the groups behind its systems plus legal and marketing attached directly.
    const o = devStreamPeople(vsi, "dvs-origination");
    expect(o.groups.map((g) => g.id)).toEqual(["g-paris", "g-us", "g-india", "g-estonia", "g-legal", "g-marketing"]);
    expect(o.people).toBe(20 + 80 + 200 + 30 + 5 + 13);
    expect(vsi.steps[0]!.people).toBe("Marketing, Sales");
    expect(vsi.arts.find((a) => a.id === "art-core")!.topology).toBe("platform");
  });
});

describe("value stream type examples", () => {
  it("seeds each SAFe pattern with its solutions and development value streams, and switches between them", async () => {
    const { OVS_TYPES, identificationFromType, applyTypeExample, isTypeExample, identificationIssues } = await import("./valuestreams.js");
    const t = (id: string) => OVS_TYPES.find((x) => x.id === id)!;
    const mfg = identificationFromType(t("manufacturing"), "v1", "2026-10-24T00:00:00.000Z");
    expect(mfg.systems.map((s) => s.name)).toContain("Bills of material");
    expect(mfg.systems.find((s) => s.name === "Bills of material")!.stepIds).toHaveLength(2);
    expect(mfg.devStreams.map((d) => d.name)).toEqual(["Vehicle development", "Design tools platform"]);
    const sw = identificationFromType(t("software-product"), "v2", "2026-10-24T00:00:00.000Z");
    expect(sw.steps.map((s) => s.name)).toEqual(["Sales cycle", "Contracts and licensing", "Provisioning", "Customer care", "Renewals"]);
    expect(sw.devStreams.find((d) => d.name === "Business systems")!.systemIds).toHaveLength(3);
    const sup = identificationFromType(t("supporting"), "v3", "2026-10-24T00:00:00.000Z");
    expect(sup.systems[0]!.name).toBe("ERP system");
    for (const v of [mfg, sw, sup]) expect(identificationIssues(v).filter((i) => /unknown/.test(i.message))).toEqual([]);
    // Every example's systems and dev streams point at real steps and systems.
    for (const type of OVS_TYPES) for (const sy of type.example.systems ?? []) for (const st of sy.steps) expect(type.example.steps.some((x) => x.name === st)).toBe(true);
    for (const type of OVS_TYPES) for (const d of type.example.devStreams ?? []) for (const sy of d.systems) expect(type.example.systems?.some((x) => x.name === sy)).toBe(true);
    expect(isTypeExample(mfg, t("manufacturing"))).toBe(true);
    const switched = applyTypeExample(mfg, t("software-product"), "2026-10-24T01:00:00.000Z");
    expect(switched.id).toBe("v1");
    expect(switched.type).toBe("software-product");
    expect(isTypeExample({ ...mfg, steps: mfg.steps.slice(1) }, t("manufacturing"))).toBe(false);
  });
});
