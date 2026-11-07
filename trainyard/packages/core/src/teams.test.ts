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

describe("team rotation", () => {
  it("deals new teams per day or per chapter and picks the round from the lesson", async () => {
    const { makeRounds, makeTeams, roundOf, teamsAt, roundCount } = await import("./teams.js");
    const ids = ["a", "b", "c", "d", "e", "f"];
    const t = makeTeams(2, [], ids);
    let k = 0;
    const rnd = () => ((k += 7) % 11) / 11;
    const rounds = makeRounds("chapter", t, [], ids, 3, rnd);
    expect(rounds).toHaveLength(3);
    expect(rounds[0]).toEqual(t);
    for (const r of rounds) {
      expect(r.map((x) => x.name)).toEqual(["Team 1", "Team 2"]);
      expect(r.flatMap((x) => x.members).sort()).toEqual(ids);
    }
    expect(rounds[1]).not.toEqual(rounds[0]);
    // Later rounds survive a re-make with a new student, who is seated in each.
    const again = makeRounds("chapter", makeTeams(2, t, [...ids, "g"]), rounds, [...ids, "g"], 3, rnd);
    expect(again[1]!.flatMap((x) => x.members).filter((m) => m !== "g")).toEqual(rounds[1]!.flatMap((x) => x.members));
    const b = { fields: { lessons: 6, days: 2, teamPolicy: "day", teamRounds: makeRounds("day", t, [], ids, 2, rnd) } };
    expect(roundCount(b)).toBe(2);
    expect([0, 2, 3, 5].map((i) => roundOf(b, i))).toEqual([0, 0, 1, 1]);
    expect(teamsAt(b, 4)).toEqual(b.fields.teamRounds[1]);
    expect(teamsAt({ fields: { lessons: 6, teams: t } }, 4)).toEqual(t);
  });
});

describe("class meta", () => {
  it("names every built-in class the way CLASSES does", async () => {
    const { CLASSES, CLASS_META } = await import("./index.js");
    expect(CLASS_META).toEqual(CLASSES.map((c) => ({ id: c.id, name: c.name, short: c.short })));
  });
});

describe("team copies of canvas exercises", () => {
  it("gives every team its own copy of each canvas exercise, once, and keeps them through a template upgrade", async () => {
    const { CLASSES, classBoard, classTemplates, teamCopies, teamCopyOf, canvasExercises, makeTeams, upgradeFromTemplate } = await import("./index.js");
    const spc = CLASSES.find((c) => c.id === "spc")!;
    const b = classBoard(spc);
    const canvas = canvasExercises(b);
    expect(canvas.length).toBeGreaterThan(10);
    const teams = makeTeams(2, [], ["s1", "s2", "s3"]);
    const framesBefore = b.frames.length, nodesBefore = b.nodes.length;
    expect(teamCopies(b, teams)).toBe(canvas.length * 2);
    expect(b.frames.length).toBeGreaterThanOrEqual(framesBefore + canvas.length * 2);
    expect(b.nodes.length).toBeGreaterThan(nodesBefore);
    // A second run adds nothing; a third team gets its copies.
    expect(teamCopies(b, teams)).toBe(0);
    expect(teamCopies(b, makeTeams(3, teams, ["s1", "s2", "s3"]))).toBe(canvas.length);
    const ex = canvas.find((f) => b.nodes.some((n) => n.x >= f.x && n.y >= f.y && n.x < f.x + f.width && n.y < f.y + f.height))!;
    const copy = teamCopyOf(b, ex.id, teams[0]!.id)!;
    expect(copy.title).toBe(`${ex.title} · ${teams[0]!.name}`);
    expect(copy.parentId).toBeUndefined();
    const on = (f: { x: number; y: number; width: number; height: number; id: string }) => b.nodes.filter((n) => n.x >= f.x && n.y >= f.y && n.x < f.x + f.width && n.y < f.y + f.height);
    expect(on(copy).length).toBe(on(ex).length);
    expect(on(copy).length).toBeGreaterThan(0);
    // The exercise's own lanes come along, under the copy.
    expect(b.frames.filter((x) => x.parentId === copy.id).length).toBe(b.frames.filter((x) => x.parentId === ex.id).length);
    // The copies and what was written on them survive an upgrade to the template.
    const written = on(copy)[0]!;
    written.text = "Team 1 wrote this";
    const t = classTemplates().find((x) => x.info.id === "class-spc")!;
    const up = upgradeFromTemplate(b, t, "2026-02-01T00:00:00.000Z");
    const exUp = up.frames.find((f) => f.title === ex.title && f.parentId && !f.copyOf)!;
    const copyUp = teamCopyOf(up, exUp.id, teams[0]!.id)!;
    expect(copyUp).toBeDefined();
    expect(up.nodes.some((n) => n.text === "Team 1 wrote this" && n.x >= copyUp.x && n.x < copyUp.x + copyUp.width)).toBe(true);
  });
});
