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
const Key = z.enum(DOC_KEYS);
/** A document is at most this long as JSON. */
export const DOC_MAX_BYTES = 1_000_000;

export function registerDocRoutes(app: App, store: Store) {
  const docs = () => (store.state.workspace.docs ??= {});

  app.get("/v1/docs/:key", { schema: { params: z.object({ key: Key }) } }, async (req) => {
    if (req.principal.guestBoardId) throw new ApiError(403, "GUEST_SCOPE", "A class link opens its class board only.");
    return { key: req.params.key, doc: docs()[req.params.key] ?? null };
  });

  app.put("/v1/docs/:key", { schema: { params: z.object({ key: Key }), body: z.object({ doc: z.record(z.string(), z.unknown()).nullable() }) } }, async (req) => {
    require(req, "plan");
    const text = JSON.stringify(req.body.doc);
    if (text.length > DOC_MAX_BYTES) throw new ApiError(413, "DOC_TOO_LARGE", `The ${req.params.key} document is over ${Math.round(DOC_MAX_BYTES / 1000)} KB.`);
    if (req.body.doc === null) delete docs()[req.params.key];
    else docs()[req.params.key] = req.body.doc;
    await store.commit(req.principal, "docs.put", { key: req.params.key, bytes: text.length });
    return { key: req.params.key, doc: docs()[req.params.key] ?? null };
  });
}
