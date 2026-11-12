import { describe, expect, it } from "vitest";
import { CLASSES, classBoard, classExport, classReportHtml, instantiate } from "./index.js";

describe("class export", () => {
  it("takes the class out whole and renders a readable report with every team's work", () => {
    const b = instantiate(classBoard(CLASSES.find((c) => c.id === "leading-safe")!), "b-x", "LSA March", "2026-11-01T00:00:00.000Z");
    b.fields = { ...b.fields, teams: [{ id: "t1", name: "Red", members: ["s1"] }, { id: "t2", name: "Blue", members: ["s2"] }] };
    const ex = b.frames.find((f) => f.activity?.board === "disc")!;
    ex.state = { "t1|stickies": [{ id: "a", text: "Flow <first>" }], "t2|stickies": [{ id: "b", text: "Value" }], votes: [{ voter: "x", v: "lpm" }] };
    ex.done = true;
    const x = classExport(b, { now: "2026-11-04T10:00:00.000Z", students: [{ id: "s1", name: "Ana", email: "ana@example.io" }, { id: "s2", name: "Ben", email: "ben@example.io" }], planningRoom: { scn: "geek", teams: 1, tickets: [{ id: "TY-1", type: "story", title: "Ship it", team: 1, iter: 2, pts: 3 }] } });
    expect(x.format).toBe("trainyard-class/1");
    expect(x.students.map((s) => s.team)).toEqual(["Red", "Blue"]);
    const html = classReportHtml(x);
    expect(html).toContain("LSA March");
    expect(html).toContain("Flow &lt;first&gt;");
    expect(html).toContain("<h4>Red</h4>");
    expect(html).toContain("<h4>Blue</h4>");
    expect(html).toContain("✓ completed");
    expect(html).toContain("Ship it");
    expect(html).toContain("ana@example.io");
    expect(html).not.toContain("<first>");
  });
});
