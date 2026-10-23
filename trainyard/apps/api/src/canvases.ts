// SAFe canvases: LACE mission, portfolio canvas (current and future), SWOT, TOWS, portfolio
// vision, development value stream and ART canvases, ART launch readiness, epic hypothesis,
// Lean business case, feature and enabler canvases. Reads are open; writes need "plan".

import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  CANVAS_TYPES,
  artCanvasFrom,
  canvasChevrons,
  canvasType,
  dvsCanvasFrom,
  emptyCanvas,
  epicsFromFutureState,
  futureOptions,
  futureStateFrom,
  launchReadiness,
  optionScore,
  DECISION_CRITERIA,
  towsSuggestions,
  wsjfOf,
  type Canvas,
  type CanvasTypeId,
  type PortfolioEpic,
} from "@trainyard/core";
import { require } from "./auth.js";
import { ApiError, notFound } from "./errors.js";
import type { Store } from "./store.js";

type App = FastifyInstance<import("fastify").RawServerDefault, import("fastify").RawRequestDefaultExpression, import("fastify").RawReplyDefaultExpression, import("fastify").FastifyBaseLogger, ZodTypeProvider>;

const Id = z.string().min(1).max(120).regex(/^[A-Za-z0-9._:-]+$/, "letters, digits, . _ : - only");
const TypeId = z.enum(CANVAS_TYPES.map((t) => t.id) as [CanvasTypeId, ...CanvasTypeId[]]);
const Body = z.object({
  type: TypeId,
  title: z.string().trim().min(1).max(200),
  state: z.enum(["current", "future"]).optional(),
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "yyyy-mm-dd").optional(),
  links: z.object({ identificationId: Id.optional(), devStreamId: Id.optional(), artId: Id.optional(), sourceCanvasIds: z.array(Id).max(10).optional() }).optional(),
  fields: z.record(z.string().max(60), z.unknown()),
});

let seq = 0;
const newId = (p: string) => `${p}-${Date.now().toString(36)}${(seq++).toString(36)}`;

