// Planning documents saved whole: the roadmap, the OKR board and the planning room (design
// handoff "Trainyard planning suite"). Each is one JSON document per workspace, read by anyone in
// the workspace and written by planners; the pages save the document as it stands after a change.

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { require } from "./auth.js";
import { ApiError } from "./errors.js";
import { stream } from "./events.js";
import type { Store } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

/** The documents a workspace keeps, by key. */
export const DOC_KEYS = ["roadmap", "okr-board", "planning-room"] as const;
/** A class board's own planning room is kept under `planning-room:<boardId>`. */
const Key = z.string().regex(/^(roadmap|okr-board|planning-room|planning-room:b-[a-z0-9]+)$/);
/** A class board keyed in a document key, or null for the workspace's own documents. */
const boardOf = (key: string) => (key.startsWith("planning-room:") ? key.slice("planning-room:".length) : null);
/** A document is at most this long as JSON. */
export const DOC_MAX_BYTES = 1_000_000;

/** A short fingerprint of a document, so a page asks for it again only when it changed. */
export function docRevision(doc: unknown): string {
  const v = JSON.stringify(doc ?? null);
  let h = 2166136261;
  for (let i = 0; i < v.length; i++) h = Math.imul(h ^ v.charCodeAt(i), 16777619);
  return `${(h >>> 0).toString(36)}${v.length.toString(36)}`;
}

/** The part of a planning room one team writes: its tickets (and the ART backlog, team 0), its capacity cells (`team:iter`), its capacity sheet, and the id counter. */
type Slice = { tickets?: unknown[]; caps?: Record<string, unknown>; teamCap?: unknown; kn?: number };
const TeamSlice = z.object({ tickets: z.array(z.record(z.string(), z.unknown())).max(2000).optional(), caps: z.record(z.string(), z.unknown()).optional(), teamCap: z.unknown().optional(), kn: z.number().int().min(0).optional() });

/**
 * Merges one team's slice into the room: only that team's tickets and capacity change, the rest of
 * the room (other teams, the scenario, the calendar, the backlog) stays as the server has it. So
 * four teams working at once never overwrite each other, and each browser sends a few kilobytes.
 */
export function mergeTeamSlice(room: Record<string, unknown> | null, team: number, slice: Slice): Record<string, unknown> {
  const base: Record<string, unknown> = room ? { ...room } : { teams: team, caps: {}, kn: 100, tickets: [] };
  // Team 0 is the ART backlog (features nobody has taken yet): every team's slice carries it too.
  const mine = (t: unknown) => typeof t === "object" && t !== null && ((t as { team?: unknown }).team === team || (t as { team?: unknown }).team === 0);
  // A ticket handed over from another team arrives in this team's slice: its old copy goes.
  const arriving = new Set((slice.tickets ?? []).filter(mine).map((t) => (t as { id?: unknown }).id));
  const others = (Array.isArray(base.tickets) ? (base.tickets as unknown[]) : []).filter((t) => !mine(t) && !arriving.has((t as { id?: unknown }).id));
  if (slice.tickets) base.tickets = [...others, ...slice.tickets.filter(mine)];
  if (slice.caps) {
    const caps = { ...((base.caps as Record<string, unknown> | undefined) ?? {}) };
    for (const k of Object.keys(caps)) if (k.startsWith(`${team}:`)) delete caps[k];
    for (const [k, v] of Object.entries(slice.caps)) if (k.startsWith(`${team}:`)) caps[k] = v;
    base.caps = caps;
  }
  if (slice.teamCap !== undefined) base.teamCap = { ...((base.teamCap as Record<string, unknown> | undefined) ?? {}), [String(team)]: slice.teamCap };
  if (typeof slice.kn === "number") base.kn = Math.max(Number(base.kn) || 0, slice.kn);
  return base;
}

