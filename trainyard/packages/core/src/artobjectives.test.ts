import { describe, expect, it } from "vitest";
import { synthesiseArtObjectives } from "./artobjectives.js";
import { COACH_SYNC_CHECKPOINTS, coachSyncKey, coachSyncSummary } from "./coachsync.js";
import type { Objective, Team } from "./model.js";

const team = (id: string, name: string): Team => ({ id, name, groupId: "art", source: "jira", capacity: {}, memberIds: [], agentIds: [] });
const obj = (id: string, teamId: string, title: string, bv: number, committed = true): Objective => ({ id, incrementId: "pi", teamId, title, plannedValue: bv, committed });

describe("ART PI objectives from team objectives", () => {
  const teams = [team("a", "Checkout"), team("b", "Payments"), team("c", "Search")];
  it("clusters team objectives that share a theme, carries the top business value and keeps the trace", () => {
    const drafts = synthesiseArtObjectives(
      [obj("o1", "a", "Cut checkout errors by half", 8), obj("o2", "b", "Pilot express pay at checkout", 6, false), obj("o3", "c", "Ship semantic product search", 9), obj("o4", "c", "Search relevance eval harness", 4)],
      teams,
    );
    const checkout = drafts.find((d) => d.sourceObjectiveIds.includes("o1"))!;
    expect(checkout.sourceObjectiveIds.sort()).toEqual(["o1", "o2"]);
    expect(checkout.businessValue).toBe(8);
    expect(checkout.committed).toBe(false);
    expect(checkout.title.toLowerCase()).toContain("checkout");
    const search = drafts.find((d) => d.sourceObjectiveIds.includes("o3"))!;
    expect(search.sourceObjectiveIds.sort()).toEqual(["o3", "o4"]);
    expect(search.committed).toBe(true);
    // Every team objective lands under exactly one ART objective.
    expect(drafts.flatMap((d) => d.sourceObjectiveIds).sort()).toEqual(["o1", "o2", "o3", "o4"]);
    // Highest value first.
    expect(drafts[0]!.businessValue).toBe(9);
  });
  it("leaves an unrelated objective on its own and ignores ART-level ones", () => {
    const drafts = synthesiseArtObjectives([obj("o1", "a", "Cut checkout errors", 5), { ...obj("x", "a", "Something at ART level", 5), level: "art" }], teams);
    expect(drafts).toHaveLength(1);
    expect(drafts[0]!.title).toBe("Cut checkout errors");
  });
});

describe("Coach Sync", () => {
  it("has the six checkpoints of the two-day agenda and sums answers per checkpoint", () => {
    expect(COACH_SYNC_CHECKPOINTS.map((c) => `${c.day}:${c.time}`)).toEqual(["1:1:00", "1:2:00", "1:3:00", "1:3:45", "2:10:30", "2:11:30"]);
    const cp = COACH_SYNC_CHECKPOINTS[0]!;
    const answers: Record<string, "yes" | "partly" | "no" | "help"> = {};
    for (const q of cp.questions) {
      answers[coachSyncKey(cp.id, q.id, "a")] = "yes";
      answers[coachSyncKey(cp.id, q.id, "b")] = "yes";
    }
    answers[coachSyncKey(cp.id, cp.questions[0]!.id, "b")] = "help";
    const summary = coachSyncSummary({ incrementId: "pi", answers, notes: {}, updatedAt: "" }, ["a", "b"]);
    expect(summary[0]).toMatchObject({ answered: cp.questions.length * 2, total: cp.questions.length * 2, help: ["b"], done: false });
    expect(summary[1]!.answered).toBe(0);
  });
});
