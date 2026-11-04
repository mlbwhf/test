// Students in a class: the trainer adds names and emails, and each student gets a personal link
// that opens that one class board, with no account. The link carries a guest token (gst_…);
// only its hash is kept, so a lost link is replaced, not recovered. A guest can read the class
// board and add, edit and move cards on it, nothing else (auth.ts limits the routes).

import { randomBytes } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { classTeams, makeRounds, makeTeams, MAX_TEAMS, placeStudent, roundCount, seatStudents, teamOf, teamPolicy, teamRounds, type Board, type ClassTeam, type TeamPolicy } from "@trainyard/core";
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
  /** An older domain serving the same class links, for networks that block the main one. */
  webMirrorUrl?: string;
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
  const studentIds = (req: FastifyRequest, b: Board) => guests().filter((g) => g.boardId === b.id && g.workspaceId === here(req)).map((g) => g.id);
  // Writes the teams back: round 0 is `teams`; with a rotation policy, the other rounds follow.
  const saveTeams = (b: Board, teams: ClassTeam[], rounds: ClassTeam[][], ids: string[], policy: TeamPolicy) => {
    const all = teams.length ? makeRounds(policy, teams, rounds, ids, roundCount(b, policy)) : [[]];
    b.fields = { ...(b.fields ?? {}), teams, teamPolicy: policy, teamRounds: all.slice(1).length ? all : undefined };
    if (b.fields.teamRounds === undefined) delete b.fields.teamRounds;
    return all;
  };
  const view = (g: ClassGuest) => ({ id: g.id, name: g.name, email: g.email, createdAt: g.createdAt, ...(g.emailedAt ? { emailedAt: g.emailedAt } : {}), ...(g.seenAt ? { seenAt: g.seenAt } : {}) });
  const link = (token: string) => `${(opts.webUrl ?? "").replace(/\/$/, "")}/join/${token}`;
  const mirrorLink = (token: string) => (opts.webMirrorUrl ? `${opts.webMirrorUrl.replace(/\/$/, "")}/join/${token}` : undefined);
  const links = (token: string) => (opts.webUrl ? { link: link(token), ...(mirrorLink(token) ? { mirrorLink: mirrorLink(token) } : {}) } : {});
  // The invitation names the trainer and the class and replies to the trainer, so a strict mail
  // filter (government and corporate mail gateways) sees a message from a person about a known
  // class, not a bare link. It also tells the student what to ask IT for when a filter still objects.
  const email = async (g: ClassGuest, boardName: string, token: string, trainer: { name: string; email?: string }, team?: ClassTeam) => {
    if (!opts.mailer?.live || !opts.webUrl) {
      console.warn(`[mail] class link for ${g.email} not sent: ${opts.mailer?.live ? "no web address (TRAINYARD_WEB_URL)" : "mail is off (TRAINYARD_SMTP_URL)"}`);
      return false;
    }
    const host = new URL(opts.webUrl).host;
    await opts.mailer.send({
      to: g.email,
      ...(trainer.email ? { replyTo: `${trainer.name} <${trainer.email}>` } : {}),
      subject: `${trainer.name} invited you to ${boardName}`,
      text: `Hi ${g.name},

${trainer.name} has added you to the class "${boardName}" on Trainyard, the board you will work on together during the class.${team ? `\n\nYou are in ${team.name}: the exercises you open on the board are your team's copy.` : ""}

Open it with your personal link; no account or password is needed:

${link(token)}
${mirrorLink(token) ? `\nIf your organisation's network blocks that address, this one opens the same board:\n\n${mirrorLink(token)}\n` : ""}
Keep the link to yourself: it opens the board as you. If you lose it, ${trainer.name} can send a new one.

If your browser shows a security warning on the link, or this email reached you in a spam or quarantine folder, your organisation's network or mail filter does not know ${host} yet. Ask your IT team to allow ${host} and api.${host.replace(/^www\./, "")} and email from support@${host.replace(/^www\./, "")}; both are the training platform of ${trainer.name}.

Replies to this email go to ${trainer.name}.

Trainyard`,
    });
    g.emailedAt = new Date().toISOString();
    return true;
  };
  const trainerOf = (req: FastifyRequest) => {
    const u = tenants.platform.state.users.find((x) => x.id === req.principal.userId);
    return { name: req.principal.name || "Your trainer", ...(u?.email ? { email: u.email } : {}) };
  };

  app.get("/v1/boards/:id/students", { schema: { params: z.object({ id: z.string().max(200) }) } }, async (req) => {
    const b = classBoard(req, req.params.id);
    return { students: guests().filter((g) => g.boardId === b.id && g.workspaceId === here(req)).map(view), teams: classTeams(b), teamPolicy: teamPolicy(b), teamRounds: teamRounds(b), canEmail: !!(opts.mailer?.live && opts.webUrl), ...(opts.webMirrorUrl ? { mirrorHost: new URL(opts.webMirrorUrl).host } : {}) };
  });

  // Adds students; the new links come back once. An email already on the class keeps the link it
  // was sent (only "New link" replaces one), so pasting the list again never breaks sent links.
  app.post("/v1/boards/:id/students", { schema: { params: z.object({ id: z.string().max(200) }), body: z.object({ students: z.array(Student).min(1).max(MAX_STUDENTS), send: z.boolean().default(false) }) } }, async (req, reply) => {
    const b = classBoard(req, req.params.id);
    const onBoard = () => guests().filter((g) => g.boardId === b.id && g.workspaceId === here(req));
    const out: (ReturnType<typeof view> & { token?: string; link?: string; mirrorLink?: string; emailed: boolean; existing?: true })[] = [];
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
      // With teams set up, a new student joins the smallest one.
      if (classTeams(b).length) saveTeams(b, makeTeams(classTeams(b).length, classTeams(b), onBoard().map((x) => x.id)), teamRounds(b), onBoard().map((x) => x.id), teamPolicy(b));
      const emailed = req.body.send ? await email(g, b.name, token, trainerOf(req), teamOf(classTeams(b), g.id)).catch((e: Error) => (console.error(`[mail] class link for ${g.email} not sent: ${e.message}`), false)) : false;
      out.push({ ...view(g), token, ...links(token), emailed });
    }
    await platform.commit(req.principal, "class.students.add", { boardId: b.id, count: out.length });
    if (classTeams(b).length) await store.commit(req.principal, "class.teams.seat", { boardId: b.id });
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
    const emailed = req.body?.send ? await email(g, b.name, token, trainerOf(req), teamOf(classTeams(b), g.id)).catch((e: Error) => (console.error(`[mail] class link for ${g.email} not sent: ${e.message}`), false)) : false;
    await platform.commit(req.principal, "class.students.link", { boardId: b.id, studentId: g.id });
    return { student: { ...view(g), token, ...links(token), emailed } };
  });

  app.delete("/v1/boards/:id/students/:sid", { schema: { params: z.object({ id: z.string().max(200), sid: z.string().max(80) }) } }, async (req, reply) => {
    const b = classBoard(req, req.params.id);
    const before = guests().length;
    platform.state.classGuests = guests().filter((x) => !(x.id === req.params.sid && x.boardId === b.id && x.workspaceId === here(req)));
    if (guests().length === before) throw notFound("Student");
    await platform.commit(req.principal, "class.students.remove", { boardId: b.id, studentId: req.params.sid });
    if (classTeams(b).length) {
      saveTeams(b, placeStudent(classTeams(b), req.params.sid, null), teamRounds(b).map((r) => placeStudent(r, req.params.sid, null)), studentIds(req, b), teamPolicy(b));
      await store.commit(req.principal, "class.teams.seat", { boardId: b.id });
    }
    await seat(req, b);
    return reply.code(204).send();
  });
  // The class's teams: `count` makes that many (keeping the ones there are and seating every
  // student), `policy` sets the rotation (never, every day, every chapter), and `shuffle` (at
  // random), `spread` (evenly, in order), `move` (one student to a team, or to none) and `names`
  // change the seating of one `round` (default the first; names are shared by every round).
  app.put("/v1/boards/:id/teams", { schema: { params: z.object({ id: z.string().max(200) }), body: z.object({ count: z.number().int().min(0).max(MAX_TEAMS).optional(), policy: z.enum(["never", "day", "chapter"]).optional(), round: z.number().int().min(0).max(40).optional(), shuffle: z.boolean().optional(), spread: z.boolean().optional(), move: z.object({ studentId: z.string().max(80), teamId: z.string().max(40).nullable() }).optional(), names: z.record(z.string().max(40), z.string().trim().min(1).max(60)).optional() }) } }, async (req) => {
    const b = classBoard(req, req.params.id);
    const ids = studentIds(req, b);
    const policy = req.body.policy ?? teamPolicy(b);
    let rounds = teamRounds(b).map((r) => r);
    if (req.body.count !== undefined) rounds = [makeTeams(req.body.count, rounds[0] ?? [], ids)];
    const r = Math.min(req.body.round ?? 0, Math.max(0, rounds.length - 1));
    let cur = rounds[r] ?? rounds[0] ?? [];
    if (req.body.shuffle && cur.length) cur = makeTeams(cur.length, cur.map((t) => ({ ...t, members: [] })), [...ids].sort(() => Math.random() - 0.5));
    if (req.body.spread && cur.length) cur = makeTeams(cur.length, cur.map((t) => ({ ...t, members: [] })), [...cur.flatMap((t) => t.members), ...ids.filter((i) => !cur.some((t) => t.members.includes(i)))]);
    if (req.body.move) {
      if (!ids.includes(req.body.move.studentId)) throw notFound("Student");
      if (req.body.move.teamId && !cur.some((t) => t.id === req.body.move!.teamId)) throw notFound("Team");
      cur = placeStudent(cur, req.body.move.studentId, req.body.move.teamId);
    }
    rounds[r] = cur;
    if (req.body.names) rounds = rounds.map((rr) => rr.map((t) => ({ ...t, name: req.body.names![t.id] ?? t.name })));
    const all = saveTeams(b, rounds[0] ?? [], rounds, ids, policy);
    await store.commit(req.principal, "class.teams", { boardId: b.id, teams: (rounds[0] ?? []).length, policy });
    return { teams: classTeams(b), teamPolicy: policy, teamRounds: all };
  });
}

/** The routes a student's link may use: their class board and its cards and connectors. */
export function guestMayUse(method: string, url: string, boardId: string): boolean {
  const path = (url.split("?")[0] ?? url).replace(/\/$/, "");
  if (method === "GET" && path === "/v1/me") return true;
  // The class's own planning room (the PI Planning simulation exercises): students read and write it.
  if (["GET", "PUT"].includes(method) && (path === `/v1/docs/planning-room%3A${boardId}` || path === `/v1/docs/planning-room:${boardId}`)) return true;
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
    // The exercise boards' ✦ Suggest buttons.
    if (rest === "/suggest" && method === "POST") return true;
  }
  return false;
}
