
describe("co-instructors and team copies", () => {
  it("copies every canvas exercise per team when teams are set up, and shows a student their team's copies", async () => {
    const { call } = await setup();
    const root = (await call("POST", "/v1/users", { name: "Root", email: "root@example.io", role: "admin" })).body.apiKey as string;
    const id = (await call("POST", "/v1/templates/boards/tpl-builtin-class-spc/create", { name: "SPC" }, root)).body.board.id as string;
    const before = (await call("GET", `/v1/boards/${id}`, undefined, root)).body.board.frames.length as number;
    const [ana] = (await call("POST", `/v1/boards/${id}/students`, { students: [{ name: "Ana", email: "ana@example.io" }, { name: "Ben", email: "ben@example.io" }] }, root)).body.students as { id: string; token: string }[];
    expect((await call("PUT", `/v1/boards/${id}/teams`, { count: 2 }, root)).status).toBe(200);
    const b = (await call("GET", `/v1/boards/${id}`, undefined, ana!.token)).body.board as { frames: { id: string; copyOf?: string; team?: string; title: string; parentId?: string }[] };
    const copies = b.frames.filter((f) => f.copyOf);
    expect(copies.length).toBe(2 * (b.frames.length - before) / 2);
    expect(copies.filter((f) => f.team === "t1").length).toBe(copies.length / 2);
    expect(copies.every((f) => !f.parentId && /· Team [12]$/.test(f.title))).toBe(true);
    // Setting the same teams again adds nothing; a third team gets its copies.
    await call("PUT", `/v1/boards/${id}/teams`, { shuffle: true }, root);
    expect((await call("GET", `/v1/boards/${id}`, undefined, root)).body.board.frames.length).toBe(b.frames.length);
    await call("PUT", `/v1/boards/${id}/teams`, { count: 3 }, root);
    expect((await call("GET", `/v1/boards/${id}`, undefined, root)).body.board.frames.filter((f: { team?: string }) => f.team === "t3").length).toBe(copies.length / 2);
  });

  it("adds a co-instructor by email, who then runs the class too, and takes them off again", async () => {
    const { call } = await setup();
    const root = (await call("POST", "/v1/users", { name: "Root", email: "root@example.io", role: "admin" })).body.apiKey as string;
    const id = (await call("POST", "/v1/templates/boards/tpl-builtin-class-lpm/create", { name: "LPM" }, root)).body.board.id as string;
    const none = await call("GET", `/v1/boards/${id}/instructors`, undefined, root);
    expect(none.body.instructors.map((u: { role: string }) => u.role)).toEqual(["owner"]);
    // A new colleague: a workspace user is created for them (mail is off in tests, so nothing is emailed).
    const added = await call("POST", `/v1/boards/${id}/instructors`, { name: "Sam", email: "sam@example.io" }, root);
    expect(added.status).toBe(201);
    expect(added.body).toMatchObject({ created: true, emailed: false });
    expect(added.body.instructors.map((u: { name: string; role: string; hasPassword: boolean }) => [u.name, u.role, u.hasPassword])).toEqual([["Root", "owner", false], ["Sam", "co-instructor", false]]);
    const sam = (await call("GET", "/v1/users", undefined, root)).body.users.find((u: { email: string }) => u.email === "sam@example.io") as { id: string; role: string };
    expect(sam.role).toBe("planner");
    // Adding again is idempotent; an existing user is simply named.
    const again = await call("POST", `/v1/boards/${id}/instructors`, { name: "Sam", email: "SAM@example.io" }, root);
    expect(again.body).toMatchObject({ created: false });
    expect(again.body.instructors).toHaveLength(2);
    // Sam signs in with a code (as a new colleague would from the email) and manages the class.
    await call("POST", "/v1/auth/forgot", { email: "sam@example.io" });
    const key = (await call("POST", `/v1/users/${sam.id}/rotate-key`, undefined, root)).body.apiKey as string;
    expect((await call("GET", `/v1/boards/${id}/students`, undefined, key)).status).toBe(200);
    expect((await call("POST", `/v1/boards/${id}/students`, { students: [{ name: "Ana", email: "ana@example.io" }] }, key)).status).toBe(201);
    expect((await call("PUT", `/v1/boards/${id}/teams`, { count: 2 }, key)).status).toBe(200);
    // Students may not manage instructors; removal leaves Sam's sign-in alone.
    const ana = (await call("GET", `/v1/boards/${id}/students`, undefined, root)).body.students[0] as { id: string };
    const link = await call("POST", `/v1/boards/${id}/students/${ana.id}/link`, {}, root);
    expect((await call("GET", `/v1/boards/${id}/instructors`, undefined, link.body.student.token)).status).toBe(403);
    expect((await call("DELETE", `/v1/boards/${id}/instructors/${sam.id}`, undefined, root)).status).toBe(200);
    expect((await call("GET", `/v1/boards/${id}/instructors`, undefined, root)).body.instructors).toHaveLength(1);
    expect((await call("GET", "/v1/me", undefined, key)).status).toBe(200);
  });
});
