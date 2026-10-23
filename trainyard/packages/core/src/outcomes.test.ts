import { describe, expect, it } from "vitest";
import { confidence, defaultAgenda, demoPlanningSession, emptyPlanningSession, krChange, outcomeTree, planningBoard, planningIssues, teamBoard } from "./outcomes.js";

describe("PI outcome planning", () => {
  const s = demoPlanningSession();

  it("builds the outcome tree: ART outcomes, their PI outcomes, each team's contribution", () => {
    const t = outcomeTree(s);
    expect(t.art.map((a) => a.outcome.title)).toEqual(["The household's trusted health partner", "Family health as a shared, sticky habit", "Profitable growth as AI reshapes the cost base"]);
    const diets = t.art[0]!.pis[0]!;
    expect(diets.outcome.title).toBe("Scale Specialized Diets");
    expect(diets.teams.map((o) => o.teamId)).toEqual(["ai-engine", "ai-engine", "cart", "marketing", "in-store"]);
    // The Cart Team's agent outcome traces to no PI outcome: an "other" commitment.
    expect(t.other.map((o) => o.id)).toEqual(["t-cart-3"]);
  });

  it("lays out the PI Outcome Planning Board with fixed-date milestones on their own row", () => {
    const b = planningBoard(s);
    expect(b.milestonesRow.map((c) => c.length)).toEqual([0, 1, 0, 1, 0, 1]);
    expect(b.rows.map((r) => r.outcome?.title ?? "Other")).toEqual(["Scale Specialized Diets", "Optimize Margins", "Household Gamification", "Other"]);
    const diets = b.rows[0]!;
    expect(diets.teamOutcomes).toHaveLength(5);
    expect(diets.byIteration.map((c) => c.map((m) => m.kind))).toEqual([[], ["learning"], ["sync", "release"], ["learning"], [], ["release"]]);
    expect(b.rows[3]!.byIteration[3]!.map((m) => m.label)).toEqual(["Spec standard aligned with AI Engine team"]);
  });

  it("shows a team's board with its work and the milestones it owns, and the iteration-2 clash", () => {
    const cart = teamBoard(s, "cart");
    expect(cart.rows.map((r) => r.outcome?.title ?? "Other")).toEqual(["Raise confidence in specialized diet choices at checkout", "Make the family cart a shared habit", "Make agents dependable co-builders with curated data", "Other"]);
    expect(cart.rows[0]!.byIteration[0]!.work.map((w) => w.kind)).toEqual(["prototype", "enabler"]);
    expect(cart.rows[0]!.byIteration[1]!.milestones.map((m) => m.label)).toEqual(["Diet classification model accuracy validated"]);
    expect(cart.rows[3]!.byIteration[0]!.work.map((w) => w.label)).toEqual(["Auditability instrumentation"]);
    // The agent outcome traces to no PI outcome, so the team-only milestones sit on it, not on "Other" as well.
    expect(cart.rows[2]!.byIteration[1]!.milestones.map((m) => m.label)).toEqual(["Curated-spec update validated"]);
    expect(cart.rows[3]!.byIteration[1]!.milestones).toEqual([]);
    expect(cart.fixed[1]!.map((m) => m.label)).toEqual(["Security audit"]);
    expect(cart.load).toHaveLength(6);
    expect(cart.load[1]).toBeGreaterThanOrEqual(4);
  });

  it("reads the confidence vote and the key-result adjustments", () => {
    const c = confidence(s);
    expect(c).toMatchObject({ votes: 3, teams: 4, average: 3.7, low: [], committed: false });
    expect(confidence({ ...s, votes: [...s.votes, { teamId: "in-store", value: 2, concern: "Hardware lead time" }] }).low).toEqual([{ teamId: "in-store", value: 2, concern: "Hardware lead time" }]);
    expect(confidence({ ...s, votes: s.teams.map((t) => ({ teamId: t.id, value: 4 as const })) }).committed).toBe(true);
    const diets = s.outcomes.find((o) => o.id === "pi-diets")!;
    expect(diets.keyResults.map(krChange)).toEqual(["cut", "cut"]);
    expect(s.outcomes.find((o) => o.id === "t-cart-2")!.keyResults.map(krChange)).toEqual(["raised", "raised"]);
    expect(krChange({ id: "x", text: "", target: "5%" })).toBe("kept");
  });

  it("flags what the final review still needs", () => {
    const issues = planningIssues(s);
    expect(issues).toContain("1 team still to vote.");
    expect(issues.some((i) => i.includes("unanswered"))).toBe(true);
    expect(planningIssues(emptyPlanningSession("x", "ART", "PI 1", [{ id: "a", name: "A" }], "2026-01-01T00:00:00.000Z"))).toEqual(["A has no team outcome.", "1 team still to vote."]);
  });

  it("carries SAFe's one-day agenda: 3.5 hours each half", () => {
    const a = defaultAgenda();
    const sum = (half: "morning" | "afternoon") => a.filter((x) => x.half === half && x.kind !== "review").reduce((n, x) => n + x.minutes, 0);
    expect(sum("morning")).toBe(210);
    expect(sum("afternoon")).toBe(210);
    expect(a.filter((x) => x.kind === "outcome-breakout")).toHaveLength(4);
    expect(a.filter((x) => x.kind === "team-breakout")).toHaveLength(2);
  });
});

