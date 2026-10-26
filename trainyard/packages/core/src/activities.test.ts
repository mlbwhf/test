import { describe, expect, it } from "vitest";
import { activityTiming, addActivities, classBoard, CLASSES, connectionTally, instantiate, timerLeft } from "./index.js";

describe("class activities", () => {
  const fresh = () => instantiate(classBoard(CLASSES[0]!), "b1", "Class", "2026-01-01T00:00:00.000Z");

  it("adds activity frames to a lesson and makes room below it", () => {
    const b = fresh();
    const lessons = b.frames.filter((f) => !f.parentId).sort((x, y) => x.y - y.y);
    const [l1, l2] = [lessons[1]!, lessons[2]!];
    const l2y = l2.y;
    const ids = addActivities(b, l1.id, [
      { title: "Map the connections", kind: "Activity", prepare: 7, share: 3, steps: "Step 1\nStep 2", connectionTypes: [{ id: "talk", label: "Communicates", color: "" }, { id: "fix", label: "Solves problems", color: "#123456" }], items: [{ kind: "image", src: "data:image/png;base64,AA", x: 0, y: 0, width: 1400, height: 800 }, { kind: "pin", text: "Coach", x: 600, y: 300 }] },
      { title: "Explore", kind: "Discussion", prepare: 15, steps: "Talk" },
    ], "x");
    expect(ids).toEqual(["x-a1", "x-a2"]);
    const a1 = b.frames.find((f) => f.id === "x-a1")!;
    expect(a1).toMatchObject({ title: "Activity: Map the connections", parentId: l1.id });
    expect(a1.activity!.connectionTypes!.map((t) => t.color)).toEqual(["#c2412d", "#123456"]);
    expect(b.nodes.filter((n) => n.frameId === "x-a1").map((n) => n.kind)).toEqual(["image", "shape"]);
    // The lesson grew around both, and the next lesson moved down by the same amount.
    const a2 = b.frames.find((f) => f.id === "x-a2")!;
    expect(l1.y + l1.height).toBeGreaterThanOrEqual(a2.y + a2.height);
    expect(l2.y - l2y).toBeGreaterThan(0);
    expect(l2.y).toBeGreaterThan(l1.y + l1.height);
  });

  it("counts connections per type", () => {
    const b = fresh();
    const lesson = b.frames.find((f) => !f.parentId)!;
    addActivities(b, lesson.id, [{ title: "Map", kind: "Activity", steps: "", connectionTypes: [{ id: "a", label: "A", color: "" }, { id: "b", label: "B", color: "" }], items: [{ kind: "pin", text: "RTE", x: 0, y: 0 }, { kind: "pin", text: "BO", x: 300, y: 0 }] }], "m");
    expect(connectionTally(b, "m-a1")).toEqual({ counts: { a: 0, b: 0 }, complete: false });
    b.edges.push({ id: "e1", fromId: "m-a1-i1", toId: "m-a1-i2", type: "a" }, { id: "e2", fromId: "m-a1-i1", toId: "m-a1-i2", type: "b" });
    expect(connectionTally(b, "m-a1")).toEqual({ counts: { a: 1, b: 1 }, complete: true });
  });

  it("formats timing and counts a timer down", () => {
    expect(activityTiming({ prepare: 7, share: 3 })).toBe("Prepare: 7 min · Share: 3 min");
    expect(activityTiming({ prepare: 15 })).toBe("15 min");
    const now = new Date("2026-01-01T10:00:00Z");
    expect(timerLeft({ label: "Prepare", seconds: 420, endsAt: "2026-01-01T10:05:00Z" }, now)).toBe(300);
    expect(timerLeft({ label: "Prepare", seconds: 420, left: 99 }, now)).toBe(99);
    expect(timerLeft({ label: "Prepare", seconds: 420, endsAt: "2026-01-01T09:00:00Z" }, now)).toBe(0);
  });
});

describe("a trainer's own course", () => {
  it("builds a class with the Welcome area and exactly the pack's exercises per lesson", async () => {
    const { courseBoard } = await import("./index.js");
    const b = courseBoard({ name: "My RTE", lessons: [{ title: "Exploring the role", activities: [{ title: "One", kind: "Activity", prepare: 7, share: 3, steps: "Step 1" }, { title: "Two", kind: "Discussion", prepare: 15, steps: "" }] }, { title: "Organizing the ART", activities: [{ title: "Three", kind: "Discussion", prepare: 8, steps: "" }] }] }, "tpl-deck-x", "2026-01-01T00:00:00.000Z");
    const top = b.frames.filter((f) => !f.parentId).sort((x, y) => x.y - y.y);
    expect(top.map((f) => f.title)).toEqual(["Welcome", "Lesson 1: Exploring the role", "Lesson 2: Organizing the ART"]);
    const kids = (id: string) => b.frames.filter((f) => f.parentId === id).map((f) => f.title);
    expect(kids(top[1]!.id)).toEqual(["Activity: One", "Discussion: Two"]);
    expect(kids(top[2]!.id)).toEqual(["Discussion: Three"]);
    // Lessons do not overlap.
    expect(top[2]!.y).toBeGreaterThan(top[1]!.y + top[1]!.height);
    expect(b).toMatchObject({ isTemplate: true, fields: { class: "custom" } });
  });
});
