// Outcomes across systems: sources (CSV or JSON rows from the CRM, finance, the learning
// platform, vendors, Jira), measures over them, objectives per entity, and the executive
// one-pager. Reads are open to every role; changes need "plan".

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { demoInsights, initiativeView, insightIssues, measureView, onePager, type Initiative, type DataSource, type Entity, type InsightsState, type Measure } from "@trainyard/core";
import { parseCsv } from "@trainyard/importers";
import { require } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Store } from "./store.js";
import type { Tenants } from "./tenants.js";
import { limitsFor, planLimitError, usageOf } from "./plans.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

const Id = z.string().min(1).max(80).regex(/^[A-Za-z0-9._:-]+$/, "letters, digits, . _ : - only");
const Kind = z.enum(["crm", "finance", "lms", "survey", "vendor", "jira", "other"]);
const MAX_ROWS = 20_000;

const SourceBody = z.object({
  id: Id.optional(),
  name: z.string().trim().min(1).max(120),
  kind: Kind,
  system: z.string().trim().max(80).default(""),
  periodField: z.string().trim().min(1).max(80),
  owner: z.string().trim().max(120).optional(),
  csv: z.string().max(8 * 1024 * 1024).optional(),
  rows: z.array(z.record(z.string().max(80), z.union([z.string().max(2000), z.number()]))).max(MAX_ROWS).optional(),
});

const Formula = z.union([
  z.object({ kind: z.literal("field"), sourceId: Id, field: z.string().min(1).max(80), aggregate: z.enum(["sum", "avg", "count", "latest"]), where: z.object({ field: z.string().min(1).max(80), in: z.array(z.string().max(200)).min(1).max(50) }).optional() }),
  z.object({ kind: z.enum(["ratio", "diff"]), a: Id, b: Id, scale: z.number().optional() }),
]);
const MeasureBody = z.object({
  name: z.string().trim().min(1).max(160),
  role: z.enum(["outcome", "kpi"]),
  formula: Formula,
  unit: z.string().max(12).default(""),
  decimals: z.number().int().min(0).max(4).optional(),
  higherIsBetter: z.boolean(),
  target: z.number().optional(),
  targetLabel: z.string().trim().max(80).optional(),
  rationale: z.string().trim().max(600).optional(),
});
const ObjectiveBody = z.object({ entityId: Id, title: z.string().trim().min(1).max(200), outcomeIds: z.array(Id).max(20), kpiIds: z.array(Id).max(30) });
const InitiativeBody = z.object({
  entityId: Id,
  name: z.string().trim().min(1).max(160),
  objectiveId: Id.optional(),
  kind: z.string().trim().max(60).optional(),
  owner: z.string().trim().max(120).optional(),
  status: z.enum(["proposed", "funded", "active", "closed"]),
  committed: z.number().min(0),
  currency: z.string().trim().min(1).max(8).default("USD"),
  funders: z.array(z.object({ name: z.string().trim().min(1).max(120), amount: z.number().min(0) })).max(30),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  spendMeasureId: Id.optional(),
  spentManual: z.number().min(0).optional(),
  outcomeIds: z.array(Id).max(20),
  notes: z.string().trim().max(1000).optional(),
});
const EntityBody = z.object({ name: z.string().trim().min(1).max(120), parentId: Id.optional() });

const clean = <T extends object>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

