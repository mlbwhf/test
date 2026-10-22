// Bring-your-own boards: connections to other tools, imports, templates and mapping.
// Boards live on workspace.boards and are stored exactly as imported; mapping writes
// planning objects only when the user applies it after a dry run.

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { TEMPLATE_CATALOG, boardShape, builtinTemplates, instantiate, mapBoard, templateFrom, type Board, type BoardMapping, type BoardNode } from "@trainyard/core";
import { CONNECTION_FIELDS, ImportError, boardFromCsv, boardFromIobeya, boardFromJson, createImporter, isIobeyaExport, type ConnectableSource, type FetchLike, type Importer, boardFromMiroCsv } from "@trainyard/importers";
import { decodeText, isZip, readZip } from "./zip.js";
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

  // iObeya "export board" files: the .zip as exported, or the .csv inside it, sent as base64.
  app.post(
    "/v1/imports/iobeya",
    { bodyLimit: 32 * 1024 * 1024, schema: { body: z.object({ fileName: z.string().min(1).max(300), contentBase64: z.string().min(8).max(32 * 1024 * 1024), includeLibrary: z.boolean().optional(), name: z.string().min(1).max(120).optional() }) } },
    async (req, reply) => {
      require(req, "plan");
      const bytes = Buffer.from(req.body.contentBase64, "base64");
      let text: string;
      let fileName = req.body.fileName;
      try {
        if (isZip(bytes)) {
          const entry = readZip(bytes).find((e) => /\.(csv|tsv|txt)$/i.test(e.name));
          if (!entry) throw new Error("the zip holds no .csv board export");
          fileName = entry.name.replace(/^.*\//, "") || fileName;
          text = decodeText(entry.read());
        } else text = decodeText(bytes);
      } catch (e) {
        throw new ApiError(422, "BAD_IOBEYA_FILE", `Could not read ${req.body.fileName}: ${(e as Error).message}.`);
      }
      if (!isIobeyaExport(text)) throw new ApiError(422, "NOT_IOBEYA", "This file is not an iObeya board export. In iObeya, open the board menu and choose Export, then upload the .zip.");
      let board: Board;
      try {
        board = boardFromIobeya(text, { fileName, now: store.now().toISOString(), ...(req.body.includeLibrary ? { includeLibrary: true } : {}) });
      } catch (e) {
        throw new ApiError(422, "BAD_IOBEYA_FILE", (e as Error).message);
      }
      if (req.body.name) board.name = req.body.name;
      board.origin.importedBy = req.principal.userId;
      s().workspace.boards = [...boards().filter((b) => b.id !== board.id), board];
      await store.commit(req.principal, "board.import", { id: board.id, system: "iobeya", nodes: board.nodes.length, edges: board.edges.length, type: board.fields?.iobeyaBoardType });
      return reply.code(201).send({ board: summary(board), libraryCards: board.fields?.libraryCards ?? 0 });
    },
  );

  // Miro "export as CSV": widget texts in reading order, no positions; rebuilt as frames of cards.
  app.post("/v1/imports/miro-csv", { bodyLimit: 8 * 1024 * 1024, schema: { body: z.object({ name: z.string().min(1).max(120), csv: z.string().min(1).max(6_000_000) }) } }, async (req, reply) => {
    require(req, "plan");
    if (req.principal.anonymous) throw new ApiError(403, "SIGNUP_REQUIRED", "Importing Miro boards needs a Trainer account. Sign up on the website and sign in with the key you receive.");
    const board = boardFromMiroCsv(req.body.csv, { name: req.body.name, now: store.now().toISOString() });
    if (board.nodes.length === 0) throw new ApiError(422, "EMPTY_EXPORT", "No widgets found in this export.");
    board.origin.importedBy = req.principal.userId;
    s().workspace.boards = [...boards().filter((b) => b.id !== board.id), board];
    await store.commit(req.principal, "board.import", { id: board.id, system: "miro", nodes: board.nodes.length, frames: board.frames.length });
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

  // ---- built-in templates and editing -------------------------------------------------
  /** Built-in templates are generated for this workspace's teams and iterations, never stored. */
  const builtins = () => {
    const ws = s().workspace;
    const inc = ws.increments[ws.increments.length - 1];
    return builtinTemplates(ws.teams.map((t) => t.name), inc ? inc.iterations.filter((i) => !i.isIP).map((i) => i.name) : undefined);
  };
  const findTemplate = (id: string): Board => builtins().find((b) => b.id === id) ?? boards().find((b) => b.id === id && b.isTemplate) ?? (() => { throw notFound("Template"); })();

  app.get("/v1/templates/boards", async () => ({
    builtin: builtins().map((b) => ({ ...summary(b), info: b.info })),
    saved: boards().filter((b) => b.isTemplate).map(summary),
    catalog: TEMPLATE_CATALOG,
  }));
  app.get("/v1/templates/boards/:id", { schema: { params: z.object({ id: Id }) } }, async (req) => ({ board: findTemplate(req.params.id) }));
  // Class boards and Miro imports are for signed-up trainers: the open demo cannot run them.
  const requireSignup = (req: { principal: { anonymous: boolean } }, what: string) => {
    if (req.principal.anonymous) throw new ApiError(403, "SIGNUP_REQUIRED", `${what} needs a Trainer account. Sign up on the website and sign in with the key you receive.`);
  };

  app.post("/v1/templates/boards/:id/create", { schema: { params: z.object({ id: Id }), body: z.object({ name: z.string().min(1).max(120) }) } }, async (req, reply) => {
    require(req, "plan");
    const t = findTemplate(req.params.id);
    if (t.fields?.class) requireSignup(req, "Running a class board");
    const b = instantiate(t, `b-${Date.now().toString(36)}`, req.body.name, store.now().toISOString());
    boards().push(b);
    await store.commit(req.principal, "board.instantiate", { id: b.id, template: t.id });
    return reply.code(201).send({ board: summary(b) });
  });

  const editable = (id: string) => {
    const b = findBoard(id);
    if (b.isTemplate) throw new ApiError(422, "TEMPLATE_READ_ONLY", "Templates are not edited in place. Create a board from it first.");
    return b;
  };
  const NodeBody = z.object({
    text: z.string().max(4000).optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().min(10).max(5000).optional(),
    height: z.number().min(10).max(5000).optional(),
    color: z.string().max(40).nullable().optional(),
    frameId: z.string().nullable().optional(),
    kind: z.enum(["sticky", "card", "text", "shape", "image", "other"]).optional(),
    tags: z.array(z.string().max(60)).max(20).optional(),
  });
  const frameFor = (b: Board, n: { x: number; y: number }) =>
    b.frames.find((f) => n.x >= f.x && n.x <= f.x + f.width && n.y >= f.y && n.y <= f.y + f.height)?.id;

  app.post("/v1/boards/:id/nodes", { schema: { params: z.object({ id: Id }), body: NodeBody.extend({ x: z.number(), y: z.number() }) } }, async (req, reply) => {
    require(req, "plan");
    const b = editable(req.params.id);
    const { frameId, color, ...rest } = req.body;
    const frame = frameId === null ? undefined : (frameId ?? frameFor(b, req.body));
    if (frame && !b.frames.some((f) => f.id === frame)) throw notFound("Frame");
    const node: BoardNode = {
      id: `n-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`,
      kind: rest.kind ?? "sticky",
      text: rest.text ?? "",
      x: rest.x,
      y: rest.y,
      width: rest.width ?? 180,
      height: rest.height ?? 120,
      ...(color ? { color } : { color: "#fff6c2" }),
      ...(frame ? { frameId: frame } : {}),
      tags: rest.tags ?? [],
      fields: { createdBy: req.principal.userId },
    };
    b.nodes.push(node);
    await store.commit(req.principal, "board.node.create", { board: b.id, node: node.id });
    return reply.code(201).send({ node });
  });

  app.patch("/v1/boards/:id/nodes/:nodeId", { schema: { params: z.object({ id: Id, nodeId: Id }), body: NodeBody } }, async (req) => {
    require(req, "plan");
    const b = editable(req.params.id);
    const n = b.nodes.find((x) => x.id === req.params.nodeId);
    if (!n) throw notFound("Card");
    const { frameId, color, ...rest } = req.body;
    Object.assign(n, defined(rest));
    if (color === null) delete n.color;
    else if (color) n.color = color;
    if (frameId === null) delete n.frameId;
    else if (frameId) {
      if (!b.frames.some((f) => f.id === frameId)) throw notFound("Frame");
      n.frameId = frameId;
    } else if (rest.x !== undefined || rest.y !== undefined) {
      // Moved: the frame follows the new position.
      const f = frameFor(b, n);
      if (f) n.frameId = f;
      else delete n.frameId;
    }
    if (n.fields.placeholder && n.text.trim()) delete n.fields.placeholder;
    await store.commit(req.principal, "board.node.update", { board: b.id, node: n.id, ...defined(req.body) });
    return { node: n };
  });

  app.delete("/v1/boards/:id/nodes/:nodeId", { schema: { params: z.object({ id: Id, nodeId: Id }) } }, async (req, reply) => {
    require(req, "plan");
    const b = editable(req.params.id);
    const before = b.nodes.length;
    b.nodes = b.nodes.filter((x) => x.id !== req.params.nodeId);
    if (b.nodes.length === before) throw notFound("Card");
    b.edges = b.edges.filter((e) => e.fromId !== req.params.nodeId && e.toId !== req.params.nodeId);
    await store.commit(req.principal, "board.node.delete", { board: b.id, node: req.params.nodeId });
    return reply.code(204).send();
  });

  app.post("/v1/boards/:id/edges", { schema: { params: z.object({ id: Id }), body: z.object({ fromId: Id, toId: Id, label: z.string().max(200).optional() }) } }, async (req, reply) => {
    require(req, "plan");
    const b = editable(req.params.id);
    const ids = new Set([...b.nodes.map((n) => n.id), ...b.frames.map((f) => f.id)]);
    if (!ids.has(req.body.fromId) || !ids.has(req.body.toId)) throw notFound("Card");
    if (req.body.fromId === req.body.toId) throw new ApiError(422, "SELF_EDGE", "A connector needs two different cards.");
    const edge = { id: `e-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`, fromId: req.body.fromId, toId: req.body.toId, ...(req.body.label ? { label: req.body.label } : {}) };
    b.edges.push(edge);
    await store.commit(req.principal, "board.edge.create", { board: b.id, edge: edge.id });
    return reply.code(201).send({ edge });
  });

  app.delete("/v1/boards/:id/edges/:edgeId", { schema: { params: z.object({ id: Id, edgeId: Id }) } }, async (req, reply) => {
    require(req, "plan");
    const b = editable(req.params.id);
    const before = b.edges.length;
    b.edges = b.edges.filter((e) => e.id !== req.params.edgeId);
    if (b.edges.length === before) throw notFound("Connector");
    await store.commit(req.principal, "board.edge.delete", { board: b.id, edge: req.params.edgeId });
    return reply.code(204).send();
  });

  app.patch("/v1/boards/:id/frames/:frameId", { schema: { params: z.object({ id: Id, frameId: Id }), body: z.object({ title: z.string().min(1).max(200).optional(), x: z.number().optional(), y: z.number().optional(), width: z.number().min(40).optional(), height: z.number().min(40).optional() }) } }, async (req) => {
    require(req, "plan");
    const b = editable(req.params.id);
    const f = b.frames.find((x) => x.id === req.params.frameId);
    if (!f) throw notFound("Frame");
    const dx = (req.body.x ?? f.x) - f.x;
    const dy = (req.body.y ?? f.y) - f.y;
    Object.assign(f, defined(req.body));
    // Cards travel with their frame.
    if (dx || dy) for (const n of b.nodes) if (n.frameId === f.id) (n.x += dx), (n.y += dy);
    await store.commit(req.principal, "board.frame.update", { board: b.id, frame: f.id, ...defined(req.body) });
    return { frame: f };
  });

  app.post("/v1/boards/:id/frames", { schema: { params: z.object({ id: Id }), body: z.object({ title: z.string().min(1).max(200), x: z.number(), y: z.number(), width: z.number().min(40), height: z.number().min(40) }) } }, async (req, reply) => {
    require(req, "plan");
    const b = editable(req.params.id);
    const frame = { id: `f-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`, ...req.body };
    b.frames.push(frame);
    await store.commit(req.principal, "board.frame.create", { board: b.id, frame: frame.id });
    return reply.code(201).send({ frame });
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
