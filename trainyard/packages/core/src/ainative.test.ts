import { describe, expect, it } from "vitest";
import { advance, aiCostView, artIssues, assessmentSummary, clearReview, coverage, demoArt, discard, editIntent, explorationFunnel, gate, keyResultCheck, krProgress, launchPlanIssues, nextStage, outcomeWording, prioritise, reviewQueue, senseRespondAgenda, verificationView, type Output } from "./ainative.js";
import { demoPlanningSession, outcomeTree } from "./outcomes.js";

const NOW = "2026-11-05T09:00:00.000Z";

describe("AI-Native ART", () => {
  const art = demoArt(NOW);
  const session = demoPlanningSession();
  const ctx = { intents: art.intents, specs: art.specs };
  const out = (id: string) => art.outputs.find((o) => o.id === id)!;

  it("keeps outcomes as the spine: portfolio above the ART, ambition and wording checks", () => {
    const tree = outcomeTree(session);
    expect(tree.portfolio.map((p) => p.id)).toEqual(["pf-1"]);
    expect(tree.art[0]!.outcome.ambition).toBe("moonshot");
    expect(outcomeWording({ id: "x", level: "team", title: "Move the link higher on the page", keyResults: [] })).toContain("mechanism");
    expect(outcomeWording(tree.art[0]!.outcome)).toBeNull();
    expect(keyResultCheck({ id: "x", level: "team", title: "One KR", keyResults: [{ id: "k", text: "t", target: "5" }] })).toContain("two to five");
    expect(krProgress({ id: "k", text: "t", baseline: "81%", target: "94%", current: "88%" })).toBeCloseTo(7 / 13);
  });

  it("branches the pipeline on the value category and gates each transition", () => {
    expect(nextStage(out("out-1"))).toBe("release"); // an A/B test may release
    expect(nextStage(out("out-7"))).toBe("concluded"); // a plain experiment concludes
    expect(nextStage(out("out-8"))).toBe("validate");
    // No output leaves Specify without a metric, a spec and a clean intent.
    const g3 = gate(out("out-3"), ctx);
    expect(g3.ok).toBe(false);
    expect(g3.reasons.join(" ")).toContain("intent record changed");
    expect(g3.reasons.join(" ")).toContain("specification is marked for review");
    // out-8 is in build with no verification owner? It has one; it has no metric, but that gate is at Specify.
    expect(gate(out("out-8"), ctx).ok).toBe(true);
    // A release needs evidence; a learning conclusion needs the uncertainty reduced.
    expect(gate(out("out-1"), ctx).reasons).toEqual(["Release needs verification evidence."]);
    expect(gate(out("out-7"), ctx).reasons).toEqual(["Record the uncertainty reduced before concluding a learning item."]);
    const o7 = advance({ ...out("out-7"), uncertaintyReduced: "Accuracy 91% on curated labels alone." }, ctx, NOW, "Lena");
    expect(o7.stage).toBe("concluded");
    expect(o7.disposition).toBe("superseded");
    expect(o7.reviewedAt).toBe(NOW);
    expect(() => advance(out("out-3"), ctx, NOW)).toThrow(/intent/);
  });

  it("makes stopping as easy as continuing", () => {
    const d = discard(out("out-8"), "Platform team ships the same service next PI.", NOW, "Priya");
    expect(d.stage).toBe("discarded");
    expect(d.disposition).toBe("discarded");
    expect(() => discard(out("out-8"), "  ", NOW)).toThrow(/reason/);
    const fresh: Output = { ...out("out-3"), stage: "discover", metrics: [] };
    expect(discard(fresh, "Not this PI.", NOW).stage).toBe("discarded");
  });

  it("prioritises value items by WSJF and learning items by information gain", () => {
    expect(prioritise(out("out-3"), { businessValue: 8, timeCriticality: 5, riskOpportunity: 3, jobSize: 4 })).toMatchObject({ score: 4, method: "wsjf" });
    expect(prioritise(out("out-1"), { informationGain: 9, costAndTime: 3 })).toMatchObject({ score: 3, method: "information-gain" });
  });

  it("propagates an intent change downstream and clears it record by record", () => {
    let a = editIntent({ ...art, intents: art.intents.map((i) => (i.id === "int-habit" ? i : i)) }, "int-habit", { futureState: "400,000 households" }, NOW);
    const intent = a.intents.find((i) => i.id === "int-habit")!;
    expect(intent.version).toBe(2);
    expect(intent.propagationStatus).toBe("review-required");
    expect(a.specs.find((s) => s.id === "spec-nudge")!.reviewRequired).toBe(true);
    expect(a.contexts.find((c) => c.id === "ctx-family")!.reviewRequired).toBe(true);
    expect(a.evidence.at(-1)!.kind).toBe("intent-change");
    expect(reviewQueue(a).map((q) => q.id)).toEqual(expect.arrayContaining(["spec-nudge", "ctx-family", "spec-swap", "ctx-diabetic"]));
    a = clearReview(a, "spec-nudge", NOW);
    expect(a.intents.find((i) => i.id === "int-habit")!.propagationStatus).toBe("review-required");
    a = clearReview(a, "ctx-family", NOW);
    expect(a.intents.find((i) => i.id === "int-habit")!.propagationStatus).toBe("clean");
    expect(a.specs.find((s) => s.id === "spec-nudge")!.version).toBe(3);
  });

  it("flags uncovered team capabilities and sizes", () => {
    const cart = coverage(art.teams[0]!);
    expect(cart.uncovered).toEqual([]);
    expect(cart.covered.ai).toEqual(["Diego", "Lena"]);
    const marketing = coverage(art.teams[2]!);
    expect(marketing.uncovered).toEqual(["ai"]);
    expect(marketing.warnings).toEqual(["No one carries the AI capability.", "2 members; AI-Native teams are 3–7 people augmented with AI."]);
    expect(coverage(art.teams[3]!).uncovered).toEqual(["ai"]);
  });

  it("pulls the Sense and Respond agenda from data", () => {
    const a = senseRespondAgenda(art, session, 3, { krHistory: art.krHistory });
    expect(a.questions).toHaveLength(3);
    expect(a.released.map((o) => o.id)).toEqual(["out-4", "out-5"]);
    const why = Object.fromEntries(a.discardCandidates.map((d) => [d.output.id, d.why]));
    expect(why["out-8"]).toContain("No metric linked");
    // out-4 released in iteration 1 with a free metric (no KR history) and two iterations gone: stale.
    expect(why["out-4"]).toContain("No movement");
    // out-5 moved its key result (5% → 11%) so it is not a candidate.
    expect(why["out-5"]).toBeUndefined();
    expect(a.reviewQueue.map((q) => q.id)).toEqual(["spec-swap", "ctx-diabetic"]);
    expect(a.costVariance[0]).toMatchObject({ workflow: "model-training", estimate: 900, actual: 1450, variance: 550 });
    expect(a.outcomeDeltas.find((d) => d.keyResult.startsWith("Raise in-cart"))).toMatchObject({ previous: "11%", target: "28%" });
  });

  it("scores the twelve success factors, keeps splits, and sequences gaps into the launch plan", () => {
    const s = assessmentSummary(art.assessment);
    expect(s).toHaveLength(12);
    const data = s.find((f) => f.factor === "Curated data")!;
    expect(data).toMatchObject({ ratings: 4, mean: 2.8, spread: 2, split: true });
    expect(s.find((f) => f.factor === "PI Outcome Planning")!.split).toBe(false);
    expect(s.find((f) => f.factor === "AI governance and ethics")!.ratings).toBe(0);
    expect(launchPlanIssues(art.assessment)).toEqual([]);
    expect(launchPlanIssues({ ...art.assessment, gaps: [{ id: "g", factor: "PI Outcome Planning", text: "No draft PI outcomes", sequence: "later" }] })).toHaveLength(1);
  });

  it("shows the funnel, the AI cost by workflow and the verification queue", () => {
    const f = explorationFunnel(art, session);
    expect(f).toMatchObject({ outcomes: 3, learning: { total: 4, concluded: 1, discarded: 1, active: 2 }, value: { total: 4, released: 2, discarded: 0, active: 2 }, discardRate: 13 });
    const c = aiCostView(art);
    expect(c.fixed).toBe(2400);
    expect(c.variableActual).toBe(3120);
    expect(c.overLimit).toBe(false);
    expect(c.byWorkflow[0]!.workflow).toBe("model-training");
    const v = verificationView(art, NOW);
    expect(v.queueDepth).toBe(2);
    expect(v.waiting[0]).toMatchObject({ outputId: "out-7", owner: "Lena (AI Value Architect)", days: 6 });
    expect(v.approverLoad.find((l) => l.owner === "Priya (PM)")).toMatchObject({ waiting: 1, done: 3 });
    expect(v.medianReviewDays).toBe(2);
  });

  it("lists what the facilitator should fix before the next event", () => {
    const issues = artIssues(art, session);
    expect(issues).toContain("Marketing Team: No one carries the AI capability.");
    expect(issues.some((i) => i.includes("waiting for review"))).toBe(true);
    expect(issues.some((i) => i.includes("passed Specify without a metric"))).toBe(true);
  });
});
