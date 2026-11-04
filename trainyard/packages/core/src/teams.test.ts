import { describe, expect, it } from "vitest";
import { classTeams, isClassWide, makeTeams, placeStudent, teamOp, teamState } from "./teams.js";

describe("class teams", () => {
  it("seats every student in exactly one team, keeps what exists and fills the smallest", () => {
    const t = makeTeams(3, [], ["a", "b", "c", "d", "e"]);
    expect(t.map((x) => x.name)).toEqual(["Team 1", "Team 2", "Team 3"]);
    expect(t.map((x) => x.members)).toEqual([["a", "d"], ["b", "e"], ["c"]]);
    // One more team: nobody moves, the new team starts empty; a new student joins it.
    const t4 = makeTeams(4, t, ["a", "b", "c", "d", "e", "f"]);
    expect(t4[3]).toEqual({ id: "t4", name: "Team 4", members: ["f"] });
    expect(t4.slice(0, 3)).toEqual(t);
    // Down to two: the dropped teams' students join the smallest ones; a student who left is gone.
    const t2 = makeTeams(2, t4, ["a", "b", "c", "e", "f"]);
    expect(t2.map((x) => x.members).flat().sort()).toEqual(["a", "b", "c", "e", "f"]);
    expect(Math.abs(t2[0]!.members.length - t2[1]!.members.length)).toBeLessThanOrEqual(1);
    expect(makeTeams(0, t2, ["a"])).toEqual([]);
  });
  it("moves a student between teams and reads teams off a board", () => {
    const t = placeStudent(makeTeams(2, [], ["a", "b"]), "a", "t2");
    expect(t.map((x) => x.members)).toEqual([[], ["b", "a"]]);
    expect(classTeams({ fields: { teams: t } })).toEqual(t);
    expect(classTeams({ fields: { teams: "no" } })).toEqual([]);
  });
  it("scopes a frame's state and its changes to a team; the agenda and the planning room stay class-wide", () => {
    const state = { "t1|votes": [1], "t2|votes": [2], votes: [0] };
    expect(teamState(state, "t1")).toEqual({ votes: [1] });
    expect(teamOp({ key: "votes", op: "set", value: 3 }, "t2")).toEqual({ key: "t2|votes", op: "set", value: 3 });
    expect(isClassWide({ activity: { kind: "Activity", steps: "", board: "agenda" } })).toBe(true);
    expect(isClassWide({ activity: { kind: "Activity", steps: "", board: "pib" } })).toBe(true);
    expect(isClassWide({ activity: { kind: "Activity", steps: "", board: "vote" } })).toBe(false);
    expect(isClassWide({ activity: { kind: "Activity", steps: "", board: "vote", config: { classWide: true } } })).toBe(true);
  });
});
