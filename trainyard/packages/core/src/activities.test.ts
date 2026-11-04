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

describe("the RTE class", () => {
  it("opens with the agenda kanban and the icebreaker, then a lesson per chapter holding its exercises", async () => {
    const { CLASSES, classBoard } = await import("./index.js");
    const b = classBoard(CLASSES.find((c) => c.id === "rte")!);
    const top = b.frames.filter((f) => !f.parentId).sort((x, y) => x.y - y.y);
    expect(top.map((f) => f.title)).toEqual(["Welcome", "Lesson 1: Exploring the RTE Role and Responsibilities", "Lesson 2: Organizing the ART", "Lesson 3: Facilitating PI Planning", "Lesson 4: Facilitating ART Events, Flow and DevOps", "Lesson 5: Measuring and Improving Flow", "Lesson 6: Improving the ART", "Lesson 7: Sustaining the ART"]);
    const kids = (id: string) => b.frames.filter((f) => f.parentId === id).sort((x, y) => x.y - y.y).map((f) => f.title);
    expect(kids(top[0]!.id).sort()).toEqual(["Icebreaker: introduce yourself", "Quick agenda"]);
    const agenda = b.frames.find((f) => f.title === "Quick agenda")!;
    expect(kids(agenda.id).length).toBe(3);
    const toStart = b.frames.find((f) => f.parentId === agenda.id && f.title === "To start")!;
    expect(b.nodes.filter((n) => n.frameId === toStart.id).map((n) => n.text)).toEqual(["01 Exploring the RTE Role and Responsibilities", "02 Organizing the ART", "03 Facilitating PI Planning", "04 Facilitating ART Events, Flow and DevOps", "05 Measuring and Improving Flow", "06 Improving the ART", "07 Sustaining the ART"]);
    expect(kids(top[1]!.id)).toHaveLength(5);
    expect(kids(top[3]!.id)).toEqual(["Activity: How much preparation is enough?", "Activity: PI Planning readiness preparation", "Activity: Reading the ART planning board in PI Planning", "Activity: Conflicting views of value", "Activity: ROAM ART PI risks", "Discussion: Confidence not high? Plan rework.", "Discussion: AI-empowered PI Planning"]);
    // Every exercise is a Class Studio board with its setup; the workshop's steps share one board.
    const exercises = b.frames.filter((f) => f.activity);
    expect(exercises.every((f) => f.activity!.board)).toBe(true);
    expect(b.frames.find((f) => f.title === "Activity: ROAM ART PI risks")!.activity!.board).toBe("roam");
    const rca = b.frames.filter((f) => f.activity?.board === "rca");
    expect(rca.map((f) => f.activity!.config!.rstep)).toEqual(["all", "agree", "rca", "restate", "brainstorm", "readout"]);
    expect(new Set(rca.map((f) => f.activity!.config!.shared)).size).toBe(1);
    expect(kids(top[6]!.id)).toHaveLength(13);
    const disc = b.frames.find((f) => f.title === "Discussion: Preparing for the PI System Demo")!.activity!.config!;
    expect(disc).toMatchObject({ quad: true, qs: expect.arrayContaining(["Who can assist the RTE with these preparations?"]) });
    // Lessons never overlap.
    for (let i = 1; i < top.length; i++) expect(top[i]!.y).toBeGreaterThan(top[i - 1]!.y + top[i - 1]!.height);
  });
});

