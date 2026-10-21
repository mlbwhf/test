import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { hasZodFastifySchemaValidationErrors, jsonSchemaTransform, serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  AI_METRICS,
  AUTONOMY_LABELS,
  EVIDENCE_KINDS,
  EVIDENCE_LABELS,
  GateBlockedError,
  STAGES,
  STAGE_LABELS,
  advance,
  checkAgent,
  evaluateGate,
  spendSummary,
  valueRealised,
  type Agent,
  type Initiative,
} from "@trainyard/ai-portfolio";
import { planSync, type PushField } from "@trainyard/connectors";
import {
  MetricRegistry,
  TEMPLATES,
  checkDependencies,
  forkModel,
  getTemplate,
  planningReadiness,
  teamLoad,
  validateModel,
  type OperatingModel,
  type WorkItem,
} from "@trainyard/core";
import { Store } from "./store.js";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

const notFound = (what: string) => new ApiError(404, "NOT_FOUND", `${what} not found`);

export interface AppOptions {
  store?: Store;
  /** When set, every /v1 request needs `Authorization: Bearer <key>`. */
  apiKey?: string;
  corsOrigin?: string | boolean;
  logger?: boolean;
}

// Loose schemas: the domain functions do the real validation and return readable issues.
const Id = z.string().min(1).max(200);
const ModelBody = z.object({
  id: Id,
  name: z.string().min(1),
  framework: z.string(),
  description: z.string(),
  basedOn: z.string().optional(),
  groupLevels: z.array(z.object({ key: z.string(), label: z.string(), parent: z.string().optional() })),
  workLevels: z.array(z.object({ key: z.string(), label: z.string(), parent: z.string().optional(), planned: z.boolean().optional() })),
  cadence: z.object({
    mode: z.enum(["iterations", "flow"]),
    iterationLabel: z.string(),
    iterationWeeks: z.number(),
    incrementLabel: z.string(),
    iterationsPerIncrement: z.number(),
    ipIteration: z.boolean(),
  }),
  roles: z.array(z.object({ key: z.string(), label: z.string(), scope: z.enum(["team", "group", "portfolio"]) })),
  events: z.array(z.object({ key: z.string(), label: z.string(), scope: z.enum(["team", "group", "portfolio"]), when: z.enum(["iteration", "increment", "continuous"]) })),
  metrics: z.array(z.string()),
  aiNative: z.object({
    enabled: z.boolean(),
    requireAccountableHuman: z.boolean(),
    agentsAsTeamMembers: z.boolean(),
    maxAgentAutonomy: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    valueArchitectSignOff: z.boolean(),
  }),
});
const Filters = z
  .object({
    teamIds: z.array(z.string()).optional(),
    groupId: z.string().optional(),
    incrementId: z.string().optional(),
    flowTypes: z.array(z.enum(["feature", "enabler", "defect", "risk", "debt"])).optional(),
    level: z.string().optional(),
  })
  .optional();
const WidgetBody = z.object({
  id: Id,
  title: z.string().min(1).max(120),
  metric: z.string(),
  viz: z.enum(["kpi", "bar", "line", "donut", "table"]),
  groupBy: z.enum(["none", "team", "flowType", "iteration"]).optional(),
  filters: Filters,
});
const StageEnum = z.enum(STAGES);
const Autonomy = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

/** Drop keys whose value is undefined so objects satisfy exactOptionalPropertyTypes. */
function defined<T extends object>(o: T): { [K in keyof T]: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as { [K in keyof T]: Exclude<T[K], undefined> };
}

