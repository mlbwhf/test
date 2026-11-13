"use client";

// The company console: the admin (the company's owner) sees every class, assigns its lead
// instructor and co-instructors, keeps the instructor roster with the courses each one teaches,
// and follows progress by class, by instructor and by course.

import Link from "next/link";
import { useState } from "react";
import { ErrorList, Loading, PageHead } from "@/components/ui";
import { api, download, useApi, useMe, type ApiFailure } from "@/lib/api";

type Course = { id: string; name: string; short: string };
type Instructor = { id: string; name: string; email: string; kind: "trainer" | "co-instructor"; admin: boolean; courses: string[]; hasPassword: boolean; disabled: boolean };
type Student = { id: string; name: string; email: string; joined: boolean; lastSeen: string | null; team: string | null; contributions: number };
type ClassRow = {
  id: string; name: string; course: string; courseName: string;
  lead: { id: string; name: string } | null; coInstructors: { id: string; name: string }[];
  students: number; joined: number; teams: number; exercises: number; done: number; contributions: number;
  archived: string | null; lastActivity: string | null; roster: Student[];
};
type Report = {
  company: string;
  totals: { classes: number; live: number; instructors: number; students: number; joined: number; progress: number };
  classes: ClassRow[];
  byInstructor: { id: string; name: string; courses: string[]; led: number; coInstructing: number; students: number; progress: number }[];
  byCourse: { course: string; courseName: string; classes: number; students: number; joined: number; progress: number }[];
};

const pct = (d: number, t: number) => (t ? Math.round((d / t) * 100) : 0);
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—");

function Bar({ value }: { value: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 120 }}>
      <span style={{ flex: 1, height: 8, borderRadius: 8, border: "1.5px solid #0d1815", overflow: "hidden", background: "#fff" }}>
        <span style={{ display: "block", height: "100%", width: `${value}%`, background: value >= 80 ? "#1fb89a" : value >= 40 ? "#ffb627" : "#ff9fc6" }} />
      </span>
      <b style={{ fontSize: 13, minWidth: 34, textAlign: "right" }}>{value}%</b>
    </span>
  );
}

