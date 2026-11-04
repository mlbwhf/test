// Keeping and letting go of class data. A class board can be exported (JSON and a readable
// report), archived (closed to students, kept for the trainer), and deleted. Before a class is
// deleted, by the trainer or by the retention sweep, its record is emailed to the trainer. The
// sweep runs on a timer: classes nobody touched for ARCHIVE_DAYS are archived, archived classes
// older than DELETE_DAYS are emailed out and removed, with their students' links and planning room.
// docs/RETENTION.md explains the policy; the periods come from the environment (main.ts).

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { classExport, classReportHtml, type Board, type ClassExport } from "@trainyard/core";
import { require, type Principal } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Mailer } from "./mailer.js";
import type { Store } from "./store.js";
import type { Tenants } from "./tenants.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

export interface RetentionOptions {
  mailer?: Mailer;
  webUrl?: string;
  /** Days without a change before a class is archived; 0 never archives by itself. */
  archiveDays: number;
  /** Days after archiving before a class is emailed out and deleted; 0 never deletes by itself. */
  deleteDays: number;
  /** How often the sweep runs; 0 turns the timer off (tests call it directly). */
  everyMs: number;
}

export const DEFAULT_RETENTION = { archiveDays: 180, deleteDays: 365, everyMs: 6 * 60 * 60 * 1000 };
const SWEEP_ACTOR: Principal = { userId: "system:retention", name: "Retention sweep", role: "admin", anonymous: false, workspaceId: "platform", platformAdmin: true };
const DAY = 24 * 60 * 60 * 1000;
const isClass = (b: Board) => !b.isTemplate && !!b.fields?.class;
const lastTouched = (b: Board) => (typeof b.fields?.touchedAt === "string" ? b.fields.touchedAt : b.origin.importedAt);

