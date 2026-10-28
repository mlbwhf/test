// Students in a class: the trainer adds names and emails, and each student gets a personal link
// that opens that one class board, with no account. The link carries a guest token (gst_…);
// only its hash is kept, so a lost link is replaced, not recovered. A guest can read the class
// board and add, edit and move cards on it, nothing else (auth.ts limits the routes).

import { randomBytes } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { seatStudents, type Board } from "@trainyard/core";
import { hashKey, require } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Mailer } from "./mailer.js";
import type { Store } from "./store.js";
import type { Tenants } from "./tenants.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

export interface ClassGuest {
  id: string;
  workspaceId: string;
  boardId: string;
  name: string;
  email: string;
  tokenHash: string;
  createdAt: string;
  /** When the link was last emailed. */
  emailedAt?: string;
  /** When the student last opened the board. */
  seenAt?: string;
}

export const newGuestToken = () => `gst_${randomBytes(24).toString("base64url")}`;

export interface StudentOptions {
  mailer?: Mailer;
  /** The website's origin, for the links in emails. */
  webUrl?: string;
}

const Student = z.object({ name: z.string().trim().min(1).max(80), email: z.string().trim().email().max(200) });
const MAX_STUDENTS = 300;

/** Seats a class board's students on it (the icebreaker and the team); boards.ts calls it after a wipe. */
export function seatClass(tenants: Tenants, store: Store) {
  return async (req: FastifyRequest, b: Board) => {
    const list = (tenants.platform.state.classGuests ?? []).filter((g) => g.boardId === b.id && g.workspaceId === req.principal.workspaceId).sort((a, c) => a.createdAt.localeCompare(c.createdAt));
    if (seatStudents(b, list.map((g) => ({ id: g.id, name: g.name })))) await store.commit(req.principal, "class.students.seat", { boardId: b.id, students: list.length });
  };
}