describe("the Leading SAFe class", () => {
  it("opens with the Welcome chapter, then a lesson per chapter, every exercise on its Class Studio board with the design's wording", async () => {
    const { CLASSES, classBoard } = await import("./index.js");
    const b = classBoard(CLASSES.find((c) => c.id === "leading-safe")!);
    const top = b.frames.filter((f) => !f.parentId).sort((x, y) => x.y - y.y);
    // Chapter numbers as in the design: Welcome is the start strip (unnumbered), lessons count from 1 after it.
    expect(top.map((f) => f.title)).toEqual(["Welcome", "Lesson 1: Thriving in the digital age with business agility", "Lesson 2: Building a foundation with mindset, values and principles", "Lesson 3: Establishing team and technical agility", "Lesson 4: Building solutions with Agile product delivery", "Lesson 5: Exploring Lean Portfolio Management", "Lesson 6: Leading the change"]);
    const kids = (id: string) => b.frames.filter((f) => f.parentId === id).sort((x, y) => x.y - y.y);
    // The course's Welcome chapter sits in the Welcome strip, after the start-here exercises.
    expect(kids(top[0]!.id).filter((f) => f.activity).map((f) => f.title)).toEqual(["Overview: Welcome to Leading SAFe", "Overview: The story of the course on the Big Picture", "Discussion: What are you hoping to get from SAFe?", "Discussion: AI disruption", "Activity: Course overview: vote on a discipline"]);
    expect(kids(top[2]!.id).map((f) => f.activity!.board)).toEqual(["vsid", "delay", "prin", "disc", "sbd", "talk", "disc", "dec", "ov"]);
    expect(kids(top[4]!.id).map((f) => f.activity!.board)).toEqual(["emp", "feat", "wsjf", "rse", "cap", "pib", "pcs", "ppr", "pbv", "prm", "disc"]);
    const exercises = b.frames.filter((f) => f.activity);
    expect(exercises).toHaveLength(33);
    expect(exercises.every((f) => f.activity!.board)).toBe(true);
    // Work that carries from one exercise into the next shares one board.
    const shared = (g: string) => exercises.filter((f) => f.activity!.config?.shared === g).map((f) => f.activity!.board);
    expect(shared("value-stream")).toEqual(["vsid", "delay"]);
    expect(shared("features")).toEqual(["feat", "wsjf"]);
    expect(shared("pi-planning")).toEqual(["pib", "pcs", "ppr", "pbv", "prm"]);
    // The design's wording, step by step, and its trainer note beside the exercise.
    const dec = b.frames.find((f) => f.title === "Activity: Decentralize decision-making")!.activity!;
    expect(dec.steps.split("\n")[2]).toBe("Step 3: Add the total values: zero to three = centralize; four to six = decentralize.");
    expect(dec.side).toEqual([{ title: "Trainer note", text: "Frequent and time-critical: Yes = 2, No = 0. Economies of scale: Yes = 0, No = 2.", instructorOnly: true }]);
    expect(b.frames.find((f) => f.title === "Discussion: Responsible AI and Portfolio Leadership")!.activity!.config!.qs).toHaveLength(3);
    expect(b.frames.find((f) => f.title === "Overview: The SAFe principles")!.activity!.config).toEqual({ view: "pri" });
    for (let i = 1; i < top.length; i++) expect(top[i]!.y).toBeGreaterThan(top[i - 1]!.y + top[i - 1]!.height);
  });
});

describe("the Launching AI-Native ARTs class", () => {
  it("has the design's five chapters of eighteen steps on one shared assessment board, with the course's statements", async () => {
    const { CLASSES, classBoard, AI_NATIVE_SUCCESS_FACTORS } = await import("./index.js");
    const b = classBoard(CLASSES.find((c) => c.id === "aart")!);
    const top = b.frames.filter((f) => !f.parentId).sort((x, y) => x.y - y.y);
    expect(top.map((f) => f.title)).toEqual(["Welcome", "Lesson 1: Start and calibrate", "Lesson 2: SF1: Outcome-driven product development", "Lesson 3: SF2: Portfolio and investment strategy", "Lesson 4: SF3: Curated data", "Lesson 5: Gap analysis"]);
    const ex = b.frames.filter((f) => f.activity);
    expect(ex).toHaveLength(18);
    expect(ex.every((f) => f.activity!.board === "aart" && f.activity!.config!.shared === "assessment")).toBe(true);
    expect(ex.map((f) => f.activity!.config!.step)).toEqual(["scale", "text", "flow", "okr", "sf", "sf", "sf", "text", "strategy", "sf", "sf", "sf", "text", "data", "sf", "sf", "sf", "gap"]);
    expect(ex.filter((f) => f.activity!.config!.step === "sf").map((f) => `${f.activity!.config!.sf}:${f.activity!.config!.mode}`)).toEqual(["sf1:assess", "sf1:discuss", "sf1:adjust", "sf2:assess", "sf2:discuss", "sf2:adjust", "sf3:assess", "sf3:discuss", "sf3:adjust"]);
    expect(b.frames.find((f) => f.title === "Activity: Compare workflows")!.activity).toMatchObject({ prepare: 10, share: 3 });
    expect(Object.values(AI_NATIVE_SUCCESS_FACTORS).flatMap((f) => f.statements)).toHaveLength(12);
    expect(AI_NATIVE_SUCCESS_FACTORS.sf3!.statements[2]![0]).toBe("We verify that datasets meet all four core curation standards: complete, accurate, maintained, and securely accessed.");
  });
});