export function registerRetention(app: App, tenants: Tenants, store: Store, opts: RetentionOptions) {
  const platform = tenants.platform;
  const s = () => store.state;
  const boards = () => (s().workspace.boards ??= []);
  const guestsOf = (st: Store, b: Board) => (platform.state.classGuests ?? []).filter((g) => g.boardId === b.id && g.workspaceId === st.workspaceId);

  /** The class taken out whole, with its students and its planning room. */
  const exportOf = (st: Store, b: Board, reason?: string): ClassExport =>
    classExport(b, { now: st.now().toISOString(), students: guestsOf(st, b).map((g) => ({ id: g.id, name: g.name, email: g.email })), planningRoom: st.state.workspace.docs?.[`planning-room:${b.id}`], ...(reason ? { reason } : {}) });

  /** Who gets the class's record: its owner, else the workspace's owner. */
  const trainerOf = (st: Store, b: Board) => {
    const users = platform.state.users;
    const owner = typeof b.fields?.ownerId === "string" ? users.find((u) => u.id === b.fields!.ownerId && !u.disabled) : undefined;
    const ws = tenants.records().find((w) => w.id === st.workspaceId);
    return owner ?? (ws ? users.find((u) => u.id === ws.ownerUserId && !u.disabled) : undefined) ?? users.find((u) => u.role === "admin" && !u.disabled);
  };

  const fileName = (b: Board, ext: string) => `${b.name.replace(/[^\w.-]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "class"}-${b.id}.${ext}`;

  /** Emails the class's record to its trainer; false when mail is off or nobody is there to receive it. */
  const emailCopy = async (st: Store, b: Board, reason: string): Promise<boolean> => {
    const to = trainerOf(st, b);
    if (!opts.mailer?.live || !to?.email) {
      console.warn(`[retention] record of "${b.name}" (${b.id}) not emailed: ${opts.mailer?.live ? "no trainer address" : "mail is off"}`);
      return false;
    }
    const x = exportOf(st, b, reason);
    await opts.mailer.send({
      to: to.email,
      subject: `Your class record: ${b.name}`,
      text: `Hi ${to.name},

${reason}

Attached is the complete record of the class "${b.name}": a readable report (open the .html file in a browser, print it to PDF if you like) and the full record as JSON (${x.students.length} students, ${x.board.frames.filter((f) => f.activity).length} exercises${x.planningRoom ? ", the planning room" : ""}). The JSON can be kept as an archive or imported into Trainyard again.

Student names and email addresses are in both files: keep them as your own records policy requires.

Trainyard`,
      attachments: [
        { filename: fileName(b, "html"), content: classReportHtml(x), contentType: "text/html; charset=utf-8" },
        { filename: fileName(b, "json"), content: JSON.stringify(x), contentType: "application/json" },
      ],
    });
    return true;
  };

  /** Removes a class and what hangs off it: its planning room and its students' links. */
  const remove = async (st: Store, b: Board) => {
    st.state.workspace.boards = (st.state.workspace.boards ?? []).filter((x) => x.id !== b.id);
    if (st.state.workspace.docs) delete st.state.workspace.docs[`planning-room:${b.id}`];
    const before = (platform.state.classGuests ?? []).length;
    platform.state.classGuests = (platform.state.classGuests ?? []).filter((g) => !(g.boardId === b.id && g.workspaceId === st.workspaceId));
    return before !== (platform.state.classGuests ?? []).length;
  };

  // ---- routes --------------------------------------------------------------------------
  const classBoard = (req: FastifyRequest, id: string) => {
    require(req, "plan");
    if (req.principal.guestBoardId) throw new ApiError(403, "FORBIDDEN", "Students cannot export or archive the class.");
    const b = boards().find((x) => x.id === id && !x.isTemplate);
    if (!b) throw notFound("Board");
    return b;
  };

  // The class record: JSON to keep or import again, or the readable report.
  app.get("/v1/boards/:id/export", { schema: { params: z.object({ id: z.string().max(200) }), querystring: z.object({ format: z.enum(["json", "html"]).default("json") }) } }, async (req, reply) => {
    const b = classBoard(req, req.params.id);
    const x = exportOf(store, b);
    if (req.query.format === "html") return reply.header("content-type", "text/html; charset=utf-8").header("content-disposition", `attachment; filename="${fileName(b, "html")}"`).send(classReportHtml(x));
    return reply.header("content-type", "application/json; charset=utf-8").header("content-disposition", `attachment; filename="${fileName(b, "json")}"`).send(JSON.stringify(x));
  });

  // Archive: closed to students, kept for the trainer; reopen with archived: false.
  app.post("/v1/boards/:id/archive", { schema: { params: z.object({ id: z.string().max(200) }), body: z.object({ archived: z.boolean() }) } }, async (req) => {
    const b = classBoard(req, req.params.id);
    const fields = { ...(b.fields ?? {}) };
    if (req.body.archived) fields.archived = store.now().toISOString();
    else delete fields.archived;
    b.fields = fields;
    await store.commit(req.principal, req.body.archived ? "board.archive" : "board.unarchive", { id: b.id });
    return { id: b.id, archived: typeof b.fields.archived === "string" ? b.fields.archived : null };
  });

  // Mails the record before a trainer deletes a class (boards.ts calls it), and drops the students' links.
  const beforeDelete = async (req: FastifyRequest, b: Board) => {
    if (!isClass(b)) return;
    try {
      await emailCopy(store, b, "You deleted this class from Trainyard. Here is its record, in case you need it later.");
    } catch (e) {
      console.error(`[retention] record of "${b.name}" not emailed: ${(e as Error).message}`);
    }
    if (store.state.workspace.docs) delete store.state.workspace.docs[`planning-room:${b.id}`];
    const had = (platform.state.classGuests ?? []).length;
    platform.state.classGuests = (platform.state.classGuests ?? []).filter((g) => !(g.boardId === b.id && g.workspaceId === req.principal.workspaceId));
    if (had !== (platform.state.classGuests ?? []).length) await platform.commit(req.principal, "class.students.remove-all", { boardId: b.id });
  };

  // ---- the sweep -----------------------------------------------------------------------
  let sweeping = false;
  const sweep = async (now = store.now()): Promise<{ archived: string[]; deleted: string[]; emailed: string[] }> => {
    const out = { archived: [] as string[], deleted: [] as string[], emailed: [] as string[] };
    if (sweeping) return out;
    sweeping = true;
    try {
      const ids = [platform.workspaceId, ...tenants.records().map((w) => w.id).filter((id) => id !== platform.workspaceId)];
      for (const id of ids) {
        const st = await tenants.get(id).catch(() => null);
        if (!st) continue;
        const archived: string[] = [];
        const deleted: string[] = [];
        for (const b of [...(st.state.workspace.boards ?? [])]) {
          if (!isClass(b)) continue;
          const archivedAt = typeof b.fields?.archived === "string" ? Date.parse(b.fields.archived) : NaN;
          if (!Number.isNaN(archivedAt)) {
            if (opts.deleteDays > 0 && now.getTime() - archivedAt > opts.deleteDays * DAY) {
              let sent = false;
              try {
                sent = await emailCopy(st, b, `This class was archived on ${new Date(archivedAt).toISOString().slice(0, 10)} and, under the retention policy, is now deleted from Trainyard after ${opts.deleteDays} days. Here is its complete record.`);
              } catch (e) {
                console.error(`[retention] record of "${b.name}" not emailed, class kept: ${(e as Error).message}`);
                continue;
              }
              if (!sent && opts.mailer?.live) continue; // nobody to send it to: keep the class
              await remove(st, b);
              deleted.push(b.id);
              if (sent) out.emailed.push(b.id);
            }
          } else if (opts.archiveDays > 0 && now.getTime() - Date.parse(lastTouched(b)) > opts.archiveDays * DAY) {
            b.fields = { ...(b.fields ?? {}), archived: now.toISOString(), archivedBy: "retention" };
            archived.push(b.id);
          }
        }
        if (archived.length || deleted.length) {
          await st.commit(SWEEP_ACTOR, "retention.sweep", { boards: [...archived, ...deleted], archived, deleted });
          if (deleted.length) await platform.commit(SWEEP_ACTOR, "retention.guests", { boards: deleted });
          out.archived.push(...archived);
          out.deleted.push(...deleted);
        }
      }
    } finally {
      sweeping = false;
    }
    return out;
  };
  if (opts.everyMs > 0) {
    const timer = setInterval(() => void sweep().catch((e) => console.error(`[retention] sweep failed: ${(e as Error).message}`)), opts.everyMs);
    timer.unref();
    app.addHook("onClose", async () => clearInterval(timer));
  }

  // The policy, and a sweep on demand, for platform admins.
  app.get("/v1/admin/retention", async (req) => {
    if (!req.principal.platformAdmin) throw new ApiError(403, "FORBIDDEN", "Platform admins only.");
    return { archiveDays: opts.archiveDays, deleteDays: opts.deleteDays, everyMs: opts.everyMs, mail: !!opts.mailer?.live };
  });
  app.post("/v1/admin/retention/sweep", async (req) => {
    if (!req.principal.platformAdmin) throw new ApiError(403, "FORBIDDEN", "Platform admins only.");
    return sweep();
  });

  return { beforeDelete, sweep, exportOf, emailCopy };
}
