// Rooms: the workspace's boards organised by purpose, with access per room (core rooms.ts).
// Creating a room counts against the plan (plans.ts: rooms, private rooms); everything inside
// a room is reached through it, so boards.ts asks roomViewer() before reading or editing.

import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { ROOM_KINDS, canEdit, canView, defaultPins, linkRooms, roomAccess, type Room, type RoomViewer } from "@trainyard/core";
import { require, type Principal } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Store } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

const Id = z.string().min(1).max(200);
const Pin = z.object({ href: z.string().max(200).regex(/^\/[A-Za-z0-9/_?=&#.-]*$/, "A path inside the app, starting with /"), label: z.string().min(1).max(80) });
const Member = z.object({ userId: Id, access: z.enum(["view", "edit", "manage"]) });
const Body = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(ROOM_KINDS),
  description: z.string().trim().max(500).optional(),
  visibility: z.enum(["open", "private"]).default("open"),
  defaultAccess: z.enum(["view", "edit"]).default("edit"),
  groupId: Id.optional(),
  pins: z.array(Pin).max(20).optional(),
});

/** Who is asking, in the terms room access is decided in. Open mode and support see everything. */
export function roomViewer(p: Principal): RoomViewer {
  return { userId: p.userId, role: p.role, ...(p.anonymous || p.support ? { unrestricted: true } : {}) };
}

export interface RoomRouteOptions {
  /** The workspace's people, for naming members and picking new ones. */
  members: (req: FastifyRequest) => { id: string; name: string; role: string; disabled?: boolean }[];
  /** The plan's room allowance; null on the platform workspace (no limits). */
  allowance: (req: FastifyRequest) => { rooms: number | null; privateRooms: boolean } | null;
}

export function registerRoomRoutes(app: App, store: Store, opts: RoomRouteOptions) {
  const members = opts.members;
  const s = () => store.state;
  const rooms = () => (s().rooms ??= []);
  const find = (req: FastifyRequest, id: string, need: "view" | "edit" | "manage") => {
    const room = rooms().find((r) => r.id === id);
    const access = room ? roomAccess(room, roomViewer(req.principal)) : "none";
    if (!room || !canView(access)) throw notFound("Room");
    if ((need === "edit" && !canEdit(access)) || (need === "manage" && access !== "manage")) throw new ApiError(403, "FORBIDDEN", need === "manage" ? "Only the room's managers and workspace admins can change this room." : "You can look in this room but not change it.");
    return { room, access };
  };
  const view = (room: Room, req: FastifyRequest) => {
    const boards = (s().workspace.boards ?? []).filter((b) => b.roomId === room.id);
    const people = members(req);
    return {
      ...room,
      access: roomAccess(room, roomViewer(req.principal)),
      boards: boards.map((b) => ({ id: b.id, name: b.name, system: b.origin.system, isTemplate: b.isTemplate, nodes: b.nodes.length, rows: b.rows.length })),
      members: room.members.map((m) => ({ ...m, name: people.find((u) => u.id === m.userId)?.name ?? "Former member" })),
      links: room.links.filter((id) => rooms().some((r) => r.id === id)).map((id) => {
        const other = rooms().find((r) => r.id === id)!;
        const seen = canView(roomAccess(other, roomViewer(req.principal)));
        return { id, name: seen ? other.name : "A private room", kind: other.kind, visible: seen };
      }),
    };
  };

  app.get("/v1/rooms", async (req) => ({
    rooms: rooms().filter((r) => canView(roomAccess(r, roomViewer(req.principal)))).map((r) => view(r, req)),
    allowance: { used: rooms().length, ...(opts.allowance(req) ?? { rooms: null, privateRooms: true }) },
    // Boards outside any room, open to the whole workspace.
    unassigned: (s().workspace.boards ?? []).filter((b) => !b.roomId && !b.isTemplate).map((b) => ({ id: b.id, name: b.name })),
  }));

  app.get("/v1/rooms/:id", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    const { room, access } = find(req, req.params.id, "view");
    return {
      room: view(room, req),
      // Managers pick members from the workspace's people.
      ...(access === "manage" ? { people: members(req).filter((u) => !u.disabled).map((u) => ({ id: u.id, name: u.name, role: u.role })) } : {}),
      // Rooms it could connect to, and boards it could take in.
      others: rooms().filter((r) => r.id !== room.id && canView(roomAccess(r, roomViewer(req.principal)))).map((r) => ({ id: r.id, name: r.name, kind: r.kind })),
      unassigned: (s().workspace.boards ?? []).filter((b) => !b.roomId && !b.isTemplate).map((b) => ({ id: b.id, name: b.name })),
    };
  });

  app.post("/v1/rooms", { schema: { body: Body } }, async (req, reply) => {
    require(req, "plan");
    const b = req.body;
    if (b.groupId && !s().workspace.groups.some((g) => g.id === b.groupId)) throw notFound("Train");
    if (rooms().length >= 200) throw new ApiError(413, "TOO_MANY_ROOMS", "A workspace holds up to 200 rooms.");
    const room: Room = {
      id: `room-${store.now().getTime().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: b.name,
      kind: b.kind,
      ...(b.description ? { description: b.description } : {}),
      visibility: b.visibility,
      defaultAccess: b.defaultAccess,
      // The creator runs the room; admins always can.
      members: req.principal.anonymous ? [] : [{ userId: req.principal.userId, access: "manage" }],
      links: [],
      pins: b.pins ?? defaultPins(b.kind),
      ...(b.groupId ? { groupId: b.groupId } : {}),
      createdAt: store.now().toISOString(),
      createdBy: req.principal.userId,
    };
    rooms().push(room);
    await store.commit(req.principal, "room.create", { id: room.id, kind: room.kind, visibility: room.visibility });
    return reply.code(201).send({ room: view(room, req) });
  });

  app.patch("/v1/rooms/:id", { schema: { params: z.object({ id: Id }), body: Body.partial() } }, async (req) => {
    const { room } = find(req, req.params.id, "manage");
    const b = req.body;
    if (b.groupId && !s().workspace.groups.some((g) => g.id === b.groupId)) throw notFound("Train");
    for (const k of ["name", "kind", "description", "visibility", "defaultAccess", "groupId", "pins"] as const) if (b[k] !== undefined) (room as unknown as Record<string, unknown>)[k] = b[k];
    await store.commit(req.principal, "room.update", { id: room.id });
    return { room: view(room, req) };
  });

  // Deleting a room keeps its boards: they go back to the whole workspace.
  app.delete("/v1/rooms/:id", { schema: { params: z.object({ id: Id }) } }, async (req, reply) => {
    const { room } = find(req, req.params.id, "manage");
    for (const b of s().workspace.boards ?? []) if (b.roomId === room.id) delete b.roomId;
    for (const r of rooms()) r.links = r.links.filter((id) => id !== room.id);
    s().rooms = rooms().filter((r) => r.id !== room.id);
    await store.commit(req.principal, "room.delete", { id: room.id });
    return reply.code(204).send();
  });

  app.put("/v1/rooms/:id/members", { schema: { params: z.object({ id: Id }), body: z.object({ members: z.array(Member).max(500) }) } }, async (req) => {
    const { room } = find(req, req.params.id, "manage");
    const people = members(req);
    for (const m of req.body.members) if (!people.some((u) => u.id === m.userId)) throw notFound("Member");
    const next = [...new Map(req.body.members.map((m) => [m.userId, m])).values()];
    // A private room keeps someone who can run it.
    if (room.visibility === "private" && !next.some((m) => m.access === "manage") && !req.principal.anonymous && req.principal.role !== "admin") throw new ApiError(409, "LAST_MANAGER", "Keep at least one manager in a private room.");
    room.members = next;
    await store.commit(req.principal, "room.members", { id: room.id, count: next.length });
    return { room: view(room, req) };
  });

  app.put("/v1/rooms/:id/links/:other", { schema: { params: z.object({ id: Id, other: Id }), body: z.object({ on: z.boolean() }) } }, async (req) => {
    const { room } = find(req, req.params.id, "manage");
    // Connecting needs a say in both rooms.
    find(req, req.params.other, "edit");
    linkRooms(rooms(), room.id, req.params.other, req.body.on);
    await store.commit(req.principal, "room.link", { id: room.id, other: req.params.other, on: req.body.on });
    return { room: view(room, req) };
  });

  // Moving a board in or out: edit rights where it comes from and where it goes.
  app.put("/v1/boards/:id/room", { schema: { params: z.object({ id: Id }), body: z.object({ roomId: Id.nullable() }) } }, async (req) => {
    require(req, "plan");
    const board = (s().workspace.boards ?? []).find((b) => b.id === req.params.id);
    if (!board) throw notFound("Board");
    if (board.roomId && rooms().some((r) => r.id === board.roomId)) find(req, board.roomId, "edit");
    if (req.body.roomId) {
      find(req, req.body.roomId, "edit");
      board.roomId = req.body.roomId;
    } else delete board.roomId;
    await store.commit(req.principal, "board.room", { id: board.id, roomId: req.body.roomId });
    return { board: { id: board.id, name: board.name, roomId: board.roomId ?? null } };
  });
}
