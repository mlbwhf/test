import { describe, expect, it } from "vitest";
import type { BoardNode, Frame } from "./boards.js";
import { stackCards, stackHeight, stackLaneAt } from "./stack.js";

const lane = (id: string, x: number): Frame => ({ id, title: id, x, y: 100, width: 360, height: 400, parentId: "agenda", layout: "stack" });
const card = (id: string, frameId: string, y: number): BoardNode => ({ id, kind: "card", text: id, x: frameId === "todo" ? 36 : 416, y, width: 328, height: 64, frameId, tags: [], fields: {} });

describe("kanban lanes on a canvas", () => {
  const todo = lane("todo", 20), wip = lane("wip", 400);
  const nodes = [card("a", "todo", 144), card("b", "todo", 222), card("c", "todo", 300), card("d", "wip", 144)];

  it("finds the lane under a point, the innermost when lanes nest", () => {
    const outer: Frame = { id: "agenda", title: "Quick agenda", x: 0, y: 50, width: 800, height: 500, layout: "stack" };
    expect(stackLaneAt([outer, todo, wip], { x: 500, y: 200 })?.id).toBe("wip");
    expect(stackLaneAt([todo, wip], { x: 395, y: 200 })).toBeNull();
  });

  it("drops a card into a lane at the place its drop point says and closes the gap behind it", () => {
    // "b" dropped onto WIP above "d": WIP becomes b, d; To start becomes a, c.
    const moved = stackCards(wip, nodes, { id: "b", y: 150 });
    expect(moved.map((n) => [n.id, n.x, n.y, n.width, n.frameId])).toEqual([["b", 416, 144, 328, "wip"], ["d", 416, 222, 328, "wip"]]);
    const after = nodes.map((n) => moved.find((m) => m.id === n.id) ?? n);
    expect(stackCards(todo, after).map((n) => [n.id, n.y])).toEqual([["c", 222]]);
  });

  it("drops below every card to the end, and leaves a tidy lane alone", () => {
    expect(stackCards(wip, nodes, { id: "a", y: 390 }).map((n) => n.id)).toEqual(["a"]);
    const tidy = [card("x", "wip", 144), card("y", "wip", 222)];
    expect(stackCards(wip, tidy)).toEqual([]);
    expect(stackHeight(wip, [...tidy, ...tidy, ...tidy])).toBe(44 + 6 * 78 + 16);
  });
});