export async function buildApp(opts: AppOptions = {}): Promise<FastifyInstance> {
  const store = opts.store ?? new Store();
  const metrics = new MetricRegistry();
  for (const m of AI_METRICS) metrics.register(m);

  const app = Fastify({ logger: opts.logger ?? false }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  await app.register(cors, { origin: opts.corsOrigin ?? true, methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"] });
  await app.register(swagger, { openapi: { info: { title: "Trainyard API", version: "0.1.0" } }, transform: jsonSchemaTransform });
  await app.register(swaggerUi, { routePrefix: "/docs" });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ApiError) return reply.code(err.status).send({ error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } });
    if (err instanceof GateBlockedError) return reply.code(409).send({ error: { code: "GATE_BLOCKED", message: "This stage gate has open blockers.", details: err.gate } });
    if (hasZodFastifySchemaValidationErrors(err)) {
      return reply.code(400).send({ error: { code: "VALIDATION", message: err.validation.map((v) => `${v.instancePath || "body"} ${v.message}`).join("; ") } });
    }
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    if (status >= 500) req.log.error(err);
    return reply.code(status).send({ error: { code: status >= 500 ? "INTERNAL" : "REQUEST", message: status >= 500 ? "internal error" : (err as Error).message } });
  });

  if (opts.apiKey) {
    const expected = `Bearer ${opts.apiKey}`;
    app.addHook("onRequest", async (req) => {
      if (req.url.startsWith("/v1/") && req.headers.authorization !== expected) throw new ApiError(401, "UNAUTHORIZED", "Send Authorization: Bearer <api key>.");
    });
  }

  const s = () => store.state;
  const findItem = (id: string) => s().workspace.items.find((i) => i.id === id) ?? (() => { throw notFound("Item"); })();
  const findInitiative = (id: string) => s().initiatives.find((i) => i.id === id) ?? (() => { throw notFound("AI initiative"); })();
  const replaceInitiative = (next: Initiative) => {
    s().initiatives = s().initiatives.map((i) => (i.id === next.id ? next : i));
    return next;
  };
  const gateCtx = () => ({ model: s().model, agents: s().agents });
  const initiativeView = (i: Initiative) => {
    const next = i.stage === "retired" || i.stage === "monitor" ? undefined : STAGES[STAGES.indexOf(i.stage) + 1];
    return {
      ...i,
      stageLabel: STAGE_LABELS[i.stage],
      spend: spendSummary(i, store.now()),
      valueRealised: valueRealised(i),
      nextGate: next ? evaluateGate(i, next, gateCtx()) : null,
    };
  };
  const agentView = (a: Agent) => ({
    ...a,
    autonomyLabel: AUTONOMY_LABELS[a.autonomy],
    issues: checkAgent(a, s().model, a.initiativeId ? s().initiatives.find((i) => i.id === a.initiativeId) : undefined),
  });

  app.get("/health", async () => ({ ok: true }));

  // ---- operating model ---------------------------------------------------------------
  app.get("/v1/templates", async () => ({ templates: TEMPLATES }));
  app.get("/v1/model", async () => ({ model: s().model, issues: validateModel(s().model, metrics.keys()) }));
  app.put("/v1/model", { schema: { body: ModelBody } }, async (req) => {
    const model = defined(req.body) as OperatingModel;
    const issues = validateModel(model, metrics.keys());
    if (issues.length) throw new ApiError(422, "INVALID_MODEL", "The operating model has problems.", issues);
    s().model = model;
    return { model };
  });
  app.post("/v1/model/fork", { schema: { body: z.object({ templateId: z.string(), name: z.string().min(1).max(80) }) } }, async (req) => {
    let template: OperatingModel;
    try {
      template = getTemplate(req.body.templateId);
    } catch {
      throw notFound("Template");
    }
    const model = forkModel(template, `${template.id}-${Date.now().toString(36)}`, { name: req.body.name });
    s().model = model;
    return { model };
  });

  // ---- workspace and board -------------------------------------------------------------
  app.get("/v1/workspace", async () => ({ workspace: s().workspace, model: s().model, connectors: [...store.connectors.keys()], pending: s().pending.length }));

  app.get("/v1/board", { schema: { querystring: z.object({ incrementId: z.string().optional() }) } }, async (req) => {
    const ws = s().workspace;
    const increment = req.query.incrementId ? ws.increments.find((i) => i.id === req.query.incrementId) : ws.increments[ws.increments.length - 1];
    if (!increment) throw notFound("Increment");
    const planned = store.plannedLevel();
    const iterIds = new Set(increment.iterations.map((i) => i.id));
    const items = ws.items.filter((i) => i.level === planned && (i.iterationId === undefined || iterIds.has(i.iterationId)));
    const itemIds = new Set(items.map((i) => i.id));
    const deps = ws.dependencies.filter((d) => itemIds.has(d.providerId) || itemIds.has(d.consumerId));
    return {
      today: store.now().toISOString().slice(0, 10),
      increment,
      increments: ws.increments.map((i) => ({ id: i.id, name: i.name })),
      plannedLevel: planned,
      teams: ws.teams,
      items,
      load: teamLoad(ws.items, ws.teams, increment, planned),
      dependencies: deps,
      dependencyChecks: checkDependencies(deps, ws.items, ws.increments),
      readiness: planningReadiness({ increment, teams: ws.teams, items, plannedLevel: planned }),
      objectives: ws.objectives.filter((o) => o.incrementId === increment.id),
      risks: ws.risks,
    };
  });

  app.patch(
    "/v1/items/:id",
    {
      schema: {
        params: z.object({ id: Id }),
        body: z.object({
          title: z.string().min(1).max(255).optional(),
          iterationId: z.string().nullable().optional(),
          teamId: z.string().optional(),
          estimate: z.number().min(0).nullable().optional(),
          businessValue: z.number().min(0).max(100).nullable().optional(),
          aiInitiativeId: z.string().nullable().optional(),
        }),
      },
    },
    async (req) => {
      const item = findItem(req.params.id);
      const b = req.body;
      const ws = s().workspace;
      if (b.iterationId && !ws.increments.some((inc) => inc.iterations.some((i) => i.id === b.iterationId))) throw notFound("Iteration");
      if (b.teamId && !ws.teams.some((t) => t.id === b.teamId)) throw notFound("Team");
      if (b.teamId && item.source.system !== "native" && b.teamId !== item.teamId) {
        throw new ApiError(422, "TEAM_OWNED_BY_TRACKER", "Teams come from the tracker's project or area path. Move the item there.");
      }
      const next: Record<string, unknown> = { ...item };
      const changed: PushField[] = [];
      const base: Partial<Record<PushField, unknown>> = {};
      const apply = (field: keyof WorkItem, value: unknown, push?: PushField) => {
        if (value === undefined) return;
        if (value === null) delete next[field];
        else next[field] = value;
        if (push && item[field] !== (value ?? undefined)) {
          changed.push(push);
          base[push] = item[field];
        }
      };
      apply("title", b.title, "title");
      apply("iterationId", b.iterationId, "iterationId");
      apply("teamId", b.teamId);
      apply("estimate", b.estimate, "estimate");
      apply("businessValue", b.businessValue, "businessValue");
      apply("aiInitiativeId", b.aiInitiativeId);
      ws.items = ws.items.map((i) => (i.id === item.id ? (next as unknown as WorkItem) : i));
      if (item.source.system !== "native" && changed.length) s().pending.push({ itemId: item.id, fields: changed, at: store.now().toISOString(), base });
      return { item: next, pendingSync: item.source.system !== "native" ? changed : [] };
    },
  );

  app.post("/v1/dependencies", { schema: { body: z.object({ providerId: Id, consumerId: Id, note: z.string().max(500).optional() }) } }, async (req, reply) => {
    findItem(req.body.providerId);
    findItem(req.body.consumerId);
    if (req.body.providerId === req.body.consumerId) throw new ApiError(422, "SELF_DEPENDENCY", "An item cannot depend on itself.");
    const dep = { id: `d-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`, providerId: req.body.providerId, consumerId: req.body.consumerId, status: "open" as const, ...(req.body.note ? { note: req.body.note } : {}) };
    s().workspace.dependencies.push(dep);
    const [check] = checkDependencies([dep], s().workspace.items, s().workspace.increments);
    return reply.code(201).send({ dependency: dep, check });
  });
  app.delete("/v1/dependencies/:id", { schema: { params: z.object({ id: Id }) } }, async (req, reply) => {
    const before = s().workspace.dependencies.length;
    s().workspace.dependencies = s().workspace.dependencies.filter((d) => d.id !== req.params.id);
    if (s().workspace.dependencies.length === before) throw notFound("Dependency");
    return reply.code(204).send();
  });

  app.post("/v1/risks", { schema: { body: z.object({ title: z.string().min(1).max(300), groupId: z.string().optional(), itemIds: z.array(z.string()).default([]) }) } }, async (req, reply) => {
    const risk = { id: `r-${Date.now().toString(36)}`, title: req.body.title, roam: "unroamed" as const, itemIds: req.body.itemIds, raisedAt: store.now().toISOString(), ...(req.body.groupId ? { groupId: req.body.groupId } : {}) };
    s().workspace.risks.push(risk);
    return reply.code(201).send({ risk });
  });
  app.patch("/v1/risks/:id", { schema: { params: z.object({ id: Id }), body: z.object({ roam: z.enum(["unroamed", "resolved", "owned", "accepted", "mitigated"]).optional(), ownerId: z.string().optional() }) } }, async (req) => {
    const risk = s().workspace.risks.find((r) => r.id === req.params.id);
    if (!risk) throw notFound("Risk");
    Object.assign(risk, defined(req.body));
    return { risk };
  });
  app.patch("/v1/objectives/:id", { schema: { params: z.object({ id: Id }), body: z.object({ actualValue: z.number().min(0).max(10).nullable() }) } }, async (req) => {
    const o = s().workspace.objectives.find((x) => x.id === req.params.id);
    if (!o) throw notFound("Objective");
    if (req.body.actualValue === null) delete o.actualValue;
    else o.actualValue = req.body.actualValue;
    return { objective: o };
  });

  // ---- metrics and dashboards ---------------------------------------------------------
  app.get("/v1/metrics", async () => ({ metrics: metrics.list().map(({ compute: _c, ...m }) => m) }));
  app.post("/v1/metrics/run", { schema: { body: z.object({ widgets: z.array(WidgetBody).max(50) }) } }, async (req) => ({
    outputs: req.body.widgets.map((w) => metrics.run(defined({ ...w, filters: w.filters ? defined(w.filters) : undefined }), store.metricContext())),
  }));
  app.get("/v1/dashboards", async () => ({ dashboards: s().dashboards }));
  app.get("/v1/dashboards/:id", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    const d = s().dashboards.find((x) => x.id === req.params.id);
    if (!d) throw notFound("Dashboard");
    return { dashboard: d, outputs: metrics.runDashboard(d, store.metricContext()) };
  });
  app.put("/v1/dashboards/:id", { schema: { params: z.object({ id: Id }), body: z.object({ name: z.string().min(1).max(80), widgets: z.array(WidgetBody).max(50) }) } }, async (req) => {
    const dashboard = { id: req.params.id, name: req.body.name, widgets: req.body.widgets.map((w) => defined({ ...w, filters: w.filters ? defined(w.filters) : undefined })) };
    const unknown = dashboard.widgets.filter((w) => !metrics.get(w.metric)).map((w) => w.metric);
    if (unknown.length) throw new ApiError(422, "UNKNOWN_METRIC", `Unknown metric: ${unknown.join(", ")}`);
    s().dashboards = [...s().dashboards.filter((d) => d.id !== dashboard.id), dashboard];
    return { dashboard };
  });
  app.delete("/v1/dashboards/:id", { schema: { params: z.object({ id: Id }) } }, async (req, reply) => {
    s().dashboards = s().dashboards.filter((d) => d.id !== req.params.id);
    return reply.code(204).send();
  });

  // ---- AI portfolio -------------------------------------------------------------------
  app.get("/v1/ai/meta", async () => ({
    stages: STAGES.map((k) => ({ key: k, label: STAGE_LABELS[k] })),
    evidence: EVIDENCE_KINDS.map((k) => ({ key: k, label: EVIDENCE_LABELS[k] })),
    autonomy: Object.entries(AUTONOMY_LABELS).map(([level, label]) => ({ level: Number(level), label })),
  }));
  app.get("/v1/ai/initiatives", async () => ({ initiatives: s().initiatives.map(initiativeView) }));
  app.get("/v1/ai/initiatives/:id", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    const i = findInitiative(req.params.id);
    return { initiative: initiativeView(i), items: s().workspace.items.filter((w) => w.aiInitiativeId === i.id), agents: s().agents.filter((a) => i.agentIds.includes(a.id)).map(agentView) };
  });
  app.post(
    "/v1/ai/initiatives",
    {
      schema: {
        body: z.object({
          name: z.string().min(1).max(120),
          problem: z.string().min(1).max(1000),
          useCase: z.enum(["assistant", "agent", "predictive", "classification", "generation", "other"]),
          riskTier: z.enum(["prohibited", "high", "limited", "minimal"]),
          ownerId: Id,
          oversight: z.enum(["in-the-loop", "on-the-loop", "out-of-loop"]).default("in-the-loop"),
          monthlyBudget: z.number().min(0).default(0),
          currency: z.string().length(3).default("USD"),
        }),
      },
    },
    async (req, reply) => {
      if (!s().workspace.people.some((p) => p.id === req.body.ownerId)) throw new ApiError(422, "OWNER_NOT_A_PERSON", "The accountable owner must be a person in this workspace.");
      const now = store.now().toISOString();
      const initiative: Initiative = {
        id: `ai-${Date.now().toString(36)}`,
        ...req.body,
        stage: "idea",
        models: [],
        dataSources: [],
        evidence: [],
        evals: [],
        costs: [],
        kpis: [],
        agentIds: [],
        signOffs: [],
        stageHistory: [{ stage: "idea", at: now }],
      };
      s().initiatives.push(initiative);
      return reply.code(201).send({ initiative: initiativeView(initiative) });
    },
  );
  app.get("/v1/ai/initiatives/:id/gate", { schema: { params: z.object({ id: Id }), querystring: z.object({ to: StageEnum }) } }, async (req) => ({ gate: evaluateGate(findInitiative(req.params.id), req.query.to, gateCtx()) }));
  app.post("/v1/ai/initiatives/:id/advance", { schema: { params: z.object({ id: Id }), body: z.object({ to: StageEnum }) } }, async (req) => {
    const next = advance(findInitiative(req.params.id), req.body.to, gateCtx(), store.now().toISOString());
    return { initiative: initiativeView(replaceInitiative(next)) };
  });
  app.post("/v1/ai/initiatives/:id/evidence", { schema: { params: z.object({ id: Id }), body: z.object({ kind: z.enum(EVIDENCE_KINDS), url: z.string().url(), addedBy: Id }) } }, async (req) => {
    const i = findInitiative(req.params.id);
    const evidence = [...i.evidence.filter((e) => e.kind !== req.body.kind), { ...req.body, addedAt: store.now().toISOString() }];
    return { initiative: initiativeView(replaceInitiative({ ...i, evidence })) };
  });
  app.post("/v1/ai/initiatives/:id/sign-off", { schema: { params: z.object({ id: Id }), body: z.object({ stage: StageEnum, personId: Id }) } }, async (req) => {
    const i = findInitiative(req.params.id);
    const person = s().workspace.people.find((p) => p.id === req.body.personId);
    if (!person?.roles.includes("ai-value-architect")) throw new ApiError(403, "NOT_VALUE_ARCHITECT", "Only a person with the AI value architect role can sign off.");
    const signOffs = [...i.signOffs.filter((x) => x.stage !== req.body.stage), { stage: req.body.stage, by: person.id, role: "ai-value-architect", at: store.now().toISOString() }];
    return { initiative: initiativeView(replaceInitiative({ ...i, signOffs })) };
  });
  app.put(
    "/v1/ai/initiatives/:id/evals",
    { schema: { params: z.object({ id: Id }), body: z.object({ evals: z.array(z.object({ name: z.string().min(1), direction: z.enum(["min", "max"]), threshold: z.number(), latest: z.number().optional() })).max(30) }) } },
    async (req) => {
      const i = findInitiative(req.params.id);
      const at = store.now().toISOString();
      const evals = req.body.evals.map((e) => {
        const prev = i.evals.find((p) => p.name === e.name);
        const changed = e.latest !== undefined && e.latest !== prev?.latest;
        return defined({ ...e, measuredAt: changed ? at : prev?.measuredAt });
      });
      return { initiative: initiativeView(replaceInitiative({ ...i, evals })) };
    },
  );
  app.post(
    "/v1/ai/initiatives/:id/costs",
    { schema: { params: z.object({ id: Id }), body: z.object({ month: z.string().regex(/^\d{4}-\d{2}$/), category: z.enum(["inference", "training", "data", "people", "other"]), amount: z.number().min(0) }) } },
    async (req) => {
      const i = findInitiative(req.params.id);
      return { initiative: initiativeView(replaceInitiative({ ...i, costs: [...i.costs, req.body] })) };
    },
  );

  app.get("/v1/ai/agents", async () => ({ agents: s().agents.map(agentView) }));
  const AgentBody = z.object({
    name: z.string().min(1).max(80),
    purpose: z.string().min(1).max(500),
    teamId: z.string().optional(),
    initiativeId: z.string().optional(),
    accountableId: z.string().optional(),
    autonomy: Autonomy,
    tools: z.array(z.string()).default([]),
  });
  app.post("/v1/ai/agents", { schema: { body: AgentBody } }, async (req, reply) => {
    const agent: Agent = { id: `agent-${Date.now().toString(36)}`, status: "active", ...defined(req.body) };
    const issues = checkAgent(agent, s().model);
    if (issues.length) throw new ApiError(422, "AGENT_NOT_ALLOWED", "This agent breaks the operating model's AI rules.", issues);
    s().agents.push(agent);
    if (agent.initiativeId) {
      const i = s().initiatives.find((x) => x.id === agent.initiativeId);
      if (i) replaceInitiative({ ...i, agentIds: [...i.agentIds, agent.id] });
    }
    if (agent.teamId) s().workspace.teams = s().workspace.teams.map((t) => (t.id === agent.teamId ? { ...t, agentIds: [...t.agentIds, agent.id] } : t));
    return reply.code(201).send({ agent: agentView(agent) });
  });
  app.patch(
    "/v1/ai/agents/:id",
    { schema: { params: z.object({ id: Id }), body: z.object({ autonomy: Autonomy.optional(), accountableId: z.string().optional(), status: z.enum(["active", "paused", "retired"]).optional() }) } },
    async (req) => {
      const a = s().agents.find((x) => x.id === req.params.id);
      if (!a) throw notFound("Agent");
      const next = { ...a, ...defined(req.body) };
      // Pausing or retiring is always allowed; anything else must stay within the rules.
      if (next.status === "active") {
        const issues = checkAgent(next, s().model);
        if (issues.length) throw new ApiError(422, "AGENT_NOT_ALLOWED", "This change breaks the operating model's AI rules.", issues);
      }
      s().agents = s().agents.map((x) => (x.id === a.id ? next : x));
      return { agent: agentView(next) };
    },
  );

  // ---- tracker sync -------------------------------------------------------------------
  app.get("/v1/sync", async () => ({ connectors: [...store.connectors.keys()], pending: s().pending }));
  app.post("/v1/sync/:system", { schema: { params: z.object({ system: z.enum(["jira", "ado"]) }), querystring: z.object({ dry_run: z.coerce.boolean().default(false) }) } }, async (req) => {
    const connector = store.connectors.get(req.params.system);
    if (!connector) throw new ApiError(409, "NOT_CONNECTED", `No ${req.params.system === "jira" ? "Jira" : "Azure DevOps"} connection is configured.`);
    const ws = s().workspace;
    const mine = ws.items.filter((i) => i.source.system === req.params.system);
    const pending = s().pending.filter((p) => mine.some((i) => i.id === p.itemId));
    const plan = planSync(mine, await connector.pull(), pending);
    if (!req.query.dry_run) {
      for (const change of plan.push) await connector.push(change);
      const missing = new Set(plan.missing);
      ws.items = [...ws.items.filter((i) => i.source.system !== req.params.system), ...plan.items, ...mine.filter((i) => missing.has(i.id))];
      const conflicted = new Set(plan.conflicts.map((c) => `${c.itemId}|${c.field}`));
      s().pending = s()
        .pending.map((p) => ({ ...p, fields: p.fields.filter((f) => !mine.some((i) => i.id === p.itemId) || conflicted.has(`${p.itemId}|${f}`)) }))
        .filter((p) => p.fields.length);
    }
    return { dryRun: req.query.dry_run, added: plan.added, updated: plan.updated, missing: plan.missing, pushed: plan.push.length, conflicts: plan.conflicts };
  });

  return app;
}
