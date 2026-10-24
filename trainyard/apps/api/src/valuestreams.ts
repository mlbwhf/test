// Value streams: identification workshops (operational value stream, systems, people,
// development value streams, ARTs) and value stream maps (active time, wait time and %C&A per
// step, current and future state). Reads are open to every role; writes need "plan".
// Each document is saved whole: the screens edit a copy and PUT it back with its version check
// done by the store's optimistic commit.

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { deriveMapFromHistory, historiesFromRows, identificationIssues, mapMetrics, stepImpact, suggestMapping, type ItemHistory, type MapStep, type StepStatusMapping, type ValueStreamIdentification, type ValueStreamMap , OVS_TYPES, ART_TOPOLOGIES, identificationFromType, type OvsType } from "@trainyard/core";
import { parseCsv } from "@trainyard/importers";
import { require } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Store } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

const Id = z.string().min(1).max(120).regex(/^[A-Za-z0-9._:-]+$/, "letters, digits, . _ : - only");
const Name = z.string().trim().min(1).max(200);
const Ids = z.array(Id).max(200);

const Short = z.string().max(300);
const Identification = z.object({
  id: Id,
  name: Name,
  type: z.string().max(60).optional(),
  description: z.string().max(600).optional(),
  customers: Short.optional(),
  trigger: Short,
  value: Short,
  valueToEnterprise: Short.optional(),
  valueToCustomer: Short.optional(),
  steps: z.array(z.object({ id: Id, name: Name, actor: z.enum(["customer", "staff"]), people: z.string().max(120).optional() })).max(40),
  systems: z.array(z.object({ id: Id, name: Name, note: z.string().max(200).optional(), stepIds: Ids })).max(60),
  groups: z.array(z.object({ id: Id, people: z.number().int().min(0).max(100_000), locations: z.string().max(200), function: z.string().max(60).optional(), systemIds: Ids, devStreamId: Id.optional() })).max(100),
  devStreams: z.array(z.object({ id: Id, name: Name, note: z.string().max(300).optional(), systemIds: Ids })).max(30),
  arts: z.array(z.object({ id: Id, name: Name, people: z.number().int().min(0).max(100_000), locations: z.string().max(300), systemIds: Ids, devStreamId: Id.optional(), topology: z.enum(["stream-aligned", "platform", "complicated-subsystem", "enabling"]).optional() })).max(60),
});
const OvsTypeBody = z.object({
  id: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/, "lowercase letters, digits and dashes"),
  name: Name,
  blurb: z.string().max(400),
  pattern: z.string().max(400).optional(),
  example: z
    .object({
      name: Name,
      description: z.string().max(600),
      customers: Short,
      trigger: Short,
      valueToEnterprise: Short,
      valueToCustomer: Short,
      steps: z.array(z.object({ name: Name, actor: z.enum(["customer", "staff"]), people: z.string().max(120).optional() })).max(40),
    })
    .optional(),
});