export function registerCanvasRoutes(app: App, store: Store) {
  const list = () => (store.state.canvases ??= []);
  const find = (id: string) => list().find((c) => c.id === id) ?? (() => { throw notFound("Canvas"); })();
  const vsiOf = (c: Canvas) => store.state.valueStreams?.identifications.find((v) => v.id === c.links?.identificationId) ?? store.state.valueStreams?.identifications[0];
  const view = (c: Canvas) => {
    const def = canvasType(c.type)!;
    const vsi = vsiOf(c);
    const chevrons = Object.fromEntries(def.sections.filter((s) => s.kind === "chevrons").map((s) => [s.key, canvasChevrons(c, vsi, s.chevrons ?? "operational")]));
    const wsjf = Object.fromEntries(def.sections.filter((s) => s.kind === "wsjf").map((s) => [s.key, wsjfOf(c.fields[s.key] as Record<string, string> | undefined)]));
    return { ...c, derived: { chevrons, wsjf, ...(c.type === "art-launch" ? { readiness: launchReadiness(c, store.now().toISOString()) } : {}) } };
  };
  const save = async (req: { principal: import("./auth.js").Principal }, c: Canvas, action: string) => {
    const exists = list().some((x) => x.id === c.id);
    store.state.canvases = exists ? list().map((x) => (x.id === c.id ? c : x)) : [...list(), c];
    await store.commit(req.principal, action, { id: c.id, type: c.type });
  };

  app.get("/v1/canvases", async () => ({ types: CANVAS_TYPES, canvases: list().map((c) => ({ id: c.id, type: c.type, title: c.title, state: c.state, asOf: c.asOf, updatedAt: c.updatedAt })) }));
  app.get("/v1/canvases/:id", { schema: { params: z.object({ id: Id }) } }, async (req) => ({ canvas: view(find(req.params.id)), type: canvasType(find(req.params.id).type) }));

  app.post("/v1/canvases", { schema: { body: z.object({ type: TypeId, title: z.string().trim().min(1).max(200).optional() }) } }, async (req, reply) => {
    require(req, "plan");
    const def = canvasType(req.body.type)!;
    const c = emptyCanvas(req.body.type, newId("canvas"), req.body.title ?? def.name, store.now().toISOString());
    await save(req, c, "canvas.create");
    return reply.code(201).send({ canvas: view(c) });
  });

  app.put("/v1/canvases/:id", { bodyLimit: 2 * 1024 * 1024, schema: { params: z.object({ id: Id }), body: Body } }, async (req) => {
    require(req, "plan");
    const def = canvasType(req.body.type)!;
    const unknown = Object.keys(req.body.fields).filter((k) => !def.sections.some((s) => s.key === k));
    if (unknown.length) throw new ApiError(422, "UNKNOWN_SECTIONS", `${def.name} has no section ${unknown.map((k) => `"${k}"`).join(", ")}.`);
    const prev = list().find((c) => c.id === req.params.id);
    const c: Canvas = {
      id: req.params.id,
      type: req.body.type,
      title: req.body.title,
      ...(req.body.state ? { state: req.body.state } : {}),
      ...(req.body.asOf ? { asOf: req.body.asOf } : prev?.asOf ? { asOf: prev.asOf } : {}),
      ...(req.body.links ? { links: req.body.links as NonNullable<Canvas["links"]> } : prev?.links ? { links: prev.links } : {}),
      ...(prev?.option ? { option: prev.option } : {}),
      fields: req.body.fields as Canvas["fields"],
      updatedAt: store.now().toISOString(),
    };
    await save(req, c, prev ? "canvas.update" : "canvas.create");
    return { canvas: view(c) };
  });

  app.delete("/v1/canvases/:id", { schema: { params: z.object({ id: Id }) } }, async (req, reply) => {
    require(req, "plan");
    find(req.params.id);
    store.state.canvases = list().filter((c) => c.id !== req.params.id);
    await store.commit(req.principal, "canvas.delete", { id: req.params.id });
    return reply.code(204).send();
  });

  app.post("/v1/canvases/from-identification", { schema: { body: z.object({ identificationId: Id, kind: z.enum(["dvs", "art"]), refId: Id }) } }, async (req, reply) => {
    require(req, "plan");
    const vsi = store.state.valueStreams?.identifications.find((v) => v.id === req.body.identificationId);
    if (!vsi) throw notFound("Value stream identification");
    let c: Canvas;
    try {
      c = req.body.kind === "dvs" ? dvsCanvasFrom(vsi, req.body.refId, newId("canvas-dvs"), store.now().toISOString()) : artCanvasFrom(vsi, req.body.refId, newId("canvas-art"), store.now().toISOString());
    } catch (e) {
      throw new ApiError(404, "NOT_FOUND", (e as Error).message);
    }
    await save(req, c, "canvas.create");
    return reply.code(201).send({ canvas: view(c) });
  });

  app.get("/v1/canvases/:id/tows-suggestions", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    const swot = find(req.params.id);
    if (swot.type !== "swot") throw new ApiError(422, "NOT_SWOT", "TOWS suggestions come from a SWOT canvas.");
    return { suggestions: towsSuggestions(swot) };
  });

  // ---- Envision the future state: explore possibilities, make decisions, identify epics ----

  const futureOf = (id: string) => {
    const c = find(id);
    if (c.type !== "portfolio-canvas" || c.state !== "future") throw new ApiError(422, "NOT_FUTURE_STATE", "Pick a future-state portfolio canvas.");
    return c;
  };
  const sourcesOf = (c: Canvas) => {
    const [currentId, towsId] = c.links?.sourceCanvasIds ?? [];
    return { current: currentId ? list().find((x) => x.id === currentId) : undefined, tows: towsId ? list().find((x) => x.id === towsId) : undefined };
  };
  const optionView = (c: Canvas) => ({ ...view(c), score: optionScore(c.option?.scores), changes: ((c.fields.changes as string[] | undefined) ?? []).filter((x) => typeof x === "string") });

  // Step 1, divergent: several candidate future states, one per emphasis, from the current canvas and a TOWS.
  app.post("/v1/canvases/options", { schema: { body: z.object({ currentId: Id, towsId: Id }) } }, async (req, reply) => {
    require(req, "plan");
    const current = find(req.body.currentId);
    const tows = find(req.body.towsId);
    if (current.type !== "portfolio-canvas" || current.state === "future") throw new ApiError(422, "NOT_PORTFOLIO_CANVAS", "Pick the current-state portfolio canvas.");
    if (tows.type !== "tows") throw new ApiError(422, "NOT_TOWS", "Pick a TOWS canvas.");
    const made = futureOptions(current, tows, [0, 1, 2, 3].map(() => newId("canvas-option")), store.now().toISOString());
    if (!made.length) throw new ApiError(422, "EMPTY_TOWS", "The TOWS canvas has no strategies yet; add some from the SWOT first.");
    // Replace unselected options explored earlier from the same pair; keep a chosen one.
    const stale = list().filter((c) => c.option && !c.option.selected && c.links?.sourceCanvasIds?.[0] === current.id && c.links?.sourceCanvasIds?.[1] === tows.id).map((c) => c.id);
    store.state.canvases = [...list().filter((c) => !stale.includes(c.id)), ...made];
    await store.commit(req.principal, "canvas.options", { from: current.id, tows: tows.id, options: made.map((c) => c.id) });
    return reply.code(201).send({ options: made.map(optionView), criteria: DECISION_CRITERIA });
  });

  // The whole picture for the Envision page: current canvases, TOWS, options with scores, the chosen one.
  app.get("/v1/canvases/envision", async () => {
    const options = list().filter((c) => c.type === "portfolio-canvas" && c.state === "future" && c.option);
    return {
      current: list().filter((c) => c.type === "portfolio-canvas" && c.state !== "future").map((c) => ({ id: c.id, title: c.title })),
      swot: list().filter((c) => c.type === "swot").map((c) => ({ id: c.id, title: c.title })),
      tows: list().filter((c) => c.type === "tows").map((c) => ({ id: c.id, title: c.title, strategies: ["so", "wo", "st", "wt"].reduce((n, k) => n + (((c.fields[k] as string[] | undefined) ?? []).length), 0) })),
      options: options.map(optionView),
      selected: options.find((c) => c.option?.selected)?.id ?? null,
      criteria: DECISION_CRITERIA,
      hasPortfolio: !!store.state.workspace.portfolio,
      valueStreams: store.state.workspace.portfolio?.valueStreams.map((v) => ({ id: v.id, name: v.name })) ?? [],
    };
  });

  // Step 2, convergent: score each option against the criteria, then select one.
  app.patch("/v1/canvases/:id/option", { schema: { params: z.object({ id: Id }), body: z.object({ scores: z.record(z.string().max(30), z.number().int().min(1).max(5)).optional(), rationale: z.string().max(1000).optional(), title: z.string().trim().min(1).max(200).optional(), changes: z.array(z.string().trim().min(1).max(300)).max(40).optional() }) } }, async (req) => {
    require(req, "plan");
    const c = futureOf(req.params.id);
    const opt = c.option ?? { emphasis: "custom" as const, quadrants: [] };
    const next: Canvas = { ...c, option: { ...opt, ...(req.body.scores ? { scores: { ...(opt.scores ?? {}), ...req.body.scores } } : {}), ...(req.body.rationale !== undefined ? { rationale: req.body.rationale } : {}) }, ...(req.body.title ? { title: req.body.title } : {}), fields: { ...c.fields, ...(req.body.changes ? { changes: req.body.changes } : {}) }, updatedAt: store.now().toISOString() };
    await save(req, next, "canvas.option");
    return { option: optionView(next) };
  });

  app.post("/v1/canvases/:id/select", { schema: { params: z.object({ id: Id }) } }, async (req, reply) => {
    require(req, "plan");
    const chosen = futureOf(req.params.id);
    const { current, tows } = sourcesOf(chosen);
    const now = store.now().toISOString();
    // One chosen future state per current canvas; the others stay as explored options.
    store.state.canvases = list().map((c) => (c.option && c.links?.sourceCanvasIds?.[0] === chosen.links?.sourceCanvasIds?.[0] ? { ...c, option: { ...c.option, selected: c.id === chosen.id }, updatedAt: now } : c));
    let vision: Canvas | undefined;
    if (current && tows) {
      // The vision draft follows the chosen option's changes rather than every TOWS strategy.
      const towsLike: Canvas = { ...tows, fields: { so: (chosen.fields.changes as string[]) ?? [], wo: [], st: [], wt: [] } };
      vision = futureStateFrom(current, towsLike, { canvas: "unused", vision: newId("canvas-vision") }, now).vision;
      vision.title = chosen.title.replace(/\s*\(future state.*\)$/i, "") + ": portfolio vision";
      vision.links = { sourceCanvasIds: [current.id, tows.id, chosen.id] };
      store.state.canvases = [...list().filter((c) => !(c.type === "portfolio-vision" && c.links?.sourceCanvasIds?.[2] === chosen.id)), vision];
    }
    await store.commit(req.principal, "canvas.select-future", { canvas: chosen.id, ...(vision ? { vision: vision.id } : {}) });
    return reply.code(200).send({ selected: optionView(find(chosen.id)), ...(vision ? { vision: view(vision) } : {}) });
  });

  // Step 3: the epics and enablers that get the portfolio there; drafts first, then creation.
  app.get("/v1/canvases/:id/epic-drafts", { schema: { params: z.object({ id: Id }) } }, async (req) => {
    const c = futureOf(req.params.id);
    const { current } = sourcesOf(c);
    const existing = new Set((store.state.workspace.portfolio?.epics ?? []).filter((e) => e.sourceCanvasId === c.id).map((e) => e.title));
    return { drafts: epicsFromFutureState(c, current).map((d) => ({ ...d, exists: existing.has(d.title) })) };
  });

  app.post("/v1/canvases/:id/epics", { schema: { params: z.object({ id: Id }), body: z.object({ epics: z.array(z.object({ title: z.string().trim().min(1).max(160), kind: z.enum(["business", "enabler"]), valueStreamId: Id, hypothesis: z.string().max(2000).optional() })).min(1).max(40) }) } }, async (req, reply) => {
    require(req, "portfolio");
    const c = futureOf(req.params.id);
    const p = store.state.workspace.portfolio;
    if (!p) throw new ApiError(409, "NO_PORTFOLIO", "Set the portfolio up first (Portfolio page), then identify its epics.");
    const made: PortfolioEpic[] = [];
    for (const e of req.body.epics) {
      if (!p.valueStreams.some((v) => v.id === e.valueStreamId)) throw notFound(`Value stream ${e.valueStreamId}`);
      const epic: PortfolioEpic = { id: `pe-${store.now().getTime().toString(36)}${(seq++).toString(36)}`, title: e.title, valueStreamId: e.valueStreamId, state: "funnel", kind: e.kind, sourceCanvasId: c.id, ...(e.hypothesis ? { hypothesis: e.hypothesis } : {}), wsjf: { userBusinessValue: 5, timeCriticality: 5, riskReductionOpportunity: e.kind === "enabler" ? 8 : 5, jobSize: 8 }, spend: [] };
      p.epics.push(epic);
      made.push(epic);
    }
    await store.commit(req.principal, "portfolio.epics.from-future-state", { canvas: c.id, epics: made.map((e) => e.id) });
    return reply.code(201).send({ epics: made });
  });

  app.post("/v1/canvases/future-state", { schema: { body: z.object({ currentId: Id, towsId: Id }) } }, async (req, reply) => {
    require(req, "plan");
    const current = find(req.body.currentId);
    const tows = find(req.body.towsId);
    if (current.type !== "portfolio-canvas") throw new ApiError(422, "NOT_PORTFOLIO_CANVAS", "Pick the current-state portfolio canvas.");
    if (tows.type !== "tows") throw new ApiError(422, "NOT_TOWS", "Pick a TOWS canvas.");
    const { canvas, vision } = futureStateFrom(current, tows, { canvas: newId("canvas-future"), vision: newId("canvas-vision") }, store.now().toISOString());
    store.state.canvases = [...list(), canvas, vision];
    await store.commit(req.principal, "canvas.future-state", { from: current.id, tows: tows.id, canvas: canvas.id, vision: vision.id });
    return reply.code(201).send({ canvas: view(canvas), vision: view(vision) });
  });
}