export function registerDocRoutes(app: App, store: Store) {
  const docs = () => (store.state.workspace.docs ??= {});

  // With ?rev=<the revision a page holds>, an unchanged document comes back as `same: true` and
  // nothing else: a page polls this every few seconds at almost no cost and downloads the document
  // only when someone changed it.
  app.get("/v1/docs/:key", { schema: { params: z.object({ key: Key }), querystring: z.object({ rev: z.string().max(40).optional() }) } }, async (req) => {
    if (req.principal.guestBoardId && req.principal.guestBoardId !== boardOf(req.params.key)) throw new ApiError(403, "GUEST_SCOPE", "A class link opens its class board only.");
    const doc = docs()[req.params.key] ?? null;
    const rev = docRevision(doc);
    if (req.query.rev && req.query.rev === rev) return { key: req.params.key, rev, same: true };
    return { key: req.params.key, doc, rev };
  });

  // Live push: a change notice whenever the document is saved, by anyone.
  app.get("/v1/docs/:key/events", { schema: { params: z.object({ key: Key }) } }, async (req, reply) => {
    if (req.principal.guestBoardId && req.principal.guestBoardId !== boardOf(req.params.key)) throw new ApiError(403, "GUEST_SCOPE", "A class link opens its class board only.");
    stream(req, reply, `doc:${req.params.key}`, { rev: docRevision(docs()[req.params.key] ?? null) });
  });

  // A class takes over the workspace's planning room (what the trainer set up under Plan → Planning
  // room), so the simulation the trainer prepared is the one the students' links reach.
  app.post("/v1/boards/:id/planning-room/adopt", { schema: { params: z.object({ id: z.string().regex(/^b-[a-z0-9]+$/) }) } }, async (req) => {
    require(req, "plan");
    if (req.principal.guestBoardId) throw new ApiError(403, "FORBIDDEN", "Only the trainer sets the class's room up.");
    if (!(store.state.workspace.boards ?? []).some((b) => b.id === req.params.id && !b.isTemplate)) throw new ApiError(404, "NOT_FOUND", "No such class board.");
    const src = docs()["planning-room"] as { teams?: number; tickets?: unknown[] } | undefined;
    if (!src || !src.teams) throw new ApiError(409, "NO_ROOM", "There is no planning room set up under Plan → Planning room yet. Set this class's room up right here instead: choose the teams and the simulation, then Start planning.");
    docs()[`planning-room:${req.params.id}`] = structuredClone(src);
    await store.commit(req.principal, "docs.put", { key: `planning-room:${req.params.id}`, from: "planning-room" });
    return { teams: src.teams, tickets: Array.isArray(src.tickets) ? src.tickets.length : 0 };
  });

  // Saves a document: whole (`doc`), or one team's slice of a planning room (`team` + `slice`),
  // merged on the server. A student's link may only send a team slice, never the whole room.
  const Body = z.union([z.object({ doc: z.record(z.string(), z.unknown()).nullable() }), z.object({ team: z.number().int().min(0).max(40), slice: TeamSlice })]);
  app.put("/v1/docs/:key", { schema: { params: z.object({ key: Key }), body: Body } }, async (req) => {
    // A class's planning room is the class's work: its students (by link) write it like the trainer.
    const board = boardOf(req.params.key);
    if (req.principal.guestBoardId) { if (req.principal.guestBoardId !== board) throw new ApiError(403, "GUEST_SCOPE", "A class link opens its class board only."); }
    else if (board && !(store.state.workspace.boards ?? []).some((b) => b.id === board)) throw new ApiError(404, "NOT_FOUND", "No such class board.");
    require(req, "plan");
    let next: Record<string, unknown> | null;
    if ("team" in req.body) {
      if (!board) throw new ApiError(400, "VALIDATION", "Only a planning room is saved by team.");
      next = mergeTeamSlice((docs()[req.params.key] as Record<string, unknown> | undefined) ?? null, req.body.team, req.body.slice as Slice);
    } else {
      if (req.principal.guestBoardId) throw new ApiError(403, "GUEST_SCOPE", "A student saves their team's part of the room, not the whole room.");
      next = req.body.doc;
    }
    const text = JSON.stringify(next);
    if (text.length > DOC_MAX_BYTES) throw new ApiError(413, "DOC_TOO_LARGE", `The ${req.params.key} document is over ${Math.round(DOC_MAX_BYTES / 1000)} KB.`);
    if (next === null) delete docs()[req.params.key];
    else docs()[req.params.key] = next;
    await store.commit(req.principal, "docs.put", { key: req.params.key, bytes: text.length, ...("team" in req.body ? { team: req.body.team } : {}) });
    return { key: req.params.key, rev: docRevision(docs()[req.params.key] ?? null) };
  });
}