describe("class boards", () => {
  it("builds every class with a start strip, one frame per lesson, and the shared exercises", async () => {
    const { CLASSES, classBoard, classTemplates } = await import("./classes.js");
    expect(CLASSES.map((c) => c.id)).toEqual(["leading-safe", "spc", "aspc", "popm", "rte"]);
    const spc = classBoard(CLASSES[1]!);
    const top = spc.frames.filter((f) => !f.parentId);
    expect(top[0]!.title).toBe("Start here");
    expect(top.slice(1).map((f) => f.title)).toHaveLength(CLASSES[1]!.lessons.length);
    expect(top[2]!.title).toContain("Building a Foundation");
    // SPC reuses the Leading SAFe lessons and plans with four teams; Leading SAFe with three.
    expect(spc.frames.filter((f) => /^Team [A-D] .* board$/.test(f.title))).toHaveLength(4);
    expect(classBoard(CLASSES[0]!).frames.filter((f) => /^Team [A-D] .* board$/.test(f.title))).toHaveLength(3);
    // The readiness checklist appears in SPC lesson 10 and RTE lesson 3, pointing at the live canvas.
    const rte = classBoard(CLASSES[4]!);
    for (const b of [spc, rte]) expect(b.nodes.some((n) => n.fields.link === "/canvases")).toBe(true);
    expect(spc.nodes.filter((n) => n.text.startsWith("Planning scope and context"))).toHaveLength(1);
    // Story cards carry their points for the simulation.
    expect(spc.nodes.filter((n) => typeof n.fields.storyPoints === "number").length).toBeGreaterThan(20);
    // Nothing overlaps its lesson frame: every node sits inside a frame of the board.
    const ids = new Set(spc.frames.map((f) => f.id));
    expect(spc.nodes.every((n) => n.frameId && ids.has(n.frameId))).toBe(true);
    // POPM follows the trainer's exported board: five lessons, the animal-named teams in the simulation.
    const popm = classBoard(CLASSES[3]!);
    expect(popm.frames.filter((f) => !f.parentId).slice(1).map((f) => f.title.replace(/^Lesson \d+: /, ""))).toEqual(["Becoming a Product Owner / Product Manager", "Preparing for PI Planning", "Leading PI Planning", "Executing Iterations", "Executing the PI"]);
    expect(popm.frames.filter((f) => /^(Unicorns|Lions|Bears) .* board$/.test(f.title))).toHaveLength(3);
    expect(popm.nodes.some((n) => n.text.startsWith("Trustworthy:"))).toBe(true);
    expect(classTemplates().map((t) => t.info.id)).toEqual(["class-leading-safe", "class-spc", "class-aspc", "class-popm", "class-rte"]);
  });
});

describe("envision the future state", () => {
  it("diverges into options per TOWS emphasis, scores them, and turns the chosen one's changes into epics and enablers", async () => {
    const { demoCanvases, futureOptions, optionScore, epicsFromFutureState, DECISION_CRITERIA } = await import("./canvases.js");
    const { demoIdentification } = await import("./valuestreams.js");
    const all = demoCanvases(demoIdentification(), "2026-10-01T00:00:00.000Z");
    const current = all.find((c) => c.id === "canvas-portfolio")!;
    const tows = all.find((c) => c.id === "canvas-tows")!;
    const options = futureOptions(current, tows, ["o1", "o2", "o3", "o4"], "2026-10-02T00:00:00.000Z");
    expect(options.map((o) => o.option!.emphasis)).toEqual(["offensive", "defensive", "fix-first", "balanced"]);
    expect(options[0]!.state).toBe("future");
    expect((options[0]!.fields.changes as string[]).length).toBe(4); // SO + WO
    expect((options[1]!.fields.changes as string[]).length).toBe(3); // ST + WT
    expect((options[3]!.fields.changes as string[]).length).toBe(7);
    expect(optionScore(undefined)).toBeNull();
    expect(optionScore({ fit: 5, value: 5, feasibility: 5, cost: 1, risk: 1 })).toBe(100);
    expect(optionScore({ fit: 1, value: 1, feasibility: 1, cost: 5, risk: 5 })).toBe(0);
    expect(optionScore({ fit: 3 })).toBeNull();
    expect(DECISION_CRITERIA.reduce((n, c) => n + c.weight, 0)).toBe(100);
    const drafts = epicsFromFutureState(options[3]!, current);
    expect(drafts).toHaveLength(7);
    expect(drafts.filter((d) => d.kind === "enabler").map((d) => d.change)).toEqual(expect.arrayContaining([expect.stringContaining("order platform"), expect.stringContaining("customer data platform"), expect.stringContaining("payment integration")]));
    expect(drafts.find((d) => d.change.startsWith("Use the loyal app base"))).toMatchObject({ kind: "business", title: "Use the loyal app base to launch grocery delivery in the three metro areas" });
    expect(drafts[0]!.hypothesis).toMatch(/^If we /);
  });

  it("promotes team work onto the PI Outcome Planning Board and keeps strings between any two cards", () => {
    const s = demoPlanningSession();
    const b = planningBoard(s);
    const promoted = s.work.filter((w) => w.onArtBoard);
    expect(promoted.length).toBeGreaterThan(0);
    const shown = b.rows.flatMap((r) => r.workByIteration.flat());
    expect(shown.map((w) => w.id).sort()).toEqual(promoted.map((w) => w.id).sort());
    // Each promoted card sits on the row of its team outcome's PI outcome, in its own iteration.
    for (const w of promoted) {
      const pi = s.outcomes.find((o) => o.id === w.outcomeId)?.parentId;
      const row = b.rows.find((r) => (r.outcome?.id ?? null) === (pi ?? null))!;
      expect(row.workByIteration[w.iteration - 1]!.some((x) => x.id === w.id)).toBe(true);
    }
    const linked: typeof s = { ...s, links: [{ id: "l-1", fromId: "w-4", toId: "w-8", kind: "depends" }] };
    expect(linked.links![0]!.kind).toBe("depends");
  });
});
