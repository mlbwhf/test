// The company console: the admin (the company's owner) sees every class, assigns its lead
// instructor and co-instructors, and follows progress — students joined, exercises done, what
// each student contributed — by class, by instructor and by course, with a CSV download.

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { CLASS_META, classTeams, type Board, type Frame } from "@trainyard/core";
import { require, type User } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Store } from "./store.js";
import type { Tenants } from "./tenants.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

const isLesson = (f: Frame) => /^Lesson\s+\d+/i.test(f.title);
/** The exercises of a class: frames inside a numbered lesson (teams' copies aside). */
export function exercisesOf(b: Board): Frame[] {
  const lessons = new Set(b.frames.filter((f) => !f.parentId && !f.copyOf && isLesson(f)).map((f) => f.id));
  return b.frames.filter((f) => f.parentId && lessons.has(f.parentId) && !f.copyOf);
}
const ids = (b: Board): string[] => (Array.isArray(b.fields?.instructors) ? (b.fields!.instructors as unknown[]).filter((x): x is string => typeof x === "string") : []);

export function registerCompanyRoutes(app: App, tenants: Tenants, store: Store) {
  const platform = tenants.platform;
  const here = (req: FastifyRequest) => req.principal.workspaceId;
  const admin = (req: FastifyRequest) => {
    require(req, "users");
    if (req.principal.guestBoardId) throw new ApiError(403, "FORBIDDEN", "Company admins only.");
  };
  const classes = () => (store.state.workspace.boards ?? []).filter((b) => !b.isTemplate && b.fields?.class);
  const people = (req: FastifyRequest) => tenants.members(here(req));
  const name = (us: User[], id: unknown) => (typeof id === "string" ? us.find((u) => u.id === id)?.name : undefined);

  /** One class, summed up for the report. */
  const rowOf = (req: FastifyRequest, b: Board, us: User[]) => {
    const guests = (platform.state.classGuests ?? []).filter((g) => g.boardId === b.id && g.workspaceId === here(req));
    const ex = exercisesOf(b);
    const course = String(b.fields?.class ?? "");
    const contributions = (gid: string) => b.nodes.filter((n) => n.fields?.createdBy === `guest:${gid}`).length;
    return {
      id: b.id,
      name: b.name,
      course,
      courseName: CLASS_META.find((c) => c.id === course)?.name ?? (course === "custom" ? "Own class" : course),
      lead: typeof b.fields?.ownerId === "string" ? { id: b.fields.ownerId, name: name(us, b.fields.ownerId) ?? "Former instructor" } : null,
      coInstructors: ids(b).map((id) => ({ id, name: name(us, id) ?? "Former instructor" })),
      students: guests.length,
      joined: guests.filter((g) => g.seenAt).length,
      teams: classTeams(b).length,
      exercises: ex.length,
      done: ex.filter((f) => f.done).length,
      contributions: guests.reduce((n, g) => n + contributions(g.id), 0),
      archived: typeof b.fields?.archived === "string" ? b.fields.archived : null,
      lastActivity: typeof b.fields?.touchedAt === "string" ? b.fields.touchedAt : null,
      roster: guests.map((g) => ({ id: g.id, name: g.name, email: g.email, joined: !!g.seenAt, lastSeen: g.seenAt ?? null, team: classTeams(b).find((t) => t.members.includes(g.id))?.name ?? null, contributions: contributions(g.id) })),
    };
  };

  app.get("/v1/company/report", async (req) => {
    admin(req);
    const us = people(req);
    const rows = classes().map((b) => rowOf(req, b, us)).sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""));
    const live = rows.filter((r) => !r.archived);
    const pct = (d: number, t: number) => (t ? Math.round((d / t) * 100) : 0);
    const byInstructor = us.filter((u) => !u.disabled).map((u) => {
      const led = rows.filter((r) => r.lead?.id === u.id), co = rows.filter((r) => r.coInstructors.some((c) => c.id === u.id));
      const mine = [...led, ...co];
      return { id: u.id, name: u.name, courses: u.courses ?? [], led: led.length, coInstructing: co.length, students: mine.reduce((n, r) => n + r.students, 0), progress: pct(mine.reduce((n, r) => n + r.done, 0), mine.reduce((n, r) => n + r.exercises, 0)) };
    }).filter((x) => x.led || x.coInstructing || x.courses.length);
    const byCourse = [...new Set(rows.map((r) => r.course))].map((course) => {
      const rs = rows.filter((r) => r.course === course);
      return { course, courseName: rs[0]!.courseName, classes: rs.length, students: rs.reduce((n, r) => n + r.students, 0), joined: rs.reduce((n, r) => n + r.joined, 0), progress: pct(rs.reduce((n, r) => n + r.done, 0), rs.reduce((n, r) => n + r.exercises, 0)) };
    });
    return {
      company: tenants.record(here(req))?.name ?? "This workspace",
      totals: { classes: rows.length, live: live.length, instructors: us.filter((u) => !u.disabled).length, students: rows.reduce((n, r) => n + r.students, 0), joined: rows.reduce((n, r) => n + r.joined, 0), progress: pct(live.reduce((n, r) => n + r.done, 0), live.reduce((n, r) => n + r.exercises, 0)) },
      classes: rows,
      byInstructor,
      byCourse,
    };
  });

  // The progress report as a spreadsheet: one row per student per class.
  app.get("/v1/company/report.csv", async (req, reply) => {
    admin(req);
    const us = people(req);
    const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [["Class", "Course", "Lead instructor", "Co-instructors", "Progress (exercises done)", "Student", "Email", "Team", "Joined", "Last seen", "Contributions"].map(q).join(",")];
    for (const b of classes()) {
      const r = rowOf(req, b, us);
      const base = [r.name, r.courseName, r.lead?.name ?? "", r.coInstructors.map((c) => c.name).join("; "), `${r.done}/${r.exercises}`];
      if (!r.roster.length) lines.push([...base, "", "", "", "", "", ""].map(q).join(","));
      for (const s of r.roster) lines.push([...base, s.name, s.email, s.team ?? "", s.joined ? "yes" : "no", s.lastSeen ?? "", s.contributions].map(q).join(","));
    }
    reply.header("content-type", "text/csv; charset=utf-8").header("content-disposition", `attachment; filename="trainyard-progress-${new Date().toISOString().slice(0, 10)}.csv"`);
    return "﻿" + lines.join("\r\n") + "\r\n";
  });

  // Assign a class's lead instructor: anyone on the roster (someone without a trainer seat leads the classes
  // they are assigned, and only those); the one they replace stays on as a co-instructor.
  app.put("/v1/company/classes/:id/lead", { schema: { params: z.object({ id: z.string().max(200) }), body: z.object({ userId: z.string().max(80) }) } }, async (req) => {
    admin(req);
    const b = classes().find((x) => x.id === req.params.id);
    if (!b) throw notFound("Class");
    const u = people(req).find((x) => x.id === req.body.userId && !x.disabled);
    if (!u) throw notFound("Instructor");
    const before = typeof b.fields?.ownerId === "string" ? b.fields.ownerId : undefined;
    const co = ids(b).filter((x) => x !== u.id);
    if (before && before !== u.id && !co.includes(before)) co.push(before);
    b.fields = { ...(b.fields ?? {}), ownerId: u.id, instructors: co };
    await store.commit(req.principal, "class.lead", { boardId: b.id, userId: u.id });
    return { lead: { id: u.id, name: u.name }, coInstructors: co };
  });
}
