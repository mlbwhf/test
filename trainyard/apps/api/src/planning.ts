// Backlogs for the planning room: the class handouts or a team's own spreadsheet (.xlsx, .csv),
// or the features and stories a connected tracker (Jira, Azure DevOps) holds. The API only reads
// and shapes them; the room keeps what it seeds in its own document.

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { backlogFromFile, backlogFromWorkItems, mergeBacklogs } from "@trainyard/importers";
import { require } from "./auth.js";
import { ApiError } from "./errors.js";
import type { Store } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

/** One upload is at most this long, base64 included. */
const MAX_FILE = 4_000_000;

export function registerPlanningRoutes(app: App, store: Store) {
  app.post("/v1/planning/backlog", { bodyLimit: 40 * 1024 * 1024, schema: { body: z.object({ files: z.array(z.object({ fileName: z.string().min(1).max(200), contentBase64: z.string().min(1).max(MAX_FILE) })).min(1).max(40) }) } }, async (req) => {
    require(req, "plan");
    const parts = req.body.files.map((f) => {
      try {
        return backlogFromFile(f.fileName, Buffer.from(f.contentBase64, "base64"));
      } catch {
        throw new ApiError(422, "BACKLOG_UNREADABLE", `${f.fileName} is not a spreadsheet or CSV Trainyard can read.`);
      }
    });
    const features = mergeBacklogs(parts);
    if (!features.some((f) => f.stories.length)) throw new ApiError(422, "BACKLOG_EMPTY", "No stories found. Use the handout layout (Item Name, Item Description, Item Type) or a sheet with Feature, Title, Description, Type and Points columns.");
    return { features, files: req.body.files.length };
  });

  app.get("/v1/planning/backlog/:system", { schema: { params: z.object({ system: z.enum(["jira", "ado"]) }) } }, async (req) => {
    require(req, "plan");
    const c = store.connectors.get(req.params.system);
    if (!c) throw new ApiError(409, "NOT_CONNECTED", `No ${req.params.system === "jira" ? "Jira" : "Azure DevOps"} connection is configured on this server.`);
    let items;
    try {
      items = await c.pull();
    } catch (e) {
      throw new ApiError(502, "TRACKER_FAILED", e instanceof Error ? e.message : "The tracker did not answer.");
    }
    const features = backlogFromWorkItems(items);
    if (!features.length) throw new ApiError(422, "BACKLOG_EMPTY", "The tracker returned no features or stories in scope.");
    return { features, items: items.length };
  });
}
