// Bring-your-own boards: connections to other tools, imports, templates and mapping.
// Boards live on workspace.boards and are stored exactly as imported; mapping writes
// planning objects only when the user applies it after a dry run.

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { boardShape, instantiate, mapBoard, templateFrom, type Board, type BoardMapping } from "@trainyard/core";
import { CONNECTION_FIELDS, ImportError, boardFromCsv, boardFromJson, createImporter, type ConnectableSource, type FetchLike, type Importer } from "@trainyard/importers";
import { require } from "./auth.js";
import { ApiError, defined, notFound } from "./errors.js";
import type { SecretBox } from "./secrets.js";
import type { Store } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

export interface Connection {
  id: string;
  system: ConnectableSource;
  label: string;
  /** Sealed credentials JSON: { token, apiKey? }. */
  sealed: string;
  account?: string;
  createdBy: string;
  createdAt: string;
  lastUsedAt?: string;
}

const Id = z.string().min(1).max(200);
const Source = z.enum(["miro", "mural", "monday", "trello"]);
const MappingBody = z.object({
  from: z.enum(["nodes", "rows"]),
  level: z.string().min(1),
  titleColumn: z.string().optional(),
  team: z.union([z.object({ by: z.enum(["frame", "group"]) }), z.object({ by: z.literal("column"), column: z.string() })]).optional(),
  iteration: z.union([z.object({ by: z.enum(["frame", "group"]) }), z.object({ by: z.literal("column"), column: z.string() })]).optional(),
  estimateColumn: z.string().optional(),
  businessValueColumn: z.string().optional(),
  statusColumn: z.string().optional(),
  statusDone: z.array(z.string()).optional(),
  statusInProgress: z.array(z.string()).optional(),
  colorRules: z.array(z.object({ color: z.string().min(1), as: z.enum(["risk", "feature", "enabler", "defect", "debt"]) })).optional(),
  edgesAsDependencies: z.boolean().optional(),
  createMissingTeams: z.boolean().optional(),
});