const Measure = z.object({ wait: z.number().min(0).max(1_000_000).nullable(), active: z.number().min(0).max(1_000_000), ca: z.number().min(0).max(100) });
const MapBody = z.object({
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
  for (const g of v.groups) {
    for (const x of g.systemIds) if (!systems.has(x)) issues.push(`a people group points at unknown system "${x}"`);
    if (g.devStreamId && !streams.has(g.devStreamId)) issues.push(`a people group points at unknown development value stream "${g.devStreamId}"`);
  }
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

  const ovsTypes = () => [...OVS_TYPES, ...(vs().ovsTypes ?? [])];
  app.get("/v1/value-streams", async () => ({
    identifications: vs().identifications.map(withIssues),
    maps: vs().maps.map(withMetrics),
    ovsTypes: ovsTypes(),
    topologies: ART_TOPOLOGIES,
  }));

  // Operational value stream types: four built in, the workspace adds its own.
  app.post("/v1/value-streams/ovs-types", { schema: { body: OvsTypeBody } }, async (req, reply) => {
    require(req, "plan");
    if (ovsTypes().some((t) => t.id === req.body.id)) throw new ApiError(409, "TYPE_EXISTS", `A type "${req.body.id}" already exists.`);
    const t: OvsType = {
      id: req.body.id,
      name: req.body.name,
      blurb: req.body.blurb,
      pattern: req.body.pattern ?? "",
      example: req.body.example
        ? { ...req.body.example, steps: req.body.example.steps.map((st) => ({ name: st.name, actor: st.actor, ...(st.people ? { people: st.people } : {}) })) }
        : { name: req.body.name, description: "", customers: "", trigger: "", valueToEnterprise: "", valueToCustomer: "", steps: [] },
    };
    (vs().ovsTypes ??= []).push(t);
    await store.commit(req.principal, "value-stream.type.create", { id: t.id });
    return reply.code(201).send({ type: t, ovsTypes: ovsTypes() });
  });
  app.delete("/v1/value-streams/ovs-types/:id", { schema: { params: z.object({ id: Id }) } }, async (req, reply) => {
    require(req, "plan");
    if (OVS_TYPES.some((t) => t.id === req.params.id)) throw new ApiError(422, "BUILTIN_TYPE", "Built-in types stay; add your own beside them.");
    const before = vs().ovsTypes?.length ?? 0;
    vs().ovsTypes = (vs().ovsTypes ?? []).filter((t) => t.id !== req.params.id);
    if ((vs().ovsTypes?.length ?? 0) === before) throw notFound("Value stream type");
    await store.commit(req.principal, "value-stream.type.delete", { id: req.params.id });
    return reply.code(204).send();
  });

  // A new identification seeded from a type's example.
  app.post("/v1/value-streams/identifications/from-type", { schema: { body: z.object({ typeId: z.string().max(60), name: Name.optional() }) } }, async (req, reply) => {
    require(req, "plan");
    const t = ovsTypes().find((x) => x.id === req.body.typeId);
    if (!t) throw notFound("Value stream type");
    const v = identificationFromType(t, `vsi-${Date.now().toString(36)}`, store.now().toISOString(), req.body.name);
    vs().identifications.push(v);
    await store.commit(req.principal, "value-stream.identification.create", { id: v.id, type: t.id });
    return reply.code(201).send({ identification: withIssues(v) });
  });

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

  app.put("/v1/value-streams/maps/:id", { schema: { params: z.object({ id: Id }), body: MapBody } }, async (req) => {
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

  // Calculate a map's current state from status history: a CSV of (item, status, timestamp)
  // rows from any Kanban tool, or Jira / Azure DevOps through the connected tracker.
  const Mapping = z.array(z.object({ name: Name, wait: z.array(z.string().max(120)).max(30), active: z.array(z.string().max(120)).max(30) })).max(60);
  app.post(
    "/v1/value-streams/maps/:id/derive",
    {
      bodyLimit: 16 * 1024 * 1024,
      schema: {
        params: z.object({ id: Id }),
        body: z.object({
          source: z.enum(["csv", "jira", "ado"]),
          csv: z.string().max(15_000_000).optional(),
          query: z.string().max(2000).optional(),
          limit: z.number().int().min(1).max(2000).optional(),
          mapping: Mapping.optional(),
          stat: z.enum(["median", "mean", "p85"]).optional(),
          since: z.string().max(40).optional(),
          until: z.string().max(40).optional(),
          apply: z.boolean().optional(),
          /** With apply: drop the map's steps the mapping does not cover. */
          replace: z.boolean().optional(),
        }),
      },
    },
    async (req) => {
      // Reading through the workspace's Jira or Azure DevOps connection, or parsing a large
      // export, is for planners; viewers read the maps that result.
      require(req, "plan");
      const map = vs().maps.find((m) => m.id === req.params.id) ?? (() => { throw notFound("Value stream map"); })();
      let histories: ItemHistory[];
      if (req.body.source === "csv") {
        if (!req.body.csv) throw new ApiError(400, "NO_CSV", "Upload the CSV of status changes.");
        const { headers, rows } = parseCsv(req.body.csv);
        const col = (...names: string[]) => headers.findIndex((h) => names.includes(h.trim().toLowerCase()));
        const item = col("item", "key", "id", "issue", "issue key", "work item", "card", "ticket");
        const status = col("status", "to", "to status", "state", "new status", "column", "stage");
        const at = col("at", "date", "timestamp", "time", "changed", "changed at", "created", "entered", "moved at");
        const title = col("title", "summary", "name");
        if (item < 0 || status < 0 || at < 0) throw new ApiError(422, "CSV_COLUMNS", `The CSV needs item, status and timestamp columns; found ${headers.join(", ")}.`);
        histories = historiesFromRows(rows.map((r) => ({ item: r[item] ?? "", status: r[status] ?? "", at: r[at] ?? "", ...(title >= 0 && r[title] ? { title: r[title]! } : {}) })));
      } else {
        const conn = store.connectors.get(req.body.source);
        if (!conn?.statusHistory) throw new ApiError(409, "NOT_CONNECTED", `${req.body.source === "jira" ? "Jira" : "Azure DevOps"} is not connected on this server. Set it up under Jira & Azure DevOps, or upload a CSV.`);
        try {
          histories = await conn.statusHistory({ ...(req.body.query ? { query: req.body.query } : {}), ...(req.body.limit ? { limit: req.body.limit } : {}) });
        } catch (e) {
          throw new ApiError(502, "TRACKER_FAILED", (e as Error).message);
        }
      }
      if (!histories.length) throw new ApiError(422, "NO_HISTORY", "No status changes found.");
      const mapping: StepStatusMapping[] = req.body.mapping ?? suggestMapping(histories);
      const derived = deriveMapFromHistory(histories, mapping, { unit: map.unit, ...(req.body.stat ? { stat: req.body.stat } : {}), ...(req.body.since ? { since: req.body.since } : {}), ...(req.body.until ? { until: req.body.until } : {}) });
      const statuses = [...new Set(histories.flatMap((h) => h.changes.map((c) => c.status)))];
      if (!req.body.apply) return { mapping, derived, statuses, items: histories.length };

      // Apply: matching steps (by name) take the derived current state; new steps are added
      // with the same numbers as their future state until someone sets a target.
      const key = (s: string) => s.trim().toLowerCase();
      const byName = new Map(map.steps.map((s) => [key(s.name), s]));
      const steps: MapStep[] = derived.steps.map((d, i) => {
        const prev = byName.get(key(d.name));
        return prev ? { ...prev, current: d.measure } : { id: `derived-${i + 1}-${key(d.name).replace(/[^a-z0-9]+/g, "-")}`, name: d.name, current: d.measure, future: { ...d.measure } };
      });
      const kept = req.body.replace ? [] : map.steps.filter((s) => !derived.steps.some((d) => key(d.name) === key(s.name)));
      const next: ValueStreamMap = { ...map, steps: [...steps, ...kept], updatedAt: store.now().toISOString() };
      vs().maps = vs().maps.map((m) => (m.id === map.id ? next : m));
      await store.commit(req.principal, "value-stream.map.derive", { id: map.id, source: req.body.source, items: derived.items, steps: derived.steps.length });
      return { mapping, derived, statuses, items: histories.length, map: withMetrics(next) };
    },
  );

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