export function registerStudentRoutes(app: App, tenants: Tenants, store: Store, opts: StudentOptions = {}) {
  const platform = tenants.platform;
  const guests = () => (platform.state.classGuests ??= []);
  const classBoard = (req: FastifyRequest, id: string) => {
    require(req, "plan");
    if (req.principal.guestBoardId) throw new ApiError(403, "FORBIDDEN", "Students cannot manage the class.");
    const b = (store.state.workspace.boards ?? []).find((x) => x.id === id && !x.isTemplate);
    if (!b) throw notFound("Class board");
    return b;
  };
  const here = (req: FastifyRequest) => req.principal.workspaceId;
  const seat = seatClass(tenants, store);
  const view = (g: ClassGuest) => ({ id: g.id, name: g.name, email: g.email, createdAt: g.createdAt, ...(g.emailedAt ? { emailedAt: g.emailedAt } : {}), ...(g.seenAt ? { seenAt: g.seenAt } : {}) });
  const link = (token: string) => `${(opts.webUrl ?? "").replace(/\/$/, "")}/join/${token}`;
  const email = async (g: ClassGuest, boardName: string, token: string) => {
    if (!opts.mailer?.live || !opts.webUrl) {
      console.warn(`[mail] class link for ${g.email} not sent: ${opts.mailer?.live ? "no web address (TRAINYARD_WEB_URL)" : "mail is off (TRAINYARD_SMTP_URL)"}`);
      return false;
    }
    await opts.mailer.send({
      to: g.email,
      subject: `Your link to ${boardName}`,
      text: `Hi ${g.name},\n\nYour trainer has added you to "${boardName}". Open the class board with your personal link; no account is needed:\n\n${link(token)}\n\nKeep the link to yourself: it opens the board as you.\n\nTrainyard`,
    });
    g.emailedAt = new Date().toISOString();
    return true;
  };

  app.get("/v1/boards/:id/students", { schema: { params: z.object({ id: z.string().max(200) }) } }, async (req) => {
    const b = classBoard(req, req.params.id);
    return { students: guests().filter((g) => g.boardId === b.id && g.workspaceId === here(req)).map(view), canEmail: !!(opts.mailer?.live && opts.webUrl) };
  });

  // Adds students; the new links come back once. An email already on the class keeps the link it
  // was sent (only "New link" replaces one), so pasting the list again never breaks sent links.
  app.post("/v1/boards/:id/students", { schema: { params: z.object({ id: z.string().max(200) }), body: z.object({ students: z.array(Student).min(1).max(MAX_STUDENTS), send: z.boolean().default(false) }) } }, async (req, reply) => {
    const b = classBoard(req, req.params.id);
    const onBoard = () => guests().filter((g) => g.boardId === b.id && g.workspaceId === here(req));
    const out: (ReturnType<typeof view> & { token?: string; emailed: boolean; existing?: true })[] = [];
    for (const s of req.body.students) {
      let g = onBoard().find((x) => x.email.toLowerCase() === s.email.toLowerCase());
      if (g) {
        g.name = s.name;
        out.push({ ...view(g), emailed: false, existing: true });
        continue;
      }
      if (onBoard().length >= MAX_STUDENTS) throw new ApiError(413, "TOO_MANY_STUDENTS", `A class holds up to ${MAX_STUDENTS} students.`);
      const token = newGuestToken();
      g = { id: `st-${randomBytes(6).toString("base64url")}`, workspaceId: here(req), boardId: b.id, name: s.name, email: s.email.toLowerCase(), tokenHash: hashKey(token), createdAt: new Date().toISOString() };
      guests().push(g);
      const emailed = req.body.send ? await email(g, b.name, token).catch((e: Error) => (console.error(`[mail] class link for ${g.email} not sent: ${e.message}`), false)) : false;
      out.push({ ...view(g), token, emailed });
    }
    await platform.commit(req.principal, "class.students.add", { boardId: b.id, count: out.length });
    await seat(req, b);
    return reply.code(201).send({ students: out });
  });

  // A new link for one student; the old one stops working.
  app.post("/v1/boards/:id/students/:sid/link", { schema: { params: z.object({ id: z.string().max(200), sid: z.string().max(80) }), body: z.object({ send: z.boolean().default(false) }).optional() } }, async (req) => {
    const b = classBoard(req, req.params.id);
    const g = guests().find((x) => x.id === req.params.sid && x.boardId === b.id && x.workspaceId === here(req));
    if (!g) throw notFound("Student");
    const token = newGuestToken();
    g.tokenHash = hashKey(token);
    const emailed = req.body?.send ? await email(g, b.name, token).catch((e: Error) => (console.error(`[mail] class link for ${g.email} not sent: ${e.message}`), false)) : false;
    await platform.commit(req.principal, "class.students.link", { boardId: b.id, studentId: g.id });
    return { student: { ...view(g), token, emailed } };
  });

  app.delete("/v1/boards/:id/students/:sid", { schema: { params: z.object({ id: z.string().max(200), sid: z.string().max(80) }) } }, async (req, reply) => {
    const b = classBoard(req, req.params.id);
    const before = guests().length;
    platform.state.classGuests = guests().filter((x) => !(x.id === req.params.sid && x.boardId === b.id && x.workspaceId === here(req)));
    if (guests().length === before) throw notFound("Student");
    await platform.commit(req.principal, "class.students.remove", { boardId: b.id, studentId: req.params.sid });
    await seat(req, b);
    return reply.code(204).send();
  });
}

/** The routes a student's link may use: their class board and its cards and connectors. */
export function guestMayUse(method: string, url: string, boardId: string): boolean {
  const path = (url.split("?")[0] ?? url).replace(/\/$/, "");
  if (method === "GET" && path === "/v1/me") return true;
  const base = `/v1/boards/${encodeURIComponent(boardId)}`;
  const alt = `/v1/boards/${boardId}`;
  for (const b of new Set([base, alt])) {
    if (!path.startsWith(b)) continue;
    const rest = path.slice(b.length);
    if (rest && !rest.startsWith("/")) continue;
    if (method === "GET" && (rest === "" || rest === "/timer" || /^\/nodes\/[^/]+\/backlinks$/.test(rest))) return true;
    if (/^\/nodes(\/[^/]+)?$/.test(rest) && ["POST", "PATCH", "DELETE"].includes(method)) return true;
    if (/^\/edges(\/[^/]+)?$/.test(rest) && ["POST", "DELETE"].includes(method)) return true;
    if (/^\/frames\/[^/]+\/state$/.test(rest) && method === "PUT") return true;
  }
  return false;
}
