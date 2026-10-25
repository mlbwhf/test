import { describe, expect, it } from "vitest";
import { epicWsjf, rankEpics, wsjfColumnGaps, type PortfolioEpic } from "./portfolio.js";
import { rankByWsjf } from "./planning.js";

const epic = (id: string, cod: [number, number, number], cost?: number, jobSize = 5): PortfolioEpic => ({ id, title: id, valueStreamId: "vs", state: "analyzing", wsjf: { userBusinessValue: cod[0], timeCriticality: cod[1], riskReductionOpportunity: cod[2], jobSize }, spend: [], ...(cost ? { cost } : {}) });

describe("WSJF", () => {
  it("divides an epic's cost of delay by its cost normalised to the cheapest epic", () => {
    // The Scaled Agile example: 0.5M → 1.0, 1.5M → 3.0, 4.6M → 9.2, 5.6M → 11.2, 7.2M → 14.4.
    const epics = [epic("#6", [5, 3, 2], 500_000), epic("#7", [13, 8, 3], 1_500_000), epic("#3", [20, 13, 8], 4_600_000), epic("#8", [8, 5, 13], 5_600_000), epic("#5", [20, 20, 13], 7_200_000)];
    const s = epicWsjf(epics);
    expect(epics.map((e) => (s.get(e.id)!.denominator as { normalized: number }).normalized)).toEqual([1, 3, 9.2, 11.2, 14.4]);
    expect(s.get("#6")!.score).toBe(10);
    expect(s.get("#7")!.score).toBe(8);
    expect(rankEpics(epics).map((e) => e.id)).toEqual(["#6", "#7", "#3", "#5", "#8"]);
  });

  it("falls back to relative job size for an epic with no cost yet", () => {
    const s = epicWsjf([epic("a", [8, 5, 3], undefined, 8)]);
    expect(s.get("a")).toMatchObject({ costOfDelay: 16, denominator: { kind: "size", size: 8 }, score: 2 });
  });

  it("finds columns without a 1, which skew every score", () => {
    expect(wsjfColumnGaps([{ userBusinessValue: 1, timeCriticality: 3, riskReductionOpportunity: 1, jobSize: 2 }, { userBusinessValue: 5, timeCriticality: 2, riskReductionOpportunity: 8, jobSize: 1 }])).toEqual(["timeCriticality"]);
    expect(wsjfColumnGaps([])).toEqual([]);
  });

  it("ranks features by cost of delay over job size, the smaller job first on a tie", () => {
    const item = (id: string, w: [number, number, number, number]) => ({ id, title: id, level: "feature", status: "todo", wsjf: { userBusinessValue: w[0], timeCriticality: w[1], riskReductionOpportunity: w[2], jobSize: w[3] } }) as never;
    expect(rankByWsjf([item("big", [8, 8, 4, 2]), item("small", [4, 4, 2, 1]), item("top", [20, 8, 2, 1])]).map((i: { id: string }) => i.id)).toEqual(["top", "small", "big"]);
  });
});
