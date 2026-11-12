// A company's instructors: the people who teach its classes and the courses each one teaches (their
// portfolio). An admin adds them by name and email, as trainers (a trainer seat each, they lead
// classes) or as co-instructors only (no seat, they run the classes they are added to). A class
// then picks its co-instructors from this roster, those who teach its course first (students.ts).

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { CLASS_META } from "@trainyard/core";
import { hashKey, newKey, require, type User } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Mailer } from "./mailer.js";
import { CODE_LIFETIME_MINUTES, type ResetCodes } from "./password-reset.js";
import { limitsFor, planLimitError, usageOf } from "./plans.js";
import type { Tenants } from "./tenants.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

const COURSE_IDS = CLASS_META.map((c) => c.id) as [string, ...string[]];
const Courses = z.array(z.enum(COURSE_IDS)).max(COURSE_IDS.length);

export interface InstructorOptions {
  mailer?: Mailer;
  webUrl?: string;
  codes?: ResetCodes;
}

/** An instructor as the roster shows them: trainers lead classes; co-instructors run the ones they are added to. */
export const publicInstructor = (u: User) => ({ id: u.id, name: u.name, email: u.email, kind: u.role === "viewer" ? ("co-instructor" as const) : ("trainer" as const), admin: u.role === "admin", courses: u.courses ?? [], hasPassword: !!u.passwordHash, disabled: !!u.disabled });

export function registerInstructorRoutes(app: App, tenants: Tenants, opts: InstructorOptions = {}) {
  const platform = tenants.platform;
  const here = (req: FastifyRequest) => req.principal.workspaceId;
  const members = (req: FastifyRequest) => tenants.members(here(req)).filter((u) => !u.disabled);
  const web = (opts.webUrl ?? "").replace(/\/$/, "");

  // Everyone who can teach here, with their courses. Trainers may read it (to pick co-instructors); admins change it.
  app.get("/v1/instructors", async (req) => {
    require(req, "plan");
    if (req.principal.guestBoardId) throw new ApiError(403, "FORBIDDEN", "Students cannot see the instructors.");
    return { instructors: members(req).map(publicInstructor), courses: CLASS_META, canManage: req.principal.role === "admin", company: tenants.record(here(req))?.kind === "company" };
  });

  app.post("/v1/instructors", { schema: { body: z.object({ name: z.string().trim().min(1).max(80), email: z.string().trim().email().max(200), kind: z.enum(["trainer", "co-instructor"]).default("trainer"), courses: Courses.default([]) }) } }, async (req, reply) => {
    require(req, "users");
    const email = req.body.email.toLowerCase();
    if (platform.state.users.some((u) => u.email.toLowerCase() === email)) throw new ApiError(409, "EMAIL_TAKEN", "This email already has a Trainyard sign-in. If they are in your company, they are in the list already; otherwise ask them for another address.");
    const role = req.body.kind === "trainer" ? "planner" : "viewer";
    const record = tenants.record(here(req));
    if (record) {
      const limits = limitsFor(record.plan, record.seats), usage = usageOf(tenants.handle.state, tenants.members(here(req)));
      if (limits.members !== null && usage.members + 1 > limits.members) throw planLimitError(record, "members", limits.members, usage.members);
      if (role === "planner" && limits.staff !== null && usage.staff + 1 > limits.staff) throw planLimitError(record, "staff", limits.staff, usage.staff);
    }
    const user: User = { id: `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`, name: req.body.name, email, role, keyHash: hashKey(newKey()), createdAt: platform.now().toISOString(), courses: req.body.courses, ...(here(req) === tenants.platformId ? {} : { workspaceId: here(req) }) };
    platform.state.users.push(user);
    await platform.commit(req.principal, "user.create", { userId: user.id, role, workspaceId: here(req), instructor: true });
    let emailed = false;
    if (opts.mailer?.live) {
      const code = opts.codes?.issue(user.id);
      const company = record?.name ?? "your team";
      const teaches = req.body.courses.map((c) => CLASS_META.find((m) => m.id === c)?.name).filter(Boolean).join(", ");
      try {
        await opts.mailer.send({
          to: email,
          subject: `${req.principal.name} added you as an instructor at ${company}`,
          text: `Hi ${user.name},\n\n${req.principal.name} added you as ${req.body.kind === "trainer" ? "an instructor" : "a co-instructor"} at ${company} on Trainyard${teaches ? `, for: ${teaches}` : ""}.\n\n${code ? `To sign in for the first time, choose a password with this code: ${code} (it works for ${CODE_LIFETIME_MINUTES} minutes${web ? `, at ${web}/reset?email=${encodeURIComponent(email)}` : ""}).` : `Sign in${web ? ` at ${web}/login` : ""}.`}\n\nTrainyard`,
        });
        emailed = true;
      } catch (e) {
        console.error(`[mail] instructor invite to ${email} not sent: ${(e as Error).message}`);
      }
    }
    return reply.code(201).send({ instructor: publicInstructor(user), emailed });
  });

  // An instructor's courses (their portfolio); an admin also moves them between trainer and co-instructor.
  app.patch("/v1/instructors/:id", { schema: { params: z.object({ id: z.string().max(80) }), body: z.object({ courses: Courses.optional(), kind: z.enum(["trainer", "co-instructor"]).optional() }) } }, async (req) => {
    require(req, "users");
    const u = tenants.members(here(req)).find((x) => x.id === req.params.id);
    if (!u) throw notFound("Instructor");
    if (req.body.courses) u.courses = req.body.courses;
    if (req.body.kind && u.role !== "admin") {
      const role = req.body.kind === "trainer" ? "planner" : "viewer";
      const record = tenants.record(here(req));
      if (role === "planner" && u.role === "viewer" && record) {
        const limits = limitsFor(record.plan, record.seats), usage = usageOf(tenants.handle.state, tenants.members(here(req)));
        if (limits.staff !== null && usage.staff + 1 > limits.staff) throw planLimitError(record, "staff", limits.staff, usage.staff);
      }
      u.role = role;
    }
    await platform.commit(req.principal, "user.update", { userId: u.id, courses: u.courses?.length ?? 0, role: u.role });
    return { instructor: publicInstructor(u) };
  });
}