export function registerBoardRoutes(app: App, store: Store, secrets: SecretBox, fetchFn?: FetchLike) {
  const s = () => store.state;
  const boards = () => (s().workspace.boards ??= []);
  const findBoard = (id: string) => boards().find((b) => b.id === id) ?? (() => { throw notFound("Board"); })();
  const publicConnection = ({ sealed: _s, ...c }: Connection) => c;
  const importerFor = (c: Connection): Importer => createImporter(c.system, JSON.parse(secrets.open(c.sealed)) as { token: string; apiKey?: string }, fetchFn);
  const translate = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof ImportError) throw new ApiError(e.code === "AUTH" ? 401 : e.code === "NOT_FOUND" ? 404 : e.code === "RATE_LIMIT" ? 429 : 502, `IMPORT_${e.code}`, e.message);
      if (e instanceof Error && !(e instanceof ApiError)) throw new ApiError(502, "IMPORT_UPSTREAM", e.message);
      throw e;
    }
  };
  const summary = (b: Board) => ({ id: b.id, name: b.name, origin: b.origin, isTemplate: b.isTemplate, templateId: b.templateId, shape: boardShape(b), counts: { frames: b.frames.length, nodes: b.nodes.length, edges: b.edges.length, columns: b.columns.length, rows: b.rows.length } });

  // ---- connections -------------------------------------------------------------------
  app.get("/v1/connections", async () => ({ connections: s().connections.map(publicConnection), sources: CONNECTION_FIELDS, persistent: secrets.persistent }));

  app.post("/v1/connections", { schema: { body: z.object({ system: Source, label: z.string().min(1).max(80).optional(), token: z.string().min(1).max(4000), apiKey: z.string().max(4000).optional() }) } }, async (req, reply) => {
    require(req, "plan");
    if (req.body.system === "trello" && !req.body.apiKey) throw new ApiError(422, "API_KEY_REQUIRED", "Trello needs an API key as well as a token.");
    const creds = { token: req.body.token, ...(req.body.apiKey ? { apiKey: req.body.apiKey } : {}) };
    const who = await translate(() => createImporter(req.body.system, creds, fetchFn).whoami());
    const connection: Connection = {
      id: `conn-${Date.now().toString(36)}`,
      system: req.body.system,
      label: req.body.label ?? `${CONNECTION_FIELDS[req.body.system].label} (${who.name})`,
      sealed: secrets.seal(JSON.stringify(creds)),
      account: who.detail ? `${who.name} · ${who.detail}` : who.name,
      createdBy: req.principal.userId,
      createdAt: store.now().toISOString(),
    };
    s().connections.push(connection);
    await store.commit(req.principal, "connection.create", { id: connection.id, system: connection.system });
    return reply.code(201).send({ connection: publicConnection(connection) });
  });

  app.delete("/v1/connections/:id", { schema: { params: z.object({ id: Id }) } }, async (req, reply) => {
    require(req, "plan");
    const before = s().connections.length;
    s().connections = s().connections.filter((c) => c.id !== req.params.id);
    if (s().connections.length === before) throw notFound("Connection");
    await store.commit(req.principal, "connection.delete", { id: req.params.id });
    return reply.code(204).send();
  });

  app.get("/v1/connections/:id/boards", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    const c = s().connections.find((x) => x.id === req.params.id);
    if (!c) throw notFound("Connection");
    const remote = await translate(() => importerFor(c).listBoards());
    const imported = new Set(boards().filter((b) => b.origin.system === c.system).map((b) => b.origin.externalId));
    return { boards: remote.map((r) => ({ ...r, imported: imported.has(r.id) })) };
  });

  // ---- imports -----------------------------------------------------------------------
  app.post("/v1/imports", { schema: { body: z.object({ connectionId: Id, boardId: z.string().min(1), name: z.string().min(1).max(120).optional() }) } }, async (req, reply) => {
    require(req, "plan");
    const c = s().connections.find((x) => x.id === req.body.connectionId);
    if (!c) throw notFound("Connection");
    const board = await translate(() => importerFor(c).fetchBoard(req.body.boardId));
    board.origin.importedAt = store.now().toISOString();
    board.origin.importedBy = req.principal.userId;
    if (req.body.name) board.name = req.body.name;
    // Re-importing the same board replaces the earlier copy; templates made from it stay.
    s().workspace.boards = [...boards().filter((b) => b.id !== board.id), board];
    c.lastUsedAt = board.origin.importedAt;
    await store.commit(req.principal, "board.import", { id: board.id, system: board.origin.system, nodes: board.nodes.length, rows: board.rows.length });
    return reply.code(201).send({ board: summary(board) });
  });

  app.post("/v1/imports/csv", { schema: { body: z.object({ name: z.string().min(1).max(120), csv: z.string().min(1).max(5_000_000), groupBy: z.string().optional(), delimiter: z.string().length(1).optional() }) } }, async (req, reply) => {
    require(req, "plan");
    const board = boardFromCsv(req.body.csv, { name: req.body.name, now: store.now().toISOString(), ...(req.body.groupBy ? { groupBy: req.body.groupBy } : {}), ...(req.body.delimiter ? { delimiter: req.body.delimiter } : {}) });
    if (board.columns.length === 0) throw new ApiError(422, "EMPTY_CSV", "The CSV has no header row.");
    board.origin.importedBy = req.principal.userId;
    s().workspace.boards = [...boards().filter((b) => b.id !== board.id), board];
    await store.commit(req.principal, "board.import", { id: board.id, system: "csv", rows: board.rows.length });
    return reply.code(201).send({ board: summary(board) });
  });

  app.post("/v1/imports/json", { schema: { body: z.object({ board: z.unknown() }) } }, async (req, reply) => {
    require(req, "plan");
    let board: Board;
    try {
      board = boardFromJson(req.body.board, store.now().toISOString());
    } catch (e) {
      throw new ApiError(422, "BAD_BOARD_JSON", (e as Error).message);
    }
    board.origin.importedBy = req.principal.userId;
    s().workspace.boards = [...boards().filter((b) => b.id !== board.id), board];
    await store.commit(req.principal, "board.import", { id: board.id, system: "json", nodes: board.nodes.length, rows: board.rows.length });
    return reply.code(201).send({ board: summary(board) });
  });

  // ---- boards and templates ----------------------------------------------------------
  app.get("/v1/boards", async () => ({ boards: boards().map(summary) }));
  app.get("/v1/boards/:id", { schema: { params: z.object({ id: Id }) } }, async (req) => ({ board: findBoard(req.params.id), shape: boardShape(findBoard(req.params.id)) }));
  app.delete("/v1/boards/:id", { schema: { params: z.object({ id: Id }) } }, async (req, reply) => {
    require(req, "plan");
    findBoard(req.params.id);
    s().workspace.boards = boards().filter((b) => b.id !== req.params.id);
    await store.commit(req.principal, "board.delete", { id: req.params.id });
    return reply.code(204).send();
  });
  app.patch("/v1/boards/:id", { schema: { params: z.object({ id: Id }), body: z.object({ name: z.string().min(1).max(120) }) } }, async (req) => {
    require(req, "plan");
    const b = findBoard(req.params.id);
    b.name = req.body.name;
    await store.commit(req.principal, "board.rename", { id: b.id });
    return { board: summary(b) };
  });

  app.post("/v1/boards/:id/template", { schema: { params: z.object({ id: Id }), body: z.object({ name: z.string().min(1).max(120).optional() }) } }, async (req, reply) => {
    require(req, "plan");
    const b = findBoard(req.params.id);
    const t = templateFrom(b, `tpl-${Date.now().toString(36)}`, req.body.name ?? `${b.name} template`, store.now().toISOString());
    boards().push(t);
    await store.commit(req.principal, "board.template", { id: t.id, from: b.id });
    return reply.code(201).send({ board: summary(t) });
  });

  app.post("/v1/boards/:id/instantiate", { schema: { params: z.object({ id: Id }), body: z.object({ name: z.string().min(1).max(120) }) } }, async (req, reply) => {
    require(req, "plan");
    const t = findBoard(req.params.id);
    if (!t.isTemplate) throw new ApiError(422, "NOT_A_TEMPLATE", "Only templates can be instantiated. Save this board as a template first.");
    const b = instantiate(t, `b-${Date.now().toString(36)}`, req.body.name, store.now().toISOString());
    boards().push(b);
    await store.commit(req.principal, "board.instantiate", { id: b.id, template: t.id });
    return reply.code(201).send({ board: summary(b) });
  });

  // ---- mapping -----------------------------------------------------------------------
  app.post("/v1/boards/:id/map", { schema: { params: z.object({ id: Id }), querystring: z.object({ dry_run: z.stringbool().default(true) }), body: MappingBody } }, async (req) => {
    require(req, "plan");
    const b = findBoard(req.params.id);
    const ws = s().workspace;
    if (!s().model.workLevels.some((w) => w.key === req.body.level)) throw new ApiError(422, "UNKNOWN_LEVEL", `"${req.body.level}" is not a work level in this operating model.`);
    const mapping = defined(req.body) as BoardMapping;
    const group = ws.groups.find((g) => g.level === "team") ?? ws.groups[ws.groups.length - 1];
    const result = mapBoard(b, mapping, { teams: ws.teams, iterations: ws.increments.flatMap((i) => i.iterations), groupId: group?.id ?? "imported", now: store.now().toISOString() });
    const existing = new Set(ws.items.map((i) => i.id));
    const replaced = result.items.filter((i) => existing.has(i.id)).length;
    if (!req.query.dry_run) {
      ws.teams = [...ws.teams, ...result.newTeams];
      const ids = new Set(result.items.map((i) => i.id));
      ws.items = [...ws.items.filter((i) => !ids.has(i.id)), ...result.items];
      const riskIds = new Set(result.risks.map((r) => r.id));
      ws.risks = [...ws.risks.filter((r) => !riskIds.has(r.id)), ...result.risks];
      const depIds = new Set(result.dependencies.map((d) => d.id));
      ws.dependencies = [...ws.dependencies.filter((d) => !depIds.has(d.id)), ...result.dependencies];
      await store.commit(req.principal, "board.map", { id: b.id, items: result.items.length, risks: result.risks.length, dependencies: result.dependencies.length, teams: result.newTeams.length });
    }
    return { dryRun: req.query.dry_run, replaced, ...result };
  });
}
