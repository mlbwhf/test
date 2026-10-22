import { describe, expect, it } from "vitest";
import { CANVAS_TYPES, wsjfOf, artCanvasFrom, canvasChevrons, demoCanvases, dvsCanvasFrom, emptyCanvas, futureStateFrom, launchReadiness, towsSuggestions, type TableRow } from "./canvases.js";
import { deriveMapFromHistory, historiesFromRows, suggestMapping } from "./flowhistory.js";
import { demoIdentification } from "./valuestreams.js";

const NOW = "2026-03-01T00:00:00.000Z";

describe("canvases", () => {
  it("lays every canvas type out on a 12-column grid", () => {
    for (const t of CANVAS_TYPES) {
      for (const s of t.sections) expect(Number.isInteger(s.span) && s.span >= 1 && s.span <= 12, `${t.id}.${s.key}`).toBe(true);
      const c = emptyCanvas(t.id, "x", "x", NOW);
      expect(Object.keys(c.fields).sort(), t.id).toEqual(t.sections.filter((s) => s.kind !== "chevrons").map((s) => s.key).sort());
    }
  });

  it("computes cost of delay and WSJF", () => {
    expect(wsjfOf({ "User / business value": "8", "Time criticality": "5", "Risk reduction / opportunity enablement": "3", "Job size": "5" })).toEqual({ cod: 16, size: 5, wsjf: 3.2 });
    expect(wsjfOf({}).wsjf).toBeNull();
  });

  it("prefills development value stream and ART canvases from an identification", () => {
    const vsi = demoIdentification();
    const dvs = dvsCanvasFrom(vsi, "dvs-origination", "c1", NOW);
    expect(dvs.fields.people).toEqual(["20 · Paris", "80 · Redmond · Atlanta", "200 · Bangalore · Delhi", "30 · Estonia"]);
    expect((dvs.fields.arts as string[]).length).toBe(3);
    expect(canvasChevrons(dvs, vsi, "operational")).toEqual(["Attract customer", "Quick rate quote", "Complete loan application", "Eligibility decision and underwriting"]);
    const art = artCanvasFrom(vsi, "art-credit", "c2", NOW);
    expect(art.fields.solution).toEqual(["Credit scoring system: eligibility and risk"]);
    expect(canvasChevrons(art, vsi, "operational")).toEqual(["Eligibility decision and underwriting"]);
    expect(canvasChevrons(art, vsi, "development")).toEqual(["Channel Support", "Loan Origination", "Credit"]);
  });

  it("turns a SWOT into TOWS suggestions and a future state with a vision draft", () => {
    const swot = emptyCanvas("swot", "s", "SWOT", NOW);
    swot.fields.strengths = ["Strong mobile channel"];
    swot.fields.weaknesses = ["Slow credit decisions"];
    swot.fields.opportunities = ["Open banking APIs"];
    swot.fields.threats = ["Fintech lenders"];
    const sug = towsSuggestions(swot);
    expect(sug.map((s) => s.quadrant)).toEqual(["so", "st", "wo", "wt"]);
    expect(sug[0]!.text).toBe("Use strong mobile channel to capture open banking APIs");

    const tows = emptyCanvas("tows", "t", "TOWS", NOW);
    tows.fields.so = ["Launch an open-banking loan offer in the app"];
    tows.fields.wt = ["Automate credit decisions to match fintech speed"];
    const current = emptyCanvas("portfolio-canvas", "p", "Lending portfolio (current state)", NOW);
    current.fields.valueProps = [{ id: "r1", cells: { "Value stream": "Consumer loans", Solutions: "Loan origination", "Customer segments": "Retail customers" } }] as TableRow[];
    const { canvas, vision } = futureStateFrom(current, tows, { canvas: "pf", vision: "pv" }, NOW);
    expect(canvas.state).toBe("future");
    expect(canvas.title).toBe("Lending portfolio (future state)");
    expect(canvas.fields.changes).toEqual(["Launch an open-banking loan offer in the app", "Automate credit decisions to match fintech speed"]);
    expect(current.fields.changes).toEqual([]);
    expect(vision.fields.themes).toEqual(["Launch an open-banking loan offer in the app"]);
    expect((vision.fields.statement as Record<string, string>).For).toBe("Retail customers");
  });

  it("scores launch readiness against the date-certain week", () => {
    const [, launch] = demoCanvases(undefined);
    const start = (launch!.fields.timeline as { start: string }).start;
    expect(start).toBe("2025-12-08");
    const early = launchReadiness(launch!, start);
    expect(early).toMatchObject({ done: 6, total: 12, weeksLeft: 9, verdict: "on-track" });
    const late = launchReadiness(launch!, "2026-02-02");
    expect(late.verdict).toBe("at-risk");
    expect(late.openByLane[0]!.name).toBe("Agile teams, system team and ART roles");
  });
});

describe("value stream map from status history", () => {
  const rows = [
    // Item A: 2h ready, 8h dev, 1h ready for test, 4h test, back to dev 2h, test 1h, done.
    ["A", "Ready for dev", "2026-01-05T08:00:00Z"], ["A", "In dev", "2026-01-05T10:00:00Z"], ["A", "Ready for test", "2026-01-05T18:00:00Z"],
    ["A", "In test", "2026-01-05T19:00:00Z"], ["A", "In dev", "2026-01-05T23:00:00Z"], ["A", "In test", "2026-01-06T01:00:00Z"], ["A", "Done", "2026-01-06T02:00:00Z"],
    // Item B: 4h ready, 6h dev, 3h ready for test, 2h test, done.
    ["B", "Ready for dev", "2026-01-05T08:00:00Z"], ["B", "In dev", "2026-01-05T12:00:00Z"], ["B", "Ready for test", "2026-01-05T18:00:00Z"],
    ["B", "In test", "2026-01-05T21:00:00Z"], ["B", "Done", "2026-01-05T23:00:00Z"],
  ].map(([item, status, at]) => ({ item: item!, status: status!, at: at! }));
  const histories = historiesFromRows(rows);

  it("suggests steps from the statuses' usual order", () => {
    expect(suggestMapping(histories)).toEqual([
      { name: "Dev", wait: ["Ready for dev"], active: ["In dev"] },
      { name: "Test", wait: ["Ready for test"], active: ["In test"] },
    ]);
  });

  it("computes wait, active and %C&A per step", () => {
    const d = deriveMapFromHistory(histories, suggestMapping(histories), { unit: "hours", stat: "mean" });
    expect(d.items).toBe(2);
    expect(d.steps[0]).toMatchObject({ name: "Dev", measure: { wait: 3, active: 8, ca: 50 }, sample: { items: 2, reworked: 1, passed: 2 } });
    expect(d.steps[1]).toMatchObject({ name: "Test", measure: { wait: 2, active: 3.5, ca: 100 } });
    expect(d.unmapped).toEqual([{ status: "Done", count: 2 }]);
    const med = deriveMapFromHistory(histories, suggestMapping(histories), { unit: "hours" });
    expect(med.steps[0]!.measure.active).toBe(8);
  });

  it("only counts time inside the window", () => {
    const d = deriveMapFromHistory(histories, suggestMapping(histories), { unit: "hours", stat: "mean", until: "2026-01-05T12:00:00Z" });
    expect(d.steps[0]!.measure.wait).toBe(3);
    expect(d.steps[0]!.measure.active).toBe(1); // A worked 2h before noon; B started at noon
  });
});
