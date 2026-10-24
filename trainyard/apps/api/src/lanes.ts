// Lane boards the workspace keeps per key: class breakouts and agenda, notes, timers and ink
// on any lane board. Lane rules are checked in the browser with the same functions (core
// lanes.ts); the server keeps what it is given, within size limits.

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import type { LaneBoardState } from "@trainyard/core";
import { require } from "./auth.js";
import { ApiError } from "./errors.js";
import type { Store } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

const RESERVED = new Set(["__proto__", "constructor", "prototype"]);
const Key = z.string().min(1).max(120).regex(/^[A-Za-z0-9._:-]+$/).refine((k) => !RESERVED.has(k), "Reserved name");
const Text = (n: number) => z.string().max(n);
const Card = z.object({ id: Key, lane: Key.nullable(), title: Text(200), sub: Text(200).optional(), tag: Text(40).optional(), chip: Text(40).optional(), tone: z.number().int().min(0).max(4).optional(), size: z.number().min(0).max(10_000).optional(), auth: Text(40).optional() });
const Note = z.object({ id: Key, kind: z.enum(["sticky", "timer"]), text: Text(600), x: z.number().min(-1000).max(20_000), y: z.number().min(-1000).max(20_000), tone: z.number().int().min(0).max(4), seconds: z.number().int().min(0).max(36_000).optional(), running: z.boolean().optional() });
const Body = z.object({ cards: z.array(Card).max(500), notes: z.array(Note).max(200), strokes: z.array(Text(4_000)).max(200) });

// Lane boards sit in the workspace state, which is saved whole on every change: a few dozen
// boards of a few hundred kilobytes each is plenty for classes and keeps every save quick.
const MAX_BOARDS = 60;
const MAX_BOARD_BYTES = 400_000;

export function registerLaneBoardRoutes(app: App, store: Store) {
  app.get("/v1/lane-boards/:key", { schema: { params: z.object({ key: Key }) } }, async (req) => ({ board: (store.state.laneBoards && Object.hasOwn(store.state.laneBoards, req.params.key) ? store.state.laneBoards[req.params.key] : null) ?? null }));
  app.put("/v1/lane-boards/:key", { schema: { params: z.object({ key: Key }), body: Body } }, async (req) => {
    require(req, "plan");
    if (JSON.stringify(req.body).length > MAX_BOARD_BYTES) throw new ApiError(413, "BOARD_TOO_LARGE", "This board is too large to save. Clear some ink or notes.");
    const all = (store.state.laneBoards ??= {});
    if (!Object.hasOwn(all, req.params.key) && Object.keys(all).length >= MAX_BOARDS) {
      const oldest = Object.entries(all).sort((a, b) => a[1].updatedAt.localeCompare(b[1].updatedAt))[0];
      if (oldest) delete all[oldest[0]];
    }
    const board = { ...req.body, updatedAt: store.now().toISOString() } as LaneBoardState;
    all[req.params.key] = board;
    await store.commit(req.principal, "lane-board.save", { key: req.params.key });
    return { board };
  });
}
