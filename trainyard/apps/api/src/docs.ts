// Planning documents saved whole: the roadmap, the OKR board and the planning room (design
// handoff "Trainyard planning suite"). Each is one JSON document per workspace, read by anyone in
// the workspace and written by planners; the pages save the document as it stands after a change.

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { require } from "./auth.js";
import { ApiError } from "./errors.js";
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

export function registerDocRoutes(app: App, store: Store) {
  const docs = () => (store.state.workspace.docs ??= {});

  app.get("/v1/docs/:key", { schema: { params: z.object({ key: Key }) } }, async (req) => {
    if (req.principal.guestBoardId && req.principal.guestBoardId !== boardOf(req.params.key)) throw new ApiError(403, "GUEST_SCOPE", "A class link opens its class board only.");
    return { key: req.params.key, doc: docs()[req.params.key] ?? null };
  });

  app.put("/v1/docs/:key", { schema: { params: z.object({ key: Key }), body: z.object({ doc: z.record(z.string(), z.unknown()).nullable() }) } }, async (req) => {
    // A class's planning room is the class's work: its students (by link) write it like the trainer.
    const board = boardOf(req.params.key);
    if (req.principal.guestBoardId) { if (req.principal.guestBoardId !== board) throw new ApiError(403, "GUEST_SCOPE", "A class link opens its class board only."); }
    else if (board && !(store.state.workspace.boards ?? []).some((b) => b.id === board)) throw new ApiError(404, "NOT_FOUND", "No such class board.");
    require(req, "plan");
    const text = JSON.stringify(req.body.doc);
    if (text.length > DOC_MAX_BYTES) throw new ApiError(413, "DOC_TOO_LARGE", `The ${req.params.key} document is over ${Math.round(DOC_MAX_BYTES / 1000)} KB.`);
    if (req.body.doc === null) delete docs()[req.params.key];
    else docs()[req.params.key] = req.body.doc;
    await store.commit(req.principal, "docs.put", { key: req.params.key, bytes: text.length });
    return { key: req.params.key, doc: docs()[req.params.key] ?? null };
  });
}