describe("upgrading a class to its template's current version", () => {
  it("keeps a running Leading SAFe class's work when the chapters are renumbered and Welcome joins the strip", async () => {
    const { CLASSES, classBoard, instantiate, upgradeFromTemplate, needsTemplateUpgrade } = await import("./index.js");
    const tpl = classBoard(CLASSES.find((c) => c.id === "leading-safe")!);
    // The class as it was made: the course's Welcome chapter as "Lesson 1: Welcome", the rest numbered from 2.
    const old = instantiate(tpl, "b-run", "LSA cohort", "2026-11-01T00:00:00.000Z");
    const strip = old.frames.find((f) => !f.parentId && f.title === "Welcome")!;
    const welcomeEx = old.frames.filter((f) => f.parentId === strip.id && f.activity);
    const lessonFrames = old.frames.filter((f) => !f.parentId && /^Lesson \d+/.test(f.title)).sort((a, b) => a.y - b.y);
    for (const l of lessonFrames) l.title = l.title.replace(/^Lesson (\d+):/, (_, n) => `Lesson ${Number(n) + 1}:`);
    const w1 = { id: "b-run:lesson-1-welcome-old", title: "Lesson 1: Welcome", x: 0, y: strip.y + strip.height + 10, width: 2600, height: 400 };
    old.frames.push(w1);
    for (const f of welcomeEx) f.parentId = w1.id;
    old.fields = { ...old.fields, templateRev: "older" };
    // Work done so far: a vote on the Welcome chapter, cards and a done mark in lesson 2, the value stream in lesson 3.
    welcomeEx[4]!.state = { votes: [{ voter: "ana", v: "lpm" }] };
    const l2 = old.frames.find((f) => f.title.startsWith("Lesson 3: Building a foundation"))!;
    const vsid = old.frames.find((f) => f.parentId === l2.id && f.activity?.board === "vsid")!;
    vsid.state = { steps: [{ id: "s1", t: "Idea" }] };
    vsid.done = true;
    expect(needsTemplateUpgrade(old, tpl)).toBe(true);
    const up = upgradeFromTemplate(old, tpl, "2026-11-04T00:00:00.000Z");
    const top = up.frames.filter((f) => !f.parentId).sort((a, b) => a.y - b.y).map((f) => f.title);
    expect(top[0]).toBe("Welcome");
    expect(top[1]).toBe("Lesson 1: Thriving in the digital age with business agility");
    const vote = up.frames.find((f) => f.activity?.board === "vote")!;
    expect(vote.parentId).toBe(up.frames.find((f) => !f.parentId && f.title === "Welcome")!.id);
    expect(vote.state).toEqual({ votes: [{ voter: "ana", v: "lpm" }] });
    const vsid2 = up.frames.find((f) => f.activity?.board === "vsid")!;
    expect(vsid2.state).toEqual({ steps: [{ id: "s1", t: "Idea" }] });
    expect(vsid2.done).toBe(true);
  });

  it("adds the new chapters and keeps what the class did, the renamed exercise included", async () => {
    const { CLASSES, classBoard, instantiate, upgradeFromTemplate, needsTemplateUpgrade } = await import("./index.js");
    const rte = CLASSES.find((c) => c.id === "rte")!;
    // The RTE class as it was: three chapters, the objective exercise under its old title.
    const oldCourse = rte.course!.slice(0, 3).map((l, i) => ({ ...l, activities: l.activities.slice(0, i === 2 ? 4 : undefined).map((a) => (a.title === "Conflicting views of value" ? { ...a, title: "Business value of an architectural objective" } : a)) }));
    const oldT = classBoard({ ...rte, lessons: rte.lessons.slice(0, 3), course: oldCourse });
    const newT = classBoard(rte);
    const b = instantiate(oldT, "b-old", "RTE March", "2026-03-01T00:00:00.000Z");
    expect(needsTemplateUpgrade(b, newT)).toBe(true);
    const objective = b.frames.find((f) => f.title === "Activity: Business value of an architectural objective")!;
    objective.done = true;
    b.nodes.push({ id: "n-mine", kind: "sticky", text: "Show the enabler's value", x: objective.x + 40, y: objective.y + 40, width: 180, height: 120, frameId: objective.id, tags: [], fields: {} });
    const readiness = b.frames.find((f) => f.title.endsWith("readiness preparation"))!;
    readiness.state = { "chk:0": "Y" };
    b.fields = { ...b.fields, students: [{ id: "s1", name: "Ana" }] };

    const u = upgradeFromTemplate(b, newT, "2026-04-01T00:00:00.000Z");
    expect(needsTemplateUpgrade(u, newT)).toBe(false);
    expect(u.frames.filter((f) => !f.parentId).map((f) => f.title)).toHaveLength(8);
    const renamed = u.frames.find((f) => f.title === "Activity: Conflicting views of value")!;
    expect(renamed.done).toBe(true);
    const mine = u.nodes.find((n) => n.id === "n-mine")!;
    expect(mine.frameId).toBe(renamed.id);
    expect(mine.x - renamed.x).toBe(40);
    // The readiness board keeps its answers.
    expect(u.frames.find((f) => f.title.endsWith("readiness preparation"))!.state).toEqual({ "chk:0": "Y" });
    expect(u.fields).toMatchObject({ students: [{ id: "s1", name: "Ana" }], lessons: 7 });
    expect(u.frames.some((f) => f.activity?.board === "roam")).toBe(true);
    // The agenda lists every chapter once.
    const toStart = u.frames.find((f) => f.title === "To start")!;
    expect(u.nodes.filter((n) => n.frameId === toStart.id).map((n) => n.text)).toHaveLength(7);
  });
});
