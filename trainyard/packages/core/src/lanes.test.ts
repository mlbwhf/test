import { describe, expect, it } from "vitest";
import { checkDrop, laneLoad, laneMarkdown, moveCard, type LaneCard, type LaneRule } from "./lanes.js";

const card = (id: string, lane: string | null, extra: Partial<LaneCard> = {}): LaneCard => ({ id, lane, title: id, ...extra });

describe("lane boards", () => {
  it("warns over a soft capacity, refuses a full hard one, a WIP limit and an unreviewed signal", () => {
    const sprint: LaneRule = { id: "sb", title: "Sprint backlog", cap: 21, unit: "pts" };
    const cards = [card("a", "sb", { size: 13 }), card("b", "pb", { size: 8 }), card("c", "pb", { size: 5 })];
    expect(checkDrop(sprint, cards[1]!, cards)).toEqual({ ok: true });
    expect(checkDrop(sprint, cards[1]!, [...cards, card("d", "sb", { size: 3 })])).toEqual({ ok: true, warning: "Sprint backlog is over capacity by 3 pts" });
    const table: LaneRule = { id: "t1", title: "Table 1", cap: 2, unit: "seats", hard: true };
    expect(checkDrop(table, card("x", "ro"), [card("p", "t1"), card("q", "t1")])).toEqual({ ok: false, reason: "Table 1 is full (2 seats)." });
    expect(laneLoad(table, [card("p", "t1"), card("q", "t1")])).toBe(2);
    const doing: LaneRule = { id: "dg", title: "Doing", wip: 1 };
    expect(checkDrop(doing, card("x", "rd"), [card("p", "dg")])).toMatchObject({ ok: false });
    expect(checkDrop(doing, card("p", "dg"), [card("p", "dg")])).toEqual({ ok: true });
    const response: LaneRule = { id: "rs", title: "Response", gate: true };
    expect(checkDrop(response, card("s", "sg", { auth: "detected" }), [])).toMatchObject({ ok: false });
    expect(checkDrop(response, card("s", "sg", { auth: "reviewed" }), [])).toEqual({ ok: true });
  });

  it("moves a card to a position and writes the board as Markdown", () => {
    const cards = [card("a", "l1"), card("b", "l1"), card("c", "l2")];
    expect(moveCard(cards, "c", "l1", 1).map((c) => `${c.id}:${c.lane}`)).toEqual(["a:l1", "c:l1", "b:l1"]);
    expect(moveCard(cards, "a", "l2").map((c) => `${c.id}:${c.lane}`)).toEqual(["b:l1", "c:l2", "a:l2"]);
    expect(laneMarkdown("Board", [{ id: "l1", title: "Doing", wip: 3 }, { id: "l3", title: "Done" }], cards)).toBe("# Board\n\n## Doing (WIP limit 3)\n- a\n- b\n\n## Done\n- (empty)");
  });
});
