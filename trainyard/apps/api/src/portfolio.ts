import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;
import { z } from "zod";
import { EPIC_STATES, budgetLines, checkGuardrails, emptyPortfolio, okrProgress, rankEpics, wsjf, type MetricRegistry, type Okr, type PortfolioEpic, type ValueStream } from "@trainyard/core";
import { require } from "./auth.js";
import { ApiError, defined, notFound } from "./errors.js";
import type { Store } from "./store.js";

const Id = z.string().min(1).max(200);
const Money = z.number().min(0);
const WsjfBody = z.object({ userBusinessValue: z.number().min(0).max(100), timeCriticality: z.number().min(0).max(100), riskReductionOpportunity: z.number().min(0).max(100), jobSize: z.number().min(0).max(100) });
const SpendBody = z.array(z.object({ incrementId: Id, planned: Money, actual: Money.optional() })).max(50);
const KeyResultBody = z.object({
  id: Id.optional(),
  title: z.string().min(1).max(160),
  baseline: z.number(),
  target: z.number(),
  current: z.number().optional(),
  metric: z.object({ key: z.string(), filters: z.record(z.string(), z.unknown()).optional() }).optional(),
});

export function registerPortfolioRoutes(app: App, store: Store, metrics: MetricRegistry) {
  const s = () => store.state;
  const portfolio = () => {
    const p = s().workspace.portfolio;
    if (!p) throw new ApiError(409, "NO_PORTFOLIO", "This workspace has no portfolio yet. POST /v1/portfolio to create one.");
    return p;
  };
  /** Metric-linked key results read live values through the registry. */
  const readMetric = (key: string, filters?: Record<string, unknown>) => {
    const out = metrics.run({ id: "kr", title: "kr", metric: key, viz: "kpi", ...(filters ? { filters } : {}) }, store.metricContext());
    return "error" in out ? null : out.result.value;
  };

  app.get("/v1/portfolio", { schema: { querystring: z.object({ incrementId: z.string().optional() }) } }, async (req) => {
    const ws = s().workspace;
    const p = ws.portfolio;
    if (!p) return { portfolio: null };
    const increment = req.query.incrementId ? ws.increments.find((i) => i.id === req.query.incrementId) : ws.increments[ws.increments.length - 1];
    if (!increment) throw notFound("Increment");
    return {
      portfolio: p,
      increment: { id: increment.id, name: increment.name },
      epics: rankEpics(p.epics).map((e) => ({ ...e, score: wsjf(e.wsjf) })),
      doneEpics: p.epics.filter((e) => e.state === "done"),
      budgets: budgetLines(p, ws.increments),
      breaches: checkGuardrails(p, increment, ws.items),
      okrs: p.okrs.map((o) => okrProgress(o, readMetric)),
      epicStates: EPIC_STATES,
    };
  });

  app.post("/v1/portfolio", { schema: { body: z.object({ currency: z.string().length(3).default("USD") }) } }, async (req, reply) => {
    require(req, "portfolio");
    if (s().workspace.portfolio) throw new ApiError(409, "PORTFOLIO_EXISTS", "This workspace already has a portfolio.");
    s().workspace.portfolio = emptyPortfolio(req.body.currency);
    await store.commit(req.principal, "portfolio.create", { currency: req.body.currency });
    return reply.code(201).send({ portfolio: s().workspace.portfolio });
  });

  app.put(
    "/v1/portfolio/value-streams/:id",
    {
      schema: {
        params: z.object({ id: Id }),
        body: z.object({
          name: z.string().min(1).max(80),
          portfolioId: Id,
          budgets: z.record(z.string(), Money),
          guardrails: z.object({ minEnablerPercent: z.number().min(0).max(100).optional(), maxEpicBudgetPercent: z.number().min(0).max(100).optional(), businessCaseAbove: Money.optional() }),
          groupIds: z.array(Id),
        }),
      },
    },
    async (req) => {
      require(req, "portfolio");
      const p = portfolio();
      const ws = s().workspace;
      if (!ws.groups.some((g) => g.id === req.body.portfolioId)) throw notFound("Portfolio group");
      for (const gid of req.body.groupIds) if (!ws.groups.some((g) => g.id === gid)) throw notFound(`Group ${gid}`);
      const vs: ValueStream = { id: req.params.id, ...req.body, guardrails: defined(req.body.guardrails) };
      p.valueStreams = [...p.valueStreams.filter((v) => v.id !== vs.id), vs];
      await store.commit(req.principal, "portfolio.value-stream", { id: vs.id });
      return { valueStream: vs };
    },
  );

  const EpicBody = z.object({
    title: z.string().min(1).max(160),
    valueStreamId: Id,
    itemId: Id.nullable().optional(),
    state: z.enum(EPIC_STATES).optional(),
    ownerId: Id.nullable().optional(),
    hypothesis: z.string().max(2000).nullable().optional(),
    wsjf: WsjfBody,
    spend: SpendBody,
  });

  const validateEpic = (b: z.infer<typeof EpicBody>) => {
    const p = portfolio();
    const ws = s().workspace;
    if (!p.valueStreams.some((v) => v.id === b.valueStreamId)) throw notFound("Value stream");
    if (b.itemId && !ws.items.some((i) => i.id === b.itemId)) throw notFound("Work item");
    if (b.ownerId && !ws.people.some((x) => x.id === b.ownerId)) throw notFound("Person");
    for (const sp of b.spend) if (!ws.increments.some((i) => i.id === sp.incrementId)) throw notFound(`Increment ${sp.incrementId}`);
  };

  app.post("/v1/portfolio/epics", { schema: { body: EpicBody } }, async (req, reply) => {
    require(req, "portfolio");
    validateEpic(req.body);
    const { itemId, ownerId, hypothesis, state, spend, ...rest } = req.body;
    const epic: PortfolioEpic = {
      id: `pe-${Date.now().toString(36)}`,
      state: state ?? "funnel",
      ...rest,
      spend: spend.map((x) => defined(x)),
      ...(itemId ? { itemId } : {}),
      ...(ownerId ? { ownerId } : {}),
      ...(hypothesis ? { hypothesis } : {}),
    };
    portfolio().epics.push(epic);
    await store.commit(req.principal, "portfolio.epic.create", { id: epic.id });
    return reply.code(201).send({ epic: { ...epic, score: wsjf(epic.wsjf) } });
  });

  app.patch("/v1/portfolio/epics/:id", { schema: { params: z.object({ id: Id }), body: EpicBody.partial() } }, async (req) => {
    require(req, "portfolio");
    const p = portfolio();
    const epic = p.epics.find((e) => e.id === req.params.id);
    if (!epic) throw notFound("Epic");
    const merged = { ...epic, ...defined(req.body), ...(req.body.spend ? { spend: req.body.spend.map((x) => defined(x)) } : {}) } as PortfolioEpic & { itemId?: string | null; ownerId?: string | null; hypothesis?: string | null };
    validateEpic({ ...merged, itemId: merged.itemId ?? undefined, ownerId: merged.ownerId ?? undefined, hypothesis: merged.hypothesis ?? undefined });
    for (const k of ["itemId", "ownerId", "hypothesis"] as const) if (merged[k] === null) delete merged[k];
    const next = merged as PortfolioEpic;
    p.epics = p.epics.map((e) => (e.id === next.id ? next : e));
    await store.commit(req.principal, "portfolio.epic.update", { id: next.id, ...defined(req.body) });
    return { epic: { ...next, score: wsjf(next.wsjf) } };
  });

  app.put(
    "/v1/portfolio/okrs/:id",
    {
      schema: {
        params: z.object({ id: Id }),
        body: z.object({
          title: z.string().min(1).max(160),
          level: z.enum(["portfolio", "group", "team"]),
          ownerGroupId: Id.optional(),
          ownerId: Id.optional(),
          incrementId: Id.optional(),
          keyResults: z.array(KeyResultBody).min(1).max(10),
        }),
      },
    },
    async (req) => {
      require(req, "portfolio");
      const p = portfolio();
      const ws = s().workspace;
      if (req.body.ownerId && !ws.people.some((x) => x.id === req.body.ownerId)) throw notFound("Person");
      if (req.body.incrementId && !ws.increments.some((i) => i.id === req.body.incrementId)) throw notFound("Increment");
      for (const kr of req.body.keyResults) if (kr.metric && !metrics.get(kr.metric.key)) throw new ApiError(422, "UNKNOWN_METRIC", `Unknown metric "${kr.metric.key}".`);
      const okr: Okr = {
        id: req.params.id,
        ...defined(req.body),
        keyResults: req.body.keyResults.map((kr, n) => defined({ ...kr, id: kr.id ?? `${req.params.id}-kr${n + 1}`, metric: kr.metric ? defined(kr.metric) : undefined })),
      };
      p.okrs = [...p.okrs.filter((o) => o.id !== okr.id), okr];
      await store.commit(req.principal, "portfolio.okr", { id: okr.id });
      return { okr: okrProgress(okr, readMetric) };
    },
  );

  app.delete("/v1/portfolio/okrs/:id", { schema: { params: z.object({ id: Id }) } }, async (req, reply) => {
    require(req, "portfolio");
    const p = portfolio();
    const before = p.okrs.length;
    p.okrs = p.okrs.filter((o) => o.id !== req.params.id);
    if (p.okrs.length === before) throw notFound("OKR");
    await store.commit(req.principal, "portfolio.okr.delete", { id: req.params.id });
    return reply.code(204).send();
  });
}
