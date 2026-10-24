import { describe, expect, it } from "vitest";
import { builtinTemplates, TEMPLATE_METHODS } from "./templates.js";
import { TWO_CHASMS_STATES, TWO_CHASMS_WORKSHOPS, twoChasmsTemplates } from "./twochasms.js";

describe("two chasms templates", () => {
  const boards = twoChasmsTemplates();

  it("has the readiness check, sixteen workshops and the Foundations class", () => {
    expect(TWO_CHASMS_WORKSHOPS.map((w) => w.code)).toEqual(["R0", "P1", "P2", "P3", "P4", "P5", "P6", "P7", "S1", "S2", "S3", "S4", "S5", "S6", "S7", "M1", "M2"]);
    expect(boards).toHaveLength(TWO_CHASMS_WORKSHOPS.length + 1);
    expect(boards.at(-1)!.info.id).toBe("class-two-chasms-foundations");
  });

  it("covers all five states and files every board under the Two Chasms method", () => {
    for (const s of TWO_CHASMS_STATES) expect(TWO_CHASMS_WORKSHOPS.some((w) => w.state === s.id)).toBe(true);
    expect(TEMPLATE_METHODS.map((m) => m.id)).toContain("two-chasms");
    for (const b of boards) expect(b.info.method).toBe("two-chasms");
  });

  it("lays every card inside its frame and every frame inside its parent", () => {
    for (const b of boards) {
      expect(b.isTemplate).toBe(true);
      const frames = new Map(b.frames.map((f) => [f.id, f]));
      expect(new Set([...b.frames.map((f) => f.id), ...b.nodes.map((n) => n.id)]).size).toBe(b.frames.length + b.nodes.length);
      for (const n of b.nodes) {
        const f = frames.get(n.frameId!)!;
        expect(f, `${b.id} ${n.id}`).toBeDefined();
        expect(n.x >= f.x - 1 && n.y >= f.y - 1 && n.x + (n.width ?? 0) <= f.x + f.width + 1 && n.y + (n.height ?? 0) <= f.y + f.height + 1, `${b.id} ${n.id} in ${f.title}`).toBe(true);
      }
      for (const f of b.frames.filter((x) => x.parentId)) {
        const p = frames.get(f.parentId!)!;
        expect(f.x >= p.x - 1 && f.y >= p.y - 1 && f.x + f.width <= p.x + p.width + 1 && f.y + f.height <= p.y + p.height + 1, `${b.id} ${f.title}`).toBe(true);
      }
    }
  });

  it("ends every workshop on its artifact, and the Innovation Matrix on Oliver's sentence", () => {
    for (const b of boards.filter((x) => x.info.id.startsWith("tc-"))) expect(b.frames.some((f) => f.title.startsWith("The artifact"))).toBe(true);
    const p6 = boards.find((b) => b.info.id === "tc-innovation-matrix")!;
    expect(p6.nodes.some((n) => n.text === "Two cells. One theme. One operating-model change. One protected long-horizon bet.")).toBe(true);
  });

  it("joins the built-in catalog without id clashes", () => {
    const all = builtinTemplates();
    expect(new Set(all.map((t) => t.id)).size).toBe(all.length);
    expect(all.filter((t) => t.info.method === "two-chasms")).toHaveLength(boards.length);
  });
});