export default function CompanyPage() {
  const me = useMe();
  const report = useApi<Report>("/v1/company/report");
  const roster = useApi<{ instructors: Instructor[]; courses: Course[]; canManage: boolean; company: boolean }>("/v1/instructors");
  const [tab, setTab] = useState<"classes" | "instructors" | "reports">("classes");
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  if (!me.data) return <Loading error={me.error} />;
  if (me.data.principal.role !== "admin") return <div className="notice warn">The company console is for the company&apos;s admin.</div>;
  if (!report.data || !roster.data) return <Loading error={report.error ?? roster.error} />;
  const r = report.data, people = roster.data.instructors, courses = roster.data.courses;
  // Anyone on the roster can be given a class to lead, trainer seat or not.
  const trainers = people.filter((p) => !p.disabled);
  const courseName = (id: string) => courses.find((c) => c.id === id)?.short ?? id;
  const run = async (fn: () => Promise<unknown>, done?: string) => {
    setErr(null);
    try {
      await fn();
      if (done) setNote(done);
      await Promise.all([report.reload(), roster.reload()]);
    } catch (e) {
      setErr((e as ApiFailure).message);
    }
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <PageHead
        title={r.company}
        sub={`Company console · ${r.totals.live} running class${r.totals.live === 1 ? "" : "es"} · ${r.totals.instructors} instructor${r.totals.instructors === 1 ? "" : "s"} · ${r.totals.students} student${r.totals.students === 1 ? "" : "s"}`}
        actions={<button className="btn" onClick={() => void download("/v1/company/report.csv", `trainyard-progress-${new Date().toISOString().slice(0, 10)}.csv`).catch((e) => setErr((e as Error).message))}>Download progress (CSV)</button>}
      />
      {!roster.data.company ? <div className="notice">This workspace is set up as an individual trainer. Everything here works the same; ask support to mark it a company if several instructors teach under one name.</div> : null}
      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        {[
          ["Running classes", String(r.totals.live)],
          ["Instructors", String(r.totals.instructors)],
          ["Students", String(r.totals.students)],
          ["Students who joined", `${r.totals.joined} (${pct(r.totals.joined, r.totals.students)}%)`],
          ["Exercises done (running classes)", `${r.totals.progress}%`],
        ].map(([k, v]) => (
          <div key={k} className="panel panel-body" style={{ minWidth: 170, padding: "12px 16px" }}>
            <div style={{ font: "800 26px 'Familjen Grotesk', sans-serif" }}>{v}</div>
            <div className="faint" style={{ fontSize: 13 }}>{k}</div>
          </div>
        ))}
      </div>
      <div className="row" role="tablist" style={{ gap: 6 }}>
        {(["classes", "instructors", "reports"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={`btn${tab === t ? " primary" : ""}`} onClick={() => setTab(t)}>
            {t === "classes" ? "Classes" : t === "instructors" ? "Instructors" : "Reports"}
          </button>
        ))}
      </div>
      {err ? <ErrorList title="That did not work" items={[{ message: err }]} /> : null}
      {note ? <div className="notice" role="status">{note}</div> : null}

      {tab === "classes" ? (
        <section className="panel panel-body stack" style={{ gap: 10 }}>
          {!r.classes.length ? <p className="faint">No classes yet. Create one under Templates → Classes; it shows here with its instructors and progress.</p> : null}
          <div style={{ overflowX: "auto" }}>
            <table className="table" style={{ width: "100%", minWidth: 900 }}>
              <thead>
                <tr><th>Class</th><th>Course</th><th>Lead instructor</th><th>Co-instructors</th><th>Students</th><th>Progress</th><th>Last activity</th><th></th></tr>
              </thead>
              <tbody>
                {r.classes.map((c) => {
                  const others = people.filter((p) => !p.disabled && p.id !== c.lead?.id && !c.coInstructors.some((x) => x.id === p.id));
                  return (
                    <tr key={c.id} style={{ opacity: c.archived ? 0.6 : 1, verticalAlign: "top" }}>
                      <td><b>{c.name}</b>{c.archived ? <div className="faint" style={{ fontSize: 12 }}>Archived {day(c.archived)}</div> : null}</td>
                      <td>{c.courseName}</td>
                      <td>
                        <select aria-label={`Lead instructor of ${c.name}`} value={c.lead?.id ?? ""} onChange={(e) => e.target.value && void run(() => api("PUT", `/v1/company/classes/${encodeURIComponent(c.id)}/lead`, { userId: e.target.value }), `${people.find((p) => p.id === e.target.value)?.name ?? "The instructor"} now leads ${c.name}.`)}>
                          {!c.lead ? <option value="">—</option> : null}
                          {c.lead && !trainers.some((t) => t.id === c.lead!.id) ? <option value={c.lead.id}>{c.lead.name}</option> : null}
                          {trainers.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}{t.courses.includes(c.course) ? " ✓" : ""}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                          {c.coInstructors.map((x) => (
                            <span key={x.id} className="badge" style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                              {x.name}
                              <button aria-label={`Take ${x.name} off ${c.name}`} onClick={() => void run(() => api("DELETE", `/v1/boards/${encodeURIComponent(c.id)}/instructors/${encodeURIComponent(x.id)}`))} style={{ border: 0, background: "none", cursor: "pointer", fontWeight: 800 }}>×</button>
                            </span>
                          ))}
                          {others.length ? (
                            <select aria-label={`Add a co-instructor to ${c.name}`} value="" onChange={(e) => e.target.value && void run(() => api("POST", `/v1/boards/${encodeURIComponent(c.id)}/instructors`, { userId: e.target.value }))}>
                              <option value="">+ add</option>
                              {[...others].sort((a, b) => Number(b.courses.includes(c.course)) - Number(a.courses.includes(c.course)) || a.name.localeCompare(b.name)).map((p) => (
                                <option key={p.id} value={p.id}>{p.name}{p.courses.includes(c.course) ? " ✓ teaches this course" : ""}</option>
                              ))}
                            </select>
                          ) : null}
                        </div>
                      </td>
                      <td>{c.joined}/{c.students} joined{c.teams ? <div className="faint" style={{ fontSize: 12 }}>{c.teams} teams</div> : null}</td>
                      <td><Bar value={pct(c.done, c.exercises)} /><div className="faint" style={{ fontSize: 12 }}>{c.done} of {c.exercises} exercises</div></td>
                      <td>{day(c.lastActivity)}</td>
                      <td className="row" style={{ gap: 6 }}>
                        <Link className="btn small" href={`/boards/${encodeURIComponent(c.id)}`}>Open</Link>
                        <button className="btn small ghost" onClick={() => { setTab("reports"); setOpen(c.id); }}>Students</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="faint" style={{ fontSize: 13, margin: 0 }}>✓ marks instructors who teach the class&apos;s course. Pick any instructor as a class&apos;s lead; the one replaced stays on as co-instructor. Add students from a class&apos;s own page (Open → Students).</p>
        </section>
      ) : null}

      {tab === "instructors" ? <Roster people={people} courses={courses} canManage={roster.data.canManage} run={run} /> : null}

      {tab === "reports" ? (
        <div className="stack" style={{ gap: 16 }}>
          <section className="panel panel-body stack" style={{ gap: 8 }}>
            <h2 style={{ margin: 0 }}>By instructor</h2>
            <table className="table" style={{ width: "100%" }}>
              <thead><tr><th>Instructor</th><th>Teaches</th><th>Leads</th><th>Co-instructs</th><th>Students</th><th>Progress</th></tr></thead>
              <tbody>
                {r.byInstructor.map((i) => (
                  <tr key={i.id}><td><b>{i.name}</b></td><td>{i.courses.map(courseName).join(", ") || "—"}</td><td>{i.led}</td><td>{i.coInstructing}</td><td>{i.students}</td><td><Bar value={i.progress} /></td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="panel panel-body stack" style={{ gap: 8 }}>
            <h2 style={{ margin: 0 }}>By course</h2>
            <table className="table" style={{ width: "100%" }}>
              <thead><tr><th>Course</th><th>Classes</th><th>Students</th><th>Joined</th><th>Progress</th></tr></thead>
              <tbody>
                {r.byCourse.map((c) => (
                  <tr key={c.course}><td><b>{c.courseName}</b></td><td>{c.classes}</td><td>{c.students}</td><td>{c.joined}</td><td><Bar value={c.progress} /></td></tr>
                ))}
              </tbody>
            </table>
          </section>
          <section className="panel panel-body stack" style={{ gap: 8 }}>
            <h2 style={{ margin: 0 }}>Students, by class</h2>
            {r.classes.map((c) => (
              <details key={c.id} open={open === c.id} onToggle={(e) => (e.currentTarget.open ? setOpen(c.id) : open === c.id && setOpen(null))}>
                <summary style={{ cursor: "pointer" }}>
                  <b>{c.name}</b> · {c.courseName} · {c.joined}/{c.students} joined · {pct(c.done, c.exercises)}% of exercises done
                </summary>
                {c.roster.length ? (
                  <table className="table" style={{ width: "100%", marginTop: 8 }}>
                    <thead><tr><th>Student</th><th>Email</th><th>Team</th><th>Joined</th><th>Last seen</th><th>Contributions</th></tr></thead>
                    <tbody>
                      {c.roster.map((s) => (
                        <tr key={s.id}><td>{s.name}</td><td>{s.email}</td><td>{s.team ?? "—"}</td><td>{s.joined ? "Yes" : "Not yet"}</td><td>{day(s.lastSeen)}</td><td>{s.contributions}</td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="faint">No students yet.</p>
                )}
              </details>
            ))}
            <p className="faint" style={{ fontSize: 13, margin: 0 }}>Contributions count the cards a student added on the class canvas. Exercise progress is what the instructors marked complete.</p>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Roster({ people, courses, canManage, run }: { people: Instructor[]; courses: Course[]; canManage: boolean; run: (fn: () => Promise<unknown>, done?: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState<"trainer" | "co-instructor">("trainer");
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  return (
    <section className="panel panel-body stack" style={{ gap: 14 }}>
      <p className="faint" style={{ margin: 0 }}>Instructors can create classes and use a trainer seat each. Co-instructors use no seat: they run only the classes you assign them, as lead or as co-instructor. Tick the courses each person teaches: classes for that course list them first.</p>
      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ width: "100%", minWidth: 760 }}>
          <thead><tr><th>Name</th><th>Role</th><th>Courses they teach</th><th>Sign-in</th></tr></thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} style={{ opacity: p.disabled ? 0.5 : 1, verticalAlign: "top" }}>
                <td><b>{p.name}</b><div className="faint" style={{ fontSize: 12 }}>{p.email}</div></td>
                <td>
                  {p.admin ? "Admin" : canManage ? (
                    <select aria-label={`Role of ${p.name}`} value={p.kind} onChange={(e) => void run(() => api("PATCH", `/v1/instructors/${encodeURIComponent(p.id)}`, { kind: e.target.value }))}>
                      <option value="trainer">Instructor</option>
                      <option value="co-instructor">Co-instructor only</option>
                    </select>
                  ) : p.kind === "trainer" ? "Instructor" : "Co-instructor only"}
                </td>
                <td>
                  <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
                    {courses.map((c) => (
                      <label key={c.id} className="badge" style={{ cursor: canManage ? "pointer" : "default", background: p.courses.includes(c.id) ? "#cfe8d4" : "#fff", display: "inline-flex", gap: 4, alignItems: "center" }} title={c.name}>
                        <input type="checkbox" checked={p.courses.includes(c.id)} disabled={!canManage} onChange={() => void run(() => api("PATCH", `/v1/instructors/${encodeURIComponent(p.id)}`, { courses: toggle(p.courses, c.id) }))} />
                        {c.short}
                      </label>
                    ))}
                  </div>
                </td>
                <td>{p.hasPassword ? "Signed in" : "Invited"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {canManage ? (
        <div className="stack" style={{ gap: 8, borderTop: "1px dashed #0d181833", paddingTop: 12 }}>
          <b>Add an instructor</b>
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Instructor name" style={{ flex: "1 1 160px" }} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="their@email" type="email" aria-label="Instructor email" style={{ flex: "1 1 200px" }} />
            <select value={kind} onChange={(e) => setKind(e.target.value as "trainer" | "co-instructor")} aria-label="Role">
              <option value="trainer">Instructor (trainer seat)</option>
              <option value="co-instructor">Co-instructor only (no seat)</option>
            </select>
          </div>
          <div className="row" style={{ gap: 4, flexWrap: "wrap" }}>
            <span className="faint" style={{ fontSize: 13 }}>Teaches:</span>
            {courses.map((c) => (
              <label key={c.id} className="badge" style={{ cursor: "pointer", background: picked.includes(c.id) ? "#cfe8d4" : "#fff", display: "inline-flex", gap: 4, alignItems: "center" }} title={c.name}>
                <input type="checkbox" checked={picked.includes(c.id)} onChange={() => setPicked(toggle(picked, c.id))} />
                {c.short}
              </label>
            ))}
          </div>
          <div>
            <button
              className="btn primary"
              disabled={!name.trim() || !email.trim()}
              onClick={() =>
                void run(async () => {
                  const res = await api<{ emailed: boolean }>("POST", "/v1/instructors", { name: name.trim(), email: email.trim(), kind, courses: picked });
                  setName("");
                  setEmail("");
                  setPicked([]);
                  return res;
                }, `${name.trim()} is on the roster. They get an email to choose a password when mail is on; otherwise they use “Forgot password” with ${email.trim()}.`)
              }
            >
              Add instructor
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