export function registerInsightRoutes(app: App, store: Store, tenants: Tenants) {
  const st = (): InsightsState => (store.state.insights ??= demoInsights(store.now().toISOString()));
  const s2 = () => store.state;
  const touch = () => (st().updatedAt = store.now().toISOString());
  const view = () => {
    const s = st();
    return {
      entities: s.entities,
      objectives: s.objectives,
      measures: s.measures,
      views: s.measures.map((m) => measureView(s, m.id)),
      sources: s.sources.map(({ rows, ...meta }) => ({ ...meta, rowCount: rows.length, preview: rows.slice(0, 5) })),
      initiatives: (s.initiatives ?? []).map((i) => initiativeView(s, i.id)),
      issues: insightIssues(s),
      updatedAt: s.updatedAt,
    };
  };

  app.get("/v1/insights", async () => view());

  app.get("/v1/insights/one-pager/:entityId", { schema: { params: z.object({ entityId: Id }) } }, async (req) => {
    if (!st().entities.some((e) => e.id === req.params.entityId)) throw notFound("Entity");
    return { onePager: onePager(st(), req.params.entityId) };
  });

  // A source: a CSV (header row) or JSON rows. The same id replaces the earlier load.
  app.post("/v1/insights/sources", { bodyLimit: 10 * 1024 * 1024, schema: { body: SourceBody } }, async (req, reply) => {
    require(req, "plan");
    const b = req.body;
    let rows: Record<string, string | number>[];
    if (b.csv !== undefined) {
      const parsed = parseCsv(b.csv);
      if (!parsed.headers.length) throw new ApiError(422, "EMPTY_CSV", "The CSV has no header row.");
      rows = parsed.rows.slice(0, MAX_ROWS).map((r) => Object.fromEntries(parsed.headers.map((h, i) => [h, r[i] ?? ""])));
    } else if (b.rows) rows = b.rows;
    else throw new ApiError(422, "NO_DATA", "Send the data as csv (with a header row) or as rows.");
    if (!rows.length) throw new ApiError(422, "NO_ROWS", "The source has no rows.");
    const fields = Object.keys(rows[0]!);
    if (!fields.includes(b.periodField)) throw new ApiError(422, "NO_PERIOD", `No column "${b.periodField}". Columns: ${fields.join(", ")}.`);
    const dated = rows.filter((r) => /^\d{4}-\d{2}/.test(String(r[b.periodField] ?? "").trim())).length;
    if (!dated) throw new ApiError(422, "BAD_PERIOD", `"${b.periodField}" holds no dates; use YYYY-MM or YYYY-MM-DD.`);
    const id = b.id ?? `src-${b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "data"}`;
    const src: DataSource = clean({ id, name: b.name, kind: b.kind, system: b.system, periodField: b.periodField, fields, rows, loadedAt: store.now().toISOString(), owner: b.owner }) as DataSource;
    const s = st();
    const existed = s.sources.some((x) => x.id === id);
    const record = tenants.record(req.principal.workspaceId);
    if (record && !existed) {
      const limit = limitsFor(record.plan, record.seats).sources;
      const current = usageOf(s2(), []).sources;
      if (limit !== null && current + 1 > limit) throw planLimitError(record, "sources", limit, current);
    }
    s.sources = existed ? s.sources.map((x) => (x.id === id ? src : x)) : [...s.sources, src];
    touch();
    await store.commit(req.principal, existed ? "insights.source.reload" : "insights.source.add", { id, rows: rows.length, skippedWithoutDate: rows.length - dated });
    return reply.code(existed ? 200 : 201).send({ source: { ...src, rows: undefined, rowCount: rows.length, preview: rows.slice(0, 5) }, skippedWithoutDate: rows.length - dated, ...view() });
  });

  app.delete("/v1/insights/sources/:id", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    require(req, "plan");
    const s = st();
    if (!s.sources.some((x) => x.id === req.params.id)) throw notFound("Source");
    const users = s.measures.filter((m) => m.formula.kind === "field" && m.formula.sourceId === req.params.id);
    if (users.length) throw new ApiError(409, "SOURCE_IN_USE", `Used by ${users.map((m) => m.name).join(", ")}. Change or remove those measures first.`);
    s.sources = s.sources.filter((x) => x.id !== req.params.id);
    touch();
    await store.commit(req.principal, "insights.source.delete", { id: req.params.id });
    return view();
  });

  app.put("/v1/insights/measures/:id", { schema: { params: z.object({ id: Id }), body: MeasureBody } }, async (req) => {
    require(req, "plan");
    const s = st();
    const f = req.body.formula;
    if (f.kind === "field") {
      const src = s.sources.find((x) => x.id === f.sourceId);
      if (!src) throw new ApiError(422, "UNKNOWN_SOURCE", `No source "${f.sourceId}".`);
      if (f.aggregate !== "count" && !src.fields.includes(f.field)) throw new ApiError(422, "UNKNOWN_FIELD", `${src.name} has no column "${f.field}".`);
    } else for (const ref of [f.a, f.b]) if (ref !== req.params.id && !s.measures.some((m) => m.id === ref)) throw new ApiError(422, "UNKNOWN_MEASURE", `No measure "${ref}".`);
    const m: Measure = clean({ id: req.params.id, ...req.body, formula: clean(f) as Measure["formula"] }) as Measure;
    const next = s.measures.some((x) => x.id === m.id) ? s.measures.map((x) => (x.id === m.id ? m : x)) : [...s.measures, m];
    const check = measureView({ sources: s.sources, measures: next }, m.id);
    if (check.error) throw new ApiError(422, "BAD_MEASURE", check.error);
    s.measures = next;
    touch();
    await store.commit(req.principal, "insights.measure.save", { id: m.id });
    return { measure: check, ...view() };
  });

  app.delete("/v1/insights/measures/:id", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    require(req, "plan");
    const s = st();
    if (!s.measures.some((x) => x.id === req.params.id)) throw notFound("Measure");
    const refs = s.measures.filter((m) => m.formula.kind !== "field" && (m.formula.a === req.params.id || m.formula.b === req.params.id));
    if (refs.length) throw new ApiError(409, "MEASURE_IN_USE", `${refs.map((m) => m.name).join(", ")} ${refs.length > 1 ? "are" : "is"} built from it.`);
    s.measures = s.measures.filter((x) => x.id !== req.params.id);
    s.objectives = s.objectives.map((o) => ({ ...o, outcomeIds: o.outcomeIds.filter((x) => x !== req.params.id), kpiIds: o.kpiIds.filter((x) => x !== req.params.id) }));
    touch();
    await store.commit(req.principal, "insights.measure.delete", { id: req.params.id });
    return view();
  });

  app.put("/v1/insights/objectives/:id", { schema: { params: z.object({ id: Id }), body: ObjectiveBody } }, async (req) => {
    require(req, "plan");
    const s = st();
    if (!s.entities.some((e) => e.id === req.body.entityId)) throw new ApiError(422, "UNKNOWN_ENTITY", `No entity "${req.body.entityId}".`);
    for (const id of [...req.body.outcomeIds, ...req.body.kpiIds]) if (!s.measures.some((m) => m.id === id)) throw new ApiError(422, "UNKNOWN_MEASURE", `No measure "${id}".`);
    const o = { id: req.params.id, ...req.body };
    s.objectives = s.objectives.some((x) => x.id === o.id) ? s.objectives.map((x) => (x.id === o.id ? o : x)) : [...s.objectives, o];
    touch();
    await store.commit(req.principal, "insights.objective.save", { id: o.id });
    return view();
  });

  app.delete("/v1/insights/objectives/:id", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    require(req, "plan");
    const s = st();
    if (!s.objectives.some((x) => x.id === req.params.id)) throw notFound("Objective");
    s.objectives = s.objectives.filter((x) => x.id !== req.params.id);
    touch();
    await store.commit(req.principal, "insights.objective.delete", { id: req.params.id });
    return view();
  });

  app.put("/v1/insights/initiatives/:id", { schema: { params: z.object({ id: Id }), body: InitiativeBody } }, async (req) => {
    require(req, "plan");
    const s = st();
    const b = req.body;
    if (!s.entities.some((e) => e.id === b.entityId)) throw new ApiError(422, "UNKNOWN_ENTITY", `No entity "${b.entityId}".`);
    if (b.objectiveId && !s.objectives.some((o) => o.id === b.objectiveId)) throw new ApiError(422, "UNKNOWN_OBJECTIVE", `No objective "${b.objectiveId}".`);
    for (const id of [...b.outcomeIds, ...(b.spendMeasureId ? [b.spendMeasureId] : [])]) if (!s.measures.some((m) => m.id === id)) throw new ApiError(422, "UNKNOWN_MEASURE", `No measure "${id}".`);
    if (b.start && b.end && b.end < b.start) throw new ApiError(422, "BAD_DATES", "The end date is before the start.");
    const i = clean({ id: req.params.id, ...b }) as Initiative;
    s.initiatives = (s.initiatives ?? []).some((x) => x.id === i.id) ? s.initiatives!.map((x) => (x.id === i.id ? i : x)) : [...(s.initiatives ?? []), i];
    touch();
    await store.commit(req.principal, "insights.initiative.save", { id: i.id, committed: i.committed });
    return { initiative: initiativeView(s, i.id), ...view() };
  });

  app.delete("/v1/insights/initiatives/:id", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    require(req, "plan");
    const s = st();
    if (!(s.initiatives ?? []).some((x) => x.id === req.params.id)) throw notFound("Initiative");
    s.initiatives = s.initiatives!.filter((x) => x.id !== req.params.id);
    touch();
    await store.commit(req.principal, "insights.initiative.delete", { id: req.params.id });
    return view();
  });

  app.put("/v1/insights/entities/:id", { schema: { params: z.object({ id: Id }), body: EntityBody } }, async (req) => {
    require(req, "plan");
    const s = st();
    if (req.body.parentId && !s.entities.some((e) => e.id === req.body.parentId)) throw new ApiError(422, "UNKNOWN_PARENT", `No entity "${req.body.parentId}".`);
    if (req.body.parentId === req.params.id) throw new ApiError(422, "SELF_PARENT", "An entity cannot sit under itself.");
    const e = clean({ id: req.params.id, name: req.body.name, parentId: req.body.parentId }) as Entity;
    s.entities = s.entities.some((x) => x.id === e.id) ? s.entities.map((x) => (x.id === e.id ? e : x)) : [...s.entities, e];
    touch();
    await store.commit(req.principal, "insights.entity.save", { id: e.id });
    return view();
  });

  // Back to the test data, or empty to start on real extracts.
  app.post("/v1/insights/reset", { schema: { body: z.object({ to: z.enum(["demo", "northstar", "empty"]) }) } }, async (req) => {
    require(req, "plan");
    const now = store.now().toISOString();
    store.state.insights = req.body.to === "empty" ? { entities: [{ id: "org", name: "Organisation (all entities)" }], sources: [], measures: [], objectives: [], updatedAt: now } : demoInsights(now, req.body.to === "northstar" ? "northstar" : "education");
    await store.commit(req.principal, "insights.reset", { to: req.body.to });
    return view();
  });
}
