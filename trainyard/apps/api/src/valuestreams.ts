// Value streams: identification workshops (operational value stream, systems, people,
// development value streams, ARTs) and value stream maps (active time, wait time and %C&A per
// step, current and future state). Reads are open to every role; writes need "plan".
// Each document is saved whole: the screens edit a copy and PUT it back with its version check
// done by the store's optimistic commit.

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { identificationIssues, mapMetrics, stepImpact, type ValueStreamIdentification, type ValueStreamMap } from "@trainyard/core";
import { require } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Store } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

const Id = z.string().min(1).max(120).regex(/^[A-Za-z0-9._:-]+$/, "letters, digits, . _ : - only");
const Name = z.string().trim().min(1).max(200);
const Ids = z.array(Id).max(200);

const Identification = z.object({
  id: Id,
  name: Name,
  trigger: z.string().max(200),
  value: z.string().max(200),
  steps: z.array(z.object({ id: Id, name: Name, actor: z.enum(["customer", "staff"]) })).max(40),
  systems: z.array(z.object({ id: Id, name: Name, note: z.string().max(200).optional(), stepIds: Ids })).max(60),
  groups: z.array(z.object({ id: Id, people: z.number().int().min(0).max(100_000), locations: z.string().max(200), systemIds: Ids })).max(100),
  devStreams: z.array(z.object({ id: Id, name: Name, systemIds: Ids })).max(30),
  arts: z.array(z.object({ id: Id, name: Name, people: z.number().int().min(0).max(100_000), locations: z.string().max(300), systemIds: Ids, devStreamId: Id.optional() })).max(60),
});

const Measure = z.object({ wait: z.number().min(0).max(1_000_000).nullable(), active: z.number().min(0).max(1_000_000), ca: z.number().min(0).max(100) });
const Map = z.object({
  id: Id,
  name: Name,
  identificationId: Id.optional(),
  devStreamId: Id.optional(),
  unit: z.enum(["hours", "days"]),
  trigger: z.string().max(200),
  steps: z.array(z.object({ id: Id, name: Name, current: Measure, future: Measure, kaizen: z.string().max(1000).optional() })).max(60),
});

/** References inside a workshop must point at things in the same workshop. */
function checkRefs(v: z.infer<typeof Identification>): string[] {
  const issues: string[] = [];
  const unique = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) issues.push(`${label} id "${id}" is used twice`);
      seen.add(id);
    }
    return seen;
  };
  const steps = unique("step", v.steps.map((s) => s.id));
  const systems = unique("system", v.systems.map((s) => s.id));
  unique("group", v.groups.map((g) => g.id));
  const streams = unique("development value stream", v.devStreams.map((d) => d.id));
  unique("ART", v.arts.map((a) => a.id));
  for (const s of v.systems) for (const x of s.stepIds) if (!steps.has(x)) issues.push(`${s.name} points at unknown step "${x}"`);
  for (const g of v.groups) for (const x of g.systemIds) if (!systems.has(x)) issues.push(`a people group points at unknown system "${x}"`);
  for (const d of v.devStreams) for (const x of d.systemIds) if (!systems.has(x)) issues.push(`${d.name} points at unknown system "${x}"`);
  for (const a of v.arts) {
    for (const x of a.systemIds) if (!systems.has(x)) issues.push(`${a.name} points at unknown system "${x}"`);
    if (a.devStreamId && !streams.has(a.devStreamId)) issues.push(`${a.name} points at unknown development value stream "${a.devStreamId}"`);
  }
  return issues;
}

export function registerValueStreamRoutes(app: App, store: Store) {
  const vs = () => (store.state.valueStreams ??= { identifications: [], maps: [] });
  const withIssues = (v: ValueStreamIdentification) => ({ ...v, issues: identificationIssues(v) });
  const withMetrics = (m: ValueStreamMap) => ({ ...m, metrics: { current: mapMetrics(m, "current"), future: mapMetrics(m, "future") } });

  app.get("/v1/value-streams", async () => ({
    identifications: vs().identifications.map(withIssues),
    maps: vs().maps.map(withMetrics),
  }));

  app.get("/v1/value-streams/identifications/:id/steps/:stepId", { schema: { params: z.object({ id: Id, stepId: Id }) } }, async (req) => {
    const v = vs().identifications.find((x) => x.id === req.params.id) ?? (() => { throw notFound("Value stream identification"); })();
    if (!v.steps.some((s) => s.id === req.params.stepId)) throw notFound("Step");
    return { impact: stepImpact(v, req.params.stepId) };
  });

  app.put("/v1/value-streams/identifications/:id", { schema: { params: z.object({ id: Id }), body: Identification } }, async (req) => {
    require(req, "plan");
    if (req.body.id !== req.params.id) throw new ApiError(400, "ID_MISMATCH", "The id in the body must match the URL.");
    const refs = checkRefs(req.body);
    if (refs.length) throw new ApiError(422, "BAD_REFERENCES", refs.join("; "), refs.map((message) => ({ message })));
    const doc: ValueStreamIdentification = { ...(req.body as ValueStreamIdentification), updatedAt: store.now().toISOString() };
    const exists = vs().identifications.some((x) => x.id === doc.id);
    vs().identifications = exists ? vs().identifications.map((x) => (x.id === doc.id ? doc : x)) : [...vs().identifications, doc];
    await store.commit(req.principal, exists ? "value-stream.identification.update" : "value-stream.identification.create", { id: doc.id, steps: doc.steps.length, arts: doc.arts.length });
    return { identification: withIssues(doc) };
  });

  app.put("/v1/value-streams/maps/:id", { schema: { params: z.object({ id: Id }), body: Map } }, async (req) => {
    require(req, "plan");
    if (req.body.id !== req.params.id) throw new ApiError(400, "ID_MISMATCH", "The id in the body must match the URL.");
    const ids = req.body.steps.map((s) => s.id);
    if (new Set(ids).size !== ids.length) throw new ApiError(422, "BAD_REFERENCES", "Every step needs its own id.");
    if (req.body.identificationId && !vs().identifications.some((x) => x.id === req.body.identificationId)) throw new ApiError(422, "BAD_REFERENCES", `No identification "${req.body.identificationId}".`);
    const doc: ValueStreamMap = { ...(req.body as ValueStreamMap), updatedAt: store.now().toISOString() };
    const exists = vs().maps.some((x) => x.id === doc.id);
    vs().maps = exists ? vs().maps.map((x) => (x.id === doc.id ? doc : x)) : [...vs().maps, doc];
    await store.commit(req.principal, exists ? "value-stream.map.update" : "value-stream.map.create", { id: doc.id, steps: doc.steps.length });
    return { map: withMetrics(doc) };
  });

  app.delete("/v1/value-streams/:kind/:id", { schema: { params: z.object({ kind: z.enum(["identifications", "maps"]), id: Id }) } }, async (req, reply) => {
    require(req, "plan");
    const list = vs()[req.params.kind] as { id: string }[];
    if (!list.some((x) => x.id === req.params.id)) throw notFound(req.params.kind === "maps" ? "Value stream map" : "Value stream identification");
    if (req.params.kind === "identifications") {
      vs().identifications = vs().identifications.filter((x) => x.id !== req.params.id);
      vs().maps = vs().maps.map((m) => (m.identificationId === req.params.id ? (({ identificationId: _i, devStreamId: _d, ...rest }) => rest)(m) : m));
    } else vs().maps = vs().maps.filter((x) => x.id !== req.params.id);
    await store.commit(req.principal, `value-stream.${req.params.kind === "maps" ? "map" : "identification"}.delete`, { id: req.params.id });
    return reply.code(204).send();
  });
}
